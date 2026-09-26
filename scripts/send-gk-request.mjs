// scripts/send-gk-request.mjs
//
// E-Mails zum Torwarttraining, ausgelöst von der App per repository_dispatch:
//   gk-signup-request: "Bitte meldet eure Torhüter an oder ab" (beim Anlegen / "Trainer erinnern")
//   gk-cancelled:      "Torwarttraining fällt aus" (Termin gelöscht, Tag abgesagt, feste Zeit gestrichen)
// Enthält bewusst KEINE Spielernamen.
//
// Payload: teams (["E-Jugend","1. Herren"], leer = alle Mannschaften), title, when, link, note,
//          byId, byName, organizerIds
// Empfänger: der Organisator (organizerIds, immer) + alle nicht gesperrten Zugänge, die in der
// laufenden Saison eine der Mannschaften trainieren und E-Mails nicht abgeschaltet haben.

import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const readJson = async (p, fb) => { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch (e) { return fb; } };

async function main() {
  let p = {};
  try { p = JSON.parse(process.env.PAYLOAD || '{}'); } catch (e) { console.log('Payload unlesbar – überspringe.'); return; }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) { console.log('SMTP-Secrets fehlen – überspringe.'); return; }
  const teams = Array.isArray(p.teams) ? p.teams.filter(t => typeof t === 'string') : [];
  const link = /^https:\/\/[^\s"<>]+$/.test(p.link || '') ? p.link : '';

  const cfg = await readJson('data/config.json', {});
  const users = (await readJson('data/users.json', { users: [] })).users || [];
  const seasons = (await readJson('data/seasons.json', { seasons: [] })).seasons || [];
  const today = new Date().toISOString().slice(0, 10);
  const cur = seasons.find(s => s.from <= today && s.to >= today);
  const classesOf = u => (cur && cur.trainerClasses && cur.trainerClasses[u.id]) || u.classes || {};

  const wanted = teams.length ? teams : null;
  const organizers = new Set(Array.isArray(p.organizerIds) ? p.organizerIds : []);
  const recipients = users.filter(u => {
    if (!u.email || u.locked) return false;
    if (organizers.has(u.id)) return true; // Organisator bekommt jede Mail (auch die eigene Erinnerung)
    if (u.emailNotificationsEnabled === false) return false;
    const cls = Object.keys(classesOf(u));
    return cls.some(t => t !== 'Torwarttraining' && (!wanted || wanted.includes(t)));
  });
  if (!recipients.length) { console.log('Keine Empfänger für ' + (teams.join(', ') || 'alle Mannschaften') + '.'); return; }

  const clubName = cfg.clubName || 'Platzcoach';
  const fromAddress = (cfg.notify && cfg.notify.fromEmail) || process.env.SMTP_USER;
  const replyTo = (cfg.notify && cfg.notify.replyTo) || '';
  const teamsText = teams.length ? teams.join(', ') : 'alle Mannschaften';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });

  const cancel = process.env.MAIL_TYPE === 'gk-cancelled';
  // Als Tabelle statt <p>: E-Mail-Programme stellen Rahmen/Hintergrund so zuverlässiger dar.
  const box = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:12px 0;"><tr><td style="background:#FFF8EE;border:1px solid #F5C58A;border-radius:10px;padding:10px 14px;font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;"><b>${esc(p.when || '')}</b><br>Für: ${esc(teamsText)}</td></tr></table>`;
  const btn = link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#0B1B32;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;">Platzcoach öffnen</a></p>` : '';
  const foot = `<p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach (${esc(clubName)}).</p>`;
  for (const u of recipients) {
    const isOrg = organizers.has(u.id);
    let subject, text, html;
    if (cancel) {
      subject = `Abgesagt: ${p.title || 'Torwarttraining'} (${p.when || ''})`;
      text = `Hallo ${u.first},\n\ndas ${p.title || 'Torwarttraining'} fällt aus:\n\n${p.when || ''}\nFür: ${teamsText}\n${p.note ? '\n' + p.note + '\n' : ''}\nAbgesagt von: ${p.byName || 'Platzcoach'}\n${link ? '\n' + link + '\n' : ''}\n${clubName}`;
      html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;"><p>Hallo ${esc(u.first)},</p>
        <p>das <b>${esc(p.title || 'Torwarttraining')}</b> fällt aus:</p>${box}
        ${p.note ? `<p>${esc(p.note)}</p>` : ''}<p>Abgesagt von: ${esc(p.byName || 'Platzcoach')}</p>${btn}${foot}</div>`;
    } else {
      subject = `${p.reminder ? 'Erinnerung – ' : ''}Torwarttraining: bitte Torhüter an- oder abmelden (${p.when || ''})`;
      const intro = isOrg && u.id === p.byId ? 'Kopie für dich als Organisator: Die Trainer wurden gebeten, ihre Torhüter' : `${p.byName || 'Der Torwarttrainer'} bittet dich, deine Torhüter`;
      text = `Hallo ${u.first},\n\n${intro} für das ${p.title || 'Torwarttraining'} an- oder abzumelden:\n\n${p.when || ''}\nFür: ${teamsText}\n\nSo geht's: In Platzcoach anmelden → Termin öffnen → „Torhüter an-/abmelden“. Torhüter trägst du einmalig unter Konto → Profil → „Meine Torhüter“ ein.\n${link ? '\n' + link + '\n' : ''}\nSo weiß der Torwarttrainer, wer kommt – und kann das Training rechtzeitig absagen, wenn zu wenige dabei sind.\n\n${clubName}`;
      html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;"><p>Hallo ${esc(u.first)},</p>
        <p>${esc(intro)} für das ${esc(p.title || 'Torwarttraining')} an- oder abzumelden:</p>${box}
        <p>So geht's: In Platzcoach anmelden → Termin öffnen → „Torhüter an-/abmelden“. Torhüter trägst du einmalig unter <b>Konto → Profil → „Meine Torhüter“</b> ein.</p>${btn}
        <p>So weiß der Torwarttrainer, wer kommt – und kann das Training rechtzeitig absagen, wenn zu wenige dabei sind.</p>${foot}</div>`;
    }
    try {
      // X-Entity-Ref-ID (eindeutig pro Mail): verhindert, dass Gmail mehrere Mails zum selben
      // Termin zu einer Unterhaltung gruppiert und gleiche Textteile als "zitierten Text" ausblendet.
      await transporter.sendMail({ from: `Platzcoach <${fromAddress}>`, ...(replyTo ? { replyTo } : {}), to: u.email, subject, text, html, headers: { 'X-Entity-Ref-ID': randomUUID() } });
      console.log('Gesendet an ' + u.email);
    } catch (e) { console.error('Fehler bei ' + u.email + ': ' + e.message); }
  }
}

main().catch(err => { console.error('Torwart-Mail fehlgeschlagen:', err.message); process.exit(1); });
