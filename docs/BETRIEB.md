# Platzcoach – Betrieb nach der Migration (Planung)

> **Status: Planung, Stand 12.10.2026.** Nichts davon ist eingerichtet. Das Dokument beschreibt die Zielarchitektur, nach der wir mit dem Start der Supabase-Migration bauen. Bis dahin gilt für den laufenden Pilot `README-DEPLOY.md`. Sobald die Migration live ist, ersetzt dieses Dokument `README-DEPLOY.md`.
>
> Regeln stehen in `docs/PRINZIPIEN.md` (Abschnitt 8), Begründungen im Entscheidungsprotokoll (Projekt-Doc `claude/entscheidungen.md`). Hier stehen nur Fakten und Abläufe.

## 1. Zielarchitektur

| Baustein | Dienst | Region | Plan | Zweck |
|---|---|---|---|---|
| Datenbank, Login, API | Supabase | Frankfurt (eu-central-1), ausdrücklich gewählt | Pro (Pro-Umgebung), Free (Pre) | PostgreSQL 16, RLS, PostgREST (`api.*`), Supabase Auth |
| Hintergrundjobs | Supabase Edge Functions + pg_cron | Ausführung auf Frankfurt festgelegt | im Pro-Plan enthalten | Outbox (Mail, Push), fussball.de-Abgleich, Wartung |
| Frontend | Cloudflare Pages | global (statische Dateien) | Free | App-Dateien, Upload per Direct Upload aus GitHub Actions |
| DNS | Cloudflare | – | Free | Zone `platzcoach.de` (Nameserver von checkdomain zu Cloudflare), Domain bleibt bei checkdomain registriert |
| Transaktionsmails | Scaleway Transactional Email | Paris | Essential (nach Verbrauch) | Auth-Mails, Benachrichtigungen, Wochenmail |
| Mail-Empfang | ImprovMX | – | wie bisher | info@platzcoach.de → Gmail |
| Überwachung | Better Stack | – | Free | Erreichbarkeit, Heartbeats der Jobs, Frontend-Fehler |
| Code | GitHub, Repo privat | – | Free | Code, Migrationen, Tests, Pipeline |

Entfällt nach der Migration: JSON-Dateien in `data/`, Schreiben über die GitHub Contents API mit geteiltem Token, GitHub Actions für Sync und Mails, die Cloudflare-Worker für Registrierung und Passwort (übernimmt Supabase Auth), Brevo.

## 2. Umgebungen

Wir nutzen **Dev, Pre und Pro** (wie bei Openbank). Pre ist die Vorab-Umgebung, in der jeder Stand geprüft wird, bevor er nach Pro geht.

**Entwicklung nur online (Entscheidung 14.10.2026):** Es gibt keine lokale Installation. Entwickelt wird per Vibe Coding in Claude-Code-Sitzungen im Browser bzw. am Handy; jede Änderung landet auf einem eigenen Branch mit Pull Request. „Dev“ ist damit keine laufende Umgebung, sondern Branch + Pull Request + automatische Tests in GitHub Actions. Die erste laufende App mit Datenbank ist Pre.

| | Dev | Pre | Pro |
|---|---|---|---|
| Adresse | keine (Branch + Pull Request) | **pre.platzcoach.de** | **www.platzcoach.de** (platzcoach.de leitet weiter) |
| Datenbank | nur in den Tests: Postgres + PostgREST im GitHub-Actions-Runner, wird nach jedem Lauf verworfen | Supabase-Projekt `platzcoach-pre`, Free, Frankfurt | Supabase-Projekt `platzcoach-pro`, Pro, Frankfurt |
| Cloudflare-Pages-Projekt | – | `platzcoach-pre` | `platzcoach-pro` |
| Daten | Testdaten aus den Szenarien | **pseudonymisierte Spiegelung** des Pilots (vor dem Umzug) bzw. von Pro (danach), nächtlich; siehe unten | echte Vereine |
| Mail und Push | nur Log | nur an die Test-Adressen aus der Spiegelung (+ harte Allowlist als zweite Sicherung) | an alle |
| fussball.de-Abgleich | aus | Pilotverein lesend oder aus | alle Vereine |
| Wird ausgerollt bei | – | Merge auf `main` | Tag `v…` oder manueller Start |
| Zugriff für Claude | ja (Branches, nie `main` direkt) | nur über die Pipeline | **nie**, auch nicht lesend |

