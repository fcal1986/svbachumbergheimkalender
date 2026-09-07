// scripts/fussballde-sync.mjs
//
// Holt die Heimspiele des Vereins und schreibt sie nach data/fussballde.json.
// Versucht dabei mehrere Strategien der Reihe nach (die erste, die konfiguriert
// ist UND funktioniert, gewinnt):
//
//   A) api-fussball.de (Drittanbieter-JSON-API) – nur wenn "apiToken" konfiguriert ist.
//      ACHTUNG: Das zugehörige GitHub-Projekt ist als "nicht mehr aktiv gepflegt,
//      kein Support" archiviert. Sauber, wenn es läuft – aber ohne Garantie, dass
//      es das noch lange tut. Deshalb nur EINE von mehreren Strategien, nicht die
//      einzige Grundlage.
//   B) fussball.de XML-Export pro Mannschaft ("mime-type/XML") – nur wenn "teams"
//      (Liste von Team-IDs) konfiguriert ist. Historisch dokumentierter Parameter;
//      liefert Rohdaten ohne clientseitiges Angular-Rendering, dadurch potenziell
//      robuster als die HTML-Variante.
//   C) fussball.de Vereins-HTML-Spielplan ("ajax.club.matchplan") – immer als
//      letzter Fallback, mit ausführlichem Debug-Logging bei 0 Treffern.
//
// Bitte Nutzungsbedingungen von fussball.de beachten. Nur für den internen,
// nicht-kommerziellen Vereinsgebrauch, mit moderater Abruffrequenz (alle 6h).
//
// Aufruf: node scripts/fussballde-sync.mjs [--debug]

import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

const CONFIG_PATH = 'data/config.json';
const OUTPUT_PATH = 'data/fussballde.json';

