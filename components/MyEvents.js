"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import {
  PlusCircle,
  Eye,
  Edit2,
  Rocket,
  Trash2,
  XCircle,
} from "lucide-react";
import EventEditPanel from "../components/EventEditPanel"; // Import the edit panel

export default function MyEvents({ onCreateEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingEvent, setEditingEvent] = useState(null); // Add state for editing

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("user_id", { ascending: false });

      if (error) {
        console.error(error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (confirmCode.trim() !== deleteTarget.code) {
      setErrorMsg("Incorrect event code.");
      return;
    }

    setDeleting(true);
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      console.error(error);
      setErrorMsg("Failed to delete event.");
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      setConfirmCode("");
      setErrorMsg("");
    }
    setDeleting(false);
  };

  const handleSaveEvent = (updatedEvent) => {
    // Update the events list with the edited event
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setEditingEvent(null);
  };

  const handleDeleteEvent = (deletedId) => {
    // Remove the deleted event from the list
    setEvents(prev => prev.filter(e => e.id !== deletedId));
    setEditingEvent(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">My Events</h3>
        <button
          onClick={onCreateEvent}
          className="bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-orange-700 transition"
        >
          <PlusCircle size={16} /> Create Event
        </button>
      </div>

      {/* Event List */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You haven't created any events yet.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {events.map((event) => {
            const banner = event.thumbnail;
            const fallbackBanner = "https://placehold.co/600x300?text=No+Thumbnail";

            return (
              <div
                key={event.id}
                className="bg-white shadow rounded-lg overflow-hidden hover:scale-[1.02] transition-transform duration-300 relative"
              >
                {/* Banner */}
                <img
                  src={banner || fallbackBanner}
                  alt="Event Thumbnail"
                  className="w-full h-40 object-cover"
                />

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {event.logo && (
                      <img
                        src={event.logo}
                        alt="Logo"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <h4 className="font-semibold text-lg">{event.name}</h4>
                  </div>

                  {event.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {event.description.slice(0, 50)}...
                    </p>
                  )}

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      event.launch 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {event.launch ? 'Launched' : 'Draft'}
                    </span>
                  </div>

                  {/* Icons */}
                  <div className="flex justify-between items-center text-gray-600">
                    <div className="flex gap-3">
                      {/* Edit Button - Opens EventEditPanel */}
                      <button 
                        onClick={() => setEditingEvent(event)}
                        title="Edit" 
                        className="hover:text-orange-600 transition"
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* View Link */}
                      <Link
                        href={`/myevent/${event.id}`}
                        className="hover:text-blue-600 transition flex items-center"
                        title="View"
                      >
                        <Eye size={18} />
                      </Link>

                      {/* Launch Button - Green when launched, black when draft */}
                      <button 
                        title="Launch" 
                        className={`transition ${event.launch ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        <Rocket size={18} />
                      </button>
                    </div>

                    <button
                      title="Delete"
                      onClick={() => setDeleteTarget(event)}
                      className="hover:text-red-600 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Edit Panel */}
      {editingEvent && (
        <EventEditPanel
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <XCircle size={20} />
            </button>

            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to permanently delete event{" "}
              <span className="font-medium text-black">
                "{deleteTarget.name}"
              </span>
              . This action cannot be undone.
            </p>

            <p className="text-xs text-gray-500 mb-2">
              Type the event code below to confirm:
            </p>
            <input
              type="text"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Enter event code"
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />

            {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-gray-600 border px-4 py-2 rounded hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`${
                  deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                } text-white px-4 py-2 rounded text-sm transition`}
              >
                {deleting ? "Deleting..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}