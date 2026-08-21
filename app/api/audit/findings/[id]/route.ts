export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    const body = await req.json() as {
      finding_type?: string; finding_notes?: string; evidence?: string;
      capa_ref?: string; status?: string;
    };
    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const vals: (string | number | null)[] = [now];

    if (body.finding_type  !== undefined) { fields.push('finding_type = ?');  vals.push(body.finding_type); }
    if (body.finding_notes !== undefined) { fields.push('finding_notes = ?'); vals.push(body.finding_notes); }
    if (body.evidence      !== undefined) { fields.push('evidence = ?');      vals.push(body.evidence); }
    if (body.capa_ref      !== undefined) { fields.push('capa_ref = ?');      vals.push(body.capa_ref); }
    if (body.status        !== undefined) {
      fields.push('status = ?');
      vals.push(body.status);
      if (body.status === 'Closed') { fields.push('closed_at = ?'); vals.push(now); }
    }

    vals.push(id);
    db.prepare(`UPDATE audit_findings SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    db.prepare('DELETE FROM audit_findings WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
