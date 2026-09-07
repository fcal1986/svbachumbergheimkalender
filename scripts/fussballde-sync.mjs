// scripts/fussballde-sync.mjs
//
// Holt den öffentlichen VEREINS-Spielplan von fussball.de (alle Mannschaften
// in einem Request), filtert die Heimspiele heraus und schreibt sie nach
// data/fussballde.json.
//
// WICHTIG: fussball.de bietet keine offizielle Export-API mehr an. Dieses
// Skript liest die öffentlich sichtbare HTML-Seite (kein Login nötig) und
// extrahiert die Daten heuristisch. Das ist robuster als exakte CSS-Klassen-
// Selektoren (die sich bei fussball.de öfter ändern), kann aber bei größeren
// Layout-Umbauten trotzdem brechen. Bitte Nutzungsbedingungen von fussball.de
// beachten (https://www.fussball.de/terms.and.conditions) – nur für den
// internen, nicht-kommerziellen Vereinsgebrauch gedacht, mit moderater
// Abruffrequenz (siehe Workflow: alle 6 Stunden, nicht öfter).
//
// Aufruf: node scripts/fussballde-sync.mjs

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
      if (debug && rowsWithDate <= 5) {
        console.log(`  [debug] Zeile mit Datum, aber nur ${teamLinks.length} Team-Link(s): "${rowText.slice(0, 120)}"`);
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

  let allGames = [];
  try {
    const matches = await fetchClubMatches(fb.clubId, debug);
    if (debug) {
      console.log(`  [debug] ${matches.length} Spiele insgesamt geparst (alle Mannschaften, Heim+Auswärts).`);
      if (matches.length) {
        console.log(`  [debug] Beispiel erstes Spiel: ${JSON.stringify(matches[0])}`);
        console.log(`  [debug] Erkannte Heim-Teamnamen (einmalig): ${[...new Set(matches.map(m => m.home))].join(' | ')}`);
      }
      console.log(`  [debug] clubMatch-Filter: "${clubMatch}" (case-insensitive "startsWith"-Vergleich mit dem Heim-Teamnamen)`);
    }
    allGames = matches
      .filter(m => isHomeMatch(m, clubMatch))
      .filter(m => m.date >= todayIso) // nur zukünftige Spiele
      .map(m => ({
        d: m.date,
        t: m.time,
        team: m.ownTeam,
        opponent: m.away,
        competition: m.competition,
        link: m.link,
      }));
    console.log(`${allGames.length} zukünftige Heimspiele über alle Mannschaften gefunden.`);
  } catch (err) {
    console.error('Sync-Fehler:', err.message);
    process.exitCode = 1;
    return; // bestehende data/fussballde.json NICHT mit leeren Daten überschreiben
  }

  allGames.sort((a, b) => (a.d + (a.t || '')).localeCompare(b.d + (b.t || '')));

  const output = { updated: new Date().toISOString(), games: allGames };
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Fertig: ${allGames.length} Heimspiele nach ${OUTPUT_PATH} geschrieben.`);
}

main().catch(err => {
  console.error('Sync fehlgeschlagen:', err);
  process.exit(1);
});

