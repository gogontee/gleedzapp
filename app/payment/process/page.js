// app/payment/process/page.js
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
        const eventId = searchParams.get('event_id');
        const candidateId = searchParams.get('candidate_id');

        console.log('Payment verification params:', {
          reference,
          eventId,
          candidateId
        });

        if (!reference) {
          setStatus('error');
          setMessage('No payment reference found');
          return;
        }

        // Use API route for verification
        const verificationResponse = await fetch('/api/vote/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            reference,
            action: 'complete_payment'
          })
        });

        const result = await verificationResponse.json();
        console.log('Verification result:', result);

        if (!verificationResponse.ok) {
          throw new Error(result.error || 'Payment verification failed');
        }

        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Payment successful! Your votes have been counted.');

          // Determine redirect URL
          let redirectUrl = '/';
          
          // Priority 1: Use transaction data from API
          if (result.transaction?.event_id && result.transaction?.candidate_id) {
            redirectUrl = `/myevent/${result.transaction.event_id}/candidate/${result.transaction.candidate_id}`;
          } 
          // Priority 2: Use URL parameters as fallback
          else if (eventId && candidateId) {
            redirectUrl = `/myevent/${eventId}/candidate/${candidateId}`;
          }
          // Priority 3: Use sessionStorage as last resort
          else {
            const storedEventId = sessionStorage.getItem('last_event_id');
            const storedCandidateId = sessionStorage.getItem('last_candidate_id');
            if (storedEventId && storedCandidateId) {
              redirectUrl = `/myevent/${storedEventId}/candidate/${storedCandidateId}`;
            }
          }

          console.log('Redirecting to:', redirectUrl);

          // Redirect to candidate page after 3 seconds
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 3000);

        } else {
          setStatus('error');
          setMessage(result.error || 'Payment failed. Please try again.');
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your payment. Please contact support if the problem persists.');
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
            <p className="text-sm text-gray-500 mt-4">Redirecting you back to the candidate page...</p>
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