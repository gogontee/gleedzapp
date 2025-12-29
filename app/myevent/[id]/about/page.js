"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit3, Save, Plus, Trash2, Eye, EyeOff, Users, Target, 
  Award, Globe, ChevronLeft, ChevronRight, Play, Pause,
  Crown, Share2, Heart, MapPin, Clock, Menu, X,
  Building, ExternalLink, Bold, Italic, Link, List, Image,
  ChevronDown, ChevronUp
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader";
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Helper function to count words and check if content is long
const countWords = (htmlContent) => {
  if (!htmlContent) return 0;
  const text = htmlContent.replace(/<[^>]*>/g, ' '); // Remove HTML tags
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Helper component to render rich text with "Read More" functionality
const RichTextWithReadMore = ({ content, maxWords = 60, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const wordCount = useMemo(() => countWords(content), [content]);
  const shouldTruncate = wordCount > maxWords && !isExpanded;

  // Function to truncate HTML content by words
  const truncateHTML = (html, maxWords) => {
    if (!html) return "";
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let wordCount = 0;
    const walkNodes = (node) => {
      if (wordCount >= maxWords) return;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.trim().split(/\s+/);
        if (wordCount + words.length <= maxWords) {
          wordCount += words.length;
        } else {
          const remainingWords = maxWords - wordCount;
          node.textContent = words.slice(0, remainingWords).join(' ') + '...';
          wordCount = maxWords;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let child of node.childNodes) {
          walkNodes(child);
          if (wordCount >= maxWords) break;
        }
      }
    };
    
    walkNodes(tempDiv);
    return tempDiv.innerHTML;
  };

  const displayContent = shouldTruncate ? truncateHTML(content, maxWords) : content;

  if (!content) {
    return (
      <p className="text-gray-500 italic text-sm md:text-base">
        No content provided.
      </p>
    );
  }

  return (
    <div className={`rich-text-content ${className}`}>
      <div 
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {wordCount > maxWords && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm mt-3 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Read More
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Special component for About, Mission, Vision, Objectives sections - Read More at the end
const MainContentWithReadMore = ({ content, maxWords = 60, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const wordCount = useMemo(() => countWords(content), [content]);

  if (!content) {
    return (
      <p className="text-gray-500 italic text-sm md:text-base">
        No content provided.
      </p>
    );
  }

  return (
    <div className={`rich-text-content ${className}`}>
      {/* Always show full content, but control visibility with CSS */}
      <div 
        dangerouslySetInnerHTML={{ __html: content }}
        className={`transition-all duration-300 ${!isExpanded && wordCount > maxWords ? 'max-h-48 overflow-hidden relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-white after:to-transparent' : ''}`}
      />
      {wordCount > maxWords && (
        <div className="mt-4">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Read More
            </button>
          ) : (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
              Show Less
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Alternative approach: Truncate text properly with fade effect
const TruncatedContent = ({ content, maxWords = 60, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const wordCount = useMemo(() => countWords(content), [content]);

  // Function to get truncated text (simpler approach)
  const getTruncatedText = (html, maxWords) => {
    if (!html) return "";
    
    // Simple approach: convert to text, truncate, then wrap in paragraph
    const text = html.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/);
    
    if (words.length <= maxWords) {
      return html;
    }
    
    const truncatedWords = words.slice(0, maxWords);
    return `<p>${truncatedWords.join(' ')}...</p>`;
  };

  const displayContent = !isExpanded && wordCount > maxWords 
    ? getTruncatedText(content, maxWords) 
    : content;

  if (!content) {
    return (
      <p className="text-gray-500 italic text-sm md:text-base">
        No content provided.
      </p>
    );
  }

  return (
    <div className={`rich-text-content ${className}`}>
      <div 
        dangerouslySetInnerHTML={{ __html: displayContent }}
        className={`${!isExpanded && wordCount > maxWords ? 'relative' : ''}`}
      />
      {wordCount > maxWords && (
        <div className="mt-4">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Read More
            </button>
          ) : (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
              Show Less
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Component for team member display with optimized mobile view
const TeamMemberCard = ({ member, index, editMode, updateTeamMember, removeTeamMember, handleFileUpload }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
      {editMode ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={member.name}
                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                placeholder="Full Name"
                className="w-full font-bold text-lg border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
              />
              <input
                type="text"
                value={member.role}
                onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                placeholder="Role/Position"
                className="w-full text-gray-600 border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1 mt-1 text-sm bg-transparent"
              />
            </div>
            <button
              onClick={() => removeTeamMember(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
              {member.photo ? (
                <img src={member.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
              )}
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = await handleFileUpload(file, 'team');
                    if (url) updateTeamMember(index, 'photo', url);
                  }
                }}
                className="w-full text-sm file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-full file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-300 p-2">
              <p className="text-xs text-gray-600 font-medium">About (Rich Text)</p>
            </div>
            {typeof window !== 'undefined' && (
              <ReactQuill
                theme="snow"
                value={member.about}
                onChange={(value) => updateTeamMember(index, 'about', value)}
                modules={{
                  toolbar: [
                    ['bold', 'italic'],
                    [{'list': 'bullet'}],
                    ['link', 'clean']
                  ]
                }}
                className="h-32"
                placeholder="Tell us about this team member..."
              />
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg flex-shrink-0 mx-auto sm:mx-0">
              {member.photo ? (
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-1">{member.name || 'Team Member'}</h3>
              <p className="text-gray-600 text-sm sm:text-base">{member.role || 'Team Role'}</p>
            </div>
          </div>
          
          <div className="text-gray-700">
            {member.about ? (
              <div>
                <RichTextWithReadMore 
                  content={member.about} 
                  maxWords={40} // Lower threshold for team bios
                  className="text-sm sm:text-base"
                />
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No description provided.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AboutPage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [fullDetail, setFullDetail] = useState({
    about: { enabled: true, content: "", title: "About Us" },
    mission: { enabled: true, content: "", title: "Our Mission" },
    vision: { enabled: true, content: "", title: "Our Vision" },
    objectives: { enabled: true, content: "", title: "Our Objectives" },
    team: { 
      enabled: true, 
      members: [],
      title: "Our Team"
    },
    sponsors: {
      enabled: true,
      categories: {},
      title: "Our Sponsors"
    }
  });
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const heroTimerRef = useRef(null);

  // Quill editor modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image',
    'color', 'background'
  ];

  // Fetch event data and check ownership
  useEffect(() => {
    const fetchEventAndCheckOwner = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return;
      }

      setEvent(eventData);
      
      // Initialize full_detail with defaults if empty
      if (eventData.full_detail) {
        setFullDetail(prev => ({
          ...prev,
          ...eventData.full_detail
        }));
      }
      
      setIsOwner(user && user.id === eventData.user_id);
      setLoading(false);
    };

    if (eventId) fetchEventAndCheckOwner();
  }, [eventId]);

  // Hero slideshow logic
  useEffect(() => {
    const heroSlides = event?.hero_sections || [];
    if (!isPlaying || heroSlides.length === 0) return;

    const slide = heroSlides[heroIndex];
    if (!slide) return;

    clearTimeout(heroTimerRef.current);

    if (slide.type === "video") {
      // For videos, rely on video's ended event only
    } else {
      heroTimerRef.current = setTimeout(() => {
        setHeroIndex((i) => (i + 1) % heroSlides.length);
      }, 5000);
    }

    return () => clearTimeout(heroTimerRef.current);
  }, [heroIndex, event?.hero_sections, isPlaying]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('events')
        .update({ full_detail: fullDetail })
        .eq('id', eventId);

      if (error) throw error;
      
      setEditMode(false);
      alert('About page updated successfully!');
    } catch (error) {
      console.error('Error saving about page:', error);
      alert('Error saving about page: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setFullDetail(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled
      }
    }));
  };

  const updateSectionContent = (section, field, value) => {
    setFullDetail(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Team member functions
  const addTeamMember = () => {
    setFullDetail(prev => ({
      ...prev,
      team: {
        ...prev.team,
        members: [
          ...prev.team.members,
          {
            id: Date.now().toString(),
            name: "",
            role: "",
            about: "",
            photo: "",
            expanded: false
          }
        ]
      }
    }));
  };

  const updateTeamMember = (index, field, value) => {
    setFullDetail(prev => ({
      ...prev,
      team: {
        ...prev.team,
        members: prev.team.members.map((member, i) => 
          i === index ? { ...member, [field]: value } : member
        )
      }
    }));
  };

  const removeTeamMember = (index) => {
    setFullDetail(prev => ({
      ...prev,
      team: {
        ...prev.team,
        members: prev.team.members.filter((_, i) => i !== index)
      }
    }));
  };

  // Sponsor functions
  const addSponsorCategory = (categoryName) => {
    if (!categoryName.trim()) return;
    
    setFullDetail(prev => ({
      ...prev,
      sponsors: {
        ...prev.sponsors,
        categories: {
          ...prev.sponsors.categories,
          [categoryName]: []
        }
      }
    }));
  };

  const addSponsor = (category) => {
    setFullDetail(prev => ({
      ...prev,
      sponsors: {
        ...prev.sponsors,
        categories: {
          ...prev.sponsors.categories,
          [category]: [
            ...(prev.sponsors.categories[category] || []),
            {
              id: Date.now().toString(),
              name: "",
              logo: "",
              description: "",
              website: ""
            }
          ]
        }
      }
    }));
  };

  const updateSponsor = (category, index, field, value) => {
    setFullDetail(prev => ({
      ...prev,
      sponsors: {
        ...prev.sponsors,
        categories: {
          ...prev.sponsors.categories,
          [category]: (prev.sponsors.categories[category] || []).map((sponsor, i) => 
            i === index ? { ...sponsor, [field]: value } : sponsor
          )
        }
      }
    }));
  };

  const removeSponsor = (category, index) => {
    setFullDetail(prev => ({
      ...prev,
      sponsors: {
        ...prev.sponsors,
        categories: {
          ...prev.sponsors.categories,
          [category]: (prev.sponsors.categories[category] || []).filter((_, i) => i !== index)
        }
      }
    }));
  };

  const removeSponsorCategory = (category) => {
    const updatedCategories = { ...fullDetail.sponsors.categories };
    delete updatedCategories[category];
    
    setFullDetail(prev => ({
      ...prev,
      sponsors: {
        ...prev.sponsors,
        categories: updatedCategories
      }
    }));
  };

  // File upload function
  const handleFileUpload = async (file, type) => {
    try {
      const BUCKET_NAME = 'event-assets';
      const eventSlug = event?.slug || 'event';
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${type}-${timestamp}.${fileExt}`;
      const filePath = `events/${eventSlug}/about/${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file: ' + error.message);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading about page...</p>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";
  const heroSlides = event?.hero_sections || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-1">

      {/* Add EventHeader Component */}
      <EventHeader event={event} />

      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative w-full h-[35vh] sm:h-[40vh] md:h-[50vh] overflow-hidden">
          <AnimatePresence mode="wait">
            {heroSlides.map((slide, i) => {
              if (i !== heroIndex) return null;
              return slide.type === "video" ? (
                <motion.video
                  key={slide.id}
                  src={slide.src}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  onEnded={() => setHeroIndex((i) => (i + 1) % heroSlides.length)}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              ) : (
                <motion.div
                  key={slide.id}
                  className="absolute inset-0 w-full h-full"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  <img 
                    src={slide.src} 
                    alt={slide.caption} 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto z-20 max-w-2xl">
            <motion.div 
              className="text-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 leading-tight">
                About {event?.name}
              </h1>
              <p className="text-sm sm:text-base md:text-xl text-gray-200 font-light">
                Discover our story, team, and valued partners
              </p>
            </motion.div>
          </div>

          {heroSlides.length > 1 && (
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              <button 
                onClick={() => setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setHeroIndex((i) => (i + 1) % heroSlides.length)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Edit Mode Toggle */}
        {isOwner && (
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md ${
                      editMode 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'text-white hover:opacity-90'
                    }`}
                    style={editMode ? {} : { backgroundColor: pageColor }}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline">{editMode ? 'Exit Edit Mode' : 'Edit About Page'}</span>
                    <span className="sm:hidden">{editMode ? 'Exit Edit' : 'Edit'}</span>
                  </button>
                  
                  {editMode && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
                      <span className="sm:hidden">{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  )}
                </div>

                {editMode && (
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="hidden sm:inline">Edit mode active</span>
                      <span className="sm:hidden">Editing</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
          {/* Section Toggles - Edit Mode Only */}
          {editMode && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200"
            >
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Manage Sections</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {['about', 'mission', 'vision', 'objectives', 'team', 'sponsors'].map((section) => (
                  <button
                    key={section}
                    onClick={() => toggleSection(section)}
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-[1.02] ${
                      fullDetail[section]?.enabled
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-semibold capitalize mb-1 flex items-center gap-1.5">
                      {fullDetail[section]?.enabled ? (
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      )}
                      {section}
                    </div>
                    <div className="text-xs">
                      {fullDetail[section]?.enabled ? 'Visible' : 'Hidden'}
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* About Section */}
          {fullDetail.about.enabled && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6 sm:p-8 md:p-10">
                {editMode ? (
                  <div className="space-y-6">
                    <input
                      type="text"
                      value={fullDetail.about.title}
                      onChange={(e) => updateSectionContent('about', 'title', e.target.value)}
                      className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 w-full border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none pb-2 sm:pb-3 bg-transparent"
                      placeholder="Section Title"
                    />
                    <div className="border border-gray-300 rounded-lg sm:rounded-xl overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-300 p-2 sm:p-3">
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Rich Text Editor</p>
                      </div>
                      {typeof window !== 'undefined' && (
                        <ReactQuill
                          theme="snow"
                          value={fullDetail.about.content}
                          onChange={(value) => updateSectionContent('about', 'content', value)}
                          modules={quillModules}
                          formats={quillFormats}
                          className="h-48 sm:h-64"
                          placeholder="Tell your story... What makes your event special? Share your journey, values, and what attendees can expect."
                        />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      Use the toolbar above to format your text with headings, lists, colors, and more
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8 text-center">
                      {fullDetail.about.title}
                    </h2>
                    <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed">
                      {fullDetail.about.content ? (
                        <div className="space-y-4">
                          <TruncatedContent 
                            content={fullDetail.about.content} 
                            maxWords={60} // 60 words threshold for About section
                            className="text-sm sm:text-base md:text-lg"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-12 text-gray-500">
                          <p className="text-lg sm:text-xl mb-3">Welcome to our story</p>
                          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                            We're passionate about creating unforgettable experiences that bring people together. 
                            Our event is built on a foundation of excellence, innovation, and community.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Mission, Vision, Objectives Grid */}
          {(fullDetail.mission.enabled || fullDetail.vision.enabled || fullDetail.objectives.enabled) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                { key: 'mission', icon: Target, color: 'blue' },
                { key: 'vision', icon: Globe, color: 'green' },
                { key: 'objectives', icon: Award, color: 'purple' }
              ].map(({ key, icon: Icon, color }) => 
                fullDetail[key].enabled && (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 hover:shadow-xl transition-shadow duration-300 h-full flex flex-col"
                  >
                    {editMode ? (
                      <div className="space-y-4 h-full flex flex-col">
                        <input
                          type="text"
                          value={fullDetail[key].title}
                          onChange={(e) => updateSectionContent(key, 'title', e.target.value)}
                          className="text-lg sm:text-xl font-bold w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-2 bg-transparent"
                          placeholder="Section Title"
                        />
                        <div className="border border-gray-300 rounded-lg overflow-hidden flex-grow">
                          <div className="bg-gray-50 border-b border-gray-300 p-2">
                            <p className="text-xs text-gray-600 font-medium">Rich Text Editor</p>
                          </div>
                          {typeof window !== 'undefined' && (
                            <ReactQuill
                              theme="snow"
                              value={fullDetail[key].content}
                              onChange={(value) => updateSectionContent(key, 'content', value)}
                              modules={{
                                toolbar: [
                                  ['bold', 'italic', 'underline'],
                                  [{'list': 'ordered'}, {'list': 'bullet'}],
                                  ['link', 'clean']
                                ]
                              }}
                              className="h-32 sm:h-40"
                              placeholder={`Describe your ${key}...`}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-${color}-100 flex items-center justify-center mb-4 sm:mb-5`}>
                          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 text-${color}-600`} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{fullDetail[key].title}</h3>
                        <div className="flex-grow">
                          {fullDetail[key].content ? (
                            <TruncatedContent 
                              content={fullDetail[key].content} 
                              maxWords={60} // 60 words threshold for Mission, Vision, Objectives
                              className="text-sm sm:text-base"
                            />
                          ) : (
                            <p className="text-gray-600 text-sm sm:text-base">
                              Our {key} drives everything we do. We're committed to excellence and innovation.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              )}
            </div>
          )}

          {/* Team Section */}
          {fullDetail.team.enabled && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
                  {editMode ? (
                    <input
                      type="text"
                      value={fullDetail.team.title}
                      onChange={(e) => updateSectionContent('team', 'title', e.target.value)}
                      className="text-2xl sm:text-3xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-2 bg-transparent w-full sm:w-auto"
                      placeholder="Section Title"
                    />
                  ) : (
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{fullDetail.team.title}</h2>
                  )}
                  
                  {editMode && (
                    <button
                      onClick={addTeamMember}
                      className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-white rounded-lg font-semibold hover:shadow-md transition-all w-full sm:w-auto justify-center"
                      style={{ backgroundColor: pageColor }}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Member</span>
                      <span className="sm:hidden">Add Team Member</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {fullDetail.team.members.map((member, index) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      index={index}
                      editMode={editMode}
                      updateTeamMember={updateTeamMember}
                      removeTeamMember={removeTeamMember}
                      handleFileUpload={handleFileUpload}
                    />
                  ))}
                  
                  {fullDetail.team.members.length === 0 && !editMode && (
                    <div className="col-span-full text-center py-12 sm:py-16 text-gray-500">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                      </div>
                      <p className="text-base sm:text-lg text-gray-600 mb-2">No team members added yet</p>
                      <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                        The team behind this amazing event will be showcased here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* Sponsors Section */}
          {fullDetail.sponsors.enabled && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
                  {editMode ? (
                    <input
                      type="text"
                      value={fullDetail.sponsors.title}
                      onChange={(e) => updateSectionContent('sponsors', 'title', e.target.value)}
                      className="text-2xl sm:text-3xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-2 bg-transparent w-full sm:w-auto"
                      placeholder="Section Title"
                    />
                  ) : (
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{fullDetail.sponsors.title}</h2>
                  )}
                  
                  {editMode && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                      <input
                        type="text"
                        id="newCategory"
                        placeholder="Category name (e.g., Platinum)"
                        className="px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('newCategory');
                          addSponsorCategory(input.value);
                          input.value = '';
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-white rounded-lg font-semibold text-sm hover:shadow-md transition-all"
                        style={{ backgroundColor: pageColor }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Category
                      </button>
                    </div>
                  )}
                </div>

                {Object.keys(fullDetail.sponsors.categories).length === 0 && !editMode ? (
                  <div className="text-center py-12 sm:py-16 text-gray-500">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Building className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    </div>
                    <p className="text-base sm:text-lg text-gray-600 mb-2">No sponsors added yet</p>
                    <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                      Our valued partners and sponsors will be showcased here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8 sm:space-y-12">
                    {Object.entries(fullDetail.sponsors.categories).map(([category, sponsors]) => (
                      <div key={category} className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize mb-2">{category} Sponsors</h3>
                            <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                          </div>
                          
                          {editMode && (
                            <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-0">
                              <button
                                onClick={() => addSponsor(category)}
                                className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-md transition-all"
                              >
                                <Plus className="w-3 h-3" />
                                <span className="hidden sm:inline">Add Sponsor</span>
                                <span className="sm:hidden">Add</span>
                              </button>
                              <button
                                onClick={() => removeSponsorCategory(category)}
                                className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                          {sponsors.map((sponsor, index) => (
                            <div key={sponsor.id} className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                              {editMode ? (
                                <div className="space-y-3 sm:space-y-4">
                                  <div className="flex items-start justify-between">
                                    <input
                                      type="text"
                                      value={sponsor.name}
                                      onChange={(e) => updateSponsor(category, index, 'name', e.target.value)}
                                      placeholder="Sponsor Name"
                                      className="flex-1 font-bold text-base sm:text-lg border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
                                    />
                                    <button
                                      onClick={() => removeSponsor(category, index)}
                                      className="p-1 sm:p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                    >
                                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 sm:gap-3">
                                    <div className="w-full h-24 sm:h-32 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden border">
                                      {sponsor.logo ? (
                                        <img src={sponsor.logo} alt="" className="w-full h-full object-contain p-3 sm:p-4" />
                                      ) : (
                                        <Building className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                        Logo
                                      </label>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            const url = await handleFileUpload(file, 'sponsors');
                                            if (url) updateSponsor(category, index, 'logo', url);
                                          }
                                        }}
                                        className="w-full text-xs file:mr-1 sm:file:mr-2 file:py-1 sm:file:py-1.5 file:px-2 sm:file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                      />
                                    </div>
                                  </div>
                                  
                                  <textarea
                                    value={sponsor.description}
                                    onChange={(e) => updateSponsor(category, index, 'description', e.target.value)}
                                    placeholder="Brief description (about 50 words)"
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 focus:border-blue-500 focus:outline-none resize-none text-xs sm:text-sm"
                                  />
                                  
                                  <input
                                    type="url"
                                    value={sponsor.website}
                                    onChange={(e) => updateSponsor(category, index, 'website', e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 focus:border-blue-500 focus:outline-none text-xs sm:text-sm"
                                  />
                                </div>
                              ) : (
                                <div className="text-center h-full flex flex-col">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden mx-auto mb-3 sm:mb-4 p-2 sm:p-3 lg:p-4 border border-gray-200">
                                    {sponsor.logo ? (
                                      <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-contain" />
                                    ) : (
                                      <Building className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" />
                                    )}
                                  </div>
                                  
                                  <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">{sponsor.name || 'Sponsor Name'}</h4>
                                  
                                  <div className="flex-grow mb-3 sm:mb-4">
                                    {sponsor.description ? (
                                      <RichTextWithReadMore 
                                        content={sponsor.description} 
                                        maxWords={30} // Very low threshold for sponsor descriptions
                                        className="text-xs sm:text-sm"
                                      />
                                    ) : (
                                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                                        Valued partner and supporter of our event.
                                      </p>
                                    )}
                                  </div>
                                  
                                  {sponsor.website && (
                                    <a
                                      href={sponsor.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                      Visit Website
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {sponsors.length === 0 && !editMode && (
                            <div className="col-span-full text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
                              <Building className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                              <p>No sponsors in this category yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Add custom styles for rich text content */}
      <style jsx global>{`
        .rich-text-content {
          font-family: inherit;
        }
        
        .rich-text-content h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
          color: #111827;
        }
        
        .rich-text-content h2 {
          font-size: 1.375rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
          color: #111827;
        }
        
        .rich-text-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.875rem;
          margin-bottom: 0.625rem;
          color: #111827;
        }
        
        .rich-text-content h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        
        .rich-text-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
          color: #374151;
        }
        
        .rich-text-content ul, .rich-text-content ol {
          margin-bottom: 0.75rem;
          padding-left: 1.25rem;
        }
        
        .rich-text-content li {
          margin-bottom: 0.375rem;
          line-height: 1.5;
        }
        
        .rich-text-content a {
          color: #2563eb;
          text-decoration: underline;
          transition: color 0.2s;
        }
        
        .rich-text-content a:hover {
          color: #1d4ed8;
        }
        
        .rich-text-content strong {
          font-weight: 700;
          color: #111827;
        }
        
        .rich-text-content em {
          font-style: italic;
        }
        
        .quill {
          border: none !important;
        }
        
        .ql-container {
          font-size: 14px !important;
          font-family: inherit !important;
          border: none !important;
          min-height: 100px;
        }
        
        @media (min-width: 640px) {
          .rich-text-content h1 {
            font-size: 2rem;
            margin-top: 1.25rem;
            margin-bottom: 1rem;
          }
          
          .rich-text-content h2 {
            font-size: 1.75rem;
            margin-top: 1.25rem;
            margin-bottom: 1rem;
          }
          
          .rich-text-content h3 {
            font-size: 1.375rem;
            margin-top: 1rem;
            margin-bottom: 0.75rem;
          }
          
          .rich-text-content p {
            font-size: 1rem;
            line-height: 1.7;
            margin-bottom: 1rem;
          }
          
          .ql-container {
            font-size: 16px !important;
            min-height: 120px;
          }
        }
        
        @media (min-width: 768px) {
          .rich-text-content h1 {
            font-size: 2.25rem;
          }
          
          .rich-text-content h2 {
            font-size: 1.875rem;
          }
          
          .rich-text-content h3 {
            font-size: 1.5rem;
          }
        }
        
        .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          border-radius: 0.5rem 0.5rem 0 0 !important;
          background-color: #f9fafb !important;
          padding: 8px !important;
        }
        
        .ql-editor {
          min-height: 100px;
          padding: 0.75rem !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        
        @media (min-width: 640px) {
          .ql-editor {
            min-height: 120px;
            padding: 1rem !important;
            font-size: 16px !important;
            line-height: 1.7 !important;
          }
        }
        
        .ql-editor.ql-blank::before {
          color: #9ca3af !important;
          font-style: normal !important;
          left: 0.75rem !important;
        }
        
        @media (min-width: 640px) {
          .ql-editor.ql-blank::before {
            left: 1rem !important;
          }
        }
        
        .ql-toolbar .ql-formats {
          margin-right: 8px !important;
        }
        
        @media (min-width: 640px) {
          .ql-toolbar .ql-formats {
            margin-right: 12px !important;
          }
        }
        
        .ql-toolbar button {
          width: 28px !important;
          height: 28px !important;
          border-radius: 4px !important;
        }
        
        @media (min-width: 640px) {
          .ql-toolbar button {
            width: 32px !important;
            height: 32px !important;
            border-radius: 6px !important;
          }
        }
        
        .ql-toolbar button:hover {
          background-color: #e5e7eb !important;
        }
        
        .ql-toolbar button.ql-active {
          background-color: #dbeafe !important;
          color: #2563eb !important;
        }
        
        .ql-toolbar .ql-picker {
          border-radius: 4px !important;
          height: 28px !important;
        }
        
        @media (min-width: 640px) {
          .ql-toolbar .ql-picker {
            border-radius: 6px !important;
            height: 32px !important;
          }
        }
        
        .ql-toolbar .ql-picker-label {
          padding: 0 6px !important;
        }
        
        @media (min-width: 640px) {
          .ql-toolbar .ql-picker-label {
            padding: 0 8px !important;
          }
        }
        
        .ql-toolbar .ql-picker-options {
          border-radius: 6px !important;
          padding: 6px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        @media (min-width: 640px) {
          .ql-toolbar .ql-picker-options {
            padding: 8px !important;
          }
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}