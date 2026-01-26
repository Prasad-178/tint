"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";
import { getTokenByMint } from "@/lib/solana/constants";
import { ArrowUp, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/store";
import { generateUUID, shortenAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenMint: string;
  maxAmount: number;
}

type Status = "idle" | "loading" | "success" | "error";

export function WithdrawModal({ isOpen, onClose, tokenMint, maxAmount }: WithdrawModalProps) {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState(maxAmount.toString());
  const [recipient, setRecipient] = useState("");
  const [useOwnWallet, setUseOwnWallet] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { withdraw } = useShieldedBalance();
  const addTransaction = useAppStore((state) => state.addTransaction);
  const token = getTokenByMint(tokenMint);

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountNum > maxAmount) {
      setError(`Maximum amount is ${maxAmount}`);
      return;
    }

    const recipientAddress = useOwnWallet ? publicKey?.toBase58() : recipient;
    if (!recipientAddress) {
      setError("Please enter a recipient address");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const result = await withdraw(tokenMint, amountNum, recipientAddress);
      setTxSignature(result.signature);
      setStatus("success");

      // Add to transaction history
      if (token) {
        // eslint-disable-next-line react-hooks/purity
        const timestamp = Date.now();
        addTransaction({
          id: generateUUID(),
          type: "withdraw",
          token,
          amount: amountNum,
          timestamp,
          txSignature: result.signature,
          status: "success",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
      setStatus("error");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setTxSignature(null);
    setError(null);
    setAmount(maxAmount.toString());
    setRecipient("");
    setUseOwnWallet(true);
    onClose();
  };

  if (!token) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-blue-500" />
            Withdraw {token.symbol}
          </DialogTitle>
          <DialogDescription>
            Withdraw your shielded tokens to any address (stealth withdrawal)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {status === "success" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Withdrawal Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {amount} {token.symbol} sent to{" "}
                {shortenAddress(useOwnWallet ? publicKey?.toBase58() || "" : recipient)}
              </p>
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-500 hover:underline"
                >
                  View transaction on Solscan
                </a>
              )}
              <Button onClick={handleClose} className="w-full mt-6">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Token Info */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                {token.logoURI ? (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-sm font-medium">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Shielded: {maxAmount.toLocaleString()} {token.symbol}
                  </p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to Withdraw</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pr-20 font-mono"
                    disabled={status === "loading"}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8"
                    onClick={() => setAmount(maxAmount.toString())}
                    disabled={status === "loading"}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Recipient</label>
                <div className="flex gap-2">
                  <Button
                    variant={useOwnWallet ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseOwnWallet(true)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    My Wallet
                  </Button>
                  <Button
                    variant={!useOwnWallet ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseOwnWallet(false)}
                    className="flex-1"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Fresh Address
                  </Button>
                </div>
                {!useOwnWallet && (
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Solana address..."
                    className="font-mono text-sm"
                    disabled={status === "loading"}
                  />
                )}
                {!useOwnWallet && (
                  <p className="text-xs text-muted-foreground">
                    Use a fresh address for maximum privacy - no link to your original wallet
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Privacy Fee</span>
                  <span>0.35% + 0.006 SOL</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recipient receives</span>
                  <span className="font-mono">
                    ~{(parseFloat(amount || "0") * 0.9965).toFixed(4)} {token.symbol}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={status === "loading" || !amount}
                  className="flex-1"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    <>
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Withdraw
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
