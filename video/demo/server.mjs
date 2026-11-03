#!/usr/bin/env node
// Lokaler Demo-Server:
//  - liefert die echte App (index.html + Assets) unverändert aus dem Repo aus (nur lesend),
//  - liefert data/*.json aus video/.demo-runtime/data,
//  - beantwortet GitHub-Contents-API-Aufrufe unter /__gh/… (Playwright leitet api.github.com hierher um),
//  - liefert die Schriften Inter/Manrope lokal (statt Google Fonts).
// Lauscht nur auf 127.0.0.1. Schreibt nur in den Demo-Laufzeitordner.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  REPO_ROOT, RUNTIME_DIR, RUNTIME_DATA, APP_FILES, DEMO_REPO, DEMO_BRANCH, DEMO_TOKEN, DEMO_PORT, DEMO_APP_URL,
} from './demo.config.mjs';
import { assertSafeToWrite, assertMarker, assertDemoConfig } from './safety.mjs';

const require = createRequire(import.meta.url);
const FONT_DIRS = {
  inter: path.join(path.dirname(require.resolve('@fontsource/inter/package.json')), 'files'),
  manrope: path.join(path.dirname(require.resolve('@fontsource/manrope/package.json')), 'files'),
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2', '.css': 'text/css' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS', 'Cache-Control': 'no-store' };

function send(res, status, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, ...CORS, ...extra });
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj));
const sha = (buf) => require('node:crypto').createHash('sha1').update(buf).digest('hex');

function fontCss() {
  const face = (fam, dir, w) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:block;src:url(${DEMO_APP_URL}/__fonts/${dir}/${dir}-latin-${w}-normal.woff2) format('woff2');}\n` +
    `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:block;src:url(${DEMO_APP_URL}/__fonts/${dir}/${dir}-latin-ext-${w}-normal.woff2) format('woff2');unicode-range:U+0100-024F,U+1E00-1EFF;}\n`;
  return [400, 500, 600, 700, 800].map((w) => face('Inter', 'inter', w)).join('') +
    [600, 700, 800].map((w) => face('Manrope', 'manrope', w)).join('');
}

function dataFile(rel) {
  const abs = path.resolve(RUNTIME_DATA, rel);
  if (!abs.startsWith(RUNTIME_DATA + path.sep)) return null;
  return abs;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

async function handleGitHub(req, res, ghPath) {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if ((req.headers.authorization || '') !== 'Bearer ' + DEMO_TOKEN) return json(res, 401, { message: 'Bad credentials (Demo-Mock)' });
  const m = ghPath.match(/^\/repos\/([^/]+\/[^/]+)(\/.*)?$/);
  if (!m) return json(res, 404, { message: 'Not Found (Demo-Mock)' });
  if (m[1] !== DEMO_REPO) return json(res, 403, { message: `Demo-Mock beantwortet nur ${DEMO_REPO}` });
  const rest = (m[2] || '').split('?')[0];
  if (!rest) return json(res, 200, { full_name: DEMO_REPO, permissions: { push: true }, default_branch: DEMO_BRANCH });
  if (rest === '/dispatches' && req.method === 'POST') {
    const body = await readBody(req);
    fs.appendFileSync(path.join(RUNTIME_DIR, 'commits.log'), `[dispatch abgefangen] ${body}\n`);
    return send(res, 204, '');
  }
  if (rest.startsWith('/commits')) return json(res, 200, []);
  const cm = rest.match(/^\/contents\/(data\/[A-Za-z0-9._-]+\.json)$/);
  if (!cm) return json(res, 404, { message: 'Not Found (Demo-Mock)' });
  const file = dataFile(cm[1].slice('data/'.length));
  if (!file) return json(res, 400, { message: 'Ungültiger Pfad' });
  if (req.method === 'GET') {
    if (!fs.existsSync(file)) return json(res, 404, { message: 'Not Found' });
    const buf = fs.readFileSync(file);
    return json(res, 200, { path: cm[1], sha: sha(buf), content: buf.toString('base64'), encoding: 'base64' });
  }
  if (req.method === 'PUT') {
    assertSafeToWrite(file);
    const body = JSON.parse(await readBody(req));
    const cur = fs.existsSync(file) ? sha(fs.readFileSync(file)) : null;
    if (cur && body.sha !== cur) return json(res, 409, { message: 'sha mismatch (Demo-Mock)' });
    const buf = Buffer.from(body.content, 'base64');
    if (cm[1] === 'data/config.json') assertDemoConfig(JSON.parse(buf.toString('utf8')));
    fs.writeFileSync(file, buf);
    fs.appendFileSync(path.join(RUNTIME_DIR, 'commits.log'), `[commit] ${cm[1]}: ${String(body.message).split('\n')[0]}\n`);
    return json(res, 200, { content: { path: cm[1], sha: sha(buf) } });
  }
  return json(res, 405, { message: 'Method not allowed' });
}

export function startDemoServer(port = DEMO_PORT) {
  assertMarker();
  assertDemoConfig(JSON.parse(fs.readFileSync(path.join(RUNTIME_DATA, 'config.json'), 'utf8')));
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const p = decodeURIComponent(url.pathname);
      if (p.startsWith('/__gh/')) return await handleGitHub(req, res, p.slice('/__gh'.length) + url.search);
      if (p === '/__fonts/css2') return send(res, 200, fontCss(), 'text/css');
      const fm = p.match(/^\/__fonts\/(inter|manrope)\/([a-z0-9-]+\.woff2)$/);
      if (fm) {
        const f = path.join(FONT_DIRS[fm[1]], fm[2]);
        return fs.existsSync(f) ? send(res, 200, fs.readFileSync(f), 'font/woff2') : send(res, 404, '');
      }
      if (p.startsWith('/data/')) {
        const f = dataFile(p.slice('/data/'.length));
        return f && fs.existsSync(f) ? send(res, 200, fs.readFileSync(f), TYPES['.json']) : json(res, 404, {});
      }
      const rel = p === '/' ? 'index.html' : p.slice(1);
      if (APP_FILES.includes(rel)) {
        const f = path.join(REPO_ROOT, rel);
        return send(res, 200, fs.readFileSync(f), TYPES[path.extname(f)] || 'application/octet-stream');
      }
      return send(res, 404, 'Nicht Teil der Demo', 'text/plain');
    } catch (e) {
      console.error('[demo-server]', e.message);
      return json(res, 500, { message: e.message });
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startDemoServer().then(() => console.log(`Demo läuft auf http://127.0.0.1:${DEMO_PORT}/ (Strg+C beendet). Hinweis: Im normalen Browser gehen Schreibzugriffe an die echte GitHub-API – zum Bearbeiten die Aufnahme (npm run capture) nutzen.`));
}
