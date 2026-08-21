'use client';
import { useState, useEffect } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';

// -- Types ---------------------------------------------------------------------
interface SupplierRiskEntry {
  name: string;
  tier: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  open: number;
  closed: number;
  total: number;
  critical: number;
  ppm: number;
  closureRate: number;
  oldestOpenDays: number;
  sparkline: number[];
  topDefects: string[];
  repeatDefects: boolean;
  narrative: string;
  totalQty: number;
}
interface SupplierRiskData {
  suppliers: SupplierRiskEntry[];
  summary: string;
  totals: {
    totalNCRs: number; totalOpen: number; totalCritical: number;
    criticalSuppliers: number; highRisk: number; suppliers: number; avgClosure: number;
  };
  sparkKeys: string[];
  fetchedAt: string;
}

// -- Constants -----------------------------------------------------------------
const TIER_CONFIG = {
  Critical: { border: 'border-red-200', bg: 'bg-red-500/10', dot: 'bg-red-500', glow: 'shadow-red-500/20', badge: 'bg-red-500/20 text-red-600 border-red-200', sparkColor: '#ef4444' },
  High:     { border: 'border-orange-200', bg: 'bg-orange-50', dot: 'bg-orange-400', glow: 'shadow-orange-500/20', badge: 'bg-orange-50 text-orange-600 border-orange-200', sparkColor: '#f97316' },
  Medium:   { border: 'border-yellow-500/40', bg: 'bg-yellow-500/5',  dot: 'bg-yellow-400', glow: 'shadow-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', sparkColor: '#eab308' },
  Low:      { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/10', badge: 'bg-emerald-500/20 text-[#15803d] border-emerald-500/40', sparkColor: '#10b981' },
};

const FILTER_TABS: ('All' | 'Critical' | 'High' | 'Medium' | 'Low')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

// -- SVG Sparkline -------------------------------------------------------------
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 80; const H = 28; const PAD = 2;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (v / max) * (H - PAD * 2);
    return `${x},${y}`;
  }).join(' ');
  const area = `M ${pts.split(' ')[0]} L ${pts} L ${(W - PAD)},${H} L ${PAD},${H} Z`;
  return (
      <>
      <PageTitle title="Supplier Risk" />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
      </>
  );
}