Hinweise:

- Free-Projekte von Supabase pausieren nach einer Woche ohne Aktivität. Die nächtliche Spiegelung hält `platzcoach-pre` wach.
- Pre hat im Free-Plan keine automatischen Backups. Das ist vertretbar: Pre wird jede Nacht aus der Spiegelung neu befüllt.
- Pre ist für Suchmaschinen gesperrt (`X-Robots-Tag: noindex` in `_headers`) und zeigt ein Band „Pre-Umgebung – Testdaten“.

### Daten auf Pre: pseudonymisierte Spiegelung (Entscheidung 14.10.2026)

Pre soll mit realistischen Daten testen. Deshalb werden die echten Daten jede Nacht nach Pre gespiegelt, **personenbezogene Felder aber ersetzt**. Der größte Teil der Platzcoach-Daten ist nicht personenbezogen und bleibt 1:1 echt.

| Bleibt echt | Wird ersetzt |
|---|---|
| Verein, Anlage, Plätze, Teilflächen, Kabinen | Namen der Zugänge → „Trainer E2“, „Admin 1“ … (Rolle + Mannschaft) |
| Saisons, Mannschaften, Trainingszeiten, Termine, Absagen, Verlegungen | E-Mail → Test-Adresse mit Plus-Alias aus `PRE_TEST_MAIL` (z. B. `<Postfach>+e2@…`), Telefon → leer |
| Sperren, fussball.de-Spiele (öffentliche Daten), Konflikte | Torhüter → „Torhüter 1, 2 …“, keine echten Vor- und Nachnamen |
| Zusagen und Anmeldungen (Verknüpfungen bleiben, Personen sind pseudonym) | Freitexte mit möglichem Personenbezug (Notizen, Grund) → gekürzt auf die Terminart |
| | Passwörter, Passkeys, Push-Geräte → nicht übernommen; Anmeldung auf Pre per Einladung an die Test-Adressen |

Regeln:

- **Gleiche Person, gleiches Pseudonym:** Pseudonyme werden mit einem geheimen Salz (`PRE_SPIEGEL_SALT`) stabil berechnet, damit Tests von Nacht zu Nacht dieselben Konten finden.
- **Das Spiegelskript ist das Migrationsskript.** `scripts/migrate/` überträgt die Pilotdaten (JSON) in das neue Schema – nachts mit Pseudonymisierung nach Pre, am Umzugstag einmal ohne nach Pro. Damit ist der Umzug jede Nacht geprobt.
- **Abgleich nach jedem Lauf:** Konflikte und Tagesbelegung der nächsten 220 Tage auf Pre gegen den Pilot vergleichen; Abweichungen melden (Heartbeat schlägt fehl).
- **Richtung:** vor dem Umzug Pilot (Repo-JSON) → Pre; nach dem Umzug Pro → Pre. Der Job nach dem Umzug liest Pro und läuft nur in einem Workflow mit `PRO_*`-Secrets, den Menschen prüfen und freigeben; Claude bekommt dadurch keinen Zugriff auf Pro.
- **Keine Gegenrichtung:** Von Pre fließt nie etwas nach Pro.
- **Rechtlich bleiben die Daten personenbezogen.** Pseudonymisierte Daten gelten nach DSGVO weiter als personenbezogen, solange sich die Personen zurückverfolgen lassen (hier über Salz und Mannschaftszuordnung). Bewusst so entschieden am 14.10.2026. Deshalb gilt für Pre:
  - Pre ist in der AVV-Kette mit abgedeckt (Supabase, Cloudflare, Scaleway).
  - Zugriff auf das Pre-Dashboard von Supabase nur für Fabrizio; Claude nur über die Pipeline.
  - **Serverseitige Empfängerliste:** Auth-Mails, Benachrichtigungen und Push auf Pre gehen nur an Adressen aus `PRE_TEST_MAIL`; alles andere wird in der Datenbank verworfen, nicht erst in der App.
  - Der fussball.de-Abgleich auf Pre liest nur, Webhooks und andere externe Aufrufe sind aus.
