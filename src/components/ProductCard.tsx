import React from 'react';
import { motion } from 'framer-motion';

export interface Product {
  name: string;
  price: string;
  discount?: string;
  image: string;
}

interface ProductCardProps {
  name: string;
  price: string;
  discount?: string;
  image: string;
  index: number;
  onBuyProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  discount,
  image,
  index,
  onBuyProduct,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="bg-[#111927] rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition cursor-pointer group"
    >
      <div className="relative overflow-hidden">
        {discount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold z-10">
            {discount}
          </span>
        )}
        <div className="h-50 bg-gradient-to-br from-blue-900 to-[#111927] flex items-center justify-center overflow-hidden group-hover:scale-110 transition duration-300">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-contain p-2"
            onError={(e) => {
              e.currentTarget.src =
                'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%232563eb%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';
            }}
          />
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold mb-1">{name}</p>
        <div className="flex items-center justify-between">
          <span className="text-blue-500 font-bold">{price}</span>
          <button 
            onClick={() => onBuyProduct?.({ name, price, discount, image })} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Acheter
          </button>
        </div>
      </div>
    </motion.div>
  );
};
