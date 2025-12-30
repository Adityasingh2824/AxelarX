'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface TradingChartProps {
  market: string;
  timeframe?: string;
  chartType?: 'candle' | 'line';
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate realistic price data
const generateCandleData = (basePrice: number, count: number = 100): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const interval = 60000; // 1 minute
  
  for (let i = count - 1; i >= 0; i--) {
    const volatility = 0.002 + Math.random() * 0.008;
    const trend = Math.sin(i / 10) * 0.001;
    const change = (Math.random() - 0.5 + trend) * currentPrice * volatility;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    const volume = 100 + Math.random() * 1000;
    
    candles.push({
      time: now - i * interval,
      open,
      high,
      low,
      close,
      volume,
    });
    
    currentPrice = close;
  }
  
  return candles;
};

export default function TradingChart({ market, timeframe = '15m', chartType = 'candle' }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Get base price from market
  const basePrice = useMemo(() => {
    const prices: Record<string, number> = {
      'BTC/USDT': 45234.56,
      'ETH/USDT': 2834.67,
      'SOL/USDT': 98.45,
    };
    return prices[market] || 45000;
  }, [market]);
  
  // Initialize and update candle data
  useEffect(() => {
    setCandles(generateCandleData(basePrice, 80));
    
    // Add new candle periodically
    const interval = setInterval(() => {
      setCandles(prev => {
        const lastCandle = prev[prev.length - 1];
        if (!lastCandle) return prev;
        const volatility = 0.001 + Math.random() * 0.003;
        const change = (Math.random() - 0.5) * lastCandle.close * volatility;
        
        const newCandle: Candle = {
          time: Date.now(),
          open: lastCandle.close,
          close: lastCandle.close + change,
          high: Math.max(lastCandle.close, lastCandle.close + change) + Math.random() * Math.abs(change) * 0.3,
          low: Math.min(lastCandle.close, lastCandle.close + change) - Math.random() * Math.abs(change) * 0.3,
          volume: 100 + Math.random() * 500,
        };
        
        // Update last candle or add new one based on probability
        if (Math.random() > 0.7) {
          return [...prev.slice(1), newCandle];
        } else {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (!last) return [...prev, newCandle];
          last.close = newCandle.close;
          last.high = Math.max(last.high, newCandle.high);
          last.low = Math.min(last.low, newCandle.low);
          last.volume += newCandle.volume * 0.1;
          return updated;
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [basePrice, market]);
  
  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Calculate chart parameters
  const chartParams = useMemo(() => {
    if (candles.length === 0) return null;
    
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;
    
    const prices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    
    const candleWidth = (chartWidth / candles.length) * 0.8;
    const candleGap = (chartWidth / candles.length) * 0.2;
    
    return {
      padding,
      chartWidth,
      chartHeight,
      minPrice: minPrice - pricePadding,
      maxPrice: maxPrice + pricePadding,
      priceRange: priceRange + pricePadding * 2,
      candleWidth,
      candleGap,
    };
  }, [candles, dimensions]);
  
  // Price to Y coordinate
  const priceToY = (price: number) => {
    if (!chartParams) return 0;
    return chartParams.padding.top + 
      ((chartParams.maxPrice - price) / chartParams.priceRange) * chartParams.chartHeight;
  };
  
  // Index to X coordinate
  const indexToX = (index: number) => {
    if (!chartParams) return 0;
    return chartParams.padding.left + 
      index * (chartParams.candleWidth + chartParams.candleGap) + 
      chartParams.candleWidth / 2;
  };
  
  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartParams) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    // Find hovered candle
    const index = Math.floor((x - chartParams.padding.left) / (chartParams.candleWidth + chartParams.candleGap));
    if (index >= 0 && index < candles.length) {
      setHoveredCandle(candles[index] ?? null);
    } else {
      setHoveredCandle(null);
    }
  };
  
  // Generate price labels
  const priceLabels = useMemo(() => {
    if (!chartParams) return [];
    
    const labels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const price = chartParams.minPrice + (chartParams.priceRange * i) / steps;
      labels.push({ price, y: priceToY(price) });
    }
    return labels;
  }, [chartParams, priceToY]);
  
  // Generate line chart path
  const linePath = useMemo(() => {
    if (!chartParams || candles.length === 0) return '';
    
    return candles.map((candle, i) => {
      const x = indexToX(i);
      const y = priceToY(candle.close);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [candles, chartParams, indexToX, priceToY]);
  
  // Generate area path for line chart
  const areaPath = useMemo(() => {
    if (!chartParams || !linePath) return '';
    
    const lastX = indexToX(candles.length - 1);
    const firstX = indexToX(0);
    const bottomY = chartParams.padding.top + chartParams.chartHeight;
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, chartParams, candles.length, indexToX]);

  if (!chartParams) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredCandle(null)}
      >
        <defs>
          {/* Gradient for line chart area */}
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid lines */}
        <g className="grid-lines">
          {priceLabels.map((label, i) => (
            <g key={i}>
              <line
                x1={chartParams.padding.left}
                y1={label.y}
                x2={dimensions.width - chartParams.padding.right}
                y2={label.y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
              <text
                x={dimensions.width - chartParams.padding.right + 8}
                y={label.y + 4}
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {label.price.toFixed(2)}
              </text>
            </g>
          ))}
        </g>
        
        {/* Chart content */}
        {chartType === 'candle' ? (
          // Candlestick chart
          <g className="candles">
            {candles.map((candle, i) => {
              const x = indexToX(i);
              const isGreen = candle.close >= candle.open;
              const color = isGreen ? '#10b981' : '#ef4444';
              
              const bodyTop = priceToY(Math.max(candle.open, candle.close));
              const bodyBottom = priceToY(Math.min(candle.open, candle.close));
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
              
              return (
                <g key={i}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={priceToY(candle.high)}
                    x2={x}
                    y2={priceToY(candle.low)}
                    stroke={color}
                    strokeWidth="1"
                  />
                  
                  {/* Body */}
                  <motion.rect
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.005 }}
                    x={x - chartParams.candleWidth / 2}
                    y={bodyTop}
                    width={chartParams.candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                    style={{ transformOrigin: `${x}px ${bodyTop + bodyHeight / 2}px` }}
                  />
                </g>
              );
            })}
          </g>
        ) : (
          // Line chart
          <g className="line-chart">
            {/* Area fill */}
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              d={areaPath}
              fill="url(#areaGradient)"
            />
            
            {/* Line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              d={linePath}
              fill="none"
              stroke="rgb(99, 102, 241)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            {/* Current price dot */}
            {candles.length > 0 && (
              <motion.circle
                animate={{ 
                  r: [4, 6, 4],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                cx={indexToX(candles.length - 1)}
                cy={priceToY(candles[candles.length - 1]?.close ?? 0)}
                fill="rgb(99, 102, 241)"
                filter="url(#glow)"
              />
            )}
          </g>
        )}
        
        {/* Crosshair */}
        {hoveredCandle && (
          <g className="crosshair">
            {/* Vertical line */}
            <line
              x1={mousePos.x}
              y1={chartParams.padding.top}
              x2={mousePos.x}
              y2={chartParams.padding.top + chartParams.chartHeight}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="4 4"
            />
            
            {/* Horizontal line */}
            <line
              x1={chartParams.padding.left}
              y1={mousePos.y}
              x2={dimensions.width - chartParams.padding.right}
              y2={mousePos.y}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="4 4"
            />
          </g>
        )}
      </svg>
      
      {/* Tooltip */}
      {hoveredCandle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 glass-strong rounded-xl p-3 text-xs font-mono z-10"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-400">Open:</span>
            <span className="text-white">${hoveredCandle.open.toFixed(2)}</span>
            <span className="text-gray-400">High:</span>
            <span className="text-bull-400">${hoveredCandle.high.toFixed(2)}</span>
            <span className="text-gray-400">Low:</span>
            <span className="text-bear-400">${hoveredCandle.low.toFixed(2)}</span>
            <span className="text-gray-400">Close:</span>
            <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-bull-400' : 'text-bear-400'}>
              ${hoveredCandle.close.toFixed(2)}
            </span>
          </div>
        </motion.div>
      )}
      
      {/* Current price label */}
      {candles.length > 0 && (
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute right-0 glass-strong rounded-l-lg px-2 py-1 text-xs font-mono"
          style={{ top: priceToY(candles[candles.length - 1]?.close ?? 0) - 10 }}
        >
            <span className={(candles[candles.length - 1]?.close ?? 0) >= (candles[candles.length - 1]?.open ?? 0) ? 'text-bull-400' : 'text-bear-400'}>
              ${(candles[candles.length - 1]?.close ?? 0).toFixed(2)}
          </span>
        </motion.div>
      )}
    </div>
  );
}
