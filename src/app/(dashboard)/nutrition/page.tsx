'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Utensils, Plus, Trash2, Tag, Clock } from 'lucide-react';
import type { FoodLog, MealType } from '@/types/database';

export default function NutritionPage() {
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

        // Award points if first meal today
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

  const getMealBadgeColor = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return 'bg-amber-100 text-amber-800';
      case 'lunch':
        return 'bg-emerald-100 text-emerald-800';
      case 'dinner':
        return 'bg-indigo-100 text-indigo-800';
      case 'snack':
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nutrition</h1>
          <p className="text-xs text-slate-500">Mindful food logging for sustainable energy</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-2xl shadow-xs transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Add Meal</span>
        </button>
      </div>

      {/* Add Meal Sheet / Card */}
      {showForm && (
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Record a Meal</h2>
          <form onSubmit={handleAddMeal} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Meal Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`py-2 text-xs font-semibold rounded-xl capitalize border transition-all ${
                      mealType === type
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Food / Dish Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicken Rice with cucumbers"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Portion (Optional)</label>
                <input
                  type="text"
                  placeholder="1 bowl / 1 plate"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Calories (Est. kcal)</label>
                <input
                  type="number"
                  placeholder="e.g. 550"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
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
                disabled={submitting || !foodName.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Meal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Meals List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Today&apos;s Meals</h2>
          <span className="text-xs text-slate-400">{logs.length} logged</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-3 text-center">Loading meals...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <Utensils className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No meals logged yet today</p>
            <p className="text-[11px] text-slate-400">Keep track of your fuel by recording your first meal!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getMealBadgeColor(log.meal_type)}`}>
                      {log.meal_type}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{log.food_name}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {log.portion_description && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {log.portion_description}
                      </span>
                    )}
                    {log.calories_estimate && (
                      <span className="font-medium text-slate-700">~{log.calories_estimate} kcal</span>
                    )}
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteMeal(log.id)}
                  className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                  title="Delete meal"
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
