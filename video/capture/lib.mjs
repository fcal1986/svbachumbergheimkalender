// Gemeinsame Helfer für alle Aufnahme-Abläufe (capture/flows/*.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { resetDemo } from '../demo/seed.mjs';
import { startDemoServer } from '../demo/server.mjs';
import { launchDemoBrowser, VIEWPORT, DPR } from './browser.mjs';
import { DEMO_APP_URL, DEMO_USERS, DEMO_NOW, VIDEO_DIR, RUNTIME_DIR } from '../demo/demo.config.mjs';

export const CAPTURE_ROOT = path.join(VIDEO_DIR, 'public', 'capture');

export async function settle(page) {
  // Schriften, Bilder, kein Hinweis, keine laufende Speicher-Anzeige, zwei Frames Ruhe.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.waitForFunction(() => !document.querySelector('#toast.show') && !document.querySelector('#saving-pill.show'), null, { timeout: 8000 });
  await page.waitForTimeout(400); // Ausblend-Animation des Hinweises
  await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(250);
}

export async function boxes(page, map) {
  const out = {};
  for (const [key, sel] of Object.entries(map)) {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) throw new Error(`Element „${key}“ (${sel}) nicht gefunden`);
    const b = await loc.boundingBox();
    if (!b) throw new Error(`Element „${key}“ (${sel}) nicht sichtbar`);
    out[key] = { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), selector: sel };
  }
  return out;
}

// Scrollt den nächsten scrollbaren Vorfahren so, dass das Element `topOffset` CSS-px unter dem oberen Rand steht.
export async function scrollToEl(page, sel, topOffset = 90) {
  await page.locator(sel).first().evaluate((el, off) => {
    let sc = el.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    sc = sc || document.scrollingElement;
    sc.scrollTop += el.getBoundingClientRect().top - off;
  }, topOffset);
  await page.waitForTimeout(250);
}

// Zeitleiste so verschieben, dass ab `minutes` zu sehen ist (wie ein Wischen des Nutzers).
export async function scrollTimeline(page, minutes, sel = '#f-tl .tl-scroll') {
  await page.evaluate(([m, s]) => {
    const sc = document.querySelector(s);
    const t0 = +sc.dataset.t0, t1 = +sc.dataset.t1;
    const pad = sc.querySelector('.tl-pad');
    sc.scrollLeft = Math.max(0, pad.scrollWidth * (m - t0) / (t1 - t0));
  }, [minutes, sel]);
  await page.waitForTimeout(200);
}

// Anmeldung über die echte Anmeldemaske (verschlüsselter Token in users.json).
export async function login(page, who) {
  const u = DEMO_USERS[who];
  if (!u) throw new Error(`Unbekannter Demo-Zugang „${who}“`);
  if (!page.url().startsWith(DEMO_APP_URL)) {
    await page.goto(DEMO_APP_URL + '/');
    await page.waitForSelector('button.navbtn[data-nav="start"]');
  }
  await page.evaluate(() => { try { if (typeof session !== 'undefined' && session) logoutNow(); } catch (e) {} });
  await page.evaluate(() => openLogin());
  await page.fill('#li-user', u.email);
  await page.fill('#li-pass', u.password);
  await page.click('#li-btn');
  await page.waitForEvent('load');
  await page.waitForFunction((name) => typeof session !== 'undefined' && session && session.name === name, u.name);
  await page.waitForSelector('#hd-user.in');
}

// Warten, bis alle Speichervorgänge der App durch sind (Warteschlangen ghSaveQueue/storeQueue in index.html).
export async function waitSaved(page) {
  await page.waitForFunction(() => typeof ghSaveQueue !== 'undefined');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => Promise.all([ghSaveQueue, typeof storeQueue !== 'undefined' ? storeQueue : null].map((p) => p && p.catch(() => {}))));
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !document.querySelector('#saving-pill.show'));
}

// Im Kalender (Woche) den Tag mit dieser Tageszahl wählen; blättert bei Bedarf eine Woche weiter.
export async function pickDay(page, dayNum) {
  const day = () => page.locator('.cw-day').filter({ hasText: new RegExp('(^|\\D)' + dayNum + '$') }).first();
  if (!(await day().count())) await page.locator('[onclick*="calStep(1)"]').first().click();
  await day().click();
}

// window.open abfangen (z. B. wa.me-Links): Ziel-URLs werden gesammelt statt geöffnet.
export async function trapWindowOpen(page) {
  await page.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
}
export async function lastOpenedText(page) {
  const u = await page.evaluate(() => (window.__opened || []).slice(-1)[0] || '');
  const m = u.match(/[?&]text=([^&]*)/);
  return m ? decodeURIComponent(m[1]) : u;
}

export async function runFlow(flow) {
  const OUT = path.join(CAPTURE_ROOT, flow.id);
  await resetDemo({ quiet: true });
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startDemoServer();
  const { browser, context, blocked } = await launchDemoBrowser();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const scenes = [];
  const texts = {};
  const checks = {};
  const ctx = {
    page, settle, boxes, scrollToEl, scrollTimeline, lastOpenedText,
    waitSaved: () => waitSaved(page), pickDay: (n) => pickDay(page, n),
    login: (who) => login(page, who),
    text: (key, value) => { texts[key] = value; },
    check: (key, value) => { checks[key] = value; },
    shot: async (id, description, elements) => {
      await settle(page);
      const file = `${id}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      const els = await boxes(page, elements);
      scenes.push({ id, description, image: `capture/${flow.id}/${file}`, elements: els });
      console.log('  ✓', id);
    },
  };
  try {
    await trapWindowOpen(page);
    if (flow.login) await ctx.login(flow.login);
    await flow.run(ctx);
    const commits = fs.readFileSync(path.join(RUNTIME_DIR, 'commits.log'), 'utf8').trim().split('\n').filter(Boolean);
    const manifest = {
      reel: flow.id,
      generatedBy: `video/capture/flows/${flow.id}.mjs`,
      demoNow: DEMO_NOW,
      coordinateSystem: {
        unit: 'CSS-Pixel',
        origin: 'links oben im Screenshot (= Viewport, nicht Dokument)',
        viewport: VIEWPORT,
        deviceScaleFactor: DPR,
        imageSize: { width: VIEWPORT.width * DPR, height: VIEWPORT.height * DPR },
        note: 'Bildpixel = CSS-Pixel × deviceScaleFactor. Remotion rechnet mit CSS-Pixeln und skaliert das Bild auf viewport.width.',
      },
      checks: { ...checks, demoCommits: commits, blockedExternalRequests: [...new Set(blocked)], pageErrors: errors },
      texts,
      scenes,
    };
    fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`  Manifest: ${scenes.length} Szenen → public/capture/${flow.id}/manifest.json`);
    if (commits.length) console.log('  Demo-Commits:', commits.join(' | '));
    if (errors.length) console.warn('  Seitenfehler:', errors);
  } catch (e) {
    await page.screenshot({ path: path.join(OUT, '_fehler.png') }).catch(() => {});
    throw e;
  } finally {
    await browser.close();
    server.close();
  }
}
