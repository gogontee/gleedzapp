"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient"; // Adjust the import path as needed

export default function PosterShowcase() {
  const [posters, setPosters] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posters from gleedz_hero.desktop_posters
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        setLoading(true);
        console.log("Fetching posters from Supabase...");
        
        const { data, error } = await supabase
          .from("gleedz_hero")
          .select("desktop_posters")
          .single();

        console.log("Supabase response:", { data, error });

        if (error) {
          console.error("Error fetching posters:", error);
          setError("Failed to load posters");
          // Fallback to empty array if error
          setPosters([]);
          return;
        }

        if (data && data.desktop_posters) {
          console.log("Raw desktop_posters data:", data.desktop_posters);
          
          // Check if desktop_posters is a string that needs parsing
          let postersArray = data.desktop_posters;
          
          if (typeof postersArray === 'string') {
            try {
              postersArray = JSON.parse(postersArray);
            } catch (parseError) {
              console.error("Error parsing JSON:", parseError);
              setError("Invalid posters data format");
              setPosters(getFallbackPosters());
              return;
            }
          }
          
          // Ensure it's an array
          if (Array.isArray(postersArray) && postersArray.length > 0) {
            console.log("Processed posters array:", postersArray);
            
            // Transform the data to match our component structure
            const transformedPosters = postersArray.map((poster, index) => {
              console.log(`Poster ${index}:`, poster);
              
              // Check for different possible structures
              const posterData = {
                name: `poster-${index}`,
                url: poster.src || poster.url || poster.image || "",
                href: poster.button?.href || poster.href || "/events",
                type: poster.type || "image",
              };
              
              console.log(`Transformed poster ${index}:`, posterData);
              return posterData;
            }).filter(poster => poster.url); // Filter out posters without URLs
            
            console.log("Final transformed posters:", transformedPosters);
            
            if (transformedPosters.length > 0) {
              setPosters(transformedPosters);
            } else {
              console.log("No valid posters found, using fallback");
              setPosters(getFallbackPosters());
            }
          } else {
            console.log("Invalid posters data format or empty array, using fallback");
            setPosters(getFallbackPosters());
          }
        } else {
          console.log("No data found, using fallback");
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
      name: "poster1",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster.mp4",
      href: "/events",
      type: "video",
    },
    {
      name: "poster2",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/missuniverse.jpg",
      href: "/events",
      type: "image",
    },
  ];

  // Cycle posters every 6s
  useEffect(() => {
    if (posters.length <= 1) return; // Don't cycle if only one or no posters

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % posters.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [posters.length]);

  // Handle video end to auto-advance
  const handleVideoEnd = () => {
    if (posters.length > 1) {
      setCurrent((prev) => (prev + 1) % posters.length);
    }
  };

  // Get cache-busted URL for videos
  const getCacheBustedUrl = (url) => {
    if (!url) return url;
    if (url.includes('.mp4')) {
      return `${url}?t=${Date.now()}`;
    }
    return url;
  };

  // Add debug logging for rendering
  console.log("Rendering with posters:", posters);
  console.log("Current poster index:", current);
  console.log("Loading:", loading);
  console.log("Error:", error);

  if (loading) {
    return (
      <div className="hidden md:block w-full h-full relative bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && posters.length === 0) {
    return (
      <div className="hidden md:block w-full h-full relative bg-black">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (posters.length === 0) {
    return (
      <div className="hidden md:block w-full h-full relative bg-black">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-sm">No posters available</p>
        </div>
      </div>
    );
  }

  const currentPoster = posters[current];
  console.log("Current poster to render:", currentPoster);

  return (
    <div className="hidden md:block w-full h-full relative bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPoster.name}-${current}`}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <Link href={currentPoster.href} className="block w-full h-full">
            {currentPoster.type === "video" ? (
              <video
                key={currentPoster.url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                onError={(e) => {
                  console.error('Video failed to load:', currentPoster.url, e);
                  handleVideoEnd();
                }}
              >
                <source src={getCacheBustedUrl(currentPoster.url)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={currentPoster.url}
                  alt={currentPoster.name}
                  fill
                  className="object-cover"
                  priority={current === 0}
                  sizes="100vw"
                  unoptimized
                  onError={(e) => {
                    console.error('Image failed to load:', currentPoster.url);
                  }}
                />
              </div>
            )}
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Optional: Navigation dots */}
      {posters.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {posters.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === current
                  ? 'bg-yellow-500 scale-125'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to poster ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}