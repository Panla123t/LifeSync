'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95"
      title="Switch Language / เปลี่ยนภาษา"
    >
      <Globe className="h-3.5 w-3.5 text-emerald-600" />
      <span>{locale === 'th' ? 'TH | EN' : 'EN | TH'}</span>
    </button>
  );
}
