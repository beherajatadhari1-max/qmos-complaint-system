'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ---------------------------------------------------------------------
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

// -- Helpers -------------------------------------------------------------------
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
  'quality-manual':   'text-purple-600 bg-purple-900/30',
  'procedure':        'text-blue-600 bg-[#eff6ff]',
  'sop':              'text-cyan-600 bg-cyan-900/30',
  'work-instruction': 'text-sky-400 bg-sky-900/40',
  'form':             'text-[#1e3a5f] bg-[#dbeafe]',
  'control-plan':     'text-emerald-600 bg-emerald-50',
  'drawing':          'text-yellow-600 bg-yellow-900/30',
  'standard':         'text-orange-600 bg-orange-900/30',
  'report':           'text-pink-600 bg-pink-50',
};
const DOC_STATUS_COLOR: Record<DocStatus, string> = {
  active:          'text-emerald-600 bg-emerald-50',
  'under-revision':'text-yellow-600 bg-yellow-900/30/30',
  obsolete:        'text-[#1e3a5f] bg-white',
  draft:           'text-blue-600 bg-[#eff6ff]',
};
const REVIEW_COLOR: Record<ReviewStatus, string> = {
  ok:        'text-emerald-600',
  'due-soon':'text-yellow-600',
  overdue:   'text-red-600',
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

// -- Sample Data ---------------------------------------------------------------
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
      <>
      <PageTitle title="Documents" />
      <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Docs', val: summary.total, cls: 'text-[#1e3a5f]' },
          { label: 'Active', val: summary.active, cls: 'text-emerald-600' },
          { label: 'Under Revision', val: summary.underRevision, cls: 'text-yellow-600' },
          { label: 'Review Overdue', val: summary.overdue, cls: 'text-red-600' },
          { label: 'Due Soon (60d)', val: summary.dueSoon, cls: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-3 border border-[#dbeafe] text-center">
            <div className="text-xs text-[#1e3a5f]">{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or doc number…"
          className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2 w-52 focus:ring-2 focus:ring-blue-500 outline-none" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          <option value="all">All Categories</option>
          {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="under-revision">Under Revision</option>
          <option value="draft">Draft</option>
          <option value="obsolete">Obsolete</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
        <span className="text-xs text-[#1e3a5f] ml-auto">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Document cards */}
      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-center py-12 text-[#1e3a5f]">No documents match filters. Load sample data to begin.</div>}
        {filtered.map(doc => {
          const rs = reviewStatus(doc.nextReviewDate);
          const days = daysUntilReview(doc.nextReviewDate);
          const isOpen = expanded === doc.id;
          return (
            <div key={doc.id} className={`bg-white rounded-xl border overflow-hidden ${doc.status === 'under-revision' ? 'border-yellow-700/50' : 'border-[#dbeafe]'}`}>
              <button className="w-full text-left p-4 hover:bg-white transition-colors" onClick={() => setExpanded(isOpen ? null : doc.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono bg-[#dbeafe] text-[#1e3a5f] px-2 py-0.5 rounded">{doc.docNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${CAT_COLOR[doc.category]}`}>{CAT_LABEL[doc.category]}</span>
                  <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">{doc.title}</span>
                  <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${DOC_STATUS_COLOR[doc.status]}`}>{doc.status.replace('-', ' ').toUpperCase()}</span>
                    <span className="text-xs text-[#1e3a5f] font-mono">{doc.currentRev}</span>
                    <span className={`text-xs font-medium ${REVIEW_COLOR[rs]}`}>
                      {rs === 'overdue' ? `⚠ ${Math.abs(days)}d overdue` : rs === 'due-soon' ? `⏰ ${days}d` : '✓'}
                    </span>
                    <span className="text-[#1e3a5f]">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-[#1e3a5f]">
                  <span>Owner: {doc.owner}</span>
                  <span>Dept: {doc.department}</span>
                  <span>Effective: {doc.effectiveDate}</span>
                  <span>Next Review: <span className={REVIEW_COLOR[rs]}>{doc.nextReviewDate}</span></span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[#dbeafe] p-4 space-y-4">
                  {/* Details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { l: 'Approver', v: doc.approver },
                      { l: 'Retention', v: `${doc.retentionYears} years` },
                      { l: 'Distribution', v: `${doc.distributionCount} holders` },
                      { l: 'Linked Clauses', v: doc.linkedClauses.join(', ') },
                    ].map(d => (
                      <div key={d.l} className="bg-[#eff6ff] rounded-lg p-3">
                        <div className="text-xs text-[#1e3a5f]">{d.l}</div>
                        <div className="text-white text-xs mt-0.5">{d.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Linked processes */}
                  <div>
                    <div className="text-xs text-[#1e3a5f] mb-2">Linked Processes</div>
                    <div className="flex flex-wrap gap-2">
                      {doc.linkedProcesses.map(p => (
                        <span key={p} className="text-xs bg-[#dbeafe] text-[#1e3a5f] px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </div>

                  {/* Revision history */}
                  <div>
                    <div className="text-xs text-[#1e3a5f] mb-2 uppercase tracking-wide">Revision History</div>
                    <div className="space-y-2">
                      {doc.revisionHistory.map((r, i) => (
                        <div key={i} className={`rounded-lg p-3 text-sm ${i === 0 ? 'bg-[#eff6ff] border border-blue-700/50' : 'bg-[#eff6ff]'}`}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-xs font-bold font-mono ${i === 0 ? 'text-blue-600' : 'text-[#1e3a5f]'}`}>{r.rev}</span>
                            <span className="text-xs text-[#1e3a5f]">{r.date}</span>
                            <span className="text-xs text-[#1e3a5f]">By: {r.changedBy}</span>
                            <span className="text-xs text-[#1e3a5f]">Approved: {r.approvedBy}</span>
                            {i === 0 && <span className="text-xs bg-[#eff6ff] text-blue-600 px-1.5 py-0.5 rounded">CURRENT</span>}
                          </div>
                          <div className="text-xs text-[#1e3a5f]">{r.changeDescription}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {doc.notes && (
                    <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-3 text-xs text-yellow-300">📝 {doc.notes}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
      </>
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
      overdue:  { border: 'border-red-700/50', bg: 'bg-red-900/10', badge: 'text-red-600 bg-red-50' },
      'due-soon': { border: 'border-yellow-700/50', bg: 'bg-yellow-900/30/10', badge: 'text-yellow-600 bg-yellow-900/30' },
      revision: { border: 'border-yellow-700/50', bg: 'bg-yellow-900/30/10', badge: 'text-yellow-600 bg-yellow-900/30' },
    }[variant];

    return (
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-[#dbeafe] text-[#1e3a5f] px-2 py-0.5 rounded">{doc.docNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${CAT_COLOR[doc.category]}`}>{CAT_LABEL[doc.category]}</span>
            </div>
            <div className="text-sm font-medium text-white">{doc.title}</div>
            <div className="text-xs text-[#1e3a5f] mt-1">Owner: {doc.owner} · {doc.department}</div>
          </div>
          <div className="text-right shrink-0">
            {variant !== 'revision' ? (
              <>
                <div className={`text-lg font-bold ${variant === 'overdue' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {variant === 'overdue' ? `${Math.abs(days)}d overdue` : `${days}d left`}
                </div>
                <div className="text-xs text-[#1e3a5f]">Review date: {doc.nextReviewDate}</div>
              </>
            ) : (
              <span className="text-xs bg-yellow-900/30 text-yellow-600 border border-yellow-700/50 px-2 py-1 rounded">Under Revision</span>
            )}
          </div>
        </div>
        {doc.notes && <div className="mt-2 text-xs text-[#1e3a5f] italic">{doc.notes}</div>}
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
          ? <div className="text-sm text-[#1e3a5f] bg-white rounded-lg p-4 border border-[#dbeafe]">No overdue documents.</div>
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
          ? <div className="text-sm text-[#1e3a5f] bg-white rounded-lg p-4 border border-[#dbeafe]">No documents due soon.</div>
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
          ? <div className="text-sm text-[#1e3a5f] bg-white rounded-lg p-4 border border-[#dbeafe]">No documents currently under revision.</div>
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
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">📋 IATF 16949 Cl. 7.5 — Documented Information</h3>
        <div className="space-y-3">
          {iatfClauses.map(c => (
            <div key={c.clause} className="bg-[#eff6ff] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold bg-[#dbeafe] text-[#1e3a5f] px-2 py-0.5 rounded">Cl. {c.clause}</span>
                <span className="font-medium text-white text-sm">{c.title}</span>
              </div>
              <p className="text-sm text-[#1e3a5f]">{c.key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Document Hierarchy */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">🏛️ Document Hierarchy — 4 Levels</h3>
        <div className="space-y-3">
          {docHierarchy.map(l => (
            <div key={l.level} className="bg-[#eff6ff] rounded-lg p-4 flex gap-4">
              <div className="text-2xl">{l.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#1e3a5f]">{l.level}</span>
                  <span className="font-medium text-white text-sm">{l.name}</span>
                </div>
                <p className="text-xs text-[#1e3a5f] mb-2">{l.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {l.examples.map(e => <span key={e} className="text-xs bg-[#dbeafe] text-[#1e3a5f] px-2 py-0.5 rounded">{e}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Schedule */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">🗓 Record Retention Schedule (IATF 7.5.3.2)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dbeafe]">
                <th className="text-left text-xs text-[#1e3a5f] py-2 pr-4">Document / Record Type</th>
                <th className="text-left text-xs text-[#1e3a5f] py-2 pr-4">Minimum Retention</th>
                <th className="text-left text-xs text-[#1e3a5f] py-2">IATF Clause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {retentionRules.map(r => (
                <tr key={r.doc} className="hover:bg-[#dbeafe]/20">
                  <td className="py-2.5 pr-4 text-[#1e3a5f]">{r.doc}</td>
                  <td className="py-2.5 pr-4 text-white">{r.retention}</td>
                  <td className="py-2.5 text-xs text-[#1e3a5f]">{r.iatf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Audit Findings */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">⚠️ Common IATF Audit Findings — Document Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {auditFindings.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm bg-red-900/10 border border-red-800/30 rounded-lg p-3">
              <span className="text-red-600 mt-0.5 shrink-0">⚠</span>
              <span className="text-[#1e3a5f]">{f}</span>
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
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
        <p className="text-sm text-[#1e3a5f]">7-step document control process — from creation through approval, revision, obsolete control, periodic review, external documents, and compliance audit. Aligned to IATF 16949 Cl. 7.5.</p>
      </div>
      {steps.map(step => (
        <div key={step.no} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#dbeafe] border border-[#dbeafe] flex items-center justify-center text-sm font-bold text-[#1e3a5f]">{step.no}</div>
            <div className="text-xl">{step.icon}</div>
            <h3 className="font-semibold text-white">{step.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {step.points.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[#1e3a5f] mt-0.5 shrink-0">→</span>
                <span className="text-[#1e3a5f]">{p}</span>
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
// -- Document Dashboard Tab ----------------------------------------------------
function DocumentDashboardTab({ docs }: { docs: Document[] }) {
  const total      = docs.length;
  const active     = docs.filter(d=>d.status==='active').length;
  const underRev   = docs.filter(d=>d.status==='under-revision').length;
  const obsolete   = docs.filter(d=>d.status==='obsolete').length;
  const overdue    = docs.filter(d=>reviewStatus(d.nextReviewDate)==='overdue'&&d.status!=='obsolete').length;
  const dueSoon    = docs.filter(d=>reviewStatus(d.nextReviewDate)==='due-soon'&&d.status!=='obsolete').length;
  const iatfLinked = docs.filter(d=>d.linkedClauses&&d.linkedClauses.length>0).length;
  const iatfRate   = total>0 ? Math.round((iatfLinked/total)*100) : 0;
  const reviewCompliance = total>0 ? Math.round(((total-overdue)/total)*100) : 100;

  // By category
  const byCat: Record<string,number> = {};
  docs.forEach(d=>{ byCat[d.category]=(byCat[d.category]??0)+1; });
  const catData = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const CAT_LABELS: Record<string,string> = {
    'quality-manual':'Quality Manual','procedure':'Procedures','sop':'SOPs',
    'work-instruction':'Work Instructions','control-plan':'Control Plans',
    'format':'Forms/Formats','policy':'Policies','drawing':'Drawings','other':'Other',
  };
  const CAT_COLORS = ['bg-blue-600','bg-purple-600','bg-teal-600','bg-orange-600','bg-red-600','bg-pink-600','bg-indigo-600','bg-cyan-600','bg-slate-600'];
  const maxCat = Math.max(...catData.map(c=>c[1]),1);

  // Overdue docs list
  const overdueDocs = docs.filter(d=>reviewStatus(d.nextReviewDate)==='overdue'&&d.status!=='obsolete')
    .sort((a,b)=>daysUntilReview(a.nextReviewDate)-daysUntilReview(b.nextReviewDate)).slice(0,5);

  if(total===0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">📄</div>
      <p className="text-[#1e3a5f] text-sm">Load sample data to populate the dashboard.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Documents',       value:total,      sub:`${active} active · ${obsolete} obsolete`, color:'text-white' },
          { label:'Review Compliance',     value:`${reviewCompliance}%`, sub:`${overdue} overdue`, color:reviewCompliance>=90?'text-emerald-600':reviewCompliance>=70?'text-amber-600':'text-red-600' },
          { label:'Under Revision',        value:underRev,   sub:`${dueSoon} due soon`, color:underRev>3?'text-amber-600':'text-[#1e3a5f]' },
          { label:'IATF Clause Linkage',   value:`${iatfRate}%`, sub:`${iatfLinked}/${total} docs linked`, color:iatfRate>=80?'text-emerald-600':iatfRate>=60?'text-amber-600':'text-red-600' },
        ].map(k=>(
          <div key={k.label} className="bg-white border border-[#dbeafe] rounded-xl p-4">
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Breakdown */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Document Status Summary</div>
          <div className="space-y-3">
            {[
              { label:'✅ Active',          value:active,   color:'bg-emerald-600', text:'text-emerald-600' },
              { label:'🔄 Under Revision',  value:underRev, color:'bg-amber-500',   text:'text-amber-600' },
              { label:'🔴 Overdue Review',  value:overdue,  color:'bg-red-600',     text:'text-red-600' },
              { label:'⏰ Due Soon (30d)',   value:dueSoon,  color:'bg-orange-500',  text:'text-orange-600' },
              { label:'📦 Obsolete',        value:obsolete, color:'bg-slate-600',   text:'text-[#1e3a5f]' },
            ].map(b=>(
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-medium ${b.text}`}>{b.label}</span>
                  <span className="text-[#1e3a5f]">{b.value} ({total>0?Math.round(b.value/total*100):0}%)</span>
                </div>
                <div className="w-full bg-[#dbeafe] rounded-full h-2">
                  <div className={`${b.color} h-2 rounded-full`} style={{width:`${total>0?Math.round(b.value/total*100):0}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Documents by Category</div>
          {catData.map(([cat,cnt],i)=>(
            <div key={cat} className="flex items-center gap-2 mb-2.5">
              <span className="text-xs text-[#1e3a5f] flex-1 truncate">{CAT_LABELS[cat]??cat}</span>
              <div className="w-28 bg-[#dbeafe] rounded-full h-2 shrink-0">
                <div className={`${CAT_COLORS[i]||'bg-slate-500'} h-2 rounded-full`} style={{width:`${Math.round(cnt/maxCat*100)}%`}} />
              </div>
              <span className="text-xs font-bold text-[#1e3a5f] w-4 text-right">{cnt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Docs Alert */}
      {overdueDocs.length>0 && (
        <div className="bg-red-50 border border-red-800/50 rounded-xl p-5">
          <div className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3">🔴 Overdue Review Documents — Immediate Action Required</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50">
                  {['Doc No.','Title','Category','Last Reviewed','Overdue By','Owner'].map(h=>(
                    <th key={h} className="px-3 py-2 text-xs font-bold text-red-700 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overdueDocs.map(d=>(
                  <tr key={d.id} className="border-t border-red-900/30">
                    <td className="px-3 py-2 text-xs font-mono text-red-700">{d.docNumber}</td>
                    <td className="px-3 py-2 text-xs text-[#1e3a5f] font-medium">{d.title}</td>
                    <td className="px-3 py-2 text-xs text-[#1e3a5f]">{CAT_LABELS[d.category]??d.category}</td>
                    <td className="px-3 py-2 text-xs text-[#1e3a5f]">{d.nextReviewDate}</td>
                    <td className="px-3 py-2 text-xs font-bold text-red-600">{Math.abs(daysUntilReview(d.nextReviewDate))} days</td>
                    <td className="px-3 py-2 text-xs text-[#1e3a5f]">{d.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maturity */}
      <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 Document Control Maturity — IATF 7.5</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Review Compliance',  score:reviewCompliance, target:100 },
            { label:'IATF Clause Link',   score:iatfRate,          target:80 },
            { label:'Obsolete Control',   score:obsolete>0?Math.max(50,100-obsolete*10):100, target:90 },
            { label:'Revision Activity',  score:underRev<=3?90:underRev<=6?70:50, target:90 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-white rounded-xl p-3 text-center border border-[#dbeafe]">
                <div className="text-xs text-[#1e3a5f] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-[#1e3a5f] mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-[#dbeafe] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{width:`${Math.min(m.score,100)}%`,background:color}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


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

  const tabs = ['📊 Dashboard', '📋 Document Register', '🔔 Review Alerts', '📚 Knowledge Hub', '📖 Doc Control Guide'];

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">📄</span>
                <h1 className="text-2xl font-bold text-white">Document Management</h1>
              </div>
              <p className="text-[#1e3a5f] text-sm">Controlled Documents · Revision History · Review Alerts · Obsolete Control · IATF 7.5</p>
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
              { label: 'Review Overdue', value: docs.length > 0 ? `${headerStats.overdue}` : '—', color: headerStats.overdue > 0 ? 'text-red-600' : 'text-emerald-600', sub: 'Action required' },
              { label: 'Due Within 60 Days', value: docs.length > 0 ? `${headerStats.dueSoon}` : '—', color: headerStats.dueSoon > 0 ? 'text-yellow-600' : 'text-emerald-600', sub: 'Schedule review' },
              { label: 'Under Revision', value: docs.length > 0 ? `${headerStats.underRev}` : '—', color: headerStats.underRev > 0 ? 'text-yellow-600' : 'text-emerald-600', sub: 'In-progress changes' },
            ].map(s => (
              <div key={s.label} className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                <div className="text-xs text-[#1e3a5f] mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#dbeafe] bg-white px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-slate-400 text-[#1e3a5f]' : 'border-transparent text-[#1e3a5f] hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/documents/Document_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Document Register">Document Register</a><a href="/downloads/documents/Document_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Document Register">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/documents/SOP_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View SOP Template XLS">SOP Template XLS</a><a href="/downloads/documents/SOP_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download SOP Template XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/documents/Revision_Control_Log.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Revision Log XLS">Revision Log XLS</a><a href="/downloads/documents/Revision_Control_Log.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Revision Log XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#b45309'}}><a href="/downloads/documents/Document_Review_Schedule.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Review Schedule">Review Schedule</a><a href="/downloads/documents/Document_Review_Schedule.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Review Schedule">⬇</a></span>
      </div>
        {activeTab === 0 && <DocumentDashboardTab docs={docs} />}
        {activeTab === 1 && <DocumentRegisterTab docs={docs} />}
        {activeTab === 2 && <ReviewAlertsTab docs={docs} />}
        {activeTab === 3 && <KnowledgeHubTab />}
        {activeTab === 4 && <DocControlGuideTab />}
      </div>
      <QualityCopilot page="documents" />
    </div>
  );
}