"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, PlusCircle, ArrowDownCircle, Coins, TrendingUp, Eye, EyeOff, History, CheckCircle, XCircle, Clock } from "lucide-react";
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
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [usePaystackPayment, setUsePaystackPayment] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1500); // Default: 1 USD = ₦1500
  const [successWithdrawalAmount, setSuccessWithdrawalAmount] = useState(0); // Store the successful withdrawal amount
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // CORRECTED: 1000 Naira = 1 token
  const nairaToToken = (naira) => Math.floor(naira / 1000);
  const tokenToNaira = (tokens) => tokens * 1000;
  const tokenToDollar = (tokens) => (tokens * 1000) / exchangeRate;

  // Initialize client-side only components
  useEffect(() => {
    setIsClient(true);
    loadPaystack().then(hook => {
      setUsePaystackPayment(() => hook);
    });
    
    // Fetch current exchange rate (you can replace this with a real API)
    fetchExchangeRate();
  }, []);

  // Fetch current exchange rate (mock function - replace with real API)
  const fetchExchangeRate = async () => {
    try {
      // This is a mock - replace with actual exchange rate API
      // Example: fetch('https://api.exchangerate-api.com/v4/latest/NGN')
      const mockRate = 1500; // 1 USD = ₦1500
      setExchangeRate(mockRate);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setExchangeRate(1500); // Fallback rate
    }
  };

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

  // Real-time withdrawal updates
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('withdrawal-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'withdrawals', 
          filter: `user_id=eq.${userId}` 
        },
        () => {
          // Refresh withdrawal history when there are changes
          fetchWithdrawalHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const fetchWithdrawalHistory = async () => {
    if (!userId) return;
    
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
  };

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

  // Handle withdrawal request
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
      // Verify user password first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });

      if (authError) {
        alert("Invalid password. Please check your password and try again.");
        setWithdrawLoading(false);
        return;
      }

      // Store the withdrawal amount before resetting the form
      const withdrawalAmount = withdrawTokens;

      // Insert withdrawal request - SIMPLIFIED: Only store the essential fields
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: userId,
          token_amount: withdrawTokens, // Store token amount
          bank_name: accountDetails.bankName, // Store bank name
          account_name: accountDetails.accountName, // Store account name
          account_number: accountDetails.accountNumber, // Store account number
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error("Error creating withdrawal request:", withdrawalError);
        alert("Error processing withdrawal request. Please try again.");
        setWithdrawLoading(false);
        return;
      }

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("token_wallets")
        .update({ 
          balance: balance - withdrawTokens,
          last_action: `withdrawal request - ${withdrawTokens} tokens`,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (walletError) {
        console.error("Error updating wallet balance:", walletError);
      } else {
        setBalance(prev => prev - withdrawTokens);
      }

      // Store transaction record
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

      // Success - reset form and show success message
      setSuccessWithdrawalAmount(withdrawalAmount); // Store the amount for the success message
      setWithdrawSuccess(true);
      setWithdrawTokens(0);
      setAccountDetails({
        bankName: "",
        accountNumber: "",
        accountName: "",
      });
      setPassword("");
      
      // Refresh withdrawal history
      fetchWithdrawalHistory();
      
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

  // Check if withdrawal form is valid
  const isWithdrawalValid = 
    withdrawTokens >= 1 && 
    withdrawTokens <= balance && 
    accountDetails.bankName && 
    accountDetails.accountNumber && 
    accountDetails.accountName && 
    password;

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state while initializing client-side
  if (!isClient) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Token Balance</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-10 md:h-12 bg-gray-200 rounded-lg"></div>
          <div className="h-10 md:h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

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
            
            <p className="text-xs text-gray-500 text-center">
              Payments processed securely via Paystack
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