async function loadConfig() {
  const raw = await fs.readFile(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

// Entfernt unsichtbare Zeichen, die fussball.de zum Umbruch von "Bachum/Bergheim"
// einstreut (Zero-Width-Space etc.), damit Namen sauber angezeigt werden.
function cleanText(s) {
  return (s || '').replace(/[\u200B\u200C\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

// Extrahiert Spiele aus dem HTML-Fragment des Vereins-Spielplans.
// Diese Route liefert die Spielplan-Tabelle für ALLE Mannschaften des Vereins
// und ist ohne Login öffentlich erreichbar:
//   https://www.fussball.de/ajax.club.matchplan/-/id/<CLUB_ID>/mode/PAGE/show-filter/true
// Jede Zeile enthält Datum/Zeit, eine Spalte "Mannschaft | Wettbewerb"
// (z.B. "Herren | Kreisliga A") und zwei Team-Links (Heim zuerst, dann Gast).
function parseMatches(html, debug) {
  const $ = cheerio.load(html);
  const matches = [];
  const rows = $('tr');
  let rowsWithDate = 0, rowsWithTwoTeamLinks = 0;

  rows.each((_, row) => {
    const $row = $(row);
    const rowText = $row.text().replace(/\s+/g, ' ').trim();
    if (!rowText) return;

    // Datum, z.B. "12.09.26" oder "12.09.2026" (Zeilen ohne Datum sind Überschriften/Trenner)
    const dateMatch = rowText.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
    if (!dateMatch) return;
    rowsWithDate++;
    const timeMatch = rowText.match(/(\d{1,2}):(\d{2})(?:\s*Uhr)?/);

    // Team-Links: erster = Heim, zweiter = Gast (fussball.de-Konvention)
    const teamLinks = $row.find('a[href*="/mannschaft/"]');
    if (teamLinks.length < 2) {
      // Freundschaftsspiele ohne festen Gegner ("FS | <id>") sind erwartbar und uninteressant fürs Debuggen –
      // die wollen wir hier NICHT geloggt haben. Interessant sind Zeilen mit einer echten Liga/Pokal-Bezeichnung,
      // die trotzdem keine 2 Team-Links haben – die zeigen uns die tatsächliche Struktur echter Spiele.
      const looksLikeRealCompetition = !/freundschaftsspiel/i.test(rowText);
      if (debug && looksLikeRealCompetition && rowsWithDate <= 10) {
        console.log(`  [debug] Echtes Spiel(?) mit Datum, aber nur ${teamLinks.length} Team-Link(s): "${rowText.slice(0, 160)}"`);
        console.log(`  [debug] Rohes HTML dieser Zeile:\n${$.html($row).slice(0, 2000)}`);
      }
      return;
    }
    rowsWithTwoTeamLinks++;
    const home = cleanText($(teamLinks[0]).text());
    const away = cleanText($(teamLinks[1]).text());
    if (!home || !away) return;

    // "Mannschaft | Wettbewerb"-Zelle finden, z.B. "Herren | Kreisliga A"
    let ownTeam = '', competition = '';
    $row.find('td').each((_, td) => {
      const t = cleanText($(td).text());
      if (!t || t.match(/\d{2}\.\d{2}\.\d{2,4}/) || t.match(/^\d{1,2}:\d{2}/) || t.length > 60) return;
      if (!ownTeam && !competition) {
        const parts = t.split('|').map(s => s.trim());
        ownTeam = parts[0] || '';
        competition = parts[1] || parts[0] || '';
      }
    });

    const matchLink = $row.find('a[href*="/spiel/"]').first().attr('href') || '';
    const yy = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
    const iso = `${yy}-${dateMatch[2]}-${dateMatch[1]}`;

    matches.push({
      date: iso,
      time: timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : null,
      home, away, ownTeam, competition,
      link: matchLink ? new URL(matchLink, 'https://www.fussball.de').toString() : null,
    });
  });

  if (debug) {
    console.log(`  [debug] <tr>-Zeilen gesamt: ${rows.length} | mit erkanntem Datum: ${rowsWithDate} | mit 2 Team-Links: ${rowsWithTwoTeamLinks} | daraus geparste Spiele: ${matches.length}`);
    // Alle Link-Ziel-Muster im Dokument sammeln (zeigt, wie Team-/Spiel-Links wirklich aussehen)
    const hrefPatterns = new Set();
    $('a[href]').each((_, a) => {
      const href = $(a).attr('href') || '';
      const pattern = href.replace(/[a-z0-9-]{10,}/gi, '…').split('?')[0];
      hrefPatterns.add(pattern);
    });
    console.log(`  [debug] ${$('a[href]').length} <a>-Links insgesamt gefunden. Muster: ${[...hrefPatterns].slice(0, 15).join(' | ')}`);
    // Wo genau stecken die team-id-Links? (Filter-Dropdown vs. echte Spielzeile)
    const teamIdLinks = $('a[href*="team-id"]');
    if (teamIdLinks.length) {
      const first = teamIdLinks.first();
      const parentTr = first.closest('tr');
      console.log(`  [debug] Erster team-id-Link: Text="${cleanText(first.text())}" href="${first.attr('href')}"`);
      console.log(`  [debug] Steckt er in einer <tr>? ${parentTr.length ? 'JA' : 'NEIN'}. Nächstgelegenes Elternelement:\n${$.html(first.closest('tr,ul,div').first()).slice(0, 800)}`);
    } else {
      console.log('  [debug] Keine team-id-Links im gesamten Dokument gefunden.');
    }
    // Alle Zeilen mit einer echten Wettbewerbs-Bezeichnung (nicht Freundschaftsspiel) auflisten
    const compRows = rows.filter((_, r) => {
      const t = $(r).text();
      return /kreisliga|kreispokal|bezirksliga|verbandsliga|landesliga/i.test(t);
    });
    console.log(`  [debug] Zeilen mit echter Liga-/Pokal-Bezeichnung: ${compRows.length}`);
    compRows.slice(0, 2).each((_, r) => console.log(`  [debug] Beispielzeile:\n${$.html($(r)).slice(0, 2000)}`));
    // Hinweise auf clientseitig nachgeladene Daten (AngularJS/JSON) suchen
    const jsonScripts = $('script').filter((_, s) => {
      const type = ($(s).attr('type') || '').toLowerCase();
      const content = $(s).html() || '';
      return type.includes('json') || /matchplan|fixtures|matches\s*[:=]\s*\[/i.test(content);
    });
    console.log(`  [debug] Mögliche eingebettete Daten-<script>-Tags: ${jsonScripts.length}`);
    jsonScripts.each((i, s) => { if (i < 2) console.log(`  [debug] Script-Ausschnitt: ${($(s).html() || '').slice(0, 400)}`); });
  }

  return matches;
}

// Erkennt typische Anzeichen, dass wir statt der echten Seite eine Bot-Schutz-
// / Cookie-Consent- / Fehlerseite bekommen haben (häufigste Ursache für "0 Spiele
// gefunden" ohne HTTP-Fehler).
function looksLikeBlockedOrEmptyPage(html) {
  const lower = html.toLowerCase();
  const signals = ['captcha', 'cloudflare', 'access denied', 'just a moment', 'consent', 'cookie-einstellungen', 'bot detection', 'request unsuccessful'];
  return signals.some(s => lower.includes(s));
}

async function fetchClubMatches(clubId, debug) {
  const url = `https://www.fussball.de/ajax.club.matchplan/-/id/${clubId}/mode/PAGE/show-filter/true`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://www.fussball.de/',
    },
  });
  const html = await res.text();
  if (debug) {
    console.log(`  [debug] HTTP-Status: ${res.status} | Antwortlänge: ${html.length} Zeichen`);
    console.log(`  [debug] Erste 300 Zeichen der Antwort:\n${html.slice(0, 300).replace(/\n/g, ' ')}`);
  }
  if (!res.ok) throw new Error(`fussball.de antwortete mit ${res.status} für Verein ${clubId}`);
  if (looksLikeBlockedOrEmptyPage(html)) {
    console.warn('  [warnung] Antwort sieht nach Bot-Schutz-/Consent-/Fehlerseite aus, nicht nach der echten Spielplan-Tabelle.');
  }
  return parseMatches(html, debug);
}

function isHomeMatch(match, clubMatch) {
  return match.home.toLowerCase().includes(clubMatch.toLowerCase());
}

/* ---------- Strategie A: api-fussball.de (Drittanbieter-JSON-API) ---------- */
// Dokumentation: https://github.com/api-fussball/docs (Projekt ist archiviert/unmaintained –
// deshalb bewusst nur EINE von mehreren Strategien, siehe Kopfkommentar).
async function fetchViaApiFussballDe(clubId, apiToken, debug) {
  const url = `https://api-fussball.de/api/club/next_games/${clubId}`;
  const res = await fetch(url, { headers: { 'x-auth-token': apiToken, 'Accept': 'application/json' } });
  const text = await res.text();
  if (debug) console.log(`  [debug/A] api-fussball.de HTTP-Status: ${res.status} | Antwort (erste 500 Zeichen): ${text.slice(0, 500)}`);
  if (!res.ok) throw new Error(`api-fussball.de antwortete mit ${res.status}`);
  const data = JSON.parse(text);
  // Erwartete Form ist nicht offiziell spezifiziert (Doku zeigt kein Response-Beispiel) –
  // wir versuchen daher mehrere plausible Feldnamen, statt uns auf eine Struktur zu verlassen.
  const list = Array.isArray(data) ? data : (data.games || data.matches || data.data || []);
  return list.map(g => ({
    date: (g.date || g.datum || g.kickoff || '').slice(0, 10),
    time: g.time || g.zeit || (g.kickoff ? g.kickoff.slice(11, 16) : null),
    home: cleanText(g.homeTeam || g.heim || g.home || ''),
    away: cleanText(g.awayTeam || g.gast || g.away || ''),
    ownTeam: cleanText(g.team || g.mannschaft || ''),
    competition: cleanText(g.competition || g.wettbewerb || g.liga || ''),
    link: g.link || g.url || null,
  })).filter(m => m.date && m.home && m.away);
}

/* ---------- Strategie B: fussball.de XML-Export pro Mannschaft ---------- */
function parseMatchplanXml(xml, debug) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const matches = [];
  $('spiel, match, Spiel, Match').each((_, el) => {
    const $el = $(el);
    const text = (tag) => cleanText($el.find(tag).first().text());
    const date = text('datum') || text('date') || $el.attr('datum') || $el.attr('date') || '';
    const time = text('uhrzeit') || text('zeit') || text('time') || $el.attr('uhrzeit') || '';
    const home = text('heim') || text('heimmannschaft') || text('hometeam') || text('home');
    const away = text('gast') || text('gastmannschaft') || text('awayteam') || text('away');
    const competition = text('wettbewerb') || text('liga') || text('competition');
    if (date && home && away) matches.push({ date: normalizeXmlDate(date), time: time || null, home, away, ownTeam: '', competition, link: null });
  });
  if (debug) console.log(`  [debug/B] XML geparst: ${matches.length} Spiele gefunden (${$('spiel, match, Spiel, Match').length} <spiel>/<match>-Elemente im Dokument).`);
  return matches;
}
function normalizeXmlDate(d) {
  const m = d.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (!m) return d;
  const yy = m[3].length === 2 ? '20' + m[3] : m[3];
  return `${yy}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
async function fetchViaTeamXml(teamId, debug) {
  const url = `https://www.fussball.de/ajax.team.matchplan/-/mime-type/XML/team-id/${teamId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
      'Accept': 'application/xml,text/xml',
    },
  });
  const text = await res.text();
  if (debug) console.log(`  [debug/B] Team ${teamId}: HTTP-Status ${res.status} | Antwort (erste 300 Zeichen): ${text.slice(0, 300).replace(/\n/g, ' ')}`);
  if (!res.ok) throw new Error(`fussball.de (XML) antwortete mit ${res.status} für team-id ${teamId}`);
  if (!text.trim().startsWith('<')) throw new Error('Antwort sieht nicht nach XML aus (vermutlich HTML-Fehlerseite statt Export)');
  return parseMatchplanXml(text, debug);
}

