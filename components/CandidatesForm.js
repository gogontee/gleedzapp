// components/CandidatesForm.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { 
  Edit, 
  Save, 
  X, 
  Upload, 
  Plus, 
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Loader,
  MapPin,
  Coins
} from "lucide-react";

export default function CandidatesForm({ eventId, colors }) {
  const user = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "Candidate Registration",
    description: "Join us as a candidate for this event",
    is_public: true,
    is_paid: false,
    token_price: 0,
    banner_url: "",
  });
  const [candidateData, setCandidateData] = useState({
    full_name: "",
    nick_name: "",
    about: "",
    photo: "",
    banner: "",
    location: "",
    gallery: []
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkOwnership();
    loadFormConfig();
    loadEvent();
    checkIfApplied();
  }, [eventId, user]);

  const checkOwnership = async () => {
    if (!user) {
      setIsOwner(false);
      setLoading(false);
      return;
    }

    try {
      const { data: event, error } = await supabase
        .from("events")
        .select("user_id")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setIsOwner(event?.user_id === user.id);
    } catch (error) {
      console.error("Error checking ownership:", error);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  };

  const loadEvent = async () => {
    try {
      const { data: eventData, error } = await supabase
        .from("events")
        .select("name, title")
        .eq("id", eventId)
        .single();

      if (eventData && !error) {
        setEvent(eventData);
      }
    } catch (error) {
      console.error("Error loading event:", error);
    }
  };

  const loadFormConfig = async () => {
    try {
      const { data: config, error } = await supabase
        .from("candidate_forms")
        .select("*")
        .eq("event_id", eventId)
        .single();

      if (config && !error) {
        setFormData(config);
      }
    } catch (error) {
      console.error("Error loading form config:", error);
    }
  };

  const checkIfApplied = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setHasApplied(true);
      }
    } catch (error) {
      console.error("Error checking application status:", error);
    }
  };

  const saveFormConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("candidate_forms")
        .upsert({
          event_id: eventId,
          ...formData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving form config:", error);
      alert("Error saving form configuration");
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file, path) => {
    try {
      const { data, error } = await supabase.storage
        .from("candidates")
        .upload(path, file);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("candidates")
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = `form-banners/${eventId}/${Date.now()}-${file.name}`;
      const url = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, banner_url: url }));
    } catch (error) {
      alert("Error uploading banner");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (field, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!user) {
      alert("Please sign in to upload files");
      return;
    }

    setUploading(true);
    try {
      const path = `candidate-${field}/${eventId}/${user.id}/${Date.now()}-${file.name}`;
      const url = await uploadFile(file, path);
      setCandidateData(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      alert(`Error uploading ${field}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (!user) {
      alert("Please sign in to upload files");
      return;
    }

    if (!files.length || candidateData.gallery.length + files.length > 6) {
      alert("Maximum 6 photos allowed in gallery");
      return;
    }

    setUploading(true);
    try {
      const newGalleryItems = await Promise.all(
        files.map(async (file) => {
          const path = `candidate-gallery/${eventId}/${user.id}/${Date.now()}-${file.name}`;
          const url = await uploadFile(file, path);
          return { url, caption: "" };
        })
      );

      setCandidateData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newGalleryItems]
      }));
    } catch (error) {
      alert("Error uploading gallery photos");
    } finally {
      setUploading(false);
    }
  };

  const updateGalleryCaption = (index, caption) => {
    setCandidateData(prev => ({
      ...prev,
      gallery: prev.gallery.map((item, i) => 
        i === index ? { ...item, caption } : item
      )
    }));
  };

  const removeGalleryItem = (index) => {
    setCandidateData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const checkWalletBalance = async () => {
    if (!user) return false;

    try {
      const { data: wallet, error } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return wallet?.balance >= formData.token_price;
    } catch (error) {
      console.error("Error checking wallet balance:", error);
      return false;
    }
  };

  const deductTokens = async () => {
    try {
      // Get current balance
      const { data: wallet, error: walletError } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (walletError) throw walletError;

      const newBalance = wallet.balance - formData.token_price;
      const lastAction = `${event?.name || event?.title} - ${formData.title}`;

      // Update wallet
      const { error: updateError } = await supabase
        .from("token_wallets")
        .update({
          balance: newBalance,
          last_action: lastAction,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error("Error deducting tokens:", error);
      return false;
    }
  };

  const submitCandidateForm = async () => {
    if (!candidateData.full_name) {
      alert("Full name is required");
      return;
    }

    if (!user) {
      alert("Please sign in to submit the form");
      return;
    }

    if (hasApplied) {
      alert("You have already submitted an application for this event.");
      return;
    }

    // If form is paid, show payment confirmation modal
    if (formData.is_paid && formData.token_price > 0) {
      setShowPaymentModal(true);
      return;
    }

    // For free forms, proceed directly
    await processFormSubmission();
  };

  const processFormSubmission = async () => {
    setSaving(true);

    try {
      // For paid forms, deduct tokens first
      if (formData.is_paid && formData.token_price > 0) {
        const hasSufficientBalance = await checkWalletBalance();
        if (!hasSufficientBalance) {
          alert(`Insufficient token balance. You need ${formData.token_price} tokens to submit this application. Please top up your token wallet and try again.`);
          setSaving(false);
          setShowPaymentModal(false);
          return;
        }

        const deductionSuccess = await deductTokens();
        if (!deductionSuccess) {
          alert("Error processing payment. Please try again.");
          setSaving(false);
          setShowPaymentModal(false);
          return;
        }
      }

      // Submit candidate application
      const { error } = await supabase
        .from("candidates")
        .insert({
          event_id: eventId,
          user_id: user.id,
          ...candidateData,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      alert("Application submitted successfully!");
      setCandidateData({
        full_name: "",
        nick_name: "",
        about: "",
        photo: "",
        banner: "",
        location: "",
        gallery: []
      });
      setHasApplied(true);
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error submitting candidate form:", error);
      alert("Error submitting application");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  // Check if form is not public and user is not owner
  if (!formData.is_public && !isOwner) {
    return (
      <div className="text-center py-12">
        <EyeOff className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: colors.primary }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
          Candidate Form Not Available
        </h3>
        <p className="text-gray-600" style={{ color: colors.text }}>
          {event?.name || event?.title} candidate form is not currently accepting applications. Please check back later.
        </p>
      </div>
    );
  }

  // Check if user has already applied
  if (hasApplied && !isOwner) {
    return (
      <div className="text-center py-12">
        <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: colors.primary }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
          Application Already Submitted
        </h3>
        <p className="text-gray-600 mb-4" style={{ color: colors.text }}>
          You have already submitted an application for {event?.name || event?.title}.
        </p>
        <p className="text-sm text-gray-500">
          You can apply to other events or forms.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <Coins className="w-12 h-12 mx-auto mb-4" style={{ color: colors.primary }} />
              <h3 className="text-xl font-semibold mb-2">Confirm Payment</h3>
              <p className="text-gray-600 mb-4">
                {formData.token_price} token(s) will be deducted from your wallet for the application fee.
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Event: {event?.name || event?.title}
              </p>
              <p className="text-sm text-gray-500">
                Form: {formData.title}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processFormSubmission}
                disabled={saving}
                className="flex-1 py-2 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {saving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Pay ${formData.token_price} Token(s)`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Button - Only visible to owner */}
      {isOwner && !isEditing && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: colors.primary,
              color: '#ffffff',
            }}
          >
            <Edit className="w-4 h-4" />
            <span>Edit Form</span>
          </button>
        </div>
      )}

      {/* Form Banner */}
      {(formData.banner_url || isEditing) && (
        <div className="mb-6">
          <div 
            className="w-full h-28 rounded-lg bg-cover bg-center mb-2 relative"
            style={{ 
              backgroundImage: formData.banner_url ? `url(${formData.banner_url})` : 'none',
              backgroundColor: formData.banner_url ? 'transparent' : colors.primary + '20'
            }}
          >
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <label className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100">
                  <Upload className="w-4 h-4" />
                  <span>{formData.banner_url ? 'Change Banner' : 'Upload Banner'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>
          {isEditing && formData.banner_url && (
            <button
              onClick={() => setFormData(prev => ({ ...prev, banner_url: "" }))}
              className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove Banner</span>
            </button>
          )}
        </div>
      )}

      {/* Form Configuration - Only visible in edit mode */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border" style={{ borderColor: colors.border }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Form Configuration</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Form Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Form Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Public Form</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_paid}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
                  className="rounded"
                />
                <span className="flex items-center space-x-1 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>Paid Form</span>
                </span>
              </label>
            </div>

            {formData.is_paid && (
              <div>
                <label className="block text-sm font-medium mb-1">Token Price</label>
                <input
                  type="number"
                  value={formData.token_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, token_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={saveFormConfig}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                }}
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Form */}
      <div className="bg-white rounded-lg shadow-md p-6 border" style={{ borderColor: colors.border }}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            {formData.title}
          </h2>
          <p className="text-gray-600 mb-4" style={{ color: colors.text }}>
            {formData.description}
          </p>
          
          {/* Fee Display */}
          {formData.is_paid && formData.token_price > 0 && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
              <Coins className="w-4 h-4" style={{ color: colors.primary }} />
              <span className="text-sm font-medium" style={{ color: colors.primary }}>
                Fee: {formData.token_price} Token(s)
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Full Name *
            </label>
            <input
              type="text"
              value={candidateData.full_name}
              onChange={(e) => setCandidateData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                borderColor: colors.border,
                focusBorderColor: colors.primary 
              }}
              placeholder="Enter your full name"
            />
          </div>

          {/* Nick Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Nick Name
            </label>
            <input
              type="text"
              value={candidateData.nick_name}
              onChange={(e) => setCandidateData(prev => ({ ...prev, nick_name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                borderColor: colors.border,
                focusBorderColor: colors.primary 
              }}
              placeholder="Enter your preferred nickname"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={candidateData.location}
                onChange={(e) => setCandidateData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="Enter your location"
              />
            </div>
          </div>

          {/* About You */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              About You
            </label>
            <textarea
              value={candidateData.about}
              onChange={(e) => setCandidateData(prev => ({ ...prev, about: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                borderColor: colors.border,
                focusBorderColor: colors.primary 
              }}
              placeholder="Tell us about yourself, your background, and why you're interested..."
            />
          </div>

          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Profile Photo
            </label>
            <div className="flex items-center space-x-4">
              {candidateData.photo && (
                <img 
                  src={candidateData.photo} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <label className="flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-4 h-4" />
                <span>{candidateData.photo ? 'Change Photo' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload('photo', e)}
                  disabled={uploading || !user}
                />
              </label>
            </div>
            {!user && (
              <p className="text-sm text-orange-600 mt-1">Please sign in to upload photos</p>
            )}
          </div>

          {/* Banner Photo */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Banner Photo
            </label>
            <div className="space-y-2">
              {candidateData.banner && (
                <img 
                  src={candidateData.banner} 
                  alt="Banner" 
                  className="w-full h-32 rounded-lg object-cover"
                />
              )}
              <label className="flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-4 h-4" />
                <span>{candidateData.banner ? 'Change Banner' : 'Upload Banner'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload('banner', e)}
                  disabled={uploading || !user}
                />
              </label>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Gallery Photos (Max 6)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {candidateData.gallery.map((item, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={item.url} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 rounded-lg object-cover"
                  />
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => updateGalleryCaption(index, e.target.value)}
                    placeholder="Add caption..."
                    className="w-full mt-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1"
                    style={{ 
                      borderColor: colors.border,
                      focusBorderColor: colors.primary 
                    }}
                  />
                  <button
                    onClick={() => removeGalleryItem(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {candidateData.gallery.length < 6 && (
                <label className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 h-24 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryUpload}
                    disabled={!user}
                  />
                </label>
              )}
            </div>
            {!user && (
              <p className="text-sm text-orange-600">Please sign in to add gallery photos</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              onClick={submitCandidateForm}
              disabled={saving || !candidateData.full_name || !user || hasApplied}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              {saving ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : !user ? (
                "Please Sign In to Submit"
              ) : hasApplied ? (
                "Application Already Submitted"
              ) : formData.is_paid && formData.token_price > 0 ? (
                `Submit Application - ${formData.token_price} Token(s)`
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}