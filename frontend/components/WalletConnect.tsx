'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check } from 'lucide-react';
import { lineraClient } from '@/lib/linera';

interface WalletState {
  address: string;
  chainId: string;
  balance: string;
  isConnected: boolean;
}

export default function WalletConnect() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Handle wallet connection
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const walletData = await lineraClient.connectWallet();
      if (walletData) {
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    setWallet(null);
    setIsDropdownOpen(false);
  };
  
  // Copy address to clipboard
  const handleCopy = async () => {
    if (wallet) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Check for existing connection on mount
  useEffect(() => {
    // Auto-connect if previously connected
    const savedConnection = localStorage.getItem('walletConnected');
    if (savedConnection === 'true') {
      handleConnect();
    }
  }, []);
  
  // Save connection state
  useEffect(() => {
    if (wallet) {
      localStorage.setItem('walletConnected', 'true');
    } else {
      localStorage.removeItem('walletConnected');
    }
  }, [wallet]);

  if (!wallet) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConnect}
        disabled={isConnecting}
        className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl font-semibold text-white overflow-hidden group"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative flex items-center gap-2">
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 px-4 py-2 glass-strong rounded-xl hover:bg-white/10 transition-colors"
      >
        {/* Status indicator */}
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-bull-500 rounded-full border-2 border-dark-900" />
        </div>
        
        <div className="text-left">
          <div className="text-sm font-medium text-white">
            {formatAddress(wallet.address)}
          </div>
          <div className="text-xs text-gray-400">
            {parseFloat(wallet.balance).toFixed(2)} LINERA
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isDropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </motion.button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDropdownOpen(false)}
              className="fixed inset-0 z-40"
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-64 glass-strong rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {/* Wallet Info */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">Connected Wallet</span>
                  <span className="text-xs px-2 py-0.5 bg-bull-500/20 text-bull-400 rounded-full">
                    Active
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">
                    {formatAddress(wallet.address)}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopy}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-bull-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Balance */}
              <div className="p-4 border-b border-white/5">
                <div className="text-xs text-gray-500 mb-1">Balance</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {parseFloat(wallet.balance).toFixed(4)}
                  </span>
                  <span className="text-sm text-gray-400">LINERA</span>
                </div>
              </div>
              
              {/* Network */}
              <div className="p-4 border-b border-white/5">
                <div className="text-xs text-gray-500 mb-2">Network</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  <span className="text-sm text-white capitalize">
                    {wallet.chainId.replace('-', ' ')}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 px-4 py-2 text-bear-400 hover:bg-bear-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Disconnect</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
