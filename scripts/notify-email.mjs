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
const SEASONS_PATH = 'data/seasons.json';

async function loadConfig() {
  return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
}
async function loadSeasons() {
  try {
    const raw = JSON.parse(await fs.readFile(SEASONS_PATH, 'utf8'));
    return Array.isArray(raw.seasons) ? raw.seasons : [];
  } catch (e) {
    return [];
  }
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

// KATEGORIEN statt einer einzigen Whitelist: Nur Commit-Nachrichten, die Platzcoach selbst
// beim Speichern erzeugt, werden berücksichtigt (GitHub-eigene Nachrichten wie "Add files via
// upload" fallen automatisch raus). Jede Nachricht gehört zu genau einer Kategorie. Wer welche
// Kategorie per E-Mail bekommt, legt die Rolle fest (siehe ROLE_CATEGORIES bzw.
// config.json → notify.categories). Wird in index.html eine neue Aktion ergänzt, muss ihr
// Präfix hier einer Kategorie zugeordnet werden, sonst wird sie nicht verschickt.
const CATEGORIES = {
  termine:     ['Neuer Termin:', 'Termin geändert:', 'Termin gelöscht:'],
  training:    ['Trainingszeit angelegt:', 'Trainingszeit geändert:', 'Trainingszeit gelöscht:',
                'Training abgesagt:', 'Absage zurückgenommen:', 'Torwarttraining-Anmeldung geändert:'],
  sperren:     ['Sperre angelegt:', 'Sperre aufgehoben:'],
  verwaltung:  ['Zugang angelegt:', 'Zugang gelöscht:', 'Zugang gesperrt:', 'Zugang entsperrt:',
                'Admin-Recht vergeben:', 'Admin-Recht entzogen:',
                'Mannschaften zugewiesen:', 'Trainer-Zuordnung aktualisiert:', 'Trainer-Zuordnung entfernt:',
                'Trainer zur Saison', 'Trainer aus Saison', 'Trainer auto-zugewiesen (',
                'Saison angelegt:', 'Saison gelöscht:', 'Team-Zuordnung (', 'Aus Saison(s) entfernt'],
  // Persönliches geht an NIEMANDEN per Mail (steht nur im Protokoll der App).
  persoenlich: ['Passwort geändert:', 'Profil geändert:', 'E-Mail-Benachrichtigungen'],
};
// Standard: Trainer bekommen Termine, Training und Platzsperren; Admins zusätzlich die Verwaltung.
// Überschreibbar in config.json: "notify": {"categories": {"trainer": [...], "admin": [...]}}
const ROLE_CATEGORIES = {
  trainer: ['termine', 'training', 'sperren'],
  admin:   ['termine', 'training', 'sperren', 'verwaltung'],
};
// Mannschaften, die einem Trainer "gehören" können. Termine/Training anderer Kategorien
// (z. B. "Alle Teams", "Vorstand") gelten als vereinsweit und gehen an alle Trainer.
const TEAM_CLASSES = ['G-Jugend', 'F-Jugend', 'E-Jugend', 'D-Jugend', 'C-Jugend', 'B-Jugend', 'A-Jugend',
  '1. Herren', '2. Herren', '3. Herren', 'Ü32 / Ü50', 'Torwarttraining'];

// Zerlegt eine Commit-Nachricht in den sichtbaren Text (erster Absatz) und die unsichtbaren
// Zusatzzeilen, die die App anhängt ("Platzcoach-Team: E-Jugend#2", "Platzcoach-By: <id>").
function parseCommit(raw) {
  const text = raw.split(/\n\s*\n/)[0].trim();
  const team = raw.match(/^Platzcoach-Team: (.+)#(\d+)\s*$/m);
  const by = raw.match(/^Platzcoach-By: (\S+)\s*$/m);
  // Torwarttraining: betroffene Mannschaften und Organisator(en)
  const gk = raw.match(/^Platzcoach-GK: (.+)$/m);
  const orga = raw.match(/^Platzcoach-Orga: (.+)$/m);
  return {
    text,
    gkTeams: gk ? gk[1].split(',').map(s => s.trim()).filter(Boolean) : [],
    orga: orga ? orga[1].split(',').map(s => s.trim()).filter(Boolean) : [],
    team: team ? team[1].trim() : null,
    squad: team ? parseInt(team[2], 10) : null,
    by: by ? by[1] : null,
    category: categoryOf(text),
  };
}
function categoryOf(text) {
  for (const [cat, prefixes] of Object.entries(CATEGORIES)) {
    if (prefixes.some(p => text.startsWith(p))) return cat;
  }
  return null; // nicht von Platzcoach -> ignorieren
}
function isFromPlatzcoach(msg) {
  return categoryOf(msg.split(/\n\s*\n/)[0].trim()) !== null;
}
// Automatische Bot-Läufe und Aufräumarbeiten der App gehen nie per Mail raus.
function isNoisyCommit(text) {
  return /^Heimspiele von fussball\.de aktualisiert/i.test(text) || /\(automatisch\)/.test(text);
}

// Erkennt "Zugang angelegt: Marc Krause (Admin) – David Skwara" bzw. ohne "(Admin)" und
// liefert den vollen Namen ("Marc Krause") des NEU angelegten Nutzers zurück, oder null.
function newAccountNameFromCommit(msg) {
  const m = msg.match(/^Zugang angelegt: (.+?)(?: \(Admin\))? – /);
  return m ? m[1].trim() : null;
}

async function sendWelcomeEmails(messages, users, transporter, clubName, fromAddress, siteUrl, replyTo) {
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
        from: `Platzcoach <${fromAddress}>`, // Absendername bewusst immer "Platzcoach" (SaaS); der Verein steht im Text
        ...(replyTo ? { replyTo } : {}),
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

// Mannschaften eines Trainers in der aktuell laufenden Saison ({Team: [Squads]}, [] = alle Squads).
function trainerClassesFor(user, seasons, today) {
  const cur = seasons.find(s => s.from <= today && s.to >= today);
  if (cur && cur.trainerClasses && cur.trainerClasses[user.id]) return cur.trainerClasses[user.id];
  return user.classes || {};
}
function concernsTrainer(c, classes, userId) {
  if (c.category !== 'termine' && c.category !== 'training') return true; // z. B. Platzsperren: vereinsweit
  // Torwarttraining: Organisator, Torwarttrainer und Trainer der gewählten Mannschaften
  if (c.team === 'Torwarttraining') {
    if (userId && c.orga.includes(userId)) return true;
    if (classes['Torwarttraining']) return true;
    return c.gkTeams.some(t => classes[t]);
  }
  if (!c.team) return true;                               // ältere Nachricht ohne Mannschaftsangabe
  if (!TEAM_CLASSES.includes(c.team)) return true;        // "Alle Teams", "Vorstand" usw.
  const squads = classes[c.team];
  if (!squads) return false;
  return !squads.length || !/Jugend/.test(c.team) || squads.includes(c.squad);
}

async function main() {
  const cfg = await loadConfig();
  const notify = cfg.notify || {};
  const roleCats = { ...ROLE_CATEGORIES, ...(notify.categories || {}) };
  const today = new Date().toISOString().slice(0, 10);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP-Zugangsdaten (Secrets) fehlen – überspringe Benachrichtigung.');
    return;
  }
  const users = await loadUsers();
  const seasons = await loadSeasons();

  // Empfänger: jeder nicht gesperrte Zugang mit eingeschalteten Benachrichtigungen (Rolle aus
  // dem Admin-Recht) plus die festen Adressen aus config.json → notify.emails (gelten als Admin).
  const recipients = new Map();
  users.filter(u => u.emailNotificationsEnabled !== false && !u.locked && u.email).forEach(u => {
    recipients.set(u.email.trim().toLowerCase(), { email: u.email.trim().toLowerCase(), user: u, role: u.admin ? 'admin' : 'trainer' });
  });
  (Array.isArray(notify.emails) ? notify.emails : []).filter(Boolean).forEach(e => {
    const email = e.trim().toLowerCase();
    if (!recipients.has(email)) recipients.set(email, { email, user: null, role: 'admin' });
  });

  const allMessages = getCommitMessages();
  const platzcoachMessages = allMessages.filter(isFromPlatzcoach);
  // git log liefert neueste zuerst – für die Mail chronologisch (älteste zuerst) sortieren.
  const changes = platzcoachMessages.map(parseCommit).filter(c => !isNoisyCommit(c.text)).reverse();
  console.log(`${allMessages.length} Commit(s) im Push, davon ${platzcoachMessages.length} von Platzcoach, ${changes.length} nach Filter. Kategorien: ${JSON.stringify(changes.map(c => c.category))}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_PORT || '587') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const clubName = cfg.clubName || cfg.club || 'Platzcoach';
  const fromAddress = notify.fromEmail || process.env.SMTP_USER;
  // Antworten auf Platzcoach-Mails landen hier statt bei der noreply-Absenderadresse.
  const replyTo = notify.replyTo || '';

  // Willkommens-Mail(s) an neu angelegte Zugänge (ohne Passwort – das kommt separat über den
  // Dispatch-Weg, siehe send-welcome-password.mjs).
  await sendWelcomeEmails(platzcoachMessages.map(m => m.split(/\n\s*\n/)[0].trim()), users, transporter, clubName, fromAddress, cfg.siteUrl, replyTo);

  if (!changes.length) {
    console.log('Keine für die Benachrichtigung relevanten Änderungen.');
    return;
  }

  // Jede Person bekommt eine EIGENE Mail (keine offene Empfängerliste) und nur das, was sie
  // betrifft: passende Kategorie für ihre Rolle, bei Trainern nur eigene Mannschaften +
  // Vereinsweites, und nie die eigenen Änderungen.
  let sent = 0;
  for (const r of recipients.values()) {
    const allowed = roleCats[r.role] || [];
    const classes = r.user ? trainerClassesFor(r.user, seasons, today) : {};
    const mine = changes.filter(c =>
      allowed.includes(c.category)
      && !(r.user && c.by && c.by === r.user.id)
      && (r.role === 'admin' || concernsTrainer(c, classes, r.user && r.user.id)));
    if (!mine.length) continue;
    const texts = mine.map(c => c.text);
    const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;">
      <p><strong>${escapeHtml(clubName)}</strong> – es gab folgende Änderung${texts.length === 1 ? '' : 'en'} in Platzcoach:</p>
      <ul>${texts.map(t => `<li style="margin-bottom:6px;">${escapeHtml(t)}</li>`).join('')}</ul>
      <p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach. Details siehst du in der App. Benachrichtigungen kannst du im Profil abschalten.</p>
    </div>`;
    const text = `${clubName} – Änderungen in Platzcoach:\n\n` + texts.map(t => `- ${t}`).join('\n');
    try {
      await transporter.sendMail({
        from: `Platzcoach <${fromAddress}>`, // Absendername bewusst immer "Platzcoach" (SaaS); der Verein steht im Text
        ...(replyTo ? { replyTo } : {}),
        to: r.email,
        subject: `Platzcoach: ${texts.length} Änderung${texts.length === 1 ? '' : 'en'}`,
        text,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Senden an ${r.email} fehlgeschlagen:`, err.message);
    }
  }
  console.log(`${sent} E-Mail(s) an einzelne Empfänger gesendet (von ${recipients.size} möglichen).`);
}

main().catch(err => {
  console.error('Benachrichtigung fehlgeschlagen:', err);
  process.exit(1);
});
