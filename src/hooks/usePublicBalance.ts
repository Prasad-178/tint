"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { SUPPORTED_TOKENS, TOKENS } from "@/lib/solana/constants";
import { useAppStore } from "@/store";
import type { PublicBalance } from "@/types";

export function usePublicBalance(): {
  balances: PublicBalance[];
  isLoading: boolean;
  fetchBalances: () => Promise<void>;
} {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const { publicBalances, setPublicBalances } = useAppStore();

  const fetchBalances = useCallback(async () => {
    if (!connected || !publicKey) return;

    setIsLoading(true);
    try {
      const balances: PublicBalance[] = [];

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      balances.push({
        token: TOKENS.SOL,
        amount: solBalance / LAMPORTS_PER_SOL,
        usdValue: 0, // Would need price feed
      });

      // Fetch SPL token balances
      for (const token of SUPPORTED_TOKENS) {
        if (token.symbol === "SOL") continue;

        try {
          const tokenMint = new PublicKey(token.mint);
          const ata = await getAssociatedTokenAddress(tokenMint, publicKey);
          const accountInfo = await connection.getAccountInfo(ata);

          if (accountInfo) {
            const balance = accountInfo.data.readBigUInt64LE(64);
            const amount = Number(balance) / Math.pow(10, token.decimals);
            balances.push({
              token,
              amount,
              usdValue: token.symbol === "USDC" || token.symbol === "USDT" ? amount : 0,
            });
          } else {
            balances.push({ token, amount: 0, usdValue: 0 });
          }
        } catch {
          balances.push({ token, amount: 0, usdValue: 0 });
        }
      }

      setPublicBalances(balances);
    } catch (error) {
      console.error("Error fetching public balances:", error);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, connection, setPublicBalances]);

  // Auto-fetch on connection
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalances();
    }
  }, [connected, publicKey, fetchBalances]);

  return {
    balances: publicBalances as PublicBalance[],
    isLoading,
    fetchBalances,
  };
}
