import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection } from '../components/StreamCard';
import { CompetitionCard } from '../components/CompetitionCard';
import { PerformanceCard } from '../components/PerformanceCard';
import { ProductCard, Product } from '../components/ProductCard';
import { platformApi } from '../services/platformApi';

export const HomePage: React.FC<{ onNavigate?: (page: string) => void; onBuyProduct?: (product: Product) => void }> = ({ onNavigate, onBuyProduct }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async (attempt = 0) => {
      try {
        const response = await platformApi.getProducts();

        if (!response.success || !response.products || !isMounted) {
          return;
        }

        const mappedProducts: Product[] = response.products.map((product) => ({
          name: product.name,
          price: `€${Number(product.price).toFixed(2)}`,
          image: product.image_url,
        }));

        setProducts(mappedProducts);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (attempt < 1 && message.includes("No handler registered for 'products:getProducts'")) {
          setTimeout(() => {
            if (isMounted) {
              void loadProducts(attempt + 1);
            }
          }, 400);
          return;
        }
        console.error('Erreur lors du chargement des produits:', error);
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  const competitions = [
    {
      id: 1,
      date: '26 OCT',
      time: '18:00',
      tag: '🔴 URGENT',
      title: 'EA SPORT SUMMER BLAST',
      description: 'FIFA - Élimination directe',
      prize: '1805 €',
    },
    {
      id: 2,
      date: '28 OCT',
      time: '20:00',
      tag: '📅 À VENIR',
      title: 'VALORANT CHAMPIONS CUP',
      description: 'Tournoi / Grand Prix',
      prize: '2500 €',
    },
    {
      id: 3,
      date: '30 OCT',
      time: '15:30',
      tag: '📅 À VENIR',
      title: 'APEX LEGENDS INVITATIONAL',
      description: 'Compétition / Finale',
      prize: '1200 €',
    },
    {
      id: 4,
      date: '31 OCT',
      time: '22:00',
      tag: '📅 À VENIR',
      title: 'TOURNAMENT FINALE SEASON',
      description: 'Tournoi / Grand Prix',
      prize: '3000 €',
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-20">
      {/* Hero Section */}
      <HeroSection />

      {/* Performance Overview Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Aperçu des performances</h2>
          <button className="text-xs text-blue-500 hover:text-blue-400">
            Détails complets →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <PerformanceCard
            icon="🏆"
            title="Radiant"
            value="TOP 500 EUW"
            subtitle="CLASSEMENT EUW"
            index={0}
          />
          <PerformanceCard
            icon="📊"   
            title="K/D Ratio"
            value="1.45"
            subtitle="RATIO K/D"
            trend="+0.05"
            index={1}
          />
          
        </div>

        {/* Win Rate Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 bg-[#111927] rounded-xl p-4 border border-gray-800 hover:border-blue-500 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">TAUX DE VICTOIRE</p>
              <p className="text-3xl font-bold">62.8%</p>
              <p className="text-xs text-gray-500">3ème plus haut du serveur</p>
            </div>
            <div className="relative w-20 h-20">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="268"
                  strokeDashoffset="101"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 268 }}
                  animate={{ strokeDashoffset: 101 }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
              </svg>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Upcoming Competitions Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Compétitions à venir</h2>
          <div className="flex gap-2">
            {onNavigate && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('tournaments')}
                className="px-4 py-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-sm transition-all text-white"
              >
                🏆 Tous les tournois
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scroll('left')}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition"
            >
              ←
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scroll('right')}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition"
            >
              →
            </motion.button>
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth scrollbar-hide">
          <AnimatePresence>
            {competitions.map((comp, index) => (
              <CompetitionCard
                key={comp.id}
                date={comp.date}
                time={comp.time}
                title={comp.title}
                description={comp.description}
                prize={comp.prize}
                tag={comp.tag}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Shop Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-6 mb-4"
      >
        <h2 className="text-lg font-bold mb-3">Tendances Boutique</h2>

        <div className="grid grid-cols-2 gap-4">
          {products.slice(0, 2).map((product, index) => (
            <ProductCard
              key={index}
              name={product.name}
              price={product.price}
              discount={product.discount}
              image={product.image}
              index={index}
              onBuyProduct={onBuyProduct}
            />
          ))}
        </div>
      </motion.section>
    </main>
  );
};