- **Spiegelung pausieren:** Während du ein Feature auf Pre abnimmst, kann die Spiegelung angehalten werden (Repository-Variable `PRE_SPIEGEL_PAUSE`), damit der Testzustand nicht über Nacht überschrieben wird.
- **Feste Testszenarien zusätzlich:** Für die automatischen Tests (CI und Playwright) gibt es einen erfundenen Testverein mit allen Rollen und Sonderfällen (Sperre, Überschneidung, Absage, Torwarttraining, Verlegung). Er wird von der Spiegelung nicht angefasst, damit Tests wiederholbar sind.

## 3. Deployment-Pipeline

Drei Workflows in `.github/workflows/`:

| Workflow | Auslöser | Schritte |
|---|---|---|
| `ci.yml` | jeder Pull Request | Typen (`tsc`), ESLint, Prettier, Vitest → Postgres + PostgREST im Runner: **frische Datenbank** und **Upgrade vom zuletzt veröffentlichten Pro-Schema** → Szenarien, Rechteprüfung, Angriffsfälle (siehe unten), Paralleltests, HTTP-Tests → Geheimnis-Suche und Prüfung der Pakete auf bekannte Lücken → Frontend bauen. Rot = nicht mergen. |
| `deploy-pre.yml` | Merge auf `main` | 1. `supabase db push` gegen Pre · 2. `supabase functions deploy` · 3. Frontend mit Pre-Konfiguration bauen (`npm ci`, feste Paketversionen), `wrangler pages deploy` nach `platzcoach-pre` · 4. Rauchtest: Rechteprüfung und HTTP-Tests gegen Pre · 5. Playwright-Abläufe · 6. Supabase Security Advisor: Befunde der Stufe „Error“ stoppen · 7. Erfolg wird als GitHub-Deployment „pre“ **mit Commit** festgehalten. Läufe stehen in einer Warteschlange (`concurrency`), damit sich Auslieferungen nicht überholen. |
| `release.yml` | Tag `vJJJJ.MM.TT-N` (entspricht Version „TT.MM.JJJJ · N“) | 0. **Prüfung:** Der Tag muss genau auf dem Commit stehen, der zuletzt erfolgreich auf Pre lief – sonst Abbruch · 1. `pg_dump` von Pro als Sicherung · 2. dieselben Schritte wie Pre gegen Pro, aus demselben Commit mit denselben Paketversionen; die Pro-Einstellungen (URL, Schlüssel) werden vor dem Bauen geprüft · 3. Rauchtest gegen Pro · 4. Heartbeat „Release“ an Better Stack · 5. Issues mit „Refs #…“ aus diesem Release werden geschlossen. **Bei jedem Fehler:** sofort stoppen, Alarm, kein automatisches Zurückspielen der Datenbank. |

Reihenfolge ist immer: Datenbank → Edge Functions → Frontend. Deshalb baut Cloudflare nicht selbst (keine Git-Anbindung), sondern bekommt das fertige Ergebnis per Direct Upload.

**Migrationen:** liegen in `supabase/migrations/`. Die Dateien 01–12 aus Schema v7 werden die erste Migration. Änderungen am Schema nur als neue Migrationsdatei, nie im Dashboard. Jede Migration muss mindestens eine App-Version lang mit dem alten Client funktionieren (Service Worker hält alte Versionen am Leben): erst hinzufügen, im nächsten Release entfernen.

