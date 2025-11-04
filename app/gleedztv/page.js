"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  RotateCcw,
  SkipForward,
  Tv,
  Cast,
  Share2
} from "lucide-react";
import Image from "next/image";

const LOGO_URL = "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/gleedlogo.png";
const ADMIN_USER_ID = "6c532481-812c-46dc-a978-610bd643432b";

export default function GleedzTV() {
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [liveComments, setLiveComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLiveBroadcast, setIsLiveBroadcast] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const titleTimeoutRef = useRef(null);
  const iframeRef = useRef(null);

  // Get current video safely
  const currentVideo = videos[currentVideoIndex];

  // Check current user and admin status
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsAdmin(user?.id === ADMIN_USER_ID);
    };
    getCurrentUser();
  }, []);

  // Fetch videos from Supabase
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("tv_videos")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setVideos(data || []);
        
        // Check if current video is live broadcast
        if (data && data.length > 0) {
          setIsLiveBroadcast(data[0].is_live || false);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Auto-hide controls and title
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    if (showTitle) {
      titleTimeoutRef.current = setTimeout(() => {
        setShowTitle(false);
      }, 5000);
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    };
  }, [showControls, showTitle]);

  // Fetch live comments (simulated)
  useEffect(() => {
    if (!isLiveBroadcast) return;

    const fetchComments = async () => {
      // Simulated comments for demo
      const mockComments = [
        { id: 1, user: "User1", text: "Amazing stream! 🔥", timestamp: new Date() },
        { id: 2, user: "Viewer42", text: "Hello from Nigeria!", timestamp: new Date() },
        { id: 3, user: "MusicLover", text: "Great performance! 🎵", timestamp: new Date() },
        { id: 4, user: "GleedzFan", text: "This platform is awesome!", timestamp: new Date() },
        { id: 5, user: "StreamWatcher", text: "Wow! Incredible production quality", timestamp: new Date() },
        { id: 6, user: "EventLover", text: "Can't wait for the next event!", timestamp: new Date() },
        { id: 7, user: "MusicFan", text: "The sound quality is amazing! 🎶", timestamp: new Date() },
      ];
      setLiveComments(mockComments);
    };

    fetchComments();
    const interval = setInterval(fetchComments, 8000);

    return () => clearInterval(interval);
  }, [isLiveBroadcast]);

  // Handle video end and auto-play next video
  const playNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    setShowTitle(true);
    setIsPlaying(true);
  };

  // Handle YouTube iframe state changes
  useEffect(() => {
    const handleMessage = (event) => {
      // Handle YouTube player state changes
      if (event.origin !== "https://www.youtube.com") return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info && data.info.currentTime !== undefined) {
          // Video is playing normally
          setIsPlaying(true);
        }
      } catch (err) {
        // Not a YouTube message or not JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Monitor for YouTube ending and showing suggestions
  useEffect(() => {
    if (!currentVideo?.is_live || videos.length === 0) return;

    const checkVideoState = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        // Check if YouTube has ended and is showing suggestions
        // This is a heuristic approach since we can't directly access YouTube's internal state
        const iframeSrc = iframe.src;
        if (iframeSrc.includes('rel=0') && iframeSrc.includes('controls=0')) {
          // If the video has been playing for a while and suddenly stops, move to next
          // This is a fallback for when YouTube ends and shows suggestions
          setTimeout(() => {
            playNextVideo();
          }, 5000); // Wait 5 seconds then move to next video
        }
      } catch (err) {
        console.error("Error checking video state:", err);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkVideoState);
  }, [currentVideo, videos.length, playNextVideo]);

  // Get proper video source with YouTube branding removed
  const getVideoSource = (video) => {
    if (!video) return '';
    
    if (video.embed_url?.includes('youtube.com/embed')) {
      const baseUrl = video.embed_url.split('?')[0]; // Remove existing parameters
      const params = new URLSearchParams({
        autoplay: '1',
        mute: isMuted ? '1' : '0',
        modestbranding: '1',
        rel: '0',
        controls: '0',
        showinfo: '0',
        fs: '0',
        disablekb: '1',
        playsinline: '1',
        iv_load_policy: '3', // Hide annotations
        origin: window.location.origin,
        enablejsapi: '1', // Enable JS API for better control
        widget_referrer: window.location.origin,
      });
      
      // Add playlist parameter if there are multiple videos
      if (videos.length > 1) {
        const videoIds = videos
          .map(v => {
            if (v.embed_url?.includes('youtube.com/embed')) {
              return v.embed_url.split('/embed/')[1]?.split('?')[0];
            }
            return null;
          })
          .filter(id => id && id !== video.embed_url.split('/embed/')[1]?.split('?')[0]);
        
        if (videoIds.length > 0) {
          params.append('playlist', videoIds.join(','));
        }
      }
      
      return `${baseUrl}?${params.toString()}`;
    }
    
    if (video.embed_url?.includes('youtube.com/watch')) {
      const videoId = video.embed_url.split('v=')[1]?.split('&')[0];
      const params = new URLSearchParams({
        autoplay: '1',
        mute: isMuted ? '1' : '0',
        modestbranding: '1',
        rel: '0',
        controls: '0',
        showinfo: '0',
        fs: '0',
        disablekb: '1',
        playsinline: '1',
        iv_load_policy: '3',
        enablejsapi: '1',
        widget_referrer: window.location.origin,
      });
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }
    
    if (video.embed_url?.includes('vimeo.com')) {
      return video.embed_url;
    }
    
    // For live streams
    if (video.is_live && video.live_stream_url) {
      return video.live_stream_url;
    }
    
    return video.embed_url || video.direct_url || '';
  };

  // Fullscreen handling
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Control functions
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipToNext = () => {
    playNextVideo();
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    setShowTitle(true);
  };

  const shareVideo = async () => {
    const shareData = {
      title: currentVideo?.title || 'Gleedz TV',
      text: 'Watch this on Gleedz TV!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Gleedz TV...</p>
        </div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Tv className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl mb-4">{error || "No content available"}</p>
          <p className="text-gray-400">Check back later for live content</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-black relative ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      {/* Gleedz Logo - 2x bigger */}
      <div className={`absolute top-4 left-4 z-30 ${
        isFullscreen ? "top-6 left-6" : ""
      }`}>
        <div className={`relative ${
          isFullscreen ? "w-32 h-32" : "w-24 h-24" // 2x bigger than before
        }`}>
          <Image
            src={LOGO_URL}
            alt="Gleedz Logo"
            fill
            className="object-contain drop-shadow-lg"
            unoptimized
          />
        </div>
      </div>

      {/* Live Indicator - Under the logo and reduced by half */}
      {currentVideo?.is_live && (
        <div className={`absolute left-4 z-30 ${
          isFullscreen ? "top-40 left-6" : "top-28 left-4" // Adjusted for bigger logo
        }`}>
          <div className="flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">LIVE</span>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="relative w-full h-screen bg-black">
        {currentVideo?.is_live ? (
          // Live Stream Embed with ref for monitoring
          <iframe
            ref={iframeRef}
            src={getVideoSource(currentVideo)}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            frameBorder="0"
            title={currentVideo?.title || "Gleedz Live Stream"}
            onLoad={() => {
              // Set a timeout to auto-advance if YouTube shows suggestions
              setTimeout(() => {
                playNextVideo();
              }, 300000); // Move to next video after 5 minutes as fallback
            }}
          />
        ) : (
          // Regular Video
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            muted={isMuted}
            playsInline
            autoPlay
            onEnded={playNextVideo}
            onError={() => {
              // If video errors, move to next
              setTimeout(playNextVideo, 3000);
            }}
          >
            Your browser does not support the video tag.
          </video>
        )}

        {/* Video Info Overlay - Smaller with 50% transparency */}
        <AnimatePresence>
          {showTitle && currentVideo && (
            <motion.div 
              className={`absolute top-4 right-4 z-30 bg-black bg-opacity-50 text-white p-2 rounded-lg max-w-xs ${
                isFullscreen ? "top-6 right-6" : ""
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onMouseEnter={() => setShowTitle(true)}
              onMouseLeave={() => setShowTitle(false)}
            >
              <div className="flex items-center gap-2 mb-1">
                {currentVideo.is_live && (
                  <div className="flex items-center gap-1 text-red-500">
                    <Cast size={12} />
                    <span className="text-xs font-bold">LIVE</span>
                  </div>
                )}
                <h2 className="font-bold text-sm">{currentVideo.title || "Gleedz TV"}</h2>
              </div>
              <p className="text-xs text-gray-300 line-clamp-2">
                {currentVideo.description || "Live Content"}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-yellow-400">
                <span>
                  {currentVideoIndex + 1} of {videos.length}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Comments Ticker - True rotational scrolling */}
        {isLiveBroadcast && liveComments.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white py-2 overflow-hidden z-20">
            <div className="flex animate-scroll">
              {[...liveComments, ...liveComments].map((comment, index) => (
                <div 
                  key={`${comment.id}-${index}`} 
                  className="flex items-center gap-3 text-sm bg-black bg-opacity-50 px-4 py-1 rounded-full mx-2 whitespace-nowrap"
                >
                  <span className="text-yellow-400 font-semibold text-xs">{comment.user}:</span>
                  <span className="text-white text-xs">{comment.text}</span>
                </div>
              ))}
            </div>
            <style jsx>{`
              @keyframes scroll {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-50%);
                }
              }
              .animate-scroll {
                animation: scroll 60s linear infinite;
                display: flex;
                width: max-content;
              }
              .animate-scroll:hover {
                animation-play-state: paused;
              }
            `}</style>
          </div>
        )}

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black bg-opacity-70 rounded-full px-4 py-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex items-center gap-4 text-white">
                {/* Admin Controls */}
                {isAdmin && !isLiveBroadcast && (
                  <>
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlayPause}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    {/* Mute/Unmute */}
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    {/* Restart */}
                    <button
                      onClick={restartVideo}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                    >
                      <RotateCcw size={20} />
                    </button>

                    {/* Next */}
                    <button
                      onClick={skipToNext}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                    >
                      <SkipForward size={20} />
                    </button>
                  </>
                )}

                {/* Public Controls (Always Available) */}
                {!isLiveBroadcast && (
                  <button
                    onClick={togglePlayPause}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                )}

                {/* Share Button */}
                <button
                  onClick={shareVideo}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  <Share2 size={20} />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Playlist (Visible only in non-fullscreen mode and for admin) */}
      {!isFullscreen && isAdmin && (
        <div className="bg-gray-900 p-4">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
            <Tv size={20} />
            Broadcast Manager
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  index === currentVideoIndex
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentVideoIndex(index);
                  setIsPlaying(true);
                  setShowTitle(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {index === currentVideoIndex && (
                      <div className="w-2 h-2 bg-black rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-sm">
                        {video.title || `Video ${index + 1}`}
                      </p>
                      {video.is_live && (
                        <Cast size={12} className="text-red-500" />
                      )}
                    </div>
                    <p className="text-xs opacity-75 truncate">
                      {video.description || "Gleedz Content"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}