async function main() {
  const debug = process.env.FUSSBALLDE_DEBUG === '1' || process.argv.includes('--debug');
  const cfg = await loadConfig();
  const fb = cfg.fussballde;
  if (!fb || !fb.clubId) {
    console.log('Kein "fussballde.clubId" in data/config.json gefunden – überspringe Sync.');
    await fs.writeFile(OUTPUT_PATH, JSON.stringify({ updated: new Date().toISOString(), games: [] }, null, 2));
    return;
  }
  const clubMatch = fb.clubMatch || cfg.clubName || '';
  const todayIso = new Date().toISOString().slice(0, 10);

  let matches = null;
  let usedStrategy = null;

  // Strategie A: api-fussball.de (nur wenn Token konfiguriert)
  if (fb.apiToken) {
    try {
      console.log('Versuche Strategie A (api-fussball.de) …');
      matches = await fetchViaApiFussballDe(fb.clubId, fb.apiToken, debug);
      usedStrategy = 'A (api-fussball.de)';
    } catch (err) {
      console.warn(`  Strategie A fehlgeschlagen: ${err.message}`);
    }
  }

  // Strategie B: fussball.de XML-Export pro Mannschaft (nur wenn Team-IDs konfiguriert)
  if (!matches && Array.isArray(fb.teams) && fb.teams.length) {
    try {
      console.log('Versuche Strategie B (fussball.de XML-Export pro Mannschaft) …');
      const perTeam = await Promise.all(fb.teams.map(async t => {
        try {
          const m = await fetchViaTeamXml(t.teamId, debug);
          return m.map(x => ({ ...x, ownTeam: x.ownTeam || t.label || '' }));
        } catch (err) {
          console.warn(`  Team "${t.label || t.teamId}" (XML) fehlgeschlagen: ${err.message}`);
          return [];
        }
      }));
      const flat = perTeam.flat();
      if (flat.length) { matches = flat; usedStrategy = 'B (fussball.de XML pro Mannschaft)'; }
      else console.warn('  Strategie B lieferte für keine Mannschaft Ergebnisse.');
    } catch (err) {
      console.warn(`  Strategie B fehlgeschlagen: ${err.message}`);
    }
  }

  // Strategie C: fussball.de Vereins-HTML-Spielplan (immer als Fallback verfügbar)
  if (!matches) {
    try {
      console.log('Versuche Strategie C (fussball.de Vereins-HTML-Spielplan) …');
      matches = await fetchClubMatches(fb.clubId, debug);
      usedStrategy = 'C (fussball.de HTML-Spielplan)';
    } catch (err) {
      console.error('Strategie C (letzter Fallback) fehlgeschlagen:', err.message);
      process.exitCode = 1;
      return; // bestehende data/fussballde.json NICHT mit leeren Daten überschreiben
    }
  }

  console.log(`Verwendete Strategie: ${usedStrategy} | ${matches.length} Spiele insgesamt geparst (alle Mannschaften, Heim+Auswärts).`);
  if (debug && matches.length) {
    console.log(`  [debug] Beispiel erstes Spiel: ${JSON.stringify(matches[0])}`);
    console.log(`  [debug] Erkannte Heim-Teamnamen (einmalig): ${[...new Set(matches.map(m => m.home))].join(' | ')}`);
  }
  console.log(`clubMatch-Filter: "${clubMatch}" (case-insensitive "startsWith"-Vergleich mit dem Heim-Teamnamen)`);

  const allGames = matches
    .filter(m => isHomeMatch(m, clubMatch))
    .filter(m => m.date >= todayIso) // nur zukünftige Spiele
    .map(m => ({
      d: m.date,
      t: m.time,
      team: m.ownTeam,
      opponent: m.away,
      competition: m.competition,
      link: m.link,
    }))
    .sort((a, b) => (a.d + (a.t || '')).localeCompare(b.d + (b.t || '')));

  console.log(`${allGames.length} zukünftige Heimspiele über alle Mannschaften gefunden.`);

  const output = { updated: new Date().toISOString(), games: allGames, strategy: usedStrategy };
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Fertig: ${allGames.length} Heimspiele nach ${OUTPUT_PATH} geschrieben.`);
}

main().catch(err => {
  console.error('Sync fehlgeschlagen:', err);
  process.exit(1);
});

