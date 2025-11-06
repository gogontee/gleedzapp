"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import GalleryVideos from "./GalleryVideos";
import AwardManagement from "./AwardManagement"; // Import the AwardManagement component
import EditNavigation from "./EditNavigation"; // Import the EditNavigation component
import { 
  X, 
  Save, 
  Trash2, 
  Globe,
  Crown,
  Mappin,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Play,
  Pause,
  Calendar,
  Newspaper,
  Coins,
  Ticket,
  Gallery as GalleryIcon,
  Download,
  Share2,
  Heart,
  Eye,
  House,
  Car,
  Gem,
  Medal,
  Trophy,
  Landmark,
  Users,
  Award,
  Star,
  DollarSign,
  Euro,
  IndianRupee,
  JapaneseYen,
  PoundSterling,
  ChevronDown,
  Sun,
  Key,
  Target
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import FormPanel from "./FormPanel"; // Import the FormPanel component

// Add this component before EventEditPanel
const StatItemWithModal = ({ stat, index, onUpdate, onRemove }) => {
  const [showIconModal, setShowIconModal] = useState(false);

  const icons = [
    { name: 'Users', icon: Users },
    { name: 'Award', icon: Award },
    { name: 'Ticket', icon: Ticket },
    { name: 'Eye', icon: Eye },
    { name: 'Star', icon: Star },
    { name: 'House', icon: House },
    { name: 'Car', icon: Car },
    { name: 'Key', icon: Key },
    { name: 'Gem', icon: Gem },
    { name: 'Pause', icon: Pause },
    { name: 'Crown', icon: Crown },
    { name: 'Globe', icon: Globe },
    { name: 'Newspaper', icon: Newspaper },
    { name: 'Medal', icon: Medal },
    { name: 'Trophy', icon: Trophy },
    { name: 'Landmark', icon: Landmark },
    { name: 'ChevronDown', icon: ChevronDown },
    { name: 'Coins', icon: Coins },
    { name: 'DollarSign', icon: DollarSign },
    { name: 'Euro', icon: Euro },
    { name: 'IndianRupee', icon: IndianRupee },
    { name: 'JapaneseYen', icon: JapaneseYen },
    { name: 'PoundSterling', icon: PoundSterling },
    { name: 'Calendar', icon: Calendar },
    { name: 'Sun', icon: Sun },
    { name: 'Target', icon: Target },
  ];

  const SelectedIcon = icons.find(i => i.name === stat.icon)?.icon || Users;

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
      {/* Custom Icon Selector */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-yellow-500 text-sm md:text-base transition-colors"
          onClick={() => setShowIconModal(true)}
        >
          <SelectedIcon className="w-4 h-4 text-gray-700" />
          <span className="truncate max-w-[60px]">{stat.icon}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <input
        type="text"
        value={stat.title}
        onChange={(e) => onUpdate({ ...stat, title: e.target.value })}
        placeholder="Stat title"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
      />

      <input
        type="text"
        value={stat.number}
        onChange={(e) => onUpdate({ ...stat, number: e.target.value })}
        placeholder="Enter value"
        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
      />

      <button
        onClick={() => onRemove()}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Custom Icon Selection Modal */}
      {showIconModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl max-h-[80vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Select an Icon
              </h3>
              <button
                onClick={() => setShowIconModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Icons Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
                {icons.map((iconItem) => {
                  const IconComponent = iconItem.icon;
                  const isSelected = stat.icon === iconItem.name;

                  return (
                    <button
                      key={iconItem.name}
                      type="button"
                      className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-yellow-50 border-yellow-400 text-yellow-700 shadow-md scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        onUpdate({ ...stat, icon: iconItem.name });
                        setShowIconModal(false);
                      }}
                    >
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                      <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                        {iconItem.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl text-sm sm:text-base">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">
                  {icons.length} icons available
                </span>
                <button
                  onClick={() => setShowIconModal(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};


export default function EventEditPanel({ event, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    type: "",
    page_color: "#D4AF37",
    thumbnail: "",
    tagline: "",
    launch: false,
    code: "",
    hero_sections: [],
    stats: [],
    group_banner1: [],
    group_banner2: [],
    group_poster1: [],
    activities: [],
    main_gallery: [],
    news: [],
    tickets: []
  });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [uploading, setUploading] = useState(false);
  const [savingCandidate, setSavingCandidate] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState(null);

  // Define updateFormData function that was missing
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Initialize form with event data
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        slug: event.slug || "",
        description: event.description || "",
        logo: event.logo || "",
        type: event.type || "",
        page_color: event.page_color || "#D4AF37",
        thumbnail: event.thumbnail || "",
        tagline: event.tagline || "",
        launch: event.launch || false,
        code: event.code || "",
        hero_sections: event.hero_sections || [],
        stats: event.stats || [],
        group_banner1: event.group_banner1 || [],
        group_banner2: event.group_banner2 || [],
        group_poster1: event.group_poster1 || [],
        activities: event.activities || [],
        main_gallery: event.main_gallery || [],
        news: event.news || [],
        tickets: event.tickets || []
      });
      fetchCandidates();
    }
  }, [event]);

  // Fetch candidates from candidates table
  const fetchCandidates = async () => {
    if (!event) return;
    
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCandidates(data);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) 
        ? prev[field].map((item, i) => i === index ? value : item)
        : [value]
    }));
  };

  const addArrayItem = (field, defaultValue = {}) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) 
        ? [...prev[field], defaultValue]
        : [defaultValue]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) 
        ? prev[field].filter((_, i) => i !== index)
        : []
    }));
  };

  const handleFileUpload = async (file, field, customPath = null) => {
    try {
      setUploading(true);
      
      const BUCKET_NAME = 'event-assets';
      const eventSlug = formData.slug || event?.slug || 'new-event';
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substr(2, 8);
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      
      let filePath = customPath;

      // Determine the correct file path based on the field type
      if (!filePath) {
        switch (field) {
          case 'logo':
            filePath = `events/${eventSlug}/logo/${fileName}`;
            break;
          case 'thumbnail':
            filePath = `events/${eventSlug}/thumbnail/${fileName}`;
            break;
          case 'hero_sections':
            filePath = `events/${eventSlug}/heroes/${fileName}`;
            break;
          case 'group_banner1':
          case 'group_banner2':
          case 'group_poster1':
            filePath = `events/${eventSlug}/banners/${fileName}`;
            break;
          case 'candidate_photo':
            filePath = `events/${eventSlug}/candidate/photo/${fileName}`;
            break;
          case 'candidate_banner':
            filePath = `events/${eventSlug}/candidate/banner/${fileName}`;
            break;
          case 'gallery':
            filePath = `events/${eventSlug}/candidate/gallery/${fileName}`;
            break;
          case 'activity_image':
            filePath = `events/${eventSlug}/activities/${fileName}`;
            break;
          case 'gallery_image':
            filePath = `events/${eventSlug}/gallery/${fileName}`;
            break;
          case 'news_image':
            filePath = `events/${eventSlug}/news/${fileName}`;
            break;
          default:
            filePath = `events/${eventSlug}/misc/${fileName}`;
        }
      }

      console.log('Uploading to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      console.log('File uploaded successfully:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error uploading file: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = async (field, isArrayField = false, index = null, customField = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const publicUrl = await handleFileUpload(file, customField || field);
      if (publicUrl) {
        if (isArrayField && index !== null) {
          if (customField) {
            handleArrayFieldChange(field, index, { 
              ...(formData[field]?.[index] || {}), 
              [customField]: publicUrl 
            });
          } else {
            handleArrayFieldChange(field, index, { 
              ...(formData[field]?.[index] || {}), 
              src: publicUrl 
            });
          }
        } else {
          handleInputChange(field, publicUrl);
        }
      }
    };
    
    input.click();
  };

  // Candidate Management Functions
const addCandidate = () => {
  setCandidates(prev => [...prev, {
    id: `temp-${Date.now()}`,
    event_id: event.id,
    full_name: '',
    about: '',
    votes: 0,
    gifts: 0,
    contest_number: '',
    photo: '',
    banner: '',
    gallery: [],
    approved: false,
    created_at: new Date().toISOString(),
    votes_toggle: true,
    gifts_toggle: true,
    views_toggle: true,
    points_toggle: true,
  }]);
};

const updateCandidate = (index, field, value) => {
  setCandidates(prev => prev.map((candidate, i) => 
    i === index ? { ...candidate, [field]: value } : candidate
  ));
};

const handleCandidateImageSelect = async (index, field) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const publicUrl = await handleFileUpload(file, `candidate_${field}`);
    if (publicUrl) {
      updateCandidate(index, field, publicUrl);
    }
  };
  
  input.click();
};

