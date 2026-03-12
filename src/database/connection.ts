import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Configuration de la connexion MySQL
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || '',
  port: parseInt(process.env.DB_PORT || ''),
  database: process.env.DB_NAME || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
};

// Pool de connexions pour de meilleures performances
let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
};

// Tester la connexion
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await getPool().getConnection();
    console.log('✅ Connexion MySQL établie avec succès');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error);
    return false;
  }
};

// Fermer le pool de connexions
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Pool de connexions MySQL fermé');
  }
};
