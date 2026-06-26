import type {
  AuthResponse,
  CreateOrderPayload,
  MatchWithUser,
  OrderRecord,
  ProductRecord,
  RiotAccount,
  RiotMMR,
  RiotMatch,
  StatsRecord,
} from '../types/api';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  riot_id?: string | null;
  rank_label?: string | null;
  show_in_lfg?: number;
  is_admin?: number;
  banned?: number;
}

export interface DiscordServer {
  id: number;
  name: string;
  description?: string | null;
  invite_url: string;
  members?: string | null;
  tag?: string | null;
  featured?: number;
}

export interface PromoCode {
  id: number; code: string; percent: number; active: number; createdAt?: string;
}

export interface AuditEntry {
  id: number; admin: string | null; action: string; target: string | null; createdAt: string;
}

export interface AdminOrderItem { name: string; quantity: number; price: number; }
export interface AdminOrder {
  id: number;
  user_id: number | null;
  username: string | null;
  email: string | null;
  total_ttc: number;
  payment_method: string;
  status: string;
  created_at: string;
  items: AdminOrderItem[];
}

export interface AdminOverviewResponse {
  success: boolean;
  error?: string;
  metrics?: {
    users: number; admins: number; lfg: number;
    products: number; orders: number; revenue: number; stock: number;
  };
  recentUsers?: Array<{ id: number; username: string; email: string; created_at: string; is_admin: number }>;
  recentOrders?: Array<{ id: number; username: string | null; total_ttc: number; payment_method: string; status: string; created_at: string }>;
  signups?: Array<{ day: string; count: number }>;
}

// ── Teams & own-tournaments (Feature: tournament product loop) ──────────────
export interface TeamMember {
  userId: number; username: string; role: string;
  avatarUrl?: string | null; rankLabel?: string | null;
}
export interface TeamRequest { userId: number; username: string; rankLabel?: string | null; }
export interface Team {
  id: number; name: string; tag?: string | null; ownerId: number;
  logoUrl?: string | null; description?: string | null; createdAt?: string;
  members?: TeamMember[]; memberCount?: number; requests?: TeamRequest[];
}
export interface BracketMatchRow {
  id: number; round: number; slot: number;
  team1Id: number | null; team2Id: number | null;
  score1: number; score2: number; winnerId: number | null; status: string;
}
export interface TournamentTeamRef {
  teamId: number; name: string; tag?: string | null; logoUrl?: string | null; checkedIn: number;
}
export interface OwnTournament {
  id: number; name: string; format: string; maxTeams: number;
  region?: string | null; prizePool?: string | null; startsAt?: string | null;
  status: string; createdBy: number | null; teamCount?: number;
  teams?: TournamentTeamRef[]; matches?: BracketMatchRow[];
}

// ── Notifications / orders / public profile (Phase 3) ───────────────────────
export interface AppNotification {
  id: number; type: string; message: string; link?: string | null; read: number; createdAt: string;
}
export interface UserOrder {
  id: number; total_ttc: number; payment_method: string; status: string; created_at: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}
export interface PublicProfile {
  id: number; username: string; avatarUrl?: string | null; rankLabel?: string | null;
  bio?: string | null; region?: string | null; roles?: string[];
  discord?: string | null; twitter?: string | null; twitch?: string | null; youtube?: string | null;
  createdAt?: string;
  teams: Array<{ id: number; name: string; tag?: string | null; role: string }>;
  recentMatches: MatchWithUser[];
}

interface BridgeApi {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  getCurrentUser: () => Promise<AuthResponse>;
  logout: () => Promise<{ success: boolean }>;
  getProducts: () => Promise<{ success: boolean; products?: ProductRecord[]; error?: string }>;
  createOrder: (orderData: CreateOrderPayload) => Promise<{ success: boolean; orderId?: number; error?: string }>;
  updateProfile: (
    userId: number,
    updates: {
      username?: string; email?: string; riotId?: string; tagLine?: string;
      bio?: string; discord?: string; twitter?: string; twitch?: string; youtube?: string; avatarUrl?: string;
      rankLabel?: string; roles?: string[]; region?: string; languages?: string[];
      playtimes?: string[]; showInLfg?: boolean; lfgStatus?: string;
    },
  ) => Promise<AuthResponse>;
  updatePassword: (userId: number, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getUserStats: (userId: number) => Promise<{ success: boolean; stats?: StatsRecord | null; error?: string }>;
  saveUserStats: (stats: StatsRecord) => Promise<{ success: boolean; error?: string }>;
  getRecentMatches: (limit?: number) => Promise<{ success: boolean; matches?: MatchWithUser[]; error?: string }>;
}

const STATS_KEY = 'web-user-stats';
const ORDERS_KEY = 'web-orders';
const TOKEN_KEY = 'b3-auth-token';
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

// Token persists in localStorage so the session survives a page refresh
// (the server side persists it in the DB across restarts).
let authToken: string | null = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

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
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
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

