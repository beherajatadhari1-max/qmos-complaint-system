export const dynamic = "force-dynamic";
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

// ── Cost estimation by severity & defect type ─────────────────────────────────
// Unit costs (₹) — representative automotive estimates
const UNIT_COST_BY_SEVERITY: Record<string, number> = {
  Critical: 4500,
  High:     2500,
  Medium:   1200,
  Low:       500,
};

// External failure multiplier (warranty / customer penalty is 8–15× internal)
const EXTERNAL_MULTIPLIER = 10;

// Appraisal cost per complaint (inspection, testing, sorting labour)
const APPRAISAL_COST_PER_COMPLAINT = 800;

// Prevention cost ratio (5–8% of external failure cost, industry benchmark)
const PREVENTION_RATIO = 0.06;

// Warranty / field failure categories
const WARRANTY_KEYWORDS = ['warranty', 'field', 'recall', 'goodwill', 'r/1000', 'pdi', 'customer return'];
const SUPPLIER_KEYWORDS = ['material', 'incoming', 'supplier', 'raw', 'scar'];

function isWarranty(c: { complaint_type?: string; defect_category?: string; source?: string; complaint_source?: string }): boolean {
  const text = `${c.complaint_type ?? ''} ${c.defect_category ?? ''} ${c.complaint_source ?? ''}`.toLowerCase();
  return WARRANTY_KEYWORDS.some(k => text.includes(k));
}

function isSupplier(c: { complaint_type?: string; defect_category?: string; source?: string; complaint_source?: string }): boolean {
  const text = `${c.complaint_type ?? ''} ${c.defect_category ?? ''} ${c.complaint_source ?? ''}`.toLowerCase();
  return SUPPLIER_KEYWORDS.some(k => text.includes(k));
}

// ── NLG: AI COPQ narrative ────────────────────────────────────────────────────
function buildNarrative(
  totalCOPQ: number,
  externalPct: number,
  internalPct: number,
  topCategory: string,
  trend: 'improving' | 'worsening' | 'stable',
  criticalComplaints: number,
  warrantyCount: number,
): string {
  const fmt = (n: number) => `₹${n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0)}`;
  const totalFmt = fmt(totalCOPQ);

  let opening = '';
  if (totalCOPQ > 1000000) {
    opening = `Total estimated COPQ stands at ${totalFmt} — exceeding ₹10L threshold. This level of quality cost requires immediate management attention and structured cost reduction program.`;
  } else if (totalCOPQ > 500000) {
    opening = `Total estimated COPQ is ${totalFmt}. Quality costs are significant and a focused reduction initiative is recommended for the next quarter.`;
  } else {
    opening = `Total estimated COPQ is ${totalFmt}. Quality cost profile is within manageable range — maintain current controls and focus on prevention uplift.`;
  }

  let analysisLine = '';
  if (externalPct > 60) {
    analysisLine = ` External failure dominates at ${externalPct.toFixed(0)}% of COPQ — indicating defects are escaping to customers. Strengthen outgoing inspection controls and CAPA closure rates urgently.`;
  } else if (internalPct > 60) {
    analysisLine = ` Internal failure at ${internalPct.toFixed(0)}% is high — most defects caught internally which is positive, but rework and scrap costs are elevated. Focus on process SPC and error-proofing.`;
  } else {
    analysisLine = ` Cost split is relatively balanced between internal (${internalPct.toFixed(0)}%) and external (${externalPct.toFixed(0)}%) failure. Focus on transitioning investment from failure costs to prevention.`;
  }

  let trendLine = '';
  if (trend === 'worsening') {
    trendLine = ' COPQ trend is WORSENING month-over-month — escalation to management review is mandatory.';
  } else if (trend === 'improving') {
    trendLine = ' Positive trend detected — COPQ is reducing month-over-month. Continue current quality improvement initiatives.';
  } else {
    trendLine = ' COPQ trend is stable. Monitor for two more months before declaring improvement.';
  }

  let specificLine = '';
  if (criticalComplaints > 0) {
    specificLine = ` ${criticalComplaints} critical complaint${criticalComplaints > 1 ? 's' : ''} driving disproportionate cost impact.`;
  }
  if (warrantyCount > 0) {
    specificLine += ` ${warrantyCount} warranty/field failure${warrantyCount > 1 ? 's' : ''} detected — field COPQ is highest cost category and must be addressed first.`;
  }

  const recommendation = externalPct > 50
    ? ' Recommendation: Invest in poka-yoke and 100% end-of-line testing to reduce external failures. ROI on prevention investment is typically 4:1 vs. failure costs.'
    : ' Recommendation: Shift investment from appraisal (inspection) to prevention (poka-yoke, SPC, training). Target COPQ reduction of 15% per quarter.';

  return opening + analysisLine + trendLine + specificLine + recommendation;
}

