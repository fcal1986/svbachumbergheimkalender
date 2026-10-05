// Platzcoach – Registrierungs-Worker (Cloudflare Workers + KV)
//
// Zweck: Trainer registrieren sich über einen Einladungslink selbst. Die Anmeldungen
// (Name, E-Mail, Telefon, Mannschaften) werden hier PRIVAT zwischengespeichert, bis ein
// Admin sie in der App freigibt oder ablehnt. Sie landen also nie im öffentlichen Repo,
// solange sie nicht freigegeben sind.
//
// Bewusst NICHT hier: das Anlegen des Zugangs selbst. Das macht weiterhin die App des Admins
// (verschlüsselter Schlüssel pro Nutzer, users.json, Saison-Zuordnung, Willkommens- und
// Passwort-Mail) – derselbe Ablauf wie beim manuellen Anlegen. Der Worker braucht deshalb
// KEINEN eigenen GitHub-Schlüssel.
//
// Bindings / Variablen (siehe wrangler.toml):
//   REG              KV-Namespace
//   REPO             z. B. "fcal1986/svbachumbergheimkalender"
//   ALLOWED_ORIGINS  kommagetrennt, z. B. "https://platzcoach.de,https://fcal1986.github.io"
//
// Admin-Prüfung: Admin-Aufrufe schicken den GitHub-Schlüssel der App mit. Der Worker fragt
// bei GitHub nach, ob dieser Schlüssel Schreibrechte auf REPO hat – genau das Recht, das in
// der App ohnehin zum Anlegen von Zugängen nötig ist. Der Schlüssel wird nicht gespeichert.
//
// Speicherung (ab 05.10.2026): alle offenen Anmeldungen in EINEM Eintrag (REGS_KEY, Liste).
// Vorher lag jede Anmeldung unter eigenem Schlüssel und wurde per KV.list() gesucht. list() ist im
// Gratis-Tarif auf 1.000 Aufrufe pro Tag begrenzt; eine Admin-App in einer Fehlerschleife hat das
// am 05.10.2026 aufgebraucht, danach lieferten Registrierung und Admin-Liste nur noch „Serverfehler.“.
// Jetzt: nur get/put (100.000 Lesezugriffe/Tag). Alte Einzel-Einträge werden einmalig übernommen.

const INVITE_KEY = 'invite:current';
const REG_PREFIX = 'reg:';               // alt: ein Schlüssel je Anmeldung (nur noch für die einmalige Übernahme)
const REGS_KEY = 'regs:all';             // neu: alle offenen Anmeldungen als Liste
const REG_TTL_SEC = 60 * 24 * 3600;      // offene Anmeldungen verfallen nach 60 Tagen
const RATE_LIMIT_PER_HOUR = 30;           // pro IP; großzügig, weil beim Vereinsabend alle im selben WLAN sind
const MAX_PENDING = 300;
const MAX_TEAMS = 12;

const authCache = new Map(); // tokenHash -> gültig bis (ms); nur im Speicher dieser Worker-Instanz

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const m = request.method;

      if (m === 'GET' && path === '/health') return json({ ok: true }, 200, cors);

      // ── öffentlich ──
      let mm;
      if (m === 'GET' && (mm = path.match(/^\/invite\/([A-Za-z0-9_-]{10,64})$/))) {
        const inv = await currentInvite(env);
        const valid = !!inv && safeEqual(inv.code, mm[1]);
        return json({ valid }, 200, cors);
      }
      if (m === 'POST' && path === '/register') return await register(request, env, cors);

      // ── nur Admins ──
      if (path.startsWith('/admin/')) {
        const ok = await isAdmin(request, env);
        if (!ok) return json({ error: 'Keine Berechtigung.' }, 401, cors);

        if (m === 'GET' && path === '/admin/invite') {
          return json({ invite: await currentInvite(env) }, 200, cors);
        }
        if (m === 'POST' && path === '/admin/invite') {
          const body = await readJson(request);
          const days = clampInt(body.days, 1, 90, 14);
          const invite = {
            code: randomCode(),
            created: new Date().toISOString(),
            expires: new Date(Date.now() + days * 86400000).toISOString(),
            by: cleanStr(body.by, 80),
          };
          await env.REG.put(INVITE_KEY, JSON.stringify(invite), { expirationTtl: days * 86400 });
          return json({ invite }, 200, cors);
        }
        if (m === 'DELETE' && path === '/admin/invite') {
          await env.REG.delete(INVITE_KEY);
          return json({ ok: true }, 200, cors);
        }
        if (m === 'GET' && path === '/admin/registrations') {
          return json({ registrations: await loadRegs(env) }, 200, cors);
        }
        if (m === 'PATCH' && (mm = path.match(/^\/admin\/registrations\/([0-9a-f-]{36})$/))) {
          return await updateRegistration(mm[1], request, env, cors);
        }
        if (m === 'DELETE' && (mm = path.match(/^\/admin\/registrations\/([0-9a-f-]{36})$/))) {
          const regs = await loadRegs(env);
          await saveRegs(env, regs.filter(r => r.id !== mm[1]));
          return json({ ok: true }, 200, cors);
        }
      }
      return json({ error: 'Nicht gefunden.' }, 404, cors);
    } catch (err) {
      console.error('Fehler:', err && err.message);
      // Grund mitschicken (ohne Interna), damit Admin und Logs ihn sehen; die App zeigt Nutzern bei 5xx eine eigene Meldung.
      const limit = /limit exceeded/i.test(String(err && err.message));
      return json({ error: limit ? 'Speicher-Tageslimit erreicht. Bitte später noch einmal versuchen.' : 'Serverfehler.' }, limit ? 503 : 500, cors);
    }
  },
};

