/**
 * Supabase Client Configuration
 * Handles database connections and real-time subscriptions
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Types for our database tables
export interface User {
  id: string;
  wallet_address: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  preferences: UserPreferences;
  referral_code: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
  soundEffects: boolean;
  defaultMarket: string;
  defaultLeverage: number;
  slippageTolerance: number;
}

export interface TradeHistory {
  id: string;
  trade_id: string;
  chain_id: number;
  market: string;
  user_id?: string;
  wallet_address: string;
  side: 'buy' | 'sell';
  order_type: string;
  price: string;
  quantity: string;
  total_value: string;
  fee: string;
  fee_token?: string;
  realized_pnl?: string;
  tx_hash?: string;
  block_number?: number;
  executed_at: string;
  created_at: string;
}

export interface UserPosition {
  id: string;
  user_id?: string;
  wallet_address: string;
  chain_id: number;
  market: string;
  side: 'long' | 'short';
  size: string;
  entry_price: string;
  current_price?: string;
  unrealized_pnl?: string;
  realized_pnl: string;
  leverage: number;
  liquidation_price?: string;
  margin_used?: string;
  is_open: boolean;
  opened_at: string;
  closed_at?: string;
  updated_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  market: string;
  condition: 'above' | 'below' | 'crosses';
  target_price: string;
  current_price?: string;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at?: string;
  notification_sent: boolean;
  repeat: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  is_push_sent: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'active' | 'completed';
  total_volume: string;
  total_rewards: string;
  rewards_claimed: string;
  created_at: string;
  activated_at?: string;
}

export interface LiquidityPosition {
  id: string;
  user_id?: string;
  wallet_address: string;
  chain_id: number;
  pool_id: string;
  market: string;
  lp_tokens: string;
  base_amount: string;
  quote_amount: string;
  entry_price?: string;
  pending_rewards: string;
  claimed_rewards: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketStats {
  id: string;
  chain_id: number;
  market: string;
  last_price?: string;
  price_change_24h?: number;
  high_24h?: string;
  low_24h?: string;
  volume_24h?: string;
  trades_24h: number;
  open_interest?: string;
  funding_rate?: number;
  updated_at: string;
}

// Database type definition
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_active_at' | 'referral_code'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'referral_code'>>;
      };
      trade_history: {
        Row: TradeHistory;
        Insert: Omit<TradeHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<TradeHistory, 'id' | 'created_at'>>;
      };
      user_positions: {
        Row: UserPosition;
        Insert: Omit<UserPosition, 'id' | 'opened_at' | 'updated_at'>;
        Update: Partial<Omit<UserPosition, 'id' | 'opened_at'>>;
      };
      price_alerts: {
        Row: PriceAlert;
        Insert: Omit<PriceAlert, 'id' | 'created_at' | 'is_triggered' | 'triggered_at' | 'notification_sent'>;
        Update: Partial<Omit<PriceAlert, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'is_push_sent'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      referrals: {
        Row: Referral;
        Insert: Omit<Referral, 'id' | 'created_at' | 'total_volume' | 'total_rewards' | 'rewards_claimed'>;
        Update: Partial<Omit<Referral, 'id' | 'created_at'>>;
      };
      liquidity_positions: {
        Row: LiquidityPosition;
        Insert: Omit<LiquidityPosition, 'id' | 'created_at' | 'updated_at' | 'pending_rewards' | 'claimed_rewards'>;
        Update: Partial<Omit<LiquidityPosition, 'id' | 'created_at'>>;
      };
      market_stats: {
        Row: MarketStats;
        Insert: Omit<MarketStats, 'id' | 'updated_at'>;
        Update: Partial<Omit<MarketStats, 'id'>>;
      };
    };
  };
}

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client
let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Using mock data.');
    return null;
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  
  return supabaseClient;
}

// Export for convenience
export const supabase = getSupabaseClient();

// ============================================
// USER OPERATIONS
// ============================================

export async function getOrCreateUser(walletAddress: string): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedAddress = walletAddress.toLowerCase();
  
  // Try to get existing user
  const { data: existingUser, error: fetchError } = await client
    .from('users')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .single();
  
  if (existingUser) {
    // Update last active timestamp
    await client
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', existingUser.id);
    return existingUser;
  }
  
  // Create new user
  const { data: newUser, error: createError } = await client
    .from('users')
    .insert({ wallet_address: normalizedAddress })
    .select()
    .single();
  
  if (createError) {
    console.error('Failed to create user:', createError);
    return null;
  }
  
  return newUser;
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('users')
    .update({ preferences })
    .eq('id', userId);
  
  return !error;
}

// ============================================
// TRADE HISTORY OPERATIONS
// ============================================

export async function recordTrade(trade: Omit<TradeHistory, 'id' | 'created_at'>): Promise<TradeHistory | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('trade_history')
    .insert(trade)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to record trade:', error);
    return null;
  }
  
  return data;
}

export async function getUserTrades(
  walletAddress: string,
  options?: {
    market?: string;
    limit?: number;
    offset?: number;
  }
): Promise<TradeHistory[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from('trade_history')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('executed_at', { ascending: false });
  
  if (options?.market) {
    query = query.eq('market', options.market);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to fetch trades:', error);
    return [];
  }
  
  return data || [];
}

// ============================================
// NOTIFICATIONS OPERATIONS
// ============================================

export async function createNotification(
  notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'is_push_sent'>
): Promise<Notification | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
  
  return data;
}

export async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<Notification[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (options?.unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
  
  return data || [];
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  return !error;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  return !error;
}

// ============================================
// PRICE ALERTS OPERATIONS
// ============================================

export async function createPriceAlert(
  alert: Omit<PriceAlert, 'id' | 'created_at' | 'is_triggered' | 'triggered_at' | 'notification_sent'>
): Promise<PriceAlert | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('price_alerts')
    .insert(alert)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create price alert:', error);
    return null;
  }
  
  return data;
}

export async function getUserAlerts(userId: string, activeOnly = true): Promise<PriceAlert[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to fetch alerts:', error);
    return [];
  }
  
  return data || [];
}

export async function deletePriceAlert(alertId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('price_alerts')
    .delete()
    .eq('id', alertId);
  
  return !error;
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): RealtimeChannel | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();
  
  return channel;
}

export function subscribeToMarketStats(
  market: string,
  chainId: number,
  callback: (stats: MarketStats) => void
): RealtimeChannel | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel(`market_stats:${chainId}:${market}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'market_stats',
        filter: `market=eq.${market}`,
      },
      (payload) => {
        if ((payload.new as MarketStats).chain_id === chainId) {
          callback(payload.new as MarketStats);
        }
      }
    )
    .subscribe();
  
  return channel;
}

export function subscribeToPriceAlerts(
  userId: string,
  callback: (alert: PriceAlert) => void
): RealtimeChannel | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel(`price_alerts:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'price_alerts',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const alert = payload.new as PriceAlert;
        if (alert.is_triggered && !alert.notification_sent) {
          callback(alert);
        }
      }
    )
    .subscribe();
  
  return channel;
}

// Cleanup subscription
export function unsubscribe(channel: RealtimeChannel | null): void {
  if (channel) {
    const client = getSupabaseClient();
    client?.removeChannel(channel);
  }
}
