import { NextRequest, NextResponse } from 'next/server';
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

// ── Static QMOS module index ──────────────────────────────────────────────────
const MODULES = [
  { label: 'Dashboard',              href: '/dashboard',           icon: '🏠', tags: ['dashboard','home','kpi','summary'] },
  { label: 'Complaints',             href: '/complaints',          icon: '🚨', tags: ['complaints','customer','quality issue','rejection'] },
  { label: 'Analytics Dashboard',    href: '/analytics',           icon: '📊', tags: ['analytics','pareto','trend','ppm','chart'] },
  { label: 'Quality Health Check',   href: '/quality-health',      icon: '🔬', tags: ['health','score','maturity','radar','iatf'] },
  { label: 'Risk Matrix',            href: '/analytics',           icon: '🎯', tags: ['risk','matrix','heat map','severity'] },
  { label: 'PPM Analytics',          href: '/ppm-analytics',       icon: '📉', tags: ['ppm','parts per million','forecast','spc','trend'] },
  { label: 'APQP',                   href: '/apqp',                icon: '🗂️', tags: ['apqp','advanced','product quality planning','gantt'] },
  { label: 'PPAP',                   href: '/ppap',                icon: '📋', tags: ['ppap','submission','psw','warrant','approval'] },
  { label: 'PFMEA',                  href: '/pfmea',               icon: '⚠️', tags: ['pfmea','fmea','failure','mode','effect','rpn','risk'] },
  { label: 'Control Plan',           href: '/control-plan',        icon: '📝', tags: ['control plan','cp','characteristics','inspection'] },
  { label: 'MSA',                    href: '/msa',                 icon: '📏', tags: ['msa','gauge','gage','repeatability','reproducibility','grr'] },
  { label: 'SPC',                    href: '/spc',                 icon: '📈', tags: ['spc','statistical','control chart','cpk','cp','capability'] },
  { label: 'Supplier Quality',       href: '/supplier-quality',    icon: '🚚', tags: ['supplier','vendor','sqe','scar','ppap','4m'] },
  { label: 'Supplier Complaints',    href: '/supplier-complaints', icon: '📦', tags: ['supplier complaint','incoming','iqc','rejection','vendor'] },
  { label: 'CAPA Management',        href: '/capa',                icon: '🔧', tags: ['capa','corrective','preventive','action','closure'] },
  { label: 'Management Review',      href: '/management-review',   icon: '👔', tags: ['mrm','management review','meeting','report','directors'] },
  { label: 'Approval Queue',         href: '/approvals',           icon: '✅', tags: ['approval','pending','authorize','sign off'] },
  { label: 'SLA Tracker',            href: '/sla',                 icon: '⏱️', tags: ['sla','service level','breach','overdue','escalation'] },
  { label: 'Audit Trail',            href: '/audit-trail',         icon: '📜', tags: ['audit trail','history','log','revision','changes'] },
  { label: 'Calibration',            href: '/calibration',         icon: '🔬', tags: ['calibration','instrument','gauge','iatf 7.1.5','mte'] },
  { label: 'Internal Audit',         href: '/audit',               icon: '🔍', tags: ['internal audit','iatf','checklist','finding','nc'] },
  { label: 'IATF Audit Readiness',   href: '/iatf-compliance',     icon: '🛡️', tags: ['iatf compliance','audit ready','clause','readiness','certification','16949','traffic light'] },
  { label: 'Customer Risk AI',       href: '/customer-risk',       icon: '🎯', tags: ['customer risk','scorecard','ppm by customer','risk tier','critical customer','oem risk'] },
  { label: 'Quality Daily Brief',    href: '/daily-brief',         icon: '☀️', tags: ['daily brief','morning','stand-up','shift','priority actions','whatsapp','today'] },
  { label: 'AI 8D Report Generator', href: '/8d-generator',        icon: '📋', tags: ['8d','eight disciplines','problem solving','d1 d2 d3 d4 d5 d6 d7 d8','root cause','containment','corrective action','iatf 10.2.3','8d report'] },
  { label: 'Supplier Risk AI',       href: '/supplier-risk',        icon: '🏭', tags: ['supplier risk','ncr','scar','supplier ppm','supplier scorecard','incoming','material','sqe','vendor risk'] },
  { label: 'COPQ Dashboard',         href: '/copq',                 icon: '💰', tags: ['copq','cost of poor quality','paf model','internal failure','external failure','appraisal','prevention','quality cost','management review'] },
  { label: 'Warranty',               href: '/warranty',            icon: '🛡️', tags: ['warranty','field','return','recall','goodwill','r/1000'] },
  { label: 'Lessons Learned',        href: '/lessons-learned',     icon: '🧠', tags: ['lessons learned','knowledge','best practice','history'] },
  { label: 'Quality Goals',          href: '/quality-goals',       icon: '🎯', tags: ['goals','kpi','target','objectives','quality policy'] },
  { label: 'Notifications',          href: '/notifications',       icon: '🔔', tags: ['notifications','alerts','reminders','escalation'] },
  { label: 'Training',               href: '/training',            icon: '🎓', tags: ['training','competency','skill','matrix','certification'] },
  { label: 'Customer Portal',        href: '/portal',              icon: '🌐', tags: ['portal','customer','submit','track','external'] },
  { label: 'Customer Scorecard',     href: '/customer-scorecard',  icon: '📋', tags: ['customer scorecard','rating','performance','otd'] },
  { label: 'AI Copilot',             href: '/ai-copilot',          icon: '🤖', tags: ['ai','copilot','assistant','chat','ask'] },
  { label: 'AI Generator',           href: '/ai-generator',        icon: '⚡', tags: ['generator','template','sop','work instruction','document'] },
  { label: 'PFMEA AI Copilot',       href: '/ai-pfmea-copilot',    icon: '🤖', tags: ['pfmea ai','fmea assistant','risk ai'] },
  { label: 'SPC AI Analyser',        href: '/spc-analyser',        icon: '🤖', tags: ['spc ai','capability analyser','process control'] },
  { label: 'IATF 16949 Analyser',    href: '/iatf-analyser',       icon: '📖', tags: ['iatf analyser','clause','requirement','compliance'] },
];

