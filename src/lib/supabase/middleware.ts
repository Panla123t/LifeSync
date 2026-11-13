import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function sanitizeSupabaseUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url = rawUrl.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  if (!url || url === 'undefined' || url === 'null' || url.includes('your-project') || url.includes('placeholder')) {
    return null;
  }
  // Auto-heal missing letters in https from copy-paste typos (e.g. ttps://...)
  if (url.startsWith('ttps://')) {
    url = 'h' + url;
  } else if (url.startsWith('tps://')) {
    url = 'ht' + url;
  }
  // Extract supabase host if present
  const match = url.match(/([a-z0-9_-]+\.supabase\.co)/i);
  if (match) {
    return `https://${match[1]}`;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function sanitizeSupabaseKey(rawKey?: string): string | null {
  if (!rawKey || typeof rawKey !== 'string') return null;
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  if (!key || key === 'undefined' || key === 'null' || key.includes('your-anon-key') || key.includes('placeholder')) {
    return null;
  }
  return key;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // If not configured or invalid, gracefully bypass without throwing 500 error
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register') ||
      request.nextUrl.pathname.startsWith('/reset-password');

    const isPublicRoute =
      request.nextUrl.pathname === '/' ||
      isAuthRoute ||
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/api/line');

    // If user is not logged in and accessing a private area, redirect to login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If user is logged in and visiting login or register, redirect to dashboard
    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (err) {
    console.error('Session middleware error, bypassing:', err);
    return supabaseResponse;
  }
}
