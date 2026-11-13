'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { 
  Droplets, 
  Utensils, 
  Moon, 
  Trophy, 
  Sparkles, 
  ChevronRight, 
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Share2
} from 'lucide-react';
import type { Quest, UserQuest } from '@/types/database';
import LevelUpModal, { getLevelFromPoints } from '@/components/gamification/LevelUpModal';
import ShareStoryModal from '@/components/analytics/ShareStoryModal';
import { fireConfettiBurst, fireLevelUpCannons } from '@/lib/utils/confetti';
import { playWaterSplash, playLevelUpFanfare, playSuccessChime } from '@/lib/utils/sound';
import WeeklyAnalytics, { 
  DailyHydration, 
  DailySleep, 
  DailyNutrition 
} from '@/components/analytics/WeeklyAnalytics';

export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const [userName, setUserName] = useState<string>('Friend');
  const [waterTotal, setWaterTotal] = useState<number>(0);
  const [mealsCount, setMealsCount] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<string>('0h');
  const [sleepDurationMins, setSleepDurationMins] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddingWater, setQuickAddingWater] = useState(false);
  const [todayFormatted, setTodayFormatted] = useState<string>('');
  const [waterGoal, setWaterGoal] = useState<number>(2000);
  const [dashboardView, setDashboardView] = useState<'today' | 'weekly'>('today');
  const [weeklyHydration, setWeeklyHydration] = useState<DailyHydration[]>([]);
  const [weeklySleep, setWeeklySleep] = useState<DailySleep[]>([]);
  const [weeklyNutrition, setWeeklyNutrition] = useState<DailyNutrition[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1);
  const [showShareStory, setShowShareStory] = useState(false);

  const supabase = createClient();

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      if (profile?.display_name) setUserName(profile.display_name);

      // 2. Get Today's Water
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: waterLogs } = await supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString());
      
      if (waterLogs) {
        const sum = waterLogs.reduce((acc, curr) => acc + curr.amount_ml, 0);
        setWaterTotal(sum);
      }

      // 3. Get Today's Meals
      const { data: foodLogs } = await supabase
        .from('food_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString());
      
      if (foodLogs) {
        setMealsCount(foodLogs.length);
      }

      // 4. Get Latest Sleep
      const { data: sleepLogs } = await supabase
        .from('sleep_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .order('wake_time', { ascending: false })
        .limit(1);

      if (sleepLogs && sleepLogs.length > 0) {
        const mins = sleepLogs[0].duration_minutes;
        setSleepDurationMins(mins);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        setSleepHours(`${h}h ${m}m`);
      }

      // 5. Get User Points
      const { data: pointTxs } = await supabase
        .from('point_transactions')
        .select('points_delta')
        .eq('user_id', user.id);

      if (pointTxs) {
        const totalPoints = pointTxs.reduce((sum, tx) => sum + tx.points_delta, 0);
        setPoints(totalPoints);
        setCurrentLevelNumber(getLevelFromPoints(totalPoints).level);
      }

      // 6. Get Active Quests
      const { data: activeQuests } = await supabase
        .from('quests')
        .select('*')
        .eq('active', true)
        .limit(4);

      if (activeQuests) {
        setQuests(activeQuests as Quest[]);
      }

      // 7. Sync & Auto-Evaluate Today's Quests & Points
      try {
        const syncRes = await fetch('/api/quests/sync', { method: 'POST' });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.completedQuestIds) {
            setCompletedQuestIds(syncData.completedQuestIds);
          }
          if (typeof syncData.totalPoints === 'number') {
            const nextPts = syncData.totalPoints;
            setPoints(nextPts);
            const lvl = getLevelFromPoints(nextPts);
            setCurrentLevelNumber(lvl.level);
            // Only celebrate if level genuinely increased during an active user session
            const lastCelebrated = parseInt(localStorage.getItem('lifesync_celebrated_level') || '0', 10);
            if (lastCelebrated === 0) {
              localStorage.setItem('lifesync_celebrated_level', lvl.level.toString());
            } else if (lvl.level > lastCelebrated) {
              localStorage.setItem('lifesync_celebrated_level', lvl.level.toString());
              setShowLevelUp(true);
            }
          }
          if (syncData.streaks?.overall?.current !== undefined) {
            setStreakDays(syncData.streaks.overall.current);
          }
        }
      } catch (syncErr) {
        console.warn('[Dashboard] Quests sync error:', syncErr);
        const todayDate = new Date().toISOString().slice(0, 10);
        const { data: userQuests } = await supabase
          .from('user_quests')
          .select('quest_id, status')
          .eq('user_id', user.id)
          .eq('quest_date', todayDate)
          .eq('status', 'completed');

        if (userQuests) {
          setCompletedQuestIds(userQuests.map((uq: { quest_id: string }) => uq.quest_id));
        }
      }

      // 8. Aggregate 7-Day Weekly Analytics Data
      const dayNamesTh = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
      const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const past7Days: { dateStr: string; dayLabel: string }[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = locale === 'th' ? dayNamesTh[d.getDay()] : dayNamesEn[d.getDay()];
        past7Days.push({ dateStr, dayLabel });
      }

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const sevenDaysAgoIso = sevenDaysAgo.toISOString();

      const [weekWaterRes, weekSleepRes, weekFoodRes] = await Promise.all([
        supabase
          .from('water_logs')
          .select('amount_ml, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', sevenDaysAgoIso),
        supabase
          .from('sleep_logs')
          .select('duration_minutes, wake_time, bedtime, notes')
          .eq('user_id', user.id)
          .gte('wake_time', sevenDaysAgoIso),
        supabase
          .from('food_logs')
          .select('calories_estimate, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', sevenDaysAgoIso),
      ]);

      const weekWater = weekWaterRes.data || [];
      const weekSleep = weekSleepRes.data || [];
      const weekFood = weekFoodRes.data || [];

      // Hydration 7 days
      const aggHydration: DailyHydration[] = past7Days.map((d) => {
        const amount = weekWater
          .filter((w) => w.logged_at && w.logged_at.slice(0, 10) === d.dateStr)
          .reduce((sum, w) => sum + (w.amount_ml || 0), 0);
        return {
          date: d.dateStr,
          dayLabel: d.dayLabel,
          amount_ml: amount,
        };
      });
      setWeeklyHydration(aggHydration);

      // Sleep 7 days (night sleep vs power naps)
      const aggSleep: DailySleep[] = past7Days.map((d) => {
        const daySleeps = weekSleep.filter(
          (s) => (s.wake_time && s.wake_time.slice(0, 10) === d.dateStr) ||
                 (s.bedtime && s.bedtime.slice(0, 10) === d.dateStr)
        );

        let nightMins = 0;
        let napMins = 0;

        for (const s of daySleeps) {
          const isNap = 
            (s.notes && (s.notes.includes('งีบ') || s.notes.toLowerCase().includes('nap') || s.notes.includes('⚡'))) ||
            (s.duration_minutes <= 60 && s.notes && s.notes.includes('งีบ'));
          if (isNap) {
            napMins += s.duration_minutes || 0;
          } else {
            nightMins += s.duration_minutes || 0;
          }
        }

        const night_hours = Number((nightMins / 60).toFixed(1));
        const nap_hours = Number((napMins / 60).toFixed(1));
        const total_hours = Number(((nightMins + napMins) / 60).toFixed(1));

        return {
          date: d.dateStr,
          dayLabel: d.dayLabel,
          night_hours,
          nap_hours,
          total_hours,
          nap_minutes: napMins,
        };
      });
      setWeeklySleep(aggSleep);

      // Nutrition 7 days
      const aggNutrition: DailyNutrition[] = past7Days.map((d) => {
        const dayFoods = weekFood.filter(
          (f) => f.logged_at && f.logged_at.slice(0, 10) === d.dateStr
        );
        const calories = dayFoods.reduce(
          (sum, f) => sum + (Number(f.calories_estimate) || 0), 0
        );
        return {
          date: d.dateStr,
          dayLabel: d.dayLabel,
          calories,
          meals_count: dayFoods.length,
        };
      });
      setWeeklyNutrition(aggNutrition);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTodayFormatted(
      new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date())
    );
    const savedGoal = localStorage.getItem('lifesync_water_goal');
    if (savedGoal) {
      const parsed = parseInt(savedGoal, 10);
      if (!isNaN(parsed) && parsed >= 500 && parsed <= 8000) {
        setWaterGoal(parsed);
      }
    }
    loadDashboard();
  }, [locale]);

  const handleQuickAddWater = async (amount: number = 250) => {
    if (quickAddingWater) return;
    setQuickAddingWater(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('water_logs').insert({
        user_id: user.id,
        amount_ml: amount,
        logged_at: new Date().toISOString(),
      });

      if (!error) {
        const prevTotal = waterTotal;
        const newTotal = prevTotal + amount;
        setWaterTotal(newTotal);

        if (prevTotal < waterGoal && newTotal >= waterGoal) {
          fireConfettiBurst();
          playSuccessChime();
        } else {
          playWaterSplash();
        }

        setWeeklyHydration((prev) => {
          const todayStr = new Date().toISOString().slice(0, 10);
          return prev.map((item) =>
            item.date === todayStr ? { ...item, amount_ml: item.amount_ml + amount } : item
          );
        });
        if (waterTotal === 0) {
          await supabase.from('point_transactions').insert({
            user_id: user.id,
            points_delta: 10,
            reason: 'Logged water intake',
            idempotency_key: `water_${user.id}_${new Date().toISOString().slice(0, 10)}`,
          });
          setPoints((p) => {
            const nextPoints = p + 10;
            const newLvl = getLevelFromPoints(nextPoints);
            const lastCelebrated = parseInt(localStorage.getItem('lifesync_celebrated_level') || '0', 10);
            if (lastCelebrated > 0 && newLvl.level > lastCelebrated) {
              localStorage.setItem('lifesync_celebrated_level', newLvl.level.toString());
              setCurrentLevelNumber(newLvl.level);
              setShowLevelUp(true);
            }
            return nextPoints;
          });
        }
      }
    } finally {
      setQuickAddingWater(false);
    }
  };

  const waterPercent = Math.min(100, Math.round((waterTotal / waterGoal) * 100));

  return (
    <div className="space-y-5">
      {/* Top Greeting & Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-base shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {todayFormatted}
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {t.dashboard.greeting}, {userName} ✨
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShareStory(true)}
            className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer active:scale-95"
            title={locale === 'th' ? 'แชร์การ์ดความสำเร็จ (Story)' : 'Share Health Story'}
          >
            <Share2 className="h-4 w-4" />
          </button>

          <Link
            href="/quests"
            className="flex items-center gap-1.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all"
          >
            <span className="text-sm">{getLevelFromPoints(points).badgeEmoji}</span>
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
            {streakDays > 0 && (
              <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                {streakDays}d
              </span>
            )}
            <span className="text-xs font-extrabold">{points}</span>
          </Link>
        </div>
      </div>

      {/* View Switcher: Today Overview vs 7-Day Visual Analytics */}
      <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
        <button
          type="button"
          onClick={() => setDashboardView('today')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            dashboardView === 'today'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>☀️ {t.analytics.viewToday}</span>
        </button>
        <button
          type="button"
          onClick={() => setDashboardView('weekly')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            dashboardView === 'weekly'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>📊 {t.analytics.viewWeekly}</span>
        </button>
      </div>

      {dashboardView === 'weekly' ? (
        <WeeklyAnalytics
          hydrationData={weeklyHydration}
          sleepData={weeklySleep}
          nutritionData={weeklyNutrition}
          waterGoal={waterGoal}
        />
      ) : (
        <>
          {/* AI Daily Insight Card (Coach Tone) */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-[28px] p-5 shadow-[0_8px_25px_rgba(16,185,129,0.25)] space-y-2.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md">
                  <Sparkles className="h-4 w-4 text-amber-200" />
                </div>
                <span>{t.dashboard.aiInsightTitle}</span>
              </div>
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-emerald-100 font-medium">
                AI Coach
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed text-emerald-50">
              {waterTotal < 500 ? t.dashboard.aiInsightWaterLow : t.dashboard.aiInsightGood}
            </p>

            <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-200/80">
              <span>{t.dashboard.aiDisclaimer}</span>
              <span className="flex items-center gap-0.5 text-white/90 font-medium">
                LifeSync AI
              </span>
            </div>
          </div>

          {/* 3 Core Habits Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t.dashboard.todaysHabits}
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {locale === 'th' ? 'แตะการ์ดเพื่อดูรายละเอียด' : 'Tap to expand'}
              </span>
            </div>

            {/* Nutrition Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[26px] p-4.5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-amber-200 dark:hover:border-amber-800/60 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Link href="/nutrition" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.nav.meals}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {mealsCount} {t.dashboard.mealsLogged} {locale === 'th' ? 'วันนี้' : 'today'}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/nutrition"
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {mealsCount === 0 
                    ? (locale === 'th' ? 'ยังไม่ได้บันทึกมื้ออาหาร' : 'No meals recorded yet')
                    : (locale === 'th' ? 'บันทึกอาหารแล้ว' : 'Meals tracked')}
                </span>
                <Link
                  href="/nutrition"
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.dashboard.logFood}</span>
                </Link>
              </div>
            </div>

            {/* Hydration Card with 1-Tap Quick Drink */}
            <div className="bg-white dark:bg-slate-900 rounded-[26px] p-4.5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-sky-200 dark:hover:border-sky-800/60 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Link href="/hydration" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.nav.water}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {waterTotal} / {waterGoal} ml ({waterPercent}%)
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  disabled={quickAddingWater}
                  onClick={() => handleQuickAddWater(250)}
                  className="flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 active:scale-95 px-3 py-1.5 rounded-xl border border-sky-200/60 dark:border-sky-800/60 transition-all disabled:opacity-50 cursor-pointer"
                  title="Quick Add 250ml"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+250 ml</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-sky-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
            </div>

            {/* Sleep Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[26px] p-4.5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Link href="/sleep" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.nav.sleep}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {sleepDurationMins > 0 
                        ? `${t.dashboard.latestLog}: ${sleepHours}` 
                        : (locale === 'th' ? 'ยังไม่ได้บันทึกเวลานอน' : 'No sleep logged')}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/sleep"
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Daily Quests Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100/80 dark:bg-amber-950/50 p-1.5 rounded-xl text-amber-700 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.dashboard.dailyQuests}</h2>
          </div>
          <Link
            href="/quests"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {completedQuestIds.length}/{quests.length} {t.dashboard.completed} &rarr;
          </Link>
        </div>

        <div className="space-y-2">
          {quests.map((q) => {
            const isCompleted = completedQuestIds.includes(q.id);
            return (
              <div
                key={q.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/40 text-slate-500 dark:text-slate-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {q.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{q.description}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">+{q.points} {t.common.pts}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LINE Connection Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-[26px] p-4 flex items-center justify-between shadow-xs">
        <div className="space-y-0.5 pr-2">
          <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#06C755]" />
            {t.dashboard.lineBannerTitle}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
            {t.dashboard.lineBannerDesc}
          </div>
        </div>
        <Link
          href="/settings"
          className="bg-[#06C755] hover:bg-[#05b04b] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex-shrink-0 flex items-center gap-1 active:scale-95"
        >
          {t.dashboard.connect} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        levelInfo={getLevelFromPoints(points)}
        points={points}
        locale={locale}
      />

      <ShareStoryModal
        isOpen={showShareStory}
        onClose={() => setShowShareStory(false)}
        userName={userName}
        level={getLevelFromPoints(points).level}
        streak={streakDays}
        weeklyGrade={waterTotal >= 1800 && streakDays >= 3 ? 'A+' : waterTotal >= 1400 ? 'A' : 'B+'}
        waterAvgMl={weeklyHydration.length > 0 ? Math.round(weeklyHydration.reduce((s, x) => s + x.amount_ml, 0) / weeklyHydration.length) : waterTotal}
        mealsCount={weeklyNutrition.reduce((s, x) => s + x.meals_count, 0) || mealsCount}
        sleepAvgHours={weeklySleep.length > 0 ? parseFloat((weeklySleep.reduce((s, x) => s + x.total_hours, 0) / weeklySleep.length).toFixed(1)) : parseFloat(sleepHours) || 7.0}
        points={points}
        locale={locale}
      />
    </div>
  );
}
