// Gemeinsame Gestaltung aller Reels: Format, Marke, sichere Zonen, Handy-Karte, Cursor, Endkarte.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const PREVIEW_S = 7; // Länge der Einstiegsvorschauen

export const brand = {
  navy: '#011B32',
  navy2: '#0B2B47',
  green: '#6BB41C',
  lime: '#8BCF2F',
  bg: '#F8FAF7',
  warn: '#C0392B',
  white: '#FFFFFF',
  inkSoft: '#9FB0C0',
  logoOnDark: 'brand/logo-white.svg',
  logoOnLight: 'brand/logo-horizontal.svg',
};

// Sichere Zone für Instagram/WhatsApp (oben Profil/Schließen, unten Bedienelemente/Beschreibung).
export const safe = { top: 220, bottom: 400, side: 70 };
// „Handy-Karte“ mit dem echten App-Screenshot.
export const card = { x: 110, y: 560, w: 860, h: 940, radius: 44 };
export const hookSection = { from: 0, to: 3 };
export const endCardLen = 5; // Sekunden am Ende
export const endCard = { cta: 'Jetzt ansehen:', url: 'platzcoach.de' };

// Cursor (Zeigefinger-Pfeil) – Bewegungsdauer vor einem Tipp.
export const cursor = { moveS: 0.7, pressS: 0.18, size: 64 };

export const subtitles = {
  // Stumme Fassung: Überschriften tragen die Aussage. Mit Sprachaufnahme auf true (Zeiten aus Audioausrichtung).
  burnIn: false,
  bottomY: HEIGHT - safe.bottom + 10,
};
