# CLAUDE.md — Hashimoto & PCOS Ernährungs-Tool

## Project Overview

A **nutrition guidance web app** for women with Hashimoto-Thyreoiditis and PCOS. Users scan product barcodes or search the OpenFoodFacts database; a custom scoring algorithm rates suitability for these two conditions using a 1–5 star / traffic-light system (Ampel-System).

- **Target users:** Women with Hashimoto and/or PCOS (German-speaking)
- **UI language:** German (all user-facing strings are in German)
- **Local SQLite database** (`data/products.db`) with 460k+ DACH products as primary data source; OpenFoodFacts REST API as fallback
- **Next.js API routes** serve product data server-side (`/api/products/[barcode]`, `/api/products/search`)
- **Persistence:** Browser `localStorage` only (saved favorites + user profile)
- **No authentication** — fully public app

---

## Key Commands

```bash
npm run dev         # Start dev server on localhost:3000
npm run dev:clean   # Delete .next cache and start fresh
npm run build       # Production build (outputs standalone)
npm start           # Run production build
npm run lint        # ESLint (next lint)
npm run test        # Vitest in watch mode
npm run test:run    # Vitest single run (use in CI / before commits)
npm run test:e2e    # Playwright E2E tests (auto-starts dev server)
npm run test:e2e:ui # Playwright E2E with interactive UI
npm run db:build    # Build local SQLite DB from OpenFoodFacts CSV
```

Docker:
```bash
npm run db:build            # Must run before docker build!
docker compose up --build   # Build image (copies products.db) and start
docker compose up           # Start existing image
```

---

## Architecture

The app uses **Hexagonal Architecture (Ports & Adapters)**. Dependencies always point inward — `core/` has zero framework dependencies.

```
Browser
  └── Next.js 16 App Router  (Presentation Layer)
        ├── /                        → Landing page (server component)
        ├── /scanner                 → Barcode scanner (camera + manual input)
        ├── /lebensmittel            → Product search with infinite scroll
        ├── /result/[barcode]        → Product detail + score + save
        ├── /onboarding              → 2-step profile wizard (first-run)
        └── /einstellungen           → Profile settings (view + edit)
              │  (calls via fetch)
              └── API Routes (thin — delegate to use cases)
                    ├── /api/products/[barcode]  → GetProductUseCase
                    └── /api/products/search     → SearchProductsUseCase

  infrastructure/  (implements ports)
    ├── sqlite/sqlite-product-repository.ts   — primary (better-sqlite3)
    ├── openfoodfacts/off-api-adapter.ts      — fallback (OFf REST API)
    ├── storage/local-storage-favorites.ts   — client-side persistence
    └── container.ts                          — factory functions (no DI framework)

  core/  (pure TypeScript — ZERO framework dependencies)
    ├── domain/       — Product, Nutriments, ScoreResult, SearchQuery …
    ├── ports/        — IProductRepository, IFavoritesRepository, IAIAnalysisService
    ├── services/     — calculateScore(), isValidEan13()  (pure functions)
    └── use-cases/    — GetProductUseCase, SearchProductsUseCase, ManageFavoritesUseCase
```

**Golden rule:** No file in `src/core/**` may import from `infrastructure/`, `app/`, or any framework package (`next/*`, `better-sqlite3`). ESLint enforces this via `no-restricted-imports` in `eslint.config.mjs` — violations are errors, not warnings.

**Data flow:** Client pages → `/api/products/` routes → Use Case → `SqliteProductRepository` (primary) → `OffApiAdapter` (fallback). No direct client-to-external-API calls (eliminates CORS issues).

---

## Codebase Map

### Core (pure TypeScript — zero framework dependencies)

