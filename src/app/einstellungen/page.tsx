"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { Condition } from "@/core/domain/user-profile";
import { cn } from "@/lib/utils";
import { Check, Save } from "lucide-react";

type SensitivityAnswer = "yes" | "no" | "unknown";

const CONDITIONS: Array<{ value: Condition; label: string; emoji: string }> = [
  { value: "hashimoto", label: "Hashimoto-Thyreoiditis", emoji: "🦋" },
  { value: "pcos", label: "PCOS (Polyzystisches Ovarialsyndrom)", emoji: "🔵" },
  { value: "both", label: "Beides", emoji: "✦" },
];

const SENSITIVITY_OPTIONS: Array<{ value: SensitivityAnswer; label: string }> = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nein" },
  { value: "unknown", label: "Weiß nicht" },
];

export default function EinstellungenPage() {
  const { profile, setProfile, isLoaded } = useUserProfile();
  const [condition, setCondition] = useState<Condition | null>(null);
  const [glutenAnswer, setGlutenAnswer] = useState<SensitivityAnswer | null>(null);
  const [lactoseAnswer, setLactoseAnswer] = useState<SensitivityAnswer | null>(null);
  const [saved, setSaved] = useState(false);

  // Pre-fill from loaded profile
  useEffect(() => {
    if (!isLoaded) return;
    if (profile) {
      setCondition(profile.condition);
      setGlutenAnswer(profile.glutenSensitive ? "yes" : "no");
      setLactoseAnswer(profile.lactoseIntolerant ? "yes" : "no");
    }
  }, [isLoaded, profile]);

  function handleSave() {
    if (!condition) return;
    setProfile({
      condition,
      glutenSensitive: glutenAnswer === "yes",
      lactoseIntolerant: lactoseAnswer === "yes",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete() {
    setProfile(null);
    setCondition(null);
    setGlutenAnswer(null);
    setLactoseAnswer(null);
  }

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen px-5 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Profil</h1>

      {/* Current profile status */}
      <div className="mb-8">
        {profile ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Profil aktiv
            </span>
            <button
              onClick={handleDelete}
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Profil zurücksetzen
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            Kein Profil aktiv
          </span>
        )}
      </div>

      {/* Condition selection */}
      <div className="mb-8">
        <p className="mb-4 text-base font-semibold text-foreground">
          Für welche Erkrankung möchtest du deine Bewertungen personalisieren?
        </p>
        <div className="space-y-3">
          {CONDITIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setCondition(value)}
              className={cn(
                "w-full rounded-xl border-2 px-5 py-4 text-left text-base font-medium transition-all",
                "min-h-[56px] flex items-center gap-3",
                condition === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              <span className="text-xl">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sensitivity sections */}
      <div className="mb-8 space-y-6">
        {/* Gluten */}
        <div className="card-warm p-5">
          <p className="mb-4 text-base font-semibold text-foreground">
            Glutensensitivität / Zöliakie
          </p>
          <div className="flex gap-2">
            {SENSITIVITY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setGlutenAnswer(value)}
                className={cn(
                  "flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all min-h-[44px] touch-target",
                  glutenAnswer === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lactose */}
        <div className="card-warm p-5">
          <p className="mb-4 text-base font-semibold text-foreground">
            Laktoseintoleranz
          </p>
          <div className="flex gap-2">
            {SENSITIVITY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLactoseAnswer(value)}
                className={cn(
                  "flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all min-h-[44px] touch-target",
                  lactoseAnswer === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!condition}
        className={cn(
          "w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground",
          "flex items-center justify-center gap-2 transition-all",
          "shadow-soft hover:bg-primary/90 active:scale-[0.98]",
          !condition && "cursor-not-allowed opacity-50"
        )}
      >
        {saved ? (
          <>
            <Check className="h-5 w-5" />
            Gespeichert
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Speichern
          </>
        )}
      </button>
    </div>
  );
}
