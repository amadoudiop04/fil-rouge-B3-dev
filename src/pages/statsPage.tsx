import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { platformApi } from '../services/platformApi';

interface User {
  id: string;
  username: string;
  email: string;
}

interface UserStats {
  rank: string;
  rr: number;
  ranking: string;
  winRate: number;
  kdRatio: number;
  avgDamage: number;
}

interface DatabaseUserStats {
  user_id: number;
  rank_name: string;
  rank_rating: number;
  win_rate: number;
  kd_ratio: number;
  avg_damage: number;
}

interface Agent {
  name: string;
  kd: string;
  level: number;
  matches: number;
  progressColor: string;
  image: string;
  uuid?: string;
}

interface ValorantAgentApi {
  uuid: string;
  displayName: string;
  fullPortrait: string;
  isPlayable?: boolean;
}

interface ValorantApiResponse {
  status: number;
  data?: ValorantAgentApi[];
}

interface StatsPageProps {
  user: User;
  onNavigate: (page: string) => void;
}

export const StatsPage: React.FC<StatsPageProps> = ({ user, onNavigate }) => {
  const { logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [formData, setFormData] = useState({
    rank_name: 'RADIANT',
    rank_rating: 840,
    win_rate: 62,
    kd_ratio: 1.45,
    avg_damage: 164,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    rank: 'RADIANT',
    rr: 840,
    ranking: '#162 AMÉRIQUE DU NORD',
    winRate: 62,
    kdRatio: 1.45,
    avgDamage: 164,
  });
  const [topAgents, setTopAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Charger les agents depuis l'API Valorant
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoadingAgents(true);
        const response = await fetch('https://valorant-api.com/v1/agents');
        const data = (await response.json()) as ValorantApiResponse;

        if (data.status === 200 && data.data) {
          // Filtrer et traiter les agents jouables
          const playableAgentsList = data.data
            .filter((agent) => agent.isPlayable !== false && agent.displayName)
            .map((agent, index: number) => ({
              name: agent.displayName.toUpperCase(),
              kd: (1.2 + (index % 10) * 0.1).toFixed(2),
              level: 18 - (index % 15),
              matches: 142 - index * 5,
              progressColor: ['bg-cyan-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-indigo-500'][index % 5],
              image: agent.fullPortrait,
              uuid: agent.uuid,
            }));

          // Top 5 agents
          setTopAgents(playableAgentsList.slice(0, 5));
          // Tous les agents
          setAllAgents(playableAgentsList);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des agents:', error);
        setTopAgents([]);
        setAllAgents([]);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAgents();
  }, []);

  // Charger les stats de l'utilisateur au montage
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const userId = Number(user.id);
        if (Number.isNaN(userId)) {
          return;
        }

        const response = await platformApi.getUserStats(userId);

        if (response.success && response.stats) {
          const stats = response.stats as DatabaseUserStats;
          setUserStats((previousStats) => ({
            ...previousStats,
            rank: stats.rank_name,
            rr: Number(stats.rank_rating),
            winRate: Number(stats.win_rate),
            kdRatio: Number(stats.kd_ratio),
            avgDamage: Number(stats.avg_damage),
          }));
          return;
        }

        setShowStatsModal(true);
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      }
    };

    loadUserStats();
  }, [user.id]);

  const handleSaveStats = async () => {
    try {
      const userId = Number(user.id);
      if (Number.isNaN(userId)) {
        return;
      }

      const response = await platformApi.saveUserStats({
        user_id: userId,
        rank_name: formData.rank_name,
        rank_rating: formData.rank_rating,
        win_rate: formData.win_rate,
        kd_ratio: formData.kd_ratio,
        avg_damage: formData.avg_damage,
      });

      if (response.success) {
        setUserStats({
          rank: formData.rank_name,
          rr: Number(formData.rank_rating),
          ranking: '#162 AMÉRIQUE DU NORD',
          winRate: Number(formData.win_rate),
          kdRatio: Number(formData.kd_ratio),
          avgDamage: Number(formData.avg_damage),
        });
        setShowStatsModal(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des stats:', error);
    }
  };

  const handleSettingsAction = (
    action: 'notifications' | 'settings' | 'profile' | 'help' | 'logout'
  ) => {
    setIsSettingsOpen(false);

    if (action === 'notifications') {
      console.log('Open notifications');
      return;
    }

    if (action === 'settings') {
      console.log('Open settings');
      return;
    }

    if (action === 'profile') {
      console.log('Open profile');
      return;
    }

    if (action === 'help') {
      console.log('Open help');
      return;
    }

    if (action === 'logout') {
      logout();
      return;
    }
  };

  const globalStats = [
    { label: 'GLOBAL K/D', value: userStats.kdRatio.toFixed(2), trend: '+4%', trendPositive: true },
    { label: 'TAUX DE VICTOIRE', value: `${userStats.winRate.toFixed(1)}%`, trend: '+1.2%', trendPositive: true },
    { label: 'DÉGÂTS MOYENS', value: userStats.avgDamage.toFixed(0), trend: '+0.8%', trendPositive: true },
    { label: 'RANK RATING', value: userStats.rr.toString(), trend: 'actuel', trendPositive: false },
  ];

  const matchHistory = [
    {
      result: 'W',
      map: 'ASCENT',
      score: '13-8',
      agent: 'Jett',
      kda: '24/17/8 K/D/A',
      resultColor: 'bg-green-500',
      borderColor: 'border-green-500',
    },
    {
      result: 'L',
      map: 'e AVEN',
      score: '10-13',
      agent: 'Reyna',
      kda: '18/20/9 K/D/A',
      resultColor: 'bg-red-500',
      borderColor: 'border-red-500',
    },
    {
      result: 'W',
      map: 'BIND',
      score: '14-4',
      agent: 'Jett',
      kda: '21/8/11 K/D/A',
      resultColor: 'bg-green-500',
      borderColor: 'border-green-500',
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-20 bg-[#061325]">
      {/* Stats Input Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e293b] rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700"
          >
            <h2 className="text-2xl font-bold mb-6">Initialiser vos stats</h2>
            <p className="text-gray-400 text-sm mb-6">
              Veuillez renseigner vos statistiques Valorant pour commencer.
            </p>

            <div className="space-y-4">
              {/* Rang */}
              <div>
                <label className="block text-sm font-semibold mb-2">Rang</label>
                <input
                  type="text"
                  value={formData.rank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, rank_name: e.target.value })
                  }
                  placeholder="Ex: RADIANT, IMMORTAL..."
                  className="w-full bg-[#111927] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* RR */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Rank Rating (RR)
                </label>
                <input
                  type="number"
                  value={formData.rank_rating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rank_rating: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  placeholder="0-100"
                  className="w-full bg-[#111927] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Win Rate */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Taux de victoire (%)
                </label>
                <input
                  type="number"
                  value={formData.win_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      win_rate: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                    })
                  }
                  placeholder="0-100"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full bg-[#111927] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* K/D Ratio */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  K/D Ratio
                </label>
                <input
                  type="number"
                  value={formData.kd_ratio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kd_ratio: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  placeholder="Ex: 1.45"
                  step="0.01"
                  className="w-full bg-[#111927] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Avg Damage */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Dégâts moyens par round
                </label>
                <input
                  type="number"
                  value={formData.avg_damage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      avg_damage: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  placeholder="Ex: 164"
                  step="0.1"
                  className="w-full bg-[#111927] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleSaveStats}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-center py-4 border-b border-gray-800 relative z-50">
        <div className="absolute left-0">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-label="Aller a l'accueil"
            className="w-10 h-10 bg-[#1e293b] rounded-full flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition"
          >
            <span className="text-lg">🎮</span>
          </button>
        </div>
        <span className="text-sm font-bold tracking-wider">EA SPORTS // VALORANT</span>
        <div className="absolute right-0 z-50">

          {isSettingsOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 bg-[#111927] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[100]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSettingsAction('notifications')}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
              >
                Notifications
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSettingsAction('settings')}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
              >
                Paramètres
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSettingsAction('profile')}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
              >
                Profil
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSettingsAction('help')}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
              >
                Aide
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSettingsAction('logout')}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 bg-[#1e293b] rounded-2xl p-6 border border-gray-800"
      >
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <Avatar username={user.username} size="lg" showBorder />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">
              ✓
            </div>
          </div>

          {/* Username */}
          <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
          
          {/* Rank Info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-cyan-400 font-bold text-sm">{userStats.rank}</span>
            <span className="text-gray-400 text-sm">• Record {userStats.rr} RR</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">RANG {userStats.ranking}</p>

          {/* Button */}
          <button onClick={() => setShowAllAgents(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
            <span>🌐</span>
            <span>Voir le classement mondial</span>
          </button>
        </div>
      </motion.div>

      {/* Global Stats */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6"
      >
        <h2 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
          Statistiques Globales
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {globalStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#111927] rounded-xl p-4 border border-gray-800"
            >
              <p className="text-xs text-gray-400 mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p
                  className={`text-xs font-semibold ${
                    stat.trendPositive ? 'text-green-500' : 'text-gray-500'
                  }`}
                >
                  {stat.trend}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Top Agents */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Agents les plus joués
          </h2>
          <button onClick={() => setShowAllAgents(true)} className="text-xs text-blue-500 hover:text-blue-400">
            VOIR TOUT
          </button>
        </div>

        {loadingAgents ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400">Chargement des agents...</p>
          </div>
        ) : (showAllAgents ? allAgents : topAgents).length > 0 ? (
          <div className="space-y-3">
            {(showAllAgents ? allAgents : topAgents).map((agent, index) => (
              <motion.div
                key={agent.uuid || agent.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-[#111927] rounded-xl p-4 border border-gray-800 hover:border-blue-500 transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Agent Image */}
                  <div className="w-20 h-20 rounded-lg bg-linear-to-br from-gray-800 to-gray-900 overflow-hidden shrink-0">
                    <img
                      src={agent.image}
                      alt={agent.name}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23374151" width="80" height="80"/%3E%3Ctext x="50%" y="50%" font-size="12" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{agent.name}</h3>
                      <span className="text-green-400 font-semibold text-base">
                        {agent.kd} K/D
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700/40 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        style={{ width: `${Math.min((agent.level / 20) * 100, 100)}%` }}
                        className={`h-full ${agent.progressColor} rounded-full`}
                      />
                    </div>

                    <p className="text-xs text-gray-400">
                      MAÎTRISE: NIVEAU {agent.level} • {agent.matches} MATCHS
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400">Aucun agent trouvé</p>
          </div>
        )}
      </motion.section>

      {/* Match History */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-6 mb-4"
      >
        <h2 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
          Historique des matchs
        </h2>

        <div className="space-y-2">
          {matchHistory.map((match, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={`bg-[#111927] rounded-lg p-3 border-l-4 ${match.borderColor} flex items-center gap-3`}
            >
              {/* Result Badge */}
              <div
                className={`w-10 h-10 ${match.resultColor} rounded-lg flex items-center justify-center font-bold text-lg`}
              >
                {match.result}
              </div>

              {/* Match Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm">{match.map}</h4>
                  <span className="text-sm font-semibold">{match.score}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Agent {match.agent} • {match.kda}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Modal Classement Mondial / Tous les agents */}
      {showAllAgents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#1e293b] rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">🌐 Classement Mondial</h2>
              <button
                onClick={() => setShowAllAgents(false)}
                className="text-2xl hover:text-gray-400 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allAgents.map((agent) => (
                <div
                  key={agent.uuid || agent.name}
                  className="bg-[#111927] rounded-xl p-4 border border-gray-800 hover:border-blue-500 transition"
                >
                  <div className="flex items-center gap-4">
                    {/* Agent Image */}
                    <div className="w-20 h-20 rounded-lg bg-linear-to-br from-gray-800 to-gray-900 overflow-hidden shrink-0">
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23374151" width="80" height="80"/%3E%3C/svg%3E';
                        }}
                      />
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{agent.name}</h3>
                        <span className="text-green-400 font-semibold">{agent.kd} K/D</span>
                      </div>
                      <div className="w-full bg-gray-700/40 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          style={{ width: `${Math.min((agent.level / 20) * 100, 100)}%` }}
                          className={`h-full ${agent.progressColor} rounded-full`}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Niv {agent.level} • {agent.matches} matchs
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};