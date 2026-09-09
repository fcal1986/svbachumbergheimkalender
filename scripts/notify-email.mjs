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

async function loadConfig() {
  return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
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

// Commits, die selbst KEINE Benachrichtigung auslösen sollen (automatische Bot-Läufe,
// sonst gäbe es bei jedem fussball.de-Sync eine E-Mail).
function isNoisyCommit(msg) {
  return /^Heimspiele von fussball\.de aktualisiert/i.test(msg);
}

async function main() {
  const cfg = await loadConfig();
  const notify = cfg.notify || {};
  const recipients = Array.isArray(notify.emails) ? notify.emails.filter(Boolean) : [];

  if (!recipients.length) {
    console.log('Kein "notify.emails" in data/config.json konfiguriert – überspringe Benachrichtigung.');
    return;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP-Zugangsdaten (Secrets) fehlen – überspringe Benachrichtigung.');
    return;
  }

  const allMessages = getCommitMessages();
  const messages = allMessages.filter(m => !isNoisyCommit(m));
  console.log(`${allMessages.length} Commit(s) im Push, davon ${messages.length} relevant.`);
  if (!messages.length) {
    console.log('Keine benachrichtigungsrelevanten Änderungen – keine E-Mail nötig.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_PORT || '587') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const clubName = cfg.club || 'Platzcoach';
  const listHtml = messages.map(m => `<li style="margin-bottom:6px;">${escapeHtml(m)}</li>`).join('');
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;">
      <p><strong>${escapeHtml(clubName)}</strong> – es gab folgende Änderung${messages.length === 1 ? '' : 'en'} in Platzcoach:</p>
      <ul>${listHtml}</ul>
      <p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach. Antworten auf diese E-Mail führt zu nichts – bitte direkt in der App nachsehen.</p>
    </div>`;
  const text = `${clubName} – Änderungen in Platzcoach:\n\n` + messages.map(m => `- ${m}`).join('\n');

  await transporter.sendMail({
    from: `${clubName} <${notify.fromEmail || process.env.SMTP_USER}>`,
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
