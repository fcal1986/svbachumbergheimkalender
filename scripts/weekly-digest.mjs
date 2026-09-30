// scripts/weekly-digest.mjs
//
// Wochenübersicht per Mail (ab 30.09.2026 · 4): sonntags gegen 18 Uhr an alle Trainer (ihre
// Mannschaften) und Admins ohne Mannschaft (Vereinsübersicht). Inhalt: die kommende Woche
// (Mo–So) mit Training, Spielen, Absagen und Verlegungen, Platzkonflikte der nächsten 14 Tage,
// offene Punkte ("Zu erledigen"), noch nicht bei fussball.de angesetzte Spiele und optional
// eine Zeile "Neu in Platzcoach" (config.json → weeklyDigest.news).
//
// Die Inhalte berechnet die App selbst: Das Skript öffnet index.html im Headless-Browser mit
// den Daten aus data/, stellt die Uhr auf Montag 00:05 und ruft weeklyDigestFor(userId) auf.
// So gelten dieselben Regeln wie auf der Startseite (Meine Woche, Zu erledigen, Konflikte).
//
// Umgebung:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS   Versand (wie die übrigen Mails, Brevo)
//   DIGEST_MODE     send (Standard) | preview (nur HTML-Dateien, kein Versand) | test
//   DIGEST_TEST_TO  bei test: alle Mails gehen NUR an diese Adresse (Betreff mit "[Test: Name]")
//   DIGEST_AS       bei test/preview: nur diese Zugänge (E-Mail oder Name, Komma-getrennt; leer = alle)
//   DIGEST_DATE     Montag der Woche (JJJJ-MM-TT); leer = nächster Montag (bzw. heute, wenn Montag)
//   DIGEST_SCHEDULE Cron-Ausdruck des Zeitplans (github.event.schedule) – Sommer-/Winterzeit-Weiche
//   DIGEST_OUT      Ordner für die Vorschau (Standard: digest-preview)
//   PLATZCOACH_TOKEN optional: App-Token, nur um die Zahl angemeldeter Torhüter zu entschlüsseln
//   CHROMIUM_PATH   optional: eigener Chromium (lokale Tests)

