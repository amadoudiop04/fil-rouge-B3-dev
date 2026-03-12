import React from 'react';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { id: 'home', icon: '🏠', label: 'Accueil' },
    { id: 'stats', icon: '📊', label: 'Stats' },
     { id: 'tournaments', icon: '🎲', label: 'Tournois' },
    { id: 'shop', icon: '🛍️', label: 'Shop' },
   
    { id: 'profile', icon: '👤', label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1b2e] border-t border-gray-800 px-2 py-3 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-1 transition ${
              currentPage === item.id
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </nav>
  );
};
