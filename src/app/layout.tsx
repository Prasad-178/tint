import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tint — Private Portfolio Manager",
  description:
    "Your holdings. Your secret. Manage your crypto privately with shielded balances on Solana.",
  keywords: [
    "Solana",
    "privacy",
    "crypto",
    "wallet",
    "tint",
    "portfolio",
    "shielded",
    "private",
  ],
  openGraph: {
    title: "Tint — Private Portfolio Manager",
    description:
      "Your holdings. Your secret. Manage your crypto privately with shielded balances on Solana.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tint — Private Portfolio Manager",
    description:
      "Your holdings. Your secret. Manage your crypto privately with shielded balances on Solana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <WalletProvider>
          <TooltipProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </TooltipProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
