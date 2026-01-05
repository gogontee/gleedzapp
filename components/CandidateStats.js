import { motion } from "framer-motion";
import { Award, Vote, Gift, Eye } from "lucide-react";

export default function CandidateStats({ candidate, event, session, pageColor, onVoteClick, onGiftClick }) {
  
  // Helper functions to check visibility - only show if toggle is TRUE
  const shouldShowVotes = () => candidate?.votes_toggle === true;
  const shouldShowGifts = () => candidate?.gifts_toggle === true;
  const shouldShowPoints = () => candidate?.points_toggle === true;
  const shouldShowViews = () => candidate?.views_toggle === true;

  // Format points to show 1 decimal place
  const formatPoints = (points) => {
    if (points === null || points === undefined) return '0';
    return Number(points).toFixed(1);
  };

  // Calculate points if needed
  const totalVotes = candidate?.votes || 0;
  const totalGifts = candidate?.gifts || 0;
  const points = candidate?.points || (totalVotes + totalGifts) / 10;

  // Create array of visible stats
  const visibleStats = [];

  // Only add votes if toggle is TRUE
  if (shouldShowVotes()) {
    visibleStats.push({
      id: 'votes',
      icon: Vote,
      label: "Total Votes",
      value: totalVotes.toLocaleString(),
      mobileLabel: "Votes"
    });
  }

  // Only add gifts if toggle is TRUE
  if (shouldShowGifts()) {
    visibleStats.push({
      id: 'gifts',
      icon: Gift,
      label: "Gifts Received",
      value: totalGifts.toLocaleString(),
      mobileLabel: "Gifts"
    });
  }

  // Only add points if toggle is TRUE
  if (shouldShowPoints()) {
    visibleStats.push({
      id: 'points',
      icon: Award,
      label: "Total Points",
      value: formatPoints(points),
      mobileLabel: "Points"
    });
  }

  // Only add views if toggle is TRUE
  if (shouldShowViews()) {
    visibleStats.push({
      id: 'views',
      icon: Eye,
      label: "Profile Views",
      value: candidate?.views?.toLocaleString() || 0,
      mobileLabel: "Views"
    });
  }

  // Determine grid columns based on number of visible stats
  const getGridColsClass = () => {
    if (visibleStats.length === 0) return 'grid-cols-1';
    if (visibleStats.length === 1) return 'grid-cols-1';
    if (visibleStats.length === 2) return 'grid-cols-2';
    if (visibleStats.length === 3) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const StatItem = ({ icon: Icon, label, value, mobileLabel }) => (
    <div className="flex flex-col items-center p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: pageColor }} />
        <span className="text-xs text-gray-700 font-medium md:hidden">{mobileLabel}</span>
        <span className="text-xs text-gray-700 font-medium hidden md:inline">{label}</span>
      </div>
      <span className="font-bold text-gray-900 text-sm">{value}</span>
    </div>
  );

  const DesktopStatItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: pageColor }} />
        <span className="text-sm text-gray-700 font-medium">{label}</span>
      </div>
      <span className="font-bold text-gray-900 text-sm">
        {value}
      </span>
    </div>
  );

  return (
    <div className="relative bg-white rounded-2xl shadow-lg p-4 border border-gray-100 overflow-hidden">
      {/* Background Image with reduced opacity */}
      <div className="absolute inset-0 opacity-85">
        <img
          src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/gleedzasset/gleedz055.jpg"
          alt="Stats background"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" style={{ color: pageColor }} />
          Candidate Result Stats
        </h3>
        
        {/* Show message if no stats are visible */}
        {visibleStats.length === 0 && (
          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 text-center">
            <p className="text-sm text-gray-700">Live result stats unlock soon.</p>
          </div>
        )}

        {/* Mobile Grid Layout */}
        {visibleStats.length > 0 && (
          <div className="block md:hidden">
            <div className={`grid ${getGridColsClass()} gap-3`}>
              {visibleStats.map((stat) => (
                <StatItem 
                  key={stat.id}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  mobileLabel={stat.mobileLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Desktop Layout */}
        {visibleStats.length > 0 && (
          <div className="hidden md:block space-y-3">
            {visibleStats.map((stat) => (
              <DesktopStatItem 
                key={stat.id}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <motion.button 
            onClick={onVoteClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs"
            style={{ backgroundColor: '#10B981' }} // Green color for vote button
          >
            <Vote className="w-3 h-3" />
            Vote Now
          </motion.button>
          
          <motion.button 
            onClick={onGiftClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs"
            style={{ backgroundColor: '#F59E0B' }} // Yellow 500 color for gift button
          >
            <Gift className="w-3 h-3" />
            Send Gift
          </motion.button>
        </div>
      </div>
    </div>
  );
}