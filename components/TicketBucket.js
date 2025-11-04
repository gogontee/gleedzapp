"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MapPin, Calendar, ExternalLink, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyTicketBucket() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No user logged in");
        setTickets([]);
        return;
      }

      // Fetch tickets belonging to current user
      const { data: myTickets, error } = await supabase
        .from("myticket")
        .select("*")
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      if (!myTickets.length) {
        setTickets([]);
        return;
      }

      // Fetch related event data including page_color
      const eventIds = myTickets.map((t) => t.events_id).filter(Boolean);
      const { data: eventData } = await supabase
        .from("events")
        .select("id, logo, page_color")
        .in("id", eventIds);

      // Map event data to tickets and extract color from array
      const enrichedTickets = myTickets.map((ticket) => {
        const event = eventData?.find((ev) => ev.id === ticket.events_id);
        
        // Extract color from array format ["#colorcode"] or use default
        const pageColorArray = event?.page_color;
        const pageColor = (Array.isArray(pageColorArray) && pageColorArray.length > 0) 
          ? pageColorArray[0] 
          : "#000000";
        
        return { 
          ...ticket, 
          event_logo: event?.logo || null,
          page_color: pageColor // Now stored as string
        };
      });

      setTickets(enrichedTickets || []);
    } catch (err) {
      console.error("Error fetching tickets:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets based on search term
  const filteredTickets = tickets.filter((ticket) => {
    const details = ticket.details || {};
    const searchLower = searchTerm.toLowerCase();
    
    return (
      ticket.events_name?.toLowerCase().includes(searchLower) ||
      details.name?.toLowerCase().includes(searchLower) ||
      details.price?.toString().includes(searchTerm) ||
      details.event_date?.toLowerCase().includes(searchLower) ||
      details.venue?.toLowerCase().includes(searchLower)
    );
  });

  if (loading)
    return (
      <div className="flex justify-center items-center h-60 text-gray-500">
        Loading your tickets...
      </div>
    );

  return (
    <div className="p-3 md:p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by event, ticket, price, date, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        {searchTerm && (
          <p className="text-center text-sm text-gray-600 mt-2">
            Found {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        )}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center text-gray-600 py-12">
          {searchTerm ? (
            <div>
              <p className="text-lg mb-2">No tickets found</p>
              <p className="text-sm text-gray-500">
                No tickets match your search for "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Clear Search
              </button>
            </div>
          ) : (
            "You have not purchased any tickets yet."
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {filteredTickets.map((ticket) => {
            const details = ticket.details || {};
            const visual = details.visuals?.[0]?.url || null;
            const eventDate = details.event_date;
            const eventTime = details.event_time;

            return (
              <TicketCard 
                key={ticket.id}
                ticket={ticket}
                details={details}
                visual={visual}
                eventDate={eventDate}
                eventTime={eventTime}
                router={router}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Separate Ticket Card Component for better organization
function TicketCard({ ticket, details, visual, eventDate, eventTime, router }) {
  const pageColor = ticket.page_color || "#000000";
  
  // Function to check if color is light or dark with proper error handling
  const isLightColor = (color) => {
    // Handle cases where color might be invalid
    if (!color || typeof color !== 'string') {
      return true; // Default to light theme for invalid colors
    }
    
    try {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return brightness > 128;
    } catch (error) {
      console.warn('Invalid color format:', color);
      return true; // Default to light theme on error
    }
  };

  const textColor = isLightColor(pageColor) ? '#000000' : '#FFFFFF';
  const buttonBgColor = isLightColor(pageColor) ? '#000000' : '#FFFFFF';
  const buttonTextColor = isLightColor(pageColor) ? '#FFFFFF' : '#000000';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
    >
      {/* Banner Visual with color overlay */}
      {visual ? (
        <div className="relative w-full h-24 md:h-32">
          <Image
            src={visual}
            alt={details.name || "Ticket Visual"}
            fill
            className="object-cover"
            unoptimized
          />
          {/* Color overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ backgroundColor: pageColor }}
          />
        </div>
      ) : (
        <div 
          className="h-24 md:h-32 flex items-center justify-center relative"
          style={{ backgroundColor: pageColor }}
        >
          <div 
            className="text-xs text-center px-2 opacity-70"
            style={{ color: textColor }}
          >
            No Visual
          </div>
        </div>
      )}

      {/* Ticket Content */}
      <div className="p-2 md:p-3 space-y-2">
        {/* Event Logo and Name with color accent */}
        <div className="flex items-center space-x-2 min-w-0">
          {ticket.event_logo && (
            <div 
              className="relative w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border flex-shrink-0"
              style={{ borderColor: pageColor }}
            >
              <Image
                src={ticket.event_logo}
                alt="Event Logo"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <h3 
            className="text-xs md:text-sm font-semibold truncate"
            style={{ color: pageColor }}
          >
            {ticket.events_name || "Untitled Event"}
          </h3>
        </div>

        {/* Ticket ID */}
        <p className="text-xs text-gray-500 font-mono truncate">
          ID: {ticket.id.slice(0, 8)}...
        </p>

        {/* Ticket Type and Price */}
        {details.name && (
          <div className="space-y-1">
            <p 
              className="text-xs font-medium truncate"
              style={{ color: pageColor }}
            >
              {details.name}
            </p>
            {details.price && (
              <p className="text-xs font-semibold text-gray-700">
                ₦{details.price}
              </p>
            )}
          </div>
        )}

        {/* Venue */}
        {details.venue && (
          <div className="flex items-center text-gray-600 text-xs">
            <MapPin size={10} className="mr-1 flex-shrink-0" />
            <span className="truncate">{details.venue}</span>
          </div>
        )}

        {/* Description (truncated) */}
        {details.description && (
          <p className="text-gray-600 text-xs line-clamp-2 leading-tight">
            {details.description}
          </p>
        )}

        {/* Date and Countdown */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center gap-1 text-gray-600 text-xs">
            <Calendar size={10} />
            <span className="truncate">
              {new Date(ticket.purchase_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>

          {eventDate && eventTime && (
            <div className="flex items-center gap-1 text-gray-600 text-xs">
              <Clock size={10} />
              <CountdownTimer eventDate={eventDate} eventTime={eventTime} />
            </div>
          )}
        </div>

        {/* Go To Event Button with dynamic colors */}
        <button
          onClick={() => router.push(`/myevent/${ticket.events_id}`)}
          className="w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg transition-all mt-2 font-medium"
          style={{ 
            backgroundColor: buttonBgColor,
            color: buttonTextColor
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          View Event
          <ExternalLink size={10} />
        </button>
      </div>
    </motion.div>
  );
}

// Real-time Countdown Timer Component (unchanged)
function CountdownTimer({ eventDate, eventTime }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!eventDate || !eventTime) {
      setTimeLeft("No date");
      return;
    }

    const calculateTimeLeft = () => {
      const eventDateTime = new Date(`${eventDate}T${eventTime}:00`);
      const now = new Date();
      const diff = eventDateTime - now;

      if (diff <= 0) {
        return "Started";
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins}m ${secs}s`;
    };

    // Set initial value
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, [eventDate, eventTime]);

  return <span className="truncate">{timeLeft}</span>;
}