"use client";
import { useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@/core/domain/user-profile";

const PROFILE_KEY = "hashimoto-pcos-user-profile";
const SKIPPED_KEY = "hashimoto-pcos-onboarding-skipped";

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PROFILE_KEY);
    try {
      setProfileState(raw ? (JSON.parse(raw) as UserProfile) : null);
    } catch {
      setProfileState(null);
    }
    setSkipped(localStorage.getItem(SKIPPED_KEY) === "true");
    setIsLoaded(true);
  }, []);

  const setProfile = useCallback((p: UserProfile | null) => {
    if (p) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      localStorage.removeItem(SKIPPED_KEY); // Clear skip flag when profile is set
      setSkipped(false);
    } else {
      localStorage.removeItem(PROFILE_KEY);
    }
    setProfileState(p);
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(SKIPPED_KEY, "true");
    setSkipped(true);
  }, []);

  return { profile, setProfile, isLoaded, hasSkipped: skipped, skipOnboarding };
}