**Ein Release-Kandidat zur Zeit:** Während du einen Stand auf Pre abnimmst, wird nichts Neues gemergt. Wird doch gemergt, verweigert `release.yml` den alten Tag, weil Pre inzwischen einen anderen Commit hat – dann neu abnehmen.

**Board-Status:** In Arbeit → Auf Pre → Live. Pull Requests verweisen mit „Refs #…“ auf ihr Issue (nicht „Closes“, das würde schon beim Merge schließen). Geschlossen wird beim Release.

**Rückweg bei einem fehlerhaften Release:**
1. Frontend in Cloudflare auf das vorige Deployment zurücksetzen (ein Klick).
2. Edge Functions aus dem vorigen Tag erneut ausrollen.
3. Datenbank **nicht** zurückspielen – sonst gehen zwischenzeitlich eingetragene Termine verloren. Stattdessen Korrektur-Migration über Pre → Pro. Das Zurückspielen des `pg_dump` ist nur der letzte Ausweg nach bewusster Entscheidung.
4. Weil Migrationen abwärtskompatibel sind (erst hinzufügen, später entfernen), funktioniert die vorige App mit der neuen Datenbank. Trainer, die das Update noch nicht angenommen haben, arbeiten ohnehin mit der alten Version weiter.

### Angriffsfälle in den Tests

Die Rechteprüfung zählt nicht Testfälle, sondern muss diese Fälle abdecken – über direkte HTTP-Aufrufe an die API, nicht über die App:
- Trainer aus Verein A liest oder ändert Daten von Verein B (Tabellen, Views, Funktionen)
- manipulierte Vereins-ID oder Mannschafts-ID in einer Anfrage
- Trainer macht sich selbst zum Admin oder ändert fremde Rollen
- Zugriff ohne Anmeldung auf alles außer dem öffentlichen Kalender
- gleichzeitige Buchungen derselben Fläche (genau eine gewinnt)
- dieselbe Anfrage zweimal (keine doppelte Absage, keine doppelte Mail)
- ein alter App-Stand gegen das neue Schema (Kompatibilität)

### Freigabe nach Pro (Entscheidung 14.10.2026: vorerst Arbeitsanweisung)

„Claude fasst Pro nicht an“ wird vorerst **nicht technisch erzwungen** (GitHub Free, privates Repo). Technisch möglich wären Schutzregeln für `main`, eine Regel, dass nur Fabrizio `v*`-Tags anlegen darf, und eine Umgebung „pro“, deren Secrets nur der Release-Job auf einem solchen Tag erhält – bei privaten Repos ab GitHub Pro (ca. 4 $/Monat).

Bis dahin gilt:
- Solange es Pro nicht gibt, gibt es auch keine `PRO_*`-Secrets – während des Aufbaus von Pre besteht das Risiko also noch nicht.
- **Spätestens bevor die `PRO_*`-Secrets angelegt werden** (Checkliste C), wird die Entscheidung erneut geprüft.
- Änderungen an `.github/workflows/` werden im Pull Request ausdrücklich genannt und von Fabrizio besonders genau durchgesehen; die CI markiert solche Pull Requests.
- Pro-Zugangsdaten mit möglichst wenig Rechten: Cloudflare-Token nur für das Pages-Projekt `platzcoach-pro`, eigenes Datenbank-Passwort je Umgebung.
- Bei Verdacht: alle `PRO_*`-Secrets sofort austauschen.

## 4. Geheimnisse

Nur Namen, nie Werte. GitHub Free erlaubt bei privaten Repos keine Environments; deshalb Repository-Secrets mit Präfix. `PRO_*` darf nur `release.yml` verwenden.

