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

// ── Priority Action builder ───────────────────────────────────────────────────
interface PriorityAction {
  rank: number;
  urgency: 'Critical' | 'High' | 'Medium';
  icon: string;
  action: string;
  detail: string;
  module: string;
  href: string;
}

// ── AI Narrative NLG ──────────────────────────────────────────────────────────
function buildNarrative(
  shift: string,
  criticalOpen: number,
  slaBreaches: number,
  calOverdue: number,
  pendingApprovals: number,
  todayComplaints: number,
  totalOpen: number,
  ppm: number,
): string {
  const parts: string[] = [];

  if (criticalOpen >= 3) {
    parts.push(`⚠ URGENT: ${criticalOpen} Critical complaints require immediate Quality Head intervention — containment actions must be verified within 2 hours.`);
  } else if (criticalOpen > 0) {
    parts.push(`${criticalOpen} Critical complaint${criticalOpen > 1 ? 's' : ''} active — ensure containment is in place and 8D is assigned.`);
  }

  if (slaBreaches > 0) {
    parts.push(`${slaBreaches} complaint${slaBreaches > 1 ? 's' : ''} ${slaBreaches > 1 ? 'have' : 'has'} breached SLA — customer escalation risk is HIGH. Push for same-day closure or update customer on revised timeline.`);
  }

  if (calOverdue > 0) {
    parts.push(`${calOverdue} calibration instrument${calOverdue > 1 ? 's' : ''} overdue — any measurement taken with uncalibrated equipment is invalid under IATF Cl. 7.1.5. Schedule calibration before next production shift.`);
  }

  if (pendingApprovals > 0) {
    parts.push(`${pendingApprovals} item${pendingApprovals > 1 ? 's' : ''} pending your approval — review and sign-off to prevent workflow blockage.`);
  }

  if (todayComplaints > 0) {
    parts.push(`${todayComplaints} new complaint${todayComplaints > 1 ? 's' : ''} raised today — review and assign within 4 hours to meet initial response SLA.`);
  }

  if (parts.length === 0) {
    if (totalOpen <= 2) {
      parts.push(`Quality status is GREEN. No critical issues detected. Excellent day to conduct process audits, verify CAPA effectiveness, and update FMEA risk actions.`);
    } else {
      parts.push(`${totalOpen} open complaints in queue — no critical items today. Monitor SLA timelines and drive CAPA closures. Good shift for process walks and operator training.`);
    }
  }

  if (ppm > 1000) {
    parts.push(`PPM stands at ${ppm.toLocaleString()} — above target. Raise with Process Engineering today to identify top contributor.`);
  }

  return parts.join(' ');
}

