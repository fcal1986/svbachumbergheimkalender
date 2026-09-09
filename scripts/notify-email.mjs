// scripts/notify-email.mjs
//
// Sendet eine E-Mail-Benachrichtigung, sobald sich in Platzcoach etwas ändert
// (neuer/geänderter/gelöschter Termin, neue Trainingszeit, neue Saison-Zuordnung, …).
//
// Warum über Commit-Nachrichten statt JSON-Diff? Jede Speicherung in Platzcoach schreibt
// bereits eine aussagekräftige Commit-Nachricht (z.B. "Termin gelöscht: Vorstandssitzung –
// 1. Herren · 19:00–21:00 · 07.09.2026 – David Skwara"). Diese Nachrichten 1:1 zu versenden
// ist robuster und einfacher zu pflegen als die JSON-Dateien inhaltlich zu vergleichen.
//
// Aufruf: node scripts/notify-email.mjs
// Erwartet die Umgebungsvariablen SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS sowie
// GITHUB_EVENT_BEFORE und GITHUB_SHA (werden vom Workflow gesetzt).

import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import nodemailer from 'nodemailer';

const CONFIG_PATH = 'data/config.json';
const USERS_PATH = 'data/users.json';

async function loadConfig() {
  return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
}
async function loadUsers() {
  try {
    const raw = JSON.parse(await fs.readFile(USERS_PATH, 'utf8'));
    return Array.isArray(raw.users) ? raw.users : [];
  } catch (e) {
    return [];
  }
}

