# Mitwirken am Hashimoto-PCOS Projekt

Danke für dein Interesse! Jeder Beitrag ist willkommen.

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

## Architektur verstehen (Pflichtlektüre)

Das Projekt folgt **Hexagonaler Architektur (Ports & Adapters)**. Bevor du code schreibst, lies [ARCHITECTURE.md](./ARCHITECTURE.md).

**Die eine Regel:** `src/core/` darf niemals aus `src/infrastructure/` oder `src/app/` importieren. Der Rest der App kann frei in `core/` importieren. ESLint erzwingt dies automatisch — ein Verstoß bricht den Lint-Check.

```
presentation/ (app/, components/)
      ↓ importiert
infrastructure/ (sqlite/, openfoodfacts/, storage/)
      ↓ implementiert
core/ (domain/, ports/, services/, use-cases/)
      ← KEINE Abhängigkeit nach oben
```

---

## Neues Feature entwickeln

Die Architektur hat eine klare Reihenfolge für neue Features. Hier am Beispiel "Mahlzeiten-Tracker":

### Schritt 1: Domain-Typen definieren (in `core/domain/`)

```typescript
// src/core/domain/meal.ts
export interface Meal {
  id: string
  products: string[]   // barcodes
  eatenAt: number      // timestamp
}
```

### Schritt 2: Port definieren (in `core/ports/`)

```typescript
// src/core/ports/meal-repository.ts
import type { Meal } from "../domain/meal"

export interface IMealRepository {
  getAll(): Meal[]
  save(meal: Meal): void
  remove(id: string): void
}
```

### Schritt 3: Use Case schreiben — TDD (in `core/use-cases/`)

Erst den Test schreiben, der noch fehlschlägt:

```typescript
// src/core/use-cases/log-meal.test.ts
import { describe, it, expect, vi } from "vitest"
import { LogMealUseCase } from "./log-meal"
import type { IMealRepository } from "../ports/meal-repository"

function makeRepo(): IMealRepository {
  return {
    getAll: vi.fn().mockReturnValue([]),
    save: vi.fn(),
    remove: vi.fn(),
  }
}

describe("LogMealUseCase", () => {
  it("speichert eine Mahlzeit mit Timestamp", () => {
    const repo = makeRepo()
    const useCase = new LogMealUseCase(repo)
    useCase.log(["4006040197219"])
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ products: ["4006040197219"] })
    )
  })
})
```

Dann implementieren:

```typescript
// src/core/use-cases/log-meal.ts
import type { IMealRepository } from "../ports/meal-repository"

export class LogMealUseCase {
  constructor(private readonly repo: IMealRepository) {}

  log(barcodes: string[]): void {
    this.repo.save({ id: crypto.randomUUID(), products: barcodes, eatenAt: Date.now() })
  }
}
```

**Wichtig:** Der Use Case importiert nur aus `../domain/` und `../ports/`. Kein `localStorage`, kein SQLite, kein `next/*`.

### Schritt 4: Adapter implementieren (in `infrastructure/`)

```typescript
// src/infrastructure/storage/local-storage-meals.ts
import type { IMealRepository, Meal } from "../../core/ports/meal-repository"

export class LocalStorageMealsRepository implements IMealRepository {
  private readonly KEY = "hashimoto-pcos-meals"
  // ...
}
```

### Schritt 5: Im Container verdrahten (`infrastructure/container.ts`)

```typescript
export function makeMealRepository(): IMealRepository {
  return new LocalStorageMealsRepository()
}
```

### Schritt 6: Slim API-Route oder Client-Component

```typescript
// In einer Client-Component:
import { LogMealUseCase } from "@/core/use-cases/log-meal"
import { makeMealRepository } from "@/infrastructure/container"

const useCase = new LogMealUseCase(makeMealRepository())
useCase.log(selectedBarcodes)
```

Die Seite/Route enthält keine Business-Logik — nur Delegation an den Use Case.

---

## Was in welche Schicht gehört

