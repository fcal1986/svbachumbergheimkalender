// Fiktiver Demo-Verein „SV Musterstadt 1920 e.V.“ – alle Namen, Mannschaften, Gegner und Adressen sind erfunden.
// Deterministisch: gleiche Eingabe → identische Dateien (feste Salts/IVs, feste IDs).
import { webcrypto as crypto } from 'node:crypto';
import { DEMO_REPO, DEMO_BRANCH, DEMO_TOKEN, DEMO_LOGIN } from './demo.config.mjs';

const enc = new TextEncoder();
const b64 = (buf) => Buffer.from(buf).toString('base64');

// Nachbau von encryptToken() aus index.html (PBKDF2 310.000 / AES-GCM), aber mit festen Salt/IV.
async function encryptTokenDeterministic(token, password, seedByte) {
  const salt = new Uint8Array(16).fill(seedByte);
  const iv = new Uint8Array(12).fill(seedByte + 1);
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(token));
  return { salt: b64(salt), iv: b64(iv), cipher: b64(ct) };
}

const SEASON = { id: '2026-2027', from: '2026-07-01', to: '2027-06-30' };
const U = {
  max: 'demo-u-max', lena: 'demo-u-lena', tom: 'demo-u-tom', sara: 'demo-u-sara', jan: 'demo-u-jan', vorstand: 'demo-u-vorstand',
};
const PEOPLE = [
  { id: U.max, first: 'Max', last: 'Mustermann', email: DEMO_LOGIN.email, classes: { 'E-Jugend': [2] } },
  { id: U.lena, first: 'Lena', last: 'Beispiel', email: 'lena.beispiel@demo.invalid', classes: { 'F-Jugend': [1] } },
  { id: U.tom, first: 'Tom', last: 'Probe', email: 'tom.probe@demo.invalid', classes: { 'D-Jugend': [1] } },
  { id: U.sara, first: 'Sara', last: 'Muster', email: 'sara.muster@demo.invalid', classes: { 'E-Jugend': [1], 'G-Jugend': [1] } },
  { id: U.jan, first: 'Jan', last: 'Vorlage', email: 'jan.vorlage@demo.invalid', classes: { 'C-Jugend': [1] } },
  { id: U.vorstand, first: 'Erika', last: 'Musterfrau', email: 'vorstand@demo.invalid', classes: {}, admin: true },
];

const TEAMS = [
  ['G-Jugend', 1, 'G-Junioren'], ['F-Jugend', 1, 'F-Junioren'], ['F-Jugend', 2, 'F-Junioren'],
  ['E-Jugend', 1, 'E-Junioren'], ['E-Jugend', 2, 'E-Junioren'], ['D-Jugend', 1, 'D-Junioren'],
  ['C-Jugend', 1, 'C-Junioren'], ['1. Herren', 1, 'Herren'], ['2. Herren', 2, 'Herren'],
];

const half = (p) => ({ mode: 'haelfte', part: p });
const quarter = (p) => ({ mode: 'viertel', part: p });
const whole = { mode: 'ganz' };

let slotNo = 0;
function slot(day, from, to, team, squad, pitch, trainerIds, extra = {}) {
  slotNo++;
  const names = trainerIds.map((id) => { const p = PEOPLE.find((x) => x.id === id); return p.first + ' ' + p.last; });
  return {
    id: 'demo-slot-' + String(slotNo).padStart(2, '0'), day, from, to, team, squad, pitch, res: [], note: '',
    trainerIds, trainerNames: names, validFrom: SEASON.from, validUntil: SEASON.to, trainerId: null, trainerName: null,
    kind: 'training', cancelled: [], seasonId: SEASON.id, ...extra,
  };
}

