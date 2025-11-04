"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";
import { Bell, Clock, X } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch notifications belonging to the logged-in user
  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No logged-in user found");
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle closing a notification (only hides locally)
  const closeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Time formatting utility
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60 text-gray-500">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <Bell className="mx-auto w-10 h-10 mb-2 text-gray-400" />
        No notifications yet.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
        Notifications
      </h2>

      {notifications.map((n) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl p-4 flex items-start gap-3 relative"
        >
          {/* Close Button */}
          <button
            onClick={() => closeNotification(n.id)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="p-2 bg-orange-100 rounded-full text-orange-600">
            <Bell size={18} />
          </div>

          {/* Notification Text */}
          <div className="flex-1">
            <p className="text-gray-900 font-medium">{n.title || "Notification"}</p>
            {n.message && (
              <p className="text-gray-600 text-sm mt-1">{n.message}</p>
            )}
            <div className="flex items-center text-gray-400 text-xs mt-2">
              <Clock size={12} className="mr-1" />
              {formatTimeAgo(n.created_at)}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
