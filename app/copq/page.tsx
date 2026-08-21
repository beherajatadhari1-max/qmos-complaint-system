'use client';
import { useState, useEffect } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';

// -- Types ---------------------------------------------------------------------
interface COPQCategory {
  key: string; label: string; icon: string; cost: number; pct: number;
  color: string; description: string; iatf: string; examples: string[];
}
interface MonthlyData {
  ym: string; total: number; internal: number; external: number;
  appraisal: number; prevention: number; count: number;
}
interface TopCategory { cat: string; cost: number; pct: number; }
interface COPQData {
  totalCOPQ: number;
  categories: COPQCategory[];
  monthlyBreakdown: MonthlyData[];
  topCategories: TopCategory[];
  narrative: string;
  trend: 'improving' | 'worsening' | 'stable';
  sparkKeys: string[];
  summary: {
    totalComplaints: number; criticalComplaints: number; warrantyCount: number;
    overdueInstruments: number; copqAsRevenueRatio: number; externalDominates: boolean;
  };
  fetchedAt: string;
}

// -- Helpers -------------------------------------------------------------------
function fmt(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)} K`;
  return `₹${n.toFixed(0)}`;
}

const COLOR_MAP: Record<string, { ring: string; bar: string; text: string; bg: string; border: string }> = {
  red:     { ring: 'ring-red-500/40',     bar: '#ef4444', text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
  orange:  { ring: 'ring-orange-500/40',  bar: '#f97316', text: 'text-orange-600',  bg: 'bg-orange-950/30',  border: 'border-orange-200' },
  blue:    { ring: 'ring-blue-500/40',    bar: '#3b82f6', text: 'text-[#1d4ed8]',    bg: 'bg-[#eff6ff]',    border: 'border-[#bfdbfe]' },
  emerald: { ring: 'ring-emerald-500/40', bar: '#10b981', text: 'text-[#15803d]', bg: 'bg-emerald-950/30', border: 'border-emerald-500/30' },
};

const TREND_CONFIG = {
  improving: { icon: '📉', label: 'Improving', cls: 'text-[#15803d] bg-emerald-950/40 border-emerald-500/40' },
  worsening: { icon: '📈', label: 'Worsening', cls: 'text-red-600 bg-red-50 border-red-200' },
  stable:    { icon: '➡️',  label: 'Stable',    cls: 'text-amber-600 bg-amber-950/40 border-amber-500/40' },
};

// -- SVG: COPQ Donut Chart -----------------------------------------------------
function DonutChart({ categories }: { categories: COPQCategory[] }) {
  const R = 70; const CX = 90; const CY = 90; const SW = 22;
  let offset = 0;
  const circum = 2 * Math.PI * R;
  const colors = ['#ef4444', '#f97316', '#3b82f6', '#10b981'];

  const slices = categories.map((cat, i) => {
    const dash = (cat.pct / 100) * circum;
    const gap  = circum - dash;
    const slice = { dash, gap, offset, color: colors[i] };
    offset += dash + (i < categories.length - 1 ? 0 : 0);
    return slice;
  });

  return (
      <>
      <PageTitle title="COPQ" />
      <svg viewBox="0 0 180 180" className="w-40 h-40">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth={SW} />
      {slices.map((s, i) => (
        <circle key={i} cx={CX} cy={CY} r={R} fill="none"
          stroke={s.color} strokeWidth={SW}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={circum / 4 - s.offset}
          strokeLinecap="butt"
          style={{ transform: `rotate(0deg)`, transformOrigin: `${CX}px ${CY}px` }}
        />
      ))}
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">Total COPQ</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="#64748b">Est.</text>
    </svg>
      </>
  );
}

// -- SVG: Monthly Trend Bar Chart ----------------------------------------------
function TrendChart({ data, sparkKeys }: { data: MonthlyData[]; sparkKeys: string[] }) {
  const W = 560; const H = 140; const PAD = { l: 50, r: 16, t: 10, b: 30 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const barW   = (chartW / data.length) * 0.6;
  const barGap = (chartW / data.length) * 0.4;

  const colors = { external: '#ef4444', internal: '#f97316', appraisal: '#3b82f6', prevention: '#10b981' };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = PAD.t + chartH * (1 - r);
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#475569">
              {fmt(maxVal * r).replace('₹', '')}
            </text>
          </g>
        );
      })}
      {/* Stacked bars */}
      {data.map((d, i) => {
        const x = PAD.l + i * (chartW / data.length) + barGap / 2;
        const segments: { key: keyof typeof colors; value: number }[] = [
          { key: 'external',   value: d.external },
          { key: 'internal',   value: d.internal },
          { key: 'appraisal',  value: d.appraisal },
          { key: 'prevention', value: d.prevention },
        ];
        let yBottom = PAD.t + chartH;
        return (
          <g key={i}>
            {segments.map(s => {
              const h = maxVal > 0 ? (s.value / maxVal) * chartH : 0;
              const rect = <rect key={s.key} x={x} y={yBottom - h} width={barW} height={h} fill={colors[s.key]} opacity="0.85" rx="1" />;
              yBottom -= h;
              return rect;
            })}
            <text x={x + barW / 2} y={PAD.t + chartH + 14} textAnchor="middle" fontSize="8" fill="#475569">
              {sparkKeys[i]?.slice(5)}
            </text>
            {d.total > 0 && (
              <text x={x + barW / 2} y={yBottom - 3} textAnchor="middle" fontSize="7" fill="#94a3b8">
                {fmt(d.total).replace('₹','').replace(' ','').slice(0, 5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// -- Category Card -------------------------------------------------------------
function CategoryCard({ cat, total }: { cat: COPQCategory; total: number }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[cat.color] ?? COLOR_MAP.blue;
  const pct = total > 0 ? Math.round((cat.cost / total) * 100) : 0;

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{cat.icon}</span>
            <div>
              <p className="font-bold text-slate-100 text-sm">{cat.label}</p>
              <p className="text-xs text-[#1e3a5f] mt-0.5">{cat.description}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-xl font-bold ${c.text}`}>{fmt(cat.cost)}</p>
            <p className="text-xs text-[#1e3a5f]">{pct}% of COPQ</p>
          </div>
        </div>
        {/* Bar */}
        <div className="mt-3 w-full bg-[#f0f9ff] rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.bar }} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[#dbeafe] pt-3 space-y-3">
          <p className="text-xs text-[#1d4ed8] font-medium">{cat.iatf}</p>
          <div>
            <p className="text-xs text-[#1e3a5f] mb-1.5 font-semibold uppercase tracking-wide">Includes:</p>
            <div className="space-y-1">
              {cat.examples.map((ex, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className={`text-xs mt-0.5 ${c.text}`}>▸</span>
                  <span className="text-xs text-[#1e3a5f]">{ex}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function COPQPage() {
  const [data, setData] = useState<COPQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/copq')
      .then(r => r.json())
      .then((d: COPQData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function buildReport(): string {
    if (!data) return '';
    const d = data;
    const lines = [
      'COST OF POOR QUALITY (COPQ) REPORT',
      `Generated: ${new Date(d.fetchedAt).toLocaleString()}`,
      `IATF 16949 Cl. 9.3 — Management Review Input`,
      '-'.repeat(50),
      '',
      `TOTAL COPQ: ${fmt(d.totalCOPQ)}`,
      `Trend: ${d.trend.toUpperCase()}`,
      '',
      'COPQ BREAKDOWN (PAF Model):',
      ...d.categories.map(c => `  ${c.label}: ${fmt(c.cost)} (${Math.round(c.pct)}%)`),
      '',
      'AI ANALYSIS:',
      d.narrative,
      '',
      'TOP DEFECT CATEGORIES BY COST:',
      ...d.topCategories.map((t, i) => `  ${i + 1}. ${t.cat}: ${fmt(t.cost)}`),
      '',
      'MONTHLY COPQ TREND:',
      ...d.monthlyBreakdown.map(m => `  ${m.ym}: ${fmt(m.total)} (${m.count} complaints)`),
    ];
    return lines.join('\n');
  }

  async function copy() {
    await navigator.clipboard.writeText(buildReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const trendCfg = TREND_CONFIG[data?.trend ?? 'stable'];
  const totalCOPQ = data?.totalCOPQ ?? 0;

  return (
    <div className="bg-[#eff6ff] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#1e3a5f] hover:text-[#1e3a5f] text-sm">← Dashboard</Link>
            <span className="text-slate-700">|</span>
            <h1 className="text-white font-bold text-lg">COPQ Dashboard</h1>
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-600 text-xs font-bold">AI</span>
            <span className="px-2 py-0.5 bg-blue-500/20 border border-[#bfdbfe] rounded text-[#1d4ed8] text-xs">IATF Cl. 9.3</span>
          </div>
          {data && (
            <button onClick={copy}
              className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-xs rounded font-medium transition">
              {copied ? '✅ Copied' : '📋 Copy Report'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-[#bfdbfe] border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[#1e3a5f] text-sm">Calculating Cost of Poor Quality...</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Hero — Total COPQ */}
            <div className="bg-gradient-to-r from-red-950/40 to-orange-950/30 border border-red-200 rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <DonutChart categories={data.categories} />
                  <div>
                    <p className="text-xs text-[#1e3a5f] font-semibold uppercase tracking-wide mb-1">Estimated Total COPQ</p>
                    <p className="text-4xl font-black text-white">{fmt(totalCOPQ)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${trendCfg.cls}`}>
                        {trendCfg.icon} {trendCfg.label}
                      </span>
                      <span className="text-xs text-[#1e3a5f]">~{data.summary.copqAsRevenueRatio}% of est. revenue</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      {data.categories.map(cat => {
                        const c = COLOR_MAP[cat.color];
                        return (
                          <span key={cat.key} className="flex items-center gap-1.5 text-[#1e3a5f]">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c?.bar }} />
                            {cat.label}: <span className={`font-semibold ${c?.text}`}>{Math.round(cat.pct)}%</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Complaints', value: data.summary.totalComplaints, color: 'text-[#1e3a5f]' },
                    { label: 'Critical', value: data.summary.criticalComplaints, color: data.summary.criticalComplaints > 0 ? 'text-red-600' : 'text-[#15803d]' },
                    { label: 'Warranty', value: data.summary.warrantyCount, color: data.summary.warrantyCount > 0 ? 'text-orange-600' : 'text-[#15803d]' },
                    { label: 'Cal. Overdue', value: data.summary.overdueInstruments, color: data.summary.overdueInstruments > 0 ? 'text-amber-600' : 'text-[#15803d]' },
                  ].map(k => (
                    <div key={k.label} className="bg-[#eff6ff] rounded-lg p-3 text-center min-w-[80px]">
                      <p className="text-[10px] text-[#1e3a5f] uppercase tracking-wide">{k.label}</p>
                      <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Narrative */}
            <div className="bg-amber-950/50 border border-amber-500/30 rounded-xl p-5">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">🤖 AI Cost Analysis & Recommendations</p>
              <p className="text-sm text-amber-100 leading-relaxed">{data.narrative}</p>
            </div>

            {/* PAF Category Cards */}
            <div>
              <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">PAF Cost Model — 4 Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.categories.map(cat => (
                  <CategoryCard key={cat.key} cat={cat} total={totalCOPQ} />
                ))}
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#1e3a5f]">Monthly COPQ Trend — 6 Months</h2>
                  <p className="text-xs text-[#1e3a5f] mt-0.5">Stacked by failure type</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {[
                    { label: 'External', color: '#ef4444' },
                    { label: 'Internal', color: '#f97316' },
                    { label: 'Appraisal', color: '#3b82f6' },
                    { label: 'Prevention', color: '#10b981' },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[#1e3a5f]">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />{l.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <TrendChart data={data.monthlyBreakdown} sparkKeys={data.sparkKeys} />
              </div>
              {/* Monthly table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs">
                  <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
                    <tr>
                      {['Month', 'External', 'Internal', 'Appraisal', 'Prevention', 'Total', 'Complaints'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbeafe]">
                    {data.monthlyBreakdown.map((m, i) => (
                      <tr key={m.ym} className={`hover:bg-[#dbeafe] ${i === data.monthlyBreakdown.length - 1 ? 'font-semibold' : ''}`}>
                        <td className="px-3 py-2 text-[#1e3a5f]">{m.ym}</td>
                        <td className="px-3 py-2 text-red-600">{fmt(m.external)}</td>
                        <td className="px-3 py-2 text-orange-600">{fmt(m.internal)}</td>
                        <td className="px-3 py-2 text-[#1d4ed8]">{fmt(m.appraisal)}</td>
                        <td className="px-3 py-2 text-[#15803d]">{fmt(m.prevention)}</td>
                        <td className="px-3 py-2 text-slate-100">{fmt(m.total)}</td>
                        <td className="px-3 py-2 text-[#1e3a5f]">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Defect Categories by Cost */}
            {data.topCategories.length > 0 && (
              <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
                <h2 className="text-sm font-bold text-[#1e3a5f] mb-4">Top Defect Categories by Cost Impact</h2>
                <div className="space-y-3">
                  {data.topCategories.map((tc, i) => (
                    <div key={tc.cat} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#1e3a5f] w-4">{i + 1}</span>
                      <span className="text-sm text-[#1e3a5f] flex-1 truncate">{tc.cat}</span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-24 bg-[#f0f9ff] rounded-full h-1.5 hidden sm:block">
                          <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${tc.pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-red-600 w-16 text-right">{fmt(tc.cost)}</span>
                        <span className="text-xs text-[#1e3a5f] w-8 text-right">{tc.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COPQ Theory Box */}
            <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
              <h2 className="text-sm font-bold text-[#1e3a5f] mb-3">📚 COPQ — PAF Model Reference (IATF / ASQ)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[#1e3a5f] leading-relaxed">
                    <span className="text-red-600 font-semibold">Prevention + Appraisal</span> costs are <em>good quality costs</em> — invested to prevent failures.
                    As prevention increases, failure costs decrease at a much higher rate (typically 4:1 ratio).
                  </p>
                </div>
                <div>
                  <p className="text-[#1e3a5f] leading-relaxed">
                    <span className="text-red-600 font-semibold">Internal + External Failure</span> costs are <em>bad quality costs</em> — incurred because failures happened.
                    World-class manufacturers target external failure {'<'} 10% of total COPQ. External COPQ is 8–15× more expensive than internal.
                  </p>
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-4">
                  <span className="text-[#1e3a5f]">IATF 16949 References:</span>
                  <span className="text-[#1d4ed8]">Cl. 9.3 — Management Review (COPQ as input)</span>
                  <span className="text-[#1d4ed8]">Cl. 10.2 — CAPA for failures</span>
                  <span className="text-[#1d4ed8]">Cl. 6.1 — Risk-based prevention</span>
                  <span className="text-[#1d4ed8]">Cl. 7.1.5 — Calibration (appraisal)</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 justify-center pb-2">
              <Link href="/analytics" className="px-5 py-2.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-sm font-medium rounded-lg transition">Analytics Dashboard →</Link>
              <Link href="/capa" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">Open CAPA Register →</Link>
              <Link href="/management-review" className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition">Management Review →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
