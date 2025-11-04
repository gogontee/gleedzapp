"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function PostersEditor({ pageantId }) {
  const [posters, setPosters] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosters();
  }, [pageantId]);

  // Fetch posters
  async function fetchPosters() {
    const { data, error } = await supabase
      .from("pageant_posters")
      .select("*")
      .eq("pageant_id", pageantId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setPosters(data);
  }

  // Upload + insert
  async function addPoster(e) {
    e.preventDefault();
    if (!file) return alert("Please select an image.");
    if (!caption) return alert("Caption is required.");
    if (file.size > 10 * 1024 * 1024) return alert("Image must be < 10MB");

    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `posters/${uuidv4()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("pageants")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("pageants")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("pageant_posters")
        .insert([
          {
            pageant_id: pageantId,
            image_url: urlData.publicUrl,
            caption,
          },
        ]);

      if (insertError) throw insertError;

      setFile(null);
      setCaption("");
      fetchPosters();
    } catch (err) {
      console.error("Upload error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete poster
  async function deletePoster(id, imageUrl) {
    if (!confirm("Delete this poster?")) return;

    const path = imageUrl.split("/").slice(-2).join("/");

    await supabase.storage.from("pageants").remove([path]);
    await supabase.from("pageant_posters").delete().eq("id", id);

    fetchPosters();
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Posters Editor</h2>

      <form onSubmit={addPoster} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
          className="block w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Poster Caption (max 100 chars)"
          maxLength={100}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          required
          className="block w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? "Uploading..." : "Add Poster"}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {posters.map((poster) => (
          <div key={poster.id} className="relative border rounded overflow-hidden">
            <img
              src={poster.image_url}
              alt={poster.caption}
              className="w-full h-40 object-cover"
            />
            <div className="p-2 text-sm">{poster.caption}</div>
            <button
              onClick={() => deletePoster(poster.id, poster.image_url)}
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
