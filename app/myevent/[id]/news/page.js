"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Clock, ArrowLeft, Share2, BookOpen, Tag, ArrowRight, Home } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import EventHeader from "../../../../components/EventHeader";

export default function EventNewsPage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recommendedNews, setRecommendedNews] = useState([]);

  useEffect(() => {
    if (eventId) {
      fetchEventAndNews();
    }
  }, [eventId]);

  const fetchEventAndNews = async () => {
    try {
      setLoading(true);
      
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*, news")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      setEvent(eventData);
      
      if (eventData.news && Array.isArray(eventData.news)) {
        const sortedNews = eventData.news
          .filter(item => item.published_at)
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        
        setNews(sortedNews);
        
        // Set recommended news (excluding the first one)
        if (sortedNews.length > 1) {
          setRecommendedNews(sortedNews.slice(1, 4));
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
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "Recently";
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
    try {
      const shareData = {
        title: newsItem.title,
        text: newsItem.content?.substring(0, 100) + "...",
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.log("Sharing cancelled:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading updates...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Event Not Found</h1>
          <Link href="/" className="text-gold-600 hover:text-gold-700 text-sm font-medium">
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const pageColor = event?.page_color || "#D4AF37";

  return (
    <div className="min-h-screen bg-gray-50">
      <EventHeader event={event} />

      <div className="pt-14">
        {/* Header */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Event <span style={{ color: pageColor }}>Updates</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base mb-4 max-w-2xl mx-auto">
                Stay informed with the latest announcements from {event.name}
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {news.length} {news.length === 1 ? 'update' : 'updates'}
                </span>
                <span>•</span>
                <span>Official news only</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {news.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-gray-100">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">No Updates Yet</h3>
              <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
                Official news and announcements will appear here when available.
              </p>
              <Link 
                href={`/myevent/${eventId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
                style={{ 
                  backgroundColor: pageColor,
                  color: 'white'
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Event
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {news.map((newsItem, index) => (
                <motion.article
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
                  onClick={() => openNewsModal(newsItem)}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${pageColor}15`,
                              color: pageColor
                            }}
                          >
                            Update
                          </span>
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(newsItem.published_at)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-gold-700 transition-colors">
                          {newsItem.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {newsItem.content}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            {newsItem.author && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                <span>{newsItem.author}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(newsItem.published_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Image thumbnail */}
                      {newsItem.image && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={newsItem.image}
                            alt={newsItem.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </main>

        {/* News Detail Modal - Blog-like Design */}
        <AnimatePresence>
          {modalOpen && selectedNews && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-white"
              onClick={closeNewsModal}
            >
              {/* Mobile Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <button
                  onClick={closeNewsModal}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700">News Update</span>
                <button
                  onClick={() => shareNews(selectedNews)}
                  className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Blog Content */}
              <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${pageColor}15`,
                        color: pageColor
                      }}
                    >
                      Official Update
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(selectedNews.published_at)}
                    </span>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                    {selectedNews.title}
                  </h1>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {selectedNews.author && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span>{selectedNews.author}</span>
                      </div>
                    )}
                    
                    {selectedNews.published_at && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(selectedNews.published_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Image */}
                {selectedNews.image && (
                  <div className="mb-8 rounded-xl overflow-hidden">
                    <div className="relative h-64 md:h-80 w-full">
                      <Image
                        src={selectedNews.image}
                        alt={selectedNews.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <article className="prose prose-sm max-w-none mb-12">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed text-base">
                    {selectedNews.content}
                  </div>
                </article>

                {/* Tags/Categories */}
                {selectedNews.tags && selectedNews.tags.length > 0 && (
                  <div className="mb-10">
                    <div className="flex flex-wrap gap-2">
                      {selectedNews.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended News */}
                {recommendedNews.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">More Updates</h2>
                      <Link 
                        href={`/myevent/${eventId}/news`}
                        className="text-sm font-medium flex items-center gap-1"
                        style={{ color: pageColor }}
                      >
                        View all
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {recommendedNews.map((item, index) => (
                        <div 
                          key={index}
                          className="group cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                          onClick={() => {
                            setSelectedNews(item);
                            window.scrollTo(0, 0);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {item.image && (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-gold-700 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                                {item.content?.substring(0, 80)}...
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{getTimeAgo(item.published_at)}</span>
                                {item.author && (
                                  <>
                                    <span>•</span>
                                    <span>{item.author}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="sticky bottom-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-4 mt-8">
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/myevent/${eventId}`}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Event Home
                    </Link>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shareNews(selectedNews)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}