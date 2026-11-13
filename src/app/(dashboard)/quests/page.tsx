'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
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
  Moon,
  Users,
  Share2,
  Heart,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Crown
} from 'lucide-react';
import type { Quest } from '@/types/database';
import type { PillarStreaks } from '@/lib/gamification/streaks';
import type { UserBadgeStatus } from '@/lib/gamification/badges';
import LevelUpModal, { getLevelFromPoints } from '@/components/gamification/LevelUpModal';
import ShareStoryModal from '@/components/analytics/ShareStoryModal';
import { fireConfettiBurst } from '@/lib/utils/confetti';
import { playSuccessChime } from '@/lib/utils/sound';

export default function QuestsPage() {
  const { t, locale } = useLanguage();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [streaks, setStreaks] = useState<PillarStreaks | null>(null);
  const [badges, setBadges] = useState<UserBadgeStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'quests' | 'badges' | 'community'>('quests');
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [cheeredIds, setCheeredIds] = useState<string[]>([]);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showShareStory, setShowShareStory] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadQuests() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch display name for community leaderboard
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
          if (prof?.display_name) {
            setUserDisplayName(prof.display_name);
          }
        } catch {
          // ignore profile fetch error
        }

        // 1. Sync & evaluate today's quests, streaks, and badges via server engine
        try {
          const syncRes = await fetch('/api/quests/sync', { method: 'POST' });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.completedQuestIds) {
              setCompletedQuestIds(syncData.completedQuestIds);
            }
            if (typeof syncData.totalPoints === 'number') {
              const pts = syncData.totalPoints;
              setTotalPoints(pts);
              const lvl = getLevelFromPoints(pts);
              setCurrentLevelNumber(lvl.level);
              const lastCelebrated = parseInt(localStorage.getItem('lifesync_celebrated_level') || '0', 10);
              if (lastCelebrated === 0) {
                localStorage.setItem('lifesync_celebrated_level', lvl.level.toString());
              } else if (lvl.level > lastCelebrated) {
                localStorage.setItem('lifesync_celebrated_level', lvl.level.toString());
                setShowLevelUp(true);
              }
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

  interface LeaderboardMember {
    id: string;
    name: string;
    roleTh: string;
    roleEn: string;
    streak: number;
    points: number;
    avatarColor: string;
    isCurrentUser?: boolean;
  }

  const communityBuddies: LeaderboardMember[] = [
    {
      id: 'user_sunny_coach',
      name: 'Nong Sunny (ซันนี่ AI)',
      roleTh: '🤖 AI โค้ชสุขภาพประจำตัว',
      roleEn: '🤖 AI Health Companion',
      streak: 30,
      points: 750,
      avatarColor: 'from-amber-400 to-orange-500',
    },
    {
      id: 'user_tonkla',
      name: 'ต้นกล้า (Tonkla)',
      roleTh: '🏃‍♂️ สายวิ่งเช้า & ออกกำลังกาย',
      roleEn: '🏃‍♂️ Morning Runner',
      streak: 15,
      points: 540,
      avatarColor: 'from-emerald-400 to-teal-600',
    },
    {
      id: 'user_ploy',
      name: 'พลอย (Ploy)',
      roleTh: '🥑 สายคลีน & ผักผลไม้',
      roleEn: '🥑 Clean Food & Veggies',
      streak: 12,
      points: 460,
      avatarColor: 'from-pink-400 to-rose-500',
    },
    {
      id: 'user_kaopan',
      name: 'ข้าวปั้น (Kaopan)',
      roleTh: '💧 เน้นดื่มน้ำวันละ 2.5 ลิตร',
      roleEn: '💧 2.5L Water Habit',
      streak: 8,
      points: 320,
      avatarColor: 'from-cyan-400 to-blue-500',
    },
    {
      id: 'user_nat',
      name: 'ณัฐ (Nat)',
      roleTh: '😴 นอนครบ 8 ชม. สม่ำเสมอ',
      roleEn: '😴 Consistent 8h Sleeper',
      streak: 6,
      points: 270,
      avatarColor: 'from-indigo-400 to-purple-600',
    },
  ];

  const currentUserMember: LeaderboardMember = {
    id: 'current_user',
    name: userDisplayName || (locale === 'th' ? 'คุณ (You)' : 'You'),
    roleTh: `🌟 ระดับ ${userLevel} • ผู้สร้างวินัย`,
    roleEn: `🌟 Level ${userLevel} • Habit Builder`,
    streak: currentOverallStreak,
    points: totalPoints,
    avatarColor: 'from-emerald-500 to-teal-600',
    isCurrentUser: true,
  };

  const allMembers = [...communityBuddies, currentUserMember].sort((a, b) => b.points - a.points);
  const userRankIndex = allMembers.findIndex((m) => m.isCurrentUser) + 1;

  const handleCheer = (buddyId: string) => {
    if (cheeredIds.includes(buddyId)) return;
    setCheeredIds((prev) => [...prev, buddyId]);
    playSuccessChime();
    fireConfettiBurst();
  };

  const handleShareLine = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lifesync.vercel.app';
    const text = locale === 'th'
      ? `มาสร้างวินัยสุขภาพด้วยกันบน LifeSync! 🏃‍♂️💧 แข่งขันความสม่ำเสมอด้านน้ำ อาหาร และการนอน แอดซันนี่ @766iowmg หรือเข้าใช้งานได้ที่ ${origin}`
      : `Join me on LifeSync to build daily health habits! 🏃‍♂️💧 Track hydration, food, and sleep. Add Sunny @766iowmg or open: ${origin}`;
    const shareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleCopyInviteLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lifesync.vercel.app';
    try {
      await navigator.clipboard.writeText(origin);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.quests.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.quests.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShareStory(true)}
            className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title={locale === 'th' ? 'แชร์การ์ดความสำเร็จ (Story)' : 'Share Health Story'}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">{locale === 'th' ? 'แชร์ความสำเร็จ' : 'Share Story'}</span>
          </button>
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

      {/* Tab Switcher: Quests vs Milestone Badges vs Community */}
      <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('quests')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'quests'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="truncate">{t.quests.tabDaily}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold shrink-0 ${
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
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t.quests.tabBadges}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold shrink-0 ${
            activeTab === 'badges'
              ? 'bg-white/20 text-white'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {unlockedBadgesCount}/{badges.length || 11}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('community')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'community'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t.quests.tabCommunity}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold shrink-0 ${
            activeTab === 'community'
              ? 'bg-white/20 text-white'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            #{userRankIndex}
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

      {/* Content for TAB 3: Friends & Community Leaderboard */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          {/* Invite Friends via LINE Banner */}
          <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white rounded-[28px] p-5 shadow-[0_8px_24px_rgba(5,150,105,0.22)] relative overflow-hidden space-y-3.5">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-emerald-100">
                    {locale === 'th' ? 'เพื่อนร่วมทางสุขภาพ' : 'Social Accountability'}
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-white">
                  {locale === 'th' ? 'ชวนเพื่อนมาสร้างวินัยด้วยกัน!' : 'Invite Friends to LifeSync!'}
                </h2>
                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-sm">
                  {locale === 'th'
                    ? 'สร้างกลุ่มเพื่อนดูแลสุขภาพ แข่งขันแต้ม และส่งกำลังใจให้กันในทุกวัน'
                    : 'Build habits together with friends, compete on points, and cheer each other on daily.'}
                </p>
              </div>

              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
                <Users className="h-6 w-6 text-emerald-100" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareLine}
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>{locale === 'th' ? 'ชวนเพื่อนทาง LINE' : 'Invite via LINE'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="py-2.5 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all backdrop-blur-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedInvite ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-200" />
                    <span>{locale === 'th' ? 'คัดลอกแล้ว!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>{locale === 'th' ? 'คัดลอกลิงก์' : 'Copy Link'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    {locale === 'th' ? 'ตารางอันดับวินัยสุขภาพประจำสัปดาห์' : 'Weekly Habit Leaderboard'}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {locale === 'th' ? 'จัดอันดับจากแต้มและวันต่อเนื่องสัปดาห์นี้' : 'Ranked by weekly points and active habit streak'}
                </p>
              </div>

              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                {locale === 'th' ? `อันดับของคุณ: #${userRankIndex}` : `Your Rank: #${userRankIndex}`}
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {allMembers.map((member, idx) => {
                const rank = idx + 1;
                const isCheered = cheeredIds.includes(member.id);
                const role = locale === 'th' ? member.roleTh : member.roleEn;

                return (
                  <div
                    key={member.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      member.isCurrentUser
                        ? 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-emerald-50/70 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60'
                    }`}
                  >
                    {/* Left: Rank & Avatar & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div className="w-7 text-center shrink-0">
                        {rank === 1 ? (
                          <span className="text-xl" title="Gold">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-xl" title="Silver">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-xl" title="Bronze">🥉</span>
                        ) : (
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500">
                            #{rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar Circle */}
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${member.avatarColor} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}>
                        {member.name.charAt(0)}
                      </div>

                      {/* Name & Role */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black truncate ${member.isCurrentUser ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                            {member.name}
                          </span>
                          {member.isCurrentUser && (
                            <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-md shrink-0">
                              {locale === 'th' ? 'คุณ' : 'YOU'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {role}
                        </p>
                      </div>
                    </div>

                    {/* Right: Streak & Points & Cheer Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Streak Pill */}
                      <div className="hidden sm:flex items-center gap-1 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-xl text-[10px] font-bold">
                        <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                        <span>{member.streak} {t.quests.streakDays}</span>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200/50 dark:border-amber-800/40 inline-block">
                          {member.points} {t.common.pts}
                        </span>
                      </div>

                      {/* Cheer / Action */}
                      {member.isCurrentUser ? (
                        <div className="w-18 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">
                          {locale === 'th' ? 'ตัวคุณเอง' : 'You'}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheer(member.id)}
                          className={`w-18 py-1 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                            isCheered
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 dark:text-slate-300'
                          }`}
                        >
                          <Heart className={`h-3 w-3 ${isCheered ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{isCheered ? (locale === 'th' ? 'ส่งแล้ว' : 'Cheered') : (locale === 'th' ? 'ส่งใจ' : 'Cheer')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        levelInfo={getLevelFromPoints(totalPoints)}
        points={totalPoints}
        locale={locale}
      />

      <ShareStoryModal
        isOpen={showShareStory}
        onClose={() => setShowShareStory(false)}
        userName={userDisplayName || (locale === 'th' ? 'คุณ (You)' : 'You')}
        level={userLevel}
        streak={currentOverallStreak}
        weeklyGrade={currentOverallStreak >= 7 ? 'A+' : currentOverallStreak >= 3 ? 'A' : 'B+'}
        waterAvgMl={streaks?.water.current ? 2000 : 1500}
        mealsCount={streaks?.food.current ? streaks.food.current * 3 : 6}
        sleepAvgHours={7.5}
        points={totalPoints}
        locale={locale}
      />
    </div>
  );
}
