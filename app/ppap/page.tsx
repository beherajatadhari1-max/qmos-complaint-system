'use client';
import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type ElemStatus = 'not-required' | 'pending' | 'in-progress' | 'submitted' | 'approved' | 'rejected';
type PSWStatus  = 'not-submitted' | 'interim' | 'approved' | 'rejected';

interface PPAPElement {
  id: number;
  name: string;
  shortName: string;
  status: ElemStatus;
  notes: string;
  // which levels require this element: 1=Level1, 2=Level2 etc. (R=required, S=submit, A=at facility)
  levels: Record<number, 'R' | 'S' | 'A' | '-'>;
}

interface PPAPSubmission {
  partNumber: string;
  partName: string;
  customer: string;
  supplierCode: string;
  submissionLevel: 1 | 2 | 3 | 4 | 5;
  reason: string;
  pswStatus: PSWStatus;
  submittedDate: string;
  approvedDate: string;
  expiryDate: string;
  weightedMaterial: string;
  safetyRegulated: string;
  notes: string;
}

// ── AIAG PPAP 4th Edition — 18 Elements ──────────────────────────────────────
function mkEl(
  id: number, name: string, shortName: string,
  levels: Record<number, 'R' | 'S' | 'A' | '-'>
): PPAPElement {
  return { id, name, shortName, status: 'pending', notes: '', levels };
}

