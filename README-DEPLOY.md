# Platzcoach – Einrichtung und Betrieb

Stand: 26.09.2026 · Version 1. Diese Anleitung beschreibt, woraus Platzcoach besteht und wie die einzelnen Teile eingerichtet werden. Teile, die schon laufen, stehen hier als Nachschlagewerk.

## Überblick: Was liegt wo?

| Datei / Dienst | Zweck | Wird geändert von |
|---|---|---|
| `index.html` | Die komplette App | Updates (ersetzen) |
| `data/config.json` | Vereinseinstellungen, fussball.de, Belegungsregeln, Worker-Adressen | Hand, Updates |
| `data/users.json`, `events.json`, `training.json`, `seasons.json`, `resource-locks.json` | Daten der App | **nur die App** – nie per Hand oder Update ersetzen |
| `data/fussballde.json` | Aktuelle Spiele von fussball.de | **nur der Abgleich** (alle 6 h) – nie ersetzen, sonst sind die Spiele bis zum nächsten Lauf weg |
| `scripts/fussballde-sync.mjs`, `package.json`, `.github/workflows/fussballde-sync.yml` | fussball.de-Abgleich | selten |
| `scripts/notify-email.mjs`, `.github/workflows/notify-email.yml` | E-Mail-Benachrichtigungen bei Änderungen | selten |
| `scripts/send-welcome-password.mjs`, `.github/workflows/welcome-password-email.yml` | Mail mit Start-Passwort | selten |
| `scripts/send-password-mail.mjs`, `.github/workflows/password-mails.yml` | Mails „Passwort zurücksetzen“ und „Passwort geändert“ | selten |
| `worker/password-reset-worker.js` | Vorlage für den Passwort-Worker in Cloudflare (läuft nicht auf GitHub) | selten |
| Cloudflare-Worker `odd-pine-7cbc` | Selbstregistrierung mit Einladungslink | – |
| Cloudflare-Worker „platzcoach-passwort“ | „Passwort vergessen?“ (siehe Teil B) | – |

## Ein Update einspielen

1. Nur die Dateien aus dem Update-Paket hochladen, mit genau demselben Pfad im Repo. Dateien, die nicht im Paket sind, bleiben unverändert.
2. Vorher prüfen, ob seit dem Update-Stand jemand `index.html` oder `data/config.json` auf GitHub geändert hat – sonst geht diese Änderung beim Überschreiben verloren.
3. Nach 1–2 Minuten die App neu laden und unter **Konto** die Versionsnummer prüfen.

---

# Teil A: fussball.de-Abgleich (bereits eingerichtet)

Läuft seit September 2026. Die Schritte unten sind nur nötig, wenn Platzcoach für einen neuen Verein eingerichtet wird.

## Was das Feature macht

- Zeigt kommende **Heimspiele aller 15 Mannschaften** auf der Start-Seite an (automatisch von fussball.de geholt, alle 6 Stunden aktualisiert).
- Admins können ein Heimspiel per Klick in einen echten Termin **übernehmen**.
- Heimspiele **ab D-Jugend aufwärts** (kompletter Platz nötig) blockieren automatisch widersprüchliche Termin-Buchungen zur selben Zeit.
- Heimspiele **bis E-Jugend** (Platz wird geteilt) lösen nur einen Hinweis aus, keinen Block.
- Eine Warnkarte zeigt, wenn **fussball.de selbst zu viele Spiele** auf dieselbe Uhrzeit gelegt hat (Ansetzungsfehler des Staffelleiters).

---

## Schritt 1: Dateien ins Repo kopieren

1. `index.html` → ins Repo-Root.
2. `data/fussballde.json` → nur bei einer **Neueinrichtung** anlegen, mit dem Inhalt `{"updated":null,"games":[],"awayGames":[]}`.
3. `scripts/fussballde-sync.mjs` → neuer Ordner `scripts/` im Repo-Root.
4. `package.json` → ins Repo-Root. **Falls dort schon eine `package.json` existiert**, nicht überschreiben, sondern den Eintrag `"cheerio": "^1.0.0"` manuell unter `"dependencies"` ergänzen.
5. `.github/workflows/fussballde-sync.yml` → in den Ordner `.github/workflows/` (anlegen, falls nicht vorhanden).

## Schritt 2: `data/config.json` ergänzen

Öffnet eure bestehende `data/config.json` und fügt folgenden Block hinzu (Beispielwerte für SV Bachum/Bergheim, bereits mit eurer echten Vereins-ID):

```json
"fussballde": {
  "clubId": "00ES8GN8LS00007LVV0AG08LVUPGND5I",
  "clubMatch": "SV Bachum",
  "bufferBeforeMin": 15,
  "durationMinFull": 110,
  "durationMinYouth": 75,
  "shareCategories": ["E-Junioren", "F-Junioren", "G-Junioren", "Bambini"]
}
```

**Wichtig:** Das muss ein zusätzliches Feld in der bestehenden JSON-Datei sein, nicht die ganze Datei ersetzen. Beispiel für eine komplette Datei:

