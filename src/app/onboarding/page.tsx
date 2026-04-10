"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { Condition } from "@/core/domain/user-profile";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { CONDITIONS, SENSITIVITY_OPTIONS, type SensitivityAnswer } from "@/lib/profile-options";

const PROGRESS_KEY = "hashimoto-pcos-onboarding-progress";

export default function OnboardingPage() {
  const { setProfile, skipOnboarding } = useUserProfile();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [glutenAnswer, setGlutenAnswer] = useState<SensitivityAnswer | null>(null);
  const [lactoseAnswer, setLactoseAnswer] = useState<SensitivityAnswer | null>(null);

  // Restore progress from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        step: 1 | 2;
        condition: Condition | null;
        glutenAnswer: SensitivityAnswer | null;
        lactoseAnswer: SensitivityAnswer | null;
      };
      setStep(saved.step);
      setCondition(saved.condition);
      setGlutenAnswer(saved.glutenAnswer);
      setLactoseAnswer(saved.lactoseAnswer);
    } catch {
      // corrupt data — start fresh
    }
  }, []);

  // Persist progress to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ step, condition, glutenAnswer, lactoseAnswer })
      );
    } catch {
      // quota exceeded — silent fail
    }
  }, [step, condition, glutenAnswer, lactoseAnswer]);

  function handleSkip() {
    localStorage.removeItem(PROGRESS_KEY);
    skipOnboarding();
    router.replace("/");
  }

  function handleNext() {
    if (!condition) return;
    setStep(2);
  }

  function handleFinish() {
    if (!condition) return;
    localStorage.removeItem(PROGRESS_KEY);
    setProfile({
      condition,
      glutenSensitive: glutenAnswer === "yes",   // "no" and "unknown" both map to false
      lactoseIntolerant: lactoseAnswer === "yes", // "no" and "unknown" both map to false
    });
    router.replace("/");
  }

  return (
    <div className="min-h-screen px-5 py-8 flex flex-col">
      {/* Progress indicator */}
      <div className="mb-8 flex gap-2">
        <div
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            step >= 1 ? "bg-primary" : "bg-border"
          )}
        />
        <div
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            step >= 2 ? "bg-primary" : "bg-border"
          )}
        />
      </div>

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Willkommen</h1>
            <p className="text-base text-muted-foreground">
              Für welche Erkrankung möchtest du deine Bewertungen personalisieren?
            </p>
          </div>

          {/* Condition selection */}
          <div className="mb-8 space-y-3">
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

          {/* Actions */}
          <div className="mt-auto space-y-4">
            <button
              onClick={handleNext}
              disabled={!condition}
              className={cn(
                "w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground",
                "flex items-center justify-center gap-2 transition-all",
                "shadow-soft hover:bg-primary/90 active:scale-[0.98]",
                !condition && "cursor-not-allowed opacity-50"
              )}
            >
              Weiter
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-3 text-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Später einrichten
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Fast fertig!</h1>
            <p className="text-base text-muted-foreground">
              Hast du zusätzliche Nahrungsmittelunverträglichkeiten?
            </p>
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

          {/* Actions */}
          <div className="mt-auto space-y-4">
            <button
              onClick={handleFinish}
              className={cn(
                "w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground",
                "flex items-center justify-center gap-2 transition-all",
                "shadow-soft hover:bg-primary/90 active:scale-[0.98]"
              )}
            >
              <Check className="h-5 w-5" />
              Fertigstellen
            </button>

            <button
              onClick={() => setStep(1)}
              className="flex w-full items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
