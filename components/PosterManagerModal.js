// components/PosterManagerModal.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "../lib/supabaseClient";

export default function PosterManagerModal({ isOpen, onClose }) {
  const [desktopPosters, setDesktopPosters] = useState([]);
  const [mobilePosters, setMobilePosters] = useState([]);
  const [activeTab, setActiveTab] = useState('desktop');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchPosterData();
    }
  }, [isOpen]);

  const fetchPosterData = async () => {
    try {
      const { data, error } = await supabase
        .from('gleedz_hero')
        .select('desktop_posters, mobile_poster')
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Handle both array and single object formats
      setDesktopPosters(Array.isArray(data?.desktop_posters) ? data.desktop_posters : [data?.desktop_posters].filter(Boolean));
      setMobilePosters(Array.isArray(data?.mobile_poster) ? data.mobile_poster : [data?.mobile_poster].filter(Boolean));
    } catch (error) {
      console.error('Error fetching poster data:', error);
      alert('Error loading poster data');
    } finally {
      setLoading(false);
    }
  };

  const validateAspectRatio = (file, isDesktop) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        // Desktop: h-5 to w-2.5 ratio = 2.5/5 = 0.5 (vertical)
        // Mobile: w-5 to h-2.5 ratio = 5/2.5 = 2 (landscape)
        const expectedRatio = isDesktop ? 0.5 : 2;
        const tolerance = 0.2; // 20% tolerance
        const isValid = Math.abs(ratio - expectedRatio) <= tolerance;
        
        resolve({
          isValid,
          message: isDesktop 
            ? `Desktop posters should be vertical (ratio ~0.5). Your image ratio is ${ratio.toFixed(2)}`
            : `Mobile posters should be landscape (ratio ~2.0). Your image ratio is ${ratio.toFixed(2)}`
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file, isDesktop) => {
    try {
      setUploading(true);
      
      // Validate aspect ratio
      const validation = await validateAspectRatio(file, isDesktop);
      if (!validation.isValid) {
        if (!confirm(`${validation.message}\n\nDo you want to continue anyway?`)) {
          return null;
        }
      }
      
      const fileExt = file.name.split('.').pop();
      const folder = isDesktop ? 'desktop-posters' : 'mobile-posters';
      const fileName = `${folder}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload image to Supabase Storage
      const { data, error } = await supabase.storage
        .from('posters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posters')
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

  const handleImageUpload = async (index, file, isDesktop) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const imageUrl = await uploadImage(file, isDesktop);
    if (imageUrl) {
      if (isDesktop) {
        updateDesktopPoster(index, 'src', imageUrl);
      } else {
        updateMobilePoster(index, 'src', imageUrl);
      }
    }
  };

  const savePosterData = async () => {
    try {
      setSaving(true);
      
      // Check if record exists
      const { data: existingData } = await supabase
        .from('gleedz_hero')
        .select('id')
        .limit(1);

      let result;

      const updateData = {
        // Store as single object if only one poster, array if multiple
        desktop_posters: desktopPosters.length === 1 ? desktopPosters[0] : desktopPosters,
        mobile_poster: mobilePosters.length === 1 ? mobilePosters[0] : mobilePosters
      };

      if (existingData && existingData.length > 0) {
        // Update existing record
        result = await supabase
          .from('gleedz_hero')
          .update(updateData)
          .eq('id', existingData[0].id);
      } else {
        // Insert new record
        result = await supabase
          .from('gleedz_hero')
          .insert([updateData]);
      }

      if (result.error) throw result.error;

      alert('Poster data saved successfully!');
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error saving poster data:', error);
      alert('Error saving poster data: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addPoster = (isDesktop) => {
    const newPoster = {
      src: '',
      button: { label: 'Explore', href: '/' }
    };
    
    if (isDesktop) {
      setDesktopPosters([...desktopPosters, newPoster]);
    } else {
      setMobilePosters([...mobilePosters, newPoster]);
    }
  };

  const removePoster = (index, isDesktop) => {
    if (confirm('Are you sure you want to remove this poster?')) {
      if (isDesktop) {
        setDesktopPosters(desktopPosters.filter((_, i) => i !== index));
      } else {
        setMobilePosters(mobilePosters.filter((_, i) => i !== index));
      }
    }
  };

  const updateDesktopPoster = (index, field, value) => {
    const updatedPosters = [...desktopPosters];
    
    if (field.startsWith('button.')) {
      const buttonField = field.split('.')[1];
      if (!updatedPosters[index].button) {
        updatedPosters[index].button = {};
      }
      updatedPosters[index].button[buttonField] = value;
    } else {
      updatedPosters[index][field] = value;
    }
    
    setDesktopPosters(updatedPosters);
  };

  const updateMobilePoster = (index, field, value) => {
    const updatedPosters = [...mobilePosters];
    
    if (field.startsWith('button.')) {
      const buttonField = field.split('.')[1];
      if (!updatedPosters[index].button) {
        updatedPosters[index].button = {};
      }
      updatedPosters[index].button[buttonField] = value;
    } else {
      updatedPosters[index][field] = value;
    }
    
    setMobilePosters(updatedPosters);
  };

  const movePoster = (index, direction, isDesktop) => {
    const posters = isDesktop ? desktopPosters : mobilePosters;
    const setPosters = isDesktop ? setDesktopPosters : setMobilePosters;
    
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < posters.length) {
      const updatedPosters = [...posters];
      [updatedPosters[index], updatedPosters[newIndex]] = [updatedPosters[newIndex], updatedPosters[index]];
      setPosters(updatedPosters);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-yellow-600 text-center">Loading poster data...</div>
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
            <h2 className="text-2xl font-bold">Manage Posters</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-yellow-100 mt-2">
            Manage desktop and mobile posters. Desktop: vertical (ratio ~0.5), Mobile: landscape (ratio ~2.0)
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-yellow-200 mb-6">
            <button
              onClick={() => setActiveTab('desktop')}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'desktop'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-yellow-500'
              }`}
            >
              Desktop Posters ({desktopPosters.length})
            </button>
            <button
              onClick={() => setActiveTab('mobile')}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'mobile'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-yellow-500'
              }`}
            >
              Mobile Posters ({mobilePosters.length})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => addPoster(activeTab === 'desktop')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
            >
              <span className="mr-2">+</span> Add {activeTab === 'desktop' ? 'Desktop' : 'Mobile'} Poster
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePosterData}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>

          {/* Posters List */}
          <div className="space-y-6">
            {/* Desktop Posters */}
            {activeTab === 'desktop' && (
              <>
                {desktopPosters.map((poster, index) => (
                  <PosterItem
                    key={index}
                    poster={poster}
                    index={index}
                    isDesktop={true}
                    onImageUpload={handleImageUpload}
                    onUpdate={updateDesktopPoster}
                    onRemove={removePoster}
                    onMove={movePoster}
                    uploading={uploading}
                    totalItems={desktopPosters.length}
                  />
                ))}
                {desktopPosters.length === 0 && (
                  <EmptyState 
                    type="desktop" 
                    onAdd={() => addPoster(true)} 
                  />
                )}
              </>
            )}

            {/* Mobile Posters */}
            {activeTab === 'mobile' && (
              <>
                {mobilePosters.map((poster, index) => (
                  <PosterItem
                    key={index}
                    poster={poster}
                    index={index}
                    isDesktop={false}
                    onImageUpload={handleImageUpload}
                    onUpdate={updateMobilePoster}
                    onRemove={removePoster}
                    onMove={movePoster}
                    uploading={uploading}
                    totalItems={mobilePosters.length}
                  />
                ))}
                {mobilePosters.length === 0 && (
                  <EmptyState 
                    type="mobile" 
                    onAdd={() => addPoster(false)} 
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Poster Item Component
function PosterItem({ poster, index, isDesktop, onImageUpload, onUpdate, onRemove, onMove, uploading, totalItems }) {
  return (
    <div className="border border-yellow-300 rounded-lg p-6 bg-yellow-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-yellow-800">
          {isDesktop ? 'Desktop' : 'Mobile'} Poster {index + 1}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onMove(index, -1, isDesktop)}
            disabled={index === 0}
            className="text-yellow-600 hover:text-yellow-800 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(index, 1, isDesktop)}
            disabled={index === totalItems - 1}
            className="text-yellow-600 hover:text-yellow-800 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => onRemove(index, isDesktop)}
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
              Poster Image *
              <span className="text-yellow-500 text-xs ml-2">
                {isDesktop ? 'Vertical recommended (ratio ~0.5)' : 'Landscape recommended (ratio ~2.0)'}
              </span>
            </label>
            
            {/* Image Preview */}
            {poster.src && (
              <div className="mb-3">
                <img
                  src={poster.src}
                  alt="Preview"
                  className={`w-full rounded-lg border border-yellow-300 ${
                    isDesktop ? 'max-h-64 object-cover' : 'max-h-48 object-cover'
                  }`}
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
                onChange={(e) => onImageUpload(index, e.target.files[0], isDesktop)}
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
                value={poster.src}
                onChange={(e) => onUpdate(index, 'src', e.target.value)}
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1">
                Button Label *
              </label>
              <input
                type="text"
                value={poster.button?.label || ''}
                onChange={(e) => onUpdate(index, 'button.label', e.target.value)}
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
                value={poster.button?.href || ''}
                onChange={(e) => onUpdate(index, 'button.href', e.target.value)}
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="/path"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ type, onAdd }) {
  const isDesktop = type === 'desktop';
  
  return (
    <div className="text-center py-12 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-25">
      <div className="text-yellow-600 mb-2">No {type} posters yet.</div>
      <div className="text-yellow-500 text-sm mb-4">
        {isDesktop 
          ? 'Upload vertical images (recommended ratio: 0.5) for desktop viewing'
          : 'Upload landscape images (recommended ratio: 2.0) for mobile viewing'
        }
      </div>
      <button
        onClick={onAdd}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Create Your First {isDesktop ? 'Desktop' : 'Mobile'} Poster
      </button>
    </div>
  );
}