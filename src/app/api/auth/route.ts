import { NextResponse } from 'next/server';
import {
  generateSessionToken,
  verifyPassword,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

// Rate limiting: track failed attempts per IP
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;

  const now = Date.now();
  if (now - record.lastAttempt > LOCKOUT_DURATION_MS) {
    failedAttempts.delete(ip);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const record = failedAttempts.get(ip);
  const now = Date.now();

  if (record && now - record.lastAttempt < LOCKOUT_DURATION_MS) {
    record.count++;
    record.lastAttempt = now;
  } else {
    failedAttempts.set(ip, { count: 1, lastAttempt: now });
  }
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export async function POST(request: Request) {
  const clientIP = getClientIP(request);

  // Check rate limiting
  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      recordFailedAttempt(clientIP);
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password using timing-safe comparison
    if (!verifyPassword(password)) {
      recordFailedAttempt(clientIP);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Password correct - generate secure session token
    clearFailedAttempts(clientIP);
    const sessionToken = generateSessionToken();

    const response = NextResponse.json({ success: true });

    // Set secure cookie with signed token
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[AUTH] Error processing login:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
