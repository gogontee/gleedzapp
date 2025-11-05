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

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchCandidates();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setEvent(data);
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

  const heroSections = Array.isArray(event.hero_sections)
    ? event.hero_sections
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* 🎬 HERO SECTION */}
      {heroSections.length > 0 && (
        <section className="relative w-full h-75 md:h-110 overflow-hidden bg-black">
          <div className="absolute inset-0">
            {heroSections.map((hero, idx) => (
              <div
                key={hero.id || idx}
                className="absolute inset-0 flex flex-col items-center justify-center text-white"
                style={{
                  animation: `fadeSlide 18s infinite`,
                  animationDelay: `${idx * 6}s`,
                  opacity: 0,
                }}
              >
                {hero.type === "video" ? (
                  <video
                    src={hero.src}
                    autoPlay
                    muted
                    loop
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={hero.src}
                    alt={hero.caption}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Text positioned at bottom left */}
                <div className="absolute bottom-0 left-0 w-full text-left py-3 md:py-4 px-4 md:px-6">
                  <h2 className="text-lg md:text-4xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                    {hero.caption}
                  </h2>
                  <p className="text-sm md:text-base text-gray-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mt-1 md:mt-2">
                    {hero.tagline}
                  </p>
                </div>
              </div>
            ))}
          </div>
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

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeSlide {
          0%,
          25% {
            opacity: 1;
          }
          33%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}