| Name | Wo | Wofür |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | GitHub | Supabase-CLI (Deploy) |
| `PRE_SUPABASE_PROJECT_REF`, `PRE_SUPABASE_DB_PASSWORD` | GitHub | Deploy nach Pre |
| `PRO_SUPABASE_PROJECT_REF`, `PRO_SUPABASE_DB_PASSWORD` | GitHub | Deploy nach Pro, nur `release.yml` (und nach dem Umzug der Spiegel-Job Pro → Pre) |
| `PRE_SPIEGEL_SALT` | GitHub | stabile Pseudonyme in der Spiegelung |
| `PRE_TEST_MAIL` | GitHub | Basis-Adresse für die Plus-Aliase der Test-Konten |
| `PILOT_GK_KEY` | GitHub, nur bis zum Umzug | Torhüter-Liste des Pilots entschlüsseln (wird in der Spiegelung sofort pseudonymisiert) |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub | Upload zu Cloudflare Pages (Token nur mit Recht „Pages bearbeiten“) |
| `SCALEWAY_SMTP_USER`, `SCALEWAY_SMTP_PASSWORD` | Supabase (Auth-SMTP und Function-Secrets), je Umgebung eigene | Mailversand |
| `VAPID_PRIVATE_KEY` | Supabase Function-Secrets, je Umgebung eigener | Web-Push |
| `BETTERSTACK_HEARTBEAT_*` | Supabase Function-Secrets | Heartbeats der Jobs |
| `HEALTH_TOKEN` | Supabase Function-Secrets + Better Stack | Schutz des Gesundheits-Endpunkts |

Grundregeln: Der `service_role`-Schlüssel kommt nie in den Client und nie ins Repo. Der Client bekommt nur URL und `anon`-Schlüssel; die Rechte erzwingt RLS. Alle Geheimnisse aus dem Pilot (geteilter GitHub-Token, Worker-Variablen, Brevo) werden nach dem Umzug ausgetauscht bzw. gelöscht.

## 5. Mail

- Absender immer „Platzcoach &lt;noreply@platzcoach.de&gt;“, Antworten an info@platzcoach.de (unverändert).
- Supabase Auth verschickt Einladung, Passwort-Reset und Bestätigung über Scaleway-SMTP; die Outbox-Function verschickt Benachrichtigungen und Wochenmail ebenfalls über Scaleway.
- DNS: SPF um Scaleway ergänzen, DKIM von Scaleway eintragen, DMARC bleibt. Brevo-Einträge nach dem Umzug entfernen.
- Scaleway beginnt mit 10.000 Mails im Monat. Erhöhung **vor** dem Ausrollen an weitere Vereine beim Support beantragen.
- Push ist der Standard, Mail auf Wunsch. Das hält die Mailmenge klein.

## 6. Überwachung

| Art | Was | Alarm wenn |
|---|---|---|
| Monitor | www.platzcoach.de, pre.platzcoach.de | keine Antwort 200 |
| Monitor | Supabase Auth `/auth/v1/health` (Pro) | keine Antwort |
| Monitor | Edge Function `health` (Pro), mit `HEALTH_TOKEN` | Antwort 503: fehlgeschlagene Nachrichten, älteste offene Nachricht zu alt, Partition fehlt (aus `api.outbox_health()` und `private.partition_health`) |
| Heartbeat | fussball.de-Abgleich, Outbox-Worker, `maintain_partitions`, `purge_expired`, nächtlicher `pg_dump`, nächtliche Spiegelung nach Pre (inkl. Abgleich) | Meldung bleibt aus oder Abgleich weicht ab |
| Fehler | Frontend-Fehler (ohne personenbezogene Daten) | neue Fehlerart |

Zusätzlich in Supabase: Nutzungs-Benachrichtigungen einschalten, einmal pro Woche CPU, RAM, Verbindungen und Speicher ansehen. Ausgabengrenze im Pro-Plan bleibt an.

## 7. Backup und Wiederherstellung

