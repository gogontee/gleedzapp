"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Wallet, PlusCircle, ArrowDownCircle, Coins, TrendingUp, Eye, EyeOff, History, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

// Dynamic import for Paystack
const loadPaystack = () => {
  if (typeof window !== 'undefined') {
    return import('react-paystack').then(module => module.usePaystackPayment);
  }
  return Promise.resolve(() => {});
};

// PayPal button component that handles loading state properly
function PayPalButtonWrapper({ tokenAmount, userId, tokenToDollar, handlePayPalSuccess }) {
  const [{ isPending, isResolved }] = usePayPalScriptReducer();
  
  if (tokenAmount <= 0) {
    return null; // Don't render anything if no tokens selected
  }
  
  if (isPending) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading PayPal payment options...
        </div>
      </div>
    );
  }
  
  if (!isResolved) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-yellow-600">
          PayPal payment options are not available at the moment.
        </div>
      </div>
    );
  }
  
  return (
    <PayPalButtons
      style={{ 
        layout: "vertical",
        color: "gold",
        shape: "rect",
        height: 55,
        label: "checkout",
        tagline: false
      }}
      fundingSource={undefined}
      createOrder={async (data, actions) => {
        const usdAmount = tokenToDollar(tokenAmount);
        
        if (usdAmount < 0.50) {
          alert("Minimum payment is $0.50 USD");
          return Promise.reject("Amount too small");
        }
        
        return actions.order.create({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              value: usdAmount.toFixed(2),
              currency_code: "USD"
            },
            description: `Purchase of ${tokenAmount} tokens`,
            custom_id: `USER_${userId || 'GUEST'}_TOKENS_${tokenAmount}`,
          }],
          application_context: {
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
            }
          }
        });
      }}
      onApprove={handlePayPalSuccess}
      onError={(error) => {
        console.error("PayPal Button Error:", error);
        alert(`Payment error: ${error.message}. Please try another method.`);
      }}
      onCancel={() => {
        console.log("PayPal payment cancelled by user");
        alert("Payment was cancelled. You can try again.");
      }}
    />
  );
}

// Main component wrapper
export default function WalletComponent() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="animate-pulse w-full max-w-4xl mx-auto space-y-6">
      <div className="h-64 bg-gray-200 rounded-xl"></div>
    </div>;
  }

  return (
    <PayPalScriptProvider 
      options={{ 
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
        currency: "USD",
        intent: "capture",
        components: "buttons",
      }}
    >
      <WalletContent />
    </PayPalScriptProvider>
  );
}

