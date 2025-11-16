// lib/paystack.js
export class PaystackService {
  static async initializePayment({ email, amount, reference, metadata, callback_url }) {
    try {
      // Remove demo code and use real Paystack API
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`, // Format is critical here
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Remember to convert to kobo
        reference,
        callback_url,
        metadata
      }),
    });

      
      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to initialize payment');
      }
      
      return data;

    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  static async verifyPayment(reference) {
    try {
      // Use real Paystack verification API
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Payment verification failed');
      }
      
      return data;

    } catch (error) {
      console.error('Paystack verification error:', error);
      throw new Error('Failed to verify payment');
    }
  }

  // Alias for verifyPayment
  static async verifyTransaction(reference) {
    return this.verifyPayment(reference);
  }
}