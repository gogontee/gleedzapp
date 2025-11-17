// app/api/vote/verify/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    console.log('=== VERIFY API START ===');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    console.log('Env check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasPaystackKey: !!paystackKey
    });

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    if (!paystackKey) {
      throw new Error('Missing Paystack secret key');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log('Supabase client created');

    const body = await request.json();
    console.log('Request body received:', body);
    
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'No reference provided' },
        { status: 400 }
      );
    }

    console.log('Verifying Paystack reference:', reference);

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Paystack response status:', paystackResponse.status);

    if (!paystackResponse.ok) {
      throw new Error(`Paystack API error: ${paystackResponse.status}`);
    }

    const paystackData = await paystackResponse.json();
    console.log('Paystack data received:', paystackData);

    if (!paystackData.status) {
      return NextResponse.json(
        { success: false, error: paystackData.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Get transaction data from database
    const { data: transaction, error: transactionError } = await supabase
      .from('fiat_transactions')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    console.log('Database transaction:', transaction);

    let eventId = null;
    let candidateId = null;

    if (!transactionError && transaction) {
      // Extract from metadata
      const metadata = transaction.metadata || {};
      eventId = metadata.event_id || transaction.event_id;
      candidateId = metadata.candidate_id || transaction.candidate_id;
    }

    // Also try to extract from Paystack metadata
    if (!eventId || !candidateId) {
      const paystackMetadata = paystackData.data?.metadata || {};
      eventId = paystackMetadata.event_id;
      candidateId = paystackMetadata.candidate_id;
    }

    console.log('Extracted IDs:', { eventId, candidateId });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      reference: reference,
      paystack_status: paystackData.data?.status,
      transaction: {
        event_id: eventId,
        candidate_id: candidateId
      }
    });

  } catch (error) {
    console.error('=== API ERROR ===', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}