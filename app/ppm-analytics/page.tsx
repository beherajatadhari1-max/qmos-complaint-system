'use client';
import { useState, useEffect, useRef } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface MonthData {
  label: string; yearMonth: string;
  defects: number; supplied: number; ppm: number;
  critical: number; high: number; medium: number; low: number;
  categories: { name: string; count: number }[];
  customers: { name: string; count: number }[];
}
interface ForecastMonth { label: string; yearMonth: string; ppm: number; }
interface SPC { mean: number; ucl: number; lcl: number; stdDev: number; }
interface AnalyticsData {
  months: MonthData[];
  forecast: ForecastMonth[];
  trendLine: number[];
  spc: SPC;
  slope: number;
  trendDir: 'improving' | 'stable' | 'worsening';
  topCategories: { name: string; count: number }[];
  topCustomers: { name: string; count: number }[];
  insights: string[];
  summary: { totalComplaints: number; totalDefects: number; currentPPM: number; momChange: number; forecastNext: number; };
}

// -----------------------------------------------------------------------------
// CHART COMPONENT — pure SVG, no dependencies
// -----------------------------------------------------------------------------
function PPMChart({ months, forecast, trendLine, spc, target = 500, onMonthClick }: {
  months: MonthData[]; forecast: ForecastMonth[];
  trendLine: number[]; spc: SPC; target?: number;
  onMonthClick?: (yearMonth: string) => void;
}) {
  const allPPM = [...months.map(m => m.ppm), ...forecast.map(f => f.ppm), spc.ucl, target];
  const maxY = Math.max(...allPPM, 100) * 1.15;
  const W = 780, H = 300, PL = 60, PR = 20, PT = 20, PB = 50;
  const cW = W - PL - PR, cH = H - PT - PB;

  const allLabels = [...months.map(m => m.label), ...forecast.map(f => f.label)];
  const allPPMFull = [...months.map(m => m.ppm), ...forecast.map(f => f.ppm)];
  const N = allLabels.length;
  const barW = Math.max((cW / N) * 0.55, 8);

  const xPos = (i: number) => PL + (i / (N - 1)) * cW;
  const yPos = (v: number) => PT + cH - (v / maxY) * cH;

  // Trend line across all points (18 actual + 3 forecast = 21)
  const trendAll = [...trendLine, ...forecast.map((_, i) => {
    const slope = trendLine.length >= 2 ? trendLine[trendLine.length - 1] - trendLine[trendLine.length - 2] : 0;
    return Math.max(0, trendLine[trendLine.length - 1] + slope * (i + 1));
  })];

  const trendPath = trendAll.map((v, i) => `${i === 0 ? 'M' : 'L'}${xPos(i)},${yPos(v)}`).join(' ');
  const linePath = allPPMFull.map((v, i) => `${i === 0 ? 'M' : 'L'}${xPos(i)},${yPos(v)}`).join(' ');

  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY].map(v => Math.round(v));

  return (
      <>
      <PageTitle title="PPM Analytics" />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 300 }}>
      {/* Grid */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PL} y1={yPos(v)} x2={W - PR} y2={yPos(v)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PL - 6} y={yPos(v) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v.toLocaleString()}</text>
        </g>
      ))}

      {/* UCL */}
      <line x1={PL} y1={yPos(spc.ucl)} x2={W - PR} y2={yPos(spc.ucl)} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="5,3" />
      <text x={W - PR + 2} y={yPos(spc.ucl) + 3} fontSize="8" fill="#ef4444">UCL</text>

      {/* Mean */}
      <line x1={PL} y1={yPos(spc.mean)} x2={W - PR} y2={yPos(spc.mean)} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
      <text x={W - PR + 2} y={yPos(spc.mean) + 3} fontSize="8" fill="#94a3b8">μ</text>

      {/* Target */}
      {target > 0 && target < maxY && (
        <>
          <line x1={PL} y1={yPos(target)} x2={W - PR} y2={yPos(target)} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,2" />
          <text x={PL + 4} y={yPos(target) - 3} fontSize="8" fill="#10b981">Target {target}</text>
        </>
      )}

      {/* Forecast zone shading */}
      <rect x={xPos(months.length - 1)} y={PT} width={xPos(N - 1) - xPos(months.length - 1)} height={cH} fill="#f0f9ff" opacity="0.6" />
      <text x={xPos(months.length - 1) + 4} y={PT + 10} fontSize="8" fill="#0284c7">◀ Actual  Forecast ▶</text>

      {/* Bars — clickable for actual months */}
      {allPPMFull.map((v, i) => {
        const isForecast = i >= months.length;
        const isOut = v > spc.ucl;
        const bX = xPos(i) - barW / 2;
        const bY = yPos(v);
        const bH = cH + PT - bY;
        const fill = isForecast ? '#bfdbfe' : isOut ? '#fca5a5' : '#6366f1';
        const ym = !isForecast ? months[i]?.yearMonth : undefined;
        return (
          <g key={i}
            onClick={ym && onMonthClick ? () => onMonthClick(ym) : undefined}
            style={{ cursor: ym && onMonthClick ? 'pointer' : 'default' }}>
            <rect x={bX} y={bY} width={barW} height={bH} fill={fill} rx="2" opacity="0.85" />
            {ym && onMonthClick && <rect x={bX} y={PT} width={barW} height={cH} fill="transparent" />}
            {v > 0 && <text x={xPos(i)} y={bY - 3} textAnchor="middle" fontSize="7" fill={isOut ? '#dc2626' : '#475569'}>{v}</text>}
          </g>
        );
      })}

      {/* Trend line */}
      <path d={trendPath} stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="none" />

      {/* PPM line */}
      <path d={linePath} stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.7" />

      {/* X-axis labels */}
      {allLabels.map((lbl, i) => (
        i % 2 === 0 || N <= 12 ? (
          <text key={i} x={xPos(i)} y={H - PB + 15} textAnchor="middle" fontSize="9" fill={i >= months.length ? '#0284c7' : '#64748b'}>{lbl}</text>
        ) : null
      ))}

      {/* Legend */}
      <rect x={PL} y={H - PB + 28} width="10" height="10" fill="#6366f1" rx="2" />
      <text x={PL + 13} y={H - PB + 37} fontSize="9" fill="#475569">Actual PPM</text>
      <rect x={PL + 80} y={H - PB + 28} width="10" height="10" fill="#bfdbfe" rx="2" />
      <text x={PL + 93} y={H - PB + 37} fontSize="9" fill="#475569">Forecast PPM</text>
      <line x1={PL + 175} y1={H - PB + 33} x2={PL + 190} y2={H - PB + 33} stroke="#f59e0b" strokeWidth="2" />
      <text x={PL + 193} y={H - PB + 37} fontSize="9" fill="#475569">Trend Line</text>
      <line x1={PL + 260} y1={H - PB + 33} x2={PL + 275} y2={H - PB + 33} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
      <text x={PL + 278} y={H - PB + 37} fontSize="9" fill="#475569">UCL (±3σ)</text>
      <line x1={PL + 345} y1={H - PB + 33} x2={PL + 360} y2={H - PB + 33} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,2" />
      <text x={PL + 363} y={H - PB + 37} fontSize="9" fill="#475569">OEM Target</text>
    </svg>
      </>
  );
}

