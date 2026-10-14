# Platzcoach – Betrieb nach der Migration (Planung)

> **Status: Planung, Stand 12.10.2026.** Nichts davon ist eingerichtet. Das Dokument beschreibt die Zielarchitektur, nach der wir mit dem Start der Supabase-Migration bauen. Bis dahin gilt für den laufenden Pilot `README-DEPLOY.md`. Sobald die Migration live ist, ersetzt dieses Dokument `README-DEPLOY.md`.
>
> Regeln stehen in `docs/PRINZIPIEN.md` (Abschnitt 8), Begründungen im Entscheidungsprotokoll (Projekt-Doc `claude/entscheidungen.md`). Hier stehen nur Fakten und Abläufe.

## 1. Zielarchitektur

| Baustein | Dienst | Region | Plan | Zweck |
|---|---|---|---|---|
| Datenbank, Login, API | Supabase | Frankfurt (eu-central-1), ausdrücklich gewählt | Pre: Free · Pro: **Free in der Pilotphase** (bis 20–30 Vereine), danach Pro-Plan (siehe 9a) | PostgreSQL 16, RLS, PostgREST (`api.*`), Supabase Auth |
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
| Datenbank | nur in den Tests: Postgres + PostgREST im GitHub-Actions-Runner, wird nach jedem Lauf verworfen | Supabase-Projekt `platzcoach-pre`, Free, Frankfurt | Supabase-Projekt `platzcoach-pro`, Frankfurt; Free in der Pilotphase, dann Pro-Plan |
| Cloudflare-Pages-Projekt | – | `platzcoach-pre` | `platzcoach-pro` |
| Daten | Testdaten aus den Szenarien | **pseudonymisierte Spiegelung** des Pilots (vor dem Umzug) bzw. von Pro (danach), nächtlich; siehe unten | echte Vereine |
| Mail und Push | nur Log | nur an die Test-Adressen aus der Spiegelung (+ harte Allowlist als zweite Sicherung) | an alle |
| fussball.de-Abgleich | aus | Pilotverein lesend oder aus | alle Vereine |
| Wird ausgerollt bei | – | Merge auf `main` | Tag `v…` oder manueller Start |
| Zugriff für Claude | ja (Branches, nie `main` direkt) | nur über die Pipeline | **nie**, auch nicht lesend |

Hinweise:

- Free-Projekte von Supabase pausieren nach einer Woche ohne Aktivität. Die nächtliche Spiegelung hält `platzcoach-pre` wach.
- Pre hat im Free-Plan keine automatischen Backups. Das ist gewollt: Pre enthält keine echten Personendaten und wird jede Nacht aus der Spiegelung neu befüllt.
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

## 3. Deployment-Pipeline

Drei Workflows in `.github/workflows/`:

| Workflow | Auslöser | Schritte |
|---|---|---|
| `ci.yml` | jeder Pull Request | Postgres + PostgREST im Runner starten → alle Migrationen einspielen → Szenarien, Rechteprüfung, Paralleltests, HTTP-Tests → Frontend bauen. Rot = nicht mergen. |
| `deploy-pre.yml` | Merge auf `main` | 1. `supabase db push` gegen Pre · 2. `supabase functions deploy` · 3. Frontend mit Pre-Konfiguration bauen, `wrangler pages deploy` nach `platzcoach-pre` · 4. Rauchtest: Rechteprüfung und HTTP-Tests gegen Pre · 5. Supabase Security Advisor auswerten |
| `release.yml` | Tag `vJJJJ.MM.TT-N` (entspricht Version „TT.MM.JJJJ · N“) oder manuell | 1. `pg_dump` von Pro als Sicherung · 2. dieselben Schritte wie Pre gegen Pro, **mit genau dem Commit, der auf Pre grün war** · 3. Rauchtest gegen Pro · 4. Heartbeat „Release“ an Better Stack |

Reihenfolge ist immer: Datenbank → Edge Functions → Frontend. Deshalb baut Cloudflare nicht selbst (keine Git-Anbindung), sondern bekommt das fertige Ergebnis per Direct Upload.

**Migrationen:** liegen in `supabase/migrations/`. Die Dateien 01–12 aus Schema v7 werden die erste Migration. Änderungen am Schema nur als neue Migrationsdatei, nie im Dashboard. Jede Migration muss mindestens eine App-Version lang mit dem alten Client funktionieren (Service Worker hält alte Versionen am Leben): erst hinzufügen, im nächsten Release entfernen.

