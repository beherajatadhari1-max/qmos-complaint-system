'use client';
import { useState, useEffect, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';

// -- Types ---------------------------------------------------------------------
type Tier = 'Critical' | 'High' | 'Medium' | 'Low';

interface CustomerRisk {
  name: string;
  tier: Tier;
  riskScore: number;
  total: number;
  open: number;
  closed: number;
  critical: number;
  ppm: number;
  closureRate: number;
  oldestOpenDays: number;
  recentActivity: string[];
  sparkline: number[];
  narrative: string;
}

interface RiskData {
  customers: CustomerRisk[];
  summary: {
    totalCustomers: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    topRisk: string | null;
  };
  fetchedAt: string;
}

// -- Style maps ----------------------------------------------------------------
const TIER_STYLE: Record<Tier, {
  border: string; badge: string; dot: string; bg: string; text: string; glow: string;
}> = {
  Critical: { border: 'border-red-200',    badge: 'bg-red-500/20 text-red-600',     dot: 'bg-red-400',     bg: 'bg-red-50',    text: 'text-red-600',    glow: '0 0 10px #f87171' },
  High:     { border: 'border-orange-200', badge: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400', bg: 'bg-orange-950/40', text: 'text-orange-600', glow: '0 0 8px #fb923c' },
  Medium:   { border: 'border-amber-500/40',  badge: 'bg-amber-500/20 text-amber-600',   dot: 'bg-amber-400',  bg: 'bg-amber-950/30',  text: 'text-amber-600',  glow: '0 0 6px #fbbf24' },
  Low:      { border: 'border-emerald-500/30',badge: 'bg-emerald-500/15 text-[#15803d]',dot:'bg-emerald-400',bg: 'bg-emerald-950/20',text: 'text-[#15803d]',glow: '0 0 4px #34d399' },
};

// -- Sparkline SVG -------------------------------------------------------------
function Sparkline({ data, tier }: { data: number[]; tier: Tier }) {
  const W = 80, H = 28, pad = 2;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - (v / max) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const color = tier === 'Critical' ? '#f87171' : tier === 'High' ? '#fb923c' : tier === 'Medium' ? '#fbbf24' : '#34d399';
  return (
      <>
      <PageTitle title="Customer Risk" />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = H - pad - (v / max) * (H - pad * 2);
        return <circle key={i} cx={x} cy={y} r="2" fill={color} opacity="0.6" />;
      })}
    </svg>
      </>
  );
}

