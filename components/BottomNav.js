"use client";

import { Home, LayoutDashboard, List, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // adjust path as needed

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDashboardClick = (e) => {
    if (!user) {
      e.preventDefault();
      alert("Please log in to access the dashboard");
      return;
    }
    // If user is logged in, the Link will handle the navigation
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { 
      href: user ? `/publisherdashboard/${user.id}` : "#", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      onClick: handleDashboardClick
    },
    { href: "/list", label: "List", icon: List },
    { href: "/events", label: "Events", icon: Calendar },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] md:hidden z-50 rounded-t-2xl">
      <ul className="flex justify-around items-center py-2">
        {navItems.map(({ href, label, icon: Icon, onClick }) => {
          const active = pathname === href;

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onClick}
                className={`flex flex-col items-center text-xs transition-colors ${
                  active ? "text-yellow-700" : "text-gray-500"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    active ? "text-yellow-700" : "text-gray-400"
                  }`}
                />
                <span className="mt-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}