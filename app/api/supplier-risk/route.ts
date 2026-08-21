import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const c = cookieStore.get('qmos_session');
    if (c?.value) {
      const s = JSON.parse(c.value);
      if (s?.company_id) return s.company_id;
    }
  } catch { /* fall through */ }
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

// ── Risk tier calculator ──────────────────────────────────────────────────────
function calcTier(
  openCount: number,
  criticalCount: number,
  ppm: number,
  closureRate: number,
): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (criticalCount >= 2 || (openCount >= 3 && ppm > 5000)) return 'Critical';
  if (criticalCount >= 1 || openCount >= 2 || ppm > 2000 || closureRate < 40) return 'High';
  if (openCount >= 1 || ppm > 500 || closureRate < 70) return 'Medium';
  return 'Low';
}

// ── AI narrative (rule-based NLG) ─────────────────────────────────────────────
function buildNarrative(
  name: string,
  tier: 'Critical' | 'High' | 'Medium' | 'Low',
  openCount: number,
  criticalCount: number,
  ppm: number,
  closureRate: number,
  oldestOpenDays: number,
  repeatDefects: boolean,
  topDefect: string,
): string {
  const shortName = name.split(' ')[0];

  if (tier === 'Critical') {
    return `${shortName} is in CRITICAL risk zone — ${criticalCount} unresolved critical NCR${criticalCount > 1 ? 's' : ''} and ${openCount} total open. PPM at ${ppm.toLocaleString()} far exceeds the 500 PPM target. Immediate SQE intervention required. Issue SCAR, initiate supplier containment audit, and escalate to Supplier Quality Head. Consider temporary dual-sourcing if response is inadequate within 48 hours.`;
  }
  if (tier === 'High') {
    const repeatPart = repeatDefects ? ' Repeat defects detected — supplier systemic root cause action mandatory.' : '';
    const agePart = oldestOpenDays > 30 ? ` Oldest NCR is ${oldestOpenDays} days old — SCAR response overdue.` : '';
    return `${shortName} requires urgent supplier quality intervention — ${openCount} open NCR${openCount > 1 ? 's' : ''}${criticalCount > 0 ? `, including ${criticalCount} critical` : ''}. Closure rate at ${closureRate}% indicates follow-up gaps.${agePart}${repeatPart} Schedule supplier audit and verify SCAR effectiveness within 2 weeks.`;
  }
  if (tier === 'Medium') {
    const defectPart = topDefect ? ` Primary issue: ${topDefect}.` : '';
    return `${shortName} is under monitoring. ${openCount} NCR${openCount !== 1 ? 's' : ''} open with ${closureRate}% closure rate.${defectPart} ${ppm > 0 ? `PPM: ${ppm.toLocaleString()}.` : ''} Ensure SCAR responses are verified effective. Discuss in next monthly supplier review.`;
  }
  return `${shortName} performance is within acceptable limits. ${openCount === 0 ? 'No open NCRs.' : `${openCount} minor NCR${openCount > 1 ? 's' : ''} under control.`} Maintain incoming inspection frequency and continue periodic supplier assessments.`;
}

// ── Supplier category detection ───────────────────────────────────────────────
function isSupplierComplaint(c: { complaint_type?: string; defect_category?: string; source?: string; complaint_source?: string }): boolean {
  const type = (c.complaint_type ?? '').toLowerCase();
  const cat  = (c.defect_category ?? '').toLowerCase();
  const src  = (c.complaint_source ?? '').toLowerCase();
  return type.includes('supplier') || type.includes('incoming') || type.includes('scar') ||
    cat.includes('material') || cat.includes('incoming') || cat.includes('supplier') || cat.includes('raw') ||
    src.includes('supplier') || src.includes('incoming');
}

