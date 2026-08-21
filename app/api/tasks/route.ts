import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

function addHours(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function nextTaskNumber(db: ReturnType<typeof getDB>): string {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get() as { cnt: number };
  return `T-${String((row.cnt ?? 0) + 1).padStart(3, '0')}`;
}

// ── GET — list all tasks ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const status   = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignee = searchParams.get('assigned_to');

    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: (string | number)[] = [];

    if (status)   { sql += ' AND status = ?';      params.push(status); }
    if (priority) { sql += ' AND priority = ?';    params.push(priority); }
    if (assignee) { sql += ' AND assigned_to LIKE ?'; params.push(`%${assignee}%`); }

    sql += ' ORDER BY created_at DESC';

    const tasks = db.prepare(sql).all(...params);
    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[tasks GET]', err);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// ── POST — create a task ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const db   = getDB();
    const body = await req.json();

    const {
      title, description = '', source = 'internal', source_ref = '',
      priority = 'medium', assigned_to = '', assigned_phone = '',
      raised_by = '', target_date = '', reminder_hours = 24,
      linked_id = '', linked_module = '', notes = '',
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task_number    = nextTaskNumber(db);
    const next_reminder  = assigned_phone ? addHours(Number(reminder_hours)) : '';

    const result = db.prepare(`
      INSERT INTO tasks
        (task_number, title, description, source, source_ref, priority, status,
         assigned_to, assigned_phone, raised_by, target_date,
         reminder_hours, next_reminder_at, linked_id, linked_module, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      task_number, title.trim(), description, source, source_ref,
      priority, 'todo',
      assigned_to, assigned_phone.replace(/\D/g, ''), // strip non-digits
      raised_by, target_date,
      Number(reminder_hours), next_reminder,
      linked_id, linked_module, notes,
    );

    const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[tasks POST]', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
