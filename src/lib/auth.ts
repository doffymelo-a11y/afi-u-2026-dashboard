import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// Secret key for signing tokens - MUST be set in environment
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.DASHBOARD_PASSWORD || '';

if (!AUTH_SECRET || AUTH_SECRET.length < 16) {
  console.warn('[AUTH] WARNING: AUTH_SECRET is not set or too short. Set a strong AUTH_SECRET in environment variables.');
}

/**
 * Session token structure:
 * {timestamp}.{randomId}.{signature}
 *
 * - timestamp: Unix timestamp when token was created
 * - randomId: Random 32-byte hex string
 * - signature: HMAC-SHA256 signature of "timestamp.randomId"
 */

const TOKEN_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const randomId = randomBytes(32).toString('hex');
  const payload = `${timestamp}.${randomId}`;

  const signature = createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Verify a session token
 * Returns true if valid and not expired, false otherwise
 */
export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [timestamp, randomId, providedSignature] = parts;

  // Verify timestamp is a number and not expired
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime)) {
    return false;
  }

  const now = Date.now();
  if (now - tokenTime > TOKEN_VALIDITY_MS) {
    return false; // Token expired
  }

  if (tokenTime > now + 60000) {
    return false; // Token from the future (clock skew tolerance: 1 min)
  }

  // Recalculate signature
  const payload = `${timestamp}.${randomId}`;
  const expectedSignature = createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  try {
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify password against environment variable
 */
export function verifyPassword(password: string): boolean {
  const correctPassword = process.env.DASHBOARD_PASSWORD;

  if (!correctPassword) {
    console.error('[AUTH] DASHBOARD_PASSWORD environment variable is not set');
    return false;
  }

  // Timing-safe comparison
  try {
    const providedBuffer = Buffer.from(password);
    const correctBuffer = Buffer.from(correctPassword);

    if (providedBuffer.length !== correctBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, correctBuffer);
  } catch {
    return false;
  }
}

/**
 * Cookie name for session token
 */
export const SESSION_COOKIE_NAME = 'dashboard_session';
