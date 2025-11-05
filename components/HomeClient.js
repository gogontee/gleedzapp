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
  // ADDED: Feature icons
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
          .eq("featured", true) // UPDATED: Only fetch featured testimonials
          .order("created_at", { ascending: false })
          .limit(6); // Limit to 6 testimonials

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

  // Fetch hero slides from gleedz.hero column
  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const { data, error } = await supabase
          .from("gleedz_hero")
          .select("hero")
          .single();

        if (error) {
          console.error("Error fetching hero slides:", error);
          setHeroSlides([
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero5.jpg",
              isVideo: false,
              heading: "Publish your event on Gleedz",
              button: { label: "Create Event", href: "/create-event" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero7.jpg",
              isVideo: false,
              heading: "Explore Top Events",
              button: { label: "Explore Events", href: "/events" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero4.jpg",
              isVideo: false,
              heading: "Get your premium tickets now",
              button: { label: "Buy Tickets", href: "/tickets" },
            },
          ]);
          return;
        }

        if (data && data.hero) {
          const transformedSlides = data.hero.map(slide => ({
            ...slide,
            isVideo: slide.src ? slide.src.endsWith(".mp4") : false
          }));
          setHeroSlides(transformedSlides);
        } else {
          setHeroSlides([
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero5.jpg",
              isVideo: false,
              heading: "Publish your event on Gleedz",
              button: { label: "Create Event", href: "/create-event" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero7.jpg",
              isVideo: false,
              heading: "Explore Top Events",
              button: { label: "Explore Events", href: "/events" },
            },
            {
              src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero4.jpg",
              isVideo: false,
              heading: "Get your premium tickets now",
              button: { label: "Buy Tickets", href: "/tickets" },
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching hero slides:", error);
        setHeroSlides([
          {
            src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero5.jpg",
            isVideo: false,
            heading: "Publish your event on Gleedz",
            button: { label: "Create Event", href: "/create-event" },
          },
          {
            src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero7.jpg",
            isVideo: false,
            heading: "Explore Top Events",
            button: { label: "Explore Events", href: "/events" },
          },
          {
            src: "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/heros/hero4.jpg",
            isVideo: false,
            heading: "Get your premium tickets now",
            button: { label: "Buy Tickets", href: "/tickets" },
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
            .select("id, avatar_url, full_name")
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

  // Fetch top events - UPDATED: Only fetch active events and limit to 6
  useEffect(() => {
    const fetchTopEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("launch", true)
          .eq("active", true) // UPDATED: Only fetch active events
          .not("promote", "is", null)
          .order("promote", { ascending: false })
          .limit(6); // UPDATED: Limit to 6 events

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

  // Auto change hero slides
  useEffect(() => {
    if (heroSlides.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Updated poster rotation logic
  useEffect(() => {
    if (posters.length === 0) return;

    const current = posters[currentPoster];
    const isVideo = current.url.endsWith(".mp4");

    let timer;

    if (isVideo) {
      // For videos, wait for the video to end
      const handleVideoEnd = () => {
        setCurrentPoster((prev) => (prev + 1) % posters.length);
      };

      // Add event listener to the video element
      const videoElement = document.querySelector(`video[src="${current.url}"]`);
      if (videoElement) {
        videoElement.addEventListener('ended', handleVideoEnd);
        
        // Fallback: if video doesn't end within 30 seconds, move to next
        timer = setTimeout(() => {
          videoElement.removeEventListener('ended', handleVideoEnd);
          setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 30000);

        return () => {
          videoElement.removeEventListener('ended', handleVideoEnd);
          if (timer) clearTimeout(timer);
        };
      } else {
        // If video element not found, use fallback duration
        timer = setTimeout(() => {
          setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 10000);
      }
    } else {
      // For images, use the fixed duration
      timer = setTimeout(() => {
        setCurrentPoster((prev) => (prev + 1) % posters.length);
      }, 8000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentPoster, posters]);

  // Handle event tab click - ADDED MISSING FUNCTION
  const handleEventTabClick = (tab) => {
    // Navigate to /eventz with the query parameter for event type
    router.push(`/eventz?type=${encodeURIComponent(tab.query)}`);
  };

  const handleUserClick = () => {
    if (!session) {
      router.push("/login");
      return;
    }

    // Toggle logout dropdown for logged-in users
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
      
      // Clear local state
      setSession(null);
      setUserData(null);
      setShowLogoutDropdown(false);
      
      // Refresh the page to update the UI
      router.refresh();
      
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out. Please try again.");
    }
  };

  const [showPublisherModal, setShowPublisherModal] = useState(false);

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

  // NEW: Handle dashboard navigation based on user role
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
      // You can add admin dashboard route here if needed
      router.push(`/admindashboard/${userData.id}`);
    } else {
      // Fallback for unknown roles
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
      // Get first name from full_name
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
            featured: false // New testimonials are not featured by default
          }
        ])
        .select();

      if (error) {
        console.error("Error submitting testimonial:", error);
        alert("Failed to submit testimonial. Please try again.");
        return;
      }

      // Refresh testimonials - UPDATED: Only fetch featured testimonials
      const { data: newTestimonials } = await supabase
        .from("testimonials")
        .select("id, name, avatar_url, message, rating, created_at")
        .eq("featured", true) // UPDATED: Only fetch featured testimonials
        .order("created_at", { ascending: false })
        .limit(6);

      setTestimonials(newTestimonials || []);
      
      // Reset form and close modal
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
      <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center overflow-hidden rounded-b-[2rem] shadow-xl bg-black">
        {/* Background slideshow */}
        <AnimatePresence mode="wait">
          {heroSlides.map((slide, idx) =>
            idx === currentHero ? (
              slide.isVideo ? (
                <motion.video
                  key={idx}
                  src={slide.src}
                  autoPlay
                  muted
                  playsInline
                  loop
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              ) : (
                <motion.div
                  key={idx}
                  className="absolute inset-0 w-full h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <Image
                    src={slide.src}
                    alt={`Hero ${idx}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </motion.div>
              )
            ) : null
          )}
        </AnimatePresence>

        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo"
              width={80}
              height={40}
              className="rounded-lg object-contain"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gold-600 flex items-center justify-center text-white font-bold">
              G
            </div>
          )}

          {/* Right side: TV + BookOpen + UserCircle/Profile with Logout Dropdown */}
          <div className="flex gap-4 items-center">
            {/* TV Icon */}
            <Link href="/gleedztv" className="text-white hover:scale-110 transition">
              <Tv className="w-6 h-6 cursor-pointer" />
            </Link>

            {/* ADDED: BookOpen Icon */}
            <button 
              onClick={() => router.push("/gleedz")}
              className="text-white hover:scale-110 transition"
            >
              <BookOpen className="w-6 h-6 cursor-pointer" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <div
                className="cursor-pointer hover:scale-110 transition"
                onClick={handleUserClick}
                onMouseEnter={() => session && setShowLogoutDropdown(true)}
              >
                {!session ? (
                  <UserCircle className="w-6 h-6 text-white" />
                ) : userData?.avatar_url ? (
                  <Image
                    src={userData.avatar_url}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Logout Dropdown */}
              <AnimatePresence>
                {showLogoutDropdown && session && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    onMouseLeave={() => setShowLogoutDropdown(false)}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {userData?.avatar_url ? (
                          <Image
                            src={userData.avatar_url}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
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

        {/* Call to Action */}
        <AnimatePresence mode="wait">
          {heroSlides.map((slide, idx) =>
            idx === currentHero ? (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.8 }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center text-white px-4 z-20"
              >
                <h2 className="text-2xl md:text-4xl font-bold drop-shadow-lg mb-3">
                  {slide.heading}
                </h2>
                <Link
                  href={slide.button.href}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-full shadow-lg font-semibold transition"
                >
                  {slide.button.label}
                </Link>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </section>

      {/* Text below hero with Social Media Icons */}
      <div className="relative mt-6 px-8 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Social Media Icons - Left side */}
          <div className="flex gap-4">
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
                <social.icon size={24} />
              </motion.a>
            ))}
          </div>

          {/* Heading - Center */}
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-700 text-center">
            Your Hub for Premium Events
          </h2>

          {/* Empty div for balance on larger screens */}
          <div className="hidden md:block w-24"></div>
        </div>
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto mt-12 px-4 md:px-8">
        {/* Sidebar - Updated with sticky behavior */}
        <aside className="hidden md:block md:col-span-3">
          <div className="sticky top-24 space-y-4">
            {/* Events Mall */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleEventMall}
              className="w-full bg-yellow-700 text-white py-3 px-4 rounded-2xl shadow-lg font-semibold tracking-wide text-sm"
            >
              Events Mall
            </motion.button>

            {/* Dashboard Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleDashboardClick}
              className="w-full bg-yellow-500 text-white py-3 px-4 rounded-2xl shadow-lg font-semibold tracking-wide text-sm"
            >
              Dashboard
            </motion.button>

            {/* All Event Button */}
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
                <div className="w-full aspect-[4/8] rounded-xl overflow-hidden shadow-xl bg-gray-900 flex items-center justify-center relative">
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
                            src={poster.url}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            onEnded={() => setCurrentPoster((prev) => (prev + 1) % posters.length)}
                          />
                        ) : (
                          <Image
                            src={poster.url}
                            alt={poster.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
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
            <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
              {eventTabs.map((tab, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleEventTabClick(tab)}
                  className="glass rounded-xl md:rounded-2xl p-3 md:p-4 cursor-pointer text-center hover:shadow-lg transition-all duration-200"
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
          <section className="mt-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-yellow-800">
              Top Events
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                  <div key={skeleton} className="glass rounded-2xl p-5 animate-pulse">
                    <div className="h-40 md:h-48 bg-gray-300 rounded-xl mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : topEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.03 }}
                    className="glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    {/* Event Banner */}
                    {event.thumbnail && (
                      <div className="relative h-40 md:h-48 w-full">
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
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {event.logo && (
                            <div className="w-10 h-10 relative">
                              <Image
                                src={event.logo}
                                alt={`${event.name} logo`}
                                width={40}
                                height={40}
                                className="object-contain rounded-[15px]"
                                unoptimized
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {event.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                        {event.description || "Join us for an unforgettable experience filled with excitement and entertainment."}
                      </p>

                      <div className="flex items-center justify-between">
                        <Link href={`/myevent/${event.id}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            View Event
                          </motion.button>
                        </Link>
                        
                        {/* Event Type Tag */}
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-sm font-semibold border"
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
              <div className="text-center py-12 glass rounded-2xl">
                <p className="text-gray-600 text-lg">No promoted events found.</p>
                <p className="text-gray-500 mt-2">Check back later for featured events!</p>
              </div>
            )}
          </section>

          {/* ADDED: Features Section */}
          <section className="mt-16">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-800 mb-4">
                Powerful Event Features
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to create outstanding event experiences, all in one platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Testimonials */}
          <section className="mt-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-yellow-800">
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
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add Testimony
              </motion.button>
            </div>
            
            {testimonials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial) => (
                  <motion.div
                    key={testimonial.id}
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-xl md:rounded-2xl p-6 flex flex-col h-full"
                  >
                    {renderStars(testimonial.rating)}
                    <p className="text-gray-700 italic text-sm md:text-base mb-4 flex-grow">
                      "{testimonial.message}"
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      {testimonial.avatar_url ? (
                        <Image
                          src={testimonial.avatar_url}
                          alt={testimonial.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <UserCircle size={40} className="text-gray-400" />
                      )}
                      <span className="font-semibold text-yellow-700 text-sm md:text-base">
                        {testimonial.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass rounded-2xl">
                <p className="text-gray-600 text-lg">No featured testimonials yet.</p>
                <p className="text-gray-500 mt-2">Be the first to share your experience!</p>
                <button
                  onClick={() => {
                    if (!session) {
                      setShowLoginModal(true);
                    } else {
                      setShowTestimonialModal(true);
                    }
                  }}
                  className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Add First Testimonial
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}