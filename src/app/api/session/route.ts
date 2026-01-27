import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

/**
 * GET /api/session - Fetch stored session keypair for a wallet
 * 
 * This endpoint returns the stored session keypair from Supabase (if configured).
 * If Supabase is not configured, returns null (client will use localStorage).
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

    // If Supabase is not configured, return null
    // The client will fall back to localStorage
    if (!isSupabaseServerConfigured()) {
      return NextResponse.json({ sessionKeypair: null });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ sessionKeypair: null });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('session_keypair')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching session:', error);
      return NextResponse.json({ sessionKeypair: null });
    }

    return NextResponse.json({
      sessionKeypair: user?.session_keypair || null,
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    // Return null instead of error - client will use localStorage
    return NextResponse.json({ sessionKeypair: null });
  }
}

/**
 * POST /api/session - Store session keypair for a wallet
 * 
 * This endpoint stores the session keypair in Supabase (if configured).
 * If Supabase is not configured, returns success (client uses localStorage anyway).
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

    // If Supabase is not configured, just return success
    // The client stores in localStorage anyway
    if (!isSupabaseServerConfigured()) {
      console.log('Supabase not configured, session stored in localStorage only');
      return NextResponse.json({ success: true, storage: 'localStorage' });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: true, storage: 'localStorage' });
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
      console.error('Error saving session:', error);
      // Return success anyway - localStorage will work
      return NextResponse.json({ success: true, storage: 'localStorage' });
    }

    return NextResponse.json({ success: true, storage: 'supabase' });
  } catch (error) {
    console.error('Session save error:', error);
    // Return success - client uses localStorage as backup
    return NextResponse.json({ success: true, storage: 'localStorage' });
  }
}
