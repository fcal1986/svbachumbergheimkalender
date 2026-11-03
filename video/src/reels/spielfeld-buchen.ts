// Kurzvideo: Zeiten direkt im Spielfeldbild buchen (Backlog 113, ab 03.11.2026 · 1/2), ≈ 39 s.
// Noch ohne Stimme: Zeiten geschätzt. Nach der CapCut-Aufnahme `warp`, `audio` und `narration` anpassen.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'spielfeld-buchen',
  title: 'Neu: Direkt im Spielfeld buchen',
  audience: 'Trainer',
  durationS: 39,
  cameraFit: true,
  hooks: {
    neu: { label: 'Neu: Zeiten direkt im Spielfeld buchen.', lines: ['Neu:', 'Direkt im', 'Spielfeld buchen.'], accent: 'Spielfeld buchen.' },
  },
  mainHook: 'neu',
  steps: [
    { from: 3, to: 10, n: 1, label: 'Platz ansehen' },
    { from: 10, to: 18, n: 2, label: 'Antippen' },
    { from: 18, to: 22, n: 3, label: 'Speichern' },
    { from: 22, to: 27, n: 4, label: 'Fertig' },
  ],
  shots: [
    {
      id: 'start', scene: '01-start', from: 2.6, to: 10,
      camera: [{ at: 0, el: 'pitch', zoom: 1.0, dy: 60 }, { at: 2.4, el: 'field', zoom: 1.15 }],
      highlights: [{ el: 'free1', from: 3.4, to: 6.6, pad: 3 }, { el: 'free2', from: 3.8, to: 6.6, pad: 3 }],
      taps: [{ el: 'free1', at: 6.9 }],
    },
    {
      id: 'form', scene: '02-form', from: 10, to: 18,
      camera: [{ at: 0, el: 'card', zoom: 1.12, dy: 20 }, { at: 3.4, el: 'card', zoom: 1.12, dy: 20 }, { at: 4.4, el: 'passt', zoom: 1.05, dy: -150 }],
      highlights: [
        { el: 'date', from: 0.4, to: 1.8, pad: 3 },
        { el: 'von', from: 1.6, to: 3.6, pad: 3 },
        { el: 'bis', from: 1.9, to: 3.6, pad: 3 },
        { el: 'passt', from: 4.8, to: 7.2, pad: 6 },
      ],
      taps: [{ el: 'save', at: 7.6 }],
    },
    {
      id: 'review', scene: '03-review', from: 18, to: 22,
      camera: [{ at: 0, el: 'sheet', zoom: 1.0, dy: -60 }],
      highlights: [{ el: 'sheet', from: 0.3, to: 2.6, pad: 2 }],
      taps: [{ el: 'confirm', at: 3.0 }],
    },
    {
      id: 'booked', scene: '04-booked', from: 22, to: 27,
      camera: [{ at: 0, el: 'field', zoom: 1.15 }],
      highlights: [{ el: 'mine', from: 0.6, to: 4.4, pad: 3 }],
    },
    {
      id: 'klein', scene: '05-klein', from: 27, to: 34,
      camera: [{ at: 0, el: 'card', zoom: 1.12, dy: 20 }, { at: 2.0, el: 'klein', zoom: 1.05, dy: -150 }],
      highlights: [{ el: 'klein', from: 2.6, to: 6.4, pad: 6 }],
    },
  ],
  captions: [
    { from: 3, to: 10, title: 'Start: Jetzt auf dem Platz.', accent: 'Frei = „+ frei“', sub: 'Live – wer ist wo, was ist frei' },
    { from: 10, to: 18, title: 'Antippen – Tag, Zeit', accent: 'und Fläche sind drin', sub: 'Höchstens bis zur nächsten Belegung' },
    { from: 18, to: 22, title: 'Kurz prüfen,', accent: 'speichern', sub: 'Platz geprüft: frei' },
    { from: 22, to: 27, title: 'Schon steht deine', accent: 'Mannschaft im Bild', sub: 'Für alle sichtbar' },
    { from: 27, to: 34, title: 'Auch Kleinspielfeld', accent: 'und Hallendrittel', sub: 'Alles, was im Bild frei ist' },
  ],
  narration: [
    { from: 0.3, to: 2.8, text: 'Neu in Platzcoach: Zeiten direkt im Spielfeld buchen.' },
    { from: 3.2, to: 9.6, text: 'Auf der Startseite siehst du live, was auf dem Platz los ist. Freie Viertel sind mit Plus frei markiert.' },
    { from: 10.2, to: 17.6, text: 'Tipp einfach drauf. Platzcoach übernimmt Tag, Fläche und eine passende Uhrzeit – höchstens bis zur nächsten Belegung.' },
    { from: 18.2, to: 21.6, text: 'Kurz prüfen, speichern – fertig.' },
    { from: 22.2, to: 26.6, text: 'Und schon steht deine Mannschaft im Bild – für alle sichtbar.' },
    { from: 27.2, to: 33.6, text: 'Das geht genauso beim Kleinspielfeld und bei freien Hallendritteln.' },
    { from: 34.2, to: 37.4, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Start „Jetzt auf dem Platz“: angemeldet und buchberechtigt sehen freie Viertel als „+ frei“ (canBookSpot, ab 03.11.2026 · 1, Backlog 113)',
    'Antippen öffnet „Neuer Termin“ mit Tag, Fläche (hier Hälfte A) und Zeit 16:15–17:00: übliche Trainingsdauer, höchstens bis zur nächsten Belegung (openSlotSheet)',
    'Prüfen und Speichern; Demo-Commit „Neuer Termin: Training – E2-Jugend · 16:15–17:00 · 13.10.2026“; Bild zeigt „E2 · Du“',
    'Kleinspielfeld und freie Hallendrittel ebenfalls antippbar (ab 03.11.2026 · 2); Kleinspielfeld im Video gezeigt, Halle nur genannt',
  ],
};

export default reel;