// ── GET /api/copq ─────────────────────────────────────────────────────────────
export async function GET() {
  const companyId = await getCompanyId();
  const now = new Date();

  const { data: allComplaints } = await supabaseAdmin
    .from('complaints')
    .select('id, status, severity, quantity_affected, total_supplied, created_at, defect_category, complaint_type, source, complaint_source')
    .eq('company_id', companyId ?? '');

  const complaints = allComplaints ?? [];

  // Calibration: overdue instruments add to appraisal cost
  const { data: calData } = await supabaseAdmin
    .from('calibration_equipment')
    .select('id, next_calibration_date, status')
    .eq('company_id', companyId ?? '');

  const overdueInstruments = (calData ?? []).filter(
    i => i.status !== 'Out of Service' && i.next_calibration_date && new Date(i.next_calibration_date) < now
  ).length;

  // ── Per-complaint cost estimation ─────────────────────────────────────────
  let internalFailure = 0;
  let externalFailure = 0;
  let appraisalCost   = 0;

  for (const c of complaints) {
    if (c.status === 'Cancelled') continue;
    const qty   = c.quantity_affected ?? 0;
    const unitC = UNIT_COST_BY_SEVERITY[c.severity ?? 'Low'] ?? 500;
    const baseCost = qty * unitC;

    if (isWarranty(c)) {
      // Warranty = external failure × multiplier
      externalFailure += baseCost * EXTERNAL_MULTIPLIER;
    } else if (isSupplier(c)) {
      // Supplier NCR = internal failure (caught at incoming)
      internalFailure += baseCost;
    } else {
      // Customer complaint = external failure
      externalFailure += baseCost;
    }

    // Every complaint requires inspection effort
    appraisalCost += APPRAISAL_COST_PER_COMPLAINT;
  }

  // Calibration overdue adds hidden appraisal risk cost
  appraisalCost += overdueInstruments * 2500;

  // Prevention cost (benchmark: target 6% of external failure)
  const preventionCost = Math.round(externalFailure * PREVENTION_RATIO);

  const totalCOPQ = internalFailure + externalFailure + appraisalCost + preventionCost;

  // ── Monthly trend — last 6 months ─────────────────────────────────────────
  const sparkKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    sparkKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const monthlyBreakdown = sparkKeys.map(ym => {
    const monthComplaints = complaints.filter(c => c.created_at && c.created_at.slice(0, 7) === ym && c.status !== 'Cancelled');
    let internal = 0, external = 0;
    for (const c of monthComplaints) {
      const qty = c.quantity_affected ?? 0;
      const unitC = UNIT_COST_BY_SEVERITY[c.severity ?? 'Low'] ?? 500;
      const base = qty * unitC;
      if (isWarranty(c)) external += base * EXTERNAL_MULTIPLIER;
      else if (isSupplier(c)) internal += base;
      else external += base;
    }
    const appraisal = monthComplaints.length * APPRAISAL_COST_PER_COMPLAINT;
    const prevention = Math.round(external * PREVENTION_RATIO);
    return { ym, total: internal + external + appraisal + prevention, internal, external, appraisal, prevention, count: monthComplaints.length };
  });

  // Trend: compare last 2 months
  const [prev, curr] = monthlyBreakdown.slice(-2);
  const trend: 'improving' | 'worsening' | 'stable' =
    curr && prev
      ? curr.total < prev.total * 0.95 ? 'improving'
      : curr.total > prev.total * 1.05 ? 'worsening'
      : 'stable'
      : 'stable';

  // ── Top defect categories by cost ─────────────────────────────────────────
  const catCosts: Record<string, number> = {};
  for (const c of complaints) {
    if (c.status === 'Cancelled') continue;
    const cat = c.defect_category ?? 'General';
    const qty = c.quantity_affected ?? 0;
    const unitC = UNIT_COST_BY_SEVERITY[c.severity ?? 'Low'] ?? 500;
    catCosts[cat] = (catCosts[cat] ?? 0) + qty * unitC;
  }
  const topCategories = Object.entries(catCosts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, cost]) => ({ cat, cost, pct: totalCOPQ > 0 ? Math.round((cost / totalCOPQ) * 100) : 0 }));

  // Misc stats
  const criticalComplaints = complaints.filter(c => c.severity === 'Critical' && c.status !== 'Cancelled').length;
  const warrantyCount = complaints.filter(isWarranty).length;
  const topCategory = topCategories[0]?.cat ?? '';
  const externalPct = totalCOPQ > 0 ? (externalFailure / totalCOPQ) * 100 : 0;
  const internalPct = totalCOPQ > 0 ? (internalFailure / totalCOPQ) * 100 : 0;

  const narrative = buildNarrative(totalCOPQ, externalPct, internalPct, topCategory, trend, criticalComplaints, warrantyCount);

  // ── PAF model summary ─────────────────────────────────────────────────────
  const categories = [
    {
      key: 'external',
      label: 'External Failure',
      icon: '🚨',
      cost: externalFailure,
      pct: externalPct,
      color: 'red',
      description: 'Customer complaints, warranty claims, field failures, returns, penalties, goodwill',
      iatf: 'Cl. 10.2 — CAPA for external failures',
      examples: ['Customer rejection cost', 'Warranty repairs', 'Field recall cost', 'Customer penalty / debit note'],
    },
    {
      key: 'internal',
      label: 'Internal Failure',
      icon: '🔧',
      cost: internalFailure,
      pct: internalPct,
      color: 'orange',
      description: 'Scrap, rework, re-inspection, downtime due to quality failures found before dispatch',
      iatf: 'Cl. 8.7 — Control of nonconforming outputs',
      examples: ['Rework labour cost', 'Scrap material cost', 'Incoming rejection & sorting', 'Line stoppage due to quality'],
    },
    {
      key: 'appraisal',
      label: 'Appraisal Cost',
      icon: '🔍',
      cost: appraisalCost,
      pct: totalCOPQ > 0 ? (appraisalCost / totalCOPQ) * 100 : 0,
      color: 'blue',
      description: 'Inspection, calibration, testing, gauge maintenance, audit costs',
      iatf: 'Cl. 7.1.5 — Measurement resources & calibration',
      examples: ['Incoming inspection labour', 'Final inspection / OQC', 'Calibration cost', `${overdueInstruments > 0 ? `${overdueInstruments} overdue instruments (risk cost)` : 'All instruments calibrated'}`],
    },
    {
      key: 'prevention',
      label: 'Prevention Cost',
      icon: '🛡️',
      cost: preventionCost,
      pct: totalCOPQ > 0 ? (preventionCost / totalCOPQ) * 100 : 0,
      color: 'emerald',
      description: 'Training, FMEA, SPC, poka-yoke, supplier development, quality planning',
      iatf: 'Cl. 6.1 — Risk-based thinking & prevention',
      examples: ['Quality training cost', 'FMEA & Control Plan reviews', 'Poka-yoke investments', 'Supplier development audits'],
    },
  ];

  const copqAsRevenueRatio = 3.5; // estimated % of revenue (industry 3-8%)

  return NextResponse.json({
    totalCOPQ,
    categories,
    monthlyBreakdown,
    topCategories,
    narrative,
    trend,
    sparkKeys,
    summary: {
      totalComplaints: complaints.filter(c => c.status !== 'Cancelled').length,
      criticalComplaints,
      warrantyCount,
      overdueInstruments,
      copqAsRevenueRatio,
      externalDominates: externalFailure > internalFailure,
    },
    fetchedAt: now.toISOString(),
  });
}
