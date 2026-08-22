export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('why_analysis')
    .select('*')
    .eq('complaint_id', id)
    .order('why_type', { ascending: true })
    .order('why_number', { ascending: true });
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Delete existing analysis for this complaint
  await supabaseAdmin.from('why_analysis').delete().eq('complaint_id', id);

  let occurrenceRows: { why_number: number; why_question: string; why_answer: string }[] = [];
  let escapeRows:     { why_number: number; why_question: string; why_answer: string }[] = [];

  if (Array.isArray(body)) {
    occurrenceRows = body; // legacy flat array
  } else {
    occurrenceRows = body.occurrence ?? [];
    escapeRows     = body.escape ?? [];
  }

  const rows = [
    ...occurrenceRows.map(r => ({
      complaint_id:  id,
      why_number:    r.why_number,
      why_type:      'occurrence',
      why_question:  r.why_question || '',
      why_answer:    r.why_answer || '',
    })),
    ...escapeRows.map(r => ({
      complaint_id:  id,
      why_number:    r.why_number,
      why_type:      'escape',
      why_question:  r.why_question || '',
      why_answer:    r.why_answer || '',
    })),
  ];

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from('why_analysis').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update complaint d4 summary columns
  const madeSummary = occurrenceRows
    .map(r => `Why ${r.why_number}: ${r.why_answer}`)
    .filter(s => !s.endsWith(': '))
    .join('\n');

  const shippedSummary = escapeRows
    .map(r => `Why ${r.why_number}: ${r.why_answer}`)
    .filter(s => !s.endsWith(': '))
    .join('\n');

  const complaintUpdate: Record<string, string> = { updated_at: new Date().toISOString() };
  if (madeSummary)    complaintUpdate.d4_why_made    = madeSummary;
  if (shippedSummary) complaintUpdate.d4_why_shipped = shippedSummary;

  await supabaseAdmin.from('complaints').update(complaintUpdate).eq('id', id);

  return NextResponse.json({ success: true });
}
