// node --test demo/safety.test.mjs – prüft, dass Seed/Reset und Mock nie auf echte Daten zugreifen.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, RUNTIME_DATA, DEMO_TOKEN, DEMO_ORIGIN, VIDEO_DIR } from './demo.config.mjs';
import { assertDemoPath, assertDemoConfig, DemoSafetyError } from './safety.mjs';
import { resetDemo } from './seed.mjs';
import { startDemoServer } from './server.mjs';

test('echter Datenordner wird abgelehnt', () => {
  assert.throws(() => assertDemoPath(path.join(REPO_ROOT, 'data')), DemoSafetyError);
  assert.throws(() => assertDemoPath(path.join(REPO_ROOT, 'data', 'events.json')), DemoSafetyError);
  assert.throws(() => assertDemoPath('/tmp'), DemoSafetyError);
  assert.equal(assertDemoPath(RUNTIME_DATA), RUNTIME_DATA);
});

test('Konfiguration mit echtem Repo wird abgelehnt', () => {
  assert.throws(() => assertDemoConfig({ repo: 'fcal1986/svbachumbergheimkalender' }), DemoSafetyError);
  assert.throws(() => assertDemoConfig({ repo: 'demo/platzcoach-demo', registration: { workerUrl: 'https://x' } }), DemoSafetyError);
});

test('Reset verweigert PLATZCOACH_ENV=production', () => {
  const r = spawnSync(process.execPath, ['demo/seed.mjs'], { cwd: VIDEO_DIR, env: { ...process.env, PLATZCOACH_ENV: 'production' }, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Demo-Schutz/);
});

test('Mock: nur Demo-Repo und Demo-Token', async () => {
  await resetDemo({ quiet: true });
  const srv = await startDemoServer();
  try {
    const ok = await fetch(DEMO_ORIGIN + '/__gh/repos/demo/platzcoach-demo/contents/data/events.json', { headers: { Authorization: 'Bearer ' + DEMO_TOKEN } });
    assert.equal(ok.status, 200);
    const realRepo = await fetch(DEMO_ORIGIN + '/__gh/repos/fcal1986/svbachumbergheimkalender/contents/data/events.json', { headers: { Authorization: 'Bearer ' + DEMO_TOKEN } });
    assert.equal(realRepo.status, 403);
    const badToken = await fetch(DEMO_ORIGIN + '/__gh/repos/demo/platzcoach-demo/contents/data/events.json', { headers: { Authorization: 'Bearer ghp_echt' } });
    assert.equal(badToken.status, 401);
    const escape = await fetch(DEMO_ORIGIN + '/__gh/repos/demo/platzcoach-demo/contents/data/..%2F..%2Findex.html', { method: 'PUT', headers: { Authorization: 'Bearer ' + DEMO_TOKEN } });
    assert.notEqual(escape.status, 200);
  } finally { srv.close(); }
});