- Supabase Pro: tägliche Backups, 7 Tage aufbewahrt.
- Zusätzlich nächtlicher `pg_dump` per GitHub Action in einen Speicher außerhalb von Supabase (verschlüsselt), damit wir nicht von einem Anbieter abhängen. Speicherort ist noch offen (siehe 10).
- **Wiederherstellung üben:** vor dem Go-live und danach einmal pro Quartal einen Dump in ein frisches Projekt zurückspielen und die Rauchtests dagegen laufen lassen.
- Point-in-Time-Recovery (ab 100 $/Monat) erst, wenn mehrere Vereine produktiv arbeiten und ein verlorener Tag wirklich wehtut.

## 8. Notfallplan

| Fall | Erste Schritte |
|---|---|
| Seite nicht erreichbar | Better Stack und Statusseiten von Cloudflare und Supabase prüfen → bei eigenem Fehler Frontend in Cloudflare auf das vorige Deployment zurücksetzen |
| Mails oder Push gehen nicht raus | `health` und Outbox ansehen → Scaleway-Kontingent und -Status prüfen → fehlgeschlagene Nachrichten nach der Behebung erneut einreihen |
| Fehlerhaftes Release | Frontend zurücksetzen, Korrektur-Migration über die normale Pipeline (Pre → Pro) |
| Verdacht auf Datenleck | Betroffene Schlüssel sofort austauschen, „Alle abmelden“ (Supabase-Admin-API), Logs sichern, Umfang klären. Meldung an die Aufsichtsbehörde innerhalb von 72 Stunden prüfen; Vereine als Verantwortliche informieren |

## 9. Kosten und Limits (Planung für 50 Vereine, ca. 3.000 Konten)

| Dienst | Kosten/Monat | Wichtigste Grenze | Auslastung |
|---|---|---|---|
| Supabase Pro + Micro | 25 $ (10 $ Compute-Guthaben enthalten) | 100.000 aktive Nutzer, 8 GB Speicher, 2 Mio. Function-Aufrufe | ca. 3 % der Nutzer |
| Supabase Pre (Free) | 0 $ | 500 MB, Pause nach 7 Tagen | – |
| Cloudflare Pages + DNS | 0 € | 500 Builds/Monat (wir nutzen Direct Upload) | – |
| Scaleway TEM | ca. 5 € (0,25 € je 1.000 Mails) | Start 10.000 Mails/Monat, erhöhbar | Hauptunsicherheit: Mailmenge |
| Better Stack | 0 € | 10 Monitore, 10 Heartbeats | – |
| GitHub (privat) | 0 € | 2.000 Actions-Minuten/Monat | Ausgabenlimit für Actions auf 0 $ |
| **Summe** | **ca. 30 €** | | |

Preise geprüft am 12.10.2026; vor der Einrichtung erneut prüfen.

## 10. Offene Punkte

- [ ] Speicherort für den zusätzlichen nächtlichen `pg_dump` (z. B. Scaleway Object Storage oder Hetzner Storage Box)
- [ ] Better Stack oder Sentry für Frontend-Fehler (ein Werkzeug reicht)
- [ ] Budget und Zeitpunkt für ein externes Sicherheits-Review vor dem Ausrollen an weitere Vereine
- [ ] AVV-Kette: Platzcoach als Auftragsverarbeiter der Vereine, Unterauftragsverarbeiter Supabase, Scaleway, Cloudflare, Better Stack (rechtlich prüfen lassen)
- [ ] Content Security Policy für die App festlegen (`_headers`), vorher klären, wo Nutzertext per `innerHTML` landet
- [ ] Clarity und GA4 im eingeloggten Bereich: behalten, einschränken oder entfernen
- [ ] Zulässiger Datenverlust und Wiederherstellungszeit festlegen (z. B. höchstens ein Tag Datenverlust, Wiederherstellung innerhalb eines Tages) – davon hängt ab, ob tägliche Backups reichen

