# Platzcoach – Produktprinzipien

Diese Grundsätze gelten für jedes neue Feature und jede Änderung. Bei Zweifel gilt: lieber weglassen.

## Die Kernfrage

> **Wer nutzt wann welche Anlage – und gibt es einen Konflikt?**

Ein Feature gehört nur dann in Platzcoach, wenn es diese Frage besser beantwortet oder eine Aufgabe rund um diese Frage schneller erledigt. Alles andere (Vereinsverwaltung, Finanzen, Kader, Aufgaben-Boards, Postfächer) bleibt draußen.

## 1. Null Klicks vor einem Klick

- **Automatisch vor manuell.** Was sich aus fussball.de oder vorhandenen Daten ableiten lässt, wird nie eingetippt (Beispiele: Training an Spieltagen automatisch absagen, Änderungsmails bei Verlegungen, Mannschaftsabgleich).
- **Platzcoach meldet sich, wenn etwas zu tun ist.** Benachrichtigungen und Wochenmail ersetzen das regelmäßige Nachschauen.
- **Erst wenn sich etwas nicht ableiten lässt, kommt eine Bedienung dazu – und dann mit einem Klick (siehe 4).**

## 2. Jede Rolle sieht nur, was sie braucht

- **Trainer** sehen ihre Woche, ihre Mannschaften und die Aktionen dazu (absagen, verlegen, buchen). Keine Verwaltung.
- **Admins** bekommen Verwaltungsfunktionen zusätzlich – an Stellen, die Trainer nicht belasten.
- **Gäste ohne Anmeldung** sehen den Plan (siehe 6).
- Ein neues Feature legt fest, für welche Rolle es ist. Was nur Admins brauchen, erscheint bei Trainern nicht.

## 3. Nicht überladen

- **Neue Funktion = keine neue Seite.** Erst prüfen, ob sie als Zeile, Chip oder Aktion in eine bestehende Ansicht passt. Eine neue Seite oder ein neuer Menüpunkt ist die Ausnahme und braucht eine Begründung.
- **Hauptnavigation bleibt klein.** Keine zusätzlichen Reiter für Nebenfunktionen, kein „Mehr“-Menü mit zehn Einträgen.
- **Keine Einstellung ohne Wirkung.** Keine Schalter „für später“ und keine Regeln, die nur greifen, wenn etwas anderes eingeschaltet ist.
- **Gute Standardwerte statt Einstellungen.** Was für 90 % der Vereine passt, wird fest vorgegeben (z. B. Spieldauer je Altersklasse). Eine Einstellung kommt erst, wenn ein echter Verein sie braucht.
- **Nur echte Probleme melden.** Warnungen und Konflikte nur, wenn jemand handeln muss. Keine Alarmmüdigkeit (Gegenbeispiel: „keine Kabine“ als Konflikt).
- **Hinweise dezent.** Banner nur, wenn sie wichtig sind, und wegklickbar; nie ein Drittel des Bildschirms.
- **Entfernen gehört dazu.** Nach jeder Saison prüfen: Was hat niemand genutzt? Das fliegt raus oder wandert ins Konto. Im Backlog wird es mit ⛔ und Begründung vermerkt.

## 4. Alles mit einem Klick

- **Ziel: eine Aufgabe = ein Klick.** Wo ein Klick nicht reicht, so wenige Schritte wie möglich, und jeder Schritt ist vorbefüllt.
- **Die Aktion steht beim Problem.** Ein Konflikt kommt mit dem Knopf, der ihn löst („Hälfte B ist frei – umbuchen“). Kein „Gehe zu Seite X und such den Termin“.
- **Vorbefüllen statt fragen.** Formulare übernehmen alles Bekannte (Tag, Uhrzeit, Fläche aus der angetippten Lücke, Mannschaft des Trainers, übliche Dauer).
- **Auswählen statt tippen.** Chips und Vorschläge statt Freitext (Dauer 60/75/90 Min, Grund der Sperre).
- **Sofort speichern, rückgängig machen statt nachfragen.** Bestätigungsdialoge nur bei Dingen, die sich nicht rückgängig machen lassen oder andere benachrichtigen.

