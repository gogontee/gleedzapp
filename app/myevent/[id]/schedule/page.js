"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Play, Pause, Share2, Download, Grid3X3, List, Plus, Copy, Check } from "lucide-react";
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
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

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

  // Function to add activity to Google Calendar
  const addToGoogleCalendar = (activity) => {
    if (!activity) return;
    
    const startDate = new Date(activity.date);
    const endDate = new Date(activity.date);
    
    // Parse time if available
    if (activity.time) {
      const [hours, minutes] = activity.time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      endDate.setHours(parseInt(hours), parseInt(minutes) + 60, 0); // Assume 1 hour duration
    } else {
      startDate.setHours(0, 0, 0);
      endDate.setHours(23, 59, 59);
    }

    // Format dates for Google Calendar
    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const startTime = formatGoogleDate(startDate);
    const endTime = formatGoogleDate(endDate);

    // Create Google Calendar URL
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', `${event?.name || 'Event'}: ${activity.title}`);
    googleCalendarUrl.searchParams.append('dates', `${startTime}/${endTime}`);
    googleCalendarUrl.searchParams.append('details', activity.description || '');
    if (activity.location) {
      googleCalendarUrl.searchParams.append('location', activity.location);
    }
    
    window.open(googleCalendarUrl.toString(), '_blank');
  };

  // Function to add activity to Apple Calendar
  const addToAppleCalendar = (activity) => {
    if (!activity) return;
    
    const startDate = new Date(activity.date);
    const endDate = new Date(activity.date);
    
    // Parse time if available
    if (activity.time) {
      const [hours, minutes] = activity.time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      endDate.setHours(parseInt(hours), parseInt(minutes) + 60, 0); // Assume 1 hour duration
    } else {
      startDate.setHours(0, 0, 0);
      endDate.setHours(23, 59, 59);
    }

    // Create .ics file content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/-|:|\.\d+/g, '')}
DTEND:${endDate.toISOString().replace(/-|:|\.\d+/g, '')}
SUMMARY:${event?.name || 'Event'}: ${activity.title}
DESCRIPTION:${activity.description || ''}
LOCATION:${activity.location || ''}
END:VEVENT
END:VCALENDAR`;

    // Create download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activity.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Function to share activity
  const shareActivity = async (activity) => {
    if (!activity || !event) return;

    const shareData = {
      title: `${event.name}: ${activity.title}`,
      text: `${activity.description || ''}\n\nDate: ${formatDate(activity.date)}\nTime: ${formatTime(activity.time)}\nLocation: ${activity.location || 'TBA'}`,
      url: window.location.href
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
        );
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
        );
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 3000);
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('Failed to share. Please try again.');
      }
    }
  };

  // Function to share entire schedule
  const shareEntireSchedule = async () => {
    if (!event || activities.length === 0) return;

    let scheduleText = `${event.name} - Complete Schedule\n\n`;
    
    const uniqueDates = getUniqueDates();
    uniqueDates.forEach(date => {
      scheduleText += `${formatDate(date)}\n`;
      const dateActivities = activities.filter(a => a.date === date);
      dateActivities.forEach((activity, index) => {
        scheduleText += `  ${formatTime(activity.time)} - ${activity.title}`;
        if (activity.location) {
          scheduleText += ` (${activity.location})`;
        }
        scheduleText += '\n';
      });
      scheduleText += '\n';
    });

    scheduleText += `\nView full schedule: ${window.location.href}`;

    const shareData = {
      title: `${event.name} - Event Schedule`,
      text: scheduleText,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(scheduleText);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing schedule:', error);
      try {
        await navigator.clipboard.writeText(scheduleText);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 3000);
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    }
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
          <div className="flex items-center gap-3">
            {/* Share Entire Schedule Button */}
            <button
              onClick={shareEntireSchedule}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: `${pageColor}15`,
                color: pageColor,
                border: `2px solid ${pageColor}30`
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Schedule</span>
            </button>
            
            {/* View Mode Toggle */}
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
                      onAddToCalendar={addToGoogleCalendar}
                      onShare={shareActivity}
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
                        onAddToCalendar={addToGoogleCalendar}
                        onShare={shareActivity}
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
            event={event}
            onAddToGoogleCalendar={addToGoogleCalendar}
            onAddToAppleCalendar={addToAppleCalendar}
            onShare={shareActivity}
          />
        )}
      </AnimatePresence>

      {/* Share Options Popup */}
      <AnimatePresence>
        {showShareOptions && (
          <ShareOptionsPopup 
            onClose={() => setShowShareOptions(false)}
            pageColor={pageColor}
            onShareText={() => shareEntireSchedule()}
            onCopyLink={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopiedToClipboard(true);
              setTimeout(() => setCopiedToClipboard(false), 3000);
              setShowShareOptions(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Copied to Clipboard Notification */}
      {copiedToClipboard && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-2xl border border-gray-200"
          >
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-900">Copied to clipboard!</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Activity Card Component (Grid View)
function ActivityCard({ activity, index, pageColor, onSelect, onAddToCalendar, onShare }) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200"
      whileHover={{ scale: 1.03, y: -5 }}
    >
      {/* Activity Image */}
      <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => onSelect(activity)}>
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
        
        {/* Quick Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(activity);
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCalendar(activity);
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      {/* Activity Content */}
      <div className="p-6">
        <h3 
          className="font-bold text-gray-900 text-xl mb-3 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors cursor-pointer"
          onClick={() => onSelect(activity)}
        >
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

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => onSelect(activity)}
            className="flex-1 py-2.5 text-center font-medium rounded-xl transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: `${pageColor}15`,
              color: pageColor
            }}
          >
            View Details
          </button>
          <button
            onClick={() => onAddToCalendar(activity)}
            className="flex-1 py-2.5 text-center font-medium text-white rounded-xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: pageColor }}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Timeline Item Component
function TimelineItem({ activity, index, pageColor, onSelect, onAddToCalendar, onShare }) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex items-start gap-8 mb-12"
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
          <div className="lg:w-56 h-56 lg:h-auto relative flex-shrink-0 cursor-pointer" onClick={() => onSelect(activity)}>
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
            <h3 
              className="font-bold text-gray-900 text-2xl mb-4 cursor-pointer hover:text-gray-700 transition-colors"
              onClick={() => onSelect(activity)}
            >
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

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => onSelect(activity)}
                className="flex-1 py-3 text-center font-medium rounded-xl transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: `${pageColor}15`,
                  color: pageColor
                }}
              >
                View Details
              </button>
              <button
                onClick={() => onAddToCalendar(activity)}
                className="flex-1 py-3 text-center font-medium text-white rounded-xl transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: pageColor }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add to Calendar
              </button>
              <button
                onClick={() => onShare(activity)}
                className="px-4 py-3 font-medium rounded-xl transition-all duration-300 hover:scale-105 border"
                style={{ 
                  borderColor: pageColor,
                  color: pageColor,
                  backgroundColor: `${pageColor}08`
                }}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Activity Modal Component
function ActivityModal({ activity, onClose, pageColor, event, onAddToGoogleCalendar, onAddToAppleCalendar, onShare }) {
  const [imageError, setImageError] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

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
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-gray-200">
            {/* Calendar Options Dropdown */}
            <div className="relative flex-1">
              <button 
                onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                className="w-full flex items-center justify-center gap-3 py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: pageColor }}
              >
                <Calendar className="w-5 h-5" />
                Add to Calendar
              </button>
              
              {/* Calendar Options Dropdown Menu */}
              {showCalendarOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-10 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onAddToGoogleCalendar(activity);
                      setShowCalendarOptions(false);
                    }}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.5,12.5h-2v2h2v-2Zm-3,0h-2v2h2v-2Zm-3,0h-2v2h2v-2Zm6-3h-2v2h2v-2Zm-3,0h-2v2h2v-2Zm-3,0h-2v2h2v-2Zm-3,0h-2v2h2v-2Zm-3,0h-2v2h2v-2Zm12-3h-18v14h18v-14Zm-16,12v-10h14v10h-14Z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Google Calendar</div>
                      <div className="text-sm text-gray-600">Add to Google Calendar</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onAddToAppleCalendar(activity);
                      setShowCalendarOptions(false);
                    }}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.5,1.5h-13a2,2,0,0,0-2,2v17a2,2,0,0,0,2,2h13a2,2,0,0,0,2-2v-17A2,2,0,0,0,18.5,1.5Zm-13,2h13v2h-13v-2Zm13,17h-13v-12h13v12Z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Apple Calendar</div>
                      <div className="text-sm text-gray-600">Download .ics file</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      // For other calendar apps - download .ics file
                      onAddToAppleCalendar(activity);
                      setShowCalendarOptions(false);
                    }}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Other Calendars</div>
                      <div className="text-sm text-gray-600">Download .ics file</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>
            
            <button 
              onClick={() => {
                onShare(activity);
              }}
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

// Share Options Popup Component
function ShareOptionsPopup({ onClose, pageColor, onShareText, onCopyLink }) {
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
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Share Schedule</h3>
          <p className="text-gray-600 mt-2">Choose how you want to share the schedule</p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          <button
            onClick={() => {
              onShareText();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${pageColor}15` }}
            >
              <Share2 className="w-6 h-6" style={{ color: pageColor }} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Share as Text</div>
              <div className="text-sm text-gray-600">Share via messaging apps or email</div>
            </div>
          </button>

          <button
            onClick={() => {
              onCopyLink();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${pageColor}15` }}
            >
              <Copy className="w-6 h-6" style={{ color: pageColor }} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Copy Link</div>
              <div className="text-sm text-gray-600">Copy schedule link to clipboard</div>
            </div>
          </button>

          {/* Social Media Sharing Options */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Share on social media</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Check out this event schedule! ${window.location.href}`);
                  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors"
              >
                Twitter
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Check out this event schedule! ${window.location.href}`);
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Facebook
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Check out this event schedule!\n\n${window.location.href}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-green-50 text-green-600 font-medium hover:bg-green-100 transition-colors"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium border-2 transition-colors"
            style={{ 
              borderColor: pageColor,
              color: pageColor,
              backgroundColor: `${pageColor}08`
            }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}