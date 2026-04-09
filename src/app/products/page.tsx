"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, PackageX, ServerCrash } from "lucide-react";
import { calculateScore } from "@/core/services/scoring-service";
import type { Product } from "@/core/domain/product";
import type { ScoreResult } from "@/core/domain/score";
import type { UserProfile } from "@/core/domain/user-profile";
import Link from "next/link";
import { useUserProfile } from "@/hooks/use-user-profile";

const CATEGORIES = [
  { key: "all", label: "Alle" },
  { key: "vegetables", label: "Gemüse" },
  { key: "fruits", label: "Obst" },
  { key: "meat", label: "Fleisch" },
  { key: "fish", label: "Fisch" },
  { key: "dairy", label: "Milchprodukte" },
  { key: "grains", label: "Getreide" },
  { key: "snacks", label: "Snacks" },
];

const SEARCH_URL = "/api/products/search";
const PAGE_SIZE = 25;

const SESSION_STORAGE_KEY_PREFIX = "search-results";

function getSessionStorageKey(q: string, cat: string): string {
  return `${SESSION_STORAGE_KEY_PREFIX}:${encodeURIComponent(q)}:${encodeURIComponent(cat)}`;
}

function getStoredData(q: string, cat: string) {
  try {
    const raw = sessionStorage.getItem(getSessionStorageKey(q, cat));
    if (!raw) return null;
    return JSON.parse(raw) as { products: Product[]; count: number; maxPage: number; hasMore: boolean };
  } catch {
    return null;
  }
}

interface ApiSearchResponse {
  products: Product[];
  count: number;
  page: number;
}