// Holt die Commit-Nachrichten aller Commits im aktuellen Push. Ist "before" nicht bekannt
// (z.B. erster Push, oder Force-Push ohne verlässliche Basis), wird nur der letzte Commit
// genommen, statt zu raten.
function getCommitMessages() {
  const before = process.env.GITHUB_EVENT_BEFORE;
  const after = process.env.GITHUB_SHA || 'HEAD';
  const hasValidBefore = before && !/^0+$/.test(before);
  try {
    const range = hasValidBefore ? `${before}..${after}` : after;
    // Trennzeichen darf weder Null-Bytes (execSync lehnt das ab) noch Shell-Sonderzeichen
    // wie < > | & enthalten (der Befehl läuft durch /bin/sh) – rein alphanumerisch ist sicher.
    const sep = '___PLATZCOACH_COMMIT_END___';
    const raw = execSync(`git log ${hasValidBefore ? range : '-1 ' + after} --pretty=format:%B${sep}`, { maxBuffer: 10 * 1024 * 1024 }).toString();
    return raw.split(sep).map(s => s.trim()).filter(Boolean);
  } catch (err) {
    console.error('Konnte Commit-Nachrichten nicht lesen:', err.message);
    return [];
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Commits, die selbst KEINE Benachrichtigung in der allgemeinen Sammel-Mail auslösen sollen:
// - automatische Bot-Läufe (fussball.de-Sync), sonst gäbe es alle 6h eine E-Mail.
// - "Zugang angelegt" – die neue Person bekommt dafür bereits ihre eigene Willkommens- und
//   Passwort-Mail; alle ANDEREN müssen nicht separat informiert werden, dass irgendwo ein
//   neuer Zugang entstanden ist.
function isNoisyCommit(msg) {
  return /^Heimspiele von fussball\.de aktualisiert/i.test(msg)
    || /^Zugang angelegt: /i.test(msg);
}

// Erkennt "Zugang angelegt: Marc Krause (Admin) – David Skwara" bzw. ohne "(Admin)" und
// liefert den vollen Namen ("Marc Krause") des NEU angelegten Nutzers zurück, oder null.
function newAccountNameFromCommit(msg) {
  const m = msg.match(/^Zugang angelegt: (.+?)(?: \(Admin\))? – /);
  return m ? m[1].trim() : null;
}

async function sendWelcomeEmails(messages, users, transporter, clubName, fromAddress, siteUrl) {
  const newAccountNames = messages.map(newAccountNameFromCommit).filter(Boolean);
  for (const fullName of newAccountNames) {
    // Bewusst per Namensabgleich statt ID – die Commit-Nachricht selbst enthält keine ID.
    // Bei zwei gleichnamigen Personen träfe das im seltenen Fall beide oder die falsche;
    // das ist eine akzeptierte Grenze dieses Text-basierten Ansatzes (wie beim Rest des
    // Benachrichtigungssystems auch).
    const user = users.find(u => `${u.first} ${u.last}`.trim() === fullName && !u.locked);
    if (!user || !user.email) {
      console.log(`  [Willkommens-Mail] Konnte "${fullName}" keinem Zugang mit E-Mail zuordnen – übersprungen.`);
      continue;
    }
    const linkHtml = siteUrl ? `<p><a href="${escapeHtml(siteUrl)}" style="color:#16A34A;">${escapeHtml(siteUrl)}</a></p>` : '';
    const linkText = siteUrl ? `\n${siteUrl}\n` : '';
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;">
        <p>Hallo ${escapeHtml(user.first)},</p>
        <p>dein Zugang für <strong>${escapeHtml(clubName)}</strong> in Platzcoach wurde eingerichtet – schön, dass du dabei bist! 👋</p>
        <p>Deine Anmeldung erfolgt mit dieser E-Mail-Adresse: <strong>${escapeHtml(user.email)}</strong><br>
        Das Start-Passwort dazu hast du (oder bekommst du) direkt vom Vorstand.</p>
        ${linkHtml}
        <p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach.</p>
      </div>`;
    const text = `Hallo ${user.first},\n\ndein Zugang für ${clubName} in Platzcoach wurde eingerichtet – schön, dass du dabei bist!\n\nDeine Anmeldung erfolgt mit dieser E-Mail-Adresse: ${user.email}\nDas Start-Passwort dazu hast du (oder bekommst du) direkt vom Vorstand.\n${linkText}`;
    try {
      await transporter.sendMail({
        from: `${clubName} <${fromAddress}>`,
        to: user.email,
        subject: `Willkommen bei ${clubName} in Platzcoach!`,
        text,
        html,
      });
      console.log(`  [Willkommens-Mail] An ${user.email} (${fullName}) gesendet.`);
    } catch (err) {
      console.error(`  [Willkommens-Mail] Senden an ${user.email} fehlgeschlagen:`, err.message);
    }
  }
}

async function main() {
  const cfg = await loadConfig();
  const notify = cfg.notify || {};

  // Empfänger kommen aus ZWEI Quellen, zusammengeführt und dedupliziert:
  // 1. Jeder Platzcoach-Zugang mit aktivierten E-Mail-Benachrichtigungen (Login-E-Mail wird
  //    verwendet – es gibt bewusst kein separates Notification-E-Mail-Feld). Ein fehlender
  //    Wert (bei Zugängen von vor dieser Funktion) zählt als aktiviert, siehe index.html.
  // 2. Die weiterhin unterstützte feste Liste "notify.emails" in config.json, z.B. für ein
  //    allgemeines Vorstands-Postfach, das kein eigener Platzcoach-Zugang ist.
  const users = await loadUsers();
  const optedInUserEmails = users
    .filter(u => u.emailNotificationsEnabled !== false && !u.locked)
    .map(u => (u.email || '').trim().toLowerCase())
    .filter(Boolean);
  const configEmails = (Array.isArray(notify.emails) ? notify.emails : [])
    .filter(Boolean).map(e => e.trim().toLowerCase());
  const recipients = [...new Set([...optedInUserEmails, ...configEmails])];
  console.log(`Empfänger: ${optedInUserEmails.length} User mit aktivierten Benachrichtigungen und nicht gesperrtem Zugang (von ${users.length} Zugängen insgesamt) + ${configEmails.length} feste Adresse(n) aus config.json = ${recipients.length} eindeutige Empfänger.`);

  if (!recipients.length) {
    console.log('Keine Empfänger (weder User mit aktivierten Benachrichtigungen noch "notify.emails" in config.json) – überspringe Benachrichtigung.');
    return;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP-Zugangsdaten (Secrets) fehlen – überspringe Benachrichtigung.');
    return;
  }

  const allMessages = getCommitMessages();
  const messages = allMessages.filter(m => !isNoisyCommit(m));
  console.log(`${allMessages.length} Commit(s) im Push, davon ${messages.length} für die Sammel-Mail relevant.`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_PORT || '587') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const clubName = cfg.club || 'Platzcoach';
  const fromAddress = notify.fromEmail || process.env.SMTP_USER;

  // Willkommens-Mail(s) an neu angelegte Zugänge – bewusst aus ALLEN Commits erkannt
  // (nicht aus der oben gefilterten "messages"-Liste!), da "Zugang angelegt" ja gerade
  // NICHT in der allgemeinen Sammel-Mail unten auftauchen soll, aber die neue Person
  // trotzdem ihre eigene Willkommens-Mail bekommen muss. Bewusst OHNE Passwort (siehe
  // Absprache) – das kommt separat über den Dispatch-Weg (send-welcome-password.mjs).
  await sendWelcomeEmails(allMessages, users, transporter, clubName, fromAddress, cfg.siteUrl);

  if (!messages.length) {
    console.log('Keine für die Sammel-Mail relevanten Änderungen – keine weitere E-Mail nötig.');
    return;
  }

  const listHtml = messages.map(m => `<li style="margin-bottom:6px;">${escapeHtml(m)}</li>`).join('');
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;">
      <p><strong>${escapeHtml(clubName)}</strong> – es gab folgende Änderung${messages.length === 1 ? '' : 'en'} in Platzcoach:</p>
      <ul>${listHtml}</ul>
      <p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach. Antworten auf diese E-Mail führt zu nichts – bitte direkt in der App nachsehen.</p>
    </div>`;
  const text = `${clubName} – Änderungen in Platzcoach:\n\n` + messages.map(m => `- ${m}`).join('\n');

  await transporter.sendMail({
    from: `${clubName} <${fromAddress}>`,
    to: recipients.join(', '),
    subject: `Platzcoach: ${messages.length} Änderung${messages.length === 1 ? '' : 'en'}`,
    text,
    html,
  });
  console.log(`E-Mail mit ${messages.length} Änderung(en) an ${recipients.length} Empfänger gesendet.`);
}

main().catch(err => {
  console.error('Benachrichtigung fehlgeschlagen:', err);
  process.exit(1);
});
