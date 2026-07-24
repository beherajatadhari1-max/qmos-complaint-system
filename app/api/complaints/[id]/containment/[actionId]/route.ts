import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; actionId: string }> }) {
  const { id, actionId } = await params;
  const body = await req.json();
  const db = getDB();
  const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
  const values = Object.values(body) as (string | number | null)[];
  db.prepare(`UPDATE containment_actions SET ${fields} WHERE id = ? AND complaint_id = ?`).run(...values, actionId, id);
  logTimeline(parseInt(id), 'D3_UPDATE', `Containment action #${actionId} updated`);
  const action = db.prepare('SELECT * FROM containment_actions WHERE id = ?').get(actionId);
  return NextResponse.json(action);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; actionId: string }> }) {
  const { id, actionId } = await params;
  const db = getDB();
  db.prepare('DELETE FROM containment_actions WHERE id = ? AND complaint_id = ?').run(actionId, id);
  logTimeline(parseInt(id), 'D3_DELETE', `Containment action #${actionId} removed`);
  return NextResponse.json({ success: true });
}
