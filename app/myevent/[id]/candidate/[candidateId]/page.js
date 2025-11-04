"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Eye, Vote, Gift, Users, Crown, Star, Heart, Flower, Smile, Zap, Award, ChevronLeft, Share2, Play, X, User, Camera, MapPin, ChevronRight, ChevronLeft as ChevronLeftIcon, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import { supabase } from "../../../../../lib/supabaseClient";
import EventHeader from "../../../../../components/EventHeader";

export default function CandidateDetailPage() {
  const params = useParams();
  const eventId = params.id;
  const candidateId = params.candidateId;
  
  const [candidate, setCandidate] = useState(null);
  const [event, setEvent] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Check auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    if (candidateId) {
      fetchCandidateData();
    }
  }, [candidateId]);

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      
      // Fetch candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", candidateId)
        .single();

      if (candidateError) throw candidateError;
      
      // Calculate points (votes + gifts) / 10 with decimal
      const votes = candidateData.votes || 0;
      const gifts = candidateData.gifts || 0;
      const points = (votes + gifts) / 10; // Keep as decimal for accuracy
      
      setCandidate({
        ...candidateData,
        points: points
      });

      // Fetch event data
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", candidateData.event_id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Parse gallery from JSONB column
      if (candidateData.gallery && Array.isArray(candidateData.gallery)) {
        setGallery(candidateData.gallery);
      }
      
    } catch (error) {
      console.error("Error fetching candidate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessAlertMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessAlert(true);
  };

  const closeSuccessAlert = () => {
    setShowSuccessAlert(false);
  };

  const openGalleryViewer = (index) => {
    setSelectedMediaIndex(index);
  };

  const closeGalleryViewer = () => {
    setSelectedMediaIndex(null);
  };

  const navigateGallery = (direction) => {
    if (selectedMediaIndex === null) return;
    
    if (direction === 'next') {
      setSelectedMediaIndex((prevIndex) => 
        prevIndex < gallery.length - 1 ? prevIndex + 1 : 0
      );
    } else {
      setSelectedMediaIndex((prevIndex) => 
        prevIndex > 0 ? prevIndex - 1 : gallery.length - 1
      );
    }
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'Candidate';
    return fullName.split(' ')[0];
  };

  const isVideoFile = (url) => {
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
  };

  // Check if current user is event owner
  const isEventOwner = session?.user?.id === event?.user_id;

  // Updated helper functions to check visibility based on toggle values
  const shouldShowVotes = () => {
    return candidate?.votes_toggle === true || isEventOwner;
  };

  const shouldShowGifts = () => {
    return candidate?.gifts_toggle === true || isEventOwner;
  };

  const shouldShowPoints = () => {
    return candidate?.points_toggle === true || isEventOwner;
  };

  const shouldShowViews = () => {
    return candidate?.views_toggle === true || isEventOwner;
  };

  // Format points to show 1 decimal place
  const formatPoints = (points) => {
    if (points === null || points === undefined) return '0';
    return Number(points).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidate...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Candidate Not Found</h1>
          <Link href={`/myevent/${eventId}/vote`} className="text-gold-600 hover:text-gold-700 font-semibold">
            Return to Candidates
          </Link>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";
  const shortAbout = candidate.about ? candidate.about.slice(0, 150) : '';
  const showReadMore = candidate.about && candidate.about.length > 150;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-17">

      {/* Success Alert Modal */}
      <AnimatePresence>
        {showSuccessAlert && (
          <SuccessAlertModal 
            message={successMessage}
            onClose={closeSuccessAlert}
          />
        )}
      </AnimatePresence>

      {/* Use EventHeader Component */}
      <EventHeader 
        event={event}
        showBackButton={true}
        backUrl={`/myevent/${eventId}/vote`}
        title={candidate.full_name}
        subtitle={candidate.contest_number ? `Contestant #${candidate.contest_number}` : "Candidate Profile"}
        rightContent={
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-600 hover:bg-white/50 transition-all duration-300">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        }
      />

      {/* Candidate Banner */}
      <section className="relative">
        <div className="aspect-[4/1] w-full overflow-hidden bg-gray-200 relative">
          {candidate.banner ? (
            <Image
              src={candidate.banner}
              alt={candidate.full_name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${pageColor}15` }}
            >
              <Users className="w-24 h-24" style={{ color: pageColor }} />
            </div>
          )}

          {/* Floating Contestant Number */}
          {candidate.contest_number && (
            <div className="absolute top-4 right-4 bg-white text-black text-sm md:text-lg font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-md border border-white/20">
              #{candidate.contest_number}
            </div>
          )}

          {/* Parent hero/banner container */}
          <div className="relative overflow-visible">
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />

            {/* Profile + Nickname Container */}
            <div className="absolute -bottom-20 md:-bottom-70 left-8 md:left-12 z-50 flex items-center gap-3 md:gap-6">
              
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-14 h-14 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white relative">
                  {candidate.photo ? (
                    <Image
                      src={candidate.photo}
                      alt={candidate.full_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${pageColor}15` }}
                    >
                      <User className="w-6 h-6 md:w-14 md:h-14" style={{ color: pageColor }} />
                    </div>
                  )}
                </div>

                {/* Online Status Badge */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-9 md:h-9 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
              </div>

              {/* Candidate Nickname - Beside Photo */}
              {candidate.nick_name && (
                <div className="backdrop-blur-x50 rounded-2xl px-4 md:px-6 py-2 md:py-3 border border-white/20 shadow-2xl w-[14ch] md:w-[18ch] overflow-hidden truncate">
                  <p className="text-white text-lg md:text-2xl font-bold text-left">
                    {candidate.nick_name}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and About */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5" style={{ color: pageColor }} />
                Candidate Stats
              </h3>
              
              <div className="space-y-4">
                {/* Total Votes - Conditionally visible */}
                {shouldShowVotes() ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <Vote className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Total Votes</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">{candidate.votes?.toLocaleString() || 0}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 opacity-50">
                    <div className="flex items-center gap-3">
                      <Vote className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Total Votes</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">Hidden</span>
                  </div>
                )}
                
                {/* Gifts Received - Conditionally visible */}
                {shouldShowGifts() ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Gifts Received</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">{candidate.gifts?.toLocaleString() || 0}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 opacity-50">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Gifts Received</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">Hidden</span>
                  </div>
                )}
                
                {/* Total Points - Conditionally visible */}
                {shouldShowPoints() ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Total Points</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">{formatPoints(candidate.points)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 opacity-50">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Total Points</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">Hidden</span>
                  </div>
                )}
                
                {/* Profile Views - Conditionally visible */}
                {shouldShowViews() ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Profile Views</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">{candidate.views?.toLocaleString() || 0}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 opacity-50">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5" style={{ color: pageColor }} />
                      <span className="text-gray-700 font-medium">Profile Views</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">Hidden</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowVoteModal(true)}
                  className="flex-1 flex items-center justify-center gap-3 py-3 md:py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm md:text-base"
                  style={{ backgroundColor: pageColor }}
                >
                  <Vote className="w-4 h-4 md:w-5 md:h-5" />
                  Vote Now
                </button>
                
                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="flex-1 flex items-center justify-center gap-3 py-3 md:py-4 font-bold rounded-xl border-2 transition-all duration-300 hover:scale-105 text-sm md:text-base"
                  style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
                >
                  <Gift className="w-4 h-4 md:w-5 md:h-5" />
                  Send Gift
                </button>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5" style={{ color: pageColor }} />
                About {getFirstName(candidate.full_name)}
              </h3>
              
              <div className="text-gray-700 leading-relaxed text-base">
                {showFullAbout ? candidate.about : shortAbout}
                {showReadMore && !showFullAbout && '...'}
              </div>
              
              {showReadMore && (
                <button 
                  onClick={() => setShowFullAbout(!showFullAbout)}
                  className="mt-4 text-sm font-semibold hover:underline transition-all duration-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                  style={{ color: pageColor }}
                >
                  {showFullAbout ? 'Read Less' : 'Read More'}
                </button>
              )}

              {/* Location */}
              {candidate.location && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" style={{ color: pageColor }} />
                    <span className="font-medium">Location:</span>
                    <span>{candidate.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-5 h-5" style={{ color: pageColor }} />
                  Photo Gallery
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {gallery.length} items
                </span>
              </div>
              
              {gallery.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gray-100">
                    <Camera className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-lg">No gallery items yet</p>
                  <p className="text-sm mt-2">Check back later for updates</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  {gallery.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500"
                      onClick={() => openGalleryViewer(index)}
                    >
                      {isVideoFile(item.url || item) ? (
                        <>
                          <video
                            src={item.url || item}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-6 h-6 text-white" fill="white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <Image
                          src={item.url || item}
                          alt={`Gallery item ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                      )}
                      
                      {/* Overlay with Caption Preview */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                        {item.caption && (
                          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-white text-xs font-medium line-clamp-2">
                              {item.caption}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Caption Icon Indicator */}
                      {item.caption && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <MessageCircle className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Instagram-style Gallery Viewer */}
      <AnimatePresence>
        {selectedMediaIndex !== null && (
          <GalleryViewer 
            gallery={gallery}
            currentIndex={selectedMediaIndex}
            onClose={closeGalleryViewer}
            onNavigate={navigateGallery}
            pageColor={pageColor}
            candidate={candidate}
          />
        )}
      </AnimatePresence>

      {/* Vote Modal */}
      <AnimatePresence>
        {showVoteModal && (
          <VoteModal 
            candidate={candidate}
            event={event}
            onClose={() => setShowVoteModal(false)}
            pageColor={pageColor}
            session={session}
            onVoteSuccess={fetchCandidateData}
            showSuccessAlert={showSuccessAlertMessage}
          />
        )}
      </AnimatePresence>

      {/* Gift Modal */}
      <AnimatePresence>
        {showGiftModal && (
          <GiftModal 
            candidate={candidate}
            event={event}
            onClose={() => setShowGiftModal(false)}
            pageColor={pageColor}
            session={session}
            onGiftSuccess={fetchCandidateData}
            showSuccessAlert={showSuccessAlertMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Success Alert Modal Component
function SuccessAlertModal({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000); // 6 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
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
        className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all duration-300"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Instagram-style Gallery Viewer Component
function GalleryViewer({ gallery, currentIndex, onClose, onNavigate, pageColor, candidate }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const containerRef = useRef(null);

  // Handle share functionality for individual photo
  const handleShare = async (item) => {
    const shareUrl = window.location.href;
    const shareText = item.caption || `Check out this image from ${candidate?.full_name || 'the gallery'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${candidate?.full_name || 'Gallery'} Post`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.log('Error copying to clipboard:', error);
        // Final fallback: show the URL
        prompt('Copy this link to share:', shareUrl);
      }
    }
  };

  // Helper function to check if file is video
  const isVideoFile = (url) => {
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
      onClick={onClose}
    >
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-white font-medium">
            {currentImageIndex + 1} / {gallery.length}
          </div>
          <div className="w-8"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Image Counter - Desktop */}
      <div className="hidden md:block absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/50 text-white text-sm font-medium">
        {currentImageIndex + 1} / {gallery.length}
      </div>

      {/* Close Button - Desktop */}
      <button
        onClick={onClose}
        className="hidden md:block absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Scrollable Container */}
      <motion.div
        ref={containerRef}
        className="h-full w-full overflow-y-auto bg-black"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-col items-center">
          {gallery.map((item, index) => (
            <motion.div
              key={index}
              className="w-full max-w-2xl mb-8 bg-black"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {/* Instagram-style Post Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center">
                    {candidate?.photo ? (
                      <Image
                        src={candidate.photo}
                        alt={candidate.full_name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm">
                    {candidate?.full_name || 'Gallery Post'}
                  </span>
                </div>
                <button className="p-1 text-gray-400 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Media Content */}
              <div className="relative w-full aspect-square bg-black flex items-center justify-center">
                {isVideoFile(item.url || item) ? (
                  <div className="w-full h-full">
                    <video
                      src={item.url || item}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <Image
                    src={item.url || item}
                    alt={`Gallery item ${index + 1}`}
                    width={800}
                    height={800}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                )}
              </div>

              {/* Action Buttons - Instagram Style */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleShare(item)}
                    className="p-1 text-white hover:scale-110 transition-transform"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
                <button className="p-1 text-white hover:scale-110 transition-transform">
                  <Bookmark className="w-6 h-6" />
                </button>
              </div>

              {/* Caption Section */}
              {item.caption && (
                <div className="px-4 pb-4">
                  <p className="text-white text-sm leading-relaxed">
                    <span className="font-semibold mr-2">{candidate?.full_name || 'Gallery Post'}</span>
                    {item.caption}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Navigation Dots - Mobile */}
      <div className="md:hidden absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {gallery.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentImageIndex(index);
              containerRef.current?.scrollTo({
                top: index * containerRef.current.clientHeight,
                behavior: 'smooth'
              });
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Custom Alert Component
function CustomAlert({ isOpen, onClose, title, message, type = "info", onConfirm, confirmText = "Proceed", cancelText = "Cancel" }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <Award className="w-12 h-12 text-yellow-500" />;
      case "success":
        return <Award className="w-12 h-12 text-green-500" />;
      case "error":
        return <X className="w-12 h-12 text-red-500" />;
      default:
        return <Award className="w-12 h-12 text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  return (
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
        className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm text-white font-semibold rounded-lg transition-all duration-300 ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper function to get user's name with role-based lookup
const getUserName = async (userId) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Unknown User';

    // 1️⃣ Get user role
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

    // 2️⃣ Get name based on role
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

// Vote Modal Component - Fixed with proper alert state management and user name lookup
function VoteModal({ candidate, event, onClose, pageColor, session, onVoteSuccess, showSuccessAlert }) {
  const [voteCount, setVoteCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' });

  const tokenPerVote = 1; // 1 vote = 1 token
  const tokenCost = voteCount * tokenPerVote;

  const handleShowCustomAlert = (title, message, type = "info") => {
    setAlertData({ title, message, type });
    setShowCustomAlert(true);
  };

  const handleCloseCustomAlert = () => {
    setShowCustomAlert(false);
  };

  const handleVote = async () => {
    if (!session) {
      handleShowCustomAlert("Authentication Required", "Please login to vote for this candidate.", "error");
      return;
    }

    setShowConfirmModal(true);
  };

  const processVote = async () => {
  setLoading(true);
  
  try {
    // 1. Check user wallet balance
    const { data: userWallet, error: walletError } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', session.user.id)
      .single();

    if (walletError) throw walletError;

    if (userWallet.balance < tokenCost) {
      handleShowCustomAlert("Insufficient Balance", `You don't have enough tokens in your wallet. You need ${tokenCost} tokens but only have ${userWallet.balance}. Please add more tokens to your wallet.`, "error");
      return;
    }

    // 2. Get current candidate data
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('votes, gifts')
      .eq('id', candidate.id)
      .single();

    if (candidateError) throw candidateError;

    // 3. Update candidate votes - THIS IS THE MAIN VOTE ACTION
    const currentVotes = candidateData.votes || 0;
    const currentGifts = candidateData.gifts || 0;
    const newVotes = currentVotes + voteCount;
    
    // Calculate new points: (votes + gifts) / 10 with decimal
    const newPoints = (newVotes + currentGifts) / 10;

    const { error: updateCandidateError } = await supabase
      .from('candidates')
      .update({ 
        votes: newVotes,
        points: newPoints
      })
      .eq('id', candidate.id);

    if (updateCandidateError) throw updateCandidateError;

    // 4. Get user's name for transaction record using the new helper function
    const userName = await getUserName(session.user.id);

    // 5. Deduct tokens from user's wallet with last_action
    const userNewBalance = userWallet.balance - tokenCost;
    const { error: updateUserWalletError } = await supabase
      .from('token_wallets')
      .update({ 
        balance: userNewBalance,
        last_action: `Vote for ${candidate.nick_name || candidate.full_name} of ${event.name}`
      })
      .eq('user_id', session.user.id);

    if (updateUserWalletError) {
      console.error('Error updating user wallet:', updateUserWalletError);
      // Don't throw error here - vote was already successful
      // Just log it and continue
    }

    // 6. Add tokens to event publisher's wallet with proper user name
    const { data: publisherWallet, error: publisherWalletError } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', event.user_id)
      .single();

    if (publisherWalletError && publisherWalletError.code !== 'PGRST116') {
      console.error('Error fetching publisher wallet:', publisherWalletError);
      // Don't throw error here - vote was already successful
    } else {
      const publisherCurrentBalance = publisherWallet?.balance || 0;
      const publisherNewBalance = publisherCurrentBalance + tokenCost;

      // Build description with proper user name
      const description = `Receive vote from ${userName} for ${candidate.nick_name || candidate.full_name}`;

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
          // Don't throw error here - vote was already successful
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
          // Don't throw error here - vote was already successful
        }
      }
    }

    // 7. Create transaction record (optional - don't fail vote if this fails)
    const transactionId = `vote_${session.user.id}_${candidate.id}_${Date.now()}`;
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: session.user.id,
        tokens_out: tokenCost,
        description: `Vote for ${candidate.nick_name || candidate.full_name} in ${event.name}`,
        transaction_id: transactionId,
        reference: `vote_${candidate.id}`,
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't throw error here - vote was already successful
    }

    // Show success alert - VOTE WAS SUCCESSFUL
    showSuccessAlert(`Your vote was successful! You voted for ${candidate.full_name} ${voteCount} time${voteCount > 1 ? 's' : ''}.`);
    onVoteSuccess(); // Refresh candidate data
    onClose();

  } catch (error) {
    console.error('Error processing vote:', error);
    // Only show error if it happened during the main vote update (step 3)
    handleShowCustomAlert("Vote Failed", "There was an error processing your vote. Please try again.", "error");
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
          className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="text-center mb-4">
              <Vote className="w-10 h-10 mx-auto mb-3" style={{ color: pageColor }} />
              <h3 className="text-xl font-bold text-gray-900 mb-1">Vote for {candidate.full_name}</h3>
              <p className="text-sm text-gray-600">Show your support with votes</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Votes
              </label>
              <input
                type="number"
                min="1"
                value={voteCount}
                onChange={(e) => setVoteCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: pageColor }}
              />
              {voteCount > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Total Cost: <span className="font-semibold" style={{ color: pageColor }}>{tokenCost} token{tokenCost > 1 ? 's' : ''}</span>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm text-white font-semibold rounded-lg shadow hover:shadow-md transition-all duration-300 disabled:opacity-50"
                style={{ backgroundColor: pageColor }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Vote ${voteCount} time${voteCount > 1 ? 's' : ''}`
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
        title="Confirm Vote"
        message={`You are about to vote for ${candidate.full_name} ${voteCount} time${voteCount > 1 ? 's' : ''}. This will cost you ${tokenCost} token${tokenCost > 1 ? 's' : ''} from your wallet. Do you want to proceed?`}
        type="warning"
        onConfirm={processVote}
        confirmText={loading ? "Processing..." : "Yes, Vote Now"}
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

// Gift Modal Component - Fixed with proper alert state management and user name lookup
function GiftModal({ candidate, event, onClose, pageColor, session, onGiftSuccess, showSuccessAlert }) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' });

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

    // 3. Update candidate gifts - THIS IS THE MAIN GIFT ACTION
    const currentVotes = candidateData.votes || 0;
    const currentGifts = candidateData.gifts || 0;
    const newGifts = currentGifts + selectedGift.tokenValue; // Store in tokens
    
    // Calculate new points: (votes + gifts) / 10 with decimal
    const newPoints = (currentVotes + newGifts) / 10;

    const { error: updateCandidateError } = await supabase
      .from('candidates')
      .update({ 
        gifts: newGifts,
        points: newPoints
      })
      .eq('id', candidate.id);

    if (updateCandidateError) throw updateCandidateError;

    // 4. Get user's name for transaction record using the new helper function
    const userName = await getUserName(session.user.id);

    // 5. Deduct tokens from user's wallet with last_action
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
      // Don't throw error here - gift was already successful
    }

    // 6. Add tokens to event publisher's wallet with proper user name
    const { data: publisherWallet, error: publisherWalletError } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', event.user_id)
      .single();

    if (publisherWalletError && publisherWalletError.code !== 'PGRST116') {
      console.error('Error fetching publisher wallet:', publisherWalletError);
      // Don't throw error here - gift was already successful
    } else {
      const publisherCurrentBalance = publisherWallet?.balance || 0;
      const publisherNewBalance = publisherCurrentBalance + selectedGift.tokenValue;

      // Build description with proper user name
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
          // Don't throw error here - gift was already successful
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
          // Don't throw error here - gift was already successful
        }
      }
    }

    // 7. Create transaction record (optional - don't fail gift if this fails)
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
      // Don't throw error here - gift was already successful
    }

    // Show success alert - GIFT WAS SUCCESSFUL
    showSuccessAlert("Your gift was sent successfully!");
    onGiftSuccess(); // Refresh candidate data
    onClose();

  } catch (error) {
    console.error('Error processing gift:', error);
    // Only show error if it happened during the main gift update (step 3)
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
          className="bg-white rounded-2xl max-w-sm w-full mx-4 my-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="text-center mb-4">
              <Gift className="w-10 h-10 mx-auto mb-3" style={{ color: pageColor }} />
              <h3 className="text-xl font-bold text-gray-900 mb-1">Send Gift to {candidate.full_name}</h3>
              <p className="text-sm text-gray-600">Show your support with a special gift</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 max-h-60 overflow-y-auto">
              {gifts.map((gift) => {
                const IconComponent = gift.icon;
                return (
                  <motion.div
                    key={gift.name}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedGift(gift)}
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-all duration-300 ${
                      selectedGift?.name === gift.name 
                        ? 'shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      borderColor: selectedGift?.name === gift.name ? pageColor : '',
                      backgroundColor: selectedGift?.name === gift.name ? `${pageColor}08` : 'white'
                    }}
                  >
                    <IconComponent 
                      className="w-6 h-6 mx-auto mb-2" 
                      style={{ color: selectedGift?.name === gift.name ? pageColor : '#6B7280' }} 
                    />
                    <div className="font-bold text-gray-900 text-xs mb-1">{gift.name}</div>
                    <div className="text-xs text-gray-600 font-semibold">{displayValue(gift)}</div>
                  </motion.div>
                );
              })}
            </div>

            {selectedGift && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{selectedGift.name} Gift</div>
                    <div className="text-gray-600">Send your support</div>
                  </div>
                  <div className="font-bold text-sm" style={{ color: pageColor }}>
                    {displayValue(selectedGift)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-xs border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleGift}
                disabled={loading || !selectedGift}
                className="flex-1 px-4 py-2 text-xs text-white font-semibold rounded-lg shadow hover:shadow-md transition-all duration-300 disabled:opacity-50"
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