import { PublicKey } from "@solana/web3.js";

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI: string;
}

export const TOKENS: Record<string, TokenInfo> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  },
};

export type TokenSymbol = keyof typeof TOKENS;

export const SUPPORTED_TOKENS = [TOKENS.SOL, TOKENS.USDC, TOKENS.USDT];

// Mint addresses for easy reference
export const SOL_MINT = TOKENS.SOL.mint;
export const USDC_MINT = TOKENS.USDC.mint;
export const USDT_MINT = TOKENS.USDT.mint;

export const getTokenPublicKey = (mint: string): PublicKey => {
  return new PublicKey(mint);
};

export const getTokenByMint = (mint: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find((t) => t.mint === mint);
};

export const getTokenBySymbol = (symbol: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
};

// Mainnet RPC endpoint (Helius recommended for production)
export const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
