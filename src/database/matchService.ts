import { getPool } from './connection';
import { RowDataPacket } from 'mysql2/promise';

export interface Match {
  id: number;
  user_id: number;
  map_name: string;
  score_home: number;
  score_away: number;
  result: string;
  agent_played: string;
  kills: number;
  deaths: number;
  assists: number;
  played_at: Date;
}

export interface MatchWithUser extends Match {
  username?: string;
}

/**
 * Récupère tous les matchs
 */
export const getAllMatches = async (): Promise<Match[]> => {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM match_history ORDER BY played_at DESC'
    );
    return rows as Match[];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs:', error);
    throw error;
  }
};

/**
 * Récupère les matchs d'un utilisateur spécifique
 */
export const getUserMatches = async (userId: number): Promise<Match[]> => {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM match_history WHERE user_id = ? ORDER BY played_at DESC',
      [userId]
    );
    return rows as Match[];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs utilisateur:', error);
    throw error;
  }
};

/**
 * Récupère les matchs récents avec les informations utilisateur
 */
export const getRecentMatchesWithUsers = async (limit = 20): Promise<MatchWithUser[]> => {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        m.*,
        u.username
       FROM match_history m
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY m.played_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows as MatchWithUser[];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs récents:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques d'un joueur
 */
export const getPlayerStats = async (userId: number) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(assists) as total_assists,
        ROUND(AVG(kills), 2) as avg_kills,
        ROUND(AVG(deaths), 2) as avg_deaths,
        ROUND(AVG(assists), 2) as avg_assists
       FROM match_history
       WHERE user_id = ?`,
      [userId]
    );
    
    if (rows.length > 0) {
      const stats = rows[0];
      const winrate = stats.total_matches > 0 
        ? ((stats.wins / stats.total_matches) * 100).toFixed(1) 
        : '0.0';
      
      return {
        ...stats,
        winrate: parseFloat(winrate)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    throw error;
  }
};

/**
 * Crée un nouveau match
 */
export const createMatch = async (matchData: {
  user_id: number;
  map_name: string;
  score_home: number;
  score_away: number;
  result: string;
  agent_played: string;
  kills: number;
  deaths: number;
  assists: number;
}): Promise<number> => {
  try {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO match_history 
       (user_id, map_name, score_home, score_away, result, agent_played, kills, deaths, assists, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        matchData.user_id,
        matchData.map_name,
        matchData.score_home,
        matchData.score_away,
        matchData.result,
        matchData.agent_played,
        matchData.kills,
        matchData.deaths,
        matchData.assists
      ]
    );
    
    return (result as { insertId: number }).insertId;
  } catch (error) {
    console.error('Erreur lors de la création du match:', error);
    throw error;
  }
};

/**
 * Récupère le classement global des joueurs
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.username,
        COUNT(*) as total_matches,
        SUM(CASE WHEN m.result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(m.kills) as total_kills,
        SUM(m.deaths) as total_deaths,
        ROUND((SUM(CASE WHEN m.result = 'win' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as winrate,
        ROUND(SUM(m.kills) / NULLIF(SUM(m.deaths), 0), 2) as kd_ratio
       FROM users u
       INNER JOIN match_history m ON u.id = m.user_id
       GROUP BY u.id, u.username
       ORDER BY winrate DESC, total_kills DESC
       LIMIT ?`,
      [limit]
    );
    
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    throw error;
  }
};
