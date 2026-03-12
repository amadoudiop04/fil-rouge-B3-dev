import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompetitionCardProps {
  date: string;
  time: string;
  title: string;
  description: string;
  prize: string;
  tag: string;
  index: number;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  date,
  time,
  title,
  description,
  prize,
  tag,
  index,
}) => {
  const [showNotification, setShowNotification] = useState(false);

  const handleRegister = () => {
    setShowNotification(true);
    // Cachier la notification après 3 secondes
    setTimeout(() => setShowNotification(false), 3000);
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(59, 130, 246, 0.2)' }}
        className="flex-shrink-0 w-80 bg-[#111927] rounded-xl border border-gray-700 hover:border-blue-500 transition overflow-hidden cursor-pointer group relative"
      >
      {/* Card Header with Date and Time Side by Side */}
      <div className="from-black-600/20 to-purple-600/20 p-4 group-hover:from-blue-600/30 group-hover:to-purple-600/30 transition">
        <div className="flex items-start justify-between mb-3">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold ${
              index === 0
                ? 'bg-red-600/80 text-white'
                : 'bg-blue-600/80 text-white'
            }`}
          >
            {tag}
          </span>
          <div className="flex gap-2">
            <span className="text-xs bg-gray-700/50 px-3 py-1 rounded-full text-gray-300">
              {date}
            </span>
            <span className="text-xs bg-gray-700/50 px-3 py-1 rounded-full text-gray-300">
              {time}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base mb-1 group-hover:text-blue-400 transition">
            {title}
          </h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>

        {/* Prize Preview */}
        <div className="bg-[#0d1b2e]/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">💰 Cagnotte</span>
            <span className="text-sm font-bold text-blue-400">{prize}</span>
          </div>
        </div>

        {/* Register Button */}
        <button 
          onClick={handleRegister}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold transition transform hover:scale-105"
        >
          S'INSCRIRE
        </button>
      </div>
    </motion.div>

    {/* Notification Toast */}
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-orange-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border border-orange-500">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Inscription pas encore ouvert</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
