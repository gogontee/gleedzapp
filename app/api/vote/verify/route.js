// app/api/vote/verify/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    console.log('=== VERIFY API START ===');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    if (!paystackKey) {
      throw new Error('Missing Paystack secret key');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    // Step 1: Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paystackResponse.ok) {
      throw new Error(`Paystack API error: ${paystackResponse.status}`);
    }

    const paystackData = await paystackResponse.json();
    console.log('Paystack verification result:', {
      status: paystackData.status,
      transactionStatus: paystackData.data?.status,
      message: paystackData.message
    });

    if (!paystackData.status) {
      return NextResponse.json(
        { success: false, error: paystackData.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Step 2: Update transaction status in database
    let transactionUpdate = null;
    if (paystackData.data?.status === 'success') {
      console.log('Payment successful, updating transaction status to "complete"');
      
      // ✅ CORRECT: Only update fields that exist in your table
      const updateData = {
        status: 'complete', // This will update from 'pending_verification' to 'complete'
        updated_at: new Date().toISOString(),
        // Add paystack_transaction_id if not already set
        paystack_transaction_id: paystackData.data.id || null
      };

      const { data: updatedTransaction, error: updateError } = await supabase
        .from('fiat_transactions')
        .update(updateData)
        .eq('paystack_reference', reference)
        .select()
        .single();

      if (updateError) {
        console.error('❌ ERROR updating transaction status:', updateError);
        throw new Error(`Failed to update transaction status: ${updateError.message}`);
      }

      transactionUpdate = updatedTransaction;
      console.log('✅ Transaction status updated successfully:', {
        id: updatedTransaction.id,
        previous_status: 'pending_verification',
        new_status: updatedTransaction.status,
        reference: updatedTransaction.paystack_reference
      });

      // ✅ NEW: Check if this is a GIFT transaction and update candidate gifts
      if (reference.includes('gift_')) {
        console.log('🎁 Detected gift transaction, updating candidate gifts...');
        
        // Get the transaction details to find candidate_id and gift value
        const { data: giftTransaction, error: giftError } = await supabase
          .from('fiat_transactions')
          .select('candidate_id, points, description')
          .eq('paystack_reference', reference)
          .single();

        if (!giftError && giftTransaction && giftTransaction.candidate_id) {
          try {
            console.log('🎁 Gift transaction details:', giftTransaction);
            
            // Get current candidate data
            const { data: candidateData, error: candidateError } = await supabase
              .from('candidates')
              .select('gifts, votes')
              .eq('id', giftTransaction.candidate_id)
              .single();

            if (candidateError) {
              console.error('❌ Error fetching candidate data:', candidateError);
            } else if (candidateData) {
              const currentGifts = candidateData.gifts || 0;
              const currentVotes = candidateData.votes || 0;
              const giftValue = giftTransaction.points || 0; // This should be the token value from the gift
              
              const newGifts = currentGifts + giftValue;
              const newPoints = (currentVotes + newGifts) / 10;

              console.log('🎁 Updating candidate gifts:', {
                candidate_id: giftTransaction.candidate_id,
                current_gifts: currentGifts,
                gift_value: giftValue,
                new_gifts: newGifts
              });

              // Update candidate gifts and points
              const { error: updateCandidateError } = await supabase
                .from('candidates')
                .update({ 
                  gifts: newGifts,
                  points: newPoints
                })
                .eq('id', giftTransaction.candidate_id);

              if (updateCandidateError) {
                console.error('❌ Error updating candidate gifts:', updateCandidateError);
              } else {
                console.log('✅ Candidate gifts updated successfully!');
              }
            }
          } catch (error) {
            console.error('❌ Error in gift processing:', error);
          }
        } else {
          console.error('❌ Could not find gift transaction details:', giftError);
        }
      } else if (reference.includes('vote_')) {
        console.log('🗳️ Vote transaction detected - no gift update needed');
      }
    } else {
      console.log('Payment not successful, status remains as:', paystackData.data?.status);
    }

    // Step 3: Get the final transaction data
    const { data: finalTransaction, error: transactionError } = await supabase
      .from('fiat_transactions')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (transactionError) {
      console.error('Error fetching final transaction:', transactionError);
    }

    console.log('Final transaction status:', finalTransaction?.status);

    // Extract event and candidate IDs from the actual table columns
    let eventId = finalTransaction?.event_id || null;
    let candidateId = finalTransaction?.candidate_id || null;

    console.log('Extracted IDs from database:', { eventId, candidateId });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and transaction updated successfully',
      reference: reference,
      paystack_status: paystackData.data?.status,
      transaction_status: finalTransaction?.status || 'unknown',
      transaction: {
        event_id: eventId,
        candidate_id: candidateId,
        db_status: finalTransaction?.status,
        id: finalTransaction?.id
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