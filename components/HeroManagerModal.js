// components/HeroManagerModal.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useRouter } from 'next/navigation';

export default function HeroManagerModal({ isOpen, onClose }) {
  const [heroes, setHeroes] = useState([]); // Array of hero records
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchHeroes();
    }
  }, [isOpen]);

  // Fetch all hero records
  const fetchHeroes = async () => {
    try {
      const { data, error } = await supabase
        .from('gleedz_hero')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setHeroes(data || []);
    } catch (error) {
      console.error('Error fetching heroes:', error);
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

      const { data, error } = await supabase.storage
        .from('heros')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

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

  const handleImageUpload = async (id, index, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      updateHeroField(id, index, 'src', imageUrl);
    }
  };

  // Save a single hero record (insert or update)
  const saveHero = async (hero) => {
    try {
      setSaving(true);
      
      let result;
      
      if (hero.id) {
        // Update existing record
        result = await supabase
          .from('gleedz_hero')
          .update({
            hero: hero.hero,
            desktop_posters: hero.desktop_posters || null,
            mobile_poster: hero.mobile_poster || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', hero.id);
      } else {
        // Insert new record
        result = await supabase
          .from('gleedz_hero')
          .insert([{
            hero: hero.hero,
            desktop_posters: hero.desktop_posters || null,
            mobile_poster: hero.mobile_poster || null
          }])
          .select(); // Return the inserted data
      }

      if (result.error) throw result.error;

      return result.data?.[0];
    } catch (error) {
      console.error('Error saving hero:', error);
      alert('Error saving hero: ' + error.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Delete a hero record
  const deleteHero = async (id) => {
    if (!confirm('Are you sure you want to delete this hero section permanently?')) {
      return;
    }

    try {
      setDeletingId(id);
      
      const { error } = await supabase
        .from('gleedz_hero')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setHeroes(prev => prev.filter(hero => hero.id !== id));
      
      alert('Hero section deleted successfully!');
    } catch (error) {
      console.error('Error deleting hero:', error);
      alert('Error deleting hero: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const addNewHero = async () => {
    const newHero = {
      id: null, // Will be set by database
      hero: [{
        src: '',
        heading: 'New Hero Section',
        button: { label: 'Learn More', href: '/' }
      }],
      desktop_posters: null,
      mobile_poster: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to database first
    const savedHero = await saveHero(newHero);
    
    if (savedHero) {
      // Add to local state with real ID from database
      setHeroes(prev => [...prev, savedHero]);
    }
  };

  const updateHeroField = (id, heroIndex, field, value) => {
    setHeroes(prev => prev.map(hero => {
      if (hero.id === id) {
        const updatedHero = { ...hero };
        const heroSections = [...updatedHero.hero];
        
        if (field.startsWith('button.')) {
          const buttonField = field.split('.')[1];
          if (!heroSections[heroIndex].button) {
            heroSections[heroIndex].button = {};
          }
          heroSections[heroIndex].button[buttonField] = value;
        } else {
          heroSections[heroIndex][field] = value;
        }
        
        updatedHero.hero = heroSections;
        updatedHero.updated_at = new Date().toISOString();
        
        return updatedHero;
      }
      return hero;
    }));
  };

  const addHeroSection = (heroId) => {
    setHeroes(prev => prev.map(hero => {
      if (hero.id === heroId) {
        const newHeroSection = {
          src: '',
          heading: 'New Hero Section',
          button: { label: 'Learn More', href: '/' }
        };
        return {
          ...hero,
          hero: [...hero.hero, newHeroSection],
          updated_at: new Date().toISOString()
        };
      }
      return hero;
    }));
  };

  const removeHeroSection = (heroId, index) => {
    if (confirm('Are you sure you want to remove this hero section?')) {
      setHeroes(prev => prev.map(hero => {
        if (hero.id === heroId) {
          const updatedSections = hero.hero.filter((_, i) => i !== index);
          return {
            ...hero,
            hero: updatedSections,
            updated_at: new Date().toISOString()
          };
        }
        return hero;
      }));
    }
  };

  const moveSection = (heroId, index, direction) => {
    const newIndex = index + direction;
    setHeroes(prev => prev.map(hero => {
      if (hero.id === heroId && hero.hero.length > newIndex && newIndex >= 0) {
        const sections = [...hero.hero];
        [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
        return {
          ...hero,
          hero: sections,
          updated_at: new Date().toISOString()
        };
      }
      return hero;
    }));
  };

  // Save all changes
  const saveAllChanges = async () => {
    try {
      setSaving(true);
      
      // Save each hero that has been modified
      const savePromises = heroes.map(hero => saveHero(hero));
      await Promise.all(savePromises);
      
      alert('All changes saved successfully!');
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error saving all changes:', error);
      alert('Error saving changes: ' + error.message);
    } finally {
      setSaving(false);
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
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
          <p className="text-yellow-100 mt-2">
            Manage multiple hero sections. Each section can have multiple slides.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={addNewHero}
                disabled={saving}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center"
              >
                <span className="mr-2">+</span> Add New Hero Section
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAllChanges}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>

          {/* Heroes List */}
          <div className="space-y-8">
            {heroes.map((hero) => (
              <div key={hero.id} className="border-2 border-yellow-400 rounded-xl p-6 bg-yellow-50">
                {/* Hero Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-yellow-300">
                  <div>
                    <h3 className="text-xl font-bold text-yellow-800">
                      Hero ID: {hero.id}
                    </h3>
                    <div className="text-sm text-yellow-600 mt-1">
                      Created: {new Date(hero.created_at).toLocaleDateString()} | 
                      Updated: {new Date(hero.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHero(hero.id)}
                    disabled={deletingId === hero.id}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {deletingId === hero.id ? 'Deleting...' : 'Delete Hero'}
                  </button>
                </div>

                {/* Slides for this Hero */}
                <div className="space-y-6">
                  {hero.hero.map((section, index) => (
                    <div key={index} className="border border-yellow-300 rounded-lg p-6 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-yellow-800">
                          Slide {index + 1}
                        </h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => moveSection(hero.id, index, -1)}
                            disabled={index === 0}
                            className="text-yellow-600 hover:text-yellow-800 disabled:opacity-30 px-2"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveSection(hero.id, index, 1)}
                            disabled={index === hero.hero.length - 1}
                            className="text-yellow-600 hover:text-yellow-800 disabled:opacity-30 px-2"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeHeroSection(hero.id, index)}
                            className="text-red-500 hover:text-red-700 font-semibold"
                          >
                            Remove Slide
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
                            
                            <div className="flex flex-col space-y-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(hero.id, index, e.target.files[0])}
                                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                                disabled={uploading}
                              />
                              {uploading && (
                                <div className="text-yellow-600 text-sm">Uploading image...</div>
                              )}
                            </div>
                            
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-yellow-700 mb-1">
                                Or enter image URL
                              </label>
                              <input
                                type="text"
                                value={section.src || ''}
                                onChange={(e) => updateHeroField(hero.id, index, 'src', e.target.value)}
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
                              value={section.heading || ''}
                              onChange={(e) => updateHeroField(hero.id, index, 'heading', e.target.value)}
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
                                onChange={(e) => updateHeroField(hero.id, index, 'button.label', e.target.value)}
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
                                onChange={(e) => updateHeroField(hero.id, index, 'button.href', e.target.value)}
                                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                placeholder="/path"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Slide Button */}
                  <button
                    onClick={() => addHeroSection(hero.id)}
                    className="w-full border-2 border-dashed border-yellow-400 text-yellow-600 hover:text-yellow-800 hover:border-yellow-500 rounded-lg p-4 text-center transition-colors"
                  >
                    + Add Slide to This Hero
                  </button>
                </div>
              </div>
            ))}
            
            {heroes.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-25">
                <div className="text-yellow-600 mb-4">No hero sections yet.</div>
                <button
                  onClick={addNewHero}
                  disabled={saving}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
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