"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Send, 
  Save, 
  Settings,
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin,
  MessageSquare,
  Building,
  Globe,
  Shield,
  Bell,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Layout,
  Type,
  Image as ImageIcon,
  Music
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import EventHeader from '../../../../components/EventHeader';

// Available icons for different contact types
const availableIcons = {
  Mail, Phone, MapPin, MessageCircle, Twitter, Facebook, Instagram, Linkedin,
  MessageSquare, Building, Globe, Bell, Layout, Type, ImageIcon, Music
};

// Default structure for the contacts object
const defaultContact = {
  email: '',
  phone: '',
  socialMedia: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    tiktok: '' // Added TikTok field
  },
  officeAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  features: {
    showEmail: true,
    showPhone: true,
    showAddress: true,
    showContactForm: true,
    enableWhatsApp: true
  },
  // New custom fields array - ensure it always exists
  customFields: []
};

export default function EventContactPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [contact, setContact] = useState(defaultContact);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    label: '',
    value: '',
    icon: 'Mail',
    displayType: 'icon-text', // 'icon-only', 'text-only', 'icon-text'
    isVisible: true
  });

  // Fetch event data and check ownership
  useEffect(() => {
    const fetchEventAndCheckOwner = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return;
      }

      // Ensure contact object has all required fields, including customFields
      const eventContact = eventData.contact || {};
      const mergedContact = {
        ...defaultContact,
        ...eventContact,
        // Ensure socialMedia has tiktok field
        socialMedia: {
          ...defaultContact.socialMedia,
          ...eventContact.socialMedia
        },
        // Ensure customFields array exists
        customFields: eventContact.customFields || []
      };

      setEvent(eventData);
      setContact(mergedContact);
      setIsOwner(user && user.id === eventData.user_id);
      setLoading(false);
    };

    if (id) fetchEventAndCheckOwner();
  }, [id]);

  // Save the contact configuration (Owner only)
  const handleSaveContact = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('events')
      .update({ contact: contact })
      .eq('id', id);

    if (error) {
      alert('Error saving contact info: ' + error.message);
    } else {
      alert('Contact information saved successfully!');
    }
    setSaving(false);
  };

  // Handle contact form submission
  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    const newMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...formData
    };

    const currentMessages = event?.messages || [];
    const updatedMessages = [...currentMessages, newMessage];

    const { error } = await supabase
      .from('events')
      .update({ messages: updatedMessages })
      .eq('id', id);

    if (error) {
      alert('Error sending message: ' + error.message);
    } else {
      alert('Your message has been sent!');
      setFormData({ name: '', email: '', message: '' });
      setEvent(prev => ({ ...prev, messages: updatedMessages }));
    }
    setFormSubmitting(false);
  };

  // Add new custom field
  const addCustomField = () => {
    if (!newCustomField.label.trim() || !newCustomField.value.trim()) {
      alert('Please fill in both label and value');
      return;
    }

    const field = {
      id: Date.now().toString(),
      label: newCustomField.label.trim(),
      value: newCustomField.value.trim(),
      icon: newCustomField.icon,
      displayType: newCustomField.displayType,
      isVisible: newCustomField.isVisible
    };

    setContact(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), field]
    }));

    setNewCustomField({
      label: '',
      value: '',
      icon: 'Mail',
      displayType: 'icon-text',
      isVisible: true
    });
  };

  // Update custom field
  const updateCustomField = (index, field, value) => {
    setContact(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Delete custom field
  const deleteCustomField = (index) => {
    setContact(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, i) => i !== index)
    }));
  };

  // Toggle field visibility
  const toggleFieldVisibility = (index) => {
    setContact(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map((item, i) => 
        i === index ? { ...item, isVisible: !item.isVisible } : item
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact information...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Use EventHeader Component */}
      <EventHeader 
        event={event}
        showBackButton={true}
        backUrl={`/myevent/${id}`}
      />

      {/* Page Header Section - Moved below the EventHeader */}
      <div className="pt-20 pb-8 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contact & Support</h1>
              <p className="text-gray-600 mt-2">Get in touch with event organizers</p>
            </div>
            
            {isOwner && (
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-gray-200 shadow-sm">
                <button
                  onClick={handleSaveContact}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: pageColor }}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Contact Information Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information Display */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: `${pageColor}15` }}>
                  <MessageCircle className="w-6 h-6" style={{ color: pageColor }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                {contact.features.showEmail && contact.email && (
                  <ContactField 
                    label="Email"
                    value={contact.email}
                    icon={Mail}
                    displayType="icon-text"
                    pageColor={pageColor}
                  />
                )}

                {/* Phone */}
                {contact.features.showPhone && contact.phone && (
                  <ContactField 
                    label="Phone"
                    value={contact.phone}
                    icon={Phone}
                    displayType="icon-text"
                    pageColor={pageColor}
                  />
                )}

                {/* Address */}
                {contact.features.showAddress && contact.officeAddress.street && (
                  <ContactField 
                    label="Office Address"
                    value={`${contact.officeAddress.street}, ${contact.officeAddress.city}, ${contact.officeAddress.state} ${contact.officeAddress.zipCode}, ${contact.officeAddress.country}`}
                    icon={MapPin}
                    displayType="icon-text"
                    pageColor={pageColor}
                    fullWidth
                  />
                )}

                {/* Custom Fields - FIXED: Added safe array check */}
                {(contact.customFields || []).filter(field => field.isVisible).map((field, index) => (
                  <ContactField 
                    key={field.id}
                    label={field.label}
                    value={field.value}
                    icon={availableIcons[field.icon]}
                    displayType={field.displayType}
                    pageColor={pageColor}
                  />
                ))}
              </div>

              {/* Social Media Links */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 pt-6 border-t border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {contact.socialMedia.twitter && (
                    <SocialLink 
                      url={contact.socialMedia.twitter}
                      icon={Twitter}
                      color="blue-400"
                    />
                  )}
                  {contact.socialMedia.facebook && (
                    <SocialLink 
                      url={contact.socialMedia.facebook}
                      icon={Facebook}
                      color="blue-600"
                    />
                  )}
                  {contact.socialMedia.instagram && (
                    <SocialLink 
                      url={contact.socialMedia.instagram}
                      icon={Instagram}
                      color="pink-500"
                    />
                  )}
                  {contact.socialMedia.linkedin && (
                    <SocialLink 
                      url={contact.socialMedia.linkedin}
                      icon={Linkedin}
                      color="blue-700"
                    />
                  )}
                  {contact.socialMedia.tiktok && (
                    <SocialLink 
                      url={contact.socialMedia.tiktok}
                      icon={Music}
                      color="gray-900"
                    />
                  )}
                </div>
              </motion.div>

              {/* WhatsApp Chat */}
              {contact.features.enableWhatsApp && contact.phone && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <a
                    href={`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=Hi, I have a question about ${event.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Chat on WhatsApp
                  </a>
                </motion.div>
              )}
            </motion.section>

            {/* Contact Form */}
            {contact.features.showContactForm && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${pageColor}15` }}>
                    <Send className="w-6 h-6" style={{ color: pageColor }} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                </div>

                <form onSubmit={handleContactFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300"
                        style={{ focusRingColor: pageColor }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300"
                        style={{ focusRingColor: pageColor }}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                    <textarea
                      id="message"
                      rows="6"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 resize-none"
                      style={{ focusRingColor: pageColor }}
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={formSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-4 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: pageColor }}
                  >
                    {formSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.section>
            )}
          </div>

          {/* Sidebar for Event Owner Edit Interface */}
          {isOwner && (
            <div className="space-y-8">
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: `${pageColor}15` }}>
                    <Settings className="w-5 h-5" style={{ color: pageColor }} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Contact Settings</h2>
                </div>

                <p className="text-gray-600 mb-6 text-sm">
                  Configure the contact information and features visible to visitors.
                </p>

                {/* Toggle contact features */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Feature Toggles
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(contact.features).map(([key, value]) => (
                      <motion.label 
                        key={key} 
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                      >
                        <span className="text-gray-700 font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setContact(prev => ({
                            ...prev,
                            features: { ...prev.features, [key]: e.target.checked }
                          }))}
                          className="rounded border-gray-300 focus:ring-2 transition-colors"
                          style={{ focusRingColor: pageColor }}
                        />
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Edit contact details */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Basic Contact Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                        style={{ focusRingColor: pageColor }}
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                        style={{ focusRingColor: pageColor }}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Social Media Links
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(contact.socialMedia).map(([platform, url]) => (
                      <div key={platform}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {platform === 'tiktok' ? 'TikTok' : platform} URL
                        </label>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setContact(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, [platform]: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                          style={{ focusRingColor: pageColor }}
                          placeholder={`https://${platform === 'tiktok' ? 'tiktok.com' : platform + '.com'}/username`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Office Address */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Office Address
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(contact.officeAddress).map(([field, value]) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {field.replace(/([A-Z])/g, ' $1')}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setContact(prev => ({
                            ...prev,
                            officeAddress: { ...prev.officeAddress, [field]: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                          style={{ focusRingColor: pageColor }}
                          placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Fields Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Custom Contact Fields
                  </h3>
                  
                  {/* Add New Custom Field */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900">Add New Field</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                        <input
                          type="text"
                          value={newCustomField.label}
                          onChange={(e) => setNewCustomField(prev => ({ ...prev, label: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="e.g., Support Line"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                        <select
                          value={newCustomField.icon}
                          onChange={(e) => setNewCustomField(prev => ({ ...prev, icon: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {Object.keys(availableIcons).map(iconName => (
                            <option key={iconName} value={iconName}>{iconName}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                      <input
                        type="text"
                        value={newCustomField.value}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., +1-800-SUPPORT"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Type</label>
                        <select
                          value={newCustomField.displayType}
                          onChange={(e) => setNewCustomField(prev => ({ ...prev, displayType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="icon-only">Icon Only</option>
                          <option value="text-only">Text Only</option>
                          <option value="icon-text">Icon & Text</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCustomField.isVisible}
                            onChange={(e) => setNewCustomField(prev => ({ ...prev, isVisible: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          Visible to visitors
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={addCustomField}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Field
                    </button>
                  </div>

                  {/* Existing Custom Fields - FIXED: Added safe array check */}
                  <div className="space-y-3">
                    {(contact.customFields || []).map((field, index) => (
                      <div key={field.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{field.label}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleFieldVisibility(index)}
                              className={`p-1 rounded ${field.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                            >
                              {field.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteCustomField(index)}
                              className="p-1 text-red-500 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="Label"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="Value"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>Icon: {field.icon}</span>
                          <span>•</span>
                          <span>Display: {field.displayType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Only visible to event organizers</span>
                </div>
              </motion.section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Contact Field Component
function ContactField({ label, value, icon: Icon, displayType, pageColor, fullWidth = false }) {
  const getIconColor = (label) => {
    const colors = {
      Email: 'blue',
      Phone: 'green',
      'Office Address': 'purple'
    };
    return colors[label] || 'gray';
  };

  const colorClass = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    purple: 'bg-purple-500/10 text-purple-600',
    gray: 'bg-gray-500/10 text-gray-600'
  }[getIconColor(label)];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors ${
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      {(displayType === 'icon-only' || displayType === 'icon-text') && Icon && (
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1">
        {(displayType === 'text-only' || displayType === 'icon-text') && (
          <>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="font-semibold text-gray-900">{value}</p>
          </>
        )}
        {displayType === 'icon-only' && (
          <p className="font-semibold text-gray-900">{value}</p>
        )}
      </div>
    </motion.div>
  );
}

// Social Link Component
function SocialLink({ url, icon: Icon, color }) {
  return (
    <motion.a 
      whileHover={{ scale: 1.1 }}
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`p-3 rounded-2xl bg-${color}/10 hover:bg-${color}/20 transition-colors`}
    >
      <Icon className={`w-5 h-5 text-${color}`} />
    </motion.a>
  );
}