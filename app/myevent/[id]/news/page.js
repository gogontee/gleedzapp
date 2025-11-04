"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Eye, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader"; // Import the header component

export default function EventNewsPage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventAndNews();
    }
  }, [eventId]);

  const fetchEventAndNews = async () => {
    try {
      setLoading(true);
      
      // Fetch event data including news JSONB column
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*, news")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      setEvent(eventData);
      
      // Parse news from JSONB column
      if (eventData.news && Array.isArray(eventData.news)) {
        // Sort news by published date (newest first)
        const sortedNews = eventData.news
          .filter(item => item.published_at) // Only items with publication dates
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        
        setNews(sortedNews);
      }
      
    } catch (error) {
      console.error("Error fetching event news:", error);
    } finally {
      setLoading(false);
    }
  };

  const openNewsModal = (newsItem) => {
    setSelectedNews(newsItem);
    setModalOpen(true);
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  };

  const closeNewsModal = () => {
    setModalOpen(false);
    setSelectedNews(null);
    document.body.style.overflow = "unset";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const shareNews = async (newsItem) => {
    const shareData = {
      title: newsItem.title,
      text: newsItem.content.substring(0, 100) + "...",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log("Sharing cancelled:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("News link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading news...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <Link href="/" className="text-gold-600 hover:text-gold-700 font-semibold">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Use EventHeader Component */}
      <EventHeader event={event} />

      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {/* Enhanced Page Header */}
        <motion.section 
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background with gradient */}
          <div 
            className="absolute inset-0 bg-gradient-to-r opacity-10"
            style={{ 
              background: `linear-gradient(135deg, ${pageColor}20, ${pageColor}05)`
            }}
          />
          
          {/* Abstract shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
            <div 
              className="w-full h-full rounded-full blur-3xl"
              style={{ backgroundColor: pageColor }}
            />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <div className="text-center">
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Latest <span style={{ color: pageColor }}>News</span>
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Stay updated with the latest announcements, updates, and stories from {event.name}
              </motion.p>

              <motion.div
                className="flex items-center justify-center gap-4 text-sm text-gray-500"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{news.length} {news.length === 1 ? 'Article' : 'Articles'}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                <div>Updated regularly</div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          {news.length === 0 ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div 
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${pageColor}15` }}
              >
                <Calendar className="w-10 h-10" style={{ color: pageColor }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No News Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Check back later for the latest updates and announcements about this event.
              </p>
              <Link 
                href={`/myevent/${eventId}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: pageColor,
                  color: 'white'
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Event
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {news.map((newsItem, index) => (
                <motion.article
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 hover:scale-[1.02]"
                  onClick={() => openNewsModal(newsItem)}
                >
                  {/* News Image */}
                  <div className="relative h-48 overflow-hidden">
                    {newsItem.image ? (
                      <Image
                        src={newsItem.image}
                        alt={newsItem.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        unoptimized
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: `${pageColor}15` }}
                      >
                        <Calendar className="w-12 h-12" style={{ color: pageColor }} />
                      </div>
                    )}
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                    
                    {/* Published date */}
                    <div className="absolute top-4 left-4">
                      <div 
                        className="px-3 py-1 rounded-full text-white text-sm font-semibold shadow-lg"
                        style={{ backgroundColor: pageColor }}
                      >
                        {newsItem.published_at ? getTimeAgo(newsItem.published_at) : "Recent"}
                      </div>
                    </div>
                  </div>

                  {/* News Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 leading-tight group-hover:text-gold-700 transition-colors">
                      {newsItem.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {newsItem.content}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{newsItem.author || "Event Team"}</span>
                        </div>
                        
                        {newsItem.views !== undefined && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{newsItem.views}</span>
                          </div>
                        )}
                      </div>

                      {newsItem.published_at && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="hidden sm:inline">{formatDate(newsItem.published_at)}</span>
                          <span className="sm:hidden">{getTimeAgo(newsItem.published_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </main>

        {/* News Detail Modal */}
        <AnimatePresence>
          {modalOpen && selectedNews && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={closeNewsModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="relative h-64 md:h-80">
                  {selectedNews.image ? (
                    <Image
                      src={selectedNews.image}
                      alt={selectedNews.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${pageColor}15` }}
                    >
                      <Calendar className="w-16 h-16" style={{ color: pageColor }} />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      {selectedNews.title}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-4 text-white/90">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{selectedNews.author || "Event Team"}</span>
                      </div>
                      
                      {selectedNews.published_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(selectedNews.published_at)}</span>
                        </div>
                      )}
                      
                      {selectedNews.views !== undefined && (
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>{selectedNews.views} views</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={closeNewsModal}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 md:p-8 max-h-[calc(90vh-16rem)] overflow-y-auto">
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                      {selectedNews.content}
                    </div>
                  </div>

                  {/* Share buttons */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Share this news:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => shareNews(selectedNews)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}