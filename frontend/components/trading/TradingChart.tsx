'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { priceService, Candlestick } from '@/lib/priceService';

interface TradingChartProps {
  market: string;
  timeframe?: string;
  chartType?: 'candle' | 'line';
}

export default function TradingChart({ market, timeframe = '15m', chartType = 'candle' }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candlestick[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredCandle, setHoveredCandle] = useState<Candlestick | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch historical candlestick data
  useEffect(() => {
    let mounted = true;
    
    const fetchCandlesticks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Determine limit based on timeframe
        const limits: Record<string, number> = {
          '1m': 500,
          '5m': 500,
          '15m': 500,
          '1H': 500,
          '4H': 300,
          '1D': 365,
          '1W': 104,
        };
        
        const limit = limits[timeframe] || 500;
        const data = await priceService.getCandlesticks(market, timeframe, limit);
        
        if (mounted) {
          setCandles(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching candlesticks:', err);
        if (mounted) {
          setError('Failed to load chart data');
          setIsLoading(false);
        }
      }
    };

    fetchCandlesticks();

    // Subscribe to real-time candlestick updates
    const unsubscribe = priceService.subscribeToCandlesticks(market, timeframe, (candlestick) => {
      if (!mounted) return;
      
      setCandles(prev => {
        // If the candle is closed, replace the last one or add new
        if (candlestick.isClosed) {
          // Check if we already have this candle (by time)
          const existingIndex = prev.findIndex(c => c.time === candlestick.time);
          if (existingIndex >= 0) {
            // Update existing candle
            const updated = [...prev];
            updated[existingIndex] = candlestick;
            return updated;
          } else {
            // Add new candle (remove oldest if we exceed limit)
            const newCandles = [...prev, candlestick];
            return newCandles.slice(-500); // Keep last 500 candles
          }
        } else {
          // Update the last candle (current/open candle)
          if (prev.length === 0) {
            return [candlestick];
          }
          const updated = [...prev];
          updated[updated.length - 1] = candlestick;
          return updated;
        }
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [market, timeframe]);
  
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

  if (isLoading) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <span className="text-gray-400 text-sm">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error || !chartParams || candles.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500" />
          <div>
            <h3 className="text-white font-semibold mb-1">Unable to load chart</h3>
            <p className="text-gray-400 text-sm">{error || 'No data available'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Live indicator */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 px-2 py-1 glass rounded-lg border border-white/10">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-bull-500" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-bull-500 animate-ping opacity-75" />
        </div>
        <span className="text-xs text-gray-400">Live</span>
      </div>

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
                <g key={`${candle.time}-${i}`}>
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
                    transition={{ duration: 0.2 }}
                    x={x - chartParams.candleWidth / 2}
                    y={bodyTop}
                    width={chartParams.candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                    style={{ transformOrigin: `${x}px ${bodyTop + bodyHeight / 2}px` }}
                    opacity={candle.isClosed ? 1 : 0.7} // Dim current/open candle
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
          className="absolute top-4 left-4 glass-strong rounded-xl p-3 text-xs font-mono z-10 border border-white/10"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-400">Time:</span>
            <span className="text-white">{new Date(hoveredCandle.time).toLocaleString()}</span>
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
            <span className="text-gray-400">Volume:</span>
            <span className="text-white">{hoveredCandle.volume.toFixed(2)}</span>
          </div>
        </motion.div>
      )}
      
      {/* Current price label */}
      {candles.length > 0 && (
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute right-0 glass-strong rounded-l-lg px-2 py-1 text-xs font-mono border border-white/10"
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
