export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendCapaDueAlerts, CapaDueItem } from '@/lib/mailer';
import { sendCapaWhatsAppAlert } from '@/lib/whatsapp';

/**
 * GET /api/capa-alerts?secret=QMOS_DAILY_SECRET
 *
 * Called by the PM2 cron script every morning alongside the daily report.
 * Queries all open CAPA actions and sends an email alert for:
 *   - Overdue: target_date < today AND status != Completed/Cancelled
 *   - Due soon: target_date within next 3 days AND status != Completed/Cancelled
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.DAILY_REPORT_SECRET || 'QMOS_DAILY_2026';

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── Fetch company_id ─────────────────────────────────────────────────────
    let { data: company, error: companyError } = await supabaseAdmin
      .from('companies').select('id, code').eq('code', 'BALESH001').single();

    if (!company) {
      console.warn('[capa-alerts] BALESH001 not found, error:', companyError?.message);
      const { data: firstCompany, error: fallbackError } = await supabaseAdmin
        .from('companies').select('id, code').limit(1).single();
      if (!firstCompany) {
        console.error('[capa-alerts] No companies found. Fallback error:', fallbackError?.message);
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      console.log('[capa-alerts] Using fallback company:', firstCompany.code, firstCompany.id);
      company = firstCompany;
    }

    // ── Date helpers ─────────────────────────────────────────────────────────
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const todayStr = now.toISOString().slice(0, 10);

    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().slice(0, 10);

    // ── Fetch all open CAPA actions with their complaint details ─────────────
    const { data: actions, error } = await supabaseAdmin
      .from('capa_actions')
      .select(`
        id,
        action_number,
        action_description,
        responsible_person,
        target_date,
        status,
        complaint_id,
        complaints!inner (
          company_id,
          complaint_number,
          customer_name
        )
      `)
      .not('status', 'in', '("Completed","Cancelled","Closed")')
      .not('target_date', 'is', null)
      .eq('complaints.company_id', company.id);

    if (error) {
      console.error('[capa-alerts] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allActions = actions ?? [];

    // ── Classify each action ─────────────────────────────────────────────────
    const overdue: CapaDueItem[]  = [];
    const dueSoon: CapaDueItem[]  = [];

    for (const a of allActions) {
      if (!a.target_date) continue;

      const targetDate = new Date(a.target_date);
      targetDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / 86400000);
      // diffDays > 0 → overdue; diffDays <= 0 → upcoming

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const complaint = (a as any).complaints as {
        complaint_number: string;
        customer_name: string;
      } | null;

      const item: CapaDueItem = {
        complaint_number:   complaint?.complaint_number ?? '—',
        customer_name:      complaint?.customer_name ?? '—',
        action_number:      a.action_number,
        action_description: a.action_description ?? '',
        responsible_person: a.responsible_person ?? '',
        target_date:        a.target_date,
        days_overdue:       diffDays,
        status:             a.status,
      };

      if (a.target_date < todayStr) {
        // target date is in the past → overdue
        overdue.push(item);
      } else if (a.target_date >= todayStr && a.target_date <= in3DaysStr) {
        // target date is today or within 3 days → due soon (days_overdue will be 0 or negative)
        dueSoon.push(item);
      }
    }

    // Sort overdue by most overdue first
    overdue.sort((a, b) => b.days_overdue - a.days_overdue);
    // Sort due-soon by soonest first
    dueSoon.sort((a, b) => a.target_date.localeCompare(b.target_date));

    // ── Send alerts (email + WhatsApp) ───────────────────────────────────────
    await Promise.all([
      sendCapaDueAlerts(overdue, dueSoon),
      sendCapaWhatsAppAlert(overdue, dueSoon),
    ]);

    return NextResponse.json({
      sent: true,
      todayStr,
      overdue:  overdue.length,
      dueSoon:  dueSoon.length,
      total:    allActions.length,
    });

  } catch (err) {
    console.error('[capa-alerts] Error:', err);
    return NextResponse.json({ error: 'Failed to run CAPA alert check' }, { status: 500 });
  }
}
