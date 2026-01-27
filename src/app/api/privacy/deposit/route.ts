import { NextRequest, NextResponse } from "next/server";
import { createServerPrivacyClient } from "@/lib/privacy/server";
import { USDC_MINT, SOL_MINT, USDT_MINT } from "@/lib/solana/constants";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

// Minimum SOL required for transaction fees (Privacy Cash needs ~0.005 SOL)
const MIN_SOL_FOR_FEES = 0.005 * LAMPORTS_PER_SOL;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { sessionKeypairBase64, tokenMint, amount } = body;

    // Validate inputs
    if (!sessionKeypairBase64) {
      return NextResponse.json(
        { error: "Session keypair is required. Please reconnect your wallet." },
        { status: 400 }
      );
    }

    if (!tokenMint) {
      return NextResponse.json(
        { error: "Token mint address is required." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid amount greater than 0." },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";

    // Parse and validate session keypair
    let keypair: Keypair;
    try {
      const secretKey = Buffer.from(sessionKeypairBase64, "base64");
      if (secretKey.length !== 64) {
        throw new Error("Invalid keypair length");
      }
      keypair = Keypair.fromSecretKey(secretKey);
    } catch (e) {
      console.error("Invalid session keypair:", e);
      return NextResponse.json(
        { error: "Invalid session keypair. Please try reconnecting your wallet." },
        { status: 400 }
      );
    }

    const sessionAddress = keypair.publicKey.toBase58();
    console.log(`[Deposit] Session wallet: ${sessionAddress}`);
    console.log(`[Deposit] Token: ${tokenMint}, Amount: ${amount}`);

    const connection = new Connection(rpcUrl, "confirmed");

    // Check SOL balance for fees
    const solBalance = await connection.getBalance(keypair.publicKey);
    console.log(`[Deposit] SOL balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);

    if (solBalance < MIN_SOL_FOR_FEES) {
      const currentSol = (solBalance / LAMPORTS_PER_SOL).toFixed(4);
      const neededSol = (MIN_SOL_FOR_FEES / LAMPORTS_PER_SOL).toFixed(3);
      return NextResponse.json(
        {
          error: `Insufficient SOL for transaction fees. Your session wallet has ${currentSol} SOL but needs at least ${neededSol} SOL. Please send more SOL to: ${sessionAddress}`,
          details: {
            sessionWallet: sessionAddress,
            currentSol: parseFloat(currentSol),
            requiredSol: parseFloat(neededSol),
          },
        },
        { status: 400 }
      );
    }

    // For token deposits, verify token balance
    if (tokenMint !== SOL_MINT) {
      const tokenMintPubkey = new PublicKey(tokenMint);
      const ata = await getAssociatedTokenAddress(tokenMintPubkey, keypair.publicKey);
      const accountInfo = await connection.getAccountInfo(ata);

      if (!accountInfo) {
        return NextResponse.json(
          {
            error: `No token account found in session wallet. Please transfer tokens to: ${sessionAddress}`,
            details: {
              sessionWallet: sessionAddress,
              tokenAccount: ata.toBase58(),
              hint: "Transfer the tokens you want to shield to your session wallet first.",
            },
          },
          { status: 400 }
        );
      }

      // Get token decimals (USDC/USDT = 6)
      const decimals = tokenMint === USDC_MINT || tokenMint === USDT_MINT ? 6 : 6;
      const multiplier = Math.pow(10, decimals);
      
      const tokenBalance = accountInfo.data.readBigUInt64LE(64);
      const tokenAmount = Number(tokenBalance) / multiplier;
      console.log(`[Deposit] Token balance: ${tokenAmount}`);

      // Allow 1% slippage for rounding
      if (tokenAmount < amount * 0.99) {
        return NextResponse.json(
          {
            error: `Insufficient token balance. Session wallet has ${tokenAmount.toFixed(4)} but you're trying to shield ${amount.toFixed(4)}.`,
            details: {
              sessionWallet: sessionAddress,
              availableBalance: tokenAmount,
              requestedAmount: amount,
            },
          },
          { status: 400 }
        );
      }
    } else {
      // For SOL deposits, check if we have enough SOL for deposit + fees
      const requiredLamports = Math.floor(amount * LAMPORTS_PER_SOL) + MIN_SOL_FOR_FEES;
      if (solBalance < requiredLamports) {
        const availableSol = ((solBalance - MIN_SOL_FOR_FEES) / LAMPORTS_PER_SOL);
        return NextResponse.json(
          {
            error: `Insufficient SOL. After reserving ${(MIN_SOL_FOR_FEES / LAMPORTS_PER_SOL).toFixed(3)} SOL for fees, you can only shield ${Math.max(0, availableSol).toFixed(4)} SOL.`,
            details: {
              sessionWallet: sessionAddress,
              totalSol: solBalance / LAMPORTS_PER_SOL,
              availableToShield: Math.max(0, availableSol),
            },
          },
          { status: 400 }
        );
      }
    }

    // Initialize Privacy Cash client
    console.log(`[Deposit] Initializing Privacy Cash client...`);
    const privacyClient = await createServerPrivacyClient(rpcUrl, sessionKeypairBase64);

    let result;

    if (tokenMint === SOL_MINT) {
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
      console.log(`[Deposit] Depositing ${lamports} lamports (${amount} SOL)...`);
      result = await privacyClient.depositSOL(lamports);
    } else if (tokenMint === USDC_MINT) {
      const baseUnits = Math.floor(amount * 1e6);
      console.log(`[Deposit] Depositing ${baseUnits} USDC base units (${amount} USDC)...`);
      result = await privacyClient.depositUSDC(baseUnits);
    } else if (tokenMint === USDT_MINT) {
      const baseUnits = Math.floor(amount * 1e6);
      console.log(`[Deposit] Depositing ${baseUnits} USDT base units (${amount} USDT)...`);
      result = await privacyClient.depositSPL(tokenMint, baseUnits);
    } else {
      const baseUnits = Math.floor(amount * 1e6);
      console.log(`[Deposit] Depositing ${baseUnits} base units of token ${tokenMint}...`);
      result = await privacyClient.depositSPL(tokenMint, baseUnits);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Deposit] Success! Tx: ${result.tx} (took ${elapsed}ms)`);

    return NextResponse.json({ 
      signature: result.tx,
      success: true,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[Deposit] Error after ${elapsed}ms:`, error);
    
    // Provide more helpful error messages
    let errorMessage = "Deposit failed";
    if (error instanceof Error) {
      if (error.message.includes("insufficient")) {
        errorMessage = "Insufficient balance for this transaction. Please check your session wallet.";
      } else if (error.message.includes("timeout") || error.message.includes("network")) {
        errorMessage = "Network error. Please try again in a moment.";
      } else if (error.message.includes("blockhash")) {
        errorMessage = "Transaction expired. Please try again.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
