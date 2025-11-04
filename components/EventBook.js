"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  ExternalLink,
  Trash2,
  Search,
  Filter,
  Grid3X3,
  List
} from "lucide-react";

export default function EventBook({ fanId }) {
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    fetchFavoriteEvents();
  }, [fanId]);

  const fetchFavoriteEvents = async () => {
    try {
      setLoading(true);
      
      // First, get the user's favorite events array
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('favorite_events')
        .eq('id', fanId)
        .single();

      if (userError) throw userError;

      const favoriteEventIds = userData?.favorite_events || [];

      if (favoriteEventIds.length === 0) {
        setFavoriteEvents([]);
        return;
      }

      // Fetch event details for each favorite event ID
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', favoriteEventIds);

      if (eventsError) throw eventsError;

      setFavoriteEvents(eventsData || []);
      
    } catch (error) {
      console.error('Error fetching favorite events:', error);
      setFavoriteEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (eventId) => {
    try {
      // Get current favorites
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('favorite_events')
        .eq('id', fanId)
        .single();

      if (userError) throw userError;

      const currentFavorites = userData?.favorite_events || [];
      const updatedFavorites = currentFavorites.filter(id => id !== eventId);

      // Update user's favorite_events
      const { error: updateError } = await supabase
        .from('users')
        .update({ favorite_events: updatedFavorites })
        .eq('id', fanId);

      if (updateError) throw updateError;

      // Update local state
      setFavoriteEvents(prev => prev.filter(event => event.id !== eventId));
      
      alert('Event removed from favorites!');
      
    } catch (error) {
      console.error('Error removing from favorites:', error);
      alert('Error removing event from favorites. Please try again.');
    }
  };

  const filteredEvents = favoriteEvents.filter(event => {
    const matchesSearch = event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || event.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const eventTypes = [...new Set(favoriteEvents.map(event => event.type).filter(Boolean))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Book</h2>
            <p className="text-gray-600">Your favorite events</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="bg-gray-200 rounded-2xl h-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Book</h2>
          <p className="text-gray-600">
            {favoriteEvents.length} favorite event{favoriteEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search favorite events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Grid/List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {favoriteEvents.length === 0 ? "No Favorite Events" : "No Events Found"}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {favoriteEvents.length === 0 
              ? "You haven't added any events to your favorites yet. Start exploring events and add them to your book!"
              : "Try adjusting your search or filter to find what you're looking for."
            }
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredEvents.map((event, index) => (
              <EventCard 
                key={event.id}
                event={event}
                index={index}
                onRemove={removeFromFavorites}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredEvents.map((event, index) => (
              <EventListItem 
                key={event.id}
                event={event}
                index={index}
                onRemove={removeFromFavorites}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// Event Card Component (Grid View)
function EventCard({ event, index, onRemove }) {
  const pageColor = event.page_color || "#D4AF37";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Remove Button */}
      <button
        onClick={() => onRemove(event.id)}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
        title="Remove from favorites"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Event Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        {event.thumbnail ? (
          <img
            src={event.thumbnail}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${pageColor}20` }}
          >
            <Calendar className="w-12 h-12" style={{ color: pageColor }} />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Event Logo */}
        {event.logo && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full bg-white p-1 shadow-lg">
            <img
              src={event.logo}
              alt={`${event.name} logo`}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        )}
        
        {/* Event Type Badge */}
        {event.type && (
          <div 
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-medium shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: `${pageColor}CC` }}
          >
            {event.type}
          </div>
        )}
      </div>

      {/* Event Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
          {event.name}
        </h3>
        
        {event.tagline && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {event.tagline}
          </p>
        )}

        {/* Event Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ color: pageColor }} />
              <span>Favorite</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.open(`/myevent/${event.id}`, '_blank')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>View Event</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Accent Border */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: pageColor }}
      />
    </motion.div>
  );
}

// Event List Item Component
function EventListItem({ event, index, onRemove }) {
  const pageColor = event.page_color || "#D4AF37";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex">
        {/* Event Thumbnail */}
        <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden">
          {event.thumbnail ? (
            <img
              src={event.thumbnail}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${pageColor}20` }}
            >
              <Calendar className="w-8 h-8" style={{ color: pageColor }} />
            </div>
          )}
          
          {/* Event Logo */}
          {event.logo && (
            <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white p-1 shadow-lg">
              <img
                src={event.logo}
                alt={`${event.name} logo`}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          )}
        </div>

        {/* Event Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                {event.name}
              </h3>
              
              {event.tagline && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {event.tagline}
                </p>
              )}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(event.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 ml-4"
              title="Remove from favorites"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Event Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {event.type && (
                <div 
                  className="px-2 py-1 rounded-full text-white text-xs font-medium"
                  style={{ backgroundColor: pageColor }}
                >
                  {event.type}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" style={{ color: pageColor }} />
                <span>In Your Favorites</span>
              </div>
            </div>
            
            <button 
              onClick={() => window.open(`/myevent/${event.id}`, '_blank')}
              className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:text-blue-700 transition-colors text-sm"
            >
              <span>View Event</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Accent Border */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: pageColor }}
      />
    </motion.div>
  );
}