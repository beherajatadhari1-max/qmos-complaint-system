export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    const plan = db.prepare('SELECT * FROM audit_plans WHERE id = ?').get(id);
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const findings = db.prepare('SELECT * FROM audit_findings WHERE plan_id = ? ORDER BY id ASC').all(id);
    return NextResponse.json({ plan, findings });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    const body = await req.json() as {
      status?: string; title?: string; department?: string;
      auditor_name?: string; audit_date?: string; notes?: string;
    };
    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const vals: (string | number | null)[] = [now];

    if (body.status       !== undefined) { fields.push('status = ?');       vals.push(body.status); }
    if (body.title        !== undefined) { fields.push('title = ?');        vals.push(body.title); }
    if (body.department   !== undefined) { fields.push('department = ?');   vals.push(body.department); }
    if (body.auditor_name !== undefined) { fields.push('auditor_name = ?'); vals.push(body.auditor_name); }
    if (body.audit_date   !== undefined) { fields.push('audit_date = ?');   vals.push(body.audit_date); }
    if (body.notes        !== undefined) { fields.push('notes = ?');        vals.push(body.notes); }

    vals.push(id);
    db.prepare(`UPDATE audit_plans SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    db.prepare('DELETE FROM audit_plans WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
