"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Plus, Trash } from "lucide-react";

/**
 * HeroEditor
 * - upload files (image|video) to the "pageants" bucket
 * - shows file preview & filename next to upload button
 * - limits: max 5 slides, max file size 20MB
 * - user must be authenticated for client-side uploads (or configure bucket accordingly)
 */
export default function HeroEditor({ eventId }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false); // for save operation
  const [error, setError] = useState("");

  // fetch all existing hero rows for this pageant
  useEffect(() => {
    const fetchHeroes = async () => {
      const { data, error } = await supabase
        .from("hero")
        .select("*")
        .eq("event_id", eventId)
        .order("position", { ascending: true });

      if (error) {
        console.error("fetchHeroes error:", error);
      } else {
        // ensure shape: content, type, title, cta_label, cta_link, position
        setHeroes(
          (data || []).map((r) => ({
            id: r.id,
            type: r.type,
            content: r.content,
            title: r.title || "",
            cta_label: r.cta_label || "",
            cta_link: r.cta_link || "",
            position: r.position ?? 0,
            // UI-only fields:
            uploading: false,
            localPreview: null,
            filename: r.content ? getFilenameFromUrl(r.content) : "",
          }))
        );
      }
    };
    if (eventId) fetchHeroes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // helpers
  function getFilenameFromUrl(url) {
    try {
      const parts = url.split("/").pop();
      return parts || "";
    } catch {
      return "";
    }
  }

  // Add new hero (blank)
  const handleAddHero = () => {
    setError("");
    if (heroes.length >= 5) {
      setError("You can only add up to 5 hero slides.");
      return;
    }
    setHeroes((prev) => [
      ...prev,
      {
        type: "image",
        content: "",
        title: "",
        cta_label: "",
        cta_link: "",
        position: prev.length,
        uploading: false,
        localPreview: null,
        filename: "",
      },
    ]);
  };

  // Delete hero from local form
  const handleDelete = (idx) => {
    setHeroes((prev) => prev.filter((_, i) => i !== idx));
  };

  // file -> upload to Supabase storage as hero/{pageantId}/{timestamp}.{ext}
  const handleFileUpload = async (file, idx) => {
    setError("");
    if (!file) return;

    // check auth session (uploads usually require authenticated user)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        setError(
          "You must be signed in to upload files. (Sign in or configure your Supabase bucket to allow uploads.)"
        );
        return;
      }
    } catch (err) {
      // older/newer supabase-js clients might have different shapes — ignore but warn in console
      console.warn("Could not check session:", err?.message ?? err);
    }

    // size check (20MB)
    const MAX = 20 * 1024 * 1024;
    if (file.size > MAX) {
      setError(`File ${file.name} exceeds 20MB limit.`);
      return;
    }

    const ext = file.name.split(".").pop();
    const filePath = `hero/${eventId}/${Date.now()}.${ext}`;

    // create local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    setHeroes((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...(copy[idx] || {}),
        uploading: true,
        localPreview: localPreviewUrl,
        filename: file.name,
      };
      return copy;
    });

    try {
      // upload
      const { error: uploadError } = await supabase.storage
        .from("pageants")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("uploadError:", uploadError);
        setError(
          uploadError.message ||
            uploadError.error ||
            "Error uploading file to storage (check bucket and auth)."
        );
        // stop uploading flag
        setHeroes((prev) => {
          const copy = [...prev];
          copy[idx] = {
            ...(copy[idx] || {}),
            uploading: false,
          };
          return copy;
        });
        return;
      }

      // get public URL
      const { data } = supabase.storage.from("pageants").getPublicUrl(filePath);
      const publicUrl = data?.publicUrl || "";

      const type = file.type.startsWith("video") ? "video" : "image";

      // update hero entry with public URL (and clear localPreview)
      setHeroes((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...(copy[idx] || {}),
          content: publicUrl,
          type,
          uploading: false,
          // keep a preview: prefer uploaded URL, fallback to local preview
          localPreview: publicUrl || (copy[idx] && copy[idx].localPreview) || null,
          filename: file.name,
        };
        return copy;
      });

      // revoke local preview URL after a little while to avoid leak
      setTimeout(() => {
        try {
          URL.revokeObjectURL(localPreviewUrl);
        } catch (e) {
          /* noop */
        }
      }, 5000);
    } catch (err) {
      console.error("Unexpected upload error:", err);
      setError(err?.message || "Unexpected error uploading file.");
      setHeroes((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...(copy[idx] || {}),
          uploading: false,
        };
        return copy;
      });
    }
  };

  // Save heroes to DB: remove existing for pageant and bulk-insert from form
  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      // sanity: ensure none of the entries are still uploading
      const uploadingNow = heroes.some((h) => h?.uploading);
      if (uploadingNow) {
        setError("Please wait for uploads to finish before saving.");
        setLoading(false);
        return;
      }

      // remove old hero rows
      const { error: deleteError } = await supabase
        .from("hero")
        .delete()
        .eq("event_id", eventId);
      if (deleteError) {
        console.error("Error clearing old heroes:", deleteError);
        // continue — we will still try insert
      }

      // prepare payload (position from current order)
      const payload = heroes.map((h, idx) => ({
  event_id: eventId,
  type: h.type,
  content: h.content,
  title: h.title,
  cta_label: h.cta_label,
  cta_link: h.cta_link,
  position: idx,
  created_by: user.id, // <--- must match RLS
}));

      const { error: insertError } = await supabase.from("hero").insert(payload);
      if (insertError) {
        console.error("insertError:", insertError);
        setError(insertError.message || "Failed to save hero slides.");
      }
    } catch (err) {
      console.error("handleSave error:", err);
      setError(err?.message || "Unexpected error saving hero slides.");
    } finally {
      setLoading(false);
    }
  };

  // UI piece: file preview block (image or video) + filename
  function PreviewPane({ hero }) {
    const previewUrl = hero?.localPreview || hero?.content || null;
    return (
      <div className="flex items-start gap-3">
        <div className="w-40 h-24 bg-gray-900 rounded overflow-hidden flex items-center justify-center">
          {previewUrl ? (
            hero.type === "video" ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted controls />
            ) : (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-xs text-gray-300 px-2 text-center">
              No file selected
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-300">{hero.filename || getFilenameFromUrl(hero.content) || "—"}</div>
          {hero.uploading && <div className="text-sm text-yellow-400">Uploading…</div>}
          {!hero.uploading && hero.content && <div className="text-sm text-green-400">Uploaded</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hero Section Editor</h2>

      {error && <p className="text-red-500">{error}</p>}

      {/* forms */}
      {heroes.map((h, idx) => (
        <div key={idx} className="border p-4 rounded space-y-3 relative">
          <button
            onClick={() => handleDelete(idx)}
            className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded"
            title="Remove this slide (local)"
          >
            <Trash size={14} />
          </button>

          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* left: upload + preview */}
            <div className="flex-1 md:w-1/3">
              <label className="block font-semibold mb-2">Upload Hero Media</label>

              <div className="flex items-center gap-4">
                <input
                  id={`upload-${idx}`}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleFileUpload(file, idx);
                  }}
                />
                <label
                  htmlFor={`upload-${idx}`}
                  className="inline-block cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Choose File
                </label>

                {/* Preview pane next to button */}
                <div className="flex-1">
                  <PreviewPane hero={h} />
                </div>
              </div>
            </div>

            {/* right: text controls */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block font-semibold">Hero Title</label>
                <input
                  type="text"
                  value={h.title}
                  onChange={(e) => {
                    const updated = [...heroes];
                    updated[idx].title = e.target.value;
                    setHeroes(updated);
                  }}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold">CTA Label (e.g., Buy Ticket)</label>
                <input
                  type="text"
                  value={h.cta_label}
                  onChange={(e) => {
                    const updated = [...heroes];
                    updated[idx].cta_label = e.target.value;
                    setHeroes(updated);
                  }}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold">CTA Link (e.g., /register)</label>
                <input
                  type="text"
                  value={h.cta_link}
                  onChange={(e) => {
                    const updated = [...heroes];
                    updated[idx].cta_link = e.target.value;
                    setHeroes(updated);
                  }}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* controls */}
      <div className="flex items-center gap-4">
        {heroes.length < 5 && (
          <button
            onClick={handleAddHero}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            <Plus size={16} /> Add Hero
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Save All Hero Slides"}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Notes: max 5 slides. Files must be ≤ 20MB. Supported types: images (jpg, png, gif, etc) and videos (mp4, webm).
      </p>
    </div>
  );
}
