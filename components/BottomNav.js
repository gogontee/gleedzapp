"use client";

import { Home, LayoutDashboard, List, Calendar, X, Store, Info } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "@supabase/auth-helpers-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGleedzMenu, setShowGleedzMenu] = useState(false);
  const [cachedUserRole, setCachedUserRole] = useState(null);

  // Get user role ONCE and cache it
  const fetchUserRole = useCallback(async (userId) => {
    if (!userId) return null;
    
    // Check localStorage cache first
    const cached = localStorage.getItem(`userRole_${userId}`);
    if (cached) {
      return cached;
    }

    try {
      // SINGLE QUERY with OR condition instead of multiple sequential queries
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
        .timeout(5000); // ADD TIMEOUT

      if (data && !error) {
        localStorage.setItem(`userRole_${userId}`, data.role);
        return data.role;
      }

      // If not in users table, check other tables in parallel
      const [publisherRes, fanRes] = await Promise.all([
        supabase.from('publishers').select('id').eq('id', userId).single().timeout(3000),
        supabase.from('fans').select('id').eq('id', userId).single().timeout(3000)
      ]);

      if (publisherRes.data) {
        localStorage.setItem(`userRole_${userId}`, 'publisher');
        return 'publisher';
      } else if (fanRes.data) {
        localStorage.setItem(`userRole_${userId}`, 'fans');
        return 'fans';
      }

      return 'fans'; // default
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'fans'; // fallback
    }
  }, []);

  // Only fetch when session changes
  useEffect(() => {
    let isMounted = true;
    
    const updateUserRole = async () => {
      if (!session?.user?.id) {
        if (isMounted) {
          setUserRole(null);
          setCachedUserRole(null);
        }
        return;
      }

      // Skip if we already have cached role
      if (cachedUserRole === session.user.id) {
        return;
      }

      setLoading(true);
      try {
        const role = await fetchUserRole(session.user.id);
        if (isMounted && role) {
          setUserRole(role);
          setCachedUserRole(session.user.id);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    updateUserRole();

    return () => {
      isMounted = false;
    };
  }, [session, fetchUserRole, cachedUserRole]);

  // SIMPLIFIED Auth listener - just clear cache on sign out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setCachedUserRole(null);
        // Clear all cached roles
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('userRole_')) {
            localStorage.removeItem(key);
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGleedzMenu && !event.target.closest('.gleedz-menu-container')) {
        setShowGleedzMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showGleedzMenu]);

  const handleNavClick = (path, requiresAuth = false) => {
    if (requiresAuth && !session?.user) {
      alert("Please log in to access your dashboard.");
      router.push('/login');
      return;
    }

    if (path === "dashboard") {
      if (session?.user) {
        if (loading) {
          console.log('Still loading user data...');
          return;
        }
        
        if (userRole === 'publisher') {
          router.push(`/publisherdashboard/${session.user.id}`);
        } else if (userRole === 'fans' || !userRole) {
          router.push(`/fansdashboard/${session.user.id}`);
        } else {
          router.push('/login?role=publisher');
        }
      } else {
        router.push('/login');
      }
      return;
    }

    if (path === "/gleedz") {
      setShowGleedzMenu(!showGleedzMenu);
      return;
    }

    router.push(path);
  };

  const handleGleedzOptionClick = (option) => {
    if (option === 'mall') {
      router.push('/events/mall');
    } else if (option === 'about') {
      router.push('/gleedz');
    }
    setShowGleedzMenu(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/events", label: "Events", icon: Calendar },
    { path: "dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
    { path: "/gleedz", label: "Gleedz", icon: List },
  ];

  // Determine if current path is a dashboard path
  const isDashboardActive = pathname.startsWith("/publisherdashboard") || 
                           pathname.startsWith("/fansdashboard");
  
  // Check if current path is within gleedz section
  const isGleedzActive = pathname.startsWith("/gleedz") || pathname.startsWith("/events/mall");

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] md:hidden z-50 rounded-t-2xl">
        <ul className="flex justify-around items-center py-2">
          {navItems.map(({ path, label, icon: Icon, requiresAuth }) => {
            let active = false;
            
            if (path === "/") {
              active = pathname === "/";
            } else if (path === "/events") {
              active = pathname.startsWith("/events") && !pathname.startsWith("/events/mall");
            } else if (path === "dashboard") {
              active = isDashboardActive;
            } else if (path === "/gleedz") {
              active = isGleedzActive;
            }

            return (
              <li key={label} className="relative gleedz-menu-container">
                <button
                  onClick={() => handleNavClick(path, requiresAuth)}
                  disabled={path === "dashboard" && loading}
                  className={`flex flex-col items-center text-xs transition-colors ${
                    active ? "text-yellow-700" : "text-gray-500"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Icon
                    className={`w-6 h-6 ${active ? "text-yellow-700" : "text-gray-400"}`}
                  />
                  <span className="mt-1">
                    {label}
                    {path === "dashboard" && loading && "..."}
                  </span>
                </button>

                {/* Gleedz Dropdown Menu */}
                {path === "/gleedz" && showGleedzMenu && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fadeIn">
                    <div className="p-2">
                      <button
                        onClick={() => handleGleedzOptionClick('mall')}
                        className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-md transition-colors"
                      >
                        <Store className="w-4 h-4 mr-2" />
                        Event Mall
                      </button>
                      <button
                        onClick={() => handleGleedzOptionClick('about')}
                        className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-md transition-colors mt-1"
                      >
                        <Info className="w-4 h-4 mr-2" />
                        About Gleedz
                      </button>
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={() => setShowGleedzMenu(false)}
                        className="flex items-center justify-center w-full text-center px-3 py-2 text-xs text-gray-500 hover:text-gray-700 rounded-md transition-colors"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Backdrop for mobile menu */}
      {showGleedzMenu && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setShowGleedzMenu(false)}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}