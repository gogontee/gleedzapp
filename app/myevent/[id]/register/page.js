// app/myevent/[id]/register/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import FormsDisplay from "../../../../components/FormsDisplay";
import CandidatesForm from "../../../../components/CandidatesForm";
import EventHeader from "../../../../components/EventHeader";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const params = useParams();
  const eventId = params.id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(null);
  const [activeForm, setActiveForm] = useState("candidate"); // ⬅️ Changed from "other" to "candidate"

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      console.log("🔄 Fetching event with ID:", eventId);

      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) {
        console.error("❌ Error fetching event:", error);
        return;
      }

      if (eventData) {
        console.log("✅ Event data loaded:", eventData);
        console.log("🎨 Page color data:", eventData.page_color);
        console.log("📊 Type of page_color:", typeof eventData.page_color);

        setEvent(eventData);

        const processedColors = getEventColors(eventData);
        console.log("🎯 Processed colors:", processedColors);
        setColors(processedColors);
      }
    } catch (error) {
      console.error("❌ Error loading event:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🟣 Updated getEventColors — handles array, object, or string
  const getEventColors = (eventData) => {
    const defaultColors = {
      primary: "#ce9c1eff",
      secondary: "#d4ce99ff",
      background: "#f8fafc",
      text: "#1f2937",
      card: "#ffffff",
      border: "#e5e7eb",
    };

    if (!eventData?.page_color) {
      console.log("⚠️ No page_color found, using defaults");
      return defaultColors;
    }

    try {
      let colorData =
        typeof eventData.page_color === "string"
          ? JSON.parse(eventData.page_color)
          : eventData.page_color;

      // 🟢 Handle case where page_color is an array like ["#cc71b8"]
      if (Array.isArray(colorData)) {
        const primary = colorData[0] || defaultColors.primary;
        const secondary = colorData[1] || primary;
        const background = colorData[2] || "#ffffff";
        const text = colorData[3] || "#1f2937";
        return {
          primary,
          secondary,
          background,
          text,
          card: "#ffffff",
          border: "#e5e7eb",
        };
      }

      // 🟢 Handle object-based color data
      const finalColors = {
        primary: colorData.primary || colorData.main || colorData.color || defaultColors.primary,
        secondary: colorData.secondary || colorData.accent || defaultColors.secondary,
        background: colorData.background || colorData.bg || defaultColors.background,
        text: colorData.text || colorData.foreground || defaultColors.text,
        card: colorData.card || colorData.surface || defaultColors.card,
        border: colorData.border || colorData.outline || defaultColors.border,
      };

      console.log("🎯 Final colors to be used:", finalColors);
      return finalColors;
    } catch (error) {
      console.error("❌ Error parsing page_color:", error);
      console.log("📋 Raw page_color value that failed:", eventData.page_color);
      return defaultColors;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const currentColors = colors || getEventColors(event);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: currentColors.background }}
    >
      {/* Debug info - remove in production */}
      <div className="fixed top-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
        Colors: {JSON.stringify(currentColors)}
      </div>

      {/* Event Header */}
      <EventHeader event={event} colors={currentColors} />

      {/* Main Section */}
      <div className="pt-1">
        <div
          className="shadow-sm border-b transition-colors duration-300"
          style={{
            borderColor: `${currentColors.primary}20`,
            backgroundColor: currentColors.background,
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4 mb-4">
              <a
                href={`/myevent/${eventId}`}
                className="flex items-center space-x-2 transition-colors hover:underline font-medium"
                style={{ color: currentColors.primary }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Event</span>
              </a>
            </div>

            <h1
              className="text-3xl font-bold mb-6 transition-colors duration-300"
              style={{ color: currentColors.text }}
            >
              {event.title}
            </h1>

            {/* Form Toggle */}
            <div className="flex space-x-1 p-1 rounded-lg bg-gray-100 max-w-md">
              <button
                onClick={() => setActiveForm("other")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeForm === "other"
                    ? "shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={{
                  backgroundColor: activeForm === "other" ? currentColors.card : "transparent",
                  color: activeForm === "other" ? currentColors.primary : currentColors.text,
                  border: activeForm === "other" ? `1px solid ${currentColors.border}` : "1px solid transparent",
                }}
              >
                Other Forms
              </button>
              <button
                onClick={() => setActiveForm("candidate")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeForm === "candidate"
                    ? "shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={{
                  backgroundColor: activeForm === "candidate" ? currentColors.card : "transparent",
                  color: activeForm === "candidate" ? currentColors.primary : currentColors.text,
                  border: activeForm === "candidate" ? `1px solid ${currentColors.border}` : "1px solid transparent",
                }}
              >
                Candidate Form
              </button>
            </div>
          </div>
        </div>

        {/* Forms Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeForm === "other" ? (
            <FormsDisplay eventId={eventId} colors={currentColors} />
          ) : (
            <CandidatesForm eventId={eventId} colors={currentColors} />
          )}
        </div>
      </div>
    </div>
  );
}