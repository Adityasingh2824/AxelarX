'use client';

import { motion } from 'framer-motion';
import { Book, Code, Zap, Shield, Globe, ArrowRight, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const docSections = [
  {
    title: 'Getting Started',
    icon: Zap,
    color: 'from-blue-400 to-blue-600',
    items: [
      'Quick Start Guide',
      'Installation & Setup',
      'First Trade',
      'Wallet Connection',
    ],
  },
  {
    title: 'Trading',
    icon: Globe,
    color: 'from-green-400 to-green-600',
    items: [
      'Order Types',
      'Advanced Trading',
      'Market Analysis',
      'Risk Management',
    ],
  },
  {
    title: 'Cross-Chain Bridge',
    icon: Shield,
    color: 'from-purple-400 to-purple-600',
    items: [
      'Bridge Overview',
      'Supported Chains',
      'Bridge Fees',
      'Security Model',
    ],
  },
  {
    title: 'API Reference',
    icon: Code,
    color: 'from-orange-400 to-orange-600',
    items: [
      'GraphQL API',
      'REST Endpoints',
      'WebSocket Feeds',
      'SDK Documentation',
    ],
  },
];

const quickLinks = [
  { title: 'Linera Protocol', url: 'https://linera.dev', external: true },
  { title: 'GitHub Repository', url: 'https://github.com/linera-io/linera-protocol', external: true },
  { title: 'Discord Community', url: '#', external: true },
  { title: 'Twitter Updates', url: '#', external: true },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
              <p className="text-gray-400">Learn how to use AxelarX and build on Linera</p>
            </div>
            <Link href="/trade" className="btn-primary flex items-center space-x-2">
              <span>Start Trading</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-dark-800 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none text-lg"
            />
          </div>
        </motion.div>

        {/* Quick Start Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="card bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold text-white mb-2">Quick Start</h2>
                <p className="text-gray-400">Get up and running with AxelarX in minutes</p>
              </div>
              <div className="flex space-x-4">
                <Link href="/trade" className="btn-primary">
                  Try Demo
                </Link>
                <button className="btn-glass">
                  Watch Tutorial
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {docSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="card-hover"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors w-full text-left">
                        <ArrowRight className="w-4 h-4" />
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.url}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="card-hover flex items-center justify-between group"
              >
                <span className="text-white font-medium">{link.title}</span>
                {link.external ? (
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                )}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Code Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Example: Place a Limit Order</h2>
          <div className="bg-dark-800 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              <code>{`// Using AxelarX GraphQL API
mutation PlaceOrder {
  placeOrder(
    market: "BTC/USDT"
    side: BUY
    type: LIMIT
    price: "45000.00"
    quantity: "0.1"
  ) {
    orderId
    status
    timestamp
  }
}

// Response
{
  "data": {
    "placeOrder": {
      "orderId": "12345",
      "status": "PENDING",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }
}`}</code>
            </pre>
          </div>
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-12 text-center"
        >
          <div className="card max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Comprehensive Documentation Coming Soon
              </h3>
              <p className="text-gray-400 mb-4">
                Detailed guides, tutorials, and API documentation are being prepared
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/trade" className="btn-primary">
                  Explore Trading
                </Link>
                <a
                  href="https://linera.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass flex items-center space-x-2"
                >
                  <span>Linera Docs</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
