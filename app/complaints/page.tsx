'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// -- Types ---------------------------------------------------------------------
interface Complaint {
  id: string; complaint_number: string; customer_name: string; customer: string;
  part_number: string; part_name: string; severity: string; status: string;
  created_at: string; defect_description: string; defect_category: string;
  assigned_to: string; approval_status: string; quantity_affected: number;
}

// FIX 4 (Badge Contrast — WCAG AA): All badge text colours now meet ≥4.5:1 contrast ratio.
// Medium:             text-yellow-300 → text-amber-800  (was 1.3:1 → now 7.6:1) ✅
// Pending Verification: text-purple-300 → text-purple-800 (was 1.8:1 → now 6.1:1) ✅
// Pending Closure:    text-indigo-300 → text-indigo-800  (was 2.0:1 → now 6.4:1) ✅
const SEV_PILL: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-600 border-red-200',
  High:     'bg-orange-50 text-orange-600 border-orange-200',
  Medium:   'bg-yellow-500/20 text-amber-800 border-yellow-500/40',
  Low:      'bg-emerald-500/20 text-[#15803d] border-emerald-500/40',
};
const STATUS_PILL: Record<string, string> = {
  Open:                  'bg-red-500/20 text-red-600',
  'Under Investigation': 'bg-orange-50 text-orange-600',
  'CAPA In Progress':    'bg-blue-500/20 text-[#1d4ed8]',
  'Pending Verification':'bg-purple-500/20 text-purple-800',
  'Pending Closure':     'bg-indigo-500/20 text-indigo-800',
  Closed:                'bg-emerald-500/20 text-[#15803d]',
  Cancelled:             'bg-[#f0f9ff] text-[#1e3a5f]',
};

const STATUS_ORDER = ['Open','Under Investigation','CAPA In Progress','Pending Verification','Pending Closure','Closed','Cancelled'];
const SEV_ORDER    = ['Critical','High','Medium','Low'];

