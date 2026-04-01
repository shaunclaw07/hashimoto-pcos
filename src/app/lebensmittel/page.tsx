"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Loader2, PackageX, ServerCrash } from "lucide-react";
import { calculateScore, ScoreResult } from "@/lib/scoring";
import Link from "next/link";

const CATEGORIES = [
  { key: "alle", label: "Alle" },
  { key: "gemüse", label: "Gemüse" },
  { key: "obst", label: "Obst" },
  { key: "fleisch", label: "Fleisch" },
  { key: "fisch", label: "Fisch" },
  { key: "milchprodukte", label: "Milchprodukte" },
  { key: "getreide", label: "Getreide" },
  { key: "snacks", label: "Snacks" },
];

interface SearchProduct {
  barcode: string;
  name: string;
  brand?: string;
  image_url?: string;
  scoreResult?: ScoreResult;
}

interface SearchResult {
  products: SearchProduct[];
  count: number;
  page: number;
}

const SEARCH_URL = "/api/products/search";

async function searchProducts(
  query: string,
  category: string,
  page: number = 1
): Promise<SearchResult> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "20",
    page: String(page),
    lang: "de",
  });

  if (category && category !== "alle") {
    params.set("tagtype_0", "categories");
    params.set("tag_contains_0", "contains");
    params.set("tag_0", category);
  }

  const response = await fetch(`${SEARCH_URL}?${params}`);

  if (response.status === 503) {
    throw new Error("SERVER_BUSY");
  }

  const data = await response.json();

  const products: SearchProduct[] = (data.products || []).map(
    (p: Record<string, unknown>) => {
      let scoreResult: ScoreResult | undefined;
      try {
        scoreResult = calculateScore(p as Parameters<typeof calculateScore>[0]);
      } catch {
        // ignore scoring errors
      }

      return {
        barcode: p.code || p._id || "",
        name: (p.product_name as string) || (p.product_name_de as string) || "Unbekanntes Produkt",
        brand: p.brands as string | undefined,
        image_url: (p.image_small_url as string) || (p.image_url as string),
        scoreResult,
      };
    }
  );

  return {
    products,
    count: data.count || 0,
    page: data.page || 1,
  };
}

export default function LebensmittelPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("alle");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [serverBusy, setServerBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  async function handleSearch(e?: React.FormEvent, newPage = 1) {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearched(true);
    setServerBusy(false);
    setPage(newPage);

    try {
      const result = await searchProducts(query.trim(), category, newPage);
      if (newPage === 1) {
        setResults(result.products);
      } else {
        setResults((prev) => [...prev, ...result.products]);
      }
      setHasMore(result.products.length === 20);
      setTotalCount(result.count);
    } catch (err) {
      const isServerBusy =
        (err instanceof Error && err.message === "SERVER_BUSY") ||
        (err instanceof TypeError && err.message.includes("fetch"));
      if (isServerBusy) setServerBusy(true);
      if (newPage === 1) setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

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
    [isLoading, hasMore, page]
  );

  function handleReset() {
    setQuery("");
    setResults([]);
    setSearched(false);
    setPage(1);
    setHasMore(false);
    setTotalCount(0);
    setServerBusy(false);
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

        {/* Category Filters - Touch-friendly scrollable */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setCategory(cat.key);
                if (searched) handleSearch(undefined, 1);
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

      {/* Server Busy Banner */}
      {serverBusy && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <ServerCrash className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Server momentan überlastet</p>
            <p className="text-sm leading-relaxed">
              OpenFoodFacts ist gerade nicht erreichbar (503). Bitte versuche es in wenigen Sekunden erneut.
            </p>
          </div>
        </div>
      )}

      {/* Results Count */}
      {searched && !isLoading && totalCount > 0 && (
        <p className="mb-5 text-base text-muted-foreground">
          {totalCount.toLocaleString("de-DE")} Ergebnisse gefunden
        </p>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {results.map((product, index) => (
          <div
            key={product.barcode || index}
            ref={index === results.length - 1 ? lastProductRef : undefined}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Loading More */}
      {isLoading && page > 1 && (
        <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-base">Mehr wird geladen...</span>
        </div>
      )}

      {/* Empty State - Not searched yet */}
      {!searched && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-5 rounded-full bg-background-warm p-5">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-foreground">Lebensmittel suchen</h3>
          <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
            Gib einen Suchbegriff ein oder wähle eine Kategorie, um Produkte zu finden.
          </p>
        </div>
      )}

      {/* Empty State - No results */}
      {searched && !isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-5 rounded-full bg-background-warm p-5">
            <PackageX className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-foreground">Keine Ergebnisse gefunden</h3>
          <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
            Versuche einen anderen Suchbegriff oder eine andere Kategorie.
          </p>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 4.5) return "bg-score-sehr_gut";
  if (score >= 3.5) return "bg-score-gut";
  if (score >= 2.5) return "bg-score-neutral";
  if (score >= 1.5) return "bg-score-weniger_gut";
  return "bg-score-vermeiden";
}

function ProductCard({ product }: { product: SearchProduct }) {
  const scoreResult = product.scoreResult;
  const score = scoreResult?.score ?? 3.0;
  const label = scoreResult?.label ?? "NEUTRAL";

  return (
    <Link
      href={product.barcode ? `/result/${product.barcode}` : "#"}
      className="card-warm p-4 flex gap-4 transition-all hover:shadow-card active:scale-[0.99]"
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="h-20 w-20 shrink-0 rounded-xl object-contain bg-background-warm p-1.5"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-background-warm">
          <span className="text-3xl">🍽️</span>
        </div>
      )}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <p className="font-semibold text-lg truncate text-foreground">{product.name}</p>
        {product.brand && (
          <p className="text-base text-muted-foreground truncate mt-0.5">{product.brand}</p>
        )}
      </div>
      {scoreResult && (
        <div className="flex flex-col items-end justify-center gap-1.5">
          <div className={`h-10 w-10 rounded-full ${getScoreColor(score)} flex items-center justify-center text-white text-sm font-bold shadow-soft`}>
            {score.toFixed(1)}
          </div>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
      )}
    </Link>
  );
}
