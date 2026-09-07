# fussball.de-Heimspiele in Platzcoach – Deployment-Anleitung

Dieses Paket enthält alles, was ihr für das fussball.de-Feature braucht:

```
index.html                          → ersetzt eure aktuelle App-Datei
data/fussballde.json                → neue Datei, Startzustand (leer)
scripts/fussballde-sync.mjs         → Sync-Skript (holt Heimspiele von fussball.de)
package.json                        → Abhängigkeit für das Sync-Skript (cheerio)
.github/workflows/fussballde-sync.yml → GitHub Action, führt den Sync automatisch aus
```

## Was das Feature macht

- Zeigt kommende **Heimspiele aller 15 Mannschaften** auf der Start-Seite an (automatisch von fussball.de geholt, alle 6 Stunden aktualisiert).
- Admins können ein Heimspiel per Klick in einen echten Termin **übernehmen**.
- Heimspiele **ab D-Jugend aufwärts** (kompletter Platz nötig) blockieren automatisch widersprüchliche Termin-Buchungen zur selben Zeit.
- Heimspiele **bis E-Jugend** (Platz wird geteilt) lösen nur einen Hinweis aus, keinen Block.
- Eine Warnkarte zeigt, wenn **fussball.de selbst zu viele Spiele** auf dieselbe Uhrzeit gelegt hat (Ansetzungsfehler des Staffelleiters).

---

## Schritt 1: Dateien ins Repo kopieren

1. `index.html` → ersetzt die bestehende Datei im Repo-Root.
2. `data/fussballde.json` → neu in den Ordner `data/` legen.
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
