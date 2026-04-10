"use client";

import { useState, useRef, useEffect } from "react";
import { Star, RotateCcw, Save, Check, AlertTriangle, Info } from "lucide-react";
import type { Product } from "@/core/domain/product";
import type { ScoreResult, ScoreBreakdownItem } from "@/core/domain/score";
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
    color: "#22c55e",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    stars: 5,
    borderColor: "border-green-200",
  },
  GUT: {
    color: "#84cc16",
    bgColor: "bg-lime-50",
    textColor: "text-lime-700",
    stars: 4,
    borderColor: "border-lime-200",
  },
  NEUTRAL: {
    color: "#a16207",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    stars: 3,
    borderColor: "border-yellow-200",
  },
  "WENIGER GUT": {
    color: "#c2410c",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    stars: 2,
    borderColor: "border-orange-200",
  },
  VERMEIDEN: {
    color: "#ef4444",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    stars: 1,
    borderColor: "border-red-200",
  },
} as const;

function StarRating({ stars, color }: { stars: number; color: string }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-7 w-7 ${i < stars ? "fill-current" : "text-gray-300"}`}
          style={{ color: i < stars ? color : undefined }}
        />
      ))}
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
          <h2 className="font-bold text-xl leading-tight truncate text-foreground">
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
        className={`${config.bgColor} ${config.borderColor} border-t px-5 py-8 text-center`}
      >
        <StarRating stars={config.stars} color={config.color} />
        <div className="mt-3 flex items-center justify-center gap-3">
          <span
            className={`text-3xl font-bold ${config.textColor}`}
            style={{ color: config.color }}
          >
            {scoreResult.score.toFixed(1)}
          </span>
          <span className={`text-xl font-semibold ${config.textColor}`}>
            {scoreResult.label}
          </span>
        </div>
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
        <div className="grid grid-cols-2 gap-3 text-base">
          <NutrientRow label="Energie" value={n.energyKcal} unit="kcal" />
          <NutrientRow label="Fett" value={n.fat} unit="g" />
          <NutrientRow label="davon gesättigt" value={n.saturatedFat} unit="g" />
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
      <div className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="relative flex items-center gap-1">
          <span>Nicht angegeben</span>
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
          {showTooltip && (
            <span
              role="tooltip"
              className="pointer-events-none absolute right-0 bottom-full mb-1 z-10 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-card"
            >
              Diese Angabe fehlt in der Produktdatenbank
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-between">
      <span className="text-foreground">{label}</span>
      <span className="font-semibold text-foreground">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}
