import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/session/sync - Force sync a session keypair to the database
 *
 * Use this to manually migrate existing localStorage sessions to Supabase.
 * This is also called automatically when users connect with existing localStorage data.
 */
export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { sessionKeypairBase64 } = body;

    if (!sessionKeypairBase64) {
      return NextResponse.json(
        { error: 'Session keypair required' },
        { status: 400 }
      );
    }

    // Validate keypair format
    try {
      const decoded = Buffer.from(sessionKeypairBase64, 'base64');
      if (decoded.length !== 64) {
        throw new Error('Invalid keypair length');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid session keypair format' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, session_keypair')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser?.session_keypair) {
      // User already has a session keypair in DB
      return NextResponse.json({
        success: true,
        message: 'Session already exists in database',
        synced: false,
      });
    }

    // Upsert user with session keypair
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          wallet_address: walletAddress,
          session_keypair: sessionKeypairBase64,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'wallet_address',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Error syncing session:', error);
      return NextResponse.json(
        { error: 'Failed to sync session' },
        { status: 500 }
      );
    }

    console.log(`[Sync] Migrated session for wallet: ${walletAddress}`);

    return NextResponse.json({
      success: true,
      message: 'Session synced to database',
      synced: true,
    });
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/session/sync - Check sync status for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, wallet_address, session_keypair, created_at, updated_at')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking sync status:', error);
      return NextResponse.json(
        { error: 'Failed to check sync status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!user,
      hasSessionKeypair: !!user?.session_keypair,
      createdAt: user?.created_at || null,
      updatedAt: user?.updated_at || null,
    });
  } catch (error) {
    console.error('Sync status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Check failed' },
      { status: 500 }
    );
  }
}
