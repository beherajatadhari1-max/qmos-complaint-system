export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// ── GET — tasks overdue for WhatsApp reminder ─────────────────────────────────
// Returns tasks where:
//   • status is NOT done / cancelled
//   • next_reminder_at is set AND <= now
export async function GET() {
  try {
    const db  = getDB();
    const now = new Date().toISOString();

    const reminders = db.prepare(`
      SELECT * FROM tasks
      WHERE status NOT IN ('done','cancelled')
        AND next_reminder_at != ''
        AND next_reminder_at <= ?
      ORDER BY next_reminder_at ASC
    `).all(now);

    return NextResponse.json(reminders);
  } catch (err) {
    console.error('[tasks/reminders GET]', err);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}
