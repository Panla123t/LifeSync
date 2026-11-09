'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { 
  Settings, 
  User, 
  Bell, 
  MessageSquare, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  Globe,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';
import type { NotificationSettings, Profile } from '@/types/database';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t, locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [hydrationEnabled, setHydrationEnabled] = useState(true);
  const [sleepEnabled, setSleepEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setDisplayName(prof.display_name || '');
        setTimezone(prof.timezone || 'Asia/Bangkok');
      }

      const { data: notif } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (notif) {
        setNotifSettings(notif as NotificationSettings);
        setHydrationEnabled(notif.hydration_enabled);
        setSleepEnabled(notif.sleep_enabled);
      }
    }

    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('profiles').update({
        display_name: displayName,
        timezone,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      await supabase.from('notification_settings').update({
        hydration_enabled: hydrationEnabled,
        sleep_enabled: sleepEnabled,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.settings.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.settings.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-2xl">
            <Settings className="h-6 w-6" />
          </div>
        </div>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{t.settings.savedSuccess}</span>
        </div>
      )}

      {/* Theme / Appearance Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3">
        <div className="flex items-center gap-2">
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 text-indigo-400" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.settings.theme}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Sun className="h-4 w-4 text-amber-500" />
            <span>{t.settings.lightMode}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              theme === 'dark'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-xs ring-2 ring-indigo-500/30'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Moon className="h-4 w-4 text-indigo-400" />
            <span>{t.settings.darkMode}</span>
          </button>
        </div>
      </div>

      {/* Language Selector Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.settings.language}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setLocale('th')}
            className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              locale === 'th'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-base">🇹🇭</span>
            <span>{t.settings.thai}</span>
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              locale === 'en'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-base">🇬🇧</span>
            <span>{t.settings.english}</span>
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.settings.profileInfo}</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t.settings.displayName}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t.settings.timezone}</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Bangkok"
              className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{t.settings.timezoneHint}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">{t.settings.notifPrefs}</h3>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.settings.hydrationReminders}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400">{t.settings.hydrationRemindersDesc}</div>
              </div>
              <input
                type="checkbox"
                checked={hydrationEnabled}
                onChange={(e) => setHydrationEnabled(e.target.checked)}
                className="h-5 w-5 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.settings.sleepReminders}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400">{t.settings.sleepRemindersDesc}</div>
              </div>
              <input
                type="checkbox"
                checked={sleepEnabled}
                onChange={(e) => setSleepEnabled(e.target.checked)}
                className="h-5 w-5 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {saving ? t.common.saving : t.settings.savePrefs}
          </button>
        </form>
      </div>

      {/* LINE Official Account Integration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#06C755] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              LINE
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.settings.lineTitle}</h2>
          </div>
          {notifSettings?.line_user_id ? (
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
              Connected
            </span>
          ) : (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-full">
              Not linked
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t.settings.lineDesc}
        </p>

        {notifSettings?.line_user_id ? (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span className="font-semibold">{t.settings.lineConnected}</span>
            <span className="text-[11px] text-slate-400">ID: {notifSettings.line_user_id.slice(0, 8)}...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => alert(locale === 'th' ? 'ระบบกำลังเตรียมสร้างโทเค็นเชื่อมต่อกับ LINE Official Account' : 'Generating secure linking token for LINE Official Account...')}
            className="w-full py-3 bg-[#06C755] hover:bg-[#05b04b] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-[0_4px_14px_rgba(6,199,85,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.settings.connectLine}</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Privacy Notice & Disclaimer */}
      <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-[26px] p-4.5 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 border border-slate-200/50 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t.common.disclaimerTitle}</span>
        </div>
        <p className="leading-relaxed">{t.common.disclaimer}</p>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full py-3.5 border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 active:scale-95 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        <span>{t.common.signOut}</span>
      </button>
    </div>
  );
}
