// /app/api/vote/verify-paypal/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PayPal API credentials
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

// Function to get PayPal access token
async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayPal auth failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
}

// Function to verify PayPal payment
async function verifyPayPalPayment(orderId, captureId) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal verification failed:', errorData);
      return {
        verified: false,
        error: errorData.message || `PayPal API returned ${response.status}`,
        captureId: null
      };
    }

    const data = await response.json();
    
    // Check if payment is completed
    if (data.status === 'COMPLETED') {
      // Find the capture ID from the response
      const purchaseUnit = data.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];
      const actualCaptureId = capture?.id;
      
      // If a specific captureId was provided, verify it matches
      if (captureId && actualCaptureId !== captureId) {
        console.warn('Capture ID mismatch:', { provided: captureId, actual: actualCaptureId });
        // We still proceed since the order is completed, but log the mismatch
      }

      return {
        verified: true,
        status: data.status,
        captureId: actualCaptureId || captureId,
        payerEmail: data.payer?.email_address,
        payerName: data.payer?.name?.given_name + ' ' + data.payer?.name?.surname,
        amount: capture?.amount?.value || purchaseUnit?.amount?.value,
        currency: capture?.amount?.currency_code || purchaseUnit?.amount?.currency_code,
        transactionData: data
      };
    }

    return {
      verified: false,
      status: data.status,
      error: `Payment status is ${data.status}, not COMPLETED`,
      captureId: null
    };
    
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return {
      verified: false,
      error: error.message,
      captureId: null
    };
  }
}

// Function to update candidate votes
async function updateCandidateVotes(candidateId, points) {
  try {
    // Get current votes
    const { data: candidateData, error: fetchError } = await supabase
      .from('candidates')
      .select('votes, gifts')
      .eq('id', candidateId)
      .single();

    if (fetchError) throw fetchError;

    // Calculate new votes and points
    const newVotes = (candidateData?.votes || 0) + points;
    const newPoints = (newVotes + (candidateData?.gifts || 0)) / 10;

    // Update candidate
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ 
        votes: newVotes, 
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (updateError) throw updateError;

    return {
      success: true,
      newVotes,
      newPoints
    };
  } catch (error) {
    console.error('Error updating candidate votes:', error);
    throw error;
  }
}

// Function to update publisher wallet
async function updatePublisherWallet(publisherId, tokenAmount) {
  try {
    // Get publisher's current wallet
    const { data: publisherWallet, error: fetchError } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', publisherId)
      .single();

    if (fetchError) {
      // If wallet doesn't exist, create it
      if (fetchError.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('token_wallets')
          .insert({ 
            user_id: publisherId, 
            balance: tokenAmount,
            last_action: `Receive vote via PayPal - ${tokenAmount} tokens`,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        return newWallet;
      }
      throw fetchError;
    }

    // Update existing wallet
    const newBalance = publisherWallet.balance + tokenAmount;
    const { error: updateError } = await supabase
      .from('token_wallets')
      .update({ 
        balance: newBalance,
        last_action: `Receive vote via PayPal - ${tokenAmount} tokens`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', publisherId);

    if (updateError) throw updateError;

    return { balance: newBalance };
  } catch (error) {
    console.error('Error updating publisher wallet:', error);
    throw error;
  }
}

// Function to create transaction records
async function createTransactionRecords({
  userId,
  guestEmail,
  candidateId,
  eventId,
  publisherId,
  points,
  tokenAmount,
  paypalOrderId,
  paypalCaptureId,
  fiatTransactionId,
  amountPaid,
  currency
}) {
  try {
    // 1. Update fiat transaction status
    const { error: fiatError } = await supabase
      .from('fiat_transactions')
      .update({ 
        status: 'completed',
        verified_at: new Date().toISOString(),
        paypal_capture_id: paypalCaptureId
      })
      .eq('id', fiatTransactionId);

    if (fiatError) throw fiatError;

    // 2. Create token transaction for the voter (if logged in)
    if (userId) {
      const { error: tokenError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          tokens_out: 0, // No tokens deducted for PayPal payment
          description: `Vote via PayPal for candidate ${candidateId}`,
          transaction_id: `paypal_${userId}_${candidateId}_${Date.now()}`,
          reference: `vote_${candidateId}`,
          payment_method: 'paypal',
          paypal_order_id: paypalOrderId,
          paypal_capture_id: paypalCaptureId,
          created_at: new Date().toISOString(),
        });

      if (tokenError) throw tokenError;
    }

    // 3. Create a vote record
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        user_id: userId,
        guest_email: guestEmail,
        candidate_id: candidateId,
        event_id: eventId,
        points: points,
        amount_paid: amountPaid,
        currency: currency,
        payment_method: 'paypal',
        paypal_order_id: paypalOrderId,
        paypal_capture_id: paypalCaptureId,
        status: 'completed',
        created_at: new Date().toISOString(),
      });

    if (voteError) throw voteError;

    // 4. Create transaction for publisher
    const { error: publisherTxError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: publisherId,
        tokens_in: tokenAmount,
        description: `Receive vote via PayPal for candidate ${candidateId}`,
        transaction_id: `paypal_pub_${publisherId}_${candidateId}_${Date.now()}`,
        reference: `vote_receive_${candidateId}`,
        payment_method: 'paypal',
        paypal_order_id: paypalOrderId,
        created_at: new Date().toISOString(),
      });

    if (publisherTxError) throw publisherTxError;

    return { success: true };
  } catch (error) {
    console.error('Error creating transaction records:', error);
    throw error;
  }
}