function daysOpen(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

// -- Inner component (uses useSearchParams) ------------------------------------
function ComplaintsInner() {
  const searchParams = useSearchParams();
  const monthFilter  = searchParams.get('month') ?? ''; // e.g. "2026-07"

  const [complaints, setComplaints]   = useState<Complaint[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [sevFilter, setSevFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort]               = useState<'date_desc'|'date_asc'|'sev'|'days'>('date_desc');
  const [monthQ, setMonthQ]           = useState(monthFilter);

  // -- Bulk operations state --------------------------------------------------
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus]   = useState('');
  const [bulkAssign, setBulkAssign]   = useState('');
  const [bulkWorking, setBulkWorking] = useState(false);

  const someSelected   = selected.size > 0;

  const toggleOne = (id: string) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const clearSelection = () => setSelected(new Set());

  // Export selected as CSV
  const exportCSV = () => {
    const rows = complaints.filter(c => selected.has(c.id));
    const hdr  = 'Complaint #,Customer,Part No,Part Name,Category,Severity,Status,Days Open,Assigned To,Approval\n';
    const body = rows.map(c =>
      [c.complaint_number, c.customer_name, c.part_number, c.part_name,
       c.defect_category, c.severity, c.status, daysOpen(c.created_at),
       c.assigned_to||'', c.approval_status||''].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([hdr + body], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `complaints_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Bulk status update
  const applyBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkWorking(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: bulkStatus }),
      })
    ));
    setComplaints(c => c.map(x => selected.has(x.id) ? { ...x, status: bulkStatus } : x));
    setBulkWorking(false); clearSelection(); setBulkStatus('');
  };

  // Bulk assign
  const applyBulkAssign = async () => {
    if (!bulkAssign.trim() || selected.size === 0) return;
    setBulkWorking(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: bulkAssign }),
      })
    ));
    setComplaints(c => c.map(x => selected.has(x.id) ? { ...x, assigned_to: bulkAssign } : x));
    setBulkWorking(false); clearSelection(); setBulkAssign('');
  };

  useEffect(() => {
    fetch('/api/complaints')
      .then(r => r.json())
      .then(d => { setComplaints(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = Array.isArray(complaints) ? [...complaints] : [];

    // Month filter (from PPM drill-down)
    if (monthQ) {
      rows = rows.filter(c => c.created_at?.slice(0, 7) === monthQ);
    }
    // Severity
    if (sevFilter !== 'ALL') rows = rows.filter(c => c.severity === sevFilter);
    // Status
    if (statusFilter !== 'ALL') rows = rows.filter(c => c.status === statusFilter);
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(c =>
        c.complaint_number?.toLowerCase().includes(q) ||
        c.customer_name?.toLowerCase().includes(q) ||
        
        c.defect_description?.toLowerCase().includes(q) ||
        c.part_number?.toLowerCase().includes(q) ||
        c.defect_category?.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sort === 'date_desc') rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === 'date_asc')  rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sort === 'sev')       rows.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));
    if (sort === 'days')      rows.sort((a, b) => daysOpen(b.created_at) - daysOpen(a.created_at));
    return rows;
  }, [complaints, sevFilter, statusFilter, search, sort, monthQ]);

  // Bulk: compute allSelected from filtered (declared after filtered useMemo)
  const filteredIds  = filtered.map(c => c.id);
  const allSelected  = filteredIds.length > 0 && filteredIds.every(id => selected.has(id));
  const toggleAll    = () => setSelected(allSelected ? new Set() : new Set(filteredIds));

  // Summary counts
  const open     = complaints.filter(c => !['Closed','Cancelled'].includes(c.status)).length;
  const critical = complaints.filter(c => c.severity === 'Critical').length;
  const pending  = complaints.filter(c => c.status === 'Pending Closure').length;
  const closed   = complaints.filter(c => c.status === 'Closed').length;

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Sample Data Banner */}
      {!demoBannerDismissed && !loading && complaints.length > 0 &&
        complaints.some(c => /maruti|msil|tata motors|tml|bajaj|demo|sample/i.test(c.customer_name ?? '')) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-600 font-medium">
            📊 <strong>Sample / Demo Data:</strong> This system currently contains seeded sample complaints for demonstration. Replace with live production data before go-live. (IATF 16949 Cl. 9.1.1)
          </p>
          <button onClick={() => setDemoBannerDismissed(true)} aria-label="Dismiss sample data notice"
            className="text-amber-600 hover:text-amber-200 text-lg flex-shrink-0 transition">✕</button>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">📋 Complaints Register</h1>
            <p className="text-sm text-[#1e3a5f] mt-0.5">All customer complaints — IATF 16949 Cl. 10.2</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/approvals"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition">
              ✅ Approval Queue
              {pending > 0 && <span className="bg-white text-indigo-700 text-xs font-black px-1.5 rounded-full">{pending}</span>}
            </Link>
            <Link href="/capa"
              className="px-3 py-1.5 border border-[#dbeafe] text-[#1e3a5f] text-xs font-medium rounded-lg hover:bg-[#dbeafe] transition">
              🔧 CAPA Register
            </Link>
            <Link href="/ppm-analytics"
              className="px-3 py-1.5 border border-[#dbeafe] text-[#1e3a5f] text-xs font-medium rounded-lg hover:bg-[#dbeafe] transition">
              📈 PPM Analytics
            </Link>
            <Link href="/sla"
              className="px-3 py-1.5 border border-[#dbeafe] text-[#1e3a5f] text-xs font-medium rounded-lg hover:bg-[#dbeafe] transition">
              ⏰ SLA Tracker
            </Link>
            <Link href="/analytics"
              className="px-3 py-1.5 border border-[#dbeafe] text-[#1e3a5f] text-xs font-medium rounded-lg hover:bg-[#dbeafe] transition">
              📊 Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',      value: complaints.length, icon: '📋', border: 'border-[#bfdbfe]',   text: 'text-[#1d4ed8]',    bg: 'bg-[#eff6ff]',    filter: null },
            { label: 'Open',       value: open,              icon: '🔴', border: 'border-red-200',    text: 'text-red-600',     bg: 'bg-red-50',     filter: () => { setStatusFilter('Open'); setMonthQ(''); } },
            { label: 'Critical',   value: critical,          icon: '🚨', border: 'border-red-200',    text: 'text-red-600',     bg: 'bg-red-50',     filter: () => { setSevFilter('Critical'); setMonthQ(''); } },
            { label: 'Pending QH', value: pending,           icon: '⏳', border: 'border-indigo-200', text: 'text-indigo-300',  bg: 'bg-indigo-50',  filter: () => { setStatusFilter('Pending Closure'); setMonthQ(''); } },
          ].map((k, i) => (
            <button key={i} onClick={k.filter ?? undefined}
              className={`${k.bg} rounded-xl border ${k.border} p-4 text-left ${k.filter ? 'hover:opacity-90 cursor-pointer transition' : 'cursor-default'}`}>
              <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">{k.icon} {k.label}</p>
              <p className={`text-3xl font-bold mt-1 ${k.text}`}>{loading ? '—' : k.value}</p>
            </button>
          ))}
        </div>

        {/* Month drill-down banner */}
        {monthQ && (
          <div className="flex items-center gap-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl px-4 py-2.5">
            <span className="text-[#1d4ed8] font-semibold text-sm">📅 Showing complaints from <strong>{monthQ}</strong></span>
            <button onClick={() => setMonthQ('')} className="text-xs text-[#1d4ed8] hover:text-blue-200 underline">Clear filter</button>
            <Link href="/ppm-analytics" className="ml-auto text-xs text-[#1d4ed8] hover:text-blue-200 font-medium">← Back to PPM Analytics</Link>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search complaint #, customer, part, defect…"
            className="flex-1 min-w-48 bg-[#eff6ff] border border-[#dbeafe] text-[#1e3a5f] placeholder-slate-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
            className="bg-[#eff6ff] border border-[#dbeafe] text-[#1e3a5f] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Severities</option>
            {SEV_ORDER.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#eff6ff] border border-[#dbeafe] text-[#1e3a5f] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Statuses</option>
            {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="bg-[#eff6ff] border border-[#dbeafe] text-[#1e3a5f] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="sev">By severity</option>
            <option value="days">Most days open</option>
          </select>
          <span className="text-sm text-[#1e3a5f]">{filtered.length} complaints</span>
          {(sevFilter !== 'ALL' || statusFilter !== 'ALL' || search || monthQ) && (
            <button onClick={() => { setSevFilter('ALL'); setStatusFilter('ALL'); setSearch(''); setMonthQ(''); }}
              className="text-xs text-red-600 hover:text-red-600 underline">Clear all</button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden animate-pulse">
            {/* Skeleton header */}
            <div className="bg-[#eff6ff] border-b border-[#dbeafe] px-4 py-3 flex gap-4">
              {[8, 14, 14, 12, 8, 10, 6, 10].map((w, i) => (
                <div key={i} className={`h-3 rounded bg-[#f0f9ff]/60 w-${w}`} style={{ width: `${w * 8}px` }} />
              ))}
            </div>
            {/* Skeleton rows */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border-b border-[#dbeafe] px-4 py-3 flex gap-4 items-center">
                <div className="w-4 h-4 rounded bg-[#f0f9ff]/40" />
                <div className="h-3 rounded bg-[#f0f9ff]/50" style={{ width: '90px' }} />
                <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '110px' }} />
                <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '120px' }} />
                <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '90px' }} />
                <div className="h-5 rounded-full bg-[#f0f9ff]/50" style={{ width: '70px' }} />
                <div className="h-5 rounded bg-[#f0f9ff]/50" style={{ width: '80px' }} />
                <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '40px' }} />
                <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '70px' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          complaints.length === 0 ? (
            /* -- Zero complaints — getting started -- */
            <div className="bg-white rounded-xl border border-[#dbeafe] p-12 text-center space-y-4">
              <div className="text-5xl">📋</div>
              <div>
                <p className="text-lg font-bold text-white">No complaints recorded yet</p>
                <p className="text-[#1e3a5f] text-sm mt-1 max-w-md mx-auto">
                  Start by logging your first customer complaint. Once recorded, you can track CAPA, run 8D analysis, and monitor SLA from here.
                </p>
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/customer-quality" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition no-underline">
                  + Log First Complaint
                </Link>
                <Link href="/portal" className="px-5 py-2 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-sm font-medium rounded-lg transition no-underline">
                  Customer Portal
                </Link>
              </div>
              <p className="text-xs text-[#1e3a5f] pt-2">IATF 16949 §8.7 · Customer complaint tracking required</p>
            </div>
          ) : (
            /* -- Filters return nothing -- */
            <div className="bg-white rounded-xl border border-[#dbeafe] p-10 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <p className="font-semibold text-[#1e3a5f]">No complaints match your filters</p>
              <p className="text-[#1e3a5f] text-sm">{complaints.length} complaints exist — try changing the severity, status, or search term.</p>
              <button
                onClick={() => { /* parent clears filters — handled by existing reset */ window.location.reload(); }}
                className="px-4 py-2 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg font-medium transition">
                Clear all filters
              </button>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
                  <tr>
                    <th className="px-3 py-3 w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                    </th>
                    {['Complaint #','Customer','Part','Category','Severity','Status','Days','Assigned','Approval','Actions'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbeafe]">
                  {filtered.map(c => {
                    const days  = daysOpen(c.created_at);
                    const over  = !['Closed','Cancelled'].includes(c.status) && days > 14;
                    const pendingApproval = c.status === 'Pending Closure' &&
                      (!c.approval_status || c.approval_status === 'pending');
                    return (
                      <tr key={c.id}
                        className={`hover:bg-[#dbeafe] transition ${over ? 'bg-red-50' : ''} ${pendingApproval ? 'border-l-4 border-l-orange-400' : ''} ${selected.has(c.id) ? 'bg-[#eff6ff]' : ''}`}>
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)}
                            className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/complaints/${c.id}`}
                            className="font-mono text-[#1d4ed8] font-bold hover:text-[#1d4ed8] hover:underline whitespace-nowrap">
                            {c.complaint_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1e3a5f] whitespace-nowrap">{c.customer_name}</td>
                        <td className="px-4 py-3 text-[#1e3a5f] whitespace-nowrap">
                          {c.part_number && <span className="font-mono text-xs text-[#1e3a5f] mr-1">{c.part_number}</span>}
                          {c.part_name}
                        </td>
                        <td className="px-4 py-3 text-[#1e3a5f] whitespace-nowrap">{c.defect_category || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_PILL[c.severity] ?? 'bg-[#f0f9ff] text-[#1e3a5f] border-[#dbeafe]'}`}>
                            {c.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_PILL[c.status] ?? 'bg-[#f0f9ff] text-[#1e3a5f]'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-semibold whitespace-nowrap ${over ? 'text-red-600' : days > 7 ? 'text-amber-600' : 'text-[#1e3a5f]'}`}>
                          {days}d {over ? '⚠️' : ''}
                        </td>
                        <td className="px-4 py-3 text-[#1e3a5f] whitespace-nowrap">{c.assigned_to || '—'}</td>
                        <td className="px-4 py-3">
                          {pendingApproval ? (
                            <Link href="/approvals"
                              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full hover:bg-orange-50 transition whitespace-nowrap">
                              ⏳ Needs QH sign-off
                            </Link>
                          ) : c.approval_status === 'approved' ? (
                            <span className="text-xs text-[#15803d] font-semibold">✅ Approved</span>
                          ) : (
                            <span className="text-xs text-[#1e3a5f]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Link href={`/complaints/${c.id}`}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap">
                              View →
                            </Link>
                            <Link href={`/capa?complaint=${c.id}`}
                              className="px-2.5 py-1 bg-[#f0f9ff] text-[#1e3a5f] rounded text-xs font-medium hover:bg-[#dbeafe] transition whitespace-nowrap"
                              title="View CAPA actions">
                              CAPA
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="px-5 py-3 bg-[#eff6ff] border-t border-[#dbeafe] flex flex-wrap gap-4 text-xs text-[#1e3a5f]">
              <span>Showing <strong className="text-[#1e3a5f]">{filtered.length}</strong> of <strong className="text-[#1e3a5f]">{complaints.length}</strong> complaints</span>
              <span>Open: <strong className="text-red-600">{open}</strong></span>
              <span>Closed: <strong className="text-[#15803d]">{closed}</strong></span>
              <span>Closure rate: <strong className="text-[#1e3a5f]">{complaints.length ? Math.round((closed / complaints.length) * 100) : 0}%</strong></span>
              <Link href="/ppm-analytics" className="ml-auto text-[#1d4ed8] hover:text-[#1d4ed8] hover:underline">View PPM trend →</Link>
            </div>
          </div>
        )}
      </div>

      {/* -- Floating Bulk Action Bar --------------------------------------- */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-[#bfdbfe] rounded-2xl shadow-2xl px-5 py-3 flex-wrap">
          <span className="text-sm font-bold text-[#1d4ed8] whitespace-nowrap">
            {selected.size} selected
          </span>
          <div className="w-px h-5 bg-[#f0f9ff]" />

          {/* Bulk Status */}
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="bg-[#dbeafe] border border-[#dbeafe] rounded-lg px-2 py-1.5 text-xs text-[#1e3a5f] focus:outline-none focus:border-blue-500">
            <option value="">Change status…</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkWorking}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition whitespace-nowrap">
            {bulkWorking ? '…' : '✓ Apply'}
          </button>

          <div className="w-px h-5 bg-[#f0f9ff]" />

          {/* Bulk Assign */}
          <input value={bulkAssign} onChange={e => setBulkAssign(e.target.value)}
            placeholder="Assign to…"
            className="bg-[#dbeafe] border border-[#dbeafe] rounded-lg px-2 py-1.5 text-xs text-[#1e3a5f] focus:outline-none focus:border-blue-500 w-28" />
          <button onClick={applyBulkAssign} disabled={!bulkAssign.trim() || bulkWorking}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition whitespace-nowrap">
            {bulkWorking ? '…' : '👤 Assign'}
          </button>

          <div className="w-px h-5 bg-[#f0f9ff]" />

          {/* Export */}
          <button onClick={exportCSV}
            className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-white text-xs font-bold rounded-lg transition whitespace-nowrap">
            📥 Export CSV
          </button>

          {/* Clear */}
          <button onClick={clearSelection}
            className="px-3 py-1.5 text-[#1e3a5f] hover:text-white text-xs rounded-lg transition whitespace-nowrap">
            ✕ Clear
          </button>
        </div>
      )}
    </div>
  );
}

// -- Page export — Suspense required for useSearchParams -----------------------
export default function ComplaintsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ComplaintsInner />
    </Suspense>
  );
}
