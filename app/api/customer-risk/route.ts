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

// ── Rule-based customer risk narrative ───────────────────────────────────────
function buildNarrative(
  name: string,
  tier: 'Critical' | 'High' | 'Medium' | 'Low',
  openCount: number,
  criticalCount: number,
  ppm: number,
  closureRate: number,
  oldestOpenDays: number,
): string {
  const shortName = name.split(' ')[0];

  if (tier === 'Critical') {
    return `${shortName} is in CRITICAL risk zone — ${criticalCount} unresolved critical complaint${criticalCount > 1 ? 's' : ''} and ${openCount} total open. PPM at ${ppm.toLocaleString()} is above threshold. Immediate Quality Head intervention required. Customer escalation and emergency containment must be activated.`;
  }
  if (tier === 'High') {
    const agePart = oldestOpenDays > 30 ? ` Oldest complaint is ${oldestOpenDays} days old — SLA breach risk.` : '';
    return `${shortName} requires urgent attention — ${openCount} open complaints${criticalCount > 0 ? `, including ${criticalCount} critical` : ''}. Closure rate at ${closureRate}% indicates systemic follow-up gaps.${agePart} Assign dedicated Quality Engineer and schedule weekly review.`;
  }
  if (tier === 'Medium') {
    return `${shortName} is under monitoring. ${openCount} complaint${openCount !== 1 ? 's' : ''} open with ${closureRate}% closure rate. ${ppm > 0 ? `PPM stands at ${ppm.toLocaleString()}.` : ''} Maintain current controls and ensure CAPA effectiveness is verified before closure.`;
  }
  return `${shortName} performance is within acceptable limits. ${openCount === 0 ? 'No open complaints.' : `${openCount} minor complaint${openCount > 1 ? 's' : ''} under control.`} Continue proactive quality reviews to maintain customer satisfaction.`;
}

// ── Risk tier calculator ──────────────────────────────────────────────────────
function calcTier(
  openCount: number,
  criticalCount: number,
  ppm: number,
  closureRate: number,
): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (criticalCount >= 2 || (criticalCount >= 1 && openCount >= 5)) return 'Critical';
  if (criticalCount === 1 || openCount >= 5 || ppm > 2000) return 'High';
  if (openCount >= 2 || ppm > 500 || closureRate < 60) return 'Medium';
  return 'Low';
}

// ── GET /api/customer-risk ────────────────────────────────────────────────────
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // Fetch all complaints
    const { data: rawComplaints, error } = await supabaseAdmin
      .from('complaints')
      .select('id, status, severity, customer, customer_name, quantity_affected, total_supplied, defect_category, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const complaints = rawComplaints ?? [];

    // ── Aggregate by customer ─────────────────────────────────────────────────
    const custMap: Record<string, {
      name: string;
      total: number;
      open: number;
      closed: number;
      critical: number;
      totalRej: number;
      totalSup: number;
      oldestOpenMs: number;
      recentActivity: string[];
      monthCounts: Record<string, number>;
    }> = {};

    const now = Date.now();

    complaints.forEach(c => {
      const name = c.customer_name ?? 'Unknown';
      if (!custMap[name]) {
        custMap[name] = {
          name, total: 0, open: 0, closed: 0, critical: 0,
          totalRej: 0, totalSup: 0, oldestOpenMs: 0,
          recentActivity: [], monthCounts: {},
        };
      }
      const entry = custMap[name];
      entry.total++;
      const isOpen = !['Closed', 'Cancelled'].includes(c.status);
      if (isOpen) {
        entry.open++;
        const age = now - new Date(c.created_at).getTime();
        if (age > entry.oldestOpenMs) entry.oldestOpenMs = age;
      } else {
        entry.closed++;
      }
      if (c.severity === 'Critical') entry.critical++;
      entry.totalRej += c.quantity_affected ?? 0;
      entry.totalSup += c.total_supplied ?? 0;

      // Monthly trend (last 6 months)
      const d = new Date(c.created_at);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      entry.monthCounts[ym] = (entry.monthCounts[ym] ?? 0) + 1;

      // Recent activity (last 3 complaint categories)
      if (entry.recentActivity.length < 3 && c.defect_category) {
        entry.recentActivity.push(c.defect_category);
      }
    });

    // ── Build per-customer risk cards ─────────────────────────────────────────
    const customers = Object.values(custMap)
      .filter(c => c.total > 0)
      .map(c => {
        const ppm = c.totalSup > 0 ? Math.round((c.totalRej / c.totalSup) * 1_000_000) : 0;
        const closureRate = c.total > 0 ? Math.round((c.closed / c.total) * 100) : 0;
        const tier = calcTier(c.open, c.critical, ppm, closureRate);
        const oldestOpenDays = Math.floor(c.oldestOpenMs / 86_400_000);

        // Sparkline: last 6 months
        const spark: number[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          spark.push(c.monthCounts[ym] ?? 0);
        }

        // Risk score (0-100, higher = worse)
        const riskScore = Math.min(100, Math.round(
          c.critical * 25 +
          c.open * 8 +
          (ppm > 500 ? Math.min(30, (ppm - 500) / 100) : 0) +
          (closureRate < 70 ? (70 - closureRate) * 0.5 : 0)
        ));

        return {
          name: c.name,
          tier,
          riskScore,
          total: c.total,
          open: c.open,
          closed: c.closed,
          critical: c.critical,
          ppm,
          closureRate,
          oldestOpenDays,
          recentActivity: c.recentActivity,
          sparkline: spark,
          narrative: buildNarrative(c.name, tier, c.open, c.critical, ppm, closureRate, oldestOpenDays),
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    // ── Summary stats ─────────────────────────────────────────────────────────
    const summary = {
      totalCustomers: customers.length,
      critical: customers.filter(c => c.tier === 'Critical').length,
      high:     customers.filter(c => c.tier === 'High').length,
      medium:   customers.filter(c => c.tier === 'Medium').length,
      low:      customers.filter(c => c.tier === 'Low').length,
      topRisk:  customers[0]?.name ?? null,
    };

    return NextResponse.json({ customers, summary, fetchedAt: new Date().toISOString() });

  } catch (err) {
    console.error('customer-risk error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
