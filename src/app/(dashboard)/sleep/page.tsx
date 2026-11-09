'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Moon, Plus, Trash2, Clock, Bed, SunMedium } from 'lucide-react';
import type { SleepLog } from '@/types/database';

export default function SleepPage() {
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
      setFormError('Wake time must be after bedtime.');
      return;
    }

    const durationMinutes = calculateDurationMinutes(bedDateTime, wakeDateTime);

    if (durationMinutes > 24 * 60) {
      setFormError('Sleep duration cannot exceed 24 hours in a single log.');
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

        // Award points if first sleep log recorded
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sleep Routine</h1>
          <p className="text-xs text-slate-500">Rest well to restore your body and mind</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-2xl shadow-xs transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Record Sleep</span>
        </button>
      </div>

      {/* Latest Sleep Summary Card */}
      {latestLog && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Latest Sleep</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-200 px-2.5 py-1 rounded-full border border-indigo-400/20">
              {new Date(latestLog.wake_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{formatHoursMinutes(latestLog.duration_minutes)}</span>
            <span className="text-xs text-indigo-300">duration</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-800/40 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-indigo-400" />
              <span>Slept: {new Date(latestLog.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <SunMedium className="h-4 w-4 text-amber-400" />
              <span>Woke: {new Date(latestLog.wake_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Sleep Form */}
      {showForm && (
        <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Record Sleep Period</h2>
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddSleep} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Bedtime</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={bedtimeDate}
                  onChange={(e) => setBedtimeDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-900"
                />
                <input
                  type="time"
                  required
                  value={bedtimeTime}
                  onChange={(e) => setBedtimeTime(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Wake-up Time</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={wakeDate}
                  onChange={(e) => setWakeDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-900"
                />
                <input
                  type="time"
                  required
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Felt restful, read before bed"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-2xl text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Sleep'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sleep Logs History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Recent Sleep Records</h2>
        {loading ? (
          <p className="text-xs text-slate-400 py-3 text-center">Loading sleep logs...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <Moon className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No sleep records yet</p>
            <p className="text-[11px] text-slate-400">Record when you slept and woke up to observe your consistency!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{formatHoursMinutes(log.duration_minutes)}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({new Date(log.wake_time).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {new Date(log.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &rarr;{' '}
                      {new Date(log.wake_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {log.notes && (
                    <p className="text-[11px] text-slate-500 italic">&ldquo;{log.notes}&rdquo;</p>
                  )}
                </div>

                <button
                  onClick={() => deleteSleep(log.id)}
                  className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                  title="Delete sleep record"
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