import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT = process.cwd();
const MODE = (process.env.DIGEST_MODE || 'send').trim();
const TEST_TO = (process.env.DIGEST_TEST_TO || '').trim();
const AS = (process.env.DIGEST_AS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const OUT = process.env.DIGEST_OUT || 'digest-preview';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const readJson = async (p, fb) => { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch (e) { return fb; } };

// Versatz Europe/Berlin zu UTC in Stunden (1 im Winter, 2 im Sommer)
function berlinOffset(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', timeZoneName: 'shortOffset' }).formatToParts(d);
  const m = (parts.find(p => p.type === 'timeZoneName') || {}).value?.match(/GMT([+-]\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}
function berlinDate(d = new Date()) { // "JJJJ-MM-TT" in Berlin
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d);
}
function nextMonday() {
  const today = berlinDate();
  const d = new Date(today + 'T12:00:00Z');
  const add = (8 - d.getUTCDay()) % 7; // Mo=1 → 0, So=0 → 1
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

// Zeitplan: zwei Cron-Zeilen (15:55 und 16:55 UTC) – je nach Sommer-/Winterzeit ist nur eine davon
// "gegen 18 Uhr" in Berlin. Die Weiche hängt am auslösenden Cron-Ausdruck, nicht an der Uhrzeit,
// damit ein verspäteter Start von GitHub nicht zu doppeltem oder fehlendem Versand führt.
function scheduleAllowsRun() {
  const sched = (process.env.DIGEST_SCHEDULE || '').trim();
  if (!sched) return true;
  const hour = parseInt(sched.split(/\s+/)[1], 10);
  const want = 18 - berlinOffset() - 1; // 17:55 Berlin
  if (hour !== want) { console.log(`Zeitplan ${sched} passt nicht zur aktuellen Zeitzone (UTC+${berlinOffset()}) – übersprungen.`); return false; }
  return true;
}

async function loadChromium() {
  const { chromium } = await import('playwright');
  return chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
}

// App im Headless-Browser öffnen; alle Anfragen werden aus dem Arbeitsverzeichnis beantwortet,
// Fremdes (Analytics, Schriften) wird blockiert.
async function computeDigests(monday) {
  const browser = await loadChromium();
  try {
    const ctx = await browser.newContext({ timezoneId: 'Europe/Berlin', serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.clock.install({ time: new Date(monday + 'T00:05:00' + (berlinOffset(new Date(monday + 'T12:00:00Z')) === 2 ? '+02:00' : '+01:00')) });
    await page.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.host !== 'platzcoach.local') return route.abort();
      const rel = decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname);
      const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
      try {
        const body = await fs.readFile(file);
        const type = file.endsWith('.json') ? 'application/json' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream';
        return route.fulfill({ body, contentType: type });
      } catch (e) { return route.fulfill({ status: 404, body: '' }); }
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('https://platzcoach.local/');
    await page.waitForFunction(() => /Version/.test((document.getElementById('ver-note') || {}).textContent || ''), null, { timeout: 60000 });
    const result = await page.evaluate(async token => {
      /* global USERS, session, loadGK, GK, weeklyDigestFor */
      let gk = false;
      if (token) {
        session = { id: '__digest', name: 'Wochenübersicht', token };
        try { await loadGK(); gk = !!GK.loaded; } catch (e) { gk = false; }
      }
      const out = [];
      for (const u of USERS) {
        if (!u.email || u.locked) continue;
        const d = weeklyDigestFor(u.id);
        if (d) out.push({ ...d, last: u.last || '', weeklyDigest: u.weeklyDigest !== false });
      }
      return { gk, out };
    }, process.env.PLATZCOACH_TOKEN || '');
    if (errors.length) console.log('Hinweise aus der App: ' + errors.join(' | '));
    return result;
  } finally { await browser.close(); }
}

/* ---------- Mail bauen ---------- */
const C = { ink: '#011B32', soft: '#718191', line: '#DCE3E2', green: '#6BB41C', greenBg: '#EEF7E5', warn: '#C0392B', warnBg: '#FDECEA', orange: '#9A3412', orangeBg: '#FFF7ED', bg: '#F8FAF7' };
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

function linkFor(siteUrl, id) {
  return siteUrl + '?src=wochenmail' + (id ? '#t=' + encodeURIComponent(id) : '');
}
const isGame = r => r.tag === 'Heim' || r.tag === 'Auswärts' || /^(gegen|bei) /.test(r.name);

function counts(d) {
  const w = d.week;
  const trainings = d.clubWide && d.stats ? d.stats.trainings : w.filter(r => r.training).length;
  const games = w.filter(r => !r.cancelled && !r.moved && isGame(r)).length;
  const cancelled = d.clubWide && d.stats ? d.stats.cancelled : w.filter(r => r.cancelled).length;
  return { trainings, games, cancelled };
}
function isQuiet(d) { return !d.week.length && !d.conflicts.length && !d.todos.length && !d.open.length; }

function subjectOf(d) {
  const { trainings, games } = counts(d);
  const head = (d.clubWide ? 'Vereinswoche' : 'Deine Woche') + ' ab ' + d.fromShort;
  if (isQuiet(d)) return head + ': alles ruhig';
  const parts = [];
  if (trainings) parts.push(trainings + (trainings === 1 ? ' Training' : ' Trainings'));
  if (games) parts.push(games + (games === 1 ? ' Spiel' : ' Spiele'));
  let s = head + (parts.length ? ': ' + parts.join(', ') : '');
  const n = d.conflicts.length + d.todos.length;
  if (n) s += ' · ⚠ ' + (d.conflicts.length ? d.conflicts.length + (d.conflicts.length === 1 ? ' Konflikt' : ' Konflikte') : n + ' offen');
  return s;
}

function rowHtml(r, siteUrl, withDate) {
  const muted = r.cancelled || r.moved;
  const tagStyle = r.tag === 'Abgesagt' || r.tag === 'Entfällt' ? `background:#EEF1F4;color:${C.soft};`
    : r.tag === 'Verlegt' ? `background:${C.orangeBg};color:${C.orange};`
    : r.tag === 'Heim' ? `background:${C.greenBg};color:#3B6B10;`
    : r.tag === 'Auswärts' ? `background:#E8EEF7;color:${C.ink};` : '';
  const sub = [r.planned && !/Vorgemerkt/.test(r.sub) ? 'Vorgemerkt' : '', r.sub, r.doubleGame ? '⚠ weiteres Spiel am selben Tag' : ''].filter(Boolean).join(' · ');
  const time = withDate ? `<b>${esc(r.dayShort)}</b><br>${esc(r.t)}` : esc(r.t) + (r.bis && !isGame(r) && !r.moved ? `<br><span style="color:${C.soft};font-size:12px;">bis ${esc(r.bis)}</span>` : '');
  return `<tr><td style="padding:0 0 6px 0;">
<a href="${esc(linkFor(siteUrl, r.link))}" style="text-decoration:none;color:${C.ink};display:block;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:${r.planned ? C.orangeBg : '#FFFFFF'};border:1px ${r.planned ? 'dashed #F5A25D' : 'solid ' + C.line};border-radius:10px;"><tr>
<td width="${withDate ? 64 : 54}" valign="top" style="${FONT}font-size:14px;padding:10px 0 10px 12px;color:${C.ink};">${time}</td>
<td valign="top" style="${FONT}padding:10px 8px;">
<div style="font-size:14px;font-weight:bold;${muted ? 'text-decoration:line-through;color:' + C.soft + ';' : ''}"><span style="display:inline-block;background:${C.ink};color:#fff;border-radius:6px;padding:1px 6px;font-size:11px;margin-right:6px;text-decoration:none;">${esc(r.team)}</span>${esc(r.name)}</div>
${sub ? `<div style="font-size:12px;color:${r.doubleGame ? C.warn : C.soft};margin-top:2px;">${esc(sub)}</div>` : ''}
</td>
<td width="80" align="right" valign="top" style="${FONT}padding:10px 12px 10px 0;">${r.tag ? `<span style="display:inline-block;${tagStyle}border-radius:6px;padding:2px 7px;font-size:11px;font-weight:bold;">${esc(r.tag)}</span>` : ''}</td>
</tr></table></a></td></tr>`;
}

function sectionTitle(t, extra) {
  return `<p style="${FONT}font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:${C.soft};margin:22px 0 8px;">${esc(t)}${extra ? ` <span style="text-transform:none;letter-spacing:0;font-weight:normal;">${esc(extra)}</span>` : ''}</p>`;
}

function buildMail(d, ctx) {
  const { siteUrl, clubName, news } = ctx;
  const quiet = isQuiet(d);
  const cnt = counts(d);
  let body = '';

  // Bitte prüfen: Konflikte (14 Tage) + offene Punkte
  if (d.conflicts.length || d.todos.length) {
    const items = d.conflicts.map(c => ({ text: `Platzkonflikt ${c.day} – ${c.text}`, link: c.link, act: 'Ansehen' }))
      .concat(d.todos.map(t => ({ text: t.text, link: t.link, act: t.action })));
    body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:${C.warnBg};border:1px solid #F3B8B0;border-radius:12px;margin:18px 0 0;"><tr><td style="${FONT}padding:12px 14px;color:${C.ink};">
<div style="font-size:14px;font-weight:bold;color:${C.warn};margin-bottom:6px;">Bitte prüfen${d.conflicts.length ? ` · Platzkonflikte bis ${esc(d.conflictsTo)}` : ''}</div>
${items.map(i => `<div style="font-size:14px;margin:6px 0;">${esc(i.text)}${i.link || i.act ? ` <a href="${esc(linkFor(siteUrl, i.link))}" style="color:${C.warn};font-weight:bold;white-space:nowrap;">${esc(i.act || 'Ansehen')} ›</a>` : ''}</div>`).join('')}
</td></tr></table>`;
  }

  if (quiet) {
    body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:${C.greenBg};border-radius:12px;margin:18px 0 0;"><tr><td style="${FONT}padding:14px;font-size:14px;color:${C.ink};">
<b>Alles ruhig diese Woche.</b> Für ${esc(d.teamsLabel)} steht von ${esc(d.fromShort)} bis ${esc(d.toShort)} nichts an, und es gibt keine Platzkonflikte.</td></tr></table>`;
    if (d.next.length) {
      body += sectionTitle('Nächstes Spiel');
      body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowHtml(d.next[0], siteUrl, true)}</table>`;
    }
  } else {
    // Die Woche
    const statLine = [cnt.trainings ? cnt.trainings + (cnt.trainings === 1 ? ' Training' : ' Trainings') : '', cnt.games ? cnt.games + (cnt.games === 1 ? ' Spiel' : ' Spiele') : '', cnt.cancelled ? cnt.cancelled + ' abgesagt' : ''].filter(Boolean).join(' · ');
    body += sectionTitle(d.clubWide ? 'Spiele und Termine im Verein' : 'Deine Woche', statLine ? '· ' + statLine : '');
    if (!d.week.length) {
      body += `<p style="${FONT}font-size:14px;color:${C.soft};margin:0;">${d.clubWide ? 'Keine Spiele oder Termine in dieser Woche.' : 'Diese Woche steht nichts an.'}</p>`;
    } else {
      let last = '';
      body += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
      for (const r of d.week) {
        if (r.d !== last) {
          body += `<tr><td style="${FONT}font-size:13px;font-weight:bold;color:${C.ink};padding:${last ? '10px' : '0'} 0 6px;">${esc(r.dayShort)}</td></tr>`;
          last = r.d;
        }
        body += rowHtml(r, siteUrl, false);
      }
      body += '</table>';
    }
    if (d.open.length) {
      body += sectionTitle('Noch nicht bei fussball.de', '· vorgemerkt, Ansetzung steht aus');
      body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${d.open.map(r => rowHtml(r, siteUrl, true)).join('')}</table>`;
    }
  }

  if (news) {
    body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border:1px solid ${C.line};border-radius:12px;margin:22px 0 0;"><tr><td style="${FONT}padding:12px 14px;font-size:14px;color:${C.ink};"><b style="color:#3B6B10;">Neu in Platzcoach:</b> ${esc(news)}</td></tr></table>`;
  }

  const btn = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;"><tr><td style="background:${C.ink};border-radius:10px;"><a href="${esc(linkFor(siteUrl, ''))}" style="${FONT}display:inline-block;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;">Platzcoach öffnen</a></td></tr></table>`;
  const why = d.clubWide ? 'Du bekommst die Vereinsübersicht als Admin ohne eigene Mannschaft.' : `Du bekommst diese Übersicht als Trainer von ${d.teamsLabel}.`;
  const foot = `<p style="${FONT}color:${C.soft};font-size:12px;margin:22px 0 0;line-height:1.5;">${esc(why)} Abstellen kannst du sie in Platzcoach unter Konto → Profil → „Wochenübersicht“.<br>Platzcoach · ${esc(clubName)}</p>`;

  const intro = quiet ? '' : `<p style="${FONT}font-size:14px;color:${C.ink};margin:0;">Hallo ${esc(d.first)}, hier ist ${d.clubWide ? 'die Woche im Verein' : 'deine Woche'} von ${esc(d.fromShort)} bis ${esc(d.toShort)}</p>`;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subjectOf(d))}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};"><tr><td align="center" style="padding:16px 10px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="${FONT}padding:4px 2px 12px;"><span style="font-size:18px;font-weight:bold;color:${C.ink};">Platz<span style="color:${C.green};">coach</span></span><span style="font-size:13px;color:${C.soft};"> · ${esc(d.clubWide ? 'Vereinsübersicht' : d.teamsLabel)}</span></td></tr>
