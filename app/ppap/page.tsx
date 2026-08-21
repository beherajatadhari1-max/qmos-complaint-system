'use client';

import { useState } from 'react';
import PageTitle from '../components/PageTitle';

// -- Types ---------------------------------------------------------------------
type ElemStatus = 'not-required' | 'pending' | 'in-progress' | 'submitted' | 'approved' | 'rejected';
type PSWStatus  = 'not-submitted' | 'interim' | 'approved' | 'rejected';

interface PPAPElement {
  id: number;
  name: string;
  shortName: string;
  status: ElemStatus;
  notes: string;
  desc?: string;
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
  desc?: string;
}

// -- AIAG PPAP 4th Edition — 18 Elements --------------------------------------
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
  'not-required': 'bg-gray-700 text-white',
  'pending':      'bg-gray-700 text-white',
  'in-progress':  'bg-[#eff6ff] text-[#1d4ed8]',
  'submitted':    'bg-amber-800 text-amber-700',
  'approved':     'bg-green-800 text-green-300',
  'rejected':     'bg-red-800 text-red-700',
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
  'not-submitted': 'bg-gray-700 text-white',
  'interim':       'bg-amber-800 text-amber-700',
  'approved':      'bg-green-800 text-green-300',
  'rejected':      'bg-red-800 text-red-700',
};
const PSW_LABELS: Record<PSWStatus, string> = {
  'not-submitted': 'Not Submitted',
  'interim':       '⏳ Interim Approval',
  'approved':      '✅ Fully Approved',
  'rejected':      '❌ Rejected',
};

const inp  = 'w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-gray-400';
const lbl  = 'text-xs text-[#1e3a5f] block mb-1';

function levelBadge(v: 'R' | 'S' | 'A' | '-') {
  if (v === 'R') return <span className="text-xs bg-red-800/60 text-red-600 px-1.5 py-0.5 rounded font-bold">R</span>;
  if (v === 'S') return <span className="text-xs bg-[#eff6ff]/60 text-blue-600 px-1.5 py-0.5 rounded font-bold">S</span>;
  if (v === 'A') return <span className="text-xs bg-purple-800/60 text-purple-600 px-1.5 py-0.5 rounded font-bold">A</span>;
  return <span className="text-xs text-white">—</span>;
}


const SL_ITEMS = [
  'Dimensional inspection 100% for first 3 shipment batches',
  'Cpk verification at production rate (Ppk ≥ 1.67 for CC / 1.33 for SC)',
  'Material certificate verified and matched with each shipment',
  'Control Plan active and displayed at all work stations',
  'MSA / GRR study completed for all critical gauges',
  'Operators trained, certified, and sign-off recorded',
  'Customer SQE notified of first shipment date and lot details',
  'Safe launch monitoring sheet attached to each lot traveller',
  'Escalation path defined and communicated to QA team',
  'No open 8D / CAPA actions remaining from trial run',
  'Sub-supplier PPAP approved (if sub-contracted parts involved)',
  'Production rate demonstrated ≥ 300 pieces in sign-off trial run',
];

