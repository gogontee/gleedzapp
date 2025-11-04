"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Send, Phone, Video, MoreVertical, Search, ArrowLeft, Users } from "lucide-react";

export default function PublisherChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log("Current user:", user.id);
          
          // Get publisher details
          const { data: publisher, error: pubError } = await supabase
            .from("publishers")
            .select("id, full_name, avatar_url")
            .eq("id", user.id)
            .single();

          if (pubError) {
            console.error("Error fetching publisher:", pubError);
            setCurrentUser(user); // Use basic user info if publisher not found
          } else {
            setCurrentUser({ ...user, ...publisher });
          }
        } else {
          setError("No user logged in");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error getting current user:", err);
        setError("Failed to load user data");
        setLoading(false);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch conversations for publisher
  useEffect(() => {
    if (!currentUser) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching conversations for user:", currentUser.id);

        // Get all messages where current user is either sender or receiver
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            created_at,
            read
          `)
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          setError("Failed to load conversations");
          setLoading(false);
          return;
        }

        console.log("Raw messages data:", messagesData);

        if (!messagesData || messagesData.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Get unique conversation partners
        const partnerIds = new Set();
        messagesData.forEach(message => {
          const partnerId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id;
          partnerIds.add(partnerId);
        });

        console.log("Partner IDs:", Array.from(partnerIds));

        // Fetch details for each conversation partner
        const conversationsData = [];
        
        for (const partnerId of partnerIds) {
          // Try to fetch as fan first
          let { data: fanData } = await supabase
            .from("fans")
            .select("id, full_name, avatar_url")
            .eq("id", partnerId)
            .single();

          if (fanData) {
            // Get last message with this partner
            const lastMessage = messagesData.find(msg => 
              (msg.sender_id === currentUser.id && msg.receiver_id === partnerId) ||
              (msg.sender_id === partnerId && msg.receiver_id === currentUser.id)
            );

            conversationsData.push({
              partnerId: fanData.id,
              partnerName: fanData.full_name || "Fan",
              partnerAvatar: fanData.avatar_url,
              lastMessage: lastMessage?.content || "No messages",
              lastMessageTime: lastMessage?.created_at || new Date().toISOString(),
              unreadCount: 0
            });
          } else {
            // Try to fetch as publisher if not a fan
            let { data: publisherData } = await supabase
              .from("publishers")
              .select("id, full_name, avatar_url")
              .eq("id", partnerId)
              .single();

            if (publisherData) {
              const lastMessage = messagesData.find(msg => 
                (msg.sender_id === currentUser.id && msg.receiver_id === partnerId) ||
                (msg.sender_id === partnerId && msg.receiver_id === currentUser.id)
              );

              conversationsData.push({
                partnerId: publisherData.id,
                partnerName: publisherData.full_name || "Publisher",
                partnerAvatar: publisherData.avatar_url,
                lastMessage: lastMessage?.content || "No messages",
                lastMessageTime: lastMessage?.created_at || new Date().toISOString(),
                unreadCount: 0
              });
            }
          }
        }

        console.log("Processed conversations:", conversationsData);
        setConversations(conversationsData);
        setLoading(false);

      } catch (err) {
        console.error("Error in fetchConversations:", err);
        setError("Failed to load conversations");
        setLoading(false);
      }
    };

    fetchConversations();

    // Set up real-time subscription
    const subscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchConversations(); // Refresh conversations
          if (selectedConversation) {
            fetchMessages(selectedConversation.partnerId);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser, selectedConversation]);

  // Fetch messages for selected conversation
  const fetchMessages = async (partnerId) => {
    if (!currentUser || !partnerId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      console.log("Fetched messages:", data);
      setMessages(data || []);

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(msg => 
          msg.receiver_id === currentUser.id && !msg.read
        );
        
        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(msg => msg.id);
          await supabase
            .from("messages")
            .update({ read: true })
            .in('id', messageIds);
        }
      }
    } catch (err) {
      console.error("Error in fetchMessages:", err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: selectedConversation.partnerId,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          read: false
        });

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      setNewMessage("");
      // Refresh messages for current conversation
      fetchMessages(selectedConversation.partnerId);
      
      // Update conversations list with new last message
      const updatedConversations = conversations.map(conv => 
        conv.partnerId === selectedConversation.partnerId 
          ? { 
              ...conv, 
              lastMessage: newMessage.trim(), 
              lastMessageTime: new Date().toISOString() 
            }
          : conv
      );
      setConversations(updatedConversations);
    } catch (err) {
      console.error("Error in sendMessage:", err);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Debug info
  console.log("Current state:", {
    loading,
    error,
    currentUser,
    conversationsCount: conversations.length,
    selectedConversation,
    messagesCount: messages.length
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <div className="text-gray-500">Loading chats...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <div className="mb-2">Error loading chats</div>
          <div className="text-sm text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 bg-green-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
            <div className="flex space-x-2">
              <button className="p-2 text-gray-600 hover:text-green-600">
                <Search size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:text-green-600">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <Users size={48} className="mb-4 text-gray-300" />
              <div className="text-center mb-2">No conversations yet</div>
              <div className="text-sm text-center text-gray-400">
                When fans message you about your events, conversations will appear here.
              </div>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.partnerId}
                onClick={() => {
                  setSelectedConversation(conversation);
                  fetchMessages(conversation.partnerId);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.partnerId === conversation.partnerId ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={conversation.partnerAvatar || "/default-avatar.png"}
                      alt={conversation.partnerName}
                      className="w-12 h-12 rounded-full object-cover bg-gray-200"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.partnerName}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(conversation.lastMessageTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-green-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 text-gray-600 hover:text-green-600"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedConversation.partnerAvatar || "/default-avatar.png"}
                      alt={selectedConversation.partnerName}
                      className="w-10 h-10 rounded-full object-cover bg-gray-200"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.partnerName}
                    </h3>
                    <p className="text-xs text-gray-600">Online</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-600 hover:text-green-600">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600">
                    <Video size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="mb-2">No messages yet</div>
                    <div className="text-sm">Start a conversation with {selectedConversation.partnerName}</div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.sender_id === currentUser?.id
                            ? 'bg-green-500 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 text-right ${
                            message.sender_id === currentUser?.id
                              ? 'text-green-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          // Empty state when no conversation is selected
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Messages</h3>
              <p className="text-gray-500 mb-4">Select a conversation to start chatting</p>
              <p className="text-sm text-gray-400">Chat with your fans and manage event communications</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}