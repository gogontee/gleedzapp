"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient"; // Adjust the import path as needed

export default function PosterShowcaseMobile() {
  const [posters, setPosters] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch posters from gleedz_hero.hero column
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("gleedz_hero")
          .select("hero")
          .single();

        if (error) {
          console.error("Error fetching posters:", error);
          setError("Failed to load posters");
          // Fallback to default posters
          setPosters(getFallbackPosters());
          return;
        }

        if (data && data.hero && Array.isArray(data.hero)) {
          // Transform the data to match our component structure
          const transformedPosters = data.hero.map((poster, index) => ({
            name: `poster-${index}`,
            url: poster.src,
            href: poster.cta?.href || "/events", // Default to /events if no href
            type: poster.type || "image", // Default to image if no type
          }));
          setPosters(transformedPosters);
        } else {
          // If no posters found, use fallback
          setPosters(getFallbackPosters());
        }
      } catch (err) {
        console.error("Error fetching posters:", err);
        setError("Failed to load posters");
        setPosters(getFallbackPosters());
      } finally {
        setLoading(false);
      }
    };

    fetchPosters();
  }, []);

  // Fallback posters if database fetch fails
  const getFallbackPosters = () => [
    {
      name: "poster2",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/v2.mp4",
      href: "/events",
      type: "video",
    },
    {
      name: "poster3",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/1024.mp4",
      href: "/events",
      type: "video",
    },
    {
      name: "poster4",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/1.jpg",
      href: "/events",
      type: "image",
    },
  ];

  // Handle poster cycling logic
  useEffect(() => {
    if (posters.length <= 1) return; // Don't cycle if only one or no posters

    const currentPoster = posters[current];

    // Clear any existing timer
    clearTimeout(timerRef.current);

    // If it's an image → auto switch after 6s
    if (currentPoster && currentPoster.type === "image") {
      timerRef.current = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % posters.length);
      }, 6000);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [current, posters]);

  // Handle when a video ends
  const handleVideoEnd = () => {
    if (posters.length > 1) {
      setCurrent((prev) => (prev + 1) % posters.length);
    }
  };

  // Get cache-busted URL for videos
  const getCacheBustedUrl = (url) => {
    if (!url) return url;
    if (url.includes('.mp4')) {
      return `${url}?v=1`; // Fixed version for better caching
    }
    return url;
  };

  // Handle video error
  const handleVideoError = () => {
    console.error('Video failed to load:', posters[current]?.url);
    // Skip to next poster if current one fails
    if (posters.length > 1) {
      setCurrent((prev) => (prev + 1) % posters.length);
    }
  };

  if (loading) {
    return (
      <div className="block md:hidden relative w-full aspect-[3/1] overflow-hidden shadow-md border-b border-gold-400 bg-black rounded-b-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && posters.length === 0) {
    return (
      <div className="block md:hidden relative w-full aspect-[3/1] overflow-hidden shadow-md border-b border-gold-400 bg-black rounded-b-2xl">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-sm px-4 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (posters.length === 0) {
    return (
      <div className="block md:hidden relative w-full aspect-[3/1] overflow-hidden shadow-md border-b border-gold-400 bg-black rounded-b-2xl">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-sm">No posters available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="block md:hidden relative w-full aspect-[3/1] overflow-hidden shadow-md border-b border-gold-400 bg-black rounded-b-2xl">
      <AnimatePresence mode="wait">
        {posters.map(
          (poster, index) =>
            index === current && (
              <motion.div
                key={`${poster.name}-${index}`}
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <Link href={poster.href} className="block w-full h-full">
                  {poster.type === "video" ? (
                    <video
                      key={poster.url}
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                      onEnded={handleVideoEnd}
                      onError={handleVideoError}
                    >
                      <source src={getCacheBustedUrl(poster.url)} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={poster.url}
                        alt={poster.name}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="100vw"
                        unoptimized
                      />
                    </div>
                  )}
                </Link>
              </motion.div>
            )
        )}
      </AnimatePresence>

      {/* Navigation dots for manual control */}
      {posters.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
          {posters.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === current
                  ? 'bg-yellow-500 scale-125'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to poster ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Show current poster number (optional) */}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
        {current + 1} / {posters.length}
      </div>
    </div>
  );
}