"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { useSessionBalance } from "@/hooks/useSessionBalance";
import { getTokenByMint } from "@/lib/solana/constants";
import { Shield, Loader2, CheckCircle2, AlertCircle, ArrowDown, Copy, Check, ExternalLink } from "lucide-react";
import { useAppStore } from "@/store";
import { generateUUID } from "@/lib/utils";

interface ShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenMint: string;
  maxAmount: number;
  isFromSession?: boolean;
}

type Status = "idle" | "loading" | "success" | "error";

export function ShieldModal({ isOpen, onClose, tokenMint, maxAmount, isFromSession = false }: ShieldModalProps) {
  const [amount, setAmount] = useState(maxAmount.toString());
  const [status, setStatus] = useState<Status>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { deposit, fetchBalances: fetchShieldedBalances } = useShieldedBalance();
  const { sessionPublicKey, balances: sessionBalances, fetchBalances: fetchSessionBalances } = useSessionBalance();
  const addTransaction = useAppStore((state) => state.addTransaction);
  const token = getTokenByMint(tokenMint);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sessionTokenBalance = useMemo(() => {
    if (!token) return 0;
    const balance = sessionBalances.find(b => b.token.mint === tokenMint);
    return balance?.amount || 0;
  }, [sessionBalances, tokenMint, token]);

  const sessionSolBalance = useMemo(() => {
    const balance = sessionBalances.find(b => b.token.symbol === "SOL");
    return balance?.amount || 0;
  }, [sessionBalances]);

  const hasSufficientSolForFees = sessionSolBalance >= 0.005;
  const canShieldFromSession = sessionTokenBalance > 0 && hasSufficientSolForFees;

  // Update amount when session token balance changes
  useEffect(() => {
    if (isFromSession) {
      setAmount(maxAmount.toString());
    } else if (sessionTokenBalance > 0) {
      setAmount(sessionTokenBalance.toString());
    } else {
      setAmount(maxAmount.toString());
    }
  }, [maxAmount, isFromSession, sessionTokenBalance]);

  // Auto-poll for session balance when modal is open and waiting for deposit
  useEffect(() => {
    if (isOpen && !isFromSession && !canShieldFromSession && status === "idle") {
      // Fetch immediately
      fetchSessionBalances();
      // Then poll every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchSessionBalances();
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, isFromSession, canShieldFromSession, status, fetchSessionBalances]);

  const copySessionAddress = () => {
    if (sessionPublicKey) {
      navigator.clipboard.writeText(sessionPublicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShield = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const availableAmount = isFromSession ? maxAmount : sessionTokenBalance;
    if (amountNum > availableAmount) {
      setError(`Maximum available is ${availableAmount.toFixed(4)}`);
      return;
    }

    if (!hasSufficientSolForFees) {
      setError(`Need at least 0.005 SOL for fees. Current: ${sessionSolBalance.toFixed(4)} SOL`);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const result = await deposit(tokenMint, amountNum);
      setTxSignature(result.signature);
      setStatus("success");

      // Add to transaction history
      if (token) {
        const timestamp = Date.now();
        addTransaction({
          id: generateUUID(),
          type: "deposit",
          token,
          amount: amountNum,
          timestamp,
          txSignature: result.signature,
          status: "success",
        });
      }

      // Refresh both balances
      fetchSessionBalances();
      fetchShieldedBalances(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shield failed");
      setStatus("error");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setTxSignature(null);
    setError(null);
    setAmount(maxAmount.toString());
    onClose();
  };

  if (!token) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            Shield {token.symbol}
          </DialogTitle>
          <DialogDescription>
            {canShieldFromSession || isFromSession
              ? "Move tokens to private shielded pool"
              : "Send tokens to your deposit address first"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {status === "success" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Successfully Shielded!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your {amount} {token.symbol} is now private
              </p>
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-500 hover:underline inline-flex items-center gap-1"
                >
                  View transaction on Solscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button onClick={handleClose} className="w-full mt-6">
                Done
              </Button>
            </div>
          ) : isFromSession || canShieldFromSession ? (
            // Ready to shield - unified flow for both session and public click
            <>
              {/* Token ready status */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-sm font-medium">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{token.symbol}</p>
                  <p className="text-sm text-emerald-500">
                    {(isFromSession ? maxAmount : sessionTokenBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} ready to shield
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Amount</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setAmount((isFromSession ? maxAmount : sessionTokenBalance).toString())}
                  >
                    MAX
                  </Button>
                </div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="font-mono"
                  disabled={status === "loading"}
                />
              </div>

              {/* Fee info - compact */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Fee: 0.35%</span>
                <span>Receive: ~{(parseFloat(amount || "0") * 0.9965).toFixed(4)} {token.symbol}</span>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleShield}
                  disabled={status === "loading" || !amount}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shielding...
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Shield Now
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            // Waiting for deposit - show address and auto-detect
            <>
              {/* Token info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-xs font-medium">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    Public: {maxAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </p>
                </div>
              </div>

              {/* Deposit address - prominent */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Send {token.symbol} + SOL to:</p>
                <div className="p-3 rounded-lg bg-muted border-2 border-dashed border-border">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono break-all">
                      {sessionPublicKey}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copySessionAddress}>
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <a
                  href={`https://solscan.io/account/${sessionPublicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  View on Solscan <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Live status - auto updating */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{token.symbol}</span>
                  <span className={sessionTokenBalance > 0 ? "text-emerald-500 font-medium" : ""}>
                    {sessionTokenBalance > 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {sessionTokenBalance.toFixed(4)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Waiting...
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SOL (for fees)</span>
                  <span className={sessionSolBalance >= 0.005 ? "text-emerald-500 font-medium" : "text-amber-500"}>
                    {sessionSolBalance >= 0.005 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {sessionSolBalance.toFixed(4)}
                      </span>
                    ) : sessionSolBalance > 0 ? (
                      `${sessionSolBalance.toFixed(4)} (need 0.005+)`
                    ) : (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Waiting...
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This page auto-updates when tokens arrive
              </p>

              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
