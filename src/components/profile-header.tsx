"use client";
import Link from "next/link";
import { Info } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { Condition } from "@/core/domain/user-profile";

const CONDITION_LABELS: Record<Condition, string> = {
  hashimoto: "🦋 Hashimoto",
  pcos: "🔵 PCOS",
  both: "✦ Hashimoto + PCOS",
};

export function ProfileHeader() {
  const { profile, isLoaded } = useUserProfile();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-5">
        <span className="text-base font-semibold text-foreground">Hashimoto & PCOS</span>
        <div className="flex items-center gap-2">
          <Link
            href="/education"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Warum diese Bewertungen?"
          >
            <Info className="h-5 w-5" />
          </Link>
          {isLoaded && profile && (
            <Link
              href="/settings"
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {CONDITION_LABELS[profile.condition]}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