// App Router uses NextResponse instead of res/req
export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      orderId,
      captureId,
      userId,
      guestEmail,
      candidateId,
      eventId,
      points,
      amount,
      fiatTransactionId
    } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ 
        error: 'Missing required field',
        message: 'orderId is required' 
      }, { status: 400 });
    }

    if (!candidateId || !eventId || !points || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'candidateId, eventId, points, and amount are required' 
      }, { status: 400 });
    }

    if (!fiatTransactionId) {
      return NextResponse.json({ 
        error: 'Missing required field',
        message: 'fiatTransactionId is required' 
      }, { status: 400 });
    }

    // Step 1: Verify PayPal payment
    console.log('Verifying PayPal payment:', { orderId, captureId });
    const verificationResult = await verifyPayPalPayment(orderId, captureId);

    if (!verificationResult.verified) {
      // Update transaction status to failed
      await supabase
        .from('fiat_transactions')
        .update({ 
          status: 'failed',
          error_message: verificationResult.error,
          verified_at: new Date().toISOString()
        })
        .eq('id', fiatTransactionId);

      return NextResponse.json({
        verified: false,
        error: verificationResult.error || 'Payment verification failed',
        details: verificationResult
      }, { status: 400 });
    }

    console.log('PayPal payment verified:', verificationResult);

    // Step 2: Get event details to find publisher
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('user_id, name')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      throw new Error('Failed to fetch event details');
    }

    const publisherId = eventData.user_id;
    const tokenAmount = points; // 1 point = 1 token

    // Step 3: Update candidate votes
    console.log('Updating candidate votes:', { candidateId, points });
    const voteResult = await updateCandidateVotes(candidateId, points);

    // Step 4: Update publisher wallet
    console.log('Updating publisher wallet:', { publisherId, tokenAmount });
    await updatePublisherWallet(publisherId, tokenAmount);

    // Step 5: Create transaction records
    console.log('Creating transaction records');
    await createTransactionRecords({
      userId,
      guestEmail,
      candidateId,
      eventId,
      publisherId,
      points,
      tokenAmount,
      paypalOrderId: orderId,
      paypalCaptureId: verificationResult.captureId,
      fiatTransactionId,
      amountPaid: amount,
      currency: verificationResult.currency || 'USD'
    });

    // Step 6: Return success response
    return NextResponse.json({
      verified: true,
      success: true,
      message: 'Payment verified and vote processed successfully',
      orderId,
      captureId: verificationResult.captureId,
      candidateId,
      points,
      amountPaid: amount,
      voteResult,
      payerInfo: {
        email: verificationResult.payerEmail,
        name: verificationResult.payerName
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in verify-paypal endpoint:', error);
    
    // Try to update transaction status to failed if we have the transaction ID
    try {
      const body = await request.json();
      const { fiatTransactionId } = body;
      if (fiatTransactionId) {
        await supabase
          .from('fiat_transactions')
          .update({ 
            status: 'failed',
            error_message: error.message,
            verified_at: new Date().toISOString()
          })
          .eq('id', fiatTransactionId);
      }
    } catch (updateError) {
      console.error('Failed to update transaction status:', updateError);
    }

    return NextResponse.json({
      verified: false,
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Optional: Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'Only POST requests are accepted'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'Only POST requests are accepted'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'Only POST requests are accepted'
  }, { status: 405 });
}