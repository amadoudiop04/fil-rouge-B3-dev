import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const HeroSection: React.FC = () => {
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleWatchNow = () => {
    setShowVideoModal(true);
  };

  const handleCloseModal = () => {
    setShowVideoModal(false);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mt-4 bg-[url('https://i.redd.it/champions-seoul-transition-screens-for-desktop-wallpapers-v0-g3rj3fbqdfod1.jpg?width=4096&format=pjpg&auto=webp&s=c37f06a38ee0f21cda9107cebbd6d54128fbb1bb')] bg-cover bg-center rounded-2xl p-6 border border-gray-800"
      >
        <div className="flex items-start justify-between mb-3">
          <span className="inline-block">
            <span className="inline-flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-xs bg-red-500 bg-opacity-30 rounded-full text-white-500 font-semibold px-3 py-1">EN DIRECT</span>
            </span>
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1">
          VALORANT CHAMPIONS
          <br />
          TOUR
        </h1>
        <p className="text-sm text-gray-400 mb-4">GrandsFinals - Finale vs LOUD</p>
        <button 
          onClick={handleWatchNow}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
        >
          ● Regarder Maintenant
        </button>
      </motion.section>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-[90%] max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border-2 border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full text-white font-bold text-xl transition"
              >
                ✕
              </button>

              {/* YouTube Video */}
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube-nocookie.com/embed/kX3nB4PpJko?autoplay=1"
                title="VALORANT Champions Tour"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
