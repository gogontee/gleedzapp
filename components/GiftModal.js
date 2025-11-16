import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { Gift, Smile, Flower, Star, Heart, Crown, Zap, Award } from "lucide-react";
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
  { name: 'Smile', tokenValue: 10, icon: Smile },
  { name: 'Flower', tokenValue: 50, icon: Flower },
  { name: 'Star', tokenValue: 100, icon: Star },
  { name: 'Heart', tokenValue: 200, icon: Heart },
  { name: 'Crown', tokenValue: 500, icon: Crown },
  { name: 'Dragon', tokenValue: 1000, icon: Zap },
  { name: 'Jet', tokenValue: 3000, icon: Award },
  { name: 'Fortune Box', tokenValue: 5000, icon: Gift },
];

export default function GiftModal({ candidate, event, onClose, pageColor, session, onGiftSuccess, showSuccessAlert }) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' });

  const handleShowCustomAlert = (title, message, type = "info") => {
    setAlertData({ title, message, type });
    setShowCustomAlert(true);
  };

  const handleCloseCustomAlert = () => {
    setShowCustomAlert(false);
  };

  const handleGift = async () => {
    if (!selectedGift) {
      handleShowCustomAlert("Select Gift", "Please select a gift to send.", "error");
      return;
    }

    if (!session) {
      handleShowCustomAlert("Authentication Required", "Please login to send a gift.", "error");
      return;
    }

    setShowConfirmModal(true);
  };

  const processGift = async () => {
    setLoading(true);
    
    try {
      // 1. Check user wallet balance
      const { data: userWallet, error: walletError } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();

      if (walletError) throw walletError;

      if (userWallet.balance < selectedGift.tokenValue) {
        handleShowCustomAlert("Insufficient Balance", `You don't have enough tokens in your wallet to send this gift. You need ${selectedGift.tokenValue} tokens but only have ${userWallet.balance}. Please add more tokens to your wallet.`, "error");
        return;
      }

      // 2. Get current candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('votes, gifts')
        .eq('id', candidate.id)
        .single();

      if (candidateError) throw candidateError;

      // 3. Update candidate gifts
      const currentVotes = candidateData.votes || 0;
      const currentGifts = candidateData.gifts || 0;
      const newGifts = currentGifts + selectedGift.tokenValue;
      const newPoints = (currentVotes + newGifts) / 10;

      const { error: updateCandidateError } = await supabase
        .from('candidates')
        .update({ 
          gifts: newGifts,
          points: newPoints
        })
        .eq('id', candidate.id);

      if (updateCandidateError) throw updateCandidateError;

      // 4. Get user's name for transaction record
      const userName = await getUserName(session.user.id);

      // 5. Deduct tokens from user's wallet
      const userNewBalance = userWallet.balance - selectedGift.tokenValue;
      const { error: updateUserWalletError } = await supabase
        .from('token_wallets')
        .update({ 
          balance: userNewBalance,
          last_action: `Sent ${selectedGift.name} to ${candidate.nick_name || candidate.full_name} of ${event.name}`
        })
        .eq('user_id', session.user.id);

      if (updateUserWalletError) {
        console.error('Error updating user wallet:', updateUserWalletError);
      }

      // 6. Add tokens to event publisher's wallet
      const { data: publisherWallet, error: publisherWalletError } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', event.user_id)
        .single();

      if (publisherWalletError && publisherWalletError.code !== 'PGRST116') {
        console.error('Error fetching publisher wallet:', publisherWalletError);
      } else {
        const publisherCurrentBalance = publisherWallet?.balance || 0;
        const publisherNewBalance = publisherCurrentBalance + selectedGift.tokenValue;
        const description = `Receive ${selectedGift.name} from ${userName} for ${candidate.nick_name || candidate.full_name}`;

        if (publisherWallet) {
          const { error: updatePublisherError } = await supabase
            .from('token_wallets')
            .update({ 
              balance: publisherNewBalance,
              last_action: description
            })
            .eq('user_id', event.user_id);

          if (updatePublisherError) {
            console.error('Error updating publisher wallet:', updatePublisherError);
          }
        } else {
          const { error: createPublisherError } = await supabase
            .from('token_wallets')
            .insert({
              user_id: event.user_id,
              balance: publisherNewBalance,
              last_action: description
            });

          if (createPublisherError) {
            console.error('Error creating publisher wallet:', createPublisherError);
          }
        }
      }

      // 7. Create transaction record
      const transactionId = `gift_${session.user.id}_${candidate.id}_${selectedGift.name}_${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: session.user.id,
          tokens_out: selectedGift.tokenValue,
          description: `Sent ${selectedGift.name} to ${candidate.nick_name || candidate.full_name} in ${event.name}`,
          transaction_id: transactionId,
          reference: `gift_${candidate.id}_${selectedGift.name}`,
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
      }

      // Show success alert
      showSuccessAlert("Your gift was sent successfully!");
      onGiftSuccess();
      onClose();

    } catch (error) {
      console.error('Error processing gift:', error);
      handleShowCustomAlert("Gift Failed", "There was an error sending your gift. Please try again.", "error");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const displayValue = (gift) => {
    return `${gift.tokenValue} token${gift.tokenValue > 1 ? 's' : ''}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl max-w-xs w-full mx-4 my-8 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Image */}
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/gleedzbg1.jpg"
              alt="Gift background"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          
          <div className="relative z-10 p-5">
            <div className="text-center mb-4">
              <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: pageColor }} />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Send Gift to {candidate.full_name}</h3>
              <p className="text-xs text-gray-600">Show your support with a special gift</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto">
              {gifts.map((gift) => {
                const IconComponent = gift.icon;
                return (
                  <motion.div
                    key={gift.name}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedGift(gift)}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-all duration-300 ${
                      selectedGift?.name === gift.name 
                        ? 'shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      borderColor: selectedGift?.name === gift.name ? pageColor : '',
                      backgroundColor: selectedGift?.name === gift.name ? `${pageColor}08` : 'rgba(255,255,255,0.8)'
                    }}
                  >
                    <IconComponent 
                      className="w-5 h-5 mx-auto mb-1" 
                      style={{ color: selectedGift?.name === gift.name ? pageColor : '#6B7280' }} 
                    />
                    <div className="font-bold text-gray-900 text-xs mb-0.5">{gift.name}</div>
                    <div className="text-xs text-gray-600 font-semibold">{displayValue(gift)}</div>
                  </motion.div>
                );
              })}
            </div>

            {selectedGift && (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 mb-4 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{selectedGift.name} Gift</div>
                    <div className="text-gray-600">Send your support</div>
                  </div>
                  <div className="font-bold text-xs" style={{ color: pageColor }}>
                    {displayValue(selectedGift)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleGift}
                disabled={loading || !selectedGift}
                className="flex-1 px-3 py-2 text-xs text-white font-semibold rounded-lg shadow hover:shadow-md transition-all duration-300 disabled:opacity-50"
                style={{ backgroundColor: pageColor }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Send ${selectedGift?.name || 'Gift'}`
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      <CustomAlert
        isOpen={showConfirmModal}
        onClose={() => {
          if (!loading) setShowConfirmModal(false);
        }}
        title="Confirm Gift"
        message={`You are about to send ${selectedGift?.name} gift to ${candidate.full_name}. This will cost you ${selectedGift?.tokenValue} token${selectedGift?.tokenValue > 1 ? 's' : ''} from your wallet. Do you want to proceed?`}
        type="warning"
        onConfirm={processGift}
        confirmText={loading ? "Processing..." : "Yes, Send Gift"}
        cancelText="Cancel"
      />

      {/* Custom Alert Modal */}
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