const updateCandidateGallery = async (index, file) => {
  if (candidates[index].gallery.length >= 6) {
    alert('Maximum 6 images allowed in gallery');
    return;
  }

  const publicUrl = await handleFileUpload(file, 'gallery');
  if (publicUrl) {
    setCandidates(prev => prev.map((candidate, i) => 
      i === index ? { ...candidate, gallery: [...candidate.gallery, publicUrl] } : candidate
    ));
  }
};

const removeCandidateGallery = (candidateIndex, imageIndex) => {
  setCandidates(prev => prev.map((candidate, i) => 
    i === candidateIndex ? { 
      ...candidate, 
      gallery: candidate.gallery.filter((_, imgIndex) => imgIndex !== imageIndex) 
    } : candidate
  ));
};

const saveCandidate = async (index) => {
  const candidate = candidates[index];
  
  if (!candidate.full_name.trim()) {
    alert('Full name is required');
    return;
  }

  try {
    setSavingCandidate(index);
    
    let result;
    if (candidate.id && !candidate.id.startsWith('temp-')) {
      // Update existing candidate
      const { data, error } = await supabase
        .from('candidates')
        .update({
          full_name: candidate.full_name,
          about: candidate.about,
          votes: candidate.votes,
          gifts: candidate.gifts,
          contest_number: candidate.contest_number,
          photo: candidate.photo,
          banner: candidate.banner,
          gallery: candidate.gallery,
          approved: candidate.approved,
          votes_toggle: candidate.votes_toggle,
          gifts_toggle: candidate.gifts_toggle,
          views_toggle: candidate.views_toggle,
          points_toggle: candidate.points_toggle,
        })
        .eq('id', candidate.id)
        .select();

      if (error) throw error;
      result = data[0];
    } else {
      // Insert new candidate
      const { data, error } = await supabase
        .from('candidates')
        .insert([{
          event_id: event.id,
          full_name: candidate.full_name,
          about: candidate.about,
          votes: candidate.votes,
          gifts: candidate.gifts,
          contest_number: candidate.contest_number,
          photo: candidate.photo,
          banner: candidate.banner,
          gallery: candidate.gallery,
          approved: candidate.approved,
          votes_toggle: candidate.votes_toggle,
          gifts_toggle: candidate.gifts_toggle,
          views_toggle: candidate.views_toggle,
          points_toggle: candidate.points_toggle,
        }])
        .select();

      if (error) throw error;
      result = data[0];
    }

    setCandidates(prev => prev.map((c, i) => 
      i === index ? { ...result } : c
    ));

    alert('Candidate saved successfully!');
  } catch (error) {
    console.error('Error saving candidate:', error);
    alert('Error saving candidate: ' + error.message);
  } finally {
    setSavingCandidate(null);
  }
};

const removeCandidate = async (index) => {
  const candidate = candidates[index];
  
  if (!confirm('Are you sure you want to delete this candidate?')) return;

  if (candidate.id && !candidate.id.startsWith('temp-')) {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidate.id);
    
    if (error) {
      alert('Error deleting candidate');
      return;
    }
  }
  
  setCandidates(prev => prev.filter((_, i) => i !== index));
};

