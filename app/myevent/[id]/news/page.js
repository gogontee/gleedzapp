"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Clock, ArrowLeft, Share2, Newspaper, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { supabase, safeQuery } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader";

export default function EventNewsPage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [news, setNews] = useState([]);
  const [featuredNews, setFeaturedNews] = useState(null);
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
      
      const { data: eventData, error } = await safeQuery(() =>
        supabase
          .from("events")
          .select("*, news")
          .eq("id", eventId)
          .single()
          .timeout(5000)
      );

      if (error) throw error;

      setEvent(eventData);
      
      if (eventData.news && Array.isArray(eventData.news)) {
        // Sort news by published date (newest first)
        const sortedNews = eventData.news
          .filter(item => item.published_at)
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        
        setNews(sortedNews);
        
        // Set first news as featured
        if (sortedNews.length > 0) {
          setFeaturedNews(sortedNews[0]);
        }
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
    document.body.style.overflow = "hidden";
  };

  const closeNewsModal = () => {
    setModalOpen(false);
    setSelectedNews(null);
    document.body.style.overflow = "unset";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
      return diffInDays === 1 ? "Yesterday" : `${diffInDays}d ago`;
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
      navigator.clipboard.writeText(window.location.href);
      alert("News link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gold-200 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-gold-500 rounded-full animate-ping"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading news updates...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
            <Newspaper className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <EventHeader event={event} />

      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-5"
            style={{ 
              background: `linear-gradient(135deg, ${pageColor}30 0%, transparent 50%, ${pageColor}10 100%)`
            }}
          />
          
          <div className="absolute -top-40 -right-40 w-80 h-80 opacity-10">
            <div 
              className="w-full h-full rounded-full blur-3xl"
              style={{ backgroundColor: pageColor }}
            />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
                <Sparkles className="w-4 h-4" style={{ color: pageColor }} />
                <span className="text-sm font-medium" style={{ color: pageColor }}>
                  Latest Updates
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Event <span style={{ color: pageColor }}>News</span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Stay informed with official announcements, behind-the-scenes stories, and important updates
              </p>

              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium">{news.length} Articles</span>
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-2 text-gray-500">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Regular Updates</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
          {news.length === 0 ? (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div 
                className="w-32 h-32 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${pageColor}15, ${pageColor}05)`,
                  border: `2px dashed ${pageColor}30`
                }}
              >
                <Newspaper className="w-16 h-16" style={{ color: pageColor }} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">No Updates Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8 text-lg">
                Official news and updates will appear here. Check back soon for announcements!
              </p>
              <Link 
                href={`/myevent/${eventId}`}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:scale-105 group"
                style={{ 
                  background: `linear-gradient(135deg, ${pageColor}, ${pageColor}CC)`,
                  color: 'white'
                }}
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Event Page
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Featured News (Large Card) */}
              {featuredNews && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-16"
                >
                  <div className="relative group cursor-pointer" onClick={() => openNewsModal(featuredNews)}>
                    <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                    
                    <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                      <div className="grid md:grid-cols-2">
                        {/* Image Section */}
                        <div className="relative h-64 md:h-auto">
                          {featuredNews.image ? (
                            <Image
                              src={featuredNews.image}
                              alt={featuredNews.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                              unoptimized
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{ 
                                background: `linear-gradient(135deg, ${pageColor}20, ${pageColor}10)`
                              }}
                            >
                              <Newspaper className="w-20 h-20" style={{ color: pageColor }} />
                            </div>
                          )}
                          
                          <div className="absolute top-4 left-4">
                            <div 
                              className="px-4 py-2 rounded-full text-white font-semibold shadow-lg flex items-center gap-2"
                              style={{ backgroundColor: pageColor }}
                            >
                              <Sparkles className="w-4 h-4" />
                              Featured
                            </div>
                          </div>
                          
                          <div className="absolute bottom-4 left-4">
                            <div className="flex items-center gap-2 text-white/90">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {formatDate(featuredNews.published_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-8 md:p-10 flex flex-col justify-center">
                          <div className="mb-4">
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                              style={{ 
                                backgroundColor: `${pageColor}15`,
                                color: pageColor
                              }}
                            >
                              Latest Update
                            </span>
                          </div>
                          
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-gold-700 transition-colors">
                            {featuredNews.title}
                          </h2>
                          
                          <p className="text-gray-600 mb-6 line-clamp-3">
                            {featuredNews.content}
                          </p>

                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-3">
                              {featuredNews.author && (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <span className="text-sm font-medium">{featuredNews.author}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center text-gray-500 group-hover:text-gold-600 transition-colors">
                              <span className="text-sm font-medium">Read More</span>
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* All News Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {news.slice(1).map((newsItem, index) => (
                  <motion.article
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="group cursor-pointer"
                    onClick={() => openNewsModal(newsItem)}
                  >
                    <div className="h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:translate-y-[-4px]">
                      {/* Image */}
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
                            style={{ 
                              background: `linear-gradient(135deg, ${pageColor}15, ${pageColor}05)`
                            }}
                          >
                            <Newspaper className="w-12 h-12" style={{ color: pageColor }} />
                          </div>
                        )}
                        
                        {/* Time badge */}
                        <div className="absolute top-4 right-4">
                          <div 
                            className="px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-md backdrop-blur-sm"
                            style={{ backgroundColor: `${pageColor}CC` }}
                          >
                            {getTimeAgo(newsItem.published_at)}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {formatDate(newsItem.published_at)}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 leading-tight group-hover:text-gold-700 transition-colors">
                          {newsItem.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                          {newsItem.content}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          {newsItem.author ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-400" />
                              </div>
                              <span className="text-sm">{newsItem.author}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">Event Team</div>
                          )}
                          
                          <div className="flex items-center text-gray-400 group-hover:text-gold-600 transition-colors">
                            <span className="text-sm">Read</span>
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {/* CTA Section */}
              <motion.div 
                className="mt-16 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="inline-block px-6 py-4 rounded-2xl bg-white shadow-lg border border-gray-100">
                  <p className="text-gray-600">
                    Want to stay updated?{" "}
                    <Link 
                      href={`/myevent/${eventId}`}
                      className="font-semibold hover:underline"
                      style={{ color: pageColor }}
                    >
                      Visit the main event page
                    </Link>{" "}
                    for more details.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>

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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative h-72">
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
                    style={{ 
                      background: `linear-gradient(135deg, ${pageColor}20, ${pageColor}10)`
                    }}
                  >
                    <Newspaper className="w-20 h-20" style={{ color: pageColor }} />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute bottom-6 left-8 right-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: pageColor }}
                    >
                      News Update
                    </div>
                    <div className="text-white/80 text-sm">
                      {formatDate(selectedNews.published_at)}
                    </div>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {selectedNews.title}
                  </h2>
                  
                  {selectedNews.author && (
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{selectedNews.author}</span>
                    </div>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={closeNewsModal}
                  className="absolute top-6 right-6 p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 max-h-[calc(90vh-18rem)] overflow-y-auto">
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed text-lg">
                    {selectedNews.content}
                  </div>
                </div>

                {/* Share Section */}
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">
                      <span className="font-medium">Found this update helpful?</span>
                      <span className="text-gray-400 ml-2">Share with others</span>
                    </div>
                    <button
                      onClick={() => shareNews(selectedNews)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                      style={{ 
                        backgroundColor: `${pageColor}15`,
                        color: pageColor
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share Update
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}