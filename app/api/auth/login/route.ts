import { NextRequest, NextResponse } from 'next/server';
import { QMOS_USERS } from '@/lib/users.config';
import { supabaseAdmin } from '@/lib/supabase';

const SESSION_MAX_AGE_DEFAULT = 8 * 60 * 60;        // 8 hours
const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60; // 30 days

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // ── 1. Super-admin config users (QMOS_USERS) — checked first ──
    const configUser = QMOS_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (configUser) {
      // Resolve company_id from Supabase for the session cookie
      const { data: company } = await supabaseAdmin
        .from('companies').select('id, code').eq('code', 'BALESH001').single();

      const session = {
        email:         configUser.email,
        name:          configUser.name,
        type:          configUser.type,
        role:          configUser.role,
        department:    configUser.department,
        plant:         configUser.plant,
        allowedRoutes: configUser.allowedRoutes ?? [],
        company_id:    company?.id ?? null,
        company_code:  company?.code ?? 'BALESH001',
        loginAt:       new Date().toISOString(),
      };

      const response = NextResponse.json({
        success: true,
        user: { name: configUser.name, role: configUser.role, type: configUser.type },
      });
      response.cookies.set('qmos_session', JSON.stringify(session), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT,
        path:     '/',
      });
      return response;
    }

    // ── 2. Supabase company_users table ──────────────────────────
    const { data: dbUser, error } = await supabaseAdmin
      .from('company_users')
      .select('*, companies(id, code)')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !dbUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (dbUser.password_hash !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const session = {
      email:         dbUser.email,
      name:          dbUser.name,
      type:          dbUser.type,
      role:          dbUser.role,
      department:    dbUser.department,
      plant:         dbUser.plant,
      allowedRoutes: dbUser.allowed_routes ?? [],
      company_id:    dbUser.company_id,
      company_code:  (dbUser.companies as any)?.code ?? '',
      loginAt:       new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: { name: dbUser.name, role: dbUser.role, type: dbUser.type },
    });
    response.cookies.set('qmos_session', JSON.stringify(session), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT,
      path:     '/',
    });
    return response;

  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
