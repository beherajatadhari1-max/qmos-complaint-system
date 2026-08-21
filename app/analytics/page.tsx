'use client';
import { useState, useEffect, useMemo } from 'react';
import PageTitle from '../components/PageTitle';

// --- TYPES --------------------------------------------------------------------
interface OpenComplaint {
  id: string; complaint_number: string; customer_name: string; customer?: string;
  part_name: string; severity: string; status: string; created_at: string;
  defect_category?: string; defect_description?: string;
}
interface ReportData {
  total: number; open: number; closed: number; critical: number; inProgress: number; ppm: number;
  trend: { month: string; opened: number; closed: number }[];
  pareto: { defect_category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recentOpen: (OpenComplaint & { defect_description: string })[];
  allOpen: OpenComplaint[];
}

// --- CONSTANTS ----------------------------------------------------------------
const SEV_COLOR: Record<string, string> = {
  Critical: 'bg-red-600', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-green-500',
};
const SEV_TEXT: Record<string, string> = {
  Critical: 'text-red-600 bg-red-50 border-red-700/50',
  High: 'text-orange-600 bg-orange-950/40 border-orange-700/50',
  Medium: 'text-yellow-300 bg-yellow-950/40 border-yellow-700/50',
  Low: 'text-[#15803d] bg-green-950/40 border-green-700/50',
};
const STATUS_COLOR: Record<string, string> = {
  Open: 'bg-red-500', 'Under Investigation': 'bg-orange-500',
  'CAPA In Progress': 'bg-blue-500', 'Pending Verification': 'bg-purple-500',
  'Pending Closure': 'bg-indigo-500', Closed: 'bg-green-600', Cancelled: 'bg-gray-400',
};
const PARETO_COLORS = ['bg-red-600','bg-orange-500','bg-yellow-500','bg-blue-500','bg-purple-500','bg-gray-400'];

const SEV_SCORE: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const AGE_BANDS = [
  { label: '0–7 days',   min: 0,  max: 7,   score: 1 },
  { label: '8–14 days',  min: 8,  max: 14,  score: 2 },
  { label: '15–30 days', min: 15, max: 30,  score: 3 },
  { label: '31–60 days', min: 31, max: 60,  score: 4 },
  { label: '60+ days',   min: 61, max: 9999, score: 5 },
];
const SEV_COLS = ['Low','Medium','High','Critical'] as const;

function riskScore(sev: string, ageScore: number) {
  return (SEV_SCORE[sev] ?? 1) * ageScore;
}
function riskZone(score: number): { zone: string; cell: string; text: string } {
  if (score >= 13) return { zone: 'Critical Risk', cell: 'bg-red-50 border-red-600/60',       text: 'text-red-600' };
  if (score >= 9)  return { zone: 'High Risk',     cell: 'bg-orange-950/60 border-orange-600/60', text: 'text-orange-600' };
  if (score >= 5)  return { zone: 'Medium Risk',   cell: 'bg-yellow-950/50 border-yellow-600/50', text: 'text-yellow-300' };
  return               { zone: 'Low Risk',      cell: 'bg-green-950/40 border-green-700/50',  text: 'text-green-300' };
}
function daysOpen(created_at: string): number {
  return Math.floor((Date.now() - new Date(created_at).getTime()) / 86_400_000);
}
function ageBandIndex(days: number): number {
  return AGE_BANDS.findIndex(b => days >= b.min && days <= b.max);
}

// --- AI RISK NARRATIVE --------------------------------------------------------
function buildRiskNarrative(allOpen: OpenComplaint[]): string {
  if (!allOpen.length) return 'No open complaints — plant is in Green status. Maintain current controls.';

  const critRisk = allOpen.filter(c => {
    const days = daysOpen(c.created_at);
    return riskScore(c.severity, AGE_BANDS[ageBandIndex(days)]?.score ?? 5) >= 13;
  });
  const highRisk = allOpen.filter(c => {
    const days = daysOpen(c.created_at);
    const rs = riskScore(c.severity, AGE_BANDS[ageBandIndex(days)]?.score ?? 5);
    return rs >= 9 && rs < 13;
  });
  const oldCritical = allOpen.filter(c => c.severity === 'Critical' && daysOpen(c.created_at) > 14);

  let narrative = '';
  if (critRisk.length > 0) {
    narrative += `🔴 CRITICAL ZONE: ${critRisk.length} complaint${critRisk.length > 1 ? 's' : ''} in the Critical Risk quadrant. `;
    narrative += `These are high-severity, long-aged complaints requiring immediate Quality Head escalation and daily review. `;
  }
  if (highRisk.length > 0) {
    narrative += `🟠 HIGH RISK: ${highRisk.length} complaint${highRisk.length > 1 ? 's' : ''} in the High Risk zone — escalate to Quality Manager and set 48-hour action targets. `;
  }
  if (oldCritical.length > 0) {
    narrative += `⚠️ IATF FLAG: ${oldCritical.length} Critical complaint${oldCritical.length > 1 ? 's' : ''} open >14 days — violates IATF 10.2 corrective action timelines. Prepare objective evidence for next audit. `;
  }
  if (!critRisk.length && !highRisk.length) {
    narrative += `🟢 No complaints in Critical or High Risk zones. `;
  }
  const avgAge = Math.round(allOpen.reduce((s, c) => s + daysOpen(c.created_at), 0) / allOpen.length);
  narrative += `Average complaint age: ${avgAge} days. `;
  if (avgAge > 21) {
    narrative += `Average age exceeds 21-day IATF benchmark — review CAPA pace and resource allocation.`;
  } else {
    narrative += `Average age within acceptable range — maintain current closure momentum.`;
  }
  return narrative;
}

// --- RISK MATRIX COMPONENT ----------------------------------------------------
function RiskMatrix({ allOpen }: { allOpen: OpenComplaint[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Map complaints to matrix cells: [ageBandIdx][sevColIdx] → complaints[]
  const cells = useMemo(() => {
    const grid: OpenComplaint[][][] = AGE_BANDS.map(() => SEV_COLS.map(() => []));
    for (const c of allOpen) {
      const days = daysOpen(c.created_at);
      const ai = ageBandIndex(days);
      const si = SEV_COLS.indexOf(c.severity as typeof SEV_COLS[number]);
      if (ai >= 0 && si >= 0) grid[ai][si].push(c);
    }
    return grid;
  }, [allOpen]);

  const narrative = useMemo(() => buildRiskNarrative(allOpen), [allOpen]);

  // Top 5 highest-risk complaints
  const topRisk = useMemo(() => [...allOpen]
    .map(c => {
      const days = daysOpen(c.created_at);
      const ai = ageBandIndex(days);
      const rs = riskScore(c.severity, AGE_BANDS[ai]?.score ?? 5);
      return { ...c, days, rs };
    })
    .sort((a, b) => b.rs - a.rs)
    .slice(0, 5), [allOpen]);

  if (!allOpen.length) {
    return (
      <>
      <PageTitle title="Analytics" />
      <div className="text-center py-20 text-[#1e3a5f]">
        <p className="text-5xl mb-3">🟢</p>
        <p className="font-semibold text-[#15803d] text-lg">No open complaints — plant is clear!</p>
        <p className="text-sm mt-1">Risk Matrix will populate as complaints are logged.</p>
      </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Narrative */}
      <div className="bg-white rounded-xl border border-amber-500/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <span className="text-sm font-bold text-amber-600 tracking-wide">AI RISK ASSESSMENT</span>
          <span className="text-xs bg-amber-500/20 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-full">IATF-AWARE</span>
        </div>
        <p className="text-[#1e3a5f] text-sm leading-relaxed">{narrative}</p>
      </div>

      {/* Matrix */}
      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
        <div className="p-4 border-b border-[#dbeafe] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-[#1e3a5f]">🎯 Quality Risk Matrix — Open Complaints</h3>
            <p className="text-xs text-[#1e3a5f] mt-0.5">Each dot = one complaint. Hover to preview. Click to open.</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {[['bg-green-900/40 border-green-600','Low Risk'],['bg-yellow-900/40 border-yellow-600','Medium'],['bg-orange-900/40 border-orange-600','High'],['bg-red-50 border-red-600','Critical']].map(([cls, label]) => (
              <span key={label} className={`flex items-center gap-1 px-2 py-0.5 rounded border ${cls}`}>
                <span className="font-semibold text-[#1e3a5f]">{label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          {/* Column headers (X = Severity) */}
          <div className="flex mb-1 ml-24">
            {SEV_COLS.map(s => (
              <div key={s} className="flex-1 text-center text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">{s}</div>
            ))}
          </div>
          {/* X-axis label */}
          <div className="flex mb-2 ml-24">
            {SEV_COLS.map((_, i, arr) => (
              <div key={i} className="flex-1 flex justify-center">
                {i === Math.floor(arr.length / 2) && (
                  <span className="text-[10px] text-[#1e3a5f]">← Severity →</span>
                )}
              </div>
            ))}
          </div>

          {/* Grid rows (Y = Age, highest at top) */}
          {[...AGE_BANDS].reverse().map((band, rowRevIdx) => {
            const rowIdx = AGE_BANDS.length - 1 - rowRevIdx;
            return (
              <div key={band.label} className="flex items-stretch mb-1 gap-1">
                {/* Y-axis label */}
                <div className="w-24 shrink-0 flex items-center justify-end pr-2">
                  <span className="text-[10px] text-[#1e3a5f] font-medium text-right leading-tight">{band.label}</span>
                </div>
                {/* Cells */}
                {SEV_COLS.map((sev, colIdx) => {
                  const cellComplaints = cells[rowIdx][colIdx];
                  const score = (SEV_SCORE[sev] ?? 1) * band.score;
                  const { cell } = riskZone(score);
                  return (
                    <div key={sev}
                      className={`flex-1 min-h-[72px] rounded-lg border-2 ${cell} p-1.5 flex flex-wrap gap-1 items-start content-start`}>
                      {cellComplaints.map(c => (
                        <div key={c.id} className="relative group">
                          <a href={`/complaints/${c.id}`}
                            onMouseEnter={() => setHovered(c.id)}
                            onMouseLeave={() => setHovered(null)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-md cursor-pointer hover:scale-125 transition-transform"
                            style={{ background: c.severity === 'Critical' ? '#dc2626' : c.severity === 'High' ? '#ea580c' : c.severity === 'Medium' ? '#ca8a04' : '#16a34a' }}>
                            {c.complaint_number?.slice(-2) ?? '?'}
                          </a>
                          {/* Tooltip */}
                          {hovered === c.id && (
                            <div className="absolute z-50 bottom-8 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-xs rounded-lg p-2.5 w-44 shadow-xl pointer-events-none">
                              <p className="font-bold text-[#1d4ed8]">{c.complaint_number}</p>
                              <p className="text-[#1e3a5f] mt-0.5">{c.customer_name}</p>
                              <p className="text-[#1e3a5f] text-[10px]">{c.part_name}</p>
                              <div className="flex items-center gap-1 mt-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.severity === 'Critical' ? 'bg-red-700' : c.severity === 'High' ? 'bg-orange-700' : c.severity === 'Medium' ? 'bg-yellow-700' : 'bg-green-700'}`}>{c.severity}</span>
                                <span className="text-[#1e3a5f] text-[10px]">{daysOpen(c.created_at)}d open</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {/* Y-axis label */}
          <div className="ml-24 mt-1 text-[10px] text-[#1e3a5f] text-center">← Age (Days Open) ↑</div>
        </div>
      </div>

      {/* Top Risk Complaints Table */}
      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#dbeafe] bg-red-50">
          <h3 className="font-bold text-red-800 text-sm">🔥 Top 5 Highest-Risk Complaints — Immediate Action Required</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#eff6ff]">
            <tr>
              {['Rank','Complaint #','Customer','Part','Severity','Age','Risk Score','Action'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#1e3a5f] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topRisk.map((c, i) => {
              const { zone, text } = riskZone(c.rs);
              return (
                <tr key={c.id} className="border-t hover:bg-[#eff6ff]">
                  <td className="px-4 py-3 font-bold text-[#1e3a5f]">#{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-[#1d4ed8] font-semibold">{c.complaint_number}</td>
                  <td className="px-4 py-3 font-medium text-[#1e3a5f]">{c.customer_name}</td>
                  <td className="px-4 py-3 text-[#1e3a5f]">{c.part_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_TEXT[c.severity] ?? 'bg-[#eff6ff] border-[#dbeafe] text-[#1e3a5f]'}`}>{c.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-[#1e3a5f]">{c.days}d</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${text} ${zone.includes('Critical') ? 'bg-red-50' : zone.includes('High') ? 'bg-orange-900/40' : zone.includes('Medium') ? 'bg-yellow-900/30' : 'bg-green-900/30'}`}>
                      {c.rs}/20 — {zone}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/complaints/${c.id}`} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap">Open →</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SIMPLE CHART COMPONENTS --------------------------------------------------
function KPICard({ icon, label, value, sub, borderColor, textColor }: {
  icon: string; label: string; value: string | number; sub?: string; borderColor: string; textColor: string;
}) {
  return (
    <div className={`rounded-xl border-2 ${borderColor} bg-white p-3 flex flex-col gap-1 shadow-sm min-w-0`}>
      <p className="text-[10px] font-semibold text-[#1e3a5f] uppercase tracking-wide leading-tight">{label}</p>
      <p className={`text-2xl font-bold ${textColor} leading-none`}>{value}</p>
      {sub && <p className="text-[10px] text-[#1e3a5f] leading-tight">{sub}</p>}
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
          <span className="text-xs text-[#1e3a5f] w-36 truncate shrink-0">{item[labelKey]}</span>
          <div className="flex-1 bg-white rounded-full h-6 relative overflow-hidden">
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
          <span className="text-xs text-[#1e3a5f]">{label(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

// --- MAIN PAGE ----------------------------------------------------------------
export default function AnalyticsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview'|'trend'|'pareto'|'open'|'matrix'>('overview');

  const load = () => {
    setLoading(true);
    fetch('/api/reports').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto bg-[#eff6ff] min-h-screen animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-[#f0f9ff]/60" />
        <div className="h-3 w-64 rounded bg-[#f0f9ff]/40" />
      </div>
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#dbeafe] p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-[#f0f9ff]/60" />
            <div className="h-8 w-14 rounded bg-[#f0f9ff]/50" />
            <div className="h-2 w-24 rounded bg-[#f0f9ff]/40" />
          </div>
        ))}
      </div>
      {/* Chart area skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#dbeafe] p-4 space-y-3">
            <div className="h-4 w-32 rounded bg-[#f0f9ff]/60" />
            <div className="h-48 w-full rounded-lg bg-[#f0f9ff]/30" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
        <div className="bg-[#eff6ff] border-b border-[#dbeafe] px-4 py-3 flex gap-6">
          {[90, 80, 70, 90, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-[#f0f9ff]/60" style={{ width: `${w}px` }} />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-[#dbeafe] px-4 py-3 flex gap-6 items-center">
            <div className="h-3 rounded bg-[#f0f9ff]/50" style={{ width: '90px' }} />
            <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '80px' }} />
            <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '70px' }} />
            <div className="h-5 rounded-full bg-[#f0f9ff]/50" style={{ width: '90px' }} />
            <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '60px' }} />
          </div>
        ))}
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
  const ppmBand = data.ppm < 50 ? { label: '🟢 Excellent', cls: 'bg-green-900/40 text-green-300' }
    : data.ppm < 200 ? { label: '🟡 Monitor', cls: 'bg-yellow-900/40 text-yellow-300' }
    : { label: '🔴 Action Needed', cls: 'bg-red-50 text-red-600' };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">📊 Quality Analytics Dashboard</h1>
          <p className="text-[#1e3a5f] text-sm mt-0.5">Live quality KPIs — your real Supabase data</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!data) return;
              const hdr = 'Complaint No,Customer,Severity,Status,Defect Category,Part,Days Open\n';
              const body = (data.allOpen ?? data.recentOpen ?? []).map((c: OpenComplaint) => [
                c.complaint_number ?? '',
                `"${(c.customer_name ?? '').replace(/"/g,'""')}"`,
                c.severity ?? '',
                c.status ?? '',
                `"${(c.defect_category ?? '').replace(/"/g,'""')}"`,
                `"${(c.part_name ?? '').replace(/"/g,'""')}"`,
                c.created_at ? Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000) : '',
              ].join(',')).join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([hdr + body], { type: 'text/csv' }));
              a.download = `analytics_open_complaints_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition">
            📥 Export CSV
          </button>
          <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            🔄 Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="no-print px-4 py-2 bg-[#f0f9ff] hover:bg-[#dbeafe] text-white rounded-lg text-sm font-semibold transition"
            title="Print analytics report">
            🖨 Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 [&>*]:min-w-0">
        <KPICard icon="📋" label="Total" value={data.total} sub="All complaints" borderColor="border-blue-700/50" textColor="text-[#1d4ed8]" />
        <KPICard icon="🔴" label="Open" value={data.open} sub={`${100 - closureRate}% open rate`} borderColor="border-red-700/50" textColor="text-red-600" />
        <KPICard icon="✅" label="Closed" value={data.closed} sub={`${closureRate}% closure rate`} borderColor="border-green-700/50" textColor="text-green-300" />
        <KPICard icon="🚨" label="Critical" value={data.critical} sub="Urgent action" borderColor="border-orange-700/50" textColor="text-orange-400" />
        <KPICard icon="🔧" label="In Progress" value={data.inProgress} sub="Under CAPA" borderColor="border-purple-700/50" textColor="text-purple-300" />
        <KPICard icon="📉" label="PPM" value={data.ppm.toLocaleString()} sub={ppmBand.label} borderColor="border-indigo-700/50" textColor="text-indigo-300" />
      </div>

      {/* PPM Bar */}
      <div className="bg-white rounded-xl border border-[#dbeafe] p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-y-2">
          <p className="font-semibold text-[#1e3a5f]">Customer PPM Performance</p>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${ppmBand.cls}`}>{data.ppm} PPM — {ppmBand.label}</span>
        </div>
        <div className="flex h-6 rounded-full overflow-hidden text-xs font-bold">
          <div className="bg-green-500 text-white flex items-center justify-center" style={{width:'33%'}}>0–50 ✅ Excellent</div>
          <div className="bg-yellow-500 text-white flex items-center justify-center" style={{width:'33%'}}>50–200 ⚠️ Monitor</div>
          <div className="bg-red-600 text-white flex items-center justify-center" style={{width:'34%'}}>200+ 🚨 Action</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto flex gap-1 border-b border-[#dbeafe]">
        {([
          ['overview','📈 Overview'],
          ['trend','📅 Monthly Trend'],
          ['pareto','📊 Pareto'],
          ['open','🔴 Open List'],
          ['matrix','🎯 Risk Matrix'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition whitespace-nowrap ${tab === id ? 'border-blue-600 text-[#1d4ed8]' : 'border-transparent text-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#dbeafe] p-5">
            <h3 className="font-semibold text-[#1e3a5f] mb-4">🚦 By Severity</h3>
            {data.bySeverity.length === 0
              ? <p className="text-[#1e3a5f] text-sm text-center py-8">No data yet</p>
              : <BarChart data={data.bySeverity} labelKey="severity" valueKey="count" colorClass={(item) => SEV_COLOR[item.severity] ?? 'bg-gray-400'} />}
          </div>
          <div className="bg-white rounded-xl border border-[#dbeafe] p-5">
            <h3 className="font-semibold text-[#1e3a5f] mb-4">📋 By Status</h3>
            {data.byStatus.length === 0
              ? <p className="text-[#1e3a5f] text-sm text-center py-8">No data yet</p>
              : <BarChart data={data.byStatus} labelKey="status" valueKey="count" colorClass={(item) => STATUS_COLOR[item.status] ?? 'bg-gray-400'} />}
          </div>
          <div className="bg-[#eff6ff] rounded-xl p-5 md:col-span-2">
            <h3 className="font-semibold text-[#1e3a5f] mb-4">🏆 Executive Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { val: `${closureRate}%`, label: 'Closure Rate', color: closureRate >= 80 ? 'text-green-400' : 'text-yellow-400' },
                { val: data.critical,    label: 'Critical Open', color: data.critical > 0 ? 'text-red-600' : 'text-green-400' },
                { val: data.inProgress,  label: 'Under CAPA', color: 'text-yellow-400' },
                { val: `${data.ppm}`,    label: 'Customer PPM', color: data.ppm < 50 ? 'text-green-600' : data.ppm < 200 ? 'text-yellow-600' : 'text-red-600' },
              ].map((s, i) => (
                <div key={i}>
                  <p className={`text-4xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-[#1d4ed8] text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trend Tab */}
      {tab === 'trend' && (
        <div className="animate-fadeIn bg-white rounded-xl border border-[#dbeafe] p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
            <h3 className="font-semibold text-[#1e3a5f]">Monthly Complaint Trend — Last 6 Months</h3>
            <div className="flex gap-4 text-xs text-[#1e3a5f]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block"/>Opened</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/>Closed</span>
            </div>
          </div>
          {data.trend.length === 0
            ? <p className="text-[#1e3a5f] text-sm text-center py-16">No trend data yet — add complaints to see monthly trends</p>
            : <>
                <TrendChart data={data.trend} />
                <div className="mt-4 rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#eff6ff]"><tr>
                      <th className="text-left px-4 py-2 text-[#1e3a5f]">Month</th>
                      <th className="text-center px-4 py-2 text-red-600">Opened</th>
                      <th className="text-center px-4 py-2 text-green-300">Closed</th>
                      <th className="text-center px-4 py-2 text-[#1e3a5f]">Net</th>
                    </tr></thead>
                    <tbody>
                      {data.trend.map((row, i) => {
                        const net = row.opened - row.closed;
                        return (
                          <tr key={i} className="border-t hover:bg-[#eff6ff]">
                            <td className="px-4 py-2 font-medium text-[#1e3a5f]">{row.month}</td>
                            <td className="text-center px-4 py-2 text-red-600 font-bold">{row.opened}</td>
                            <td className="text-center px-4 py-2 text-[#15803d] font-bold">{row.closed}</td>
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
        <div className="animate-fadeIn bg-white rounded-xl border border-[#dbeafe] p-5">
          <h3 className="font-semibold text-[#1e3a5f] mb-1">Pareto Analysis — Top Defect Categories</h3>
          <p className="text-xs text-[#1e3a5f] mb-5">80% of defects come from 20% of causes. Focus CAPA on the top bars first.</p>
          {data.pareto.length === 0
            ? <p className="text-[#1e3a5f] text-sm text-center py-16">No defect category data yet</p>
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
        <div className="animate-fadeIn bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
          <div className="p-4 bg-red-50 border-b border-red-100">
            <h3 className="font-semibold text-red-800">🔴 Open Complaints — Priority Order</h3>
            <p className="text-xs text-red-500 mt-0.5">Sorted: Critical first → then by age (oldest = highest priority)</p>
          </div>
          {data.recentOpen.length === 0
            ? <p className="text-[#1e3a5f] text-center py-16 text-sm">🎉 No open complaints — great work!</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#eff6ff] border-b">
                    <tr>
                      {['Complaint #','Customer','Part','Defect','Severity','Status','Date',''].map((h,i) => (
                        <th key={i} className="px-4 py-3 text-left text-[#1e3a5f] font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOpen.map((c, i) => (
                      <tr key={c.id} className={`border-t hover:bg-[#eff6ff] ${i === 0 && c.severity === 'Critical' ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-[#1d4ed8] font-semibold">{c.complaint_number}</td>
                        <td className="px-4 py-3 font-medium text-[#1e3a5f]">{c.customer_name}</td>
                        <td className="px-4 py-3 text-[#1e3a5f]">{c.part_name}</td>
                        <td className="px-4 py-3 text-[#1e3a5f] max-w-xs truncate">{c.defect_description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_TEXT[c.severity] ?? 'bg-[#eff6ff] border-[#dbeafe] text-[#1e3a5f]'}`}>{c.severity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-white text-[#1e3a5f]">{c.status}</span>
                        </td>
                        <td className="px-4 py-3 text-[#1e3a5f] whitespace-nowrap">{c.created_at?.slice(0,10)}</td>
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

      {/* Risk Matrix Tab */}
      {tab === 'matrix' && (
        <RiskMatrix allOpen={data.allOpen ?? []} />
      )}
    </div>
  );
}
