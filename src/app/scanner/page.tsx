"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@/components/Scanner";
import { LoadingOverlay } from "@/components/loading-overlay";
import { Camera, Keyboard, AlertCircle, Loader2 } from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const [barcode, setBarcode] = useState("");
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [showNotFoundOverlay, setShowNotFoundOverlay] = useState(false);

  // Auto-dismiss not-found overlay after 2.5 seconds
  useEffect(() => {
    if (!showNotFoundOverlay) return;
    const timeout = setTimeout(() => {
      setShowNotFoundOverlay(false);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [showNotFoundOverlay]);

  function isValidEan13(code: string): boolean {
    return /^\d{8,13}$/.test(code);
  }

  async function handleBarcodeDetected(code: string) {
    if (isLoading) return;
    setIsLoading(true);
    setDetectedBarcode(code);
    setError(null);

    try {
      const response = await fetch(`/api/products/${code}`);
      const result: { success: boolean; error?: { type: string } } = await response.json();

      if (!result.success) {
        const errType = result.error?.type ?? "unknown";
        const isNotFound = errType === "not_found";
        setError(
          isNotFound
            ? "Produkt nicht gefunden. Bitte überprüfe den Barcode."
            : errType === "invalid_barcode"
            ? "Ungültiger Barcode. Bitte gib eine gültige EAN-Nummer ein."
            : "Fehler bei der Suche. Bitte erneut versuchen."
        );
        setDetectedBarcode(null);
        if (isNotFound && scanMode === "camera") {
          setShowNotFoundOverlay(true);
        }
      } else {
        router.push(`/result/${code}`);
        return;
      }
    } catch {
      setError("Fehler bei der Suche. Bitte erneut versuchen.");
      setDetectedBarcode(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    if (!isValidEan13(barcode)) {
      setError("Bitte gib einen gültigen Barcode ein (8-13 Ziffern).");
      return;
    }
    handleBarcodeDetected(barcode);
  }

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Loading overlay - blocks camera during product lookup */}
      <LoadingOverlay
        isVisible={isLoading}
        barcode={detectedBarcode ?? undefined}
        message="Produkt wird geladen..."
      />

      <h1 className="mb-8 text-3xl font-bold text-foreground">Scanner</h1>

      {/* Mode Toggle */}
      <div className="mb-8 flex gap-2 rounded-xl bg-background-warm p-1.5">
        <button
          onClick={() => setScanMode("camera")}
          className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-base font-medium transition-all touch-target ${
            scanMode === "camera"
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="h-5 w-5" />
          Kamera
        </button>
        <button
          onClick={() => setScanMode("manual")}
          className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-base font-medium transition-all touch-target ${
            scanMode === "manual"
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Keyboard className="h-5 w-5" />
          Manuell
        </button>
      </div>

      {/* Camera View with Scanner */}
      {scanMode === "camera" && (
        <div className="mb-8 space-y-5">
          <Scanner
            onDetected={handleBarcodeDetected}
            onError={(err) => setScannerError(err)}
            notFound={showNotFoundOverlay}
          />

          {scannerError && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-base animate-fade-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {scannerError}
            </div>
          )}

          {/* Inline error for not-found in camera mode */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-base animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-lg" role="img" aria-label="Fehler: Produkt nicht gefunden">❌</span>
              </div>
              <p className="text-base">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Manual Input */}
      {scanMode === "manual" && (
        <div className="mb-8 space-y-5">
          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div>
              <label className="mb-3 block text-base font-medium text-foreground">
                Barcode eingeben
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => { setBarcode(e.target.value.replace(/\D/g, "")); setError(null); }}
                placeholder="z.B. 7622210449283"
                className="w-full rounded-xl border border-border bg-background px-5 py-4 text-lg tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                maxLength={13}
              />
            </div>

            <button
              type="submit"
              disabled={!barcode.trim() || isLoading}
              className="w-full rounded-xl bg-primary py-4.5 text-lg font-semibold text-primary-foreground hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2.5 touch-target transition-all shadow-soft hover:shadow-card active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Suche...
                </>
              ) : (
                "Produkt suchen"
              )}
            </button>
          </form>

          {/* Inline error for manual mode - right below the input */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 animate-fade-in">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-xl" role="img" aria-label="Fehler: Produkt nicht gefunden">❌</span>
              </div>
              <p className="text-base font-medium">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="card-warm p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">So scannst du Produkte</h3>
        <ol className="space-y-4 text-base text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              1
            </span>
            Halte den Barcode vor die Kamera oder gib die Nummer manuell ein
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              2
            </span>
            Wir suchen das Produkt in unserer Datenbank
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              3
            </span>
            Erhalte sofort die Bewertung für Hashimoto & PCOS
          </li>
        </ol>
      </div>
    </div>
  );
}
