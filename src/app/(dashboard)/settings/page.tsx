'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Settings, User, Bell, MessageSquare, LogOut, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { NotificationSettings, Profile } from '@/types/database';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
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
        setProfile(prof as Profile);
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500">Preferences, LINE account, and privacy</p>
        </div>
        <div className="bg-slate-100 text-slate-600 p-2.5 rounded-2xl">
          <Settings className="h-6 w-6" />
        </div>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Your settings have been saved successfully.</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800">Profile Information</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Bangkok"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Used for accurate daily summaries and quiet hours.</p>
          </div>

          <div className="pt-2 border-t border-slate-50 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-800">Notification Preferences</h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-700">Hydration Reminders</div>
                <div className="text-[10px] text-slate-400">Periodic gentle nudges to drink water</div>
              </div>
              <input
                type="checkbox"
                checked={hydrationEnabled}
                onChange={(e) => setHydrationEnabled(e.target.checked)}
                className="h-4 w-4 text-emerald-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-700">Sleep Routine Nudges</div>
                <div className="text-[10px] text-slate-400">Wind-down reminder before bedtime</div>
              </div>
              <input
                type="checkbox"
                checked={sleepEnabled}
                onChange={(e) => setSleepEnabled(e.target.checked)}
                className="h-4 w-4 text-emerald-600 rounded"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Preferences'}
          </button>
        </form>
      </div>

      {/* LINE Official Account Integration */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-800">LINE Official Account</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Link your account to receive water reminders and morning sleep check-ins straight to your LINE chat.
        </p>

        {notifSettings?.line_user_id ? (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
            <span className="font-semibold">Connected to LINE</span>
            <span className="text-[11px] text-slate-400">ID: {notifSettings.line_user_id.slice(0, 8)}...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => alert('LINE Account linking token flow is configured for the LINE OA webhook.')}
            className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b04b] text-white rounded-2xl text-xs font-bold transition-colors shadow-xs"
          >
            Connect with LINE
          </button>
        )}
      </div>

      {/* Privacy Notice & Disclaimer */}
      <div className="bg-slate-100 rounded-3xl p-4 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-600" /> Non-Medical Wellness Disclaimer
        </div>
        <p>
          LifeSync is designed for habit education and lifestyle tracking. It does not provide medical diagnosis, treatment, or clinical recommendations.
        </p>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full py-3 border border-rose-200 bg-rose-50/50 hover:bg-rose-100/50 text-rose-700 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
