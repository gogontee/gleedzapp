"use client";

import { Home, LayoutDashboard, List, Calendar } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // adjust path

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Check if user is authenticated
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavClick = (path, requiresAuth = false) => {
    if (requiresAuth && !user) {
      alert("Please log in to access this page");
      return;
    }

    // For dashboard, we dynamically build path
    if (path === "dashboard") {
      if (user) {
        router.push(`/publisherdashboard/${user.id}`);
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] md:hidden z-50 rounded-t-2xl">
      <ul className="flex justify-around items-center py-2">
        {navItems.map(({ path, label, icon: Icon, requiresAuth }) => {
          const active = path === pathname || (path === "dashboard" && pathname.startsWith("/publisherdashboard"));

          return (
            <li key={label}>
              <button
                onClick={() => handleNavClick(path, requiresAuth)}
                className={`flex flex-col items-center text-xs transition-colors ${
                  active ? "text-yellow-700" : "text-gray-500"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${active ? "text-yellow-700" : "text-gray-400"}`}
                />
                <span className="mt-1">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
