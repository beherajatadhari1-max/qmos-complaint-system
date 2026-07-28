import { NextRequest, NextResponse } from 'next/server';
import { QMOS_USERS } from '@/lib/users.config';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'lib', 'users.db.json');

function readDynamicUsers() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) || [];
  } catch {
    return [];
  }
}

function writeDynamicUsers(users: any[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qmos_session');
  if (!sessionCookie?.value) return null;
  try { return JSON.parse(sessionCookie.value); } catch { return null; }
}

// GET — list all users (no passwords)
export async function GET() {
  const session = await getSession();
  if (!session || session.type !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configUsers = QMOS_USERS.map(({ password: _pw, ...rest }) => ({ ...rest, source: 'config' }));
  const dynamicUsers = readDynamicUsers().map(({ password: _pw, ...rest }: any) => ({ ...rest, source: 'added' }));

  return NextResponse.json({ users: [...configUsers, ...dynamicUsers] });
}

// POST — add a new user
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password, type, role, department, plant, allowedRoutes } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
  }

  // Check duplicate
  const allUsers = [...QMOS_USERS, ...readDynamicUsers()];
  if (allUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const newUser = {
    email, password, name,
    type: type || 'USER',
    role: role || 'QA Engineer',
    department: department || 'Quality',
    plant: plant || 'Plant 1',
    allowedRoutes: allowedRoutes || [],
    createdAt: new Date().toISOString(),
  };

  const existing = readDynamicUsers();
  writeDynamicUsers([...existing, newUser]);

  return NextResponse.json({ success: true, user: { name, email, type: newUser.type } });
}

// DELETE — remove a dynamic user by email
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await req.json();
  const existing = readDynamicUsers();
  const filtered = existing.filter((u: any) => u.email.toLowerCase() !== email.toLowerCase());
  writeDynamicUsers(filtered);

  return NextResponse.json({ success: true });
}
