'use client';
import { useQualityKPIs } from '../hooks/useQualityKPIs';

// -- LiveKPIBanner -------------------------------------------------------------
// Renders a strip of real-time KPI tiles pulled from Supabase complaints data.
// Usage: <LiveKPIBanner />  — drop anywhere at the top of a dashboard page.
// -----------------------------------------------------------------------------

interface Tile {
  label: string;
  value: string | number;
  sub?: string;
  color: string;   // tailwind text colour class
  bg: string;      // tailwind bg colour class
  border: string;  // tailwind border colour class
}

export default function LiveKPIBanner() {
  const { data, loading, error } = useQualityKPIs();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-[#dbeafe] text-xs text-[#1e3a5f] animate-pulse">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping inline-block"/>
        Loading live quality data from Supabase…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-600">
        <span>⚠️</span>
        <span>Live data unavailable — showing sample data. ({error ?? 'No data returned'})</span>
      </div>
    );
  }

  const { overview } = data;

  const tiles: Tile[] = [
    {
      label: 'Total Complaints',
      value: overview.total,
      sub: 'all time',
      color: 'text-[#1e3a5f]',
      bg: 'bg-white',
      border: 'border-[#dbeafe]',
    },
    {
      label: 'Open',
      value: overview.open,
      sub: 'require action',
      color: overview.open > 0 ? 'text-amber-600' : 'text-emerald-600',
      bg: overview.open > 0 ? 'bg-amber-950/40' : 'bg-emerald-950/30',
      border: overview.open > 0 ? 'border-amber-200' : 'border-emerald-700/50',
    },
    {
      label: 'Critical',
      value: overview.critical,
      sub: 'open & critical',
      color: overview.critical > 0 ? 'text-red-600' : 'text-emerald-600',
      bg: overview.critical > 0 ? 'bg-red-50' : 'bg-emerald-950/30',
      border: overview.critical > 0 ? 'border-red-700/50' : 'border-emerald-700/50',
    },
    {
      label: 'Customer PPM',
      value: overview.ppm > 0 ? overview.ppm.toLocaleString() : '—',
      sub: overview.totalSupplied > 0 ? `from ${overview.totalSupplied.toLocaleString()} supplied` : 'no supply data',
      color: overview.ppm > 1000 ? 'text-red-600' : overview.ppm > 500 ? 'text-amber-600' : overview.ppm > 0 ? 'text-emerald-600' : 'text-[#1e3a5f]',
      bg: 'bg-[#eff6ff]',
      border: 'border-blue-700/50',
    },
    {
      label: 'Closed',
      value: overview.closed,
      sub: `${overview.total > 0 ? Math.round(overview.closed / overview.total * 100) : 0}% closure rate`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-700/50',
    },
    {
      label: 'In Progress',
      value: overview.inProgress,
      sub: '8D / CAPA running',
      color: 'text-blue-600',
      bg: 'bg-[#eff6ff]',
      border: 'border-blue-700/50',
    },
  ];

  const ago = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="space-y-2">
      {/* Live badge */}
      <div className="flex items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-700/50 text-[#15803d] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
          LIVE DATA — Supabase
        </span>
        <span className="text-[#1e3a5f]">Fetched at {ago}</span>
        <span className="text-[#1e3a5f]">·</span>
        <span className="text-[#1e3a5f]">{overview.total} complaints in database</span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {tiles.map(t => (
          <div key={t.label} className={`rounded-xl border px-4 py-3 ${t.bg} ${t.border}`}>
            <div className={`text-xl font-black tabular-nums ${t.color}`}>{t.value}</div>
            <div className="text-xs font-semibold text-[#1e3a5f] mt-0.5">{t.label}</div>
            {t.sub && <div className="text-[#1e3a5f] leading-tight" style={{fontSize:'10px'}}>{t.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
