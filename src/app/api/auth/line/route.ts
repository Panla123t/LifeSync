import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
  const lineClientId = process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CHANNEL_ID;
  const baseUrl = getBaseUrl(req);
  const callbackUrl = `${baseUrl}/api/auth/line/callback`;

  // If LINE Login Channel is not configured yet, redirect with helpful prompt
  if (!lineClientId) {
    return NextResponse.redirect(new URL('/login?error=line_login_unconfigured', req.url));
  }

  // Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // LINE OAuth 2.1 authorization endpoint
  const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', lineClientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'profile openid email');
  authUrl.searchParams.set('bot_prompt', 'aggressive'); // Prompt user to add Sunny OA as friend

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('line_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
