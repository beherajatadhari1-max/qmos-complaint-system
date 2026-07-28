import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(getDB().prepare('SELECT * FROM team_members WHERE complaint_id = ?').all(id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDB();
  const result = db.prepare(`
    INSERT INTO team_members (complaint_id, member_name, designation, department, role_in_team, contact_number, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.member_name, body.designation || '', body.department || '', body.role_in_team || 'Member', body.contact_number || '', body.email || '');
  logTimeline(parseInt(id), 'TEAM', `Team member added: ${body.member_name} (${body.role_in_team || 'Member'})`);
  return NextResponse.json(db.prepare('SELECT * FROM team_members WHERE id = ?').get(Number(result.lastInsertRowid)), { status: 201 });
}
