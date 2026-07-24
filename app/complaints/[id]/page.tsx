'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Complaint {
  id: number; complaint_number: string; customer_name: string; customer_contact: string;
  customer_ref: string; complaint_source: string; part_number: string; part_name: string;
  defect_description: string; defect_category: string; quantity_affected: number;
  total_supplied: number; batch_number: string; severity: string; status: string;
  assigned_to: string; created_at: string; target_closure_date: string; remarks: string;
  report_generated: number;
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

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SEV_CLASS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border border-red-200',
  High: 'bg-orange-100 text-orange-800 border border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  Low: 'bg-green-100 text-green-800 border border-green-200',
};
const STATUS_CLASS: Record<string, string> = {
  'Open': 'bg-red-500 text-white',
  'Under Investigation': 'bg-blue-500 text-white',
  'CAPA In Progress': 'bg-orange-500 text-white',
  'Pending Verification': 'bg-purple-500 text-white',
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);
const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[]; }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);
const Textarea = ({ label, value, onChange, rows = 3, highlight = false }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; highlight?: boolean;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-300'}`} />
  </div>
);

// ─── 5-WHY EDITOR ────────────────────────────────────────────────────────────
function WhyEditor({ label, color, whys, onChange }: {
  label: string; color: string; whys: WhyRow[]; onChange: (rows: WhyRow[]) => void;
}) {
  return (
    <div className={`border-2 ${color} rounded-xl overflow-hidden`}>
      <div className={`px-4 py-2.5 ${color === 'border-orange-400' ? 'bg-orange-50' : 'bg-blue-50'}`}>
        <p className="text-sm font-bold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label.includes('Made') ? 'Why did the defect occur? (Occurrence Root Cause)' : 'Why was it not detected? (Escape Root Cause)'}</p>
      </div>
      <div className="p-3 space-y-2">
        {whys.map((w, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className={`flex-shrink-0 w-16 text-center py-1.5 rounded text-xs font-bold ${i === 4 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
              Why {w.why_number}{i === 4 ? ' (RC)' : ''}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input value={w.why_question} onChange={e => { const n = [...whys]; n[i] = { ...n[i], why_question: e.target.value }; onChange(n); }}
                placeholder="Why question..." className="border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <textarea value={w.why_answer} onChange={e => { const n = [...whys]; n[i] = { ...n[i], why_answer: e.target.value }; onChange(n); }}
                rows={2} placeholder={i === 4 ? 'Root cause / Escape point...' : 'Answer...'}
                className={`border rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 ${i === 4 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`} />
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [containment, setContainment] = useState<ContainmentAction[]>([]);
  const [capa, setCapa] = useState<CapaAction[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [occurrenceWhys, setOccurrenceWhys] = useState<WhyRow[]>(DEFAULT_WHYS('occurrence'));
  const [escapeWhys, setEscapeWhys] = useState<WhyRow[]>(DEFAULT_WHYS('escape'));

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const [c, cont, ca, tm, tl, wy] = await Promise.all([
      fetch(`/api/complaints/${id}`).then(r => r.json()),
      fetch(`/api/complaints/${id}/containment`).then(r => r.json()),
      fetch(`/api/complaints/${id}/capa`).then(r => r.json()),
      fetch(`/api/complaints/${id}/team`).then(r => r.json()),
      fetch(`/api/complaints/${id}/timeline`).then(r => r.json()),
      fetch(`/api/complaints/${id}/why`).then(r => r.json()),
    ]);
    if (c.error) { router.push('/'); return; }
    setComplaint(c);
    setContainment(cont);
    setCapa(ca);
    setTeam(tm);
    setTimeline(tl);

    const occ = wy.filter((r: WhyRow) => r.why_type === 'occurrence' || r.why_type == null);
    const esc = wy.filter((r: WhyRow) => r.why_type === 'escape');
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

  const patchComplaint = async (data: Record<string, string | number>) => {
    await fetch(`/api/complaints/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  };

  const updateStatus = async (status: string) => { await patchComplaint({ status }); fetchAll(); };

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
    setSaving(false);
    fetchAll();
  };

  const saveD5 = async () => {
    setSaving(true);
    await patchComplaint({ d5_ca_why_made: d5WhyMade, d5_ca_why_shipped: d5WhyShipped });
    setSaving(false);
    fetchAll();
  };

  const saveD6 = async () => {
    setSaving(true);
    await patchComplaint({ d6_verification: d6.verification, d6_ca_owner: d6.ca_owner, d6_ca_owner_phone: d6.ca_owner_phone, d6_ca_owner_email: d6.ca_owner_email, d6_target_date: d6.target_date, d6_certified_build_date: d6.certified_build_date, d6_certified_part_id: d6.certified_part_id });
    setSaving(false);
    fetchAll();
  };

  const saveD7 = async () => {
    setSaving(true);
    await patchComplaint({ d7_prevention: d7Text, d7_other_facilities: d7OtherFacilities, ...d7Docs });
    setSaving(false);
    fetchAll();
  };

  const addContainment = async () => {
    if (!newContainment.action_description) return;
    await fetch(`/api/complaints/${id}/containment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newContainment) });
    setNewContainment({ action_description: '', location: 'At Plant', responsible_person: '', target_date: '', qty_sorted: '0', qty_rejected: '0', qty_ok: '0', evidence: '', other_platform_risk: 'No', certified_material_id: '' });
    setShowContainmentForm(false); fetchAll();
  };
  const updateContainmentStatus = async (actionId: number, status: string) => {
    const completion_date = status === 'Completed' ? new Date().toISOString().slice(0, 10) : '';
    await fetch(`/api/complaints/${id}/containment/${actionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, completion_date }) });
    fetchAll();
  };
  const deleteContainment = async (actionId: number) => {
    if (!confirm('Delete this containment action?')) return;
    await fetch(`/api/complaints/${id}/containment/${actionId}`, { method: 'DELETE' }); fetchAll();
  };

  const addCapa = async () => {
    if (!newCapa.action_description) return;
    await fetch(`/api/complaints/${id}/capa`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCapa) });
    setNewCapa({ action_type: 'Corrective', action_description: '', document_to_update: 'PFMEA', responsible_person: '', target_date: '', verification_method: '', capa_section: 'Why Made' });
    setShowCapaForm(false); fetchAll();
  };
  const updateCapaStatus = async (capaId: number, status: string) => {
    const completion_date = status === 'Completed' ? new Date().toISOString().slice(0, 10) : '';
    await fetch(`/api/complaints/${id}/capa/${capaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, completion_date }) });
    fetchAll();
  };

  const addTeamMember = async () => {
    if (!newMember.member_name) return;
    await fetch(`/api/complaints/${id}/team`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMember) });
    setNewMember({ member_name: '', designation: '', department: '', role_in_team: 'Member', contact_number: '', email: '' });
    setShowTeamForm(false); fetchAll();
  };
  const removeTeamMember = async (memberId: number) => {
    await fetch(`/api/complaints/${id}/team/${memberId}`, { method: 'DELETE' }); fetchAll();
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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-lg animate-pulse">Loading complaint...</p></div>;
  if (!complaint) return null;

  const daysOpen = Math.floor((Date.now() - new Date(complaint.created_at).getTime()) / 86400000);
  const completedCapa = capa.filter(a => a.status === 'Completed' || a.status === 'Verified').length;
  const completedContainment = containment.filter(a => a.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-blue-900 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/" className="text-blue-300 hover:text-white text-xs">← Dashboard</Link>
              <span className="text-blue-400 text-xs">/</span>
              <span className="text-white font-mono text-sm font-bold">{complaint.complaint_number || `CC-${complaint.id}`}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_CLASS[complaint.severity] || ''}`}>{complaint.severity}</span>
              <select value={complaint.status} onChange={e => updateStatus(e.target.value)}
                className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer border-0 ${STATUS_CLASS[complaint.status] || ''}`}>
                {['Open','Under Investigation','CAPA In Progress','Pending Verification','Pending Closure','Closed','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <h1 className="text-base font-bold mt-1 truncate">{complaint.customer_name} — {complaint.defect_description?.slice(0, 65)}{(complaint.defect_description?.length || 0) > 65 ? '...' : ''}</h1>
            <div className="flex gap-4 text-blue-200 text-xs mt-0.5 flex-wrap">
              <span>Part: {complaint.part_number || '—'} {complaint.part_name}</span>
              <span>Qty: {complaint.quantity_affected} pcs</span>
              <span>Category: {complaint.defect_category}</span>
              <span className={daysOpen > 14 ? 'text-red-300 font-bold' : ''}>Days Open: {daysOpen}</span>
              {complaint.customer_ref && <span>Customer Ref: {complaint.customer_ref}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-medium transition">⬇ PDF</button>
            <button onClick={generate8D} disabled={generating}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium transition disabled:opacity-60">
              {generating ? 'Generating...' : complaint.report_generated ? '↻ Regenerate 8D' : '✨ Auto Generate 8D'}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-7xl mx-auto mt-3">
          <div className="flex gap-1">
            {[
              { label: 'D1 Team', done: team.length > 0 },
              { label: 'D3 Contain', done: completedContainment > 0 },
              { label: 'D4 Why Made', done: occurrenceWhys.some(w => w.why_answer) },
              { label: 'D4 Why Shipped', done: escapeWhys.some(w => w.why_answer) },
              { label: 'D5 CAPA', done: capa.length > 0 },
              { label: 'D6 Verify', done: !!complaint.d6_verification },
              { label: 'D7 Prevent', done: !!complaint.d7_prevention },
              { label: 'D8 Close', done: complaint.status === 'Closed' },
            ].map(step => (
              <div key={step.label} className="flex-1 text-center">
                <div className={`h-1.5 rounded-full mb-1 ${step.done ? 'bg-green-400' : 'bg-blue-800'}`}></div>
                <span className={`text-xs ${step.done ? 'text-green-300' : 'text-blue-400'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* TAB NAV */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-3 text-xs font-medium transition border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-900 text-blue-900 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600">
              <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">Customer &amp; Complaint Info</h3>
              <div className="space-y-2">
                {[['Complaint No.', complaint.complaint_number],['Customer', complaint.customer_name],['Customer Contact', complaint.customer_contact || '—'],['Customer Ref No.', complaint.customer_ref || '—'],['Source', complaint.complaint_source],['Date Logged', complaint.created_at?.slice(0, 10)],['Assigned To', complaint.assigned_to || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500 text-xs">{k}</span><span className="font-medium text-gray-800 text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
              <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">Part &amp; Defect Info</h3>
              <div className="space-y-2">
                {[['Part Number', complaint.part_number || '—'],['Part Name', complaint.part_name || '—'],['Defect Category', complaint.defect_category],['Rejection Qty', `${complaint.quantity_affected} pcs`],['Total Supplied', `${complaint.total_supplied || '—'} pcs`],['PPM', complaint.total_supplied > 0 ? `${Math.round((complaint.quantity_affected / complaint.total_supplied) * 1000000)} PPM` : '—'],['Batch No.', complaint.batch_number || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500 text-xs">{k}</span><span className="font-medium text-gray-800 text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 col-span-full">
              <h3 className="font-semibold text-gray-700 text-sm mb-2">Defect Description</h3>
              <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">{complaint.defect_description}</p>
              {complaint.remarks && <><h3 className="font-semibold text-gray-700 text-sm mb-2 mt-3">Remarks / Notes</h3><p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">{complaint.remarks}</p></>}
            </div>
          </div>
        )}

        {/* ── D1 TEAM ─────────────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between">
              <div><h2 className="font-bold text-sm">D1 — Team Members</h2><p className="text-blue-200 text-xs">Champion + all team members responsible for this 8D</p></div>
              <button onClick={() => setShowTeamForm(!showTeamForm)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium">+ Add Member</button>
            </div>
            {showTeamForm && (
              <div className="border-b border-gray-100 p-4 bg-blue-50">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <Input label="Full Name *" value={newMember.member_name} onChange={v => setNewMember(p => ({ ...p, member_name: v }))} required placeholder="e.g. Jatadhari Behera" />
                  <Select label="Role in Team" value={newMember.role_in_team} onChange={v => setNewMember(p => ({ ...p, role_in_team: v }))} options={['Champion','Team Leader','Member','Production Supervisor','Process Engineer','Quality Inspector','Customer Representative','Supplier Representative']} />
                  <Input label="Designation" value={newMember.designation} onChange={v => setNewMember(p => ({ ...p, designation: v }))} placeholder="e.g. Quality Manager" />
                  <Input label="Department" value={newMember.department} onChange={v => setNewMember(p => ({ ...p, department: v }))} placeholder="e.g. Quality" />
                  <Input label="Phone Number" value={newMember.contact_number} onChange={v => setNewMember(p => ({ ...p, contact_number: v }))} placeholder="9876543210" />
                  <Input label="Email Address" value={newMember.email} onChange={v => setNewMember(p => ({ ...p, email: v }))} placeholder="name@company.com" />
                </div>
                <div className="flex gap-2"><button onClick={addTeamMember} className="bg-blue-900 text-white text-xs px-4 py-1.5 rounded font-medium">Add Member</button><button onClick={() => setShowTeamForm(false)} className="text-gray-500 text-xs px-4 py-1.5 border rounded">Cancel</button></div>
              </div>
            )}
            {team.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No team members added yet. Add Champion first, then all team members.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>{['Role','Name','Designation','Department','Phone','Email',''].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {team.map(m => (
                    <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${m.role_in_team === 'Champion' ? 'bg-blue-900 text-white' : m.role_in_team === 'Team Leader' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{m.role_in_team}</span></td>
                      <td className="px-4 py-2 font-semibold text-gray-800">{m.member_name}</td>
                      <td className="px-4 py-2 text-gray-600">{m.designation}</td>
                      <td className="px-4 py-2 text-gray-600">{m.department}</td>
                      <td className="px-4 py-2 text-gray-600">{m.contact_number}</td>
                      <td className="px-4 py-2 text-gray-600">{m.email}</td>
                      <td className="px-4 py-2"><button onClick={() => removeTeamMember(m.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── D2 PROBLEM ──────────────────────────────────────────────── */}
        {activeTab === 'problem' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3"><h2 className="font-bold text-sm">D2 — Problem Description (5W2H)</h2><p className="text-blue-200 text-xs">Impact on customer + Facilities involved</p></div>
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
                  <div key={item.q} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-bold text-blue-900 mb-1">{item.q}</p>
                    <p className="text-sm text-gray-700">{item.a}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-900 mb-1">Impact on Customer</p>
                  <p className="text-sm text-gray-700">Customer dissatisfaction — potential for production line disruption / field failure (Severity: {complaint.severity})</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-bold text-blue-900 mb-1">Facilities Involved</p>
                  <p className="text-sm text-gray-700">Customer: {complaint.customer_name} | Supplier: Our Plant | Transit: Under review</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── D3 CONTAINMENT ──────────────────────────────────────────── */}
        {activeTab === 'containment' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between">
              <div><h2 className="font-bold text-sm">D3 — Interim Containment Actions</h2><p className="text-blue-200 text-xs">Immediate actions to protect the customer + sorting results</p></div>
              <div className="flex gap-2 items-center">
                <span className="text-blue-200 text-xs">{completedContainment}/{containment.length} done</span>
                <button onClick={() => setShowContainmentForm(!showContainmentForm)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium">+ Add Action</button>
              </div>
            </div>
            {showContainmentForm && (
              <div className="border-b border-gray-100 p-4 bg-orange-50">
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
                <div className="flex gap-2"><button onClick={addContainment} className="bg-blue-900 text-white text-xs px-4 py-1.5 rounded font-medium">Save Action</button><button onClick={() => setShowContainmentForm(false)} className="text-gray-500 text-xs px-4 py-1.5 border rounded">Cancel</button></div>
              </div>
            )}
            {containment.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No containment actions yet. Add D3 actions — this moves complaint to &quot;Under Investigation&quot; status.</div>
            ) : (
              <div className="p-4 space-y-3">
                {containment.map(a => (
                  <div key={a.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="bg-blue-900 text-white text-xs px-2 py-0.5 rounded font-bold">#{a.action_number}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{a.location}</span>
                          <select value={a.status} onChange={e => updateContainmentStatus(a.id, e.target.value)}
                            className={`text-xs px-2 py-0.5 rounded font-semibold cursor-pointer border-0 ${a.status === 'Completed' ? 'bg-green-100 text-green-800' : a.status === 'Planned' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'}`}>
                            {['Planned','In Progress','Completed','Overdue'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">{a.action_description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                          <span>Owner: {a.responsible_person || '—'}</span>
                          <span>Target: {a.target_date || '—'}</span>
                          {a.completion_date && <span className="text-green-600">Done: {a.completion_date}</span>}
                        </div>
                        {(a.qty_sorted > 0) && (
                          <div className="flex gap-3 mt-2 text-xs bg-gray-50 rounded p-2">
                            <span className="text-gray-600">Sorted: <b>{a.qty_sorted}</b></span>
                            <span className="text-red-600">Defects: <b>{a.qty_rejected}</b></span>
                            <span className="text-green-600">OK: <b>{a.qty_ok}</b></span>
                          </div>
                        )}
                        <div className="flex gap-3 mt-1 text-xs flex-wrap">
                          {a.other_platform_risk && <span className="text-orange-600">Platform risk: {a.other_platform_risk}</span>}
                          {a.certified_material_id && <span className="text-blue-600">Certified ID: {a.certified_material_id}</span>}
                          {a.evidence && <span className="text-gray-500">Evidence: {a.evidence}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteContainment(a.id)} className="text-red-300 hover:text-red-600 text-xs flex-shrink-0">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── D4 ROOT CAUSE ───────────────────────────────────────────── */}
        {activeTab === 'rootcause' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div><h2 className="font-bold text-gray-800 text-sm">D4 — Root Cause Analysis</h2><p className="text-xs text-gray-500">Two separate 5-Why analyses: (1) Why Made — why the defect occurred, (2) Why Shipped — why it was not detected</p></div>
                <button onClick={saveWhys} disabled={saving} className="bg-blue-900 text-white text-xs px-4 py-1.5 rounded font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save Both Analyses'}</button>
              </div>
              <div className="space-y-5">
                <WhyEditor label="Why Made — Root Cause of Occurrence" color="border-orange-400" whys={occurrenceWhys} onChange={setOccurrenceWhys} />
                <WhyEditor label="Why Shipped — Root Cause of Escape" color="border-blue-400" whys={escapeWhys} onChange={setEscapeWhys} />
              </div>
            </div>
          </div>
        )}

        {/* ── D5 CAPA ─────────────────────────────────────────────────── */}
        {activeTab === 'capa' && (
          <div className="space-y-4">
            {/* Manual CA text for Why Made and Why Shipped */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-800 text-sm mb-1">D5 — Permanent Corrective Actions</h2>
              <p className="text-xs text-gray-500 mb-4">Separate actions for Why Made (Occurrence) and Why Shipped (Escape)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border-2 border-orange-200 rounded-xl overflow-hidden">
                  <div className="bg-orange-50 px-4 py-2 text-xs font-bold text-orange-900">Corrective Action — For Why Made (Occurrence)</div>
                  <div className="p-3"><Textarea label="" value={d5WhyMade} onChange={setD5WhyMade} rows={8} /></div>
                </div>
                <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900">Corrective Action — For Why Shipped (Escape)</div>
                  <div className="p-3"><Textarea label="" value={d5WhyShipped} onChange={setD5WhyShipped} rows={8} /></div>
                </div>
              </div>
              <button onClick={saveD5} disabled={saving} className="bg-blue-900 text-white text-xs px-5 py-1.5 rounded font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save D5 Actions'}</button>
            </div>

            {/* CAPA action table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between">
                <div><h3 className="font-bold text-sm">CAPA Action Register</h3><p className="text-blue-200 text-xs">Track individual corrective / preventive actions with owners and dates</p></div>
                <div className="flex gap-2 items-center">
                  <span className="text-blue-200 text-xs">{completedCapa}/{capa.length} completed</span>
                  <button onClick={() => setShowCapaForm(!showCapaForm)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium">+ Add Action</button>
                </div>
              </div>
              {showCapaForm && (
                <div className="border-b border-gray-100 p-4 bg-green-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <Select label="CAPA Section" value={newCapa.capa_section} onChange={v => setNewCapa(p => ({ ...p, capa_section: v }))} options={['Why Made','Why Shipped','Both','Horizontal Deployment']} />
                    <Select label="Action Type" value={newCapa.action_type} onChange={v => setNewCapa(p => ({ ...p, action_type: v }))} options={['Corrective','Preventive','Process Change','Horizontal Deployment','Document Update']} />
                    <Select label="Document to Update" value={newCapa.document_to_update} onChange={v => setNewCapa(p => ({ ...p, document_to_update: v }))} options={['PFMEA','Control Plan','Work Instruction / ODS','SOP','Training Record','DFMEA','Process Flow','Multiple','None']} />
                    <div className="col-span-2 md:col-span-3"><Textarea label="Action Description *" value={newCapa.action_description} onChange={v => setNewCapa(p => ({ ...p, action_description: v }))} rows={2} /></div>
                    <Input label="Responsible Person" value={newCapa.responsible_person} onChange={v => setNewCapa(p => ({ ...p, responsible_person: v }))} placeholder="Name" />
                    <Input label="Target Date" value={newCapa.target_date} onChange={v => setNewCapa(p => ({ ...p, target_date: v }))} type="date" />
                    <Input label="Verification Method" value={newCapa.verification_method} onChange={v => setNewCapa(p => ({ ...p, verification_method: v }))} placeholder="How effectiveness will be verified" />
                  </div>
                  <div className="flex gap-2"><button onClick={addCapa} className="bg-blue-900 text-white text-xs px-4 py-1.5 rounded font-medium">Save</button><button onClick={() => setShowCapaForm(false)} className="text-gray-500 text-xs px-4 py-1.5 border rounded">Cancel</button></div>
                </div>
              )}
              {capa.length === 0 ? (
                <div className="p-10 text-center text-gray-400">No actions added yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>{['#','Section','Type','Action Description','Doc','Owner','Target','Status',''].map(h => <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {capa.map(a => (
                        <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-bold text-blue-900">#{a.action_number}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{(a as unknown as Record<string, string>).capa_section || '—'}</td>
                          <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${a.action_type === 'Corrective' ? 'bg-red-100 text-red-700' : a.action_type === 'Preventive' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{a.action_type}</span></td>
                          <td className="px-3 py-2 text-gray-800 max-w-xs">{a.action_description}</td>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{a.document_to_update || '—'}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{a.responsible_person || '—'}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{a.target_date || '—'}</td>
                          <td className="px-3 py-2">
                            <select value={a.status} onChange={e => updateCapaStatus(a.id, e.target.value)}
                              className={`text-xs px-2 py-0.5 rounded font-semibold cursor-pointer border-0 ${a.status === 'Completed' || a.status === 'Verified' ? 'bg-green-100 text-green-800' : a.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : a.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                              {['Planned','In Progress','Completed','Overdue','Verified'].map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2"><button onClick={async () => { await fetch(`/api/complaints/${id}/capa/${a.id}`, { method: 'DELETE' }); fetchAll(); }} className="text-red-300 hover:text-red-600">✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── D6 VERIFICATION ─────────────────────────────────────────── */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3"><h2 className="font-bold text-sm">D6 — Verification of Corrective Actions</h2><p className="text-blue-200 text-xs">Verify that corrective actions eliminate root cause — turn on / turn off test + statistical evidence</p></div>
            <div className="p-5 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs font-bold text-yellow-900 mb-1">Key Verification Question</p>
                <p className="text-xs text-yellow-800">Has the issue been turned ON and OFF? This means: (1) Can you reproduce the defect by removing the corrective action? (2) Does the defect disappear when the corrective action is in place?</p>
              </div>
              <Textarea label="Verification Details — How the issue was verified (turned on / turned off + statistical evidence)" value={d6.verification} onChange={v => setD6(p => ({ ...p, verification: v }))} rows={6} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-900 mb-3">Corrective Action Owner</p>
                  <div className="space-y-3">
                    <Input label="C.A. Owner Name" value={d6.ca_owner} onChange={v => setD6(p => ({ ...p, ca_owner: v }))} placeholder="Quality Manager name" />
                    <Input label="C.A. Owner Phone" value={d6.ca_owner_phone} onChange={v => setD6(p => ({ ...p, ca_owner_phone: v }))} placeholder="Phone number" />
                    <Input label="C.A. Owner Email" value={d6.ca_owner_email} onChange={v => setD6(p => ({ ...p, ca_owner_email: v }))} placeholder="Email address" />
                    <Input label="Target Completion Date" value={d6.target_date} onChange={v => setD6(p => ({ ...p, target_date: v }))} type="date" />
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-900 mb-3">Certified Material</p>
                  <div className="space-y-3">
                    <Input label="Build Date for Certified Material" value={d6.certified_build_date} onChange={v => setD6(p => ({ ...p, certified_build_date: v }))} type="date" />
                    <Textarea label="How Will New / Certified Parts Be Identified?" value={d6.certified_part_id} onChange={v => setD6(p => ({ ...p, certified_part_id: v }))} rows={4} />
                  </div>
                </div>
              </div>
              <button onClick={saveD6} disabled={saving} className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-60">{saving ? 'Saving...' : 'Save D6 Verification'}</button>
            </div>
          </div>
        )}

        {/* ── D7 PREVENTION ───────────────────────────────────────────── */}
        {activeTab === 'prevention' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3"><h2 className="font-bold text-sm">D7 — Systemic Prevention</h2><p className="text-blue-200 text-xs">Prevent recurrence in all similar products, platforms, processes + update all documents</p></div>
            <div className="p-5 space-y-5">
              <Textarea label="How will this issue be avoided in the future?" value={d7Text} onChange={setD7Text} rows={4} />
              <Textarea label="Other Facilities / Platforms at Risk (name, part number, CA owner, due date)" value={d7OtherFacilities} onChange={setD7OtherFacilities} rows={3} />

              {/* Document update table */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Documentation Update Status</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium w-48">Document</th>
                        <th className="px-4 py-2 text-left font-medium">Owner for Update / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DOC_ROWS.map(row => (
                        <tr key={row.key} className="border-t border-gray-100">
                          <td className="px-4 py-2 font-medium text-gray-700 text-xs">{row.label}</td>
                          <td className="px-4 py-2">
                            <input value={d7Docs[row.key] || ''} onChange={e => setD7Docs(p => ({ ...p, [row.key]: e.target.value }))}
                              placeholder="Owner name / Not Applicable / Completed"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button onClick={saveD7} disabled={saving} className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-60">{saving ? 'Saving...' : 'Save D7 Prevention'}</button>
            </div>
          </div>
        )}

        {/* ── D8 CLOSURE ──────────────────────────────────────────────── */}
        {activeTab === 'closure' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-800 text-white px-5 py-3"><h2 className="font-bold text-sm">D8 — Team Recognition &amp; Complaint Closure</h2><p className="text-green-200 text-xs">Celebrate the team and formally close the complaint</p></div>
            <div className="p-5 space-y-4">
              {complaint.d8_congratulations ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-green-900 mb-2">D8 — Closure Statement (Auto-Generated)</p>
                  <pre className="whitespace-pre-wrap text-xs text-green-800 font-sans leading-relaxed">{complaint.d8_congratulations}</pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 text-sm">Generate the 8D report first to auto-populate the D8 closure statement.</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Customer Approval Status</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Pending</option><option>Approved</option><option>Rejected — Revisions Required</option>
                  </select></div>
                <Input label="Customer Approval Date" value="" onChange={() => {}} type="date" />
                <Input label="Actual Closure Date" value="" onChange={() => {}} type="date" />
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Close Complaint</label>
                  <button onClick={() => updateStatus('Closed')} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition">Mark as CLOSED</button></div>
              </div>
            </div>
          </div>
        )}

        {/* ── 8D REPORT ───────────────────────────────────────────────── */}
        {activeTab === '8dreport' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between">
              <div><h2 className="font-bold text-sm">8D Problem Analysis Report</h2><p className="text-blue-200 text-xs">{complaint.complaint_number} — {complaint.customer_name}</p></div>
              <div className="flex gap-2"><button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded">⬇ PDF</button><button onClick={generate8D} disabled={generating} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded disabled:opacity-60">{generating ? 'Generating...' : '↻ Regenerate'}</button></div>
            </div>
            {!complaint.report_generated ? (
              <div className="p-12 text-center"><div className="text-5xl mb-4">📋</div><p className="text-gray-400 mb-4">8D report not generated yet.</p><button onClick={generate8D} disabled={generating} className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-semibold">{generating ? 'Generating...' : 'Auto Generate 8D Now'}</button></div>
            ) : (
              <div className="p-5 space-y-3">
                {[
                  { label: 'D1 — Team Members', content: complaint.d1_team },
                  { label: 'D2 — Problem Description (5W2H)', content: complaint.d2_problem },
                  { label: 'D3 — Interim Containment', content: complaint.d3_containment },
                  { label: 'D4 — Why Made (Root Cause of Occurrence)', content: complaint.d4_why_made || complaint.d4_root_cause, accent: 'bg-orange-900' },
                  { label: 'D4 — Why Shipped (Root Cause of Escape)', content: complaint.d4_why_shipped, accent: 'bg-blue-800' },
                  { label: 'D5 — Corrective Action for Why Made', content: complaint.d5_ca_why_made || complaint.d5_corrective_actions, accent: 'bg-orange-900' },
                  { label: 'D5 — Corrective Action for Why Shipped', content: complaint.d5_ca_why_shipped, accent: 'bg-blue-800' },
                  { label: 'D6 — Verification of Corrective Actions', content: complaint.d6_verification || complaint.d6_implementation },
                  { label: 'D7 — Systemic Prevention', content: complaint.d7_prevention },
                  { label: 'D8 — Closure & Team Recognition', content: complaint.d8_congratulations },
                ].map(s => s.content ? (
                  <div key={s.label} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className={`${s.accent || 'bg-blue-900'} text-white px-4 py-2 text-xs font-bold`}>{s.label}</div>
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 p-4 font-sans leading-relaxed bg-gray-50">{s.content}</pre>
                  </div>
                ) : null)}
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE ────────────────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3"><h2 className="font-bold text-sm">Activity Timeline</h2><p className="text-blue-200 text-xs">Immutable audit log of all activities</p></div>
            {timeline.length === 0 ? <div className="p-10 text-center text-gray-400">No activity recorded yet.</div> : (
              <div className="p-5">
                <div className="relative border-l-2 border-blue-100 space-y-4 pl-6">
                  {timeline.map(e => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-8 w-4 h-4 rounded-full bg-blue-900 border-2 border-white"></div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-blue-900">{e.event_type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-gray-400">{e.performed_at?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p className="text-sm text-gray-700">{e.event_description}</p>
                        {e.performed_by && <p className="text-xs text-gray-400 mt-1">By: {e.performed_by}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
