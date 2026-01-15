'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Gift,
  Info,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'trade' | 'alert' | 'reward';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'trade',
    title: 'Order Filled',
    message: 'Your buy order for 0.5 BTC at $90,500 has been filled.',
    time: '2 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'alert',
    title: 'Price Alert',
    message: 'ETH has crossed your target price of $3,100.',
    time: '15 minutes ago',
    read: false,
  },
  {
    id: '3',
    type: 'reward',
    title: 'Rewards Claimed',
    message: 'You received 50 AXL tokens from liquidity mining.',
    time: '1 hour ago',
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Bridge Complete',
    message: '1,000 USDT successfully bridged to Polygon.',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'New Feature',
    message: 'Margin trading is now available with up to 10x leverage.',
    time: '1 day ago',
    read: true,
  },
];

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'trade':
      return <Zap className="w-5 h-5 text-cyan-400" />;
    case 'alert':
      return <TrendingUp className="w-5 h-5 text-orange-400" />;
    case 'reward':
      return <Gift className="w-5 h-5 text-purple-400" />;
    default:
      return <Info className="w-5 h-5 text-blue-400" />;
  }
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        'px-4 py-3 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30 transition-colors group',
                        !notification.read && 'bg-gray-800/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          notification.type === 'success' && 'bg-green-500/10',
                          notification.type === 'warning' && 'bg-yellow-500/10',
                          notification.type === 'trade' && 'bg-cyan-500/10',
                          notification.type === 'alert' && 'bg-orange-500/10',
                          notification.type === 'reward' && 'bg-purple-500/10',
                          notification.type === 'info' && 'bg-blue-500/10'
                        )}>
                          <NotificationIcon type={notification.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              'text-sm font-medium',
                              !notification.read && 'text-white'
                            )}>
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    Clear all
                  </button>
                  <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
