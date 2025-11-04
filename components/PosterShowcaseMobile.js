"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PosterShowcaseMobile() {
  const posters = [
    {
      name: "poster2",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/v2.mp4",
      href: "/poster/poster2",
      type: "video",
    },
    {
      name: "poster3",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/1024.mp4",
      href: "/poster/poster3",
      type: "video",
    },
    {
      name: "poster4",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/1.jpg", // example image
      href: "/poster/poster4",
      type: "image",
    },
  ];

  const [current, setCurrent] = useState(0);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const currentPoster = posters[current];

    // If it's an image → auto switch after 6s
    if (currentPoster.type === "image") {
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
    setCurrent((prev) => (prev + 1) % posters.length);
  };

  return (
    <div className="block md:hidden relative w-full aspect-[3/1] overflow-hidden shadow-md border-b border-gold-400 bg-black rounded-b-2xl">
      <AnimatePresence mode="wait">
        {posters.map(
          (poster, index) =>
            index === current && (
              <motion.div
                key={poster.name}
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <Link href={poster.href}>
                  {poster.type === "video" ? (
                    <video
                      key={poster.url}
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                      onEnded={handleVideoEnd} // ⬅ switch when video ends
                    >
                      <source src={poster.url} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={poster.url}
                      alt={poster.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </Link>
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  );
}
