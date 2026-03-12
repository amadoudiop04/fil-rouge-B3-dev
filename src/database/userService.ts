import { getPool } from './connection';
import bcrypt from 'bcryptjs';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface User {
  id: number;
  username: string;
  email: string;
  riot_id?: string;
  tag_line?: string;
  created_at?: Date;
}

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  riot_id?: string;
  tag_line?: string;
  created_at: Date;
}

const SALT_ROUNDS = 10;

/**
 * Créer un nouveau utilisateur
 */
export const createUser = async (
  username: string,
  email: string,
  password: string
): Promise<User> => {
  try {
    // Vérifier si l'email existe déjà
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    // Validation du mot de passe
    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insérer l'utilisateur dans la base de données
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    return {
      id: result.insertId,
      username,
      email,
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Authentifier un utilisateur
 */
export const authenticateUser = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const user = rows[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Retourner l'utilisateur sans le mot de passe
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      riot_id: user.riot_id,
      tag_line: user.tag_line,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    throw error;
  }
};

/**
 * Trouver un utilisateur par email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, username, email, riot_id, tag_line, created_at FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error('Erreur lors de la recherche de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Trouver un utilisateur par ID
 */
export const findUserById = async (id: number): Promise<User | null> => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, username, email, riot_id, tag_line, created_at FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error('Erreur lors de la recherche de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Mettre à jour le mot de passe d'un utilisateur
 */
export const updateUserPassword = async (
  userId: number,
  newPassword: string
): Promise<boolean> => {
  try {
    if (newPassword.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const pool = getPool();

    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    throw error;
  }
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = async (userId: number): Promise<boolean> => {
  try {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Mettre à jour les infos Valorant d'un utilisateur
 */
export const updateUserValorantInfo = async (
  userId: number,
  riotId: string,
  tagLine: string
): Promise<boolean> => {
  try {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET riot_id = ?, tag_line = ? WHERE id = ?',
      [riotId, tagLine, userId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des infos Valorant:', error);
    throw error;
  }
};

/**
 * Mettre à jour le profil d'un utilisateur (username, riot_id, tag_line)
 */
export const updateUserProfile = async (
  userId: number,
  username?: string,
  email?: string,
  riotId?: string,
  tagLine?: string
): Promise<User | null> => {
  try {
    const pool = getPool();
    const updates: string[] = [];
    const values: Array<string | number> = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email !== undefined) {
      const existingUser = await findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Cet email est déjà utilisé');
      }
      updates.push('email = ?');
      values.push(email);
    }
    if (riotId !== undefined) {
      updates.push('riot_id = ?');
      values.push(riotId);
    }
    if (tagLine !== undefined) {
      updates.push('tag_line = ?');
      values.push(tagLine);
    }

    if (updates.length === 0) {
      return await findUserById(userId);
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    await pool.execute<ResultSetHeader>(query, values);

    return await findUserById(userId);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};
/**
 * Obtenir les stats Valorant d'un utilisateur
 */
export const getUserValorantStats = async (userId: number): Promise<any | null> => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT riot_id, tag_line FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    // Retourne les infos Valorant pour l'utilisateur
    // À l'avenir, cela peut être étendu pour inclure rang, RR, etc.
    return {
      riot_id: rows[0].riot_id,
      tag_line: rows[0].tag_line,
      // Ces champs peuvent être ajoutés à la table en futur
      // rank: rows[0].rank,
      // rr: rows[0].rr,
      // ranking: rows[0].ranking,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des stats Valorant:', error);
    throw error;
  }
};