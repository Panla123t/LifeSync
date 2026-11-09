'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { Droplets, Plus, Trash2, Trophy, Clock } from 'lucide-react';
import type { WaterLog } from '@/types/database';

export default function HydrationPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dailyGoal = 2000;

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
  }, []);

  const totalAmount = logs.reduce((sum, item) => sum + item.amount_ml, 0);
  const percentage = Math.min(100, Math.round((totalAmount / dailyGoal) * 100));

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

        if (logs.length === 0) {
          await supabase.from('point_transactions').insert({
            user_id: user.id,
            points_delta: 10,
            reason: 'Logged water intake',
            idempotency_key: `water_${user.id}_${new Date().toISOString().slice(0, 10)}`,
          });
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.hydration.title}</h1>
          <p className="text-xs text-slate-500">{t.hydration.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="bg-sky-50 text-sky-600 p-2.5 rounded-2xl">
            <Droplets className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Daily Progress Card */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-100 uppercase tracking-wider">{t.hydration.todaysIntake}</span>
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">{t.hydration.goal}: {dailyGoal} ml</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold">{totalAmount}</span>
          <span className="text-sm font-medium text-sky-100">/ {dailyGoal} ml</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-sky-100 font-medium">
          <span>{percentage}% {t.hydration.reached}</span>
          {percentage >= 100 && (
            <span className="flex items-center gap-1 text-white font-bold">
              <Trophy className="h-3.5 w-3.5" /> {t.hydration.targetMet}
            </span>
          )}
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">{t.hydration.quickAdd}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[100, 250, 500].map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={submitting}
              onClick={() => addWater(amount)}
              className="py-3 px-2 rounded-2xl border border-sky-100 bg-sky-50/60 hover:bg-sky-100/80 active:scale-95 transition-all flex flex-col items-center justify-center text-sky-700 font-semibold text-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mb-1" />
              <span>+{amount} ml</span>
            </button>
          ))}
        </div>

        {/* Custom Amount Form */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseInt(customAmount);
              if (!isNaN(val) && val > 0) {
                addWater(val);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="number"
              min="1"
              max="3000"
              placeholder={t.hydration.customAmount}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={submitting || !customAmount}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {t.hydration.add}
            </button>
          </form>
        </div>
      </div>

      {/* Today's Log History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-800">{t.hydration.todaysLogs}</h2>
        {loading ? (
          <p className="text-xs text-slate-400 py-3 text-center">{t.common.loading}</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <Droplets className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">{t.hydration.noLogs}</p>
            <p className="text-[11px] text-slate-400">{t.hydration.noLogsHint}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{log.amount_ml} ml</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
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
