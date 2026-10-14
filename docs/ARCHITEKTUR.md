# Platzcoach – Architektur des neuen Frontends (Planung)

> **Status: Planung, Stand 14.10.2026.** Gilt für das neue Frontend, das mit der Supabase-Migration auf Pre entsteht. **Die Pilot-App (`index.html`, `data/`, `scripts/`, `worker/`) wird dafür nicht verändert**; sie läuft bis zum Umzugstag unverändert weiter und wird dann abgeschaltet.
>
> Betrieb und Umgebungen: `docs/BETRIEB.md`. Produktregeln (Klick-Budgets, Rollen, nicht überladen): `docs/PRINZIPIEN.md` – sie gelten für das neue Frontend genauso.

## 1. Ausgangslage Pilot (14.10.2026)

| | Pilot |
|---|---|
| Aufbau | eine Datei `index.html`, 11.724 Zeilen, 864 KB |
| Inhalt | rund 950 Funktionen, 1.227 Zeilen CSS, alles global |
| Zustand | 83 globale Variablen |
| Datenzugriff | GitHub-API an rund 30 Stellen (`fetchRepoJSON`, `saveStore`, `ghPutRaw`) |
| Fachregeln | Konflikte, Belegung, Rechte im Browser |
| Darstellung | 127 Stellen mit `innerHTML`, `esc()` vorhanden, aber nicht erzwungen |
| Tests | keine automatischen Frontend-Tests |

Für einen schnell gewachsenen Piloten normal. Für Vibe Coding ist die Datei zu groß (sie passt nicht vollständig in eine Sitzung), und mit der Migration ändert sich ohnehin der gesamte Datenzugriff. Deshalb entsteht das neue Frontend neu und gegliedert – mit derselben Oberfläche, die der Verein kennt.

## 2. Technik: React (Entscheidung 14.10.2026)

| Baustein | Wahl | Warum |
|---|---|---|
| UI | **React** (aktuelle stabile Version, beim Aufsetzen fest gepinnt) | verbreitetstes UI-Werkzeug, von KI-Modellen am besten beherrscht; kein späterer Umstieg; geeignet für eine spätere native Hülle (Capacitor) |
| Sprache | **TypeScript** (strict) | Typfehler fallen in der CI auf statt beim Verein; Datenbanktypen werden aus dem Schema erzeugt (`supabase gen types`) – passt das Frontend nicht mehr zur Datenbank, wird der Pull Request rot |
| Build | **Vite** | von react.dev für Apps ohne Framework empfohlen; schnell, einfach, statisches Ergebnis für Cloudflare Pages |
| Navigation | **React Router** (SPA, ohne Server-Rendering) | Platzcoach ist eine App hinter der Anmeldung plus öffentliche Leseansichten; Server-Rendering bringt hier nichts und bräuchte einen Server |
| Daten | **TanStack Query** + Supabase-Client | Zwischenspeicher, Neuladen beim Zurückkehren in die App, gleichzeitige Änderungen über `expected_version`; ersetzt `refreshDataFromServer`/`saveStore` |
| Formulare | einfache kontrollierte Komponenten; Prüfregeln als reine Funktionen | keine zusätzliche Formular-Bibliothek nötig |
| Aussehen | das bestehende CSS (Farben, Abstände, Komponenten) übernommen, als CSS-Module je Komponente | Oberfläche bleibt wiedererkennbar; keine UI-Bibliothek, kein Tailwind |
| PWA | `vite-plugin-pwa` (Service Worker, Manifest, Update-Hinweis) | ersetzt `sw.js` und `checkForAppUpdate` |
| Tests | **Vitest** (Logik), **Testing Library** (Komponenten), **Playwright** (Abläufe gegen Pre) | laufen in `ci.yml` bei jedem Pull Request |
| Qualität | **ESLint** für Richtigkeit und Sicherheit (Empfehlungen von ESLint, TypeScript-ESLint und das React-Plugin `eslint-plugin-react-hooks`, dazu die Regeln unten), **Prettier** nur für das Aussehen des Codes, `tsc --noEmit` | automatisch in der CI; ESLint formatiert nicht (ESLint hat seine Formatierungsregeln 2023 abgeschafft) |

Bewusst **nicht**: Next.js oder anderes Server-Rendering (bräuchte einen Server, widerspricht Cloudflare Pages + Supabase), Redux oder andere globale Zustands-Bibliotheken (TanStack Query + React-Zustand reichen), UI-Komponentenbibliotheken.

Sicherheit: React escaped Text automatisch. Damit entfällt die größte XSS-Quelle des Piloten. `dangerouslySetInnerHTML` ist per ESLint verboten.

## 3. Aufbau nach Fachbereichen

```
src/
  core/            Supabase-Client, Anmeldung und Sitzung, aktueller Verein,
                   Router, Fehlergrenzen, Toasts, Rückgängig (6 s), Datum/Zeit
  domains/
    verein/        Zugänge, Rollen, Einladungen, Registrierungen
    anlagen/       Anlagen, Plätze, Teilflächen, Kabinen, Sperren
    saison/        Saisons, Mannschaften, Mannschaftsabgleich
    termine/       Termine, Trainingszeiten (Serien), Absagen, Belegung, Konflikte
    spiele/        fussball.de-Spiele, Verlegungen, Ansetzungssuche, Turniere
    torhueter/     Torhüter, Anmeldungen zum Torwarttraining
    nachrichten/   Push-Geräte, Benachrichtigungs-Einstellungen
  views/           Start, Woche, Kalender, Terminformular, Konto, öffentliche Ansicht
  types/           aus dem Schema erzeugte Datenbanktypen (nicht von Hand ändern)
```

