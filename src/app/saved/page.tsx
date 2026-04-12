"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { Bookmark, Trash2, ArrowRight, BookmarkX, ScanBarcode, Search } from "lucide-react";
import { ManageFavoritesUseCase } from "@/core/use-cases/manage-favorites";
import { LocalStorageFavoritesRepository } from "@/infrastructure/storage/local-storage-favorites";
import type { SavedProduct } from "@/core/ports/favorites-repository";
import { useUserProfile } from "@/hooks/use-user-profile";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { triggerHaptic, HAPTIC_PATTERNS } from "@/core/services/haptic-service";

const repo = new LocalStorageFavoritesRepository();
const useCase = new ManageFavoritesUseCase(repo);

function getScoreColorClass(label: string): string {
  switch (label) {
    case "SEHR GUT":
      return "bg-score-very-good";
    case "GUT":
      return "bg-score-good";
    case "NEUTRAL":
      return "bg-score-neutral";
    case "WENIGER GUT":
      return "bg-score-fair";
    case "VERMEIDEN":
      return "bg-score-avoid";
    default:
      return "bg-muted";
  }
}

function getScoreLabelStyle(label: string): { backgroundColor?: string; color?: string } {
  switch (label) {
    case "SEHR GUT":
      return { backgroundColor: "var(--color-score-very-good-bg)", color: "var(--color-score-very-good-text)" };
    case "GUT":
      return { backgroundColor: "var(--color-score-good-bg)", color: "var(--color-score-good-text)" };
    case "NEUTRAL":
      return { backgroundColor: "var(--color-score-neutral-bg)", color: "var(--color-score-neutral-text)" };
    case "WENIGER GUT":
      return { backgroundColor: "var(--color-score-fair-bg)", color: "var(--color-score-fair-text)" };
    case "VERMEIDEN":
      return { backgroundColor: "var(--color-score-avoid-bg)", color: "var(--color-score-avoid-text)" };
    default:
      return {};
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Heute";
  }
  if (diffDays === 1) {
    return "Gestern";
  }
  if (diffDays < 7) {
    return `vor ${diffDays} Tagen`;
  }

  // German date format: "12. Apr."
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

type SortOption = "newest" | "oldest" | "best" | "worst";

export default function SavedProductsPage() {
  const { isLoaded } = useUserProfile();
  const { toast, show, dismiss, handleAction } = useToast();
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    setIsClient(true);
    setSavedProducts(useCase.getAll());
  }, []);

  const sortedProducts = useMemo(() => {
    const products = [...savedProducts];
    switch (sortBy) {
      case "newest":
        return products.sort((a, b) => b.savedAt - a.savedAt);
      case "oldest":
        return products.sort((a, b) => a.savedAt - b.savedAt);
      case "best":
        return products.sort((a, b) => b.score.score - a.score.score);
      case "worst":
        return products.sort((a, b) => a.score.score - b.score.score);
      default:
        return products;
    }
  }, [savedProducts, sortBy]);

  const handleRemove = useCallback((barcode: string, savedProduct: SavedProduct) => {
    // Remove from storage
    useCase.remove(barcode);
    setSavedProducts(useCase.getAll());

    // Haptic feedback
    triggerHaptic(HAPTIC_PATTERNS.LONG_PRESS);

    // Show undo toast
    show({
      message: `"${savedProduct.product.name || "Produkt"}" entfernt`,
      actionLabel: "Rückgängig",
      type: "info",
      duration: 5000,
      onAction: () => {
        // Restore the product
        useCase.save(barcode, savedProduct.product, savedProduct.score);
        setSavedProducts(useCase.getAll());
        triggerHaptic(HAPTIC_PATTERNS.TAP);
      },
    });
  }, [show]);

  // Prevent hydration mismatch
  if (!isClient || !isLoaded) {
    return (
      <div className="min-h-screen px-5 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Gespeicherte Produkte</h1>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const hasProducts = savedProducts.length > 0;

  return (
    <div className="min-h-screen px-5 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Gespeicherte Produkte</h1>

      {hasProducts && (
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="sort-select" className="text-sm text-muted-foreground">
            Sortieren:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="best">Beste Bewertung</option>
            <option value="worst">Schlechteste Bewertung</option>
          </select>
        </div>
      )}

      {hasProducts ? (
        <div className="space-y-4">
          {sortedProducts.map((savedProduct) => {
            const { product, score, savedAt } = savedProduct;
            const barcode = product.barcode;

            return (
              <div
                key={barcode}
                className="card-warm p-4 transition-all hover:shadow-card"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link
                    href={`/result/${barcode}`}
                    className="shrink-0"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name || "Produkt"}
                        className="h-20 w-20 rounded-xl object-contain bg-background-warm p-1.5 transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-background-warm">
                        <span className="text-3xl" role="img" aria-label="Produktbild nicht verfügbar">
                          🍽️
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <Link
                      href={`/result/${barcode}`}
                      className="group"
                    >
                      <h3 className="font-semibold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                        {product.name || "Unbekanntes Produkt"}
                      </h3>
                      {product.brand && (
                        <p className="text-base text-muted-foreground truncate mt-0.5">
                          {product.brand}
                        </p>
                      )}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Gespeichert: {formatDate(savedAt)}
                    </p>
                  </div>

                  {/* Score Badge */}
                  <div className="flex flex-col items-end justify-center gap-2">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-soft",
                        getScoreColorClass(score.label)
                      )}
                      title={score.label}
                    >
                      {score.score.toFixed(1)}
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={getScoreLabelStyle(score.label)}
                    >
                      {score.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/result/${barcode}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-600 active:scale-[0.98] transition-all touch-target"
                  >
                    Details ansehen
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleRemove(barcode, savedProduct)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all touch-target"
                    aria-label={`"${product.name || "Produkt"}" entfernen`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Entfernen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <BookmarkX className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            Noch keine Produkte gespeichert
          </h2>
          <p className="mb-8 max-w-xs text-base text-muted-foreground leading-relaxed">
            Speichere Produkte, die dir gefallen, und finde sie hier wieder – perfekt für den nächsten Einkauf.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link
              href="/scanner"
              className="flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground hover:bg-primary-600 active:scale-[0.98] transition-all shadow-soft touch-target"
            >
              <ScanBarcode className="h-5 w-5" />
              Jetzt scannen
            </Link>
            <Link
              href="/products"
              className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-6 py-4 text-base font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all touch-target"
            >
              <Search className="h-5 w-5" />
              Produkte suchen
            </Link>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      <Toast toast={toast} onDismiss={dismiss} onAction={handleAction} />
    </div>
  );
}
