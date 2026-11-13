'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Liff } from '@line/liff';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffContextType {
  liff: Liff | null;
  isReady: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  error: string | null;
  closeLiff: () => void;
  openExternal: (url: string) => void;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isReady: false,
  isInClient: false,
  isLoggedIn: false,
  profile: null,
  error: null,
  closeLiff: () => {},
  openExternal: () => {},
});

export const useLiff = () => useContext(LiffContext);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffInstance, setLiffInstance] = useState<Liff | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

    // If LIFF ID is not configured, gracefully stay in non-LIFF web mode
    if (!liffId || typeof window === 'undefined') {
      setIsReady(true);
      return;
    }

    let isMounted = true;

    async function initLiff() {
      try {
        if (!liffId) return;
        const liffModule = await import('@line/liff');
        const liff = liffModule.default;

        await liff.init({ liffId });

        if (!isMounted) return;

        setLiffInstance(liff);
        setIsInClient(liff.isInClient());
        const loggedIn = liff.isLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          try {
            const userProfile = await liff.getProfile();
            if (isMounted) {
              setProfile(userProfile);
            }

            // Seamless auto-sync with Supabase session inside LINE client
            const idToken = liff.getIDToken();
            await fetch('/api/auth/liff', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idToken,
                profile: userProfile,
              }),
            }).catch((e) => console.warn('[LIFF Auto-Sync] Warning:', e));
          } catch (profErr) {
            console.warn('[LIFF] Could not fetch profile:', profErr);
          }
        }

        setIsReady(true);
      } catch (err: unknown) {
        console.warn('[LIFF] Initialization failed or bypassed:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
          setIsReady(true);
        }
      }
    }

    initLiff();

    return () => {
      isMounted = false;
    };
  }, []);

  const closeLiff = () => {
    if (liffInstance?.isInClient()) {
      liffInstance.closeWindow();
    }
  };

  const openExternal = (url: string) => {
    if (liffInstance?.isInClient()) {
      liffInstance.openWindow({ url, external: true });
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  return (
    <LiffContext.Provider
      value={{
        liff: liffInstance,
        isReady,
        isInClient,
        isLoggedIn,
        profile,
        error,
        closeLiff,
        openExternal,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}
