# Tailwind CSS v4 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Tailwind CSS v3 → v4, moving all config to CSS-first `@theme`, renaming score colors to English kebab-case, and upgrading `tailwind-merge` to v3.

**Architecture:** Replace `tailwind.config.ts` entirely with `@theme` blocks in `globals.css`. Semantic tokens (dark-mode-aware) use `@theme inline` referencing existing CSS variables. Static tokens (color shades, score colors, spacing, radius, shadows) use regular `@theme`. PostCSS switches from `tailwindcss` + `autoprefixer` to `@tailwindcss/postcss` (v4 handles autoprefixing internally).

**Tech Stack:** Tailwind CSS v4, `@tailwindcss/postcss`, `tailwind-merge` v3, Next.js 16, PostCSS

---

### Task 1: Install packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Tailwind v4, the new PostCSS plugin, and tailwind-merge v3; remove autoprefixer**

```bash
npm install tailwindcss@latest @tailwindcss/postcss tailwind-merge@latest
npm uninstall autoprefixer
```

Expected output: no errors, `tailwindcss@4.x`, `@tailwindcss/postcss@4.x`, `tailwind-merge@3.x` installed.

- [ ] **Step 2: Verify installed versions**

```bash
npm list tailwindcss @tailwindcss/postcss tailwind-merge autoprefixer 2>&1
```

