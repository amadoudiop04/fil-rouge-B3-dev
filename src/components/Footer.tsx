import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0d1b2e] border-t border-gray-800 py-6 px-4 mt-auto mb-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* Section À propos */}
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-2">À propos</h3>
            <p className="text-sm text-gray-400">
              Plateforme dédiée aux passionnés de gaming et d'esports.
            </p>
          </div>

          {/* Section Liens rapides */}
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-2">Liens rapides</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li className="hover:text-white cursor-pointer transition">Accueil</li>
              <li className="hover:text-white cursor-pointer transition">Statistiques</li>
              <li className="hover:text-white cursor-pointer transition">tournois</li>
              <li className="hover:text-white cursor-pointer transition">shop</li>
            </ul>
          </div>

          {/* Section Réseaux sociaux */}
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-2">Suivez-nous</h3>
            <div className="flex gap-3">
              <button className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition">
                <span className="text-xl">📘</span>
              </button>
              <button className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-lg flex items-center justify-center transition">
                <span className="text-xl">🐦</span>
              </button>
              <button className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition">
                <span className="text-xl">📺</span>
              </button>
              <button className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition">
                <span className="text-xl">📷</span>
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-4 text-center">
          <p className="text-sm text-gray-400">
            © 2026 B3 Gaming Platform. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};
