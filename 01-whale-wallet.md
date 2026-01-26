# Whale Wallet - Private Portfolio Manager

## Project Overview

**Tagline:** "Your holdings. Your secret."

**The Problem:**
- Whale wallets are tracked by thousands of copy-traders and analysts
- KOLs can't accumulate without moving markets
- High-net-worth holders become targets for phishing, social engineering
- Portfolio composition reveals trading strategies to competitors

**The Solution:**
A dashboard for managing crypto holdings privately - deposit, view, and withdraw without anyone knowing your balance or address.

---

## Hackathon Targets

**Primary:** Privacy.cash SDK Bounty ($15K)
**Secondary:** Private Payments Track ($15K)
**Potential Total:** $30K

**Submission Due:** Feb 1 | **Winners:** Feb 10

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User connects wallet (Phantom, Solflare, etc.)              │
│  2. Views public wallet balance (traditional view)              │
│  3. One-click deposit to Privacy.cash shielded pool             │
│  4. Dashboard shows shielded balance (only user can see)        │
│  5. Generate "Proof of Funds" without revealing amount          │
│  6. Withdraw to any address (stealth withdrawal)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐         ┌──────────────┐                      │
│   │   Browser    │         │   Solana     │                      │
│   │   Frontend   │◄───────►│   Mainnet    │                      │
│   │   (Next.js)  │         │              │                      │
│   └──────┬───────┘         └──────┬───────┘                      │
│          │                        │                              │
│          │                        │                              │
│          ▼                        ▼                              │
│   ┌──────────────┐         ┌──────────────┐                      │
│   │   Wallet     │         │ Privacy.cash │                      │
│   │   Adapter    │         │   Program    │                      │
│   └──────────────┘         └──────────────┘                      │
│                                   │                              │
│                                   ▼                              │
│                            ┌──────────────┐                      │
│                            │   Shielded   │                      │
│                            │   Pool       │                      │
│                            └──────────────┘                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14 + TypeScript | Fast iteration, SSR for SEO |
| Styling | Tailwind CSS + shadcn/ui | Production-quality UI fast |
| Wallet | @solana/wallet-adapter-react | Multi-wallet support |
| Privacy | Privacy.cash SDK (`privacycash` npm) | Audited, simple API |
| State | Zustand | Lightweight, TypeScript native |
| Charts | Recharts or Tremor | Beautiful portfolio visualization |
| RPC | Helius | Fast, reliable, hackathon credits |

---

## Core Features (MVP)

### Must Have (Week 1)

#### 1. Wallet Connection & Public View
- Connect Phantom, Solflare, Backpack
- Show current public balances (SOL, USDC, USDT)
- Display "privacy score" (how trackable this wallet is)

#### 2. One-Click Shield
- Select token and amount
- Single transaction to Privacy.cash pool
- Show transaction progress
- Update dashboard with new shielded balance

#### 3. Shielded Balance Dashboard
- Display private holdings (SOL, USDC, USDT)
- Total portfolio value (private)
- Historical balance chart (local storage, not public)

#### 4. Stealth Withdrawal
- Enter any recipient address (can be fresh)
- Select amount to withdraw
- Privacy.cash handles unlinkability
- Transaction confirmation

#### 5. Proof of Funds (Signature Feature)
- Generate ZK proof: "I hold > $X"
- Shareable link/QR code
- Verifiable without revealing exact amount or address
- Use case: OTC deals, loan applications, DAO membership

### Nice to Have (Week 2)

- Portfolio performance tracking
- Price alerts (private, local only)
- Multiple "vaults" (separate shielded accounts)
- Export transaction history (encrypted)
- Dark mode

---

## Privacy Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHAT'S PUBLIC vs PRIVATE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PUBLIC (on-chain):                                             │
│  ├── Someone deposited X SOL to Privacy.cash                    │
│  ├── Someone withdrew Y USDC from Privacy.cash                  │
│  └── Privacy.cash pool total balance                            │
│                                                                 │
│  PRIVATE (only you know):                                       │
│  ├── Your shielded balance                                      │
│  ├── Connection between your deposits and withdrawals           │
│  ├── Withdrawal destination addresses                           │
│  └── Your portfolio composition                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key User Flows

### Flow 1: First-Time Shield

