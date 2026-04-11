"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Save, Check, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/core/domain/product";
import type { ScoreResult, ScoreBreakdownItem, ScoreLabel } from "@/core/domain/score";
import type { UserProfile, Condition } from "@/core/domain/user-profile";
import { getExplanation } from "@/core/domain/explanations";
import { ExplanationSheet } from "./ExplanationSheet";

interface ScoreCardProps {
  product: Product;
  scoreResult: ScoreResult;
  onRescan: () => void;
  onSave?: () => void;
  saved?: boolean;
  profile?: UserProfile;
}

const CONDITION_ICON: Record<Condition, string> = {
  hashimoto: "🦋",
  pcos: "🔵",
  both: "🦋🔵",
};

const CONDITION_LABEL: Record<Condition, string> = {
  hashimoto: "Hashimoto-Thyreoiditis",
  pcos: "PCOS",
  both: "Hashimoto-Thyreoiditis und PCOS",
};

export const SCORE_CONFIG = {
  "SEHR GUT": {
    color: "var(--color-score-very-good)",
    bgColor: "bg-[var(--color-score-very-good-bg)]",
    textColor: "text-[var(--color-score-very-good-text)]",
    borderColor: "border-[var(--color-score-very-good)]/20",
    description: "Sehr gut für Ihren Ernährungsplan",
  },
  GUT: {
    color: "var(--color-score-good)",
    bgColor: "bg-[var(--color-score-good-bg)]",
    textColor: "text-[var(--color-score-good-text)]",
    borderColor: "border-[var(--color-score-good)]/20",
    description: "Gut geeignet für Sie",
  },
  NEUTRAL: {
    color: "var(--color-score-neutral)",
    bgColor: "bg-[var(--color-score-neutral-bg)]",
    textColor: "text-[var(--color-score-neutral-text)]",
    borderColor: "border-[var(--color-score-neutral)]/20",
    description: "In Maßen geeignet",
  },
  "WENIGER GUT": {
    color: "var(--color-score-fair)",
    bgColor: "bg-[var(--color-score-fair-bg)]",
    textColor: "text-[var(--color-score-fair-text)]",
    borderColor: "border-[var(--color-score-fair)]/20",
    description: "Nur selten empfohlen",
  },
  VERMEIDEN: {
    color: "var(--color-score-avoid)",
    bgColor: "bg-[var(--color-score-avoid-bg)]",
    textColor: "text-[var(--color-score-avoid-text)]",
    borderColor: "border-[var(--color-score-avoid)]/20",
    description: "Bitte meiden",
  },
} as const;

const SCORE_LEVELS: ScoreLabel[] = [
  "VERMEIDEN", "WENIGER GUT", "NEUTRAL", "GUT", "SEHR GUT"
];

const SCORE_SHORT_LABELS: Record<ScoreLabel, string> = {
  "SEHR GUT":    "Sehr gut",
  "GUT":         "Gut",
  "NEUTRAL":     "Neutral",
  "WENIGER GUT": "W. gut",
  "VERMEIDEN":   "Meiden",
};

