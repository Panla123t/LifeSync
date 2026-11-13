import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  sendLinePush, 
  createHydrationReminderMessage, 
  createSleepReminderMessage,
  createMorningGreetingMessage,
  createMealReminderMessage,
  createWeeklyDigestMessage
} from '@/lib/line/client';
import { generateWeeklySummary } from '@/lib/analytics/weeklySummary';

async function handleReminders(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cronSecretHeader = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    // Check if called by Vercel Cron or with bearer token
    const isCronAuthorized = 
      (expectedSecret && (cronSecretHeader === expectedSecret || authHeader.replace('Bearer ', '') === expectedSecret)) ||
      req.headers.get('user-agent')?.includes('vercel-cron');

    let targetUserId: string | null = null;

    if (!isCronAuthorized) {
      // If not called by cron, check if called by authenticated user in Settings
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          targetUserId = user.id;
        }
      } catch {
        // Not authenticated
      }
    }

    const { searchParams } = new URL(req.url);
    const queryType = searchParams.get('type');

    let bodyType: string | undefined;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      bodyType = body.type;
    }

    const reminderType = queryType || bodyType || (targetUserId ? 'test' : 'hydration');

    const admin = createAdminClient();

    // 1. Single User Target (e.g. "Send Test Reminder" in Settings)
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
        .maybeSingle();

      const userName = profile?.display_name || 'เพื่อนคนเก่ง';

      let message;
      if (reminderType === 'sleep') {
        message = createSleepReminderMessage(userName);
      } else if (reminderType === 'morning') {
        message = createMorningGreetingMessage(userName);
      } else if (reminderType === 'meal') {
        message = createMealReminderMessage(userName);
      } else if (reminderType === 'weekly_summary') {
        const weeklyData = await generateWeeklySummary(targetUserId, admin);
        message = createWeeklyDigestMessage(userName, weeklyData);
      } else {
        // Default hydration reminder
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: waterLogs } = await admin
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', targetUserId)
          .gte('logged_at', startOfDay.toISOString());

        const currentMl = (waterLogs || []).reduce((sum, w) => sum + w.amount_ml, 0);
        message = createHydrationReminderMessage(userName, currentMl || 500, 2000);
      }

      const result = await sendLinePush(notif.line_user_id, [message]);

      return NextResponse.json({
        success: result.success,
        simulated: result.simulated,
        message: result.simulated 
          ? 'Simulation mode: Reminder formatted successfully (Configure LINE_CHANNEL_ACCESS_TOKEN for live delivery)'
          : 'Live reminder sent to your LINE account!',
      });
    }

    // 2. Broadcast Cron Reminders to all connected users
    let sentCount = 0;

    if (reminderType === 'hydration') {
      const { data: users } = await admin
        .from('notification_settings')
        .select('user_id, line_user_id')
        .eq('hydration_enabled', true)
        .not('line_user_id', 'is', null);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      for (const u of (users || [])) {
        if (!u.line_user_id) continue;
        const { data: prof } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', u.user_id)
          .maybeSingle();

        const { data: waterLogs } = await admin
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', u.user_id)
          .gte('logged_at', startOfDay.toISOString());

        const currentMl = (waterLogs || []).reduce((sum, w) => sum + w.amount_ml, 0);
        const res = await sendLinePush(u.line_user_id, [
          createHydrationReminderMessage(prof?.display_name || 'เพื่อนคนเก่ง', currentMl, 2000),
        ]);
        if (res.success) sentCount++;
      }
    } else if (reminderType === 'sleep') {
      const { data: users } = await admin
        .from('notification_settings')
        .select('user_id, line_user_id')
        .eq('sleep_enabled', true)
        .not('line_user_id', 'is', null);

      for (const u of (users || [])) {
        if (!u.line_user_id) continue;
        const { data: prof } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', u.user_id)
          .maybeSingle();

        const res = await sendLinePush(u.line_user_id, [
          createSleepReminderMessage(prof?.display_name || 'เพื่อนคนเก่ง'),
        ]);
        if (res.success) sentCount++;
      }
    } else if (reminderType === 'morning') {
      const { data: users } = await admin
        .from('notification_settings')
        .select('user_id, line_user_id')
        .not('line_user_id', 'is', null);

      for (const u of (users || [])) {
        if (!u.line_user_id) continue;
        const { data: prof } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', u.user_id)
          .maybeSingle();

        const res = await sendLinePush(u.line_user_id, [
          createMorningGreetingMessage(prof?.display_name || 'เพื่อนคนเก่ง'),
        ]);
        if (res.success) sentCount++;
      }
    } else if (reminderType === 'meal') {
      const { data: users } = await admin
        .from('notification_settings')
        .select('user_id, line_user_id')
        .not('line_user_id', 'is', null);

      for (const u of (users || [])) {
        if (!u.line_user_id) continue;
        const { data: prof } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', u.user_id)
          .maybeSingle();

        const res = await sendLinePush(u.line_user_id, [
          createMealReminderMessage(prof?.display_name || 'เพื่อนคนเก่ง'),
        ]);
        if (res.success) sentCount++;
      }
    } else if (reminderType === 'weekly_summary') {
      const { data: users } = await admin
        .from('notification_settings')
        .select('user_id, line_user_id')
        .not('line_user_id', 'is', null);

      for (const u of (users || [])) {
        if (!u.line_user_id) continue;
        const { data: prof } = await admin
          .from('profiles')
          .select('display_name, timezone')
          .eq('id', u.user_id)
          .maybeSingle();

        const weeklyData = await generateWeeklySummary(u.user_id, admin, prof?.timezone || 'Asia/Bangkok');
        const res = await sendLinePush(u.line_user_id, [
          createWeeklyDigestMessage(prof?.display_name || 'เพื่อนคนเก่ง', weeklyData),
        ]);
        if (res.success) sentCount++;
      }
    }

    return NextResponse.json({ success: true, type: reminderType, sentCount });
  } catch (err) {
    console.error('Error sending LINE reminders:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleReminders(req);
}

export async function POST(req: NextRequest) {
  return handleReminders(req);
}
