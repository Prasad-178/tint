"use client";

import Link from "next/link";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Shield } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-6xl items-center justify-between px-4 mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-lg opacity-50" />
            <Shield className="relative h-8 w-8 text-emerald-500" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Tint
          </span>
        </Link>

        {/* Wallet Button */}
        <WalletButton />
      </div>
    </header>
  );
}
