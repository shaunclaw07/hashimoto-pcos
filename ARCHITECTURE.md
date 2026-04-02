# Architektur-Dokumentation

## Überblick

Das Hashimoto-PCOS Ernährungs-Tool ist eine **Next.js 16** Web-App mit:

- **Barcode-Scanner** für Produkte (Kamera + manuelle Eingabe)
- **Lebensmittel-Suche** mit lokaler SQLite-Datenbank (462k+ DACH-Produkte) und OpenFoodFacts API als Fallback
- **Scoring-Algorithmus** für Hashimoto/PCOS-Eignung (1–5 Sterne)
- **Ampel-System** für verständliche Bewertungen

---

## Hexagonale Architektur (Ports & Adapters)

Die App folgt dem **Hexagonal Architecture Pattern**. Abhängigkeiten zeigen immer nach innen:

```
presentation/ → infrastructure/ → core/
```

`core/` kennt weder `infrastructure/` noch `presentation/`. Diese Regel wird per ESLint erzwungen.

```
┌─────────────────────────────────────────────────────┐
│  presentation/  (Next.js App Router + React)         │
│  src/app/api/   src/app/*/page.tsx   src/components/ │
└───────────────────────┬─────────────────────────────┘
                        │ importiert
┌───────────────────────▼─────────────────────────────┐
│  infrastructure/  (Implementierungen der Ports)       │
│  sqlite/   openfoodfacts/   storage/   container.ts  │
└───────────────────────┬─────────────────────────────┘
                        │ implementiert
┌───────────────────────▼─────────────────────────────┐
│  core/  (reines TypeScript — ZERO Framework-Deps)    │
│  domain/   ports/   services/   use-cases/           │
└─────────────────────────────────────────────────────┘
```

**Goldene Regel:** Kein Import in `src/core/**` darf auf `infrastructure/`, `app/` oder Framework-Packages (`next/*`, `better-sqlite3`) zeigen. ESLint meldet Verstöße als Fehler.

---

## Verzeichnisstruktur

```
src/
  core/                              ← ZERO Framework-Abhängigkeiten
    domain/
      product.ts                     ← Product, Nutriments, SearchQuery, SearchResult
      score.ts                       ← ScoreResult, ScoreLabel, ScoreBreakdownItem
      user-profile.ts                ← UserProfile, Condition (Phase 2)
    services/
      scoring-service.ts             ← calculateScore(product, profile?) — pure function
      barcode-service.ts             ← isValidEan13() — pure function
    ports/
      product-repository.ts          ← IProductRepository Interface
      favorites-repository.ts        ← IFavoritesRepository Interface + SavedProduct
      ai-analysis-service.ts         ← IAIAnalysisService Interface (Phase 2)
    use-cases/
      get-product.ts                 ← GetProductUseCase
      search-products.ts             ← SearchProductsUseCase
      manage-favorites.ts            ← ManageFavoritesUseCase

  infrastructure/                    ← Implementierungen der Ports
    sqlite/
      sqlite-client.ts               ← getDb() Singleton + DbProductRow
      sqlite-mappers.ts              ← DbRow → Product Domain-Modell
      sqlite-product-repository.ts   ← implements IProductRepository
    openfoodfacts/
      off-types.ts                   ← Interne OFf-Typen (nicht nach außen)
      off-mappers.ts                 ← OFf API-Response → Product Domain-Modell
      off-api-adapter.ts             ← implements IProductRepository (Fallback)
    storage/
      local-storage-favorites.ts     ← implements IFavoritesRepository
    container.ts                     ← Factory-Funktionen (kein DI-Framework)

  app/                               ← Next.js App Router (Presentation)
    api/products/[barcode]/route.ts  ← Dünn: delegiert an GetProductUseCase
    api/products/search/route.ts     ← Dünn: delegiert an SearchProductsUseCase
    page.tsx / scanner/ / lebensmittel/ / result/[barcode]/

  components/
    ScoreCard.tsx                    ← Akzeptiert Product + ScoreResult (Domain-Typen)
    Scanner.tsx                      ← QuaggaJS2 Kamera-Integration
    bottom-nav.tsx
    theme-provider.tsx

  lib/
    utils.ts                         ← cn() (clsx + tailwind-merge)
```

