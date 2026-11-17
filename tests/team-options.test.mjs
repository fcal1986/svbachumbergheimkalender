// Jede Mannschaft aus ALL_CLASSES muss im Terminformular (#f-team) und im Trainingsformular (#tf-team) wählbar sein.
// Anlass 17.11.2026: „Ü32 / Ü50“ fehlte im Terminformular – Thomas (nur Ü32/Ü50) sah beim neuen Termin nur „F1“.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const classes = JSON.parse(html.match(/^const ALL_CLASSES=(\[.*?\]);/m)[1].replace(/'/g, '"'));
const options = id => {
  const sel = html.match(new RegExp('<select id="' + id + '"[\\s\\S]*?</select>'))[0];
  return [...sel.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map(m => m[1].trim());
};

for (const id of ['f-team', 'tf-team']) {
  test('alle Mannschaften in #' + id, () => {
    const opts = options(id);
    assert.deepEqual(classes.filter(c => !opts.includes(c)), []);
  });
}
