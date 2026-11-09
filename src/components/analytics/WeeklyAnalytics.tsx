'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { 
  Droplets, 
  Moon, 
  Utensils, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Calendar,
  Sparkles
} from 'lucide-react';

export interface DailyHydration {
  date: string;
  dayLabel: string;
  amount_ml: number;
}

export interface DailySleep {
  date: string;
  dayLabel: string;
  night_hours: number;
  nap_hours: number;
  total_hours: number;
  nap_minutes: number;
}

export interface DailyNutrition {
  date: string;
  dayLabel: string;
  calories: number;
  meals_count: number;
}

interface WeeklyAnalyticsProps {
  hydrationData: DailyHydration[];
  sleepData: DailySleep[];
  nutritionData: DailyNutrition[];
  waterGoal?: number;
}

export default function WeeklyAnalytics({
  hydrationData,
  sleepData,
  nutritionData,
  waterGoal = 2000,
}: WeeklyAnalyticsProps) {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'water' | 'sleep' | 'nutrition'>('water');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration Calculations
  const totalWater = hydrationData.reduce((sum, d) => sum + d.amount_ml, 0);
  const avgWater = Math.round(totalWater / Math.max(1, hydrationData.length));
  const waterMetDays = hydrationData.filter((d) => d.amount_ml >= waterGoal).length;
  const bestWaterDay = [...hydrationData].sort((a, b) => b.amount_ml - a.amount_ml)[0];

  // Sleep Calculations
  const totalSleepHours = sleepData.reduce((sum, d) => sum + d.total_hours, 0);
  const avgSleepHours = Number((totalSleepHours / Math.max(1, sleepData.length)).toFixed(1));
  const totalNaps = sleepData.reduce((sum, d) => sum + (d.nap_minutes > 0 ? 1 : 0), 0);
  const optimalSleepDays = sleepData.filter((d) => d.total_hours >= 7 && d.total_hours <= 9).length;

  // Nutrition Calculations
  const totalCalories = nutritionData.reduce((sum, d) => sum + d.calories, 0);
  const avgCalories = Math.round(totalCalories / Math.max(1, nutritionData.length));
  const totalMeals = nutritionData.reduce((sum, d) => sum + d.meals_count, 0);

  // Custom Glass Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-3 shadow-xl text-xs space-y-1">
        <div className="font-bold text-slate-300 pb-1 border-b border-white/10 flex items-center justify-between gap-4">
          <span>{data.dayLabel}</span>
          <span className="text-[10px] text-slate-400 font-normal">{data.date}</span>
        </div>

        {activeTab === 'water' && (
          <div className="space-y-0.5 pt-0.5">
            <div className="text-sky-300 font-extrabold text-sm flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-sky-400" />
              <span>{data.amount_ml.toLocaleString()} ml</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {Math.round((data.amount_ml / waterGoal) * 100)}% {t.hydration.reached}
            </div>
          </div>
        )}

        {activeTab === 'sleep' && (
          <div className="space-y-0.5 pt-0.5">
            <div className="text-indigo-300 font-extrabold text-sm flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              <span>{data.night_hours}h {locale === 'th' ? 'นอนหลัก' : 'Night'}</span>
            </div>
            {data.nap_minutes > 0 && (
              <div className="text-amber-300 text-[11px] font-bold flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>+{data.nap_minutes}m {locale === 'th' ? 'งีบหลับ' : 'Nap'}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="space-y-0.5 pt-0.5">
            <div className="text-emerald-300 font-extrabold text-sm flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-emerald-400" />
              <span>{Math.round(data.calories).toLocaleString()} kcal</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {data.meals_count} {t.dashboard.mealsLogged}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[30px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_25px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.35)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <span>{t.analytics.title}</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t.analytics.subtitle}
          </p>
        </div>

        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>7 {t.analytics.daysCount}</span>
        </span>
      </div>

      {/* Habit Tabs Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab('water')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'water'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Droplets className="h-3.5 w-3.5" />
          <span>{t.analytics.tabWater}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sleep')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'sleep'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Moon className="h-3.5 w-3.5" />
          <span>{t.analytics.tabSleep}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nutrition')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'nutrition'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Utensils className="h-3.5 w-3.5" />
          <span>{t.analytics.tabNutrition}</span>
        </button>
      </div>

      {/* Quick KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-2">
        {activeTab === 'water' && (
          <>
            <div className="bg-sky-50/70 dark:bg-sky-950/30 p-2.5 rounded-2xl border border-sky-100/80 dark:border-sky-900/40">
              <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80 font-medium">{t.analytics.weeklyAvg}</div>
              <div className="text-sm font-extrabold text-sky-900 dark:text-sky-200 mt-0.5">{avgWater} ml</div>
            </div>
            <div className="bg-sky-50/70 dark:bg-sky-950/30 p-2.5 rounded-2xl border border-sky-100/80 dark:border-sky-900/40">
              <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80 font-medium">{t.analytics.goalMet}</div>
              <div className="text-sm font-extrabold text-sky-900 dark:text-sky-200 mt-0.5">{waterMetDays}/7 {t.analytics.daysCount}</div>
            </div>
            <div className="bg-sky-50/70 dark:bg-sky-950/30 p-2.5 rounded-2xl border border-sky-100/80 dark:border-sky-900/40">
              <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80 font-medium">{t.analytics.bestDay}</div>
              <div className="text-sm font-extrabold text-sky-900 dark:text-sky-200 mt-0.5">
                {bestWaterDay ? `${bestWaterDay.dayLabel}` : '-'}
              </div>
            </div>
          </>
        )}

        {activeTab === 'sleep' && (
          <>
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40">
              <div className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">{t.analytics.weeklyAvg}</div>
              <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200 mt-0.5">{avgSleepHours} h</div>
            </div>
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40">
              <div className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">{locale === 'th' ? 'พักผ่อนเหมาะสม' : 'Optimal Nights'}</div>
              <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200 mt-0.5">{optimalSleepDays}/7 {t.analytics.daysCount}</div>
            </div>
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40">
              <div className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">{t.analytics.napTotal}</div>
              <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{totalNaps} {locale === 'th' ? 'ครั้ง' : 'naps'}</div>
            </div>
          </>
        )}

        {activeTab === 'nutrition' && (
          <>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40">
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">{t.analytics.weeklyAvg}</div>
              <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">~{avgCalories} kcal</div>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40">
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">{t.dashboard.mealsLogged}</div>
              <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">{totalMeals} {locale === 'th' ? 'มื้อ' : 'meals'}</div>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40">
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">{locale === 'th' ? 'สถานะพลังงาน' : 'Status'}</div>
              <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">
                {avgCalories > 0 ? (locale === 'th' ? 'สม่ำเสมอ' : 'Steady') : '-'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visual Chart Area */}
      <div className="h-52 w-full pt-2">
        {!mounted ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
            {t.common.loading}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'water' ? (
              <BarChart data={hydrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="dayLabel" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.max(waterGoal + 200, dataMax + 200)]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }} />
                <ReferenceLine 
                  y={waterGoal} 
                  stroke="#38bdf8" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{
                    value: `${waterGoal}ml`,
                    position: 'insideTopRight',
                    fill: '#0284c7',
                    fontSize: 9,
                    fontWeight: 700
                  }}
                />
                <Bar 
                  dataKey="amount_ml" 
                  fill="url(#waterBarGradient)" 
                  radius={[8, 8, 4, 4]} 
                  maxBarSize={32}
                />
              </BarChart>
            ) : activeTab === 'sleep' ? (
              <BarChart data={sleepData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="nightSleepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.65} />
                  </linearGradient>
                  <linearGradient id="napGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="dayLabel" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false}
                  domain={[0, 12]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                <ReferenceLine 
                  y={7} 
                  stroke="#818cf8" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{
                    value: '7h Goal',
                    position: 'insideTopRight',
                    fill: '#6366f1',
                    fontSize: 9,
                    fontWeight: 700
                  }}
                />
                <Bar 
                  dataKey="night_hours" 
                  stackId="sleepStack"
                  fill="url(#nightSleepGradient)" 
                  radius={[0, 0, 4, 4]} 
                  maxBarSize={30}
                />
                <Bar 
                  dataKey="nap_hours" 
                  stackId="sleepStack"
                  fill="url(#napGradient)" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={30}
                />
              </BarChart>
            ) : (
              <AreaChart data={nutritionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="nutritionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="dayLabel" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fill="url(#nutritionAreaGradient)" 
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Insight Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span>
            {activeTab === 'water' && (waterMetDays >= 4 
              ? (locale === 'th' ? 'การดื่มน้ำสม่ำเสมอดีมาก รักษาระดับนี้ไว้!' : 'Great hydration consistency this week!')
              : (locale === 'th' ? 'จิบน้ำบ่อยขึ้นในระหว่างวันเพื่อแตะเป้าหมาย' : 'Sip water periodically to hit your target'))}
            {activeTab === 'sleep' && (avgSleepHours >= 7 
              ? (locale === 'th' ? 'คุณพักผ่อนได้ยอดเยี่ยม ช่วยฟื้นฟูสมองได้เต็มที่' : 'Adequate sleep recovery maintained!')
              : (locale === 'th' ? 'พยายามเข้านอนให้เร็วขึ้น 30 นาทีเพื่อการฟื้นฟู' : 'Aim for an earlier bedtime to restore energy'))}
            {activeTab === 'nutrition' && (totalMeals >= 12
              ? (locale === 'th' ? 'บันทึกอาหารสม่ำเสมอ ทำให้เห็นภาพรวมพลังงานชัดเจน' : 'Consistent food tracking builds mindfulness!')
              : (locale === 'th' ? 'บันทึกมื้ออาหารต่อเนื่องเพื่อดูแนวโน้มสารอาหาร' : 'Log meals regularly to see complete energy trends'))}
          </span>
        </div>
      </div>
    </div>
  );
}
