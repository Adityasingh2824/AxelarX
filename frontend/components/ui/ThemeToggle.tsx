'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
      root.classList.toggle('light', !systemDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
      root.classList.toggle('light', theme === 'light');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  if (!mounted) return null;

  const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className={cn('flex bg-gray-800/50 rounded-xl p-1', className)}>
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative flex items-center justify-center p-2 rounded-lg transition-colors',
            theme === value 
              ? 'text-white' 
              : 'text-gray-500 hover:text-gray-300'
          )}
          title={label}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-gray-700 rounded-lg"
              transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            />
          )}
          <Icon className="w-4 h-4 relative z-10" />
        </button>
      ))}
    </div>
  );
}

// Simple toggle between light and dark
export function DarkModeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    document.documentElement.classList.toggle('dark', newValue);
    document.documentElement.classList.toggle('light', !newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        'relative w-14 h-7 bg-gray-700 rounded-full transition-colors',
        isDark ? 'bg-gray-700' : 'bg-amber-400',
        className
      )}
    >
      <motion.div
        animate={{ x: isDark ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center',
          isDark ? 'bg-gray-900' : 'bg-white'
        )}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </motion.div>
    </button>
  );
}
