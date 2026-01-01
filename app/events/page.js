"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { LayoutGrid, List as ListIcon, Search, Home, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import PosterShowcase from "../../components/PosterShowcase";
import PosterShowcaseMobile from "../../components/PosterShowcaseMobile";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [isList, setIsList] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const pathname = usePathname();
  const params = useParams();

  const LOGO_URL =
    "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/logo.png";

  // ✅ Get current user ID for dashboard link
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // ✅ Fetch launched events where active is TRUE
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true); // Start loading
      const { data, error } = await supabase
        .from("events")
        .select("id, name, description, type, thumbnail, logo, page_color")
        .eq("launch", true)
        .eq("active", true) // ✅ Only fetch active events
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching events:", error.message);
      else {
        setEvents(data || []);
        setFilteredEvents(data || []);
      }
      setLoading(false); // End loading
    };

    fetchEvents();
  }, []);

  // ✅ Handle search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredEvents(events);
      return;
    }
    const term = search.toLowerCase();
    setFilteredEvents(
      events.filter(
        (e) =>
          e.name?.toLowerCase().includes(term) ||
          e.type?.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term)
      )
    );
  }, [search, events]);

  // Function to truncate description to 30 words
  const truncateDescription = (text, wordLimit = 30) => {
    if (!text) return "Join us for an unforgettable experience.";
    
    const words = text.split(/\s+/);
    if (words.length <= wordLimit) {
      return text;
    }
    
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Navigation items - Fixed dashboard link
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/events", label: "Events", icon: Calendar },
    { 
      href: userId ? `/publisherdashboard/${userId}` : "/login", 
      label: "Dashboard", 
      icon: User 
    },
  ];

  // Function to render loading state
  const renderLoadingState = () => (
    <div className="text-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
      <p className="text-gray-500 text-lg">Events loading...</p>
    </div>
  );

  // Function to render no events found state
  const renderNoEventsState = () => (
    <div className="text-center py-16">
      <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg">
        {search ? "No events found" : "No active events available"}
      </p>
      <p className="text-gray-400 mt-2">
        {search 
          ? "Try adjusting your search terms" 
          : "Check back later for new active events"
        }
      </p>
    </div>
  );

  // Desktop Event Card Component
  const DesktopEventCard = ({ event, isList }) => {
    const truncatedDescription = truncateDescription(event.description);
    
    if (isList) {
      return (
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="flex gap-6 bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer group"
        >
          {/* Thumbnail */}
          {event.thumbnail && (
            <div className="w-64 h-48 flex-shrink-0">
              <Image
                src={event.thumbnail}
                alt={event.name}
                width={256}
                height={192}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Event Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {event.logo && (
                  <div className="w-12 h-12 relative">
                    <Image
                      src={event.logo}
                      alt={`${event.name} logo`}
                      width={48}
                      height={48}
                      className="object-contain rounded-[10px]"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {event.name}
                  </h3>
                  <span 
                    className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                    style={{ 
                      backgroundColor: `${event.page_color || '#f59e0b'}10`,
                      borderColor: event.page_color || '#f59e0b',
                      color: event.page_color || '#f59e0b'
                    }}
                  >
                    {event.type}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4 text-sm">
              {truncatedDescription}
            </p>

            <div className="flex items-center justify-between">
              <Link href={`/myevent/${event.id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow text-sm"
                >
                  View Event
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    // Grid View
    return (
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer group"
      >
        {/* Thumbnail */}
        {event.thumbnail && (
          <div className="w-full h-48 relative overflow-hidden">
            <Image
              src={event.thumbnail}
              alt={event.name}
              width={400}
              height={192}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Event Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {event.logo && (
                <div className="w-10 h-10 relative">
                  <Image
                    src={event.logo}
                    alt={`${event.name} logo`}
                    width={40}
                    height={40}
                    className="object-contain rounded-[8px]"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {event.name}
                </h3>
                <span 
                  className="inline-block px-2 py-1 rounded-full text-xs font-semibold border"
                  style={{ 
                    backgroundColor: `${event.page_color || '#f59e0b'}10`,
                    borderColor: event.page_color || '#f59e0b',
                    color: event.page_color || '#f59e0b'
                  }}
                >
                  {event.type}
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {truncatedDescription}
          </p>

          <Link href={`/myevent/${event.id}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow text-sm"
            >
              View Event
            </motion.button>
          </Link>
        </div>
      </motion.div>
    );
  };

  // Mobile Event Card Component
  const MobileEventCard = ({ event, isList }) => {
    const truncatedDescription = truncateDescription(event.description, 20);
    
    if (isList) {
      return (
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex gap-3 bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer group"
        >
          {/* Thumbnail */}
          {event.thumbnail && (
            <div className="w-24 h-24 flex-shrink-0">
              <Image
                src={event.thumbnail}
                alt={event.name}
                width={96}
                height={96}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Event Content */}
          <div className="flex-1 p-3">
            <div className="flex items-center gap-2 mb-1">
              {event.logo && (
                <div className="w-6 h-6 relative">
                  <Image
                    src={event.logo}
                    alt={`${event.name} logo`}
                    width={24}
                    height={24}
                    className="object-contain rounded-[6px]"
                  />
                </div>
              )}
              <h3 className="font-semibold text-gray-900 text-sm flex-1 truncate">
                {event.name}
              </h3>
            </div>

            <span 
              className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border mb-2"
              style={{ 
                backgroundColor: `${event.page_color || '#f59e0b'}10`,
                borderColor: event.page_color || '#f59e0b',
                color: event.page_color || '#f59e0b'
              }}
            >
              {event.type}
            </span>

            <p className="text-gray-600 text-xs line-clamp-2 mb-3">
              {truncatedDescription}
            </p>

            <Link href={`/myevent/${event.id}`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-all duration-200 w-full"
              >
                View Event
              </motion.button>
            </Link>
          </div>
        </motion.div>
      );
    }

    // Grid View
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer group"
      >
        {/* Thumbnail */}
        {event.thumbnail && (
          <div className="w-full h-32 relative overflow-hidden">
            <Image
              src={event.thumbnail}
              alt={event.name}
              width={400}
              height={128}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        )}

        {/* Event Content */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            {event.logo && (
              <div className="w-6 h-6 relative">
                <Image
                  src={event.logo}
                  alt={`${event.name} logo`}
                  width={24}
                  height={24}
                  className="object-contain rounded-[6px]"
                />
              </div>
            )}
            <h3 className="font-semibold text-gray-900 text-xs flex-1 truncate">
              {event.name}
            </h3>
          </div>

          <span 
            className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border mb-2"
            style={{ 
              backgroundColor: `${event.page_color || '#f59e0b'}10`,
              borderColor: event.page_color || '#f59e0b',
              color: event.page_color || '#f59e0b'
            }}
          >
            {event.type}
          </span>

          <p className="text-gray-600 text-xs line-clamp-2 mb-3">
            {truncatedDescription}
          </p>

          <Link href={`/myevent/${event.id}`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-all duration-200"
            >
              View Event
            </motion.button>
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ✅ Mobile Poster Showcase with logo overlay */}
      <div className="relative md:hidden">
        <PosterShowcaseMobile />
        <div className="absolute top-4 left-4 w-14 h-14">
          <Image
            src={LOGO_URL}
            alt="Logo"
            width={56}
            height={70}
            className="object-contain drop-shadow-md rounded-[6px]"
          />
        </div>
      </div>

      {/* ✅ Desktop Layout */}
      <div className="hidden md:block min-h-screen">
        <div className="flex">
          {/* Left Sidebar - Poster (Full Height) */}
          <div className="w-80 flex-shrink-0 fixed left-0 top-0 bottom-0 h-screen">
            {/* Poster Container - Full height, no padding */}
            <div className="h-full w-full relative">
              <PosterShowcase />
              
              {/* Logo positioned top left of poster */}
              <div className="absolute top-6 left-6 z-10">
                <div className="w-16 h-16 relative">
                  <Image
                    src={LOGO_URL}
                    alt="Logo"
                    width={64}
                    height={64}
                    className="object-contain drop-shadow-lg rounded-[15px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-screen ml-80">
            {/* Header Section */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
              <div className="px-8 py-6">
                <div className="flex items-center justify-between">
                  {/* Title Only */}
                  <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                      All Events
                    </h1>
                  </div>

                  {/* Navigation + Search + Toggle */}
                  <div className="flex items-center gap-6">
                    {/* Navigation Links - Icons Only */}
                    <nav className="flex items-center gap-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                              isActive
                                ? "bg-yellow-500 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            title={item.label}
                          >
                            <Icon size={20} />
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-80 pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                      />
                    </div>

                    {/* Layout Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsList(!isList)}
                      className="p-3 rounded-xl border border-gray-300 bg-white hover:bg-yellow-50 transition-all duration-200 group"
                      title={isList ? "Switch to grid view" : "Switch to list view"}
                    >
                      {isList ? (
                        <LayoutGrid className="w-6 h-6 text-yellow-600 group-hover:text-yellow-700" />
                      ) : (
                        <ListIcon className="w-6 h-6 text-yellow-600 group-hover:text-yellow-700" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </header>

            {/* Events Grid/List */}
            <main className="p-8">
              {loading ? (
                renderLoadingState()
              ) : filteredEvents.length === 0 ? (
                renderNoEventsState()
              ) : (
                <div className={
                  isList 
                    ? "space-y-6 max-w-5xl" 
                    : "grid grid-cols-3 gap-8"
                }>
                  {filteredEvents.map((event) => (
                    <DesktopEventCard 
                      key={event.id} 
                      event={event} 
                      isList={isList} 
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* ✅ Mobile Layout */}
      <div className="md:hidden">
        {/* Header for Mobile */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          {/* Mobile Navigation */}
          <nav className="flex justify-center gap-4 mb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-yellow-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">All Events</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsList(!isList)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-yellow-50 transition-all duration-200"
            >
              {isList ? (
                <LayoutGrid className="w-5 h-5 text-yellow-600" />
              ) : (
                <ListIcon className="w-5 h-5 text-yellow-600" />
              )}
            </motion.button>
          </div>

          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Mobile Events Grid */}
        <div className="p-4">
          {loading ? (
            renderLoadingState()
          ) : filteredEvents.length === 0 ? (
            renderNoEventsState()
          ) : (
            <div className={
              isList 
                ? "space-y-4" 
                : "grid grid-cols-2 gap-4"
            }>
              {filteredEvents.map((event) => (
                <MobileEventCard 
                  key={event.id} 
                  event={event} 
                  isList={isList} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}