async function searchProducts(
  query: string,
  category: string,
  page: number
): Promise<ApiSearchResponse> {
  const params = new URLSearchParams({
    search_terms: query,
    page: String(page),
    page_size: String(PAGE_SIZE),
  });
  if (category && category !== "all") {
    params.set("tag_0", category);
  }

  const response = await fetch(`${SEARCH_URL}?${params}`);

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error("SERVER_BUSY");
    }
    if (response.status === 400) {
      throw new Error("INVALID_REQUEST");
    }
    throw new Error(`API_ERROR_${response.status}`);
  }

  return response.json() as Promise<ApiSearchResponse>;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageLoading() {
  return (
    <div className="min-h-screen px-5 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Lebensmittel</h1>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

function ProductsPageContent() {
  const { profile } = useUserProfile();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [serverBusy, setServerBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const accumulatedProductsRef = useRef<Product[]>([]);

  // Restore search from sessionStorage on back/forward navigation.
  // Browser back/forward (popstate) does NOT trigger useSearchParams() updates in
  // Next.js App Router, so we detect it via a dedicated popstate listener.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const restoreFromSessionStorage = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") ?? "";
      const cat = params.get("category") ?? "all";
      if (!q && cat === "all") {
        // User navigated back to the empty search page — clear all search state
        setResults([]);
        setSearched(false);
        setQuery("");
        setCategory("all");
        setPage(1);
        setHasMore(false);
        setTotalCount(0);
        return;
      }

      setQuery(q);
      setCategory(cat);
      const pageParam = params.get("page") ? Number(params.get("page")) : 1;
      setPage(pageParam);

      const stored = getStoredData(q, cat);
      if (stored) {
        setResults(stored.products);
        setTotalCount(stored.count);
        setSearched(true);
        setHasMore(stored.hasMore ?? false);
      } else {
        setSearched(true);
      }
    };

    window.addEventListener("popstate", restoreFromSessionStorage);
    return () => window.removeEventListener("popstate", restoreFromSessionStorage);
  }, []);

  // Sync query/category/page from URL on initial mount and restore results from
  // sessionStorage if available. Runs once — use window.location directly since
  // searchParams may not be populated on first render in Next.js App Router.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    const cat = params.get("category") ?? "all";
    if (!q && cat === "all") return;

    setQuery(q);
    setCategory(cat);
    const pageParam = params.get("page") ? Number(params.get("page")) : 1;
    setPage(pageParam);

    // Restore results from sessionStorage if available (persisted from a previous visit)
    const stored = getStoredData(q, cat);
    if (stored) {
      setResults(stored.products);
      setTotalCount(stored.count);
      setSearched(true);
      setHasMore(stored.hasMore ?? false);
    } else {
      setSearched(true);
      // No cache — trigger fresh fetch for this category/query
      // Pass cat explicitly since state may not have updated yet
      void handleSearch(undefined, pageParam, cat);
    }
  }, []); // mount only — runs once on initial page load

  const handleSearch = useCallback(async (
    e?: React.FormEvent,
    newPage = 1,
    overrideCategory?: string
  ) => {
    e?.preventDefault();
    const effectiveCategory = overrideCategory ?? category;

    // Allow category-only browsing; only bail out if both are absent
    if (!query.trim() && effectiveCategory === "all") return;

    // If this page is already in sessionStorage, restore from there instead of
    // re-fetching (avoids duplicates when user scrolls back up after going forward)
    if (newPage > 1) {
      const stored = getStoredData(query.trim(), effectiveCategory);
      if (stored && newPage <= stored.maxPage) {
        setResults(stored.products);
        setPage(stored.maxPage);
        setHasMore(stored.hasMore ?? false);
        setTotalCount(stored.count);
        setSearched(true);
        setIsLoading(false);
        const params = new URLSearchParams();
        params.set("q", query.trim());
        if (effectiveCategory !== "all") params.set("category", effectiveCategory);
        params.set("page", String(stored.maxPage));
        router.push(`/products?${params}`, { scroll: false });
        return;
      }
    }

    setIsLoading(true);
    setSearched(true);
    setServerBusy(false);
    setPage(newPage);

    try {
      const result = await searchProducts(query.trim(), effectiveCategory, newPage);
      const pageHasMore = result.products.length === PAGE_SIZE;
      if (newPage === 1) {
        // Reset accumulator on new search
        accumulatedProductsRef.current = result.products;
        setResults(result.products);
        sessionStorage.setItem(
          getSessionStorageKey(query.trim(), effectiveCategory),
          JSON.stringify({ products: accumulatedProductsRef.current, count: result.count, maxPage: 1, hasMore: pageHasMore })
        );
      } else {
        // Append to accumulator — avoids stale sessionStorage read race condition
        accumulatedProductsRef.current = [...accumulatedProductsRef.current, ...result.products];
        setResults((prev) => [...prev, ...result.products]);
        sessionStorage.setItem(
          getSessionStorageKey(query.trim(), effectiveCategory),
          JSON.stringify({
            products: accumulatedProductsRef.current,
            count: result.count,
            maxPage: newPage,
            hasMore: pageHasMore,
          })
        );
      }
      setHasMore(pageHasMore);
      setTotalCount(result.count);

      // Update URL params
      const params = new URLSearchParams();
      params.set("q", query.trim());
      if (effectiveCategory !== "all") params.set("category", effectiveCategory);
      if (newPage > 1) params.set("page", String(newPage));
      router.push(`/products?${params}`, { scroll: false });
    } catch (err) {
      const isServerBusy =
        (err instanceof Error && err.message === "SERVER_BUSY") ||
        (err instanceof TypeError && err.message.includes("fetch"));
      if (isServerBusy) setServerBusy(true);
      if (newPage === 1) setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, category, router]);

  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          handleSearch(undefined, page + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, page, handleSearch]
  );

  function handleReset() {
    const oldKey = getSessionStorageKey(query.trim(), category); // capture before setters
    setQuery("");
    setResults([]);
    setSearched(false);
    setPage(1);
    setHasMore(false);
    setTotalCount(0);
    setServerBusy(false);
    accumulatedProductsRef.current = [];
    sessionStorage.removeItem(oldKey);
    router.push("/products", { scroll: false });
  }

  return (
    <div className="min-h-screen px-5 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Lebensmittel</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen..."
            className="w-full rounded-xl border border-border bg-background py-4 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                const newCat = cat.key;
                if (newCat === category) return; // no-op if already active
                setCategory(newCat);
                // Immediately clear state to prevent stale products / duplicate keys
                setResults([]);
                accumulatedProductsRef.current = [];
                setPage(1);
                setHasMore(false);
                setTotalCount(0);
                if (query.trim() || newCat !== "all") {
                  setSearched(true);
                  // Pass newCat explicitly — avoids stale closure reading old category value
                  handleSearch(undefined, 1, newCat);
                } else {
                  // "Alle" clicked with no query → return to initial empty state
                  setSearched(false);
                  setServerBusy(false);
                }
              }}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-base font-medium transition-all touch-target ${
                category === cat.key
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border text-foreground hover:bg-muted active:scale-95"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="flex-1 rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2.5 touch-target transition-all shadow-soft hover:shadow-card active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Suche...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Suchen
              </>
            )}
          </button>
          {searched && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-border bg-background px-5 py-4 font-medium text-foreground hover:bg-muted touch-target transition-all active:scale-[0.98]"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </form>

      {serverBusy && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <ServerCrash className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Server momentan überlastet</p>
            <p className="text-sm leading-relaxed">
              OpenFoodFacts ist gerade nicht erreichbar (503). Bitte versuche es in
              wenigen Sekunden erneut.
            </p>
          </div>
        </div>
      )}

      {searched && !isLoading && totalCount > 0 && (
        <p className="mb-5 text-base text-muted-foreground">
          {totalCount.toLocaleString("de-DE")} Ergebnisse gefunden
        </p>
      )}

      <div className="space-y-4">
        {results.map((product, index) => (
          <div
            key={product.barcode ? product.barcode : `fallback-${index}`}
            ref={index === results.length - 1 ? lastProductRef : undefined}
          >
            <ProductCard product={product} profile={profile ?? undefined} />
          </div>
        ))}
      </div>

      {isLoading && page > 1 && (
        <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-base">Mehr wird geladen...</span>
        </div>
      )}

      {!searched && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-5 rounded-full bg-background-warm p-5">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            Lebensmittel suchen
          </h3>
          <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
            Gib einen Suchbegriff ein oder wähle eine Kategorie, um Produkte zu finden.
          </p>
        </div>
      )}

      {searched && !isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-5 rounded-full bg-background-warm p-5">
            <PackageX className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            Keine Ergebnisse gefunden
          </h3>
          <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
            Versuche einen anderen Suchbegriff oder eine andere Kategorie.
          </p>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 4.5) return "bg-score-very-good";
  if (score >= 3.5) return "bg-score-good";
  if (score >= 2.5) return "bg-score-neutral";
  if (score >= 1.5) return "bg-score-fair";
  return "bg-score-avoid";
}

