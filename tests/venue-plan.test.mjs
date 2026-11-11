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
