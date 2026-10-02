# Platzcoach – Feature-Backlog

Quelle: Wettbewerbsanalyse VereinsNeo/PlatzNeo (Testzugang, 01.10.2026, 68 Screenshots).
Ausführliche Analyse: Projekt-Doc `claude/vereinsneo-analyse-2026-10.md`.

**Grundsätze:** Jeder Punkt wird nach `docs/PRINZIPIEN.md` gebaut – null Klicks vor einem Klick, Rollen, nicht überladen, Klick-Budgets, nicht redundant, Lesen ohne Anmeldung. Die Prüfliste dort gilt vor jedem Feature.

**Pflege:** Wird ein Punkt umgesetzt, Status hier im selben Commit ändern und Datum/Commit in „Notiz“ eintragen. Nummern bleiben fest, neue Punkte bekommen die nächste freie Nummer.

**Status:** ✅ umgesetzt · 🟡 teilweise · ⬜ offen · ⛔ bewusst nicht
**Phase:** Pilot = aktuelle Technik · 1.0 = mit Supabase/Einrichtungsassistent · Später

Letzte Aktualisierung: 01.10.2026 (Version 01.10.2026 · 5)

## Must have

| Nr. | Feature | Phase | Status | Notiz |
|---|---|---|---|---|
| 1 | Tagesansicht mit Zeitleiste je Fläche (Hälfte A/B, Halle, Kabinen) | Pilot | 🟡 | 01.10.2026 · 2: Zeitleiste je Fläche auf der Startseite („Platz an diesem Tag“, Viertel-Spuren + Kleinspielfeld/Halle, Blöcke antippbar). Offen: dieselbe Ansicht im Kalender |
| 2 | Schnell-Anlage durch Antippen einer freien Lücke | Pilot | ✅ | 01.10.2026 · 4: „+ frei“ im Zeitstrahl (je Spur, Lücken ab 60 Min) → Kurzauswahl Training/Spiel/Termin, Mannschaft, Beginn (angetippte Stelle), Dauer-Chips → Buchen. Trainer für eigene Mannschaften, Admins für alle; 01.10.2026 · 9: Lücken ab 30 Min; die Kurzauswahl entfällt – „+ frei“ öffnet das normale Formular, vorbefüllt (Tag, Beginn, Ende bis zur nächsten Belegung bzw. übliche Dauer, Mannschaft, Training, Fläche der Spur); Zurück und Speichern führen an dieselbe Stelle der Zeitleiste |
| 3 | Sonnenuntergang und „dunkel ab …“ in Tagesansicht und Start | Pilot | ✅ | 01.10.2026 · 2: Sonnenuntergang als Linie in der Zeitleiste, berechnet aus data/config.json → venue (lat/lon) |
| 4 | Hinweis „Tage werden kürzer“: welche Trainingszeiten ab wann im Dunkeln enden | Pilot | ⛔ | Nicht nötig: Höllenbergkampfbahn hat Flutlicht auf dem ganzen Platz (Antwort 01.10.2026). Bei Vereinen ohne Flutlicht wieder aufnehmen (venue.floodlight) |
| 5 | Platz schnell sperren („Heute sperren“ mit Grund, schraffiert) | Pilot | ✅ | 01.10.2026 · 1: „Heute sperren“ + Grund-Chips + Aufheben mit Rückgängig; 01.10.2026 · 2: Sperre schraffiert in Live-Karte und Zeitleiste, „Heute sperren“ in der Tageskarte (Admin) |
| 6 | Konflikte mit konkretem Lösungsvorschlag und Direkt-Aktion | Pilot | 🟡 | ✅ 01.10.2026 · 1: Training gegen Spiel/Termin → Knopf „Training … absagen“ direkt in „Zu erledigen“ (1 Klick + Rückgängig). Offen: Vorschläge für andere Konfliktarten (z. B. freie Hälfte); 01.10.2026 · 2: Lösung auch direkt in der Live-Karte („Überschneidung mit …“ + Absagen) |
| 7 | Dauer-Chips im Formular (60/75/90/105/120 Min) | Pilot | 🟡 | 01.10.2026 · 4: Dauer-Chips (60/75/90/120) in der Kurzbuchung aus dem Zeitstrahl. Offen: im großen Formular |
| 8 | Mannschaft zuerst wählen, danach passende Fläche vorschlagen | Pilot | 🟡 | Teilweise mit Nr. 52: Formular startet mit der eigenen Mannschaft und deren üblicher Fläche; ist sie belegt, wird eine freie gleicher Größe gewählt |
| 9 | Zeitpunkt des letzten fussball.de-Abgleichs anzeigen | Pilot | 🟡 | Stand steht bei „Automatisch von fussball.de übernommen“ und im Mannschaftsabgleich; fehlt: global sichtbar, Warnung wenn > 6 h alt |
| 10 | Hinweis „kein Angebot des DFB, nur öffentliche Daten auf Veranlassung des Vereins“ | Pilot | ⬜ | |
| 11 | Verein über fussball.de finden | 1.0 | ⬜ | Einrichtungsassistent |
| 12 | Spielorte zuordnen: Gehört uns / Fremde Anlage / Später | 1.0 | 🟡 | Pilot: `homeVenues`/`foreignVenue`-Logik für SVBB; Auswahl im Assistenten fehlt |
| 13 | Teilplätze aus fussball.de-Spielortnamen anlegen | 1.0 | ⬜ | |
| 14 | Einrichtungs-Checkliste mit Fortschritt auf der Startseite | 1.0 | ⬜ | |
| 15 | Platz-Eigenschaften: Belag, Flutlicht, Nutzung, Kürzel | 1.0 | 🟡 | 01.10.2026 · 2: Standort und Flutlicht in data/config.json → venue. Offen: Belag, Nutzung, Kürzel je Platz (1.0) |
| 16 | DFBnet-Spielplan per Datei importieren (Plan B ohne fussball.de-Abruf) | Später | ⬜ | Exportformat klären |
| 49 | Training absagen direkt aus der Zeile in „Meine Woche“ (1 Klick + Rückgängig statt Datums-Dialog) | Pilot | ✅ | 01.10.2026 · 1: „Absagen“ in jeder Trainingszeile von „Meine Woche“, ebenso an der Kalenderkarte und im Konflikt-Hinweis; „Zurücknehmen“ bei abgesagten. Gespeichert wird erst nach 6 s (Rückgängig = keine Mail). Klick-Budget 1 ✅ |
| 50 | Verlegung schneller vormerken: Grund als Chips (Ferien, Spielermangel, Platz gesperrt, Sonstiges), Datum aus Ansetzungssuche vorschlagen | Pilot | ✅ | 01.10.2026 · 1: „Verlegen“ direkt in der Spielzeile, Grund als Chips. Klick-Budget 5, davon 2 für das neue Datum (lässt sich nicht vorbefüllen); über die Ansetzungssuche ist es vorbefüllt |
| 51 | Trainer einladen mit einem Klick: Link automatisch erzeugen, „Per WhatsApp teilen“ auch bei Mannschaften ohne Trainer | Pilot | ✅ | 01.10.2026 · 1: Hinweis in „Zu erledigen“ für Admins, wenn Mannschaften keinen Trainer haben → 1 Klick erzeugt Link und teilt per WhatsApp („Nicht jetzt“ blendet aus, bis sich die Liste ändert). In Konto → Zugänge „Per WhatsApp einladen“ ohne vorheriges Link-Erzeugen |
| 52 | Formular vorbefüllen: Datum aus der aktuellen Kalenderansicht, Mannschaft des Trainers, übliche Trainingszeit der Mannschaft, Anlass automatisch | Pilot | ✅ | 01.10.2026 · 1: Datum aus dem gewählten Kalendertag, eigene Mannschaft, Terminart Training, Anlass automatisch, übliche Zeit/Fläche aus der Trainingszeit. Klick-Budget: + → Speichern = 2 (heute), aus dem Kalender 3 ✅ |
| 53 | Live-Karte oben: „Läuft gerade“ mit Platz von oben (je Fläche eigene Endzeit + Fortschritt) bzw. „Als Nächstes“ + klein „Jetzt auf dem Platz“ | Pilot | ✅ | 01.10.2026 · 2; 01.10.2026 · 5: Platz jetzt als eigener Abschnitt unter der Karte (Karte = Termin + Absagen); 01.10.2026 · 6: siehe Nr. 63 |
| 54 | Kleinspielfeld und Halle sichtbar: eigenes Feld in der Live-Karte, eigene Spuren in der Zeitleiste – nur wenn belegt | Pilot | ✅ | 01.10.2026 · 2 |
| 55 | Block in der Zeitleiste antippen → Detailblatt (Mannschaft, Zeit, Fläche, Trainer-Kontakt, „Im Kalender“) | Pilot | ✅ | 01.10.2026 · 2 |
| 56 | Eigener Konflikt in der Live-Karte mit Ein-Klick-Lösung (nicht doppelt in „Zu erledigen“) | Pilot | ✅ | 01.10.2026 · 2 |
| 57 | Besucher: Favoriten oben (ohne Anmeldung, auf dem Gerät), erster Besuch mit Auswahl direkt oben, „Nicht jetzt“ zeigt den ganzen Platz | Pilot | ✅ | 01.10.2026 · 2 |
| 58 | Startseite Admin: gleiche Reihenfolge wie für alle, zusätzlich „Heute sperren“ in der Tageskarte | Pilot | ✅ | 01.10.2026 · 2; 01.10.2026 · 3: Admin-Platz nicht mehr oben, sondern wie bei allen (Feedback: gleiche Struktur mit und ohne Anmeldung); 01.10.2026 · 5: Zahlen-Kacheln entfernt (überflüssig) |
| 59 | Saison-Konflikte auf der Startseite als eine Zeile (aufklappbar) statt langer Liste | Pilot | ✅ | 01.10.2026 · 2 |
| 60 | Besucher ohne Anmeldung: „Neu“ in der unteren Leiste ausblenden (Mockup), stattdessen „Anmelden“ oben | Pilot | ⬜ | Aus dem Startseiten-Mockup, noch nicht umgesetzt |
| 61 | Zeitstrahl wischen: 4 Std sichtbar, Wischen scrollt durch den Tag (8–22 Uhr), am Rand weiter zum nächsten/vorigen Tag | Pilot | ✅ | 01.10.2026 · 4; 01.10.2026 · 5: Pfeile ‹ › am Tagestitel entfernt – Tage-Kacheln und Wischen reichen; 01.10.2026 · 18: Wisch-Hinweis – am Tagesanfang/-ende zeigt die Zeitleiste „‹ Sa 3.10.“ bzw. „Mo 5.10. ›“ mit „weiterwischen“ (auch antippbar) |
| 62 | „Woche“ ohne Favoriten: alle Termine des Vereins der nächsten 7 Tage (vorher nur mit Favoriten wählbar) | Pilot | ✅ | 01.10.2026 · 4; 01.10.2026 · 8: Schalter entfällt, Woche steht immer unter dem Platz (Nr. 65) |
| 63 | „Jetzt auf dem Platz“ auf einen Blick: Status Frei / Teilweise belegt / Belegt / Gesperrt, belegte Viertel als volle Blöcke mit Mannschaft, Ende und Fortschritt, freie Viertel mit „frei bis“, Liste „belegt von“ (Mannschaft, Fläche, Trainer, Ende; antippen = Details) | Pilot | ✅ | 01.10.2026 · 6; 01.10.2026 · 7: Liste „belegt von“ entfällt – Blöcke im Feld antippen = Details, wer wann spielt zeigt die Zeitleiste (Nr. 64) |
| 64 | Feld und Zeitleiste als ein Baustein: Zeitleiste direkt unter dem Feld, Wischen verschiebt die Uhrzeit (Strich in der Mitte), das Feld zeigt die Belegung zu dieser Uhrzeit, „Jetzt“ springt zurück; Tage und Tag/Woche darunter; „Zu erledigen“ über dem Platz | Pilot | ✅ | 01.10.2026 · 7; 01.10.2026 · 8: Tage wieder oben, siehe Nr. 65; 01.10.2026 · 17: behoben „NaN:NaN“ in der Zeitleiste nach Öffnen über einen geteilten Link (Scrollen bei ausgeblendeter Startseite) |
| 65 | Platz-Baustein ohne Kopfzeile: Tagesleiste oben (Datum), Uhrzeit am Strich der Zeitleiste, „Heute“-Kachel = Jetzt-Knopf („↺ Jetzt“ nach dem Wischen), Frei/Belegt als Schild im Feld; darunter immer die Woche als Liste ohne Tag/Woche-Schalter, gewählter Tag markiert; Vereinswoche ohne Favoriten 8 Zeilen + „Alle anzeigen“ | Pilot | ✅ | 01.10.2026 · 8 |
| 66 | Ein Formular zum Buchen: „+ frei“ in der Zeitleiste (ab 30 Min) öffnet „Neuer Termin“ mit allem Bekannten vorbefüllt; „‹ Zurück zum Platz“ bzw. Zurück-Taste und Speichern führen zurück an dieselbe Stelle | Pilot | ✅ | 01.10.2026 · 9; 01.10.2026 · 10: „‹ Zurück“ immer im Formular (auch über „Neu“), führt dorthin, woher man kam (Platz, Kalender …) an dieselbe Stelle; „+ frei“ zeigt die ganze freie Zeit, heute ab der laufenden Viertelstunde (vorher erst ab der nächsten) |
| 67 | Kalender: „Torwarttraining“ immer im Mannschaftsfilter (trifft jedes Torwarttraining); statt „Ganze Woche als Liste“ unter dem gewählten Tag „Danach“ mit den nächsten 7 Terminen (über Wochengrenzen, mit Filter, leere Tage übersprungen), „Nächste 7 Termine“ verlängert | Pilot | ✅ | 01.10.2026 · 11 |
| 68 | Kalender-Filter nach Art statt Herkunft: „Alle · Training · Spiele“ statt „fussball.de“; Spiele = Liga, eigene Freundschaftsspiele und Turniere (Heim und auswärts), mit Mannschaftsauswahl kombinierbar. Behebt: eigenes, bei fussball.de angesetztes Spiel fehlte im fussball.de-Filter | Pilot | ✅ | 01.10.2026 · 12 |
| 69 | Termin weiterleiten für alle (auch ohne Anmeldung): Teilen-Symbol an jeder Karte im Kalender (Spiele inkl. fussball.de und auswärts, Training, Termine, abgesagt/ausgefallen/verlegt) → kurze Nachricht (wer gegen wen, wann, wo, Ansprechpartner ohne Telefon) mit Direktlink → „Per WhatsApp“ oder „Link kopieren“ | Pilot | ✅ | 01.10.2026 · 14 |
| 70 | Trainer-Termine mit Zusagen (z. B. DFB-Trainingsdialog): neue Terminart im Formular (Ort, kein Platz), jeder Trainer darf anlegen; an der Karte „Ich komme“ / „Ich komme nicht“; Namen der Zusagen öffentlich; offene Antworten in „Zu erledigen“ (beide Knöpfe) und Wochenmail; beim Anlegen Mail an alle Trainer; Weiterleiten mit „Dabei: …“. Bewusste Ausnahme in PRINZIPIEN.md | Pilot | ✅ | 01.10.2026 · 15; 01.10.2026 · 16: Angemeldete sehen auch die Namen der Absagen (öffentlich nur Anzahl); behoben: schnelles Umschalten Zusage/Absage konnte den letzten Tipp verlieren (Speichern übernimmt jetzt Änderungen während des Hochladens) |
| 71 | Push-Benachrichtigungen aufs Handy für angemeldete Zugänge: Schalter pro Gerät im Konto (unabhängig von der E-Mail), einmaliger Hinweis in „Zu erledigen“; gleiche Regeln wie die Änderungsmail (Absagen, Verlegungen, neue Termine, fussball.de-Hinweise inkl. Konflikte) plus tägliche Erinnerung an offene Zusagen (2 Tage vorher). Push-Adressen verschlüsselt im Repo, Secret VAPID_PRIVATE_KEY; Einrichtung durch Admin in der App. iPhone nur installiert (iOS 16.4+) | Pilot | ✅ | 02.10.2026 · 1 – aktiv, sobald das Secret gesetzt ist; 02.10.2026 · 2: möglichst standardmäßig an – Gerät mit Erlaubnis wird still angemeldet, sonst einmal ein Fenster „Erlauben / Später“ (Später: nach 14 Tagen erneut), im Konto ausgeschaltet = nicht mehr fragen; Hinweis in „Zu erledigen“ entfällt; Versand prüft, ob das Secret zum öffentlichen Schlüssel passt |
| 43 | Mannschaften mit Lücken-Filtern („ohne Trainer“, „ohne Trainingszeit“, „ohne Platzfreigabe“) | Pilot | ⬜ | „Termine heute ohne Trainer“ gibt es als Warnzeile; Filter in der Mannschaftsliste fehlen |

