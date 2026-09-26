// scripts/send-gk-request.mjs
//
// E-Mail an die Trainer bestimmter Jugenden: "Bitte meldet eure Torhüter zum Torwarttraining an
// oder ab." Ausgelöst von der App per repository_dispatch "gk-signup-request" (beim Anlegen eines
// Torwarttrainings oder über "Trainer erinnern"). Enthält bewusst KEINE Spielernamen.
//
// Payload: teams (["E-Jugend","F-Jugend"], leer = alle Jugenden), title, when, link, byId, byName
// Empfänger: alle nicht gesperrten Zugänge, die in der laufenden Saison eine der Jugenden
// trainieren und E-Mail-Benachrichtigungen nicht abgeschaltet haben – außer dem Auslöser selbst.

import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';

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
  const recipients = users.filter(u => {
    if (!u.email || u.locked || u.emailNotificationsEnabled === false || u.id === p.byId) return false;
    const cls = Object.keys(classesOf(u));
    return cls.some(t => /Jugend/.test(t) && (!wanted || wanted.includes(t)));
  });
  if (!recipients.length) { console.log('Keine Empfänger für ' + (teams.join(', ') || 'alle Jugenden') + '.'); return; }

  const clubName = cfg.clubName || 'Platzcoach';
  const fromAddress = (cfg.notify && cfg.notify.fromEmail) || process.env.SMTP_USER;
  const replyTo = (cfg.notify && cfg.notify.replyTo) || '';
  const teamsText = teams.length ? teams.join(', ') : 'alle Jugenden';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });

  for (const u of recipients) {
    const text = `Hallo ${u.first},\n\n${p.byName || 'Der Torwarttrainer'} bittet dich, deine Torhüter für das ${p.title || 'Torwarttraining'} an- oder abzumelden:\n\n${p.when || ''}\nFür: ${teamsText}\n\nSo geht's: In Platzcoach anmelden → Termin öffnen → „Torhüter an-/abmelden“. Deine Torhüter trägst du einmalig unter Konto → Profil → „Meine Torhüter“ ein.\n${link ? '\n' + link + '\n' : ''}\nSo weiß der Torwarttrainer, wer kommt – und kann das Training rechtzeitig absagen, wenn zu wenige dabei sind.\n\n${clubName}`;
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1B32;">
      <p>Hallo ${esc(u.first)},</p>
      <p>${esc(p.byName || 'Der Torwarttrainer')} bittet dich, deine <b>Torhüter</b> für das ${esc(p.title || 'Torwarttraining')} an- oder abzumelden:</p>
      <p style="background:#FFF8EE;border:1px solid #F5C58A;border-radius:10px;padding:10px 14px;"><b>${esc(p.when || '')}</b><br>Für: ${esc(teamsText)}</p>
      <p>So geht's: In Platzcoach anmelden → Termin öffnen → „Torhüter an-/abmelden“. Deine Torhüter trägst du einmalig unter <b>Konto → Profil → „Meine Torhüter“</b> ein.</p>
      ${link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#0B1B32;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;">Platzcoach öffnen</a></p>` : ''}
      <p>So weiß der Torwarttrainer, wer kommt – und kann das Training rechtzeitig absagen, wenn zu wenige dabei sind.</p>
      <p style="color:#718191;font-size:12px;">Automatische Benachrichtigung von Platzcoach (${esc(clubName)}).</p></div>`;
    try {
      await transporter.sendMail({ from: `Platzcoach <${fromAddress}>`, ...(replyTo ? { replyTo } : {}), to: u.email, subject: `Torwarttraining: bitte Torhüter an- oder abmelden (${p.when || ''})`, text, html });
      console.log('Gesendet an ' + u.email);
    } catch (e) { console.error('Fehler bei ' + u.email + ': ' + e.message); }
  }
}

main().catch(err => { console.error('Torwart-Mail fehlgeschlagen:', err.message); process.exit(1); });