// Inner component
function WalletContent() {
  const [tokenAmount, setTokenAmount] = useState(0);
  const [withdrawTokens, setWithdrawTokens] = useState(0);
  const [accountDetails, setAccountDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [usePaystackPayment, setUsePaystackPayment] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1500);
  const [successWithdrawalAmount, setSuccessWithdrawalAmount] = useState(0);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // PayPal states
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState(null);

  // Conversion functions
  const nairaToToken = (naira) => Math.floor(naira / 1000);
  const tokenToNaira = (tokens) => tokens * 1000;
  const tokenToDollar = (tokens) => (tokens * 1000) / exchangeRate;

  // Initialize client-side only components
  useEffect(() => {
    loadPaystack().then(hook => {
      setUsePaystackPayment(() => hook);
    });
    
    // Fetch current exchange rate
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const mockRate = 1500;
      setExchangeRate(mockRate);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setExchangeRate(1500);
    }
  };

  // Get authenticated user
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email);
      } else {
        console.error("No authenticated user found.");
        setLoadingBalance(false);
      }
    }
    fetchUser();
  }, []);

  // Add this useEffect to check for pending guest payments after login
  useEffect(() => {
    if (userId && typeof window !== 'undefined') {
      const pendingPayment = localStorage.getItem('pendingGuestPayment');
      
      if (pendingPayment) {
        try {
          const paymentData = JSON.parse(pendingPayment);
          
          // Check if payment is still valid (within 24 hours)
          if (paymentData.expiresAt > Date.now()) {
            // Prompt user to claim tokens
            if (confirm(`You have ${paymentData.tokenAmount} tokens pending from a guest payment. Would you like to claim them now?`)) {
              claimGuestTokens(paymentData);
            }
          } else {
            localStorage.removeItem('pendingGuestPayment');
          }
        } catch (error) {
          console.error('Error processing pending payment:', error);
        }
      }
    }
  }, [userId]);

  const claimGuestTokens = async (paymentData) => {
    try {
      const response = await fetch('/api/paypal/claim-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          captureId: paymentData.captureId,
          tokenAmount: paymentData.tokenAmount,
          guestToken: paymentData.guestToken
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update local balance
        setBalance(result.newBalance);
        localStorage.removeItem('pendingGuestPayment');
        alert(`Successfully claimed ${paymentData.tokenAmount} tokens!`);
      } else {
        throw new Error(result.error || 'Claim failed');
      }
    } catch (error) {
      console.error('Claim guest tokens error:', error);
      alert('Failed to claim tokens. Please contact support.');
    }
  };

  // Fetch wallet balance
  useEffect(() => {
    if (!userId) return;

    async function fetchBalance() {
      setLoadingBalance(true);
      try {
        const { data, error } = await supabase
          .from("token_wallets")
          .select("balance, last_action")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching token balance:", error.message);
          const { data: newWallet, error: createError } = await supabase
            .from("token_wallets")
            .insert({ 
              user_id: userId, 
              balance: 0,
              last_action: "wallet created"
            })
            .select()
            .single();
            
          if (createError) {
            console.error("Error creating wallet:", createError);
            setBalance(0);
          } else {
            setBalance(newWallet.balance || 0);
          }
        } else {
          setBalance(data?.balance || 0);
        }
      } catch (err) {
        console.error("Unexpected error fetching balance:", err);
        setBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    }

    fetchBalance();
  }, [userId]);

  // Fetch withdrawal history
  useEffect(() => {
    if (!userId) return;

    async function fetchWithdrawalHistory() {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from("withdrawals")
          .select("account_name, account_number, bank_name, token_amount, approved, sent, sent_amount, sent_time, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching withdrawal history:", error);
          setWithdrawalHistory([]);
        } else {
          setWithdrawalHistory(data || []);
        }
      } catch (error) {
        console.error("Unexpected error fetching withdrawal history:", error);
        setWithdrawalHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchWithdrawalHistory();
  }, [userId]);

  // Real-time updates
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'token_wallets', 
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  // FIXED: PayPal payment verification
  const verifyPayPalPayment = async (orderId, captureId) => {
    try {
      setPaypalProcessing(true);
      setPaypalError(null);

      // First verify payment with PayPal API
      const verificationResponse = await fetch('/api/verify-paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          captureId,
          userId,
          tokenAmount,
          usdAmount: tokenToDollar(tokenAmount)
        }),
      });

      const verificationResult = await verificationResponse.json();

      if (!verificationResponse.ok) {
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

      if (!verificationResult.verified) {
        throw new Error('Payment could not be verified with PayPal');
      }

      // If verified, update wallet in database
      const updateResponse = await fetch('/api/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tokenAmount,
          transactionId: verificationResult.transactionId,
          orderId
        }),
      });

      const updateResult = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(updateResult.error || 'Failed to update wallet');
      }

      // Update local balance
      setBalance(updateResult.newBalance);
      
      // Show success message
      alert(`Payment successful! ${tokenAmount} tokens added to your wallet.`);
      setTokenAmount(0);
      
      return updateResult;
      
    } catch (error) {
      console.error('PayPal verification error:', error);
      setPaypalError(error.message);
      alert(`Payment failed: ${error.message}`);
      throw error;
    } finally {
      setPaypalProcessing(false);
    }
  };

  // Add this new function for guest payments
  const handleGuestPayment = async (orderId, captureId, payerEmail) => {
    try {
      setPaypalProcessing(true);
      
      const response = await fetch('/api/paypal/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          captureId,
          email: payerEmail,
          tokenAmount,
          orderId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Guest payment processing failed');
      }

      // Store guest payment details in localStorage
      localStorage.setItem('pendingGuestPayment', JSON.stringify({
        captureId,
        tokenAmount,
        guestToken: result.guestToken,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));

      // Show message to user
      alert(`Payment successful! ${tokenAmount} tokens have been purchased. Please create an account or login to claim your tokens.`);
      
      // Redirect to signup/login page with token
      window.location.href = `/auth/signup?guestToken=${result.guestToken}&tokens=${tokenAmount}`;
      
    } catch (error) {
      console.error('Guest payment error:', error);
      alert(`Payment successful but claim failed: ${error.message}. Please contact support with order ID: ${orderId}`);
    } finally {
      setPaypalProcessing(false);
    }
  };

  // Handle PayPal payment success
  const handlePayPalSuccess = useCallback(async (details, actions) => {
    try {
      console.log("PayPal payment success details:", details);
      
      // Get the order details
      const orderId = details.id;
      const captureId = details.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      const payerEmail = details.payer?.email_address;
      
      if (!orderId) {
        throw new Error('No order ID found in payment details');
      }

      // Check if user is authenticated
      if (userId) {
        // Registered user flow
        await verifyPayPalPayment(orderId, captureId);
      } else {
        // Guest user flow
        await handleGuestPayment(orderId, captureId, payerEmail);
      }
      
    } catch (error) {
      console.error("PayPal payment processing error:", error);
      alert("Payment processing failed. Please contact support if funds were deducted.");
    }
  }, [userId, tokenAmount]);

  // Paystack functions
  const onSuccess = (reference) => {
    console.log("Paystack payment successful:", reference);
    setPaystackLoading(false);
    
    updateWalletBalance(tokenAmount, reference.reference, false);
    
    verifyTransaction(reference.reference, false);
    
    alert(`Payment successful! ${tokenAmount} tokens added to your wallet.`);
    setTokenAmount(0);
  };

  const onClose = () => {
    console.log("Payment modal closed");
    setPaystackLoading(false);
    alert("Payment was cancelled. Please try again.");
  };

  const handleProceedToPay = () => {
    if (!usePaystackPayment || tokenAmount < 1) {
      alert("Please enter a valid token amount (minimum 1 token)");
      return;
    }

    if (!userEmail) {
      alert("Please make sure you are logged in with a valid email address");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      alert("Payment system is not configured. Please contact support.");
      return;
    }

    const amountInKobo = tokenAmount * 1000 * 100;
    if (amountInKobo < 10000) {
      alert("Minimum purchase is 1 token (₦1,000)");
      return;
    }

    setPaystackLoading(true);

    const config = {
      reference: `GIGZZ_${userId}_${Date.now()}`,
      email: userEmail,
      amount: amountInKobo,
      publicKey: publicKey,
      currency: "NGN",
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: userId
          },
          {
            display_name: "Token Amount",
            variable_name: "token_amount", 
            value: tokenAmount
          }
        ]
      }
    };

    try {
      const initializePayment = usePaystackPayment();
      initializePayment({
        config,
        onSuccess,
        onClose
      });
    } catch (error) {
      console.error("Error initializing payment:", error);
      setPaystackLoading(false);
      alert("Error initializing payment. Please try again.");
    }
  };

  const updateWalletBalance = async (tokensToAdd, reference = null, isPaypal = false) => {
    if (!userId) return;

    const actionDescription = isPaypal 
      ? `top up from paypal - ${tokensToAdd} tokens - Ref: ${reference}`
      : `top up from paystack - ${tokensToAdd} tokens - Ref: ${reference || 'N/A'}`;

    try {
      const { data: currentWallet, error: fetchError } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        const { data: newWallet, error: createError } = await supabase
          .from("token_wallets")
          .insert({ 
            user_id: userId, 
            balance: tokensToAdd,
            last_action: actionDescription,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating wallet:", createError);
          return;
        }
        setBalance(newWallet.balance);
      } else {
        const currentBalance = currentWallet?.balance || 0;
        const newBalance = currentBalance + tokensToAdd;

        const { error: updateError } = await supabase
          .from("token_wallets")
          .update({ 
            balance: newBalance,
            last_action: actionDescription,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (!updateError) {
          setBalance(newBalance);
        }
      }
    } catch (error) {
      console.error("Unexpected error updating balance:", error);
    }
  };

  const verifyTransaction = async (reference, isPaypal = false) => {
    try {
      const description = isPaypal ? "top up from paypal" : "top up from paystack";
      
      const { error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          reference: reference,
          token_amount: tokenAmount,
          naira_amount: tokenAmount * 1000,
          status: "completed",
          type: "deposit",
          description: description,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error storing transaction:", error);
      }
    } catch (error) {
      console.error("Error verifying transaction:", error);
    }
  };

  // Withdrawal functions
  const handleWithdrawalRequest = async () => {
    if (!userId) {
      alert("Please log in to request withdrawal");
      return;
    }

    if (withdrawTokens < 1) {
      alert("Please enter a valid token amount to withdraw");
      return;
    }

    if (withdrawTokens > balance) {
      alert("Insufficient balance for withdrawal");
      return;
    }

    if (!accountDetails.bankName || !accountDetails.accountNumber || !accountDetails.accountName) {
      alert("Please fill in all bank details");
      return;
    }

    if (!password) {
      alert("Please enter your password to confirm withdrawal");
      return;
    }

    setWithdrawLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });

      if (authError) {
        alert("Invalid password. Please check your password and try again.");
        setWithdrawLoading(false);
        return;
      }

      const withdrawalAmount = withdrawTokens;

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: userId,
          token_amount: withdrawTokens,
          bank_name: accountDetails.bankName,
          account_name: accountDetails.accountName,
          account_number: accountDetails.accountNumber,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (withdrawalError) {
        alert("Error processing withdrawal request. Please try again.");
        setWithdrawLoading(false);
        return;
      }

      const { error: walletError } = await supabase
        .from("token_wallets")
        .update({ 
          balance: balance - withdrawTokens,
          last_action: `withdrawal request - ${withdrawTokens} tokens`,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (!walletError) {
        setBalance(prev => prev - withdrawTokens);
      }

      await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          reference: `WDR_${withdrawalData.id}`,
          token_amount: withdrawTokens,
          naira_amount: tokenToNaira(withdrawTokens),
          status: "pending",
          type: "withdrawal",
          description: "withdrawal request",
          created_at: new Date().toISOString()
        });

      setSuccessWithdrawalAmount(withdrawalAmount);
      setWithdrawSuccess(true);
      setWithdrawTokens(0);
      setAccountDetails({
        bankName: "",
        accountNumber: "",
        accountName: "",
      });
      setPassword("");
      
      setTimeout(() => {
        setWithdrawSuccess(false);
      }, 5000);

    } catch (error) {
      console.error("Unexpected error processing withdrawal:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const isWithdrawalValid = 
    withdrawTokens >= 1 && 
    withdrawTokens <= balance && 
    accountDetails.bankName && 
    accountDetails.accountNumber && 
    accountDetails.accountName && 
    password;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Balance Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Coins className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Token Balance</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {loadingBalance ? "Loading..." : `${balance} Tokens`}
              </p>
              {!loadingBalance && (
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-gray-500">
                    ₦{tokenToNaira(balance).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    ≈ ${tokenToDollar(balance).toFixed(2)} USD
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-sm text-gray-600">Current Value</p>
            <p className="text-base md:text-lg font-semibold text-gray-900">
              ₦{tokenToNaira(balance).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              ≈ ${tokenToDollar(balance).toFixed(2)} USD
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Fund Wallet Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1 md:p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Fund Wallet</h3>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Enter Tokens
              </label>
              <input
                type="number"
                min="1"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="Enter number of tokens"
              />
              {tokenAmount > 0 && (
                <div className="mt-1 md:mt-2 space-y-1">
                  <p className="text-xs md:text-sm text-gray-600">
                    Equivalent:{" "}
                    <span className="font-semibold text-green-600">
                      ₦{tokenToNaira(tokenAmount).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    ≈ ${tokenToDollar(tokenAmount).toFixed(2)} USD
                  </p>
                  <p className="text-xs text-gray-500">
                    Rate: 1 token = ₦1,000
                  </p>
                </div>
              )}
            </div>
            
            {/* Paystack Payment Button */}
            <button 
              onClick={handleProceedToPay}
              disabled={paystackLoading || !usePaystackPayment || tokenAmount < 1}
              className="w-full py-2 md:py-3 text-sm md:text-base rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-1 md:gap-2"
            >
              {paystackLoading ? (
                <>
                  <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs md:text-sm">Initializing Payment...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Pay ₦{tokenToNaira(tokenAmount).toLocaleString()}</span>
                </>
              )}
            </button>

            {/* PayPal Payment Section */}
            {tokenAmount > 0 && (
              <div className="mt-4">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-500">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                {paypalError && (
                  <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p className="text-sm font-medium">{paypalError}</p>
                  </div>
                )}
                
                {/* PayPal Button Component */}
                <PayPalButtonWrapper 
                  tokenAmount={tokenAmount}
                  userId={userId}
                  tokenToDollar={tokenToDollar}
                  handlePayPalSuccess={handlePayPalSuccess}
                />
                
                {paypalProcessing && (
                  <div className="mt-2 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Processing PayPal payment...
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Pay with PayPal, Credit Card, or Debit Card
                </p>
              </div>
            )}
            
            <p className="text-xs text-gray-500 text-center">
              Payments processed securely via Paystack & PayPal
            </p>
          </div>
        </div>

        {/* Withdraw Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1 md:p-2 bg-blue-100 rounded-lg">
              <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Withdraw Funds</h3>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            {/* Success Message */}
            {withdrawSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg"
              >
                <p className="font-semibold">Withdrawal Request Submitted Successfully!</p>
                <p className="text-sm mt-1">
                  Your withdrawal request for <strong>{successWithdrawalAmount} tokens</strong> (₦{tokenToNaira(successWithdrawalAmount).toLocaleString()}) has been received and is being processed. 
                  Funds will be transferred to your bank account within 24-48 hours.
                </p>
              </motion.div>
            )}

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Tokens to Withdraw
              </label>
              <input
                type="number"
                min="1"
                max={balance}
                value={withdrawTokens}
                onChange={(e) => setWithdrawTokens(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="Enter tokens to withdraw"
              />
              {withdrawTokens > 0 && (
                <div className="mt-1 md:mt-2 space-y-1">
                  <p className="text-xs md:text-sm text-gray-600">
                    You'll receive:{" "}
                    <span className="font-semibold text-blue-600">
                      ₦{tokenToNaira(withdrawTokens).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    ≈ ${tokenToDollar(withdrawTokens).toFixed(2)} USD
                  </p>
                </div>
              )}
            </div>

            {/* Bank details */}
            <div className="space-y-2 md:space-y-3">
              <input
                type="text"
                placeholder="Bank Name"
                value={accountDetails.bankName}
                onChange={(e) =>
                  setAccountDetails({ ...accountDetails, bankName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accountDetails.accountNumber}
                onChange={(e) =>
                  setAccountDetails({ ...accountDetails, accountNumber: e.target.value })
                }
                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Account Name"
                value={accountDetails.accountName}
                onChange={(e) =>
                  setAccountDetails({ ...accountDetails, accountName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            {/* Password confirmation */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent pr-10"
                  placeholder="Enter your password to confirm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              onClick={handleWithdrawalRequest}
              disabled={!isWithdrawalValid || withdrawLoading}
              className="w-full py-2 md:py-3 text-sm md:text-base rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-1 md:gap-2"
            >
              {withdrawLoading ? (
                <>
                  <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs md:text-sm">Processing...</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Request Withdrawal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Request History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-4">
          <div className="p-1 md:p-2 bg-purple-100 rounded-lg">
            <History className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Withdrawal Request History</h3>
        </div>

        {loadingHistory ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 border-b border-gray-100">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : withdrawalHistory.length > 0 ? (
          <div className="space-y-4">
            {withdrawalHistory.map((withdrawal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Name</p>
                    <p className="text-sm text-gray-900">{withdrawal.account_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Number</p>
                    <p className="text-sm text-gray-900">{withdrawal.account_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Bank Name</p>
                    <p className="text-sm text-gray-900">{withdrawal.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Token Amount</p>
                    <p className="text-sm font-semibold text-yellow-600">
                      {withdrawal.token_amount} tokens (₦{tokenToNaira(withdrawal.token_amount).toLocaleString()})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Approval Status</p>
                    <div className="flex items-center gap-1">
                      {withdrawal.approved ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Approved</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Status</p>
                    <div className="flex items-center gap-1">
                      {withdrawal.sent ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Sent</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-600 font-medium">Processing</span>
                        </>
                      )}
                    </div>
                  </div>

                  {withdrawal.sent && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Amount Sent</p>
                      <p className="text-sm font-semibold text-green-600">
                        ₦{withdrawal.sent_amount?.toLocaleString()}
                      </p>
                      {withdrawal.sent_time && (
                        <p className="text-xs text-gray-500">
                          {formatDate(withdrawal.sent_time)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Requested: {formatDate(withdrawal.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No withdrawal requests yet</p>
            <p className="text-sm">Your withdrawal requests will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}