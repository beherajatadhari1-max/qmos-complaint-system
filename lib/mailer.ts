/**
 * QMOS Mailer — Critical Complaint Email Alert
 * Uses Nodemailer with Gmail SMTP (or any SMTP provider).
 *
 * Config in .env.local:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_TO, NEXT_PUBLIC_APP_URL
 *
 * Gmail setup:
 *   1. Enable 2-Step Verification on your Google Account
 *   2. Go to: myaccount.google.com → Security → App Passwords
 *   3. Generate password for "Mail" → paste into SMTP_PASS
 */

import nodemailer from 'nodemailer';

// Lazy transporter — only created when SMTP is configured
function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface AlertComplaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  part_number:   string;
  part_name:     string;
  defect_description: string;
  severity:      string;
  assigned_to:   string;
  defect_category?: string;
  quantity_affected?: number;
}

// ── Daily Quality Summary Report ──────────────────────────────────────────────
export interface DailySummary {
  date: string;
  total: number;
  open: number;
  critical: number;
  overdue: number;   // open > 14 days
  closedToday: number;
  newToday: number;
  topDefects: { category: string; count: number }[];
  criticalList: { complaint_number: string; customer_name: string; days: number; assigned_to: string }[];
  overdueList: { complaint_number: string; customer_name: string; days: number; severity: string }[];
}

