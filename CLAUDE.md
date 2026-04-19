# CLAUDE.md — Hashimoto & PCOS Ernährungs-Tool

## Project Overview

**Nutrition guidance web app** for women with Hashimoto-Thyreoiditis and PCOS. Users scan barcodes or search OpenFoodFacts; a custom scoring algorithm rates suitability (1–5 star / Ampel-System).

- **Target users:** German-speaking women with Hashimoto and/or PCOS
- **UI language:** German (all user-facing strings)
- **Data:** Local SQLite (`data/products.db`, 460k+ DACH products) + OpenFoodFacts REST API (fallback)
- **Persistence:** `localStorage` (favorites, profile), `sessionStorage` (search cache)
- **No authentication** — fully public app

## Key Commands

```bash
npm run dev         # Dev server localhost:3000
npm run dev:clean   # Delete .next cache + fresh start
npm run build       # Production build
npm run test        # Vitest watch mode
npm run test:run    # Vitest single run (CI / pre-commit)
npm run test:e2e    # Playwright E2E (auto-starts dev server)
npm run test:e2e:ui # Playwright with interactive UI
npm run lint        # ESLint
npm run db:build    # Build SQLite from OpenFoodFacts CSV

# Docker (run db:build first!)
docker compose up --build   # Build + start
docker compose up           # Start existing image
```

## Architecture — Hexagonal (Ports & Adapters)

```
Browser → Next.js 16 App Router (Presentation)
              │  (fetch)
              ↓
         API Routes (/api/products/[barcode], /api/products/search)
              │  (delegates to)
              ↓
         Use Cases (core/use-cases/)
              │  (calls via port interfaces)
              ↓
         Infrastructure (implements ports)
           ├── sqlite/          — primary (better-sqlite3)
           ├── openfoodfacts/  — fallback (REST API)
           └── storage/        — localStorage favorites
              │  (NO framework imports)
              ↓
         core/ (pure TypeScript — ZERO dependencies)
           ├── domain/    Product, Nutriments, ScoreResult, UserProfile
           ├── ports/     IProductRepository, IFavoritesRepository
           ├── services/  calculateScore(), isValidEan13(), triggerHaptic()
           └── use-cases/ GetProduct, SearchProducts, ManageFavorites
```

**Golden rule:** `src/core/**` must NEVER import from `infrastructure/`, `app/`, or any framework (`next/*`, `better-sqlite3`, `react`). ESLint `no-restricted-imports` enforces this — violations are errors.

**Data flow:** Client → API routes → Use Case → `SqliteProductRepository` (primary) → `OffApiAdapter` (fallback). No direct client-to-external-API calls.

**Key Files:**
- `src/core/services/scoring-service.ts` — scoring algorithm
- `src/core/services/haptic-service.ts` — haptic feedback patterns
- `src/core/services/ingredient-normalization.ts` — pure ingredient name normalization (accents, E-numbers, dashes) for alias matching
- `src/infrastructure/sqlite/sqlite-product-repository.ts` — DB adapter
- `src/infrastructure/openfoodfacts/off-api-adapter.ts` — API adapter
- `scripts/build-db.mjs` — DB build pipeline
- `scripts/ingredient-parser.mjs` — ingredient normalization

## Scoring Algorithm

Base: **3.0**, clamped to **[1.0, 5.0]**. Profile-aware lookup tables adjust weights by condition (Hashimoto/PCOS/Both). Score labels: ≥4.5=SEHR GUT, ≥3.5=GUT, ≥2.5=NEUTRAL, ≥1.5=WENIGER GUT, <1.5=VERMEIDEN.

**Key rules:**
- `glutenSensitive` doubles gluten malus; `lactoseIntolerant` doubles dairy malus
- Dairy ghee = always neutral (0 malus)
- Soy: fermented overrides non-fermented; lecithin detected independently
- Goitrogen (raw Brassica): -0.5 for Hashimoto/Both only
- Omega-3: marine (EPA/DHA) +1.5, plant (ALA) +0.5, label-only +0.7

Full thresholds → `src/core/services/scoring-service.ts`

## Database & Ingredient Pipeline

**SQLite** (`data/products.db`): 460k+ DACH products. FTS5 search on name/brand. Schema → `scripts/build-db.mjs`. When local product lacks nutriments, barcode route fetches from OFf and writes back.

**Ingredient parsing** (`scripts/ingredient-parser.mjs`): Phase 1 flattens parentheticals tracking nesting depth. Phase 2 resolves colon-labels (functional labels like "Emulgator:" → emit right side only). Cleaning pipeline: strip parentheticals → normalize hyphens/E-numbers → whitelist check (GERMAN Set) → functional label guard. Whitelist → `scripts/ingredient-data.mjs` (~350 German ingredient names).

**Ingredient normalization** (`src/core/services/ingredient-normalization.ts`): Pure TypeScript function for stable alias matching. Lowercases, strips accents (NFKD), normalizes E-number spellings (`E 322` → `e322`), and unifies dash/whitespace variants. Used by scoring and future alias mapping. Zero framework dependencies.

## TypeScript Patterns

- **Strict mode** — never `any`; use `unknown` or specific types
- **Discriminated unions** for error handling — no thrown exceptions:

  ```typescript
  type Result<T> = { success: true; product: T } | { success: false; error: Error };
  // Always: if (result.success) { ... } else { ... }
  ```

