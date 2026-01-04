import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { captureId, email, tokenAmount, orderId } = await request.json();
    
    // For guest payments, we don't have userId
    if (!captureId || !tokenAmount) {
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

    // Step 4: Check payer details
    const payerEmail = captureDetails.payer?.email_address || email;
    
    // For guest payments, we need to store the payment details
    // and prompt the user to create an account or link to existing
    
    return NextResponse.json({
      success: true,
      captureId,
      tokenAmount,
      payerEmail,
      isGuest: !captureDetails.payer?.payer_id,
      // Return a temporary token or session for the guest
      guestToken: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      instructions: "Please create an account or login to claim your tokens"
    });

  } catch (error) {
    console.error('PayPal guest verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', details: error.message },
      { status: 500 }
    );
  }
}