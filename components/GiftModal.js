import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Gift, Hand } from "lucide-react";
import CustomAlert from "./CustomAlert";
import { supabase } from "../lib/supabaseClient";

// Helper function to get user's name with role-based lookup
const getUserName = async (userId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Unknown User';

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
      return 'Unknown User';
    }

    const role = userData?.role;
    let userName = 'Unknown User';

    if (role === 'fans') {
      const { data: fanData } = await supabase
        .from('fans')
        .select('full_name')
        .eq('id', userId)
        .single();
      userName = fanData?.full_name || 'Unknown Fan';
    } else if (role === 'publisher') {
      const { data: pubData } = await supabase
        .from('publishers')
        .select('name')
        .eq('id', userId)
        .single();
      userName = pubData?.name || 'Unknown Publisher';
    }

    return userName;
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'Unknown User';
  }
};

const gifts = [
  { name: 'Rose', tokenValue: 10, color: '#FF6B6B', emoji: '🌹' },
  { name: 'Chocolate', tokenValue: 50, color: '#8B4513', emoji: '🍫' },
  { name: 'Diamond', tokenValue: 100, color: '#B9F2FF', emoji: '💎' },
  { name: 'Crown', tokenValue: 200, color: '#FFD700', emoji: '👑' },
  { name: 'Car', tokenValue: 500, color: '#FF4444', emoji: '🚗' },
  { name: 'Yacht', tokenValue: 1000, color: '#4169E1', emoji: '🛥️' },
  { name: 'Jet', tokenValue: 3000, color: '#87CEEB', emoji: '✈️' },
  { name: 'Mansion', tokenValue: 5000, color: '#9370DB', emoji: '🏰' },
  { name: 'Super Star', tokenValue: 10000, color: '#FF69B4', emoji: '🌟' },
];

const paymentMethods = [
  { 
    label: "Wallet", 
    id: "wallet", 
    image: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/gtoken.png",
    alt: "GToken Wallet"
  },
  { 
    label: "Pay with Card", 
    id: "global_payment", 
    image: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/visamastercard.jpg",
    alt: "Visa Mastercard"
  },
  { 
    label: "Paystack", 
    id: "paystack", 
    image: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/paystack.png",
    alt: "Naira Payment"
  },
];

