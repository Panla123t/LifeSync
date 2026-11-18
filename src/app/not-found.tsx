'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import ThemeToggle from '@/components/shared/ThemeToggle';
import LanguageToggle from '@/components/shared/LanguageToggle';
import {
  Activity,
  Home,
  LayoutDashboard,
  Utensils,
  Droplets,
  Moon,
  Trophy,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function NotFound() {
  const { t, locale } = useLanguage();
  const isThai = locale === 'th';

  const quickLinks = [
    {
      href: '/dashboard',
      label: t.nav.home,
      desc: isThai ? 'ภาพรวมสุขภาพและสรุปประจำวัน' : 'Daily health summary & snapshot',
      icon: LayoutDashboard,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
    },
    {
      href: '/nutrition',
      label: t.nav.meals,
      desc: isThai ? 'วิเคราะห์อาหาร & แคลอรี่ด้วย AI' : 'AI meal analysis & calories',
      icon: Utensils,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
    },
    {
      href: '/hydration',
      label: t.nav.water,
      desc: isThai ? 'บันทึกดื่มน้ำ 1-tap สู่เป้าหมาย 2L' : '1-tap water logger for 2L goal',
      icon: Droplets,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40',
    },
    {
      href: '/sleep',
      label: t.nav.sleep,
      desc: isThai ? 'คำนวณเวลานอน & งีบกลางวัน' : 'Sleep rhythm & power nap tracker',
      icon: Moon,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-950/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-200/20 dark:bg-teal-950/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-200/20 dark:bg-amber-950/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2 rounded-2xl shadow-[0_4px_14px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white block leading-tight">
                {t.common.appName}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                Wellness Tracker
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <Link
              href="/dashboard"
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.nav.home}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main 404 Hero Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex-1 flex flex-col justify-center items-center text-center space-y-8">
        
        {/* Mascot & 404 Status Pill */}
        <div className="relative flex flex-col items-center">
          <div className="relative mb-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gradient-to-tr from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/30 border-4 border-amber-300/80 dark:border-amber-700/60 shadow-[0_8px_30px_rgba(245,158,11,0.25)] flex items-center justify-center relative">
              <Image
                src="/mascot/sunny-avatar.jpg"
                alt="Coach Sunny"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md border-2 border-white dark:border-slate-900">
              <HelpCircle className="h-4 w-4" />
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-black tracking-wider uppercase text-slate-600 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.notFound.badge}</span>
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-3 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t.notFound.heading}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t.notFound.description}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 text-sm cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>{t.notFound.backHome}</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-all active:scale-95 text-sm cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>{t.notFound.goToDashboard}</span>
          </Link>
        </div>

        {/* Recommended Quick Links (Responsive Grid for PC & Mobile) */}
        <div className="w-full pt-6 border-t border-slate-200/70 dark:border-slate-800/70 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.notFound.quickLinksTitle}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; 2026 LifeSync. Built for everyday balance & healthy habits.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? 'ข้อกำหนด' : 'Terms'}
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? 'ความเป็นส่วนตัว' : 'Privacy'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
