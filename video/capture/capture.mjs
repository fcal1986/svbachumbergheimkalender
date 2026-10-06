#!/usr/bin/env node
// Nimmt den Demo-Ablauf in der echten App auf und schreibt Screenshots + Elementkoordinaten
// in public/capture/ (Szenenmanifest: public/capture/manifest.json).
//
// Ablauf: Demo zurücksetzen → lokalen Server starten → Trainer anmelden →
//   1 Startseite (Platzbelegung heute) → 2 Neuer Termin → 3 Training 17:00, 90 min: Konflikt mit D1
//   → 4 Hälfte A abwählen: Hälfte B „Passt“ → 5 gespeichert, Termin in der Wochenansicht.
//
// Koordinaten: CSS-Pixel relativ zur linken oberen Ecke des Screenshots (= Viewport).
// Bildpixel = CSS-Pixel × deviceScaleFactor (siehe manifest.coordinateSystem).
import fs from 'node:fs';
import path from 'node:path';
import { resetDemo } from '../demo/seed.mjs';
import { startDemoServer } from '../demo/server.mjs';
import { launchDemoBrowser, VIEWPORT, DPR } from './browser.mjs';
import { DEMO_ORIGIN, DEMO_LOGIN, DEMO_NOW, VIDEO_DIR, RUNTIME_DIR } from '../demo/demo.config.mjs';

const OUT = path.join(VIDEO_DIR, 'public', 'capture');

async function settle(page) {
  // Schriften, Bilder, kein Toast, keine laufende Speicher-Anzeige, zwei Frames Ruhe.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.waitForFunction(() => !document.querySelector('#toast.show') && !document.querySelector('#saving-pill.show'), null, { timeout: 8000 });
  await page.waitForTimeout(400); // Ausblend-Animation des Hinweises
  await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(250);
}