### Klick-Budget der häufigsten Aufgaben

Gezählt wird ab der Ansicht, in der man die Aufgabe bemerkt (Startseite, Wochenansicht oder Benachrichtigung), bis zum Speichern. Ein Feature darf ein Budget nicht verschlechtern; wenn doch, steht die Begründung im Commit und im Backlog.

| Aufgabe | Rolle | Budget |
|---|---|---|
| Plan der eigenen Mannschaft ansehen | alle | 0 (Startansicht bzw. Link) |
| Konflikt lösen (Vorschlag übernehmen) | Admin | 1 |
| Training absagen | Trainer | 1 |
| Platz heute sperren | Admin | 2 |
| Training oder Termin anlegen | Trainer/Admin | höchstens 3 |
| Spielverlegung vormerken | Trainer | höchstens 3 |
| Trainer einladen | Admin | höchstens 2 |

Neue häufige Aufgaben werden hier ergänzt.

## 5. Nicht redundant bauen

- **Eine Sache – ein Ort.** Jede Information wird an genau einer Stelle gepflegt und überall nur angezeigt (z. B. Sperren, Trainingszeiten, Rollen).
- **Erst suchen, dann bauen.** Vor jedem Feature prüfen: Gibt es das schon ganz oder teilweise (Backlog-Status 🟡, vorhandene Funktionen in `index.html`)? Dann erweitern statt neu bauen.
- **Bausteine wiederverwenden.** Bestehende Komponenten und Hilfsfunktionen nutzen (Wochenleiste `cw-strip`, Konflikterkennung, Sperren `resource-locks.json`, Formulare, Toasts) statt Varianten danebenzustellen.
- **Eine Logik pro Regel.** Konflikte, Spieldauern, Flächen-Zuordnung usw. werden an einer Stelle berechnet und von App, Wochenmail und Benachrichtigungen gemeinsam genutzt.
- **Nichts nur für SVBB fest einbauen.** Kein Vereinsname, kein Platz, keine Vereins-ID und keine Koordinaten im Code. Alles Vereinsspezifische gehört in die Konfiguration (`data/config.json`, später Datenbank), damit ein zweiter Verein keine Sonderfälle braucht.

## 6. Lesen ohne Anmeldung

- **Anschauen geht immer ohne Konto** (Wochenplan, „Meine Woche“ pro Mannschaft, Kalender-Abo). Nur Ändern braucht einen Zugang.
- Kein Feature darf diese Offenheit für Konten opfern. Personenbezogene Daten (Telefon, E-Mail) erscheinen in der öffentlichen Ansicht nicht.

## 7. Intuitiv und schön

- **Handy zuerst.** Jede Ansicht muss am Telefon ohne Abschneiden und ohne Querscrollen funktionieren.
- **Klare Sprache.** Kurze deutsche Sätze, „du“, keine Fachbegriffe aus dem Code.
- **Ruhige Oberfläche.** Wenige Farben mit Bedeutung (grün = frei/ok, gelb = Hinweis, rot = Konflikt).

## Prüfliste vor jedem neuen Feature

Jede Frage muss mit Ja beantwortet sein, sonst wird das Feature angepasst oder nicht gebaut:

1. Hilft es bei der Kernfrage – oder ist ohne es die Einrichtung eines neuen Vereins nicht möglich?
2. Lässt es sich nicht vollständig automatisch lösen (null Klicks)?
3. Gibt es das noch nicht, auch nicht teilweise? Falls doch: wird das Vorhandene erweitert statt neu gebaut?
4. Ist klar, für welche Rolle es ist, und sehen andere Rollen es nicht unnötig?
5. Kommt es ohne neue Seite, neuen Menüpunkt und neue Einstellung aus (oder ist die Ausnahme begründet)?
6. Bleibt jedes Klick-Budget eingehalten, und ist alles Bekannte vorbefüllt?
7. Bleibt Lesen ohne Anmeldung möglich, und ist nichts SVBB-spezifisch fest eingebaut?
8. Funktioniert es am Handy?
9. Ist es im Backlog (`docs/BACKLOG.md`) eingetragen, und wird der Status im selben Commit aktualisiert?
