import type { TokenInfo } from "@/lib/solana/constants";

export type { TokenInfo };

export interface ShieldedBalance {
  token: TokenInfo;
  amount: number;
  usdValue?: number;
}

export interface PublicBalance {
  token: TokenInfo;
  amount: number;
  usdValue?: number;
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw";
  token: TokenInfo;
  amount: number;
  timestamp: number;
  txSignature: string;
  status: "pending" | "success" | "failed";
}

export interface ProofOfFunds {
  id: string;
  threshold: number;
  createdAt: number;
  expiresAt: number;
  proofData: string;
  shareableLink: string;
}

export interface WalletState {
  address: string | null;
  publicBalances: PublicBalance[];
  shieldedBalances: ShieldedBalance[];
  transactions: Transaction[];
  proofs: ProofOfFunds[];
  isLoading: boolean;
}

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

// Local storage schema (encrypted with user's key)
export interface LocalState {
  // Cached shielded balances (for faster UI)
  shieldedBalances: {
    SOL: string;
    USDC: string;
    USDT: string;
  };

  // Transaction history (local only)
  transactions: Transaction[];

  // Generated proofs
  proofs: ProofOfFunds[];
}
