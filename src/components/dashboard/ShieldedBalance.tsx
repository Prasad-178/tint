"use client";

import { useState, useEffect, useCallback } from "react";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";
import { useSessionBalance } from "@/hooks/useSessionBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Wallet,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatUSD, shortenAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { SessionManager } from "./SessionManager";

interface ShieldedBalanceProps {
  onWithdrawClick: (tokenMint: string, amount: number) => void;
  onShieldFromSessionClick: (tokenMint: string, amount: number) => void;
}

export function ShieldedBalance({ onWithdrawClick, onShieldFromSessionClick }: ShieldedBalanceProps) {
  const { connected } = useWallet();
  const {
    balances: shieldedBalances,
    isLoading: isLoadingShielded,
    fetchBalances: fetchShieldedBalances,
    isInitialized,
  } = useShieldedBalance();
  const {
    sessionPublicKey,
    balances: sessionBalances,
    isLoading: isLoadingSession,
    fetchBalances: fetchSessionBalances,
    refreshSession,
  } = useSessionBalance();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      fetchShieldedBalances();
    }
  }, [isInitialized, fetchShieldedBalances]);

  const copyAddress = () => {
    if (sessionPublicKey) {
      navigator.clipboard.writeText(sessionPublicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = useCallback(() => {
    fetchShieldedBalances(true);
    fetchSessionBalances();
  }, [fetchShieldedBalances, fetchSessionBalances]);

  const handleSessionChanged = useCallback(() => {
    refreshSession();
    fetchShieldedBalances(true);
  }, [refreshSession, fetchShieldedBalances]);

  if (!connected) {
    return (
      <Card className="border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <EyeOff className="h-5 w-5 text-emerald-500" />
            Private Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Connect your wallet to view your private balance
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalShieldedUsd = shieldedBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const sessionSolBalance = sessionBalances.find(b => b.token.symbol === "SOL")?.amount || 0;
  const hasSessionTokens = sessionBalances.some(b => b.amount > 0 && b.token.symbol !== "SOL");
  const hasSolForFees = sessionSolBalance >= 0.005;
  const hasShieldedAssets = shieldedBalances.some(b => b.amount > 0);

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Private Assets</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isLoadingShielded || isLoadingSession}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(isLoadingShielded || isLoadingSession) ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="text-2xl font-semibold text-emerald-500">{formatUSD(totalShieldedUsd)}</p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Shielded Token Balances */}
        {!hasShieldedAssets ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No private assets yet
          </p>
        ) : (
          <div className="space-y-2">
            {shieldedBalances.filter(b => b.amount > 0).map((balance) => (
              <div
                key={balance.token.mint}
                className="flex items-center justify-between py-2 group"
              >
                <div className="flex items-center gap-3">
                  {balance.token.logoURI ? (
                    <img
                      src={balance.token.logoURI}
                      alt={balance.token.symbol}
                      className="h-7 w-7 rounded-full"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {balance.token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <span className="font-medium text-sm">{balance.token.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono">
                    {balance.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    onClick={() => onWithdrawClick(balance.token.mint, balance.amount)}
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Withdraw
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session Wallet Section */}
        {sessionPublicKey && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                <span>Deposit Address</span>
              </div>
              <SessionManager
                sessionPublicKey={sessionPublicKey}
                onSessionChanged={handleSessionChanged}
              />
            </div>

            {/* Session Wallet Address - Compact */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 mb-3">
              <code className="text-xs font-mono text-muted-foreground">{shortenAddress(sessionPublicKey, 6)}</code>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={copyAddress} className="h-7 w-7">
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </Button>
                <a
                  href={`https://solscan.io/account/${sessionPublicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Session Wallet Balances - Only show if there are tokens */}
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : sessionBalances.some(b => b.amount > 0) ? (
              <div className="space-y-1">
                {sessionBalances.filter(b => b.amount > 0).map((balance) => (
                  <div
                    key={balance.token.mint}
                    className="flex items-center justify-between py-1.5 group"
                  >
                    <div className="flex items-center gap-2">
                      {balance.token.logoURI ? (
                        <img src={balance.token.logoURI} alt="" className="h-5 w-5 rounded-full" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
                          {balance.token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">{balance.token.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono">
                        {balance.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                      </span>
                      {balance.token.symbol !== "SOL" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100"
                          onClick={() => onShieldFromSessionClick(balance.token.mint, balance.amount)}
                          disabled={!hasSolForFees}
                        >
                          <ArrowDown className="h-2.5 w-2.5 mr-0.5" />
                          Shield
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {!hasSolForFees && hasSessionTokens && (
                  <p className="text-[10px] text-amber-500 mt-1">
                    Need 0.005 SOL for fees
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                Send tokens here to shield them
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
