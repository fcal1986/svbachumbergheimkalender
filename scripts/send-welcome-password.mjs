// scripts/send-welcome-password.mjs
//
// Verschickt das Start-Passwort eines neu angelegten Zugangs per E-Mail.
//
// WICHTIG zur Sicherheit: Dieses Skript wird NICHT durch einen Commit ausgelöst, sondern
// durch ein GitHub "repository_dispatch"-Event (siehe .github/workflows/welcome-password-email.yml).
// Das Passwort landet dadurch NIE in einer Datei oder einer Commit-Nachricht und damit auch
// nie dauerhaft in der (bei euch öffentlichen!) Git-Historie – es existiert nur kurz als
// Umgebungsvariable während dieses einen Laufs. Aus genau diesem Grund: Das Passwort an
// KEINER Stelle in dieser Datei loggen (auch nicht bei Fehlern – nur err.message ausgeben).
//
// Erwartete Umgebungsvariablen: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (Secrets) sowie
// PAYLOAD_NAME, PAYLOAD_EMAIL, PAYLOAD_PASSWORD (aus dem Dispatch-Payload, vom Workflow gesetzt).

import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';

const CONFIG_PATH = 'data/config.json';

async function loadConfig() {
  return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  const name = process.env.PAYLOAD_NAME || '';
  const email = process.env.PAYLOAD_EMAIL || '';
  const password = process.env.PAYLOAD_PASSWORD || '';

  if (!name || !email || !password) {
    console.log('Fehlende Angaben im Dispatch-Payload (Name/E-Mail/Passwort) – überspringe.');
    return;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP-Zugangsdaten (Secrets) fehlen – überspringe.');
    return;
  }

  const cfg = await loadConfig();
  const clubName = cfg.club || 'Platzcoach';
  const fromAddress = (cfg.notify && cfg.notify.fromEmail) || process.env.SMTP_USER;
  const firstName = name.split(' ')[0] || name;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_PORT || '587') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;">
      <p>Hallo ${escapeHtml(firstName)},</p>
      <p>hier ist dein Start-Passwort für Platzcoach (${escapeHtml(clubName)}):</p>
      <p style="font-size:20px;font-weight:bold;background:#F0FBF4;padding:10px 16px;border-radius:8px;display:inline-block;">${escapeHtml(password)}</p>
      <p>Anmelden kannst du dich damit unter deiner E-Mail-Adresse <strong>${escapeHtml(email)}</strong>. Bitte bewahre das Passwort sicher auf und leite diese E-Mail nicht weiter.</p>
      <p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach.</p>
    </div>`;
  const text = `Hallo ${firstName},\n\nhier ist dein Start-Passwort für Platzcoach (${clubName}):\n\n${password}\n\nAnmelden kannst du dich damit unter deiner E-Mail-Adresse ${email}. Bitte bewahre das Passwort sicher auf und leite diese E-Mail nicht weiter.`;

  await transporter.sendMail({
    from: `${clubName} <${fromAddress}>`,
    to: email,
    subject: 'Dein Start-Passwort für Platzcoach',
    text,
    html,
  });
  console.log(`Passwort-E-Mail an ${email} gesendet.`); // Das Passwort selbst wird hier bewusst NIE ausgegeben.
}

main().catch(err => {
  console.error('Passwort-E-Mail fehlgeschlagen:', err.message); // nur .message, kein Objekt-Dump
  process.exit(1);
});
