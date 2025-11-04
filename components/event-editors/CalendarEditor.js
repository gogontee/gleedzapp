"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Plus, Trash } from "lucide-react";

export default function CalendarEditor({ pageantId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch calendar
  useEffect(() => {
    const fetchCalendar = async () => {
      const { data, error } = await supabase
        .from("pageant_calendar")
        .select("*")
        .eq("pageant_id", pageantId)
        .order("event_date", { ascending: true });

      if (error) console.error(error);
      else setEvents(data || []);
    };
    fetchCalendar();
  }, [pageantId]);

  // Add new event
  const handleAddEvent = () => {
    setEvents([
      ...events,
      { activity: "", location: "", event_date: "", description: "" },
    ]);
  };

  // Delete event (local only until save)
  const handleDelete = (idx) => {
    const updated = events.filter((_, i) => i !== idx);
    setEvents(updated);
  };

  // Save to DB
  const handleSave = async () => {
    setLoading(true);
    setError("");

    // Remove old events first
    await supabase.from("pageant_calendar").delete().eq("pageant_id", pageantId);

    // Insert fresh ones
    const { error } = await supabase.from("pageant_calendar").insert(
      events.map((ev) => ({
        pageant_id: pageantId,
        activity: ev.activity,
        location: ev.location,
        event_date: ev.event_date,
        description: ev.description,
      }))
    );

    setLoading(false);

    if (error) {
      console.error(error);
      setError("Error saving calendar.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Event Calendar Editor</h2>
      {error && <p className="text-red-500">{error}</p>}

      {events.map((ev, idx) => (
        <div key={idx} className="border p-4 rounded space-y-3 relative">
          <button
            onClick={() => handleDelete(idx)}
            className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded"
          >
            <Trash size={14} />
          </button>

          {/* Activity */}
          <div>
            <label className="block font-semibold">Activity Title</label>
            <input
              type="text"
              value={ev.activity}
              onChange={(e) => {
                const updated = [...events];
                updated[idx].activity = e.target.value;
                setEvents(updated);
              }}
              className="w-full border px-3 py-2 rounded"
              placeholder="e.g. Talent Night"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block font-semibold">Location</label>
            <input
              type="text"
              value={ev.location}
              onChange={(e) => {
                const updated = [...events];
                updated[idx].location = e.target.value;
                setEvents(updated);
              }}
              className="w-full border px-3 py-2 rounded"
              placeholder="e.g. Grand Arena"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-semibold">Event Date</label>
            <input
              type="date"
              value={ev.event_date}
              onChange={(e) => {
                const updated = [...events];
                updated[idx].event_date = e.target.value;
                setEvents(updated);
              }}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold">Short Description</label>
            <textarea
              value={ev.description}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  const updated = [...events];
                  updated[idx].description = e.target.value;
                  setEvents(updated);
                }
              }}
              className="w-full border px-3 py-2 rounded"
              placeholder="e.g. A night of talents and performances."
              maxLength={150}
            />
            <p className="text-xs text-gray-500">
              {ev.description.length}/150 characters
            </p>
          </div>
        </div>
      ))}

      {/* Add event */}
      <button
        onClick={handleAddEvent}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        <Plus size={16} /> Add Event
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save Calendar"}
      </button>
    </div>
  );
}
