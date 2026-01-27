"use client";

import { useState } from "react";
import { PublicBalance } from "./PublicBalance";
import { ShieldedBalance } from "./ShieldedBalance";
import { TransactionHistory } from "./TransactionHistory";
import { ProofOfFunds } from "./ProofOfFunds";
import { ShieldModal } from "./ShieldModal";
import { WithdrawModal } from "./WithdrawModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { usePublicBalance } from "@/hooks/usePublicBalance";
import { Shield, Lock, ArrowRightLeft, Eye, EyeOff } from "lucide-react";
import { formatUSD, calculatePrivacyScore } from "@/lib/utils";
import type { ShieldedBalance as ShieldedBalanceType } from "@/types";

export function Dashboard() {
  const { connected } = useWallet();
  const { balances: publicBalances } = usePublicBalance();
  const shieldedBalances = useAppStore((state) => state.shieldedBalances) as ShieldedBalanceType[];

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

  const handleShieldFromPublicClick = (tokenMint: string, amount: number) => {
    setShieldModal({ isOpen: true, tokenMint, amount, isFromSession: false });
  };

  const handleShieldFromSessionClick = (tokenMint: string, amount: number) => {
    setShieldModal({ isOpen: true, tokenMint, amount, isFromSession: true });
  };

  const handleWithdrawClick = (tokenMint: string, amount: number) => {
    setWithdrawModal({ isOpen: true, tokenMint, amount });
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl rounded-full" />
          <Shield className="relative h-16 w-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">Private Portfolio Management</h2>
        <p className="text-muted-foreground max-w-sm mb-8 text-sm">
          Connect your wallet to shield tokens and manage your portfolio privately.
        </p>
        <div className="flex gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-500" />
            <span>View exposed assets</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-500" />
            <span>Shield privately</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            <span>Withdraw anywhere</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for the hero section
  const totalPublicValue = publicBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const totalShieldedValue = shieldedBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const totalValue = totalPublicValue + totalShieldedValue;
  const privacyScore = calculatePrivacyScore(totalPublicValue, totalShieldedValue);

  return (
    <div className="space-y-8">
      {/* Hero Section - Total Portfolio Overview */}
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
        <h1 className="text-4xl font-bold mb-6">{formatUSD(totalValue)}</h1>

        {/* Privacy indicator */}
        <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-card border border-border">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Public</span>
            <span className="font-medium">{formatUSD(totalPublicValue)}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Private</span>
            <span className="font-medium text-emerald-500">{formatUSD(totalShieldedValue)}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                privacyScore >= 70 ? "bg-emerald-500" : privacyScore >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">{privacyScore}% private</span>
          </div>
        </div>
      </div>

      {/* Balance Cards - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PublicBalance onShieldClick={handleShieldFromPublicClick} />
        <ShieldedBalance
          onWithdrawClick={handleWithdrawClick}
          onShieldFromSessionClick={handleShieldFromSessionClick}
        />
      </div>

      {/* Secondary sections in a more compact layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProofOfFunds />
        <TransactionHistory />
      </div>

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
