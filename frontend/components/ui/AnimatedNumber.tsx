'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  colorChange?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl font-bold',
};

export function AnimatedNumber({
  value,
  duration = 0.8,
  decimals = 2,
  prefix = '',
  suffix = '',
  className,
  colorChange = false,
  size = 'md',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');

  useEffect(() => {
    const controls = animate(previousValue.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(latest),
    });

    if (value > previousValue.current) {
      setDirection('up');
    } else if (value < previousValue.current) {
      setDirection('down');
    }

    previousValue.current = value;

    // Reset direction after animation
    const timeout = setTimeout(() => setDirection('none'), duration * 1000 + 200);

    return () => {
      controls.stop();
      clearTimeout(timeout);
    };
  }, [value, duration]);

  const colorClass = colorChange
    ? direction === 'up'
      ? 'text-green-400'
      : direction === 'down'
      ? 'text-red-400'
      : 'text-white'
    : '';

  return (
    <motion.span
      key={direction}
      initial={colorChange ? { scale: 1.1 } : undefined}
      animate={{ scale: 1 }}
      className={cn(
        'tabular-nums transition-colors duration-300',
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </motion.span>
  );
}

// Animated counter that counts up from 0
interface AnimatedCounterProps {
  target: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  delay?: number;
}

export function AnimatedCounter({
  target,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  size = 'md',
  delay = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStarted(true);
      const controls = animate(0, target, {
        duration,
        ease: 'easeOut',
        onUpdate: (latest) => setCount(latest),
      });

      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return (
    <span className={cn('tabular-nums', sizeClasses[size], className)}>
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// Animated percentage with circular progress
interface AnimatedPercentageProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  className?: string;
  showValue?: boolean;
  duration?: number;
}

export function AnimatedPercentage({
  value,
  size = 80,
  strokeWidth = 8,
  color = '#06b6d4',
  bgColor = 'rgba(255,255,255,0.1)',
  className,
  showValue = true,
  duration = 1,
}: AnimatedPercentageProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const springValue = useSpring(0, { duration: duration * 1000 });
  const strokeDashoffset = useTransform(
    springValue,
    (v) => circumference - (v / 100) * circumference
  );

  useEffect(() => {
    springValue.set(Math.min(100, Math.max(0, value)));
  }, [value, springValue]);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-medium">
          <AnimatedNumber value={value} decimals={0} suffix="%" duration={duration} />
        </span>
      )}
    </div>
  );
}
