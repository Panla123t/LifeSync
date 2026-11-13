import crypto from 'crypto';

function getStateSecret(): string {
  return (
    process.env.LINE_LOGIN_CHANNEL_SECRET ||
    process.env.LINE_CHANNEL_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'ce4e1758b612939d2c7b800168589dce'
  );
}

/**
 * Generates a tamper-proof cryptographic OAuth state containing timestamp,
 * random nonce, and HMAC-SHA256 signature.
 * Format: `${timestamp}.${nonce}.${hmac}`
 */
export function generateOAuthState(): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${timestamp}.${nonce}`;
  const hmac = crypto
    .createHmac('sha256', getStateSecret())
    .update(payload)
    .digest('hex');

  return `${payload}.${hmac}`;
}

/**
 * Verifies that the OAuth state is authentic and not expired.
 * Supports both HMAC signature verification (cookie-free) and fallback cookie matching.
 */
export function verifyOAuthState(state: string | null, cookieState?: string | null): boolean {
  if (!state) return false;

  // 1. Direct cookie match fallback if present
  if (cookieState && cookieState === state) {
    return true;
  }

  // 2. Cryptographic HMAC verification
  const parts = state.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [timestampStr, nonce, receivedHmac] = parts;
  const timestamp = Number(timestampStr);

  if (isNaN(timestamp)) {
    return false;
  }

  // Allow up to 30 minutes for user authentication completion
  const maxAge = 30 * 60 * 1000;
  const now = Date.now();
  if (now - timestamp > maxAge || timestamp > now + 60 * 1000) {
    return false;
  }

  const payload = `${timestampStr}.${nonce}`;
  const expectedHmac = crypto
    .createHmac('sha256', getStateSecret())
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}
