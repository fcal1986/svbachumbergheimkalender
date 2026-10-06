// Gemeinsamer, abgeschotteter Browser-Kontext für Aufnahmen:
// - api.github.com → lokaler Demo-Mock, Google Fonts → lokale Schriften
// - JEDE andere externe Anfrage (Clarity, GA, Worker, fussball.de, …) wird blockiert und protokolliert
// - feste Uhrzeit, Zeitzone, Sprache; Service Worker blockiert
import { chromium } from 'playwright';
import { DEMO_ORIGIN, DEMO_NOW, DEMO_TZ } from '../demo/demo.config.mjs';

export const VIEWPORT = { width: 400, height: 760 }; // CSS-Pixel, Hochkant-Handy
export const DPR = 3; // 400 × 3 = 1200 px Breite → scharf im 1080er Film, auch bei Zoom

export async function launchDemoBrowser({ headless = true } = {}) {
  const browser = await chromium.launch({ headless, args: ['--lang=de-DE'], env: { ...process.env, LANG: 'de_DE.UTF-8', LANGUAGE: 'de' } });
  const context = await browser.newContext({
    viewport: VIEWPORT, deviceScaleFactor: DPR, isMobile: true, hasTouch: true,
    locale: 'de-DE', timezoneId: DEMO_TZ, serviceWorkers: 'block', colorScheme: 'light', reducedMotion: 'reduce',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36 PlatzcoachDemo',
  });
  await context.clock.install({ time: new Date(DEMO_NOW) });
  const blocked = [];
  await context.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.origin === DEMO_ORIGIN) return route.continue();
    if (u.hostname === 'api.github.com') {
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: {
        'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS' } });
      const resp = await route.fetch({ url: DEMO_ORIGIN + '/__gh' + u.pathname + u.search });
      return route.fulfill({ response: resp });
    }
    if (u.hostname === 'fonts.googleapis.com') {
      const resp = await route.fetch({ url: DEMO_ORIGIN + '/__fonts/css2' });
      return route.fulfill({ response: resp });
    }
    if (u.hostname === 'fonts.gstatic.com') return route.abort();
    blocked.push(req.method() + ' ' + u.origin + u.pathname);
    return route.abort('blockedbyclient');
  });
  return { browser, context, blocked };
}
