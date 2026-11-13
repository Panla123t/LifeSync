import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Delete all user data rows
    await Promise.all([
      admin.from('water_logs').delete().eq('user_id', user.id),
      admin.from('food_logs').delete().eq('user_id', user.id),
      admin.from('sleep_logs').delete().eq('user_id', user.id),
      admin.from('user_quests').delete().eq('user_id', user.id),
      admin.from('point_transactions').delete().eq('user_id', user.id),
      admin.from('notification_settings').delete().eq('user_id', user.id),
      admin.from('profiles').delete().eq('id', user.id),
    ]);

    // 2. Delete auth user
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting account:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
