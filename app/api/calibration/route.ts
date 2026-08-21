import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

interface CalibrationItem {
  id: string;
  instrument_id: string;
  name: string;
  department: string;
  next_due: string | null;
  calibration_status: string;
  [key: string]: unknown;
}

async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const c = cookieStore.get('qmos_session');
    if (c?.value) {
      const s = JSON.parse(c.value);
      if (s?.company_id) return s.company_id;
    }
  } catch { /* ignore */ }
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

// ── Derive calibration status from dates ──────────────────────────────────────
function deriveStatus(nextDue: string | null, currentStatus: string): string {
  if (!nextDue) return currentStatus;
  if (['Inactive','Scrapped','Out of Scope','Not Required'].includes(currentStatus)) return currentStatus;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(nextDue);
  const daysLeft = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft < 0)   return 'Overdue';
  if (daysLeft <= 30) return 'Due Soon';
  return 'Calibrated';
}

// ── GET — list all equipment ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const url    = new URL(req.url);
    const status = url.searchParams.get('status'); // filter

    const { data, error } = await supabaseAdmin
      .from('calibration_equipment')
      .select('*')
      .eq('company_id', companyId)
      .order('next_due', { ascending: true });

    if (error) throw error;

    // Enrich each record with live status
    const enriched: CalibrationItem[] = (data ?? []).map((e: CalibrationItem) => ({
      ...e,
      calibration_status: deriveStatus(e.next_due, e.calibration_status),
    }));

    // Filter by status if requested
    const filtered = status && status !== 'all'
      ? enriched.filter((e: { calibration_status: string }) => e.calibration_status.toLowerCase() === status.toLowerCase())
      : enriched;

    // Summary counts
    const summary = {
      total:       enriched.length,
      calibrated:  enriched.filter((e: { calibration_status: string }) => e.calibration_status === 'Calibrated').length,
      dueSoon:     enriched.filter((e: { calibration_status: string }) => e.calibration_status === 'Due Soon').length,
      overdue:     enriched.filter((e: { calibration_status: string }) => e.calibration_status === 'Overdue').length,
      inCal:       enriched.filter((e: { calibration_status: string }) => e.calibration_status === 'In Calibration').length,
      notRequired: enriched.filter((e: { calibration_status: string }) => ['Not Required','Out of Scope','Inactive','Scrapped'].includes(e.calibration_status)).length,
    };

    // Overdue list for alerts
    const overdueitems = enriched
      .filter(e => e.calibration_status === 'Overdue' && e.next_due)
      .map(e => ({
        instrument_id: e.instrument_id,
        name: e.name,
        department: e.department,
        next_due: e.next_due as string,
        days_overdue: Math.floor((Date.now() - new Date(e.next_due as string).getTime()) / 86_400_000),
      }))
      .sort((a, b) => b.days_overdue - a.days_overdue);

    return NextResponse.json({ equipment: filtered, summary, overdueItems: overdueitems });
  } catch (err) {
    console.error('[calibration GET]', err);
    return NextResponse.json({ error: 'Failed to fetch calibration data' }, { status: 500 });
  }
}

// ── POST — register new equipment ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const {
      instrument_id, name, type, make, model, serial_number,
      range_min, range_max, unit, accuracy, location, department,
      custodian, frequency_months, last_calibrated, next_due,
      calibrated_by, calibration_source, certificate_number, status,
    } = body;

    if (!instrument_id || !name) {
      return NextResponse.json({ error: 'instrument_id and name are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('calibration_equipment')
      .insert({
        company_id: companyId,
        instrument_id, name, type, make, model, serial_number,
        range_min: range_min || null,
        range_max: range_max || null,
        unit, accuracy, location, department, custodian,
        frequency_months: frequency_months || 12,
        last_calibrated: last_calibrated || null,
        next_due: next_due || null,
        calibrated_by, calibration_source, certificate_number,
        status: status || 'Active',
        calibration_status: 'Calibrated',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ equipment: data }, { status: 201 });
  } catch (err) {
    console.error('[calibration POST]', err);
    return NextResponse.json({ error: 'Failed to register equipment' }, { status: 500 });
  }
}
