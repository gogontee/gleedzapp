"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit3, Save, Plus, Trash2, Eye, EyeOff, Users, Target, 
  Award, Globe, ChevronLeft, ChevronRight, Play, Pause,
  Crown, Share2, Heart, MapPin, Clock, Menu, X,
  Building, ExternalLink
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader"; // Import the header component

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

  const toggleTeamMemberExpand = (index) => {
    setFullDetail(prev => ({
      ...prev,
      team: {
        ...prev.team,
        members: prev.team.members.map((member, i) => 
          i === index ? { ...member, expanded: !member.expanded } : member
        )
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
        {/* Hero Section - Same as DefaultEventPage */}
        <section className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
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
              <h1 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 leading-tight">
                About {event?.name}
              </h1>
              <p className="text-base md:text-xl text-gray-200 font-light">
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
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      editMode 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'text-white'
                    }`}
                    style={editMode ? {} : { backgroundColor: pageColor }}
                  >
                    <Edit3 className="w-4 h-4" />
                    {editMode ? 'Exit Edit Mode' : 'Edit About Page'}
                  </button>
                  
                  {editMode && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>

                {editMode && (
                  <div className="text-sm text-gray-600">
                    Edit mode active
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-16">
          {/* Section Toggles - Edit Mode Only */}
          {editMode && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Sections</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {['about', 'mission', 'vision', 'objectives', 'team', 'sponsors'].map((section) => (
                  <button
                    key={section}
                    onClick={() => toggleSection(section)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      fullDetail[section]?.enabled
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="text-sm font-semibold capitalize mb-1">
                      {section}
                    </div>
                    <div className="text-xs">
                      {fullDetail[section]?.enabled ? 'Enabled' : 'Disabled'}
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
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-8">
                {editMode ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={fullDetail.about.title}
                      onChange={(e) => updateSectionContent('about', 'title', e.target.value)}
                      className="text-3xl font-bold text-gray-900 w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-2"
                    />
                    <textarea
                      value={fullDetail.about.content}
                      onChange={(e) => updateSectionContent('about', 'content', e.target.value)}
                      rows={8}
                      className="w-full border border-gray-300 rounded-lg p-4 focus:border-blue-500 focus:outline-none resize-vertical"
                      placeholder="Tell your story... What makes your event special? Share your journey, values, and what attendees can expect."
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">{fullDetail.about.title}</h2>
                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                      {fullDetail.about.content || (
                        <p className="text-gray-500 italic">
                          We're passionate about creating unforgettable experiences that bring people together. 
                          Our event is built on a foundation of excellence, innovation, and community.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Mission, Vision, Objectives Grid */}
          {(fullDetail.mission.enabled || fullDetail.vision.enabled || fullDetail.objectives.enabled) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
                  >
                    {editMode ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={fullDetail[key].title}
                          onChange={(e) => updateSectionContent(key, 'title', e.target.value)}
                          className="text-xl font-bold w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-2"
                        />
                        <textarea
                          value={fullDetail[key].content}
                          onChange={(e) => updateSectionContent(key, 'content', e.target.value)}
                          rows={6}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-vertical text-sm"
                          placeholder={`Describe your ${key}...`}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 text-${color}-600`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{fullDetail[key].title}</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {fullDetail[key].content || `Our ${key} drives everything we do. We're committed to excellence and innovation.`}
                        </p>
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
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  {editMode ? (
                    <input
                      type="text"
                      value={fullDetail.team.title}
                      onChange={(e) => updateSectionContent('team', 'title', e.target.value)}
                      className="text-3xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-2"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-gray-900">{fullDetail.team.title}</h2>
                  )}
                  
                  {editMode && (
                    <button
                      onClick={addTeamMember}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold"
                      style={{ backgroundColor: pageColor }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {fullDetail.team.members.map((member, index) => (
                    <div key={member.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      {editMode ? (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                placeholder="Full Name"
                                className="w-full font-bold text-lg border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1"
                              />
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                                placeholder="Role/Position"
                                className="w-full text-gray-600 border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1 mt-1 text-sm"
                              />
                            </div>
                            <button
                              onClick={() => removeTeamMember(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                              {member.photo ? (
                                <img src={member.photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-8 h-8 text-gray-500" />
                              )}
                            </div>
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
                              className="flex-1 text-sm"
                            />
                          </div>
                          
                          <textarea
                            value={member.about}
                            onChange={(e) => updateTeamMember(index, 'about', e.target.value)}
                            placeholder="Tell us about this team member..."
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-vertical text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {member.photo ? (
                                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-8 h-8 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{member.name || 'Team Member'}</h3>
                              <p className="text-gray-600 text-sm">{member.role || 'Team Role'}</p>
                            </div>
                          </div>
                          
                          <div className="text-gray-700">
                            {member.about ? (
                              <div>
                                <p className={`leading-relaxed ${!member.expanded ? 'line-clamp-3' : ''}`}>
                                  {member.about}
                                </p>
                                {member.about.length > 150 && (
                                  <button
                                    onClick={() => toggleTeamMemberExpand(index)}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2"
                                  >
                                    {member.expanded ? 'Read Less' : 'Read More'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No description provided.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {fullDetail.team.members.length === 0 && !editMode && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No team members added yet.</p>
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
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  {editMode ? (
                    <input
                      type="text"
                      value={fullDetail.sponsors.title}
                      onChange={(e) => updateSectionContent('sponsors', 'title', e.target.value)}
                      className="text-3xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-2"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-gray-900">{fullDetail.sponsors.title}</h2>
                  )}
                  
                  {editMode && (
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        id="newCategory"
                        placeholder="Category name"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('newCategory');
                          addSponsorCategory(input.value);
                          input.value = '';
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold text-sm"
                        style={{ backgroundColor: pageColor }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Category
                      </button>
                    </div>
                  )}
                </div>

                {Object.keys(fullDetail.sponsors.categories).length === 0 && !editMode ? (
                  <div className="text-center py-12 text-gray-500">
                    <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No sponsors added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {Object.entries(fullDetail.sponsors.categories).map(([category, sponsors]) => (
                      <div key={category} className="border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 capitalize">{category}</h3>
                          
                          {editMode && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => addSponsor(category)}
                                className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-lg text-sm"
                              >
                                <Plus className="w-3 h-3" />
                                Add Sponsor
                              </button>
                              <button
                                onClick={() => removeSponsorCategory(category)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sponsors.map((sponsor, index) => (
                            <div key={sponsor.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              {editMode ? (
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <input
                                      type="text"
                                      value={sponsor.name}
                                      onChange={(e) => updateSponsor(category, index, 'name', e.target.value)}
                                      placeholder="Sponsor Name"
                                      className="flex-1 font-bold border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1"
                                    />
                                    <button
                                      onClick={() => removeSponsor(category, index)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                      {sponsor.logo ? (
                                        <img src={sponsor.logo} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <Building className="w-6 h-6 text-gray-500" />
                                      )}
                                    </div>
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
                                      className="flex-1 text-xs"
                                    />
                                  </div>
                                  
                                  <textarea
                                    value={sponsor.description}
                                    onChange={(e) => updateSponsor(category, index, 'description', e.target.value)}
                                    placeholder="Brief description (about 50 words)"
                                    rows={3}
                                    className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none resize-vertical text-xs"
                                  />
                                  
                                  <input
                                    type="url"
                                    value={sponsor.website}
                                    onChange={(e) => updateSponsor(category, index, 'website', e.target.value)}
                                    placeholder="Website URL"
                                    className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none text-xs"
                                  />
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="w-16 h-16 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden mx-auto mb-3">
                                    {sponsor.logo ? (
                                      <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Building className="w-8 h-8 text-gray-500" />
                                    )}
                                  </div>
                                  
                                  <h4 className="font-bold text-gray-900 mb-2">{sponsor.name || 'Sponsor Name'}</h4>
                                  
                                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                                    {sponsor.description || 'Valued partner and supporter of our event.'}
                                  </p>
                                  
                                  {sponsor.website && (
                                    <a
                                      href={sponsor.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
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
                            <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                              No sponsors in this category yet.
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
    </div>
  );
}