export default function GiftModal({ candidate, event, onClose, pageColor, session, onGiftSuccess, showSuccessAlert }) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' });
  const [userCountry, setUserCountry] = useState("NG");
  const [userEmail, setUserEmail] = useState("");
  const [showHandPointer, setShowHandPointer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const tokenCost = selectedGift ? selectedGift.tokenValue : 0;

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    // Show hand pointer on mobile when gift is selected
    if (isMobile && selectedGift && !selectedPaymentMethod) {
      setShowHandPointer(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowHandPointer(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowHandPointer(false);
    }
  }, [selectedGift, selectedPaymentMethod, isMobile]);

  const getDisplayPrice = () => {
    if (!selectedGift) return null;

    const baseCost = selectedGift.tokenValue;
    
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

  const handleSelectGift = (gift) => {
    setSelectedGift(gift);
    // On mobile, scroll to payment section after selecting gift
    if (isMobile) {
      setTimeout(() => {
        const paymentSection = document.getElementById('payment-section-mobile');
        if (paymentSection) {
          paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  };

  const handleShowCustomAlert = (title, message, type = "info") => {
    setAlertData({ title, message, type });
    setShowCustomAlert(true);
  };

  const handleCloseCustomAlert = () => {
    setShowCustomAlert(false);
  };

  const handleGift = () => {
    if (!selectedGift) {
      handleShowCustomAlert("Select Gift", "Please select a gift to send.", "warning");
      return;
    }
    
    // For wallet payments, require authentication
    if (selectedPaymentMethod === "wallet" && !session) {
      handleShowCustomAlert("Authentication Required", "Please login to send gift using wallet balance.", "error");
      return;
    }
    
    setShowConfirmModal(true);
  };

  // Process wallet payment for gift
  const processWalletGift = async () => {
    try {
      if (!session?.user?.id) {
        handleShowCustomAlert("Authentication Required", "Please login to send gift using wallet balance.", "error");
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

      // Get current candidate data
      const { data: candidateData } = await supabase
        .from('candidates')
        .select('votes, gifts')
        .eq('id', candidate.id)
        .single();

      const currentVotes = candidateData?.votes || 0;
      const currentGifts = candidateData?.gifts || 0;
      const newGifts = currentGifts + selectedGift.tokenValue;
      const newPoints = (currentVotes + newGifts) / 10;

      // Update candidate gifts
      await supabase
        .from('candidates')
        .update({ 
          gifts: newGifts,
          points: newPoints
        })
        .eq('id', candidate.id);

      // Deduct from user wallet
      await supabase
        .from('token_wallets')
        .update({ 
          balance: userWallet.balance - tokenCost, 
          last_action: `Sent ${selectedGift.name} to ${candidate.full_name}` 
        })
        .eq('user_id', session.user.id);

      // Add to publisher wallet
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
            last_action: `Receive ${selectedGift.name} from user` 
          })
          .eq('user_id', event.user_id);
      } else {
        await supabase
          .from('token_wallets')
          .insert({ 
            user_id: event.user_id, 
            balance: tokenCost, 
            last_action: `Receive ${selectedGift.name} from user` 
          });
      }

      // Create transaction record
      await supabase
        .from('token_transactions')
        .insert({
          user_id: session.user.id,
          tokens_out: tokenCost,
          description: `Sent ${selectedGift.name} to ${candidate.full_name} in ${event.name} using wallet`,
          transaction_id: `gift_${session.user.id}_${candidate.id}_${Date.now()}`,
          reference: `gift_${candidate.id}`,
          payment_method: 'wallet',
          created_at: new Date().toISOString(),
        });

      return true;
    } catch (error) {
      console.error('Error processing wallet gift:', error);
      throw error;
    }
  };

  // Process Paystack payment for gift
  const processPaystackGift = async () => {
    let paystackReference;

    try {
      // Calculate amount based on currency
      const amount = selectedPaymentMethod === "paystack" && userCountry === "NG" 
        ? Math.round(selectedGift.tokenValue * 1500)
        : selectedGift.tokenValue;

      const currency = userCountry === "NG" ? "NGN" : "USD";

      // Create transaction record first
      const transactionId = `paystack_${session?.user?.id || 'guest'}_${candidate.id}_${Date.now()}`;
      paystackReference = `gift_${transactionId}`;

      // For guest users, collect email
      let voterEmail = userEmail;
      if (!voterEmail) {
        voterEmail = prompt("Please enter your email address to continue with payment:");
        if (!voterEmail) {
          handleShowCustomAlert("Email Required", "Email is required to process payment.", "error");
          return false;
        }
      }

      const { data: fiatTransaction, error: fiatError } = await supabase
        .from('fiat_transactions')
        .insert({
          user_id: session?.user?.id || null,
          guest_email: !session?.user?.id ? voterEmail : null,
          event_id: event.id,
          candidate_id: candidate.id,
          publisher_id: event.user_id,
          amount: amount,
          currency: currency,
          points: selectedGift.tokenValue,
          payment_method: 'paystack',
          paystack_reference: paystackReference,
          status: 'pending',
          description: `Gift ${selectedGift.name} for ${candidate.full_name} in ${event.name}`,
        })
        .select()
        .single();

      if (fiatError) throw fiatError;

      // Use API route for payment
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
                display_name: "Gift",
                variable_name: "gift_name", 
                value: selectedGift.name
              },
              {
                display_name: "Gift Value",
                variable_name: "gift_value", 
                value: selectedGift.tokenValue.toString()
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
        window.location.href = paystackData.data.authorization_url;
        return true;
      } else {
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Error processing Paystack gift:', error);
      
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

  const processGift = async () => {
    setLoading(true);
    try {
      let success = false;

      if (selectedPaymentMethod === "wallet") {
        success = await processWalletGift();
        
        if (success) {
          showSuccessAlert(`Your gift was sent successfully! You sent ${selectedGift.name} to ${candidate.full_name}.`);
          onGiftSuccess();
          onClose();
        }
      } 
      else if (selectedPaymentMethod === "paystack") {
        success = await processPaystackGift();
        if (success) {
          setShowConfirmModal(false);
          setLoading(false);
          return;
        }
      }
      else {
        handleShowCustomAlert("Coming Soon", "This payment method is coming soon.", "info");
      }

    } catch (error) {
      console.error('Error processing gift:', error);
      handleShowCustomAlert(
        "Gift Failed", 
        error.message || "There was an error sending your gift. Please try again.", 
        "error"
      );
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
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
            <Image src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/gleedz022.jpg" 
            alt="Gift background" fill className="object-cover" unoptimized />
          </div>

          {/* Header - Fixed */}
          <div className="relative z-10 p-4 lg:p-6 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <Gift className="w-6 h-6 lg:w-8 lg:h-8" style={{ color: pageColor }} />
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-white">Send Gift to {candidate.full_name}</h3>
                  <p className="text-xs text-gray-300 mt-1">Choose a special gift to show your support</p>
                </div>
              </div>
              
              {candidate.photo && (
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl border-2 border-white overflow-hidden shadow-lg">
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
            <div className="relative z-10 p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Left Column - Gifts Selection */}
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold mb-3 lg:mb-4 text-gray-300">Select Gift</h4>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                    {gifts.map((gift) => {
                      const optionDisplayPrice = selectedPaymentMethod === "wallet" 
                        ? `${gift.tokenValue} token${gift.tokenValue !== 1 ? 's' : ''}`
                        : selectedPaymentMethod === "paystack" && userCountry === "NG"
                        ? `₦${Math.round(gift.tokenValue * 1500).toLocaleString()}`
                        : `$${gift.tokenValue}`;

                      return (
                        <motion.button
                          key={gift.name}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectGift(gift)}
                          className={`p-1.5 lg:p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                            selectedGift?.name === gift.name
                              ? 'shadow-lg transform scale-105'
                              : 'border-gray-700 hover:border-gray-500 hover:shadow-md'
                          }`}
                          style={{ 
                            borderColor: selectedGift?.name === gift.name ? gift.color : undefined,
                            backgroundColor: selectedGift?.name === gift.name ? `${gift.color}20` : 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <div className="space-y-0.5 lg:space-y-1">
                            <div className="text-lg lg:text-xl text-center mb-1">
                              {gift.emoji}
                            </div>
                            <p className="text-[10px] lg:text-xs font-semibold text-white leading-tight text-center">
                              {gift.name}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-[8px] lg:text-[10px] text-gray-400 leading-tight">
                                {optionDisplayPrice}
                              </p>
                              {selectedPaymentMethod !== "wallet" && (
                                <div className="w-2.5 h-2.5 lg:w-4 lg:h-4 flex-shrink-0 relative">
                                  <Image
                                    src={
                                      selectedPaymentMethod === "global_payment" 
                                        ? "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/visamastercard.jpg"
                                        : "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/paystack.png"
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

                  {/* Mobile Hand Pointer Animation */}
                  {showHandPointer && isMobile && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center mt-3 p-2 bg-blue-500/20 rounded-xl border border-blue-500/30"
                    >
                      <div className="flex items-center space-x-2">
                        <Hand className="w-4 h-4 text-blue-400 animate-bounce" />
                        <span className="text-xs text-blue-300 font-medium">Choose payment method below</span>
                        <Hand className="w-4 h-4 text-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </motion.div>
                  )}

                  {/* Selected Gift Summary */}
                  {selectedGift && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-xl p-3 lg:p-4 border border-gray-700 mt-3 lg:mt-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{selectedGift.emoji}</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-300">Selected Gift</p>
                            <p className="text-lg font-bold text-white">{selectedGift.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-300">Total Cost</p>
                          <p className="text-lg font-bold" style={{ color: selectedGift.color }}>
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
                  <div className="bg-blue-900/20 rounded-xl p-3 lg:p-4 border border-blue-700/30 mt-3 lg:mt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                        <span className="text-xs text-white">i</span>
                      </div>
                      <div className="text-xs text-blue-200">
                        <p className="font-semibold mb-1">How gifting works:</p>
                        <ul className="space-y-1">
                          <li>• Each gift adds to the candidate's total gifts value</li>
                          <li>• 1 token = $1 value</li>
                          <li>• Gifts are displayed publicly to show your support</li>
                          <li>• You can send multiple gifts</li>
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
                <div className="lg:col-span-1" id="payment-section-mobile">
                  <div className="bg-gray-800/50 rounded-xl p-3 lg:p-4 border border-gray-700 lg:sticky lg:top-4">
                    <h4 className="text-sm font-semibold mb-3 lg:mb-4 text-gray-300">Payment Method</h4>
                    <div className="space-y-2 lg:space-y-3">
                      {paymentMethods.map((method) => (
                        <motion.label
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          htmlFor={`gift-${method.id}`}
                          className={`flex items-center p-2 lg:p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                            selectedPaymentMethod === method.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-600 hover:border-gray-400 bg-gray-700/50'
                          }`}
                        >
                          <input
                            type="radio"
                            id={`gift-${method.id}`}
                            name="giftPaymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => setSelectedPaymentMethod(method.id)}
                            className="hidden"
                          />
                          <div className="w-6 h-6 lg:w-8 lg:h-8 relative mr-2 lg:mr-3 flex-shrink-0">
                            <Image
                              src={method.image}
                              alt={method.alt}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                          <span className="text-xs lg:text-sm text-white">
                            {method.id === "global_payment" ? "Pay with Card" : method.label}
                          </span>
                        </motion.label>
                      ))}
                    </div>

                    {/* Payment Method Info */}
                    <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-gray-700/30 rounded-lg">
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
          <div className="relative z-10 p-4 lg:p-6 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm pb-6 lg:pb-6">
            <div className="flex gap-2 lg:gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 lg:px-6 py-2 lg:py-3 bg-gray-700 rounded-xl text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleGift}
                disabled={!selectedGift || loading}
                className="flex-1 px-4 lg:px-6 py-2 lg:py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: !selectedGift || loading ? '#6B7280' : (selectedGift?.color || pageColor),
                  opacity: !selectedGift || loading ? 0.5 : 1
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs lg:text-sm">Processing...</span>
                  </div>
                ) : (
                  `Send ${selectedGift?.name || 'Gift'}`
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
        title="Confirm Gift"
        message={
          selectedPaymentMethod === "paystack" 
            ? `You will be redirected to Paystack to complete your payment of ${displayPrice?.display} for ${selectedGift?.name} gift. Continue?`
            : `You're about to send ${selectedGift?.name} gift to ${candidate.full_name} for ${displayPrice?.display}. This action cannot be undone.`
        }
        type="warning"
        onConfirm={processGift}
        confirmText={loading ? "Processing..." : selectedPaymentMethod === "paystack" ? "Proceed to Payment" : "Yes, Send Gift"}
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