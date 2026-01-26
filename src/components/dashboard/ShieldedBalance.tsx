"use client";

import { useState, useEffect } from "react";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";
import { useSessionBalance } from "@/hooks/useSessionBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Shield,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Lock,
  Wallet,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatUSD, shortenAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

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

  const handleRefresh = () => {
    fetchShieldedBalances(true);
    fetchSessionBalances();
  };

  if (!connected) {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-emerald-500" />
            Shielded Balance
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

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-emerald-500" />
            Shielded Balance
            <Badge variant="success" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              Private
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoadingShielded || isLoadingSession}
          >
            <RefreshCw className={`h-4 w-4 ${(isLoadingShielded || isLoadingSession) ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Value */}
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-emerald-500">
            {formatUSD(totalShieldedUsd)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Only you can see this balance
          </p>
        </div>

        {/* Shielded Token Balances */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Lock className="h-3 w-3" />
            Shielded Assets
          </h4>
          {shieldedBalances.length === 0 || shieldedBalances.every(b => b.amount === 0) ? (
            <div className="text-center py-4">
              <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No shielded assets yet</p>
            </div>
          ) : (
            shieldedBalances.filter(b => b.amount > 0).map((balance) => (
              <div
                key={balance.token.mint}
                className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {balance.token.logoURI ? (
                    <img
                      src={balance.token.logoURI}
                      alt={balance.token.symbol}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {balance.token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{balance.token.symbol}</p>
                    <p className="text-xs text-muted-foreground">{balance.token.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono">
                      {balance.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                    </p>
                    {balance.usdValue !== undefined && balance.usdValue > 0 && (
                      <p className="text-xs text-muted-foreground">{formatUSD(balance.usdValue)}</p>
                    )}
                  </div>
                  {balance.amount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onWithdrawClick(balance.token.mint, balance.amount)}
                    >
                      <ArrowUp className="h-4 w-4 mr-1" />
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Session Wallet Section */}
        {sessionPublicKey && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
              <Wallet className="h-3 w-3" />
              Session Wallet (Ready to Shield)
            </h4>

            {/* Session Wallet Address */}
            <div className="p-3 rounded-lg border border-dashed border-border bg-muted/30 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Session Address</p>
                  <code className="text-xs font-mono">{shortenAddress(sessionPublicKey, 8)}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={copyAddress} className="h-8 w-8">
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <a
                    href={`https://solscan.io/account/${sessionPublicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Session Wallet Balances */}
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading session wallet...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {sessionBalances.map((balance) => (
                  <div
                    key={balance.token.mint}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 group"
                  >
                    <div className="flex items-center gap-2">
                      {balance.token.logoURI ? (
                        <img src={balance.token.logoURI} alt="" className="h-6 w-6 rounded-full" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {balance.token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <span className="text-sm">{balance.token.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {balance.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                      </span>
                      {balance.amount > 0 && balance.token.symbol !== "SOL" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs opacity-0 group-hover:opacity-100"
                          onClick={() => onShieldFromSessionClick(balance.token.mint, balance.amount)}
                          disabled={!hasSolForFees}
                        >
                          <ArrowDown className="h-3 w-3 mr-1" />
                          Shield
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Fee warning */}
                {!hasSolForFees && hasSessionTokens && (
                  <p className="text-xs text-amber-500 mt-2">
                    Add at least 0.005 SOL to session wallet for transaction fees
                  </p>
                )}

                {/* Instructions */}
                <div className="text-xs text-muted-foreground mt-3 p-2 rounded bg-muted/20">
                  <p className="font-medium mb-1">How to shield tokens:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Send tokens + SOL (for fees) to session address above</li>
                    <li>Click Shield next to the token</li>
                    <li>Tokens move to shielded pool (private)</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
