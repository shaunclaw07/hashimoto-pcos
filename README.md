# Hashimoto & PCOS Ernährungs-Tool

> Ein wissenschaftlich fundiertes Web-Tool zur Ernährungsberatung bei Hashimoto-Thyreoiditis und polyzystischem Ovarialsyndrom.

---

## Projektvision

Dieses Projekt hilft Frauen, die sowohl an Hashimoto als auch an PCOS leiden, die richtigen Lebensmittel zu finden. Durch einen intelligenten **Produkt-Scanner** und visuell klar kommunizierte Bewertungen (Ampel-System) wird komplexe ernährungswissenschaftliche Forschung für den Alltag nutzbar gemacht.

### Kernfeatures

- 📷 **Barcode-Scanner** - Produkte scannen und sofort Bewertung erhalten
- 🔍 **Lebensmittel-Datenbank** - Suche nach einzelnen Lebensmitteln (462k+ DACH-Produkte lokal)
- 📊 **Nährstoff-Analyse** - Detaillierte Aufschlüsselung pro Produkt
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
│   │   ├── result/[barcode]/        # Produktdetail + Score
│   │   └── api/products/            # Schlanke API-Routes (delegieren an Use Cases)
│   ├── components/                  # React-Komponenten (ScoreCard, Scanner, BottomNav)
│   └── lib/
│       └── utils.ts                 # cn() Hilfsfunktion
├── data/
│   └── products.db                  # Lokale SQLite-DB (via npm run db:build)
├── scripts/
│   └── build-db.mjs                 # CSV → SQLite Konvertierskript
├── tests/
│   ├── fixtures/products/           # 5 Produkt-Fixtures (Domain-Format)
│   └── helpers/mock-api.ts          # Playwright-Mock-Hilfsfunktionen
├── e2e/                             # Playwright E2E Tests (9 Specs)
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
> Fehlende Nährwerte werden beim ersten Abruf eines Produkts automatisch von der OFf-API nachgeladen und dauerhaft in der lokalen DB gespeichert — die DB vervollständigt sich selbst mit der Nutzung.

**Wichtige Docs für Entwickler:**
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Mitwirkungs-Guide, Branching, Coding-Standards
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

*Letzte Aktualisierung: 2026-04-02*
