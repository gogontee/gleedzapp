"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import DefaultEventPage from "../../../components/events/DefaultEventPage";
import { X, LogIn, UserPlus } from "lucide-react";

export default function EventPage() {
  const { id } = useParams(); // dynamic event ID from URL
  const router = useRouter();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [session, setSession] = useState(null);
  const [timeOnPage, setTimeOnPage] = useState(0);
  
  const authTimerRef = useRef(null);
  const sessionCheckRef = useRef(null);
  const pageTimerRef = useRef(null);
  const hasShownPromptRef = useRef(false);
  const twentyMinuteTimerRef = useRef(null);

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

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Failed to fetch event:", error);
        setEventData(null);
      } else {
        setEventData(data);
      }

      setLoading(false);
    };

    fetchEvent();
  }, [id]);

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
    if (!session && eventData && !loading) {
      setupTimers();
    }

    return () => {
      clearTimers();
    };
  }, [session, eventData, loading]);

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
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading event...
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Event not found or has been removed.
      </div>
    );
  }

  return (
    <>
      {/* Auth Prompt Modal */}
      {showAuthPrompt && !session && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Unlock More Features!
                </h2>
                <button
                  onClick={handleExit}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mt-2 text-sm">
                You've been browsing for {formatTime(timeOnPage)}. Join Gleedz to access all features!
              </p>
            </div>


            {/* Action Buttons */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLogin}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
                <button
                  onClick={handleSignup}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </div>
              
              <button
                onClick={handleExit}
                className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                Continue browsing (popup will show again in 20 minutes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Event Page */}
      <DefaultEventPage event={eventData} />
    </>
  );
}