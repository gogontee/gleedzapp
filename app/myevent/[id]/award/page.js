"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import AwardComponent from "../../../../components/AwardComponent";
import EventHeader from "../../../../components/EventHeader"; // Import EventHeader

export default function AwardPage() {
  const params = useParams();
  const eventId = params.id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchCandidates();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCandidates(data);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Event Header */}
      <EventHeader event={event} />
      
      {/* Main Content with pt-18 to account for fixed header */}
      <div className="pt-18"> {/* Added pt-18 for spacing */}
        {/* Page Header with event color accent */}
        <div 
          className="bg-white shadow-sm border-b"
          style={{ 
            borderBottomColor: `${event.page_color || '#D4AF37'}20`,
            boxShadow: `0 1px 3px 0 ${event.page_color || '#D4AF37'}10`
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 
                  className="text-2xl font-bold text-gray-900"
                  style={{ color: event.page_color || '#D4AF37' }} // Added event color to title
                >
                  {event.name} - Awards
                </h1>
                <p className="text-gray-600">Vote for your favorite nominees</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ 
                    borderColor: event.page_color || '#D4AF37',
                    color: event.page_color || '#D4AF37'
                  }} // Added event color to button
                >
                  Back to Event
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AwardComponent 
            event={event}
            candidates={candidates}
            onCandidatesUpdate={fetchCandidates}
          />
        </div>
      </div>
    </div>
  );
}