// scripts/tentative-expiry.mjs
//
// Noch nicht mit dem Gegner abgestimmte Freundschaftsspiele/Turniere (ab 12.10.2026 · 1).
// Ein Termin mit "tentative": {since, cancelled?, warnedAt?} reserviert den Platz höchstens 14 Tage ab
// Anlegen, spätestens bis zum Vortag des Spiels (mind. 1 Tag). Gleiche Regel wie tentativeUntil() in index.html.
//
//  - 2 Tage vor Fristende: Erinnerung per Mail + Push an Ersteller und Trainer der Mannschaft
//    (warnedAt wird gesetzt, damit sie nur einmal kommt).
//  - Am Fristende: Termin wird entfernt; dafür abgesagte Trainings finden wieder statt. Mail an Ersteller,
//    Trainer und Admins (Jugendleiter), Push an Ersteller und Trainer.
//
// Läuft im fussball.de-Workflow (alle 2 Stunden) in zwei Schritten:
//   node scripts/tentative-expiry.mjs         → ändert data/events.json / data/training.json, schreibt tentative-mails.json
//   (Workflow committet und pusht)
//   node scripts/tentative-expiry.mjs --send  → verschickt die Mails/Pushes aus tentative-mails.json
// So geht keine Mail raus, wenn das Speichern nicht geklappt hat.

import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { adminWants } from './notify-prefs.mjs';

const TENT_DAYS = 14, TENT_WARN_DAYS = 2;
const MAILS_PATH = 'tentative-mails.json';
const TEAM_CLASSES = ['G-Jugend', 'F-Jugend', 'E-Jugend', 'D-Jugend', 'C-Jugend', 'B-Jugend', 'A-Jugend',
  '1. Herren', '2. Herren', '3. Herren', 'Ü32 / Ü50'];
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

async function readJson(p, fb) { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch (e) { return fb; } }
function addDays(d, n) { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
function minD(a, b) { return a < b ? a : b; }
export function tentativeUntil(e) {
  const s = (e.tentative && e.tentative.since) || e.d;
  const a = minD(addDays(s, TENT_DAYS), addDays(e.d, -1)), b = minD(addDays(s, 1), e.d);
  return a > b ? a : b;
}
function berlinToday() { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }); }
function fmtDay(d) { const x = new Date(d + 'T12:00:00Z'); return `${DAYS[x.getUTCDay()]} ${d.slice(8, 10)}.${d.slice(5, 7)}.`; }
function teamShort(team, squad) { return /-Jugend$/.test(team) ? team.charAt(0) + (squad || 1) : team; }
function kindLabel(k) { return k === 'hallenturnier' ? 'Hallenturnier' : k === 'sommerturnier' ? 'Turnier' : 'Freundschaftsspiel'; }
function label(e) {
  const k = e.kind || 'game', ts = teamShort(e.team, e.squad);
  return k === 'game' ? `Freundschaftsspiel ${ts} ${e.ha === 'away' ? 'bei' : 'gegen'} ${e.opponent || ''}`.trim() : `${kindLabel(k)} ${ts}`;
}
function trainerClassesFor(user, seasons, today) {
  const cur = seasons.find(s => s.from <= today && s.to >= today);
  if (cur && cur.trainerClasses && cur.trainerClasses[user.id]) return cur.trainerClasses[user.id];
  return user.classes || {};
}
function trainsTeam(user, e, seasons, today) {
  const c = trainerClassesFor(user, seasons, today), sq = c[e.team];
  if (!sq) return false;
  return !sq.length || !/Jugend/.test(e.team) || sq.includes(e.squad || 1);
}

