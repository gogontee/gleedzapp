// app/api/vote/payment/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, amount, reference, metadata, callback_url } = await request.json();

    // Use the correct environment variable (without NEXT_PUBLIC_)
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    console.log('Paystack Secret Key loaded:', !!secretKey);
    
    if (!secretKey) {
      console.error('Paystack Secret Key is missing. Check your .env.local file.');
      return NextResponse.json(
        { error: 'Payment configuration error - Secret key not found' },
        { status: 500 }
      );
    }

    // Validate the key format
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      console.error('Invalid Paystack secret key format');
      return NextResponse.json(
        { error: 'Payment configuration error - Invalid key format' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        reference,
        callback_url,
        metadata
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