---

## Domain-Modell

### `core/domain/product.ts`

Eigenes Domain-Modell — unabhängig von der OpenFoodFacts API. Alle Nährwert-Felder in **camelCase**, keine `_100g`-Suffixe.

```typescript
export interface Product {
  barcode: string
  name: string
  brand?: string
  imageUrl?: string
  nutriments: Nutriments    // camelCase: fiber, sugars, saturatedFat, protein, salt …
  labels: string[]          // z.B. ["gluten-free", "organic"]
  ingredients: string
  categories: string[]
  additives: string[]       // E-Nummern, z.B. ["en:e330"]
}
```

### `core/domain/score.ts`

```typescript
export interface ScoreResult {
  score: number             // 1.0–5.0
  stars: 1 | 2 | 3 | 4 | 5
  label: ScoreLabel
  breakdown: ScoreBreakdownItem[]
  bonuses: number
  maluses: number
}
```

---

## Ports (Interfaces)

| Interface | Datei | Methoden |
|-----------|-------|---------|
| `IProductRepository` | `core/ports/product-repository.ts` | `findByBarcode`, `search`, `updateNutriments` |
| `IFavoritesRepository` | `core/ports/favorites-repository.ts` | `getAll`, `save`, `remove`, `isSaved` |
| `IAIAnalysisService` | `core/ports/ai-analysis-service.ts` | `analyzeImage` (Phase 2) |

---

## DI-Container (`infrastructure/container.ts`)

Kein Framework — einfache Factory-Funktionen:

```typescript
makePrimaryProductRepository()  → SqliteProductRepository
makeFallbackProductRepository() → OffApiAdapter
makeFavoritesRepository()       → LocalStorageFavoritesRepository  // client-only
```

API-Routen und Use Cases werden hier verdrahtet.

---

## Datenfluss: Barcode-Scan

```
User scannt Barcode
        │
        ▼
┌────────────────────┐
│  Scanner Component │  (QuaggaJS2 / manuelle Eingabe)
└─────────┬──────────┘
          │ EAN-13 String
          ▼
┌────────────────────┐
│  result/[barcode]  │  (Next.js Client Page)
└─────────┬──────────┘
          │ fetch /api/products/[barcode]
          ▼
┌────────────────────┐
│  API Route (dünn)  │  new GetProductUseCase(primary, fallback)
└─────────┬──────────┘
          │
          ▼
┌────────────────────────────────────────────────────┐
│  GetProductUseCase                                  │
│  1. isValidEan13() prüfen                           │
│  2. primaryRepo.findByBarcode() → SqliteRepo        │
│  3. Falls null: fallbackRepo.findByBarcode() → OFf  │
│  4. Falls keine Nährwerte: anreichern + cachen      │
└─────────┬──────────────────────────────────────────┘
          │ Product (Domain-Typ)
          ▼
┌────────────────────┐
│  calculateScore()  │  core/services/scoring-service.ts
└─────────┬──────────┘
          │ ScoreResult
          ▼
┌────────────────────┐
│   ScoreCard.tsx    │  (UI-Anzeige)
└────────────────────┘
```

---

## Scoring-Algorithmus (`core/services/scoring-service.ts`)

**Basiswert: 3.0** — angepasst nach Nährwerten pro 100 g:

| Bedingung | Punkte |
|-----------|--------|
| Ballaststoffe > 6 g | +1.0 |
| Ballaststoffe > 3 g | +0.5 |
| Protein > 20 g | +0.5 |
| Omega-3 im Label/Kategorie | +1.0 |
| Glutenfrei-Label | +0.5 |
| Bio/Organic-Label | +0.5 |
| Zucker > 20 g | −2.0 |
| Zucker > 10 g | −1.0 |
| Gesättigte Fettsäuren > 10 g | −1.0 |
| Salz > 2,5 g | −1.0 |
| Salz > 1,5 g | −0.5 |
| Gluten in Zutaten | −0.5 |
| Milch/Laktose in Zutaten | −0.3 |
| > 5 Zusatzstoffe (E-Nummern) | −0.5 |

