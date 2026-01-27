"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useShieldedBalance } from "./useShieldedBalance";
import type { TokenInfo } from "@/lib/solana/constants";

interface SessionBalance {
  token: TokenInfo;
  amount: number;
  usdValue: number;
}

// Compare session balances to avoid unnecessary re-renders
function sessionBalancesChanged(prev: SessionBalance[], next: SessionBalance[]): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    const prevItem = prev[i];
    const nextItem = next.find((n) => n.token.mint === prevItem.token.mint);
    if (!nextItem || prevItem.amount !== nextItem.amount) return true;
  }
  return false;
}

export function useSessionBalance() {
  const { isInitialized, getSessionPublicKey } = useShieldedBalance();
  const [sessionPublicKey, setSessionPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<SessionBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  const hasFetchedOnce = useRef(false);

  // Get session public key when initialized or when session version changes
  useEffect(() => {
    if (isInitialized) {
      getSessionPublicKey()
        .then((key) => {
          if (key !== sessionPublicKey) {
            setSessionPublicKey(key);
          }
        })
        .catch(console.error);
    }
  }, [isInitialized, sessionVersion, getSessionPublicKey]);

  const fetchBalances = useCallback(async () => {
    if (!sessionPublicKey) return;

    // Only show loading on first fetch
    const isFirstFetch = balances.length === 0 && !hasFetchedOnce.current;
    if (isFirstFetch) {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/session/balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPublicKey }),
      });

      if (response.ok) {
        const data = await response.json();
        const newBalances = data.balances || [];
        // Only update state if balances changed
        if (sessionBalancesChanged(balances, newBalances)) {
          setBalances(newBalances);
        }
        hasFetchedOnce.current = true;
      }
    } catch (error) {
      console.error("Error fetching session balances:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionPublicKey, balances]);

  // Auto-fetch on mount and when session key changes
  useEffect(() => {
    if (sessionPublicKey) {
      fetchBalances();
    }
  }, [sessionPublicKey, fetchBalances]);

  // Refresh periodically
  useEffect(() => {
    if (!sessionPublicKey) return;
    const interval = setInterval(fetchBalances, 15000); // Every 15 seconds
    return () => clearInterval(interval);
  }, [sessionPublicKey, fetchBalances]);

  // Function to refresh the session (e.g., after importing a new session)
  const refreshSession = useCallback(() => {
    setSessionPublicKey(null);
    setBalances([]);
    setSessionVersion((v) => v + 1);
  }, []);

  return {
    sessionPublicKey,
    balances,
    isLoading,
    fetchBalances,
    refreshSession,
  };
}
