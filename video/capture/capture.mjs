#!/usr/bin/env node
// Nimmt die Abläufe der Reels in der echten App auf (Demo-Umgebung, siehe demo/).
//   node capture/capture.mjs                → alle Reels
//   node capture/capture.mjs spielverlegung → nur dieses Reel
// Ausgabe je Reel: public/capture/<reel>/*.png + manifest.json (Screenshots, Elementkoordinaten, abgefangene Texte).
// Vor jedem Reel werden die Demo-Daten zurückgesetzt, weil Playwright echte Aktionen ausführt.
import fs from 'node:fs';
import path from 'node:path';
import { runFlow } from './lib.mjs';
import { VIDEO_DIR } from '../demo/demo.config.mjs';

const list = JSON.parse(fs.readFileSync(path.join(VIDEO_DIR, 'src', 'reels', 'list.json'), 'utf8'));
const wanted = process.argv.slice(2);
const ids = wanted.length ? wanted : list.map((r) => r.id);

for (const id of ids) {
  if (!list.some((r) => r.id === id)) { console.error(`Unbekanntes Reel „${id}“ (siehe src/reels/list.json).`); process.exit(1); }
  const flow = (await import(`./flows/${id}.mjs`)).default;
  console.log(`▶ Aufnahme ${id}`);
  try {
    await runFlow(flow);
  } catch (e) {
    console.error(`✗ ${id}: ${e.message.split('\n')[0]} (Bild: public/capture/${id}/_fehler.png)`);
    process.exit(1);
  }
}