```
User arrives → Connect wallet → See public balance
    ↓
"Your wallet is 100% trackable" warning
    ↓
Click "Shield Now" → Select token/amount
    ↓
Sign transaction → Wait for confirmation
    ↓
Dashboard updates with shielded balance
    ↓
"You're now private" success state
```

### Flow 2: Proof of Funds

```
User needs to prove holdings for OTC deal
    ↓
Click "Generate Proof" → Select threshold ($10K, $50K, $100K)
    ↓
SDK generates ZK proof locally
    ↓
Copy shareable link or QR code
    ↓
Counterparty verifies (sees: "Holds > $50K" ✓)
    ↓
No balance, no address revealed
```

### Flow 3: Stealth Withdrawal

```
User wants to move funds to exchange
    ↓
Click "Withdraw" → Enter fresh address
    ↓
Select amount → Sign transaction
    ↓
Funds arrive at new address
    ↓
No link between original wallet and new address
```

---

## Database Design

**Note:** Minimal backend - most state is client-side or on-chain.

```typescript
// Local storage schema (encrypted with user's key)
interface LocalState {
  // Cached shielded balances (for faster UI)
  shieldedBalances: {
    SOL: string;
    USDC: string;
    USDT: string;
  };

  // Transaction history (local only)
  transactions: {
    id: string;
    type: 'deposit' | 'withdraw';
    token: string;
    amount: string;
    timestamp: number;
    txSignature: string;
  }[];

  // Generated proofs
  proofs: {
    id: string;
    threshold: number;
    createdAt: number;
    expiresAt: number;
    proofData: string;
  }[];
}
```

---

## Key Code Snippets

### 1. Privacy.cash Deposit

```typescript
import { deposit, getPrivateBalance } from 'privacycash';

export const shieldTokens = async (
  connection: Connection,
  wallet: WalletContextState,
  token: 'SOL' | 'USDC' | 'USDT',
  amount: number
) => {
  try {
    const tx = await deposit({
      connection,
      wallet: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      amount,
      token
    });

    return {
      success: true,
      signature: tx.signature
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 2. Get Shielded Balance

```typescript
export const getShieldedBalance = async (
  connection: Connection,
  wallet: WalletContextState
) => {
  const balances = {
    SOL: await getPrivateBalance({
      connection,
      wallet: wallet.publicKey,
      token: 'SOL'
    }),
    USDC: await getPrivateBalance({
      connection,
      wallet: wallet.publicKey,
      token: 'USDC'
    }),
    USDT: await getPrivateBalance({
      connection,
      wallet: wallet.publicKey,
      token: 'USDT'
    })
  };

  return balances;
};
```

### 3. Stealth Withdrawal

```typescript
import { withdraw } from 'privacycash';

