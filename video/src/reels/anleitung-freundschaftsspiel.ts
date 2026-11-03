// Anleitung: Freundschaftsspiel anlegen – vom freien Termin bis zur Nachricht an den Jugendleiter (≈ 96 s, 7 Schritte).
// Stimme: CapCut-Aufnahme vom 13.10.2026, Bilder per `warp` an die Sprechzeiten angepasst.
import type { Reel } from '../config/types';

const reel: Reel = {
  id: 'anleitung-freundschaftsspiel',
  title: 'Anleitung: Freundschaftsspiel anlegen',
  audience: 'Trainer (Erklärvideo)',
  durationS: 96,
  cameraFit: true,
  // An die Stimme angepasst: Abschnitt beginnt 0,3 s vor dem Satz. [Konfiguration, Film]
  warp: [[0,0],[3,6.23],[13,15.14],[19.5,25.7],[26,30.55],[37,41.4],[40.6,46.6],[47,53.26],[53.5,62.6],[59,66.47],[71,78.15],[77,84.45],[83.2,90.23],[91,100.7],[96,105.07]],
  audio: { voiceover: { src: 'audio/anleitung-freundschaftsspiel-stimme.wav', volume: 1 } },
  hooks: {
    anleitung: { label: 'Freundschaftsspiel anlegen – so geht’s in Platzcoach.', lines: ['Freundschaftsspiel', 'anlegen? So geht’s', 'in 7 Schritten.'], accent: 'in 7 Schritten.' },
  },
  mainHook: 'anleitung',
  steps: [
    { from: 3, to: 13, n: 1, label: 'Spiel anlegen' },
    { from: 13, to: 26, n: 2, label: 'Freien Termin suchen' },
    { from: 26, to: 37, n: 3, label: 'Gegner fragen' },
    { from: 37, to: 47, n: 4, label: 'Zusage übernehmen' },
    { from: 47, to: 59, n: 5, label: 'Prüfen und speichern' },
    { from: 59, to: 71, n: 6, label: 'Jugendleiter informieren' },
    { from: 71, to: 83, n: 7, label: 'Danach' },
  ],
  shots: [
    // Schritt 1 – Spiel anlegen
    {
      id: 'form', scene: '01-form', from: 2.6, to: 13,
      camera: [{ at: 0, el: 'kindChip', zoom: 1.0, dy: 200 }, { at: 3.0, el: 'opponent', zoom: 1.15, dy: -20 }, { at: 6.6, el: 'team', zoom: 1.15, dy: 30 }],
      highlights: [
        { el: 'kindChip', from: 0.8, to: 2.4, pad: 4 },
        { el: 'homeAway', from: 2.6, to: 4.4, pad: 3 },
        { el: 'opponent', from: 4.0, to: 6.0, pad: 3 },
        { el: 'team', from: 5.8, to: 7.4, pad: 3 },
        { el: 'finder', from: 7.6, to: 10.2, pad: 5 },
      ],
      taps: [{ el: 'kindChip', at: 0.9 }, { el: 'finder', at: 9.8 }],
    },
    // Schritt 2 – Freien Termin suchen
    {
      id: 'criteria', scene: '02-criteria', from: 13, to: 19.5,
      camera: [{ at: 0, el: 'what', zoom: 1.15, dy: 80 }, { at: 2.4, el: 'days', zoom: 1.15, dy: 60 }],
      highlights: [
        { el: 'what', from: 0.4, to: 2.2, pad: 4 },
        { el: 'months', from: 2.4, to: 3.6, pad: 4 },
        { el: 'days', from: 3.2, to: 4.6, pad: 4 },
        { el: 'durs', from: 4.0, to: 5.4, pad: 4 },
        { el: 'start', from: 4.8, to: 6.4, pad: 4 },
      ],
    },
    {
      id: 'results', scene: '03-results', from: 19.5, to: 26,
      camera: [{ at: 0, el: 'summary', zoom: 1.12, dy: 160 }, { at: 3.0, el: 'nov', zoom: 1.15, dy: 40 }],
      highlights: [
        { el: 'summary', from: 0.3, to: 2.0, pad: 4 },
        { el: 'okt', from: 2.2, to: 4.6, pad: 4 },
        { el: 'nov', from: 2.2, to: 4.6, pad: 4 },
        { el: 'legend', from: 3.6, to: 6.4, pad: 6 },
      ],
    },
    // Schritt 3 – Gegner fragen
    {
      id: 'checked', scene: '04-checked', from: 26, to: 37,
      camera: [{ at: 0, el: 'row1', zoom: 1.15, dy: 40 }, { at: 2.6, el: 'row1', zoom: 1.15, dy: 40 }, { at: 3.4, el: 'waBtn', zoom: 1.12, dy: -90 }],
      highlights: [{ el: 'row1', from: 0.6, to: 2.8, pad: 3 }, { el: 'row2', from: 1.3, to: 2.8, pad: 3 }, { el: 'waBtn', from: 3.0, to: 5.4, pad: 4 }],
      taps: [{ el: 'row1', at: 0.6, dx: -140 }, { el: 'row2', at: 1.3, dx: -140 }, { el: 'waBtn', at: 5.2 }],
    },
    // Schritt 4 – Zusage übernehmen (Konto → Terminanfragen)
    {
      id: 'konto', scene: '05-konto', from: 37, to: 40.6,
      camera: [{ at: 0, el: 'section', zoom: 1.0, dy: 40 }, { at: 1.6, el: 'section', zoom: 1.12 }],
      highlights: [{ el: 'section', from: 0.6, to: 3.0, pad: 3 }],
      taps: [{ el: 'section', at: 3.0, dx: 60 }],
    },
    {
      id: 'request', scene: '06-request', from: 40.6, to: 47,
      camera: [{ at: 0, el: 'card', zoom: 1.12 }, { at: 3.2, el: 'opt2', zoom: 1.25, dy: 20 }],
      highlights: [
        { el: 'head', from: 0.3, to: 1.5, pad: 3 },
        { el: 'opt1', from: 1.4, to: 3.0, pad: 3 },
        { el: 'opt2', from: 1.7, to: 3.0, pad: 3 },
        { el: 'yes2', from: 3.8, to: 6.0, pad: 5 },
      ],
      taps: [{ el: 'yes2', at: 6.0 }],
    },
    // Schritt 5 – Prüfen und speichern
    {
      id: 'taken', scene: '07-taken', from: 47, to: 53.5,
      camera: [{ at: 0, el: 'card', zoom: 1.1, dy: 40 }, { at: 3.4, el: 'trainingNote', zoom: 1.12, dy: -90 }],
      highlights: [
        { el: 'date', from: 0.3, to: 1.8, pad: 3 },
        { el: 'kickoff', from: 1.0, to: 2.4, pad: 3 },
        { el: 'kickInfo', from: 1.8, to: 3.4, pad: 3 },
        { el: 'trainingNote', from: 3.8, to: 5.8, pad: 5 },
      ],
      taps: [{ el: 'save', at: 6.0 }],
    },
    {
      // Kamera bewusst unterhalb der Zeile „Was“ (zeigt den Gegner derzeit doppelt – App-Befund, nicht im Bild).
      id: 'review', scene: '08-review', from: 53.5, to: 59,
      camera: [{ at: 0, x: 242, y: 600, zoom: 1.4 }, { at: 1.8, x: 242, y: 600, zoom: 1.4 }, { at: 2.6, x: 160, y: 600, zoom: 1.4 }],
      highlights: [
        { el: 'rowWann', from: 0.3, to: 1.8, pad: 3 },
        { el: 'rowPlatz', from: 1.2, to: 2.4, pad: 4 },
        { el: 'training', from: 2.6, to: 4.4, pad: 2 },
      ],
      taps: [{ el: 'confirm', at: 4.8 }],
    },
    // Schritt 6 – Jugendleiter informieren
    {
      id: 'youthleader', scene: '09-youthleader', from: 59, to: 71,
      camera: [{ at: 0, el: 'title', zoom: 1.15, dy: 200 }],
      highlights: [{ el: 'title', from: 0.3, to: 2.0, pad: 4 }, { el: 'sub', from: 1.4, to: 3.4, pad: 4 }, { el: 'waBtn', from: 10.0, to: 11.6, pad: 4 }, { el: 'copyBtn', from: 10.4, to: 11.6, pad: 4 }],
    },
    // Schritt 7 – Danach
    {
      id: 'planned', scene: '10-planned', from: 71, to: 77,
      camera: [{ at: 0, el: 'card', zoom: 1.02, dy: -30 }],
      highlights: [{ el: 'status', from: 0.5, to: 3.4, pad: 5 }, { el: 'ylBtn', from: 3.4, to: 5.8, pad: 4 }],
    },
    {
      id: 'away', scene: '11-away', from: 77, to: 83.2,
      camera: [{ at: 0, el: 'homeAway', zoom: 1.12, dy: 100 }],
      highlights: [{ el: 'homeAway', from: 0.4, to: 2.2, pad: 3 }, { el: 'awayHelp', from: 2.2, to: 5.8, pad: 4 }],
      taps: [{ el: 'homeAway', at: 0.7, dx: 90 }],
    },
  ],
  captions: [
    { from: 3, to: 8, title: 'Neu →', accent: 'Spiel', sub: 'Heim ist vorausgewählt' },
    { from: 8, to: 13, title: 'Gegner eintragen,', accent: 'Freien Termin suchen', sub: 'Deine Mannschaft ist schon gewählt' },
    { from: 13, to: 19.5, title: 'Was du brauchst', accent: 'ist vorgewählt', sub: 'Monate, Tage, Dauer, Wunsch-Beginn' },
    { from: 19.5, to: 26, title: 'Grün = frei', accent: 'zur Wunschzeit', sub: 'Gelb: zu einer anderen Uhrzeit' },
    { from: 26, to: 31.6, title: 'Passende Termine', accent: 'anhaken', sub: 'Der Gegner sucht sich einen aus' },
    { from: 31.6, to: 37, title: 'Per WhatsApp', accent: 'an den Gegner', sub: 'Blockiert noch keinen Platz' },
    { from: 37, to: 40.6, title: 'Konto →', accent: 'Terminanfragen', sub: 'Deine offenen Anfragen' },
    { from: 40.6, to: 47, title: 'Gegner sagt zu?', accent: '„Zugesagt“ antippen', sub: 'Mit aktuellem Platzstatus' },
    { from: 47, to: 53.5, title: 'Datum und Anstoß', accent: 'sind eingetragen', sub: 'Platz geprüft: frei' },
    { from: 53.5, to: 59, title: 'Training absagen?', accent: 'Ein Haken', sub: 'Dann „Jetzt speichern“' },
    { from: 59, to: 71, title: 'Fertiger Text', accent: 'für den Jugendleiter', sub: 'Zum Ansetzen im DFBnet' },
    { from: 71, to: 77, title: 'Im Kalender:', accent: '„Vorgemerkt“', sub: 'Bis es bei fussball.de steht' },
    { from: 77, to: 83, title: 'Tipp: Auswärts', accent: 'belegt keinen Platz', sub: 'Ansetzung macht der Gastgeber' },
  ],
  messages: [
    { from: 31.8, to: 36.8, textKey: 'anfrageGegner', label: 'Anfrage an den Gegner', fontSize: 30 },
    { from: 62.6, to: 66.8, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (1/2)', range: [0, 14], fontSize: 31 },
    { from: 66.9, to: 70.9, textKey: 'jugendleiter', label: 'Nachricht an den Jugendleiter (2/2)', range: [14, 40], fontSize: 31 },
  ],
  summary: {
    from: 83.2,
    title: 'Kurz gesagt',
    items: [
      'Neu → Spiel, Gegner eintragen',
      'Freien Termin suchen',
      'Termine anhaken, per WhatsApp an den Gegner',
      'Konto → Terminanfragen: „Zugesagt“',
      'Prüfen, Training absagen, speichern',
      'Text an den Jugendleiter senden',
      'Fertig – im Kalender „Vorgemerkt“',
    ],
  },
  // Zeiten = echte Sprechzeiten der CapCut-Aufnahme vom 13.10.2026 (Filmzeit, aus den Pausen ermittelt).
  narration: [
    { from: 0.42, to: 6.14, text: 'Freundschaftsspiel anlegen? So geht’s in Platzcoach – in sieben Schritten.' },
    { from: 6.53, to: 14.67, text: 'Schritt eins: Tippe auf Neu und wähle Spiel. Heim ist schon ausgewählt. Trag den Gegner ein, wähle deine Mannschaft und tippe auf Freien Termin suchen.' },
    { from: 15.44, to: 30.14, text: 'Schritt zwei: Was du brauchst, ist schon vorgewählt – für die E-Jugend eine Platzhälfte. Wähle Monate, Wochentage, Dauer und Wunsch-Beginn. Grün heißt: zur Wunschzeit frei, gelb: zu einer anderen Uhrzeit.' },
    { from: 30.85, to: 41.07, text: 'Schritt drei: Hake die Termine an, die für euch passen, und schick sie per WhatsApp an den Gegner. Das blockiert noch keinen Platz – Platzcoach merkt sich die Anfrage.' },
    { from: 41.7, to: 52.78, text: 'Schritt vier: Sagt der Gegner zu, öffnest du Konto, Terminanfragen. Dort steht jeder Termin mit aktuellem Platzstatus. Tippe beim passenden Termin auf Zugesagt.' },
    { from: 53.56, to: 66.09, text: 'Schritt fünf: Datum und Anstoß sind schon eingetragen, der Platz ist geprüft. Auf Wunsch sagt Platzcoach euer Training an dem Tag gleich mit ab. Termin speichern, kurz prüfen, fertig.' },
    { from: 66.77, to: 77.91, text: 'Schritt sechs: Jetzt liegt der fertige Text für den Jugendleiter bereit – mit allen Angaben, um das Spiel im DFBnet anzusetzen. Per WhatsApp senden oder kopieren.' },
    { from: 78.45, to: 89.85, text: 'Schritt sieben: Im Kalender steht das Spiel als vorgemerkt, bis es bei fussball.de auftaucht. Und auswärts? Dann belegt das Spiel bei euch keinen Platz – die Ansetzung macht der Gastgeber.' },
    { from: 90.53, to: 100.39, text: 'Kurz gesagt: Spiel anlegen, freien Termin suchen, Gegner fragen, Zusage übernehmen, speichern, Jugendleiter informieren – fertig.' },
    { from: 101.0, to: 104.77, text: 'Platzcoach. Jetzt ansehen auf platzcoach.de.' },
  ],
  claims: [
    'Neu → Art „Spiel“, Heim/Auswärts (Heim vorausgewählt), Gegner, Mannschaft (eigene vorausgewählt), „Freien Termin suchen“',
    'Freien Termin finden: Bedarf vorgewählt (E2 → Hälfte), Monate, Wochentage, Dauer, Wunsch-Beginn; Monatsraster grün/gelb/grau',
    'Freie Termine anhaken → „Vorschläge per WhatsApp teilen“, gespeichert als offene Terminanfrage, blockiert keinen Platz (12./13.10.2026)',
    'Konto → Terminanfragen: Optionen mit „✓ frei“, „Zugesagt“ füllt das Formular vor (Datum, Anstoß 16:45, Platz 16:30–18:30 geprüft)',
    'Termin prüfen: Training E2 an dem Tag absagen (Haken), „Jetzt speichern“; Demo-Commits: Termin angelegt, Training abgesagt, Anfrage automatisch erledigt',
    'Nach dem Speichern: Text für den Jugendleiter zur Ansetzung im DFBnet, per WhatsApp senden oder kopieren',
    'Kalender: „Vorgemerkt · noch nicht bei fussball.de“, Nachricht an den Jugendleiter erneut über die Karte; Auswärts: belegt keinen Platz, Ansetzung macht der Gastgeber',
  ],
};

export default reel;
