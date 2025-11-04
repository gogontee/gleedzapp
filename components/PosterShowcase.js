"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function PosterShowcase() {
  // Poster list with hrefs (links)
  const posters = [
    {
      name: "poster1",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster.mp4",
      href: "/poster/poster1",
      type: "video",
    },
    {
      name: "poster1",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/missuniverse.jpg",
      href: "/poster/poster1",
      type: "image",
    },
    {
      name: "poster2",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster1.mp4",
      href: "/poster/poster2",
      type: "video",
    },
    {
      name: "poster3",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/1024(1).mp4",
      href: "/poster/poster3",
      type: "video",
    },
    {
      name: "poster4",
      url: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster4.mp4",
      href: "/poster/poster4",
      type: "video",
    },
  ];

  const [current, setCurrent] = useState(0);

  // cycle posters every 6s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % posters.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [posters.length]);

  return (
    <div className="hidden md:block w-full h-full relative bg-black">
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
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src={poster.url} type="video/mp4" />
                    </video>
                  ) : (
                    <Image
                      src={poster.url}
                      alt={poster.name}
                      fill
                      className="object-cover"
                      priority
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