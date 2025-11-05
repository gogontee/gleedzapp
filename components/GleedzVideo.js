"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function GleedzVideo() {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const playlists = {
    "Learn More": [
      { id: 1, title: "Intro to Gleedz", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: 2, title: "How it Works", url: "https://www.youtube.com/embed/3JZ_D3ELwOQ" },
    ],
    "Events": [
      { id: 3, title: "Event Highlights", url: "https://www.youtube.com/embed/tgbNymZ7vqY" },
      { id: 4, title: "Behind the Scenes", url: "https://www.youtube.com/embed/2Vv-BfVoq4g" },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {Object.keys(playlists).map((playlistName) => (
        <div key={playlistName} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{playlistName} Playlist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists[playlistName].map((video) => (
              <div
                key={video.id}
                className="cursor-pointer group relative overflow-hidden rounded-lg shadow-lg"
                onClick={() => setSelectedVideo(video.url)}
              >
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  {/* Placeholder thumbnail, you can replace with actual thumbnails */}
                  <span className="text-gray-500 group-hover:text-gray-700">{video.title}</span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative w-full max-w-3xl bg-black rounded-lg">
            <button
              className="absolute top-2 right-2 text-white p-2"
              onClick={() => setSelectedVideo(null)}
            >
              <X size={24} />
            </button>
            <div className="aspect-video">
              <iframe
                src={selectedVideo}
                title="Video Player"
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
