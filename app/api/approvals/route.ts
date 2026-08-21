export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

// ── Session helpers ───────────────────────────────────────────────────────────
async function getSession() {
  try {
    const cookieStore = await cookies();
    const c = cookieStore.get('qmos_session');
    if (c?.value) return JSON.parse(c.value);
  } catch { /* ignore */ }
  return null;
}

async function getCompanyId(): Promise<string | null> {
  const sess = await getSession();
  if (sess?.company_id) return sess.company_id;
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

// ── Approval email ─────────────────────────────────────────────────────────────
async function sendApprovalEmail(opts: {
  action: 'approved' | 'rejected';
  complaintNumber: string;
  customerName: string;
  severity: string;
  approvedBy: string;
  reason?: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ALERT_TO) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const color  = opts.action === 'approved' ? '#16a34a' : '#dc2626';
  const label  = opts.action === 'approved' ? '✅ APPROVED' : '❌ REJECTED';

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from:    `"QMOS Quality System" <${process.env.SMTP_USER}>`,
    to:      process.env.ALERT_TO,
    subject: `[QMOS] Complaint ${opts.action.toUpperCase()} — ${opts.complaintNumber} | ${opts.customerName}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:24px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1);">
  <div style="background:${color};padding:20px 24px;">
    <div style="font-size:20px;font-weight:bold;color:#fff;">${label} for Closure</div>
    <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:4px;">QMOS Quality Management System</div>
  </div>
  <div style="background:#fff;padding:24px;">
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:7px 0;color:#6b7280;width:40%">Complaint No.</td><td style="padding:7px 0;font-weight:bold;font-family:monospace">${opts.complaintNumber}</td></tr>
      <tr style="border-top:1px solid #f3f4f6"><td style="padding:7px 0;color:#6b7280">Customer</td><td style="padding:7px 0;font-weight:bold">${opts.customerName}</td></tr>
      <tr style="border-top:1px solid #f3f4f6"><td style="padding:7px 0;color:#6b7280">Severity</td><td style="padding:7px 0">${opts.severity}</td></tr>
      <tr style="border-top:1px solid #f3f4f6"><td style="padding:7px 0;color:#6b7280">Action by</td><td style="padding:7px 0">${opts.approvedBy}</td></tr>
      ${opts.reason ? `<tr style="border-top:1px solid #f3f4f6"><td style="padding:7px 0;color:#6b7280;vertical-align:top">Reason</td><td style="padding:7px 0;color:#dc2626">${opts.reason}</td></tr>` : ''}
    </table>
    <div style="margin-top:20px">
      <a href="${appUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold">Open QMOS →</a>
    </div>
  </div>
</div>
</body></html>`,
  }).catch(e => console.error('[QMOS Approvals Mailer]', e));
}

// ── GET — fetch all items needing approval ────────────────────────────────────
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // Complaints pending approval (approval_status = 'pending' or null, status = 'Pending Closure')
    const { data: pendingComplaints } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, customer_name, severity, status, created_at, assigned_to, defect_description, defect_category, part_number, part_name, approval_status, approved_by, approved_at')
      .eq('company_id', companyId)
      .in('status', ['Pending Closure', 'Pending Verification', 'CAPA In Progress'])
      .order('created_at', { ascending: false });

    // Recently approved (last 30 days) for the history tab
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const { data: recentApproved } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, customer_name, severity, status, created_at, assigned_to, approval_status, approved_by, approved_at')
      .eq('company_id', companyId)
      .eq('approval_status', 'approved')
      .gte('approved_at', since30.toISOString())
      .order('approved_at', { ascending: false })
      .limit(20);

    const { data: recentRejected } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, customer_name, severity, status, created_at, assigned_to, approval_status, approved_by, approved_at')
      .eq('company_id', companyId)
      .eq('approval_status', 'rejected')
      .gte('created_at', since30.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const pending = (pendingComplaints ?? []).filter(c =>
      !c.approval_status || c.approval_status === 'pending'
    );

    return NextResponse.json({
      pending,
      approved: recentApproved ?? [],
      rejected: recentRejected ?? [],
      counts: {
        pending: pending.length,
        approved: (recentApproved ?? []).length,
        rejected: (recentRejected ?? []).length,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

// ── POST — approve or reject a complaint ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const { complaintId, action, approvedBy, reason } = body;

    if (!complaintId || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request — complaintId and action required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updatePayload =
      action === 'approved'
        ? { approval_status: 'approved', approved_by: approvedBy || 'Quality Head', approved_at: now }
        : { approval_status: 'rejected', approved_by: approvedBy || 'Quality Head', approved_at: now };

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .update(updatePayload)
      .eq('id', complaintId)
      .eq('company_id', companyId)
      .select('complaint_number, customer_name, severity, defect_description')
      .single();

    if (error) throw error;

    // Log to timeline
    await supabaseAdmin.from('complaint_timeline').insert({
      complaint_id: complaintId,
      action: `Complaint ${action === 'approved' ? 'APPROVED' : 'REJECTED'} for closure by ${approvedBy || 'Quality Head'}${reason ? ` — Reason: ${reason}` : ''}`,
      performed_by: approvedBy || 'Quality Head',
    });

    // Send email (non-blocking)
    sendApprovalEmail({
      action,
      complaintNumber: complaint.complaint_number,
      customerName:    complaint.customer_name,
      severity:        complaint.severity,
      approvedBy:      approvedBy || 'Quality Head',
      reason,
    }).catch(() => {});

    return NextResponse.json({ success: true, complaint });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
