// app/api/vote/verify/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    console.log('=== VERIFY API CALLED ===');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { reference, action } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'No reference provided' },
        { status: 400 }
      );
    }

    // Use the correct environment variable
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!secretKey) {
      console.error('Paystack secret key missing');
      return NextResponse.json(
        { success: false, error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    console.log('Verifying with Paystack reference:', reference);

    // 1. First verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const paystackData = await response.json();
    console.log('Paystack response:', paystackData);

    if (!paystackData.status) {
      return NextResponse.json(
        { success: false, error: paystackData.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    // 2. If Paystack verification successful, handle our database logic
    if (paystackData.data.status === 'success') {
      
      // Check if transaction already exists in our database
      const { data: existingTransaction, error: queryError } = await supabase
        .from('fiat_transactions')
        .select('*')
        .eq('paystack_reference', reference);

      console.log('Database query result:', { existingTransaction, queryError });

      let transaction;

      if (queryError && queryError.code !== 'PGRST116') {
        console.error('Database query error:', queryError);
        throw queryError;
      }

      if (existingTransaction && existingTransaction.length > 0) {
        // Transaction exists, update it
        const { data: updatedTransaction, error: updateError } = await supabase
          .from('fiat_transactions')
          .update({
            status: 'completed',
            paystack_transaction_id: paystackData.data.id,
            updated_at: new Date().toISOString()
          })
          .eq('paystack_reference', reference)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating transaction:', updateError);
          throw updateError;
        }

        transaction = updatedTransaction;
        console.log('Updated existing transaction:', transaction);
      } else {
        // Transaction doesn't exist, create it
        const metadata = paystackData.data.metadata || {};
        const customFields = metadata.custom_fields || [];
        
        const candidateName = customFields.find(field => field.variable_name === 'candidate_name')?.value;
        const eventName = customFields.find(field => field.variable_name === 'event_name')?.value;
        const points = parseInt(customFields.find(field => field.variable_name === 'points')?.value) || 1;

        const { data: newTransaction, error: insertError } = await supabase
          .from('fiat_transactions')
          .insert({
            paystack_reference: reference,
            paystack_transaction_id: paystackData.data.id,
            amount: paystackData.data.amount / 100,
            currency: paystackData.data.currency,
            customer_email: paystackData.data.customer?.email,
            status: 'completed',
            points: points,
            description: candidateName && eventName ? `Vote for ${candidateName} in ${eventName}` : 'Vote transaction',
            metadata: paystackData.data
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating transaction:', insertError);
          throw insertError;
        }

        transaction = newTransaction;
        console.log('Created new transaction:', transaction);
      }

      // 3. If this is a complete_payment action, update candidate votes
      if (action === 'complete_payment' && transaction) {
        console.log('Processing complete_payment action for transaction:', transaction.id);
        
        // For now, just return success without candidate update
        // We'll handle candidate updates separately
        
        return NextResponse.json({
          success: true,
          message: 'Payment verified successfully',
          transaction: transaction,
          paystack_data: paystackData.data
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        transaction: transaction,
        paystack_data: paystackData.data
      });

    } else {
      // Payment not successful in Paystack
      return NextResponse.json({
        success: false,
        error: `Payment status: ${paystackData.data.status}`,
        paystack_data: paystackData.data
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to verify payment: ' + error.message 
      },
      { status: 500 }
    );
  }
}