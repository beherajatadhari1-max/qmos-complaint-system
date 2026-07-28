import { NextResponse } from 'next/server';
import { QMOS_USERS } from '@/lib/users.config';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Only ADMIN in production
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qmos_session');
  if (!sessionCookie?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session: { type: string };
  try { session = JSON.parse(sessionCookie.value); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  if (session.type !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Read dynamic users too
  let dynamicUsers: any[] = [];
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'lib', 'users.db.json'), 'utf-8');
    dynamicUsers = JSON.parse(raw) || [];
  } catch { dynamicUsers = []; }

  const all = [...QMOS_USERS, ...dynamicUsers].map(u => ({
    name:     u.name,
    email:    u.email,
    password: u.password,
    type:     u.type,
    role:     u.role,
  }));

  return NextResponse.json({ credentials: all });
}
