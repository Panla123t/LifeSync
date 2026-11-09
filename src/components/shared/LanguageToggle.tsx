'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
      title="Switch Language / เปลี่ยนภาษา"
    >
      <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>{locale === 'th' ? 'TH | EN' : 'EN | TH'}</span>
    </button>
  );
}
