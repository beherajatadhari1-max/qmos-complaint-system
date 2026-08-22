'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/app/hooks/useSession';

// --- TYPES -------------------------------------------------------------------
interface Complaint {
  id: number; complaint_number: string; customer_name: string; customer_contact: string;
  customer_ref: string; complaint_source: string; part_number: string; part_name: string;
  defect_description: string; defect_category: string; quantity_affected: number;
  total_supplied: number; batch_number: string; severity: string; status: string;
  assigned_to: string; created_at: string; target_closure_date: string; remarks: string;
  report_generated: number;
  approval_status: string; approved_by: string; approved_at: string; rejection_reason: string;
  // D-fields
  d1_team: string; d2_problem: string; d3_containment: string;
  d4_root_cause: string; d4_escape_point: string; d4_why_made: string; d4_why_shipped: string;
  d5_corrective_actions: string; d5_ca_why_made: string; d5_ca_why_shipped: string;
  d6_implementation: string; d6_verification: string;
  d6_ca_owner: string; d6_ca_owner_phone: string; d6_ca_owner_email: string;
  d6_target_date: string; d6_certified_build_date: string; d6_certified_part_id: string;
  d7_prevention: string; d7_other_facilities: string;
  d7_doc_dfmea: string; d7_doc_pfmea: string; d7_doc_control_plan: string;
  d7_doc_process_flow: string; d7_doc_ods: string; d7_doc_drawing: string; d7_doc_other: string;
  d8_congratulations: string;
}
interface ContainmentAction {
  id: number; action_number: number; action_description: string; location: string;
  responsible_person: string; target_date: string; completion_date: string;
  status: string; evidence: string; qty_sorted: number; qty_rejected: number; qty_ok: number;
  other_platform_risk: string; certified_material_id: string;
}
interface CapaAction {
  id: number; action_number: number; action_type: string; action_description: string;
  document_to_update: string; responsible_person: string; target_date: string;
  completion_date: string; status: string; verification_method: string;
}
interface TeamMember {
  id: number; member_name: string; designation: string; department: string;
  role_in_team: string; contact_number: string; email: string;
}
interface TimelineEvent {
  id: number; event_type: string; event_description: string; performed_by: string; performed_at: string;
}
interface WhyRow { id?: number; why_number: number; why_type: string; why_question: string; why_answer: string; }

// --- CONSTANTS ---------------------------------------------------------------
const SLA_DAYS: Record<string, number> = { Critical: 7, High: 14, Medium: 30, Low: 45 };
const SEV_CLASS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border border-red-700/50',
  High: 'bg-orange-100 text-orange-600 border border-orange-700/50',
  Medium: 'bg-yellow-100 text-yellow-200 border border-yellow-700/50',
  Low: 'bg-green-100 text-[#15803d] border border-green-700/50',
};
const STATUS_CLASS: Record<string, string> = {
  'Open': 'bg-red-500 text-white',
  'Under Investigation': 'bg-[#dbeafe] text-[#1d4ed8]',
  'CAPA In Progress': 'bg-orange-500 text-white',
  'Pending Verification': 'bg-purple-600 text-white',
  'Pending Closure': 'bg-yellow-600 text-white',
  'Closed': 'bg-green-600 text-white',
  'Cancelled': 'bg-gray-400 text-white',
};
const DOC_ROWS = [
  { key: 'd7_doc_dfmea', label: 'DFMEA' },
  { key: 'd7_doc_pfmea', label: 'PFMEA' },
  { key: 'd7_doc_control_plan', label: 'Control Plan' },
  { key: 'd7_doc_process_flow', label: 'Process Flow' },
  { key: 'd7_doc_ods', label: 'Operation / Work Instruction (ODS)' },
  { key: 'd7_doc_drawing', label: 'Drawing' },
  { key: 'd7_doc_other', label: 'Other Documents' },
];
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'team', label: 'D1 Team', icon: '👥' },
  { id: 'problem', label: 'D2 Problem', icon: '❓' },
  { id: 'containment', label: 'D3 Containment', icon: '🛡️' },
  { id: 'rootcause', label: 'D4 Root Cause', icon: '🔍' },
  { id: 'capa', label: 'D5 CAPA', icon: '✅' },
  { id: 'verification', label: 'D6 Verification', icon: '🔬' },
  { id: 'prevention', label: 'D7 Prevention', icon: '🔒' },
  { id: 'closure', label: 'D8 Closure', icon: '🏆' },
  { id: '8dreport', label: '8D Report', icon: '📄' },
  { id: 'timeline', label: 'Timeline', icon: '🕐' },
];

// --- HELPERS -----------------------------------------------------------------
const Input = ({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) => (
  <div>
    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);
const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[]; }) => (
  <div>
    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);
