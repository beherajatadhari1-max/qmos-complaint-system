import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_ONLY_ROUTES } from '@/lib/users.config';

const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/logout', '/api/daily-report', '/api/capa-alerts'];

// ── Rate Limiting ─────────────────────────────────────────────────
interface RateLimitEntry { count: number; windowStart: number; }
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT = { windowMs: 60_000, maxRequests: 30 };

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT.windowMs) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT.maxRequests) return true;
  rateLimitStore.set(ip, entry);
  return false;
}

// Periodic cleanup — prevent Map growing unbounded
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT.windowMs * 2) rateLimitStore.delete(ip);
  }
}, 5 * 60_000);

// ── Main proxy function ───────────────────────────────────────────
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // ── Rate limit mutating API calls ─────────────────────────────
  const isMutating =
    pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method ?? '');

  if (isMutating) {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      console.warn(`[QMOS Rate Limit] Blocked ${ip} on ${req.method} ${pathname}`);
      return NextResponse.json(
        { error: 'Too many requests — please slow down and try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Limit': '30', 'X-RateLimit-Window': '60s' } }
      );
    }
  }

  // ── Allow public routes & static assets ──────────────────────
  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons')
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Check session cookie ──────────────────────────────────────
  const sessionCookie = req.cookies.get('qmos_session');
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let session: {
    email: string;
    name: string;
    type: 'ADMIN' | 'USER';
    role: string;
    allowedRoutes: string[];
  };

  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ── ADMIN: full access ────────────────────────────────────────
  if (session.type === 'ADMIN') {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── USER: block admin-only routes ────────────────────────────
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r));
  if (isAdminRoute) {
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }

  // ── USER: check allowedRoutes if specified ────────────────────
  if (session.allowedRoutes && session.allowedRoutes.length > 0) {
    const isAllowed =
      pathname === '/' ||
      pathname.startsWith('/api/') ||
      session.allowedRoutes.some(r => pathname.startsWith(r));
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
