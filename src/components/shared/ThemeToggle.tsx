'use client';

import { useTheme } from '@/lib/theme/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { locale } = useLanguage();

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center p-2 rounded-full text-xs font-semibold bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
      title={
        isDark
          ? (locale === 'th' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'Switch to Light Mode')
          : (locale === 'th' ? 'เปลี่ยนเป็นโหมดมืด' : 'Switch to Dark Mode')
      }
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
