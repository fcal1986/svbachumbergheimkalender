// Reel 2 – Spielverlegung: Ansetzungssuche → Anfrage an den Gegner → Vormerken → DFBnet-Text für den Jugendleiter.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'spielverlegung',
  title: 'Spiel verlegen ohne Rumtelefonieren',
  audience: 'Trainer',
  durationS: 30,
  cameraFit: true,
  hooks: {
    verlegen: { label: 'Spiel verlegen? Platzcoach findet den freien Termin.', lines: ['Spiel verlegen?', 'Platzcoach findet', 'den freien Termin.'], accent: 'den freien Termin.' },
    ferien: { label: 'Ferien? Spiel verlegen – ohne Rumtelefonieren.', lines: ['Ferien?', 'Spiel verlegen –', 'ohne Rumtelefonieren.'], accent: 'ohne Rumtelefonieren.' },
  },
  mainHook: 'verlegen',
  shots: [
    {
      id: 'game', scene: '01-game', from: 2.6, to: 5.6,
      camera: [{ at: 0, el: 'gameCard', zoom: 1.05, dy: -40 }, { at: 2.6, el: 'gameCard', zoom: 1.2, dy: -60 }],
      highlights: [{ el: 'gameCard', from: 0.7, to: 2.0, pad: 2 }],
      taps: [{ el: 'searchBtn', at: 2.6 }],
    },
    {
      id: 'search', scene: '02-search', from: 5.6, to: 8.6,
      camera: [{ at: 0, el: 'days', zoom: 1.12, dy: 60 }, { at: 2.6, el: 'days', zoom: 1.22, dy: 60 }],
      highlights: [{ el: 'days', from: 0.4, to: 1.7, pad: 4 }, { el: 'preselect', from: 1.3, to: 2.6, pad: 4 }],
      taps: [{ el: 'searchBtn', at: 2.7 }],
    },
    {
      id: 'results', scene: '03-results', from: 8.6, to: 12.2,
      camera: [{ at: 0, el: 'headline', zoom: 1.15, dy: 120 }, { at: 1.2, el: 'rowFr', zoom: 1.32 }],
      highlights: [{ el: 'headline', from: 0.3, to: 1.2, pad: 3 }, { el: 'rowFr', from: 1.5, to: 3.4, pad: 3, dim: true }],
      taps: [{ el: 'rowFr', at: 3.3, dx: -140 }],
    },
    {
      id: 'selected', scene: '04-selected', from: 12.2, to: 16,
      camera: [{ at: 0, el: 'waBtn', zoom: 1.15, dy: -120 }],
      highlights: [{ el: 'waBtn', from: 0.3, to: 1.1, pad: 3 }, { el: 'markBtn', from: 3.1, to: 3.8, pad: 3 }],
      taps: [{ el: 'waBtn', at: 0.9 }, { el: 'markBtn', at: 3.5 }],
    },
    {
      id: 'move', scene: '05-move', from: 16, to: 19.4,
      camera: [{ at: 0, el: 'dateTime', zoom: 1.15, dy: 140 }, { at: 1.6, el: 'training', zoom: 1.2, dy: -60 }],
      highlights: [{ el: 'dateTime', from: 0.3, to: 1.3, pad: 3 }, { el: 'reasons', from: 0.9, to: 1.9, pad: 3 }, { el: 'training', from: 1.8, to: 3.0, pad: 3, dim: true }],
      taps: [{ el: 'yes', at: 3.2 }],
    },
    {
      id: 'youthleader', scene: '06-youthleader', from: 19.4, to: 22.6,
      camera: [{ at: 0, el: 'title', zoom: 1.18, dy: 180 }, { at: 3.2, el: 'textBox', zoom: 1.25, dy: -20 }],
      highlights: [{ el: 'title', from: 0.3, to: 1.3, pad: 4 }, { el: 'textBox', from: 1.2, to: 3.0, pad: 3 }],
    },
    {
      id: 'planned', scene: '07-planned', from: 22.6, to: 25.4,
      camera: [{ at: 0, el: 'card', zoom: 1.05, dy: -40 }, { at: 2.8, el: 'card', zoom: 1.12, dy: -40 }],
      highlights: [{ el: 'card', from: 0.4, to: 2.6, pad: 2 }],
    },
  ],
  captions: [
    { from: 3, to: 5.6, title: 'Spiel verlegen?', accent: 'Lupe antippen', sub: 'Direkt am Heimspiel im Kalender' },
    { from: 5.6, to: 8.6, title: 'Trainingstage', accent: 'schon gewählt', sub: 'Plus der ursprüngliche Spieltag' },
    { from: 8.6, to: 12.2, title: 'Freie Termine', accent: 'sofort gefunden', sub: 'Auch in eurer eigenen Trainingszeit' },
    { from: 12.2, to: 16, title: 'Anfrage an den Gegner', accent: 'fertig formuliert', sub: 'Per WhatsApp teilen' },
    { from: 16, to: 19.4, title: 'Zugesagt?', accent: 'Vormerken.', sub: 'Training am neuen Tag gleich absagen' },
    { from: 19.4, to: 22.6, title: 'Text für den', accent: 'DFBnet-Antrag', sub: 'Fertig für den Jugendleiter' },
    { from: 22.6, to: 25.4, title: 'Alle sehen', accent: 'den neuen Termin', sub: '„Vorgemerkt“, bis fussball.de bestätigt' },
  ],
  messages: [{ from: 13.3, to: 15.5, textKey: 'anfrageGegner', label: 'Von Platzcoach vorbereitet', maxLines: 11 }],
  narration: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 5.5, text: 'Ein Heimspiel muss verlegt werden? Tipp auf die Lupe am Spiel.' },
    { from: 5.7, to: 8.4, text: 'Spieltag und Trainingstage sind schon ausgewählt.' },
    { from: 8.7, to: 12.0, text: 'Platzcoach findet freie Termine – auch in eurer eigenen Trainingszeit.' },
    { from: 12.3, to: 15.8, text: 'Die Anfrage an den Gegner ist fertig formuliert und geht per WhatsApp raus.' },
    { from: 16.1, to: 19.2, text: 'Zusage da? Vormerken – das Training an dem Tag wird gleich mit abgesagt.' },
    { from: 19.5, to: 22.4, text: 'Für den Jugendleiter liegt der Text für den DFBnet-Antrag bereit.' },
    { from: 22.7, to: 25.2, text: 'Und im Kalender sehen alle sofort den neuen Termin.' },
    { from: 25.4, to: 29.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Neue Ansetzung suchen am Heimspiel (openRescheduleFinder), Spieltag + Trainingstage vorausgewählt',
    'Eigene Trainingszeit zählt als frei, E/F/G brauchen eine Hälfte',
    'WhatsApp-Vorschlag an den Gegner (shareRescheduleProposal, Text aus der App)',
    'Verlegung vormerken mit Grund, eigenes Training wird abgesagt (Demo-Commit)',
    'Jugendleiter-Nachricht für den DFBnet-Spielverlegungsantrag',
    'Vorgemerkte Verlegung im Kalender orange „Vorgemerkt“',
  ],
};

export default reel;
