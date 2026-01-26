# Tint - Private Portfolio Manager

> **"Your holdings. Your secret."**

A privacy-focused crypto portfolio manager built on Solana using the Privacy.cash SDK. Tint allows users to deposit, view, and withdraw crypto without anyone knowing their balance or address.

![Tint](https://img.shields.io/badge/Solana-Privacy-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)

## The Problem

- Large wallets are tracked by thousands of copy-traders and analysts
- KOLs can't accumulate without moving markets
- High-net-worth holders become targets for phishing and social engineering
- Portfolio composition reveals trading strategies to competitors

## The Solution

Tint provides a dashboard for managing crypto holdings privately:
- **Shield tokens** - One-click deposit to a shielded pool
- **Private balances** - Only you can see your holdings
- **Stealth withdrawals** - Withdraw to any address with no trace
- **Proof of Funds** - Verify holdings without revealing amounts

## Features

### Core Features
- **Wallet Connection** - Connect Phantom, Solflare, or other Solana wallets
- **Public Balance View** - See what's visible to trackers (with privacy score)
- **One-Click Shield** - Deposit SOL, USDC, or USDT to Privacy.cash pool
- **Shielded Balance Dashboard** - View your private holdings
- **Stealth Withdrawal** - Withdraw to fresh addresses for maximum privacy
- **Proof of Funds** - Generate shareable ZK proofs of holdings

### Privacy Model

| Public (on-chain) | Private (only you) |
|-------------------|-------------------|
| Someone deposited X SOL | Your shielded balance |
| Someone withdrew Y USDC | Connection between deposits/withdrawals |
| Pool total balance | Withdrawal destinations |
| | Your portfolio composition |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 + TypeScript |
| Styling | Tailwind CSS v4 |
| Wallet | @solana/wallet-adapter |
| Privacy | Privacy.cash SDK |
| State | Zustand |
| UI Components | Radix UI |

## Getting Started

### Prerequisites

- Node.js v20 or higher
- A Solana wallet (Phantom recommended)
- Helius RPC API key (for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tint.git
cd tint

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your Helius API key to .env.local
# NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
npm run build
npm start
```

## Usage

### Shielding Tokens

1. Connect your wallet
2. View your public balances (with privacy score)
3. Click "Shield" on any token
4. Approve the transaction
5. Your tokens are now private!

### Stealth Withdrawal

1. Navigate to Shielded Balance
2. Click "Withdraw" on any token
3. Choose "My Wallet" or "Fresh Address"
4. Enter amount and confirm
5. Funds arrive with no link to original wallet

### Proof of Funds

1. Go to the Proof of Funds section
2. Select a threshold ($10K, $50K, etc.)
3. Click "Generate Proof"
4. Share the link or QR code
5. Counterparty verifies without seeing your balance

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes for privacy operations
│   ├── verify/[id]/       # Proof verification page
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main dashboard
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── providers/         # Context providers
│   ├── ui/               # Reusable UI components
│   └── wallet/           # Wallet connection
├── hooks/                 # Custom React hooks
├── lib/
│   ├── privacy/          # Privacy.cash SDK wrapper
│   └── solana/           # Solana utilities
├── store/                # Zustand state management
└── types/                # TypeScript types
```

## Security

- **Non-custodial** - We never have access to your private keys
- **Client-side encryption** - Session keys derived from wallet signatures
- **Audited** - Privacy.cash SDK is audited by Zigtur
- **Open source** - All code is publicly verifiable

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Privacy.cash](https://privacycash.co) - Privacy pool protocol
- [Helius](https://helius.dev) - Solana RPC infrastructure
- Built for the Privacy.cash SDK Hackathon 2026

---

**Tint** - Your holdings. Your secret.
