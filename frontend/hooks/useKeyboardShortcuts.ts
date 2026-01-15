'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

type KeyHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: KeyHandler;
  description?: string;
  when?: () => boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  ignoreInputs?: boolean;
}

// Global keyboard shortcuts for the trading platform
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, ignoreInputs = true } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : true;

        // Check conditional execution
        if (shortcut.when && !shortcut.when()) continue;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, ignoreInputs]);
}

// Pre-defined trading shortcuts
export function useTradingShortcuts(actions: {
  buy?: () => void;
  sell?: () => void;
  cancelAll?: () => void;
  toggleOrderBook?: () => void;
  toggleChart?: () => void;
  focusPrice?: () => void;
  focusQuantity?: () => void;
  switchMarket?: (direction: 'next' | 'prev') => void;
  toggleFullscreen?: () => void;
  showHelp?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [
    // Trading Actions
    {
      key: 'b',
      handler: actions.buy || (() => {}),
      description: 'Place Buy Order',
    },
    {
      key: 's',
      handler: actions.sell || (() => {}),
      description: 'Place Sell Order',
    },
    {
      key: 'Escape',
      handler: actions.cancelAll || (() => {}),
      description: 'Cancel All Orders',
    },

    // UI Toggles
    {
      key: 'o',
      handler: actions.toggleOrderBook || (() => {}),
      description: 'Toggle Order Book',
    },
    {
      key: 'c',
      handler: actions.toggleChart || (() => {}),
      description: 'Toggle Chart',
    },
    {
      key: 'f',
      handler: actions.toggleFullscreen || (() => {}),
      description: 'Toggle Fullscreen',
    },

    // Market Navigation
    {
      key: 'ArrowLeft',
      alt: true,
      handler: () => actions.switchMarket?.('prev'),
      description: 'Previous Market',
    },
    {
      key: 'ArrowRight',
      alt: true,
      handler: () => actions.switchMarket?.('next'),
      description: 'Next Market',
    },

    // Focus Fields
    {
      key: 'p',
      handler: actions.focusPrice || (() => {}),
      description: 'Focus Price Input',
    },
    {
      key: 'q',
      handler: actions.focusQuantity || (() => {}),
      description: 'Focus Quantity Input',
    },

    // Help
    {
      key: '/',
      shift: true,
      handler: actions.showHelp || (() => {}),
      description: 'Show Keyboard Shortcuts',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Keyboard shortcuts help modal content
export const TRADING_SHORTCUTS = [
  { category: 'Trading', shortcuts: [
    { keys: ['B'], description: 'Place Buy Order' },
    { keys: ['S'], description: 'Place Sell Order' },
    { keys: ['Esc'], description: 'Cancel All Orders' },
  ]},
  { category: 'Navigation', shortcuts: [
    { keys: ['Alt', '←'], description: 'Previous Market' },
    { keys: ['Alt', '→'], description: 'Next Market' },
    { keys: ['P'], description: 'Focus Price Input' },
    { keys: ['Q'], description: 'Focus Quantity Input' },
  ]},
  { category: 'View', shortcuts: [
    { keys: ['O'], description: 'Toggle Order Book' },
    { keys: ['C'], description: 'Toggle Chart' },
    { keys: ['F'], description: 'Toggle Fullscreen' },
    { keys: ['?'], description: 'Show Help' },
  ]},
];

// Keyboard shortcuts help modal component
export function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {TRADING_SHORTCUTS.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <div 
                    key={shortcut.description}
                    className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded font-mono">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-gray-500 mx-1">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-700 rounded font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
