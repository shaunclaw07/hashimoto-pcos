# CLAUDE.md — Hashimoto & PCOS Ernährungs-Tool

## Project Overview

A **nutrition guidance web app** for women with Hashimoto-Thyreoiditis and PCOS. Users scan product barcodes or search the OpenFoodFacts database; a custom scoring algorithm rates suitability for these two conditions using a 1–5 star / traffic-light system (Ampel-System).

- **Target users:** Women with Hashimoto and/or PCOS (German-speaking)
- **UI language:** German (all user-facing strings are in German)
- **No backend server, no database** — purely client-side Next.js consuming the public OpenFoodFacts REST API
- **Persistence:** Browser `localStorage` only (saved favorites)
- **No authentication** — fully public app

---

## Key Commands

```bash
npm run dev         # Start dev server on localhost:3000
npm run build       # Production build (outputs standalone)
npm start           # Run production build
npm run lint        # ESLint (next lint)
npm run test        # Vitest in watch mode
npm run test:run    # Vitest single run (use in CI / before commits)
npm run test:e2e    # Playwright E2E tests (auto-starts dev server)
npm run test:e2e:ui # Playwright E2E with interactive UI
```

Docker:
```bash
docker compose up   # Run app in Docker on port 3000
docker compose up --build   # Rebuild first
```

---

## Architecture

```
Browser
  └── Next.js 14 App Router (TypeScript, SSR selectively)
        ├── /                  → Landing page (server component)
        ├── /scanner           → Barcode scanner (camera + manual input)
        ├── /lebensmittel      → Product search with infinite scroll
        └── /result/[barcode]  → Product detail + score + save
              │
              ├── src/lib/openfoodfacts.ts  — API client (fetch, type-safe)
              ├── src/lib/scoring.ts         — Scoring algorithm (pure functions)
              └── src/lib/utils.ts           — cn() classname helper
```

**All pages use `"use client"`.** There are no Next.js API routes (`route.ts`). All data fetching happens client-side via the native `fetch` API.

---

## Codebase Map

