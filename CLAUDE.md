# Hinweise für die Arbeit an Platzcoach

- **Produktprinzipien:** Vor jedem neuen Feature `docs/PRINZIPIEN.md` lesen und die Prüfliste dort durchgehen. Kurz: null Klicks vor einem Klick, jede Rolle sieht nur ihr Nötiges, nicht überladen, Klick-Budgets einhalten, nichts redundant und nichts SVBB-spezifisch fest einbauen, Lesen ohne Anmeldung.
- **Migration und Betrieb (Planung):** Zielarchitektur mit Dev, Pre (pre.platzcoach.de) und Pro steht in `docs/BETRIEB.md`, die Regeln in Abschnitt 8 von `docs/PRINZIPIEN.md`. Bis zum Start der Migration gilt für den Pilot weiter `README-DEPLOY.md`. Claude arbeitet nie mit Zugangsdaten zu Pro.
- **Pilot nicht umbauen:** Die Pilot-App (`index.html`, `data/`, `scripts/`, `worker/`) wird für die Migration nicht verändert. Das neue Frontend (React, TypeScript, Vite, nach Fachbereichen) entsteht getrennt, siehe `docs/ARCHITEKTUR.md`.
- **Arbeitsweise im Umbau:** `docs/ARBEITSWEISE.md` – Branch `feature/<Issue>-<kurz>`, Pull Request nach Vorlage mit „Refs #…“, Doku im selben PR, kritische Teile einfach erklären, nie Zugangsdaten im Chat.
- **Backlog:** `docs/BACKLOG.md` ist die nummerierte Feature-Liste mit Status. Wird ein Punkt umgesetzt oder teilweise umgesetzt, Status und Notiz (Datum) im selben Commit wie den Code aktualisieren. Neue Ideen bekommen die nächste freie Nummer.
- **Vorhandenes zuerst:** Vor dem Bauen im Code (`index.html`, `scripts/`) suchen, ob es die Funktion oder einen passenden Baustein schon gibt, und diesen erweitern.
- **Sprache:** Oberfläche und Doku auf Deutsch, Ansprache „du“.
- **Pull Requests:** Nach jedem Commit oder PR immer den direkten Link zum Pull Request nennen.