| Path | Purpose |
|------|---------|
| `src/core/domain/product.ts` | `Product`, `Nutriments`, `SearchQuery`, `SearchResult` types |
| `src/core/domain/score.ts` | `ScoreResult`, `ScoreLabel`, `ScoreBreakdownItem` types |
| `src/core/domain/user-profile.ts` | `UserProfile`, `Condition` types |
| `src/core/ports/product-repository.ts` | `IProductRepository` interface: `findByBarcode`, `search`, `updateNutriments` |
| `src/core/ports/favorites-repository.ts` | `IFavoritesRepository` interface + `SavedProduct` type |
| `src/core/ports/ai-analysis-service.ts` | `IAIAnalysisService` interface (future) |
| `src/core/services/scoring-service.ts` | `calculateScore(product, profile?)` — pure function |
| `src/core/services/barcode-service.ts` | `isValidEan13(barcode)` — pure function |
| `src/core/use-cases/get-product.ts` | `GetProductUseCase` — validate → primary → fallback → enrich |
| `src/core/use-cases/search-products.ts` | `SearchProductsUseCase` — primary → fallback |
| `src/core/use-cases/manage-favorites.ts` | `ManageFavoritesUseCase` — save/remove/list |

### Infrastructure (implements ports)

| Path | Purpose |
|------|---------|
| `src/infrastructure/sqlite/sqlite-client.ts` | `getDb()` singleton, `DbProductRow` type |
| `src/infrastructure/sqlite/sqlite-mappers.ts` | DB row → domain `Product` mapper |
| `src/infrastructure/sqlite/sqlite-product-repository.ts` | `SqliteProductRepository` — implements `IProductRepository` (primary) |
| `src/infrastructure/openfoodfacts/off-types.ts` | Internal OFf API response types |
| `src/infrastructure/openfoodfacts/off-mappers.ts` | OFf API response → domain `Product` mapper |
| `src/infrastructure/openfoodfacts/off-api-adapter.ts` | `OffApiAdapter` — implements `IProductRepository` (fallback) |
| `src/infrastructure/storage/local-storage-favorites.ts` | `LocalStorageFavoritesRepository` — implements `IFavoritesRepository` |
| `src/infrastructure/container.ts` | Factory functions: `makePrimaryProductRepository()`, `makeFallbackProductRepository()` |

### Presentation (Next.js App Router + React)

