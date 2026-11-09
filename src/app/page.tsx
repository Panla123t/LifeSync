'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { Activity, Droplets, Utensils, Moon, Trophy, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="px-6 py-5 max-w-lg mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-white p-2 rounded-2xl shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">{t.common.appName}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/login"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-xs"
          >
            {t.common.signIn}
          </Link>
        </div>
      </header>

      {/* Hero Section (Mobile-First) */}
      <main className="px-6 py-8 max-w-lg mx-auto w-full flex-1 flex flex-col justify-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Assisted Everyday Wellness</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t.common.tagline}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t.common.subTagline}
          </p>
        </div>

        {/* Pillar Feature Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">{t.nav.meals}</div>
            <div className="text-[11px] text-slate-500">{t.nutrition.title}</div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">{t.nav.water}</div>
            <div className="text-[11px] text-slate-500">{t.hydration.title}</div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Moon className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">{t.nav.sleep}</div>
            <div className="text-[11px] text-slate-500">{t.sleep.title}</div>
          </div>
        </div>

        {/* Gamification Callout */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
              <Trophy className="h-4 w-4" /> {t.quests.todaysQuests} & {t.common.points}
            </div>
            <div className="text-base font-bold">{t.quests.subtitle}</div>
          </div>
          <div className="bg-white/20 p-2.5 rounded-2xl text-white">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-base"
          >
            {t.common.getStarted}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-center text-xs text-slate-500">
            {t.common.disclaimer}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        &copy; 2026 LifeSync. All rights reserved.
      </footer>
    </div>
  );
}
