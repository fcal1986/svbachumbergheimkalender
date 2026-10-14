# Platzcoach – Arbeitsweise für den Umbau

> Stand 14.10.2026. Gilt für den Neubau (Supabase + React). Ziel: so einfach wie möglich. Für dich bleiben **vier Handgriffe** je Aufgabe, alles andere läuft über Claude und die Automatik.
>
> Regeln: `docs/PRINZIPIEN.md` · Betrieb und Pipeline: `docs/BETRIEB.md` · Aufbau des Codes: `docs/ARCHITEKTUR.md` · Begründungen: Entscheidungsprotokoll (Projekt-Doc `claude/entscheidungen.md`).

## 1. Wer macht was

| Wer | Aufgabe |
|---|---|
| **Fabrizio** | entscheidet, was gebaut wird; schreibt bzw. bestätigt Aufgaben; sieht Pull Requests durch und mergt; testet auf Pre; setzt den Versions-Tag für Pro; richtet Konten und Einstellungen in den Diensten ein (Supabase, Cloudflare, Brevo, Better Stack, GitHub) und trägt Zugangsdaten ein |
| **Claude** | schreibt Code, Tests, Migrationen und Doku auf einem Branch; öffnet den Pull Request; erklärt Änderungen in einfachen Worten; schreibt Schritt-für-Schritt-Anleitungen für jede Einrichtung; hält Board-Hinweise, Backlog und Doku aktuell |
| **Mitstreiter** (optional) | testet auf Pre, kommentiert Issues, meldet Fehler als Issue |
| **Automatik** (GitHub Actions) | prüft jeden Pull Request, rollt nach dem Merge auf Pre aus, nach dem Tag auf Pro |

Claude arbeitet **nie** auf `main`, **nie** mit Zugangsdaten zu Pro und bekommt **nie** Passwörter oder Schlüssel in den Chat.

## 2. Der Ablauf einer Aufgabe – deine vier Handgriffe

```
① Aufgabe geben  →  [Claude baut, Automatik prüft]  →  ② durchsehen + mergen
   →  [Automatik rollt auf Pre aus]  →  ③ auf Pre testen  →  ④ Tag setzen  →  [Automatik rollt auf Pro aus]
```

**① Aufgabe geben.** Öffne eine Claude-Sitzung mit dem Repo und schreib z. B. „Arbeite an #14“. Fehlt das Issue noch, reicht eine Beschreibung in eigenen Worten – Claude legt das Issue nach der Vorlage an und fragt nach, was unklar ist.

**② Durchsehen und mergen.** Claude meldet sich mit dem Link zum Pull Request und einer kurzen Erklärung. Du gehst die Prüffragen aus Abschnitt 5 durch (geht am Handy in der GitHub-App) und mergst. Board: „Auf Pre“.

**③ Auf Pre testen.** Ein paar Minuten nach dem Merge ist die Änderung auf pre.platzcoach.de. Du probierst sie mit echten Abläufen aus. Passt etwas nicht: im Issue kommentieren oder Claude in derselben Sitzung sagen – es geht zurück zu ①.

**④ Tag setzen.** Wenn es passt: Release → neuer Tag `vJJJJ.MM.TT-N`. Die Automatik rollt genau diesen Stand auf Pro aus und schließt die Issues. Board: „Live“. Du kannst mehrere fertige Aufgaben in einem Tag zusammen veröffentlichen.

## 3. Wie eine gute Aufgabe aussieht

Vorlage für jedes Issue (Claude füllt sie aus, du bestätigst):

```
Ziel:        Was soll der Trainer/Admin danach können? (ein Satz)
Für wen:     Trainer / Admin / Gast
Fertig wenn: 2–4 prüfbare Punkte, z. B. „Absagen bleibt 1 Klick“
Nicht dabei: was bewusst nicht Teil der Aufgabe ist
Rechte:      ändert sich, wer was darf? (ja/nein, was)
Meilenstein: A–E
```

**Größe:** Eine Aufgabe = ein Pull Request = möglichst eine Sitzung. Richtwert: höchstens ein paar hundert geänderte Zeilen. Größeres zerlegt Claude vorher in Teil-Issues und schlägt die Reihenfolge vor.

## 4. Regeln für Claude in jeder Sitzung

1. **Zuerst lesen:** `CLAUDE.md`, das Issue, betroffene Doku. Bei Unklarheit fragen statt raten.
2. **Branch** `feature/<Issue-Nr>-<kurz>`, z. B. `feature/14-absage-grund`.
3. **Pull Request nach Vorlage:**
   - Was und warum (zwei, drei Sätze ohne Fachbegriffe)
   - Wie getestet (welche Tests, was auf Pre ausprobieren)
   - Datenbank geändert? (ja/nein – wenn ja: abwärtskompatibel?)
   - Rechte oder Sicherheit betroffen? (ja/nein – was)
   - Automatik (`.github/workflows/`) geändert? (ja/nein – wenn ja, deutlich hervorgehoben)
   - Rückweg, falls es auf Pro Probleme macht
   - `Refs #<Issue>`
