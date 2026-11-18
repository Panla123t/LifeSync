'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
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
  Heart,
  LayoutDashboard,
  MessageCircle,
  Zap,
  Flame,
  Award
} from 'lucide-react';

export default function HomePage() {
  const { t, locale } = useLanguage();
  const isThai = locale === 'th';

  // If user lands with Supabase access_token hash (e.g. from magic link), consume session and route to /dashboard
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          window.location.href = '/dashboard';
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          window.location.href = '/dashboard';
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 md:w-[600px] h-96 md:h-[600px] bg-emerald-200/35 dark:bg-emerald-950/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 md:w-[650px] h-96 md:h-[650px] bg-sky-200/30 dark:bg-sky-950/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 md:w-[600px] h-96 md:h-[600px] bg-indigo-200/25 dark:bg-indigo-950/20 rounded-full blur-3xl" />
      </div>

      {/* Top Header - Responsive PC & Mobile */}
      <header className="w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2.5 rounded-2xl shadow-[0_4px_14px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {t.common.appName}
              </span>
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                Health & Habit Tracker
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#pillars" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? '3 สมดุลหลัก' : '3 Pillars'}
            </a>
            <a href="#coach" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? 'โค้ชซันนี่ AI' : 'Sunny AI Coach'}
            </a>
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? 'ภารกิจ & รางวัล' : 'Quests & Rewards'}
            </a>
            <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{isThai ? 'แดชบอร์ด' : 'Dashboard'}</span>
            </Link>
          </nav>

          {/* Header Controls & Sign-In */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle />
            <LanguageToggle />
            
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {t.common.signIn}
            </Link>

            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2 rounded-2xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all active:scale-95 cursor-pointer"
            >
              <span>{t.common.getStarted}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1">
        
        {/* Hero Section - Responsive Grid for PC & Mobile */}
        <section className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>{isThai ? 'นวัตกรรมดูแล 3 ด้านสุขภาพประจำวัน' : 'AI-Assisted Everyday Wellness'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                {isThai ? (
                  <>
                    ติดตามพฤติกรรม <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 dark:from-emerald-400 dark:via-teal-400 dark:to-sky-400 bg-clip-text text-transparent">
                      เข้าใจสุขภาพ
                    </span>{' '}
                    สร้างชีวิตที่ดีขึ้น
                  </>
                ) : (
                  <>
                    Track your habits. <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 dark:from-emerald-400 dark:via-teal-400 dark:to-sky-400 bg-clip-text text-transparent">
                      Understand your health.
                    </span>{' '}
                    Build a better life.
                  </>
                )}
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                {t.common.subTagline}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-4 px-8 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-[0_8px_25px_rgba(16,185,129,0.35)] transition-all active:scale-95 text-base cursor-pointer"
                >
                  <span>{t.common.getStarted}</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-all active:scale-95 text-base cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{isThai ? 'ทดลองเปิดแดชบอร์ด' : 'View Live Demo'}</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 pt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.common.noCreditCard}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isThai ? 'แจ้งเตือนผ่าน LINE OA' : 'LINE Official Account Sync'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isThai ? 'ดูแลอย่างอ่อนโยน ไร้ความกดดัน' : 'Non-medical wellness companion'}</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Live Interactive Mockup Showcase */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              <div className="relative">
                {/* Glow ring behind card */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[32px] blur-xl opacity-20 dark:opacity-30 pointer-events-none" />

                <div className="relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl p-5 sm:p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4">
                  {/* Mockup Header with Coach Sunny */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-100 border-2 border-amber-300 shrink-0 relative">
                        <Image
                          src="/mascot/sunny-avatar.jpg"
                          alt="Coach Sunny"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            ซันนี่ (Sunny AI)
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                          {isThai ? 'ภาพรวมชีวิตวันนี้' : "Today's Synergy"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 px-2.5 py-1 rounded-full">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <span>+35 {t.common.pts}</span>
                    </div>
                  </div>

                  {/* 3 Interactive Habit Mini-Cards */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-3 rounded-2xl text-center space-y-1.5">
                      <div className="w-8 h-8 mx-auto rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.nav.meals}</div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">3 {t.dashboard.mealsLogged}</div>
                    </div>

                    <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40 p-3 rounded-2xl text-center space-y-1.5">
                      <div className="w-8 h-8 mx-auto rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                        <Droplets className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.nav.water}</div>
                      <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold">1,750 ml</div>
                    </div>

                    <div className="bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 p-3 rounded-2xl text-center space-y-1.5">
                      <div className="w-8 h-8 mx-auto rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                        <Moon className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.nav.sleep}</div>
                      <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">7h 30m</div>
                    </div>
                  </div>

                  {/* AI Gentle Insight Preview */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-100 text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>LifeSync AI Coach • Sunny</span>
                    </div>
                    <p className="text-xs text-emerald-50 leading-relaxed font-normal">
                      {isThai
                        ? '“วันนี้คุณดื่มน้ำได้สม่ำเสมอและเข้านอนตรงเวลามาก สุขภาพที่ดีเริ่มจากการทำทีละน้อยอย่างสม่ำเสมอครับ!”'
                        : '“You maintained great hydration and consistent sleep rhythm today. Great progress!”'}
                    </p>
                  </div>

                  {/* Quest Preview Pill */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-lg">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {isThai ? 'ดื่มน้ำแก้วแรกยามเช้า' : 'Morning First Glass of Water'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {isThai ? 'เควสต์ประจำวันสำเร็จ' : 'Daily Quest Completed'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>+10 {t.common.pts}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: 3 Core Pillars - Responsive 3-Column Grid on PC */}
        <section id="pillars" className="w-full py-16 md:py-24 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40">
          <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {isThai ? '3 มิติสุขภาพพื้นฐานในชีวิตประจำวัน' : '3 Foundational Wellness Dimensions'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isThai ? 'ดูแลสมดุลสุขภาพแบบองค์รวม เรียบง่าย และได้ผลจริง' : 'Holistic, Gentle, and Realistic Habit Building'}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                {isThai
                  ? 'เพราะสุขภาพที่ดีไม่ได้เกิดจากการหักโหมหรือจำกัดตัวเอง LifeSync จึงผสาน 3 เสาหลักของการมีสุขภาพดีเข้าไว้ด้วยกันอย่างลงตัว'
                  : 'True health comes from small, sustainable habits. LifeSync seamlessly brings nutrition, hydration, and sleep together.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Pillar 1: Nutrition */}
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Utensils className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isThai ? 'อาหาร & โภชนาการ' : 'Nutrition & AI Food Analysis'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isThai
                      ? 'บันทึกมื้ออาหารได้อย่างรวดเร็วใน 5 วินาที หรือถ่ายรูปให้ AI วิเคราะห์เมนูและประมาณการแคลอรี่โดยไม่ต้องนับอย่างเคร่งเครียด'
                      : 'Log meals in 5 seconds or snap a photo for AI meal estimation and nutritional guidance without restrictive dieting.'}
                  </p>
                </div>
                <div className="pt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isThai ? 'สแกนภาพด้วย AI & บันทึกแคลอรี่' : 'AI Food Scanner & Smart Calories'}</span>
                </div>
              </div>

              {/* Pillar 2: Hydration */}
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Droplets className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isThai ? 'ดื่มน้ำตรงจังหวะ' : 'Hydration Rhythm & 1-Tap Log'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isThai
                      ? 'ปุ่มบันทึกน้ำ 1-tap รวดเร็ว สู่เป้าหมาย 2,000 มล. ต่อวัน พร้อมระบบแจ้งเตือนดื่มน้ำผ่าน LINE สม่ำเสมอ'
                      : '1-tap fast water logger towards your daily 2,000 ml target, backed by timely gentle check-ins on LINE.'}
                  </p>
                </div>
                <div className="pt-2 text-xs font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isThai ? 'เป้าหมาย 2,000 ml & แจ้งเตือน LINE' : '2,000 ml Goal & LINE Reminders'}</span>
                </div>
              </div>

              {/* Pillar 3: Sleep */}
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Moon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isThai ? 'การนอนหลับ & งีบกลางวัน' : 'Restorative Sleep & Power Naps'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isThai
                      ? 'คำนวณเวลานอนข้ามเที่ยงคืนได้แม่นยำ บันทึกงีบสั้น (Power Nap) และวิเคราะห์ความสม่ำเสมอของจังหวะชีวิต'
                      : 'Accurate midnight crossover sleep tracking, power nap logger, and circadian sleep consistency metrics.'}
                  </p>
                </div>
                <div className="pt-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isThai ? 'คำนวณรอบนอน & บันทึกงีบหลับ' : 'Circadian Cycles & Power Naps'}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: Coach Sunny AI Feature Spotlight - Responsive Banner on PC */}
        <section id="coach" className="w-full py-16 md:py-24">
          <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-10 lg:p-12 rounded-[32px] bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-emerald-950/20 border border-amber-200/70 dark:border-amber-800/50 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Mascot Coach Image */}
                <div className="lg:col-span-4 flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gradient-to-tr from-amber-200 to-orange-200 dark:from-amber-950/60 dark:to-orange-950/40 border-4 border-amber-300 dark:border-amber-600 shadow-[0_12px_40px_rgba(245,158,11,0.3)]">
                      <Image
                        src="/mascot/sunny-avatar.jpg"
                        alt="Coach Sunny"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                      <Sparkles className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                {/* Coach Sunny Description */}
                <div className="lg:col-span-8 space-y-5 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isThai ? 'โค้ชสุขภาพ AI ประจำตัว' : 'Your Personal AI Coach'}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {isThai ? 'พบกับ “ซันนี่” เพื่อนร่วมทางที่มอบแต่พลังบวก' : 'Meet “Sunny”, Your Friendly Health Cheerleader'}
                  </h2>

                  <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                    {isThai
                      ? 'ซันนี่พร้อมวิเคราะห์ข้อมูลสุขภาพของคุณ ให้คำแนะนำที่ปรับเข้ากับวิถีชีวิตจริงของคุณ และพร้อมรับฟังเสมอในทุกๆ วัน โดยไม่มีคำตำหนิหรือกดดัน มีเพียงกำลังใจเพื่อก้าวต่อไปอย่างมีความสุข'
                      : 'Sunny analyzes your habits, delivers personalized practical tips tailored to your day, and always offers warm cheer with zero shame or restrictive pressure.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                    <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-amber-200/50 dark:border-slate-800">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {isThai ? 'วิเคราะห์ 3 สมดุล' : '3-Pillar Synergy'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isThai ? 'อาหาร น้ำ และการนอนหลับ' : 'Food, water, & sleep'}
                      </div>
                    </div>
                    <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-amber-200/50 dark:border-slate-800">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {isThai ? 'แชทถามตอบ 24 ชม.' : '24/7 AI Chat'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isThai ? 'ปรึกษาเรื่องสุขภาพทั่วไป' : 'Everyday wellness advice'}
                      </div>
                    </div>
                    <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-amber-200/50 dark:border-slate-800">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {isThai ? 'แจ้งเตือนผ่าน LINE' : 'LINE Notifications'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isThai ? 'เตือนดื่มน้ำ & พักผ่อน' : 'Hydration & sleep check-ins'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Gamification & Quests */}
        <section id="features" className="w-full py-16 md:py-24 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40">
          <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {isThai ? 'สนุกกับการสร้างวินัย' : 'Gentle Gamification'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isThai ? 'เปลี่ยนการดูแลสุขภาพให้เป็นเกมสนุก ไม่น่าเบื่อ' : 'Turn Health Building Into An Inspiring Daily Game'}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                {isThai
                  ? 'ทุกการกระทำเล็กๆ ของคุณมีคุณค่า สะสมแต้ม ทำเควสต์ประจำวัน และไต่อันดับเลเวลเพื่อสร้างความภาคภูมิใจในตัวเอง'
                  : 'Every small positive choice matters. Complete daily quests, earn streak points, and unlock achievements.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isThai ? 'เควสต์สุขภาพประจำวัน' : 'Daily Health Quests'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isThai
                    ? 'ภารกิจง่ายๆ เช่น ดื่มน้ำตอนเช้า หรือพักผ่อน 7 ชม. ช่วยให้คุณมีเป้าหมายที่ทำสำเร็จได้จริงในทุกวัน'
                    : 'Bite-sized daily quests like morning hydration or restorative sleep to keep you motivated.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isThai ? 'ระดับเลเวล & ตราสัญลักษณ์' : 'Levels & Achievement Badges'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isThai
                    ? 'ยิ่งทำต่อเนื่อง ยิ่งได้รับแต้มและปลดล็อกระดับใหม่ เพื่อฉลองความสำเร็จและส่งเสริมความต่อเนื่อง'
                    : 'Gain XP, rank up your wellness level, and unlock prestigious badges as your healthy habits solidify.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isThai ? 'LINE Official Account' : 'LINE Official Account Integration'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isThai
                    ? 'เชื่อมต่อบัญชีกับ LINE ได้อย่างง่ายดาย มี Rich Menu พร้อมใช้งาน และรับการแจ้งเตือนได้ทันที'
                    : 'Effortlessly pair with LINE for an interactive Rich Menu, quick habit logging, and gentle reminder alerts.'}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Section 5: Final Call To Action Banner */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[36px] overflow-hidden bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-700 text-white p-8 sm:p-12 lg:p-16 shadow-[0_20px_60px_rgba(16,185,129,0.3)]">
              {/* Background ambient pattern */}
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  {isThai ? 'พร้อมเริ่มต้นสร้างสมดุลสุขภาพที่ดีแล้วหรือยัง?' : 'Ready to Build Healthy, Lasting Habits?'}
                </h2>
                <p className="text-emerald-100 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
                  {isThai
                    ? 'สมัครฟรีวันนี้ ใช้งานได้ทั้งบนคอมพิวเตอร์และมือถือ ไม่ต้องดาวน์โหลดแอปให้ยุ่งยาก พร้อมเชื่อมต่อกับ LINE ของคุณได้ทันที'
                    : 'Start your free journey today on desktop or mobile. Zero installation required, with seamless LINE integration.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                  <Link
                    href="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-4 px-8 rounded-2xl font-bold text-emerald-950 bg-white hover:bg-emerald-50 shadow-lg transition-all active:scale-95 text-base cursor-pointer"
                  >
                    <span>{t.common.getStarted}</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>

                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md transition-all active:scale-95 text-base cursor-pointer"
                  >
                    <span>{t.common.signIn}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer - Responsive Multi-Column for PC & Mobile */}
      <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-12 px-4 sm:px-6 lg:px-8 bg-white/60 dark:bg-slate-900/60">
        <div className="max-w-6xl lg:max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2 rounded-xl">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {t.common.appName}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                &copy; 2026 LifeSync. Built for everyday balance & healthy habits.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? 'แดชบอร์ด' : 'Dashboard'}
            </Link>
            <Link href="/nutrition" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.meals}
            </Link>
            <Link href="/hydration" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.water}
            </Link>
            <Link href="/sleep" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.sleep}
            </Link>
            <Link href="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? 'ข้อกำหนดการใช้งาน' : 'Terms of Use'}
            </Link>
            <Link href="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isThai ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
