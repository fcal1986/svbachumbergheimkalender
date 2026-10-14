# Platzcoach – Produktprinzipien

Diese Grundsätze gelten für jedes neue Feature und jede Änderung. Bei Zweifel gilt: lieber weglassen.

## Die Kernfrage

> **Wer nutzt wann welche Anlage – und gibt es einen Konflikt?**

Ein Feature gehört nur dann in Platzcoach, wenn es diese Frage besser beantwortet oder eine Aufgabe rund um diese Frage schneller erledigt. Alles andere (Vereinsverwaltung, Finanzen, Kader, Aufgaben-Boards, Postfächer) bleibt draußen.

**Bewusste Ausnahme (01.10.2026):** *Trainer-Termine* außerhalb der eigenen Anlage (z. B. DFB-Trainingsdialog, Fortbildung, Sitzung) mit Zu- und Absagen. Begründung: kein eigenes Modul, sondern eine Terminart im vorhandenen Formular; Zusagen direkt an der Karte; Hinweise über die vorhandenen Wege (Zu erledigen, Änderungsmail, Wochenmail). Weitere Ausnahmen nur mit derselben Begründung (vorhandene Bausteine, keine neue Seite).

## 1. Null Klicks vor einem Klick

- **Automatisch vor manuell.** Was sich aus fussball.de oder vorhandenen Daten ableiten lässt, wird nie eingetippt (Beispiele: Training an Spieltagen automatisch absagen, Änderungsmails bei Verlegungen, Mannschaftsabgleich).
- **Platzcoach meldet sich, wenn etwas zu tun ist.** Benachrichtigungen und Wochenmail ersetzen das regelmäßige Nachschauen.
- **Erst wenn sich etwas nicht ableiten lässt, kommt eine Bedienung dazu – und dann mit einem Klick (siehe 4).**

## 2. Jede Rolle sieht nur, was sie braucht

- **Trainer** sehen ihre Woche, ihre Mannschaften und die Aktionen dazu (absagen, verlegen, buchen). Keine Verwaltung.
- **Admins** bekommen Verwaltungsfunktionen zusätzlich – an Stellen, die Trainer nicht belasten.
- **Gäste ohne Anmeldung** sehen den Plan (siehe 6).
- Ein neues Feature legt fest, für welche Rolle es ist. Was nur Admins brauchen, erscheint bei Trainern nicht.
- **Gleiche Struktur für alle Rollen.** Jede Seite hat für Besucher, Trainer und Admins dieselbe Reihenfolge. Rollen bekommen zusätzliche Elemente an festen Stellen, nie eine umgebaute Seite.

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

| Aufgabe | Rolle | Budget | Ist (01.10.2026 · 4) | Weg | Backlog |
|---|---|---|---|---|---|
| Plan der eigenen Mannschaft ansehen | alle | 0 | ✅ 0 | Startseite „Meine Woche“ (ohne Konto einmalig Mannschaft wählen) | – |
| Konflikt lösen (Vorschlag übernehmen) | Admin | 1 | ✅ 1 | „Training … absagen“ in der Live-Karte (eigener Konflikt) oder in „Zu erledigen“; andere Konflikte: „Ansehen“ | Nr. 6, 56 |
| Training absagen | Trainer | 1 | ✅ 1 | „Training absagen“ in der Live-Karte (nächstes Training); in „Deine Woche“ ab 09.10.2026 · 1 Kachel → „Absagen“ = 2 (Rückgängig 6 s) | Nr. 49, 53 |
| Platz heute sperren | Admin | 2 | ✅ 2 | „Heute sperren“ unter dem Platz (Admin) → Grund | Nr. 5 |
| Training oder Termin anlegen | Trainer/Admin | höchstens 3 | ✅ 3 | „+ frei“ im Zeitstrahl an der gewünschten Stelle antippen → Formular mit Tag, Beginn, Ende, Mannschaft und Fläche vorbefüllt → „Termin speichern“ → „Jetzt speichern“ im Blatt „Termin prüfen“ (ab 06.10.2026 · 13, weil Speichern Mails verschickt); sonst + → Speichern → Jetzt speichern | Nr. 2, 52, 66 |
| Spielverlegung vormerken | Trainer | höchstens 3 | ⚠️ 5 | „Verlegen“ in der Live-Karte bzw. Spielkarte im Kalender (in „Deine Woche“ ab 09.10.2026 · 1 erst Kachel antippen, +1) → neues Datum (2) → Grund-Chip → „Vormerken“; das Datum kennt nur der Nutzer | Nr. 50 |
| Trainer einladen | Admin | höchstens 2 | ✅ 1 | Hinweis „Noch ohne Trainer …“ in „Zu erledigen“ (sonst Konto → Zugänge → „Per WhatsApp einladen“ = 3) | Nr. 51 |

