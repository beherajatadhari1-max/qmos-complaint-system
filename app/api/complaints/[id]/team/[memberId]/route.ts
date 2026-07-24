import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id, memberId } = await params;
  const db = getDB();
  const member = db.prepare('SELECT member_name FROM team_members WHERE id = ?').get(memberId) as { member_name: string } | undefined;
  db.prepare('DELETE FROM team_members WHERE id = ? AND complaint_id = ?').run(memberId, id);
  if (member) logTimeline(parseInt(id), 'TEAM', `Team member removed: ${member.member_name}`);
  return NextResponse.json({ success: true });
}
