"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Upload, Play, Trash2, RefreshCcw, Plus, X, Eye } from "lucide-react";

/**
 * Helper: convert normal YouTube/Vimeo links into embeddable links
 */
function convertToEmbed(url) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

/**
 * Component: GalleryVideos
 * @param {object} event - Event object with id and user_id
 */
export default function GalleryVideos({ event }) {
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({
    url: "",
    title: "",
    description: "",
    thumbnail: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch videos from Supabase events table
  useEffect(() => {
    if (event?.id) fetchVideos();
  }, [event?.id]);

  async function fetchVideos() {
    const { data, error } = await supabase
      .from("events")
      .select("videos")
      .eq("id", event.id)
      .single();

    if (error) {
      console.error("Error fetching videos:", error);
    } else {
      setVideos(data?.videos || []);
    }
  }

  // Upload thumbnail to Supabase Storage
  async function handleThumbnailUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `video-thumbnails/${event.id}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from("event-assets")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("event-assets")
        .getPublicUrl(fileName);

      setNewVideo((prev) => ({ ...prev, thumbnail: publicUrl }));
    } catch (err) {
      console.error("Thumbnail upload failed:", err.message);
      alert("Error uploading thumbnail");
    } finally {
      setUploading(false);
    }
  }

  // Add new video to events.videos JSONB column
  async function addVideo() {
    if (!newVideo.url.trim()) {
      alert("Please enter a video URL");
      return;
    }

    const embedUrl = convertToEmbed(newVideo.url);
    if (!embedUrl) {
      alert("Please enter a valid YouTube or Vimeo link.");
      return;
    }

    if (!newVideo.title.trim()) {
      alert("Please enter a video title");
      return;
    }

    try {
      setSaving(true);

      // Create video object
      const videoData = {
        url: newVideo.url.trim(),
        embedUrl,
        title: newVideo.title.trim(),
        description: newVideo.description.trim(),
        thumbnail: newVideo.thumbnail,
        created_at: new Date().toISOString(),
        views: 0,
        likes: 0
      };

      // Get current videos array and append new video
      const { data: currentEvent } = await supabase
        .from("events")
        .select("videos")
        .eq("id", event.id)
        .single();

      const currentVideos = currentEvent?.videos || [];
      const updatedVideos = [...currentVideos, videoData];

      // Update events table with new videos array
      const { error } = await supabase
        .from("events")
        .update({ 
          videos: updatedVideos
        })
        .eq("id", event.id)
        .eq("user_id", event.user_id); // Ensure user owns this event

      if (error) throw error;

      // Update local state
      setVideos(updatedVideos);
      setNewVideo({ url: "", title: "", description: "", thumbnail: "" });
      setShowPreview(false);
      
      alert("Video added successfully!");

    } catch (error) {
      console.error("Error adding video:", error);
      alert("Error adding video: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Update an existing video
  async function updateVideo(index, updatedFields) {
    try {
      const updatedVideos = videos.map((video, i) => 
        i === index ? { 
          ...video, 
          ...updatedFields,
          embedUrl: convertToEmbed(updatedFields.url || video.url)
        } : video
      );

      const { error } = await supabase
        .from("events")
        .update({ 
          videos: updatedVideos
        })
        .eq("id", event.id)
        .eq("user_id", event.user_id);

      if (error) throw error;

      setVideos(updatedVideos);
      alert("Video updated successfully!");
    } catch (error) {
      console.error("Error updating video:", error);
      alert("Error updating video: " + error.message);
    }
  }

  // Delete a video
  async function deleteVideo(index) {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const updatedVideos = videos.filter((_, i) => i !== index);
      
      const { error } = await supabase
        .from("events")
        .update({ 
          videos: updatedVideos
        })
        .eq("id", event.id)
        .eq("user_id", event.user_id);

      if (error) throw error;

      setVideos(updatedVideos);
      alert("Video deleted successfully!");
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Error deleting video: " + error.message);
    }
  }

  // Reset form
  const resetForm = () => {
    setNewVideo({ url: "", title: "", description: "", thumbnail: "" });
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Video Gallery</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add and manage videos for your event
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {videos.length} video{videos.length !== 1 ? 's' : ''} added
        </div>
      </div>

      {/* Add New Video Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-500" />
          Add New Video
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL *
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                value={newVideo.url}
                onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports YouTube and Vimeo links
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Title *
              </label>
              <input
                type="text"
                placeholder="Enter a compelling title for your video..."
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Describe what this video is about..."
                rows={3}
                value={newVideo.description}
                onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Thumbnail
              </label>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleThumbnailUpload} 
                    className="hidden" 
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {newVideo.thumbnail ? 'Replace Thumbnail' : 'Upload Thumbnail'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Optional - JPG, PNG (max 5MB)
                    </span>
                  </div>
                </label>
                
                {uploading && (
                  <div className="text-sm text-blue-600">Uploading...</div>
                )}
                
                {newVideo.thumbnail && (
                  <div className="relative">
                    <img
                      src={newVideo.thumbnail}
                      alt="Thumbnail preview"
                      className="w-20 h-16 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => setNewVideo({ ...newVideo, thumbnail: "" })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Video Preview
              </label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {showPreview && convertToEmbed(newVideo.url) && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                <iframe
                  src={convertToEmbed(newVideo.url)}
                  title="Video preview"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            {showPreview && !convertToEmbed(newVideo.url) && (
              <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Play className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Enter a valid video URL to see preview</p>
                </div>
              </div>
            )}

            {/* Thumbnail Preview */}
            {newVideo.thumbnail && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Preview
                </label>
                <img
                  src={newVideo.thumbnail}
                  alt="Thumbnail preview"
                  className="w-32 h-20 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={addVideo}
            disabled={saving || !newVideo.url.trim() || !newVideo.title.trim()}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding Video...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Video
              </>
            )}
          </button>
          
          <button
            onClick={resetForm}
            type="button"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Existing Videos Grid */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Existing Videos ({videos.length})
        </h4>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                {/* Thumbnail/Preview */}
                <div className="aspect-video bg-gray-100 relative">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : video.embedUrl ? (
                    <iframe
                      src={video.embedUrl}
                      title={video.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {video.views || 0} views
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 line-clamp-2">
                    {video.title}
                  </h5>
                  
                  {video.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        const newTitle = prompt("Enter new title:", video.title);
                        const newDesc = prompt("Enter new description:", video.description);
                        const newUrl = prompt("Enter new URL:", video.url);
                        
                        if (newTitle !== null || newDesc !== null || newUrl !== null) {
                          updateVideo(index, {
                            title: newTitle !== null ? newTitle : video.title,
                            description: newDesc !== null ? newDesc : video.description,
                            url: newUrl !== null ? newUrl : video.url,
                          });
                        }
                      }}
                      className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => deleteVideo(index)}
                      className="text-red-500 text-sm flex items-center gap-1 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium">No videos added yet</p>
            <p className="text-xs mt-1">Add your first video using the form above</p>
          </div>
        )}
      </div>
    </div>
  );
}