export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('capa_actions')
    .select('*')
    .eq('complaint_id', id)
    .order('action_number', { ascending: true });
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { count } = await supabaseAdmin
    .from('capa_actions')
    .select('id', { count: 'exact', head: true })
    .eq('complaint_id', id);

  const actionNumber = (count ?? 0) + 1;

  const { data: action, error } = await supabaseAdmin
    .from('capa_actions')
    .insert({
      complaint_id:        id,
      action_number:       actionNumber,
      type:                body.action_type || 'Corrective',
      action_type:         body.action_type || 'Corrective',
      action:              body.action_description,
      action_description:  body.action_description,
      document_to_update:  body.document_to_update || '',
      responsible:         body.responsible_person || '',
      responsible_person:  body.responsible_person || '',
      target_date:         body.target_date || null,
      verification_method: body.verification_method || '',
      status:              'Planned',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-update complaint status to CAPA In Progress
  await supabaseAdmin
    .from('complaints')
    .update({ status: 'CAPA In Progress', updated_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['Open', 'Under Investigation']);

  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action:       `CAPA action #${actionNumber} added: ${String(body.action_description ?? '').slice(0, 60)}`,
    performed_by: 'User',
  });

  return NextResponse.json(action, { status: 201 });
}
