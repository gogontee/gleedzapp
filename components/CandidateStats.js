import { motion } from "framer-motion";
import { Award, Vote, Gift, Eye } from "lucide-react";

export default function CandidateStats({ candidate, event, session, pageColor, onVoteClick, onGiftClick }) {
  
  // Check if current user is event owner
  const isEventOwner = session?.user?.id === event?.user_id;

  // Helper functions to check visibility
  const shouldShowVotes = () => candidate?.votes_toggle === true || isEventOwner;
  const shouldShowGifts = () => candidate?.gifts_toggle === true || isEventOwner;
  const shouldShowPoints = () => candidate?.points_toggle === true || isEventOwner;
  const shouldShowViews = () => candidate?.views_toggle === true || isEventOwner;

  // Format points to show 1 decimal place
  const formatPoints = (points) => {
    if (points === null || points === undefined) return '0';
    return Number(points).toFixed(1);
  };

  const StatItem = ({ icon: Icon, label, value, visible = true }) => (
    <div className={`flex flex-col items-center p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 ${!visible ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: pageColor }} />
        <span className="text-xs text-gray-700 font-medium">{label}</span>
      </div>
      <span className="font-bold text-gray-900 text-sm">{visible ? value : 'Hidden'}</span>
    </div>
  );

  return (
    <div className="relative bg-white rounded-2xl shadow-lg p-4 border border-gray-100 overflow-hidden">
      {/* Background Image with reduced opacity */}
      <div className="absolute inset-0 opacity-30">
        <img
          src="/gleedzbg2.jpg"
          alt="Stats background"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" style={{ color: pageColor }} />
          Candidate Stats
        </h3>
        
        {/* Mobile Grid Layout */}
        <div className="block md:hidden">
          <div className="grid grid-cols-2 gap-3">
            <StatItem 
              icon={Vote} 
              label="Votes" 
              value={candidate?.votes?.toLocaleString() || 0} 
              visible={shouldShowVotes()} 
            />
            <StatItem 
              icon={Gift} 
              label="Gifts" 
              value={candidate?.gifts?.toLocaleString() || 0} 
              visible={shouldShowGifts()} 
            />
            <StatItem 
              icon={Award} 
              label="Points" 
              value={formatPoints(candidate?.points)} 
              visible={shouldShowPoints()} 
            />
            <StatItem 
              icon={Eye} 
              label="Views" 
              value={candidate?.views?.toLocaleString() || 0} 
              visible={shouldShowViews()} 
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block space-y-3">
          {[
            { icon: Vote, label: "Total Votes", value: candidate?.votes?.toLocaleString() || 0, visible: shouldShowVotes() },
            { icon: Gift, label: "Gifts Received", value: candidate?.gifts?.toLocaleString() || 0, visible: shouldShowGifts() },
            { icon: Award, label: "Total Points", value: formatPoints(candidate?.points), visible: shouldShowPoints() },
            { icon: Eye, label: "Profile Views", value: candidate?.views?.toLocaleString() || 0, visible: shouldShowViews() },
          ].map((stat, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 ${!stat.visible ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <stat.icon className="w-4 h-4" style={{ color: pageColor }} />
                <span className="text-sm text-gray-700 font-medium">{stat.label}</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">
                {stat.visible ? stat.value : 'Hidden'}
              </span>
            </div>
          ))}
        </div>
        
        {/* Action Buttons - Smaller */}
        <div className="flex gap-2 mt-6">
          <motion.button 
            onClick={onVoteClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs"
            style={{ backgroundColor: pageColor }}
          >
            <Vote className="w-3 h-3" />
            Vote Now
          </motion.button>
          
          <motion.button 
            onClick={onGiftClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-2 font-semibold rounded-xl border transition-all duration-300 text-xs"
            style={{ borderColor: pageColor, color: pageColor, backgroundColor: `${pageColor}08` }}
          >
            <Gift className="w-3 h-3" />
            Send Gift
          </motion.button>
        </div>
      </div>
    </div>
  );
}