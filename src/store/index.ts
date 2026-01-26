import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction, ProofOfFunds, PublicBalance, ShieldedBalance } from "@/types";

interface AppState {
  // Wallet
  walletAddress: string | null;
  setWallet: (address: string | null) => void;

  // Balances
  publicBalances: PublicBalance[];
  shieldedBalances: ShieldedBalance[];
  setPublicBalances: (balances: PublicBalance[]) => void;
  setShieldedBalances: (balances: ShieldedBalance[]) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;

  // Proofs
  proofs: ProofOfFunds[];
  addProof: (proof: ProofOfFunds) => void;
  removeProof: (id: string) => void;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState: Pick<AppState, 'walletAddress' | 'publicBalances' | 'shieldedBalances' | 'transactions' | 'proofs' | 'isLoading'> = {
  walletAddress: null,
  publicBalances: [] as PublicBalance[],
  shieldedBalances: [] as ShieldedBalance[],
  transactions: [] as Transaction[],
  proofs: [] as ProofOfFunds[],
  isLoading: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setWallet: (address) => set({ walletAddress: address }),

      setPublicBalances: (balances) => set({ publicBalances: balances }),
      setShieldedBalances: (balances) => set({ shieldedBalances: balances }),

      addTransaction: (tx) =>
        set((state) => ({
          transactions: [tx, ...state.transactions].slice(0, 50), // Keep last 50
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        })),

      addProof: (proof) =>
        set((state) => ({
          proofs: [proof, ...state.proofs],
        })),

      removeProof: (id) =>
        set((state) => ({
          proofs: state.proofs.filter((p) => p.id !== id),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      reset: () => set(initialState),
    }),
    {
      name: "whale-wallet-storage",
      partialize: (state) => ({
        transactions: state.transactions,
        proofs: state.proofs,
      }),
    }
  )
);
