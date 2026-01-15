'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Book,
  Code,
  Zap,
  Shield,
  Globe,
  Layers,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  Copy,
  Check,
  Play,
  Terminal,
  FileCode,
  Cpu,
  Lock,
  Wallet,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import { cn } from '@/lib/utils';

const DOCS_SECTIONS = [
  {
    title: 'Getting Started',
    icon: Play,
    items: [
      { title: 'Introduction', slug: 'introduction' },
      { title: 'Quick Start Guide', slug: 'quick-start' },
      { title: 'Connecting Your Wallet', slug: 'wallet-connection' },
      { title: 'Making Your First Trade', slug: 'first-trade' },
    ],
  },
  {
    title: 'Core Concepts',
    icon: Book,
    items: [
      { title: 'Order Book Mechanics', slug: 'order-book' },
      { title: 'Cross-Chain Architecture', slug: 'cross-chain' },
      { title: 'Linera Microchains', slug: 'microchains' },
      { title: 'Atomic Swaps', slug: 'atomic-swaps' },
    ],
  },
  {
    title: 'Trading',
    icon: Zap,
    items: [
      { title: 'Order Types', slug: 'order-types' },
      { title: 'Margin Trading', slug: 'margin-trading' },
      { title: 'Advanced Orders', slug: 'advanced-orders' },
      { title: 'Fees & Limits', slug: 'fees' },
    ],
  },
  {
    title: 'Bridge',
    icon: Globe,
    items: [
      { title: 'Supported Chains', slug: 'supported-chains' },
      { title: 'Bridge Mechanics', slug: 'bridge-mechanics' },
      { title: 'Bridge Fees', slug: 'bridge-fees' },
      { title: 'Troubleshooting', slug: 'bridge-troubleshooting' },
    ],
  },
  {
    title: 'Liquidity',
    icon: Layers,
    items: [
      { title: 'Providing Liquidity', slug: 'providing-liquidity' },
      { title: 'LP Tokens', slug: 'lp-tokens' },
      { title: 'Rewards & Mining', slug: 'rewards' },
      { title: 'Impermanent Loss', slug: 'impermanent-loss' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { title: 'Smart Contract Audits', slug: 'audits' },
      { title: 'Bug Bounty Program', slug: 'bug-bounty' },
      { title: 'Best Practices', slug: 'security-practices' },
    ],
  },
  {
    title: 'Developers',
    icon: Code,
    items: [
      { title: 'API Reference', slug: 'api-reference' },
      { title: 'WebSocket API', slug: 'websocket-api' },
      { title: 'Smart Contracts', slug: 'smart-contracts' },
      { title: 'SDK Documentation', slug: 'sdk' },
    ],
  },
];

const CodeBlock = ({ code, language = 'typescript' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={copyCode}
          className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-300">{code}</code>
      </pre>
    </div>
  );
};

export default function DocsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('Getting Started');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDoc, setActiveDoc] = useState('introduction');

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              
              <div className="h-8 w-px bg-white/10" />
              
              <Link href="/" className="flex items-center gap-2">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow"
                >
                  <span className="text-white font-bold text-lg">A</span>
                </motion.div>
                <span className="text-xl font-bold text-gradient-primary">AxelarX</span>
              </Link>

              <span className="text-gray-500 hidden md:block">/ Documentation</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>
              </div>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-28 space-y-2">
              {DOCS_SECTIONS.map((section) => (
                <div key={section.title}>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{section.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-500 transition-transform',
                        expandedSection === section.title && 'rotate-180'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedSection === section.title && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 py-1 space-y-1">
                          {section.items.map((item) => (
                            <button
                              key={item.slug}
                              onClick={() => setActiveDoc(item.slug)}
                              className={cn(
                                'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                                activeDoc === item.slug
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                              )}
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              {/* Introduction */}
              {activeDoc === 'introduction' && (
                <div>
                  <div className="mb-8">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm mb-4">
                      <Book className="w-4 h-4" />
                      Getting Started
                    </span>
                    <h1 className="text-4xl font-bold mb-4">Introduction to AxelarX</h1>
                    <p className="text-xl text-gray-400">
                      Welcome to AxelarX, the next-generation cross-chain decentralized exchange
                      built on Linera's revolutionary microchain architecture.
                    </p>
                  </div>

                  {/* Feature Cards */}
                  <div className="grid md:grid-cols-3 gap-4 not-prose mb-8">
                    {[
                      { icon: Zap, title: 'Ultra-Fast', desc: 'Sub-0.5 second finality' },
                      { icon: Globe, title: 'Cross-Chain', desc: 'Bridge any blockchain' },
                      { icon: Shield, title: 'Secure', desc: 'Audited smart contracts' },
                    ].map((feature) => (
                      <div
                        key={feature.title}
                        className="bg-gray-900/80 border border-gray-800 rounded-xl p-4"
                      >
                        <feature.icon className="w-8 h-8 text-cyan-400 mb-3" />
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.desc}</p>
                      </div>
                    ))}
                  </div>

                  <h2>What is AxelarX?</h2>
                  <p className="text-gray-300">
                    AxelarX is a decentralized exchange (DEX) that enables trustless cross-chain
                    trading with unprecedented speed and security. Unlike traditional DEXs that
                    are limited to a single blockchain, AxelarX allows you to trade assets across
                    multiple chains seamlessly.
                  </p>

                  <h3>Key Features</h3>
                  <ul className="text-gray-300">
                    <li>
                      <strong>Microchain Architecture:</strong> Each trading pair runs on its own
                      dedicated microchain, ensuring isolated and predictable performance.
                    </li>
                    <li>
                      <strong>Atomic Swaps:</strong> All cross-chain trades are executed atomically,
                      eliminating counterparty risk.
                    </li>
                    <li>
                      <strong>Central Limit Order Book:</strong> Professional-grade order matching
                      with price-time priority.
                    </li>
                    <li>
                      <strong>Advanced Order Types:</strong> Support for limit, market, stop-loss,
                      iceberg, and TWAP orders.
                    </li>
                  </ul>

                  <h3>Quick Start</h3>
                  <p className="text-gray-300">
                    Ready to start trading? Follow these steps to get up and running in minutes:
                  </p>

                  <div className="not-prose bg-gray-900/80 border border-gray-800 rounded-xl p-6 space-y-4">
                    {[
                      { step: 1, title: 'Connect Wallet', desc: 'Connect your Web3 wallet (MetaMask, WalletConnect, etc.)' },
                      { step: 2, title: 'Deposit Assets', desc: 'Bridge or deposit assets from any supported chain' },
                      { step: 3, title: 'Start Trading', desc: 'Place orders on any trading pair' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-cyan-400 font-bold">{item.step}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3>Example: Connecting to AxelarX</h3>
                  <CodeBlock
                    code={`import { AxelarX } from '@axelarx/sdk';

// Initialize the SDK
const axelarx = new AxelarX({
  network: 'mainnet',
  provider: window.ethereum,
});

// Connect wallet
const wallet = await axelarx.connect();
console.log('Connected:', wallet.address);

// Get available markets
const markets = await axelarx.getMarkets();
console.log('Markets:', markets);`}
                  />

                  <div className="not-prose mt-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-start gap-3">
                    <Terminal className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-cyan-400 mb-1">Try it out!</p>
                      <p className="text-sm text-gray-400">
                        Install the AxelarX SDK to start building:{' '}
                        <code className="bg-gray-800 px-2 py-0.5 rounded">npm install @axelarx/sdk</code>
                      </p>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="not-prose mt-8 grid md:grid-cols-2 gap-4">
                    <Link
                      href="/docs/quick-start"
                      className="group bg-gray-900/80 border border-gray-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold group-hover:text-cyan-400 transition-colors">Quick Start Guide</h4>
                          <p className="text-sm text-gray-400">Set up your environment</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </Link>
                    <Link
                      href="/docs/api-reference"
                      className="group bg-gray-900/80 border border-gray-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold group-hover:text-cyan-400 transition-colors">API Reference</h4>
                          <p className="text-sm text-gray-400">Explore the full API</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Other doc sections would be rendered similarly */}
              {activeDoc !== 'introduction' && (
                <div className="text-center py-16">
                  <FileCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Documentation Coming Soon</h2>
                  <p className="text-gray-400">
                    This section is currently being written. Check back soon!
                  </p>
                </div>
              )}
            </motion.div>
          </main>

          {/* Table of Contents */}
          <aside className="hidden xl:block w-48 flex-shrink-0">
            <div className="sticky top-28">
              <h4 className="text-sm font-medium text-gray-400 mb-4">On this page</h4>
              <nav className="space-y-2 text-sm">
                {activeDoc === 'introduction' && (
                  <>
                    <a href="#" className="block text-cyan-400">What is AxelarX?</a>
                    <a href="#" className="block text-gray-500 hover:text-white">Key Features</a>
                    <a href="#" className="block text-gray-500 hover:text-white">Quick Start</a>
                    <a href="#" className="block text-gray-500 hover:text-white">Example</a>
                  </>
                )}
              </nav>

              <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <h4 className="text-sm font-medium mb-2">Need Help?</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Join our community for support
                </p>
                <a
                  href="https://discord.gg/axelarx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Join Discord <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