| Path | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout: ThemeProvider, ProfileHeader, OnboardingGuard, BottomNav |
| `src/app/page.tsx` | Landing page (server component) |
| `src/app/scanner/page.tsx` | Scanner — dual mode: QuaggaJS camera & manual EAN-13 input |
| `src/app/lebensmittel/page.tsx` | Search page — calls `/api/products/search`, category filters, infinite scroll |
| `src/app/result/[barcode]/page.tsx` | Result page — calls `/api/products/[barcode]`, profile-aware scoring, save to localStorage |
| `src/app/onboarding/page.tsx` | 2-step profile wizard: condition selection → sensitivities; skip supported |
| `src/app/einstellungen/page.tsx` | Settings page — view/edit/delete user profile |
| `src/app/api/products/[barcode]/route.ts` | API Route: delegates to `GetProductUseCase` |
| `src/app/api/products/search/route.ts` | API Route: delegates to `SearchProductsUseCase` |
| `src/components/Scanner.tsx` | QuaggaJS2 wrapper; debounces duplicate scans (3 s) |
| `src/components/ScoreCard.tsx` | Score badge, star rating, breakdown with condition icons (🦋🔵), profile badge |
| `src/components/bottom-nav.tsx` | Fixed bottom navigation (4 routes incl. /einstellungen); hidden on /onboarding |
| `src/components/profile-header.tsx` | Fixed top bar with app title and profile badge (🦋/🔵/✦); hydration-safe |
| `src/components/onboarding-guard.tsx` | Client-side redirect guard → /onboarding when no profile and not skipped |
| `src/components/theme-provider.tsx` | next-themes wrapper (light/dark/system) |
| `src/hooks/use-user-profile.ts` | `useUserProfile()` — localStorage hook for profile state; hydration-safe (`isLoaded`) |
| `src/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
| `src/lib/profile-options.ts` | Shared constants: `CONDITIONS`, `SENSITIVITY_OPTIONS`, `SensitivityAnswer` type |

### Tests & Scripts

| Path | Purpose |
|------|---------|
| `src/core/services/scoring-service.test.ts` | Scoring algorithm tests (138 cases — generic + all profile variants) |
| `src/hooks/use-user-profile.test.ts` | `useUserProfile()` hook — localStorage load, set, skip, corrupt JSON |
| `src/core/services/barcode-service.test.ts` | EAN-13 validation tests |
| `src/core/use-cases/get-product.test.ts` | GetProductUseCase tests (fake repositories) |
| `src/core/use-cases/search-products.test.ts` | SearchProductsUseCase tests |
| `src/core/use-cases/manage-favorites.test.ts` | ManageFavoritesUseCase tests |
| `src/infrastructure/openfoodfacts/off-api-adapter.test.ts` | OFf adapter tests (mocked fetch) |
| `scripts/build-db.mjs` | One-time script: OpenFoodFacts CSV → SQLite (DACH filter, FTS5) |
| `scripts/extract-fixtures.mjs` | Extracts 5 real products from `products.db` into JSON test fixtures |
| `data/products.db` | SQLite DB with ~462k DACH products (gitignored, build via `db:build`) |
| `tests/fixtures/products/*.json` | 5 real product fixtures in domain format (sehr-gut / gut / neutral / weniger-gut / vermeiden) |
| `tests/helpers/mock-api.ts` | Playwright helpers: `mockProductApi`, `mockProductNotFound`, `mockSearchApi` |
| `e2e/*.spec.ts` | Playwright E2E tests (10 specs, 55+ tests) |
| `playwright.config.ts` | Playwright config — mobile viewport, auto dev-server |
| `docs/recherche/` | Scientific research in German (4 files) |
| `k8s/` | Kubernetes deployment + HPA manifests |
| `.github/workflows/docker.yml` | CI: build + push to `ghcr.io/shaunclaw07/hashimoto-pcos` |
| `.github/workflows/ci.yml` | CI: lint + build + vitest + playwright E2E + artifact |

---

## Scoring Algorithm (`src/core/services/scoring-service.ts`)

**Base score: 3.0** — adjusted by nutritional content per 100 g.

`calculateScore(product, profile?)` accepts an optional `UserProfile`. When a profile is set, condition-specific lookup tables adjust the weights. Breakdown items that differ from generic weights get a `condition` tag shown as an icon in the UI.

### Generic thresholds (no profile)

| Criterion | Points |
|-----------|--------|
| Fiber > 6 g | +1.0 |
| Fiber > 3 g | +0.5 |
| Protein > 20 g | +0.5 |
| Omega-3 marine (EPA/DHA) | +1.5 |
| Omega-3 plant (ALA) | +0.5 |
| Omega-3 label only (unknown source) | +0.7 |
| Gluten-free label | +0.5 |
| Organic/Bio label | +0.5 |
| Sugar > 20 g | −2.0 |
| Sugar > 10 g | −1.0 |
| Saturated fat > 10 g | −1.0 |
| Salt > 2.5 g | −1.0 |
| Salt > 1.5 g | −0.5 |
| Gluten in ingredients | −0.5 |
| Dairy general | −0.3 |
| Dairy fermented | −0.1 |
| Dairy whey | −0.3 |
| Dairy A1-casein | −0.3 |
| Soy lecithin | −0.1 |
| > 5 additives (E-numbers) | −0.5 |

### Profile-aware thresholds (lookup tables per `ConditionKey`)

| Criterion | Generic | Hashimoto | PCOS | Both |
|-----------|---------|-----------|------|------|
| Sugar > 5 g | 0 | −0.5 | −1.5 | −2.0 |
| Sugar > 10 g | −1.0 | −1.0 | −2.5 | −3.0 |
| Sugar > 20 g | −2.0 | −2.0 | −3.5 | −4.0 |
| Gluten in ingredients | −0.5 | −1.5 | −0.5 | −2.0 |
| Fiber > 6 g | +1.0 | +1.0 | +1.5 | +1.5 |
| Protein > 20 g | +0.5 | +0.5 | +1.0 | +1.0 |
| Gluten-free label | +0.5 | +0.5 | +0.2 | +0.8 |
| Organic/Bio label | +0.5 | +0.5 | +0.3 | +0.5 |
| Soy non-fermented | 0 | −0.8 | −0.2 | −0.8 |
| Soy fermented | 0 | −0.3 | 0 | −0.3 |
| Soy lecithin | −0.1 | −0.2 | −0.2 | −0.2 |
| Dairy A1-casein | −0.3 | −0.5 | −0.3 | −0.5 |
| Dairy fermented | −0.1 | −0.2 | −0.1 | −0.2 |
| Goitrogen raw Brassica | 0 | −0.5 | 0 | −0.5 |

Additionally: `profile.glutenSensitive` doubles the gluten malus; `profile.lactoseIntolerant` doubles the dairy malus. Dairy ghee is always neutral (0 malus). Fermented soy overrides non-fermented soy; lecithin is detected independently.

### Issue #50 — Soy / Phytoestrogen Detection (3 tiers)

| Tier | Keywords | Breakdown reason |
|------|----------|-----------------|
| Non-fermented | soja, soy, soybeans, tofu, sojaprotein, edamame | `"Soja (Phytoöstrogene)"` |
| Fermented | tempeh, miso | `"Fermentiertes Soja"` |
| Lecithin | sojalecithin, E322 | `"Sojalecithin"` |

### Issue #51 — Goitrogen Warning (Raw Cruciferous Vegetables)

Brassica detection with preparation state (raw/cooked/unknown). Raw penalty only for Hashimoto/Both.

| State | Detection signals | Malus |
|-------|-----------------|-------|
| Raw | roh, frisch, smoothie, saft, juice, rohkost, salat | −0.5 (Hashimoto/Both) |
| Unknown | no raw/cooked signals found | 0 pts, informational |
| Cooked | gegart, gekocht, gefroren, gedünstet, blanchiert | 0 |

Keywords: broccoli, brokkoli, kohl, kale, senf, raps, rucola, etc.

### Issue #53 — Differentiated Omega-3 Detection

| Source | Keywords | Points |
|--------|----------|--------|
| Marine EPA/DHA | lachs, fischöl, algenöl, EPA, DHA | +1.5 |
| Plant ALA | leinsamen, chia, hanföl, walnuss, ALA | +0.5 |
| Label only (unknown) | omega-3 label/category without ingredient match | +0.7 |

Marine takes priority over plant. Algae oil counts as marine (vegan).

### Issue #54 — Tiered Dairy Detection (replaces flat lactose/milk check)

| Tier | Keywords | Generic | Hashimoto | PCOS | Both |
|------|----------|---------|-----------|------|------|
| A1-Casein | casein, natriumcaseinat, micellar casein | −0.3 | −0.5 | −0.3 | −0.5 |
| Whey | whey, molke, molkenprotein | −0.3 | −0.3 | −0.3 | −0.3 |
| Fermented | kefir, joghurt, yogurt | −0.1 | −0.2 | −0.1 | −0.2 |
| General | milk, milch, käse, quark, lactose, laktose | −0.3 | −0.3 | −0.3 | −0.3 |
| Ghee | ghee | 0 | 0 | 0 | 0 |

**Exceptions (no malus):** milchsäure, lactic acid, calciumlactat, calcium lactate

Hierarchical: only the highest applicable tier fires. `lactoseIntolerant: true` doubles the penalty.

Final score is **clamped to [1.0, 5.0]** and mapped to labels:

| Score | Stars | Label |
|-------|-------|-------|
| ≥ 4.5 | 5 | SEHR GUT |
| ≥ 3.5 | 4 | GUT |
| ≥ 2.5 | 3 | NEUTRAL |
| ≥ 1.5 | 2 | WENIGER GUT |
| < 1.5 | 1 | VERMEIDEN |

Tailwind custom colors for labels: `score-very-good`, `score-good`, `score-neutral`, `score-fair`, `score-avoid` (defined in `globals.css` via `@theme`).

---

## Local SQLite Database

- **File:** `data/products.db` (gitignored — build with `npm run db:build`)
- **Source:** OpenFoodFacts global CSV export (`en.openfoodfacts.org.products.csv`)
- **Filter:** Only DACH products (`countries_tags` contains `en:germany`, `en:austria`, or `en:switzerland`) with valid EAN-13 barcodes
- **Size:** ~260 MB, ~462k products (~10% have nutriment data in the CSV)
- **Search:** SQLite FTS5 virtual table (`products_fts`) for fast full-text search on product name and brand
- **Build time:** ~5–10 minutes for the full CSV (~4.4M rows)

**Nutriment enrichment:** When a product is found locally but has no nutriment data, the barcode route fetches nutriments from the OFf API and writes them back to the local DB (`UPDATE products SET nutriments = ?`). The DB grows more complete over time with each unique product lookup.

To rebuild after a fresh CSV download:
```bash
node scripts/build-db.mjs /path/to/en.openfoodfacts.org.products.csv
```

## External API — OpenFoodFacts (Fallback only)

| Endpoint | URL |
|----------|-----|
| Product by barcode | `GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json` |
| Search | `GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=...&json=1&page_size=20&...` |

- Used only when the local SQLite DB has no result.
- No API key required.
- Called server-side from API routes (no CORS issues).
- API responses use `status: 1` (found) / `status: 0` (not found).

---

## TypeScript Patterns

**Strict mode is on.** Never use `any`; use `unknown` or specific types.

**Error handling** uses discriminated unions — no thrown exceptions:

```typescript
// Example from GetProductUseCase (src/core/use-cases/get-product.ts)
type GetProductResult =
  | { success: true; product: Product }
  | { success: false; error: GetProductError };

type GetProductError =
  | { type: "invalid_barcode"; message: string }
  | { type: "not_found"; message: string }
  | { type: "network_error"; message: string };
```

Always pattern-match on `result.success` before accessing `result.product`.

**Domain types** live in `src/core/domain/` and are used throughout the app — `Product`, `Nutriments`, `ScoreResult`, `SearchQuery`, `SearchResult`. Never use raw OFf API types (`OpenFoodFactsProduct`) in UI components or use cases — convert at the infrastructure boundary using mappers.

**Path alias:** `@/` → `src/` (configured in `tsconfig.json`).

**Classnames:** use `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`).

---

## Testing

### Unit Tests (Vitest)
- **Framework:** Vitest 4.x + jsdom (browser DOM simulation)
- **Locations:**
  - `src/core/services/*.test.ts` — pure function tests (scoring, barcode validation)
  - `src/core/use-cases/*.test.ts` — use case tests with in-memory fake repositories
  - `src/infrastructure/openfoodfacts/off-api-adapter.test.ts` — OFf adapter with mocked fetch
- **Strategy:** `core/` tests use no mocks (pure functions). Use case tests use fake in-memory `IProductRepository` implementations. Infrastructure tests use `vi.fn()` for `fetch`.
- **No real network calls** in any unit test

### E2E Tests (Playwright)
- **Framework:** Playwright 1.x (`@playwright/test`)
- **Location:** `e2e/*.spec.ts` (10 spec files, 75 tests)
- **Viewport:** Mobile-first (Pixel 5 / 375×812)
- **Dev server:** Auto-started by `playwright.config.ts` webServer
- **API mocking:** `page.route()` intercepts `/api/products/*` — no real network calls; fixtures from `tests/fixtures/products/`
- **Onboarding bypass:** Tests that need to skip the onboarding flow must use `page.addInitScript()` to set `hashimoto-pcos-onboarding-skipped = "true"` (or a full profile) in localStorage **before** `page.goto()`. Never use `page.evaluate()` for this — it runs after page load and the OnboardingGuard redirect fires first.

**Unit test coverage:**
| File | Area |
|------|------|
| `src/core/services/scoring-service.test.ts` | `calculateScore()` — generic rules + all 3 condition profiles + sensitivity modifiers + soy tiers + goitrogen + omega-3 sources + dairy tiers (164 tests) |
| `src/hooks/use-user-profile.test.ts` | `useUserProfile()` — load, set, skip, clear, corrupt JSON fallback |
| `src/core/services/barcode-service.test.ts` | `isValidEan13()` — valid/invalid EAN-13 |
| `src/core/use-cases/get-product.test.ts` | `GetProductUseCase` — primary, fallback, enrichment, errors |
| `src/core/use-cases/search-products.test.ts` | `SearchProductsUseCase` — primary, fallback |
| `src/core/use-cases/manage-favorites.test.ts` | `ManageFavoritesUseCase` — save/remove/list/isSaved |
| `src/infrastructure/openfoodfacts/off-api-adapter.test.ts` | `OffApiAdapter` — fetch, mapping, errors |

**E2E test coverage:**
| Spec | Area |
|------|------|
| `navigation.spec.ts` | Routing, BottomNav |
| `homepage.spec.ts` | Hero, Feature cards, Score legend |
| `scanner.spec.ts` | Camera/manual toggle, EAN validation, barcode submission |
| `search.spec.ts` | Search, category filters, infinite scroll, empty states |
| `result-page.spec.ts` | Loading, error, product display, score, save/unsave |
| `scorecard.spec.ts` | Score rendering, save toggle |
| `bottom-nav.spec.ts` | Nav items (4 tabs), active highlighting, hidden on /onboarding |
| `theme.spec.ts` | Dark mode via system preference (`page.emulateMedia`) |
| `scoring-features.spec.ts` | Soy tiers, goitrogen, omega-3 sources, dairy tiers with Hashimoto profile |
| `localstorage.spec.ts` | Save/remove/persist products |
| `onboarding.spec.ts` | First-run redirect, skip, 2-step wizard, profile save, settings page, profile-aware scoring |

All `core/` code must have full test coverage.

```bash
npm run test:run   # Vitest — must pass before creating a PR
npm run test:e2e   # Playwright E2E — auto-starts dev server
```

---

## Development Workflow

1. Create a GitHub issue
2. Branch: `feat/issue-{N}-{description}` or `fix/issue-{N}-{description}`
3. **Write tests first (TDD)** — red → green → refactor
4. Implement to make the tests pass
5. Run `npm run test:run && npm run lint && npm run build` — all must pass
6. Run `npm run test:e2e` — all E2E tests must pass
7. **Never commit or push if any test is failing**
8. Open PR referencing the issue (`Closes #N`)
9. Squash-merge after ≥ 1 approval

### Test-Driven Development (TDD)

**Write tests before writing implementation code.** For every new feature or bug fix:
1. Write a failing unit test describing the expected behavior
2. Run it — confirm it fails (red)
3. Write the minimum implementation to pass (green)
4. Refactor if needed, keeping tests green

### Pre-commit Gate

All of the following must pass before every commit — no exceptions:
```bash
npm run test:run   # Vitest unit tests — zero failures
npm run test:e2e   # Playwright E2E — zero failures
npm run lint       # ESLint — zero errors
npm run build      # Production build — must succeed
```

Never skip this with `--no-verify` or by commenting out tests.

### Architecture Compliance

All code changes must conform to the Hexagonal Architecture rules:

- **`core/` is sacred** — `src/core/**` must NEVER import from `infrastructure/`, `app/`, or any framework package (`next/*`, `better-sqlite3`, `react`, etc.). ESLint enforces this via `no-restricted-imports` — violations are errors.
- **Dependency direction** always points inward: `presentation → infrastructure → core`. Never outward.
- **Domain types only in `core/`** — use `Product`, `Nutriments`, `ScoreResult` etc. Never pass raw OFf API types or DB row types beyond the infrastructure boundary.
- **New ports go in `core/ports/`** first, then implement in `infrastructure/`.
- When in doubt, check `eslint.config.mjs` to see which imports are restricted.

**Commit format:** Conventional Commits
```
feat(scanner): add camera permission error handling
fix(scoring): correct omega-3 label detection
docs(readme): update deployment instructions
```

---

## Code Style

- **Components:** PascalCase
- **Variables/functions:** camelCase
- **Constants:** SCREAMING_SNAKE_CASE
- **No form libraries** — plain controlled components
- **No state management library** — React hooks + localStorage
- **No i18n library** — all strings hardcoded in German
- **Icons:** Lucide React only
- **No axios** — native `fetch` API

---

## State & Persistence

- Component-local state: `useState` / `useEffect` / `useRef`
- Saved products: `localStorage` key `"hashimoto-pcos-saved-products"` (see `result/[barcode]/page.tsx`)
- User profile: `localStorage` key `"hashimoto-pcos-user-profile"` — `UserProfile` JSON (see `src/hooks/use-user-profile.ts`)
- Onboarding skipped: `localStorage` key `"hashimoto-pcos-onboarding-skipped"` — `"true"` string; cleared when a profile is saved
- Route state: URL params (`[barcode]` dynamic route, query string in `/lebensmittel`)
- **No server-side session, no cookies**
- **Hydration safety:** `useUserProfile()` sets `isLoaded = true` after the first `useEffect` — all profile-dependent UI waits for `isLoaded` before rendering to prevent SSR/client mismatches

---

## Deployment

| Method | How |
|--------|-----|
| Local dev | `npm run db:build && npm run dev` |
| Docker | `npm run db:build && docker compose up --build` |
| Production Docker | `npm run db:build && docker build . && docker run -p 3000:3000` |
| Kubernetes | `kubectl apply -f k8s/` (image: `ghcr.io/shaunclaw07/hashimoto-pcos:latest`) |
| CI/CD | GitHub Actions auto-builds and pushes on every push to `main` or tag `v*` |

**Important:** `npm run db:build` must run before any Docker build — the script produces `data/products.db` which is copied into the image. Without the DB file, the app falls back to the OpenFoodFacts API automatically.

The Docker image uses **multi-stage build** (Node 20 Alpine + native build tools for `better-sqlite3`), runs as **non-root user** (`nextjs`, uid 1001), and exposes port **3000**.

K8s HPA scales between **2–10 replicas** based on CPU (70%) and memory (80%).

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | App base URL |

No secrets or API keys required. The OpenFoodFacts API is fully public.

---

## What Does NOT Exist (Don't Add Without Discussion)

- No ORM (no Prisma, no Drizzle) — raw `better-sqlite3` only
- No authentication (no NextAuth, no Clerk)
- No Redux / Zustand / global state library
- No i18n
- No Prettier config (uses Next.js ESLint defaults)
- No Service Worker / offline mode
- No analytics

---

## Docs & Research

Scientific background is in `docs/recherche/` (German):

| File | Content |
|------|---------|
| `01_hashimoto_pcos_grundlagen.md` | Disease pathophysiology, comorbidity, common pathways |
| `02_lebensmittel_bewertung.md` | Food rating criteria and the scoring pseudocode |
| `03_nahrungsergaenzungen.md` | Supplementation protocols (selenium, Vit D, zinc, omega-3…) |
| `04_produkt_scan_api.md` | OpenFoodFacts API spec and scoring integration details |

Also: `ARCHITECTURE.md` (system design), `CONTRIBUTING.md` (workflow details), `README.md` (project overview).
