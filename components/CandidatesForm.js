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
  Check,
  LogIn,
  UserPlus,
  Lock,
  Image,
  Info,
  CheckCircle,
  Camera,
  AlertTriangle
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPromptEvent, setLoginPromptEvent] = useState(null);
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
  
  // New state for tracking upload progress
  const [uploadingFiles, setUploadingFiles] = useState({
    photo: false,
    banner: false,
    gallery: false
  });
  
  // Track which files are currently being uploaded
  const [activeUploads, setActiveUploads] = useState([]);
  
  const [showStatesDropdown, setShowStatesDropdown] = useState(false);
  const [lgas, setLgas] = useState([]);
  const [showLgaDropdown, setShowLgaDropdown] = useState(false);
  const [showMaritalDropdown, setShowMaritalDropdown] = useState(false);
  const [nigeriaData, setNigeriaData] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // New validation state for image requirements
  const [imageRequirements, setImageRequirements] = useState({
    photoUploaded: false,
    bannerUploaded: false,
    bannerRatioValid: null,
    aboutWordCount: 0,
    aboutValid: false
  });

  // Calculate if form can be submitted
  const canSubmit = () => {
    const hasRequiredFields = 
      candidateData.full_name.trim() &&
      candidateData.email.trim() &&
      candidateData.whatsapp_number.trim() &&
      candidateData.age.trim() &&
      candidateData.occupation.trim() &&
      candidateData.married &&
      candidateData.location &&
      candidateData.local_government &&
      acceptedTerms &&
      !uploadingFiles.photo &&
      !uploadingFiles.banner &&
      !uploadingFiles.gallery &&
      activeUploads.length === 0;
    
    // Check about section word count
    const words = candidateData.about.trim().split(/\s+/).filter(word => word.length > 0);
    const aboutValid = words.length >= 20 && words.length <= 100;
    
    return hasRequiredFields && aboutValid && !hasApplied && !saving;
  };

  // Check about section word count
  useEffect(() => {
    const words = candidateData.about.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const isValid = wordCount >= 20 && wordCount <= 100;
    
    setImageRequirements(prev => ({
      ...prev,
      aboutWordCount: wordCount,
      aboutValid: isValid
    }));
  }, [candidateData.about]);

  useEffect(() => {
    checkOwnership();
    loadFormConfig();
    loadEvent();
    checkIfApplied();
    loadNigeriaData();
  }, [eventId, user]);

  // Handle form field interactions for non-auth users
  const handleFieldInteraction = (fieldName) => {
    if (!user) {
      setLoginPromptEvent({
        field: fieldName,
        message: `To fill in your ${fieldName}, you need to be logged in.`
      });
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  // Modified handlers for form fields
  const handleInputChange = (field, value) => {
    if (!handleFieldInteraction(field)) return;
    setCandidateData(prev => ({ ...prev, [field]: value }));
  };

  const handleStateDropdownClick = () => {
    if (!handleFieldInteraction("state of origin")) return;
    setShowStatesDropdown(!showStatesDropdown);
  };

  const handleMaritalDropdownClick = () => {
    if (!handleFieldInteraction("marital status")) return;
    setShowMaritalDropdown(!showMaritalDropdown);
  };

  const handleLgaDropdownClick = () => {
    if (!handleFieldInteraction("local government area")) return;
    setShowLgaDropdown(!showLgaDropdown);
  };

  const handleTermsCheckbox = () => {
    if (!handleFieldInteraction("terms of use")) return;
    setAcceptedTerms(!acceptedTerms);
  };

  const handleFileUpload = (field, e) => {
    if (!handleFieldInteraction(field)) return;
    
    if (field === 'photo') {
      handlePhotoUpload(e);
    } else if (field === 'banner') {
      handleBannerUpload(e);
    } else if (field === 'gallery') {
      handleGalleryUpload(e);
    }
  };

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
    if (!handleFieldInteraction("state of origin")) return;
    
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
    if (!handleFieldInteraction("local government area")) return;
    setCandidateData(prev => ({ ...prev, local_government: lga }));
    setShowLgaDropdown(false);
  };

  // Handle marital status selection
  const handleMaritalSelect = (status) => {
    if (!handleFieldInteraction("marital status")) return;
    setCandidateData(prev => ({ ...prev, married: status }));
    setShowMaritalDropdown(false);
  };

  // Validate form fields
  const validateForm = () => {
    if (!user) {
      setLoginPromptEvent({
        field: "form submission",
        message: "You need to be logged in to submit the application form."
      });
      setShowLoginModal(true);
      return false;
    }
    
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
    
    // About section validation (20-100 words)
    const words = candidateData.about.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length < 20 || words.length > 100) {
      errors.about = `About section must be between 20-100 words (currently ${words.length})`;
    }
    
    // Check if profile photo is uploaded
    if (!candidateData.photo.trim()) {
      errors.photo = "Profile photo is required";
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
    const uploadId = Date.now().toString();
    setActiveUploads(prev => [...prev, uploadId]);
    
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
    } finally {
      setActiveUploads(prev => prev.filter(id => id !== uploadId));
    }
  };

  const handleFormBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFiles(prev => ({ ...prev, banner: true }));
    try {
      const path = `form-banners/${eventId}/${Date.now()}-${file.name}`;
      const url = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, banner_url: url }));
    } catch (error) {
      alert("Error uploading banner");
    } finally {
      setUploadingFiles(prev => ({ ...prev, banner: false }));
    }
  };

  // Check image ratio for banner
  const checkImageRatio = (file) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = function() {
        const ratio = this.width / this.height;
        // Check for 2.5:1 ratio (1000:400 = 2.5)
        const isRecommended = Math.abs(ratio - 2.5) < 0.1;
        resolve({ width: this.width, height: this.height, ratio, isRecommended });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!user) {
      setLoginPromptEvent({
        field: "photo",
        message: "To upload your profile photo, you need to be logged in."
      });
      setShowLoginModal(true);
      return;
    }

    setUploadingFiles(prev => ({ ...prev, photo: true }));
    try {
      const path = `candidate-photo/${eventId}/${user.id}/${Date.now()}-${file.name}`;
      const url = await uploadFile(file, path);
      setCandidateData(prev => ({ ...prev, photo: url }));
      
      setImageRequirements(prev => ({ ...prev, photoUploaded: true }));
    } catch (error) {
      alert(`Error uploading photo`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, photo: false }));
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!user) {
      setLoginPromptEvent({
        field: "banner",
        message: "To upload your banner, you need to be logged in."
      });
      setShowLoginModal(true);
      return;
    }

    // Check image ratio before uploading
    const ratioInfo = await checkImageRatio(file);
    
    if (!ratioInfo.isRecommended) {
      const userConfirmed = window.confirm(
        `Your banner image ratio is ${ratioInfo.width}:${ratioInfo.height} (approximately ${ratioInfo.ratio.toFixed(2)}:1).\n` +
        `For best display, we recommend 1000×400 pixels (2.5:1 ratio).\n` +
        `Do you want to proceed with this image?`
      );
      
      if (!userConfirmed) {
        return;
      }
    }

    setUploadingFiles(prev => ({ ...prev, banner: true }));
    try {
      const path = `candidate-banner/${eventId}/${user.id}/${Date.now()}-${file.name}`;
      const url = await uploadFile(file, path);
      setCandidateData(prev => ({ ...prev, banner: url }));
      setImageRequirements(prev => ({ 
        ...prev, 
        bannerUploaded: true,
        bannerRatioValid: ratioInfo.isRecommended 
      }));
    } catch (error) {
      alert("Error uploading banner");
    } finally {
      setUploadingFiles(prev => ({ ...prev, banner: false }));
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (!user) {
      setLoginPromptEvent({
        field: "gallery photos",
        message: "To upload gallery photos, you need to be logged in."
      });
      setShowLoginModal(true);
      return;
    }

    if (!files.length || candidateData.gallery.length + files.length > 6) {
      alert("Maximum 6 photos allowed in gallery");
      return;
    }

    setUploadingFiles(prev => ({ ...prev, gallery: true }));
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
      setUploadingFiles(prev => ({ ...prev, gallery: false }));
    }
  };

  const updateGalleryCaption = (index, caption) => {
    if (!handleFieldInteraction("gallery captions")) return;
    setCandidateData(prev => ({
      ...prev,
      gallery: prev.gallery.map((item, i) => 
        i === index ? { ...item, caption } : item
      )
    }));
  };

  const removeGalleryItem = (index) => {
    if (!handleFieldInteraction("gallery management")) return;
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
    if (!user) {
      setLoginPromptEvent({
        field: "form submission",
        message: "You need to be logged in to submit the application form."
      });
      setShowLoginModal(true);
      return;
    }

    if (!validateForm()) {
      alert("Please fix the errors in the form before submitting.");
      return;
    }

    if (hasApplied) {
      alert("Application Submitted for this event.");
      return;
    }

    // Check if any uploads are still in progress
    if (uploadingFiles.photo || uploadingFiles.banner || uploadingFiles.gallery || activeUploads.length > 0) {
      alert("Please wait for all uploads to complete before submitting.");
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
      setImageRequirements({
        photoUploaded: false,
        bannerUploaded: false,
        bannerRatioValid: null,
        aboutWordCount: 0,
        aboutValid: false
      });
    } catch (error) {
      console.error("Error submitting candidate form:", error);
      alert("Error submitting application");
    } finally {
      setSaving(false);
    }
  };

  // Login Required Modal
  const LoginModal = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div 
        className="bg-white rounded-lg shadow-lg max-w-xs w-full p-4 border animate-in fade-in zoom-in-95"
        style={{ 
          borderColor: colors.primary + '30',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="text-center mb-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-4 h-4" style={{ color: colors.primary }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
            Login Required
          </h3>
          <p className="text-xs text-gray-600 mb-2">
            {loginPromptEvent?.message || "You need to log in to access this form."}
          </p>
          {event?.name && (
            <p className="text-xs text-gray-500">
              Please login or create an account to access the{" "}
              <span className="font-medium" style={{ color: colors.primary }}>
                {event.name}
              </span>{" "}
              registration form.
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Link
            href="/login"
            className="block"
            onClick={() => setShowLoginModal(false)}
          >
            <button
              className="w-full py-2 px-3 rounded-md font-medium text-white flex items-center justify-center space-x-1.5 transition-all duration-200 hover:shadow-sm text-sm"
              style={{ 
                backgroundColor: colors.primary,
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login to Your Account</span>
            </button>
          </Link>
          
          <Link
            href="/signup"
            className="block"
            onClick={() => setShowLoginModal(false)}
          >
            <button
              className="w-full py-2 px-3 rounded-md font-medium border flex items-center justify-center space-x-1.5 transition-all duration-200 hover:shadow-sm text-sm"
              style={{ 
                borderColor: colors.primary,
                color: colors.primary,
                backgroundColor: 'white'
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Free Account</span>
            </button>
          </Link>
          
          <button
            onClick={() => setShowLoginModal(false)}
            className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );

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
    <div className="max-w-2xl mx-auto relative">
      {/* Login Required Modal */}
      {showLoginModal && <LoginModal />}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xs w-full p-4 border" style={{ borderColor: colors.border }}>
            <div className="text-center mb-4">
              <Coins className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primary }} />
              <h3 className="text-sm font-semibold mb-1">Confirm Payment</h3>
              <p className="text-xs text-gray-600 mb-2">
                {formData.token_price} token(s) will be deducted from your wallet.
              </p>
              <p className="text-xs text-gray-500">
                Event: {event?.name || event?.title}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-1.5 px-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={processFormSubmission}
                disabled={saving}
                className="flex-1 py-1.5 px-3 rounded font-medium text-white transition-all duration-200 disabled:opacity-50 text-xs"
                style={{ backgroundColor: colors.primary }}
              >
                {saving ? (
                  <div className="flex items-center justify-center space-x-1">
                    <Loader className="w-3 h-3 animate-spin" />
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
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md text-sm"
            style={{
              backgroundColor: colors.primary,
              color: '#ffffff',
            }}
          >
            <Edit className="w-3.5 h-3.5" />
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
                <label className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg cursor-pointer hover:bg-gray-100 text-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.banner_url ? 'Change Banner' : 'Upload Banner'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFormBannerUpload}
                    disabled={uploadingFiles.banner}
                  />
                </label>
              </div>
            )}
          </div>
          {isEditing && formData.banner_url && (
            <button
              onClick={() => setFormData(prev => ({ ...prev, banner_url: "" }))}
              className="text-xs text-red-600 hover:text-red-700 flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove Banner</span>
            </button>
          )}
        </div>
      )}

      {/* Form Configuration - Only visible in edit mode */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border" style={{ borderColor: colors.border }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold">Form Configuration</h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Form Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Form Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded"
                />
                <span>Public Form</span>
              </label>

              <label className="flex items-center space-x-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_paid}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
                  className="rounded"
                />
                <span className="flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Paid Form</span>
                </span>
              </label>
            </div>

            {formData.is_paid && (
              <div>
                <label className="block text-xs font-medium mb-1">Token Price</label>
                <input
                  type="number"
                  value={formData.token_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, token_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                onClick={saveFormConfig}
                disabled={saving}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded font-medium transition-all duration-200 disabled:opacity-50 text-sm"
                style={{
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                }}
              >
                {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Form */}
      <div className="bg-white rounded-lg shadow-md p-4 border" style={{ borderColor: colors.border }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-1.5" style={{ color: colors.text }}>
            {formData.title}
          </h2>
          <p className="text-sm text-gray-600 mb-3" style={{ color: colors.text }}>
            {formData.description}
          </p>
          
          {/* Fee Display */}
          {formData.is_paid && formData.token_price > 0 && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
              <Coins className="w-3.5 h-3.5" style={{ color: colors.primary }} />
              <span className="text-xs font-medium" style={{ color: colors.primary }}>
                Fee: {formData.token_price} Token(s)
              </span>
            </div>
          )}
        </div>

        {/* Image Requirements Info Box */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-blue-900 mb-1">Image Requirements</h4>
              <ul className="text-xs text-blue-700 space-y-0.5">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span><strong>Profile Photo:</strong> Enticing half-shot showing your face clearly</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span><strong>Banner Image:</strong> Preferably 1000×400 pixels (10:4 ratio) for optimal display</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span><strong>Gallery Images:</strong> Professional quality photos that will be made public on your candidate profile</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span><strong>About Section:</strong> Must be between 20-100 words</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              Full Name *
            </label>
            <input
              type="text"
              value={candidateData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
              style={{ 
                borderColor: colors.border,
                focusBorderColor: colors.primary 
              }}
              placeholder="Enter your full name"
              onClick={() => !user && setShowLoginModal(true)}
            />
            {validationErrors.full_name && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.full_name}
              </p>
            )}
          </div>

          {/* Nick Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              Nick Name
            </label>
            <input
              type="text"
              value={candidateData.nick_name}
              onChange={(e) => handleInputChange('nick_name', e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
              style={{ 
                borderColor: colors.border,
                focusBorderColor: colors.primary 
              }}
              placeholder="Enter your preferred nickname"
              onClick={() => !user && setShowLoginModal(true)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="email"
                value={candidateData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="you@example.com"
                onClick={() => !user && setShowLoginModal(true)}
              />
            </div>
            {validationErrors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              WhatsApp Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="tel"
                value={candidateData.whatsapp_number}
                onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="+234 800 000 0000"
                onClick={() => !user && setShowLoginModal(true)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
              For communication with event management only. Not public.
            </p>
            {validationErrors.whatsapp_number && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.whatsapp_number}
              </p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              Age *
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="number"
                min="18"
                max="100"
                value={candidateData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="Enter your age"
                onClick={() => !user && setShowLoginModal(true)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
              Confidential. Not public.
            </p>
            {validationErrors.age && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.age}
              </p>
            )}
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              Occupation *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={candidateData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                style={{ 
                  borderColor: colors.border,
                  focusBorderColor: colors.primary 
                }}
                placeholder="Your profession or occupation"
                onClick={() => !user && setShowLoginModal(true)}
              />
            </div>
            {validationErrors.occupation && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.occupation}
              </p>
            )}
          </div>

          {/* Marital Status */}
          <div className="relative marital-dropdown-container">
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              Marital Status *
            </label>
            <div 
              className="w-full px-3 py-1.5 border rounded cursor-pointer flex justify-between items-center text-sm"
              style={{ 
                borderColor: colors.border,
              }}
              onClick={handleMaritalDropdownClick}
            >
              <div className="flex items-center">
                <Heart className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                <span className={candidateData.married ? "text-gray-900" : "text-gray-400"}>
                  {candidateData.married || "Select marital status"}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMaritalDropdown ? "transform rotate-180" : ""}`} />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
              Confidential. Not public.
            </p>
            
            {showMaritalDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto text-sm"
                   style={{ borderColor: colors.border }}>
                {MARITAL_STATUS.map((status) => (
                  <div
                    key={status}
                    className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex items-center"
                    style={{ borderColor: colors.border }}
                    onClick={() => handleMaritalSelect(status)}
                  >
                    <Heart className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {status}
                  </div>
                ))}
              </div>
            )}
            {validationErrors.married && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.married}
              </p>
            )}
          </div>

          {/* State of Origin Dropdown */}
          <div className="relative state-dropdown-container">
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
              State of Origin *
            </label>
            <div 
              className="w-full px-3 py-1.5 border rounded cursor-pointer flex justify-between items-center text-sm"
              style={{ 
                borderColor: colors.border,
              }}
              onClick={handleStateDropdownClick}
            >
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                <span className={candidateData.location ? "text-gray-900" : "text-gray-400"}>
                  {candidateData.location || "Select your state of origin"}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStatesDropdown ? "transform rotate-180" : ""}`} />
            </div>
            
            {showStatesDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto text-sm"
                   style={{ borderColor: colors.border }}>
                {NIGERIAN_STATES.map((state) => (
                  <div
                    key={state}
                    className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    style={{ borderColor: colors.border }}
                    onClick={() => handleStateSelect(state)}
                  >
                    {state}
                  </div>
                ))}
              </div>
            )}
            {validationErrors.location && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.location}
              </p>
            )}
          </div>

          {/* LGA Dropdown - Only shown when a state is selected */}
          {candidateData.location && lgas.length > 0 && (
            <div className="relative lga-dropdown-container">
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.text }}>
                Local Government Area (LGA) *
              </label>
              <div 
                className="w-full px-3 py-1.5 border rounded cursor-pointer flex justify-between items-center text-sm"
                style={{ 
                  borderColor: colors.border,
                }}
                onClick={handleLgaDropdownClick}
              >
                <span className={candidateData.local_government ? "text-gray-900" : "text-gray-400"}>
                  {candidateData.local_government || `Select LGA in ${candidateData.location}`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLgaDropdown ? "transform rotate-180" : ""}`} />
              </div>
              
              {showLgaDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto text-sm"
                     style={{ borderColor: colors.border }}>
                  {lgas.map((lga) => (
                    <div
                      key={lga}
                      className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      style={{ borderColor: colors.border }}
                      onClick={() => handleLgaSelect(lga)}
                    >
                      {lga}
                    </div>
                  ))}
                </div>
              )}
              {validationErrors.local_government && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {validationErrors.local_government}
                </p>
              )}
            </div>
          )}

          {/* Show message if no LGAs found for selected state */}
          {candidateData.location && lgas.length === 0 && (
            <div className="text-xs text-orange-600">
              No LGA data available for {candidateData.location}. The state may not exist in the database or has no LGA records.
            </div>
          )}

          {/* Social Media Links */}
          <div className="space-y-3">
            <h3 className="text-md font-semibold" style={{ color: colors.text }}>
              Social Media Links (Optional)
            </h3>
            
            {/* Instagram */}
            <div>
              <label className="block text-xs font-medium mb-1.5 flex items-center" style={{ color: colors.text }}>
                <Instagram className="w-3.5 h-3.5 mr-1.5" />
                Instagram
                {!candidateData.instagram && (
                  <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                )}
              </label>
              <div className="relative">
                <Instagram className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="url"
                  value={candidateData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  placeholder="https://instagram.com/yourusername"
                  onClick={() => !user && setShowLoginModal(true)}
                />
              </div>
              {!candidateData.instagram && (
                <p className="text-amber-600 text-xs mt-1">
                  Adding your Instagram link helps voters connect with you better!
                </p>
              )}
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-xs font-medium mb-1.5 flex items-center" style={{ color: colors.text }}>
                <Facebook className="w-3.5 h-3.5 mr-1.5" />
                Facebook
              </label>
              <div className="relative">
                <Facebook className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="url"
                  value={candidateData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  placeholder="https://facebook.com/yourprofile"
                  onClick={() => !user && setShowLoginModal(true)}
                />
              </div>
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-xs font-medium mb-1.5 flex items-center" style={{ color: colors.text }}>
                <Music className="w-3.5 h-3.5 mr-1.5" />
                TikTok
              </label>
              <div className="relative">
                <Music className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="url"
                  value={candidateData.tiktok}
                  onChange={(e) => handleInputChange('tiktok', e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    borderColor: colors.border,
                    focusBorderColor: colors.primary 
                  }}
                  placeholder="https://tiktok.com/@yourusername"
                  onClick={() => !user && setShowLoginModal(true)}
                />
              </div>
            </div>
          </div>

          {/* About You */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium" style={{ color: colors.text }}>
                About You *
              </label>
              <div className={`text-xs ${imageRequirements.aboutValid ? 'text-green-600' : 'text-amber-600'}`}>
                {imageRequirements.aboutWordCount} words
                {!imageRequirements.aboutValid && imageRequirements.aboutWordCount > 0 && (
                  <span className="ml-1">
                    ({imageRequirements.aboutWordCount < 20 ? 'Need at least 20' : 'Maximum 100 words'})
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={candidateData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              rows={3}
              className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1"
              style={{ 
                borderColor: colors.border,
                focusBorderColor: colors.primary 
              }}
              placeholder="Tell us about yourself, your background, and why you're interested. This will be visible to voters (20-100 words required)."
              onClick={() => !user && setShowLoginModal(true)}
            />
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
              This description will be visible to voters on your public profile
            </div>
            {validationErrors.about && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.about}
              </p>
            )}
          </div>

          {/* Profile Photo */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium" style={{ color: colors.text }}>
                Profile Photo *
              </label>
              {candidateData.photo && (
                <div className="text-xs text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-0.5" />
                  Uploaded
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {candidateData.photo ? (
                <div className="relative">
                  <img 
                    src={candidateData.photo} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {uploadingFiles.photo && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <label className="flex items-center space-x-1.5 px-3 py-1.5 border rounded cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {uploadingFiles.photo ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {uploadingFiles.photo ? 'Uploading...' : candidateData.photo ? 'Change Photo' : 'Upload Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('photo', e)}
                  disabled={uploadingFiles.photo}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
              Enticing half-shot photo showing your face clearly (required)
            </p>
            {!user && (
              <p className="text-xs text-orange-600 mt-1">Please sign in to upload photos</p>
            )}
            {validationErrors.photo && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.photo}
              </p>
            )}
          </div>

          {/* Banner Photo */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium" style={{ color: colors.text }}>
                Banner Photo
              </label>
              {candidateData.banner && (
                <div className="flex items-center space-x-1">
                  {imageRequirements.bannerRatioValid === false && (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  )}
                  <div className={`text-xs ${imageRequirements.bannerRatioValid ? 'text-green-600' : 'text-amber-600'}`}>
                    <CheckCircle className="w-3 h-3 inline mr-0.5" />
                    Uploaded
                    {imageRequirements.bannerRatioValid === false && (
                      <span className="ml-1">(Non-standard ratio)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {candidateData.banner ? (
                <div className="relative">
                  <img 
                    src={candidateData.banner} 
                    alt="Banner" 
                    className="w-full h-24 rounded-lg object-cover"
                  />
                  {uploadingFiles.banner && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <label className="flex items-center space-x-1.5 px-3 py-1.5 border rounded cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {uploadingFiles.banner ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {uploadingFiles.banner ? 'Uploading...' : candidateData.banner ? 'Change Banner' : 'Upload Banner'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('banner', e)}
                  disabled={uploadingFiles.banner}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
              Recommended: 1000×400 pixels (10:4 ratio) for optimal display
            </p>
          </div>

          {/* Gallery */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium" style={{ color: colors.text }}>
                Gallery Photos (Max 6)
              </label>
              {candidateData.gallery.length > 0 && (
                <div className="text-xs text-gray-600">
                  {candidateData.gallery.length} / 6 uploaded
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {candidateData.gallery.map((item, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={item.url} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-20 rounded-lg object-cover"
                  />
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => updateGalleryCaption(index, e.target.value)}
                    placeholder="Add caption..."
                    className="w-full mt-0.5 px-1.5 py-0.5 text-xs border rounded focus:outline-none focus:ring-0.5"
                    style={{ 
                      borderColor: colors.border,
                      focusBorderColor: colors.primary 
                    }}
                    onClick={() => !user && setShowLoginModal(true)}
                  />
                  <button
                    onClick={() => removeGalleryItem(index)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              
              {candidateData.gallery.length < 6 && (
                <label className="border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 h-20 disabled:opacity-50 disabled:cursor-not-allowed relative">
                  {uploadingFiles.gallery && (
                    <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                      <Loader className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                  <Plus className="w-5 h-5 text-gray-400 mb-0.5" />
                  <span className="text-xs text-gray-500">
                    {uploadingFiles.gallery ? 'Uploading...' : 'Add Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload('gallery', e)}
                    disabled={uploadingFiles.gallery || !user}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
              Professional quality photos that will be made public on your candidate profile
            </p>
            {!user && (
              <p className="text-xs text-orange-600">Please sign in to add gallery photos</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="pt-3">
            <div className="flex items-start space-x-2 p-3 border rounded" style={{ borderColor: colors.border }}>
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={handleTermsCheckbox}
                className="mt-0.5 rounded"
                disabled={!user}
              />
              <div>
                <label htmlFor="terms" className="text-xs font-medium" style={{ color: colors.text }}>
                  I accept the Terms of Use *
                </label>
                <p className="text-xs text-gray-600 mt-0.5">
                  By checking this box, you agree to our{" "}
                  <Link
                    href={`/myevent/${eventId}/terms`}
                    className="font-medium underline"
                    style={{ color: colors.primary }}
                    target="_blank"
                  >
                    Terms of Use
                  </Link>
                  {" "}and confirm that all information provided is accurate and truthful. You also acknowledge that your gallery images will be made public.
                </p>
                {validationErrors.terms && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.terms}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={submitCandidateForm}
              disabled={!canSubmit()}
              className="w-full py-2 px-3 rounded font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm text-sm relative"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              {uploadingFiles.photo || uploadingFiles.banner || uploadingFiles.gallery || activeUploads.length > 0 ? (
                <div className="flex items-center justify-center space-x-1.5">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Uploading Images...</span>
                </div>
              ) : saving ? (
                <div className="flex items-center justify-center space-x-1.5">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : !user ? (
                <div className="flex items-center justify-center space-x-1.5">
                  <LogIn className="w-4 h-4" />
                  <span>Login to Submit Application</span>
                </div>
              ) : hasApplied ? (
                "Application Already Submitted"
              ) : formData.is_paid && formData.token_price > 0 ? (
                `Submit Application - ${formData.token_price} Token(s)`
              ) : (
                'Submit Application'
              )}
              
              {/* Upload Progress Indicator */}
              {(uploadingFiles.photo || uploadingFiles.banner || uploadingFiles.gallery) && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 overflow-hidden">
                  <div 
                    className="h-full bg-white/50 animate-pulse"
                    style={{ animationDuration: '1.5s' }}
                  />
                </div>
              )}
            </button>
            
            {/* Status Indicators */}
            <div className="mt-2 text-xs text-gray-500">
              {!canSubmit() && user && !hasApplied && (
                <div className="flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>
                    {uploadingFiles.photo || uploadingFiles.banner || uploadingFiles.gallery 
                      ? "Please wait for all image uploads to complete" 
                      : !candidateData.photo 
                        ? "Profile photo is required" 
                        : imageRequirements.aboutWordCount === 0 
                          ? "About section is required (20-100 words)" 
                          : !imageRequirements.aboutValid 
                            ? `About section must be 20-100 words (currently ${imageRequirements.aboutWordCount})` 
                            : !acceptedTerms 
                              ? "Please accept the terms of use" 
                              : "Please fill in all required fields"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}