Endwert wird auf **[1.0, 5.0] geclampt** und auf Labels gemappt:

| Score | Sterne | Label | Tailwind-Farbe |
|-------|--------|-------|----------------|
| ≥ 4.5 | 5 | SEHR GUT | `score-very-good` |
| ≥ 3.5 | 4 | GUT | `score-good` |
| ≥ 2.5 | 3 | NEUTRAL | `score-neutral` |
| ≥ 1.5 | 2 | WENIGER GUT | `score-fair` |
| < 1.5 | 1 | VERMEIDEN | `score-avoid` |

---

## API-Routes (Presentation Layer — dünn)

### `GET /api/products/[barcode]`

Delegiert an `GetProductUseCase`. Gibt zurück:
- `{ success: true, product: Product }` — HTTP 200
- `{ success: false, error: { type: "invalid_barcode" } }` — HTTP 400
- `{ success: false, error: { type: "not_found" } }` — HTTP 404

### `GET /api/products/search?search_terms=...&tag_0=...&page=...&page_size=...`

Delegiert an `SearchProductsUseCase`. Gibt zurück:
- `{ products: Product[], count: number, page: number }`

---

## Testing-Strategie

| Layer | Typ | Tool | Strategie |
|-------|-----|------|-----------|
| `core/domain/` | Unit | — | Pure types — kein Test nötig |
| `core/services/` | Unit | Vitest | Pure functions — direkt testbar, kein Mock |
| `core/use-cases/` | Unit | Vitest | Fake-Repository (in-memory `IProductRepository`) |
| `infrastructure/sqlite/` | Integration | — | Via E2E (kein Test-DB-Setup nötig) |
| `infrastructure/openfoodfacts/` | Unit | Vitest | `vi.fn()` für fetch |
| `presentation/` | E2E | Playwright | `page.route()` mockt API |

**Test-Dateien:**
```
src/core/services/barcode-service.test.ts
src/core/services/scoring-service.test.ts
src/core/use-cases/get-product.test.ts
src/core/use-cases/search-products.test.ts
src/core/use-cases/manage-favorites.test.ts
src/infrastructure/openfoodfacts/off-api-adapter.test.ts
e2e/*.spec.ts
```

---

## Styling — Tailwind CSS v4 (CSS-first)

Kein `tailwind.config.ts` — alle Theme-Tokens sind direkt in `src/app/globals.css` via `@theme` definiert:

```css
@import "tailwindcss";

@theme {
  --color-score-very-good: #22c55e;
  --color-score-good:      #84cc16;
  --color-score-neutral:   #eab308;
  --color-score-fair:      #f97316;
  --color-score-avoid:     #ef4444;
}
```

Dark Mode wird über CSS-Variablen und `@custom-variant dark` gesteuert.

---

## Lokale SQLite-Datenbank

| Eigenschaft | Wert |
|-------------|------|
| Datei | `data/products.db` (gitignored) |
| Quelle | OpenFoodFacts Global CSV |
| Filter | DACH-Länder + gültige EAN-13 |
| Größe | ~260 MB, ~462k Produkte |
| Suche | FTS5 Virtual Table (`products_fts`) |
| Nährwertabdeckung | ~10% ab CSV, wächst mit Nutzung |

```bash
node scripts/build-db.mjs /pfad/zur/en.openfoodfacts.org.products.csv
```

---

## Deployment

### Docker

```bash
npm run db:build
docker compose up --build -d
```

Multi-Stage Build (Node 20 Alpine), läuft als Non-Root-User (`nextjs`, uid 1001), Port 3000.

### Kubernetes

HPA skaliert zwischen **2–10 Replicas** (CPU 70% / Memory 80%).

```bash
kubectl apply -f k8s/
```

### CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` — Lint + Build + Vitest + Playwright E2E
- `.github/workflows/docker.yml` — Docker Build + Push zu `ghcr.io/shaunclaw07/hashimoto-pcos`

---

*Letzte Aktualisierung: 2026-04-02*