<tr><td style="background:#FFFFFF;border:1px solid ${C.line};border-radius:14px;padding:18px 16px;">
${quiet ? `<p style="${FONT}font-size:14px;color:${C.ink};margin:0;">Hallo ${esc(d.first)},</p>` : intro}
${body}
${btn}
${foot}
</td></tr></table></td></tr></table></body></html>`;

  // Textfassung
  const L = [];
  L.push(`Hallo ${d.first},`, '');
  if (d.conflicts.length || d.todos.length) {
    L.push('BITTE PRÜFEN');
    d.conflicts.forEach(c => L.push(`- Platzkonflikt ${c.day} – ${c.text}`, `  ${linkFor(siteUrl, c.link)}`));
    d.todos.forEach(t => L.push(`- ${t.text}`, `  ${linkFor(siteUrl, t.link)}`));
    L.push('');
  }
  if (quiet) {
    L.push(`Alles ruhig diese Woche: Für ${d.teamsLabel} steht von ${d.fromShort} bis ${d.toShort} nichts an.`);
    if (d.next.length) { const r = d.next[0]; L.push('', `Nächstes Spiel: ${r.dayShort} ${r.t} ${r.team} ${r.name}`, `  ${linkFor(siteUrl, r.link)}`); }
  } else {
    L.push((d.clubWide ? 'SPIELE UND TERMINE IM VEREIN' : 'DEINE WOCHE') + ` (${d.fromShort}–${d.toShort})`);
    let last = '';
    d.week.forEach(r => {
      if (r.d !== last) { L.push('', r.dayShort); last = r.d; }
      L.push(`  ${r.t} ${r.team} ${r.name}${r.tag ? ' [' + r.tag + ']' : ''}${r.sub ? ' – ' + r.sub : ''}`);
    });
    if (!d.week.length) L.push('  nichts');
    if (d.open.length) {
      L.push('', 'NOCH NICHT BEI FUSSBALL.DE');
      d.open.forEach(r => L.push(`- ${r.dayShort} ${r.t} ${r.team} ${r.name}`, `  ${linkFor(siteUrl, r.link)}`));
    }
  }
  if (news) L.push('', 'Neu in Platzcoach: ' + news);
  L.push('', 'Platzcoach öffnen: ' + linkFor(siteUrl, ''), '', why + ' Abstellen: Konto → Profil → „Wochenübersicht“.', 'Platzcoach · ' + clubName);

  return { subject: 'Platzcoach: ' + subjectOf(d), html, text: L.join('\n') };
}

/* ---------- Ablauf ---------- */
// Meldungen als GitHub-Annotation: stehen direkt auf der Übersichtsseite des Laufs (auch am Handy).
const ghMsg = (lvl, m) => console.log(`::${lvl}::` + String(m).replace(/\r?\n/g, ' '));
const note = m => { console.log(m); ghMsg('notice', m); };
const fail = m => { ghMsg('error', m); process.exit(1); };
// Datum aus JJJJ-MM-TT oder TT.MM.JJJJ; jeder Tag zählt, es gilt der Montag dieser Woche.
function mondayOf(input) {
  let v = String(input || '').trim();
  const de = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (de) v = `${de[3]}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + 'T12:00:00Z'))) return null;
  const d = new Date(v + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

async function main() {
  if (MODE === 'send' && !scheduleAllowsRun()) return;
  const rawDate = (process.env.DIGEST_DATE || '').trim();
  const monday = rawDate ? mondayOf(rawDate) : nextMonday();
  if (!monday) fail(`Datum „${rawDate}“ nicht lesbar – bitte als JJJJ-MM-TT (z. B. 2026-10-05) oder leer lassen.`);
  if (MODE === 'test' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(TEST_TO)) fail(`Testmodus: Bei „test_to“ fehlt eine gültige E-Mail-Adresse (eingetragen: „${TEST_TO}“).`);
  const cfg = await readJson('data/config.json', {});
  const dc = cfg.weeklyDigest || {};
  if (dc.enabled === false && MODE === 'send') { console.log('Wochenübersicht in config.json abgeschaltet (weeklyDigest.enabled=false).'); return; }
  const siteUrl = String(cfg.siteUrl || 'https://platzcoach.de/').replace(/\/?$/, '/');
  const clubName = cfg.clubName || 'Platzcoach';
  const news = dc.news && (!dc.newsUntil || dc.newsUntil >= monday) ? String(dc.news) : '';

  console.log(`Wochenübersicht für die Woche ab ${monday} (Modus ${MODE}) …`);
  const { gk, out } = await computeDigests(monday);
  console.log(`${out.length} mögliche Empfänger berechnet${process.env.PLATZCOACH_TOKEN ? ', Torhüter-Anmeldungen ' + (gk ? 'geladen' : 'NICHT entschlüsselbar') : ''}.`);

  let list = out;
  if (AS.length) {
    list = list.filter(d => AS.some(a => d.email.toLowerCase() === a || (d.first + ' ' + d.last).toLowerCase().includes(a)));
    if (!list.length) fail(`Bei „as“ passt „${AS.join(', ')}“ zu keinem Trainer mit Mannschaft. Bitte Vorname oder Login-E-Mail eintragen.`);
  }
  if (MODE === 'send') list = list.filter(d => d.weeklyDigest);
  const mails = list.map(d => ({ d, ...buildMail(d, { siteUrl, clubName, news }) }));

  if (MODE === 'preview') {
    await fs.mkdir(OUT, { recursive: true });
    const idx = [];
    for (const m of mails) {
      const f = (m.d.first + '-' + m.d.last).toLowerCase().replace(/[^a-z0-9äöüß-]+/g, '-').replace(/-+/g, '-') + '.html';
      await fs.writeFile(path.join(OUT, f), m.html);
      idx.push(`<li><a href="${esc(f)}">${esc(m.d.first + ' ' + m.d.last)}</a> – ${esc(m.subject)}${m.d.weeklyDigest ? '' : ' <i>(abgeschaltet)</i>'}</li>`);
      console.log(`Vorschau: ${f}  |  ${m.subject}`);
    }
    note(`Vorschau: ${mails.length} Mails (Woche ab ${monday}) unter „Artifacts“ → wochenuebersicht-vorschau. Es wurde nichts verschickt.`);
    await fs.writeFile(path.join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Wochenübersicht ${monday}</title><body style="font-family:Arial,sans-serif;"><h3>Wochenübersicht ab ${monday}</h3><ul>${idx.join('')}</ul></body>`);
    return;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) fail('SMTP-Secrets fehlen – kein Versand.');
  if (!mails.length) { note('Keine Empfänger (alle haben die Wochenübersicht abgeschaltet oder keine Mannschaft).'); return; }
  const nodemailer = (await import('nodemailer')).default;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  const fromAddress = (cfg.notify && cfg.notify.fromEmail) || process.env.SMTP_USER;
  const replyTo = (cfg.notify && cfg.notify.replyTo) || '';

  let sent = 0;
  for (const m of mails) {
    const to = MODE === 'test' ? TEST_TO : m.d.email;
    const subject = MODE === 'test' ? `[Test: ${m.d.first} ${m.d.last}] ${m.subject}` : m.subject;
    try {
      await transporter.sendMail({ from: `Platzcoach <${fromAddress}>`, ...(replyTo ? { replyTo } : {}), to, subject, text: m.text, html: m.html, headers: { 'X-Entity-Ref-ID': randomUUID() } });
      sent++;
      console.log(`Gesendet an ${to}${MODE === 'test' ? ' (Inhalt von ' + m.d.first + ' ' + m.d.last + ')' : ''}: ${subject}`);
      await new Promise(r => setTimeout(r, 400)); // Brevo nicht fluten
    } catch (e) { ghMsg('warning', `Fehler bei ${to}: ${e.message}`); }
  }
  const summary = `${sent} von ${mails.length} Wochenübersichten (Woche ab ${monday}) verschickt` + (MODE === 'test' ? ` – alle an ${TEST_TO}` : '') + '.';
  if (!sent) fail(summary + ' Siehe Warnungen oben.');
  note(summary);
}

main().catch(e => { console.error(e); fail('Abbruch: ' + (e && e.message || e)); });
