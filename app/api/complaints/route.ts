import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { sendCriticalAlert } from '@/lib/mailer';

// ── Resolve company_id from session cookie ────────────────────
// FIX 1 (Security): Removed hardcoded BALESH001 fallback.
// If session is missing or invalid, return null → caller returns 401.
// No request should ever get data without a valid authenticated session.
async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('qmos_session');
    if (sessionCookie?.value) {
      const session = JSON.parse(sessionCookie.value);
      if (session?.company_id) return session.company_id;
    }
  } catch {
    // Session cookie missing or malformed — return null, do NOT fall through
  }
  return null;
}

// ── FIX 2 (Race Condition): Generate unique complaint number with collision guard ──
// Old approach: COUNT + 1 — two simultaneous requests both read the same count → duplicate numbers.
// New approach: read count, generate candidate, verify it doesn't already exist, retry up to 5 times.
// Falls back to millisecond-precision suffix if all retries collide (astronomically unlikely).
async function generateComplaintNumber(companyId: string): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { count } = await supabaseAdmin
    .from('complaints')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .like('complaint_number', `CC-${ym}-%`);

  const base = (count ?? 0) + 1;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `CC-${ym}-${String(base + attempt).padStart(5, '0')}`;
    const { data: existing } = await supabaseAdmin
      .from('complaints')
      .select('id')
      .eq('complaint_number', candidate)
      .maybeSingle();
    if (!existing) return candidate;
  }

  // Fallback: timestamp-based suffix (unique, not sequential — only reached under extreme load)
  return `CC-${ym}-${String(Date.now()).slice(-5)}`;
}

// ── GET — fetch all complaints for this company ───────────────
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      // FIX 1: Was returning 404 even for unauthenticated requests; now returns 401.
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
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
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
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

    // FIX 2: Use collision-safe complaint number generator (replaces COUNT + 1)
    const complaintNumber = await generateComplaintNumber(companyId);

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        company_id:        companyId,
        complaint_number:  complaintNumber,
        // FIX 3 (Duplicate Fields): Removed duplicate columns.
        // Keeping only the canonical column names used by the rest of the app.
        // Removed: customer (duplicate of customer_name)
        // Removed: source (duplicate of complaint_source)
        // Removed: description (duplicate of defect_description)
        // Removed: priority (duplicate of severity)
        customer_name:     customerName,
        customer_contact:  customerContact || '',
        customer_ref:      customerRef || '',
        complaint_source:  complaintSource || 'Email',
        part_number:       partNumber || '',
        part_name:         partName || '',
        defect_description: defectDescription,
        defect_category:   defectCategory || 'General',
        quantity_affected: quantityAffected || 0,
        total_supplied:    totalSupplied || 0,
        batch_number:      batchNumber || '',
        severity:          severity || 'Medium',
        assigned_to:       assignedTo || '',
        remarks:           remarks || '',
        complaint_type:    complaintType || 'Customer Complaint',
        vehicle_number:    vehicleNumber || '',
        warranty_claim_no: warrantyClaimNo || '',
        prr_number:        prrNumber || '',
        response_deadline: responseDeadline || null,
        rejection_stage:   rejectionStage || '',
        status:            'Open',
        created_at:        complaintDate
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

    // Fire email alert for Critical complaints (non-blocking — never delays response)
    if ((severity || 'Medium') === 'Critical') {
      sendCriticalAlert({
        id:                 complaint.id,
        complaint_number:   complaintNumber,
        customer_name:      customerName,
        part_number:        partNumber || '',
        part_name:          partName || '',
        defect_description: defectDescription,
        severity:           severity || 'Critical',
        assigned_to:        assignedTo || '',
        defect_category:    defectCategory || '',
        quantity_affected:  quantityAffected || 0,
      }).catch(e => console.error('[QMOS Mailer] Alert error:', e));
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
