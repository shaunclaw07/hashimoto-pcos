"use client";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { UserProfile } from "@/core/domain/user-profile";

const PROFILE_KEY = "hashimoto-pcos-user-profile";
const SKIPPED_KEY = "hashimoto-pcos-onboarding-skipped";

interface UserProfileContextValue {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  isLoaded: boolean;
  hasSkipped: boolean;
  skipOnboarding: () => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function useUserProfileState(): UserProfileContextValue {
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
      localStorage.removeItem(SKIPPED_KEY);
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

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const state = useUserProfileState();
  return (
    <UserProfileContext.Provider value={state}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  const fallback = useUserProfileState();
  // context is always set by UserProfileProvider in layout.tsx;
  // the ?? short-circuit only activates in test environments without the provider
  return context ?? fallback;
}