const toggleCandidateApproval = async (index) => {
  const candidate = candidates[index];
  const newApprovedStatus = !candidate.approved;
  
  updateCandidate(index, 'approved', newApprovedStatus);
  
  if (candidate.id && !candidate.id.startsWith('temp-')) {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ approved: newApprovedStatus })
        .eq('id', candidate.id);
      
      if (error) throw error;
    } catch (error) {
      updateCandidate(index, 'approved', !newApprovedStatus);
      alert('Error updating candidate approval');
    }
  }
};

/* ================================
   NEW: Global Visibility Toggles (No Alerts)
================================ */
const toggleShowVotes = async (show) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ votes_toggle: show })
      .eq('event_id', event.id);

    if (error) throw error;

    setCandidates(prev =>
      prev.map(c => ({ ...c, votes_toggle: show }))
    );
  } catch (error) {
    console.error('Error updating votes toggle:', error);
  }
};

const toggleShowGifts = async (show) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ gifts_toggle: show })
      .eq('event_id', event.id);

    if (error) throw error;

    setCandidates(prev =>
      prev.map(c => ({ ...c, gifts_toggle: show }))
    );
  } catch (error) {
    console.error('Error updating gifts toggle:', error);
  }
};

const toggleShowViews = async (show) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ views_toggle: show })
      .eq('event_id', event.id);

    if (error) throw error;

    setCandidates(prev =>
      prev.map(c => ({ ...c, views_toggle: show }))
    );
  } catch (error) {
    console.error('Error updating views toggle:', error);
  }
};

const toggleShowPoints = async (show) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ points_toggle: show })
      .eq('event_id', event.id);

    if (error) throw error;

    setCandidates(prev =>
      prev.map(c => ({ ...c, points_toggle: show }))
    );
  } catch (error) {
    console.error('Error updating points toggle:', error);
  }
};


  // Gallery Functions
  const addGalleryItem = () => {
    addArrayItem('main_gallery', {
      image: '',
      caption: '',
      views: 0,
      likes: 0,
      downloadable: true,
      shareable: true
    });
  };

  const updateGalleryItem = (index, field, value) => {
    handleArrayFieldChange('main_gallery', index, {
      ...(formData.main_gallery?.[index] || {}),
      [field]: value
    });
  };

  const incrementGalleryViews = (index) => {
    updateGalleryItem(index, 'views', (formData.main_gallery?.[index]?.views || 0) + 1);
  };

  const incrementGalleryLikes = (index) => {
    updateGalleryItem(index, 'likes', (formData.main_gallery?.[index]?.likes || 0) + 1);
  };

  // News Functions
  const addNewsItem = () => {
    addArrayItem('news', {
      title: '',
      content: '',
      image: '',
      published_at: new Date().toISOString().split('T')[0],
      author: '',
      views: 0
    });
  };

  const updateNewsItem = (index, field, value) => {
    handleArrayFieldChange('news', index, {
      ...(formData.news?.[index] || {}),
      [field]: value
    });
  };

  // Activities Functions
  const addActivity = () => {
    addArrayItem('activities', {
      image: '',
      title: '',
      description: '',
      date: '',
      time: '',
      countdown_target: ''
    });
  };

  const updateActivity = (index, field, value) => {
    handleArrayFieldChange('activities', index, {
      ...(formData.activities?.[index] || {}),
      [field]: value
    });
  };

  // Tickets Functions
const addTicket = () => {
  addArrayItem('tickets', {
    name: '',
    price: 0,
    description: '',
    available_quantity: 0,
    sale_start: '',
    sale_end: '',
    features: [],
    visuals: [], // Add visuals array
    event_date: '', // Add event date field
    event_time: '', // Add event time field
    venue: '' // Add venue field
  });
};

const updateTicket = (index, field, value) => {
  handleArrayFieldChange('tickets', index, {
    ...(formData.tickets?.[index] || {}),
    [field]: value
  });
};

const addTicketFeature = (ticketIndex) => {
  const ticket = formData.tickets?.[ticketIndex] || {};
  updateTicket(ticketIndex, 'features', [...(ticket.features || []), '']);
};

const updateTicketFeature = (ticketIndex, featureIndex, value) => {
  const ticket = formData.tickets?.[ticketIndex] || {};
  const updatedFeatures = (ticket.features || []).map((feature, i) => 
    i === featureIndex ? value : feature
  );
  updateTicket(ticketIndex, 'features', updatedFeatures);
};

const removeTicketFeature = (ticketIndex, featureIndex) => {
  const ticket = formData.tickets?.[ticketIndex] || {};
  const updatedFeatures = (ticket.features || []).filter((_, i) => i !== featureIndex);
  updateTicket(ticketIndex, 'features', updatedFeatures);
};

// Visual Functions
const addTicketVisual = (ticketIndex) => {
  const currentTickets = [...(formData.tickets || [])];
  const currentVisuals = currentTickets[ticketIndex]?.visuals || [];
  
  if (currentVisuals.length >= 3) {
    alert('Maximum 3 visuals allowed per ticket');
    return;
  }
  
  currentTickets[ticketIndex] = {
    ...currentTickets[ticketIndex],
    visuals: [...currentVisuals, { url: '', caption: '', type: '', name: '', file: null }]
  };
  
  updateFormData('tickets', currentTickets);
};

const removeTicketVisual = (ticketIndex, visualIndex) => {
  const currentTickets = [...(formData.tickets || [])];
  const currentVisuals = currentTickets[ticketIndex]?.visuals || [];
  
  currentTickets[ticketIndex] = {
    ...currentTickets[ticketIndex],
    visuals: currentVisuals.filter((_, index) => index !== visualIndex)
  };
  
  updateFormData('tickets', currentTickets);
};

