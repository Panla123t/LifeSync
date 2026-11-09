import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return 'https://placeholder.supabase.co';
  let url = rawUrl.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  if (!url || url === 'undefined' || url === 'null') {
    return 'https://placeholder.supabase.co';
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

function sanitizeSupabaseKey(rawKey?: string, fallback = 'placeholder-key'): string {
  if (!rawKey || typeof rawKey !== 'string') return fallback;
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  if (!key || key === 'undefined' || key === 'null') {
    return fallback;
  }
  return key;
}

export function createAdminClient() {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = sanitizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY, 'placeholder-service-role-key');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
