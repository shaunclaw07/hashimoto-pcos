"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import { Camera, CameraOff, SwitchCamera, Loader2 } from "lucide-react";

interface ScannerProps {
  onDetected: (barcode: string) => void;
  onError?: (error: string) => void;
}

type CameraFacing = "environment" | "user";

export function Scanner({ onDetected, onError }: ScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [error, setError] = useState<string | null>(null);
  const lastDetectedRef = useRef<string | null>(null);
  const lastDetectedTimeRef = useRef<number>(0);

  // Debounce: ignore same barcode within 3 seconds
  const handleDetected = useCallback(
    (code: string) => {
      const now = Date.now();
      if (code === lastDetectedRef.current && now - lastDetectedTimeRef.current < 3000) {
        return;
      }
      lastDetectedRef.current = code;
      lastDetectedTimeRef.current = now;
      onDetected(code);
    },
    [onDetected]
  );

  useEffect(() => {
    if (!scannerRef.current) return;

    setError(null);

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: cameraFacing,
            aspectRatio: { min: 1, max: 2 },
          },
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
      },
      (err) => {
        if (err) {
          if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
            setHasPermission("denied");
            setError("Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.");
          } else if (err.name === "NotFoundError") {
            setError("Keine Kamera gefunden. Bitte nutze die manuelle Eingabe.");
          } else {
            setError(`Scanner-Fehler: ${err.message}`);
          }
          onError?.(err.message);
          return;
        }

        setHasPermission("granted");
        setIsInitialized(true);
        Quagga.start();
      }
    );

    Quagga.onDetected((result) => {
      if (!result?.codeResult?.code) return;
      const code = result.codeResult.code;
      // Validate EAN-13/UPC format
      if (/^\d{8,13}$/.test(code)) {
        handleDetected(code);
      }
    });

    return () => {
      if (isInitialized) {
        Quagga.stop();
        setIsInitialized(false);
      }
    };
  }, [cameraFacing, handleDetected, onError]);

  // Update camera when facing changes
  useEffect(() => {
    if (!isInitialized || !scannerRef.current) return;

    setIsInitialized(false);
    Quagga.stop();

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: cameraFacing,
            aspectRatio: { min: 1, max: 2 },
          },
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
      },
      (err) => {
        if (!err) {
          setIsInitialized(true);
          Quagga.start();
        }
      }
    );
  }, [cameraFacing, isInitialized]);

  return (
    <div className="relative">
      {/* Permission denied state */}
      {hasPermission === "denied" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background-warm text-foreground">
          <CameraOff className="h-14 w-14 text-muted-foreground" />
          <p className="text-center px-6 text-base">{error || "Kamera-Zugriff verweigert"}</p>
          <button
            onClick={() => setCameraFacing((f) => (f === "environment" ? "user" : "environment"))}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:bg-primary-600 active:scale-95 transition-all touch-target"
          >
            <SwitchCamera className="h-5 w-5" />
            Kamera wechseln
          </button>
        </div>
      )}

      {/* Scanner viewport */}
      <div
        ref={scannerRef}
        className="relative aspect-square overflow-hidden rounded-2xl bg-background-warm shadow-card"
      >
        {/* Scan overlay */}
        {hasPermission === "granted" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative">
              {/* Corner brackets - warm lavender color */}
              <div className="absolute -top-2 -left-2 h-10 w-10 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute -top-2 -right-2 h-10 w-10 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute -bottom-2 -left-2 h-10 w-10 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute -bottom-2 -right-2 h-10 w-10 border-b-4 border-r-4 border-primary rounded-br-xl" />
              <div className="h-52 w-72 rounded-2xl border-2 border-primary/30 bg-primary/5" />
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/60 animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading state */}
        {hasPermission === "pending" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background-warm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-base text-muted-foreground">Kamera wird gestartet...</p>
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      {hasPermission === "granted" && (
        <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-between px-4">
          <span className="rounded-full bg-background/80 backdrop-blur px-4 py-2 text-sm text-foreground font-medium">
            EAN-13, UPC-A
          </span>
          <button
            onClick={() =>
              setCameraFacing((f) => (f === "environment" ? "user" : "environment"))
            }
            className="rounded-full bg-background/80 backdrop-blur p-3 text-foreground hover:bg-background active:scale-95 transition-all shadow-soft touch-target"
            title="Kamera wechseln"
            aria-label="Kamera wechseln"
          >
            <SwitchCamera className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Hint text */}
      {hasPermission === "granted" && (
        <p className="mt-4 text-center text-base text-muted-foreground">
          Barcode in den Rahmen halten
        </p>
      )}
    </div>
  );
}
