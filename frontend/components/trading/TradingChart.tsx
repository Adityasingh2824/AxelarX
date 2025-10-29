'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface TradingChartProps {
  market: string;
}

// Mock data for demonstration
const generateMockData = () => {
  const data = [];
  let price = 45000 + Math.random() * 10000;
  const now = Date.now();
  
  for (let i = 100; i >= 0; i--) {
    const timestamp = now - i * 60000; // 1 minute intervals
    const change = (Math.random() - 0.5) * 1000;
    price = Math.max(price + change, 1000);
    
    data.push({
      timestamp,
      price,
      volume: Math.random() * 100,
    });
  }
  
  return data;
};

export default function TradingChart({ market }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState(generateMockData());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
    
    // Update data periodically with more realistic movements
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData];
        const lastPrice = newData[newData.length - 1].price;
        
        // More realistic price movement with trends
        const momentum = Math.sin(Date.now() / 15000) * 0.2;
        const volatility = 0.01 + Math.random() * 0.02;
        const change = (Math.random() - 0.5 + momentum) * lastPrice * volatility;
        const newPrice = Math.max(lastPrice + change, 1000);
        
        // Volume correlates with price movement
        const priceChangePercent = Math.abs(change / lastPrice);
        const baseVolume = 50 + Math.random() * 100;
        const volumeMultiplier = 1 + priceChangePercent * 10; // Higher volume on bigger moves
        
        newData.push({
          timestamp: Date.now(),
          price: newPrice,
          volume: baseVolume * volumeMultiplier,
        });
        
        // Keep only last 100 points
        return newData.slice(-100);
      });
    }, 1500 + Math.random() * 1000); // Varying update intervals
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    if (data.length < 2) return;

    // Calculate bounds
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - 2 * padding)) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding + (i * (width - 2 * padding)) / 6;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw price labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (i * priceRange) / 5;
      const y = height - padding - (i * (height - 2 * padding)) / 5;
      ctx.fillText(`$${price.toFixed(0)}`, padding - 10, y + 4);
    }

    // Draw current price indicator
    const currentPrice = data[data.length - 1].price;
    const currentY = height - padding - ((currentPrice - minPrice) / priceRange) * (height - 2 * padding);
    
    // Price line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(width - padding, currentY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Price label
    ctx.fillStyle = '#10b981';
    ctx.fillRect(width - padding + 5, currentY - 10, 80, 20);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`$${currentPrice.toFixed(2)}`, width - padding + 10, currentY + 4);

  }, [data, isLoading]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-400">Loading chart data...</span>
      </div>
    );
  }

  const currentPrice = data[data.length - 1]?.price || 0;
  const previousPrice = data[data.length - 2]?.price || 0;
  const isUp = currentPrice > previousPrice;

  return (
    <div className="relative h-full">
      {/* Chart Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Chart Controls Overlay */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${isUp ? 'bg-bull-500' : 'bg-bear-500'}`}
        />
        <span className="text-sm text-gray-400">Live Price Feed</span>
      </div>
      
      {/* Volume Indicator */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">
          Volume: {data[data.length - 1]?.volume?.toFixed(1) || '0'} BTC
        </span>
      </div>
      
      {/* Price Trend Indicator */}
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
            isUp ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
          }`}
        >
          {isUp ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isUp ? '+' : ''}{((currentPrice - previousPrice) / previousPrice * 100).toFixed(2)}%
          </span>
        </motion.div>
      </div>
    </div>
  );
}
