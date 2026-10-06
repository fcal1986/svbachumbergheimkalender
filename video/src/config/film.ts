// ZENTRALE FILMKONFIGURATION – Inhalte, Timing, Kamera, Highlights, Cursor, Audio, CTA.
// Die Animationslogik in src/components liest nur diese Datei + das Szenenmanifest.
// Neue Varianten: hier Texte/Zeiten ändern, keine Änderung an den Komponenten nötig.
//
// Zeiten in Sekunden. Elementnamen (el) = Schlüssel aus public/capture/manifest.json → scenes[].elements.
// Inhaltliche Regel: Nur zeigen und behaupten, was die App nachweislich kann (siehe README „Belegte Aussagen“).

export type HookId = 'whatsapp' | 'werwann' | 'aufeinenblick';

export type CameraKey = { at: number; el?: string; x?: number; y?: number; zoom: number; dy?: number };
export type Highlight = { el: string; from: number; to: number; pad?: number; dim?: boolean };
export type Tap = { el: string; at: number; dx?: number; dy?: number };
export type Shot = {
  id: string;
  scene: string; // Szene im Manifest
  from: number;
  to: number;
  camera: CameraKey[]; // at relativ zum Shot-Beginn
  highlights?: Highlight[]; // relativ zum Shot-Beginn
  taps?: Tap[]; // relativ zum Shot-Beginn
};
export type Caption = { from: number; to: number; title: string; accent?: string; sub?: string };
export type SubtitleCue = { from: number; to: number; text: string };

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_S = 30;
export const PREVIEW_S = 7; // Länge der Einstiegsvorschauen

export const brand = {
  navy: '#011B32',
  navy2: '#0B2B47',
  green: '#6BB41C',
  lime: '#8BCF2F',
  bg: '#F8FAF7',
  warn: '#C0392B',
  white: '#FFFFFF',
  inkSoft: '#9FB0C0',
  logoOnDark: 'brand/logo-white.svg',
  logoOnLight: 'brand/logo-horizontal.svg',
};

// Sichere Zone für Instagram/WhatsApp (oben Profil/Schließen, unten Bedienelemente/Beschreibung).
export const safe = { top: 220, bottom: 400, side: 70 };
// „Handy-Karte“ mit dem echten App-Screenshot.
export const card = { x: 110, y: 560, w: 860, h: 940, radius: 44 };

export const hooks: Record<HookId, { label: string; lines: string[]; accent?: string }> = {
  whatsapp: { label: 'Schluss mit Platzbelegung per WhatsApp.', lines: ['Schluss mit', 'Platzbelegung', 'per WhatsApp.'], accent: 'per WhatsApp.' },
  werwann: { label: 'Wer trainiert wann auf welchem Platz?', lines: ['Wer trainiert', 'wann auf', 'welchem Platz?'], accent: 'welchem Platz?' },
  aufeinenblick: { label: 'Deine Platzbelegung. Auf einen Blick.', lines: ['Deine', 'Platzbelegung.', 'Auf einen Blick.'], accent: 'Auf einen Blick.' },
};
export const mainHook: HookId = 'whatsapp';

export const hookSection = { from: 0, to: 3 };
export const endCard = { from: 25, to: 30, cta: 'Jetzt ansehen:', url: 'platzcoach.de', tagline: 'Platzbelegung für Vereine' };

