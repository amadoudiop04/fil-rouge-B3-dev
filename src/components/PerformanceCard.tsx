import React from 'react';
import { motion } from 'framer-motion';

interface PerformanceCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  icon: string;
  index: number;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  index,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#111927] rounded-xl p-4 border border-gray-800 hover:border-blue-500 transition cursor-pointer flex flex-col items-center text-center"
    >
      {index === 0 && (
        <div className="w-12 h-12 bg-yellow-500 rounded-lg mb-2 flex items-center justify-center text-xl font-bold text-black">
          {icon}
        </div>
      )}
      <p className="text-lg font-bold">{title}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
      {value && (
        <div className="mt-3 flex items-baseline gap-2 mb-3">
          <p className="text-2xl font-bold">{value}</p>
          {trend && <p className={`text-xs font-semibold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{trend}</p>}
        </div>
      )}
      {/* Progress Bar - Only for K/D Ratio */}
      {title === 'K/D Ratio' && (
        <div className="w-full bg-gray-700/40 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(parseFloat(value) * 50, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
};
