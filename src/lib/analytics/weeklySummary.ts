import { SupabaseClient } from '@supabase/supabase-js';
import { calculateUserStreaks } from '@/lib/gamification/streaks';

export interface WeeklySummaryData {
  waterTotalMl: number;
  waterDailyAvgMl: number;
  waterGoalDays: number;
  sleepAvgHours: number;
  sleepAvgMins: number;
  sleepNapsCount: number;
  mealsTotalCount: number;
  caloriesAvg: number;
  pointsEarned: number;
  overallStreak: number;
  aiTipTh: string;
  aiTipEn: string;
}

/**
 * Computes weekly health statistics for the past 7 days and generates AI coaching insights
 */
export async function generateWeeklySummary(
  userId: string,
  adminClient: SupabaseClient,
  timeZone: string = 'Asia/Bangkok'
): Promise<WeeklySummaryData> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const sinceIso = sevenDaysAgo.toISOString();

  // Fetch past 7 days of logs and points
  const [waterRes, foodRes, sleepRes, pointsRes] = await Promise.all([
    adminClient
      .from('water_logs')
      .select('amount_ml, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', sinceIso),
    adminClient
      .from('food_logs')
      .select('calories_estimate, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', sinceIso),
    adminClient
      .from('sleep_logs')
      .select('duration_minutes, notes, created_at, wake_time')
      .eq('user_id', userId)
      .gte('created_at', sinceIso),
    adminClient
      .from('point_transactions')
      .select('points_delta')
      .eq('user_id', userId)
      .gte('created_at', sinceIso),
  ]);

  const waterLogs = waterRes.data || [];
  const foodLogs = foodRes.data || [];
  const sleepLogs = sleepRes.data || [];
  const pointLogs = pointsRes.data || [];

  // 1. Water calculations
  const waterTotalMl = waterLogs.reduce((sum, w) => sum + (w.amount_ml || 0), 0);
  const waterDailyAvgMl = Math.round(waterTotalMl / 7);

  // Group water by day to find goal days (>= 2000ml)
  const waterByDay = new Map<string, number>();
  for (const w of waterLogs) {
    if (w.logged_at) {
      const d = w.logged_at.slice(0, 10);
      waterByDay.set(d, (waterByDay.get(d) || 0) + (w.amount_ml || 0));
    }
  }
  let waterGoalDays = 0;
  for (const amount of waterByDay.values()) {
    if (amount >= 2000) waterGoalDays++;
  }

  // 2. Sleep calculations
  let nightSleepMinutes = 0;
  let nightSleepDaysCount = 0;
  let sleepNapsCount = 0;

  for (const s of sleepLogs) {
    const isNap =
      (s.notes && (s.notes.includes('งีบ') || s.notes.toLowerCase().includes('nap') || s.notes.includes('⚡'))) ||
      (s.duration_minutes <= 60 && s.notes && s.notes.includes('งีบ'));

    if (isNap) {
      sleepNapsCount++;
    } else {
      nightSleepMinutes += s.duration_minutes || 0;
      nightSleepDaysCount++;
    }
  }

  const effectiveSleepDays = Math.max(1, nightSleepDaysCount);
  const avgSleepMinsTotal = Math.round(nightSleepMinutes / effectiveSleepDays);
  const sleepAvgHours = Math.floor(avgSleepMinsTotal / 60);
  const sleepAvgMins = avgSleepMinsTotal % 60;

  // 3. Nutrition calculations
  const mealsTotalCount = foodLogs.length;
  const totalCalories = foodLogs.reduce((sum, f) => sum + (Number(f.calories_estimate) || 0), 0);
  const caloriesAvg = mealsTotalCount > 0 ? Math.round(totalCalories / 7) : 0;

  // 4. Points & Streaks
  const pointsEarned = pointLogs.reduce((sum, p) => sum + (p.points_delta || 0), 0);
  const streaks = await calculateUserStreaks(userId, adminClient, timeZone);
  const overallStreak = streaks.overall.current;

  // 5. Intelligent AI Coach Insights Synthesis
  let aiTipTh = '';
  let aiTipEn = '';

  if (waterDailyAvgMl >= 1800 && avgSleepMinsTotal >= 420) {
    aiTipTh = 'สัปดาห์นี้ยอดเยี่ยมทั้งการดื่มน้ำและการนอนหลับ! ร่างกายได้รับพลังงานเต็มเปี่ยม สัปดาห์หน้าลองเพิ่มผักผลไม้ในมื้ออาหารเพื่อความสดใสคูณสองนะครับ';
    aiTipEn = 'Outstanding consistency in both hydration and restorative sleep! For next week, try incorporating more colorful veggies into your meals for an extra boost.';
  } else if (waterDailyAvgMl < 1200) {
    aiTipTh = 'สัปดาห์นี้การดื่มน้ำอาจน้อยไปนิดน้า สัปดาห์หน้าลองวางแก้วน้ำไว้ใกล้โต๊ะทำงานหรือโต๊ะเรียน แล้วจิบแก้วแรกทันทีที่ตื่นนอน ซันนี่จะคอยเตือนให้อย่างสม่ำเสมอครับ';
    aiTipEn = 'Hydration was a bit low this week. Next week, try placing a water bottle by your desk and take your first glass right upon waking.';
  } else if (avgSleepMinsTotal < 360 && nightSleepDaysCount > 0) {
    aiTipTh = 'สัปดาห์นี้คุณใช้พลังงานเยอะมากจนอาจนอนน้อยไปหน่อย ลองกำหนดเวลาเข้านอนเร็วขึ้น 20 นาที และแวะงีบสั้นๆ (Power Nap) ในวันที่เพลีย จะช่วยคืนความสดชื่นได้เยอะเลยครับ';
    aiTipEn = 'You worked hard this week and sleep ran short. Aim to wind down 20 minutes earlier next week and consider quick power naps to recharge.';
  } else if (mealsTotalCount >= 10) {
    aiTipTh = 'คุณบันทึกมื้ออาหารได้อย่างสม่ำเสมอมากๆ! ความใส่ใจในอาหารคือจุดเริ่มต้นของสุขภาพที่ยั่งยืน สัปดาห์หน้าลุยต่ออย่างสบายใจไปด้วยกันนะครับ';
    aiTipEn = 'Great job keeping up with your meal diary! Mindful eating builds lasting vitality. Keep up this wonderful momentum!';
  } else {
    aiTipTh = 'ทุกก้าวเล็กๆ ในการดูแลตัวเองล้วนมีความหมาย ไม่จำเป็นต้องสมบูรณ์แบบ แค่ไม่หยุดใส่ใจตัวเองก็เก่งมากๆ แล้วครับ สัปดาห์หน้ามาสร้างวินัยดีๆ ไปกับซันนี่กันใหม่น้า';
    aiTipEn = 'Every small habit check-in counts. Consistency over perfection! Let us take on the upcoming week together with joy.';
  }

  return {
    waterTotalMl,
    waterDailyAvgMl,
    waterGoalDays,
    sleepAvgHours,
    sleepAvgMins,
    sleepNapsCount,
    mealsTotalCount,
    caloriesAvg,
    pointsEarned,
    overallStreak,
    aiTipTh,
    aiTipEn,
  };
}
