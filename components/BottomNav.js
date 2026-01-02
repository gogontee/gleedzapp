"use client";

import { Home, LayoutDashboard, List, Calendar } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // adjust path

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleNavClick = (path, requiresAuth = false) => {
    if (requiresAuth && !user) {
      alert("Please log in to access this page");
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

    router.push(path);
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] md:hidden z-50 rounded-t-2xl">
      <ul className="flex justify-around items-center py-2">
        {navItems.map(({ path, label, icon: Icon, requiresAuth }) => {
          const active = path === pathname || 
                        (path === "dashboard" && isDashboardActive);

          return (
            <li key={label}>
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
            </li>
          );
        })}
      </ul>
    </nav>
  );
}