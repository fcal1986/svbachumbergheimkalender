// scripts/push-reminders.mjs
//
// Täglich (Workflow push-reminders.yml): Erinnerung per Push an Trainer-Termine, auf die ein Zugang
// noch nicht geantwortet hat – zwei Tage vorher. Nur Push; per Mail steht die offene Frage schon in
// der Wochenmail. Ohne VAPID-Secret bzw. ohne angemeldete Geräte passiert nichts.

import fs from 'node:fs/promises';
import { loadPushDevices, pushToUser, appLink, pushConfigured } from './push-lib.mjs';

const DAYS_BEFORE = 2;
const DOW = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function berlinDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d); // JJJJ-MM-TT
}
async function readJson(p, fallback) { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch (e) { return fallback; } }

async function main() {
  const cfg = await readJson('data/config.json', {});
  if (!pushConfigured(cfg)) { console.log('Push nicht eingerichtet – nichts zu tun.'); return; }
  const devices = await loadPushDevices(cfg);
  if (!devices.length) { console.log('Keine Push-Geräte angemeldet.'); return; }
  const events = (await readJson('data/events.json', { events: [] })).events || [];
  const users = (await readJson('data/users.json', { users: [] })).users || [];
  const target = berlinDate(DAYS_BEFORE);
  const due = events.filter(e => e.kind === 'trainer' && e.d === target);
  if (!due.length) { console.log('Keine Trainer-Termine am ' + target + '.'); return; }
  let sent = 0;
  for (const e of due) {
    const dt = new Date(e.d + 'T12:00:00Z');
    const day = DOW[dt.getUTCDay()] + ' ' + dt.getUTCDate() + '.' + (dt.getUTCMonth() + 1) + '.';
    const place = e.address ? ' in ' + e.address.split(',').pop().replace(/\(.*?\)/g, '').trim() : '';
    const yes = Object.values(e.rsvp || {}).filter(v => v && v.s === 'yes').length;
    for (const u of users.filter(x => !x.locked && !(e.rsvp && e.rsvp[x.id]))) {
      sent += await pushToUser(cfg, devices, u.id, {
        title: 'Kommst du? ' + e.title,
        body: day + ', ' + e.t + place + (yes ? ' · ' + yes + ' dabei' : '') + ' – bitte in Platzcoach zu- oder absagen.',
        url: appLink(cfg, e.id),
        tag: 'pc-rsvp-' + e.id,
      });
    }
  }
  console.log(`${sent} Erinnerung(en) per Push gesendet.`);
}

main().catch(err => { console.error('Push-Erinnerung fehlgeschlagen:', err); process.exit(1); });
