export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { resolveRBACRole } from '@/lib/rbac';

// GET /api/auth/me — returns current session for client components
// Safe to call from any client component; returns 401 if not logged in.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('qmos_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const rbacRole = resolveRBACRole(session.type, session.role);

    return NextResponse.json({
      authenticated: true,
      name:         session.name,
      email:        session.email,
      type:         session.type,         // 'ADMIN' | 'USER'
      role:         session.role,         // display string
      rbacRole,                           // standardised RBAC role
      department:   session.department,
      plant:        session.plant,
      company_id:   session.company_id,
      company_code: session.company_code,
      loginAt:      session.loginAt,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