- **Domain types only** past infrastructure boundary — never raw OFf API types
- **Path alias:** `@/` → `src/`
- **Classnames:** `cn()` from `src/lib/utils.ts`

## Testing

```bash
npm run test:run   # Vitest — must pass before PR
npm run test:e2e   # Playwright — all must pass
```

**Vitest:** `src/core/` tests are pure (no mocks). Use case tests use in-memory fakes. Infrastructure tests mock `fetch`. No real network calls.

**Playwright E2E rules (critical):**
- Use `page.addInitScript()` to bypass onboarding — set `hashimoto-pcos-onboarding-skipped = "true"` in localStorage BEFORE `page.goto()`
- `*back_navigation*` tests MUST use `page.goBack()`, not `page.goto()`
- `*reload*` tests MUST call `page.reload()`
- After `router.push()`, MUST `await expect(page).toHaveURL(...)` before reload/back — URL commit is async
- URL assertions must include specific values: `toHaveURL(/\?q=Vollkornbrot/)` not `toHaveURL(/\?q=/)`

## Development Workflow

1. Create GitHub issue
2. Branch: `feat/issue-{N}-{description}` or `fix/issue-{N}-{description}`
3. **TDD** — write failing test → implement → refactor
4. Pre-commit gate: `npm run test:run && npm run lint && npm run build`
5. `npm run test:e2e` — all must pass
6. **Never commit if any test fails**
7. Open PR (`Closes #N`), squash-merge after ≥1 approval

**Commit format:** `feat(scanner): add camera permission error handling`

## Language Rules

| What | Language |
|------|----------|
| Code, types, comments, test descriptions | English |
| UI strings | German |
| Ingredient detection keywords | German (must match product text) |

## Code Style

- Components: PascalCase | Variables/functions: camelCase | Constants: SCREAMING_SNAKE_CASE
- No form libraries, no state management library, no i18n, no axios
- Icons: Lucide React only

**React Hooks Rules (critical):**
- `useEffect` restore: use empty-deps `[]` for one-time URL/storage restoration — never guard with `if (state !== urlParam)`
- `useCallback` deps: any function closing over state used as callback must be wrapped
- State capture: read values into `const` before `setState` calls
- `popstate` handler: must explicitly clear ALL related state when URL has no query

## State & Persistence

- Saved products: `localStorage` key `"hashimoto-pcos-saved-products"`
- User profile: `localStorage` key `"hashimoto-pcos-user-profile"` → `UserProfile` JSON
- Onboarding skipped: `"hashimoto-pcos-onboarding-skipped"` → `"true"`
- Search cache: `sessionStorage` key `search-results:${encodeURIComponent(query)}:${encodeURIComponent(category)}`

**sessionStorage rules (from PR #60):**
- Always `encodeURIComponent()` user-derived key segments
- Store `hasMore: boolean` explicitly — don't re-derive from array length
- Key builders at module scope, not inside components
- Use `useRef` accumulator for pagination — never read-then-extend in a loop
- `useUserProfile()` sets `isLoaded = true` after first `useEffect` — wait for this before rendering profile-dependent UI

## Architecture Compliance

- `core/` is sacred — zero framework imports
- Dependency direction: `presentation → infrastructure → core` (never outward)
- New ports go in `core/ports/` first, implement in `infrastructure/`
- Check `eslint.config.mjs` for restricted imports

## Critical Rules (Don't Break)

- **ESM/CJS:** Never add `"type": "module"` to `package.json`. Scripts use `.mjs` extension.
- **Port completeness:** Every method on an implementation must be declared on its port interface first.
- **DB cache pattern:** on cache hit, return immediately — no redundant SELECT.
- **Composite PK for repeated values:** use `(parent_id, position)` as PK, `(parent_id, foreign_id)` as UNIQUE.
- **Whitelist hygiene:** no leading/trailing spaces, no empty strings, complete E-number ranges.

## Accessibility (WCAG AA)

All UI must meet **WCAG AA** contrast requirements (minimum **4.5:1** for normal text on white).

**Score color values (WCAG AA compliant):**
- `SCORE_CONFIG` in `src/components/ScoreCard.tsx` defines score label colors
- NEUTRAL: `#a16207` (yellow-700, ~4.74:1 on white)
- WENIGER GUT: `#c2410c` (orange-700, ~4.92:1 on white)
- CSS custom properties synced in `src/app/globals.css`: `--color-score-neutral` and `--color-score-fair`
- Always verify new score colors against white with a contrast ratio calculator before using

**ARIA patterns:**
- Emoji icons used as visual indicators need `role="img"` + `aria-label` describing the meaning, not the appearance (e.g., `aria-label="PCOS"` not `aria-label="Blaue-Kugel-Emoji"`)
- Use a `CONDITION_LABEL` map (Record<Condition, string>) to pair with `CONDITION_ICON`
- Tooltips use `role="tooltip"` and toggle buttons use `aria-expanded`

**Missing data:** Never show bare "—" or empty values. Use "Nicht angegeben" with an info button + tooltip explaining the data is absent from the product database.

## What Does NOT Exist

No ORM (raw `better-sqlite3`), no authentication, no Redux/Zustand, no i18n, no Prettier (ESLint only), no Service Worker, no analytics.

## Docs & Resources

- `docs/recherche/` — scientific research in German (4 files)
- `ARCHITECTURE.md`, `CONTRIBUTING.md`, `README.md`
- `tests/fixtures/products/*.json` — 5 test product fixtures
