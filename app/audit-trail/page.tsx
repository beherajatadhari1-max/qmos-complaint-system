'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';
import RoleGuard from '../components/RoleGuard';

// -- Types ---------------------------------------------------------------------
interface AuditEvent {
  id: string;
  source: string;
  category: string;
  action: string;
  performed_by: string;
  performed_at: string;
  complaint_id: string;
  complaint_number: string;
  customer_name: string;
  severity: string;
}

// -- Category config ------------------------------------------------------------
const CAT_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  created:      { label: 'Created',       icon: '➕', color: 'text-[#1d4ed8]',   bg: 'bg-blue-100 border-blue-700/50' },
  approval:     { label: 'Approval',      icon: '✅', color: 'text-green-300',  bg: 'bg-green-100 border-green-700/50' },
  rejection:    { label: 'Rejected',      icon: '❌', color: 'text-red-700',    bg: 'bg-red-100 border-red-700/50' },
  capa:         { label: 'CAPA',          icon: '🔧', color: 'text-purple-300', bg: 'bg-purple-100 border-purple-700/50' },
  closure:      { label: 'Closure',       icon: '🔒', color: 'text-[#1e3a5f]',   bg: 'bg-[#f0f9ff]/40 border-[#dbeafe]' },
  status_change:{ label: 'Status Change', icon: '🔄', color: 'text-amber-700',  bg: 'bg-amber-100 border-amber-200' },
  containment:  { label: 'Containment',   icon: '🛡', color: 'text-cyan-300',   bg: 'bg-cyan-100 border-cyan-200' },
  report:       { label: '8D Report',     icon: '📄', color: 'text-indigo-300', bg: 'bg-indigo-100 border-indigo-700/50' },
  team:         { label: 'Team',          icon: '👥', color: 'text-teal-700',   bg: 'bg-teal-100 border-teal-200' },
  update:       { label: 'Update',        icon: '✏️', color: 'text-slate-700',  bg: 'bg-slate-100 border-slate-200' },
};

const SEV_PILL: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-300',
  High:     'bg-orange-100 text-orange-600 border-orange-300',
  Medium:   'bg-yellow-100 text-yellow-300 border-yellow-300',
  Low:      'bg-green-100 text-[#15803d] border-green-300',
};

function fmtDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return fmtDateTime(iso).split(',')[0]; // just the date
}

