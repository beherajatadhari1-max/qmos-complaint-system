'use client';
import { useState, useMemo } from 'react';

// ── SPC Constants (AIAG SPC 2nd Ed.) ─────────────────────────────────────────
const SPC_K: Record<number, { d2: number; A2: number; D3: number; D4: number }> = {
  2:  { d2: 1.128, A2: 1.880, D3: 0,     D4: 3.267 },
  3:  { d2: 1.693, A2: 1.023, D3: 0,     D4: 2.574 },
  4:  { d2: 2.059, A2: 0.729, D3: 0,     D4: 2.282 },
  5:  { d2: 2.326, A2: 0.577, D3: 0,     D4: 2.114 },
  6:  { d2: 2.534, A2: 0.483, D3: 0,     D4: 2.004 },
  7:  { d2: 2.704, A2: 0.419, D3: 0.076, D4: 1.924 },
  8:  { d2: 2.847, A2: 0.373, D3: 0.136, D4: 1.864 },
  9:  { d2: 2.970, A2: 0.337, D3: 0.184, D4: 1.816 },
  10: { d2: 3.078, A2: 0.308, D3: 0.223, D4: 1.777 },
};

function fmt(n: number, d = 4) { return isNaN(n) || !isFinite(n) ? '—' : n.toFixed(d); }

function capRating(v: number): { label: string; bg: string; text: string } {
  if (v >= 1.67) return { label: 'World Class', bg: 'bg-emerald-900/40 border-emerald-700/50', text: 'text-emerald-300' };
  if (v >= 1.33) return { label: 'Capable',     bg: 'bg-green-900/40 border-green-700/50',   text: 'text-green-300' };
  if (v >= 1.00) return { label: 'Marginal',    bg: 'bg-yellow-900/40 border-yellow-700/50', text: 'text-yellow-300' };
  return             { label: 'Not Capable',    bg: 'bg-red-900/40 border-red-700/50',       text: 'text-red-400' };
}

