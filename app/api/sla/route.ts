export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

// ── SLA definitions (days to close) ──────────────────────────────────────────
export const SLA_DAYS: Record<string, number> = {
  Critical: 7,
  High:     14,
  Medium:   30,
  Low:      45,
};

// ── Status thresholds ──────────────────────────────────────────────────────────
// breached  = days_open > sla_days
// warning   = remaining <= 25% of SLA days
// caution   = remaining <= 50% of SLA days
// on_track  = remaining > 50% of SLA days

type SLAStatus = 'breached' | 'warning' | 'caution' | 'on_track' | 'closed';

export interface SLARecord {
  id: string;
  complaint_number: string;
  customer_name: string;
  severity: string;
  status: string;
  created_at: string;
  assigned_to: string;
  defect_category: string;
  sla_days: number;
  days_open: number;
  days_remaining: number;
  sla_status: SLAStatus;
  pct_used: number;             // 0–100+
  target_close_date: string;    // ISO
}

function calcSLA(complaint: {
  id: string; complaint_number: string; customer_name: string;
  severity: string; status: string; created_at: string;
  assigned_to: string; defect_category: string;
}): SLARecord {
  const slaDays     = SLA_DAYS[complaint.severity] ?? 30;
  const created     = new Date(complaint.created_at);
  const daysOpen    = Math.floor((Date.now() - created.getTime()) / 86400000);
  const daysRemaining = slaDays - daysOpen;
  const pctUsed     = Math.min(Math.round((daysOpen / slaDays) * 100), 999);

  const targetClose = new Date(created);
  targetClose.setDate(targetClose.getDate() + slaDays);

  let slaStatus: SLAStatus;
  if (['Closed', 'Cancelled'].includes(complaint.status)) {
    slaStatus = 'closed';
  } else if (daysRemaining < 0) {
    slaStatus = 'breached';
  } else if (daysRemaining <= slaDays * 0.25) {
    slaStatus = 'warning';
  } else if (daysRemaining <= slaDays * 0.5) {
    slaStatus = 'caution';
  } else {
    slaStatus = 'on_track';
  }

  return {
    ...complaint,
    sla_days: slaDays,
    days_open: daysOpen,
    days_remaining: daysRemaining,
    sla_status: slaStatus,
    pct_used: pctUsed,
    target_close_date: targetClose.toISOString(),
  };
}

// ── Session / company helpers ─────────────────────────────────────────────────
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

// ── Escalation emailer ────────────────────────────────────────────────────────
async function sendEscalationEmail(breached: SLARecord[], warning: SLARecord[]) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ALERT_TO) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const rowHtml = (r: SLARecord, highlight: string) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:8px 12px;font-family:monospace;font-weight:bold;color:#1d4ed8">${r.complaint_number}</td>
      <td style="padding:8px 12px">${r.customer_name}</td>
      <td style="padding:8px 12px;font-weight:bold;color:${r.severity === 'Critical' ? '#dc2626' : '#ea580c'}">${r.severity}</td>
      <td style="padding:8px 12px">${r.days_open}d open</td>
      <td style="padding:8px 12px;font-weight:bold;color:${highlight}">${r.days_remaining < 0 ? `BREACHED ${Math.abs(r.days_remaining)}d ago` : `${r.days_remaining}d left`}</td>
      <td style="padding:8px 12px">${r.assigned_to || '—'}</td>
    </tr>`;

  const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<div style="max-width:700px;margin:24px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1);">
  <div style="background:#dc2626;padding:20px 24px;">
    <div style="font-size:20px;font-weight:bold;color:#fff;">⏰ SLA Escalation Alert</div>
    <div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:4px;">${breached.length} breached · ${warning.length} at risk — QMOS Quality Management System</div>
  </div>
  <div style="background:#fff;padding:24px;">
    ${breached.length > 0 ? `
    <h3 style="color:#dc2626;margin:0 0 12px">🚨 SLA Breached (${breached.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
      <thead><tr style="background:#fef2f2;font-size:11px;text-transform:uppercase;color:#6b7280;">
        <th style="padding:8px 12px;text-align:left">Complaint</th>
        <th style="padding:8px 12px;text-align:left">Customer</th>
        <th style="padding:8px 12px;text-align:left">Severity</th>
        <th style="padding:8px 12px;text-align:left">Age</th>
        <th style="padding:8px 12px;text-align:left">Status</th>
        <th style="padding:8px 12px;text-align:left">Assigned</th>
      </tr></thead>
      <tbody>${breached.map(r => rowHtml(r, '#dc2626')).join('')}</tbody>
    </table>` : ''}
    ${warning.length > 0 ? `
    <h3 style="color:#ea580c;margin:0 0 12px">⚠️ SLA Warning — &lt;25% Time Remaining (${warning.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
      <thead><tr style="background:#fff7ed;font-size:11px;text-transform:uppercase;color:#6b7280;">
        <th style="padding:8px 12px;text-align:left">Complaint</th>
        <th style="padding:8px 12px;text-align:left">Customer</th>
        <th style="padding:8px 12px;text-align:left">Severity</th>
        <th style="padding:8px 12px;text-align:left">Age</th>
        <th style="padding:8px 12px;text-align:left">Time Left</th>
        <th style="padding:8px 12px;text-align:left">Assigned</th>
      </tr></thead>
      <tbody>${warning.map(r => rowHtml(r, '#ea580c')).join('')}</tbody>
    </table>` : ''}
    <a href="${appUrl}/sla" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">View SLA Dashboard →</a>
  </div>
</div>
</body></html>`;

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from:    `"QMOS Quality System" <${process.env.SMTP_USER}>`,
    to:      process.env.ALERT_TO,
    subject: `[QMOS] SLA Alert — ${breached.length} breached, ${warning.length} at risk`,
    html,
  }).catch(e => console.error('[QMOS SLA Mailer]', e));
}

// ── GET — SLA status for all open complaints ──────────────────────────────────
export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json([]);

    const url = new URL(req.url);
    const sendAlert = url.searchParams.get('alert') === 'true';

    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, customer_name, severity, status, created_at, assigned_to, defect_category')
      .eq('company_id', companyId)
      .not('status', 'in', '("Closed","Cancelled")')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const records = (complaints ?? []).map(calcSLA);

    const breached  = records.filter(r => r.sla_status === 'breached');
    const warning   = records.filter(r => r.sla_status === 'warning');
    const caution   = records.filter(r => r.sla_status === 'caution');
    const on_track  = records.filter(r => r.sla_status === 'on_track');

    // Send escalation email if requested (called by scheduled task or cron)
    if (sendAlert && (breached.length > 0 || warning.length > 0)) {
      sendEscalationEmail(breached, warning).catch(() => {});
    }

    return NextResponse.json({
      records,
      summary: {
        total:    records.length,
        breached: breached.length,
        warning:  warning.length,
        caution:  caution.length,
        on_track: on_track.length,
      },
      breached,
      warning,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ records: [], summary: { total:0, onTime:0, warning:0, breached:0 } });
  }
}