export async function sendDailySummary(summary: DailySummary): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ALERT_TO) {
    console.log('[QMOS Mailer] SMTP not configured — skipping daily summary');
    return;
  }

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const alertTo = process.env.ALERT_TO;

  const defectRows = summary.topDefects.slice(0, 5).map(d =>
    `<tr style="border-top:1px solid #e5e7eb;">
       <td style="padding:6px 8px;color:#374151;">${d.category}</td>
       <td style="padding:6px 8px;text-align:center;font-weight:bold;color:#1d4ed8;">${d.count}</td>
     </tr>`
  ).join('');

  const criticalRows = summary.criticalList.slice(0, 5).map(c =>
    `<tr style="border-top:1px solid #fee2e2;">
       <td style="padding:6px 8px;font-family:monospace;color:#dc2626;font-weight:bold;">${c.complaint_number}</td>
       <td style="padding:6px 8px;color:#111;">${c.customer_name}</td>
       <td style="padding:6px 8px;text-align:center;color:#dc2626;font-weight:bold;">${c.days}d</td>
       <td style="padding:6px 8px;color:#6b7280;">${c.assigned_to || 'Unassigned'}</td>
     </tr>`
  ).join('');

  const overdueRows = summary.overdueList.slice(0, 5).map(c =>
    `<tr style="border-top:1px solid #fef3c7;">
       <td style="padding:6px 8px;font-family:monospace;color:#92400e;font-weight:bold;">${c.complaint_number}</td>
       <td style="padding:6px 8px;color:#111;">${c.customer_name}</td>
       <td style="padding:6px 8px;text-align:center;font-weight:bold;color:#b45309;">${c.days}d</td>
       <td style="padding:6px 8px;"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px;">${c.severity}</span></td>
     </tr>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:620px;margin:24px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:24px 28px;">
    <div style="font-size:20px;font-weight:bold;color:#fff;margin-bottom:4px;">📊 Daily Quality Report</div>
    <div style="font-size:13px;color:#bfdbfe;">${summary.date} · QMOS Quality Management System</div>
  </div>

  <!-- KPI Strip -->
  <div style="background:#fff;padding:20px 28px;display:flex;gap:12px;border-bottom:1px solid #e5e7eb;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="text-align:center;padding:8px 4px;border-right:1px solid #e5e7eb;">
          <div style="font-size:28px;font-weight:bold;color:#1d4ed8;">${summary.open}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">Open</div>
        </td>
        <td style="text-align:center;padding:8px 4px;border-right:1px solid #e5e7eb;">
          <div style="font-size:28px;font-weight:bold;color:#dc2626;">${summary.critical}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">Critical</div>
        </td>
        <td style="text-align:center;padding:8px 4px;border-right:1px solid #e5e7eb;">
          <div style="font-size:28px;font-weight:bold;color:#b45309;">${summary.overdue}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">Overdue (&gt;14d)</div>
        </td>
        <td style="text-align:center;padding:8px 4px;border-right:1px solid #e5e7eb;">
          <div style="font-size:28px;font-weight:bold;color:#16a34a;">${summary.closedToday}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">Closed Today</div>
        </td>
        <td style="text-align:center;padding:8px 4px;">
          <div style="font-size:28px;font-weight:bold;color:#7c3aed;">${summary.newToday}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">New Today</div>
        </td>
      </tr>
    </table>
  </div>

  ${summary.criticalList.length > 0 ? `
  <!-- Critical Complaints -->
  <div style="background:#fff7f7;padding:20px 28px;border-bottom:1px solid #fee2e2;">
    <div style="font-weight:bold;color:#dc2626;margin-bottom:10px;font-size:14px;">🚨 Open Critical Complaints</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#fee2e2;">
        <th style="padding:6px 8px;text-align:left;color:#991b1b;">Complaint No.</th>
        <th style="padding:6px 8px;text-align:left;color:#991b1b;">Customer</th>
        <th style="padding:6px 8px;text-align:center;color:#991b1b;">Days Open</th>
        <th style="padding:6px 8px;text-align:left;color:#991b1b;">Assigned To</th>
      </tr>
      ${criticalRows}
    </table>
  </div>` : ''}

  ${summary.overdueList.length > 0 ? `
  <!-- Overdue Complaints -->
  <div style="background:#fffbeb;padding:20px 28px;border-bottom:1px solid #fde68a;">
    <div style="font-weight:bold;color:#92400e;margin-bottom:10px;font-size:14px;">⏰ Overdue Complaints (&gt;14 days)</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#fef3c7;">
        <th style="padding:6px 8px;text-align:left;color:#78350f;">Complaint No.</th>
        <th style="padding:6px 8px;text-align:left;color:#78350f;">Customer</th>
        <th style="padding:6px 8px;text-align:center;color:#78350f;">Days Open</th>
        <th style="padding:6px 8px;text-align:left;color:#78350f;">Severity</th>
      </tr>
      ${overdueRows}
    </table>
  </div>` : ''}

  ${summary.topDefects.length > 0 ? `
  <!-- Top Defect Categories -->
  <div style="background:#fff;padding:20px 28px;border-bottom:1px solid #e5e7eb;">
    <div style="font-weight:bold;color:#1e40af;margin-bottom:10px;font-size:14px;">📈 Top Defect Categories (Open)</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#eff6ff;">
        <th style="padding:6px 8px;text-align:left;color:#1e40af;">Category</th>
        <th style="padding:6px 8px;text-align:center;color:#1e40af;">Count</th>
      </tr>
      ${defectRows}
    </table>
  </div>` : ''}

  <!-- CTA -->
  <div style="background:#fff;padding:20px 28px;text-align:center;">
    <a href="${appUrl}"
       style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
      Open QMOS Dashboard →
    </a>
    <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;">
      Automated daily report · QMOS Quality Management System · ${summary.date}
    </p>
  </div>

</div>
</body>
</html>`;

  try {
    const transporter = getTransporter();
    const urgency = summary.critical > 0 ? '🚨 ' : summary.overdue > 0 ? '⚠️ ' : '📊 ';
    await transporter.sendMail({
      from:    `"QMOS Daily Report" <${process.env.SMTP_USER}>`,
      to:      alertTo,
      subject: `${urgency}QMOS Daily Report — ${summary.open} Open | ${summary.critical} Critical | ${summary.overdue} Overdue — ${summary.date}`,
      html,
    });
    console.log(`[QMOS Mailer] Daily summary sent → ${alertTo}`);
  } catch (err) {
    console.error('[QMOS Mailer] Failed to send daily summary:', err);
  }
}

