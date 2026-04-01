# Mitwirken am Hashimoto-PCOS Projekt

🎉 Danke für dein Interesse! Jeder Beitrag ist willkommen.

---

## Schnellstart

```bash
# Repository klonen
git clone https://github.com/shaunclaw07/hashimoto-pcos.git
cd hashimoto-pcos

# Dependencies installieren
npm install

# Lokale Produktdatenbank aufbauen (einmalig, CSV vorher herunterladen)
# CSV: https://world.openfoodfacts.org/data → en.openfoodfacts.org.products.csv
npm run db:build

# Development-Server starten
npm run dev

# Tests ausführen
npm run test:run      # Vitest Unit-Tests
npm run test:e2e      # Playwright E2E-Tests
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

---

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript 6 |
| Runtime | React 19 |
| Styling | Tailwind CSS v4 (CSS-first) |
| Unit-Tests | Vitest 4.x |
| E2E-Tests | Playwright 1.x |
| Barcode-Scanner | QuaggaJS2 |
| Lebensmittel-Daten | SQLite (lokal) + OpenFoodFacts API (Fallback) |

---

## Branching-Strategie

Wir nutzen **Feature-Branches** basierend auf Issues:

```bash
# Neuen Branch für Issue erstellen
git checkout -b feat/issue-{N}-{kurze-beschreibung}

# Nach Fertigstellung
git push origin feat/issue-{N}-{kurze-beschreibung}
```

**Branch-Typen:**
- `feat/` — Neue Features
- `fix/` — Bug Fixes
- `docs/` — Nur Dokumentation
- `refactor/` — Code-Umstrukturierung

---

## Workflow

### 1. Issue erstellen

Vor dem Arbeiten immer ein Issue anlegen (oder eines zuweisen lassen).

Verwende die Issue-Templates:
- **Feature Request** — Für neue Features
- **Bug Report** — Für Fehler

### 2. Branch erstellen

```bash
git checkout -b feat/issue-15-developer-docs
```

### 3. Entwickeln

- Schreibe erst die **Tests** (TDD-Ansatz empfohlen)
- Implementiere dann die Feature-Logik
- Halte den Code **clean** und **einfach**

### 4. Commit-Nachrichten

Wir folgen [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scanner): add camera permission handling
fix(scoring): correct iodine calculation for kelp products
docs(readme): update installation instructions
```

### 5. Pull Request erstellen

```bash
gh pr create --fill
```

P.R. muss:
- Das zugehörige Issue **referenzieren** (`Closes #N`)
- Alle **Checks bestehen** (Lint, Test, Build)
- Die **Checkliste** im PR-Template ausgefüllt haben

### 6. Review & Merge

- Mindestens **1 Review** erforderlich
- Nach Approval: **Merge via Squash** bevorzugt

---

## Coding-Standards

### TypeScript

- **Strict Mode** ist aktiviert
- Keine `any` Typen — immer `unknown` oder spezifische Typen verwenden
- Interfaces für Objekte, Types für Unions/Primitives

### Naming Conventions

```typescript
// Variablen/Funktionen: camelCase
const userName = "Chrischi";
function calculateScore() {}

// Komponenten: PascalCase
function ScoreCard() {}
function BarcodeScanner() {}

// Konstanten: SCREAMING_SNAKE_CASE
const API_BASE_URL = "https://world.openfoodfacts.org";
const MAX_RETRY_ATTEMPTS = 3;
```

### Testing

- **Unit-Tests** für alle Business-Logik (z.B. `scoring.ts`, `openfoodfacts.ts`)
- **E2E-Tests** mit Playwright für UI-Flows (`e2e/*.spec.ts`)
- Unit-Testdateien unter `src/lib/__tests__/*.test.ts`

```bash
# Einzelne Test-Datei
npm run test:run -- src/lib/__tests__/scoring.test.ts

# Watch mode während Entwicklung
npm run test

# E2E Tests
npm run test:e2e
```

---

## Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Startseite
│   ├── scanner/           # Barcode-Scanner
│   ├── lebensmittel/      # Lebensmittel-Suche
│   └── result/[barcode]/  # Produkt-Ergebnis
├── components/            # React-Komponenten
│   ├── ScoreCard.tsx      # Nährwert-Anzeige
│   ├── Scanner.tsx        # QuaggaJS Integration
│   └── ...
└── lib/                   # Business-Logik
    ├── scoring.ts         # Scoring-Algorithmus
    ├── openfoodfacts.ts   # API-Client
    └── utils.ts           # Hilfsfunktionen

docs/
├── recherche/             # Wissenschaftliche Grundlagen
└── ...

.github/
├── ISSUE_TEMPLATE/       # Issue-Vorlagen
└── pull_request_template.md
```

---

## API-Integration

### OpenFoodFacts

```typescript
import { searchProducts, getProductByBarcode } from '@/lib/openfoodfacts';

// Produkt per Barcode laden
const product = await getProductByBarcode('7622210449283');

// Produkte suchen
const results = await searchProducts('quark', { page = 1, page_size = 20 });
```

---

##Hilfe & Fragen

- **Issues:** [GitHub Issues](https://github.com/shaunclaw07/hashimoto-pcos/issues)
- **Discussions:** Für allgemeine Fragen

---

Viel Spaß beim Entwickeln! 🚀
