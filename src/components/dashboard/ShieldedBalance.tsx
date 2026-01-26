"use client";

import { useState, useEffect } from "react";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Shield, ArrowUp, Copy, Check, Lock } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

interface ShieldedBalanceProps {
  onWithdrawClick: (tokenMint: string, amount: number) => void;
}

export function ShieldedBalance({ onWithdrawClick }: ShieldedBalanceProps) {
  const { connected } = useWallet();
  const {
    balances,
    isLoading,
    fetchBalances,
    getSessionPublicKey,
    isInitialized,
  } = useShieldedBalance();
  const [sessionWalletAddress, setSessionWalletAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isInitialized && !sessionWalletAddress) {
      getSessionPublicKey().then(setSessionWalletAddress).catch(console.error);
    }
  }, [isInitialized, sessionWalletAddress, getSessionPublicKey]);

  useEffect(() => {
    if (isInitialized) {
      fetchBalances();
    }
  }, [isInitialized, fetchBalances]);

  const copyAddress = () => {
    if (sessionWalletAddress) {
      navigator.clipboard.writeText(sessionWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  const totalUsdValue = balances.reduce((acc, b) => acc + (b.usdValue || 0), 0);

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
            onClick={() => fetchBalances(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Value */}
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-emerald-500">
            {formatUSD(totalUsdValue)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Only you can see this balance
          </p>
        </div>

        {/* Token Balances */}
        <div className="space-y-3">
          {balances.length === 0 ? (
            <div className="text-center py-6">
              <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No shielded assets yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Shield your tokens to make them private
              </p>
            </div>
          ) : (
            balances.map((balance) => (
              <div
                key={balance.token.mint}
                className="flex items-center justify-between group"
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
                      {balance.amount.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })}
                    </p>
                    {balance.usdValue !== undefined && balance.usdValue > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatUSD(balance.usdValue)}
                      </p>
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

        {/* Session Wallet Info */}
        {sessionWalletAddress && (
          <div className="mt-4 p-4 rounded-lg border border-dashed border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Session Wallet (for deposits)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background px-3 py-2 rounded-md font-mono truncate border">
                {sessionWalletAddress}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyAddress}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Fund this address with tokens + SOL for fees to shield them
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
