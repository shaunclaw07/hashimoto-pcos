# Architektur-Dokumentation

## Überblick

Das Hashimoto-PCOS Ernährungs-Tool ist eine **Next.js 16** Web-App mit:

- **Barcode-Scanner** für Produkte (Kamera + manuelle Eingabe)
- **Lebensmittel-Suche** mit lokaler SQLite-Datenbank (462k+ DACH-Produkte) und OpenFoodFacts API als Fallback
- **Scoring-Algorithmus** für Hashimoto/PCOS-Eignung (1–5 Sterne)
- **Ampel-System** für verständliche Bewertungen

---

## Systemarchitektur

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Browser    │────▶│  Next.js 16 App      │────▶│  OpenFoodFacts API  │
│  (Client)   │◀────│  (API Routes)        │◀────│  (Fallback only)    │
└─────────────┘     └──────────────────────┘     └─────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │  SQLite (products.db) │
                    │  462k+ DACH-Produkte  │
                    │  FTS5 Volltextsuche   │
                    └──────────────────────┘
```

**Datenfluss:** Client-Seiten rufen lokale API-Routes auf → API-Routes fragen SQLite zuerst → Fallback auf OpenFoodFacts REST API wenn nicht lokal gefunden. Keine direkten Client-zu-API-Aufrufe (kein CORS).

---

## Tech-Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| Framework | Next.js | ^16.2.2 |
| Sprache | TypeScript | ^6.0.2 |
| Runtime | React | ^19.0.4 |
| Styling | Tailwind CSS | ^4.2.2 (CSS-first) |
| Datenbank | better-sqlite3 | ^12.8.0 |
| Unit-Tests | Vitest | ^4.1.2 |
| E2E-Tests | Playwright | ^1.59.0 |
| Barcode-Scanner | QuaggaJS2 | ^1.12.1 |
| Icons | Lucide React | ^1.7.0 |

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
┌────────────────────┐     ┌──────────────────┐
│  API Route         │────▶│  SQLite lookup   │  (primär)
│  [barcode]/route   │     └──────────────────┘
└─────────┬──────────┘     ┌──────────────────┐
          │ (Fallback)      │  OFf API fetch   │  (wenn SQLite kein Ergebnis)
          └───────────────▶│  + DB-Enrichment │
                           └──────────────────┘
          │ ProductData
          ▼
┌────────────────────┐
│    scoring.ts      │  (pure function, client-side)
└─────────┬──────────┘
          │ ScoreResult
          ▼
┌────────────────────┐
│   ScoreCard.tsx    │  (UI-Anzeige)
└────────────────────┘
```

---

## Scoring-Algorithmus (`src/lib/scoring.ts`)

**Basiswert: 3.0** — angepasst nach Nährwerten pro 100 g:

| Bedingung | Punkte |
|-----------|--------|
| Ballaststoffe > 6 g | +1.0 |
| Ballaststoffe > 3 g | +0.5 |
| Protein > 20 g | +0.5 |
| Omega-3 im Label | +1.0 |
| Glutenfrei-Label | +0.5 |
| Bio-Label | +0.5 |
| Zucker > 20 g | −2.0 |
| Zucker > 10 g | −1.0 |
| Gesättigte Fettsäuren > 10 g | −1.0 |
| Salz > 2,5 g | −1.0 |
| Salz > 1,5 g | −0.5 |
| Gluten in Zutaten | −0.5 |
| Laktose in Zutaten | −0.3 |
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

## Styling — Tailwind CSS v4 (CSS-first)

Kein `tailwind.config.ts` — alle Theme-Tokens sind direkt in `src/app/globals.css` via `@theme` definiert:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-score-very-good: #22c55e;
  --color-score-good:      #84cc16;
  --color-score-neutral:   #eab308;
  --color-score-fair:      #f97316;
  --color-score-avoid:     #ef4444;
  /* ... weitere Tokens */
}
```

Dark Mode wird über CSS-Variablen und `@custom-variant dark` gesteuert.

---

## Komponenten-Architektur

### Page Components (App Router)

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/` | `page.tsx` | Landing Page (Server Component) |
| `/scanner` | `scanner/page.tsx` | Barcode-Scanner (Kamera + Manuelleingabe) |
| `/lebensmittel` | `lebensmittel/page.tsx` | Produktsuche, Kategorie-Filter, Infinite Scroll |
| `/result/[barcode]` | `result/[barcode]/page.tsx` | Produktdetail + Score + Favorit |

### Shared Components

| Komponente | Verzeichnis | Beschreibung |
|------------|-------------|--------------|
| `ScoreCard` | `components/` | Score-Badge, Sterne, Nährwert-Breakdown, Aktionsbuttons |
| `Scanner` | `components/` | QuaggaJS2 Kamera-Integration (3 s Deduplizierung) |
| `BottomNav` | `components/` | Fixe Bottom-Navigation (3 Routen) |
| `ThemeProvider` | `components/` | next-themes Wrapper |

---

## API-Routes (Server-side)

### `GET /api/products/[barcode]`

1. SQLite-Lookup per EAN-13
2. Falls gefunden, aber ohne Nährwerte → OFf-API anfragen + DB-Update (`UPDATE products SET nutriments = ?`)
3. Falls nicht in SQLite → OFf-API Vollabfrage
4. 404 wenn nirgendwo gefunden

### `GET /api/products/search?q=...&category=...&page=...`

1. FTS5 Volltextsuche auf `products_fts` (Name + Marke)
2. Optionaler Kategorie-Filter
3. Pagination (20 Ergebnisse/Seite)
4. Fallback auf OFf-Suchendpoint wenn SQLite leer

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
# DB einmalig aufbauen (CSV vorher herunterladen)
node scripts/build-db.mjs /pfad/zur/en.openfoodfacts.org.products.csv
```

---

## Testing-Strategie

### Unit Tests (`src/lib/__tests__/`)

- **Framework:** Vitest 4.x + jsdom
- `scoring.test.ts` — 39 Tests: Algorithmus-Logik + 5 reale Produkt-Fixtures
- `openfoodfacts.test.ts` — 12 Tests: Validierung, Fetch, Fehlerbehandlung
- Kein echtes Netzwerk — `vi.fn()` für `fetch`

### E2E Tests (`e2e/*.spec.ts`)

- **Framework:** Playwright 1.x, Mobile-Viewport (Pixel 5 / 375×812)
- Dev-Server wird automatisch gestartet
- API-Mocking via `page.route()` — keine echten Netzwerkaufrufe
- 9 Spec-Dateien, 40+ Tests

---

## Deployment

### Docker

```bash
npm run db:build                   # Voraussetzung!
docker compose up --build -d       # Build + Start
docker compose logs -f
```

Multi-Stage Build (Node 20 Alpine), läuft als Non-Root-User (`nextjs`, uid 1001), Port 3000.

### Kubernetes

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml
```

HPA skaliert zwischen **2–10 Replicas** (CPU 70% / Memory 80%).

### CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` — Lint + Build + Vitest + Playwright E2E
- `.github/workflows/docker.yml` — Docker Build + Push zu `ghcr.io/shaunclaw07/hashimoto-pcos`

---

*Letzte Aktualisierung: 2026-04-01*
