'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, TrendingUp, Globe, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import WalletConnect from '@/components/WalletConnect';

const stats = [
  { label: 'Trading Pairs', value: '500+', icon: TrendingUp },
  { label: 'Supported Chains', value: '15+', icon: Globe },
  { label: 'Total Volume', value: '$2.5B+', icon: Zap },
  { label: 'Active Users', value: '100K+', icon: Shield },
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-0.5s finality with unlimited throughput scaling on Linera microchains',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Trust-Minimized',
    description: 'Atomic cross-chain swaps with cryptographic guarantees and automatic refunds',
    gradient: 'from-blue-400 to-purple-500',
  },
  {
    icon: Globe,
    title: 'Universal Bridge',
    description: 'Connect any blockchain - Ethereum, Bitcoin, Solana, and beyond',
    gradient: 'from-green-400 to-blue-500',
  },
  {
    icon: TrendingUp,
    title: 'Professional Trading',
    description: 'Advanced order types, real-time data feeds, and institutional-grade matching',
    gradient: 'from-purple-400 to-pink-500',
  },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gradient-primary">AxelarX</span>
            </motion.div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/trade" className="text-gray-300 hover:text-white transition-colors">
                Trade
              </Link>
              <Link href="/pools" className="text-gray-300 hover:text-white transition-colors">
                Pools
              </Link>
              <Link href="/bridge" className="text-gray-300 hover:text-white transition-colors">
                Bridge
              </Link>
              <Link href="/docs" className="text-gray-300 hover:text-white transition-colors">
                Docs
              </Link>
            </div>

            {/* Connect Wallet */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <WalletConnect />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="text-gradient-primary">Bridging Every Chain,</span>
              <br />
              <span className="text-white">Empowering Every Connection</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Experience the future of decentralized trading with sub-second finality, 
              unlimited scalability, and seamless cross-chain swaps on Linera.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link
                href="/trade"
                className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
              >
                <span>Start Trading</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/docs"
                className="btn-glass flex items-center space-x-2 text-lg px-8 py-4"
              >
                <span>Learn More</span>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const isActive = index === currentStat;
                
                return (
                  <motion.div
                    key={stat.label}
                    animate={{
                      scale: isActive ? 1.05 : 1,
                      opacity: isActive ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`card text-center ${isActive ? 'border-primary-500/50 bg-primary-500/5' : ''}`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${isActive ? 'text-primary-400' : 'text-gray-400'}`} />
                    <div className={`text-2xl font-bold mb-1 ${isActive ? 'text-primary-400' : 'text-white'}`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-gray-400 animate-bounce" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for the Future of Finance
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powered by Linera's revolutionary microchain architecture, 
              AxelarX delivers unprecedented performance and security.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card-hover group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powered by Linera Protocol
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience trading like never before with microchain isolation, 
              parallel processing, and instant finality.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Microchain Architecture */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="card text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Microchain Isolation
              </h3>
              <p className="text-gray-400">
                Each trading pair runs on its own dedicated microchain, 
                ensuring perfect isolation and unlimited scalability.
              </p>
            </motion.div>

            {/* Parallel Processing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="card text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Parallel Processing
              </h3>
              <p className="text-gray-400">
                Validators process multiple chains simultaneously, 
                achieving up to 1M transactions per second in testing.
              </p>
            </motion.div>

            {/* Instant Finality */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="card text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Instant Finality
              </h3>
              <p className="text-gray-400">
                Sub-0.5s block finality means your trades are confirmed 
                almost instantly with cryptographic guarantees.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Experience the Future?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of traders already using AxelarX for lightning-fast, 
              secure cross-chain trading.
            </p>
            <Link
              href="/trade"
              className="btn-primary inline-flex items-center space-x-2 text-lg px-8 py-4"
            >
              <span>Launch App</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-gradient-primary">AxelarX</span>
              </div>
              <p className="text-gray-400 max-w-md">
                The next-generation cross-chain DEX built on Linera Protocol. 
                Bridging every chain, empowering every connection.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/trade" className="text-gray-400 hover:text-white transition-colors">Trade</Link></li>
                <li><Link href="/pools" className="text-gray-400 hover:text-white transition-colors">Pools</Link></li>
                <li><Link href="/bridge" className="text-gray-400 hover:text-white transition-colors">Bridge</Link></li>
                <li><Link href="/analytics" className="text-gray-400 hover:text-white transition-colors">Analytics</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/community" className="text-gray-400 hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 AxelarX. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
