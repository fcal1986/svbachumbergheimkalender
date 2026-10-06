#!/usr/bin/env node
// Kopiert Marken-Assets und Schriften in public/ (gitignored) und prüft, ob die Aufnahme vorhanden ist.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { VIDEO_DIR, REPO_ROOT } from '../demo/demo.config.mjs';

const require = createRequire(import.meta.url);
const pub = path.join(VIDEO_DIR, 'public');
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };

export function prepare() {
  for (const f of ['logo-white.svg', 'logo-horizontal.svg']) copy(path.join(REPO_ROOT, 'assets', f), path.join(pub, 'brand', f));
  const inter = path.join(path.dirname(require.resolve('@fontsource/inter/package.json')), 'files');
  const manrope = path.join(path.dirname(require.resolve('@fontsource/manrope/package.json')), 'files');
  for (const w of [600, 700]) copy(path.join(inter, `inter-latin-${w}-normal.woff2`), path.join(pub, 'fonts', `inter-latin-${w}-normal.woff2`));
  copy(path.join(manrope, 'manrope-latin-800-normal.woff2'), path.join(pub, 'fonts', 'manrope-latin-800-normal.woff2'));
  if (!fs.existsSync(path.join(pub, 'capture', 'manifest.json'))) {
    console.error('Aufnahme fehlt: zuerst „npm run capture“ ausführen.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) { prepare(); console.log('public/ vorbereitet.'); }