/* ───────── Registrierung ───────── */

async function register(request, env, cors) {
  const body = await readJson(request);

  // Honeypot: echte Nutzer sehen dieses Feld nicht; Bots füllen es gern aus.
  if (body.website) return json({ ok: true }, 200, cors);

  const inv = await currentInvite(env);
  if (!inv || !safeEqual(inv.code, String(body.code || ''))) {
    return json({ error: 'Dieser Einladungslink ist nicht mehr gültig. Bitte frag im Verein nach einem neuen Link.' }, 403, cors);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rlKey = 'rl:' + (await sha256Hex(ip)).slice(0, 32);
  const count = parseInt((await env.REG.get(rlKey)) || '0', 10);
  if (count >= RATE_LIMIT_PER_HOUR) {
    return json({ error: 'Zu viele Anmeldungen von diesem Anschluss. Bitte später nochmal versuchen.' }, 429, cors);
  }

  const first = cleanStr(body.first, 60);
  const last = cleanStr(body.last, 60);
  const email = cleanStr(body.email, 120).toLowerCase();
  const phone = cleanStr(body.phone, 30);
  const showPhone = body.showPhone === true;
  const classes = cleanClasses(body.classes);

  const errors = [];
  if (!first) errors.push('Vorname fehlt.');
  if (!last) errors.push('Nachname fehlt.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push('E-Mail sieht nicht gültig aus.');
  if (!/^[+\d][\d\s\-/()]{5,24}$/.test(phone)) errors.push('Telefonnummer sieht nicht gültig aus.');
  if (!Object.keys(classes).length) errors.push('Bitte mindestens eine Mannschaft auswählen.');
  if (body.consent !== true) errors.push('Bitte die Datenschutz-Hinweise bestätigen.');
  if (errors.length) return json({ error: errors.join(' ') }, 400, cors);

  // Gleiche E-Mail nochmal angemeldet (z. B. vertippt bei der Mannschaft): alte Anmeldung ersetzen.
  const existing = (await loadRegs(env)).filter(r => r.email !== email);
  if (existing.length >= MAX_PENDING) {
    return json({ error: 'Gerade sind zu viele Anmeldungen offen. Bitte wende dich direkt an den Vorstand.' }, 503, cors);
  }

  const rec = {
    id: crypto.randomUUID(),
    first, last, email, phone, showPhone, classes,
    created: new Date().toISOString(),
  };
  existing.push(rec);
  await saveRegs(env, existing);
  await env.REG.put(rlKey, String(count + 1), { expirationTtl: 3600 });
  return json({ ok: true }, 201, cors);
}

// Admin korrigiert Angaben einer offenen Anmeldung (z. B. vertippte E-Mail nach Rücksprache).
async function updateRegistration(id, request, env, cors) {
  const regs = await loadRegs(env);
  const rec = regs.find(r => r.id === id);
  if (!rec) return json({ error: 'Diese Anmeldung gibt es nicht mehr.' }, 404, cors);
  const body = await readJson(request);
  const next = { ...rec };
  if (body.first !== undefined) next.first = cleanStr(body.first, 60);
  if (body.last !== undefined) next.last = cleanStr(body.last, 60);
  if (body.email !== undefined) next.email = cleanStr(body.email, 120).toLowerCase();
  if (body.phone !== undefined) next.phone = cleanStr(body.phone, 30);
  if (body.showPhone !== undefined) next.showPhone = body.showPhone === true;
  if (body.classes !== undefined) next.classes = cleanClasses(body.classes);

  const errors = [];
  if (!next.first) errors.push('Vorname fehlt.');
  if (!next.last) errors.push('Nachname fehlt.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(next.email)) errors.push('E-Mail sieht nicht gültig aus.');
  if (!/^[+\d][\d\s\-/()]{5,24}$/.test(next.phone)) errors.push('Telefonnummer sieht nicht gültig aus.');
  if (!Object.keys(next.classes || {}).length) errors.push('Bitte mindestens eine Mannschaft auswählen.');
  if (errors.length) return json({ error: errors.join(' ') }, 400, cors);

  if (next.email !== rec.email) {
    if (regs.some(r => r.id !== id && r.email === next.email)) {
      return json({ error: 'Für diese E-Mail gibt es schon eine andere offene Anmeldung.' }, 409, cors);
    }
  }
  next.edited = new Date().toISOString();
  await saveRegs(env, regs.map(r => (r.id === id ? next : r)));
  return json({ registration: next }, 200, cors);
}

// Alle offenen Anmeldungen: ein get, kein list(). Abgelaufene (älter als 60 Tage) fallen raus.
async function loadRegs(env) {
  let regs = await env.REG.get(REGS_KEY, 'json');
  if (!Array.isArray(regs)) regs = await migrateLegacyRegs(env);
  const minCreated = new Date(Date.now() - REG_TTL_SEC * 1000).toISOString();
  return regs.filter(r => r && r.id && (r.created || '') >= minCreated)
    .sort((a, b) => (a.created < b.created ? -1 : 1));
}
async function saveRegs(env, regs) {
  await env.REG.put(REGS_KEY, JSON.stringify(regs));
}
// Einmalig: alte Einzel-Einträge (reg:<id>) in die Liste übernehmen. Nur hier wird noch list()
// benutzt; danach existiert REGS_KEY und dieser Weg wird nie wieder betreten.
async function migrateLegacyRegs(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.REG.list({ prefix: REG_PREFIX, cursor });
    const recs = await Promise.all(page.keys.map(k => env.REG.get(k.name, 'json')));
    recs.forEach(r => { if (r) out.push(r); });
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  await saveRegs(env, out);
  await Promise.all(out.map(r => env.REG.delete(REG_PREFIX + r.id)));
  return out;
}

async function currentInvite(env) {
  const inv = await env.REG.get(INVITE_KEY, 'json');
  if (!inv) return null;
  if (inv.expires && new Date(inv.expires).getTime() < Date.now()) return null;
  return inv;
}

/* ───────── Admin-Prüfung ───────── */

async function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || token.length < 20) return false;
  const h = await sha256Hex(token);
  const until = authCache.get(h);
  if (until && until > Date.now()) return true;

  const r = await fetch('https://api.github.com/repos/' + env.REPO, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'platzcoach-registration-worker',
    },
  });
  if (!r.ok) return false;
  const repo = await r.json();
  const ok = !!(repo.permissions && (repo.permissions.push || repo.permissions.admin));
  if (ok) authCache.set(h, Date.now() + 10 * 60 * 1000);
  return ok;
}

/* ───────── Hilfsfunktionen ───────── */

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > 10000) return {};
  try { const o = JSON.parse(text); return o && typeof o === 'object' ? o : {}; } catch { return {}; }
}

function cleanStr(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
}

// Erwartet { "E-Jugend": [1,2], "1. Herren": [] } – leeres Array = alle Mannschaften der Altersklasse.
function cleanClasses(v) {
  const out = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [team, squads] of Object.entries(v).slice(0, MAX_TEAMS)) {
    const t = cleanStr(team, 40);
    if (!t) continue;
    const sq = Array.isArray(squads)
      ? [...new Set(squads.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 5))].sort((a, b) => a - b)
      : [];
    out[t] = sq;
  }
  return out;
}

function clampInt(v, min, max, dflt) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
}

function randomCode() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}
