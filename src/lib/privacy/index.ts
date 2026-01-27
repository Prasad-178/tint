/**
 * Privacy.cash SDK Integration - Client Side
 *
 * This module provides client-side types and utilities for privacy operations.
 * The actual Privacy Cash SDK is only used on the server side (API routes)
 * because it requires Node.js modules.
 */

import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import type { TokenInfo, ShieldedBalance } from "@/types";

// Message used by Privacy Cash for deriving encryption keys
export const PRIVACY_CASH_SIGN_MESSAGE = "Privacy Money account sign in";

// Session keypair derivation message
export const SESSION_KEYPAIR_MESSAGE = "Tint Session Key Derivation";

// LocalStorage key prefixes
const SESSION_KEYPAIR_KEY_PREFIX = "tint_session_keypair_"; // Stores full keypair (64 bytes)
const SESSION_SIGNATURE_KEY_PREFIX = "tint_session_"; // Legacy: stores signature

/**
 * Derives a deterministic session keypair from a wallet signature
 * This keypair is used for privacy operations
 */
export function deriveSessionKeypair(signature: Uint8Array): Keypair {
  // Use first 32 bytes of signature as seed for session keypair
  const seed = signature.slice(0, 32);
  return Keypair.fromSeed(seed);
}

/**
 * Get cached session keypair from localStorage
 * First tries to get the full keypair, then falls back to deriving from signature
 */
function getCachedSessionKeypair(walletAddress: string): Keypair | null {
  if (typeof window === "undefined") return null;
  
  try {
    // First, try to get the full keypair (preferred)
    const keypairData = localStorage.getItem(`${SESSION_KEYPAIR_KEY_PREFIX}${walletAddress}`);
    if (keypairData) {
      const secretKey = new Uint8Array(Buffer.from(keypairData, "base64"));
      if (secretKey.length === 64) {
        return Keypair.fromSecretKey(secretKey);
      }
    }

    // Fall back to legacy: derive from signature
    const signatureData = localStorage.getItem(`${SESSION_SIGNATURE_KEY_PREFIX}${walletAddress}`);
    if (signatureData) {
      const signature = new Uint8Array(Buffer.from(signatureData, "base64"));
      const keypair = deriveSessionKeypair(signature);
      // Migrate to new format
      cacheSessionKeypair(walletAddress, keypair);
      return keypair;
    }
  } catch (e) {
    console.warn("Failed to read session from localStorage:", e);
  }
  return null;
}

/**
 * Cache session keypair in localStorage (stores the full 64-byte secret key)
 */
function cacheSessionKeypair(walletAddress: string, keypair: Keypair): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${SESSION_KEYPAIR_KEY_PREFIX}${walletAddress}`,
      Buffer.from(keypair.secretKey).toString("base64")
    );
  } catch (e) {
    console.warn("Failed to cache session in localStorage:", e);
  }
}

/**
 * Clear cached session data from localStorage
 */
function clearCachedSession(walletAddress: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${SESSION_KEYPAIR_KEY_PREFIX}${walletAddress}`);
    localStorage.removeItem(`${SESSION_SIGNATURE_KEY_PREFIX}${walletAddress}`); // Also clear legacy
  } catch (e) {
    console.warn("Failed to clear session from localStorage:", e);
  }
}

/**
 * Import a session keypair from base64 string
 */
export function importSessionKeypair(walletAddress: string, keypairBase64: string): Keypair | null {
  try {
    const secretKey = new Uint8Array(Buffer.from(keypairBase64, "base64"));
    if (secretKey.length !== 64) {
      console.error("Invalid keypair: expected 64 bytes");
      return null;
    }
    const keypair = Keypair.fromSecretKey(secretKey);
    cacheSessionKeypair(walletAddress, keypair);
    return keypair;
  } catch (e) {
    console.error("Failed to import session keypair:", e);
    return null;
  }
}

/**
 * Export the current session keypair as base64
 */
export function exportCurrentSessionKeypair(walletAddress: string): string | null {
  const keypair = getCachedSessionKeypair(walletAddress);
  if (!keypair) return null;
  return Buffer.from(keypair.secretKey).toString("base64");
}

/**
 * Fetch session keypair from database (if Supabase is configured)
 */
