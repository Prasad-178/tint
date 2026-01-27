"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const recentTxs = transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {recentTxs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No activity yet
          </p>
        ) : (
          <div className="space-y-1">
            {recentTxs.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded ${
                      tx.type === "deposit"
                        ? "text-emerald-500"
                        : "text-blue-500"
                    }`}
                  >
                    {tx.type === "deposit" ? (
                      <ArrowDown className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm">
                      {tx.type === "deposit" ? "Shielded" : "Withdrew"}{" "}
                      <span className="font-mono">{tx.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>{" "}
                      <span className="text-muted-foreground">{tx.token.symbol}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </span>
                  <a
                    href={`https://solscan.io/tx/${tx.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
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
