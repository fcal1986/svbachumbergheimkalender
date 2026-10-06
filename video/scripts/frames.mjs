#!/usr/bin/env node
// Prüfbilder aus den FERTIGEN MP4-Dateien (nicht aus Remotion-Stills):
//   out/check/<film>-sheet.jpg  – Kontaktbogen alle 1,5 s, mit roter Linie für die Social-Safe-Zone
//   out/check/<film>-t<sek>.jpg – einzelne Frames in voller Größe an Schlüsselstellen
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VIDEO_DIR } from '../demo/demo.config.mjs';

const OUT = path.join(VIDEO_DIR, 'out');
const CHECK = path.join(OUT, 'check');
fs.mkdirSync(CHECK, { recursive: true });
const SAFE_TOP = 220, SAFE_BOTTOM = 400; // wie src/config/common.ts → safe
const KEY_TIMES = (dur) => dur > 10 ? [1.5, 5, 8.5, 11.5, 14.5, 17.5, 20.5, 23.5, 28] : [1.5, 2.9, 5];

const ff = (args) => { const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status) process.exit(1); };
const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.mp4'));
if (!files.length) { console.error('Keine MP4 in out/ – zuerst „npm run render“.'); process.exit(1); }

for (const f of files) {
  const name = f.replace(/\.mp4$/, '');
  const src = path.join(OUT, f);
  const guides = `drawbox=x=0:y=${SAFE_TOP}:w=iw:h=4:color=red@0.8:t=fill,drawbox=x=0:y=ih-${SAFE_BOTTOM}:w=iw:h=4:color=red@0.8:t=fill`;
  const dur = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], { encoding: 'utf8' }).stdout);
  const n = Math.ceil(dur / 1.5);
  const cols = 5, rows = Math.ceil(n / cols);
  ff(['-i', src, '-vf', `fps=1/1.5,${guides},scale=270:480,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}`, '-frames:v', '1', path.join(CHECK, `${name}-sheet.jpg`)]);
  for (const t of KEY_TIMES(dur)) {
    ff(['-ss', String(t), '-i', src, '-frames:v', '1', '-q:v', '3', path.join(CHECK, `${name}-t${String(t).replace('.', '_')}.jpg`)]);
  }
  console.log(`✓ ${name}: Kontaktbogen + ${KEY_TIMES(dur).length} Einzelbilder (Dauer ${dur.toFixed(1)} s)`);
}