// ── CAPA Due-Date Alert ────────────────────────────────────────────────────────
export interface CapaDueItem {
  complaint_number: string;
  customer_name: string;
  action_number: number;
  action_description: string;
  responsible_person: string;
  target_date: string;          // YYYY-MM-DD
  days_overdue: number;         // negative = days until due
  status: string;
}

export async function sendCapaDueAlerts(
  overdue: CapaDueItem[],
  dueSoon: CapaDueItem[],        // due within next 3 days
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ALERT_TO) {
    console.log('[QMOS Mailer] SMTP not configured — skipping CAPA due alert');
    return;
  }
  if (overdue.length === 0 && dueSoon.length === 0) {
    console.log('[QMOS Mailer] No CAPA alerts to send today');
    return;
  }

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const alertTo = process.env.ALERT_TO;
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const overdueRows = overdue.map(r => `
    <tr style="border-top:1px solid #fee2e2;">
      <td style="padding:7px 8px;font-family:monospace;color:#dc2626;font-weight:bold;font-size:12px;">${r.complaint_number}</td>
      <td style="padding:7px 8px;color:#111;font-size:12px;">${r.customer_name}</td>
      <td style="padding:7px 8px;color:#111;font-size:12px;">Action #${r.action_number}</td>
      <td style="padding:7px 8px;color:#374151;font-size:12px;max-width:180px;">${String(r.action_description).slice(0, 60)}${r.action_description.length > 60 ? '…' : ''}</td>
      <td style="padding:7px 8px;color:#374151;font-size:12px;">${r.responsible_person || '—'}</td>
      <td style="padding:7px 8px;color:#dc2626;font-weight:bold;font-size:12px;">${fmtDate(r.target_date)}</td>
      <td style="padding:7px 8px;text-align:center;">
        <span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;">
          ${r.days_overdue}d OVERDUE
        </span>
      </td>
    </tr>`).join('');

  const dueSoonRows = dueSoon.map(r => `
    <tr style="border-top:1px solid #fde68a;">
      <td style="padding:7px 8px;font-family:monospace;color:#92400e;font-weight:bold;font-size:12px;">${r.complaint_number}</td>
      <td style="padding:7px 8px;color:#111;font-size:12px;">${r.customer_name}</td>
      <td style="padding:7px 8px;color:#111;font-size:12px;">Action #${r.action_number}</td>
      <td style="padding:7px 8px;color:#374151;font-size:12px;max-width:180px;">${String(r.action_description).slice(0, 60)}${r.action_description.length > 60 ? '…' : ''}</td>
      <td style="padding:7px 8px;color:#374151;font-size:12px;">${r.responsible_person || '—'}</td>
      <td style="padding:7px 8px;color:#92400e;font-weight:bold;font-size:12px;">${fmtDate(r.target_date)}</td>
      <td style="padding:7px 8px;text-align:center;">
        <span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;">
          ${r.days_overdue === 0 ? 'DUE TODAY' : `Due in ${Math.abs(r.days_overdue)}d`}
        </span>
      </td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:760px;margin:24px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#b45309,#92400e);padding:24px 28px;">
    <div style="font-size:20px;font-weight:bold;color:#fff;margin-bottom:4px;">⏰ CAPA Due-Date Alert</div>
    <div style="font-size:13px;color:#fde68a;">${todayStr} · QMOS Quality Management System</div>
  </div>

  <!-- Summary strip -->
  <div style="background:#fff;padding:16px 28px;border-bottom:1px solid #e5e7eb;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="text-align:center;padding:8px;border-right:1px solid #e5e7eb;">
          <div style="font-size:32px;font-weight:bold;color:#dc2626;">${overdue.length}</div>
          <div style="font-size:12px;color:#6b7280;">Overdue CAPAs</div>
        </td>
        <td style="text-align:center;padding:8px;">
          <div style="font-size:32px;font-weight:bold;color:#b45309;">${dueSoon.length}</div>
          <div style="font-size:12px;color:#6b7280;">Due within 3 days</div>
        </td>
      </tr>
    </table>
  </div>

  ${overdue.length > 0 ? `
  <!-- Overdue Table -->
  <div style="background:#fff7f7;padding:20px 28px;border-bottom:1px solid #fee2e2;">
    <div style="font-weight:bold;color:#dc2626;margin-bottom:12px;font-size:14px;">
      🚨 Overdue CAPA Actions — Immediate Action Required
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#fee2e2;">
        <th style="padding:7px 8px;text-align:left;color:#991b1b;font-size:11px;">Complaint No.</th>
        <th style="padding:7px 8px;text-align:left;color:#991b1b;font-size:11px;">Customer</th>
        <th style="padding:7px 8px;text-align:left;color:#991b1b;font-size:11px;">Action</th>
        <th style="padding:7px 8px;text-align:left;color:#991b1b;font-size:11px;">Description</th>
        <th style="padding:7px 8px;text-align:left;color:#991b1b;font-size:11px;">Responsible</th>
        <th style="padding:7px 8px;text-align:left;color:#991b1b;font-size:11px;">Due Date</th>
        <th style="padding:7px 8px;text-align:center;color:#991b1b;font-size:11px;">Status</th>
      </tr>
      ${overdueRows}
    </table>
  </div>` : ''}

  ${dueSoon.length > 0 ? `
  <!-- Due Soon Table -->
  <div style="background:#fffbeb;padding:20px 28px;border-bottom:1px solid #fde68a;">
    <div style="font-weight:bold;color:#92400e;margin-bottom:12px;font-size:14px;">
      ⚠️ CAPA Actions Due Within 3 Days
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#fef3c7;">
        <th style="padding:7px 8px;text-align:left;color:#78350f;font-size:11px;">Complaint No.</th>
        <th style="padding:7px 8px;text-align:left;color:#78350f;font-size:11px;">Customer</th>
        <th style="padding:7px 8px;text-align:left;color:#78350f;font-size:11px;">Action</th>
        <th style="padding:7px 8px;text-align:left;color:#78350f;font-size:11px;">Description</th>
        <th style="padding:7px 8px;text-align:left;color:#78350f;font-size:11px;">Responsible</th>
        <th style="padding:7px 8px;text-align:left;color:#78350f;font-size:11px;">Due Date</th>
        <th style="padding:7px 8px;text-align:center;color:#78350f;font-size:11px;">Urgency</th>
      </tr>
      ${dueSoonRows}
    </table>
  </div>` : ''}

  <!-- IATF reminder -->
  <div style="background:#eff6ff;padding:16px 28px;border-bottom:1px solid #bfdbfe;">
    <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.6;">
      <strong>📋 IATF 16949 Cl. 10.2.1(f):</strong> Corrective actions must be implemented within defined target dates.
      Overdue CAPAs are a direct nonconformance finding during customer and certification audits.
      Escalate overdue actions to the responsible person and plant head immediately.
    </p>
  </div>

  <!-- CTA -->
  <div style="background:#fff;padding:20px 28px;text-align:center;">
    <a href="${appUrl}/capa"
       style="display:inline-block;background:#b45309;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
      Open CAPA Tracker →
    </a>
    <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;">
      Automated CAPA alert · QMOS Quality Management System · ${todayStr}
    </p>
  </div>

</div>
</body>
</html>`;

  try {
    const transporter = getTransporter();
    const hasOverdue = overdue.length > 0;
    const subject = hasOverdue
      ? `🚨 CAPA Alert — ${overdue.length} Overdue | ${dueSoon.length} Due Soon — ${todayStr}`
      : `⚠️ CAPA Alert — ${dueSoon.length} Action(s) Due Within 3 Days — ${todayStr}`;
    await transporter.sendMail({
      from:    `"QMOS CAPA Alert" <${process.env.SMTP_USER}>`,
      to:      alertTo,
      subject,
      html,
    });
    console.log(`[QMOS Mailer] CAPA due alert sent → ${alertTo} (${overdue.length} overdue, ${dueSoon.length} due-soon)`);
  } catch (err) {
    console.error('[QMOS Mailer] Failed to send CAPA alert:', err);
  }
}

