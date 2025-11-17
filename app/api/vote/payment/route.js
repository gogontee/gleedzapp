// app/api/vote/payment/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, amount, reference, metadata, event_id, candidate_id } = await request.json();

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    console.log('Paystack Secret Key loaded:', !!secretKey);
    
    if (!secretKey) {
      console.error('Paystack Secret Key is missing. Check your .env.local file.');
      return NextResponse.json(
        { error: 'Payment configuration error - Secret key not found' },
        { status: 500 }
      );
    }

    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      console.error('Invalid Paystack secret key format');
      return NextResponse.json(
        { error: 'Payment configuration error - Invalid key format' },
        { status: 500 }
      );
    }

    // Build callback URL with event_id and candidate_id
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/payment/process?reference=${reference}&event_id=${event_id}&candidate_id=${candidate_id}`;
    
    console.log('Callback URL with params:', callbackUrl);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        reference,
        callback_url: callbackUrl,
        metadata: {
          ...metadata,
          event_id,
          candidate_id
        }
      }),
    });

    const data = await response.json();
    console.log('Paystack API response:', data);

    if (!data.status) {
      console.error('Paystack API error:', data.message);
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}