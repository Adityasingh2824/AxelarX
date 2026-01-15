'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'button';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClass = 'bg-gray-800/50 overflow-hidden relative';
  
  const variantClasses = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
    button: 'rounded-lg h-10',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? 40 : '100%'),
    height: height || (variant === 'circular' ? 40 : variant === 'text' ? 16 : 'auto'),
  };

  return (
    <div
      className={cn(baseClass, variantClasses[variant], className)}
      style={style}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

// Pre-built skeleton components for common use cases

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-gray-900/50 rounded-2xl p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={100} />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="flex-1" />
      </div>
    </div>
  );
}

export function SkeletonOrderBook({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {/* Asks */}
      {Array.from({ length: rows / 2 }).map((_, i) => (
        <div key={`ask-${i}`} className="flex items-center gap-2 px-2 py-1">
          <Skeleton variant="text" width="30%" height={14} />
          <Skeleton variant="text" width="25%" height={14} />
          <div className="flex-1">
            <Skeleton 
              height={18} 
              className="ml-auto bg-red-500/20" 
              style={{ width: `${Math.random() * 60 + 20}%` }} 
            />
          </div>
        </div>
      ))}
      
      {/* Spread */}
      <div className="py-2 px-2">
        <Skeleton variant="text" width="40%" className="mx-auto" />
      </div>
      
      {/* Bids */}
      {Array.from({ length: rows / 2 }).map((_, i) => (
        <div key={`bid-${i}`} className="flex items-center gap-2 px-2 py-1">
          <Skeleton variant="text" width="30%" height={14} />
          <Skeleton variant="text" width="25%" height={14} />
          <div className="flex-1">
            <Skeleton 
              height={18} 
              className="ml-auto bg-green-500/20" 
              style={{ width: `${Math.random() * 60 + 20}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTradeHistory({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-2 py-1.5">
          <Skeleton variant="text" width="25%" height={14} />
          <Skeleton variant="text" width="20%" height={14} />
          <Skeleton variant="text" width="15%" height={14} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="relative bg-gray-900/30 rounded-xl overflow-hidden" style={{ height }}>
      <div className="absolute inset-0 flex items-end justify-around p-4 gap-1">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-700/30 rounded-t flex-1"
            style={{ height: `${Math.random() * 80 + 10}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="flex items-center gap-2 text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Loading chart...</span>
        </motion.div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / cols}%`} height={12} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 p-4 border-b border-gray-800/50">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton 
              key={colIdx} 
              variant="text" 
              width={`${100 / cols}%`} 
              height={14} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-900/50 rounded-xl p-4 space-y-2">
          <Skeleton variant="text" width="50%" height={12} />
          <Skeleton variant="text" width="70%" height={24} />
        </div>
      ))}
    </div>
  );
}
