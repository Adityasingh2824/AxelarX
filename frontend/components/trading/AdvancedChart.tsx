'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, LineStyle, LineWidth } from 'lightweight-charts';
import { Loader2, AlertCircle } from 'lucide-react';
import { priceService, Candlestick } from '@/lib/priceService';
import { 
  calculateSMA, calculateEMA, calculateRSI, calculateMACD, 
  calculateBollingerBands, convertToHeikinAshi, calculateVWAP 
} from '@/lib/indicators';

interface AdvancedChartProps {
  market: string;
  timeframe?: string;
  chartType?: 'candle' | 'line' | 'heikin-ashi' | 'renko' | 'point-figure';
  indicators?: {
    sma?: { period: number; color?: string }[];
    ema?: { period: number; color?: string }[];
    rsi?: { period?: number; visible?: boolean };
    macd?: { visible?: boolean };
    bollinger?: { period?: number; stdDev?: number; visible?: boolean };
    vwap?: { visible?: boolean };
  };
  showDrawingTools?: boolean;
}

export default function AdvancedChart({ 
  market, 
  timeframe = '15m', 
  chartType = 'candle',
  indicators = {},
  showDrawingTools = true,
}: AdvancedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [candles, setCandles] = useState<Candlestick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Fetch and update candlestick data
  useEffect(() => {
    let mounted = true;

    const fetchCandlesticks = async () => {
      setIsLoading(true);
      setError(null);

      try {
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
          // Convert to Heikin Ashi if needed
          const processedData = chartType === 'heikin-ashi' 
            ? convertToHeikinAshi(data)
            : data;

          setCandles(processedData);
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

    // Subscribe to real-time updates
    const unsubscribe = priceService.subscribeToCandlesticks(market, timeframe, (candlestick) => {
      if (!mounted || !chartRef.current) return;

      setCandles(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(c => c.time === candlestick.time);
        
        if (existingIndex >= 0) {
          updated[existingIndex] = chartType === 'heikin-ashi' 
            ? convertToHeikinAshi([candlestick])[0]
            : candlestick;
        } else {
          const newCandle = chartType === 'heikin-ashi' 
            ? convertToHeikinAshi([candlestick])[0]
            : candlestick;
          updated.push(newCandle);
          if (updated.length > 500) updated.shift();
        }

        return updated;
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [market, timeframe, chartType]);

  // Update chart with candlestick data
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    // Convert candles to lightweight-charts format
    const chartData = candles.map(c => ({
      time: (c.time / 1000) as any, // Convert to seconds
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    // Create or update candlestick series
    if (chartType === 'candle' || chartType === 'heikin-ashi') {
      if (!candlestickSeriesRef.current) {
        const series = chartRef.current.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });
        candlestickSeriesRef.current = series;
      }
      candlestickSeriesRef.current.setData(chartData);
    } else if (chartType === 'line') {
      if (!lineSeriesRef.current) {
        const series = chartRef.current.addLineSeries({
          color: '#6366f1',
          lineWidth: 2,
        });
        lineSeriesRef.current = series;
      }
      const closeData = chartData.map(d => ({ time: d.time, value: d.close }));
      lineSeriesRef.current.setData(closeData);
    }

    chartRef.current.timeScale().fitContent();
  }, [candles, chartType]);

  // Add technical indicators
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    const closes = candles.map(c => c.close);

    // SMA indicators
    if (indicators.sma) {
      indicators.sma.forEach(({ period, color = '#3b82f6' }) => {
        const sma = calculateSMA(closes, period);
        const key = `sma_${period}`;
        
        if (!indicatorSeriesRef.current.has(key)) {
          const series = chartRef.current!.addLineSeries({
            color,
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            title: `SMA ${period}`,
          });
          indicatorSeriesRef.current.set(key, series);
        }

        const series = indicatorSeriesRef.current.get(key)!;
        const data = candles.map((c, i) => ({
          time: (c.time / 1000) as any,
          value: sma[i],
        })).filter(d => !isNaN(d.value));
        
        series.setData(data);
      });
    }

    // EMA indicators
    if (indicators.ema) {
      indicators.ema.forEach(({ period, color = '#8b5cf6' }) => {
        const ema = calculateEMA(closes, period);
        const key = `ema_${period}`;
        
        if (!indicatorSeriesRef.current.has(key)) {
          const series = chartRef.current!.addLineSeries({
            color,
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            title: `EMA ${period}`,
          });
          indicatorSeriesRef.current.set(key, series);
        }

        const series = indicatorSeriesRef.current.get(key)!;
        const data = candles.map((c, i) => ({
          time: (c.time / 1000) as any,
          value: ema[i],
        })).filter(d => !isNaN(d.value));
        
        series.setData(data);
      });
    }

    // Bollinger Bands
    if (indicators.bollinger?.visible) {
      const { period = 20, stdDev = 2 } = indicators.bollinger;
      const bb = calculateBollingerBands(closes, period, stdDev);
      
      ['upper', 'middle', 'lower'].forEach((band, idx) => {
        const key = `bb_${band}`;
        const color = idx === 0 ? '#f59e0b' : idx === 1 ? '#6366f1' : '#f59e0b';
        
        if (!indicatorSeriesRef.current.has(key)) {
          const series = chartRef.current!.addLineSeries({
            color,
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            title: `BB ${band}`,
          });
          indicatorSeriesRef.current.set(key, series);
        }

        const series = indicatorSeriesRef.current.get(key)!;
        const data = candles.map((c, i) => ({
          time: (c.time / 1000) as any,
          value: bb[band as 'upper' | 'middle' | 'lower'][i],
        })).filter(d => !isNaN(d.value));
        
        series.setData(data);
      });
    }

    // VWAP
    if (indicators.vwap?.visible) {
      const vwap = calculateVWAP(candles);
      const key = 'vwap';
      
      if (!indicatorSeriesRef.current.has(key)) {
        const series = chartRef.current!.addLineSeries({
          color: '#ec4899',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          title: 'VWAP',
        });
        indicatorSeriesRef.current.set(key, series);
      }

      const series = indicatorSeriesRef.current.get(key)!;
      const data = candles.map((c, i) => ({
        time: (c.time / 1000) as any,
        value: vwap[i],
      })).filter(d => !isNaN(d.value));
      
      series.setData(data);
    }
  }, [candles, indicators]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <span className="text-gray-400 text-sm">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500" />
          <div>
            <h3 className="text-white font-semibold mb-1">Unable to load chart</h3>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Live indicator */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 px-2 py-1 glass rounded-lg border border-white/10">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-bull-500" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-bull-500 animate-ping opacity-75" />
        </div>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}








