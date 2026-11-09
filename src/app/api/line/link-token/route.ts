import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// In-memory token store fallback in case migrations haven't run on local/remote Supabase
const memoryTokens = new Map<string, { userId: string; expiresAt: number }>();

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: notif } = await supabase
      .from('notification_settings')
      .select('line_user_id, line_linked_at, hydration_enabled, sleep_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      is_linked: Boolean(notif?.line_user_id),
      line_user_id: notif?.line_user_id || null,
      linked_at: notif?.line_linked_at || null,
      hydration_enabled: notif?.hydration_enabled ?? true,
      sleep_enabled: notif?.sleep_enabled ?? true,
    });
  } catch (err) {
    console.error('Error fetching LINE status:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate clean 6-digit numeric token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save to memory fallback
    memoryTokens.set(token, { userId: user.id, expiresAt: expiresAt.getTime() });

    // Try saving to Supabase line_link_tokens
    try {
      const admin = createAdminClient();
      // Remove any previous token for this user
      await admin.from('line_link_tokens').delete().eq('user_id', user.id);
      await admin.from('line_link_tokens').insert({
        token,
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
      });
    } catch (dbErr) {
      console.warn('Could not insert to line_link_tokens table (using memory fallback):', dbErr);
    }

    const lineBotId = process.env.LINE_BOT_BASIC_ID || '@lifesync';
    const lineOaUrl = `https://line.me/R/ti/p/${lineBotId}`;

    return NextResponse.json({
      token,
      expires_at: expiresAt.toISOString(),
      line_oa_url: lineOaUrl,
      instructions: 'Send this 6-digit code to the LifeSync LINE Official Account in chat',
    });
  } catch (err) {
    console.error('Error generating LINE link token:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    await admin
      .from('notification_settings')
      .update({
        line_user_id: null,
        line_linked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Unlinked successfully' });
  } catch (err) {
    console.error('Error unlinking LINE account:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Export memory store getter for the webhook handler
export function verifyAndConsumeMemoryToken(token: string): string | null {
  const item = memoryTokens.get(token);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryTokens.delete(token);
    return null;
  }
  memoryTokens.delete(token);
  return item.userId;
}
