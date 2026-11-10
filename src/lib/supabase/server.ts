import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return 'https://placeholder.supabase.co';
  let url = rawUrl.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  if (!url || url === 'undefined' || url === 'null') {
    return 'https://placeholder.supabase.co';
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
      return 'https://placeholder.supabase.co';
    }
    return url;
  } catch {
    return 'https://placeholder.supabase.co';
  }
}

function sanitizeSupabaseKey(rawKey?: string): string {
  if (!rawKey || typeof rawKey !== 'string') return 'placeholder-anon-key';
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  if (!key || key === 'undefined' || key === 'null') {
    return 'placeholder-anon-key';
  }
  return key;
}

export async function createClient() {
  const cookieStore = await cookies();
  const url = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
