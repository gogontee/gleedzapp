// app/api/paypal/route.js
import { NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request) {
  try {
    const { captureId, userId, tokenAmount, orderId } = await request.json();
    
    // Validate inputs
    if (!captureId || !userId || !tokenAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Get PayPal access token
    const auth = Buffer.from(
      `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('PayPal auth error:', tokenData);
      return NextResponse.json(
        { error: 'PayPal authentication failed' },
        { status: 500 }
      );
    }

    // Step 2: Verify capture with PayPal
    const captureResponse = await fetch(
      `https://api-m.paypal.com/v2/payments/captures/${captureId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const captureDetails = await captureResponse.json();
    
    // Step 3: Validate payment status
    if (captureDetails.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed', status: captureDetails.status },
        { status: 400 }
      );
    }

    // Step 4: Check if already processed
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference', `PAYPAL_${captureId}`)
      .single();

    if (existingTx) {
      return NextResponse.json(
        { error: 'Transaction already processed' },
        { status: 409 }
      );
    }

    // Step 5: Update wallet balance
    const { data: currentWallet } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const currentBalance = currentWallet?.balance || 0;
    const newBalance = currentBalance + tokenAmount;
    const actionDescription = `top up from paypal - ${tokenAmount} tokens - Ref: ${captureId}`;

    // Update or create wallet
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

    // Step 6: Record transaction
    const nairaAmount = tokenAmount * 1000;
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        reference: `PAYPAL_${captureId}`,
        order_id: orderId,
        token_amount: tokenAmount,
        naira_amount: nairaAmount,
        usd_amount: captureDetails.amount?.value || 0,
        status: 'completed',
        type: 'deposit',
        description: 'top up from paypal',
        metadata: captureDetails,
        created_at: new Date().toISOString()
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      throw new Error('Failed to record transaction');
    }

    // Step 7: Return success
    return NextResponse.json({
      success: true,
      captureId,
      tokenAmount,
      newBalance,
      nairaAmount
    });

  } catch (error) {
    console.error('PayPal verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', details: error.message },
      { status: 500 }
    );
  }
}