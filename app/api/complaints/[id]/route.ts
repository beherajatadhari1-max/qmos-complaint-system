import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED = [
  'status', 'assigned_to', 'remarks', 'target_response_date', 'target_closure_date',
  'actual_closure_date', 'customer_approval',
  'd1_team', 'd2_problem', 'd3_containment',
  'd4_root_cause', 'd4_escape_point', 'd4_why_made', 'd4_why_shipped',
  'd5_corrective_actions', 'd5_ca_why_made', 'd5_ca_why_shipped',
  'd6_implementation', 'd6_verification', 'd6_ca_owner', 'd6_ca_owner_phone',
  'd6_ca_owner_email', 'd6_target_date', 'd6_certified_build_date', 'd6_certified_part_id',
  'd7_prevention', 'd7_other_facilities',
  'd7_doc_dfmea', 'd7_doc_pfmea', 'd7_doc_control_plan', 'd7_doc_process_flow',
  'd7_doc_ods', 'd7_doc_drawing', 'd7_doc_other',
  'd8_congratulations',
];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('complaints').select('*').eq('id', id).single();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('complaints').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('complaints').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