// ── Relevance scoring ────────────────────────────────────────────────────────
function scoreMatch(query: string, fields: string[]): number {
  const q = query.toLowerCase().trim();
  let score = 0;
  for (const f of fields) {
    const val = (f ?? '').toLowerCase();
    if (val.startsWith(q)) score += 10;
    else if (val.includes(q)) score += 5;
    const words = q.split(/\s+/);
    for (const w of words) {
      if (w.length > 2 && val.includes(w)) score += 2;
    }
  }
  return score;
}

// ── GET /api/search?q=... ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ complaints: [], modules: [] });

  const companyId = await getCompanyId();

  // Search complaints
  let complaints: {
    id: string; complaint_number: string; customer_name: string;
    part_name: string; severity: string; status: string;
    defect_category: string; defect_description: string; score: number;
  }[] = [];

  if (companyId) {
    const { data } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, customer_name, customer, part_name, severity, status, defect_category, defect_description')
      .eq('company_id', companyId)
      .or(
        `complaint_number.ilike.%${q}%,` +
        `customer_name.ilike.%${q}%,` +
        `part_name.ilike.%${q}%,` +
        `defect_category.ilike.%${q}%,` +
        `defect_description.ilike.%${q}%`
      )
      .limit(8);

    complaints = (data ?? []).map(c => ({
      id: c.id,
      complaint_number: c.complaint_number,
      customer_name: c.customer_name ?? '',
      part_name: c.part_name ?? '',
      severity: c.severity ?? '',
      status: c.status ?? '',
      defect_category: c.defect_category ?? '',
      defect_description: (c.defect_description ?? '').slice(0, 100),
      score: scoreMatch(q, [c.complaint_number, c.customer_name ?? '', c.part_name ?? '', c.defect_category ?? '', c.defect_description ?? '']),
    })).sort((a, b) => b.score - a.score);
  }

  // Search modules
  const modules = MODULES
    .map(m => ({ ...m, score: scoreMatch(q, [m.label, ...m.tags]) }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score: _, tags: __, ...m }) => m);

  return NextResponse.json({ complaints, modules });
}
