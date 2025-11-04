"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Vote, Clock, Eye, EyeOff, Users, 
  TrendingUp, Crown, Star, MapPin, Calendar, Coins
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AwardComponent({ event }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [user, setUser] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [voting, setVoting] = useState(null);
  const [activeView, setActiveView] = useState("categories"); // categories, nominees, analytics

  const pageColor = event?.page_color || "#D4AF37";

  useEffect(() => {
    if (!event?.id) return;
    
    fetchUserData();
    fetchCategories();
    
    // Real-time subscription for vote updates
    const subscription = supabase
      .channel('vote-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'award_votes' },
        () => selectedCategory && fetchNominees(selectedCategory.id)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'award_categories' },
        () => fetchCategories()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [event?.id, selectedCategory]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // Fetch user balance from token_wallets table
      const { data: wallet } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      setUserBalance(wallet?.balance || 0);
    }
  };

  const fetchCategories = async () => {
    if (!event?.id) return;
    
    const { data, error } = await supabase
      .from("award_categories")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });
    
    if (!error) setCategories(data || []);
  };

  const fetchNominees = async (categoryId) => {
    const { data, error } = await supabase
      .from("award_nominees")
      .select("*")
      .eq("category_id", categoryId)
      .order("vote_count", { ascending: false });
    
    if (!error) setNominees(data || []);
  };

  const getUserName = async (userId) => {
    // Try to get name from fans table first
    const { data: fanData } = await supabase
      .from('fans')
      .select('full_name')
      .eq('user_id', userId)
      .single();

    if (fanData?.full_name) return fanData.full_name;

    // If not found in fans, try publishers table
    const { data: publisherData } = await supabase
      .from('publishers')
      .select('full_name')
      .eq('user_id', userId)
      .single();

    if (publisherData?.full_name) return publisherData.full_name;

    // If still not found, return a default name
    return 'User';
  };

  const handleVote = async (nominee) => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    const category = categories.find(cat => cat.id === nominee.category_id);
    
    if (!category) {
      alert("Category not found");
      return;
    }

    if (!category.is_active) {
      alert("Voting is not active for this category");
      return;
    }

    // Check if user already voted in this category
    const { data: existingVote } = await supabase
      .from("award_votes")
      .select("id")
      .eq("category_id", nominee.category_id)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      alert("You have already voted in this category");
      return;
    }

    if (category.is_paid) {
      if (userBalance < category.vote_amount) {
        alert(`Insufficient balance. You need ${category.vote_amount} tokens to vote.`);
        return;
      }

      const confirmVote = window.confirm(
        `This vote will cost ${category.vote_amount} tokens. Do you want to proceed?`
      );

      if (!confirmVote) return;

      setVoting(nominee.id);

      try {
        // Get voter's name
        const voterName = await getUserName(user.id);

        // Start transaction - insert vote first
        const { error: voteError } = await supabase
          .from("award_votes")
          .insert([{
            category_id: nominee.category_id,
            nominee_id: nominee.id,
            user_id: user.id,
            amount: category.vote_amount
          }]);

        if (voteError) throw voteError;

        // Update nominee vote count
        const { error: nomineeError } = await supabase
          .from("award_nominees")
          .update({ vote_count: (nominee.vote_count || 0) + 1 })
          .eq("id", nominee.id);

        if (nomineeError) throw nomineeError;

        // Deduct from user's wallet and update last_action
        const { error: walletError } = await supabase
          .from("token_wallets")
          .update({ 
            balance: userBalance - category.vote_amount,
            last_action: `Vote for ${nominee.name} in ${category.name} at ${event.name}`
          })
          .eq("user_id", user.id);

        if (walletError) throw walletError;

        // Get event owner's user_id to credit their wallet
        const { data: eventData } = await supabase
          .from('events')
          .select('user_id')
          .eq('id', event.id)
          .single();

        if (eventData?.user_id) {
          // Get current balance of event owner
          const { data: ownerWallet } = await supabase
            .from('token_wallets')
            .select('balance')
            .eq('user_id', eventData.user_id)
            .single();

          if (ownerWallet) {
            // Credit event owner's wallet and update last_action
            const { error: ownerWalletError } = await supabase
              .from("token_wallets")
              .update({ 
                balance: ownerWallet.balance + category.vote_amount,
                last_action: `Vote for ${category.name} ${nominee.name} by ${voterName}`
              })
              .eq("user_id", eventData.user_id);

            if (ownerWalletError) throw ownerWalletError;
          }
        }

        // Record transaction for voter
        await supabase
          .from("transactions")
          .insert([{
            user_id: user.id,
            type: 'vote_payment',
            amount: -category.vote_amount,
            description: `Vote for ${nominee.name} in ${category.name} at ${event.name}`,
            status: 'completed'
          }]);

        // Record transaction for event owner
        if (eventData?.user_id) {
          await supabase
            .from("transactions")
            .insert([{
              user_id: eventData.user_id,
              type: 'vote_receipt',
              amount: category.vote_amount,
              description: `Vote for ${category.name} ${nominee.name} by ${voterName}`,
              status: 'completed'
            }]);
        }

        setUserBalance(prev => prev - category.vote_amount);
        alert("Vote cast successfully!");

        // Refresh nominees to show updated vote count
        fetchNominees(nominee.category_id);

      } catch (error) {
        console.error("Error processing vote:", error);
        alert("Error processing vote: " + error.message);
      } finally {
        setVoting(null);
      }
    } else {
      // Free vote
      setVoting(nominee.id);

      try {
        const { error: voteError } = await supabase
          .from("award_votes")
          .insert([{
            category_id: nominee.category_id,
            nominee_id: nominee.id,
            user_id: user.id,
            amount: 0
          }]);

        if (voteError) throw voteError;

        const { error: nomineeError } = await supabase
          .from("award_nominees")
          .update({ vote_count: (nominee.vote_count || 0) + 1 })
          .eq("id", nominee.id);

        if (nomineeError) throw nomineeError;

        alert("Vote cast successfully!");
        
        // Refresh nominees to show updated vote count
        fetchNominees(nominee.category_id);
        
      } catch (error) {
        console.error("Error processing vote:", error);
        alert("Error processing vote: " + error.message);
      } finally {
        setVoting(null);
      }
    }
  };

  const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const difference = target - now;

        if (difference <= 0) {
          clearInterval(timer);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          fetchCategories();
          return;
        }

        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [targetDate]);

    if (!targetDate) return null;

    return (
      <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-lg">
        <Clock className="w-4 h-4" />
        <span className="font-mono text-sm">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {timeLeft.hours.toString().padStart(2, '0')}:
          {timeLeft.minutes.toString().padStart(2, '0')}:
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
      </div>
    );
  };

  // Get all nominees for analytics view
  const getAllNomineesForAnalytics = async () => {
    if (!categories.length) return [];
    
    const allNominees = [];
    for (const category of categories) {
      const { data } = await supabase
        .from("award_nominees")
        .select("*")
        .eq("category_id", category.id)
        .order("vote_count", { ascending: false });
      
      if (data) {
        allNominees.push(...data.map(nominee => ({ ...nominee, category_name: category.name })));
      }
    }
    return allNominees;
  };

  // Analytics view effect
  useEffect(() => {
    if (activeView === "analytics") {
      getAllNomineesForAnalytics().then(setNominees);
    }
  }, [activeView, categories]);

  if (!event) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Event Not Found
        </h3>
        <p className="text-gray-600">
          Please select a valid event to view awards.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 mb-4"
        >
          <Award className="w-8 h-8" style={{ color: pageColor }} />
          <h1 className="text-4xl font-bold text-gray-900">Awards</h1>
        </motion.div>
        <p className="text-gray-600 text-lg">Celebrate excellence and cast your votes</p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveView("categories");
              setSelectedCategory(null);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "categories" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveView("analytics")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "analytics" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Live Rankings
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">Your Balance:</span>
            <span className="flex items-center gap-1 font-semibold" style={{ color: pageColor }}>
              <Coins className="w-4 h-4" />
              {userBalance.toLocaleString()} tokens
            </span>
          </div>
        )}

        {selectedCategory && (
          <button
            onClick={() => {
              setSelectedCategory(null);
              setNominees([]);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            ← Back to Categories
          </button>
        )}
      </div>

      {/* Categories View */}
      {activeView === "categories" && !selectedCategory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
            >
              {/* Category Banner */}
              {category.category_image && (
                <div className="h-32 bg-gray-200 overflow-hidden">
                  <img 
                    src={category.category_image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : new Date(category.vote_begin) > new Date()
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.is_active 
                      ? 'Active' 
                      : new Date(category.vote_begin) > new Date()
                        ? 'Upcoming'
                        : 'Ended'
                    }
                  </span>
                </div>
                
                {category.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      {category.is_paid ? (
                        <Coins className="w-4 h-4 text-green-600" />
                      ) : (
                        <Vote className="w-4 h-4 text-blue-600" />
                      )}
                      <span className={category.is_paid ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
                        {category.is_paid ? `${category.vote_amount} tokens per vote` : 'Free Voting'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {category.is_public_vote ? <Eye className="w-4 h-4 text-gray-500" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>

                  {category.is_active && category.vote_end && (
                    <CountdownTimer targetDate={category.vote_end} />
                  )}

                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      fetchNominees(category.id);
                    }}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Users size={16} />
                    View Nominees
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Nominees View */}
      {activeView === "categories" && selectedCategory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Category Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h2>
                {selectedCategory.description && (
                  <p className="text-gray-600 mt-1">{selectedCategory.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategory.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : new Date(selectedCategory.vote_begin) > new Date()
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCategory.is_active 
                      ? 'Voting Active' 
                      : new Date(selectedCategory.vote_begin) > new Date()
                        ? 'Voting Starts Soon'
                        : 'Voting Ended'
                    }
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1">
                    {selectedCategory.is_paid ? (
                      <Coins className="w-4 h-4" />
                    ) : (
                      <Vote className="w-4 h-4" />
                    )}
                    {selectedCategory.is_paid ? `Paid - ${selectedCategory.vote_amount} tokens per vote` : 'Free Voting'}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1">
                    {selectedCategory.is_public_vote ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {selectedCategory.is_public_vote ? 'Public Votes' : 'Private Votes'}
                  </span>
                </div>
              </div>

              {selectedCategory.is_active && selectedCategory.vote_end && (
                <CountdownTimer targetDate={selectedCategory.vote_end} />
              )}
            </div>
          </div>

          {/* Nominees Grid - 5 columns on desktop, 2 on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {nominees.map((nominee, index) => (
              <motion.div
                key={nominee.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative">
                  {nominee.image_url ? (
                    <img 
                      src={nominee.image_url} 
                      alt={nominee.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Award className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Ranking Badge */}
                  {selectedCategory.is_public_vote && index < 3 && (
                    <div className="absolute top-2 left-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-500' :
                        'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  )}

                  {/* Vote Count */}
                  {selectedCategory.is_public_vote && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {nominee.vote_count || 0}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{nominee.name}</h3>
                  
                  {nominee.location && (
                    <div className="flex items-center gap-1 text-gray-600 text-xs mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{nominee.location}</span>
                    </div>
                  )}

                  {nominee.description && (
                    <p className="text-gray-600 text-xs line-clamp-2 mb-3">
                      {nominee.description}
                    </p>
                  )}

                  <button
                    onClick={() => handleVote(nominee)}
                    disabled={!selectedCategory.is_active || voting === nominee.id || !user}
                    className="w-full py-2 text-white rounded-lg font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                    style={{ 
                      backgroundColor: selectedCategory.is_active && user ? pageColor : '#9CA3AF'
                    }}
                  >
                    {voting === nominee.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Voting...
                      </div>
                    ) : !user ? (
                      "Login to Vote"
                    ) : !selectedCategory.is_active ? (
                      "Closed"
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <Vote className="w-3 h-3" />
                        {selectedCategory.is_paid ? `Vote (${selectedCategory.vote_amount})` : 'Vote Free'}
                      </div>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {nominees.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Nominees Yet
              </h3>
              <p className="text-gray-600">
                Check back later for nominees in this category.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Analytics/Live Rankings View */}
      {activeView === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Rankings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categories.map(category => {
                // Filter nominees by category and sort by vote count
                const categoryNominees = nominees
                  .filter(n => n.category_id === category.id)
                  .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                  .slice(0, 5);

                return (
                  <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{category.name}</h3>
                    <div className="space-y-2">
                      {categoryNominees.map((nominee, index) => (
                        <div key={nominee.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-500' :
                            index === 2 ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{nominee.name}</p>
                            {category.is_public_vote && (
                              <p className="text-sm text-gray-600">{nominee.vote_count || 0} votes</p>
                            )}
                          </div>
                          {index === 0 && categoryNominees.length > 0 && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    {categoryNominees.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">No nominees yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeView === "categories" && !selectedCategory && categories.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Award Categories Yet
          </h3>
          <p className="text-gray-600">
            Award categories will be available soon.
          </p>
        </div>
      )}
    </div>
  );
}