"use client";
import Link from "next/link";
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
        {isLoaded && profile && (
          <Link
            href="/einstellungen"
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {CONDITION_LABELS[profile.condition]}
          </Link>
        )}
      </div>
    </header>
  );
}
