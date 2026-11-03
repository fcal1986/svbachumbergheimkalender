// Reel 5 – Torwarttraining: für mehrere Mannschaften anlegen, Trainer melden ihre Torhüter an.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'torwarttraining',
  title: 'Torwarttraining mit Anmeldung',
  audience: 'Torwarttrainer, Mannschaftstrainer',
  durationS: 30,
  cameraFit: true,
  hooks: {
    werkommt: { label: 'Torwarttraining? Wer kommt diesmal?', lines: ['Torwarttraining?', 'Wer kommt', 'diesmal?'], accent: 'diesmal?' },
    alle: { label: 'Ein Torwarttraining für alle Jugenden. Ohne Zettel.', lines: ['Ein Torwarttraining', 'für alle Jugenden.', 'Ohne Zettel.'], accent: 'Ohne Zettel.' },
  },
  mainHook: 'werkommt',
  shots: [
    {
      id: 'form', scene: '01-form', from: 2.6, to: 7,
      camera: [{ at: 0, el: 'kindHelp', zoom: 1.1, dy: 40 }, { at: 2.2, el: 'gkTeams', zoom: 1.18, dy: 20 }],
      highlights: [{ el: 'kindChip', from: 0.5, to: 1.4, pad: 3 }, { el: 'kindHelp', from: 1.1, to: 2.4, pad: 4 }, { el: 'gkTeams', from: 2.4, to: 4.2, pad: 4 }],
    },
    {
      id: 'review', scene: '02-review', from: 7, to: 10.6,
      camera: [{ at: 0, el: 'sheet', zoom: 1.08, dy: 30 }],
      highlights: [{ el: 'rowWer', from: 0.4, to: 1.5, pad: 6 }, { el: 'rowMail', from: 1.2, to: 3.0, pad: 6, dim: true }],
      taps: [{ el: 'confirm', at: 3.2 }],
    },
    {
      id: 'todo', scene: '03-todo', from: 10.6, to: 14,
      camera: [{ at: 0, el: 'todo', zoom: 1.12, dy: -20 }, { at: 3.4, el: 'todo', zoom: 1.24, dy: -20 }],
      highlights: [{ el: 'todo', from: 0.5, to: 2.6, pad: 3 }],
      taps: [{ el: 'link', at: 2.9 }],
    },
    {
      id: 'signup', scene: '04-signup', from: 14, to: 19,
      camera: [{ at: 0, el: 'sheet', zoom: 1.0, dy: -40 }, { at: 1.4, el: 'paul', zoom: 1.2, dy: -20 }],
      highlights: [{ el: 'ben', from: 0.7, to: 2.6, pad: 2 }, { el: 'paul', from: 1.1, to: 2.6, pad: 2 }],
      taps: [{ el: 'save', at: 3.6 }],
    },
    {
      id: 'done', scene: '05-done', from: 19, to: 25.4,
      camera: [{ at: 0, el: 'card', zoom: 1.05 }, { at: 1.8, el: 'count', zoom: 1.28, dy: 30 }],
      highlights: [{ el: 'keepers', from: 2.0, to: 5.4, pad: 2 }],
    },
  ],
  captions: [
    { from: 3, to: 7, title: 'Torwarttraining', accent: 'für mehrere Teams', sub: 'Läuft parallel zum Training' },
    { from: 7, to: 10.6, title: 'Die Trainer', accent: 'bekommen eine Mail', sub: 'Mit der Bitte, Torhüter anzumelden' },
    { from: 10.6, to: 14, title: 'In Platzcoach:', accent: 'Zu erledigen', sub: 'Noch kein Torhüter angemeldet' },
    { from: 14, to: 19, title: 'Eigene Torhüter', accent: 'anhaken', sub: 'Andere Mannschaften bleiben gesperrt' },
    { from: 19, to: 25.4, title: 'Alle wissen,', accent: 'wer kommt', sub: 'Namen nur nach Anmeldung sichtbar' },
  ],
  narration: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 6.8, text: 'Als Torwarttrainer legst du ein Training für E- und F-Jugend an.' },
    { from: 7.1, to: 10.4, text: 'Die Trainer dieser Mannschaften bekommen automatisch eine Mail.' },
    { from: 10.8, to: 13.8, text: 'In Platzcoach steht es bei ihnen unter „Zu erledigen“.' },
    { from: 14.2, to: 18.8, text: 'Eigene Torhüter anhaken, speichern – fertig.' },
    { from: 19.2, to: 25.0, text: 'Jetzt weiß jeder, wer kommt. Die Namen sieht man nur nach der Anmeldung.' },
    { from: 25.4, to: 29.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Terminart Torwarttraining (nur Torwarttrainer/Admins), Mehrfachauswahl der Mannschaften, belegt keine Platzfläche',
    'Prüfansicht nennt Mail-Empfänger (Trainer der gewählten Mannschaften)',
    '„Zu erledigen“ für Mannschaftstrainer: Torwarttraining ohne eigenen Torhüter',
    'Torhüter-Anmeldung pro Termin, eigene Torhüter anhakbar, andere gesperrt',
    'Torhüterliste verschlüsselt, Namen nur nach Anmeldung',
  ],
};

export default reel;