const Textarea = ({ label, value, onChange, rows = 3, highlight = false }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; highlight?: boolean;
}) => (
  <div>
    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${highlight ? 'border-red-700/50 bg-red-50' : 'border-[#dbeafe]'}`} />
  </div>
);

// --- 5-WHY EDITOR ------------------------------------------------------------
function WhyEditor({ label, color, whys, onChange }: {
  label: string; color: string; whys: WhyRow[]; onChange: (rows: WhyRow[]) => void;
}) {
  return (
    <div className={`border-2 ${color} rounded-xl overflow-hidden`}>
      <div className={`px-4 py-2.5 ${color === 'border-orange-400' ? 'bg-orange-900/30' : 'bg-[#eff6ff]'}`}>
        <p className="text-sm font-bold text-[#1e3a5f]">{label}</p>
        <p className="text-xs text-[#1e3a5f] mt-0.5">{label.includes('Made') ? 'Why did the defect occur? (Occurrence Root Cause)' : 'Why was it not detected? (Escape Root Cause)'}</p>
      </div>
      <div className="p-3 space-y-2">
        {whys.map((w, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className={`flex-shrink-0 w-16 text-center py-1.5 rounded text-xs font-bold ${i === 4 ? 'bg-red-100 text-red-800' : 'bg-[#f0f9ff]/40 text-[#1e3a5f]'}`}>
              Why {w.why_number}{i === 4 ? ' (RC)' : ''}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input value={w.why_question} onChange={e => { const n = [...whys]; n[i] = { ...n[i], why_question: e.target.value }; onChange(n); }}
                placeholder="Why question..." className="border border-[#dbeafe] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <textarea value={w.why_answer} onChange={e => { const n = [...whys]; n[i] = { ...n[i], why_answer: e.target.value }; onChange(n); }}
                rows={2} placeholder={i === 4 ? 'Root cause / Escape point...' : 'Answer...'}
                className={`border rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 ${i === 4 ? 'border-red-700/50 bg-red-50' : 'border-[#dbeafe]'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_WHYS = (type: string): WhyRow[] => [
  { why_number: 1, why_type: type, why_question: type === 'occurrence' ? 'Why did the defect occur?' : 'Why was it not detected before reaching customer?', why_answer: '' },
  { why_number: 2, why_type: type, why_question: 'Why?', why_answer: '' },
  { why_number: 3, why_type: type, why_question: 'Why?', why_answer: '' },
  { why_number: 4, why_type: type, why_question: 'Why?', why_answer: '' },
  { why_number: 5, why_type: type, why_question: type === 'occurrence' ? 'Why? (Root Cause — Why Made)' : 'Why? (Escape Root Cause — Why Shipped)', why_answer: '' },
];

// --- AI TRIAGE ENGINE --------------------------------------------------------
interface TriageResult {
  severityRec: string; severityJustification: string;
  rootCauseCategory: string; rootCauseCategoryIcon: string; rootCauseDetail: string;
  containmentActions: string[];
  assigneeRole: string; assigneeRationale: string;
  iatfClauses: { clause: string; title: string; required: boolean }[];
  complexity: 'Simple' | 'Standard' | 'Complex'; complexityReason: string;
  defectDomain: string;
}

function triageDefect(complaint: Complaint): TriageResult {
  const text = `${complaint.defect_description || ''} ${complaint.defect_category || ''} ${complaint.part_name || ''}`.toLowerCase();
  const qty = complaint.quantity_affected || 0;
  const ppm = complaint.total_supplied > 0 ? Math.round((qty / complaint.total_supplied) * 1_000_000) : 0;

  // Detect defect domain
  let defectDomain = 'general';
  if (/dimension|size|length|width|diameter|tolerance|oversize|undersize|gap|flush/.test(text)) defectDomain = 'dimensional';
  else if (/crack|scratch|dent|rust|corrosion|surface|finish|paint|burr|sharp|mark/.test(text)) defectDomain = 'surface';
  else if (/weld|welding|spot weld|mig|tig|fusion|porosity|spatter/.test(text)) defectDomain = 'welding';
  else if (/assembly|fitment|missing|wrong|reversed|torque|loose|clamp|fastener/.test(text)) defectDomain = 'assembly';
  else if (/material|hardness|tensile|yield|chemical|composition|grade|alloy/.test(text)) defectDomain = 'material';
  else if (/leak|seal|pressure|vacuum|hydraulic|pneumatic|oil|fluid/.test(text)) defectDomain = 'leak';
  else if (/electrical|connector|wire|circuit|signal|voltage|short|open circuit/.test(text)) defectDomain = 'electrical';

  // Severity recommendation
  let severityRec = complaint.severity || 'High';
  let severityJustification = '';
  if (ppm > 50000 || qty > 500 || /safety|critical|recall|stop ship|field|warranty/.test(text)) {
    severityRec = 'Critical';
    severityJustification = ppm > 50000 ? `PPM of ${ppm.toLocaleString()} exceeds critical threshold (>50,000 PPM). Immediate containment required.`
      : 'Safety or field-failure keywords detected. Customer impact is severe.';
  } else if (ppm > 5000 || qty > 100) {
    severityRec = 'High';
    severityJustification = `PPM of ${ppm.toLocaleString()} indicates a systemic process issue requiring urgent 8D response.`;
  } else if (qty > 20) {
    severityRec = 'Medium';
    severityJustification = `Moderate quantity rejected (${qty} pcs). Contained risk — standard CAPA response applicable.`;
  } else {
    severityRec = 'Low';
    severityJustification = `Low rejection quantity (${qty} pcs) suggests isolated occurrence. Monitor and document.`;
  }

  // Root cause category (5M)
  const rcMap: Record<string, { cat: string; icon: string; detail: string }> = {
    dimensional:  { cat: 'Machine / Method',  icon: '⚙️', detail: 'Likely machine parameter drift, tooling wear, or setup error. Check last good part sign-off and SPC chart.' },
    surface:      { cat: 'Machine / Material', icon: '🔩', detail: 'Surface defects often trace to tooling condition, raw material surface quality, or handling damage.' },
    welding:      { cat: 'Machine / Man',      icon: '🔥', detail: 'Welding defects: check electrode condition, weld parameters, operator qualification records.' },
    assembly:     { cat: 'Man / Method',       icon: '🧑‍🔧', detail: 'Assembly errors indicate process control gaps — poka-yoke missing or visual aid not followed.' },
    material:     { cat: 'Material',           icon: '📦', detail: 'Review incoming material certification (CoC/CoA), supplier process audit, and heat/lot traceability.' },
    leak:         { cat: 'Machine / Method',   icon: '💧', detail: 'Seal/leak failures: check assembly torque, seal condition, pressure test equipment calibration.' },
    electrical:   { cat: 'Machine / Method',   icon: '⚡', detail: 'Electrical issues: review connector assembly SOP, crimping force monitoring, test coverage.' },
    general:      { cat: 'Method / Man',       icon: '🔍', detail: 'Defect pattern unclear from description. Cross-check PFMEA detection controls and control plan.' },
  };
  const rc = rcMap[defectDomain];

  // Containment actions by domain
  const containmentMap: Record<string, string[]> = {
    dimensional:  ['100% sorting of all suspect stock at plant and in-transit using Go/No-Go gauge or CMM', 'Segregate and tag all non-conforming parts with red rejection tags', 'Issue Stop-Ship notice — hold all dispatches until certified parts available'],
    surface:      ['100% visual inspection by trained inspectors under adequate lighting (min 1000 lux)', 'Segregate all suspect parts by production date/batch', 'Notify customer — offer immediate replacement of affected shipments'],
    welding:      ['Sort all welded parts for defect type (visual + dye penetrant if needed)', 'Quarantine from current batch back to last certified production run', 'Deploy interim 100% weld inspection with hourly control chart'],
    assembly:     ['Recall and re-inspect all assemblies from last verified good production run', 'Add mandatory double-check verification step at line end', 'Deploy interim poka-yoke check: list missing/wrong features'],
    material:     ['Quarantine full material lot — check CoC/CoA against specification', 'Notify supplier of non-conformance — request SCAR', 'Source alternative approved supplier stock for interim supply'],
    leak:         ['100% pressure/vacuum test all parts — reject any failures', 'Check and re-verify all seal torque settings against drawing specification', 'Provide replacement parts to customer for field suspect units'],
    electrical:   ['100% electrical continuity test all shipped parts if feasible', 'Hold all non-tested parts — inspect connector assemblies', 'Request field feedback loop from customer to identify failure pattern'],
    general:      ['Segregate all suspect parts and apply "HOLD" status in ERP/system', 'Notify customer and agree containment timeline (<24 hrs for Critical)', 'Post 100% inspection at dispatch until root cause confirmed'],
  };

  // Assignee role by domain
  const assigneeMap: Record<string, { role: string; rationale: string }> = {
    dimensional:  { role: 'Process Quality Engineer', rationale: 'Machine/tooling dimensional issues need SPC analysis and process ownership.' },
    surface:      { role: 'Quality Inspector Lead', rationale: 'Surface defects require visual inspection expertise and sorting management.' },
    welding:      { role: 'Welding Quality Engineer', rationale: 'Weld defect RCA needs operator qualification review and parameter analysis.' },
    assembly:     { role: 'Manufacturing Quality Engineer', rationale: 'Assembly errors are managed at line level by quality engineering.' },
    material:     { role: 'Supplier Quality Engineer (SQE)', rationale: 'Material non-conformances are driven back to the supplier via SCAR.' },
    leak:         { role: 'Process Quality Engineer', rationale: 'Seal/pressure failures need process parameter review and test equipment audit.' },
    electrical:   { role: 'Quality Engineer – Electrical', rationale: 'Electrical defects require specialized connector and test coverage knowledge.' },
    general:      { role: 'Quality Manager', rationale: 'Unclassified defects require senior quality judgment to direct RCA.' },
  };

  // IATF clauses
  const iatfBase = [
    { clause: '8.7', title: 'Control of Nonconforming Outputs', required: true },
    { clause: '10.2', title: 'Nonconformity and Corrective Action', required: true },
    { clause: '8.5.6', title: 'Control of Changes', required: defectDomain === 'dimensional' || defectDomain === 'assembly' },
    { clause: '8.4', title: 'Control of Externally Provided Processes (Supplier)', required: defectDomain === 'material' },
    { clause: '7.1.5', title: 'Monitoring & Measurement Resources (Calibration)', required: defectDomain === 'dimensional' || defectDomain === 'leak' },
    { clause: '8.3.3', title: 'Design Inputs (DFMEA)', required: /safety|critical|field|warranty/.test(text) },
    { clause: '8.5.2', title: 'Identification and Traceability', required: true },
    { clause: '9.1.1', title: 'Monitoring, Measurement, Analysis (SPC)', required: defectDomain === 'dimensional' },
  ].filter(c => c.required || Math.random() > 0.5).slice(0, 5); // keep relevant ones

  // 8D complexity
  let complexity: 'Simple' | 'Standard' | 'Complex' = 'Standard';
  let complexityReason = '';
  if (severityRec === 'Critical' || defectDomain === 'material' || /multi|cross|several|multiple plant|field recall/.test(text)) {
    complexity = 'Complex';
    complexityReason = 'Cross-functional RCA required. Expect 4–6 weeks. Involve design, supply chain, and customer quality teams.';
  } else if (severityRec === 'Low' && qty < 10) {
    complexity = 'Simple';
    complexityReason = 'Low impact, single occurrence. 8D can be completed in 1–2 weeks with process owner and QE.';
  } else {
    complexityReason = 'Moderate complexity. Typical 2–4 week 8D with QE, production, and supplier involvement.';
  }

  return {
    severityRec, severityJustification,
    rootCauseCategory: rc.cat, rootCauseCategoryIcon: rc.icon, rootCauseDetail: rc.detail,
    containmentActions: containmentMap[defectDomain],
    assigneeRole: assigneeMap[defectDomain].role, assigneeRationale: assigneeMap[defectDomain].rationale,
    iatfClauses: iatfBase,
    complexity, complexityReason, defectDomain,
  };
}

const COMPLEXITY_STYLE: Record<string, string> = {
  Simple:   'bg-green-900/40 text-[#15803d] border border-green-700/50',
  Standard: 'bg-amber-50 text-amber-600 border border-amber-200',
  Complex:  'bg-red-900/40 text-red-600 border border-red-700/50',
};
const SEV_REC_STYLE: Record<string, string> = {
  Critical: 'bg-red-900/40 text-red-600 border border-red-700/50',
  High:     'bg-orange-900/40 text-orange-600 border border-orange-700/50',
  Medium:   'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
  Low:      'bg-green-900/40 text-[#15803d] border border-green-700/50',
};

// --- MAIN PAGE ----------------------------------------------------------------
export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useSession();
  // RBAC: only quality_head (level 4) may approve/reject/close complaints
  const canApprove   = !session || session.rbacRole === 'quality_head';
  const canEditStatus = !session || session.rbacRole === 'quality_head' || session.rbacRole === 'quality_manager';
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [containment, setContainment] = useState<ContainmentAction[]>([]);
  const [capa, setCapa] = useState<CapaAction[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [occurrenceWhys, setOccurrenceWhys] = useState<WhyRow[]>(DEFAULT_WHYS('occurrence'));
  const [escapeWhys, setEscapeWhys] = useState<WhyRow[]>(DEFAULT_WHYS('escape'));

  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [triageRunning, setTriageRunning] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiWhyResult, setAiWhyResult] = useState<{ occurrence: string[]; escape: string[] } | null>(null);
  const [generatingWhys, setGeneratingWhys] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // D6 local state
  const [d6, setD6] = useState({ verification: '', ca_owner: '', ca_owner_phone: '', ca_owner_email: '', target_date: '', certified_build_date: '', certified_part_id: '' });
  // D7 local state
  const [d7Text, setD7Text] = useState('');
  const [d7OtherFacilities, setD7OtherFacilities] = useState('');
  const [d7Docs, setD7Docs] = useState<Record<string, string>>({});
  // D5 local state
  const [d5WhyMade, setD5WhyMade] = useState('');
  const [d5WhyShipped, setD5WhyShipped] = useState('');

  // Form states
  const [showContainmentForm, setShowContainmentForm] = useState(false);
  const [showCapaForm, setShowCapaForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [newContainment, setNewContainment] = useState({ action_description: '', location: 'At Plant', responsible_person: '', target_date: '', qty_sorted: '0', qty_rejected: '0', qty_ok: '0', evidence: '', other_platform_risk: 'No', certified_material_id: '' });
  const [newCapa, setNewCapa] = useState({ action_type: 'Corrective', action_description: '', document_to_update: 'PFMEA', responsible_person: '', target_date: '', verification_method: '', capa_section: 'Why Made' });
  const [newMember, setNewMember] = useState({ member_name: '', designation: '', department: '', role_in_team: 'Member', contact_number: '', email: '' });

  const id = params.id as string;

  const fetchAll = useCallback(async () => {
    const safeJson = (r: Response) => r.ok ? r.json().catch(() => null) : Promise.resolve(null);
    const [c, cont, ca, tm, tl, wy] = await Promise.all([
      fetch(`/api/complaints/${id}`).then(safeJson).catch(() => null),
      fetch(`/api/complaints/${id}/containment`).then(safeJson).catch(() => []),
      fetch(`/api/complaints/${id}/capa`).then(safeJson).catch(() => []),
      fetch(`/api/complaints/${id}/team`).then(safeJson).catch(() => []),
      fetch(`/api/complaints/${id}/timeline`).then(safeJson).catch(() => []),
      fetch(`/api/complaints/${id}/why`).then(safeJson).catch(() => []),
    ]);
    if (!c || c.error) { router.push('/'); return; }
    setComplaint(c);
    setContainment(Array.isArray(cont) ? cont : []);
    setCapa(Array.isArray(ca) ? ca : []);
    setTeam(Array.isArray(tm) ? tm : []);
    setTimeline(Array.isArray(tl) ? tl : []);

    const safeWy = Array.isArray(wy) ? wy : [];
    const occ = safeWy.filter((r: WhyRow) => r.why_type === 'occurrence' || r.why_type == null);
    const esc = safeWy.filter((r: WhyRow) => r.why_type === 'escape');
    if (occ.length > 0) setOccurrenceWhys(occ);
    if (esc.length > 0) setEscapeWhys(esc);

    setD6({
      verification: c.d6_verification || '', ca_owner: c.d6_ca_owner || '',
      ca_owner_phone: c.d6_ca_owner_phone || '', ca_owner_email: c.d6_ca_owner_email || '',
      target_date: c.d6_target_date || '', certified_build_date: c.d6_certified_build_date || '',
      certified_part_id: c.d6_certified_part_id || '',
    });
    setD7Text(c.d7_prevention || '');
    setD7OtherFacilities(c.d7_other_facilities || '');
    setD7Docs({
      d7_doc_dfmea: c.d7_doc_dfmea || 'Not Applicable',
      d7_doc_pfmea: c.d7_doc_pfmea || '',
      d7_doc_control_plan: c.d7_doc_control_plan || '',
      d7_doc_process_flow: c.d7_doc_process_flow || 'Not Applicable',
      d7_doc_ods: c.d7_doc_ods || '',
      d7_doc_drawing: c.d7_doc_drawing || 'Not Applicable',
      d7_doc_other: c.d7_doc_other || '',
    });
    setD5WhyMade(c.d5_ca_why_made || '');
    setD5WhyShipped(c.d5_ca_why_shipped || '');
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const runTriage = (c: Complaint) => {
    setTriageRunning(true);
    setTriageOpen(true);
    setTimeout(() => {
      setTriage(triageDefect(c));
      setTriageRunning(false);
    }, 900);
  };

  const patchComplaint = async (data: Record<string, string | number>) => {
    await fetch(`/api/complaints/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  };

  const logTimeline = async (action: string, by = 'Quality Head') => {
    await fetch(`/api/complaints/${id}/timeline`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, performed_by: by }),
    });
  };

  const updateStatus = async (status: string) => {
    if (status === 'Closed' && complaint?.approval_status !== 'approved') {
      alert('⚠ Closure requires Quality Head approval first.\nClick "Approve for Closure" in the Overview tab.');
      return;
    }
    const prev = complaint?.status;
    await patchComplaint({ status });
    await logTimeline(`📋 Status changed: ${prev} → ${status}`);
    fetchAll();
  };

  const approveComplaint = async () => {
    setApproving(true);
    await patchComplaint({
      approval_status: 'approved',
      approved_by: 'Jatadhari Behera (Quality Head)',
      approved_at: new Date().toISOString(),
    });
    // Log to timeline
    await fetch(`/api/complaints/${id}/timeline`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: '✅ APPROVED FOR CLOSURE — Quality Head sign-off granted', performed_by: 'Jatadhari Behera (Quality Head)' }),
    });
    await fetchAll();
    setApproving(false);
  };

  const rejectComplaint = async () => {
    if (!rejectReason.trim()) return;
    setApproving(true);
    await patchComplaint({
      approval_status: 'rejected',
      rejection_reason: rejectReason,
      status: 'CAPA In Progress',
    });
    await fetch(`/api/complaints/${id}/timeline`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: `❌ CLOSURE REJECTED — Reason: ${rejectReason}. Status reset to CAPA In Progress.`, performed_by: 'Jatadhari Behera (Quality Head)' }),
    });
    setRejectReason('');
    setShowRejectModal(false);
    await fetchAll();
    setApproving(false);
  };

  const generate8D = async () => {
    setGenerating(true);
    await fetch(`/api/complaints/${id}/8d`, { method: 'POST' });
    await fetchAll();
    setActiveTab('8dreport');
    setGenerating(false);
  };

  const saveWhys = async () => {
    setSaving(true);
    await fetch(`/api/complaints/${id}/why`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ occurrence: occurrenceWhys, escape: escapeWhys }) });
    await logTimeline('🔍 D4 — 5-Why analysis updated (Why Made + Why Shipped)');
    setSaving(false);
    fetchAll();
  };

  const saveD5 = async () => {
    setSaving(true);
    await patchComplaint({ d5_ca_why_made: d5WhyMade, d5_ca_why_shipped: d5WhyShipped });
    await logTimeline('✅ D5 — Corrective action summary updated');
    setSaving(false);
    fetchAll();
  };

  const saveD6 = async () => {
    setSaving(true);
    await patchComplaint({ d6_verification: d6.verification, d6_ca_owner: d6.ca_owner, d6_ca_owner_phone: d6.ca_owner_phone, d6_ca_owner_email: d6.ca_owner_email, d6_target_date: d6.target_date, d6_certified_build_date: d6.certified_build_date, d6_certified_part_id: d6.certified_part_id });
    await logTimeline(`🔬 D6 — Verification updated | Owner: ${d6.ca_owner || '—'} | Target: ${d6.target_date || '—'}`);
    setSaving(false);
    fetchAll();
  };

  const saveD7 = async () => {
    setSaving(true);
    await patchComplaint({ d7_prevention: d7Text, d7_other_facilities: d7OtherFacilities, ...d7Docs });
    await logTimeline('🔒 D7 — Systemic prevention actions & document updates saved');
    setSaving(false);
    fetchAll();
  };

  const addContainment = async () => {
    if (!newContainment.action_description) return;
    await fetch(`/api/complaints/${id}/containment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newContainment) });
    await logTimeline(`🛡️ D3 — Containment action added: "${newContainment.action_description.slice(0, 60)}" | Owner: ${newContainment.responsible_person || '—'}`);
    setNewContainment({ action_description: '', location: 'At Plant', responsible_person: '', target_date: '', qty_sorted: '0', qty_rejected: '0', qty_ok: '0', evidence: '', other_platform_risk: 'No', certified_material_id: '' });
    setShowContainmentForm(false); fetchAll();
  };
  const updateContainmentStatus = async (actionId: number, status: string) => {
    const completion_date = status === 'Completed' ? new Date().toISOString().slice(0, 10) : '';
    await fetch(`/api/complaints/${id}/containment/${actionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, completion_date }) });
    await logTimeline(`🛡️ D3 — Containment action #${actionId} marked ${status}`);
    fetchAll();
  };
  const deleteContainment = async (actionId: number) => {
    if (!confirm('Delete this containment action?')) return;
    await fetch(`/api/complaints/${id}/containment/${actionId}`, { method: 'DELETE' }); fetchAll();
  };

  const addCapa = async () => {
    if (!newCapa.action_description) return;
    await fetch(`/api/complaints/${id}/capa`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCapa) });
    await logTimeline(`✅ D5 — CAPA action added [${newCapa.action_type}]: "${newCapa.action_description.slice(0, 60)}" | Owner: ${newCapa.responsible_person || '—'} | Doc: ${newCapa.document_to_update}`);
    setNewCapa({ action_type: 'Corrective', action_description: '', document_to_update: 'PFMEA', responsible_person: '', target_date: '', verification_method: '', capa_section: 'Why Made' });
    setShowCapaForm(false); fetchAll();
  };
  const updateCapaStatus = async (capaId: number, status: string) => {
    const completion_date = status === 'Completed' ? new Date().toISOString().slice(0, 10) : '';
    await fetch(`/api/complaints/${id}/capa/${capaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, completion_date }) });
    await logTimeline(`✅ D5 — CAPA action #${capaId} marked ${status}${completion_date ? ` on ${completion_date}` : ''}`);
    fetchAll();
  };

  const addTeamMember = async () => {
    if (!newMember.member_name) return;
    await fetch(`/api/complaints/${id}/team`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMember) });
    await logTimeline(`👥 D1 — Team member added: ${newMember.member_name} (${newMember.role_in_team}, ${newMember.department || newMember.designation})`);
    setNewMember({ member_name: '', designation: '', department: '', role_in_team: 'Member', contact_number: '', email: '' });
    setShowTeamForm(false); fetchAll();
  };
  const removeTeamMember = async (memberId: number) => {
    const m = team.find(t => t.id === memberId);
    await fetch(`/api/complaints/${id}/team/${memberId}`, { method: 'DELETE' });
    await logTimeline(`👥 D1 — Team member removed: ${m?.member_name || memberId}`);
    fetchAll();
  };

  const downloadPDF = async () => {
    if (!complaint) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const margin = 15; const cw = pw - margin * 2;
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text('8D PROBLEM ANALYSIS REPORT', pw / 2, 11, { align: 'center' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`${complaint.complaint_number} | Customer: ${complaint.customer_name} | Part: ${complaint.part_number} ${complaint.part_name} | Severity: ${complaint.severity}`, pw / 2, 19, { align: 'center' });
    doc.text(`Status: ${complaint.status} | Date: ${complaint.created_at?.slice(0, 10)}`, pw / 2, 24, { align: 'center' });
    let y = 35; doc.setTextColor(0, 0, 0);
    const sections = [
      { label: 'D1 — Team Members', text: complaint.d1_team },
      { label: 'D2 — Problem Description (5W2H)', text: complaint.d2_problem },
      { label: 'D3 — Interim Containment', text: complaint.d3_containment },
      { label: 'D4 — Root Cause: Why Made (Occurrence)', text: complaint.d4_why_made || complaint.d4_root_cause },
      { label: 'D4 — Root Cause: Why Shipped (Escape)', text: complaint.d4_why_shipped },
      { label: 'D5 — Permanent Corrective Action: Why Made', text: complaint.d5_ca_why_made || complaint.d5_corrective_actions },
      { label: 'D5 — Permanent Corrective Action: Why Shipped', text: complaint.d5_ca_why_shipped },
      { label: 'D6 — Verification of Corrective Actions', text: complaint.d6_verification || complaint.d6_implementation },
      { label: 'D7 — Systemic Prevention', text: complaint.d7_prevention },
      { label: 'D8 — Closure & Team Recognition', text: complaint.d8_congratulations },
    ];
    for (const s of sections) {
      if (!s.text) continue;
      doc.setFillColor(30, 58, 138); doc.rect(margin, y, cw, 7, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(s.label, margin + 3, y + 5);
      y += 9; doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.text, cw - 4);
      for (const line of lines) { if (y > 278) { doc.addPage(); y = 15; } doc.text(line, margin + 2, y); y += 4.5; }
      y += 4;
    }
    doc.save(`8D-${complaint.complaint_number || complaint.id}-${complaint.customer_name}.pdf`);
  };

  if (loading) return <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center"><p className="text-[#1e3a5f] text-lg animate-pulse">Loading complaint...</p></div>;
  if (!complaint) return null;

  const daysOpen = Math.floor((Date.now() - new Date(complaint.created_at).getTime()) / 86400000);
  const completedCapa = capa.filter(a => a.status === 'Completed' || a.status === 'Verified').length;
  const completedContainment = containment.filter(a => a.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* HEADER */}
      <header className="bg-blue-900/40 text-[#1d4ed8] px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/" className="text-[#1d4ed8] hover:text-white text-xs">← Dashboard</Link>
              <span className="text-[#1d4ed8] text-xs">/</span>
              <span className="text-white font-mono text-sm font-bold">{complaint.complaint_number || `CC-${complaint.id}`}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_CLASS[complaint.severity] || ''}`}>{complaint.severity}</span>
              {canEditStatus ? (
                <select value={complaint.status} onChange={e => updateStatus(e.target.value)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer border-0 ${STATUS_CLASS[complaint.status] || ''}`}>
                  {['Open','Under Investigation','CAPA In Progress','Pending Verification','Pending Closure','Closed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_CLASS[complaint.status] || ''}`} title="Status editing requires Quality Manager access">
                  {complaint.status} 🔒
                </span>
              )}
            </div>
            <h1 className="text-base font-bold mt-1 truncate">{complaint.customer_name} — {complaint.defect_description?.slice(0, 65)}{(complaint.defect_description?.length || 0) > 65 ? '...' : ''}</h1>
            <div className="flex gap-4 text-blue-200 text-xs mt-0.5 flex-wrap">
              <span>Part: {complaint.part_number || '—'} {complaint.part_name}</span>
              <span>Qty: {complaint.quantity_affected} pcs</span>
              <span>Category: {complaint.defect_category}</span>
              <span className={daysOpen > 14 ? 'text-red-600 font-bold' : ''}>Days Open: {daysOpen}</span>
              {(() => {
                const sla = SLA_DAYS[complaint.severity] ?? 30;
                const remaining = sla - daysOpen;
                if (['Closed','Cancelled'].includes(complaint.status)) return null;
                if (remaining < 0) return <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SLA BREACHED {Math.abs(remaining)}d ago</span>;
                if (remaining <= sla * 0.25) return <span className="bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SLA: {remaining}d left</span>;
                return <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SLA: {remaining}d left</span>;
              })()}
              {complaint.customer_ref && <span>Customer Ref: {complaint.customer_ref}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap items-center">
            {/* -- Cross-module quick-links -- */}
            <Link href="/complaints"
              className="bg-blue-800/60 hover:bg-blue-700/80 border border-blue-600/40 text-blue-200 text-xs px-3 py-1.5 rounded font-medium transition whitespace-nowrap">
              ← All Complaints
            </Link>
            <button
              onClick={() => window.print()}
              className="no-print bg-[#f0f9ff]/60 hover:bg-[#dbeafe]/80 border border-[#dbeafe]/40 text-[#1e3a5f] text-xs px-3 py-1.5 rounded font-medium transition whitespace-nowrap"
              title="Print this complaint report">
              🖨 Print
            </button>
            <Link href="/capa"
              className="bg-blue-800/60 hover:bg-blue-700/80 border border-blue-600/40 text-blue-200 text-xs px-3 py-1.5 rounded font-medium transition whitespace-nowrap">
              🔧 CAPA
            </Link>
            {(complaint.status === 'Pending Closure' || complaint.status === 'Pending Verification') && (
              <Link href="/approvals"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded font-bold transition animate-pulse whitespace-nowrap">
                ⏳ Approval Queue
              </Link>
            )}
            <Link href="/ppm-analytics"
              className="bg-blue-800/60 hover:bg-blue-700/80 border border-blue-600/40 text-blue-200 text-xs px-3 py-1.5 rounded font-medium transition whitespace-nowrap">
              📈 PPM
            </Link>
            <button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-medium transition">⬇ PDF</button>
            <button onClick={generate8D} disabled={generating}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium transition disabled:opacity-60">
              {generating ? 'Generating...' : complaint.report_generated ? '↻ Regenerate 8D' : '✨ Auto Generate 8D'}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-7xl mx-auto mt-3">
          <div className="flex gap-1 flex-wrap">
            {[
              { label: 'D1 Team', done: team.length > 0 },
              { label: 'D3 Contain', done: completedContainment > 0 },
              { label: 'D4 Why Made', done: occurrenceWhys.some(w => w.why_answer) },
              { label: 'D4 Why Shipped', done: escapeWhys.some(w => w.why_answer) },
              { label: 'D5 CAPA', done: capa.length > 0 },
              { label: 'D6 Verify', done: !!complaint.d6_verification },
              { label: 'D7 Prevent', done: !!complaint.d7_prevention },
              { label: 'QH Approved', done: complaint.approval_status === 'approved' },
              { label: 'D8 Close', done: complaint.status === 'Closed' },
            ].map(step => (
              <div key={step.label} className="flex-1 text-center">
                <div className={`h-1.5 rounded-full mb-1 ${step.done ? 'bg-green-400' : 'bg-[#eff6ff]'}`}></div>
                <span className={`text-xs ${step.done ? 'text-green-300' : 'text-blue-600'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* TAB NAV */}
      <div className="bg-[#eff6ff] border-b border-[#dbeafe] sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-3 text-xs font-medium transition border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-700/50 text-[#1d4ed8] bg-[#eff6ff]' : 'border-transparent text-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* -- RESOLUTION JOURNEY STRIP --------------------------------------- */}
      <div className="bg-[#eff6ff] border-b border-[#dbeafe]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest mr-1 hidden sm:block">Resolution Journey</span>

            {/* Step 1 — Complaint */}
            <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              <span className="text-[#15803d] text-xs">✅</span>
              <div>
                <div className="text-[9px] font-bold text-[#15803d] uppercase tracking-wide">Complaint</div>
                <div className="text-[10px] text-[#15803d]">{complaint.complaint_number}</div>
              </div>
            </div>

            {/* Arrow */}
            <span className="text-[#1e3a5f] text-sm font-bold">→</span>

            {/* Step 2 — CAPA */}
            {capa.length > 0 ? (
              <button onClick={() => setActiveTab('capa')}
                className="flex items-center gap-1.5 bg-[#eff6ff] border border-[#bfdbfe] px-3 py-1.5 rounded-lg hover:bg-blue-900/40 transition-colors cursor-pointer">
                <span className="text-[#1d4ed8] text-xs">🔧</span>
                <div className="text-left">
                  <div className="text-[9px] font-bold text-[#1d4ed8] uppercase tracking-wide">CAPA</div>
                  <div className="text-[10px] text-[#1d4ed8]">
                    {capa.filter(a => a.status === 'Completed').length}/{capa.length} done
                  </div>
                </div>
              </button>
            ) : (
              <button onClick={() => setActiveTab('capa')}
                className="flex items-center gap-1.5 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer">
                <span className="text-amber-600 text-xs">⚠️</span>
                <div className="text-left">
                  <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">CAPA</div>
                  <div className="text-[10px] text-amber-600">Not started → Add now</div>
                </div>
              </button>
            )}

            {/* Arrow */}
            <span className="text-[#1e3a5f] text-sm font-bold">→</span>

            {/* Step 3 — 8D Report */}
            {complaint.report_generated ? (
              <button onClick={() => setActiveTab('8dreport')}
                className="flex items-center gap-1.5 bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-900/40 transition-colors cursor-pointer">
                <span className="text-purple-400 text-xs">📄</span>
                <div className="text-left">
                  <div className="text-[9px] font-bold text-purple-700 uppercase tracking-wide">8D Report</div>
                  <div className="text-[10px] text-purple-400">Generated → View</div>
                </div>
              </button>
            ) : (
              <button onClick={generate8D} disabled={generating}
                className="flex items-center gap-1.5 bg-[#eff6ff] border border-[#dbeafe] px-3 py-1.5 rounded-lg hover:bg-[#dbeafe] transition-colors cursor-pointer disabled:opacity-50">
                <span className="text-[#1e3a5f] text-xs">📄</span>
                <div className="text-left">
                  <div className="text-[9px] font-bold text-[#1e3a5f] uppercase tracking-wide">8D Report</div>
                  <div className="text-[10px] text-[#1e3a5f]">{generating ? 'Generating…' : 'Not generated → Auto-generate'}</div>
                </div>
              </button>
            )}

            {/* Arrow */}
            <span className="text-[#1e3a5f] text-sm font-bold">→</span>

            {/* Step 4 — Closure */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
              complaint.status === 'Closed'
                ? 'bg-emerald-950/40 border-emerald-500/30'
                : complaint.status === 'Pending Closure' || complaint.status === 'Pending Verification'
                  ? 'bg-orange-950/30 border-orange-200'
                  : 'bg-[#eff6ff] border-[#dbeafe]'
            }`}>
              <span className="text-xs">
                {complaint.status === 'Closed' ? '🏆' : complaint.status === 'Pending Closure' ? '⏳' : '🔓'}
              </span>
              <div>
                <div className={`text-[9px] font-bold uppercase tracking-wide ${
                  complaint.status === 'Closed' ? 'text-[#15803d]'
                    : complaint.status === 'Pending Closure' ? 'text-orange-600' : 'text-[#1e3a5f]'
                }`}>Closure</div>
                <div className={`text-[10px] ${
                  complaint.status === 'Closed' ? 'text-[#15803d]'
                    : complaint.status === 'Pending Closure' ? 'text-orange-400' : 'text-[#1e3a5f]'
                }`}>{complaint.status}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* -- OVERVIEW -------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="animate-fadeIn space-y-4">

          {/* -- AI TRIAGE PANEL ------------------------------------------- */}
          <div className="bg-white rounded-xl border border-amber-500/30 overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-amber-950/60 to-[#0f1a2e] border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🤖</span>
                  <span className="text-sm font-bold text-amber-600 tracking-wide">AI AUTO-TRIAGE</span>
                  <span className="text-xs bg-amber-500/20 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-full ml-1">IATF-AWARE</span>
                </div>
                {triage && !triageRunning && (
                  <span className="text-xs text-[#1e3a5f]">Analysis ready · Based on defect description &amp; category</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!triage && !triageRunning && (
                  <button onClick={() => runTriage(complaint)}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
                    ⚡ Run AI Triage
                  </button>
                )}
                {triageRunning && (
                  <span className="text-amber-600 text-xs animate-pulse">🔄 Analysing defect…</span>
                )}
                {triage && !triageRunning && (
                  <>
                    <button onClick={() => runTriage(complaint)}
                      className="text-xs text-amber-600 hover:text-amber-600 border border-amber-500/30 px-3 py-1 rounded-lg transition-colors">
                      🔄 Re-run
                    </button>
                    <button onClick={() => setTriageOpen(o => !o)}
                      className="text-xs text-[#1e3a5f] hover:text-[#1e3a5f] px-2 py-1 rounded transition-colors">
                      {triageOpen ? '▲ Collapse' : '▼ Expand'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Empty state */}
            {!triage && !triageRunning && (
              <div className="px-5 py-4 text-center text-[#1e3a5f] text-xs">
                Click <strong className="text-amber-600">⚡ Run AI Triage</strong> to get instant severity recommendation, root cause classification, containment actions, IATF clause checklist &amp; 8D complexity estimate.
              </div>
            )}

            {/* Loading */}
            {triageRunning && (
              <div className="px-5 py-6 flex items-center justify-center gap-3 text-amber-600 text-sm">
                <span className="animate-spin">⚙️</span>
                <span>Scanning defect description against IATF 16949 knowledge base…</span>
              </div>
            )}

            {/* Results */}
            {triage && !triageRunning && triageOpen && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Severity Recommendation */}
                <div className="bg-[#dbeafe] rounded-lg p-4 border border-[#dbeafe]">
                  <p className="text-xs text-[#1e3a5f] uppercase tracking-wide mb-2">Severity Recommendation</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mb-2 ${SEV_REC_STYLE[triage.severityRec]}`}>
                    {triage.severityRec === 'Critical' ? '🔴' : triage.severityRec === 'High' ? '🟠' : triage.severityRec === 'Medium' ? '🟡' : '🟢'} {triage.severityRec}
                  </div>
                  <p className="text-xs text-[#1e3a5f] leading-relaxed">{triage.severityJustification}</p>
                </div>

                {/* Root Cause Category */}
                <div className="bg-[#dbeafe] rounded-lg p-4 border border-[#dbeafe]">
                  <p className="text-xs text-[#1e3a5f] uppercase tracking-wide mb-2">Likely Root Cause (5M)</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{triage.rootCauseCategoryIcon}</span>
                    <span className="text-sm font-bold text-white">{triage.rootCauseCategory}</span>
                  </div>
                  <p className="text-xs text-[#1e3a5f] leading-relaxed">{triage.rootCauseDetail}</p>
                </div>

                {/* 8D Complexity */}
                <div className="bg-[#dbeafe] rounded-lg p-4 border border-[#dbeafe]">
                  <p className="text-xs text-[#1e3a5f] uppercase tracking-wide mb-2">8D Complexity Estimate</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mb-2 ${COMPLEXITY_STYLE[triage.complexity]}`}>
                    {triage.complexity === 'Simple' ? '🟢' : triage.complexity === 'Standard' ? '🟡' : '🔴'} {triage.complexity}
                  </div>
                  <p className="text-xs text-[#1e3a5f] leading-relaxed">{triage.complexityReason}</p>
                </div>

                {/* Containment Actions */}
                <div className="bg-[#dbeafe] rounded-lg p-4 border border-[#dbeafe] md:col-span-2">
                  <p className="text-xs text-[#1e3a5f] uppercase tracking-wide mb-3">Recommended Containment Actions (D3)</p>
                  <div className="space-y-2">
                    {triage.containmentActions.map((action, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <p className="text-xs text-[#1e3a5f] leading-relaxed">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignee Recommendation */}
                <div className="bg-[#dbeafe] rounded-lg p-4 border border-[#dbeafe]">
                  <p className="text-xs text-[#1e3a5f] uppercase tracking-wide mb-2">Recommended Assignee Role</p>
                  <p className="text-sm font-bold text-white mb-1">👤 {triage.assigneeRole}</p>
                  <p className="text-xs text-[#1e3a5f] leading-relaxed">{triage.assigneeRationale}</p>
                </div>

                {/* IATF Clauses */}
                <div className="bg-[#dbeafe] rounded-lg p-4 border border-[#dbeafe] md:col-span-2 xl:col-span-3">
                  <p className="text-xs text-[#1e3a5f] uppercase tracking-wide mb-3">IATF 16949 Clause Checklist for This Complaint</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {triage.iatfClauses.map(c => (
                      <div key={c.clause} className="flex items-center gap-2 bg-[#eff6ff] rounded-lg px-3 py-2">
                        <span className="text-green-400 text-sm">☑</span>
                        <div>
                          <span className="text-xs font-bold text-amber-600">Cl. {c.clause}</span>
                          <span className="text-xs text-[#1e3a5f] ml-1.5">{c.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#1e3a5f] mt-2">Review all checked clauses during internal audit of this complaint.</p>
                </div>

              </div>
            )}
          </div>

          {/* -- EXISTING OVERVIEW GRID ----------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600">
              <h3 className="font-semibold text-[#1e3a5f] text-sm mb-3 uppercase tracking-wide">Customer &amp; Complaint Info</h3>
              <div className="space-y-2">
                {[['Complaint No.', complaint.complaint_number],['Customer', complaint.customer_name],['Customer Contact', complaint.customer_contact || '—'],['Customer Ref No.', complaint.customer_ref || '—'],['Source', complaint.complaint_source],['Date Logged', complaint.created_at?.slice(0, 10)],['Assigned To', complaint.assigned_to || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-[#1e3a5f] text-xs">{k}</span><span className="font-medium text-[#1e3a5f] text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
              <h3 className="font-semibold text-[#1e3a5f] text-sm mb-3 uppercase tracking-wide">Part &amp; Defect Info</h3>
              <div className="space-y-2">
                {[['Part Number', complaint.part_number || '—'],['Part Name', complaint.part_name || '—'],['Defect Category', complaint.defect_category],['Rejection Qty', `${complaint.quantity_affected} pcs`],['Total Supplied', `${complaint.total_supplied || '—'} pcs`],['PPM', complaint.total_supplied > 0 ? `${Math.round((complaint.quantity_affected / complaint.total_supplied) * 1000000)} PPM` : '—'],['Batch No.', complaint.batch_number || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-[#1e3a5f] text-xs">{k}</span><span className="font-medium text-[#1e3a5f] text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 col-span-full">
              <h3 className="font-semibold text-[#1e3a5f] text-sm mb-2">Defect Description</h3>
              <p className="text-[#1e3a5f] text-sm leading-relaxed bg-[#eff6ff] rounded-lg p-3">{complaint.defect_description}</p>
              {complaint.remarks && <><h3 className="font-semibold text-[#1e3a5f] text-sm mb-2 mt-3">Remarks / Notes</h3><p className="text-[#1e3a5f] text-sm bg-[#eff6ff] rounded-lg p-3">{complaint.remarks}</p></>}
            </div>

            {/* -- RELATED RECORDS (Inter-module links) ------------------ */}
            <div className="col-span-full bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-[#1e3a5f] text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                🔗 Related Records
                <span className="text-xs font-normal text-[#1e3a5f] normal-case tracking-normal">Click to navigate</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: '8D Report', icon: '📄', count: complaint.report_generated ? 1 : 0, tab: '8dreport', desc: complaint.report_generated ? 'Generated' : 'Not generated', color: complaint.report_generated ? 'border-green-400 bg-green-900/30' : 'border-[#dbeafe] bg-[#eff6ff]' },
                  { label: 'CAPA Actions', icon: '✅', count: capa.length, tab: 'capa', desc: `${capa.filter(c => c.status === 'Completed').length} completed`, color: capa.length > 0 ? 'border-blue-400 bg-[#eff6ff]' : 'border-[#dbeafe] bg-[#eff6ff]' },
                  { label: 'Containment', icon: '🛡️', count: containment.length, tab: 'containment', desc: `${containment.filter(c => c.status === 'Completed').length} completed`, color: containment.length > 0 ? 'border-orange-400 bg-orange-900/30' : 'border-[#dbeafe] bg-[#eff6ff]' },
                  { label: 'Team Members', icon: '👥', count: team.length, tab: 'team', desc: team.find(m => m.role_in_team === 'Champion')?.member_name?.split(' ')[0] || 'No champion', color: team.length > 0 ? 'border-purple-400 bg-purple-900/30' : 'border-[#dbeafe] bg-[#eff6ff]' },
                  { label: 'Timeline Events', icon: '🕐', count: timeline.length, tab: 'timeline', desc: 'Full audit trail', color: timeline.length > 0 ? 'border-indigo-400 bg-indigo-900/30' : 'border-[#dbeafe] bg-[#eff6ff]' },
                ].map(r => (
                  <button key={r.label} onClick={() => setActiveTab(r.tab)}
                    className={`rounded-xl border-2 ${r.color} p-3 text-left hover:opacity-80 transition`}>
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="text-lg font-bold text-[#1e3a5f] leading-none">{r.count}</div>
                    <div className="text-xs font-semibold text-[#1e3a5f] mt-0.5">{r.label}</div>
                    <div className="text-[10px] text-[#1e3a5f] mt-0.5">{r.desc}</div>
                  </button>
                ))}
                <div className="rounded-xl border-2 border-[#dbeafe] bg-[#eff6ff] p-3">
                  <div className="text-xl mb-1">⚙️</div>
                  <div className="text-xs font-semibold text-[#1e3a5f] mt-0.5 mb-1">Linked Modules</div>
                  <Link href={`/pfmea?ref=${complaint.complaint_number}`} className="block text-[10px] text-blue-600 hover:underline mb-0.5">→ PFMEA ({complaint.part_number || 'link'})</Link>
                  <Link href={`/control-plan?ref=${complaint.complaint_number}`} className="block text-[10px] text-blue-600 hover:underline mb-0.5">→ Control Plan</Link>
                  <Link href={`/spc?ref=${complaint.complaint_number}`} className="block text-[10px] text-blue-600 hover:underline">→ SPC Analysis</Link>
                </div>
              </div>
            </div>

            {/* -- APPROVAL PANEL ---------------------------------------- */}
            <div className={`col-span-full rounded-xl border-2 p-5 ${
              complaint.approval_status === 'approved' ? 'border-green-300 bg-green-900/30' :
              complaint.approval_status === 'rejected' ? 'border-red-300 bg-red-50' :
              'border-yellow-300 bg-yellow-900/30'
            }`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-[#1e3a5f] text-sm flex items-center gap-2">
                    {complaint.approval_status === 'approved' ? '✅' : complaint.approval_status === 'rejected' ? '❌' : '⏳'}
                    Quality Head Approval
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      complaint.approval_status === 'approved' ? 'bg-green-600 text-white' :
                      complaint.approval_status === 'rejected' ? 'bg-red-600 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {complaint.approval_status === 'approved' ? 'APPROVED' : complaint.approval_status === 'rejected' ? 'REJECTED' : 'PENDING'}
                    </span>
                  </h3>
                  {complaint.approval_status === 'approved' && (
                    <p className="text-xs text-[#15803d] mt-1">
                      Approved by <strong>{complaint.approved_by}</strong> on {new Date(complaint.approved_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {complaint.approval_status === 'rejected' && (
                    <p className="text-xs text-red-700 mt-1">Rejection reason: <strong>{complaint.rejection_reason}</strong></p>
                  )}
                  {(!complaint.approval_status || complaint.approval_status === 'pending') && (
                    <p className="text-xs text-yellow-300 mt-1">Requires Quality Head sign-off before complaint can be closed (IATF 16949 §10.2.3)</p>
                  )}
                </div>
                {complaint.approval_status !== 'approved' && (
                  canApprove ? (
                    <div className="flex gap-2">
                      <button
                        onClick={approveComplaint}
                        disabled={approving}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {approving ? 'Saving…' : '✅ Approve for Closure'}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={approving}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <span className="text-amber-600 text-lg">🔒</span>
                      <span className="text-xs text-amber-700 font-medium">Approval requires <strong>Quality Head</strong> access</span>
                    </div>
                  )
                )}
                {complaint.approval_status === 'approved' && canApprove && (
                  <button
                    onClick={() => patchComplaint({ approval_status: 'pending', approved_by: '', approved_at: '' }).then(fetchAll)}
                    className="text-xs text-[#1e3a5f] hover:text-red-600 underline transition"
                  >
                    Revoke approval
                  </button>
                )}
              </div>
            </div>

            {/* Reject reason modal */}
            {showRejectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                  <h3 className="font-bold text-white text-base mb-1">Reject &amp; Send Back</h3>
                  <p className="text-xs text-[#1e3a5f] mb-4">State the reason — this will be logged in the timeline and the complaint will return to CAPA In Progress.</p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Root cause not fully validated. D4 Why Made incomplete."
                    className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="text-sm px-4 py-2 border border-[#dbeafe] rounded-lg text-[#1e3a5f] hover:bg-[#dbeafe]">Cancel</button>
                    <button onClick={rejectComplaint} disabled={!rejectReason.trim() || approving} className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-40">
                      {approving ? 'Saving…' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        )}

        {/* -- D1 TEAM --------------------------------------------------- */}
        {activeTab === 'team' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3 flex items-center justify-between">
              <div><h2 className="font-bold text-sm">D1 — Team Members</h2><p className="text-blue-200 text-xs">Champion + all team members responsible for this 8D</p></div>
              <button onClick={() => setShowTeamForm(!showTeamForm)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium">+ Add Member</button>
            </div>
            {showTeamForm && (
              <div className="border-b border-[#dbeafe] p-4 bg-[#eff6ff]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <Input label="Full Name *" value={newMember.member_name} onChange={v => setNewMember(p => ({ ...p, member_name: v }))} required placeholder="e.g. Jatadhari Behera" />
                  <Select label="Role in Team" value={newMember.role_in_team} onChange={v => setNewMember(p => ({ ...p, role_in_team: v }))} options={['Champion','Team Leader','Member','Production Supervisor','Process Engineer','Quality Inspector','Customer Representative','Supplier Representative']} />
                  <Input label="Designation" value={newMember.designation} onChange={v => setNewMember(p => ({ ...p, designation: v }))} placeholder="e.g. Quality Manager" />
                  <Input label="Department" value={newMember.department} onChange={v => setNewMember(p => ({ ...p, department: v }))} placeholder="e.g. Quality" />
                  <Input label="Phone Number" value={newMember.contact_number} onChange={v => setNewMember(p => ({ ...p, contact_number: v }))} placeholder="9876543210" />
                  <Input label="Email Address" value={newMember.email} onChange={v => setNewMember(p => ({ ...p, email: v }))} placeholder="name@company.com" />
                </div>
                <div className="flex gap-2"><button onClick={addTeamMember} className="bg-blue-900/40 text-[#1d4ed8] text-xs px-4 py-1.5 rounded font-medium">Add Member</button><button onClick={() => setShowTeamForm(false)} className="text-[#1e3a5f] text-xs px-4 py-1.5 border rounded">Cancel</button></div>
              </div>
            )}
            {team.length === 0 ? (
              <div className="p-10 text-center text-[#1e3a5f]">No team members added yet. Add Champion first, then all team members.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#eff6ff] text-xs text-[#1e3a5f]">
                  <tr>{['Role','Name','Designation','Department','Phone','Email',''].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {team.map(m => (
                    <tr key={m.id} className="border-t border-[#dbeafe] hover:bg-[#dbeafe]">
                      <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${m.role_in_team === 'Champion' ? 'bg-blue-900/40 text-[#1d4ed8]' : m.role_in_team === 'Team Leader' ? 'bg-blue-100 text-blue-200' : 'bg-[#f0f9ff]/40 text-[#1e3a5f]'}`}>{m.role_in_team}</span></td>
                      <td className="px-4 py-2 font-semibold text-[#1e3a5f]">{m.member_name}</td>
                      <td className="px-4 py-2 text-[#1e3a5f]">{m.designation}</td>
                      <td className="px-4 py-2 text-[#1e3a5f]">{m.department}</td>
                      <td className="px-4 py-2 text-[#1e3a5f]">{m.contact_number}</td>
                      <td className="px-4 py-2 text-[#1e3a5f]">{m.email}</td>
                      <td className="px-4 py-2"><button onClick={() => removeTeamMember(m.id)} className="text-red-600 hover:text-red-600 text-xs">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* -- D2 PROBLEM ------------------------------------------------ */}
        {activeTab === 'problem' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3"><h2 className="font-bold text-sm">D2 — Problem Description (5W2H)</h2><p className="text-blue-200 text-xs">Impact on customer + Facilities involved</p></div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { q: 'WHAT is the problem?', a: complaint.defect_description },
                  { q: 'WHERE was it found?', a: `At Customer: ${complaint.customer_name}` },
                  { q: 'WHEN was it reported?', a: complaint.created_at?.slice(0, 10) },
                  { q: 'WHO reported it?', a: `${complaint.customer_name} Quality Team` },
                  { q: 'WHICH part is affected?', a: `${complaint.part_number} — ${complaint.part_name}` },
                  { q: 'HOW MANY parts affected?', a: `${complaint.quantity_affected} pcs rejected` },
                  { q: 'HOW MUCH is the impact?', a: `Severity: ${complaint.severity} | ${complaint.total_supplied > 0 ? `${Math.round((complaint.quantity_affected / complaint.total_supplied) * 1000000)} PPM` : 'PPM N/A'}` },
                ].map(item => (
                  <div key={item.q} className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                    <p className="text-xs font-bold text-[#1d4ed8] mb-1">{item.q}</p>
                    <p className="text-sm text-[#1e3a5f]">{item.a}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-900 mb-1">Impact on Customer</p>
                  <p className="text-sm text-[#1e3a5f]">Customer dissatisfaction — potential for production line disruption / field failure (Severity: {complaint.severity})</p>
                </div>
                <div className="bg-[#eff6ff] border border-blue-800/50 rounded-lg p-3">
                  <p className="text-xs font-bold text-[#1d4ed8] mb-1">Facilities Involved</p>
                  <p className="text-sm text-[#1e3a5f]">Customer: {complaint.customer_name} | Supplier: Our Plant | Transit: Under review</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -- D3 CONTAINMENT -------------------------------------------- */}
        {activeTab === 'containment' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3 flex items-center justify-between">
              <div><h2 className="font-bold text-sm">D3 — Interim Containment Actions</h2><p className="text-blue-200 text-xs">Immediate actions to protect the customer + sorting results</p></div>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-blue-200 text-xs">{completedContainment}/{containment.length} done</span>
                <button onClick={() => setShowContainmentForm(!showContainmentForm)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium">+ Add Action</button>
              </div>
            </div>
            {showContainmentForm && (
              <div className="border-b border-[#dbeafe] p-4 bg-orange-900/30">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div className="col-span-2 md:col-span-3"><Textarea label="Action Description *" value={newContainment.action_description} onChange={v => setNewContainment(p => ({ ...p, action_description: v }))} rows={2} /></div>
                  <Select label="Location" value={newContainment.location} onChange={v => setNewContainment(p => ({ ...p, location: v }))} options={['At Plant','At Customer','In Transit','Incoming Store','WIP','Finished Goods']} />
                  <Input label="Responsible Person" value={newContainment.responsible_person} onChange={v => setNewContainment(p => ({ ...p, responsible_person: v }))} placeholder="Name" />
                  <Input label="Target Date" value={newContainment.target_date} onChange={v => setNewContainment(p => ({ ...p, target_date: v }))} type="date" />
                  <Input label="Qty Sorted" value={newContainment.qty_sorted} onChange={v => setNewContainment(p => ({ ...p, qty_sorted: v }))} type="number" />
                  <Input label="Qty Rejected / Defect" value={newContainment.qty_rejected} onChange={v => setNewContainment(p => ({ ...p, qty_rejected: v }))} type="number" />
                  <Input label="Qty OK (Certified)" value={newContainment.qty_ok} onChange={v => setNewContainment(p => ({ ...p, qty_ok: v }))} type="number" />
                  <Select label="Other Product / Platform at Risk?" value={newContainment.other_platform_risk} onChange={v => setNewContainment(p => ({ ...p, other_platform_risk: v }))} options={['No','Yes — Same process','Yes — Similar part','Yes — Multiple platforms','Under investigation']} />
                  <div className="col-span-2"><Input label="Identification of Certified Material (how certified parts are marked)" value={newContainment.certified_material_id} onChange={v => setNewContainment(p => ({ ...p, certified_material_id: v }))} placeholder="e.g. White Dot Mark / Green Sticker / Special Tag" /></div>
                  <div className="col-span-3"><Input label="Evidence / Verification Method" value={newContainment.evidence} onChange={v => setNewContainment(p => ({ ...p, evidence: v }))} placeholder="How will this action be verified?" /></div>
                </div>
                <div className="flex gap-2"><button onClick={addContainment} className="bg-blue-900/40 text-[#1d4ed8] text-xs px-4 py-1.5 rounded font-medium">Save Action</button><button onClick={() => setShowContainmentForm(false)} className="text-[#1e3a5f] text-xs px-4 py-1.5 border rounded">Cancel</button></div>
              </div>
            )}
            {containment.length === 0 ? (
              <div className="p-10 text-center text-[#1e3a5f]">No containment actions yet. Add D3 actions — this moves complaint to &quot;Under Investigation&quot; status.</div>
            ) : (
              <div className="p-4 space-y-3">
                {containment.map(a => (
                  <div key={a.id} className="border border-[#dbeafe] rounded-lg p-4 hover:border-blue-700/50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="bg-blue-900/40 text-[#1d4ed8] text-xs px-2 py-0.5 rounded font-bold">#{a.action_number}</span>
                          <span className="text-xs text-[#1e3a5f] bg-[#f0f9ff]/40 px-2 py-0.5 rounded">{a.location}</span>
                          <select value={a.status} onChange={e => updateContainmentStatus(a.id, e.target.value)}
                            className={`text-xs px-2 py-0.5 rounded font-semibold cursor-pointer border-0 ${a.status === 'Completed' ? 'bg-green-100 text-green-300' : a.status === 'Planned' ? 'bg-[#f0f9ff]/40 text-[#1e3a5f]' : 'bg-blue-100 text-blue-200'}`}>
                            {['Planned','In Progress','Completed','Overdue'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <p className="text-sm text-[#1e3a5f] font-medium">{a.action_description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-[#1e3a5f] flex-wrap">
                          <span>Owner: {a.responsible_person || '—'}</span>
                          <span>Target: {a.target_date || '—'}</span>
                          {a.completion_date && <span className="text-green-600">Done: {a.completion_date}</span>}
                        </div>
                        {(a.qty_sorted > 0) && (
                          <div className="flex gap-3 mt-2 text-xs bg-[#eff6ff] rounded p-2">
                            <span className="text-[#1e3a5f]">Sorted: <b>{a.qty_sorted}</b></span>
                            <span className="text-red-600">Defects: <b>{a.qty_rejected}</b></span>
                            <span className="text-green-600">OK: <b>{a.qty_ok}</b></span>
                          </div>
                        )}
                        <div className="flex gap-3 mt-1 text-xs flex-wrap">
                          {a.other_platform_risk && <span className="text-orange-600">Platform risk: {a.other_platform_risk}</span>}
                          {a.certified_material_id && <span className="text-blue-600">Certified ID: {a.certified_material_id}</span>}
                          {a.evidence && <span className="text-[#1e3a5f]">Evidence: {a.evidence}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteContainment(a.id)} className="text-red-600 hover:text-red-600 text-xs flex-shrink-0">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -- D4 ROOT CAUSE --------------------------------------------- */}
        {activeTab === 'rootcause' && (
          <div className="animate-fadeIn space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
                <div><h2 className="font-bold text-[#1e3a5f] text-sm">D4 — Root Cause Analysis</h2><p className="text-xs text-[#1e3a5f]">Two separate 5-Why analyses: (1) Why Made — why the defect occurred, (2) Why Shipped — why it was not detected</p></div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!complaint) return;
                      setGeneratingWhys(true);
                      setAiWhyResult(null);
                      // Simulate AI processing delay for UX
                      setTimeout(() => {
                        const d = (complaint.defect_description || '').toLowerCase();
                        const cat = complaint.defect_category || 'General';

                        const occMap: Record<string, string[]> = {
                          'Dimensional': ['Tool wear exceeded limit — next inspection was not due until next shift.','SPC control chart showed Out-Of-Control condition but operator did not escalate.','Process parameter (feed rate / spindle speed) deviated from SOP without approval.','Engineering change was implemented without updating process instructions.','Root Cause: Inadequate change management process — no APQP gate review for this change.'],
                          'Surface Finish': ['Contamination introduced during inter-process handling — no protective covers used.','Coolant concentration was out of spec — daily check was not performed.','Tool was worn beyond acceptable limit — tool life management system not followed.','Operator was not trained on latest work instruction revision.','Root Cause: Control plan did not specify handling / storage requirement for this process step.'],
                          'Functional': ['Process parameter deviated beyond validated range during production run.','Setup approval was done on first piece only — process drifted during the run.','Critical characteristic was not included in the control plan for this operation.','PFMEA did not identify this failure mode — DVP results were not cascaded to PFMEA.','Root Cause: APQP cross-functional review was not completed before SOP.'],
                          'Weld Defect': ['Welding parameters (current / voltage / travel speed) deviated from WPS.','Welder qualification had expired — not checked by supervisor before start of shift.','Base metal had surface contamination — pre-weld cleaning step was skipped.','Poka-yoke for weld parameter monitoring was disabled for maintenance and not reinstated.','Root Cause: Process audit had not covered this welding station in the last quarter.'],
                          'Assembly': ['Operator picked wrong part from unlabelled bin — 5S not maintained at workstation.','Part bins for similar-looking parts were stored adjacent without visual differentiation.','Work instruction did not specify part verification step before assembly.','Poka-yoke (vision system / torque monitor) was bypassed during rush production.','Root Cause: Mistake-proofing effectiveness review was overdue — not conducted per schedule.'],
                          'General': ['Process deviated from standard — deviation was not identified by first-piece inspection.','Inspection frequency was insufficient to detect the drift in time.','Control plan did not specify this characteristic as critical — detection frequency was low.','Operator training records show gap for this operation — competency not formally assessed.','Root Cause: Risk assessment (PFMEA) rated this failure mode low — occurrence controls were inadequate.'],
                        };
                        const escMap: Record<string, string[]> = {
                          'Dimensional': ['Final inspection gauge was out of calibration — calibration due date was missed.','Gauge R&R study was not conducted for this measurement — measurement error was undetected.','100% inspection was not specified in control plan for this characteristic.','Inspector skipped measurement due to production pressure — no second-person verification.','Root Cause (Escape): Detection control in PFMEA was rated too optimistic — not validated with MSA data.'],
                          'Surface Finish': ['Visual inspection standard (limit sample) was not available at the inspection station.','Lighting at inspection station was inadequate — defect not visible under normal conditions.','Inspector was not trained on the latest visual standard revision.','Sampling plan was AQL-based — defective lot passed within acceptable quality limit.','Root Cause (Escape): Attribute Agreement Analysis (AAA) had not been conducted for visual inspection — repeatability was unknown.'],
                          'Functional': ['Functional test was not 100% — sampling plan allowed the defective units to pass.','Test equipment was not calibrated — false pass reading was given.','Test parameter was set incorrectly — boundary condition was not tested.','Outgoing QC inspector was not aware that this characteristic required functional verification.','Root Cause (Escape): Control plan did not link functional test requirement to this process step.'],
                          'Weld Defect': ['NDT (PT/MT/UT) was not specified for this weld joint in the control plan.','Visual inspection of weld bead was done without adequate magnification.','Weld inspector was not Level II certified for this inspection method.','Inspection was done before weld fully cooled — defect was not yet visible.','Root Cause (Escape): MSA on weld inspection method had not been performed — inspector agreement was not validated.'],
                          'Assembly': ['Outgoing inspection did not include check for this assembly attribute.','Camera / vision system detection threshold was not sensitive enough for this defect.','Final inspection checklist was outdated — did not include recently added characteristic.','Product was shipped before inspection was completed due to logistics pressure.','Root Cause (Escape): Control plan had not been updated after last customer complaint for similar issue.'],
                          'General': ['Detection control was not effective — inspection method had high measurement uncertainty.','Defect was intermittent — sampling plan did not capture it consistently.','Inspector relied on visual detection for a characteristic requiring measurement.','Outgoing inspection record was signed before actual inspection was complete.','Root Cause (Escape): Detection rating in PFMEA was not validated — assumed best-case scenario.'],
                        };

                        const occArr = occMap[cat] ?? occMap['General'];
                        const escArr = escMap[cat] ?? escMap['General'];
                        setAiWhyResult({ occurrence: occArr, escape: escArr });
                        setGeneratingWhys(false);
                      }, 900);
                    }}
                    disabled={generatingWhys}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-60"
                  >
                    {generatingWhys ? (
                      <><span className="animate-spin inline-block">⟳</span> Generating…</>
                    ) : '🤖 AI 5-Why Generator'}
                  </button>
                  <button onClick={saveWhys} disabled={saving} className="bg-blue-900/40 text-[#1d4ed8] text-xs px-4 py-1.5 rounded-lg font-medium disabled:opacity-60 border border-blue-700/50">{saving ? 'Saving...' : 'Save Both Analyses'}</button>
                </div>
              </div>

              {/* AI 5-Why Result Panel */}
              {aiWhyResult && (
                <div className="mb-4 border border-indigo-700/50 bg-indigo-900/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-indigo-300">🤖 AI-Generated 5-Why Starters</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-700/50">Based on {complaint?.defect_category || 'General'} defect pattern</span>
                    </div>
                    <button onClick={() => setAiWhyResult(null)} className="text-[#1e3a5f] hover:text-[#1e3a5f] text-xs">✕ Dismiss</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Occurrence */}
                    <div className="bg-white rounded-lg p-3 border border-orange-700/50">
                      <div className="text-xs font-bold text-orange-600 mb-2">🔴 Why Made — Occurrence Root Cause</div>
                      <div className="space-y-1.5">
                        {aiWhyResult.occurrence.map((w, i) => (
                          <div key={i} className="text-xs text-[#1e3a5f] flex gap-2">
                            <span className="text-orange-500 font-bold shrink-0">W{i+1}.</span>
                            <span className="leading-relaxed">{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Escape */}
                    <div className="bg-white rounded-lg p-3 border border-blue-700/50">
                      <div className="text-xs font-bold text-[#1d4ed8] mb-2">🔵 Why Shipped — Escape Root Cause</div>
                      <div className="space-y-1.5">
                        {aiWhyResult.escape.map((w, i) => (
                          <div key={i} className="text-xs text-[#1e3a5f] flex gap-2">
                            <span className="text-blue-500 font-bold shrink-0">W{i+1}.</span>
                            <span className="leading-relaxed">{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-indigo-500 italic">These are AI-generated starting points. Validate with your team and customize for your specific situation.</p>
                    <button
                      onClick={() => {
                        // Apply to occurrence whys
                        const newOcc = occurrenceWhys.map((row, i) => ({
                          ...row,
                          why_answer: aiWhyResult.occurrence[i] ?? row.why_answer,
                        }));
                        const newEsc = escapeWhys.map((row, i) => ({
                          ...row,
                          why_answer: aiWhyResult.escape[i] ?? row.why_answer,
                        }));
                        setOccurrenceWhys(newOcc);
                        setEscapeWhys(newEsc);
                        setAiWhyResult(null);
                      }}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                    >
                      ✓ Apply to 5-Why Editor
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <WhyEditor label="Why Made — Root Cause of Occurrence" color="border-orange-400" whys={occurrenceWhys} onChange={setOccurrenceWhys} />
                <WhyEditor label="Why Shipped — Root Cause of Escape" color="border-blue-400" whys={escapeWhys} onChange={setEscapeWhys} />
              </div>
            </div>
          </div>
        )}

        {/* -- D5 CAPA --------------------------------------------------- */}
        {activeTab === 'capa' && (
          <div className="animate-fadeIn space-y-4">
            {/* Manual CA text for Why Made and Why Shipped */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
              <h2 className="font-bold text-[#1e3a5f] text-sm mb-1">D5 — Permanent Corrective Actions</h2>
              <p className="text-xs text-[#1e3a5f] mb-4">Separate actions for Why Made (Occurrence) and Why Shipped (Escape)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border-2 border-orange-700/50 rounded-xl overflow-hidden">
                  <div className="bg-orange-900/30 px-4 py-2 text-xs font-bold text-orange-200">Corrective Action — For Why Made (Occurrence)</div>
                  <div className="p-3"><Textarea label="" value={d5WhyMade} onChange={setD5WhyMade} rows={8} /></div>
                </div>
                <div className="border-2 border-blue-700/50 rounded-xl overflow-hidden">
                  <div className="bg-[#eff6ff] px-4 py-2 text-xs font-bold text-blue-100">Corrective Action — For Why Shipped (Escape)</div>
                  <div className="p-3"><Textarea label="" value={d5WhyShipped} onChange={setD5WhyShipped} rows={8} /></div>
                </div>
              </div>
              <button onClick={saveD5} disabled={saving} className="bg-blue-900/40 text-[#1d4ed8] text-xs px-5 py-1.5 rounded font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save D5 Actions'}</button>
            </div>

            {/* CAPA action table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3 flex items-center justify-between">
                <div><h3 className="font-bold text-sm">CAPA Action Register</h3><p className="text-blue-200 text-xs">Track individual corrective / preventive actions with owners and dates</p></div>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-blue-200 text-xs">{completedCapa}/{capa.length} completed</span>
                  <button onClick={() => setShowCapaForm(!showCapaForm)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium">+ Add Action</button>
                </div>
              </div>
              {showCapaForm && (
                <div className="border-b border-[#dbeafe] p-4 bg-green-900/30">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <Select label="CAPA Section" value={newCapa.capa_section} onChange={v => setNewCapa(p => ({ ...p, capa_section: v }))} options={['Why Made','Why Shipped','Both','Horizontal Deployment']} />
                    <Select label="Action Type" value={newCapa.action_type} onChange={v => setNewCapa(p => ({ ...p, action_type: v }))} options={['Corrective','Preventive','Process Change','Horizontal Deployment','Document Update']} />
                    <Select label="Document to Update" value={newCapa.document_to_update} onChange={v => setNewCapa(p => ({ ...p, document_to_update: v }))} options={['PFMEA','Control Plan','Work Instruction / ODS','SOP','Training Record','DFMEA','Process Flow','Multiple','None']} />
                    <div className="col-span-2 md:col-span-3"><Textarea label="Action Description *" value={newCapa.action_description} onChange={v => setNewCapa(p => ({ ...p, action_description: v }))} rows={2} /></div>
                    <Input label="Responsible Person" value={newCapa.responsible_person} onChange={v => setNewCapa(p => ({ ...p, responsible_person: v }))} placeholder="Name" />
                    <Input label="Target Date" value={newCapa.target_date} onChange={v => setNewCapa(p => ({ ...p, target_date: v }))} type="date" />
                    <Input label="Verification Method" value={newCapa.verification_method} onChange={v => setNewCapa(p => ({ ...p, verification_method: v }))} placeholder="How effectiveness will be verified" />
                  </div>
                  <div className="flex gap-2"><button onClick={addCapa} className="bg-blue-900/40 text-[#1d4ed8] text-xs px-4 py-1.5 rounded font-medium">Save</button><button onClick={() => setShowCapaForm(false)} className="text-[#1e3a5f] text-xs px-4 py-1.5 border rounded">Cancel</button></div>
                </div>
              )}
              {capa.length === 0 ? (
                <div className="p-10 text-center text-[#1e3a5f]">No actions added yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#eff6ff] text-[#1e3a5f]">
                      <tr>{['#','Section','Type','Action Description','Doc','Owner','Target','Status',''].map(h => <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {capa.map(a => (
                        <tr key={a.id} className="border-t border-[#dbeafe] hover:bg-[#dbeafe]">
                          <td className="px-3 py-2 font-bold text-blue-100">#{a.action_number}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[#1e3a5f]">{(a as unknown as Record<string, string>).capa_section || '—'}</td>
                          <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${a.action_type === 'Corrective' ? 'bg-red-100 text-red-700' : a.action_type === 'Preventive' ? 'bg-blue-100 text-[#1d4ed8]' : 'bg-purple-100 text-purple-300'}`}>{a.action_type}</span></td>
                          <td className="px-3 py-2 text-[#1e3a5f] max-w-xs">{a.action_description}</td>
                          <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.document_to_update || '—'}</td>
                          <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.responsible_person || '—'}</td>
                          <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.target_date || '—'}</td>
                          <td className="px-3 py-2">
                            <select value={a.status} onChange={e => updateCapaStatus(a.id, e.target.value)}
                              className={`text-xs px-2 py-0.5 rounded font-semibold cursor-pointer border-0 ${a.status === 'Completed' || a.status === 'Verified' ? 'bg-green-100 text-green-300' : a.status === 'In Progress' ? 'bg-blue-100 text-blue-200' : a.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-[#f0f9ff]/40 text-[#1e3a5f]'}`}>
                              {['Planned','In Progress','Completed','Overdue','Verified'].map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2"><button onClick={async () => { await fetch(`/api/complaints/${id}/capa/${a.id}`, { method: 'DELETE' }); fetchAll(); }} className="text-red-600 hover:text-red-600">✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -- D6 VERIFICATION ------------------------------------------- */}
        {activeTab === 'verification' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3"><h2 className="font-bold text-sm">D6 — Verification of Corrective Actions</h2><p className="text-blue-200 text-xs">Verify that corrective actions eliminate root cause — turn on / turn off test + statistical evidence</p></div>
            <div className="p-5 space-y-4">
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-xs font-bold text-yellow-100 mb-1">Key Verification Question</p>
                <p className="text-xs text-yellow-200">Has the issue been turned ON and OFF? This means: (1) Can you reproduce the defect by removing the corrective action? (2) Does the defect disappear when the corrective action is in place?</p>
              </div>
              <Textarea label="Verification Details — How the issue was verified (turned on / turned off + statistical evidence)" value={d6.verification} onChange={v => setD6(p => ({ ...p, verification: v }))} rows={6} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#dbeafe] rounded-xl p-4">
                  <p className="text-xs font-bold text-[#1d4ed8] mb-3">Corrective Action Owner</p>
                  <div className="space-y-3">
                    <Input label="C.A. Owner Name" value={d6.ca_owner} onChange={v => setD6(p => ({ ...p, ca_owner: v }))} placeholder="Quality Manager name" />
                    <Input label="C.A. Owner Phone" value={d6.ca_owner_phone} onChange={v => setD6(p => ({ ...p, ca_owner_phone: v }))} placeholder="Phone number" />
                    <Input label="C.A. Owner Email" value={d6.ca_owner_email} onChange={v => setD6(p => ({ ...p, ca_owner_email: v }))} placeholder="Email address" />
                    <Input label="Target Completion Date" value={d6.target_date} onChange={v => setD6(p => ({ ...p, target_date: v }))} type="date" />
                  </div>
                </div>
                <div className="border border-[#dbeafe] rounded-xl p-4">
                  <p className="text-xs font-bold text-[#1d4ed8] mb-3">Certified Material</p>
                  <div className="space-y-3">
                    <Input label="Build Date for Certified Material" value={d6.certified_build_date} onChange={v => setD6(p => ({ ...p, certified_build_date: v }))} type="date" />
                    <Textarea label="How Will New / Certified Parts Be Identified?" value={d6.certified_part_id} onChange={v => setD6(p => ({ ...p, certified_part_id: v }))} rows={4} />
                  </div>
                </div>
              </div>
              <button onClick={saveD6} disabled={saving} className="bg-blue-900/40 text-[#1d4ed8] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#eff6ff] transition disabled:opacity-60">{saving ? 'Saving...' : 'Save D6 Verification'}</button>
            </div>
          </div>
        )}

        {/* -- D7 PREVENTION --------------------------------------------- */}
        {activeTab === 'prevention' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3"><h2 className="font-bold text-sm">D7 — Systemic Prevention</h2><p className="text-blue-200 text-xs">Prevent recurrence in all similar products, platforms, processes + update all documents</p></div>
            <div className="p-3 sm:p-5 space-y-4">
              <Textarea label="How will this issue be avoided in the future?" value={d7Text} onChange={setD7Text} rows={4} />
              <Textarea label="Other Facilities / Platforms at Risk (name, part number, CA owner, due date)" value={d7OtherFacilities} onChange={setD7OtherFacilities} rows={3} />

              {/* Document update table */}
              <div>
                <p className="text-sm font-semibold text-[#1e3a5f] mb-2">Documentation Update Status</p>
                <div className="border border-[#dbeafe] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#eff6ff] text-xs text-[#1e3a5f]">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium w-48">Document</th>
                        <th className="px-4 py-2 text-left font-medium">Owner for Update / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DOC_ROWS.map(row => (
                        <tr key={row.key} className="border-t border-[#dbeafe]">
                          <td className="px-4 py-2 font-medium text-[#1e3a5f] text-xs">{row.label}</td>
                          <td className="px-4 py-2">
                            <input value={d7Docs[row.key] || ''} onChange={e => setD7Docs(p => ({ ...p, [row.key]: e.target.value }))}
                              placeholder="Owner name / Not Applicable / Completed"
                              className="w-full border border-[#dbeafe] rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button onClick={saveD7} disabled={saving} className="bg-blue-900/40 text-[#1d4ed8] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#eff6ff] transition disabled:opacity-60">{saving ? 'Saving...' : 'Save D7 Prevention'}</button>
            </div>
          </div>
        )}

        {/* -- D8 CLOSURE ------------------------------------------------ */}
        {activeTab === 'closure' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-800 text-white px-5 py-3"><h2 className="font-bold text-sm">D8 — Team Recognition &amp; Complaint Closure</h2><p className="text-green-200 text-xs">Celebrate the team and formally close the complaint</p></div>
            <div className="p-5 space-y-4">
              {complaint.d8_congratulations ? (
                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                  <p className="text-xs font-bold text-green-200 mb-2">D8 — Closure Statement (Auto-Generated)</p>
                  <pre className="whitespace-pre-wrap text-xs text-[#15803d] font-sans leading-relaxed">{complaint.d8_congratulations}</pre>
                </div>
              ) : (
                <div className="bg-[#eff6ff] rounded-lg p-4 text-center text-[#1e3a5f] text-sm">Generate the 8D report first to auto-populate the D8 closure statement.</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-[#1e3a5f] mb-1">Customer Approval Status</label>
                  <select className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Pending</option><option>Approved</option><option>Rejected — Revisions Required</option>
                  </select></div>
                <Input label="Customer Approval Date" value="" onChange={() => {}} type="date" />
                <Input label="Actual Closure Date" value="" onChange={() => {}} type="date" />
                <div><label className="block text-xs font-medium text-[#1e3a5f] mb-1">Close Complaint</label>
                  <button onClick={() => updateStatus('Closed')} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition">Mark as CLOSED</button></div>
              </div>
            </div>
          </div>
        )}

        {/* -- 8D REPORT ------------------------------------------------- */}
        {activeTab === '8dreport' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3 flex items-center justify-between">
              <div><h2 className="font-bold text-sm">8D Problem Analysis Report</h2><p className="text-blue-200 text-xs">{complaint.complaint_number} — {complaint.customer_name}</p></div>
              <div className="flex gap-2"><button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded">⬇ PDF</button><button onClick={generate8D} disabled={generating} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded disabled:opacity-60">{generating ? 'Generating...' : '↻ Regenerate'}</button></div>
            </div>
            {!complaint.report_generated ? (
              <div className="p-12 text-center"><div className="text-5xl mb-4">📋</div><p className="text-[#1e3a5f] mb-4">8D report not generated yet.</p><button onClick={generate8D} disabled={generating} className="bg-blue-900/40 text-[#1d4ed8] px-6 py-2 rounded-lg text-sm font-semibold">{generating ? 'Generating...' : 'Auto Generate 8D Now'}</button></div>
            ) : (
              <div className="p-5 space-y-3">
                {[
                  { label: 'D1 — Team Members', content: complaint.d1_team },
                  { label: 'D2 — Problem Description (5W2H)', content: complaint.d2_problem },
                  { label: 'D3 — Interim Containment', content: complaint.d3_containment },
                  { label: 'D4 — Why Made (Root Cause of Occurrence)', content: complaint.d4_why_made || complaint.d4_root_cause, accent: 'bg-orange-900/30' },
                  { label: 'D4 — Why Shipped (Root Cause of Escape)', content: complaint.d4_why_shipped, accent: 'bg-[#eff6ff]' },
                  { label: 'D5 — Corrective Action for Why Made', content: complaint.d5_ca_why_made || complaint.d5_corrective_actions, accent: 'bg-orange-900/30' },
                  { label: 'D5 — Corrective Action for Why Shipped', content: complaint.d5_ca_why_shipped, accent: 'bg-[#eff6ff]' },
                  { label: 'D6 — Verification of Corrective Actions', content: complaint.d6_verification || complaint.d6_implementation },
                  { label: 'D7 — Systemic Prevention', content: complaint.d7_prevention },
                  { label: 'D8 — Closure & Team Recognition', content: complaint.d8_congratulations },
                ].map(s => s.content ? (
                  <div key={s.label} className="border border-[#dbeafe] rounded-lg overflow-hidden">
                    <div className={`${s.accent || 'bg-[#dbeafe]'} text-[#0f172a] px-4 py-2 text-xs font-bold`}>{s.label}</div>
                    <pre className="whitespace-pre-wrap text-xs text-[#1e3a5f] p-4 font-sans leading-relaxed bg-[#eff6ff]">{s.content}</pre>
                  </div>
                ) : null)}
              </div>
            )}
          </div>
        )}

        {/* -- TIMELINE -------------------------------------------------- */}
        {activeTab === 'timeline' && (
          <div className="animate-fadeIn bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900/40 text-[#1d4ed8] px-5 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm">Audit Trail — Full Activity Log</h2>
                <p className="text-blue-200 text-xs">Immutable record of all changes — IATF 16949 §7.5.3 compliant</p>
              </div>
              <span className="text-xs bg-white text-[#1d4ed8] px-2 py-1 rounded-lg font-bold border border-blue-700/50">{timeline.length} events</span>
            </div>
            {timeline.length === 0 ? (
              <div className="p-10 text-center text-[#1e3a5f]">No activity recorded yet. Actions will appear here automatically.</div>
            ) : (
              <div className="p-5">
                <div className="relative border-l-2 border-blue-800/50 space-y-3 pl-6">
                  {timeline.map((e, idx) => {
                    const text = e.event_description || (e as unknown as Record<string,string>).action || '';
                    const dotColor =
                      text.includes('CLOSED') || text.includes('approved') ? 'bg-green-600' :
                      text.includes('REJECTED') ? 'bg-red-500' :
                      text.includes('APPROVED') ? 'bg-green-600' :
                      text.includes('📋') ? 'bg-[#eff6ff]0' :
                      text.includes('🛡️') ? 'bg-orange-400' :
                      text.includes('🔍') ? 'bg-purple-600' :
                      text.includes('🔒') ? 'bg-indigo-600' :
                      text.includes('🔬') ? 'bg-teal-500' :
                      text.includes('📝') ? 'bg-yellow-500' :
                      text.includes('👥') ? 'bg-pink-500' :
                      'bg-gray-400';
                    const bgColor =
                      text.includes('CLOSED') ? 'bg-green-900/30 border-green-800/50' :
                      text.includes('REJECTED') ? 'bg-red-50 border-red-100' :
                      text.includes('APPROVED FOR CLOSURE') ? 'bg-green-900/30 border-green-800/50' :
                      'bg-[#eff6ff] border-[#dbeafe]';
                    const ts = e.performed_at || (e as unknown as Record<string,string>).created_at || '';
                    return (
                      <div key={e.id ?? idx} className="relative">
                        <div className={`absolute -left-[29px] w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-white`} />
                        <div className={`rounded-lg p-3 border ${bgColor}`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className="text-sm text-[#1e3a5f] font-medium flex-1">{text}</p>
                            <span className="text-[10px] text-[#1e3a5f] whitespace-nowrap flex-shrink-0">
                              {ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-[#1e3a5f] mt-1">By: <span className="font-medium text-[#1e3a5f]">{e.performed_by || 'System'}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
