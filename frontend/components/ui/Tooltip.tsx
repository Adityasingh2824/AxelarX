'use client';

import { useState, ReactNode, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
  contentClassName,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        
        let x = rect.left + scrollX + rect.width / 2;
        let y = rect.top + scrollY;
        
        switch (position) {
          case 'bottom':
            y = rect.bottom + scrollY + 8;
            break;
          case 'left':
            x = rect.left + scrollX - 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
          case 'right':
            x = rect.right + scrollX + 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
          default: // top
            y = rect.top + scrollY - 8;
        }
        
        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getTransformOrigin = () => {
    switch (position) {
      case 'bottom': return 'top center';
      case 'left': return 'center right';
      case 'right': return 'center left';
      default: return 'bottom center';
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'bottom':
        return { left: coords.x, top: coords.y, transform: 'translateX(-50%)' };
      case 'left':
        return { left: coords.x, top: coords.y, transform: 'translate(-100%, -50%)' };
      case 'right':
        return { left: coords.x, top: coords.y, transform: 'translateY(-50%)' };
      default: // top
        return { left: coords.x, top: coords.y, transform: 'translate(-50%, -100%)' };
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={cn('inline-flex', className)}
      >
        {children}
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ 
                ...getPositionStyles(),
                transformOrigin: getTransformOrigin(),
                position: 'absolute',
                zIndex: 9999,
              }}
              className={cn(
                'px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg shadow-xl',
                'max-w-xs whitespace-normal',
                contentClassName
              )}
            >
              {content}
              {/* Arrow */}
              <div
                className={cn(
                  'absolute w-2 h-2 bg-gray-900 border-gray-700 rotate-45',
                  position === 'top' && 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r',
                  position === 'bottom' && 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l',
                  position === 'left' && 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r',
                  position === 'right' && 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// Info tooltip with icon
interface InfoTooltipProps {
  content: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InfoTooltip({ content, size = 'sm', className }: InfoTooltipProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Tooltip content={content} className={className}>
      <button className="text-gray-500 hover:text-gray-300 transition-colors">
        <svg className={sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </Tooltip>
  );
}
