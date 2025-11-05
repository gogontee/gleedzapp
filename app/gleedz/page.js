'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Wallet, 
  Ticket, 
  Vote, 
  Award, 
  Users, 
  Shield, 
  Zap,
  Layout,
  FormInput,
  FileText,
  BarChart3,
  CreditCard,
  Menu,
  X,
  ArrowRight,
  Star,
  CheckCircle,
  Play,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

// Dynamically import components to avoid SSR issues
const GleedzVideo = dynamic(() => import('../../components/GleedzVideo'), { ssr: false });

const GleedzPlatform = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // ✅ PROPERLY Get current user and check role in both users table and specific role tables
  useEffect(() => {
    const getCurrentUser = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // First check the users table for role
          const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('id, role, email')
            .eq('id', user.id)
            .single();

          if (userProfile && !userError) {
            setCurrentUser(userProfile);
            setUserRole(userProfile.role);
            
            // If user is publisher, verify they exist in publishers table
            if (userProfile.role === 'publisher') {
              const { data: publisherData } = await supabase
                .from('publishers')
                .select('id')
                .eq('id', user.id)
                .single();
              
              if (!publisherData) {
                console.warn('User marked as publisher but not found in publishers table');
              }
            }
            // If user is fan, verify they exist in fans table
            else if (userProfile.role === 'fans') {
              const { data: fanData } = await supabase
                .from('fans')
                .select('id')
                .eq('id', user.id)
                .single();
              
              if (!fanData) {
                console.warn('User marked as fan but not found in fans table');
              }
            }
          } else {
            // User not found in users table, check if they exist in publishers or fans table
            const { data: publisherData } = await supabase
              .from('publishers')
              .select('id, email')
              .eq('id', user.id)
              .single();

            if (publisherData) {
              setCurrentUser({ id: user.id, email: publisherData.email, role: 'publisher' });
              setUserRole('publisher');
            } else {
              const { data: fanData } = await supabase
                .from('fans')
                .select('id, email')
                .eq('id', user.id)
                .single();

              if (fanData) {
                setCurrentUser({ id: user.id, email: fanData.email, role: 'fans' });
                setUserRole('fans');
              } else {
                // User not found in any table, set default as fan
                setCurrentUser({ id: user.id, email: user.email, role: 'fans' });
                setUserRole('fans');
              }
            }
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
          setUserId(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setCurrentUser(null);
        setUserRole(null);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          getCurrentUser(); // Refresh user data when signed in
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setUserRole(null);
          setUserId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Hero slider content
  const slides = [
    {
      title: "Create Events in Minutes",
      subtitle: "No technical skills needed",
      description: "Set up professional event pages with our intuitive drag-and-drop interface",
      gradient: "from-blue-500 to-purple-600",
      icon: Layout
    },
    {
      title: "Token-Powered Simplicity",
      subtitle: "Wallet-based transactions",
      description: "One-click voting and ticket purchases without repeated payment steps",
      gradient: "from-green-500 to-teal-600",
      icon: Wallet
    },
    {
      title: "Full Customization",
      subtitle: "Your brand, your rules",
      description: "Complete control over event design, forms, and user experience",
      gradient: "from-orange-500 to-red-500",
      icon: Award
    }
  ];

  // FAQ data
  const faqs = [
    {
      question: "How do I create an event?",
      answer: "Simply click 'Get Started', fund your wallet with tokens, and use our intuitive event builder to set up your event in minutes."
    },
    {
      question: "What is the cost to create an event?",
      answer: "Each event requires a 50 token annual maintenance fee, plus 10% of all transactions processed through the platform."
    },
    {
      question: "Can I customize my event page?",
      answer: "Yes! You have full control over headers, navigation, colors, forms, and branding to match your unique style."
    },
    {
      question: "How do users pay for tickets and voting?",
      answer: "Users connect their wallet once and can then make instant token payments for tickets and voting without repeated authentication."
    },
    {
      question: "What's the difference between publisher and fan accounts?",
      answer: "Publisher accounts can create and manage events, while fan accounts are for participating in events (voting, buying tickets)."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'services', label: 'Services' }
  ];

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

  // ✅ FINAL COMPETENT Get Started button handler
  const handleGetStarted = async () => {
    if (loading) {
      console.log('Still loading user data...');
      return;
    }

    console.log('Get Started clicked - Current user:', currentUser);
    console.log('User role:', userRole);
    console.log('User ID:', userId);

    // Case 1: User not logged in - show login modal with publisher focus
    if (!currentUser) {
      console.log('User not logged in - showing login modal');
      setShowLoginModal(true);
      return;
    }

    // Case 2: User is publisher - redirect to publisher dashboard
    if (userRole === 'publisher') {
      console.log('User is publisher - redirecting to publisher dashboard');
      router.push(`/publisherdashboard/${currentUser.id}`);
      return;
    }

    // Case 3: User is fan - show role popup asking to upgrade
    if (userRole === 'fans') {
      console.log('User is fan - showing role popup');
      setShowRolePopup(true);
      return;
    }

    // Case 4: Unknown role - default to showing login modal
    console.log('Unknown user role - showing login modal');
    setShowLoginModal(true);
  };

  // ✅ Handle Dashboard button click
  const handleDashboard = () => {
    if (loading) return;

    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    // Redirect based on user role using the actual user ID
    if (userRole === 'publisher') {
      router.push(`/publisherdashboard/${currentUser.id}`);
    } else if (userRole === 'fans') {
      router.push(`/fansdashboard/${currentUser.id}`);
    } else {
      // Default fallback
      router.push(`/publisherdashboard/${currentUser.id}`);
    }
  };

  // ✅ Handle login with publisher focus
  const handleLogin = () => {
    setShowLoginModal(false);
    router.push('/login?role=publisher');
  };

  // ✅ Handle signup with publisher focus
  const handleSignup = () => {
    setShowLoginModal(false);
    router.push('/signup?role=publisher');
  };

  // ✅ Handle upgrade account
  const handleUpgradeAccount = () => {
    setShowRolePopup(false);
    router.push('/signup?role=publisher');
  };

  // ✅ Handle "Stay as Fan" - redirect to fan dashboard
  const handleStayAsFan = () => {
    setShowRolePopup(false);
    if (currentUser) {
      router.push(`/fansdashboard/${currentUser.id}`);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call to insert into gleedzsupport table
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          message: contactForm.message
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    const message = "Hello Gleedz Support, I need assistance with...";
    const whatsappUrl = `https://wa.me/2349161888244?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Image 
                src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/glogo.png"
                alt="Gleedz"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium">
                Home
              </a>
              <a href="/events" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium">
                Events
              </a>
              <button
                onClick={handleDashboard}
                className="text-gray-700 hover:text-yellow-600 transition-colors font-medium"
                disabled={loading}
              >
                Dashboard {loading && '...'}
              </button>
              <div className="relative group">
                <button className="text-gray-700 hover:text-yellow-600 transition-colors font-medium flex items-center">
                  More <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <button 
                    onClick={() => setShowPrivacyModal(true)}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-yellow-600 transition-colors"
                  >
                    Privacy Policy
                  </button>
                  <button 
                    onClick={() => setShowTermsModal(true)}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-yellow-600 transition-colors"
                  >
                    Terms of Service
                  </button>
                  <button 
                    onClick={() => setShowFAQModal(true)}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-yellow-600 transition-colors"
                  >
                    FAQ
                  </button>
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-yellow-600 transition-colors"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                disabled={loading}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow-lg hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Get Started'}
              </button>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100"
            >
              <div className="px-4 py-4 space-y-4">
                <a href="/" className="block text-gray-700 hover:text-yellow-600 font-medium">
                  Home
                </a>
                <a href="/events" className="block text-gray-700 hover:text-yellow-600 font-medium">
                  Events
                </a>
                <button
                  onClick={handleDashboard}
                  disabled={loading}
                  className="block text-gray-700 hover:text-yellow-600 font-medium w-full text-left disabled:opacity-50"
                >
                  Dashboard {loading && '...'}
                </button>
                <button 
                  onClick={() => { setShowPrivacyModal(true); setIsMenuOpen(false); }}
                  className="block text-gray-700 hover:text-yellow-600 font-medium w-full text-left"
                >
                  Privacy Policy
                </button>
                <button 
                  onClick={() => { setShowTermsModal(true); setIsMenuOpen(false); }}
                  className="block text-gray-700 hover:text-yellow-600 font-medium w-full text-left"
                >
                  Terms of Service
                </button>
                <button 
                  onClick={() => { setShowFAQModal(true); setIsMenuOpen(false); }}
                  className="block text-gray-700 hover:text-yellow-600 font-medium w-full text-left"
                >
                  FAQ
                </button>
                <button 
                  onClick={() => { setShowContactModal(true); setIsMenuOpen(false); }}
                  className="block text-gray-700 hover:text-yellow-600 font-medium w-full text-left"
                >
                  Contact Us
                </button>
                <button
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Get Started'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Slider - Reduced height */}
      <section className="pt-16 relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].gradient}`}
          />
        </AnimatePresence>
        
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  {(() => {
                    const Icon = slides[currentSlide].icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
              </div>
              
              <h1 className="text-xl md:text-3xl font-bold drop-shadow-2xl">
                {slides[currentSlide].title}
              </h1>
              
              <p className="text-sm md:text-lg font-light text-white/90 drop-shadow-lg">
                {slides[currentSlide].subtitle}
              </p>
              
              <p className="text-xs md:text-base max-w-2xl mx-auto text-white/80 drop-shadow">
                {slides[currentSlide].description}
              </p>
              
              <div className="flex justify-center space-x-3 pt-6">
                <button
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="bg-white text-gray-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'Loading...' : 'Start Creating'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="border border-white text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-white/10 transition-all duration-300 backdrop-blur-sm flex items-center space-x-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* User status indicator */}
              {currentUser && (
                <div className="pt-4">
                  <p className="text-sm text-white/80">
                    Logged in as: <span className="font-semibold">{currentUser.email}</span> 
                    ({userRole})
                  </p>
                  <p className="text-xs text-white/60">
                    User ID: {currentUser.id}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8 md:mb-16">
            <div className="bg-gray-100 rounded-2xl p-1 md:p-2 flex space-x-1 md:space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center"
              >
                <div>
                  <h2 className="text-2xl md:text-4xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                    Revolutionizing Event Management with Blockchain
                  </h2>
                  <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
                    Gleedz transforms how events are created and experienced through our 
                    wallet-based token system. Say goodbye to complicated payment processes 
                    and hello to seamless, one-click transactions.
                  </p>
                  
                  <div className="space-y-3 md:space-y-4">
                    {[
                      "No technical skills required - set up like a simple page",
                      "Direct wallet integration for instant transactions",
                      "Complete customization control",
                      "Real-time analytics and insights"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl md:shadow-2xl">
                    <div className="space-y-4 md:space-y-6">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900">Why Event Creators Love Gleedz</h3>
                      <div className="space-y-3 md:space-y-4">
                        {[
                          { stat: "5min", label: "Average setup time" },
                          { stat: "99%", label: "Reduced payment friction" },
                          { stat: "24/7", label: "Platform access" }
                        ].map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 md:py-3 border-b border-gray-200">
                            <span className="text-sm md:text-base text-gray-600">{item.label}</span>
                            <span className="text-xl md:text-2xl font-bold text-yellow-600">{item.stat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'features' && (
              <motion.div
                key="features"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8 md:mb-16">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    Powerful Event Features
                  </h2>
                  <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
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
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8 md:mb-16">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    Simple, Transparent Pricing
                  </h2>
                  <p className="text-base md:text-xl text-gray-600">
                    Pay as you go with our straightforward token-based model
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
                  <div className="bg-white border-2 border-yellow-200 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl md:shadow-2xl">
                    <div className="text-center mb-6 md:mb-8">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                        <Calendar className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                        Event Creation
                      </h3>
                      <div className="text-2xl md:text-4xl font-bold text-yellow-600">
                        50 Tokens
                      </div>
                      <p className="text-gray-600 mt-2 text-sm md:text-base">Annual Maintenance Fee</p>
                    </div>
                    
                    <ul className="space-y-3 md:space-y-4">
                      {[
                        "One-time annual fee per event",
                        "Access to all platform features",
                        "Automatic wallet deduction",
                        "No hidden costs"
                      ].map((item, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm md:text-base text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-xl md:shadow-2xl">
                    <div className="text-center mb-6 md:mb-8">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                        <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        Transaction Fee
                      </h3>
                      <div className="text-2xl md:text-4xl font-bold text-yellow-400">
                        10%
                      </div>
                      <p className="text-gray-300 mt-2 text-sm md:text-base">Of All Event Transactions</p>
                    </div>
                    
                    <ul className="space-y-3 md:space-y-4">
                      {[
                        "Ticket sales and voting",
                        "Automatic transaction processing",
                        "Real-time revenue tracking",
                        "Secure token handling"
                      ].map((item, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 flex-shrink-0" />
                          <span className="text-sm md:text-base text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8 md:mb-16">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    Our Services
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {[
                    {
                      title: "Event Creation",
                      description: "Full suite for creating and managing events",
                      features: ["Custom pages", "Registration forms", "Ticketing"]
                    },
                    {
                      title: "Payment Solutions",
                      description: "Token-based payment processing",
                      features: ["Wallet integration", "Secure transactions", "Real-time tracking"]
                    },
                    {
                      title: "Analytics",
                      description: "Comprehensive event insights",
                      features: ["Real-time data", "Revenue tracking", "Audience analytics"]
                    }
                  ].map((service, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{service.title}</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{service.description}</p>
                      <ul className="space-y-1 md:space-y-2">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2 text-xs md:text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            Ready to Create Amazing Events?
          </h2>
          <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of event creators who are already using Gleedz to build 
            outstanding event experiences with token-powered simplicity.
          </p>
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className="bg-yellow-500 text-gray-900 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-yellow-400 transition-all duration-300 shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Start Creating Today'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <Image 
                src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/glogo.png"
                alt="Gleedz"
                width={120}
                height={40}
                className="h-6 md:h-8 w-auto invert"
              />
            </div>
            <p className="text-gray-400 text-sm md:text-base">
              &copy; 2024 Gleedz. Revolutionizing event experiences through blockchain technology.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <Modal
            title="Publisher Account Required"
            onClose={() => setShowLoginModal(false)}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Create Amazing Events
              </h3>
              <p className="text-gray-600 mb-6">
                You need a publisher account to create and manage events. Please login with your publisher account or sign up for one to get started.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 bg-yellow-500 text-gray-900 px-4 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={handleSignup}
                  className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Role Popup Modal */}
      <AnimatePresence>
        {showRolePopup && (
          <Modal
            title="Upgrade to Publisher Account"
            onClose={() => setShowRolePopup(false)}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Publisher Features Required
              </h3>
              <p className="text-gray-600 mb-6">
                Your current account is a fan account which is for participating in events only. 
                To create and manage events, you need to upgrade to a publisher account.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleStayAsFan}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Stay as Fan
                </button>
                <button
                  onClick={handleUpgradeAccount}
                  className="flex-1 bg-yellow-500 text-gray-900 px-4 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <Modal
            title="Platform Demo"
            onClose={() => setShowVideoModal(false)}
          >
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <GleedzVideo />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <Modal
            title="Privacy Policy"
            onClose={() => setShowPrivacyModal(false)}
          >
            <div className="prose prose-sm max-h-96 overflow-y-auto">
              <h3>Information We Collect</h3>
              <p>We collect information you provide directly to us, including name, email address, and event preferences.</p>
              
              <h3>How We Use Your Information</h3>
              <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you.</p>
              
              <h3>Data Security</h3>
              <p>We implement appropriate technical and organizational security measures to protect your data.</p>
              
              <h3>Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact us.</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <Modal
            title="Terms of Service"
            onClose={() => setShowTermsModal(false)}
          >
            <div className="prose prose-sm max-h-96 overflow-y-auto">
              <h3>Acceptance of Terms</h3>
              <p>By accessing and using Gleedz, you accept and agree to be bound by the terms of this agreement.</p>
              
              <h3>User Responsibilities</h3>
              <p>You are responsible for maintaining the confidentiality of your account and password.</p>
              
              <h3>Service Modifications</h3>
              <p>Gleedz reserves the right to modify or discontinue the service at any time.</p>
              
              <h3>Governing Law</h3>
              <p>These terms shall be governed by the laws of Nigeria without regard to its conflict of law provisions.</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* FAQ Modal */}
      <AnimatePresence>
        {showFAQModal && (
          <Modal
            title="Frequently Asked Questions"
            onClose={() => setShowFAQModal(false)}
          >
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="flex justify-between items-center w-full text-left font-semibold text-gray-900 hover:text-yellow-600 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {expandedFAQ === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <AnimatePresence>
                    {expandedFAQ === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-gray-600"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <Modal
            title="Contact Us"
            onClose={() => setShowContactModal(false)}
          >
            <div className="space-y-4">
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700"
                >
                  Thank you for your message! We'll get back to you soon.
                </motion.div>
              )}
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="+234 800 000 0000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="How can we help you?"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="flex-1 bg-green-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-yellow-500 text-gray-900 px-4 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Modal Component
const Modal = ({ title, children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
        {children}
      </div>
    </motion.div>
  </motion.div>
);

export default GleedzPlatform;