// Bildfolge. Die Shots folgen dem echten Ablauf aus capture/capture.mjs.
export const shots: Shot[] = [
  // 3–7 s: Übersicht Platzbelegung (Startseite)
  {
    id: 'overview', scene: '01-start', from: 2.6, to: 7,
    camera: [
      { at: 0, el: 'platzSection', zoom: 1, dy: 60 },
      { at: 1.6, el: 'livePitch', zoom: 1.08 },
      { at: 4.4, el: 'livePitch', zoom: 1.14 },
    ],
    highlights: [{ el: 'statusPill', from: 1.9, to: 4.2, pad: 4 }],
  },
  // 7–19 s: Training anlegen, Überschneidung erkennen, freie Hälfte übernehmen, prüfen, speichern
  {
    id: 'form', scene: '02-form', from: 7, to: 9.4,
    camera: [{ at: 0, el: 'chipTraining', zoom: 1.12, dy: 150 }],
    taps: [{ el: 'chipTraining', at: 1.5 }],
    highlights: [{ el: 'chipTraining', from: 1.6, to: 2.4, pad: 4 }],
  },
  {
    id: 'conflict', scene: '03-conflict', from: 9.4, to: 13.4,
    camera: [
      { at: 0, el: 'timeCard', zoom: 1.08 },
      { at: 1.2, el: 'status', zoom: 1.3, dy: -10 },
      { at: 2.9, el: 'suggestionBox', zoom: 1.22, x: 0 },
    ],
    highlights: [
      { el: 'von', from: 0.3, to: 1.2, pad: 3 },
      { el: 'status', from: 1.4, to: 2.9, pad: 4, dim: true },
      { el: 'suggestion', from: 3.2, to: 4.0, pad: 4 },
    ],
    taps: [{ el: 'suggestion', at: 3.6 }],
  },
  {
    id: 'ok', scene: '04-ok', from: 13.4, to: 15.8,
    camera: [{ at: 0, el: 'status', zoom: 1.42, dy: -110 }, { at: 2.4, el: 'status', zoom: 1.48, dy: -110 }],
    highlights: [{ el: 'status', from: 0.4, to: 2.3, pad: 4, dim: true }],
  },
  {
    id: 'review', scene: '05-review', from: 15.8, to: 19,
    camera: [{ at: 0, el: 'sheet', zoom: 1.05, dy: 30 }],
    highlights: [{ el: 'rowWo', from: 0.5, to: 1.6, pad: 6 }, { el: 'rowPlatz', from: 1.0, to: 2.2, pad: 6 }],
    taps: [{ el: 'confirm', at: 2.6 }],
  },
  // 19–25 s: Nutzen des gezeigten Ablaufs
  {
    id: 'saved', scene: '06-saved', from: 19, to: 21.6,
    camera: [{ at: 0, el: 'nextCard', zoom: 1.12, dy: 110 }, { at: 2.6, el: 'nextCard', zoom: 1.18, dy: 110 }],
    highlights: [{ el: 'nextCard', from: 0.3, to: 2.4, pad: 4 }],
  },
  {
    id: 'timeline', scene: '07-timeline', from: 21.6, to: 25.4,
    camera: [{ at: 0, el: 'timeline', zoom: 1.12 }, { at: 3.8, el: 'timeline', zoom: 1.2 }],
    highlights: [{ el: 'blockD1', from: 0.5, to: 3.4, pad: 3 }, { el: 'blockE2', from: 0.9, to: 3.4, pad: 3 }],
  },
];

// Große Texte über der Handy-Karte.
export const captions: Caption[] = [
  { from: 3, to: 7, title: 'Die Platzbelegung', accent: 'live', sub: 'Wer ist gerade wo auf dem Platz?' },
  { from: 7, to: 9.4, title: 'Training eintragen', accent: 'in Sekunden', sub: 'Terminart, Mannschaft, Uhrzeit' },
  { from: 9.4, to: 13.4, title: 'Überschneidung?', accent: 'Sofort sichtbar', sub: 'Noch bevor du speicherst' },
  { from: 13.4, to: 15.8, title: 'Freie Hälfte', accent: 'vorgeschlagen', sub: 'Ein Tipp – und es passt' },
  { from: 15.8, to: 19, title: 'Prüfen.', accent: 'Speichern.', sub: 'Alles auf einen Blick' },
  { from: 19, to: 25.4, title: 'Ein Plan', accent: 'für alle', sub: 'Jeder im Verein sieht denselben Stand' },
];

// Sprechertext (für eine spätere Aufnahme, z. B. ElevenLabs). Zeiten GESCHÄTZT (ca. 2,4 Wörter/s),
// nicht wortgenau. Nach einer Aufnahme durch echte Zeitmarken ersetzen (siehe README).
export const narration = {
  timingsEstimated: true,
  hookLine: (hook: HookId) => hooks[hook].label,
  cues: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 6.8, text: 'Mit Platzcoach siehst du sofort, wer gerade auf welchem Platz trainiert.' },
    { from: 7.1, to: 9.3, text: 'Ein Training eintragen geht in wenigen Tipps.' },
    { from: 9.5, to: 13.2, text: 'Ist die Fläche schon belegt, zeigt Platzcoach das noch vor dem Speichern –' },
    { from: 13.4, to: 15.7, text: 'und schlägt die freie Hälfte gleich vor.' },
    { from: 15.9, to: 18.8, text: 'Kurz prüfen, speichern, fertig.' },
    { from: 19.2, to: 24.8, text: 'Danach sieht der ganze Verein denselben Stand. Ohne Nachfragen in der Gruppe.' },
    { from: 25.4, to: 29.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ] as SubtitleCue[],
};

export const subtitles = {
  // Stumme Vorschau: Die großen Überschriften tragen die Aussage, Untertitel daher aus.
  // Mit Sprachaufnahme auf true stellen (Zeiten dann aus der Audioausrichtung übernehmen).
  burnIn: false,
  bottomY: HEIGHT - safe.bottom + 10,
};

export const audio = {
  // Pfade relativ zu public/. null = stumm. Keine Schlüssel oder Lizenzdateien ins Repo.
  voiceover: null as null | { src: string; volume: number },
  music: null as null | { src: string; volume: number; duckedVolume: number },
};

// Cursor (Zeigefinger-Pfeil) – Bewegungsdauer vor einem Tipp.
export const cursor = { moveS: 0.7, pressS: 0.18, size: 64 };
