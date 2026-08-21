export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// PATCH — close or update a DWM task
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    const body = await req.json() as {
      status?: string;
      notes?: string;
      closed_by?: string;
      task_text?: string;
      frequency?: string;
      due_datetime?: string;
      dept_phone?: string;
    };

    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const vals: (string | number | null)[]  = [now];

    if (body.status !== undefined) {
      fields.push('status = ?');
      vals.push(body.status);
      if (body.status === 'closed') {
        fields.push('closed_at = ?', 'closed_by = ?');
        vals.push(now, body.closed_by ?? 'Quality Head');
      }
    }
    if (body.notes        !== undefined) { fields.push('notes = ?');        vals.push(body.notes); }
    if (body.task_text    !== undefined) { fields.push('task_text = ?');    vals.push(body.task_text); }
    if (body.frequency    !== undefined) { fields.push('frequency = ?');    vals.push(body.frequency); }
    if (body.due_datetime !== undefined) { fields.push('due_datetime = ?'); vals.push(body.due_datetime); }
    if (body.dept_phone   !== undefined) { fields.push('dept_phone = ?');   vals.push(body.dept_phone); }

    vals.push(id);
    db.prepare(`UPDATE dwm_tasks SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

    const updated = db.prepare('SELECT * FROM dwm_tasks WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    db.prepare('DELETE FROM dwm_tasks WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
