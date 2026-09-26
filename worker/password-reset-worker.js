// worker/password-reset-worker.js
//
// Cloudflare Worker für "Passwort vergessen?" in Platzcoach.
//
// Ablauf
//   1. POST /password/forgot  {first, last, email}
//      Passt die Kombination aus Vorname + Nachname + E-Mail genau zu einem (nicht gesperrten)
//      Zugang in data/users.json, wird ein einmaliger Code erzeugt und ein Link
//      https://platzcoach.de/#reset=CODE per E-Mail verschickt (über das GitHub-Dispatch-Event
//      "password-reset-link" → .github/workflows/password-mails.yml).
//      Die Antwort ist IMMER gleich ("ok"), egal ob etwas passt – so lässt sich nicht
//      herausfinden, ob ein Zugang existiert.
//   2. POST /password/redeem  {code}
//      Prüft den Code (60 min gültig, nur einmal nutzbar) und gibt einmalig die Zugangs-ID und
//      den gemeinsamen Schreib-Token zurück. Der Browser verschlüsselt den Token dann selbst mit
//      dem neuen Passwort (PBKDF2 310.000 Runden – so viele erlaubt WebCrypto in Workers nicht)
//      und speichert users.json.
//
// Schutz
//   - Codes: 32 Zufallsbytes, im KV nur als SHA-256-Hash gespeichert, TTL 60 min, einmalig.
//   - Pro Zugang gilt nur der zuletzt angeforderte Link (neuer Link macht alte ungültig).
//   - Rate-Limits (KV): pro E-Mail 3 Anfragen/Stunde, pro IP 10 Anfragen/Stunde,
//     pro IP 20 Einlöse-Versuche/Stunde.
//   - CORS nur für ALLOWED_ORIGINS.
//
// Einrichtung in Cloudflare (siehe README-DEPLOY.md, Abschnitt "Passwort vergessen"):
//   Variablen:  REPO (z. B. fcal1986/svbachumbergheimkalender), BRANCH (main),
//               APP_URL (https://platzcoach.de/), ALLOWED_ORIGINS (https://platzcoach.de)
//   Secret:     GITHUB_TOKEN  – derselbe Fine-grained Token, den die App nutzt
//               (Contents: Read and write). Bei Token-Erneuerung hier mit austauschen!
//   KV-Binding: PWRESET

const CODE_TTL_SEC = 3600;
const LIMITS = {
  forgotPerEmail: 3,
  forgotPerIp: 10,
  redeemPerIp: 20,
  windowSec: 3600,
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true }, 200, cors);
      if (request.method === 'POST' && url.pathname === '/password/forgot') return await forgot(request, env, cors);
      if (request.method === 'POST' && url.pathname === '/password/redeem') return await redeem(request, env, cors);
      return json({ error: 'Nicht gefunden.' }, 404, cors);
    } catch (e) {
      console.log('Fehler:', e && e.message);
      return json({ error: 'Serverfehler. Bitte später noch einmal versuchen.' }, 500, cors);
    }
  },
};

async function forgot(request, env, cors) {
  const body = await readJson(request);
  const first = norm(body.first), last = norm(body.last), email = normMail(body.email);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const OK = json({ ok: true }, 200, cors); // immer dieselbe Antwort

  if (!first || !last || !email || email.length > 200 || first.length > 100 || last.length > 100) {
    return json({ error: 'Bitte Vorname, Nachname und E-Mail-Adresse eintragen.' }, 400, cors);
  }
  // Rate-Limits: überschritten → trotzdem "ok" antworten, nur nichts tun.
  if (!(await allow(env, 'rl:fip:' + ip, LIMITS.forgotPerIp))) return OK;
  if (!(await allow(env, 'rl:fmail:' + (await sha256(email)), LIMITS.forgotPerEmail))) return OK;

  const users = await loadUsers(env);
  const user = users.find(u => normMail(u.email) === email && norm(u.first) === first && norm(u.last) === last);
  if (!user || user.locked) return OK;

  const code = randomCode();
  const hash = await sha256(code);
  await env.PWRESET.put('code:' + hash, JSON.stringify({ userId: user.id, created: Date.now() }), { expirationTtl: CODE_TTL_SEC });
  await env.PWRESET.put('user:' + user.id, hash, { expirationTtl: CODE_TTL_SEC }); // nur der neueste Link zählt

  const link = String(env.APP_URL || 'https://platzcoach.de/').replace(/#.*$/, '') + '#reset=' + code;
  await dispatch(env, 'password-reset-link', { name: user.first + ' ' + user.last, email: user.email, link });
  return OK;
}

async function redeem(request, env, cors) {
  const body = await readJson(request);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await allow(env, 'rl:rip:' + ip, LIMITS.redeemPerIp))) {
    return json({ error: 'Zu viele Versuche. Bitte in einer Stunde erneut probieren.' }, 429, cors);
  }
  const code = String(body.code || '');
  const INVALID = json({ error: 'Dieser Link ist abgelaufen, wurde schon benutzt oder durch einen neueren ersetzt. Bitte einen neuen Link anfordern.' }, 400, cors);
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(code)) return INVALID;

  const hash = await sha256(code);
  const raw = await env.PWRESET.get('code:' + hash);
  if (!raw) return INVALID;
  const rec = JSON.parse(raw);
  const latest = await env.PWRESET.get('user:' + rec.userId);
  // Sofort entwerten – egal was danach passiert, dieser Code ist verbraucht.
  await env.PWRESET.delete('code:' + hash);
  if (latest !== hash) return INVALID;
  await env.PWRESET.delete('user:' + rec.userId);
  if (Date.now() - rec.created > CODE_TTL_SEC * 1000) return INVALID;

  const users = await loadUsers(env);
  const user = users.find(u => u.id === rec.userId);
  if (!user || user.locked) return INVALID;
  return json({ ok: true, userId: user.id, token: env.GITHUB_TOKEN }, 200, cors);
}

// ── Hilfsfunktionen ─────────────────────────────────────────────
function norm(s) {
  return String(s || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}
function normMail(s) { return String(s || '').trim().toLowerCase(); }

async function loadUsers(env) {
  const r = await fetch(`https://api.github.com/repos/${env.REPO}/contents/data/users.json?ref=${env.BRANCH || 'main'}`, {
    headers: gh(env, { Accept: 'application/vnd.github.raw+json' }),
  });
  if (!r.ok) throw new Error('users.json nicht ladbar (' + r.status + ')');
  const data = await r.json();
  return Array.isArray(data.users) ? data.users : [];
}

async function dispatch(env, eventType, payload) {
  const r = await fetch(`https://api.github.com/repos/${env.REPO}/dispatches`, {
    method: 'POST',
    headers: gh(env, { Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }),
    body: JSON.stringify({ event_type: eventType, client_payload: payload }),
  });
  if (!r.ok) throw new Error('Dispatch fehlgeschlagen (' + r.status + ')');
}

function gh(env, extra) {
  return Object.assign({ Authorization: 'Bearer ' + env.GITHUB_TOKEN, 'User-Agent': 'platzcoach-password-reset' }, extra || {});
}

async function allow(env, key, max) {
  const n = parseInt((await env.PWRESET.get(key)) || '0', 10);
  if (n >= max) return false;
  await env.PWRESET.put(key, String(n + 1), { expirationTtl: LIMITS.windowSec });
  return true;
}

function randomCode() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function readJson(request) {
  try { return await request.json(); } catch (e) { return {}; }
}

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, cors) });
}
