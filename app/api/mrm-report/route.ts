export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
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
  } catch { /* ignore */ }
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

const SLA_DAYS: Record<string, number> = { Critical: 7, High: 14, Medium: 30, Low: 45 };

export async function GET(_req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // ── 1. Fetch all complaints ────────────────────────────────────────────────
    const { data: complaints, error: cErr } = await supabaseAdmin
      .from('complaints')
      .select('id,complaint_number,customer_name,severity,status,defect_category,created_at,closed_at,ppm_quantity,total_supplied')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (cErr) throw cErr;
    const all = complaints ?? [];

    // ── 2. Core complaint KPIs ────────────────────────────────────────────────
    const open   = all.filter(c => !['Closed','Cancelled'].includes(c.status));
    const closed = all.filter(c => c.status === 'Closed');
    const critical = open.filter(c => c.severity === 'Critical');
    const capaInProgress = open.filter(c => c.status === 'CAPA In Progress');
    const pendingClosure = open.filter(c => c.status === 'Pending Closure');
    const pendingApproval = open.filter(c =>
      ['Pending Closure','Pending Verification','CAPA In Progress'].includes(c.status)
    );

    const totalSupplied = all.reduce((s, c) => s + (Number(c.total_supplied) || 0), 0);
    const totalRejected = all.reduce((s, c) => s + (Number(c.ppm_quantity) || 0), 0);
    const ppm = totalSupplied > 0 ? Math.round((totalRejected / totalSupplied) * 1_000_000) : 0;
    const closureRate = all.length > 0 ? Math.round((closed.length / all.length) * 100) : 0;

    // ── 3. SLA analysis ───────────────────────────────────────────────────────
    const now = Date.now();
    let slaBreached = 0, slaWarning = 0, slaOnTrack = 0;
    const slaBreachedItems: { complaint_number: string; customer_name: string; severity: string; daysOpen: number }[] = [];

    for (const c of open) {
      const daysOpen = Math.floor((now - new Date(c.created_at).getTime()) / 86_400_000);
      const target = SLA_DAYS[c.severity] ?? 30;
      const daysLeft = target - daysOpen;
      const pctUsed = daysOpen / target;

      if (daysLeft < 0) {
        slaBreached++;
        slaBreachedItems.push({ complaint_number: c.complaint_number, customer_name: c.customer_name, severity: c.severity, daysOpen });
      } else if (pctUsed >= 0.75) { slaWarning++; }
      else { slaOnTrack++; }
    }

    // ── 4. Status breakdown ───────────────────────────────────────────────────
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const c of all) {
      byStatus[c.status]     = (byStatus[c.status] ?? 0) + 1;
      bySeverity[c.severity] = (bySeverity[c.severity] ?? 0) + 1;
    }

    // ── 5. Pareto — top defect categories ────────────────────────────────────
    const catCount: Record<string, number> = {};
    for (const c of all) {
      if (c.defect_category) catCount[c.defect_category] = (catCount[c.defect_category] ?? 0) + 1;
    }
    const pareto = Object.entries(catCount)
      .map(([cat, count]) => ({ category: cat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── 6. 6-month PPM trend ──────────────────────────────────────────────────
    const trend: { month: string; ppm: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthComplaints = all.filter(c => c.created_at?.startsWith(ym));
      const mSupplied = monthComplaints.reduce((s, c) => s + (Number(c.total_supplied) || 0), 0);
      const mRejected = monthComplaints.reduce((s, c) => s + (Number(c.ppm_quantity) || 0), 0);
      trend.push({
        month: ym,
        ppm: mSupplied > 0 ? Math.round((mRejected / mSupplied) * 1_000_000) : 0,
        count: monthComplaints.length,
      });
    }

    // ── 7. Recent open complaints (top 10 for summary) ────────────────────────
    const recentOpen = open.slice(0, 10).map(c => ({
      id: c.id,
      complaint_number: c.complaint_number,
      customer_name: c.customer_name,
      severity: c.severity,
      status: c.status,
      created_at: c.created_at,
      daysOpen: Math.floor((now - new Date(c.created_at).getTime()) / 86_400_000),
    }));

    // ── 8. Approval queue ────────────────────────────────────────────────────
    const approvalPending = pendingApproval.length;
    const approvedLast30 = closed.filter(c => {
      if (!c.closed_at) return false;
      return (now - new Date(c.closed_at).getTime()) < 30 * 86_400_000;
    }).length;

    // ── 9. Customer breakdown (top 5) ─────────────────────────────────────────
    const custCount: Record<string, number> = {};
    for (const c of open) {
      if (c.customer_name) custCount[c.customer_name] = (custCount[c.customer_name] ?? 0) + 1;
    }
    const topCustomers = Object.entries(custCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Build report payload ──────────────────────────────────────────────────
    const now8 = new Date();
    const periodLabel = `${now8.toLocaleString('default', { month: 'long' })} ${now8.getFullYear()}`;

    return NextResponse.json({
      generatedAt: now8.toISOString(),
      period: periodLabel,
      complaints: {
        total: all.length,
        open: open.length,
        closed: closed.length,
        critical: critical.length,
        capaInProgress: capaInProgress.length,
        pendingClosure: pendingClosure.length,
        ppm,
        closureRate,
        byStatus,
        bySeverity,
      },
      sla: {
        total: open.length,
        breached: slaBreached,
        warning: slaWarning,
        on_track: slaOnTrack,
        breachedItems: slaBreachedItems,
      },
      approvals: {
        pending: approvalPending,
        approvedLast30d: approvedLast30,
      },
      pareto,
      trend,
      recentOpen,
      topCustomers,
    });
  } catch (err) {
    console.error('[mrm-report]', err);
    return NextResponse.json({ error: 'Failed to generate MRM report' }, { status: 500 });
  }
}
