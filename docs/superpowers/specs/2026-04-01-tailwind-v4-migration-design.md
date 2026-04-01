# Design: Tailwind CSS v3 → v4 Migration

**Date:** 2026-04-01  
**Approach:** Codemod + explicit correction (Option C)

---

## Context

The project uses Tailwind CSS v3 with a large `tailwind.config.ts` (150+ lines), custom color tokens, and CSS custom properties. The migration moves to Tailwind v4's CSS-first configuration model.

---

## 1. Package Changes

| Package | Action |
|---|---|
| `tailwindcss` | Upgrade to v4 |
| `@tailwindcss/postcss` | Add (replaces `tailwindcss` in PostCSS) |
| `autoprefixer` | Remove (v4 handles autoprefixing internally) |
| `tailwind-merge` | Upgrade v2 → v3 (required for v4 token support) |

---

## 2. PostCSS Config (`postcss.config.js`)

Replace `tailwindcss` plugin with `@tailwindcss/postcss`. Remove `autoprefixer`.

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

## 3. `tailwind.config.ts` — Deleted

All configuration moves into `globals.css` via `@theme`. The file is removed entirely.

---

## 4. `globals.css` — Full Rewrite

### Import
```css
@import "tailwindcss";
```
Replaces the three `@tailwind base/components/utilities` directives.

### Dark Mode
```css
@custom-variant dark (&:where(.dark, .dark *));
```
Replaces `darkMode: ["class"]` from the old config.

### `@theme` Block
All tokens from `tailwind.config.ts` are migrated as CSS custom properties inside `@theme`:

```css
@theme {
  /* Colors — primary (lavender) */
  --color-primary: #8B7CB5;
  --color-primary-50: …;
  /* … all shades … */

  /* Colors — score (English names, kebab-case) */
  --color-score-very-good: #22c55e;
  --color-score-good:      #84cc16;
  --color-score-neutral:   #eab308;
  --color-score-fair:      #f97316;
  --color-score-avoid:     #ef4444;

  /* Colors — background */
  --color-background: hsl(var(--background));
  --color-background-warm: #F5F0E8;

  /* … secondary, accent, surface, muted, border, card, input, ring, destructive … */

  /* Typography */
  --font-size-base: 1rem;
  /* … */

  /* Spacing (touch targets) */
  --spacing-touch-sm: 2.75rem;
  --spacing-touch-md: 3rem;
  --spacing-touch-lg: 3.5rem;

  /* Border radius */
  --radius: 0.625rem;
  /* … */

  /* Shadows */
  --shadow-soft: …;
  --shadow-card: …;
  --shadow-lifted: …;
}
```

### `:root` and `.dark` CSS variables
Kept as-is — the 48 CSS custom properties (`--background`, `--foreground`, etc.) remain in `:root` and `.dark`. The `@theme` tokens that reference them (e.g. `hsl(var(--primary))`) continue to work.

### `@layer base / components / utilities`
Kept as-is. `@apply` directives inside component classes continue to work in v4.

---

## 5. Score Color Renaming

14 occurrences across 2 files:

| File | Old class | New class |
|---|---|---|
| `src/app/page.tsx` (10×) | `bg-score-sehr_gut` etc. | `bg-score-very-good` etc. |
| `src/app/lebensmittel/page.tsx` (4×) | `bg-score-sehr_gut` etc. | `bg-score-very-good` etc. |

Full mapping:
- `score-sehr_gut` → `score-very-good`
- `score-gut` → `score-good`
- `score-neutral` → `score-neutral`
- `score-weniger_gut` → `score-fair`
- `score-vermeiden` → `score-avoid`

---

## 6. `tailwind-merge` Update

After upgrading to v3, verify `cn()` in `src/lib/utils.ts` still works. No API changes expected for basic usage.

---

## 7. Verification Steps

1. `npm run build` — no TypeScript or compilation errors
2. `npm run lint` — no new lint errors
3. `npm run test:run` — all 51 unit tests pass
4. `npm run dev` + manual browser check:
   - Homepage: Score legend shows correct 5 colors
   - `/lebensmittel`: Product cards show correct score color dots
   - Dark mode: Toggle `.dark` class, verify color tokens invert correctly
   - Scanner, Result page: `bg-background-warm` and `card-warm` render correctly
