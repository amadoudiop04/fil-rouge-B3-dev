export interface UserRecord {
  id: number;
  username: string;
  email: string;
  password: string;
  riot_id?: string;
  tag_line?: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<UserRecord, 'password'>;
  error?: string;
}

export interface ProductRecord {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
}

export interface StatsRecord {
  user_id: number;
  rank_name: string;
  rank_rating: number;
  win_rate: number;
  kd_ratio: number;
  avg_damage: number;
}

export interface MatchWithUser {
  id: number;
  user_id: number;
  username?: string;
  map_name: string;
  score_home: number;
  score_away: number;
  result: string;
  agent_played: string;
  kills: number;
  deaths: number;
  assists: number;
  played_at: string;
}

export interface CreateOrderPayload {
  user_id: number;
  total_ttc: number;
  payment_method: 'Card' | 'PayPal' | 'Crypto';
  items: Array<{
    product_id: number;
    quantity: number;
    price_at_purchase: number;
  }>;
}

export interface OrderRecord {
  id: number;
  user_id: number;
  total_ttc: number;
  payment_method: string;
  status: 'Pending' | 'Paid' | 'Shipped';
  created_at: string;
  items: CreateOrderPayload['items'];
}
