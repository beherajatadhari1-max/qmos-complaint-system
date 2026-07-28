import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generate8D } from '@/lib/generate8D';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: complaint, error: fetchError } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const report = generate8D({
      customerName: complaint.customer_name ?? complaint.customer ?? '',
      partNumber: complaint.part_number ?? '',
      partName: complaint.part_name ?? '',
      defectDescription: complaint.defect_description ?? complaint.description ?? '',
      quantityAffected: complaint.quantity_affected ?? 0,
      severity: complaint.severity ?? complaint.priority ?? 'Medium',
      assignedTo: complaint.assigned_to ?? '',
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('complaints')
      .update({
        d1_team: report.d1,
        d2_problem: report.d2,
        d3_containment: report.d3,
        d4_root_cause: report.d4,
        d4_why_made: report.d4_why_made,
        d4_why_shipped: report.d4_why_shipped,
        d5_corrective_actions: report.d5,
        d5_ca_why_made: report.d5_ca_why_made,
        d5_ca_why_shipped: report.d5_ca_why_shipped,
        d6_implementation: report.d6,
        d7_prevention: report.d7,
        d8_congratulations: report.d8,
        report_generated: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabaseAdmin.from('complaint_timeline').insert({
      complaint_id: id,
      action: '8D report auto-generated — all D1–D8 sections populated',
      performed_by: 'System',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate 8D report' }, { status: 500 });
  }
}
