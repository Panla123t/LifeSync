'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { 
  Droplets, 
  Trash2, 
  Trophy, 
  Clock, 
  GlassWater, 
  Sparkles,
  CupSoda,
  Pencil,
  Check
} from 'lucide-react';
import type { WaterLog } from '@/types/database';

export default function HydrationPage() {
  const { t, locale } = useLanguage();
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Daily Water Goal State
  const [dailyGoal, setDailyGoal] = useState<number>(2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('2000');

  const supabase = createClient();

  const fetchLogs = async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .gte('logged_at', startOfDay.toISOString())
        .order('logged_at', { ascending: false });

      if (!error && data) {
        setLogs(data as WaterLog[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Load persisted water goal from localStorage if set
    const saved = localStorage.getItem('lifesync_water_goal');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 500 && parsed <= 8000) {
        setDailyGoal(parsed);
        setGoalInput(parsed.toString());
      }
    }
  }, []);

  const totalAmount = logs.reduce((sum, item) => sum + item.amount_ml, 0);
  const percentage = Math.min(100, Math.round((totalAmount / dailyGoal) * 100));

  const handleSaveGoal = (val?: number) => {
    const target = val ?? parseInt(goalInput, 10);
    if (!isNaN(target) && target >= 500 && target <= 8000) {
      setDailyGoal(target);
      setGoalInput(target.toString());
      localStorage.setItem('lifesync_water_goal', target.toString());
      setIsEditingGoal(false);
    }
  };

  const addWater = async (amount: number) => {
    if (amount <= 0 || submitting) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('water_logs').insert({
        user_id: user.id,
        amount_ml: amount,
        logged_at: new Date().toISOString(),
      });

      if (!error) {
        setCustomAmount('');
        await fetchLogs();

        // Trigger quest sync to auto-award points and mark quests
        try {
          await fetch('/api/quests/sync', { method: 'POST' });
        } catch {
          // Background sync
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from('water_logs').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.hydration.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.hydration.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <div className="bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 p-2.5 rounded-2xl shadow-xs">
            <Droplets className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Aesthetic Hydration Visualizer Card */}
      <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 text-white rounded-[32px] p-6 shadow-[0_12px_30px_rgba(14,165,233,0.3)] space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-sky-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-100 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-sky-200" />
            <span>{t.hydration.todaysIntake}</span>
          </div>

          {/* Goal Badge with Quick Edit Trigger */}
          <button
            type="button"
            onClick={() => setIsEditingGoal((prev) => !prev)}
            className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-white/20"
            title={locale === 'th' ? 'เปลี่ยนเป้าหมายการดื่มน้ำ' : 'Change water goal'}
          >
            <span>{t.hydration.goal}: {dailyGoal} ml</span>
            <Pencil className="h-3 w-3 text-sky-100" />
          </button>
        </div>

        {/* Inline Goal Setter Expansion */}
        {isEditingGoal && (
          <div className="bg-white/15 dark:bg-black/30 backdrop-blur-xl rounded-2xl p-4 space-y-3 border border-white/25 animate-in fade-in duration-200 relative z-10">
            <div className="flex items-center justify-between text-xs text-sky-100 font-bold">
              <span>{locale === 'th' ? '🎯 ปรับเปลี่ยนเป้าหมายประจำวัน' : '🎯 Change Daily Goal'}</span>
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="text-[11px] text-sky-200 hover:text-white cursor-pointer"
              >
                {t.common.cancel}
              </button>
            </div>

            {/* Quick Goal Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1500, 2000, 2500, 3000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSaveGoal(preset)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dailyGoal === preset
                      ? 'bg-white text-sky-700 shadow-sm'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {preset} ml
                </button>
              ))}
            </div>

            {/* Custom Goal Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="number"
                min="500"
                max="8000"
                step="100"
                placeholder="เช่น 2200"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-white/20 rounded-xl text-white placeholder-sky-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="button"
                onClick={() => handleSaveGoal()}
                className="px-4 py-2 bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{t.common.save}</span>
              </button>
            </div>
          </div>
        )}

        {/* Big Counter Display */}
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-5xl font-black tracking-tight">{totalAmount}</span>
          <span className="text-base font-semibold text-sky-100">/ {dailyGoal} ml</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="w-full bg-black/15 backdrop-blur-md h-3.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-white h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-sky-100 font-semibold pt-1">
            <span>{percentage}% {t.hydration.reached}</span>
            {percentage >= 100 ? (
              <span className="flex items-center gap-1.5 text-white font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full">
                <Trophy className="h-3.5 w-3.5 text-amber-300" /> {t.hydration.targetMet}
              </span>
            ) : (
              <span className="text-[11px] text-sky-200">
                {locale === 'th' ? `เหลืออีก ${Math.max(0, dailyGoal - totalAmount)} ml` : `${Math.max(0, dailyGoal - totalAmount)} ml left`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Water Logging Section (Quick Presets + Plain Manual Input below) */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-500" />
            <span>{locale === 'th' ? 'บันทึกการดื่มน้ำ' : 'Log Water Intake'}</span>
          </h2>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">1-Tap or Custom</span>
        </div>

        {/* 1-Tap Quick Presets */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { ml: 100, label: locale === 'th' ? 'จิบน้ำ' : 'Sip', icon: GlassWater },
            { ml: 250, label: locale === 'th' ? '1 แก้ว' : 'Glass', icon: CupSoda },
            { ml: 500, label: locale === 'th' ? '1 ขวด' : 'Bottle', icon: Droplets },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.ml}
                type="button"
                disabled={submitting}
                onClick={() => addWater(item.ml)}
                className="group py-3.5 px-3 rounded-2xl border border-sky-100 dark:border-sky-900/40 bg-gradient-to-b from-sky-50/70 to-sky-50/30 dark:from-sky-950/40 dark:to-sky-900/20 hover:to-sky-100/70 dark:hover:to-sky-900/40 active:scale-95 transition-all flex flex-col items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-sm shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-sky-800 dark:text-sky-200">+{item.ml} ml</span>
                <span className="text-[10px] text-sky-500/80 dark:text-sky-400/80 font-normal mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Plain Manual Input Field Below */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            {t.hydration.customAmount}
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseInt(customAmount, 10);
              if (!isNaN(val) && val > 0) {
                addWater(val);
              }
            }}
            className="flex gap-2 items-center"
          >
            <div className="relative flex-1">
              <input
                type="number"
                min="10"
                max="5000"
                step="10"
                placeholder={locale === 'th' ? 'ระบุปริมาณ เช่น 350 ml' : 'e.g. 350 ml'}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                ml
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || !customAmount}
              className="py-3 px-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-md border border-sky-400/20 cursor-pointer whitespace-nowrap"
            >
              {submitting ? t.common.saving : t.hydration.add}
            </button>
          </form>
        </div>
      </div>

      {/* Today's Log History */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.hydration.todaysLogs}</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">{logs.length} {locale === 'th' ? 'รายการ' : 'entries'}</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.common.loading}</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-400 flex items-center justify-center mx-auto">
              <Droplets className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.hydration.noLogs}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {locale === 'th' ? 'แตะเลือกขนาดแก้วด้านบนหรือระบุปริมาณเพื่อบันทึกน้ำแก้วแรก!' : t.hydration.noLogsHint}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-white">{log.amount_ml} ml</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={t.common.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
