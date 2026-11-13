import { PillarStreaks } from './streaks';
import { SupabaseClient } from '@supabase/supabase-js';

export interface BadgeDefinition {
  key: string;
  titleEn: string;
  titleTh: string;
  descriptionEn: string;
  descriptionTh: string;
  category: 'hydration' | 'nutrition' | 'sleep' | 'consistency' | 'special';
  icon: string; // Emoji
  color: string; // Tailwind color class
  points: number;
}

export interface UserBadgeStatus extends BadgeDefinition {
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 to 100
  progressText: string;
}

export const ALL_BADGES: BadgeDefinition[] = [
  {
    key: 'first_water',
    titleEn: 'First Drop',
    titleTh: 'หยดน้ำแรก',
    descriptionEn: 'Logged water intake for the first time',
    descriptionTh: 'บันทึกการดื่มน้ำครั้งแรกในระบบ',
    category: 'hydration',
    icon: '💧',
    color: 'from-blue-400 to-cyan-500',
    points: 10,
  },
  {
    key: 'water_streak_3',
    titleEn: 'Hydration Habit',
    titleTh: 'จิบน้ำสม่ำเสมอ',
    descriptionEn: 'Maintained a 3-day water intake streak',
    descriptionTh: 'บันทึกการดื่มน้ำต่อเนื่องครบ 3 วัน',
    category: 'hydration',
    icon: '🩵',
    color: 'from-cyan-500 to-teal-500',
    points: 30,
  },
  {
    key: 'water_streak_7',
    titleEn: 'Water Master',
    titleTh: 'เจ้าแห่งสายน้ำ',
    descriptionEn: 'Logged water consistently for 7 days in a row',
    descriptionTh: 'บันทึกการดื่มน้ำต่อเนื่องครบ 7 วัน',
    category: 'hydration',
    icon: '🌊',
    color: 'from-blue-600 to-indigo-600',
    points: 50,
  },
  {
    key: 'first_food',
    titleEn: 'Mindful Eater',
    titleTh: 'มื้อแรกใส่ใจ',
    descriptionEn: 'Recorded your first meal in the food diary',
    descriptionTh: 'บันทึกมื้ออาหารแรกในระบบ',
    category: 'nutrition',
    icon: '🥗',
    color: 'from-emerald-400 to-green-600',
    points: 10,
  },
  {
    key: 'ai_food_scout',
    titleEn: 'AI Nutritionist',
    titleTh: 'ผู้ช่วยสแกนอาหาร',
    descriptionEn: 'Analyzed food calories using Gemini Vision AI',
    descriptionTh: 'ใช้ AI ช่วยสแกนภาพถ่ายและวิเคราะห์สารอาหาร',
    category: 'nutrition',
    icon: '📸',
    color: 'from-amber-400 to-orange-500',
    points: 20,
  },
  {
    key: 'food_streak_3',
    titleEn: 'Balanced Fueler',
    titleTh: 'สารอาหารสมดุล',
    descriptionEn: 'Logged meals for 3 consecutive days',
    descriptionTh: 'บันทึกอาหารสม่ำเสมอต่อเนื่อง 3 วัน',
    category: 'nutrition',
    icon: '🥑',
    color: 'from-lime-500 to-emerald-600',
    points: 30,
  },
  {
    key: 'first_sleep',
    titleEn: 'Sweet Dreams',
    titleTh: 'หลับฝันดี',
    descriptionEn: 'Recorded your bedtime and wake-up schedule',
    descriptionTh: 'บันทึกเวลาเข้านอนและตื่นนอนครั้งแรก',
    category: 'sleep',
    icon: '🌙',
    color: 'from-indigo-400 to-purple-600',
    points: 15,
  },
  {
    key: 'power_nap_hero',
    titleEn: 'Power Napper',
    titleTh: 'ชาร์จพลังบ่าย',
    descriptionEn: 'Logged a revitalizing daytime power nap',
    descriptionTh: 'บันทึกการงีบหลับเติมพลังระหว่างวัน',
    category: 'sleep',
    icon: '⚡',
    color: 'from-yellow-400 to-amber-500',
    points: 20,
  },
  {
    key: 'sleep_streak_3',
    titleEn: 'Rest & Recovery',
    titleTh: 'ฟื้นฟูร่างกาย',
    descriptionEn: 'Logged sleep schedules for 3 days in a row',
    descriptionTh: 'บันทึกเวลาพักผ่อนต่อเนื่อง 3 วัน',
    category: 'sleep',
    icon: '🛌',
    color: 'from-violet-500 to-purple-700',
    points: 30,
  },
  {
    key: 'line_connected',
    titleEn: "Sunny's Bestie",
    titleTh: 'เพื่อนแท้ซันนี่',
    descriptionEn: 'Connected your LINE Official Account companion',
    descriptionTh: 'เชื่อมต่อบัญชีกับน้องซันนี่บน LINE Official Account',
    category: 'special',
    icon: '☀️',
    color: 'from-emerald-500 to-teal-600',
    points: 20,
  },
  {
    key: 'habit_streak_7',
    titleEn: 'Habit Champion',
    titleTh: 'สร้างวินัย 7 วัน',
    descriptionEn: 'Logged at least one healthy habit for 7 consecutive days',
    descriptionTh: 'บันทึกสุขภาพอย่างสม่ำเสมอต่อเนื่องครบ 7 วัน',
    category: 'consistency',
    icon: '🔥',
    color: 'from-orange-500 to-rose-600',
    points: 100,
  },
];

