/**
 * Global State Management with Zustand
 * Handles app-wide state for trading, notifications, and user preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Trading Store
// ============================================

interface Order {
  id: string;
  market: string;
  side: 'buy' | 'sell';
  type: string;
  price: number;
  quantity: number;
  filled: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
  createdAt: Date;
}

interface Position {
  id: string;
  market: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
}

interface TradingState {
  // Current market
  selectedMarket: string;
  setSelectedMarket: (market: string) => void;
  
  // Orders
  openOrders: Order[];
  orderHistory: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  cancelOrder: (orderId: string) => void;
  clearOrderHistory: () => void;
  
  // Positions
  positions: Position[];
  addPosition: (position: Position) => void;
  updatePosition: (positionId: string, updates: Partial<Position>) => void;
  closePosition: (positionId: string) => void;
  
  // Balances
  balances: Record<string, number>;
  updateBalance: (token: string, amount: number) => void;
  
  // Trading settings
  slippage: number;
  setSlippage: (slippage: number) => void;
  leverage: number;
  setLeverage: (leverage: number) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedMarket: 'BTC/USDT',
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  
  openOrders: [],
  orderHistory: [],
  addOrder: (order) => set((state) => ({
    openOrders: [order, ...state.openOrders],
    orderHistory: [order, ...state.orderHistory].slice(0, 100),
  })),
  updateOrder: (orderId, updates) => set((state) => ({
    openOrders: state.openOrders.map((o) =>
      o.id === orderId ? { ...o, ...updates } : o
    ),
    orderHistory: state.orderHistory.map((o) =>
      o.id === orderId ? { ...o, ...updates } : o
    ),
  })),
  cancelOrder: (orderId) => set((state) => ({
    openOrders: state.openOrders.filter((o) => o.id !== orderId),
    orderHistory: state.orderHistory.map((o) =>
      o.id === orderId ? { ...o, status: 'cancelled' as const } : o
    ),
  })),
  clearOrderHistory: () => set({ orderHistory: [] }),
  
  positions: [],
  addPosition: (position) => set((state) => ({
    positions: [position, ...state.positions],
  })),
  updatePosition: (positionId, updates) => set((state) => ({
    positions: state.positions.map((p) =>
      p.id === positionId ? { ...p, ...updates } : p
    ),
  })),
  closePosition: (positionId) => set((state) => ({
    positions: state.positions.filter((p) => p.id !== positionId),
  })),
  
  balances: {
    WBTC: 0,
    WETH: 0,
    USDT: 10000,
    USDC: 10000,
  },
  updateBalance: (token, amount) => set((state) => ({
    balances: { ...state.balances, [token]: amount },
  })),
  
  slippage: 0.5,
  setSlippage: (slippage) => set({ slippage }),
  leverage: 1,
  setLeverage: (leverage) => set({ leverage }),
}));

// ============================================
// UI Store
// ============================================

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface UIState {
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  
  // Layout
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  chartFullscreen: boolean;
  setChartFullscreen: (fullscreen: boolean) => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Modals
  activeModal: string | null;
  modalData: any;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  
  // Sound
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Keyboard shortcuts help
  showShortcutsHelp: boolean;
  setShowShortcutsHelp: (show: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      chartFullscreen: false,
      setChartFullscreen: (fullscreen) => set({ chartFullscreen: fullscreen }),
      
      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        
        // Auto remove after duration
        const duration = toast.duration ?? 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),
      
      activeModal: null,
      modalData: null,
      openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
      
      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      
      showShortcutsHelp: false,
      setShowShortcutsHelp: (show) => set({ showShortcutsHelp: show }),
    }),
    {
      name: 'axelarx-ui-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

// ============================================
// Wallet Store
// ============================================

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  
  connect: (address: string, chainId: number) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
  switchChain: (chainId: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  
  connect: (address, chainId) => set({
    address,
    chainId,
    isConnected: true,
    isConnecting: false,
  }),
  disconnect: () => set({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
  }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  switchChain: (chainId) => set({ chainId }),
}));

// ============================================
// Favorites Store
// ============================================

interface FavoritesState {
  favoriteMarkets: string[];
  toggleFavorite: (market: string) => void;
  isFavorite: (market: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteMarkets: ['BTC/USDT', 'ETH/USDT'],
      toggleFavorite: (market) => set((state) => ({
        favoriteMarkets: state.favoriteMarkets.includes(market)
          ? state.favoriteMarkets.filter((m) => m !== market)
          : [...state.favoriteMarkets, market],
      })),
      isFavorite: (market) => get().favoriteMarkets.includes(market),
    }),
    {
      name: 'axelarx-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================
// Notification Store
// ============================================

interface AppNotification {
  id: string;
  type: 'order_filled' | 'price_alert' | 'deposit' | 'withdrawal' | 'liquidation' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      isRead: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.png',
      });
    }
    
    // Play sound if enabled
    const { soundEnabled } = useUIStore.getState();
    if (soundEnabled) {
      // Sound effect would be played here
    }
  },
  
  markAsRead: (id) => set((state) => {
    const notification = state.notifications.find((n) => n.id === id);
    if (!notification || notification.isRead) return state;
    
    return {
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    };
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    unreadCount: 0,
  })),
  
  removeNotification: (id) => set((state) => {
    const notification = state.notifications.find((n) => n.id === id);
    return {
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: notification && !notification.isRead 
        ? Math.max(0, state.unreadCount - 1) 
        : state.unreadCount,
    };
  }),
  
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

// ============================================
// Helper hooks
// ============================================

// Custom hook to show toast
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  
  return {
    success: (title: string, message: string) => 
      addToast({ type: 'success', title, message }),
    error: (title: string, message: string) => 
      addToast({ type: 'error', title, message }),
    warning: (title: string, message: string) => 
      addToast({ type: 'warning', title, message }),
    info: (title: string, message: string) => 
      addToast({ type: 'info', title, message }),
  };
};
