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
  // Extra fields present on persisted Riot matches (optional for legacy/demo rows).
  mode?: string;
  headshotPct?: number;
  avgDamage?: number;
  roundsWon?: number;
  roundsLost?: number;
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

export interface RiotAccount {
  puuid: string;
  region: string;
  account_level: number;
  name: string;
  tag: string;
  card?: {
    small: string;
    large: string;
    wide: string;
    id: string;
  };
  last_update?: string;
}

export interface RiotMMR {
  current_data?: {
    currenttier: number;
    currenttierpatched: string;
    ranking_in_tier: number;
    mmr_change_to_last_game: number;
    elo: number;
    old: boolean;
  };
  highest_rank?: {
    patched_tier: string;
    tier: number;
    season: string;
  };
}

export interface RiotMatch {
  matchId: string;
  map: string;
  mode: string;
  date: string;
  result: 'W' | 'L';
  roundsWon: number;
  roundsLost: number;
  agent: string;
  agentImage: string | null;
  kills: number;
  deaths: number;
  assists: number;
  headshotPct: number;
  avgDamage: number;
}
