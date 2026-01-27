"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Shield, Loader2, CheckCircle2, AlertCircle, ArrowDown, Copy, Check, ExternalLink, Wallet, RefreshCw, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { generateUUID } from "@/lib/utils";

interface ShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenMint: string;
  maxAmount: number;
  isFromSession?: boolean; // If true, shield from session wallet
}

type Status = "idle" | "loading" | "success" | "error";

export function ShieldModal({ isOpen, onClose, tokenMint, maxAmount, isFromSession = false }: ShieldModalProps) {
  const [amount, setAmount] = useState(maxAmount.toString());
  const [status, setStatus] = useState<Status>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { deposit, fetchBalances: fetchShieldedBalances } = useShieldedBalance();
  const { sessionPublicKey, balances: sessionBalances, fetchBalances: fetchSessionBalances, isLoading: isLoadingSession } = useSessionBalance();
  const addTransaction = useAppStore((state) => state.addTransaction);
  const token = getTokenByMint(tokenMint);

  // Check if session wallet has this token
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

  // Update amount based on whether we're shielding from session or public
  useEffect(() => {
    if (isFromSession) {
      setAmount(maxAmount.toString());
    } else if (sessionTokenBalance > 0) {
      // If not from session but session has balance, default to session balance
      setAmount(sessionTokenBalance.toString());
    } else {
      setAmount(maxAmount.toString());
    }
  }, [maxAmount, isFromSession, sessionTokenBalance]);

  // Refresh session balances when modal opens
  useEffect(() => {
    if (isOpen && !isFromSession) {
      fetchSessionBalances();
    }
  }, [isOpen, isFromSession, fetchSessionBalances]);

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
            {isFromSession 
              ? "Shield tokens from your session wallet to the privacy pool"
              : "Transfer tokens to your session wallet, then shield them"
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
          ) : isFromSession ? (
            // Shield from session wallet flow
            <>
              {/* Token Info */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-sm font-medium">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Session wallet: {maxAmount.toLocaleString()} {token.symbol}
                  </p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to Shield</label>
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

              {/* Info */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Privacy Fee</span>
                  <span>0.35% + 0.006 SOL</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You will receive (shielded)</span>
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
                  variant="gradient"
                  onClick={handleShield}
                  disabled={status === "loading" || !amount}
                  className="flex-1"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shielding...
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Shield {token.symbol}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : canShieldFromSession ? (
            // Session wallet has funds - can shield directly!
            <>
              {/* Token Info */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-sm font-medium">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{token.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-500 font-medium">
                      {sessionTokenBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol} ready
                    </span>
                    <span className="text-muted-foreground">in session wallet</span>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to Shield</label>
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
                    onClick={() => setAmount(sessionTokenBalance.toString())}
                    disabled={status === "loading"}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Privacy Fee</span>
                  <span>0.35% + 0.006 SOL</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SOL for fees</span>
                  <span className={sessionSolBalance >= 0.005 ? "text-emerald-500" : "text-amber-500"}>
                    {sessionSolBalance.toFixed(4)} SOL
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You will receive (shielded)</span>
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
                  variant="gradient"
                  onClick={handleShield}
                  disabled={status === "loading" || !amount}
                  className="flex-1"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shielding...
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Shield {token.symbol}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            // Transfer to session wallet flow (when clicking from public balance)
            <>
              {/* Token Info */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-sm font-medium">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Public balance: {maxAmount.toLocaleString()} {token.symbol}
                  </p>
                </div>
              </div>

              {/* Session Wallet Status */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Wallet</span>
                  <Button variant="ghost" size="sm" onClick={fetchSessionBalances} disabled={isLoadingSession}>
                    <RefreshCw className={`h-3 w-3 ${isLoadingSession ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                {isLoadingSession ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking balances...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{token.symbol} Balance</span>
                      <span className={sessionTokenBalance > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                        {sessionTokenBalance.toFixed(4)} {token.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">SOL (for fees)</span>
                      <span className={sessionSolBalance >= 0.005 ? "text-emerald-500" : "text-amber-500"}>
                        {sessionSolBalance.toFixed(4)} SOL
                        {sessionSolBalance < 0.005 && " (need 0.005+)"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Instructions */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-500 mb-2">Transfer to Session Wallet First</p>
                    <p className="text-muted-foreground">
                      To shield your tokens, transfer them plus some SOL (0.01+ recommended) to your session wallet. 
                      Once transferred, you can shield them with one click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Session Wallet Address */}
              {sessionPublicKey && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Wallet Address</label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono truncate border">
                      {sessionPublicKey}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySessionAddress}>
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
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
              )}

              {/* Actions */}
              <Button variant="outline" onClick={handleClose} className="w-full">
                Got it
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
