import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from './connection';

export interface UserStats {
  user_id: number;
  rank_name: string;
  rank_rating: number;
  win_rate: number;
  kd_ratio: number;
  avg_damage: number;
}

interface UserStatsRow extends RowDataPacket {
  user_id: number;
  rank_name: string;
  rank_rating: number;
  win_rate: number;
  kd_ratio: number;
  avg_damage: number;
}

export const getUserStats = async (userId: number): Promise<UserStats | null> => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<UserStatsRow[]>(
      `SELECT user_id, rank_name, rank_rating, win_rate, kd_ratio, avg_damage
       FROM user_stats
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error('Erreur lors de la récupération des stats utilisateur:', error);
    throw error;
  }
};

export const saveUserStats = async (
  stats: Omit<UserStats, 'user_id'> & { user_id: number }
): Promise<boolean> => {
  try {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO user_stats (user_id, rank_name, rank_rating, win_rate, kd_ratio, avg_damage)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rank_name = VALUES(rank_name),
         rank_rating = VALUES(rank_rating),
         win_rate = VALUES(win_rate),
         kd_ratio = VALUES(kd_ratio),
         avg_damage = VALUES(avg_damage)`,
      [
        stats.user_id,
        stats.rank_name,
        stats.rank_rating,
        stats.win_rate,
        stats.kd_ratio,
        stats.avg_damage,
      ]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des stats utilisateur:', error);
    throw error;
  }
};
