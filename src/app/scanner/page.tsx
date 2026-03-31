"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScanBarcode, Camera, Keyboard, AlertCircle, Loader2 } from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [barcode, setBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending");
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkCamera() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoDevice = devices.some((d) => d.kind === "videoinput");
        setHasCamera(hasVideoDevice);

        if (hasVideoDevice) {
          setScanMode("camera");
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setCameraPermission("granted");
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch {
            setCameraPermission("denied");
            setScanMode("manual");
          }
        }
      } catch {
        setHasCamera(false);
        setScanMode("manual");
      }
    }
    checkCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function isValidEan13(code: string): boolean {
    return /^\d{13}$/.test(code);
  }

  async function handleSearch(targetBarcode: string) {
    if (!targetBarcode.trim()) return;
    if (!isValidEan13(targetBarcode)) {
      setError("Bitte gib einen gültigen 13-stelligen Barcode ein.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${targetBarcode}.json`);
      const data = await response.json();

      if (data.status === 0) {
        setError("Produkt nicht gefunden. Bitte überprüfe den Barcode.");
      } else {
        router.push(`/result/${targetBarcode}`);
        return;
      }
    } catch {
      setError("Fehler bei der Suche. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch(barcode);
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Scanner</h1>

      {/* Mode Toggle */}
      <div className="mb-6 flex gap-2 rounded-lg bg-muted p-1">
        <button
          onClick={() => setScanMode("camera")}
          disabled={!hasCamera}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            scanMode === "camera"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          } ${!hasCamera ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Camera className="h-4 w-4" />
          Kamera
        </button>
        <button
          onClick={() => setScanMode("manual")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            scanMode === "manual"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Keyboard className="h-4 w-4" />
          Manuell
        </button>
      </div>

      {/* Camera View */}
      {scanMode === "camera" && (
        <div className="mb-6">
          {cameraPermission === "denied" && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen
                oder nutze die manuelle Eingabe.
              </p>
            </div>
          )}

          <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-64 rounded-lg border-2 border-primary bg-primary/5" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white">
              Barcode in den Rahmen halten
            </div>
          </div>

          {/* Manual fallback in camera mode */}
          <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))}
              placeholder="Alternativ: Barcode hier eingeben"
              className="w-full rounded-lg border bg-background px-4 py-3 text-lg tracking-wider"
              maxLength={13}
            />
            <button
              type="submit"
              disabled={!barcode.trim() || isLoading}
              className="w-full rounded-lg bg-primary py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Suche...
                </>
              ) : (
                <>
                  <ScanBarcode className="h-5 w-5" />
                  Produkt suchen
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Manual Input */}
      {scanMode === "manual" && (
        <form onSubmit={handleManualSubmit} className="mb-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Barcode eingeben
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))}
              placeholder="z.B. 7622210449283"
              className="w-full rounded-lg border bg-background px-4 py-3 text-lg tracking-wider"
              maxLength={13}
            />
          </div>

          <button
            type="submit"
            disabled={!barcode.trim() || isLoading}
            className="w-full rounded-lg bg-primary py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Suche...
              </>
            ) : (
              <>
                <ScanBarcode className="h-5 w-5" />
                Produkt suchen
              </>
            )}
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border bg-card p-4 text-card-foreground">
        <h3 className="mb-2 font-semibold">So scannst du Produkte</h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              1
            </span>
            Halte den Barcode vor die Kamera oder gib die Nummer manuell ein
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              2
            </span>
            Wir suchen das Produkt in unserer Datenbank
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              3
            </span>
            Erhalte sofort die Bewertung für Hashimoto & PCOS
          </li>
        </ol>
      </div>
    </div>
  );
}
