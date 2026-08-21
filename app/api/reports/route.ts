import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('qmos_session');
    if (session?.value) {
      const s = JSON.parse(session.value);
      if (s?.company_id) return s.company_id;
    }
  } catch { /* fall through */ }
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

export async function GET() {
  const companyId = await getCompanyId();
  if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  // Fetch all complaints for this company (for aggregation)
  const { data: all } = await supabaseAdmin
    .from('complaints').select('id, status, severity, quantity_affected, total_supplied, defect_category, created_at, complaint_number, customer_name, customer, part_name, defect_description')
    .eq('company_id', companyId);

  const complaints = all ?? [];

  const total      = complaints.length;
  const open       = complaints.filter(c => !['Closed','Cancelled'].includes(c.status)).length;
  const closed     = complaints.filter(c => c.status === 'Closed').length;
  const critical   = complaints.filter(c => c.severity === 'Critical' && !['Closed','Cancelled'].includes(c.status)).length;
  const inProgress = complaints.filter(c => ['Under Investigation','CAPA In Progress','Pending Verification','Pending Closure'].includes(c.status)).length;

  // PPM
  const totalRej = complaints.filter(c => c.status !== 'Cancelled').reduce((s, c) => s + (c.quantity_affected || 0), 0);
  const totalSup = complaints.filter(c => c.status !== 'Cancelled').reduce((s, c) => s + (c.total_supplied || 0), 0);
  const ppm = totalSup > 0 ? Math.round((totalRej / totalSup) * 1_000_000) : 0;

  // Monthly trend — always show last 6 months even if no data
  const monthMap: Record<string, { month: string; opened: number; closed: number }> = {};
  // Pre-fill last 6 months as zero buckets
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[ym] = { month: ym, opened: 0, closed: 0 };
  }
  for (const c of complaints) {
    const month = (c.created_at ?? '').slice(0, 7); // YYYY-MM
    if (!month) continue;
    if (!monthMap[month]) monthMap[month] = { month, opened: 0, closed: 0 };
    monthMap[month].opened++;
    if (c.status === 'Closed') monthMap[month].closed++;
  }
  const trend = Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  // Pareto by defect category
  const catMap: Record<string, number> = {};
  for (const c of complaints) {
    if (c.defect_category) catMap[c.defect_category] = (catMap[c.defect_category] ?? 0) + 1;
  }
  const pareto = Object.entries(catMap)
    .map(([defect_category, count]) => ({ defect_category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // By severity
  const sevMap: Record<string, number> = {};
  for (const c of complaints) {
    const s = c.severity || 'Unknown';
    sevMap[s] = (sevMap[s] ?? 0) + 1;
  }
  const bySeverity = Object.entries(sevMap).map(([severity, count]) => ({ severity, count }));

  // By status
  const statusMap: Record<string, number> = {};
  for (const c of complaints) {
    statusMap[c.status] = (statusMap[c.status] ?? 0) + 1;
  }
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Recent open (priority order: Critical > High > Medium > Low, oldest first)
  const severityOrder: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
  const recentOpen = complaints
    .filter(c => !['Closed','Cancelled'].includes(c.status))
    .sort((a, b) => {
      const so = (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
      if (so !== 0) return so;
      return (a.created_at ?? '').localeCompare(b.created_at ?? '');
    })
    .slice(0, 8)
    .map(c => ({
      id:                c.id,
      complaint_number:  c.complaint_number,
      customer_name:     c.customer_name,
      part_name:         c.part_name,
      severity:          c.severity,
      status:            c.status,
      created_at:        c.created_at,
      defect_description: c.defect_description,
    }));

  // All open complaints for Risk Matrix (no slice limit)
  const allOpen = complaints
    .filter(c => !['Closed','Cancelled'].includes(c.status))
    .map(c => ({
      id:               c.id,
      complaint_number: c.complaint_number,
      customer_name:    c.customer_name,
      part_name:        c.part_name,
      severity:         c.severity,
      status:           c.status,
      created_at:       c.created_at,
    }));

  return NextResponse.json({ total, open, closed, critical, inProgress, ppm, trend, pareto, bySeverity, byStatus, recentOpen, allOpen });
}
