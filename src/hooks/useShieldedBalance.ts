"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { SUPPORTED_TOKENS } from "@/lib/solana/constants";
import { initializePrivacyClient, privacyClient } from "@/lib/privacy";
import { useAppStore } from "@/store";
import type { ShieldedBalance } from "@/types";

export function useShieldedBalance(): {
  balances: ShieldedBalance[];
  isLoading: boolean;
  isInitialized: boolean;
  fetchBalances: (forceRefresh?: boolean) => Promise<void>;
  deposit: (tokenMint: string, amount: number) => Promise<{ signature: string }>;
  withdraw: (tokenMint: string, amount: number, recipient: string) => Promise<{ signature: string; isPartial?: boolean }>;
  getSessionPublicKey: () => Promise<string>;
} {
  const { publicKey, signTransaction, signAllTransactions, signMessage, connected } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { shieldedBalances, setShieldedBalances } = useAppStore();

  // Initialize privacy client when wallet connects
  useEffect(() => {
    if (connected && publicKey && signTransaction && signAllTransactions && signMessage) {
      initializePrivacyClient({
        connection,
        wallet: {
          publicKey,
          signTransaction,
          signAllTransactions,
          signMessage,
        },
      });
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [connected, publicKey, signTransaction, signAllTransactions, signMessage, connection]);

  const fetchBalances = useCallback(
    async (forceRefresh = false) => {
      if (!isInitialized) return;

      if (!forceRefresh && shieldedBalances.length > 0) {
        return;
      }

      setIsLoading(true);
      try {
        const balances = await privacyClient.getAllShieldedBalances(SUPPORTED_TOKENS);
        setShieldedBalances(balances);
      } catch (error) {
        console.error("Error fetching shielded balances:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, shieldedBalances.length, setShieldedBalances]
  );

  const deposit = useCallback(
    async (tokenMint: string, amount: number) => {
      if (!isInitialized) throw new Error("Privacy client not initialized");
      
      const result = await privacyClient.deposit(tokenMint, amount);
      // Refresh balances after deposit
      await fetchBalances(true);
      return result;
    },
    [isInitialized, fetchBalances]
  );

  const withdraw = useCallback(
    async (tokenMint: string, amount: number, recipient: string) => {
      if (!isInitialized) throw new Error("Privacy client not initialized");
      
      const result = await privacyClient.withdraw(tokenMint, amount, recipient);
      // Refresh balances after withdrawal
      await fetchBalances(true);
      return result;
    },
    [isInitialized, fetchBalances]
  );

  const getSessionPublicKey = useCallback(async () => {
    if (!isInitialized) throw new Error("Privacy client not initialized");
    return await privacyClient.getSessionPublicKey();
  }, [isInitialized]);

  return {
    balances: shieldedBalances as ShieldedBalance[],
    isLoading,
    isInitialized,
    fetchBalances,
    deposit,
    withdraw,
    getSessionPublicKey,
  };
}