export default function PPAPPage() {
  const [mainTab, setMainTab] = useState<'overview' | 'guide' | 'generator' | 'analyser' | 'qa' | 'templates' | 'docs' | 'posters' | 'dashboard' | 'elements' | 'workflow' | 'casestudies' | 'training'>('overview');
  const [pgen, setPgen] = useState({ partName: '', partNumber: '', customer: '', level: '3', reason: 'New Part / New Program' });
  const [pgenResult, setPgenResult] = useState(false);
  const [showPSWGen, setShowPSWGen] = useState(false);
  const [showSafeLaunch, setShowSafeLaunch] = useState(false);
  const [slChecks, setSlChecks] = useState<Record<number,boolean>>({});
  const [slInfo, setSlInfo] = useState({ shipDate:'', frequency:'Every batch — first 3', pieces:'100', period:'90', responsible:'' });
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
      <>
      <PageTitle title="PPAP" />
      <div className="min-h-screen bg-white">

      {/* -- Header ----------------------------------------------------------- */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e2a5a 50%,#162044 100%)', padding: '22px 32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f160,transparent)' }} />
        <div className="max-w-screen-xl mx-auto">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>📦</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>PPAP</h1>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#6366f125', color: '#a5b4fc', borderRadius: '20px', border: '1px solid #6366f145' }}>AIAG 4th Edition</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#10b98115', color: '#6ee7b7', borderRadius: '20px', border: '1px solid #10b98140' }}>IATF 16949</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Production Part Approval Process — Complete Knowledge Center</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', background: '#6366f120', border: '1px solid #6366f145', borderRadius: '10px', padding: '9px 14px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#a5b4fc' }}>18</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Elements</div>
              </div>
              <div style={{ textAlign: 'center', background: '#6366f115', border: '1px solid #6366f140', borderRadius: '10px', padding: '9px 14px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#a5b4fc' }}>5</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Levels</div>
              </div>
              <div style={{ textAlign: 'center', background: '#6366f115', border: '1px solid #6366f140', borderRadius: '10px', padding: '9px 14px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#a5b4fc' }}>{pct}%</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Done</div>
              </div>
              <button onClick={loadSample} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                🧪 Load Sample
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', gap: '1px', flexWrap: 'wrap' }}>
            {([
              { id: 'overview',   label: '📖 Overview' },
              { id: 'guide',      label: '📋 PPAP Guide' },
              { id: 'generator',  label: '⚡ Generator' },
              { id: 'analyser',   label: '🔍 Analyser' },
              { id: 'qa',         label: '💬 Interview Q&A' },
              { id: 'templates',  label: '📁 Templates' },
              { id: 'docs',       label: '📚 Supporting Docs' },
              { id: 'posters',      label: '🖼 Posters & Banners' },
              { id: 'dashboard',    label: '📊 Dashboard' },
              { id: 'elements',     label: '🧩 18 Elements' },
              { id: 'workflow',     label: '🔄 Workflow' },
              { id: 'casestudies',  label: '📂 Case Studies' },
              { id: 'training',     label: '🎓 Training Academy' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                style={{
                  padding: '9px 14px', fontSize: '12px', fontWeight: mainTab === t.id ? 700 : 400,
                  color: mainTab === t.id ? '#fff' : '#cbd5e1',
                  background: mainTab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none', borderBottom: mainTab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                  cursor: 'pointer', borderRadius: '8px 8px 0 0', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* -- OVERVIEW TAB ----------------------------------------------------- */}
      {mainTab === 'overview' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* What is PPAP */}
              <div className="md:col-span-2 bg-white border border-cyan-800/40 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">📦 What is PPAP?</h2>
                <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                  The <strong className="text-white">Production Part Approval Process (PPAP)</strong> is an AIAG standard that defines how a supplier demonstrates to a customer that all engineering design records, specifications, and requirements are properly understood — and that the manufacturing process can consistently produce conforming product at production rate.
                </p>
                <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                  PPAP is one of the <strong className="text-cyan-300">Five Core Tools</strong> of the automotive quality system. It is the final output of APQP Phase 4 and is mandatory for IATF 16949 compliance. The PSW (Part Submission Warrant) is the primary deliverable — customer sign-off authorizes production shipment.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {[
                    { label:'Developed by', value:'AIAG + OEM Alliance' },
                    { label:'Current Edition', value:'4th Edition (2006)' },
                    { label:'IATF Clause', value:'8.3.4, 8.6.1, 8.6.2' },
                    { label:'18 Elements', value:'PSW is Element 18' },
                    { label:'5 Levels', value:'Level 3 = Default' },
                    { label:'Linked To', value:'APQP, PFMEA, MSA, SPC, CP' },
                  ].map(i => (
                    <div key={i.label} className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl px-3 py-2">
                      <div className="text-xs text-[#1e3a5f] uppercase tracking-wide">{i.label}</div>
                      <div className="text-sm font-semibold text-[#1e3a5f] mt-1">{i.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Stat cards */}
              <div className="flex flex-col gap-4">
                {[
                  { icon:'📋', stat:'18', label:'PPAP Elements', color:'text-cyan-300', bg:'bg-cyan-900/30 border-cyan-800/40' },
                  { icon:'📊', stat:'5', label:'Submission Levels', color:'text-purple-300', bg:'bg-purple-900/30 border-purple-700/50' },
                  { icon:'📄', stat:'PSW', label:'Primary Deliverable', color:'text-green-300', bg:'bg-green-900/30 border-green-700/50' },
                  { icon:'🏭', stat:'300', label:'Min. Trial Run Pieces', color:'text-amber-700', bg:'bg-amber-50 border-amber-800/40' },
                ].map(s => (
                  <div key={s.label} className={`border rounded-2xl p-4 flex items-center gap-4 ${s.bg}`}>
                    <span className="text-3xl">{s.icon}</span>
                    <div>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.stat}</div>
                      <div className="text-sm font-semibold text-[#1e3a5f]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why PPAP matters */}
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">💡 Why PPAP Matters</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon:'🛡️', title:'Customer Confidence', desc:'Proves the process can make conforming parts — not just one-off samples' },
                  { icon:'💰', title:'Avoid Costly Rejections', desc:'Missing PPAP before shipment = customer line stoppage = massive cost' },
                  { icon:'📋', title:'IATF Compliance', desc:'Clause 8.3.4 and 8.6.1 mandatory — non-compliance = major NC at audit' },
                  { icon:'🔄', title:'Change Control', desc:'Re-PPAP required for any design/process change — protects both parties' },
                  { icon:'📊', title:'Process Capability Proof', desc:'Ppk ≥ 1.67 for CC characteristics — validated at production rate' },
                  { icon:'🏆', title:'APQP Completion Proof', desc:'PSW is evidence that APQP Phase 4 validation was successfully completed' },
                ].map(b => (
                  <div key={b.title} className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-4">
                    <div className="text-2xl mb-2">{b.icon}</div>
                    <div className="text-[#1e3a5f] font-semibold text-sm mb-1">{b.title}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* IATF clause map */}
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">📌 IATF 16949 Clause Map</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  ['8.3.4','Control of Design and Development Changes — PPAP required for changes affecting fit/form/function'],
                  ['8.6.1','Release of Products and Services — Planned arrangements must be completed before release'],
                  ['8.6.2','Layout Inspection and Functional Testing — Annual PPAP / layout per customer requirements'],
                  ['8.6.3','Appearance Items — Appearance Approval Report (AAR) for appearance-related characteristics'],
                  ['8.6.4','Verification and Acceptance of Externally Provided Products — Supplier PPAP management'],
                  ['8.6.5','Statutory and Regulatory Conformity — PPAP must include regulatory compliance evidence'],
                ].map(([c, t]) => (
                  <div key={c} className="flex gap-3 bg-[#eff6ff] border border-[#dbeafe] rounded-xl px-4 py-3">
                    <span className="text-cyan-300 font-bold text-xs w-12 flex-shrink-0 pt-0.5">{c}</span>
                    <span className="text-[#1e3a5f] text-xs leading-relaxed">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* -- Download Strip ----------------- */}
            <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex flex-wrap gap-2 items-center">
              <span className="text-[#1e3a5f] text-xs font-bold mr-2">📥 Quick Downloads:</span>
              <a href="/downloads/ppap/PPAP_Step_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80" style={{background:'#1e40af'}}>📋 PPAP Step Guide</a>
              <a href="/downloads/ppap/PPAP_18_Element_Checklist.xlsx" download className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80" style={{background:'#059669'}}>✅ 18 Element Checklist</a>
              <a href="/downloads/ppap/PPAP_ReTrigger_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80" style={{background:'#dc2626'}}>⚠ Re-PPAP Triggers</a>
              <a href="/downloads/ppap/PPAP_vs_APQP_Relationship.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80" style={{background:'#0e7490'}}>🔗 PPAP vs APQP Map</a>
              <a href="/downloads/ppap/AIAG_PPAP_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80" style={{background:'#7c3aed'}}>📖 AIAG PPAP 4th Ed.</a>
            </div>
          </div>
        </div>
      )}

      {/* -- ANALYSER TAB (was Tracker) ---------------------------------------- */}
      {mainTab === 'analyser' && (
        <div className="animate-fadeIn p-4 bg-white min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* -- Download Strip ----------------- */}
            <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex flex-wrap gap-2 items-center mb-4">
              <span className="text-white text-xs font-bold mr-2">📥 Analyser Downloads:</span>
              <a href="/downloads/ppap/PPAP_PSW_Template.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#059669',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>📜 PSW Template</span></a>
              <a href="/downloads/ppap/PPAP_Capability_Study.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#1e40af',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>📊 Capability Study</span></a>
              <a href="/downloads/ppap/PPAP_Dimensional_Results.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#dc2626',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>📐 Dimensional Results</span></a>
              <a href="/downloads/ppap/PPAP_Status_Tracker.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#7c3aed',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>📌 Status Tracker</span></a>
            </div>

            {/* Submission Info */}
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
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
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-y-2">
                <span className="text-sm font-bold text-white">Submission Progress — Level {sub.submissionLevel}</span>
                <span className="text-sm font-bold text-cyan-600">{approvedCount} / {requiredCount} elements approved</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                <div className={`h-3 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-900/30/300' : 'bg-cyan-600'}`} style={{ width: `${pct}%` }}></div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { label: 'Approved',    count: approvedCount,  color: 'text-green-300' },
                  { label: 'Submitted',   count: submittedCount, color: 'text-amber-700' },
                  { label: 'In Progress', count: pendingCount,   color: 'text-[#1d4ed8]' },
                  { label: 'Rejected',    count: rejectedCount,  color: 'text-red-700' },
                  { label: 'Not Required', count: nrCount,       color: 'text-white' },
                ].map(s => (
                  <div key={s.label} className={s.color}>
                    <span className="font-bold">{s.count}</span> {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* -- Readiness Score + Actions ---------------------------- */}
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
              <div className="flex flex-col md:flex-row gap-5 items-start">
                {/* Gauge */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div style={{width:'100px',height:'100px',borderRadius:'50%',background:`conic-gradient(${pct>=80?'#10b981':pct>=50?'#f59e0b':'#ef4444'} ${pct*3.6}deg,#1f2937 0deg)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{width:'76px',height:'76px',borderRadius:'50%',background:'#111827',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                      <span style={{fontSize:'22px',fontWeight:800,color:pct>=80?'#10b981':pct>=50?'#f59e0b':'#ef4444'}}>{pct}%</span>
                      <span style={{fontSize:'9px',color:'#64748b'}}>Ready</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${pct===100?'bg-green-800 text-green-300':pct>=80?'bg-emerald-800 text-emerald-700':pct>=50?'bg-amber-800 text-amber-700':'bg-red-800 text-red-700'}`}>
                    {pct===100?'✅ Ready to Submit':pct>=80?'🟡 Almost Ready':pct>=50?'⏳ In Progress':'🔴 Not Ready'}
                  </span>
                </div>
                {/* Stats */}
                <div className="flex-1 w-full">
                  <h2 className="text-sm font-bold text-white mb-3">📊 Readiness Score — Level {sub.submissionLevel}</h2>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                    {([
                      { label:'Approved', count:approvedCount, color:'#10b981', bg:'rgba(16,185,129,0.12)' },
                      { label:'Submitted', count:submittedCount, color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
                      { label:'In Progress', count:pendingCount, color:'#60a5fa', bg:'rgba(96,165,250,0.12)' },
                      { label:'Rejected', count:rejectedCount, color:'#f87171', bg:'rgba(248,113,113,0.12)' },
                      { label:'Not Required', count:nrCount, color:'#94a3b8', bg:'rgba(148,163,184,0.12)' },
                    ] as const).map(s => (
                      <div key={s.label} style={{background:s.bg,borderRadius:'10px',padding:'10px 8px',textAlign:'center'}}>
                        <div style={{fontSize:'20px',fontWeight:700,color:s.color}}>{s.count}</div>
                        <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'2px'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Blockers */}
                  {rejectedCount > 0 && (
                    <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',padding:'10px 12px',marginBottom:'8px'}}>
                      <div className="text-xs font-bold text-red-600 mb-2">🚫 Rejected — immediate action required</div>
                      <div className="flex flex-wrap gap-1.5">
                        {elements.filter(e => e.status === 'rejected').map(e => (
                          <span key={e.id} className="text-xs px-2 py-0.5 rounded bg-red-800 text-red-700 font-medium">{e.id}. {e.shortName}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {elements.filter(e => e.status === 'pending' && e.levels[sub.submissionLevel] !== '-').length > 0 && (
                    <div style={{background:'rgba(148,163,184,0.08)',border:'1px solid rgba(148,163,184,0.2)',borderRadius:'10px',padding:'10px 12px',marginBottom:'8px'}}>
                      <div className="text-xs font-bold text-white mb-2">⏳ Still pending</div>
                      <div className="flex flex-wrap gap-1.5">
                        {elements.filter(e => e.status === 'pending' && e.levels[sub.submissionLevel] !== '-').map(e => (
                          <span key={e.id} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-white font-medium">{e.id}. {e.shortName}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {pct === 100 && (
                    <div style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:'10px',padding:'10px 12px'}}>
                      <span className="text-xs text-[#15803d] font-bold">✅ All required elements approved — package ready for customer submission</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#dbeafe]">
                <button onClick={() => setShowPSWGen(s => !s)}
                  style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',fontSize:'13px',fontWeight:700,background:showPSWGen?'#4f46e5':'#3730a3',color:'#c7d2fe',border:'none',cursor:'pointer'}}>
                  📄 {showPSWGen ? 'Hide PSW Preview' : 'Generate PSW Preview'}
                </button>
                <button onClick={() => setShowSafeLaunch(s => !s)}
                  style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',fontSize:'13px',fontWeight:700,background:showSafeLaunch?'#0e7490':'#0c4a6e',color:'#bae6fd',border:'none',cursor:'pointer'}}>
                  🚀 {showSafeLaunch ? 'Hide Safe Launch' : 'Safe Launch Plan'}
                </button>
              </div>
            </div>

            {/* 18 Elements Table */}
            <div className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#dbeafe] flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">18 PPAP Elements — AIAG 4th Edition</h2>
                <div className="flex gap-2 text-xs text-white">
                  <span><span className="text-red-700 font-bold">R</span> = Retain at facility</span>
                  <span><span className="text-[#1d4ed8] font-bold">S</span> = Submit to customer</span>
                  <span><span className="text-purple-700 font-bold">A</span> = Available for review</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-white">
                    <tr>
                      <th className="border border-[#dbeafe] px-3 py-2 text-left text-white w-8">#</th>
                      <th className="border border-[#dbeafe] px-3 py-2 text-left text-white">Element Name</th>
                      <th className="border border-[#dbeafe] px-2 py-2 text-center text-white">L1</th>
                      <th className="border border-[#dbeafe] px-2 py-2 text-center text-white">L2</th>
                      <th className="border border-[#dbeafe] px-2 py-2 text-center text-white">L3</th>
                      <th className="border border-[#dbeafe] px-2 py-2 text-center text-white">L4</th>
                      <th className="border border-[#dbeafe] px-2 py-2 text-center text-white">L5</th>
                      <th className="border border-[#dbeafe] px-3 py-2 text-center text-white w-36">Status</th>
                      <th className="border border-[#dbeafe] px-3 py-2 text-left text-white">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elements.map((el, i) => {
                      const levelReq = el.levels[sub.submissionLevel];
                      const isNR = levelReq === '-';
                      return (
                        <tr key={el.id} className={`${i % 2 === 0 ? 'bg-[#eff6ff]' : 'bg-white/10'} ${el.status === 'rejected' ? 'border-l-2 border-red-500' : el.status === 'approved' ? 'border-l-2 border-green-600' : ''}`}>
                          <td className="border border-[#dbeafe] px-3 py-2 text-white font-mono">{el.id}</td>
                          <td className="border border-[#dbeafe] px-3 py-2 text-white font-medium">{el.name}</td>
                          {[1,2,3,4,5].map(l => (
                            <td key={l} className={`border border-[#dbeafe] px-2 py-2 text-center ${l === sub.submissionLevel ? 'bg-cyan-900/20' : ''}`}>
                              {levelBadge(el.levels[l])}
                            </td>
                          ))}
                          <td className="border border-[#dbeafe] px-2 py-2 text-center">
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
                          <td className="border border-[#dbeafe] px-2 py-1.5">
                            <input
                              className="w-full bg-transparent text-white text-xs focus:outline-none focus:text-white placeholder-gray-700 min-w-[120px]"
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
            <div className={`border rounded-2xl p-5 ${sub.pswStatus === 'approved' ? 'bg-green-900/30/20 border-green-700/50' : 'bg-white border-[#dbeafe]'}`}>
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
                  <div key={l} className="bg-[#eff6ff] rounded-lg px-3 py-2">
                    <div className="text-white">{l}</div>
                    <div className="text-white font-semibold mt-0.5 truncate">{v}</div>
                  </div>
                ))}
              </div>
              {sub.notes && <p className="mt-3 text-xs text-[#1e3a5f] bg-[#eff6ff] rounded-lg px-3 py-2">{sub.notes}</p>}
            </div>

            {/* -- PSW Generator Preview --------------------------------------- */}
            {showPSWGen && (
              <div className="bg-white rounded-2xl p-6 border border-[#dbeafe]">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
                  <h2 style={{fontSize:'16px',fontWeight:700,color:'#111827'}}>📄 Part Submission Warrant (PSW) — Preview</h2>
                  <div className="flex gap-2">
                    <span style={{fontSize:'11px',padding:'3px 10px',background:'#f0fdf4',color:'#15803d',borderRadius:'20px',border:'1px solid #86efac',fontWeight:600}}>AIAG PPAP 4th Edition — Element 18</span>
                    <button onClick={() => window.print()} style={{fontSize:'12px',padding:'5px 14px',background:'#4f46e5',color:'#fff',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:600}}>🖨️ Print / Save PDF</button>
                  </div>
                </div>
                {/* Header */}
                <div style={{background:'#1e2a5a',color:'#fff',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'15px',fontWeight:700}}>PART SUBMISSION WARRANT</div>
                  <div style={{fontSize:'11px',color:'#a5b4fc',marginTop:'2px'}}>Production Part Approval Process (PPAP) — AIAG 4th Edition</div>
                </div>
                {/* Section A */}
                <div style={{marginBottom:'14px',border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
                  <div style={{background:'#f1f5f9',padding:'6px 12px',fontSize:'11px',fontWeight:700,color:'#334155',borderBottom:'1px solid #e5e7eb'}}>SECTION A — PART INFORMATION</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0'}}>
                    {[
                      ['Part Number', sub.partNumber || '_______________'],
                      ['Part Name / Description', sub.partName || '_______________'],
                      ['Customer Name', sub.customer || '_______________'],
                      ['Supplier / Vendor Code', sub.supplierCode || '_______________'],
                      ['Submission Level', `Level ${sub.submissionLevel}`],
                      ['Reason for Submission', sub.reason],
                      ['Date Submitted', sub.submittedDate || '_______________'],
                      ['Safety / Regulated Part', sub.safetyRegulated],
                      ['Approved Date', sub.approvedDate || '_______________'],
                    ].map(([l,v], i) => (
                      <div key={i} style={{padding:'8px 12px',borderBottom:'1px solid #e5e7eb',borderRight:i%3!==2?'1px solid #e5e7eb':'none'}}>
                        <div style={{fontSize:'9px',color:'#6b7280',marginBottom:'2px',textTransform:'uppercase'}}>{l}</div>
                        <div style={{fontSize:'12px',fontWeight:600,color:'#111827'}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Section B */}
                <div style={{marginBottom:'14px',border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
                  <div style={{background:'#f1f5f9',padding:'6px 12px',fontSize:'11px',fontWeight:700,color:'#334155',borderBottom:'1px solid #e5e7eb'}}>SECTION B — 18 ELEMENT STATUS (Level {sub.submissionLevel})</div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',fontSize:'10px',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{background:'#f8fafc'}}>
                          <th style={{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid #e5e7eb',color:'#374151',fontWeight:600}}>#</th>
                          <th style={{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid #e5e7eb',color:'#374151',fontWeight:600}}>Element</th>
                          <th style={{padding:'5px 8px',textAlign:'center',borderBottom:'1px solid #e5e7eb',color:'#374151',fontWeight:600}}>Required</th>
                          <th style={{padding:'5px 8px',textAlign:'center',borderBottom:'1px solid #e5e7eb',color:'#374151',fontWeight:600}}>Status</th>
                          <th style={{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid #e5e7eb',color:'#374151',fontWeight:600}}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {elements.map((el,i) => {
                          const req = el.levels[sub.submissionLevel];
                          const statusColor = el.status==='approved'?'#15803d':el.status==='rejected'?'#b91c1c':el.status==='not-required'?'#6b7280':'#b45309';
                          return (
                            <tr key={el.id} style={{background:i%2===0?'#fff':'#f9fafb',borderBottom:'1px solid #f3f4f6'}}>
                              <td style={{padding:'5px 8px',color:'#374151',fontFamily:'monospace'}}>{el.id}</td>
                              <td style={{padding:'5px 8px',color:'#111827',fontWeight:500}}>{el.name}</td>
                              <td style={{padding:'5px 8px',textAlign:'center',fontWeight:700,color:req==='-'?'#9ca3af':req==='S'?'#1d4ed8':'#b91c1c'}}>{req==='-'?'N/R':req}</td>
                              <td style={{padding:'5px 8px',textAlign:'center'}}><span style={{fontSize:'10px',fontWeight:600,color:statusColor}}>{STATUS_LABELS[el.status]}</span></td>
                              <td style={{padding:'5px 8px',color:'#6b7280',fontSize:'10px'}}>{el.notes || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Section C */}
                <div style={{border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden',marginBottom:'10px'}}>
                  <div style={{background:'#f1f5f9',padding:'6px 12px',fontSize:'11px',fontWeight:700,color:'#334155',borderBottom:'1px solid #e5e7eb'}}>SECTION C — DECLARATION & SIGNATURES</div>
                  <div style={{padding:'12px 16px'}}>
                    <p style={{fontSize:'11px',color:'#374151',lineHeight:'1.6',marginBottom:'12px'}}>
                      I affirm that the samples represented by this warrant are representative of our parts, which were made by a process that meets all specified requirements. I also certify that documented evidence of such compliance is on file and available for review.
                    </p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'}}>
                      {[
                        ['Supplier / Organisation', ''],
                        ['Print Name', ''],
                        ['Title', ''],
                        ['Phone', ''],
                        ['Signature', ''],
                        ['Date', sub.submittedDate || ''],
                      ].map(([l,v],i) => (
                        <div key={i} style={{borderBottom:'1px solid #d1d5db',paddingBottom:'4px'}}>
                          <div style={{fontSize:'9px',color:'#6b7280',textTransform:'uppercase'}}>{l}</div>
                          <div style={{fontSize:'12px',color:'#111827',minHeight:'18px'}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:'12px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'}}>
                      {[
                        ['Customer Approval', ''],
                        ['Customer Signature', ''],
                        ['Date of Approval', sub.approvedDate || ''],
                      ].map(([l,v],i) => (
                        <div key={i} style={{borderBottom:'1px solid #d1d5db',paddingBottom:'4px'}}>
                          <div style={{fontSize:'9px',color:'#6b7280',textTransform:'uppercase'}}>{l}</div>
                          <div style={{fontSize:'12px',color:'#111827',minHeight:'18px'}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{textAlign:'center',fontSize:'10px',color:'#9ca3af',marginTop:'8px'}}>
                  Generated by QMOS — Quality Management Operating System | PPAP Phase 2 | AIAG 4th Edition
                </div>
              </div>
            )}

            {/* -- Safe Launch Plan ------------------------------------------- */}
            {showSafeLaunch && (
              <div className="bg-white border border-cyan-800/40 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <h2 className="text-sm font-bold text-white">Safe Launch Plan</h2>
                    <p className="text-xs text-white mt-0.5">First shipment monitoring checklist — IATF 16949 Clause 8.5.6.1</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-bold bg-cyan-800 text-cyan-300">
                    {Object.values(slChecks).filter(Boolean).length} / {SL_ITEMS.length} Complete
                  </span>
                </div>
                {/* Info fields */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {([
                    { label:'First Ship Date', key:'shipDate', type:'date', placeholder:'' },
                    { label:'Inspection Frequency', key:'frequency', type:'text', placeholder:'Every batch (first 3)' },
                    { label:'Sample Size (pcs)', key:'pieces', type:'number', placeholder:'100' },
                    { label:'Monitoring Period (days)', key:'period', type:'number', placeholder:'90' },
                    { label:'Responsible Person', key:'responsible', type:'text', placeholder:'Quality Engineer name' },
                  ] as const).map(f => (
                    <div key={f.key}>
                      <label className={lbl}>{f.label}</label>
                      <input type={f.type} className={inp} placeholder={f.placeholder}
                        value={slInfo[f.key]}
                        onChange={e => setSlInfo(prev => ({...prev, [f.key]: e.target.value}))} />
                    </div>
                  ))}
                </div>
                {/* Checklist */}
                <div className="space-y-2">
                  {SL_ITEMS.map((item, i) => (
                    <div key={i}
                      onClick={() => setSlChecks(prev => ({...prev, [i]: !prev[i]}))}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{background:slChecks[i]?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.03)',border:`1px solid ${slChecks[i]?'rgba(16,185,129,0.3)':'rgba(100,116,139,0.2)'}`}}>
                      <div style={{width:'18px',height:'18px',borderRadius:'5px',flexShrink:0,marginTop:'1px',
                        background:slChecks[i]?'#10b981':'transparent',
                        border:`2px solid ${slChecks[i]?'#10b981':'#4b5563'}`,
                        display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {slChecks[i] && <span style={{color:'#fff',fontSize:'11px',fontWeight:700}}>✓</span>}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white mr-2" style={{color:'#64748b'}}>{i+1}.</span>
                        <span className={`text-xs ${slChecks[i]?'text-[#15803d] line-through opacity-70':'text-white'}`}>{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Launch verdict */}
                {Object.values(slChecks).filter(Boolean).length === SL_ITEMS.length && (
                  <div style={{background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:'12px',padding:'14px 16px',marginTop:'12px',textAlign:'center'}}>
                    <div className="text-[#15803d] font-bold text-sm">✅ Safe Launch Checklist Complete — Cleared for First Shipment</div>
                    <div className="text-white text-xs mt-1">Responsible: {slInfo.responsible || '—'} | First Ship: {slInfo.shipDate || '—'} | Monitor for: {slInfo.period} days</div>
                  </div>
                )}
                {Object.values(slChecks).filter(Boolean).length < SL_ITEMS.length && (
                  <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'12px',padding:'10px 16px',marginTop:'12px'}}>
                    <span className="text-amber-700 text-xs font-bold">
                      ⚠ {SL_ITEMS.length - Object.values(slChecks).filter(Boolean).length} items remaining before first shipment clearance
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* -- GENERATOR TAB --------------------------------------------------- */}
      {mainTab === 'generator' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white border border-cyan-800/40 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <div className="text-base font-bold text-white">PPAP Package Generator</div>
                    <div className="text-white text-xs mt-0.5">Enter minimal inputs → generate PPAP element checklist, element requirements per level, and PSW summary</div>
                  </div>
                </div>
                {[
                  { label:'Part Name / Description', key:'partName', placeholder:'e.g. Mounting Bracket Assembly', type:'text' },
                  { label:'Part Number / Drawing Rev', key:'partNumber', placeholder:'e.g. BKT-001 Rev B', type:'text' },
                  { label:'Customer Name', key:'customer', placeholder:'e.g. Tata Motors / Maruti Suzuki', type:'text' },
                ].map(f => (
                  <div key={f.key} className="mb-4">
                    <label className="text-xs text-white block mb-1.5">{f.label}</label>
                    <input type={f.type} value={pgen[f.key as keyof typeof pgen]}
                      onChange={e => setPgen(g => ({ ...g, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none" />
                  </div>
                ))}
                <div className="mb-4">
                  <label className="text-xs text-white block mb-1.5">Submission Level</label>
                  <select value={pgen.level} onChange={e => setPgen(g => ({ ...g, level: e.target.value }))}
                    className="w-full bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none">
                    {[
                      { v:'1', l:'Level 1 — PSW only' },
                      { v:'2', l:'Level 2 — PSW + Limited Data' },
                      { v:'3', l:'Level 3 — PSW + Full Package (Default)' },
                      { v:'4', l:'Level 4 — Customer Defined' },
                      { v:'5', l:'Level 5 — Full Package at Supplier' },
                    ].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                <div className="mb-5">
                  <label className="text-xs text-white block mb-1.5">Reason for Submission</label>
                  <select value={pgen.reason} onChange={e => setPgen(g => ({ ...g, reason: e.target.value }))}
                    className="w-full bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none">
                    {REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={() => { if (pgen.partName && pgen.customer) setPgenResult(true); }}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-600 text-white font-bold text-sm rounded-xl transition-colors">
                  ⚡ Generate PPAP Checklist
                </button>
                {!pgen.partName && <div className="text-xs text-white text-center mt-2">Fill Part Name and Customer to generate</div>}
              </div>

              {/* Output */}
              {!pgenResult ? (
                <div className="bg-white border-2 border-dashed border-[#dbeafe] rounded-2xl flex flex-col items-center justify-center gap-4 p-10 text-center">
                  <div className="text-5xl">📋</div>
                  <div className="text-white font-semibold">PPAP Package Checklist will appear here</div>
                  <div className="text-white text-xs max-w-xs leading-relaxed">Fill the form and click Generate to see all 18 elements with their requirements for your selected submission level</div>
                </div>
              ) : (
                <div className="bg-white border border-cyan-800/40 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-base font-bold text-white">{pgen.partName}</div>
                      <div className="text-white text-xs">{pgen.partNumber} · {pgen.customer}</div>
                      <div className="text-cyan-600 text-xs mt-1">Level {pgen.level} Submission · {pgen.reason}</div>
                    </div>
                    <button onClick={() => setPgenResult(false)} className="text-xs text-white border border-[#dbeafe] rounded-lg px-3 py-1 hover:text-white">Reset</button>
                  </div>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {INITIAL_ELEMENTS.map(el => {
                      const req = el.levels[Number(pgen.level)];
                      const reqLabel = req === 'R' ? 'Retain at facility' : req === 'S' ? 'Submit to customer' : req === 'A' ? 'Available for review' : 'Not Required';
                      const reqColor = req === 'R' ? 'text-red-700 bg-red-50' : req === 'S' ? 'text-[#1d4ed8] bg-[#eff6ff]' : req === 'A' ? 'text-purple-700 bg-purple-900/30/20' :  'text-[#1e3a5f] bg-[#eff6ff]';
                      return (
                        <div key={el.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                          <span className="text-cyan-600 font-mono text-xs w-5">{el.id}</span>
                          <span className="text-white text-xs flex-1">{el.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0 ${reqColor}`}>{req === '-' ? 'N/R' : reqLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 bg-cyan-900/20 border border-cyan-800/40 rounded-xl p-3">
                    <div className="text-xs font-bold text-cyan-600 mb-2">✅ PSW Pre-Check Summary</div>
                    {[
                      `Part: ${pgen.partName} (${pgen.partNumber || 'Rev TBD'})`,
                      `Customer: ${pgen.customer}`,
                      `Submission Level: Level ${pgen.level}`,
                      `Reason: ${pgen.reason}`,
                      `Required elements for Level ${pgen.level}: ${INITIAL_ELEMENTS.filter(e => e.levels[Number(pgen.level)] !== '-').length} of 18`,
                    ].map(l => <div key={l} className="text-xs text-white py-0.5">▸ {l}</div>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -- KNOWLEDGE HUB TAB (now PPAP Guide) ------------------------------ */}
      {mainTab === 'guide' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* -- Download Strip ----------------- */}
            <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex flex-wrap gap-2 items-center mb-4">
              <span className="text-white text-xs font-bold mr-2">📥 Guide Downloads:</span>
              <a href="/downloads/ppap/PPAP_Step_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#1e40af',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>📋 PPAP Step Guide</span></a>
              <a href="/downloads/ppap/PPAP_ReTrigger_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#dc2626',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>⚠ Re-PPAP Trigger Guide</span></a>
              <a href="/downloads/ppap/PPAP_Submission_Level_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#7c2d12',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>🗂 Submission Level Guide</span></a>
              <a href="/downloads/ppap/AIAG_PPAP_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#7c3aed',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>📖 AIAG PPAP 4th Edition</span></a>
            </div>

            <div className="bg-white border border-cyan-800/40 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">📦 What is PPAP?</h2>
              <p className="text-white text-sm leading-relaxed mb-4">
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
                    <div className="text-cyan-600 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-white text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Levels */}
            <div className="bg-white border border-blue-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📊 PPAP Submission Levels — What Gets Sent?</h2>
              <div className="space-y-3">
                {[
                  { level:'Level 1', title:'PSW only (+ AAR if applicable)', color:'gray', when:'Parts with minimal risk — very simple, non-critical parts with established process. Customer requests this level explicitly.', what:'Only the Part Submission Warrant (and Appearance Approval Report if appearance characteristics apply). No supporting documents sent.' },
                  { level:'Level 2', title:'PSW + Limited Supporting Data + Samples', color:'blue', when:'Standard/commodity parts with low complexity. Customer may request for existing qualified suppliers.', what:'PSW + product samples + partial supporting data (dimensional results, material certs, capability study).' },
                  { level:'Level 3', title:'PSW + Full Supporting Data + Samples', color:'cyan', when:'DEFAULT LEVEL — applies to all new parts, all engineering changes, all new suppliers unless customer specifies otherwise.', what:'Full submission — all 18 elements that apply, complete supporting documentation, production samples from trial run.' },
                  { level:'Level 4', title:'PSW + Other Requirements as Defined by Customer', color:'purple', when:'Customer has non-standard requirements — used rarely, with specific customer guidance.', what:'Customer specifies exactly what is required. Follow their written instruction precisely.' },
                  { level:'Level 5', title:'PSW + Samples + Complete Data Available at Supplier', color:'green', when:'Safety/regulated parts, very complex parts, or high-risk situations. Customer reviews records at supplier site.', what:'Everything from Level 3, but documents stay at supplier facility. Customer conducts on-site review.' },
                ].map(l => (
                  <div key={l.level} className="bg-white rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex-shrink-0">{l.level}</div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm mb-1">{l.title}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div><span className="text-white">When:</span> <span className="text-white">{l.when}</span></div>
                          <div><span className="text-white">What to send:</span> <span className="text-white">{l.what}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 18 Elements Summary */}
            <div className="bg-white border border-green-700/50 rounded-2xl p-6">
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
                  <div key={num} className="flex gap-3 bg-white rounded-xl px-3 py-2.5">
                    <span className="text-cyan-500 font-bold text-xs w-5 flex-shrink-0 pt-0.5">{num}</span>
                    <div>
                      <div className="text-white text-xs font-semibold">{name}</div>
                      <div className="text-white text-xs mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* When Re-PPAP is Required */}
            <div className="bg-white border border-amber-800/40 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">🔄 When is Re-PPAP Required?</h2>
              <p className="text-white text-sm mb-4">Any change that could affect fit, form, function, durability, or performance requires customer notification and often a new PPAP. When in doubt — notify the customer. Shipping changed parts without PPAP approval is a critical finding under IATF 16949 Cl. 8.3.5.</p>
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
                  <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-900/20 rounded-lg p-2.5">
                    <span className="text-amber-500 flex-shrink-0">⚡</span>
                    <span className="text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- Q&A TAB --------------------------------------------------------- */}
      {mainTab === 'qa' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* -- Download Strip ----------------- */}
            <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex flex-wrap gap-2 items-center mb-4">
              <span className="text-white text-xs font-bold mr-2">📥 Q&A Reference Downloads:</span>
              <a href="/downloads/ppap/PPAP_Audit_Checklist.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#065f46',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>✔ PPAP Audit Checklist</span></a>
              <a href="/downloads/ppap/PPAP_Submission_Level_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#7c2d12',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>🗂 Submission Level Guide</span></a>
              <a href="/downloads/ppap/PPAP_PSW_Template.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#059669',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>📜 PSW Template</span></a>
              <a href="/downloads/ppap/PPAP_18_Element_Checklist.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",color:"#fff",textDecoration:"none",opacity:1}}
                onMouseOver={e=>(e.currentTarget.style.opacity="0.8")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}
              ><span style={{background:'#0e7490',padding:"2px 8px",borderRadius:"6px",color:"#fff",fontWeight:"700",fontSize:"11px"}}>✅ 18 Element Checklist</span></a>
            </div>

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Prepare a PPAP Submission</h2>
              <p className="text-white text-sm mt-1">Aligned with AIAG PPAP 4th Edition and IATF 16949 Cl. 8.3.4</p>
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
              <div key={s.step} className="bg-white border border-[#dbeafe] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="text-cyan-600 font-bold text-sm">{s.title}</h3>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white border border-red-900/50 rounded-2xl p-6">
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
                    <div className="flex items-start gap-2 bg-red-50 border border-red-800/30 rounded-lg p-3">
                      <span className="text-red-700 text-sm flex-shrink-0">✗</span>
                      <p className="text-red-600 text-xs">{m}</p>
                    </div>
                    <div className="flex items-start gap-2 bg-green-900/30/20 border border-green-700/50 rounded-lg p-3">
                      <span className="text-[#15803d] text-sm flex-shrink-0">✓</span>
                      <p className="text-[#15803d] text-xs">{f}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-purple-700/50 rounded-2xl p-6">
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
                  <div key={i} className="flex items-start gap-3 bg-purple-900/30/20 border border-purple-700/50 rounded-lg px-4 py-3">
                    <span className="text-purple-700 font-bold text-sm flex-shrink-0">Q{i+1}</span>
                    <p className="text-white text-xs leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- TEMPLATES TAB --------------------------------------------------- */}
      {mainTab === 'templates' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="max-w-screen-xl mx-auto">
            <p className="text-white text-sm mb-5">Ready-to-use Excel and Word templates for all key PPAP elements. Download, customize, and submit.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'PPAP 18-Element Checklist', type: 'Excel', icon: '✅', desc: 'Complete checklist for all 18 PPAP elements with status tracking and submission level matrix', file: '/downloads/ppap/PPAP_18_Element_Checklist.xlsx' },
                { name: 'Part Submission Warrant (PSW)', type: 'Excel', icon: '📜', desc: 'Blank PSW form per AIAG PPAP 4th Edition with all required fields', file: '/downloads/ppap/PPAP_PSW_Template.xlsx' },
                { name: 'Dimensional Results Sheet', type: 'Excel', icon: '📐', desc: 'Balloon drawing results tracking — 6-piece dimensional report with pass/fail summary', file: '/downloads/ppap/PPAP_Dimensional_Results.xlsx' },
                { name: 'Initial Process Capability Study', type: 'Excel', icon: '📊', desc: 'Cpk/Ppk calculation sheet for 30–300 piece production trial with histograms', file: '/downloads/ppap/PPAP_Capability_Study.xlsx' },
                { name: 'PPAP Status Tracker', type: 'Excel', icon: '📋', desc: 'Multi-part PPAP status dashboard — all elements, submission dates, approval status', file: '/downloads/ppap/PPAP_Status_Tracker.xlsx' },
                { name: 'Appearance Approval Report (AAR)', type: 'Word', icon: '🎨', desc: 'AAR form for colour, gloss, texture with customer sign-off section', file: '/downloads/ppap/PPAP_AAR_Template.docx' },
              ].map(tpl => (
                <div key={tpl.name} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex gap-3 items-start" onDoubleClick={() => tpl.file.endsWith('.pdf') && window.open(tpl.file, '_blank')} title={tpl.file.endsWith('.pdf') ? 'Double-click to view' : ''} style={{ cursor: tpl.file.endsWith('.pdf') ? 'pointer' : 'default' }}>
                  <div className="text-2xl flex-shrink-0">{tpl.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm mb-1">{tpl.name}</div>
                    <div className="text-white text-xs mb-2 leading-relaxed">{tpl.desc}</div>
                    <a href={tpl.file} download className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition ${tpl.type === 'Excel' ? 'bg-green-700 hover:bg-green-600' : 'bg-blue-700 hover:bg-blue-600'}`}>
                      ⬇ {tpl.type}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- DOCS TAB -------------------------------------------------------- */}
      {mainTab === 'docs' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-6">
            {/* Official Manual */}
            <div className="bg-white border border-cyan-800/40 rounded-2xl p-5 flex items-center gap-5">
              <div className="w-14 h-14 bg-cyan-900/30 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📘</div>
              <div className="flex-1">
                <div className="font-bold text-white text-base mb-1">AIAG PPAP 4th Edition Manual</div>
                <div className="text-white text-xs mb-2">Official AIAG Production Part Approval Process 4th Edition — complete standard reference covering all 18 elements, 5 submission levels, PSW requirements and customer-specific requirements</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-cyan-900/30 text-cyan-600 px-2 py-0.5 rounded">PDF · 2.6 MB</span>
                  <span className="text-xs bg-purple-900/30 text-purple-600 px-2 py-0.5 rounded">AIAG Standard</span>
                  <span className="text-xs bg-green-900/30 text-[#15803d] px-2 py-0.5 rounded">18 Elements</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href="/downloads/ppap/AIAG_PPAP_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-bold transition">
                  👁 View PDF
                </a>
                <a href="/downloads/ppap/AIAG_PPAP_Fourth_Edition.pdf" download
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-600 text-white rounded-xl text-sm font-bold transition">
                  ⬇ Download
                </a>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { title: 'PPAP Submission Level Decision Guide', icon: '🗂️', desc: 'Decision matrix for selecting the correct submission level based on part type and customer requirements', file: '/downloads/ppap/PPAP_Submission_Level_Guide.pdf' },
                { title: 'PPAP vs APQP Relationship Map', icon: '🔗', desc: 'Visual showing how PPAP Element 18 (PSW) connects to APQP Phase 4 outputs and all 18 elements', file: '/downloads/ppap/PPAP_vs_APQP_Relationship.pdf' },
                { title: 'PPAP Audit Checklist', icon: '✔️', desc: '30-point internal audit checklist to assess PPAP compliance — all 18 elements with objective evidence requirements', file: '/downloads/ppap/PPAP_Audit_Checklist.pdf' },
              ].map(doc => (
                <div key={doc.title} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex items-center gap-4" onDoubleClick={() => window.open(doc.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                  <div className="text-2xl flex-shrink-0">{doc.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm mb-1">{doc.title}</div>
                    <div className="text-white text-xs leading-relaxed">{doc.desc}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={doc.file} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white hover:bg-[#dbeafe] text-[#1e3a5f] rounded-lg text-xs font-bold transition">View →</a>
                    <a href={doc.file} download className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold transition">⬇ PDF</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- POSTERS TAB ----------------------------------------------------- */}
      {mainTab === 'posters' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="max-w-screen-xl mx-auto">
            <p className="text-white text-sm mb-5">Print-ready visual posters and banners for factory walls, quality lab, and training rooms. A1/A2/A3 format.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title:'PPAP 18 Elements Flow Map', size:'A1 Poster', desc:'Complete visual map of all 18 PPAP elements with submission levels, R/S/A requirements, and links to APQP', colors:['#0e7490','#0891b2'], file:'/downloads/ppap/PPAP_18_Elements_Poster.pdf' },
                { title:'PPAP Submission Level Matrix', size:'A2 Poster', desc:'Visual matrix showing which elements are required for each of the 5 submission levels', colors:['#7c3aed','#6d28d9'], file:'/downloads/ppap/PPAP_Level_Matrix_Poster.pdf' },
                { title:'PPAP vs APQP Phase 4 Map', size:'A1 Poster', desc:'How APQP Phase 4 deliverables become the 18 PPAP elements — the complete relationship visual', colors:['#0d9488','#0e7490'], file:'/downloads/ppap/PPAP_APQP_Link_Poster.pdf' },
                { title:'Re-PPAP Trigger Checklist', size:'A3 Poster', desc:'Visual checklist of all 12 conditions that require Re-PPAP — display near engineering change desk', colors:['#b45309','#d97706'], file:'/downloads/ppap/PPAP_ReTrigger_Poster.pdf' },
                { title:'Production Trial Run Guide', size:'A2 Banner', desc:'Step-by-step visual guide: what is required in the 300-piece production trial — operators, tooling, rate', colors:['#065f46','#047857'], file:'/downloads/ppap/PPAP_PTR_Guide_Banner.pdf' },
                { title:'PSW Sign-Off Flow Banner', size:'A2 Banner', desc:'Visual flow: how PSW moves from supplier quality → engineering approval → customer sign-off', colors:['#1e3a5f','#1e40af'], file:'/downloads/ppap/PPAP_PSW_Flow_Banner.pdf' },
              ].map(p => (
                <div key={p.title} className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden" onDoubleClick={() => window.open(p.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                  <div style={{ background: `linear-gradient(135deg, ${p.colors[0]}33, ${p.colors[1]}55)`, borderBottom:'1px solid #374151' }} className="h-36 flex flex-col items-center justify-center gap-2 p-4">
                    <div className="flex gap-2">{p.colors.map((c,i) => <div key={i} style={{ width:18, height:18, borderRadius:4, background:c }} />)}</div>
                    <div style={{ color: p.colors[0], fontSize:11, fontWeight:700, textAlign:'center' }}>{p.title}</div>
                    <div className="text-xs text-white bg-white px-2 py-0.5 rounded-full">{p.size}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-white font-semibold text-xs mb-1">{p.title}</div>
                    <p className="text-white text-xs leading-relaxed mb-3">{p.desc}</p>
                    <div className="flex gap-2">
                      <a href={p.file} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-bold py-2 bg-white hover:bg-[#dbeafe] text-[#1e3a5f] rounded-lg transition">🖨️ View</a>
                      <a href={p.file} download className="flex-1 text-center text-xs font-bold py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg transition">⬇ Download</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-white border border-cyan-800/40 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-3xl">🖨️</div>
              <div>
                <div className="text-sm font-bold text-cyan-600">Print & Display in Your Factory</div>
                <div className="text-xs text-white mt-1">All posters formatted for A1/A2/A3 printing. Laminate and display near quality lab, incoming inspection, and PPAP filing area.</div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* -- DASHBOARD TAB ---------------------------------------------------- */}
      {mainTab === 'dashboard' && (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 40px' }}>
          <div style={{ margin: '0 auto' }}>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { icon: '✅', label: 'Approved Elements', value: approvedCount, total: 18, color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
                { icon: '🔄', label: 'In Progress / Pending', value: pendingCount, total: 18, color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
                { icon: '❌', label: 'Rejected', value: rejectedCount, total: 18, color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
                { icon: '📤', label: 'Submitted', value: submittedCount, total: 18, color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
                { icon: '📊', label: 'Completion %', value: `${pct}%`, total: null, color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
                { icon: '🏭', label: 'Submission Level', value: `L${sub.submissionLevel}`, total: null, color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: '14px', padding: '18px 20px' }}>
                  <div style={{ fontSize: '26px', marginBottom: '6px' }}>{k.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                  {k.total && <div style={{ fontSize: '11px', color: '#111827', marginTop: '2px' }}>of {k.total} elements</div>}
                  <div style={{ fontSize: '12px', color: '#111827', fontWeight: 600, marginTop: '6px' }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '22px 28px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#000000' }}>📦 PPAP Package Readiness</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>{pct}% Complete</span>
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : pct >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)', transition: 'width 0.4s', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Approved', count: approvedCount, color: '#10b981' },
                  { label: 'Submitted', count: submittedCount, color: '#3b82f6' },
                  { label: 'In Progress', count: pendingCount, color: '#f59e0b' },
                  { label: 'Rejected', count: rejectedCount, color: '#ef4444' },
                  { label: 'Not Required', count: nrCount, color: '#94a3b8' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>{s.label}: {s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Info + Element Status Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', marginBottom: '24px' }}>
              {/* Submission Card */}
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '22px 24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#000000',  marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>📋 Current Submission</div>
                {[
                  { label: 'Part Number', value: sub.partNumber || '—' },
                  { label: 'Part Name', value: sub.partName || '—' },
                  { label: 'Customer', value: sub.customer || '—' },
                  { label: 'Supplier Code', value: sub.supplierCode || '—' },
                  { label: 'Submission Level', value: `Level ${sub.submissionLevel}` },
                  { label: 'Reason', value: sub.reason },
                  { label: 'PSW Status', value: PSW_LABELS[sub.pswStatus] },
                  { label: 'Submitted Date', value: sub.submittedDate || '—' },
                  { label: 'Approved Date', value: sub.approvedDate || '—' },
                  { label: 'Expiry Date', value: sub.expiryDate || '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>{r.label}</span>
                    <span style={{ fontSize: '12px', color: '#000000', fontWeight: 700, textAlign: 'right' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Quick Element Status */}
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '22px 24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#000000',  marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>🧩 Element Status Summary</div>
                <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Element', 'Status', 'L1','L2','L3','L4','L5'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#111827', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {elements.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 8px', color: '#111827', fontWeight: 600 }}>{e.id}</td>
                          <td style={{ padding: '6px 8px', color: '#000000', fontWeight: 700, maxWidth: '180px' }}>{e.name}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                              background: e.status === 'approved' ? '#ecfdf5' : e.status === 'rejected' ? '#fef2f2' : e.status === 'submitted' ? '#eff6ff' : e.status === 'in-progress' ? '#fffbeb' : e.status === 'not-required' ? '#f8fafc' : '#f1f5f9',
                              color: e.status === 'approved' ? '#059669' : e.status === 'rejected' ? '#dc2626' : e.status === 'submitted' ? '#2563eb' : e.status === 'in-progress' ? '#d97706' : '#94a3b8'
                            }}>
                              {STATUS_LABELS[e.status]}
                            </span>
                          </td>
                          {['l1','l2','l3','l4','l5'].map(lk => (
                            <td key={lk} style={{ padding: '6px 8px', textAlign: 'center' }}>{levelBadge(e[lk as keyof PPAPElement] as 'R'|'S'|'A'|'-')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Readiness Checklist */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '22px 28px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#000000',  marginBottom: '16px' }}>🎯 Customer Submission Readiness Checklist</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '10px' }}>
                {[
                  { item: 'Design Records (drawings, specs) received', done: true },
                  { item: 'PFMEA completed with actions closed', done: approvedCount >= 10 },
                  { item: 'Control Plan approved by quality head', done: approvedCount >= 12 },
                  { item: 'Dimensional Results (balloon drawing + GD&T)', done: approvedCount >= 8 },
                  { item: 'MSA (GR&R) completed — all gauges', done: approvedCount >= 14 },
                  { item: 'SPC — Cpk ≥ 1.67 for critical characteristics', done: approvedCount >= 15 },
                  { item: 'Material Certificates / Lab Reports', done: approvedCount >= 10 },
                  { item: 'Appearance Approval Report (AAR) signed', done: sub.pswStatus !== 'not-submitted' },
                  { item: 'Production trial run ≥ 300 pieces', done: approvedCount >= 16 },
                  { item: 'PSW completed and signed by Quality Head', done: sub.pswStatus === 'approved' },
                  { item: 'Customer-specific requirements addressed', done: approvedCount >= 17 },
                  { item: 'PPAP package indexed and numbered', done: pct >= 80 },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 12px', background: c.done ? '#f0fdf4' : '#fafafa', borderRadius: '8px', border: `1px solid ${c.done ? '#bbf7d0' : '#e2e8f0'}` }}>
                    <span style={{ fontSize: '14px', marginTop: '1px' }}>{c.done ? '✅' : '⬜'}</span>
                    <span style={{ fontSize: '12px', color: c.done ? '#14532d' : '#000000', fontWeight: 700 }}>{c.item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- 18 ELEMENTS TAB -------------------------------------------------- */}
      {mainTab === 'elements' && (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 40px' }}>
          <div style={{ margin: '0 auto' }}>

            {/* -- Download Strip ----------------- */}
            <div style={{background:"#f1f5f9",border:"1px solid #334155",borderRadius:"12px",padding:"14px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:"700",marginRight:"8px"}}>📥 Element Reference Downloads:</span>
              <a href="/downloads/ppap/PPAP_18_Element_Checklist.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                ✅ 18 Element Checklist
              </a>
              <a href="/downloads/ppap/PPAP_vs_APQP_Relationship.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#0e7490",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                🔗 PPAP vs APQP Map
              </a>
              <a href="/downloads/ppap/PPAP_Capability_Study.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                📊 Capability Study
              </a>
              <a href="/downloads/ppap/PPAP_Dimensional_Results.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                📐 Dimensional Results
              </a>
            </div>

            {/* Score banner */}
            <div style={{ background: 'linear-gradient(135deg,#1e2a5a,#3730a3)', borderRadius: '16px', padding: '20px 28px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>🧩 PPAP 18-Element Tracker</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>AIAG 4th Edition · IATF 16949 Clause 8.3.4 / 8.6.1 / 8.6.2</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171' }}>{pct}%</div>
                  <div style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>Completeness Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#a5b4fc' }}>{approvedCount}/{requiredCount}</div>
                  <div style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>Elements Done</div>
                </div>
              </div>
            </div>

            {/* Level Legend */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>Level Requirement Legend:</span>
              {[
                { label: 'R = Retained (keep at plant, submit if requested)', color: '#7f1d1d', bg: '#fef2f2', badge: 'R', badgeColor: '#dc2626' },
                { label: 'S = Submitted (must send to customer)', color: '#0c1a2e', fontWeight: 700, bg: '#eff6ff', badge: 'S', badgeColor: '#2563eb' },
                { label: 'A = Approved (AAR sign-off needed)', color: '#4a1d96', bg: '#f5f3ff', badge: 'A', badgeColor: '#7c3aed' },
                { label: '— = Not Required for this level', color: '#111827', bg: '#f8fafc', badge: '—', badgeColor: '#555555' },
              ].map(l => (
                <div key={l.badge} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: l.bg, color: l.badgeColor, border: `1px solid ${l.badgeColor}30` }}>{l.badge}</span>
                  <span style={{ fontSize: '11px', color: '#111827' }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Elements Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: '14px' }}>
              {elements.map(e => (
                <div key={e.id} style={{ background: '#fff', border: `1.5px solid ${e.status === 'approved' ? '#bbf7d0' : e.status === 'rejected' ? '#fecaca' : e.status === 'submitted' ? '#bfdbfe' : e.status === 'in-progress' ? '#fde68a' : '#e2e8f0'}`, borderRadius: '14px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                      <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#1e2a5a', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{e.id}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000',  lineHeight: '1.3' }}>{e.name}</div>
                        <div style={{ fontSize: '11px', color: '#000000', fontWeight: 700, marginTop: '3px' }}>{e.desc}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '3px', flexShrink: 0, marginLeft: '8px' }}>
                      {['l1','l2','l3','l4','l5'].map((lk, li) => (
                        <div key={lk} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#000000', fontWeight: 600, marginBottom: '2px' }}>L{li+1}</div>
                          {levelBadge(e[lk as keyof PPAPElement] as 'R'|'S'|'A'|'-')}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status selector */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {(['pending','in-progress','submitted','approved','rejected','not-required'] as ElemStatus[]).map(st => (
                      <button key={st} onClick={() => setElemStatus(e.id, st)} style={{
                        fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', cursor: 'pointer', border: '1.5px solid',
                        background: e.status === st ? (st === 'approved' ? '#ecfdf5' : st === 'rejected' ? '#fef2f2' : st === 'submitted' ? '#eff6ff' : st === 'in-progress' ? '#fffbeb' : st === 'not-required' ? '#f8fafc' : '#f1f5f9') : 'transparent',
                        borderColor: e.status === st ? (st === 'approved' ? '#059669' : st === 'rejected' ? '#dc2626' : st === 'submitted' ? '#2563eb' : st === 'in-progress' ? '#d97706' : '#94a3b8') : '#e2e8f0',
                        color: e.status === st ? (st === 'approved' ? '#059669' : st === 'rejected' ? '#dc2626' : st === 'submitted' ? '#2563eb' : st === 'in-progress' ? '#d97706' : '#64748b') : '#9ca3af',
                      }}>
                        {STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <input
                    value={e.notes}
                    onChange={ev => setElemNotes(e.id, ev.target.value)}
                    placeholder="Add notes / evidence reference…"
                    style={{ width: '100%', fontSize: '11px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#000000', fontWeight: 700, background: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            {/* Tips */}
            <div style={{ marginTop: '24px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '18px 24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0c1a2e',  marginBottom: '10px' }}>💡 PPAP Element Tips from the Field</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '8px' }}>
                {[
                  "Element 1: Design records must match the customer's CAD/drawing revision exactly.",
                  "Element 4: FMEA RPN should be reduced before PPAP — never submit high-RPN unresolved.",
                  "Element 7: Control Plan must reference all elements from PFMEA.",
                  "Element 8: Dimensional report must cover 100% of all dimensions on balloon drawing.",
                  "Element 9: MSA studies required for all special characteristics — GR&R < 10% preferred.",
                  "Element 10: Process Capability (Cpk) ≥ 1.67 for special chars, ≥ 1.33 for regular.",
                  "Element 11: Lab scope (A2LA/NABL) required for certified material testing.",
                  "Element 18: PSW is the master document — all other elements support it.",
                ].map((tip, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: 700, background: '#dbeafe', borderRadius: '8px', padding: '8px 12px' }}>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- WORKFLOW TAB ----------------------------------------------------- */}
      {mainTab === 'workflow' && (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 40px' }}>
          <div style={{ margin: '0 auto' }}>

            {/* -- Download Strip ----------------- */}
            <div style={{background:"#f1f5f9",border:"1px solid #334155",borderRadius:"12px",padding:"14px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:"700",marginRight:"8px"}}>📥 Workflow Downloads:</span>
              <a href="/downloads/ppap/PPAP_Step_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                📋 PPAP Step Guide
              </a>
              <a href="/downloads/ppap/PPAP_vs_APQP_Relationship.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#0e7490",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                🔗 PPAP vs APQP Map
              </a>
              <a href="/downloads/ppap/PPAP_Status_Tracker.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                📌 Status Tracker
              </a>
              <a href="/downloads/ppap/PPAP_ReTrigger_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                ⚠ Re-PPAP Trigger Guide
              </a>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#000000', margin: 0 }}>🔄 PPAP End-to-End Workflow</h2>
              <p style={{ fontSize: '13px', color: '#000000', fontWeight: 700, marginTop: '6px' }}>From Customer RFQ to Full Production Approval — digital flow with gate reviews</p>
            </div>

            {/* Main Flow */}
            {[
              {
                phase: 'Phase 0', title: 'Customer RFQ & Feasibility', icon: '📩', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',
                steps: ['Receive Customer RFQ / Nomination Letter', 'Review drawing, specifications, volumes, timelines', 'Conduct Design Feasibility (DFMA analysis)', 'Complete Manufacturing Feasibility (Man, Machine, Method)', 'Submit Feasibility Sign-off to customer', 'Receive Customer Award / Purchase Order'],
                outputs: ['Feasibility Sign-off', 'Capacity Study', 'BOM', 'Tooling Quotation'],
                gate: 'Gate 0: Management sign-off on feasibility before accepting program'
              },
              {
                phase: 'Phase 1', title: 'APQP Planning & Kick-off', icon: '📋', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd',
                steps: ['Form cross-functional APQP team (Engg, Qual, Prod, Purchase)', 'Freeze product design inputs (drawings, specs, DVP&R)', 'Create APQP timing plan with milestones', 'Assign PPAP element ownership to team members', 'Open APQP tracker — begin tracking all 18 elements'],
                outputs: ['APQP Plan', 'Timing Chart', 'Team Charter', 'PPAP element ownership matrix'],
                gate: 'Gate 1: APQP plan reviewed and approved by Quality Head'
              },
              {
                phase: 'Phase 2', title: 'Product Design & DFMEA', icon: '🔧', color: '#0891b2', bg: '#ecfeff', border: '#67e8f9',
                steps: ['Finalize design records (drawings, 3D models, tolerances)', 'Conduct DFMEA with design team', 'Close all High-RPN actions from DFMEA', 'Prepare DVP&R (Design Verification Plan & Report)', 'Complete prototype builds and testing', 'Lock Bill of Materials and specifications'],
                outputs: ['DFMEA', 'DVP&R', 'Design Records (Elem 1)', 'Approved Drawings'],
                gate: 'Gate 2: Design freeze — no changes post gate without ECN approval'
              },
              {
                phase: 'Phase 3', title: 'Process Design & PFMEA', icon: '⚙️', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
                steps: ['Create Process Flow Diagram (PFD) for all operations', 'Develop PFMEA for each manufacturing process step', 'Design Control Plan (Pre-launch + Production)', 'Design tooling, fixtures, gauges and measuring systems', 'Define special characteristics (SC / CC / KPC)', 'Plan gauge calibration and MSA studies'],
                outputs: ['PFMEA', 'Control Plan', 'Process Flow Diagram', 'Gauge List', 'SC/CC Register'],
                gate: 'Gate 3: PFMEA + Control Plan reviewed by customer quality (if required)'
              },
              {
                phase: 'Phase 4', title: 'Trial Run & Validation', icon: '🏭', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
                steps: ['Complete all tooling, fixtures and equipment', 'Run production trial (minimum 300 pieces from production tooling)', 'Collect all PPAP evidence during trial run', 'Perform MSA (GR&R) on all measurement systems', 'Complete Dimensional Results (balloon drawing, all dims)', 'Run SPC study — calculate Cpk for all critical characteristics', 'Complete material testing and obtain lab reports (with NABL/A2LA scope)'],
                outputs: ['MSA Reports (Elem 9)', 'Dimensional Reports (Elem 8)', 'SPC/Cpk reports (Elem 10)', 'Material certs (Elem 11)', 'Production trial report'],
                gate: 'Gate 4: All Cpk ≥ 1.67 (critical), ≥ 1.33 (regular). Reject-zero during trial run'
              },
              {
                phase: 'Phase 5', title: 'PPAP Package Compilation', icon: '📦', color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc',
                steps: ['Compile all 18 PPAP elements per submission level', 'Complete Part Submission Warrant (PSW) form', 'Get PSW signed by Authorized Quality Representative', 'Index and number PPAP package (cover sheet, element list)', 'Submit to customer as per their format (IMDS, web portal, physical)', 'Record submission date in PPAP tracker'],
                outputs: ['PSW (Elem 18)', 'Complete PPAP Package', 'IMDS submission', 'Customer portal submission'],
                gate: 'Gate 5: Internal quality head review before customer submission'
              },
              {
                phase: 'Phase 6', title: 'Customer Review & Approval', icon: '✅', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7',
                steps: ['Customer SQE reviews submitted PPAP package', 'Respond to customer queries / clarifications', 'Address any customer-raised issues or NCRs', 'Obtain Customer Approval (Full / Interim / Rejected)', 'If rejected: initiate corrective action, re-submit', 'File approved PPAP package in controlled location'],
                outputs: ['Customer Approval Letter', 'Approved PSW', 'PPAP record in document control'],
                gate: 'Gate 6: Full Approval = Production shipment authorized'
              },
              {
                phase: 'Phase 7', title: 'Safe Launch & Production', icon: '🚀', color: '#000000', fontWeight: 700, bg: '#f8fafc', border: '#cbd5e1',
                steps: ['Activate Safe Launch Plan (enhanced inspection for first 90 days)', '100% inspection at start of production (reduce as Cpk validated)', 'Daily quality meetings during safe launch period', 'Track field failures and warranty claims', 'Transfer to routine production after safe launch closure', 'Update Control Plan, FMEA with lessons learned'],
                outputs: ['Safe Launch Plan', 'Daily SPC charts', 'Layered Process Audit results', 'Lessons Learned Record'],
                gate: 'Gate 7: Safe launch closure sign-off by Quality Head and Customer'
              },
            ].map((ph, idx) => (
              <div key={idx} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '0' }}>
                  {/* Phase marker */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: ph.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: `0 4px 12px ${ph.color}40` }}>{ph.icon}</div>
                    {idx < 7 && <div style={{ width: '2px', flex: 1, background: `${ph.color}40`, margin: '4px 0', minHeight: '24px' }} />}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, background: ph.bg, border: `1.5px solid ${ph.border}`, borderRadius: '14px', padding: '18px 22px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: ph.color, color: '#fff', padding: '3px 10px', borderRadius: '20px' }}>{ph.phase}</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#000000' }}>{ph.title}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Steps</div>
                        {ph.steps.map((s, i) => (
                          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: ph.color, minWidth: '16px' }}>{i + 1}.</span>
                            <span style={{ fontSize: '12px', color: '#000000', fontWeight: 700 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Outputs</div>
                        {ph.outputs.map((o, i) => (
                          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: ph.color }}>📄</span>
                            <span style={{ fontSize: '12px', color: '#000000', fontWeight: 700 }}>{o}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: '12px', background: '#fff8', border: `1px solid ${ph.border}`, borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: ph.color }}>🚦 Gate Review: </span>
                          <span style={{ fontSize: '11px', color: '#111827' }}>{ph.gate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* -- CASE STUDIES TAB ------------------------------------------------- */}
      {mainTab === 'casestudies' && (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 40px' }}>
          <div style={{ margin: '0 auto' }}>

            {/* -- Download Strip ----------------- */}
            <div style={{background:"#f1f5f9",border:"1px solid #334155",borderRadius:"12px",padding:"14px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:"700",marginRight:"8px"}}>📥 Case Study Reference Downloads:</span>
              <a href="/downloads/ppap/PPAP_Audit_Checklist.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#065f46",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                ✔ PPAP Audit Checklist
              </a>
              <a href="/downloads/ppap/PPAP_ReTrigger_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                ⚠ Re-PPAP Trigger Guide
              </a>
              <a href="/downloads/ppap/PPAP_Status_Tracker.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                📌 Status Tracker
              </a>
              <a href="/downloads/ppap/PPAP_18_Element_Checklist.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                ✅ 18 Element Checklist
              </a>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#000000', margin: 0 }}>📂 PPAP Case Studies — Real Manufacturing Scenarios</h2>
              <p style={{ fontSize: '13px', color: '#000000', fontWeight: 700, marginTop: '5px' }}>10 real-world PPAP scenarios from automotive manufacturing. Learn from successes and failures.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(420px,1fr))', gap: '18px' }}>
              {[
                {
                  id: 1, icon: '🆕', tag: 'New Program Launch', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd',
                  title: 'Tata Nexon Platform — New Mounting Bracket (Tier 1 Supplier)',
                  situation: 'Supplier received a new program nomination for a safety-critical suspension bracket. Customer required Level 3 PPAP with full dimensional report, GR&R, and Cpk ≥ 1.67 for all 6 KPCs.',
                  challenge: 'Tool delivery delayed by 8 weeks. PPAP deadline was fixed by SOP (Start of Production) date. MSA results showed GR&R = 24% for a critical bore diameter gauge.',
                  action: 'Quality team sourced temporary tooling for trial run. Gauge was re-calibrated and fixture redesigned — GR&R improved to 8.4%. Corrective action closed before PPAP submission.',
                  result: 'Full PPAP approval received 3 days ahead of deadline. Zero rejections during safe launch. Recognized as best-in-class supplier for the platform.',
                  lessons: ['Never start trial run without production-intent tooling', 'MSA must be done before dimensional report — not after', 'Gate review before submission catches escapes early'],
                },
                {
                  id: 2, icon: '🔧', tag: 'Engineering Change', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',
                  title: 'Mahindra XUV — Engine Bracket Design Change (Wall thickness +0.5mm)',
                  situation: 'Customer issued an ECN to increase wall thickness from 4.0 mm to 4.5 mm on a cast aluminum bracket. Supplier assumed this was a minor change and shipped without re-PPAP.',
                  challenge: 'Customer SQE discovered during layered process audit that PPAP was not re-submitted. Shipments were placed on hold. Production line stopped for 6 hours.',
                  action: 'Emergency PPAP submitted within 48 hours. Interim approval granted. Full PPAP completed with new Cpk data (wall thickness Cpk = 1.84). Root cause: no change management process for customer ECNs.',
                  result: 'Full approval received. Supplier implemented ECN-to-PPAP trigger process. All future ECNs screened through Quality Head before production.',
                  lessons: ['ANY design change = evaluate for re-PPAP requirement', 'IATF 8.3.6 requires change notification — never assume minor', 'Ship without PPAP approval = customer line stoppage risk'],
                },
                {
                  id: 3, icon: '🏭', tag: 'Tool Transfer', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
                  title: 'Maruti Suzuki — Transfer of Tooling from Plant A to Plant B',
                  situation: 'A high-volume plastic component was being transferred from a supplier plant in Pune to a new plant in Rajasthan to reduce logistics cost. Tool weight 8 tonnes. Customer required Level 3 PPAP from new location.',
                  challenge: 'New plant did not have A2LA/NABL certified lab. Operator skill matrix showed 60% of required competencies missing. Machine capability study showed Cpk = 1.21 (below 1.67 target).',
                  action: 'Sourced NABL-certified external lab for material testing. Conducted 3-day operator training with OJT certification. Machine maintenance + mold rework improved Cpk to 1.78.',
                  result: 'PPAP approved. Full volume shipments began 3 weeks after tool transfer. Zero customer complaints in first 6 months.',
                  lessons: ['Tool transfer = full PPAP, even if design unchanged', 'Lab certification is non-negotiable for Level 3+', 'Operator competency is a PPAP requirement (Elem 10 context)'],
                },
                {
                  id: 4, icon: '⚠️', tag: 'PPAP Rejection', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
                  title: 'Ford Supplier — PPAP Rejected at Customer Audit (Dimensional Non-conformance)',
                  situation: 'PPAP submitted for a fuel bracket. Customer SQE found 4 dimensions out of tolerance during incoming audit at Ford. PPAP was rejected (status: Rejected).',
                  challenge: 'Supplier had only inspected a sample of 5 pieces. Balloon drawing was incomplete — 12 dimensions not reported. Root cause traced to calibrated CMM with expired calibration certificate.',
                  action: '8D initiated. CMM re-calibrated. 100% inspection performed on all 300 trial pieces. Full dimensional report with all 62 dimensions documented. New PPAP package submitted with photos of measurement.',
                  result: 'Second submission approved. Customer required corrective action evidence for calibration management process. Supplier implemented calibration alert system.',
                  lessons: ['ALL dimensions on the balloon drawing must be measured — no shortcuts', 'CMM calibration certificate must be valid on the day of measurement', 'PPAP rejection = 8D mandatory, not just correction'],
                },
                {
                  id: 5, icon: '📦', tag: 'Bulk Commodity', color: '#0891b2', bg: '#ecfeff', border: '#67e8f9',
                  title: 'Honda Supplier — Raw Material (Steel Coil) Certification PPAP',
                  situation: 'Steel coil supplier required to submit PPAP for a new steel grade (JSC590) being introduced for a body panel application. First-time PPAP for a raw material supplier.',
                  challenge: 'Supplier unsure which PPAP elements apply to raw material. No process flow or PFMEA existed. Mill test reports were available but no SPC data for the new grade.',
                  action: 'Quality consultant mapped applicable elements: Material cert (Elem 11) + Lab scope + SPC for key properties (UTS, YS, elongation, BH2). Simplified PFD for melt→roll→coil process. Level 2 PPAP agreed with customer.',
                  result: 'Level 2 PPAP approved. Customer enrolled steel supplier in SQE development program. Monthly SPC data sharing initiated.',
                  lessons: ['Raw material suppliers also need PPAP — just tailored scope', 'Negotiate Level 1 or 2 for commodity materials to reduce burden', 'Mill certificate + SPC for key properties = core of raw mat PPAP'],
                },
                {
                  id: 6, icon: '🔁', tag: 'Re-PPAP — Process Change', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
                  title: 'Toyota Supplier — Re-PPAP After New Mold Cavity Added',
                  situation: 'Supplier added a 4th cavity to an existing 3-cavity mold to meet volume increase. Customer was not informed. Parts from cavity 4 were mixed with approved parts.',
                  challenge: 'Toyota SQE detected dimensional variation during incoming SPC tracking. Parts from new cavity had 0.3mm shift on a critical hole location. Production line stopped.',
                  action: 'Emergency notification sent to customer. Cavity 4 immediately segregated. Re-PPAP submitted for all 4 cavities. Dimensional data per cavity submitted. New Control Plan updated.',
                  result: 'Interim approval on 3 original cavities, full approval after 30 days for all 4. Customer issued supplier warning letter. Supplier introduced "change notification" to customer form.',
                  lessons: ['New cavity = process change = mandatory re-PPAP (notify customer first)', 'Always identify which cavity each part came from during trial run', 'Toyota CS requires pre-notification of ANY process change'],
                },
                {
                  id: 7, icon: '🌍', tag: 'Localization PPAP', color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc',
                  title: 'Hyundai India — Import Substitution PPAP (Localized Component)',
                  situation: 'An imported Korean rubber seal was to be localized to an Indian supplier. Hyundai required Level 3 PPAP with full material equivalence testing vs. Korean part.',
                  challenge: 'Indian supplier had no DVP&R experience. Material testing required rubber tensile, compression set, and aging tests — no in-house lab capability. Drawing had 45 Korean-language tolerances.',
                  action: 'Quality head arranged translated drawing with authorized conversion. Outsourced rubber tests to NABL lab. DVP&R created in coordination with Hyundai R&D. Korean benchmark parts shared for comparison.',
                  result: 'PPAP approved after 2 iterations (heat aging test failed first time — compound adjusted). 100% import substitution achieved. ₹2.4 Cr/year savings.',
                  lessons: ['Import substitution = most complex PPAP — allow 6–9 months', 'DVP&R must compare local part with benchmark import part', 'Never localize safety/critical parts without customer R&D buy-in'],
                },
                {
                  id: 8, icon: '🚗', tag: 'Safe Launch Issue', color: '#be123c', bg: '#fff1f2', border: '#fda4af',
                  title: 'Stellantis Supplier — Field Return During Safe Launch (Paint Adhesion Failure)',
                  situation: 'A plastic interior panel passed PPAP. Within 2 weeks of SOP, 18 vehicles returned from the field with paint delamination on the panel.',
                  challenge: 'PPAP had passed adhesion test in lab conditions. Field failures occurred in high-humidity, high-temperature environments. Root cause: surface contamination from mold release agent not controlled in Control Plan.',
                  action: '8D: immediate containment — 100% inspection for surface contamination. Corrective action: mold release agent type changed, cleaning step added, Control Plan updated with adhesion spot check. Re-PPAP required by customer.',
                  result: 'Re-PPAP approved after 45 days. Safe launch extended to 6 months. Customer required FMEA update to add "contamination" as a new failure mode.',
                  lessons: ['Lab test pass ≠ field pass — design DVP&R for worst-case conditions', 'Control Plan must control process inputs, not just measure outputs', 'Safe launch failures trigger re-PPAP — budget for this in your program plan'],
                },
                {
                  id: 9, icon: '📊', tag: 'SPC / Cpk Issue', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4',
                  title: 'Bosch Supplier — Cpk = 1.08 on Critical Thread Diameter at PPAP',
                  situation: 'A screw-machine part for a Bosch fuel injection component had a critical thread diameter with Cpk = 1.08 (minimum required: 1.67). PPAP could not be submitted.',
                  challenge: 'Root cause analysis showed machine spindle runout was contributing 40% of variation. Tool wear pattern not addressed in control plan. Operator adjusting too frequently (over-control).',
                  action: 'Spindle bearing replaced. Statistical process control training for operators — control chart interpretation taught. Machine setting documented. After 300 additional pieces: Cpk = 1.81.',
                  result: 'PPAP approved. Bosch enrolled supplier in SPC development program. Monthly Cpk reporting agreed as ongoing requirement.',
                  lessons: ['Cpk below target = do not submit — fix first', 'Over-adjustment by operators always increases variation', 'Spindle/bearing condition directly impacts dimensional Cpk'],
                },
                {
                  id: 10, icon: '💰', tag: 'Cost of PPAP Failure', color: '#78350f', bg: '#fefce8', border: '#fde68a',
                  title: 'OEM Line Stop — Missing PPAP Element (Lab Report) Cost $380,000',
                  situation: 'Supplier received interim approval from customer. During quarterly PPAP audit, customer SQE found that Element 11 (Material Certs) had an expired lab scope (lab had lost NABL accreditation).',
                  challenge: 'Shipments immediately held. OEM line stop for 4.5 hours. 800 vehicles delayed. Customer issued chargeback of $380,000 for line stop + sorting cost.',
                  action: 'Emergency material retesting at alternate NABL lab (48-hour turnaround). Lab scope issue escalated to supplier top management. New lab enrolled and qualified. PPAP re-submitted with valid certs.',
                  result: 'PPAP reinstated. Chargeback of $380,000 accepted by supplier. Process implemented: automated alert when lab cert expiry is within 60 days.',
                  lessons: ['Lab accreditation (NABL/A2LA) must be active at time of testing AND submission', 'PPAP records must be re-validated if lab loses accreditation', 'Cost of one PPAP failure = months of profit — treat as business risk'],
                },
              ].map(cs => (
                <div key={cs.id} style={{ background: '#fff', border: `1.5px solid ${cs.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ background: cs.bg, borderBottom: `1px solid ${cs.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{cs.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, background: cs.color, color: '#fff', padding: '2px 8px', borderRadius: '20px' }}>{cs.tag}</span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000',  marginTop: '4px', lineHeight: '1.35' }}>{cs.title}</div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: cs.color, background: '#fff', border: `1px solid ${cs.border}`, borderRadius: '8px', padding: '4px 10px' }}>#{cs.id}</span>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    {[
                      { label: '📋 Situation', text: cs.situation, labelColor: '#000000' },
                      { label: '⚠️ Challenge', text: cs.challenge, labelColor: '#dc2626' },
                      { label: '🔧 Action Taken', text: cs.action, labelColor: '#059669' },
                      { label: '✅ Result', text: cs.result, labelColor: '#2563eb' },
                    ].map(section => (
                      <div key={section.label} style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: section.labelColor, marginBottom: '3px' }}>{section.label}</div>
                        <div style={{ fontSize: '12px', color: '#111827', lineHeight: '1.6' }}>{section.text}</div>
                      </div>
                    ))}
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginTop: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#14532d',  marginBottom: '5px' }}>💡 Lessons Learned</div>
                      {cs.lessons.map((l, i) => (
                        <div key={i} style={{ fontSize: '12px', color: '#14532d', fontWeight: 700, marginBottom: '3px' }}>• {l}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- TRAINING ACADEMY TAB --------------------------------------------- */}
      {mainTab === 'training' && (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 40px' }}>
          <div style={{ margin: '0 auto' }}>

            {/* -- Download Strip ----------------- */}
            <div style={{background:"#f1f5f9",border:"1px solid #334155",borderRadius:"12px",padding:"14px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:"700",marginRight:"8px"}}>📥 Training Downloads:</span>
              <a href="/downloads/ppap/PPAP_Audit_Checklist.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#065f46",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                ✔ PPAP Audit Checklist
              </a>
              <a href="/downloads/ppap/PPAP_Submission_Level_Guide.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#7c2d12",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                🗂 Submission Level Guide
              </a>
              <a href="/downloads/ppap/PPAP_18_Element_Checklist.xlsx" download
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                ✅ 18 Element Checklist
              </a>
              <a href="/downloads/ppap/AIAG_PPAP_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:"700",textDecoration:"none"}}>
                📖 AIAG PPAP 4th Edition
              </a>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#000000', margin: 0 }}>🎓 PPAP Training Academy</h2>
              <p style={{ fontSize: '13px', color: '#000000', fontWeight: 700, marginTop: '5px' }}>Interview preparation, quiz, key concepts, and curated learning resources</p>
            </div>

            {/* Competency Matrix */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '22px 28px', marginBottom: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#000000',  marginBottom: '16px' }}>🎯 PPAP Competency Levels</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#1e2a5a' }}>
                      {['Competency Area', 'Level 1 — Awareness', 'Level 2 — Practitioner', 'Level 3 — Expert'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#f1f5f9', fontWeight: 700, whiteSpace: 'nowrap', fontSize: '12px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['PPAP Purpose & Scope', 'Knows what PPAP is and why it exists', 'Can explain all 18 elements and submission levels', 'Can design PPAP system for new programs from scratch'],
                      ['18 Elements', 'Can name the 18 elements', 'Can complete each element for a given part', 'Can review and approve PPAP packages'],
                      ['PSW', 'Knows PSW is Part Submission Warrant', 'Can complete and sign PSW', 'Can manage interim approval and rejection scenarios'],
                      ['MSA for PPAP', 'Knows GR&R is required', 'Can perform GR&R and interpret results', 'Can design MSA plan, resolve failures, sign off'],
                      ['SPC/Cpk', 'Knows Cpk target is 1.67', 'Can run SPC, calculate Cpk, plot control chart', 'Can diagnose low Cpk root causes, drive improvement'],
                      ['PPAP Submission', 'Knows PPAP goes to customer', 'Can compile and submit a PPAP package', 'Can manage customer portal submissions, respond to queries'],
                      ['Problem Solving', 'Knows 8D exists', 'Can initiate 8D on PPAP rejection', 'Can lead cross-functional 8D, verify effectiveness'],
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: '10px 14px', color: '#000000', fontWeight: 700, fontSize: '12px' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interview Q&A */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '22px 28px', marginBottom: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#000000',  marginBottom: '16px' }}>💬 PPAP Interview Questions & Expert Answers</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(480px,1fr))', gap: '14px' }}>
                {[
                  {
                    q: 'What is PPAP and why is it important?',
                    a: 'PPAP (Production Part Approval Process) is an AIAG standard that ensures a supplier\'s manufacturing process can consistently produce product that meets customer engineering requirements. It\'s the final gate before a supplier can ship production parts. Without PPAP approval, a supplier cannot legally ship product — it\'s the customer\'s authorization that says "your process is validated."',
                    level: 'Basic'
                  },
                  {
                    q: 'What are the 5 PPAP submission levels? When do you use each?',
                    a: 'Level 1: PSW only (retained at supplier). Level 2: PSW + limited supporting documents. Level 3: PSW + complete supporting documents (default/standard for most OEMs). Level 4: PSW + requirements defined by customer. Level 5: PSW + all documents + samples reviewed at supplier site. Use Level 3 for all new parts unless the customer specifies otherwise.',
                    level: 'Basic'
                  },
                  {
                    q: 'When is re-PPAP required?',
                    a: '12 situations trigger re-PPAP: new part/new program, engineering change (product), correction of discrepancy, tooling inactive >12 months, tooling moved/transferred, change in production source, change in process, new sub-supplier, material change (formulation, source), change in part appearance, correction after previous rejection, and customer request. Always notify customer BEFORE making any change.',
                    level: 'Intermediate'
                  },
                  {
                    q: 'What is a PSW? Who signs it?',
                    a: 'The Part Submission Warrant (PSW) is Element 18 and the primary PPAP deliverable. It summarizes the submission and declares that the supplier has met all requirements. It must be signed by an Authorized Quality Representative — typically the Quality Head or designated Quality Engineer. The PSW certifies that all required elements are complete, drawings are followed, and the part meets specifications.',
                    level: 'Basic'
                  },
                  {
                    q: 'What Cpk is required for PPAP? What if you can\'t achieve it?',
                    a: 'AIAG PPAP 4th Edition requires Cpk ≥ 1.67 for Special Characteristics (KPC/SC/CC) and Cpk ≥ 1.33 for all other characteristics. If Cpk < 1.67, you cannot submit PPAP without customer concession. Options: (1) Improve the process and rerun trial; (2) Request interim approval with a containment plan and timeline; (3) Renegotiate the tolerance (design change / ECN) with customer approval.',
                    level: 'Intermediate'
                  },
                  {
                    q: 'What GR&R acceptance criteria apply for PPAP gauges?',
                    a: 'AIAG MSA 4th Edition: GR&R < 10% = Acceptable (green). 10–30% = Marginal (may be acceptable with customer permission based on application). > 30% = Unacceptable — gauge cannot be used for PPAP measurements. For GR&R%, use: EV = Equipment Variation (repeatability), AV = Appraiser Variation (reproducibility), GR&R = √(EV² + AV²), expressed as % of Tolerance (study variation relative to tolerance).',
                    level: 'Advanced'
                  },
                  {
                    q: 'A customer has rejected your PPAP. What do you do?',
                    a: 'Step 1: Acknowledge the rejection and understand the specific reason (dimensional? MSA? missing element?). Step 2: Initiate 8D — identify root cause of PPAP failure. Step 3: Implement correction for the specific element that failed. Step 4: Verify the correction (re-measure, retest). Step 5: Recompile affected PPAP elements. Step 6: Submit revised PPAP with cover letter explaining what changed and why. Step 7: Do not ship without new approval.',
                    level: 'Intermediate'
                  },
                  {
                    q: 'What is the difference between PPAP and APQP?',
                    a: 'APQP (Advanced Product Quality Planning) is the PROCESS of planning and developing quality — it runs throughout the program from RFQ to SOP across 5 phases. PPAP is the OUTPUT of APQP Phase 4 — it is the collection of evidence that proves the APQP process worked. Think of APQP as the journey and PPAP as the passport stamp at the border — you need the journey to get the stamp.',
                    level: 'Intermediate'
                  },
                  {
                    q: 'What is interim PPAP approval? Can you ship with it?',
                    a: 'Interim approval is a temporary authorization from the customer allowing limited shipment when the PPAP cannot yet receive full approval. It has an expiry date and conditions (e.g., Cpk must reach 1.67 within 90 days, 100% inspection during interim period). YES, you can ship — but only under the exact conditions the customer has specified. You must continue working toward full approval and must not exceed the interim approval expiry.',
                    level: 'Advanced'
                  },
                  {
                    q: 'How many pieces are required for the PPAP production trial run?',
                    a: 'AIAG PPAP 4th Edition requires a minimum of 300 consecutive pieces from the production run. These must be from production tooling, production machines, production personnel, production environment, and production rates. The purpose is to demonstrate that the process is stable and capable under real production conditions, not lab or prototype conditions.',
                    level: 'Basic'
                  },
                ].map((qa, i) => (
                  <div key={i} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: qa.level === 'Basic' ? '#eff6ff' : qa.level === 'Intermediate' ? '#fffbeb' : '#fef2f2', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#000000',  lineHeight: '1.4' }}>Q: {qa.q}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', flexShrink: 0,
                        background: qa.level === 'Basic' ? '#2563eb' : qa.level === 'Intermediate' ? '#d97706' : '#dc2626', color: '#fff' }}>
                        {qa.level}
                      </span>
                    </div>
                    <div style={{ padding: '12px 16px', background: '#fff' }}>
                      <div style={{ fontSize: '12px', color: '#000000', fontWeight: 700, lineHeight: '1.7' }}>
                        <strong style={{ color: '#059669' }}>A: </strong>{qa.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* YouTube Resources */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '22px 28px', marginBottom: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#000000',  marginBottom: '16px' }}>📺 PPAP Training Videos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '12px' }}>
                {[
                  { title: 'PPAP Full Course — All 18 Elements Explained', channel: 'QMB Training', url: 'https://www.youtube.com/@qmbtraining', duration: '1h 24min', level: 'Complete' },
                  { title: 'PPAP Level 3 Submission — Step by Step', channel: 'QualityWise', url: 'https://www.youtube.com/channel/UC7MfSAkpOG6RRkKeeH4Rm7A', duration: '42min', level: 'Practical' },
                  { title: 'Part Submission Warrant (PSW) — How to Fill', channel: 'AIAG Official', url: 'https://www.aiag.org', duration: '28min', level: 'Basic' },
                  { title: 'PPAP vs APQP — Key Differences', channel: 'Quality HUB India', url: 'https://www.youtube.com/channel/UCfJX5RUcJgYB9u1-VBjnYqg', duration: '22min', level: 'Concept' },
                  { title: 'GR&R for PPAP — Full MSA Tutorial', channel: 'QMB Training', url: 'https://www.youtube.com/@qmbtraining', duration: '56min', level: 'Advanced' },
                  { title: 'Cpk Calculation and SPC for PPAP', channel: 'Six Sigma Study Guide', url: 'https://sixsigmastudyguide.com', duration: '35min', level: 'Advanced' },
                  { title: 'PFMEA to Control Plan — PPAP Link', channel: 'QualityWise', url: 'https://www.youtube.com/channel/UC7MfSAkpOG6RRkKeeH4Rm7A', duration: '48min', level: 'Intermediate' },
                  { title: 'PPAP Common Mistakes — Customer Audit Tips', channel: 'Quality HUB India', url: 'https://www.youtube.com/channel/UCfJX5RUcJgYB9u1-VBjnYqg', duration: '30min', level: 'Audit' },
                ].map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', background: '#fafafa', transition: 'border-color 0.2s' }}>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>▶️</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000',  lineHeight: '1.4', marginBottom: '4px' }}>{v.title}</div>
                      <div style={{ fontSize: '11px', color: '#111827' }}>{v.channel} · {v.duration}</div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb', display: 'inline-block', marginTop: '4px' }}>{v.level}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Reference Websites */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '22px 28px', marginBottom: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#000000',  marginBottom: '14px' }}>🌐 PPAP Reference Websites</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '10px' }}>
                {[
                  { name: 'AIAG Official', url: 'https://www.aiag.org', desc: 'Official PPAP 4th Edition standard publisher. Purchase the standard here.' },
                  { name: 'Quality-One PPAP Guide', url: 'https://quality-one.com/ppap', desc: 'Comprehensive PPAP reference with all elements explained' },
                  { name: 'ASQ PPAP Resources', url: 'https://asq.org', desc: 'Quality body with PPAP articles and case studies' },
                  { name: 'IATF 16949 Portal', url: 'https://www.iatfglobaloversight.org', desc: 'Official IATF portal — clause 8.3.4, 8.6.1 PPAP requirements' },
                  { name: 'Six Sigma Study Guide', url: 'https://sixsigmastudyguide.com', desc: 'Cpk, MSA, SPC reference for PPAP capability studies' },
                  { name: 'iSixSigma PPAP', url: 'https://www.isixsigma.com', desc: 'Practical PPAP articles and community Q&A' },
                ].map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', background: '#fafafa' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>🔗 {s.name}</div>
                    <div style={{ fontSize: '11px', color: '#111827', lineHeight: '1.5' }}>{s.desc}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Reference Card */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e2a5a)', borderRadius: '16px', padding: '24px 28px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>📌 PPAP Quick Reference Card</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '14px' }}>
                {[
                  { title: '18 Elements (Key)', items: ['1. Design Records', '4. PFMEA', '7. Control Plan', '8. Dimensional Results', '9. MSA (GR&R)', '10. SPC / Cpk', '11. Lab Reports', '18. PSW (Primary)'] },
                  { title: 'Cpk Requirements', items: ['Special Chars: Cpk ≥ 1.67', 'Regular Chars: Cpk ≥ 1.33', 'GR&R: < 10% (ideal)', 'GR&R: < 30% (marginal)', 'Trial Run: min 300 pcs', 'All from prod tooling'] },
                  { title: '12 Re-PPAP Reasons', items: ['New part or program', 'Design/engineering change', 'Tool inactive > 12 months', 'Tool moved to new plant', 'New production source', 'Material or sub-supplier change', 'Process method change', 'Customer request'] },
                  { title: 'Key Acronyms', items: ['PSW = Part Submission Warrant', 'PPAP = Prod Part Approval Process', 'MSA = Measurement System Analysis', 'SPC = Statistical Process Control', 'SC/CC/KPC = Special Chars', 'AAR = Appearance Approval', 'DVP&R = Design Verification Plan', 'PFD = Process Flow Diagram'] },
                ].map((col, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.title}</div>
                    {col.items.map((item, j) => (
                      <div key={j} style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#6366f1', flexShrink: 0 }}>•</span>
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
      </>
  );
}
