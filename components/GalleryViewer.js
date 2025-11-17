import { useState, useRef } from "react"; // Import from React
import { motion } from "framer-motion"; // Only motion from framer-motion
import Image from "next/image";
import { ChevronLeft, X, User, Share2, Bookmark, MoreHorizontal, MessageCircle } from "lucide-react";

export default function GalleryViewer({ gallery, currentIndex, onClose, pageColor, candidate }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex || 0); // Add fallback for undefined
  const containerRef = useRef(null);

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
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.log('Error copying to clipboard:', error);
        prompt('Copy this link to share:', shareUrl);
      }
    }
  };

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
          <div className="w-8"></div>
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