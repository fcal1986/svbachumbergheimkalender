// Parser-Prüfung für Inline-JavaScript der Pilot-Single-File-App.
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync('index.html', 'utf8');
const blocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
if (!blocks.length) throw new Error('Keine Inline-Skripte gefunden');
for (const [i, block] of blocks.entries()) new vm.Script(block[1], { filename: 'index.html:inline-' + (i + 1) });
console.log(blocks.length + ' Inline-Skripte syntaktisch gültig.');
