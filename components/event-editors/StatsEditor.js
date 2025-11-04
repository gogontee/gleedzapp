"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Plus, Trash } from "lucide-react";

// Import some Lucide icons for use
import { Users,
  Trophy,
  Star,
  Award,
  Briefcase,
  Calendar,
  Image,
  Video,
  Music,
  FileText,
  Globe,
  Settings,
  Bell,
  Heart,
  MessageCircle,
  ShoppingCart,
  ChartBar,
  CheckCircle,
  XCircle,
  PlusCircle,
  MinusCircle,
  Edit,
  Upload,
  Download,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock, } from "lucide-react";

const ICONS = {
  Users,
  Trophy,
  Star,
  Award,
  Briefcase,
  Calendar,
  Image,
  Video,
  Music,
  FileText,
  Globe,
  Settings,
  Bell,
  Heart,
  MessageCircle,
  ShoppingCart,
  ChartBar,
  CheckCircle,
  XCircle,
  PlusCircle,
  MinusCircle,
  Edit,
  Upload,
  Download,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock,
};

export default function StatEditor({ pageantId }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("pageant_stats")
        .select("*")
        .eq("pageant_id", pageantId);

      if (error) console.error(error);
      else setStats(data || []);
    };
    fetchStats();
  }, [pageantId]);

  // Add new stat
  const handleAddStat = () => {
    setStats([
      ...stats,
      { label: "", value: "", icon: "Users" }, // default icon
    ]);
  };

  // Delete stat
  const handleDelete = (idx) => {
    const updated = stats.filter((_, i) => i !== idx);
    setStats(updated);
  };

  // Save stats to DB
  const handleSave = async () => {
    setLoading(true);
    setError("");

    // wipe old stats
    await supabase.from("pageant_stats").delete().eq("pageant_id", pageantId);

    // insert fresh ones
    const { error } = await supabase.from("pageant_stats").insert(
      stats.map((s) => ({
        pageant_id: pageantId,
        label: s.label,
        value: s.value,
        icon: s.icon,
      }))
    );

    setLoading(false);

    if (error) {
      console.error(error);
      setError("Error saving stats.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Stats Editor</h2>
      {error && <p className="text-red-500">{error}</p>}

      {stats.map((s, idx) => {
        const Icon = ICONS[s.icon] || Users;
        return (
          <div key={idx} className="border p-4 rounded space-y-3 relative">
            <button
              onClick={() => handleDelete(idx)}
              className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded"
            >
              <Trash size={14} />
            </button>

            {/* Icon Picker */}
            <div>
              <label className="block font-semibold">Icon</label>
              <select
                value={s.icon}
                onChange={(e) => {
                  const updated = [...stats];
                  updated[idx].icon = e.target.value;
                  setStats(updated);
                }}
                className="border px-3 py-2 rounded w-full"
              >
                {Object.keys(ICONS).map((iconName) => (
                  <option key={iconName} value={iconName}>
                    {iconName}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-2">
                <Icon className="w-6 h-6" /> <span>Preview</span>
              </div>
            </div>

            {/* Label */}
            <div>
              <label className="block font-semibold">Label</label>
              <input
                type="text"
                value={s.label}
                onChange={(e) => {
                  const updated = [...stats];
                  updated[idx].label = e.target.value;
                  setStats(updated);
                }}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {/* Value */}
            <div>
              <label className="block font-semibold">Value</label>
              <input
                type="text"
                value={s.value}
                onChange={(e) => {
                  const updated = [...stats];
                  updated[idx].value = e.target.value;
                  setStats(updated);
                }}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
        );
      })}

      {/* Add new stat */}
      <button
        onClick={handleAddStat}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        <Plus size={16} /> Add Stat
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save Stats"}
      </button>
    </div>
  );
}
