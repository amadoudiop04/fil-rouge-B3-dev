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

const sp = { type: 'spring' as const, stiffness: 400, damping: 28 };

export const ProductCard: React.FC<ProductCardProps> = ({ name, price, discount, image, index, onBuyProduct }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.055, type: 'spring', stiffness: 360, damping: 28 }}
    className="card card-hover overflow-hidden"
  >
    <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: 'var(--raised)' }}>
      {discount && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
          style={{ background: 'var(--red)' }}>
          {discount}
        </span>
      )}
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-4xl opacity-20">📦</span>
        </div>
      )}
    </div>
    <div className="p-3.5">
      <p className="truncate text-[14px] font-semibold">{name}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[16px] font-bold" style={{ color: 'var(--violet2)' }}>{price}</span>
        <motion.button
          whileTap={{ scale: 0.92 }} transition={sp}
          onClick={() => onBuyProduct?.({ name, price, discount, image })}
          className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white"
          style={{ background: 'var(--violet)' }}
        >
          Acheter
        </motion.button>
      </div>
    </div>
  </motion.div>
);
