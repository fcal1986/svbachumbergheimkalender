# Pilot #139 – Tagesleiste bis Saisonende

Stand: 11.11.2026 · 2, Feature-PR #140 (noch nicht produktiv).

## Was sich ändert
- Die vorhandene Tagesleiste der **Startseite** bleibt gleich gestaltet. „Heute“ steht fest links; **rechts** lassen sich die Tage per Finger horizontal durchblättern. Die sichtbaren Tageskacheln nutzen dieselben Symbole, Punkte und Hallenzuteilungs-Hinweise wie bisher.
- Die Auswahl reicht von **Heute bis zum Ende der aktuell laufenden Saison**, ermittelt aus `data/seasons.json` (`from`/`to`). Für 2026/27 ist das der 30.06.2027. **Der Hallenplan bis 31.03.2027 ist nicht die Grenze.**
- Nur **Antippen**, nicht Wischen, wählt einen anderen Tag. Dann aktualisieren sich die bestehende Platz-/Hallenansicht und die Zeitleiste. Der zuletzt gewählte Spielort bleibt nur gültig, wenn er an diesem Tag tatsächlich zur Verfügung steht. Ressourcen anderer Orte bleiben durch den Filter aus PR #137 unsichtbar.
- Die erste Kachel („Heute“ bzw. „↺ Jetzt“) setzt auf **heute, aktuelle Uhrzeit und den Anfang der Tagesleiste** zurück. Die separate persönliche Wochenliste („Deine Woche“) bleibt unverändert bei **sieben Tagen**.
- Um Hunderte Tageskacheln nicht sofort zu berechnen, werden zuerst maximal **28 Tage** gerendert und beim Scrollen nahe dem Ende jeweils bis zu **14 weitere** angehängt. Es gibt keinen neuen Daten-Cache; die bei App-Start geladenen Termine und Regeltrainings bleiben die Datenquelle.
- Unterhalb der Tagesleiste bleiben Zeitleiste, „+ frei“, Hallendrittel, bisherige Rechte und Speicherwege unverändert. Keine neue Navigation oder Schaltfläche.

## Technische Stellen
- `index.html`: `.stw-strip` als 7-Spalten-Grid; fixe erste Kachel; rechts `.stw-strip-scroll` mit horizontalem nativen Scrollen, vertikales Scrollen der Seite bleibt möglich.
- `startSeasonEnd()` und `startStripTotalDays()`: Saisonende inklusive, ohne fest codiertes Jahr. Ohne aktuell gültige Saison keine unbegrenzte Zukunftsauswahl.
- `startStripDayHTML()`, `startStripScroll()`: einheitliche Darstellung, begrenzte inkrementelle Ergänzung, Spielort-/Hallenmarkierungen pro Datum.
- `setStartDay()`, `shiftStartDay()`: Auswahl und Zeitleisten-Tagesrandswipe nicht mehr nach sieben Tagen, sondern bis Saisonende begrenzt.
- `startJumpNow()`: Kachel und Zeitzeiger zurücksetzen; `renderMyWeek()` erhält die Scrollposition bei einer Tagesauswahl.

## Abnahmeszenarien
1. **375 px / ohne Login:** „Heute“ bleibt beim horizontalen Wischen fest. Weitere Tage bis zum 23.11.2026 und darüber hinaus werden sichtbar; das Wischen allein ändert nicht den gewählten Tag.
2. **20.11.2026:** SUG wird als Spielort angeboten, SUG-Hallenzeit ausschließlich dort; Höllenbergkampfbahn zeigt nur Außenplatz/Kleinspielfeld. Nach Auswahl der Halle kein Außenplatz im Hallenbild.
3. **„Heute“ tippen:** ursprüngliche Tage ab heute, aktuelle Uhrzeit, Leiste ganz links. Die persönliche Sieben-Tage-Wochenübersicht bleibt unverändert.
4. **Weit wischen:** weitere Tagesblöcke werden nachgeladen; keine großen leeren Spalten, keine eingefrorene Tagesleiste.
5. **30.06.2027:** noch auswählbar, **01.07.2027** nicht; Jahreswechsel und Monatsgrenzen werden korrekt angezeigt.
6. Zeitleiste hat weiterhin eigenständige horizontale Geste (Zeit und Tagesrand), senkrechtes Scrollen der Startseite funktioniert. Keine Speichern- oder Mail-Aktionen im Test.

Automatische Browserprüfungen: `tests/venue-browser.mjs` (375 px) zusätzlich zum bisherigen Hallen-/Formulartest. GitHub Actions: `.github/workflows/pilot-hall-check.yml`, **neuer Workflow nicht erforderlich**.

## Risiken und Rückweg
Die Anpassung ist **rein clientseitig und nur lesend**. Keine Änderungen an `data/`, Trainings, Ressourcen oder Benachrichtigungen. Die Pilot-Rechte bleiben clientseitig umgehbar; JSON und Git-Historie sind öffentlich, daher keine neuen Personendaten hinzufügen.

Nicht auf die Pilot-Produktionsseite mergen, bevor Browser-CI und unabhängige Prüfung grün bzw. abgeschlossen sind. Rückweg: PR #140 reversieren; Daten sind unverändert.

Nach Pilotabnahme folgt die mandantenfähige Übertragung in [Platzcoach-Neubau #182](https://github.com/fcal1986/platzcoach/issues/182) (abhängig von Spielort-/Hallenplanung #181).
