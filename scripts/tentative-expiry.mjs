// scripts/tentative-expiry.mjs
//
// Vorläufige Spiele/Turniere (ab 12.10.2026): In Platzcoach kann ein Freundschaftsspiel oder Turnier mit
// „Noch nicht abgestimmt“ gespeichert werden (events.json → tentative {since, until, warned}).
// Täglich (Workflow tentative-expiry.yml):
//   - ab zwei Tage vor `until`: einmalig Löschankündigung („Reservierung läuft ab: …“), warned = heute
//   - ab `until`: Termin löschen („Freundschaftsspiel gelöscht: … Reservierung abgelaufen …“)
// Je Änderung ein eigener Commit mit sprechender Nachricht; der Workflow ruft danach notify-email.mjs
// für genau diese Commits auf (Mail + Push an Trainer der Mannschaft, Admins und den Ersteller).
// TENTATIVE_DRY=1: nichts schreiben/committen, nur ausgeben. TENTATIVE_TODAY=JJJJ-MM-TT: Datum vorgeben (Test).

import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const PATH = 'data/events.json';
const DRY = process.env.TENTATIVE_DRY === '1';
const WARN_DAYS = 2;

const berlinDate = (d = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d);
const addDays = (ds, n) => { const d = new Date(ds + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const fmtDay = ds => { const [y, m, d] = ds.split('-'); return `${WD[new Date(ds + 'T12:00:00Z').getUTCDay()]} ${d}.${m}.`; };
const fmtDate = ds => { const [y, m, d] = ds.split('-'); return `${WD[new Date(ds + 'T12:00:00Z').getUTCDay()]} ${d}.${m}.${y}`; };
const teamLabel = (team, squad) => { const m = String(team || '').match(/^([A-G])-Jugend$/); return m ? `${m[1]}${squad || 1}-Jugend` : (team || ''); };
const KIND = { game: 'Freundschaftsspiel', hallenturnier: 'Hallenturnier', sommerturnier: 'Sommerturnier' };

function describe(e) {
  const label = teamLabel(e.team, e.squad), k = e.kind || 'game';
  const head = k === 'game' ? `${label}${e.ha === 'away' ? ' bei ' : ' gegen '}${e.opponent || ''}` : `${KIND[k] || 'Turnier'} ${label}`;
  const when = fmtDate(e.d) + (k === 'game' && e.kickoff ? `, Anstoß ${e.kickoff}` : `, ${e.t}–${e.bis || ''}`);
  return { head, when, prefix: k === 'game' ? 'Freundschaftsspiel' : 'Turnier' };
}
function trailer(e) {
  return `\n\nPlatzcoach-Team: ${e.team || 'Alle Teams'}#${e.squad || 1}` + (e.ownerId ? `\nPlatzcoach-Owner: ${e.ownerId}` : '');
}
function commit(data, msg) {
  console.log('→ ' + msg.split('\n')[0]);
  if (DRY) return;
  return fs.writeFile(PATH, JSON.stringify(data, null, 2)).then(() => {
    execFileSync('git', ['add', PATH]);
    execFileSync('git', ['commit', '-q', '-m', msg]);
  });
}

async function main() {
  const today = process.env.TENTATIVE_TODAY || berlinDate();
  const data = JSON.parse(await fs.readFile(PATH, 'utf8'));
  const list = Array.isArray(data.events) ? data.events : [];
  const todo = list.filter(e => e && e.tentative && e.tentative.until);
  console.log(`${todo.length} vorläufige Termin(e), heute ${today}.`);
  for (const e of todo) {
    const { until } = e.tentative, x = describe(e);
    if (today >= until) {
      data.events = data.events.filter(y => y.id !== e.id);
      await commit(data, `${x.prefix} gelöscht: ${x.head} · ${x.when} · Reservierung abgelaufen, nicht als abgestimmt bestätigt – Platz wieder frei – Platzcoach${trailer(e)}`);
    } else if (today >= addDays(until, -WARN_DAYS) && !e.tentative.warned) {
      e.tentative.warned = today;
      await commit(data, `Reservierung läuft ab: ${x.head} · ${x.when} · noch nicht abgestimmt – bitte bis ${fmtDay(addDays(until, -1))} in Platzcoach „Abgestimmt“ tippen, sonst wird der Termin am ${fmtDay(until)} gelöscht und der Platz freigegeben${trailer(e)}\nPlatzcoach-Link: ${e.id}`);
    }
  }
}

main().catch(err => { console.error('Fehler:', err); process.exit(1); });