const updateTicketVisual = (ticketIndex, visualIndex, field, value) => {
  const currentTickets = [...(formData.tickets || [])];
  const currentVisuals = currentTickets[ticketIndex]?.visuals || [];
  
  const updatedVisuals = currentVisuals.map((visual, index) => 
    index === visualIndex ? { ...visual, [field]: value } : visual
  );
  
  currentTickets[ticketIndex] = {
    ...currentTickets[ticketIndex],
    visuals: updatedVisuals
  };
  
  updateFormData('tickets', currentTickets);
};

const handleVisualUpload = async (ticketIndex, visualIndex, event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file size and type
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (!isImage && !isVideo) {
    alert('Please upload an image or video file');
    return;
  }

  if (isImage && file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB');
    return;
  }

  if (isVideo) {
    if (file.size > 10 * 1024 * 1024) {
      alert('Video size must be less than 10MB');
      return;
    }
    
    // Check video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = function() {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 60) {
        alert('Video must be 1 minute or less');
        return;
      }
      processFileUpload(ticketIndex, visualIndex, file);
    };
    
    video.src = URL.createObjectURL(file);
  } else {
    processFileUpload(ticketIndex, visualIndex, file);
  }
};

const processFileUpload = async (ticketIndex, visualIndex, file) => {
  try {
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    
    const currentTickets = [...(formData.tickets || [])];
    const currentVisuals = currentTickets[ticketIndex]?.visuals || [];
    
    const updatedVisuals = currentVisuals.map((visual, index) => 
      index === visualIndex ? {
        ...visual,
        url: objectUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
        file: file // Store the actual file for later upload
      } : visual
    );
    
    currentTickets[ticketIndex] = {
      ...currentTickets[ticketIndex],
      visuals: updatedVisuals
    };
    
    updateFormData('tickets', currentTickets);
    
  } catch (error) {
    console.error('Error processing visual:', error);
    alert('Error processing file. Please try again.');
  }
};

