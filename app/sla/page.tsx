'use client';
import { useState, useEffect, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';

// -- Types ---------------------------------------------------------------------
interface SLARecord {
  id: string;
  complaint_number: string;
  customer_name: string;
  severity: string;
  status: string;
  created_at: string;
  assigned_to: string;
  defect_category: string;
  sla_days: number;
  days_open: number;
  days_remaining: number;
  sla_status: 'breached' | 'warning' | 'caution' | 'on_track' | 'closed';
  pct_used: number;
  target_close_date: string;
}

interface SLASummary { total: number; breached: number; warning: number; caution: number; on_track: number; }

const SLA_DAYS_DEF: Record<string, number> = { Critical: 7, High: 14, Medium: 30, Low: 45 };

const STATUS_CONFIG = {
  breached: { label: 'SLA Breached',     color: 'text-red-700',    bg: 'bg-red-100 border-red-300',    dot: 'bg-red-500',    bar: 'bg-red-500' },
  warning:  { label: 'Warning (<25%)',   color: 'text-orange-600', bg: 'bg-orange-100 border-orange-300', dot: 'bg-orange-400', bar: 'bg-orange-400' },
  caution:  { label: 'Caution (<50%)',   color: 'text-yellow-300', bg: 'bg-yellow-900/30 border-yellow-300',  dot: 'bg-yellow-400', bar: 'bg-yellow-400' },
  on_track: { label: 'On Track',         color: 'text-green-300',  bg: 'bg-green-900/30 border-green-700/50',   dot: 'bg-green-400',  bar: 'bg-green-500' },
  closed:   { label: 'Closed',           color: 'text-[#1e3a5f]',   bg: 'bg-[#f0f9ff]/40 border-[#dbeafe]',    dot: 'bg-gray-300',   bar: 'bg-gray-300' },
};

const SEV_PILL: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-300',
  High:     'bg-orange-100 text-orange-600 border-orange-300',
  Medium:   'bg-yellow-100 text-yellow-300 border-yellow-300',
  Low:      'bg-green-100 text-[#15803d] border-green-300',
};

// -- SLA Progress Bar ----------------------------------------------------------
function SLABar({ pct, status }: { pct: number; status: SLARecord['sla_status'] }) {
  const cfg = STATUS_CONFIG[status];
  const w   = Math.min(pct, 100);
  return (
      <>
      <PageTitle title="SLA Tracker" />
      <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#f0f9ff]/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${w}%` }} />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${cfg.color}`}>{pct}%</span>
    </div>
      </>
  );
}

