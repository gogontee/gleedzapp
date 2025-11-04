"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Save, Upload, User, Building, Phone, MapPin, FileText, Camera } from "lucide-react";

export default function SettingsComponent() {
  const [user, setUser] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    full_address: "",
    bio: ""
  });

  // Load user and publisher data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUser(user);

        // Fetch publisher data
        const { data: publisherData, error } = await supabase
          .from("publishers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching publisher:", error);
          setMessage({ type: 'error', text: 'Failed to load profile data' });
          return;
        }

        if (publisherData) {
          setPublisher(publisherData);
          setFormData({
            name: publisherData.name || "",
            company: publisherData.company || "",
            phone: publisherData.phone || "",
            full_address: publisherData.full_address || "",
            bio: publisherData.bio || ""
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage({ type: 'error', text: 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: 'error', text: 'Please select an image file (JPEG, PNG, etc.)' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Please select an image smaller than 5MB' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const folderPath = `publishers/${user.id}`;
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // Delete old avatar if exists
      if (publisher?.avatar_url) {
        try {
          const urlParts = publisher.avatar_url.split("/profilephoto/");
          const oldPath = urlParts[1];
          if (oldPath) {
            await supabase.storage.from("profilephoto").remove([oldPath]);
          }
        } catch (removeErr) {
          console.warn("Failed to remove old avatar:", removeErr.message);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("profilephoto")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profilephoto")
        .getPublicUrl(filePath);

      // Update publisher record
      const { error: updateError } = await supabase
        .from("publishers")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setPublisher(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });

    } catch (error) {
      console.error("Avatar upload error:", error);
      setMessage({ type: 'error', text: `Failed to upload avatar: ${error.message}` });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from("publishers")
        .update({
          name: formData.name,
          company: formData.company,
          phone: formData.phone,
          full_address: formData.full_address,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local publisher state
      setPublisher(prev => ({
        ...prev,
        ...formData
      }));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', text: `Failed to update profile: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your publisher profile information</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={publisher?.avatar_url || "/default-avatar.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update your profile picture
                </label>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <span className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-300">
                      <Camera size={16} className="mr-2" />
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </span>
                  </label>
                  <span className="text-sm text-gray-500">
                    JPG, PNG recommended. Max 5MB.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            
            {/* Name */}
            <div>
              <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="mr-2" />
                Display Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your display name"
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building size={16} className="mr-2" />
                Company/Organization
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your company name"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="full_address" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="mr-2" />
                Full Address
              </label>
              <textarea
                id="full_address"
                name="full_address"
                value={formData.full_address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                placeholder="Enter your complete address"
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="mr-2" />
                Bio/Description
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself and your events..."
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: publisher?.name || "",
                    company: publisher?.company || "",
                    phone: publisher?.phone || "",
                    full_address: publisher?.full_address || "",
                    bio: publisher?.bio || ""
                  });
                  setMessage({ type: '', text: '' });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Current Data Display (for debugging) */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Profile Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span> {publisher?.name || 'Not set'}
          </div>
          <div>
            <span className="font-medium text-gray-700">Company:</span> {publisher?.company || 'Not set'}
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone:</span> {publisher?.phone || 'Not set'}
          </div>
          <div>
            <span className="font-medium text-gray-700">Address:</span> {publisher?.full_address || 'Not set'}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700">Bio:</span> {publisher?.bio || 'Not set'}
          </div>
        </div>
      </div>
    </div>
  );
}