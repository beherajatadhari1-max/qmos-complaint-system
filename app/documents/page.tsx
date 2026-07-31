'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type DocCategory = 'quality-manual' | 'procedure' | 'sop' | 'work-instruction' | 'form' | 'control-plan' | 'drawing' | 'standard' | 'report';
type DocStatus   = 'active' | 'under-revision' | 'obsolete' | 'draft';
type ReviewStatus = 'ok' | 'due-soon' | 'overdue';

interface RevisionEntry {
  rev: string;
  date: string;
  changedBy: string;
  approvedBy: string;
  changeDescription: string;
}

interface Document {
  id: string;
  docNumber: string;
  title: string;
  category: DocCategory;
  currentRev: string;
  effectiveDate: string;
  nextReviewDate: string;
  owner: string;
  approver: string;
  department: string;
  status: DocStatus;
  linkedProcesses: string[];
  linkedClauses: string[];
  retentionYears: number;
  distributionCount: number;
  revisionHistory: RevisionEntry[];
  notes: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const CAT_LABEL: Record<DocCategory, string> = {
  'quality-manual':   'Quality Manual',
  'procedure':        'Procedure',
  'sop':              'SOP',
  'work-instruction': 'Work Instruction',
  'form':             'Form / Record',
  'control-plan':     'Control Plan',
  'drawing':          'Drawing / Spec',
  'standard':         'Standard',
  'report':           'Report / Template',
};
const CAT_COLOR: Record<DocCategory, string> = {
  'quality-manual':   'text-purple-400 bg-purple-900/40',
  'procedure':        'text-blue-400 bg-blue-900/40',
  'sop':              'text-cyan-400 bg-cyan-900/40',
  'work-instruction': 'text-sky-400 bg-sky-900/40',
  'form':             'text-slate-400 bg-slate-700',
  'control-plan':     'text-emerald-400 bg-emerald-900/40',
  'drawing':          'text-yellow-400 bg-yellow-900/40',
  'standard':         'text-orange-400 bg-orange-900/40',
  'report':           'text-pink-400 bg-pink-900/40',
};
const DOC_STATUS_COLOR: Record<DocStatus, string> = {
  active:          'text-emerald-400 bg-emerald-900/30',
  'under-revision':'text-yellow-400 bg-yellow-900/30',
  obsolete:        'text-slate-500 bg-slate-800',
  draft:           'text-blue-400 bg-blue-900/30',
};
const REVIEW_COLOR: Record<ReviewStatus, string> = {
  ok:        'text-emerald-400',
  'due-soon':'text-yellow-400',
  overdue:   'text-red-400',
};

function reviewStatus(nextReviewDate: string): ReviewStatus {
  if (!nextReviewDate) return 'ok';
  const today = new Date();
  const review = new Date(nextReviewDate);
  const diffDays = Math.ceil((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 60) return 'due-soon';
  return 'ok';
}

function daysUntilReview(nextReviewDate: string): number {
  const today = new Date();
  const review = new Date(nextReviewDate);
  return Math.ceil((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_DOCS: Document[] = [
  {
    id: 'DOC-001', docNumber: 'QM-001', title: 'Quality Manual', category: 'quality-manual',
    currentRev: 'Rev 05', effectiveDate: '2024-01-15', nextReviewDate: '2025-01-15',
    owner: 'Quality Head', approver: 'Plant Head', department: 'Quality',
    status: 'active', linkedProcesses: ['All Processes'], linkedClauses: ['IATF 16949 — All Clauses'],
    retentionYears: 10, distributionCount: 12,
    revisionHistory: [
      { rev: 'Rev 05', date: '2024-01-15', changedBy: 'Quality Head', approvedBy: 'Plant Head', changeDescription: 'Updated scope — added new production line. Context of organisation reviewed.' },
      { rev: 'Rev 04', date: '2023-01-10', changedBy: 'Quality Manager', approvedBy: 'Plant Head', changeDescription: 'Revised quality policy. Added AI integration context.' },
      { rev: 'Rev 03', date: '2022-02-01', changedBy: 'MR', approvedBy: 'Plant Head', changeDescription: 'IATF re-certification update — addressed all audit findings from 2021 re-cert.' },
    ],
    notes: 'Review overdue — schedule with Plant Head this week.',
  },
  {
    id: 'DOC-002', docNumber: 'QP-001', title: 'Document Control Procedure', category: 'procedure',
    currentRev: 'Rev 03', effectiveDate: '2023-06-01', nextReviewDate: '2025-06-01',
    owner: 'MR / Quality Head', approver: 'Quality Head', department: 'Quality',
    status: 'active', linkedProcesses: ['Document Management'], linkedClauses: ['IATF 7.5'],
    retentionYears: 5, distributionCount: 8,
    revisionHistory: [
      { rev: 'Rev 03', date: '2023-06-01', changedBy: 'Quality Manager', approvedBy: 'Quality Head', changeDescription: 'Added digital document control flow. Obsolete document handling updated.' },
      { rev: 'Rev 02', date: '2022-01-10', changedBy: 'MR', approvedBy: 'Quality Head', changeDescription: 'Review period changed from 2 years to 1 year.' },
    ],
    notes: '',
  },
  {
    id: 'DOC-003', docNumber: 'QP-002', title: 'Internal Audit Procedure', category: 'procedure',
    currentRev: 'Rev 04', effectiveDate: '2024-03-01', nextReviewDate: '2025-03-01',
    owner: 'Lead Auditor', approver: 'Quality Head', department: 'Quality',
    status: 'active', linkedProcesses: ['Internal Audit'], linkedClauses: ['IATF 9.2', 'IATF 9.2.2'],
    retentionYears: 5, distributionCount: 6,
    revisionHistory: [
      { rev: 'Rev 04', date: '2024-03-01', changedBy: 'Lead Auditor', approvedBy: 'Quality Head', changeDescription: 'Added process audit methodology. Turtle diagram template added.' },
      { rev: 'Rev 03', date: '2023-01-15', changedBy: 'Lead Auditor', approvedBy: 'Quality Head', changeDescription: 'Audit checklist updated for IATF 2016 3rd edition.' },
    ],
    notes: '',
  },
  {
    id: 'DOC-004', docNumber: 'SOP-MFG-001', title: 'SOP — Bracket Assembly Operation 20', category: 'sop',
    currentRev: 'Rev 02', effectiveDate: '2024-08-10', nextReviewDate: '2025-08-10',
    owner: 'Manufacturing Engineer', approver: 'Quality Head', department: 'Manufacturing',
    status: 'active', linkedProcesses: ['Line-1 Op-20 Assembly'], linkedClauses: ['IATF 8.5.1', 'IATF 8.5.1.2'],
    retentionYears: 3, distributionCount: 4,
    revisionHistory: [
      { rev: 'Rev 02', date: '2024-08-10', changedBy: 'Mfg Engineer', approvedBy: 'Quality Head', changeDescription: 'Updated torque spec from 25 Nm to 28 Nm per ECN-441. Poka-yoke challenge added.' },
      { rev: 'Rev 01', date: '2023-06-01', changedBy: 'Mfg Engineer', approvedBy: 'Quality Head', changeDescription: 'Initial release.' },
    ],
    notes: '',
  },
  {
    id: 'DOC-005', docNumber: 'WI-WLD-003', title: 'Work Instruction — MIG Welding Station W-02', category: 'work-instruction',
    currentRev: 'Rev 01', effectiveDate: '2024-01-20', nextReviewDate: '2025-01-20',
    owner: 'Welding Engineer', approver: 'Manufacturing Head', department: 'Manufacturing',
    status: 'under-revision', linkedProcesses: ['Welding Op-30'], linkedClauses: ['IATF 8.5.1', 'IATF 8.5.1.1'],
    retentionYears: 3, distributionCount: 3,
    revisionHistory: [
      { rev: 'Rev 01', date: '2024-01-20', changedBy: 'Welding Engineer', approvedBy: 'Manufacturing Head', changeDescription: 'Initial release.' },
    ],
    notes: 'Under revision — adding wire-end interlock procedure post DT003 breakdown. Rev 02 expected by 25-Jan.',
  },
  {
    id: 'DOC-006', docNumber: 'CP-PN4521-001', title: 'Control Plan — PN-4521 Bracket Assembly', category: 'control-plan',
    currentRev: 'Rev 06', effectiveDate: '2024-11-01', nextReviewDate: '2025-11-01',
    owner: 'Quality Engineer', approver: 'Quality Head', department: 'Quality',
    status: 'active', linkedProcesses: ['Line-1 All Ops'], linkedClauses: ['IATF 8.5.1.1', 'AIAG APQP Phase 4'],
    retentionYears: 5, distributionCount: 7,
    revisionHistory: [
      { rev: 'Rev 06', date: '2024-11-01', changedBy: 'Quality Engineer', approvedBy: 'Quality Head', changeDescription: 'Updated torque characteristic to match ECN-441. Reaction plan updated for dimensional OOS.' },
      { rev: 'Rev 05', date: '2024-05-15', changedBy: 'Quality Engineer', approvedBy: 'Quality Head', changeDescription: 'Customer audit finding — added 100% visual check at final stage.' },
      { rev: 'Rev 04', date: '2023-08-01', changedBy: 'Quality Engineer', approvedBy: 'Quality Head', changeDescription: 'New poka-yoke device added at Op-20.' },
    ],
    notes: '',
  },
  {
    id: 'DOC-007', docNumber: 'FRM-IQC-001', title: 'Form — Incoming Inspection Report', category: 'form',
    currentRev: 'Rev 03', effectiveDate: '2024-04-01', nextReviewDate: '2026-04-01',
    owner: 'IQC Supervisor', approver: 'Quality Head', department: 'Quality',
    status: 'active', linkedProcesses: ['Incoming Quality Control'], linkedClauses: ['IATF 8.4.2', 'IATF 8.6'],
    retentionYears: 3, distributionCount: 5,
    revisionHistory: [
      { rev: 'Rev 03', date: '2024-04-01', changedBy: 'IQC Supervisor', approvedBy: 'Quality Head', changeDescription: 'Added AQL sampling plan column and lot traceability field.' },
      { rev: 'Rev 02', date: '2022-10-01', changedBy: 'Quality Manager', approvedBy: 'Quality Head', changeDescription: 'Added supplier lot number and invoice number fields.' },
    ],
    notes: '',
  },
  {
    id: 'DOC-008', docNumber: 'STD-MSA-001', title: 'MSA Study Report Template', category: 'standard',
    currentRev: 'Rev 02', effectiveDate: '2023-09-01', nextReviewDate: '2025-09-01',
    owner: 'Metrology Engineer', approver: 'Quality Head', department: 'Quality',
    status: 'active', linkedProcesses: ['MSA / Gauge R&R'], linkedClauses: ['IATF 7.1.5.1', 'AIAG MSA 4th Ed.'],
    retentionYears: 5, distributionCount: 3,
    revisionHistory: [
      { rev: 'Rev 02', date: '2023-09-01', changedBy: 'Metrology Engineer', approvedBy: 'Quality Head', changeDescription: 'Updated to AIAG MSA 4th edition format. Added Attribute Agreement Analysis section.' },
    ],
    notes: '',
  },
  {
    id: 'DOC-009', docNumber: 'QP-010', title: 'CAPA Procedure', category: 'procedure',
    currentRev: 'Rev 05', effectiveDate: '2024-07-01', nextReviewDate: '2025-07-01',
    owner: 'Quality Head', approver: 'Plant Head', department: 'Quality',
    status: 'active', linkedProcesses: ['Corrective Action', 'Problem Solving'], linkedClauses: ['IATF 10.2', 'IATF 10.2.1'],
    retentionYears: 5, distributionCount: 10,
    revisionHistory: [
      { rev: 'Rev 05', date: '2024-07-01', changedBy: 'Quality Head', approvedBy: 'Plant Head', changeDescription: '8D template integrated. Effectiveness verification timeline tightened to 30 days.' },
      { rev: 'Rev 04', date: '2023-02-01', changedBy: 'Quality Manager', approvedBy: 'Quality Head', changeDescription: 'Added customer-complaint escalation path. Linked to supplier SCAR procedure.' },
    ],
    notes: '',
  },
  {
    id: 'DOC-010', docNumber: 'DRW-PN7823-C', title: 'Engineering Drawing — PN-7823 Housing Cover Rev C', category: 'drawing',
    currentRev: 'Rev C', effectiveDate: '2024-06-15', nextReviewDate: '2026-06-15',
    owner: 'Design Engineering', approver: 'Chief Engineer', department: 'Engineering',
    status: 'active', linkedProcesses: ['Line-2 Manufacturing'], linkedClauses: ['IATF 8.3', 'Customer GD&T Spec'],
    retentionYears: 10, distributionCount: 9,
    revisionHistory: [
      { rev: 'Rev C', date: '2024-06-15', changedBy: 'Design Eng.', approvedBy: 'Chief Engineer', changeDescription: 'Wall thickness increased from 3.0 to 3.5 mm at rib section per FEA analysis. Tol on bore tightened.' },
      { rev: 'Rev B', date: '2023-04-01', changedBy: 'Design Eng.', approvedBy: 'Chief Engineer', changeDescription: 'Sealing groove radius changed per customer ECN-229.' },
      { rev: 'Rev A', date: '2022-01-10', changedBy: 'Design Eng.', approvedBy: 'Chief Engineer', changeDescription: 'Initial release.' },
    ],
    notes: '',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Document Register
// ══════════════════════════════════════════════════════════════════════════════
function DocumentRegisterTab({ docs }: { docs: Document[] }) {
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const departments = useMemo(() => ['all', ...Array.from(new Set(docs.map(d => d.department)))], [docs]);

  const filtered = useMemo(() =>
    docs.filter(d =>
      (filterCat === 'all' || d.category === filterCat) &&
      (filterStatus === 'all' || d.status === filterStatus) &&
      (filterDept === 'all' || d.department === filterDept) &&
      (search === '' || d.title.toLowerCase().includes(search.toLowerCase()) || d.docNumber.toLowerCase().includes(search.toLowerCase()))
    ), [docs, filterCat, filterStatus, filterDept, search]);

  const summary = useMemo(() => ({
    total: docs.length,
    active: docs.filter(d => d.status === 'active').length,
    underRevision: docs.filter(d => d.status === 'under-revision').length,
    overdue: docs.filter(d => reviewStatus(d.nextReviewDate) === 'overdue').length,
    dueSoon: docs.filter(d => reviewStatus(d.nextReviewDate) === 'due-soon').length,
  }), [docs]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Docs', val: summary.total, cls: 'text-white' },
          { label: 'Active', val: summary.active, cls: 'text-emerald-400' },
          { label: 'Under Revision', val: summary.underRevision, cls: 'text-yellow-400' },
          { label: 'Review Overdue', val: summary.overdue, cls: 'text-red-400' },
          { label: 'Due Soon (60d)', val: summary.dueSoon, cls: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or doc number…"
          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 w-52 focus:ring-2 focus:ring-blue-500 outline-none" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Categories</option>
          {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="under-revision">Under Revision</option>
          <option value="draft">Draft</option>
          <option value="obsolete">Obsolete</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Document cards */}
      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500">No documents match filters. Load sample data to begin.</div>}
        {filtered.map(doc => {
          const rs = reviewStatus(doc.nextReviewDate);
          const days = daysUntilReview(doc.nextReviewDate);
          const isOpen = expanded === doc.id;
          return (
            <div key={doc.id} className={`bg-slate-800 rounded-xl border overflow-hidden ${doc.status === 'under-revision' ? 'border-yellow-700/50' : 'border-slate-700'}`}>
              <button className="w-full text-left p-4 hover:bg-slate-700/30 transition-colors" onClick={() => setExpanded(isOpen ? null : doc.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{doc.docNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${CAT_COLOR[doc.category]}`}>{CAT_LABEL[doc.category]}</span>
                  <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">{doc.title}</span>
                  <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${DOC_STATUS_COLOR[doc.status]}`}>{doc.status.replace('-', ' ').toUpperCase()}</span>
                    <span className="text-xs text-slate-400 font-mono">{doc.currentRev}</span>
                    <span className={`text-xs font-medium ${REVIEW_COLOR[rs]}`}>
                      {rs === 'overdue' ? `⚠ ${Math.abs(days)}d overdue` : rs === 'due-soon' ? `⏰ ${days}d` : '✓'}
                    </span>
                    <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-slate-500">
                  <span>Owner: {doc.owner}</span>
                  <span>Dept: {doc.department}</span>
                  <span>Effective: {doc.effectiveDate}</span>
                  <span>Next Review: <span className={REVIEW_COLOR[rs]}>{doc.nextReviewDate}</span></span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 p-4 space-y-4">
                  {/* Details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { l: 'Approver', v: doc.approver },
                      { l: 'Retention', v: `${doc.retentionYears} years` },
                      { l: 'Distribution', v: `${doc.distributionCount} holders` },
                      { l: 'Linked Clauses', v: doc.linkedClauses.join(', ') },
                    ].map(d => (
                      <div key={d.l} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500">{d.l}</div>
                        <div className="text-white text-xs mt-0.5">{d.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Linked processes */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Linked Processes</div>
                    <div className="flex flex-wrap gap-2">
                      {doc.linkedProcesses.map(p => (
                        <span key={p} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </div>

                  {/* Revision history */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Revision History</div>
                    <div className="space-y-2">
                      {doc.revisionHistory.map((r, i) => (
                        <div key={i} className={`rounded-lg p-3 text-sm ${i === 0 ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-slate-900/50'}`}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-xs font-bold font-mono ${i === 0 ? 'text-blue-400' : 'text-slate-400'}`}>{r.rev}</span>
                            <span className="text-xs text-slate-500">{r.date}</span>
                            <span className="text-xs text-slate-400">By: {r.changedBy}</span>
                            <span className="text-xs text-slate-400">Approved: {r.approvedBy}</span>
                            {i === 0 && <span className="text-xs bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded">CURRENT</span>}
                          </div>
                          <div className="text-xs text-slate-300">{r.changeDescription}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {doc.notes && (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-xs text-yellow-300">📝 {doc.notes}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Review Alerts
// ══════════════════════════════════════════════════════════════════════════════
function ReviewAlertsTab({ docs }: { docs: Document[] }) {
  const overdue = useMemo(() => docs.filter(d => reviewStatus(d.nextReviewDate) === 'overdue' && d.status !== 'obsolete')
    .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()), [docs]);
  const dueSoon = useMemo(() => docs.filter(d => reviewStatus(d.nextReviewDate) === 'due-soon' && d.status !== 'obsolete')
    .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()), [docs]);
  const underRevision = useMemo(() => docs.filter(d => d.status === 'under-revision'), [docs]);

  function DocAlertCard({ doc, variant }: { doc: Document; variant: 'overdue' | 'due-soon' | 'revision' }) {
    const days = daysUntilReview(doc.nextReviewDate);
    const colors = {
      overdue:  { border: 'border-red-700/50', bg: 'bg-red-900/10', badge: 'text-red-400 bg-red-900/40' },
      'due-soon': { border: 'border-yellow-700/50', bg: 'bg-yellow-900/10', badge: 'text-yellow-400 bg-yellow-900/40' },
      revision: { border: 'border-yellow-700/50', bg: 'bg-yellow-900/10', badge: 'text-yellow-400 bg-yellow-900/40' },
    }[variant];

    return (
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{doc.docNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${CAT_COLOR[doc.category]}`}>{CAT_LABEL[doc.category]}</span>
            </div>
            <div className="text-sm font-medium text-white">{doc.title}</div>
            <div className="text-xs text-slate-400 mt-1">Owner: {doc.owner} · {doc.department}</div>
          </div>
          <div className="text-right shrink-0">
            {variant !== 'revision' ? (
              <>
                <div className={`text-lg font-bold ${variant === 'overdue' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {variant === 'overdue' ? `${Math.abs(days)}d overdue` : `${days}d left`}
                </div>
                <div className="text-xs text-slate-500">Review date: {doc.nextReviewDate}</div>
              </>
            ) : (
              <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 px-2 py-1 rounded">Under Revision</span>
            )}
          </div>
        </div>
        {doc.notes && <div className="mt-2 text-xs text-slate-400 italic">{doc.notes}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          <h3 className="font-semibold text-white">Review Overdue ({overdue.length})</h3>
        </div>
        {overdue.length === 0
          ? <div className="text-sm text-slate-500 bg-slate-800 rounded-lg p-4 border border-slate-700">No overdue documents.</div>
          : <div className="space-y-2">{overdue.map(d => <DocAlertCard key={d.id} doc={d} variant="overdue" />)}</div>
        }
      </div>

      {/* Due soon */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
          <h3 className="font-semibold text-white">Due for Review Within 60 Days ({dueSoon.length})</h3>
        </div>
        {dueSoon.length === 0
          ? <div className="text-sm text-slate-500 bg-slate-800 rounded-lg p-4 border border-slate-700">No documents due soon.</div>
          : <div className="space-y-2">{dueSoon.map(d => <DocAlertCard key={d.id} doc={d} variant="due-soon" />)}</div>
        }
      </div>

      {/* Under revision */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
          <h3 className="font-semibold text-white">Under Revision ({underRevision.length})</h3>
        </div>
        {underRevision.length === 0
          ? <div className="text-sm text-slate-500 bg-slate-800 rounded-lg p-4 border border-slate-700">No documents currently under revision.</div>
          : <div className="space-y-2">{underRevision.map(d => <DocAlertCard key={d.id} doc={d} variant="revision" />)}</div>
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Knowledge Hub
// ══════════════════════════════════════════════════════════════════════════════
function KnowledgeHubTab() {
  const iatfClauses = [
    { clause: '7.5.1', title: 'General — Documented information', key: 'QMS shall include documented information required by IATF + any additional documented information the organisation determines is necessary for effectiveness.' },
    { clause: '7.5.2', title: 'Creating and updating', key: 'When creating/updating documented information: identification, format, media, review and approval for suitability and adequacy must be ensured.' },
    { clause: '7.5.3.1', title: 'Control of documented information', key: 'Documented information shall be available and suitable for use, where and when needed, and adequately protected (confidentiality, integrity, use).' },
    { clause: '7.5.3.2', title: 'Control activities — distribution, access', key: 'Control of documented information shall address: distribution, access, retrieval and use, storage and preservation, control of changes, retention and disposition.' },
  ];

  const docHierarchy = [
    { level: 'Level 1', name: 'Quality Manual', icon: '📗', desc: 'Describes the QMS scope, policy, objectives, and the organisation\'s context. References all lower-level documents.', examples: ['Quality Manual (QM-001)', 'Quality Policy', 'Organisation Chart'] },
    { level: 'Level 2', name: 'Procedures', icon: '📘', desc: 'Describes WHAT is done, WHO does it, WHEN, and WHERE. Cross-functional process description.', examples: ['Document Control Procedure', 'Internal Audit Procedure', 'CAPA Procedure', 'Supplier Control Procedure'] },
    { level: 'Level 3', name: 'SOPs & Work Instructions', icon: '📙', desc: 'Describes HOW a specific task is performed. Step-by-step at workstation level. Used by operators.', examples: ['SOP — Assembly Op-20', 'WI — Welding Parameters', 'ODS — Visual Defect Standard'] },
    { level: 'Level 4', name: 'Forms, Records & Data', icon: '📄', desc: 'Objective evidence that the process was followed. Filled and retained per retention schedule.', examples: ['Inspection Reports', 'Audit Checklists', 'NCR Forms', 'Calibration Records', 'Training Records'] },
  ];

  const retentionRules = [
    { doc: 'Quality Records (general)', retention: '3 years minimum', iatf: '7.5.3.2' },
    { doc: 'Production Records (traceability)', retention: '1 year after last production or customer requirement', iatf: '8.5.2' },
    { doc: 'PPAP Records', retention: '1 year after product discontinuation', iatf: '8.3.4.4' },
    { doc: 'Calibration Records', retention: '3 years or instrument life', iatf: '7.1.5.1' },
    { doc: 'Internal Audit Records', retention: '3 years', iatf: '9.2' },
    { doc: 'Management Review Records', retention: '3 years', iatf: '9.3' },
    { doc: 'Training Records', retention: 'Duration of employment + 3 years', iatf: '7.2' },
    { doc: 'Customer-specific records', retention: 'Per customer requirement (often 15+ years for safety parts)', iatf: 'CSR' },
  ];

  const auditFindings = [
    'Obsolete documents found at workstation — not replaced with current revision',
    'No evidence of document approval before issuance',
    'Revision history incomplete — change description missing',
    'Document review period elapsed — no review conducted',
    'External documents (customer drawings, standards) not controlled in register',
    'Forms in use are not the latest approved revision',
    'Records not retained for the required retention period',
    'No distribution list — cannot confirm all holders received updated document',
  ];

  return (
    <div className="space-y-6">
      {/* IATF Clauses */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">📋 IATF 16949 Cl. 7.5 — Documented Information</h3>
        <div className="space-y-3">
          {iatfClauses.map(c => (
            <div key={c.clause} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Cl. {c.clause}</span>
                <span className="font-medium text-white text-sm">{c.title}</span>
              </div>
              <p className="text-sm text-slate-400">{c.key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Document Hierarchy */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">🏛️ Document Hierarchy — 4 Levels</h3>
        <div className="space-y-3">
          {docHierarchy.map(l => (
            <div key={l.level} className="bg-slate-900/50 rounded-lg p-4 flex gap-4">
              <div className="text-2xl">{l.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">{l.level}</span>
                  <span className="font-medium text-white text-sm">{l.name}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{l.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {l.examples.map(e => <span key={e} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{e}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Schedule */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">🗓 Record Retention Schedule (IATF 7.5.3.2)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs text-slate-500 py-2 pr-4">Document / Record Type</th>
                <th className="text-left text-xs text-slate-500 py-2 pr-4">Minimum Retention</th>
                <th className="text-left text-xs text-slate-500 py-2">IATF Clause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {retentionRules.map(r => (
                <tr key={r.doc} className="hover:bg-slate-700/20">
                  <td className="py-2.5 pr-4 text-slate-300">{r.doc}</td>
                  <td className="py-2.5 pr-4 text-white">{r.retention}</td>
                  <td className="py-2.5 text-xs text-slate-400">{r.iatf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Audit Findings */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">⚠️ Common IATF Audit Findings — Document Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {auditFindings.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm bg-red-900/10 border border-red-800/30 rounded-lg p-3">
              <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
              <span className="text-slate-300">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Document Control Guide
// ══════════════════════════════════════════════════════════════════════════════
function DocControlGuideTab() {
  const steps = [
    { no: '01', icon: '✏️', title: 'Document Creation', points: ['Identify need for new document — process change, new requirement, audit finding, or customer requirement', 'Assign document number per numbering convention (e.g. QP-XXX, SOP-MFG-XXX)', 'Draft document using approved template — include: title, number, revision, effective date, scope, process owner', 'Ensure document covers the process completely — what, who, when, how, inputs, outputs, records', 'Route for technical review by subject matter expert before approval', 'Obtain approver signature / digital approval before issuance'] },
    { no: '02', icon: '✅', title: 'Document Approval & Issuance', points: ['Approved document to be added to Document Master Register with all details', 'Assign revision (Rev 01 / Rev A for new document)', 'Distribute to all relevant holders per distribution list', 'Confirm receipt and acknowledgement from all holders', 'Post at workstation / quality notice board if applicable', 'Soft copy to be uploaded to document control system / shared drive'] },
    { no: '03', icon: '🔄', title: 'Document Revision', points: ['Raise Document Change Request (DCR) with reason for change', 'Obtain change approval before editing document (especially for Level 1 & 2 documents)', 'Update document: increment revision number, update date, add change description in revision history', 'Get re-approval from approver for revised document', 'Distribute revised version to all holders — replace old version immediately', 'Old revision to be marked OBSOLETE and removed from workstation within 24 hours'] },
    { no: '04', icon: '🗑️', title: 'Obsolete Document Control', points: ['Mark obsolete documents clearly: "OBSOLETE — Do Not Use"', 'Remove all physical copies from workstations and distribution points', 'Retain one master copy of each obsolete revision for reference (stored separately)', 'Update Document Register: change status to Obsolete with obsolescence date', 'Obsolete soft copies to be moved to archive folder — not deleted', 'For legal / customer records: retain per retention schedule even if obsolete'] },
    { no: '05', icon: '📅', title: 'Periodic Review', points: ['Review all controlled documents at least once per year (or per defined frequency)', 'Check: is the document still accurate? Have process, equipment, or requirements changed?', 'If no change needed: record review date and confirm document remains valid', 'If change needed: raise DCR and follow revision process', 'Review overdue documents are a Major NC risk in IATF audit', 'Assign document review responsibility to process owner — not just quality team'] },
    { no: '06', icon: '📋', title: 'External Documents', points: ['External documents (customer drawings, IATF standard, AIAG manuals, national standards) must be listed in Document Register', 'Track revision status of external documents — update when new edition released', 'Customer Engineering Change Notices (ECNs) to be processed immediately through document change control', 'Do not use superseded customer drawings at workstation', 'Maintain evidence of current-revision customer documents at all times'] },
    { no: '07', icon: '🔍', title: 'Document Audit & Compliance', points: ['Conduct document audit at each process during internal audit — check workstation SOP, WI, ODS are current revision', 'Verify document number, revision, and effective date match master register', 'Check for any handwritten annotations or unapproved changes on controlled documents', 'Confirm records are being filled as required by the document', 'Report document control findings in audit report with corrective action', 'Track document compliance as a QMS KPI: % documents reviewed on time'] },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">7-step document control process — from creation through approval, revision, obsolete control, periodic review, external documents, and compliance audit. Aligned to IATF 16949 Cl. 7.5.</p>
      </div>
      {steps.map(step => (
        <div key={step.no} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-slate-300">{step.no}</div>
            <div className="text-xl">{step.icon}</div>
            <h3 className="font-semibold text-white">{step.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {step.points.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-slate-400 mt-0.5 shrink-0">→</span>
                <span className="text-slate-300">{p}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loaded, setLoaded] = useState(false);

  const headerStats = useMemo(() => {
    const overdue = docs.filter(d => reviewStatus(d.nextReviewDate) === 'overdue' && d.status !== 'obsolete').length;
    const dueSoon = docs.filter(d => reviewStatus(d.nextReviewDate) === 'due-soon' && d.status !== 'obsolete').length;
    const underRev = docs.filter(d => d.status === 'under-revision').length;
    return { total: docs.length, overdue, dueSoon, underRev };
  }, [docs]);

  const tabs = ['📋 Document Register', '🔔 Review Alerts', '📚 Knowledge Hub', '📖 Doc Control Guide'];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">📄</span>
                <h1 className="text-2xl font-bold text-white">Document Management</h1>
              </div>
              <p className="text-slate-400 text-sm">Controlled Documents · Revision History · Review Alerts · Obsolete Control · IATF 7.5</p>
            </div>
            <button
              onClick={() => { if (!loaded) { setDocs(SAMPLE_DOCS); setLoaded(true); } else { setDocs([]); setLoaded(false); } }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>

          {/* Header KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Total Documents', value: docs.length > 0 ? `${headerStats.total}` : '—', color: 'text-white', sub: 'In register' },
              { label: 'Review Overdue', value: docs.length > 0 ? `${headerStats.overdue}` : '—', color: headerStats.overdue > 0 ? 'text-red-400' : 'text-emerald-400', sub: 'Action required' },
              { label: 'Due Within 60 Days', value: docs.length > 0 ? `${headerStats.dueSoon}` : '—', color: headerStats.dueSoon > 0 ? 'text-yellow-400' : 'text-emerald-400', sub: 'Schedule review' },
              { label: 'Under Revision', value: docs.length > 0 ? `${headerStats.underRev}` : '—', color: headerStats.underRev > 0 ? 'text-yellow-400' : 'text-emerald-400', sub: 'In-progress changes' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-600 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-slate-400 text-slate-300' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <DocumentRegisterTab docs={docs} />}
        {activeTab === 1 && <ReviewAlertsTab docs={docs} />}
        {activeTab === 2 && <KnowledgeHubTab />}
        {activeTab === 3 && <DocControlGuideTab />}
      </div>
    </div>
  );
}
