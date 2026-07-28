import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const actions = db.prepare('SELECT * FROM containment_actions WHERE complaint_id = ? ORDER BY action_number').all(id);
  return NextResponse.json(actions);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDB();
  const count = (db.prepare('SELECT COUNT(*) as c FROM containment_actions WHERE complaint_id = ?').get(id) as { c: number }).c;
  const result = db.prepare(`
    INSERT INTO containment_actions (complaint_id, action_number, action_description, location, responsible_person, target_date, qty_sorted, qty_rejected, qty_ok, evidence, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, count + 1, body.action_description, body.location || 'At Plant', body.responsible_person || '', body.target_date || '', body.qty_sorted || 0, body.qty_rejected || 0, body.qty_ok || 0, body.evidence || '', body.status || 'Planned');
  // Auto-update complaint status to Under Investigation if Open
  db.prepare(`UPDATE complaints SET status = 'Under Investigation', updated_at = datetime('now','localtime') WHERE id = ? AND status = 'Open'`).run(id);
  logTimeline(parseInt(id), 'D3_ACTION', `Containment action #${count + 1} added: ${body.action_description?.slice(0, 60)}`);
  const action = db.prepare('SELECT * FROM containment_actions WHERE id = ?').get(Number(result.lastInsertRowid));
  return NextResponse.json(action, { status: 201 });
}
