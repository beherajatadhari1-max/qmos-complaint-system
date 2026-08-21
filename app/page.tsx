'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import PageTitle from './components/PageTitle';
import Link from 'next/link';

// --- TYPES --------------------------------------------------------------------
interface Complaint {
  id: number; complaint_number: string; customer_name: string; part_name: string;
  part_number: string; defect_description: string; defect_category: string;
  severity: string; status: string; quantity_affected: number; total_supplied: number;
  assigned_to: string; created_at: string; report_generated: number;
  approval_status: string;
}
interface DashboardData {
  total: number; open: number; closed: number; critical: number; inProgress: number; ppm: number;
  trend: { month: string; opened: number; closed: number }[];
  pareto: { defect_category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recentOpen: Complaint[];
}
interface NewComplaint {
  customerName: string; customerContact: string; customerRef: string; complaintSource: string;
  complaintDate: string; partNumber: string; partName: string; defectDescription: string;
  defectCategory: string; quantityAffected: string; totalSupplied: string; batchNumber: string;
  severity: string; assignedTo: string; remarks: string;
}

// --- CONSTANTS ----------------------------------------------------------------
const SLA_DAYS: Record<string, number> = {
  Critical: 7, High: 14, Medium: 30, Low: 45,
};
function slaStatus(c: { severity: string; status: string; created_at: string }) {
  if (['Closed', 'Cancelled'].includes(c.status)) return null;
  const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
  const limit = SLA_DAYS[c.severity] ?? 30;
  if (days > limit) return { label: `${days - limit}d overdue`, level: 'breach' };
  if (days >= limit * 0.75) return { label: `${limit - days}d left`, level: 'warn' };
  return { label: `${limit - days}d left`, level: 'ok' };
}

const SEV_CLASS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-600',
  Medium: 'bg-yellow-100 text-yellow-200', Low: 'bg-green-100 text-green-300',
};
const STATUS_CLASS: Record<string, string> = {
  'Open': 'bg-red-100 text-red-700', 'Under Investigation': 'bg-blue-100 text-[#1d4ed8]',
  'CAPA In Progress': 'bg-orange-100 text-orange-600', 'Pending Verification': 'bg-purple-100 text-purple-300',
  'Pending Closure': 'bg-yellow-100 text-yellow-300', 'Closed': 'bg-green-100 text-green-300',
  'Cancelled': 'bg-white text-[#1e3a5f]',
};
const today = () => new Date().toISOString().slice(0, 10);

// --- AI AUTO-TRIAGE ENGINE ----------------------------------------------------
interface TriageResult {
  severity: string; severityReason: string;
  category: string; categoryReason: string;
  suggestedOwner: string; confidence: number;
  whys: string[];
}
function runTriage(desc: string): TriageResult | null {
  if (!desc || desc.trim().length < 10) return null;
  const d = desc.toLowerCase();

  // -- Severity rules --------------------------------------------------------
  const criticalKeys = ['line stop','stoppage','stop line','safety','airbag','brake fail','recall','field failure',
    'accident','injury','fire','explosion','100% reject','type a','safety characteristic','s/c','government','regulation',
    'customer line stop','vehicle off road','customer escalation','critical characteristic'];
  const highKeys = ['functional','function fail','noise','vibration','leak','fit fail','assembly fail','customer hold',
    'dimensional reject','out of spec','out of tolerance','major defect','audit nc','finding','supplier reject',
    'warranty claim','prr','8d request','customer return','high ppm','abnormal','critical dimension'];
  const lowKeys = ['cosmetic minor','label error','minor scratch','shade variation','texture','documentation error',
    'packaging minor','colour variation','color variation'];

  let severity = 'Medium'; let severityReason = 'No critical or high-risk keywords detected — defaulting to Medium';
  if (criticalKeys.some(k => d.includes(k))) {
    severity = 'Critical';
    severityReason = `Detected safety/line-stop keyword: "${criticalKeys.find(k => d.includes(k))}"`;
  } else if (highKeys.some(k => d.includes(k))) {
    severity = 'High';
    severityReason = `Detected functional/customer-impact keyword: "${highKeys.find(k => d.includes(k))}"`;
  } else if (lowKeys.some(k => d.includes(k))) {
    severity = 'Low';
    severityReason = `Detected minor/cosmetic keyword: "${lowKeys.find(k => d.includes(k))}"`;
  }

  // -- Category rules --------------------------------------------------------
  const cats: [string, string[], string][] = [
    ['Dimensional', ['dimension','diameter','length','width','height','flatness','runout','tolerance','bore','shaft','od ','id ','profile','straightness','angularity','concentricity'], 'Dimensional keyword detected'],
    ['Surface Finish', ['scratch','dent','rust','corrosion','paint','coating','plating','surface finish','texture','colour','color','appearance','visual','mark','stain','burr','flash'], 'Surface/appearance keyword detected'],
    ['Functional', ['noise','vibration','leak','fit','assembly','function','performance','strength','hardness','torque','pressure','load','force','play','rattle'], 'Functional keyword detected'],
    ['Weld Defect', ['weld','welding','crack','porosity','spatter','burn','undercut','slag','incomplete fusion'], 'Weld keyword detected'],
    ['Material', ['material','composition','hardness','tensile','yield','chemical','alloy','grade','microstructure','heat treat'], 'Material keyword detected'],
    ['Documentation', ['label','marking','certificate','drawing','specification','document','revision','wrong part number','barcode','part number'], 'Documentation keyword detected'],
    ['Assembly', ['assembly','fitment','missing part','wrong part','orientation','installation','mixed part','wrong assembly'], 'Assembly keyword detected'],
  ];
  let category = 'General'; let categoryReason = 'No specific category keyword detected';
  for (const [cat, keys, reason] of cats) {
    if (keys.some(k => d.includes(k))) { category = cat; categoryReason = reason; break; }
  }

  // -- Suggested owner by category -------------------------------------------
  const ownerMap: Record<string, string> = {
    'Dimensional': 'Quality Engineer', 'Surface Finish': 'Process Engineer',
    'Functional': 'Design Engineer', 'Weld Defect': 'Welding Engineer',
    'Material': 'Metallurgist / Lab', 'Documentation': 'Quality Coordinator',
    'Assembly': 'Production Engineer', 'General': 'Quality Engineer',
  };

  // -- 5-Why starters by category --------------------------------------------
  const whyMap: Record<string, string[]> = {
    'Dimensional': [
      'Why did the dimension go out of spec? → Tool wear / fixture shift not detected in time.',
      'Why was tool wear not detected? → SPC chart not updated / operator did not check before production.',
      'Why was SPC not maintained? → No alarm set on control chart / training gap on SPC.',
      'Why was there a training gap? → Competency matrix not updated after process change.',
      'Why was competency matrix not updated? → Change management process not followed per IATF §7.2.',
    ],
    'Surface Finish': [
      'Why did the surface defect occur? → Contamination / improper handling during processing.',
      'Why was contamination not prevented? → No proper covers / PPE at the workstation.',
      'Why were controls not in place? → Control plan did not specify handling requirements.',
      'Why was control plan incomplete? → PFMEA did not identify handling as a risk.',
      'Why was the PFMEA gap not caught? → Gate review of PFMEA was not conducted.',
    ],
    'Functional': [
      'Why did the functional failure occur? → Parameter deviated beyond validated range.',
      'Why was deviation not detected? → Outgoing inspection did not include functional test.',
      'Why was functional test missing? → Control plan did not specify 100% functional check.',
      'Why was control plan missing this check? → Design verification (DVP) results not cascaded to CP.',
      'Why was DVP not linked to CP? → APQP cross-function review was not completed.',
    ],
    'Weld Defect': [
      'Why did the weld defect occur? → Welding parameters deviated from WPS (Welding Procedure Spec).',
      'Why did parameters deviate? → Auto-monitoring system alarm was bypassed by operator.',
      'Why was bypass allowed? → Process audit had not covered this workstation recently.',
      'Why was audit frequency low? → Process audit plan was not updated after last NC.',
      'Why was audit plan not updated? → CAPA for previous NC did not include systemic prevention.',
    ],
    'Assembly': [
      'Why did wrong assembly occur? → Operator used wrong part from unlabelled bin.',
      'Why were bins unlabelled? → 5S audit action item for labelling was not completed.',
      'Why was action not completed? → No follow-up mechanism after 5S audit.',
      'Why was there no follow-up? → Action owner not assigned with target date.',
      'Why was assignment missing? → Audit NC closure process is not enforced.',
    ],
    'General': [
      'Why did the defect occur? → Process parameter / material / method deviation.',
      'Why was deviation not controlled? → Control was not specified in the control plan.',
      'Why was it not in the control plan? → PFMEA risk was rated low — not escalated.',
      'Why was PFMEA rating low? → Occurrence / Detection ratings not validated with data.',
      'Why were ratings not validated? → MSA and capability study were not completed for this characteristic.',
    ],
  };

  const whys = whyMap[category] ?? whyMap['General'];
  const confidence = severity === 'Medium' && category === 'General' ? 55
    : severity !== 'Medium' && category !== 'General' ? 92
    : 74;

  return { severity, severityReason, category, categoryReason, suggestedOwner: ownerMap[category] ?? 'Quality Engineer', confidence, whys };
}

