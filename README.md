# SVBB Termine

Terminverwaltung für den SV Bachum/Bergheim. Eine HTML-Seite auf GitHub Pages, Daten als JSON im selben Repo.

**Ansehen kann jeder — ohne Anmeldung.** Nur Eintragen, Ändern und Löschen erfordert einen Zugang.

---

## Dateien

```
index.html
manifest.json
icon-192.png
icon-512.png
data/config.json
data/events.json
data/users.json
termine.ics        ← wird von der App selbst erzeugt
```

---

## Einrichtung (einmalig, ca. 10 Minuten)

### 1. Repo anlegen

Neues GitHub-Repo, z. B. `svbb-termine`. Alle Dateien oben hochladen (Ordnerstruktur beibehalten).

### 2. GitHub Pages aktivieren

**Settings → Pages** → Source: `Deploy from a branch` → Branch `main`, Ordner `/ (root)` → Save.

Nach ein bis zwei Minuten läuft die App unter
`https://DEIN-NAME.github.io/svbb-termine/`

### 3. config.json anpassen

```json
{
  "repo": "DEIN-GITHUB-NAME/svbb-termine",
  "branch": "main",
  "clubName": "SV Bachum / Bergheim e.V.",
  "admin": {
    "user": "admin",
    "password": "svbachumbergheim",
    "first": "Vorstand",
    "last": "Admin"
  }
}
```

`repo` muss exakt stimmen, sonst kann die App nicht speichern.

### 4. Schreib-Token erstellen

GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**

| Feld | Wert |
|---|---|
| Repository access | Only select repositories → `svbb-termine` |
| Permissions → Contents | **Read and write** |
| Expiration | 1 Jahr (Termin notieren!) |

Token kopieren, er wird nur einmal angezeigt.

### 5. Admin anmelden, Token hinterlegen

App öffnen → oben rechts **Anmelden**:

- Benutzer: `admin`
- Passwort: `svbachumbergheim`

Dann **Konto → GitHub-Token** → einfügen → Speichern.

### 6. Trainer anlegen

**Konto → Neuen Trainer anlegen**: Vorname, Nachname, E-Mail, Start-Passwort. Zugangsdaten weitergeben. Fertig.

---

## Wie es funktioniert

- **Zwei Tabellen:** `data/events.json` (Termine) und `data/users.json` (Trainer).
- **Ohne Anmeldung:** Termine ansehen, Monat/Jahr blättern, filtern, per WhatsApp teilen, Kalender abonnieren.
- **Mit Anmeldung:** Termine anlegen und duplizieren. Bearbeiten und löschen nur die eigenen. Der Admin darf alles.
- **Ansprechpartner** ist immer automatisch der angemeldete User (Vor- + Nachname).
- **Jede Änderung** ist ein Git-Commit — versehentlich Gelöschtes lässt sich über die GitHub-Historie wiederherstellen.

---

## Kalender abonnieren

Bei jedem Speichern schreibt die App zusätzlich `termine.ics` ins Repo. Diese URL kann jeder abonnieren:

```
https://DEIN-NAME.github.io/svbb-termine/termine.ics
```

Der Link steht auch in der App unter **Konto → Kalender abonnieren** zum Kopieren.

- **iPhone:** Einstellungen → Kalender → Accounts → Account hinzufügen → Andere → Kalenderabo → URL einfügen
- **Android:** Google Kalender am PC → Weitere Kalender → Per URL → URL einfügen (Handy synchronisiert automatisch)

Danach erscheinen alle Vereinstermine im Handy-Kalender und aktualisieren sich von selbst. Ideal für den WhatsApp-Verteiler an Eltern: einmal Link schicken statt jeden Termin einzeln.

Der Abo-Link ist perfekt für die Vereins-Website oder einen QR-Code am Vereinsheim.

---

## Als App speichern

- **iPhone:** Safari → Teilen-Symbol → „Zum Home-Bildschirm"
- **Android:** Chrome → Menü ⋮ → „App installieren"

Danach startet sie mit eigenem Icon, ohne Browser-Leiste.

---

## Sicherheit — bitte einmal lesen

GitHub Pages hat **keinen Server**. Alles läuft im Browser.

**Was geschützt ist:**
Der Schreib-Token wird mit dem Passwort jedes Trainers verschlüsselt (PBKDF2, 310.000 Runden + AES-GCM) und liegt nur so in `users.json`. Ohne richtiges Passwort ist er nicht lesbar → kein Schreibzugriff. Das Admin-Passwort steht zwar im Klartext in `config.json`, nützt aber allein nichts: Der Admin-Token liegt nur lokal auf dem Gerät des Admins, nie im Repo.

**Was nicht geschützt ist — und jetzt auch nicht mehr sein soll:**
- Alle **Termine sind öffentlich**. Das ist so gewollt. Trotzdem: keine Telefonnummern oder privaten Daten in Bemerkungen — sie stehen sonst im Internet und im Kalender-Abo.
- In `users.json` stehen **Namen und E-Mail-Adressen** der Trainer öffentlich lesbar. Wenn das stört: nur Vorname + Vereins-Mail statt privater Adresse eintragen.
- Wer das Passwort eines Trainers errät, bekommt den Schreib-Token. Also **ordentliche Passwörter** vergeben, nicht `12345678`.

**Faustregel:** Passend für einen öffentlichen Vereinskalender, nicht für sensible Daten.

---

## Fingerabdruck

Nach dem Anmelden unter **Konto → Anmeldung per Fingerabdruck**. Danach reicht Finger oder Face-ID.

Das ist eine **Gerätesperre**, kein zusätzlicher Server-Schutz — der Zugang bleibt dafür auf dem Gerät gespeichert. Nur auf dem eigenen Handy einrichten, nicht auf einem geteilten Rechner. Funktioniert nur über HTTPS, auf GitHub Pages also automatisch.

---

## Admin-Passwort ändern

`data/config.json` im Repo bearbeiten, `password` ändern, committen. Sonst nirgends.

---

## Token abgelaufen?

Wenn Trainer „Token ungültig" melden: neuen Token erstellen (Schritt 4), als Admin hinterlegen (Schritt 5) — und **alle Trainer neu anlegen**, weil in ihren Datensätzen noch der alte Token verschlüsselt liegt. Der unschöne Teil dieser Architektur; mit einem Jahr Laufzeit passiert es selten.

---

## Wenn es später zu eng wird

Sobald ihr echte Zugriffsrechte oder viele Nutzer braucht, ist ein kleines Backend (z. B. Supabase, kostenloser Tarif) der saubere Weg. Die Oberfläche kann bleiben, nur der Speicherteil wird getauscht.