export async function buildDemoData() {
  const users = [];
  for (let i = 0; i < PEOPLE.length; i++) {
    const p = PEOPLE[i];
    // Nur der Login-Zugang kennt das Demo-Passwort; die anderen Zugänge haben ein zufällig wirkendes, festes Passwort.
    const pw = p.email === DEMO_LOGIN.email ? DEMO_LOGIN.password : 'nicht-benutzt-' + p.id;
    users.push({
      id: p.id, first: p.first, last: p.last, email: p.email,
      enc: await encryptTokenDeterministic(DEMO_TOKEN, pw, 10 + i * 2),
      created: '2026-07-01T08:00:00.000Z', admin: !!p.admin, classes: p.classes,
      phone: '', contactPublic: 'none', contactEmail: p.email, emailNotificationsEnabled: false,
      notifyPrefs: { push: {}, mail: {} },
    });
  }

  const training = [
    // Montag
    slot(1, '16:30', '18:00', 'E-Jugend', 1, half('A'), [U.sara]),
    slot(1, '16:30', '18:00', 'F-Jugend', 1, half('B'), [U.lena]),
    slot(1, '18:00', '19:30', 'C-Jugend', 1, whole, [U.jan]),
    // Dienstag (Demo-Tag): G1 auf Viertel 4 bis 17:00, D1 auf Hälfte A 17:00–18:30, C1 danach ganz
    slot(2, '16:00', '17:00', 'G-Jugend', 1, quarter(4), [U.sara]),
    slot(2, '16:00', '17:00', 'F-Jugend', 2, quarter(3), [U.lena]),
    slot(2, '17:00', '18:30', 'D-Jugend', 1, half('A'), [U.tom]),
    slot(2, '18:30', '20:00', 'C-Jugend', 1, whole, [U.jan]),
    slot(2, '20:00', '21:30', '1. Herren', 1, whole, [U.vorstand]),
    // Mittwoch
    slot(3, '16:30', '18:00', 'E-Jugend', 2, half('B'), [U.max]),
    slot(3, '16:30', '18:00', 'E-Jugend', 1, half('A'), [U.sara]),
    slot(3, '18:00', '19:30', 'D-Jugend', 1, whole, [U.tom]),
    slot(3, '19:30', '21:00', '2. Herren', 2, whole, [U.vorstand]),
    // Donnerstag
    slot(4, '16:30', '17:45', 'F-Jugend', 1, half('A'), [U.lena]),
    slot(4, '17:00', '18:30', 'C-Jugend', 1, half('B'), [U.jan]),
    slot(4, '19:30', '21:30', '1. Herren', 1, whole, [U.vorstand]),
    // Freitag
    slot(5, '16:00', '17:30', 'E-Jugend', 2, half('B'), [U.max]),
    slot(5, '16:00', '17:00', 'G-Jugend', 1, quarter(1), [U.sara]),
  ];

  const events = [
    { id: 'demo-ev-1', d: '2026-10-14', t: '19:00', bis: '21:00', title: 'Vorstandssitzung', team: 'Verein', squad: 1, pitch: null,
      res: ['Vereinsheim'], note: '', ownerId: U.vorstand, ownerName: 'Erika Musterfrau', kind: 'other' },
    { id: 'demo-ev-2', d: '2026-10-16', t: '17:30', bis: '19:00', title: 'Elternabend F-Jugend', team: 'F-Jugend', squad: 1, pitch: null,
      res: ['Vereinsheim'], note: '', ownerId: U.lena, ownerName: 'Lena Beispiel', kind: 'other' },
  ];

  const fussballde = {
    updated: '2026-10-13T12:17:00.000Z', strategy: 'demo', teamsFrom: '2026-09-22',
    games: [
      { d: '2026-10-17', t: '11:00', team: 'E-Junioren', squad: 2, ownName: 'SV Musterstadt II', gameNo: '900000001',
        opponent: 'SC Beispielhausen', competition: 'Kreisliga B (Demo)', score: null, link: 'https://example.org/demo/spiel/1' },
      { d: '2026-10-17', t: '13:00', team: 'D-Junioren', squad: 1, ownName: 'SV Musterstadt', gameNo: '900000002',
        opponent: 'FC Nordfeld', competition: 'Kreisliga A (Demo)', score: null, link: 'https://example.org/demo/spiel/2' },
      { d: '2026-10-18', t: '15:00', team: 'Herren', squad: 1, ownName: 'SV Musterstadt', gameNo: '900000003',
        opponent: 'TuS Probedorf', competition: 'Kreisliga A (Demo)', score: null, link: 'https://example.org/demo/spiel/3' },
    ],
    awayGames: [
      { d: '2026-10-17', t: '10:30', team: 'E-Junioren', squad: 1, ownName: 'SV Musterstadt', opponent: 'SpVg Waldheim',
        competition: 'Kreisliga B (Demo)', score: null, link: 'https://example.org/demo/spiel/4' },
      { d: '2026-10-18', t: '11:00', team: 'C-Junioren', squad: 1, ownName: 'SV Musterstadt', opponent: 'TSV Bergweiler',
        competition: 'Kreisliga A (Demo)', score: null, link: 'https://example.org/demo/spiel/5' },
    ],
    teams: [],
  };

  const trainerIds = PEOPLE.filter((p) => !p.admin).map((p) => p.id);
  const trainerClasses = Object.fromEntries(PEOPLE.filter((p) => !p.admin).map((p) => [p.id, p.classes]));
  const trainerNames = Object.fromEntries(PEOPLE.map((p) => [p.id, p.first + ' ' + p.last]));
  const seasons = [{
    id: SEASON.id, label: 'Saison 2026/27', startYear: '2026', from: SEASON.from, to: SEASON.to,
    trainerIds, trainerClasses, trainerNames,
    teams: TEAMS.map(([team, squad, type]) => ({ team, squad, fd: { type, squad, name: 'SV Musterstadt' + (squad > 1 ? ' ' + 'I'.repeat(squad) : ''), teamId: 'DEMO-' + team + '-' + squad } })),
    teamSync: { ignored: [], removed: [], checkedAt: '2026-10-01T10:00:00.000Z' },
  }];

  const config = {
    repo: DEMO_REPO, branch: DEMO_BRANCH, clubName: 'SV Musterstadt 1920 e.V.',
    // Super-Zugang in der Demo absichtlich ohne Passwort → nicht nutzbar.
    admin: { user: 'admin', password: '', first: 'Demo', last: 'Admin' },
    fussballde: { clubId: 'DEMO', clubMatch: 'SV Musterstadt', bufferBeforeMin: 15, durationByAge: { E: 60 },
      shareCategories: ['E-Junioren', 'F-Junioren', 'G-Junioren', 'Bambini'], homeVenues: ['Sportpark Musterstadt'] },
    notify: { emails: [], fromEmail: 'noreply@demo.invalid', replyTo: 'demo@demo.invalid' },
    occupancy: { levels: { game: 'exclusive', training: 'shared', goalkeeper: 'overlay', other: 'shared' }, compatible: [] },
    venue: { name: 'Sportpark Musterstadt', lat: 51.0, lon: 7.0, floodlight: 'ganz' },
    control: {},
  };

  return {
    'config.json': config,
    'users.json': { users },
    'events.json': { events },
    'training.json': { slots: training },
    'seasons.json': { seasons },
    'fussballde.json': fussballde,
    'game-moves.json': { moves: [] },
    'resource-locks.json': { locks: [] },
    'push-subscriptions.json': { subs: [] },
    'goalkeepers.json': { v: 1, hinweis: 'Demo: leer', keepers: [], signups: {} },
  };
}
