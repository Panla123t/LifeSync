import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateUserStreaks } from '@/lib/gamification/streaks';
import { evaluateUserBadges } from '@/lib/gamification/badges';
import { getLocalDateStr, getStartOfDayISO } from '@/lib/utils/date';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Get user's timezone (default to Asia/Bangkok)
    const { data: profile } = await admin
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();

    const userTimezone = profile?.timezone || 'Asia/Bangkok';

    // Calculate today's date & start of day in user's timezone
    const todayDateStr = getLocalDateStr(userTimezone);
    const startOfDayISO = getStartOfDayISO(todayDateStr, userTimezone);

    // 2. Fetch logs for today in parallel
    const [waterRes, foodRes, sleepRes, questsRes, userQuestsRes] = await Promise.all([
      admin
        .from('water_logs')
        .select('id, amount_ml, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDayISO),
      admin
        .from('food_logs')
        .select('id, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDayISO),
      admin
        .from('sleep_logs')
        .select('id, wake_time, created_at')
        .eq('user_id', user.id)
        .or(`created_at.gte.${startOfDayISO},wake_time.gte.${startOfDayISO}`),
      admin
        .from('quests')
        .select('*')
        .eq('active', true),
      admin
        .from('user_quests')
        .select('quest_id, status')
        .eq('user_id', user.id)
        .eq('quest_date', todayDateStr),
    ]);

    const waterLogs = waterRes.data || [];
    const foodLogs = foodRes.data || [];
    const sleepLogs = sleepRes.data || [];
    const allQuests = questsRes.data || [];
    const completedExistingMap = new Set(
      (userQuestsRes.data || [])
        .filter((uq) => uq.status === 'completed')
        .map((uq) => uq.quest_id)
    );

    const newlyCompleted: { id: string; title: string; points: number }[] = [];
    const completedQuestIds: string[] = Array.from(completedExistingMap);

    // 3. Evaluate each active quest
    for (const quest of allQuests) {
      let isFulfilled = false;

      switch (quest.rule_key) {
        case 'log_water_once':
          isFulfilled = waterLogs.length > 0;
          break;
        case 'log_meal_once':
          isFulfilled = foodLogs.length > 0;
          break;
        case 'log_sleep_once':
          isFulfilled = sleepLogs.length > 0;
          break;
        case 'view_dashboard':
          isFulfilled = true; // Calling sync from dashboard/quests satisfies this
          break;
        default:
          break;
      }

      if (isFulfilled) {
        if (!completedQuestIds.includes(quest.id)) {
          completedQuestIds.push(quest.id);
        }

        // Only insert if not already recorded as completed today
        if (!completedExistingMap.has(quest.id)) {
          // Record quest completion
          await admin
            .from('user_quests')
            .upsert({
              user_id: user.id,
              quest_id: quest.id,
              quest_date: todayDateStr,
              status: 'completed',
              completed_at: new Date().toISOString(),
            }, { onConflict: 'user_id,quest_id,quest_date' });

          // Award points with idempotent key
          const idempotencyKey = `quest_${quest.id}_${user.id}_${todayDateStr}`;
          try {
            await admin.from('point_transactions').insert({
              user_id: user.id,
              points_delta: quest.points,
              reason: `Quest Completed: ${quest.title}`,
              reference_id: quest.id,
              idempotency_key: idempotencyKey,
            });
            newlyCompleted.push({
              id: quest.id,
              title: quest.title,
              points: quest.points,
            });
          } catch (insertErr) {
            // Duplicate idempotency key, points already awarded
            console.log(`[Quest Sync] Points already awarded for ${quest.rule_key}:`, insertErr);
          }
        }
      }
    }

    // 4. Calculate Streaks & Evaluate Milestone Badges
    const streaks = await calculateUserStreaks(user.id, admin, userTimezone);
    const { badges, newlyUnlocked } = await evaluateUserBadges(user.id, admin, streaks);

    // 5. Calculate total points (including any badge bonuses just awarded)
    const { data: allPoints } = await admin
      .from('point_transactions')
      .select('points_delta')
      .eq('user_id', user.id);

    const totalPoints = (allPoints || []).reduce((sum, tx) => sum + tx.points_delta, 0);

    return NextResponse.json({
      success: true,
      today: todayDateStr,
      completedQuestIds,
      totalPoints,
      newlyCompleted,
      streaks,
      badges,
      newlyUnlockedBadges: newlyUnlocked,
    });
  } catch (err) {
    console.error('Error syncing quests:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
