"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Loader2, PackageX, ServerCrash } from "lucide-react";
import { calculateScore } from "@/core/services/scoring-service";
import type { Product } from "@/core/domain/product";
import type { ScoreResult } from "@/core/domain/score";
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

const SEARCH_URL = "/api/products/search";

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
    page_size: "20",
  });
  if (category && category !== "alle") {
    params.set("tag_0", category);
  }

  const response = await fetch(`${SEARCH_URL}?${params}`);

  if (response.status === 503) {
    throw new Error("SERVER_BUSY");
  }

  return response.json() as Promise<ApiSearchResponse>;
}

export default function LebensmittelPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("alle");
  const [results, setResults] = useState<Product[]>([]);
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
            key={product.barcode || index}
            ref={index === results.length - 1 ? lastProductRef : undefined}
          >
            <ProductCard product={product} />
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

function ProductCard({ product }: { product: Product }) {
  let scoreResult: ScoreResult | undefined;
  try {
    scoreResult = calculateScore(product);
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
