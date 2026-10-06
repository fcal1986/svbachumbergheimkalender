# Platzcoach – Videos (Playwright + Remotion)

Kurze Produkt- und Werbefilme aus **echten App-Ansichten**. Der Ordner ist vom Produkt getrennt: eigene `package.json`, eigene `node_modules`, nichts davon landet in `index.html` oder auf GitHub Pages (Ausgaben, Screenshots und Demo-Daten sind gitignored).

## Befehle

```bash
cd video
npm ci                     # einmalig
npm run test:safety        # Demo-Schutz prüfen (4 Tests)
npm run demo:reset         # Demo-Daten auf festen Ausgangszustand (läuft auch automatisch vor jeder Aufnahme)
npm run capture            # echte App aufnehmen → public/capture/*.png + manifest.json
npm run studio             # Vorschau im Remotion Studio (Browser)
npm run render             # Hauptfilm + 2 Einstiegsvorschauen → out/*.mp4
npm run narration          # Sprechertext + geschätzte Untertitel → out/
npm run frames             # Prüfbilder aus den fertigen MP4 → out/check/
npm run all                # alles nacheinander
```

Rendern braucht Chrome Headless Shell. `scripts/render.mjs` nimmt `REMOTION_BROWSER_EXECUTABLE`, sonst den von Playwright installierten (`npx playwright install chromium-headless-shell`), sonst lädt Remotion selbst. ffmpeg wird für den Social-Export und die Prüfbilder gebraucht.

## Ablauf im Film (nur nachweislich vorhandene Funktionen)

| Zeit | Inhalt | Szene im Manifest |
|---|---|---|
| 0–3 s | Einstieg (austauschbar) | – |
| 3–7 s | Startseite: Platzbelegung heute, live | `01-start` |
| 7–9,4 s | Neuer Termin → „Training“ | `02-form` |
| 9,4–13,4 s | Di 17:00–18:30, ganzer Platz → „⚠ belegt: Training D1-Jugend“, Vorschlag „Hälfte B buchen“ | `03-conflict` |
| 13,4–15,8 s | Hälfte B → „✓ Passt“ | `04-ok` |
| 15,8–19 s | Prüfansicht „Termin prüfen“ → Jetzt speichern | `05-review` |
| 19–25,4 s | Startseite „Als Nächstes: E2 · Training“, Zeitleiste E2 neben D1 | `06-saved`, `07-timeline` |
| 25–30 s | Endkarte: Logo + „Jetzt ansehen: platzcoach.de“ | – |

**Belegte Aussagen:** Konfliktprüfung im Terminformular (`renderFormTlStatus`), Vorschlag der freien Hälfte (`fb-share-note`), Prüfansicht vor dem Speichern, Live-Platzbelegung auf der Startseite, Lesen ohne Anmeldung. Keine Kundenstimmen, Zahlen oder Einsparversprechen.

## Aufbau

```
video/
  demo/        demo.config.mjs (Konstanten) · fixtures.mjs (fiktiver Verein) · seed.mjs (Reset)
               server.mjs (App + data/ + GitHub-API-Mock) · safety.mjs + safety.test.mjs (Schutz)
  capture/     browser.mjs (abgeschotteter Browser) · capture.mjs (Ablauf + Manifest)
  src/         config/film.ts  ← ZENTRALE KONFIGURATION (Texte, Einstiege, Timing, Kamera, Highlights, Cursor, Audio, CTA)
               Film.tsx · Root.tsx · components/ · lib/ (Manifest, Kamera)
  scripts/     prepare.mjs · render.mjs · narration.mjs · frames.mjs
  out/         fertige MP4, Sprechertext, SRT, Prüfbilder (gitignored)
```

## Demo-Umgebung und Sicherheit

