import type {
  AuthResponse,
  CreateOrderPayload,
  MatchWithUser,
  OrderRecord,
  ProductRecord,
  StatsRecord,
  UserRecord,
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

const USERS_KEY = 'web-users';
const CURRENT_USER_KEY = 'web-current-user';
const STATS_KEY = 'web-user-stats';
const ORDERS_KEY = 'web-orders';

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

const sanitizeUser = (user: UserRecord): Omit<UserRecord, 'password'> => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

const getUsers = (): UserRecord[] => {
  const users = parseJson<UserRecord[]>(window.localStorage.getItem(USERS_KEY), []);
  if (users.length > 0) {
    return users;
  }

  const seededUser: UserRecord = {
    id: 1,
    username: 'DemoUser',
    email: 'demo@lug.gg',
    password: 'demo1234',
    created_at: new Date().toISOString(),
  };
  window.localStorage.setItem(USERS_KEY, JSON.stringify([seededUser]));
  return [seededUser];
};

const saveUsers = (users: UserRecord[]): void => {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getCurrentUserId = (): number | null => {
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
};

const setCurrentUserId = (userId: number | null): void => {
  if (userId === null) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  window.localStorage.setItem(CURRENT_USER_KEY, String(userId));
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
    const bridge = getBridge();
    if (bridge) {
      return bridge.login(email, password);
    }

    const users = getUsers();
    const user = users.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return { success: false, error: 'Email ou mot de passe invalide' };
    }

    setCurrentUserId(user.id);
    return { success: true, user: sanitizeUser(user) };
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.register(username, email, password);
    }

    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'Cet email est deja utilise' };
    }

    const nextUser: UserRecord = {
      id: users.length > 0 ? Math.max(...users.map((entry) => entry.id)) + 1 : 1,
      username: username.trim(),
      email: normalizedEmail,
      password,
      created_at: new Date().toISOString(),
    };

    saveUsers([...users, nextUser]);
    setCurrentUserId(nextUser.id);

    return { success: true, user: sanitizeUser(nextUser) };
  },

  async getCurrentUser(): Promise<AuthResponse> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.getCurrentUser();
    }

    const userId = getCurrentUserId();
    if (!userId) {
      return { success: true };
    }

    const user = getUsers().find((entry) => entry.id === userId);
    if (!user) {
      return { success: true };
    }

    return { success: true, user: sanitizeUser(user) };
  },

  async logout(): Promise<{ success: boolean }> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.logout();
    }

    setCurrentUserId(null);
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
    const bridge = getBridge();
    if (bridge) {
      return bridge.updateProfile(userId, updates);
    }

    const users = getUsers();
    const userIndex = users.findIndex((entry) => entry.id === userId);
    if (userIndex < 0) {
      return { success: false, error: 'Utilisateur introuvable' };
    }

    const current = users[userIndex];
    const updated: UserRecord = {
      ...current,
      username: updates.username?.trim() || current.username,
      email: updates.email?.trim().toLowerCase() || current.email,
      riot_id: updates.riotId ?? current.riot_id,
      tag_line: updates.tagLine ?? current.tag_line,
    };

    users[userIndex] = updated;
    saveUsers(users);

    return { success: true, user: sanitizeUser(updated) };
  },

  async updatePassword(userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const bridge = getBridge();
    if (bridge) {
      return bridge.updatePassword(userId, newPassword);
    }

    const users = getUsers();
    const userIndex = users.findIndex((entry) => entry.id === userId);
    if (userIndex < 0) {
      return { success: false, error: 'Utilisateur introuvable' };
    }

    users[userIndex] = { ...users[userIndex], password: newPassword };
    saveUsers(users);
    return { success: true };
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
