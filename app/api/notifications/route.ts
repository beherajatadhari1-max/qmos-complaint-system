export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// ── getCompanyId ──────────────────────────────────────────────────────────────
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

// ── helpers ───────────────────────────────────────────────────────────────────
function daysDiff(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmt(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 16).replace('T', ' ');
}

// ── GET /api/notifications ─────────────────────────────────────────────────────
// Derives live actionable notifications from the complaints table.
// Returns { notifications, unreadCount, fetchedAt }
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const countOnly = url.searchParams.get('count') === 'true';

  const companyId = await getCompanyId();
  if (!companyId) {
    return NextResponse.json({ notifications: [], unreadCount: 0, fetchedAt: new Date().toISOString() });
  }

  // Fetch open/in-progress complaints
  const { data: raw } = await supabaseAdmin
    .from('complaints')
    .select(`
      id, complaint_number, status, severity, customer_name, customer,
      part_name, defect_description, created_at, updated_at,
      warranty_claim_no, complaint_type, assigned_to
    `)
    .eq('company_id', companyId)
    .not('status', 'in', '("Closed","Cancelled")')
    .order('created_at', { ascending: false })
    .limit(200);

  const complaints = raw ?? [];

  // ── Generate notifications from complaint data ─────────────────────────────
  type Priority = 'critical' | 'high' | 'medium' | 'low';
  type Category = 'complaint' | 'capa' | 'supplier' | 'calibration' | 'audit' | 'training' | 'ppap' | 'certification' | 'document' | 'spc';

  interface LiveNotif {
    id: string; category: Category; priority: Priority;
    status: 'unread' | 'read' | 'actioned' | 'snoozed';
    title: string; message: string; source: string; recipient: string;
    createdAt: string; dueDate?: string; linkedRef?: string;
    escalated: boolean; escalationLevel: 0 | 1 | 2;
    isLive: boolean;
  }

  const notifs: LiveNotif[] = [];

  for (const c of complaints) {
    const days   = daysDiff(c.created_at);
    const name   = c.customer_name ?? 'Unknown';
    const part   = c.part_name ?? 'Part';
    const defect = c.defect_description ?? '';
    const ref    = c.complaint_number ?? c.id;
    const sev    = (c.severity ?? 'Medium').toLowerCase();
    const status = c.status ?? 'Open';

    // Critical open complaints
    if (sev === 'critical') {
      notifs.push({
        id:       `live-CC-${c.id}`,
        category: 'complaint', priority: 'critical', status: 'unread',
        title:    `🚨 CRITICAL Complaint — ${name}`,
        message:  `${ref}: ${defect.slice(0, 120) || 'Critical quality issue'} — ${part}. Open for ${days} day(s). Immediate containment required.`,
        source:   'Live — Supabase Complaints',
        recipient:'Quality Head',
        createdAt: fmt(c.created_at),
        linkedRef: ref,
        escalated: days >= 1,
        escalationLevel: days >= 3 ? 2 : days >= 1 ? 1 : 0,
        isLive: true,
      });
      continue;
    }

    // High severity or overdue (>14 days)
    if (sev === 'high' || days > 14) {
      notifs.push({
        id:       `live-HC-${c.id}`,
        category: 'complaint', priority: days > 21 ? 'high' : 'medium', status: 'unread',
        title:    `⚠️ Complaint Overdue — ${name} (${days}d open)`,
        message:  `${ref}: ${defect.slice(0, 100) || 'Quality complaint'} — ${part}. Status: ${status}. Open for ${days} days — action required.`,
        source:   'Live — Supabase Complaints',
        recipient:'Quality Manager',
        createdAt: fmt(c.created_at),
        linkedRef: ref,
        escalated: days > 21,
        escalationLevel: days > 21 ? 1 : 0,
        isLive: true,
      });
      continue;
    }

    // CAPA required: Under Investigation > 10 days
    if (status === 'Under Investigation' && days > 10) {
      notifs.push({
        id:       `live-CAPA-${c.id}`,
        category: 'capa', priority: 'high', status: 'unread',
        title:    `🔧 CAPA Required — ${ref} (${days}d under investigation)`,
        message:  `${ref} for ${name} has been under investigation for ${days} days without closure. Raise CAPA and implement corrective action.`,
        source:   'Live — Supabase Complaints',
        recipient:'Quality Manager',
        createdAt: fmt(c.created_at),
        linkedRef: ref,
        escalated: days > 21,
        escalationLevel: 0,
        isLive: true,
      });
      continue;
    }

    // Warranty complaints
    if (c.warranty_claim_no || (c.complaint_type ?? '').toLowerCase().includes('warranty')) {
      notifs.push({
        id:       `live-WC-${c.id}`,
        category: 'complaint', priority: 'high', status: 'unread',
        title:    `🛡 Warranty Claim Open — ${name}`,
        message:  `${ref}: ${defect.slice(0, 100) || 'Warranty claim'}. Warranty claim no: ${c.warranty_claim_no ?? 'N/A'}. Open ${days} day(s).`,
        source:   'Live — Supabase Complaints',
        recipient:'Quality Manager',
        createdAt: fmt(c.created_at),
        linkedRef: ref,
        escalated: false,
        escalationLevel: 0,
        isLive: true,
      });
      continue;
    }

    // General open complaint (medium, recent)
    if (days <= 7) {
      notifs.push({
        id:       `live-OC-${c.id}`,
        category: 'complaint', priority: 'medium', status: 'read',
        title:    `New Complaint — ${name}`,
        message:  `${ref}: ${defect.slice(0, 100) || 'Quality complaint'} — ${part}. Opened ${days} day(s) ago. Status: ${status}.`,
        source:   'Live — Supabase Complaints',
        recipient:'Quality Team',
        createdAt: fmt(c.created_at),
        linkedRef: ref,
        escalated: false,
        escalationLevel: 0,
        isLive: true,
      });
    }
  }

  // Sort: critical first, then by creation date descending
  const priorityOrder: Record<Priority, number> = { critical:0, high:1, medium:2, low:3 };
  notifs.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    return pd !== 0 ? pd : b.createdAt.localeCompare(a.createdAt);
  });

  const unreadCount = notifs.filter(n => n.status === 'unread').length;

  if (countOnly) {
    return NextResponse.json({ unreadCount, fetchedAt: new Date().toISOString() });
  }

  return NextResponse.json({
    notifications: notifs,
    unreadCount,
    fetchedAt: new Date().toISOString(),
  });
}
