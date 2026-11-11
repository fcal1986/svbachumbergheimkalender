# Pilot #135 – Hallenplan und Spielorte (SV Bachum/Bergheim)

Stand: 11.11.2026 · 1 · Pilot-Entwicklung im PR #136 (noch nicht produktiv).

## Wo die Planung liegt

- `data/config.json → hallPlan`: zeitlich zugeteilte Vereinsnutzung. **01.11.2026 bis 31.03.2027**, nur die angegebenen Wochentage und Uhrzeiten.
- `data/training.json → slots`: neun Regeltrainings auf den zugeteilten Hallenflächen; die beiden Einträge C2 und D1 haben dasselbe Zeitfenster, aber verschiedene Drittel.
- `assets/venue-plan.js`: reine Berechnung der möglichen Spielorte, Zeitfenster und freien Teilflächen. Kalender und Formular nutzen diese Logik. Die Abgrenzung zwischen Vereinszeit und Terminbelegung bleibt erhalten.

| Spielort | Zuteilung | Teilung |
|---|---|---|
| Bergheim-Schule | Di 16:00–17:00; Do 16:00–20:00 | gesamte Halle |
| SUG | Fr 17:00–18:30 | gesamte Halle |
| Binnerfeld | Sa 10:30–13:00 | 3 Drittel |

**Belegungen:** Bergheim-Schule Di G 16:00–17:00, Do F 16:00–17:15, E3 17:15–18:45, D2 18:45–20:00; SUG Fr E2 17:00–17:45, E1 17:45–18:30; Binnerfeld Sa C2 10:30–11:45 auf H1+H2, D1 gleichzeitig H3, danach C1 11:45–13:00 auf H1+H2+H3.

Das Außenplatz-Regeltraining wird durch diesen Pilot **nicht automatisch gestrichen**. **Offen:** E2 hat freitags draußen 16:00–17:30 und in SUG 17:00–17:45, Überschneidung 17:00–17:30.

## Was sich für Trainer ändert

- **Start:** Die Tagesleiste bleibt oberhalb der Spielorte. An Tagen mit Hallenzuteilung steht ein kleiner Hallenhinweis. Sind mindestens zwei unterschiedliche physische Spielorte gültig, erscheinen die vorhandenen Chip-Stile als Auswahl „Spielorte“. Ein Sportgelände mit zwei Plätzen ist nur ein Spielort.
- **Neuer Termin:** Die vorhandene Maske bleibt bestehen. Zwischen „Wann?“ und „Wo?“ erscheint die gleiche Auswahl „Spielorte“; bei genau einem Spielort überhaupt nicht. „Ressourcen einblenden“, die Zeitleiste, A/B, Viertel 1–4, KF, Hallendrittel H1–H3 und der Speicherweg bleiben die bisherigen Bedienelemente. Gezeigt werden nur Spuren des ausgewählten Spielorts.
- **Verfügbarkeit:** Die vereinseigene Zuteilung ist nicht identisch mit einer freien Zeit. + frei in der Halle wird ausschließlich innerhalb des zugeteilten Fensters angeboten. Die Prüfung erfolgt zusätzlich beim Speichern. Ein belegter Hallentermin führt in den normalen Tab „Termine“, nicht in eine neue Hallenansicht.
- **Freigabe:** Der Trainer sagt **nur seine einzelne** Hallentrainingseinheit ab (mit der bestehenden Rückgängig-Funktion). Die Fläche wird frei, bleibt aber nur innerhalb der Vereinszeit buchbar. Eine bestätigte Freigabe löst die reguläre Benachrichtigungs-Pipeline aus. Eine Mail an jeden aktiven Trainer mit E-Mail-Adresse, Push ausschließlich bei registriertem/aktiviertem Gerät. Ein Mail-Direktlink übernimmt das ausgefallene Hallenfenster in „Neuer Termin“.

## Technische Grenzen / Datenschutz

Der Pilot hat ausschließlich **clientseitige** Rollen- und Belegungskontrollen und speichert JSON-Dateien auf GitHub: gleichzeitige Schreibvorgänge lassen sich nicht atomar gegen Doppelbelegung schützen. Die bestehenden 3-Wege-Merges und Konfliktanzeige bleiben erhalten. `data/` ist öffentlich und bleibt in der Git-Historie. Keine persönlichen Details Minderjähriger in Konfiguration und Commit-Mails hinterlegen; Trainerdaten müssen auf den notwendigen Umfang begrenzt bleiben.

Die bestehende SMTP-Benachrichtigung dedupliziert Empfänger pro Workflow-Lauf. Ein **erneuter Workflow-Lauf nach teilweiser Auslieferung** lässt sich ohne persistente Outbox nicht strikt entdoppeln. Solche Garantien gehören in das spätere Supabase-Backend. Alte Hallenregelzeiten sind im Pilot zentral konfiguriert und deshalb vorerst gegen Bearbeitung mit dem **nur für Außenplätze vorgesehenen** Verwaltungsformular geschützt. Einzeltermine absagen und verlegen bleibt möglich.

## Abnahme nach Merge durch Verein (kein echter Massenmail-Test)

1. 12.09.2026 (Sa): nur Außenplatz, **keine** Spielortauswahl, A/B/1–4/KF wie vorher.
2. 12.11.2026 (Do): Bergheim-Schule als zweiter Spielort, ganze Halle; drei Teams nacheinander.
3. 13.11.2026 (Fr): SUG mit E2/E1, außerhalb 17:00–18:30 nicht buchbar.
4. 14.11.2026 (Sa): Binnerfeld H1–H3, C2 2/3, D1 1/3, danach C1 3/3; keine fiktiv freie Fläche.
5. In einem isolierten Test einen C1-Termin absagen, Rückgängig-Zeit abwarten, prüfen ob 11:45–13:00 als freie drei Drittel angezeigt wird. **Nur mit ausdrücklich vorher festgelegten Testempfängern**, denn der echte Freigabe-Commit würde sonst alle aktiven Trainer benachrichtigen.
6. Auf belegten Hallentermin tippen → normaler Tab „Termine“. In „Neu“ Datum wechseln → tagesabhängige Spielorte, richtige Ressourcen.
7. Erst nach Abnahme und Entscheidung zum E2-Überschneidungsfall für den generischen Neubau `fcal1986/platzcoach#181` vormerken.

CI: `.github/workflows/pilot-hall-check.yml` testet JSON, JavaScript, Fachfälle sowie die 375px-Browseransichten und veröffentlicht anonymisierte UI-Prüfscreenshots (Testnutzer, kein echtes Login).
