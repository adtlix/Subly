# Subly Abo-Manager — Projektgedächtnis & Entwicklungsregeln

> **HINWEIS FÜR AGENTEN:** Diese Datei wird von Antigravity beim Öffnen des Projekts automatisch geladen. Lies diese Richtlinien und den Projektkontext sorgfältig durch, bevor du Änderungen vornimmst.

---

## 1. Projekt-Überblick
* **Projektname:** Subly (Schweizer SaaS Abo-Manager & Vertrags-Cockpit)
* **Ziel:** Eine vertrauenswürdige, elegante Schweizer Web-App zum Verwalten von Verträgen, Erkennen von Einsparpotenzialen, Vorbereiten von Kündigungen und automatischen Scannen von Rechnungen.
* **Standardwährung:** Schweizer Franken (`CHF`) (mit Unterstützung für `EUR`).
* **Monorepo-Struktur:** `pnpm`-Workspaces
  * `artifacts/subly/`: React 19 Frontend (Vite 7, TailwindCSS v4, Lucide Icons)
  * `artifacts/api-server/`: Express Backend mit SQLite-Datenbank (`node:sqlite` im WAL-Modus)
  * `lib/db/`: Drizzle ORM Schemas
  * `tests/`: Automatisierte Testsuite (19 Tests, 100% grün)
  * `subly_codebase.txt`: Komplette, exportierte Codebasis aller 34 Projektdateien

---

## 2. Zentrale Architektur & Funktionsweise

### A. Backend (`artifacts/api-server/src/`)
- **Datenbank & Persistenz (`lib/cloud-db.ts`):**
  - Läuft mit `node:sqlite` (DatabaseSync) im performanten **WAL-Modus** (`PRAGMA journal_mode = WAL`).
  - Strikte **User-Isolation** (Nutzer dürfen nur auf ihre eigenen Abos zugreifen; Fremdzugriffe liefern HTTP `403 Forbidden`).
  - Kryptografisch sichere 2FA-Code-Erzeugung (`crypto.randomInt`) und Timing-Attack-Schutz (`crypto.timingSafeEqual`).
  - Automatisches stündliches Housekeeping (`cleanupExpired()`) für abgelaufene Sessions und 2FA-Codes.
- **Routen (`routes/`):**
  - `auth.ts`: Registrierung, Login, 2FA-Verifizierung, Rate-Limiting (Lockout nach 5 Fehlversuchen).
  - `subscriptions.ts`: Volles CRUD (`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `PUT /:id`, `DELETE /:id`, `POST /:id/used`).
  - `scan.ts`: Rechnungs-Upload bis 30 MB (Body-Parser bis 50 MB, Base64-Verarbeitung via `FileReader`).
- **Dokumenten- & Rechnungs-Scanner (`lib/document-extractor.ts`):**
  - Vollständige Crash-Resistenz gegen korrupte PDFs.
  - Erkennung gängiger Schweizer Anbieter:
    - *Telecom:* Swisscom, Sunrise, Salt, Wingo, Galaxus Mobile, Quickline, Init7
    - *Krankenkassen:* CSS, Helsana, Swica, Sanitas, Visana, Concordia, Groupe Mutuel
    - *Mobilität:* SBB (Generalabonnement, Halbtax, SwissPass), Fairtiq
    - *Versicherungen:* Die Mobiliar, AXA, Zurich
    - *Streaming/Software:* Netflix, Spotify, Disney+, Apple, Adobe, Microsoft, Prime
  - Schweizer Betragsformate: Unterstützt Dezimalstellen (`CHF 79.90`) und Strich-Notation (`CHF 79.-`, `Fr. 79.-`).

### B. Frontend (`artifacts/subly/src/`)
- **Hauptkomponente (`App.tsx`):**
  - Cockpit mit monatlicher/jährlicher Kostenübersicht, Kündigungsfristen-Warnung.
  - Abonnemente-Tabelle & Grid mit offiziellen Logo-Integrationen.
  - Smart Savings & Abo-Audit (Erkennung ungenutzter „Zombie“-Abos, Streaming-Doppelungen).
  - Kündigungs-Assistent (generiert rechtsgültige Kündigungsschreiben nach Schweizer Recht inkl. Kündigungsfrist-Berechnung).
  - Rechnungs-Scanner-Modal mit Drag & Drop, Vorschau und Evidenz-Mapping.
  - Einstellungen (Währung, Kündigungsfristen, JSON-Export & Backup).

---

## 3. Strikte Nutzerregeln & Do's / Don'ts

1. **Keine Fake-Daten / Kein Hardcoding:**
   - Niemals gefälschte KI-Texte wie *"99% KI-Konfidenz"* oder simulierte Ergebnisse einbauen.
   - Benutzerdaten immer dynamisch aus der Session laden (`user?.name`, `user?.email`), niemals hartcodierte Test-Namen wie „Julian Christen“ im Template belassen.
2. **Bereinigte Begriffe (Wichtig!):**
   - Folgende Begriffe wurden auf Nutzerwunsch explizit entfernt und dürfen NICHT wieder eingeführt werden:
     - ❌ `Dein Cloud-Ledger` (stattdessen: `Abonnemente` oder `Übersicht`)
     - ❌ `Cloud-Konto` (stattdessen: `Benutzerkonto`)
     - ❌ Die 2FA-Werbe-Infokarte in den Einstellungen
     - ❌ Die Statuskarte *„Dein Account / Cloud Sync / CLOUDSYNC / AKTIV“*
     - ❌ `Cloud Workspace`
3. **UI-Stabilität:**
   - Verändere keine funktionierenden UI-Komponenten oder Stylings, es sei denn, der Nutzer verlangt es explizit.
4. **Entwicklungs- und Test-Disziplin:**
   - Führe vor und nach Code-Änderungen immer `pnpm test` und `pnpm run typecheck` aus.
   - Alle 19 bestehenden Unittests müssen jederzeit zu 100% grün bleiben!

---

## 4. Wichtige Terminal-Befehle

| Aktion | Befehl |
| :--- | :--- |
| **Vite Dev Server starten** | `pnpm --filter @workspace/subly run dev` (Port 3000) |
| **Backend neu bauen** | `pnpm --filter @workspace/api-server run build` |
| **Alle Tests ausführen** | `pnpm test` |
| **Typecheck (Gesamtes Projekt)** | `pnpm run typecheck` |
| **Codebase exportieren** | `node -e '...'` (oder [`subly_codebase.txt`](file:///Users/julian/.gemini/antigravity/scratch/Subly-Abo-Manager/subly_codebase.txt) ansehen) |

