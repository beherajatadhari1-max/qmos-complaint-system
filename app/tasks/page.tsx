'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type TaskSource   = 'capa' | 'audit' | 'customer' | 'supplier' | 'internal' | 'managerial' | 'tqm';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
type TaskStatus   = 'todo' | 'in-progress' | 'done' | 'overdue' | 'cancelled';

interface QTask {
  id: string;
  title: string;
  description: string;
  source: TaskSource;
  sourceRef: string;       // e.g. 'NCR-001', 'AUDIT-A002', '8D-CUS-005'
  priority: TaskPriority;
  status: TaskStatus;
  owner: string;
  raisedBy: string;
  raisedDate: string;
  targetDate: string;
  completedDate: string;
  verifiedBy: string;
  effectiveness: 'pending' | 'effective' | 'not-effective' | 'na';
  notes: string;
  linkedModule: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SOURCE_LABEL: Record<TaskSource, string> = {
  capa:       'CAPA',
  audit:      'Audit Finding',
  customer:   'Customer Complaint',
  supplier:   'Supplier SCAR',
  internal:   'Internal NCR',
  managerial: 'Managerial / DL',
  tqm:        'TQM / Kaizen',
};
const SOURCE_COLOR: Record<TaskSource, string> = {
  capa:       'text-red-400 bg-red-900/40',
  audit:      'text-blue-400 bg-blue-900/40',
  customer:   'text-orange-400 bg-orange-900/40',
  supplier:   'text-yellow-400 bg-yellow-900/40',
  internal:   'text-purple-400 bg-purple-900/40',
  managerial: 'text-cyan-400 bg-cyan-900/40',
  tqm:        'text-emerald-400 bg-emerald-900/40',
};
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  critical: 'text-red-400 bg-red-900/40 border-red-700/50',
  high:     'text-orange-400 bg-orange-900/40 border-orange-700/50',
  medium:   'text-yellow-400 bg-yellow-900/40 border-yellow-700/50',
  low:      'text-slate-400 bg-slate-700 border-slate-600',
};
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:        'text-slate-400 bg-slate-700',
  'in-progress':'text-blue-400 bg-blue-900/40',
  done:        'text-emerald-400 bg-emerald-900/40',
  overdue:     'text-red-400 bg-red-900/40',
  cancelled:   'text-slate-600 bg-slate-800',
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do', 'in-progress': 'In Progress', done: 'Done', overdue: 'Overdue', cancelled: 'Cancelled',
};

