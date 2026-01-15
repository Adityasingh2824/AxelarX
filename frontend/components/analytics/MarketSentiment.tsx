'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, MessageSquare, Users, Activity } from 'lucide-react';

interface MarketSentimentProps {
  symbol: string;
}

interface SentimentData {
  score: number; // -100 to 100
  bullish: number; // 0 to 100
  bearish: number; // 0 to 100
  neutral: number; // 0 to 100
  socialVolume: number;
  fearGreedIndex: number; // 0 to 100
}

export default function MarketSentiment({ symbol }: MarketSentimentProps) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock sentiment data - In production, integrate with sentiment API
    const fetchSentiment = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock sentiment data
      const mockSentiment: SentimentData = {
        score: 45 + Math.random() * 20 - 10, // Random between 35-55
        bullish: 30 + Math.random() * 20,
        bearish: 25 + Math.random() * 20,
        neutral: 30 + Math.random() * 20,
        socialVolume: 1000 + Math.random() * 5000,
        fearGreedIndex: 40 + Math.random() * 30,
      };

      // Normalize percentages
      const total = mockSentiment.bullish + mockSentiment.bearish + mockSentiment.neutral;
      mockSentiment.bullish = (mockSentiment.bullish / total) * 100;
      mockSentiment.bearish = (mockSentiment.bearish / total) * 100;
      mockSentiment.neutral = (mockSentiment.neutral / total) * 100;

      setSentiment(mockSentiment);
      setIsLoading(false);
    };

    fetchSentiment();
    const interval = setInterval(fetchSentiment, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [symbol]);

  if (isLoading || !sentiment) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-gray-400">Loading sentiment data...</div>
      </div>
    );
  }

  const getSentimentLabel = (score: number) => {
    if (score > 60) return { label: 'Very Bullish', color: 'text-bull-400', bg: 'bg-bull-500/20' };
    if (score > 40) return { label: 'Bullish', color: 'text-bull-400', bg: 'bg-bull-500/10' };
    if (score > -40) return { label: 'Neutral', color: 'text-gray-400', bg: 'bg-gray-500/10' };
    if (score > -60) return { label: 'Bearish', color: 'text-bear-400', bg: 'bg-bear-500/10' };
    return { label: 'Very Bearish', color: 'text-bear-400', bg: 'bg-bear-500/20' };
  };

  const sentimentInfo = getSentimentLabel(sentiment.score);

  return (
    <div className="card h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <h3 className="font-semibold text-white mb-2">Market Sentiment</h3>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${sentimentInfo.bg}`}>
          <span className={`text-sm font-semibold ${sentimentInfo.color}`}>
            {sentimentInfo.label}
          </span>
          <span className="text-xs text-gray-400">
            ({sentiment.score.toFixed(1)})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Sentiment Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Sentiment Distribution</h4>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Bullish</span>
                <span className="text-xs text-bull-400 font-semibold">
                  {sentiment.bullish.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sentiment.bullish}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-bull-500"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Neutral</span>
                <span className="text-xs text-gray-400 font-semibold">
                  {sentiment.neutral.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sentiment.neutral}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gray-500"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Bearish</span>
                <span className="text-xs text-bear-400 font-semibold">
                  {sentiment.bearish.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sentiment.bearish}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="h-full bg-bear-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fear & Greed Index */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary-400" />
            <h4 className="text-sm font-semibold text-white">Fear & Greed Index</h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sentiment.fearGreedIndex}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className={`h-full ${
                    sentiment.fearGreedIndex > 50 
                      ? 'bg-bull-500' 
                      : sentiment.fearGreedIndex > 25
                      ? 'bg-yellow-500'
                      : 'bg-bear-500'
                  }`}
                />
              </div>
            </div>
            <span className={`text-lg font-bold font-mono ${
              sentiment.fearGreedIndex > 50 
                ? 'text-bull-400' 
                : sentiment.fearGreedIndex > 25
                ? 'text-yellow-400'
                : 'text-bear-400'
            }`}>
              {Math.round(sentiment.fearGreedIndex)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {sentiment.fearGreedIndex > 75 ? 'Extreme Greed' :
             sentiment.fearGreedIndex > 50 ? 'Greed' :
             sentiment.fearGreedIndex > 25 ? 'Fear' : 'Extreme Fear'}
          </div>
        </div>

        {/* Social Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-gray-400">Social Volume</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {sentiment.socialVolume.toLocaleString()}
            </div>
          </div>
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-gray-400">Active Users</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {(sentiment.socialVolume / 10).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t border-white/5">
          * Sentiment data is simulated. Integrate with real sentiment API for production.
        </div>
      </div>
    </div>
  );
}