Expected: `tailwindcss@4.x`, `@tailwindcss/postcss@4.x`, `tailwind-merge@3.x`, `autoprefixer` NOT listed.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): upgrade tailwindcss v3 → v4, add @tailwindcss/postcss, upgrade tailwind-merge v2 → v3"
```

---

### Task 2: Update PostCSS config

**Files:**
- Modify: `postcss.config.js`

- [ ] **Step 1: Replace the PostCSS config**

Full content of `postcss.config.js` after edit:

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 2: Verify the build still starts (compilation check only)**

```bash
npm run build 2>&1 | head -15
```

Expected: build starts (may fail on CSS import errors — that's expected before Task 3).

- [ ] **Step 3: Commit**

```bash
git add postcss.config.js
git commit -m "chore(config): migrate PostCSS to @tailwindcss/postcss (tailwind v4)"
```

---

### Task 3: Rewrite `globals.css` for Tailwind v4

**Files:**
- Modify: `src/app/globals.css`

This is the main migration task. Replace the file completely with the v4 CSS-first config.

Key decisions:
- `@theme inline` for semantic tokens (primary, secondary, etc.) — these reference existing CSS variables so dark mode works automatically
- Regular `@theme` for static tokens (color shades, score colors, spacing, radius, shadows)
- `@custom-variant dark (...)` replaces `darkMode: ["class"]` from the old config
- All existing `@layer base/components/utilities` content is preserved unchanged

- [ ] **Step 1: Replace `src/app/globals.css` with the v4 version**

Full file content:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* ── Semantic CSS variables (light + dark mode) ──────────────────────────── */

@layer base {
  :root {
    --background: #FEFEFA;
    --foreground: #2D2A32;
    --card: #FFFFFF;
    --card-foreground: #2D2A32;
    --popover: #FFFFFF;
    --popover-foreground: #2D2A32;
    --primary: #8B7CB5;
    --primary-foreground: #FFFFFF;
    --secondary: #5B8F7B;
    --secondary-foreground: #FFFFFF;
    --muted: #F0EDE8;
    --muted-foreground: #6B6560;
    --accent: #D4956A;
    --accent-foreground: #FFFFFF;
    --destructive: #ef4444;
    --destructive-foreground: #ffffff;
    --border: #E8E4DF;
    --input: #E8E4DF;
    --ring: #8B7CB5;
    --radius: 0.625rem;
  }

  .dark {
    --background: #1A1820;
    --foreground: #F5F0E8;
    --card: #252230;
    --card-foreground: #F5F0E8;
    --popover: #252230;
    --popover-foreground: #F5F0E8;
    --primary: #9B87B5;
    --primary-foreground: #FFFFFF;
    --secondary: #6BA08B;
    --secondary-foreground: #FFFFFF;
    --muted: #2E2A38;
    --muted-foreground: #A8A4AC;
    --accent: #E4A57A;
    --accent-foreground: #1A1820;
    --destructive: #f87171;
    --destructive-foreground: #1A1820;
    --border: #3A3645;
    --input: #3A3645;
    --ring: #9B87B5;
  }
}

/* ── Tailwind v4 theme tokens ─────────────────────────────────────────────── */

/* Semantic colors: reference CSS variables above so dark mode is automatic */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

/* Static tokens: shades, score colors, custom utilities */
@theme {
  /* Primary shades (lavender) */
  --color-primary-50: #F3F0F7;
  --color-primary-100: #E8E1F0;
  --color-primary-200: #D4C9E2;
  --color-primary-300: #B8A8CC;
  --color-primary-400: #9B87B5;
  --color-primary-500: #8B7CB5;
  --color-primary-600: #7A68A8;
  --color-primary-700: #65548C;
  --color-primary-800: #544573;
  --color-primary-900: #463960;
  --color-primary-950: #2E2640;

  /* Secondary shades (sage green) */
  --color-secondary-50: #EDF5F1;
  --color-secondary-100: #D5EAE0;
  --color-secondary-200: #ABD5C1;
  --color-secondary-300: #81C0A2;
  --color-secondary-400: #5B8F7B;
  --color-secondary-500: #4A7A68;
  --color-secondary-600: #3D6556;
  --color-secondary-700: #325147;
  --color-secondary-800: #284039;
  --color-secondary-900: #1F332D;
  --color-secondary-950: #152219;

  /* Accent shades (warm terracotta) */
  --color-accent-50: #FBF4EE;
  --color-accent-100: #F5E6D8;
  --color-accent-200: #E8CDB3;
  --color-accent-300: #DAB48D;
  --color-accent-400: #D4956A;
  --color-accent-500: #C47D4F;
  --color-accent-600: #A86840;
  --color-accent-700: #8C5434;
  --color-accent-800: #70442B;
  --color-accent-900: #5C3824;
  --color-accent-950: #3D2417;

  /* Background variants */
  --color-background-warm: #F5F0E8;
  --color-background-cream: #FAF8F5;

  /* Surface */
  --color-surface: #FFFFFF;
  --color-surface-warm: #F5F0E8;
  --color-surface-muted: #F0EDE8;

  /* Border warm */
  --color-border-warm: #D9D4CC;

  /* Score colors — English, kebab-case */
  --color-score-very-good: #22c55e;
  --color-score-good: #84cc16;
  --color-score-neutral: #eab308;
  --color-score-fair: #f97316;
  --color-score-avoid: #ef4444;

  /* Touch-friendly spacing (44px minimum tap targets) */
  --spacing-touch-sm: 2.75rem;
  --spacing-touch-md: 3rem;
  --spacing-touch-lg: 3.5rem;

  /* Border radius */
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;

  /* Box shadows */
  --shadow-soft: 0 2px 8px 0 rgba(139, 124, 181, 0.08);
  --shadow-card: 0 4px 12px 0 rgba(139, 124, 181, 0.1);
  --shadow-lifted: 0 8px 24px 0 rgba(139, 124, 181, 0.12);

  /* Font sizes with line heights */
  --text-base: 1rem;
  --text-base--line-height: 1.6;
  --text-lg: 1.125rem;
  --text-lg--line-height: 1.6;
  --text-xl: 1.25rem;
  --text-xl--line-height: 1.5;
  --text-2xl: 1.5rem;
  --text-2xl--line-height: 1.4;
  --text-3xl: 1.875rem;
  --text-3xl--line-height: 1.35;
  --text-4xl: 2.25rem;
  --text-4xl--line-height: 1.3;
}

/* ── Base styles ─────────────────────────────────────────────────────────── */

@layer base {
  * {
    border-color: #E8E4DF;
  }

  html {
    font-size: 16px;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background-color: #FEFEFA;
    color: #2D2A32;
    @apply antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  ::selection {
    background-color: rgba(139, 124, 181, 0.2);
  }

  @media (prefers-reduced-motion: no-preference) {
    html {
      scroll-behavior: smooth;
    }
  }
}

/* ── Component classes ───────────────────────────────────────────────────── */

@layer components {
  .touch-target {
    @apply min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center;
  }

  .card-warm {
    @apply bg-white rounded-xl border shadow-soft;
  }

  .btn-primary {
    @apply bg-primary text-white
           hover:bg-primary-600
           active:bg-primary-700
           disabled:opacity-50
           touch-target rounded-lg font-medium
           transition-all duration-200 ease-out
           shadow-soft hover:shadow-card;
  }

  .btn-secondary {
    @apply bg-secondary text-white
           hover:bg-secondary-600
           active:bg-secondary-700
           disabled:opacity-50
           touch-target rounded-lg font-medium
           transition-all duration-200 ease-out;
  }

  .btn-ghost {
    @apply bg-transparent text-foreground
           hover:bg-muted
           active:bg-muted/80
           touch-target rounded-lg font-medium
           transition-all duration-200 ease-out;
  }

  .score-badge {
    @apply inline-flex items-center justify-center gap-1.5
           px-3 py-1.5 rounded-full text-sm font-semibold;
  }

  .section-divider {
    @apply border-t my-6;
  }

  .bottom-nav-safe {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
}

/* ── Utility classes ─────────────────────────────────────────────────────── */

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 2: Run the build to catch any CSS compilation errors**

```bash
npm run build 2>&1
```

Expected: build succeeds. If it fails with unknown utility errors, check the error message for which class isn't resolving and fix the corresponding `@theme` entry.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(styles): migrate globals.css to Tailwind v4 CSS-first config"
```

