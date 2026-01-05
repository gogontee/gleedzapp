import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Vote, Hand } from "lucide-react";
import CustomAlert from "./CustomAlert";
import { supabase } from "../lib/supabaseClient";

// Add PayPal imports
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

// PayPal button wrapper for vote
function PayPalVoteButton({ 
  selectedPoints, 
  candidate, 
  event, 
  userEmail, 
  onSuccess, 
  onError 
}) {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  
  if (!selectedPoints || selectedPoints.cost <= 0) {
    return null;
  }
  
  if (isPending) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading PayPal...
        </div>
      </div>
    );
  }
  
  if (isRejected) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
          PayPal is not available at the moment. Please try another payment method.
        </div>
      </div>
    );
  }
  
  if (!isResolved) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
          PayPal is initializing. Please wait...
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
        const usdAmount = selectedPoints.cost;
        
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
            description: `${selectedPoints.points} points vote for ${candidate.full_name} in ${event.name}`,
            custom_id: `VOTE_${candidate.id}_EVENT_${event.id}_POINTS_${selectedPoints.points}`,
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
      onApprove={onSuccess}
      onError={onError}
      onCancel={() => {
        console.log("PayPal payment cancelled by user");
        alert("Payment was cancelled. You can try again.");
      }}
    />
  );
}

// Point options configuration
const pointOptions = [
  { points: 5, cost: 5, label: "5 Points" },
  { points: 10, cost: 10, label: "10 Points" },
  { points: 25, cost: 25, label: "25 Points" },
  { points: 50, cost: 50, label: "50 Points" },
  { points: 100, cost: 100, label: "100 Points" },
  { points: 250, cost: 250, label: "250 Points" },
  { points: 500, cost: 500, label: "500 Points" },
  { points: 1000, cost: 1000, label: "1000 Points" },
  { points: 2500, cost: 2500, label: "2500 Points" },
];

