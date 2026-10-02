// scripts/push-test.mjs – Testnachricht an die Geräte eines Zugangs (Konto → „Test-Push senden“).
// Ausgelöst per repository_dispatch "push-test" mit client_payload.userId. Prüft dabei auch das Secret.
import fs from 'node:fs/promises';
import { loadPushDevices, pushToUser, appLink, pushConfigured, pushKeyMatches } from './push-lib.mjs';

async function main() {
  const cfg = JSON.parse(await fs.readFile('data/config.json', 'utf8'));
  const userId = process.env.PUSH_TEST_USER || '';
  if (!pushConfigured(cfg)) { console.error('PUSH-TEST: Secret VAPID_PRIVATE_KEY oder push.vapidPublicKey fehlt.'); process.exit(1); }
  if (!pushKeyMatches(cfg)) { console.error('PUSH-TEST: Secret passt NICHT zum öffentlichen Schlüssel in config.json.'); process.exit(1); }
  console.log('PUSH-TEST: Secret passt zum öffentlichen Schlüssel.');
  const devices = await loadPushDevices(cfg);
  const mine = devices.filter(d => d.userId === userId);
  console.log(`PUSH-TEST: ${devices.length} Gerät(e) insgesamt, ${mine.length} für diesen Zugang.`);
  if (!mine.length) process.exit(1);
  const ok = await pushToUser(cfg, devices, userId, { title: 'Platzcoach: Test', body: 'Push funktioniert auf diesem Gerät. 👍', url: appLink(cfg, null), tag: 'pc-test' });
  console.log(`PUSH-TEST: ${ok} von ${mine.length} gesendet.`);
  if (!ok) process.exit(1);
}
main().catch(e => { console.error(e); process.exit(1); });
