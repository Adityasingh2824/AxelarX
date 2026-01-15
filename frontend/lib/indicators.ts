/**
 * Technical Indicators Library
 * Calculations for RSI, MACD, Bollinger Bands, Moving Averages, etc.
 */

export interface Candlestick {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[i]);
    } else if (i < period - 1) {
      ema.push(NaN);
    } else {
      const prevEMA = ema[i - 1] || data[i - 1];
      const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
      ema.push(currentEMA);
    }
  }
  return ema;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(NaN);
    } else {
      const recentChanges = changes.slice(i - period, i);
      const gains = recentChanges.filter(c => c > 0);
      const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
      
      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsiValue = 100 - (100 / (1 + rs));
        rsi.push(rsiValue);
      }
    }
  }
  
  return rsi;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macd: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macd.push(NaN);
    } else {
      macd.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  const signal = calculateEMA(macd.filter(v => !isNaN(v)), signalPeriod);
  const histogram: number[] = [];
  
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i]) || isNaN(signal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macd[i] - signal[i]);
    }
  }
  
  return { macd, signal, histogram };
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const sma = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + (standardDeviation * stdDev));
      lower.push(mean - (standardDeviation * stdDev));
    }
  }
  
  return { upper, middle: sma, lower };
}

/**
 * Heikin Ashi conversion
 */
export function convertToHeikinAshi(candles: Candlestick[]): Candlestick[] {
  const heikinAshi: Candlestick[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const prev = i > 0 ? heikinAshi[i - 1] : candles[i];
    const current = candles[i];
    
    const haClose = (current.open + current.high + current.low + current.close) / 4;
    const haOpen = i === 0 
      ? (current.open + current.close) / 2 
      : (prev.open + prev.close) / 2;
    const haHigh = Math.max(current.high, haOpen, haClose);
    const haLow = Math.min(current.low, haOpen, haClose);
    
    heikinAshi.push({
      time: current.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: current.volume,
    });
  }
  
  return heikinAshi;
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candlestick[]): number[] {
  const vwap: number[] = [];
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const tpv = typicalPrice * candle.volume;
    
    cumulativeTPV += tpv;
    cumulativeVolume += candle.volume;
    
    vwap.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : NaN);
  }
  
  return vwap;
}

/**
 * Average True Range (ATR)
 */
export function calculateATR(candles: Candlestick[], period: number = 14): number[] {
  const tr: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }
  
  return calculateSMA(tr, period);
}

/**
 * Stochastic Oscillator
 */
export function calculateStochastic(
  candles: Candlestick[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  const k: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN);
    } else {
      const slice = candles.slice(i - kPeriod + 1, i + 1);
      const highestHigh = Math.max(...slice.map(c => c.high));
      const lowestLow = Math.min(...slice.map(c => c.low));
      const currentClose = candles[i].close;
      
      if (highestHigh === lowestLow) {
        k.push(50);
      } else {
        k.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
      }
    }
  }
  
  const d = calculateSMA(k.filter(v => !isNaN(v)), dPeriod);
  
  return { k, d };
}








