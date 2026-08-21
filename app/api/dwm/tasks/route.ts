import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { sendWhatsAppText } from '@/lib/whatsapp';

// GET — list DWM tasks (optionally filter by date or status)
export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const date   = searchParams.get('date');
    const status = searchParams.get('status');

    let sql = 'SELECT * FROM dwm_tasks WHERE 1=1';
    const params: string[] = [];

    if (date)   { sql += ' AND session_date = ?';  params.push(date); }
    if (status) { sql += ' AND status = ?';         params.push(status); }

    sql += ' ORDER BY department, id ASC';

    const tasks = db.prepare(sql).all(...params);
    return NextResponse.json(tasks);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST — bulk create tasks after whiteboard scan confirmation
export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const body = await req.json() as {
      sessionId: number;
      sessionDate: string;
      tasks: Array<{
        department: string;
        dept_code: string;
        dept_phone: string;
        task_text: string;
        frequency: string;
        due_datetime: string;
      }>;
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const created: unknown[] = [];

    const stmt = db.prepare(`
      INSERT INTO dwm_tasks
        (session_id, session_date, department, dept_code, dept_phone, task_text, frequency, due_datetime, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `);

    for (const t of body.tasks) {
      const r = stmt.run(
        body.sessionId,
        body.sessionDate,
        t.department,
        t.dept_code,
        t.dept_phone ?? '',
        t.task_text,
        t.frequency,
        t.due_datetime ?? '',
      );
      created.push({ id: r.lastInsertRowid, ...t });

      // Send WhatsApp notification if phone provided
      if (t.dept_phone) {
        const freqLabel = t.frequency === 'D' ? 'Daily' : t.frequency === 'W' ? 'Weekly' : 'Monthly';
        const msg =
          `📋 *QMOS Morning Review Task*\n\n` +
          `Department: *${t.department}*\n` +
          `Task: *${t.task_text}*\n` +
          `Frequency: ${freqLabel}\n` +
          `Due: ${t.due_datetime || 'Today EOD'}\n\n` +
          `Please close this task in QMOS once complete.\n` +
          `🔗 ${appUrl}/tasks`;
        sendWhatsAppText(t.dept_phone, msg).catch(console.error);
      }
    }

    return NextResponse.json({ created: created.length, tasks: created });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