// -- Risk Bar ------------------------------------------------------------------
function RiskBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-[#f0f9ff]/50 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// -- Supplier Card -------------------------------------------------------------
function SupplierCard({ s, rank, maxScore, sparkKeys }: { s: SupplierRiskEntry; rank: number; maxScore: number; sparkKeys: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIER_CONFIG[s.tier];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} ${expanded ? `shadow-lg ${cfg.glow}` : ''} transition-all`}>
      {/* Card Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4">
        <div className="flex items-start gap-4">
          {/* Rank + dot */}
          <div className="flex flex-col items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-[#1e3a5f]">#{rank}</span>
            <div className={`w-3 h-3 rounded-full ${cfg.dot} ring-2 ring-offset-2 ring-offset-[#0b1220] ring-current opacity-80`} />
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-slate-100 text-base">{s.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.badge}`}>{s.tier}</span>
              {s.repeatDefects && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-900/40 text-red-600 border border-red-200">⚠ Repeat</span>}
            </div>
            <RiskBar value={s.riskScore} max={maxScore} color={cfg.sparkColor} />
            <div className="flex flex-wrap gap-4 mt-2 text-xs">
              <span className="text-[#1e3a5f]">Open NCRs: <span className={`font-bold ${s.open > 0 ? 'text-red-600' : 'text-[#15803d]'}`}>{s.open}</span></span>
              <span className="text-[#1e3a5f]">PPM: <span className={`font-bold ${s.ppm > 2000 ? 'text-red-600' : s.ppm > 500 ? 'text-amber-600' : 'text-[#15803d]'}`}>{s.ppm > 0 ? s.ppm.toLocaleString() : '—'}</span></span>
              <span className="text-[#1e3a5f]">Closure: <span className={`font-bold ${s.closureRate < 60 ? 'text-red-600' : s.closureRate < 80 ? 'text-amber-600' : 'text-[#15803d]'}`}>{s.closureRate}%</span></span>
              <span className="text-[#1e3a5f]">Total NCRs: <span className="font-bold text-[#1e3a5f]">{s.total}</span></span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Sparkline data={s.sparkline} color={cfg.sparkColor} />
            <span className="text-[10px] text-[#1e3a5f]">6-month NCR trend</span>
          </div>

          <span className="text-[#1e3a5f] text-xs self-center">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#dbeafe] pt-4">
          {/* AI Narrative */}
          <div className="bg-amber-950/50 border border-amber-500/30 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1.5">🤖 AI Supplier Risk Analysis</p>
            <p className="text-sm text-amber-100 leading-relaxed">{s.narrative}</p>
          </div>

          {/* KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Open NCRs',    value: s.open,       color: s.open > 0 ? 'text-red-600' : 'text-[#15803d]' },
              { label: 'Critical',     value: s.critical,   color: s.critical > 0 ? 'text-red-600 font-bold' : 'text-[#15803d]' },
              { label: 'Oldest Open',  value: s.oldestOpenDays > 0 ? `${s.oldestOpenDays}d` : '—', color: s.oldestOpenDays > 30 ? 'text-red-600' : 'text-[#1e3a5f]' },
              { label: 'Closure Rate', value: `${s.closureRate}%`, color: s.closureRate >= 80 ? 'text-[#15803d]' : s.closureRate >= 60 ? 'text-amber-600' : 'text-red-600' },
            ].map((k, i) => (
              <div key={i} className="bg-[#eff6ff] rounded-lg border border-[#dbeafe] p-3 text-center">
                <p className="text-xs text-[#1e3a5f] mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Defect Categories + Sparkline breakdown */}
          {s.topDefects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide mb-2">Top Defect Categories</p>
              <div className="flex flex-wrap gap-2">
                {s.topDefects.map((d, i) => (
                  <span key={i} className="px-3 py-1 bg-[#f0f9ff] border border-[#dbeafe] rounded-full text-xs text-[#1e3a5f]">{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sparkline with labels */}
          <div>
            <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide mb-2">Monthly NCR Trend (6 months)</p>
            <div className="flex items-end gap-2">
              {s.sparkline.map((v, i) => {
                const maxV = Math.max(...s.sparkline, 1);
                const h = Math.max(4, Math.round((v / maxV) * 48));
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs font-bold" style={{ color: v > 0 ? cfg.sparkColor : '#475569' }}>{v > 0 ? v : ''}</span>
                    <div className="w-full rounded-sm" style={{ height: `${h}px`, backgroundColor: v > 0 ? `${cfg.sparkColor}60` : '#1e293b' }} />
                    <span className="text-[9px] text-[#1e3a5f] rotate-45 origin-left whitespace-nowrap">{sparkKeys[i]?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Link href={`/complaints?supplier=${encodeURIComponent(s.name)}`}
              className="px-4 py-2 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-xs font-medium rounded-lg transition">
              View NCRs →
            </Link>
            <Link href="/supplier-quality"
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition">
              Supplier Quality →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function SupplierRiskPage() {
  const [data, setData] = useState<SupplierRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');

  useEffect(() => {
    fetch('/api/supplier-risk')
      .then(r => r.json())
      .then((d: SupplierRiskData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const suppliers = data?.suppliers ?? [];
  const filtered = filter === 'All' ? suppliers : suppliers.filter(s => s.tier === filter);
  const maxScore = Math.max(...suppliers.map(s => s.riskScore), 1);
  const t = data?.totals;
  const hasCritical = (t?.criticalSuppliers ?? 0) > 0;

  const TIER_COUNTS: Record<string, number> = { All: suppliers.length };
  for (const s of suppliers) TIER_COUNTS[s.tier] = (TIER_COUNTS[s.tier] ?? 0) + 1;

  return (
    <div className="bg-[#eff6ff] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#1e3a5f] hover:text-[#1e3a5f] text-sm">← Dashboard</Link>
            <span className="text-slate-700">|</span>
            <h1 className="text-white font-bold text-lg">AI Supplier Risk Scorecard</h1>
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-600 text-xs font-bold">AI</span>
          </div>
          {data && (
            <span className="text-xs text-[#1e3a5f]">
              Updated: {new Date(data.fetchedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Critical Alert Banner */}
        {hasCritical && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-red-600 text-base">{t?.criticalSuppliers} Critical Supplier{(t?.criticalSuppliers ?? 0) > 1 ? 's' : ''} — Immediate Action Required</p>
              <p className="text-sm text-red-600/80 mt-0.5">{data?.summary}</p>
            </div>
          </div>
        )}

        {/* KPI Row */}
        {t && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Suppliers', value: t.suppliers, color: 'text-[#1d4ed8]', bg: 'border-[#bfdbfe] bg-[#eff6ff]' },
              { label: 'Total NCRs', value: t.totalNCRs, color: 'text-[#1e3a5f]', bg: 'border-[#dbeafe] bg-[#eff6ff]' },
              { label: 'Open NCRs', value: t.totalOpen, color: 'text-red-600', bg: 'border-red-200 bg-red-50' },
              { label: 'Critical', value: t.totalCritical, color: t.totalCritical > 0 ? 'text-red-600 font-bold' : 'text-[#15803d]', bg: t.totalCritical > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-500/30 bg-emerald-950/30' },
              { label: 'High Risk', value: t.highRisk, color: t.highRisk > 0 ? 'text-orange-600' : 'text-[#15803d]', bg: 'border-orange-200 bg-orange-950/20' },
              { label: 'Avg Closure', value: `${t.avgClosure}%`, color: t.avgClosure >= 80 ? 'text-[#15803d]' : t.avgClosure >= 60 ? 'text-amber-600' : 'text-red-600', bg: 'border-[#dbeafe] bg-[#eff6ff]' },
            ].map(k => (
              <div key={k.label} className={`rounded-xl border ${k.bg} p-3 text-center`}>
                <p className="text-[10px] text-[#1e3a5f] font-semibold uppercase tracking-wide">{k.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Summary bar */}
        {data && !hasCritical && (
          <div className="bg-white border border-[#dbeafe] rounded-xl p-4">
            <p className="text-sm text-[#1e3a5f]">{data.summary}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(tab => {
            const count = TIER_COUNTS[tab] ?? 0;
            const isActive = filter === tab;
            const colors: Record<string, string> = {
              All:      isActive ? 'bg-blue-600 text-white' : 'bg-white text-[#1e3a5f] border-[#dbeafe]',
              Critical: isActive ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 border-red-200',
              High:     isActive ? 'bg-orange-600 text-white' : 'bg-orange-950/30 text-orange-400 border-orange-200',
              Medium:   isActive ? 'bg-yellow-600 text-white' : 'bg-yellow-950/30 text-yellow-400 border-yellow-500/30',
              Low:      isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-950/30 text-[#15803d] border-emerald-500/30',
            };
            return (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${colors[tab]}`}>
                {tab} {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#bfdbfe] border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[#1e3a5f] text-sm">Loading supplier risk data...</p>
          </div>
        )}

        {/* Supplier Cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <SupplierCard key={s.name} s={s} rank={suppliers.indexOf(s) + 1} maxScore={maxScore} sparkKeys={data?.sparkKeys ?? []} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && suppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-xl border border-[#dbeafe]">
            <span className="text-5xl">🏭</span>
            <h3 className="text-lg font-bold text-[#1e3a5f]">No Supplier Complaints on Record</h3>
            <p className="text-[#1e3a5f] text-sm text-center max-w-md">
              To populate this dashboard, register complaints with <span className="text-amber-600 font-medium">Complaint Type = "Supplier Complaint"</span> or use defect categories like Material, Incoming, or Supplier.
            </p>
            <div className="flex gap-3">
              <Link href="/complaints" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition">
                + New Complaint
              </Link>
              <Link href="/supplier-quality" className="px-4 py-2 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg font-medium transition">
                Supplier Quality
              </Link>
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && suppliers.length > 0 && (
          <div className="bg-white rounded-xl border border-[#dbeafe] p-10 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-[#1e3a5f]">No suppliers at <span className="text-amber-600">{filter}</span> risk level</p>
            <p className="text-[#1e3a5f] text-sm">All {suppliers.length} supplier{suppliers.length > 1 ? 's' : ''} are at lower risk tiers — good sign.</p>
          </div>
        )}

        {/* IATF Note */}
        {!loading && (
          <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-1">IATF 16949 Supplier Quality References</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#1e3a5f]">
                <span><span className="text-[#1e3a5f]">Cl. 8.4</span> — Supplier control & monitoring</span>
                <span><span className="text-[#1e3a5f]">Cl. 8.4.2</span> — SCAR / corrective action process</span>
                <span><span className="text-[#1e3a5f]">Cl. 8.4.3</span> — Customer-specific requirements for suppliers</span>
                <span><span className="text-[#1e3a5f]">Cl. 9.1</span> — Performance monitoring & PPM</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
