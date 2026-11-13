'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { 
  User, 
  Bell, 
  MessageSquare, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  Globe,
  Sun,
  Moon,
  ExternalLink,
  Copy,
  Check,
  Send,
  RefreshCw,
  Sparkles,
  Unlink,
  Clock,
  Droplets,
  Utensils,
  Download,
  Trash2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Vibrate
} from 'lucide-react';
import type { NotificationSettings, Profile } from '@/types/database';
import FloatingGlassModal from '@/components/shared/FloatingGlassModal';
import { 
  getSoundSetting, 
  setSoundSetting, 
  getHapticsSetting, 
  setHapticsSetting, 
  playSuccessChime 
} from '@/lib/utils/sound';

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

  // LINE Connection State
  const [showLineModal, setShowLineModal] = useState(false);
  const [lineToken, setLineToken] = useState<string | null>(null);
  const [lineExpiresAt, setLineExpiresAt] = useState<string | null>(null);
  const [lineOaUrl, setLineOaUrl] = useState<string>('https://line.me/R/ti/p/@lifesync');
  const [loadingToken, setLoadingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [checkingLineStatus, setCheckingLineStatus] = useState(false);
  const [sendingTestReminder, setSendingTestReminder] = useState(false);
  const [lineActionFeedback, setLineActionFeedback] = useState<string | null>(null);
  const [unlinkingLine, setUnlinkingLine] = useState(false);

  // Data Export & Account Privacy State
  const [exportingData, setExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Sound & Haptic Preferences
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);

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

      setSoundEnabledState(getSoundSetting());
      setHapticsEnabledState(getHapticsSetting());
    }

    loadSettings();
  }, []);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundSetting(enabled);
    if (enabled) {
      playSuccessChime();
    }
  };

  const handleToggleHaptics = (enabled: boolean) => {
    setHapticsEnabledState(enabled);
    setHapticsSetting(enabled);
  };

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

  const handleOpenConnectModal = async () => {
    setShowLineModal(true);
    setLoadingToken(true);
    setCopiedToken(false);
    setLineActionFeedback(null);
    try {
      const res = await fetch('/api/line/link-token', { method: 'POST' });
      if (!res.ok) {
        if (res.status === 401) {
          setLineActionFeedback('กรุณาเข้าสู่ระบบก่อนสร้างรหัสเชื่อมต่อ LINE');
        } else {
          setLineActionFeedback('ไม่สามารถสร้างรหัสได้ กรุณาลองใหม่อีกครั้ง');
        }
        return;
      }
      const data = await res.json();
      if (data.token) {
        setLineToken(data.token);
        setLineExpiresAt(data.expires_at);
        if (data.line_oa_url) setLineOaUrl(data.line_oa_url);
      }
    } catch (err) {
      console.error(err);
      setLineActionFeedback('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoadingToken(false);
    }
  };

  const handleCopyToken = () => {
    if (!lineToken) return;
    navigator.clipboard.writeText(lineToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleCheckLineStatus = async () => {
    setCheckingLineStatus(true);
    try {
      const res = await fetch('/api/line/link-token');
      const data = await res.json();
      if (data.is_linked) {
        setNotifSettings((prev) => prev ? { 
          ...prev, 
          line_user_id: data.line_user_id, 
          line_linked_at: data.linked_at 
        } : {
          user_id: '',
          line_user_id: data.line_user_id,
          line_linked_at: data.linked_at,
          hydration_enabled: true,
          sleep_enabled: true,
          daily_summary_enabled: false,
          reminder_preferences: {},
          updated_at: new Date().toISOString(),
        });
        setLineActionFeedback(locale === 'th' ? '🎉 เชื่อมต่อกับ LINE เรียบร้อยแล้ว!' : '🎉 Connected to LINE successfully!');
        setTimeout(() => {
          setShowLineModal(false);
          setLineActionFeedback(null);
        }, 1800);
      } else {
        setLineActionFeedback(locale === 'th' ? 'ยังไม่พบการเชื่อมต่อ กรุณาส่งรหัสในแชท LINE ก่อนนะครับ' : 'Not linked yet. Please send the code in LINE chat first');
      }
    } finally {
      setCheckingLineStatus(false);
    }
  };

  const handleSendTestReminder = async (type: 'hydration' | 'sleep' | 'morning' | 'meal' | 'weekly_summary' = 'hydration') => {
    setSendingTestReminder(true);
    setLineActionFeedback(null);
    try {
      const res = await fetch('/api/line/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        let label = 'ดื่มน้ำ';
        if (type === 'sleep') label = 'เข้านอน';
        if (type === 'morning') label = 'ทักทายยามเช้า';
        if (type === 'meal') label = 'มื้ออาหาร';
        if (type === 'weekly_summary') label = 'สรุปสุขภาพรอบสัปดาห์';
        setLineActionFeedback(data.message || (locale === 'th' ? `ส่งข้อความ${label}แล้ว! กรุณาตรวจสอบใน LINE` : `Test message sent! Check your LINE chat`));
        setTimeout(() => setLineActionFeedback(null), 4500);
      } else {
        setLineActionFeedback(data.error || 'Failed to send reminder');
      }
    } finally {
      setSendingTestReminder(false);
    }
  };

  const handleUnlinkLine = async () => {
    if (!confirm(locale === 'th' ? 'คุณต้องการยกเลิกการเชื่อมต่อกับ LINE หรือไม่?' : 'Are you sure you want to disconnect LINE?')) return;
    setUnlinkingLine(true);
    try {
      const res = await fetch('/api/line/link-token', { method: 'DELETE' });
      if (res.ok) {
        setNotifSettings((prev) => prev ? { ...prev, line_user_id: null, line_linked_at: null } : null);
        setLineActionFeedback(locale === 'th' ? 'ยกเลิกการเชื่อมต่อเรียบร้อยแล้ว' : 'Disconnected successfully');
        setTimeout(() => setLineActionFeedback(null), 3000);
      }
    } finally {
      setUnlinkingLine(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExportingData(true);
      const res = await fetch('/api/user/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifesync-health-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการดาวน์โหลดข้อมูล' : 'Failed to export data');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    try {
      setDeletingAccount(true);
      const res = await fetch('/api/user/delete', { method: 'POST' });
      if (!res.ok) throw new Error('Delete failed');
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error(err);
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการลบบัญชี' : 'Failed to delete account');
      setDeletingAccount(false);
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
      <div className="text-center py-2 space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.settings.title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.settings.subtitle}</p>
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

      {/* Sound & Haptics Feedback Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center gap-2">
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <VolumeX className="h-4 w-4 text-slate-400" />
          )}
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            {locale === 'th' ? 'เสียงและระบบสั่นตอบสนอง' : 'Sound & Haptic Feedback'}
          </h2>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
            <div className="space-y-0.5 pr-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {locale === 'th' ? 'เสียงเอฟเฟกต์ฉลองความสำเร็จ' : 'Celebration Sound Effects'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {locale === 'th' ? 'เสียงชิมเบาๆ เมื่อดื่มน้ำครบเป้าหมาย หรือปลดล็อกเลเวลใหม่' : 'Soft chimes when hitting daily goals or unlocking new levels'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => handleToggleSound(e.target.checked)}
              className="h-5 w-5 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer shrink-0"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
            <div className="space-y-0.5 pr-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {locale === 'th' ? 'ระบบสั่นตอบสนอง (Haptic Vibration)' : 'Haptic Vibration'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {locale === 'th' ? 'สั่นตอบสนองเบาๆ บนสมาร์ตโฟนเมื่อกดบันทึกน้ำและกิจกรรม' : 'Subtle vibration pulse on mobile devices when tapping actions'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={hapticsEnabled}
              onChange={(e) => handleToggleHaptics(e.target.checked)}
              className="h-5 w-5 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer shrink-0"
            />
          </div>
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
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.settings.lineTitle}</h2>
              <div className="text-[10px] text-slate-400">LINE Messaging API</div>
            </div>
          </div>
          {notifSettings?.line_user_id ? (
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

        {lineActionFeedback && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold animate-in fade-in">
            {lineActionFeedback}
          </div>
        )}

        {notifSettings?.line_user_id ? (
          <div className="space-y-2.5">
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="font-semibold">{t.settings.lineConnected}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {notifSettings.line_user_id.slice(0, 10)}...
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={sendingTestReminder}
                onClick={() => handleSendTestReminder('hydration')}
                className="py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {sendingTestReminder ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Droplets className="h-3.5 w-3.5 text-sky-500" />
                )}
                <span>{locale === 'th' ? 'ลองเตือนจิบน้ำ' : 'Test Water'}</span>
              </button>

              <button
                type="button"
                disabled={sendingTestReminder}
                onClick={() => handleSendTestReminder('sleep')}
                className="py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {sendingTestReminder ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                )}
                <span>{locale === 'th' ? 'ลองเตือนนอน' : 'Test Sleep'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={sendingTestReminder}
                onClick={() => handleSendTestReminder('morning')}
                className="py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {sendingTestReminder ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span>{locale === 'th' ? 'ลองทักทายเช้า' : 'Test Morning'}</span>
              </button>

              <button
                type="button"
                disabled={sendingTestReminder}
                onClick={() => handleSendTestReminder('meal')}
                className="py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {sendingTestReminder ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Utensils className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span>{locale === 'th' ? 'ลองเตือนอาหาร' : 'Test Meal'}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={sendingTestReminder}
              onClick={() => handleSendTestReminder('weekly_summary')}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 hover:from-amber-100 hover:to-orange-100 dark:hover:bg-slate-700/70 active:scale-95 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{locale === 'th' ? '🌈 ทดสอบส่งสรุปสุขภาพประจำสัปดาห์' : '🌈 Test Weekly Digest'}</span>
            </button>

            {/* Daily Schedule Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{locale === 'th' ? 'รอบเวลาเตือนอัตโนมัติ (Sunny ☀️)' : 'Daily Automated Reminder Schedule'}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">☀️ 08:00 น.</span>
                  <span className="text-slate-400">•</span>
                  <span>{locale === 'th' ? 'อรุณสวัสดิ์ & น้ำแก้วแรก' : 'Morning Greeting & Wake-up Water'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">💧 10:00 & 14:00 น.</span>
                  <span className="text-slate-400">•</span>
                  <span>{locale === 'th' ? 'เตือนจิบน้ำระหว่างวัน' : 'Hydration Check-ins'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">🥗 18:00 น.</span>
                  <span className="text-slate-400">•</span>
                  <span>{locale === 'th' ? 'ชวนทานอาหารมื้อเย็น' : 'Dinner Nudge'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">🌙 21:30 น.</span>
                  <span className="text-slate-400">•</span>
                  <span>{locale === 'th' ? 'เตรียมตัวผ่อนคลายเข้านอน' : 'Bedtime Wind-down'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">🌈 อาทิตย์ 20:00 น.</span>
                  <span className="text-slate-400">•</span>
                  <span>{locale === 'th' ? 'สรุปสุขภาพและคำแนะนำ AI ประจำสัปดาห์' : 'Sunday Weekly AI Digest'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={unlinkingLine}
              onClick={handleUnlinkLine}
              className="w-full py-2.5 px-3 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 active:scale-95 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/40 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Unlink className="h-3.5 w-3.5" />
              <span>{t.settings.disconnectLine}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenConnectModal}
            className="w-full py-3 bg-[#06C755] hover:bg-[#05b04b] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-[0_4px_14px_rgba(6,199,85,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.settings.connectLine}</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* LINE Bot Assets & Rich Menu Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs">
            ☀️
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              {locale === 'th' ? 'ทรัพยากรบอทซันนี่ & LINE Rich Menu' : 'Sunny Bot PFP & Rich Menu Assets'}
            </h2>
            <div className="text-[10px] text-slate-400">LINE Official Account Resources</div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* 1. Sunny Bot Profile Picture */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 border-2 border-amber-300 shrink-0 shadow-xs relative">
                <Image
                  src="/mascot/sunny-avatar.jpg"
                  alt="Sunny Mascot PFP"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {locale === 'th' ? 'รูปโปรไฟล์บอทซันนี่ (PFP)' : 'Sunny Bot Profile Picture'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {locale === 'th' ? 'ภาพ 3D สำหรับรูปโปรไฟล์ใน LINE OA Manager' : 'High-res 3D avatar for LINE Official Account'}
                </div>
              </div>
            </div>

            <a
              href="/mascot/sunny-avatar.jpg"
              download="sunny-bot-pfp.jpg"
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{locale === 'th' ? 'ดาวน์โหลด' : 'Download'}</span>
            </a>
          </div>

          {/* 2. 6-Tile Rich Menu Graphic */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-10 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 dark:border-slate-700 shrink-0 shadow-xs relative">
                <Image
                  src="/line/rich-menu-6tiles.png"
                  alt="Rich Menu Preview"
                  width={56}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {locale === 'th' ? 'ริชเมนู 6 ช่อง (2500x1686 px)' : '6-Tile Rich Menu Graphic'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {locale === 'th' ? 'ภาพเมนูลัดท้ายแชทตามมาตรฐาน LINE' : 'Standard 2500x1686 px chat bottom menu'}
                </div>
              </div>
            </div>

            <a
              href="/line/rich-menu-6tiles.png"
              download="lifesync-rich-menu-2500x1686.png"
              className="px-3 py-2 rounded-xl bg-[#06C755] hover:bg-[#05b04b] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{locale === 'th' ? 'ดาวน์โหลด' : 'Download'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Floating Glass Modal for LINE OA Linking */}
      <FloatingGlassModal
        isOpen={showLineModal}
        onClose={() => setShowLineModal(false)}
        title={t.settings.linkModalTitle}
        icon={
          <div className="w-8 h-8 rounded-xl bg-[#06C755] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            LINE
          </div>
        }
        badge="Official Account"
        glowColor="emerald"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
            {t.settings.linkCodeHint}
          </p>

          {/* 6-Digit Code Display */}
          <div className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t.settings.linkCodeLabel}
            </div>

            {loadingToken ? (
              <div className="py-2 flex items-center justify-center gap-2 text-xs text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
                <span>กำลังสร้างรหัสเชื่อมต่อ...</span>
              </div>
            ) : (
              <div className="text-3xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 font-mono py-1">
                {lineToken || '------'}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyToken}
                disabled={!lineToken}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-700/80 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              >
                {copiedToken ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">{t.settings.codeCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t.settings.copyCode}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenConnectModal}
                className="p-2 rounded-xl bg-white dark:bg-slate-700/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-600 transition-all cursor-pointer"
                title="สร้างรหัสใหม่"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {lineActionFeedback && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold text-center animate-in fade-in">
              {lineActionFeedback}
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 <span className="font-semibold text-slate-700 dark:text-slate-300">วิธีเชื่อมต่อที่ง่ายที่สุด:</span> คุณสามารถพิมพ์อีเมลที่ใช้สมัครของคุณ (เช่น <span className="text-emerald-600 dark:text-emerald-400 font-mono">user@example.com</span>) ส่งให้ Sunny ใน LINE ได้โดยตรง!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <a
              href={lineOaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#06C755] hover:bg-[#05b04b] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-[0_4px_14px_rgba(6,199,85,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.settings.openLineOa}</span>
              <ExternalLink className="h-4 w-4" />
            </a>

            <button
              type="button"
              disabled={checkingLineStatus}
              onClick={handleCheckLineStatus}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {checkingLineStatus && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{t.settings.checkStatus}</span>
            </button>
          </div>
        </div>
      </FloatingGlassModal>

      {/* Data Export & Privacy Controls (PDPA / GDPR) */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            {locale === 'th' ? 'ข้อมูลส่วนบุคคลและความเป็นส่วนตัว' : 'Data & Privacy (PDPA / GDPR)'}
          </h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {locale === 'th'
            ? 'คุณสามารถดาวน์โหลดสำเนาบันทึกสุขภาพทั้งหมดของคุณ หรือขอลบบัญชีและข้อมูลทั้งหมดออกจากระบบได้อย่างสมบูรณ์'
            : 'Download a complete copy of all your health logs, or permanently delete your account and all associated data.'}
        </p>

        <div className="space-y-2.5 pt-1">
          {/* Export Button */}
          <button
            type="button"
            disabled={exportingData}
            onClick={handleExportData}
            className="w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className={`h-4 w-4 ${exportingData ? 'animate-bounce' : ''}`} />
            <span>
              {exportingData
                ? (locale === 'th' ? 'กำลังเตรียมไฟล์ดาวน์โหลด...' : 'Preparing export...')
                : (locale === 'th' ? 'ดาวน์โหลดข้อมูลสุขภาพของฉัน (JSON)' : 'Export My Health Data (JSON)')}
            </span>
          </button>

          {/* Delete Account Trigger */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 active:scale-95 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{locale === 'th' ? 'ลบบัญชีและข้อมูลทั้งหมด' : 'Delete Account & All Data'}</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <FloatingGlassModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title={locale === 'th' ? 'ยืนยันการลบบัญชีผู้ใช้' : 'Confirm Account Deletion'}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              {locale === 'th'
                ? 'การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลการดื่มน้ำ อาหาร การนอน เควส และแต้มสะสมทั้งหมดจะถูกลบถาวรทันที'
                : 'This action is irreversible. All your hydration, food, sleep logs, quests, and points will be permanently deleted.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {locale === 'th' ? 'พิมพ์คำว่า DELETE เพื่อยืนยัน' : 'Type DELETE to confirm'}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || deletingAccount}
              onClick={handleDeleteAccount}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_12px_rgba(225,29,72,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              {deletingAccount && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{locale === 'th' ? 'ยืนยันลบบัญชี' : 'Delete Permanently'}</span>
            </button>
          </div>
        </div>
      </FloatingGlassModal>

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
