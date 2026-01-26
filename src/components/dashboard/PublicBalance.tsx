"use client";

import { usePublicBalance } from "@/hooks/usePublicBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye, AlertTriangle, ArrowRight } from "lucide-react";
import { formatUSD, calculatePrivacyScore } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useWallet } from "@solana/wallet-adapter-react";
import type { PublicBalance as PublicBalanceType, ShieldedBalance } from "@/types";

interface PublicBalanceProps {
  onShieldClick: (tokenMint: string, amount: number) => void;
}

export function PublicBalance({ onShieldClick }: PublicBalanceProps) {
  const { connected } = useWallet();
  const { balances, isLoading, fetchBalances } = usePublicBalance();
  const shieldedBalances = useAppStore((state) => state.shieldedBalances) as ShieldedBalance[];

  if (!connected) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Public Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Connect your wallet to view your public balance
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPublicValue = balances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const totalShieldedValue = shieldedBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const privacyScore = calculatePrivacyScore(totalPublicValue, totalShieldedValue);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-amber-500" />
            Public Balance
            <Badge variant="warning" className="ml-2">
              Visible to all
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchBalances()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Privacy Warning */}
        {balances.some((b) => b.amount > 0) && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">Your wallet is trackable</p>
              <p className="text-muted-foreground mt-1">
                These balances are visible to anyone. Shield them to protect your privacy.
              </p>
            </div>
          </div>
        )}

        {/* Privacy Score */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Privacy Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${
                  privacyScore >= 70
                    ? "bg-emerald-500"
                    : privacyScore >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${privacyScore}%` }}
              />
            </div>
            <span className="text-sm font-medium">{privacyScore}%</span>
          </div>
        </div>

        {/* Token Balances */}
        <div className="space-y-3">
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tokens found
            </p>
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
                      onClick={() => onShieldClick(balance.token.mint, balance.amount)}
                    >
                      Shield
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
