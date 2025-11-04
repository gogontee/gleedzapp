// components/EventManagerModal.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "../lib/supabaseClient";

export default function EventManagerModal({ isOpen, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
      // Simplified query - only events data, no joins
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Error loading events data');
    } finally {
      setLoading(false);
    }
  };

  const updateEventLaunch = async (eventId, newLaunchStatus) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('events')
        .update({ launch: newLaunchStatus })
        .eq('id', eventId);

      if (error) throw error;

      // Update local state
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, launch: newLaunchStatus } : event
      ));

      alert('Event launch status updated successfully!');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const deleteEvent = async (eventId, eventName) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Remove from local state
      setEvents(events.filter(event => event.id !== eventId));
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event: ' + error.message);
    }
  };

  // Filter events based on search and type
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.tagline?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || event.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get unique event types for filter
  const eventTypes = ['all', ...new Set(events.map(event => event.type).filter(Boolean))];

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-yellow-600 text-center">Loading events data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-yellow-500 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Manage Events</h2>
              <p className="text-yellow-100 mt-2">
                View and manage all events
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search events by name, slug, or tagline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchEvents}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Events Count */}
          <div className="mb-4 text-sm text-yellow-700">
            Showing {filteredEvents.length} of {events.length} events
          </div>

          {/* Events Table */}
          <div className="bg-white rounded-lg border border-yellow-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-yellow-50 text-yellow-800 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Event Info</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Details</th>
                    <th className="px-4 py-3 font-semibold">Launch Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100">
                  {filteredEvents.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      onUpdateLaunch={updateEventLaunch}
                      onDelete={deleteEvent}
                      updating={updating}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-yellow-600">
                {events.length === 0 ? 'No events found.' : 'No events match your search criteria.'}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Event Row Component - Simplified
function EventRow({ event, onUpdateLaunch, onDelete, updating }) {
  const [localLaunch, setLocalLaunch] = useState(event.launch);

  const handleLaunchChange = async (newValue) => {
    setLocalLaunch(newValue);
    await onUpdateLaunch(event.id, newValue);
  };

  return (
    <tr className="hover:bg-yellow-25 transition-colors">
      {/* Event Info */}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          {event.logo && (
            <img
              src={event.logo}
              alt={event.name}
              className="w-12 h-12 rounded-lg object-cover border border-yellow-200"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-yellow-900 truncate">
              {event.name || 'Unnamed Event'}
            </div>
            <div className="text-yellow-600 text-xs truncate">
              {event.slug || 'No slug'}
            </div>
            {event.tagline && (
              <div className="text-yellow-500 text-xs mt-1 truncate">
                {event.tagline}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Event Type */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          event.type === 'premium' 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : event.type === 'free'
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-gray-100 text-gray-800 border border-gray-300'
        }`}>
          {event.type || 'standard'}
        </span>
      </td>

      {/* Event Details */}
      <td className="px-4 py-3">
        <div className="text-yellow-900 text-sm">
          <div><strong>Code:</strong> {event.code || 'N/A'}</div>
          <div><strong>Color:</strong> 
            <span 
              className="inline-block w-3 h-3 rounded-full ml-1 border border-gray-300"
              style={{ backgroundColor: event.page_color || '#D4AF37' }}
            ></span>
          </div>
        </div>
      </td>

      {/* Launch Status */}
      <td className="px-4 py-3">
        <select
          value={localLaunch}
          onChange={(e) => handleLaunchChange(e.target.value)}
          disabled={updating}
          className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors ${
            localLaunch === 'launched' 
              ? 'bg-green-100 text-green-800 border-green-300'
              : localLaunch === 'scheduled'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : localLaunch === 'draft'
              ? 'bg-gray-100 text-gray-800 border-gray-300'
              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
          } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="launched">Launched</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        {updating && (
          <div className="text-yellow-600 text-xs mt-1">Updating...</div>
        )}
      </td>

      {/* Created Date */}
      <td className="px-4 py-3">
        <div className="text-yellow-900 text-sm">
          {new Date(event.created_at).toLocaleDateString()}
        </div>
        <div className="text-yellow-600 text-xs">
          {new Date(event.created_at).toLocaleTimeString()}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => onDelete(event.id, event.name)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
            title="Delete Event"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}