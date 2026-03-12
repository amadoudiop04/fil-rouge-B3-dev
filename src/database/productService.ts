import { RowDataPacket } from 'mysql2/promise';
import { getPool } from './connection';

export interface ProductRecord {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
}

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: number | string;
  category: string;
  image_url: string;
  stock_quantity: number;
}

export const getProducts = async (): Promise<ProductRecord[]> => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<ProductRow[]>(
      `SELECT id, name, price, category, image_url, stock_quantity
       FROM products
       ORDER BY id ASC`
    );

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      price: Number(row.price),
      category: row.category,
      image_url: row.image_url,
      stock_quantity: Number(row.stock_quantity),
    }));
  } catch (error) {
    console.error('Erreur lors de la recuperation des produits:', error);
    throw error;
  }
};