| Path | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout: ThemeProvider, Inter font, BottomNav |
| `src/app/page.tsx` | Landing page (server component) |
| `src/app/scanner/page.tsx` | Scanner — dual mode: QuaggaJS camera & manual EAN-13 input |
| `src/app/lebensmittel/page.tsx` | Search page — OpenFoodFacts search with category filters, Intersection Observer pagination |
| `src/app/result/[barcode]/page.tsx` | Result page — fetches product, runs scoring, save to localStorage |
| `src/components/Scanner.tsx` | QuaggaJS2 wrapper; debounces duplicate scans (3 s) |
| `src/components/ScoreCard.tsx` | Displays score badge, star rating, nutrition breakdown, action buttons |
| `src/components/bottom-nav.tsx` | Fixed bottom navigation (3 routes) |
| `src/components/theme-provider.tsx` | next-themes wrapper (light/dark/system) |
| `src/lib/openfoodfacts.ts` | Fetch product by barcode, search by query/category; typed discriminated-union results |
| `src/lib/scoring.ts` | Core scoring algorithm — pure function `calculateScore(product)` |
| `src/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
| `src/lib/__tests__/scoring.test.ts` | 47 scoring tests (real products + edge cases) |
| `src/lib/__tests__/openfoodfacts.test.ts` | 12 API client tests (validation, fetch, errors) |
| `e2e/*.spec.ts` | Playwright E2E tests (9 specs, 40+ tests) |
| `playwright.config.ts` | Playwright config — mobile viewport, auto dev-server |
| `docs/recherche/` | Scientific research in German (4 files) |
| `k8s/` | Kubernetes deployment + HPA manifests |
| `.github/workflows/docker.yml` | CI: build + push to `ghcr.io/shaunclaw07/hashimoto-pcos` |
| `.github/workflows/ci.yml` | CI: lint + build + vitest + playwright E2E + artifact |

---

## Scoring Algorithm (`src/lib/scoring.ts`)

**Base score: 3.0** — adjusted by nutritional content per 100 g:

| Condition | Points |
|-----------|--------|
| Fiber > 6 g | +1.0 |
| Fiber > 3 g | +0.5 |
| Protein > 20 g | +0.5 |
| Omega-3 in labels | +1.0 |
| Gluten-free label | +0.5 |
| Organic/Bio label | +0.5 |
| Sugar > 20 g | −2.0 |
| Sugar > 10 g | −1.0 |
| Saturated fat > 10 g | −1.0 |
| Salt > 2.5 g | −1.0 |
| Salt > 1.5 g | −0.5 |
| Gluten in ingredients | −0.5 |
| Lactose in ingredients | −0.3 |
| > 5 additives (E-numbers) | −0.5 |

Final score is **clamped to [1.0, 5.0]** and mapped to labels:

| Score | Stars | Label |
|-------|-------|-------|
| ≥ 4.5 | 5 | SEHR GUT |
| ≥ 3.5 | 4 | GUT |
| ≥ 2.5 | 3 | NEUTRAL |
| ≥ 1.5 | 2 | WENIGER GUT |
| < 1.5 | 1 | VERMEIDEN |

Tailwind custom colors for labels: `score.sehr_gut`, `score.gut`, `score.neutral`, `score.weniger_gut`, `score.vermeiden` (see `tailwind.config.ts`).

---

## External API — OpenFoodFacts

| Endpoint | URL |
|----------|-----|
| Product by barcode | `GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json` |
| Search | `GET https://de.openfoodfacts.org/cgi/search.pl?search_terms=...&json=1&page_size=20&...` |

- No API key required.
- Product images proxied through Next.js image optimization (configured in `next.config.js`).
- API responses use `status: 1` (found) / `status: 0` (not found).

---

## TypeScript Patterns

**Strict mode is on.** Never use `any`; use `unknown` or specific types.

**Error handling** uses discriminated unions — no thrown exceptions:

```typescript
type FetchProductResult =
  | { success: true; product: OpenFoodFactsProduct }
  | { success: false; error: FetchProductError };

type FetchProductError =
  | { type: "invalid_barcode"; message: string }
  | { type: "not_found"; message: string }
  | { type: "network_error"; message: string }
  | { type: "unknown_error"; message: string };
```

Always pattern-match on `result.success` before accessing `result.product`.

**Path alias:** `@/` → `src/` (configured in `tsconfig.json`).

**Classnames:** use `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`).

---

## Testing

### Unit Tests (Vitest)
- **Framework:** Vitest 2.x + jsdom (browser DOM simulation)
- **Location:** `src/lib/__tests__/*.test.ts`
- **What's tested:** Scoring algorithm and OpenFoodFacts API client (pure logic)
- **Mocking:** `vi.fn()` for `fetch`; no real network calls in tests

### E2E Tests (Playwright)
- **Framework:** Playwright 1.x (`@playwright/test`)
- **Location:** `e2e/*.spec.ts` (9 spec files, 40+ tests)
- **Viewport:** Mobile-first (Pixel 5 / 375×812)
- **Dev server:** Auto-started by `playwright.config.ts` webServer
- **External API:** Tests use real OpenFoodFacts API (no mocking)

**Test coverage:**
| Spec | Area |
|------|------|
| `navigation.spec.ts` | Routing, BottomNav |
| `homepage.spec.ts` | Hero, Feature cards, Score legend |
| `scanner.spec.ts` | Camera/manual toggle, EAN validation, barcode submission |
| `search.spec.ts` | Search, category filters, infinite scroll, empty states |
| `result-page.spec.ts` | Loading, error, product display, score, save/unsave |
| `scorecard.spec.ts` | Score rendering, save toggle |
| `bottom-nav.spec.ts` | Nav items, active highlighting |
| `theme.spec.ts` | Dark mode (system-only; tests skipped — no UI toggle) |
| `localstorage.spec.ts` | Save/remove/persist products |

Write tests before implementation (TDD). All lib code must have full test coverage.

```bash
npm run test:run   # Vitest — must pass before creating a PR
npm run test:e2e   # Playwright E2E — auto-starts dev server
```

---

## Development Workflow

1. Create a GitHub issue
2. Branch: `feat/issue-{N}-{description}` or `fix/issue-{N}-{description}`
3. Write tests first
4. Implement
5. Run `npm run test:run && npm run lint && npm run build`
6. Open PR referencing the issue (`Closes #N`)
7. Squash-merge after ≥ 1 approval

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
- Route state: URL params (`[barcode]` dynamic route, query string in `/lebensmittel`)
- **No server-side session, no cookies**

---

## Deployment

| Method | How |
|--------|-----|
| Local dev | `npm run dev` |
| Docker | `docker compose up` |
| Production Docker | `docker build . && docker run -p 3000:3000` |
| Kubernetes | `kubectl apply -f k8s/` (image: `ghcr.io/shaunclaw07/hashimoto-pcos:latest`) |
| CI/CD | GitHub Actions auto-builds and pushes on every push to `main` or tag `v*` |

The Docker image uses **multi-stage build** (Node 20 Alpine), runs as **non-root user** (`nextjs`, uid 1001), and exposes port **3000**.

K8s HPA scales between **2–10 replicas** based on CPU (70%) and memory (80%).

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | App base URL |

No secrets or API keys required. The OpenFoodFacts API is fully public.

---

## What Does NOT Exist (Don't Add Without Discussion)

- No backend API routes (`/api/*`)
- No database (no Prisma, no Drizzle, no SQL)
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
