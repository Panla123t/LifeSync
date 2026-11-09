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
    { href: '/nutrition', label: t.nav.meals, icon: Utensils },
    { href: '/hydration', label: t.nav.water, icon: Droplets },
    { href: '/sleep', label: t.nav.sleep, icon: Moon },
    { href: '/quests', label: t.nav.quests, icon: Trophy },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe">
      <div className="max-w-md mx-auto px-2 flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
