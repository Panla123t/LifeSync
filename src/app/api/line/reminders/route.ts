import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  sendLinePush, 
  createHydrationReminderMessage, 
  createSleepReminderMessage 
} from '@/lib/line/client';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cronSecretHeader = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'your-cron-secret';

    const isCronAuthorized = 
      cronSecretHeader === expectedSecret ||
      authHeader.replace('Bearer ', '') === expectedSecret;

    let targetUserId: string | null = null;

    if (!isCronAuthorized) {
      // If not called by cron, check if called by authenticated user in Settings
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      targetUserId = user.id;
    }

    const body = await req.json().catch(() => ({}));
    const reminderType: 'test' | 'hydration' | 'sleep' = body.type || 'test';

    const admin = createAdminClient();

    // If targeted at a specific user (e.g. "Send Test Reminder" in Settings)
    if (targetUserId) {
      const { data: notif } = await admin
        .from('notification_settings')
        .select('line_user_id, hydration_enabled, sleep_enabled')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (!notif?.line_user_id) {
        return NextResponse.json({
          error: 'LINE account not connected yet. Please link your account first.',
        }, { status: 400 });
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('display_name')
        .eq('id', targetUserId)
        .single();

      const userName = profile?.display_name || 'เพื่อนสุขภาพ';

      // Send test hydration push
      const message = reminderType === 'sleep' 
        ? createSleepReminderMessage(userName)
        : createHydrationReminderMessage(userName, 750, 2000);

      const result = await sendLinePush(notif.line_user_id, [message]);

      return NextResponse.json({
        success: result.success,
        simulated: result.simulated,
        message: result.simulated 
          ? 'Simulation mode: Reminder formatted successfully (Configure LINE_CHANNEL_ACCESS_TOKEN for live delivery)'
          : 'Live reminder sent to your LINE account!',
      });
    }

    // Cron job: broadcast to eligible users
    if (reminderType === 'hydration') {
      const { data: users } = await admin
        .from('notification_settings')
        .select('user_id, line_user_id')
        .eq('hydration_enabled', true)
        .not('line_user_id', 'is', null);

      let sentCount = 0;
      for (const u of (users || [])) {
        if (!u.line_user_id) continue;
        const { data: prof } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', u.user_id)
          .single();

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: waterLogs } = await admin
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', u.user_id)
          .gte('logged_at', startOfDay.toISOString());

        const currentMl = (waterLogs || []).reduce((sum, w) => sum + w.amount_ml, 0);
        const res = await sendLinePush(u.line_user_id, [
          createHydrationReminderMessage(prof?.display_name || 'เพื่อนสุขภาพ', currentMl, 2000),
        ]);
        if (res.success) sentCount++;
      }

      return NextResponse.json({ success: true, count: sentCount });
    }

    if (reminderType === 'sleep') {
      const { data: users } = await admin
        .from('notification_settings')
        .select('user_id, line_user_id')
        .eq('sleep_enabled', true)
        .not('line_user_id', 'is', null);

      let sentCount = 0;
      for (const u of (users || [])) {
        if (!u.line_user_id) continue;
        const { data: prof } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', u.user_id)
          .single();

        const res = await sendLinePush(u.line_user_id, [
          createSleepReminderMessage(prof?.display_name || 'เพื่อนสุขภาพ'),
        ]);
        if (res.success) sentCount++;
      }

      return NextResponse.json({ success: true, count: sentCount });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error sending LINE reminders:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
