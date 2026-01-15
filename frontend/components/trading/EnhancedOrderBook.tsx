'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Layers, ArrowUpDown, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Tooltip } from '@/components/ui/Tooltip';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  percentage: number;
}

interface EnhancedOrderBookProps {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  lastPrice: number;
  priceChange: number;
  spread: number;
  spreadPercentage: number;
  onPriceClick?: (price: number) => void;
  className?: string;
}

type ViewMode = 'both' | 'bids' | 'asks';
type GroupingLevel = 0.01 | 0.1 | 1 | 10 | 100;

const OrderRow = memo(function OrderRow({
  entry,
  side,
  maxTotal,
  onPriceClick,
  showFlash,
}: {
  entry: OrderBookEntry;
  side: 'bid' | 'ask';
  maxTotal: number;
  onPriceClick?: (price: number) => void;
  showFlash?: boolean;
}) {
  const barWidth = (entry.total / maxTotal) * 100;
  const isBid = side === 'bid';

  return (
    <motion.div
      initial={showFlash ? { backgroundColor: isBid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)' } : undefined}
      animate={{ backgroundColor: 'transparent' }}
      transition={{ duration: 0.5 }}
      onClick={() => onPriceClick?.(entry.price)}
      className="relative flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-gray-800/30 group"
    >
      {/* Background bar */}
      <div
        className={cn(
          'absolute inset-y-0 transition-all duration-300',
          isBid ? 'right-0 bg-green-500/10' : 'left-0 bg-red-500/10'
        )}
        style={{ width: `${barWidth}%` }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between w-full gap-4 text-sm font-mono">
        <span className={cn('font-medium', isBid ? 'text-green-400' : 'text-red-400')}>
          {entry.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-gray-400">
          {entry.quantity.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </span>
        <span className="text-gray-500 text-right min-w-[80px]">
          {entry.total.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </span>
      </div>

      {/* Hover indicator */}
      <div className={cn(
        'absolute inset-y-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
        isBid ? 'right-0 bg-green-500' : 'left-0 bg-red-500'
      )} />
    </motion.div>
  );
});

export function EnhancedOrderBook({
  asks,
  bids,
  lastPrice,
  priceChange,
  spread,
  spreadPercentage,
  onPriceClick,
  className,
}: EnhancedOrderBookProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [grouping, setGrouping] = useState<GroupingLevel>(0.01);
  const [showSettings, setShowSettings] = useState(false);
  const [rowCount, setRowCount] = useState(12);

  // Calculate max total for bar width
  const maxTotal = useMemo(() => {
    const allTotals = [...asks, ...bids].map(e => e.total);
    return Math.max(...allTotals, 0);
  }, [asks, bids]);

  // Grouped/filtered entries
  const displayAsks = useMemo(() => {
    if (viewMode === 'bids') return [];
    return asks.slice(0, viewMode === 'both' ? rowCount / 2 : rowCount).reverse();
  }, [asks, viewMode, rowCount]);

  const displayBids = useMemo(() => {
    if (viewMode === 'asks') return [];
    return bids.slice(0, viewMode === 'both' ? rowCount / 2 : rowCount);
  }, [bids, viewMode, rowCount]);

  const priceChangeColor = priceChange >= 0 ? 'text-green-400' : 'text-red-400';
  const priceChangeBg = priceChange >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <div className={cn('bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-sm">Order Book</h3>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-800/50 rounded-lg p-0.5">
            <Tooltip content="Show both asks and bids">
              <button
                onClick={() => setViewMode('both')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'both' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <Layers className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Show only bids">
              <button
                onClick={() => setViewMode('bids')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'bids' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <div className="w-4 h-4 flex flex-col justify-end">
                  <div className="h-2 w-full bg-current rounded-t" />
                </div>
              </button>
            </Tooltip>
            <Tooltip content="Show only asks">
              <button
                onClick={() => setViewMode('asks')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'asks' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <div className="w-4 h-4 flex flex-col">
                  <div className="h-2 w-full bg-current rounded-b" />
                </div>
              </button>
            </Tooltip>
          </div>

          {/* Grouping Selector */}
          <select
            value={grouping}
            onChange={(e) => setGrouping(Number(e.target.value) as GroupingLevel)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-500/50"
          >
            <option value={0.01}>0.01</option>
            <option value={0.1}>0.1</option>
            <option value={1}>1</option>
            <option value={10}>10</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-b border-gray-800/50">
        <span>Price (USD)</span>
        <span>Amount</span>
        <span className="text-right min-w-[80px]">Total</span>
      </div>

      {/* Asks (sells) - reversed to show lowest at bottom */}
      <div className="flex-1 overflow-hidden">
        {viewMode !== 'bids' && (
          <div className="flex flex-col-reverse">
            {displayAsks.map((entry, i) => (
              <OrderRow
                key={`ask-${i}`}
                entry={entry}
                side="ask"
                maxTotal={maxTotal}
                onPriceClick={onPriceClick}
              />
            ))}
          </div>
        )}

        {/* Spread / Last Price */}
        <div className={cn('flex items-center justify-center gap-3 py-3 border-y border-gray-800/50', priceChangeBg)}>
          <AnimatedNumber
            value={lastPrice}
            prefix="$"
            decimals={2}
            colorChange
            size="lg"
            className="font-bold"
          />
          <span className={cn('text-sm flex items-center gap-1', priceChangeColor)}>
            {priceChange >= 0 ? '↑' : '↓'}
            {Math.abs(priceChange).toFixed(2)}%
          </span>
        </div>

        {/* Bids (buys) */}
        {viewMode !== 'asks' && (
          <div>
            {displayBids.map((entry, i) => (
              <OrderRow
                key={`bid-${i}`}
                entry={entry}
                side="bid"
                maxTotal={maxTotal}
                onPriceClick={onPriceClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Spread Info */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-t border-gray-800/50">
        <span>Spread</span>
        <span>
          ${spread.toFixed(2)} ({spreadPercentage.toFixed(3)}%)
        </span>
      </div>
    </div>
  );
}
