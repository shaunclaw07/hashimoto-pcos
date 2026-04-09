# Hashimoto & PCOS Ernährungs-Tool

> Ein wissenschaftlich fundiertes Web-Tool zur Ernährungsberatung bei Hashimoto-Thyreoiditis und polyzystischem Ovarialsyndrom.

---

## Projektvision

Dieses Projekt hilft Frauen, die sowohl an Hashimoto als auch an PCOS leiden, die richtigen Lebensmittel zu finden. Durch einen intelligenten **Produkt-Scanner** und visuell klar kommunizierte Bewertungen (Ampel-System) wird komplexe ernährungswissenschaftliche Forschung für den Alltag nutzbar gemacht.

### Kernfeatures

- 📷 **Barcode-Scanner** - Produkte scannen und sofort Bewertung erhalten
- 🔍 **Lebensmittel-Datenbank** - Suche nach einzelnen Lebensmitteln (DACH-Produkte mit vollständigen Nährwerten)
- 📊 **Nährstoff-Analyse** - Detaillierte Aufschlüsselung pro Produkt mit Bewertungsgründen
- 🦋 **Nutzerprofil-Personalisierung** - Bewertungen auf Hashimoto, PCOS oder beides zugeschnitten
- 🌱 **Erweitertes Scoring** - Differenzierte Erkennung von Soja (Phytoöstrogene/fermentiert/Lecithin), Omega-3-Quellen (marin/pflanzlich), Milchprodukt-Typen (Casein/Whey/fermentiert/Ghee) und Goitrogenen (Kreuzblütler, roh vs. gegart)
- 📳 **Haptisches Feedback** - Vibration bei Scan-Erfolg und Speichern
- 🔄 **Pull-to-Refresh** - Mobile Geste zum Aktualisieren der Suchergebnisse
- ↩️ **Rückgängig** - 3-Sekunden-Countdown beim Entfernen gespeicherter Produkte
- 🎓 **Wissenschaftlich fundiert** - Alle Empfehlungen basieren auf aktueller Studienlage
- 👩‍💻 **DAU-freundlich** - Keine medizinischen Vorkenntnisse nötig

---

## Projektstruktur

Das Projekt folgt **Hexagonaler Architektur (Ports & Adapters)**. Abhängigkeiten zeigen immer nach innen: `presentation/ → infrastructure/ → core/`. `core/` hat null Framework-Abhängigkeiten.

```
hashimoto-pcos/
├── src/
│   ├── core/                        # ZERO Framework-Dependencies
│   │   ├── domain/                  # Datentypen: Product, ScoreResult, UserProfile
│   │   ├── ports/                   # Interfaces: IProductRepository, IFavoritesRepository
│   │   ├── services/                # Pure functions: calculateScore, isValidEan13
│   │   └── use-cases/               # Orchestrierung: GetProductUseCase, SearchProductsUseCase
│   ├── infrastructure/              # Implementierungen der Ports
│   │   ├── sqlite/                  # SQLite-Adapter (client, mappers, repository)
│   │   ├── openfoodfacts/           # OFf API-Adapter (types, mappers, adapter)
│   │   ├── storage/                 # LocalStorage-Adapter für Favoriten
│   │   └── container.ts             # Factory-Funktionen (kein DI-Framework)
│   ├── app/                         # Next.js App Router (Presentation Layer)
│   │   ├── page.tsx                 # Landing Page
│   │   ├── scanner/page.tsx         # Barcode-Scanner
│   │   ├── lebensmittel/page.tsx    # Produktsuche
│   │   ├── onboarding/page.tsx      # Erstkonfiguration Nutzerprofil (2-Schritt-Wizard)
│   │   ├── einstellungen/page.tsx   # Profilseite (Profil anzeigen / ändern)
│   │   ├── result/[barcode]/        # Produktdetail + Score
│   │   └── api/products/            # Schlanke API-Routes (delegieren an Use Cases)
│   ├── components/                  # React-Komponenten
│   │   ├── ScoreCard.tsx            # Score-Badge, Breakdown mit Profil-Icons
│   │   ├── Scanner.tsx              # QuaggaJS2 Barcode-Scanner
│   │   ├── bottom-nav.tsx           # Fixed Bottom Navigation (4 Tabs)
│   │   ├── profile-header.tsx       # Globale Top-Bar mit Profil-Badge
│   │   ├── onboarding-guard.tsx     # Redirect-Guard → /onboarding bei fehlendem Profil
│   │   └── theme-provider.tsx       # Dark/Light Mode
│   ├── hooks/
│   │   └── use-user-profile.ts      # localStorage-Hook für Nutzerprofil-State
│   └── lib/
│       ├── utils.ts                 # cn() Hilfsfunktion
│       └── profile-options.ts       # Geteilte Konstanten: CONDITIONS, SENSITIVITY_OPTIONS
├── data/
│   └── products.db                  # Lokale SQLite-DB (~462k DACH-Produkte, via npm run db:build)
├── scripts/
│   ├── build-db.mjs                 # CSV → SQLite (DACH-Filter, FTS5, Zutaten-Parsing)
│   ├── ingredient-parser.mjs         # Zwei-Phasen-Parser: Klammerstruktur + Doppelpunkt-Auflösung
│   ├── ingredient-data.mjs           # GERMAN-Whitelist (~350 Einträge) + Funktionale Labels
│   └── extract-fixtures.mjs         # 5 Test-Produkte aus DB → tests/fixtures/products/
├── tests/
│   ├── fixtures/products/           # Produkt-Fixtures (Domain-Format)
│   └── helpers/mock-api.ts          # Playwright-Mock-Hilfsfunktionen
├── e2e/                             # Playwright E2E Tests (10 Specs, 75 Tests)
├── docs/recherche/                  # Wissenschaftliche Grundlagen
├── k8s/                             # Kubernetes Manifests
└── .github/workflows/               # CI/CD Pipelines
```