/**
 * Evaluates which badges the user qualifies for and returns their unlock status
 */
export async function evaluateUserBadges(
  userId: string,
  adminClient: SupabaseClient,
  streaks: PillarStreaks
): Promise<{ badges: UserBadgeStatus[]; newlyUnlocked: BadgeDefinition[] }> {
  // 1. Gather all necessary user history
  const [waterCountRes, foodRowsRes, sleepRowsRes, notifRes, pointTxsRes] = await Promise.all([
    adminClient.from('water_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    adminClient.from('food_logs').select('source').eq('user_id', userId),
    adminClient.from('sleep_logs').select('notes, duration_minutes').eq('user_id', userId),
    adminClient.from('notification_settings').select('line_user_id').eq('user_id', userId).maybeSingle(),
    adminClient.from('point_transactions').select('idempotency_key, created_at').eq('user_id', userId),
  ]);

  const waterTotalCount = waterCountRes.count || 0;
  const foodRows = foodRowsRes.data || [];
  const sleepRows = sleepRowsRes.data || [];
  const isLineConnected = Boolean(notifRes.data?.line_user_id);

  const hasAiMeal = foodRows.some((f) => f.source === 'ai_assisted');
  const hasNap = sleepRows.some(
    (s) =>
      (s.notes && (s.notes.includes('งีบ') || s.notes.toLowerCase().includes('nap') || s.notes.includes('⚡'))) ||
      (s.duration_minutes <= 60 && s.notes && s.notes.includes('งีบ'))
  );

  // Check existing awarded badge points by idempotency key pattern `badge_${key}_${userId}`
  const awardedBadgesMap = new Map<string, string>();
  for (const tx of pointTxsRes.data || []) {
    if (tx.idempotency_key && tx.idempotency_key.startsWith('badge_')) {
      const parts = tx.idempotency_key.split('_');
      // e.g. badge_first_water_userId or badge_water_streak_3_userId
      // We can check if any badge key matches
      for (const badge of ALL_BADGES) {
        if (tx.idempotency_key.startsWith(`badge_${badge.key}_`)) {
          awardedBadgesMap.set(badge.key, tx.created_at);
        }
      }
    }
  }

  const results: UserBadgeStatus[] = [];
  const newlyUnlocked: BadgeDefinition[] = [];

  for (const b of ALL_BADGES) {
    let qualifies = false;
    let progress = 0;
    let progressText = '0/1';

    switch (b.key) {
      case 'first_water':
        qualifies = waterTotalCount > 0;
        progress = qualifies ? 100 : 0;
        progressText = `${Math.min(1, waterTotalCount)} / 1`;
        break;

      case 'water_streak_3':
        qualifies = streaks.water.current >= 3 || streaks.water.best >= 3;
        progress = Math.min(100, Math.round((Math.max(streaks.water.current, streaks.water.best) / 3) * 100));
        progressText = `${Math.min(3, Math.max(streaks.water.current, streaks.water.best))} / 3 วัน`;
        break;

      case 'water_streak_7':
        qualifies = streaks.water.current >= 7 || streaks.water.best >= 7;
        progress = Math.min(100, Math.round((Math.max(streaks.water.current, streaks.water.best) / 7) * 100));
        progressText = `${Math.min(7, Math.max(streaks.water.current, streaks.water.best))} / 7 วัน`;
        break;

      case 'first_food':
        qualifies = foodRows.length > 0;
        progress = qualifies ? 100 : 0;
        progressText = `${Math.min(1, foodRows.length)} / 1`;
        break;

      case 'ai_food_scout':
        qualifies = hasAiMeal;
        progress = qualifies ? 100 : 0;
        progressText = qualifies ? '1 / 1' : '0 / 1';
        break;

      case 'food_streak_3':
        qualifies = streaks.food.current >= 3 || streaks.food.best >= 3;
        progress = Math.min(100, Math.round((Math.max(streaks.food.current, streaks.food.best) / 3) * 100));
        progressText = `${Math.min(3, Math.max(streaks.food.current, streaks.food.best))} / 3 วัน`;
        break;

      case 'first_sleep':
        qualifies = sleepRows.length > 0;
        progress = qualifies ? 100 : 0;
        progressText = `${Math.min(1, sleepRows.length)} / 1`;
        break;

      case 'power_nap_hero':
        qualifies = hasNap;
        progress = qualifies ? 100 : 0;
        progressText = qualifies ? '1 / 1' : '0 / 1';
        break;

      case 'sleep_streak_3':
        qualifies = streaks.sleep.current >= 3 || streaks.sleep.best >= 3;
        progress = Math.min(100, Math.round((Math.max(streaks.sleep.current, streaks.sleep.best) / 3) * 100));
        progressText = `${Math.min(3, Math.max(streaks.sleep.current, streaks.sleep.best))} / 3 วัน`;
        break;

      case 'line_connected':
        qualifies = isLineConnected;
        progress = qualifies ? 100 : 0;
        progressText = qualifies ? '1 / 1' : '0 / 1';
        break;

      case 'habit_streak_7':
        qualifies = streaks.overall.current >= 7 || streaks.overall.best >= 7;
        progress = Math.min(100, Math.round((Math.max(streaks.overall.current, streaks.overall.best) / 7) * 100));
        progressText = `${Math.min(7, Math.max(streaks.overall.current, streaks.overall.best))} / 7 วัน`;
        break;
    }

    const alreadyAwarded = awardedBadgesMap.has(b.key);
    const isUnlocked = alreadyAwarded || qualifies;
    const unlockTime = awardedBadgesMap.get(b.key) || (qualifies ? new Date().toISOString() : undefined);

    if (qualifies && !alreadyAwarded) {
      newlyUnlocked.push(b);
      // Award badge points immediately with idempotency
      try {
        await adminClient.from('point_transactions').insert({
          user_id: userId,
          points_delta: b.points,
          reason: `Milestone Badge: ${b.titleEn} (${b.titleTh})`,
          idempotency_key: `badge_${b.key}_${userId}`,
        });
      } catch {
        // Already recorded
      }
    }

    results.push({
      ...b,
      unlocked: isUnlocked,
      unlockedAt: unlockTime,
      progress: isUnlocked ? 100 : progress,
      progressText: isUnlocked ? 'สำเร็จแล้ว' : progressText,
    });
  }

  return { badges: results, newlyUnlocked };
}
