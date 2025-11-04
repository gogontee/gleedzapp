"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Props:
 * - publisherId: uuid of publisher (creator)
 * - onClose: function to close modal
 * - onSuccess: optional callback to refresh parent data
 */
export default function CreateEventClient({ publisherId, onClose, onSuccess }) {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [eventCode, setEventCode] = useState("");
  const [codeValidations, setCodeValidations] = useState({
    hasLetter: false,
    hasNumber: false,
    hasSpecial: false,
    minLength: false,
  });

  // Event type options - MUST SELECT FROM THESE
  const eventTypeOptions = [
    "Pageants",
    "Reality",
    "Concerts",
    "Awards",
    "Tv Show",
    "Corporate",
    "Talent",
    "Faith",
    "Sports",
    "Others"
  ];

  // form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [type, setType] = useState(""); // This will now be a dropdown selection
  const [colorsInput, setColorsInput] = useState(""); // ephemeral for picker input
  const [colors, setColors] = useState([]); // up to 3 color hex strings
  const [heroSections, setHeroSections] = useState([]);
  const [groupBanner1, setGroupBanner1] = useState([]);

  // flow controls
  const [termsChecked, setTermsChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
  }, []);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  useEffect(() => {
    const hasLetter = /[A-Za-z]/.test(eventCode);
    const hasNumber = /\d/.test(eventCode);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-=+]/.test(eventCode);
    const minLength = eventCode.length >= 8;

    setCodeValidations({ hasLetter, hasNumber, hasSpecial, minLength });
  }, [eventCode]);

  // preview logo
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // helpers
  const slugify = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const ensureUniqueSlug = async (base) => {
    let s = base;
    let i = 0;
    while (true) {
      const { data } = await supabase.from("events").select("id").eq("slug", s).limit(1);
      if (!data || data.length === 0) return s;
      i += 1;
      s = `${base}-${i}`;
    }
  };

  const uploadFile = async (file, destPath) => {
    if (!file) return null;
    try {
      const fileExt = file.name?.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const path = `${destPath}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("event-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        console.error("upload error", uploadError);
        throw uploadError;
      }
      const { data: publicData } = supabase.storage.from("event-assets").getPublicUrl(path);
      return publicData?.publicUrl ?? null;
    } catch (err) {
      console.error("uploadFile error", err);
      return null;
    }
  };

  // hero helpers
  const addHero = () =>
    setHeroSections((p) => [
      ...p,
      { id: Date.now().toString(), type: "image", src: "", file: null, caption: "", cta: { label: "", href: "" } },
    ]);
  const updateHero = (index, change) => setHeroSections((p) => p.map((h, i) => (i === index ? { ...h, ...change } : h)));
  const removeHero = (index) => setHeroSections((p) => p.filter((_, i) => i !== index));

  // banner helpers
  const addBanner = () => setGroupBanner1((p) => [...p, { src: "", file: null }]);
  const updateBanner = (index, change) => setGroupBanner1((p) => p.map((b, i) => (i === index ? { ...b, ...change } : b)));
  const removeBanner = (index) => setGroupBanner1((p) => p.filter((_, i) => i !== index));

  // color helpers
  const handleAddColor = () => {
    if (!colorsInput) return;
    if (colors.length >= 3) {
      setToast({ type: "warn", text: "You can add up to 3 colors only." });
      return;
    }
    if (!/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(colorsInput)) {
      setToast({ type: "error", text: "Please pick a valid color." });
      return;
    }
    setColors((p) => [...p, colorsInput]);
    setColorsInput("");
  };
  const handleRemoveColor = (i) => setColors((p) => p.filter((_, idx) => idx !== i));

  // top-level submit: opens confirm modal
  const handleCreateClick = (e) => {
    e.preventDefault();
    setError(null);
    if (!name) return setError("Event name is required");
    if (!type) return setError("Event type is required");
    if (!termsChecked) return setError("You must accept terms & policies to continue");
    if (!Object.values(codeValidations).every(Boolean)) {
      return setError("Please enter a valid event code with text, number, special character, and at least 8 characters.");
    }

    setShowConfirm(true);
  };

  // proceed after confirm: charge tokens then create event
  const handleProceed = async () => {
    setError(null);
    setConfirmLoading(true);

    try {
      // fetch wallet
      const { data: walletData, error: walletErr } = await supabase
        .from("token_wallets")
        .select("balance")
        .eq("user_id", publisherId)
        .single();

      if (walletErr) throw walletErr;

      const balance = Number(walletData?.balance ?? 0);
      const cost = 50;

      if (balance < cost) {
        setError("Insufficient tokens. You need at least 50 tokens to create an event.");
        setConfirmLoading(false);
        setShowConfirm(false);
        return;
      }

      // Begin creation process:
      // 1) Upload logo, heroes, and banners (optimized for speed)
      const baseSlug = slug ? slugify(slug) : slugify(name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      // Upload logo
      let logoPublicUrl = null;
      if (logoFile) {
        logoPublicUrl = await uploadFile(logoFile, `events/${uniqueSlug}/logo`);
      }

      // Upload heroes concurrently
      const finalHeroes = await Promise.all(
        heroSections.map(async (h) => {
          const hero = { ...h };
          if (hero.file) {
            const u = await uploadFile(hero.file, `events/${uniqueSlug}/heroes`);
            hero.src = u || hero.src;
            delete hero.file;
          }
          return {
            id: hero.id,
            type: hero.type,
            src: hero.src,
            caption: hero.caption,
            cta: hero.cta,
          };
        })
      );

      // Upload banners concurrently
      const finalBanners = (
        await Promise.all(
          groupBanner1.map(async (b) => {
            const banner = { ...b };
            if (banner.file) {
              const u = await uploadFile(banner.file, `events/${uniqueSlug}/banners`);
              banner.src = u || banner.src;
              delete banner.file;
            }
            return banner.src;
          })
        )
      ).filter(Boolean);

      // Upload thumbnail
      let thumbnailPublicUrl = null;
      if (thumbnailFile) {
        thumbnailPublicUrl = await uploadFile(thumbnailFile, `events/${uniqueSlug}/thumbnail`);
      }

      // 2) Deduct tokens & record last_action
      const newBalance = balance - cost;
      const { error: updateWalletErr } = await supabase
        .from("token_wallets")
        .update({ balance: newBalance, last_action: `Created ${name}` })
        .eq("user_id", publisherId);

      if (updateWalletErr) throw updateWalletErr;

      // 3) Insert event
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        throw new Error("Unable to fetch logged-in user. Please sign in again.");
      }

      const payload = {
        user_id: user.id,
        name,
        slug: uniqueSlug,
        description,
        logo: logoPublicUrl || null,
        thumbnail: thumbnailPublicUrl || null,
        type,
        page_color: colors.length ? colors : null,
        hero_sections: finalHeroes.length ? finalHeroes : null,
        group_banner1: finalBanners.length ? finalBanners : null,
        code: eventCode,
      };

      const { data: eventData, error: insertErr } = await supabase
        .from("events")
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw insertErr;

      // success
      setToast({ type: "success", text: `Event "${name}" created. 50 tokens deducted.` });

      // wait 2 seconds before closing
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong creating the event.");
    } finally {
      setConfirmLoading(false);
      setShowConfirm(false);
    }
  };

  // small inline toast auto dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      {/* Form (NO overlay here - parent page provides modal overlay) */}
      <div className="p-2">
        {toast && (
          <div
            className={`mb-3 p-2 rounded text-sm ${
              toast.type === "success" ? "bg-green-100 text-green-700" : toast.type === "error" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {toast.text}
          </div>
        )}

        <form onSubmit={handleCreateClick} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium">Event Name *</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="mt-1 block w-full rounded-md border p-2" 
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Slug (optional)</label>
            <input 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              placeholder="leave empty to auto-generate" 
              className="mt-1 block w-full rounded-md border p-2" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe your event, including dates, location, and what attendees can expect..."
              rows={4} 
              className="mt-1 block w-full rounded-md border p-2" 
            />
          </div>

          {/* Logo upload button */}
          <div>
            <label className="block text-sm font-medium mb-1">Logo</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center px-3 py-2 bg-gray-100 rounded cursor-pointer border">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                <span className="text-sm">Upload logo</span>
              </label>
              {logoPreview ? (
                <img src={logoPreview} alt="logo preview" className="w-16 h-16 rounded-full object-cover border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border">No</div>
              )}
            </div>
          </div>

          {/* Event Type Dropdown - CHANGED FROM INPUT TO SELECT */}
          <div>
            <label className="block text-sm font-medium">Event Type *</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="mt-1 block w-full rounded-md border p-2 bg-white"
              required
            >
              <option value="">Select event type</option>
              {eventTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Please select from the available event types</p>
          </div>

          {/* Colors with picker + add */}
          <div>
            <label className="block text-sm font-medium mb-1">Colors (pick up to 3)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={colorsInput || "#000000"} onChange={(e) => setColorsInput(e.target.value)} className="w-10 h-10 p-0 border rounded" />
              <button type="button" onClick={handleAddColor} className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50">
                + Add
              </button>
              <div className="flex gap-2 ml-2">
                {colors.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                    <div style={{ background: c }} className="w-5 h-5 rounded" />
                    <span className="text-xs">{c}</span>
                    <button type="button" onClick={() => handleRemoveColor(idx)} className="text-red-500 ml-1 text-xs">x</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* HERO SECTION EDITOR */}
          <div className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Hero Slides</h3>
              <button type="button" onClick={addHero} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Add Slide</button>
            </div>

            {heroSections.length === 0 && <div className="text-sm text-gray-400">No slides yet</div>}

            {heroSections.map((h, idx) => (
              <div key={h.id} className="mb-3 p-2 border rounded">
                <div className="flex gap-2 items-center">
                  <label className="text-sm w-20">Type</label>
                  <select value={h.type} onChange={(e) => updateHero(idx, { type: e.target.value })} className="rounded border p-1">
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <button type="button" onClick={() => removeHero(idx)} className="ml-auto text-red-500">Remove</button>
                </div>

                <div className="mt-2">
                  <label className="text-sm">Upload / URL</label>
                  <div className="flex gap-2 items-center">
                    <input type="file" accept="image/*,video/*" onChange={(e) => updateHero(idx, { file: e.target.files?.[0] ?? null })} />
                    <input placeholder="or paste a public URL" className="flex-1 rounded border p-1" value={h.src || ""} onChange={(e) => updateHero(idx, { src: e.target.value })} />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-sm">Caption</label>
                  <input value={h.caption} onChange={(e) => updateHero(idx, { caption: e.target.value })} className="mt-1 block w-full rounded-md border p-1" />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input placeholder="CTA label" value={h.cta?.label || ""} onChange={(e) => updateHero(idx, { cta: { ...h.cta, label: e.target.value } })} className="rounded border p-1" />
                  <input placeholder="CTA href" value={h.cta?.href || ""} onChange={(e) => updateHero(idx, { cta: { ...h.cta, href: e.target.value } })} className="rounded border p-1" />
                </div>
              </div>
            ))}
          </div>

          {/* BANNERS */}
          <div className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Banner / Poster Slides</h3>
              <button type="button" onClick={addBanner} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Add</button>
            </div>

            {groupBanner1.map((b, idx) => (
              <div key={idx} className="mb-2 flex items-center gap-2">
                <input type="file" accept="image/*,video/*" onChange={(e) => updateBanner(idx, { file: e.target.files?.[0] ?? null })} />
                <input placeholder="or public URL" value={b.src || ""} onChange={(e) => updateBanner(idx, { src: e.target.value })} className="flex-1 rounded border p-1" />
                <button type="button" onClick={() => removeBanner(idx)} className="text-red-500">Remove</button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Thumbnail</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center px-3 py-2 bg-gray-100 rounded cursor-pointer border">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) return;

                    // validate type
                    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
                    if (!validTypes.includes(file.type)) {
                      setToast({ type: "error", text: "Thumbnail must be JPG, JPEG, or PNG" });
                      return;
                    }

                    setThumbnailFile(file);
                  }}
                />
                <span className="text-sm">Upload Thumbnail</span>
              </label>

              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="thumbnail preview"
                  className="w-20 h-20 rounded object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded bg-gray-50 flex items-center justify-center text-gray-400 border text-xs">
                  No Thumbnail
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Code</label>
            <input
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
              placeholder="Enter a strong event code"
              className={`mt-1 block w-full rounded-md border p-2 ${
                Object.values(codeValidations).every(Boolean)
                  ? "border-green-500"
                  : "border-gray-300"
              }`}
            />
            <div className="mt-2 space-y-1 text-xs">
              <div className={`flex items-center gap-1 ${codeValidations.hasLetter ? "text-green-600" : "text-gray-500"}`}>
                {codeValidations.hasLetter ? "✅" : "❌"} Contains a letter
              </div>
              <div className={`flex items-center gap-1 ${codeValidations.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                {codeValidations.hasNumber ? "✅" : "❌"} Contains a number
              </div>
              <div className={`flex items-center gap-1 ${codeValidations.hasSpecial ? "text-green-600" : "text-gray-500"}`}>
                {codeValidations.hasSpecial ? "✅" : "❌"} Contains a special character
              </div>
              <div className={`flex items-center gap-1 ${codeValidations.minLength ? "text-green-600" : "text-gray-500"}`}>
                {codeValidations.minLength ? "✅" : "❌"} At least 8 characters
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input id="terms" type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} />
            <label htmlFor="terms" className="text-sm">
              I agree to the <a className="text-blue-600 underline" href="/terms" target="_blank">Terms of Use</a> and <a className="text-blue-600 underline" href="/privacy" target="_blank">Privacy Policy</a>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button 
              type="submit" 
              disabled={!termsChecked || loading || !type} 
              className={`bg-blue-600 text-white px-4 py-2 rounded ${(!termsChecked || loading || !type) ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading ? "Processing..." : "Create Event"}
            </button>

            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-2 rounded border hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-3">Confirm creation</h3>
            <p className="text-sm text-gray-700 mb-4">Creating this event will deduct <strong>50 tokens</strong> from your wallet. Proceed?</p>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-3 py-2 rounded border">Cancel</button>
              <button onClick={handleProceed} disabled={confirmLoading} className="px-4 py-2 rounded bg-red-600 text-white">
                {confirmLoading ? "Working..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}