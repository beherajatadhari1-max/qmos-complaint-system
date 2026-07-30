'use client';
import { useState, useMemo } from 'react';

// ── MSA Constants — AIAG MSA 4th Edition (Average & Range Method) ─────────────
const K1: Record<number, number> = { 2: 4.56, 3: 3.05 };          // EV factor (trials)
const K2: Record<number, number> = { 2: 3.65, 3: 2.70, 4: 2.30 }; // AV factor (operators)
const K3: Record<number, number> = {                                // PV factor (parts)
  2: 3.65, 3: 2.70, 4: 2.30, 5: 2.08,
  6: 1.93, 7: 1.82, 8: 1.74, 9: 1.67, 10: 1.62,
};
const D4: Record<number, number> = { 2: 3.267, 3: 2.574 };        // UCL_R factor (trials)

// ── Helpers ──────────────────────────────────────────────────────────────────
function initData(nOps: number, nTrials: number, nParts: number): string[][][] {
  return Array.from({ length: nOps }, () =>
    Array.from({ length: nTrials }, () =>
      Array.from({ length: nParts }, () => '')));
}

function grrRating(pct: number) {
  if (pct < 10)  return { label: 'Acceptable',   bg: 'bg-green-900/40 border-green-700/50',   text: 'text-green-300',  icon: '✅' };
  if (pct <= 30) return { label: 'Conditional',  bg: 'bg-yellow-900/40 border-yellow-700/50', text: 'text-yellow-300', icon: '⚠️' };
  return           { label: 'Unacceptable', bg: 'bg-red-900/40 border-red-700/50',     text: 'text-red-400',   icon: '❌' };
}
function ndcRating(ndc: number) {
  if (ndc >= 5) return { label: `${ndc} — Acceptable`, text: 'text-green-300' };
  if (ndc >= 2) return { label: `${ndc} — Marginal`,   text: 'text-yellow-300' };
  return          { label: `${ndc} — Unacceptable`, text: 'text-red-400' };
}

const inp = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500';
const lbl = 'text-xs text-gray-400 block mb-1';
const f4  = (n: number) => isNaN(n) ? '—' : n.toFixed(4);
const f2  = (n: number) => isNaN(n) ? '—' : n.toFixed(2);

// ── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE: string[][][] = [
  [ // Operator A
    ['24.971','24.984','24.993','25.001','25.007','25.016','25.021','25.031','25.037','25.046'],
    ['24.970','24.986','24.992','25.002','25.009','25.014','25.022','25.029','25.038','25.045'],
  ],
  [ // Operator B
    ['24.972','24.985','24.994','25.001','25.008','25.016','25.022','25.030','25.038','25.047'],
    ['24.971','24.984','24.993','25.000','25.007','25.015','25.021','25.031','25.037','25.046'],
  ],
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function MSAPage() {
  const [mainTab, setMainTab] = useState<'calculator' | 'knowledge' | 'guide'>('calculator');

  const [charName, setCharName] = useState('');
  const [unit, setUnit]         = useState('');
  const [uslStr, setUslStr]     = useState('');
  const [lslStr, setLslStr]     = useState('');
  const [nParts, setNParts]     = useState(10);
  const [nOps, setNOps]         = useState(2);
  const [nTrials, setNTrials]   = useState(2);
  const [opNames, setOpNames]   = useState(['Operator A', 'Operator B', 'Operator C']);
  const [data, setData]         = useState<string[][][]>(() => initData(2, 2, 10));

  const setOpName = (i: number, v: string) =>
    setOpNames(prev => { const n = [...prev]; n[i] = v; return n; });

  const setCell = (op: number, trial: number, part: number, val: string) =>
    setData(prev => {
      const next = prev.map(o => o.map(t => [...t]));
      next[op][trial][part] = val;
      return next;
    });

  const handleSetup = (newOps: number, newTrials: number, newParts: number) => {
    setNOps(newOps); setNTrials(newTrials); setNParts(newParts);
    setData(initData(newOps, newTrials, newParts));
  };

  const loadSample = () => {
    setCharName('Shaft Diameter'); setUnit('mm');
    setUslStr('25.050'); setLslStr('24.950');
    setNParts(10); setNOps(2); setNTrials(2);
    setOpNames(['Operator A', 'Operator B', 'Operator C']);
    setData(SAMPLE.map(o => o.map(t => [...t])));
  };

  // ── Calculations ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    const parsed: number[][][] = data.map(o => o.map(t => t.map(v => parseFloat(v))));
    const validCount = parsed.flat(2).filter(v => !isNaN(v)).length;
    if (validCount < nOps * nTrials * nParts) return null;

    const ranges: number[][] = Array.from({ length: nOps }, (_, o) =>
      Array.from({ length: nParts }, (_, p) => {
        const vals = Array.from({ length: nTrials }, (_, t) => parsed[o][t][p]);
        return Math.max(...vals) - Math.min(...vals);
      })
    );

    const rBarOp = ranges.map(ro => ro.reduce((a, b) => a + b, 0) / nParts);
    const rBarBar = rBarOp.reduce((a, b) => a + b, 0) / nOps;
    const uclR = D4[nTrials] * rBarBar;

    const EV = rBarBar * (K1[nTrials] ?? 0);

    const xBarOp = Array.from({ length: nOps }, (_, o) => {
      const all = parsed[o].flat();
      return all.reduce((a, b) => a + b, 0) / all.length;
    });
    const xBarDiff = Math.max(...xBarOp) - Math.min(...xBarOp);

    const avSq = Math.pow(xBarDiff * (K2[nOps] ?? 0), 2) - Math.pow(EV, 2) / (nParts * nTrials);
    const AV = avSq > 0 ? Math.sqrt(avSq) : 0;

    const GRR = Math.sqrt(EV * EV + AV * AV);

    const partAvg = Array.from({ length: nParts }, (_, p) => {
      let sum = 0;
      for (let o = 0; o < nOps; o++)
        for (let t = 0; t < nTrials; t++) sum += parsed[o][t][p];
      return sum / (nOps * nTrials);
    });
    const Rp = Math.max(...partAvg) - Math.min(...partAvg);
    const PV = Rp * (K3[nParts] ?? 0);

    const TV = Math.sqrt(GRR * GRR + PV * PV);

    const pctEV  = TV > 0 ? 100 * EV / TV : 0;
    const pctAV  = TV > 0 ? 100 * AV / TV : 0;
    const pctGRR = TV > 0 ? 100 * GRR / TV : 0;
    const pctPV  = TV > 0 ? 100 * PV / TV : 0;

    const ndc = GRR > 0 ? Math.floor(1.41 * PV / GRR) : 0;

    const usl = parseFloat(uslStr), lsl = parseFloat(lslStr);
    const tol = usl - lsl;
    const pctPT = !isNaN(tol) && tol > 0 ? 100 * GRR / tol : null;

    return { EV, AV, GRR, PV, TV, pctEV, pctAV, pctGRR, pctPV, ndc, pctPT, rBarBar, uclR, rBarOp, xBarOp, partAvg, ranges, Rp };
  }, [data, nOps, nTrials, nParts, uslStr, lslStr]);

  const rating = results ? grrRating(results.pctGRR) : { label: '', bg: '', text: '', icon: '' };

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-950 via-cyan-950 to-slate-900 border-b border-teal-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔬</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">MSA — Measurement System Analysis</h1>
                <p className="text-cyan-300 text-xs mt-0.5">AIAG MSA 4th Edition · GRR (Avg &amp; Range) · %GRR · %P/T · ndc · IATF 16949 Cl. 7.1.5</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {results && (
                <div className={`border rounded-xl px-4 py-2 text-center ${rating.bg}`}>
                  <div className={`text-sm font-bold ${rating.text}`}>{rating.icon} {rating.label}</div>
                  <div className="text-xs text-gray-500">%GRR = {f2(results.pctGRR)}%</div>
                </div>
              )}
              {results && (
                <div className="bg-cyan-900/60 border border-cyan-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-cyan-300">{results.ndc}</div>
                  <div className="text-xs text-cyan-400">ndc</div>
                </div>
              )}
              {results && results.pctPT !== null && (
                <div className={`border rounded-xl px-3 py-2 text-center ${results.pctPT < 10 ? 'bg-green-900/60 border-green-700/50' : results.pctPT <= 30 ? 'bg-yellow-900/60 border-yellow-700/50' : 'bg-red-900/60 border-red-700/50'}`}>
                  <div className={`text-xl font-bold ${results.pctPT < 10 ? 'text-green-300' : results.pctPT <= 30 ? 'text-yellow-300' : 'text-red-400'}`}>{f2(results.pctPT)}%</div>
                  <div className="text-xs text-gray-400">%P/T</div>
                </div>
              )}
              <button onClick={loadSample} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                🧪 Load Sample
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-teal-800/40">
            {([
              { id: 'calculator', label: '🔬 GRR Calculator' },
              { id: 'knowledge',  label: '📚 Knowledge Hub' },
              { id: 'guide',      label: '📋 Step-by-Step Guide' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                  mainTab === t.id
                    ? 'bg-white/10 text-white border-b-2 border-cyan-400'
                    : 'text-cyan-300 hover:text-white hover:bg-white/5'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CALCULATOR TAB ─────────────────────────────────────────────────── */}
      {mainTab === 'calculator' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* Setup */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4">⚙️ Study Setup</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="md:col-span-2">
                  <label className={lbl}>Characteristic Name</label>
                  <input className={inp} value={charName} onChange={e => setCharName(e.target.value)} placeholder="e.g. Shaft Diameter" />
                </div>
                <div>
                  <label className={lbl}>Unit</label>
                  <input className={inp} value={unit} onChange={e => setUnit(e.target.value)} placeholder="mm / kg / N..." />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={lbl}>Parts</label>
                    <select className={inp} value={nParts} onChange={e => handleSetup(nOps, nTrials, Number(e.target.value))}>
                      {[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Ops</label>
                    <select className={inp} value={nOps} onChange={e => handleSetup(Number(e.target.value), nTrials, nParts)}>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Trials</label>
                    <select className={inp} value={nTrials} onChange={e => handleSetup(nOps, Number(e.target.value), nParts)}>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={lbl}>USL</label>
                  <input className={inp} type="number" step="any" value={uslStr} onChange={e => setUslStr(e.target.value)} placeholder="25.050" />
                </div>
                <div>
                  <label className={lbl}>LSL</label>
                  <input className={inp} type="number" step="any" value={lslStr} onChange={e => setLslStr(e.target.value)} placeholder="24.950" />
                </div>
                {Array.from({ length: nOps }, (_, i) => (
                  <div key={i}>
                    <label className={lbl}>Operator {i+1} Name</label>
                    <input className={inp} value={opNames[i]} onChange={e => setOpName(i, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Data Entry Grid */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-700">
                <h2 className="text-sm font-bold text-white">
                  📊 Measurement Data — {nParts} parts × {nOps} operators × {nTrials} trials = {nParts * nOps * nTrials} readings
                  {charName && <span className="ml-2 text-cyan-400 font-normal">[{charName}{unit ? ` (${unit})` : ''}]</span>}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="border border-gray-700 px-3 py-2 text-gray-400 text-left w-16">Part #</th>
                      {Array.from({ length: nOps }, (_, o) =>
                        Array.from({ length: nTrials }, (_, t) => (
                          <th key={`${o}-${t}`} className="border border-gray-700 px-2 py-2 text-center">
                            <div className="text-gray-300 font-semibold">{opNames[o] ?? `Op ${o+1}`}</div>
                            <div className="text-gray-500 font-normal">Trial {t+1}</div>
                          </th>
                        ))
                      )}
                      <th className="border border-gray-700 px-2 py-2 text-center text-gray-500 bg-gray-800/80">Part Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: nParts }, (_, p) => {
                      const pAvg = results ? results.partAvg[p] : null;
                      return (
                        <tr key={p} className={p % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/10'}>
                          <td className="border border-gray-700 px-3 py-1 text-gray-400 font-mono text-center">{p + 1}</td>
                          {Array.from({ length: nOps }, (_, o) =>
                            Array.from({ length: nTrials }, (_, t) => {
                              const isOutlier = results && results.ranges[o]?.[p] > results.uclR;
                              return (
                                <td key={`${o}-${t}`} className={`border border-gray-700 px-1 py-0.5 ${isOutlier ? 'bg-red-900/30' : ''}`}>
                                  <input
                                    type="number" step="any"
                                    className={`w-24 bg-transparent text-white text-xs text-center focus:outline-none focus:bg-gray-700 rounded px-1 py-1 ${isOutlier ? 'text-red-400' : ''}`}
                                    value={data[o]?.[t]?.[p] ?? ''}
                                    onChange={e => setCell(o, t, p, e.target.value)}
                                    placeholder="0.000"
                                  />
                                </td>
                              );
                            })
                          )}
                          <td className="border border-gray-700 px-2 py-1 text-center text-cyan-400 font-mono text-xs">
                            {pAvg !== null && pAvg !== undefined ? f4(pAvg) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {results && (
                    <tfoot className="bg-gray-800 border-t-2 border-gray-600">
                      <tr>
                        <td className="border border-gray-700 px-3 py-2 text-gray-400 font-bold text-xs">Op Avg (X̄)</td>
                        {Array.from({ length: nOps }, (_, o) =>
                          Array.from({ length: nTrials }, (_, t) => (
                            <td key={`${o}-${t}`} className="border border-gray-700 px-2 py-2 text-center">
                              {t === 0 ? <span className="text-amber-400 font-mono text-xs">{f4(results.xBarOp[o])}</span> : <span className="text-gray-600 text-xs">—</span>}
                            </td>
                          ))
                        )}
                        <td className="border border-gray-700 px-2 py-2 text-center text-gray-600 text-xs">—</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 px-3 py-2 text-gray-400 font-bold text-xs">R̄ (Op Range)</td>
                        {Array.from({ length: nOps }, (_, o) =>
                          Array.from({ length: nTrials }, (_, t) => (
                            <td key={`${o}-${t}`} className="border border-gray-700 px-2 py-2 text-center">
                              {t === 0 ? <span className="text-purple-400 font-mono text-xs">{f4(results.rBarOp[o])}</span> : <span className="text-gray-600 text-xs">—</span>}
                            </td>
                          ))
                        )}
                        <td className="border border-gray-700 px-2 py-2 text-center text-gray-600 text-xs">—</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-white mb-4">📐 Variance Components (5.15σ basis)</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'EV — Repeatability',  value: results.EV,  pct: results.pctEV,  color: 'bg-blue-500',   desc: 'Gauge/instrument variation — same operator, same part' },
                      { label: 'AV — Reproducibility', value: results.AV, pct: results.pctAV,  color: 'bg-purple-500', desc: 'Operator-to-operator variation' },
                      { label: 'GRR — Total MSE',      value: results.GRR, pct: results.pctGRR, color: results.pctGRR < 10 ? 'bg-green-500' : results.pctGRR <= 30 ? 'bg-yellow-500' : 'bg-red-500', desc: 'Combined measurement system error' },
                      { label: 'PV — Part Variation',  value: results.PV,  pct: results.pctPV,  color: 'bg-cyan-500',   desc: 'True part-to-part variation in the study sample' },
                      { label: 'TV — Total Variation', value: results.TV,  pct: 100,            color: 'bg-gray-500',   desc: 'Total observed variation' },
                    ].map(row => (
                      <div key={row.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-300 font-semibold">{row.label}</span>
                          <span className="text-xs font-mono text-white">{f4(row.value)} {unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${Math.min(100, row.pct)}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">{f2(row.pct)}%</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{row.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`border rounded-2xl p-5 ${rating.bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-white">🎯 GRR Verdict</h2>
                      <span className={`text-lg font-bold ${rating.text}`}>{rating.icon} {rating.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                        <div className={`text-2xl font-bold ${rating.text}`}>{f2(results.pctGRR)}%</div>
                        <div className="text-xs text-gray-400">%GRR (of TV)</div>
                      </div>
                      {results.pctPT !== null && (
                        <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                          <div className={`text-2xl font-bold ${results.pctPT < 10 ? 'text-green-300' : results.pctPT <= 30 ? 'text-yellow-300' : 'text-red-400'}`}>{f2(results.pctPT)}%</div>
                          <div className="text-xs text-gray-400">%P/T ratio</div>
                        </div>
                      )}
                    </div>
                    <p className={`mt-3 text-xs ${rating.text}`}>
                      {results.pctGRR < 10 && 'Measurement system is capable. Safe to use for SPC and capability studies.'}
                      {results.pctGRR >= 10 && results.pctGRR <= 30 && 'Marginal — may be acceptable for go/no-go gauging. Investigate before using for SPC.'}
                      {results.pctGRR > 30 && 'Measurement system is not acceptable. Identify and eliminate variation sources before proceeding.'}
                    </p>
                  </div>

                  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-white mb-3">📊 Key Statistics</h2>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['R̄̄ (Grand Avg Range)', f4(results.rBarBar), unit],
                        ['UCL_R',               f4(results.uclR),    unit],
                        ['Part Range (Rp)',      f4(results.Rp),      unit],
                        ['ndc',                 ndcRating(results.ndc).label, ''],
                        ['%EV (Repeatability)', f2(results.pctEV) + '%', 'of TV'],
                        ['%AV (Reproducibility)', f2(results.pctAV) + '%', 'of TV'],
                        ['%PV (Part Variation)', f2(results.pctPV) + '%', 'of TV'],
                        ['K1 (EV factor)',      String(K1[nTrials] ?? '—'), `t=${nTrials}`],
                        ['K2 (AV factor)',      String(K2[nOps] ?? '—'),   `ops=${nOps}`],
                        ['K3 (PV factor)',      String(K3[nParts] ?? '—'), `n=${nParts}`],
                      ].map(([l, v, s]) => (
                        <div key={l} className="bg-gray-800 rounded-lg px-3 py-2">
                          <div className="text-gray-500">{l}</div>
                          <div className="text-white font-semibold mt-0.5">{v} <span className="text-gray-600 font-normal">{s}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-xs text-gray-500">
                    <p className="font-bold text-gray-400 mb-1">AIAG Acceptance Criteria</p>
                    <p>%GRR &lt; 10% ✅ · 10–30% ⚠️ · &gt;30% ❌ &nbsp;|&nbsp; ndc ≥ 5 ✅ &nbsp;|&nbsp; %P/T &lt; 10% ✅</p>
                  </div>
                </div>

              </div>
            )}

            {!results && (
              <div className="bg-gray-900 border border-gray-700 border-dashed rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-gray-400 text-sm">Enter all measurements above to calculate GRR results.</p>
                <p className="text-gray-600 text-xs mt-1">Or click <span className="text-cyan-400">🧪 Load Sample</span> to see a worked example.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── KNOWLEDGE HUB TAB ─────────────────────────────────────────────── */}
      {mainTab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-gray-900 border border-cyan-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">🔬 What is MSA?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Measurement System Analysis (MSA) evaluates whether a measurement system is adequate for its intended use. Before trusting any data for SPC, capability studies, or acceptance inspection, you must prove the measurement system is not introducing unacceptable error. A gauge contributing 40% of observed variation makes any Cpk calculation meaningless.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon:'🎯', title:'Purpose', desc:'Quantify how much of the observed product variation is due to the measurement system vs. real part-to-part variation.' },
                  { icon:'📋', title:'Standard', desc:'AIAG MSA 4th Edition (2010). Required under IATF 16949 Cl. 7.1.5 for all gauges used to monitor CC and SC characteristics.' },
                  { icon:'⚡', title:'Rule of Thumb', desc:'Always complete MSA before SPC. A gauge with 35% GRR inflates SPC variation, deflates Cpk, and causes false alarms or missed defects.' },
                ].map(c => (
                  <div key={c.title} className="bg-cyan-900/20 border border-cyan-800/30 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-cyan-300 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-blue-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📊 MSA Study Types</h2>
              <div className="space-y-3">
                {[
                  { type:'GRR — Gauge Repeatability & Reproducibility', icon:'🔁',
                    when:'For all variable gauges on CC/SC characteristics — CMM, vernier, micrometer, load cell, vision system.',
                    what:'Separates measurement error into EV (gauge hardware — repeatability) and AV (operator technique — reproducibility). Combined = GRR.',
                    target:'%GRR < 10% of TV or tolerance. ndc ≥ 5.' },
                  { type:'Bias Study', icon:'🎯',
                    when:'When the gauge may consistently read higher or lower than the reference value across its range.',
                    what:'Compares average of repeated measurements to a traceable reference. Bias = X̄ measured − Reference value.',
                    target:'Bias not statistically significant at 95% confidence.' },
                  { type:'Linearity Study', icon:'📈',
                    when:'When gauge accuracy may vary across its full operating range (accurate at midrange, biased at extremes).',
                    what:'Measures bias at multiple reference points across the range. Plots slope and intercept of bias vs. reference.',
                    target:'Slope near zero — consistent bias (ideally near zero) across the full range.' },
                  { type:'Stability Study', icon:'📅',
                    when:'Conducted periodically — gauges drift due to wear, temperature, or calibration decay.',
                    what:'Measures a master part repeatedly over time. Plots results on control chart.',
                    target:'Control chart shows only common cause variation — no trends, shifts, or signals.' },
                  { type:'Attribute Agreement Analysis (AAA)', icon:'✅',
                    when:'For go/no-go gauges, visual inspection, and any pass/fail judgment.',
                    what:'20 parts (include borderline), 2–3 operators, 2–3 trials. Calculates % agreement within operator, between operators, and vs. standard.',
                    target:'Within operator ≥ 90%, Between operators ≥ 80%, vs. Standard ≥ 80%.' },
                ].map(s => (
                  <div key={s.type} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{s.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm mb-2">{s.type}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          <div><span className="text-gray-500">When: </span><span className="text-gray-400">{s.when}</span></div>
                          <div><span className="text-gray-500">Measures: </span><span className="text-gray-400">{s.what}</span></div>
                          <div><span className="text-gray-500">Target: </span><span className="text-cyan-400">{s.target}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">✅ GRR Acceptance Criteria — AIAG MSA 4th Edition</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="border border-gray-700 px-4 py-3 text-left text-gray-300">Metric</th>
                      <th className="border border-gray-700 px-4 py-3 text-center text-green-400">✅ Acceptable</th>
                      <th className="border border-gray-700 px-4 py-3 text-center text-yellow-400">⚠️ Conditional</th>
                      <th className="border border-gray-700 px-4 py-3 text-center text-red-400">❌ Unacceptable</th>
                      <th className="border border-gray-700 px-4 py-3 text-left text-gray-300">Guidance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['%GRR (of TV)',    '< 10%', '10–30%', '> 30%', 'Accept / Investigate risk before accepting / Reject — find root cause'],
                      ['%P/T ratio',      '< 10%', '10–30%', '> 30%', 'Full capability / Screening use only / Unacceptable for precision'],
                      ['ndc',             '≥ 5',   '2–4',    '< 2',   'Sufficient resolution / Limited / Gauge cannot distinguish parts'],
                      ['%EV (Repeatab.)', 'Low',   'Moderate','High', 'High EV = gauge hardware — check condition, calibration, fixturing'],
                      ['%AV (Reproduc.)', 'Low',   'Moderate','High', 'High AV = operator method — training, instructions, technique'],
                    ].map(([m, a, c, u, act]) => (
                      <tr key={m} className="border-b border-gray-800">
                        <td className="border border-gray-700 px-4 py-2 text-gray-300 font-semibold">{m}</td>
                        <td className="border border-gray-700 px-4 py-2 text-center text-green-400">{a}</td>
                        <td className="border border-gray-700 px-4 py-2 text-center text-yellow-400">{c}</td>
                        <td className="border border-gray-700 px-4 py-2 text-center text-red-400">{u}</td>
                        <td className="border border-gray-700 px-4 py-2 text-gray-500">{act}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🔢 GRR Formulas — Average &amp; Range Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['R̄ (operator)',   '= Average of ranges per part per operator (max trial − min trial)'],
                  ['R̄̄ (grand)',      '= Average of all operator R̄ values'],
                  ['UCL_R',          '= D4 × R̄̄   (D4: 2 trials=3.267, 3 trials=2.574)'],
                  ['EV',             '= R̄̄ × K1   (K1: 2 trials=4.56, 3 trials=3.05)'],
                  ['X̄_diff',         '= Max(operator means) − Min(operator means)'],
                  ['AV',             '= √[(X̄_diff × K2)² − EV²/(n×r)]   K2: 2 ops=3.65, 3=2.70'],
                  ['GRR',            '= √(EV² + AV²)'],
                  ['Rp',             '= Max(part averages) − Min(part averages)'],
                  ['PV',             '= Rp × K3   (K3: 10 parts=1.62, 5 parts=2.08)'],
                  ['TV',             '= √(GRR² + PV²)'],
                  ['%GRR',           '= 100 × GRR / TV'],
                  ['ndc',            '= floor(1.41 × PV / GRR) — distinct categories'],
                  ['%P/T',           '= 100 × GRR / (USL − LSL) — precision-to-tolerance'],
                ].map(([f, eq]) => (
                  <div key={f} className="bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-cyan-400 font-bold">{f}</span>
                    <span className="text-gray-400 ml-2">{eq}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── GUIDE TAB ──────────────────────────────────────────────────────── */}
      {mainTab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Conduct a GRR Study</h2>
              <p className="text-gray-400 text-sm mt-1">AIAG MSA 4th Edition · Standard: 10 parts × 3 operators × 2 trials</p>
            </div>

            {[
              { step:1, icon:'🎯', title:'Select Parts Spanning the Full Process Range',
                body:'Choose 10 parts from close to LSL to close to USL. Never select all-conforming parts clustered near nominal — this artificially deflates PV and inflates %GRR. The sample must represent the true variation the gauge encounters in production.' },
              { step:2, icon:'🏷️', title:'Code the Parts — Conduct a Blind Study',
                body:'Number parts 1–10 on the bottom or a hidden location. Operators must NOT see part numbers during measurement. Non-blind studies produce optimistic results — operators subconsciously repeat their previous reading. Tell operators only to "measure the parts in the order provided."' },
              { step:3, icon:'👥', title:'Select Operators Who Normally Use This Gauge',
                body:'Use 2–3 operators from actual production shifts. Different experience levels is acceptable and representative. Do not use quality engineers who rarely use the gauge — they do not represent normal production variation.' },
              { step:4, icon:'📊', title:'Run Trial 1 — All Operators in Random Order',
                body:'Operator A measures all 10 parts in a random sequence. Operator B measures all 10 in a different random sequence. Randomization prevents operators from correlating their readings to previous trials. Record all 20+ readings accurately.' },
              { step:5, icon:'🔄', title:'Run Remaining Trials with New Random Order Each Time',
                body:'Repeat the complete measurement cycle for Trial 2 (and Trial 3 if selected). Use a completely different random order each time. For high-precision gauges, allow 15–30 minutes between trials to eliminate measurement memory.' },
              { step:6, icon:'📐', title:'Calculate Results and Interpret',
                body:'Enter all readings above. If %GRR is high: compare %EV vs %AV. High %EV means the gauge hardware is the problem — check for wear, damage, thermal effects, or poor fixture. High %AV means operator method is the problem — review technique, measurement instructions, and clamping/fixturing consistency.' },
              { step:7, icon:'🔧', title:'Take Action and Re-validate',
                body:'%GRR 10–30%: document the risk, get customer or quality manager approval if a CC characteristic, plan improvement. %GRR above 30%: stop — do not run SPC or capability study with this gauge. Fix the root cause first, then re-run the full GRR study to confirm improvement. Document all actions.' },
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-teal-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
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
              <h2 className="text-lg font-bold text-white mb-4">❌ Common MSA Mistakes</h2>
              <div className="space-y-3">
                {[
                  ['Non-blind study — operators see part numbers', 'Operators memorize sequences and try to repeat their reading. %GRR looks artificially good. Code parts on the underside, hidden from operators during measurement.'],
                  ['Only good parts selected — all near nominal', 'Low PV from clustered parts makes %GRR = GRR/TV appear high even if the gauge is fine. Select parts spanning close to LSL through close to USL.'],
                  ['MSA done on uncalibrated or worn gauge', 'A worn anvil or dirty probe inflates EV. Always calibrate and inspect the gauge before MSA, not as a result of a failed MSA.'],
                  ['Capability study run before GRR', 'A gauge with 35% GRR produces meaningless Cpk data. IATF auditors will ask for GRR evidence to validate the capability study. MSA first, always.'],
                  ['MSA only done for CC — not for all Control Plan gauges', 'IATF 16949 Cl. 7.1.5 applies to all measurement systems referenced in the Control Plan for conformance verification. SC and important characteristics also need MSA.'],
                  ['No re-GRR after gauge repair or replacement', 'A repaired or replaced gauge is a new measurement system. Prior GRR approval is invalid. Re-run the full study after any hardware change.'],
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
                  'Show me the MSA records for the gauge used to measure this CC characteristic.',
                  'When was the last GRR study done for this gauge? What was the %GRR and ndc?',
                  'Was this a blind study? How were parts coded during measurement?',
                  'Your Cpk is 1.38 — but what was the %GRR of the gauge used to generate that data?',
                  'This gauge was repaired 2 months ago — was a new GRR study run after the repair?',
                  'Do you have MSA records for every gauge listed in the Control Plan under CC and SC characteristics?',
                  'This GRR shows 22% — what action did you take? Is there an approval on file for conditional acceptance?',
                  'Show me the calibration certificate and the GRR study for the same gauge — are they linked and concurrent?',
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
