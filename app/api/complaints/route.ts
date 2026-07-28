import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ── Helper: get company_id for current session ─────────────────────────────
// Phase 1: hardcoded to Balesh's company. Phase 2: tied to session cookie.
async function getCompanyId(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('code', 'BALESH001')
    .single();
  return data?.id ?? null;
}

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 500 });

    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(complaints ?? []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, partNumber, partName, defectDescription, quantityAffected, severity,
      customerContact, customerRef, complaintSource, complaintDate, complaintType,
      defectCategory, totalSupplied, batchNumber, assignedTo, remarks,
      vehicleNumber, warrantyClaimNo, prrNumber, responseDeadline, rejectionStage,
    } = body;

    if (!customerName || !defectDescription) {
      return NextResponse.json(
        { error: 'Customer name and defect description are required' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 500 });

    // Generate complaint number: CC-YYYY-MM-NNNNN
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { count } = await supabaseAdmin
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .like('complaint_number', `CC-${ym}-%`);
    const complaintNumber = `CC-${ym}-${String((count ?? 0) + 1).padStart(5, '0')}`;

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        company_id: companyId,
        complaint_number: complaintNumber,
        title: `${customerName} — ${defectDescription.slice(0, 60)}`,
        description: defectDescription,
        customer: customerName,
        customer_name: customerName,
        customer_contact: customerContact ?? '',
        customer_ref: customerRef ?? '',
        complaint_source: complaintSource ?? 'Email',
        source: complaintSource ?? 'Email',
        part_number: partNumber ?? '',
        part_name: partName ?? '',
        defect_description: defectDescription,
        defect_category: defectCategory ?? 'General',
        quantity_affected: quantityAffected ?? 0,
        total_supplied: totalSupplied ?? 0,
        batch_number: batchNumber ?? '',
        severity: severity ?? 'Medium',
        priority: severity ?? 'Medium',
        status: 'Open',
        assigned_to: assignedTo ?? '',
        remarks: remarks ?? '',
        complaint_type: complaintType ?? 'Customer Complaint',
        vehicle_number: vehicleNumber ?? '',
        warranty_claim_no: warrantyClaimNo ?? '',
        prr_number: prrNumber ?? '',
        response_deadline: responseDeadline ?? '',
        rejection_stage: rejectionStage ?? '',
        created_at: complaintDate
          ? `${complaintDate}T00:00:00+00:00`
          : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log timeline entry
    await supabaseAdmin.from('complaint_timeline').insert({
      complaint_id: complaint.id,
      company_id: companyId,
      action: `Complaint ${complaintNumber} created — Customer: ${customerName} | Severity: ${severity ?? 'Medium'}`,
      performed_by: 'User',
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