## Nice to have

| Nr. | Feature | Phase | Status | Notiz |
|---|---|---|---|---|
| 17 | Wochenleiste mit Zahlen und Konfliktpunkten auf der Startseite (Admin) | Pilot | ✅ | 01.10.2026 · 2: Wochenleiste mit Punkten je Tag (Training/Spiel/abgesagt) für Trainer und Favoriten; für Admins Zahlen-Kacheln (Trainings, Heimspiele, Konflikte); 01.10.2026 · 5: Zahlen-Kacheln wieder entfernt |
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

## Entfernt

- 01.10.2026 · 5: Zahlen-Kacheln (Trainings, Heimspiele, Konflikte) und die Pfeile ‹ › am Tagestitel auf der Startseite – doppelt bzw. überflüssig. Saison-Konflikte stehen für alle Angemeldeten als eine Zeile.

- 01.10.2026 · 2: „Heute im Verein“ (Liste + Badge „Platz aktuell belegt“) auf der Startseite – ersetzt durch Live-Karte und Zeitleiste; das Datum oben steht jetzt in der Tageskarte.

## Bereits vorhanden (Bestätigung durch VereinsNeo)

- Trainer per Link einladen, Freigabe und Vergabe von Rolle/Mannschaft
- Ressourcen-Sperren mit Warnung statt automatischer Absage
- Mannschaftsabgleich mit fussball.de
