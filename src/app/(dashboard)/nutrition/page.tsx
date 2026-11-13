'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import FloatingGlassModal from '@/components/shared/FloatingGlassModal';
import { 
  Utensils, 
  Plus, 
  Trash2, 
  Tag, 
  Clock, 
  Sun,
  Sunset,
  Cookie,
  Flame,
  Camera,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Check,
  X
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

  // AI Photo Recognition State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiDemoNotice, setAiDemoNotice] = useState<string | null>(null);
  const [analyzedSuccess, setAnalyzedSuccess] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiNote(null);
    setAiDemoNotice(null);
    setAnalyzedSuccess(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      setImagePreview(base64Url);
      await analyzeFoodPhoto(base64Url, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeFoodPhoto = async (base64Image: string, mimeType: string) => {
    setAnalyzingImage(true);
    try {
      const res = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mimeType }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const result = json.data;
        if (result.food_name) setFoodName(result.food_name);
        if (result.meal_type) setMealType(result.meal_type);
        if (result.portion_description) setPortion(result.portion_description);
        if (result.calories_estimate) setCalories(result.calories_estimate.toString());
        if (result.nutrition_note) setAiNote(result.nutrition_note);
        if (result.demo_notice) setAiDemoNotice(result.demo_notice);
        setAnalyzedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to analyze food photo:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setAiNote(null);
    setAiDemoNotice(null);
    setAnalyzedSuccess(false);
  };

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
        source: imagePreview ? 'ai_assisted' : 'manual',
        user_confirmed: true,
        logged_at: new Date().toISOString(),
      });

      if (!error) {
        setFoodName('');
        setPortion('');
        setCalories('');
        handleClearImage();
        setShowForm(false);
        await fetchLogs();

        // Sync quests and award points via server
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
      color: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
    },
    lunch: {
      label: t.nutrition.lunch,
      icon: Utensils,
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
    },
    dinner: {
      label: t.nutrition.dinner,
      icon: Sunset,
      color: 'text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40',
    },
    snack: {
      label: t.nutrition.snack,
      icon: Cookie,
      color: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/40',
    },
  };

  const totalCalories = logs.reduce((sum, item) => sum + (item.calories_estimate || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.nutrition.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.nutrition.subtitle}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl shadow-xs">
          <Utensils className="h-6 w-6" />
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

      {/* Floating Glassmorphism Modal for Adding Meal */}
      <FloatingGlassModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          handleClearImage();
        }}
        title={t.nutrition.recordMeal}
        icon={
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Utensils className="h-4 w-4" />
          </div>
        }
        badge={locale === 'th' ? '✨ กล้อง AI วิเคราะห์แคลอรี่' : '✨ AI Vision Recognition'}
        glowColor="emerald"
      >
        {/* Hidden File Inputs for Camera and Gallery */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelected}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelected}
          className="hidden"
        />

        <div className="space-y-4">
          {/* AI Camera & Photo Recognition Area */}
          {!imagePreview ? (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-500/15 dark:to-teal-500/10 border border-emerald-300/40 dark:border-emerald-700/40 rounded-3xl p-3.5 space-y-2.5 relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.nutrition.aiScanTitle}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {t.nutrition.aiScanDesc}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>{t.nutrition.takePhoto}</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-emerald-300/40 dark:border-emerald-700/40 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.nutrition.uploadPhoto}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden border border-emerald-300/50 dark:border-emerald-700/50 bg-slate-950/20 shadow-md">
              {/* Food Image Preview */}
              <div className="relative h-44 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Captured food"
                  className="w-full h-full object-cover"
                />

                {/* Analyzing Overlay with animated scanning beam */}
                {analyzingImage && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in fade-in">
                    <div className="relative flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                      <Sparkles className="h-4 w-4 text-emerald-300 absolute" />
                    </div>
                    <div className="text-xs font-bold text-white tracking-wide">
                      {t.nutrition.analyzing}
                    </div>
                    <div className="text-[10px] text-emerald-200/80">
                      {t.nutrition.analyzingHint}
                    </div>
                  </div>
                )}

                {/* Floating controls on top of image */}
                {!analyzingImage && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all cursor-pointer"
                      title={t.nutrition.retake}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-rose-600 transition-all cursor-pointer"
                      title={t.nutrition.remove}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* AI Estimation Result Banner */}
              {analyzedSuccess && !analyzingImage && (
                <div className="p-3 bg-emerald-500/15 dark:bg-emerald-950/60 border-t border-emerald-400/20 backdrop-blur-md space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    <span>{t.nutrition.aiSuggested}</span>
                  </div>
                  {aiNote && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      💡 {aiNote}
                    </p>
                  )}
                  {aiDemoNotice && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400/90 font-medium">
                      ℹ️ {aiDemoNotice}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Fields Separator */}
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 pt-1">
            <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {t.nutrition.orManualInput}
            </span>
            <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleAddMeal} className="space-y-4">
            {/* Meal Type Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">{t.nutrition.mealType}</label>
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
                      className={`py-2 px-1 text-xs font-bold rounded-2xl border transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                          : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-700/70'
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">{t.nutrition.foodName}</label>
              <input
                type="text"
                required
                placeholder={t.nutrition.foodNamePlaceholder}
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">{t.nutrition.portion}</label>
                <input
                  type="text"
                  placeholder={t.nutrition.portionPlaceholder}
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">{t.nutrition.calories}</label>
                <input
                  type="number"
                  placeholder="e.g. 550"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  handleClearImage();
                }}
                className="flex-1 py-3 border border-slate-200/80 dark:border-slate-700/70 bg-white/60 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-white dark:hover:bg-slate-700/60 transition-all cursor-pointer active:scale-95"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting || !foodName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shadow-[0_6px_20px_rgba(16,185,129,0.35)] border border-emerald-400/20 cursor-pointer"
              >
                {submitting ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        </div>
      </FloatingGlassModal>

      {/* Today's Meals List */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.nutrition.todaysMeals}</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">{logs.length} {t.dashboard.mealsLogged}</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.common.loading}</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.nutrition.noMeals}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{t.nutrition.noMealsHint}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              aria-label={t.nutrition.addMeal}
              className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center mx-auto cursor-pointer active:scale-95 border border-emerald-200/50 dark:border-emerald-800/40 shadow-xs"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const cfg = mealTypeConfigs[log.meal_type] || mealTypeConfigs.lunch;
              return (
                <div key={log.id} className="py-3.5 flex items-start justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{log.food_name}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {log.portion_description && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Tag className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          {log.portion_description}
                        </span>
                      )}
                      {log.calories_estimate && (
                        <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 text-[11px] bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          <Flame className="h-3 w-3" />
                          ~{Math.round(log.calories_estimate)} kcal
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMeal(log.id)}
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

      {/* Floating Centered Add Meal Button (Above BottomNav) */}
      <div className="fixed bottom-20 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-md mx-auto px-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            aria-label={t.nutrition.addMeal}
            className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 active:scale-90 text-white shadow-[0_10px_25px_rgba(16,185,129,0.45)] border-2 border-white/50 dark:border-slate-800/60 flex items-center justify-center transition-all duration-200 cursor-pointer"
          >
            <Plus className="h-7 w-7 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
