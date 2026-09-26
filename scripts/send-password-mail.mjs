// scripts/send-password-mail.mjs
//
// Verschickt die beiden Passwort-Mails von Platzcoach:
//   - MAIL_TYPE=password-reset-link: Link zum Zurücksetzen ("Passwort vergessen?"), ausgelöst
//     vom Passwort-Worker (worker/password-reset-worker.js)
//   - MAIL_TYPE=password-changed:    Bestätigung "Dein Passwort wurde geändert", ausgelöst von
//     der App nach jeder Passwortänderung
//
// Wie bei send-welcome-password.mjs: ausgelöst per repository_dispatch, nie per Commit.
// Der Reset-Link ist geheim – NIE loggen (auch nicht bei Fehlern, nur err.message ausgeben).
//
// Umgebungsvariablen: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (Secrets),
// MAIL_TYPE, PAYLOAD_NAME, PAYLOAD_EMAIL, PAYLOAD_LINK (nur beim Reset-Link).

import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main() {
  const type = process.env.MAIL_TYPE || '';
  const name = process.env.PAYLOAD_NAME || '';
  const email = process.env.PAYLOAD_EMAIL || '';
  const link = process.env.PAYLOAD_LINK || '';

  if (!email || !name) { console.log('Fehlende Angaben im Dispatch-Payload – überspringe.'); return; }
  if (type === 'password-reset-link' && !/^https:\/\/[^\s]+#reset=[A-Za-z0-9_-]+$/.test(link)) {
    console.log('Ungültiger oder fehlender Link – überspringe.'); return;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP-Zugangsdaten (Secrets) fehlen – überspringe.'); return;
  }

  const cfg = JSON.parse(await fs.readFile('data/config.json', 'utf8'));
  const clubName = cfg.clubName || 'Platzcoach';
  const fromAddress = (cfg.notify && cfg.notify.fromEmail) || process.env.SMTP_USER;
  const replyTo = (cfg.notify && cfg.notify.replyTo) || '';
  const firstName = name.split(' ')[0] || name;
  const wrap = inner => `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;">${inner}<p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach.</p></div>`;

  let subject, text, html;
  if (type === 'password-reset-link') {
    subject = 'Passwort zurücksetzen – Platzcoach';
    text = `Hallo ${firstName},\n\nfür deinen Platzcoach-Zugang (${clubName}) wurde ein neues Passwort angefordert. Über diesen Link kannst du ein neues Passwort festlegen:\n\n${link}\n\nDer Link ist 60 Minuten gültig und funktioniert nur einmal.\n\nDu hast das nicht angefordert? Dann ignoriere diese E-Mail einfach – dein bisheriges Passwort bleibt gültig.`;
    html = wrap(`<p>Hallo ${escapeHtml(firstName)},</p>
      <p>für deinen Platzcoach-Zugang (${escapeHtml(clubName)}) wurde ein neues Passwort angefordert.</p>
      <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#0B1B32;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;">Neues Passwort festlegen</a></p>
      <p>Der Link ist <b>60 Minuten</b> gültig und funktioniert nur einmal.</p>
      <p>Du hast das nicht angefordert? Dann ignoriere diese E-Mail einfach – dein bisheriges Passwort bleibt gültig.</p>`);
  } else if (type === 'password-changed') {
    subject = 'Dein Platzcoach-Passwort wurde geändert';
    text = `Hallo ${firstName},\n\ndas Passwort deines Platzcoach-Zugangs (${clubName}) wurde soeben geändert.\n\nWarst du das nicht? Dann melde dich bitte umgehend beim Vorstand oder antworte auf diese E-Mail.`;
    html = wrap(`<p>Hallo ${escapeHtml(firstName)},</p>
      <p>das Passwort deines Platzcoach-Zugangs (${escapeHtml(clubName)}) wurde soeben geändert.</p>
      <p><b>Warst du das nicht?</b> Dann melde dich bitte umgehend beim Vorstand oder antworte auf diese E-Mail.</p>`);
  } else {
    console.log('Unbekannter Mail-Typ – überspringe.'); return;
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
        headers: { 'X-Entity-Ref-ID': randomUUID() }, // eindeutig: Gmail gruppiert/kürzt Mails nicht
    from: `Platzcoach <${fromAddress}>`,
    ...(replyTo ? { replyTo } : {}),
    to: email, subject, text, html,
  });
  console.log(`${type}: E-Mail an ${email} gesendet.`);
}

main().catch(err => {
  console.error('Passwort-Mail fehlgeschlagen:', err.message);
  process.exit(1);
});
