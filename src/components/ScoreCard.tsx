"use client";

import { Star, RotateCcw, Save, Check, AlertTriangle } from "lucide-react";
import type { OpenFoodFactsProduct } from "@/lib/openfoodfacts";
import type { ScoreResult } from "@/lib/scoring";

interface ScoreCardProps {
  product: OpenFoodFactsProduct;
  scoreResult: ScoreResult;
  onRescan: () => void;
  onSave?: () => void;
  saved?: boolean;
}

const SCORE_CONFIG = {
  "SEHR GUT": { color: "#22c55e", bgColor: "bg-green-100", textColor: "text-green-800", stars: 5 },
  "GUT": { color: "#84cc16", bgColor: "bg-lime-100", textColor: "text-lime-800", stars: 4 },
  "NEUTRAL": { color: "#eab308", bgColor: "bg-yellow-100", textColor: "text-yellow-800", stars: 3 },
  "WENIGER GUT": { color: "#f97316", bgColor: "bg-orange-100", textColor: "text-orange-800", stars: 2 },
  "VERMEIDEN": { color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-800", stars: 1 },
} as const;

function StarRating({ stars, color }: { stars: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-6 w-6 ${i < stars ? "fill-current" : "text-gray-300"}`}
          style={{ color: i < stars ? color : undefined }}
        />
      ))}
    </div>
  );
}

export function ScoreCard({ product, scoreResult, onRescan, onSave, saved }: ScoreCardProps) {
  const config = SCORE_CONFIG[scoreResult.label];
  const nutriments = product.nutriments || {};

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Product Header */}
      <div className="flex gap-4 p-4">
        {product.image_url || product.image_front_url ? (
          <img
            src={product.image_front_url || product.image_url || ""}
            alt={product.product_name || "Produkt"}
            className="h-24 w-24 shrink-0 rounded-lg object-contain bg-white"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0">
          <h2 className="font-bold text-lg leading-tight truncate">
            {product.product_name || "Unbekanntes Produkt"}
          </h2>
          {product.brands && (
            <p className="text-sm text-muted-foreground truncate">{product.brands}</p>
          )}
        </div>
      </div>

      {/* Score Badge */}
      <div className={`${config.bgColor} px-4 py-6 text-center`}>
        <StarRating stars={config.stars} color={config.color} />
        <div className="mt-2 flex items-center justify-center gap-2">
          <span
            className={`text-2xl font-bold ${config.textColor}`}
            style={{ color: config.color }}
          >
            {scoreResult.score.toFixed(1)}
          </span>
          <span className={`text-lg font-semibold ${config.textColor}`}>
            {scoreResult.label}
          </span>
        </div>
      </div>

      {/* Bonus/Malus Breakdown */}
      {scoreResult.breakdown.length > 0 && (
        <div className="border-t px-4 py-4">
          <h3 className="mb-3 text-sm font-semibold">Bewertungsgründe</h3>
          <div className="space-y-2">
            {scoreResult.breakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={item.points >= 0 ? "text-green-600" : "text-red-500"}>
                  {item.points >= 0 ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </span>
                <span className="flex-1">{item.reason}</span>
                <span
                  className={`font-medium ${
                    item.points >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {item.points >= 0 ? "+" : ""}
                  {item.points.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutritional Info */}
      <div className="border-t px-4 py-4">
        <h3 className="mb-3 text-sm font-semibold">Nährwerte (pro 100g)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <NutrientRow
            label="Energie"
            value={nutriments["energy-kcal_100g"]}
            unit="kcal"
          />
          <NutrientRow label="Fett" value={nutriments.fat_100g} unit="g" />
          <NutrientRow
            label="davon gesättigt"
            value={nutriments["saturated-fat_100g"]}
            unit="g"
          />
          <NutrientRow label="Zucker" value={nutriments.sugars_100g} unit="g" />
          <NutrientRow label="Ballaststoffe" value={nutriments.fiber_100g} unit="g" />
          <NutrientRow label="Protein" value={nutriments.proteins_100g} unit="g" />
          <NutrientRow label="Salz" value={nutriments.salt_100g} unit="g" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 border-t p-4">
        <button
          onClick={onRescan}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border bg-background px-4 py-3 font-medium transition-colors hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" />
          Erneut scannen
        </button>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saved}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors ${
              saved
                ? "bg-green-100 text-green-800 cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <Save className="h-4 w-4" />
            {saved ? "Gespeichert" : "Speichern"}
          </button>
        )}
      </div>
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
  if (value === undefined || value === null) {
    return (
      <div className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span>—</span>
      </div>
    );
  }
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}
