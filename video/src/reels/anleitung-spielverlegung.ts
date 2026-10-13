// Anleitung: Spielverlegung in Platzcoach – vom Suchen bis zur Nachricht an den Jugendleiter (≈ 100 s, 8 Schritte).
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'anleitung-spielverlegung',
  title: 'Anleitung: Spiel verlegen',
  audience: 'Trainer (Erklärvideo)',
  durationS: 100,
  cameraFit: true,
  hooks: {
    anleitung: { label: 'Spiel verlegen – so geht’s in Platzcoach.', lines: ['Spiel verlegen?', 'So geht’s in', '8 Schritten.'], accent: '8 Schritten.' },
  },
  mainHook: 'anleitung',
  steps: [
    { from: 3, to: 9, n: 1, label: 'Spiel finden' },
    { from: 9, to: 19, n: 2, label: 'Suche einstellen' },
    { from: 19, to: 27, n: 3, label: 'Ergebnisse lesen' },
    { from: 27, to: 39, n: 4, label: 'Gegner fragen' },
    { from: 39, to: 50, n: 5, label: 'Offene Anfrage' },
    { from: 50, to: 61, n: 6, label: 'Zusage vormerken' },
    { from: 61, to: 73, n: 7, label: 'Jugendleiter informieren' },
    { from: 73, to: 87, n: 8, label: 'Danach' },
  ],
  shots: [
    // Schritt 1 – Spiel finden
    {
      id: 'game', scene: '01-game', from: 2.6, to: 9,
      camera: [{ at: 0, el: 'gameCard', zoom: 1.0, dy: -20 }, { at: 2.4, el: 'gameHead', zoom: 1.35, dy: 10 }],
      highlights: [{ el: 'gameHead', from: 0.8, to: 2.3, pad: 2 }, { el: 'searchBtn', from: 2.8, to: 5.6, pad: 6 }],
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
      id: 'results', scene: '04-results', from: 19, to: 27,
      camera: [{ at: 0, el: 'headline', zoom: 1.1, dy: 120 }, { at: 1.6, el: 'rowFr', zoom: 1.2 }, { at: 5.0, el: 'rowSa', zoom: 1.2, dy: -30 }],
      highlights: [
        { el: 'headline', from: 0.3, to: 1.5, pad: 4 },
        { el: 'infoFr', from: 1.8, to: 4.4, pad: 4 },
        { el: 'infoSa', from: 5.2, to: 7.6, pad: 4 },
      ],
    },
    // Schritt 4 – Gegner fragen
    {
      id: 'two', scene: '05-two', from: 27, to: 30.6,
      camera: [{ at: 0, el: 'rowMi', zoom: 1.15, dy: 60 }],
      highlights: [{ el: 'rowMi', from: 0.9, to: 3.4, pad: 3 }, { el: 'rowFr', from: 1.9, to: 3.4, pad: 3 }],
      taps: [{ el: 'rowMi', at: 0.9, dx: -140 }, { el: 'rowFr', at: 1.9, dx: -140 }],
    },
    {
      id: 'share', scene: '06-share', from: 30.6, to: 39,
      camera: [{ at: 0, el: 'waBtn', zoom: 1.12, dy: -120 }],
      highlights: [{ el: 'waBtn', from: 0.4, to: 2.0, pad: 4 }, { el: 'hint', from: 0.9, to: 2.4, pad: 4 }],
      taps: [{ el: 'waBtn', at: 2.2 }],
    },
    // Schritt 5 – Offene Anfrage (Konto → Terminanfragen)
    {
      id: 'konto', scene: '07-konto', from: 39, to: 42.6,
      camera: [{ at: 0, el: 'section', zoom: 1.0, dy: 40 }, { at: 1.6, el: 'section', zoom: 1.12 }],
      highlights: [{ el: 'section', from: 0.6, to: 3.0, pad: 3 }],
      taps: [{ el: 'section', at: 3.0, dx: 60 }],
    },
    {
      id: 'request', scene: '08-request', from: 42.6, to: 50,
      camera: [{ at: 0, el: 'card', zoom: 1.12 }, { at: 3.6, el: 'optFr', zoom: 1.25, dy: 20 }],
      highlights: [
        { el: 'head', from: 0.3, to: 1.6, pad: 3 },
        { el: 'optMi', from: 1.5, to: 3.2, pad: 3 },
        { el: 'optFr', from: 1.8, to: 3.2, pad: 3 },
        { el: 'acts', from: 2.4, to: 3.6, pad: 3 },
        { el: 'yesFr', from: 4.4, to: 6.6, pad: 5 },
      ],
      taps: [{ el: 'yesFr', at: 6.6 }],
    },
    // Schritt 6 – Zusage vormerken
    {
      id: 'move', scene: '09-move', from: 50, to: 55.4,
      camera: [{ at: 0, el: 'dateTime', zoom: 1.15, dy: 80 }, { at: 2.4, el: 'swap', zoom: 1.2, dy: 30 }],
      highlights: [{ el: 'dateTime', from: 0.3, to: 2.2, pad: 4 }, { el: 'swap', from: 2.6, to: 5.0, pad: 4 }],
    },
    {
      id: 'moveBottom', scene: '10-move-bottom', from: 55.4, to: 61,
      camera: [{ at: 0, el: 'reasons', zoom: 1.15 }, { at: 1.8, el: 'training', zoom: 1.2, dy: -20 }],
      highlights: [{ el: 'reasons', from: 0.2, to: 1.7, pad: 4 }, { el: 'training', from: 1.9, to: 4.2, pad: 4, dim: true }],
      taps: [{ el: 'yes', at: 4.8 }],
    },
    // Schritt 7 – Jugendleiter informieren
    {
      id: 'youthleader', scene: '11-youthleader', from: 61, to: 73,
      camera: [{ at: 0, el: 'title', zoom: 1.15, dy: 200 }],
      highlights: [{ el: 'title', from: 0.3, to: 2.0, pad: 4 }, { el: 'waBtn', from: 10.0, to: 11.6, pad: 4 }, { el: 'copyBtn', from: 10.4, to: 11.6, pad: 4 }],
    },
    // Schritt 8 – Danach
    {
      id: 'kontoDone', scene: '12a-konto-done', from: 73, to: 76.4,
      camera: [{ at: 0, el: 'section', zoom: 1.12 }],
      highlights: [{ el: 'section', from: 0.4, to: 3.0, pad: 3 }],
    },
    {
      id: 'planned', scene: '12-planned', from: 76.4, to: 80.2,
      camera: [{ at: 0, el: 'card', zoom: 1.02, dy: -30 }],
      highlights: [{ el: 'label', from: 0.4, to: 2.0, pad: 5 }, { el: 'badge', from: 1.8, to: 3.6, pad: 5 }],
    },
    {
      id: 'ghost', scene: '13-ghost', from: 80.2, to: 83.6,
      camera: [{ at: 0, el: 'ghost', zoom: 1.1, dy: 20 }],
      highlights: [{ el: 'ghost', from: 0.4, to: 3.1, pad: 3 }],
    },
    {
      id: 'reopen', scene: '14-reopen', from: 83.6, to: 87.2,
      camera: [{ at: 0, el: 'ylBtn', zoom: 1.1, dy: -140 }],
      highlights: [{ el: 'ylBtn', from: 0.4, to: 2.4, pad: 4 }, { el: 'removeBtn', from: 1.8, to: 3.4, pad: 4 }],
    },
  ],
  captions: [
    { from: 3, to: 9, title: 'Heimspiel im Kalender', accent: 'Lupe antippen', sub: '„Neue Ansetzung suchen“ – direkt am Spiel' },
    { from: 9, to: 14, title: 'Wochentage', accent: 'sind vorausgewählt', sub: 'Spieltag plus eure Trainingstage' },
    { from: 14, to: 19, title: 'Uhrzeit je Tag', accent: 'anpassen – Suchen', sub: 'Gesucht wird bis 6 Wochen nach dem Spiel' },
    { from: 19, to: 23.8, title: 'Freie Termine', accent: 'mit Hälfte und Anstoß', sub: 'Eure Trainingszeit zählt als frei' },
    { from: 23.8, to: 27, title: 'Auch am selben Tag', accent: 'zu anderer Zeit', sub: 'Falls nur die Anstoßzeit wandern muss' },
    { from: 27, to: 33.2, title: 'Mehrere Termine', accent: 'anhaken', sub: 'Der Gegner sucht sich einen aus' },
    { from: 33.2, to: 39, title: 'Per WhatsApp', accent: 'an den Gegner', sub: 'Platzcoach merkt sich die Anfrage' },
    { from: 39, to: 42.6, title: 'Konto →', accent: 'Terminanfragen', sub: 'Alles, was du schon angefragt hast' },
    { from: 42.6, to: 46.6, title: 'Offene Anfrage', accent: 'mit aktuellem Stand', sub: '„✓ frei“ – blockiert noch keinen Platz' },
    { from: 46.6, to: 50, title: 'Gegner sagt zu?', accent: '„Zugesagt“ antippen', sub: 'Datum und Anstoß sind vorbefüllt' },
    { from: 50, to: 55.4, title: 'Anstoß prüfen', accent: 'Heimrecht getauscht?', sub: 'Dann wird es ein Auswärtsspiel' },
    { from: 55.4, to: 61, title: 'Grund wählen,', accent: 'Training absagen', sub: 'Platz wird geprüft – dann „Vormerken“' },
    { from: 61, to: 64.6, title: 'Vorgemerkt.', accent: 'Jetzt der Jugendleiter', sub: 'Er stellt den Antrag im DFBnet' },
    { from: 64.6, to: 73, title: 'Fertiger Text', accent: 'für den DFBnet-Antrag', sub: 'Per WhatsApp senden oder kopieren' },
    { from: 73, to: 76.4, title: 'Anfrage erledigt', accent: 'ganz von selbst', sub: 'Nach dem Vormerken nicht mehr offen' },
    { from: 76.4, to: 80.2, title: 'Neuer Termin:', accent: '„Vorgemerkt“', sub: 'Bis fussball.de die Verlegung übernimmt' },
    { from: 80.2, to: 83.6, title: 'Alter Termin:', accent: '„Verlegt auf …“', sub: 'Alle sehen sofort Bescheid' },
    { from: 83.6, to: 87, title: 'Nachricht vergessen?', accent: 'Kalender-Symbol', sub: 'Am Spiel – Text jederzeit erneut senden' },
  ],
  messages: [
    { from: 33.4, to: 38.8, textKey: 'anfrageGegner', label: 'Anfrage an den Gegner', fontSize: 30 },
    { from: 64.8, to: 68.9, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (1/2)', range: [0, 14], fontSize: 31 },
    { from: 69.0, to: 72.9, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (2/2)', range: [14, 40], fontSize: 31 },
  ],
  summary: {
    from: 87.2,
    title: 'Kurz gesagt',
    items: [
      'Lupe am Heimspiel antippen',
      'Tage und Uhrzeiten prüfen, suchen',
      'Freie Termine ansehen',
      'Vorschläge per WhatsApp an den Gegner',
      'Konto → Terminanfragen: „Zugesagt“',
      'Vormerken, Training absagen',
      'Text an den Jugendleiter senden',
      'Fertig – alle sehen den neuen Termin',
    ],
  },
  narration: [
    { from: 0.3, to: 2.8, text: 'Spiel verlegen? So geht’s in Platzcoach – in acht Schritten.' },
    { from: 3.1, to: 8.8, text: 'Schritt eins: Im Kalender das Heimspiel öffnen und auf die Lupe tippen.' },
    { from: 9.2, to: 18.8, text: 'Schritt zwei: Platzcoach wählt den Spieltag und eure Trainingstage schon vor. Passe bei Bedarf die Uhrzeit pro Tag an und tipp auf Suchen.' },
    { from: 19.2, to: 26.8, text: 'Schritt drei: Du siehst alle freien Termine mit Platzhälfte und Anstoßzeit – auch in eurer eigenen Trainingszeit.' },
    { from: 27.2, to: 38.6, text: 'Schritt vier: Hake die Termine an, die für euch passen, und schick sie per WhatsApp an den Gegner. Platzcoach merkt sich die Anfrage.' },
    { from: 39.2, to: 49.6, text: 'Schritt fünf: Unter Konto, Terminanfragen, siehst du alle offenen Anfragen. Sagt der Gegner zu, tippst du beim passenden Termin auf Zugesagt.' },
    { from: 50.2, to: 60.8, text: 'Schritt sechs: Datum und Anstoß sind schon eingetragen. Heimrecht getauscht? Dann hier anhaken. Grund wählen – Platzcoach prüft den Platz und sagt euer Training gleich mit ab.' },
    { from: 61.2, to: 72.8, text: 'Schritt sieben: Jetzt liegt der fertige Text für den Jugendleiter bereit – mit allen Angaben für den Verlegungsantrag im DFBnet. Per WhatsApp senden oder kopieren.' },
    { from: 73.2, to: 86.8, text: 'Schritt acht: Die Anfrage ist damit erledigt. Im Kalender steht das Spiel am neuen Tag als vorgemerkt, am alten Termin: verlegt auf. Den Text kannst du über das Kalender-Symbol jederzeit erneut senden.' },
    { from: 87.4, to: 94.6, text: 'Kurz gesagt: suchen, Gegner fragen, Zusage übernehmen, vormerken, Jugendleiter informieren – fertig.' },
    { from: 95.4, to: 99.2, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],

  claims: [
    'Lupe „Neue Ansetzung suchen“ am Heimspiel (openRescheduleFinder), Spieltag + Trainingstage vorausgewählt, Uhrzeit je Wochentag',
    'Suche bis 6 Wochen nach dem Spiel, eigene Trainingszeit zählt als frei, E/F/G eine Hälfte, gleicher Tag mit anderer Anstoßzeit',
    'Mehrere Termine anhaken → WhatsApp-Vorschlag an den Gegner (shareRescheduleProposal), wird als offene Terminanfrage gemerkt (saveMoveRequest, 13.10.2026 · 1)',
    'Konto → Terminanfragen: Optionen mit aktuellem Platzstatus, „Zugesagt“ öffnet den vorbefüllten Vormerk-Dialog, Erneut teilen / Absage – löschen; erledigt sich nach dem Vormerken (moveRequestDone)',
    'Vormerken mit Anstoß, „Heimrecht getauscht“ (12.10.2026), Grund-Chips, Platzprüfung, Training absagen',
    'Jugendleiter-Nachricht für den DFBnet-Spielverlegungsantrag, per WhatsApp oder Kopieren',
    'Kalender: neuer Termin „Vorgemerkt“, alter Termin „Verlegt auf …“, erneut über Kalender-Symbol („Nachricht an Jugendleiter (DFBnet)“)',
  ],
};

export default reel;
