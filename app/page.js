"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import HomeClient from "../components/HomeClient";
import { X, LogIn, UserPlus, Star, Gift, Users, Trophy } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [session, setSession] = useState(null);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [posters, setPosters] = useState([]);
  const [loadingPosters, setLoadingPosters] = useState(true);
  
  const authTimerRef = useRef(null);
  const pageTimerRef = useRef(null);
  const hasShownPromptRef = useRef(false);
  const twentyMinuteTimerRef = useRef(null);

  // logo URL
  const logoUrl =
    "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/gleedlogo.png";

  // Fetch posters from gleedz_hero.desktop_posters
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        console.log("🔄 Fetching posters from gleedz_hero.desktop_posters...");
        
        const { data, error } = await supabase
          .from("gleedz_hero")
          .select("desktop_posters")
          .single();

        if (error) {
          console.error("❌ Error fetching posters:", error);
          // Fallback to empty array
          setPosters([]);
          return;
        }

        if (data && data.desktop_posters && Array.isArray(data.desktop_posters)) {
          console.log("✅ Posters data loaded:", data.desktop_posters);
          
          // Transform the data to match HomeClient format
          const transformedPosters = data.desktop_posters.map((poster, index) => ({
            name: `poster${index + 1}`,
            url: poster.src,
            href: poster.button?.href || "/events", // Use button href if available
            autoplay: poster.type === "video",
            type: poster.type // Keep type for reference
          }));
          
          setPosters(transformedPosters);
          console.log("🔄 Transformed posters:", transformedPosters);
        } else {
          console.log("⚠️ No desktop_posters found or invalid format");
          setPosters([]);
        }
      } catch (error) {
        console.error("❌ Error loading posters:", error);
        setPosters([]);
      } finally {
        setLoadingPosters(false);
      }
    };

    fetchPosters();
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        // Hide popup if user logs in
        if (session) {
          setShowAuthPrompt(false);
          clearTimers();
          hasShownPromptRef.current = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (authTimerRef.current) clearTimeout(authTimerRef.current);
    if (pageTimerRef.current) clearInterval(pageTimerRef.current);
    if (twentyMinuteTimerRef.current) clearTimeout(twentyMinuteTimerRef.current);
  };

  const setupTimers = () => {
    // Clear any existing timers
    clearTimers();
    
    // Start tracking time on page
    pageTimerRef.current = setInterval(() => {
      setTimeOnPage(prev => prev + 1);
    }, 1000);

    // Show first prompt after 10 seconds
    authTimerRef.current = setTimeout(() => {
      if (!session && !hasShownPromptRef.current) {
        setShowAuthPrompt(true);
        hasShownPromptRef.current = true;
      }
    }, 10000); // 10 seconds

    // Set up 20-minute repeat timer (1,200,000 ms)
    twentyMinuteTimerRef.current = setTimeout(() => {
      if (!session) {
        setShowAuthPrompt(true);
        // Reset the 20-minute timer
        setupTwentyMinuteRepeat();
      }
    }, 1200000); // 20 minutes
  };

  const setupTwentyMinuteRepeat = () => {
    if (twentyMinuteTimerRef.current) clearTimeout(twentyMinuteTimerRef.current);
    
    twentyMinuteTimerRef.current = setTimeout(() => {
      if (!session) {
        setShowAuthPrompt(true);
        setupTwentyMinuteRepeat(); // Continue repeating
      }
    }, 1200000); // 20 minutes
  };

  // Start timers when component mounts and user is not logged in
  useEffect(() => {
    if (!session) {
      setupTimers();
    }

    return () => {
      clearTimers();
    };
  }, [session]);

  const handleLogin = () => {
    router.push("/login");
    setShowAuthPrompt(false);
  };

  const handleSignup = () => {
    router.push("/signup");
    setShowAuthPrompt(false);
  };

  const handleExit = () => {
    setShowAuthPrompt(false);
    // Reset the 20-minute timer for next prompt
    if (!session) {
      setupTwentyMinuteRepeat();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Show loading state while fetching posters
  if (loadingPosters) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gold-50 via-white to-gold-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Auth Prompt Modal - Compact version */}
      {showAuthPrompt && !session && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-auto my-4 animate-fade-in">
            {/* Header - Compact */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🎯</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Unlock Gleedz Features</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Exploring for {formatTime(timeOnPage)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExit}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Features - Compact Grid */}
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-800">Join Events</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-800">Vote & Support</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                    <Gift className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-800">Send Gifts</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-800">Create Events</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Stacked for mobile */}
            <div className="p-3 pt-0">
              <div className="space-y-2">
                <button
                  onClick={handleSignup}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-sm font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Free Account
                </button>
                
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login to Account
                </button>
                
                <button
                  onClick={handleExit}
                  className="w-full px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs hover:bg-gray-50 rounded transition-colors"
                >
                  Continue browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Home Page */}
      <HomeClient logoUrl={logoUrl} posters={posters} />
      
      {/* Add CSS animation */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        /* Ensure popup stays above mobile bottom tabs */
        @media (max-height: 700px) {
          .fixed.inset-0 {
            align-items: flex-start;
            padding-top: 2rem;
          }
        }
      `}</style>
    </>
  );
}