// -----------------------------------------------------------------------------
// MINI BAR CHART — horizontal bars for categories / customers
// -----------------------------------------------------------------------------
function MiniBar({ items, color }: { items: { name: string; count: number }[]; color: string }) {
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="text-xs text-[#1e3a5f] w-28 truncate shrink-0">{item.name}</div>
          <div className="flex-1 bg-white rounded-full h-4 overflow-hidden">
            <div className="h-4 rounded-full flex items-center justify-end pr-1.5 transition-all"
              style={{ width: `${(item.count / max) * 100}%`, background: color }}>
              <span className="text-[10px] font-bold text-white">{item.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// MAIN PAGE
// -----------------------------------------------------------------------------
export default function PPMAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(500);
  const [view, setView] = useState<'chart' | 'category' | 'customer' | 'spc'>('chart');
  const [drillMonth, setDrillMonth] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ppm-analytics')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">📊</div>
        <div className="text-[#1e3a5f] font-medium">Computing PPM Analytics & Forecast…</div>
        <div className="text-xs text-[#1e3a5f] mt-1">Linear regression · SPC control limits · 3-month forecast</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center">
      <div className="text-red-500 text-sm">{error}</div>
    </div>
  );

  if (!data) return null;

  const { summary, spc, trendDir, insights, topCategories, topCustomers, months, forecast, trendLine } = data;

  const trendColor = trendDir === 'improving' ? 'text-green-600' : trendDir === 'worsening' ? 'text-red-600' : 'text-yellow-600';
  const trendBg    = trendDir === 'improving' ? 'bg-green-900/30 border-green-700/50' : trendDir === 'worsening' ? 'bg-red-50 border-red-700/50' : 'bg-yellow-900/30 border-yellow-700/50';
  const trendIcon  = trendDir === 'improving' ? '📉' : trendDir === 'worsening' ? '📈' : '➡️';

  // Monthly table data — last 6 months
  const recentMonths = months.slice(-6);

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* -- HEADER -- */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">📊 Predictive PPM Analytics</h1>
              <p className="text-indigo-700 text-sm mt-0.5">18-month history · Linear regression forecast · SPC control limits · IATF §9.1.1.1</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
                <label className="text-xs text-indigo-200">OEM Target PPM:</label>
                <input type="number" value={target} onChange={e => setTarget(Number(e.target.value))}
                  className="w-20 bg-transparent text-white font-bold text-sm border-none outline-none text-right" />
              </div>
              <Link href="/" className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded-lg border border-white/20">← Dashboard</Link>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            {[
              { label: 'Current PPM', value: summary.currentPPM.toLocaleString(), sub: 'This month', color: summary.currentPPM > spc.ucl ? 'text-red-600' : summary.currentPPM > target ? 'text-yellow-300' : 'text-green-300' },
              { label: 'Forecast (1 mo)', value: summary.forecastNext.toLocaleString(), sub: 'Predicted PPM', color: summary.forecastNext > target ? 'text-yellow-300' : 'text-green-300' },
              { label: 'Trend Direction', value: trendIcon + ' ' + trendDir.toUpperCase(), sub: `Slope: ${data.slope > 0 ? '+' : ''}${data.slope}/mo`, color: trendColor.replace('text-', 'text-').replace('600', '300') },
              { label: 'UCL (±3σ)', value: spc.ucl.toLocaleString(), sub: `Mean: ${spc.mean}`, color: 'text-red-600' },
              { label: 'MoM Change', value: `${summary.momChange > 0 ? '+' : ''}${summary.momChange}%`, sub: 'vs prior month', color: summary.momChange > 0 ? 'text-red-600' : 'text-green-300' },
              { label: 'Total Complaints', value: summary.totalComplaints.toLocaleString(), sub: 'Last 18 months', color: 'text-[#1d4ed8]' },
            ].map(k => (
              <div key={k.label} className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                <div className="text-[10px] text-indigo-700 mt-0.5">{k.label}</div>
                <div className="text-[10px] text-indigo-400">{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* -- AI INSIGHTS -- */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">🤖 AI Predictive Insights</div>
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-xl px-4 py-3 border text-sm ${
              ins.startsWith('⚠️') || ins.startsWith('🚨') ? 'bg-red-50 border-red-700/50 text-red-800' :
              ins.startsWith('✅') ? 'bg-green-900/30 border-green-700/50 text-green-300' :
              'bg-[#eff6ff] border-blue-700/50 text-blue-200'
            }`}>
              {ins}
            </div>
          ))}
        </div>

        {/* -- TREND STATUS CARD -- */}
        <div className={`rounded-xl px-5 py-4 border ${trendBg} flex items-center gap-4 flex-wrap`}>
          <div className="text-3xl">{trendIcon}</div>
          <div className="flex-1">
            <div className={`text-lg font-bold ${trendColor}`}>
              PPM Trend: {trendDir.charAt(0).toUpperCase() + trendDir.slice(1)}
            </div>
            <div className="text-sm text-[#1e3a5f] mt-0.5">
              Slope: <strong>{data.slope > 0 ? '+' : ''}{data.slope} PPM/month</strong> &nbsp;·&nbsp;
              3-month forecast: {forecast.map(f => f.ppm).join(' → ')} PPM &nbsp;·&nbsp;
              {data.slope > 0 ? 'Action required to reverse trend' : data.slope < 0 ? 'Sustain current improvement actions' : 'Monitor — no significant trend detected'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#1e3a5f]">SPC Process</div>
            <div className="text-sm font-bold text-[#1e3a5f]">Mean: {spc.mean} PPM</div>
            <div className="text-sm font-bold text-[#1e3a5f]">UCL: {spc.ucl} PPM</div>
            <div className="text-sm font-bold text-[#1e3a5f]">σ: {spc.stdDev} PPM</div>
          </div>
        </div>

        {/* -- TABS -- */}
        <div className="border-b border-[#dbeafe] bg-white rounded-t-xl">
          <div className="flex gap-0 px-4">
            {[['chart','📈 PPM Trend Chart'],['category','🔍 By Category'],['customer','🏢 By Customer'],['spc','📐 SPC Table']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v as typeof view)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${view === v ? 'border-indigo-600 text-indigo-300' : 'border-transparent text-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* -- CHART VIEW -- */}
        {view === 'chart' && (
          <div className="bg-white rounded-b-xl rounded-tr-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-[#1e3a5f]">PPM Trend — 18 Months Actual + 3 Month AI Forecast</div>
                <div className="text-xs text-[#1e3a5f] mt-0.5">Blue zone = forecast period · Yellow line = regression trend · Red dashed = UCL (±3σ) · Green dashed = OEM target</div>
              </div>
            </div>
            <p className="text-xs text-blue-500 mb-2">💡 Click any bar to drill into complaints for that month</p>
            <PPMChart months={months} forecast={forecast} trendLine={trendLine} spc={spc} target={target}
              onMonthClick={(ym) => setDrillMonth(ym)} />

            {/* Drill-down link */}
            {drillMonth && (
              <div className="mt-3 flex items-center gap-3 bg-[#eff6ff] border border-blue-700/50 rounded-lg px-4 py-2.5">
                <span className="text-[#1d4ed8] text-sm font-semibold">📅 {drillMonth} selected</span>
                <a href={`/complaints?month=${drillMonth}`}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
                  View complaints for {drillMonth} →
                </a>
                <button onClick={() => setDrillMonth(null)} className="text-xs text-[#1d4ed8] hover:text-blue-600 underline ml-auto">
                  Clear
                </button>
              </div>
            )}

            {/* Recent months table */}
            <div className="mt-5">
              <div className="text-xs font-bold text-[#1e3a5f] uppercase mb-2">Recent 6 Months Detail</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#eff6ff] text-[10px] text-[#1e3a5f] uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Month</th>
                      <th className="px-3 py-2 text-right">Defects</th>
                      <th className="px-3 py-2 text-right">PPM</th>
                      <th className="px-3 py-2 text-center">vs UCL</th>
                      <th className="px-3 py-2 text-center">vs Target</th>
                      <th className="px-3 py-2 text-center">Critical</th>
                      <th className="px-3 py-2 text-center">High</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentMonths.map(m => {
                      const outControl = m.ppm > spc.ucl;
                      const aboveTarget = m.ppm > target;
                      return (
                        <tr key={m.yearMonth} className="hover:bg-white/[0.03]">
                          <td className="px-3 py-2 font-bold text-[#1e3a5f]">{m.label}</td>
                          <td className="px-3 py-2 text-right">{m.defects}</td>
                          <td className={`px-3 py-2 text-right font-bold ${outControl ? 'text-red-600' : aboveTarget ? 'text-yellow-600' : 'text-green-600'}`}>{m.ppm.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${outControl ? 'bg-red-100 text-red-700' : 'bg-white text-[#1e3a5f]'}`}>
                              {outControl ? '⛔ OUT' : '✓ IN'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${aboveTarget ? 'bg-yellow-100 text-yellow-300' : 'bg-green-100 text-green-300'}`}>
                              {aboveTarget ? '▲ ABOVE' : '✓ BELOW'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-red-600">{m.critical}</td>
                          <td className="px-3 py-2 text-center font-bold text-orange-600">{m.high}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${outControl ? 'bg-red-100 text-red-700' : aboveTarget ? 'bg-yellow-100 text-yellow-300' : 'bg-green-100 text-green-300'}`}>
                              {outControl ? '🚨 Action' : aboveTarget ? '⚠️ Watch' : '✅ OK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Forecast rows */}
                    {forecast.map(f => (
                      <tr key={f.yearMonth} className="bg-[#eff6ff]">
                        <td className="px-3 py-2 font-bold text-[#1d4ed8]">{f.label} <span className="text-[10px] text-blue-500">(Forecast)</span></td>
                        <td className="px-3 py-2 text-right text-blue-500">—</td>
                        <td className={`px-3 py-2 text-right font-bold ${f.ppm > target ? 'text-orange-600' : 'text-blue-600'}`}>{f.ppm.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center text-[#1d4ed8] text-[10px]">Predicted</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${f.ppm > target ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-300'}`}>
                            {f.ppm > target ? '▲ ABOVE' : '✓ BELOW'}
                          </span>
                        </td>
                        <td colSpan={3} className="px-3 py-2 text-center text-[#1d4ed8] text-[10px]">AI Prediction</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -- CATEGORY VIEW -- */}
        {view === 'category' && (
          <div className="bg-white rounded-b-xl rounded-tr-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="font-bold text-[#1e3a5f] mb-1">Defect Breakdown by Category</div>
            <div className="text-xs text-[#1e3a5f] mb-4">Based on last 18 months. Use to prioritise PFMEA review and control plan updates.</div>
            {topCategories.length === 0 ? (
              <div className="text-[#1e3a5f] text-sm py-8 text-center">No category data available yet</div>
            ) : (
              <div className="space-y-6">
                <MiniBar items={topCategories} color="#6366f1" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {topCategories.map((cat, i) => {
                    const total = topCategories.reduce((s, c) => s + c.count, 0);
                    const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                    const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
                    return (
                      <div key={cat.name} className="bg-[#eff6ff] rounded-xl p-3 border border-[#dbeafe]">
                        <div className="flex items-center justify-between mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }} />
                          <span className="text-xs font-bold text-[#1e3a5f]">{pct}%</span>
                        </div>
                        <div className="font-bold text-[#1e3a5f] text-sm">{cat.name}</div>
                        <div className="text-xs text-[#1e3a5f]">{cat.count} complaints</div>
                        <div className="mt-2 bg-[#dbeafe] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-4 text-sm text-indigo-200">
                  <strong>AI Recommendation:</strong> Top category "<strong>{topCategories[0]?.name}</strong>" accounts for {topCategories[0] && topCategories.length > 0 ? Math.round((topCategories[0].count / topCategories.reduce((s,c) => s+c.count,0))*100) : 0}% of all complaints.
                  Priority action: Review PFMEA failure modes for this category, tighten control plan detection methods, and check if similar failures are in Lessons Learned database.
                </div>
              </div>
            )}
          </div>
        )}

        {/* -- CUSTOMER VIEW -- */}
        {view === 'customer' && (
          <div className="bg-white rounded-b-xl rounded-tr-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="font-bold text-[#1e3a5f] mb-1">Complaint Volume by Customer</div>
            <div className="text-xs text-[#1e3a5f] mb-4">Identify high-complaint customers for dedicated PPM improvement plans and SLA review.</div>
            {topCustomers.length === 0 ? (
              <div className="text-[#1e3a5f] text-sm py-8 text-center">No customer data available yet</div>
            ) : (
              <div className="space-y-4">
                <MiniBar items={topCustomers} color="#8b5cf6" />
                <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-4 text-sm text-purple-200">
                  <strong>AI Recommendation:</strong> Customer "<strong>{topCustomers[0]?.name}</strong>" has the highest complaint volume ({topCustomers[0]?.count} complaints).
                  Action: Schedule a Customer Quality Review meeting, review their CSR requirements, and ensure an active 8D/CAPA is tracking all open issues for this account.
                </div>
              </div>
            )}
          </div>
        )}

        {/* -- SPC TABLE -- */}
        {view === 'spc' && (
          <div className="bg-white rounded-b-xl rounded-tr-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="font-bold text-[#1e3a5f] mb-1">SPC Control Chart Data — All 18 Months</div>
            <div className="text-xs text-[#1e3a5f] mb-4">UCL = μ + 3σ · LCL = max(0, μ − 3σ). Out-of-control points require special cause investigation per IATF §9.1.1.1</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Process Mean (μ)', value: `${spc.mean} PPM`, color: 'bg-[#eff6ff] border-[#dbeafe]' },
                { label: 'Std Deviation (σ)', value: `${spc.stdDev} PPM`, color: 'bg-[#eff6ff] border-blue-700/50' },
                { label: 'UCL (μ + 3σ)', value: `${spc.ucl} PPM`, color: 'bg-red-50 border-red-700/50' },
                { label: 'LCL (μ − 3σ)', value: `${spc.lcl} PPM`, color: 'bg-green-900/30 border-green-700/50' },
              ].map(k => (
                <div key={k.label} className={`rounded-xl p-3 border ${k.color}`}>
                  <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
                  <div className="text-lg font-bold text-[#1e3a5f]">{k.value}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#eff6ff] text-[10px] text-[#1e3a5f] uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-right">PPM</th>
                    <th className="px-3 py-2 text-right">UCL</th>
                    <th className="px-3 py-2 text-right">Mean</th>
                    <th className="px-3 py-2 text-right">LCL</th>
                    <th className="px-3 py-2 text-center">Control Status</th>
                    <th className="px-3 py-2 text-center">vs Target ({target})</th>
                    <th className="px-3 py-2 text-left">Required Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {months.map(m => {
                    const outControl = m.ppm > spc.ucl;
                    const aboveTarget = m.ppm > target;
                    return (
                      <tr key={m.yearMonth} className={`${outControl ? 'bg-red-50' : ''} hover:bg-white/[0.03]`}>
                        <td className="px-3 py-2 font-bold text-[#1e3a5f]">{m.label}</td>
                        <td className={`px-3 py-2 text-right font-bold ${outControl ? 'text-red-600' : 'text-[#1e3a5f]'}`}>{m.ppm.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-red-500">{spc.ucl}</td>
                        <td className="px-3 py-2 text-right text-[#1e3a5f]">{spc.mean}</td>
                        <td className="px-3 py-2 text-right text-green-600">{spc.lcl}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${outControl ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-300'}`}>
                            {outControl ? '⛔ OUT OF CONTROL' : '✅ IN CONTROL'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${aboveTarget ? 'bg-yellow-100 text-yellow-300' : 'bg-green-100 text-green-300'}`}>
                            {aboveTarget ? '▲ ABOVE' : '✓ BELOW'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#1e3a5f] text-[10px]">
                          {outControl ? 'Special cause investigation required — identify assignable cause, update PFMEA' :
                           aboveTarget ? 'Monitor — common cause variation, consider process improvement' :
                           'Sustain controls — no action required'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