```json
{
  "repo": "euer-github-name/euer-repo",
  "branch": "main",
  "clubName": "SV Bachum/Bergheim e.V.",
  "password": "...",
  "fussballde": {
    "clubId": "00ES8GN8LS00007LVV0AG08LVUPGND5I",
    "clubMatch": "SV Bachum",
    "bufferBeforeMin": 15,
    "durationMinFull": 110,
    "durationMinYouth": 75,
    "shareCategories": ["E-Junioren", "F-Junioren", "G-Junioren", "Bambini"]
  }
}
```

Erklärung der Felder:

| Feld | Bedeutung |
|---|---|
| `clubId` | Eure Vereins-ID von fussball.de (steht in der URL eurer Vereinsseite nach `/id/`) |
| `clubMatch` | Text, an dem ein Heimspiel erkannt wird (muss am Anfang des Team-Namens stehen) |
| `bufferBeforeMin` | Vorlaufzeit vor Anpfiff, die zusätzlich als belegt gilt (Minuten) |
| `durationMinFull` | Geschätzte Spieldauer für Teams **ab D-Jugend aufwärts** (kompletter Platz) |
| `durationMinYouth` | Geschätzte Spieldauer für Teams **bis E-Jugend** (Platz wird geteilt) |
| `shareCategories` | Welche Namens-Präfixe sich den Platz teilen dürfen |

Passt `durationMinFull` / `durationMinYouth` an, falls eure tatsächlichen Spielzeiten abweichen.

## Schritt 3: GitHub Action aktivieren

1. Nach dem Push der Dateien: Im Repo auf GitHub zu **Actions** gehen.
2. Den Workflow **"fussball.de Heimspiele synchronisieren"** sollte dort auftauchen.
3. Rechts auf **"Run workflow"** klicken, um ihn einmal manuell zu testen.
4. Log prüfen: Steht dort z. B. *"X zukünftige Heimspiele über alle Mannschaften gefunden"*? Dann hat es funktioniert.
5. Ab jetzt läuft er automatisch alle 6 Stunden (`cron: '17 */6 * * *'`) – keine weitere Aktion nötig.

**Falls der Log einen Fehler zeigt** (z. B. 0 Spiele gefunden, obwohl welche anstehen, oder ein HTTP-Fehler): Schickt mir die Log-Ausgabe, ich passe den Parser an. Das konnte ich nicht 1:1 gegen die Live-Seite testen, da mein Zugriff auf fussball.de eingeschränkt ist.

## Schritt 4: Berechtigungen prüfen

Die Action braucht Schreibrechte, um `data/fussballde.json` zu committen. Das ist im Workflow bereits über `permissions: contents: write` gesetzt – falls euer Repo unter **Settings → Actions → General → Workflow permissions** auf "Read repository contents" statt "Read and write" eingeschränkt ist, dort auf **"Read and write permissions"** umstellen, sonst schlägt der `git push` fehl.

## Schritt 5: Testen in der App

1. App öffnen → Start-Seite.
2. Wenn Heimspiele in den nächsten Tagen anstehen, erscheint die Sektion "Heimspiele · fussball.de".
3. Als Admin einloggen → bei einem Spiel auf "Übernehmen" klicken → prüfen, ob Datum/Zeit/Titel korrekt vorausgefüllt sind.
4. Testweise einen Termin mit "Großspielfeld" zur selben Zeit wie ein Herren-/D-Jugend-Heimspiel anlegen → sollte beim Speichern blockiert werden mit Hinweis auf das Heimspiel.
5. Dasselbe mit einem E-/F-/G-Jugend-Heimspiel → sollte **nicht** blockieren, nur einen Info-Hinweis zeigen.

---

## Bekannte Einschränkungen (bitte im Hinterkopf behalten)

- **Keine offizielle fussball.de-API.** Das Skript liest die öffentliche HTML-Seite. Ändert fussball.de sein Layout grundlegend, kann der Sync brechen – dann bitte bei mir melden.
- **Rechtlicher Graubereich**: fussball.de bietet aktiv keinen Export mehr an. Die Abruffrequenz (alle 6h) ist bewusst zurückhaltend gewählt. Bei Zweifeln: Nutzungsbedingungen von fussball.de prüfen.
- **Spieldauer ist geschätzt**, da fussball.de keine Endzeiten liefert – bei Bedarf in `data/config.json` justieren.
- Die Kategorie-Erkennung (teilbar vs. Vollplatz) basiert auf dem Team-Namen von fussball.de (z. B. "E-Junioren"). Falls eure Liga andere Bezeichnungen nutzt, `shareCategories` in der Config anpassen.

---

# Teil B: „Passwort vergessen?“ – Passwort-Worker einrichten (einmalig, ca. 10 Minuten)

Solange `passwordReset.workerUrl` in `data/config.json` leer ist, zeigt „Passwort vergessen?“ nur den Hinweis, sich an den Vorstand zu wenden. Admins können Passwörter jederzeit unter **Konto → Zugänge → Passwort** neu setzen (neues Start-Passwort per Mail, Pflichtwechsel bei der nächsten Anmeldung).

Für den Self-Service per E-Mail-Link:

