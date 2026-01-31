-- Tint Database Schema
-- Run this in Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table
-- ============================================
-- Stores wallet addresses and their session keypairs
-- Session keypairs are used for privacy operations
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    session_keypair TEXT, -- Base64 encoded session keypair (persistent across devices)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX idx_users_wallet_address ON users(wallet_address);

-- ============================================
-- Transactions Table (Optional)
-- ============================================
-- Tracks deposit and withdrawal history
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    token_mint TEXT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    tx_signature TEXT,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow service key to manage users
CREATE POLICY "Service can read all users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Service can insert users"
    ON users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service can update users"
    ON users FOR UPDATE
    USING (true);

-- Allow service key to manage transactions
CREATE POLICY "Service can read all transactions"
    ON transactions FOR SELECT
    USING (true);

CREATE POLICY "Service can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Helper Functions
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at on users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
