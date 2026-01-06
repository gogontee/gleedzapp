"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Award, Users, Ticket, Star, Sun, House, Briefcase, 
  ChevronLeft, ChevronRight, Play, Pause, Share2, Heart, MapPin, 
  Clock, Eye, Crown, Sparkles, Menu, Newspaper, Mail, Phone, Map, 
  Facebook, Twitter, Instagram, Linkedin, Coins, Gem, Medal, Trophy, 
  Landmark, ChevronDown, DollarSign, Euro, IndianRupee, JapaneseYen, 
  PoundSterling, Key, Target, Car, Key as KeyIcon, Images, Download,
  Image as ImageIcon, Video, Music, Mic, Camera, Flag, Globe, Lock,
  Unlock, Settings, User, Users as UsersIcon, Phone as PhoneIcon,
  Mail as MailIcon, Map as MapIcon
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import EventHeader from "../../components/EventHeader";

export default function DefaultEventPage({ event }) {
  // ---------- hero slides state ----------
  const [mobileHeroSlides, setMobileHeroSlides] = useState([]);
  const [desktopHeroSlides, setDesktopHeroSlides] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);

  // ---------- dynamic stats ----------
  const stats = event?.stats || [];

  // ---------- poster groups ----------
  const posters = event?.group_banner1 || [];

  // ---------- sponsors ----------
  const sponsors = event?.group_banner2 || [];

  // ---------- feature posts ----------
  const [featurePosts, setFeaturePosts] = useState([]);

  // ---------- candidates state ----------
  const [candidates, setCandidates] = useState([]);
  const [activities, setActivities] = useState([]);
  const [news, setNews] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);

  // ---------- dynamic page color ----------
  const pageColor = event?.page_color || "#D4AF37";

  // ---------- state management ----------
  const [heroIndex, setHeroIndex] = useState(0);
  const [posterIndex, setPosterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [favoriteCandidates, setFavoriteCandidates] = useState(new Set());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  
  const heroTimerRef = useRef(null);
  const posterTimerRef = useRef(null);
  const sponsorsRef = useRef(null);
  
  // Touch handlers for swipe functionality
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // ---------- Check if any candidate has scoring enabled ----------
  const hasAnyScoringEnabled = () => {
    if (candidates.length === 0) return false;
    
    return candidates.some(candidate => 
      candidate.votes_toggle === true || 
      candidate.gifts_toggle === true || 
      candidate.points_toggle === true
    );
  };

  // ---------- fetch hero slides based on screen size ----------
  useEffect(() => {
    const fetchHeroSlides = () => {
      if (event?.mobile_hero && Array.isArray(event.mobile_hero) && event.mobile_hero.length > 0) {
        setMobileHeroSlides(event.mobile_hero);
      }
      
      if (event?.hero_sections && Array.isArray(event.hero_sections) && event.hero_sections.length > 0) {
        setDesktopHeroSlides(event.hero_sections);
      }
    };

    fetchHeroSlides();
  }, [event]);

  // ---------- determine which hero slides to use based on screen size ----------
  useEffect(() => {
    const updateHeroSlides = () => {
      const isMobile = window.innerWidth < 768;
      
      if (isMobile && mobileHeroSlides.length > 0) {
        // Use mobile hero slides if available
        setHeroSlides(mobileHeroSlides);
      } else if (desktopHeroSlides.length > 0) {
        // Use desktop hero slides
        setHeroSlides(desktopHeroSlides);
      } else if (mobileHeroSlides.length > 0) {
        // Fallback to mobile hero slides if desktop is empty
        setHeroSlides(mobileHeroSlides);
      } else {
        // Default empty array
        setHeroSlides([]);
      }
    };

    updateHeroSlides();
    
    // Add event listener for window resize
    window.addEventListener('resize', updateHeroSlides);
    
    return () => {
      window.removeEventListener('resize', updateHeroSlides);
    };
  }, [mobileHeroSlides, desktopHeroSlides]);

  // ---------- fetch feature posts ----------
  useEffect(() => {
    if (event?.main_gallery && Array.isArray(event.main_gallery)) {
      // Take only first 4 posts
      const firstFourPosts = event.main_gallery.slice(0, 4);
      setFeaturePosts(firstFourPosts);
      
    }
  }, [event]);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    if (distance > minSwipeDistance) {
      // Swipe left - next poster
      nextPoster();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous poster
      prevPoster();
    }
    
    // Reset touch positions
    setTouchStart(0);
    setTouchEnd(0);
  };
  
  // ---------- fetch candidates and activities ----------
  useEffect(() => {
    if (event?.id) {
      fetchCandidates();
      processActivities();
      processNews();
      fetchContactInfo();
    }
  }, [event]);

  // Check auth and favorite status
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && event) {
      checkIfFavorite();
    }
  }, [user, event]);

  // ---------- COMPLETE ICON MAPPING FUNCTION ----------
  const getIconComponent = (iconName) => {
    const iconMap = {
      // Basic icons
      Users: Users,
      User: User,
      Award: Award,
      Ticket: Ticket,
      Eye: Eye,
      Star: Star,
      House: House,
      Car: Car,
      Key: Key,
      Gem: Gem,
      Pause: Pause,
      Newspaper: Newspaper,
      Medal: Medal,
      Trophy: Trophy,
      Landmark: Landmark,
      ChevronDown: ChevronDown,
      Coins: Coins,
      DollarSign: DollarSign,
      Euro: Euro,
      IndianRupee: IndianRupee,
      JapaneseYen: JapaneseYen,
      PoundSterling: PoundSterling,
      Calendar: Calendar,
      Sun: Sun,
      Target: Target,
      
      // Additional icons for better coverage
      Briefcase: Briefcase,
      MapPin: MapPin,
      Clock: Clock,
      Crown: Crown,
      Sparkles: Sparkles,
      Menu: Menu,
      Mail: Mail,
      Phone: Phone,
      Map: Map,
      Facebook: Facebook,
      Twitter: Twitter,
      Instagram: Instagram,
      Linkedin: Linkedin,
      Images: Images,
      Download: Download,
      Image: ImageIcon,
      Video: Video,
      Music: Music,
      Mic: Mic,
      Camera: Camera,
      Flag: Flag,
      Globe: Globe,
      Lock: Lock,
      Unlock: Unlock,
      Settings: Settings,
      
      // Fallbacks and aliases
      UsersIcon: Users,
      PhoneIcon: Phone,
      MailIcon: Mail,
      MapIcon: Map,
      KeyIcon: Key,
    };
    
    return iconMap[iconName] || Users; // Fallback to Users icon if not found
  };

  // ---------- Safe URL extractor function ----------
  const getSafeUrl = (url) => {
    if (typeof url === 'string') return url;
    if (url && typeof url === 'object' && url.src) return url.src;
    if (url && typeof url === 'object' && url.url) return url.url;
    return '';
  };

  // ---------- Check if file is video ----------
  const isVideoFile = (url) => {
    const actualUrl = typeof url === 'string' ? url : url?.src || '';
    if (!actualUrl || typeof actualUrl !== 'string') return false;
    
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => actualUrl.toLowerCase().includes(ext));
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !event) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('favorite_events')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorites:', error);
        return;
      }

      if (userData?.favorite_events) {
        const favoriteEvents = userData.favorite_events;
        const isEventFavorite = favoriteEvents.includes(event.id);
        setIsFavorite(isEventFavorite);
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      showCustomAlert("Login Required", "Please login to add events to your favorites.", "warning");
      return;
    }

    if (!event) {
      showCustomAlert("Error", "Event information not available.", "error");
      return;
    }

    setFavoriteLoading(true);

    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('favorite_events')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const currentFavorites = userData?.favorite_events || [];

      if (currentFavorites.includes(event.id)) {
        showCustomAlert(
          "Already in Favorites", 
          `${event.name} is already in your favorite events.`, 
          "info"
        );
        setIsFavorite(true);
        return;
      }

      const confirmed = window.confirm(`Do you want to add "${event.name}" to your favorite events?`);
      
      if (!confirmed) {
        return;
      }

      const updatedFavorites = [...currentFavorites, event.id];

      const { error: updateError } = await supabase
        .from('users')
        .update({ favorite_events: updatedFavorites })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setIsFavorite(true);
      showCustomAlert(
        "Added to Favorites", 
        `${event.name} has been added to your favorite events!`, 
        "success"
      );

    } catch (error) {
      console.error('Error updating favorites:', error);
      showCustomAlert(
        "Error", 
        "There was an error adding the event to favorites. Please try again.", 
        "error"
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  const showCustomAlert = (title, message, type) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 max-w-sm transform transition-transform duration-300 ${
      type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
      type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
      type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
      'bg-blue-50 border-blue-500 text-blue-800'
    }`;
    
    alertDiv.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">${title}</h3>
          <p class="text-sm mt-1">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  };

  // Fetch candidates from database - TOP 4 BY POINTS
  const fetchCandidates = async () => {
    if (!event?.id) return;

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('event_id', event.id)
      .eq('approved', true)
      .order('points', { ascending: false })
      .limit(4);

    if (!error && data) {
      setCandidates(data);
    }
  };

  // Fetch contact info from event
  const fetchContactInfo = () => {
    if (event?.contact) {
      setContactInfo(event.contact);
    }
  };

  // Process activities from event data
  const processActivities = () => {
    if (event?.activities && Array.isArray(event.activities)) {
      setActivities(event.activities);
    }
  };

  // Process news from event data
  const processNews = () => {
    if (event?.news && Array.isArray(event.news)) {
      setNews(event.news);
    }
  };

  // ---------- hero slideshow logic ----------
  useEffect(() => {
    if (!isPlaying || heroSlides.length === 0) return;

    const slide = heroSlides[heroIndex];
    if (!slide) return;

    clearTimeout(heroTimerRef.current);

    if (slide.type === "video") {
      // For videos, rely on video's ended event only
    } else {
      // For images, auto-advance after 5000ms
      heroTimerRef.current = setTimeout(() => {
        setHeroIndex((i) => (i + 1) % heroSlides.length);
      }, 5000);
    }

    return () => clearTimeout(heroTimerRef.current);
  }, [heroIndex, heroSlides, isPlaying]);

  // Handle hero video end
  const handleHeroVideoEnd = () => {
    setHeroIndex((i) => (i + 1) % heroSlides.length);
  };

  // ---------- navigation controls ----------
  const nextHeroSlide = () => {
    setHeroIndex((i) => (i + 1) % heroSlides.length);
  };

  const prevHeroSlide = () => {
    setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length);
  };

  // ---------- posters carousel logic ----------
  useEffect(() => {
    if (posters.length === 0) return;

    const currentPoster = posters[posterIndex];
    if (!currentPoster) return;

    clearTimeout(posterTimerRef.current);

    const isVideo = isVideoFile(currentPoster);

    if (isVideo) {
      // For videos, rely on video's ended event only
    } else {
      // For images, auto-advance after 5000ms
      posterTimerRef.current = setTimeout(() => {
        setPosterIndex((i) => (i + 1) % posters.length);
      }, 5000);
    }

    return () => clearTimeout(posterTimerRef.current);
  }, [posterIndex, posters]);

  const nextPoster = () => {
    setPosterIndex((i) => (i + 1) % posters.length);
  };

  const prevPoster = () => {
    setPosterIndex((i) => (i - 1 + posters.length) % posters.length);
  };

  // Handle video end for posters
  const handlePosterVideoEnd = () => {
    setPosterIndex((i) => (i + 1) % posters.length);
  };

  // ---------- favorite toggle ----------
  const toggleFavorite = (candidateId) => {
    setFavoriteCandidates(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(candidateId)) {
        newFavorites.delete(candidateId);
      } else {
        newFavorites.add(candidateId);
      }
      return newFavorites;
    });
  };

  // ---------- share functionality ----------
  const handleShare = async () => {
    const shareData = {
      title: event?.name || 'Event',
      text: event?.description || 'Check out this amazing event!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  // ---------- add to calendar functionality ----------
  const addToCalendar = (activity) => {
    const startDate = activity.date && activity.time 
      ? new Date(`${activity.date}T${activity.time}`)
      : new Date();
    
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const calendarData = {
      title: activity.title,
      description: activity.description || '',
      location: 'Event Venue',
      start: startDate,
      end: endDate
    };

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.title)}&details=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(calendarData.title)}&body=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${calendarData.title}`,
      `DESCRIPTION:${calendarData.description}`,
      `LOCATION:${calendarData.location}`,
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    
    const icsBlob = new Blob([icsContent], { type: 'text/calendar' });
    const icsUrl = URL.createObjectURL(icsBlob);
    
    const calendarChoice = window.confirm(
      'Choose calendar option:\n\nOK - Open Google Calendar\nCancel - Download ICS File'
    );
    
    if (calendarChoice) {
      window.open(googleUrl, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = icsUrl;
      link.download = `${calendarData.title.replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(icsUrl);
    }
  };

  // ---------- get first 30 words from description ----------
  const getShortDescription = (text) => {
    if (!text) return "Discover the stunning visuals and moments from our event";
    const words = text.split(' ').slice(0, 60);
    return words.join(' ') + (words.length === 60 ? '...' : '');
  };

  // ---------- get first 50 characters from content ----------
  const getShortContent = (text) => {
    if (!text) return "";
    return text.slice(0, 50) + (text.length > 50 ? '...' : '');
  };

  // ---------- get first name from full name ----------
  const getFirstName = (fullName) => {
    if (!fullName) return 'Candidate';
    return fullName.split(' ')[0];
  };

  // ---------- countdown timer ----------
  const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
      if (!targetDate) return;

      const calculateTimeLeft = () => {
        const difference = new Date(targetDate).getTime() - new Date().getTime();
        
        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
          });
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }, [targetDate]);

    if (!targetDate || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
      return null;
    }

    return (
      <div className="flex gap-2 mt-3">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-xs font-bold bg-gray-100 rounded px-2 py-1">{timeLeft.days}d</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-xs font-bold bg-gray-100 rounded px-2 py-1">{timeLeft.hours}h</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold bg-gray-100 rounded px-2 py-1">{timeLeft.minutes}m</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold bg-gray-100 rounded px-2 py-1">{timeLeft.seconds}s</div>
        </div>
      </div>
    );
  };

  // Navigation items with proper links
  const navItems = [
    { name: "Home", href: `#home` },
    { name: "Schedule", href: `/myevent/${event?.id}/schedule` },
    { name: "Candidates", href: `/myevent/${event?.id}/vote` },
    { name: "Gallery", href: `/myevent/${event?.id}/gallery` },
    { name: "News", href: `/myevent/${event?.id}/news` },
    { name: "About", href: `/myevent/${event?.id}/about` },
    { name: "Contact", href: `/myevent/${event?.id}/contact` }
  ];

  // Determine which sections to render
  const hasCandidates = candidates.length > 0;
  const hasNews = news.length > 0;
  const hasActivities = activities.length > 0;
  const hasPosters = posters.length > 0;
  const hasContact = contactInfo !== null;
  const hasSponsors = sponsors.length > 0;
  const hasFeaturePosts = featurePosts.length > 0;
  const scoringEnabled = hasAnyScoringEnabled();

  // Calculate grid layout based on available content
  const getGalleryGridClass = () => {
    if (hasCandidates && hasPosters) return "grid-cols-1 lg:grid-cols-3";
    if (hasCandidates) return "grid-cols-1 lg:grid-cols-2";
    if (hasPosters) return "grid-cols-1";
    return "grid-cols-1";
  };

  // Calculate stats grid class based on number of stats
  const getStatsGridClass = () => {
    const count = stats.length;
    if (count === 1) return "grid-cols-1 max-w-xs mx-auto";
    if (count === 2) return "grid-cols-2 max-w-md mx-auto";
    if (count === 3) return "grid-cols-3 max-w-2xl mx-auto";
    return "grid-cols-2 md:grid-cols-4 max-w-7xl";
  };

  // Handle feature post click - redirect to gallery page
  const handleFeaturePostClick = (postIndex) => {
    // Redirect to gallery page where all posts can be viewed
    window.location.href = `/myevent/${event?.id}/gallery?post=${postIndex}`;
  };

  // Handle feature post download
  const handleFeaturePostDownload = (postIndex, e) => {
    e.stopPropagation();
    const post = featurePosts[postIndex];
    if (post?.downloadable && post.image) {
      const link = document.createElement('a');
      link.href = post.image;
      link.download = `event-post-${postIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle feature post share
  const handleFeaturePostShare = (postIndex, e) => {
    e.stopPropagation();
    const post = featurePosts[postIndex];
    if (post?.shareable && post.image) {
      if (navigator.share) {
        navigator.share({
          title: 'Event Post',
          text: post.caption || 'Check out this event post!',
          url: post.image,
        });
      } else {
        navigator.clipboard.writeText(post.image);
        alert('Image link copied to clipboard!');
      }
    }
  };

  return (
  <>
    {/* Enhanced Schema.org data */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": event.name,
          "description": event.description || event.tagline,
          "image": [
            event.logo,
            event.thumbnail,
            ...(event.hero_sections || []).map(hero => hero.src).filter(Boolean),
            ...(event.main_gallery || []).slice(0, 3).map(g => g.image).filter(Boolean)
          ].filter(Boolean),
          "startDate": event.launch,
          "endDate": event.end_date || event.launch,
          "eventStatus": "https://schema.org/EventScheduled",
          "url": `https://gleedz.com/events/${event.slug}`,
          "location": {
            "@type": "VirtualLocation",
            "url": `https://gleedz.com/events/${event.slug}`
          },
          "organizer": {
            "@type": "Organization",
            "name": "Gleedz",
            "url": "https://gleedz.com"
          },
          "offers": {
            "@type": "Offer",
            "url": `https://gleedz.com/events/${event.slug}`,
            "price": event.reg_fee || "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "validFrom": new Date().toISOString()
          }
        })
      }}
    />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gold-50 text-gray-900">
      {/* Use EventHeader Component */}
      <EventHeader event={event} />
      
      {/* Main Content with padding top for header spacing */}
      <div className="pt-18">
        
        {/* ENHANCED HERO SECTION WITH MOBILE/DESKTOP SUPPORT */}
<section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
  <AnimatePresence mode="wait">
    {heroSlides.map((slide, i) => {
      if (i !== heroIndex) return null;
      const slideSrc = slide.src || slide.url || '';
      
      return slide.type === "video" ? (
        <div key={slide.id || i} className="absolute inset-0">
          <motion.video
            key={slide.id || i}
            src={slideSrc}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            onEnded={handleHeroVideoEnd}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            // Add event listener for video errors
            onError={(e) => {
              console.error("Video error:", e);
              // Fallback to next slide on error
              setTimeout(() => {
                setHeroIndex((i) => (i + 1) % heroSlides.length);
              }, 1000);
            }}
          />
          
          {/* Volume control button - Only show for videos */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const video = e.currentTarget.parentElement.querySelector('video');
              if (video) {
                video.muted = !video.muted;
                e.currentTarget.innerHTML = video.muted ? 
                  '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>' :
                  '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l-2.829 2.829a2 2 0 01-2.829 0L3 6m9 12l-2.829-2.829a2 2 0 00-2.829 0L3 18" /></svg>';
              }
            }}
            className="absolute bottom-16 right-4 z-30 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Toggle volume"
            dangerouslySetInnerHTML={{
              __html: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /></svg>'
            }}
          />
        </div>
      ) : (
        <motion.div
          key={slide.id || i}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image 
            src={slideSrc} 
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

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Hero content */}
          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto z-20 max-w-2xl">
            <motion.div 
              className="text-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 leading-tight drop-shadow-2xl">
                {heroSlides[heroIndex]?.caption || event?.tagline || "Premium Experience"}
              </h1>
              <p className="text-base md:text-xl text-gold-200 font-light mb-4 md:mb-6 drop-shadow-lg">
                {heroSlides[heroIndex]?.tagline || event?.tagline || "An unforgettable celebration of talent and excellence"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {heroSlides[heroIndex]?.cta?.label && (
                  <Link 
                    href={heroSlides[heroIndex].cta.href || '#'} 
                    className="px-3 py-1.5 md:px-4 md:py-2 text-white rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-xs md:text-sm"
                    style={{ 
                      backgroundColor: pageColor,
                      boxShadow: `0 10px 15px -3px ${pageColor}40, 0 4px 6px -4px ${pageColor}40`
                    }}
                  >
                    {heroSlides[heroIndex].cta.label}
                  </Link>
                )}
              </div>
            </motion.div>
          </div>

          {/* Hero navigation */}
          {heroSlides.length > 1 && (
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
        </section>

        {/* ENHANCED STATS SECTION - Horizontal on mobile */}
{stats && stats.length > 0 && (
  <section className="max-w-7xl mx-auto px-4 md:px-8 mt-8 relative z-30">
    <motion.div 
      className="bg-gray-300 rounded-2xl shadow-xl p-3 md:p-6 border border-gold-100/50"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0 }}
    >
      {/* Mobile: Horizontal scroll - HIDDEN SCROLLBAR */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {stats.map((stat, index) => {
          const IconComponent = getIconComponent(stat.icon);
          return (
            <motion.div 
              key={`${stat.title}-${index}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-lg transition-all duration-300 flex-shrink-0 min-w-[120px]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <div 
                className="p-1.5 rounded-lg shadow-md flex-shrink-0"
                style={{ backgroundColor: pageColor }}
              >
                <IconComponent className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-900 leading-tight whitespace-nowrap">
                  {stat.number}
                </div>
                <div className="text-[10px] text-gray-500 font-medium truncate">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop: Grid layout */}
      <div className={`hidden md:grid ${getStatsGridClass()} gap-6`}>
        {stats.map((stat, index) => {
          const IconComponent = getIconComponent(stat.icon);
          return (
            <motion.div 
              key={`${stat.title}-${index}`}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <div 
                className="p-3 rounded-xl shadow-lg flex-shrink-0"
                style={{ backgroundColor: pageColor }}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-gray-900">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-500 font-medium truncate">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add custom scrollbar hide styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Safari and Chrome */
        }
      `}</style>
    </motion.div>
  </section>
)}

        {/* DYNAMIC CONTENT SECTIONS */}
<div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 space-y-12">
  
  {/* ABOUT SECTION - Always show */}
  <section id="about" className="mt-12">
    <motion.div 
      className="text-center mb-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-3">About</h2>
      <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
        {getShortDescription(event?.description)}
      </p>
    </motion.div>
  </section>

  {/* MOBILE: CANDIDATES SECTION - Show after about and before event visuals on mobile */}
  {hasCandidates && (
    <div className="md:hidden">
      <motion.div 
        id="candidates"
        className="bg-gray-300 rounded-2xl shadow-lg p-6 border border-gold-100/50"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Top Candidates</h3>
          <span 
            className="text-sm text-gold-600 font-semibold px-3 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: `${pageColor}15`, color: pageColor }}
          >
            <Crown className="w-3 h-3" />
            {candidates.length} Stars
          </span>
        </div>

        {/* 2-COLUMN GRID FOR CANDIDATES ON ALL SCREENS */}
        <div className="grid grid-cols-2 gap-4">
          {candidates.map((candidate, index) => (
            <motion.div 
              key={candidate.id}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => window.location.href = `/myevent/${event?.id}/candidate/${candidate.id}`}
            >
              <div className="relative p-3">
                {/* Candidate Image and Rank */}
                <div className="relative mb-3">
                  <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    {candidate.photo ? (
                      <Image 
                        src={candidate.photo} 
                        alt={candidate.full_name} 
                        width={200}
                        height={200}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Rank Badge - Only show if scoring is enabled */}
                  {scoringEnabled && (
                    <div 
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold text-white"
                      style={{ backgroundColor: pageColor }}
                    >
                      {index + 1}
                    </div>
                  )}
                </div>
                
                {/* Candidate Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">
                        {getFirstName(candidate.full_name)}
                      </h4>
      
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(candidate.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                    >
                      <Heart 
                        className="w-3 h-3" 
                        fill={favoriteCandidates.has(candidate.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  
                  {/* Points Display - Only show if scoring is enabled and candidate has points_toggle true */}
                  {scoringEnabled && candidate.points_toggle === true && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" style={{ color: pageColor }} />
                        <span className="font-bold text-xs" style={{ color: pageColor }}>
                          {candidate.points?.toLocaleString() || '0'} pts
                        </span>
                      </div>
                      
                      {candidate.contest_number && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border"
                          style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
                        >
                          #{candidate.contest_number}
                        </span>
                      )}
                    </div>
                  )}

                  {/* If no points display, show contest number separately */}
                  {(!scoringEnabled || candidate.points_toggle !== true) && candidate.contest_number && (
                    <div className="flex justify-end">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
                      >
                        #{candidate.contest_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Link 
          href={`/myevent/${event?.id}/vote`}
          className="block mt-6 px-4 py-2 text-center text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm"
          style={{ 
            backgroundColor: pageColor,
            boxShadow: `0 10px 15px -3px ${pageColor}25, 0 4px 6px -4px ${pageColor}25`
          }}
        >
          View All Candidates
        </Link>
      </motion.div>
    </div>
  )}

  {/* GALLERY & VISUALS SECTION */}
{(hasPosters || hasCandidates) && (
  <section id="gallery" className="mt-12">
    <div className={`grid ${getGalleryGridClass()} gap-6`}>
      {/* Main Poster Carousel - Centered when no candidates */}
      {hasPosters && (
        <motion.div 
          className={hasCandidates ? "lg:col-span-2" : "col-span-1 flex justify-center"}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className={`bg-gray-800 rounded-2xl shadow-lg p-6 border border-gold-100/50 ${!hasCandidates ? 'max-w-4xl w-full' : 'w-full'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Event Visuals</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={prevPoster} 
                  className="p-2 rounded-full bg-gold-50 hover:bg-gold-100 transition-colors"
                  style={{ backgroundColor: `${pageColor}15` }}
                >
                  <ChevronLeft className="w-4 h-4 text-gold-600" />
                </button>
                <button 
                  onClick={nextPoster} 
                  className="p-2 rounded-full bg-gold-50 hover:bg-gold-100 transition-colors"
                  style={{ backgroundColor: `${pageColor}15` }}
                >
                  <ChevronRight className="w-4 h-4 text-gold-600" />
                </button>
              </div>
            </div>

            {/* Swipeable Container */}
            <div 
              className="relative rounded-xl overflow-hidden bg-black aspect-video touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                {posters.map((poster, i) => {
                  if (i !== posterIndex) return null;
                  
                  const actualUrl = getSafeUrl(poster);
                  const isVideo = isVideoFile(actualUrl);
                  
                  return isVideo ? (
                    <motion.video
                      key={i}
                      src={actualUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                      onEnded={handlePosterVideoEnd}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <motion.div
                      key={i}
                      className="w-full h-full"
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image 
                        src={actualUrl} 
                        alt={`Event Visual ${i + 1}`} 
                        fill 
                        className="object-cover" 
                        unoptimized 
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Poster indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-1">
                  {posters.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPosterIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === posterIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

              {/* SPONSORS CONTAINER - Added below the poster carousel */}
{hasSponsors && (
  <motion.div 
    className="mt-6"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.4 }}
  >
  
    {/* Reduced height */}
    <div 
      ref={sponsorsRef}
      className="relative overflow-hidden bg-white rounded-xl border border-gold-100/50"
      style={{ height: '80px' }}
    >
      <div className="flex items-center h-full animate-scroll gap-1 py-1"> {/* Reduced gap and padding */}
        {/* Duplicate sponsors for seamless loop */}
        {[...sponsors, ...sponsors].map((sponsor, index) => {
          const actualUrl = getSafeUrl(sponsor);
          const isVideo = isVideoFile(actualUrl);
          
          return (
            <div 
              key={index} 
              className="flex-shrink-0 flex items-center justify-center px-1"
              style={{ minWidth: '140px' }}
            >
              {isVideo ? (
                <video
                  src={actualUrl}
                  className="max-h-12 object-contain rounded-lg"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="relative h-12 w-20"> {/* Reduced dimensions */}
                  <Image 
                    src={actualUrl} 
                    alt={`Sponsor ${index + 1}`}
                    fill
                    className="object-contain rounded-lg"
                    unoptimized
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Gradient overlays for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" /> {/* Reduced width */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" /> {/* Reduced width */}
    </div>
    
    {/* Add custom animation styles */}
    <style jsx>{`
      @keyframes scroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(calc(-140px * ${sponsors.length})); /* Adjusted for new min-width */
        }
      }
      .animate-scroll {
        animation: scroll 30s linear infinite;
      }
      .animate-scroll:hover {
        animation-play-state: paused;
      }
    `}</style>
  </motion.div>
)}
            </div>
          </motion.div>
        )}

        {/* DESKTOP: CANDIDATES SECTION - Only show on desktop alongside event visuals */}
        {hasCandidates && (
          <div className="hidden md:block">
            <motion.div 
              id="candidates"
              className="bg-gray-300 rounded-2xl shadow-lg p-6 border border-gold-100/50"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Top Candidates</h3>
                <span 
                  className="text-sm text-gold-600 font-semibold px-3 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: `${pageColor}15`, color: pageColor }}
                >
                  <Crown className="w-3 h-3" />
                  {candidates.length} Stars
                </span>
              </div>

              {/* 2-COLUMN GRID FOR CANDIDATES ON ALL SCREENS */}
              <div className="grid grid-cols-2 gap-4">
                {candidates.map((candidate, index) => (
                  <motion.div 
                    key={candidate.id}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => window.location.href = `/myevent/${event?.id}/candidate/${candidate.id}`}
                  >
                    <div className="relative p-3">
                      {/* Candidate Image and Rank */}
                      <div className="relative mb-3">
                        <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                          {candidate.photo ? (
                            <Image 
                              src={candidate.photo} 
                              alt={candidate.full_name} 
                              width={200}
                              height={200}
                              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <Users className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                        </div>
                        
                        {/* Rank Badge - Only show if scoring is enabled */}
                        {scoringEnabled && (
                          <div 
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold text-white"
                            style={{ backgroundColor: pageColor }}
                          >
                            {index + 1}
                          </div>
                        )}
                      </div>
                      
                      {/* Candidate Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">
                              {getFirstName(candidate.full_name)}
                            </h4>
                            
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(candidate.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                          >
                            <Heart 
                              className="w-3 h-3" 
                              fill={favoriteCandidates.has(candidate.id) ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                        
                        {/* Points Display - Only show if scoring is enabled and candidate has points_toggle true */}
                        {scoringEnabled && candidate.points_toggle === true && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" style={{ color: pageColor }} />
                              <span className="font-bold text-xs" style={{ color: pageColor }}>
                                {candidate.points?.toLocaleString() || '0'} pts
                              </span>
                            </div>
                            
                            {candidate.contest_number && (
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border"
                                style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
                              >
                                #{candidate.contest_number}
                              </span>
                            )}
                          </div>
                        )}

                        {/* If no points display, show contest number separately */}
                        {(!scoringEnabled || candidate.points_toggle !== true) && candidate.contest_number && (
                          <div className="flex justify-end">
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border"
                              style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
                            >
                              #{candidate.contest_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link 
                href={`/myevent/${event?.id}/vote`}
                className="block mt-6 px-4 py-2 text-center text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm"
                style={{ 
                  backgroundColor: pageColor,
                  boxShadow: `0 10px 15px -3px ${pageColor}25, 0 4px 6px -4px ${pageColor}25`
                }}
              >
                View All Candidates
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )}

  {/* FEATURE POSTS SECTION - New section after event visuals */}
  {hasFeaturePosts && (
    <section id="feature-posts" className="mt-12">
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Featured Posts</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover the latest updates and highlights from our event
        </p>
      </motion.div>

      {/* Desktop: 4-column grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {featurePosts.map((post, index) => (
          <motion.div 
            key={index}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100/50 hover:shadow-xl transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleFeaturePostClick(index)}
          >
            {/* Post Image/Video */}
            <div className="relative h-48 overflow-hidden">
              {isVideoFile(post.image) ? (
                <video
                  src={post.image}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={post.image || '/placeholder-image.jpg'}
                  alt={`Post ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Post Content */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {post.caption || "Check out this amazing post from the event!"}
              </p>
              
              {/* Post Actions */}
<div className="flex items-center justify-end gap-2">
  {post.shareable && (
    <button 
      onClick={(e) => handleFeaturePostShare(index, e)}
      className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
      title="Share"
    >
      <Share2 className="w-4 h-4" />
    </button>
  )}
  
  {post.downloadable && (
    <button 
      onClick={(e) => handleFeaturePostDownload(index, e)}
      className="p-1 text-gray-500 hover:text-green-500 transition-colors"
      title="Download"
    >
      <Download className="w-4 h-4" />
    </button>
  )}
</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile: 2-column grid with 4 posts */}
      <div className="grid md:hidden grid-cols-2 gap-3">
        {featurePosts.slice(0, 4).map((post, index) => (
          <motion.div 
            key={index}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gold-100/50 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleFeaturePostClick(index)}
          >
            {/* Post Image/Video */}
            <div className="relative h-40 overflow-hidden">
              {isVideoFile(post.image) ? (
                <video
                  src={post.image}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={post.image || '/placeholder-image.jpg'}
                  alt={`Post ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              )}
            </div>

            {/* Post Content */}
            <div className="p-3">
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {post.caption || "Check out this amazing post!"}
              </p>
              
              {/* Post Actions */}
<div className="flex items-center justify-end">
  {post.shareable && (
    <button 
      onClick={(e) => handleFeaturePostShare(index, e)}
      className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
      title="Share"
    >
      <Share2 className="w-3 h-3" />
    </button>
  )}
</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      {featurePosts.length > 4 && (
        <div className="text-center mt-6">
          <Link 
            href={`/myevent/${event?.id}/gallery`}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: pageColor,
              boxShadow: `0 10px 15px -3px ${pageColor}40, 0 4px 6px -4px ${pageColor}40`
            }}
          >
            <Images className="w-4 h-4" />
            View All Posts
          </Link>
        </div>
      )}
    </section>
  )}
          {/* NEWS SECTION - Only render if news exist */}
          {hasNews && (
            <section id="news" className="mt-12">
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Latest News</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Stay updated with the latest event news and announcements
                </p>
              </motion.div>

              <div className="flex justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl">
                  {news.slice(0, typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 4).map((newsItem, index) => (
                    <Link
                      key={index}
                      href={`/myevent/${event?.id}/news`}
                    >
                      <motion.div
                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100/50 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {newsItem.image && (
                          <div className="relative h-40 overflow-hidden">
                            <Image
                              src={newsItem.image}
                              alt={newsItem.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">
                            {newsItem.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {getShortContent(newsItem.content)}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{newsItem.author}</span>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{newsItem.views || 0}</span>
                            </div>
                          </div>
                          {newsItem.published_at && (
                            <div className="text-xs text-gray-400 mt-2">
                              {new Date(newsItem.published_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SCHEDULE SECTION - Only render if activities exist */}
          {hasActivities && (
            <section id="schedule" className="mt-12">
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Event Schedule</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Don't miss any of our spectacular events and performances
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((activity, index) => (
                  <Link
                    key={index}
                    href={`/myevent/${event?.id}/schedule`}
                  >
                    <motion.div
                      className="bg-white rounded-2xl shadow-lg p-4 border border-gold-100/50 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {activity.image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                            <Image 
                              src={activity.image} 
                              alt={activity.title} 
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-md font-bold text-gray-900 mb-1">{activity.title}</h3>
                              <p className="text-xs text-gray-600 line-clamp-2">{activity.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              {activity.date && (
                                <>
                                  <div className="text-lg font-bold" style={{ color: pageColor }}>
                                    {new Date(activity.date).getDate()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(activity.date).toLocaleDateString('en-US', { month: 'short' })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            {activity.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.time}
                              </div>
                            )}
                          </div>

                          {/* Countdown Timer */}
                          {activity.countdown_target && (
                            <CountdownTimer targetDate={activity.countdown_target} />
                          )}
                        </div>
                      </div>
                      
                      <button 
                        className="w-full py-2 font-semibold rounded-lg transition-colors group-hover:text-white text-xs"
                        style={{ 
                          backgroundColor: `${pageColor}15`,
                          color: pageColor
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = pageColor;
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = `${pageColor}15`;
                          e.target.style.color = pageColor;
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCalendar(activity);
                        }}
                      >
                        Add to Calendar
                      </button>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ENHANCED FOOTER */}
        <footer className="mt-16 bg-gradient-to-br from-slate-900 to-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  {event?.logo && (
                    <div 
                      className="w-8 h-8 relative rounded-full border-2 overflow-hidden flex items-center justify-center"
                      style={{ borderColor: pageColor }}
                    >
                      <Image 
                        src={event.logo} 
                        alt={event?.name || "Event Logo"} 
                        width={28}
                        height={28}
                        className="rounded-full object-cover"
                        style={{ objectPosition: 'center' }}
                      />
                    </div>
                  )}
                  <span className="text-xl font-bold text-white">{event?.name || "Event"}</span>
                </div>
                <p className="text-gray-400 max-w-md mb-4 text-sm">
                  {getShortDescription(event?.description) || "Creating unforgettable experiences and celebrating excellence through premium events and competitions."}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleShare}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    title="Share Event"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <Link 
                    href={`/myevent/${event?.id}/ticket`}
                    className="px-4 py-2 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                    style={{ backgroundColor: pageColor }}
                  >
                    Get Tickets
                  </Link>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-md mb-3">Quick Links</h4>
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link 
                      key={item.name}
                      href={item.href} 
                      className="block text-gray-400 hover:text-gold-400 transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Contact Section - Only show if contact info exists */}
              {hasContact && (
                <div>
                  <h4 className="font-bold text-md mb-3">Contact</h4>
                  <div className="space-y-3 text-gray-400 text-sm">
                    {contactInfo.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{contactInfo.email}</span>
                      </div>
                    )}
                    {contactInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{contactInfo.phone}</span>
                      </div>
                    )}
                    {contactInfo.officeAddress && (contactInfo.officeAddress.street || contactInfo.officeAddress.city) && (
                      <div className="flex items-start gap-2">
                        <Map className="w-4 h-4 mt-0.5" />
                        <div>
                          {contactInfo.officeAddress.street && <div>{contactInfo.officeAddress.street}</div>}
                          {contactInfo.officeAddress.city && <div>{contactInfo.officeAddress.city}, {contactInfo.officeAddress.state} {contactInfo.officeAddress.zipCode}</div>}
                          {contactInfo.officeAddress.country && <div>{contactInfo.officeAddress.country}</div>}
                        </div>
                      </div>
                    )}
                    {/* Social Media Links */}
                    {contactInfo.socialMedia && (
                      <div className="flex gap-3 mt-3">
                        {contactInfo.socialMedia.twitter && (
                          <a href={contactInfo.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                        {contactInfo.socialMedia.facebook && (
                          <a href={contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Facebook className="w-4 h-4" />
                          </a>
                        )}
                        {contactInfo.socialMedia.instagram && (
                          <a href={contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {contactInfo.socialMedia.linkedin && (
                          <a href={contactInfo.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-white/10 mt-6 pt-6 text-center text-gray-400 text-sm">
              <p>© {new Date().getFullYear()} {event?.name || "Event"}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </>
  );
}