import { NextRequest, NextResponse } from 'next/server';
import { QMOS_USERS } from '@/lib/users.config';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

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

  // Config super-admin users (hardcoded)
  const configUsers = QMOS_USERS.map(({ password: _pw, ...rest }) => ({
    ...rest,
    source: 'config',
    company_id: session.company_id ?? null,
  }));

  // Supabase company_users for this company
  const { data: dbUsers, error } = await supabaseAdmin
    .from('company_users')
    .select('id, email, name, type, role, department, plant, allowed_routes, is_active, created_at')
    .eq('company_id', session.company_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase users fetch error:', error);
    return NextResponse.json({ users: configUsers });
  }

  const supabaseUsers = (dbUsers ?? []).map(u => ({
    id:            u.id,
    email:         u.email,
    name:          u.name,
    type:          u.type,
    role:          u.role,
    department:    u.department,
    plant:         u.plant,
    allowedRoutes: u.allowed_routes ?? [],
    is_active:     u.is_active,
    created_at:    u.created_at,
    source:        'supabase',
    company_id:    session.company_id,
  }));

  return NextResponse.json({ users: [...configUsers, ...supabaseUsers] });
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

  if (!session.company_id) {
    return NextResponse.json({ error: 'Session missing company_id — please log out and log back in' }, { status: 400 });
  }

  // Block duplicate in Supabase
  const { data: existing } = await supabaseAdmin
    .from('company_users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  // Block duplicate against config users
  if (QMOS_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const { error: insertError } = await supabaseAdmin
    .from('company_users')
    .insert({
      company_id:     session.company_id,
      email:          email.toLowerCase(),
      password_hash:  password,
      name,
      type:           type || 'USER',
      role:           role || 'QA Engineer',
      department:     department || 'Quality',
      plant:          plant || 'Plant 1',
      allowed_routes: allowedRoutes || [],
    });

  if (insertError) {
    console.error('Insert user error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: { name, email, type: type || 'USER' } });
}

// DELETE — remove a user by email
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await req.json();

  // Protect config super-admins from deletion
  if (QMOS_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Cannot delete a system admin user' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('company_users')
    .delete()
    .eq('email', email.toLowerCase())
    .eq('company_id', session.company_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
