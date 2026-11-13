'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Award, 
  Star,
  Lock,
  Sparkles,
  Droplets,
  Utensils,
  Moon
} from 'lucide-react';
import type { Quest } from '@/types/database';
import type { PillarStreaks } from '@/lib/gamification/streaks';
import type { UserBadgeStatus } from '@/lib/gamification/badges';

export default function QuestsPage() {
  const { t, locale } = useLanguage();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [streaks, setStreaks] = useState<PillarStreaks | null>(null);
  const [badges, setBadges] = useState<UserBadgeStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'quests' | 'badges'>('quests');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadQuests() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Sync & evaluate today's quests, streaks, and badges via server engine
        try {
          const syncRes = await fetch('/api/quests/sync', { method: 'POST' });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.completedQuestIds) {
              setCompletedQuestIds(syncData.completedQuestIds);
            }
            if (typeof syncData.totalPoints === 'number') {
              setTotalPoints(syncData.totalPoints);
            }
            if (syncData.streaks) {
              setStreaks(syncData.streaks);
            }
            if (syncData.badges) {
              setBadges(syncData.badges);
            }
          }
        } catch (syncErr) {
          console.warn('[Quests] Sync error:', syncErr);
        }

        // 2. Fetch all active quests
        const { data: allQuests } = await supabase
          .from('quests')
          .select('*')
          .eq('active', true);

        if (allQuests) setQuests(allQuests as Quest[]);

        // 3. Direct DB fallback for today's user_quests in case sync endpoint had a network hiccup
        try {
          const today = new Intl.DateTimeFormat('en-CA').format(new Date());
          const { data: directUq } = await supabase
            .from('user_quests')
            .select('quest_id')
            .eq('user_id', user.id)
            .eq('quest_date', today)
            .eq('status', 'completed');

          if (directUq && directUq.length > 0) {
            setCompletedQuestIds((prev) => {
              const merged = new Set([...prev, ...directUq.map((u) => u.quest_id)]);
              return Array.from(merged);
            });
          }
        } catch (uqErr) {
          console.warn('[Quests] Fallback user_quests fetch error:', uqErr);
        }

        // 4. Fallback to point_transactions if points not already set
        const { data: pointTxs } = await supabase
          .from('point_transactions')
          .select('points_delta')
          .eq('user_id', user.id);

        if (pointTxs) {
          const sum = pointTxs.reduce((acc, curr) => acc + curr.points_delta, 0);
          setTotalPoints(sum);
        }
      } finally {
        setLoading(false);
      }
    }

    loadQuests();
  }, []);

  const userLevel = Math.floor(totalPoints / 50) + 1;
  const currentLevelPoints = totalPoints % 50;
  const levelProgressPercent = Math.min(100, Math.round((currentLevelPoints / 50) * 100));

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;
  const currentOverallStreak = streaks?.overall.current || 0;
  const isLoggedToday = streaks?.overall.activeToday || false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.quests.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.quests.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <div className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl shadow-xs">
            <Trophy className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Gamification Level & Points Card */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-[32px] p-5 shadow-[0_12px_30px_rgba(245,158,11,0.25)] space-y-4 relative overflow-hidden">
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

          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-extrabold flex items-center gap-1.5 backdrop-blur-sm">
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

        <p className="text-[11px] text-amber-100/90 leading-relaxed pt-0.5">
          {t.quests.pointsInfo}
        </p>
      </div>

      {/* Habit Consistency Streak Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              currentOverallStreak > 0
                ? 'bg-orange-500/15 text-orange-500 dark:bg-orange-950/60 dark:text-orange-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}>
              <Flame className={`h-6 w-6 ${currentOverallStreak > 0 ? 'fill-orange-500 text-orange-500 animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {currentOverallStreak} {locale === 'th' ? 'วันต่อเนื่อง' : 'Day Streak'}
                </span>
                {isLoggedToday && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                    {locale === 'th' ? 'สถิติแอคทีฟ 🔥' : 'Active Today 🔥'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isLoggedToday ? t.quests.streakLoggedToday : t.quests.streakNeedsLog}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold block">
              {locale === 'th' ? 'สถิติสูงสุด' : 'Best Streak'}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {streaks?.overall.best || currentOverallStreak} {t.quests.streakDays}
            </span>
          </div>
        </div>

        {/* 3 Pillars Mini-Streak Chips */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-2xl flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-500 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                {locale === 'th' ? 'ดื่มน้ำ' : 'Water'}
              </span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {streaks?.water.current || 0} {t.quests.streakDays}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-2xl flex items-center gap-2">
            <Utensils className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                {locale === 'th' ? 'อาหาร' : 'Food'}
              </span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {streaks?.food.current || 0} {t.quests.streakDays}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-2xl flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                {locale === 'th' ? 'การนอน' : 'Sleep'}
              </span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {streaks?.sleep.current || 0} {t.quests.streakDays}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Quests vs Milestone Badges */}
      <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('quests')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'quests'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{t.quests.tabDaily}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            activeTab === 'quests'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {completedQuestIds.length}/{quests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>{t.quests.tabBadges}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            activeTab === 'badges'
              ? 'bg-white/20 text-white'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {unlockedBadgesCount}/{badges.length || 11}
          </span>
        </button>
      </div>

      {/* Content for TAB 1: Daily Quests */}
      {activeTab === 'quests' && (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.quests.todaysQuests}</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {locale === 'th' ? 'รีเซ็ตทุกเที่ยงคืนตามเวลาท้องถิ่น' : 'Resets daily at midnight'}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
              {completedQuestIds.length} / {quests.length} {t.dashboard.completed}
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">{t.common.loading}</p>
          ) : (
            <div className="space-y-3">
              {quests.map((q) => {
                const isDone = completedQuestIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
                      isDone
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-white dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {q.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{q.description}</p>
                        <span className="inline-block mt-2 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                          {q.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/50 dark:border-amber-800/50 px-2.5 py-1 rounded-xl shadow-2xs">
                        +{q.points} {t.common.pts}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for TAB 2: Milestone Badges & Achievements */}
      {activeTab === 'badges' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                {locale === 'th' ? 'เหรียญความสำเร็จด้านสุขภาพ' : 'Milestone Achievements'}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {locale === 'th' ? 'ปลดล็อกเพื่อรับแต้มพิเศษและฉลองวินัยที่ดี' : 'Unlock to earn bonus points and celebrate healthy routines'}
              </p>
            </div>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/50">
              {unlockedBadgesCount} / {badges.length} {locale === 'th' ? 'ปลดล็อก' : 'Unlocked'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((badge) => {
              const title = locale === 'th' ? badge.titleTh : badge.titleEn;
              const desc = locale === 'th' ? badge.descriptionTh : badge.descriptionEn;

              return (
                <div
                  key={badge.key}
                  className={`p-4 rounded-3xl border transition-all relative overflow-hidden ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-slate-850 border-amber-200/70 dark:border-amber-800/40 shadow-[0_6px_20px_rgba(245,158,11,0.08)]'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Badge Icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-xs ${
                      badge.unlocked
                        ? `bg-gradient-to-tr ${badge.color} text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]`
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {badge.unlocked ? (
                        <span>{badge.icon}</span>
                      ) : (
                        <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className={`text-xs font-black truncate ${badge.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {title}
                        </h3>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          badge.unlocked
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          +{badge.points} {t.common.pts}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {desc}
                      </p>

                      {/* Progress / Unlock Tag */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                        <span className={`font-semibold ${badge.unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {badge.unlocked ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {t.quests.unlockedBadge}
                            </span>
                          ) : (
                            <span>{badge.progressText}</span>
                          )}
                        </span>

                        {!badge.unlocked && (
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${badge.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gamification Principle Note */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-[26px] p-4.5 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-800 dark:text-white">{t.quests.healthyFirst}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.quests.healthyFirstDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