// ── GET /api/daily-brief ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({});

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    // ── Shift detection ──────────────────────────────────────────────────────
    const hour = now.getHours();
    const shift = hour >= 6 && hour < 14 ? 'Day Shift (06:00–14:00)'
      : hour >= 14 && hour < 22 ? 'Afternoon Shift (14:00–22:00)'
      : 'Night Shift (22:00–06:00)';
    const shiftCode = hour >= 6 && hour < 14 ? 'Day' : hour >= 14 && hour < 22 ? 'Afternoon' : 'Night';

    // ── Fetch all complaints ──────────────────────────────────────────────────
    const { data: allComplaints } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, status, severity, customer, customer_name, part_name, defect_category, created_at, approval_status, assigned_to')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    const complaints = allComplaints ?? [];

    const openComplaints = complaints.filter(c => !['Closed', 'Cancelled'].includes(c.status));
    const criticalOpen   = openComplaints.filter(c => c.severity === 'Critical');
    const highOpen       = openComplaints.filter(c => c.severity === 'High');

    // Today's new complaints
    const todayComplaints = complaints.filter(c => new Date(c.created_at) >= todayStart);

    // SLA breaches: open > 30 days
    const slaBreaches = openComplaints.filter(c => {
      const age = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
      return age > 30;
    });

    // Near-SLA (25-30 days open — warning zone)
    const nearSLA = openComplaints.filter(c => {
      const age = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
      return age >= 25 && age <= 30;
    });

    // Pending approvals
    const pendingApprovals = complaints.filter(c =>
      c.approval_status === 'pending' || c.status === 'Pending Closure'
    );

    // ── Fetch calibration ─────────────────────────────────────────────────────
    const { data: calData } = await supabaseAdmin
      .from('calibration_equipment')
      .select('id, name, department, next_due, calibration_status')
      .eq('company_id', companyId);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const calItems = (calData ?? []).map(e => {
      if (!e.next_due) return { ...e, derived: e.calibration_status as string, daysLeft: null as number | null };
      if (['Inactive', 'Scrapped', 'Out of Scope', 'Not Required'].includes(e.calibration_status)) {
        return { ...e, derived: e.calibration_status as string, daysLeft: null as number | null };
      }
      const due = new Date(e.next_due);
      const daysLeft = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
      const derived = daysLeft < 0 ? 'Overdue' : daysLeft <= 7 ? 'Due This Week' : daysLeft <= 30 ? 'Due Soon' : 'Calibrated';
      return { ...e, derived, daysLeft };
    });

    const calOverdue   = calItems.filter(e => e.derived === 'Overdue');
    const calThisWeek  = calItems.filter(e => e.derived === 'Due This Week');

    // ── PPM (last 30 days) ────────────────────────────────────────────────────
    const since30 = new Date(); since30.setDate(since30.getDate() - 30);
    const { data: recent30 } = await supabaseAdmin
      .from('complaints')
      .select('quantity_affected, total_supplied')
      .eq('company_id', companyId)
      .gte('created_at', since30.toISOString());
    const r30 = recent30 ?? [];
    const totalRej = r30.reduce((s, c) => s + (c.quantity_affected ?? 0), 0);
    const totalSup = r30.reduce((s, c) => s + (c.total_supplied ?? 0), 0);
    const ppm = totalSup > 0 ? Math.round((totalRej / totalSup) * 1_000_000) : 0;

    // ── Build Priority Actions ────────────────────────────────────────────────
    const actions: PriorityAction[] = [];

    // Critical complaints first
    criticalOpen.slice(0, 3).forEach((c, i) => {
      actions.push({
        rank: actions.length + 1,
        urgency: 'Critical',
        icon: '🚨',
        action: `Verify containment — ${c.complaint_number}`,
        detail: `${c.customer_name ?? c.customer} · ${c.part_name ?? c.defect_category} · ${Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000)}d open`,
        module: 'Complaints',
        href: `/complaints/${c.id}`,
      });
    });

    // SLA breaches
    slaBreaches.slice(0, 2).forEach(c => {
      const age = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
      actions.push({
        rank: actions.length + 1,
        urgency: 'High',
        icon: '⏱️',
        action: `SLA breach — escalate ${c.complaint_number}`,
        detail: `${c.customer_name ?? c.customer} · ${age} days open · Status: ${c.status}`,
        module: 'SLA Tracker',
        href: '/sla',
      });
    });

    // Overdue calibrations
    calOverdue.slice(0, 2).forEach(e => {
      const daysAgo = e.daysLeft !== null ? Math.abs(e.daysLeft) : '?';
      actions.push({
        rank: actions.length + 1,
        urgency: 'High',
        icon: '🔬',
        action: `Overdue calibration — ${e.name ?? 'Instrument'}`,
        detail: `${e.department ?? 'Unknown dept'} · ${daysAgo} days overdue · IATF Cl. 7.1.5 risk`,
        module: 'Calibration',
        href: '/calibration',
      });
    });

    // Pending approvals
    if (pendingApprovals.length > 0) {
      actions.push({
        rank: actions.length + 1,
        urgency: 'Medium',
        icon: '✅',
        action: `Review ${pendingApprovals.length} pending approval${pendingApprovals.length > 1 ? 's' : ''}`,
        detail: pendingApprovals.slice(0, 2).map(c => c.complaint_number).join(', ') + (pendingApprovals.length > 2 ? ` +${pendingApprovals.length - 2} more` : ''),
        module: 'Approvals',
        href: '/approvals',
      });
    }

    // Near SLA warning
    if (nearSLA.length > 0) {
      actions.push({
        rank: actions.length + 1,
        urgency: 'Medium',
        icon: '⚠️',
        action: `${nearSLA.length} complaint${nearSLA.length > 1 ? 's' : ''} approaching SLA limit`,
        detail: nearSLA.slice(0, 2).map(c => `${c.complaint_number} (${Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000)}d)`).join(', '),
        module: 'SLA Tracker',
        href: '/sla',
      });
    }

    // High severity (if no critical)
    if (criticalOpen.length === 0 && highOpen.length > 0) {
      actions.push({
        rank: actions.length + 1,
        urgency: 'Medium',
        icon: '🔶',
        action: `Review ${highOpen.length} High severity open complaint${highOpen.length > 1 ? 's' : ''}`,
        detail: highOpen.slice(0, 2).map(c => `${c.complaint_number} · ${c.customer_name ?? c.customer}`).join(' | '),
        module: 'Complaints',
        href: '/complaints',
      });
    }

    // Calibrations due this week
    if (calThisWeek.length > 0) {
      actions.push({
        rank: actions.length + 1,
        urgency: 'Medium',
        icon: '📅',
        action: `${calThisWeek.length} calibration${calThisWeek.length > 1 ? 's' : ''} due this week`,
        detail: calThisWeek.slice(0, 2).map(e => `${e.name} (${e.daysLeft}d left)`).join(', '),
        module: 'Calibration',
        href: '/calibration',
      });
    }

    // If no actions yet, add a default positive action
    if (actions.length === 0) {
      actions.push({
        rank: 1, urgency: 'Medium', icon: '✔',
        action: 'No urgent issues — conduct planned process walk',
        detail: 'Review operator workstations, verify SPC charts are updated, check poka-yoke devices',
        module: 'Manufacturing',
        href: '/manufacturing',
      });
    }

    // Re-number after filtering
    actions.forEach((a, i) => { a.rank = i + 1; });

    // ── Build AI narrative ────────────────────────────────────────────────────
    const narrative = buildNarrative(
      shiftCode,
      criticalOpen.length,
      slaBreaches.length,
      calOverdue.length,
      pendingApprovals.length,
      todayComplaints.length,
      openComplaints.length,
      ppm,
    );

    // ── WhatsApp text ─────────────────────────────────────────────────────────
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const waText = [
      `🏭 *QMOS Daily Quality Brief*`,
      `📅 ${dateStr} | ${shift}`,
      ``,
      `📊 *Status Snapshot*`,
      `• Open Complaints: ${openComplaints.length} (${criticalOpen.length} Critical, ${highOpen.length} High)`,
      `• SLA Breaches: ${slaBreaches.length}`,
      `• Cal. Overdue: ${calOverdue.length}`,
      `• PPM (30d): ${ppm.toLocaleString()}`,
      ``,
      `⚡ *Today's Priority Actions*`,
      ...actions.slice(0, 5).map(a => `${a.rank}. ${a.icon} ${a.action}`),
      ``,
      `_Generated by QMOS · Quality Management Operating System_`,
    ].join('\n');

    return NextResponse.json({
      date: now.toISOString(),
      shift,
      shiftCode,
      narrative,
      actions,
      snapshot: {
        totalOpen: openComplaints.length,
        criticalOpen: criticalOpen.length,
        highOpen: highOpen.length,
        todayCount: todayComplaints.length,
        slaBreaches: slaBreaches.length,
        nearSLA: nearSLA.length,
        calOverdue: calOverdue.length,
        calThisWeek: calThisWeek.length,
        pendingApprovals: pendingApprovals.length,
        ppm,
      },
      waText,
      fetchedAt: now.toISOString(),
    });

  } catch (err) {
    console.error('daily-brief error:', err);
    return NextResponse.json({});
  }
}
