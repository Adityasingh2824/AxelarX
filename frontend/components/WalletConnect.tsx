'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Copy, ExternalLink, LogOut, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

// Mock wallet addresses for demo
const mockWallets = [
  {
    name: 'MetaMask',
    icon: '🦊',
    address: '0x742d35Cc6cF32A532A8B2b6c2C5e4b4c2c5e4b4c',
    balance: '12.5 ETH',
  },
  {
    name: 'WalletConnect',
    icon: '🔗',
    address: '0x8B2b6c2C5e4b4c2c5e4b4c742d35Cc6cF32A532A',
    balance: '8.2 ETH',
  },
  {
    name: 'Coinbase Wallet',
    icon: '🔵',
    address: '0x532A8B2b6c2C5e4b4c2c5e4b4c742d35Cc6cF32A',
    balance: '15.7 ETH',
  },
];

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<typeof mockWallets[0] | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing connection on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      const wallet = JSON.parse(savedWallet);
      setConnectedWallet(wallet);
      setIsConnected(true);
      onConnect?.(wallet.address);
    }
  }, [onConnect]);

  const connectWallet = async (wallet: typeof mockWallets[0]) => {
    setIsConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setConnectedWallet(wallet);
    setIsConnected(true);
    setIsOpen(false);
    setIsConnecting(false);
    
    // Save to localStorage
    localStorage.setItem('connectedWallet', JSON.stringify(wallet));
    
    toast.success(`Connected to ${wallet.name}!`);
    onConnect?.(wallet.address);
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setIsConnected(false);
    localStorage.removeItem('connectedWallet');
    toast.success('Wallet disconnected');
    onDisconnect?.();
  };

  const copyAddress = () => {
    if (connectedWallet) {
      navigator.clipboard.writeText(connectedWallet.address);
      toast.success('Address copied to clipboard');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && connectedWallet) {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/50 rounded-lg px-4 py-2 transition-all duration-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white font-medium">
            {formatAddress(connectedWallet.address)}
          </span>
          <span className="text-2xl">{connectedWallet.icon}</span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-72 bg-dark-800 border border-white/20 rounded-xl shadow-2xl backdrop-blur-md z-50"
            >
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{connectedWallet.icon}</span>
                  <div>
                    <div className="text-white font-medium">{connectedWallet.name}</div>
                    <div className="text-sm text-gray-400">Connected</div>
                  </div>
                </div>

                <div className="bg-dark-700 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-1">Address</div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-mono text-sm">
                      {formatAddress(connectedWallet.address)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={copyAddress}
                        className="p-1 hover:bg-dark-600 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-dark-600 rounded transition-colors">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-700 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-1">Balance</div>
                  <div className="text-white font-semibold">{connectedWallet.balance}</div>
                </div>

                <button
                  onClick={disconnectWallet}
                  className="w-full flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-2 px-4 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center space-x-2 px-4 py-2"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isConnecting && setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-800 border border-white/20 rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                <p className="text-gray-400">Choose your preferred wallet to connect</p>
              </div>

              <div className="space-y-3">
                {mockWallets.map((wallet, index) => (
                  <motion.button
                    key={wallet.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => connectWallet(wallet)}
                    disabled={isConnecting}
                    className="w-full flex items-center space-x-4 bg-dark-700 hover:bg-dark-600 rounded-lg p-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span className="text-3xl">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium group-hover:text-primary-400 transition-colors">
                        {wallet.name}
                      </div>
                      <div className="text-sm text-gray-400">{wallet.balance}</div>
                    </div>
                    {isConnecting && (
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 mb-3">
                  By connecting a wallet, you agree to our Terms of Service
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isConnecting}
                  className="text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
