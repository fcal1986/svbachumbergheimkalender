# Platzcoach – Feature-Backlog

Quelle: Wettbewerbsanalyse VereinsNeo/PlatzNeo (Testzugang, 01.10.2026, 68 Screenshots).
Ausführliche Analyse: Projekt-Doc `claude/vereinsneo-analyse-2026-10.md`.

**Pflege:** Wird ein Punkt umgesetzt, Status hier im selben Commit ändern und Datum/Commit in „Notiz“ eintragen. Nummern bleiben fest, neue Punkte bekommen die nächste freie Nummer.

**Status:** ✅ umgesetzt · 🟡 teilweise · ⬜ offen · ⛔ bewusst nicht
**Phase:** Pilot = aktuelle Technik · 1.0 = mit Supabase/Einrichtungsassistent · Später

Letzte Aktualisierung: 01.10.2026

## Must have

| Nr. | Feature | Phase | Status | Notiz |
|---|---|---|---|---|
| 1 | Tagesansicht mit Zeitleiste je Fläche (Hälfte A/B, Halle, Kabinen) | Pilot | ⬜ | Bisher Tagesliste unter dem Wochenstreifen, keine Zeitleiste je Fläche |
| 2 | Schnell-Anlage durch Antippen einer freien Lücke | Pilot | ⬜ | Hängt an Nr. 1 |
| 3 | Sonnenuntergang und „dunkel ab …“ in Tagesansicht und Start | Pilot | ⬜ | Lokal berechnen, braucht Koordinaten in config |
| 4 | Hinweis „Tage werden kürzer“: welche Trainingszeiten ab wann im Dunkeln enden | Pilot | ⬜ | Zeitumstellung 25.10.; braucht Flutlicht-Angabe |
| 5 | Platz schnell sperren („Heute sperren“ mit Grund, schraffiert) | Pilot | 🟡 | Ressourcen-Sperren (Platz/Halle/Eigene) mit Warnung gibt es im Konto; fehlt: Schnellaktion, Grund-Auswahl, Darstellung im Plan |
| 6 | Konflikte mit konkretem Lösungsvorschlag und Direkt-Aktion | Pilot | 🟡 | Konflikte werden erkannt und angezeigt; Lösungsvorschlag mit Ein-Klick-Aktion fehlt |
| 7 | Dauer-Chips im Formular (60/75/90/105/120 Min) | Pilot | ⬜ | |
| 8 | Mannschaft zuerst wählen, danach passende Fläche vorschlagen | Pilot | ⬜ | |
| 9 | Zeitpunkt des letzten fussball.de-Abgleichs anzeigen | Pilot | 🟡 | Stand steht bei „Automatisch von fussball.de übernommen“ und im Mannschaftsabgleich; fehlt: global sichtbar, Warnung wenn > 6 h alt |
| 10 | Hinweis „kein Angebot des DFB, nur öffentliche Daten auf Veranlassung des Vereins“ | Pilot | ⬜ | |
| 11 | Verein über fussball.de finden | 1.0 | ⬜ | Einrichtungsassistent |
| 12 | Spielorte zuordnen: Gehört uns / Fremde Anlage / Später | 1.0 | 🟡 | Pilot: `homeVenues`/`foreignVenue`-Logik für SVBB; Auswahl im Assistenten fehlt |
| 13 | Teilplätze aus fussball.de-Spielortnamen anlegen | 1.0 | ⬜ | |
| 14 | Einrichtungs-Checkliste mit Fortschritt auf der Startseite | 1.0 | ⬜ | |
| 15 | Platz-Eigenschaften: Belag, Flutlicht, Nutzung, Kürzel | 1.0 | ⬜ | |
| 16 | DFBnet-Spielplan per Datei importieren (Plan B ohne fussball.de-Abruf) | Später | ⬜ | Exportformat klären |
| 43 | Mannschaften mit Lücken-Filtern („ohne Trainer“, „ohne Trainingszeit“, „ohne Platzfreigabe“) | Pilot | ⬜ | „Termine heute ohne Trainer“ gibt es als Warnzeile; Filter in der Mannschaftsliste fehlen |

