import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-850 text-white antialiased">
        {/* Background Effects - handled in globals.css for SSR compatibility */}

        <Providers>
          <main className="relative z-10">
            {children}
          </main>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            containerStyle={{
              top: 80,
              right: 20,
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '12px 16px',
                maxWidth: '400px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
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
