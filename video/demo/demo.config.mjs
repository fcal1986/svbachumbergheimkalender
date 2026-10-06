// Zentrale Konstanten der Demo-Umgebung. Alles hier ist erfunden.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VIDEO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(VIDEO_DIR, '..');
// Laufzeitordner der Demo (gitignored). Seed/Reset schreiben NUR hierhin.
export const RUNTIME_DIR = path.join(VIDEO_DIR, '.demo-runtime');
export const RUNTIME_DATA = path.join(RUNTIME_DIR, 'data');
export const MARKER_FILE = '.platzcoach-demo';

// Fiktives Repo: Der Mock beantwortet nur dieses Repo. Echte Repos werden abgelehnt.
export const DEMO_REPO = 'demo/platzcoach-demo';
export const DEMO_BRANCH = 'main';
// Kein echter Schlüssel – nur ein Erkennungswert für den lokalen Mock.
export const DEMO_TOKEN = 'platzcoach-demo-token-kein-geheimnis';

export const DEMO_PORT = Number(process.env.PLATZCOACH_DEMO_PORT || 4377);
export const DEMO_ORIGIN = `http://127.0.0.1:${DEMO_PORT}`;
// Adresse, unter der die App im Aufnahme-Browser läuft (wird von Playwright auf DEMO_ORIGIN umgeleitet).
// Erscheint in Texten, die die App aus location.origin baut (z. B. „In Platzcoach: …“). .demo ist keine echte Domain.
export const DEMO_APP_URL = 'https://platzcoach.demo';

// Fester Demo-Zeitpunkt (Europe/Berlin): Dienstag, 13. Oktober 2026, 16:20 Uhr.
export const DEMO_NOW = '2026-10-13T16:20:00+02:00';
export const DEMO_TZ = 'Europe/Berlin';

// Fiktive Zugänge für die Aufnahmen (alle mit demselben Demo-Passwort).
export const DEMO_PASSWORD = 'demo-passwort-2026';
export const DEMO_USERS = {
  trainer: { email: 'max.mustermann@demo.invalid', password: DEMO_PASSWORD, name: 'Max Mustermann' },
  vorstand: { email: 'vorstand@demo.invalid', password: DEMO_PASSWORD, name: 'Erika Musterfrau' },
  torwart: { email: 'kai.beispielmann@demo.invalid', password: DEMO_PASSWORD, name: 'Kai Beispielmann' },
};
export const DEMO_LOGIN = DEMO_USERS.trainer;

// Dateien der App, die der Demo-Server aus dem Repo ausliefert (nur lesend).
export const APP_FILES = [
  'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'favicon.ico', 'favicon.webp', 'og-image.png', 'assets/logo.svg', 'assets/logo-horizontal.svg',
  'assets/logo-icon.svg', 'assets/logo-white.svg',
];
