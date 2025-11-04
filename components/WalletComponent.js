"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, PlusCircle, ArrowDownCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// Dynamic import for Paystack to avoid SSR issues
const loadPaystack = () => {
  if (typeof window !== 'undefined') {
    return import('react-paystack').then(module => module.usePaystackPayment);
  }
  return Promise.resolve(() => {});
};

export default function WalletComponent() {
  const [fundOpen, setFundOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [withdrawTokens, setWithdrawTokens] = useState(0);
  const [accountDetails, setAccountDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [usePaystackPayment, setUsePaystackPayment] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // CORRECTED: 1000 Naira = 1 token
  const nairaToToken = (naira) => Math.floor(naira / 1000);
  const tokenToNaira = (tokens) => tokens * 1000;

  // Initialize client-side only components
  useEffect(() => {
    setIsClient(true);
    loadPaystack().then(hook => {
      setUsePaystackPayment(() => hook);
    });
  }, []);

  // Get the authenticated user
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

        console.log("Wallet query result:", { data, error });

        if (error) {
          console.error("Error fetching token balance:", error.message);
          // If wallet doesn't exist, create it
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

  // Real-time balance updates
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
          console.log('Realtime wallet update:', payload);
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

  // Payment success callback
  const onSuccess = (reference) => {
    console.log("Payment successful:", reference);
    setPaystackLoading(false);
    
    // Update wallet balance in Supabase with last_action
    updateWalletBalance(tokenAmount, reference.reference);
    
    // Store transaction record
    verifyTransaction(reference.reference);
    
    alert(`Payment successful! ${tokenAmount} tokens added to your wallet.`);
    setTokenAmount(0);
    setFundOpen(false);
  };

  // Payment close callback
  const onClose = () => {
    console.log("Payment modal closed");
    setPaystackLoading(false);
    alert("Payment was cancelled. Please try again.");
  };

  // Handle proceed to pay with proper initialization
  const handleProceedToPay = () => {
    if (!isClient || !usePaystackPayment) {
      alert("Payment system is initializing. Please try again in a moment.");
      return;
    }

    if (tokenAmount < 1) {
      alert("Please enter a valid token amount (minimum 1 token)");
      return;
    }

    if (!userEmail) {
      alert("Please make sure you are logged in with a valid email address");
      return;
    }

    // Validate environment variable
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      alert("Payment system is not configured. Please contact support.");
      console.error("Paystack public key is missing");
      return;
    }

    if (!publicKey.startsWith('pk_test_') && !publicKey.startsWith('pk_live_')) {
      alert("Invalid payment configuration. Please contact support.");
      console.error("Invalid Paystack public key format:", publicKey);
      return;
    }

    // Validate amount
    const amountInKobo = tokenAmount * 1000 * 100;
    if (amountInKobo < 10000) {
      alert("Minimum purchase is 1 token (₦1,000)");
      return;
    }

    console.log("Proceeding to payment with:", {
      tokenAmount,
      nairaAmount: tokenAmount * 1000,
      amountInKobo,
      userEmail
    });

    setPaystackLoading(true);

    // Create config
    const config = {
      reference: `GLEEDZ_${userId}_${Date.now()}`,
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

    console.log("Paystack Config:", config);

    // Initialize payment with config
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

  // Update wallet balance after successful payment with last_action
  const updateWalletBalance = async (tokensToAdd, reference = null) => {
    if (!userId) return;

    try {
      // Get current balance
      const { data: currentWallet, error: fetchError } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching current balance:", fetchError);
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from("token_wallets")
          .insert({ 
            user_id: userId, 
            balance: tokensToAdd,
            last_action: `top up from paystack - ${tokensToAdd} tokens - Ref: ${reference || 'N/A'}`,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating wallet:", createError);
          return;
        }
        setBalance(newWallet.balance);
        console.log("Wallet created with last_action: top up from paystack");
      } else {
        // Update existing wallet
        const currentBalance = currentWallet?.balance || 0;
        const newBalance = currentBalance + tokensToAdd;

        const { error: updateError } = await supabase
          .from("token_wallets")
          .update({ 
            balance: newBalance,
            last_action: `top up from paystack - ${tokensToAdd} tokens - Ref: ${reference || 'N/A'}`,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating wallet balance:", updateError);
        } else {
          setBalance(newBalance);
          console.log("Wallet balance updated successfully with last_action: top up from paystack");
        }
      }
    } catch (error) {
      console.error("Unexpected error updating balance:", error);
    }
  };

  // Store transaction with correct conversion
  const verifyTransaction = async (reference) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          reference: reference,
          token_amount: tokenAmount,
          naira_amount: tokenAmount * 1000,
          status: "completed",
          type: "deposit",
          description: "top up from paystack",
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error storing transaction:", error);
      } else {
        console.log("Transaction recorded successfully with description: top up from paystack");
      }
    } catch (error) {
      console.error("Error verifying transaction:", error);
    }
  };

  // Show loading state while initializing client-side
  if (!isClient) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-800">My Wallet</h2>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Token Balance</p>
            <p className="text-2xl font-bold text-yellow-600">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-800">My Wallet</h2>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">Token Balance</p>
          <p className="text-2xl font-bold text-yellow-600">
            {loadingBalance ? "Loading..." : `${balance} Tokens`}
          </p>
          {!loadingBalance && (
            <p className="text-sm text-gray-500">
              ₦{tokenToNaira(balance).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Fund Wallet */}
      <div className="space-y-3">
        <button
          onClick={() => {
            setFundOpen(!fundOpen);
            setWithdrawOpen(false);
          }}
          className="flex items-center gap-2 px-4 py-2 w-full rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Fund Wallet
        </button>

        <AnimatePresence>
          {fundOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-gray-50 rounded-lg p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  placeholder="Enter number of tokens"
                />
                {tokenAmount > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Equivalent:{" "}
                    <span className="font-semibold text-yellow-600">
                      ₦{tokenToNaira(tokenAmount).toLocaleString()}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      Rate: 1 token = ₦1,000
                    </span>
                  </p>
                )}
              </div>
              <button 
                onClick={handleProceedToPay}
                disabled={paystackLoading || !usePaystackPayment}
                className="w-full py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
              >
                {paystackLoading ? "Initializing Payment..." : `Proceed to Pay - ₦${tokenToNaira(tokenAmount).toLocaleString()}`}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Payments processed securely via Paystack
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Withdraw section */}
      <div className="space-y-3">
        <button
          onClick={() => {
            setWithdrawOpen(!withdrawOpen);
            setFundOpen(false);
          }}
          className="flex items-center gap-2 px-4 py-2 w-full rounded-lg bg-yellow-500 text-gray-800 hover:bg-yellow-600 transition"
        >
          <ArrowDownCircle className="w-5 h-5" />
          Request Withdrawal
        </button>

        <AnimatePresence>
          {withdrawOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-gray-50 rounded-lg p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tokens to Withdraw
                </label>
                <input
                  type="number"
                  min="1"
                  value={withdrawTokens}
                  onChange={(e) => setWithdrawTokens(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                />
                {withdrawTokens > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Equivalent:{" "}
                    <span className="font-semibold text-yellow-600">
                      ₦{tokenToNaira(withdrawTokens).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>

              {/* Bank details */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={accountDetails.bankName}
                  onChange={(e) =>
                    setAccountDetails({ ...accountDetails, bankName: e.target.value })
                  }
                  className="block w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Account Number"
                  value={accountDetails.accountNumber}
                  onChange={(e) =>
                    setAccountDetails({ ...accountDetails, accountNumber: e.target.value })
                  }
                  className="block w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Account Name"
                  value={accountDetails.accountName}
                  onChange={(e) =>
                    setAccountDetails({ ...accountDetails, accountName: e.target.value })
                  }
                  className="block w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                />
              </div>

              <button className="w-full py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition">
                Submit Withdrawal Request
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}