// -- Risk Score Bar ------------------------------------------------------------
function RiskBar({ score, tier }: { score: number; tier: Tier }) {
  const color = tier === 'Critical' ? 'bg-red-400' : tier === 'High' ? 'bg-orange-400' : tier === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#1e3a5f]">Risk Score</span>
        <span className="text-[10px] font-bold font-mono text-[#1e3a5f]">{score}/100</span>
      </div>
      <div className="h-1.5 bg-[#f0f9ff] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// -- Customer Card -------------------------------------------------------------
function CustomerCard({ c, rank, expanded, onToggle }: {
  c: CustomerRisk; rank: number; expanded: boolean; onToggle: () => void;
}) {
  const s = TIER_STYLE[c.tier];
  return (
    <div className={`bg-white rounded-xl border ${s.border} transition-all duration-200`}>
      <button onClick={onToggle} className="w-full px-4 py-4 flex items-center gap-3 text-left">
        {/* Rank + dot */}
        <div className="flex-shrink-0 w-7 text-center">
          <span className="text-xs font-mono text-[#1e3a5f]">#{rank}</span>
        </div>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} style={{ boxShadow: s.glow }} />

        {/* Name + tier */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{c.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.badge}`}>{c.tier}</span>
            {c.critical > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-600 px-1.5 py-0.5 rounded font-bold">
                {c.critical} Critical
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-[#1e3a5f]">{c.open} open · {c.closed} closed · {c.total} total</span>
            {c.ppm > 0 && <span className="text-xs text-[#1e3a5f]">PPM: {c.ppm.toLocaleString()}</span>}
          </div>
        </div>

        {/* Sparkline */}
        <div className="hidden sm:flex flex-shrink-0">
          <Sparkline data={c.sparkline} tier={c.tier} />
        </div>

        {/* Risk bar */}
        <div className="hidden md:block flex-shrink-0 w-28">
          <RiskBar score={c.riskScore} tier={c.tier} />
        </div>

        <span className={`text-[#1e3a5f] transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#dbeafe] pt-3 space-y-3">
          {/* AI Narrative */}
          <div className="bg-amber-950/50 border border-amber-500/20 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-amber-600 text-xs">🤖</span>
              <span className="text-amber-600 text-xs font-bold">AI Risk Assessment</span>
            </div>
            <p className="text-amber-100/80 text-xs leading-relaxed">{c.narrative}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Open Complaints', value: String(c.open),        sub: c.critical > 0 ? `${c.critical} critical` : 'none critical' },
              { label: 'Closure Rate',    value: `${c.closureRate}%`,   sub: c.closureRate >= 80 ? '✓ Good' : '↓ Below target' },
              { label: 'PPM',             value: c.ppm.toLocaleString(), sub: c.ppm <= 500 ? '✓ Within target' : '↑ Above target' },
              { label: 'Oldest Open',     value: c.oldestOpenDays > 0 ? `${c.oldestOpenDays}d` : '—', sub: c.oldestOpenDays > 30 ? '⚠ SLA risk' : 'Within SLA' },
            ].map(k => (
              <div key={k.label} className="bg-[#eff6ff] rounded-lg px-3 py-2 text-center border border-[#dbeafe]">
                <p className="text-base font-black text-white font-mono">{k.value}</p>
                <p className="text-[9px] text-[#1e3a5f] uppercase tracking-wide">{k.label}</p>
                <p className="text-[9px] text-[#1e3a5f]">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Recent defect categories */}
          {c.recentActivity.length > 0 && (
            <div>
              <p className="text-[10px] text-[#1e3a5f] uppercase tracking-wide mb-1.5">Recent Defect Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {c.recentActivity.map((a, i) => (
                  <span key={i} className="text-xs bg-[#f0f9ff]/60 text-[#1e3a5f] px-2 py-0.5 rounded">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Link href="/complaints"
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              View Complaints →
            </Link>
            <Link href="/capa"
              className="text-xs px-3 py-1.5 bg-[#f0f9ff] text-[#1e3a5f] rounded-lg hover:bg-[#dbeafe] transition">
              CAPA Actions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function CustomerRiskPage() {
  const [data, setData]       = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter]   = useState<Tier | 'All'>('All');

  const load = useCallback(() => {
    setLoading(true); setError(null);
    fetch('/api/customer-risk')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load customer risk data'); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (name: string) => setExpanded(prev => prev === name ? null : name);

  if (loading) return (
    <div className="flex-1 bg-[#eff6ff] flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#1d4ed8] text-sm font-medium">Analysing customer risk profiles…</p>
        <p className="text-[#1e3a5f] text-xs">Scoring by complaint volume, PPM, and severity</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex-1 bg-[#eff6ff] flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <p className="text-red-600 text-sm">{error ?? 'No data'}</p>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    </div>
  );

  const filtered = filter === 'All' ? data.customers : data.customers.filter(c => c.tier === filter);

  return (
    <div className="flex-1 bg-[#eff6ff] overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* -- Header -- */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="text-[#1e3a5f] hover:text-[#1e3a5f] text-xs transition">← Dashboard</Link>
              <span className="text-[#1e3a5f] text-xs">/</span>
              <span className="text-[#1e3a5f] text-xs">Customer Risk</span>
            </div>
            <h1 className="text-2xl font-bold text-white">AI Customer Risk Scorecard</h1>
            <p className="text-[#1e3a5f] text-sm mt-0.5">Live complaint-driven risk scoring · AI narrative per customer</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#1e3a5f] font-mono">
              {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
            <button onClick={load} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* -- Summary tiles -- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { tier: 'Critical', count: data.summary.critical, icon: '🚨', color: 'border-red-200 bg-red-50 text-red-600' },
            { tier: 'High',     count: data.summary.high,     icon: '🔶', color: 'border-orange-200 bg-orange-950/40 text-orange-600' },
            { tier: 'Medium',   count: data.summary.medium,   icon: '⚠️', color: 'border-amber-500/40 bg-amber-950/40 text-amber-600' },
            { tier: 'Low',      count: data.summary.low,      icon: '✅', color: 'border-emerald-500/40 bg-emerald-950/40 text-[#15803d]' },
          ] as const).map(t => (
            <button key={t.tier} onClick={() => setFilter(prev => prev === t.tier ? 'All' : t.tier as Tier)}
              className={`rounded-xl border ${t.color} px-4 py-3 text-center transition hover:opacity-90 ${filter === t.tier ? 'ring-2 ring-white/20' : ''}`}>
              <p className="text-2xl font-black font-mono">{t.count}</p>
              <p className="text-xs font-bold mt-0.5">{t.icon} {t.tier}</p>
              <p className="text-[10px] opacity-70">customers</p>
            </button>
          ))}
        </div>

        {/* -- Top risk alert -- */}
        {data.summary.critical > 0 && data.summary.topRisk && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-red-600 text-xl flex-shrink-0">🚨</span>
            <div>
              <p className="text-red-600 text-sm font-bold">Critical Customer Alert</p>
              <p className="text-red-200/70 text-xs">
                {data.summary.topRisk} is the highest risk customer — immediate Quality Head action required.
                {data.summary.critical > 1 ? ` Plus ${data.summary.critical - 1} additional critical customer(s).` : ''}
              </p>
            </div>
          </div>
        )}

        {/* -- Filter bar -- */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition border ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-[#f0f9ff] text-[#1e3a5f] border-[#dbeafe] hover:border-[#dbeafe]'
              }`}>
              {f} {f === 'All' ? `(${data.customers.length})` : `(${data.customers.filter(c => c.tier === f).length})`}
            </button>
          ))}
          {expanded && (
            <button onClick={() => setExpanded(null)} className="ml-auto text-xs text-[#1e3a5f] hover:text-[#1e3a5f]">
              Collapse all
            </button>
          )}
        </div>

        {/* -- Customer cards -- */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#dbeafe] p-10 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-[#1e3a5f]">No customers at <span className="text-amber-600">{filter}</span> risk</p>
            <p className="text-[#1e3a5f] text-sm">All customers are at lower risk tiers — no escalations needed.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c, i) => (
              <CustomerCard
                key={c.name}
                c={c}
                rank={data.customers.indexOf(c) + 1}
                expanded={expanded === c.name}
                onToggle={() => toggle(c.name)}
              />
            ))}
          </div>
        )}

        {/* -- Quick links -- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {[
            { href: '/complaints',        icon: '🚨', label: 'All Complaints',    sub: 'Manage NCs' },
            { href: '/iatf-compliance',   icon: '🛡️', label: 'Audit Readiness',   sub: 'IATF Status' },
            { href: '/analytics',         icon: '📊', label: 'Analytics',         sub: 'PPM & Pareto' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="bg-white border border-[#dbeafe] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-[#bfdbfe] hover:bg-[#dbeafe] transition group">
              <span className="text-xl">{l.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#1e3a5f] group-hover:text-white transition">{l.label}</p>
                <p className="text-xs text-[#1e3a5f]">{l.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-[#1e3a5f] pb-2">
          Risk scores computed from live complaint data · Sorted by highest risk first
        </p>
      </div>
    </div>
  );
}
