// Reel 1 – Platzbelegung: Training anlegen, Überschneidung erkennen, freie Hälfte übernehmen.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'platzbelegung',
  title: 'Platzbelegung & Überschneidungen',
  audience: 'Trainer, Vereinsverantwortliche',
  durationS: 30,
  hooks: {
    whatsapp: { label: 'Schluss mit Platzbelegung per WhatsApp.', lines: ['Schluss mit', 'Platzbelegung', 'per WhatsApp.'], accent: 'per WhatsApp.' },
    werwann: { label: 'Wer trainiert wann auf welchem Platz?', lines: ['Wer trainiert', 'wann auf', 'welchem Platz?'], accent: 'welchem Platz?' },
    aufeinenblick: { label: 'Deine Platzbelegung. Auf einen Blick.', lines: ['Deine', 'Platzbelegung.', 'Auf einen Blick.'], accent: 'Auf einen Blick.' },
  },
  mainHook: 'whatsapp',
  // Bildfolge – folgt dem echten Ablauf aus capture/flows/platzbelegung.mjs.
  shots: [
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
],
  captions: [
  { from: 3, to: 7, title: 'Die Platzbelegung', accent: 'live', sub: 'Wer ist gerade wo auf dem Platz?' },
  { from: 7, to: 9.4, title: 'Training eintragen', accent: 'in Sekunden', sub: 'Terminart, Mannschaft, Uhrzeit' },
  { from: 9.4, to: 13.4, title: 'Überschneidung?', accent: 'Sofort sichtbar', sub: 'Noch bevor du speicherst' },
  { from: 13.4, to: 15.8, title: 'Freie Hälfte', accent: 'vorgeschlagen', sub: 'Ein Tipp – und es passt' },
  { from: 15.8, to: 19, title: 'Prüfen.', accent: 'Speichern.', sub: 'Alles auf einen Blick' },
  { from: 19, to: 25.4, title: 'Ein Plan', accent: 'für alle', sub: 'Jeder im Verein sieht denselben Stand' },
  ],
  narration: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 6.8, text: 'Mit Platzcoach siehst du sofort, wer gerade auf welchem Platz trainiert.' },
    { from: 7.1, to: 9.3, text: 'Ein Training eintragen geht in wenigen Tipps.' },
    { from: 9.5, to: 13.2, text: 'Ist die Fläche schon belegt, zeigt Platzcoach das noch vor dem Speichern –' },
    { from: 13.4, to: 15.7, text: 'und schlägt die freie Hälfte gleich vor.' },
    { from: 15.9, to: 18.8, text: 'Kurz prüfen, speichern, fertig.' },
    { from: 19.2, to: 24.8, text: 'Danach sieht der ganze Verein denselben Stand. Ohne Nachfragen in der Gruppe.' },
    { from: 25.4, to: 29.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Live-Platzbelegung auf der Startseite (Viertel/Hälften, Kleinspielfeld, Zeitleiste)',
    'Konfliktprüfung im Terminformular vor dem Speichern (renderFormTlStatus)',
    'Vorschlag der freien Hälfte (fb-share-note „Hälfte B buchen“)',
    'Prüfansicht „Termin prüfen“ vor dem Speichern',
    'Lesen ohne Anmeldung: alle sehen denselben Stand',
  ],
};

export default reel;
