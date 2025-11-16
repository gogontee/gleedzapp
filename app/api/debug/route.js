// app/api/debug/route.js - Temporary route to check env vars
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    publicKey: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    secretKey: !!process.env.PAYSTACK_SECRET_KEY,
    secretKeyStartsWith: process.env.PAYSTACK_SECRET_KEY?.substring(0, 8) // First 8 chars only
  });
}