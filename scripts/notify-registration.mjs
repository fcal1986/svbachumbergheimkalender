// scripts/notify-registration.mjs
//
// Neue Selbstregistrierung → Push und E-Mail an alle Admins (ab 05.10.2026).
// Ausgelöst vom Registrierungs-Worker per repository_dispatch „registration-new“
// (nur wenn dort das Secret GITHUB_TOKEN gesetzt ist).
// Payload: { name, role, teams } – bewusst ohne E-Mail/Telefon (Action-Logs sind öffentlich).
// Empfänger: nicht gesperrte Zugänge mit Admin-Recht, je nach Einstellung „Neue Anmeldungen“ (notify-prefs.mjs).

import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
import { loadPushDevices, pushToUser } from './push-lib.mjs';
import { adminWants } from './notify-prefs.mjs';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const readJson = async (p, fb) => { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch (e) { return fb; } };
const ROLES = { trainer: 'Trainer', jugendleiter: 'Jugendleiter', vorstand: 'Vorstand' };

async function main() {
  let p = {};
  try { p = JSON.parse(process.env.PAYLOAD || '{}'); } catch (e) { console.log('Payload unlesbar – überspringe.'); return; }
  const name = String(p.name || 'Jemand').slice(0, 130);
  const role = ROLES[p.role] || 'Trainer';
  const teams = Array.isArray(p.teams) ? p.teams.filter(t => typeof t === 'string').slice(0, 12) : [];

  const cfg = await readJson('data/config.json', {});
  const users = (await readJson('data/users.json', { users: [] })).users || [];
  const admins = users.filter(u => u.admin && !u.locked);
  const site = String(cfg.siteUrl || 'https://platzcoach.de/').replace(/\/?$/, '/');
  const line = name + ' (' + role + (teams.length ? ', ' + teams.join(', ') : '') + ')';

  // Push
  const devices = await loadPushDevices(cfg);
  let pushed = 0;
  for (const u of admins.filter(x => adminWants(x, 'push', 'reg'))) {
    pushed += await pushToUser(cfg, devices, u.id, {
      title: 'Neue Anmeldung',
      body: line + ' wartet auf Freigabe.',
      url: site,
      tag: 'pc-registration',
    });
  }
  console.log(`${pushed} Push-Nachricht(en) an Admins.`);

  // Mail
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) { console.log('SMTP-Secrets fehlen – nur Push.'); return; }
  const recipients = admins.filter(u => u.email && u.emailNotificationsEnabled !== false && adminWants(u, 'mail', 'reg'));
  if (!recipients.length) { console.log('Keine Admin-Empfänger für die Mail.'); return; }
  const clubName = cfg.clubName || 'Platzcoach';
  const fromAddress = (cfg.notify && cfg.notify.fromEmail) || process.env.SMTP_USER;
  const replyTo = (cfg.notify && cfg.notify.replyTo) || '';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  const subject = 'Platzcoach: Neue Anmeldung – ' + name;
  for (const u of recipients) {
    const text = `Hallo ${u.first || ''},\n\n${line} hat sich über den Einladungslink angemeldet und wartet auf Freigabe.\n\nFreigeben oder ablehnen: Platzcoach → Konto → Zugänge\n${site}\n\nAutomatische Benachrichtigung von Platzcoach (${clubName}).`;
    const html = `<p>Hallo ${esc(u.first || '')},</p><p><b>${esc(line)}</b> hat sich über den Einladungslink angemeldet und wartet auf Freigabe.</p>`
      + `<p><a href="${esc(site)}" style="display:inline-block;background:#0B1B32;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;">Platzcoach öffnen</a></p>`
      + `<p>Freigeben oder ablehnen unter <b>Konto → Zugänge</b>.</p><p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach (${esc(clubName)}).</p>`;
    try {
      await transporter.sendMail({ from: `Platzcoach <${fromAddress}>`, to: u.email, replyTo: replyTo || undefined, subject, text, html, headers: { 'X-Entity-Ref-ID': randomUUID() } });
      console.log('Mail an Admin ' + u.id + ' gesendet.');
    } catch (e) { console.error('Mail an ' + u.id + ' fehlgeschlagen:', e.message); }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