// Main VoteModal component
export default function VoteModal({ candidate, event, onClose, pageColor, session, onVoteSuccess, showSuccessAlert }) {
  const [selectedPoints, setSelectedPoints] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' });
  const [userCountry, setUserCountry] = useState("NG");
  const [userEmail, setUserEmail] = useState("");
  const [showHandPointer, setShowHandPointer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  
  // PayPal states
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState(null);

  const tokenPerPoint = 1;
  const tokenCost = selectedPoints ? selectedPoints.cost : 0;

  // Update payment methods to include PayPal with new image and label
  const paymentMethods = [
    { 
      label: "Wallet", 
      id: "wallet", 
      image: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/gtoken.png",
      alt: "GToken Wallet"
    },
    { 
      label: "Use USSD Card", 
      id: "paypal", 
      image: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/paypal.jpg",
      alt: "USSD Card Payment via PayPal",
      disabled: !paypalLoaded
    },
    { 
      label: "Paystack", 
      id: "paystack", 
      image: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/paystack.png",
      alt: "Naira Payment"
    },
  ];

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
    // Show hand pointer on mobile when points are selected
    if (isMobile && selectedPoints && !selectedPaymentMethod) {
      setShowHandPointer(true);
      const timer = setTimeout(() => {
        setShowHandPointer(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowHandPointer(false);
    }
  }, [selectedPoints, selectedPaymentMethod, isMobile]);

  // Check if PayPal script is loaded
  useEffect(() => {
    const checkPayPalLoaded = () => {
      if (window.paypal && window.paypal.Buttons) {
        setPaypalLoaded(true);
      }
    };

    // Check immediately
    checkPayPalLoaded();
    
    // Also check after a delay
    const timer = setTimeout(checkPayPalLoaded, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
    
    // PayPal and other methods show USD
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
    
    // For PayPal, we show the PayPal button directly, no confirm modal needed
    if (selectedPaymentMethod === "paypal") {
      if (!paypalLoaded) {
        handleShowCustomAlert("PayPal Loading", "PayPal is still loading. Please wait a moment and try again.", "warning");
      }
      return; // PayPal button handles the flow
    }
    
    setShowConfirmModal(true);
  };

  // Process PayPal payment for vote - UPDATED to use paypal_transactions table
  const processPayPalVote = async (details, actions) => {
    try {
      console.log("PayPal vote payment success details:", details);
      
      const orderId = details.id;
      const captureId = details.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      const payerEmail = details.payer?.email_address;
      const payerName = details.payer?.name?.given_name + " " + details.payer?.name?.surname;
      
      if (!orderId) {
        throw new Error('No order ID found in payment details');
      }

      setPaypalProcessing(true);
      
      // For guest users, collect email if not provided by PayPal
      let voterEmail = userEmail || payerEmail;
      if (!session?.user?.id && !voterEmail) {
        // Prompt for email if not available
        voterEmail = prompt("Please enter your email address to complete your vote:");
        if (!voterEmail) {
          handleShowCustomAlert("Email Required", "Email is required to process your vote.", "error");
          setPaypalProcessing(false);
          return;
        }
      }

      // Create paypal_transactions record
      const { data: paypalTransaction, error: paypalError } = await supabase
        .from('paypal_transactions')
        .insert({
          user_id: session?.user?.id || null,
          guest_email: !session?.user?.id ? voterEmail : null,
          event_id: event.id,
          candidate_id: candidate.id,
          publisher_id: event.user_id,
          amount: selectedPoints.cost,
          currency: 'USD',
          points: selectedPoints.points,
          paypal_order_id: orderId,
          paypal_capture_id: captureId,
          payer_email: payerEmail,
          payer_name: payerName,
          status: 'pending',
          description: `Vote for ${candidate.full_name} in ${event.name} via PayPal`,
        })
        .select()
        .single();

      if (paypalError) throw paypalError;

      // Verify PayPal payment
      const verificationResponse = await fetch('/api/vote/verify-paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          captureId,
          userId: session?.user?.id || null,
          guestEmail: voterEmail,
          candidateId: candidate.id,
          eventId: event.id,
          points: selectedPoints.points,
          amount: selectedPoints.cost,
          paypalTransactionId: paypalTransaction.id
        }),
      });

      const verificationResult = await verificationResponse.json();

      if (!verificationResponse.ok) {
        // Update transaction status to failed
        await supabase
          .from('paypal_transactions')
          .update({ 
            status: 'failed',
            error_message: verificationResult.error || 'Payment verification failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paypalTransaction.id);
          
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

      if (!verificationResult.verified) {
        // Update transaction status to failed
        await supabase
          .from('paypal_transactions')
          .update({ 
            status: 'failed',
            error_message: 'Payment could not be verified with PayPal',
            updated_at: new Date().toISOString()
          })
          .eq('id', paypalTransaction.id);
          
        throw new Error('Payment could not be verified with PayPal');
      }

      // The database trigger will automatically update candidate votes
      // We just need to update the transaction status
      const { error: updateError } = await supabase
        .from('paypal_transactions')
        .update({ 
          status: 'completed',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paypalTransaction.id);

      if (updateError) {
        console.error('Error updating paypal transaction:', updateError);
        // Continue anyway as the trigger might have already updated votes
      }

      // Show success message
      showSuccessAlert(`Your vote was successful! You voted for ${candidate.full_name} with ${selectedPoints.points} points via PayPal.`);
      
      // If user is logged in, update their wallet (optional, if you want to track token transactions)
      if (session?.user?.id) {
        try {
          await supabase
            .from('token_transactions')
            .insert({
              user_id: session.user.id,
              tokens_out: 0, // No tokens deducted for PayPal payment
              description: `Vote for ${candidate.full_name} in ${event.name} via PayPal`,
              transaction_id: `paypal_${orderId}`,
              reference: `vote_${candidate.id}`,
              payment_method: 'paypal',
              created_at: new Date().toISOString(),
            });
        } catch (tokenError) {
          console.error('Error creating token transaction:', tokenError);
          // Non-critical error, continue
        }
      }

      // Close modal after delay
      setTimeout(() => {
        onVoteSuccess();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error processing PayPal vote:', error);
      setPaypalError(error.message);
      handleShowCustomAlert(
        "Payment Failed", 
        error.message || "There was an error processing your PayPal payment. Please try again.", 
        "error"
      );
    } finally {
      setPaypalProcessing(false);
    }
  };

  const handlePayPalError = (error) => {
    console.error("PayPal Button Error:", error);
    setPaypalError(error.message);
    handleShowCustomAlert(
      "Payment Error", 
      `PayPal payment error: ${error.message}. Please try another method.`, 
      "error"
    );
  };

  // Process wallet payment (existing function - keep as is)
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

  // Process Paystack payment for vote (existing function - keep as is)
  const processPaystackVote = async () => {
    let paystackReference;
    
    try {
      const amount = selectedPaymentMethod === "paystack" && userCountry === "NG" 
        ? Math.round(selectedPoints.cost * 1500)
        : selectedPoints.cost;

      const currency = userCountry === "NG" ? "NGN" : "USD";
      const transactionId = `paystack_${session?.user?.id || 'guest'}_${candidate.id}_${Date.now()}`;
      paystackReference = `vote_${transactionId}`;

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
          points: selectedPoints.points,
          payment_method: 'paystack',
          paystack_reference: paystackReference,
          status: 'pending',
          description: `Vote for ${candidate.full_name} in ${event.name}`,
        })
        .select()
        .single();

      if (fiatError) throw fiatError;

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
        window.location.href = paystackData.data.authorization_url;
        return true;
      } else {
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Error processing Paystack vote:', error);
      
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

  // PayPal provider options
  const paypalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
    components: "buttons",
    disableFunding: "credit,card", // Optional: disable specific funding methods
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <VoteModalContent 
        candidate={candidate}
        event={event}
        onClose={onClose}
        pageColor={pageColor}
        session={session}
        onVoteSuccess={onVoteSuccess}
        showSuccessAlert={showSuccessAlert}
        selectedPoints={selectedPoints}
        setSelectedPoints={setSelectedPoints}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        loading={loading}
        setLoading={setLoading}
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        showCustomAlert={showCustomAlert}
        alertData={alertData}
        userCountry={userCountry}
        userEmail={userEmail}
        showHandPointer={showHandPointer}
        isMobile={isMobile}
        paymentMethods={paymentMethods}
        displayPrice={displayPrice}
        paypalProcessing={paypalProcessing}
        paypalError={paypalError}
        paypalLoaded={paypalLoaded}
        handleSelectPoints={handleSelectPoints}
        handleShowCustomAlert={handleShowCustomAlert}
        handleCloseCustomAlert={handleCloseCustomAlert}
        handleVote={handleVote}
        processPayPalVote={processPayPalVote}
        handlePayPalError={handlePayPalError}
        processVote={processVote}
      />
    </PayPalScriptProvider>
  );
}

// Inner component for the modal content
function VoteModalContent({
  candidate,
  event,
  onClose,
  pageColor,
  session,
  onVoteSuccess,
  showSuccessAlert,
  selectedPoints,
  setSelectedPoints,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  loading,
  setLoading,
  showConfirmModal,
  setShowConfirmModal,
  showCustomAlert,
  alertData,
  userCountry,
  userEmail,
  showHandPointer,
  isMobile,
  paymentMethods,
  displayPrice,
  paypalProcessing,
  paypalError,
  paypalLoaded,
  handleSelectPoints,
  handleShowCustomAlert,
  handleCloseCustomAlert,
  handleVote,
  processPayPalVote,
  handlePayPalError,
  processVote
}) {
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
            alt="Vote background" fill className="object-cover" unoptimized />
          </div>

          {/* Header - Fixed */}
          <div className="relative z-10 p-4 lg:p-6 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <Vote className="w-6 h-6 lg:w-8 lg:h-8" style={{ color: pageColor }} />
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-white">Vote for {candidate.full_name}</h3>
                  <p className="text-xs text-gray-300 mt-1">Choose points to cast your vote</p>
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
                {/* Left Column - Points Selection */}
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold mb-3 lg:mb-4 text-gray-300">Select Points</h4>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
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
                          className={`p-1.5 lg:p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                            selectedPoints?.points === option.points
                              ? 'shadow-lg transform scale-105'
                              : 'border-gray-700 hover:border-gray-500 hover:shadow-md'
                          }`}
                          style={{ 
                            borderColor: selectedPoints?.points === option.points ? pageColor : undefined,
                            backgroundColor: selectedPoints?.points === option.points ? `${pageColor}20` : 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <div className="space-y-0.5 lg:space-y-1">
                            <p className="text-[10px] lg:text-xs font-semibold text-white leading-tight">
                              {option.label}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-[8px] lg:text-[10px] text-gray-400 leading-tight">
                                {optionDisplayPrice}
                              </p>
                              {selectedPaymentMethod !== "wallet" && (
                                <div className="w-2.5 h-2.5 lg:w-4 lg:h-4 flex-shrink-0 relative">
                                  <Image
                                    src={
                                      selectedPaymentMethod === "paypal"
                                        ? "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/paypal.jpg"
                                        : selectedPaymentMethod === "paystack"
                                        ? "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/paystack.png"
                                        : "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/visamastercard.jpg"
                                    }
                                    alt={
                                      selectedPaymentMethod === "paypal" ? "Use USSD Card" :
                                      selectedPaymentMethod === "paystack" ? "Naira Payment" : "Pay with Card"
                                    }
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

                  {/* Selected Points Summary */}
                  {selectedPoints && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-xl p-3 lg:p-4 border border-gray-700 mt-3 lg:mt-4"
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
                      
                      {/* PayPal Button Section - Only show when PayPal is selected */}
                      {selectedPaymentMethod === "paypal" && selectedPoints && (
                        <div className="mt-4">
                          <div className="mb-2">
                            <p className="text-xs text-gray-400 text-center">
                              Pay with USSD card via PayPal
                            </p>
                          </div>
                          
                          {/* PayPal Loading State */}
                          {!paypalLoaded && !paypalError && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-blue-600">Initializing PayPal...</p>
                              </div>
                            </div>
                          )}
                          
                          {/* PayPal Error Message */}
                          {paypalError && (
                            <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                              <p className="text-xs font-medium">{paypalError}</p>
                            </div>
                          )}
                          
                          {/* PayPal Button */}
                          {paypalLoaded && (
                            <PayPalVoteButton
                              selectedPoints={selectedPoints}
                              candidate={candidate}
                              event={event}
                              userEmail={userEmail}
                              onSuccess={processPayPalVote}
                              onError={handlePayPalError}
                            />
                          )}
                          
                          {paypalProcessing && (
                            <div className="mt-2 text-center">
                              <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                Processing PayPal payment...
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Info Section */}
                  <div className="bg-blue-900/20 rounded-xl p-3 lg:p-4 border border-blue-700/30 mt-3 lg:mt-4">
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
                          {(selectedPaymentMethod === "paypal" || selectedPaymentMethod === "global_payment") && (
                            <li>• Prices displayed in US Dollars ($)</li>
                          )}
                          {selectedPaymentMethod === "paypal" && (
                            <li>• PayPal accepts USSD cards and other payment methods</li>
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
                          htmlFor={method.id}
                          className={`flex items-center p-2 lg:p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                            selectedPaymentMethod === method.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-600 hover:border-gray-400 bg-gray-700/50'
                          } ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={(e) => {
                            if (method.disabled) {
                              e.preventDefault();
                              handleShowCustomAlert(
                                "PayPal Loading", 
                                "PayPal is still loading. Please wait a moment and try again.", 
                                "info"
                              );
                            }
                          }}
                        >
                          <input
                            type="radio"
                            id={method.id}
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => {
                              if (!method.disabled) {
                                setSelectedPaymentMethod(method.id);
                              }
                            }}
                            className="hidden"
                            disabled={method.disabled}
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
                            {method.label}
                            {method.id === "paypal" && !paypalLoaded && (
                              <span className="ml-2 text-xs text-yellow-400">(Loading...)</span>
                            )}
                          </span>
                        </motion.label>
                      ))}
                    </div>

                    {/* Payment Method Info */}
                    <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-300">
                        {selectedPaymentMethod === "wallet" && "Pay directly from your token wallet balance"}
                        {selectedPaymentMethod === "paypal" && "Pay with USSD card via PayPal (No login required)"}
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
                disabled={loading || paypalProcessing}
                className="flex-1 px-4 lg:px-6 py-2 lg:py-3 bg-gray-700 rounded-xl text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
              >
                Cancel
              </button>
              {/* Hide main vote button when PayPal is selected (PayPal button is shown above) */}
              {selectedPaymentMethod !== "paypal" && (
                <button
                  onClick={handleVote}
                  disabled={!selectedPoints || loading || paypalProcessing}
                  className="flex-1 px-4 lg:px-6 py-2 lg:py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: !selectedPoints || loading ? '#6B7280' : pageColor,
                    opacity: !selectedPoints || loading ? 0.5 : 1
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs lg:text-sm">Processing...</span>
                    </div>
                  ) : (
                    `Vote with ${selectedPoints?.points?.toLocaleString()} Points`
                  )}
                </button>
              )}
              {/* Show a placeholder button when PayPal is selected to maintain layout */}
              {selectedPaymentMethod === "paypal" && (
                <button
                  disabled
                  className="flex-1 px-4 lg:px-6 py-2 lg:py-3 rounded-xl text-sm font-semibold text-white opacity-50 cursor-default"
                  style={{ backgroundColor: '#6B7280' }}
                >
                  {paypalLoaded ? 'Use USSD Card Button Above' : 'USSD Card Loading...'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirm Modal (for non-PayPal methods) */}
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