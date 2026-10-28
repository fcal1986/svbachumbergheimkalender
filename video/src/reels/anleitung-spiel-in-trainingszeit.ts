// Anleitung: Spiel in der Trainingszeit anlegen (G1, ≈ 69 s, 7 Schritte). Weg über die Uhr auf der Trainingskarte
// („Nur an diesem Tag verlegen“ übernimmt Tag, Zeit, Mannschaft, Fläche), dann Art „Spiel“.
// Stimme: CapCut-Aufnahme vom 28.10.2026, Bilder per `warp` an die Sprechzeiten angepasst.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'anleitung-spiel-in-trainingszeit',
  title: 'Anleitung: Spiel in der Trainingszeit',
  audience: 'Trainer (Erklärvideo)',
  durationS: 69,
  cameraFit: true,
  // An die Stimme angepasst: Abschnitt beginnt 0,3 s vor dem Satz. [Konfiguration, Film]
  warp: [[0,0],[3,5.26],[9,9.67],[15,15.86],[21,21.24],[32,31.62],[40,39.79],[50,49.2],[57.5,56.18],[64,64.72],[69,71.0]],
  audio: { voiceover: { src: 'audio/anleitung-spiel-in-trainingszeit-stimme.wav', volume: 1 } },
  hooks: {
    anleitung: { label: 'Spiel in der Trainingszeit – so geht’s in Platzcoach.', lines: ['Spiel in der', 'Trainingszeit?', 'In 7 Schritten.'], accent: 'In 7 Schritten.' },
  },
  mainHook: 'anleitung',
  steps: [
    { from: 3, to: 9, n: 1, label: 'Uhr am Training' },
    { from: 9, to: 15, n: 2, label: 'Zeit übernommen' },
    { from: 15, to: 21, n: 3, label: 'Spiel und Gegner' },
    { from: 21, to: 32, n: 4, label: 'Anstoß eintragen' },
    { from: 32, to: 40, n: 5, label: 'Prüfen und speichern' },
    { from: 40, to: 50, n: 6, label: 'Jugendleiter informieren' },
    { from: 50, to: 57.5, n: 7, label: 'Im Kalender' },
  ],
  shots: [
    {
      id: 'card', scene: '01-card', from: 2.6, to: 9,
      camera: [{ at: 0, el: 'card', zoom: 1.0, dy: -20 }, { at: 2.2, el: 'head', zoom: 1.35, dy: 20 }],
      highlights: [{ el: 'head', from: 0.8, to: 2.2, pad: 2 }, { el: 'clock', from: 2.8, to: 5.4, pad: 6 }],
      taps: [{ el: 'clock', at: 5.4 }],
    },
    {
      id: 'prefilled', scene: '02b-prefilled-time', from: 9, to: 15,
      camera: [{ at: 0, el: 'card', zoom: 1.12, dy: 60 }, { at: 2.6, el: 'card', zoom: 1.12, dy: 60 }, { at: 3.6, x: 200, y: 470, zoom: 1.1 }],
      highlights: [{ el: 'date', from: 0.4, to: 1.8, pad: 3 }, { el: 'card', from: 1.4, to: 3.2, pad: 3 }],
    },
    {
      id: 'spiel', scene: '03-spiel', from: 15, to: 21,
      camera: [{ at: 0, el: 'kindChip', zoom: 1.05, dy: 160 }, { at: 2.6, el: 'opponent', zoom: 1.15, dy: -30 }],
      highlights: [{ el: 'kindChip', from: 0.6, to: 2.2, pad: 4 }, { el: 'homeAway', from: 2.2, to: 3.8, pad: 3 }, { el: 'opponent', from: 3.6, to: 6.0, pad: 3 }],
      taps: [{ el: 'kindChip', at: 0.8 }],
    },
    {
      id: 'kickoff', scene: '04-kickoff', from: 21, to: 32,
      camera: [{ at: 0, el: 'card', zoom: 1.15, dy: 40 }, { at: 4.4, el: 'card', zoom: 1.15, dy: 40 }, { at: 5.4, el: 'trainingNote', zoom: 1.12, dy: -110 }],
      highlights: [
        { el: 'kickoff', from: 0.4, to: 2.4, pad: 3 },
        { el: 'kickInfo', from: 2.0, to: 4.6, pad: 3 },
        { el: 'trainingNote', from: 5.8, to: 9.6, pad: 5 },
      ],
      taps: [{ el: 'save', at: 10.4 }],
    },
    {
      // Kamera bewusst unterhalb der Zeile „Was“ (zeigt den Gegner derzeit doppelt – App-Befund, nicht im Bild).
      id: 'review', scene: '05-review', from: 32, to: 40,
      camera: [{ at: 0, x: 242, y: 600, zoom: 1.4 }, { at: 2.2, x: 242, y: 600, zoom: 1.4 }, { at: 3.0, x: 160, y: 600, zoom: 1.4 }],
      highlights: [{ el: 'rowWann', from: 0.3, to: 2.2, pad: 3 }, { el: 'training', from: 3.2, to: 6.2, pad: 2 }],
      taps: [{ el: 'confirm', at: 7.0 }],
    },
    {
      id: 'youthleader', scene: '06-youthleader', from: 40, to: 50,
      camera: [{ at: 0, el: 'title', zoom: 1.15, dy: 200 }],
      highlights: [{ el: 'title', from: 0.3, to: 2.2, pad: 4 }, { el: 'waBtn', from: 8.2, to: 9.8, pad: 4 }, { el: 'copyBtn', from: 8.6, to: 9.8, pad: 4 }],
    },
    {
      id: 'calendar', scene: '07-calendar', from: 50, to: 54,
      camera: [{ at: 0, el: 'game', zoom: 1.05, dy: -30 }],
      highlights: [{ el: 'status', from: 0.4, to: 3.6, pad: 5 }],
    },
    {
      id: 'cancelled', scene: '08-cancelled', from: 54, to: 57.5,
      camera: [{ at: 0, el: 'cancelled', zoom: 1.15, dy: 30 }],
      highlights: [{ el: 'cancelled', from: 0.3, to: 3.3, pad: 4 }],
    },
  ],
  captions: [
    { from: 3, to: 9, title: 'Training öffnen,', accent: 'Uhr antippen', sub: '„Nur an diesem Tag verlegen“' },
    { from: 9, to: 15, title: 'Tag, Zeit, Fläche', accent: 'sind übernommen', sub: 'Mannschaft ist schon gewählt' },
    { from: 15, to: 21, title: '„Spiel“ wählen,', accent: 'Gegner eintragen', sub: 'Heim ist vorausgewählt' },
    { from: 21, to: 26.4, title: 'Anstoßzeit', accent: 'eintragen', sub: 'Platzcoach prüft den Platz' },
    { from: 26.4, to: 32, title: 'In der Trainingszeit?', accent: 'Training wird abgesagt', sub: 'Automatisch beim Speichern' },
    { from: 32, to: 40, title: 'Kurz prüfen,', accent: 'Jetzt speichern', sub: 'Haken „Training absagen“ ist gesetzt' },
    { from: 40, to: 50, title: 'Fertiger Text', accent: 'für den Jugendleiter', sub: 'Zum Ansetzen im DFBnet' },
    { from: 50, to: 54, title: 'Im Kalender:', accent: '„Vorgemerkt“', sub: 'Bis es bei fussball.de steht' },
    { from: 54, to: 57.5, title: 'Training G1:', accent: 'abgesagt', sub: 'Für alle sichtbar' },
  ],
  messages: [
    { from: 42.4, to: 46.1, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (1/2)', range: [0, 14], fontSize: 31 },
    { from: 46.2, to: 49.9, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (2/2)', range: [14, 40], fontSize: 31 },
  ],
  summary: {
    from: 57.5,
    title: 'Kurz gesagt',
    items: [
      'Training öffnen, Uhr antippen',
      '„Spiel“ wählen, Gegner eintragen',
      'Anstoßzeit eintragen',
      'Prüfen und speichern – Training wird abgesagt',
      'Text an den Jugendleiter senden',
    ],
  },
  // Zeiten = echte Sprechzeiten der CapCut-Aufnahme vom 28.10.2026 (Filmzeit, aus den Pausen ermittelt).
  narration: [
    { from: 0.38, to: 5.01, text: 'Ein Spiel in der Trainingszeit anlegen? So geht’s in Platzcoach – in sieben Schritten.' },
    { from: 5.56, to: 9.33, text: 'Schritt eins: Im Kalender das Training öffnen und auf die Uhr tippen.' },
    { from: 9.97, to: 15.35, text: 'Schritt zwei: Platzcoach übernimmt Tag, Uhrzeit, Mannschaft und Fläche des Trainings.' },
    { from: 16.16, to: 20.84, text: 'Schritt drei: Oben auf Spiel tippen, Heim lassen und den Gegner eintragen.' },
    { from: 21.54, to: 31.16, text: 'Schritt vier: Die Anstoßzeit eintragen. Platzcoach prüft den Platz. Liegt das Spiel in eurer Trainingszeit, wird das Training beim Speichern automatisch abgesagt.' },
    { from: 31.92, to: 39.49, text: 'Schritt fünf: Termin speichern, kurz prüfen – der Haken für die Trainingsabsage ist schon gesetzt – und jetzt speichern.' },
    { from: 40.09, to: 48.8, text: 'Schritt sechs: Der fertige Text für den Jugendleiter liegt bereit, damit er das Spiel im DFBnet ansetzt. Per WhatsApp senden oder kopieren.' },
    { from: 49.5, to: 55.79, text: 'Schritt sieben: Im Kalender steht das Spiel als vorgemerkt, das Training ist abgesagt – für alle sichtbar.' },
    { from: 56.48, to: 64.3, text: 'Kurz gesagt: Uhr am Training, Spiel und Gegner, Anstoß, speichern, Jugendleiter informieren – fertig.' },
    { from: 65.02, to: 68.33, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Trainingskarte: Uhr „Nur an diesem Tag verlegen“ (moveTrainingDay) öffnet „Neuer Termin“ mit Tag, Zeit 16:00–17:00, Mannschaft G1 und Viertel 1',
    'Art „Spiel“, Heim vorausgewählt, Gegner; Anstoß 16:15 → Platz 16:00–17:15 ✓ frei, „Euer Training 16:00–17:00 – Absage beim Speichern“ (ownFreeFor)',
    'Termin prüfen: „Training G1 16:00–17:00 an dem Tag absagen“ vorausgewählt; Demo-Commits: Spiel angelegt, Training G1 am 16.10. abgesagt (automatisch)',
    'Jugendleiter-Text zur Ansetzung im DFBnet, per WhatsApp oder Kopieren',
    'Kalender: Spiel „Vorgemerkt · noch nicht bei fussball.de“, Training G1 „Fällt aus · Abgesagt“',
  ],
};

export default reel;
