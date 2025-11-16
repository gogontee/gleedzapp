"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentVerification() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference');

        if (!reference) {
          setStatus('error');
          setMessage('No payment reference found');
          return;
        }

        // Use API route for verification - this will handle everything
        const verificationResponse = await fetch('/api/vote/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            reference,
            action: 'complete_payment' // Add this flag
          })
        });

        const result = await verificationResponse.json();

        if (!verificationResponse.ok) {
          throw new Error(result.error || 'Payment verification failed');
        }

        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Payment successful! Your votes have been counted.');

          // Redirect to candidate page after 3 seconds
          setTimeout(() => {
            if (result.transaction?.event_id && result.transaction?.candidate_id) {
              window.location.href = `/myevent/${result.transaction.event_id}/candidate/${result.transaction.candidate_id}`;
            } else {
              window.location.href = '/'; // Fallback redirect
            }
          }, 3000);

        } else {
          setStatus('error');
          setMessage(result.error || 'Payment failed. Please try again.');
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your payment.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting you back...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}