const EMPTY_FORM: NewComplaint = {
  customerName: '', customerContact: '', customerRef: '', complaintSource: 'Email',
  complaintDate: today(), partNumber: '', partName: '', defectDescription: '',
  defectCategory: 'General', quantityAffected: '', totalSupplied: '', batchNumber: '',
  severity: 'Medium', assignedTo: '', remarks: '',
};

// --- KPI CARD -----------------------------------------------------------------
function KpiCard({ label, value, target, unit = '', trend, color, icon, noData }:
  { label: string; value: string | number; target?: string; unit?: string; trend?: 'up' | 'down' | 'stable'; color: string; icon: string; noData?: boolean }) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-[#1e3a5f]';
  return (
      <>
      <PageTitle title="Command Center" />
      <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-[#1e3a5f] leading-tight">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      {noData ? (
        <p className="text-2xl font-bold text-[#1e3a5f]">—</p>
      ) : (
        <p className="text-2xl font-bold text-[#1e3a5f]">{value}{unit}</p>
      )}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-y-2">
        {target && <p className="text-xs text-[#1e3a5f]">Target: {target}</p>}
        {trend && !noData && <span className={`text-sm font-bold ${trendColor}`}>{trendIcon}</span>}
      </div>
    </div>
      </>
  );
}

// --- STATUS ALERT CARD --------------------------------------------------------
function AlertCard({ label, value, color, icon, href }:
  { label: string; value: string | number; color: string; icon: string; href?: string }) {
  const content = (
    <div className={`${color} rounded-xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer hover:opacity-90 transition min-w-0 h-full`}>
      <span className="text-xl leading-none mb-1">{icon}</span>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] font-medium opacity-80 leading-tight mt-1 px-1">{label}</p>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}

// --- TREND CHART --------------------------------------------------------------
const MONTH_LABELS: Record<string, string> = {
  '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
  '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'
};
function TrendChart({ data }: { data: { month: string; opened: number; closed: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.opened, d.closed]), 1);
  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-2">
        <span className="flex items-center gap-1 text-xs text-[#1e3a5f]">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />Opened
        </span>
        <span className="flex items-center gap-1 text-xs text-[#1e3a5f]">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-400" />Closed
        </span>
      </div>
      {/* Bars */}
      <div className="flex items-end gap-1.5" style={{ height: '96px' }}>
        {data.map(d => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '80px' }}>
              <div className="flex-1 bg-blue-500 rounded-t transition-all min-h-[2px]" style={{ height: `${Math.max((d.opened / max) * 80, d.opened > 0 ? 4 : 0)}px` }} title={`Opened: ${d.opened}`} />
              <div className="flex-1 bg-green-400 rounded-t transition-all min-h-[2px]" style={{ height: `${Math.max((d.closed / max) * 80, d.closed > 0 ? 4 : 0)}px` }} title={`Closed: ${d.closed}`} />
            </div>
            <span className="text-xs text-[#1e3a5f] whitespace-nowrap">{MONTH_LABELS[d.month?.slice(5)] ?? d.month?.slice(5)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#1e3a5f] text-center mt-1">Month</p>
    </div>
  );
}

