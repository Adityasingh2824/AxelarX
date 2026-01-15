'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'gradient' | 'glow' | 'neon';
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'border' | 'none';
  delay?: number;
  className?: string;
}

const variants = {
  default: 'bg-gray-900/80 border border-gray-800',
  glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
  gradient: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700',
  glow: 'bg-gray-900/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]',
  neon: 'bg-black/60 border-2 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3),inset_0_0_20px_rgba(168,85,247,0.1)]',
};

const hoverEffects = {
  lift: {
    rest: { y: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    hover: { y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' },
  },
  scale: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
  },
  glow: {
    rest: { boxShadow: '0 0 0 rgba(6, 182, 212, 0)' },
    hover: { boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)' },
  },
  border: {
    rest: { borderColor: 'rgba(255, 255, 255, 0.1)' },
    hover: { borderColor: 'rgba(6, 182, 212, 0.5)' },
  },
  none: {
    rest: {},
    hover: {},
  },
};

export function AnimatedCard({
  children,
  variant = 'glass',
  hoverEffect = 'lift',
  delay = 0,
  className,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={hoverEffects[hoverEffect].hover}
      className={cn(
        'rounded-2xl p-6 transition-colors duration-300',
        variants[variant],
        className
      )}
      style={hoverEffects[hoverEffect].rest}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Staggered card container for lists
interface AnimatedCardListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function AnimatedCardList({
  children,
  className,
  staggerDelay = 0.1,
}: AnimatedCardListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// List item wrapper
interface AnimatedCardItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedCardItem({ children, className }: AnimatedCardItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
