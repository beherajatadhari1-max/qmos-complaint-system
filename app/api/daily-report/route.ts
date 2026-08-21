import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendDailySummary, DailySummary } from '@/lib/mailer';
import { sendDailyWhatsAppSummary } from '@/lib/whatsapp';

// ── GET /api/daily-report?secret=QMOS_DAILY_SECRET ────────────────────────────
// Called by the PM2 cron script every morning at 8:00 AM.
// Secured by a shared secret token in .env.local (DAILY_REPORT_SECRET).
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.DAILY_REPORT_SECRET || 'QMOS_DAILY_2026';

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── Fetch company_id ───────────────────────────────────────────────────────
    let { data: company, error: companyError } = await supabaseAdmin
      .from('companies').select('id, code').eq('code', 'BALESH001').single();

    // Fallback: if BALESH001 not found, use whichever company exists
    if (!company) {
      console.warn('[daily-report] BALESH001 not found, error:', companyError?.message);
      const { data: firstCompany, error: fallbackError } = await supabaseAdmin
        .from('companies').select('id, code').limit(1).single();
      if (!firstCompany) {
        console.error('[daily-report] No companies found at all. Fallback error:', fallbackError?.message);
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      console.log('[daily-report] Using fallback company:', firstCompany.code, firstCompany.id);
      company = firstCompany;
    }

    const companyId = company.id;

    // ── Fetch all complaints ───────────────────────────────────────────────────
    const { data: all } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, customer_name, severity, status, defect_category, assigned_to, created_at, updated_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    const complaints = all ?? [];
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);

    const daysDiff = (d: string) => Math.floor((now - new Date(d).getTime()) / 86400000);

    const open     = complaints.filter(c => !['Closed', 'Cancelled'].includes(c.status));
    const critical = open.filter(c => c.severity === 'Critical');
    const overdue  = open.filter(c => daysDiff(c.created_at) > 14);

    const closedToday = complaints.filter(c =>
      c.status === 'Closed' && (c.updated_at || '').slice(0, 10) === todayStr
    ).length;

    const newToday = complaints.filter(c =>
      (c.created_at || '').slice(0, 10) === todayStr
    ).length;

    // Top defect categories from open complaints
    const catMap: Record<string, number> = {};
    for (const c of open) {
      const cat = c.defect_category || 'Uncategorised';
      catMap[cat] = (catMap[cat] ?? 0) + 1;
    }
    const topDefects = Object.entries(catMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const summary: DailySummary = {
      date:         new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      total:        complaints.length,
      open:         open.length,
      critical:     critical.length,
      overdue:      overdue.length,
      closedToday,
      newToday,
      topDefects,
      criticalList: critical.slice(0, 5).map(c => ({
        complaint_number: c.complaint_number,
        customer_name:    c.customer_name || 'Unknown',
        days:             daysDiff(c.created_at),
        assigned_to:      c.assigned_to || '',
      })),
      overdueList: overdue
        .sort((a, b) => daysDiff(b.created_at) - daysDiff(a.created_at))
        .slice(0, 5)
        .map(c => ({
          complaint_number: c.complaint_number,
          customer_name:    c.customer_name || 'Unknown',
          days:             daysDiff(c.created_at),
          severity:         c.severity || 'Medium',
        })),
    };

    await Promise.all([
      sendDailySummary(summary),
      sendDailyWhatsAppSummary(summary),
    ]);

    return NextResponse.json({
      sent: true,
      summary: {
        open:    summary.open,
        critical: summary.critical,
        overdue:  summary.overdue,
        closedToday: summary.closedToday,
        newToday:    summary.newToday,
      },
    });

  } catch (err) {
    console.error('[daily-report] Error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