  // Request a password-reset link. The API always reports success (no email
  // enumeration); in dev it returns the token/link since there is no mailer.
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string; devResetToken?: string; devResetLink?: string }> {
    const r = await callApi<{ success: boolean; message?: string; error?: string; devResetToken?: string; devResetLink?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return r ?? { success: false, error: 'API locale indisponible' };
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const r = await callApi<{ success: boolean; message?: string; error?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    return r ?? { success: false, error: 'API locale indisponible' };
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
    const apiResponse = await callApi<{ success: boolean; products?: ProductRecord[]; error?: string }>('/products');
    if (apiResponse && apiResponse.success && apiResponse.products && apiResponse.products.length > 0) {
      return apiResponse;
    }
    const bridge = getBridge();
    if (bridge) {
      return bridge.getProducts();
    }
    return { success: true, products: fallbackProducts };
  },

  async createOrder(orderData: CreateOrderPayload): Promise<{ success: boolean; orderId?: number; error?: string }> {
    const apiResponse = await callApi<{ success: boolean; orderId?: number; error?: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    if (apiResponse) {
      return apiResponse;
    }

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

  // ── Admin ──────────────────────────────────────────────────────────────────
  async adminOverview(): Promise<AdminOverviewResponse> {
    const r = await callApi<AdminOverviewResponse>('/admin/overview');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminGetUsers(): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
    const r = await callApi<{ success: boolean; users?: AdminUser[]; error?: string }>('/admin/users');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminUpdateUser(id: number, updates: { username?: string; email?: string; isAdmin?: boolean; banned?: boolean; showInLfg?: boolean }) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/users/${id}`, {
      method: 'PUT', body: JSON.stringify(updates),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminDeleteUser(id: number) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/users/${id}`, { method: 'DELETE' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminGetProducts(): Promise<{ success: boolean; products?: ProductRecord[]; error?: string }> {
    const r = await callApi<{ success: boolean; products?: ProductRecord[]; error?: string }>('/admin/products');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminCreateProduct(p: Partial<ProductRecord>) {
    const r = await callApi<{ success: boolean; id?: number; error?: string }>('/admin/products', {
      method: 'POST', body: JSON.stringify(p),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminUpdateProduct(id: number, p: Partial<ProductRecord>) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/products/${id}`, {
      method: 'PUT', body: JSON.stringify(p),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminDeleteProduct(id: number) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/products/${id}`, { method: 'DELETE' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getDiscordServers(): Promise<{ success: boolean; servers?: DiscordServer[]; error?: string }> {
    const r = await callApi<{ success: boolean; servers?: DiscordServer[]; error?: string }>('/discord-servers');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminCreateDiscordServer(s: { name: string; description?: string; inviteUrl: string; members?: string; tag?: string; featured?: boolean }) {
    const r = await callApi<{ success: boolean; id?: number; error?: string }>('/admin/discord-servers', {
      method: 'POST', body: JSON.stringify(s),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminDeleteDiscordServer(id: number) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/discord-servers/${id}`, { method: 'DELETE' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminGetOrders(): Promise<{ success: boolean; orders?: AdminOrder[]; error?: string }> {
    const r = await callApi<{ success: boolean; orders?: AdminOrder[]; error?: string }>('/admin/orders');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminUpdateOrder(id: number, status: string) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/orders/${id}`, {
      method: 'PUT', body: JSON.stringify({ status }),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── Admin: promo codes ───────────────────────────────────────────────────────
  async adminGetPromoCodes(): Promise<{ success: boolean; codes?: PromoCode[]; error?: string }> {
    const r = await callApi<{ success: boolean; codes?: PromoCode[]; error?: string }>('/admin/promo-codes');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminCreatePromoCode(p: { code: string; percent: number; active?: boolean }) {
    const r = await callApi<{ success: boolean; id?: number; error?: string }>('/admin/promo-codes', {
      method: 'POST', body: JSON.stringify(p),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminUpdatePromoCode(id: number, p: { percent?: number; active?: boolean }) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/promo-codes/${id}`, {
      method: 'PUT', body: JSON.stringify(p),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminDeletePromoCode(id: number) {
    const r = await callApi<{ success: boolean; error?: string }>(`/admin/promo-codes/${id}`, { method: 'DELETE' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminGetAuditLog(): Promise<{ success: boolean; entries?: AuditEntry[]; error?: string }> {
    const r = await callApi<{ success: boolean; entries?: AuditEntry[]; error?: string }>('/admin/audit-log');
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── Admin: team management ───────────────────────────────────────────────────
  async adminGetTeams(): Promise<{ success: boolean; teams?: Team[]; error?: string }> {
    const r = await callApi<{ success: boolean; teams?: Team[]; error?: string }>('/admin/teams');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminAddTeamMember(teamId: number, username: string) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>(`/admin/teams/${teamId}/members`, {
      method: 'POST', body: JSON.stringify({ username }),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async adminRemoveTeamMember(teamId: number, userId: number) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>(`/admin/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getLfgPlayers(): Promise<{ success: boolean; players?: unknown[]; error?: string }> {
    const result = await callApi<{ success: boolean; players?: unknown[]; error?: string }>('/users/lfg');
    return result ?? { success: false, players: [] };
  },

  async updateProfile(
    userId: number,
    updates: {
      username?: string; email?: string; riotId?: string; tagLine?: string;
      bio?: string; discord?: string; twitter?: string; twitch?: string; youtube?: string; avatarUrl?: string;
      rankLabel?: string; roles?: string[]; region?: string; languages?: string[];
      playtimes?: string[]; showInLfg?: boolean; lfgStatus?: string;
    },
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

  async getRiotPlayer(name: string, tag: string): Promise<{
    success: boolean;
    account?: RiotAccount;
    mmr?: RiotMMR | null;
    error?: string;
    needsApiKey?: boolean;
  }> {
    const result = await callApi<{ success: boolean; account?: RiotAccount; mmr?: RiotMMR | null; error?: string; needsApiKey?: boolean }>(
      `/riot/player/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
    );
    return result ?? { success: false, error: 'API indisponible' };
  },

  async getRiotMatches(name: string, tag: string, size = 5): Promise<{
    success: boolean;
    matches?: RiotMatch[];
    error?: string;
  }> {
    const result = await callApi<{ success: boolean; matches?: RiotMatch[]; error?: string }>(
      `/riot/matches/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${size}`
    );
    return result ?? { success: false, matches: [], error: 'API indisponible' };
  },

  // ── Realtime (WebSocket) ────────────────────────────────────────────────────
  // Builds the ws:// URL with the current auth token, or null if logged out.
  realtimeUrl(): string | null {
    if (!authToken) return null;
    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    return `${wsBase}/ws?token=${encodeURIComponent(authToken)}`;
  },

  // ── Promo codes ─────────────────────────────────────────────────────────────
  async validatePromo(code: string): Promise<{ success: boolean; code?: string; percent?: number; error?: string }> {
    const r = await callApi<{ success: boolean; code?: string; percent?: number; error?: string }>('/promo/validate', {
      method: 'POST', body: JSON.stringify({ code }),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getActivePromos(): Promise<{ success: boolean; promos?: Array<{ code: string; percent: number }>; error?: string }> {
    const r = await callApi<{ success: boolean; promos?: Array<{ code: string; percent: number }>; error?: string }>('/promo/active');
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── Notifications ───────────────────────────────────────────────────────────
  async getNotifications(userId: number): Promise<{ success: boolean; notifications?: AppNotification[]; unread?: number; error?: string }> {
    const r = await callApi<{ success: boolean; notifications?: AppNotification[]; unread?: number; error?: string }>(`/users/${userId}/notifications`);
    return r ?? { success: false, error: 'API indisponible' };
  },

  async markNotificationsRead(userId: number): Promise<{ success: boolean; error?: string }> {
    const r = await callApi<{ success: boolean; error?: string }>(`/users/${userId}/notifications/read`, { method: 'POST' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── My orders ───────────────────────────────────────────────────────────────
  async getMyOrders(userId: number): Promise<{ success: boolean; orders?: UserOrder[]; error?: string }> {
    const r = await callApi<{ success: boolean; orders?: UserOrder[]; error?: string }>(`/users/${userId}/orders`);
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── Public profile ──────────────────────────────────────────────────────────
  async getPublicProfile(userId: number): Promise<{ success: boolean; profile?: PublicProfile; error?: string }> {
    const r = await callApi<{ success: boolean; profile?: PublicProfile; error?: string }>(`/users/${userId}/public`);
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── Match history (persisted Riot data) ─────────────────────────────────────
  async getMatchHistory(userId: number): Promise<{ success: boolean; matches?: MatchWithUser[]; error?: string }> {
    const r = await callApi<{ success: boolean; matches?: MatchWithUser[]; error?: string }>(`/users/${userId}/matches`);
    return r ?? { success: false, matches: [], error: 'API indisponible' };
  },

  async syncRiotMatches(userId: number, name?: string, tag?: string): Promise<{
    success: boolean; synced?: number; fetched?: number; rankLabel?: string | null;
    matches?: MatchWithUser[]; needsApiKey?: boolean; error?: string;
  }> {
    const r = await callApi<{ success: boolean; synced?: number; fetched?: number; rankLabel?: string | null; matches?: MatchWithUser[]; needsApiKey?: boolean; error?: string }>(
      `/users/${userId}/sync`,
      { method: 'POST', body: JSON.stringify(name && tag ? { name, tag } : {}) },
    );
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── Teams ──────────────────────────────────────────────────────────────────
  async createTeam(payload: { name: string; tag?: string; logoUrl?: string; description?: string }) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>('/teams', {
      method: 'POST', body: JSON.stringify(payload),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getTeams() {
    const r = await callApi<{ success: boolean; teams?: Team[]; error?: string }>('/teams');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getMyTeams() {
    const r = await callApi<{ success: boolean; teams?: Team[]; error?: string }>('/teams/mine');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getTeam(id: number) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>(`/teams/${id}`);
    return r ?? { success: false, error: 'API indisponible' };
  },

  async addTeamMember(teamId: number, username: string) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>(`/teams/${teamId}/members`, {
      method: 'POST', body: JSON.stringify({ username }),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async removeTeamMember(teamId: number, userId: number) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async deleteTeam(teamId: number) {
    const r = await callApi<{ success: boolean; error?: string }>(`/teams/${teamId}`, { method: 'DELETE' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async requestJoinTeam(teamId: number) {
    const r = await callApi<{ success: boolean; error?: string }>(`/teams/${teamId}/request`, { method: 'POST' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async acceptTeamRequest(teamId: number, userId: number) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>(`/teams/${teamId}/requests/${userId}/accept`, { method: 'POST' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async declineTeamRequest(teamId: number, userId: number) {
    const r = await callApi<{ success: boolean; team?: Team; error?: string }>(`/teams/${teamId}/requests/${userId}/decline`, { method: 'POST' });
    return r ?? { success: false, error: 'API indisponible' };
  },

  // ── Own tournaments + brackets ──────────────────────────────────────────────
  async createTournament(payload: { name: string; maxTeams?: number; region?: string; prizePool?: string; startsAt?: string }) {
    const r = await callApi<{ success: boolean; tournament?: OwnTournament; error?: string }>('/tournaments', {
      method: 'POST', body: JSON.stringify(payload),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getOwnTournaments() {
    const r = await callApi<{ success: boolean; tournaments?: OwnTournament[]; error?: string }>('/tournaments');
    return r ?? { success: false, error: 'API indisponible' };
  },

  async getOwnTournament(id: number) {
    const r = await callApi<{ success: boolean; tournament?: OwnTournament; error?: string }>(`/tournaments/${id}`);
    return r ?? { success: false, error: 'API indisponible' };
  },

  async registerTeam(tournamentId: number, teamId: number) {
    const r = await callApi<{ success: boolean; tournament?: OwnTournament; error?: string }>(`/tournaments/${tournamentId}/register`, {
      method: 'POST', body: JSON.stringify({ teamId }),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async unregisterTeam(tournamentId: number, teamId: number) {
    const r = await callApi<{ success: boolean; tournament?: OwnTournament; error?: string }>(`/tournaments/${tournamentId}/register/${teamId}`, {
      method: 'DELETE',
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async startTournament(tournamentId: number) {
    const r = await callApi<{ success: boolean; tournament?: OwnTournament; error?: string }>(`/tournaments/${tournamentId}/start`, {
      method: 'POST',
    });
    return r ?? { success: false, error: 'API indisponible' };
  },

  async reportMatch(tournamentId: number, matchId: number, score1: number, score2: number) {
    const r = await callApi<{ success: boolean; tournament?: OwnTournament; error?: string }>(`/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'PUT', body: JSON.stringify({ score1, score2 }),
    });
    return r ?? { success: false, error: 'API indisponible' };
  },
};
