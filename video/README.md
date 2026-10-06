# Platzcoach – Reels (Playwright + Remotion)

Kurze Hochkant-Reels (1080 × 1920, 30 fps, 30 s) aus **echten App-Ansichten**. Der Ordner ist vom Produkt getrennt: eigene `package.json`, eigene `node_modules`. Nichts davon landet in `index.html`; Ausgaben, Screenshots und Demo-Daten sind gitignored.

## Reels

| # | Reel (`id`) | Zielgruppe | Ablauf in der echten App |
|---|---|---|---|
| 1 | `platzbelegung` | Trainer, Verein | Live-Platz → Training anlegen → „⚠ belegt“ → „Hälfte B buchen“ → Prüfen → Speichern |
| 2 | `spielverlegung` | Trainer | Heimspiel → Neue Ansetzung suchen → Termin in eigener Trainingszeit → Anfrage an Gegner (WhatsApp-Text) → Vormerken (Training absagen) → DFBnet-Text für Jugendleiter |
| 3 | `fussballde` | Jugendleiter, Vorstand | Zu erledigen → Mannschaften abgleichen (D2 übernehmen) → Spiele automatisch im Kalender → Heimspiel belegt Hälfte → „verlegt vom …“ |
| 4 | `freiertermin` | Vorstand | Schulfest → Freien Termin suchen (Mai/Juni, samstags, 5 Std) → grün/gelb/grau → Übernehmen → Passt → Prüfen |
| 5 | `torwarttraining` | Torwart- und Mannschaftstrainer | Torwarttraining für E + F (Mail an Trainer) → Trainer: Zu erledigen → Torhüter anhaken → „2 angemeldet“ |
| 6 | `freundschaftsspiel` | Trainer | Heimspiel, Anstoß → Platz „✓ frei“ → Training absagen? → DFBnet-Text → „Vorgemerkt“ → Auswärts belegt keinen Platz |

Belegte Aussagen je Reel stehen in `src/reels/<id>.ts` → `claims` und in `out/sprechertexte.md`.

## Befehle

```bash
cd video
npm ci                                  # einmalig
npm run test:safety                     # Demo-Schutz prüfen
npm run capture                         # alle Abläufe aufnehmen (oder: npm run capture -- spielverlegung)
npm run studio                          # Vorschau im Remotion Studio
npm run render                          # alle Reels + Einstiegsvorschauen → out/*.mp4 (oder: npm run render -- fussballde)
npm run narration                       # Sprechertexte + geschätzte Untertitel → out/
npm run frames                          # Prüfbögen aus den fertigen MP4 → out/check/
npm run all                             # alles nacheinander (≈ 15 min)
```

Rendern braucht Chrome Headless Shell (`REMOTION_BROWSER_EXECUTABLE`, sonst das von Playwright, sonst lädt Remotion selbst) und ffmpeg (Social-Export: H.264 yuv420p, +faststart, stumme AAC-Spur).

## Aufbau

```
video/
  demo/        demo.config.mjs (Zugänge, Zeitpunkt, Adressen) · fixtures.mjs (fiktiver Verein) · seed.mjs (Reset)
               server.mjs (App + data/ + GitHub-API-Mock) · safety.mjs + safety.test.mjs (Schutz)
  capture/     browser.mjs (abgeschotteter Browser) · lib.mjs (Helfer, Manifest) · capture.mjs (Einstieg)
               flows/<reel>.mjs  ← je Reel der Ablauf in der App
  src/         reels/<reel>.ts   ← je Reel: Einstiege, Shots (Kamera, Highlights, Cursor), Überschriften, Sprechertext
               reels/list.json (Reihenfolge, Dateinamen) · reels/index.ts (Register)
               config/common.ts (Format, Marke, Safe-Zone, Endkarte) · config/types.ts
               Film.tsx · Root.tsx · components/ · lib/ (Manifest, Kamera)
  scripts/     prepare.mjs · render.mjs · narration.mjs · frames.mjs
  out/         MP4, Sprechertexte, SRT, Prüfbögen (gitignored)
```

### Neues Reel

1. `capture/flows/<id>.mjs`: Ablauf mit `shot('01-…', 'Beschreibung', { name: 'selektor' })`; `ctx.login('trainer'|'vorstand'|'torwart')`, `ctx.text()` für abgefangene Texte (z. B. WhatsApp), `ctx.waitSaved()`.
2. Eintrag in `src/reels/list.json`, dann `npm run capture -- <id>`.
3. `src/reels/<id>.ts` (Vorlage: ein bestehendes Reel), in `src/reels/index.ts` registrieren.
4. `npm run render -- <id>` und `npm run frames`.

## Demo-Umgebung und Sicherheit

- **Fiktiv:** „SV Musterstadt 1920 e.V.“, Zugänge `max.mustermann@`, `vorstand@`, `kai.beispielmann@demo.invalid`, Passwort `demo-passwort-2026`, erfundene Gegner, Torhüter und Spiele. Echte `data/*.json` werden nie gelesen oder geschrieben.
- **Fester Zeitpunkt:** Di, 13.10.2026, 16:20 Uhr (Europe/Berlin), Sprache de-DE. Vor jedem Reel werden die Daten zurückgesetzt.
- **Adresse:** Die App läuft im Aufnahme-Browser unter `https://platzcoach.demo` (keine echte Domain, lokal umgeleitet), damit Texte wie „In Platzcoach: …“ keine lokale Adresse zeigen.
- **Kein Produktivzugriff:** Anfragen an `api.github.com` gehen an den lokalen Mock (nur Repo `demo/platzcoach-demo`, nur Platzhalter-Token). Alles andere Externe (Clarity, Analytics, Worker, Push, wa.me) wird blockiert bzw. abgefangen und im Manifest protokolliert. Service Worker sind aus.
- **Schutz:** Reset/Server schreiben nur in `video/.demo-runtime/`, lehnen `PLATZCOACH_ENV=production`, GitHub Actions, den echten Datenordner und jedes andere `config.repo` ab (`npm run test:safety`).

## Koordinaten (Manifest)

`public/capture/<reel>/manifest.json`: Elementboxen in **CSS-Pixeln**, Ursprung links oben im Screenshot (Viewport 400 × 760), `deviceScaleFactor` 3 → Bild 1200 × 2280 px. Remotion rechnet in CSS-Pixeln (`src/lib/camera.ts`): Zoom 1 = Screenshot-Breite füllt die Karte (860 px). Mit `cameraFit` (Reel 2–6) bleibt ein fokussiertes Element immer ganz sichtbar.

## Sprache, Untertitel, Musik

Alle Reels sind **stumm** (mit stummer Tonspur). `npm run narration` erzeugt `out/sprechertexte.md` und `out/<reel>-<einstieg>.geschaetzt.srt` – **Zeiten geschätzt, nicht wortgenau**.

Später: Aufnahme nach `public/audio/<reel>.mp3`, in `src/reels/<reel>.ts` `audio: { voiceover: { src: 'audio/<reel>.mp3', volume: 1 } }`, Zeiten in `narration` aus echten Zeitmarken übernehmen und `subtitles.burnIn` in `config/common.ts` einschalten. Musik optional (`audio.music`, wird unter Sprache abgesenkt), nur lizenzierte Titel. Keine API-Schlüssel ins Repo.

## Hinweise

- Remotion ist für Einzelpersonen und kleine Firmen kostenlos; ab einer bestimmten Firmengröße braucht es eine Firmenlizenz (remotion.dev/license).
- Nichts wird automatisch veröffentlicht.
