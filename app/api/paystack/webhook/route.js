// app/api/paystack/webhook/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin access
);

export async function POST(request) {
  try {
    const body = await request.text();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    
    // Verify the webhook signature
    const hash = crypto.createHmac('sha512', secret)
                       .update(body)
                       .digest('hex');
    
    const signature = request.headers.get('x-paystack-signature');
    
    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log('Webhook received:', event.event);

    // Handle successful charge
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      
      // Extract user data from metadata
      const userId = metadata?.custom_fields?.find(
        field => field.variable_name === 'user_id'
      )?.value;
      
      const tokenAmount = metadata?.custom_fields?.find(
        field => field.variable_name === 'token_amount'
      )?.value;

      if (!userId || !tokenAmount) {
        console.error('Missing user ID or token amount in webhook');
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      console.log(`Processing webhook: Adding ${tokenAmount} tokens to user ${userId}`);

      // Update wallet balance
      await updateWalletBalance(userId, parseInt(tokenAmount));
      
      // Record transaction
      await recordTransaction(userId, reference, parseInt(tokenAmount));

      console.log(`Webhook processed successfully for user ${userId}`);
    }

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update wallet balance
async function updateWalletBalance(userId, tokensToAdd) {
  try {
    // Get current balance
    const { data: currentWallet, error: fetchError } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching wallet:', fetchError);
      // Create wallet if it doesn't exist
      const { error: createError } = await supabase
        .from('token_wallets')
        .insert({
          user_id: userId,
          balance: tokensToAdd,
          updated_at: new Date().toISOString()
        });

      if (createError) {
        throw new Error(`Failed to create wallet: ${createError.message}`);
      }
    } else {
      // Update existing wallet
      const currentBalance = currentWallet?.balance || 0;
      const newBalance = currentBalance + tokensToAdd;

      const { error: updateError } = await supabase
        .from('token_wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update wallet: ${updateError.message}`);
      }
    }
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
}

// Record transaction
async function recordTransaction(userId, reference, tokenAmount) {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        reference: reference,
        token_amount: tokenAmount,
        naira_amount: tokenAmount * 1000,
        status: 'completed',
        type: 'deposit',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in recordTransaction:', error);
    throw error;
  }
}