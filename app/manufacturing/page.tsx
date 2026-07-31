'use client';
import { useState, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Shift = 'A' | 'B' | 'C';
type ShiftStatus = 'running' | 'completed' | 'planned';
type DowntimeCategory = 'breakdown' | 'planned-maintenance' | 'changeover' | 'material-shortage' | 'quality-hold' | 'other';
type MaintenanceType = 'preventive' | 'predictive' | 'corrective' | 'breakdown';
type MaintenanceStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';

interface ShiftLog {
  id: string;
  date: string;
  shift: Shift;
  line: string;
  partNumber: string;
  partName: string;
  planQty: number;
  actualQty: number;
  goodQty: number;
  rejectQty: number;
  reworkQty: number;
  plannedTime: number;   // minutes
  actualRunTime: number; // minutes
  downtime: number;      // minutes
  status: ShiftStatus;
  operator: string;
  supervisor: string;
  notes: string;
}

interface DowntimeEntry {
  id: string;
  shiftLogId: string;
  date: string;
  shift: Shift;
  line: string;
  startTime: string;
  endTime: string;
  duration: number;      // minutes
  category: DowntimeCategory;
  equipment: string;
  description: string;
  rootCause: string;
  actionTaken: string;
  reportedBy: string;
}

interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  line: string;
  type: MaintenanceType;
  description: string;
  frequency: string;
  scheduledDate: string;
  completedDate: string;
  status: MaintenanceStatus;
  assignedTo: string;
  estimatedDuration: number; // minutes
  actualDuration: number;
  checklist: string[];
  remarks: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SHIFT_LABELS: Record<Shift, string> = { A: 'Shift A (6–14)', B: 'Shift B (14–22)', C: 'Shift C (22–6)' };
const DT_CATEGORY_LABELS: Record<DowntimeCategory, string> = {
  'breakdown': 'Machine Breakdown',
  'planned-maintenance': 'Planned Maintenance',
  'changeover': 'Changeover / Setup',
  'material-shortage': 'Material Shortage',
  'quality-hold': 'Quality Hold',
  'other': 'Other',
};
const MAINT_TYPE_COLOR: Record<MaintenanceType, string> = {
  preventive: 'text-blue-400 bg-blue-900/40',
  predictive: 'text-purple-400 bg-purple-900/40',
  corrective: 'text-yellow-400 bg-yellow-900/40',
  breakdown: 'text-red-400 bg-red-900/40',
};
const MAINT_STATUS_COLOR: Record<MaintenanceStatus, string> = {
  pending: 'text-slate-400 bg-slate-700',
  'in-progress': 'text-blue-400 bg-blue-900/40',
  completed: 'text-emerald-400 bg-emerald-900/40',
  overdue: 'text-red-400 bg-red-900/40',
};

function oeeCalc(log: ShiftLog) {
  const availability = log.plannedTime > 0 ? log.actualRunTime / log.plannedTime : 0;
  const performance = (log.actualRunTime > 0 && log.planQty > 0)
    ? (log.actualQty / log.planQty) * (log.plannedTime / log.actualRunTime)
    : 0;
  const quality = log.actualQty > 0 ? log.goodQty / log.actualQty : 0;
  const oee = availability * performance * quality;
  return {
    availability: Math.min(availability, 1),
    performance: Math.min(performance, 1),
    quality: Math.min(quality, 1),
    oee: Math.min(oee, 1),
  };
}

function pct(v: number) { return (v * 100).toFixed(1) + '%'; }
function oeeColor(v: number) {
  if (v >= 0.85) return 'text-emerald-400';
  if (v >= 0.70) return 'text-yellow-400';
  return 'text-red-400';
}

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_SHIFTS: ShiftLog[] = [
  { id: 'SL001', date: '2025-01-15', shift: 'A', line: 'Line-1', partNumber: 'PN-4521', partName: 'Bracket Assembly', planQty: 480, actualQty: 462, goodQty: 445, rejectQty: 12, reworkQty: 5, plannedTime: 480, actualRunTime: 440, downtime: 40, status: 'completed', operator: 'Ravi Kumar', supervisor: 'Amit Sharma', notes: 'Downtime due to sensor fault at 08:30' },
  { id: 'SL002', date: '2025-01-15', shift: 'B', line: 'Line-1', partNumber: 'PN-4521', partName: 'Bracket Assembly', planQty: 480, actualQty: 476, goodQty: 470, rejectQty: 4, reworkQty: 2, plannedTime: 480, actualRunTime: 468, downtime: 12, status: 'completed', operator: 'Suresh Patel', supervisor: 'Manoj Singh', notes: 'Good shift. Minor changeover delay.' },
  { id: 'SL003', date: '2025-01-15', shift: 'C', line: 'Line-2', partNumber: 'PN-7823', partName: 'Housing Cover', planQty: 320, actualQty: 298, goodQty: 289, rejectQty: 9, reworkQty: 0, plannedTime: 480, actualRunTime: 410, downtime: 70, status: 'completed', operator: 'Deepak Yadav', supervisor: 'Priya Nair', notes: 'Breakdown on Welding Station-2 for 55 min' },
  { id: 'SL004', date: '2025-01-16', shift: 'A', line: 'Line-2', partNumber: 'PN-7823', partName: 'Housing Cover', planQty: 320, actualQty: 315, goodQty: 312, rejectQty: 3, reworkQty: 0, plannedTime: 480, actualRunTime: 472, downtime: 8, status: 'completed', operator: 'Ramesh Babu', supervisor: 'Priya Nair', notes: '' },
  { id: 'SL005', date: '2025-01-16', shift: 'B', line: 'Line-3', partNumber: 'PN-3301', partName: 'Shaft Gear', planQty: 200, actualQty: 180, goodQty: 175, rejectQty: 5, reworkQty: 0, plannedTime: 480, actualRunTime: 380, downtime: 100, status: 'completed', operator: 'Vikram Singh', supervisor: 'Kiran Desai', notes: 'Material shortage 60 min + tool changeover 40 min' },
];

const SAMPLE_DOWNTIME: DowntimeEntry[] = [
  { id: 'DT001', shiftLogId: 'SL001', date: '2025-01-15', shift: 'A', line: 'Line-1', startTime: '08:30', endTime: '09:10', duration: 40, category: 'breakdown', equipment: 'Pneumatic Press P-01', description: 'Proximity sensor failure — press not cycling', rootCause: 'Sensor worn out — 18 months old, exceeded PM schedule', actionTaken: 'Replaced sensor, re-calibrated, resumed production', reportedBy: 'Ravi Kumar' },
  { id: 'DT002', shiftLogId: 'SL002', date: '2025-01-15', shift: 'B', line: 'Line-1', startTime: '17:45', endTime: '17:57', duration: 12, category: 'changeover', equipment: 'Press P-01', description: 'Part changeover from PN-4521 to PN-4522', rootCause: 'Scheduled changeover', actionTaken: 'SMED changeover completed', reportedBy: 'Suresh Patel' },
  { id: 'DT003', shiftLogId: 'SL003', date: '2025-01-15', shift: 'C', line: 'Line-2', startTime: '23:10', endTime: '00:05', duration: 55, category: 'breakdown', equipment: 'Welding Station W-02', description: 'MIG welding wire feed jam — production halted', rootCause: 'Wire spool end not detected — no interlock', actionTaken: 'Wire feed cleared, spool replaced, interlock requested via MRN', reportedBy: 'Deepak Yadav' },
  { id: 'DT004', shiftLogId: 'SL003', date: '2025-01-15', shift: 'C', line: 'Line-2', startTime: '01:00', endTime: '01:15', duration: 15, category: 'quality-hold', equipment: 'Inspection Station QS-2', description: 'Dimensional OOS detected — production paused for sorting', rootCause: 'Fixture slip during welding', actionTaken: '100% sorting initiated, fixture re-clamped, setup verified', reportedBy: 'Deepak Yadav' },
  { id: 'DT005', shiftLogId: 'SL005', date: '2025-01-16', shift: 'B', line: 'Line-3', startTime: '15:00', endTime: '16:00', duration: 60, category: 'material-shortage', equipment: 'N/A', description: 'Raw material stock-out — PN-3301 blanks not delivered from stores', rootCause: 'Stores not notified of revised production schedule', actionTaken: 'Emergency material issue, stores alerted, scheduling sync meeting arranged', reportedBy: 'Vikram Singh' },
];

const SAMPLE_MAINTENANCE: MaintenanceTask[] = [
  { id: 'MT001', equipmentId: 'EQ-P01', equipmentName: 'Pneumatic Press P-01', line: 'Line-1', type: 'preventive', description: 'Monthly PM — lubrication, sensor check, pressure calibration', frequency: 'Monthly', scheduledDate: '2025-01-20', completedDate: '', status: 'pending', assignedTo: 'Maintenance Technician — Ashok', estimatedDuration: 90, actualDuration: 0, checklist: ['Check oil level & lubricate slides', 'Test all proximity sensors', 'Calibrate pressure regulator', 'Inspect pneumatic hoses & fittings', 'Clean die and check alignment'], remarks: '' },
  { id: 'MT002', equipmentId: 'EQ-W02', equipmentName: 'Welding Station W-02', line: 'Line-2', type: 'corrective', description: 'Install wire-end detection interlock — raised after DT003 breakdown', frequency: 'One-time', scheduledDate: '2025-01-18', completedDate: '', status: 'in-progress', assignedTo: 'Automation Technician — Sunil', estimatedDuration: 120, actualDuration: 0, checklist: ['Source reed switch sensor', 'Install on wire feed unit', 'Wire to PLC input', 'Test wire-end alarm trigger', 'Validate with production trial'], remarks: 'Sensor sourced — wiring in progress' },
  { id: 'MT003', equipmentId: 'EQ-C03', equipmentName: 'CNC Machining Center C-03', line: 'Line-3', type: 'preventive', description: 'Weekly PM — spindle warm-up, coolant level, chip conveyor check', frequency: 'Weekly', scheduledDate: '2025-01-13', completedDate: '2025-01-13', status: 'completed', assignedTo: 'Maintenance Technician — Raju', estimatedDuration: 45, actualDuration: 40, checklist: ['Spindle warm-up 10 min', 'Check coolant concentration', 'Clean chip conveyor', 'Inspect tool holders', 'Verify axis home positions'], remarks: 'All OK. Coolant topped up 2 litres.' },
  { id: 'MT004', equipmentId: 'EQ-C04', equipmentName: 'Conveyor Belt C-04', line: 'Line-1', type: 'preventive', description: 'Quarterly PM — belt tension, roller bearings, motor check', frequency: 'Quarterly', scheduledDate: '2025-01-10', completedDate: '', status: 'overdue', assignedTo: 'Maintenance Technician — Ashok', estimatedDuration: 60, actualDuration: 0, checklist: ['Check belt tension & alignment', 'Inspect all rollers for bearing noise', 'Lubricate motor bearings', 'Check drive chain tension', 'Test emergency stop'], remarks: 'Overdue — technician was on breakdown duty' },
  { id: 'MT005', equipmentId: 'EQ-R01', equipmentName: 'Robotic Arm R-01', line: 'Line-2', type: 'predictive', description: 'Vibration analysis — axis joints 1–4', frequency: 'Quarterly', scheduledDate: '2025-01-25', completedDate: '', status: 'pending', assignedTo: 'External OEM Service', estimatedDuration: 180, actualDuration: 0, checklist: ['Mount vibration sensors on J1–J4', 'Record baseline vs previous quarter', 'Analyse frequency spectrum', 'Grease replenishment if needed', 'Issue health report'], remarks: 'OEM engineer scheduled 25-Jan 9:00 AM' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function OEEBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${color}`}>{pct(value)}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${value >= 0.85 ? 'bg-emerald-500' : value >= 0.70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(value * 100, 100)}%` }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Shift Production Dashboard
// ══════════════════════════════════════════════════════════════════════════════
function ShiftDashboardTab({ shifts }: { shifts: ShiftLog[] }) {
  const [filterLine, setFilterLine] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const lines = useMemo(() => ['all', ...Array.from(new Set(shifts.map(s => s.line)))], [shifts]);

  const filtered = useMemo(() =>
    shifts.filter(s =>
      (filterLine === 'all' || s.line === filterLine) &&
      (filterShift === 'all' || s.shift === filterShift)
    ), [shifts, filterLine, filterShift]);

  const totals = useMemo(() => {
    const totalPlan = filtered.reduce((a, s) => a + s.planQty, 0);
    const totalActual = filtered.reduce((a, s) => a + s.actualQty, 0);
    const totalGood = filtered.reduce((a, s) => a + s.goodQty, 0);
    const totalReject = filtered.reduce((a, s) => a + s.rejectQty, 0);
    const totalDowntime = filtered.reduce((a, s) => a + s.downtime, 0);
    const totalPlanned = filtered.reduce((a, s) => a + s.plannedTime, 0);
    const totalRun = filtered.reduce((a, s) => a + s.actualRunTime, 0);
    const avail = totalPlanned > 0 ? totalRun / totalPlanned : 0;
    const perf = totalRun > 0 && totalPlan > 0 ? (totalActual / totalPlan) * (totalPlanned / totalRun) : 0;
    const qual = totalActual > 0 ? totalGood / totalActual : 0;
    const oee = avail * perf * qual;
    return { totalPlan, totalActual, totalGood, totalReject, totalDowntime, avail, perf, qual, oee };
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Plan Qty', value: totals.totalPlan.toLocaleString(), sub: 'Total planned' },
          { label: 'Actual Qty', value: totals.totalActual.toLocaleString(), sub: `${totals.totalGood.toLocaleString()} good` },
          { label: 'Rejects', value: totals.totalReject.toLocaleString(), sub: totals.totalActual > 0 ? `${((totals.totalReject / totals.totalActual) * 100).toFixed(2)}% rejection` : '—' },
          { label: 'Downtime', value: `${totals.totalDowntime} min`, sub: `${(totals.totalDowntime / 60).toFixed(1)} hrs` },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* OEE Dashboard */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">OEE Dashboard</h3>
          <div className={`text-2xl font-bold ${oeeColor(totals.oee)}`}>{pct(totals.oee)} OEE</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Availability</div>
            <div className={`text-3xl font-bold ${oeeColor(totals.avail)}`}>{pct(totals.avail)}</div>
            <OEEBar label="Run Time / Planned Time" value={totals.avail} color={oeeColor(totals.avail)} />
            <div className="text-xs text-slate-500">Target ≥ 90%</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Performance</div>
            <div className={`text-3xl font-bold ${oeeColor(totals.perf)}`}>{pct(totals.perf)}</div>
            <OEEBar label="Actual Rate / Ideal Rate" value={totals.perf} color={oeeColor(totals.perf)} />
            <div className="text-xs text-slate-500">Target ≥ 95%</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Quality</div>
            <div className={`text-3xl font-bold ${oeeColor(totals.qual)}`}>{pct(totals.qual)}</div>
            <OEEBar label="Good Parts / Total Parts" value={totals.qual} color={oeeColor(totals.qual)} />
            <div className="text-xs text-slate-500">Target ≥ 99%</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
          <span className="font-medium text-slate-300">OEE = Availability × Performance × Quality</span>
          <span className="mx-2">|</span>
          World-class OEE ≥ 85%
          <span className="mx-2 text-emerald-400">■ ≥85% Good</span>
          <span className="mr-2 text-yellow-400">■ 70–85% Average</span>
          <span className="text-red-400">■ &lt;70% Poor</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
          {lines.map(l => <option key={l} value={l}>{l === 'all' ? 'All Lines' : l}</option>)}
        </select>
        <select value={filterShift} onChange={e => setFilterShift(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
          <option value="all">All Shifts</option>
          {(['A', 'B', 'C'] as Shift[]).map(s => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} shift log{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Shift Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">No shift logs match the selected filters.</div>
        )}
        {filtered.map(log => {
          const { availability, performance, quality, oee } = oeeCalc(log);
          const isOpen = expanded === log.id;
          return (
            <div key={log.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <button className="w-full text-left p-4 hover:bg-slate-750 transition-colors" onClick={() => setExpanded(isOpen ? null : log.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">{log.id}</span>
                    <span className="text-sm font-medium text-white">{log.date}</span>
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">{SHIFT_LABELS[log.shift]}</span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{log.line}</span>
                  </div>
                  <span className="text-sm text-slate-300">{log.partName} <span className="text-slate-500">({log.partNumber})</span></span>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Actual / Plan</div>
                      <div className="text-sm font-semibold text-white">{log.actualQty} / {log.planQty}</div>
                    </div>
                    <div className={`text-lg font-bold ${oeeColor(oee)} min-w-[60px] text-right`}>{pct(oee)}</div>
                    <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 p-4 space-y-4">
                  {/* OEE mini bars */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Availability</div>
                      <div className={`text-lg font-bold ${oeeColor(availability)}`}>{pct(availability)}</div>
                      <OEEBar label="" value={availability} color={oeeColor(availability)} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Performance</div>
                      <div className={`text-lg font-bold ${oeeColor(performance)}`}>{pct(performance)}</div>
                      <OEEBar label="" value={performance} color={oeeColor(performance)} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Quality</div>
                      <div className={`text-lg font-bold ${oeeColor(quality)}`}>{pct(quality)}</div>
                      <OEEBar label="" value={quality} color={oeeColor(quality)} />
                    </div>
                  </div>

                  {/* Production detail */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { label: 'Plan Qty', val: log.planQty },
                      { label: 'Actual Qty', val: log.actualQty },
                      { label: 'Good Qty', val: log.goodQty },
                      { label: 'Reject Qty', val: log.rejectQty },
                      { label: 'Rework Qty', val: log.reworkQty },
                      { label: 'Planned Time', val: `${log.plannedTime} min` },
                      { label: 'Run Time', val: `${log.actualRunTime} min` },
                      { label: 'Downtime', val: `${log.downtime} min` },
                    ].map(d => (
                      <div key={d.label} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500">{d.label}</div>
                        <div className="font-semibold text-white">{d.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500">Operator</div>
                      <div className="text-white">{log.operator}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500">Supervisor</div>
                      <div className="text-white">{log.supervisor}</div>
                    </div>
                  </div>
                  {log.notes && (
                    <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-3 text-sm text-yellow-300">
                      📝 {log.notes}
                    </div>
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
// TAB 2 — Downtime Log + TPM Maintenance Register
// ══════════════════════════════════════════════════════════════════════════════
function DowntimeTPMTab({ downtimes, maintenance }: { downtimes: DowntimeEntry[]; maintenance: MaintenanceTask[] }) {
  const [subTab, setSubTab] = useState<'downtime' | 'tpm'>('downtime');
  const [expandedMaint, setExpandedMaint] = useState<string | null>(null);

  // Downtime Pareto
  const paretoCounts = useMemo(() => {
    const counts: Record<DowntimeCategory, number> = { breakdown: 0, 'planned-maintenance': 0, changeover: 0, 'material-shortage': 0, 'quality-hold': 0, other: 0 };
    downtimes.forEach(d => { counts[d.category] += d.duration; });
    return Object.entries(counts)
      .map(([cat, dur]) => ({ cat: cat as DowntimeCategory, dur }))
      .sort((a, b) => b.dur - a.dur);
  }, [downtimes]);
  const totalDT = paretoCounts.reduce((a, p) => a + p.dur, 0);

  const maintStats = useMemo(() => ({
    total: maintenance.length,
    pending: maintenance.filter(m => m.status === 'pending').length,
    inProgress: maintenance.filter(m => m.status === 'in-progress').length,
    completed: maintenance.filter(m => m.status === 'completed').length,
    overdue: maintenance.filter(m => m.status === 'overdue').length,
  }), [maintenance]);

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex border border-slate-700 rounded-lg overflow-hidden w-fit">
        {(['downtime', 'tpm'] as const).map(st => (
          <button key={st} onClick={() => setSubTab(st)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${subTab === st ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {st === 'downtime' ? '⏹ Downtime Log' : '🔧 TPM Register'}
          </button>
        ))}
      </div>

      {subTab === 'downtime' && (
        <div className="space-y-5">
          {/* Pareto summary */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold text-white mb-4">Downtime Pareto — {totalDT} min total</h3>
            <div className="space-y-3">
              {paretoCounts.filter(p => p.dur > 0).map((p, i) => {
                const pctVal = totalDT > 0 ? p.dur / totalDT : 0;
                const cumPct = paretoCounts.slice(0, i + 1).reduce((a, x) => a + x.dur, 0) / (totalDT || 1);
                const barColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500', 'bg-slate-500'];
                return (
                  <div key={p.cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{DT_CATEGORY_LABELS[p.cat]}</span>
                      <div className="flex gap-4">
                        <span className="text-slate-400">{p.dur} min</span>
                        <span className="text-white font-medium">{pct(pctVal)}</span>
                        <span className="text-slate-500 text-xs pt-0.5">cum {pct(cumPct)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColors[i] || 'bg-slate-500'}`} style={{ width: `${pctVal * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Downtime entries */}
          <div className="space-y-3">
            {downtimes.map(dt => (
              <div key={dt.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">{dt.id}</span>
                  <span className="text-sm font-medium text-white">{dt.date} · {SHIFT_LABELS[dt.shift]} · {dt.line}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${dt.category === 'breakdown' ? 'bg-red-900/40 text-red-400' : dt.category === 'quality-hold' ? 'bg-orange-900/40 text-orange-400' : dt.category === 'material-shortage' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                    {DT_CATEGORY_LABELS[dt.category]}
                  </span>
                  <span className="ml-auto text-lg font-bold text-red-400">{dt.duration} min</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Equipment · Time</div>
                    <div className="text-white">{dt.equipment}</div>
                    <div className="text-slate-400">{dt.startTime} → {dt.endTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Description / Root Cause</div>
                    <div className="text-white">{dt.description}</div>
                    <div className="text-slate-400 text-xs mt-1">RC: {dt.rootCause}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Action Taken</div>
                    <div className="text-emerald-300">{dt.actionTaken}</div>
                    <div className="text-slate-500 text-xs mt-1">By: {dt.reportedBy}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'tpm' && (
        <div className="space-y-5">
          {/* TPM summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Tasks', val: maintStats.total, cls: 'text-white' },
              { label: 'Pending', val: maintStats.pending, cls: 'text-slate-400' },
              { label: 'In Progress', val: maintStats.inProgress, cls: 'text-blue-400' },
              { label: 'Completed', val: maintStats.completed, cls: 'text-emerald-400' },
              { label: 'Overdue', val: maintStats.overdue, cls: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Maintenance cards */}
          <div className="space-y-3">
            {maintenance.map(task => {
              const isOpen = expandedMaint === task.id;
              return (
                <div key={task.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <button className="w-full text-left p-4 hover:bg-slate-750 transition-colors" onClick={() => setExpandedMaint(isOpen ? null : task.id)}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">{task.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${MAINT_TYPE_COLOR[task.type]}`}>{task.type.toUpperCase()}</span>
                      <span className="text-sm font-medium text-white">{task.equipmentName}</span>
                      <span className="text-xs text-slate-400">{task.line}</span>
                      <div className="ml-auto flex items-center gap-3">
                        <span className="text-xs text-slate-400">📅 {task.scheduledDate}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${MAINT_STATUS_COLOR[task.status]}`}>{task.status.replace('-', ' ').toUpperCase()}</span>
                        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">{task.description}</div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-700 p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {[
                          { label: 'Frequency', val: task.frequency },
                          { label: 'Assigned To', val: task.assignedTo },
                          { label: 'Est. Duration', val: `${task.estimatedDuration} min` },
                          { label: 'Completed Date', val: task.completedDate || '—' },
                          { label: 'Actual Duration', val: task.actualDuration > 0 ? `${task.actualDuration} min` : '—' },
                          { label: 'Equipment ID', val: task.equipmentId },
                        ].map(d => (
                          <div key={d.label} className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-xs text-slate-500">{d.label}</div>
                            <div className="text-white">{d.val}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-2">Maintenance Checklist</div>
                        <div className="space-y-1">
                          {task.checklist.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className={`mt-0.5 ${task.status === 'completed' ? 'text-emerald-400' : 'text-slate-600'}`}>
                                {task.status === 'completed' ? '✅' : '☐'}
                              </span>
                              <span className="text-slate-300">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {task.remarks && (
                        <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-3 text-sm text-blue-300">
                          💬 {task.remarks}
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
  const tpmPillars = [
    { no: '1', name: 'Autonomous Maintenance', icon: '👷', desc: 'Operators take ownership of basic machine upkeep — cleaning, lubrication, inspection. Reduces operator–maintenance dependency.' },
    { no: '2', name: 'Planned Maintenance', icon: '📅', desc: 'Schedule-driven preventive, predictive, and corrective maintenance. Moves from reactive to proactive maintenance culture.' },
    { no: '3', name: 'Quality Maintenance', icon: '🎯', desc: 'Zero defects through equipment condition control. Ensures machines produce conforming parts consistently.' },
    { no: '4', name: 'Focused Improvement (Kaizen)', icon: '🔍', desc: 'Cross-functional teams eliminate chronic losses using PDCA, SMED, 5S, and root cause analysis.' },
    { no: '5', name: 'Early Equipment Management', icon: '🏗️', desc: 'Design new equipment for zero losses from commissioning. Apply lessons from current equipment into new designs.' },
    { no: '6', name: 'Training & Education', icon: '🎓', desc: 'Build multi-skilled operators and maintenance technicians. Competency matrices, OJT, and certification.' },
    { no: '7', name: 'Safety, Health & Environment', icon: '⛑️', desc: 'Zero accidents, zero health hazards, zero environmental incidents. Built into every TPM activity.' },
    { no: '8', name: 'TPM in Administration', icon: '🏢', desc: 'Eliminate waste in support functions — purchasing, scheduling, logistics — using TPM principles.' },
  ];

  const sixBigLosses = [
    { category: 'Availability Losses', losses: [{ name: 'Breakdowns', desc: 'Unplanned equipment failures stopping production' }, { name: 'Setup & Adjustments', desc: 'Changeover time + trial runs to first good part' }] },
    { category: 'Performance Losses', losses: [{ name: 'Minor Stops & Idling', desc: 'Short stops < 5 min (jams, sensor faults, material feed)' }, { name: 'Reduced Speed', desc: 'Running slower than designed cycle time' }] },
    { category: 'Quality Losses', losses: [{ name: 'Defects & Rework', desc: 'Parts not conforming to spec — scrap or rework' }, { name: 'Startup Losses', desc: 'Rejects during startup / warmup until stable process' }] },
  ];

  const iatfClauses = [
    { clause: '8.5.1', title: 'Control of production & service provision', key: 'Documented work instructions at each operation, monitoring of process parameters, use of equipment that is fit for purpose.' },
    { clause: '8.5.1.1', title: 'Control plan', key: 'Control plans aligned to PFD and PFMEA. Updated for 4M changes, customer complaints, and audit findings.' },
    { clause: '8.5.1.2', title: 'Standardised work', key: 'Operator instructions, ODS, and cycle time standards at each workstation. Reviewed when process changes.' },
    { clause: '8.5.6', title: 'Control of changes', key: '4M change management — change request, risk assessment, trial, approval before implementation.' },
    { clause: '8.5.1.3', title: 'Verification of job setups', key: 'First Article Inspection (FAI) required at every setup / changeover. Setup sign-off records maintained.' },
    { clause: '8.7', title: 'Control of nonconforming outputs', key: 'Identification, segregation, and disposition of nonconforming product. Rework PFMEA mandatory.' },
  ];

  const auditFindings = [
    'OEE not calculated or not monitored at line level',
    'No evidence of downtime root cause analysis',
    'Control plan not updated after 4M changes',
    'Setup / changeover records missing FAI sign-off',
    'Rework PFMEA not available for rework operations',
    'PM schedule overdue — no escalation process',
    'Operators not trained on updated SOPs after process change',
    'Red bin location not defined or not segregated from conforming parts',
  ];

  return (
    <div className="space-y-6">
      {/* IATF Clauses */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">📋 IATF 16949 — Key Manufacturing Clauses</h3>
        <div className="space-y-3">
          {iatfClauses.map(c => (
            <div key={c.clause} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">Cl. {c.clause}</span>
                <span className="font-medium text-white text-sm">{c.title}</span>
              </div>
              <p className="text-sm text-slate-400">{c.key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* OEE Six Big Losses */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">📉 OEE — Six Big Losses</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sixBigLosses.map(cat => (
            <div key={cat.category} className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs font-bold text-blue-400 mb-3 uppercase tracking-wide">{cat.category}</div>
              {cat.losses.map(loss => (
                <div key={loss.name} className="mb-3 last:mb-0">
                  <div className="font-medium text-white text-sm">{loss.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{loss.desc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
          <span className="font-medium text-white">OEE Targets:</span> Availability ≥ 90% · Performance ≥ 95% · Quality ≥ 99% → OEE ≥ 85% (World Class)
        </div>
      </div>

      {/* 8 TPM Pillars */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">🏛️ 8 Pillars of TPM (Total Productive Maintenance)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tpmPillars.map(p => (
            <div key={p.no} className="bg-slate-900/50 rounded-lg p-4 flex gap-3">
              <div className="text-2xl">{p.icon}</div>
              <div>
                <div className="font-medium text-white text-sm">Pillar {p.no}: {p.name}</div>
                <div className="text-xs text-slate-400 mt-1">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4M Change Control */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">🔄 4M Change Control (IATF Cl. 8.5.6)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { m: 'Man', icon: '👤', triggers: ['New operator', 'Operator transfer', 'Skill change', 'Shift change'], actions: ['Re-training & verification', 'Updated competency matrix', 'Setup sign-off required'] },
            { m: 'Machine', icon: '⚙️', triggers: ['New equipment', 'Machine repair / overhaul', 'Die / tool change', 'Fixture change'], actions: ['FAI mandatory', 'Control plan update', 'Process capability study'] },
            { m: 'Material', icon: '📦', triggers: ['New supplier', 'Material grade change', 'Incoming spec change', 'Sub-supplier change'], actions: ['Customer notification (if CSR)', 'Incoming inspection plan update', 'Trial production run'] },
            { m: 'Method', icon: '📋', triggers: ['Process sequence change', 'Cycle time change', 'Parameter change', 'Work instruction change'], actions: ['PFMEA review', 'Control plan update', 'Operator re-briefing'] },
          ].map(m => (
            <div key={m.m} className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="font-bold text-white mb-2">{m.m}</div>
              <div className="text-xs text-slate-500 mb-1">Change Triggers:</div>
              {m.triggers.map(t => <div key={t} className="text-xs text-slate-400">• {t}</div>)}
              <div className="text-xs text-slate-500 mt-2 mb-1">Mandatory Actions:</div>
              {m.actions.map(a => <div key={a} className="text-xs text-emerald-400">✓ {a}</div>)}
            </div>
          ))}
        </div>
      </div>

      {/* Common Audit Findings */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">⚠️ Common IATF Audit Findings — Manufacturing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {auditFindings.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm bg-red-900/10 border border-red-800/30 rounded-lg p-3">
              <span className="text-red-400 mt-0.5">⚠</span>
              <span className="text-slate-300">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Manufacturing Guide
// ══════════════════════════════════════════════════════════════════════════════
function ManufacturingGuideTab() {
  const steps = [
    { no: '01', title: 'Shift Startup (Pre-Production Check)', icon: '🚀', points: ['Verify control plan and SOP at workstation', 'Conduct First Article Inspection (FAI) before production starts', 'Check machine parameters: pressure, temperature, speed per control plan', 'Verify poka-yoke / mistake-proofing devices by challenge method', 'Brief operators on any 4M changes from previous shift', 'Confirm material traceability — correct heat/lot at workstation'] },
    { no: '02', title: 'Production Monitoring — In-Process', icon: '📊', points: ['Monitor production count vs hourly plan (hour-by-hour chart)', 'Conduct in-process patrol inspection per control plan frequency', 'Record defects in red bin with proper tags — severity classification', 'Log any downtime immediately with category and root cause', 'Update shift production log in real time', 'Verify poka-yoke challenge at changeovers and restart after breaks'] },
    { no: '03', title: 'OEE Tracking', icon: '📈', points: ['Record planned start time and actual start time each shift', 'Log every downtime event (duration, category, equipment)', 'Count total produced vs plan qty for Performance calculation', 'Count good qty vs total for Quality calculation', 'Calculate Availability × Performance × Quality = OEE at shift end', 'Display OEE on production board and review with supervisor'] },
    { no: '04', title: 'Downtime Management', icon: '⏹', points: ['Stop the line if safety or quality concern — never continue on defective parts', 'Report downtime within 5 minutes to supervisor and maintenance', 'Record: start time, equipment, category, initial symptom', 'Maintenance to attend within 15 min (breakdown) / as scheduled (PM)', 'Root cause to be identified and recorded before resuming', 'Recurring downtime (≥2 same root cause) → trigger formal 5-Why / 8D'] },
    { no: '05', title: '4M Change Control', icon: '🔄', points: ['Raise 4M Change Request before any Man / Machine / Material / Method change', 'Get quality and engineering approval before implementing change', 'Conduct trial run on limited lot — document results', 'First Article Inspection mandatory after change implementation', 'Update PFMEA, Control Plan, SOP within 5 working days of approved change', 'Notify customer if change falls under Customer Specific Requirements (CSR)'] },
    { no: '06', title: 'Shift Handover', icon: '🤝', points: ['Complete shift production log with all quantities and downtime', 'Brief incoming shift supervisor on any issues, pending actions, 4M changes', 'Segregate non-conforming parts — red bin locked with tags', 'Clean and restore workstation to 5S standard', 'Sign off shift report with supervisor', 'Record any pending maintenance or open issues in logbook'] },
    { no: '07', title: 'End-of-Day Review & Kaizen', icon: '🔁', points: ['Review OEE results vs target for all lines', 'Identify top 3 downtime causes and assign ownership for root cause', 'Review quality performance — FTT, PPM, repeat defects', 'Update production performance board (daily trend visible)', 'Daily 10-minute Kaizen stand-up with line team', 'Raise improvement ideas in Kaizen log — track to closure'] },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">7-step manufacturing excellence process — from shift startup through daily review. Following this methodology ensures IATF Cl. 8.5 compliance, zero-defect discipline, and continuous OEE improvement.</p>
      </div>
      {steps.map(step => (
        <div key={step.no} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-blue-900/50 border border-blue-700 flex items-center justify-center text-sm font-bold text-blue-400">{step.no}</div>
            <div className="text-xl">{step.icon}</div>
            <h3 className="font-semibold text-white">{step.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {step.points.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-blue-400 mt-0.5 shrink-0">→</span>
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
export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [shifts, setShifts] = useState<ShiftLog[]>([]);
  const [downtimes, setDowntimes] = useState<DowntimeEntry[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>(SAMPLE_MAINTENANCE);
  const [loaded, setLoaded] = useState(false);

  const headerStats = useMemo(() => {
    const totalPlan = shifts.reduce((a, s) => a + s.planQty, 0);
    const totalActual = shifts.reduce((a, s) => a + s.actualQty, 0);
    const totalGood = shifts.reduce((a, s) => a + s.goodQty, 0);
    const totalDT = downtimes.reduce((a, d) => a + d.duration, 0);
    const totalPlanned = shifts.reduce((a, s) => a + s.plannedTime, 0);
    const totalRun = shifts.reduce((a, s) => a + s.actualRunTime, 0);
    const avail = totalPlanned > 0 ? totalRun / totalPlanned : 0;
    const perf = totalRun > 0 && totalPlan > 0 ? (totalActual / totalPlan) * (totalPlanned / totalRun) : 0;
    const qual = totalActual > 0 ? totalGood / totalActual : 0;
    const oee = avail * perf * qual;
    const overdueCount = maintenance.filter(m => m.status === 'overdue').length;
    return { oee, totalActual, totalPlan, totalDT, overdueCount };
  }, [shifts, downtimes, maintenance]);

  const tabs = ['📊 Shift Dashboard', '⏹ Downtime & TPM', '📚 Knowledge Hub', '📖 Mfg Guide'];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🏭</span>
                <h1 className="text-2xl font-bold text-white">Manufacturing Excellence</h1>
              </div>
              <p className="text-slate-400 text-sm">OEE Tracking · Shift Production · Downtime Analysis · TPM · 4M Change Control</p>
            </div>
            <button
              onClick={() => { if (!loaded) { setShifts(SAMPLE_SHIFTS); setDowntimes(SAMPLE_DOWNTIME); setLoaded(true); } else { setShifts([]); setDowntimes([]); setLoaded(false); } }}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>

          {/* Header KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Overall OEE', value: shifts.length > 0 ? pct(headerStats.oee) : '—', color: shifts.length > 0 ? oeeColor(headerStats.oee) : 'text-slate-400', sub: 'Target ≥ 85%' },
              { label: 'Production Output', value: shifts.length > 0 ? `${headerStats.totalActual.toLocaleString()} / ${headerStats.totalPlan.toLocaleString()}` : '—', color: 'text-white', sub: 'Actual / Plan' },
              { label: 'Total Downtime', value: shifts.length > 0 ? `${headerStats.totalDT} min` : '—', color: headerStats.totalDT > 120 ? 'text-red-400' : 'text-yellow-400', sub: `${(headerStats.totalDT / 60).toFixed(1)} hrs` },
              { label: 'PM Overdue', value: `${headerStats.overdueCount}`, color: headerStats.overdueCount > 0 ? 'text-red-400' : 'text-emerald-400', sub: 'Maintenance tasks' },
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
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <ShiftDashboardTab shifts={shifts} />}
        {activeTab === 1 && <DowntimeTPMTab downtimes={downtimes} maintenance={maintenance} />}
        {activeTab === 2 && <KnowledgeHubTab />}
        {activeTab === 3 && <ManufacturingGuideTab />}
      </div>
    </div>
  );
}
