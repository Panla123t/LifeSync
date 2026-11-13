'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import TermsContent from '@/components/legal/TermsContent';
import { Activity, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const isThai = locale === 'th';

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-teal-200/30 dark:bg-teal-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-200/20 dark:bg-amber-950/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isThai ? 'ย้อนกลับ' : 'Go back'}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2 rounded-xl shadow-xs">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {t.common.appName}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {isThai ? 'ข้อกำหนดการใช้งาน (Terms of Use)' : 'Terms of Use'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isThai
                  ? 'ข้อกำหนดและเงื่อนไขการใช้บริการเว็บแอปพลิเคชัน LifeSync และบอท LINE ซันนี่'
                  : 'Terms and conditions governing your use of LifeSync web application and LINE bot Sunny'}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <TermsContent locale={locale} />
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link
              href="/privacy"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              {isThai ? 'ดูนโยบายความเป็นส่วนตัว (Privacy Policy) →' : 'View Privacy Policy →'}
            </Link>

            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
            >
              {isThai ? 'ไปที่หน้าลงทะเบียน' : 'Go to Register'}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-400">
        <p>© 2026 LifeSync. {isThai ? 'สงวนลิขสิทธิ์ทุกประการ' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
