'use client';
import { useState, useEffect } from 'react';

interface ReportData {
  total: number; open: number; closed: number; critical: number; inProgress: number; ppm: number;
  trend: { month: string; opened: number; closed: number }[];
  pareto: { defect_category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recentOpen: {
    id: string; complaint_number: string; customer_name: string;
    part_name: string; severity: string; status: string;
    created_at: string; defect_description: string;
  }[];
}

const SEV_COLOR: Record<string, string> = {
  Critical: 'bg-red-600', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-green-500',
};
const SEV_TEXT: Record<string, string> = {
  Critical: 'text-red-700 bg-red-50 border-red-200',
  High: 'text-orange-700 bg-orange-50 border-orange-200',
  Medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  Low: 'text-green-700 bg-green-50 border-green-200',
};
const STATUS_COLOR: Record<string, string> = {
  Open: 'bg-red-500', 'Under Investigation': 'bg-orange-500',
  'CAPA In Progress': 'bg-blue-500', 'Pending Verification': 'bg-purple-500',
  'Pending Closure': 'bg-indigo-500', Closed: 'bg-green-600', Cancelled: 'bg-gray-400',
};
const PARETO_COLORS = ['bg-red-600','bg-orange-500','bg-yellow-500','bg-blue-500','bg-purple-500','bg-gray-400'];

function KPICard({ icon, label, value, sub, borderColor, textColor }: {
  icon: string; label: string; value: string | number; sub?: string; borderColor: string; textColor: string;
}) {
  return (
    <div className={`rounded-xl border-2 ${borderColor} bg-white p-4 flex items-start gap-3 shadow-sm`}>
      <div className="text-2xl mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, colorClass }: {
  data: any[]; labelKey: string; valueKey: string; colorClass: (item: any, i: number) => string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-36 truncate shrink-0">{item[labelKey]}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
            <div
              className={`h-6 rounded-full flex items-center justify-end pr-2 transition-all ${colorClass(item, i)}`}
              style={{ width: `${Math.max((item[valueKey] / max) * 100, 8)}%` }}
            >
              <span className="text-white text-xs font-bold">{item[valueKey]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: { month: string; opened: number; closed: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.opened, d.closed]), 1);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const label = (m: string) => { const [, mo] = m.split('-'); return MONTHS[parseInt(mo) - 1] ?? m; };
  return (
    <div className="flex items-end gap-3 h-36 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
            <div className="flex-1 bg-red-400 rounded-t min-h-[4px]" style={{ height: `${(d.opened / max) * 100}%` }} title={`Opened: ${d.opened}`} />
            <div className="flex-1 bg-green-500 rounded-t min-h-[4px]" style={{ height: `${(d.closed / max) * 100}%` }} title={`Closed: ${d.closed}`} />
          </div>
          <span className="text-xs text-gray-400">{label(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview'|'trend'|'pareto'|'open'>('overview');

  const load = () => {
    setLoading(true);
    fetch('/api/reports').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">📊</div>
        <p className="text-gray-500 font-medium">Loading quality data...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center">
      <p className="text-red-500 font-semibold">⚠️ Could not load data. Check your connection and try again.</p>
      <button onClick={load} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Retry</button>
    </div>
  );

  const closureRate = data.total > 0 ? Math.round((data.closed / data.total) * 100) : 0;
  const ppmBand = data.ppm < 50 ? { label: '🟢 Excellent', cls: 'bg-green-100 text-green-700' }
    : data.ppm < 200 ? { label: '🟡 Monitor', cls: 'bg-yellow-100 text-yellow-700' }
    : { label: '🔴 Action Needed', cls: 'bg-red-100 text-red-700' };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Quality Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Live quality KPIs — your real Supabase data</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon="📋" label="Total" value={data.total} sub="All complaints" borderColor="border-blue-200" textColor="text-blue-700" />
        <KPICard icon="🔴" label="Open" value={data.open} sub={`${100 - closureRate}% open rate`} borderColor="border-red-200" textColor="text-red-600" />
        <KPICard icon="✅" label="Closed" value={data.closed} sub={`${closureRate}% closure rate`} borderColor="border-green-200" textColor="text-green-700" />
        <KPICard icon="🚨" label="Critical" value={data.critical} sub="Urgent action" borderColor="border-orange-200" textColor="text-orange-600" />
        <KPICard icon="🔧" label="In Progress" value={data.inProgress} sub="Under CAPA" borderColor="border-purple-200" textColor="text-purple-700" />
        <KPICard icon="📉" label="PPM" value={data.ppm.toLocaleString()} sub={ppmBand.label} borderColor="border-indigo-200" textColor="text-indigo-700" />
      </div>

      {/* PPM Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-700">Customer PPM Performance</p>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${ppmBand.cls}`}>{data.ppm} PPM — {ppmBand.label}</span>
        </div>
        <div className="flex h-6 rounded-full overflow-hidden text-xs font-bold">
          <div className="bg-green-500 text-white flex items-center justify-center" style={{width:'33%'}}>0–50 ✅ Excellent</div>
          <div className="bg-yellow-500 text-white flex items-center justify-center" style={{width:'33%'}}>50–200 ⚠️ Monitor</div>
          <div className="bg-red-500 text-white flex items-center justify-center" style={{width:'34%'}}>200+ 🚨 Action</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([['overview','📈 Overview'],['trend','📅 Monthly Trend'],['pareto','📊 Pareto'],['open','🔴 Open List']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4">🚦 By Severity</h3>
            {data.bySeverity.length === 0
              ? <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
              : <BarChart data={data.bySeverity} labelKey="severity" valueKey="count" colorClass={(item) => SEV_COLOR[item.severity] ?? 'bg-gray-400'} />}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4">📋 By Status</h3>
            {data.byStatus.length === 0
              ? <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
              : <BarChart data={data.byStatus} labelKey="status" valueKey="count" colorClass={(item) => STATUS_COLOR[item.status] ?? 'bg-gray-400'} />}
          </div>
          <div className="bg-blue-950 rounded-xl p-5 text-white md:col-span-2">
            <h3 className="font-semibold mb-4">🏆 Executive Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { val: `${closureRate}%`, label: 'Closure Rate', color: closureRate >= 80 ? 'text-green-400' : 'text-yellow-400' },
                { val: data.critical, label: 'Critical Open', color: data.critical > 0 ? 'text-red-400' : 'text-green-400' },
                { val: data.inProgress, label: 'Under CAPA', color: 'text-yellow-400' },
                { val: `${data.ppm}`, label: 'Customer PPM', color: data.ppm < 50 ? 'text-green-400' : data.ppm < 200 ? 'text-yellow-400' : 'text-red-400' },
              ].map((s, i) => (
                <div key={i}>
                  <p className={`text-4xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-blue-300 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trend Tab */}
      {tab === 'trend' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Monthly Complaint Trend — Last 6 Months</h3>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block"/>Opened</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/>Closed</span>
            </div>
          </div>
          {data.trend.length === 0
            ? <p className="text-gray-400 text-sm text-center py-16">No trend data yet — add complaints to see monthly trends</p>
            : <>
                <TrendChart data={data.trend} />
                <div className="mt-4 rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="text-left px-4 py-2 text-gray-600">Month</th>
                      <th className="text-center px-4 py-2 text-red-600">Opened</th>
                      <th className="text-center px-4 py-2 text-green-700">Closed</th>
                      <th className="text-center px-4 py-2 text-gray-600">Net</th>
                    </tr></thead>
                    <tbody>
                      {data.trend.map((row, i) => {
                        const net = row.opened - row.closed;
                        return (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{row.month}</td>
                            <td className="text-center px-4 py-2 text-red-600 font-bold">{row.opened}</td>
                            <td className="text-center px-4 py-2 text-green-700 font-bold">{row.closed}</td>
                            <td className={`text-center px-4 py-2 font-bold ${net > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {net > 0 ? `+${net}` : net}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>}
        </div>
      )}

      {/* Pareto Tab */}
      {tab === 'pareto' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-1">Pareto Analysis — Top Defect Categories</h3>
          <p className="text-xs text-gray-400 mb-5">80% of defects come from 20% of causes. Focus CAPA on the top bars first.</p>
          {data.pareto.length === 0
            ? <p className="text-gray-400 text-sm text-center py-16">No defect category data yet</p>
            : <>
                <BarChart data={data.pareto} labelKey="defect_category" valueKey="count" colorClass={(_, i) => PARETO_COLORS[i] ?? 'bg-gray-400'} />
                {data.pareto[0] && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    💡 <strong>Recommendation:</strong> Priority action on <strong>{data.pareto[0].defect_category}</strong> — highest frequency defect ({data.pareto[0].count} occurrences).
                  </div>
                )}
              </>}
        </div>
      )}

      {/* Open List Tab */}
      {tab === 'open' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-red-50 border-b border-red-100">
            <h3 className="font-semibold text-red-800">🔴 Open Complaints — Priority Order</h3>
            <p className="text-xs text-red-500 mt-0.5">Sorted: Critical first → then by age (oldest = highest priority)</p>
          </div>
          {data.recentOpen.length === 0
            ? <p className="text-gray-400 text-center py-16 text-sm">🎉 No open complaints — great work!</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Complaint #','Customer','Part','Defect','Severity','Status','Date',''].map((h,i) => (
                        <th key={i} className="px-4 py-3 text-left text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOpen.map((c, i) => (
                      <tr key={c.id} className={`border-t hover:bg-gray-50 ${i === 0 && c.severity === 'Critical' ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-blue-700 font-semibold">{c.complaint_number}</td>
                        <td className="px-4 py-3 font-medium">{c.customer_name}</td>
                        <td className="px-4 py-3 text-gray-600">{c.part_name}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.defect_description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_TEXT[c.severity] ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>{c.severity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{c.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{c.created_at?.slice(0,10)}</td>
                        <td className="px-4 py-3">
                          <a href={`/complaints/${c.id}`} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap">Open →</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </div>
      )}
    </div>
  );
}
