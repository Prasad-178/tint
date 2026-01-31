/**
 * Solana Connection Utilities
 * Mainnet only - Helius RPC recommended for production
 */

import { Connection, clusterApiUrl } from "@solana/web3.js";

let connection: Connection | null = null;

/**
 * Get a cached Solana connection (mainnet)
 */
export function getConnection(): Connection {
  if (connection) return connection;

  const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || clusterApiUrl("mainnet-beta");
  connection = new Connection(rpcUrl, "confirmed");

  return connection;
}

/**
 * Get the mainnet RPC URL
 */
export function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_HELIUS_RPC_URL || clusterApiUrl("mainnet-beta");
}
