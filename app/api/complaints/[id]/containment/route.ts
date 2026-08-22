export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('containment_actions')
    .select('*')
    .eq('complaint_id', id)
    .order('action_number', { ascending: true });
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Get current count for action_number
  const { count } = await supabaseAdmin
    .from('containment_actions')
    .select('id', { count: 'exact', head: true })
    .eq('complaint_id', id);

  const actionNumber = (count ?? 0) + 1;

  const { data: action, error } = await supabaseAdmin
    .from('containment_actions')
    .insert({
      complaint_id:       id,
      action_number:      actionNumber,
      action:             body.action_description,
      action_description: body.action_description,
      location:           body.location || 'At Plant',
      responsible_person: body.responsible_person || '',
      target_date:        body.target_date || null,
      qty_sorted:         body.qty_sorted || 0,
      qty_rejected:       body.qty_rejected || 0,
      qty_ok:             body.qty_ok || 0,
      evidence:           body.evidence || '',
      status:             body.status || 'Planned',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-update complaint status to Under Investigation if still Open
  await supabaseAdmin
    .from('complaints')
    .update({ status: 'Under Investigation', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'Open');

  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action:       `Containment action #${actionNumber} added: ${String(body.action_description ?? '').slice(0, 60)}`,
    performed_by: 'User',
  });

  return NextResponse.json(action, { status: 201 });
}