1. **Cloudflare → Workers & Pages → Create → Worker**, Name z. B. `platzcoach-passwort`. Inhalt von `worker/password-reset-worker.js` einfügen, **Deploy**.
2. **Storage & Databases → KV → Create namespace** `platzcoach-passwort`. Im Worker unter **Settings → Bindings → KV namespace** mit dem Variablennamen **`PWRESET`** verbinden.
3. Im Worker unter **Settings → Variables and Secrets**:
   - `REPO` = `fcal1986/svbachumbergheimkalender`
   - `BRANCH` = `main`
   - `APP_URL` = `https://platzcoach.de/`
   - `ALLOWED_ORIGINS` = `https://platzcoach.de`
   - **Secret** `GITHUB_TOKEN` = derselbe Fine-grained Token, den die App nutzt (Contents: Read and write). **Wichtig:** Wenn der Token erneuert wird, auch hier austauschen.
4. Worker-URL (z. B. `https://platzcoach-passwort.<konto>.workers.dev`) in `data/config.json` eintragen:
   ```json
   "passwordReset": { "workerUrl": "https://platzcoach-passwort.<konto>.workers.dev" }
   ```
5. Test: `…/health` im Browser öffnen → `{"ok":true}`. Dann in der App „Passwort vergessen?“ mit eigenem Namen und eigener Adresse ausprobieren. Die Mail kommt nach ca. 1 Minute (GitHub Action „Passwort-Mails“).

**Wie es funktioniert:** Nur wenn Vorname, Nachname und E-Mail genau zu einem nicht gesperrten Zugang passen, verschickt der Worker einen Link (`#reset=…`), 60 Minuten gültig, nur einmal nutzbar; ein neuer Link macht ältere ungültig. Die Antwort in der App ist immer gleich, egal ob etwas passt. Begrenzung: 3 Anfragen pro E-Mail und 10 pro IP-Adresse und Stunde. Nach jeder Passwortänderung geht eine Bestätigungsmail raus.

# Teil C: Belegungsregeln (Terminarten)

In `data/config.json` unter `occupancy.levels` hat jede Terminart eine Belegungsstufe:

| Terminart | Stufe | Bedeutung |
|---|---|---|
| `game` (Spiel, auch alle fussball.de-Heimspiele) | `exclusive` | Kein Torwarttraining parallel auf dem Platz |
| `training` | `shared` | Teilt den Platz nur über getrennte Viertel/Hälften (wie bisher) |
| `goalkeeper` (Torwarttraining) | `overlay` | Belegt keine Fläche, darf parallel zu Training laufen, nicht zu Spielen oder anderem Torwarttraining |
| `other` (Sonstiges) | `shared` | wie Training |

Ausnahmen lassen sich ohne Code-Änderung ergänzen, z. B. zwei Torwarttrainings gleichzeitig erlauben: `"compatible": [["goalkeeper","goalkeeper"]]`. Kabinen, Vereinsheim, Theke und Halle sind immer exklusiv.

# Teil D: Torhüter und Anmeldung zum Torwarttraining

- **Torhüter eintragen:** Jeder Trainer unter **Konto → Profil → „Meine Torhüter“** (Vor- und Nachname, Mannschaft). Admins zusätzlich unter **Konto → Saisons**: Antippen einer Mannschaft (🧤) öffnet deren Torhüter.
- **Torwarttraining anlegen:** Termin mit Terminart „Torwarttraining“ oder feste Trainingszeit mit Art „Torwarttraining“; dann „Für welche Mannschaften?“ wählen (Mehrfachauswahl, Jugend bis Herren/Ü32). Ressourcen sind optional. Beim Anlegen bekommen alle Trainer dieser Mannschaften und der Organisator eine E-Mail mit der Bitte, Torhüter an- oder abzumelden (Workflow „Torwarttraining – E-Mails“). „Trainer erinnern“ auf jedem Termin schickt die Mail erneut.
- **Absage:** Wird ein Torwarttraining-Termin gelöscht, ein einzelner Tag einer festen Zeit abgesagt oder die feste Zeit gelöscht, bekommen die Trainer der Mannschaften und der Organisator eine Absage-Mail.
- **An-/Abmelden:** Auf der Terminkarte „Torhüter an-/abmelden“, pro einzelnem Termin. Mannschaftstrainer können ihre eigenen Torhüter an-/abmelden, Torwarttrainer und Admins alle.
- **Datenschutz:** `data/goalkeepers.json` ist verschlüsselt (Schlüssel aus dem Schreib-Token). Namen sind nur nach Anmeldung sichtbar, weder in der öffentlichen Datei noch in Commit-Nachrichten oder E-Mails stehen Spielernamen. Anmeldungen vergangener Termine werden nach 60 Tagen automatisch gelöscht.
- **Token erneuern:** Neuen Token als Notzugang `admin` unter Konto speichern, solange der alte noch gilt – die App verschlüsselt die Torhüter-Liste dann automatisch neu. Wird der alte Token vorher gelöscht, ist die Liste nicht mehr lesbar und muss neu eingetragen werden.
