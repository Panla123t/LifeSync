'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Utensils, Droplets, Moon, Trophy, Settings } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard', label: t.nav.home, icon: LayoutDashboard },
    { href: '/nutrition', label: t.nav.meals, icon: Utensils, activeColor: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-500/10 dark:bg-amber-400/15' },
    { href: '/hydration', label: t.nav.water, icon: Droplets, activeColor: 'text-sky-600 dark:text-sky-400', activeBg: 'bg-sky-500/10 dark:bg-sky-400/15' },
    { href: '/sleep', label: t.nav.sleep, icon: Moon, activeColor: 'text-indigo-600 dark:text-indigo-400', activeBg: 'bg-indigo-500/10 dark:bg-indigo-400/15' },
    { href: '/quests', label: t.nav.quests, icon: Trophy, activeColor: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500/10 dark:bg-emerald-400/15' },
    { href: '/settings', label: t.nav.settings, icon: Settings, activeColor: 'text-slate-700 dark:text-slate-200', activeBg: 'bg-slate-500/10 dark:bg-slate-400/15' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-md mx-auto">
        <div className="mx-3 mb-2.5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] px-2 py-1.5 flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const activeColor = item.activeColor || 'text-emerald-600 dark:text-emerald-400';
            const activeBg = item.activeBg || 'bg-emerald-500/10 dark:bg-emerald-400/15';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? `${activeColor} font-semibold ${activeBg}`
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-current" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
