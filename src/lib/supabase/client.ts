import { createBrowserClient } from '@supabase/ssr';

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

export function createClient() {
  const url = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createBrowserClient(url, key);
}
