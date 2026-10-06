#!/usr/bin/env node
// Erzeugt aus src/config/film.ts den Sprechertext (out/sprechertext.md) und Untertitel je Einstieg
// (out/untertitel-<einstieg>.geschaetzt.srt). Zeiten sind GESCHÄTZT, nicht wortgenau.
import fs from 'node:fs';
import path from 'node:path';
import { VIDEO_DIR } from '../demo/demo.config.mjs';
const film = await import(path.join(VIDEO_DIR, 'src/config/film.ts'));

const OUT = path.join(VIDEO_DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const ts = (s) => { const ms = Math.round(s * 1000); const h = String(Math.floor(ms / 3.6e6)).padStart(2, '0');
  const m = String(Math.floor(ms / 6e4) % 60).padStart(2, '0'); const sec = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, '0')}`; };
const cues = (hook) => film.narration.cues.map((c) => ({ ...c, text: c.text === '__HOOK__' ? film.narration.hookLine(hook) : c.text }));

for (const hook of Object.keys(film.hooks)) {
  const srt = cues(hook).map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text}\n`).join('\n');
  fs.writeFileSync(path.join(OUT, `untertitel-${hook}.geschaetzt.srt`), srt);
}
const words = (t) => t.split(/\s+/).filter(Boolean).length;
let md = '# Sprechertext Platzcoach-Film (≈ 30 s)\n\n> Zeiten **geschätzt** (≈ 2,4 Wörter/s), nicht wortgenau. Nach der Sprachaufnahme durch echte Zeitmarken ersetzen.\n\n';
md += '| Zeit | Text | Wörter |\n|---|---|---|\n';
for (const c of cues(film.mainHook)) md += `| ${c.from.toFixed(1)}–${c.to.toFixed(1)} s | ${c.text} | ${words(c.text)} |\n`;
md += '\n**Einstiege (erste Zeile austauschbar):**\n\n' + Object.entries(film.hooks).map(([id, h]) => `- \`${id}\`: ${h.label}`).join('\n') + '\n';
md += `\nGesamt (Hauptfilm): ${cues(film.mainHook).reduce((a, c) => a + words(c.text), 0)} Wörter.\n`;
fs.writeFileSync(path.join(OUT, 'sprechertext.md'), md);
console.log('✓ out/sprechertext.md + ' + Object.keys(film.hooks).length + ' SRT-Dateien (geschätzt)');
