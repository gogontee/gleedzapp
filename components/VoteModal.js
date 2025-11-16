import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Vote } from "lucide-react";
import CustomAlert from "./CustomAlert";
import { supabase } from "../lib/supabaseClient";

const pointOptions = [
  { points: 1, label: "1 Point", cost: 1 },
  { points: 10, label: "10 Points", cost: 10 },
  { points: 50, label: "50 Points", cost: 50 },
  { points: 100, label: "100 Points", cost: 100 },
  { points: 200, label: "200 Points", cost: 200 },
  { points: 500, label: "500 Points", cost: 500 },
  { points: 1000, label: "1,000 Points", cost: 1000 },
  { points: 2500, label: "2,500 Points", cost: 2500 },
  { points: 5000, label: "5,000 Points", cost: 5000 },
];

const paymentMethods = [
  { 
    label: "Wallet", 
    id: "wallet", 
    image: "/gtoken.png",
    alt: "GToken Wallet"
  },
  { 
    label: "Pay with Card", 
    id: "global_payment", 
    image: "/visamastercard.jpg",
    alt: "Visa Mastercard"
  },
  { 
    label: "Paystack", 
    id: "paystack", 
    image: "/nairaa.png",
    alt: "Naira Payment"
  },
];

export default function VoteModal({ candidate, event, onClose, pageColor, session, onVoteSuccess, showSuccessAlert }) {
  const [selectedPoints, setSelectedPoints] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' });
  const [userCountry, setUserCountry] = useState("NG");
  const [userEmail, setUserEmail] = useState("");

  const tokenPerPoint = 1;
  const tokenCost = selectedPoints ? selectedPoints.cost : 0;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setUserCountry("NG");
        
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        } else if (session?.user?.id) {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', session.user.id)
            .single();
          
          if (userData?.email) {
            setUserEmail(userData.email);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserCountry("NG");
      }
    };
    
    if (session) {
      fetchUserData();
    }
  }, [session]);

  const getDisplayPrice = () => {
    if (!selectedPoints) return null;

    const baseCost = selectedPoints.cost;
    
    if (selectedPaymentMethod === "wallet") {
      return {
        amount: baseCost,
        currency: "token",
        symbol: "token",
        display: `${baseCost} token${baseCost !== 1 ? 's' : ''}`
      };
    }
    
    if (selectedPaymentMethod === "paystack" && userCountry === "NG") {
      const nairaAmount = baseCost * 1500;
      return {
        amount: Math.round(nairaAmount),
        currency: "NGN",
        symbol: "₦",
        display: `₦${Math.round(nairaAmount).toLocaleString()}`
      };
    }
    
    return {
      amount: baseCost,
      currency: "USD",
      symbol: "$",
      display: `$${baseCost}`
    };
  };

  const displayPrice = getDisplayPrice();

  const handleSelectPoints = (option) => {
    setSelectedPoints(option);
  };

  const handleShowCustomAlert = (title, message, type = "info") => {
    setAlertData({ title, message, type });
    setShowCustomAlert(true);
  };

  const handleCloseCustomAlert = () => {
    setShowCustomAlert(false);
  };

  const handleVote = () => {
    if (!selectedPoints) {
      handleShowCustomAlert("Select Points", "Please select the number of points to vote.", "warning");
      return;
    }
    
    // For wallet payments, require authentication
    if (selectedPaymentMethod === "wallet" && !session) {
      handleShowCustomAlert("Authentication Required", "Please login to vote using wallet balance.", "error");
      return;
    }
    
    setShowConfirmModal(true);
  };

  // Process wallet payment
  const processWalletVote = async () => {
    try {
      if (!session?.user?.id) {
        handleShowCustomAlert("Authentication Required", "Please login to vote using wallet balance.", "error");
        return false;
      }

      const { data: userWallet } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();

      if (userWallet.balance < tokenCost) {
        handleShowCustomAlert("Insufficient Balance", `You need ${tokenCost} tokens but only have ${userWallet.balance}.`, "error");
        return false;
      }

      const { data: candidateData } = await supabase
        .from('candidates')
        .select('votes, gifts')
        .eq('id', candidate.id)
        .single();

      const newVotes = (candidateData?.votes || 0) + selectedPoints.points;
      const newPoints = (newVotes + (candidateData?.gifts || 0)) / 10;

      await supabase
        .from('candidates')
        .update({ votes: newVotes, points: newPoints })
        .eq('id', candidate.id);

      await supabase
        .from('token_wallets')
        .update({ 
          balance: userWallet.balance - tokenCost, 
          last_action: `Vote for ${candidate.full_name}` 
        })
        .eq('user_id', session.user.id);

      const { data: publisherWallet } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', event.user_id)
        .single();

      if (publisherWallet) {
        await supabase
          .from('token_wallets')
          .update({ 
            balance: publisherWallet.balance + tokenCost, 
            last_action: `Receive vote from ${session.user.id}` 
          })
          .eq('user_id', event.user_id);
      } else {
        await supabase
          .from('token_wallets')
          .insert({ 
            user_id: event.user_id, 
            balance: tokenCost, 
            last_action: `Receive vote from ${session.user.id}` 
          });
      }

      await supabase
        .from('token_transactions')
        .insert({
          user_id: session.user.id,
          tokens_out: tokenCost,
          description: `Vote for ${candidate.full_name} in ${event.name} using wallet`,
          transaction_id: `vote_${session.user.id}_${candidate.id}_${Date.now()}`,
          reference: `vote_${candidate.id}`,
          payment_method: 'wallet',
          created_at: new Date().toISOString(),
        });

      return true;
    } catch (error) {
      console.error('Error processing wallet vote:', error);
      throw error;
    }
  };

  // Process Paystack payment for vote
  const processPaystackVote = async () => {
    let paystackReference; // Declare variable at function scope

    try {
      // Calculate amount based on currency
      const amount = selectedPaymentMethod === "paystack" && userCountry === "NG" 
        ? Math.round(selectedPoints.cost * 1500)
        : selectedPoints.cost;

      const currency = userCountry === "NG" ? "NGN" : "USD";

      // Create transaction record first
      const transactionId = `paystack_${session?.user?.id || 'guest'}_${candidate.id}_${Date.now()}`;
      paystackReference = `vote_${transactionId}`; // Assign to the scoped variable

      // For guest users, collect email
      let voterEmail = userEmail;
      if (!voterEmail) {
        // Prompt guest user for email
        voterEmail = prompt("Please enter your email address to continue with payment:");
        if (!voterEmail) {
          handleShowCustomAlert("Email Required", "Email is required to process payment.", "error");
          return false;
        }
      }

      const { data: fiatTransaction, error: fiatError } = await supabase
        .from('fiat_transactions')
        .insert({
          user_id: session?.user?.id || null, // null for guest users
          guest_email: !session?.user?.id ? voterEmail : null, // store email for guests
          event_id: event.id,
          candidate_id: candidate.id,
          publisher_id: event.user_id,
          amount: amount,
          currency: currency,
          points: selectedPoints.points,
          payment_method: 'paystack',
          paystack_reference: paystackReference,
          status: 'pending',
          description: `Vote for ${candidate.full_name} in ${event.name}`,
        })
        .select()
        .single();

      if (fiatError) throw fiatError;

      // Use API route instead of direct Paystack call
      const paymentResponse = await fetch('/api/vote/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: voterEmail,
          amount: amount,
          reference: paystackReference,
          callback_url: `${window.location.origin}/payment/process`,
          metadata: {
            custom_fields: [
              {
                display_name: "Candidate",
                variable_name: "candidate_name",
                value: candidate.full_name
              },
              {
                display_name: "Event", 
                variable_name: "event_name",
                value: event.name
              },
              {
                display_name: "Points",
                variable_name: "points", 
                value: selectedPoints.points.toString()
              }
            ],
            fiat_transaction_id: fiatTransaction.id,
            user_id: session?.user?.id || 'guest',
            guest_email: !session?.user?.id ? voterEmail : null
          }
        })
      });

      const paystackData = await paymentResponse.json();

      if (paystackData.error) {
        throw new Error(paystackData.error);
      }

      if (paystackData.status && paystackData.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = paystackData.data.authorization_url;
        return true;
      } else {
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Error processing Paystack vote:', error);
      
      // Update transaction status to failed - now paystackReference is accessible
      if (paystackReference) {
        await supabase
          .from('fiat_transactions')
          .update({ status: 'failed' })
          .eq('paystack_reference', paystackReference)
          .order('created_at', { ascending: false })
          .limit(1);
      }
      
      throw error;
    }
  };

  const processVote = async () => {
    setLoading(true);
    try {
      let success = false;

      if (selectedPaymentMethod === "wallet") {
        success = await processWalletVote();
        
        if (success) {
          showSuccessAlert(`Your vote was successful! You voted for ${candidate.full_name} with ${selectedPoints.points} points.`);
          onVoteSuccess();
          onClose();
        }
      } 
      else if (selectedPaymentMethod === "paystack") {
        success = await processPaystackVote();
        // For Paystack, we redirect to payment page, so we close modals
        if (success) {
          setShowConfirmModal(false);
          setLoading(false);
          return; // Exit early since we're redirecting
        }
      }
      else {
        handleShowCustomAlert("Coming Soon", "This payment method is coming soon.", "info");
      }

    } catch (error) {
      console.error('Error processing vote:', error);
      handleShowCustomAlert(
        "Vote Failed", 
        error.message || "There was an error processing your vote. Please try again.", 
        "error"
      );
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      {/* Main Modal - Keep your existing JSX structure */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-gray-900 rounded-2xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Image */}
          <div className="absolute inset-0 opacity-20">
            <Image src="/gleedzbg3.jpg" alt="Vote background" fill className="object-cover" unoptimized />
          </div>

          {/* Header - Fixed */}
          <div className="relative z-10 p-6 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Vote className="w-8 h-8" style={{ color: pageColor }} />
                <div>
                  <h3 className="text-lg font-bold text-white">Vote for {candidate.full_name}</h3>
                  <p className="text-xs text-gray-300 mt-1">Choose points to cast your vote</p>
                </div>
              </div>
              
              {candidate.photo && (
                <div className="w-16 h-16 rounded-2xl border-2 border-white overflow-hidden shadow-lg">
                  <Image
                    src={candidate.photo}
                    alt={candidate.full_name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="relative z-10 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Points Selection */}
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold mb-4 text-gray-300">Select Points</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {pointOptions.map((option) => {
                      const optionDisplayPrice = selectedPaymentMethod === "wallet" 
                        ? `${option.cost} token${option.cost !== 1 ? 's' : ''}`
                        : selectedPaymentMethod === "paystack" && userCountry === "NG"
                        ? `₦${Math.round(option.cost * 1500).toLocaleString()}`
                        : `$${option.cost}`;

                      return (
                        <motion.button
                          key={option.points}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectPoints(option)}
                          className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                            selectedPoints?.points === option.points
                              ? 'shadow-lg transform scale-105'
                              : 'border-gray-700 hover:border-gray-500 hover:shadow-md'
                          }`}
                          style={{ 
                            borderColor: selectedPoints?.points === option.points ? pageColor : undefined,
                            backgroundColor: selectedPoints?.points === option.points ? `${pageColor}20` : 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-white leading-tight">{option.label}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-gray-400 leading-tight">
                                {optionDisplayPrice}
                              </p>
                              {selectedPaymentMethod !== "wallet" && (
                                <div className="w-4 h-4 flex-shrink-0 relative">
                                  <Image
                                    src={
                                      selectedPaymentMethod === "global_payment" 
                                        ? "/visamastercard.jpg"
                                        : "/nairaa.png"
                                    }
                                    alt={selectedPaymentMethod === "global_payment" ? "Pay with Card" : "Naira Payment"}
                                    fill
                                    className="object-cover rounded"
                                    unoptimized
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Selected Points Summary */}
                  {selectedPoints && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mt-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-300">Selected Points</p>
                          <p className="text-lg font-bold text-white">{selectedPoints.points.toLocaleString()} Points</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-300">Total Cost</p>
                          <p className="text-lg font-bold" style={{ color: pageColor }}>
                            {displayPrice?.display}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {selectedPaymentMethod === "global_payment" ? "pay with card" : selectedPaymentMethod.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Info Section */}
                  <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30 mt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                        <span className="text-xs text-white">i</span>
                      </div>
                      <div className="text-xs text-blue-200">
                        <p className="font-semibold mb-1">How voting works:</p>
                        <ul className="space-y-1">
                          <li>• 1 point = 1 vote for the candidate</li>
                          <li>• 1 point = 1 token = $1</li>
                          <li>• Points are converted to votes instantly</li>
                          <li>• You can vote multiple times</li>
                          {selectedPaymentMethod === "paystack" && userCountry === "NG" && (
                            <li>• Prices displayed in Nigerian Naira (₦) at $1 = ₦1500</li>
                          )}
                          {selectedPaymentMethod !== "wallet" && selectedPaymentMethod !== "paystack" && (
                            <li>• Prices displayed in US Dollars ($)</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Payment Methods */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 sticky top-4">
                    <h4 className="text-sm font-semibold mb-4 text-gray-300">Payment Method</h4>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <motion.label
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          htmlFor={method.id}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                            selectedPaymentMethod === method.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-600 hover:border-gray-400 bg-gray-700/50'
                          }`}
                        >
                          <input
                            type="radio"
                            id={method.id}
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => setSelectedPaymentMethod(method.id)}
                            className="hidden"
                          />
                          <div className="w-8 h-8 relative mr-3 flex-shrink-0">
                            <Image
                              src={method.image}
                              alt={method.alt}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                          <span className="text-sm text-white">
                            {method.id === "global_payment" ? "Pay with Card" : method.label}
                          </span>
                        </motion.label>
                      ))}
                    </div>

                    {/* Payment Method Info */}
                    <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-300">
                        {selectedPaymentMethod === "wallet" && "Pay directly from your token wallet balance"}
                        {selectedPaymentMethod === "global_payment" && "Pay with international credit/debit cards (Coming Soon)"}
                        {selectedPaymentMethod === "paystack" && userCountry === "NG" && "Pay with Nigerian cards and bank transfers"}
                        {selectedPaymentMethod === "paystack" && userCountry !== "NG" && "Pay with international payment methods"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="relative z-10 p-6 lg:p-6 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm pb-8 lg:pb-6">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-700 rounded-xl text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={!selectedPoints || loading}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: !selectedPoints || loading ? '#6B7280' : pageColor,
                  opacity: !selectedPoints || loading ? 0.5 : 1
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Vote with ${selectedPoints?.points?.toLocaleString()} Points`
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirm Modal */}
      <CustomAlert
        isOpen={showConfirmModal}
        onClose={() => !loading && setShowConfirmModal(false)}
        title="Confirm Vote"
        message={
          selectedPaymentMethod === "paystack" 
            ? `You will be redirected to Paystack to complete your payment of ${displayPrice?.display} for ${selectedPoints?.points?.toLocaleString()} points. Continue?`
            : `You're about to vote for ${candidate.full_name} with ${selectedPoints?.points?.toLocaleString()} points for ${displayPrice?.display}. This action cannot be undone.`
        }
        type="warning"
        onConfirm={processVote}
        confirmText={loading ? "Processing..." : selectedPaymentMethod === "paystack" ? "Proceed to Payment" : "Yes, Vote Now"}
        cancelText="Cancel"
      />

      {/* Custom Alert */}
      <CustomAlert
        isOpen={showCustomAlert}
        onClose={handleCloseCustomAlert}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onConfirm={handleCloseCustomAlert}
        confirmText="OK"
        cancelText={null}
      />
    </>
  );
}