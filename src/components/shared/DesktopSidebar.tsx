'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import ThemeToggle from '@/components/shared/ThemeToggle';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { 
  Activity,
  LayoutDashboard, 
  Utensils, 
  Droplets, 
  Moon, 
  Trophy, 
  Settings,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function DesktopSidebar() {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const isThai = locale === 'th';

  const navItems = [
    {
      href: '/dashboard',
      label: t.nav.home,
      subLabel: isThai ? 'ภาพรวมสุขภาพวันนี้' : 'Daily Snapshot',
      icon: LayoutDashboard,
      activeColor: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200',
    },
    {
      href: '/nutrition',
      label: t.nav.meals,
      subLabel: isThai ? 'วิเคราะห์อาหาร & แคลอรี' : 'AI Food & Calories',
      icon: Utensils,
      activeColor: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60 text-amber-950 dark:text-amber-200',
    },
    {
      href: '/hydration',
      label: t.nav.water,
      subLabel: isThai ? 'บันทึกดื่มน้ำ 2,000 ml' : '2L Hydration Target',
      icon: Droplets,
      activeColor: 'text-sky-600 dark:text-sky-400',
      activeBg: 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-200/80 dark:border-sky-800/60 text-sky-950 dark:text-sky-200',
    },
    {
      href: '/sleep',
      label: t.nav.sleep,
      subLabel: isThai ? 'เวลานอน & งีบกลางวัน' : 'Sleep & Power Naps',
      icon: Moon,
      activeColor: 'text-indigo-600 dark:text-indigo-400',
      activeBg: 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200',
    },
    {
      href: '/quests',
      label: t.nav.quests,
      subLabel: isThai ? 'ภารกิจ & อันดับเพื่อน' : 'Quests & Community',
      icon: Trophy,
      activeColor: 'text-orange-600 dark:text-orange-400',
      activeBg: 'bg-orange-50/80 dark:bg-orange-950/50 border-orange-200/80 dark:border-orange-800/60 text-orange-950 dark:text-orange-200',
    },
    {
      href: '/settings',
      label: t.nav.settings,
      subLabel: isThai ? 'ตั้งค่า & บัญชี LINE' : 'Preferences & LINE',
      icon: Settings,
      activeColor: 'text-slate-700 dark:text-slate-300',
      activeBg: 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 shrink-0 h-screen sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 p-5 z-30 transition-colors duration-200 select-none">
      {/* Top Brand Header */}
      <div className="space-y-6">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 pt-1 group">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2.5 rounded-2xl shadow-[0_4px_16px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white block leading-tight">
              {t.common.appName}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Health & Habit Tracker
            </span>
          </div>
        </Link>

        {/* Mascot Coach Pill */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-100 border-2 border-amber-300 shrink-0 relative">
            <Image
              src="/mascot/sunny-avatar.jpg"
              alt="Coach Sunny"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-950 dark:text-amber-200 truncate">
                ซันนี่ (Sunny AI)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 truncate">
              {isThai ? 'โค้ชสุขภาพประจำตัว' : 'Personal AI Coach'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `${item.activeBg} border font-bold shadow-xs`
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/80 dark:bg-slate-800/80 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive ? item.activeColor : ''}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-0.5 font-normal">
                      {item.subLabel}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Controls */}
      <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800/70 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isThai ? 'การแสดงผล' : 'Appearance'}
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>LifeSync Web • v1.2</span>
          <Link href="/terms" className="hover:text-emerald-600 hover:underline">
            {isThai ? 'ข้อกำหนด' : 'Terms'}
          </Link>
        </div>
      </div>
    </aside>
  );
}
