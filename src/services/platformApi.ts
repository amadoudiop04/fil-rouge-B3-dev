import type {
  AuthResponse,
  CreateOrderPayload,
  MatchWithUser,
  OrderRecord,
  ProductRecord,
  StatsRecord,
} from '../types/api';

interface BridgeApi {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  getCurrentUser: () => Promise<AuthResponse>;
  logout: () => Promise<{ success: boolean }>;
  getProducts: () => Promise<{ success: boolean; products?: ProductRecord[]; error?: string }>;
  createOrder: (orderData: CreateOrderPayload) => Promise<{ success: boolean; orderId?: number; error?: string }>;
  updateProfile: (
    userId: number,
    updates: { username?: string; email?: string; riotId?: string; tagLine?: string },
  ) => Promise<AuthResponse>;
  updatePassword: (userId: number, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getUserStats: (userId: number) => Promise<{ success: boolean; stats?: StatsRecord | null; error?: string }>;
  saveUserStats: (stats: StatsRecord) => Promise<{ success: boolean; error?: string }>;
  getRecentMatches: (limit?: number) => Promise<{ success: boolean; matches?: MatchWithUser[]; error?: string }>;
}

const STATS_KEY = 'web-user-stats';
const ORDERS_KEY = 'web-orders';
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

let authToken: string | null = null;

const fallbackProducts: ProductRecord[] = [
  {
    id: 1,
    name: 'Maillot Pro LUG',
    price: 59.99,
    category: 'MAILLOTS',
    image_url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80',
    stock_quantity: 20,
  },
  {
    id: 2,
    name: 'Hoodie Team Black',
    price: 79.99,
    category: 'SWEATS',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    stock_quantity: 14,
  },
  {
    id: 3,
    name: 'Casquette Arena',
    price: 24.99,
    category: 'ACCESSOIRES',
    image_url: 'https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=600&q=80',
    stock_quantity: 35,
  },
  {
    id: 4,
    name: 'Tapis de souris XL',
    price: 29.99,
    category: 'ACCESSOIRES',
    image_url: 'https://images.unsplash.com/photo-1613145997970-db84a7975fbb?auto=format&fit=crop&w=600&q=80',
    stock_quantity: 18,
  },
];

const fallbackMatches: MatchWithUser[] = [
  {
    id: 1,
    user_id: 1,
    username: 'TenZ_Pro',
    map_name: 'Ascent',
    score_home: 13,
    score_away: 8,
    result: 'W',
    agent_played: 'Jett',
    kills: 24,
    deaths: 14,
    assists: 7,
    played_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 2,
    username: 'Shroud_Gaming',
    map_name: 'Bind',
    score_home: 10,
    score_away: 13,
    result: 'L',
    agent_played: 'Reyna',
    kills: 19,
    deaths: 18,
    assists: 5,
    played_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 3,
    user_id: 3,
    username: 'Faker_Legend',
    map_name: 'Haven',
    score_home: 13,
    score_away: 11,
    result: 'W',
    agent_played: 'Sova',
    kills: 22,
    deaths: 15,
    assists: 10,
    played_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const defaultStats = (userId: number): StatsRecord => ({
  user_id: userId,
  rank_name: 'RADIANT',
  rank_rating: 840,
  win_rate: 62,
  kd_ratio: 1.45,
  avg_damage: 164,
});

const getBridge = (): BridgeApi | null => {
  const maybeBridge = (window as Window & { electronAPI?: BridgeApi }).electronAPI;
  return maybeBridge ?? null;
};

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const getAuthToken = (): string | null => authToken;

const setAuthToken = (token: string | null): void => {
  authToken = token;
};

const callApi = async <T>(path: string, init?: RequestInit): Promise<T | null> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { success: false, error: payload?.error || 'Erreur API' } as T;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getStatsMap = (): Record<string, StatsRecord> =>
  parseJson<Record<string, StatsRecord>>(window.localStorage.getItem(STATS_KEY), {});

const saveStatsMap = (map: Record<string, StatsRecord>): void => {
  window.localStorage.setItem(STATS_KEY, JSON.stringify(map));
};

const getOrders = (): OrderRecord[] => parseJson<OrderRecord[]>(window.localStorage.getItem(ORDERS_KEY), []);

const saveOrders = (orders: OrderRecord[]): void => {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const platformApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const apiResponse = await callApi<AuthResponse & { token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (apiResponse) {
      if (apiResponse.success) {
        setAuthToken(apiResponse.token ?? null);
      }
      return apiResponse;
    }

    const bridge = getBridge();
    if (bridge) {
      return bridge.login(email, password);
    }

    return { success: false, error: 'API locale indisponible' };
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const apiResponse = await callApi<AuthResponse & { token?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (apiResponse) {
      if (apiResponse.success) {
        setAuthToken(apiResponse.token ?? null);
      }
      return apiResponse;
    }

    const bridge = getBridge();
    if (bridge) {
      return bridge.register(username, email, password);
    }

    return { success: false, error: 'API locale indisponible' };
  },

  async getCurrentUser(): Promise<AuthResponse> {
    const apiResponse = await callApi<AuthResponse>('/auth/me', {
      method: 'GET',
    });
    if (apiResponse) {
      return apiResponse;
    }

    const bridge = getBridge();
    if (bridge) {
      return bridge.getCurrentUser();
    }

    return { success: true };
  },

  async logout(): Promise<{ success: boolean }> {
    const apiResponse = await callApi<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
    setAuthToken(null);
    if (apiResponse) {
      return apiResponse;
    }

    const bridge = getBridge();
    if (bridge) {
      return bridge.logout();
    }
    return { success: true };
  },

  async getProducts(): Promise<{ success: boolean; products?: ProductRecord[]; error?: string }> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.getProducts();
    }
    return { success: true, products: fallbackProducts };
  },

  async createOrder(orderData: CreateOrderPayload): Promise<{ success: boolean; orderId?: number; error?: string }> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.createOrder(orderData);
    }

    const orders = getOrders();
    const nextId = orders.length > 0 ? Math.max(...orders.map((entry) => entry.id)) + 1 : 1;
    const nextOrder: OrderRecord = {
      id: nextId,
      user_id: orderData.user_id,
      total_ttc: orderData.total_ttc,
      payment_method: orderData.payment_method,
      status: 'Paid',
      created_at: new Date().toISOString(),
      items: orderData.items,
    };

    saveOrders([...orders, nextOrder]);
    return { success: true, orderId: nextId };
  },

