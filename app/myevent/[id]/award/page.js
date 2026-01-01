"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import AwardComponent from "../../../../components/AwardComponent";
import EventHeader from "../../../../components/EventHeader";

export default function AwardPage() {
  const params = useParams();
  const eventId = params.id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [heroSections, setHeroSections] = useState([]);
  const [mobileHeroSections, setMobileHeroSections] = useState([]);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchCandidates();
    }
  }, [eventId]);

  // Auto-advance hero slides
  useEffect(() => {
    if (heroSections.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => 
        (prevIndex + 1) % heroSections.length
      );
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [heroSections]);

  const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      
      setEvent(data);
      
      // Set desktop hero sections
      if (data.hero_sections && Array.isArray(data.hero_sections)) {
        setHeroSections(data.hero_sections);
      }
      
      // Set mobile hero sections
      if (data.mobile_hero && Array.isArray(data.mobile_hero)) {
        setMobileHeroSections(data.mobile_hero);
      }
      
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCandidates(data);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  // Get current hero sections based on device
  const getCurrentHeroSections = () => {
    if (isMobile && mobileHeroSections.length > 0) {
      return mobileHeroSections;
    }
    return heroSections;
  };

  const currentHeroData = getCurrentHeroSections();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">
            The event you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 🎬 HERO SECTION */}
      {currentHeroData.length > 0 && (
        <section className="relative w-full h-75 md:h-110 overflow-hidden bg-black">
          <div className="absolute inset-0">
            {currentHeroData.map((hero, idx) => (
              <div
                key={hero.id || idx}
                className="absolute inset-0 flex flex-col items-center justify-center text-white"
                style={{
                  transition: 'opacity 1s ease-in-out',
                  opacity: idx === currentHeroIndex ? 1 : 0,
                  zIndex: idx === currentHeroIndex ? 10 : 0,
                }}
              >
                {hero.type === "video" ? (
                  <video
                    src={hero.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={hero.src}
                    alt={hero.caption}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Text positioned at bottom left */}
                <div className="absolute bottom-0 left-0 w-full text-left py-3 md:py-4 px-4 md:px-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <h2 className="text-lg md:text-4xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                    {hero.caption}
                  </h2>
                  {hero.tagline && (
                    <p className="text-sm md:text-base text-gray-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mt-1 md:mt-2">
                      {hero.tagline}
                    </p>
                  )}
                </div>

                {/* Navigation dots */}
                {currentHeroData.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                    {currentHeroData.map((_, dotIndex) => (
                      <button
                        key={dotIndex}
                        onClick={() => setCurrentHeroIndex(dotIndex)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          dotIndex === currentHeroIndex 
                            ? 'bg-white w-4' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${dotIndex + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                {hero.cta && hero.cta.href && hero.cta.label && (
                  <div className="absolute top-4 right-4 z-20">
                    <a
                      href={hero.cta.href}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-300 text-sm font-medium border border-white/30 hover:border-white/50"
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {hero.cta.label}
                    </a>
                  </div>
                )}

                {/* Device indicator (for debugging - remove in production) */}
                <div className="absolute top-4 left-4 z-20 px-2 py-1 rounded bg-black/50 text-white text-xs backdrop-blur-sm">
                  {isMobile ? 'Mobile' : 'Desktop'} Hero
                </div>
              </div>
            ))}
          </div>

          {/* Previous/Next buttons for larger screens */}
          {currentHeroData.length > 1 && (
            <>
              <button
                onClick={() => setCurrentHeroIndex((prev) => 
                  prev === 0 ? currentHeroData.length - 1 : prev - 1
                )}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors hidden md:block"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentHeroIndex((prev) => 
                  (prev + 1) % currentHeroData.length
                )}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors hidden md:block"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </section>
      )}

      {/* 🏆 Event Header */}
      <div className="mt-2">
        <EventHeader event={event} />
      </div>

      {/* Main Content */}
      <div className="pt-4 pb-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <AwardComponent
            event={event}
            candidates={candidates}
            onCandidatesUpdate={fetchCandidates}
          />
        </div>
      </div>

      {/* CSS for smooth transitions */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .hero-slide {
          animation: fadeIn 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}