**Rückgängig machen:** Frontend in Cloudflare auf das vorige Deployment zurücksetzen (ein Klick). Datenbank nie zurückrollen, sondern mit einer Korrektur-Migration reparieren; im Notfall den `pg_dump` vom Release-Zeitpunkt.

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
- **Ein Anbieter-Wechsel ist nur eine Einstellung:** Alle Mails laufen über eine SMTP-Verbindung (Supabase Auth) bzw. die Outbox-Function. Brevo ↔ Scaleway heißt Zugangsdaten und DNS-Einträge tauschen, kein Code.

### Mail in der kostenlosen Pilotphase: Brevo Free geprüft (14.10.2026)

Brevo Free erlaubt **300 Mails pro Tag** (ca. 9.000 im Monat); der Pilot nutzt Brevo bereits (SMTP, DKIM, DMARC eingerichtet).

| | Brevo Free | Scaleway |
|---|---|---|
| Kosten bei 30 Vereinen | 0 € | ca. 2 €/Monat (300 frei, dann 0,25 € je 1.000) |
| Grenze | **300 pro Tag**, auch für Einladungen und Passwort-Mails | keine Tagesgrenze (Start 10.000/Monat) |
| Einrichtung | schon vorhanden | neu (Domain, DKIM) |
| Hinweis „Sent with Brevo“ | im Free-Plan laut Testberichten möglich – an den heutigen Pilot-Mails prüfen | nein |
| Sitz | Frankreich | Frankreich |

Bedarf bei ca. 750 Konten: Wochenmail 750 pro Woche plus Benachrichtigungen – im Schnitt grob 150–350 Mails am Tag, je nachdem, wie viele Trainer Push statt Mail nutzen. **Die Spitze ist das Problem**, nicht der Monat: Geht die Wochenmail an alle am selben Tag, ist die Tagesgrenze überschritten.

Brevo Free reicht für 20–30 Vereine nur mit diesen Regeln in der Outbox:
- **Reserve:** Die Wochenmail darf höchstens 200 Mails pro Tag verbrauchen; 100 bleiben für Einladungen, Passwort-Mails und dringende Änderungen.
- **Wochenmail verteilt** auf Donnerstag bis Samstag (je Verein ein fester Tag).
- **Push als Standard**, Mail nur auf Wunsch.
- Ist das Tageslimit erreicht, wird die Mail auf den nächsten Tag verschoben, ohne dass es als Fehlversuch zählt.
- Alarm, wenn an drei Tagen hintereinander über 250 Mails nötig waren → Wechsel zu Scaleway.
## 6. Überwachung

| Art | Was | Alarm wenn |
|---|---|---|
| Monitor | www.platzcoach.de, pre.platzcoach.de | keine Antwort 200 |
| Monitor | Supabase Auth `/auth/v1/health` (Pro) | keine Antwort |
| Monitor | Edge Function `health` (Pro), mit `HEALTH_TOKEN` | Antwort 503: fehlgeschlagene Nachrichten, älteste offene Nachricht zu alt, Partition fehlt (aus `api.outbox_health()` und `private.partition_health`) |
| Heartbeat | fussball.de-Abgleich, Outbox-Worker, `maintain_partitions`, `purge_expired`, nächtlicher `pg_dump`, nächtliche Spiegelung nach Pre (inkl. Abgleich) | Meldung bleibt aus oder Abgleich weicht ab |
| Fehler | Frontend-Fehler (ohne personenbezogene Daten) | neue Fehlerart |

Zusätzlich in Supabase: Nutzungs-Benachrichtigungen einschalten, einmal pro Woche CPU, RAM, Verbindungen und Speicher ansehen. Ausgabengrenze im Pro-Plan bleibt an.

In der kostenlosen Pilotphase zusätzlich (Teil von `health`): **Datenbankgröße über 350 MB** und **API-Datenverkehr über 4 GB im Monat** lösen einen Alarm aus – das sind die Grenzen für den Wechsel auf den Pro-Plan (9a). Bei 500 MB schaltet Supabase Free die Datenbank auf „nur lesen“.

## 7. Backup und Wiederherstellung

