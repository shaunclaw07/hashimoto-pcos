"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Explanation } from "@/core/domain/explanations";
import type { Condition } from "@/core/domain/user-profile";

interface ExplanationSheetProps {
  explanation: Explanation;
  condition?: Condition;
  onClose: () => void;
}

const CONDITION_LABEL: Record<Condition, string> = {
  hashimoto: "🦋 Hashimoto",
  pcos: "🔵 PCOS",
  both: "🦋🔵 Hashimoto + PCOS",
};

export function ExplanationSheet({ explanation, condition, onClose }: ExplanationSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Swipe-down-to-dismiss
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentY.current = e.touches[0].clientY;
    const delta = touchCurrentY.current - touchStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }

  function handleTouchEnd() {
    const delta = touchCurrentY.current - touchStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.3s ease";
      sheetRef.current.style.transform = "";
    }
    if (delta > 100) {
      onClose();
    }
  }

  const isConditionSpecific = condition && explanation.conditionOverrides?.[condition];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="explanation-title"
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg rounded-t-2xl bg-card px-5 pb-8 pt-4 shadow-xl"
        style={{ transition: "transform 0.3s ease" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />

        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="explanation-title"
            className="text-lg font-semibold leading-snug text-foreground"
          >
            {explanation.title}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Erklärung schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Condition badge */}
        {isConditionSpecific && (
          <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Speziell für: {CONDITION_LABEL[condition]}
          </div>
        )}

        {/* Explanation text */}
        <p className="text-base leading-relaxed text-foreground">
          {explanation.text}
        </p>

        {/* Sources */}
        <div className="mt-5 rounded-xl bg-muted px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">📚 Quellen</p>
          {explanation.sources && explanation.sources.length > 0 ? (
            <ul className="space-y-1">
              {explanation.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Basierend auf aktueller ernährungsmedizinischer Forschung zu Hashimoto-Thyreoiditis und PCOS.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
