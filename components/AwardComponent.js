"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Vote, Clock, Eye, EyeOff, Users, 
  TrendingUp, Crown, MapPin, Coins,
  Trophy, Gift, Sparkles, Target
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AwardComponent({ event }) {
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [user, setUser] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [voting, setVoting] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [voteCount, setVoteCount] = useState(1);
  const [activeView, setActiveView] = useState("categories");

  const pageColor = event?.page_color || "#D4AF37";

  useEffect(() => {
    if (!event?.id) return;
    
    fetchUserData();
    fetchCategories();
    
    const subscription = supabase
      .channel('award-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'award_nominees' },
        () => fetchNomineesForAllCategories()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'award_categories' },
        () => fetchCategories()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [event?.id]);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
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
      .order("created_at", { ascending: true });
    
    if (!error) {
      setCategories(data || []);
      fetchNomineesForAllCategories(data || []);
    }
  };

  const fetchNomineesForAllCategories = async (categoriesList = categories) => {
    if (!categoriesList.length) return;

    const allNominees = [];
    
    for (const category of categoriesList) {
      const { data, error } = await supabase
        .from("award_nominees")
        .select("*")
        .eq("category_id", category.id)
        .order("vote_count", { ascending: false });
      
      if (!error && data) {
        allNominees.push(...data.map(nominee => ({
          ...nominee,
          category_name: category.name,
          category: category
        })));
      }
    }
    
    setNominees(allNominees);
  };

  const getUserName = async (userId) => {
    try {
      const [fansResult, publishersResult] = await Promise.all([
        supabase.from('fans').select('full_name, name').eq('id', userId).single(),
        supabase.from('publishers').select('full_name, name').eq('id', userId).single()
      ]);

      if (fansResult.data && !fansResult.error) {
        return fansResult.data.full_name || fansResult.data.name || 'User';
      }

      if (publishersResult.data && !publishersResult.error) {
        return publishersResult.data.full_name || publishersResult.data.name || 'User';
      }

      return 'User';
    } catch (error) {
      console.error("Error fetching user name:", error);
      return 'User';
    }
  };

  const openVoteModal = (nominee, category) => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    if (!category.is_active) {
      alert("Voting is not active for this category");
      return;
    }

    setSelectedNominee({ ...nominee, category });
    setVoteCount(1);
    setShowVoteModal(true);
  };

  const handleVote = async () => {
    if (!user || !selectedNominee || !selectedNominee.category) return;

    const category = selectedNominee.category;
    const totalCost = category.is_paid ? voteCount * category.vote_amount : 0;

    if (category.is_paid && userBalance < totalCost) {
      alert(`Insufficient balance. You need ${totalCost} tokens to cast ${voteCount} votes.`);
      return;
    }

    setVoting(selectedNominee.id);

    try {
      const voterName = await getUserName(user.id);

      const newVoteCount = (selectedNominee.vote_count || 0) + voteCount;
      const { error: nomineeError } = await supabase
        .from("award_nominees")
        .update({ vote_count: newVoteCount })
        .eq("id", selectedNominee.id);

      if (nomineeError) throw nomineeError;

      if (category.is_paid && totalCost > 0) {
        const { error: walletError } = await supabase
          .from("token_wallets")
          .update({ 
            balance: userBalance - totalCost,
            last_action: `Voted for ${selectedNominee.name} in ${category.name} at ${event.name}`
          })
          .eq('user_id', user.id);

        if (walletError) throw walletError;

        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('user_id, name')
          .eq('id', event.id)
          .single();

        if (!eventError && eventData?.user_id) {
          const { data: publisherWallet, error: publisherWalletError } = await supabase
            .from('token_wallets')
            .select('balance')
            .eq('user_id', eventData.user_id)
            .single();

          if (publisherWalletError && publisherWalletError.code !== 'PGRST116') {
            console.error('Error fetching publisher wallet:', publisherWalletError);
          } else {
            const publisherCurrentBalance = publisherWallet?.balance || 0;
            const publisherNewBalance = publisherCurrentBalance + totalCost;
            const description = `Received ${voteCount} vote${voteCount > 1 ? 's' : ''} for ${selectedNominee.name} in ${category.name} from ${voterName}`;

            if (publisherWallet) {
              const { error: updatePublisherError } = await supabase
                .from('token_wallets')
                .update({ 
                  balance: publisherNewBalance,
                  last_action: description
                })
                .eq('user_id', eventData.user_id);

              if (updatePublisherError) {
                console.error('Error updating publisher wallet:', updatePublisherError);
              }
            } else {
              const { error: createPublisherError } = await supabase
                .from('token_wallets')
                .insert({ 
                  user_id: eventData.user_id,
                  balance: publisherNewBalance,
                  last_action: description
                });

              if (createPublisherError) {
                console.error('Error creating publisher wallet:', createPublisherError);
              }
            }
          }
        }

        setUserBalance(prev => prev - totalCost);
      }

      alert(`Success! ${voteCount} vote${voteCount > 1 ? 's' : ''} cast for ${selectedNominee.name}`);

      fetchNomineesForAllCategories();
      setShowVoteModal(false);
      setSelectedNominee(null);

    } catch (error) {
      console.error("Error processing vote:", error);
      alert("Error processing vote: " + error.message);
    } finally {
      setVoting(null);
    }
  };

  const CountdownTimer = ({ startDate, endDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [status, setStatus] = useState("upcoming");

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        if (now < start) {
          setStatus("upcoming");
          const difference = start - now;
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
          });
        } else if (now >= start && now <= end) {
          setStatus("active");
          const difference = end - now;
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
          });
        } else {
          setStatus("ended");
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [startDate, endDate]);

    const getStatusColor = () => {
      switch (status) {
        case "active": return "bg-emerald-500 text-white";
        case "upcoming": return "bg-blue-500 text-white";
        case "ended": return "bg-gray-400 text-white";
        default: return "bg-gray-400 text-white";
      }
    };

    const getStatusText = () => {
      switch (status) {
        case "active": return "Voting Active";
        case "upcoming": return "Voting Starts Soon";
        case "ended": return "Voting Closed";
        default: return "";
      }
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getStatusColor()} text-xs`}>
        <Clock className="w-3 h-3" />
        <div className="flex-1">
          <div className="font-medium">{getStatusText()}</div>
          {status !== "ended" && (
            <div className="font-mono text-xs">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours.toString().padStart(2, '0')}:
              {timeLeft.minutes.toString().padStart(2, '0')}:
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>
    );
  };

  const VoteModal = () => {
    if (!showVoteModal || !selectedNominee || !selectedNominee.category) return null;

    const category = selectedNominee.category;
    const totalCost = category.is_paid ? voteCount * category.vote_amount : 0;
    const maxVotes = category.vote_per_user || 1000;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVoteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-4 max-w-xs w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Cast Your Vote</h3>
              <p className="text-gray-600 text-xs mt-1">for {selectedNominee.name}</p>
            </div>

            <div className="space-y-3">
              {category.is_paid && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-amber-800 mb-1">
                    <Coins className="w-3 h-3" />
                    <span className="font-medium text-xs">Paid Voting</span>
                  </div>
                  <p className="text-amber-700 text-xs">
                    {category.vote_amount} tokens per vote
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Number of Votes
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setVoteCount(prev => Math.max(1, prev - 1));
                    }}
                    className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxVotes}
                    value={voteCount}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(maxVotes, parseInt(e.target.value) || 1));
                      setVoteCount(value);
                    }}
                    className="flex-1 text-center border border-gray-300 rounded py-1.5 px-2 font-semibold text-sm"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setVoteCount(prev => Math.min(maxVotes, prev + 1));
                    }}
                    className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-xs"
                  >
                    +
                  </button>
                </div>
                {category.vote_per_user && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Max {category.vote_per_user} votes
                  </p>
                )}
              </div>

              {category.is_paid && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold text-gray-900">
                      {totalCost} tokens
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">Your Balance:</span>
                    <span className="font-semibold" style={{ color: pageColor }}>
                      {userBalance} tokens
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowVoteModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVote}
                  disabled={voting === selectedNominee.id || (category.is_paid && userBalance < totalCost)}
                  className="flex-1 py-2 text-white rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-xs"
                  style={{ backgroundColor: pageColor }}
                >
                  {voting === selectedNominee.id ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Voting...
                    </>
                  ) : (
                    <>
                      <Vote className="w-3 h-3" />
                      Vote Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const NomineeCard = ({ nominee, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="relative">
          {nominee.image_url ? (
            <img 
              src={nominee.image_url} 
              alt={nominee.name}
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white opacity-80" />
            </div>
          )}
          
          {nominee.category?.is_public_vote && index < 3 && (
            <div className="absolute top-2 left-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                'bg-orange-500'
              }`}>
                <Crown className="w-2 h-2" />
              </div>
            </div>
          )}

          {nominee.category?.is_public_vote && (
            <div className="absolute top-2 right-2">
              <div className="bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs font-medium flex items-center gap-0.5">
                <TrendingUp className="w-2 h-2" />
                {nominee.vote_count || 0}
              </div>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">{nominee.name}</h3>
          
          {nominee.location && (
            <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
              <MapPin className="w-2 h-2" />
              <span>{nominee.location}</span>
            </div>
          )}

          <div className="text-gray-700 text-xs mb-2">
            {isExpanded ? (
              <p>{nominee.description}</p>
            ) : (
              <p className="line-clamp-2">
                {nominee.description?.substring(0, 70)}
                {nominee.description?.length > 70 && "..."}
              </p>
            )}
            {nominee.description?.length > 70 && (
              <button 
                className="text-blue-600 text-xs font-medium mt-0.5"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          <button
            onClick={() => openVoteModal(nominee, nominee.category)}
            disabled={!nominee.category?.is_active || !user}
            className="w-full py-1.5 text-white rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            style={{ 
              backgroundColor: nominee.category?.is_active && user ? pageColor : '#9CA3AF'
            }}
          >
            {!user ? (
              "Login to Vote"
            ) : !nominee.category?.is_active ? (
              "Voting Closed"
            ) : (
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-2 h-2" />
                Cast Vote
              </div>
            )}
          </button>
        </div>
      </motion.div>
    );
  };

  const CategorySection = ({ category }) => {
    const categoryNominees = nominees.filter(n => n.category_id === category.id);

    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h2>
              {category.description && (
                <p className="text-gray-600 text-sm">{category.description}</p>
              )}
            </div>
            
            {category.vote_begin && category.vote_end && (
              <div className="flex-shrink-0">
                <CountdownTimer 
                  startDate={category.vote_begin} 
                  endDate={category.vote_end} 
                />
              </div>
            )}
          </div>
        </div>

        {categoryNominees.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryNominees.map((nominee, index) => (
              <NomineeCard 
                key={nominee.id} 
                nominee={nominee} 
                index={index} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No nominees yet</p>
          </div>
        )}
      </motion.section>
    );
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Event Not Found</h3>
          <p className="text-gray-600 text-xs">Please select a valid event</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3">
        {/* Header */}
        <div className="text-center mb-6">
          {event.award_title && (
            <>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">
                {event.award_title}
              </h1>
              {event.award_description && (
                <p className="text-gray-600 text-xs md:text-sm">
                  {event.award_description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Navigation & Balance - Desktop only, only for authenticated users */}
        {user && (
          <div className="hidden sm:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-6">
            <div className="flex bg-white rounded shadow-sm p-0.5">
              <button
                onClick={() => setActiveView("categories")}
                className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                  activeView === "categories" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveView("analytics")}
                className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                  activeView === "analytics" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Rankings
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white rounded shadow-sm px-3 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600 text-xs">Balance:</span>
              <span className="flex items-center gap-1 font-semibold text-xs" style={{ color: pageColor }}>
                <Coins className="w-3 h-3" />
                {userBalance}
              </span>
            </div>
          </div>
        )}

        {/* Categories View */}
        {activeView === "categories" && (
          <div className="space-y-6">
            {categories.map((category, index) => (
              <CategorySection 
                key={category.id} 
                category={category} 
              />
            ))}
          </div>
        )}

        {/* Analytics View */}
        {activeView === "analytics" && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Live Rankings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const categoryNominees = nominees
                  .filter(n => n.category_id === category.id)
                  .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                  .slice(0, 3);

                return (
                  <div key={category.id} className="bg-gray-50 rounded-lg p-3">
                    <h3 className="font-semibold text-gray-900 text-xs mb-2">
                      {category.name}
                    </h3>
                    <div className="space-y-2">
                      {categoryNominees.map((nominee, index) => (
                        <div key={nominee.id} className="flex items-center gap-2 p-2 bg-white rounded">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs truncate">{nominee.name}</p>
                            {category.is_public_vote && (
                              <p className="text-gray-600 text-xs">
                                {nominee.vote_count || 0} votes
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {categoryNominees.length === 0 && (
                      <p className="text-gray-500 text-xs text-center py-2">No nominees yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeView === "categories" && categories.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Categories Yet</h3>
            <p className="text-gray-600 text-xs">Award categories coming soon</p>
          </div>
        )}
      </div>

      {/* Vote Modal */}
      <VoteModal />
    </div>
  );
}