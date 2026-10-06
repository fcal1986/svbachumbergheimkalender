#!/usr/bin/env node
// Setzt die Demo-Daten auf den festen Ausgangszustand zurück.
// Schreibt ausschließlich nach video/.demo-runtime/data (geprüft in safety.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_DIR, RUNTIME_DATA, MARKER_FILE } from './demo.config.mjs';
import { assertNotProductionEnv, assertDemoPath, assertSafeToWrite, assertDemoConfig } from './safety.mjs';
import { buildDemoData } from './fixtures.mjs';

export async function resetDemo({ quiet = false } = {}) {
  assertNotProductionEnv();
  assertDemoPath(RUNTIME_DIR);
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  // Markierung erst anlegen, wenn der Pfad geprüft ist – ohne Markierung schreibt nichts.
  const marker = path.join(RUNTIME_DIR, MARKER_FILE);
  if (!fs.existsSync(marker)) fs.writeFileSync(marker, 'Platzcoach-Demo-Laufzeitordner. Inhalt wird bei jedem Reset ersetzt.\n');

  const files = await buildDemoData();
  assertDemoConfig(files['config.json']);
  assertSafeToWrite(RUNTIME_DATA);
  fs.rmSync(RUNTIME_DATA, { recursive: true, force: true });
  fs.mkdirSync(RUNTIME_DATA, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    fs.writeFileSync(path.join(assertDemoPath(path.join(RUNTIME_DATA, name))), JSON.stringify(data, null, 2) + '\n');
  }
  fs.writeFileSync(path.join(RUNTIME_DIR, 'commits.log'), '');
  if (!quiet) console.log(`Demo zurückgesetzt: ${Object.keys(files).length} Dateien in ${path.relative(process.cwd(), RUNTIME_DATA) || RUNTIME_DATA}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  resetDemo().catch((e) => { console.error(e.message); process.exit(1); });
}
