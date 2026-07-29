import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// ── Resolve company_id from session cookie ────────────────────
async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('qmos_session');
    if (sessionCookie?.value) {
      const session = JSON.parse(sessionCookie.value);
      if (session?.company_id) return session.company_id;
    }
  } catch {
    // fall through to hardcoded lookup
  }

  // Fallback: hardcoded lookup for BALESH001 (Phase 1 compatibility)
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

// ── GET — fetch all complaints for this company ───────────────
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

// ── POST — create a new complaint ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      customerName, customerContact, customerRef, complaintSource,
      partNumber, partName, defectDescription, defectCategory,
      quantityAffected, totalSupplied, batchNumber, severity,
      assignedTo, remarks, complaintType, vehicleNumber,
      warrantyClaimNo, prrNumber, responseDeadline, rejectionStage,
      complaintDate,
    } = body;

    if (!customerName || !defectDescription) {
      return NextResponse.json(
        { error: 'Customer name and defect description are required' },
        { status: 400 }
      );
    }

    // Generate complaint number: CC-YYYY-MM-NNNNN
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { count } = await supabaseAdmin
      .from('complaints')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .like('complaint_number', `CC-${ym}-%`);

    const complaintNumber = `CC-${ym}-${String((count ?? 0) + 1).padStart(5, '0')}`;

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        company_id:       companyId,
        complaint_number: complaintNumber,
        customer:         customerName,
        customer_name:    customerName,
        customer_contact: customerContact || '',
        customer_ref:     customerRef || '',
        source:           complaintSource || 'Email',
        complaint_source: complaintSource || 'Email',
        part_number:      partNumber || '',
        part_name:        partName || '',
        description:      defectDescription,
        defect_description: defectDescription,
        defect_category:  defectCategory || 'General',
        quantity_affected: quantityAffected || 0,
        total_supplied:   totalSupplied || 0,
        batch_number:     batchNumber || '',
        severity:         severity || 'Medium',
        priority:         severity || 'Medium',
        assigned_to:      assignedTo || '',
        remarks:          remarks || '',
        complaint_type:   complaintType || 'Customer Complaint',
        vehicle_number:   vehicleNumber || '',
        warranty_claim_no: warrantyClaimNo || '',
        prr_number:       prrNumber || '',
        response_deadline: responseDeadline || null,
        rejection_stage:  rejectionStage || '',
        status:           'Open',
        created_at:       complaintDate
          ? new Date(complaintDate).toISOString()
          : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log timeline
    await supabaseAdmin.from('complaint_timeline').insert({
      complaint_id: complaint.id,
      action:       `Complaint ${complaintNumber} created — Customer: ${customerName} | Severity: ${severity || 'Medium'}`,
      performed_by: 'System',
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
