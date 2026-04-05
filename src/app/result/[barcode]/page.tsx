"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScoreCard } from "@/components/ScoreCard";
import type { Product } from "@/core/domain/product";
import type { ScoreResult } from "@/core/domain/score";
import { calculateScore } from "@/core/services/scoring-service";
import { ManageFavoritesUseCase } from "@/core/use-cases/manage-favorites";
import { LocalStorageFavoritesRepository } from "@/infrastructure/storage/local-storage-favorites";
import { AlertCircle, Loader2, PackageX } from "lucide-react";
import Link from "next/link";
import { useUserProfile } from "@/hooks/use-user-profile";

export default function ResultPage() {
  const params = useParams();
  const barcode = params.barcode as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { profile, isLoaded: profileLoaded } = useUserProfile();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${barcode}`);
      const data = await response.json().catch(() => ({})) as { success?: boolean; product?: Product; error?: { type?: string } };

      if (!response.ok || !data.success || !data.product) {
        const errType = data.error?.type ?? "unknown";
        setError(
          errType === "not_found"
            ? "Produkt nicht gefunden. Bitte überprüfe den Barcode."
            : errType === "invalid_barcode"
            ? "Ungültiger Barcode. Bitte gib eine 13-stellige EAN-Nummer ein."
            : "Fehler beim Laden. Bitte erneut versuchen."
        );
        setLoading(false);
        return;
      }

      const favUseCase = new ManageFavoritesUseCase(new LocalStorageFavoritesRepository());
      setProduct(data.product);
      setSaved(favUseCase.isSaved(barcode));
      setLoading(false);
    }

    load();
  }, [barcode]);

  // Recalculate score when profile loads
  useEffect(() => {
    if (product && profileLoaded) {
      setScoreResult(calculateScore(product, profile ?? undefined));
    }
  }, [product, profile, profileLoaded]);

  function handleRescan() {
    window.location.href = "/scanner";
  }

  function handleSave() {
    if (!product || !scoreResult) return;
    const favUseCase = new ManageFavoritesUseCase(new LocalStorageFavoritesRepository());
    if (saved) {
      favUseCase.remove(barcode);
      setSaved(false);
    } else {
      favUseCase.save(barcode, product, scoreResult);
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-5">
        <Loader2 className="h-14 w-14 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Produkt wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-5 py-8">
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-base">{error}</p>
        </div>
        <div className="card-warm p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="rounded-xl bg-background-warm p-4">
              <PackageX className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">
                Barcode: {barcode}
              </p>
              <p className="text-base text-muted-foreground">
                Dieses Produkt ist nicht in unserer Datenbank.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            href="/scanner"
            className="flex-1 rounded-xl bg-primary py-4 text-center font-semibold text-primary-foreground touch-target transition-all hover:bg-primary-600 active:scale-[0.98] shadow-soft"
          >
            Zurück zum Scanner
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !scoreResult) return null;

  return (
    <div className="min-h-screen px-5 py-8">
      <ScoreCard
        product={product}
        scoreResult={scoreResult}
        onRescan={handleRescan}
        onSave={handleSave}
        saved={saved}
        profile={profile ?? undefined}
      />
    </div>
  );
}
