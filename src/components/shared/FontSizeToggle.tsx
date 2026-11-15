'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export type FontSizeTier = 'normal' | 'large' | 'xl';

export default function FontSizeToggle() {
  const { locale } = useLanguage();
  const [fontSize, setFontSizeState] = useState<FontSizeTier>('large');

  useEffect(() => {
    const saved = localStorage.getItem('lifesync_font_size') as FontSizeTier | null;
    if (saved === 'normal' || saved === 'large' || saved === 'xl') {
      setFontSizeState(saved);
      document.documentElement.setAttribute('data-font-size', saved);
    } else {
      setFontSizeState('large');
      document.documentElement.setAttribute('data-font-size', 'large');
    }
  }, []);

  const cycleFontSize = () => {
    let next: FontSizeTier = 'large';
    if (fontSize === 'normal') next = 'large';
    else if (fontSize === 'large') next = 'xl';
    else if (fontSize === 'xl') next = 'normal';

    setFontSizeState(next);
    localStorage.setItem('lifesync_font_size', next);
    document.documentElement.setAttribute('data-font-size', next);
  };

  const getLabel = () => {
    if (fontSize === 'normal') return 'A';
    if (fontSize === 'large') return 'A+';
    return 'A++';
  };

  const getTooltip = () => {
    if (locale === 'th') {
      if (fontSize === 'normal') return 'ขนาดตัวอักษร: ปกติ (100%) - แตะเพื่อขยาย';
      if (fontSize === 'large') return 'ขนาดตัวอักษร: ใหญ่ สบายตา (+30%) - แตะเพื่อขยายพิเศษ';
      return 'ขนาดตัวอักษร: ใหญ่พิเศษ (+45%) - โหมดผู้สูงอายุ';
    }
    if (fontSize === 'normal') return 'Font size: Standard (100%) - Tap to enlarge';
    if (fontSize === 'large') return 'Font size: Large (+30%) - Tap for Extra Large';
    return 'Font size: Extra Large (+45%) - Senior Mode';
  };

  return (
    <button
      type="button"
      onClick={cycleFontSize}
      className="inline-flex items-center justify-center px-2 py-1.5 rounded-full text-xs font-black tracking-tight bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-emerald-700 dark:text-emerald-400 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
      title={getTooltip()}
      aria-label="Cycle Font Size"
    >
      <span>{getLabel()}</span>
    </button>
  );
}