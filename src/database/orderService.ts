import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from './connection';

export interface OrderItem {
  product_id: number;
  quantity: number;
  price_at_purchase: number;
}

export interface CreateOrderParams {
  user_id: number;
  total_ttc: number;
  payment_method: 'Card' | 'PayPal' | 'Crypto';
  items: OrderItem[];
}

export interface OrderRecord {
  id: number;
  user_id: number;
  total_ttc: number;
  payment_method: string;
  status: string;
  created_at: Date;
}

interface OrderRow extends RowDataPacket {
  id: number;
  user_id: number;
  total_ttc: number;
  payment_method: string;
  status: string;
  created_at: Date;
}

/**
 * Créer une nouvelle commande avec ses articles
 */
export const createOrder = async (params: CreateOrderParams): Promise<number> => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    // Commencer une transaction
    await connection.beginTransaction();

    // 1. Insérer la commande
    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (user_id, total_ttc, payment_method, status)
       VALUES (?, ?, ?, 'Pending')`,
      [params.user_id, params.total_ttc, params.payment_method]
    );

    const orderId = orderResult.insertId;

    // 2. Insérer les articles de la commande
    for (const item of params.items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price_at_purchase]
      );

      // 3. Décrémenter le stock du produit
      await connection.execute(
        `UPDATE products 
         SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND stock_quantity >= ?`,
        [item.quantity, item.product_id, item.quantity]
      );
    }

    // Valider la transaction
    await connection.commit();
    console.log(`✅ Commande #${orderId} créée avec succès`);
    
    return orderId;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await connection.rollback();
    console.error('❌ Erreur lors de la création de la commande:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Récupérer les commandes d'un utilisateur
 */
export const getUserOrders = async (userId: number): Promise<OrderRecord[]> => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<OrderRow[]>(
      `SELECT id, user_id, total_ttc, payment_method, status, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows.map((row) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
      total_ttc: Number(row.total_ttc),
      payment_method: row.payment_method,
      status: row.status,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    throw error;
  }
};

/**
 * Mettre à jour le statut d'une commande
 */
export const updateOrderStatus = async (
  orderId: number,
  status: 'Pending' | 'Paid' | 'Shipped'
): Promise<boolean> => {
  try {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, orderId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};

/**
 * Récupérer les détails d'une commande avec ses articles
 */
export const getOrderDetails = async (orderId: number) => {
  try {
    const pool = getPool();
    
    // Récupérer la commande
    const [orderRows] = await pool.execute<OrderRow[]>(
      `SELECT id, user_id, total_ttc, payment_method, status, created_at
       FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return null;
    }

    const order = orderRows[0];

    // Récupérer les articles de la commande
    interface OrderItemRow extends RowDataPacket {
      id: number;
      order_id: number;
      product_id: number;
      quantity: number;
      price_at_purchase: number;
      name: string;
      category: string;
      image_url: string;
    }

    const [itemRows] = await pool.execute<OrderItemRow[]>(
      `SELECT oi.*, p.name, p.category, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return {
      ...order,
      items: itemRows,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la commande:', error);
    throw error;
  }
};
