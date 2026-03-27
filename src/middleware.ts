import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Session cookie name - must match auth.ts
const SESSION_COOKIE_NAME = 'dashboard_session';

// Token validity: 7 days in milliseconds
const TOKEN_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Verify session token in middleware (Edge Runtime compatible)
 * Uses Web Crypto API instead of Node.js crypto
 */
async function verifySessionToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [timestamp, randomId, providedSignature] = parts;

  // Verify timestamp
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime)) {
    return false;
  }

  const now = Date.now();
  if (now - tokenTime > TOKEN_VALIDITY_MS) {
    return false; // Token expired
  }

  if (tokenTime > now + 60000) {
    return false; // Token from the future
  }

  // Get secret from environment
  const secret = process.env.AUTH_SECRET || process.env.DASHBOARD_PASSWORD || '';
  if (!secret) {
    console.error('[MIDDLEWARE] No AUTH_SECRET or DASHBOARD_PASSWORD configured');
    return false;
  }

  // Calculate expected signature using Web Crypto API
  try {
    const encoder = new TextEncoder();
    const payload = `${timestamp}.${randomId}`;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (providedSignature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      result |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('[MIDDLEWARE] Error verifying token:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and public files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // Allow login page for unauthenticated users
  if (pathname === '/login') {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      const isValid = await verifySessionToken(sessionCookie.value);
      if (isValid) {
        // Already authenticated, redirect to dashboard
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow auth API endpoint
  if (pathname === '/api/auth') {
    return NextResponse.next();
  }

  // For all other routes, verify authentication
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isValid = await verifySessionToken(sessionCookie.value);

  if (!isValid) {
    // Invalid or expired token - clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
