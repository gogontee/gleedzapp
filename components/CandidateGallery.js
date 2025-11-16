import { motion } from "framer-motion";
import Image from "next/image";
import { Camera, Play, MessageCircle } from "lucide-react";

export default function CandidateGallery({ gallery, pageColor, onMediaClick }) {
  
  const isVideoFile = (url) => {
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
  };

  if (gallery.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-4 h-4" style={{ color: pageColor }} />
            Photo Gallery
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {gallery.length} items
          </span>
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-gray-100">
            <Camera className="w-6 h-6 opacity-50" />
          </div>
          <p className="text-sm">No gallery items yet</p>
          <p className="text-xs mt-1">Check back later for updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-4 h-4" style={{ color: pageColor }} />
          Photo Gallery
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {gallery.length} items
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        {gallery.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-500"
            onClick={() => onMediaClick(index)}
          >
            {isVideoFile(item.url || item) ? (
              <>
                <video
                  src={item.url || item}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" fill="white" />
                  </div>
                </div>
              </>
            ) : (
              <Image
                src={item.url || item}
                alt={`Gallery item ${index + 1}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                unoptimized
              />
            )}
            
            {/* Overlay with Caption Preview */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2">
              {item.caption && (
                <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs font-medium line-clamp-2">
                    {item.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Caption Icon Indicator */}
            {item.caption && (
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <MessageCircle className="w-3 h-3 text-white drop-shadow-lg" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}