4. **Doku im selben Pull Request** aktualisieren (Backlog, Betrieb, Architektur – was betroffen ist).
5. **Kritische Teile erklären:** Rechte, Datenbank, Mail-Ausgang, Belegungskonflikte – in einfachen Worten, mit Beispiel.
6. **Am Ende** den Link zum Pull Request nennen und sagen, was du auf Pre ausprobieren sollst.
7. **Neue Entscheidungen** (Werkzeug, Dienst, Regel) nicht still treffen, sondern vorschlagen; nach deiner Zustimmung ins Entscheidungsprotokoll.

## 5. Durchsehen ohne Entwickler zu sein – fünf Prüffragen

1. **Ist die automatische Prüfung grün?** Rot = nicht mergen, Claude Bescheid geben.
2. **Verstehe ich die Beschreibung?** Wenn nicht: „Erklär mir das einfacher“ – das ist ausdrücklich erwünscht.
3. **Wird die Datenbank geändert?** Dann kurz nachfragen, ob alte App-Versionen weiter funktionieren.
4. **Werden Rechte oder die Automatik geändert?** Dann genau lesen und im Zweifel eine zweite Meinung einholen (z. B. ChatGPT mit dem Pull-Request-Link).
5. **Passt es zu den Prinzipien?** Klick-Budget, keine neue Seite ohne Grund, nichts vereinsspezifisch fest eingebaut.

Den Code Zeile für Zeile zu lesen ist **nicht** nötig. Die Sicherheit liegt in den automatischen Tests und den Datenbankregeln; deine Prüfung ist die fachliche.

## 6. Einrichtung der Dienste

Für jede Einrichtung (Supabase-Projekt, Cloudflare, Brevo, Better Stack, GitHub-Einstellungen) gibt es ein eigenes Issue mit einer **Schritt-für-Schritt-Anleitung von Claude**: wo klicken, was eintragen, wie prüfen.

- **Du** legst Konten an, klickst Einstellungen und trägst Zugangsdaten **direkt im jeweiligen Dienst bzw. in GitHub → Settings → Secrets** ein.
- **Zugangsdaten nie in den Chat, nie in ein Issue, nie in eine Datei.** Claude braucht sie nicht – nur ihre Namen.
- Danach kurz im Issue bestätigen („erledigt“), Claude prüft über die Pipeline, ob alles ankommt.

## 7. Wo was steht

| Frage | Ort |
|---|---|
| Was ist gerade in Arbeit, was ist auf Pre, was ist live? | GitHub-Board „Migration Supabase“ |
| Wie läuft Platzcoach, wie wird ausgerollt? | `docs/BETRIEB.md` |
| Wie ist der Code aufgebaut? | `docs/ARCHITEKTUR.md` |
| Welche Regeln gelten? | `docs/PRINZIPIEN.md` |
| Warum haben wir das so entschieden? | Entscheidungsprotokoll im Claude-Projekt |
| Diskussion, Fragen, Ideen | Chat mit Claude; Ergebnis landet als Issue oder Entscheidung |

## 8. Rhythmus

- Kein fester Takt, keine Sprints. Gearbeitet wird, wann du Zeit hast.
- **Wochenblick jeden Sonntag gegen 19 Uhr:** Eine geplante Aufgabe von Claude schickt dir per Push und Mail eine Zusammenfassung – was live ging, was auf Pre auf deine Abnahme wartet, was in Arbeit ist, was hängt und was als Nächstes dran ist. Sie liest nur und ändert nichts. Danach 10 Minuten Blick aufs Board.
- Pro Woche höchstens **ein Release-Kandidat** gleichzeitig auf Pre in Abnahme (siehe `BETRIEB.md`).

## 9. Wenn etwas schiefgeht

| Situation | Was tun |
|---|---|
| Automatische Prüfung rot | Nicht mergen, Claude in der Sitzung Bescheid geben |
| Fehler auf Pre | Normal – genau dafür ist Pre da. Issue kommentieren, Claude korrigiert |
| Fehler auf Pro | Notfallplan in `BETRIEB.md` Abschnitt 8; zuerst Frontend in Cloudflare zurücksetzen |
| Claude ist sich unsicher oder etwas wirkt riskant | Claude stoppt und fragt; im Zweifel zweite Meinung einholen |
