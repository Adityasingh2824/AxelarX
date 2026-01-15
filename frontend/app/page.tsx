'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Zap, Shield, TrendingUp, Globe, ChevronDown, 
  Layers, Activity, Lock, Cpu, ArrowUpRight, Sparkles,
  BarChart3, Wallet, RefreshCcw, Clock, Users, Star
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import WalletConnect from '@/components/WalletConnect';
import LivePriceTicker from '@/components/LivePriceTicker';

// Animated counter component
const AnimatedCounter = ({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

// Floating particles background
const ParticleField = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary-400/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
          }}
          animate={{
            y: [null, Math.random() * -500 - 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};

// Animated grid background
const GridBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary-500/20 rounded-full blur-[128px] animate-pulse-slow delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/10 rounded-full blur-[128px] animate-pulse-slow delay-500" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

// Stats data
const stats = [
  { label: 'Trading Pairs', value: 500, suffix: '+', icon: BarChart3 },
  { label: 'Total Volume', value: 2.5, prefix: '$', suffix: 'B+', icon: TrendingUp },
  { label: 'Active Users', value: 100, suffix: 'K+', icon: Users },
  { label: 'Avg. Finality', value: 0.4, suffix: 's', icon: Clock },
];

// Features data
const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-0.5s finality powered by Linera\'s revolutionary microchain architecture. Trade at the speed of thought.',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    delay: 0,
  },
  {
    icon: Shield,
    title: 'Trust-Minimized',
    description: 'Atomic cross-chain swaps with cryptographic guarantees. Your assets, always under your control.',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    delay: 0.1,
  },
  {
    icon: Globe,
    title: 'Universal Bridge',
    description: 'Seamlessly connect any blockchain. Ethereum, Bitcoin, Solana, and every chain in between.',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    delay: 0.2,
  },
  {
    icon: Cpu,
    title: 'Parallel Processing',
    description: 'Each market runs on its own microchain. Heavy trading never impacts your experience.',
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    delay: 0.3,
  },
  {
    icon: Lock,
    title: 'Institutional Security',
    description: 'Multi-signature escrow, automatic refunds, and audited smart contracts protect every trade.',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    delay: 0.4,
  },
  {
    icon: Layers,
    title: 'Deep Liquidity',
    description: 'Advanced order book with price-time priority matching. Get the best prices, every time.',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    delay: 0.5,
  },
];

