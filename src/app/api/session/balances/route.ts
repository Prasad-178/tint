import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { SUPPORTED_TOKENS, TOKENS } from "@/lib/solana/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionPublicKey } = body;

    if (!sessionPublicKey) {
      return NextResponse.json(
        { error: "Session public key required" },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");
    const sessionPubkey = new PublicKey(sessionPublicKey);

    const balances: Array<{
      token: typeof SUPPORTED_TOKENS[0];
      amount: number;
      usdValue: number;
    }> = [];

    // Check SOL balance (native)
    try {
      const solBalance = await connection.getBalance(sessionPubkey);
      const solAmount = solBalance / LAMPORTS_PER_SOL;
      balances.push({
        token: TOKENS.SOL,
        amount: solAmount,
        usdValue: 0,
      });
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      balances.push({
        token: TOKENS.SOL,
        amount: 0,
        usdValue: 0,
      });
    }

    // Check SPL token balances (USDC, USDT)
    for (const token of SUPPORTED_TOKENS) {
      if (token.mint === TOKENS.SOL.mint) continue;

      try {
        const mint = new PublicKey(token.mint);
        const ata = await getAssociatedTokenAddress(mint, sessionPubkey);
        const accountInfo = await connection.getAccountInfo(ata);

        if (accountInfo) {
          const rawBalance = accountInfo.data.readBigUInt64LE(64);
          const amount = Number(rawBalance) / Math.pow(10, token.decimals);
          balances.push({
            token,
            amount,
            usdValue: token.symbol === "USDC" || token.symbol === "USDT" ? amount : 0,
          });
        } else {
          balances.push({
            token,
            amount: 0,
            usdValue: 0,
          });
        }
      } catch (error) {
        console.error(`Error fetching ${token.symbol} balance:`, error);
        balances.push({
          token,
          amount: 0,
          usdValue: 0,
        });
      }
    }

    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Error in session balances endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch session balances" },
      { status: 500 }
    );
  }
}