function daysUntil(date: string): number {
  if (!date) return 9999;
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

function effectiveStatus(task: QTask): TaskStatus {
  if (task.status === 'done' || task.status === 'cancelled') return task.status;
  if (task.targetDate && daysUntil(task.targetDate) < 0 && task.status !== 'done') return 'overdue';
  return task.status;
}

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_TASKS: QTask[] = [
  { id: 'T001', title: 'Update PFMEA for Op-20 — new torque spec ECN-441', description: 'Following ECN-441 torque change (25→28 Nm), update PFMEA severity/occurrence ratings for improper torque failure mode. Cross-check control plan.', source: 'capa', sourceRef: 'CAPA-2025-011', priority: 'high', status: 'in-progress', owner: 'Priya Nair', raisedBy: 'Quality Head', raisedDate: '2025-01-10', targetDate: '2025-01-25', completedDate: '', verifiedBy: '', effectiveness: 'pending', notes: 'PFMEA draft ready — cross-check with Mfg Eng pending.', linkedModule: '/pfmea' },
  { id: 'T002', title: 'Close 8D for customer complaint — housing cover dimensional OOS', description: 'Submit completed 8D to customer for housing cover OOS complaint. D5 (CA) and D6 (PA) actions implemented — verification data to be attached.', source: 'customer', sourceRef: '8D-CUS-2025-002', priority: 'critical', status: 'in-progress', owner: 'Kiran Desai', raisedBy: 'Customer Quality Head', raisedDate: '2025-01-08', targetDate: '2025-01-22', completedDate: '', verifiedBy: '', effectiveness: 'pending', notes: 'D5/D6 done. Waiting for 3-lot verification data before submission.', linkedModule: '/8d' },
  { id: 'T003', title: 'SCAR follow-up — Precision Fasteners (SNCR-004) overdue', description: 'SCAR sent 2025-01-14. Due date 2025-01-21 — no response received. Escalate to Supplier Management and initiate alternative source evaluation.', source: 'supplier', sourceRef: 'SNCR-004', priority: 'critical', status: 'overdue', owner: 'Kiran Desai', raisedBy: 'SQA Engineer', raisedDate: '2025-01-14', targetDate: '2025-01-21', completedDate: '', verifiedBy: '', effectiveness: 'na', notes: 'Supplier on Quality Hold. Procurement notified. Alternative supplier RFQ raised.', linkedModule: '/supplier-complaints' },
  { id: 'T004', title: 'Conduct process audit — Line-3 Gear Shaft (IATF 8.5)', description: 'Line-3 had highest downtime this month (OEE 64%). Conduct process audit using turtle diagram methodology. Focus on 4M control and process parameter adherence.', source: 'audit', sourceRef: 'AUDIT-2025-Q1-003', priority: 'high', status: 'todo', owner: 'Priya Nair', raisedBy: 'Quality Head', raisedDate: '2025-01-15', targetDate: '2025-01-31', completedDate: '', verifiedBy: '', effectiveness: 'na', notes: '', linkedModule: '/audit' },
  { id: 'T005', title: 'Corrective action — weld spatter rework rate > 3%', description: 'Internal NCR SNCR-002 repeat issue. Implement SPC on weld current parameter. Add go/no-go check at weld exit point. Target rework < 0.5%.', source: 'internal', sourceRef: 'SNCR-INT-2025-002', priority: 'high', status: 'in-progress', owner: 'Amit Sharma', raisedBy: 'Process Quality Eng.', raisedDate: '2025-01-10', targetDate: '2025-01-28', completedDate: '', verifiedBy: '', effectiveness: 'pending', notes: 'SPC chart installed 2025-01-20. Monitoring in progress.', linkedModule: '/internal-ncr' },
  { id: 'T006', title: 'Update CAPA procedure — add 30-day effectiveness review clause', description: 'Current CAPA procedure Rev 05 does not specify effectiveness verification timeline clearly. Add mandatory 30-day verification window with documented evidence.', source: 'audit', sourceRef: 'AUDIT-IA-2025-001', priority: 'medium', status: 'todo', owner: 'Priya Nair', raisedBy: 'Lead Auditor', raisedDate: '2025-01-12', targetDate: '2025-02-15', completedDate: '', verifiedBy: '', effectiveness: 'na', notes: '', linkedModule: '/documents' },
  { id: 'T007', title: 'Deepak Yadav — MSA training (GRR & Attribute)', description: 'Skill matrix shows Deepak at Level 1 for MSA/GRR. Enrol for AIAG MSA practical training. Target Level 2 competency by Feb-end.', source: 'managerial', sourceRef: 'SKILL-GAP-TM04', priority: 'medium', status: 'todo', owner: 'Priya Nair', raisedBy: 'Quality Head', raisedDate: '2025-01-16', targetDate: '2025-02-28', completedDate: '', verifiedBy: '', effectiveness: 'na', notes: 'Training slot booked for 2025-02-08.', linkedModule: '/managerial' },
  { id: 'T008', title: 'Calibration — 2 gauges overdue (Vernier VC-04, Micrometer MC-11)', description: 'Calibration due date passed for VC-04 (due 2025-01-10) and MC-11 (due 2025-01-15). Remove from service immediately. Send to calibration lab.', source: 'audit', sourceRef: 'CAL-ALERT-2025-JAN', priority: 'critical', status: 'done', owner: 'Deepak Yadav', raisedBy: 'Metrology Supervisor', raisedDate: '2025-01-16', targetDate: '2025-01-18', completedDate: '2025-01-17', verifiedBy: 'Priya Nair', effectiveness: 'effective', notes: 'Both gauges sent to external lab. Calibration certificates received 2025-01-22.', linkedModule: '/msa' },
  { id: 'T009', title: 'QC Story review — Circle "Zero" — Check stage data validation', description: 'QCC Zero PPM Reduction project is in Check stage. Validate before/after PPM data: 62→38. Prepare for presentation at plant convention on 5-Feb.', source: 'tqm', sourceRef: 'QCC-ZERO-2025', priority: 'medium', status: 'in-progress', owner: 'Kiran Desai', raisedBy: 'TQM Coordinator', raisedDate: '2025-01-18', targetDate: '2025-02-01', completedDate: '', verifiedBy: '', effectiveness: 'pending', notes: 'Data validated. Presentation deck in progress.', linkedModule: '/tqm' },
  { id: 'T010', title: 'Document review — Quality Manual QM-001 overdue', description: 'Quality Manual Rev 05 review date was 2025-01-15 — overdue. Schedule review with Plant Head. Likely no major changes needed — confirm and update review date.', source: 'managerial', sourceRef: 'DOC-QM-001', priority: 'high', status: 'todo', owner: 'Priya Nair', raisedBy: 'Document Controller', raisedDate: '2025-01-16', targetDate: '2025-01-31', completedDate: '', verifiedBy: '', effectiveness: 'na', notes: '', linkedModule: '/documents' },
  { id: 'T011', title: 'Verify effectiveness — Fixture clamp fix at Op-30 (3rd lot check)', description: 'Corrective action for dimensional OOS at Op-30 implemented 2025-01-05. Third lot produced — verify zero scrap before closing CAPA.', source: 'capa', sourceRef: 'CAPA-2024-088', priority: 'high', status: 'done', owner: 'Amit Sharma', raisedBy: 'Process Quality Eng.', raisedDate: '2025-01-20', targetDate: '2025-01-25', completedDate: '2025-01-24', verifiedBy: 'Priya Nair', effectiveness: 'effective', notes: 'Lot 3 inspection: 0 scrap. CAPA closed. Savings ₹31,200/month certified.', linkedModule: '/internal-ncr' },
  { id: 'T012', title: 'Supplier scorecard issue — Jan 2025 (all suppliers by 5-Feb)', description: 'Calculate and issue January 2025 scorecards to all 5 active suppliers. Rating changes: Precision Fasteners downgraded to D. Follow-up meetings required.', source: 'supplier', sourceRef: 'SCORECARD-2025-JAN', priority: 'medium', status: 'todo', owner: 'Kiran Desai', raisedBy: 'Quality Head', raisedDate: '2025-01-28', targetDate: '2025-02-05', completedDate: '', verifiedBy: '', effectiveness: 'na', notes: '', linkedModule: '/supplier-complaints' },
];

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Task List
// ══════════════════════════════════════════════════════════════════════════════
function TaskListTab({ tasks }: { tasks: QTask[] }) {
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const processed = useMemo(() => tasks.map(t => ({ ...t, status: effectiveStatus(t) })), [tasks]);
  const owners = useMemo(() => ['all', ...Array.from(new Set(tasks.map(t => t.owner)))], [tasks]);

  const summary = useMemo(() => ({
    total: processed.length,
    overdue: processed.filter(t => t.status === 'overdue').length,
    critical: processed.filter(t => t.priority === 'critical' && t.status !== 'done').length,
    dueSoon: processed.filter(t => t.status !== 'done' && t.status !== 'cancelled' && daysUntil(t.targetDate) >= 0 && daysUntil(t.targetDate) <= 7).length,
    done: processed.filter(t => t.status === 'done').length,
  }), [processed]);

  const filtered = useMemo(() =>
    processed.filter(t =>
      (filterSource === 'all' || t.source === filterSource) &&
      (filterPriority === 'all' || t.priority === filterPriority) &&
      (filterStatus === 'all' || t.status === filterStatus) &&
      (filterOwner === 'all' || t.owner === filterOwner) &&
      (search === '' || t.title.toLowerCase().includes(search.toLowerCase()) || t.sourceRef.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
      // Sort: overdue first, then critical, then by target date
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      const pa = ['critical','high','medium','low'].indexOf(a.priority);
      const pb = ['critical','high','medium','low'].indexOf(b.priority);
      if (pa !== pb) return pa - pb;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }), [processed, filterSource, filterPriority, filterStatus, filterOwner, search]);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', val: summary.total, cls: 'text-white' },
          { label: 'Overdue', val: summary.overdue, cls: summary.overdue > 0 ? 'text-red-400' : 'text-slate-400' },
          { label: 'Critical Open', val: summary.critical, cls: summary.critical > 0 ? 'text-orange-400' : 'text-slate-400' },
          { label: 'Due This Week', val: summary.dueSoon, cls: summary.dueSoon > 0 ? 'text-yellow-400' : 'text-slate-400' },
          { label: 'Completed', val: summary.done, cls: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or ref…"
          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 w-48 focus:ring-2 focus:ring-emerald-500 outline-none" />
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Sources</option>
          {Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Priority</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">⚪ Low</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="overdue">⚠ Overdue</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          {owners.map(o => <option key={o} value={o}>{o === 'all' ? 'All Owners' : o}</option>)}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Task cards */}
      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500">No tasks match filters. Load sample data to begin.</div>}
        {filtered.map(task => {
          const days = daysUntil(task.targetDate);
          const isOpen = expanded === task.id;
          return (
            <div key={task.id} className={`bg-slate-800 rounded-xl border overflow-hidden transition-colors ${task.status === 'overdue' ? 'border-red-700/60' : task.priority === 'critical' && task.status !== 'done' ? 'border-orange-700/40' : 'border-slate-700'}`}>
              <button className="w-full text-left p-4 hover:bg-slate-700/30 transition-colors" onClick={() => setExpanded(isOpen ? null : task.id)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority.toUpperCase()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${SOURCE_COLOR[task.source]}`}>{SOURCE_LABEL[task.source]}</span>
                  <span className="text-xs text-slate-500 font-mono">{task.sourceRef}</span>
                  <span className="text-sm font-medium text-white flex-1 min-w-0">{task.title}</span>
                  <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                    <span className={`text-xs font-medium ${task.status === 'overdue' ? 'text-red-400' : task.status === 'done' ? 'text-emerald-400' : days <= 3 ? 'text-orange-400' : days <= 7 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {task.status === 'done' ? `✓ ${task.completedDate}` : task.status === 'overdue' ? `⚠ ${Math.abs(days)}d late` : `${days}d left`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</span>
                    <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Owner: <span className="text-slate-300">{task.owner}</span></span>
                  <span>Target: <span className={task.status === 'overdue' ? 'text-red-400' : 'text-slate-300'}>{task.targetDate}</span></span>
                  <span>Raised: {task.raisedDate} by {task.raisedBy}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 p-4 space-y-3">
                  <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300">{task.description}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { l: 'Completed Date', v: task.completedDate || '—' },
                      { l: 'Verified By', v: task.verifiedBy || '—' },
                      { l: 'Effectiveness', v: task.effectiveness === 'na' ? 'N/A' : task.effectiveness.replace('-', ' ').toUpperCase() },
                      { l: 'Linked Module', v: task.linkedModule },
                    ].map(d => (
                      <div key={d.l} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500">{d.l}</div>
                        <div className={`text-sm ${d.l === 'Effectiveness' && task.effectiveness === 'effective' ? 'text-emerald-400' : d.l === 'Effectiveness' && task.effectiveness === 'not-effective' ? 'text-red-400' : 'text-white'}`}>{d.v}</div>
                      </div>
                    ))}
                  </div>
                  {task.notes && <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-xs text-blue-300">💬 {task.notes}</div>}
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
// TAB 2 — Kanban Board
// ══════════════════════════════════════════════════════════════════════════════
function KanbanTab({ tasks }: { tasks: QTask[] }) {
  const processed = useMemo(() => tasks.map(t => ({ ...t, status: effectiveStatus(t) })), [tasks]);

  const columns: { key: TaskStatus; label: string; color: string; headerColor: string }[] = [
    { key: 'overdue',     label: '⚠ Overdue',     color: 'border-red-700/50 bg-red-900/5',      headerColor: 'text-red-400 border-b border-red-700/30' },
    { key: 'todo',        label: '📋 To Do',        color: 'border-slate-600 bg-slate-800/50',     headerColor: 'text-slate-300 border-b border-slate-600' },
    { key: 'in-progress', label: '🔄 In Progress',  color: 'border-blue-700/50 bg-blue-900/5',    headerColor: 'text-blue-300 border-b border-blue-700/30' },
    { key: 'done',        label: '✅ Done',          color: 'border-emerald-700/50 bg-emerald-900/5', headerColor: 'text-emerald-300 border-b border-emerald-700/30' },
  ];

  const byStatus = useMemo(() => {
    const m: Record<string, typeof processed> = {};
    columns.forEach(c => { m[c.key] = []; });
    processed.forEach(t => { if (m[t.status]) m[t.status].push(t); });
    return m;
  }, [processed]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => (
        <div key={col.key} className={`rounded-xl border ${col.color} flex flex-col`}>
          <div className={`px-4 py-3 ${col.headerColor}`}>
            <span className="font-semibold text-sm">{col.label}</span>
            <span className="ml-2 text-xs opacity-70">({byStatus[col.key]?.length ?? 0})</span>
          </div>
          <div className="p-3 space-y-2 flex-1">
            {(byStatus[col.key] ?? []).length === 0 && (
              <div className="text-xs text-slate-600 text-center py-4">Empty</div>
            )}
            {(byStatus[col.key] ?? []).map(task => {
              const days = daysUntil(task.targetDate);
              return (
                <div key={task.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-500 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority[0].toUpperCase()}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SOURCE_COLOR[task.source]}`}>{SOURCE_LABEL[task.source].split(' ')[0]}</span>
                  </div>
                  <div className="text-xs font-medium text-white leading-snug mb-2">{task.title}</div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{task.owner.split(' ')[0]}</span>
                    <span className={task.status === 'overdue' ? 'text-red-400' : days <= 3 ? 'text-orange-400' : days <= 7 ? 'text-yellow-400' : ''}>
                      {task.status === 'done' ? task.completedDate : task.status === 'overdue' ? `${Math.abs(days)}d late` : `${days}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Analytics
// ══════════════════════════════════════════════════════════════════════════════
function AnalyticsTab({ tasks }: { tasks: QTask[] }) {
  const processed = useMemo(() => tasks.map(t => ({ ...t, status: effectiveStatus(t) })), [tasks]);

  const bySource = useMemo(() => {
    const m: Record<string, { total: number; overdue: number; done: number }> = {};
    (Object.keys(SOURCE_LABEL) as TaskSource[]).forEach(s => { m[s] = { total: 0, overdue: 0, done: 0 }; });
    processed.forEach(t => {
      m[t.source].total++;
      if (t.status === 'overdue') m[t.source].overdue++;
      if (t.status === 'done') m[t.source].done++;
    });
    return m;
  }, [processed]);

  const byOwner = useMemo(() => {
    const m: Record<string, { total: number; overdue: number; done: number }> = {};
    processed.forEach(t => {
      if (!m[t.owner]) m[t.owner] = { total: 0, overdue: 0, done: 0 };
      m[t.owner].total++;
      if (t.status === 'overdue') m[t.owner].overdue++;
      if (t.status === 'done') m[t.owner].done++;
    });
    return m;
  }, [processed]);

  const closureRate = processed.length > 0
    ? (processed.filter(t => t.status === 'done').length / processed.length) * 100
    : 0;

  return (
    <div className="space-y-5">
      {/* Closure rate */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-white">Overall Task Closure Rate</h3>
          <div className={`text-2xl font-bold ${closureRate >= 80 ? 'text-emerald-400' : closureRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{closureRate.toFixed(0)}%</div>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${closureRate >= 80 ? 'bg-emerald-500' : closureRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${closureRate}%` }} />
        </div>
        <div className="mt-2 text-xs text-slate-500">Target ≥ 80% on-time closure | IATF 10.2</div>
      </div>

      {/* By Source */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">Tasks by Source</h3>
        <div className="space-y-3">
          {(Object.entries(bySource) as [TaskSource, { total: number; overdue: number; done: number }][])
            .filter(([, v]) => v.total > 0)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([source, counts]) => (
              <div key={source} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${SOURCE_COLOR[source]}`}>{SOURCE_LABEL[source]}</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-400">{counts.total} total</span>
                    {counts.overdue > 0 && <span className="text-red-400">{counts.overdue} overdue</span>}
                    <span className="text-emerald-400">{counts.done} done</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-600 h-full" style={{ width: `${counts.total > 0 ? (counts.done / counts.total) * 100 : 0}%` }} />
                  <div className="bg-red-600 h-full" style={{ width: `${counts.total > 0 ? (counts.overdue / counts.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />Done</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" />Overdue</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" />Open</span>
        </div>
      </div>

      {/* By Owner */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">Tasks by Owner</h3>
        <div className="space-y-3">
          {Object.entries(byOwner).sort((a, b) => b[1].total - a[1].total).map(([owner, counts]) => {
            const rate = counts.total > 0 ? (counts.done / counts.total) * 100 : 0;
            return (
              <div key={owner} className="flex items-center gap-4">
                <div className="w-28 text-sm text-slate-300 truncate">{owner.split(' ')[0]}</div>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-600 h-full" style={{ width: `${rate}%` }} />
                  {counts.overdue > 0 && <div className="bg-red-600 h-full" style={{ width: `${(counts.overdue / counts.total) * 100}%` }} />}
                </div>
                <div className="flex gap-3 text-xs w-32 text-right">
                  <span className="text-slate-400">{counts.total}T</span>
                  {counts.overdue > 0 && <span className="text-red-400">{counts.overdue}OD</span>}
                  <span className="text-emerald-400">{counts.done}✓</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Effectiveness summary */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">Effectiveness Verification Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['effective', 'not-effective', 'pending', 'na'] as const).map(eff => {
            const count = processed.filter(t => t.effectiveness === eff).length;
            const colors: Record<string, string> = {
              effective: 'text-emerald-400', 'not-effective': 'text-red-400', pending: 'text-yellow-400', na: 'text-slate-500',
            };
            const labels: Record<string, string> = {
              effective: 'Effective', 'not-effective': 'Not Effective', pending: 'Pending', na: 'N/A',
            };
            return (
              <div key={eff} className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold ${colors[eff]}`}>{count}</div>
                <div className="text-xs text-slate-500 mt-1">{labels[eff]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Task Management Guide
// ══════════════════════════════════════════════════════════════════════════════
function TaskGuideTab() {
  const principles = [
    { no: '01', icon: '📋', title: 'Every Finding → A Task', points: ['Every audit finding, customer complaint, NCR, SCAR, or KPI gap must generate a documented task with an owner, target date, and description.', 'No verbal commitments. If it is not in the task register, it does not exist.', 'Raise the task on the same day as the finding — delay creates drift.', 'Link each task to its source: audit report, 8D, NCR, SCAR, KPI review.'] },
    { no: '02', icon: '👤', title: 'Clear Ownership', points: ['Every task must have exactly one owner — the person accountable for completion.', 'Owner = the person who will close the task, not the person who raised it.', 'Group ownership ("team") is unacceptable — it guarantees inaction.', 'If the true owner is unknown, Quality Head owns it until reassigned.'] },
    { no: '03', icon: '📅', title: 'Realistic Target Dates', points: ['Target date must be agreed with the owner — not imposed unilaterally.', 'Critical actions (customer escape, safety): 24–48 hrs for containment, 7 days for interim, 21 days for full 8D.', 'Audit findings: 30 days for corrections, 60 days for corrective actions with evidence.', 'No target date > 90 days without management approval — it signals avoidance.'] },
    { no: '04', icon: '⏰', title: 'Overdue Management', points: ['Overdue is defined as: target date passed + status not "Done".', 'Any task overdue by > 7 days must be escalated to the manager of the owner.', 'Any task overdue by > 30 days must appear in the management review.', 'Root cause for overdue task must be documented — prevents recurrence.'] },
    { no: '05', icon: '✅', title: 'Verification Before Closure', points: ['A task is not "done" when the action is taken — it is done when effectiveness is verified.', 'Verify corrective actions with data: PPM trend, audit re-check, 3-lot monitoring.', 'Verification must be done by someone other than the task owner.', 'If effectiveness fails: reopen task, revise action, and re-verify.'] },
    { no: '06', icon: '📊', title: 'Weekly Review Discipline', points: ['Review all open tasks every week — not just monthly management review.', 'Weekly task review: check upcoming due dates, escalate overdue, update status.', 'Use the task register as the agenda for weekly quality team meeting.', 'Closure rate ≥ 80% is the target — below 60% signals systemic capacity or priority issue.'] },
  ];

  const timelines = [
    { type: 'Customer Complaint — Containment', timeline: 'Same day / 24 hrs', clause: 'IATF 10.2' },
    { type: 'Customer Complaint — 8D Response', timeline: '5 working days (interim) / 21 days (full)', clause: 'Customer CSR' },
    { type: 'Supplier SCAR — Response', timeline: '7 days (interim) / 21 days (full 8D)', clause: 'IATF 8.4.2' },
    { type: 'Internal NCR Disposition', timeline: 'Same day', clause: 'IATF 8.7' },
    { type: 'Audit Finding — Correction', timeline: '30 days', clause: 'IATF 9.2' },
    { type: 'Audit Finding — Corrective Action', timeline: '60 days with evidence', clause: 'IATF 10.2' },
    { type: 'CAPA Effectiveness Verification', timeline: '30 days after action implementation', clause: 'IATF 10.2.1' },
    { type: 'Calibration Overdue — Remove from Service', timeline: 'Immediate', clause: 'IATF 7.1.5' },
  ];

  return (
    <div className="space-y-6">
      {/* Principles */}
      <div className="space-y-3">
        {principles.map(p => (
          <div key={p.no} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center text-sm font-bold text-emerald-400">{p.no}</div>
              <span className="text-lg">{p.icon}</span>
              <h3 className="font-semibold text-white">{p.title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {p.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5 shrink-0">→</span>
                  <span className="text-slate-300">{pt}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Response timelines */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">⏱ Mandatory Response Timelines</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs text-slate-500 py-2 pr-4">Action Type</th>
                <th className="text-left text-xs text-slate-500 py-2 pr-4">Timeline</th>
                <th className="text-left text-xs text-slate-500 py-2">Clause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {timelines.map(t => (
                <tr key={t.type} className="hover:bg-slate-700/20">
                  <td className="py-2.5 pr-4 text-slate-300">{t.type}</td>
                  <td className="py-2.5 pr-4 text-white font-medium">{t.timeline}</td>
                  <td className="py-2.5 text-xs text-slate-400">{t.clause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function TasksPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState<QTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  const processed = useMemo(() => tasks.map(t => ({ ...t, status: effectiveStatus(t) })), [tasks]);

  const headerStats = useMemo(() => ({
    total: processed.length,
    overdue: processed.filter(t => t.status === 'overdue').length,
    critical: processed.filter(t => t.priority === 'critical' && t.status !== 'done').length,
    done: processed.filter(t => t.status === 'done').length,
  }), [processed]);

  const tabs = ['📋 Task List', '🗂 Kanban Board', '📊 Analytics', '📖 Task Guide'];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/50 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">✅</span>
                <h1 className="text-2xl font-bold text-white">Task Management</h1>
              </div>
              <p className="text-slate-400 text-sm">CAPA · Audit Actions · Customer 8D · Supplier SCAR · Internal NCR · All Quality Actions in One Place</p>
            </div>
            <button
              onClick={() => { if (!loaded) { setTasks(SAMPLE_TASKS); setLoaded(true); } else { setTasks([]); setLoaded(false); } }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>

          {/* Header KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Total Tasks', value: tasks.length > 0 ? `${headerStats.total}` : '—', color: 'text-white', sub: 'All active' },
              { label: 'Overdue', value: tasks.length > 0 ? `${headerStats.overdue}` : '—', color: headerStats.overdue > 0 ? 'text-red-400' : 'text-emerald-400', sub: 'Past target date' },
              { label: 'Critical Open', value: tasks.length > 0 ? `${headerStats.critical}` : '—', color: headerStats.critical > 0 ? 'text-orange-400' : 'text-emerald-400', sub: 'Needs immediate action' },
              { label: 'Completed', value: tasks.length > 0 ? `${headerStats.done}` : '—', color: 'text-emerald-400', sub: `${tasks.length > 0 ? ((headerStats.done / headerStats.total) * 100).toFixed(0) : 0}% closure rate` },
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
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <TaskListTab tasks={tasks} />}
        {activeTab === 1 && <KanbanTab tasks={tasks} />}
        {activeTab === 2 && <AnalyticsTab tasks={tasks} />}
        {activeTab === 3 && <TaskGuideTab />}
      </div>
    </div>
  );
}