- **Pilotphase (Supabase Free): keine automatischen Backups von Supabase.** Deshalb ist der nächtliche `pg_dump` hier Pflicht, nicht Zusatz. Ohne ihn keine echten Vereinsdaten auf Free.
- Nach dem Wechsel auf den Pro-Plan: tägliche Backups von Supabase, 7 Tage aufbewahrt.
- Nächtlicher `pg_dump` per GitHub Action, verschlüsselt, nach **Cloudflare R2** (im kostenlosen Rahmen 10 GB), 30 Tage aufbewahrt; Heartbeat an Better Stack. Bleibt auch mit dem Pro-Plan, damit wir nicht von einem Anbieter abhängen.
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
| Supabase Pro-Umgebung, ab Wechsel auf den Pro-Plan (Micro) | 25 $ (10 $ Compute-Guthaben enthalten) | 100.000 aktive Nutzer, 8 GB Speicher, 2 Mio. Function-Aufrufe | ca. 3 % der Nutzer |
| Supabase Pre (Free) | 0 $ | 500 MB, Pause nach 7 Tagen | – |
| Cloudflare R2 (Backups) | 0 € | 10 GB Speicher im kostenlosen Rahmen | – |
| Cloudflare Pages + DNS | 0 € | 500 Builds/Monat (wir nutzen Direct Upload) | – |
| Scaleway TEM | ca. 5 € (0,25 € je 1.000 Mails) | Start 10.000 Mails/Monat, erhöhbar | Hauptunsicherheit: Mailmenge |
| Better Stack | 0 € | 10 Monitore, 10 Heartbeats | – |
| GitHub (privat) | 0 € | 2.000 Actions-Minuten/Monat | Ausgabenlimit für Actions auf 0 $ |
| **Summe** | **ca. 30 €** | | |

Preise geprüft am 12.10.2026; vor der Einrichtung erneut prüfen.

### 9a. Kostenlose Pilotphase (Entscheidung 14.10.2026)

Für die ersten 20–30 Pilotvereine läuft auch die Pro-Umgebung auf **Supabase Free**. Gerechnet mit ca. 25 Konten je Verein (Trainer und Admins, keine Spieler):

| Grenze Supabase Free | Bedarf bei 30 Vereinen (Schätzung) | Einschätzung |
|---|---|---|
| 50.000 aktive Nutzer | ca. 750 | reicht deutlich |
| 500 MB Datenbank (danach nur lesen) | grob 150–300 MB im ersten Jahr | vermutlich; auf Pre am gespiegelten Pilotverein messen und hochrechnen |
| 5 GB API-Datenverkehr | grob 2–5 GB | knapp, beobachten |
| 500.000 Function-Aufrufe | ca. 70.000–100.000 | reicht |
| 2 aktive Projekte | Pre + Pro | genau ausgeschöpft (für Wiederherstellungs-Übungen Pre kurz pausieren) |
| geteilte CPU, 500 MB RAM | – | vor dem Go-live auf Pre per Lasttest bestätigen |

**Bedingungen:**
1. Nächtliches Backup nach R2 läuft und ist einmal erfolgreich zurückgespielt (Abschnitt 7).
2. Alarme bei 350 MB Datenbank und 4 GB Datenverkehr (Abschnitt 6).
3. **Wechsel auf den Pro-Plan**, sobald eine Grenze erreicht ist **oder** der erste Verein für Platzcoach bezahlt. Der Wechsel ist ein Klick im Dashboard, ohne Umzug und ohne Ausfall.

Ohne Pro-Plan fehlen außerdem: E-Mail-Support (nur Community-Forum), Logs länger als einen Tag.

**Kosten in der Pilotphase:** Supabase, Cloudflare, GitHub, Better Stack 0 €; Mails je nach Anbieter 0–2 € (siehe Abschnitt 5).

## 10. Offene Punkte

- [ ] Better Stack oder Sentry für Frontend-Fehler (ein Werkzeug reicht)
- [ ] Budget und Zeitpunkt für ein externes Sicherheits-Review vor dem Ausrollen an weitere Vereine
- [ ] AVV-Kette: Platzcoach als Auftragsverarbeiter der Vereine, Unterauftragsverarbeiter Supabase, Scaleway, Cloudflare, Better Stack (rechtlich prüfen lassen)
- [ ] Content Security Policy für die App festlegen (`_headers`), vorher klären, wo Nutzertext per `innerHTML` landet
- [ ] Clarity und GA4 im eingeloggten Bereich: behalten, einschränken oder entfernen

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
- [ ] Projekt `platzcoach-pro` (Frankfurt, zunächst Free – siehe 9a), Pages-Projekt `platzcoach-pro`
- [ ] Nächtliches Backup nach Cloudflare R2, einmal zurückgespielt; Alarme bei 350 MB und 4 GB
- [ ] Lasttest auf Pre mit der Hochrechnung für 30 Vereine
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
