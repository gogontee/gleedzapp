// app/events/mall/page.js
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import {
  Building,
  Users,
  MapPin,
  Palette,
  Mic,
  Music,
  UserCheck,
  Camera,
  Crown,
  Sparkles,
  Search,
  Filter,
  Star,
  Trophy,
  Armchair,
  Home,
  Calendar,
  LayoutDashboard
} from "lucide-react";
import Image from "next/image";

const mallTabs = [
  {
    id: "pre-production",
    label: "Pre-Production",
    icon: Building,
    color: "blue",
    description: "Media houses, production companies, and planning services"
  },
  {
    id: "talent",
    label: "Influencers",
    icon: Users,
    color: "purple",
    description: "Influencers, celebrities, performers, and artists"
  },
  {
    id: "venues",
    label: "Event Venues",
    icon: MapPin,
    color: "green",
    description: "Event spaces, halls, outdoor venues, and locations"
  },
  {
    id: "creatives",
    label: "Event Creatives",
    icon: Palette,
    color: "pink",
    description: "Planners, designers, decorators, and creative directors"
  },
  {
    id: "hosting",
    label: "Hosts & MCs",
    icon: Mic,
    color: "orange",
    description: "Event hosts, MCs, presenters, and speakers"
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Music,
    color: "red",
    description: "DJs, bands, dancers, and entertainment acts"
  },
  {
    id: "staff",
    label: "Event Staff",
    icon: UserCheck,
    color: "indigo",
    description: "Ushers, security, coordinators, and support staff"
  },
  {
    id: "rentals",
    label: "Equipment Rentals",
    icon: Armchair,
    color: "teal",
    description: "Stages, chairs, tables, canopies, and furniture"
  },
  {
    id: "media",
    label: "Media & Photography",
    icon: Camera,
    color: "cyan",
    description: "Photographers, videographers, and media coverage"
  },
  {
    id: "pageant",
    label: "Pageant Specialties",
    icon: Crown,
    color: "yellow",
    description: "Crowns, sashes, awards, and pageant-specific items"
  },
  {
    id: "effects",
    label: "Special Effects",
    icon: Sparkles,
    color: "amber",
    description: "Fireworks, lighting, pyrotechnics, and effects"
  },
  {
    id: "winners",
    label: "Winner's Packages",
    icon: Trophy,
    color: "emerald",
    description: "Winner pops, trophies, prizes, and recognition items"
  }
];

