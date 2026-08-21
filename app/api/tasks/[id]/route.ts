export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

function addHours(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

// ── PATCH — update task (status, close, remind, edit) ────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db   = getDB();
    const { id } = await params;
    const body = await req.json();

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id)) as Record<string, unknown> | undefined;
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const updates: string[] = [];
    const values: (string | number)[] = [];

    // Fields that can be updated
    const allowed = [
      'title', 'description', 'source', 'source_ref', 'priority',
      'assigned_to', 'assigned_phone', 'target_date', 'notes',
      'linked_id', 'linked_module', 'reminder_hours',
    ];
    for (const field of allowed) {
      if (field in body) {
        updates.push(`${field} = ?`);
        values.push(field === 'assigned_phone'
          ? String(body[field]).replace(/\D/g, '')
          : body[field] as string | number);
      }
    }

    // Status change
    if ('status' in body) {
      const newStatus = body.status as string;
      updates.push('status = ?');
      values.push(newStatus);

      if (newStatus === 'done' || newStatus === 'cancelled') {
        updates.push('completed_date = ?', 'next_reminder_at = ?');
        values.push(new Date().toISOString().split('T')[0], '');
      }
    }

    // "Reminded" action — advance next_reminder_at
    if (body.action === 'reminded') {
      const hours = Number(existing.reminder_hours ?? 24);
      updates.push('last_reminded_at = ?', 'next_reminder_at = ?');
      values.push(new Date().toISOString(), addHours(hours));
    }

    // Reminder hours change — recalculate next_reminder_at if task still open
    if ('reminder_hours' in body && !('action' in body)) {
      const status = (existing.status as string) ?? 'todo';
      if (status !== 'done' && status !== 'cancelled') {
        updates.push('next_reminder_at = ?');
        values.push(addHours(Number(body.reminder_hours)));
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(Number(id));

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id));
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[tasks PATCH]', err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// ── DELETE — remove a task ────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDB();
    const { id } = await params;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[tasks DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
