'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Complaint {
  id: number; complaint_number: string; customer_name: string; part_name: string;
  part_number: string; defect_description: string; defect_category: string;
  severity: string; status: string; quantity_affected: number; total_supplied: number;
  assigned_to: string; created_at: string; report_generated: number;
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SEV_CLASS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800',
};
const STATUS_CLASS: Record<string, string> = {
  'Open': 'bg-red-100 text-red-700', 'Under Investigation': 'bg-blue-100 text-blue-700',
  'CAPA In Progress': 'bg-orange-100 text-orange-700', 'Pending Verification': 'bg-purple-100 text-purple-700',
  'Pending Closure': 'bg-yellow-100 text-yellow-700', 'Closed': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-gray-100 text-gray-600',
};
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY_FORM: NewComplaint = {
  customerName: '', customerContact: '', customerRef: '', complaintSource: 'Email',
  complaintDate: today(), partNumber: '', partName: '', defectDescription: '',
  defectCategory: 'General', quantityAffected: '', totalSupplied: '', batchNumber: '',
  severity: 'Medium', assignedTo: '', remarks: '',
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, target, unit = '', trend, color, icon, noData }:
  { label: string; value: string | number; target?: string; unit?: string; trend?: 'up' | 'down' | 'stable'; color: string; icon: string; noData?: boolean }) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400';
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 leading-tight">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      {noData ? (
        <p className="text-2xl font-bold text-gray-300">—</p>
      ) : (
        <p className="text-2xl font-bold text-gray-800">{value}{unit}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        {target && <p className="text-xs text-gray-400">Target: {target}</p>}
        {trend && !noData && <span className={`text-sm font-bold ${trendColor}`}>{trendIcon}</span>}
      </div>
    </div>
  );
}

