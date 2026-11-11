import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from 'playwright';

// Kein GitHub-Token, keine echten E-Mails und kein Speichern: nur lokaler HTTP-Server.
fs.mkdirSync('tests/_results', { recursive: true });
const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { stdio: 'ignore' });
let browser;
try {
  await new Promise(resolve => setTimeout(resolve, 1000));
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
  // Stabile Kalender-Woche: Test muss auch nach November 2026 reproduzierbar sein.
  await page.clock.install({ time: new Date('2026-11-11T09:00:00Z') });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('.stw-strip') && document.getElementById('hd-title')?.textContent === 'Start', { timeout: 25000 });

  // Pilot #139: Nur die Folgetage wischen; Heute bleibt links fixiert.
  const fixedToday = page.locator('.stw-strip > .stw-day.today');
  const dayStrip = page.locator('.stw-strip-scroll');
  assert.equal(await fixedToday.count(), 1, 'Heute ist eine eigene feste Kachel');
  assert.equal(await dayStrip.locator('.stw-day').count(), 27, 'Initial nur vier Wochen DOM, keine ganze Saison');
  const todayX = (await fixedToday.boundingBox()).x;
  await dayStrip.evaluate((el) => { el.scrollLeft = 280; });
  await page.waitForFunction(() => document.querySelector('.stw-strip-scroll')?.scrollLeft >= 200);
  assert.equal(Math.round((await fixedToday.boundingBox()).x), Math.round(todayX),
    'Heute bleibt beim Wischen an derselben Bildschirmposition');
  assert.equal(await page.evaluate(() => startSel), '2026-11-11', 'Wischen ändert nicht den gewählten Tag');

  const futureDay = dayStrip.locator('button[onclick="setStartDay(\'2026-11-23\')"]');
  await futureDay.click();
  assert.equal(await page.evaluate(() => startSel), '2026-11-23', 'Tag in der Folgewoche anwählbar');
  assert.equal(await page.locator('.stw-strip > .stw-day.today').count(), 1);
  assert.ok(await dayStrip.evaluate((el) => el.scrollLeft > 0), 'Scrollposition bleibt nach Tageswahl erhalten');

  // Späterer Freitag: SUG ist nur an diesem Spielort belegt; keine falsche Halle im Außenplatz.
  await page.locator('.stw-strip-scroll button[onclick="setStartDay(\'2026-11-20\')"]').click();
  assert.equal(await page.evaluate(() => startSel), '2026-11-20');
  assert.equal(await page.locator('.pc-venue-list button').count(), 2);
  assert.equal(await page.locator('#stp-live .lp-halle').count(), 0, 'Außenplatz ohne Hallendarstellung');
  await page.locator('.pc-venue-list button').filter({ hasText: 'SUG' }).click();
  assert.equal(await page.locator('#stp-live .lp-hall-only').count(), 1);

  // Zurück zu Heute: heutige Uhrzeit, Anfangsposition und erste sieben Tage sichtbar.
  await fixedToday.click();
  assert.equal(await page.evaluate(() => startSel), '2026-11-11');
  assert.equal(await dayStrip.evaluate((el) => el.scrollLeft), 0);
  assert.equal(await page.locator('.stw-strip-scroll .stw-day').count(), 27);
  assert.equal(await page.locator('.stw-strip > .stw-day.today span').innerText(), 'Heute');

  // Beim Erreichen des aktuell gerenderten Endes wird die nächste Gruppe von Tagen ergänzt.
  await dayStrip.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  await page.waitForFunction(() => document.querySelectorAll('.stw-strip-scroll .stw-day').length > 27);
  assert.equal(await dayStrip.locator('.stw-day').count(), 41, 'Weitere zwei Wochen inkrementell ergänzt');

  // Saisonende stammt aus data/seasons.json, kein festes Vierwochenlimit.
  await page.evaluate(() => { START_STRIP_DAYS = startStripTotalDays(); renderMyWeek(); });
  const lastDay = dayStrip.locator('button[onclick="setStartDay(\'2027-06-30\')"]');
  assert.equal(await lastDay.count(), 1, 'Letzter Saisontag ist vorhanden');
  assert.equal(await dayStrip.locator('button[onclick="setStartDay(\'2027-07-01\')"]').count(), 0);
  await lastDay.click();
  assert.equal(await page.evaluate(() => startSel), '2027-06-30');
  await page.evaluate(() => setStartDay('2027-07-01'));
  assert.equal(await page.evaluate(() => startSel), '2027-06-30', 'Kein Tag außerhalb der Saison');
  await page.locator('.stw-strip > .stw-day.today').click();
  assert.equal(await page.evaluate(() => startSel), '2026-11-11');
  await page.screenshot({ path: 'tests/_results/start-tagesleiste-139.png', fullPage: true });

  // Öffentliche Startseite: Tagesleiste über Platz, am 14.11. eine zugeteilte Halle.
  await page.evaluate(() => { startSel = '2026-11-14'; renderStart(); });
  await page.waitForSelector('.stw-day .hall-mark');
  assert.ok((await page.locator('.stw-day .hall-mark').allTextContents()).includes('1 Halle'));
  assert.equal(await page.locator('.st-now .pc-venue-list button').count(), 2);
  await page.locator('.st-now .pc-venue-list button').filter({ hasText: 'Binnerfeld' }).click();
  assert.equal(await page.locator('.st-now .pc-venue-list .nf-chip.on').count(), 1);
  await page.screenshot({ path: 'tests/_results/start-halle.png', fullPage: true });

  // Regression #135: Beim Wischen darf die Höllenbergkampfbahn KEINE Halle anzeigen.
  // Donnerstag 17:25 läuft in Bergheim-Schule die E3. Diese ist am Außen-Spielort unsichtbar.
  await page.evaluate(() => {
    startSel = '2026-11-12';
    START_VENUE = 'home';
    delete START_CUR[startSel];
    renderStart();
  });
  await page.locator('#stp-live .lp-field').waitFor();
  assert.equal(await page.locator('#stp-live .lp-halle').count(), 0, 'Außenplatz ohne Hallenzeile');
  await page.evaluate(() => {
    const el = document.querySelector('.st-now .tl-scroll');
    const g = tlGeom(el), target = 17 * 60 + 25;
    el.scrollLeft = Math.round((target - g.t0) / (g.t1 - g.t0) * g.w);
    tlScroll(el);
  });
  await page.waitForFunction(() => START_CUR['2026-11-12'] >= 1040 && START_CUR['2026-11-12'] <= 1050);
  await page.waitForTimeout(100); // requestAnimationFrame für Live-Bild
  assert.equal(await page.locator('#stp-live .lp-halle').count(), 0, 'Auch nach dem Scrollen keine Halle auf dem Außenplatz');
  assert.equal(await page.locator('.st-now .tl-labels').innerText().then(t => /H1|H2|H3|Halle/.test(t)), false,
    'Zeitleiste am Außenplatz enthält keine Hallenspuren');
  await page.screenshot({ path: 'tests/_results/start-aussen-nach-scroll.png', fullPage: true });

  // Spielortwechsel bei derselben Uhrzeit zeigt ausschließlich die echte Hallenbelegung.
  await page.locator('.st-now .pc-venue-list button').filter({ hasText: 'Bergheim-Schule' }).click();
  await page.locator('#stp-live .lp-hall-only').waitFor();
  assert.equal(await page.locator('#stp-live .lp-field').count(), 0, 'Hallenspielort hat kein Außen-Spielfeld');
  assert.match(await page.locator('#stp-live').innerText(), /E3/, 'E3 ist 17:25 in der Bergheim-Schule');
  await page.locator('.st-now .pc-venue-list button').filter({ hasText: 'Höllenbergkampfbahn' }).click();
  await page.locator('#stp-live .lp-field').waitFor();
  assert.equal(await page.locator('#stp-live .lp-halle').count(), 0, 'Zurück auf den Außenplatz ohne Halle');

  // Vorhandener Tab „Neu“ (ohne Login gegen das echte Repo):
  // nur lokale, fiktive Testsitzung; KEIN Speichern, KEINE externen Schreibzugriffe.
  await page.evaluate(() => {
    session = { id: 'ci-test-user', name: 'Test', token: 'nicht-echt', isAdmin: true, classes: { 'E-Jugend': [2] } };
    newEvent('2026-11-14');
  });
  await page.locator('#f-venue-wrap').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#f-venue-chips button').count(), 2);
  assert.equal(await page.locator('#f-tl-addbtn').innerText(), 'Ressourcen einblenden');
  assert.equal(await page.locator('#save-label').innerText(), 'Termin speichern');
  await page.locator('#f-venue-chips button').filter({ hasText: 'Binnerfeld' }).click();
  assert.equal(await page.locator('#f-tl .tl-pick-b').count(), 3, 'Binnerfeld H1/H2/H3');
  assert.equal(await page.locator('#f-tl .tl-blk').count(), 6, 'C2/D1 und C1 auf allen 3 Dritteln');
  assert.equal(await page.locator('#f-tl .tl-free').count(), 0, 'Belegte Halle ist nicht frei');
  await page.screenshot({ path: 'tests/_results/neu-hallenplan.png', fullPage: true });

  // Außerhalb 01.11.–31.03.: nur Außenplatz, keine Spielort-Auswahl.
  await page.evaluate(() => {
    dateInput().value = '2026-09-12';
    updateWeekday(); renderPitch(); renderHalle();
  });
  await page.locator('#f-venue-wrap').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#f-tl .tl-pick-b').count() >= 7, true, 'A/B, Viertel 1–4, KF');
  await page.screenshot({ path: 'tests/_results/neu-aussenplan.png', fullPage: true });
  assert.deepEqual(errors, [], 'Keine JavaScript-Ausführungsfehler');
  console.log('375px: Start, Binnerfeld, Hallenzeitleiste und Außenplan korrekt.');
} finally {
  await browser?.close();
  server.kill();
}
