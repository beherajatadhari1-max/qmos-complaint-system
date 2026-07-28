import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_FIELDS = [
  'action_type', 'type', 'action_description', 'action',
  'document_to_update', 'responsible_person', 'responsible',
  'target_date', 'completion_date', 'status',
  'evidence_description', 'verification_method', 'verification_date',
  'effectiveness_result',
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; capaId: string }> }) {
  const { id, capaId } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.includes(k)) updates[k] = v;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: action, error } = await supabaseAdmin
    .from('capa_actions')
    .update(updates)
    .eq('id', capaId)
    .eq('complaint_id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action: `CAPA action updated — status: ${body.status ?? 'unchanged'}`,
    performed_by: 'User',
  });

  return NextResponse.json(action);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; capaId: string }> }) {
  const { id, capaId } = await params;

  // Fetch action number for log message before deleting
  const { data: action } = await supabaseAdmin
    .from('capa_actions')
    .select('action_number')
    .eq('id', capaId)
    .single();

  const { error } = await supabaseAdmin
    .from('capa_actions')
    .delete()
    .eq('id', capaId)
    .eq('complaint_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action: `CAPA action #${action?.action_number ?? capaId} removed`,
    performed_by: 'User',
  });

  return NextResponse.json({ success: true });
}
