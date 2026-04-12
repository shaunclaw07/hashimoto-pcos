"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";
import { CameraOff, SwitchCamera, Loader2 } from "lucide-react";
import { triggerHaptic, HAPTIC_PATTERNS } from "@/core/services/haptic-service";

interface ScannerProps {
  onDetected: (barcode: string) => void;
  onError?: (error: string) => void;
  notFound?: boolean;
}

type CameraFacing = "environment" | "user";

// Lazy initialization function to avoid module-level side effects
function createHints() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
  ]);
  return hints;
}

export function Scanner({ onDetected, onError, notFound }: ScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

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
      triggerHaptic(HAPTIC_PATTERNS.TAP);
      onDetected(code);
    },
    [onDetected]
  );

  // Initialize ZXing scanner
  useEffect(() => {
    if (!containerRef.current) return;

    const initScanner = async () => {
      try {
        // Clean up any existing video element
        if (videoElementRef.current) {
          videoElementRef.current.remove();
          videoElementRef.current = null;
        }

        // Create a new video element dynamically
        const video = document.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.playsInline = true;
        video.muted = true;
        video.autoplay = true;
        containerRef.current?.appendChild(video);
        videoElementRef.current = video;

        // Create reader if not exists
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserMultiFormatReader(createHints(), 50);
        }

        const codeReader = codeReaderRef.current;

        // Get available video devices
        const videoDevices = await codeReader.listVideoInputDevices();
        setDevices(videoDevices);

        if (videoDevices.length === 0) {
          setError("Keine Kamera gefunden. Bitte nutze die manuelle Eingabe.");
          setHasPermission("denied");
          onError?.("no_camera");
          return;
        }

        // Find camera by facing mode preference
        let selectedDeviceId: string | undefined;

        if (cameraFacing === "environment") {
          // Try to find back camera
          const backCamera = videoDevices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment")
          );
          selectedDeviceId = backCamera?.deviceId ?? videoDevices[0]?.deviceId;
        } else {
          // Try to find front camera
          const frontCamera = videoDevices.find(
            (d) =>
              d.label.toLowerCase().includes("front") ||
              d.label.toLowerCase().includes("user") ||
              d.label.toLowerCase().includes("selfie")
          );
          selectedDeviceId = frontCamera?.deviceId ?? videoDevices[0]?.deviceId;
        }

        // Wait a moment for video element to be in DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        // Configure high-quality video constraints
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: cameraFacing,
          },
        };

        // Start decoding with custom constraints for better quality
        await codeReader.decodeFromConstraints(
          constraints,
          video,
          (result, error) => {
            if (error) {
              // NotFoundException is expected when no barcode is in view
              return;
            }
            if (result) {
              const code = result.getText();
              // Validate EAN-13/UPC format
              if (/^\d{8,13}$/.test(code)) {
                handleDetected(code);
              }
            }
          }
        );

        setHasPermission("granted");
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        if (errorMsg.includes("Permission") || errorMsg.includes("NotAllowed")) {
          setHasPermission("denied");
          setError("Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.");
          onError?.("permission_denied");
        } else if (errorMsg.includes("NotFound") || errorMsg.includes("no camera")) {
          setError("Keine Kamera gefunden. Bitte nutze die manuelle Eingabe.");
          setHasPermission("denied");
          onError?.("no_camera");
        } else {
          setError(`Scanner-Fehler: ${errorMsg}`);
          onError?.(errorMsg);
        }
      }
    };

    initScanner();

    // Cleanup function
    return () => {
      // Stop the continuous decode loop and reset the reader
      if (codeReaderRef.current) {
        codeReaderRef.current.stopContinuousDecode();
        codeReaderRef.current.reset();
      }
      // Remove video element
      if (videoElementRef.current) {
        videoElementRef.current.remove();
        videoElementRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [cameraFacing, handleDetected, onError]);

  return (
    <div className="relative">
      {/* Permission denied state */}
      {hasPermission === "denied" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background-warm text-foreground">
          <CameraOff className="h-14 w-14 text-muted-foreground" />
          <p className="text-center px-6 text-base">{error || "Kamera-Zugriff verweigert"}</p>
          {devices.length > 1 && (
            <button
              onClick={() => setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:bg-primary-600 active:scale-95 transition-all touch-target"
            >
              <SwitchCamera className="h-5 w-5" />
              Kamera wechseln
            </button>
          )}
        </div>
      )}

      {/* Scanner viewport */}
      <div
        ref={containerRef}
        className="scanner-viewport relative aspect-square overflow-hidden rounded-2xl bg-background-warm shadow-card"
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
              {/* Scanning line animation - smooth sweep from top to bottom */}
              <div className="scan-line" />
            </div>
          </div>
        )}

        {/* Not-found overlay - shown when product is not in database */}
        {notFound && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/90 backdrop-blur-sm animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <span className="text-3xl" role="img" aria-label="Fehler: Produkt nicht gefunden">❌</span>
            </div>
            <p className="text-center px-6 text-base font-medium text-foreground">
              Produkt nicht gefunden
            </p>
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
          {devices.length > 1 && (
            <button
              onClick={() => setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))}
              className="rounded-full bg-background/80 backdrop-blur p-3 text-foreground hover:bg-background active:scale-95 transition-all shadow-soft touch-target"
              title="Kamera wechseln"
              aria-label="Kamera wechseln"
            >
              <SwitchCamera className="h-6 w-6" />
            </button>
          )}
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
