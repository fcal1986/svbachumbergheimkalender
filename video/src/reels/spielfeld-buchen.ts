// Kurzvideo: Zeiten direkt im Spielfeldbild buchen (Backlog 113, ab 03.11.2026 · 1/2), ≈ 39 s.
// Stimme: CapCut-Aufnahme vom 03.11.2026, Bilder per `warp` an die Sprechzeiten angepasst.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'spielfeld-buchen',
  title: 'Neu: Direkt im Spielfeld buchen',
  audience: 'Trainer',
  durationS: 39,
  cameraFit: true,
  // An die Stimme angepasst: Abschnitt beginnt 0,3 s vor dem Satz. [Konfiguration, Film]
  warp: [[0,0],[3,3.98],[10,9.66],[18,17.06],[22,19.87],[27,23.3],[34,27.01],[39,33.0]],
  audio: { voiceover: { src: 'audio/spielfeld-buchen-stimme.wav', volume: 1 } },
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
  // Zeiten = echte Sprechzeiten der CapCut-Aufnahme vom 03.11.2026 (Filmzeit, aus den Pausen ermittelt).
  narration: [
    { from: 0.41, to: 3.76, text: 'Neu in Platzcoach: Zeiten direkt im Spielfeld buchen.' },
    { from: 4.28, to: 9.44, text: 'Auf der Startseite siehst du live, was auf dem Platz los ist. Freie Viertel sind mit Plus frei markiert.' },
    { from: 9.96, to: 16.6, text: 'Tipp einfach drauf. Platzcoach übernimmt Tag, Fläche und eine passende Uhrzeit – höchstens bis zur nächsten Belegung.' },
    { from: 17.36, to: 19.61, text: 'Kurz prüfen, speichern – fertig.' },
    { from: 20.17, to: 23.16, text: 'Und schon steht deine Mannschaft im Bild – für alle sichtbar.' },
    { from: 23.6, to: 26.77, text: 'Das geht genauso beim Kleinspielfeld und bei freien Hallendritteln.' },
    { from: 27.31, to: 30.9, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Start „Jetzt auf dem Platz“: angemeldet und buchberechtigt sehen freie Viertel als „+ frei“ (canBookSpot, ab 03.11.2026 · 1, Backlog 113)',
    'Antippen öffnet „Neuer Termin“ mit Tag, Fläche (hier Hälfte A) und Zeit 16:15–17:00: übliche Trainingsdauer, höchstens bis zur nächsten Belegung (openSlotSheet)',
    'Prüfen und Speichern; Demo-Commit „Neuer Termin: Training – E2-Jugend · 16:15–17:00 · 13.10.2026“; Bild zeigt „E2 · Du“',
    'Kleinspielfeld und freie Hallendrittel ebenfalls antippbar (ab 03.11.2026 · 2); Kleinspielfeld im Video gezeigt, Halle nur genannt',
  ],
};

export default reel;
