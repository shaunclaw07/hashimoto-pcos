# Architektur-Dokumentation

## Überblick

Das Hashimoto-PCOS Ernährungs-Tool ist eine **Next.js 14** Web-App mit:

- **Barcode-Scanner** für Produkte
- **Lebensmittel-Suche** über OpenFoodFacts API
- **Scoring-Algorithmus** für Hashimoto/PCOS-Eignung
- **Ampel-System** für verständliche Bewertungen

---

## Systemarchitektur

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Browser    │────▶│  Next.js App  │────▶│  OpenFoodFacts API  │
│  (Client)   │◀────│  (Server)     │◀────│  (External)         │
└─────────────┘     └──────────────┘     └─────────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Scoring     │
                   │  Algorithm   │
                   └──────────────┘
```

---

## Tech-Stack Details

| Komponente | Technologie | Version |
|------------|--------------|---------|
| Framework | Next.js | 14.2.15 |
| Sprache | TypeScript | 5.6.2 |
| Styling | Tailwind CSS | 3.4.11 |
| Testing | Vitest | 2.1.1 |
| Barcode-Scanner | QuaggaJS2 | 1.12.1 |
| API | OpenFoodFacts | REST |

---

## Datenfluss

```
User scannt Barcode
        │
        ▼
┌───────────────────┐
│  Scanner Component │  (QuaggaJS)
└─────────┬─────────┘
          │ Barcode-String
          ▼
┌───────────────────┐
│  result/[barcode] │  (Next.js Page)
└─────────┬─────────┘
          │ Barcode
          ▼
┌───────────────────┐
│ openfoodfacts.ts │  (API Client)
└─────────┬─────────┘
          │ Rohdaten
          ▼
┌───────────────────┐
│    scoring.ts     │  (Algorithmus)
└─────────┬─────────┘
          │ Score + Ampel
          ▼
┌───────────────────┐
│   ScoreCard.tsx   │  (UI Anzeige)
└───────────────────┘
```

---

## Scoring-Algorithmus

Der Algorithmus bewertet Produkte für Hashimoto- und PCOS-Betroffene.

### Bewertungskriterien

| Kategorie | Kriterium | Gewichtung |
|-----------|-----------|------------|
| Jod | Bedarf: 200μg/Tag | Hoch |
| Selen | Bedarf: 60-100μg/Tag | Hoch |
| Zink | Bedarf: 8-10mg/Tag | Mittel |
| Eisen | Bedarf: 8-15mg/Tag | Mittel |
| Vitamin D | Bedarf: 4000IU/Tag | Mittel |
| Gluten | Eliminationskandidat | Hoch |
| Laktose | Eliminationskandidat | Mittel |
| Zucker | Niedrig bevorzugt | Niedrig |
| Ballaststoffe | Hoch bevorzugt | Niedrig |

### Ampel-System

```
Score >= 80  → 🟢 GRÜN  (Empfohlen)
Score 50-79  → 🟡 GELB  (In Maßen)
Score < 50   → 🔴 ROT   (Vermeiden)
```

### Beispiel-Berechnung

```typescript
// Vereinfachtes Beispiel
const product = {
  name: "Quark 20% Fett",
  nutrients: {
    iodine: 15,      // μg pro 100g
    selenium: 10,    // μg pro 100g
    zinc: 0.5,       // mg pro 100g
    iron: 0.2,       // mg pro 100g
    fiber: 3.0,      // g pro 100g
    sugar: 3.5,      // g pro 100g
  }
};

// Score-Berechnung in scoring.ts
export function calculateScore(product: ProductData): ScoreResult {
  // ... (siehe src/lib/scoring.ts)
}
```

---

## Komponenten-Architektur

### Page Components (App Router)

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/` | `page.tsx` | Landingpage |
| `/scanner` | `scanner/page.tsx` | Barcode-Scanner |
| `/lebensmittel` | `lebensmittel/page.tsx` | Lebensmittel-Suche |
| `/result/[barcode]` | `result/[barcode]/page.tsx` | Produkt-Detail |

### Shared Components

| Komponente | Verzeichnis | Beschreibung |
|------------|-------------|--------------|
| `ScoreCard` | `components/` | Nährwert-Score Anzeige |
| `Scanner` | `components/` | QuaggaJS Camera-Integration |
| `BottomNav` | `components/` | Navigation |

---

## API-Integration

### OpenFoodFacts Client

```typescript
// src/lib/openfoodfacts.ts

// Produkt per Barcode
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json

// Suche
GET https://world.openfoodfacts.org/cgi/search.pl?
    search_terms={query}&
    search_simple=1&
    json=1&
    page_size={n}&
    page={p}
```

### Response-Handling

```typescript
interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  nutriments: {
    "iodine-value_100g"?: number;
    "selenium-value_100g"?: number;
    "zinc-value_100g"?: number;
    "iron-value_100g"?: number;
    "fiber_100g"?: number;
    "sugars_100g"?: number;
    // ...
  };
  allergens_tags?: string[];
  // ...
}
```

---

## Testing-Strategie

### Unit Tests (`src/lib/__tests__/`)

- `scoring.test.ts` — Algorithmus-Tests
- `openfoodfacts.test.ts` — API-Client-Tests

### Test-Beispiel

```typescript
// src/lib/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoring';

describe('Scoring', () => {
  it('should return green for iodine-rich products', () => {
    const result = calculateScore({
      nutrients: { iodine_value_100g: 100 }
    });
    expect(result.ampel).toBe('green');
  });
});
```

---

## Environment-Konfiguration

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://world.openfoodfacts.org
```

---

## Deployment

```bash
# Build
npm run build

# Production Server
npm start
```

Deployed auf: **Vercel** (empfohlen) oder beliebiges Node.js-Hosting.

---

## Zukünftige Erweiterungen

- [ ] Offline-Modus (Service Worker)
- [ ] Persistente Favoriten (localStorage/DB)
- [ ] Eigene Lebensmittel-Datenbank
- [ ] Social Sharing
- [ ] PWA-Unterstützung

---

*Letzte Aktualisierung: 2026-03-31*
