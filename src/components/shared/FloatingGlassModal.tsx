'use client';

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface FloatingGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  badge?: string;
  glowColor?: 'emerald' | 'indigo' | 'sky' | 'amber';
  children: ReactNode;
}

export default function FloatingGlassModal({
  isOpen,
  onClose,
  title,
  icon,
  badge,
  glowColor = 'emerald',
  children,
}: FloatingGlassModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const glowStyles = {
    emerald: 'bg-emerald-400/20 dark:bg-emerald-500/15',
    indigo: 'bg-indigo-500/20 dark:bg-indigo-500/15',
    sky: 'bg-sky-400/20 dark:bg-sky-500/15',
    amber: 'bg-amber-400/20 dark:bg-amber-500/15',
  }[glowColor];

  const ringStyles = {
    emerald: 'ring-emerald-500/20',
    indigo: 'ring-indigo-500/20',
    sky: 'ring-sky-500/20',
    amber: 'ring-amber-500/20',
  }[glowColor];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/50 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Glass Window */}
      <div 
        className={`relative z-10 w-full max-w-md max-h-[88vh] overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white/85 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/80 dark:border-slate-700/60 rounded-t-[36px] sm:rounded-[36px] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ${ringStyles} animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glass Flares clipped to modal shape so they never trigger scrollbars */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
          <div className={`absolute -top-12 -right-12 w-44 h-44 ${glowStyles} rounded-full blur-3xl`} />
          <div className={`absolute -bottom-12 -left-12 w-44 h-44 ${glowStyles} rounded-full blur-3xl`} />
        </div>

        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Window Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {badge}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Window Form Body */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
