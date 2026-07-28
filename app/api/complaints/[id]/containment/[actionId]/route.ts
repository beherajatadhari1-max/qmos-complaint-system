import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_FIELDS = [
  'action_description', 'location', 'responsible_person', 'target_date',
  'qty_sorted', 'qty_rejected', 'qty_ok', 'evidence', 'status',
  'completion_date', 'effectiveness',
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; actionId: string }> }) {
  const { id, actionId } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.includes(k)) updates[k] = v;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: action, error } = await supabaseAdmin
    .from('containment_actions')
    .update(updates)
    .eq('id', actionId)
    .eq('complaint_id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action: `Containment action updated — status: ${body.status ?? 'unchanged'}`,
    performed_by: 'User',
  });

  return NextResponse.json(action);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; actionId: string }> }) {
  const { id, actionId } = await params;

  // Fetch action number for log message before deleting
  const { data: action } = await supabaseAdmin
    .from('containment_actions')
    .select('action_number')
    .eq('id', actionId)
    .single();

  const { error } = await supabaseAdmin
    .from('containment_actions')
    .delete()
    .eq('id', actionId)
    .eq('complaint_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action: `Containment action #${action?.action_number ?? actionId} removed`,
    performed_by: 'User',
  });

  return NextResponse.json({ success: true });
}
