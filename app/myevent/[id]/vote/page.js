"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Vote, Gift, Users, Trophy, TrendingUp, Search, X, Play, Pause, Sparkles, Crown, Award, Star } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader";

export default function EventVotePage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingData, setRankingData] = useState([]);
  const [isRankingPaused, setIsRankingPaused] = useState(false);
  const [popups, setPopups] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    if (eventId) {
      fetchEventAndCandidates();
    }
  }, [eventId]);

  const fetchEventAndCandidates = async () => {
    try {
      setLoading(true);
      
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: candidatesData, error: candidatesError } = await supabase
        .from("candidates")
        .select("*")
        .eq("event_id", eventId)
        .eq("approved", true)
        .order("points", { ascending: false });

      if (candidatesError) throw candidatesError;
      setCandidates(candidatesData || []);
      setFilteredCandidates(candidatesData || []);
      
    } catch (error) {
      console.error("Error fetching event candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    const subscription = supabase
      .channel('candidate-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCandidates(prev => {
              const updated = prev.map(candidate => 
                candidate.id === payload.new.id ? payload.new : candidate
              ).sort((a, b) => (b.points || 0) - (a.points || 0));
              
              if (payload.new.votes > payload.old.votes && payload.new.votes_toggle) {
                const voteIncrease = payload.new.votes - payload.old.votes;
                addPopup({
                  type: 'vote',
                  candidateId: payload.new.id,
                  candidateName: payload.new.full_name,
                  value: voteIncrease,
                  points: payload.new.points
                });
              }
              
              if (payload.new.gifts > payload.old.gifts && payload.new.gifts_toggle) {
                const giftIncrease = payload.new.gifts - payload.old.gifts;
                addPopup({
                  type: 'gift',
                  candidateId: payload.new.id,
                  candidateName: payload.new.full_name,
                  value: giftIncrease,
                  points: payload.new.points
                });
              }

              return updated;
            });

            setFilteredCandidates(prev => {
              return prev.map(candidate => 
                candidate.id === payload.new.id ? payload.new : candidate
              ).sort((a, b) => (b.points || 0) - (a.points || 0));
            });

            if (showRankingModal) {
              setRankingData(prev => {
                const updated = prev.map(candidate => 
                  candidate.id === payload.new.id ? payload.new : candidate
                ).sort((a, b) => (b.points || 0) - (a.points || 0));
                return updated.slice(0, 10);
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, showRankingModal]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = candidates.filter(candidate => {
      if (candidate.full_name?.toLowerCase().includes(term)) return true;
      if (candidate.contest_number?.toString().includes(term)) return true;
      if (candidate.votes?.toString() === term) return true;
      if (candidate.gifts?.toString() === term) return true;
      
      const voteNum = parseInt(term);
      if (!isNaN(voteNum) && candidate.votes >= voteNum - 5 && candidate.votes <= voteNum + 5) return true;
      
      return false;
    });

    setFilteredCandidates(filtered);
  }, [searchTerm, candidates]);

  const fetchRankingData = async () => {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('event_id', eventId)
      .eq('approved', true)
      .order('points', { ascending: false })
      .limit(10);

    setRankingData(data || []);
  };

  const openRankingModal = () => {
    setShowRankingModal(true);
    fetchRankingData();
  };

  const addPopup = (popupData) => {
    const popupId = Date.now() + Math.random();
    const newPopup = { ...popupData, id: popupId };
    
    setPopups(prev => [...prev, newPopup]);
    
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== popupId));
    }, 3000);
  };

  const isEventOwner = session?.user?.id === event?.user_id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-20">
      <EventHeader 
        event={event}
        showBackButton={true}
        backUrl={`/myevent/${eventId}`}
        title="Vote for Candidates"
        subtitle="Support your favorite contestants"
        rightContent={
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ 
                backgroundColor: viewMode === 'grid' ? pageColor : 'transparent'
              }}
            >
              <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ 
                backgroundColor: viewMode === 'list' ? pageColor : 'transparent'
              }}
            >
              <div className="w-3 h-3 flex flex-col gap-0.5">
                <div className="bg-current rounded-sm h-0.5"></div>
                <div className="bg-current rounded-sm h-0.5"></div>
                <div className="bg-current rounded-sm h-0.5"></div>
              </div>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent shadow-sm"
            style={{ focusRingColor: pageColor }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {candidates.length > 0 && (
        <section className="bg-white border-b border-gray-200 shadow-sm mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-between items-center py-4 gap-3">
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <div className="font-bold text-gray-900">{candidates.length}</div>
                  <div className="text-gray-600">Candidates</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900">
                    {candidates.reduce((total, candidate) => total + (candidate.votes || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-gray-600">Votes</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900">
                    {candidates.reduce((total, candidate) => total + (candidate.gifts || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-gray-600">Gifts</div>
                </div>
              </div>
              
              <button 
                onClick={openRankingModal}
                className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm"
                style={{ backgroundColor: pageColor }}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Live Ranking</span>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              </button>
            </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${pageColor}15`, border: `2px dashed ${pageColor}30` }}
            >
              <Users className="w-12 h-12" style={{ color: pageColor }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No Candidates Found' : 'No Candidates Yet'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm mb-6">
              {searchTerm 
                ? `No results for "${searchTerm}"`
                : 'Candidates will be announced soon!'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm"
                style={{ backgroundColor: pageColor }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredCandidates.map((candidate, index) => (
              <CandidateCard 
                key={candidate.id}
                candidate={candidate}
                eventId={eventId}
                rank={candidates.findIndex(c => c.id === candidate.id) + 1}
                pageColor={pageColor}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {filteredCandidates.map((candidate, index) => (
              <CandidateListItem 
                key={candidate.id}
                candidate={candidate}
                eventId={eventId}
                rank={candidates.findIndex(c => c.id === candidate.id) + 1}
                pageColor={pageColor}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showRankingModal && (
          <RankingModal 
            rankingData={rankingData}
            onClose={() => setShowRankingModal(false)}
            pageColor={pageColor}
            isPaused={isRankingPaused}
            onPauseToggle={() => setIsRankingPaused(!isRankingPaused)}
            showPauseButton={isEventOwner}
            popups={popups}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CandidateCard({ candidate, eventId, rank, pageColor }) {
  const [imageError, setImageError] = useState(false);
  const progressPercentage = ((candidate.votes || 0) / 10);
  
  // Check toggle settings - default to true if null/undefined
  const showVotes = candidate.votes_toggle !== false;
  const showGifts = candidate.gifts_toggle !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:scale-[1.02]"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        {candidate.photo && !imageError ? (
          <Image
            src={candidate.photo}
            alt={candidate.full_name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${pageColor}15` }}
          >
            <Users className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: pageColor }} />
          </div>
        )}
        
        <div 
          className="absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg border border-white/20 backdrop-blur-sm"
          style={{ backgroundColor: pageColor }}
        >
          {rank}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Conditionally render vote and gift counts */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center justify-between text-white text-xs">
            {/* Show votes only if votes_toggle is true */}
            {showVotes && (
              <div className="flex items-center gap-1">
                <Vote className="w-3 h-3" />
                <span className="font-semibold">{candidate.votes?.toLocaleString() || 0}</span>
              </div>
            )}
            
            {/* Show gifts only if gifts_toggle is true */}
            {showGifts && (
              <div className="flex items-center gap-1">
                <Gift className="w-3 h-3" />
                <span className="font-semibold">{candidate.gifts?.toLocaleString() || 0}</span>
              </div>
            )}
            
            {/* If both are hidden, show empty space to maintain layout */}
            {!showVotes && !showGifts && <div />}
          </div>
        </div>
        
        <Link 
          href={`/myevent/${eventId}/candidate/${candidate.id}`}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 shadow-md"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden xs:inline">View</span>
        </Link>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
            {candidate.full_name}
          </h3>
          
          {candidate.contest_number && (
            <span 
              className="text-xs font-medium px-2 py-1 rounded-full border hidden xs:block"
              style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
            >
              #{candidate.contest_number}
            </span>
          )}
        </div>

        {/* Conditionally render progress bar only if votes_toggle is true */}
        {showVotes && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ 
                  backgroundColor: pageColor,
                  width: `${Math.min(progressPercentage, 100)}%`
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CandidateListItem({ candidate, eventId, rank, pageColor }) {
  const [imageError, setImageError] = useState(false);
  const progressPercentage = ((candidate.votes || 0) / 10);
  
  // Check toggle settings - default to true if null/undefined
  const showVotes = candidate.votes_toggle !== false;
  const showGifts = candidate.gifts_toggle !== false;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:scale-[1.005]"
    >
      <Link 
        href={`/myevent/${eventId}/candidate/${candidate.id}`}
        className="flex items-center p-3"
      >
        <div className="flex-shrink-0 w-10 text-center">
          <div 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs mx-auto shadow-md"
            style={{ backgroundColor: pageColor }}
          >
            {rank}
          </div>
        </div>

        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 mx-2 rounded-xl overflow-hidden border border-gray-200">
          {candidate.photo && !imageError ? (
            <Image
              src={candidate.photo}
              alt={candidate.full_name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${pageColor}15` }}
            >
              <Users className="w-5 h-5" style={{ color: pageColor }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {candidate.full_name}
            </h3>
            {candidate.contest_number && (
              <span 
                className="text-xs font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 hidden sm:block"
                style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
              >
                #{candidate.contest_number}
              </span>
            )}
          </div>
          
          {/* Conditionally render vote and gift counts */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {showVotes && (
              <div className="flex items-center gap-1">
                <Vote className="w-3 h-3" style={{ color: pageColor }} />
                <span className="font-medium text-gray-900">{candidate.votes || 0}</span>
              </div>
            )}
            
            {showGifts && (
              <div className="flex items-center gap-1">
                <Gift className="w-3 h-3" style={{ color: pageColor }} />
                <span className="font-medium text-gray-900">{candidate.gifts || 0}</span>
              </div>
            )}
            
            {/* If both are hidden, show empty space to maintain layout */}
            {!showVotes && !showGifts && <div className="h-4" />}
          </div>
        </div>

        <div className="flex-shrink-0 w-16 sm:w-20 text-right">
          {/* Conditionally render progress bar only if votes_toggle is true */}
          {showVotes && (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 hidden sm:block">Progress</span>
                <span className="text-xs font-medium" style={{ color: pageColor }}>
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div 
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: pageColor,
                    width: `${Math.min(progressPercentage, 100)}%`
                  }}
                ></div>
              </div>
            </>
          )}
          
          <div className="flex items-center justify-end gap-1 text-xs">
            <Eye className="w-3 h-3 text-gray-600" />
            <span className="text-gray-600 hidden sm:inline">View</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RankingModal({ rankingData, onClose, pageColor, isPaused, onPauseToggle, showPauseButton, popups }) {
  const maxPoints = Math.max(...rankingData.map(c => c.points || 0), 1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile Version - Scrollable
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-sm mx-auto shadow-2xl relative max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Mobile */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl text-white" style={{ backgroundColor: pageColor }}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Live Ranking</h2>
                  <p className="text-gray-600 text-sm">Top 10 by Points</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {showPauseButton && (
                  <button
                    onClick={onPauseToggle}
                    className={`p-2 rounded-lg text-white transition-all duration-200 ${
                      isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                    }`}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
              <span className="text-xs text-gray-600">
                {isPaused ? 'Updates Paused' : 'Live Updates'}
              </span>
            </div>
          </div>

          {/* Scrollable Content - Mobile */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Top 3 - Mobile */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Top 3</h3>
              
              {/* 1st Place */}
              {rankingData[0] && (
                <div className="flex items-center gap-3 p-4 mb-3 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
                      {rankingData[0].photo ? (
                        <Image
                          src={rankingData[0].photo}
                          alt={rankingData[0].full_name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                          <Crown className="w-8 h-8 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{rankingData[0].full_name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Vote className="w-3 h-3" />
                        {rankingData[0].votes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {rankingData[0].gifts || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-600">{rankingData[0].points?.toFixed(1) || '0.0'}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              )}

              {/* 2nd & 3rd Place */}
              <div className="grid grid-cols-2 gap-3">
                {rankingData[1] && (
                  <div className="flex flex-col items-center p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-400">
                        {rankingData[1].photo ? (
                          <Image
                            src={rankingData[1].photo}
                            alt={rankingData[1].full_name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs border border-white">
                        2
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs truncate">{rankingData[1].full_name}</div>
                      <div className="text-xs text-gray-600">{rankingData[1].points?.toFixed(1) || '0.0'}</div>
                    </div>
                  </div>
                )}

                {rankingData[2] && (
                  <div className="flex flex-col items-center p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-600">
                        {rankingData[2].photo ? (
                          <Image
                            src={rankingData[2].photo}
                            alt={rankingData[2].full_name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-100">
                            <Award className="w-6 h-6 text-amber-600" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xs border border-white">
                        3
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs truncate">{rankingData[2].full_name}</div>
                      <div className="text-xs text-gray-600">{rankingData[2].points?.toFixed(1) || '0.0'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rest of Ranking - Mobile */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Contestants 4-10</h3>
              <div className="space-y-2">
                {rankingData.slice(3).map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 3) * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex-shrink-0 w-6 text-center">
                      <div 
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
                        style={{ backgroundColor: pageColor }}
                      >
                        {index + 4}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300">
                        {candidate.photo ? (
                          <Image
                            src={candidate.photo}
                            alt={candidate.full_name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {candidate.full_name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Vote className="w-3 h-3" />
                          {candidate.votes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {candidate.gifts || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {candidate.points?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Popups - Mobile */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {popups.map((popup) => (
                <motion.div
                  key={popup.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${Math.random() * 60 + 20}%`,
                    top: `${Math.random() * 60 + 20}%`,
                  }}
                >
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200 max-w-[140px]">
                    <div className="flex items-center gap-1">
                      {popup.type === 'vote' ? (
                        <Vote className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Gift className="w-3 h-3 text-yellow-500" />
                      )}
                      <span className={`font-bold text-xs ${
                        popup.type === 'vote' ? 'text-blue-500' : 'text-yellow-500'
                      }`}>
                        +{popup.value}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5 truncate">
                      {popup.candidateName}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                      {getEncouragementText(popup.points, popup.type, popup.value)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer - Mobile */}
          <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Votes</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>Gifts</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">Live Updates</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Desktop Version - Keep the original design
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '1200px',
          height: '90vh',
          maxHeight: '800px'
        }}
      >
        {/* Header - Desktop */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: pageColor }}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Live Ranking</h2>
                <p className="text-gray-600">Top 10 Candidates by Points</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {showPauseButton && (
                <button
                  onClick={onPauseToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    isPaused 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
            <span className="text-sm text-gray-600">
              {isPaused ? 'Updates Paused' : 'Live Updates Active - Real-time Ranking'}
            </span>
          </div>
        </div>

        {/* Main Content - Desktop */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Top 3 Podium - Desktop */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Top Performers</h3>
              <div className="flex items-end justify-center gap-4 h-48">
                {/* 2nd Place */}
                {rankingData[1] && (
                  <div className="flex flex-col items-center gap-3 flex-1 max-w-32">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-300 shadow-lg">
                        {rankingData[1].photo ? (
                          <Image
                            src={rankingData[1].photo}
                            alt={rankingData[1].full_name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
                        2
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {rankingData[1].full_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {rankingData[1].points?.toFixed(1) || '0.0'} pts
                      </div>
                    </div>
                    <div className="w-24 bg-gray-400 rounded-t-lg h-20 flex items-center justify-center text-white font-bold">
                      <Trophy className="w-6 h-6" />
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {rankingData[0] && (
                  <div className="flex flex-col items-center gap-3 flex-1 max-w-32">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl">
                        {rankingData[0].photo ? (
                          <Image
                            src={rankingData[0].photo}
                            alt={rankingData[0].full_name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                            <Crown className="w-10 h-10 text-yellow-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
                        1
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-sm truncate">
                        {rankingData[0].full_name}
                      </div>
                      <div className="text-xs text-yellow-600 font-semibold">
                        {rankingData[0].points?.toFixed(1) || '0.0'} pts
                      </div>
                    </div>
                    <div className="w-28 bg-yellow-500 rounded-t-lg h-28 flex items-center justify-center text-white font-bold">
                      <Crown className="w-8 h-8" />
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {rankingData[2] && (
                  <div className="flex flex-col items-center gap-3 flex-1 max-w-32">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-700 shadow-lg">
                        {rankingData[2].photo ? (
                          <Image
                            src={rankingData[2].photo}
                            alt={rankingData[2].full_name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-100">
                            <Award className="w-8 h-8 text-amber-600" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
                        3
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {rankingData[2].full_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {rankingData[2].points?.toFixed(1) || '0.0'} pts
                      </div>
                    </div>
                    <div className="w-24 bg-amber-700 rounded-t-lg h-16 flex items-center justify-center text-white font-bold">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ranking List 4-10 - Desktop */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contestants Ranking</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {rankingData.slice(3).map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 3) * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md"
                        style={{ backgroundColor: pageColor }}
                      >
                        {index + 4}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300">
                        {candidate.photo ? (
                          <Image
                            src={candidate.photo}
                            alt={candidate.full_name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {candidate.full_name}
                        </h4>
                        {candidate.contest_number && (
                          <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-full border">
                            #{candidate.contest_number}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Vote className="w-3 h-3" />
                          {candidate.votes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {candidate.gifts || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {candidate.points?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Popups - Desktop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {popups.map((popup) => (
              <motion.div
                key={popup.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute pointer-events-none"
                style={{
                  left: `${Math.random() * 70 + 15}%`,
                  top: `${Math.random() * 70 + 15}%`,
                }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-200 max-w-[160px]">
                  <div className="flex items-center gap-2">
                    {popup.type === 'vote' ? (
                      <Vote className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Gift className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={`font-bold text-sm ${
                      popup.type === 'vote' ? 'text-blue-500' : 'text-yellow-500'
                    }`}>
                      +{popup.value}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700 mt-1 truncate">
                    {popup.candidateName}
                  </div>
                  <div className="text-xs text-gray-500 font-semibold mt-1">
                    {getEncouragementText(popup.points, popup.type, popup.value)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer - Desktop */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Votes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Gifts</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">Real-time Updates</p>
              <p className="text-xs">Points = (Votes + Gifts) ÷ 10</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getEncouragementText(points, type, value) {
  const encouragements = [
    "Awesome! 🎉", "Great! 👏", "Amazing! ✨", "Incredible! 🚀",
    "Excellence! ⭐", "Fantastic! 🔥", "Superb! 💫", "Brilliant! 🌟"
  ];
  
  if (type === 'gift' && value >= 100) return "Legendary! 👑";
  if (type === 'gift' && value >= 50) return "Generous! 🎁";
  if (type === 'gift' && value >= 20) return "Amazing! 💝";
  if (points > 200) return "Unstoppable! ⚡";
  if (points > 100) return "Incredible! 🚀";
  if (points > 50) return "Excellence! ⭐";
  if (points > 20) return "Great! 🔥";
  
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}