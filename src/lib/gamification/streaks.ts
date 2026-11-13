import { SupabaseClient } from '@supabase/supabase-js';

export interface PillarStreaks {
  overall: {
    current: number;
    best: number;
    activeToday: boolean;
  };
  water: {
    current: number;
    best: number;
    activeToday: boolean;
  };
  food: {
    current: number;
    best: number;
    activeToday: boolean;
  };
  sleep: {
    current: number;
    best: number;
    activeToday: boolean;
  };
}

/**
 * Normalizes an ISO date string to "YYYY-MM-DD" in the given timezone
 */
export function toDateStr(isoString: string, timeZone: string = 'Asia/Bangkok'): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(0, 10);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return isoString.slice(0, 10);
  }
}

/**
 * Computes consecutive days from a set of YYYY-MM-DD date strings
 */
function computeConsecutiveDays(dateSet: Set<string>, todayStr: string): { current: number; best: number; activeToday: boolean } {
  if (dateSet.size === 0) {
    return { current: 0, best: 0, activeToday: false };
  }

  const activeToday = dateSet.has(todayStr);

  // Helper to subtract N days from a Date
  const getPrevDateStr = (base: Date, daysAgo: number): string => {
    const d = new Date(base);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  const todayDate = new Date(`${todayStr}T12:00:00Z`);

  // Calculate current streak
  let current = 0;
  let checkOffset = activeToday ? 0 : 1; // If not logged today, check from yesterday

  while (true) {
    const targetStr = getPrevDateStr(todayDate, checkOffset);
    if (dateSet.has(targetStr)) {
      current++;
      checkOffset++;
    } else {
      break;
    }
  }

  // Calculate all-time best streak
  const sortedDates = Array.from(dateSet).sort();
  let best = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const cur = new Date(`${dateStr}T12:00:00Z`);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((cur.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = cur;
    if (tempStreak > best) best = tempStreak;
  }

  if (current > best) best = current;

  return { current, best, activeToday };
}

/**
 * Fetches user logs and calculates streak counts across all pillars
 */
export async function calculateUserStreaks(
  userId: string,
  adminClient: SupabaseClient,
  timeZone: string = 'Asia/Bangkok'
): Promise<PillarStreaks> {
  const todayStr = toDateStr(new Date().toISOString(), timeZone);

  // Fetch all user dates from logs (limit to last 90 days for performance)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const sinceIso = ninetyDaysAgo.toISOString();

  const [waterRes, foodRes, sleepRes] = await Promise.all([
    adminClient
      .from('water_logs')
      .select('logged_at')
      .eq('user_id', userId)
      .gte('logged_at', sinceIso),
    adminClient
      .from('food_logs')
      .select('logged_at')
      .eq('user_id', userId)
      .gte('logged_at', sinceIso),
    adminClient
      .from('sleep_logs')
      .select('wake_time, bedtime, created_at')
      .eq('user_id', userId)
      .gte('created_at', sinceIso),
  ]);

  const waterDates = new Set<string>();
  const foodDates = new Set<string>();
  const sleepDates = new Set<string>();
  const overallDates = new Set<string>();

  for (const row of waterRes.data || []) {
    if (row.logged_at) {
      const d = toDateStr(row.logged_at, timeZone);
      waterDates.add(d);
      overallDates.add(d);
    }
  }

  for (const row of foodRes.data || []) {
    if (row.logged_at) {
      const d = toDateStr(row.logged_at, timeZone);
      foodDates.add(d);
      overallDates.add(d);
    }
  }

  for (const row of sleepRes.data || []) {
    const raw = row.wake_time || row.bedtime || row.created_at;
    if (raw) {
      const d = toDateStr(raw, timeZone);
      sleepDates.add(d);
      overallDates.add(d);
    }
  }

  return {
    overall: computeConsecutiveDays(overallDates, todayStr),
    water: computeConsecutiveDays(waterDates, todayStr),
    food: computeConsecutiveDays(foodDates, todayStr),
    sleep: computeConsecutiveDays(sleepDates, todayStr),
  };
}
