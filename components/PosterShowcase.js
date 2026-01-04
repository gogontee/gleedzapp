"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient"; // Adjust the import path as needed
import { Volume2, VolumeX } from "lucide-react";

export default function PosterShowcase() {
  const [posters, setPosters] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRefs = useRef([]);
  const [isHovered, setIsHovered] = useState(false);
  const [volume, setVolume] = useState(0.3); // Default volume at 30%

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

  // Initialize video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, posters.length);
  }, [posters.length]);

  // Handle video play with sound
  const handleVideoPlay = (index) => {
    if (videoRefs.current[index]) {
      try {
        // Set volume to current volume level
        videoRefs.current[index].volume = volume;
        
        // Play video with sound
        const playPromise = videoRefs.current[index].play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`Poster video ${index} playing with sound`);
          }).catch(error => {
            console.error(`Error playing poster video ${index}:`, error);
            // If autoplay fails due to user interaction requirement,
            // fall back to muted play
            videoRefs.current[index].muted = true;
            videoRefs.current[index].play().catch(err => {
              console.error(`Fallback play also failed for poster video ${index}:`, err);
            });
          });
        }
      } catch (error) {
        console.error(`Error setting up poster video ${index}:`, error);
      }
    }
  };

  // Handle video pause
  const handleVideoPause = (index) => {
    if (videoRefs.current[index]) {
      videoRefs.current[index].pause();
    }
  };

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

  // Handle current video when slide changes
  useEffect(() => {
    const currentPoster = posters[current];
    
    // Stop all videos first
    videoRefs.current.forEach((video, index) => {
      if (video && index !== current) {
        video.pause();
        video.currentTime = 0;
      }
    });
    
    // If current poster is video, play it
    if (currentPoster && currentPoster.type === "video") {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (videoRefs.current[current]) {
          handleVideoPlay(current);
        }
      }, 100);
    }
  }, [current, posters]);

  // Handle video end to auto-advance
  const handleVideoEnd = (index) => {
    console.log(`Poster video ${index} ended`);
    if (posters.length > 1) {
      setCurrent((prev) => (prev + 1) % posters.length);
    }
  };

  // Toggle volume between 30% and 0%
  const toggleVolume = () => {
    const currentVideo = videoRefs.current[current];
    if (currentVideo) {
      if (currentVideo.volume > 0) {
        currentVideo.volume = 0;
        setVolume(0);
      } else {
        currentVideo.volume = 0.3; // Restore to 30%
        setVolume(0.3);
      }
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
    <div 
      className="hidden md:block w-full h-full relative bg-black"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
                ref={el => videoRefs.current[current] = el}
                key={currentPoster.url}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                onEnded={() => handleVideoEnd(current)}
                onError={(e) => {
                  console.error('Video failed to load:', currentPoster.url, e);
                  handleVideoEnd(current);
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

      {/* Volume control for videos (only shown when video is playing and hovered) */}
      {currentPoster.type === "video" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleVolume();
          }}
          className="absolute bottom-4 right-4 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200"
          aria-label={volume > 0 ? "Mute sound" : "Unmute sound"}
        >
          {volume > 0 ? (
            <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </motion.button>
      )}

      {/* Navigation dots */}
      {posters.length > 1 && (
        <motion.div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {posters.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrent(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === current
                  ? 'bg-yellow-500 scale-125'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to poster ${index + 1}`}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}