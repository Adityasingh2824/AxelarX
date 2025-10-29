import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AxelarX - Cross-Chain DEX',
  description: 'Bridging Every Chain, Empowering Every Connection. The future of decentralized trading on Linera.',
  keywords: ['DeFi', 'DEX', 'Cross-chain', 'Trading', 'Linera', 'Web3', 'Blockchain'],
  authors: [{ name: 'AxelarX Team' }],
  creator: 'AxelarX',
  publisher: 'AxelarX',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://axelarx.io'),
  openGraph: {
    title: 'AxelarX - Cross-Chain DEX',
    description: 'Bridging Every Chain, Empowering Every Connection',
    url: 'https://axelarx.io',
    siteName: 'AxelarX',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AxelarX - Cross-Chain DEX',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AxelarX - Cross-Chain DEX',
    description: 'Bridging Every Chain, Empowering Every Connection',
    creator: '@AxelarX_io',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-850 text-white antialiased">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-secondary-900/10 to-accent-900/20 animate-gradient-xy" />
          
          {/* Floating particles */}
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary-400/30 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`,
                  animationDuration: `${6 + Math.random() * 4}s`,
                }}
              />
            ))}
          </div>
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <Providers>
          <main className="relative z-10">
            {children}
          </main>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
