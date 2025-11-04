"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function HighlightsEditor({ pageantId }) {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Fetch highlights
  useEffect(() => {
    fetchHighlights();
  }, [pageantId]);

  async function fetchHighlights() {
    const { data, error } = await supabase
      .from("pageant_highlights")
      .select("*")
      .eq("pageant_id", pageantId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setHighlights(data);
  }

  // Upload file & insert into DB
  async function addHighlight(e) {
    e.preventDefault();
    if (!file || !title) return alert("File and title are required");

    if (file.size > 20 * 1024 * 1024) {
      return alert("File must be less than 20MB");
    }

    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `highlights/${uuidv4()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("pageants")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("pageants")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("pageant_highlights")
        .insert([
          {
            pageant_id: pageantId,
            media_url: urlData.publicUrl,
            title,
            description,
          },
        ]);

      if (insertError) throw insertError;

      setFile(null);
      setTitle("");
      setDescription("");
      fetchHighlights();
    } catch (err) {
      console.error("Upload error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete highlight
  async function deleteHighlight(id, mediaUrl) {
    if (!confirm("Delete this highlight?")) return;

    // Extract path from public URL
    const path = mediaUrl.split("/").slice(-2).join("/");

    await supabase.storage.from("pageants").remove([path]);
    await supabase.from("pageant_highlights").delete().eq("id", id);

    fetchHighlights();
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Highlights Editor</h2>

      <form onSubmit={addHighlight} className="space-y-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
          className="block w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Short Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="block w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Description (max 50 chars)"
          maxLength={50}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Uploading..." : "Add Highlight"}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {highlights.map((item) => (
          <div
            key={item.id}
            className="p-3 border rounded flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              {item.media_url.endsWith(".mp4") ? (
                <video
                  src={item.media_url}
                  className="w-24 h-16 object-cover rounded"
                  controls
                />
              ) : (
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="w-24 h-16 object-cover rounded"
                />
              )}
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
            <button
              onClick={() => deleteHighlight(item.id, item.media_url)}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
