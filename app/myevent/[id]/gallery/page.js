"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, ChevronLeft, ChevronRight, Grid3X3, List, Image as ImageIcon, Video, X } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader";
import Videos from "../../../../components/videos";

export default function EventGalleryPage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [videos, setVideos] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [mobileHeroSlides, setMobileHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobileHeroIndex, setMobileHeroIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [contentType, setContentType] = useState('photos');
  const [isMobile, setIsMobile] = useState(false);
  const heroTimerRef = useState(null);
  const mobileHeroTimerRef = useState(null);

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
    }
  }, [eventId]);

  // Hero slideshow auto-advance (desktop)
  useEffect(() => {
    if (!isPlaying || heroSlides.length === 0 || isMobile) return;

    const slide = heroSlides[heroIndex];
    if (!slide) return;

    clearTimeout(heroTimerRef.current);

    heroTimerRef.current = setTimeout(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 5000);

    return () => clearTimeout(heroTimerRef.current);
  }, [heroIndex, heroSlides, isPlaying, isMobile]);

  // Mobile hero slideshow auto-advance
  useEffect(() => {
    if (!isPlaying || mobileHeroSlides.length === 0 || !isMobile) return;

    const slide = mobileHeroSlides[mobileHeroIndex];
    if (!slide) return;

    clearTimeout(mobileHeroTimerRef.current);

    mobileHeroTimerRef.current = setTimeout(() => {
      setMobileHeroIndex((i) => (i + 1) % mobileHeroSlides.length);
    }, 5000);

    return () => clearTimeout(mobileHeroTimerRef.current);
  }, [mobileHeroIndex, mobileHeroSlides, isPlaying, isMobile]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*, main_gallery, hero_sections, mobile_hero, page_color, logo, name, videos")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      setEvent(eventData);
      
      if (eventData.main_gallery && Array.isArray(eventData.main_gallery)) {
        setGallery(eventData.main_gallery);
      }
      
      if (eventData.videos && Array.isArray(eventData.videos)) {
        setVideos(eventData.videos);
      }
      
      // Fetch desktop hero sections
      if (eventData.hero_sections && Array.isArray(eventData.hero_sections)) {
        setHeroSlides(eventData.hero_sections);
      }
      
      // Fetch mobile hero sections
      if (eventData.mobile_hero && Array.isArray(eventData.mobile_hero)) {
        setMobileHeroSlides(eventData.mobile_hero);
      }
      
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextHeroSlide = () => {
    if (isMobile) {
      setMobileHeroIndex((i) => (i + 1) % mobileHeroSlides.length);
    } else {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }
  };

  const prevHeroSlide = () => {
    if (isMobile) {
      setMobileHeroIndex((i) => (i - 1 + mobileHeroSlides.length) % mobileHeroSlides.length);
    } else {
      setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length);
    }
  };

  const openMediaViewer = (index) => {
    setSelectedMediaIndex(index);
  };

  const closeMediaViewer = () => {
    setSelectedMediaIndex(null);
  };

  const navigateMedia = (direction) => {
    if (selectedMediaIndex === null) return;
    
    if (direction === 'next') {
      setSelectedMediaIndex((prev) => 
        prev === gallery.length - 1 ? 0 : prev + 1
      );
    } else {
      setSelectedMediaIndex((prev) => 
        prev === 0 ? gallery.length - 1 : prev - 1
      );
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const toggleContentType = (type) => {
    setContentType(type);
  };

  // Download image function
  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'event-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image');
    }
  };

  // Share image function
  const shareImage = async (imageUrl, caption) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: caption || 'Event Image',
          text: caption,
          url: imageUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert('Image URL copied to clipboard!');
      } catch (error) {
        console.error('Copy failed:', error);
        alert('Sharing not supported on this device');
      }
    }
  };

  // Get current slides based on device
  const getCurrentSlides = () => {
    if (isMobile && mobileHeroSlides.length > 0) {
      return mobileHeroSlides;
    }
    return heroSlides;
  };

  const getCurrentIndex = () => {
    if (isMobile && mobileHeroSlides.length > 0) {
      return mobileHeroIndex;
    }
    return heroIndex;
  };

  const currentSlides = getCurrentSlides();
  const currentIndex = getCurrentIndex();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <Link href="/" className="text-gold-600 hover:text-gold-700 font-semibold">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";
  const cardBgColor = `${pageColor}08`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-100">
      <EventHeader event={event} />

      <div className="pt-16">
        {/* Hero Section */}
        {currentSlides.length > 0 && (
          <section className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
            <AnimatePresence mode="wait">
              {currentSlides.map((slide, i) => {
                if (i !== currentIndex) return null;
                return (
                  <motion.div
                    key={slide.id || i}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  >
                    <Image 
                      src={slide.src} 
                      alt={slide.caption} 
                      fill 
                      className="object-cover" 
                      priority
                      unoptimized 
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto z-20 max-w-2xl">
              <motion.div 
                className="text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight drop-shadow-2xl">
                  {currentSlides[currentIndex]?.caption || "Event Gallery"}
                </h2>
                {currentSlides[currentIndex]?.tagline && (
                  <p className="text-base md:text-lg mb-3 md:mb-4 text-white/90 drop-shadow-2xl">
                    {currentSlides[currentIndex].tagline}
                  </p>
                )}
                {currentSlides[currentIndex]?.cta && (
                  <Link 
                    href={currentSlides[currentIndex].cta.href} 
                    className="inline-flex px-4 py-2 text-white rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-sm"
                    style={{ 
                      backgroundColor: pageColor,
                      boxShadow: `0 10px 15px -3px ${pageColor}40, 0 4px 6px -4px ${pageColor}40`
                    }}
                  >
                    {currentSlides[currentIndex].cta.label}
                  </Link>
                )}
              </motion.div>
            </div>

            {currentSlides.length > 1 && (
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                <button 
                  onClick={prevHeroSlide}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextHeroSlide}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Device indicator (for debugging) */}
            <div className="absolute top-4 left-4 z-20 px-2 py-1 rounded bg-black/50 text-white text-xs backdrop-blur-sm">
              {isMobile ? 'Mobile' : 'Desktop'} Hero
            </div>
          </section>
        )}

        {/* Main Gallery */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Header with Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Event Gallery</h1>
              <p className="text-gray-600 mt-1">
                {contentType === 'photos' 
                  ? `${gallery.length} ${gallery.length === 1 ? 'photo' : 'photos'}`
                  : `${videos.length} ${videos.length === 1 ? 'video' : 'videos'}`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Content Type Toggle */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => toggleContentType('photos')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                    contentType === 'photos' 
                      ? 'text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{
                    backgroundColor: contentType === 'photos' ? pageColor : 'transparent'
                  }}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Photos</span>
                </button>
                <button
                  onClick={() => toggleContentType('videos')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                    contentType === 'videos' 
                      ? 'text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{
                    backgroundColor: contentType === 'videos' ? pageColor : 'transparent'
                  }}
                >
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-medium">Videos</span>
                </button>
              </div>

              {contentType === 'photos' && (
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{
                      backgroundColor: viewMode === 'grid' ? pageColor : 'transparent'
                    }}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{
                      backgroundColor: viewMode === 'list' ? pageColor : 'transparent'
                    }}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          {contentType === 'photos' ? (
            gallery.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${pageColor}15` }}
                >
                  <ImageIcon className="w-10 h-10" style={{ color: pageColor }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Photos Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Amazing photos from this event will be shared here soon. Check back later!
                </p>
              </div>
            ) : (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
                  : 'space-y-4'
                }
              `}>
                {gallery.map((item, index) => (
                  <GalleryCard 
                    key={index}
                    item={item}
                    index={index}
                    onSelect={() => openMediaViewer(index)}
                    cardBgColor={cardBgColor}
                    pageColor={pageColor}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )
          ) : (
            <Videos 
              videos={videos}
              event={event}
              pageColor={pageColor}
            />
          )}
        </main>

        {/* Instagram-style Media Viewer */}
        <AnimatePresence>
          {selectedMediaIndex !== null && (
            <InstagramMediaViewer 
              gallery={gallery}
              currentIndex={selectedMediaIndex}
              onClose={closeMediaViewer}
              onNavigate={navigateMedia}
              pageColor={pageColor}
              onDownload={downloadImage}
              onShare={shareImage}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Gallery Card Component
function GalleryCard({ item, index, onSelect, cardBgColor, pageColor, viewMode }) {
  const [imageError, setImageError] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200"
        style={{ backgroundColor: cardBgColor }}
        onClick={onSelect}
      >
        <div className="flex items-center gap-4 p-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            {item.image && !imageError ? (
              <Image
                src={item.image}
                alt={item.caption || "Gallery image"}
                width={80}
                height={80}
                className="object-cover w-full h-full"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center rounded-lg"
                style={{ backgroundColor: `${pageColor}15` }}
              >
                <ImageIcon className="w-6 h-6" style={{ color: pageColor }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
              {item.caption || "Untitled"}
            </h3>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer border border-gray-200"
      style={{ backgroundColor: cardBgColor }}
      whileHover={{ scale: 1.03 }}
      onClick={onSelect}
    >
      <div className="relative aspect-square overflow-hidden">
        {item.image && !imageError ? (
          <Image
            src={item.image}
            alt={item.caption || "Gallery image"}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${pageColor}15` }}
          >
            <ImageIcon className="w-8 h-8" style={{ color: pageColor }} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Action buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          {item.downloadable && (
            <button 
              className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-full transition-colors backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                // Download handled in parent
              }}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {item.shareable && (
            <button 
              className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-full transition-colors backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                // Share handled in parent
              }}
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {item.caption && (
        <div className="p-3">
          <p className="text-sm text-gray-700 line-clamp-2 leading-tight">
            {item.caption}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// Instagram-style Media Viewer Component
function InstagramMediaViewer({ gallery, currentIndex, onClose, onNavigate, pageColor, onDownload, onShare }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);

  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      // Scroll down - next image
      onNavigate('next');
    } else {
      // Scroll up - previous image
      onNavigate('prev');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      onNavigate('next');
    } else if (e.key === 'ArrowUp') {
      onNavigate('prev');
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentItem = gallery[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-none md:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        {/* Image Container */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-0">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            <Image
              src={currentItem.image}
              alt={currentItem.caption || "Gallery view"}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              unoptimized
            />
          </motion.div>

          {/* Navigation Arrows */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('prev');
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('next');
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
            {currentIndex + 1} / {gallery.length}
          </div>
        </div>

        {/* Caption and Actions Section */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Caption */}
            {currentItem.caption && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-900 text-lg mb-4 leading-relaxed"
              >
                {currentItem.caption}
            </motion.p>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 pt-4 border-t border-gray-100"
            >
              {(currentItem.downloadable !== false) && (
                <button
                  onClick={() => onDownload(currentItem.image, currentItem.caption || 'event-image')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
              )}
              
              {(currentItem.shareable !== false) && (
                <button
                  onClick={() => onShare(currentItem.image, currentItem.caption)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full"
        >
          Scroll to navigate
        </motion.div>
      </motion.div>
    </motion.div>
  );
}