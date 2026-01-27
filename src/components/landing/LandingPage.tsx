"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Zap,
  FileCheck,
  ShieldCheck,
  Wallet,
  ArrowDownUp,
  Code,
} from "lucide-react";

export function LandingPage() {
  const { setVisible } = useWalletModal();

  return (
    <div className="min-h-[calc(100vh-12rem)]">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm mb-6">
            <ShieldCheck className="h-4 w-4" />
            <span>Non-custodial privacy on Solana</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Keep your portfolio
            <br />
            <span className="text-emerald-500">private</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Shield your tokens from on-chain trackers, copy-traders, and prying eyes.
            Withdraw to any wallet without revealing your holdings.
          </p>

          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            onClick={() => setVisible(true)}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">How it works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-6 w-6 text-amber-500" />
              </div>
              <div className="text-sm text-muted-foreground mb-2">Step 1</div>
              <h3 className="font-semibold mb-2">See what&apos;s exposed</h3>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to see which assets are publicly visible on-chain.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="text-sm text-muted-foreground mb-2">Step 2</div>
              <h3 className="font-semibold mb-2">Shield your tokens</h3>
              <p className="text-sm text-muted-foreground">
                Deposit tokens into a private shielded pool. Only you can see your balance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <ArrowDownUp className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-sm text-muted-foreground mb-2">Step 3</div>
              <h3 className="font-semibold mb-2">Withdraw privately</h3>
              <p className="text-sm text-muted-foreground">
                Withdraw to any wallet address with no on-chain link to your original deposit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">Why use Tint?</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <EyeOff className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="font-semibold mb-2">Stop copy-traders</h3>
              <p className="text-sm text-muted-foreground">
                Your wallet activity is public. Anyone can see your trades, copy your moves,
                or front-run your transactions. Shielded tokens break the link.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <Shield className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="font-semibold mb-2">Non-custodial</h3>
              <p className="text-sm text-muted-foreground">
                You maintain full control of your funds at all times. No third party
                ever has access to your private keys or tokens.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <FileCheck className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="font-semibold mb-2">Proof of funds</h3>
              <p className="text-sm text-muted-foreground">
                Generate verifiable proofs that you hold a minimum balance without
                revealing your exact amount or wallet address.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <Zap className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="font-semibold mb-2">Fast & low fees</h3>
              <p className="text-sm text-muted-foreground">
                Built on Solana for fast confirmations and low transaction costs.
                Shield and withdraw in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-4">How privacy works</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Your funds are protected by cryptographic techniques, not trusted third parties.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-border bg-card">
              <Code className="h-6 w-6 text-emerald-500 mb-3" />
              <h3 className="font-semibold mb-2 text-sm">Shielded pool</h3>
              <p className="text-xs text-muted-foreground">
                Tokens are deposited into a shared pool. When you withdraw, the on-chain
                link between deposit and withdrawal is broken.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <Lock className="h-6 w-6 text-emerald-500 mb-3" />
              <h3 className="font-semibold mb-2 text-sm">Encrypted balances</h3>
              <p className="text-xs text-muted-foreground">
                Your shielded balance is encrypted with keys derived from your wallet.
                Only you can decrypt and view your private holdings.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <ShieldCheck className="h-6 w-6 text-emerald-500 mb-3" />
              <h3 className="font-semibold mb-2 text-sm">Session wallet</h3>
              <p className="text-xs text-muted-foreground">
                A derived keypair handles privacy operations. Your main wallet only signs
                once to generate the session, then stays disconnected from private actions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-12 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Non-custodial</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <span>Client-side encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-500" />
              <span>Open source</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span>No KYC required</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