export async function sendCriticalAlert(complaint: AlertComplaint): Promise<void> {
  // Skip silently if SMTP is not configured (complaint logging must never fail)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ALERT_TO) {
    console.log('[QMOS Mailer] SMTP not configured — skipping alert for', complaint.complaint_number);
    return;
  }

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const alertTo  = process.env.ALERT_TO; // comma-separated
  const loggedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:24px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:#dc2626;padding:24px 28px;">
      <div style="font-size:22px;font-weight:bold;color:#fff;margin-bottom:4px;">
        🚨 CRITICAL Quality Alert
      </div>
      <div style="font-size:13px;color:#fca5a5;">
        Immediate containment action required — QMOS Quality Management System
      </div>
    </div>

    <!-- Alert body -->
    <div style="background:#fff7f7;border-left:4px solid #dc2626;padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:7px 0;color:#6b7280;width:42%;vertical-align:top;">Complaint No.</td>
          <td style="padding:7px 0;font-weight:bold;color:#111;font-family:monospace;font-size:15px;">${complaint.complaint_number}</td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Customer</td>
          <td style="padding:7px 0;font-weight:bold;color:#111;">${complaint.customer_name}</td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Part</td>
          <td style="padding:7px 0;color:#111;">${[complaint.part_number, complaint.part_name].filter(Boolean).join(' — ') || '—'}</td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Category</td>
          <td style="padding:7px 0;color:#111;">${complaint.defect_category || '—'}</td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Qty Affected</td>
          <td style="padding:7px 0;font-weight:bold;color:#dc2626;">${complaint.quantity_affected ?? 0} pcs</td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Defect Description</td>
          <td style="padding:7px 0;color:#111;line-height:1.5;">${complaint.defect_description}</td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Severity</td>
          <td style="padding:7px 0;">
            <span style="background:#dc2626;color:#fff;padding:3px 12px;border-radius:4px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">CRITICAL</span>
          </td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Assigned To</td>
          <td style="padding:7px 0;color:#111;">${complaint.assigned_to || 'Unassigned — please assign immediately'}</td>
        </tr>
        <tr style="border-top:1px solid #fee2e2;">
          <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Logged At</td>
          <td style="padding:7px 0;color:#111;">${loggedAt}</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="background:#fff;padding:20px 28px;text-align:center;border-top:1px solid #fee2e2;">
      <a href="${appUrl}/complaints/${complaint.id}"
         style="display:inline-block;background:#dc2626;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;letter-spacing:0.3px;">
        Open Complaint in QMOS →
      </a>
      <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;line-height:1.6;">
        ⚠ Critical complaints require immediate containment within <strong>2 hours</strong> per IATF 16949 clause 8.7.<br>
        This is an automated alert from QMOS — Quality Management Operating System.
      </p>
    </div>

  </div>
</body>
</html>`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from:    `"QMOS Alert 🚨" <${process.env.SMTP_USER}>`,
      to:      alertTo,
      subject: `🚨 CRITICAL — ${complaint.complaint_number} | ${complaint.customer_name} | Immediate Action Required`,
      html,
    });
    console.log(`[QMOS Mailer] Critical alert sent → ${alertTo} for ${complaint.complaint_number}`);
  } catch (err) {
    // Log but never throw — complaint is already saved, email is best-effort
    console.error('[QMOS Mailer] Failed to send alert:', err);
  }
}
