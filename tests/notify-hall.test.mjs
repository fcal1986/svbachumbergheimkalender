import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Die produktive Mail-Datei NICHT ausführen: ihr main() würde SMTP/Push anstoßen.
// Nur ihre tatsächlich verwendeten, nebenwirkungsfreien Parser-Funktionen auswerten.
const src = fs.readFileSync('scripts/notify-email.mjs', 'utf8');
const pCats = src.indexOf('const CATEGORIES = {');
const pCatsEnd = src.indexOf('\n};', pCats) + 3;
const pParse = src.indexOf('function parseCommit(raw)');
const pParseEnd = src.indexOf('function isFromPlatzcoach', pParse);
assert.ok(pCats >= 0 && pCatsEnd > pCats && pParse >= 0 && pParseEnd > pParse);
const pureSource = src.slice(pCats, pCatsEnd) + '\n' + src.slice(pParse, pParseEnd);
const parseCommit = new Function(pureSource + '\nreturn parseCommit;')();

test('Hallenfreigabe und konkreten Buchungs-Direktlink aus echtem Commit-Footer erkennen', () => {
  const msg = 'Hallenzeit frei: Binnerfeld · Sa 14.11. · 11:45–13:00 Uhr · C1-Jugend · Halle: ganz'
    + '\n\nPlatzcoach-Link: frei-hall135-binnerfeld-c1-2026-11-14'
    + '\nPlatzcoach-By: test-user';
  const c = parseCommit(msg);
  assert.equal(c.category, 'hallfree');
  assert.equal(c.link, 'frei-hall135-binnerfeld-c1-2026-11-14');
  assert.equal(c.by, 'test-user');
  assert.match(c.text, /Binnerfeld/);
  assert.equal(parseCommit('Training abgesagt: E2 am 14.11.2026').category, 'training');
});
