// app/page.js
import HomeClient from "../components/HomeClient";

const posterUrls = [
  "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster.mp4",
  "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster1.mp4",
  "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster2.jpg",
  "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/missuniverse.jpg",
  "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/1002.mp4",
  "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/posters/poster4.mp4",
];

export default function HomePage() {
  // logo URL
  const logoUrl =
    "https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/gleedlogo.png";

  // build poster objects with hrefs
  const posters = posterUrls.map((url, index) => ({
    name: `poster${index + 1}`,
    url,
    href: `/poster/poster${index + 1}`, // each poster gets a unique link
    autoplay: url.endsWith(".mp4"), // optional flag for autoplay in HomeClient
  }));

  return <HomeClient logoUrl={logoUrl} posters={posters} />;
}
