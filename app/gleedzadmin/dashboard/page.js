// In your app/gleedzadmin/dashboard/page.js
'use client';
import { useState } from 'react';
import HeroManagerModal from '../../../components/HeroManagerModal';
import PosterManagerModal from '../../../components/PosterManagerModal';
import EventManagerModal from '../../../components/EventManagerModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('hero');
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <header className="bg-yellow-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Gleedz Admin Panel</h1>
            <nav className="flex space-x-1">
              {['hero', 'events', 'users', 'posters'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-yellow-600 text-white'
                      : 'text-yellow-200 hover:bg-yellow-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'hero' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">
              Content Management
            </h2>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsHeroModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Manage Hero Sections
              </button>
              <button
                onClick={() => setIsPosterModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Manage Posters
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">
              Events Management
            </h2>
            <p className="text-yellow-600 mb-6">
              View all events, update launch status, and manage event listings
            </p>
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Manage Events
            </button>
          </div>
        )}
        
        {activeTab === 'users' && <div>Users Management - Coming Soon</div>}
        {activeTab === 'posters' && <div>Posters Management - Coming Soon</div>}
      </main>

      {/* Modals */}
      <HeroManagerModal 
        isOpen={isHeroModalOpen} 
        onClose={() => setIsHeroModalOpen(false)} 
      />
      <PosterManagerModal 
        isOpen={isPosterModalOpen} 
        onClose={() => setIsPosterModalOpen(false)} 
      />
      <EventManagerModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
      />
    </div>
  );
}