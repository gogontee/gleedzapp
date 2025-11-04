"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  MonitorPlay, 
  RotateCcw, 
  RotateCw, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Videos({ videos, pageColor = "#D4AF37" }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Play className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Videos Available</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Video content will be available soon. Check back later!
        </p>
      </div>
    );
  }

  const openVideo = (video, index) => {
    setSelectedVideo(video);
    setCurrentVideoIndex(index);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  const nextVideo = () => {
    const nextIndex = (currentVideoIndex + 1) % videos.length;
    setSelectedVideo(videos[nextIndex]);
    setCurrentVideoIndex(nextIndex);
  };

  const prevVideo = () => {
    const prevIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
    setSelectedVideo(videos[prevIndex]);
    setCurrentVideoIndex(prevIndex);
  };

  return (
    <div className="w-full">
      {/* Video Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video, index) => (
          <VideoCard
            key={index}
            video={video}
            index={index}
            onSelect={() => openVideo(video, index)}
            pageColor={pageColor}
          />
        ))}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <VideoPlayer
            video={selectedVideo}
            onClose={closeVideo}
            onNext={nextVideo}
            onPrev={prevVideo}
            hasNext={videos.length > 1}
            hasPrev={videos.length > 1}
            pageColor={pageColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Video Card Component (unchanged)
function VideoCard({ video, index, onSelect, pageColor }) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const getVideoThumbnail = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://vumbnail.com/${videoId}.jpg` : null;
    }
    return null;
  };

  const thumbnail = getVideoThumbnail(video.url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        {thumbnail && !thumbnailError ? (
          <img
            src={thumbnail}
            alt={video.title || "Video thumbnail"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Play className="w-8 h-8 text-gray-400" fill="currentColor" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: pageColor }}
          >
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-1 rounded">
            {video.duration}
          </div>
        )}
      </div>

      {/* Video Title */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
          {video.title || "Untitled Video"}
        </h3>
      </div>
    </motion.div>
  );
}

// Fixed Video Player Component
function VideoPlayer({ video, onClose, onNext, onPrev, hasNext, hasPrev, pageColor }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoType, setVideoType] = useState('native'); // 'native' or 'embedded'

  // Determine video type
  useEffect(() => {
    const url = video.url;
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
      setVideoType('embedded');
    } else {
      setVideoType('native');
    }
  }, [video.url]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // Video event handlers - ONLY for native videos
  useEffect(() => {
    if (videoType !== 'native') return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      videoElement.volume = volume;
      videoElement.muted = isMuted;
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(videoElement.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (hasNext) onNext();
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);

    // Auto-play when ready
    videoElement.play().then(() => {
      setIsPlaying(true);
    }).catch(console.error);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [video.url, hasNext, onNext, volume, isMuted, videoType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Always work regardless of video type
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (videoType === 'native') {
            togglePlay();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoType === 'native') {
            skip(-10);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoType === 'native') {
            skip(10);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, onClose, videoType]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const setVideoVolume = (newVolume) => {
    if (videoRef.current) {
      const vol = Math.max(0, Math.min(1, newVolume));
      videoRef.current.volume = vol;
      setVolume(vol);
      if (vol === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSeek = (e) => {
    if (videoType !== 'native') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seek(newTime);
  };

  const increasePlaybackRate = () => {
    if (videoRef.current) {
      const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      const currentIndex = rates.indexOf(playbackRate);
      const nextIndex = Math.min(currentIndex + 1, rates.length - 1);
      setPlaybackRate(rates[nextIndex]);
      videoRef.current.playbackRate = rates[nextIndex];
    }
  };

  const decreasePlaybackRate = () => {
    if (videoRef.current) {
      const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      const currentIndex = rates.indexOf(playbackRate);
      const nextIndex = Math.max(currentIndex - 1, 0);
      setPlaybackRate(rates[nextIndex]);
      videoRef.current.playbackRate = rates[nextIndex];
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : url;
    }
    
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(video.url);

  // Show message for embedded videos
  const isEmbedded = videoType === 'embedded';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
      ref={containerRef}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Container */}
      <div className="relative w-full h-full bg-black">
        {/* Embedded Video or Native Video */}
        {isEmbedded ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              frameBorder="0"
            />
            {showControls && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg">
                <p className="text-sm">
                  For YouTube/Vimeo videos, please use the player's native controls.
                  Some custom controls may not work with embedded videos.
                </p>
              </div>
            )}
          </div>
        ) : (
          <video
            ref={videoRef}
            src={video.url}
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />
        )}

        {/* Top Gradient & Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none"
            >
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="text-white">
                  <h2 className="text-lg font-semibold truncate max-w-2xl">
                    {video.title || "Video Player"}
                  </h2>
                </div>
                
                <div className="w-10"></div> {/* Spacer for balance */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls - Only show for native videos */}
        <AnimatePresence>
          {showControls && !isEmbedded && (
            <motion.div
              ref={controlsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-auto"
            >
              {/* Progress Bar */}
              <div className="mb-4">
                <div 
                  className="w-full h-1 bg-gray-600 rounded-full cursor-pointer group"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full rounded-full relative group-hover:h-1.5 transition-all duration-150"
                    style={{ 
                      width: `${(currentTime / duration) * 100}%`,
                      backgroundColor: pageColor
                    }}
                  >
                    <div 
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center gap-4 text-white">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="hover:scale-110 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" fill="currentColor" />
                    )}
                  </button>

                  {/* Skip Buttons */}
                  <button
                    onClick={() => skip(-10)}
                    className="hover:scale-110 transition-transform"
                    title="Rewind 10 seconds (←)"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => skip(10)}
                    className="hover:scale-110 transition-transform"
                    title="Forward 10 seconds (→)"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="hover:scale-110 transition-transform"
                      title={isMuted ? "Unmute (m)" : "Mute (m)"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="w-20">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4 text-white">
                  {/* Playback Rate */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-sm hover:scale-110 transition-transform px-2 py-1 rounded hover:bg-white/10"
                    >
                      {playbackRate}x
                    </button>
                    
                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-32">
                        <div className="text-xs text-gray-400 px-2 py-1">Playback Speed</div>
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => {
                              setPlaybackRate(rate);
                              if (videoRef.current) videoRef.current.playbackRate = rate;
                              setShowSettings(false);
                            }}
                            className={`block w-full text-left px-2 py-1 rounded hover:bg-white/10 text-sm ${
                              playbackRate === rate ? 'text-blue-400' : 'text-white'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PIP (Picture-in-Picture) */}
                  <button
                    onClick={() => videoRef.current?.requestPictureInPicture?.()}
                    className="hover:scale-110 transition-transform"
                    title="Picture in Picture"
                  >
                    <MonitorPlay className="w-5 h-5" />
                  </button>

                  {/* Navigation */}
                  <div className="flex items-center gap-2">
                    {hasPrev && (
                      <button
                        onClick={onPrev}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                        title="Previous video"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {hasNext && (
                      <button
                        onClick={onNext}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                        title="Next video"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="hover:scale-110 transition-transform"
                    title={isFullscreen ? "Exit Fullscreen (f)" : "Enter Fullscreen (f)"}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Play/Pause Button - Only for native videos */}
        {!isPlaying && !isEmbedded && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="p-8 rounded-full bg-black/50 text-white group-hover:bg-black/70 transition-colors">
              <Play className="w-16 h-16" fill="currentColor" />
            </div>
          </button>
        )}

        {/* Loading Spinner - Only for native videos */}
        {duration === 0 && !isEmbedded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}