"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../../lib/supabaseClient";
import { 
  Ticket, 
  Wallet, 
  Lock, 
  Star, 
  Check, 
  X, 
  ArrowLeft,
  Shield,
  Zap,
  Crown,
  Users,
  Calendar,
  Clock,
  MapPin,
  Grid3X3,
  List,
  Coins
} from "lucide-react";
import EventHeader from "../../../../components/EventHeader";

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchEventData();
    checkAuth();
  }, [eventId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      setEvent(data);
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = (ticket) => {
    if (!user) {
      showCustomAlert("Authentication Required", "Please login to purchase tickets using your Gleedz wallet.", "warning");
      return;
    }
    setSelectedTicket(ticket);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedTicket) return;

    const confirmed = window.confirm(
      `${selectedTicket.price} tokens will be deducted from your wallet to purchase "${selectedTicket.name}". Do you want to proceed?`
    );

    if (!confirmed) {
      setShowPaymentModal(false);
      return;
    }

    setProcessing(true);

    try {
      // Check user wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('token_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      if (wallet.balance < selectedTicket.price) {
        showCustomAlert("Insufficient Balance", `You don't have enough tokens in your wallet. Required: ${selectedTicket.price} tokens`, "error");
        setProcessing(false);
        return;
      }

      // Deduct tokens from user's wallet
      const { error: deductError } = await supabase
        .from('token_wallets')
        .update({
          balance: wallet.balance - selectedTicket.price,
          last_action: `Purchased ${selectedTicket.name} for ${event.name}`
        })
        .eq('user_id', user.id);

      if (deductError) throw deductError;

      // Add tokens to event publisher's wallet
      const { data: publisherWallet, error: publisherWalletError } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', event.user_id)
        .single();

      if (publisherWalletError && publisherWalletError.code !== 'PGRST116') {
        throw publisherWalletError;
      }

      const publisherCurrentBalance = publisherWallet?.balance || 0;
      const publisherNewBalance = publisherCurrentBalance + selectedTicket.price;

      if (publisherWallet) {
        const { error: updatePublisherError } = await supabase
          .from('token_wallets')
          .update({ 
            balance: publisherNewBalance,
            last_action: `Received payment for ${selectedTicket.name} from ${event.name}`
          })
          .eq('user_id', event.user_id);

        if (updatePublisherError) throw updatePublisherError;
      } else {
        const { error: createPublisherError } = await supabase
          .from('token_wallets')
          .insert({
            user_id: event.user_id,
            balance: publisherNewBalance,
            last_action: `Received payment for ${selectedTicket.name} from ${event.name}`
          });

        if (createPublisherError) throw createPublisherError;
      }

      // Update ticket quantity in events table
      const updatedTickets = tickets.map(t => 
        t.name === selectedTicket.name 
          ? { ...t, available_quantity: t.available_quantity - 1 }
          : t
      );

      const { error: updateEventError } = await supabase
        .from('events')
        .update({ tickets: updatedTickets })
        .eq('id', eventId);

      if (updateEventError) throw updateEventError;

      // Create new row in myticket table
      const { error: ticketError } = await supabase
        .from('myticket')
        .insert({
          user_id: user.id,
          events_id: event.id,
          events_name: event.name,
          details: selectedTicket,
          purchase_date: new Date().toISOString(),
          status: 'confirmed'
        });

      if (ticketError) throw ticketError;

      // Update local state
      setTickets(updatedTickets);
      setPurchaseSuccess(true);
      setShowPaymentModal(false);
      
    } catch (error) {
      console.error('Payment error:', error);
      showCustomAlert("Payment Failed", "There was an error processing your payment. Please try again.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const showCustomAlert = (title, message, type) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 max-w-sm transform transition-transform duration-300 ${
      type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
      type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
      type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
      'bg-blue-50 border-blue-500 text-blue-800'
    }`;
    
    alertDiv.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">${title}</h3>
          <p class="text-sm mt-1">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  };

  const getTicketIcon = (ticketName) => {
    if (ticketName.toLowerCase().includes('vip')) return <Crown className="w-6 h-6" />;
    if (ticketName.toLowerCase().includes('regular')) return <Users className="w-6 h-6" />;
    return <Ticket className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: event?.page_color || '#1a1a1a' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-center"
        >
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading tickets...</p>
        </motion.div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-500 to-black text-white relative overflow-hidden"
      style={{ 
        backgroundColor: event?.page_color || '#1a1a1a',
        background: event?.page_color ? `linear-gradient(135deg, ${event.page_color}20, #000000)` : undefined
      }}
    >
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Use EventHeader Component */}
      <EventHeader 
        event={event}
        showBackButton={true}
        backUrl={`/myevent/${eventId}`}
        title="Get Your Tickets"
        subtitle={`Secure your spot for ${event?.name}`}
        rightContent={
          <div className="flex items-center gap-2 bg-white backdrop-blur-sm rounded-xl p-1 border border-white/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'grid' 
                  ? 'text-white shadow-lg' 
                  : 'text-black hover:bg-black/10'
              }`}
              style={{ 
                backgroundColor: viewMode === 'grid' ? pageColor : 'transparent'
              }}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'list' 
                  ? 'text-white shadow-lg' 
                  : 'text-white/70 hover:bg-white/10'
              }`}
              style={{ 
                backgroundColor: viewMode === 'list' ? pageColor : 'transparent'
              }}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        }
      />

      {/* Stats Banner */}
      {tickets.length > 0 && (
        <section className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-sm pt-10">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-wrap justify-between items-center py-8 gap-6">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{tickets.length}</div>
                  <div className="text-sm text-white/70">Ticket Types</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {tickets.reduce((total, ticket) => total + (ticket.available_quantity || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-white/70">Total Available</div>
                </div>

              </div>
              
              <div className="flex items-center gap-3 bg-black/30 rounded-2xl px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Zap className="w-4 h-4" style={{ color: pageColor }} />
                  <span>Live Ticket Sales</span>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tickets Grid/List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12"
      >
        {tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center shadow-lg bg-white/10 backdrop-blur-lg border border-white/20">
              <Ticket className="w-16 h-16 text-white/50" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">No Tickets Available</h3>
            <p className="text-white/60 max-w-md mx-auto text-lg mb-8">
              Tickets haven't been added for this event yet. Please check back later for updates.
            </p>
            <button
              onClick={() => router.push(`/myevent/${eventId}`)}
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20"
            >
              Return to Event
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tickets.map((ticket, index) => (
              <TicketCard 
                key={ticket.name}
                ticket={ticket}
                index={index}
                pageColor={pageColor}
                onBuy={handleBuyTicket}
                getTicketIcon={getTicketIcon}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {tickets.map((ticket, index) => (
              <TicketListItem 
                key={ticket.name}
                ticket={ticket}
                index={index}
                pageColor={pageColor}
                onBuy={handleBuyTicket}
                getTicketIcon={getTicketIcon}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal 
            user={user}
            selectedTicket={selectedTicket}
            event={event}
            processing={processing}
            onProcess={processPayment}
            onClose={() => {
              setShowPaymentModal(false);
            }}
            pageColor={pageColor}
            router={router}
          />
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {purchaseSuccess && (
          <SuccessModal 
            selectedTicket={selectedTicket}
            event={event}
            onClose={() => setPurchaseSuccess(false)}
            pageColor={pageColor}
            router={router}
            eventId={eventId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Ticket Card Component (Grid View)
function TicketCard({ ticket, index, pageColor, onBuy, getTicketIcon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative"
    >
      <div className="relative bg-white rounded-3xl border border-gray-200 p-8 hover:border-gray-300 transition-all duration-500 hover:transform hover:scale-105 h-full flex flex-col shadow-lg">
        
        {/* Ticket Badge */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div 
            className="text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-2xl border-2 border-white/20"
            style={{ backgroundColor: pageColor }}
          >
            {getTicketIcon(ticket.name)}
            {ticket.name}
          </div>
        </div>

        {/* Visual Preview */}
        {ticket.visuals?.[0] && (
          <div className="mb-6 -mx-8 -mt-8 rounded-t-3xl overflow-hidden">
            <div className="w-full">
              <img
                src={ticket.visuals[0].url}
                alt={ticket.name}
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        )}

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="w-6 h-6" style={{ color: pageColor }} />
            <div className="text-4xl font-bold text-gray-900">{ticket.price}</div>
          </div>
          <div className="text-gray-600 text-sm">
            {ticket.available_quantity} tickets remaining
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-center mb-6 leading-relaxed flex-1">
          {ticket.description}
        </p>

        {/* Event Date, Time, and Venue */}
        <div className="space-y-3 mb-4">
          {ticket.event_date && (
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Date: {new Date(ticket.event_date).toLocaleDateString()}</span>
            </div>
          )}
          {ticket.event_time && (
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Time: {ticket.event_time}</span>
            </div>
          )}
          {ticket.venue && (
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Venue: {ticket.venue}</span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {ticket.features?.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center gap-3 text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Sale Period */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 mt-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Starts: {new Date(ticket.sale_start).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Ends: {new Date(ticket.sale_end).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onBuy(ticket)}
          disabled={ticket.available_quantity <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
            ticket.available_quantity <= 0
              ? 'bg-gray-400 cursor-not-allowed text-gray-700'
              : 'hover:shadow-2xl text-white'
          }`}
          style={{ 
            backgroundColor: ticket.available_quantity > 0 ? pageColor : undefined 
          }}
        >
          {ticket.available_quantity <= 0 ? 'Sold Out' : 'Get Tickets'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// Ticket List Item Component
function TicketListItem({ ticket, index, pageColor, onBuy, getTicketIcon }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-3xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-500 hover:scale-[1.02] shadow-lg"
    >
      <div className="flex items-center gap-6">
        {/* Ticket Icon and Image */}
        <div className="flex-shrink-0 flex flex-col gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl"
            style={{ backgroundColor: pageColor }}
          >
            {getTicketIcon(ticket.name)}
          </div>
          {ticket.visuals?.[0] && (
            <div className="w-16 h-16 rounded-xl overflow-hidden">
              <img
                src={ticket.visuals[0].url}
                alt={ticket.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Ticket Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-xl font-bold text-gray-900">{ticket.name}</h3>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" style={{ color: pageColor }} />
              <div className="text-2xl font-bold text-gray-900">{ticket.price}</div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4 leading-relaxed">
            {ticket.description}
          </p>

          {/* Event Details */}
          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
            {ticket.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(ticket.event_date).toLocaleDateString()}</span>
              </div>
            )}
            {ticket.event_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{ticket.event_time}</span>
              </div>
            )}
            {ticket.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{ticket.venue}</span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-3">
            {ticket.features?.map((feature, featureIndex) => (
              <div key={featureIndex} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">
                <Check className="w-3 h-3 text-green-500" />
                {feature}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <span>{ticket.available_quantity} available</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Sale ends: {new Date(ticket.sale_end).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <div className="flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBuy(ticket)}
            disabled={ticket.available_quantity <= 0}
            className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
              ticket.available_quantity <= 0
                ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                : 'hover:shadow-2xl text-white'
            }`}
            style={{ 
              backgroundColor: ticket.available_quantity > 0 ? pageColor : undefined 
            }}
          >
            {ticket.available_quantity <= 0 ? 'Sold Out' : 'Buy Now'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Payment Modal Component
function PaymentModal({ user, selectedTicket, event, processing, onProcess, onClose, pageColor, router }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!user ? (
          <div className="text-center">
            <Lock className="w-16 h-16 mx-auto mb-6" style={{ color: pageColor }} />
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Authentication Required</h3>
            <p className="text-gray-700 mb-6">
              Please login to use your Gleedz wallet to purchase tickets.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-xl font-bold hover:shadow-xl transition-all duration-300 text-white"
                style={{ backgroundColor: pageColor }}
              >
                Login to Your Account
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Create New Account
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Confirm Purchase</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Ticket:</span>
                <span className="font-bold text-gray-900">{selectedTicket?.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Price:</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5" style={{ color: pageColor }} />
                  <span className="font-bold text-xl text-gray-900">{selectedTicket?.price} tokens</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Event:</span>
                <span className="font-bold text-gray-900">{event?.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 justify-center mb-6">
              <Shield className="w-4 h-4" />
              Secure payment with Gleedz Wallet
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={onProcess}
                disabled={processing}
                className="flex-1 py-3 rounded-xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-white"
                style={{ backgroundColor: pageColor }}
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Success Modal Component
function SuccessModal({ selectedTicket, event, onClose, pageColor, router, eventId }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white border border-gray-200 text-gray-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        
        <h3 className="text-3xl font-bold mb-4">Purchase Successful!</h3>
        <p className="text-gray-700 mb-6">
          Your {selectedTicket?.name} for {event?.name} has been confirmed. 
          You'll receive an email with your ticket details shortly.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/my-tickets')}
            className="w-full py-3 rounded-xl font-bold hover:shadow-xl transition-all duration-300 text-white"
            style={{ backgroundColor: pageColor }}
          >
            View My Tickets
          </button>
          <button
            onClick={() => router.push(`/myevent/${eventId}`)}
            className="w-full border border-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Back to Event
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}