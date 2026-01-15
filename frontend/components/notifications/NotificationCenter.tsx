'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Zap,
  Gift,
  Settings
} from 'lucide-react';
import { useNotifications, useUser, useNotificationPermission } from '@/hooks/useSupabase';
import { formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  walletAddress?: string;
}

export function NotificationCenter({ walletAddress }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser(walletAddress);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markRead, 
    markAllRead 
  } = useNotifications(user?.id);
  const { permission, requestPermission } = useNotificationPermission();

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-center')) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_filled':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'price_alert_above':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'price_alert_below':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'liquidation_warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'deposit':
      case 'withdrawal':
        return <DollarSign className="w-4 h-4 text-cyan-400" />;
      case 'reward':
        return <Gift className="w-4 h-4 text-purple-400" />;
      default:
        return <Zap className="w-4 h-4 text-blue-400" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'order_filled':
        return 'bg-green-500/10';
      case 'price_alert_above':
        return 'bg-green-500/10';
      case 'price_alert_below':
        return 'bg-red-500/10';
      case 'liquidation_warning':
        return 'bg-yellow-500/10';
      case 'reward':
        return 'bg-purple-500/10';
      default:
        return 'bg-cyan-500/10';
    }
  };

  return (
    <div className="notification-center relative">
      {/* Bell Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-medium flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-96 max-h-[500px] bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Permission Request */}
            {permission === 'default' && (
              <div className="p-4 bg-cyan-500/10 border-b border-cyan-500/20">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Enable Push Notifications</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Get instant alerts for trades, price movements, and more
                    </p>
                    <button
                      onClick={requestPermission}
                      className="mt-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-medium rounded-lg transition-colors"
                    >
                      Enable Notifications
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-700 mx-auto" />
                  <p className="text-gray-400 mt-2">No notifications yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    You'll see trade updates and alerts here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/50">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => !notification.is_read && markRead(notification.id)}
                      className={cn(
                        'p-4 hover:bg-gray-800/30 transition-colors cursor-pointer',
                        !notification.is_read && 'bg-gray-800/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          getNotificationBg(notification.type)
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                <button className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors">
                  View All Notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Floating notification toast
interface NotificationToastProps {
  id: string;
  type: string;
  title: string;
  message: string;
  onClose: () => void;
}

export function NotificationToast({ id, type, title, message, onClose }: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'error':
        return <X className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Zap className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/30';
      case 'error':
        return 'border-red-500/30';
      case 'warning':
        return 'border-yellow-500/30';
      default:
        return 'border-cyan-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={cn(
        'w-96 bg-gray-900/95 backdrop-blur-xl border rounded-xl p-4 shadow-2xl',
        getBorderColor()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: 'linear' }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 origin-left rounded-b-xl"
      />
    </motion.div>
  );
}
