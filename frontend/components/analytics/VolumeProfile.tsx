'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Candlestick } from '@/lib/priceService';
import { formatPrice } from '@/utils/format';

interface VolumeProfileProps {
  candles: Candlestick[];
  isLoading: boolean;
}

export default function VolumeProfile({ candles, isLoading }: VolumeProfileProps) {
  const profileData = useMemo(() => {
    if (candles.length === 0) return null;

    // Create price buckets
    const prices = candles.flatMap(c => [c.high, c.low, c.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const bucketCount = 50;
    const bucketSize = priceRange / bucketCount;

    // Initialize buckets
    const buckets: { price: number; volume: number }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      buckets.push({
        price: minPrice + (i * bucketSize) + (bucketSize / 2),
        volume: 0,
      });
    }

    // Distribute volume to buckets
    candles.forEach(candle => {
      const priceRange = candle.high - candle.low;
      if (priceRange === 0) {
        // All volume at one price
        const bucketIndex = Math.floor((candle.close - minPrice) / bucketSize);
        if (bucketIndex >= 0 && bucketIndex < bucketCount) {
          buckets[bucketIndex].volume += candle.volume;
        }
      } else {
        // Distribute volume proportionally across price range
        const steps = Math.max(1, Math.floor(priceRange / bucketSize));
        const volumePerStep = candle.volume / steps;
        
        for (let step = 0; step < steps; step++) {
          const price = candle.low + (step * bucketSize);
          const bucketIndex = Math.floor((price - minPrice) / bucketSize);
          if (bucketIndex >= 0 && bucketIndex < bucketCount) {
            buckets[bucketIndex].volume += volumePerStep;
          }
        }
      }
    });

    const maxVolume = Math.max(...buckets.map(b => b.volume), 0);
    const poc = buckets.reduce((max, bucket) => 
      bucket.volume > max.volume ? bucket : max
    );

    return {
      buckets: buckets.filter(b => b.volume > 0),
      maxVolume,
      poc, // Point of Control (highest volume price)
      valueArea: calculateValueArea(buckets, poc.price),
    };
  }, [candles]);

  function calculateValueArea(buckets: { price: number; volume: number }[], pocPrice: number) {
    // Value Area = 70% of total volume
    const totalVolume = buckets.reduce((sum, b) => sum + b.volume, 0);
    const targetVolume = totalVolume * 0.7;

    // Sort buckets by distance from POC
    const sorted = [...buckets].sort((a, b) => 
      Math.abs(a.price - pocPrice) - Math.abs(b.price - pocPrice)
    );

    let accumulatedVolume = 0;
    const valueAreaPrices: number[] = [];

    for (const bucket of sorted) {
      accumulatedVolume += bucket.volume;
      valueAreaPrices.push(bucket.price);
      if (accumulatedVolume >= targetVolume) break;
    }

    return {
      high: Math.max(...valueAreaPrices),
      low: Math.min(...valueAreaPrices),
    };
  }

  if (isLoading) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-gray-400">Loading volume profile...</div>
      </div>
    );
  }

  if (!profileData || profileData.buckets.length === 0) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-gray-400">No volume data available</div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <h3 className="font-semibold text-white mb-2">Volume Profile</h3>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">POC: </span>
            <span className="text-primary-400 font-mono font-semibold">
              {formatPrice(profileData.poc.price)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Value Area: </span>
            <span className="text-white font-mono">
              {formatPrice(profileData.valueArea.low)} - {formatPrice(profileData.valueArea.high)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-end gap-1 h-full">
          {profileData.buckets.map((bucket, index) => {
            const heightPercent = (bucket.volume / profileData.maxVolume) * 100;
            const isPOC = Math.abs(bucket.price - profileData.poc.price) < 0.01;
            const inValueArea = bucket.price >= profileData.valueArea.low && 
                               bucket.price <= profileData.valueArea.high;

            return (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ delay: index * 0.01 }}
                className={`flex-1 rounded-t ${
                  isPOC
                    ? 'bg-primary-500'
                    : inValueArea
                    ? 'bg-primary-500/50'
                    : 'bg-primary-500/20'
                } hover:opacity-80 transition-opacity`}
                style={{ minHeight: '4px' }}
                title={`${formatPrice(bucket.price)}: ${bucket.volume.toFixed(2)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}








