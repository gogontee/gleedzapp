"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  User, 
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Filter,
  Grid3X3,
  List,
  ExternalLink,
  Download,
  Eye,
  Trophy,
  Gift,
  Vote,
  Lock,
  Globe
} from "lucide-react";

// Helper functions - moved outside the main component
const getStatusColor = (registration) => {
  const now = new Date();
  const submittedDate = new Date(registration.submitted_at);
  const isRecent = (now - submittedDate) < (24 * 60 * 60 * 1000);
  
  if (isRecent) return "bg-green-100 text-green-800";
  return "bg-blue-100 text-blue-800";
};

const getStatusText = (registration) => {
  const now = new Date();
  const submittedDate = new Date(registration.submitted_at);
  const isRecent = (now - submittedDate) < (24 * 60 * 60 * 1000);
  
  if (isRecent) return "Recently Submitted";
  return "Submitted";
};

export default function RegistrationBucket({ fanId }) {
  const [registrations, setRegistrations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("registrations"); // New state for tabs

  useEffect(() => {
    fetchData();
  }, [fanId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both registrations and candidates in parallel
      await Promise.all([
        fetchRegistrations(),
        fetchCandidates()
      ]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      // Fetch form submissions for the user
      const { data: submissions, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('user_id', fanId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      if (!submissions || submissions.length === 0) {
        setRegistrations([]);
        return;
      }

      // Fetch form details for each submission
      const registrationsWithDetails = await Promise.all(
        submissions.map(async (submission) => {
          // Get form details
          const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', submission.form_id)
            .single();

          if (formError) {
            console.error('Error fetching form:', formError);
            return {
              ...submission,
              form: null,
              event: null
            };
          }

          // Get event details using form's event_id
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('name, logo, page_color')
            .eq('id', formData.event_id)
            .single();

          if (eventError) {
            console.error('Error fetching event:', eventError);
          }

          return {
            ...submission,
            form: formData,
            event: eventData || null
          };
        })
      );

      setRegistrations(registrationsWithDetails);
      
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    }
  };

  const fetchCandidates = async () => {
    try {
      // Fetch candidates for the user
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', fanId)
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      if (!candidatesData || candidatesData.length === 0) {
        setCandidates([]);
        return;
      }

      // Fetch event details for each candidate
      const candidatesWithDetails = await Promise.all(
        candidatesData.map(async (candidate) => {
          // Get event details using candidate's event_id
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('name, logo, page_color')
            .eq('id', candidate.event_id)
            .single();

          if (eventError) {
            console.error('Error fetching event for candidate:', eventError);
          }

          return {
            ...candidate,
            event: eventData || null
          };
        })
      );

      setCandidates(candidatesWithDetails);
      
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    }
  };

  const filteredRegistrations = registrations.filter(registration => {
    const eventName = registration.event?.name || '';
    const formTitle = registration.form?.title || '';
    
    const matchesSearch = 
      eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const submittedDate = new Date(registration.submitted_at);
    const isRecent = (now - submittedDate) < (24 * 60 * 60 * 1000); // Within 24 hours
    
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "recent" && isRecent) ||
      (filterStatus === "paid" && registration.form?.is_paid) ||
      (filterStatus === "free" && !registration.form?.is_paid);

    return matchesSearch && matchesFilter;
  });

  const filteredCandidates = candidates.filter(candidate => {
    const eventName = candidate.event?.name || '';
    const nickName = candidate.nick_name || '';
    
    const matchesSearch = 
      eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nickName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "public" && candidate.approved) ||
      (filterStatus === "private" && !candidate.approved);

    return matchesSearch && matchesFilter;
  });

  const downloadConfirmation = (registration) => {
    const confirmationWindow = window.open('', '_blank');
    confirmationWindow.document.write(`
      <html>
        <head>
          <title>Registration Confirmation - ${registration.form?.title || 'Unknown Form'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; }
            .confirmation { border: 2px solid #4F46E5; padding: 25px; border-radius: 12px; background: white; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4F46E5; padding-bottom: 15px; }
            .details { margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px; background: #f8fafc; border-radius: 6px; }
            .status { text-align: center; margin: 20px 0; padding: 10px; background: #10B981; color: white; border-radius: 6px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="confirmation">
            <div class="header">
              <h1>Registration Confirmation</h1>
              <h2>${registration.form?.title || 'Unknown Form'}</h2>
              <h3>${registration.event?.name || 'Unknown Event'}</h3>
            </div>
            <div class="details">
              <div class="detail-row">
                <strong>Submission ID:</strong> <span>${registration.id}</span>
              </div>
                <div class="detail-row">
                <strong>Form Type:</strong> <span>${registration.form?.is_paid ? 'Paid Registration' : 'Free Registration'}</span>
              </div>
              ${registration.form?.is_paid ? `
                <div class="detail-row">
                  <strong>Fee Paid:</strong> <span>${registration.form?.token_amount || 0} tokens</span>
                </div>
              ` : ''}
              <div class="detail-row">
                <strong>Submitted:</strong> <span>${new Date(registration.submitted_at).toLocaleString()}</span>
              </div>
            </div>
            <div class="status">
              ✓ Registration Confirmed
            </div>
            <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
              Keep this confirmation for your records.
            </p>
          </div>
        </body>
      </html>
    `);
    confirmationWindow.document.close();
  };

  const openCandidatePage = (candidate) => {
    window.open(`/myevent/${candidate.event_id}/candidate/${candidate.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Participation</h2>
            <p className="text-gray-600">Your registrations and candidacies</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl h-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalItems = registrations.length + candidates.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Participation</h2>
          <p className="text-gray-600">
            {totalItems} item{totalItems !== 1 ? 's' : ''} total
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("registrations")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "registrations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "candidates"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Candidacies ({candidates.length})
          </button>
        </nav>
      </div>

      {/* Search and Filter */}
      {(registrations.length > 0 || candidates.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={
                activeTab === "registrations" 
                  ? "Search registrations..." 
                  : "Search candidacies..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {activeTab === "registrations" ? (
                <>
                  <option value="all">All Registrations</option>
                  <option value="recent">Recent</option>
                  <option value="paid">Paid</option>
                  <option value="free">Free</option>
                </>
              ) : (
                <>
                  <option value="all">All Candidacies</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === "registrations" ? (
        <RegistrationsContent 
          registrations={filteredRegistrations}
          viewMode={viewMode}
          onDownload={downloadConfirmation}
          searchTerm={searchTerm}
        />
      ) : (
        <CandidatesContent 
          candidates={filteredCandidates}
          viewMode={viewMode}
          onViewCandidate={openCandidatePage}
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
}

// Registrations Content Component
function RegistrationsContent({ registrations, viewMode, onDownload, searchTerm }) {
  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {searchTerm ? "No Registrations Found" : "No Registrations Yet"}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {searchTerm 
            ? "Try adjusting your search or filter to find what you're looking for."
            : "You haven't registered for any events yet. Start exploring events and submit your registrations!"
          }
        </p>
      </div>
    );
  }

  return viewMode === "grid" ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {registrations.map((registration, index) => (
          <RegistrationCard 
            key={registration.id}
            registration={registration}
            index={index}
            onDownload={onDownload}
          />
        ))}
      </AnimatePresence>
    </div>
  ) : (
    <div className="space-y-4">
      <AnimatePresence>
        {registrations.map((registration, index) => (
          <RegistrationListItem 
            key={registration.id}
            registration={registration}
            index={index}
            onDownload={onDownload}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Candidates Content Component
function CandidatesContent({ candidates, viewMode, onViewCandidate, searchTerm }) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {searchTerm ? "No Candidacies Found" : "No Candidacies Yet"}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {searchTerm 
            ? "Try adjusting your search or filter to find what you're looking for."
            : "You haven't entered any contests yet. Start exploring events and join competitions!"
          }
        </p>
      </div>
    );
  }

  return viewMode === "grid" ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {candidates.map((candidate, index) => (
          <CandidateCard 
            key={candidate.id}
            candidate={candidate}
            index={index}
            onViewCandidate={onViewCandidate}
          />
        ))}
      </AnimatePresence>
    </div>
  ) : (
    <div className="space-y-4">
      <AnimatePresence>
        {candidates.map((candidate, index) => (
          <CandidateListItem 
            key={candidate.id}
            candidate={candidate}
            index={index}
            onViewCandidate={onViewCandidate}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Registration Card Component (Grid View) - unchanged from your original
function RegistrationCard({ registration, index, onDownload }) {
  const pageColor = registration.event?.page_color || "#4F46E5";
  const eventName = registration.event?.name || 'Unknown Event';
  const formTitle = registration.form?.title || 'Unknown Form';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Header with Event Logo and Status */}
      <div 
        className="h-4 w-full"
        style={{ backgroundColor: pageColor }}
      />
      
      <div className="p-5">
        {/* Submission ID */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 font-mono">#{registration.id.slice(-8)}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration)}`}>
            {getStatusText(registration)}
          </span>
        </div>

        {/* Event Logo and Name */}
        <div className="flex items-center gap-3 mb-4">
          {registration.event?.logo ? (
            <div className="w-12 h-12 rounded-full bg-gray-100 p-1 flex-shrink-0">
              <img
                src={registration.event.logo}
                alt={eventName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          ) : (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: pageColor }}
            >
              <Calendar className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
              {eventName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Event Registration
            </p>
          </div>
        </div>

        {/* Form Title */}
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
            {formTitle}
          </h4>
        </div>

        {/* Fee Information */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {registration.form?.is_paid ? (
              <>
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Form Fee:</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Form Fee:</span>
              </>
            )}
          </div>
          <span className={`text-sm font-bold ${registration.form?.is_paid ? 'text-green-600' : 'text-green-600'}`}>
            {registration.form?.is_paid ? `${registration.form?.token_amount || 0} tokens` : 'FREE'}
          </span>
        </div>

        {/* Submission Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Clock className="w-4 h-4" />
          <span>Submitted: {new Date(registration.submitted_at).toLocaleDateString()}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onDownload(registration)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button className="p-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Registration List Item Component - unchanged from your original
function RegistrationListItem({ registration, index, onDownload }) {
  const pageColor = registration.event?.page_color || "#4F46E5";
  const eventName = registration.event?.name || 'Unknown Event';
  const formTitle = registration.form?.title || 'Unknown Form';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex">
        {/* Event Logo */}
        <div className="w-20 flex-shrink-0 relative">
          <div 
            className="h-full w-2"
            style={{ backgroundColor: pageColor }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {registration.event?.logo ? (
              <div className="w-12 h-12 rounded-full bg-gray-100 p-1">
                <img
                  src={registration.event.logo}
                  alt={eventName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: pageColor }}
              >
                <Calendar className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900 text-lg">
                  {formTitle}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration)}`}>
                  {getStatusText(registration)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{eventName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span className="font-mono">#{registration.id.slice(-8)}</span>
                </div>
              </div>

              {/* Fee Information */}
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${registration.form?.is_paid ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {registration.form?.is_paid ? (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">Paid: {registration.form?.token_amount || 0} tokens</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Free Registration</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onDownload(registration)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Submission Date */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Submitted on {new Date(registration.submitted_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Candidate Card Component (Grid View)
function CandidateCard({ candidate, index, onViewCandidate }) {
  const pageColor = candidate.event?.page_color || "#4F46E5";
  const eventName = candidate.event?.name || 'Unknown Event';
  const displayName = candidate.nick_name || 'Candidate';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Banner Image */}
      {candidate.banner ? (
        <div className="h-32 w-full relative">
          <img
            src={candidate.banner}
            alt={`${displayName} banner`}
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0 opacity-20"
            style={{ backgroundColor: pageColor }}
          />
        </div>
      ) : (
        <div 
          className="h-32 w-full flex items-center justify-center relative"
          style={{ backgroundColor: pageColor }}
        >
          <Trophy className="w-12 h-12 text-white opacity-80" />
        </div>
      )}

      <div className="p-5">
        {/* Header with Event Logo and Status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-500 font-mono">
              {candidate.contest_number ? `Contest #${candidate.contest_number}` : 'Contest'}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            candidate.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {candidate.approved ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {candidate.approved ? 'Public' : 'Private'}
          </span>
        </div>

        {/* Event Logo and Name */}
        <div className="flex items-center gap-3 mb-4">
          {candidate.event?.logo ? (
            <div className="w-12 h-12 rounded-full bg-gray-100 p-1 flex-shrink-0">
              <img
                src={candidate.event.logo}
                alt={eventName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          ) : (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: pageColor }}
            >
              <Calendar className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
              {eventName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Contest Entry
            </p>
          </div>
        </div>

        {/* Candidate Name */}
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
            {displayName}
          </h4>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Vote className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-gray-900">{candidate.votes || 0}</div>
            <div className="text-xs text-gray-500">Votes</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Gift className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-gray-900">{candidate.gifts || 0}</div>
            <div className="text-xs text-gray-500">Gifts</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-gray-900">
              {new Date(candidate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-gray-500">Joined</div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onViewCandidate(candidate)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          View Candidate Page
        </button>
      </div>
    </motion.div>
  );
}

// Candidate List Item Component
function CandidateListItem({ candidate, index, onViewCandidate }) {
  const pageColor = candidate.event?.page_color || "#4F46E5";
  const eventName = candidate.event?.name || 'Unknown Event';
  const displayName = candidate.nick_name || 'Candidate';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex">
        {/* Banner/Logo Section */}
        <div className="w-24 flex-shrink-0 relative">
          {candidate.banner ? (
            <img
              src={candidate.banner}
              alt={`${displayName} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: pageColor }}
            >
              <Trophy className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            {candidate.event?.logo && (
              <div className="w-8 h-8 rounded-full bg-white p-1">
                <img
                  src={candidate.event.logo}
                  alt={eventName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900 text-lg">
                  {displayName}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  candidate.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {candidate.approved ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {candidate.approved ? 'Public' : 'Private'}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{eventName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span className="font-mono">
                    {candidate.contest_number ? `Contest #${candidate.contest_number}` : 'General Contest'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <Vote className="w-4 h-4" />
                  <span className="text-sm font-medium">{candidate.votes || 0} votes</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-medium">{candidate.gifts || 0} gifts</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onViewCandidate(candidate)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Joined on {new Date(candidate.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}