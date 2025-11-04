"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import {
  Coins,
  BarChart3,
  MessageCircle,
  Settings,
  PlusCircle,
  Wallet,
  Home,
  Calendar,
  Pencil,
  X,
  LogOut,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
} from "lucide-react";

import CreateEventClient from "./CreateEventClient";
import WalletComponent from "../../../components/WalletComponent";
import PublisherChat from "../../../components/chat";
import MyEvents from "../../../components/MyEvents";
import TransactionHistory from "../../../components/temp";
import SettingsComponent from "../../../components/settings";

export default function PublisherDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [balance, setBalance] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [stats, setStats] = useState({
    eventsCreated: 0,
    tokensGenerated: 0,
    tokensSpent: 0,
    revenue: 0,
    activeEvents: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // ✅ Load user + publisher data
  useEffect(() => {
    const getUserAndPublisher = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (params.id !== user.id) {
        router.replace(`/publisherdashboard/${user.id}`);
        return;
      }

      setUser(user);

      const { data: publisherData, error: pubError } = await supabase
        .from("publishers")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      if (!pubError) setPublisher(publisherData);

      const { data: walletData } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      setBalance(walletData?.balance ?? 0);
    };

    getUserAndPublisher();
  }, [router, params.id]);

  // ✅ Fetch events for this publisher
  const fetchEvents = async () => {
    if (!user) return;
    setLoadingEvents(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setEvents(data);
    setLoadingEvents(false);
  };

  // ✅ Fetch dynamic statistics
  const fetchStats = async () => {
    if (!user) return;
    setLoadingStats(true);

    try {
      // 1. Events Created - count all events by this user
      const { count: eventsCreated, error: eventsCountError } = await supabase
        .from("events")
        .select('*', { count: 'exact', head: true })
        .eq("user_id", user.id);

      if (eventsCountError) {
        console.error("Events count error:", eventsCountError);
        throw eventsCountError;
      }

      // 2. Active Events - count events where active is TRUE
      const { count: activeEvents, error: activeEventsError } = await supabase
        .from("events")
        .select('*', { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("active", true);

      if (activeEventsError) {
        console.error("Active events count error:", activeEventsError);
        throw activeEventsError;
      }

      // 3. Token Transactions - calculate tokens generated excluding token top ups
      const { data: tokenData, error: tokenError } = await supabase
        .from("token_transactions")
        .select("tokens_in, tokens_out, description")
        .eq("user_id", user.id);

      if (tokenError) {
        console.error("Token transactions fetch error:", tokenError);
        throw tokenError;
      }

      console.log("Token data:", tokenData); // Debug log

      // Filter out "top up from paystack" transactions first, then sum tokens_in
      const tokensGenerated = tokenData
        ?.filter(transaction => {
          return !transaction.description || 
                 !transaction.description.toLowerCase().includes("top up from paystack");
        })
        ?.reduce((sum, transaction) => sum + (Number(transaction.tokens_in) || 0), 0) || 0;

      // Calculate tokens spent (sum of all tokens_out)
      const tokensSpent = tokenData
        ?.reduce((sum, transaction) => sum + (Number(transaction.tokens_out) || 0), 0) || 0;

      // Revenue calculation: total token generated × 1000 naira minus 10%
      const revenueBeforeDeduction = tokensGenerated * 1000;
      const tenPercentDeduction = revenueBeforeDeduction * 0.10;
      const revenue = revenueBeforeDeduction - tenPercentDeduction;

      console.log("Calculated stats:", {
        eventsCreated,
        activeEvents, 
        tokensGenerated,
        tokensSpent,
        revenueBeforeDeduction,
        tenPercentDeduction,
        revenue
      }); // Debug log

      setStats({
        eventsCreated: eventsCreated || 0,
        tokensGenerated,
        tokensSpent,
        revenue: Math.max(0, revenue), // Ensure revenue is not negative
        activeEvents: activeEvents || 0
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
      // Optional: set error state for UI feedback
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchStats();
    }
  }, [user]);

  // ✅ Logout function with confirmation
  const handleLogout = async () => {
    // Confirm with user before logging out
    if (!confirm("Are you sure you want to log out?")) {
      return;
    }

    try {
      // Sign out from Supabase auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear local state
      setUser(null);
      setPublisher(null);
      setEvents([]);
      setStats({
        eventsCreated: 0,
        tokensGenerated: 0,
        tokensSpent: 0,
        revenue: 0,
        activeEvents: 0
      });

      // Redirect to login page
      router.push("/login");
      
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out. Please try again.");
    }
  };

  // ✅ Improved Avatar upload function
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB");
      return;
    }

    setUploading(true);

    try {
      const folderPath = `publishers/${user.id}`;
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // 1️⃣ Delete old avatar if exists
      if (publisher?.avatar_url) {
        try {
          const urlParts = publisher.avatar_url.split("/profilephoto/");
          const oldPath = urlParts[1]; // e.g. "publishers/uuid/filename.png"
          if (oldPath) {
            await supabase.storage.from("profilephoto").remove([oldPath]);
            console.log("Old avatar removed:", oldPath);
          }
        } catch (removeErr) {
          console.warn("Failed to remove old avatar:", removeErr.message);
        }
      }

      // 2️⃣ Upload the new image
      const { error: uploadError } = await supabase.storage
        .from("profilephoto")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 3️⃣ Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profilephoto").getPublicUrl(filePath);

      // 4️⃣ Update DB record
      const { data, error } = await supabase
        .from("publishers")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)
        .select("id, avatar_url")
        .single();

      if (error) throw error;

      // 5️⃣ Update UI
      setPublisher((prev) => ({
        ...prev,
        avatar_url: publicUrl,
      }));

      alert("Avatar updated successfully!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert(`Failed to upload avatar: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "transactions", label: "Transactions", icon: Coins },
    { id: "events", label: "My Events", icon: PlusCircle },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (!user || !publisher)
    return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logo */}
      <div className="bg-white p-4 flex justify-center border-b">
        <img
          src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/gleedzlogo.png"
          alt="Gleeds Logo"
          className="h-12"
        />
      </div>

      {/* Header */}
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <img
              src={publisher.avatar_url || "/publisher-avatar.png"}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-yellow-600 object-cover"
            />
            <label className={`absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow cursor-pointer hover:bg-gray-100 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Pencil size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="text-white text-xs">Uploading...</div>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg">
              {publisher.name || "Publisher"}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href="/" className="text-yellow-600 hover:text-yellow-500">
            <Home size={24} />
          </a>
          <a href="/events" className="text-yellow-600 hover:text-yellow-500">
            <Calendar size={24} />
          </a>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
          
          <div className="bg-yellow-600 text-white px-4 py-2 rounded-full text-sm">
            Tokens: <strong>{balance}</strong>
          </div>
        </div>

        {/* Mobile Logout Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="p-2 bg-red-500 text-white rounded-lg"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
          <div className="bg-yellow-600 text-white px-4 py-2 rounded-full text-sm">
            Tokens: <strong>{balance}</strong>
          </div>
        </div>
      </header>

      {/* Tabs - Mobile Optimized */}
      <nav className="flex overflow-x-auto bg-white border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 border-b-2 text-xs md:text-sm ${
                activeTab === tab.id
                  ? "border-yellow-600 text-yellow-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={14} className="md:w-4 md:h-4" /> 
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <main className="p-4">
        {activeTab === "overview" && (
          <OverviewTab 
            stats={stats} 
            loading={loadingStats} 
            onRefresh={fetchStats}
          />
        )}
        {activeTab === "wallet" && <WalletComponent />}
        {activeTab === "transactions" && <TransactionHistory />}
        {activeTab === "events" && (
          <MyEvents
            events={events}
            loading={loadingEvents}
            onCreateEvent={() => setShowCreateEvent(true)}
          />
        )}
        {activeTab === "chat" && <PublisherChat />}
        {activeTab === "settings" && <SettingsComponent />}
      </main>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 relative shadow-lg overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowCreateEvent(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Create New Event</h2>
            <CreateEventClient
              publisherId={user.id}
              onSuccess={() => {
                fetchEvents(); // ✅ refresh event list
                fetchStats(); // ✅ refresh stats
                setShowCreateEvent(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Sub Components =====
function OverviewTab({ stats, loading, onRefresh }) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const statCards = [
    {
      title: "Events Created",
      value: formatNumber(stats.eventsCreated),
      description: "Total events created",
      icon: Activity,
      color: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "Tokens Generated",
      value: formatNumber(stats.tokensGenerated),
      description: "Earned tokens (excl. top-ups)",
      icon: TrendingUp,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Tokens Spent",
      value: formatNumber(stats.tokensSpent),
      description: "Total tokens spent",
      icon: TrendingDown,
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.revenue),
      description: "Net revenue after 10% fee",
      icon: Coins,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Active Events",
      value: formatNumber(stats.activeEvents),
      description: "Currently running events",
      icon: Users,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border animate-pulse">
              <div className="h-3 bg-gray-200 rounded mb-2 md:mb-3"></div>
              <div className="h-6 md:h-8 bg-gray-200 rounded mb-1 md:mb-2"></div>
              <div className="h-2 md:h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="text-center text-gray-500 py-4 md:py-8 text-sm md:text-base">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Performance Overview</h2>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Your publishing performance metrics</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 md:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2"
        >
          <BarChart3 size={14} className="md:w-4 md:h-4" />
          Refresh Stats
        </button>
      </div>
      
      {/* Stats Grid - 2 columns on mobile, 3-5 on larger screens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, bgColor, borderColor }) {
  const getIconColor = (color) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'red': return 'text-red-600';
      case 'blue': return 'text-blue-600';
      case 'yellow': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`${bgColor} border ${borderColor} p-3 md:p-5 rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${getIconColor(bgColor.split('-')[1])}`} />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:inline">
          {title}
        </span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide md:hidden">
          {title.split(' ')[0]}
        </span>
      </div>
      <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500 leading-relaxed hidden md:block">{description}</p>
      <p className="text-xs text-gray-500 leading-relaxed md:hidden">
        {description.split(' ').slice(0, 3).join(' ')}...
      </p>
    </div>
  );
}