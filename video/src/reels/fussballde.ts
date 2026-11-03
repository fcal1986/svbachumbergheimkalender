// Reel 3 – fussball.de-Abgleich: Abweichungen melden, Mannschaften abgleichen, Spiele automatisch im Plan.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'fussballde',
  title: 'Spielplan von fussball.de – automatisch',
  audience: 'Jugendleiter, Vorstand',
  durationS: 30,
  cameraFit: true,
  hooks: {
    abtippen: { label: 'Spielplan abtippen? Macht Platzcoach.', lines: ['Spielplan', 'abtippen?', 'Macht Platzcoach.'], accent: 'Macht Platzcoach.' },
    automatisch: { label: 'Alle Spiele. Automatisch im Platzplan.', lines: ['Alle Spiele.', 'Automatisch', 'im Platzplan.'], accent: 'im Platzplan.' },
  },
  mainHook: 'abtippen',
  shots: [
    {
      id: 'todo', scene: '01-todo', from: 2.6, to: 6,
      camera: [{ at: 0, el: 'todo', zoom: 1.08, dy: 120 }, { at: 3.4, el: 'todo', zoom: 1.22, dy: 80 }],
      highlights: [{ el: 'todo', from: 0.9, to: 2.6, pad: 3 }],
      taps: [{ el: 'check', at: 3.0 }],
    },
    {
      id: 'sync', scene: '02-sync', from: 6, to: 9.6,
      camera: [{ at: 0, el: 'rowNew', zoom: 1.06, dy: 40 }, { at: 3.6, el: 'rowNew', zoom: 1.12, dy: 40 }],
      highlights: [{ el: 'pillNew', from: 0.4, to: 1.4, pad: 3 }, { el: 'rowNew', from: 1.0, to: 2.7, pad: 4 }],
      taps: [{ el: 'adopt', at: 3.0 }],
    },
    {
      id: 'adopted', scene: '03-adopted', from: 9.6, to: 11.6,
      camera: [{ at: 0, el: 'rowGone', zoom: 1.15, dy: 30 }],
      highlights: [{ el: 'matched', from: 0.3, to: 1.8, pad: 4 }],
    },
    {
      id: 'games', scene: '04-games', from: 11.6, to: 15.6,
      camera: [{ at: 0, el: 'away', zoom: 1.02, dy: 60 }, { at: 2.0, el: 'away', zoom: 1.15 }],
      highlights: [{ el: 'awayNote', from: 0.7, to: 2.3, pad: 4 }, { el: 'link', from: 2.0, to: 3.6, pad: 5 }],
    },
    {
      id: 'pitch', scene: '05-pitch', from: 15.6, to: 19.6,
      camera: [{ at: 0, el: 'livePitch', zoom: 1.08, dy: 40 }, { at: 4, el: 'livePitch', zoom: 1.16 }],
      highlights: [{ el: 'gameTile', from: 0.6, to: 3.6, pad: 42 }],
    },
    {
      id: 'moved', scene: '06-moved', from: 19.6, to: 25.4,
      camera: [{ at: 0, el: 'card', zoom: 1.05, dy: -40 }, { at: 1.6, el: 'card', zoom: 1.08, dy: 40 }],
      highlights: [{ el: 'card', from: 0.3, to: 1.4, pad: 2 }, { el: 'badge', from: 1.9, to: 5.2, pad: 6 }],
    },
  ],
  captions: [
    { from: 3, to: 6, title: 'Abweichungen?', accent: 'Sofort gemeldet', sub: 'Platzcoach gleicht mit fussball.de ab' },
    { from: 6, to: 11.6, title: 'Mannschaften', accent: 'abgleichen', sub: 'Nichts ändert sich ohne dein OK' },
    { from: 11.6, to: 15.6, title: 'Alle Spiele', accent: 'automatisch im Plan', sub: 'Heim und auswärts, mit Link zum Spiel' },
    { from: 15.6, to: 19.6, title: 'Heimspiele', accent: 'belegen den Platz', sub: 'E bis G nur eine Hälfte' },
    { from: 19.6, to: 25.4, title: 'Spiel verlegt?', accent: 'Steht gleich drin', sub: 'Abgleich mit fussball.de alle 2 Stunden' },
  ],
  narration: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 5.8, text: 'Platzcoach gleicht sich mit fussball.de ab – und meldet, wenn etwas nicht passt.' },
    { from: 6.1, to: 11.4, text: 'Neue Mannschaft bei fussball.de? Mit einem Tipp übernommen. Ohne dein OK ändert sich nichts.' },
    { from: 11.8, to: 15.4, text: 'Alle Spiele stehen automatisch im Kalender – heim wie auswärts.' },
    { from: 15.8, to: 19.4, text: 'Heimspiele belegen den Platz von selbst.' },
    { from: 19.8, to: 25.2, text: 'Und verlegt fussball.de ein Spiel, sieht es der ganze Verein beim nächsten Abgleich.' },
    { from: 25.4, to: 29.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Zu erledigen (Admins): Mannschaftsabweichungen zu fussball.de',
    'Mannschaften abgleichen: neu bei fussball.de übernehmen / nicht bei fussball.de entfernen, nichts ohne OK',
    'fussball.de-Spiele (Heim + Auswärts) automatisch im Kalender, Auswärts belegt keinen Platz',
    'E/F/G-Heimspiele belegen automatisch eine Hälfte',
    'Sync alle 2 Stunden (cron 17 */2), Verlegungen als „verlegt vom …“',
  ],
};

export default reel;
