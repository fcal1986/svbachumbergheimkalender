// Reel 4 – Freien Termin suchen: Schulfest im Frühjahr, freie Samstage auf einen Blick.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'freiertermin',
  title: 'Freien Termin finden',
  audience: 'Vorstand, Veranstalter',
  durationS: 30,
  cameraFit: true,
  hooks: {
    schulfest: { label: 'Schulfest im Mai? Freien Samstag sofort finden.', lines: ['Schulfest im Mai?', 'Freien Samstag', 'sofort finden.'], accent: 'sofort finden.' },
    turnier: { label: 'Turnier planen? Platzcoach kennt jeden freien Tag.', lines: ['Turnier planen?', 'Platzcoach kennt', 'jeden freien Tag.'], accent: 'jeden freien Tag.' },
  },
  mainHook: 'schulfest',
  shots: [
    {
      id: 'form', scene: '01-form', from: 2.6, to: 6,
      camera: [{ at: 0, el: 'title', zoom: 1.08, dy: 80 }, { at: 2.0, x: 200, y: 330, zoom: 1.04 }],
      highlights: [{ el: 'title', from: 0.6, to: 1.6, pad: 3 }, { el: 'teamAll', from: 1.2, to: 2.2, pad: 3 }, { el: 'finder', from: 2.1, to: 3.3, pad: 5 }],
      taps: [{ el: 'finder', at: 3.0 }],
    },
    {
      id: 'criteria', scene: '02-criteria', from: 6, to: 10.4,
      camera: [{ at: 0, el: 'months', zoom: 1.12, dy: 40 }, { at: 2.2, el: 'durs', zoom: 1.15, dy: 20 }],
      highlights: [{ el: 'months', from: 0.4, to: 1.6, pad: 4 }, { el: 'days', from: 1.3, to: 2.4, pad: 4 }, { el: 'durs', from: 2.2, to: 3.2, pad: 4 }, { el: 'start', from: 3.0, to: 4.2, pad: 4 }],
    },
    {
      id: 'results', scene: '03-results', from: 10.4, to: 15.4,
      camera: [{ at: 0, x: 200, y: 215, zoom: 1.25 }, { at: 2.6, el: 'pick', zoom: 1.3, dy: -60 }],
      highlights: [{ el: 'legend', from: 0.6, to: 2.2, pad: 4 }, { el: 'pick', from: 2.8, to: 4.6, pad: 4, dim: true }],
      taps: [{ el: 'pickBtn', at: 4.3 }],
    },
    {
      id: 'taken', scene: '04-taken', from: 15.4, to: 19,
      camera: [{ at: 0, el: 'timeCard', zoom: 1.12, dy: 40 }, { at: 1.6, el: 'status', zoom: 1.3, dy: -120 }],
      highlights: [{ el: 'timeCard', from: 0.3, to: 1.5, pad: 3 }, { el: 'status', from: 1.8, to: 3.4, pad: 4, dim: true }],
    },
    {
      id: 'review', scene: '05-review', from: 19, to: 25.4,
      camera: [{ at: 0, el: 'sheet', zoom: 1.05, dy: 20 }, { at: 6, el: 'sheet', zoom: 1.12, dy: 20 }],
      highlights: [{ el: 'rowPlatz', from: 0.6, to: 2.6, pad: 6 }],
      taps: [{ el: 'confirm', at: 3.4 }],
    },
  ],
  captions: [
    { from: 3, to: 6, title: 'Schulfest planen?', accent: 'Erst suchen', sub: 'Direkt im Terminformular' },
    { from: 6, to: 10.4, title: 'Mai oder Juni,', accent: 'samstags, 5 Stunden', sub: 'Ganzer Platz, ab 10 Uhr' },
    { from: 10.4, to: 15.4, title: 'Freie Tage', accent: 'auf einen Blick', sub: 'Grün frei · gelb andere Uhrzeit · grau belegt' },
    { from: 15.4, to: 19, title: 'Übernommen.', accent: 'Platz passt.', sub: 'Dieselbe Prüfung wie beim Speichern' },
    { from: 19, to: 25.4, title: 'Eingetragen', accent: 'für den ganzen Verein', sub: 'Alle sehen: Der Platz ist vergeben' },
  ],
  narration: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 5.8, text: 'Schulfest, Turnier oder Vereinsfest – und kein freier Termin in Sicht?' },
    { from: 6.1, to: 10.2, text: 'Monate, Wochentage und Dauer wählen.' },
    { from: 10.6, to: 15.2, text: 'Platzcoach zeigt sofort, welche Samstage frei sind – mit Vorschlägen.' },
    { from: 15.6, to: 18.8, text: 'Ein Tipp übernimmt Datum und Uhrzeit, der Platz ist geprüft.' },
    { from: 19.2, to: 25.0, text: 'Speichern – und der ganze Verein sieht: Der Platz ist an dem Tag vergeben.' },
    { from: 25.4, to: 29.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    '„Freien Termin suchen“ im Terminformular (openSlotFinder): Fläche, Monate (12 voraus), Wochentage, Dauer, Wunsch-Beginn',
    'Tage grün/gelb/grau, bis zu 5 Vorschläge, „Übernehmen“ setzt Datum + Zeit',
    'Gleiche Regeln wie beim Speichern (Termine, Trainings, fussball.de-Heimspiele, Sperren)',
    'Prüfansicht vor dem Speichern; Lesen ohne Anmeldung',
  ],
};

export default reel;
