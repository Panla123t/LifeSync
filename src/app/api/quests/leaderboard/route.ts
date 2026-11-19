import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const AVATAR_GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-600',
  'from-indigo-400 to-purple-600',
  'from-pink-400 to-rose-500',
  'from-teal-400 to-emerald-600',
  'from-violet-400 to-indigo-600',
];

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Fetch real profiles from database
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, display_name, created_at');

    if (profileError) {
      console.error('[Leaderboard API] Failed to fetch profiles:', profileError);
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    // 2. Fetch point transactions to calculate real total points per user
    const { data: transactions } = await admin
      .from('point_transactions')
      .select('user_id, points_delta');

    const pointsMap: Record<string, number> = {};
    for (const tx of transactions || []) {
      pointsMap[tx.user_id] = (pointsMap[tx.user_id] || 0) + (tx.points_delta || 0);
    }

    // 3. Fetch active dates across water, food, and sleep logs to calculate real active streak/days
    const [{ data: waterLogs }, { data: foodLogs }, { data: sleepLogs }] = await Promise.all([
      admin.from('water_logs').select('user_id, logged_at'),
      admin.from('food_logs').select('user_id, logged_at'),
      admin.from('sleep_logs').select('user_id, wake_time'),
    ]);

    const activeDatesPerUser: Record<string, Set<string>> = {};
    for (const w of waterLogs || []) {
      const d = w.logged_at ? w.logged_at.slice(0, 10) : '';
      if (!activeDatesPerUser[w.user_id]) activeDatesPerUser[w.user_id] = new Set();
      if (d) activeDatesPerUser[w.user_id].add(d);
    }
    for (const f of foodLogs || []) {
      const d = f.logged_at ? f.logged_at.slice(0, 10) : '';
      if (!activeDatesPerUser[f.user_id]) activeDatesPerUser[f.user_id] = new Set();
      if (d) activeDatesPerUser[f.user_id].add(d);
    }
    for (const s of sleepLogs || []) {
      const d = s.wake_time ? s.wake_time.slice(0, 10) : '';
      if (!activeDatesPerUser[s.user_id]) activeDatesPerUser[s.user_id] = new Set();
      if (d) activeDatesPerUser[s.user_id].add(d);
    }

    // 4. Try to fetch auth users to fallback display_name from email/metadata if profile name is blank
    const emailMap: Record<string, string> = {};
    try {
      const { data: authData } = await admin.auth.admin.listUsers();
      for (const u of authData?.users || []) {
        const metaName = u.user_metadata?.name || u.user_metadata?.full_name || u.user_metadata?.display_name;
        const emailPrefix = u.email ? u.email.split('@')[0] : '';
        emailMap[u.id] = metaName || emailPrefix || '';
      }
    } catch {
      // Ignore auth user listing error if restricted
    }

    // 5. Construct real leaderboard members (NO mock users)
    const leaderboard = (profiles || []).map((p, index) => {
      const realPoints = pointsMap[p.id] || 0;
      const realStreak = activeDatesPerUser[p.id] ? activeDatesPerUser[p.id].size : 0;
      const realLevel = Math.floor(realPoints / 50) + 1;

      let name = p.display_name?.trim();
      if (!name) {
        name = emailMap[p.id] || `User ${p.id.slice(0, 5)}`;
      }

      const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

      return {
        id: p.id,
        name,
        roleTh: `🌟 ระดับ ${realLevel} • ผู้สร้างวินัย`,
        roleEn: `🌟 Level ${realLevel} • Habit Builder`,
        streak: realStreak,
        points: realPoints,
        avatarColor: gradient,
      };
    });

    // 6. Sort real users by points descending, then by streak
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.streak - a.streak;
    });

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error('[Leaderboard API Error]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
