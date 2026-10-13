// Inhalt des Vorstellungsfilms für den DFB (16:9, ≈ 111 s). Zeiten = Konfiguration; nach einer Sprachaufnahme
// `warp` ([Konfiguration, Film]) und `audio` setzen, wie bei den Reels.
// Fakten zu den Spielformen: dfb.de „Kinderfußball: Irrtümer“ (verbindlich ab der Saison 2024/2025;
// G: 2 gegen 2 / 3 gegen 3 auf vier Minitore, F: 3 gegen 3 bis 5 gegen 5, E: 5 gegen 5 oder 7 gegen 7; Festivals mit mehreren Partien).
import type { Shot } from '../config/types';

export type PShot = Shot & { reel: string };
export type Seg = {
  id: string; from: number; to: number;
  kicker?: string; title?: string; accent?: string; sub?: string; note?: string; size?: number; center?: boolean;
  points?: { tag: string; text: string; at?: number }[];
  chat?: { src: string; ratio: number; cam: [number, number, number][]; cx?: number }; // cam: [Sekunde im Abschnitt, Zoom, Mittelpunkt y 0–1]
  shots?: PShot[];
  kids?: boolean;
  end?: { title: string; sub: string; name: string; url: string };
};

export const pitch: {
  durationS: number; segments: Seg[]; narration: { from: number; to: number; text: string }[];
  warp?: [number, number][]; audio?: { voiceover?: { src: string; volume: number } }; claims: string[];
} = {
  durationS: 111,
  segments: [
    {
      id: 'hook', from: 0, to: 6,
      kicker: 'Aus dem Vereinsalltag', title: 'So plant ein Amateurverein', accent: 'heute seinen Platz.', sub: 'Per WhatsApp.',
      chat: { src: 'pitch/chat-vereinsheim.jpg', ratio: 352 / 1206, cam: [[0, 1.45, 0.5]], cx: 0.448 },
    },
    {
      id: 'chat', from: 6, to: 15,
      kicker: 'Das Problem', title: '„Trainiert am Freitag', accent: 'eine Jugend?“',
      sub: 'Vielleicht. Erst ab nächster Woche. Daumen hoch. – Und wer hat jetzt den Platz?',
      chat: { src: 'pitch/chat-freitag.jpg', ratio: 1999 / 1206, cam: [[0, 1.0, 0.5]] },
    },
    {
      id: 'plan', from: 15, to: 24,
      kicker: 'Das Problem', title: '„Ist dieser Plan', accent: 'jetzt bindend?“',
      sub: 'Der Aushang am Brett – und schon wieder geändert.',
      note: 'Echte Nachrichten aus dem Pilotverein SV Bachum/Bergheim · Namen und Profilbilder unkenntlich gemacht',
      chat: { src: 'pitch/chat-plan.jpg', ratio: 1094 / 1206, cam: [[0, 1.0, 0.5], [2.6, 1.0, 0.5], [4.4, 1.4, 0.42], [8.5, 1.4, 0.42]], cx: 0.48 },
    },
    {
      id: 'statement', from: 24, to: 31, center: true, size: 92,
      title: 'Trainer organisieren den Platz –', accent: 'statt sich um die Kinder zu kümmern.',
    },
    {
      id: 'kids', from: 31, to: 50, kids: true, size: 64,
      kicker: 'Kinderfußball · verbindlich seit 2024/25', title: 'Neue Spielformen:', accent: 'mehr Felder, mehr Teams.',
      points: [
        { tag: 'G', text: '2 gegen 2 oder 3 gegen 3 auf vier Minitore', at: 4.0 },
        { tag: 'F', text: '3 gegen 3 bis 5 gegen 5', at: 5.2 },
        { tag: 'E', text: '5 gegen 5 oder 7 gegen 7', at: 6.4 },
        { tag: '⚑', text: 'Spieltage als Festival auf mehreren Feldern', at: 8.0 },
      ],
      sub: 'Gut für die Kinder – aber auf demselben Platz mehr Teams, kleinere Flächen und mehr Absprachen.',
      note: 'Quelle: dfb.de – Kinderfußball',
    },
    {
      id: 'live', from: 50, to: 60,
      kicker: 'Die Lösung', title: 'Platzcoach:', accent: 'ein Stand für alle.',
      sub: 'Wer ist wann auf welchem Viertel – live. Hier G1 und F2 nebeneinander, danach die D1.',
      shots: [{
        reel: 'platzbelegung', id: 'live', scene: '01-start', from: 50, to: 60,
        camera: [{ at: 0, el: 'platzSection', zoom: 1.0 }, { at: 2.0, el: 'livePitch', zoom: 1.35, dy: 20 }, { at: 6.5, el: 'livePitch', zoom: 1.2, dy: 120 }],
        highlights: [{ el: 'statusPill', from: 2.6, to: 4.4, pad: 4 }, { el: 'livePitch', from: 4.4, to: 6.6, pad: 4 }],
      }],
    },
    {
      id: 'conflict', from: 60, to: 69.5,
      kicker: 'Automatisch geprüft', title: 'Belegt? Platzcoach', accent: 'zeigt, was frei ist.',
      sub: 'Ein Tipp auf „Hälfte B buchen“ – der Konflikt ist gelöst, bevor er entsteht.',
      shots: [
        {
          reel: 'platzbelegung', id: 'conflict', scene: '03-conflict', from: 60, to: 65.5,
          camera: [{ at: 0, el: 'timeline', zoom: 1.2, dy: 40 }, { at: 2.4, el: 'suggestionBox', zoom: 1.3, dy: -40 }],
          highlights: [{ el: 'timeline', from: 0.5, to: 2.4, pad: 4 }, { el: 'suggestionBox', from: 2.6, to: 5.0, pad: 4 }],
          taps: [{ el: 'suggestion', at: 4.8 }],
        },
        {
          reel: 'platzbelegung', id: 'ok', scene: '04-ok', from: 65.5, to: 69.5,
          camera: [{ at: 0, el: 'timeline', zoom: 1.25, dy: 40 }],
          highlights: [{ el: 'status', from: 0.6, to: 3.6, pad: 6 }],
        },
      ],
    },
    {
      id: 'auto', from: 69.5, to: 78,
      kicker: 'Läuft von selbst', title: 'Spiele kommen automatisch', accent: 'von fussball.de.',
      sub: 'Heimspiele belegen ihre Fläche selbst. Verlegungen werden übernommen.',
      shots: [
        {
          reel: 'fussballde', id: 'games', scene: '04-games', from: 69.5, to: 72.6,
          camera: [{ at: 0, el: 'home', zoom: 1.15 }],
          highlights: [{ el: 'home', from: 0.4, to: 2.8, pad: 3 }],
        },
        {
          reel: 'fussballde', id: 'pitch', scene: '05-pitch', from: 72.6, to: 75.3,
          camera: [{ at: 0, el: 'livePitch', zoom: 1.3 }],
          highlights: [{ el: 'gameTile', from: 0.4, to: 2.5, pad: 10 }],
        },
        {
          reel: 'fussballde', id: 'moved', scene: '06-moved', from: 75.3, to: 78,
          camera: [{ at: 0, el: 'card', zoom: 1.12 }],
          highlights: [{ el: 'badge', from: 0.4, to: 2.6, pad: 6 }],
        },
      ],
    },
    {
      id: 'dfbnet', from: 78, to: 94,
      kicker: 'Sonderfälle mit Standard', title: 'Verlegung, Freundschaftsspiel:', accent: 'fertig für das DFBnet.',
      sub: 'Freie Termine finden, den Gegner anfragen – und der Jugendleiter bekommt jedes Mal denselben Text mit allen Angaben.',
      shots: [
        {
          reel: 'anleitung-spielverlegung', id: 'results', scene: '04-results', from: 78, to: 83,
          camera: [{ at: 0, el: 'headline', zoom: 1.15, dy: 140 }, { at: 1.8, el: 'rowFr', zoom: 1.3 }],
          highlights: [{ el: 'rowMi', from: 0.6, to: 2.0, pad: 3 }, { el: 'infoFr', from: 2.2, to: 4.6, pad: 4 }],
        },
        {
          reel: 'anleitung-spielverlegung', id: 'share', scene: '06-share', from: 83, to: 86.5,
          camera: [{ at: 0, el: 'waBtn', zoom: 1.2, dy: -110 }],
          highlights: [{ el: 'waBtn', from: 0.4, to: 2.4, pad: 4 }],
          taps: [{ el: 'waBtn', at: 2.4 }],
        },
        {
          reel: 'anleitung-spielverlegung', id: 'youthleader', scene: '11-youthleader', from: 86.5, to: 94,
          camera: [{ at: 0, el: 'title', zoom: 1.2, dy: 200 }, { at: 2.6, el: 'textBox', zoom: 1.32, dy: -60 }, { at: 6.2, el: 'textBox', zoom: 1.32, dy: 60 }],
          highlights: [{ el: 'title', from: 0.3, to: 2.2, pad: 4 }],
        },
      ],
    },
    {
      id: 'close', from: 94, to: 103.5, center: true, size: 92,
      title: 'Trainer kümmern sich um die Kinder.', accent: 'Platzcoach um den Platz.',
      sub: 'Im Pilotbetrieb beim SV Bachum/Bergheim.',
    },
    {
      id: 'end', from: 103.5, to: 111,
      end: { title: 'Lass uns 30 Minuten sprechen.', sub: 'Live-Demo am echten Vereinsplan.', name: 'Fabrizio Calcagno', url: 'platzcoach.de' },
    },
  ],
  narration: [
    { from: 0.3, to: 5.6, text: 'So plant ein Amateurverein heute seinen Platz: per WhatsApp.' },
    { from: 6.2, to: 14.6, text: 'Trainiert Freitag eine Jugend? Vielleicht. Erst ab nächster Woche. Daumen hoch. Und wer hat jetzt den Platz?' },
    { from: 15.2, to: 23.6, text: 'Der Plan hängt am Brett – und ist schon wieder geändert. Das sind echte Nachrichten aus unserem Pilotverein.' },
    { from: 24.2, to: 30.6, text: 'Trainerinnen und Trainer organisieren den Platz – statt sich um die Kinder zu kümmern.' },
    { from: 31.2, to: 49.6, text: 'Und es wird nicht einfacher: Mit den neuen Spielformen im Kinderfußball spielen G-, F- und E-Jugend auf mehreren kleinen Feldern gleichzeitig. Gut für die Kinder – aber auf demselben Platz heißt das: mehr Teams, kleinere Flächen und mehr Absprachen.' },
    { from: 50.2, to: 59.6, text: 'Platzcoach macht daraus einen gemeinsamen Stand: Wer ist wann auf welchem Viertel – live und für alle sichtbar.' },
    { from: 60.2, to: 69.1, text: 'Will eine Mannschaft auf eine belegte Fläche, zeigt Platzcoach sofort, was stattdessen frei ist. Ein Tipp – fertig.' },
    { from: 69.7, to: 77.6, text: 'Spiele kommen automatisch von fussball.de. Heimspiele belegen ihre Fläche selbst, Verlegungen werden übernommen.' },
    { from: 78.2, to: 93.6, text: 'Und bei Sonderfällen wie Verlegungen oder Freundschaftsspielen findet Platzcoach freie Termine, fragt den Gegner an und gibt dem Jugendleiter jedes Mal denselben Text mit allen Angaben fürs DFBnet.' },
    { from: 94.2, to: 103.1, text: 'Damit sich Trainer um die Kinder kümmern können – und Platzcoach um den Platz. Im Pilotbetrieb beim SV Bachum/Bergheim.' },
    { from: 103.7, to: 110.5, text: 'Lass uns dreißig Minuten sprechen – mit einer Live-Demo am echten Vereinsplan.' },
  ],
  claims: [
    'WhatsApp-Bilder: echte Nachrichten aus dem Pilotverein (vom Nutzer bereitgestellt), Namen durch Rollen ersetzt, Profilbilder neutralisiert',
    'Spielformen laut dfb.de „Kinderfußball: Irrtümer“: verbindlich ab 2024/2025, G 2:2/3:3 auf vier Minitore, F 3:3–5:5, E 5:5 oder 7:7, Festival mit mehreren Partien',
    'Live-Platz mit Vierteln (Start „Teilweise belegt · 2 von 4 Vierteln frei“, G1 und F2 je auf einem Viertel)',
    'Konfliktprüfung mit Vorschlag „Hälfte B buchen“ (platzbelegung 03/04)',
    'fussball.de-Spiele automatisch im Kalender, Heimspiel belegt Fläche, „verlegt vom …“ (fussballde 04–06)',
    'Freie Termine, WhatsApp-Vorschläge an den Gegner, Jugendleiter-Text für das DFBnet aus derselben Vorlage (anleitung-spielverlegung)',
    'Pilotbetrieb beim SV Bachum/Bergheim (Freigabe Vereinsname durch den Nutzer am 13.10.2026)',
  ],
};
