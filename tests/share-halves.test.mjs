// Geteilte Heimspiele (E/F/G) bekommen feste Hälften – auch wenn ein Ganzplatz-Spiel beide Hälften belegt.
// Anlass 17.11.2026: Sa 21.11. E2 + E3 um 11:15, D2 um 12:15 (Vorlauf ab 12:00) → beide E-Spiele lagen auf
// Hälfte A, E2 war auf der Startseite unsichtbar und Hälfte B wirkte frei.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Funktion samt Rumpf aus index.html herauslösen (Klammern zählen).
function extract(name) {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start >= 0, 'Funktion fehlt: ' + name);
  let i = html.indexOf('{', start), depth = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) break;
  }
  return html.slice(start, i + 1);
}
const constLine = name => html.match(new RegExp('^const ' + name + '=.*$', 'm'))[0];

const names = ['fussballShareInstancesOn', 'fussballInstancesOn', 'fussballGameWindow', 'fussballBufferBeforeMin',
  'fussballTeamCategory', 'fussballShareCategories', 'fussballAgeKey', 'fussballDurationMin', 'fbGameDur', 'fbOnOwnPitch',
  'shiftTimeClamped', 'fussballGameLinkId', 'pitchQuarters', 'eventBis'];

function setup(games, events = []) {
  const ctx = { CFG: { fussballde: { shareCategories: ['E-', 'F-', 'G-'] } }, FUSSBALLDE: { games }, EVENTS: events,
    formSkipFussballLink: null, trainingInstancesOn: () => [], addMinutes: (t, m) => t };
  vm.createContext(ctx);
  vm.runInContext([constLine('HALF'), constLine('DURATION_BY_AGE'), ...names.map(extract),
    'globalThis.fussballShareInstancesOn=fussballShareInstancesOn;'].join('\n'), ctx);
  // Ergebnis aus dem vm-Kontext in normale Objekte holen (sonst scheitert deepEqual an fremden Arrays)
  return d => JSON.parse(JSON.stringify(ctx.fussballShareInstancesOn(d)));
}
const game = (t, team, squad, link) => ({ d: '2026-11-21', t, team, squad, opponent: 'Gegner ' + link, link });

test('Sa 21.11.: E2 und E3 gleichzeitig vor dem D2-Spiel liegen auf verschiedenen Hälften', () => {
  const share = setup([
    game('10:00', 'E-Junioren', 1, 'e1'), game('10:00', 'F-Junioren', 1, 'f1'),
    game('11:15', 'E-Junioren', 2, 'e2'), game('11:15', 'E-Junioren', 3, 'e3'),
    game('12:15', 'D-Junioren', 2, 'd2'),
  ]);
  const at1115 = share('2026-11-21').filter(o => o.game.t === '11:15').map(o => o.pitch.part).sort();
  assert.deepEqual(at1115, ['A', 'B']);
});

test('ohne Ganzplatz-Spiel bleibt es bei A, dann B', () => {
  const share = setup([game('11:15', 'E-Junioren', 2, 'e2'), game('11:15', 'E-Junioren', 3, 'e3')]);
  assert.deepEqual(share('2026-11-21').map(o => o.pitch.part).sort(), ['A', 'B']);
});

test('eigene Buchung auf A: Spiel geht auf B', () => {
  const share = setup([game('11:15', 'E-Junioren', 2, 'e2')],
    [{ id: 'x', d: '2026-11-21', t: '11:00', bis: '12:00', pitch: { mode: 'haelfte', part: 'A' } }]);
  assert.deepEqual(share('2026-11-21').map(o => o.pitch.part), ['B']);
});
