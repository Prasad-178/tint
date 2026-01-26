"use client";

import { useState, useCallback, useEffect } from "react";
import { useShieldedBalance } from "./useShieldedBalance";
import type { TokenInfo } from "@/lib/solana/constants";

interface SessionBalance {
  token: TokenInfo;
  amount: number;
  usdValue: number;
}

export function useSessionBalance() {
  const { isInitialized, getSessionPublicKey } = useShieldedBalance();
  const [sessionPublicKey, setSessionPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<SessionBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get session public key when initialized
  useEffect(() => {
    if (isInitialized && !sessionPublicKey) {
      getSessionPublicKey()
        .then(setSessionPublicKey)
        .catch(console.error);
    }
  }, [isInitialized, sessionPublicKey, getSessionPublicKey]);

  const fetchBalances = useCallback(async () => {
    if (!sessionPublicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/session/balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPublicKey }),
      });

      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances || []);
      }
    } catch (error) {
      console.error("Error fetching session balances:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionPublicKey]);

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

  return {
    sessionPublicKey,
    balances,
    isLoading,
    fetchBalances,
  };
}
