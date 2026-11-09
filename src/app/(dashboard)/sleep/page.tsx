'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { 
  Moon, 
  Plus, 
  Trash2, 
  Clock, 
  Bed, 
  SunMedium, 
  Sparkles,
  Heart,
  AlarmClock
} from 'lucide-react';
import type { SleepLog } from '@/types/database';

export default function SleepPage() {
  const { t, locale } = useLanguage();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [bedtimeDate, setBedtimeDate] = useState('');
  const [bedtimeTime, setBedtimeTime] = useState('23:00');
  const [wakeDate, setWakeDate] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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
        .limit(10);

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

  const deleteSleep = async (id: string) => {
    const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const formatHoursMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const latestLog = logs[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t.sleep.title}</h1>
          <p className="text-xs text-slate-500">{t.sleep.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white p-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>{t.sleep.recordSleep}</span>
          </button>
        </div>
      </div>

      {/* Hero Sleep Card (Serene Night Aesthetic) */}
      {latestLog ? (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-[32px] p-6 shadow-[0_12px_30px_rgba(30,27,75,0.4)] space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>{t.sleep.latestSleep}</span>
            </span>
            <span className="text-xs bg-white/10 backdrop-blur-md text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/20 font-bold">
              {new Date(latestLog.wake_time).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight">{formatHoursMinutes(latestLog.duration_minutes)}</span>
            <span className="text-sm font-semibold text-indigo-300">{t.sleep.duration}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-800/40 text-xs text-indigo-200">
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

      {/* Add Sleep Form */}
      {showForm && (
        <div className="bg-white rounded-[28px] p-5 border border-indigo-200/80 shadow-[0_8px_30px_rgba(99,102,241,0.08)] space-y-4 animate-in fade-in duration-200">
          <h2 className="text-sm font-bold text-slate-800">{t.sleep.recordSleep}</h2>
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddSleep} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Bed className="h-3.5 w-3.5 text-indigo-600" />
                <span>{t.sleep.bedtime}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={bedtimeDate}
                  onChange={(e) => setBedtimeDate(e.target.value)}
                  className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="time"
                  required
                  value={bedtimeTime}
                  onChange={(e) => setBedtimeTime(e.target.value)}
                  className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <SunMedium className="h-3.5 w-3.5 text-amber-500" />
                <span>{t.sleep.wakeTime}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={wakeDate}
                  onChange={(e) => setWakeDate(e.target.value)}
                  className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="time"
                  required
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{t.sleep.notes}</label>
              <input
                type="text"
                placeholder={t.sleep.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-2xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {submitting ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sleep Logs History */}
      <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <h2 className="text-sm font-bold text-slate-800">{t.sleep.recentLogs}</h2>
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.common.loading}</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto">
              <Moon className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">{t.sleep.noLogs}</p>
            <p className="text-[11px] text-slate-400">{t.sleep.noLogsHint}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-1 rounded-xl transition-colors">
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{formatHoursMinutes(log.duration_minutes)}</span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {new Date(log.wake_time).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {new Date(log.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &rarr;{' '}
                      {new Date(log.wake_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {log.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 px-2 py-1 rounded-md mt-1">
                      &ldquo;{log.notes}&rdquo;
                    </p>
                  )}
                </div>

                <button
                  onClick={() => deleteSleep(log.id)}
                  className="text-slate-300 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-colors"
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