const INITIAL_ELEMENTS: PPAPElement[] = [
  mkEl(1,  'Design Records',                               'Design Records',     { 1:'R', 2:'S', 3:'S', 4:'R', 5:'A' }),
  mkEl(2,  'Engineering Change Documents (if applicable)', 'Eng Change Docs',    { 1:'R', 2:'S', 3:'S', 4:'R', 5:'A' }),
  mkEl(3,  'Customer Engineering Approval (if required)',  'Cust Eng Approval',  { 1:'R', 2:'R', 3:'R', 4:'R', 5:'R' }),
  mkEl(4,  'Design FMEA (if supplier responsible)',        'DFMEA',              { 1:'-', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(5,  'Process Flow Diagrams',                        'PFD',                { 1:'-', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(6,  'Process Failure Mode & Effects Analysis',      'PFMEA',              { 1:'-', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(7,  'Control Plan',                                 'Control Plan',       { 1:'-', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(8,  'Measurement System Analysis (MSA) Studies',    'MSA / GRR',          { 1:'-', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(9,  'Dimensional Results',                          'Dimensional',        { 1:'-', 2:'S', 3:'S', 4:'R', 5:'A' }),
  mkEl(10, 'Records of Material / Performance Test Results','Mat. / Perf. Tests',{ 1:'-', 2:'S', 3:'S', 4:'R', 5:'A' }),
  mkEl(11, 'Initial Process Study (SPC / Capability)',     'SPC / Capability',   { 1:'-', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(12, 'Qualified Laboratory Documentation',           'Lab Docs',           { 1:'-', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(13, 'Appearance Approval Report (AAR — if req\'d)', 'AAR',                { 1:'R', 2:'R', 3:'S', 4:'R', 5:'A' }),
  mkEl(14, 'Sample Production Parts',                      'Sample Parts',       { 1:'-', 2:'S', 3:'S', 4:'R', 5:'A' }),
  mkEl(15, 'Master Sample',                                'Master Sample',      { 1:'-', 2:'-', 3:'R', 4:'R', 5:'A' }),
  mkEl(16, 'Checking Aids (fixtures, gauges, jigs)',       'Checking Aids',      { 1:'-', 2:'-', 3:'R', 4:'R', 5:'A' }),
  mkEl(17, 'Customer-Specific Requirements (CSR)',         'CSR',                { 1:'R', 2:'R', 3:'R', 4:'R', 5:'R' }),
  mkEl(18, 'Part Submission Warrant (PSW)',                 'PSW',                { 1:'R', 2:'R', 3:'R', 4:'R', 5:'R' }),
];

const REASONS = [
  'New Part / New Program',
  'Engineering Change to Part Design',
  'Engineering Change to Process',
  'Change of Sub-Supplier or Material',
  'Change to Process Sequence or Method',
  'New or Modified Tooling (Relocation / Replacement)',
  'Tooling Transferred to Different Plant / Facility',
  'Production after Tooling Inactive > 12 months',
  'Correction of Discrepancy from Previous Submission',
  'Change in Production Method',
  'Re-PPAP — Annual Layout Requirement',
  'Bulk Material Re-Qualification',
];

const STATUS_COLORS: Record<ElemStatus, string> = {
  'not-required': 'bg-gray-700/50 text-gray-500',
  'pending':      'bg-gray-700 text-gray-300',
  'in-progress':  'bg-blue-800 text-blue-200',
  'submitted':    'bg-amber-800 text-amber-200',
  'approved':     'bg-green-800 text-green-200',
  'rejected':     'bg-red-800 text-red-200',
};
const STATUS_LABELS: Record<ElemStatus, string> = {
  'not-required': '— N/R',
  'pending':      '⏳ Pending',
  'in-progress':  '🔄 In Progress',
  'submitted':    '📤 Submitted',
  'approved':     '✅ Approved',
  'rejected':     '❌ Rejected',
};
const PSW_COLORS: Record<PSWStatus, string> = {
  'not-submitted': 'bg-gray-700 text-gray-300',
  'interim':       'bg-amber-800 text-amber-200',
  'approved':      'bg-green-800 text-green-200',
  'rejected':      'bg-red-800 text-red-200',
};
const PSW_LABELS: Record<PSWStatus, string> = {
  'not-submitted': 'Not Submitted',
  'interim':       '⏳ Interim Approval',
  'approved':      '✅ Fully Approved',
  'rejected':      '❌ Rejected',
};

const inp  = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500';
const lbl  = 'text-xs text-gray-400 block mb-1';

function levelBadge(v: 'R' | 'S' | 'A' | '-') {
  if (v === 'R') return <span className="text-xs bg-red-800/60 text-red-300 px-1.5 py-0.5 rounded font-bold">R</span>;
  if (v === 'S') return <span className="text-xs bg-blue-800/60 text-blue-300 px-1.5 py-0.5 rounded font-bold">S</span>;
  if (v === 'A') return <span className="text-xs bg-purple-800/60 text-purple-300 px-1.5 py-0.5 rounded font-bold">A</span>;
  return <span className="text-xs text-gray-600">—</span>;
}

export default function PPAPPage() {
  const [mainTab, setMainTab] = useState<'tracker' | 'knowledge' | 'guide'>('tracker');
  const [elements, setElements] = useState<PPAPElement[]>(INITIAL_ELEMENTS);
  const [sub, setSub] = useState<PPAPSubmission>({
    partNumber: '', partName: '', customer: '', supplierCode: '',
    submissionLevel: 3, reason: REASONS[0],
    pswStatus: 'not-submitted', submittedDate: '', approvedDate: '', expiryDate: '',
    weightedMaterial: 'No', safetyRegulated: 'No', notes: '',
  });

  const setS = (k: keyof PPAPSubmission, v: string | number) =>
    setSub(prev => ({ ...prev, [k]: v }));

  const setElemStatus = (id: number, status: ElemStatus) =>
    setElements(prev => prev.map(e => e.id === id ? { ...e, status } : e));

  const setElemNotes = (id: number, notes: string) =>
    setElements(prev => prev.map(e => e.id === id ? { ...e, notes } : e));

  const loadSample = () => {
    setSub({
      partNumber: 'BKT-A001 Rev B', partName: 'Mounting Bracket Assembly',
      customer: 'Tata Motors Ltd.', supplierCode: 'TML-SUP-0042',
      submissionLevel: 3, reason: 'New Part / New Program',
      pswStatus: 'approved', submittedDate: '2025-02-10', approvedDate: '2025-02-18',
      expiryDate: '2027-02-18', weightedMaterial: 'No', safetyRegulated: 'No',
      notes: 'Full PPAP Level 3 — initial submission for Tata Nexon platform.',
    });
    setElements(prev => prev.map((e, i) => ({
      ...e,
      status: ([
        'approved','not-required','not-required','not-required',
        'approved','approved','approved','approved',
        'approved','approved','approved','approved',
        'not-required','approved','approved','not-required',
        'approved','approved',
      ] as ElemStatus[])[i] ?? 'pending',
    })));
  };

  const approvedCount   = elements.filter(e => e.status === 'approved').length;
  const pendingCount    = elements.filter(e => e.status === 'pending' || e.status === 'in-progress').length;
  const rejectedCount   = elements.filter(e => e.status === 'rejected').length;
  const submittedCount  = elements.filter(e => e.status === 'submitted').length;
  const nrCount         = elements.filter(e => e.status === 'not-required').length;
  const requiredCount   = 18 - nrCount;
  const pct = requiredCount > 0 ? Math.round(approvedCount / requiredCount * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-cyan-950 via-teal-950 to-slate-900 border-b border-cyan-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📦</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">PPAP Tracker</h1>
                <p className="text-cyan-300 text-xs mt-0.5">AIAG PPAP 4th Edition · 18 Elements · Levels 1–5 · PSW Status · IATF 16949 Cl. 8.3.4</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className={`border rounded-xl px-3 py-2 text-center ${sub.pswStatus === 'approved' ? 'bg-green-900/60 border-green-700/50' : sub.pswStatus === 'rejected' ? 'bg-red-900/60 border-red-700/50' : 'bg-amber-900/60 border-amber-700/50'}`}>
                <div className={`text-xs font-bold ${sub.pswStatus === 'approved' ? 'text-green-300' : sub.pswStatus === 'rejected' ? 'text-red-300' : 'text-amber-300'}`}>{PSW_LABELS[sub.pswStatus]}</div>
                <div className="text-xs text-gray-500">PSW</div>
              </div>
              <div className="bg-cyan-900/60 border border-cyan-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-cyan-300">{pct}%</div>
                <div className="text-xs text-cyan-400">Elements Done</div>
              </div>
              <div className="bg-green-900/60 border border-green-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-green-300">{approvedCount}</div>
                <div className="text-xs text-green-400">Approved</div>
              </div>
              {rejectedCount > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-300">{rejectedCount}</div>
                  <div className="text-xs text-red-400">Rejected</div>
                </div>
              )}
              <button onClick={loadSample} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                🧪 Load Sample
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-cyan-800/40">
            {([
              { id: 'tracker',   label: '📦 PPAP Tracker' },
              { id: 'knowledge', label: '📚 Knowledge Hub' },
              { id: 'guide',     label: '📋 Step-by-Step Guide' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                  mainTab === t.id
                    ? 'bg-white/10 text-white border-b-2 border-cyan-400'
                    : 'text-cyan-300 hover:text-white hover:bg-white/5'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRACKER TAB ────────────────────────────────────────────────────── */}
      {mainTab === 'tracker' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* Submission Info */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4">📋 Submission Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div><label className={lbl}>Part Number</label><input className={inp} value={sub.partNumber} onChange={e => setS('partNumber', e.target.value)} placeholder="BKT-001 Rev A" /></div>
                <div className="md:col-span-2"><label className={lbl}>Part Name / Description</label><input className={inp} value={sub.partName} onChange={e => setS('partName', e.target.value)} placeholder="Mounting Bracket Assembly" /></div>
                <div><label className={lbl}>Customer</label><input className={inp} value={sub.customer} onChange={e => setS('customer', e.target.value)} placeholder="Tata Motors" /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div><label className={lbl}>Supplier Code</label><input className={inp} value={sub.supplierCode} onChange={e => setS('supplierCode', e.target.value)} placeholder="SUP-0042" /></div>
                <div>
                  <label className={lbl}>Submission Level</label>
                  <select className={inp} value={sub.submissionLevel} onChange={e => setS('submissionLevel', Number(e.target.value))}>
                    {[1,2,3,4,5].map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>PSW Status</label>
                  <select className={inp} value={sub.pswStatus} onChange={e => setS('pswStatus', e.target.value)}>
                    <option value="not-submitted">Not Submitted</option>
                    <option value="interim">Interim Approval</option>
                    <option value="approved">Fully Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Reason for Submission</label>
                  <select className={inp} value={sub.reason} onChange={e => setS('reason', e.target.value)}>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className={lbl}>Date Submitted</label><input type="date" className={inp} value={sub.submittedDate} onChange={e => setS('submittedDate', e.target.value)} /></div>
                <div><label className={lbl}>Date Approved</label><input type="date" className={inp} value={sub.approvedDate} onChange={e => setS('approvedDate', e.target.value)} /></div>
                <div><label className={lbl}>Approval Expiry Date</label><input type="date" className={inp} value={sub.expiryDate} onChange={e => setS('expiryDate', e.target.value)} /></div>
                <div>
                  <label className={lbl}>Safety/Regulated Part?</label>
                  <select className={inp} value={sub.safetyRegulated} onChange={e => setS('safetyRegulated', e.target.value)}>
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Submission Progress — Level {sub.submissionLevel}</span>
                <span className="text-sm font-bold text-cyan-300">{approvedCount} / {requiredCount} elements approved</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                <div className={`h-3 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }}></div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { label: 'Approved',    count: approvedCount,  color: 'text-green-400' },
                  { label: 'Submitted',   count: submittedCount, color: 'text-amber-400' },
                  { label: 'In Progress', count: pendingCount,   color: 'text-blue-400' },
                  { label: 'Rejected',    count: rejectedCount,  color: 'text-red-400' },
                  { label: 'Not Required', count: nrCount,       color: 'text-gray-500' },
                ].map(s => (
                  <div key={s.label} className={s.color}>
                    <span className="font-bold">{s.count}</span> {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* 18 Elements Table */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">18 PPAP Elements — AIAG 4th Edition</h2>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span><span className="text-red-400 font-bold">R</span> = Retain at facility</span>
                  <span><span className="text-blue-400 font-bold">S</span> = Submit to customer</span>
                  <span><span className="text-purple-400 font-bold">A</span> = Available for review</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="border border-gray-700 px-3 py-2 text-left text-gray-300 w-8">#</th>
                      <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">Element Name</th>
                      <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">L1</th>
                      <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">L2</th>
                      <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">L3</th>
                      <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">L4</th>
                      <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">L5</th>
                      <th className="border border-gray-700 px-3 py-2 text-center text-gray-300 w-36">Status</th>
                      <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elements.map((el, i) => {
                      const levelReq = el.levels[sub.submissionLevel];
                      const isNR = levelReq === '-';
                      return (
                        <tr key={el.id} className={`${i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'} ${el.status === 'rejected' ? 'border-l-2 border-red-500' : el.status === 'approved' ? 'border-l-2 border-green-600' : ''}`}>
                          <td className="border border-gray-700 px-3 py-2 text-gray-500 font-mono">{el.id}</td>
                          <td className="border border-gray-700 px-3 py-2 text-gray-200 font-medium">{el.name}</td>
                          {[1,2,3,4,5].map(l => (
                            <td key={l} className={`border border-gray-700 px-2 py-2 text-center ${l === sub.submissionLevel ? 'bg-cyan-900/20' : ''}`}>
                              {levelBadge(el.levels[l])}
                            </td>
                          ))}
                          <td className="border border-gray-700 px-2 py-2 text-center">
                            <select
                              className={`text-xs rounded px-1.5 py-0.5 border-0 focus:outline-none ${STATUS_COLORS[el.status]}`}
                              value={el.status}
                              onChange={e => setElemStatus(el.id, e.target.value as ElemStatus)}>
                              <option value="not-required">N/R</option>
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="submitted">Submitted</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="border border-gray-700 px-2 py-1.5">
                            <input
                              className="w-full bg-transparent text-gray-400 text-xs focus:outline-none focus:text-white placeholder-gray-700 min-w-[120px]"
                              value={el.notes} onChange={e => setElemNotes(el.id, e.target.value)}
                              placeholder={isNR ? 'Not required for this level' : 'Add notes / ref number...'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PSW Summary */}
            <div className={`border rounded-2xl p-5 ${sub.pswStatus === 'approved' ? 'bg-green-900/20 border-green-800/40' : 'bg-gray-900 border-gray-700'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📄</span>
                <h2 className="text-sm font-bold text-white">Part Submission Warrant (PSW) — Element 18</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${PSW_COLORS[sub.pswStatus]}`}>{PSW_LABELS[sub.pswStatus]}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  ['Part Number', sub.partNumber || '—'],
                  ['Customer', sub.customer || '—'],
                  ['Level', `Level ${sub.submissionLevel}`],
                  ['Reason', sub.reason],
                  ['Submitted', sub.submittedDate || '—'],
                  ['Approved', sub.approvedDate || '—'],
                  ['Expiry', sub.expiryDate || '—'],
                  ['Safety Part', sub.safetyRegulated],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-800/50 rounded-lg px-3 py-2">
                    <div className="text-gray-500">{l}</div>
                    <div className="text-white font-semibold mt-0.5 truncate">{v}</div>
                  </div>
                ))}
              </div>
              {sub.notes && <p className="mt-3 text-xs text-gray-400 bg-gray-800/40 rounded-lg px-3 py-2">{sub.notes}</p>}
            </div>

          </div>
        </div>
      )}

      {/* ── KNOWLEDGE HUB TAB ─────────────────────────────────────────────── */}
      {mainTab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-gray-900 border border-cyan-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">📦 What is PPAP?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The Production Part Approval Process (PPAP) is the AIAG standard that defines how a supplier demonstrates to a customer that all engineering design records, specifications, and requirements are properly understood, and that the manufacturing process is capable of consistently producing product meeting all requirements during actual production run.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon:'🎯', title:'Purpose', desc:'Prove that the process can consistently make parts that meet the drawing. Not just one-time — repeatably, at production rate, with production people and tooling.' },
                  { icon:'📋', title:'Standard', desc:'AIAG PPAP 4th Edition (2006). Required by all major OEMs under IATF 16949. Always check Customer-Specific Requirements (CSR) for additional requirements.' },
                  { icon:'✅', title:'Output', desc:'Part Submission Warrant (PSW) — signed by both supplier and customer. PSW approval means the supplier is authorized to ship production parts.' },
                ].map(c => (
                  <div key={c.title} className="bg-cyan-900/20 border border-cyan-800/30 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-cyan-300 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Levels */}
            <div className="bg-gray-900 border border-blue-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📊 PPAP Submission Levels — What Gets Sent?</h2>
              <div className="space-y-3">
                {[
                  { level:'Level 1', title:'PSW only (+ AAR if applicable)', color:'gray', when:'Parts with minimal risk — very simple, non-critical parts with established process. Customer requests this level explicitly.', what:'Only the Part Submission Warrant (and Appearance Approval Report if appearance characteristics apply). No supporting documents sent.' },
                  { level:'Level 2', title:'PSW + Limited Supporting Data + Samples', color:'blue', when:'Standard/commodity parts with low complexity. Customer may request for existing qualified suppliers.', what:'PSW + product samples + partial supporting data (dimensional results, material certs, capability study).' },
                  { level:'Level 3', title:'PSW + Full Supporting Data + Samples', color:'cyan', when:'DEFAULT LEVEL — applies to all new parts, all engineering changes, all new suppliers unless customer specifies otherwise.', what:'Full submission — all 18 elements that apply, complete supporting documentation, production samples from trial run.' },
                  { level:'Level 4', title:'PSW + Other Requirements as Defined by Customer', color:'purple', when:'Customer has non-standard requirements — used rarely, with specific customer guidance.', what:'Customer specifies exactly what is required. Follow their written instruction precisely.' },
                  { level:'Level 5', title:'PSW + Samples + Complete Data Available at Supplier', color:'green', when:'Safety/regulated parts, very complex parts, or high-risk situations. Customer reviews records at supplier site.', what:'Everything from Level 3, but documents stay at supplier facility. Customer conducts on-site review.' },
                ].map(l => (
                  <div key={l.level} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex-shrink-0">{l.level}</div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm mb-1">{l.title}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div><span className="text-gray-500">When:</span> <span className="text-gray-400">{l.when}</span></div>
                          <div><span className="text-gray-500">What to send:</span> <span className="text-gray-400">{l.what}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 18 Elements Summary */}
            <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📋 The 18 PPAP Elements — Quick Reference</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  [1,  'Design Records',                   'Engineering drawings, 3D CAD data, and all referenced specifications.'],
                  [2,  'Engineering Change Documents',      'Formal change notices if parts are to older rev than current drawing.'],
                  [3,  'Customer Engineering Approval',     'Written customer engineering approval for design (if customer is design responsible).'],
                  [4,  'Design FMEA',                      'Only required if supplier is responsible for design. AIAG-VDA 2019 format recommended.'],
                  [5,  'Process Flow Diagrams (PFD)',       'All process steps from receiving through shipping, including outsourced processes.'],
                  [6,  'Process FMEA',                     'PFMEA for all process steps — must link to Control Plan. AIAG-VDA 2019 format.'],
                  [7,  'Control Plan',                     'AIAG format control plan — pre-launch CP (during PPAP) and production CP (ongoing).'],
                  [8,  'MSA / GRR Studies',                'Gauge R&R for every measurement system used to control CC/SC characteristics. %R&R ≤ 10%.'],
                  [9,  'Dimensional Results',              'Dimensional results for minimum 6 parts (or per CSR). All balloon dimensions measured.'],
                  [10, 'Material / Performance Tests',     'Lab test results for all drawing-referenced material and functional specifications.'],
                  [11, 'Initial Process Study (SPC)',      'Pp/Ppk ≥ 1.67 for CC characteristics. If < 1.67, corrective action plan required.'],
                  [12, 'Qualified Laboratory Documentation','Lab certification (ISO 17025 or equivalent) for any external testing labs used.'],
                  [13, 'Appearance Approval Report (AAR)', 'For parts with appearance specifications — color, grain, gloss. Customer sign-off required.'],
                  [14, 'Sample Production Parts',          'Physical samples from production trial — quantity per customer requirement (typically 1–5 pcs).'],
                  [15, 'Master Sample',                    'Customer-signed master part retained at supplier. Reference standard for production.'],
                  [16, 'Checking Aids',                    'Gauges, fixtures, jigs — all must be documented and calibrated. Available for customer review.'],
                  [17, 'Customer-Specific Requirements',   'Evidence of compliance with any CSR requirements (Ford, GM, Stellantis, etc.).'],
                  [18, 'Part Submission Warrant (PSW)',    'The primary PPAP document — signed by supplier, countersigned by customer on approval.'],
                ].map(([num, name, desc]) => (
                  <div key={num} className="flex gap-3 bg-gray-800 rounded-xl px-3 py-2.5">
                    <span className="text-cyan-500 font-bold text-xs w-5 flex-shrink-0 pt-0.5">{num}</span>
                    <div>
                      <div className="text-white text-xs font-semibold">{name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* When Re-PPAP is Required */}
            <div className="bg-gray-900 border border-amber-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">🔄 When is Re-PPAP Required?</h2>
              <p className="text-gray-400 text-sm mb-4">Any change that could affect fit, form, function, durability, or performance requires customer notification and often a new PPAP. When in doubt — notify the customer. Shipping changed parts without PPAP approval is a critical finding under IATF 16949 Cl. 8.3.5.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  'Engineering change to part design (drawing/specification revision)',
                  'Change of sub-supplier or outsourced process supplier',
                  'Change to raw material (alloy, grade, supplier)',
                  'New or modified tooling, dies, or molds',
                  'Relocation of production tooling to different machine or line',
                  'Tooling or process inactive for more than 12 months',
                  'Change to manufacturing process sequence or method',
                  'Change to production facility / plant location',
                  'Correction of discrepancy from a previous PPAP submission',
                  'Annual re-PPAP if required by customer CSR (layout inspection)',
                  'Customer complaint requiring process change',
                  'Change in product appearance (color, surface finish, texture)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-900/10 border border-amber-900/20 rounded-lg p-2.5">
                    <span className="text-amber-500 flex-shrink-0">⚡</span>
                    <span className="text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── GUIDE TAB ─────────────────────────────────────────────────────── */}
      {mainTab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Prepare a PPAP Submission</h2>
              <p className="text-gray-400 text-sm mt-1">Aligned with AIAG PPAP 4th Edition and IATF 16949 Cl. 8.3.4</p>
            </div>

            {[
              { step:1, icon:'📋', title:'Confirm Submission Level & Customer Requirements',
                body:'Contact the customer to confirm the required submission level (default is Level 3). Download and review Customer-Specific Requirements (CSR) — Ford Q1, GM BIQS, Stellantis ASES all have additional PPAP requirements beyond AIAG standard. Check if an Appearance Approval Report (AAR) is needed.' },
              { step:2, icon:'🎯', title:'Prepare the Production Trial Run',
                body:'Run minimum 300 pieces from the actual production line using production tooling, production operators, production materials, at production rate and shift patterns. CRITICAL: Prototype tooling or pre-production samples do NOT qualify. The trial run must simulate real production conditions. Document start/end times, conditions, and any issues.' },
              { step:3, icon:'📐', title:'Complete Element 9 — Dimensional Results',
                body:'Balloon ALL dimensions on the drawing (every dimension and tolerance gets a number). Measure the ballooned part for minimum 6 pieces from the trial run (more if customer requires). Record every measurement: dimension number, specification, actual measured value, pass/fail. All dimensions must pass. Any fail must be dispositioned before PPAP submission.' },
              { step:4, icon:'🔬', title:'Complete Element 10 & 11 — Tests & Capability',
                body:'Submit samples to qualified lab for all drawing-referenced material and functional tests (tensile, hardness, plating thickness, etc.). Calculate Pp/Ppk for all CC and SC characteristics using trial run data. Target ≥ 1.67 for CC, ≥ 1.33 for SC. If below target, attach corrective action plan — customer must agree before approving.' },
              { step:5, icon:'✅', title:'Complete Element 8 — MSA / GRR Studies',
                body:'Every gauge used to measure CC/SC characteristics must have a completed GRR study. Minimum 2 operators, 2 trials, 10 parts (standard method). %R&R must be ≤ 10% for acceptance, ≤ 30% conditional. Run GRR BEFORE the capability study — a bad gauge invalidates the capability data.' },
              { step:6, icon:'📦', title:'Compile the Full PPAP Package',
                body:'Collect all applicable elements in order (1–18). Use a checklist to ensure nothing is missed. For Level 3 submission: include copies of all documents. Organize in a binder or digital folder with clear element numbers. Include physical sample parts (Element 14) and the signed PSW (Element 18) as the cover document.' },
              { step:7, icon:'🚀', title:'Submit to Customer & Track Approval',
                body:'Submit the package to the customer\'s Supplier Quality Engineer or APQP contact. Follow up if no response within the agreed timeline (typically 10-15 business days). Do NOT ship production parts until PSW is signed and returned. If interim approval is received, understand the conditions and timeline for full approval. File the approved PSW with a clear expiry/review date.' },
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="text-cyan-300 font-bold text-sm">{s.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">❌ Common PPAP Mistakes</h2>
              <div className="space-y-3">
                {[
                  ['Prototype parts submitted instead of production trial parts', 'PPAP must use production tooling, materials, and operators. Prototype parts do not satisfy PPAP. Customer will reject and require re-submission.'],
                  ['Cpk calculated from prototype or pre-production data', 'Capability must come from the production trial run. Pre-production data shows what the tool can do — not what the process will consistently deliver.'],
                  ['Dimensions not ballooned on the drawing', 'Every dimension must be numbered (ballooned) and every balloon must have a measurement result. Partial balloons = incomplete PPAP = rejection.'],
                  ['MSA not done before capability study', 'GRR must be completed and accepted before running the capability study. A 45% R&R gauge makes your Cpk meaningless.'],
                  ['Shipping production parts before PSW is approved', 'Shipping without PSW approval is a major IATF NC under Cl. 8.3.4. Always get written customer approval — email confirmation of PSW is not the same as signed PSW.'],
                  ['No re-PPAP after tooling or supplier change', 'Any change to the approved process must be notified to the customer. Shipping changed product without notification is a critical finding and can trigger recall.'],
                ].map(([m, f], i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                      <span className="text-red-400 text-sm flex-shrink-0">✗</span>
                      <p className="text-red-300 text-xs">{m}</p>
                    </div>
                    <div className="flex items-start gap-2 bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                      <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                      <p className="text-green-300 text-xs">{f}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🎯 IATF Auditor Questions — Be Ready</h2>
              <div className="space-y-2">
                {[
                  'Show me the PPAP for this part. What level was submitted and what is the PSW status?',
                  'The PSW shows approval date 2 years ago — has there been any engineering or process change since then? Was re-PPAP done?',
                  'How many pieces were in the production trial run? Were they made with production tooling?',
                  'What was the Ppk for this CC characteristic? Is it ≥ 1.67?',
                  'Do you have GRR results for the gauge used to measure this CC dimension? What was the %R&R?',
                  'Are your test results from an ISO 17025-accredited laboratory?',
                  'Can you show me the ballooned drawing and corresponding dimensional results for this PPAP?',
                  'This part was changed 6 months ago — where is the change notification to the customer and the updated PPAP?',
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-3 bg-purple-900/20 border border-purple-800/30 rounded-lg px-4 py-3">
                    <span className="text-purple-400 font-bold text-sm flex-shrink-0">Q{i+1}</span>
                    <p className="text-gray-300 text-xs leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
