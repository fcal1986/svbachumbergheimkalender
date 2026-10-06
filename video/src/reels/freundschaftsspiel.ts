// Reel 6 – Freundschaftsspiel: Heim mit Platzprüfung, Training absagen, DFBnet-Text; auswärts belegt keinen Platz.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'freundschaftsspiel',
  title: 'Freundschaftsspiel – heim oder auswärts',
  audience: 'Trainer',
  durationS: 30,
  cameraFit: true,
  hooks: {
    testspiel: { label: 'Testspiel vereinbart? Platz geprüft.', lines: ['Testspiel', 'vereinbart?', 'Platz geprüft.'], accent: 'Platz geprüft.' },
    heimauswaerts: { label: 'Heim oder auswärts – Platzcoach weiß, was das heißt.', lines: ['Heim oder auswärts –', 'Platzcoach weiß,', 'was das heißt.'], accent: 'was das heißt.' },
  },
  mainHook: 'testspiel',
  shots: [
    {
      id: 'home', scene: '01-home', from: 2.6, to: 6.4,
      camera: [{ at: 0, el: 'homeAway', zoom: 1.08, dy: 60 }, { at: 3.8, el: 'opponent', zoom: 1.16 }],
      highlights: [{ el: 'homeAway', from: 0.5, to: 1.6, pad: 3 }, { el: 'opponent', from: 1.3, to: 2.4, pad: 3 }, { el: 'homeHelp', from: 2.2, to: 3.7, pad: 4 }],
    },
    {
      id: 'kickoff', scene: '02-kickoff', from: 6.4, to: 10.4,
      camera: [{ at: 0, el: 'card', zoom: 1.15, dy: 20 }, { at: 1.4, el: 'kickInfo', zoom: 1.32, dy: -40 }],
      highlights: [{ el: 'kickoff', from: 0.3, to: 1.3, pad: 3 }, { el: 'kickInfo', from: 1.5, to: 3.8, pad: 5, dim: true }],
    },
    {
      id: 'cancel', scene: '03-cancel', from: 10.4, to: 13.6,
      camera: [{ at: 0, el: 'box', zoom: 1.2 }],
      highlights: [{ el: 'box', from: 0.4, to: 2.2, pad: 2 }],
      taps: [{ el: 'yes', at: 2.6 }],
    },
    {
      id: 'youthleader', scene: '04-youthleader', from: 13.6, to: 18.4,
      camera: [{ at: 0, el: 'title', zoom: 1.18, dy: 160 }, { at: 1.6, el: 'textBox', zoom: 1.24, dy: 10 }],
      highlights: [{ el: 'title', from: 0.3, to: 1.4, pad: 4 }, { el: 'textBox', from: 1.6, to: 4.6, pad: 3 }],
    },
    {
      id: 'planned', scene: '05-planned', from: 18.4, to: 21.6,
      camera: [{ at: 0, el: 'card', zoom: 1.05, dy: -40 }, { at: 3.2, el: 'card', zoom: 1.12, dy: -40 }],
      highlights: [{ el: 'card', from: 0.4, to: 3.0, pad: 2 }],
    },
    {
      id: 'away', scene: '06-away', from: 21.6, to: 25.4,
      camera: [{ at: 0, el: 'homeAway', zoom: 1.12, dy: 80 }, { at: 1.4, el: 'awayHelp', zoom: 1.3, dy: -60 }],
      highlights: [{ el: 'homeAway', from: 0.3, to: 1.3, pad: 3 }, { el: 'awayHelp', from: 1.5, to: 3.6, pad: 5, dim: true }],
    },
  ],
  captions: [
    { from: 3, to: 6.4, title: 'Freundschaftsspiel', accent: 'eintragen', sub: 'Heim, Gegner, Anstoß' },
    { from: 6.4, to: 10.4, title: 'Platz frei?', accent: 'Sofort geprüft', sub: 'Euer eigenes Training zählt als frei' },
    { from: 10.4, to: 13.6, title: 'Training am Spieltag?', accent: 'Gleich absagen', sub: 'Mit einem Tipp' },
    { from: 13.6, to: 18.4, title: 'Text für den', accent: 'Jugendleiter', sub: 'Fertig für die Ansetzung im DFBnet' },
    { from: 18.4, to: 21.6, title: 'Im Kalender:', accent: '„Vorgemerkt“', sub: 'Bis das Spiel bei fussball.de steht' },
    { from: 21.6, to: 25.4, title: 'Auswärts?', accent: 'Belegt keinen Platz', sub: 'Die Ansetzung macht der Gastgeber' },
  ],
  narration: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 6.2, text: 'Ein Freundschaftsspiel? Heim, Gegner, Anstoß – mehr braucht es nicht.' },
    { from: 6.6, to: 10.2, text: 'Platzcoach prüft den Platz sofort. Euer eigenes Training zählt dabei als frei.' },
    { from: 10.6, to: 13.4, text: 'Das Training an dem Tag sagst du mit einem Tipp ab.' },
    { from: 13.8, to: 18.2, text: 'Für den Jugendleiter liegt der Text für die Ansetzung im DFBnet bereit.' },
    { from: 18.6, to: 21.4, text: 'Im Kalender steht das Spiel als vorgemerkt.' },
    { from: 21.8, to: 25.2, text: 'Und auswärts? Dann bleibt euer Platz frei.' },
    { from: 25.4, to: 29.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Terminart Freundschaftsspiel mit Heim/Auswärts, Gegner, Anstoß (applyMatchForm)',
    'Platzprüfung ab Anstoß (updateKickInfo), eigenes Training zählt als frei',
    'Rückfrage „Training absagen?“ nach dem Speichern (afterHomeMatchSaved)',
    'Jugendleiter-Text „Freundschaftsspiel ansetzen (DFBnet)“',
    'Karte „Vorgemerkt · noch nicht bei fussball.de“',
    'Auswärts: belegt keinen Platz, Ansetzung macht der Gastgeber',
  ],
};

export default reel;
