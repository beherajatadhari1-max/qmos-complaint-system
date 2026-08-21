export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { sendWhatsAppText } from '@/lib/whatsapp';

// POST — called by cron/scheduler; sends reminders for all open/overdue DWM tasks
export async function POST() {
  try {
    const db = getDB();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const today  = new Date().toISOString().slice(0, 10);

    // All open tasks from today AND older dates (carry-forward overdue)
    const openTasks = db.prepare(`
      SELECT * FROM dwm_tasks
      WHERE status = 'open'
      ORDER BY session_date ASC, department ASC
    `).all() as Array<{
      id: number;
      session_date: string;
      department: string;
      dept_phone: string;
      task_text: string;
      frequency: string;
      due_datetime: string;
      reminder_count: number;
    }>;

    let sent = 0;

    for (const t of openTasks) {
      if (!t.dept_phone) continue;

      const isOverdue = t.due_datetime && new Date(t.due_datetime) < new Date();
      const daysOld   = Math.floor((Date.now() - new Date(t.session_date).getTime()) / 86_400_000);

      const reminderNum = (t.reminder_count ?? 0) + 1;
      const urgency = reminderNum >= 3 ? '🚨' : reminderNum === 2 ? '⚠️' : '📋';
      const freqLabel = t.frequency === 'D' ? 'Daily' : t.frequency === 'W' ? 'Weekly' : 'Monthly';

      const msg =
        `${urgency} *QMOS DWM Reminder #${reminderNum}*\n\n` +
        `Department: *${t.department}*\n` +
        `Task: *${t.task_text}*\n` +
        `Frequency: ${freqLabel}\n` +
        (isOverdue ? `Status: ⏰ *OVERDUE* (${daysOld} day${daysOld !== 1 ? 's' : ''} old)\n` : '') +
        `\nPlease close this task in QMOS immediately.\n` +
        `🔗 ${appUrl}/tasks`;

      const ok = await sendWhatsAppText(t.dept_phone, msg);
      if (ok) {
        db.prepare(`
          UPDATE dwm_tasks
          SET reminder_count = reminder_count + 1,
              last_reminded_at = ?,
              updated_at = ?
          WHERE id = ?
        `).run(new Date().toISOString(), new Date().toISOString(), t.id);
        sent++;
      }
    }

    return NextResponse.json({
      ok: true,
      date: today,
      totalOpen: openTasks.length,
      remindersSent: sent,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