Gezählt am Code (`index.html`) und im lokalen Browser-Test, nicht am echten Handy. Ein Datums- oder Zeitfeld zählt als 2 (öffnen + wählen); auf manchen Android-Geräten kommt „OK“ dazu. Nach jeder Änderung an einem dieser Wege die Ist-Spalte aktualisieren.

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

## 8. Technik und Betrieb (ab der Supabase-Migration)

> Beschlossen am 12.10.2026 als Planung. Gilt ab dem Start der Migration für jede Änderung. Umsetzung und Abläufe: `docs/BETRIEB.md`.

- **Rechte nur auf dem Server.** RLS ist auf jeder Tabelle an, geschrieben wird nur über `api.*`. Die Oberfläche blendet aus, sie schützt nicht. Jede Rechteänderung bekommt einen Test im selben Commit.
- **Drei getrennte Umgebungen: Dev, Pre, Pro.** Entwickelt wird nur online auf Branches (Dev = Branch + Pull Request + Tests). Jeder Stand läuft erst auf Pre (pre.platzcoach.de), dann auf Pro. Kein Release ohne grüne Tests auf Pre.
- **Jede Aufgabe ist ein Issue, jede Änderung ein Pull Request, der sein Issue schließt** („Closes #…“). So zeigt das Projekt-Board den Stand ohne Nachpflegen.
- **Claude bekommt nie Zugang zu Pro.** Claude arbeitet auf Branches; Zugangsdaten zu Pro kennt nur die Release-Pipeline. Auch Menschen ändern Pro nicht von Hand.
- **Schema nur über Migrationen im Repo.** Nur vorwärts und abwärtskompatibel: erst hinzufügen, im nächsten Release entfernen. Nie per Klick im Dashboard.
- **Keine echten Personendaten außerhalb von Pro.** Pre und Dev arbeiten mit erfundenen Testvereinen.
- **Geheimnisse nie im Client und nie im Repo.** Der Client bekommt nur URL und `anon`-Schlüssel.
- **Europäische Dienste zuerst.** Daten in der EU (Supabase Frankfurt, Scaleway). Ein Dienst außerhalb der EU nur mit AVV und Begründung im Entscheidungsprotokoll (Projekt-Doc `claude/entscheidungen.md`).
- **Keine Werbung, kein Tracking im eingeloggten Bereich.** Analyse höchstens anonym und mit Einwilligung.
- **Was nicht überwacht wird, läuft nicht.** Jeder Hintergrundjob meldet einen Heartbeat; Fehler lösen einen Alarm aus, kein Nachschauen.
- **Ein Backup zählt erst, wenn es einmal zurückgespielt wurde.**
- **Verstehen vor Übernehmen.** Kritische Teile (Rechte, Outbox, Belegungskonflikte) werden erst gemergt, wenn wir sie erklären können.

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
10. Ab der Migration: Sind Rechte auf dem Server geprüft und durch Tests abgesichert, und läuft die Änderung als Migration über Pre nach Pro?
