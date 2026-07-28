import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    const db = getDB();
    const rows = processId
      ? db.prepare('SELECT * FROM activity_logs WHERE process_id = ? ORDER BY log_date DESC, id DESC').all(processId)
      : db.prepare('SELECT * FROM activity_logs ORDER BY log_date DESC, id DESC').all();
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { processId, processLabel, activityStep, logDate, owner, status, remarks, evidence } = body;
    if (!processId || !processLabel) {
      return NextResponse.json({ error: 'processId and processLabel required' }, { status: 400 });
    }
    const db = getDB();
    const result = db.prepare(`
      INSERT INTO activity_logs (process_id, process_label, activity_step, log_date, owner, status, remarks, evidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      processId, processLabel, activityStep || '', logDate || '', owner || '', status || 'Done', remarks || '', evidence || ''
    );
    const row = db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save activity log' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = getDB();
    db.prepare('DELETE FROM activity_logs WHERE id = ?').run(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
