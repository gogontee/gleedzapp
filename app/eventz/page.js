"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, List as ListIcon, ArrowLeft } from "lucide-react";

// Event tabs configuration for page titles
const eventTabs = [
  { query: "pageant", pageTitle: "All Pageant Events" },
  { query: "reality", pageTitle: "Reality Shows" },
  { query: "concert", pageTitle: "Concerts" },
  { query: "award", pageTitle: "Award Shows" },
  { query: "tv show", pageTitle: "TV Shows" },
  { query: "corporate", pageTitle: "Corporate Events" },
  { query: "talent", pageTitle: "Talent Shows" },
  { query: "faith", pageTitle: "Faith Events" },
  { query: "sports", pageTitle: "Sports Events" },
  { query: "others", pageTitle: "Other Events" },
];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [isList, setIsList] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const eventType = searchParams.get("type");
  const customTitle = searchParams.get("title");

  const LOGO_URL = "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/glogo.png";

  // Get page title based on event type
  const getPageTitle = () => {
    if (customTitle) return customTitle;
    
    const tab = eventTabs.find(tab => tab.query === eventType);
    if (tab) return tab.pageTitle;
    
    return "All Events";
  };

  const pageTitle = getPageTitle();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from("events")
          .select("*")
          .eq("launch", true)
          .eq("active", true); // ✅ Only fetch active events

        // If specific event type is selected, filter by type
        if (eventType) {
          query = query.ilike("type", `%${eventType}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching events:", error);
          return;
        }

        setEvents(data || []);
        setFilteredEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [eventType]);

  // Handle search filter - search by name, type, or description
  useEffect(() => {
    if (!search.trim()) {
      setFilteredEvents(events);
      return;
    }
    
    const term = search.toLowerCase().trim();
    setFilteredEvents(
      events.filter((event) =>
        event.name?.toLowerCase().includes(term) ||
        event.type?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      )
    );
  }, [search, events]);

  // Get appropriate message when no events are found
  const getNoEventsMessage = () => {
    if (search) {
      return {
        title: "No events found",
        description: `No events found for "${search}". Try adjusting your search terms.`
      };
    }
    
    if (eventType) {
      const tab = eventTabs.find(tab => tab.query === eventType);
      const eventTypeName = tab ? tab.pageTitle.toLowerCase() : eventType + " events";
      return {
        title: `No ${eventTypeName} available yet`,
        description: `Check back later for new ${eventTypeName}.`
      };
    }
    
    return {
      title: "No active events found",
      description: "Check back later for new active events!"
    };
  };

  const noEventsMessage = getNoEventsMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gold-50 via-white to-gold-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Desktop Header with Logo, Title, Search, and Back Button */}
        <div className="hidden md:flex items-center justify-between mb-8 gap-6">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Image
              src={LOGO_URL}
              alt="Gleedz Logo"
              width={120}
              height={60}
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events by name, type, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Page Title and Back Button - Right */}
          <div className="flex-shrink-0 flex flex-col items-end gap-3">
            <h1 className="text-2xl font-bold text-yellow-800 text-right">
              {pageTitle}
            </h1>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden space-y-4 mb-6">
          {/* Logo and Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={LOGO_URL}
                alt="Gleedz Logo"
                width={60}
                height={30}
                className="object-contain"
                unoptimized
              />
              <h1 className="text-lg font-bold text-yellow-800">
                {pageTitle}
              </h1>
            </div>
            <button
              onClick={() => router.back()}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200"
            >
              <ArrowLeft size={16} />
            </button>
          </div>

          {/* Search Bar and Layout Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg"
                >
                  ×
                </button>
              )}
            </div>

            {/* Layout Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsList(!isList)}
              className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-yellow-50 transition-all duration-200"
            >
              {isList ? (
                <LayoutGrid className="w-4 h-4 text-yellow-600" />
              ) : (
                <ListIcon className="w-4 h-4 text-yellow-600" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Search Results Info */}
        {search && (
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              {filteredEvents.length > 0 ? (
                <>
                  Found <span className="font-semibold text-yellow-700">{filteredEvents.length}</span> active event{filteredEvents.length !== 1 ? 's' : ''} for "<span className="font-semibold">{search}</span>"
                </>
              ) : (
                <>
                  No active events found for "<span className="font-semibold">{search}</span>"
                </>
              )}
            </p>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div key={skeleton} className="glass rounded-2xl p-5 animate-pulse">
                <div className="h-40 md:h-48 bg-gray-300 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <>
            {/* Desktop View - Always Grid */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                  className="glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white"
                >
                  {/* Event Banner */}
                  {event.thumbnail && (
                    <div className="relative h-40 md:h-48 w-full">
                      <Image
                        src={event.thumbnail}
                        alt={`${event.name} banner`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Event Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {event.logo && (
                          <div className="w-10 h-10 relative">
                            <Image
                              src={event.logo}
                              alt={`${event.name} logo`}
                              width={40}
                              height={40}
                              className="object-contain rounded-[15px]"
                              unoptimized
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {event.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                      {event.description || "Join us for an unforgettable experience filled with excitement and entertainment."}
                    </p>

                    <div className="flex items-center justify-between">
                      <Link href={`/myevent/${event.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          View Event
                        </motion.button>
                      </Link>
                      
                      {/* Event Type Tag */}
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-sm font-semibold border"
                        style={{ 
                          backgroundColor: `${event.page_color || '#f59e0b'}15`,
                          borderColor: event.page_color || '#f59e0b',
                          color: event.page_color || '#f59e0b'
                        }}
                      >
                        {event.type}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile View - Grid/List Toggle */}
            <div className="md:hidden">
              <div className={
                isList 
                  ? "space-y-4" 
                  : "grid grid-cols-2 gap-4"
              }>
                {filteredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={
                      isList 
                        ? "bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden"
                        : "bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden"
                    }
                  >
                    {/* Thumbnail */}
                    {event.thumbnail && (
                      <div className={isList ? "w-full h-32" : "w-full h-32"}>
                        <Image
                          src={event.thumbnail}
                          alt={event.name}
                          width={400}
                          height={128}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    {/* Event Content */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {event.logo && (
                          <div className="w-6 h-6 relative">
                            <Image
                              src={event.logo}
                              alt={`${event.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded-[15px]"
                              unoptimized
                            />
                          </div>
                        )}
                        <h3 className="font-semibold text-gray-900 text-sm flex-1 truncate">
                          {event.name}
                        </h3>
                      </div>

                      {/* Event Type Tag - Mobile */}
                      <span 
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium border mb-2"
                        style={{ 
                          backgroundColor: `${event.page_color || '#f59e0b'}15`,
                          borderColor: event.page_color || '#f59e0b',
                          color: event.page_color || '#f59e0b'
                        }}
                      >
                        {event.type}
                      </span>

                      <p className="text-gray-600 text-xs line-clamp-2 mb-3">
                        {event.description || "Join us for an amazing experience."}
                      </p>

                      <Link href={`/myevent/${event.id}`}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                        >
                          View Event
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 glass rounded-2xl bg-white shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {noEventsMessage.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {noEventsMessage.description}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}