Jeder Fachbereich hat dieselben Teile:

| Datei | Inhalt |
|---|---|
| `api.ts` | **einzige Stelle**, die mit Supabase spricht (Lesen über RLS, Schreiben über `api.*`) |
| `queries.ts` | Hooks mit TanStack Query (`useTermine`, `useSaveTermin` …) |
| `logik.ts` | reine Funktionen ohne Bildschirm und Datenbank (z. B. Dauer je Altersklasse, Anzeige-Gruppierung) – mit Tests |
| `komponenten/` | React-Komponenten des Bereichs |
| `index.ts` | öffentliche Schnittstelle; nur das, was andere Bereiche nutzen dürfen |

Die Fachbereiche entsprechen den Domänen des Datenmodells. Fachregeln, die die Datenbank entscheidet (Konflikte, Belegung, Rechte, Absage-Kandidaten), werden im Frontend **nicht** nachgebaut – das Frontend fragt `api.find_conflicts`, `api.day_occupancy` usw. und zeigt das Ergebnis an. Die Oberfläche blendet Aktionen nach Rolle aus, schützt aber nichts.

## 4. Regeln (werden in der CI geprüft)

1. **Nur `api.ts` spricht mit Supabase.** Kein Supabase-Aufruf in Komponenten, Views oder Hooks anderer Bereiche. *Das ist eine Ordnungsregel für den Code, keine Sicherheitsgrenze:* Jeder kann die API auch ohne unsere App aufrufen. Geschützt wird ausschließlich in der Datenbank (RLS, Rechte, `api.*`), getestet über die Angriffsfälle in `BETRIEB.md`.
2. **Abhängigkeiten nur in eine Richtung:** `views` → `domains` → `core`. Fachbereiche importieren andere Fachbereiche nur über deren `index.ts`, nie über innere Dateien.
3. **Keine Fachregel doppelt.** Was die Datenbank entscheidet, entscheidet nur die Datenbank; was das Frontend berechnet, steht genau einmal in einem `logik.ts`.
4. **Kein `dangerouslySetInnerHTML`, kein `innerHTML`.**
5. **Keine Geheimnisse im Frontend.** Nur Supabase-URL und `anon`-Schlüssel, je Umgebung über Vite-Variablen.
6. **Kleine Dateien:** Richtwert unter 300 Zeilen je Datei, damit jede Datei vollständig in eine Vibe-Coding-Sitzung passt.
7. **Nichts vereinsspezifisch:** kein Vereinsname, keine Platznamen, keine IDs im Code (wie im Pilot-Prinzip 5).

| Regel | geprüft durch | Herkunft |
|---|---|---|
| 1, 2 | ESLint, sperrt (`no-restricted-imports`, Grenzen zwischen Ordnern) | übliche Schichtentrennung |
| 3 | Tests (App und Datenbank liefern dasselbe Ergebnis) und Durchsehen des Pull Requests | Prinzip „Don't repeat yourself“ |
| 4 | ESLint, sperrt | OWASP-Empfehlung gegen Cross-Site-Scripting |
| 5 | Geheimnis-Suche von GitHub, Prüfung beim Bauen | OWASP-Empfehlung |
| 6 | ESLint `max-lines`, nur Warnung | Standardwert der Regel (300) |
| 7 | Suche nach Vereins- und Platznamen in der CI, Durchsehen | Platzcoach-Prinzip 5 |

## 5. Reihenfolge des Aufbaus

Jeder Schritt läuft über Pull Request und Pre und wird gegen die gespiegelten Daten geprüft. Die Oberfläche folgt dem Piloten (dieselben Ansichten, dieselben Klick-Budgets), Verbesserungen erst nach dem Umzug.

1. **Grundgerüst:** Vite + React + TypeScript, ESLint-Regeln, CI, Deploy nach Pre, PWA, erzeugte Datenbanktypen
2. **`core`:** Anmeldung (Supabase Auth), Vereinswahl, Navigation, Toasts, Rückgängig
3. **`anlagen` + `termine`:** Woche, Tag mit Zeitleiste, Terminformular – das Herz der App
4. **`spiele`:** fussball.de-Spiele, Verlegungen, Ansetzungssuche
5. **`saison`, `verein`:** Konto, Zugänge, Einladungen, Mannschaftsabgleich
6. **`torhueter`, `nachrichten`:** Torwarttraining, Push, Einstellungen
7. **Startseite** („Meine Woche“, Zu erledigen) als Zusammenspiel aller Bereiche
8. **Abnahme:** Klick-Budgets nachzählen, Playwright-Abläufe der häufigsten Aufgaben grün, Testphase mit Trainern auf Pre

## 6. Offene Punkte

- [ ] Ort des neuen Frontends: **eigenes privates Repo** (Vorschlag: Code von Anfang an privat, Pilot-Repo bleibt unberührt) oder Ordner `app/` im Pilot-Repo
- [ ] Liste der Pilot-Ansichten mit Screenshots als Abnahmegrundlage (was muss am Umzugstag genauso funktionieren)
- [ ] Öffentliche Leseansicht ohne Anmeldung (Prinzip 6): eigene Route mit `api.public_calendar`