// Main component
export default function EventMallPage() {
  const [activeTab, setActiveTab] = useState("pre-production");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: user } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", session.user.id)
          .single();

        if (user.role === "publisher") {
          const { data: publisher } = await supabase
            .from("publishers")
            .select("id, avatar_url, full_name")
            .eq("id", user.id)
            .single();
          setUserData({ ...user, ...publisher });
        } else if (user.role === "fans") {
          const { data: fan } = await supabase
            .from("fans")
            .select("id, avatar_url, full_name")
            .eq("id", user.id)
            .single();
          setUserData({ ...user, ...fan });
        }
      }
    };

    getUserData();
  }, []);

  const handleDashboardClick = () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (userData?.role === "publisher") {
      router.push(`/publisherdashboard/${userData.id}`);
    } else if (userData?.role === "fans") {
      router.push(`/fansdashboard/${userData.id}`);
    }
  };

  // Component mapping - defined after all components
  const getActiveTabComponent = () => {
    const props = { searchQuery, selectedCategory, onCategoryChange: setSelectedCategory };
    
    switch (activeTab) {
      case "pre-production":
        return <PreProductionTab {...props} />;
      case "talent":
        return <TalentTab {...props} />;
      case "venues":
        return <VenuesTab {...props} />;
      case "creatives":
        return <CreativesTab {...props} />;
      case "hosting":
        return <HostingTab {...props} />;
      case "entertainment":
        return <EntertainmentTab {...props} />;
      case "staff":
        return <StaffTab {...props} />;
      case "rentals":
        return <RentalsTab {...props} />;
      case "media":
        return <MediaTab {...props} />;
      case "pageant":
        return <PageantTab {...props} />;
      case "effects":
        return <EffectsTab {...props} />;
      case "winners":
        return <WinnersTab {...props} />;
      default:
        return <PreProductionTab {...props} />;
    }
  };

  // Filter providers based on search and category
  const filteredProviders = (providers) => {
    return providers.filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           provider.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           provider.specialties.some(specialty => 
                             specialty.toLowerCase().includes(searchQuery.toLowerCase())
                           );
      
      const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/gleedzlogo.png"
                alt="Gleedz Logo"
                width={80}
                height={40}
                className="h-8 md:h-10 w-auto"
                unoptimized
              />
            </div>
            
            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-gray-700 hover:text-yellow-600 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </button>
              <button
                onClick={() => router.push("/events")}
                className="flex items-center gap-2 text-gray-700 hover:text-yellow-600 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Events</span>
              </button>
              <button
                onClick={handleDashboardClick}
                className="flex items-center gap-2 text-gray-700 hover:text-yellow-600 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="flex gap-2 md:gap-4">
              <div className="relative">
                <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32 md:w-64 text-sm md:text-base"
                />
              </div>
              <button className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs md:text-sm">
                <Filter className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Filter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title and Tagline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Event Mall</h1>
          <p className="text-sm md:text-lg text-gray-600 mt-1 md:mt-2">
            Your one-stop directory for all event services and providers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Category Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="flex overflow-x-auto pb-2 gap-1">
            {mallTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colorClasses = {
                blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                purple: isActive ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
                green: isActive ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
                pink: isActive ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-700 hover:bg-pink-100',
                orange: isActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
                red: isActive ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
                indigo: isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
                teal: isActive ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100',
                cyan: isActive ? 'bg-cyan-500 text-white' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
                yellow: isActive ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
                amber: isActive ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                emerald: isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }[tab.color];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-xs md:text-sm ${colorClasses}`}
                >
                  <Icon className="w-3 h-3 md:w-4 md:h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {getActiveTabComponent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Tab Content Components - Define all components first
function PreProductionTab({ searchQuery, selectedCategory, onCategoryChange }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Pre-Production Services</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Media houses, production companies, and planning services</p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <select 
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 md:px-3 py-1.5 md:py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm w-full md:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="media-house">Media House</option>
            <option value="production">Production Company</option>
            <option value="planning">Event Planning</option>
          </select>
        </div>
      </div>
      
      <div className="text-center py-8 md:py-12">
        <Building className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Pre-Production directory coming soon...</p>
      </div>
    </div>
  );
}

function TalentTab({ searchQuery, selectedCategory, onCategoryChange }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Influencers & Celebrities</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Influencers, celebrities, performers, and artists</p>
        </div>
      </div>
      
      <div className="text-center py-8 md:py-12">
        <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Influencers directory coming soon...</p>
      </div>
    </div>
  );
}

function VenuesTab({ searchQuery, selectedCategory, onCategoryChange }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Event Venues</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Event spaces, halls, outdoor venues, and locations</p>
        </div>
      </div>
      
      <div className="text-center py-8 md:py-12">
        <MapPin className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Venue directory coming soon...</p>
      </div>
    </div>
  );
}

// Simple placeholder components
function CreativesTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Event Creatives</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Planners, designers, decorators, and creative directors</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Palette className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Event Creatives directory coming soon...</p>
      </div>
    </div>
  );
}

function HostingTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Hosts & MCs</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Event hosts, MCs, presenters, and speakers</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Mic className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Hosts & MCs directory coming soon...</p>
      </div>
    </div>
  );
}

function EntertainmentTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Entertainment</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">DJs, bands, dancers, and entertainment acts</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Music className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Entertainment directory coming soon...</p>
      </div>
    </div>
  );
}

function StaffTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Event Staff</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Ushers, security, coordinators, and support staff</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <UserCheck className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Event Staff directory coming soon...</p>
      </div>
    </div>
  );
}

function RentalsTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Equipment Rentals</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Stages, chairs, tables, canopies, and furniture</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Armchair className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Equipment Rentals directory coming soon...</p>
      </div>
    </div>
  );
}

function MediaTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Media & Photography</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Photographers, videographers, and media coverage</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Camera className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Media & Photography directory coming soon...</p>
      </div>
    </div>
  );
}

function PageantTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Pageant Specialties</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Crowns, sashes, awards, and pageant-specific items</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Crown className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Pageant Specialties directory coming soon...</p>
      </div>
    </div>
  );
}

function EffectsTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Special Effects</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Fireworks, lighting, pyrotechnics, and effects</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Special Effects directory coming soon...</p>
      </div>
    </div>
  );
}

function WinnersTab() { 
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Winner's Packages</h2>
          <p className="text-xs md:text-base text-gray-600 mt-1">Winner pops, trophies, prizes, and recognition items</p>
        </div>
      </div>
      <div className="text-center py-8 md:py-12">
        <Trophy className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
        <p className="text-gray-500 text-sm md:text-base">Winner's Packages directory coming soon...</p>
      </div>
    </div>
  );
}