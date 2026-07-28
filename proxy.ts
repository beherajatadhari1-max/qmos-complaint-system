import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_ONLY_ROUTES } from '@/lib/users.config';

const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/logout'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Always pass pathname as header so layout can read it ──
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // ── Allow public routes & static assets ───────────────────
  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons')
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Check session cookie ───────────────────────────────────
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

  // ── ADMIN: full access everywhere ─────────────────────────
  if (session.type === 'ADMIN') {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── USER: block admin-only routes ─────────────────────────
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r));
  if (isAdminRoute) {
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }

  // ── USER: check allowedRoutes if specified ─────────────────
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
