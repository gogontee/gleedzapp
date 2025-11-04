"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabaseClient";
import WalletComponent from "../../../components/WalletComponent";
import EventBook from "../../../components/EventBook";
import TicketBucket from "../../../components/TicketBucket";
import RegistrationBucket from "../../../components/RegistrationBucket";
import TransactionHistory from "../../../components/temp";
import Chat from "../../../components/chat";
import Notifications from "../../../components/Notifications";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Ticket, 
  BookOpen,
  Edit3,
  Star,
  Award,
  Heart,
  LogOut,
  Save,
  X,
  History,
  Home,
  MessageCircle,
  Bell
} from "lucide-react";

export default function FansDashboard() {
  const params = useParams();
  const router = useRouter();
  const fanId = params.id;
  
  const [fan, setFan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState({
    favoriteEvents: 0,
    ticketsPurchased: 0,
    registrations: 0,
    loyaltyPoints: 0
  });
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchFanData();
    fetchStats();
  }, [fanId]);

  const fetchFanData = async () => {
    try {
      setLoading(true);
      
      // First, check if user exists and has the correct role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', fanId)
        .single();

      if (userError || !userData) {
        console.error('User not found or error:', userError);
        return;
      }

      if (userData.role !== 'fans') {
        console.log('User is not a fan, redirecting...');
        // Redirect to appropriate dashboard based on role
        if (userData.role === 'publisher') {
          router.push(`/publisherdashboard/${fanId}`);
        }
        return;
      }

      // Fetch fan data from fans table
      const { data: fanData, error: fanError } = await supabase
        .from('fans')
        .select('*')
        .eq('id', fanId)
        .single();

      if (fanError) {
        console.error('Error fetching fan details:', fanError);
        // Create a basic fan profile if it doesn't exist
        await createFanProfile();
        return;
      }

      if (fanData) {
        setFan(fanData);
        setEditForm({
          full_name: fanData.full_name || '',
          phone: fanData.phone || '',
          country: fanData.country || '',
          state: fanData.state || '',
          city: fanData.city || '',
          bio: fanData.bio || ''
        });
      }
      
    } catch (error) {
      console.error('Error fetching fan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch favorite events count from users.favorite_events array
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('favorite_events')
        .eq('id', fanId)
        .single();

      let favoriteEventsCount = 0;
      if (!userError && userData && userData.favorite_events) {
        favoriteEventsCount = userData.favorite_events.length;
      }

      // Fetch tickets purchased count from myticket table
      const { count: ticketsPurchasedCount, error: ticketsError } = await supabase
        .from('myticket')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', fanId);

      // Fetch registrations count from form_submissions table
      const { count: registrationsCount, error: registrationsError } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', fanId);

      setStats({
        favoriteEvents: favoriteEventsCount || 0,
        ticketsPurchased: ticketsPurchasedCount || 0,
        registrations: registrationsCount || 0,
        loyaltyPoints: Math.floor((ticketsPurchasedCount || 0) * 10 + (registrationsCount || 0) * 5)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createFanProfile = async () => {
    try {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      const newFanData = {
        id: fanId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || 'Fan User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('fans')
        .insert([newFanData])
        .select()
        .single();

      if (error) throw error;

      setFan(data);
      setEditForm({
        full_name: data.full_name || '',
        phone: '',
        country: '',
        state: '',
        city: '',
        bio: ''
      });
      
    } catch (error) {
      console.error('Error creating fan profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updates = {
        ...editForm,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('fans')
        .update(updates)
        .eq('id', fanId);

      if (error) throw error;

      setFan(prev => ({ ...prev, ...updates }));
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      full_name: fan.full_name || '',
      phone: fan.phone || '',
      country: fan.country || '',
      state: fan.state || '',
      city: fan.city || '',
      bio: fan.bio || ''
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${fanId}-${Date.now()}.${fileExt}`;
      const filePath = `fan-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update fan record
      const { error: updateError } = await supabase
        .from('fans')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', fanId);

      if (updateError) throw updateError;

      setFan(prev => ({ ...prev, avatar_url: publicUrl }));
      alert('Profile picture updated successfully!');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading profile picture. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleEventsClick = () => {
    router.push('/events');
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowChat(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!fan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-indigo-100">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have access to the fan dashboard.</p>
          <div className="space-y-3">
            <button 
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button 
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'events', name: 'Event Book', icon: BookOpen },
    { id: 'tickets', name: 'My Tickets', icon: Ticket },
    { id: 'registrations', name: 'Registrations', icon: Calendar },
    { id: 'wallet', name: 'Wallet', icon: Award },
    { id: 'transactions', name: 'Transactions', icon: History }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateProfile}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{fan.full_name || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="flex items-center gap-3 p-2">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">{fan.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-2">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{fan.phone || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.country}
                          onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-2">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{fan.country || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.state}
                          onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-2">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{fan.state || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-2">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{fan.city || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{fan.bio || 'No bio provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats Card */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Favorite Events</span>
                    </div>
                    <span className="font-bold text-blue-600">{stats.favoriteEvents}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Tickets Purchased</span>
                    </div>
                    <span className="font-bold text-green-600">{stats.ticketsPurchased}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-700">Registrations</span>
                    </div>
                    <span className="font-bold text-purple-600">{stats.registrations}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700">Loyalty Points</span>
                    </div>
                    <span className="font-bold text-yellow-600">{stats.loyaltyPoints}</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('events')}
                    className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Browse Events</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('tickets')}
                    className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Ticket className="w-5 h-5 text-green-600" />
                    <span>View Tickets</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('wallet')}
                    className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Award className="w-5 h-5 text-purple-600" />
                    <span>Check Wallet</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <History className="w-5 h-5 text-indigo-600" />
                    <span>View Transactions</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'events':
        return <EventBook fanId={fanId} />;

      case 'tickets':
        return <TicketBucket fanId={fanId} />;

      case 'registrations':
        return <RegistrationBucket fanId={fanId} />;

      case 'wallet':
        return (
          <div className="space-y-6">
            <WalletComponent fanId={fanId} />
          </div>
        );

      case 'transactions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <History className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
            </div>
            <TransactionHistory userId={fanId} userType="fan" />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {fan.avatar_url ? (
                    <img 
                      src={fan.avatar_url} 
                      alt={fan.full_name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-yellow-600 text-white p-1 rounded-full cursor-pointer hover:bg-yellow-700 transition-colors">
                  <Edit3 className="w-3 h-3" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{fan.full_name || 'Fan User'}</h1>
                <p className="text-gray-600">Fan Dashboard</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={handleHomeClick}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </button>
              <button
                onClick={handleEventsClick}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Chat Icon */}
              <button
                onClick={toggleChat}
                className={`p-2 rounded-lg transition-colors ${
                  showChat 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* Notifications Icon */}
              <button
                onClick={toggleNotifications}
                className={`p-2 rounded-lg transition-colors ${
                  showNotifications 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <Bell className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-yellow-600 text-yellow-600 bg-yellow-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </main>

      {/* Chat Overlay - Centered on screen */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Chat onClose={() => setShowChat(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Overlay */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Notifications onClose={() => setShowNotifications(false)} />
          </div>
        </div>
      )}
    </div>
  );
}