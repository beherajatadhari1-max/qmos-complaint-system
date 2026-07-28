import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const actions = db.prepare('SELECT * FROM capa_actions WHERE complaint_id = ? ORDER BY action_number').all(id);
  return NextResponse.json(actions);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDB();
  const count = (db.prepare('SELECT COUNT(*) as c FROM capa_actions WHERE complaint_id = ?').get(id) as { c: number }).c;
  const result = db.prepare(`
    INSERT INTO capa_actions (complaint_id, action_number, action_type, action_description, document_to_update, responsible_person, target_date, verification_method, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, count + 1, body.action_type || 'Corrective', body.action_description, body.document_to_update || '', body.responsible_person || '', body.target_date || '', body.verification_method || '', 'Planned');
  // Auto-update complaint status to CAPA In Progress
  db.prepare(`UPDATE complaints SET status = 'CAPA In Progress', updated_at = datetime('now','localtime') WHERE id = ? AND status IN ('Open','Under Investigation')`).run(id);
  logTimeline(parseInt(id), 'CAPA_ADD', `CAPA action #${count + 1} added: ${body.action_description?.slice(0, 60)}`);
  const action = db.prepare('SELECT * FROM capa_actions WHERE id = ?').get(Number(result.lastInsertRowid));
  return NextResponse.json(action, { status: 201 });
}
