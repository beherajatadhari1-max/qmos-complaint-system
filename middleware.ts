import { NextRequest, NextResponse } from 'next/server';

// Routes that do NOT require login
const PUBLIC_ROUTES = ['/login', '/access-denied'];

// Routes only ADMIN can access
const ADMIN_ONLY_ROUTES = ['/admin', '/admin/users'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and Next.js internals through
  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Read session cookie
  const sessionCookie = req.cookies.get('qmos_session');

  // No session → redirect to login
  if (!sessionCookie?.value) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Parse session
  let session: { type?: string } | null = null;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    // Corrupt cookie → redirect to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Non-admin trying to access admin routes → access denied
  if (
    session?.type !== 'ADMIN' &&
    ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))
  ) {
    const deniedUrl = req.nextUrl.clone();
    deniedUrl.pathname = '/access-denied';
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