function ScoreScale({ label, color }: { label: ScoreLabel; color: string }) {
  const activeIndex = SCORE_LEVELS.indexOf(label);
  return (
    <div
      className="w-full py-2"
      role="img"
      aria-label={`Bewertungsskala: ${label}`}
    >
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute inset-x-0 top-[9px] h-px bg-border" />
        {SCORE_LEVELS.map((level, i) => (
          <div key={level} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={cn(
                "rounded-full transition-all duration-200",
                i === activeIndex
                  ? "h-[18px] w-[18px] ring-2 ring-white dark:ring-card shadow-soft"
                  : "h-3 w-3 border border-muted-foreground/30 bg-transparent"
              )}
              style={i === activeIndex ? { backgroundColor: color } : undefined}
            />
            <span
              className={cn(
                "text-[10px] leading-tight text-center",
                i === activeIndex ? "font-semibold" : "text-muted-foreground"
              )}
              style={i === activeIndex ? { color } : undefined}
            >
              {SCORE_SHORT_LABELS[level]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreCard({
  product,
  scoreResult,
  onRescan,
  onSave,
  saved,
  profile,
}: ScoreCardProps) {
  const config = SCORE_CONFIG[scoreResult.label];
  if (!config) throw new Error(`Unknown score label: ${scoreResult.label}`);
  const [activeItem, setActiveItem] = useState<ScoreBreakdownItem | null>(null);
  const n = product.nutriments;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Product Header */}
      <div className="flex gap-4 p-5">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name || "Produkt"}
            className="h-28 w-28 shrink-0 rounded-xl object-contain bg-background-warm p-2"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-background-warm">
            <span className="text-5xl">🍽️</span>
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h2 className="font-bold text-xl leading-tight line-clamp-2 text-foreground">
            {product.name || "Unbekanntes Produkt"}
          </h2>
          {product.brand && (
            <p className="text-base text-muted-foreground truncate mt-1">
              {product.brand}
            </p>
          )}
        </div>
      </div>

      {/* Score Badge */}
      <div
        className={`${config.bgColor} ${config.borderColor} border-t px-5 py-6 text-center`}
      >
        <span
          className={`text-2xl font-bold ${config.textColor}`}
          style={{ color: config.color }}
        >
          {scoreResult.label}
        </span>
        {config.description && (
          <p className={`mt-1 text-sm opacity-80 ${config.textColor}`}>
            {config.description}
          </p>
        )}
        <div className="mt-4 px-2">
          <ScoreScale label={scoreResult.label} color={config.color} />
        </div>
        <Link
          href="/education"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          <Info className="h-4 w-4" />
          Warum diese Bewertung?
        </Link>
      </div>

      {/* Bonus/Malus Breakdown */}
      {scoreResult.breakdown.length > 0 && (
        <div className="border-t border-border px-5 py-5">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            Bewertungsgründe
            {profile && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Angepasst für: {profile.condition === "hashimoto" ? "Hashimoto" : profile.condition === "pcos" ? "PCOS" : "Hashimoto + PCOS"}
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {scoreResult.breakdown.map((item, i) => {
              const hasExplanation = getExplanation(item.reason) !== null;
              return (
                <div key={i} className="flex items-center gap-3 text-base">
                  <span
                    className={item.points >= 0 ? "text-green-600" : "text-red-500"}
                  >
                    {item.points >= 0 ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </span>
                  <span className="flex-1 text-foreground">
                    {item.condition && (
                      <span
                        className="mr-1"
                        role="img"
                        aria-label={CONDITION_LABEL[item.condition]}
                      >
                        {CONDITION_ICON[item.condition]}
                      </span>
                    )}
                    {item.reason}
                  </span>
                  <span
                    className={`font-semibold ${
                      item.points >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {item.points >= 0 ? "+" : ""}
                    {item.points.toFixed(1)}
                  </span>
                  {hasExplanation && (
                    <button
                      onClick={() => setActiveItem(item)}
                      className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-primary transition-colors touch-target"
                      aria-label={`Erklärung zu ${item.reason}`}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nutritional Info */}
      <div className="border-t border-border px-5 py-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          Nährwerte (pro 100g)
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <NutrientRow label="Energie" value={n.energyKcal} unit="kcal" />
          <NutrientRow label="Fett" value={n.fat} unit="g" />
          <NutrientRow label="Ges. Fettsäuren" value={n.saturatedFat} unit="g" />
          <NutrientRow label="Zucker" value={n.sugars} unit="g" />
          <NutrientRow label="Ballaststoffe" value={n.fiber} unit="g" />
          <NutrientRow label="Protein" value={n.protein} unit="g" />
          <NutrientRow label="Salz" value={n.salt} unit="g" />
        </div>
      </div>

      {/* Ingredients List */}
      <div className="border-t border-border px-5 py-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          Zutaten
        </h3>
        {product.ingredientsList && product.ingredientsList.length > 0 ? (
          <>
            <p className="text-base text-foreground leading-relaxed">
              {product.ingredientsList.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(", ")}
            </p>
            <div className="flex items-start gap-2 mt-3 rounded-lg bg-muted/50 px-4 py-3">
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Es ist nicht gewährleistet, dass die Liste der Zutaten vollständig ist. Bitte prüfen Sie im Zweifelsfall selber nochmal das Produkt.
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-4 py-3">
            <Info className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-base text-muted-foreground leading-relaxed">
              Es sind keine Zutaten zu dem Produkt gespeichert! Dadurch können bestimmte Inhaltsstoffe nicht in die Bewertung einfließen.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 border-t border-border p-5">
        <button
          onClick={onRescan}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-5 py-4 text-base font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] touch-target"
        >
          <RotateCcw className="h-5 w-5" />
          Erneut scannen
        </button>
        {onSave && (
          <button
            onClick={onSave}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-5 py-4 text-base font-medium transition-all touch-target ${
              saved
                ? "bg-green-100 border border-green-200 text-green-700 cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary-600 active:scale-[0.98]"
            }`}
          >
            <Save className="h-5 w-5" />
            {saved ? "Gespeichert" : "Speichern"}
          </button>
        )}
      </div>

      {/* Explanation Bottom Sheet */}
      {activeItem && (() => {
        const explanation = getExplanation(activeItem.reason, profile?.condition);
        return explanation ? (
          <ExplanationSheet
            explanation={explanation}
            condition={profile?.condition}
            onClose={() => setActiveItem(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

function NutrientRow({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTooltip(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showTooltip]);

  if (value === undefined || value === null) {
    return (
      <div className="relative flex flex-col gap-1 rounded-xl bg-muted/40 px-3 py-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground leading-tight">
          {label}
          <button
            ref={buttonRef}
            type="button"
            aria-label="Warum fehlt dieser Wert?"
            aria-expanded={showTooltip}
            onClick={() => setShowTooltip((v) => !v)}
            className="rounded-full p-0.5 hover:bg-muted transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </span>
        <span className="text-sm font-semibold text-foreground">Nicht angegeben</span>
        {showTooltip && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 z-10 mt-1 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-card"
          >
            Diese Angabe fehlt in der Produktdatenbank
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3 py-3">
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
      <span className="text-base font-semibold text-foreground">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}
