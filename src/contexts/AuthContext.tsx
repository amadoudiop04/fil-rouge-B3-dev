import React, { createContext, useContext, useState, useEffect } from 'react';
import { platformApi } from '../services/platformApi';

export interface User {
  id: string;
  email: string;
  username: string;
  riotId?: string;
  tagLine?: string;
  createdAt?: string;
  // Personalization
  bio?: string;
  discord?: string;
  twitter?: string;
  twitch?: string;
  youtube?: string;
  // Gaming / LFG
  rankLabel?: string;
  roles?: string[];
  region?: string;
  languages?: string[];
  playtimes?: string[];
  showInLfg?: boolean;
  lfgStatus?: 'lfg' | 'busy';
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapUserFromApi = (apiUser: {
    id: number;
    email: string;
    username: string;
    riot_id?: string;
    tag_line?: string;
    created_at?: string | Date;
    bio?: string | null;
    discord?: string | null;
    twitter?: string | null;
    twitch?: string | null;
    youtube?: string | null;
    rank_label?: string | null;
    roles?: string[] | null;
    region?: string | null;
    languages?: string[] | null;
    playtimes?: string[] | null;
    show_in_lfg?: number;
    lfg_status?: string;
    is_admin?: number;
  }): User => ({
    id: apiUser.id.toString(),
    email: apiUser.email,
    username: apiUser.username,
    riotId: apiUser.riot_id,
    tagLine: apiUser.tag_line,
    createdAt: apiUser.created_at ? new Date(apiUser.created_at).toISOString() : undefined,
    bio: apiUser.bio ?? undefined,
    discord: apiUser.discord ?? undefined,
    twitter: apiUser.twitter ?? undefined,
    twitch: apiUser.twitch ?? undefined,
    youtube: apiUser.youtube ?? undefined,
    rankLabel: apiUser.rank_label ?? undefined,
    roles: apiUser.roles ?? undefined,
    region: apiUser.region ?? undefined,
    languages: apiUser.languages ?? undefined,
    playtimes: apiUser.playtimes ?? undefined,
    showInLfg: apiUser.show_in_lfg === 1,
    lfgStatus: (apiUser.lfg_status as 'lfg' | 'busy') ?? 'lfg',
    isAdmin: apiUser.is_admin === 1,
  });

  // Charger l'utilisateur actuel au montage
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await platformApi.getCurrentUser();
        if (response.success && response.user) {
          setUser(mapUserFromApi(response.user));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await platformApi.login(email, password);

      if (!response.success) {
        throw new Error(response.error || 'Erreur de connexion');
      }

      if (!response.user) {
        throw new Error('Utilisateur introuvable');
      }

      setUser(mapUserFromApi(response.user));
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await platformApi.register(username, email, password);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'inscription');
      }

      if (!response.user) {
        throw new Error('Utilisateur introuvable');
      }

      setUser(mapUserFromApi(response.user));
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await platformApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await platformApi.getCurrentUser();
      if (response.success && response.user) {
        setUser(mapUserFromApi(response.user));
      }
    } catch {
      // silent
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur du AuthProvider');
  }
  return context;
};
