'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { 
  Utensils, 
  Plus, 
  Trash2, 
  Tag, 
  Clock, 
  Camera, 
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Cookie,
  Flame
} from 'lucide-react';
import type { FoodLog, MealType } from '@/types/database';

export default function NutritionPage() {
  const { t, locale } = useLanguage();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // New Meal Form State
  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [portion, setPortion] = useState('');
  const [calories, setCalories] = useState('');

  const supabase = createClient();

  const fetchLogs = async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .gte('logged_at', startOfDay.toISOString())
        .order('logged_at', { ascending: false });

      if (!error && data) {
        setLogs(data as FoodLog[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('food_logs').insert({
        user_id: user.id,
        food_name: foodName.trim(),
        meal_type: mealType,
        portion_description: portion.trim() || null,
        calories_estimate: calories ? parseFloat(calories) : null,
        source: 'manual',
        user_confirmed: true,
        logged_at: new Date().toISOString(),
      });

      if (!error) {
        setFoodName('');
        setPortion('');
        setCalories('');
        setShowForm(false);
        await fetchLogs();

        if (logs.length === 0) {
          await supabase.from('point_transactions').insert({
            user_id: user.id,
            points_delta: 10,
            reason: 'Logged meal today',
            idempotency_key: `meal_${user.id}_${new Date().toISOString().slice(0, 10)}`,
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMeal = async (id: string) => {
    const { error } = await supabase.from('food_logs').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const mealTypeConfigs: Record<MealType, { label: string; icon: typeof Sun; color: string; badge: string }> = {
    breakfast: {
      label: t.nutrition.breakfast,
      icon: Sun,
      color: 'text-amber-600',
      badge: 'bg-amber-100/80 text-amber-900 border-amber-200/50',
    },
    lunch: {
      label: t.nutrition.lunch,
      icon: Utensils,
      color: 'text-emerald-600',
      badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-200/50',
    },
    dinner: {
      label: t.nutrition.dinner,
      icon: Sunset,
      color: 'text-indigo-600',
      badge: 'bg-indigo-100/80 text-indigo-900 border-indigo-200/50',
    },
    snack: {
      label: t.nutrition.snack,
      icon: Cookie,
      color: 'text-purple-600',
      badge: 'bg-purple-100/80 text-purple-900 border-purple-200/50',
    },
  };

  const totalCalories = logs.reduce((sum, item) => sum + (item.calories_estimate || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t.nutrition.title}</h1>
          <p className="text-xs text-slate-500">{t.nutrition.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>{t.nutrition.addMeal}</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-[32px] p-6 shadow-[0_12px_30px_rgba(245,158,11,0.25)] space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider">
            {locale === 'th' ? 'ภาพรวมพลังงานวันนี้' : "Today's Energy"}
          </span>
          <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold">
            {logs.length} {t.dashboard.mealsLogged}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tight">{Math.round(totalCalories)}</span>
          <span className="text-sm font-semibold text-amber-100">kcal ({locale === 'th' ? 'โดยประมาณ' : 'est.'})</span>
        </div>

        <p className="text-xs text-amber-100/90 leading-relaxed">
          {locale === 'th'
            ? 'เป้าหมายไม่ใช่การจำกัดอาหาร แต่คือการสังเกตสิ่งที่เรากินอย่างมีสติ'
            : 'Focus on mindful awareness and balanced energy, not harsh restrictions.'}
        </p>
      </div>

      {/* Add Meal Form */}
      {showForm && (
        <div className="bg-white rounded-[28px] p-5 border border-emerald-200/80 shadow-[0_8px_30px_rgba(16,185,129,0.08)] space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">{t.nutrition.recordMeal}</h2>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
              Manual Log
            </span>
          </div>

          <form onSubmit={handleAddMeal} className="space-y-4">
            {/* Meal Type Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.nutrition.mealType}</label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
                  const cfg = mealTypeConfigs[type];
                  const Icon = cfg.icon;
                  const isSelected = mealType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMealType(type)}
                      className={`py-2 px-1 text-xs font-bold rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px]">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{t.nutrition.foodName}</label>
              <input
                type="text"
                required
                placeholder={t.nutrition.foodNamePlaceholder}
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t.nutrition.portion}</label>
                <input
                  type="text"
                  placeholder={t.nutrition.portionPlaceholder}
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t.nutrition.calories}</label>
                <input
                  type="number"
                  placeholder="e.g. 550"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
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
                disabled={submitting || !foodName.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {submitting ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Meals List */}
      <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">{t.nutrition.todaysMeals}</h2>
          <span className="text-xs text-slate-400">{logs.length} {t.dashboard.mealsLogged}</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.common.loading}</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Utensils className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">{t.nutrition.noMeals}</p>
            <p className="text-[11px] text-slate-400">{t.nutrition.noMealsHint}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const cfg = mealTypeConfigs[log.meal_type] || mealTypeConfigs.lunch;
              return (
                <div key={log.id} className="py-3.5 flex items-start justify-between hover:bg-slate-50/50 px-1 rounded-xl transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{log.food_name}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {log.portion_description && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Tag className="h-3 w-3 text-slate-400" />
                          {log.portion_description}
                        </span>
                      )}
                      {log.calories_estimate && (
                        <span className="font-semibold text-amber-700 flex items-center gap-1 text-[11px] bg-amber-50 px-2 py-0.5 rounded-md">
                          <Flame className="h-3 w-3" />
                          ~{Math.round(log.calories_estimate)} kcal
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMeal(log.id)}
                    className="text-slate-300 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-colors"
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
    </div>
  );
}
