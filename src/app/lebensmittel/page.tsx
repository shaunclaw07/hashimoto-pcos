"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Loader2, PackageX } from "lucide-react";
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

const SEARCH_URL = "https://de.openfoodfacts.org/cgi/search.pl";

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  async function handleSearch(e?: React.FormEvent, newPage = 1) {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearched(true);
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
    } catch {
      setResults([]);
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
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Lebensmittel</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen..."
            className="w-full rounded-lg border bg-background py-3 pl-10 pr-4"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setCategory(cat.key);
                if (searched) handleSearch(undefined, 1);
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="flex-1 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suche...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Suchen
              </>
            )}
          </button>
          {searched && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border px-4 py-3 font-medium hover:bg-accent"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </form>

      {/* Results Count */}
      {searched && !isLoading && totalCount > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {totalCount.toLocaleString("de-DE")} Ergebnisse gefunden
        </p>
      )}

      {/* Results List */}
      <div className="space-y-3">
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
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Mehr wird geladen...</span>
        </div>
      )}

      {/* Empty State - Not searched yet */}
      {!searched && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold">Lebensmittel suchen</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Gib einen Suchbegriff ein oder wähle eine Kategorie, um Produkte zu finden.
          </p>
        </div>
      )}

      {/* Empty State - No results */}
      {searched && !isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <PackageX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold">Keine Ergebnisse gefunden</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Versuche einen anderen Suchbegriff oder eine andere Kategorie.
          </p>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 4.5) return "bg-green-500";
  if (score >= 3.5) return "bg-lime-500";
  if (score >= 2.5) return "bg-yellow-500";
  if (score >= 1.5) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreEmoji(label: string): string {
  if (label === "SEHR GUT") return "🟢";
  if (label === "GUT") return "🟢";
  if (label === "NEUTRAL") return "🟡";
  if (label === "WENIGER GUT") return "🟠";
  return "🔴";
}

function ProductCard({ product }: { product: SearchProduct }) {
  const scoreResult = product.scoreResult;
  const score = scoreResult?.score ?? 3.0;
  const label = scoreResult?.label ?? "NEUTRAL";

  return (
    <Link
      href={product.barcode ? `/result/${product.barcode}` : "#"}
      className="block rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
    >
      <div className="flex gap-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-16 w-16 shrink-0 rounded-lg object-contain bg-white"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="font-semibold truncate">{product.name}</p>
          {product.brand && (
            <p className="text-sm text-muted-foreground truncate">{product.brand}</p>
          )}
        </div>
        {scoreResult && (
          <div className="flex flex-col items-end justify-center gap-1">
            <div className={`h-8 w-8 rounded-full ${getScoreColor(score)} flex items-center justify-center text-white text-xs font-bold`}>
              {score.toFixed(1)}
            </div>
            <span className="text-xs">{getScoreEmoji(label)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
