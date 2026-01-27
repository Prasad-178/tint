"use client";

import Link from "next/link";
import { Shield, Github, Twitter, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold">Tint</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Your holdings. Your secret.</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="https://docs.privacycash.co"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link
              href="https://privacycash.co"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              Powered by Privacy.cash
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>
            Tint is a non-custodial privacy solution. We never have access to your private keys or funds.
          </p>
          <p className="mt-1">
            Built for the Privacy.cash SDK Hackathon 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
