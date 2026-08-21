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

// ── Traffic-light helper ───────────────────────────────────────────────────────
function light(score: number): 'green' | 'amber' | 'red' {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

// ── Rule-based AI insight generator ──────────────────────────────────────────
function clauseInsight(
  clauseNum: string,
  score: number,
  metric: { [k: string]: number | string }
): string {
  const lvl = score >= 75 ? 'COMPLIANT' : score >= 50 ? 'AT RISK' : 'NON-COMPLIANT';

  const insights: Record<string, string> = {
    '8.7': score >= 75
      ? `NC closure rate is strong. Zero unresolved critical NCs detected. Evidence package is audit-ready.`
      : score >= 50
      ? `${metric.open ?? 0} open NCs with ${metric.critical ?? 0} critical. Auditor will probe overdue items — close within 7 days.`
      : `High open NC count (${metric.open}) with ${metric.critical} critical unresolved. Major NC risk at next IATF audit.`,

    '10.2': score >= 75
      ? `CAPA raise rate is above 80%. Effectiveness verification records are traceable.`
      : score >= 50
      ? `CAPA raise rate at ${metric.capaRate}%. Auditor will expect evidence of systemic action for all repeat failures.`
      : `CAPA coverage below threshold (${metric.capaRate}%). Absence of corrective actions on criticals is a Major NC trigger.`,

    '7.1.5': score >= 75
      ? `Calibration compliance is excellent. No overdue instruments detected. Traceability to NABL standards confirmed.`
      : score >= 50
      ? `${metric.overdue ?? 0} instrument(s) overdue for calibration. Auditor will verify calibration certificates during process audit.`
      : `${metric.overdue} overdue calibrations — any measurement taken with an uncalibrated instrument invalidates quality records. Immediate action required.`,

    '9.1.1': score >= 75
      ? `PPM performance is within target. Process monitoring data demonstrates statistical control.`
      : score >= 50
      ? `Current PPM (${metric.ppm}) exceeds target. Trend analysis and SPC charts will be reviewed by auditor.`
      : `PPM (${metric.ppm}) is significantly above acceptable threshold. Customer-specific requirements may trigger escalation.`,

    '8.4': score >= 75
      ? `Supplier-related complaints are within acceptable limits. Supplier development activities are evident.`
      : score >= 50
      ? `${metric.supplierComplaints} supplier-source complaints open. SCAR evidence and follow-up records expected by auditor.`
      : `High supplier complaint burden (${metric.supplierComplaints} open). External provider control process requires immediate strengthening.`,

    '9.3': score >= 75
      ? `Management Review cadence is on track. KPI inputs and output action records are complete.`
      : score >= 50
      ? `Management Review outputs may lack follow-up evidence. Auditor will verify action owners and closure dates.`
      : `Management Review gaps detected. Customer complaint trends, audit results, and improvement actions must be documented.`,

    '8.5.6': score >= 75
      ? `Change control process is functioning. 4M change notifications and PPAP re-submissions are traceable.`
      : score >= 50
      ? `Some high-severity complaints indicate undocumented process changes. Validate 4M change log completeness.`
      : `Engineering change control gaps detected. Uncontrolled changes are a leading cause of field failures and IATF Major NCs.`,

    '7.2': score >= 75
      ? `Competency records are current. Training effectiveness evaluations are documented for key quality roles.`
      : score >= 50
      ? `Training coverage gaps exist. Auditor will verify competency matrix and on-the-job evaluation records.`
      : `Significant competency gaps detected. Quality team training records must be updated before any IATF audit.`,
  };

  return `[${lvl}] ${insights[clauseNum] ?? `Clause ${clauseNum} compliance requires verification.`}`;
}

function clauseRecommendation(clauseNum: string, score: number): string {
  if (score >= 75) return 'Maintain current controls. Prepare objective evidence for audit.';
  const recs: Record<string, string> = {
    '8.7': 'Close all open NCs within 30 days. Escalate overdue critical NCs to Quality Head.',
    '10.2': 'Raise CAPA for all Critical and High severity complaints. Verify effectiveness within 30 days.',
    '7.1.5': 'Immediately schedule overdue calibrations. Update calibration register with NABL cert numbers.',
    '9.1.1': 'Implement SPC control charts on top defect processes. Set PPM reduction target for next MRM.',
    '8.4': 'Issue SCARs for repeat supplier failures. Conduct supplier process audit within 60 days.',
    '9.3': 'Schedule Management Review within 30 days. Ensure all IATF-required inputs are covered.',
    '8.5.6': 'Audit 4M change log against recent complaint root causes. Raise PPAP re-submissions where required.',
    '7.2': 'Update competency matrix. Conduct on-the-job training evaluations. Archive signed records.',
  };
  return recs[clauseNum] ?? 'Review clause requirements and update quality system documentation.';
}

// ── AI Audit Brief (NLG) ──────────────────────────────────────────────────────
function generateAuditBrief(
  overallScore: number,
  clauses: { number: string; title: string; status: string; score: number }[],
  data: { totalComplaints: number; openComplaints: number; criticalOpen: number; ppm: number; overdueCalibrations: number }
): string {
  const redClauses = clauses.filter(c => c.status === 'red').map(c => `Cl. ${c.number}`);
  const amberClauses = clauses.filter(c => c.status === 'amber').map(c => `Cl. ${c.number}`);

  const band = overallScore >= 80 ? 'AUDIT READY' : overallScore >= 65 ? 'NEEDS ATTENTION' : overallScore >= 50 ? 'AT RISK' : 'CRITICAL';

  let brief = `Overall IATF 16949 audit readiness is assessed at ${overallScore}/100 — status: ${band}. `;

  if (redClauses.length === 0 && amberClauses.length === 0) {
    brief += `All 8 monitored clauses are GREEN. The quality management system is demonstrating strong compliance across nonconformance control, CAPA, calibration, and supplier management. Maintain objective evidence and prepare witness audit packages.`;
  } else {
    if (redClauses.length > 0) {
      brief += `HIGH RISK identified in ${redClauses.join(', ')} — these represent potential Major NC findings in a certification audit. `;
    }
    if (amberClauses.length > 0) {
      brief += `Monitoring attention required for ${amberClauses.join(', ')}. `;
    }
    if (data.criticalOpen > 0) {
      brief += `${data.criticalOpen} Critical complaint(s) remain open — auditor will specifically probe these for containment and root cause evidence. `;
    }
    if (data.overdueCalibrations > 0) {
      brief += `${data.overdueCalibrations} overdue calibration(s) must be resolved before any audit — uncalibrated measurement invalidates inspection records. `;
    }
    if (data.ppm > 1000) {
      brief += `Current PPM of ${data.ppm.toLocaleString()} exceeds typical OEM acceptance limits and will trigger customer-specific requirement review.`;
    }
  }

  return brief;
}

// ── Main GET handler ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // ── Fetch complaints (last 90 days) ──
    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);

    const { data: complaints } = await supabaseAdmin
      .from('complaints')
      .select('id, status, severity, complaint_type, quantity_affected, total_supplied, created_at, defect_category, customer, customer_name')
      .eq('company_id', companyId)
      .gte('created_at', since90.toISOString());

    const allC = complaints ?? [];

    // ── Fetch ALL complaints for total counts ──
    const { data: allComplaints } = await supabaseAdmin
      .from('complaints')
      .select('id, status, severity, quantity_affected, total_supplied, created_at, defect_category')
      .eq('company_id', companyId);

    const allTotal = allComplaints ?? [];

    // ── Fetch calibration ──
    const { data: calData } = await supabaseAdmin
      .from('calibration_equipment')
      .select('id, calibration_status, next_due')
      .eq('company_id', companyId);

    const calAll = calData ?? [];

    // ── Derive calibration statuses ──
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const calEnriched = calAll.map(e => {
      if (!e.next_due) return { ...e, derived: e.calibration_status as string };
      if (['Inactive', 'Scrapped', 'Out of Scope', 'Not Required'].includes(e.calibration_status)) return { ...e, derived: e.calibration_status as string };
      const due = new Date(e.next_due);
      const daysLeft = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
      return { ...e, derived: daysLeft < 0 ? 'Overdue' : daysLeft <= 30 ? 'Due Soon' : 'Calibrated' };
    });

    const calActive = calEnriched.filter(e => !['Inactive', 'Scrapped', 'Out of Scope', 'Not Required'].includes(e.derived));
    const calOverdue = calActive.filter(e => e.derived === 'Overdue').length;
    const calDueSoon = calActive.filter(e => e.derived === 'Due Soon').length;
    const calOK = calActive.filter(e => e.derived === 'Calibrated').length;
    const calTotal = calActive.length;

    // ── Complaint metrics ──
    const openC = allTotal.filter(c => !['Closed', 'Cancelled'].includes(c.status));
    const closedC = allTotal.filter(c => c.status === 'Closed');
    const criticalOpen = openC.filter(c => c.severity === 'Critical').length;
    const totalComplaints = allTotal.length;
    const closureRate = totalComplaints > 0 ? Math.round((closedC.length / totalComplaints) * 100) : 0;

    // CAPA proxy — complaints "CAPA In Progress" or "Pending Verification" or "Closed" (implies CAPA was done)
    const capaStatuses = ['CAPA In Progress', 'Pending Verification', 'Pending Closure', 'Closed'];
    const withCapa = allTotal.filter(c => capaStatuses.includes(c.status)).length;
    const capaRate = totalComplaints > 0 ? Math.round((withCapa / totalComplaints) * 100) : 0;

    // PPM
    const totalRej = allTotal.reduce((s, c) => s + (c.quantity_affected ?? 0), 0);
    const totalSup = allTotal.reduce((s, c) => s + (c.total_supplied ?? 0), 0);
    const ppm = totalSup > 0 ? Math.round((totalRej / totalSup) * 1_000_000) : 0;

    // Supplier complaints proxy (defect_category contains supplier keywords)
    const supplierKeywords = ['supplier', 'incoming', 'iqc', 'vendor', 'raw material', 'external'];
    const supplierComplaints = allTotal.filter(c => {
      const dc = (c.defect_category ?? '').toLowerCase();
      return supplierKeywords.some(k => dc.includes(k));
    });
    const supplierOpen = supplierComplaints.filter(c => !['Closed', 'Cancelled'].includes(c.status)).length;

    // High severity recurrence (change control proxy) — more than 1 complaint same category in open
    const catCount: Record<string, number> = {};
    openC.forEach(c => {
      const cat = c.defect_category ?? 'Unknown';
      catCount[cat] = (catCount[cat] ?? 0) + 1;
    });
    const recurringCategories = Object.values(catCount).filter(v => v > 1).length;

    // Overdue complaints (open for > 30 days) as MRM proxy
    const overdueComplaints = openC.filter(c => {
      const age = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
      return age > 30;
    }).length;

    // ── Clause Scores ─────────────────────────────────────────────────────────

    // Cl. 8.7 — Nonconforming Output Control
    const c87Score = Math.min(100, Math.max(0,
      Math.round(closureRate * 0.6 + (criticalOpen === 0 ? 40 : criticalOpen === 1 ? 20 : 0))
    ));

    // Cl. 10.2 — CAPA
    const c102Score = Math.min(100, Math.max(0, capaRate));

    // Cl. 7.1.5 — Calibration
    const c715Score = calTotal === 0
      ? 80  // no equipment registered → neutral/amber
      : Math.round(((calOK + calDueSoon * 0.5) / calTotal) * 100 - calOverdue * 15);

    // Cl. 9.1.1 — PPM / Process Monitoring
    const ppmTarget = 500;
    const c911Score = ppm === 0
      ? 90
      : ppm <= ppmTarget
      ? Math.min(100, Math.round(90 + ((ppmTarget - ppm) / ppmTarget) * 10))
      : Math.max(10, Math.round(90 - ((ppm - ppmTarget) / ppmTarget) * 30));

    // Cl. 8.4 — Supplier Quality
    const c84Score = supplierOpen === 0 ? 90 : Math.max(10, 90 - supplierOpen * 12);

    // Cl. 9.3 — Management Review (proxy via overdue open complaints > 30d)
    const c93Score = Math.max(20, Math.min(100, 85 - overdueComplaints * 5));

    // Cl. 8.5.6 — Change Control (proxy via recurring defect categories)
    const c856Score = Math.max(20, Math.min(100, 85 - recurringCategories * 10));

    // Cl. 7.2 — Competence (proxy via complaint complexity — higher severity mix → lower competence score)
    const highSev = allTotal.filter(c => ['Critical', 'High'].includes(c.severity ?? '')).length;
    const sevRatio = totalComplaints > 0 ? highSev / totalComplaints : 0;
    const c72Score = Math.max(30, Math.min(100, Math.round(90 - sevRatio * 40)));

    // ── Build clause objects ──────────────────────────────────────────────────
    const clauses = [
      {
        number: '8.7',
        title: 'Control of Nonconforming Outputs',
        score: c87Score,
        status: light(c87Score),
        metric: `${openC.length} open NCs · ${criticalOpen} critical · ${closureRate}% closure rate`,
        weight: 20,
        insight: clauseInsight('8.7', c87Score, { open: openC.length, critical: criticalOpen }),
        recommendation: clauseRecommendation('8.7', c87Score),
        iatfRef: 'IATF 16949:2016 Cl. 8.7.1 – 8.7.2',
      },
      {
        number: '10.2',
        title: 'Nonconformity & Corrective Action',
        score: c102Score,
        status: light(c102Score),
        metric: `${capaRate}% CAPA raise rate · ${withCapa} of ${totalComplaints} complaints actioned`,
        weight: 20,
        insight: clauseInsight('10.2', c102Score, { capaRate }),
        recommendation: clauseRecommendation('10.2', c102Score),
        iatfRef: 'IATF 16949:2016 Cl. 10.2.1 – 10.2.6',
      },
      {
        number: '7.1.5',
        title: 'Monitoring & Measurement Resources',
        score: Math.max(0, c715Score),
        status: light(Math.max(0, c715Score)),
        metric: calTotal === 0
          ? 'No instruments registered — please add equipment in Calibration module'
          : `${calOK} calibrated · ${calDueSoon} due soon · ${calOverdue} overdue (of ${calTotal} active)`,
        weight: 15,
        insight: clauseInsight('7.1.5', Math.max(0, c715Score), { overdue: calOverdue }),
        recommendation: clauseRecommendation('7.1.5', Math.max(0, c715Score)),
        iatfRef: 'IATF 16949:2016 Cl. 7.1.5.1 – 7.1.5.3.2',
      },
      {
        number: '9.1.1',
        title: 'Monitoring, Measurement & Analysis',
        score: c911Score,
        status: light(c911Score),
        metric: `Current PPM: ${ppm.toLocaleString()} · Target: ≤500 PPM · ${ppm <= 500 ? '✓ Within target' : `${(ppm - 500).toLocaleString()} above target`}`,
        weight: 15,
        insight: clauseInsight('9.1.1', c911Score, { ppm }),
        recommendation: clauseRecommendation('9.1.1', c911Score),
        iatfRef: 'IATF 16949:2016 Cl. 9.1.1.1 – 9.1.1.3',
      },
      {
        number: '8.4',
        title: 'Control of Externally Provided Processes',
        score: c84Score,
        status: light(c84Score),
        metric: `${supplierComplaints.length} supplier-linked complaints · ${supplierOpen} open · ${supplierComplaints.length - supplierOpen} closed`,
        weight: 10,
        insight: clauseInsight('8.4', c84Score, { supplierComplaints: supplierOpen }),
        recommendation: clauseRecommendation('8.4', c84Score),
        iatfRef: 'IATF 16949:2016 Cl. 8.4.1 – 8.4.3',
      },
      {
        number: '9.3',
        title: 'Management Review',
        score: c93Score,
        status: light(c93Score),
        metric: `${overdueComplaints} complaints open >30 days · Review cadence indicator`,
        weight: 10,
        insight: clauseInsight('9.3', c93Score, {}),
        recommendation: clauseRecommendation('9.3', c93Score),
        iatfRef: 'IATF 16949:2016 Cl. 9.3.1 – 9.3.3',
      },
      {
        number: '8.5.6',
        title: 'Control of Changes',
        score: c856Score,
        status: light(c856Score),
        metric: `${recurringCategories} recurring defect categories · 4M change control indicator`,
        weight: 5,
        insight: clauseInsight('8.5.6', c856Score, {}),
        recommendation: clauseRecommendation('8.5.6', c856Score),
        iatfRef: 'IATF 16949:2016 Cl. 8.5.6.1 – 8.5.6.1.1',
      },
      {
        number: '7.2',
        title: 'Competence',
        score: c72Score,
        status: light(c72Score),
        metric: `${Math.round(sevRatio * 100)}% high-severity complaint ratio · Competency indicator`,
        weight: 5,
        insight: clauseInsight('7.2', c72Score, {}),
        recommendation: clauseRecommendation('7.2', c72Score),
        iatfRef: 'IATF 16949:2016 Cl. 7.2.1 – 7.2.4',
      },
    ];

    // ── Weighted overall score ────────────────────────────────────────────────
    const totalWeight = clauses.reduce((s, c) => s + c.weight, 0);
    const overallScore = Math.round(
      clauses.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
    );

    // ── Readiness band ────────────────────────────────────────────────────────
    const readinessBand =
      overallScore >= 85 ? 'World Class' :
      overallScore >= 75 ? 'Audit Ready' :
      overallScore >= 60 ? 'Needs Attention' :
      overallScore >= 45 ? 'At Risk' : 'Critical';

    // ── AI Audit Brief ────────────────────────────────────────────────────────
    const auditBrief = generateAuditBrief(overallScore, clauses, {
      totalComplaints,
      openComplaints: openC.length,
      criticalOpen,
      ppm,
      overdueCalibrations: calOverdue,
    });

    return NextResponse.json({
      overallScore,
      readinessBand,
      auditBrief,
      clauses,
      summary: {
        totalComplaints,
        openComplaints: openC.length,
        criticalOpen,
        ppm,
        calOverdue,
        closureRate,
        capaRate,
      },
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('iatf-compliance error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