---

## Dokumentation

### Recherche-Phase (abgeschlossen)

- [Wissenschaftliche Grundlagen](./docs/recherche/01_hashimoto_pcos_grundlagen.md) - Krankheitsbilder, Pathophysiologie, Zusammenhänge
- [Lebensmittel-Bewertung](./docs/recherche/02_lebensmittel_bewertung.md) - Detaillierte Lebensmittellisten nach Kategorien
- [Nahrungsergänzungen](./docs/recherche/03_nahrungsergaenzungen.md) - Mikronährstoffe, Dosierungen, Interaktionen
- [Produkt-Scan-API](./docs/recherche/04_produkt_scan_api.md) - OpenFoodFacts-Integration & Scoring-Algorithmus

---

## Wissenschaftliche Quellen

Die Recherche basiert auf folgenden Quellen:

- Frontiers in Immunology (2023): "The interplay of oxidative stress and immune dysfunction in Hashimoto's thyroiditis and polycystic ovary syndrome"
- Med Uni Graz: Habilitationsschrift Hashimoto & Ernährung
- Deutsches Schilddrüsenzentrum: Ernährungsstudien
- NDR.de: Ernährungsratgeber Hashimoto & PCOS
- OpenFoodFacts: Open-Source Lebensmittel-Datenbank

---

## Status