async function boxes(page, map) {
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

// Scrollt die Seite so, dass das Element mit `topOffset` CSS-px unter der Kopfzeile steht.
async function scrollToEl(page, sel, topOffset = 90) {
  await page.locator(sel).first().evaluate((el, off) => {
    let sc = el.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    sc = sc || document.scrollingElement;
    sc.scrollTop += el.getBoundingClientRect().top - off;
  }, topOffset);
  await page.waitForTimeout(250);
}

// Zeitleiste im Formular so verschieben, dass ab `hhmm` zu sehen ist (wie ein Wischen des Nutzers).
async function scrollTimeline(page, minutes) {
  await page.evaluate((m) => {
    const sc = document.querySelector('#f-tl .tl-scroll');
    const t0 = +sc.dataset.t0, t1 = +sc.dataset.t1;
    const pad = sc.querySelector('.tl-pad');
    sc.scrollLeft = Math.max(0, pad.scrollWidth * (m - t0) / (t1 - t0));
  }, minutes);
  await page.waitForTimeout(200);
}

async function main() {
  await resetDemo();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startDemoServer();
  const { browser, context, blocked } = await launchDemoBrowser();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const scenes = [];
  const shot = async (id, description, elements) => {
    await settle(page);
    const file = `${id}.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    const els = await boxes(page, elements);
    scenes.push({ id, description, image: `capture/${file}`, elements: els });
    console.log('✓', id);
  };

  try {
    await page.goto(DEMO_ORIGIN + '/');
    await page.waitForSelector('button.navbtn[data-nav="start"]');
    // Anmeldung über die echte Anmeldemaske (vorhandener Mechanismus: verschlüsselter Token in users.json).
    await page.evaluate(() => openLogin());
    await page.fill('#li-user', DEMO_LOGIN.email);
    await page.fill('#li-pass', DEMO_LOGIN.password);
    await page.click('#li-btn');
    await page.waitForEvent('load');
    await page.waitForFunction(() => typeof session !== 'undefined' && session && session.name === 'Max Mustermann');
    await page.waitForSelector('#hd-user.in');

    // 1 Startseite: Platzbelegung heute
    await page.waitForSelector('#stp-live .lp-status');
    await scrollToEl(page, 'section.st-platz', 96);
    await shot('01-start', 'Startseite: Platzbelegung heute, live', {
      platzSection: 'section.st-platz',
      livePitch: '#stp-live .lp',
      statusPill: '#stp-live .lp-status',
      weekStrip: 'section.st-platz .stw-strip',
      navNeu: 'button.navbtn[data-nav="neu"]',
    });

    // 2 Neuer Termin
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await shot('02-form', 'Neuer Termin: Terminart wählen', {
      chipTraining: '#f-kind-chips button:has-text("Training")',
      teamChips: '#f-team-chips',
      dateBox: '.nf-date',
    });

    // 3 Training, 17:00, 90 Minuten → Konflikt (D1 trainiert auf Hälfte A)
    await page.click('#f-kind-chips button:has-text("Training")');
    await page.click('#f-durs button:has-text("90")');
    await page.locator('#f-von').fill('17:00');
    await page.locator('#f-von').dispatchEvent('change');
    await page.waitForFunction(() => /belegt/.test(document.getElementById('f-tl-status').innerText));
    await scrollToEl(page, '.nf-card', 70);
    await scrollTimeline(page, 15 * 60 + 45);
    await shot('03-conflict', 'Training E2, Di 17:00–18:30, ganzer Platz: Überschneidung mit D1 erkannt', {
      timeCard: '.nf-card',
      von: '#f-von',
      dur90: '#f-durs button:has-text("90")',
      timeline: '#f-tl',
      status: '#f-tl-status',
      pickA: '#f-tl button[aria-label="Hälfte A"]',
      pickB: '#f-tl button[aria-label="Hälfte B"]',
      suggestion: 'button:has-text("Hälfte B buchen")',
      suggestionBox: '#fb-share-note',
      save: 'button:has-text("Termin speichern")',
    });

    // 4 Vorschlag der App „Hälfte B buchen“ antippen → „Passt“
    await page.click('button:has-text("Hälfte B buchen")');
    await page.waitForFunction(() => /Passt/.test(document.getElementById('f-tl-status').innerText));
    await scrollToEl(page, '.nf-card', 70);
    await scrollTimeline(page, 15 * 60 + 45);
    await shot('04-ok', 'Vorschlag übernommen: Hälfte B frei, Speichern möglich', {
      timeline: '#f-tl',
      status: '#f-tl-status',
      pickA: '#f-tl button[aria-label="Hälfte A"]',
      pickB: '#f-tl button[aria-label="Hälfte B"]',
      save: 'button:has-text("Termin speichern")',
    });
    const statusText = await page.locator('#f-tl-status').innerText();

    // 5 Speichern → Prüfansicht der App
    await page.click('button:has-text("Termin speichern")');
    const sheet = page.locator('text=Termin prüfen').locator('xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]');
    await sheet.waitFor();
    await page.waitForTimeout(500); // Einblend-Animation
    await shot('05-review', 'Prüfansicht vor dem Speichern: Hälfte B, Platz frei', {
      sheet: 'text=Termin prüfen >> xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]',
      rowWo: 'text=Hälfte B >> nth=-1',
      rowPlatz: 'text=/✓ ?frei/ >> nth=-1',
      confirm: 'button:has-text("Jetzt speichern")',
    });

    // 6 Jetzt speichern (geht an den lokalen Mock) → Termin erscheint im Kalender
    await page.click('button:has-text("Jetzt speichern")');
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane !== 'neu', null, { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector('#saving-pill.show'), null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await scrollToEl(page, '#st-week', 0);
    await page.locator('#st-week').first().evaluate((el) => { let sc = el.parentElement; while (sc && sc.scrollTop === 0 && sc !== document.body) sc = sc.parentElement; if (sc) sc.scrollTop = 0; });
    await shot('06-saved', 'Nach dem Speichern: „Als Nächstes“ zeigt das neue Training, Platzbelegung aktualisiert', {
      nextCard: 'text=E2 · Training >> xpath=ancestor::*[.//*[contains(text(),"Als Nächstes")]][1]',
      nextTitle: 'text=E2 · Training',
      livePitch: '#stp-live .lp',
    });
    await scrollToEl(page, 'section.st-platz .tl', 230);
    await shot('07-timeline', 'Zeitleiste heute: E2 auf Hälfte B neben D1 auf Hälfte A', {
      timeline: 'section.st-platz .tl',
      blockE2: 'section.st-platz .tl >> text=E2 >> xpath=ancestor::*[self::button or self::div][contains(@style,"left")][1]',
      blockD1: 'section.st-platz .tl >> text=D1 >> xpath=ancestor::*[self::button or self::div][contains(@style,"left")][1]',
    });

    const commits = fs.readFileSync(path.join(RUNTIME_DIR, 'commits.log'), 'utf8').trim().split('\n').filter(Boolean);
    const manifest = {
      generatedBy: 'video/capture/capture.mjs',
      demoNow: DEMO_NOW,
      coordinateSystem: {
        unit: 'CSS-Pixel',
        origin: 'links oben im Screenshot (= Viewport, nicht Dokument)',
        viewport: VIEWPORT,
        deviceScaleFactor: DPR,
        imageSize: { width: VIEWPORT.width * DPR, height: VIEWPORT.height * DPR },
        note: 'Bildpixel = CSS-Pixel × deviceScaleFactor. Remotion rechnet mit CSS-Pixeln und skaliert das Bild auf viewport.width.',
      },
      checks: { statusAfterFix: statusText, demoCommits: commits, blockedExternalRequests: [...new Set(blocked)], pageErrors: errors },
      scenes,
    };
    fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Manifest: ${scenes.length} Szenen → ${path.relative(VIDEO_DIR, OUT)}/manifest.json`);
    console.log('Demo-Commits:', commits.join(' | ') || '–');
    if (errors.length) console.warn('Seitenfehler:', errors);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
