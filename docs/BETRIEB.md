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

| | Dev | Pre | Pro |
|---|---|---|---|
| Adresse | lokal | **pre.platzcoach.de** | **www.platzcoach.de** (platzcoach.de leitet weiter) |
| Datenbank | `supabase start` (Docker, lokal) | Supabase-Projekt `platzcoach-pre`, Free, Frankfurt | Supabase-Projekt `platzcoach-pro`, Pro, Frankfurt |
| Cloudflare-Pages-Projekt | – | `platzcoach-pre` | `platzcoach-pro` |
| Daten | Testdaten aus den Szenarien | erfundene Testvereine, **keine echten Personen- und Kinderdaten** | echte Vereine |
| Mail und Push | nur Log | nur an eigene Adressen (Allowlist) | an alle |
| fussball.de-Abgleich | aus | Pilotverein lesend oder aus | alle Vereine |
| Wird ausgerollt bei | – | Merge auf `main` | Tag `v…` oder manueller Start |
| Zugriff für Claude | ja | nur über die Pipeline | **nie**, auch nicht lesend |

Hinweise:

- Free-Projekte von Supabase pausieren nach einer Woche ohne Aktivität. Ein wöchentlicher Ping-Job in GitHub Actions hält `platzcoach-pre` wach.
- Pre hat im Free-Plan keine automatischen Backups. Das ist gewollt: Pre enthält nur Testdaten und kann jederzeit neu aufgebaut werden.
- Pre ist für Suchmaschinen gesperrt (`X-Robots-Tag: noindex` in `_headers`) und zeigt ein Band „Pre-Umgebung – keine echten Daten“.

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
| `PRO_SUPABASE_PROJECT_REF`, `PRO_SUPABASE_DB_PASSWORD` | GitHub | Deploy nach Pro, nur `release.yml` |
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
| Heartbeat | fussball.de-Abgleich, Outbox-Worker, `maintain_partitions`, `purge_expired`, nächtlicher `pg_dump` | Meldung bleibt aus |
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

## 11. Migrations-Checkliste

Reihenfolge der Datenübernahme steht im Funktionsinventar (Projekt-Doc), hier nur die Schritte für Betrieb und Infrastruktur.

**A. Vorbereitung**
- [ ] Supabase-Organisation anlegen, AVV (DPA) abschließen
- [ ] DNS-Zone zu Cloudflare umziehen; vorher alle Einträge (MX ImprovMX, SPF, DKIM, DMARC, Verifizierungen) vollständig übernehmen
- [ ] Scaleway-Konto, Domain verifizieren, Kontingent-Erhöhung beantragen
- [ ] Better Stack einrichten

**B. Pre aufbauen**
- [ ] Projekt `platzcoach-pre` (Frankfurt) und Pages-Projekt `platzcoach-pre`, Domain pre.platzcoach.de
- [ ] Schema v7 als `supabase/migrations/` ins Repo, `ci.yml` grün
- [ ] `deploy-pre.yml` und Secrets einrichten, erster automatischer Deploy
- [ ] Rechte-Tests und HTTP-Tests gegen Pre grün (bisher nur lokal nachgebildet)
- [ ] Edge Functions: Outbox, fussball.de-Abgleich, `health`; Heartbeats aktiv
- [ ] Security Advisor ohne Befund

**C. Pro aufbauen**
- [ ] Projekt `platzcoach-pro` (Frankfurt, Pro-Plan), Pages-Projekt `platzcoach-pro`
- [ ] `release.yml`, `PRO_*`-Secrets; Probe-Release ohne echte Daten
- [ ] Wiederherstellung aus Backup einmal geübt

**D. Umzug Pilotverein**
- [ ] Datenübernahme nach Funktionsinventar, Abgleich 220 Tage gegen den Pilot
- [ ] Einladungen statt Passwort-Übernahme, Push-Geräte melden sich neu an
- [ ] www.platzcoach.de auf Cloudflare Pages umstellen

**E. Aufräumen**
- [ ] `data/` aus dem Repo entfernen, Pilot-Workflows und Worker abschalten
- [ ] Alle Pilot-Geheimnisse austauschen bzw. löschen
- [ ] Repo auf privat stellen, Ausgabenlimit für Actions auf 0 $
- [ ] `README-DEPLOY.md` durch dieses Dokument ersetzen, Status oben auf „gültig“ setzen
