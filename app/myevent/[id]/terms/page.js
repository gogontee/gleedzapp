"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit3, Save, Plus, Trash2, Eye, EyeOff, Users, Target, 
  Award, Globe, ChevronLeft, ChevronRight, Play, Pause,
  Crown, Share2, Heart, MapPin, Clock, Menu, X,
  Building, ExternalLink, Bold, Italic, Link, List, Image,
  ChevronDown, ChevronUp, FileText, Shield, Lock, AlertCircle,
  BookOpen, Scale, Gavel, ClipboardCheck
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader";
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
});
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

// Component for individual term section
const TermSection = ({ 
  section, 
  index, 
  editMode, 
  updateTermSection, 
  removeTermSection,
  isExpanded,
  toggleExpand 
}) => {
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'link'
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
      {editMode ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateTermSection(index, 'title', e.target.value)}
                placeholder="Section Title (e.g., 1. Acceptance of Terms)"
                className="w-full font-bold text-lg border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
              />
            </div>
            <button
              onClick={() => removeTermSection(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <div className="bg-gray-50 border-b border-gray-300 p-2">
              <p className="text-xs text-gray-600 font-medium">Content (Rich Text)</p>
            </div>
            <div className="min-h-[150px]">
              {typeof window !== 'undefined' && (
                <ReactQuill
                  theme="snow"
                  value={section.content}
                  onChange={(value) => updateTermSection(index, 'content', value)}
                  modules={quillModules}
                  formats={quillFormats}
                  className="h-auto min-h-[120px]"
                  placeholder="Enter the detailed terms for this section..."
                />
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.isImportant}
                  onChange={(e) => updateTermSection(index, 'isImportant', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Mark as Important</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.requiresAcknowledgment}
                  onChange={(e) => updateTermSection(index, 'requiresAcknowledgment', e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Requires Acknowledgment</span>
              </label>
            </div>
            
            <div className="text-xs text-gray-500">
              {countWords(section.content)} words
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div 
            className="flex items-start justify-between cursor-pointer mb-4"
            onClick={() => toggleExpand(index)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                section.isImportant ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {section.isImportant ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{section.title}</h3>
                {section.requiresAcknowledgment && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full mt-1">
                    <ClipboardCheck className="w-3 h-3" />
                    Requires Acknowledgment
                  </span>
                )}
              </div>
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-4 pl-11">
              {section.content ? (
                <div className="text-gray-700">
                  <TruncatedContent 
                    content={section.content} 
                    maxWords={80}
                    className="text-base"
                  />
                </div>
              ) : (
                <p className="text-gray-500 italic">No content provided for this section.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function TermsOfUsePage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [termsOfUse, setTermsOfUse] = useState({
    enabled: true,
    title: "Terms of Use",
    subtitle: "Please read these terms carefully before using our services",
    lastUpdated: new Date().toISOString().split('T')[0],
    introduction: "",
    sections: [],
    footer: "By accessing or using our services, you agree to be bound by these Terms of Use."
  });
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const heroTimerRef = useRef(null);

  // Quill editor modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'link'
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
      
      // Initialize terms_of_use with defaults if empty
      if (eventData.terms_of_use) {
        setTermsOfUse(prev => ({
          ...prev,
          ...eventData.terms_of_use
        }));
      } else {
        // Set default sections if none exist
        setTermsOfUse(prev => ({
          ...prev,
          sections: [
            {
              id: 1,
              title: "1. Acceptance of Terms",
              content: "<p>By accessing or using this event platform, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services.</p>",
              isImportant: true,
              requiresAcknowledgment: true
            },
            {
              id: 2,
              title: "2. User Responsibilities",
              content: "<p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>",
              isImportant: false,
              requiresAcknowledgment: true
            },
            {
              id: 3,
              title: "3. Code of Conduct",
              content: "<p>All participants are expected to adhere to our code of conduct, which includes respecting others, maintaining professionalism, and following event guidelines.</p>",
              isImportant: true,
              requiresAcknowledgment: true
            }
          ]
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
        .update({ terms_of_use: termsOfUse })
        .eq('id', eventId);

      if (error) throw error;
      
      setEditMode(false);
      alert('Terms of Use updated successfully!');
    } catch (error) {
      console.error('Error saving terms of use:', error);
      alert('Error saving terms of use: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = () => {
    setTermsOfUse(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const updateField = (field, value) => {
    setTermsOfUse(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Term section functions
  const addTermSection = () => {
    const newId = termsOfUse.sections.length > 0 
      ? Math.max(...termsOfUse.sections.map(s => s.id)) + 1 
      : 1;
    
    setTermsOfUse(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: newId,
          title: `${newId}. New Section`,
          content: "",
          isImportant: false,
          requiresAcknowledgment: false
        }
      ]
    }));
  };

  const updateTermSection = (index, field, value) => {
    setTermsOfUse(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const removeTermSection = (index) => {
    setTermsOfUse(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const toggleExpandSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleFileUpload = async (file, type) => {
    try {
      const BUCKET_NAME = 'event-assets';
      const eventSlug = event?.slug || 'event';
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${type}-${timestamp}.${fileExt}`;
      const filePath = `events/${eventSlug}/terms/${type}/${fileName}`;

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
          <p>Loading terms of use...</p>
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
                {termsOfUse.title}
              </h1>
              <p className="text-sm sm:text-base md:text-xl text-gray-200 font-light">
                {termsOfUse.subtitle}
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
                    <span className="hidden sm:inline">{editMode ? 'Exit Edit Mode' : 'Edit Terms'}</span>
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <button
                      onClick={toggleSection}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        termsOfUse.enabled
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {termsOfUse.enabled ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Page Enabled</span>
                          <span className="sm:hidden">Enabled</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span className="hidden sm:inline">Page Disabled</span>
                          <span className="sm:hidden">Disabled</span>
                        </>
                      )}
                    </button>
                    
                    <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="hidden sm:inline">Edit mode active</span>
                        <span className="sm:hidden">Editing</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Only show if enabled */}
        {termsOfUse.enabled ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
            {/* Introduction Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6 sm:p-8 md:p-10">
                {editMode ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page Title
                        </label>
                        <input
                          type="text"
                          value={termsOfUse.title}
                          onChange={(e) => updateField('title', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="Terms of Use"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={termsOfUse.subtitle}
                          onChange={(e) => updateField('subtitle', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="Please read these terms carefully"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Introduction
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <div className="bg-gray-50 border-b border-gray-300 p-2">
                          <p className="text-xs text-gray-600 font-medium">Rich Text Editor</p>
                        </div>
                        <div className="min-h-[150px]">
                          {typeof window !== 'undefined' && (
                            <ReactQuill
                              theme="snow"
                              value={termsOfUse.introduction}
                              onChange={(value) => updateField('introduction', value)}
                              modules={quillModules}
                              formats={quillFormats}
                              className="h-auto min-h-[120px]"
                              placeholder="Provide a brief introduction to your Terms of Use..."
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Updated Date
                        </label>
                        <input
                          type="date"
                          value={termsOfUse.lastUpdated}
                          onChange={(e) => updateField('lastUpdated', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Footer Text
                        </label>
                        <input
                          type="text"
                          value={termsOfUse.footer}
                          onChange={(e) => updateField('footer', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="By using our services, you agree to these terms"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                          {termsOfUse.title}
                        </h2>
                        <p className="text-gray-600 text-lg">{termsOfUse.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Last Updated: {new Date(termsOfUse.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {termsOfUse.introduction ? (
                      <div className="prose prose-lg max-w-none text-gray-700 mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <TruncatedContent 
                          content={termsOfUse.introduction} 
                          maxWords={80}
                          className="text-base"
                        />
                      </div>
                    ) : (
                      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600 text-center italic">
                          Welcome to our Terms of Use. These terms govern your use of our event platform and services.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mb-8">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Important Sections
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                        <ClipboardCheck className="w-4 h-4" />
                        Requires Acknowledgment
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        Legal Compliance
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Terms Sections */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms & Conditions</h2>
                  
                  {editMode && (
                    <button
                      onClick={addTermSection}
                      className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-white rounded-lg font-semibold hover:shadow-md transition-all w-full sm:w-auto justify-center"
                      style={{ backgroundColor: pageColor }}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Section</span>
                      <span className="sm:hidden">Add Section</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {termsOfUse.sections.map((section, index) => (
                    <TermSection
                      key={section.id || index}
                      section={section}
                      index={index}
                      editMode={editMode}
                      updateTermSection={updateTermSection}
                      removeTermSection={removeTermSection}
                      isExpanded={expandedSections[index]}
                      toggleExpand={() => toggleExpandSection(index)}
                    />
                  ))}
                  
                  {termsOfUse.sections.length === 0 && !editMode && (
                    <div className="text-center py-12 sm:py-16 text-gray-500">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                      </div>
                      <p className="text-base sm:text-lg text-gray-600 mb-2">No terms sections added yet</p>
                      <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                        The terms and conditions for this event will be displayed here.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                {!editMode && termsOfUse.footer && (
                  <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-gray-700 font-medium">{termsOfUse.footer}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          If you have any questions about these terms, please contact us.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <Shield className="w-4 h-4" />
                          <span className="hidden sm:inline">Privacy Policy</span>
                          <span className="sm:hidden">Privacy</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <Gavel className="w-4 h-4" />
                          <span className="hidden sm:inline">Legal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Quick Stats - View Mode Only */}
            {!editMode && termsOfUse.sections.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{termsOfUse.sections.length}</p>
                      <p className="text-sm text-gray-600">Total Sections</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {termsOfUse.sections.filter(s => s.isImportant).length}
                      </p>
                      <p className="text-sm text-gray-600">Important Terms</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <ClipboardCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {termsOfUse.sections.filter(s => s.requiresAcknowledgment).length}
                      </p>
                      <p className="text-sm text-gray-600">Requires Acknowledgment</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Scale className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {termsOfUse.sections.reduce((acc, section) => acc + countWords(section.content), 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Words</p>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </div>
        ) : (
          /* Show disabled message if page is disabled */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-24">
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <EyeOff className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Terms of Use Page is Disabled
              </h2>
              <p className="text-gray-600 max-w-md mx-auto text-lg mb-8">
                This page is currently not available. Please check back later or contact the event organizers.
              </p>
              {isOwner && (
                <button
                  onClick={toggleSection}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  Enable Page
                </button>
              )}
            </div>
          </div>
        )}
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
        
        /* Fix for ReactQuill editor overflow */
        .ql-container .ql-editor {
          overflow-y: visible !important;
          min-height: 120px !important;
        }
        
        .ql-container {
          overflow-y: visible !important;
        }
        
        /* Ensure all form fields are fully visible */
        input, textarea, .ql-editor {
          max-width: 100% !important;
          overflow-x: auto !important;
        }
        
        /* Prevent text hiding in edit mode */
        .bg-white {
          overflow: visible !important;
        }
        
        /* Ensure proper spacing in edit mode */
        .space-y-6 > * + * {
          margin-top: 1.5rem !important;
        }
        
        /* Make sure all content containers don't hide overflow */
        .rounded-xl, .rounded-2xl {
          overflow: visible !important;
        }
      `}</style>
    </div>
  );
}