import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyOAuthState } from '@/lib/auth/lineState';
import type { User } from '@supabase/supabase-js';

function getBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https') ? 'https' : 'http');

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.APP_BASE_URL?.replace(/\/$/, '') || 'https://life-sync-panla123ts-projects.vercel.app';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = getBaseUrl(req);

  if (error || !code) {
    console.error('LINE OAuth Error:', error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || 'LINE login was cancelled')}`, req.url));
  }

  // Verify state with HMAC signature (works reliably across mobile/browser switches) and cookie fallback
  const storedCookieState = req.cookies.get('line_oauth_state')?.value;
  if (!verifyOAuthState(state, storedCookieState)) {
    console.warn('[LINE Auth Callback] Invalid state received:', { state, hasCookie: Boolean(storedCookieState) });
    return NextResponse.redirect(new URL('/login?error=invalid_state', req.url));
  }

  const lineClientId = process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CHANNEL_ID;
  const lineClientSecret = process.env.LINE_LOGIN_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET;
  const callbackUrl = `${baseUrl}/api/auth/line/callback`;

  if (!lineClientId || !lineClientSecret) {
    return NextResponse.redirect(new URL('/login?error=line_login_unconfigured', req.url));
  }

  try {
    // 1. Exchange authorization code for access token & ID token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      client_id: lineClientId,
      client_secret: lineClientSecret,
    });

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Failed to exchange token with LINE:', errText);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', req.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    // 2. Fetch User Profile from LINE
    let lineUserId = '';
    let displayName = 'LifeSync Member';
    let pictureUrl = '';
    let email = '';

    // If id_token is provided, verify payload
    if (idToken) {
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
          lineUserId = payload.sub || '';
          displayName = payload.name || displayName;
          pictureUrl = payload.picture || '';
          email = payload.email || '';
        }
      } catch (verifyErr) {
        console.warn('Error verifying LINE id_token:', verifyErr);
      }
    }

    // Fallback to profile API if sub missing
    if (!lineUserId && accessToken) {
      const profRes = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profRes.ok) {
        const prof = await profRes.json();
        lineUserId = prof.userId;
        displayName = prof.displayName || displayName;
        pictureUrl = prof.pictureUrl || pictureUrl;
      }
    }

    if (!lineUserId) {
      return NextResponse.redirect(new URL('/login?error=missing_line_profile', req.url));
    }

    const admin = createAdminClient();

    // 3. Find or Create Supabase User
    // A. Check if already linked via notification_settings
    let targetUser: User | null = null;
    const { data: linkedNotif } = await admin
      .from('notification_settings')
      .select('user_id')
      .eq('line_user_id', lineUserId)
      .maybeSingle();

    if (linkedNotif?.user_id) {
      const { data: userRes } = await admin.auth.admin.getUserById(linkedNotif.user_id);
      targetUser = userRes?.user;
    }

    // B. Check by email if provided
    if (!targetUser && email) {
      const { data: usersList } = await admin.auth.admin.listUsers();
      targetUser = (usersList?.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    }

    // C. If still not found, create a new Supabase user
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
        console.error('Error creating user for LINE login:', createErr);
        return NextResponse.redirect(new URL('/login?error=user_creation_failed', req.url));
      }
      targetUser = newUserRes.user;
    }

    // D. Ensure profiles and notification_settings are linked
    if (targetUser) {
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

      // Award 20 points for LINE connection
      try {
        await admin.from('point_transactions').insert({
          user_id: targetUser.id,
          points_delta: 20,
          reason: 'Linked LINE Official Account',
          idempotency_key: `line_link_${targetUser.id}`,
        });
      } catch {
        // Ignore duplicate points
      }
    }

    // 4. Generate Supabase magic auth token
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email,
      options: {
        redirectTo: `${baseUrl}/dashboard`,
      },
    });

    if (linkErr || !linkData?.properties) {
      console.error('Error generating auth link:', linkErr);
      return NextResponse.redirect(new URL('/login?error=auth_session_failed', req.url));
    }

    const redirectTarget = new URL('/dashboard', baseUrl);
    const response = NextResponse.redirect(redirectTarget);
    response.cookies.delete('line_oauth_state');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Verify token directly on the server so session cookies are written immediately
    // to the response! This avoids bouncing to external hosts and prevents unwanted redirects to localhost.
    if (linkData.properties.hashed_token && supabaseUrl && supabaseKey) {
      try {
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

        const { data: sessionData, error: otpErr } = await serverClient.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: 'magiclink',
        });

        if (!otpErr && sessionData?.session) {
          return response;
        }
        if (otpErr) {
          console.warn('Server verifyOtp error, falling back to action_link:', otpErr);
        }
      } catch (err) {
        console.warn('Error establishing server session:', err);
      }
    }

    // Fallback: If direct verification did not succeed, redirect to the generated action link
    if (linkData.properties.action_link) {
      return NextResponse.redirect(linkData.properties.action_link);
    }

    return response;
  } catch (err) {
    console.error('Fatal error in LINE callback:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}
