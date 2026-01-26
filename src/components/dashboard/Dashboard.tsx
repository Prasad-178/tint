"use client";

import { useState } from "react";
import { PublicBalance } from "./PublicBalance";
import { ShieldedBalance } from "./ShieldedBalance";
import { TransactionHistory } from "./TransactionHistory";
import { ProofOfFunds } from "./ProofOfFunds";
import { ShieldModal } from "./ShieldModal";
import { WithdrawModal } from "./WithdrawModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { Shield, Lock, Zap, Eye } from "lucide-react";

export function Dashboard() {
  const { connected } = useWallet();
  
  // Shield modal can be triggered from:
  // 1. Public balance (shows transfer instructions)
  // 2. Session wallet (actually shields)
  const [shieldModal, setShieldModal] = useState<{
    isOpen: boolean;
    tokenMint: string;
    amount: number;
    isFromSession: boolean;
  }>({ isOpen: false, tokenMint: "", amount: 0, isFromSession: false });

  const [withdrawModal, setWithdrawModal] = useState<{
    isOpen: boolean;
    tokenMint: string;
    amount: number;
  }>({ isOpen: false, tokenMint: "", amount: 0 });

  // Called when clicking Shield from public balance - shows instructions
  const handleShieldFromPublicClick = (tokenMint: string, amount: number) => {
    setShieldModal({ isOpen: true, tokenMint, amount, isFromSession: false });
  };

  // Called when clicking Shield from session wallet - actually shields
  const handleShieldFromSessionClick = (tokenMint: string, amount: number) => {
    setShieldModal({ isOpen: true, tokenMint, amount, isFromSession: true });
  };

  const handleWithdrawClick = (tokenMint: string, amount: number) => {
    setWithdrawModal({ isOpen: true, tokenMint, amount });
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl rounded-full" />
          <Shield className="relative h-24 w-24 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Your Holdings. Your Secret.</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Connect your wallet to manage your crypto privately. Deposit, view, and withdraw without anyone knowing your balance or address.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <Eye className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="font-semibold mb-1">See Public Balance</h3>
            <p className="text-sm text-muted-foreground">
              View what&apos;s visible to trackers and copy-traders
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <Lock className="h-8 w-8 text-emerald-500 mb-3" />
            <h3 className="font-semibold mb-1">Shield Your Tokens</h3>
            <p className="text-sm text-muted-foreground">
              One-click deposit to a private shielded pool
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <Zap className="h-8 w-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-1">Stealth Withdraw</h3>
            <p className="text-sm text-muted-foreground">
              Withdraw to any address with no trace
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PublicBalance onShieldClick={handleShieldFromPublicClick} />
        <ShieldedBalance 
          onWithdrawClick={handleWithdrawClick} 
          onShieldFromSessionClick={handleShieldFromSessionClick}
        />
      </div>

      {/* Proof of Funds */}
      <ProofOfFunds />

      {/* Transaction History */}
      <TransactionHistory />

      {/* Modals */}
      <ShieldModal
        isOpen={shieldModal.isOpen}
        onClose={() => setShieldModal({ isOpen: false, tokenMint: "", amount: 0, isFromSession: false })}
        tokenMint={shieldModal.tokenMint}
        maxAmount={shieldModal.amount}
        isFromSession={shieldModal.isFromSession}
      />
      <WithdrawModal
        isOpen={withdrawModal.isOpen}
        onClose={() => setWithdrawModal({ isOpen: false, tokenMint: "", amount: 0 })}
        tokenMint={withdrawModal.tokenMint}
        maxAmount={withdrawModal.amount}
      />
    </div>
  );
}
