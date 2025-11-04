// components/PublisherChat.js
"use client";

import { useState } from "react";

export default function PublisherChat() {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: "Admin",
      lastMessage: "Welcome to Gleedz Publisher Chat!",
      time: "10:30 AM",
      unread: 2,
    },
    {
      id: 2,
      name: "Support",
      lastMessage: "Your event has been approved ✅",
      time: "Yesterday",
      unread: 0,
    },
    {
      id: 3,
      name: "User123",
      lastMessage: "Thanks for creating this event!",
      time: "Mon",
      unread: 5,
    },
  ]);

  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-[400px] flex flex-col">
      {!activeChat ? (
        <>
          <h3 className="font-semibold mb-3">Messages</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium">{chat.name}</p>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">
                    {chat.lastMessage}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{chat.time}</p>
                  {chat.unread > 0 && (
                    <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <ChatWindow chat={activeChat} onBack={() => setActiveChat(null)} />
      )}
    </div>
  );
}

// Separate chat window component
function ChatWindow({ chat, onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: "them", text: "Hey 👋" },
    { id: 2, sender: "you", text: "Hello there!" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "you", text: input }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-sm text-orange-600">
          ← Back
        </button>
        <h3 className="font-semibold">{chat.name}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg max-w-[75%] ${
              msg.sender === "you"
                ? "ml-auto bg-orange-100 text-black"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={handleSend}
          className="bg-orange-600 text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
