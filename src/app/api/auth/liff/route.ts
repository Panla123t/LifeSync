import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken, profile } = body;

    const lineClientId = process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CHANNEL_ID;
    let lineUserId = profile?.userId;
    let displayName = profile?.displayName || 'LifeSync Member';
    let pictureUrl = profile?.pictureUrl || '';
    let email = '';

    // If ID Token is available, verify with LINE API
    if (idToken && lineClientId) {
      try {
        const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            id_token: idToken,
            client_id: lineClientId,
          }).toString(),
        });

        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          lineUserId = payload.sub || lineUserId;
          displayName = payload.name || displayName;
          pictureUrl = payload.picture || pictureUrl;
          email = payload.email || email;
        }
      } catch (err) {
        console.warn('[LIFF Auth] Verify ID token error:', err);
      }
    }

    if (!lineUserId) {
      return NextResponse.json({ error: 'Missing LINE User ID' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Find existing user linked to this LINE ID
    let targetUser: User | null = null;
    const { data: notifRow } = await admin
      .from('notification_settings')
      .select('user_id')
      .eq('line_user_id', lineUserId)
      .maybeSingle();

    if (notifRow?.user_id) {
      const { data: userRes } = await admin.auth.admin.getUserById(notifRow.user_id);
      targetUser = userRes?.user;
    }

    // Check by email if provided
    if (!targetUser && email) {
      const { data: usersList } = await admin.auth.admin.listUsers();
      targetUser = (usersList?.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    }

    // If still not found, create new user
    if (!targetUser) {
      const userEmail = email || `${lineUserId.toLowerCase()}@line.lifesync.app`;
      const { data: newUserRes, error: createErr } = await admin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          avatar_url: pictureUrl,
          line_user_id: lineUserId,
        },
      });

      if (createErr || !newUserRes?.user) {
        console.error('[LIFF Auth] User creation error:', createErr);
        return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
      }
      targetUser = newUserRes.user;
    }

    // Ensure profiles & notification_settings are linked
    await admin.from('profiles').upsert({
      id: targetUser.id,
      display_name: displayName,
      avatar_url: pictureUrl,
      timezone: 'Asia/Bangkok',
    }, { onConflict: 'id' });

    await admin.from('notification_settings').upsert({
      user_id: targetUser.id,
      line_user_id: lineUserId,
      hydration_enabled: true,
      sleep_enabled: true,
    }, { onConflict: 'user_id' });

    // Generate magic link and verify OTP directly to set session cookies
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: 'Could not generate session' }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        displayName,
        email: targetUser.email,
      },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const serverClient = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      await serverClient.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'magiclink',
      });
    }

    return response;
  } catch (err) {
    console.error('[LIFF Auth Fatal Error]:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
