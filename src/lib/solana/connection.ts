import { Connection, clusterApiUrl } from "@solana/web3.js";

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (connection) return connection;
  
  const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || clusterApiUrl("mainnet-beta");
  connection = new Connection(rpcUrl, "confirmed");
  
  return connection;
}

export function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_HELIUS_RPC_URL || clusterApiUrl("mainnet-beta");
}