// ── GET /api/supplier-risk ────────────────────────────────────────────────────
export async function GET() {
  const companyId = await getCompanyId();

  const { data: allComplaints } = await supabaseAdmin
    .from('complaints')
    .select('id, status, severity, quantity_affected, total_supplied, created_at, customer_name, customer, defect_category, complaint_type, source, complaint_source')
    .eq('company_id', companyId ?? '');

  const complaints = allComplaints ?? [];

  // Filter to supplier-related complaints only
  const supplierComplaints = complaints.filter(isSupplierComplaint);

  // ── Aggregate per supplier (supplier name comes from customer_name field) ───
  const supplierMap: Record<string, {
    name: string;
    complaints: typeof complaints;
  }> = {};

  for (const c of supplierComplaints) {
    const name = c.customer_name ?? 'Unknown Supplier';
    if (!supplierMap[name]) supplierMap[name] = { name, complaints: [] };
    supplierMap[name].complaints.push(c);
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Build 6-month sparkline keys
  const sparkKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    sparkKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const suppliers = Object.values(supplierMap).map(({ name, complaints: sc }) => {
    const open   = sc.filter(c => !['Closed','Cancelled'].includes(c.status ?? '')).length;
    const closed = sc.filter(c => c.status === 'Closed').length;
    const critical = sc.filter(c => c.severity === 'Critical' && !['Closed','Cancelled'].includes(c.status ?? '')).length;
    const totalQty = sc.reduce((s, c) => s + (c.quantity_affected ?? 0), 0);
    const totalSupplied = sc.reduce((s, c) => s + (c.total_supplied ?? 0), 0);
    const ppm = totalSupplied > 0 ? Math.round((totalQty / totalSupplied) * 1_000_000) : 0;
    const closureRate = sc.length > 0 ? Math.round((closed / sc.length) * 100) : 100;

    // Oldest open days
    const openDates = sc.filter(c => !['Closed','Cancelled'].includes(c.status ?? '')).map(c => new Date(c.created_at).getTime());
    const oldestOpenDays = openDates.length > 0 ? Math.floor((now.getTime() - Math.min(...openDates)) / 86400000) : 0;

    // Sparkline: NCR count per month (last 6 months)
    const sparkline: number[] = sparkKeys.map(ym => {
      return sc.filter(c => c.created_at && c.created_at.slice(0, 7) === ym).length;
    });

    // Top defect categories
    const defectCounts: Record<string, number> = {};
    sc.forEach(c => { const d = c.defect_category ?? 'General'; defectCounts[d] = (defectCounts[d] ?? 0) + 1; });
    const topDefects = Object.entries(defectCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const topDefect = topDefects[0] ?? '';

    // Repeat defects (same category appearing 2+ times)
    const repeatDefects = Object.values(defectCounts).some(v => v >= 2);

    // Risk score (for sorting)
    const riskScore = critical * 25 + open * 8 + (ppm > 5000 ? 15 : ppm > 2000 ? 10 : ppm > 500 ? 5 : 0) + (closureRate < 40 ? 12 : closureRate < 70 ? 6 : 0);

    const tier = calcTier(open, critical, ppm, closureRate);
    const narrative = buildNarrative(name, tier, open, critical, ppm, closureRate, oldestOpenDays, repeatDefects, topDefect);

    return {
      name,
      tier,
      riskScore,
      open,
      closed,
      total: sc.length,
      critical,
      ppm,
      closureRate,
      oldestOpenDays,
      sparkline,
      topDefects,
      repeatDefects,
      narrative,
      totalQty,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalNCRs    = supplierComplaints.length;
  const totalOpen    = supplierComplaints.filter(c => !['Closed','Cancelled'].includes(c.status ?? '')).length;
  const totalCritical = supplierComplaints.filter(c => c.severity === 'Critical').length;
  const criticalSuppliers = suppliers.filter(s => s.tier === 'Critical').length;
  const highRisk     = suppliers.filter(s => s.tier === 'High').length;
  const avgClosure   = suppliers.length > 0 ? Math.round(suppliers.reduce((s, x) => s + x.closureRate, 0) / suppliers.length) : 0;

  let summary = '';
  if (suppliers.length === 0) {
    summary = 'No supplier complaints on record. Add supplier NCRs by setting Complaint Type to "Supplier Complaint" or using a supplier-related defect category (Material, Incoming, Supplier).';
  } else if (criticalSuppliers > 0) {
    summary = `CRITICAL: ${criticalSuppliers} supplier${criticalSuppliers > 1 ? 's' : ''} in critical risk zone. Immediate SQE action required. ${totalOpen} total open NCRs across ${suppliers.length} suppliers.`;
  } else if (highRisk > 0) {
    summary = `${highRisk} supplier${highRisk > 1 ? 's' : ''} at high risk. ${totalOpen} open NCRs across ${suppliers.length} suppliers. Average closure rate: ${avgClosure}%.`;
  } else {
    summary = `Supplier quality is under control. ${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''} monitored. ${totalOpen} open NCRs. Average closure rate: ${avgClosure}%.`;
  }

  return NextResponse.json({
    suppliers,
    summary,
    totals: { totalNCRs, totalOpen, totalCritical, criticalSuppliers, highRisk, suppliers: suppliers.length, avgClosure },
    sparkKeys,
    fetchedAt: now.toISOString(),
  });
}
