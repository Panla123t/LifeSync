'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import FloatingGlassModal from '@/components/shared/FloatingGlassModal';
import { 
  Moon, 
  Plus, 
  Trash2, 
  Clock, 
  Bed, 
  SunMedium, 
  Sparkles,
  Zap,
  Coffee,
  BatteryCharging
} from 'lucide-react';
import type { SleepLog } from '@/types/database';

export default function SleepPage() {
  const { t, locale } = useLanguage();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sleepType, setSleepType] = useState<'night' | 'nap'>('night');

  // Night Sleep Form State
  const [bedtimeDate, setBedtimeDate] = useState('');
  const [bedtimeTime, setBedtimeTime] = useState('23:00');
  const [wakeDate, setWakeDate] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Nap Form State
  const [napMinutes, setNapMinutes] = useState('20');
  const [napNotes, setNapNotes] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    setWakeDate(today.toISOString().slice(0, 10));
    setBedtimeDate(yesterday.toISOString().slice(0, 10));
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .order('wake_time', { ascending: false })
        .limit(15);

      if (!error && data) {
        setLogs(data as SleepLog[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const calculateDurationMinutes = (bed: Date, wake: Date) => {
    const diffMs = wake.getTime() - bed.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
  };

  // Helper to distinguish naps
  const isNap = (log: SleepLog) => {
    return (
      log.notes?.includes('[งีบหลับ]') ||
      log.notes?.includes('[Nap]') ||
      (log.duration_minutes <= 90 && log.notes?.toLowerCase().includes('nap'))
    );
  };

  const handleAddSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const bedDateTime = new Date(`${bedtimeDate}T${bedtimeTime}:00`);
    const wakeDateTime = new Date(`${wakeDate}T${wakeTime}:00`);

    if (wakeDateTime <= bedDateTime) {
      setFormError(t.sleep.errorWakeBeforeBed);
      return;
    }

    const durationMinutes = calculateDurationMinutes(bedDateTime, wakeDateTime);

    if (durationMinutes > 24 * 60) {
      setFormError(t.sleep.errorDurationMax);
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('sleep_logs').insert({
        user_id: user.id,
        bedtime: bedDateTime.toISOString(),
        wake_time: wakeDateTime.toISOString(),
        duration_minutes: durationMinutes,
        notes: notes.trim() || null,
      });

      if (!error) {
        setNotes('');
        setShowForm(false);
        await fetchLogs();

        if (logs.length === 0) {
          await supabase.from('point_transactions').insert({
            user_id: user.id,
            points_delta: 15,
            reason: 'Logged sleep schedule',
            idempotency_key: `sleep_${user.id}_${new Date().toISOString().slice(0, 10)}`,
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Tap Quick Nap or Nap form submission
  const handleAddNap = async (minutes: number, customNote?: string) => {
    if (minutes <= 0 || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const wake = new Date();
      const bed = new Date(wake.getTime() - minutes * 60 * 1000);
      const tag = locale === 'th' ? 'งีบหลับ' : 'Nap';
      const cleanNote = customNote ? `[${tag}] ${customNote.trim()}` : `[${tag}] ${locale === 'th' ? `งีบหลับ ${minutes} นาที` : `${minutes}m Power Nap`}`;

      const { error } = await supabase.from('sleep_logs').insert({
        user_id: user.id,
        bedtime: bed.toISOString(),
        wake_time: wake.toISOString(),
        duration_minutes: minutes,
        notes: cleanNote,
      });

      if (!error) {
        setNapNotes('');
        setShowForm(false);
        await fetchLogs();

        if (logs.length === 0) {
          await supabase.from('point_transactions').insert({
            user_id: user.id,
            points_delta: 10,
            reason: 'Logged daytime nap',
            idempotency_key: `sleep_${user.id}_${new Date().toISOString().slice(0, 10)}`,
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSleep = async (id: string) => {
    const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const formatHoursMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const latestLog = logs[0];
  const todaysNaps = logs.filter((log) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return isNap(log) && log.wake_time.startsWith(todayStr);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.sleep.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.sleep.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-2xl shadow-xs">
            <Moon className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Hero Sleep Card (Serene Night Aesthetic) */}
      {latestLog ? (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-[32px] p-6 shadow-[0_12px_30px_rgba(30,27,75,0.4)] space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>{isNap(latestLog) ? t.sleep.nap : t.sleep.latestSleep}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {todaysNaps.length > 0 && (
                <span className="text-[10px] bg-amber-500/25 border border-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" />
                  <span>{locale === 'th' ? `งีบ ${todaysNaps.length} ครั้ง` : `${todaysNaps.length} nap`}</span>
                </span>
              )}
              <span className="text-xs bg-white/10 backdrop-blur-md text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/20 font-bold">
                {new Date(latestLog.wake_time).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-5xl font-black tracking-tight">{formatHoursMinutes(latestLog.duration_minutes)}</span>
            <span className="text-sm font-semibold text-indigo-300">{t.sleep.duration}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-800/40 text-xs text-indigo-200 relative z-10">
            <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5">
              <Bed className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-indigo-300">{t.sleep.slept}</div>
                <div className="font-bold text-white">
                  {new Date(latestLog.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5">
              <SunMedium className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-indigo-300">{t.sleep.woke}</div>
                <div className="font-bold text-white">
                  {new Date(latestLog.wake_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-[32px] p-6 text-center space-y-3">
          <Moon className="h-10 w-10 mx-auto text-indigo-300" />
          <h2 className="text-sm font-bold">{locale === 'th' ? 'เริ่มต้นบันทึกตารางการนอน' : 'Start tracking your sleep'}</h2>
          <p className="text-xs text-indigo-200 max-w-xs mx-auto leading-relaxed">
            {locale === 'th'
              ? 'การพักผ่อนที่เพียงพอช่วยฟื้นฟูร่างกาย สมอง และภูมิคุ้มกันให้พร้อมรับวันใหม่'
              : 'Consistent sleep timing helps regulate circadian rhythm and daytime alertness.'}
          </p>
        </div>
      )}

      {/* 1-Tap Power Nap Quick Presets Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>{t.sleep.nap}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                  1-Tap
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {t.sleep.napHint}
              </p>
            </div>
          </div>
        </div>

        {/* 1-Tap Nap Presets */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { mins: 15, label: 'Power', icon: Zap },
            { mins: 20, label: 'Smart', icon: Coffee },
            { mins: 30, label: 'Recharge', icon: BatteryCharging },
            { mins: 45, label: 'Deep', icon: Moon },
          ].map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.mins}
                type="button"
                disabled={submitting}
                onClick={() => handleAddNap(preset.mins)}
                className="group py-3 px-2 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-b from-amber-50/70 to-amber-50/20 dark:from-amber-950/30 dark:to-amber-900/10 hover:to-amber-100/70 dark:hover:to-amber-900/30 active:scale-95 transition-all flex flex-col items-center justify-center text-amber-800 dark:text-amber-300 font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-amber-500 flex items-center justify-center mb-1 shadow-2xs group-hover:scale-110 transition-transform">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span>{preset.mins}m</span>
                <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70 font-normal">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Glassmorphism Modal for Recording Sleep & Nap */}
      <FloatingGlassModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={sleepType === 'nap' ? t.sleep.addNap : t.sleep.recordSleep}
        icon={
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            sleepType === 'nap'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
          }`}>
            {sleepType === 'nap' ? <Zap className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </div>
        }
        badge={sleepType === 'nap' ? '⚡ Power Nap' : '🌙 Night Routine'}
        glowColor={sleepType === 'nap' ? 'amber' : 'indigo'}
      >
        {/* Sleep Type Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setSleepType('night')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sleepType === 'night'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>{t.sleep.nightSleep}</span>
          </button>

          <button
            type="button"
            onClick={() => setSleepType('nap')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sleepType === 'nap'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{t.sleep.nap}</span>
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs backdrop-blur-md">
            {formError}
          </div>
        )}

        {sleepType === 'night' ? (
          /* Night Sleep Form */
          <form onSubmit={handleAddSleep} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Bed className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{t.sleep.bedtime}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={bedtimeDate}
                  onChange={(e) => setBedtimeDate(e.target.value)}
                  className="px-3.5 py-3 text-xs border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
                <input
                  type="time"
                  required
                  value={bedtimeTime}
                  onChange={(e) => setBedtimeTime(e.target.value)}
                  className="px-3.5 py-3 text-xs border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <SunMedium className="h-3.5 w-3.5 text-amber-500" />
                <span>{t.sleep.wakeTime}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={wakeDate}
                  onChange={(e) => setWakeDate(e.target.value)}
                  className="px-3.5 py-3 text-xs border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
                <input
                  type="time"
                  required
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="px-3.5 py-3 text-xs border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">{t.sleep.notes}</label>
              <input
                type="text"
                placeholder={t.sleep.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 text-xs border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-slate-200/80 dark:border-slate-700/70 bg-white/60 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-white dark:hover:bg-slate-700/60 transition-all cursor-pointer active:scale-95"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shadow-[0_6px_20px_rgba(99,102,241,0.35)] border border-indigo-400/20 cursor-pointer"
              >
                {submitting ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        ) : (
          /* Daytime Nap Form */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const mins = parseInt(napMinutes, 10);
              if (mins > 0) handleAddNap(mins, napNotes);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                {t.sleep.napDuration}
              </label>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[15, 20, 30, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNapMinutes(m.toString())}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      napMinutes === m.toString()
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input */}
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  required
                  value={napMinutes}
                  onChange={(e) => setNapMinutes(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  {locale === 'th' ? 'นาที' : 'minutes'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                {t.sleep.notes}
              </label>
              <input
                type="text"
                placeholder={locale === 'th' ? 'เช่น งีบช่วงบ่ายก่อนเริ่มทำงานต่อ' : 'e.g. Afternoon recharge'}
                value={napNotes}
                onChange={(e) => setNapNotes(e.target.value)}
                className="w-full px-4 py-3 text-xs border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-slate-200/80 dark:border-slate-700/70 bg-white/60 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-white dark:hover:bg-slate-700/60 transition-all cursor-pointer active:scale-95"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting || !napMinutes}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shadow-[0_6px_20px_rgba(245,158,11,0.35)] border border-amber-300/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="h-4 w-4" />
                <span>{submitting ? t.common.saving : t.sleep.addNap}</span>
              </button>
            </div>
          </form>
        )}
      </FloatingGlassModal>

      {/* Sleep Logs History */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.sleep.recentLogs}</h2>
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.common.loading}</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center mx-auto">
              <Moon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.sleep.noLogs}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{t.sleep.noLogsHint}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSleepType('night');
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer active:scale-95 border border-indigo-200/50 dark:border-indigo-800/40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.sleep.recordSleep}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const napItem = isNap(log);
              return (
                <div key={log.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        napItem
                          ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                          : 'bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40'
                      }`}>
                        {napItem ? <Zap className="h-2.5 w-2.5 text-amber-500" /> : <Moon className="h-2.5 w-2.5 text-indigo-500" />}
                        <span>{napItem ? (locale === 'th' ? 'งีบหลับ' : 'Nap') : (locale === 'th' ? 'การนอนหลัก' : 'Night')}</span>
                      </span>

                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatHoursMinutes(log.duration_minutes)}
                      </span>

                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {new Date(log.wake_time).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        {new Date(log.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &rarr;{' '}
                        {new Date(log.wake_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-md mt-1">
                        &ldquo;{log.notes.replace(/^\[(งีบหลับ|Nap)\]\s*/, '')}&rdquo;
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteSleep(log.id)}
                    className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title={t.common.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Dock (Above BottomNav) */}
      <div className="fixed bottom-20 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-md mx-auto px-4 flex justify-end gap-2.5">
          {/* Add Nap Button */}
          <button
            type="button"
            onClick={() => {
              setSleepType('nap');
              setShowForm(true);
            }}
            className="pointer-events-auto shadow-[0_8px_20px_rgba(245,158,11,0.35)] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white py-3 px-4 rounded-full flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer border border-amber-300/30"
          >
            <Zap className="h-4 w-4" />
            <span>{locale === 'th' ? 'งีบหลับ' : 'Add Nap'}</span>
          </button>

          {/* Record Night Sleep Button */}
          <button
            type="button"
            onClick={() => {
              setSleepType('night');
              setShowForm(true);
            }}
            className="pointer-events-auto shadow-[0_8px_25px_rgba(99,102,241,0.35)] bg-gradient-to-r from-indigo-600 to-slate-900 hover:from-indigo-700 hover:to-slate-950 active:scale-95 text-white py-3 px-4 sm:px-5 rounded-full flex items-center gap-2 font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer border border-indigo-400/30"
          >
            <Plus className="h-4 w-4" />
            <span>{t.sleep.recordSleep}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
