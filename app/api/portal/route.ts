import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Public read-only portal — no auth required
// Returns limited safe fields only (no internal notes, no assigned_to contact details)

const SAFE_FIELDS = [
  'id', 'complaint_number', 'customer', 'customer_name', 'customer_ref',
  'part_number', 'part_name', 'defect_description', 'defect_category',
  'severity', 'status', 'source', 'created_at', 'updated_at',
  'target_response_date', 'target_closure_date', 'actual_closure_date',
  'd3_containment', 'd8_congratulations',
  'approval_status',
].join(',');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const complaintNo = searchParams.get('complaint_number')?.trim();
    const customerName = searchParams.get('customer')?.trim();

    if (!complaintNo && !customerName) {
      return NextResponse.json({ error: 'Provide complaint_number or customer' }, { status: 400 });
    }

    // Get company (default to BALESH001 for Phase 1)
    const { data: company } = await supabaseAdmin
      .from('companies').select('id').eq('code', 'BALESH001').single();
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    let query = supabaseAdmin
      .from('complaints')
      .select(SAFE_FIELDS)
      .eq('company_id', company.id);

    if (complaintNo) {
      query = query.ilike('complaint_number', complaintNo);
    } else if (customerName) {
      query = query.ilike('customer_name', `%${customerName}%`);
    }

    const { data, error } = await query
      .not('status', 'eq', 'Cancelled')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}
