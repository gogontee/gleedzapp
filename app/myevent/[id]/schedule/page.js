"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Play, Pause, Share2, Download, Grid3X3, List } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader";

export default function EventSchedulePage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*, activities")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      setEvent(eventData);
      
      // Parse activities from JSONB column and sort by date
      if (eventData.activities && Array.isArray(eventData.activities)) {
        const sortedActivities = eventData.activities
          .filter(activity => activity.date) // Only activities with dates
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setActivities(sortedActivities);
        
        // Set initial selected date to the first activity date
        if (sortedActivities.length > 0) {
          setSelectedDate(sortedActivities[0].date);
        }
      }
      
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique dates from activities
  const getUniqueDates = () => {
    const dates = activities.map(activity => activity.date);
    return [...new Set(dates)].sort();
  };

  // Get activities for selected date
  const getActivitiesForDate = () => {
    if (!selectedDate) return [];
    return activities.filter(activity => activity.date === selectedDate);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'All Day';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <Link href="/" className="text-gold-600 hover:text-gold-700 font-semibold">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";
  const uniqueDates = getUniqueDates();
  const filteredActivities = getActivitiesForDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Use EventHeader Component */}
      <EventHeader 
        event={event}
        showBackButton={true}
        backUrl={`/myevent/${eventId}`}
        title="Event Schedule"
        subtitle="Plan your experience"
        rightContent={
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'grid' 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ 
                backgroundColor: viewMode === 'grid' ? pageColor : 'transparent'
              }}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'timeline' 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ 
                backgroundColor: viewMode === 'timeline' ? pageColor : 'transparent'
              }}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>
        }
      />

      {/* Add pt-20 here for spacing between EventHeader and content */}
      <div className="pt-20">
        {/* Date Navigation */}
        {uniqueDates.length > 0 && (
          <section className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="flex overflow-x-auto py-6 gap-3 scrollbar-hide">
                {uniqueDates.map((date, index) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                      selectedDate === date
                        ? 'text-white shadow-lg border-transparent'
                        : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    style={{ 
                      backgroundColor: selectedDate === date ? pageColor : undefined,
                      boxShadow: selectedDate === date ? `0 10px 25px -5px ${pageColor}40` : undefined
                    }}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {new Date(date).getDate()}
                      </div>
                      <div className="text-sm font-medium opacity-90">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {activities.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${pageColor}15`, border: `2px dashed ${pageColor}30` }}
              >
                <Calendar className="w-16 h-16" style={{ color: pageColor }} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Schedule Coming Soon</h3>
              <p className="text-gray-600 max-w-md mx-auto text-lg mb-8">
                The event schedule will be announced soon. Stay tuned for exciting updates!
              </p>
              <Link
                href={`/myevent/${eventId}`}
                className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: pageColor }}
              >
                <ChevronLeft className="w-5 h-5" />
                Return to Event
              </Link>
            </div>
          ) : (
            <>
              {/* Selected Date Header */}
              {selectedDate && (
                <motion.div 
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white shadow-lg border border-gray-200 mb-4">
                    <Calendar className="w-5 h-5" style={{ color: pageColor }} />
                    <span className="text-sm font-semibold text-gray-600">Selected Date</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    {formatDate(selectedDate)}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {filteredActivities.length} activity{filteredActivities.length !== 1 ? 'ies' : ''} scheduled
                  </p>
                </motion.div>
              )}

              {/* Activities Grid/Timeline */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredActivities.map((activity, index) => (
                    <ActivityCard 
                      key={index}
                      activity={activity}
                      index={index}
                      pageColor={pageColor}
                      onSelect={setSelectedActivity}
                    />
                  ))}
                </div>
              ) : (
                <div className="max-w-5xl mx-auto">
                  <div className="relative">
                    {/* Timeline line */}
                    <div 
                      className="absolute left-8 top-0 bottom-0 w-1 transform -translate-x-1/2"
                      style={{ backgroundColor: `${pageColor}20` }}
                    />
                    
                    {filteredActivities.map((activity, index) => (
                      <TimelineItem 
                        key={index}
                        activity={activity}
                        index={index}
                        pageColor={pageColor}
                        onSelect={setSelectedActivity}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <ActivityModal 
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
            pageColor={pageColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Activity Card Component (Grid View)
function ActivityCard({ activity, index, pageColor, onSelect }) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer border border-gray-200"
      whileHover={{ scale: 1.03, y: -5 }}
      onClick={() => onSelect(activity)}
    >
      {/* Activity Image */}
      <div className="relative h-56 overflow-hidden">
        {activity.image && !imageError ? (
          <Image
            src={activity.image}
            alt={activity.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${pageColor}15` }}
          >
            <Calendar className="w-16 h-16" style={{ color: pageColor }} />
          </div>
        )}
        
        {/* Time Badge */}
        <div 
          className="absolute top-4 left-4 px-4 py-2 rounded-2xl text-white text-sm font-semibold shadow-lg backdrop-blur-sm border border-white/20"
          style={{ backgroundColor: pageColor }}
        >
          {activity.time ? new Date(`2000-01-01T${activity.time}`).toLocaleTimeString("en-US", {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : 'All Day'}
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      {/* Activity Content */}
      <div className="p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-3 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
          {activity.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {activity.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          
          {activity.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[120px]">{activity.location}</span>
            </div>
          )}
        </div>

        {/* Countdown Timer */}
        {activity.countdown_target && (
          <CountdownTimer targetDate={activity.countdown_target} pageColor={pageColor} />
        )}
      </div>
    </motion.div>
  );
}

// Timeline Item Component
function TimelineItem({ activity, index, pageColor, onSelect }) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex items-start gap-8 mb-12 group cursor-pointer"
      onClick={() => onSelect(activity)}
    >
      {/* Timeline dot */}
      <div 
        className="absolute left-8 w-6 h-6 rounded-full border-4 border-white shadow-xl z-10 transform -translate-x-1/2 mt-6 group-hover:scale-125 transition-transform duration-300"
        style={{ backgroundColor: pageColor }}
      />

      {/* Time indicator */}
      <div className="flex-shrink-0 w-24 text-right pt-6">
        <div className="text-base font-bold text-gray-900 mb-1">
          {activity.time ? new Date(`2000-01-01T${activity.time}`).toLocaleTimeString("en-US", {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : 'All Day'}
        </div>
        <div className="text-xs text-gray-500">
          Duration
        </div>
      </div>

      {/* Activity content */}
      <div className="flex-1 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 group-hover:scale-[1.02]">
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="lg:w-56 h-56 lg:h-auto relative flex-shrink-0">
            {activity.image && !imageError ? (
              <Image
                src={activity.image}
                alt={activity.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: `${pageColor}15` }}
              >
                <Calendar className="w-12 h-12" style={{ color: pageColor }} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 flex-1">
            <h3 className="font-bold text-gray-900 text-2xl mb-4">
              {activity.title}
            </h3>
            
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              {activity.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(activity.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              
              {activity.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>

            {/* Countdown Timer */}
            {activity.countdown_target && (
              <CountdownTimer targetDate={activity.countdown_target} pageColor={pageColor} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Activity Modal Component
function ActivityModal({ activity, onClose, pageColor }) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'All Day';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative h-72 bg-gray-200">
          {activity.image && !imageError ? (
            <Image
              src={activity.image}
              alt={activity.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${pageColor}15` }}
            >
              <Calendar className="w-20 h-20" style={{ color: pageColor }} />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          
          <div className="absolute bottom-6 left-8 right-8 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{activity.title}</h2>
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{formatDate(activity.date)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{formatTime(activity.time)}</span>
              </div>
              {activity.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">{activity.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 rounded-2xl bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm hover:scale-110 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[calc(90vh-18rem)] overflow-y-auto">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed text-base md:text-lg">
              {activity.description}
            </div>
          </div>

          {/* Countdown Timer */}
          {activity.countdown_target && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Countdown to Event
              </h4>
              <CountdownTimer targetDate={activity.countdown_target} pageColor={pageColor} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
            <button 
              className="flex-1 flex items-center justify-center gap-3 py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: pageColor }}
            >
              <Calendar className="w-5 h-5" />
              Add to Calendar
            </button>
            
            <button 
              className="flex-1 flex items-center justify-center gap-3 py-4 font-semibold rounded-2xl border-2 transition-all duration-300 hover:scale-105"
              style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
            >
              <Share2 className="w-5 h-5" />
              Share Event
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Countdown Timer Component
function CountdownTimer({ targetDate, pageColor }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
    return null;
  }

  return (
    <div className="flex gap-3 justify-center">
      {timeLeft.days > 0 && (
        <div className="text-center">
          <div 
            className="text-lg font-bold rounded-xl px-4 py-3 min-w-[70px] text-white shadow-lg"
            style={{ backgroundColor: pageColor }}
          >
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-600 mt-2 font-medium">Days</div>
        </div>
      )}
      <div className="text-center">
        <div 
          className="text-lg font-bold rounded-xl px-4 py-3 min-w-[70px] text-white shadow-lg"
          style={{ backgroundColor: pageColor }}
        >
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-600 mt-2 font-medium">Hours</div>
      </div>
      <div className="text-center">
        <div 
          className="text-lg font-bold rounded-xl px-4 py-3 min-w-[70px] text-white shadow-lg"
          style={{ backgroundColor: pageColor }}
        >
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-600 mt-2 font-medium">Minutes</div>
      </div>
      <div className="text-center">
        <div 
          className="text-lg font-bold rounded-xl px-4 py-3 min-w-[70px] text-white shadow-lg"
          style={{ backgroundColor: pageColor }}
        >
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-600 mt-2 font-medium">Seconds</div>
      </div>
    </div>
  );
}