async function fetchSessionFromDatabase(walletAddress: string): Promise<Keypair | null> {
  try {
    const response = await fetch('/api/session', {
      method: 'GET',
      headers: {
        'x-wallet-address': walletAddress,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.sessionKeypair) {
        const secretKey = new Uint8Array(Buffer.from(data.sessionKeypair, "base64"));
        if (secretKey.length === 64) {
          return Keypair.fromSecretKey(secretKey);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch session from database:', error);
  }
  return null;
}

/**
 * Save session keypair to database (if Supabase is configured)
 */
async function saveSessionToDatabase(walletAddress: string, keypair: Keypair): Promise<void> {
  try {
    const sessionKeypairBase64 = Buffer.from(keypair.secretKey).toString("base64");
    await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress,
      },
      body: JSON.stringify({ sessionKeypairBase64 }),
    });
  } catch (error) {
    console.warn('Failed to save session to database:', error);
  }
}

/**
 * Client-side privacy operations configuration
 */
export interface ClientPrivacyConfig {
  connection: Connection;
  wallet: {
    publicKey: PublicKey;
    signTransaction: <T extends VersionedTransaction>(tx: T) => Promise<T>;
    signAllTransactions: <T extends VersionedTransaction>(txs: T[]) => Promise<T[]>;
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  };
}

/**
 * Client-side privacy client
 * Handles wallet signing and communicates with server APIs
 */
class ClientPrivacyClient {
  private config: ClientPrivacyConfig | null = null;
  private privacyCashSignature: Uint8Array | null = null;
  private sessionKeypair: Keypair | null = null;
  private sessionKeypairPromise: Promise<Keypair> | null = null;

  initialize(config: ClientPrivacyConfig) {
    this.config = config;
    // Try to restore session keypair from localStorage immediately
    if (config) {
      const walletAddress = config.wallet.publicKey.toBase58();
      const cachedKeypair = getCachedSessionKeypair(walletAddress);
      if (cachedKeypair) {
        this.sessionKeypair = cachedKeypair;
        console.log("Restored session keypair from localStorage:", cachedKeypair.publicKey.toBase58());
      }
    }
  }

  isInitialized(): boolean {
    return this.config !== null;
  }

  getConfig(): ClientPrivacyConfig | null {
    return this.config;
  }

  /**
   * Check if we have a cached session keypair (without prompting for signature)
   */
  hasCachedSession(): boolean {
    if (!this.config) return false;
    if (this.sessionKeypair) return true;
    const walletAddress = this.config.wallet.publicKey.toBase58();
    return getCachedSessionKeypair(walletAddress) !== null;
  }

  /**
   * Get the Privacy Cash signature from user
   * This signature is used to derive encryption keys for accessing shielded balances
   */
  async getPrivacyCashSignature(): Promise<Uint8Array> {
    if (!this.config) {
      throw new Error("Client not initialized");
    }

    if (this.privacyCashSignature) {
      return this.privacyCashSignature;
    }

    const message = new TextEncoder().encode(PRIVACY_CASH_SIGN_MESSAGE);
    this.privacyCashSignature = await this.config.wallet.signMessage(message);
    return this.privacyCashSignature;
  }

  /**
   * Get or create a session keypair for privacy operations
   * Priority: 1. In-memory cache, 2. Database (cross-device), 3. localStorage, 4. New signature
   */
  async getSessionKeypair(): Promise<Keypair> {
    if (!this.config) {
      throw new Error("Client not initialized");
    }

    // Return cached in-memory keypair if available
    if (this.sessionKeypair) {
      return this.sessionKeypair;
    }

    const walletAddress = this.config.wallet.publicKey.toBase58();

    // If a request is already in progress, wait for it
    if (this.sessionKeypairPromise) {
      return this.sessionKeypairPromise;
    }

    // Start the request and store the promise
    this.sessionKeypairPromise = (async () => {
      // 1. Try to restore from localStorage first (fastest)
      const cachedKeypair = getCachedSessionKeypair(walletAddress);
      if (cachedKeypair) {
        this.sessionKeypair = cachedKeypair;
        console.log("Using cached session keypair from localStorage:", cachedKeypair.publicKey.toBase58());
        // Sync to database in background (for cross-device access)
        saveSessionToDatabase(walletAddress, cachedKeypair).catch(() => {});
        return this.sessionKeypair;
      }

      // 2. Try to fetch from database (for cross-device persistence)
      console.log("Checking database for session...");
      const dbKeypair = await fetchSessionFromDatabase(walletAddress);
      if (dbKeypair) {
        this.sessionKeypair = dbKeypair;
        // Cache in localStorage for faster subsequent loads
        cacheSessionKeypair(walletAddress, dbKeypair);
        console.log("Restored session keypair from database:", dbKeypair.publicKey.toBase58());
        return this.sessionKeypair;
      }

      // 3. No existing session - create new one from signature
      console.log("No cached session found, requesting signature...");
      const message = new TextEncoder().encode(SESSION_KEYPAIR_MESSAGE);
      const signature = await this.config!.wallet.signMessage(message);

      this.sessionKeypair = deriveSessionKeypair(signature);
      console.log("Created new session keypair:", this.sessionKeypair.publicKey.toBase58());

      // Cache the full keypair in localStorage
      cacheSessionKeypair(walletAddress, this.sessionKeypair);
      
      // Also save to database for cross-device access
      saveSessionToDatabase(walletAddress, this.sessionKeypair).catch(() => {});

      return this.sessionKeypair;
    })();

    try {
      return await this.sessionKeypairPromise;
    } finally {
      this.sessionKeypairPromise = null;
    }
  }

  /**
   * Import a session keypair from base64 (for recovery)
   */
  importSession(keypairBase64: string): boolean {
    if (!this.config) {
      console.error("Client not initialized");
      return false;
    }
    const walletAddress = this.config.wallet.publicKey.toBase58();
    const keypair = importSessionKeypair(walletAddress, keypairBase64);
    if (keypair) {
      this.sessionKeypair = keypair;
      console.log("Imported session keypair:", keypair.publicKey.toBase58());
      return true;
    }
    return false;
  }

  /**
   * Get shielded balances via API
   */
  async getAllShieldedBalances(tokens: TokenInfo[]): Promise<ShieldedBalance[]> {
    if (!this.config) {
      throw new Error("Client not initialized");
    }

    try {
      // Get session keypair (this prompts user to sign if needed)
      const sessionKeypair = await this.getSessionKeypair();
      const sessionKeypairBase64 = Buffer.from(sessionKeypair.secretKey).toString("base64");

      const response = await fetch("/api/privacy/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": this.config.wallet.publicKey.toBase58(),
        },
        body: JSON.stringify({
          sessionKeypairBase64,
          tokenMints: tokens.map((t) => t.mint),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.balances || tokens.map((token) => ({ token, amount: 0 }));
      }

      console.error("Failed to fetch balances");
      return tokens.map((token) => ({ token, amount: 0 }));
    } catch (error) {
      console.error("Error fetching shielded balances:", error);
      return tokens.map((token) => ({ token, amount: 0 }));
    }
  }

  /**
   * Deposit tokens via API (shield tokens)
   */
  async deposit(tokenMint: string, amount: number): Promise<{ signature: string }> {
    if (!this.config) {
      throw new Error("Client not initialized");
    }

    const sessionKeypair = await this.getSessionKeypair();
    const sessionKeypairBase64 = Buffer.from(sessionKeypair.secretKey).toString("base64");

    const response = await fetch("/api/privacy/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wallet-address": this.config.wallet.publicKey.toBase58(),
      },
      body: JSON.stringify({
        sessionKeypairBase64,
        tokenMint,
        amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Deposit failed");
    }

    return await response.json();
  }

  /**
   * Withdraw tokens via API (unshield tokens)
   */
  async withdraw(
    tokenMint: string,
    amount: number,
    recipient: string
  ): Promise<{ signature: string; isPartial?: boolean }> {
    if (!this.config) {
      throw new Error("Client not initialized");
    }

    const sessionKeypair = await this.getSessionKeypair();
    const sessionKeypairBase64 = Buffer.from(sessionKeypair.secretKey).toString("base64");

    const response = await fetch("/api/privacy/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wallet-address": this.config.wallet.publicKey.toBase58(),
      },
      body: JSON.stringify({
        sessionKeypairBase64,
        tokenMint,
        amount,
        recipient,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Withdrawal failed");
    }

    return await response.json();
  }

  /**
   * Get the session keypair's public key
   */
  async getSessionPublicKey(): Promise<string> {
    const keypair = await this.getSessionKeypair();
    return keypair.publicKey.toBase58();
  }

  /**
   * Export session keypair as base64 string
   */
  async exportSessionKeypair(): Promise<string> {
    const keypair = await this.getSessionKeypair();
    return Buffer.from(keypair.secretKey).toString("base64");
  }

  /**
   * Reset the client state (call when wallet disconnects)
   * Note: This does NOT clear localStorage - the session persists for next login
   */
  reset() {
    this.config = null;
    this.privacyCashSignature = null;
    this.sessionKeypair = null;
    this.sessionKeypairPromise = null;
  }

  /**
   * Fully logout - clears localStorage cache too
   * Only use this when user explicitly wants to remove all session data
   */
  fullLogout(walletAddress: string) {
    this.reset();
    clearCachedSession(walletAddress);
  }

  /**
   * Get the wallet address associated with this client
   */
  getWalletAddress(): string | null {
    return this.config?.wallet.publicKey.toBase58() || null;
  }
}

// Singleton instance for client-side use
export const privacyClient = new ClientPrivacyClient();

export function initializePrivacyClient(config: ClientPrivacyConfig) {
  privacyClient.initialize(config);
}

export function resetPrivacyClient() {
  privacyClient.reset();
}

// Note: importSessionKeypair and exportCurrentSessionKeypair are already exported above