// -- Event Row -----------------------------------------------------------------
function EventRow({ e }: { e: AuditEvent }) {
  const cfg = CAT_CONFIG[e.category] ?? CAT_CONFIG.update;
  return (
      <>
      <PageTitle title="Audit Trail" />
      <tr className="border-t border-[#dbeafe] hover:bg-white/[0.03] transition">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-xs font-medium text-[#1e3a5f]">{fmtDateTime(e.performed_at)}</div>
        <div className="text-xs text-[#1e3a5f] mt-0.5">{timeAgo(e.performed_at)}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-[#1e3a5f] max-w-xs">
        <p className="leading-relaxed">{e.action}</p>
      </td>
      <td className="px-4 py-3">
        {e.complaint_number ? (
          <div className="space-y-0.5">
            <Link href={`/complaints/${e.complaint_id}`}
              className="font-mono text-[#1d4ed8] font-bold text-xs hover:underline block">
              {e.complaint_number}
            </Link>
            <div className="text-xs text-[#1e3a5f] truncate max-w-[120px]">{e.customer_name}</div>
            {e.severity && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${SEV_PILL[e.severity] ?? 'bg-[#f0f9ff]/40 text-[#1e3a5f] border-[#dbeafe]'}`}>
                {e.severity}
              </span>
            )}
          </div>
        ) : <span className="text-[#1e3a5f] text-xs">—</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-[#1e3a5f] shrink-0">
            {(e.performed_by ?? 'S')[0].toUpperCase()}
          </div>
          <span className="text-xs text-[#1e3a5f]">{e.performed_by || 'System'}</span>
        </div>
      </td>
    </tr>
      </>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function AuditTrailPage() {
  return (
    <RoleGuard minLevel={2} deniedMessage="Audit Trail requires Auditor access or above.">
      <AuditTrailContent />
    </RoleGuard>
  );
}

function AuditTrailContent() {
  const [events, setEvents]     = useState<AuditEvent[]>([]);
  const [actors, setActors]     = useState<string[]>([]);
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);

  // Filters
  const [catFilter, setCatFilter]   = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [search, setSearch]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [view, setView]             = useState<'list' | 'timeline'>('list');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '300' });
      if (dateFrom) params.set('since', new Date(dateFrom).toISOString());
      const r = await fetch(`/api/audit-trail?${params}`);
      const d = await r.json();
      setEvents(d.events ?? []);
      setActors(d.actors ?? []);
      setCatCounts(d.categoryCounts ?? {});
      setTotal(d.total ?? 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [dateFrom]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let rows = [...events];
    if (catFilter !== 'all')   rows = rows.filter(e => e.category === catFilter);
    if (actorFilter !== 'all') rows = rows.filter(e => e.performed_by === actorFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(e =>
        e.action?.toLowerCase().includes(q) ||
        e.complaint_number?.toLowerCase().includes(q) ||
        e.customer_name?.toLowerCase().includes(q) ||
        e.performed_by?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [events, catFilter, actorFilter, search]);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Date/Time','Category','Action','Complaint #','Customer','Severity','Performed By'];
    const rows = filtered.map(e => [
      fmtDateTime(e.performed_at), e.category, `"${e.action.replace(/"/g,'""')}"`,
      e.complaint_number, e.customer_name, e.severity, e.performed_by,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `QMOS_AuditTrail_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">🗂 Audit Trail</h1>
            <p className="text-sm text-[#1e3a5f] mt-0.5">
              Complete revision history — IATF 16949 Cl. 7.5.3 (Control of Documented Information) &amp; Cl. 9.1.1
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={fetchData} className="px-3 py-1.5 border border-[#dbeafe] rounded-lg text-xs text-[#1e3a5f] hover:bg-white/[0.03] transition">
              ↻ Refresh
            </button>
            <button onClick={exportCSV}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition">
              ⬇ Export CSV
            </button>
            <Link href="/complaints" className="px-3 py-1.5 border border-[#dbeafe] rounded-lg text-xs text-[#1e3a5f] hover:bg-white/[0.03] transition">
              ← Complaints
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* KPI tiles — by category */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {['created','approval','capa','status_change','closure'].map(cat => {
            const cfg = CAT_CONFIG[cat];
            return (
              <button key={cat} onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
                className={`bg-white rounded-xl border-2 p-3 text-left hover:shadow-md transition ${catFilter === cat ? 'ring-2 ring-blue-400 ring-offset-1' : 'border-[#dbeafe]'}`}>
                <p className="text-lg mb-1">{cfg.icon}</p>
                <p className="text-xl font-black text-[#1e3a5f]">{catCounts[cat] ?? 0}</p>
                <p className="text-xs text-[#1e3a5f] font-medium">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* IATF evidence note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex gap-3 items-start">
          <span className="text-xl mt-0.5">📎</span>
          <div className="text-sm text-amber-900">
            <p className="font-bold">IATF 16949 Objective Evidence</p>
            <p className="text-amber-800 text-xs mt-0.5">This audit trail is objective evidence for Cl. 7.5.3 (control of documented information), Cl. 10.2 (nonconformity records), and Cl. 9.1.1 (monitoring &amp; measurement). Export CSV for auditor submission.</p>
          </div>
          <button onClick={exportCSV}
            className="ml-auto shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition whitespace-nowrap">
            Export for Auditor
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actions, complaint #, customer, user…"
            className="flex-1 min-w-48 border border-[#dbeafe] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="border border-[#dbeafe] rounded-lg px-2 py-1.5 text-sm focus:outline-none">
            <option value="all">All Categories</option>
            {Object.entries(CAT_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label} ({catCounts[k] ?? 0})</option>
            ))}
          </select>
          <select value={actorFilter} onChange={e => setActorFilter(e.target.value)}
            className="border border-[#dbeafe] rounded-lg px-2 py-1.5 text-sm focus:outline-none">
            <option value="all">All Users</option>
            {actors.map(a => <option key={a}>{a}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#1e3a5f]">From:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-[#dbeafe] rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-1 bg-[#f0f9ff]/40 rounded-lg p-0.5">
            <button onClick={() => setView('list')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${view === 'list' ? 'bg-white shadow text-[#1d4ed8]' : 'text-[#1e3a5f]'}`}>
              📋 Table
            </button>
            <button onClick={() => setView('timeline')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${view === 'timeline' ? 'bg-white shadow text-[#1d4ed8]' : 'text-[#1e3a5f]'}`}>
              📅 Timeline
            </button>
          </div>
          <span className="text-sm text-[#1e3a5f] ml-auto">{filtered.length} of {total} events</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-[#1e3a5f] text-sm">Loading audit trail…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#dbeafe] p-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-[#1e3a5f]">No events match this filter</p>
            <p className="text-sm text-[#1e3a5f] mt-1">System actions are logged automatically as complaints are created, updated, and resolved.</p>
          </div>
        ) : view === 'list' ? (
          // -- Table view --
          <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#eff6ff] border-b">
                  <tr>
                    {['Date / Time','Category','Action','Complaint','Performed By'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => <EventRow key={e.id} e={e} />)}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-[#eff6ff] border-t text-xs text-[#1e3a5f]">
              Showing {filtered.length} events · Last updated {new Date().toLocaleTimeString('en-IN')}
            </div>
          </div>
        ) : (
          // -- Timeline view --
          <div className="space-y-0">
            {filtered.map((e, i) => {
              const cfg = CAT_CONFIG[e.category] ?? CAT_CONFIG.update;
              const showDate = i === 0 || new Date(e.performed_at).toDateString() !== new Date(filtered[i - 1].performed_at).toDateString();
              return (
                <div key={e.id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="h-px flex-1 bg-[#f0f9ff]/60" />
                      <span className="text-xs font-bold text-[#1e3a5f] bg-[#f0f9ff]/40 px-3 py-1 rounded-full">
                        {new Date(e.performed_at).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <div className="h-px flex-1 bg-[#f0f9ff]/60" />
                    </div>
                  )}
                  <div className="flex gap-4 py-2">
                    {/* Dot + line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${cfg.bg} border`}>
                        {cfg.icon}
                      </div>
                      {i < filtered.length - 1 && <div className="w-px flex-1 bg-[#f0f9ff]/60 my-1" />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="bg-white border border-[#dbeafe] rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1">
                            <p className="text-sm text-[#1e3a5f] leading-relaxed">{e.action}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {e.complaint_number && (
                                <Link href={`/complaints/${e.complaint_id}`}
                                  className="font-mono text-[#1d4ed8] text-xs font-bold hover:underline">
                                  {e.complaint_number}
                                </Link>
                              )}
                              {e.customer_name && <span className="text-xs text-[#1e3a5f]">{e.customer_name}</span>}
                              {e.severity && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${SEV_PILL[e.severity] ?? 'bg-[#f0f9ff]/40 text-[#1e3a5f] border-[#dbeafe]'}`}>
                                  {e.severity}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1.5 justify-end mb-1">
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-[#1e3a5f]">
                                {(e.performed_by ?? 'S')[0].toUpperCase()}
                              </div>
                              <span className="text-xs text-[#1e3a5f]">{e.performed_by || 'System'}</span>
                            </div>
                            <span className="text-xs text-[#1e3a5f]">{timeAgo(e.performed_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
