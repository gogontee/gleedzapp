// components/HeroManagerModal.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useRouter } from 'next/navigation';

export default function HeroManagerModal({ isOpen, onClose }) {
  const [heroData, setHeroData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchHeroData();
    }
  }, [isOpen]);

  const fetchHeroData = async () => {
    try {
      const { data, error } = await supabase
        .from('gleedz_hero')
        .select('hero, id')
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setHeroData(data?.hero || []);
    } catch (error) {
      console.error('Error fetching hero data:', error);
      alert('Error loading hero data');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `heros/${fileName}`;

      // Upload image to Supabase Storage :cite[2]:cite[7]
      const { data, error } = await supabase.storage
        .from('heros')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('heros')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      updateHeroSection(index, 'src', imageUrl);
    }
  };

  const saveHeroData = async () => {
    try {
      setSaving(true);
      
      // Check if record exists
      const { data: existingData } = await supabase
        .from('gleedz_hero')
        .select('id')
        .limit(1);

      let result;

      if (existingData && existingData.length > 0) {
        // Update existing record
        result = await supabase
          .from('gleedz_hero')
          .update({ hero: heroData })
          .eq('id', existingData[0].id);
      } else {
        // Insert new record
        result = await supabase
          .from('gleedz_hero')
          .insert([{ hero: heroData }]);
      }

      if (result.error) throw result.error;

      alert('Hero data saved successfully!');
      onClose();
      router.refresh(); // Refresh the page to show changes
    } catch (error) {
      console.error('Error saving hero data:', error);
      alert('Error saving hero data: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addHeroSection = () => {
    const newHero = {
      src: '',
      heading: 'New Hero Section',
      button: { label: 'Learn More', href: '/' }
    };
    setHeroData([...heroData, newHero]);
  };

  const removeHeroSection = (index) => {
    if (confirm('Are you sure you want to remove this hero section?')) {
      const updatedHero = heroData.filter((_, i) => i !== index);
      setHeroData(updatedHero);
    }
  };

  const updateHeroSection = (index, field, value) => {
    const updatedHero = [...heroData];
    
    if (field.startsWith('button.')) {
      const buttonField = field.split('.')[1];
      if (!updatedHero[index].button) {
        updatedHero[index].button = {};
      }
      updatedHero[index].button[buttonField] = value;
    } else {
      updatedHero[index][field] = value;
    }
    
    setHeroData(updatedHero);
  };

  const moveSection = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < heroData.length) {
      const updatedHero = [...heroData];
      [updatedHero[index], updatedHero[newIndex]] = [updatedHero[newIndex], updatedHero[index]];
      setHeroData(updatedHero);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-yellow-600 text-center">Loading hero data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-yellow-500 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Manage Hero Sections</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-yellow-100 mt-2">Add, edit, or remove hero sections. Drag and reorder sections as needed.</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={addHeroSection}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
            >
              <span className="mr-2">+</span> Add Hero Section
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveHeroData}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Hero Sections List */}
          <div className="space-y-6">
            {heroData.map((section, index) => (
              <div key={index} className="border border-yellow-300 rounded-lg p-6 bg-yellow-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Hero Section {index + 1}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="text-yellow-600 hover:text-yellow-800 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(index, 1)}
                      disabled={index === heroData.length - 1}
                      className="text-yellow-600 hover:text-yellow-800 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeHeroSection(index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-2">
                        Hero Image *
                      </label>
                      
                      {/* Image Preview */}
                      {section.src && (
                        <div className="mb-3">
                          <img
                            src={section.src}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg border border-yellow-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* File Upload */}
                      <div className="flex flex-col space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e.target.files[0])}
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                          disabled={uploading}
                        />
                        {uploading && (
                          <div className="text-yellow-600 text-sm">Uploading image...</div>
                        )}
                      </div>
                      
                      {/* URL Fallback */}
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-yellow-700 mb-1">
                          Or enter image URL
                        </label>
                        <input
                          type="text"
                          value={section.src}
                          onChange={(e) => updateHeroSection(index, 'src', e.target.value)}
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Heading *
                      </label>
                      <input
                        type="text"
                        value={section.heading}
                        onChange={(e) => updateHeroSection(index, 'heading', e.target.value)}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        placeholder="Enter compelling heading"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-yellow-700 mb-1">
                          Button Label *
                        </label>
                        <input
                          type="text"
                          value={section.button?.label || ''}
                          onChange={(e) => updateHeroSection(index, 'button.label', e.target.value)}
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                          placeholder="Button text"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-yellow-700 mb-1">
                          Button Link *
                        </label>
                        <input
                          type="text"
                          value={section.button?.href || ''}
                          onChange={(e) => updateHeroSection(index, 'button.href', e.target.value)}
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                          placeholder="/path"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {heroData.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-25">
                <div className="text-yellow-600 mb-4">No hero sections yet.</div>
                <button
                  onClick={addHeroSection}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Create Your First Hero Section
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}