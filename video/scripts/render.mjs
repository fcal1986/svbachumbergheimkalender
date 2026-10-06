#!/usr/bin/env node
// Rendert den Hauptfilm und/oder die Einstiegsvorschauen nach out/.
//   node scripts/render.mjs                    → alle Reels + Einstiegsvorschauen
//   node scripts/render.mjs spielverlegung …   → nur diese Reels
//   node scripts/render.mjs previews           → nur Einstiegsvorschauen
// Browser: REMOTION_BROWSER_EXECUTABLE, sonst das Chrome-Headless-Shell von Playwright, sonst Remotions eigener Download.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { VIDEO_DIR } from '../demo/demo.config.mjs';
import { prepare } from './prepare.mjs';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(path.join(VIDEO_DIR, 'src', 'reels', 'list.json'), 'utf8'));
const OUT = path.join(VIDEO_DIR, 'out');
const RAW = path.join(OUT, 'raw');
fs.mkdirSync(RAW, { recursive: true });
prepare();

function findBrowser() {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) return process.env.REMOTION_BROWSER_EXECUTABLE;
  try {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.HOME || '', '.cache', 'ms-playwright');
    const dir = fs.readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop();
    if (dir) {
      const sub = fs.readdirSync(path.join(base, dir)).find((d) => fs.existsSync(path.join(base, dir, d, 'headless_shell')));
      if (sub) return path.join(base, dir, sub, 'headless_shell');
    }
  } catch { /* Remotion lädt dann selbst */ }
  return null;
}

const browser = findBrowser();
const cli = path.join(path.dirname(require.resolve('@remotion/cli/package.json')), 'remotion-cli.js');

function render(comp, file, props) {
  const args = [cli, 'render', 'src/index.ts', comp, path.join('out', 'raw', file), `--props=${JSON.stringify(props)}`, '--log=info'];
  args.push(`--concurrency=${Math.max(1, Math.min(4, os.cpus().length))}`);
  if (browser) args.push(`--browser-executable=${browser}`);
  console.log(`\n▶ ${comp} → out/${file}  ${JSON.stringify(props)}`);
  const r = spawnSync(process.execPath, args, { cwd: VIDEO_DIR, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`Rendern fehlgeschlagen (${comp}).`); process.exit(r.status || 1); }
  finalize(path.join(RAW, file), path.join(OUT, file));
  const size = fs.statSync(path.join(OUT, file)).size;
  console.log(`✓ out/${file} (${(size / 1e6).toFixed(1)} MB)`);
}

// Social-Export: yuv420p im TV-Bereich, H.264 High, +faststart (WhatsApp/Instagram), Tonspur immer vorhanden
// (stumme AAC-Spur, wenn der Film keinen Ton hat – manche Apps behandeln Videos ohne Tonspur als GIF).
function finalize(src, dst) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', src], { encoding: 'utf8' });
  const hasAudio = probe.status === 0 && probe.stdout.trim() !== '';
  const args = ['-y', '-loglevel', 'error', '-i', src];
  if (!hasAudio) args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
  args.push('-map', '0:v', '-map', hasAudio ? '0:a' : '1:a', '-shortest',
    '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '18',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst);
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) { console.error('ffmpeg-Export fehlgeschlagen – Rohdatei liegt in out/raw/.'); process.exit(1); }
}

const onlyPreviews = args.includes('previews');
const ids = args.filter((a) => a !== 'previews');
const chosen = ids.length ? list.filter((r) => ids.includes(r.id)) : list;
if (ids.length && chosen.length !== ids.length) { console.error('Unbekanntes Reel – siehe src/reels/list.json'); process.exit(1); }
for (const r of chosen) {
  if (!onlyPreviews) render(`Reel-${r.id}`, `${r.file}.mp4`, { reel: r.id });
  if (!ids.length || onlyPreviews) for (const h of r.previews || []) render(`Vorschau-${r.id}`, `${r.file}-einstieg-${h}.mp4`, { reel: r.id, hook: h });
}
