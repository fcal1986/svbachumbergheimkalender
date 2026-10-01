# Platzcoach – Produktprinzipien

Diese Grundsätze gelten für jedes neue Feature und jede Änderung. Bei Zweifel gilt: lieber weglassen.

## Die Kernfrage

> **Wer nutzt wann welche Anlage – und gibt es einen Konflikt?**

Ein Feature gehört nur dann in Platzcoach, wenn es diese Frage besser beantwortet, eine Aufgabe rund um diese Frage schneller erledigt oder neuen Vereinen den Einstieg erleichtert. Alles andere (Vereinsverwaltung, Finanzen, Kader, Aufgaben-Boards, Postfächer) bleibt draußen.

## 1. Nicht überladen

- **Neue Funktion = keine neue Seite.** Erst prüfen, ob sie als Zeile, Chip oder Aktion in eine bestehende Ansicht passt. Eine neue Seite oder ein neuer Menüpunkt ist die Ausnahme und braucht eine Begründung.
- **Hauptnavigation bleibt klein.** Keine zusätzlichen Reiter für Nebenfunktionen, kein „Mehr“-Menü mit zehn Einträgen.
- **Keine Einstellung ohne Wirkung.** Wir bauen keine Schalter „für später“ und keine Regeln, die nur greifen, wenn etwas anderes eingeschaltet ist.
- **Gute Standardwerte statt Einstellungen.** Was für 90 % der Vereine passt, wird fest vorgegeben (z. B. Spieldauer je Altersklasse). Eine Einstellung kommt erst, wenn ein echter Verein sie braucht.
- **Nur echte Probleme melden.** Warnungen und Konflikte nur, wenn jemand handeln muss. Keine Alarmmüdigkeit (Gegenbeispiel: „keine Kabine“ als Konflikt).
- **Hinweise dezent.** Banner nur, wenn sie wichtig sind und wegklickbar; nie ein Drittel des Bildschirms.

## 2. Nicht redundant bauen

- **Eine Sache – ein Ort.** Jede Information wird an genau einer Stelle gepflegt und überall nur angezeigt (z. B. Sperren, Trainingszeiten, Rollen).
- **Erst suchen, dann bauen.** Vor jedem Feature prüfen: Gibt es das schon ganz oder teilweise (Backlog-Status 🟡, vorhandene Funktionen in `index.html`)? Dann erweitern statt neu bauen.
- **Bausteine wiederverwenden.** Bestehende Komponenten und Hilfsfunktionen nutzen (Wochenleiste `cw-strip`, Konflikterkennung, Sperren `resource-locks.json`, Formulare, Toasts) statt Varianten danebenzustellen.
- **Eine Logik pro Regel.** Konflikte, Spieldauern, Flächen-Zuordnung usw. werden an einer Stelle berechnet und von App, Wochenmail und Benachrichtigungen gemeinsam genutzt.

## 3. Alles mit einem Klick

- **Ziel: eine Aufgabe = ein Klick.** Wo ein Klick nicht reicht, so wenige Schritte wie möglich, und jeder Schritt ist vorbefüllt.
- **Die Aktion steht beim Problem.** Ein Konflikt kommt mit dem Knopf, der ihn löst („Hälfte B ist frei – umbuchen“). Kein „Gehe zu Seite X und such den Termin“.
- **Vorbefüllen statt fragen.** Formulare übernehmen alles, was schon bekannt ist (Tag, Uhrzeit, Fläche aus der angetippten Lücke, Mannschaft des Trainers, übliche Dauer).
- **Auswählen statt tippen.** Chips und Vorschläge statt Freitext (Dauer 60/75/90 Min, Grund der Sperre).
- **Sofort speichern, rückgängig machen statt nachfragen.** Bestätigungsdialoge nur bei Dingen, die sich nicht rückgängig machen lassen oder andere benachrichtigen.

## 4. Intuitiv und schön

- **Handy zuerst.** Jede Ansicht muss am Telefon ohne Abschneiden und ohne Querscrollen funktionieren.
- **Klare Sprache.** Kurze deutsche Sätze, „du“, keine Fachbegriffe aus dem Code.
- **Ruhige Oberfläche.** Wenige Farben mit Bedeutung (grün = frei/ok, gelb = Hinweis, rot = Konflikt).

## Prüfliste vor jedem neuen Feature

Jede Frage muss mit Ja beantwortet sein, sonst wird das Feature angepasst oder nicht gebaut:

1. Hilft es bei der Kernfrage oder beim Einstieg neuer Vereine?
2. Gibt es das noch nicht, auch nicht teilweise? Falls doch: wird das Vorhandene erweitert statt neu gebaut?
3. Kommt es ohne neue Seite, neuen Menüpunkt und neue Einstellung aus (oder ist die Ausnahme begründet)?
4. Ist die häufigste Aufgabe damit mit einem Klick erledigt?
5. Ist alles Bekannte vorbefüllt?
6. Funktioniert es am Handy?
7. Ist es im Backlog (`docs/BACKLOG.md`) eingetragen und wird der Status im selben Commit aktualisiert?
