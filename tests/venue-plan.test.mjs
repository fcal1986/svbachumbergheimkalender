import test from 'node:test';
import assert from 'node:assert/strict';
import '../assets/venue-plan.js';
const P = globalThis.PlatzcoachVenues;
const cfg = { venue: { name: 'Höllenbergkampfbahn' }, hallPlan: {
  from: '2026-11-01', until: '2027-03-31',
  venues: [
    { id: 'bergheim-schule', name: 'Bergheim-Schule', parts: 1, windows: [{ day: 2, from: '16:00', to: '17:00' }, { day: 4, from: '16:00', to: '20:00' }] },
    { id: 'sug', name: 'SUG', parts: 1, windows: [{ day: 5, from: '17:00', to: '18:30' }] },
    { id: 'binnerfeld', name: 'Binnerfeld', parts: 3, windows: [{ day: 6, from: '10:30', to: '13:00' }] },
  ],
}};
test('Hallen nur November bis März und am tatsächlichen Wochentag', () => {
  assert.deepEqual(P.venues(cfg, '2026-09-12').map(v => v.id), ['home']);
  assert.deepEqual(P.venues(cfg, '2026-11-11').map(v => v.id), ['home']);
  assert.deepEqual(P.venues(cfg, '2026-11-12').map(v => v.id), ['home', 'bergheim-schule']);
  assert.deepEqual(P.venues(cfg, '2026-11-13').map(v => v.id), ['home', 'sug']);
  assert.deepEqual(P.venues(cfg, '2026-11-14').map(v => v.id), ['home', 'binnerfeld']);
  assert.deepEqual(P.venues(cfg, '2027-04-03').map(v => v.id), ['home']);
});
test('Bergheim-Schule und SUG nur ganze Halle, Binnerfeld drei Drittel', () => {
  assert.equal(P.permitted(cfg, '2026-11-13', 'sug', '17:00', '17:45', [1]), true);
  assert.equal(P.permitted(cfg, '2026-11-13', 'sug', '16:45', '17:30', [1]), false);
  assert.equal(P.permitted(cfg, '2026-11-13', 'sug', '17:00', '17:45', [2]), false);
  assert.equal(P.permitted(cfg, '2026-11-12', 'bergheim-schule', '17:15', '18:45', [1]), true);
  assert.equal(P.permitted(cfg, '2026-11-14', 'binnerfeld', '10:30', '11:45', [1, 2]), true);
  assert.equal(P.permitted(cfg, '2026-11-14', 'binnerfeld', '11:45', '13:00', [1, 2, 3]), true);
  assert.equal(P.permitted(cfg, '2026-11-14', 'binnerfeld', '13:00', '14:00', [1]), false);
});
test('Absagen lassen nur die tatsächlich zugeteilte Hallenzeit frei', () => {
  const occupied = [
    { venueId: 'binnerfeld', t: '10:30', bis: '11:45', lanes: [1, 2], cancelled: false },
    { venueId: 'binnerfeld', t: '10:30', bis: '11:45', lanes: [3, 3], cancelled: false },
    { venueId: 'binnerfeld', t: '11:45', bis: '13:00', lanes: [1, 3], cancelled: false },
  ];
  assert.deepEqual(P.free(cfg, '2026-11-14', 'binnerfeld', 1, occupied), []);
  occupied[2].cancelled = true;
  assert.deepEqual(P.free(cfg, '2026-11-14', 'binnerfeld', 1, occupied), [{ from: '11:45', to: '13:00' }]);
  assert.deepEqual(P.free(cfg, '2026-11-14', 'binnerfeld', 3, occupied), [{ from: '11:45', to: '13:00' }]);
  assert.deepEqual(P.free(cfg, '2026-11-13', 'binnerfeld', 1, []), []);
});

import fs from 'node:fs';

const actualCfg = JSON.parse(fs.readFileSync('data/config.json', 'utf8'));
const allSlots = JSON.parse(fs.readFileSync('data/training.json', 'utf8')).slots;
const hallSlots = allSlots.filter(s => s.venueId && s.venueId !== 'home');

test('acht Zeitblöcke, neun Trainings-Serien, alle in der gültigen Hallenzuteilung', () => {
  assert.equal(hallSlots.length, 9);
  assert.equal(actualCfg.hallPlan.from, '2026-11-01');
  assert.equal(actualCfg.hallPlan.until, '2027-03-31');
  const keys = new Set();
  for (const s of hallSlots) {
    assert.equal(s.validFrom, '2026-11-01', s.id);
    assert.equal(s.validUntil, '2027-03-31', s.id);
    assert.equal(s.seasonId, '2026-2027', s.id);
    const firstDay = ['','2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-14','2026-11-15'][s.day];
    assert.equal(P.permitted(actualCfg, firstDay, s.venueId, s.from, s.to, s.halle.thirds), true, s.id);
    assert.ok(s.trainerIds?.length, 'Bestehende Trainerzuordnung: ' + s.id);
    keys.add([s.venueId, s.day, s.from, s.to].join('|'));
  }
  assert.equal(keys.size, 8); // C2 und D1 nutzen dasselbe Fenster auf getrennten Dritteln.
  assert.equal(allSlots.filter(s => !s.venueId || s.venueId === 'home').length, 31);
});

test('keine Doppelbuchung von Hallendritteln in den eingetragenen Wochenzeiten', () => {
  for (let i = 0; i < hallSlots.length; i++) for (let j = i + 1; j < hallSlots.length; j++) {
    const a = hallSlots[i], b = hallSlots[j];
    if (a.venueId !== b.venueId || a.day !== b.day) continue;
    if (!(a.from < b.to && b.from < a.to)) continue;
    const overlap = a.halle.thirds.filter(n => b.halle.thirds.includes(n));
    assert.deepEqual(overlap, [], a.id + ' überschneidet sich mit ' + b.id);
  }
  const b = hallSlots.filter(x => x.venueId === 'binnerfeld');
  assert.deepEqual(b.find(x => x.team === 'C-Jugend' && x.squad === 2).halle.thirds, [1, 2]);
  assert.deepEqual(b.find(x => x.team === 'D-Jugend' && x.squad === 1).halle.thirds, [3]);
  assert.deepEqual(b.find(x => x.team === 'C-Jugend' && x.squad === 1).halle.thirds, [1, 2, 3]);
});

test('abgesagter C1-Slot gibt nur Binnerfeld 11:45–13:00 frei', () => {
  const booked = hallSlots.filter(s => s.venueId === 'binnerfeld').map(s => ({
    venueId: s.venueId, t: s.from, bis: s.to,
    lanes: [Math.min(...s.halle.thirds), Math.max(...s.halle.thirds)], cancelled: false,
  }));
  assert.deepEqual(P.free(actualCfg, '2026-11-14', 'binnerfeld', 1, booked), []);
  booked.find(o => o.t === '11:45').cancelled = true;
  for (const lane of [1, 2, 3]) {
    assert.deepEqual(P.free(actualCfg, '2026-11-14', 'binnerfeld', lane, booked),
      [{ from: '11:45', to: '13:00' }]);
  }
  assert.deepEqual(P.free(actualCfg, '2026-11-13', 'binnerfeld', 1, booked), []);
});
