'use client';
import { useState, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
type KPIStatus = 'green' | 'yellow' | 'red';
type KPITrend  = 'up' | 'down' | 'flat';
type ImprovementType = 'kaizen' | 'qcc' | 'green-belt' | 'six-sigma' | 'suggestion';
type ImprovementStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';
type COQCategory = 'prevention' | 'appraisal' | 'internal-failure' | 'external-failure';

interface KPIRecord {
  id: string;
  category: string;
  name: string;
  unit: string;
  target: number;
  actual: number;
  previous: number;
  trend: KPITrend;
  status: KPIStatus;
  owner: string;
  clause: string;
  higherIsBetter: boolean;
}

interface COQEntry {
  id: string;
  month: string;
  category: COQCategory;
  subcategory: string;
  description: string;
  amount: number;
  department: string;
}

interface ImprovementProject {
  id: string;
  type: ImprovementType;
  title: string;
  team: string;
  department: string;
  problem: string;
  target: string;
  actualResult: string;
  startDate: string;
  targetDate: string;
  completedDate: string;
  status: ImprovementStatus;
  savingsINR: number;
  savingsHrs: number;
  stage: string;
  theme: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<KPIStatus, string> = {
  green:  'text-emerald-400 bg-emerald-900/30 border-emerald-700/50',
  yellow: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
  red:    'text-red-400 bg-red-900/30 border-red-700/50',
};
const STATUS_DOT: Record<KPIStatus, string> = {
  green: 'bg-emerald-400', yellow: 'bg-yellow-400', red: 'bg-red-400',
};
const COQ_COLOR: Record<COQCategory, string> = {
  prevention:        'text-emerald-400 bg-emerald-900/30',
  appraisal:         'text-blue-400 bg-blue-900/30',
  'internal-failure':'text-yellow-400 bg-yellow-900/30',
  'external-failure':'text-red-400 bg-red-900/30',
};
const COQ_LABEL: Record<COQCategory, string> = {
  prevention: 'Prevention', appraisal: 'Appraisal',
  'internal-failure': 'Internal Failure', 'external-failure': 'External Failure',
};
const IMP_TYPE_LABEL: Record<ImprovementType, string> = {
  kaizen: 'Kaizen', qcc: 'QCC', 'green-belt': 'Green Belt', 'six-sigma': 'Six Sigma', suggestion: 'Suggestion',
};
const IMP_TYPE_COLOR: Record<ImprovementType, string> = {
  kaizen: 'text-yellow-400 bg-yellow-900/40',
  qcc: 'text-blue-400 bg-blue-900/40',
  'green-belt': 'text-emerald-400 bg-emerald-900/40',
  'six-sigma': 'text-purple-400 bg-purple-900/40',
  suggestion: 'text-slate-400 bg-slate-700',
};
const IMP_STATUS_COLOR: Record<ImprovementStatus, string> = {
  open: 'text-slate-400 bg-slate-700',
  'in-progress': 'text-blue-400 bg-blue-900/40',
  completed: 'text-emerald-400 bg-emerald-900/40',
  cancelled: 'text-red-400 bg-red-900/40',
};

function trendIcon(trend: KPITrend, higherIsBetter: boolean) {
  if (trend === 'flat') return <span className="text-slate-500">→</span>;
  const up = trend === 'up';
  const good = up === higherIsBetter;
  return <span className={good ? 'text-emerald-400' : 'text-red-400'}>{up ? '↑' : '↓'}</span>;
}

function kpiStatus(actual: number, target: number, higherIsBetter: boolean): KPIStatus {
  const ratio = higherIsBetter ? actual / target : target / actual;
  if (ratio >= 1) return 'green';
  if (ratio >= 0.85) return 'yellow';
  return 'red';
}

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_KPIS: KPIRecord[] = [
  // Quality
  { id: 'K01', category: 'Customer Quality', name: 'Customer PPM', unit: 'PPM', target: 50, actual: 38, previous: 62, trend: 'down', status: 'green', owner: 'Quality Head', clause: 'IATF 9.1.2', higherIsBetter: false },
  { id: 'K02', category: 'Customer Quality', name: 'Customer Complaints', unit: 'No.', target: 2, actual: 1, previous: 3, trend: 'down', status: 'green', owner: 'Customer Quality', clause: 'IATF 8.2.1', higherIsBetter: false },
  { id: 'K03', category: 'Customer Quality', name: 'Warranty Returns', unit: 'No.', target: 5, actual: 7, previous: 6, trend: 'up', status: 'red', owner: 'Warranty Manager', clause: 'IATF 10.2', higherIsBetter: false },
  { id: 'K04', category: 'Customer Quality', name: 'CSAT Score', unit: '%', target: 90, actual: 87, previous: 85, trend: 'up', status: 'yellow', owner: 'Customer Quality', clause: 'IATF 9.1.2', higherIsBetter: true },
  // Manufacturing Quality
  { id: 'K05', category: 'Manufacturing Quality', name: 'Internal PPM', unit: 'PPM', target: 500, actual: 648, previous: 720, trend: 'down', status: 'yellow', owner: 'Process Quality', clause: 'IATF 8.5.1', higherIsBetter: false },
  { id: 'K06', category: 'Manufacturing Quality', name: 'First Time Through (FTT)', unit: '%', target: 98, actual: 97.2, previous: 96.8, trend: 'up', status: 'yellow', owner: 'Manufacturing', clause: 'IATF 8.5.1', higherIsBetter: true },
  { id: 'K07', category: 'Manufacturing Quality', name: 'Scrap Cost', unit: '₹ K', target: 50, actual: 38, previous: 55, trend: 'down', status: 'green', owner: 'Quality Head', clause: 'IATF 10.2', higherIsBetter: false },
  { id: 'K08', category: 'Manufacturing Quality', name: 'Rework Cost', unit: '₹ K', target: 30, actual: 42, previous: 35, trend: 'up', status: 'red', owner: 'Manufacturing', clause: 'IATF 10.2', higherIsBetter: false },
  // Supplier Quality
  { id: 'K09', category: 'Supplier Quality', name: 'Supplier PPM', unit: 'PPM', target: 200, actual: 165, previous: 210, trend: 'down', status: 'green', owner: 'SQA', clause: 'IATF 8.4', higherIsBetter: false },
  { id: 'K10', category: 'Supplier Quality', name: 'Supplier Rejections', unit: 'Lots', target: 3, actual: 2, previous: 4, trend: 'down', status: 'green', owner: 'SQA', clause: 'IATF 8.4.1', higherIsBetter: false },
  // OEE / Manufacturing
  { id: 'K11', category: 'Manufacturing Excellence', name: 'OEE', unit: '%', target: 85, actual: 81.4, previous: 79.8, trend: 'up', status: 'yellow', owner: 'Manufacturing Head', clause: 'IATF 8.5.1', higherIsBetter: true },
  { id: 'K12', category: 'Manufacturing Excellence', name: 'Downtime (Monthly)', unit: 'hrs', target: 40, actual: 52, previous: 48, trend: 'up', status: 'red', owner: 'Maintenance', clause: 'IATF 8.5.1', higherIsBetter: false },
  // System
  { id: 'K13', category: 'QMS System', name: 'On-Time CAPA Closure', unit: '%', target: 95, actual: 91, previous: 88, trend: 'up', status: 'yellow', owner: 'Quality Head', clause: 'IATF 10.2', higherIsBetter: true },
  { id: 'K14', category: 'QMS System', name: 'Internal Audit Findings Closed', unit: '%', target: 100, actual: 100, previous: 96, trend: 'up', status: 'green', owner: 'MR / Quality Head', clause: 'IATF 9.2', higherIsBetter: true },
  { id: 'K15', category: 'QMS System', name: 'Calibration On-Time', unit: '%', target: 100, actual: 98, previous: 100, trend: 'down', status: 'yellow', owner: 'Metrology', clause: 'IATF 7.1.5', higherIsBetter: true },
  // TQM
  { id: 'K16', category: 'TQM', name: 'Kaizens Per Person (Month)', unit: 'No.', target: 2, actual: 1.8, previous: 1.5, trend: 'up', status: 'yellow', owner: 'TQM Coordinator', clause: 'TQM / CI', higherIsBetter: true },
  { id: 'K17', category: 'TQM', name: 'Employee Involvement (TEI)', unit: '%', target: 90, actual: 85, previous: 82, trend: 'up', status: 'yellow', owner: 'TQM Coordinator', clause: 'TQM / TEI', higherIsBetter: true },
  { id: 'K18', category: 'TQM', name: 'Total CI Savings (MTD)', unit: '₹ L', target: 5, actual: 6.2, previous: 4.1, trend: 'up', status: 'green', owner: 'TQM Coordinator', clause: 'TQM / CI', higherIsBetter: true },
];

const SAMPLE_COQ: COQEntry[] = [
  { id: 'C01', month: '2025-01', category: 'prevention', subcategory: 'Training & Education', description: 'IATF awareness training — 45 operators', amount: 32000, department: 'Quality' },
  { id: 'C02', month: '2025-01', category: 'prevention', subcategory: 'Process Design / FMEA', description: 'PFMEA workshop — new model launch', amount: 18000, department: 'Engineering' },
  { id: 'C03', month: '2025-01', category: 'appraisal', subcategory: 'Incoming Inspection', description: 'IQC inspector cost — 3 inspectors × 20 days', amount: 75000, department: 'Quality' },
  { id: 'C04', month: '2025-01', category: 'appraisal', subcategory: 'In-Process Inspection', description: 'IPQC patrol cost — 2 inspectors × 20 days', amount: 50000, department: 'Quality' },
  { id: 'C05', month: '2025-01', category: 'appraisal', subcategory: 'Calibration', description: 'External calibration — 12 gauges, CMM', amount: 22000, department: 'Metrology' },
  { id: 'C06', month: '2025-01', category: 'internal-failure', subcategory: 'Scrap', description: 'Bracket Assembly scrap — 48 pcs', amount: 38000, department: 'Manufacturing' },
  { id: 'C07', month: '2025-01', category: 'internal-failure', subcategory: 'Rework', description: 'Housing Cover rework — weld repair 120 pcs', amount: 42000, department: 'Manufacturing' },
  { id: 'C08', month: '2025-01', category: 'internal-failure', subcategory: 'Downtime (Quality-related)', description: 'Quality hold downtime — 3 events × 60 min avg', amount: 15000, department: 'Manufacturing' },
  { id: 'C09', month: '2025-01', category: 'external-failure', subcategory: 'Customer Returns', description: 'Warranty returns — 7 units × avg cost', amount: 56000, department: 'Customer Quality' },
  { id: 'C10', month: '2025-01', category: 'external-failure', subcategory: 'Customer Complaint Investigation', description: '8D investigations — 1 complaint', amount: 12000, department: 'Quality' },
];

const SAMPLE_IMPROVEMENTS: ImprovementProject[] = [
  { id: 'I01', type: 'kaizen', title: 'Reduce bracket scrap by jig error-proofing', team: 'Line-1 Team', department: 'Manufacturing', problem: 'Bracket incorrectly loaded — 28 scrap/month', target: 'Zero wrong-load scrap', actualResult: '0 scrap in 3 weeks', startDate: '2025-01-02', targetDate: '2025-01-15', completedDate: '2025-01-14', status: 'completed', savingsINR: 22000, savingsHrs: 0, stage: 'Done', theme: 'Quality' },
  { id: 'I02', type: 'qcc', title: 'Welding spatter reduction — Circle "Sparks"', team: 'Welding Team QCC', department: 'Manufacturing', problem: 'Weld spatter causing 3.2% rework rate on Housing Cover', target: 'Rework < 0.5%', actualResult: '0.8% achieved', startDate: '2024-11-01', targetDate: '2025-01-31', completedDate: '', status: 'in-progress', savingsINR: 0, savingsHrs: 0, stage: 'Improve (D)', theme: 'Quality' },
  { id: 'I03', type: 'green-belt', title: 'OEE improvement — Line-3 gear shaft', team: 'GB Project — Kiran Desai', department: 'Manufacturing', problem: 'OEE at 64% — 21 pp below target due to setup time & breakdowns', target: 'OEE ≥ 80%', actualResult: '79.5% achieved', startDate: '2024-10-01', targetDate: '2025-01-31', completedDate: '2025-01-28', status: 'completed', savingsINR: 185000, savingsHrs: 240, stage: 'Control', theme: 'OEE' },
  { id: 'I04', type: 'kaizen', title: 'Coolant concentration daily check sheet', team: 'Maintenance', department: 'Manufacturing', problem: 'Coolant OOS causing tool wear — no daily check in place', target: 'Daily check with alert if OOS', actualResult: 'Sheet implemented — 0 OOS events since', startDate: '2025-01-10', targetDate: '2025-01-17', completedDate: '2025-01-17', status: 'completed', savingsINR: 8000, savingsHrs: 0, stage: 'Done', theme: 'Maintenance' },
  { id: 'I05', type: 'suggestion', title: 'Use rejected brackets as trolley stops', team: 'Ravi Kumar', department: 'Manufacturing', problem: 'Rejected brackets accumulated — storage waste', target: 'Repurpose or recycle', actualResult: 'Used as trolley wheel stops — ₹2K material saved', startDate: '2025-01-05', targetDate: '2025-01-12', completedDate: '2025-01-12', status: 'completed', savingsINR: 2000, savingsHrs: 0, stage: 'Done', theme: 'Cost' },
  { id: 'I06', type: 'qcc', title: 'Customer PPM reduction — Circle "Zero"', team: 'Quality QCC', department: 'Quality', problem: 'Customer PPM at 62 — target 50. Top cause: dimensional OOS at Op-30', target: 'PPM ≤ 50', actualResult: 'PPM at 38 — target met', startDate: '2024-12-01', targetDate: '2025-02-28', completedDate: '', status: 'in-progress', savingsINR: 0, savingsHrs: 0, stage: 'Check (C)', theme: 'Customer Quality' },
];

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Quality KPI Dashboard
// ══════════════════════════════════════════════════════════════════════════════
function KPIDashboardTab({ kpis }: { kpis: KPIRecord[] }) {
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const categories = useMemo(() => ['all', ...Array.from(new Set(kpis.map(k => k.category)))], [kpis]);

  const filtered = useMemo(() =>
    kpis.filter(k =>
      (filterCat === 'all' || k.category === filterCat) &&
      (filterStatus === 'all' || k.status === filterStatus)
    ), [kpis, filterCat, filterStatus]);

  const summary = useMemo(() => ({
    total: kpis.length,
    green: kpis.filter(k => k.status === 'green').length,
    yellow: kpis.filter(k => k.status === 'yellow').length,
    red: kpis.filter(k => k.status === 'red').length,
  }), [kpis]);

  const grouped = useMemo(() => {
    const g: Record<string, KPIRecord[]> = {};
    filtered.forEach(k => { if (!g[k.category]) g[k.category] = []; g[k.category].push(k); });
    return g;
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total KPIs', val: summary.total, cls: 'text-white' },
          { label: 'On Target', val: summary.green, cls: 'text-emerald-400' },
          { label: 'Marginal', val: summary.yellow, cls: 'text-yellow-400' },
          { label: 'Off Target', val: summary.red, cls: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Traffic light mini-map */}
      {kpis.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="text-xs text-slate-500 mb-3 uppercase tracking-wide">KPI Health Map</div>
          <div className="flex flex-wrap gap-2">
            {kpis.map(k => (
              <div key={k.id} title={`${k.name}: ${k.actual} ${k.unit} (Target: ${k.target})`}
                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border cursor-default ${STATUS_COLOR[k.status]}`}>
                {k.id.replace('K', '')}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> On Target</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Marginal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Off Target</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="green">🟢 On Target</option>
          <option value="yellow">🟡 Marginal</option>
          <option value="red">🔴 Off Target</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} KPI{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* KPI Tables by category */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-3 bg-slate-700/50 border-b border-slate-700">
            <h3 className="font-semibold text-white text-sm">{cat}</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {items.map(k => {
              const vs = k.higherIsBetter
                ? ((k.actual - k.target) / k.target * 100)
                : ((k.target - k.actual) / k.target * 100);
              return (
                <div key={k.id} className="grid grid-cols-12 items-center gap-2 px-5 py-3 hover:bg-slate-700/30 transition-colors">
                  <div className="col-span-1">
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${STATUS_DOT[k.status]}`} />
                  </div>
                  <div className="col-span-4">
                    <div className="text-sm font-medium text-white">{k.name}</div>
                    <div className="text-xs text-slate-500">{k.clause} · {k.owner}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-xs text-slate-500">Target</div>
                    <div className="text-sm text-slate-300">{k.target} {k.unit}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-xs text-slate-500">Actual</div>
                    <div className={`text-sm font-bold ${k.status === 'green' ? 'text-emerald-400' : k.status === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>{k.actual} {k.unit}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-xs text-slate-500">vs Target</div>
                    <div className={`text-sm font-medium ${vs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{vs >= 0 ? '+' : ''}{vs.toFixed(1)}%</div>
                  </div>
                  <div className="col-span-1 text-center text-lg">
                    {trendIcon(k.trend, k.higherIsBetter)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">No KPIs match filters. Load sample data or adjust filters.</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — COQ + Improvement Tracker
// ══════════════════════════════════════════════════════════════════════════════
function ImprovementTab({ coq, improvements }: { coq: COQEntry[]; improvements: ImprovementProject[] }) {
  const [subTab, setSubTab] = useState<'coq' | 'improvements'>('coq');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  // COQ summary
  const coqSummary = useMemo(() => {
    const byCategory: Record<COQCategory, number> = { prevention: 0, appraisal: 0, 'internal-failure': 0, 'external-failure': 0 };
    coq.forEach(c => { byCategory[c.category] += c.amount; });
    const total = Object.values(byCategory).reduce((a, v) => a + v, 0);
    return { byCategory, total };
  }, [coq]);

  // Improvement summary
  const impSummary = useMemo(() => {
    const totalSavings = improvements.filter(i => i.status === 'completed').reduce((a, i) => a + i.savingsINR, 0);
    const completed = improvements.filter(i => i.status === 'completed').length;
    const inProgress = improvements.filter(i => i.status === 'in-progress').length;
    return { totalSavings, completed, inProgress, total: improvements.length };
  }, [improvements]);

  const filteredImp = useMemo(() =>
    improvements.filter(i =>
      (filterType === 'all' || i.type === filterType) &&
      (filterStatus === 'all' || i.status === filterStatus)
    ), [improvements, filterType, filterStatus]);

  return (
    <div className="space-y-5">
      <div className="flex border border-slate-700 rounded-lg overflow-hidden w-fit">
        {([['coq', '₹ COQ Analysis'], ['improvements', '💡 Improvement Projects']] as const).map(([st, label]) => (
          <button key={st} onClick={() => setSubTab(st)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${subTab === st ? 'bg-yellow-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {subTab === 'coq' && (
        <div className="space-y-5">
          {/* COQ summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(coqSummary.byCategory) as [COQCategory, number][]).map(([cat, amt]) => (
              <div key={cat} className={`rounded-xl border border-slate-700 p-4 ${COQ_COLOR[cat].replace('text-', 'border-').replace('bg-', '')}`}>
                <div className={`text-xs font-bold mb-2 ${COQ_COLOR[cat].split(' ')[0]}`}>{COQ_LABEL[cat]}</div>
                <div className="text-2xl font-bold text-white">₹{(amt / 1000).toFixed(1)}K</div>
                <div className="text-xs text-slate-500 mt-1">{coqSummary.total > 0 ? ((amt / coqSummary.total) * 100).toFixed(1) : 0}% of total COQ</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold text-white">Total COQ</div>
              <div className="text-2xl font-bold text-yellow-400">₹{(coqSummary.total / 1000).toFixed(1)}K</div>
            </div>
            {/* COQ bar */}
            <div className="flex h-6 rounded-full overflow-hidden mb-3">
              {(Object.entries(coqSummary.byCategory) as [COQCategory, number][]).map(([cat, amt]) => {
                const pct = coqSummary.total > 0 ? (amt / coqSummary.total * 100) : 0;
                const colors: Record<COQCategory, string> = { prevention: 'bg-emerald-500', appraisal: 'bg-blue-500', 'internal-failure': 'bg-yellow-500', 'external-failure': 'bg-red-500' };
                return pct > 0 ? <div key={cat} className={`${colors[cat]} transition-all`} style={{ width: `${pct}%` }} title={`${COQ_LABEL[cat]}: ₹${(amt / 1000).toFixed(1)}K (${pct.toFixed(1)}%)`} /> : null;
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {([['prevention', 'bg-emerald-500'], ['appraisal', 'bg-blue-500'], ['internal-failure', 'bg-yellow-500'], ['external-failure', 'bg-red-500']] as [COQCategory, string][]).map(([cat, cls]) => (
                <span key={cat} className="flex items-center gap-1.5 text-slate-400">
                  <span className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                  {COQ_LABEL[cat]}
                </span>
              ))}
            </div>
            <div className="mt-3 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
              <span className="text-white font-medium">COQ Goal:</span> Shift spend from Failure (internal + external) → Prevention. World-class: Failure Cost &lt; 30% of total COQ.
              <span className="ml-2 text-yellow-400">Your failure cost: {coqSummary.total > 0 ? (((coqSummary.byCategory['internal-failure'] + coqSummary.byCategory['external-failure']) / coqSummary.total) * 100).toFixed(0) : 0}%</span>
            </div>
          </div>

          {/* COQ entries */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-3 bg-slate-700/50 border-b border-slate-700 flex justify-between">
              <span className="font-semibold text-white text-sm">COQ Detail — {coq[0]?.month || 'Month'}</span>
              <span className="text-xs text-slate-400">{coq.length} entries</span>
            </div>
            <div className="divide-y divide-slate-700">
              {coq.map(entry => (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-700/30">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${COQ_COLOR[entry.category]}`}>{COQ_LABEL[entry.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{entry.description}</div>
                    <div className="text-xs text-slate-500">{entry.subcategory} · {entry.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">₹{entry.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'improvements' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Projects', val: impSummary.total, cls: 'text-white' },
              { label: 'In Progress', val: impSummary.inProgress, cls: 'text-blue-400' },
              { label: 'Completed', val: impSummary.completed, cls: 'text-emerald-400' },
              { label: 'Total Savings', val: `₹${(impSummary.totalSavings / 1000).toFixed(1)}K`, cls: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={`text-xl font-bold ${s.cls}`}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
              <option value="all">All Types</option>
              {Object.entries(IMP_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
              <option value="all">All Status</option>
              {['open', 'in-progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
            </select>
          </div>

          {/* Project cards */}
          <div className="space-y-3">
            {filteredImp.map(proj => {
              const isOpen = expanded === proj.id;
              return (
                <div key={proj.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <button className="w-full text-left p-4 hover:bg-slate-700/30 transition-colors" onClick={() => setExpanded(isOpen ? null : proj.id)}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${IMP_TYPE_COLOR[proj.type]}`}>{IMP_TYPE_LABEL[proj.type]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${IMP_STATUS_COLOR[proj.status]}`}>{proj.status.replace('-', ' ').toUpperCase()}</span>
                      <span className="text-sm font-medium text-white flex-1">{proj.title}</span>
                      <div className="flex items-center gap-3 ml-auto">
                        {proj.savingsINR > 0 && <span className="text-emerald-400 text-sm font-bold">₹{proj.savingsINR.toLocaleString()}</span>}
                        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{proj.team} · {proj.department} · Stage: {proj.stage}</div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-700 p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500">Problem Statement</div>
                          <div className="text-slate-300 mt-1">{proj.problem}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500">Target</div>
                          <div className="text-slate-300 mt-1">{proj.target}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500">Result</div>
                          <div className={`mt-1 ${proj.actualResult ? 'text-emerald-300' : 'text-slate-500'}`}>{proj.actualResult || 'In progress...'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        {[{ l: 'Start Date', v: proj.startDate }, { l: 'Target Date', v: proj.targetDate }, { l: 'Completed', v: proj.completedDate || '—' }].map(d => (
                          <div key={d.l} className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-xs text-slate-500">{d.l}</div>
                            <div className="text-white">{d.v}</div>
                          </div>
                        ))}
                      </div>
                      {(proj.savingsINR > 0 || proj.savingsHrs > 0) && (
                        <div className="flex gap-3">
                          {proj.savingsINR > 0 && <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-3 text-sm"><div className="text-xs text-slate-500">Financial Savings</div><div className="text-emerald-400 font-bold">₹{proj.savingsINR.toLocaleString()}</div></div>}
                          {proj.savingsHrs > 0 && <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-3 text-sm"><div className="text-xs text-slate-500">Time Savings</div><div className="text-blue-400 font-bold">{proj.savingsHrs} hrs/yr</div></div>}
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Knowledge Hub
// ══════════════════════════════════════════════════════════════════════════════
function KnowledgeHubTab() {
  const tqmPillars = [
    { name: 'Customer Focus', icon: '🎯', desc: 'Every decision starts with customer satisfaction. VOC → CTQ → KPIs aligned to customer expectations. Measured by CSAT, PPM, warranty.' },
    { name: 'Total Employee Involvement', icon: '👥', desc: 'Every employee participates in improvement. Kaizen, QCC, suggestions, TEI score. Bottom-up problem solving culture.' },
    { name: 'Continuous Improvement (Kaizen)', icon: '🔁', desc: 'Incremental daily improvements at every level. PDCA cycle, Kaizen events, 5S, suggestion system, Kaizen rewards.' },
    { name: 'Process Focus', icon: '🔄', desc: 'Manage and measure processes, not just outputs. Process capability (Cp/Cpk), SPC, standardization, work instructions.' },
    { name: 'Fact-Based Decision Making', icon: '📊', desc: 'Data over opinion. Control charts, Pareto, MSA, KPI dashboards. No decisions without data.' },
    { name: 'Systems Thinking', icon: '🌐', desc: 'See the whole, not just parts. Integrated QMS, IATF 16949, cross-functional teams, supplier–customer linkage.' },
  ];

  const coqGuide = [
    { cat: 'Prevention (Good Investment)', color: 'emerald', items: ['Training & education', 'Process design / FMEA', 'Supplier qualification', 'Preventive maintenance', 'Poka-yoke design', 'Quality planning (APQP)'], goal: 'Increase this — prevents failures before they occur' },
    { cat: 'Appraisal (Necessary Cost)', color: 'blue', items: ['Incoming inspection (IQC)', 'In-process inspection (IPQC)', 'Final inspection / OQC', 'Calibration', 'Audit costs'], goal: 'Optimise with risk-based approach + MSA improvement' },
    { cat: 'Internal Failure (Waste)', color: 'yellow', items: ['Scrap', 'Rework', 'Downtime (quality-caused)', 'Re-inspection after rework', 'Material review costs'], goal: 'Eliminate — every rupee here = failed prevention' },
    { cat: 'External Failure (Most Costly)', color: 'red', items: ['Warranty returns', 'Customer complaint investigation', 'Field service / recall', 'Goodwill compensation', 'Customer line stoppage'], goal: 'Zero tolerance — customer facing, brand damage + financial risk' },
  ];

  const pdcaSteps = [
    { step: 'P — Plan', color: 'blue', items: ['Identify the problem with data', 'Set measurable target', 'Analyse root causes (Fishbone, 5-Why)', 'Select countermeasures', 'Plan implementation with timeline'] },
    { step: 'D — Do', color: 'yellow', items: ['Implement countermeasures on trial basis', 'Train team on new method', 'Collect data during trial', 'Document changes made'] },
    { step: 'C — Check', color: 'emerald', items: ['Compare results vs target', 'Verify root cause is eliminated', 'Check for side effects', 'Use before/after data'] },
    { step: 'A — Act', color: 'purple', items: ['If successful: standardise (SOP/ODS update)', 'Share with similar processes (Yokoten)', 'If failed: repeat PDCA with new hypothesis', 'Document lessons learned'] },
  ];

  const managementReviewInputs = [
    'Customer satisfaction & complaints status',
    'KPI performance — actual vs target (all categories)',
    'Internal / external audit findings & status',
    'CAPA effectiveness review',
    'Supplier quality performance & PPM trend',
    'COQ analysis — prevention vs failure ratio',
    'Improvement projects savings & status (Kaizen / GB)',
    'Risk register review',
    'Resource adequacy review (people, equipment, calibration)',
    'Objectives & quality policy relevance review',
  ];

  return (
    <div className="space-y-6">
      {/* TQM Pillars */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">🏛️ 6 Pillars of TQM</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tqmPillars.map(p => (
            <div key={p.name} className="bg-slate-900/50 rounded-lg p-4 flex gap-3">
              <div className="text-2xl">{p.icon}</div>
              <div>
                <div className="font-medium text-white text-sm">{p.name}</div>
                <div className="text-xs text-slate-400 mt-1">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COQ Guide */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">₹ Cost of Quality (COQ) — 4 Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {coqGuide.map(c => (
            <div key={c.cat} className={`bg-slate-900/50 rounded-lg p-4 border border-${c.color}-800/40`}>
              <div className={`font-semibold text-${c.color}-400 text-sm mb-2`}>{c.cat}</div>
              {c.items.map(i => <div key={i} className="text-xs text-slate-400 py-0.5">• {i}</div>)}
              <div className={`mt-2 text-xs text-${c.color}-300 font-medium`}>→ {c.goal}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PDCA */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">🔁 PDCA Cycle — Problem Solving Framework</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pdcaSteps.map(s => (
            <div key={s.step} className={`bg-slate-900/50 rounded-lg p-4 border-t-2 border-${s.color}-500`}>
              <div className={`font-bold text-${s.color}-400 text-sm mb-3`}>{s.step}</div>
              {s.items.map(i => <div key={i} className="text-xs text-slate-400 py-0.5">→ {i}</div>)}
            </div>
          ))}
        </div>
      </div>

      {/* Management Review Inputs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">📋 Management Review — Mandatory Inputs (IATF Cl. 9.3)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {managementReviewInputs.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm bg-slate-900/50 rounded-lg p-3">
              <span className="text-yellow-400 shrink-0 font-bold">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-slate-300">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500 p-3 bg-slate-900/50 rounded-lg">
          Frequency: Minimum once per year. Automotive best practice: Quarterly. Records of management review must be maintained as documented information.
        </div>
      </div>

      {/* QCC / QC Story */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">⭕ QCC / QC Story — 10-Step Format</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {['1. Theme Selection', '2. Reason for Selection', '3. Current Status (Data)', '4. Target Setting', '5. Cause Analysis', '6. Countermeasures', '7. Implementation', '8. Results (Before/After)', '9. Standardisation', '10. Future Plans'].map((step, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-300">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — TQM Guide
// ══════════════════════════════════════════════════════════════════════════════
function TQMGuideTab() {
  const steps = [
    { no: '01', icon: '📊', title: 'Monthly KPI Review', points: ['Pull actual vs target for all KPIs — customer, manufacturing, supplier, system, TQM', 'Colour-code: Green (on target) / Yellow (marginal) / Red (off target)', 'For every Red KPI: identify owner, raise CAPA or improvement project', 'Prepare one-page KPI summary for management review', 'Post KPI board update at plant entrance / quality notice board', 'Track KPI trend — 3 months consecutive red = escalate to management'] },
    { no: '02', icon: '₹', title: 'COQ Analysis & Reporting', points: ['Collect COQ data from finance, production, quality, and customer teams', 'Classify into Prevention / Appraisal / Internal Failure / External Failure', 'Calculate % failure cost of total COQ (target < 30%)', 'Identify top 3 failure cost drivers — assign CAPA', 'Track COQ trend monthly — any month with > 10% increase needs formal review', 'Present COQ report at management review with action plan'] },
    { no: '03', icon: '💡', title: 'Kaizen & Improvement Management', points: ['Set monthly Kaizen target per person (e.g. 2 Kaizens/person/month)', 'Track TEI score weekly by department', 'Review each Kaizen for quality, safety, or cost benefit', 'Calculate and certify financial savings for completed projects', 'Recognize top contributors publicly — monthly Kaizen Champion', 'Compile Kaizen register and cumulative savings tracker'] },
    { no: '04', icon: '⭕', title: 'QCC / Green Belt Coaching', points: ['Conduct weekly QCC meeting audit — are all circles meeting?', 'Check PDCA stage for each circle — coach if stuck', 'Review QC Story completeness — all 10 steps with data evidence', 'Identify Green Belt projects aligned to strategic KPI gaps', 'Track GB project DMAIC stage and savings', 'Nominate projects for internal and external conventions'] },
    { no: '05', icon: '🔍', title: 'TBEM / Business Excellence Review', points: ['Monthly self-assessment update across all 7 TBEM categories', 'Collect and file evidence against each criteria', 'Use ADLI framework to score: Approach, Deployment, Learning, Integration', 'Identify top 3 gaps per category and assign improvement themes', 'Track score trend vs previous assessment', 'Prepare submission documentation for external assessment'] },
    { no: '06', icon: '📋', title: 'Management Review Preparation', points: ['Compile all mandatory inputs: KPIs, audit findings, CAPA status, COQ, improvement savings', 'Prepare executive dashboard — all KPIs on one page with RAG status', 'Highlight top 3 risks and top 3 improvement opportunities', 'Include VOC — customer satisfaction score and complaint trends', 'Review previous management review action items — status update', 'Obtain management sign-off on review minutes within 5 working days'] },
    { no: '07', icon: '🏆', title: 'Awards & External Recognition', points: ['Maintain calendar of external quality conventions and award competitions', 'Select top QCC / Kaizen / GB projects for submission each quarter', 'Coach teams on presentation format and Q&A preparation', 'Submit entries before deadline with required documentation', 'Post award results on notice board — recognize publicly', 'Lessons from awards: share best practices across plant via Yokoten'] },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">7-step TQM operating rhythm — from KPI review and COQ analysis through Kaizen management, TBEM self-assessment, and external recognition. Aligned to IATF 16949 Cl. 9.1, 9.3, 10.3 and TQM best practices.</p>
      </div>
      {steps.map(step => (
        <div key={step.no} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-yellow-900/50 border border-yellow-700 flex items-center justify-center text-sm font-bold text-yellow-400">{step.no}</div>
            <div className="text-xl">{step.icon}</div>
            <h3 className="font-semibold text-white">{step.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {step.points.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-400 mt-0.5 shrink-0">→</span>
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
export default function TQMPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [kpis, setKpis] = useState<KPIRecord[]>([]);
  const [coq, setCoq] = useState<COQEntry[]>([]);
  const [improvements, setImprovements] = useState<ImprovementProject[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Recalculate KPI status dynamically
  const processedKpis = useMemo(() =>
    kpis.map(k => ({ ...k, status: kpiStatus(k.actual, k.target, k.higherIsBetter) })),
    [kpis]
  );

  const headerStats = useMemo(() => {
    const green = processedKpis.filter(k => k.status === 'green').length;
    const red = processedKpis.filter(k => k.status === 'red').length;
    const totalCOQ = coq.reduce((a, c) => a + c.amount, 0);
    const failureCOQ = coq.filter(c => c.category === 'internal-failure' || c.category === 'external-failure').reduce((a, c) => a + c.amount, 0);
    const totalSavings = improvements.filter(i => i.status === 'completed').reduce((a, i) => a + i.savingsINR, 0);
    const kaizens = improvements.filter(i => i.type === 'kaizen' && i.status === 'completed').length;
    return { green, red, totalCOQ, failureCOQ, totalSavings, kaizens };
  }, [processedKpis, coq, improvements]);

  const tabs = ['📊 KPI Dashboard', '₹ COQ & Improvements', '📚 Knowledge Hub', '📖 TQM Guide'];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900/40 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🏆</span>
                <h1 className="text-2xl font-bold text-white">TQM / Business Excellence</h1>
              </div>
              <p className="text-slate-400 text-sm">Quality KPIs · COQ Analysis · Kaizen · QCC · Green Belt · Management Review · TBEM</p>
            </div>
            <button
              onClick={() => {
                if (!loaded) { setKpis(SAMPLE_KPIS); setCoq(SAMPLE_COQ); setImprovements(SAMPLE_IMPROVEMENTS); setLoaded(true); }
                else { setKpis([]); setCoq([]); setImprovements([]); setLoaded(false); }
              }}
              className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>

          {/* Header KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'KPIs On Target', value: processedKpis.length > 0 ? `${headerStats.green} / ${processedKpis.length}` : '—', color: 'text-emerald-400', sub: `${headerStats.red} off target` },
              { label: 'Total COQ (Month)', value: coq.length > 0 ? `₹${(headerStats.totalCOQ / 1000).toFixed(1)}K` : '—', color: 'text-yellow-400', sub: coq.length > 0 ? `Failure: ${headerStats.totalCOQ > 0 ? ((headerStats.failureCOQ / headerStats.totalCOQ) * 100).toFixed(0) : 0}%` : '' },
              { label: 'CI Savings (Total)', value: improvements.length > 0 ? `₹${(headerStats.totalSavings / 1000).toFixed(1)}K` : '—', color: 'text-emerald-400', sub: 'Completed projects' },
              { label: 'Kaizens Done', value: improvements.length > 0 ? `${headerStats.kaizens}` : '—', color: 'text-white', sub: `${improvements.filter(i => i.status === 'in-progress').length} in progress` },
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
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <KPIDashboardTab kpis={processedKpis} />}
        {activeTab === 1 && <ImprovementTab coq={coq} improvements={improvements} />}
        {activeTab === 2 && <KnowledgeHubTab />}
        {activeTab === 3 && <TQMGuideTab />}
      </div>
    </div>
  );
}