  async updateProfile(
    userId: number,
    updates: { username?: string; email?: string; riotId?: string; tagLine?: string },
  ): Promise<AuthResponse> {
    const apiResponse = await callApi<AuthResponse>(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (apiResponse) {
      return apiResponse;
    }

    const bridge = getBridge();
    if (bridge) {
      return bridge.updateProfile(userId, updates);
    }

    return { success: false, error: 'API locale indisponible' };
  },

  async updatePassword(userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const apiResponse = await callApi<{ success: boolean; error?: string }>(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
    if (apiResponse) {
      return apiResponse;
    }

    const bridge = getBridge();
    if (bridge) {
      return bridge.updatePassword(userId, newPassword);
    }

    return { success: false, error: 'API locale indisponible' };
  },

  async getUserStats(userId: number): Promise<{ success: boolean; stats?: StatsRecord | null; error?: string }> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.getUserStats(userId);
    }

    const statsMap = getStatsMap();
    const stats = statsMap[String(userId)] ?? null;
    return { success: true, stats };
  },

  async saveUserStats(stats: StatsRecord): Promise<{ success: boolean; error?: string }> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.saveUserStats(stats);
    }

    const statsMap = getStatsMap();
    statsMap[String(stats.user_id)] = {
      ...defaultStats(stats.user_id),
      ...stats,
    };
    saveStatsMap(statsMap);
    return { success: true };
  },

  async getRecentMatches(limit = 8): Promise<{ success: boolean; matches?: MatchWithUser[]; error?: string }> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.getRecentMatches(limit);
    }

    return { success: true, matches: fallbackMatches.slice(0, limit) };
  },
};
