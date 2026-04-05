"use client";
import { useState, useEffect } from "react";
import type { UserProfile } from "@/core/domain/user-profile";

const PROFILE_KEY = "hashimoto-pcos-user-profile";
const SKIPPED_KEY = "hashimoto-pcos-onboarding-skipped";

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PROFILE_KEY);
    setProfileState(raw ? (JSON.parse(raw) as UserProfile) : null);
    setIsLoaded(true);
  }, []);

  function setProfile(p: UserProfile | null) {
    if (p) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } else {
      localStorage.removeItem(PROFILE_KEY);
    }
    setProfileState(p);
  }

  function skipOnboarding() {
    localStorage.setItem(SKIPPED_KEY, "true");
  }

  function hasSkipped(): boolean {
    return localStorage.getItem(SKIPPED_KEY) === "true";
  }

  return { profile, setProfile, isLoaded, skipOnboarding, hasSkipped };
}
