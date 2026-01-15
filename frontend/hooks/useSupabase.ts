/**
 * Supabase React Hooks
 * Provides reactive database operations with real-time subscriptions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSupabaseClient,
  getOrCreateUser,
  getUserTrades,
  getUserNotifications,
  getUserAlerts,
  createNotification,
  createPriceAlert,
  deletePriceAlert,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
  subscribeToPriceAlerts,
  subscribeToMarketStats,
  unsubscribe,
  isSupabaseConfigured,
  type User,
  type TradeHistory,
  type Notification,
  type PriceAlert,
  type MarketStats,
} from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// USER HOOK
// ============================================

export function useUser(walletAddress?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!walletAddress || !isSupabaseConfigured) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await getOrCreateUser(walletAddress);
        setUser(userData);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [walletAddress]);

  return { user, loading, error };
}

// ============================================
// TRADE HISTORY HOOK
// ============================================

export function useTradeHistory(
  walletAddress?: string,
  options?: { market?: string; limit?: number }
) {
  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offset = useRef(0);

  const fetchTrades = useCallback(async (reset = false) => {
    if (!walletAddress || !isSupabaseConfigured) {
      setTrades([]);
      return;
    }

    if (reset) {
      offset.current = 0;
      setHasMore(true);
    }

    setLoading(true);
    setError(null);
    
    try {
      const limit = options?.limit || 50;
      const newTrades = await getUserTrades(walletAddress, {
        market: options?.market,
        limit,
        offset: offset.current,
      });

      if (reset) {
        setTrades(newTrades);
      } else {
        setTrades(prev => [...prev, ...newTrades]);
      }

      setHasMore(newTrades.length >= limit);
      offset.current += newTrades.length;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch trades:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, options?.market, options?.limit]);

  useEffect(() => {
    fetchTrades(true);
  }, [fetchTrades]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTrades(false);
    }
  }, [loading, hasMore, fetchTrades]);

  return { trades, loading, error, hasMore, loadMore, refresh: () => fetchTrades(true) };
}

// ============================================
// NOTIFICATIONS HOOK
// ============================================

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const data = await getUserNotifications(userId, { limit: 50 });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;

    fetchNotifications();

    // Subscribe to new notifications
    channelRef.current = subscribeToNotifications(userId, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.png',
        });
      }
    });

    return () => {
      unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [userId, fetchNotifications]);

  // Mark single notification as read
  const markRead = useCallback(async (notificationId: string) => {
    const success = await markNotificationRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    return success;
  }, []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    if (!userId) return false;
    const success = await markAllNotificationsRead(userId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
    return success;
  }, [userId]);

  // Create new notification
  const addNotification = useCallback(async (
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) => {
    if (!userId) return null;
    return createNotification({ user_id: userId, type, title, message, data });
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    addNotification,
    refresh: fetchNotifications,
  };
}

// ============================================
// PRICE ALERTS HOOK
// ============================================

export function usePriceAlerts(userId?: string) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      setAlerts([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getUserAlerts(userId, true);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to triggered alerts
  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;

    fetchAlerts();

    channelRef.current = subscribeToPriceAlerts(userId, (triggeredAlert) => {
      // Update local state
      setAlerts(prev =>
        prev.map(a => a.id === triggeredAlert.id ? triggeredAlert : a)
      );
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const direction = triggeredAlert.condition === 'above' ? '📈' : '📉';
        new Notification(`${direction} Price Alert Triggered!`, {
          body: `${triggeredAlert.market} is now ${triggeredAlert.condition} $${triggeredAlert.target_price}`,
          icon: '/favicon.png',
        });
      }
    });

    return () => {
      unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [userId, fetchAlerts]);

  // Create new alert
  const addAlert = useCallback(async (
    market: string,
    condition: 'above' | 'below' | 'crosses',
    targetPrice: string,
    repeat = false
  ) => {
    if (!userId) return null;
    const alert = await createPriceAlert({
      user_id: userId,
      market,
      condition,
      target_price: targetPrice,
      is_active: true,
      repeat,
    });
    if (alert) {
      setAlerts(prev => [alert, ...prev]);
    }
    return alert;
  }, [userId]);

  // Delete alert
  const removeAlert = useCallback(async (alertId: string) => {
    const success = await deletePriceAlert(alertId);
    if (success) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
    return success;
  }, []);

  return {
    alerts,
    loading,
    addAlert,
    removeAlert,
    refresh: fetchAlerts,
  };
}

// ============================================
// MARKET STATS HOOK (Real-time)
// ============================================

export function useMarketStatsRealtime(market: string, chainId: number) {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch initial stats
    const fetchStats = async () => {
      const client = getSupabaseClient();
      if (!client) return;

      const { data, error } = await client
        .from('market_stats')
        .select('*')
        .eq('market', market)
        .eq('chain_id', chainId)
        .single();

      if (!error && data) {
        setStats(data);
      }
      setLoading(false);
    };

    fetchStats();

    // Subscribe to updates
    channelRef.current = subscribeToMarketStats(market, chainId, (newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [market, chainId]);

  return { stats, loading };
}

// ============================================
// REQUEST NOTIFICATION PERMISSION
// ============================================

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied' as NotificationPermission;
  }, []);

  return { permission, requestPermission };
}