---

### Task 4: Delete `tailwind.config.ts`

**Files:**
- Delete: `tailwind.config.ts`

- [ ] **Step 1: Delete the file**

```bash
rm tailwind.config.ts
```

- [ ] **Step 2: Run the build to confirm nothing depends on the deleted file**

```bash
npm run build 2>&1 | tail -15
```

Expected: build completes successfully with the same route output as before.

- [ ] **Step 3: Commit**

```bash
git add -u tailwind.config.ts
git commit -m "chore: remove tailwind.config.ts (migrated to CSS @theme in globals.css)"
```

---

### Task 5: Rename score color classes to English kebab-case

**Files:**
- Modify: `src/app/page.tsx` (10 occurrences, lines 71–98)
- Modify: `src/app/lebensmittel/page.tsx` (4 occurrences, lines 295–299)

Rename mapping:
- `score-sehr_gut` → `score-very-good`
- `score-gut` → `score-good`
- `score-neutral` → `score-neutral` (unchanged)
- `score-weniger_gut` → `score-fair`
- `score-vermeiden` → `score-avoid`

- [ ] **Step 1: Update `src/app/page.tsx` (lines 71–98)**

Replace the score legend section:

```tsx
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-very-good shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
            <span className="text-sm font-medium text-score-very-good">Sehr gut</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-good shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
            <span className="text-sm font-medium text-score-good">Gut</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-neutral shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">~</span>
            </div>
            <span className="text-sm font-medium text-score-neutral">Neutral</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-fair shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">!</span>
            </div>
            <span className="text-sm font-medium text-score-fair">Weniger gut</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-avoid shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">✗</span>
            </div>
            <span className="text-sm font-medium text-score-avoid">Vermeiden</span>
          </div>
        </div>
```

- [ ] **Step 2: Update `src/app/lebensmittel/page.tsx` (lines 295–299)**

Replace the `getScoreColor` function body:

```ts
function getScoreColor(score: number): string {
  if (score >= 4.5) return "bg-score-very-good";
  if (score >= 3.5) return "bg-score-good";
  if (score >= 2.5) return "bg-score-neutral";
  if (score >= 1.5) return "bg-score-fair";
  return "bg-score-avoid";
}
```

- [ ] **Step 3: Verify no old score class names remain**

```bash
grep -r "score-sehr_gut\|score-gut\|score-weniger_gut\|score-vermeiden" src/
```

Expected: no output (zero matches).

- [ ] **Step 4: Run the build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/lebensmittel/page.tsx
git commit -m "refactor: rename score color classes to English kebab-case (tailwind v4)"
```

---

### Task 6: Final verification

**Files:** none modified

- [ ] **Step 1: Run unit tests**

```bash
npm run test:run 2>&1
```

Expected:
```
Test Files  2 passed (2)
     Tests  51 passed (51)
```

- [ ] **Step 2: Run lint**

```bash
npm run lint 2>&1
```

Expected: only the existing 6 warnings (no new errors).

- [ ] **Step 3: Run production build**

```bash
npm run build 2>&1
```

Expected: all 6 routes compile successfully.

- [ ] **Step 4: Start dev server and do manual visual check**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
1. **Homepage** — score legend shows 5 colored circles (green → red)
2. **`/lebensmittel`** — search for a product; score dot on product card shows correct color
3. **Dark mode** — add `class="dark"` to `<html>` in browser DevTools; background, text, and primary colors should invert
4. **`/scanner`** — page loads, `bg-background-warm` backgrounds render (warm beige)
5. **`/result/[barcode]`** — load any result; `card-warm` class renders correctly (white card with soft border)

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix(styles): tailwind v4 post-migration fixes"
```
