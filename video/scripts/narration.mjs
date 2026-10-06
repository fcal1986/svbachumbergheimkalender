#!/usr/bin/env node
// Erzeugt je Reel aus src/reels/<id>.ts den Sprechertext (out/<datei>-sprechertext.md) und Untertitel je Einstieg
// (out/<datei>-<einstieg>.geschaetzt.srt). Zeiten sind GESCHÄTZT, nicht wortgenau.
import fs from 'node:fs';
import path from 'node:path';
import { VIDEO_DIR } from '../demo/demo.config.mjs';

const OUT = path.join(VIDEO_DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const list = JSON.parse(fs.readFileSync(path.join(VIDEO_DIR, 'src', 'reels', 'list.json'), 'utf8'));
const ts = (s) => { const ms = Math.round(s * 1000); const h = String(Math.floor(ms / 3.6e6)).padStart(2, '0');
  const m = String(Math.floor(ms / 6e4) % 60).padStart(2, '0'); const sec = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, '0')}`; };
const words = (t) => t.split(/\s+/).filter(Boolean).length;

let all = '# Sprechertexte Platzcoach-Reels\n\n> Zeiten **geschätzt** (≈ 2,4 Wörter/s), nicht wortgenau. Nach der Sprachaufnahme durch echte Zeitmarken ersetzen.\n';
for (const item of list) {
  const reel = (await import(path.join(VIDEO_DIR, 'src', 'reels', `${item.id}.ts`))).default;
  const cues = (hook) => reel.narration.map((c) => ({ ...c, text: c.text === '__HOOK__' ? reel.hooks[hook].label : c.text }));
  for (const hook of Object.keys(reel.hooks)) {
    const srt = cues(hook).map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text}\n`).join('\n');
    fs.writeFileSync(path.join(OUT, `${item.file}-${hook}.geschaetzt.srt`), srt);
  }
  let md = `\n## Reel ${item.nr} – ${reel.title}\n\nZielgruppe: ${reel.audience} · ${reel.durationS} s\n\n| Zeit | Text | Wörter |\n|---|---|---|\n`;
  for (const c of cues(reel.mainHook)) md += `| ${c.from.toFixed(1)}–${c.to.toFixed(1)} s | ${c.text} | ${words(c.text)} |\n`;
  md += '\nEinstiege: ' + Object.entries(reel.hooks).map(([id, h]) => `\`${id}\` „${h.label}“`).join(' · ') + '\n';
  md += `\nBelegte Aussagen: ${reel.claims.join('; ')}.\n`;
  all += md;
}
fs.writeFileSync(path.join(OUT, 'sprechertexte.md'), all);
console.log(`✓ out/sprechertexte.md + SRT-Dateien für ${list.length} Reels (Zeiten geschätzt)`);
