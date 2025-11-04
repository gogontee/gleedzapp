"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import DefaultEventPage from "../../../components/events/DefaultEventPage";

export default function EventPage() {
  const { id } = useParams(); // dynamic event ID from URL
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Failed to fetch event:", error);
        setEventData(null);
      } else {
        setEventData(data);
      }

      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading event...
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Event not found or has been removed.
      </div>
    );
  }

  // ✅ Pass full event data to your DefaultEventPage
  return <DefaultEventPage event={eventData} />;
}
