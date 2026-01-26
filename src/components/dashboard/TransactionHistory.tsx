"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store";
import { formatDistanceToNow } from "date-fns";
import { ArrowDown, ArrowUp, ExternalLink, History } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

export function TransactionHistory() {
  const { connected } = useWallet();
  const transactions = useAppStore((state) => state.transactions);

  if (!connected) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your shield and withdraw history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      tx.type === "deposit"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {tx.type === "deposit" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {tx.type === "deposit" ? "Shielded" : "Withdrew"}
                      </p>
                      <Badge
                        variant={tx.status === "success" ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.amount.toLocaleString()} {tx.token.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </p>
                  <a
                    href={`https://solscan.io/tx/${tx.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
