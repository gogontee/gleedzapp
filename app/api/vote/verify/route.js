// app/api/vote/verify/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { reference } = await request.json();

    // Use the correct environment variable
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}