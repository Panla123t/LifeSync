'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Droplets, 
  Utensils, 
  Moon, 
  Trophy, 
  Sparkles, 
  ChevronRight, 
  Flame,
  CheckCircle2,
  Circle
} from 'lucide-react';
import type { Quest, UserQuest } from '@/types/database';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('Friend');
  const [waterTotal, setWaterTotal] = useState<number>(0);
  const [mealsCount, setMealsCount] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<string>('0h');
  const [points, setPoints] = useState<number>(0);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const waterGoal = 2000;

  useEffect(() => {
    async function loadDashboard() {
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

        // 7. Get Today's Completed Quests
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
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const waterPercent = Math.min(100, Math.round((waterTotal / waterGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Top Greeting & Life Points Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Hello, {userName} 👋
          </h1>
          <p className="text-xs text-slate-500">Here is your wellness snapshot for today</p>
        </div>

        {/* Life Points Badge */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 text-amber-800 px-3 py-1.5 rounded-2xl shadow-xs">
          <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-extrabold">{points} pts</span>
        </div>
      </div>

      {/* AI Daily Insight Pill / Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
          <Sparkles className="h-4 w-4" />
          <span>LifeSync Daily Insight</span>
        </div>
        <p className="text-sm font-medium leading-relaxed text-emerald-50">
          {waterTotal < 500
            ? 'Starting the day with a glass of water can help maintain energy and focus!'
            : 'Great job maintaining your hydration today! Remember to keep a balanced sleep schedule tonight.'}
        </p>
        <span className="text-[10px] text-emerald-200/80 block">
          *Wellness observation based on your recorded habits.
        </span>
      </div>

      {/* 3 Core Habits Summary Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Habits</h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Nutrition Card */}
          <Link
            href="/nutrition"
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Nutrition</div>
              <div className="text-lg font-bold text-slate-900">{mealsCount} meals</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center">
                Log food &rarr;
              </div>
            </div>
          </Link>

          {/* Hydration Card */}
          <Link
            href="/hydration"
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 mb-2">
              <Droplets className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Hydration</div>
              <div className="text-lg font-bold text-slate-900">{waterTotal} ml</div>
              <div className="text-[10px] text-sky-600 font-medium mt-1">
                {waterPercent}% of goal
              </div>
            </div>
          </Link>

          {/* Sleep Card */}
          <Link
            href="/sleep"
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Sleep</div>
              <div className="text-lg font-bold text-slate-900">{sleepHours}</div>
              <div className="text-[10px] text-indigo-600 font-medium mt-1">
                Latest log &rarr;
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Daily Quests Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-1.5 rounded-xl text-amber-700">
              <Trophy className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Daily Quests</h2>
          </div>
          <span className="text-xs text-slate-400">
            {completedQuestIds.length}/{quests.length} completed
          </span>
        </div>

        <div className="space-y-2.5">
          {quests.map((q) => {
            const isCompleted = completedQuestIds.includes(q.id);
            return (
              <div
                key={q.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-100 text-slate-500'
                    : 'bg-slate-50/60 border-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                      {q.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">{q.description}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs font-extrabold text-amber-600">+{q.points} pt</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LINE Connection Banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-emerald-900">Never miss a habit</div>
          <div className="text-[11px] text-emerald-700">Connect LINE Official Account for gentle reminders.</div>
        </div>
        <Link
          href="/settings"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
        >
          Connect <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
