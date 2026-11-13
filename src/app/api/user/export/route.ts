import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  await connection();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch all user data in parallel
    const [
      profileRes,
      waterRes,
      foodRes,
      sleepRes,
      notifRes,
      questsRes,
      pointsRes
    ] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('water_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }),
      admin.from('food_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }),
      admin.from('sleep_logs').select('*').eq('user_id', user.id).order('wake_time', { ascending: false }),
      admin.from('notification_settings').select('*').eq('user_id', user.id).maybeSingle(),
      admin.from('user_quests').select('*').eq('user_id', user.id).order('quest_date', { ascending: false }),
      admin.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    const exportPayload = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile: profileRes.data || null,
      notification_settings: notifRes.data || null,
      summary: {
        total_water_logs: waterRes.data?.length || 0,
        total_food_logs: foodRes.data?.length || 0,
        total_sleep_logs: sleepRes.data?.length || 0,
        total_completed_quests: questsRes.data?.length || 0,
        total_point_transactions: pointsRes.data?.length || 0,
      },
      data: {
        water_logs: waterRes.data || [],
        food_logs: foodRes.data || [],
        sleep_logs: sleepRes.data || [],
        quests: questsRes.data || [],
        points: pointsRes.data || [],
      },
    };

    const filename = `lifesync-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Error exporting user data:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
