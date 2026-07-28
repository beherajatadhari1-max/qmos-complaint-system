import { NextRequest, NextResponse } from 'next/server';
import { QMOS_USERS } from '@/lib/users.config';
import fs from 'fs';
import path from 'path';

const SESSION_MAX_AGE_DEFAULT = 8 * 60 * 60;        // 8 hours
const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60; // 30 days

function getDynamicUsers() {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'users.db.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check config users + dynamically added users
    const allUsers = [...QMOS_USERS, ...getDynamicUsers()];

    const user = allUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const session = {
      email:         user.email,
      name:          user.name,
      type:          user.type,
      role:          user.role,
      department:    user.department,
      plant:         user.plant,
      allowedRoutes: (user as any).allowedRoutes ?? [],
      loginAt:       new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: { name: user.name, role: user.role, type: user.type },
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