export const stealthWithdraw = async (
  connection: Connection,
  wallet: WalletContextState,
  token: 'SOL' | 'USDC' | 'USDT',
  amount: number,
  recipientAddress: string
) => {
  const tx = await withdraw({
    connection,
    wallet: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    amount,
    token,
    recipient: new PublicKey(recipientAddress)
  });

  return tx.signature;
};
```

### 4. Proof of Funds Generation

```typescript
// This is conceptual - actual implementation depends on Privacy.cash SDK capabilities
export const generateProofOfFunds = async (
  wallet: WalletContextState,
  threshold: number // e.g., 50000 for $50K
) => {
  // Generate ZK proof that balance >= threshold
  // Without revealing actual balance

  const proof = await privacyCash.generateProof({
    wallet: wallet.publicKey,
    statement: `balance >= ${threshold}`,
    // Proof is valid for 24 hours
    validUntil: Date.now() + 24 * 60 * 60 * 1000
  });

  // Create shareable link
  const proofId = generateUUID();
  const shareableLink = `https://whalewallet.xyz/verify/${proofId}`;

  return {
    proofId,
    proofData: proof,
    shareableLink,
    threshold,
    expiresAt: proof.validUntil
  };
};
```

---

## UI/UX Design

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Whale Wallet                              [Connect Wallet] 🔌  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │  PUBLIC BALANCE     │    │  SHIELDED BALANCE   │            │
│  │  (Visible to all)   │    │  (Only you can see) │            │
│  │                     │    │                     │            │
│  │  SOL:  12.5         │    │  SOL:  ████.██      │            │
│  │  USDC: 5,000        │    │  USDC: ████.██      │            │
│  │                     │    │                     │            │
│  │  [Shield Now →]     │    │  [Withdraw →]       │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  PROOF OF FUNDS                                             ││
│  │                                                             ││
│  │  Generate a verifiable proof that you hold funds            ││
│  │  without revealing your balance or address.                 ││
│  │                                                             ││
│  │  Threshold: [$10K] [$50K] [$100K] [Custom]                 ││
│  │                                                             ││
│  │  [Generate Proof]                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  RECENT ACTIVITY                                            ││
│  │                                                             ││
│  │  ● Shielded 1,000 USDC         2 hours ago                 ││
│  │  ● Withdrew 5 SOL to 7xK...    1 day ago                   ││
│  │  ● Shielded 10 SOL             3 days ago                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprint Plan

### Week 1 (Jan 13-19): Core Functionality

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| Mon | Project setup (Next.js, Tailwind, shadcn) | Dev 1 | |
| Mon | Wallet adapter integration | Dev 2 | |
| Tue | Public balance display component | Dev 1 | |
| Tue | Privacy.cash SDK integration setup | Dev 2 | |
| Wed | Shield flow UI + integration | Dev 1 | |
| Wed | Shielded balance display | Dev 2 | |
| Thu | Withdrawal flow UI + integration | Dev 1 | |
| Thu | Transaction history (local storage) | Dev 2 | |
| Fri | End-to-end testing on devnet | Both | |
| Sat | Bug fixes, edge cases | Both | |
| Sun | Buffer / catch up | Both | |

### Week 2 (Jan 20-26): Polish & Demo

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| Mon | Proof of Funds feature | Dev 1 | |
| Mon | UI polish, animations | Dev 2 | |
| Tue | Portfolio charts | Dev 1 | |
| Tue | Mobile responsive | Dev 2 | |
| Wed | Mainnet deployment | Both | |
| Thu | Demo video recording | Both | |
| Fri | Documentation, README | Both | |
| Sat | Final testing | Both | |
| Sun | Submit! | Both | |

---

## Demo Video Script (3 min max)

### 0:00-0:30 - The Problem
- Show a whale wallet on Solscan
- "This wallet holds $2M. Everyone knows it."
- "Copy traders follow every move. Competitors see the strategy."
- "What if you could hold crypto without anyone knowing?"

### 0:30-0:45 - Introduce Whale Wallet
- "Introducing Whale Wallet - your holdings, your secret"
- Quick logo/branding shot

### 0:45-2:15 - Live Demo
1. Connect wallet (show public balance)
2. Click "Shield Now" → deposit 1000 USDC
3. Show shielded balance (only we can see)
4. Generate "Proof of Funds" for $500
5. Show shareable link verification
6. Withdraw to fresh address
7. Show that original wallet has no trace

### 2:15-2:45 - Why It Matters
- "Built on Privacy.cash - audited ZK privacy pools"
- "Fully non-custodial - we never touch your keys"
- "Perfect for whales, KOLs, and anyone who values privacy"

### 2:45-3:00 - Call to Action
- Team intro
- GitHub link
- "Try it now at whalewallet.xyz"

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Privacy.cash SDK issues | Medium | High | Test early, join Discord, fallback plan |
| Proof of Funds not in SDK | Medium | Medium | Build simpler version or cut feature |
| RPC rate limits | Low | Medium | Use Helius, implement caching |
| Not enough time | Medium | High | Cut nice-to-haves, focus on core flow |

---

## Success Criteria

### For Judges
- ✅ Working demo on mainnet
- ✅ Clean, professional UI
- ✅ Clear value proposition
- ✅ Privacy.cash SDK integration
- ✅ Compelling 3-min video

### Technical
- User can deposit, view shielded balance, withdraw
- Deposits and withdrawals are unlinkable
- No critical bugs in demo flow

---

## Future Roadmap (Post-Hackathon)

1. **Multi-chain support** - Bridge privacy to Ethereum, Base
2. **Mobile app** - React Native version
3. **Privacy DeFi** - Shield → Swap → Shield flows
4. **Institutional tier** - Compliance-friendly audit trails
5. **Token** - Governance and fee sharing
