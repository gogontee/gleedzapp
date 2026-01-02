"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Tv,
  UserCircle,
  Star,
  Sparkles,
  Music,
  Award,
  Briefcase,
  Users,
  Church,
  Trophy,
  X,
  Badge,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  LogOut,
  BookOpen,
  Layout,
  Vote,
  Ticket,
  FormInput,
  BarChart3,
  CreditCard,
  Calendar,
  Wallet,
  Shield,
  Zap,
} from "lucide-react";
import Image from "next/image";

// Event tabs configuration with query parameters
const eventTabs = [
  { title: "Pageants", icon: Star, query: "pageant", pageTitle: "All Pageants" },
  { title: "Reality", icon: Sparkles, query: "reality", pageTitle: "Reality Shows" },
  { title: "Concerts", icon: Music, query: "concert", pageTitle: "Concerts" },
  { title: "Awards", icon: Award, query: "award", pageTitle: "Award Shows" },
  { title: "Tv Show", icon: Tv, query: "tv show", pageTitle: "Tv Shows" },
  { title: "Corporate", icon: Briefcase, query: "corporate", pageTitle: "Corporate Events" },
  { title: "Talent", icon: Users, query: "talent", pageTitle: "Talent Shows" },
  { title: "Faith", icon: Church, query: "faith", pageTitle: "Faith Events" },
  { title: "Sports", icon: Trophy, query: "sports", pageTitle: "Sports Events" },
  { title: "Others", icon: Badge, query: "others", pageTitle: "Other Events" },
];

// Social media links
const socialMedia = [
  { icon: Instagram, href: "https://instagram.com/gleedz", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/gleedz", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/gleedz", label: "X (Twitter)" },
];

// Features data
const features = [
  {
    icon: Layout,
    title: "WebApp Event Pages",
    description: "Professional event pages with customizable headers and navigation"
  },
  {
    icon: Vote,
    title: "Smart Voting System",
    description: "Free & paid voting with direct wallet integration"
  },
  {
    icon: Ticket,
    title: "Ticket Sales Portal",
    description: "Customizable ticket sales with multiple pricing tiers"
  },
  {
    icon: FormInput,
    title: "Registration Forms",
    description: "Up to 3 customizable forms per event"
  },
  {
    icon: Award,
    title: "Award Portal",
    description: "Dedicated system for competitions and contests"
  },
  {
    icon: BarChart3,
    title: "Smart Dashboards",
    description: "Real-time analytics for publishers and fans"
  }
];

