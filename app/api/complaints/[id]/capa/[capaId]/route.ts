import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; capaId: string }> }) {
  const { id, capaId } = await params;
  const body = await req.json();
  const db = getDB();
  const allowed = ['action_type','action_description','document_to_update','responsible_person','target_date','completion_date','status','evidence_description','verification_method','verification_date','effectiveness_result'];
  const updates = Object.entries(body).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  const sql = updates.map(([k]) => `${k} = ?`).join(', ');
  const values = updates.map(([,v]) => v as string | number | null);
  db.prepare(`UPDATE capa_actions SET ${sql} WHERE id = ? AND complaint_id = ?`).run(...values, capaId, id);
  logTimeline(parseInt(id), 'CAPA_UPDATE', `CAPA action #${capaId} updated — status: ${body.status || 'unchanged'}`);
  return NextResponse.json(db.prepare('SELECT * FROM capa_actions WHERE id = ?').get(capaId));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; capaId: string }> }) {
  const { id, capaId } = await params;
  const db = getDB();
  db.prepare('DELETE FROM capa_actions WHERE id = ? AND complaint_id = ?').run(capaId, id);
  logTimeline(parseInt(id), 'CAPA_DELETE', `CAPA action #${capaId} removed`);
  return NextResponse.json({ success: true });
}