- **Fiktive Daten:** „SV Musterstadt 1920 e.V.“, Trainer Max Mustermann u. a. (`*@demo.invalid`), erfundene Gegner. Echte `data/*.json` werden nie gelesen oder geschrieben.
- **Fester Zeitpunkt:** Di, 13.10.2026, 16:20 Uhr (Europe/Berlin) über die Playwright-Uhr; Sprache de-DE.
- **Kein Produktivzugriff:** Die App läuft unverändert, aber im Aufnahme-Browser wird jede Anfrage an `api.github.com` auf den lokalen Mock umgeleitet; alle anderen externen Anfragen (Clarity, Google Analytics, Worker, Push) werden blockiert und im Manifest unter `checks.blockedExternalRequests` protokolliert. Dispatches (Mails) landen nur in `.demo-runtime/commits.log`. Service Worker sind aus.
- **Anmeldung:** vorhandener Mechanismus – `users.json` enthält einen mit dem Demo-Passwort verschlüsselten Platzhalter-Token (`platzcoach-demo-token-kein-geheimnis`), kein echter Schlüssel.
- **Schutz:** Reset/Server schreiben nur in `video/.demo-runtime/` (mit Markierungsdatei), lehnen `PLATZCOACH_ENV=production`, GitHub Actions (ohne ausdrückliche Freigabe), den echten Datenordner und jede `config.repo` außer `demo/platzcoach-demo` ab. Der Mock antwortet nur dem Demo-Repo mit dem Demo-Token.
- `npm run demo:serve` startet die Demo zum Ansehen im normalen Browser. Dort gehen Schreibversuche an die echte GitHub-API und scheitern am Platzhalter-Token – zum Bearbeiten die Aufnahme nutzen.

## Koordinatensystem (Manifest)

`public/capture/manifest.json` → `coordinateSystem`: Elementboxen in **CSS-Pixeln**, Ursprung links oben im Screenshot (= Viewport 400 × 760). `deviceScaleFactor` 3 → Bild 1200 × 2280 px; Bildpixel = CSS-Pixel × 3. Remotion rechnet in CSS-Pixeln (`src/lib/camera.ts`): Zoom 1 = Screenshot-Breite füllt die Karte (860 px), Ausschnitte bleiben an den Bildrändern stehen.

## Varianten

- **Einstieg wechseln:** `hooks` in `src/config/film.ts`; Rendern mit `--props='{"hook":"werwann"}'` (siehe `scripts/render.mjs`).
- **Texte/Timing/Zooms/Highlights:** nur `src/config/film.ts`. Elementnamen kommen aus dem Manifest.
- **Neuer Ablauf:** Schritt in `capture/capture.mjs` ergänzen (`shot(id, beschreibung, {name: selektor})`), dann Shot in `film.ts`.

## Sprache, Untertitel, Musik

Kein ElevenLabs-Zugang in dieser Version → **stummer Film** (mit stummer AAC-Spur für WhatsApp/Instagram). `npm run narration` erzeugt `out/sprechertext.md` und `out/untertitel-<einstieg>.geschaetzt.srt` – **Zeiten geschätzt, nicht wortgenau.**

Später einbinden:
1. Aufnahme als `public/audio/sprecher.mp3` ablegen (API-Schlüssel nur als Umgebungsvariable, nie im Repo).
2. In `film.ts`: `audio.voiceover = { src: 'audio/sprecher.mp3', volume: 1 }`.
3. Zeiten in `narration.cues` aus echten Zeitmarken übernehmen (z. B. ElevenLabs „with timestamps“ oder Forced Alignment), dann `subtitles.burnIn = true`.
4. Musik optional: `audio.music = { src, volume: 0.25, duckedVolume: 0.08 }` – wird während der Sprache automatisch abgesenkt. Nur lizenzierte Titel.

## Hinweise

- Remotion ist für Einzelpersonen und kleine Firmen kostenlos; ab einer bestimmten Firmengröße ist eine Firmenlizenz nötig (siehe remotion.dev/license).
- Nicht automatisch veröffentlichen; die Dateien in `out/` sind zum Prüfen und manuellen Hochladen.