| Phase | Status |
|-------|--------|
| Recherche | ✅ Abgeschlossen |
| MVP-Entwicklung | ✅ Abgeschlossen |
| E2E-Tests | ✅ Abgeschlossen |
| Lokale SQLite-DB | ✅ Abgeschlossen |
| Tailwind v4 Migration | ✅ Abgeschlossen |
| Hexagonale Architektur | ✅ Abgeschlossen |
| Nutzerprofil-Personalisierung | ✅ Abgeschlossen |
| Scoring-Erweiterungen (#50/#51/#53/#54) | ✅ Abgeschlossen |
| Mobile Experience (#73) | ✅ Abgeschlossen |
| Beta-Release | 🔄 In Planung |

---

## Quick Start (Entwickler)

```bash
# Repository klonen
git clone https://github.com/shaunclaw07/hashimoto-pcos.git
cd hashimoto-pcos

# Dependencies installieren
npm install

# Lokale Produktdatenbank aufbauen (einmalig, CSV vorher herunterladen)
# CSV: https://world.openfoodfacts.org/data → en.openfoodfacts.org.products.csv
npm run db:build                          # CSV im Projektverzeichnis erwartet
# oder mit explizitem Pfad:
node scripts/build-db.mjs /pfad/zur/csv

# Development-Server starten
npm run dev           # Port 3000 (oder 3001 falls belegt)
npm run dev:clean     # .next-Cache löschen und neu starten

# Tests ausführen
npm run test:run       # Vitest Unit-Tests
npm run test:e2e       # Playwright E2E-Tests (Dev-Server wird auto-gestartet)
npm run test:e2e:ui    # Playwright mit interaktiver UI

# Qualitäts-Checks
npm run lint
npm run build
```

> **Hinweis:** Ohne `data/products.db` fällt die App automatisch auf die OpenFoodFacts-API zurück. Die lokale DB ist optional, wird aber für zuverlässige Performance empfohlen.
>
> Das Build-Script importiert nur DACH-Produkte (DE/AT/CH) mit gültigem EAN-13-Barcode, deutschem Produktnamen und mindestens 5 Nährwert-Feldern — Produkte ohne ausreichende Daten werden gefiltert.
>
> Fehlende Nährwerte werden beim ersten Abruf automatisch von der OFf-API nachgeladen und dauerhaft in der lokalen DB gespeichert — die DB vervollständigt sich selbst mit der Nutzung.

---

## Datenbank & Scripts

### SQLite-Datenbank (`data/products.db`)

Die lokale Datenbank enthält **~462.000 DACH-Produkte** (Deutschland, Österreich, Schweiz) und wird über `npm run db:build` aus dem OpenFoodFacts-CSV aufgebaut.

**Tabellen:**

| Tabelle | Beschreibung |
|---------|-------------|
| `products` | Produkte mit Name, Marke, Bild, Nährwerten (JSON), Zutatenliste, Allergenen, Additiven |
| `products_fts` | FTS5-Volltextindex für schnelle Produktsuche nach Name/Marke |
| `ingredients` | Kanonische Zutatennamen (Kleinbuchstaben, Deutsch) — wird beim DB-Build befüllt |
| `product_ingredients` | Normalisierte Zutatenliste pro Produkt (Position + Rohtext) |

**Filter beim Import:**
- Gültiger EAN-13-Barcode (`/^\d{13}$/`)
- DACH-Länderkennzeichen (`en:germany`, `en:austria`, `en:switzerland`)
- Deutscher Produktname vorhanden (`product_name_de`)
- Mindestens 5 Nährwert-Felder mit gültigen Zahlenwerten

### Zutaten-Parsing-Pipeline

Beim DB-Build wird die rohe Zutatenliste (`ingredients_text`) über eine zwei-phasige Pipeline normalisiert:

**Phase 1 — Klammerstruktur auflösen** (`flattenIngredients`):
- Klammern werden rekursiv verarbeitet (z.B. `"Zucker (2%), (Vitamin-mineralisch)"`)
- Verschachtelungstiefe wird gezählt: Ebene 0 = Hauptzutaten, Ebene 1 = Unterzutaten, Tiefer als 1 = wird verworfen (z.B. Prozentangaben)
- Komma und Semikolon teilen Zutaten; ein Prozentzeichen nach Komma wird korrigiert (z.B. `"99,9%"`)

**Phase 2 — Doppelpunkt-Auflösung**:
- `"Emulgator: Sonnenblumenlecithin"` → nur `"sonnenblumenlecithin"` (funktionales Label unterdrückt)
- `"Salz: Mehl"` → beide als Zutaten (beide bekannt)
- Mehrere Doppelpunkte (z.B. `"Emulgator: Sojalecithin: E322"`) → aufteilen, funktionale Labels herausfiltern

**Reinigung (12 Schritte):** Klammerreste entfernen, Prozentzeichen, Bindestriche normalisieren, Encoding-Artefakte entfernen, E-Nummern formatieren, Ziffern-Token entfernen, Whitelist-Abgleich (GERMAN-Set, ~350 Einträge).

### Scripts

| Script | Funktion |
|--------|----------|
| `scripts/build-db.mjs` | CSV → SQLite. DACH-Filter, FTS5-Index, Zutaten-Parsing, Cache-Optimierung |
| `scripts/ingredient-parser.mjs` | Zwei-Phasen-Parser. Exportiert `parseIngredients(text)` und `isValidProductName(name)` |
| `scripts/ingredient-data.mjs` | GERMAN-Whitelist (Set, ~350 Einträge) + FUNCTIONAL_LABELS-Set |
| `scripts/extract-fixtures.mjs` | 5 Test-Produkte aus DB in `tests/fixtures/products/` extrahieren |

```bash
# DB aufbauen (CSV von https://products.openfoodfacts.org/data herunterladen)
node scripts/build-db.mjs /pfad/zur/en.openfoodfacts.org.products.csv

# Test-Fixtures aktualisieren (nach DB-Änderungen)
node scripts/extract-fixtures.mjs
```

> **Hinweis:** Alle Scripts verwenden die `.mjs`-Endung für ESM. `package.json` darf **nicht** `"type": "module"` gesetzt werden — das würde `better-sqlite3` und die Next.js-Konfiguration brechen.

**Wichtige Docs für Entwickler:**
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Mitwirkungs-Guide, Branching, Coding-Standards (TDD, Pre-commit-Gate, Architekturregeln)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System-Architektur, Scoring-Algorithmus, Datenfluss
- [CLAUDE.md](./CLAUDE.md) — Vollständiger Projekt-Kontext für AI-Assistenten
- [docs/](./docs/) — Wissenschaftliche Grundlagen

---

## Deployment

### Docker

```bash
# Lokale DB aufbauen (Voraussetzung!)
npm run db:build

# Mit Docker Compose bauen und starten
docker compose up --build -d

# Container-Logs anzeigen
docker compose logs -f

# Oder manuell
docker build -t hashimoto-pcos .
docker run -p 3000:3000 hashimoto-pcos
```

> **Wichtig:** `npm run db:build` muss **vor** dem Docker-Build ausgeführt werden. Das `data/products.db`-File wird beim Build-Schritt in das Image kopiert.

### Kubernetes

```bash
# Deployment anwenden
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml

# Status prüfen
kubectl get pods -l app=hashimoto-pcos
kubectl get hpa hashimoto-pcos-hpa
```

**Voraussetzungen:**
- K3s oder Kubernetes-Cluster
- NGINX Ingress Controller
- ghcr.io/shaunclaw07/hashimoto-pcos Docker-Image

## Mitwirken

Dieses Projekt ist Open Source. Beiträge willkommen!

### Issue-Templates

- **[Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)** — Neues Feature vorschlagen
- **[Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)** — Fehler melden

### Pull Request Template

Pull Requests sollten [.github/pull_request_template.md](.github/pull_request_template.md) verwenden.

---

*Letzte Aktualisierung: 2026-04-06*
