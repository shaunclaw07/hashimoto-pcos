# Hashimoto & PCOS Ernährungs-Tool

> Ein wissenschaftlich fundiertes Web-Tool zur Ernährungsberatung bei Hashimoto-Thyreoiditis und polyzystischem Ovarialsyndrom.

---

## Projektvision

Dieses Projekt hilft Frauen, die sowohl an Hashimoto als auch an PCOS leiden, die richtigen Lebensmittel zu finden. Durch einen intelligenten **Produkt-Scanner** und visuell klar kommunizierte Bewertungen (Ampel-System) wird komplexe ernährungswissenschaftliche Forschung für den Alltag nutzbar gemacht.

### Kernfeatures

- 📷 **Barcode-Scanner** - Produkte scannen und sofort Bewertung erhalten
- 🔍 **Lebensmittel-Datenbank** - Suche nach einzelnen Lebensmitteln
- 📊 **Nährstoff-Analyse** - Detaillierte Aufschlüsselung pro Produkt
- 🎓 **Wissenschaftlich fundiert** - Alle Empfehlungen basieren auf aktueller Studienlage
- 👩‍💻 **DAU-freundlich** - Keine medizinischen Vorkenntnisse nötig

---

## Projektstruktur

```
hashimoto-pcos/
├── src/
│   ├── app/                    # Next.js 14 App Router Seiten
│   │   ├── page.tsx            # Landing Page
│   │   ├── scanner/page.tsx    # Barcode-Scanner
│   │   ├── lebensmittel/       # Produktsuche
│   │   └── result/[barcode]/   # Produktdetail + Score
│   ├── components/              # React Components
│   │   ├── Scanner.tsx         # QuaggaJS2 Barcode-Scanner
│   │   ├── ScoreCard.tsx      # Bewertungsanzeige
│   │   └── bottom-nav.tsx     # Navigation
│   └── lib/
│       ├── openfoodfacts.ts   # OpenFoodFacts API-Client
│       ├── scoring.ts          # Bewertungsalgorithmus
│       └── utils.ts            # Helfer (cn())
├── e2e/                        # Playwright E2E Tests (9 Specs)
├── docs/recherche/             # Wissenschaftliche Grundlagen
├── k8s/                        # Kubernetes Manifests
└── .github/workflows/          # CI/CD Pipelines
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
| Beta-Release | 🔄 In Planung |

---

## Quick Start (Entwickler)

```bash
# Repository klonen
git clone https://github.com/shaunclaw07/hashimoto-pcos.git
cd hashimoto-pcos

# Dependencies installieren
npm install

# Development-Server starten
npm run dev

# Tests ausführen
npm run test:run       # Vitest Unit-Tests
npm run test:e2e       # Playwright E2E-Tests (Dev-Server wird auto-gestartet)
npm run test:e2e:ui    # Playwright mit interaktiver UI

# Qualitäts-Checks
npm run lint
npm run build
```

**Wichtige Docs für Entwickler:**
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Mitwirkungs-Guide, Branching, Coding-Standards
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System-Architektur, Scoring-Algorithmus, Datenfluss
- [CLAUDE.md](./CLAUDE.md) — Vollständiger Projekt-Kontext für AI-Assistenten
- [docs/](./docs/) — Wissenschaftliche Grundlagen

---

## Deployment

### Docker

```bash
# Mit Docker Compose starten
docker-compose up -d

# Container-Logs anzeigen
docker-compose logs -f

# Produktions-Build
docker build -t hashimoto-pcos .
docker run -p 3000:3000 hashimoto-pcos
```

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

*Letzte Aktualisierung: 2026-03-30*