// ── Inline SVG Control Chart ──────────────────────────────────────────────────
function ControlChart({ points, ucl, cl, lcl, label, usl, lsl, color = '#60a5fa' }: {
  points: number[]; ucl: number; cl: number; lcl: number;
  label: string; usl?: number; lsl?: number; color?: string;
}) {
  const W = 600, H = 190, ml = 58, mr = 12, mt = 18, mb = 28;
  const pw = W - ml - mr, ph = H - mt - mb;
  const k = points.length;
  if (k === 0) return null;

  const allVals = [ucl, lcl, cl, ...points,
    ...(usl !== undefined ? [usl] : []),
    ...(lsl !== undefined ? [lsl] : []),
  ].filter(v => isFinite(v));
  const rawMin = Math.min(...allVals), rawMax = Math.max(...allVals);
  const pad = (rawMax - rawMin) * 0.18 || 0.01;
  const yLo = rawMin - pad, yHi = rawMax + pad;

  const sx = (i: number) => ml + (k > 1 ? (i / (k - 1)) * pw : pw / 2);
  const sy = (v: number) => mt + ph * (1 - (v - yLo) / (yHi - yLo));

  const viol = points.map(p => p > ucl || p < lcl);
  const run8 = points.map((_, i) => {
    if (i < 7) return false;
    const side = points[i] >= cl ? 1 : -1;
    return points.slice(i - 7, i + 1).every(x => (x >= cl ? 1 : -1) === side);
  });

  const ticks = 5;
  const tickVals = Array.from({ length: ticks }, (_, i) => yLo + (i / (ticks - 1)) * (yHi - yLo));
  const polyPts = points.map((p, i) => `${sx(i).toFixed(1)},${sy(p).toFixed(1)}`).join(' ');

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 mb-3">
      <div className="text-xs font-bold text-gray-300 mb-1">{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
        {tickVals.map((tv, i) => (
          <g key={i}>
            <line x1={ml} y1={sy(tv).toFixed(1)} x2={W - mr} y2={sy(tv).toFixed(1)} stroke="#374151" strokeWidth="0.5" />
            <text x={ml - 3} y={sy(tv) + 3} textAnchor="end" fontSize="8" fill="#9ca3af">{tv.toFixed(3)}</text>
          </g>
        ))}
        {points.map((_, i) => (i % Math.max(1, Math.ceil(k / 12)) === 0 || i === k - 1) && (
          <text key={i} x={sx(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="#9ca3af">{i + 1}</text>
        ))}
        {usl !== undefined && <>
          <line x1={ml} y1={sy(usl).toFixed(1)} x2={W - mr} y2={sy(usl).toFixed(1)} stroke="#f97316" strokeWidth="1.2" strokeDasharray="5 3" />
          <text x={W - mr - 2} y={sy(usl) - 3} textAnchor="end" fontSize="8" fill="#f97316">USL</text>
        </>}
        {lsl !== undefined && <>
          <line x1={ml} y1={sy(lsl).toFixed(1)} x2={W - mr} y2={sy(lsl).toFixed(1)} stroke="#f97316" strokeWidth="1.2" strokeDasharray="5 3" />
          <text x={W - mr - 2} y={sy(lsl) + 9} textAnchor="end" fontSize="8" fill="#f97316">LSL</text>
        </>}
        <line x1={ml} y1={sy(ucl).toFixed(1)} x2={W - mr} y2={sy(ucl).toFixed(1)} stroke="#f87171" strokeWidth="1.5" strokeDasharray="6 3" />
        <text x={ml + 3} y={sy(ucl) - 3} fontSize="8" fill="#f87171">UCL={ucl.toFixed(4)}</text>
        <line x1={ml} y1={sy(cl).toFixed(1)} x2={W - mr} y2={sy(cl).toFixed(1)} stroke="#4ade80" strokeWidth="1.5" />
        <text x={ml + 3} y={sy(cl) - 3} fontSize="8" fill="#4ade80">CL={cl.toFixed(4)}</text>
        {lcl > yLo + pad * 0.3 && <>
          <line x1={ml} y1={sy(lcl).toFixed(1)} x2={W - mr} y2={sy(lcl).toFixed(1)} stroke="#f87171" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x={ml + 3} y={sy(lcl) + 9} fontSize="8" fill="#f87171">LCL={lcl.toFixed(4)}</text>
        </>}
        {k > 1 && <polyline points={polyPts} fill="none" stroke={color} strokeWidth="1.5" />}
        {points.map((p, i) => (
          <circle key={i} cx={sx(i).toFixed(1)} cy={sy(p).toFixed(1)} r="4"
            fill={viol[i] ? '#ef4444' : run8[i] ? '#f59e0b' : color}
            stroke={viol[i] ? '#fca5a5' : 'none'} strokeWidth="2" />
        ))}
        <line x1={ml} y1={mt} x2={ml} y2={mt + ph} stroke="#6b7280" strokeWidth="1" />
        <line x1={ml} y1={mt + ph} x2={W - mr} y2={mt + ph} stroke="#6b7280" strokeWidth="1" />
      </svg>
      <div className="flex gap-4 text-xs text-gray-500 mt-1">
        <span><span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-1"></span>OOC violation</span>
        <span><span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-1"></span>Run of 8</span>
        <span><span className="inline-block w-3 border-t border-orange-400 border-dashed mr-1"></span>USL/LSL</span>
      </div>
    </div>
  );
}

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_RAW = `24.98,25.01,25.03,24.99,25.02
25.01,25.02,24.97,25.00,25.03
24.99,25.01,25.02,25.00,24.98
25.03,24.98,25.01,25.02,24.99
25.00,25.02,25.01,25.03,24.97
24.97,25.00,25.02,25.01,25.03
25.01,25.03,24.98,25.00,25.02
25.02,24.99,25.01,25.00,25.03
25.00,25.01,24.97,25.02,25.03
25.03,25.00,25.01,24.98,25.02
24.99,25.01,25.03,25.00,25.02
25.01,25.02,24.98,25.00,25.03
25.00,24.99,25.02,25.03,25.01
25.03,25.01,25.00,24.98,25.02
24.98,25.02,25.01,25.00,25.03
25.01,25.00,25.03,24.99,25.02
25.02,25.01,24.97,25.03,25.00
25.00,24.99,25.02,25.01,25.03
25.01,25.03,25.00,24.98,25.02
25.02,25.00,24.99,25.03,25.01`;

export default function SPCPage() {
  const [mainTab, setMainTab] = useState<'calculator' | 'knowledge' | 'guide'>('calculator');
  const [rawData, setRawData]       = useState('');
  const [subgroupSize, setSgSize]   = useState(5);
  const [usl, setUsl]               = useState('');
  const [lsl, setLsl]               = useState('');
  const [charName, setCharName]     = useState('');
  const [unit, setUnit]             = useState('');

  const loadSample = () => {
    setRawData(SAMPLE_RAW);
    setSgSize(5);
    setUsl('25.05');
    setLsl('24.95');
    setCharName('Shaft Diameter');
    setUnit('mm');
    setMainTab('calculator');
  };

  const res = useMemo(() => {
    const nums: number[] = [];
    rawData.split(/[\n,;\t]+/).forEach(s => { const v = parseFloat(s.trim()); if (!isNaN(v)) nums.push(v); });
    const n = subgroupSize;
    if (nums.length < n * 2) return null;
    const k = Math.floor(nums.length / n);
    const data = nums.slice(0, k * n);
    const sgs = Array.from({ length: k }, (_, i) => data.slice(i * n, i * n + n));
    const xbars  = sgs.map(sg => sg.reduce((a, b) => a + b, 0) / n);
    const ranges = sgs.map(sg => Math.max(...sg) - Math.min(...sg));
    const xbar2  = xbars.reduce((a, b) => a + b, 0) / k;
    const rbar   = ranges.reduce((a, b) => a + b, 0) / k;
    const c      = SPC_K[n] ?? SPC_K[5];
    const ucl_x  = xbar2 + c.A2 * rbar;
    const lcl_x  = xbar2 - c.A2 * rbar;
    const ucl_r  = c.D4 * rbar;
    const lcl_r  = c.D3 * rbar;
    const sigmaW = rbar / c.d2;
    const allMean = data.reduce((a, b) => a + b, 0) / data.length;
    const sigmaO  = Math.sqrt(data.reduce((a, b) => a + (b - allMean) ** 2, 0) / (data.length - 1));
    const USL = parseFloat(usl), LSL = parseFloat(lsl);
    const hasSpec = !isNaN(USL) && !isNaN(LSL) && USL > LSL;
    const Cp  = hasSpec ? (USL - LSL) / (6 * sigmaW) : NaN;
    const Cpk = hasSpec ? Math.min((USL - xbar2) / (3 * sigmaW), (xbar2 - LSL) / (3 * sigmaW)) : NaN;
    const Pp  = hasSpec ? (USL - LSL) / (6 * sigmaO) : NaN;
    const Ppk = hasSpec ? Math.min((USL - allMean) / (3 * sigmaO), (allMean - LSL) / (3 * sigmaO)) : NaN;
    const xViol = xbars.filter(x => x > ucl_x || x < lcl_x).length;
    const rViol = ranges.filter(r => r > ucl_r || (lcl_r > 0 && r < lcl_r)).length;
    return { k, n, data, sgs, xbars, ranges, xbar2, rbar, allMean, ucl_x, lcl_x, ucl_r, lcl_r,
      sigmaW, sigmaO, Cp, Cpk, Pp, Ppk, hasSpec, USL, LSL, xViol, rViol,
      stable: xViol === 0 && rViol === 0, consts: c };
  }, [rawData, subgroupSize, usl, lsl]);

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Premium Header ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-900 border-b border-blue-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📈</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">SPC — Statistical Process Control</h1>
                <p className="text-blue-300 text-xs mt-0.5">AIAG SPC 2nd Edition · IATF 16949 Cl. 8.5.1 · X̄-R Charts · Cp / Cpk / Pp / Ppk Calculator</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {res && (
                <>
                  {[
                    { label: 'Cp',  val: res.Cp  },
                    { label: 'Cpk', val: res.Cpk },
                    { label: 'Pp',  val: res.Pp  },
                    { label: 'Ppk', val: res.Ppk },
                  ].map(({ label, val }) => {
                    const r = capRating(val);
                    return (
                      <div key={label} className={`border rounded-xl px-3 py-2 text-center ${r.bg}`}>
                        <div className={`text-lg font-bold ${r.text}`}>{isNaN(val) ? '—' : val.toFixed(3)}</div>
                        <div className="text-xs text-gray-400">{label}</div>
                      </div>
                    );
                  })}
                  <div className={`border rounded-xl px-3 py-2 text-center ${res.stable ? 'bg-green-900/60 border-green-700/50' : 'bg-red-900/60 border-red-700/50'}`}>
                    <div className={`text-sm font-bold ${res.stable ? 'text-green-300' : 'text-red-300'}`}>{res.stable ? '✓ Stable' : '⚠ OOC'}</div>
                    <div className="text-xs text-gray-400">{res.k} subgroups</div>
                  </div>
                </>
              )}
              <button onClick={loadSample} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                🧪 Load Sample
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-blue-800/40">
            {([
              { id: 'calculator', label: '📈 Calculator & Charts' },
              { id: 'knowledge',  label: '📚 Knowledge Hub' },
              { id: 'guide',      label: '📋 Step-by-Step Guide' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                  mainTab === t.id
                    ? 'bg-white/10 text-white border-b-2 border-cyan-400'
                    : 'text-blue-300 hover:text-white hover:bg-white/5'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CALCULATOR TAB ────────────────────────────────────────────────── */}
      {mainTab === 'calculator' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Input */}
              <div className="lg:col-span-1">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                  <h2 className="text-sm font-bold text-white">📊 Study Setup</h2>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Characteristic Name</label>
                    <input className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={charName} onChange={e => setCharName(e.target.value)} placeholder="e.g. Shaft Diameter" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Unit of Measure</label>
                    <input className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={unit} onChange={e => setUnit(e.target.value)} placeholder="mm / N / °C / bar" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Subgroup Size (n)</label>
                    <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={subgroupSize} onChange={e => setSgSize(Number(e.target.value))}>
                      {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>n = {n}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">USL</label>
                      <input type="number" step="any" className="w-full bg-gray-800 border border-orange-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={usl} onChange={e => setUsl(e.target.value)} placeholder="25.05" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">LSL</label>
                      <input type="number" step="any" className="w-full bg-gray-800 border border-orange-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={lsl} onChange={e => setLsl(e.target.value)} placeholder="24.95" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Measurement Data <span className="text-gray-600">(comma / newline separated; each line = one subgroup)</span>
                    </label>
                    <textarea rows={12}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={rawData} onChange={e => setRawData(e.target.value)}
                      placeholder={"25.01, 25.03, 24.98, 25.00, 25.02\n25.02, 24.99, 25.01, 25.03, 24.97\n..."} />
                  </div>
                  {res && <div className="text-xs text-gray-500">{res.data.length} readings · {res.k} subgroups of n={res.n}</div>}
                </div>
              </div>

              {/* Results */}
              <div className="lg:col-span-2 space-y-4">
                {!res ? (
                  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-10 text-center">
                    <div className="text-5xl mb-3">📈</div>
                    <p className="text-gray-400 text-sm mb-4">Enter measurement data to calculate X̄-R control charts and Cp / Cpk capability indices.</p>
                    <button onClick={loadSample} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm px-6 py-2 rounded-xl">Load Sample Data</button>
                  </div>
                ) : (
                  <>
                    {/* Stats Row */}
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                      <h2 className="text-sm font-bold text-white mb-3">
                        {charName || 'Capability Summary'}{unit ? ` (${unit})` : ''}
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {[
                          { label: 'X̄̄ Grand Mean', val: fmt(res.xbar2), sub: unit },
                          { label: 'R̄ Avg Range',   val: fmt(res.rbar),   sub: unit },
                          { label: 'σ̂w (R̄/d₂)',    val: fmt(res.sigmaW, 5), sub: 'Within-subgroup' },
                          { label: 'σo Overall',     val: fmt(res.sigmaO, 5), sub: 'Long-term' },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-cyan-300">{s.val}</div>
                            <div className="text-xs text-gray-400 leading-tight">{s.label}</div>
                            <div className="text-xs text-gray-600">{s.sub}</div>
                          </div>
                        ))}
                      </div>

                      {res.hasSpec ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'Cp',  val: res.Cp,  desc: 'Potential (short-term)' },
                            { label: 'Cpk', val: res.Cpk, desc: 'Actual (short-term)' },
                            { label: 'Pp',  val: res.Pp,  desc: 'Potential (long-term)' },
                            { label: 'Ppk', val: res.Ppk, desc: 'Actual (long-term)' },
                          ].map(c => {
                            const r = capRating(c.val);
                            return (
                              <div key={c.label} className={`border rounded-xl p-3 text-center ${r.bg}`}>
                                <div className={`text-2xl font-bold ${r.text}`}>{fmt(c.val, 3)}</div>
                                <div className="text-sm text-white font-semibold">{c.label}</div>
                                <div className="text-xs text-gray-400">{c.desc}</div>
                                <div className={`text-xs mt-1 font-semibold ${r.text}`}>{r.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 text-xs text-amber-300">
                          Enter USL and LSL above to calculate Cp, Cpk, Pp, Ppk.
                        </div>
                      )}

                      <div className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${res.stable ? 'bg-green-900/20 border border-green-800/40 text-green-300' : 'bg-red-900/20 border border-red-800/40 text-red-300'}`}>
                        <span className="text-base flex-shrink-0">{res.stable ? '✅' : '⚠️'}</span>
                        <span>
                          {res.stable
                            ? 'Process is statistically stable — no out-of-control signals detected.'
                            : `Process NOT stable — ${res.xViol} X̄ violation(s), ${res.rViol} R violation(s). Investigate special causes before interpreting Cpk.`}
                        </span>
                      </div>
                    </div>

                    {/* X-bar Chart */}
                    <ControlChart
                      points={res.xbars} ucl={res.ucl_x} cl={res.xbar2} lcl={res.lcl_x}
                      label={`X̅ Chart — Subgroup Means (k=${res.k}, n=${res.n})`}
                      usl={res.hasSpec ? res.USL : undefined}
                      lsl={res.hasSpec ? res.LSL : undefined}
                      color="#60a5fa"
                    />

                    {/* R Chart */}
                    <ControlChart
                      points={res.ranges} ucl={res.ucl_r} cl={res.rbar} lcl={res.lcl_r}
                      label={`R Chart — Subgroup Ranges (UCL=${fmt(res.ucl_r)} · CL=${fmt(res.rbar)} · LCL=${fmt(res.lcl_r)})`}
                      color="#34d399"
                    />

                    {/* Constants & Limits Table */}
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-white mb-3">Control Limits &amp; SPC Constants (n={res.n})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {[
                          ['d₂', fmt(res.consts.d2, 3)], ['A₂', fmt(res.consts.A2, 3)],
                          ['D₄', fmt(res.consts.D4, 3)], ['D₃', fmt(res.consts.D3, 3)],
                          ['X̄ UCL', fmt(res.ucl_x, 5)], ['X̄ LCL', fmt(res.lcl_x, 5)],
                          ['R UCL', fmt(res.ucl_r, 5)],  ['R LCL', fmt(res.lcl_r, 5)],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="bg-gray-800 rounded-lg px-3 py-2">
                            <div className="text-gray-500">{lbl}</div>
                            <div className="text-white font-semibold">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-white mb-3">Subgroup Data Table</h3>
                      <div className="overflow-x-auto max-h-56">
                        <table className="text-xs w-full border-collapse">
                          <thead className="bg-gray-800 sticky top-0">
                            <tr>
                              <th className="border border-gray-700 px-2 py-1.5 text-left text-gray-300">Sg</th>
                              {Array.from({ length: res.n }, (_, i) => (
                                <th key={i} className="border border-gray-700 px-2 py-1.5 text-center text-gray-400">x{i+1}</th>
                              ))}
                              <th className="border border-gray-700 px-2 py-1.5 text-center text-cyan-300">X̄</th>
                              <th className="border border-gray-700 px-2 py-1.5 text-center text-green-300">R</th>
                            </tr>
                          </thead>
                          <tbody>
                            {res.xbars.map((xb, i) => {
                              const sg = res.sgs[i];
                              const xv = xb > res.ucl_x || xb < res.lcl_x;
                              const rv = res.ranges[i] > res.ucl_r;
                              return (
                                <tr key={i} className={i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'}>
                                  <td className="border border-gray-700 px-2 py-1 text-gray-500">{i+1}</td>
                                  {sg.map((v, j) => (
                                    <td key={j} className="border border-gray-700 px-2 py-1 text-center text-gray-300">{v.toFixed(3)}</td>
                                  ))}
                                  <td className={`border border-gray-700 px-2 py-1 text-center font-semibold ${xv ? 'text-red-400' : 'text-cyan-300'}`}>{xb.toFixed(4)}</td>
                                  <td className={`border border-gray-700 px-2 py-1 text-center font-semibold ${rv ? 'text-red-400' : 'text-green-300'}`}>{res.ranges[i].toFixed(4)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KNOWLEDGE HUB TAB ─────────────────────────────────────────────── */}
      {mainTab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-gray-900 border border-cyan-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">📈 What is SPC?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">Statistical Process Control uses statistical methods to monitor and control manufacturing processes — detecting special-cause variation before it produces defects. Pioneered by Walter Shewhart (Bell Labs, 1920s), popularized by W. Edwards Deming in post-war Japan. The goal: prevent defects through process monitoring, not detect them through inspection.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4">
                  <div className="text-blue-300 font-semibold text-sm mb-2">🎯 Common Cause Variation</div>
                  <p className="text-gray-400 text-xs">Inherent, random variation in every process. Predictable, stable. Process is "in control." Reducing this requires system-level changes — management responsibility (not operator).</p>
                </div>
                <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
                  <div className="text-red-300 font-semibold text-sm mb-2">⚡ Special Cause Variation</div>
                  <p className="text-gray-400 text-xs">Unexpected, assignable causes: tool wear, material change, operator change, machine fault. Shows as out-of-control signals on charts. Operator/engineer must find and eliminate.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">🎯 Capability Indices — Cp, Cpk, Pp, Ppk</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {[
                  { idx: 'Cp',  formula: '(USL − LSL) / (6σ̂w)', desc: 'Potential capability — assumes centered process. Uses within-subgroup sigma (R̄/d₂). Measures if process width fits within tolerance.' },
                  { idx: 'Cpk', formula: 'min[(USL−X̄)/(3σ̂w), (X̄−LSL)/(3σ̂w)]', desc: 'Actual short-term capability — accounts for centering. Always ≤ Cp. If Cp >> Cpk, process is off-center.' },
                  { idx: 'Pp',  formula: '(USL − LSL) / (6σo)', desc: 'Performance potential — uses overall (long-term) sigma from all individual values. Used for PPAP initial capability.' },
                  { idx: 'Ppk', formula: 'min[(USL−X̄)/(3σo), (X̄−LSL)/(3σo)]', desc: 'Actual long-term performance including centering. Used for initial capability reports. Convert to Cpk after sustained production.' },
                ].map(c => (
                  <div key={c.idx} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-cyan-300">{c.idx}</span>
                      <code className="text-xs text-gray-400 bg-gray-700 rounded px-2 py-0.5">{c.formula}</code>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-800">
                      {['Cpk / Ppk', 'Rating', 'Action Required', 'PPAP Requirement'].map(h => (
                        <th key={h} className="border border-gray-700 px-3 py-2 text-left text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['≥ 1.67', 'World Class', 'None — consider reducing sampling frequency', 'Exceeds requirement; customer may allow reduced sampling', 'text-emerald-300'],
                      ['1.33 – 1.67', 'Capable', 'Continue monitoring; document in Control Plan', 'Meets PPAP Level 1 requirement (CC/SC need ≥ 1.33)', 'text-green-300'],
                      ['1.00 – 1.33', 'Marginal', 'Increase monitoring; investigate centering; improvement plan', 'Conditional acceptance — improvement plan required', 'text-yellow-300'],
                      ['< 1.00', 'Not Capable', 'STOP — 100% inspect until improved. Issue CAPA. Do not ship without containment.', 'PPAP rejected. Customer deviation required.', 'text-red-400'],
                    ].map(([range, rating, action, ppap, col], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'}>
                        <td className={`border border-gray-700 px-3 py-2 font-bold ${col}`}>{range}</td>
                        <td className={`border border-gray-700 px-3 py-2 font-semibold ${col}`}>{rating}</td>
                        <td className="border border-gray-700 px-3 py-2 text-gray-300">{action}</td>
                        <td className="border border-gray-700 px-3 py-2 text-gray-400">{ppap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-900 border border-blue-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">📊 Control Chart Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: 'X̄-R Chart', type: 'Variables', use: 'Subgroup n = 2–10. Most common in automotive. Monitors mean AND range simultaneously.', when: 'Bore diameter, torque, thickness, weight' },
                  { title: 'X̄-S Chart', type: 'Variables', use: 'Subgroup n > 10. Better statistical power using std deviation instead of range.', when: 'Automated measurement with large sample sizes' },
                  { title: 'I-MR Chart', type: 'Variables', use: 'n = 1 per period. Slow processes or destructive tests. One reading per time point.', when: 'Chemical batches, hardness tests, temperature cycles' },
                  { title: 'p Chart', type: 'Attribute', use: 'Fraction defective. Variable sample sizes allowed. np ≥ 5 required.', when: 'Final inspection pass/fail rate, defective units per lot' },
                  { title: 'np Chart', type: 'Attribute', use: 'Number defective. Requires constant sample size.', when: 'Incoming inspection with fixed AQL sample size' },
                  { title: 'c / u Chart', type: 'Attribute', use: 'Count of defects per unit (c = constant area; u = variable area).', when: 'Paint defects per panel, solder defects per PCB' },
                ].map(c => (
                  <div key={c.title} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cyan-300 font-bold text-sm">{c.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${c.type === 'Variables' ? 'bg-blue-800/60 text-blue-300' : 'bg-purple-800/60 text-purple-300'}`}>{c.type}</span>
                    </div>
                    <p className="text-gray-400 text-xs mb-1">{c.use}</p>
                    <p className="text-gray-600 text-xs"><strong className="text-gray-500">Use for:</strong> {c.when}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">⚠️ Western Electric / Nelson Out-of-Control Rules</h2>
              <div className="space-y-2">
                {[
                  ['Rule 1', '1 point beyond 3σ (outside UCL or LCL)', '0.27%', 'Immediate investigation. Stop process if critical characteristic.'],
                  ['Rule 2', '2 of 3 consecutive points beyond 2σ (same side)', '0.87%', 'Trend emerging — check machine, tool, or material change.'],
                  ['Rule 3', '4 of 5 consecutive points beyond 1σ (same side)', '0.55%', 'Systematic shift — check setup, operator, or raw material lot.'],
                  ['Rule 4', '8 consecutive points on same side of centerline', '0.39%', 'Process has shifted — check tool wear, gradual temperature drift.'],
                  ['Rule 5', '6 consecutive points trending up or down', '0.006%', 'Tool wear or gradual contamination buildup. Investigate and adjust.'],
                  ['Rule 6', '15 points in a row within ±1σ (stratification)', 'Rare', 'Subgroups may include mixed processes — review sampling plan.'],
                ].map(([rule, signal, prob, action]) => (
                  <div key={rule} className="flex gap-3 bg-red-900/10 border border-red-900/30 rounded-xl px-4 py-3">
                    <div className="flex-shrink-0 w-14 text-red-400 font-bold text-xs pt-0.5">{rule}</div>
                    <div className="flex-1">
                      <div className="text-white text-xs font-semibold">{signal} <span className="text-gray-600 font-normal">(P≈{prob})</span></div>
                      <div className="text-gray-400 text-xs mt-0.5">{action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── GUIDE TAB ─────────────────────────────────────────────────────── */}
      {mainTab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Run an SPC Capability Study</h2>
              <p className="text-gray-400 text-sm mt-1">Aligned with AIAG SPC 2nd Edition and IATF 16949 Cl. 8.5.1</p>
            </div>

            {[
              { step:1, icon:'📋', color:'cyan',   title:'Define Characteristic & Select Chart Type',
                body:'Identify the characteristic from your Control Plan (Fields 18/19). Variable data (measured) → X̄-R or I-MR chart. Attribute data (pass/fail) → p or np chart. CC/SC characteristics must use variable data and SPC. Confirm USL and LSL from engineering drawing.' },
              { step:2, icon:'🔬', color:'blue',   title:'Validate the Measurement System (MSA / GRR)',
                body:'Before starting a capability study, complete a Gauge R&R study. %R&R must be ≤ 10% (acceptable) or ≤ 30% (conditionally acceptable). A poor gauge hides true process capability — Cpk from a bad measurement system is unreliable. Document GRR results; reference them in the Control Plan.' },
              { step:3, icon:'📊', color:'indigo', title:'Collect Initial Study Data (≥ 25 subgroups)',
                body:'Collect minimum 25 subgroups × n=5 = 125 readings (AIAG recommendation). Subgroups must be from consecutive production — not cherry-picked. Record in real time. One subgroup = one rational subgroup from the same machine, shift, and material lot. Note any process events during collection.' },
              { step:4, icon:'📈', color:'purple', title:'Plot Control Charts & Check Stability',
                body:'Calculate X̄ and R for each subgroup. Compute UCL, CL, LCL. Plot both charts. Check for Western Electric rule violations. CRITICAL: If process is NOT stable (OOC signals present), DO NOT calculate Cpk. Identify and eliminate special causes first, then recollect data on the stable process.' },
              { step:5, icon:'🧮', color:'green',  title:'Calculate Capability Indices',
                body:'Only calculate Cpk once process is stable. Initial study → Pp/Ppk (overall sigma). Ongoing production → Cp/Cpk (within sigma = R̄/d₂). Target: Cpk ≥ 1.67 for CC, Cpk ≥ 1.33 for SC. If Cp >> Cpk → off-center, adjust mean. If Cp ≈ Cpk but both low → variation too wide, reduce σ.' },
              { step:6, icon:'📝', color:'amber',  title:'Document & Submit',
                body:'Record: characteristic name and number, sample size and subgroup size, control chart with limits, all four capability indices, GRR reference, date and responsible person. For PPAP: submit as Element 9 (Control Plan) and Element 19 (MSA results). For CC: customer may require on-site witnessing.' },
              { step:7, icon:'🔄', color:'rose',   title:'Ongoing Monitoring & Review',
                body:'Transfer study control limits to production chart. Update Control Plan with confirmed sample frequency. Review capability quarterly or after 300+ new data points. Trigger immediate review after: customer complaint, process change, new material lot, or 3+ consecutive OOC signals.' },
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="text-cyan-300 font-bold text-sm">{s.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">❌ Common SPC Mistakes</h2>
              <div className="space-y-3">
                {[
                  ['Calculating Cpk on an unstable process', 'Verify stability first. OOC points distort sigma estimates, making Cpk meaningless.'],
                  ['Using Pp/Ppk as ongoing Cp/Cpk', 'Initial study → Pp/Ppk (overall sigma). Ongoing production → Cp/Cpk (within sigma). They measure different things.'],
                  ['Poor gauge (GRR > 30%) used for capability study', 'A bad gauge makes a capable process look incapable. Always do MSA before SPC study.'],
                  ['Cherry-picking "good" subgroups', 'SPC requires consecutive, rational subgroups. Skipping bad readings invalidates the study.'],
                  ['Plotting chart but not reacting to OOC signals', 'A chart with no defined reaction plan is decoration. Reaction plan must be in the Control Plan.'],
                  ['Time-based sampling instead of volume-based', 'Use volume-based frequency (every 200 pieces) for consistent sensitivity regardless of production speed.'],
                ].map(([m, f], i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                      <span className="text-red-400 text-sm flex-shrink-0">✗</span>
                      <p className="text-red-300 text-xs">{m}</p>
                    </div>
                    <div className="flex items-start gap-2 bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                      <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                      <p className="text-green-300 text-xs">{f}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🎯 IATF Auditor Questions — Be Ready</h2>
              <div className="space-y-2">
                {[
                  'Show me the control chart for this CC characteristic. What are the current UCL and LCL?',
                  'This chart shows a point beyond UCL 3 weeks ago. What was the corrective action and when was it completed?',
                  'What is the current Cpk for this characteristic? Is it documented in your Control Plan?',
                  'How was the sample size and frequency determined? Is it statistically justified?',
                  'Do you have a GRR study for this gauge? What was the %R&R result?',
                  'When process goes out of control, who is responsible and what is the maximum response time?',
                  'Has the capability index been recalculated after the last machine maintenance?',
                  'Your Control Plan specifies SPC — can I see the last 25 subgroups and confirm the chart is current?',
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-3 bg-purple-900/20 border border-purple-800/30 rounded-lg px-4 py-3">
                    <span className="text-purple-400 font-bold text-sm flex-shrink-0">Q{i+1}</span>
                    <p className="text-gray-300 text-xs leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