// ─── STATUS ALERT CARD ────────────────────────────────────────────────────────
function AlertCard({ label, value, color, icon, href }:
  { label: string; value: string | number; color: string; icon: string; href?: string }) {
  const content = (
    <div className={`${color} rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-90 transition`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs font-medium opacity-80">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── TREND CHART ──────────────────────────────────────────────────────────────
function TrendChart({ data }: { data: { month: string; opened: number; closed: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.opened, d.closed]), 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-0.5 items-end" style={{ height: '88px' }}>
            <div className="flex-1 bg-blue-500 rounded-t transition-all" style={{ height: `${(d.opened / max) * 88}px` }} title={`Opened: ${d.opened}`} />
            <div className="flex-1 bg-green-400 rounded-t transition-all" style={{ height: `${(d.closed / max) * 88}px` }} title={`Closed: ${d.closed}`} />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{d.month?.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PARETO CHART ─────────────────────────────────────────────────────────────
function ParetoChart({ data }: { data: { defect_category: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const colors = ['#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  return (
    <div className="space-y-2">
      {data.slice(0, 6).map((d, i) => (
        <div key={d.defect_category} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-24 truncate">{d.defect_category}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d.count / total) * 100}%`, backgroundColor: colors[i] || '#3b82f6' }} />
          </div>
          <span className="text-xs font-bold text-gray-700 w-5 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewComplaint>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    const [list, dash] = await Promise.all([
      fetch('/api/complaints').then(r => r.json()),
      fetch('/api/reports').then(r => r.json()),
    ]);
    setComplaints(list);
    setDashboard(dash);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitComplaint = async () => {
    if (!form.customerName || !form.defectDescription) return;
    setSubmitting(true);
    const createdAt = form.complaintDate ? `${form.complaintDate} 00:00:00` : null;
    await fetch('/api/complaints', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, createdAt }),
    });
    setForm(EMPTY_FORM); setShowModal(false); setSubmitting(false); fetchData();
  };

  const deleteComplaint = async (id: number) => {
    await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
    setDeleteId(null); fetchData();
  };

  const daysOpen = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  const displayed = complaints.filter(c => {
    const mf = filter === 'all' || (filter === 'open' && !['Closed', 'Cancelled'].includes(c.status)) || c.status === filter || c.severity === filter;
    const ms = !search || [c.customer_name, c.complaint_number, c.part_number, c.defect_description].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return mf && ms;
  });

  const openCount = complaints.filter(c => !['Closed', 'Cancelled'].includes(c.status)).length;
  const criticalCount = complaints.filter(c => c.severity === 'Critical' && !['Closed', 'Cancelled'].includes(c.status)).length;

  return (
    <div className="min-h-full bg-gray-50">

      {/* CRITICAL ALERT BANNER */}
      {criticalCount > 0 && (
        <div className="bg-red-600 text-white text-center py-2 text-xs font-bold animate-pulse">
          ⚠ {criticalCount} CRITICAL complaint{criticalCount > 1 ? 's' : ''} open — Immediate escalation required
        </div>
      )}

      <div className="p-5 space-y-5">

        {/* PAGE TITLE */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quality Command Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time quality health across all departments</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow flex items-center gap-2">
            <span>+</span> New Complaint
          </button>
        </div>

        {/* ── TODAY'S STATUS ROW ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Today&apos;s Quality Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <AlertCard label="Customer Complaints" value={openCount} icon="📋"
              color={openCount > 0 ? 'bg-red-600 text-white' : 'bg-green-500 text-white'} href="/" />
            <AlertCard label="Supplier Complaints" value="—" icon="🏭" color="bg-orange-100 text-orange-800" />
            <AlertCard label="Open CAPA" value={dashboard ? dashboard.inProgress : '—'} icon="🔧"
              color="bg-orange-500 text-white" />
            <AlertCard label="Audit NC" value="—" icon="✅" color="bg-yellow-100 text-yellow-800" />
            <AlertCard label="PPAP Pending" value="—" icon="📦" color="bg-blue-100 text-blue-800" />
            <AlertCard label="Calibration Due" value="—" icon="🔬" color="bg-purple-100 text-purple-800" />
            <AlertCard label="Training Due" value="—" icon="🎓" color="bg-indigo-100 text-indigo-800" />
            <AlertCard label="Risk Level" value="Medium" icon="⚠️" color="bg-yellow-400 text-yellow-900" />
          </div>
        </div>

        {/* ── QUALITY KPI CARDS ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quality KPIs</h2>
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
            <KpiCard label="Total Complaints" value={dashboard?.total ?? '—'} target="0"
              trend={dashboard?.total ? (dashboard.total > 5 ? 'up' : 'stable') : undefined}
              color="border-gray-400" icon="📊" noData={!dashboard} />
            <KpiCard label="Closed This Month" value={dashboard?.closed ?? '—'}
              color="border-green-600" icon="✔️" noData={!dashboard} />
          </div>
        </div>

        {/* ── 3 COLUMN SECTION ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">⚡ Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: '+ Customer Complaint', color: 'bg-blue-900 hover:bg-blue-800 text-white', action: () => setShowModal(true) },
                { label: '+ Supplier Complaint', color: 'bg-orange-500 hover:bg-orange-600 text-white', href: '/supplier-complaints' },
                { label: '+ Create 8D Report', color: 'bg-red-600 hover:bg-red-700 text-white', href: '/' },
                { label: '+ Create CAPA', color: 'bg-purple-600 hover:bg-purple-700 text-white', href: '/capa' },
                { label: '+ Add Audit Finding', color: 'bg-green-600 hover:bg-green-700 text-white', href: '/audit' },
                { label: '+ Upload Document', color: 'bg-gray-600 hover:bg-gray-700 text-white', href: '/documents' },
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
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">📋 Today&apos;s Tasks</h3>
            <div className="space-y-2">
              {[
                { label: 'Pending Complaint Approvals', count: openCount, color: 'bg-red-50 border-red-200 text-red-800' },
                { label: 'Overdue CAPA Actions', count: '—', color: 'bg-orange-50 border-orange-200 text-orange-800' },
                { label: 'Upcoming Audits (7 days)', count: '—', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                { label: 'Calibration Due Today', count: '—', color: 'bg-purple-50 border-purple-200 text-purple-800' },
                { label: 'Customer Visit This Week', count: '—', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                { label: 'Management Review Prep', count: '—', color: 'bg-gray-50 border-gray-200 text-gray-700' },
              ].map(t => (
                <div key={t.label} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${t.color}`}>
                  <span className="text-xs font-medium">{t.label}</span>
                  <span className="text-xs font-bold">{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">🤖 AI Suggestions</h3>
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
                    <div className="flex gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <span className="text-orange-500 text-sm flex-shrink-0">⚠️</span>
                      <p className="text-xs text-orange-700">Customer PPM <b>{dashboard.ppm}</b> exceeds target of 100 — review top defect categories</p>
                    </div>
                  )}
                  {dashboard && dashboard.open > 3 && (
                    <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-blue-500 text-sm flex-shrink-0">📊</span>
                      <p className="text-xs text-blue-700"><b>{dashboard.open} open complaints</b> — check if CAPA actions are on track</p>
                    </div>
                  )}
                  <div className="flex gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <span className="text-yellow-500 text-sm flex-shrink-0">💡</span>
                    <p className="text-xs text-yellow-700">Connect Supplier Quality module to get supplier PPM analysis and SCAR recommendations</p>
                  </div>
                </>
              ) : (
                <>
                  {['Log your first complaint to activate AI trend analysis', 'Connect calibration data to get due-date alerts', 'Add audit findings to get compliance score', 'Upload supplier data to get supplier risk index'].map((s, i) => (
                    <div key={i} className="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-400 text-sm flex-shrink-0">💡</span>
                      <p className="text-xs text-gray-600">{s}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── CHARTS ROW ─────────────────────────────────────────────────── */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monthly Complaint Trend</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 bg-blue-500 rounded inline-block"></span>Opened</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 bg-green-400 rounded inline-block"></span>Closed</span>
                </div>
              </div>
              {dashboard.trend.length > 0 ? <TrendChart data={dashboard.trend} /> : <p className="text-gray-300 text-sm text-center py-8">No data yet</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Defect Category Pareto</h3>
              {dashboard.pareto.length > 0 ? <ParetoChart data={dashboard.pareto} /> : <p className="text-gray-300 text-sm text-center py-8">No data yet</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">By Severity</h3>
              {dashboard.bySeverity.length > 0 ? (
                <div className="space-y-2.5 mt-2">
                  {dashboard.bySeverity.map(s => {
                    const total = dashboard.bySeverity.reduce((a, b) => a + b.count, 0) || 1;
                    const colors: Record<string, string> = { Critical: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-yellow-400', Low: 'bg-green-400' };
                    return (
                      <div key={s.severity}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{s.severity}</span>
                          <span className="font-bold text-gray-900">{s.count} ({Math.round(s.count / total * 100)}%)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[s.severity] || 'bg-blue-400'}`} style={{ width: `${(s.count / total) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-gray-300 text-sm text-center py-8">No data yet</p>}
            </div>
          </div>
        )}

        {/* ── RECENT COMPLAINTS TABLE ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-gray-800 text-sm flex-shrink-0">📋 Customer Complaints</h2>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search complaint, customer, part..."
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-1 flex-wrap">
              {[['all', 'All'], ['open', 'Open'], ['Under Investigation', 'Investigating'],
                ['CAPA In Progress', 'CAPA'], ['Closed', 'Closed'], ['Critical', '🔴 Critical']].map(([val, lbl]) => (
                <button key={val} onClick={() => setFilter(val)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === val ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {['Complaint No.', 'Date', 'Customer', 'Part', 'Defect', 'Qty', 'Severity', 'Status', 'Days', '8D', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    No complaints found. Click &quot;+ New Complaint&quot; to log the first one.
                  </td></tr>
                ) : displayed.map(c => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-blue-50 transition group">
                    <td className="px-4 py-3">
                      <Link href={`/complaints/${c.id}`} className="font-mono text-xs font-bold text-blue-900 hover:underline">{c.complaint_number || `CC-${c.id}`}</Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{c.customer_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.part_number} {c.part_name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <Link href={`/complaints/${c.id}`} className="hover:text-blue-700 line-clamp-2 text-xs">{c.defect_description}</Link>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700 text-xs">{c.quantity_affected}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_CLASS[c.severity] || ''}`}>{c.severity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${STATUS_CLASS[c.status] || ''}`}>{c.status}</span>
                    </td>
                    <td className={`px-4 py-3 text-center font-bold text-xs ${daysOpen(c.created_at) > 14 && c.status !== 'Closed' ? 'text-red-600' : 'text-gray-400'}`}>
                      {daysOpen(c.created_at)}d
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.report_generated ? <span className="text-green-500 text-sm" title="8D Generated">✓</span> : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Link href={`/complaints/${c.id}`} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 bg-blue-50 rounded font-medium">Open</Link>
                        <button onClick={() => setDeleteId(c.id)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 bg-red-50 rounded font-medium">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 border-t border-gray-50 text-xs text-gray-400">
            Showing {displayed.length} of {complaints.length} complaints
          </div>
        </div>
      </div>

      {/* ── NEW COMPLAINT MODAL ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base">Log New Customer Complaint</h2>
                <p className="text-blue-200 text-xs">All fields marked * are required</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-blue-300 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">Customer Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                    <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                      placeholder="e.g. Maruti Suzuki India Ltd"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Complaint Date *</label>
                    <input type="date" value={form.complaintDate} onChange={e => setForm(p => ({ ...p, complaintDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Customer Contact Person</label>
                    <input value={form.customerContact} onChange={e => setForm(p => ({ ...p, customerContact: e.target.value }))}
                      placeholder="Name / Email / Phone"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Customer Reference No.</label>
                    <input value={form.customerRef} onChange={e => setForm(p => ({ ...p, customerRef: e.target.value }))}
                      placeholder="Customer's complaint / NCR no."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Complaint Source</label>
                    <select value={form.complaintSource} onChange={e => setForm(p => ({ ...p, complaintSource: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Email', 'Customer Portal', 'Phone Call', 'Field Visit', 'Warranty Return', 'Production Line Stoppage', 'Customer Audit', 'Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
                    <input value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
                      placeholder="Engineer name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              {/* Part Info */}
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">Part Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Part Number</label>
                    <input value={form.partNumber} onChange={e => setForm(p => ({ ...p, partNumber: e.target.value }))}
                      placeholder="e.g. BRK-0421-LH"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Part Name</label>
                    <input value={form.partName} onChange={e => setForm(p => ({ ...p, partName: e.target.value }))}
                      placeholder="e.g. Brake Bracket LH"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Batch / Lot Number</label>
                    <input value={form.batchNumber} onChange={e => setForm(p => ({ ...p, batchNumber: e.target.value }))}
                      placeholder="e.g. LOT-2024-07-A"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Defect Category</label>
                    <select value={form.defectCategory} onChange={e => setForm(p => ({ ...p, defectCategory: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Dimensional', 'Surface Defect', 'Welding', 'Assembly', 'Material', 'Leak', 'Coating/Plating', 'Mixed Parts', 'General', 'Functional', 'Packaging'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty Rejected (pcs)</label>
                    <input type="number" value={form.quantityAffected} onChange={e => setForm(p => ({ ...p, quantityAffected: e.target.value }))}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Supplied (pcs) — for PPM</label>
                    <input type="number" value={form.totalSupplied} onChange={e => setForm(p => ({ ...p, totalSupplied: e.target.value }))}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              {/* Defect Details */}
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">Defect Details</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Defect Description *</label>
                    <textarea value={form.defectDescription} onChange={e => setForm(p => ({ ...p, defectDescription: e.target.value }))}
                      rows={3} placeholder="Describe the defect clearly — what is wrong, where, customer impact, detection method..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Severity *</label>
                      <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Critical">🔴 Critical — Line stoppage / Safety</option>
                        <option value="High">🟠 High — Functional / Major defect</option>
                        <option value="Medium">🟡 Medium — Non-functional / Cosmetic</option>
                        <option value="Low">🟢 Low — Minor / Cosmetic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                      <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                        placeholder="Any additional notes"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => setShowModal(false)} className="text-gray-500 px-5 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={submitComplaint} disabled={submitting || !form.customerName || !form.defectDescription}
                  className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Log Complaint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-800 mb-2">Delete Complaint?</h3>
            <p className="text-gray-500 text-sm mb-4">This will permanently delete the complaint and all related records.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteComplaint(deleteId)} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