## 11. Migrations-Checkliste

> Verfolgt wird der Umbau im GitHub-Projekt **„Migration Supabase“** (ein Issue je Punkt, Meilensteine A–E). Diese Liste ist die Vorlage; der aktuelle Stand steht im Projekt, nicht hier.

Reihenfolge der Datenübernahme steht im Funktionsinventar (Projekt-Doc), hier nur die Schritte für Betrieb und Infrastruktur.

**A. Vorbereitung**
- [ ] Supabase-Organisation anlegen, AVV (DPA) abschließen
- [ ] DNS-Zone zu Cloudflare umziehen; vorher alle Einträge (MX ImprovMX, SPF, DKIM, DMARC, Verifizierungen) vollständig übernehmen
- [ ] Scaleway-Konto, Domain verifizieren, Kontingent-Erhöhung beantragen
- [ ] Better Stack einrichten

**B. Pre aufbauen (parallel zum Pilot; platzcoach.de bleibt unverändert)**
- [ ] Projekt `platzcoach-pre` (Frankfurt) und Pages-Projekt `platzcoach-pre`, Domain pre.platzcoach.de
- [ ] Schema v7 als `supabase/migrations/` ins Repo, `ci.yml` grün
- [ ] `deploy-pre.yml` und Secrets einrichten, erster automatischer Deploy
- [ ] Rechte-Tests und HTTP-Tests gegen Pre grün (bisher nur im Test-Runner nachgebildet)
- [ ] Migrationsskript `scripts/migrate/` (Pilot-JSON → Schema, Reihenfolge laut Funktionsinventar) mit Pseudonymisierung
- [ ] Nächtliche Spiegelung Pilot → Pre mit Abgleich 220 Tage; zwei Wochen ohne Abweichung
- [ ] Edge Functions: Outbox, fussball.de-Abgleich, `health`; Heartbeats aktiv
- [ ] Mail und Push auf Pre landen nachweislich nur bei den Test-Adressen
- [ ] Testphase mit Trainern auf pre.platzcoach.de (Test-Konten)
- [ ] Security Advisor ohne Befund

**C. Pro aufbauen (erst kurz vor dem Umzug, damit Pro nie Testdaten enthält)**
- [ ] Projekt `platzcoach-pro` (Frankfurt, Pro-Plan), Pages-Projekt `platzcoach-pro`
- [ ] Entscheidung „Freigabe technisch absichern“ (GitHub Pro?) erneut prüfen – **vor** dem Anlegen der `PRO_*`-Secrets
- [ ] `release.yml`, `PRO_*`-Secrets; Probe-Release mit leerem Schema
- [ ] Wiederherstellung aus Backup einmal geübt

**D. Umzugstag Pilotverein**
- [ ] Termin mit dem Verein abstimmen, Trainer vorab informieren
- [ ] Pilot auf „nur lesen“ stellen (Speichern gesperrt, Hinweis in der App)
- [ ] Migrationsskript einmal ohne Pseudonymisierung nach Pro, Abgleich 220 Tage gegen den Pilot
- [ ] platzcoach.de / www.platzcoach.de auf Cloudflare Pages `platzcoach-pro` umstellen
- [ ] Einladungen an alle Zugänge (keine Passwort-Übernahme), Push-Geräte melden sich neu an
- [ ] Alter Pilot zwei Wochen nur lesend unter der GitHub-Pages-Adresse als Rückfallebene
- [ ] Spiegelung auf Pro → Pre umstellen

**E. Aufräumen**
- [ ] `data/` aus dem Repo entfernen, Pilot-Workflows und Worker abschalten
- [ ] Alle Pilot-Geheimnisse austauschen bzw. löschen
- [ ] Repo auf privat stellen, Ausgabenlimit für Actions auf 0 $
- [ ] `README-DEPLOY.md` durch dieses Dokument ersetzen, Status oben auf „gültig“ setzen
