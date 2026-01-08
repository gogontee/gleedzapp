"use client";

import { Home, LayoutDashboard, List, Calendar, X, Store, Info } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // adjust path

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGleedzMenu, setShowGleedzMenu] = useState(false);

  // Check user authentication and role
  useEffect(() => {
    const getUserAndRole = async () => {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          setUser(authUser);
          
          // First check the users table for role
          const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('id, role, email')
            .eq('id', authUser.id)
            .single();

          if (userProfile && !userError) {
            setUserRole(userProfile.role);
          } else {
            // User not found in users table, check if they exist in publishers or fans table
            const { data: publisherData } = await supabase
              .from('publishers')
              .select('id, email')
              .eq('id', authUser.id)
              .single();

            if (publisherData) {
              setUserRole('publisher');
            } else {
              const { data: fanData } = await supabase
                .from('fans')
                .select('id, email')
                .eq('id', authUser.id)
                .single();

              if (fanData) {
                setUserRole('fans');
              } else {
                // User not found in any table, set default as fan
                setUserRole('fans');
              }
            }
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getUserAndRole();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await getUserAndRole(); // Refresh user data when signed in
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
        }
      }
    );

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
    if (requiresAuth && !user) {
      alert("Please log in to access your dashboard.");
      router.push('/login');
      return;
    }

    // For dashboard, we dynamically build path based on user role
    if (path === "dashboard") {
      if (user) {
        if (loading) {
          console.log('Still loading user data...');
          return;
        }
        
        console.log('Dashboard clicked - User:', user.id);
        console.log('User role:', userRole);
        
        if (userRole === 'publisher') {
          router.push(`/publisherdashboard/${user.id}`);
        } else if (userRole === 'fans') {
          router.push(`/fansdashboard/${user.id}`);
        } else {
          // Default fallback - if role is unknown, show login modal or ask for role
          console.log('Unknown user role - redirecting to login');
          router.push('/login?role=publisher');
        }
      } else {
        router.push('/login');
      }
      return;
    }

    // For Gleedz, toggle the menu instead of direct navigation
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