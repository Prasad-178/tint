import { NextRequest, NextResponse } from "next/server";
import { createServerPrivacyClient } from "@/lib/privacy/server";
import { USDC_MINT, SOL_MINT, USDT_MINT } from "@/lib/solana/constants";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionKeypairBase64, tokenMint, amount } = body;

    if (!sessionKeypairBase64) {
      return NextResponse.json(
        { error: "Session keypair required" },
        { status: 400 }
      );
    }

    if (!tokenMint || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Token mint and positive amount required" },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";

    // Pre-flight check: verify session wallet has funds
    const secretKey = Buffer.from(sessionKeypairBase64, "base64");
    const keypair = Keypair.fromSecretKey(secretKey);
    const connection = new Connection(rpcUrl);

    // Check SOL balance for fees
    const solBalance = await connection.getBalance(keypair.publicKey);
    console.log(`Session wallet SOL balance: ${solBalance / 1e9} SOL`);

    if (solBalance < 0.005 * 1e9) {
      return NextResponse.json(
        {
          error: `Insufficient SOL for transaction fees. Have ${(solBalance / 1e9).toFixed(4)} SOL, need at least 0.005 SOL`,
        },
        { status: 400 }
      );
    }

    // If depositing a token, check token balance
    if (tokenMint === USDC_MINT || tokenMint === USDT_MINT) {
      const tokenMintPubkey = new PublicKey(tokenMint);
      const ata = await getAssociatedTokenAddress(tokenMintPubkey, keypair.publicKey);
      const accountInfo = await connection.getAccountInfo(ata);

      if (!accountInfo) {
        return NextResponse.json(
          { error: "No token account found in session wallet. Please transfer tokens first." },
          { status: 400 }
        );
      }

      const tokenBalance = accountInfo.data.readBigUInt64LE(64);
      const tokenAmount = Number(tokenBalance) / 1e6;
      console.log(`Session wallet token balance: ${tokenAmount}`);

      if (tokenAmount < amount * 0.99) {
        return NextResponse.json(
          {
            error: `Insufficient token balance. Have ${tokenAmount.toFixed(2)}, trying to deposit ${amount}`,
          },
          { status: 400 }
        );
      }
    }

    // Initialize Privacy Cash client
    const privacyClient = await createServerPrivacyClient(rpcUrl, sessionKeypairBase64);

    let result;

    if (tokenMint === SOL_MINT) {
      const lamports = Math.floor(amount * 1e9);
      result = await privacyClient.depositSOL(lamports);
    } else if (tokenMint === USDC_MINT) {
      const baseUnits = Math.floor(amount * 1e6);
      result = await privacyClient.depositUSDC(baseUnits);
    } else if (tokenMint === USDT_MINT) {
      const baseUnits = Math.floor(amount * 1e6);
      result = await privacyClient.depositSPL(tokenMint, baseUnits);
    } else {
      const baseUnits = Math.floor(amount * 1e6);
      result = await privacyClient.depositSPL(tokenMint, baseUnits);
    }

    return NextResponse.json({ signature: result.tx });
  } catch (error) {
    console.error("Error in deposit endpoint:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Deposit failed" },
      { status: 500 }
    );
  }
}
