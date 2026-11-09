'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Flame, CheckCircle2, Circle, Sparkles, Award } from 'lucide-react';
import type { Quest, UserQuest } from '@/types/database';

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadQuests() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user point total
        const { data: pointTxs } = await supabase
          .from('point_transactions')
          .select('points_delta')
          .eq('user_id', user.id);

        if (pointTxs) {
          const sum = pointTxs.reduce((acc, curr) => acc + curr.points_delta, 0);
          setTotalPoints(sum);
        }

        // Fetch active global quests
        const { data: allQuests } = await supabase
          .from('quests')
          .select('*')
          .eq('active', true);

        if (allQuests) setQuests(allQuests as Quest[]);

        // Fetch today's completed user quests
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

    loadQuests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Life Rewards</h1>
          <p className="text-xs text-slate-500">Celebrate daily consistency, not perfection</p>
        </div>
        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl">
          <Trophy className="h-6 w-6" />
        </div>
      </div>

      {/* Points & Level Card */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider">
            Total Life Points
          </span>
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 fill-white" /> Active
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold">{totalPoints}</span>
          <span className="text-sm font-medium text-amber-100">pts</span>
        </div>

        <p className="text-xs text-amber-100 leading-relaxed">
          Points are awarded automatically as you record your meals, hydration, and sleep routines each day.
        </p>
      </div>

      {/* Quests List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Today&apos;s Quests</h2>
          <span className="text-xs text-slate-400">
            {completedQuestIds.length} of {quests.length} done
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-3 text-center">Loading quests...</p>
        ) : (
          <div className="space-y-3">
            {quests.map((q) => {
              const isDone = completedQuestIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
                    isDone
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {q.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{q.description}</p>
                      <span className="inline-block mt-2 text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 bg-white border border-slate-200/60 rounded-md">
                        {q.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      +{q.points} pt
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamification Principle Note */}
      <div className="bg-slate-100/70 rounded-3xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Award className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-800">Healthy Habits First</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            LifeSync rewards consistent logging and healthy lifestyle self-awareness. We never incentivize restrictive eating, excessive water intake, or lost sleep.
          </p>
        </div>
      </div>
    </div>
  );
}
