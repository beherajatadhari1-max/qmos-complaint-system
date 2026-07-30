'use client';
import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type AuditType    = 'QMS System' | 'Process' | 'Product' | 'Supplier' | 'Customer';
type AuditStatus  = 'planned' | 'in-progress' | 'completed' | 'overdue';
type FindingType  = 'major-nc' | 'minor-nc' | 'ofi' | 'positive';
type FindingStatus = 'open' | 'capa-raised' | 'closed' | 'overdue';

interface Finding {
  id: string;
  clause: string;
  process: string;
  type: FindingType;
  description: string;
  evidence: string;
  status: FindingStatus;
  owner: string;
  targetDate: string;
  closureDate: string;
}

interface Audit {
  id: string;
  title: string;
  type: AuditType;
  scope: string;
  auditor: string;
  auditee: string;
  plannedDate: string;
  actualDate: string;
  status: AuditStatus;
  findings: Finding[];
  notes: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const AUDIT_TYPE_COLORS: Record<AuditType, string> = {
  'QMS System': 'bg-blue-800 text-blue-200',
  'Process':    'bg-purple-800 text-purple-200',
  'Product':    'bg-cyan-800 text-cyan-200',
  'Supplier':   'bg-amber-800 text-amber-200',
  'Customer':   'bg-pink-800 text-pink-200',
};

const STATUS_COLORS: Record<AuditStatus, string> = {
  'planned':     'bg-gray-700 text-gray-300',
  'in-progress': 'bg-blue-800 text-blue-200',
  'completed':   'bg-green-800 text-green-200',
  'overdue':     'bg-red-800 text-red-300',
};
const STATUS_LABELS: Record<AuditStatus, string> = {
  'planned':     '📅 Planned',
  'in-progress': '🔄 In Progress',
  'completed':   '✅ Completed',
  'overdue':     '⚠️ Overdue',
};

const FINDING_COLORS: Record<FindingType, string> = {
  'major-nc': 'bg-red-800/60 text-red-300',
  'minor-nc': 'bg-amber-800/60 text-amber-300',
  'ofi':      'bg-blue-800/60 text-blue-300',
  'positive': 'bg-green-800/60 text-green-300',
};
const FINDING_LABELS: Record<FindingType, string> = {
  'major-nc': '🔴 Major NC',
  'minor-nc': '🟡 Minor NC',
  'ofi':      '🔵 OFI',
  'positive': '🟢 Positive',
};
const FINDING_STATUS_COLORS: Record<FindingStatus, string> = {
  'open':        'text-red-400',
  'capa-raised': 'text-amber-400',
  'closed':      'text-green-400',
  'overdue':     'text-red-500',
};

const IATF_CLAUSES = [
  '4.1 Context','4.2 Interested Parties','4.3 QMS Scope','4.4 Processes',
  '5.1 Leadership','5.2 Quality Policy','5.3 Roles & Responsibilities',
  '6.1 Risks & Opportunities','6.2 Quality Objectives','6.3 Change Management',
  '7.1 Resources','7.1.5 MSA','7.2 Competence','7.3 Awareness','7.4 Communication','7.5 Documented Information',
  '8.1 Operational Planning','8.3 APQP / Design','8.3.4 PPAP','8.4 Supplier Control',
  '8.5.1 Control Plan','8.5.2 Identification','8.5.6 Change Control','8.6 Release','8.7 Nonconforming Output',
  '9.1 Monitoring','9.1.1 SPC','9.2 Internal Audit','9.3 Management Review',
  '10.2 Corrective Action','10.3 Continual Improvement',
  'VDA 6.3 P2 Project Mgmt','VDA 6.3 P3 Planning','VDA 6.3 P4 Supplier','VDA 6.3 P5 Production','VDA 6.3 P6 Customer',
];

const PROCESSES = [
  'Customer Quality','Incoming Quality','In-Process Quality','Outgoing Quality',
  'Supplier Quality','APQP/NPD','PPAP','Document Control','Calibration','Training & Competence',
  'Nonconforming Material','CAPA','Internal Audit','Management Review',
  'Stamping','Welding','Painting','Assembly','Machining','Casting',
];

function mkFinding(id: string, clause: string, process: string, type: FindingType, desc: string, evidence: string, status: FindingStatus, owner: string, target: string, closure: string): Finding {
  return { id, clause, process, type, description: desc, evidence, status, owner, targetDate: target, closureDate: closure };
}

const SAMPLE_AUDITS: Audit[] = [
  {
    id: 'A001', title: 'IATF 16949 QMS Quarterly Audit — Q2',
    type: 'QMS System', scope: 'Clauses 4–10 (all departments)',
    auditor: 'Rajesh Kumar (Lead Auditor)', auditee: 'All HODs',
    plannedDate: '2025-04-15', actualDate: '2025-04-16', status: 'completed',
    notes: 'Annual QMS audit covering all 30+ clauses. Conducted over 2 days.',
    findings: [
      mkFinding('F001','7.1.5 MSA','Incoming Quality','major-nc','GRR study not available for Vernier calliper used for CC dimension on BKT-A001','No GRR records found for gauge ID G-042. Gauge in use since 2024-01-01.','closed','Sunita Rao','2025-05-15','2025-05-10'),
      mkFinding('F002','7.2 Competence','Stamping','minor-nc','3 operators on stamping line not trained on revised Work Instruction WI-STM-007 Rev C','Training matrix shows WI-STM-007 Rev B training only. Rev C issued 2025-03-01.','closed','Priya Sharma','2025-05-01','2025-04-28'),
      mkFinding('F003','8.5.1 Control Plan','Assembly','ofi','Control Plan does not specify reaction plan for visual characteristic at Op-60','Reaction plan column blank for characteristic #14. All other characteristics have reaction plans.','capa-raised','Amit Verma','2025-05-30',''),
      mkFinding('F004','9.3 Management Review','QMS','minor-nc','Management review minutes do not include COPQ trend data as required by Cl. 9.3.2','Jan 2025 MRM minutes reviewed — no COPQ section present.','closed','Ravi Gupta','2025-05-15','2025-05-12'),
    ],
  },
  {
    id: 'A002', title: 'Process Audit — Welding Line (MIG)',
    type: 'Process', scope: 'MIG Welding — Op-20 to Op-35 (Bracket Assembly)',
    auditor: 'Priya Sharma', auditee: 'Welding Supervisor — D. Patil',
    plannedDate: '2025-05-20', actualDate: '2025-05-22', status: 'completed',
    notes: 'VDA 6.3 P5 process audit on MIG welding line.',
    findings: [
      mkFinding('F005','VDA 6.3 P5 Production','Welding','major-nc','Weld parameter log not maintained for last 3 days — WPS deviation not recorded','Weld log book checked — last entry 2025-05-19. Production continued 3 days without logs.','capa-raised','D. Patil','2025-06-20',''),
      mkFinding('F006','8.5.6 Change Control','Welding','minor-nc','Welding wire supplier changed from Esab to Lincoln without 4M change notification','Purchase record shows Lincoln wire purchased 2025-04-01. No 4M change form raised.','open','Ravi Gupta','2025-06-30',''),
    ],
  },
  {
    id: 'A003', title: 'Product Audit — Bracket Assembly BKT-A001',
    type: 'Product', scope: 'BKT-A001 Rev B — 10 pieces from FG store',
    auditor: 'Sunita Rao', auditee: 'Outgoing Quality — S. Mehta',
    plannedDate: '2025-06-10', actualDate: '2025-06-10', status: 'completed',
    notes: 'Monthly product audit per audit plan. 10 pcs measured against drawing.',
    findings: [
      mkFinding('F007','8.6 Release','Outgoing Quality','minor-nc','2 of 10 parts have hole diameter at lower specification limit (24.951 vs LSL 24.950)','CMM measurement report attached. Parts technically pass but indicate process drift.','open','Sunita Rao','2025-07-10',''),
      mkFinding('F008','8.5.2 Identification','FG Store','ofi','Part tags do not show revision level — only part number printed','Drawing shows Rev B. Tag shows BKT-A001 only. Recommend adding Rev to tag.','open','Store Manager','2025-07-15',''),
    ],
  },
  {
    id: 'A004', title: 'Supplier Audit — ABC Stampings Pvt. Ltd.',
    type: 'Supplier', scope: 'Stamping process — Part families ST-001 to ST-012',
    auditor: 'Amit Verma (SQE)', auditee: 'ABC Stampings — Quality Head',
    plannedDate: '2025-07-15', actualDate: '', status: 'planned',
    notes: 'Annual supplier audit. ABC is critical supplier — sole source for 8 part families.',
    findings: [],
  },
  {
    id: 'A005', title: 'In-Process Audit — Painting Line',
    type: 'Process', scope: 'Pre-treatment + Powder Coating — Op-40 to Op-55',
    auditor: 'Rajesh Kumar', auditee: 'Painting Supervisor',
    plannedDate: '2025-06-30', actualDate: '', status: 'overdue',
    notes: 'Overdue — auditor on leave. Rescheduled to 2025-07-20.',
    findings: [],
  },
];

const inp = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500';
const lbl = 'text-xs text-gray-400 block mb-1';

export default function AuditPage() {
  const [mainTab, setMainTab]     = useState<'tracker' | 'knowledge' | 'guide'>('tracker');
  const [audits, setAudits]       = useState<Audit[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewAudit, setShowNewAudit] = useState(false);
  const [showNewFinding, setShowNewFinding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New audit form
  const [newAudit, setNewAudit] = useState<Partial<Audit>>({ type: 'QMS System', status: 'planned', findings: [] });
  const setNA = (k: keyof Audit, v: string) => setNewAudit(p => ({ ...p, [k]: v }));

  // New finding form
  const [newFinding, setNewFinding] = useState<Partial<Finding>>({ type: 'minor-nc', status: 'open' });
  const setNF = (k: keyof Finding, v: string) => setNewFinding(p => ({ ...p, [k]: v }));

  const loadSample = () => { setAudits(SAMPLE_AUDITS); setExpandedId('A001'); };

  const addAudit = () => {
    if (!newAudit.title || !newAudit.plannedDate) return;
    const a: Audit = {
      id: `A${Date.now()}`, title: newAudit.title ?? '', type: newAudit.type as AuditType ?? 'QMS System',
      scope: newAudit.scope ?? '', auditor: newAudit.auditor ?? '', auditee: newAudit.auditee ?? '',
      plannedDate: newAudit.plannedDate ?? '', actualDate: '', status: 'planned', findings: [], notes: newAudit.notes ?? '',
    };
    setAudits(prev => [a, ...prev]);
    setNewAudit({ type: 'QMS System', status: 'planned', findings: [] });
    setShowNewAudit(false);
    setExpandedId(a.id);
  };

  const addFinding = () => {
    if (!selectedId || !newFinding.description) return;
    const f: Finding = {
      id: `F${Date.now()}`, clause: newFinding.clause ?? '', process: newFinding.process ?? '',
      type: newFinding.type as FindingType ?? 'minor-nc', description: newFinding.description ?? '',
      evidence: newFinding.evidence ?? '', status: 'open', owner: newFinding.owner ?? '',
      targetDate: newFinding.targetDate ?? '', closureDate: '',
    };
    setAudits(prev => prev.map(a => a.id === selectedId ? { ...a, findings: [...a.findings, f] } : a));
    setNewFinding({ type: 'minor-nc', status: 'open' });
    setShowNewFinding(false);
  };

  const updateFindingStatus = (auditId: string, findingId: string, status: FindingStatus) => {
    setAudits(prev => prev.map(a => a.id === auditId ? {
      ...a, findings: a.findings.map(f => f.id === findingId ? {
        ...f, status, closureDate: status === 'closed' ? new Date().toISOString().split('T')[0] : f.closureDate
      } : f)
    } : a));
  };

  const updateAuditStatus = (id: string, status: AuditStatus) =>
    setAudits(prev => prev.map(a => a.id === id ? { ...a, status } : a));

  // Stats
  const totalAudits     = audits.length;
  const completedAudits = audits.filter(a => a.status === 'completed').length;
  const overdueAudits   = audits.filter(a => a.status === 'overdue').length;
  const allFindings     = audits.flatMap(a => a.findings);
  const openFindings    = allFindings.filter(f => f.status === 'open' || f.status === 'overdue').length;
  const majorNCs        = allFindings.filter(f => f.type === 'major-nc').length;
  const closedFindings  = allFindings.filter(f => f.status === 'closed').length;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-950 via-green-950 to-slate-900 border-b border-emerald-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Audit Management</h1>
                <p className="text-emerald-300 text-xs mt-0.5">IATF 16949 Cl. 9.2 · QMS / Process / Product / Supplier Audits · Findings Register · CAPA Linkage</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-emerald-300">{completedAudits}/{totalAudits}</div>
                <div className="text-xs text-emerald-400">Audits Done</div>
              </div>
              {overdueAudits > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-300">{overdueAudits}</div>
                  <div className="text-xs text-red-400">Overdue</div>
                </div>
              )}
              {majorNCs > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-300">{majorNCs}</div>
                  <div className="text-xs text-red-400">Major NCs</div>
                </div>
              )}
              <div className="bg-amber-900/60 border border-amber-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-amber-300">{openFindings}</div>
                <div className="text-xs text-amber-400">Open Findings</div>
              </div>
              <button onClick={loadSample} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                🧪 Load Sample
              </button>
              <button onClick={() => setShowNewAudit(true)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-white/20">
                + New Audit
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-emerald-800/40">
            {([
              { id: 'tracker',   label: '✅ Audit Tracker' },
              { id: 'knowledge', label: '📚 Knowledge Hub' },
              { id: 'guide',     label: '📋 Auditor Guide' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                  mainTab === t.id ? 'bg-white/10 text-white border-b-2 border-emerald-400' : 'text-emerald-300 hover:text-white hover:bg-white/5'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TRACKER TAB */}
      {mainTab === 'tracker' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* New Audit Form */}
            {showNewAudit && (
              <div className="bg-gray-900 border border-emerald-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white">+ New Audit</h2>
                  <button onClick={() => setShowNewAudit(false)} className="text-gray-500 hover:text-white text-xs">✕ Cancel</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="md:col-span-2"><label className={lbl}>Audit Title</label><input className={inp} placeholder="e.g. QMS Quarterly Audit Q3" value={newAudit.title ?? ''} onChange={e => setNA('title', e.target.value)} /></div>
                  <div>
                    <label className={lbl}>Audit Type</label>
                    <select className={inp} value={newAudit.type} onChange={e => setNA('type', e.target.value)}>
                      {(['QMS System','Process','Product','Supplier','Customer'] as AuditType[]).map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Planned Date</label><input type="date" className={inp} value={newAudit.plannedDate ?? ''} onChange={e => setNA('plannedDate', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="md:col-span-2"><label className={lbl}>Scope</label><input className={inp} placeholder="e.g. Clause 7–9 / Welding Line" value={newAudit.scope ?? ''} onChange={e => setNA('scope', e.target.value)} /></div>
                  <div><label className={lbl}>Lead Auditor</label><input className={inp} placeholder="Auditor name" value={newAudit.auditor ?? ''} onChange={e => setNA('auditor', e.target.value)} /></div>
                  <div><label className={lbl}>Auditee / Area</label><input className={inp} placeholder="HOD / Department" value={newAudit.auditee ?? ''} onChange={e => setNA('auditee', e.target.value)} /></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1"><label className={lbl}>Notes</label><input className={inp} placeholder="Audit notes / objective" value={newAudit.notes ?? ''} onChange={e => setNA('notes', e.target.value)} /></div>
                  <div className="flex items-end">
                    <button onClick={addAudit} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-6 py-2 rounded-xl transition-colors">Add Audit</button>
                  </div>
                </div>
              </div>
            )}

            {/* Audit List */}
            {audits.length === 0 && (
              <div className="bg-gray-900 border border-gray-700 border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-400 text-sm">No audits yet. Click <span className="text-emerald-400">🧪 Load Sample</span> to see a full example, or <span className="text-emerald-400">+ New Audit</span> to create one.</p>
              </div>
            )}

            {audits.map(audit => {
              const isExpanded = expandedId === audit.id;
              const majorCount  = audit.findings.filter(f => f.type === 'major-nc').length;
              const minorCount  = audit.findings.filter(f => f.type === 'minor-nc').length;
              const ofiCount    = audit.findings.filter(f => f.type === 'ofi').length;
              const openCount   = audit.findings.filter(f => f.status === 'open' || f.status === 'overdue').length;
              return (
                <div key={audit.id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${audit.status === 'overdue' ? 'border-red-700/50' : audit.status === 'completed' ? 'border-green-800/30' : 'border-gray-700'}`}>
                  {/* Audit Header */}
                  <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : audit.id)}>
                    <span className="text-xl flex-shrink-0">{audit.type === 'QMS System' ? '🏛️' : audit.type === 'Process' ? '⚙️' : audit.type === 'Product' ? '📦' : audit.type === 'Supplier' ? '🏭' : '👥'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-sm">{audit.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${AUDIT_TYPE_COLORS[audit.type]}`}>{audit.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[audit.status]}`}>{STATUS_LABELS[audit.status]}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span>🗓 {audit.plannedDate || '—'}</span>
                        <span>👤 {audit.auditor || '—'}</span>
                        <span>🎯 {audit.scope || '—'}</span>
                        {audit.findings.length > 0 && (
                          <span>
                            {majorCount > 0 && <span className="text-red-400 font-bold mr-1">{majorCount} Major</span>}
                            {minorCount > 0 && <span className="text-amber-400 font-bold mr-1">{minorCount} Minor</span>}
                            {ofiCount > 0 && <span className="text-blue-400 mr-1">{ofiCount} OFI</span>}
                            {openCount > 0 && <span className="text-red-400">({openCount} open)</span>}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-white focus:outline-none" value={audit.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateAuditStatus(audit.id, e.target.value as AuditStatus); }}>
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      <span className="text-gray-500 text-sm">{isExpanded ? '▾' : '▸'}</span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 px-5 py-4">
                      {/* Audit Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                        {[
                          ['Audit ID', audit.id],
                          ['Audit Type', audit.type],
                          ['Lead Auditor', audit.auditor || '—'],
                          ['Auditee', audit.auditee || '—'],
                          ['Planned Date', audit.plannedDate || '—'],
                          ['Actual Date', audit.actualDate || 'Not yet conducted'],
                          ['Scope', audit.scope || '—'],
                          ['Status', STATUS_LABELS[audit.status]],
                        ].map(([l, v]) => (
                          <div key={l} className="bg-gray-800 rounded-lg px-3 py-2">
                            <div className="text-gray-500">{l}</div>
                            <div className="text-white font-semibold mt-0.5">{v}</div>
                          </div>
                        ))}
                      </div>
                      {audit.notes && <p className="text-xs text-gray-500 bg-gray-800/40 rounded-lg px-3 py-2 mb-4">{audit.notes}</p>}

                      {/* Findings */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-white">Findings ({audit.findings.length})</h4>
                        <button onClick={() => { setSelectedId(audit.id); setShowNewFinding(true); }}
                          className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                          + Add Finding
                        </button>
                      </div>

                      {/* New Finding Form */}
                      {showNewFinding && selectedId === audit.id && (
                        <div className="bg-gray-800 border border-emerald-700/40 rounded-xl p-4 mb-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className={lbl}>Finding Type</label>
                              <select className={inp} value={newFinding.type} onChange={e => setNF('type', e.target.value)}>
                                <option value="major-nc">Major NC</option>
                                <option value="minor-nc">Minor NC</option>
                                <option value="ofi">OFI</option>
                                <option value="positive">Positive Finding</option>
                              </select>
                            </div>
                            <div>
                              <label className={lbl}>Clause / Standard</label>
                              <select className={inp} value={newFinding.clause ?? ''} onChange={e => setNF('clause', e.target.value)}>
                                <option value="">Select clause...</option>
                                {IATF_CLAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={lbl}>Process / Area</label>
                              <select className={inp} value={newFinding.process ?? ''} onChange={e => setNF('process', e.target.value)}>
                                <option value="">Select process...</option>
                                {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={lbl}>Responsible Owner</label>
                              <input className={inp} placeholder="Name / HOD" value={newFinding.owner ?? ''} onChange={e => setNF('owner', e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className={lbl}>Finding Description</label>
                              <textarea className={inp + ' resize-none'} rows={2} placeholder="Describe the nonconformity or observation..." value={newFinding.description ?? ''} onChange={e => setNF('description', e.target.value)} />
                            </div>
                            <div>
                              <label className={lbl}>Objective Evidence</label>
                              <textarea className={inp + ' resize-none'} rows={2} placeholder="Evidence observed during audit..." value={newFinding.evidence ?? ''} onChange={e => setNF('evidence', e.target.value)} />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div><label className={lbl}>Target Close Date</label><input type="date" className={inp} value={newFinding.targetDate ?? ''} onChange={e => setNF('targetDate', e.target.value)} /></div>
                            <div className="flex items-end gap-2 mt-4">
                              <button onClick={addFinding} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg">Add Finding</button>
                              <button onClick={() => setShowNewFinding(false)} className="text-gray-500 hover:text-white text-xs px-3 py-2">Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {audit.findings.length === 0 && (
                        <div className="text-center py-6 text-gray-600 text-xs bg-gray-800/30 rounded-xl">No findings recorded for this audit.</div>
                      )}

                      {audit.findings.length > 0 && (
                        <div className="space-y-2">
                          {audit.findings.map(f => (
                            <div key={f.id} className={`bg-gray-800 rounded-xl p-3 border-l-4 ${f.type === 'major-nc' ? 'border-red-500' : f.type === 'minor-nc' ? 'border-amber-500' : f.type === 'ofi' ? 'border-blue-500' : 'border-green-500'}`}>
                              <div className="flex items-start gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 mt-0.5 ${FINDING_COLORS[f.type]}`}>{FINDING_LABELS[f.type]}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap gap-2 mb-1">
                                    {f.clause && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{f.clause}</span>}
                                    {f.process && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{f.process}</span>}
                                  </div>
                                  <p className="text-white text-xs font-medium mb-1">{f.description}</p>
                                  {f.evidence && <p className="text-gray-500 text-xs mb-1">Evidence: {f.evidence}</p>}
                                  <div className="flex flex-wrap gap-3 text-xs">
                                    {f.owner && <span className="text-gray-500">Owner: <span className="text-gray-300">{f.owner}</span></span>}
                                    {f.targetDate && <span className="text-gray-500">Target: <span className="text-gray-300">{f.targetDate}</span></span>}
                                    {f.closureDate && <span className="text-gray-500">Closed: <span className="text-green-400">{f.closureDate}</span></span>}
                                  </div>
                                </div>
                                <select
                                  className={`text-xs bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 focus:outline-none flex-shrink-0 ${FINDING_STATUS_COLORS[f.status]}`}
                                  value={f.status}
                                  onChange={e => updateFindingStatus(audit.id, f.id, e.target.value as FindingStatus)}>
                                  <option value="open">Open</option>
                                  <option value="capa-raised">CAPA Raised</option>
                                  <option value="closed">Closed</option>
                                  <option value="overdue">Overdue</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* KNOWLEDGE HUB TAB */}
      {mainTab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-gray-900 border border-emerald-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">✅ What is IATF Internal Audit?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Internal audit is the organisation's self-assessment mechanism to verify that the Quality Management System is effectively implemented and maintained. Under IATF 16949 Cl. 9.2, three distinct audit types are mandatory: QMS system audits, manufacturing process audits, and product audits. Each serves a different purpose and must be planned, conducted, and documented separately.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon:'🏛️', title:'QMS System Audit (Cl. 9.2.2.1)', desc:'Verifies compliance to all IATF 16949 clauses. Must cover all clauses over the audit cycle. Risk-based frequency — higher-risk clauses audited more often.' },
                  { icon:'⚙️', title:'Process Audit (Cl. 9.2.2.2)', desc:'Evaluates manufacturing processes using turtle diagram approach. Checks inputs, outputs, resources, methods, metrics. VDA 6.3 format commonly used.' },
                  { icon:'📦', title:'Product Audit (Cl. 9.2.2.3)', desc:'Verifies conformance of finished product to drawing, specifications, and customer requirements. Minimum 5–10 parts measured against all characteristics.' },
                ].map(c => (
                  <div key={c.title} className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-emerald-300 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Programme Requirements */}
            <div className="bg-gray-900 border border-blue-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📋 Audit Programme Requirements — IATF 16949 Cl. 9.2.2</h2>
              <div className="space-y-3">
                {[
                  { req:'Documented Audit Schedule', detail:'Annual audit schedule must cover all QMS processes, all manufacturing processes, all shifts, all locations. Schedule must be risk-based — more frequent audits for higher-risk processes and previous NC areas.' },
                  { req:'Auditor Independence', detail:'Auditors must NOT audit their own work or area. Quality Manager auditing the Quality department is a finding. Auditor must be competent and qualified — training records required.' },
                  { req:'Auditor Competence', detail:'Internal auditors must be trained, demonstrate knowledge of: IATF 16949 requirements, audit methodology (turtle diagram, process approach), and the process being audited. Competency records must be maintained.' },
                  { req:'Findings Documentation', detail:'All findings must be documented with: clause reference, objective evidence, finding classification (Major NC / Minor NC / OFI / Positive). No undocumented verbal-only findings.' },
                  { req:'CAPA for Nonconformities', detail:'Every NC finding (major or minor) must trigger a CAPA. CAPA must include root cause analysis and verification of effectiveness. Closure requires objective evidence — not just "action completed."' },
                  { req:'Management Review Input', detail:'Internal audit results must be presented at Management Review (Cl. 9.3.2). Include: number of audits conducted, open findings, overdue closures, trends in NC findings.' },
                  { req:'Closure Verification', detail:'Auditor or Lead Auditor must verify objective evidence of closure before marking NC closed. "Planned action" is not evidence of closure. Physical verification or documented evidence is required.' },
                ].map(r => (
                  <div key={r.req} className="bg-gray-800 rounded-xl p-4">
                    <div className="text-emerald-300 font-semibold text-sm mb-1">{r.req}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{r.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Turtle Diagram */}
            <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🐢 Process Audit — Turtle Diagram Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { seg:'📥 INPUT', color:'bg-blue-900/30 border-blue-800/40', qs:[
                    'What are the inputs to this process? From which upstream process?',
                    'What are the customer requirements and specifications for this process?',
                    'Are inputs inspected at receiving? What is the acceptance criteria?',
                    'Are incoming materials traceable to their source and heat/lot?',
                  ]},
                  { seg:'📤 OUTPUT', color:'bg-green-900/30 border-green-800/40', qs:[
                    'What are the outputs of this process? To which downstream process?',
                    'Are all outputs conforming before release to next operation?',
                    'How is nonconforming output segregated, identified, and dispositioned?',
                    'Is the rejection rate measured and monitored? What is the trend?',
                  ]},
                  { seg:'🔧 EQUIPMENT', color:'bg-amber-900/30 border-amber-800/40', qs:[
                    'Are all machines and tools listed in the Control Plan and PFMEA?',
                    'Is equipment calibrated and within calibration interval?',
                    'Are MSA/GRR studies available for all measurement systems on CC/SC?',
                    'Is preventive maintenance scheduled and up to date?',
                  ]},
                  { seg:'👥 PEOPLE', color:'bg-pink-900/30 border-pink-800/40', qs:[
                    'Are operators trained and qualified for this operation?',
                    'Is training on the current revision of the Work Instruction documented?',
                    'How many operators are needed? Is there a backup/cross-trained operator?',
                    'Are operator competency assessments conducted and recorded?',
                  ]},
                  { seg:'📋 METHOD', color:'bg-cyan-900/30 border-cyan-800/40', qs:[
                    'Is the Work Instruction current revision and available at the workstation?',
                    'Does the WI match the Control Plan inspection frequency and method?',
                    'Is SPC being conducted for CC/SC characteristics? Are OOC signals acted on?',
                    'Is the PFMEA linked to this process? Are High AP items actioned?',
                  ]},
                  { seg:'📊 METRICS', color:'bg-emerald-900/30 border-emerald-800/40', qs:[
                    'What KPIs are monitored for this process? Are targets met?',
                    'Is OEE (Availability × Performance × Quality) measured?',
                    'What is the current rejection PPM for this process? What is the trend?',
                    'Are corrective actions from previous audits closed with verified effectiveness?',
                  ]},
                ].map(s => (
                  <div key={s.seg} className={`border rounded-xl p-4 ${s.color}`}>
                    <div className="text-white font-bold text-sm mb-2">{s.seg}</div>
                    {s.qs.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className="text-gray-500 flex-shrink-0">Q{i+1}.</span>
                        <span className="text-gray-400">{q}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Finding Classification */}
            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🔴 Finding Classification Guide</h2>
              <div className="space-y-3">
                {[
                  { type:'🔴 Major NC', bg:'bg-red-900/20 border-red-800/40', desc:'A situation that raises serious doubt that an effective QMS is in place, or results in the failure to fulfil a customer requirement or regulatory requirement.', examples:['Missing PPAP for production parts being shipped','No evidence of internal audits conducted in past 12 months','Nonconforming parts shipped to customer without containment','MSA not done for any CC gauge — entire measurement system unvalidated','CAPA closed without root cause analysis or effectiveness verification'] },
                  { type:'🟡 Minor NC', bg:'bg-amber-900/20 border-amber-800/40', desc:'An isolated or occasional failure to comply with a requirement. The QMS is functional but a specific element is incomplete or inconsistently applied.', examples:['3 of 20 operators not trained on current WI revision','Control Plan not updated after a 4M change (process change without CP update)','1 calibration sticker expired on non-CC gauge','Management review minutes missing 1 of the required inputs (e.g., COPQ data)','Internal audit schedule does not cover second shift'] },
                  { type:'🔵 OFI (Observation)', bg:'bg-blue-900/20 border-blue-800/40', desc:'An opportunity for improvement — not a nonconformity. The system meets requirements but could be enhanced. OFIs do not require CAPA.', examples:['Reaction plan could be more specific — currently says "stop and notify quality"','5S standard could be better maintained in storage area','Visual aid at welding station could show acceptable vs. unacceptable weld bead examples'] },
                  { type:'🟢 Positive Finding', bg:'bg-green-900/20 border-green-800/40', desc:'A notable example of good practice that should be recognised, maintained, and potentially shared with other areas.', examples:['100% Cpk compliance on all CC characteristics for 6 consecutive months','Poka-yoke installed at Op-30 resulting in zero defect escape for past year','Comprehensive lessons learned database with 200+ entries referenced in PFMEA updates'] },
                ].map(f => (
                  <div key={f.type} className={`border rounded-xl p-4 ${f.bg}`}>
                    <div className="text-white font-bold text-sm mb-1">{f.type}</div>
                    <p className="text-gray-400 text-xs mb-2">{f.desc}</p>
                    <div className="text-xs text-gray-500">Examples: {f.examples.join(' · ')}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GUIDE TAB */}
      {mainTab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Conduct an Internal Audit</h2>
              <p className="text-gray-400 text-sm mt-1">IATF 16949 Cl. 9.2 · Process Audit · QMS Audit · Product Audit</p>
            </div>

            {[
              { step:1, icon:'📅', title:'Plan the Audit — Schedule, Scope, and Auditor Assignment',
                body:'Prepare the annual audit schedule covering all processes, all clauses, and all shifts. Assign auditors who are NOT responsible for the area being audited. Send advance notification to auditee (minimum 1 week notice for planned audits). Prepare the audit checklist aligned to the Control Plan, PFMEA, and relevant IATF clauses for the process being audited.' },
              { step:2, icon:'📋', title:'Prepare the Checklist and Opening Meeting',
                body:'Build a process-specific checklist using the turtle diagram framework: Input → Output → Equipment → People → Method → Metrics. For QMS audits, map clauses to the process. Opening meeting must state: audit scope, objectives, methodology, time plan, and confidentiality. Confirm auditee understanding and availability of relevant documents.' },
              { step:3, icon:'🔍', title:'Conduct the Audit — Verify, Observe, Interview',
                body:'Use three types of evidence: Documents (SOPs, records, logs), Physical observation (workstation, gauges, labels, 5S), and Interviews (ask operators to explain their process, not HOD to answer for them). Never accept verbal assurance alone — always ask for objective evidence. Follow the process flow from receiving to dispatch for process audits.' },
              { step:4, icon:'📝', title:'Document Findings Accurately',
                body:'Record every finding with: clause reference, objective evidence (what you saw/heard/measured), finding classification (Major NC / Minor NC / OFI / Positive). A finding without evidence is not a valid finding. Use specific, factual language: "WI-STM-007 Rev B was found at station — current revision is Rev C (issued 2025-03-01). Three operators interviewed confirmed they were trained on Rev B only." Avoid vague language like "training not done."' },
              { step:5, icon:'🤝', title:'Closing Meeting and Finding Agreement',
                body:'Present all findings to the auditee and HOD. Give auditee opportunity to provide clarification or additional evidence before finalising classification. Agree target closure dates for NCs. Major NCs typically require 30-day CAPA response. Minor NCs typically 45–60 days. Obtain auditee signature on the audit report acknowledging the findings.' },
              { step:6, icon:'🔧', title:'CAPA Linkage and Follow-Up',
                body:'Raise a formal CAPA for every NC finding. CAPA must include: root cause analysis (5-Why + fishbone), corrective action, preventive action (systemic), and effectiveness verification plan. OFIs do not need CAPA but should be logged. Set calendar reminders for follow-up. Do not close NC until objective evidence of correction and effectiveness is verified.' },
              { step:7, icon:'✅', title:'Verify Effectiveness and Close Findings',
                body:'Closure requires verification — not just "action completed" on a form. Visit the area, check the records, re-interview if needed. If closure evidence is insufficient, reject and request additional evidence. Once verified, sign and date closure. Update the audit register. Report audit results in the next Management Review. Analyse trends: are certain clauses or areas generating repeat findings?' },
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="text-emerald-300 font-bold text-sm">{s.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">❌ Common IATF Audit Findings About Internal Audits</h2>
              <div className="space-y-2">
                {[
                  ['Internal audit schedule does not cover all processes and all shifts — night shift never audited (Cl. 9.2.2)'],
                  ['Auditor audited their own area — Quality Manager conducted the Quality Department audit (independence requirement)'],
                  ['Internal audit records show "no findings" for every audit over 2 years — not credible, auditor is not effective'],
                  ['NC findings from previous audit not closed by target date — no evidence of follow-up (overdue CAPA)'],
                  ['Internal audit results not presented at Management Review — mandatory input missing from MRM minutes (Cl. 9.3.2)'],
                  ['Product audit measures only key dimensions — not all ballooned characteristics on the drawing (Cl. 9.2.2.3)'],
                  ['Process audit conducted using only a QMS checklist — process audit and QMS audit treated as the same (Cl. 9.2.2.2)'],
                  ['Auditor competency not evidenced — no training record or qualification for lead auditor role'],
                ].map(([m], i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
                    <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">✗</span>
                    <p className="text-red-300 text-xs leading-relaxed">{m}</p>
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
