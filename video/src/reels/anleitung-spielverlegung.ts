// Anleitung: Spielverlegung in Platzcoach – vom Suchen bis zur Nachricht an den Jugendleiter (≈ 90 s, 7 Schritte).
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'anleitung-spielverlegung',
  title: 'Anleitung: Spiel verlegen',
  audience: 'Trainer (Erklärvideo)',
  durationS: 90,
  cameraFit: true,
  hooks: {
    anleitung: { label: 'Spiel verlegen – so geht’s in Platzcoach.', lines: ['Spiel verlegen?', 'So geht’s in', '7 Schritten.'], accent: '7 Schritten.' },
  },
  mainHook: 'anleitung',
  steps: [
    { from: 3, to: 9, n: 1, label: 'Spiel finden' },
    { from: 9, to: 19, n: 2, label: 'Suche einstellen' },
    { from: 19, to: 28, n: 3, label: 'Ergebnisse lesen' },
    { from: 28, to: 40, n: 4, label: 'Gegner fragen' },
    { from: 40, to: 55, n: 5, label: 'Zusage vormerken' },
    { from: 55, to: 67, n: 6, label: 'Jugendleiter informieren' },
    { from: 67, to: 78, n: 7, label: 'Danach' },
  ],
  shots: [
    // Schritt 1 – Spiel finden
    {
      id: 'game', scene: '01-game', from: 2.6, to: 9,
      camera: [{ at: 0, el: 'gameCard', zoom: 1.0, dy: -20 }, { at: 2.4, el: 'gameHead', zoom: 1.35, dy: 10 }],
      highlights: [{ el: 'gameHead', from: 0.8, to: 2.3, pad: 2 }, { el: 'searchBtn', from: 2.8, to: 5.6, pad: 6 }, { el: 'moveBtn', from: 3.6, to: 4.6, pad: 6 }],
      taps: [{ el: 'searchBtn', at: 5.6 }],
    },
    // Schritt 2 – Suche einstellen
    {
      id: 'search', scene: '02-search', from: 9, to: 14,
      camera: [{ at: 0, el: 'gameInfo', zoom: 1.15, dy: 60 }, { at: 1.8, el: 'days', zoom: 1.2, dy: 30 }],
      highlights: [{ el: 'gameInfo', from: 0.3, to: 1.6, pad: 4 }, { el: 'days', from: 1.9, to: 3.4, pad: 4 }, { el: 'preselect', from: 2.8, to: 4.8, pad: 4 }],
    },
    {
      id: 'times', scene: '03-times', from: 14, to: 19,
      camera: [{ at: 0, el: 'times', zoom: 1.2 }, { at: 2.0, el: 'rule', zoom: 1.12, dy: 30 }],
      highlights: [{ el: 'times', from: 0.3, to: 1.9, pad: 4 }, { el: 'rule', from: 2.0, to: 3.8, pad: 4 }],
      taps: [{ el: 'searchBtn', at: 4.3 }],
    },
    // Schritt 3 – Ergebnisse lesen
    {
      id: 'results', scene: '04-results', from: 19, to: 28,
      camera: [{ at: 0, el: 'headline', zoom: 1.1, dy: 160 }, { at: 1.8, el: 'rowFr', zoom: 1.2 }, { at: 6.0, el: 'rowSa', zoom: 1.2 }],
      highlights: [
        { el: 'headline', from: 0.3, to: 1.7, pad: 4 },
        { el: 'ownHint', from: 2.0, to: 4.0, pad: 4 },
        { el: 'kick', from: 3.8, to: 5.6, pad: 4 },
        { el: 'sameDay', from: 6.3, to: 8.6, pad: 4 },
      ],
    },
    // Schritt 4 – Gegner fragen
    {
      id: 'two', scene: '05-two', from: 28, to: 31.6,
      camera: [{ at: 0, el: 'rowMi', zoom: 1.15, dy: 60 }],
      highlights: [{ el: 'rowMi', from: 0.9, to: 3.4, pad: 3 }, { el: 'rowFr', from: 1.9, to: 3.4, pad: 3 }],
      taps: [{ el: 'rowMi', at: 0.9, dx: -140 }, { el: 'rowFr', at: 1.9, dx: -140 }],
    },
    {
      id: 'share', scene: '06-share', from: 31.6, to: 40,
      camera: [{ at: 0, el: 'waBtn', zoom: 1.12, dy: -150 }],
      highlights: [{ el: 'waBtn', from: 0.4, to: 2.0, pad: 4 }],
      taps: [{ el: 'waBtn', at: 2.0 }],
    },
    // Schritt 5 – Zusage vormerken
    {
      id: 'one', scene: '07-one', from: 40, to: 44.4,
      camera: [{ at: 0, el: 'markBtn', zoom: 1.12, dy: -180 }],
      highlights: [{ el: 'markBtn', from: 0.6, to: 3.6, pad: 4, dim: true }],
      taps: [{ el: 'markBtn', at: 3.8 }],
    },
    {
      id: 'move', scene: '08-move', from: 44.4, to: 49.6,
      camera: [{ at: 0, el: 'dateTime', zoom: 1.15, dy: 80 }, { at: 2.4, el: 'swap', zoom: 1.2, dy: 30 }],
      highlights: [{ el: 'dateTime', from: 0.3, to: 2.2, pad: 4 }, { el: 'swap', from: 2.6, to: 5.0, pad: 4 }],
    },
    {
      id: 'moveBottom', scene: '09-move-bottom', from: 49.6, to: 55,
      camera: [{ at: 0, el: 'reasons', zoom: 1.15 }, { at: 1.8, el: 'training', zoom: 1.2, dy: -20 }],
      highlights: [{ el: 'reasons', from: 0.2, to: 1.7, pad: 4 }, { el: 'training', from: 1.9, to: 4.2, pad: 4, dim: true }],
      taps: [{ el: 'yes', at: 4.7 }],
    },
    // Schritt 6 – Jugendleiter informieren
    {
      id: 'youthleader', scene: '10-youthleader', from: 55, to: 67,
      camera: [{ at: 0, el: 'title', zoom: 1.15, dy: 200 }],
      highlights: [{ el: 'title', from: 0.3, to: 2.0, pad: 4 }, { el: 'waBtn', from: 10.0, to: 11.6, pad: 4 }, { el: 'copyBtn', from: 10.4, to: 11.6, pad: 4 }],
    },
    // Schritt 7 – Danach
    {
      id: 'planned', scene: '11-planned', from: 67, to: 71,
      camera: [{ at: 0, el: 'card', zoom: 1.02, dy: -30 }],
      highlights: [{ el: 'label', from: 0.4, to: 2.0, pad: 5 }, { el: 'badge', from: 1.8, to: 3.7, pad: 5 }],
    },
    {
      id: 'ghost', scene: '12-ghost', from: 71, to: 74.6,
      camera: [{ at: 0, el: 'ghost', zoom: 1.1, dy: 20 }],
      highlights: [{ el: 'ghost', from: 0.4, to: 3.3, pad: 3 }],
    },
    {
      id: 'reopen', scene: '13-reopen', from: 74.6, to: 78.2,
      camera: [{ at: 0, el: 'ylBtn', zoom: 1.1, dy: -140 }],
      highlights: [{ el: 'ylBtn', from: 0.4, to: 2.4, pad: 4 }, { el: 'removeBtn', from: 1.8, to: 3.4, pad: 4 }],
    },
  ],
  captions: [
    { from: 3, to: 9, title: 'Heimspiel im Kalender', accent: 'Lupe antippen', sub: '„Neue Ansetzung suchen“ – direkt am Spiel' },
    { from: 9, to: 14, title: 'Wochentage', accent: 'sind vorausgewählt', sub: 'Spieltag plus eure Trainingstage' },
    { from: 14, to: 19, title: 'Uhrzeit je Tag', accent: 'anpassen – Suchen', sub: 'Gesucht wird bis 6 Wochen nach dem Spiel' },
    { from: 19, to: 23.5, title: 'Freie Termine', accent: 'mit Hälfte und Anstoß', sub: 'Eure Trainingszeit zählt als frei' },
    { from: 23.5, to: 28, title: 'Auch am selben Tag', accent: 'zu anderer Zeit', sub: 'Falls nur die Anstoßzeit wandern muss' },
    { from: 28, to: 34.4, title: 'Mehrere Termine', accent: 'anhaken', sub: 'Der Gegner sucht sich einen aus' },
    { from: 34.4, to: 40, title: 'Per WhatsApp', accent: 'an den Gegner', sub: 'Text mit Liga, Spiel und Anstoßzeiten' },
    { from: 40, to: 44.4, title: 'Zusage da?', accent: 'Nur diesen anhaken', sub: 'Dann erscheint „Als Verlegung vormerken“' },
    { from: 44.4, to: 49.6, title: 'Anstoß eintragen', accent: 'Heimrecht getauscht?', sub: 'Dann wird es ein Auswärtsspiel' },
    { from: 49.6, to: 55, title: 'Grund wählen,', accent: 'Training absagen', sub: 'Platz wird geprüft – dann „Vormerken“' },
    { from: 55, to: 58.6, title: 'Vorgemerkt.', accent: 'Jetzt der Jugendleiter', sub: 'Er stellt den Antrag im DFBnet' },
    { from: 58.6, to: 67, title: 'Fertiger Text', accent: 'für den DFBnet-Antrag', sub: 'Per WhatsApp senden oder kopieren' },
    { from: 67, to: 71, title: 'Neuer Termin:', accent: '„Vorgemerkt“', sub: 'Bis fussball.de die Verlegung übernimmt' },
    { from: 71, to: 74.6, title: 'Alter Termin:', accent: '„Verlegt auf …“', sub: 'Alle sehen sofort Bescheid' },
    { from: 74.6, to: 78, title: 'Nachricht vergessen?', accent: 'Kalender-Symbol', sub: 'Am Spiel – Text jederzeit erneut senden' },
  ],
  messages: [
    { from: 34.6, to: 39.8, textKey: 'anfrageGegner', label: 'Anfrage an den Gegner', fontSize: 30 },
    { from: 58.8, to: 62.9, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (1/2)', range: [0, 14], fontSize: 31 },
    { from: 63.0, to: 66.9, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (2/2)', range: [14, 40], fontSize: 31 },
  ],
  summary: {
    from: 78,
    title: 'Kurz gesagt',
    items: [
      'Lupe am Heimspiel antippen',
      'Tage und Uhrzeiten prüfen, suchen',
      'Freie Termine ansehen',
      'Vorschläge per WhatsApp an den Gegner',
      'Zusage: Termin vormerken',
      'Text an den Jugendleiter senden',
      'Fertig – alle sehen den neuen Termin',
    ],
  },
  narration: [
    { from: 0.3, to: 2.8, text: '__HOOK__' },
    { from: 3.1, to: 8.8, text: 'Öffne im Kalender das Heimspiel und tipp auf die Lupe: Neue Ansetzung suchen.' },
    { from: 9.2, to: 13.8, text: 'Platzcoach wählt den Spieltag und eure Trainingstage schon vor.' },
    { from: 14.2, to: 18.8, text: 'Passe bei Bedarf die Uhrzeit pro Tag an und tipp auf Suchen.' },
    { from: 19.2, to: 27.8, text: 'Du siehst alle freien Termine mit Platzhälfte und Anstoßzeit – auch in eurer eigenen Trainingszeit oder am selben Tag zu einer anderen Uhrzeit.' },
    { from: 28.2, to: 39.6, text: 'Hake die Termine an, die für euch passen, und schick sie per WhatsApp an den Gegner. Der Text ist fertig formuliert.' },
    { from: 40.2, to: 44.2, text: 'Der Gegner sagt zu? Dann hakst du nur diesen Termin an und tippst auf Als Verlegung vormerken.' },
    { from: 44.6, to: 49.4, text: 'Trag den Anstoß ein. Wurde das Heimrecht getauscht, hakst du das hier an.' },
    { from: 49.8, to: 54.8, text: 'Wähle den Grund. Platzcoach prüft den Platz und sagt euer Training an dem Tag gleich mit ab.' },
    { from: 55.2, to: 66.8, text: 'Jetzt liegt der fertige Text für den Jugendleiter bereit – mit allen Angaben für den Verlegungsantrag im DFBnet. Per WhatsApp senden oder kopieren.' },
    { from: 67.2, to: 74.4, text: 'Im Kalender steht das Spiel am neuen Tag als vorgemerkt, am alten Termin steht: verlegt auf.' },
    { from: 74.8, to: 77.8, text: 'Den Text kannst du über das Kalender-Symbol am Spiel jederzeit erneut senden.' },
    { from: 78.2, to: 84.6, text: 'Noch einmal kurz: suchen, Gegner fragen, vormerken, Jugendleiter informieren – fertig.' },
    { from: 85.4, to: 89.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Lupe „Neue Ansetzung suchen“ am Heimspiel (openRescheduleFinder), Spieltag + Trainingstage vorausgewählt, Uhrzeit je Wochentag',
    'Suche bis 6 Wochen nach dem Spiel, eigene Trainingszeit zählt als frei, E/F/G eine Hälfte, gleicher Tag mit anderer Anstoßzeit',
    'Mehrere Termine anhaken → WhatsApp-Vorschlag an den Gegner (shareRescheduleProposal)',
    '„Zugesagt? Als Verlegung vormerken“ nur bei genau einem gewählten Termin (renderRescheduleShareBar)',
    'Vormerken mit Anstoß, „Heimrecht getauscht“ (12.10.2026), Grund-Chips, Platzprüfung, Training absagen',
    'Jugendleiter-Nachricht für den DFBnet-Spielverlegungsantrag, per WhatsApp oder Kopieren',
    'Kalender: neuer Termin „Vorgemerkt“, alter Termin „Verlegt auf …“, erneut über Kalender-Symbol („Nachricht an Jugendleiter (DFBnet)“)',
  ],
};

export default reel;
