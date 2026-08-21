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

// ── Action category inference ─────────────────────────────────────────────────
function categorise(action: string): string {
  const a = (action ?? '').toLowerCase();
  if (a.includes('creat') || a.includes('raised') || a.includes('opened'))  return 'created';
  if (a.includes('approv'))                                                   return 'approval';
  if (a.includes('reject'))                                                   return 'rejection';
  if (a.includes('capa') || a.includes('corrective') || a.includes('preventive')) return 'capa';
  if (a.includes('close') || a.includes('closed'))                           return 'closure';
  if (a.includes('status'))                                                   return 'status_change';
  if (a.includes('contain'))                                                  return 'containment';
  if (a.includes('8d') || a.includes('generat'))                             return 'report';
  if (a.includes('team'))                                                     return 'team';
  return 'update';
}

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const url    = new URL(req.url);
    const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '200'), 500);
    const since  = url.searchParams.get('since');   // ISO date string
    const type   = url.searchParams.get('type');    // category filter

    // ── complaint_timeline (primary audit source) ──────────────────────────
    let q = supabaseAdmin
      .from('complaint_timeline')
      .select(`
        id, action, performed_by, performed_at,
        complaint_id,
        complaints!inner(complaint_number, customer_name, severity, company_id)
      `)
      .eq('complaints.company_id', companyId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (since) q = q.gte('performed_at', since);

    const { data: timeline, error } = await q;
    if (error) throw error;

    type RawComplaint = { complaint_number: string; customer_name: string; severity: string; company_id?: string };
    const events = (timeline ?? []).map((e: {
      id: string; action: string; performed_by: string; performed_at: string;
      complaint_id: string;
      complaints: RawComplaint | RawComplaint[] | null;
    }) => {
      // Supabase may return the join as a single object or an array depending on relationship type
      const comp = Array.isArray(e.complaints) ? e.complaints[0] : e.complaints;
      return {
        id:               String(e.id),
        source:           'complaint_timeline',
        category:         categorise(e.action),
        action:           e.action,
        performed_by:     e.performed_by || 'System',
        performed_at:     e.performed_at,
        complaint_id:     e.complaint_id,
        complaint_number: comp?.complaint_number ?? '',
        customer_name:    comp?.customer_name ?? '',
        severity:         comp?.severity ?? '',
      };
    });

    // Filter by category if requested
    const filtered = type && type !== 'all' ? events.filter(e => e.category === type) : events;

    // Summary counts by category
    const categoryCounts: Record<string, number> = {};
    events.forEach(e => { categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1; });

    // Unique actors
    const actors = [...new Set(events.map(e => e.performed_by).filter(Boolean))].sort();

    return NextResponse.json({
      events: filtered,
      total: events.length,
      categoryCounts,
      actors,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch audit trail' }, { status: 500 });
  }
}
