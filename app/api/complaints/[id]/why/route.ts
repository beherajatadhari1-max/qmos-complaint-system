import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = getDB().prepare('SELECT * FROM why_analysis WHERE complaint_id = ? ORDER BY why_type, why_number').all(id);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // body: { occurrence: [...], escape: [...] }  OR  legacy flat array
  const body = await req.json();
  const db = getDB();

  db.prepare('DELETE FROM why_analysis WHERE complaint_id = ?').run(id);
  const insert = db.prepare('INSERT INTO why_analysis (complaint_id, why_number, why_type, why_question, why_answer) VALUES (?, ?, ?, ?, ?)');

  let occurrenceRows: { why_number: number; why_question: string; why_answer: string }[] = [];
  let escapeRows: { why_number: number; why_question: string; why_answer: string }[] = [];

  if (Array.isArray(body)) {
    // Legacy flat array — treat as occurrence
    occurrenceRows = body;
  } else {
    occurrenceRows = body.occurrence || [];
    escapeRows = body.escape || [];
  }

  for (const row of occurrenceRows) {
    insert.run(id, row.why_number, 'occurrence', row.why_question || '', row.why_answer || '');
  }
  for (const row of escapeRows) {
    insert.run(id, row.why_number, 'escape', row.why_question || '', row.why_answer || '');
  }

  // Build summary text for d4_why_made and d4_why_shipped columns
  const madeSummary = occurrenceRows
    .map((r) => `Why ${r.why_number}: ${r.why_answer}`)
    .filter(s => !s.endsWith(': '))
    .join('\n');
  const shippedSummary = escapeRows
    .map((r) => `Why ${r.why_number}: ${r.why_answer}`)
    .filter(s => !s.endsWith(': '))
    .join('\n');

  if (madeSummary) db.prepare(`UPDATE complaints SET d4_why_made = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(madeSummary, id);
  if (shippedSummary) db.prepare(`UPDATE complaints SET d4_why_shipped = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(shippedSummary, id);

  return NextResponse.json({ success: true });
}