export default function HomeClient({ logoUrl, posters }) {
  const [currentPoster, setCurrentPoster] = useState(0);
  const videoRef = useRef(null);
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [topEvents, setTopEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState([]);
  const [currentHero, setCurrentHero] = useState(0);
  const [direction, setDirection] = useState("right"); // Track slide direction
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    message: "",
    rating: 5
  });
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showPublisherModal, setShowPublisherModal] = useState(false);
  const slideIntervalRef = useRef(null);

  // FIXED: Better cache busting that works with hydration
  const getCacheBustedUrl = (url, isClient = false) => {
    if (!url) return url;
    if (url.endsWith('.mp4') || url.includes('.mp4')) {
      return `${url}?v=1`; // Fixed version instead of timestamp
    }
    return url;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogoutDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch testimonials - UPDATED: Only fetch featured testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, avatar_url, message, rating, created_at")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) {
          console.error("Error fetching testimonials:", error);
          return;
        }

        setTestimonials(data || []);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      }
    };

    fetchTestimonials();
  }, []);

  // Fetch hero slides from gleedz_hero column
  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const { data, error } = await supabase
          .from("gleedz_hero")
          .select("hero")
          .single();

        if (error) {
          console.error("Error fetching hero slides:", error);
          // Fallback to default slides if error
          setHeroSlides([
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero5.jpg",
              type: "image",
              caption: "Publish your event on Gleedz",
              tagline: "Create amazing events with our platform",
              cta: { label: "Create Event", href: "/create-event" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero7.jpg",
              type: "image",
              caption: "Explore Top Events",
              tagline: "Discover the best events around you",
              cta: { label: "Explore Events", href: "/events" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero4.jpg",
              type: "image",
              caption: "Get your premium tickets now",
              tagline: "Secure your spot at exclusive events",
              cta: { label: "Buy Tickets", href: "/tickets" },
            },
          ]);
          return;
        }

        if (data && data.hero) {
          const transformedSlides = data.hero.map(slide => ({
            ...slide,
            isVideo: slide.type === "video"
          }));
          setHeroSlides(transformedSlides);
        } else {
          setHeroSlides([
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero5.jpg",
              type: "image",
              caption: "Publish your event on Gleedz",
              tagline: "Create amazing events with our platform",
              cta: { label: "Create Event", href: "/create-event" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero7.jpg",
              type: "image",
              caption: "Explore Top Events",
              tagline: "Discover the best events around you",
              cta: { label: "Explore Events", href: "/events" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero4.jpg",
              type: "image",
              caption: "Get your premium tickets now",
              tagline: "Secure your spot at exclusive events",
              cta: { label: "Buy Tickets", href: "/tickets" },
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching hero slides:", error);
        setHeroSlides([
          {
            src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero5.jpg",
            type: "image",
            caption: "Publish your event on Gleedz",
            tagline: "Create amazing events with our platform",
            cta: { label: "Create Event", href: "/create-event" },
          },
          {
            src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero7.jpg",
            type: "image",
            caption: "Explore Top Events",
            tagline: "Discover the best events around you",
            cta: { label: "Explore Events", href: "/events" },
          },
          {
            src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero4.jpg",
            type: "image",
            caption: "Get your premium tickets now",
            tagline: "Secure your spot at exclusive events",
            cta: { label: "Buy Tickets", href: "/tickets" },
          },
        ]);
      }
    };

    fetchHeroSlides();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: user } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", session.user.id)
          .single();

        if (user.role === "publisher") {
          const { data: publisher } = await supabase
            .from("publishers")
            .select("id, avatar_url, name")
            .eq("id", user.id)
            .single();
          setUserData({ ...user, ...publisher });
        } else if (user.role === "fans") {
          const { data: fan } = await supabase
            .from("fans")
            .select("id, avatar_url, full_name")
            .eq("id", user.id)
            .single();
          setUserData({ ...user, ...fan });
        } else if (user.role === "admin") {
          const { data: admin } = await supabase
            .from("admins")
            .select("id, avatar_url, full_name")
            .eq("id", user.id)
            .single();
          setUserData({ ...user, ...admin });
        }
      }
    };

    fetchUserData();
  }, []);

  // Fetch top events
  useEffect(() => {
    const fetchTopEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("launch", true)
          .eq("active", true)
          .not("promote", "is", null)
          .order("promote", { ascending: false })
          .limit(6);

        if (error) {
          console.error("Error fetching top events:", error);
          return;
        }

        setTopEvents(data || []);
      } catch (error) {
        console.error("Error fetching top events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopEvents();
  }, []);

  // Auto change hero slides with slide animation and doubled duration (12 seconds)
  useEffect(() => {
    if (heroSlides.length === 0) return;
    
    const startSlideShow = () => {
      slideIntervalRef.current = setInterval(() => {
        setDirection("right");
        setCurrentHero((prev) => (prev + 1) % heroSlides.length);
      }, 12000); // Doubled from 6 seconds to 12 seconds
    };

    const stopSlideShow = () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
        slideIntervalRef.current = null;
      }
    };

    const currentSlide = heroSlides[currentHero];
    
    if (currentSlide && currentSlide.type === "video") {
      stopSlideShow();
      return;
    } else {
      startSlideShow();
    }
    
    return () => {
      stopSlideShow();
    };
  }, [currentHero, heroSlides]);

  // Handle slide navigation
  const goToSlide = (index) => {
    if (index === currentHero) return;
    
    setDirection(index > currentHero ? "right" : "left");
    setCurrentHero(index);
  };

  // Handle next slide
  const nextSlide = () => {
    setDirection("right");
    setCurrentHero((prev) => (prev + 1) % heroSlides.length);
  };

  // Handle previous slide
  const prevSlide = () => {
    setDirection("left");
    setCurrentHero((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Handle hero slide click (image or video)
  const handleHeroClick = (slide) => {
    if (slide.cta && slide.cta.href) {
      router.push(slide.cta.href);
    }
  };

  // Handle video end for hero slides
  const handleVideoEnd = () => {
    setDirection("right");
    setCurrentHero((prev) => (prev + 1) % heroSlides.length);
  };

  // Updated poster rotation logic
  useEffect(() => {
    if (posters.length === 0) return;

    const current = posters[currentPoster];
    const isVideo = current.url.endsWith(".mp4");

    let timer;

    if (isVideo) {
      const handleVideoEnd = () => {
        setCurrentPoster((prev) => (prev + 1) % posters.length);
      };

      const videoElement = document.querySelector(`video[src="${getCacheBustedUrl(current.url)}"]`);
      if (videoElement) {
        videoElement.addEventListener('ended', handleVideoEnd);
        
        timer = setTimeout(() => {
          videoElement.removeEventListener('ended', handleVideoEnd);
          setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 30000);

        return () => {
          videoElement.removeEventListener('ended', handleVideoEnd);
          if (timer) clearTimeout(timer);
        };
      } else {
        timer = setTimeout(() => {
          setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 10000);
      }
    } else {
      timer = setTimeout(() => {
        setCurrentPoster((prev) => (prev + 1) % posters.length);
      }, 8000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentPoster, posters]);

  // Handle event tab click
  const handleEventTabClick = (tab) => {
    router.push(`/eventz?type=${encodeURIComponent(tab.query)}`);
  };

  const handleUserClick = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setShowLogoutDropdown(!showLogoutDropdown);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        alert("Error signing out. Please try again.");
        return;
      }
      
      setSession(null);
      setUserData(null);
      setShowLogoutDropdown(false);
      router.refresh();
      
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out. Please try again.");
    }
  };

  const handleEventMall = () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    router.push("/events/mall");
  };

  const handlePublisherLogin = () => {
    setShowPublisherModal(false);
    router.push("/login");
  };

  const handleCancelPublisher = () => {
    setShowPublisherModal(false);
  };

  const handleDashboardClick = () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    if (userData?.role === "publisher") {
      router.push(`/publisherdashboard/${userData.id}`);
    } else if (userData?.role === "fans") {
      router.push(`/fansdashboard/${userData.id}`);
    } else if (userData?.role === "admin") {
      router.push(`/admindashboard/${userData.id}`);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleProceedToLogin = () => {
    setShowLoginModal(false);
    router.push("/login");
  };

  const handleCancelLogin = () => {
    setShowLoginModal(false);
  };

  // Handle testimonial submission
  const handleSubmitTestimonial = async () => {
    if (!session || !userData) {
      setShowLoginModal(true);
      return;
    }

    if (!testimonialForm.message.trim()) {
      alert("Please enter your testimonial message");
      return;
    }

    setSubmittingTestimonial(true);

    try {
      const firstName = userData.full_name ? userData.full_name.split(' ')[0] : 'User';
      
      const { data, error } = await supabase
        .from("testimonials")
        .insert([
          {
            user_id: userData.id,
            name: firstName,
            avatar_url: userData.avatar_url,
            message: testimonialForm.message.trim(),
            rating: testimonialForm.rating,
            featured: false
          }
        ])
        .select();

      if (error) {
        console.error("Error submitting testimonial:", error);
        alert("Failed to submit testimonial. Please try again.");
        return;
      }

      const { data: newTestimonials } = await supabase
        .from("testimonials")
        .select("id, name, avatar_url, message, rating, created_at")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(6);

      setTestimonials(newTestimonials || []);
      setTestimonialForm({ message: "", rating: 5 });
      setShowTestimonialModal(false);
      alert("Thank you for your testimonial! It will be reviewed before being featured.");
      
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      alert("Failed to submit testimonial. Please try again.");
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex justify-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gold-50 via-white to-gold-50 text-gray-900">
      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Login Required</h3>
                <button
                  onClick={handleCancelLogin}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                You need to login to your dashboard to publish events. Would you like to proceed to login?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelLogin}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToLogin}
                  className="flex-1 py-3 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200 font-semibold"
                >
                  Proceed to Login
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonial Modal */}
      <AnimatePresence>
        {showTestimonialModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add Testimonial</h3>
                <button
                  onClick={() => setShowTestimonialModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTestimonialForm(prev => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={star <= testimonialForm.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Testimonial
                </label>
                <textarea
                  value={testimonialForm.message}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Share your experience with Gleedz..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {testimonialForm.message.length}/500
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTestimonialModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTestimonial}
                  disabled={submittingTestimonial || !testimonialForm.message.trim()}
                  className="flex-1 py-3 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                >
                  {submittingTestimonial ? "Submitting..." : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPublisherModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full shadow-xl mx-4"
            >
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Publisher Account Required</h3>
                <button
                  onClick={handleCancelPublisher}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} className="md:w-6 md:h-6" />
                </button>
              </div>
              
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                Please kindly log into your publisher dashboard to create events. 
                If you don't have a publisher account, create one for free.
              </p>
              
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={handleCancelPublisher}
                  className="flex-1 py-2 md:py-2.5 px-3 md:px-4 border border-gray-300 text-gray-700 rounded-lg md:rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublisherLogin}
                  className="flex-1 py-2 md:py-2.5 px-3 md:px-4 bg-yellow-500 text-white rounded-lg md:rounded-xl hover:bg-yellow-600 transition-all duration-200 font-semibold text-sm md:text-base"
                >
                  Log into Publisher Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative w-full flex items-center justify-center overflow-hidden rounded-b-[2rem] shadow-xl bg-black">
        <div className="w-full aspect-[2/1] md:aspect-auto md:h-[70vh] overflow-hidden relative">
          {heroSlides.map((slide, idx) => {
            const isActive = idx === currentHero;
            const isPrev = idx === (currentHero - 1 + heroSlides.length) % heroSlides.length;
            const isNext = idx === (currentHero + 1) % heroSlides.length;
            
            let xPosition = "100%";
            if (isActive) xPosition = "0%";
            else if (isPrev) xPosition = "-100%";
            
            return (
              <motion.div
                key={idx}
                className="absolute inset-0 w-full h-full cursor-pointer"
                initial={false}
                animate={{ 
                  x: xPosition,
                  transition: {
                    duration: 1,
                    ease: "easeInOut"
                  }
                }}
                onClick={() => handleHeroClick(slide)}
              >
                {slide.type === "video" ? (
                  <video
                    src={getCacheBustedUrl(slide.src)}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    onEnded={handleVideoEnd}
                    onError={(e) => {
                      console.error('Video failed to load:', slide.src);
                      handleVideoEnd();
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full">
                    <Image
                      src={slide.src}
                      alt={`Hero ${idx}`}
                      fill
                      className="object-cover"
                      unoptimized
                      priority={isActive}
                    />
                  </div>
                )}
                
                {/* CTA Overlay - Always visible on active slide */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 text-center text-white px-4 z-20 w-full max-w-xs md:max-w-none"
                  >
                    {slide.caption && (
                      <h2 className="text-xs md:text-xl lg:text-2xl font-bold drop-shadow-lg mb-1 md:mb-2 px-2">
                        {slide.caption}
                      </h2>
                    )}
                    
                    {slide.tagline && (
                      <p className="text-xs md:text-base lg:text-lg drop-shadow-lg mb-2 md:mb-3 px-2">
                        {slide.tagline}
                      </p>
                    )}
                    
                    {slide.cta && slide.cta.label && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (slide.cta && slide.cta.href) {
                            router.push(slide.cta.href);
                          }
                        }}
                        className="inline-block px-3 py-1 md:px-4 md:py-2 bg-yellow-600 hover:bg-yellow-700 rounded-full shadow-lg font-semibold transition text-xs md:text-sm cursor-pointer"
                      >
                        {slide.cta.label}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          
          {/* Navigation Dots */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-20 md:bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentHero 
                      ? 'bg-yellow-500 scale-125' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Navigation Arrows */}
          {heroSlides.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200 hidden md:block"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200 hidden md:block"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Top Bar */}
        <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 flex items-center justify-between z-40">
          {/* Logo */}
          {logoUrl ? (
            <div className="relative w-15 h-8 md:w-20 md:h-10">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="rounded-lg object-contain"
                unoptimized
                priority
              />
            </div>
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gold-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
              G
            </div>
          )}

          {/* Right side icons */}
          <div className="flex gap-2 md:gap-4 items-center">
            <Link href="/gleedztv" className="text-white hover:scale-110 transition">
              <Tv className="w-5 h-5 md:w-6 md:h-6 cursor-pointer" />
            </Link>

            <button 
              onClick={() => router.push("/gleedz")}
              className="text-white hover:scale-110 transition"
            >
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 cursor-pointer" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <div
                className="cursor-pointer hover:scale-110 transition flex items-center justify-center"
                onClick={handleUserClick}
                onMouseEnter={() => session && setShowLogoutDropdown(true)}
              >
                {!session ? (
                  <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                ) : userData?.avatar_url ? (
                  <div className="relative w-6 h-6 md:w-8 md:h-8">
                    <Image
                      src={userData.avatar_url}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover border border-white"
                      unoptimized
                    />
                  </div>
                ) : (
                  <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </div>

              <AnimatePresence>
                {showLogoutDropdown && session && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-8 md:top-10 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    onMouseLeave={() => setShowLogoutDropdown(false)}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {userData?.avatar_url ? (
                          <div className="relative w-8 h-8">
                            <Image
                              src={userData.avatar_url}
                              alt="Profile"
                              fill
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <UserCircle size={32} className="text-gray-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {userData?.full_name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-3">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Text below hero with Social Media Icons */}
      <div className="relative mt-4 md:mt-6 px-4 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex gap-3 md:gap-4">
            {socialMedia.map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-yellow-600 hover:text-yellow-700 transition-colors"
                aria-label={social.label}
              >
                <social.icon size={20} className="md:w-6 md:h-6" />
              </motion.a>
            ))}
          </div>

          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-700 text-center mt-2 md:mt-0">
            Your Hub for Premium Events
          </h2>

          <div className="hidden md:block w-24"></div>
        </div>
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto mt-8 md:mt-12 px-4 md:px-8">
        {/* Mobile Sidebar - HIDDEN ON MOBILE, SHOWN ON DESKTOP */}
        <aside className="hidden md:block md:col-span-3">
          <div className="sticky top-24 space-y-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleEventMall}
              className="w-full bg-yellow-700 text-white py-3 px-4 rounded-2xl shadow-lg font-semibold tracking-wide text-sm"
            >
              Events Mall
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleDashboardClick}
              className="w-full bg-yellow-500 text-white py-3 px-4 rounded-2xl shadow-lg font-semibold tracking-wide text-sm"
            >
              Dashboard
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push("/events")}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-2xl shadow-lg font-semibold tracking-wide text-sm"
            >
              All Event
            </motion.button>

            {/* Poster Display */}
            {posters.length > 0 && (
              <div className="mt-0">
                <h3 className="text-white font-semibold mb-2 text-sm">Featured Poster</h3>
                <div className="w-full aspect-[4/8] rounded-xl overflow-hidden shadow-xl bg-gray-900 relative">
                  {posters.map((poster, idx) => {
                    if (idx !== currentPoster) return null;
                    const isVideo = poster.url.endsWith(".mp4");
                    return (
                      <a
                        key={poster.name}
                        href={poster.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-full block"
                      >
                        {isVideo ? (
                          <video
                            src={getCacheBustedUrl(poster.url)}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            onEnded={() => setCurrentPoster((prev) => (prev + 1) % posters.length)}
                            onError={(e) => {
                              console.error('Poster video failed to load:', poster.url);
                              setCurrentPoster((prev) => (prev + 1) % posters.length);
                            }}
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <Image
                              src={poster.url}
                              alt={poster.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-9">
          {/* Event Tabs */}
          <div className="md:flex md:gap-4 md:overflow-x-auto md:pb-3">
            <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
              {eventTabs.map((tab, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleEventTabClick(tab)}
                  className="glass rounded-xl md:rounded-2xl p-2 md:p-4 cursor-pointer text-center hover:shadow-lg transition-all duration-200"
                >
                  <tab.icon className="mx-auto text-yellow-600 w-4 h-4 md:w-6 md:h-6" />
                  <h3 className="mt-1 text-xs md:text-sm font-bold text-yellow-800 truncate">
                    {tab.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Top Events Section */}
          <section className="mt-8 md:mt-10">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-yellow-800">
              Top Events
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                  <div key={skeleton} className="glass rounded-2xl p-4 md:p-5 animate-pulse">
                    <div className="h-32 md:h-40 lg:h-48 bg-gray-300 rounded-xl mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : topEvents.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {topEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.03 }}
                    className="glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    {/* Event Banner */}
                    {event.thumbnail && (
                      <div className="relative h-32 md:h-40 lg:h-48 w-full">
                        <Image
                          src={event.thumbnail}
                          alt={`${event.name} banner`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    {/* Event Content */}
                    <div className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          {event.logo && (
                            <div className="w-8 h-8 md:w-10 md:h-10 relative">
                              <Image
                                src={event.logo}
                                alt={`${event.name} logo`}
                                width={32}
                                height={32}
                                className="object-contain rounded-[12px] md:rounded-[15px]"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-1 md:line-clamp-none md:whitespace-normal md:break-words">
                              {event.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 leading-relaxed mb-3 md:mb-4 line-clamp-2 text-sm md:text-base">
                        {event.description || "Join us for an unforgettable experience filled with excitement and entertainment."}
                      </p>

                      <div className="flex items-center justify-between">
                        <Link href={`/myevent/${event.id}`}>
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="px-3 py-1 md:px-6 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-xxs md:text-base"
  >
    View Event
  </motion.button>
</Link>
                        
                        <span 
                          className="inline-block px-2 py-1 rounded-full text-xs font-semibold border"
                          style={{ 
                            backgroundColor: `${event.page_color || '#f59e0b'}15`,
                            borderColor: event.page_color || '#f59e0b',
                            color: event.page_color || '#f59e0b'
                          }}
                        >
                          {event.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 glass rounded-2xl">
                <p className="text-gray-600 text-base md:text-lg">No promoted events found.</p>
                <p className="text-gray-500 mt-2 text-sm md:text-base">Check back later for featured events!</p>
              </div>
            )}
          </section>

          {/* Features Section */}
          <section className="mt-12 md:mt-16">
            <div className="text-center mb-6 md:mb-12">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-800 mb-3 md:mb-4">
                Powerful Event Features
              </h2>
              <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                Everything you need to create outstanding event experiences, all in one platform
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-yellow-500 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-3 h-3 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <h3 className="text-sm md:text-lg lg:text-xl font-bold text-gray-900 mb-1 md:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm lg:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Testimonials */}
          <section className="mt-12 md:mt-16">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-3">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-800">
                What People Say
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!session) {
                    setShowLoginModal(true);
                  } else {
                    setShowTestimonialModal(true);
                  }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base w-full sm:w-auto"
              >
                <Plus size={16} className="md:w-5 md:h-5" />
                Add Testimony
              </motion.button>
            </div>
            
            {testimonials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {testimonials.map((testimonial) => (
                  <motion.div
                    key={testimonial.id}
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col h-full"
                  >
                    {renderStars(testimonial.rating)}
                    <p className="text-gray-700 italic text-xs md:text-sm lg:text-base mb-3 md:mb-4 flex-grow">
                      "{testimonial.message}"
                    </p>
                    <div className="flex items-center gap-2 md:gap-3 mt-auto">
                      {testimonial.avatar_url ? (
                        <div className="relative w-8 h-8 md:w-10 md:h-10">
                          <Image
                            src={testimonial.avatar_url}
                            alt={testimonial.name}
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <UserCircle size={32} className="text-gray-400 w-8 h-8 md:w-10 md:h-10" />
                      )}
                      <span className="font-semibold text-yellow-700 text-sm md:text-base">
                        {testimonial.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 glass rounded-2xl">
                <p className="text-gray-600 text-base md:text-lg">No featured testimonials yet.</p>
                <p className="text-gray-500 mt-2 text-sm md:text-base">Be the first to share your experience!</p>
                <button
                  onClick={() => {
                    if (!session) {
                      setShowLoginModal(true);
                    } else {
                      setShowTestimonialModal(true);
                    }
                  }}
                  className="mt-3 md:mt-4 px-4 py-2 md:px-6 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 text-sm md:text-base"
                >
                  Add First Testimonial
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-40">
        <div className="flex justify-around items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleEventMall}
            className="flex flex-col items-center gap-1 p-2 text-yellow-700"
          >
            <Trophy size={20} />
            <span className="text-xs font-medium">Events Mall</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDashboardClick}
            className="flex flex-col items-center gap-1 p-2 text-yellow-700"
          >
            <Layout size={20} />
            <span className="text-xs font-medium">Dashboard</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/events")}
            className="flex flex-col items-center gap-1 p-2 text-yellow-700"
          >
            <Calendar size={20} />
            <span className="text-xs font-medium">All Events</span>
          </motion.button>
        </div>
      </div>

      {/* Add padding to bottom for mobile nav */}
      <div className="pb-16 md:pb-0"></div>
    </div>
  );
}