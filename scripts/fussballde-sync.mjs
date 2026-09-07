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
//
// WICHTIGE STRUKTUR (per Debug-Log am 07.09.2026 verifiziert): Pro Spiel gibt es
// mehrere aufeinanderfolgende <tr>-Zeilen, keine einzelne:
//   1. tr.row-headline.visible-small   – Mobil-Überschrift (Datum+Wettbewerb als Fließtext), IGNORIEREN
//   2. tr.row-competition.hidden-small – Desktop: Datum/Zeit + "Mannschaft | Wettbewerb" + Spiel-ID
//   3. tr (ohne row-*-Klasse)          – die eigentliche Team-Zeile mit zwei td.column-club (Heim, Gast)
// Die Team-Namen stehen NICHT in derselben Zeile wie das Datum, sondern in der
// darauffolgenden Zeile – deshalb iterieren wir gezielt über tr.row-competition
// und suchen die Team-Zeile in den nächsten Geschwister-Zeilen.
function parseMatches(html, debug) {
  const $ = cheerio.load(html);
  const matches = [];
  const compRows = $('tr.row-competition');
  let noTeamRowCount = 0;

  compRows.each((_, row) => {
    const $row = $(row);
    const rowText = $row.text().replace(/\s+/g, ' ').trim();

    const dateMatch = rowText.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
    if (!dateMatch) return;
    const timeMatch = rowText.match(/(\d{1,2}):(\d{2})/);

    // "Mannschaft | Wettbewerb", z.B. "Herren | Kreisliga A"
    const compText = cleanText($row.find('td.column-team').first().text());
    const parts = compText.split('|').map(s => s.trim());
    const ownTeam = parts[0] || '';
    const competition = parts[1] || parts[0] || '';

    // Die Team-Zeile ist eine der NÄCHSTEN Geschwister-Zeilen (nicht diese selbst!),
    // erkennbar an zwei td.column-club-Zellen mit je einem Vereins-Link.
    let $teamRow = $row.next('tr');
    let hops = 0;
    while ($teamRow.length && $teamRow.find('td.column-club').length < 2 && hops < 4) {
      $teamRow = $teamRow.next('tr');
      hops++;
    }
    if (!$teamRow.length || $teamRow.find('td.column-club').length < 2) {
      noTeamRowCount++;
      if (debug && noTeamRowCount <= 3) {
        console.log(`  [debug] Keine Team-Zeile gefunden für: "${rowText.slice(0, 120)}"`);
      }
      return;
    }
    const clubCells = $teamRow.find('td.column-club');
    const home = cleanText($(clubCells[0]).find('.club-name').text() || $(clubCells[0]).text());
    const away = cleanText($(clubCells[1]).find('.club-name').text() || $(clubCells[1]).text());
    if (!home || !away) return;

    const matchLink = $teamRow.find('a[href*="/spiel/"]').first().attr('href')
      || $row.find('a[href*="/spiel/"]').first().attr('href') || '';
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
    console.log(`  [debug] tr.row-competition gefunden: ${compRows.length} | ohne zuordenbare Team-Zeile: ${noTeamRowCount} | daraus geparste Spiele: ${matches.length}`);
    if (!compRows.length) {
      console.log('  [debug] Keine tr.row-competition-Zeilen gefunden – evtl. hat sich die CSS-Klasse geändert. Suche nach beliebigen <tr> mit Datum als Rückfallebene folgt separat.');
    }
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
  // "Mehr laden" auf der fussball.de-Seite deutet auf serverseitige Pagination hin.
  // Statt das nachzubauen (unbekannter Seiten-Parameter), fordern wir direkt einen
  // weiten Datumsbereich + hohes "max" an – das Muster (datum-von/datum-bis/max)
  // stammt aus dem "Drucken"-Link, den fussball.de selbst für die Vollansicht nutzt.
  const today = new Date();
  const inOneYear = new Date(today.getTime());
  inOneYear.setFullYear(inOneYear.getFullYear() + 1);
  const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  const url = `https://www.fussball.de/ajax.club.matchplan/-/datum-von/${fmt(today)}/datum-bis/${fmt(inOneYear)}/max/999/id/${clubId}/mode/PAGE/show-filter/true`;
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
    console.log(`  [debug] Angefragter Zeitraum: ${fmt(today)} bis ${fmt(inOneYear)} (max 999)`);
    console.log(`  [debug] URL: ${url}`);
    console.log(`  [debug] HTTP-Status: ${res.status} | Antwortlänge: ${html.length} Zeichen`);
    console.log(`  [debug] Erste 300 Zeichen der Antwort:\n${html.slice(0, 300).replace(/\n/g, ' ')}`);
  }
  if (!res.ok) {
    // Falls die erweiterten Parameter vom Server abgelehnt werden (z.B. 400/404),
    // auf die zuvor funktionierende einfache URL zurückfallen – lieber weniger
    // Monate als gar keine Daten.
    console.warn(`  [warnung] Erweiterte Anfrage fehlgeschlagen (${res.status}) – falle zurück auf einfache Anfrage ohne Datumsbereich.`);
    const fallbackUrl = `https://www.fussball.de/ajax.club.matchplan/-/id/${clubId}/mode/PAGE/show-filter/true`;
    const res2 = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.fussball.de/',
      },
    });
    const html2 = await res2.text();
    if (!res2.ok) throw new Error(`fussball.de antwortete mit ${res2.status} für Verein ${clubId}`);
    return parseMatches(html2, debug);
  }
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

  // Auswärtsspiele: unser Team steht auf der "away"-Seite, nicht auf "home".
  // Rein informativ – belegen den eigenen Platz nicht, fließen also NICHT in die
  // Konfliktprüfung ein (siehe index.html: nur "games", nicht "awayGames").
  const awayGames = matches
    .filter(m => isHomeMatch({ ...m, home: m.away }, clubMatch) && !isHomeMatch(m, clubMatch))
    .filter(m => m.date >= todayIso)
    .map(m => ({
      d: m.date,
      t: m.time,
      team: m.ownTeam,
      opponent: m.home, // bei einem Auswärtsspiel ist "home" der Gegner
      competition: m.competition,
      link: m.link,
    }))
    .sort((a, b) => (a.d + (a.t || '')).localeCompare(b.d + (b.t || '')));

  console.log(`${allGames.length} zukünftige Heimspiele und ${awayGames.length} zukünftige Auswärtsspiele gefunden.`);

  const output = { updated: new Date().toISOString(), games: allGames, awayGames, strategy: usedStrategy };
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Fertig: ${allGames.length} Heimspiele + ${awayGames.length} Auswärtsspiele nach ${OUTPUT_PATH} geschrieben.`);
}

main().catch(err => {
  console.error('Sync fehlgeschlagen:', err);
  process.exit(1);
});

