'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Award, 
  Sparkles, 
  Star,
  Zap,
  ShieldCheck
} from 'lucide-react';
import type { Quest, UserQuest } from '@/types/database';

export default function QuestsPage() {
  const { t, locale } = useLanguage();
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

        const { data: pointTxs } = await supabase
          .from('point_transactions')
          .select('points_delta')
          .eq('user_id', user.id);

        if (pointTxs) {
          const sum = pointTxs.reduce((acc, curr) => acc + curr.points_delta, 0);
          setTotalPoints(sum);
        }

        const { data: allQuests } = await supabase
          .from('quests')
          .select('*')
          .eq('active', true);

        if (allQuests) setQuests(allQuests as Quest[]);

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

  // Compute dynamic user level
  const userLevel = Math.floor(totalPoints / 50) + 1;
  const currentLevelPoints = totalPoints % 50;
  const levelProgressPercent = Math.min(100, Math.round((currentLevelPoints / 50) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t.quests.title}</h1>
          <p className="text-xs text-slate-500">{t.quests.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl shadow-xs">
            <Trophy className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Gamification Level & Points Card */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-[32px] p-6 shadow-[0_12px_30px_rgba(245,158,11,0.25)] space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Star className="h-4 w-4 text-amber-100" />
            </div>
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
              {locale === 'th' ? `ระดับ ${userLevel} • ผู้สร้างวินัยสุขภาพ` : `Level ${userLevel} • Habit Builder`}
            </span>
          </div>

          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-extrabold flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 fill-white text-white" />
            <span>{totalPoints} {t.common.pts}</span>
          </span>
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs text-amber-100 font-semibold">
            <span>{locale === 'th' ? 'ความคืบหน้าสู่ระดับถัดไป' : 'Progress to next level'}</span>
            <span>{currentLevelPoints} / 50 pts</span>
          </div>
          <div className="w-full bg-black/15 backdrop-blur-md h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-white h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-amber-100/90 leading-relaxed pt-1">
          {t.quests.pointsInfo}
        </p>
      </div>

      {/* Quests List */}
      <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t.quests.todaysQuests}</h2>
            <p className="text-[11px] text-slate-400">
              {locale === 'th' ? 'รีเซ็ตทุกเที่ยงคืนตามเวลาท้องถิ่น' : 'Resets daily at midnight'}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            {completedQuestIds.length} / {quests.length} {t.dashboard.completed}
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.common.loading}</p>
        ) : (
          <div className="space-y-3">
            {quests.map((q) => {
              const isDone = completedQuestIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
                    isDone
                      ? 'bg-emerald-50/40 border-emerald-200/60'
                      : 'bg-slate-50/70 border-slate-200/60 hover:border-emerald-200 hover:bg-white'
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
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{q.description}</p>
                      <span className="inline-block mt-2 text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                        {q.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-xl shadow-2xs">
                      +{q.points} {t.common.pts}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamification Principle Note */}
      <div className="bg-slate-50 rounded-[26px] p-4.5 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-600">
        <Award className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-800">{t.quests.healthyFirst}</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t.quests.healthyFirstDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
