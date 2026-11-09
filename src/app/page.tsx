'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { 
  Activity, 
  Droplets, 
  Utensils, 
  Moon, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Heart
} from 'lucide-react';

export default function HomePage() {
  const { t, locale } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="px-5 py-4 max-w-lg mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2.5 rounded-2xl shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
            <Activity className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {t.common.appName}
            </span>
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-600">
              Wellness Tracker
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/login"
            className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white/90 backdrop-blur-md border border-slate-200/80 px-3.5 py-2 rounded-2xl shadow-xs transition-all active:scale-95"
          >
            {t.common.signIn}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 py-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-center space-y-7">
        
        {/* Hero Tag & Headline */}
        <div className="space-y-3.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>{locale === 'th' ? 'นวัตกรรมดูแล 3 ด้านสุขภาพประจำวัน' : 'AI-Assisted Everyday Wellness'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.25]">
            {locale === 'th' ? (
              <>
                ติดตามพฤติกรรม <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                  เข้าใจสุขภาพ
                </span>{' '}
                สร้างชีวิตที่ดีขึ้น
              </>
            ) : (
              <>
                Track your habits. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                  Understand your health.
                </span>{' '}
                Build a better life.
              </>
            )}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
            {t.common.subTagline}
          </p>
        </div>

        {/* Live App Interactive Showcase Mockup */}
        <div className="bg-white/80 backdrop-blur-xl p-4.5 rounded-[28px] border border-slate-200/70 shadow-[0_12px_36px_rgba(0,0,0,0.06)] space-y-3.5">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{locale === 'th' ? 'ภาพรวมชีวิตวันนี้' : "Today's Synergy"}</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +35 {t.common.pts}
            </span>
          </div>

          {/* 3 Interactive Habit Mini-Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-amber-50/70 border border-amber-200/50 p-2.5 rounded-2xl text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Utensils className="h-3.5 w-3.5" />
              </div>
              <div className="text-[11px] font-bold text-slate-800">{t.nav.meals}</div>
              <div className="text-[10px] text-amber-700 font-semibold">3 {t.dashboard.mealsLogged}</div>
            </div>

            <div className="bg-sky-50/70 border border-sky-200/50 p-2.5 rounded-2xl text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Droplets className="h-3.5 w-3.5" />
              </div>
              <div className="text-[11px] font-bold text-slate-800">{t.nav.water}</div>
              <div className="text-[10px] text-sky-700 font-semibold">1,750 ml</div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200/50 p-2.5 rounded-2xl text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <Moon className="h-3.5 w-3.5" />
              </div>
              <div className="text-[11px] font-bold text-slate-800">{t.nav.sleep}</div>
              <div className="text-[10px] text-indigo-700 font-semibold">7h 30m</div>
            </div>
          </div>

          {/* AI Gentle Insight Preview */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3.5 rounded-2xl shadow-sm text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-100 text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>LifeSync AI Coach</span>
            </div>
            <p className="text-[11px] text-emerald-50 leading-relaxed">
              {locale === 'th'
                ? '“วันนี้คุณดื่มน้ำได้สม่ำเสมอและเข้านอนตรงเวลามาก สุขภาพที่ดีเริ่มจากการทำทีละน้อยอย่างสม่ำเสมอครับ!”'
                : '“You maintained great hydration and consistent sleep rhythm today. Great progress!”'}
            </p>
          </div>
        </div>

        {/* 3 Pillar Value Propositions */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                {locale === 'th' ? 'บันทึกง่าย รวดเร็ว ภายใน 5 วินาที' : 'Quick 5-Second Logging'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {locale === 'th' 
                  ? 'ปุ่มบันทึกน้ำ 1-tap, จดมื้ออาหารด้วย AI และบันทึกเวลานอนข้ามเที่ยงคืนได้แม่นยำ'
                  : '1-tap water logger, AI food estimation, and smart sleep schedule calculator.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                {locale === 'th' ? 'สร้างวินัยด้วยเควสต์และแต้มสะสม' : 'Motivating Quests & Points'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {locale === 'th'
                  ? 'ให้รางวัลกับความต่อเนื่อง ไม่กดดัน ไม่เน้นอดอาหาร ไม่มีการลงโทษ'
                  : 'Rewards healthy consistency over perfection, with zero shame or restrictive rules.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl mt-0.5">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                {locale === 'th' ? 'แจ้งเตือนผ่าน LINE Official Account' : 'LINE Official Account Reminders'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {locale === 'th'
                  ? 'เตือนดื่มน้ำและเตรียมเข้านอนอย่างอ่อนโยนผ่าน LINE ที่คุณใช้งานอยู่ทุกวัน'
                  : 'Gentle hydration and sleep routine check-ins delivered right to your LINE chat.'}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-1">
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-[0_8px_25px_rgba(16,185,129,0.35)] transition-all active:scale-95 text-base"
          >
            <span>{t.common.getStarted}</span>
            <ArrowRight className="h-5 w-5" />
          </Link>

          <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t.common.noCreditCard} • Non-medical wellness</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-slate-400">
        &copy; 2026 LifeSync. Built for everyday balance & healthy habits.
      </footer>
    </div>
  );
}
