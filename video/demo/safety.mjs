// Schutz gegen versehentliche Ausführung auf echten Daten.
// Seed/Reset und Mock-Server rufen diese Prüfungen vor jedem Schreibzugriff auf.
import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_DIR, RUNTIME_DATA, REPO_ROOT, MARKER_FILE, DEMO_REPO } from './demo.config.mjs';

export class DemoSafetyError extends Error {}

function fail(msg) {
  throw new DemoSafetyError('[Demo-Schutz] ' + msg + ' – Abbruch, nichts wurde geschrieben.');
}

export function assertNotProductionEnv() {
  const env = (process.env.PLATZCOACH_ENV || process.env.NODE_ENV || '').toLowerCase();
  if (env === 'production' || env === 'prod') fail(`Umgebung ist „${env}“`);
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.PLATZCOACH_ALLOW_DEMO_IN_CI !== '1')
    fail('läuft in GitHub Actions (setze PLATZCOACH_ALLOW_DEMO_IN_CI=1 nur für isolierte Demo-Läufe)');
}

// Ein Zielpfad ist nur gültig, wenn er innerhalb von video/.demo-runtime liegt
// und NIE der echte Datenordner des Repos ist.
export function assertDemoPath(target) {
  const abs = path.resolve(target);
  const realData = path.join(REPO_ROOT, 'data');
  if (abs === realData || abs.startsWith(realData + path.sep)) fail(`Ziel ${abs} ist der echte Datenordner`);
  if (abs !== RUNTIME_DIR && !abs.startsWith(RUNTIME_DIR + path.sep)) fail(`Ziel ${abs} liegt außerhalb von ${RUNTIME_DIR}`);
  return abs;
}

export function assertMarker() {
  const m = path.join(RUNTIME_DIR, MARKER_FILE);
  if (!fs.existsSync(m)) fail(`Markierungsdatei ${m} fehlt`);
}

export function assertDemoConfig(cfg) {
  if (!cfg || typeof cfg.repo !== 'string' || !cfg.repo.startsWith('demo/')) fail(`config.repo ist „${cfg && cfg.repo}“, erwartet demo/…`);
  if (cfg.repo !== DEMO_REPO) fail(`config.repo „${cfg.repo}“ ≠ ${DEMO_REPO}`);
  if (cfg.registration || cfg.passwordReset || cfg.push) fail('config enthält echte Worker/Push-Ziele');
}

export function assertSafeToWrite(target) {
  assertNotProductionEnv();
  const abs = assertDemoPath(target);
  assertMarker();
  const cfgPath = path.join(RUNTIME_DATA, 'config.json');
  if (fs.existsSync(cfgPath)) assertDemoConfig(JSON.parse(fs.readFileSync(cfgPath, 'utf8')));
  return abs;
}
