"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ToggleLeft, ToggleRight, Save, RotateCcw } from "lucide-react";

export default function EditNavigation({ event }) {
  const [navVisibility, setNavVisibility] = useState({
    schedule: true,
    candidates: true,
    award: true,
    gallery: true,
    news: true,
    contact: true,
    about: true,
    ticket: true,
    register: true
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (event?.nav_visibility) {
      setNavVisibility(event.nav_visibility);
    }
  }, [event]);

  const navigationItems = [
    { 
      name: "Schedule", 
      key: "schedule", 
      description: "Event schedule and timeline"
    },
    { 
      name: "Candidates", 
      key: "candidates", 
      description: "Contestants and voting section"
    },
    { 
      name: "Award", 
      key: "award", 
      description: "Awards and nominations section"
    },
    { 
      name: "Gallery", 
      key: "gallery", 
      description: "Event photos and videos"
    },
    { 
      name: "News", 
      key: "news", 
      description: "Latest updates and announcements"
    },
    { 
      name: "About", 
      key: "about", 
      description: "Event information and details"
    },
    { 
      name: "Contact", 
      key: "contact", 
      description: "Contact information and location"
    },
    { 
      name: "Tickets", 
      key: "ticket", 
      description: "Ticket purchase section"
    },
    { 
      name: "Register", 
      key: "register", 
      description: "Event registration section"
    }
  ];

  const handleToggle = (navKey) => {
    setNavVisibility(prev => ({
      ...prev,
      [navKey]: !prev[navKey]
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!event) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ nav_visibility: navVisibility })
        .eq('id', event.id);

      if (error) {
        throw error;
      }

      setHasChanges(false);
      showCustomAlert("Success", "Navigation visibility updated successfully!", "success");
    } catch (error) {
      console.error('Error updating nav visibility:', error);
      showCustomAlert("Error", "Failed to update navigation visibility.", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    const defaultVisibility = {
      schedule: true,
      candidates: true,
      award: true,
      gallery: true,
      news: true,
      contact: true,
      about: true,
      ticket: true,
      register: true
    };
    setNavVisibility(defaultVisibility);
    setHasChanges(true);
  };

  const showCustomAlert = (title, message, type) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 max-w-sm transform transition-transform duration-300 ${
      type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
      type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
      type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
      'bg-blue-50 border-blue-500 text-blue-800'
    }`;
    
    alertDiv.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">${title}</h3>
          <p class="text-sm mt-1">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Navigation Settings</h3>
          <p className="text-sm text-gray-600">Toggle navigation items on/off for your event</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navigationItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`p-2 rounded-full transition-colors ${
                navVisibility[item.key] 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={navVisibility[item.key] ? "Turn off" : "Turn on"}
            >
              {navVisibility[item.key] ? (
                <ToggleRight className="w-6 h-6" />
              ) : (
                <ToggleLeft className="w-6 h-6" />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">How it works</h4>
            <p className="text-sm text-blue-700 mt-1">
              Toggle items on/off to control which navigation links appear in your event header. 
              Changes will be visible to all visitors. Home page is always visible and cannot be disabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}