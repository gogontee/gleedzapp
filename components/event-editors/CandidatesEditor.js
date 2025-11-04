"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function CandidatesEditor({ pageantId }) {
  const [candidates, setCandidates] = useState([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch candidates
  useEffect(() => {
    fetchCandidates();
  }, [pageantId]);

  async function fetchCandidates() {
    const { data, error } = await supabase
      .from("pageant_candidates")
      .select("*")
      .eq("pageant_id", pageantId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setCandidates(data);
  }

  // Add candidate
  async function addCandidate(e) {
    e.preventDefault();
    if (!name) return alert("Candidate name is required.");

    setLoading(true);
    try {
      let photoUrl = null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("Image must be less than 10MB");
          setLoading(false);
          return;
        }

        const ext = file.name.split(".").pop();
        const path = `candidates/${pageantId}/${uuidv4()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("pageants")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("pageants")
          .getPublicUrl(path);

        photoUrl = publicData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("pageant_candidates")
        .insert([
          {
            pageant_id: pageantId,
            name,
            bio,
            photo_url: photoUrl,
          },
        ]);

      if (insertError) throw insertError;

      setName("");
      setBio("");
      setFile(null);
      fetchCandidates();
    } catch (err) {
      console.error("Error adding candidate:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete candidate
  async function deleteCandidate(id, photoUrl) {
    if (!confirm("Delete this candidate?")) return;

    // Try to also delete from storage
    if (photoUrl) {
      const parts = photoUrl.split("/object/public/pageants/");
      if (parts[1]) {
        await supabase.storage.from("pageants").remove([parts[1]]);
      }
    }

    await supabase.from("pageant_candidates").delete().eq("id", id);
    fetchCandidates();
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Candidates Editor</h2>

      {/* Add candidate form */}
      <form onSubmit={addCandidate} className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Candidate Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full border p-2 rounded"
        />
        <textarea
          placeholder="Short Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="block w-full border p-2 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Add Candidate"}
        </button>
      </form>

      {/* Candidate table */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Photo</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Bio</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id}>
              <td className="border p-2 text-center">
                {c.photo_url ? (
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="h-12 w-12 object-cover rounded-full mx-auto"
                  />
                ) : (
                  "—"
                )}
              </td>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.bio}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => deleteCandidate(c.id, c.photo_url)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {candidates.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center p-4 text-gray-500">
                No candidates yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
