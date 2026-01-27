"use client";

import { usePublicBalance } from "@/hooks/usePublicBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, ArrowRight } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

interface PublicBalanceProps {
  onShieldClick: (tokenMint: string, amount: number) => void;
}

export function PublicBalance({ onShieldClick }: PublicBalanceProps) {
  const { connected } = useWallet();
  const { balances, isLoading, fetchBalances } = usePublicBalance();

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
  const hasAssets = balances.some((b) => b.amount > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Exposed Assets</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchBalances()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="text-2xl font-semibold text-amber-500">{formatUSD(totalPublicValue)}</p>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasAssets ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No exposed assets
          </p>
        ) : (
          <div className="space-y-2">
            {balances.filter((b) => b.amount > 0).map((balance) => (
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
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      {balance.amount.toLocaleString("en-US", {
                        maximumFractionDigits: 4,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    onClick={() => onShieldClick(balance.token.mint, balance.amount)}
                  >
                    Shield
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