// -- Countdown text ------------------------------------------------------------
function Countdown({ r }: { r: SLARecord }) {
  if (r.sla_status === 'breached') {
    return <span className="text-red-600 font-bold text-xs">⚠️ BREACHED {Math.abs(r.days_remaining)}d ago</span>;
  }
  return (
    <span className={`font-bold text-xs ${r.sla_status === 'warning' ? 'text-orange-600' : r.sla_status === 'caution' ? 'text-yellow-600' : 'text-green-600'}`}>
      {r.days_remaining}d left
    </span>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function SLAPage() {
  const [records, setRecords]   = useState<SLARecord[]>([]);
  const [summary, setSummary]   = useState<SLASummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'all' | SLARecord['sla_status']>('all');
  const [alertSent, setAlertSent] = useState(false);
  const [alerting, setAlerting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/sla');
      const d = await r.json();
      setRecords(d.records ?? []);
      setSummary(d.summary ?? null);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendAlert = async () => {
    setAlerting(true);
    try {
      await fetch('/api/sla?alert=true');
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 4000);
    } catch { /* ignore */ }
    setAlerting(false);
  };

  const filtered = filter === 'all' ? records : records.filter(r => r.sla_status === filter);

  const kpiTiles = [
    { key: 'breached', label: 'SLA Breached',  icon: '🚨', cls: 'border-red-300 bg-red-50 text-red-700' },
    { key: 'warning',  label: 'Warning Zone',  icon: '⚠️', cls: 'border-orange-300 bg-orange-900/30 text-orange-600' },
    { key: 'caution',  label: 'Caution Zone',  icon: '⏰', cls: 'border-yellow-300 bg-yellow-900/30 text-yellow-300' },
    { key: 'on_track', label: 'On Track',      icon: '✅', cls: 'border-green-300 bg-green-900/30 text-green-300' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Alert toast */}
      {alertSent && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold">
          ✅ Escalation alert sent to Quality Head
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">⏰ SLA Tracker</h1>
            <p className="text-sm text-[#1e3a5f] mt-0.5">
              Response time compliance — IATF 16949 Cl. 10.2.3 &amp; customer-specific response SLAs
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={fetchData} className="px-3 py-1.5 border border-[#dbeafe] rounded-lg text-xs text-[#1e3a5f] hover:bg-white/[0.03] transition">
              ↻ Refresh
            </button>
            <button onClick={sendAlert} disabled={alerting}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-60">
              {alerting ? 'Sending…' : '📧 Send Escalation Email'}
            </button>
            <Link href="/complaints" className="px-3 py-1.5 border border-[#dbeafe] rounded-lg text-xs text-[#1e3a5f] hover:bg-white/[0.03] transition">
              ← All Complaints
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* SLA Reference */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(SLA_DAYS_DEF).map(([sev, days]) => (
            <div key={sev} className={`rounded-xl border-2 p-3 ${SEV_PILL[sev].replace('text-','border-').split(' ')[0]} bg-white`}>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${SEV_PILL[sev]}`}>{sev}</span>
              <p className="text-2xl font-black text-[#1e3a5f] mt-1">{days}d</p>
              <p className="text-xs text-[#1e3a5f]">target closure</p>
            </div>
          ))}
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiTiles.map(k => (
            <button key={k.key} onClick={() => setFilter(filter === k.key ? 'all' : k.key)}
              className={`${k.cls} border-2 rounded-xl p-4 text-left hover:shadow-md transition ${filter === k.key ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
              <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">{k.icon} {k.label}</p>
              <p className={`text-3xl font-bold mt-1 ${k.cls.split(' ').find(c => c.startsWith('text-'))}`}>
                {loading ? '—' : summary?.[k.key] ?? 0}
              </p>
            </button>
          ))}
        </div>

        {/* IATF note */}
        <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl px-5 py-3 flex gap-3 items-start">
          <span className="text-xl mt-0.5">📋</span>
          <div className="text-sm text-blue-200 space-y-1">
            <p className="font-bold">IATF 16949 §10.2.3 — Response Time Requirements</p>
            <p className="text-[#1d4ed8]">Customer complaints must be acknowledged within 24h and initial containment within 48h. Full 8D closure targets depend on severity. SLA breach = potential Customer Specific Requirement (CSR) violation — escalate immediately.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-[#1e3a5f]">Filter:</span>
          {(['all', 'breached', 'warning', 'caution', 'on_track'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-[#dbeafe] text-[#1e3a5f] hover:bg-white/[0.03]'
              }`}>
              {f === 'all' ? `All (${records.length})` : `${STATUS_CONFIG[f].label} (${summary?.[f] ?? 0})`}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-[#1e3a5f] text-sm">Loading SLA data…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#dbeafe] p-16 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-[#1e3a5f]">
              {filter === 'all' ? 'No open complaints — all clear!' : `No complaints in "${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label}" status`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#eff6ff] border-b">
                  <tr>
                    {['Complaint','Customer','Severity','Status','SLA Target','Days Open','Time Left','Progress','Assigned',''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(r => {
                    const cfg = STATUS_CONFIG[r.sla_status];
                    const targetDate = new Date(r.target_close_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    return (
                      <tr key={r.id} className={`hover:bg-white/[0.03] ${r.sla_status === 'breached' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <Link href={`/complaints/${r.id}`} className="font-mono text-[#1d4ed8] font-bold hover:underline whitespace-nowrap">
                            {r.complaint_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1e3a5f] whitespace-nowrap">{r.customer_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_PILL[r.severity] ?? 'bg-[#f0f9ff]/40 text-[#1e3a5f] border-[#dbeafe]'}`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#1e3a5f] whitespace-nowrap">
                          <div>{r.sla_days}d</div>
                          <div className="text-xs text-[#1e3a5f]">by {targetDate}</div>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${r.sla_status === 'breached' ? 'text-red-600' : 'text-[#1e3a5f]'}`}>
                          {r.days_open}d
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Countdown r={r} />
                        </td>
                        <td className="px-4 py-3 min-w-[120px]">
                          <SLABar pct={r.pct_used} status={r.sla_status} />
                        </td>
                        <td className="px-4 py-3 text-[#1e3a5f] whitespace-nowrap">{r.assigned_to || '—'}</td>
                        <td className="px-4 py-3">
                          <Link href={`/complaints/${r.id}`}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap">
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-[#eff6ff] border-t border-[#dbeafe] text-xs text-[#1e3a5f]">
              Showing {filtered.length} open complaints · SLA targets: Critical 7d · High 14d · Medium 30d · Low 45d
            </div>
          </div>
        )}

        {/* Assigned-to breakdown */}
        {records.filter(r => r.sla_status === 'breached' || r.sla_status === 'warning').length > 0 && (
          <div className="bg-red-50 border border-red-700/50 rounded-xl p-5">
            <h3 className="font-bold text-red-800 mb-3 text-sm">🚨 Immediate Action Required</h3>
            <div className="space-y-2">
              {records
                .filter(r => r.sla_status === 'breached' || r.sla_status === 'warning')
                .sort((a, b) => a.days_remaining - b.days_remaining)
                .map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-white border border-red-100 rounded-lg px-4 py-2.5">
                    <Link href={`/complaints/${r.id}`} className="font-mono text-[#1d4ed8] font-bold text-sm hover:underline w-32 shrink-0">
                      {r.complaint_number}
                    </Link>
                    <span className="text-[#1e3a5f] flex-1 min-w-0 truncate">{r.customer_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${SEV_PILL[r.severity]}`}>{r.severity}</span>
                    <span className={`text-xs font-bold ${r.sla_status === 'breached' ? 'text-red-600' : 'text-orange-600'}`}>
                      {r.sla_status === 'breached' ? `BREACHED ${Math.abs(r.days_remaining)}d` : `${r.days_remaining}d left`}
                    </span>
                    <span className="text-xs text-[#1e3a5f] shrink-0">{r.assigned_to || 'Unassigned'}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