async function plan() {
  const today = berlinToday();
  const evData = await readJson('data/events.json', null);
  if (!evData || !Array.isArray(evData.events)) { console.log('Keine Termine.'); return; }
  const trData = await readJson('data/training.json', null);
  const users = ((await readJson('data/users.json', {})).users) || [];
  const seasons = ((await readJson('data/seasons.json', {})).seasons) || [];
  const cfg = await readJson('data/config.json', {});
  const notifyEmails = ((cfg.notify && cfg.notify.emails) || []).filter(Boolean).map(x => x.trim().toLowerCase());
  const active = users.filter(u => !u.locked);
  const mails = [];
  let changedTraining = false;
  const keep = [];
  for (const e of evData.events) {
    if (!e.tentative || !e.d || e.d < today) { keep.push(e); continue; }
    const until = tentativeUntil(e);
    const owner = active.find(u => u.id === e.ownerId) || null;
    const trainers = active.filter(u => trainsTeam(u, e, seasons, today));
    const close = [...new Map([owner, ...trainers].filter(Boolean).map(u => [u.id, u])).values()];
    const when = `${fmtDay(e.d)}${e.kickoff ? ', Anstoß ' + e.kickoff : ', ' + e.t + ' Uhr'}`;
    if (today >= until) {
      // Entfernen + abgesagte Trainings wieder aktivieren
      const back = [];
      if (trData && Array.isArray(trData.slots)) for (const id of (e.tentative.cancelled || [])) {
        const s = trData.slots.find(x => x.id === id);
        if (s && (s.cancelled || []).includes(e.d)) { s.cancelled = s.cancelled.filter(x => x !== e.d); back.push(s); changedTraining = true; }
      }
      const backTxt = back.length ? ` Das dafür abgesagte Training (${back.map(s => s.from + '–' + s.to).join(', ')}) findet wieder statt.` : '';
      const admins = active.filter(u => u.admin && !close.some(c => c.id === u.id) && adminWants(u, 'mail', trainsTeam(u, e, seasons, today) ? 'own' : 'other'));
      mails.push({
        type: 'removed', link: null, team: e.team, squad: e.squad || 1,
        subject: `Platzcoach: ${label(e)} entfernt – nicht bestätigt`,
        text: `${label(e)} am ${when} wurde entfernt: Es war nicht mit dem Gegner abgestimmt und wurde bis ${fmtDay(until)} nicht bestätigt. Der Platz ist wieder frei.${backTxt}`
          + (e.ha === 'away' ? '' : ' Bitte nicht im DFBnet ansetzen.'),
        mailTo: [...close, ...admins].map(u => u.id), extraEmails: notifyEmails, pushTo: close.map(u => u.id),
      });
      console.log(`Entfernt: ${label(e)} am ${e.d} (Frist ${until}).`);
      continue;
    }
    if (today >= addDays(until, -TENT_WARN_DAYS) && !e.tentative.warnedAt) {
      e.tentative.warnedAt = today;
      mails.push({
        type: 'warn', link: e.id, team: e.team, squad: e.squad || 1,
        subject: `Platzcoach: ${label(e)} noch nicht bestätigt – wird am ${fmtDay(until)} entfernt`,
        text: `${label(e)} am ${when} ist noch nicht mit dem Gegner abgestimmt. Ohne Bestätigung wird der Termin am ${fmtDay(until)} entfernt und der Platz freigegeben. `
          + `Steht das Spiel, in Platzcoach „Bestätigt“ tippen – sonst „Löschen“.`,
        mailTo: close.map(u => u.id), extraEmails: [], pushTo: close.map(u => u.id),
      });
      console.log(`Erinnerung: ${label(e)} am ${e.d} (Frist ${until}).`);
    }
    keep.push(e);
  }
  if (!mails.length) { console.log('Nichts zu tun.'); return; }
  evData.events = keep;
  await fs.writeFile('data/events.json', JSON.stringify(evData, null, 2));
  if (changedTraining) await fs.writeFile('data/training.json', JSON.stringify(trData, null, 2));
  await fs.writeFile(MAILS_PATH, JSON.stringify(mails, null, 2));
  console.log(`${mails.length} Benachrichtigung(en) vorgemerkt.`);
}

function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function send() {
  const mails = await readJson(MAILS_PATH, []);
  if (!mails.length) return;
  const cfg = await readJson('data/config.json', {});
  const users = ((await readJson('data/users.json', {})).users) || [];
  const notify = cfg.notify || {};
  const site = String(cfg.siteUrl || 'https://platzcoach.de/').replace(/\/?$/, '/');
  const clubName = cfg.clubName || cfg.club || 'Platzcoach';
  // Push
  try {
    const { loadPushDevices, pushToUser, appLink } = await import('./push-lib.mjs');
    const devices = await loadPushDevices(cfg);
    for (const m of mails) for (const id of m.pushTo) {
      await pushToUser(cfg, devices, id, { title: m.type === 'warn' ? 'Noch nicht bestätigt' : 'Termin entfernt', body: m.text, url: appLink(cfg, m.link), tag: 'pc-tent-' + (m.link || m.subject) });
    }
  } catch (err) { console.error('Push fehlgeschlagen:', err.message); }
  // Mail
  if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) { console.log('SMTP fehlt – keine Mails.'); return; }
  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_PORT || '587') === '465', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = notify.fromEmail || process.env.SMTP_USER;
  let sent = 0;
  for (const m of mails) {
    const to = new Set(m.extraEmails || []);
    for (const id of m.mailTo) {
      const u = users.find(x => x.id === id);
      if (u && u.email && !u.locked && u.emailNotificationsEnabled !== false) to.add(u.email.trim().toLowerCase());
    }
    const link = m.link ? site + '#t=' + encodeURIComponent(m.link) : site;
    for (const addr of to) {
      try {
        await transporter.sendMail({
          headers: { 'X-Entity-Ref-ID': randomUUID() }, from: `Platzcoach <${from}>`, ...(notify.replyTo ? { replyTo: notify.replyTo } : {}),
          to: addr, subject: m.subject,
          text: `${clubName}\n\n${m.text}\n\n${link}\n`,
          html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;"><p><strong>${escapeHtml(clubName)}</strong></p>`
            + `<p>${escapeHtml(m.text)}</p><p><a href="${escapeHtml(link)}" style="color:#16A34A;">${m.type === 'warn' ? 'In Platzcoach bestätigen' : 'Platzcoach öffnen'}</a></p>`
            + `<p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach.</p></div>`,
        });
        sent++;
      } catch (err) { console.error(`Senden an ${addr} fehlgeschlagen:`, err.message); }
    }
  }
  console.log(`${sent} Mail(s) gesendet.`);
}

if (process.argv.includes('--send')) await send(); else await plan();
