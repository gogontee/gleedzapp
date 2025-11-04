// components/SearchBar.js
export default function SearchBar() {
  return (
    <div className="relative max-w-xl mx-auto mt-10">
      <input
        type="text"
        placeholder="Search gigs, creatives..."
        className="w-full px-5 py-3 rounded-2xl
                   bg-white/20 [backdrop-filter:blur(12px)]
                   border border-white/30 
                   shadow-lg text-white
                   placeholder-white/70 
                   focus:outline-none focus:ring-2 focus:ring-brand
                   transition-transform hover:scale-105"
      />
    </div>
  );
}