function ProductCard({ product, profile }: { product: Product; profile?: UserProfile }) {
  let scoreResult: ScoreResult | undefined;
  try {
    scoreResult = calculateScore(product, profile);
  } catch {
    // ignore scoring errors — product still displays
  }

  const score = scoreResult?.score ?? 3.0;
  const label = scoreResult?.label ?? "NEUTRAL";

  return (
    <Link
      href={`/result/${product.barcode}`}
      className="card-warm p-4 flex gap-4 transition-all hover:shadow-card active:scale-[0.99]"
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-20 w-20 shrink-0 rounded-xl object-contain bg-background-warm p-1.5"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-background-warm">
          <span className="text-3xl">🍽️</span>
        </div>
      )}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <p className="font-semibold text-lg truncate text-foreground">
          {product.name || "Unbekanntes Produkt"}
        </p>
        {product.brand && (
          <p className="text-base text-muted-foreground truncate mt-0.5">
            {product.brand}
          </p>
        )}
      </div>
      {scoreResult && (
        <div className="flex flex-col items-end justify-center gap-1.5">
          <div
            className={`h-10 w-10 rounded-full ${getScoreColor(score)} flex items-center justify-center text-white text-sm font-bold shadow-soft`}
          >
            {score.toFixed(1)}
          </div>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
      )}
    </Link>
  );
}
