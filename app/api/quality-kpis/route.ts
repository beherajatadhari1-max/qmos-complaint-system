export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// ── Resolve company_id ────────────────────────────────────────────────────────
async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('qmos_session');
    if (session?.value) {
      const s = JSON.parse(session.value);
      if (s?.company_id) return s.company_id;
    }
  } catch { /* fall through */ }
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

// ── GET /api/quality-kpis ─────────────────────────────────────────────────────
// Returns aggregated quality KPIs derived from the complaints table.
// Used by: Customer Scorecard, Warranty dashboard, TQM dashboard, Management Review
export async function GET() {
  const companyId = await getCompanyId();
  if (!companyId) {
    return NextResponse.json({});
  }

  const { data: raw, error } = await supabaseAdmin
    .from('complaints')
    .select(`
      id, complaint_number, status, severity, complaint_type,
      customer_name, customer,
      part_name, part_number, defect_description, defect_category,
      quantity_affected, total_supplied,
      created_at, updated_at,
      warranty_claim_no, vehicle_number,
      rejection_stage, complaint_source
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[quality-kpis] Supabase error:', error);
    return NextResponse.json({});
  }

  const complaints = raw ?? [];
  const active = complaints.filter(c => !['Closed', 'Cancelled'].includes(c.status));

  // ── 1. Overview KPIs ──────────────────────────────────────────────────────
  const totalRej = complaints.reduce((s, c) => s + (c.quantity_affected ?? 0), 0);
  const totalSup = complaints.reduce((s, c) => s + (c.total_supplied ?? 0), 0);
  const ppm = totalSup > 0 ? Math.round((totalRej / totalSup) * 1_000_000) : 0;

  const overview = {
    total:      complaints.length,
    open:       active.length,
    closed:     complaints.filter(c => c.status === 'Closed').length,
    critical:   active.filter(c => c.severity === 'Critical').length,
    inProgress: active.filter(c =>
      ['Under Investigation', 'CAPA In Progress', 'Pending Verification'].includes(c.status)
    ).length,
    ppm,
    totalRejected: totalRej,
    totalSupplied: totalSup,
  };

  // ── 2. Per-Customer Breakdown ─────────────────────────────────────────────
  const custMap: Record<string, {
    name: string;
    total: number; open: number; critical: number;
    rejected: number; supplied: number;
  }> = {};

  for (const c of complaints) {
    const name = (c.customer_name || 'Unknown').trim();
    if (!custMap[name]) {
      custMap[name] = { name, total: 0, open: 0, critical: 0, rejected: 0, supplied: 0 };
    }
    custMap[name].total++;
    if (!['Closed', 'Cancelled'].includes(c.status)) custMap[name].open++;
    if (c.severity === 'Critical' && !['Closed', 'Cancelled'].includes(c.status)) custMap[name].critical++;
    custMap[name].rejected += c.quantity_affected ?? 0;
    custMap[name].supplied += c.total_supplied ?? 0;
  }

  const byCustomer = Object.values(custMap)
    .map(c => ({
      ...c,
      ppm: c.supplied > 0 ? Math.round((c.rejected / c.supplied) * 1_000_000) : null,
    }))
    .sort((a, b) => b.total - a.total);

  // ── 3. Warranty Items ─────────────────────────────────────────────────────
  const warrantyItems = complaints
    .filter(c =>
      c.warranty_claim_no ||
      (c.complaint_type ?? '').toLowerCase().includes('warranty') ||
      (c.complaint_source ?? '').toLowerCase().includes('warranty') ||
      (c.rejection_stage ?? '').toLowerCase().includes('warranty') ||
      (c.rejection_stage ?? '').toLowerCase().includes('field')
    )
    .slice(0, 20)
    .map(c => ({
      id:               c.id,
      complaint_number: c.complaint_number,
      customer:         c.customer_name ?? 'Unknown',
      part_name:        c.part_name ?? '',
      defect:           c.defect_description ?? '',
      severity:         c.severity ?? 'Medium',
      status:           c.status,
      warranty_claim_no: c.warranty_claim_no ?? '',
      vehicle_number:   c.vehicle_number ?? '',
      created_at:       c.created_at,
    }));

  // ── 4. Monthly Trend (last 8 months) ─────────────────────────────────────
  const monthMap: Record<string, { month: string; label: string; complaints: number; closed: number; ppm: number }> = {};
  const monthLabels: Record<string, string> = {
    '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
    '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'
  };

  for (const c of complaints) {
    const ym = (c.created_at ?? '').slice(0, 7); // YYYY-MM
    if (!ym) continue;
    if (!monthMap[ym]) {
      const [, mm] = ym.split('-');
      monthMap[ym] = { month: ym, label: monthLabels[mm] ?? mm, complaints: 0, closed: 0, ppm: 0 };
    }
    monthMap[ym].complaints++;
    if (c.status === 'Closed') monthMap[ym].closed++;
  }

  const monthlyTrend = Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-8);

  // ── 5. Defect Category Pareto ─────────────────────────────────────────────
  const catMap: Record<string, number> = {};
  for (const c of complaints) {
    const cat = c.defect_category ?? 'Uncategorised';
    catMap[cat] = (catMap[cat] ?? 0) + 1;
  }
  const categoryPareto = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── 6. By Severity ────────────────────────────────────────────────────────
  const sevMap: Record<string, number> = {};
  for (const c of active) {
    const s = c.severity ?? 'Unknown';
    sevMap[s] = (sevMap[s] ?? 0) + 1;
  }
  const bySeverity = Object.entries(sevMap).map(([severity, count]) => ({ severity, count }));

  // ── 7. Recent open complaints (priority sorted) ───────────────────────────
  const sevOrder: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
  const recentOpen = [...active]
    .sort((a, b) => {
      const so = (sevOrder[a.severity] ?? 5) - (sevOrder[b.severity] ?? 5);
      return so !== 0 ? so : (a.created_at ?? '').localeCompare(b.created_at ?? '');
    })
    .slice(0, 10)
    .map(c => ({
      id:               c.id,
      complaint_number: c.complaint_number,
      customer:         c.customer_name ?? 'Unknown',
      part_name:        c.part_name ?? '',
      severity:         c.severity,
      status:           c.status,
      created_at:       c.created_at,
    }));

  return NextResponse.json({
    overview,
    byCustomer,
    warrantyItems,
    monthlyTrend,
    categoryPareto,
    bySeverity,
    recentOpen,
    fetchedAt: new Date().toISOString(),
  });
}
