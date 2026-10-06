// Fiktiver Demo-Verein „SV Musterstadt 1920 e.V.“ – alle Namen, Mannschaften, Gegner und Adressen sind erfunden.
// Deterministisch: gleiche Eingabe → identische Dateien (feste Salts/IVs, feste IDs).
import { webcrypto as crypto } from 'node:crypto';
import { DEMO_REPO, DEMO_BRANCH, DEMO_TOKEN, DEMO_PASSWORD } from './demo.config.mjs';

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

// Torhüter (fiktiv) – verschlüsselt wie in der App (gkEncrypt: PBKDF2(Token, „platzcoach-torhueter-v1“, 100.000), AES-GCM).
const KEEPERS = [
  { id: 'demo-gk-1', first: 'Ben', last: 'Beispiel', team: 'E-Jugend', squad: 2 },
  { id: 'demo-gk-2', first: 'Paul', last: 'Muster', team: 'E-Jugend', squad: 2 },
  { id: 'demo-gk-3', first: 'Leon', last: 'Vorlage', team: 'E-Jugend', squad: 1 },
  { id: 'demo-gk-4', first: 'Mia', last: 'Probe', team: 'F-Jugend', squad: 1 },
];
async function encryptGk(data) {
  const base = await crypto.subtle.importKey('raw', enc.encode(DEMO_TOKEN), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('platzcoach-torhueter-v1'), iterations: 100000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const iv = new Uint8Array(12).fill(7);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  return { v: 1, hinweis: 'Verschlüsselt – Namen sind nur nach Anmeldung in Platzcoach sichtbar.', iv: b64(iv), cipher: b64(ct) };
}

const SEASON = { id: '2026-2027', from: '2026-07-01', to: '2027-06-30' };
const U = {
  max: 'demo-u-max', lena: 'demo-u-lena', tom: 'demo-u-tom', sara: 'demo-u-sara', jan: 'demo-u-jan', vorstand: 'demo-u-vorstand', kai: 'demo-u-kai',
};
const PEOPLE = [
  { id: U.max, first: 'Max', last: 'Mustermann', email: 'max.mustermann@demo.invalid', classes: { 'E-Jugend': [2] } },
  { id: U.lena, first: 'Lena', last: 'Beispiel', email: 'lena.beispiel@demo.invalid', classes: { 'F-Jugend': [1] } },
  { id: U.tom, first: 'Tom', last: 'Probe', email: 'tom.probe@demo.invalid', classes: { 'D-Jugend': [1] } },
  { id: U.sara, first: 'Sara', last: 'Muster', email: 'sara.muster@demo.invalid', classes: { 'E-Jugend': [1], 'G-Jugend': [1] } },
  { id: U.jan, first: 'Jan', last: 'Vorlage', email: 'jan.vorlage@demo.invalid', classes: { 'C-Jugend': [1] } },
  { id: U.vorstand, first: 'Erika', last: 'Musterfrau', email: 'vorstand@demo.invalid', classes: {}, admin: true },
  { id: U.kai, first: 'Kai', last: 'Beispielmann', email: 'kai.beispielmann@demo.invalid', classes: { Torwarttraining: [] } },
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
    const pw = DEMO_PASSWORD; // fiktive Zugänge, gleiches Demo-Passwort
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
    { id: 'demo-ev-3', d: '2027-06-12', t: '10:00', bis: '18:00', title: 'Sommerfest', team: 'Alle Teams', squad: 1, pitch: { mode: 'ganz' },
      res: ['Vereinsheim', 'Theke'], note: '', ownerId: U.vorstand, ownerName: 'Erika Musterfrau', kind: 'other' },
  ];

  const fussballde = {
    updated: '2026-10-13T12:17:00.000Z', strategy: 'demo', teamsFrom: '2026-09-22',
    games: [
      { d: '2026-10-17', t: '11:00', team: 'E-Junioren', squad: 2, ownName: 'SV Musterstadt II', gameNo: '900000001',
        opponent: 'SC Beispielhausen', competition: 'Kreisliga B (Demo)', score: null, link: 'https://example.org/demo/spiel/1', venue: 'Sportpark Musterstadt' },
      { d: '2026-10-17', t: '13:00', team: 'D-Junioren', squad: 1, ownName: 'SV Musterstadt', gameNo: '900000002',
        opponent: 'FC Nordfeld', competition: 'Kreisliga A (Demo)', score: null, link: 'https://example.org/demo/spiel/2', venue: 'Sportpark Musterstadt' },
      { d: '2026-10-18', t: '15:00', team: 'Herren', squad: 1, ownName: 'SV Musterstadt', gameNo: '900000003',
        opponent: 'TuS Probedorf', competition: 'Kreisliga A (Demo)', score: null, link: 'https://example.org/demo/spiel/3', venue: 'Sportpark Musterstadt' },
    ],
    awayGames: [
      { d: '2026-10-17', t: '10:30', team: 'E-Junioren', squad: 1, ownName: 'SV Musterstadt', opponent: 'SpVg Waldheim',
        competition: 'Kreisliga B (Demo)', score: null, link: 'https://example.org/demo/spiel/4' },
      { d: '2026-10-18', t: '11:00', team: 'C-Junioren', squad: 1, ownName: 'SV Musterstadt', opponent: 'TSV Bergweiler',
        competition: 'Kreisliga A (Demo)', score: null, link: 'https://example.org/demo/spiel/5' },
    ],
    teams: [],
  };


  // Weitere fussball.de-Spiele (ab 24.10. bzw. Frühjahr 2027), damit Kalender, Abgleich und Terminsuche realistisch aussehen.
  let gameNo = 10;
  const home = (d, t, team, squad, opponent, comp, extra = {}) => fussballde.games.push({ d, t, team, squad, ownName: 'SV Musterstadt' + (squad > 1 ? ' II' : ''),
    gameNo: '9000000' + String(++gameNo).padStart(2, '0'), opponent, competition: comp + ' (Demo)', score: null, link: 'https://example.org/demo/spiel/' + gameNo, venue: 'Sportpark Musterstadt', ...extra });
  const away = (d, t, team, squad, opponent, comp) => fussballde.awayGames.push({ d, t, team, squad, ownName: 'SV Musterstadt' + (squad > 1 ? ' II' : ''),
    opponent, competition: comp + ' (Demo)', score: null, link: 'https://example.org/demo/spiel/' + (++gameNo) });
  // fussball.de hat dieses Spiel bereits verlegt (Sync setzt movedFrom) → Kalender zeigt „verlegt vom …“
  home('2026-10-24', '13:00', 'D-Junioren', 1, 'TSV Bergweiler', 'Kreisliga A', { movedFrom: { d: '2026-10-31', t: '13:00' }, movedAt: '2026-10-12T08:17:00.000Z' });
  home('2026-10-24', '11:00', 'F-Junioren', 1, 'FC Nordfeld II', 'Kreisliga Fair Play');
  away('2026-10-24', '10:30', 'E-Junioren', 2, 'TuS Probedorf', 'Kreisliga B');
  home('2026-10-31', '11:00', 'E-Junioren', 1, 'SpVg Waldheim II', 'Kreisliga B');
  home('2026-11-07', '10:30', 'G-Junioren', 1, 'SC Beispielhausen', 'Spielfest');
  home('2026-11-07', '13:00', 'C-Junioren', 1, 'TSV Bergweiler', 'Kreisliga A');
  // Frühjahr 2027 (für „Freien Termin suchen“)
  home('2027-05-08', '11:00', 'E-Junioren', 1, 'FC Nordfeld', 'Kreisliga B');
  home('2027-05-08', '13:00', 'D-Junioren', 1, 'SC Beispielhausen', 'Kreisliga A');
  home('2027-05-08', '15:00', 'Herren', 1, 'TuS Probedorf', 'Kreisliga A');
  home('2027-05-22', '10:30', 'F-Junioren', 1, 'SpVg Waldheim', 'Kreisliga Fair Play');
  home('2027-05-22', '15:00', 'Herren', 1, 'FC Nordfeld', 'Kreisliga A');
  home('2027-06-05', '13:00', 'D-Junioren', 1, 'TSV Bergweiler', 'Kreisliga A');
  home('2027-06-19', '11:00', 'C-Junioren', 1, 'SC Beispielhausen', 'Kreispokal');

  // Mannschaften laut fussball.de (Grundlage für „Mannschaften abgleichen“): alles wie in Platzcoach,
  // dazu neu eine D2 – und die 2. Herren hat bei fussball.de keine Spiele.
  const fdTeam = (type, squad, games, homeGames, comps, name) => ({ type, squad, names: [name || ('SV Musterstadt' + (squad > 1 ? ' II' : ''))],
    teamIds: ['DEMO-FD-' + type + '-' + squad], teamId: 'DEMO-FD-' + type + '-' + squad, competitions: comps, games, homeGames, first: '2026-09-19', last: '2027-06-19' });
  fussballde.teams = [
    fdTeam('G-Junioren', 1, 6, 3, ['Spielfest']), fdTeam('F-Junioren', 1, 12, 6, ['Kreisliga Fair Play (Demo)']), fdTeam('F-Junioren', 2, 10, 5, ['Kreisliga Fair Play (Demo)']),
    fdTeam('E-Junioren', 1, 16, 8, ['Kreisliga B (Demo)']), fdTeam('E-Junioren', 2, 16, 8, ['Kreisliga B (Demo)']),
    fdTeam('D-Junioren', 1, 18, 9, ['Kreisliga A (Demo)']), fdTeam('D-Junioren', 2, 14, 7, ['Kreisliga B (Demo)']),
    fdTeam('C-Junioren', 1, 18, 9, ['Kreisliga A (Demo)', 'Kreispokal (Demo)']), fdTeam('Herren', 1, 30, 15, ['Kreisliga A (Demo)']),
  ];

  const trainerIds = PEOPLE.filter((p) => !p.admin).map((p) => p.id);
  const trainerClasses = Object.fromEntries(PEOPLE.filter((p) => !p.admin).map((p) => [p.id, p.classes]));
  const trainerNames = Object.fromEntries(PEOPLE.map((p) => [p.id, p.first + ' ' + p.last]));
  const seasons = [{
    id: SEASON.id, label: 'Saison 2026/27', startYear: '2026', from: SEASON.from, to: SEASON.to,
    trainerIds, trainerClasses, trainerNames,
    teams: TEAMS.map(([team, squad, type]) => ({ team, squad, fd: { type, squad, name: 'SV Musterstadt' + (squad > 1 ? ' ' + 'I'.repeat(squad) : ''), teamId: 'DEMO-FD-' + type + '-' + squad } })),
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
    'goalkeepers.json': await encryptGk({ keepers: KEEPERS, signups: {} }),
  };
}