| Schicht | Gehört dorthin | Gehört NICHT dorthin |
|---------|---------------|---------------------|
| `core/domain/` | TypeScript-Interfaces für Entitäten | Klassen, Logik, Imports |
| `core/services/` | Pure functions (scoring, validation) | DB-Calls, fetch, localStorage |
| `core/ports/` | Interface-Definitionen | Implementierungen |
| `core/use-cases/` | Orchestrierung via Ports | SQLite, fetch, React, next/* |
| `infrastructure/` | Konkrete Implementierungen der Ports | Business-Logik |
| `app/api/` | Request parsing, Response formatting | SQL, fetch zu externen APIs |
| `app/*/page.tsx` | UI, State, User-Interaktion | Direkte DB-Calls, externe APIs |

---

## Branching-Strategie

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

Vor dem Arbeiten immer ein Issue anlegen.

### 2. Branch erstellen

```bash
git checkout -b feat/issue-15-mahlzeiten-tracker
```

### 3. Entwickeln (TDD)

1. Test schreiben (schlägt fehl)
2. Minimale Implementierung (Test grün)
3. Commit

```bash
npm run test:run   # vor jedem Commit
npm run lint
npm run build
```

### 4. Commit-Nachrichten (Conventional Commits)

```
feat(core): add MealRepository port interface
feat(infra): add LocalStorageMealsRepository
feat(ui): add meal logging page
fix(scoring): correct omega-3 detection in categories
```

### 5. Pull Request

```bash
gh pr create --fill
```

PR muss: Issue referenzieren (`Closes #N`), alle Checks bestehen, Architektur-Regel einhalten.

### 6. Review & Merge

Mindestens 1 Review. Nach Approval: Squash-Merge bevorzugt.

---

## Coding-Standards

### TypeScript

- **Strict Mode** ist aktiviert — niemals `any`, immer `unknown` oder spezifische Typen
- Fehlerbehandlung via **Discriminated Unions**, keine geworfenen Exceptions:

```typescript
type Result =
  | { success: true; product: Product }
  | { success: false; error: { type: "not_found"; message: string } }
```

### Imports in `core/`

```typescript
// ✅ Erlaubt in core/
import type { Product } from "../domain/product"
import type { IProductRepository } from "../ports/product-repository"

// ❌ Verboten in core/ (ESLint-Fehler)
import Database from "better-sqlite3"
import { NextResponse } from "next/server"
import { SqliteProductRepository } from "../../infrastructure/sqlite/..."
```

### Naming

```typescript
const userName = "Chrischi"        // camelCase: Variablen/Funktionen
function calculateScore() {}
function ScoreCard() {}            // PascalCase: Komponenten
const API_BASE = "https://..."    // SCREAMING_SNAKE_CASE: Konstanten
```

### Testing

- **Unit-Tests** für alle `core/services/` und `core/use-cases/`
- Fake-Repositories (in-memory) für Use Case Tests — keine echten Adapter
- `vi.fn()` für `fetch` in Infrastruktur-Tests
- **Keine** Mocks für `core/` — pure functions direkt testen

```bash
# Einzelne Test-Datei
npm run test:run -- src/core/use-cases/get-product.test.ts

# Watch mode
npm run test

# E2E
npm run test:e2e
```

---

## Projektstruktur

```
src/
├── core/                      # ZERO Framework-Dependencies
│   ├── domain/                # Datentypen (Product, ScoreResult, …)
│   ├── ports/                 # Interfaces (IProductRepository, …)
│   ├── services/              # Pure functions (calculateScore, isValidEan13)
│   └── use-cases/             # Orchestrierung (GetProductUseCase, …)
├── infrastructure/            # Implementierungen der Ports
│   ├── sqlite/                # SQLite-Adapter
│   ├── openfoodfacts/         # OFf API-Adapter
│   ├── storage/               # LocalStorage-Adapter
│   └── container.ts           # Factory-Funktionen (DI)
├── app/                       # Next.js App Router
│   ├── api/products/          # Schlanke API-Routes
│   ├── scanner/
│   ├── lebensmittel/
│   └── result/[barcode]/
├── components/                # React-Komponenten
└── lib/
    └── utils.ts               # cn() Hilfsfunktion

tests/
├── fixtures/products/         # 5 Produkt-Fixtures (Domain-Format)
└── helpers/mock-api.ts        # Playwright-Mock-Hilfsfunktionen

e2e/                           # Playwright E2E Tests
```

---

## Hilfe & Fragen

- **Issues:** [GitHub Issues](https://github.com/shaunclaw07/hashimoto-pcos/issues)
- **Architektur:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **AI-Kontext:** [CLAUDE.md](./CLAUDE.md)
