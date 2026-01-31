"use client";

import { useState } from "react";
import { PublicBalance } from "./PublicBalance";
import { ShieldedBalance } from "./ShieldedBalance";
import { TransactionHistory } from "./TransactionHistory";
import { ProofOfFunds } from "./ProofOfFunds";
import { ShieldModal } from "./ShieldModal";
import { WithdrawModal } from "./WithdrawModal";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { LandingPage } from "@/components/landing/LandingPage";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { usePublicBalance } from "@/hooks/usePublicBalance";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";
import { useSessionBalance } from "@/hooks/useSessionBalance";
import { Eye, EyeOff } from "lucide-react";
import { formatUSD, calculatePrivacyScore } from "@/lib/utils";
import type { ShieldedBalance as ShieldedBalanceType } from "@/types";

export function Dashboard() {
  const { connected } = useWallet();
  const { balances: publicBalances, isLoading: isLoadingPublic } = usePublicBalance();
  const { isInitialized } = useShieldedBalance();
  const { balances: sessionBalances } = useSessionBalance();
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
    return <LandingPage />;
  }

  // Show skeleton while initial data is loading
  const isInitialLoading = (isLoadingPublic && publicBalances.length === 0) || !isInitialized;
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  // Calculate totals for the hero section
  const totalPublicValue = publicBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const totalShieldedValue = shieldedBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const totalSessionValue = sessionBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  // Total includes: main wallet (public) + privacy pool (shielded) + session wallet (deposit address)
  const totalValue = totalPublicValue + totalShieldedValue + totalSessionValue;
  // Privacy score only considers public vs shielded (session funds are in-transit, not exposed)
  const privacyScore = calculatePrivacyScore(totalPublicValue, totalShieldedValue);

  return (
    <div className="space-y-6">
      {/* Hero Section - Total Portfolio Overview */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
        <h1 className="text-4xl font-bold mb-4">{formatUSD(totalValue)}</h1>

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
