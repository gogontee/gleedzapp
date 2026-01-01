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
  Coins,
  ChevronDown,
  Mail,
  Phone,
  User,
  Briefcase,
  Heart,
  Instagram,
  Facebook,
  Music,
  AlertCircle,
  Check
} from "lucide-react";
import Link from "next/link";

// Nigerian states including FCT
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory (FCT)", 
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", 
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

// Marital status options
const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed"];

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
    location: "", // Will store State of Origin
    local_government: "", // New field for LGA
    email: "",
    whatsapp_number: "",
    age: "",
    occupation: "",
    married: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    gallery: []
  });
  const [uploading, setUploading] = useState(false);
  const [showStatesDropdown, setShowStatesDropdown] = useState(false);
  const [lgas, setLgas] = useState([]);
  const [showLgaDropdown, setShowLgaDropdown] = useState(false);
  const [showMaritalDropdown, setShowMaritalDropdown] = useState(false);
  const [nigeriaData, setNigeriaData] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    checkOwnership();
    loadFormConfig();
    loadEvent();
    checkIfApplied();
    loadNigeriaData();
  }, [eventId, user]);

  // Load Nigeria data from Supabase - load ALL records
  const loadNigeriaData = async () => {
    try {
      const { data, error } = await supabase
        .from("nigeria")
        .select("*");

      if (error) {
        console.error("Error loading Nigeria data:", error);
        return;
      }

      if (data) {
        setNigeriaData(data);
        console.log("Nigeria data loaded:", data.length, "records");
      }
    } catch (error) {
      console.error("Error loading Nigeria data:", error);
    }
  };

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

  // Handle state selection
  const handleStateSelect = async (state) => {
    setCandidateData(prev => ({ 
      ...prev, 
      location: state,
      local_government: "" // Reset LGA when state changes
    }));
    setShowStatesDropdown(false);
    
    // Query database for the selected state
    if (nigeriaData.length > 0) {
      // Find the state in the loaded data
      const stateRecord = nigeriaData.find(item => 
        item.state && item.state.toLowerCase() === state.toLowerCase()
      );
      
      if (stateRecord && stateRecord.lga && Array.isArray(stateRecord.lga)) {
        console.log(`Found LGAs for ${state}:`, stateRecord.lga);
        setLgas(stateRecord.lga);
      } else {
        // If not found in loaded data, query the database directly
        console.log(`State ${state} not found in loaded data, querying database...`);
        await queryStateFromDatabase(state);
      }
    } else {
      // If no data loaded yet, query the database
      await queryStateFromDatabase(state);
    }
  };

  // Helper function to query state from database
  const queryStateFromDatabase = async (state) => {
    try {
      const { data, error } = await supabase
        .from("nigeria")
        .select("lga")
        .eq("state", state)
        .single();

      if (error) {
        console.error(`Error querying state ${state}:`, error);
        setLgas([]);
        return;
      }

      if (data && data.lga && Array.isArray(data.lga)) {
        console.log(`Database query found LGAs for ${state}:`, data.lga);
        setLgas(data.lga);
      } else {
        console.log(`No LGA data found for state: ${state}`);
        setLgas([]);
      }
    } catch (error) {
      console.error(`Error querying database for state ${state}:`, error);
      setLgas([]);
    }
  };

  // Handle LGA selection
  const handleLgaSelect = (lga) => {
    setCandidateData(prev => ({ ...prev, local_government: lga }));
    setShowLgaDropdown(false);
  };

  // Handle marital status selection
  const handleMaritalSelect = (status) => {
    setCandidateData(prev => ({ ...prev, married: status }));
    setShowMaritalDropdown(false);
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!candidateData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    
    if (!candidateData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!candidateData.whatsapp_number.trim()) {
      errors.whatsapp_number = "WhatsApp number is required";
    } else if (!/^[0-9+]{10,15}$/.test(candidateData.whatsapp_number.replace(/\s/g, ''))) {
      errors.whatsapp_number = "Please enter a valid WhatsApp number";
    }
    
    if (!candidateData.age.trim()) {
      errors.age = "Age is required";
    } else if (isNaN(candidateData.age) || parseInt(candidateData.age) < 18 || parseInt(candidateData.age) > 100) {
      errors.age = "Please enter a valid age (18-100)";
    }
    
    if (!candidateData.occupation.trim()) {
      errors.occupation = "Occupation is required";
    }
    
    if (!candidateData.married) {
      errors.married = "Marital status is required";
    }
    
    if (!candidateData.location) {
      errors.location = "State of origin is required";
    }
    
    if (candidateData.location && !candidateData.local_government) {
      errors.local_government = "LGA is required";
    }
    
    // Instagram encouragement (not required, but encouraged)
    if (!candidateData.instagram.trim()) {
      // This is just for encouragement, not an error
    }
    
    if (!acceptedTerms) {
      errors.terms = "You must accept the terms of use";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatesDropdown && !event.target.closest('.state-dropdown-container')) {
        setShowStatesDropdown(false);
      }
      if (showLgaDropdown && !event.target.closest('.lga-dropdown-container')) {
        setShowLgaDropdown(false);
      }
      if (showMaritalDropdown && !event.target.closest('.marital-dropdown-container')) {
        setShowMaritalDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showStatesDropdown, showLgaDropdown, showMaritalDropdown]);

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
    if (!validateForm()) {
      alert("Please fix the errors in the form before submitting.");
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
          age: parseInt(candidateData.age),
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
        local_government: "",
        email: "",
        whatsapp_number: "",
        age: "",
        occupation: "",
        married: "",
        instagram: "",
        facebook: "",
        tiktok: "",
        gallery: []
      });
      setHasApplied(true);
      setAcceptedTerms(false);
      setShowPaymentModal(false);
      setValidationErrors({});
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
            {validationErrors.full_name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.full_name}
              </p>
            )}
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

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={candidateData.email}
                onChange={(e) => setCandidateData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="you@example.com"
              />
            </div>
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              WhatsApp Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={candidateData.whatsapp_number}
                onChange={(e) => setCandidateData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="+234 800 000 0000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              For communication with event management only. Not public.
            </p>
            {validationErrors.whatsapp_number && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.whatsapp_number}
              </p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Age *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="18"
                max="100"
                value={candidateData.age}
                onChange={(e) => setCandidateData(prev => ({ ...prev, age: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="Enter your age"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Confidential. Not public.
            </p>
            {validationErrors.age && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.age}
              </p>
            )}
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Occupation *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={candidateData.occupation}
                onChange={(e) => setCandidateData(prev => ({ ...prev, occupation: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="Your profession or occupation"
              />
            </div>
            {validationErrors.occupation && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.occupation}
              </p>
            )}
          </div>

          {/* Marital Status */}
          <div className="relative marital-dropdown-container">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Marital Status *
            </label>
            <div 
              className="w-full px-3 py-2 border rounded-lg cursor-pointer flex justify-between items-center"
              style={{ 
                borderColor: colors.border,
              }}
              onClick={() => setShowMaritalDropdown(!showMaritalDropdown)}
            >
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-gray-400" />
                <span className={candidateData.married ? "text-gray-900" : "text-gray-400"}>
                  {candidateData.married || "Select marital status"}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMaritalDropdown ? "transform rotate-180" : ""}`} />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Confidential. Not public.
            </p>
            
            {showMaritalDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                   style={{ borderColor: colors.border }}>
                {MARITAL_STATUS.map((status) => (
                  <div
                    key={status}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex items-center"
                    style={{ borderColor: colors.border }}
                    onClick={() => handleMaritalSelect(status)}
                  >
                    <Heart className="w-4 h-4 mr-2 text-gray-400" />
                    {status}
                  </div>
                ))}
              </div>
            )}
            {validationErrors.married && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.married}
              </p>
            )}
          </div>

          {/* State of Origin Dropdown */}
          <div className="relative state-dropdown-container">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              State of Origin *
            </label>
            <div 
              className="w-full px-3 py-2 border rounded-lg cursor-pointer flex justify-between items-center"
              style={{ 
                borderColor: colors.border,
              }}
              onClick={() => setShowStatesDropdown(!showStatesDropdown)}
            >
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                <span className={candidateData.location ? "text-gray-900" : "text-gray-400"}>
                  {candidateData.location || "Select your state of origin"}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showStatesDropdown ? "transform rotate-180" : ""}`} />
            </div>
            
            {showStatesDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                   style={{ borderColor: colors.border }}>
                {NIGERIAN_STATES.map((state) => (
                  <div
                    key={state}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    style={{ borderColor: colors.border }}
                    onClick={() => handleStateSelect(state)}
                  >
                    {state}
                  </div>
                ))}
              </div>
            )}
            {validationErrors.location && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.location}
              </p>
            )}
          </div>

          {/* LGA Dropdown - Only shown when a state is selected */}
          {candidateData.location && lgas.length > 0 && (
            <div className="relative lga-dropdown-container">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                Local Government Area (LGA) *
              </label>
              <div 
                className="w-full px-3 py-2 border rounded-lg cursor-pointer flex justify-between items-center"
                style={{ 
                  borderColor: colors.border,
                }}
                onClick={() => setShowLgaDropdown(!showLgaDropdown)}
              >
                <span className={candidateData.local_government ? "text-gray-900" : "text-gray-400"}>
                  {candidateData.local_government || `Select LGA in ${candidateData.location}`}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLgaDropdown ? "transform rotate-180" : ""}`} />
              </div>
              
              {showLgaDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                     style={{ borderColor: colors.border }}>
                  {lgas.map((lga) => (
                    <div
                      key={lga}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      style={{ borderColor: colors.border }}
                      onClick={() => handleLgaSelect(lga)}
                    >
                      {lga}
                    </div>
                  ))}
                </div>
              )}
              {validationErrors.local_government && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.local_government}
                </p>
              )}
            </div>
          )}

          {/* Show message if no LGAs found for selected state */}
          {candidateData.location && lgas.length === 0 && (
            <div className="text-sm text-orange-600">
              No LGA data available for {candidateData.location}. The state may not exist in the database or has no LGA records.
            </div>
          )}

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              Social Media Links (Optional)
            </h3>
            
            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                <Instagram className="w-4 h-4 mr-2" />
                Instagram
                {!candidateData.instagram && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Recommended
                  </span>
                )}
              </label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={candidateData.instagram}
                  onChange={(e) => setCandidateData(prev => ({ ...prev, instagram: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  placeholder="https://instagram.com/yourusername"
                />
              </div>
              {!candidateData.instagram && (
                <p className="text-amber-600 text-sm mt-1">
                  Adding your Instagram link helps voters connect with you better!
                </p>
              )}
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </label>
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={candidateData.facebook}
                  onChange={(e) => setCandidateData(prev => ({ ...prev, facebook: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  placeholder="https://facebook.com/yourprofile"
                />
              </div>
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                <Music className="w-4 h-4 mr-2" />
                TikTok
              </label>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={candidateData.tiktok}
                  onChange={(e) => setCandidateData(prev => ({ ...prev, tiktok: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  placeholder="https://tiktok.com/@yourusername"
                />
              </div>
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

          {/* Terms and Conditions */}
          <div className="pt-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg" style={{ borderColor: colors.border }}>
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded"
              />
              <div>
                <label htmlFor="terms" className="text-sm font-medium" style={{ color: colors.text }}>
                  I accept the Terms of Use *
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  By checking this box, you agree to our{" "}
                  <Link
  href={`/myevent/${eventId}/terms`}
  className="font-medium underline"
  style={{ color: colors.primary }}
  target="_blank"
>
  Terms of Use
</Link>

                  {" "}and confirm that all information provided is accurate and truthful.
                </p>
                {validationErrors.terms && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.terms}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              onClick={submitCandidateForm}
              disabled={saving || !candidateData.full_name || !user || hasApplied || !acceptedTerms}
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