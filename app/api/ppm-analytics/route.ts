export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('qmos_session');
    if (sessionCookie?.value) {
      const session = JSON.parse(sessionCookie.value);
      if (session?.company_id) return session.company_id;
    }
  } catch { /* ignore */ }
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // Fetch last 18 months of complaints
    const since = new Date();
    since.setMonth(since.getMonth() - 18);

    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('id, created_at, severity, defect_category, quantity_affected, total_supplied, customer, customer_name, status')
      .eq('company_id', companyId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const rows = complaints ?? [];

    // ── Build monthly buckets ──────────────────────────────────────
    const monthMap: Record<string, {
      label: string; yearMonth: string;
      defects: number; supplied: number; ppm: number;
      critical: number; high: number; medium: number; low: number;
      categories: Record<string, number>;
      customers: Record<string, number>;
    }> = {};

    // Fill last 18 months with zeros so chart has full range
    for (let i = 17; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthMap[ym] = { label, yearMonth: ym, defects: 0, supplied: 0, ppm: 0, critical: 0, high: 0, medium: 0, low: 0, categories: {}, customers: {} };
    }

    rows.forEach(c => {
      const d = new Date(c.created_at);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[ym]) return;
      const m = monthMap[ym];
      const qty = Number(c.quantity_affected) || 1;
      const sup = Number(c.total_supplied) || 0;
      m.defects += qty;
      m.supplied += sup;
      const sev = (c.severity ?? '').toLowerCase();
      if (sev === 'critical') m.critical++;
      else if (sev === 'high') m.high++;
      else if (sev === 'medium') m.medium++;
      else m.low++;
      const cat = c.defect_category || 'Other';
      m.categories[cat] = (m.categories[cat] ?? 0) + 1;
      const cust = c.customer_name || 'Unknown';
      m.customers[cust] = (m.customers[cust] ?? 0) + 1;
    });

    // Calculate PPM = (defects / supplied) × 1,000,000
    // Use rolling total supplied if individual supplied = 0
    const avgSupplied = rows.reduce((s, c) => s + (Number(c.total_supplied) || 0), 0) / Math.max(rows.length, 1) || 10000;
    const months = Object.values(monthMap).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    months.forEach(m => {
      const sup = m.supplied > 0 ? m.supplied : avgSupplied;
      m.ppm = Math.round((m.defects / sup) * 1_000_000);
    });

    // ── Linear regression for trend + 3-month forecast ───────────
    const actual = months.map((m, i) => ({ x: i, y: m.ppm }));
    const n = actual.length;
    const sumX  = actual.reduce((s, p) => s + p.x, 0);
    const sumY  = actual.reduce((s, p) => s + p.y, 0);
    const sumXY = actual.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = actual.reduce((s, p) => s + p.x * p.x, 0);
    const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n;
    const trendLine = actual.map(p => Math.max(0, Math.round(slope * p.x + intercept)));

    // 3-month forecast
    const forecastMonths: { label: string; yearMonth: string; ppm: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const predicted = Math.max(0, Math.round(slope * (n + i - 1) + intercept));
      forecastMonths.push({ label, yearMonth: ym, ppm: predicted });
    }

    // ── SPC Control Limits ────────────────────────────────────────
    const ppmValues = months.map(m => m.ppm);
    const mean = ppmValues.reduce((s, v) => s + v, 0) / ppmValues.length || 0;
    const stdDev = Math.sqrt(ppmValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / ppmValues.length) || 0;
    const ucl = Math.round(mean + 3 * stdDev);
    const lcl = Math.max(0, Math.round(mean - 3 * stdDev));

    // ── Category breakdown (overall) ─────────────────────────────
    const categoryTotals: Record<string, number> = {};
    months.forEach(m => Object.entries(m.categories).forEach(([k, v]) => {
      categoryTotals[k] = (categoryTotals[k] ?? 0) + v;
    }));
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    // ── Customer breakdown ────────────────────────────────────────
    const customerTotals: Record<string, number> = {};
    months.forEach(m => Object.entries(m.customers).forEach(([k, v]) => {
      customerTotals[k] = (customerTotals[k] ?? 0) + v;
    }));
    const topCustomers = Object.entries(customerTotals)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // ── AI Insight (rule-based) ───────────────────────────────────
    const trendDir = slope > 5 ? 'worsening' : slope < -5 ? 'improving' : 'stable';
    const lastPPM = months[months.length - 1]?.ppm ?? 0;
    const prevPPM = months[months.length - 2]?.ppm ?? 0;
    const momChange = prevPPM > 0 ? Math.round(((lastPPM - prevPPM) / prevPPM) * 100) : 0;
    const outOfControl = months.filter(m => m.ppm > ucl).length;
    const forecastNext = forecastMonths[0]?.ppm ?? 0;
    const topCategory = topCategories[0]?.name ?? 'Unknown';

    const insights: string[] = [];
    if (trendDir === 'worsening') insights.push(`⚠️ PPM trend is WORSENING (slope +${slope.toFixed(1)}/month). Forecast: ${forecastNext} PPM next month. Immediate RCA required.`);
    else if (trendDir === 'improving') insights.push(`✅ PPM trend is IMPROVING (slope ${slope.toFixed(1)}/month). Forecast: ${forecastNext} PPM next month. Sustain current controls.`);
    else insights.push(`📊 PPM trend is STABLE. Forecast: ${forecastNext} PPM next month. Monitor for shifts.`);
    if (outOfControl > 0) insights.push(`🚨 ${outOfControl} month(s) exceeded UCL (${ucl} PPM). Review special cause variation — was there a process change, new supplier, or product launch?`);
    if (Math.abs(momChange) >= 20) insights.push(`${momChange > 0 ? '📈' : '📉'} Last month PPM ${momChange > 0 ? 'jumped' : 'dropped'} ${Math.abs(momChange)}% vs prior month (${lastPPM} vs ${prevPPM}). ${momChange > 0 ? 'Investigate root cause.' : 'Good — verify this is sustained.'}`);
    if (topCategory) insights.push(`🔍 Top defect category: "${topCategory}" (${topCategories[0]?.count} complaints). Prioritise PFMEA review and control plan update for this category.`);
    if (forecastNext > 500) insights.push(`🚨 Predicted PPM (${forecastNext}) will breach typical OEM target of 500 PPM within 1 month if trend continues. Escalate to Quality Head and initiate cross-functional review.`);

    return NextResponse.json({
      months: months.map(m => ({ ...m, categories: Object.entries(m.categories).map(([k, v]) => ({ name: k, count: v })), customers: Object.entries(m.customers).map(([k, v]) => ({ name: k, count: v })) })),
      forecast: forecastMonths,
      trendLine,
      spc: { mean: Math.round(mean), ucl, lcl, stdDev: Math.round(stdDev) },
      slope: Math.round(slope * 100) / 100,
      trendDir,
      topCategories,
      topCustomers,
      insights,
      summary: {
        totalComplaints: rows.length,
        totalDefects: rows.reduce((s, c) => s + (Number(c.quantity_affected) || 1), 0),
        currentPPM: lastPPM,
        momChange,
        forecastNext,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to compute PPM analytics' }, { status: 500 });
  }
}
