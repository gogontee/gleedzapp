"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share2, 
  Menu, 
  X, 
  User,
  Ticket,
  LogIn,
  Heart
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function EventHeader({ event }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id;
  
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [navVisibility, setNavVisibility] = useState({
    schedule: true,
    candidates: true,
    award: true,
    gallery: true,
    news: true,
    contact: true,
    about: true,
    ticket: true,
    register: true
  });

  // Instant loading states for all interactive elements
  const [loadingStates, setLoadingStates] = useState({
    navigation: {},
    actions: {},
    user: false,
    share: false,
    mobileMenu: false
  });

  const pageColor = event?.page_color || "#D4AF37";

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && event) {
      checkIfFavorite();
    }
  }, [user, event]);

  useEffect(() => {
    if (event?.nav_visibility) {
      setNavVisibility(event.nav_visibility);
    }
  }, [event]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      // First try to fetch from publishers table
      const { data: publisherData, error: publisherError } = await supabase
        .from('publishers')
        .select('*')
        .eq('id', userId)
        .single();

      if (!publisherError && publisherData) {
        setUserProfile({ ...publisherData, role: 'publisher' });
        return;
      }

      // If not found in publishers, try fans table
      const { data: fanData, error: fanError } = await supabase
        .from('fans')
        .select('*')
        .eq('id', userId)
        .single();

      if (!fanError && fanData) {
        setUserProfile({ ...fanData, role: 'fan' });
        return;
      }

      // If user exists but no profile found, set basic user info
      setUserProfile({ role: 'user', avatar_url: null });
    } catch (error) {
      console.error('Error fetching user profile:', error);
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

  // Instant loading state management
  const setInstantLoading = (category, key, value) => {
    setLoadingStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
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
      // Get current user data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('favorite_events')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const currentFavorites = userData?.favorite_events || [];

      // Check if event is already in favorites
      if (currentFavorites.includes(event.id)) {
        showCustomAlert(
          "Already in Favorites", 
          `${event.name} is already in your favorite events.`, 
          "info"
        );
        setIsFavorite(true);
        return;
      }

      // Ask for confirmation
      const confirmed = window.confirm(`Do you want to add "${event.name}" to your favorite events?`);
      
      if (!confirmed) {
        return;
      }

      // Add event to favorites
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
    // Create a custom alert element
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

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  };

  const handleShare = async () => {
    setInstantLoading('actions', 'share', true);
    
    try {
      const shareData = {
        title: event?.name || 'Event',
        text: event?.description || 'Check out this amazing event!',
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(window.location.href);
        showCustomAlert("Link Copied", "Event link copied to clipboard!", "success");
      }
    } catch (error) {
      console.log('Error sharing:', error);
    } finally {
      setTimeout(() => setInstantLoading('actions', 'share', false), 300);
    }
  };

  const handleUserCircleClick = () => {
    setInstantLoading('actions', 'user', true);
    
    setTimeout(() => {
      if (!user) {
        window.location.href = '/login';
        return;
      }

      if (userProfile?.role === 'publisher') {
        window.location.href = `/publisherdashboard/${user.id}`;
      } else if (userProfile?.role === 'fan') {
        window.location.href = `/fansdashboard/${user.id}`;
      } else {
        window.location.href = '/profile';
      }
    }, 50);
  };

  const handleNominationClick = () => {
    setInstantLoading('navigation', 'award', true);
    setTimeout(() => {
      router.push(`/myevent/${eventId}/award`);
    }, 50);
  };

  // Enhanced navigation handler with instant loading
  const handleNavigation = (item) => {
    if (item.key !== 'home' && item.key !== 'award') {
      setInstantLoading('navigation', item.key, true);
    }

    setTimeout(() => {
      if (item.onClick) {
        item.onClick();
      } else {
        router.push(item.href);
      }
      
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }, 50);
  };

  // Check if nomination page is active
  const isNominationActiveLink = () => {
    return pathname === `/myevent/${eventId}/award`;
  };

  const navigationItems = [
    { name: "Home", href: `/myevent/${eventId}`, key: "home" },
    { name: "Schedule", href: `/myevent/${eventId}/schedule`, key: "schedule" },
    { name: "Candidates", href: `/myevent/${eventId}/vote`, key: "candidates" },
    { name: "Award", href: `#`, key: "award", onClick: handleNominationClick },
    { name: "Gallery", href: `/myevent/${eventId}/gallery`, key: "gallery" },
    { name: "News", href: `/myevent/${eventId}/news`, key: "news" },
    { name: "About", href: `/myevent/${eventId}/about`, key: "about" },
    { name: "Contact", href: `/myevent/${eventId}/contact`, key: "contact" },
  ];

  const actionItems = [
    { 
      name: "Tickets", 
      href: `/myevent/${eventId}/ticket`, 
      key: "ticket", 
      icon: Ticket,
      className: "hidden sm:flex"
    },
    { 
      name: "Register", 
      href: `/myevent/${eventId}/register`, 
      key: "register", 
      icon: LogIn,
      className: "hidden md:flex"
    }
  ];

  const isActiveLink = (href) => {
    if (href === `/myevent/${eventId}`) {
      return pathname === `/myevent/${eventId}`;
    }
    return pathname.startsWith(href);
  };

  const shouldShowNavItem = (item) => {
    if (item.key === "home") return true;
    return navVisibility[item.key] !== false;
  };

  const shouldShowActionItem = (item) => {
    return navVisibility[item.key] !== false;
  };

  // Loading spinner component
  const LoadingSpinner = ({ size = "small", color = "currentColor" }) => (
    <div 
      className={`border-2 border-current border-t-transparent rounded-full animate-spin ${
        size === "small" ? "w-4 h-4" : 
        size === "medium" ? "w-5 h-5" : 
        "w-6 h-6"
      }`}
      style={{ borderTopColor: 'transparent' }}
    />
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/50 border-b border-gray-200/50"
      style={{ 
        backgroundColor: `rgba(231, 227, 227, 0.92)`,
        borderBottomColor: `${pageColor}20`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Only - No Event Name */}
          <div className="flex items-center">
            <Link 
              href={`/myevent/${eventId}`}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              {event?.logo && (
                <div 
                  className="w-10 h-10 relative rounded-full border-2 overflow-hidden flex items-center justify-center"
                  style={{ borderColor: pageColor }}
                >
                  <Image 
                    src={event.logo} 
                    alt={event?.name || "Event Logo"} 
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                    style={{ objectPosition: 'center' }}
                  />
                </div>
              )}
            </Link>
          </div>

          {/* Desktop Navigation - Centered and Clean */}
          <nav className="hidden lg:flex items-center gap-0">
            {navigationItems.map((item) => {
              if (!shouldShowNavItem(item)) return null;
              
              const isActive = item.key === "award" 
                ? isNominationActiveLink() 
                : isActiveLink(item.href);
              
              const isLoading = loadingStates.navigation[item.key];
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  disabled={isLoading}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mx-1 group min-w-[80px] flex items-center justify-center ${
                    isActive
                      ? 'text-white' 
                      : 'text-gray-700 hover:text-yellow-400'
                  } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                  style={{
                    backgroundColor: isActive ? pageColor : 'transparent',
                  }}
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" color={isActive ? "white" : pageColor} />
                  ) : (
                    <>
                      {item.name}
                      {/* Hover effect */}
                      {!isActive && (
                        <div 
                          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ backgroundColor: `${pageColor}15` }}
                        />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Side Actions - Compact */}
          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            <button
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className={`p-2 rounded-lg transition-colors hover:bg-gray-100 min-w-[32px] min-h-[32px] flex items-center justify-center ${
                favoriteLoading 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : isFavorite 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-600 hover:text-yellow-400'
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {favoriteLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Heart 
                  className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} 
                />
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={loadingStates.actions.share}
              className={`p-2 rounded-lg transition-colors hover:bg-gray-100 min-w-[32px] min-h-[32px] flex items-center justify-center ${
                loadingStates.actions.share 
                  ? 'text-gray-400 cursor-wait' 
                  : 'text-gray-600 hover:text-yellow-400'
              }`}
              title="Share Event"
            >
              {loadingStates.actions.share ? (
                <LoadingSpinner size="small" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Action Items - Tickets and Register */}
            {actionItems.map((item) => {
              if (!shouldShowActionItem(item)) return null;
              
              const IconComponent = item.icon;
              const isLoading = loadingStates.actions[item.key];
              
              return (
                <Link
                  key={item.key}
                  href={isLoading ? '#' : item.href}
                  onClick={(e) => {
                    if (isLoading) {
                      e.preventDefault();
                      return;
                    }
                    setInstantLoading('actions', item.key, true);
                    setTimeout(() => {
                      setInstantLoading('actions', item.key, false);
                    }, 500);
                  }}
                  className={`${item.className} items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative group min-w-[80px] justify-center ${
                    isLoading ? 'opacity-70 cursor-wait' : ''
                  }`}
                  style={{ 
                    backgroundColor: pageColor,
                    color: 'white',
                    boxShadow: `0 2px 8px 0 ${pageColor}40`,
                  }}
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <>
                      <IconComponent className="w-3 h-3 group-hover:text-yellow-400 transition-colors" />
                      <span className="group-hover:text-yellow-400 transition-colors">{item.name}</span>
                    </>
                  )}
                </Link>
              );
            })}

            {/* User Circle */}
            <button
              onClick={handleUserCircleClick}
              disabled={loadingStates.actions.user}
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ml-1 group min-w-[32px] min-h-[32px] ${
                loadingStates.actions.user ? 'opacity-70 cursor-wait' : ''
              }`}
              style={{ 
                borderColor: pageColor,
                backgroundColor: user ? `${pageColor}15` : 'transparent'
              }}
              title={user ? "My Profile" : "Login"}
            >
              {loadingStates.actions.user ? (
                <LoadingSpinner size="small" color={pageColor} />
              ) : loading ? (
                <LoadingSpinner size="small" color={pageColor} />
              ) : userProfile?.avatar_url ? (
                <div className="w-6 h-6 rounded-full overflow-hidden border group-hover:border-yellow-400 transition-colors">
                  <Image
                    src={userProfile.avatar_url}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <User 
                  className="w-3.5 h-3.5 group-hover:text-yellow-400 transition-colors" 
                  style={{ color: pageColor }} 
                />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setInstantLoading('actions', 'mobileMenu', true);
                setTimeout(() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setInstantLoading('actions', 'mobileMenu', false);
                }, 50);
              }}
              disabled={loadingStates.actions.mobileMenu}
              className={`lg:hidden p-2 rounded-lg transition-colors hover:bg-gray-100 ml-1 min-w-[32px] min-h-[32px] flex items-center justify-center ${
                loadingStates.actions.mobileMenu 
                  ? 'text-gray-400 cursor-wait' 
                  : 'text-gray-600 hover:text-yellow-400'
              }`}
            >
              {loadingStates.actions.mobileMenu ? (
                <LoadingSpinner size="small" />
              ) : mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-md"
          >
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => {
                if (!shouldShowNavItem(item)) return null;
                
                const isActive = item.key === "award" 
                  ? isNominationActiveLink() 
                  : isActiveLink(item.href);
                
                const isLoading = loadingStates.navigation[item.key];
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item)}
                    disabled={isLoading}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium text-sm transition-all w-full group min-h-[44px] ${
                      isActive
                        ? 'text-white' 
                        : 'text-gray-700 hover:text-yellow-400'
                    } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    style={{
                      backgroundColor: isActive ? pageColor : 'transparent',
                    }}
                  >
                    <span className={`group-hover:text-yellow-400 transition-colors ${isLoading ? 'opacity-70' : ''}`}>
                      {item.name}
                    </span>
                    {isLoading && (
                      <LoadingSpinner size="small" color={isActive ? "white" : pageColor} />
                    )}
                  </button>
                );
              })}
              
              {/* Mobile-only action buttons */}
              <div className="pt-3 border-t border-gray-200/50 space-y-2">
                {actionItems.map((item) => {
                  if (!shouldShowActionItem(item)) return null;
                  
                  const IconComponent = item.icon;
                  const isLoading = loadingStates.actions[item.key];
                  
                  return (
                    <Link
                      key={item.key}
                      href={isLoading ? '#' : item.href}
                      onClick={(e) => {
                        if (isLoading) {
                          e.preventDefault();
                          return;
                        }
                        setInstantLoading('actions', item.key, true);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-semibold text-sm shadow-lg relative group min-h-[44px] ${
                        isLoading ? 'opacity-70 cursor-wait' : ''
                      }`}
                      style={{ 
                        backgroundColor: pageColor,
                        color: 'white',
                        boxShadow: `0 4px 14px 0 ${pageColor}40`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <LoadingSpinner size="small" color="white" />
                        ) : (
                          <IconComponent className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                        )}
                        <span className="group-hover:text-yellow-400 transition-colors">
                          {item.name === "Tickets" ? "Get Tickets" : item.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}