// --- PARETO CHART -------------------------------------------------------------
function ParetoChart({ data }: { data: { defect_category: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const colors = ['#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  return (
    <div className="space-y-2">
      {data.slice(0, 6).map((d, i) => (
        <div key={d.defect_category} className="flex items-center gap-2">
          <span className="text-xs text-[#1e3a5f] w-24 truncate">{d.defect_category}</span>
          <div className="flex-1 h-4 bg-white rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d.count / total) * 100}%`, backgroundColor: colors[i] || '#3b82f6' }} />
          </div>
          <span className="text-xs font-bold text-[#1e3a5f] w-5 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// --- MAIN PAGE ----------------------------------------------------------------
export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [calibrationDue, setCalibrationDue] = useState<number | null>(null);
  const [calibrationDueToday, setCalibrationDueToday] = useState<number | null>(null);
  const [aiTriage, setAiTriage] = useState<TriageResult | null>(null);
  const [triageApplied, setTriageApplied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewComplaint>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statusMenuId, setStatusMenuId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [closureModal, setClosureModal] = useState<{ id: number; complaint_number: string } | null>(null);
  const [closureForm, setClosureForm] = useState({ rootCause: '', correctiveAction: '', closedBy: '' });
  const [quickView, setQuickView] = useState<Complaint | null>(null);
  const [quickViewTimeline, setQuickViewTimeline] = useState<{ action: string; performed_by: string; created_at: string }[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [assignMenuId, setAssignMenuId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusMenu, setBulkStatusMenu] = useState(false);
  const [bulkAssignMenu, setBulkAssignMenu] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const complaintsRef = useRef<HTMLDivElement>(null);
  const [showAging, setShowAging] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notePosting, setNotePosting] = useState(false);

  const drillDown = (filterValue: string) => {
    setFilter(filterValue);
    setTimeout(() => {
      complaintsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const TEAM_MEMBERS = [
    { name: 'Jatadhari Behera', role: 'Quality Head' },
    { name: 'Balesh Murasiddhi', role: 'QA Engineer' },
    { name: 'Unassigned', role: '' },
  ];

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusMenuId) return;
    const handler = () => setStatusMenuId(null);
    document.addEventListener('click', handler, { capture: true, once: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, [statusMenuId]);

  // Close date picker on outside click
  useEffect(() => {
    if (!showDatePicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-datepicker]')) setShowDatePicker(false);
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [showDatePicker]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const [list, dash, calList] = await Promise.all([
      fetch('/api/complaints').then(r => r.json()),
      fetch('/api/reports').then(r => r.json()),
      fetch('/api/calibration').then(r => r.json()).catch(() => []),
    ]);
    setComplaints(Array.isArray(list) ? list : []);
    setDashboard(dash);
    // Compute calibration counts from live data
    if (Array.isArray(calList)) {
      const today = Date.now();
      const due = calList.filter((i: { next_calibration_date?: string }) => {
        if (!i.next_calibration_date) return false;
        const diff = Math.ceil((new Date(i.next_calibration_date).getTime() - today) / 86400000);
        return diff >= 0 && diff <= 30;
      }).length;
      const dueToday = calList.filter((i: { next_calibration_date?: string }) => {
        if (!i.next_calibration_date) return false;
        const diff = Math.ceil((new Date(i.next_calibration_date).getTime() - today) / 86400000);
        return diff === 0;
      }).length;
      const overdue = calList.filter((i: { next_calibration_date?: string }) => {
        if (!i.next_calibration_date) return false;
        return new Date(i.next_calibration_date).getTime() < today;
      }).length;
      setCalibrationDue(due + overdue);
      setCalibrationDueToday(dueToday);
    }
    setLastUpdated(new Date());
    setSecondsAgo(0);
    if (!silent) setRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Seconds-ago counter
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 5000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const submitComplaint = async () => {
    if (!form.customerName || !form.defectDescription) return;
    setSubmitting(true);
    const createdAt = form.complaintDate ? `${form.complaintDate} 00:00:00` : null;
    await fetch('/api/complaints', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, createdAt }),
    });
    setForm(EMPTY_FORM); setShowModal(false); setSubmitting(false); setAiTriage(null); setTriageApplied(false); fetchData();
  };

  const deleteComplaint = async (id: number) => {
    await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
    setDeleteId(null); fetchData();
  };

  const daysOpen = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  // -- Date range helper --------------------------------------------------------
  const getDateRange = (): { from: Date | null; to: Date | null } => {
    const now = new Date();
    const startOf = (d: Date) => { d.setHours(0,0,0,0); return d; };
    if (datePreset === 'today') {
      return { from: startOf(new Date()), to: new Date() };
    } else if (datePreset === 'week') {
      const from = new Date(); from.setDate(from.getDate() - from.getDay());
      return { from: startOf(from), to: new Date() };
    } else if (datePreset === 'month') {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() };
    } else if (datePreset === 'lastmonth') {
      return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
    } else if (datePreset === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      return { from: new Date(now.getFullYear(), q * 3, 1), to: new Date() };
    } else if (datePreset === 'custom' && customFrom) {
      return { from: new Date(customFrom), to: customTo ? new Date(customTo + 'T23:59:59') : new Date() };
    }
    return { from: null, to: null };
  };

  const { from: dateFrom, to: dateTo } = getDateRange();

  const displayed = complaints.filter(c => {
    const mf = filter === 'all' || (filter === 'open' && !['Closed', 'Cancelled'].includes(c.status)) || c.status === filter || c.severity === filter;
    const ms = !search || [c.customer_name, c.complaint_number, c.part_number, c.defect_description].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const cd = new Date(c.created_at);
    const md = (!dateFrom || cd >= dateFrom) && (!dateTo || cd <= dateTo);
    return mf && ms && md;
  });

  const openCount = complaints.filter(c => !['Closed', 'Cancelled'].includes(c.status)).length;
  const criticalCount = complaints.filter(c => c.severity === 'Critical' && !['Closed', 'Cancelled'].includes(c.status)).length;
  const overdueCount = complaints.filter(c => !['Closed','Cancelled'].includes(c.status) && daysOpen(c.created_at) > 14).length;

  // -- Quality Health Score (0–100) ------------------------------------------
  const qualityHealthScore = (() => {
    if (!dashboard) return null;
    let score = 100;
    score -= Math.min(openCount * 3, 30);          // open complaints: -3 each, max -30
    score -= Math.min(criticalCount * 10, 30);      // critical: -10 each, max -30
    score -= Math.min(overdueCount * 5, 20);        // overdue >14d: -5 each, max -20
    const total = dashboard.total || 0;
    const closed = dashboard.closed || 0;
    const closureRate = total > 0 ? closed / total : 1;
    if (closureRate < 0.5) score -= 15;
    else if (closureRate < 0.7) score -= 8;
    return Math.max(0, Math.round(score));
  })();

  const healthGrade = qualityHealthScore === null ? null
    : qualityHealthScore >= 85 ? { grade: 'A', label: 'Excellent', color: '#16a34a', bg: '#f0fdf4', ring: '#86efac' }
    : qualityHealthScore >= 70 ? { grade: 'B', label: 'Good',      color: '#2563eb', bg: '#eff6ff', ring: '#93c5fd' }
    : qualityHealthScore >= 55 ? { grade: 'C', label: 'At Risk',   color: '#d97706', bg: '#fffbeb', ring: '#fcd34d' }
    :                            { grade: 'D', label: 'Critical',  color: '#dc2626', bg: '#fef2f2', ring: '#fca5a5' };

  const quickUpdateStatus = async (id: number, newStatus: string) => {
    setStatusMenuId(null);
    if (newStatus === 'Closed') {
      const c = complaints.find(x => x.id === id);
      setClosureModal({ id, complaint_number: c?.complaint_number || String(id) });
      setClosureForm({ rootCause: '', correctiveAction: '', closedBy: '' });
      return;
    }
    setUpdatingId(id);
    await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchData();
    setUpdatingId(null);
  };

  const submitClosure = async () => {
    if (!closureModal || !closureForm.rootCause || !closureForm.correctiveAction) return;
    setUpdatingId(closureModal.id);
    setClosureModal(null);
    // Update status to Closed
    await fetch(`/api/complaints/${closureModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Closed' }),
    });
    // Log closure details to timeline
    await fetch(`/api/complaints/${closureModal.id}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: `✅ COMPLAINT CLOSED — Root Cause: ${closureForm.rootCause} | Corrective Action: ${closureForm.correctiveAction} | Closed By: ${closureForm.closedBy || 'Quality Head'}`,
        performed_by: closureForm.closedBy || 'Quality Head',
      }),
    });
    await fetchData();
    setUpdatingId(null);
  };

  // Close assign menu on outside click
  useEffect(() => {
    if (!assignMenuId) return;
    const handler = () => setAssignMenuId(null);
    document.addEventListener('click', handler, { capture: true, once: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, [assignMenuId]);

  const quickAssign = async (id: number, name: string) => {
    setAssignMenuId(null);
    setUpdatingId(id);
    await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: name === 'Unassigned' ? '' : name }),
    });
    await fetchData(true);
    setUpdatingId(null);
  };

  // -- Bulk helpers ---------------------------------------------------------
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayed.map(c => c.id)));
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    setBulkStatusMenu(false);
    if (newStatus === 'Closed') {
      alert('Use individual closure for Closed status — audit trail required per IATF 10.2.3');
      return;
    }
    setBulkUpdating(true);
    await Promise.all([...selectedIds].map(id =>
      fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    ));
    setSelectedIds(new Set());
    await fetchData(true);
    setBulkUpdating(false);
  };

  const bulkAssign = async (name: string) => {
    setBulkAssignMenu(false);
    setBulkUpdating(true);
    await Promise.all([...selectedIds].map(id =>
      fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: name === 'Unassigned' ? '' : name }),
      })
    ));
    setSelectedIds(new Set());
    await fetchData(true);
    setBulkUpdating(false);
  };

  const exportSelected = () => {
    const sel = displayed.filter(c => selectedIds.has(c.id));
    const headers = ['Complaint No','Customer','Part No','Part Name','Defect Description','Category','Severity','Status','Qty Affected','Assigned To','Days Open','Created Date'];
    const rows = sel.map(c => [
      c.complaint_number, c.customer_name, c.part_number, c.part_name,
      `"${(c.defect_description || '').replace(/"/g, '""')}"`,
      c.defect_category, c.severity, c.status, c.quantity_affected, c.assigned_to,
      daysOpen(c.created_at),
      new Date(c.created_at).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QMOS_Selected_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSelectedIds(new Set());
  };

  const openQuickView = async (c: Complaint) => {
    setQuickView(c);
    setQuickViewTimeline([]);
    setNoteText('');
    try {
      const res = await fetch(`/api/complaints/${c.id}/timeline`);
      const data = await res.json();
      setQuickViewTimeline(Array.isArray(data) ? data : data.timeline ?? []);
    } catch { /* timeline optional */ }
  };

  const postNote = async () => {
    if (!quickView || !noteText.trim() || notePosting) return;
    setNotePosting(true);
    const note = noteText.trim();
    setNoteText('');
    // Optimistic update — add to timeline immediately
    setQuickViewTimeline(prev => [{
      action: `📝 Note: ${note}`,
      performed_by: 'Quality Head',
      created_at: new Date().toISOString(),
    }, ...prev]);
    await fetch(`/api/complaints/${quickView.id}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: `📝 Note: ${note}`, performed_by: 'Quality Head' }),
    });
    setNotePosting(false);
  };

  const exportToExcel = () => {
    const headers = ['Complaint No','Customer','Part No','Part Name','Defect Description','Category','Severity','Status','Qty Affected','Total Supplied','Assigned To','Days Open','Created Date'];
    const rows = displayed.map(c => [
      c.complaint_number, c.customer_name, c.part_number, c.part_name,
      `"${(c.defect_description || '').replace(/"/g, '""')}"`,
      c.defect_category, c.severity, c.status,
      c.quantity_affected, c.total_supplied, c.assigned_to,
      daysOpen(c.created_at),
      new Date(c.created_at).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QMOS_Complaints_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-[#eff6ff]">

      {/* CRITICAL ALERT BANNER */}
      {criticalCount > 0 && (
        <button
          onClick={() => drillDown('Critical')}
          className="w-full bg-red-600 text-white text-center py-2 text-xs font-bold animate-pulse hover:bg-red-700 transition flex items-center justify-center gap-2"
        >
          ⚠ {criticalCount} CRITICAL complaint{criticalCount > 1 ? 's' : ''} open — Immediate escalation required
          <span className="underline opacity-80">View ↓</span>
        </button>
      )}

      {/* SLA BREACH BANNER */}
      {(() => {
        const breached = complaints.filter(c => slaStatus(c)?.level === 'breach');
        if (breached.length === 0) return null;
        return (
          <button
            onClick={() => drillDown('open')}
            className="w-full bg-orange-600 text-white text-center py-2 text-xs font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2"
          >
            🕐 {breached.length} complaint{breached.length > 1 ? 's' : ''} breached SLA — escalation required
            <span className="underline opacity-80">View ↓</span>
          </button>
        );
      })()}

      <div className="p-3 sm:p-5 space-y-4">

        {/* PAGE TITLE */}
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div>
            <h1 className="text-xl font-bold text-white">Quality Command Center</h1>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <p className="text-sm text-[#1e3a5f]">Real-time quality health across all departments</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-xs text-[#1e3a5f]">
                  {refreshing ? 'Refreshing…' : `Live · ${secondsAgo < 10 ? 'just now' : `${secondsAgo}s ago`}`}
                </span>
                <button
                  onClick={() => fetchData()}
                  disabled={refreshing}
                  className="text-xs text-blue-500 hover:text-[#1d4ed8] disabled:opacity-40 transition ml-1"
                  title="Refresh now"
                >
                  ↻
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="hidden md:flex bg-[#eff6ff] hover:bg-blue-100 text-[#1d4ed8] px-4 py-2 rounded-lg text-sm font-semibold transition shadow items-center gap-2">
            <span>+</span> New Complaint
          </button>
        </div>

        {/* -- QUALITY HEALTH SCORE ----------------------------------------- */}
        {qualityHealthScore !== null && healthGrade && (
          <div className="rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
            style={{ background: healthGrade.bg, borderColor: healthGrade.ring }}>
            {/* Score dial */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-8"
                style={{ borderColor: healthGrade.ring, background: '#fff' }}>
                <div className="text-center">
                  <div className="text-3xl font-black leading-none" style={{ color: healthGrade.color }}>{qualityHealthScore}</div>
                  <div className="text-xs font-bold" style={{ color: healthGrade.color }}>/ 100</div>
                </div>
              </div>
              <div className="mt-2 px-3 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: healthGrade.color }}>
                Grade {healthGrade.grade} — {healthGrade.label}
              </div>
            </div>
            {/* Score breakdown */}
            <div className="flex-1 w-full">
              <h3 className="font-bold text-[#1e3a5f] text-sm mb-2">Quality Health Score</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Open', value: openCount, warn: openCount > 5, icon: '📋', drill: 'open' },
                  { label: 'Critical', value: criticalCount, warn: criticalCount > 0, icon: '🚨', drill: 'Critical' },
                  { label: 'Overdue >14d', value: overdueCount, warn: overdueCount > 0, icon: '⏰', drill: 'open' },
                  { label: 'Closure Rate', value: dashboard?.total ? `${Math.round((dashboard.closed / dashboard.total) * 100)}%` : '—', warn: false, icon: '✅', drill: 'Closed' },
                ].map(item => (
                  <div key={item.label}
                    onClick={() => drillDown(item.drill)}
                    className="bg-white rounded-xl px-3 py-2 border border-[#dbeafe] cursor-pointer hover:border-blue-600/50 hover:shadow-sm transition"
                    title={`Click to filter: ${item.label}`}>
                    <div className="text-lg">{item.icon}</div>
                    <div className={`text-lg font-black ${item.warn ? 'text-red-600' : 'text-[#1e3a5f]'}`}>{item.value}</div>
                    <div className="text-xs text-[#1e3a5f] mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: healthGrade.color }}>
                {qualityHealthScore >= 85 ? '✓ Quality performance is excellent. Keep up the good work!'
                  : qualityHealthScore >= 70 ? '⚡ Performance is good. Monitor open complaints and close overdue items.'
                  : qualityHealthScore >= 55 ? '⚠ Quality at risk. Address critical complaints and overdue items urgently.'
                  : '🚨 Quality health is critical. Immediate escalation and containment required.'}
              </p>
            </div>
          </div>
        )}

        {/* -- TODAY'S STATUS ROW ------------------------------------------- */}
        <div>
          <h2 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-3">Today&apos;s Quality Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            <div onClick={() => drillDown('open')} className="cursor-pointer">
              <AlertCard label="Customer Complaints" value={openCount} icon="📋"
                color={openCount > 0 ? 'bg-red-600 text-white' : 'bg-green-500 text-white'} />
            </div>
            <AlertCard label="Supplier Complaints" value="—" icon="🏭" color="bg-orange-50 text-orange-700 border border-orange-200" />
            <AlertCard label="Open CAPA" value={dashboard ? dashboard.inProgress : '—'} icon="🔧"
              color="bg-orange-500 text-white" />
            <AlertCard label="Audit NC" value="—" icon="✅" color="bg-amber-50 text-amber-700 border border-amber-200" />
            <AlertCard label="PPAP Pending" value="—" icon="📦" color="bg-blue-50 text-[#1d4ed8] border border-blue-200" />
            <AlertCard label="Calibration Due" value={calibrationDue !== null ? calibrationDue : '—'} icon="🔬"
              href="/calibration"
              color={calibrationDue !== null && calibrationDue > 0 ? 'bg-red-600 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200'} />
            <AlertCard label="Training Due" value="—" icon="🎓" color="bg-indigo-50 text-indigo-700 border border-indigo-200" />
            {(() => {
              const breachedCount = complaints.filter(c => slaStatus(c)?.level === 'breach').length;
              const warnCount = complaints.filter(c => slaStatus(c)?.level === 'warn').length;
              const color = breachedCount > 0 ? 'bg-red-600 text-white' : warnCount > 0 ? 'bg-orange-400 text-white' : 'bg-green-500 text-white';
              const val = breachedCount > 0 ? breachedCount : warnCount > 0 ? warnCount : '✓';
              const label = breachedCount > 0 ? 'SLA Breached' : warnCount > 0 ? 'SLA At Risk' : 'SLA On Track';
              return <AlertCard label={label} value={val} icon="🕐" color={color} />;
            })()}
          </div>
        </div>

        {/* -- QUALITY KPI CARDS -------------------------------------------- */}
        <div>
          <h2 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-3">Quality KPIs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Customer PPM" value={dashboard?.ppm ?? '—'} target="< 100 PPM"
              trend={dashboard?.ppm ? (dashboard.ppm > 100 ? 'up' : 'down') : undefined}
              color="border-red-500" icon="📉" noData={!dashboard} />
            <KpiCard label="Supplier PPM" value="—" target="< 500 PPM" color="border-orange-400" icon="🏭" noData />
            <KpiCard label="First Time Thru" value="—" target="> 98%" unit="%" color="border-green-500" icon="🎯" noData />
            <KpiCard label="COPQ" value="—" target="< 2%" unit="%" color="border-purple-500" icon="💰" noData />
            <KpiCard label="Scrap Rate" value="—" target="< 0.5%" unit="%" color="border-yellow-500" icon="🗑️" noData />
            <KpiCard label="Warranty" value="—" target="< 0.1%" unit="%" color="border-pink-500" icon="🔄" noData />
            <KpiCard label="Customer Score" value="—" target="> 95" color="border-blue-500" icon="⭐" noData />
            <KpiCard label="Supplier Score" value="—" target="> 85" color="border-teal-500" icon="🏆" noData />
            <KpiCard label="Audit Score" value="—" target="> 90%" color="border-indigo-500" icon="✅" noData />
            <KpiCard label="OEE" value="—" target="> 85%" unit="%" color="border-cyan-500" icon="⚙️" noData />
            <div onClick={() => drillDown('all')} className="cursor-pointer" title="View all complaints">
              <KpiCard label="Total Complaints" value={dashboard?.total ?? '—'} target="0"
                trend={dashboard?.total ? (dashboard.total > 5 ? 'up' : 'stable') : undefined}
                color="border-gray-400" icon="📊" noData={!dashboard} />
            </div>
            <div onClick={() => drillDown('Closed')} className="cursor-pointer" title="View closed complaints">
              <KpiCard label="Closed This Month" value={dashboard?.closed ?? '—'}
                color="border-green-600" icon="✔️" noData={!dashboard} />
            </div>
          </div>
        </div>

        {/* -- 3 COLUMN SECTION --------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-4">⚡ Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: '+ Customer Complaint', color: 'bg-blue-600 hover:bg-blue-700 text-white', action: () => setShowModal(true) },
                { label: '+ Supplier Complaint', color: 'bg-orange-500 hover:bg-orange-600 text-white', href: '/supplier-complaints' },
                { label: '+ Create 8D Report', color: 'bg-red-600 hover:bg-red-700 text-white', href: '/' },
                { label: '+ Create CAPA', color: 'bg-purple-600 hover:bg-purple-700 text-white', href: '/capa' },
                { label: '+ Add Audit Finding', color: 'bg-green-600 hover:bg-green-700 text-white', href: '/audit' },
                { label: '+ Upload Document', color: 'bg-gray-700 hover:bg-gray-800 text-white', href: '/documents' },
                { label: '🔗 Customer Portal', color: 'bg-teal-600 hover:bg-teal-700 text-white', href: '/portal' },
              ].map(a => a.action ? (
                <button key={a.label} onClick={a.action}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${a.color}`}>
                  {a.label}
                </button>
              ) : (
                <Link key={a.label} href={a.href!}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-semibold transition ${a.color}`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-4">📋 Today&apos;s Tasks</h3>
            <div className="space-y-2">
              {[
                { label: 'Pending Complaint Approvals', count: complaints.filter(c => c.status === 'Pending Closure' && c.approval_status !== 'approved').length, color: 'bg-red-50 border-red-700/50 text-red-800' },
                { label: 'SLA Breached Complaints', count: complaints.filter(c => slaStatus(c)?.level === 'breach').length || '—', color: 'bg-orange-900/30 border-orange-700/50 text-orange-600' },
                { label: 'Upcoming Audits (7 days)', count: '—', color: 'bg-[#eff6ff] border-blue-700/50 text-blue-200' },
                { label: 'Calibration Due Today', count: calibrationDueToday !== null ? calibrationDueToday : '—', color: 'bg-purple-900/30 border-purple-700/50 text-purple-200', href: '/calibration' },
                { label: 'Customer Visit This Week', count: '—', color: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-200' },
                { label: 'Management Review Prep', count: '—', color: 'bg-[#eff6ff] border-[#dbeafe] text-[#1e3a5f]' },
              ].map(t => {
                const row = (
                  <div key={t.label} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${t.color} ${'href' in t ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
                    <span className="text-xs font-medium">{t.label}</span>
                    <span className="text-xs font-bold">{t.count}</span>
                  </div>
                );
                return 'href' in t ? <Link key={t.label} href={(t as { href: string }).href}>{row}</Link> : row;
              })}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-4">🤖 AI Suggestions</h3>
            <div className="space-y-3">
              {complaints.length > 0 ? (
                <>
                  {criticalCount > 0 && (
                    <div className="flex gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-red-500 text-sm flex-shrink-0">🔴</span>
                      <p className="text-xs text-red-700"><b>{criticalCount} critical complaint{criticalCount > 1 ? 's' : ''}</b> open — escalate immediately to Quality Head</p>
                    </div>
                  )}
                  {dashboard && dashboard.ppm > 100 && (
                    <div className="flex gap-2 p-3 bg-orange-900/30 rounded-lg border border-orange-800/50">
                      <span className="text-orange-500 text-sm flex-shrink-0">⚠️</span>
                      <p className="text-xs text-orange-600">Customer PPM <b>{dashboard.ppm}</b> exceeds target of 100 — review top defect categories</p>
                    </div>
                  )}
                  {dashboard && dashboard.open > 3 && (
                    <div className="flex gap-2 p-3 bg-[#eff6ff] rounded-lg border border-blue-800/50">
                      <span className="text-blue-500 text-sm flex-shrink-0">📊</span>
                      <p className="text-xs text-[#1d4ed8]"><b>{dashboard.open} open complaints</b> — check if CAPA actions are on track</p>
                    </div>
                  )}
                  <div className="flex gap-2 p-3 bg-yellow-900/30 rounded-lg border border-yellow-100">
                    <span className="text-yellow-500 text-sm flex-shrink-0">💡</span>
                    <p className="text-xs text-yellow-300">Connect Supplier Quality module to get supplier PPM analysis and SCAR recommendations</p>
                  </div>
                </>
              ) : (
                <>
                  {['Log your first complaint to activate AI trend analysis', 'Connect calibration data to get due-date alerts', 'Add audit findings to get compliance score', 'Upload supplier data to get supplier risk index'].map((s, i) => (
                    <div key={i} className="flex gap-2 p-3 bg-[#eff6ff] rounded-lg border border-[#dbeafe]">
                      <span className="text-[#1e3a5f] text-sm flex-shrink-0">💡</span>
                      <p className="text-xs text-[#1e3a5f]">{s}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* -- CHARTS ROW --------------------------------------------------- */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-y-2">
                <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Monthly Complaint Trend</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs text-[#1e3a5f]"><span className="w-2 h-2 bg-blue-500 rounded inline-block"></span>Opened</span>
                  <span className="flex items-center gap-1 text-xs text-[#1e3a5f]"><span className="w-2 h-2 bg-green-400 rounded inline-block"></span>Closed</span>
                </div>
              </div>
              {dashboard.trend.length > 0 ? <TrendChart data={dashboard.trend} /> : <p className="text-[#1e3a5f] text-sm text-center py-8">No data yet</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Defect Category Pareto</h3>
              {dashboard.pareto.length > 0 ? <ParetoChart data={dashboard.pareto} /> : <p className="text-[#1e3a5f] text-sm text-center py-8">No data yet</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">By Severity</h3>
              {dashboard.bySeverity.length > 0 ? (
                <div className="space-y-2.5 mt-2">
                  {dashboard.bySeverity.map(s => {
                    const total = dashboard.bySeverity.reduce((a, b) => a + b.count, 0) || 1;
                    const colors: Record<string, string> = { Critical: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-yellow-400', Low: 'bg-green-400' };
                    return (
                      <div key={s.severity}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[#1e3a5f]">{s.severity}</span>
                          <span className="font-bold text-white">{s.count} ({Math.round(s.count / total * 100)}%)</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[s.severity] || 'bg-blue-400'}`} style={{ width: `${(s.count / total) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-[#1e3a5f] text-sm text-center py-8">No data yet</p>}
            </div>
          </div>
        )}

        {/* -- RECENT COMPLAINTS TABLE --------------------------------------- */}
        <div ref={complaintsRef} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#dbeafe] flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-[#1e3a5f] text-sm flex-shrink-0">📋 Customer Complaints</h2>
            <button
              onClick={() => setShowAging(v => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition flex items-center gap-1.5 flex-shrink-0 ${showAging ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-900/30 text-indigo-700 border-indigo-700/50 hover:bg-indigo-800'}`}
              title="Toggle aging analysis view"
            >
              📊 Aging {showAging ? '✕' : ''}
            </button>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search complaint, customer, part..."
              className="border border-[#dbeafe] rounded-lg px-3 py-1.5 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-1 flex-wrap">
              {[['all', 'All'], ['open', 'Open'], ['Under Investigation', 'Investigating'],
                ['CAPA In Progress', 'CAPA'], ['Closed', 'Closed'], ['Critical', '🔴 Critical']].map(([val, lbl]) => (
                <button key={val} onClick={() => setFilter(val)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === val ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-white text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            {/* Date range filter */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowDatePicker(p => !p)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${datePreset !== 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-[#1e3a5f] border-[#dbeafe] hover:bg-[#eff6ff]'}`}
              >
                📅 {datePreset === 'all' ? 'Date' : datePreset === 'today' ? 'Today' : datePreset === 'week' ? 'This Week' : datePreset === 'month' ? 'This Month' : datePreset === 'lastmonth' ? 'Last Month' : datePreset === 'quarter' ? 'This Quarter' : 'Custom'} ▾
              </button>
              {showDatePicker && (
                <div className="absolute left-0 top-9 z-50 bg-white border border-[#dbeafe] rounded-xl shadow-xl p-3 min-w-[200px]">
                  {[
                    ['all', 'All Time'],
                    ['today', 'Today'],
                    ['week', 'This Week'],
                    ['month', 'This Month'],
                    ['lastmonth', 'Last Month'],
                    ['quarter', 'This Quarter'],
                    ['custom', 'Custom Range'],
                  ].map(([val, lbl]) => (
                    <button key={val} onClick={() => { setDatePreset(val); if (val !== 'custom') setShowDatePicker(false); }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition ${datePreset === val ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'hover:bg-[#eff6ff] text-[#1e3a5f]'}`}>
                      {lbl}
                    </button>
                  ))}
                  {datePreset === 'custom' && (
                    <div className="mt-2 space-y-1.5 border-t border-[#dbeafe] pt-2">
                      <div>
                        <label className="text-xs text-[#1e3a5f] mb-0.5 block">From</label>
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                          className="w-full border border-[#dbeafe] rounded-lg px-2 py-1 text-xs text-[#1e3a5f]" />
                      </div>
                      <div>
                        <label className="text-xs text-[#1e3a5f] mb-0.5 block">To</label>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                          className="w-full border border-[#dbeafe] rounded-lg px-2 py-1 text-xs text-[#1e3a5f]" />
                      </div>
                      <button onClick={() => setShowDatePicker(false)}
                        className="w-full bg-blue-600 text-white text-xs py-1.5 rounded-lg font-semibold mt-1">Apply</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active drill-down badge */}
            {filter !== 'all' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-[#1d4ed8] rounded-lg text-xs font-semibold flex-shrink-0">
                <span>🔍 {filter === 'open' ? 'Open' : filter}</span>
                <button onClick={() => setFilter('all')} className="text-[#1d4ed8] hover:text-[#1d4ed8] font-bold leading-none" title="Clear filter">✕</button>
              </div>
            )}

            <button
              onClick={exportToExcel}
              disabled={displayed.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              title="Export visible complaints to Excel"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 18 15 15"/>
              </svg>
              Export ({displayed.length})
            </button>
          </div>
          {/* -- AGING ANALYSIS VIEW ---------------------------------------- */}
          {showAging && (() => {
            const activeCmps = complaints.filter(c => !['Closed', 'Cancelled'].includes(c.status));
            const buckets = [
              { label: 'Fresh', range: '0–7 days', min: 0, max: 7, color: 'bg-green-500', light: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700/50' },
              { label: 'Attention', range: '8–14 days', min: 8, max: 14, color: 'bg-yellow-400', light: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700/50' },
              { label: 'Overdue', range: '15–30 days', min: 15, max: 30, color: 'bg-orange-500', light: 'bg-orange-900/30', text: 'text-orange-600', border: 'border-orange-700/50' },
              { label: 'Critical Overdue', range: '30+ days', min: 31, max: Infinity, color: 'bg-red-600', light: 'bg-red-50', text: 'text-red-700', border: 'border-red-700/50' },
            ].map(b => ({ ...b, items: activeCmps.filter(c => { const d = daysOpen(c.created_at); return d >= b.min && d <= b.max; }) }));
            const maxCount = Math.max(...buckets.map(b => b.items.length), 1);

            const exportAging = () => {
              const rows = activeCmps.map(c => {
                const d = daysOpen(c.created_at);
                const bucket = d <= 7 ? 'Fresh (0-7d)' : d <= 14 ? 'Attention (8-14d)' : d <= 30 ? 'Overdue (15-30d)' : 'Critical Overdue (30+d)';
                return [c.complaint_number, c.customer_name, c.part_number, c.severity, c.status, c.assigned_to || 'Unassigned', d, bucket, new Date(c.created_at).toLocaleDateString('en-IN')].join(',');
              });
              const csv = ['Complaint No,Customer,Part No,Severity,Status,Assigned To,Days Open,Aging Bucket,Date'].concat(rows).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = `QMOS_Aging_Report_${new Date().toISOString().slice(0,10)}.csv`;
              a.click(); URL.revokeObjectURL(url);
            };

            return (
              <div className="p-4 space-y-4">
                {/* Summary strip */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-[#1e3a5f] text-sm">Complaint Aging Analysis</h3>
                    <p className="text-xs text-[#1e3a5f] mt-0.5">{activeCmps.length} open complaints — excludes Closed & Cancelled</p>
                  </div>
                  <button onClick={exportAging}
                    className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition">
                    ↓ Export Aging Report
                  </button>
                </div>

                {/* Bucket summary bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {buckets.map(b => (
                    <div key={b.label} className={`rounded-xl p-3 border ${b.light} ${b.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold ${b.text}`}>{b.label}</span>
                        <span className={`text-xl font-black ${b.text}`}>{b.items.length}</span>
                      </div>
                      <div className="text-[10px] text-[#1e3a5f] mb-2">{b.range}</div>
                      <div className="w-full bg-[#dbeafe] rounded-full h-1.5">
                        <div className={`${b.color} h-1.5 rounded-full transition-all`}
                          style={{ width: `${(b.items.length / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed list per bucket */}
                {buckets.filter(b => b.items.length > 0).map(b => (
                  <div key={b.label} className={`rounded-xl border ${b.border} overflow-hidden`}>
                    <div className={`px-4 py-2 ${b.light} flex items-center justify-between`}>
                      <span className={`text-xs font-bold ${b.text}`}>{b.label} — {b.range} ({b.items.length})</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="bg-[#eff6ff]">
                        <tr>
                          {['Complaint No.', 'Customer', 'Part', 'Severity', 'Status', 'Assigned To', 'Days Open'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.items.map(c => (
                          <tr key={c.id} className="border-t border-[#dbeafe] hover:bg-[#eff6ff] transition">
                            <td className="px-3 py-2">
                              <button onClick={() => { setShowAging(false); openQuickView(c); }}
                                className="font-mono font-bold text-[#1d4ed8] hover:underline">{c.complaint_number || `CC-${c.id}`}</button>
                            </td>
                            <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{c.customer_name}</td>
                            <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{c.part_number}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${SEV_CLASS[c.severity] || ''}`}>{c.severity}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_CLASS[c.status] || ''}`}>{c.status}</span>
                            </td>
                            <td className="px-3 py-2 text-[#1e3a5f]">{c.assigned_to || <span className="text-[#1e3a5f] italic">Unassigned</span>}</td>
                            <td className={`px-3 py-2 font-bold text-right ${b.text}`}>{daysOpen(c.created_at)}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                {activeCmps.length === 0 && (
                  <div className="text-center py-10 text-[#1e3a5f] text-sm">
                    🎉 No open complaints — all clear!
                  </div>
                )}
              </div>
            );
          })()}

          {!showAging && (<>
          {/* -- BULK ACTION BAR (floats when rows selected) ----------------- */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap bg-blue-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <span className="font-semibold">{selectedIds.size} selected</span>
              <button onClick={() => setSelectedIds(new Set())} className="text-[#1d4ed8] hover:text-white ml-1">✕ Clear</button>
              <div className="flex-1" />

              {/* Bulk Status */}
              <div className="relative">
                <button
                  onClick={() => { setBulkStatusMenu(v => !v); setBulkAssignMenu(false); }}
                  disabled={bulkUpdating}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition disabled:opacity-40"
                >
                  {bulkUpdating ? 'Updating…' : 'Change Status ▾'}
                </button>
                {bulkStatusMenu && (
                  <div className="absolute z-50 right-0 mt-1 bg-white border border-[#dbeafe] rounded-xl shadow-xl py-1 min-w-[200px]">
                    {['Open','Under Investigation','CAPA In Progress','Pending Verification','Pending Closure','Cancelled'].map(s => (
                      <button key={s} onClick={() => bulkUpdateStatus(s)}
                        className="w-full text-left px-3 py-2 text-xs text-[#1e3a5f] hover:bg-[#eff6ff] hover:text-[#1d4ed8] transition font-medium">
                        {s}
                      </button>
                    ))}
                    <div className="border-t border-[#dbeafe] mt-1 pt-1 px-3 py-1.5 text-[10px] text-[#1e3a5f]">
                      Closed requires individual IATF closure
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk Assign */}
              <div className="relative">
                <button
                  onClick={() => { setBulkAssignMenu(v => !v); setBulkStatusMenu(false); }}
                  disabled={bulkUpdating}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition disabled:opacity-40"
                >
                  Assign To ▾
                </button>
                {bulkAssignMenu && (
                  <div className="absolute z-50 right-0 mt-1 bg-white border border-[#dbeafe] rounded-xl shadow-xl py-1 min-w-[180px]">
                    {TEAM_MEMBERS.map(m => (
                      <button key={m.name} onClick={() => bulkAssign(m.name)}
                        className="w-full text-left px-3 py-2 text-xs text-[#1e3a5f] hover:bg-[#eff6ff] hover:text-[#1d4ed8] transition flex items-center gap-2 font-medium">
                        <span>{m.name}</span>
                        {m.role && <span className="text-[#1e3a5f] text-[10px]">· {m.role}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export selected */}
              <button
                onClick={exportSelected}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-semibold transition"
              >
                ↓ Export
              </button>
            </div>
          )}

          {/* -- MOBILE CARD LIST (visible only on small screens) ------------ */}
          <div className="md:hidden divide-y divide-gray-100">
            {displayed.length === 0 ? (
              <p className="text-center text-[#1e3a5f] py-12 text-sm">No complaints found. Tap + to log the first one.</p>
            ) : displayed.map(c => (
              <div key={c.id} className={`p-4 space-y-2 ${selectedIds.has(c.id) ? 'bg-[#eff6ff]' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    />
                    <Link href={`/complaints/${c.id}`} className="font-mono text-xs font-bold text-[#1d4ed8] hover:underline">{c.complaint_number || `CC-${c.id}`}</Link>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap relative">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_CLASS[c.severity] || ''}`}>{c.severity}</span>
                    {updatingId === c.id ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#dbeafe] text-[#1e3a5f] animate-pulse">Saving…</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setStatusMenuId(statusMenuId === c.id ? null : c.id)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${STATUS_CLASS[c.status] || ''}`}
                        >
                          {c.status} ▾
                        </button>
                        {statusMenuId === c.id && (
                          <div className="absolute z-50 right-0 top-7 bg-white border border-[#dbeafe] rounded-xl shadow-xl py-1 min-w-[180px]">
                            {['Open','Under Investigation','CAPA In Progress','Pending Verification','Pending Closure','Closed','Cancelled'].map(s => (
                              <button key={s} onClick={() => quickUpdateStatus(c.id, s)}
                                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-[#eff6ff] transition flex items-center gap-2 ${c.status === s ? 'text-blue-600 bg-[#eff6ff]' : 'text-[#1e3a5f]'}`}>
                                {c.status === s && <span className="text-blue-500">✓</span>}
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <p className="font-medium text-[#1e3a5f] text-sm">{c.customer_name}</p>
                <p className="text-xs text-[#1e3a5f] line-clamp-2">{c.defect_description}</p>
                <div className="flex items-center justify-between pt-1 flex-wrap gap-y-2">
                  <span className="text-xs text-[#1e3a5f]">{new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {daysOpen(c.created_at)}d open</span>
                  <div className="flex gap-2 flex-wrap">
                    {/* Mobile assign dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setAssignMenuId(assignMenuId === c.id ? null : c.id)}
                        className="text-xs px-3 py-1.5 bg-[#eff6ff] border border-[#dbeafe] rounded-lg font-medium min-h-[32px] flex items-center text-[#1e3a5f] hover:border-blue-400 hover:text-[#1d4ed8] transition"
                      >
                        {c.assigned_to ? c.assigned_to.split(' ')[0] : 'Assign'} ▾
                      </button>
                      {assignMenuId === c.id && (
                        <div className="absolute z-50 right-0 bottom-9 bg-white border border-[#dbeafe] rounded-xl shadow-xl py-1 min-w-[180px]">
                          {TEAM_MEMBERS.map(m => (
                            <button
                              key={m.name}
                              onClick={() => quickAssign(c.id, m.name)}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-[#eff6ff] transition flex items-center gap-2 ${(c.assigned_to || '') === (m.name === 'Unassigned' ? '' : m.name) ? 'text-blue-600 bg-[#eff6ff] font-semibold' : 'text-[#1e3a5f]'}`}
                            >
                              <span className="font-medium">{m.name}</span>
                              {m.role && <span className="text-[#1e3a5f] text-[10px]">· {m.role}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link href={`/complaints/${c.id}`} className="text-blue-600 text-xs px-3 py-1.5 bg-[#eff6ff] rounded-lg font-medium min-h-[32px] flex items-center">Open</Link>
                    <button onClick={() => setDeleteId(c.id)} className="text-red-600 text-xs px-3 py-1.5 bg-red-50 rounded-lg font-medium min-h-[32px] flex items-center">Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* -- DESKTOP TABLE (hidden on small screens) --------------------- */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#eff6ff] text-xs text-[#1e3a5f] uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={displayed.length > 0 && selectedIds.size === displayed.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-blue-600"
                      title="Select all"
                    />
                  </th>
                  {['Complaint No.', 'Date', 'Customer', 'Part', 'Defect', 'Qty', 'Severity', 'Status', 'Assign', 'Days', '8D', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr><td colSpan={13} className="px-4 py-12 text-center text-[#1e3a5f]">
                    No complaints found. Click &quot;+ New Complaint&quot; to log the first one.
                  </td></tr>
                ) : displayed.map(c => (
                  <tr key={c.id} className={`border-t border-[#dbeafe] hover:bg-[#eff6ff] transition group cursor-pointer ${selectedIds.has(c.id) ? 'bg-[#eff6ff]' : ''}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button,a,select,input')) return; openQuickView(c); }}>
                    <td className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/complaints/${c.id}`} className="font-mono text-xs font-bold text-[#1d4ed8] hover:underline">{c.complaint_number || `CC-${c.id}`}</Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1e3a5f] whitespace-nowrap">{c.customer_name}</td>
                    <td className="px-4 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{c.part_number} {c.part_name}</td>
                    <td className="px-4 py-3 text-[#1e3a5f] max-w-xs">
                      <Link href={`/complaints/${c.id}`} className="hover:text-[#1d4ed8] line-clamp-2 text-xs">{c.defect_description}</Link>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#1e3a5f] text-xs">{c.quantity_affected}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_CLASS[c.severity] || ''}`}>{c.severity}</span>
                    </td>
                    <td className="px-4 py-3 relative">
                      {updatingId === c.id ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#dbeafe] text-[#1e3a5f] animate-pulse">Saving…</span>
                      ) : (
                        <>
                          <button
                            onClick={() => setStatusMenuId(statusMenuId === c.id ? null : c.id)}
                            className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer hover:opacity-80 transition ${STATUS_CLASS[c.status] || ''}`}
                            title="Click to change status"
                          >
                            {c.status} ▾
                          </button>
                          {statusMenuId === c.id && (
                            <div className="absolute z-50 left-0 mt-1 bg-white border border-[#dbeafe] rounded-xl shadow-xl py-1 min-w-[180px]">
                              {['Open','Under Investigation','CAPA In Progress','Pending Verification','Pending Closure','Closed','Cancelled'].map(s => (
                                <button key={s} onClick={() => quickUpdateStatus(c.id, s)}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-[#eff6ff] transition flex items-center gap-2 ${c.status === s ? 'text-blue-600 bg-[#eff6ff]' : 'text-[#1e3a5f]'}`}>
                                  {c.status === s && <span className="text-blue-500">✓</span>}
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    {/* -- Quick Assign -- */}
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setAssignMenuId(assignMenuId === c.id ? null : c.id)}
                        className="text-xs px-2 py-0.5 rounded border border-[#dbeafe] bg-white hover:border-blue-400 hover:text-[#1d4ed8] text-[#1e3a5f] whitespace-nowrap transition max-w-[110px] truncate"
                        title={c.assigned_to || 'Unassigned'}
                      >
                        {c.assigned_to ? c.assigned_to.split(' ')[0] : 'Assign'} ▾
                      </button>
                      {assignMenuId === c.id && (
                        <div className="absolute z-50 left-0 mt-1 bg-white border border-[#dbeafe] rounded-xl shadow-xl py-1 min-w-[180px]">
                          {TEAM_MEMBERS.map(m => (
                            <button
                              key={m.name}
                              onClick={() => quickAssign(c.id, m.name)}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-[#eff6ff] transition flex items-center gap-2 ${(c.assigned_to || '') === (m.name === 'Unassigned' ? '' : m.name) ? 'text-blue-600 bg-[#eff6ff] font-semibold' : 'text-[#1e3a5f]'}`}
                            >
                              <span className="font-medium">{m.name}</span>
                              {m.role && <span className="text-[#1e3a5f] text-[10px]">· {m.role}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`font-bold text-xs ${daysOpen(c.created_at) > 14 && c.status !== 'Closed' ? 'text-red-600' : 'text-[#1e3a5f]'}`}>
                          {daysOpen(c.created_at)}d
                        </span>
                        {(() => {
                          const s = slaStatus(c);
                          if (!s) return null;
                          const cls = s.level === 'breach' ? 'bg-red-100 text-red-700' : s.level === 'warn' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-300';
                          return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cls} whitespace-nowrap`}>{s.label}</span>;
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.report_generated ? <span className="text-green-500 text-sm" title="8D Generated">✓</span> : <span className="text-[#1e3a5f] text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-wrap">
                        <Link href={`/complaints/${c.id}`} className="text-blue-600 hover:text-blue-200 text-xs px-2 py-1 bg-[#eff6ff] rounded font-medium">Open</Link>
                        <button onClick={() => setDeleteId(c.id)} className="text-red-600 hover:text-red-600 text-xs px-2 py-1 bg-red-50 rounded font-medium">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 border-t border-gray-50 text-xs text-[#1e3a5f]">
            Showing {displayed.length} of {complaints.length} complaints
          </div>
          </>)}
        </div>
      </div>

      {/* -- MOBILE FAB ----------------------------------------------------- */}
      <button
        className="fixed bottom-6 right-6 md:hidden bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-2xl text-2xl z-30 flex items-center justify-center transition active:scale-95"
        aria-label="Log new complaint"
        onClick={() => setShowModal(true)}
      >
        +
      </button>

      {/* -- NEW COMPLAINT MODAL ---------------------------------------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="bg-[#eff6ff] text-[#1d4ed8] px-5 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-base">Log New Customer Complaint</h2>
                <p className="text-blue-200 text-xs">All fields marked * are required</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#1d4ed8] hover:text-white text-xl">✕</button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Customer Info */}
              <div>
                <p className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-2 border-b border-blue-800/50 pb-1">Customer Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Customer Name *</label>
                    <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                      placeholder="e.g. Maruti Suzuki India Ltd"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Complaint Date *</label>
                    <input type="date" value={form.complaintDate} onChange={e => setForm(p => ({ ...p, complaintDate: e.target.value }))}
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Customer Contact Person</label>
                    <input value={form.customerContact} onChange={e => setForm(p => ({ ...p, customerContact: e.target.value }))}
                      placeholder="Name / Email / Phone"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Customer Reference No.</label>
                    <input value={form.customerRef} onChange={e => setForm(p => ({ ...p, customerRef: e.target.value }))}
                      placeholder="Customer's complaint / NCR no."
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Complaint Source</label>
                    <select value={form.complaintSource} onChange={e => setForm(p => ({ ...p, complaintSource: e.target.value }))}
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Email', 'Customer Portal', 'Phone Call', 'Field Visit', 'Warranty Return', 'Production Line Stoppage', 'Customer Audit', 'Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Assigned To</label>
                    <input value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
                      placeholder="Engineer name"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              {/* Part Info */}
              <div>
                <p className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-2 border-b border-blue-800/50 pb-1">Part Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Part Number</label>
                    <input value={form.partNumber} onChange={e => setForm(p => ({ ...p, partNumber: e.target.value }))}
                      placeholder="e.g. BRK-0421-LH"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Part Name</label>
                    <input value={form.partName} onChange={e => setForm(p => ({ ...p, partName: e.target.value }))}
                      placeholder="e.g. Brake Bracket LH"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Batch / Lot Number</label>
                    <input value={form.batchNumber} onChange={e => setForm(p => ({ ...p, batchNumber: e.target.value }))}
                      placeholder="e.g. LOT-2024-07-A"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Defect Category</label>
                    <select value={form.defectCategory} onChange={e => setForm(p => ({ ...p, defectCategory: e.target.value }))}
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Dimensional', 'Surface Defect', 'Welding', 'Assembly', 'Material', 'Leak', 'Coating/Plating', 'Mixed Parts', 'General', 'Functional', 'Packaging'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Qty Rejected (pcs)</label>
                    <input type="number" value={form.quantityAffected} onChange={e => setForm(p => ({ ...p, quantityAffected: e.target.value }))}
                      placeholder="0"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Total Supplied (pcs) — for PPM</label>
                    <input type="number" value={form.totalSupplied} onChange={e => setForm(p => ({ ...p, totalSupplied: e.target.value }))}
                      placeholder="0"
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              {/* Defect Details */}
              <div>
                <p className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-2 border-b border-blue-800/50 pb-1">Defect Details</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1e3a5f] mb-1">
                      Defect Description * &nbsp;<span className="text-indigo-500 font-semibold">🤖 AI Triage Active</span>
                    </label>
                    <textarea value={form.defectDescription}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(p => ({ ...p, defectDescription: val }));
                        setTriageApplied(false);
                        setAiTriage(runTriage(val));
                      }}
                      rows={3} placeholder="Describe the defect clearly — AI will auto-suggest severity, category & 5-Why as you type..."
                      className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />

                    {/* AI Triage Suggestion Panel */}
                    {aiTriage && !triageApplied && (
                      <div className="mt-2 border border-indigo-700/50 bg-indigo-900/30 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-indigo-200">🤖 AI Triage Suggestion &nbsp;
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              aiTriage.confidence >= 85 ? 'bg-green-900/50 text-green-300' :
                              aiTriage.confidence >= 70 ? 'bg-yellow-900/50 text-yellow-300' : 'bg-white text-[#1e3a5f]'
                            }`}>{aiTriage.confidence}% confidence</span>
                          </span>
                          <button onClick={() => setAiTriage(null)} className="text-[#1e3a5f] hover:text-[#1e3a5f] text-xs">✕</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                          <div className="bg-white rounded-lg p-2 border border-indigo-700/50">
                            <div className="text-[10px] text-[#1e3a5f] font-medium mb-0.5">Suggested Severity</div>
                            <div className={`text-xs font-bold ${
                              aiTriage.severity === 'Critical' ? 'text-red-600' :
                              aiTriage.severity === 'High' ? 'text-orange-400' :
                              aiTriage.severity === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                            }`}>{aiTriage.severity === 'Critical' ? '🔴' : aiTriage.severity === 'High' ? '🟠' : aiTriage.severity === 'Medium' ? '🟡' : '🟢'} {aiTriage.severity}</div>
                            <div className="text-[10px] text-[#1e3a5f] mt-0.5 leading-tight">{aiTriage.severityReason}</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-indigo-700/50">
                            <div className="text-[10px] text-[#1e3a5f] font-medium mb-0.5">Suggested Category</div>
                            <div className="text-xs font-bold text-indigo-300">📂 {aiTriage.category}</div>
                            <div className="text-[10px] text-[#1e3a5f] mt-0.5 leading-tight">{aiTriage.categoryReason}</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-indigo-700/50">
                            <div className="text-[10px] text-[#1e3a5f] font-medium mb-0.5">Suggested Owner</div>
                            <div className="text-xs font-bold text-purple-300">👤 {aiTriage.suggestedOwner}</div>
                            <div className="text-[10px] text-[#1e3a5f] mt-0.5 leading-tight">Based on defect category</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setForm(p => ({ ...p, severity: aiTriage.severity, defectCategory: aiTriage.category }));
                            setTriageApplied(true);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors">
                          ✓ Apply AI Suggestion — set Severity to {aiTriage.severity} &amp; Category to {aiTriage.category}
                        </button>
                      </div>
                    )}
                    {triageApplied && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#15803d] font-semibold">
                        <span>✅ AI triage applied</span>
                        <button onClick={() => setTriageApplied(false)} className="text-[#1e3a5f] hover:text-[#1e3a5f] font-normal text-[10px]">(undo)</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Severity *</label>
                      <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                        className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Critical">🔴 Critical — Line stoppage / Safety</option>
                        <option value="High">🟠 High — Functional / Major defect</option>
                        <option value="Medium">🟡 Medium — Non-functional / Cosmetic</option>
                        <option value="Low">🟢 Low — Minor / Cosmetic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1e3a5f] mb-1">Remarks</label>
                      <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                        placeholder="Any additional notes"
                        className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Sticky action bar — always visible above keyboard */}
            <div className="flex-shrink-0 flex gap-3 px-4 sm:px-6 py-3 border-t border-[#dbeafe] bg-white rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="flex-1 sm:flex-none text-[#1e3a5f] px-5 py-2.5 border border-[#dbeafe] rounded-lg text-sm hover:bg-[#eff6ff] font-medium">Cancel</button>
              <button onClick={submitComplaint} disabled={submitting || !form.customerName || !form.defectDescription}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {submitting ? 'Saving...' : 'Log Complaint ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- QUICK VIEW SLIDE PANEL --------------------------------------- */}
      {quickView && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setQuickView(null)} />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-4 flex items-start justify-between gap-3 ${
              quickView.severity === 'Critical' ? 'bg-red-600' :
              quickView.severity === 'High' ? 'bg-orange-500' : 'bg-blue-700'}`}>
              <div>
                <p className="text-white/70 text-xs font-medium">Complaint Details</p>
                <h3 className="text-white font-bold text-base font-mono">{quickView.complaint_number}</h3>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{quickView.severity}</span>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{quickView.status}</span>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{daysOpen(quickView.created_at)}d open</span>
                </div>
              </div>
              <button onClick={() => setQuickView(null)} className="text-white/70 hover:text-white text-2xl leading-none mt-0.5">×</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Key fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Customer', value: quickView.customer_name },
                  { label: 'Part Number', value: quickView.part_number || '—' },
                  { label: 'Part Name', value: quickView.part_name || '—' },
                  { label: 'Category', value: quickView.defect_category || '—' },
                  { label: 'Qty Affected', value: quickView.quantity_affected ? `${quickView.quantity_affected} pcs` : '—' },
                  { label: 'Assigned To', value: quickView.assigned_to || 'Unassigned' },
                ].map(f => (
                  <div key={f.label} className="bg-[#eff6ff] rounded-lg px-3 py-2">
                    <p className="text-xs text-[#1e3a5f] mb-0.5">{f.label}</p>
                    <p className="text-sm font-semibold text-[#1e3a5f] break-words">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Defect description */}
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-xs font-bold text-red-600 mb-1 uppercase tracking-wide">Defect Description</p>
                <p className="text-sm text-[#1e3a5f] leading-relaxed">{quickView.defect_description}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#eff6ff] rounded-lg px-3 py-2">
                  <p className="text-xs text-[#1e3a5f] mb-0.5">Logged On</p>
                  <p className="text-sm font-semibold text-[#1e3a5f]">
                    {new Date(quickView.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </p>
                </div>
                <div className="bg-[#eff6ff] rounded-lg px-3 py-2">
                  <p className="text-xs text-[#1e3a5f] mb-0.5">Days Open</p>
                  <p className={`text-sm font-bold ${daysOpen(quickView.created_at) > 14 ? 'text-red-600' : 'text-[#1e3a5f]'}`}>
                    {daysOpen(quickView.created_at)} days
                  </p>
                </div>
              </div>

              {/* Timeline + Note Composer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Investigation Log</p>
                  <span className="text-xs text-[#1e3a5f]">{quickViewTimeline.length} entr{quickViewTimeline.length === 1 ? 'y' : 'ies'}</span>
                </div>

                {/* Note input */}
                <div className="bg-[#eff6ff] border border-blue-800/50 rounded-xl p-3 mb-3 space-y-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postNote(); }}
                    placeholder="Type investigation note, action taken, finding… (Ctrl+Enter to post)"
                    rows={2}
                    className="w-full bg-white border border-blue-700/50 rounded-lg px-3 py-2 text-xs text-[#1e3a5f] resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#1d4ed8]">Saved to IATF audit trail</span>
                    <button
                      onClick={postNote}
                      disabled={!noteText.trim() || notePosting}
                      className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {notePosting ? (
                        <><span className="animate-spin">↻</span> Posting…</>
                      ) : (
                        <>📝 Post Note</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Timeline entries */}
                {quickViewTimeline.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {quickViewTimeline.map((t, i) => {
                      const isNote = t.action.startsWith('📝 Note:');
                      const isClosed = t.action.startsWith('✅ COMPLAINT CLOSED');
                      return (
                        <div key={i} className={`flex gap-2.5 rounded-lg px-2.5 py-2 ${isNote ? 'bg-[#eff6ff] border border-blue-800/50' : isClosed ? 'bg-green-900/30 border border-green-800/50' : 'bg-[#eff6ff]'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isNote ? 'bg-blue-500' : isClosed ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#1e3a5f] leading-snug break-words">{t.action}</p>
                            <p className="text-[10px] text-[#1e3a5f] mt-0.5">
                              {t.performed_by} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#1e3a5f] text-center py-4">No entries yet. Post the first note above.</p>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-[#dbeafe] p-4 flex gap-3 flex-shrink-0">
              <button onClick={() => setQuickView(null)}
                className="flex-1 border border-[#dbeafe] rounded-xl py-2.5 text-sm text-[#1e3a5f] hover:bg-[#eff6ff] font-medium">
                Close
              </button>
              <Link href={`/complaints/${quickView.id}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-bold text-center transition">
                Open Full Page →
              </Link>
            </div>
          </div>
        </>
      )}

      {/* -- COMPLAINT CLOSURE MODAL -------------------------------------- */}
      {closureModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 rounded-t-2xl px-6 py-4">
              <h3 className="font-bold text-white text-base">✅ Close Complaint — {closureModal.complaint_number}</h3>
              <p className="text-green-100 text-xs mt-0.5">IATF 16949 Cl. 10.2.3 — Document closure evidence</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Root Cause Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={closureForm.rootCause}
                  onChange={e => setClosureForm(f => ({ ...f, rootCause: e.target.value }))}
                  placeholder="e.g. Operator error due to unclear work instruction on line 3..."
                  rows={2}
                  className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Corrective Action Taken <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={closureForm.correctiveAction}
                  onChange={e => setClosureForm(f => ({ ...f, correctiveAction: e.target.value }))}
                  placeholder="e.g. Work instruction updated, operator re-trained, verified with certified parts..."
                  rows={2}
                  className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">Closed By</label>
                <input
                  value={closureForm.closedBy}
                  onChange={e => setClosureForm(f => ({ ...f, closedBy: e.target.value }))}
                  placeholder="Your name / designation"
                  className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-[#1e3a5f] bg-[#eff6ff] rounded-lg px-3 py-2">
                📋 These details will be saved to the complaint timeline as permanent closure evidence.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setClosureModal(null)}
                className="flex-1 border border-[#dbeafe] rounded-xl py-2.5 text-sm text-[#1e3a5f] hover:bg-[#eff6ff] font-medium">
                Cancel
              </button>
              <button
                onClick={submitClosure}
                disabled={!closureForm.rootCause || !closureForm.correctiveAction}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-bold transition">
                Confirm Closure ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-[#1e3a5f] mb-2">Delete Complaint?</h3>
            <p className="text-[#1e3a5f] text-sm mb-4">This will permanently delete the complaint and all related records.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#dbeafe] rounded-lg py-2 text-sm text-[#1e3a5f] hover:bg-[#eff6ff]">Cancel</button>
              <button onClick={() => deleteComplaint(deleteId)} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
