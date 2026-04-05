"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { profile, hasSkipped, isLoaded } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;
    if (pathname === "/onboarding") return; // prevent redirect loop
    if (!profile && !hasSkipped) {
      router.replace("/onboarding");
    }
  }, [isLoaded, profile, hasSkipped, pathname, router]);

  return <>{children}</>;
}
