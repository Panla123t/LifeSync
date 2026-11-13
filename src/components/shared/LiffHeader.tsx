'use client';

import React from 'react';
import { useLiff } from '@/lib/liff/LiffContext';
import { X, CheckCircle2 } from 'lucide-react';

export default function LiffHeader() {
  const { isInClient, closeLiff, profile } = useLiff();

  if (!isInClient) return null;

  return (
    <div className="bg-emerald-600/90 dark:bg-emerald-950/90 backdrop-blur-md text-white text-xs px-4 py-2 flex items-center justify-between border-b border-emerald-500/30 sticky top-0 z-50 transition-all">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
        <span className="font-semibold tracking-wide flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
          LINE In-App {profile?.displayName ? `• ${profile.displayName}` : ''}
        </span>
      </div>
      <button
        onClick={closeLiff}
        type="button"
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full font-medium text-[11px] transition-colors active:scale-95 cursor-pointer"
      >
        <span>ปิด (กลับห้องแชท)</span>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
