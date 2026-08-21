'use client';
import { useState, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ---------------------------------------------------------------------
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

// -- Constants -----------------------------------------------------------------
const AUDIT_TYPE_COLORS: Record<AuditType, string> = {
  'QMS System': 'bg-[#eff6ff] text-blue-200',
  'Process':    'bg-purple-800 text-purple-200',
  'Product':    'bg-cyan-800 text-cyan-200',
  'Supplier':   'bg-amber-800 text-amber-200',
  'Customer':   'bg-pink-800 text-pink-200',
};

const STATUS_COLORS: Record<AuditStatus, string> = {
  'planned':     'bg-gray-700 text-[#1e3a5f]',
  'in-progress': 'bg-[#eff6ff] text-blue-200',
  'completed':   'bg-green-800 text-green-200',
  'overdue':     'bg-red-800 text-red-700',
};
const STATUS_LABELS: Record<AuditStatus, string> = {
  'planned':     '📅 Planned',
  'in-progress': '🔄 In Progress',
  'completed':   '✅ Completed',
  'overdue':     '⚠️ Overdue',
};

const FINDING_COLORS: Record<FindingType, string> = {
  'major-nc': 'bg-red-800/60 text-red-700',
  'minor-nc': 'bg-amber-800/60 text-amber-700',
  'ofi':      'bg-[#eff6ff]/60 text-[#1d4ed8]',
  'positive': 'bg-green-800/60 text-green-300',
};
const FINDING_LABELS: Record<FindingType, string> = {
  'major-nc': '🔴 Major NC',
  'minor-nc': '🟡 Minor NC',
  'ofi':      '🔵 OFI',
  'positive': '🟢 Positive',
};
const FINDING_STATUS_COLORS: Record<FindingStatus, string> = {
  'open':        'text-red-600',
  'capa-raised': 'text-amber-600',
  'closed':      'text-green-600',
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

const inp = 'w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-emerald-500';
const lbl = 'text-xs text-[#1e3a5f] block mb-1';

// -- Audit Dashboard Tab --------------------------------------------------------
function AuditDashboard({ audits }: { audits: Audit[] }) {
  const allFindings = audits.flatMap(a => a.findings);
  const total = audits.length;
  const completed = audits.filter(a => a.status === 'completed').length;
  const planned   = audits.filter(a => a.status === 'planned').length;
  const overdue   = audits.filter(a => a.status === 'overdue').length;
  const inProg    = audits.filter(a => a.status === 'in-progress').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const majorNC  = allFindings.filter(f => f.type === 'major-nc').length;
  const minorNC  = allFindings.filter(f => f.type === 'minor-nc').length;
  const ofi      = allFindings.filter(f => f.type === 'ofi').length;
  const positive = allFindings.filter(f => f.type === 'positive').length;
  const totalFindings = allFindings.length;

  const openFindings   = allFindings.filter(f => f.status === 'open' || f.status === 'capa-raised').length;
  const closedFindings = allFindings.filter(f => f.status === 'closed').length;
  const closureRate    = totalFindings > 0 ? Math.round((closedFindings / totalFindings) * 100) : 0;

  // Findings by clause (top 6)
  const byClause: Record<string,number> = {};
  allFindings.forEach(f => { byClause[f.clause] = (byClause[f.clause] ?? 0) + 1; });
  const topClauses = Object.entries(byClause).sort((a,b) => b[1]-a[1]).slice(0, 6);

  // Findings by process (top 5)
  const byProcess: Record<string,number> = {};
  allFindings.forEach(f => { byProcess[f.process] = (byProcess[f.process] ?? 0) + 1; });
  const topProcesses = Object.entries(byProcess).sort((a,b) => b[1]-a[1]).slice(0, 5);

  // Audit type breakdown
  const byType: Record<string,number> = {};
  audits.forEach(a => { byType[a.type] = (byType[a.type] ?? 0) + 1; });

  const TYPE_COLORS: Record<string,string> = {
    'QMS System':'bg-blue-600','Process':'bg-purple-600','Product':'bg-cyan-600',
    'Supplier':'bg-amber-600','Customer':'bg-pink-600',
  };

  // Maturity indicators
  const ncClosureScore = closureRate;
  const auditCompScore = completionRate;
  const majorNCScore   = totalFindings > 0 ? Math.max(0, 100 - Math.round((majorNC / totalFindings) * 200)) : 100;
  const overallScore   = Math.round((ncClosureScore + auditCompScore + majorNCScore) / 3);

  return (
      <>
      <PageTitle title="Audit Management" />
      <div className="space-y-5 px-4 md:px-6 py-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Audits Planned', value: total, sub:`${completed} completed`, color:'text-white', bg:'bg-[#dbeafe] border-[#dbeafe]' },
          { label:'Completion Rate', value: `${completionRate}%`, sub:`${overdue} overdue`, color: completionRate>=80?'text-emerald-600':completionRate>=50?'text-yellow-600':'text-red-600', bg:'bg-[#dbeafe] border-[#dbeafe]' },
          { label:'Total Findings', value: totalFindings, sub:`${majorNC} major NC`, color: majorNC>0?'text-red-600':'text-emerald-600', bg:'bg-[#dbeafe] border-[#dbeafe]' },
          { label:'NC Closure Rate', value: `${closureRate}%`, sub:`${openFindings} open`, color: closureRate>=80?'text-emerald-600':closureRate>=50?'text-yellow-600':'text-red-600', bg:'bg-[#dbeafe] border-[#dbeafe]' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl border p-4`}>
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Finding Types + Audit Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Findings by Type */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Findings by Type</div>
          {totalFindings === 0 ? (
            <div className="text-xs text-[#1e3a5f] py-6 text-center">No findings yet — load sample data or add audits</div>
          ) : (
            <div className="space-y-3">
              {[
                { label:'🔴 Major NC', value: majorNC, color:'bg-red-600',    text:'text-red-600' },
                { label:'🟡 Minor NC', value: minorNC, color:'bg-amber-500',  text:'text-amber-600' },
                { label:'🔵 OFI',      value: ofi,     color:'bg-blue-600',   text:'text-blue-600' },
                { label:'🟢 Positive', value: positive, color:'bg-emerald-600', text:'text-emerald-600' },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${b.text}`}>{b.label}</span>
                    <span className="text-[#1e3a5f]">{b.value} ({totalFindings>0?Math.round(b.value/totalFindings*100):0}%)</span>
                  </div>
                  <div className="w-full bg-[#dbeafe] rounded-full h-2">
                    <div className={`${b.color} h-2 rounded-full transition-all`} style={{width:`${totalFindings>0?b.value/totalFindings*100:0}%`}} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Programme Status */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Audit Programme Status</div>
          <div className="space-y-2 mb-4">
            {[
              { label:'Completed', value: completed, color:'bg-emerald-600', text:'text-emerald-600' },
              { label:'In Progress', value: inProg,   color:'bg-blue-600',   text:'text-blue-600' },
              { label:'Planned',    value: planned,   color:'bg-slate-500',  text:'text-[#1e3a5f]' },
              { label:'Overdue',    value: overdue,   color:'bg-red-600',    text:'text-red-600' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className={`text-xs font-medium ${b.text} w-24 shrink-0`}>{b.label}</span>
                <div className="flex-1 bg-[#dbeafe] rounded-full h-2">
                  <div className={`${b.color} h-2 rounded-full`} style={{width:`${total>0?b.value/total*100:0}%`}} />
                </div>
                <span className="text-xs text-[#1e3a5f] w-4 text-right">{b.value}</span>
              </div>
            ))}
          </div>
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2 mt-4">By Audit Type</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(byType).map(([type, cnt]) => (
              <span key={type} className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${TYPE_COLORS[type]??'bg-slate-600'}`}>
                {type}: {cnt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clauses + Processes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Top IATF Clauses with Findings</div>
          {topClauses.length === 0
            ? <div className="text-xs text-[#1e3a5f] py-4 text-center">No findings data</div>
            : topClauses.map(([clause, cnt], i) => (
              <div key={clause} className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-[#1e3a5f] w-4">{i+1}</span>
                <span className="flex-1 text-xs font-medium text-[#1e3a5f] truncate">{clause}</span>
                <div className="w-20 bg-[#dbeafe] rounded-full h-1.5 shrink-0">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{width:`${Math.round(cnt/(topClauses[0]?.[1]??1)*100)}%`}} />
                </div>
                <span className="text-xs font-bold text-emerald-600 w-4 text-right">{cnt}</span>
              </div>
            ))
          }
        </div>

        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Top Process Areas with Findings</div>
          {topProcesses.length === 0
            ? <div className="text-xs text-[#1e3a5f] py-4 text-center">No findings data</div>
            : topProcesses.map(([proc, cnt], i) => (
              <div key={proc} className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-[#1e3a5f] w-4">{i+1}</span>
                <span className="flex-1 text-xs font-medium text-[#1e3a5f]">{proc}</span>
                <div className="w-20 bg-[#dbeafe] rounded-full h-1.5 shrink-0">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{width:`${Math.round(cnt/(topProcesses[0]?.[1]??1)*100)}%`}} />
                </div>
                <span className="text-xs font-bold text-purple-600 w-4 text-right">{cnt}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Maturity Score */}
      <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl p-5">
        <div className="text-sm font-bold text-[#0f172a] mb-4">📊 Audit Programme Maturity Score</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'NC Closure Rate', score: ncClosureScore, target: 100 },
            { label:'Audit Completion', score: auditCompScore, target: 90 },
            { label:'Major NC Control', score: majorNCScore, target: 80 },
            { label:'Overall Score', score: overallScore, target: 85 },
          ].map(m => {
            const color = m.score >= m.target ? '#10b981' : m.score >= m.target*0.7 ? '#f59e0b' : '#ef4444';
            return (
              <div key={m.label} className="bg-[#eff6ff] rounded-xl p-3 text-center">
                <div className="text-xs text-[#1d4ed8] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-blue-600 mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-[#eff6ff] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{width:`${Math.min(m.score,100)}%`, background:color}} />
                </div>
              </div>
            );
          })}
        </div>
        {audits.length === 0 && (
          <div className="mt-3 text-xs text-blue-600 text-center">
            Load sample data from the Audit Tracker tab to populate this dashboard.
          </div>
        )}
      </div>
    </div>
      </>
  );
}


export default function AuditPage() {
  const [mainTab, setMainTab]     = useState<'dashboard' | 'tracker' | 'knowledge' | 'guide' | 'readiness'>('dashboard');
  const [readinessData, setReadinessData] = useState<{complaints: unknown[]; calibration: unknown[]; reports: unknown} | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessRun, setReadinessRun] = useState(false);

  const runReadinessCheck = useCallback(async () => {
    setReadinessLoading(true);
    try {
      const [comp, cal, rep] = await Promise.all([
        fetch('/api/complaints').then(r => r.json()).catch(() => []),
        fetch('/api/calibration').then(r => r.json()).catch(() => []),
        fetch('/api/reports').then(r => r.json()).catch(() => {}),
      ]);
      setReadinessData({ complaints: Array.isArray(comp) ? comp : [], calibration: Array.isArray(cal) ? cal : [], reports: rep ?? {} });
      setReadinessRun(true);
    } catch { /* ignore */ }
    setReadinessLoading(false);
  }, []);
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
    <div className="min-h-screen bg-[#eff6ff]">

      {/* Header */}
      <div className="bg-white">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Audit Management</h1>
                <p className="text-emerald-700 text-xs mt-0.5">IATF 16949 Cl. 9.2 · QMS / Process / Product / Supplier Audits · Findings Register · CAPA Linkage</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-emerald-700">{completedAudits}/{totalAudits}</div>
                <div className="text-xs text-emerald-600">Audits Done</div>
              </div>
              {overdueAudits > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-700">{overdueAudits}</div>
                  <div className="text-xs text-red-600">Overdue</div>
                </div>
              )}
              {majorNCs > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-700">{majorNCs}</div>
                  <div className="text-xs text-red-600">Major NCs</div>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-amber-700">{openFindings}</div>
                <div className="text-xs text-amber-600">Open Findings</div>
              </div>
              <button onClick={loadSample} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                🧪 Load Sample
              </button>
              <button onClick={() => setShowNewAudit(true)} className="bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e3a5f] text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-white/20">
                + New Audit
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              { id: 'tracker',   label: '✅ Audit Tracker' },
              { id: 'knowledge', label: '📚 Knowledge Hub' },
              { id: 'guide',     label: '📋 Auditor Guide' },
              { id: 'readiness', label: '🤖 AI Readiness Check' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex-shrink-0 ${
                  mainTab === t.id ? 'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]' : 'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TRACKER TAB */}
      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/audit/Internal_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Audit Checklist XLS">Audit Checklist XLS</a><a href="/downloads/audit/Internal_Audit_Checklist.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Audit Checklist XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/audit/NCR_Form.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View NCR Form XLS">NCR Form XLS</a><a href="/downloads/audit/NCR_Form.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download NCR Form XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/audit/Audit_Report_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Audit Report XLS">Audit Report XLS</a><a href="/downloads/audit/Audit_Report_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Audit Report XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/audit/Annual_Audit_Schedule.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Audit Schedule XLS">Audit Schedule XLS</a><a href="/downloads/audit/Annual_Audit_Schedule.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Audit Schedule XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#1e40af'}}><a href="/downloads/audit/IATF_Audit_Questions_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View IATF Questions PDF">IATF Questions PDF</a><a href="/downloads/audit/IATF_Audit_Questions_Guide.pdf" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download IATF Questions PDF">⬇</a></span>
      </div>
      {mainTab === 'dashboard' && <AuditDashboard audits={audits} />}
      {mainTab === 'tracker' && (
        <div className="animate-fadeIn p-4 bg-[#eff6ff] min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* New Audit Form */}
            {showNewAudit && (
              <div className="bg-white border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
                  <h2 className="text-sm font-bold text-white">+ New Audit</h2>
                  <button onClick={() => setShowNewAudit(false)} className="text-[#1e3a5f] hover:text-white text-xs">✕ Cancel</button>
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
              <div className="bg-white border border-[#dbeafe] border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-[#1e3a5f] text-sm">No audits yet. Click <span className="text-emerald-600">🧪 Load Sample</span> to see a full example, or <span className="text-emerald-600">+ New Audit</span> to create one.</p>
              </div>
            )}

            {audits.map(audit => {
              const isExpanded = expandedId === audit.id;
              const majorCount  = audit.findings.filter(f => f.type === 'major-nc').length;
              const minorCount  = audit.findings.filter(f => f.type === 'minor-nc').length;
              const ofiCount    = audit.findings.filter(f => f.type === 'ofi').length;
              const openCount   = audit.findings.filter(f => f.status === 'open' || f.status === 'overdue').length;
              return (
                <div key={audit.id} className={`bg-white border rounded-2xl overflow-hidden ${audit.status === 'overdue' ? 'border-red-700/50' : audit.status === 'completed' ? 'border-green-700/50' : 'border-[#dbeafe]'}`}>
                  {/* Audit Header */}
                  <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : audit.id)}>
                    <span className="text-xl flex-shrink-0">{audit.type === 'QMS System' ? '🏛️' : audit.type === 'Process' ? '⚙️' : audit.type === 'Product' ? '📦' : audit.type === 'Supplier' ? '🏭' : '👥'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-sm">{audit.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${AUDIT_TYPE_COLORS[audit.type]}`}>{audit.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[audit.status]}`}>{STATUS_LABELS[audit.status]}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#1e3a5f]">
                        <span>🗓 {audit.plannedDate || '—'}</span>
                        <span>👤 {audit.auditor || '—'}</span>
                        <span>🎯 {audit.scope || '—'}</span>
                        {audit.findings.length > 0 && (
                          <span>
                            {majorCount > 0 && <span className="text-red-600 font-bold mr-1">{majorCount} Major</span>}
                            {minorCount > 0 && <span className="text-amber-600 font-bold mr-1">{minorCount} Minor</span>}
                            {ofiCount > 0 && <span className="text-blue-600 mr-1">{ofiCount} OFI</span>}
                            {openCount > 0 && <span className="text-red-600">({openCount} open)</span>}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="text-xs bg-white border border-[#dbeafe] rounded-lg px-2 py-1 text-[#1e3a5f] focus:outline-none" value={audit.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateAuditStatus(audit.id, e.target.value as AuditStatus); }}>
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      <span className="text-[#1e3a5f] text-sm">{isExpanded ? '▾' : '▸'}</span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-[#dbeafe] px-5 py-4">
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
                          <div key={l} className="bg-white rounded-lg px-3 py-2">
                            <div className="text-[#1e3a5f]">{l}</div>
                            <div className="text-white font-semibold mt-0.5">{v}</div>
                          </div>
                        ))}
                      </div>
                      {audit.notes && <p className="text-xs text-[#1e3a5f] bg-[#eff6ff] rounded-lg px-3 py-2 mb-4">{audit.notes}</p>}

                      {/* Findings */}
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-y-2">
                        <h4 className="text-sm font-bold text-white">Findings ({audit.findings.length})</h4>
                        <button onClick={() => { setSelectedId(audit.id); setShowNewFinding(true); }}
                          className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                          + Add Finding
                        </button>
                      </div>

                      {/* New Finding Form */}
                      {showNewFinding && selectedId === audit.id && (
                        <div className="bg-white border border-emerald-200 rounded-xl p-4 mb-3">
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
                              <button onClick={() => setShowNewFinding(false)} className="text-[#1e3a5f] hover:text-white text-xs px-3 py-2">Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {audit.findings.length === 0 && (
                        <div className="text-center py-6 text-[#1e3a5f] text-xs bg-[#eff6ff] rounded-xl">No findings recorded for this audit.</div>
                      )}

                      {audit.findings.length > 0 && (
                        <div className="space-y-2">
                          {audit.findings.map(f => (
                            <div key={f.id} className={`bg-white rounded-xl p-3 border-l-4 ${f.type === 'major-nc' ? 'border-red-500' : f.type === 'minor-nc' ? 'border-amber-500' : f.type === 'ofi' ? 'border-blue-500' : 'border-green-500'}`}>
                              <div className="flex items-start gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 mt-0.5 ${FINDING_COLORS[f.type]}`}>{FINDING_LABELS[f.type]}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap gap-2 mb-1">
                                    {f.clause && <span className="text-xs bg-gray-700 text-[#1e3a5f] px-2 py-0.5 rounded">{f.clause}</span>}
                                    {f.process && <span className="text-xs bg-gray-700 text-[#1e3a5f] px-2 py-0.5 rounded">{f.process}</span>}
                                  </div>
                                  <p className="text-white text-xs font-medium mb-1">{f.description}</p>
                                  {f.evidence && <p className="text-[#1e3a5f] text-xs mb-1">Evidence: {f.evidence}</p>}
                                  <div className="flex flex-wrap gap-3 text-xs">
                                    {f.owner && <span className="text-[#1e3a5f]">Owner: <span className="text-[#1e3a5f]">{f.owner}</span></span>}
                                    {f.targetDate && <span className="text-[#1e3a5f]">Target: <span className="text-[#1e3a5f]">{f.targetDate}</span></span>}
                                    {f.closureDate && <span className="text-[#1e3a5f]">Closed: <span className="text-green-600">{f.closureDate}</span></span>}
                                  </div>
                                </div>
                                <select
                                  className={`text-xs bg-gray-700 border border-[#dbeafe] rounded-lg px-2 py-1 focus:outline-none flex-shrink-0 ${FINDING_STATUS_COLORS[f.status]}`}
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
        <div className="animate-fadeIn p-6 bg-[#eff6ff] min-h-screen">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-white border border-emerald-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">✅ What is IATF Internal Audit?</h2>
              <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                Internal audit is the organisation's self-assessment mechanism to verify that the Quality Management System is effectively implemented and maintained. Under IATF 16949 Cl. 9.2, three distinct audit types are mandatory: QMS system audits, manufacturing process audits, and product audits. Each serves a different purpose and must be planned, conducted, and documented separately.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon:'🏛️', title:'QMS System Audit (Cl. 9.2.2.1)', desc:'Verifies compliance to all IATF 16949 clauses. Must cover all clauses over the audit cycle. Risk-based frequency — higher-risk clauses audited more often.' },
                  { icon:'⚙️', title:'Process Audit (Cl. 9.2.2.2)', desc:'Evaluates manufacturing processes using turtle diagram approach. Checks inputs, outputs, resources, methods, metrics. VDA 6.3 format commonly used.' },
                  { icon:'📦', title:'Product Audit (Cl. 9.2.2.3)', desc:'Verifies conformance of finished product to drawing, specifications, and customer requirements. Minimum 5–10 parts measured against all characteristics.' },
                ].map(c => (
                  <div key={c.title} className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-emerald-700 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Programme Requirements */}
            <div className="bg-white border border-blue-700/50/50 rounded-2xl p-6">
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
                  <div key={r.req} className="bg-white rounded-xl p-4">
                    <div className="text-emerald-700 font-semibold text-sm mb-1">{r.req}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{r.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Turtle Diagram */}
            <div className="bg-white border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🐢 Process Audit — Turtle Diagram Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { seg:'📥 INPUT', color:'bg-[#eff6ff] border-blue-700/50', qs:[
                    'What are the inputs to this process? From which upstream process?',
                    'What are the customer requirements and specifications for this process?',
                    'Are inputs inspected at receiving? What is the acceptance criteria?',
                    'Are incoming materials traceable to their source and heat/lot?',
                  ]},
                  { seg:'📤 OUTPUT', color:'bg-green-900/30 border-green-700/50', qs:[
                    'What are the outputs of this process? To which downstream process?',
                    'Are all outputs conforming before release to next operation?',
                    'How is nonconforming output segregated, identified, and dispositioned?',
                    'Is the rejection rate measured and monitored? What is the trend?',
                  ]},
                  { seg:'🔧 EQUIPMENT', color:'bg-amber-50 border-amber-800/40', qs:[
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
                  { seg:'📊 METRICS', color:'bg-emerald-900/20 border-emerald-700/50', qs:[
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
                        <span className="text-[#1e3a5f] flex-shrink-0">Q{i+1}.</span>
                        <span className="text-[#1e3a5f]">{q}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Finding Classification */}
            <div className="bg-white border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🔴 Finding Classification Guide</h2>
              <div className="space-y-3">
                {[
                  { type:'🔴 Major NC', bg:'bg-red-50 border-red-800/40', desc:'A situation that raises serious doubt that an effective QMS is in place, or results in the failure to fulfil a customer requirement or regulatory requirement.', examples:['Missing PPAP for production parts being shipped','No evidence of internal audits conducted in past 12 months','Nonconforming parts shipped to customer without containment','MSA not done for any CC gauge — entire measurement system unvalidated','CAPA closed without root cause analysis or effectiveness verification'] },
                  { type:'🟡 Minor NC', bg:'bg-amber-50 border-amber-800/40', desc:'An isolated or occasional failure to comply with a requirement. The QMS is functional but a specific element is incomplete or inconsistently applied.', examples:['3 of 20 operators not trained on current WI revision','Control Plan not updated after a 4M change (process change without CP update)','1 calibration sticker expired on non-CC gauge','Management review minutes missing 1 of the required inputs (e.g., COPQ data)','Internal audit schedule does not cover second shift'] },
                  { type:'🔵 OFI (Observation)', bg:'bg-[#eff6ff] border-blue-700/50', desc:'An opportunity for improvement — not a nonconformity. The system meets requirements but could be enhanced. OFIs do not require CAPA.', examples:['Reaction plan could be more specific — currently says "stop and notify quality"','5S standard could be better maintained in storage area','Visual aid at welding station could show acceptable vs. unacceptable weld bead examples'] },
                  { type:'🟢 Positive Finding', bg:'bg-green-900/30/20 border-green-700/50', desc:'A notable example of good practice that should be recognised, maintained, and potentially shared with other areas.', examples:['100% Cpk compliance on all CC characteristics for 6 consecutive months','Poka-yoke installed at Op-30 resulting in zero defect escape for past year','Comprehensive lessons learned database with 200+ entries referenced in PFMEA updates'] },
                ].map(f => (
                  <div key={f.type} className={`border rounded-xl p-4 ${f.bg}`}>
                    <div className="text-white font-bold text-sm mb-1">{f.type}</div>
                    <p className="text-[#1e3a5f] text-xs mb-2">{f.desc}</p>
                    <div className="text-xs text-[#1e3a5f]">Examples: {f.examples.join(' · ')}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GUIDE TAB */}
      {mainTab === 'guide' && (
        <div className="animate-fadeIn p-6 bg-[#eff6ff] min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Conduct an Internal Audit</h2>
              <p className="text-[#1e3a5f] text-sm mt-1">IATF 16949 Cl. 9.2 · Process Audit · QMS Audit · Product Audit</p>
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
              <div key={s.step} className="bg-white border border-[#dbeafe] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="text-emerald-700 font-bold text-sm">{s.title}</h3>
                    </div>
                    <p className="text-[#1e3a5f] text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white border border-red-900/50 rounded-2xl p-6">
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
                  <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-800/30 rounded-lg px-4 py-3">
                    <span className="text-red-600 text-sm flex-shrink-0 mt-0.5">✗</span>
                    <p className="text-red-700 text-xs leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- AI READINESS CHECKER TAB --------------------------------------- */}
      {mainTab === 'readiness' && (() => {
        // -- Clause scoring engine ------------------------------------------
        interface ClauseScore { clause: string; title: string; score: number; status: 'green'|'amber'|'red'; findings: string[]; evidence: string[] }
        const complaints = (readinessData?.complaints ?? []) as Record<string,unknown>[];
        const calibration = (readinessData?.calibration ?? []) as Record<string,unknown>[];
        const reports = (readinessData?.reports ?? {}) as Record<string,unknown>;

        const today = Date.now();
        const open = complaints.filter(c => !['Closed','Cancelled'].includes(c.status as string));
        const closed = complaints.filter(c => c.status === 'Closed');
        const capa = complaints.filter(c => c.status === 'CAPA In Progress');
        const criticalOpen = open.filter(c => c.severity === 'Critical');
        const closureRate = complaints.length ? Math.round((closed.length / complaints.length) * 100) : 0;
        const calOverdue = calibration.filter(c => c.next_calibration_date && new Date(c.next_calibration_date as string).getTime() < today).length;
        const calDue = calibration.filter(c => { if (!c.next_calibration_date) return false; const d = Math.ceil((new Date(c.next_calibration_date as string).getTime() - today) / 86400000); return d >= 0 && d <= 30; }).length;
        const slaBreached = open.filter(c => {
          if (!c.created_at) return false;
          const lim: Record<string,number> = { Critical:7, High:14, Medium:30, Low:45 };
          const days = Math.floor((today - new Date(c.created_at as string).getTime()) / 86400000);
          return days > (lim[c.severity as string] ?? 30);
        }).length;

        const clauses: ClauseScore[] = [
          {
            clause: 'Cl. 4', title: 'Context of the Organization',
            score: 75, status: 'amber',
            findings: ['Context analysis (internal/external issues) not digitally tracked — manual records only','Interested party needs not linked to QMS objectives in the system'],
            evidence: ['QMS scope defined','Process approach implemented — 77+ routes in QMOS'],
          },
          {
            clause: 'Cl. 5', title: 'Leadership & Management Commitment',
            score: 80, status: 'green',
            findings: ['Management review actions not all linked to measurable targets'],
            evidence: ['Management Review module active with live data','Quality policy accessible system-wide','Role assignments tracked in complaint workflow'],
          },
          {
            clause: 'Cl. 6', title: 'Planning — Risk & Quality Objectives',
            score: complaints.length > 0 ? 82 : 60, status: complaints.length > 0 ? 'green' : 'amber',
            findings: complaints.length === 0 ? ['No complaint data — risk assessment cannot be validated'] : slaBreached > 0 ? [`${slaBreached} open complaints breaching SLA — risk escalation process not triggered`] : [],
            evidence: [`${complaints.length} complaints tracked`, `Closure rate: ${closureRate}%`, 'SLA-based risk classification active'],
          },
          {
            clause: 'Cl. 7', title: 'Support — Resources, MSA, Calibration',
            score: calOverdue > 0 ? 55 : calDue > 0 ? 70 : calibration.length > 0 ? 88 : 50,
            status: calOverdue > 0 ? 'red' : calDue > 0 ? 'amber' : calibration.length > 0 ? 'green' : 'amber',
            findings: [
              ...(calOverdue > 0 ? [`🚨 ${calOverdue} instrument(s) overdue for calibration — IATF §7.1.5.1 NC risk`] : []),
              ...(calDue > 0 ? [`⚠️ ${calDue} instrument(s) due within 30 days — schedule calibration`] : []),
              ...(calibration.length === 0 ? ['No calibration records found — Cl. 7.1.5.1 evidence gap'] : []),
            ],
            evidence: [`${calibration.length} instruments registered`, calOverdue === 0 && calibration.length > 0 ? 'All instruments within calibration date' : '', 'Calibration module with due-date alerts active'].filter(Boolean),
          },
          {
            clause: 'Cl. 8', title: 'Operations — APQP, PPAP, Production',
            score: 78, status: 'amber',
            findings: ['PPAP submission records not digitally linked to complaints system','APQP gate review evidence not stored in complaints workflow'],
            evidence: ['APQP module with 5-phase tracking active','PPAP module with AI copilot active','PFMEA + Control Plan modules active','8D workflow for every complaint'],
          },
          {
            clause: 'Cl. 8.5', title: 'Production & Service Provision',
            score: criticalOpen.length > 0 ? 60 : open.length > 5 ? 72 : 85,
            status: criticalOpen.length > 0 ? 'red' : open.length > 5 ? 'amber' : 'green',
            findings: [
              ...(criticalOpen.length > 0 ? [`🚨 ${criticalOpen.length} CRITICAL complaint(s) open — containment must be verified`] : []),
              ...(open.length > 10 ? [`${open.length} open complaints — high backlog, customer satisfaction risk`] : []),
            ],
            evidence: [`${open.length} open complaints being tracked`, `${closed.length} complaints closed`, 'D3 Containment + D8 closure workflow enforced', 'Approval workflow before closure active'],
          },
          {
            clause: 'Cl. 9', title: 'Performance Evaluation — KPIs & MRM',
            score: reports && (reports as Record<string,unknown>).ppm !== undefined ? 83 : 65,
            status: reports && (reports as Record<string,unknown>).ppm !== undefined ? 'green' : 'amber',
            findings: reports ? [] : ['No KPI data available — management review inputs incomplete'],
            evidence: ['Management Review module with live KPI data','PPM tracking active','Complaint trend analytics with 6-month chart','SLA compliance monitoring active'],
          },
          {
            clause: 'Cl. 9.2', title: 'Internal Audit Program',
            score: 72, status: 'amber',
            findings: ['Annual audit schedule not yet digitalised in the system','Auditor competency records not linked to audit assignments'],
            evidence: ['Audit Tracker with NC management active','Finding severity classification (Major/Minor/OFI)','CAPA linking from audit NCs available'],
          },
          {
            clause: 'Cl. 10', title: 'Improvement — CAPA & Nonconformity',
            score: closureRate >= 70 ? 87 : closureRate >= 40 ? 72 : 55,
            status: closureRate >= 70 ? 'green' : closureRate >= 40 ? 'amber' : 'red',
            findings: [
              ...(closureRate < 40 ? [`Closure rate ${closureRate}% is low — CAPA effectiveness not demonstrated`] : []),
              ...(capa.length > 5 ? [`${capa.length} complaints in CAPA In Progress — verify timely closure`] : []),
            ],
            evidence: [`Closure rate: ${closureRate}%`, `${capa.length} CAPAs in progress`, '8D + 5-Why + CAPA workflow enforced', 'Timeline audit trail per IATF §7.5.3'],
          },
          {
            clause: 'Cl. 10.2', title: 'Nonconformity & Corrective Action',
            score: slaBreached === 0 && closureRate > 50 ? 85 : 65,
            status: slaBreached === 0 && closureRate > 50 ? 'green' : 'amber',
            findings: [
              ...(slaBreached > 0 ? [`${slaBreached} complaint(s) breaching response SLA — corrective action overdue`] : []),
            ],
            evidence: ['Digital approval workflow before closure','Rejection workflow with reason capture','QH sign-off mandatory for closure','Timeline auto-logged per §7.5.3'],
          },
        ];

        const overallScore = Math.round(clauses.reduce((s, c) => s + c.score, 0) / clauses.length);
        const green = clauses.filter(c => c.status === 'green').length;
        const amber = clauses.filter(c => c.status === 'amber').length;
        const red = clauses.filter(c => c.status === 'red').length;

        const statusColor = { green: 'bg-green-900/40 text-[#15803d] border-green-700/50', amber: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50', red: 'bg-red-50 text-red-600 border-red-700/50' };
        const statusLabel = { green: '✅ Ready', amber: '⚠️ Gaps', red: '🚨 NC Risk' };
        const barColor = { green: 'bg-green-500', amber: 'bg-yellow-400', red: 'bg-red-500' };

        return (
          <div className="p-4 bg-[#eff6ff] min-h-screen">
            <div className="max-w-5xl mx-auto space-y-4">

              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold">🤖 AI Audit Readiness Checker</h2>
                    <p className="text-indigo-700 text-xs mt-1">Live assessment of your IATF 16949 compliance across all 10 clause groups — powered by real QMOS data</p>
                  </div>
                  <button onClick={runReadinessCheck} disabled={readinessLoading}
                    className="bg-white text-indigo-100 hover:bg-indigo-900/30 font-bold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-60">
                    {readinessLoading ? '⟳ Scanning…' : readinessRun ? '↻ Re-scan' : '▶ Run Readiness Check'}
                  </button>
                </div>
              </div>

              {!readinessRun && (
                <div className="bg-white rounded-xl border-2 border-dashed border-[#dbeafe] p-16 text-center">
                  <div className="text-5xl mb-3">🔍</div>
                  <div className="font-semibold text-[#1e3a5f]">Click &quot;Run Readiness Check&quot; to scan your QMOS data</div>
                  <div className="text-[#1e3a5f] text-sm mt-1">Checks all 10 IATF 16949 clause groups against live complaints, calibration, and KPI data</div>
                </div>
              )}

              {readinessRun && (
                <>
                  {/* Overall Score */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Overall Readiness', value: `${overallScore}%`, color: overallScore >= 80 ? 'text-green-600' : overallScore >= 65 ? 'text-yellow-600' : 'text-red-600' },
                      { label: 'Clauses Ready ✅', value: green, color: 'text-green-600' },
                      { label: 'Gaps Found ⚠️', value: amber, color: 'text-yellow-600' },
                      { label: 'NC Risk 🚨', value: red, color: 'text-red-600' },
                    ].map(k => (
                      <div key={k.label} className="bg-white rounded-xl border border-[#dbeafe] p-4 text-center shadow-sm">
                        <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                        <div className="text-xs text-[#1e3a5f] mt-1">{k.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Clause Cards */}
                  <div className="space-y-3">
                    {clauses.map(c => (
                      <div key={c.clause} className="bg-white rounded-xl border border-[#dbeafe] p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor[c.status]}`}>{statusLabel[c.status]}</span>
                            <div>
                              <span className="text-xs font-bold text-[#1e3a5f]">{c.clause}</span>
                              <span className="font-semibold text-[#1e3a5f] text-sm ml-2">{c.title}</span>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${c.score >= 80 ? 'text-green-600' : c.score >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>{c.score}%</span>
                        </div>

                        {/* Score bar */}
                        <div className="w-full bg-white rounded-full h-1.5 mb-3">
                          <div className={`h-1.5 rounded-full transition-all ${barColor[c.status]}`} style={{ width: `${c.score}%` }} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {c.findings.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1">Gaps / Risks</div>
                              {c.findings.map((f, i) => (
                                <div key={i} className="text-xs text-red-700 bg-red-50 rounded px-2 py-1 mb-1 border border-red-100">{f}</div>
                              ))}
                            </div>
                          )}
                          {c.evidence.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold text-[#15803d] uppercase tracking-wide mb-1">Evidence Available</div>
                              {c.evidence.filter(Boolean).map((e, i) => (
                                <div key={i} className="text-xs text-[#15803d] bg-green-900/30 rounded px-2 py-1 mb-1 border border-green-800/50">✓ {e}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-[#1e3a5f] text-right pt-2">
                    IATF 16949:2016 — AI readiness assessment based on live QMOS data · Not a substitute for formal third-party audit
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      <QualityCopilot page="audit" />
    </div>
  );
}