## Nice to have

| Nr. | Feature | Phase | Status | Notiz |
|---|---|---|---|---|
| 17 | Wochenleiste mit Zahlen und Konfliktpunkten auf der Startseite (Admin) | Pilot | 🟡 | Wochenleiste (`cw-strip`) im Kalender vorhanden; Zahlen/Konfliktpunkte und Startseiten-Variante fehlen |
| 18 | Verfügbarkeitszeile im Formular („2 von 4 Vierteln frei · Kabinen 3 von 4 frei“) | Pilot | ⬜ | |
| 19 | Spielformat und Spielende auf Spielkarten (11v11, 9v9 …) | Pilot | ⬜ | Spieldauer je Altersklasse ist intern vorhanden |
| 20 | Druckansicht für Woche und Tag (Aushang) | Pilot | ⬜ | |
| 21 | TV-Modus für Bildschirm im Vereinsheim | Später | ⬜ | |
| 22 | „Feedback geben“ im Konto | Pilot | ⬜ | |
| 23 | Getrennte Puffer für Kabine und Platz (Umziehen/Duschen) | 1.0 | ⬜ | |
| 24 | Räume & Geräte mit Kapazität (Veo-Kamera, Vereinsbus) | 1.0 | ⬜ | |
| 25 | Rollen-Kontakte (Jugendleiter, Platzwart, Schiri-Obmann) | 1.0 | ⬜ | |
| 26 | Rangfolge und Wunschplatz je Mannschaft (ab mehreren Plätzen) | 1.0 | ⬜ | |
| 27 | Testphase als dezente, wegklickbare Zeile | 1.0 | ⬜ | |
| 28 | Verteilung als Vorschlag für den Winterplan (ohne Automatik) | Später | ⬜ | |
| 29 | Dunkles Design | Später | ⬜ | |
| 44 | Aufgaben im Verein als Mehrfachauswahl (Trainer, Co-Trainer, Betreuer, Platzwart …) | 1.0 | ⬜ | Ergänzt Nr. 25 |
| 45 | Person anlegen ohne Zugang (Einladung optional) | 1.0 | ⬜ | |
| 46 | Personen per CSV/Excel importieren | 1.0 | ⬜ | |
| 47 | Co-Trainer und Betreuer bekommen automatisch ihre Mannschaften | 1.0 | ⬜ | |

## Not important

| Nr. | Feature | Status | Notiz |
|---|---|---|---|
| 30 | Wetter im Kopf | ⬜ | |
| 31 | Geländeskizze („Auf dem Gelände zeigen“) | ⬜ | Erst bei mehreren Plätzen |
| 32 | Hallenmeldung / Hallenkontingent | ⬜ | Bei SVBB nachfragen |
| 33 | Anträge statt Direktbuchung | ⬜ | Höchstens als Vereinseinstellung |
| 34 | Nachweise mit Ablaufdatum (Führungszeugnis, Lizenz) | ⬜ | |
| 35 | CSV-Export | ⬜ | |
| 36 | Vollautomatische Verteilung (Rotation, Fairness, Winterfaktor) | ⛔ | |
| 37 | Aufgaben-Board | ⛔ | |
| 38 | Bestellungen und Erstattungen | ⛔ | |
| 39 | Leitlinien und Leitbild-Karten | ⛔ | |
| 40 | Kader und Bewertung (TalentNeo) | ⛔ | |
| 41 | Posteingang / Postfach | ⛔ | |
| 42 | Fehlende Kabine als Konflikt werten | ⛔ | |
| 48 | Benachrichtigungen als Grobwahl E-Mail/Keine | ⛔ | Unsere Kategorien sind feiner |

## Bereits vorhanden (Bestätigung durch VereinsNeo)

- Trainer per Link einladen, Freigabe und Vergabe von Rolle/Mannschaft
- Ressourcen-Sperren mit Warnung statt automatischer Absage
- Mannschaftsabgleich mit fussball.de
