import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MatchWithUser } from '../types/api';
import { platformApi } from '../services/platformApi';

type TournamentStatus = 'upcoming' | 'ongoing' | 'finished';

interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  prizePool: string;
  participants: number;
  icon: string;
  statusLabel: string;
  statusColor: string;
}

interface TournamentPageProps {
  onNavigate?: (page: string) => void;
}

const TournamentPage: React.FC<TournamentPageProps> = ({ onNavigate }) => {
  const [statusFilter, setStatusFilter] = useState<TournamentStatus>('upcoming');
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('SENTINELS');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationMessage, setSimulationMessage] = useState('');
  const [recentMatches, setRecentMatches] = useState<MatchWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bracketSectionRef = useRef<HTMLDivElement | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const simulationSteps = [
    'Verification du profil joueur...',
    'Verification du roster equipe...',
    'Controle anti-cheat en cours...',
    'Validation des slots tournoi...',
    'Inscription en cours de confirmation...'
  ];

  // Charger les matchs récents depuis la base de données
  const loadRecentMatches = async () => {
    try {
      setIsLoading(true);
      const response = await platformApi.getRecentMatches(8);
      if (response.success && response.matches) {
        setRecentMatches(response.matches as MatchWithUser[]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matchs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecentMatches();
  }, []);

  const handleScrollToBracket = () => {
    bracketSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStartSimulation = () => {
    if (!playerName.trim()) {
      setSimulationMessage('Entre un pseudo pour rejoindre le tournoi.');
      return;
    }

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    setIsSimulating(true);
    setSimulationStep(0);
    setSimulationMessage(simulationSteps[0]);

    let currentStep = 0;
    simulationTimerRef.current = setInterval(() => {
      currentStep += 1;

      if (currentStep < simulationSteps.length) {
        setSimulationStep(currentStep);
        setSimulationMessage(simulationSteps[currentStep]);
        return;
      }

      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }

      const success = Math.random() > 0.2;
      setIsSimulating(false);
      setSimulationStep(simulationSteps.length);
      setSimulationMessage(
        success
          ? `Inscription validee. ${playerName} rejoint ${selectedTeam}.`
          : 'Tous les slots sont pris. Vous etes place en liste d attente.'
      );
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, []);
  // Définir la date de début du tournoi (par exemple : dans 4 heures, 12 minutes et 44 secondes à partir de maintenant)
  const [targetDate] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 4);
    now.setMinutes(now.getMinutes() + 12);
    now.setSeconds(now.getSeconds() + 44);
    return now;
  });

  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ hours, minutes, seconds });
      } else {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculer immédiatement
    calculateTimeRemaining();

    // Mettre à jour chaque seconde
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Formater le temps en HH:MM:SS
  const formatTime = () => {
    const h = String(timeRemaining.hours).padStart(2, '0');
    const m = String(timeRemaining.minutes).padStart(2, '0');
    const s = String(timeRemaining.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Données des tournois avec différents statuts
  const allTournaments: Tournament[] = [
    {
      id: '1',
      name: 'RED BULL HOME GROUND',
      status: 'upcoming',
      prizePool: '$50,000',
      participants: 12,
      icon: '🛡️',
      statusLabel: 'INSCRIPTION OUVERTE',
      statusColor: 'text-green-500'
    },
    {
      id: '2',
      name: 'VALORANT CHAMPIONS TOUR',
      status: 'upcoming',
      prizePool: '$75,000',
      participants: 8,
      icon: '🏆',
      statusLabel: 'INSCRIPTION OUVERTE',
      statusColor: 'text-green-500'
    },
    {
      id: '3',
      name: 'APEX LEGENDS TOURNAMENT',
      status: 'ongoing',
      prizePool: '$100,000',
      participants: 24,
      icon: '⚔️',
      statusLabel: 'EN COURS',
      statusColor: 'text-orange-500'
    },
    {
      id: '4',
      name: 'CS:GO MAJOR FINALS',
      status: 'ongoing',
      prizePool: '$150,000',
      participants: 16,
      icon: '💥',
      statusLabel: 'MATCH EN COURS',
      statusColor: 'text-orange-500'
    },
    {
      id: '5',
      name: 'LEAGUE OF LEGENDS CUP',
      status: 'finished',
      prizePool: '$200,000',
      participants: 32,
      icon: '🎮',
      statusLabel: 'TERMINÉ',
      statusColor: 'text-gray-500'
    },
    {
      id: '6',
      name: 'FORTNITE CHAMPIONSHIP',
      status: 'finished',
      prizePool: '$120,000',
      participants: 20,
      icon: '🎯',
      statusLabel: 'TERMINÉ',
      statusColor: 'text-gray-500'
    }
  ];

  // Filtrer les tournois selon le statut sélectionné
  const filteredTournaments = allTournaments.filter(t => t.status === statusFilter);

  return (
    <div className="min-h-screen bg-[#061325] text-white p-6 pb-20">
      {/* Back Button */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('home')}
          className="mb-6 text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-2"
        >
          ← Retour à l'accueil
        </button>
      )}
      {/* Header Section */}
      <div className="max-w-5xl mx-auto ">
        {/* Main Tournament Card */}
        <div 
          className="border border-slate-700 rounded-2xl p-8 mb-8 bg-[#111927] bg-cover bg-center relative overflow-hidden z-0"
          style={{
            backgroundImage: 'url(https://www.lequipe.fr/_medias/img-photo-jpg/trois-clubs-francais-evolueront-dans-le-valorant-champions-tour-en-2025-c-young-wolff-riot-games/1500000002126421/0:0,2000:1333-828-552-75/51b38.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#061325]/95 to-[#061325]/85 rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative z-10">
          {/* Tournament Title */}
          <div className="mb-6">
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold mb-4 tracking-wider">
              ● MAJEUR EN DIRECT
            </div>
            <h1 className="text-6xl font-black mb-3 leading-tight text-white">
              TOURNÉE DES<br />CHAMPIONS:<br />FINALES DE BERLIN
            </h1>
            <p className="text-blue-400 text-xl font-bold">
              250 000 $ de dotation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleScrollToBracket}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              VOIR L'ARBRE
            </button>
            <button
              onClick={() => setShowLiveModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-bold transition-colors border border-slate-700"
            >
              REGARDER LE DIRECT
            </button>
          </div>

          {/* Tournament Status Filters */}
          <div className="flex gap-2">
            <button 
              onClick={() => setStatusFilter('upcoming')}
              className={`px-6 py-2 rounded-full font-bold text-xs transition ${
                statusFilter === 'upcoming' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ● À VENIR
            </button>
            <button 
              onClick={() => setStatusFilter('ongoing')}
              className={`px-6 py-2 rounded-full font-bold text-xs transition ${
                statusFilter === 'ongoing' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ● EN COURS
            </button>
            <button 
              onClick={() => setStatusFilter('finished')}
              className={`px-6 py-2 rounded-full font-bold text-xs transition ${
                statusFilter === 'finished' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ● TERMINÉ
            </button>
          </div>
          </div>
        </div>

        {/* Tournaments List */}
        <div ref={bracketSectionRef} className="border border-slate-700 rounded-2xl p-8 mb-8 bg-[#111927]">
          <h2 className="text-blue-400 text-xs font-bold tracking-widest mb-8 uppercase">
            ◆ TOURNOIS {statusFilter === 'upcoming' ? 'À VENIR' : statusFilter === 'ongoing' ? 'EN COURS' : 'TERMINÉS'} ({filteredTournaments.length})
          </h2>

          {filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">Aucun tournoi dans cette catégorie</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTournaments.map((tournament, index) => (
                <div key={tournament.id} className="border border-slate-700 rounded-2xl p-6 bg-slate-800/30 backdrop-blur-sm hover:border-blue-500/50 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-2xl flex-shrink-0">
                        {tournament.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-xl leading-tight">{tournament.name}</h3>
                        <p className={`${tournament.statusColor} text-xs font-bold mt-2 flex items-center gap-1`}>
                          ● {tournament.statusLabel}
                        </p>
                      </div>
                    </div>
                    {statusFilter === 'upcoming' && index === 0 && (
                      <div className="text-right">
                        <p className="text-slate-400 text-xs font-bold mb-1">DÉBUT DANS</p>
                        <p className="text-3xl font-black text-white tabular-nums">{formatTime()}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border border-slate-700 flex items-center justify-center text-xs font-bold">
                            👤
                          </div>
                        ))}
                      </div>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        +{tournament.participants}
                      </div>
                      <p className="text-slate-400 text-xs font-bold ml-2">PARTICIPANTS</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs font-bold mb-1">DOTATION</p>
                      <p className="text-2xl font-black text-white">{tournament.prizePool}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tournament Bracket Overview - Matchs récents */}
        <div className="border border-slate-700 rounded-2xl p-8 mb-8 bg-[#111927]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-white text-lg font-bold uppercase">
              📋 MATCHS RÉCENTS DU TOURNOI
            </h2>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-xs">
                {recentMatches.length} MATCHS
              </div>
              <button
                onClick={loadRecentMatches}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-2"
              >
                {isLoading ? '⏳ Chargement...' : '🔄 Actualiser'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">Chargement des matchs...</p>
            </div>
          ) : recentMatches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">Aucun match disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentMatches.map((match) => {
                const isWin = match.result === 'win' || match.result === 'W';
                const borderColor = isWin ? 'border-green-500' : 'border-red-500';
                const bgColor = isWin ? 'bg-green-500/10' : 'bg-red-500/10';
                
                return (
                  <div 
                    key={match.id} 
                    className={`border ${borderColor} rounded-xl p-6 ${bgColor} hover:scale-[1.02] transition-transform`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-400 text-xs font-bold uppercase">Joueur</p>
                        <p className="text-white font-bold text-lg">{match.username || 'Inconnu'}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-black ${
                        isWin ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {isWin ? '✓ VICTOIRE' : '✗ DÉFAITE'}
                      </div>
                    </div>

                    {/* Map & Score */}
                    <div className="border-t border-slate-700 pt-4 mb-4">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-2">Carte</p>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-400 font-black text-xl">{match.map_name}</p>
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <p className="text-white font-black text-3xl">{match.score_home}</p>
                            <p className="text-slate-500 text-xs">HOME</p>
                          </div>
                          <p className="text-slate-500 font-bold text-xl">:</p>
                          <div className="text-center">
                            <p className="text-white font-black text-3xl">{match.score_away}</p>
                            <p className="text-slate-500 text-xs">AWAY</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="border-t border-slate-700 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-1">Agent</p>
                          <p className="text-white font-bold">{match.agent_played}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-1">K/D/A</p>
                          <p className="text-white font-bold">
                            {match.kills}/{match.deaths}/{match.assists}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-1">K/D</p>
                          <p className="text-blue-400 font-bold">
                            {match.deaths > 0 ? (match.kills / match.deaths).toFixed(2) : match.kills.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Join Tournament Button */}
        <button
          onClick={() => {
            setShowJoinModal(true);
            setSimulationMessage('');
            setSimulationStep(0);
          }}
          className="w-full bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 hover:from-blue-700 hover:via-blue-700 hover:to-purple-700 text-white py-4 rounded-full font-black text-lg transition-all shadow-lg hover:shadow-blue-500/50"
        >
          📋 REJOINDRE LE TOURNOI 
        </button>
      </div>

      {/* Live Stream Modal */}
      <AnimatePresence>
        {showLiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLiveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-[90%] max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border-2 border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLiveModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full text-white font-bold text-xl transition"
              >
                ✕
              </button>
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/4CXq5PLNjts?autoplay=1&rel=0"
                title="Tournoi en direct"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Tournament Simulator Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => {
              if (!isSimulating) setShowJoinModal(false);
            }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-lg bg-[#111927] border border-slate-700 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black">Simulateur d'inscription</h3>
                <button
                  onClick={() => !isSimulating && setShowJoinModal(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  Fermer
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Pseudo joueur</label>
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ex: Lug_Amadou"
                    className="mt-1 w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    disabled={isSimulating}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Equipe cible</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="mt-1 w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    disabled={isSimulating}
                  >
                    <option>SENTINELS</option>
                    <option>FINATIC</option>
                    <option>LOUD</option>
                    <option>ZETA</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progression</span>
                    <span>{Math.min(simulationStep, simulationSteps.length)}/{simulationSteps.length}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(Math.min(simulationStep, simulationSteps.length) / simulationSteps.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="min-h-10 text-sm text-blue-300 bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2">
                  {simulationMessage || 'Pret a lancer la simulation.'}
                </div>

                <button
                  onClick={handleStartSimulation}
                  disabled={isSimulating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white py-3 rounded-lg font-bold transition"
                >
                  {isSimulating ? 'Simulation en cours...' : 'Lancer la simulation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentPage;
