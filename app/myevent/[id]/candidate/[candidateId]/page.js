"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Share2, MapPin } from "lucide-react";
import { supabase } from "../../../../../lib/supabaseClient";
import EventHeader from "../../../../../components/EventHeader";
import CandidateStats from "../../../../../components/CandidateStats";
import CandidateGallery from "../../../../../components/CandidateGallery";
import VoteModal from "../../../../../components/VoteModal";
import GiftModal from "../../../../../components/GiftModal";
import SuccessAlertModal from "../../../../../components/SuccessAlertModal";
import GalleryViewer from "../../../../../components/GalleryViewer";

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
      const points = (votes + gifts) / 10;
      
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

  const getFirstName = (fullName) => {
    if (!fullName) return 'Candidate';
    return fullName.split(' ')[0];
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
        <div className="aspect-[5/1.5] w-full overflow-hidden bg-gray-200 relative">
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
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and About */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <CandidateStats 
              candidate={candidate}
              event={event}
              session={session}
              pageColor={pageColor}
              onVoteClick={() => setShowVoteModal(true)}
              onGiftClick={() => setShowGiftModal(true)}
            />

            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: pageColor }} />
                About {getFirstName(candidate.full_name)}
              </h3>
              
              <div className="text-sm text-gray-700 leading-relaxed">
                {showFullAbout ? candidate.about : shortAbout}
                {showReadMore && !showFullAbout && '...'}
              </div>
              
              {showReadMore && (
                <button 
                  onClick={() => setShowFullAbout(!showFullAbout)}
                  className="mt-3 text-xs font-semibold hover:underline transition-all duration-300 px-3 py-1 rounded-lg hover:bg-gray-50"
                  style={{ color: pageColor }}
                >
                  {showFullAbout ? 'Read Less' : 'Read More'}
                </button>
              )}

              {/* Location */}
              {candidate.location && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-3 h-3" style={{ color: pageColor }} />
                    <span className="font-medium">Location:</span>
                    <span>{candidate.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Gallery */}
          <div className="lg:col-span-2">
            <CandidateGallery 
              gallery={gallery}
              pageColor={pageColor}
              onMediaClick={openGalleryViewer}
            />
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