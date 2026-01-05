import { NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request) {
  try {
    const { userId, captureId, tokenAmount, guestToken } = await request.json();
    
    if (!userId || !captureId || !tokenAmount || !guestToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the guest token hasn't been claimed
    const { data: existingClaim } = await supabase
      .from('guest_claims')
      .select('id')
      .eq('guest_token', guestToken)
      .single();

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Tokens already claimed' },
        { status: 409 }
      );
    }

    // Update wallet balance
    const { data: currentWallet } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const currentBalance = currentWallet?.balance || 0;
    const newBalance = currentBalance + tokenAmount;
    const actionDescription = `claimed guest payment - ${tokenAmount} tokens - Ref: ${captureId}`;

    // Update wallet
    const { error: walletError } = await supabase
      .from('token_wallets')
      .upsert({
        user_id: userId,
        balance: newBalance,
        last_action: actionDescription,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (walletError) {
      console.error('Wallet update error:', walletError);
      throw new Error('Failed to update wallet');
    }

    // Record transaction
    const nairaAmount = tokenAmount * 1000;
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        reference: `PAYPAL_GUEST_${captureId}`,
        token_amount: tokenAmount,
        naira_amount: nairaAmount,
        status: 'completed',
        type: 'deposit',
        description: 'claimed guest paypal payment',
        created_at: new Date().toISOString()
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      throw new Error('Failed to record transaction');
    }

    // Record guest claim
    await supabase
      .from('guest_claims')
      .insert({
        guest_token: guestToken,
        user_id: userId,
        capture_id: captureId,
        token_amount: tokenAmount,
        claimed_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      newBalance,
      tokenAmount,
      claimed: true
    });

  } catch (error) {
    console.error('Claim guest tokens error:', error);
    return NextResponse.json(
      { error: 'Failed to claim tokens', details: error.message },
      { status: 500 }
    );
  }
}