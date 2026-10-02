// scripts/push-lib.mjs
//
// Push-Benachrichtigungen aufs Handy (ab 02.10.2026 · 1).
//
// - Geräte melden sich in der App an (Konto → Push). Die Push-Adresse eines Geräts steht
//   VERSCHLÜSSELT in data/push-subscriptions.json (das Repo ist öffentlich). Verschlüsselt wird
//   mit dem öffentlichen VAPID-Schlüssel (ECDH P-256 → HKDF-SHA256 → AES-256-GCM); entschlüsseln
//   kann nur, wer den privaten VAPID-Schlüssel hat – das GitHub-Secret VAPID_PRIVATE_KEY.
// - Gesendet wird mit dem Paket "web-push" (Web-Push-Standard, funktioniert mit Chrome/Android,
//   Firefox und iOS ab 16.4, wenn Platzcoach auf dem Home-Bildschirm installiert ist).
//
// Ohne Secret oder ohne öffentlichen Schlüssel in data/config.json (push.vapidPublicKey) passiert nichts.

import fs from 'node:fs/promises';
import crypto from 'node:crypto';

export const SUBS_PATH = 'data/push-subscriptions.json';
const SALT = Buffer.from('platzcoach-push', 'utf8');
const INFO = Buffer.from('subscription', 'utf8');

export function pushConfigured(cfg) {
  return !!(process.env.VAPID_PRIVATE_KEY && cfg && cfg.push && cfg.push.vapidPublicKey);
}

function decryptSub(enc, privB64) {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(Buffer.from(privB64, 'base64url'));
  const secret = ecdh.computeSecret(Buffer.from(enc.epk, 'base64url'));
  const key = Buffer.from(crypto.hkdfSync('sha256', secret, SALT, INFO, 32));
  const data = Buffer.from(enc.ct, 'base64url');
  const tag = data.subarray(data.length - 16), body = data.subarray(0, data.length - 16);
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64url'));
  d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(body), d.final()]).toString('utf8'));
}

// Alle angemeldeten Geräte: [{id, userId, sub}] (nicht entschlüsselbare Einträge werden übersprungen)
export async function loadPushDevices(cfg) {
  if (!pushConfigured(cfg)) return [];
  let raw;
  try { raw = JSON.parse(await fs.readFile(SUBS_PATH, 'utf8')); } catch (e) { return []; }
  const out = [];
  for (const s of (Array.isArray(raw.subs) ? raw.subs : [])) {
    try { out.push({ id: s.id, userId: s.userId, sub: decryptSub(s.enc, process.env.VAPID_PRIVATE_KEY) }); }
    catch (e) { console.error('Push-Gerät', s.id, 'nicht lesbar:', e.message); }
  }
  return out;
}

let webpush = null;
async function wp(cfg) {
  if (webpush) return webpush;
  webpush = (await import('web-push')).default;
  const n = cfg.notify || {};
  const contact = n.replyTo || n.fromEmail || 'noreply@platzcoach.de';
  webpush.setVapidDetails('mailto:' + contact, cfg.push.vapidPublicKey, process.env.VAPID_PRIVATE_KEY);
  return webpush;
}

// Eine Nachricht an alle Geräte eines Zugangs. payload: {title, body, url, tag}
export async function pushToUser(cfg, devices, userId, payload) {
  const mine = devices.filter(d => d.userId === userId);
  if (!mine.length) return 0;
  const w = await wp(cfg);
  let ok = 0;
  for (const d of mine) {
    try { await w.sendNotification(d.sub, JSON.stringify(payload), { TTL: 24 * 3600, urgency: 'normal' }); ok++; }
    catch (e) {
      // 404/410: Gerät hat sich abgemeldet oder die App wurde gelöscht – meldet die App beim nächsten Öffnen neu an.
      console.error(`Push an Gerät ${d.id} fehlgeschlagen (${e.statusCode || '-'}):`, (e.body || e.message || '').toString().slice(0, 200));
    }
  }
  return ok;
}

// Link in Platzcoach aus der Direktlink-ID ("fb-…", Termin-ID)
export function appLink(cfg, link) {
  const site = String(cfg.siteUrl || 'https://platzcoach.de/').replace(/\/?$/, '/');
  return link ? site + '#t=' + encodeURIComponent(link) : site;
}