// Tech stack
const techStack = [
  { name: 'Linera', description: 'Microchain Infrastructure' },
  { name: 'Rust', description: 'Smart Contracts' },
  { name: 'WebAssembly', description: 'Runtime' },
  { name: 'GraphQL', description: 'Real-time API' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-secondary-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-x-hidden">
      <GridBackground />
      <ParticleField />
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="glass-strong rounded-2xl px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-10 h-10 flex items-center justify-center"
                >
                  <img src="/AxelarX.png" alt="AxelarX Logo" className="w-10 h-10 object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity -z-10" />
                </motion.div>
                <span className="text-2xl font-bold text-gradient-primary">AxelarX</span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden lg:flex items-center gap-1">
                {['Trade', 'Portfolio', 'Pools', 'Bridge', 'Docs'].map((item) => (
                  <Link 
                    key={item}
                    href={`/${item.toLowerCase()}`} 
                    className="nav-link"
                  >
                    {item}
                  </Link>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <WalletConnect />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20"
      >
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Now live on Linera Testnet</span>
            <ArrowUpRight className="w-4 h-4" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="text-gradient-cosmic">Bridging Every Chain</span>
            <br />
            <span className="text-white">Empowering Every</span>
            <br />
            <motion.span 
              className="relative inline-block"
              animate={{ 
                textShadow: [
                  '0 0 20px rgba(99, 102, 241, 0.5)',
                  '0 0 40px rgba(139, 92, 246, 0.5)',
                  '0 0 20px rgba(99, 102, 241, 0.5)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-gradient-neon">Connection</span>
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            The next-generation cross-chain DEX with{' '}
            <span className="text-primary-400">sub-second finality</span>,{' '}
            <span className="text-secondary-400">unlimited scalability</span>, and{' '}
            <span className="text-accent-400">atomic swaps</span> powered by Linera.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/trade">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-lg px-8 py-4 rounded-xl"
              >
                <span>Start Trading</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/docs">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-ghost text-lg px-8 py-4 rounded-xl"
              >
                <span>Learn More</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05, borderColor: 'rgba(99, 102, 241, 0.5)' }}
                  className="card-glass p-6 text-center group cursor-default"
                >
                  <Icon className="w-6 h-6 mx-auto mb-3 text-primary-400 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-sm">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Live Price Ticker Section */}
      <section className="relative py-12 px-4 border-y border-white/5 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <LivePriceTicker />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Why Choose AxelarX</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Built for the{' '}
              <span className="text-gradient-primary">Future of Finance</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Powered by Linera's revolutionary microchain architecture,
              delivering unprecedented performance and security.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="card-hover h-full">
                    {/* Gradient border on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"
                      style={{ backgroundImage: `linear-gradient(135deg, ${feature.gradient.split(' ').filter(c => c.startsWith('from-') || c.startsWith('via-') || c.startsWith('to-')).map(c => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})` }}
                    />
                    
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gradient-primary transition-all">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-[100px] -translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <Cpu className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-medium">Powered by Linera</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Microchain{' '}
                <span className="text-gradient-primary">Architecture</span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Each trading pair runs on its own dedicated microchain, ensuring 
                perfect isolation and unlimited horizontal scaling. Heavy activity 
                in BTC/USDT never impacts ETH/DAI.
              </p>

              {/* Tech stack */}
              <div className="grid grid-cols-2 gap-4">
                {techStack.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="glass p-4 rounded-xl"
                  >
                    <div className="text-lg font-semibold text-white">{tech.name}</div>
                    <div className="text-sm text-gray-400">{tech.description}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right visualization */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Central hub */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="absolute w-full h-full border border-primary-500/20 rounded-full" />
                  <div className="absolute w-3/4 h-3/4 border border-secondary-500/20 rounded-full" />
                  <div className="absolute w-1/2 h-1/2 border border-accent-500/20 rounded-full" />
                </motion.div>

                {/* Center node */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        '0 0 30px rgba(99, 102, 241, 0.3)',
                        '0 0 60px rgba(99, 102, 241, 0.5)',
                        '0 0 30px rgba(99, 102, 241, 0.3)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center"
                  >
                    <Layers className="w-10 h-10 text-white" />
                  </motion.div>
                </div>

                {/* Orbiting nodes */}
                {['BTC/USDT', 'ETH/DAI', 'SOL/USDC', 'AVAX/USDT'].map((pair, index) => {
                  const angle = (index * 90) * (Math.PI / 180);
                  const radius = 45; // percentage
                  
                  return (
                    <motion.div
                      key={pair}
                      className="absolute"
                      style={{
                        top: `${50 - radius * Math.cos(angle)}%`,
                        left: `${50 + radius * Math.sin(angle)}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.5,
                      }}
                    >
                      <div className="glass-strong px-4 py-2 rounded-xl text-sm font-mono">
                        {pair}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 opacity-90" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            
            {/* Content */}
            <div className="relative p-12 md:p-16 text-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-8 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center"
              >
                <Zap className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Experience the Future?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of traders already using AxelarX for 
                lightning-fast, secure cross-chain trading.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/trade">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white text-dark-900 font-bold rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2"
                  >
                    <span>Launch App</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="/docs">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/20 backdrop-blur-xl text-white font-bold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
                  >
                    Read Documentation
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Logo & description */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <img src="/AxelarX.png" alt="AxelarX Logo" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-bold text-gradient-primary">AxelarX</span>
              </Link>
              <p className="text-gray-400 max-w-md mb-6">
                The next-generation cross-chain DEX built on Linera Protocol. 
                Bridging every chain, empowering every connection.
              </p>
              <div className="flex items-center gap-4">
                {['twitter', 'discord', 'github', 'telegram'].map((social) => (
                  <motion.a
                    key={social}
                    href={`https://${social}.com`}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <Activity className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-4">
                {['Trade', 'Pools', 'Bridge', 'Analytics', 'API'].map((link) => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">Resources</h3>
              <ul className="space-y-4">
                {['Documentation', 'Help Center', 'Blog', 'Community', 'Status'].map((link) => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 AxelarX. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