// Upload file to Supabase storage
const uploadFileToStorage = async (file, folder, eventId, ticketName) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${ticketName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `events/${eventId}/tickets/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('event-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Process all visuals and upload them
const processVisualUploads = async (tickets, eventId) => {
  const updatedTickets = [...tickets];
  
  for (let ticketIndex = 0; ticketIndex < updatedTickets.length; ticketIndex++) {
    const ticket = updatedTickets[ticketIndex];
    if (ticket.visuals && ticket.visuals.length > 0) {
      const updatedVisuals = [];
      
      for (let visualIndex = 0; visualIndex < ticket.visuals.length; visualIndex++) {
        const visual = ticket.visuals[visualIndex];
        
        if (visual.file) {
          // Upload the file to Supabase
          try {
            const publicUrl = await uploadFileToStorage(
              visual.file, 
              'visuals', 
              eventId, 
              `ticket-${ticketIndex}`
            );
            
            updatedVisuals.push({
              url: publicUrl,
              caption: visual.caption || '',
              type: visual.type,
              name: visual.name
            });
          } catch (error) {
            console.error(`Failed to upload visual for ticket ${ticketIndex}:`, error);
            // Keep the visual data but without the file reference
            updatedVisuals.push({
              url: visual.url,
              caption: visual.caption || '',
              type: visual.type,
              name: visual.name
            });
          }
        } else if (visual.url && !visual.url.startsWith('blob:')) {
          // If it's already a URL (not a blob), keep it
          updatedVisuals.push(visual);
        }
        // If it's a blob URL and no file, skip it (temporary preview)
      }
      
      updatedTickets[ticketIndex] = {
        ...ticket,
        visuals: updatedVisuals
      };
    }
  }
  
  return updatedTickets;
};

// Fixed handleSave function with proper variable names
const handleSave = async () => {
  try {
    setLoading(true);
    
    // Process and upload all visual files first
    let ticketsToSave = formData.tickets || [];
    
    if (ticketsToSave.length > 0) {
      ticketsToSave = await processVisualUploads(ticketsToSave, event.id);
    }
    
    // Prepare the final data for saving
    const saveData = {
      ...formData,
      tickets: ticketsToSave
    };

    // Remove temporary file objects before saving to database
    const cleanTickets = ticketsToSave.map(ticket => ({
      ...ticket,
      visuals: ticket.visuals ? ticket.visuals.map(visual => ({
        url: visual.url,
        caption: visual.caption,
        type: visual.type,
        name: visual.name
      })) : [],
      // Include the new event date, time, and venue fields
      event_date: ticket.event_date || '',
      event_time: ticket.event_time || '',
      venue: ticket.venue || ''
    }));

    const finalSaveData = {
      ...saveData,
      tickets: cleanTickets
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('events')
      .update(finalSaveData)
      .eq('id', event.id)
      .select();

    if (error) throw error;

      // Show success message
      setToast({
        type: 'success',
        text: 'Event updated successfully!'
      });

      // Call onSave prop if provided
      if (onSave) {
        onSave(data[0]);
      }

    } catch (error) {
      console.error('Error saving event:', error);
      setToast({
        type: 'error',
        text: error.message || 'Failed to save event. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      setLoading(true);
      
      // Delete candidates first (due to foreign key constraint)
      const { error: candidateError } = await supabase
        .from('candidates')
        .delete()
        .eq('event_id', event.id);

      if (candidateError) throw candidateError;

      // Delete event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      
      if (onDelete) {
        onDelete(event.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting event');
    } finally {
      setLoading(false);
    }
  };

  // Check if file is video - SAFE VERSION
const isVideoFile = (url) => {
  // Handle cases where url is not a string
  if (!url || typeof url !== 'string') return false;
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

  // Update tabs to include Forms tab
  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "appearance", label: "Appearance" },
    { id: "header", label: "Header" }, // NEW HEADER TAB
    { id: "content", label: "Content" },
    { id: "media", label: "Media" },
    { id: "candidates", label: `Candidates (${candidates.length})` },
    { id: "awards", label: "Awards" }, // NEW AWARDS TAB
    { id: "schedule", label: "Schedule" },
    { id: "gallery", label: "Gallery" },
    { id: "videos", label: "Videos" },
    { id: "news", label: "News" },
    { id: "tickets", label: "Tickets" },
    { id: "forms", label: "Forms" } // Add Forms tab
  ];

  const mediaGroupLabels = {
    group_banner1: "Event Visuals",
    group_banner2: "Sponsors Logo", 
    group_poster1: "Ads Posters"
  };

  // Safe array access helper
  const getArrayField = (field) => {
    return Array.isArray(formData[field]) ? formData[field] : [];
  };

  // Toast effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header - Mobile Optimized - DELETION BUTTON REMOVED */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
              {event ? `Edit ${event.name}` : 'Create Event'}
            </h2>
            <p className="text-xs md:text-sm text-gray-600 truncate">Manage event details</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 ml-2">
            {/* DELETE BUTTON REMOVED AS REQUESTED */}
            <button
              onClick={handleSave}
              disabled={loading || uploading}
              className="px-3 md:px-6 py-1 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors disabled:opacity-50 text-xs md:text-sm"
            >
              <Save className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save Changes'}</span>
              <span className="sm:hidden">{loading ? '...' : 'Save'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Tabs - Mobile Optimized */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 px-2 md:px-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-yellow-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            {activeTab === "basic" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                {/* Basic Info Content - Same as before */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                      placeholder="Enter event name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                      placeholder="event-slug"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                    placeholder="Describe your event (Note this is not your full event description, so make it short)..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                      placeholder="e.g., Competition, Conference"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                      placeholder="Catchy event tagline"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.launch}
                      onChange={(e) => handleInputChange('launch', e.target.checked)}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Launch Event</span>
                  </label>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                      placeholder="Unique event code"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "appearance" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.page_color}
                        onChange={(e) => handleInputChange('page_color', e.target.value)}
                        className="w-12 h-12 rounded-lg border border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.page_color}
                        onChange={(e) => handleInputChange('page_color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                        placeholder="#D4AF37"
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Management - FIXED VERSION */}
<div>
  <div className="flex items-center justify-between mb-4">
    <label className="block text-sm font-medium text-gray-700">
      Statistics
    </label>
    <button
      onClick={() =>
        addArrayItem('stats', {
          icon: 'Users',
          title: 'New Stat',
          number: '',
        })
      }
      className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
    >
      <Plus className="w-4 h-4" />
      Add Stat
    </button>
  </div>

  <div className="space-y-3">
    {getArrayField('stats').map((stat, index) => (
      <StatItemWithModal
        key={index}
        stat={stat}
        index={index}
        onUpdate={(updatedStat) => {
          // This properly updates the stats array
          handleArrayFieldChange('stats', index, updatedStat);
        }}
        onRemove={() => {
          // This properly removes from the stats array
          removeArrayItem('stats', index);
        }}
      />
    ))}
  </div>
</div>

              </motion.div>
            )}

{activeTab === "header" && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4 md:space-y-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Header Navigation Settings</h3>
        <p className="text-sm text-gray-600">
          Control which navigation items appear in your event header
        </p>
      </div>
    </div>

    {/* EditNavigation Component */}
    <EditNavigation event={event} />
  </motion.div>
)}

            {activeTab === "content" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Hero Sections
                    </label>
                    <button
                      onClick={() => addArrayItem('hero_sections', { type: 'image', src: '', caption: '', cta: { label: '', href: '' } })}
                      className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Hero Section
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {getArrayField('hero_sections').map((section, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <select
                            value={section.type}
                            onChange={(e) => handleArrayFieldChange('hero_sections', index, { ...section, type: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                          
                          <button
                            type="button"
                            onClick={() => handleImageSelect('hero_sections', true, index)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Choose File
                          </button>
                          
                          {section.src && (
  <div className="flex items-center gap-2">
    {typeof section.src === 'string' && isVideoFile(section.src) ? (
      <div className="relative">
        <video className="w-12 h-12 object-cover rounded" muted>
          <source src={section.src} type="video/mp4" />
        </video>
        <Play className="w-4 h-4 absolute inset-0 m-auto text-white" />
      </div>
    ) : (
      <img src={typeof section.src === 'string' ? section.src : ''} alt="Preview" className="w-12 h-12 object-cover rounded" />
    )}
    <span className="text-sm text-gray-600 truncate max-w-32">
      {typeof section.src === 'string' ? section.src.split('/').pop() : 'Invalid URL'}
    </span>
  </div>
)}
                          
                          <button
                            onClick={() => removeArrayItem('hero_sections', index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          value={section.caption}
                          onChange={(e) => handleArrayFieldChange('hero_sections', index, { ...section, caption: e.target.value })}
                          placeholder="Caption text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm md:text-base"
                        />

                        {/* HERO TAGLINE FIELD ADDED HERE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hero Tagline
                  </label>
                  <input
                    type="text"
                    value={section.tagline}
                    onChange={(e) => handleArrayFieldChange('hero_sections', index, { ...section, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base"
                    placeholder="Enter a compelling tagline for this hero if you want"
                  />
                
                </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          
                          <input
                            type="text"
                            value={section.cta?.label || ''}
                            onChange={(e) => handleArrayFieldChange('hero_sections', index, { 
                              ...section, 
                              cta: { ...section.cta, label: e.target.value } 
                            })}
                            placeholder="CTA Label"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                          />
                          <input
                            type="text"
                            value={section.cta?.href || ''}
                            onChange={(e) => handleArrayFieldChange('hero_sections', index, { 
                              ...section, 
                              cta: { ...section.cta, href: e.target.value } 
                            })}
                            placeholder="CTA Link"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "awards" && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4 md:space-y-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Award Management</h3>
        <p className="text-sm text-gray-600">
          Manage awards, categories, and winners for your event
        </p>
      </div>
    </div>

    {/* AwardManagement Component Integration - FIXED PROPS */}
    <AwardManagement event={event} /> {/* Changed from eventId to event */}
  </motion.div>
)}

            {activeTab === "media" && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4 md:space-y-6"
  >
    {/* Logo Upload */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Event Logo
      </label>
      <div className="flex items-center gap-4">
        {formData.logo && (
          <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
        )}
        <button
          type="button"
          onClick={() => handleImageSelect('logo')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
        >
          <ImageIcon className="w-4 h-4" />
          Choose Logo
        </button>
      </div>
    </div>

    {/* Thumbnail Upload */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Event Thumbnail
      </label>
      <div className="flex items-center gap-4">
        {formData.thumbnail && (
          <img src={formData.thumbnail} alt="Thumbnail" className="w-32 h-20 rounded-lg object-cover" />
        )}
        <button
          type="button"
          onClick={() => handleImageSelect('thumbnail')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
        >
          <ImageIcon className="w-4 h-4" />
          Choose Thumbnail
        </button>
      </div>
    </div>

    {/* Media Groups */}
    {['group_banner1', 'group_banner2', 'group_poster1'].map(group => (
      <div key={group}>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700 capitalize">
            {mediaGroupLabels[group]}
          </label>
          <button
            onClick={() => addArrayItem(group, '')}
            className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Media
          </button>
        </div>
        
        <div className="space-y-2">
          {getArrayField(group).map((url, index) => {
            // Extract the actual URL from the object
            const actualUrl = typeof url === 'string' ? url : url?.src || '';
            
            return (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleImageSelect(group, true, index)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose File
                </button>
                
                {actualUrl && (
                  <div className="flex items-center gap-2 flex-1">
                    {isVideoFile(actualUrl) ? (
                      <div className="relative">
                        <video className="w-12 h-12 object-cover rounded" muted>
                          <source src={actualUrl} type="video/mp4" />
                        </video>
                        <Play className="w-4 h-4 absolute inset-0 m-auto text-white" />
                      </div>
                    ) : (
                      <img 
                        src={actualUrl} 
                        alt="Preview" 
                        className="w-12 h-12 object-cover rounded" 
                      />
                    )}
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {actualUrl.split('/').pop()}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => removeArrayItem(group, index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </motion.div>
)}

            {activeTab === "candidates" && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4 md:space-y-6"
  >
    {/* Header + Add Button */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <label className="block text-lg font-semibold text-gray-900">
        Candidates Management
      </label>
      <button
        onClick={addCandidate}
        className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2 text-sm md:text-base"
      >
        <Plus className="w-4 h-4" />
        Add Candidate
      </button>
    </div>

    {/* Candidates Table */}
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left">Photo</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left">Full Name</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left hidden md:table-cell">About</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left">Contest No.</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left">Votes</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left hidden sm:table-cell">Gifts</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left hidden lg:table-cell">Banner</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left hidden lg:table-cell">Gallery</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left">Status</th>
            <th className="border border-gray-200 px-2 md:px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate, index) => (
            <tr key={candidate.id} className="hover:bg-gray-50">
              {/* Photo */}
              <td className="border border-gray-200 px-2 md:px-4 py-2">
                <div className="flex flex-col items-center gap-2">
                  {candidate.photo ? (
                    <img
                      src={candidate.photo}
                      alt="Candidate"
                      className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCandidateImageSelect(index, 'photo')}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Upload
                  </button>
                </div>
              </td>

              {/* Full Name */}
              <td className="border border-gray-200 px-2 md:px-4 py-2">
                <input
                  type="text"
                  value={candidate.full_name}
                  onChange={(e) =>
                    updateCandidate(index, 'full_name', e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Full Name"
                />
              </td>

              {/* About */}
              <td className="border border-gray-200 px-2 md:px-4 py-2 hidden md:table-cell">
                <textarea
                  value={candidate.about}
                  onChange={(e) =>
                    updateCandidate(index, 'about', e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="About candidate"
                  rows={2}
                />
              </td>

              {/* Contest Number */}
              <td className="border border-gray-200 px-2 md:px-4 py-2">
                <input
                  type="text"
                  value={candidate.contest_number}
                  onChange={(e) =>
                    updateCandidate(index, 'contest_number', e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Contest No."
                />
              </td>

              {/* Votes */}
              <td className="border border-gray-200 px-2 md:px-4 py-2">
                <input
                  type="number"
                  value={candidate.votes}
                  onChange={(e) =>
                    updateCandidate(index, 'votes', parseInt(e.target.value) || 0)
                  }
                  className="w-16 md:w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </td>

              {/* Gifts */}
              <td className="border border-gray-200 px-2 md:px-4 py-2 hidden sm:table-cell">
                <input
                  type="number"
                  value={candidate.gifts}
                  onChange={(e) =>
                    updateCandidate(index, 'gifts', parseInt(e.target.value) || 0)
                  }
                  className="w-16 md:w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </td>

              {/* Banner */}
              <td className="border border-gray-200 px-2 md:px-4 py-2 hidden lg:table-cell">
                <div className="flex flex-col items-center gap-2">
                  {candidate.banner ? (
                    <img
                      src={candidate.banner}
                      alt="Banner"
                      className="w-12 h-8 md:w-16 md:h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-8 md:w-16 md:h-10 bg-gray-200 rounded flex items-center justify-center">
                      <ImageIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCandidateImageSelect(index, 'banner')}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Upload
                  </button>
                </div>
              </td>

              {/* Gallery */}
              <td className="border border-gray-200 px-2 md:px-4 py-2 hidden lg:table-cell">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-1">
                    {candidate.gallery.slice(0, 2).map((img, imgIndex) => (
                      <div key={imgIndex} className="relative">
                        <img
                          src={img}
                          alt={`Gallery ${imgIndex + 1}`}
                          className="w-6 h-6 md:w-8 md:h-8 object-cover rounded"
                        />
                        <button
                          onClick={() => removeCandidateGallery(index, imgIndex)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 md:w-4 md:h-4 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {candidate.gallery.length < 6 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) updateCandidateGallery(index, file);
                        };
                        input.click();
                      }}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Add ({6 - candidate.gallery.length} left)
                    </button>
                  )}
                  <span className="text-xs text-gray-500">
                    {candidate.gallery.length}/6
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="border border-gray-200 px-2 md:px-4 py-2">
                <button
                  onClick={() => toggleCandidateApproval(index)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    candidate.approved
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {candidate.approved ? (
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                  ) : (
                    <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {candidate.approved ? "Approved" : "Pending"}
                  </span>
                </button>
              </td>

              {/* Actions */}
              <td className="border border-gray-200 px-2 md:px-4 py-2">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => saveCandidate(index)}
                    disabled={savingCandidate === index}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    {savingCandidate === index ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => removeCandidate(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {candidates.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm md:text-base">
          No candidates added yet. Click "Add Candidate" to get started.
        </div>
      )}
    </div>

    {/* ===========================
        GLOBAL VISIBILITY TOGGLES
    =========================== */}
    <div className="mt-6 mb-10 bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        Visibility Controls
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Votes Toggle */}
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-700">Show Votes</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={candidates.some((c) => c.votes_toggle)}
              onChange={(e) => toggleShowVotes(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></span>
          </label>
        </div>

        {/* Gifts Toggle */}
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-700">Show Gifts</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={candidates.some((c) => c.gifts_toggle)}
              onChange={(e) => toggleShowGifts(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></span>
          </label>
        </div>

        {/* Views Toggle */}
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-700">Show Views</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={candidates.some((c) => c.views_toggle)}
              onChange={(e) => toggleShowViews(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></span>
          </label>
        </div>

        {/* Points Toggle */}
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-700">Show Points</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={candidates.some((c) => c.points_toggle)}
              onChange={(e) => toggleShowPoints(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></span>
          </label>
        </div>
      </div>
    </div>
  </motion.div>
)}

            {activeTab === "schedule" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-semibold text-gray-900">
                    Event Schedule & Activities
                  </label>
                  <button
                    onClick={addActivity}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Activity
                  </button>
                </div>

                <div className="space-y-4">
                  {getArrayField('activities').map((activity, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Activity {index + 1}</h3>
                        <button
                          onClick={() => removeArrayItem('activities', index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Activity Image
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleImageSelect('activities', true, index, 'image')}
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Choose Image
                            </button>
                            {activity.image && (
                              <img src={activity.image} alt="Activity" className="w-16 h-16 object-cover rounded" />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Activity Title
                          </label>
                          <input
                            type="text"
                            value={activity.title || ''}
                            onChange={(e) => updateActivity(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                            placeholder="Activity title"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={activity.description || ''}
                            onChange={(e) => updateActivity(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                            placeholder="Activity description"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            value={activity.date || ''}
                            onChange={(e) => updateActivity(index, 'date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            value={activity.time || ''}
                            onChange={(e) => updateActivity(index, 'time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Countdown Target (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={activity.countdown_target || ''}
                            onChange={(e) => updateActivity(index, 'countdown_target', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {getArrayField('activities').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm md:text-base">
                      No activities added yet. Click "Add Activity" to get started.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "gallery" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-semibold text-gray-900">
                    Event Gallery
                  </label>
                  <button
                    onClick={addGalleryItem}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Image
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getArrayField('main_gallery').map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="relative aspect-square bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedImage(item);
                          incrementGalleryViews(index);
                        }}
                      >
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.caption} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                          <Eye className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => handleImageSelect('main_gallery', true, index, 'image')}
                            className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-sm"
                          >
                            {item.image ? 'Change Image' : 'Upload Image'}
                          </button>
                          <button
                            onClick={() => removeArrayItem('main_gallery', index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          value={item.caption || ''}
                          onChange={(e) => updateGalleryItem(index, 'caption', e.target.value)}
                          placeholder="Image caption"
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                        />

                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => incrementGalleryLikes(index)}
                              className="flex items-center gap-1 hover:text-red-500"
                            >
                              <Heart className="w-3 h-3" />
                              {item.likes || 0}
                            </button>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {item.views || 0}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={item.downloadable !== false}
                                onChange={(e) => updateGalleryItem(index, 'downloadable', e.target.checked)}
                                className="rounded"
                              />
                              <Download className="w-3 h-3" />
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={item.shareable !== false}
                                onChange={(e) => updateGalleryItem(index, 'shareable', e.target.checked)}
                                className="rounded"
                              />
                              <Share2 className="w-3 h-3" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {getArrayField('main_gallery').length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm md:text-base">
                    No gallery images added yet. Click "Add Image" to get started.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "videos" && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4 md:space-y-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Video Management</h3>
        <p className="text-sm text-gray-600">
          Manage videos for your event gallery
        </p>
      </div>
    </div>

    {/* GalleryVideos Component Integration */}
    <GalleryVideos event={event} />
  </motion.div>
)}

            {activeTab === "news" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-semibold text-gray-900">
                    Event News & Updates
                  </label>
                  <button
                    onClick={addNewsItem}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add News
                  </button>
                </div>

                <div className="space-y-6">
                  {getArrayField('news').map((newsItem, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">News {index + 1}</h3>
                        <button
                          onClick={() => removeArrayItem('news', index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            News Image
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleImageSelect('news', true, index, 'image')}
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Choose Image
                            </button>
                            {newsItem.image && (
                              <img src={newsItem.image} alt="News" className="w-16 h-16 object-cover rounded" />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Published Date
                          </label>
                          <input
                            type="date"
                            value={newsItem.published_at || ''}
                            onChange={(e) => updateNewsItem(index, 'published_at', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={newsItem.title || ''}
                            onChange={(e) => updateNewsItem(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                            placeholder="News title"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Author
                          </label>
                          <input
                            type="text"
                            value={newsItem.author || ''}
                            onChange={(e) => updateNewsItem(index, 'author', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                            placeholder="Author name"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Views: {newsItem.views || 0}
                          </label>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content
                          </label>
                          <textarea
                            value={newsItem.content || ''}
                            onChange={(e) => updateNewsItem(index, 'content', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                            placeholder="News content..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {getArrayField('news').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm md:text-base">
                      No news articles added yet. Click "Add News" to get started.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "tickets" && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4 md:space-y-6"
  >
    {/* Tickets Content - Same as before */}
    <div className="flex items-center justify-between mb-4">
      <label className="block text-lg font-semibold text-gray-900">
        Ticket Management
      </label>
      <button
        onClick={addTicket}
        className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Ticket
      </button>
    </div>

    <div className="space-y-6">
      {getArrayField('tickets').map((ticket, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{ticket.name || `Ticket ${index + 1}`}</h3>
            <button
              onClick={() => removeArrayItem('tickets', index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Name
              </label>
              <input
                type="text"
                value={ticket.name || ''}
                onChange={(e) => updateTicket(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                placeholder="e.g., VIP, General Admission"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (Tokens)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Coins className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={ticket.price || 0}
                  onChange={(e) => updateTicket(index, 'price', parseInt(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Whole tokens only (no decimals)
              </p>
            </div>

            {/* New Event Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date
              </label>
              <input
                type="date"
                value={ticket.event_date || ''}
                onChange={(e) => updateTicket(index, 'event_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
              />
            </div>

            {/* New Event Time Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Time
              </label>
              <input
                type="time"
                value={ticket.event_time || ''}
                onChange={(e) => updateTicket(index, 'event_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
              />
            </div>

            {/* New Venue Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                value={ticket.venue || ''}
                onChange={(e) => updateTicket(index, 'venue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                placeholder="Enter event venue or location"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={ticket.description || ''}
                onChange={(e) => updateTicket(index, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                placeholder="Ticket description and benefits"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Quantity
              </label>
              <input
                type="number"
                value={ticket.available_quantity || 0}
                onChange={(e) => updateTicket(index, 'available_quantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                placeholder="100"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Start
              </label>
              <input
                type="datetime-local"
                value={ticket.sale_start || ''}
                onChange={(e) => updateTicket(index, 'sale_start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale End
              </label>
              <input
                type="datetime-local"
                value={ticket.sale_end || ''}
                onChange={(e) => updateTicket(index, 'sale_end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
              />
            </div>

            {/* Visuals Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Ticket Visuals (Up to 3)
                </label>
                <button
                  onClick={() => addTicketVisual(index)}
                  disabled={(ticket.visuals || []).length >= 3}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Visual
                </button>
              </div>
              
              <div className="space-y-4">
                {(ticket.visuals || []).map((visual, visualIndex) => (
                  <div key={visualIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Visual {visualIndex + 1}
                      </span>
                      <button
                        onClick={() => removeTicketVisual(index, visualIndex)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Visual Preview */}
                    {visual.url && (
                      <div className="mb-3">
                        <div className="aspect-[5/2.5] w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                          {visual.type === 'video' ? (
                            <video
                              src={visual.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <img
                              src={visual.url}
                              alt={`Ticket visual ${visualIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {visual.type === 'video' ? 'Video' : 'Image'} - {visual.name}
                        </p>
                      </div>
                    )}

                    {/* Visual Upload */}
                    <div className="space-y-3">
                      <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          onChange={(e) => handleVisualUpload(index, visualIndex, e)}
                        />
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {visual.url ? 'Replace Visual' : 'Upload Visual'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Images (max 5MB) or Videos (max 10MB, 1min)
                          </span>
                        </div>
                      </label>

                      {/* Visual Caption */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Caption (Optional)
                        </label>
                        <input
                          type="text"
                          value={visual.caption || ''}
                          onChange={(e) => updateTicketVisual(index, visualIndex, 'caption', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Add a caption for this visual"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(ticket.visuals || []).length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No visuals added</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add up to 3 images or videos to showcase this ticket
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Features
                </label>
                <button
                  onClick={() => addTicketFeature(index)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Add Feature
                </button>
              </div>
              
              <div className="space-y-2">
                {(ticket.features || []).map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateTicketFeature(index, featureIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                      placeholder="Feature description"
                    />
                    <button
                      onClick={() => removeTicketFeature(index, featureIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {getArrayField('tickets').length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm md:text-base">
          No tickets added yet. Click "Add Ticket" to get started.
        </div>
      )}
    </div>
  </motion.div>
)}

            {/* NEW FORMS TAB - Added after tickets */}
            {activeTab === "forms" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Form Management</h3>
                    <p className="text-sm text-gray-600">
                      Create and manage custom forms for your event attendees
                    </p>
                  </div>
                </div>

                {/* FormPanel Component Integration */}
                <FormPanel eventId={event.id} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Image Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-4xl max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={selectedImage.image} 
                  alt={selectedImage.caption} 
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                  <p className="text-lg font-semibold">{selectedImage.caption}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          const itemIndex = getArrayField('main_gallery').findIndex(item => item.image === selectedImage.image);
                          if (itemIndex !== -1) incrementGalleryLikes(itemIndex);
                          setSelectedImage({...selectedImage, likes: (selectedImage.likes || 0) + 1});
                        }}
                        className="flex items-center gap-1 hover:text-red-400"
                      >
                        <Heart className="w-5 h-5" />
                        {selectedImage.likes || 0}
                      </button>
                      <div className="flex items-center gap-1">
                        <Eye className="w-5 h-5" />
                        {selectedImage.views || 0}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedImage.downloadable !== false && (
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedImage.image;
                            link.download = selectedImage.caption || 'image';
                            link.click();
                          }}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                      {selectedImage.shareable !== false && (
                        <button 
                          onClick={() => navigator.share?.({ url: selectedImage.image, title: selectedImage.caption })}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}