'use client';

import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';

// -- MSA Constants — AIAG MSA 4th Edition (Average & Range Method) -------------
const K1: Record<number, number> = { 2: 4.56, 3: 3.05 };          // EV factor (trials)
const K2: Record<number, number> = { 2: 3.65, 3: 2.70, 4: 2.30 }; // AV factor (operators)
const K3: Record<number, number> = {                                // PV factor (parts)
  2: 3.65, 3: 2.70, 4: 2.30, 5: 2.08,
  6: 1.93, 7: 1.82, 8: 1.74, 9: 1.67, 10: 1.62,
};
const D4: Record<number, number> = { 2: 3.267, 3: 2.574 };        // UCL_R factor (trials)

// -- Helpers ------------------------------------------------------------------
function initData(nOps: number, nTrials: number, nParts: number): string[][][] {
  return Array.from({ length: nOps }, () =>
    Array.from({ length: nTrials }, () =>
      Array.from({ length: nParts }, () => '')));
}

function grrRating(pct: number) {
  if (pct < 10)  return { label: 'Acceptable',   bg: 'bg-green-900/30 border-green-700/50',   text: 'text-green-300',  icon: '✅' };
  if (pct <= 30) return { label: 'Conditional',  bg: 'bg-yellow-900/30 border-yellow-700/50', text: 'text-yellow-300', icon: '⚠️' };
  return           { label: 'Unacceptable', bg: 'bg-red-50 border-red-700/50',     text: 'text-red-600',   icon: '❌' };
}
function ndcRating(ndc: number) {
  if (ndc >= 5) return { label: `${ndc} — Acceptable`, text: 'text-green-300' };
  if (ndc >= 2) return { label: `${ndc} — Marginal`,   text: 'text-yellow-300' };
  return          { label: `${ndc} — Unacceptable`, text: 'text-red-600' };
}

const inp = 'w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-cyan-500';
const lbl = 'text-xs text-[#1e3a5f] block mb-1';
const f4  = (n: number) => isNaN(n) ? '—' : n.toFixed(4);
const f2  = (n: number) => isNaN(n) ? '—' : n.toFixed(2);

// -- Sample data ---------------------------------------------------------------
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

// -- Component -----------------------------------------------------------------
// -- MSA Study Types ---------------------------------------------------------
const MSA_STUDY_TYPES = [
  { no: 1, name: 'GRR — Gauge Repeatability & Reproducibility', icon: '📊', color: '#4f46e5',
    when: 'Before first production run for any variable gauge used in Control Plan',
    method: '10 parts × 3 operators × 2 trials (minimum). Blind study. Randomized order.',
    metrics: '%GRR (Study Var), %GRR (Tolerance), NDC',
    accept: '< 10% = Accept, 10-30% = Conditional, > 30% = Reject. NDC ≥ 5.',
    iatf: 'Clause 7.1.5.1' },
  { no: 2, name: 'Bias Study — Gauge Accuracy Check', icon: '🎯', color: '#0d9488',
    when: 'At gauge first use, after calibration, after repair, as part of PPAP Element 8',
    method: 'Measure a certified reference part 10-25 times. Compare average to reference value.',
    metrics: 'Average Bias, % Bias, t-test for statistical significance',
    accept: '% Bias < 10%. t-test: |t| < t_critical (no significant bias)',
    iatf: 'Clause 7.1.5.1' },
  { no: 3, name: 'Linearity Study — Accuracy Across Range', icon: '📈', color: '#7c3aed',
    when: 'For gauges used across a wide measurement range (CMMs, hardness testers)',
    method: '5 reference parts spanning operating range. 12 measurements each. Linear regression.',
    metrics: 'R², % Linearity, Regression: Bias = a + b × Reference',
    accept: 'R² > 0.95. % Linearity < 10%.',
    iatf: 'Clause 7.1.5.1' },
  { no: 4, name: 'Stability Study — Gauge Drift Over Time', icon: '🔄', color: '#d97706',
    when: 'Ongoing for all critical gauges after PPAP. Setup immediately after first GRR.',
    method: 'Measure reference part 3-5 times per period, 20+ periods. Control chart method.',
    metrics: 'X-bar and R chart. UCL/LCL. Trends and out-of-control patterns.',
    accept: 'All points within UCL/LCL. No trends, cycles, or runs of 7+.',
    iatf: 'Clause 7.1.5.1' },
  { no: 5, name: 'Attribute GRR — Pass/Fail Gauges', icon: '✅', color: '#dc2626',
    when: 'For all go/no-go gauges, visual inspection, and attribute decision systems',
    method: '50 parts × 3 appraisers × 2 trials. Mix of clear pass, clear fail, and borderline parts.',
    metrics: 'Kappa coefficient (within and between appraisers vs standard)',
    accept: 'Kappa ≥ 0.75 = Acceptable. 0.50-0.74 = Marginal. < 0.50 = Unacceptable.',
    iatf: 'Clause 7.1.5.2' },
];

const MSA_SCORE_ITEMS = [
  'Gauge Register maintained — all gauges listed with ID, type, range, calibration status',
  'Calibration certificates traceable to NABL/NPL for all calibrated gauges',
  'GRR study completed for all variable measurement systems in Control Plan',
  '%GRR (Study Var) < 30% for all gauges; < 10% for CC characteristics',
  'NDC ≥ 5 calculated and reported for all variable GRR studies',
  '%GRR (Tolerance) also calculated and reported alongside % Study Var',
  'GRR conducted with minimum 2 operators, 10 parts, 2 trials (AIAG minimum)',
  'Bias study completed for all reference and precision gauges',
  'Linearity study completed for gauges used across a wide measurement range',
  'Stability monitoring active for all critical gauges (control chart)',
  'Attribute GRR (Kappa) completed for all go/no-go and visual inspection systems',
  'MSA studies included in PPAP Element 8 submission package',
  'GRR re-study triggered for any 4M change, gauge repair, or new gauge introduction',
  'Operators trained on correct measurement technique before GRR study conducted',
];


export default function MSAPage() {
  const [mainTab, setMainTab] = useState<'overview' | 'guide' | 'generator' | 'analyser' | 'qa' | 'templates' | 'docs' | 'posters' | 'dashboard' | 'deepdive' | 'workflow' | 'casestudies' | 'training'>('overview');
  const [mgen, setMgen] = useState({ gaugeName: '', partName: '', measurementType: 'Variable', nOpsG: '3', nPartsG: '10', nTrialsG: '2', usGaugeType: 'Vernier Caliper' });
  const [mgenResult, setMgenResult] = useState(false);
  const [showMsaScore, setShowMsaScore] = useState(false);
  const [msaChecks, setMsaChecks] = useState<Record<number,boolean>>({});
  const [showBiasGen, setShowBiasGen] = useState(false);
  const [biasInfo, setBiasInfo] = useState({ gauge: '', part: '', refValue: '', usl: '', lsl: '', readings: '' });

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

  // -- Calculations ---------------------------------------------------------
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
      <>
      <PageTitle title="MSA" />
      <div className="min-h-screen bg-white">

      {/* -- Header --------------------------------------------------------- */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e2a5a 50%,#162044 100%)', padding: '22px 32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f160,transparent)' }} />
        <div className="max-w-screen-xl mx-auto">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🔬</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>MSA</h1>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#6366f125', color: '#a5b4fc', borderRadius: '20px', border: '1px solid #6366f145' }}>AIAG 4th Edition</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#10b98115', color: '#6ee7b7', borderRadius: '20px', border: '1px solid #10b98140' }}>IATF 16949</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Measurement System Analysis — Complete Knowledge Center</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', background: '#6366f120', border: '1px solid #6366f145', borderRadius: '10px', padding: '9px 14px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#a5b4fc' }}>5</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Study Types</div>
              </div>
              <div style={{ textAlign: 'center', background: '#6366f115', border: '1px solid #6366f140', borderRadius: '10px', padding: '9px 14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#a5b4fc' }}>&lt;10%</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>%GRR Target</div>
              </div>
              {results && (
                <div style={{ textAlign: 'center', background: '#6366f115', border: '1px solid #6366f140', borderRadius: '10px', padding: '9px 14px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: results.pctGRR < 10 ? '#6ee7b7' : results.pctGRR <= 30 ? '#fcd34d' : '#fca5a5' }}>{f2(results.pctGRR)}%</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>%GRR</div>
                </div>
              )}
              <button onClick={loadSample} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                🧪 Load Sample
              </button>
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: '1px', flexWrap: 'wrap' }}>
            {([
              { id: 'overview',   label: '📖 Overview' },
              { id: 'guide',      label: '📚 MSA Guide' },
              { id: 'generator',  label: '⚡ Generator' },
              { id: 'analyser',   label: '🔍 Analyser' },
              { id: 'qa',         label: '💬 Interview Q&A' },
              { id: 'templates',  label: '📋 Templates' },
              { id: 'docs',       label: '📄 Supporting Docs' },
              { id: 'posters',    label: '🖼 Posters & Banners' },
              { id: 'dashboard',  label: '📊 Dashboard' },
              { id: 'deepdive',   label: '🧩 Study Deep Dive' },
              { id: 'workflow',   label: '🔄 Workflow' },
              { id: 'casestudies',label: '📂 Case Studies' },
              { id: 'training',   label: '🎓 Training' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)} style={{
                padding: '9px 14px', fontSize: '12px', fontWeight: mainTab === t.id ? 700 : 400,
                color: mainTab === t.id ? '#fff' : '#64748b',
                background: mainTab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', borderBottom: mainTab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                cursor: 'pointer', borderRadius: '8px 8px 0 0', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* -- OVERVIEW TAB ---------------------------------------------------- */}
      {mainTab === 'overview' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/AIAG_MSA_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>AIAG MSA 4th Ed.</a>
            <a href="/downloads/msa/MSA_GRR_Study_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>GRR Study Template XLS</a>
            <a href="/downloads/msa/MSA_GRR_vs_Tolerance_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>GRR Guide PDF</a>
            <a href="/downloads/msa/MSA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <div className="max-w-screen-xl mx-auto space-y-6">

            {/* What is MSA */}
            <div className="bg-white border border-teal-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-3">🔬 What is MSA — Measurement System Analysis?</h2>
              <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                MSA (Measurement System Analysis) evaluates whether a measurement system is fit for its intended purpose. Before you trust any data for SPC, capability studies, or acceptance inspection, you must prove the gauge is not introducing unacceptable error. A gauge contributing 40% of observed variation makes any Cpk or control chart meaningless.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:'Study Types', value:'5', sub:'GRR · Bias · Linearity · Stability · AAA', color:'text-teal-700' },
                  { label:'%GRR Target', value:'<10%', sub:'of Total Variation or Tolerance', color:'text-green-300' },
                  { label:'ndc Required', value:'≥ 5', sub:'Number of Distinct Categories', color:'text-cyan-300' },
                  { label:'IATF Clause', value:'7.1.5', sub:'Monitoring & Measuring Resources', color:'text-purple-300' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-4 text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-white text-xs font-semibold mt-1">{s.label}</div>
                    <div className="text-[#1e3a5f] text-xs mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study types quick reference */}
            <div className="bg-white border border-blue-700/50/50 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">📊 MSA Study Types at a Glance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { type:'GRR — Gauge R&R', icon:'🔁', when:'All variable gauges for CC/SC', target:'%GRR < 10% | ndc ≥ 5', color:'border-teal-700/50 bg-teal-50/10' },
                  { type:'Bias Study', icon:'🎯', when:'Gauge may read consistently high/low', target:'Bias not statistically significant', color:'border-blue-700/50 bg-[#eff6ff]/10' },
                  { type:'Linearity Study', icon:'📈', when:'Accuracy varies across gauge range', target:'Slope near zero across full range', color:'border-purple-700/50 bg-purple-900/30' },
                  { type:'Stability Study', icon:'📅', when:'Periodic monitoring of gauge drift', target:'Control chart — common cause only', color:'border-orange-700/50 bg-orange-900/30/10' },
                  { type:'Attribute Agreement (AAA)', icon:'✅', when:'Go/no-go, visual inspection, pass/fail', target:'Within ≥ 90% | Between ≥ 80%', color:'border-green-700/50 bg-green-900/30/10' },
                ].map(s => (
                  <div key={s.type} className={`border rounded-xl p-4 ${s.color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{s.icon}</span>
                      <div className="text-white font-semibold text-sm">{s.type}</div>
                    </div>
                    <div className="text-[#1e3a5f] text-xs mb-1"><span className="text-[#1e3a5f]">When: </span>{s.when}</div>
                    <div className="text-teal-700 text-xs font-semibold">Target: {s.target}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why MSA matters + IATF map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-red-900/40 rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-3">⚠️ Why MSA Matters</h2>
                <div className="space-y-2 text-xs text-[#1e3a5f]">
                  {[
                    ['Without MSA', 'You are measuring with an unknown tool — Cpk and SPC data are untrustworthy'],
                    ['35% GRR gauge', 'Your SPC chart shows gauge noise, not process variation — control limits are wrong'],
                    ['IATF Audit', 'Auditor will ask for GRR records for every CC gauge in your Control Plan'],
                    ['PPAP Element 8', 'GRR study is a mandatory PPAP deliverable — no MSA = PPAP not complete'],
                    ['Cost of Poor MSA', 'Accepting bad parts, rejecting good parts — both cost money and reputation'],
                  ].map(([h,b]) => (
                    <div key={h} className="flex gap-2">
                      <span className="text-red-600 flex-shrink-0">→</span>
                      <div><span className="text-white font-semibold">{h}:</span> {b}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-purple-900/40 rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-3">📋 IATF 16949 Clause Map</h2>
                <div className="space-y-2">
                  {[
                    ['7.1.5', 'Monitoring & measuring resources — all gauges'],
                    ['7.1.5.1', 'MSA — Cl. requiring GRR for CC/SC characteristics'],
                    ['7.1.5.2', 'Calibration / verification records — linked to MSA'],
                    ['8.5.1.1', 'Control Plan — lists gauges needing MSA'],
                    ['4.4.1.2', 'Product safety — MSA for safety-critical measurements'],
                    ['PPAP El.8', 'MSA Results — mandatory for all CC characteristics'],
                  ].map(([cl, desc]) => (
                    <div key={cl} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2">
                      <span className="text-teal-600 font-bold text-xs flex-shrink-0 w-16">{cl}</span>
                      <span className="text-[#1e3a5f] text-xs">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- GENERATOR TAB --------------------------------------------------- */}
      {mainTab === 'generator' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_GRR_Study_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>GRR Template XLS</a>
            <a href="/downloads/msa/MSA_Gauge_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>Gauge Register XLS</a>
            <a href="/downloads/msa/MSA_Bias_Linearity_Stability.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Bias/Lin/Stab XLS</a>
          </div>
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white border border-teal-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">⚡ MSA Study Plan Generator</h2>
              <p className="text-[#1e3a5f] text-xs mb-5">Enter gauge and study details — get a complete MSA study plan with recommended study type, AIAG sample requirements, study sequence, and acceptance criteria.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-[#1e3a5f] block mb-1">Gauge / Instrument Name *</label>
                  <input className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f]" value={mgen.gaugeName} onChange={e => setMgen(g => ({...g, gaugeName: e.target.value}))} placeholder="e.g. Digital Vernier Caliper" />
                </div>
                <div>
                  <label className="text-xs text-[#1e3a5f] block mb-1">Part / Characteristic *</label>
                  <input className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f]" value={mgen.partName} onChange={e => setMgen(g => ({...g, partName: e.target.value}))} placeholder="e.g. Shaft Diameter, Torque" />
                </div>
                <div>
                  <label className="text-xs text-[#1e3a5f] block mb-1">Measurement Type</label>
                  <select className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f]" value={mgen.measurementType} onChange={e => setMgen(g => ({...g, measurementType: e.target.value}))}>
                    <option>Variable</option>
                    <option>Attribute (Pass/Fail)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#1e3a5f] block mb-1">Gauge Type</label>
                  <select className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f]" value={mgen.usGaugeType} onChange={e => setMgen(g => ({...g, usGaugeType: e.target.value}))}>
                    {['Vernier Caliper','Micrometer','CMM (Coordinate Measuring Machine)','Torque Gauge','Load Cell','Vision System','Go/No-Go Gauge','Height Gauge','Pressure Gauge','Roughness Tester'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {mgen.measurementType === 'Variable' && <>
                  <div>
                    <label className="text-xs text-[#1e3a5f] block mb-1">Number of Operators</label>
                    <select className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f]" value={mgen.nOpsG} onChange={e => setMgen(g => ({...g, nOpsG: e.target.value}))}>
                      <option value="2">2</option><option value="3">3 (Recommended)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#1e3a5f] block mb-1">Number of Parts</label>
                    <select className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f]" value={mgen.nPartsG} onChange={e => setMgen(g => ({...g, nPartsG: e.target.value}))}>
                      <option value="5">5</option><option value="10">10 (Recommended)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#1e3a5f] block mb-1">Number of Trials</label>
                    <select className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f]" value={mgen.nTrialsG} onChange={e => setMgen(g => ({...g, nTrialsG: e.target.value}))}>
                      <option value="2">2 (Minimum)</option><option value="3">3 (Preferred)</option>
                    </select>
                  </div>
                </>}
              </div>

              <button
                onClick={() => { if (mgen.gaugeName && mgen.partName) setMgenResult(true); }}
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl text-sm transition">
                ⚡ Generate MSA Study Plan
              </button>
            </div>

            {mgenResult && (
              <div className="space-y-4">
                <div className="bg-teal-50/20 border border-teal-700/40 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center text-xl">🔬</div>
                    <div>
                      <div className="text-white font-bold">{mgen.gaugeName} — MSA Study Plan</div>
                      <div className="text-teal-600 text-xs">{mgen.partName} · {mgen.measurementType} · {mgen.usGaugeType}</div>
                    </div>
                  </div>

                  {mgen.measurementType === 'Variable' ? (
                    <>
                      <div className="bg-white rounded-xl p-4 mb-4">
                        <div className="text-teal-700 font-bold text-sm mb-2">Recommended Study: GRR (Average &amp; Range Method)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-center">
                          <div className="bg-white rounded-lg p-3"><div className="text-white font-bold text-lg">{mgen.nOpsG}</div><div className="text-[#1e3a5f] text-xs">Operators</div></div>
                          <div className="bg-white rounded-lg p-3"><div className="text-white font-bold text-lg">{mgen.nPartsG}</div><div className="text-[#1e3a5f] text-xs">Parts</div></div>
                          <div className="bg-white rounded-lg p-3"><div className="text-white font-bold text-lg">{mgen.nTrialsG}</div><div className="text-[#1e3a5f] text-xs">Trials</div></div>
                        </div>
                        <div className="mt-3 text-[#1e3a5f] text-xs">Total readings: <span className="text-white font-bold">{Number(mgen.nOpsG) * Number(mgen.nPartsG) * Number(mgen.nTrialsG)}</span></div>
                      </div>
                      <div className="space-y-2 text-xs">
                        {[
                          ['Step 1 – Prerequisites', 'Calibrate gauge. Verify calibration certificate is current. Confirm gauge resolution is ≤ 10% of the tolerance (e.g. tolerance 0.10 mm → gauge must read to 0.01 mm).'],
                          ['Step 2 – Part Selection', `Select ${mgen.nPartsG} parts spanning from near LSL to near USL. Do NOT select all-good parts near nominal — this artificially deflates PV and inflates %GRR.`],
                          ['Step 3 – Code Parts', 'Number parts on the underside (hidden from operators). This must be a blind study. Operators who can see part numbers will unconsciously try to repeat prior readings.'],
                          ['Step 4 – Randomise & Run Trial 1', `Each operator measures all ${mgen.nPartsG} parts in a random order. Record results. Do not share readings between operators until all trials complete.`],
                          ['Step 5 – Repeat for Remaining Trials', `Run ${mgen.nTrialsG} trials total with a different random part order each time. For precision gauges, wait 15–30 min between trials.`],
                          ['Step 6 – Calculate & Interpret', 'Enter data in the Analyser tab. Target: %GRR < 10% of TV, ndc ≥ 5. If 10–30%: document risk and get approval. If > 30%: stop — investigate EV vs AV cause.'],
                          ['Step 7 – Document & File', 'Store GRR study results in PPAP package (Element 8). Link to calibration certificate. Re-GRR any time gauge is repaired, replaced, or modified.'],
                        ].map(([h, b]) => (
                          <div key={h} className="bg-white rounded-lg p-3">
                            <div className="text-teal-700 font-semibold mb-1">{h}</div>
                            <div className="text-[#1e3a5f] leading-relaxed">{b}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white rounded-xl p-4 mb-4">
                        <div className="text-teal-700 font-bold text-sm mb-2">Recommended Study: Attribute Agreement Analysis (AAA)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-center">
                          <div className="bg-white rounded-lg p-3"><div className="text-white font-bold text-lg">3</div><div className="text-[#1e3a5f] text-xs">Appraisers</div></div>
                          <div className="bg-white rounded-lg p-3"><div className="text-white font-bold text-lg">20</div><div className="text-[#1e3a5f] text-xs">Parts</div></div>
                          <div className="bg-white rounded-lg p-3"><div className="text-white font-bold text-lg">2</div><div className="text-[#1e3a5f] text-xs">Trials</div></div>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        {[
                          ['Part Selection', 'Select 20 parts — include parts from all zones: clear accept, clear reject, and borderline (near decision boundary). Borderline parts are critical.'],
                          ['Reference Standard', 'Establish a reference decision (known standard) for all 20 parts using an expert or measured reference. This is the benchmark for "vs. standard" comparison.'],
                          ['Blind Study', 'Code parts. Run appraiser 1 → 2 → 3 through all 20 in random order (Trial 1). Repeat in different random order (Trial 2).'],
                          ['Acceptance Criteria', 'Within appraiser ≥ 90%, Between appraisers ≥ 80%, vs. Standard ≥ 80%. Kappa ≥ 0.7 acceptable, ≥ 0.9 excellent.'],
                        ].map(([h, b]) => (
                          <div key={h} className="bg-white rounded-lg p-3">
                            <div className="text-teal-700 font-semibold mb-1">{h}</div>
                            <div className="text-[#1e3a5f] leading-relaxed">{b}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="mt-4 bg-white border border-teal-200 rounded-xl p-4">
                    <div className="text-teal-700 font-bold text-xs mb-2">🎯 Acceptance Targets</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-center">
                      <div className="bg-green-900/30 rounded-lg p-2"><div className="text-[#15803d] font-bold">%GRR &lt; 10%</div><div className="text-[#1e3a5f]">Acceptable</div></div>
                      <div className="bg-yellow-900/30/30 rounded-lg p-2"><div className="text-yellow-300 font-bold">10–30%</div><div className="text-[#1e3a5f]">Conditional</div></div>
                      <div className="bg-red-50 rounded-lg p-2"><div className="text-red-600 font-bold">&gt; 30%</div><div className="text-[#1e3a5f]">Unacceptable</div></div>
                    </div>
                  </div>

                  <button onClick={() => setMgenResult(false)} className="mt-4 text-[#1e3a5f] text-xs hover:text-[#1e3a5f]">← New Study</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- ANALYSER TAB (was GRR Calculator) ------------------------------ */}
      {mainTab === 'analyser' && (
        <div className="animate-fadeIn p-4 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_GRR_Study_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>GRR Study Template XLS</a>
            <a href="/downloads/msa/MSA_Bias_Linearity_Stability.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Bias/Lin/Stab XLS</a>
            <a href="/downloads/msa/MSA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Audit Checklist XLS</a>
            <a href="/downloads/msa/MSA_GRR_vs_Tolerance_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>GRR Guide PDF</a>
          </div>
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* Setup */}
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <div className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#dbeafe]">
                <h2 className="text-sm font-bold text-white">
                  📊 Measurement Data — {nParts} parts × {nOps} operators × {nTrials} trials = {nParts * nOps * nTrials} readings
                  {charName && <span className="ml-2 text-cyan-600 font-normal">[{charName}{unit ? ` (${unit})` : ''}]</span>}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-white">
                    <tr>
                      <th className="border border-[#dbeafe] px-3 py-2 text-[#1e3a5f] text-left w-16">Part #</th>
                      {Array.from({ length: nOps }, (_, o) =>
                        Array.from({ length: nTrials }, (_, t) => (
                          <th key={`${o}-${t}`} className="border border-[#dbeafe] px-2 py-2 text-center">
                            <div className="text-[#1e3a5f] font-semibold">{opNames[o] ?? `Op ${o+1}`}</div>
                            <div className="text-[#1e3a5f] font-normal">Trial {t+1}</div>
                          </th>
                        ))
                      )}
                      <th className="border border-[#dbeafe] px-2 py-2 text-center text-[#1e3a5f] bg-white/80">Part Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: nParts }, (_, p) => {
                      const pAvg = results ? results.partAvg[p] : null;
                      return (
                        <tr key={p} className={p % 2 === 0 ? 'bg-white/20' : 'bg-white/10'}>
                          <td className="border border-[#dbeafe] px-3 py-1 text-[#1e3a5f] font-mono text-center">{p + 1}</td>
                          {Array.from({ length: nOps }, (_, o) =>
                            Array.from({ length: nTrials }, (_, t) => {
                              const isOutlier = results && results.ranges[o]?.[p] > results.uclR;
                              return (
                                <td key={`${o}-${t}`} className={`border border-[#dbeafe] px-1 py-0.5 ${isOutlier ? 'bg-red-50' : ''}`}>
                                  <input
                                    type="number" step="any"
                                    className={`w-24 bg-transparent text-white text-xs text-center focus:outline-none focus:bg-gray-700 rounded px-1 py-1 ${isOutlier ? 'text-red-600' : ''}`}
                                    value={data[o]?.[t]?.[p] ?? ''}
                                    onChange={e => setCell(o, t, p, e.target.value)}
                                    placeholder="0.000"
                                  />
                                </td>
                              );
                            })
                          )}
                          <td className="border border-[#dbeafe] px-2 py-1 text-center text-cyan-600 font-mono text-xs">
                            {pAvg !== null && pAvg !== undefined ? f4(pAvg) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {results && (
                    <tfoot className="bg-white border-t-2 border-[#dbeafe]">
                      <tr>
                        <td className="border border-[#dbeafe] px-3 py-2 text-[#1e3a5f] font-bold text-xs">Op Avg (X̄)</td>
                        {Array.from({ length: nOps }, (_, o) =>
                          Array.from({ length: nTrials }, (_, t) => (
                            <td key={`${o}-${t}`} className="border border-[#dbeafe] px-2 py-2 text-center">
                              {t === 0 ? <span className="text-amber-600 font-mono text-xs">{f4(results.xBarOp[o])}</span> : <span className="text-[#1e3a5f] text-xs">—</span>}
                            </td>
                          ))
                        )}
                        <td className="border border-[#dbeafe] px-2 py-2 text-center text-[#1e3a5f] text-xs">—</td>
                      </tr>
                      <tr>
                        <td className="border border-[#dbeafe] px-3 py-2 text-[#1e3a5f] font-bold text-xs">R̄ (Op Range)</td>
                        {Array.from({ length: nOps }, (_, o) =>
                          Array.from({ length: nTrials }, (_, t) => (
                            <td key={`${o}-${t}`} className="border border-[#dbeafe] px-2 py-2 text-center">
                              {t === 0 ? <span className="text-purple-600 font-mono text-xs">{f4(results.rBarOp[o])}</span> : <span className="text-[#1e3a5f] text-xs">—</span>}
                            </td>
                          ))
                        )}
                        <td className="border border-[#dbeafe] px-2 py-2 text-center text-[#1e3a5f] text-xs">—</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
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
                          <span className="text-xs text-[#1e3a5f] font-semibold">{row.label}</span>
                          <span className="text-xs font-mono text-white">{f4(row.value)} {unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${Math.min(100, row.pct)}%` }}></div>
                          </div>
                          <span className="text-xs text-[#1e3a5f] w-12 text-right">{f2(row.pct)}%</span>
                        </div>
                        <p className="text-xs text-[#1e3a5f] mt-0.5">{row.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`border rounded-2xl p-5 ${rating.bg}`}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-y-2">
                      <h2 className="text-sm font-bold text-white">🎯 GRR Verdict</h2>
                      <span className={`text-lg font-bold ${rating.text}`}>{rating.icon} {rating.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 text-center">
                        <div className={`text-2xl font-bold ${rating.text}`}>{f2(results.pctGRR)}%</div>
                        <div className="text-xs text-[#1e3a5f]">%GRR (of TV)</div>
                      </div>
                      {results.pctPT !== null && (
                        <div className="bg-white rounded-xl p-3 text-center">
                          <div className={`text-2xl font-bold ${results.pctPT < 10 ? 'text-green-300' : results.pctPT <= 30 ? 'text-yellow-300' : 'text-red-600'}`}>{f2(results.pctPT)}%</div>
                          <div className="text-xs text-[#1e3a5f]">%P/T ratio</div>
                        </div>
                      )}
                    </div>
                    <p className={`mt-3 text-xs ${rating.text}`}>
                      {results.pctGRR < 10 && 'Measurement system is capable. Safe to use for SPC and capability studies.'}
                      {results.pctGRR >= 10 && results.pctGRR <= 30 && 'Marginal — may be acceptable for go/no-go gauging. Investigate before using for SPC.'}
                      {results.pctGRR > 30 && 'Measurement system is not acceptable. Identify and eliminate variation sources before proceeding.'}
                    </p>
                  </div>

                  <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
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
                        <div key={l} className="bg-white rounded-lg px-3 py-2">
                          <div className="text-[#1e3a5f]">{l}</div>
                          <div className="text-white font-semibold mt-0.5">{v} <span className="text-[#1e3a5f] font-normal">{s}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[#dbeafe] rounded-2xl p-4 text-xs text-[#1e3a5f]">
                    <p className="font-bold text-[#1e3a5f] mb-1">AIAG Acceptance Criteria</p>
                    <p>%GRR &lt; 10% ✅ · 10–30% ⚠️ · &gt;30% ❌ &nbsp;|&nbsp; ndc ≥ 5 ✅ &nbsp;|&nbsp; %P/T &lt; 10% ✅</p>
                  </div>
                </div>

              </div>
            )}

            {!results && (
              <div className="bg-white border border-[#dbeafe] border-dashed rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-[#1e3a5f] text-sm">Enter all measurements above to calculate GRR results.</p>
                <p className="text-[#1e3a5f] text-xs mt-1">Or click <span className="text-cyan-600">🧪 Load Sample</span> to see a worked example.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* -- KNOWLEDGE HUB TAB ----------------------------------------------- */}
          {/* -- MSA Completeness Score ---------------------------------- */}
          <div className="mt-4 bg-white rounded-xl border border-indigo-700/50 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 p-4 cursor-pointer" style={{background:'#4f46e5'}}
              onClick={e=>{e.stopPropagation(); const el=document.getElementById('msa-score-body'); if(el) el.classList.toggle('hidden');}}>
              <span className="text-2xl">📋</span>
              <div>
                <div className="text-sm font-bold text-white">MSA Completeness Score</div>
                <div className="text-xs" style={{color:'rgba(255,255,255,0.75)'}}>14-point IATF readiness check — verify your MSA before PPAP submission</div>
              </div>
            </div>
            <div id="msa-score-body" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {MSA_SCORE_ITEMS.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer"
                    style={{border: msaChecks[i] ? '1px solid #818cf8' : '1px solid #e2e8f0', background: msaChecks[i] ? '#eef2ff' : '#f8fafc'}}>
                    <input type="checkbox" checked={!!msaChecks[i]}
                      onChange={e => setMsaChecks(p => ({...p, [i]: e.target.checked}))}
                      style={{marginTop:'2px', width:'14px', height:'14px', flexShrink:0, accentColor:'#4f46e5'}} />
                    <span className="text-xs leading-relaxed" style={{color: msaChecks[i] ? '#4f46e5' : '#374151', textDecoration: msaChecks[i] ? 'line-through' : 'none', fontWeight: msaChecks[i] ? 600 : 400}}>{item}</span>
                  </label>
                ))}
              </div>
              {(() => {
                const done = Object.values(msaChecks).filter(Boolean).length;
                const total = MSA_SCORE_ITEMS.length;
                const pct = Math.round((done/total)*100);
                const ok = done === total;
                const col = ok ? '#4f46e5' : pct >= 70 ? '#d97706' : '#dc2626';
                return (
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1" style={{color: col}}>
                      <span>MSA Readiness Score</span>
                      <span>{done}/{total} ({pct}%)</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden mb-3" style={{background:'#e2e8f0'}}>
                      <div className="h-3 rounded-full transition-all duration-500" style={{width:`${pct}%`, background: col}} />
                    </div>
                    {ok ? (
                      <div className="text-center p-4 rounded-xl" style={{background:'#eef2ff', border:'2px solid #818cf8'}}>
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-sm font-bold" style={{color:'#4f46e5'}}>MSA PPAP READY</div>
                        <div className="text-xs mt-1" style={{color:'#6366f1'}}>All 14 criteria met. MSA package ready for PPAP Element 8 submission.</div>
                      </div>
                    ) : (
                      <div className="text-xs p-3 rounded-xl" style={{background:'#fff5f5', border:'1px solid #fecaca', color:'#991b1b'}}>
                        ⚠️ {total - done} criteria not yet met. Do not submit MSA for PPAP approval until all gaps are closed.
                        {pct < 50 && ' CRITICAL: Major MSA gaps — CC characteristics may be measured with unvalidated gauges.'}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* -- Bias Study Quick Generator ------------------------------- */}
          <div className="mt-4 rounded-xl overflow-hidden shadow-sm" style={{border:'2px solid #4f46e544'}}>
            <div className="flex items-center justify-between p-4 cursor-pointer flex-wrap gap-y-2" style={{background:'#7c3aed'}}
              onClick={()=>setShowBiasGen(s=>!s)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="text-sm font-bold text-white">Bias Study Analyzer</div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.75)'}}>Enter 10 readings around a reference value — instant bias, % bias, and t-test result</div>
                </div>
              </div>
              <span className="text-white text-lg">{showBiasGen ? '▲' : '▼'}</span>
            </div>
            {showBiasGen && (
              <div className="p-5" style={{background:'#f8fafc'}}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    {label:'Gauge Name', key:'gauge', ph:'e.g. Outside Micrometer M25'},
                    {label:'Part / Characteristic', key:'part', ph:'e.g. Shaft OD 25.000 mm'},
                    {label:'Reference Value (Master)', key:'refValue', ph:'e.g. 25.000'},
                    {label:'USL / LSL (for % Tolerance)', key:'usl', ph:'e.g. USL=25.020 LSL=24.980'},
                  ].map(f=>(
                    <div key={f.key}>
                      <label className="text-xs font-bold text-[#1e3a5f] block mb-1">{f.label}</label>
                      <input value={(biasInfo as any)[f.key]} onChange={e=>setBiasInfo(g=>({...g,[f.key]:e.target.value}))}
                        placeholder={f.ph}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#dbeafe] outline-none"
                        style={{boxSizing:'border-box'}} />
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-[#1e3a5f] block mb-1">Measurements — paste 10 values, comma-separated (e.g. 25.002, 24.998, 25.001...)</label>
                  <textarea value={biasInfo.readings} onChange={e=>setBiasInfo(g=>({...g,readings:e.target.value}))}
                    placeholder="25.002, 24.998, 25.001, 25.003, 24.999, 25.002, 25.000, 25.001, 24.999, 25.002"
                    rows={3} className="w-full text-xs p-2.5 rounded-lg border border-[#dbeafe] outline-none font-mono" style={{boxSizing:'border-box'}} />
                </div>
                {(() => {
                  const ref = parseFloat(biasInfo.refValue);
                  const vals = biasInfo.readings.split(',').map(v=>parseFloat(v.trim())).filter(v=>!isNaN(v));
                  if (!vals.length || isNaN(ref)) return (
                    <div className="text-xs text-[#1e3a5f] text-center p-4">Enter reference value and at least 1 measurement to see results.</div>
                  );
                  const n = vals.length;
                  const mean = vals.reduce((a,b)=>a+b,0)/n;
                  const bias = mean - ref;
                  const variance = vals.reduce((a,v)=>a+Math.pow(v-mean,2),0)/(n-1);
                  const sd = Math.sqrt(variance);
                  const se = sd/Math.sqrt(n);
                  const t = se > 0 ? Math.abs(bias/se) : 0;
                  const tCrit = 2.262; // t-critical for n=10, alpha=0.05, two-tailed
                  const biasSignificant = t > tCrit;
                  const pctBias = (Math.abs(bias) / Math.max(sd*5.15, 0.001)) * 100;
                  const col = biasSignificant ? '#dc2626' : pctBias < 10 ? '#4f46e5' : '#d97706';
                  return (
                    <div className="rounded-xl overflow-hidden border-2" style={{borderColor: col}}>
                      <div className="p-3 text-center font-bold text-white text-sm" style={{background: col}}>
                        {biasInfo.gauge || 'GAUGE'} — BIAS STUDY RESULT
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4" style={{background:'#fff'}}>
                        {[
                          {label:'Avg Measured', value: mean.toFixed(4), unit:''},
                          {label:'Reference Value', value: ref.toFixed(4), unit:''},
                          {label:'Bias', value: bias.toFixed(4), unit:'', highlight: Math.abs(bias)>0.001},
                          {label:'Std Dev (σ)', value: sd.toFixed(4), unit:''},
                          {label:'n (readings)', value: n.toString(), unit:''},
                          {label:'t-statistic', value: t.toFixed(3), unit:''},
                          {label:'t-critical (α=0.05)', value: tCrit.toFixed(3), unit:''},
                          {label:'% Bias', value: pctBias.toFixed(1), unit:'%', highlight: pctBias>10},
                        ].map(r=>(
                          <div key={r.label} className="p-2 rounded-lg text-center" style={{background:'#f1f5f9'}}>
                            <div className="text-xs text-[#1e3a5f] mb-1">{r.label}</div>
                            <div className="text-sm font-extrabold" style={{color: r.highlight ? '#dc2626' : '#1e293b'}}>{r.value}{r.unit}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t" style={{borderColor: `${col}33`, background:`${col}08`}}>
                        <div className="text-xs font-extrabold mb-1" style={{color: col}}>
                          {biasSignificant ? `❌ SIGNIFICANT BIAS DETECTED — t=${t.toFixed(3)} > t_critical=${tCrit.toFixed(3)}` : `✅ NO SIGNIFICANT BIAS — t=${t.toFixed(3)} ≤ t_critical=${tCrit.toFixed(3)}`}
                        </div>
                        <div className="text-xs" style={{color:'#374151'}}>
                          {biasSignificant
                            ? `Gauge reads consistently ${bias > 0 ? 'HIGH' : 'LOW'} by ${Math.abs(bias).toFixed(4)}. Action required: check calibration zero point, inspect gauge condition, recalibrate.`
                            : `Bias is not statistically significant. Gauge is accurate at this reference point. Document this result in PPAP Element 8.`}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

      {mainTab === 'guide' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_GRR_vs_Tolerance_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>GRR Guide PDF</a>
            <a href="/downloads/msa/MSA_Bias_Linearity_Stability_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Bias/Lin/Stab Guide</a>
            <a href="/downloads/msa/MSA_Attribute_GRR_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Attribute GRR Guide</a>
            <a href="/downloads/msa/MSA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-white border border-cyan-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">🔬 What is MSA?</h2>
              <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
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
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-blue-700/50/50 rounded-2xl p-6">
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
                  <div key={s.type} className="bg-white rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{s.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm mb-2">{s.type}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          <div><span className="text-[#1e3a5f]">When: </span><span className="text-[#1e3a5f]">{s.when}</span></div>
                          <div><span className="text-[#1e3a5f]">Measures: </span><span className="text-[#1e3a5f]">{s.what}</span></div>
                          <div><span className="text-[#1e3a5f]">Target: </span><span className="text-cyan-600">{s.target}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">✅ GRR Acceptance Criteria — AIAG MSA 4th Edition</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white">
                      <th className="border border-[#dbeafe] px-4 py-3 text-left text-[#1e3a5f]">Metric</th>
                      <th className="border border-[#dbeafe] px-4 py-3 text-center text-green-600">✅ Acceptable</th>
                      <th className="border border-[#dbeafe] px-4 py-3 text-center text-yellow-600">⚠️ Conditional</th>
                      <th className="border border-[#dbeafe] px-4 py-3 text-center text-red-600">❌ Unacceptable</th>
                      <th className="border border-[#dbeafe] px-4 py-3 text-left text-[#1e3a5f]">Guidance</th>
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
                      <tr key={m} className="border-b border-[#dbeafe]">
                        <td className="border border-[#dbeafe] px-4 py-2 text-[#1e3a5f] font-semibold">{m}</td>
                        <td className="border border-[#dbeafe] px-4 py-2 text-center text-green-600">{a}</td>
                        <td className="border border-[#dbeafe] px-4 py-2 text-center text-yellow-600">{c}</td>
                        <td className="border border-[#dbeafe] px-4 py-2 text-center text-red-600">{u}</td>
                        <td className="border border-[#dbeafe] px-4 py-2 text-[#1e3a5f]">{act}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-purple-900/50 rounded-2xl p-6">
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
                  <div key={f} className="bg-white rounded-lg px-3 py-2">
                    <span className="text-cyan-600 font-bold">{f}</span>
                    <span className="text-[#1e3a5f] ml-2">{eq}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- Q&A TAB ---------------------------------------------------------- */}
      {mainTab === 'qa' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_GRR_vs_Tolerance_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>GRR Guide PDF</a>
            <a href="/downloads/msa/MSA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/msa/MSA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>IATF Clause Map</a>
          </div>
          <div className="max-w-4xl mx-auto space-y-5">

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Conduct a GRR Study</h2>
              <p className="text-[#1e3a5f] text-sm mt-1">AIAG MSA 4th Edition · Standard: 10 parts × 3 operators × 2 trials</p>
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
              <div key={s.step} className="bg-white border border-[#dbeafe] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-teal-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="text-cyan-300 font-bold text-sm">{s.title}</h3>
                    </div>
                    <p className="text-[#1e3a5f] text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white border border-red-900/50 rounded-2xl p-6">
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
                    <div className="flex items-start gap-2 bg-red-50 border border-red-800/30 rounded-lg p-3">
                      <span className="text-red-600 text-sm flex-shrink-0">✗</span>
                      <p className="text-red-700 text-xs">{m}</p>
                    </div>
                    <div className="flex items-start gap-2 bg-green-900/30/20 border border-green-700/50 rounded-lg p-3">
                      <span className="text-green-600 text-sm flex-shrink-0">✓</span>
                      <p className="text-[#15803d] text-xs">{f}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-purple-900/50 rounded-2xl p-6">
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
                  <div key={i} className="flex items-start gap-3 bg-purple-900/30/20 border border-purple-700/50 rounded-lg px-4 py-3">
                    <span className="text-purple-600 font-bold text-sm flex-shrink-0">Q{i+1}</span>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {mainTab === 'templates' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_GRR_Study_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>GRR Study Template XLS</a>
            <a href="/downloads/msa/MSA_Gauge_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>Gauge Register XLS</a>
            <a href="/downloads/msa/MSA_Bias_Linearity_Stability.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Bias/Lin/Stab XLS</a>
            <a href="/downloads/msa/MSA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Audit Checklist XLS</a>
          </div>
          <div className="max-w-screen-xl mx-auto">
            <p className="text-[#1e3a5f] text-sm mb-5">MSA study worksheets for all study types — GRR, Bias, Linearity, Attribute Agreement.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name:'GRR Study — Average & Range Method', type:'Excel', icon:'🔬', desc:'Full GRR data sheet — 3 operators, 10 parts, 2–3 trials, auto-calculates %EV, %AV, %GRR, ndc with AIAG acceptance table', file:'/downloads/msa/MSA_GRR_Avg_Range.xlsx' },
                { name:'GRR Study — ANOVA Method', type:'Excel', icon:'📊', desc:'ANOVA-based GRR — more accurate for interaction effects, preferred for PPAP Element 8, includes F-test results', file:'/downloads/msa/MSA_GRR_ANOVA.xlsx' },
                { name:'Bias & Linearity Study', type:'Excel', icon:'📐', desc:'Bias study worksheet (10 readings × 1 reference) and linearity (5 reference points × 12 readings each) with regression plot', file:'/downloads/msa/MSA_Bias_Linearity.xlsx' },
                { name:'Attribute Agreement Analysis', type:'Excel', icon:'✅', desc:'Kappa coefficient calculator for go/no-go and visual inspection — 3 appraisers, 20 parts, 2 trials', file:'/downloads/msa/MSA_Attribute_Agreement.xlsx' },
              ].map(tpl => (
                <div key={tpl.name} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex gap-3 items-start" onDoubleClick={() => tpl.file.endsWith('.pdf') && window.open(tpl.file, '_blank')} title={tpl.file.endsWith('.pdf') ? 'Double-click to view' : ''} style={{ cursor: tpl.file.endsWith('.pdf') ? 'pointer' : 'default' }}>
                  <div className="text-2xl flex-shrink-0">{tpl.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm mb-1">{tpl.name}</div>
                    <div className="text-[#1e3a5f] text-xs mb-2 leading-relaxed">{tpl.desc}</div>
                    <a href={tpl.file} download className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-700 hover:bg-green-600 transition">⬇ {tpl.type}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'docs' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/AIAG_MSA_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>AIAG MSA 4th Ed.</a>
            <a href="/downloads/msa/MSA_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Case Studies PDF</a>
            <a href="/downloads/msa/MSA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/msa/MSA_Competency_Matrix.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Competency Matrix</a>
          </div>
          <div className="max-w-screen-xl mx-auto space-y-4">
            <div className="bg-white border border-teal-200 rounded-2xl p-5 flex items-center gap-5">
              <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📏</div>
              <div className="flex-1">
                <div className="font-bold text-white text-base mb-1">AIAG MSA Reference Manual (4th Edition)</div>
                <div className="text-[#1e3a5f] text-xs mb-2">Complete AIAG MSA 4th Edition — GRR (Avg & Range, ANOVA), Bias, Linearity, Stability, Attribute Agreement, acceptance criteria, expanded uncertainty</div>
                <div className="flex gap-2"><span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">PDF · 3.4 MB</span></div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href="/downloads/msa/AIAG_MSA_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-bold">👁 View PDF</a>
                <a href="/downloads/msa/AIAG_MSA_Fourth_Edition.pdf" download className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-bold">⬇ Download</a>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { title:'MSA Study Type Selection Guide', icon:'📌', desc:'Decision guide — GRR vs Bias vs Linearity vs Stability vs Attribute based on gauge type and use', file:'/downloads/msa/MSA_Study_Selection_Guide.pdf' },
                { title:'GRR Results Interpretation Reference', icon:'🔍', desc:'%GRR zones, ndc requirements, corrective action guide for each acceptance category', file:'/downloads/msa/MSA_GRR_Interpretation.pdf' },
                { title:'MSA IATF Audit Checklist', icon:'✔️', desc:'25-point checklist for IATF 16949 Cl. 7.1.5.1 — all study types, calibration linkage, PPAP Element 8', file:'/downloads/msa/MSA_IATF_Audit_Checklist.pdf' },
              ].map(doc => (
                <div key={doc.title} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex items-center gap-4" onDoubleClick={() => window.open(doc.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                  <div className="text-2xl flex-shrink-0">{doc.icon}</div>
                  <div className="flex-1"><div className="font-semibold text-white text-sm mb-1">{doc.title}</div><div className="text-[#1e3a5f] text-xs">{doc.desc}</div></div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={doc.file} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white text-[#1e3a5f] rounded-lg text-xs font-bold">View →</a>
                    <a href={doc.file} download className="px-3 py-2 bg-teal-800 text-white rounded-lg text-xs font-bold">⬇ PDF</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'posters' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_Posters_A3.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>All MSA Posters PDF</a>
            <a href="/downloads/msa/MSA_GRR_vs_Tolerance_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>GRR Guide PDF</a>
            <a href="/downloads/msa/MSA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <div className="max-w-screen-xl mx-auto">
            <p className="text-[#1e3a5f] text-sm mb-5">Print-ready MSA posters for quality lab, calibration room, and gauge keeper workstations.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title:'GRR Acceptance Zones Poster', size:'A1 Poster', desc:'Visual: %GRR < 10% green · 10–30% yellow · > 30% red — with ndc scale and example gauges for each zone', colors:['#0e7490','#0891b2'], file:'/downloads/msa/MSA_GRR_Zones_Poster.pdf' },
                { title:'MSA Study Types Reference', size:'A1 Poster', desc:'All 5 MSA study types — GRR, Bias, Linearity, Stability, AAA — when to use each, targets, and AIAG reference', colors:['#6d28d9','#7c3aed'], file:'/downloads/msa/MSA_Study_Types_Poster.pdf' },
                { title:'GRR Study Roadmap', size:'A2 Poster', desc:'Step-by-step: calibrate → select parts → code → blind study → trial 1 → trial 2 → calculate → decide', colors:['#065f46','#047857'], file:'/downloads/msa/MSA_GRR_Roadmap_Poster.pdf' },
                { title:'%EV vs %AV Diagnosis Guide', size:'A2 Banner', desc:'High %EV = gauge hardware problem (wear, calibration, fixture) · High %AV = operator method problem (training, technique)', colors:['#92400e','#b45309'], file:'/downloads/msa/MSA_EV_AV_Diagnosis_Banner.pdf' },
                { title:'MSA Mistakes to Avoid', size:'A2 Banner', desc:'Top 6 MSA mistakes in automotive production — non-blind study, bad part selection, no re-GRR after repair', colors:['#991b1b','#b91c1c'], file:'/downloads/msa/MSA_Mistakes_Banner.pdf' },
                { title:'IATF Gauge Control Flow', size:'A3 Poster', desc:'Calibration → GRR → Control Plan link → PPAP Element 8 → Ongoing MSA — complete IATF Cl. 7.1.5 compliance flow', colors:['#1e3a5f','#1e40af'], file:'/downloads/msa/MSA_IATF_Flow_Poster.pdf' },
              ].map(p => (
                <div key={p.title} className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden" onDoubleClick={() => window.open(p.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                  <div style={{ background:`linear-gradient(135deg, ${p.colors[0]}33, ${p.colors[1]}55)`, borderBottom:'1px solid #374151' }} className="h-36 flex flex-col items-center justify-center gap-2 p-4">
                    <div className="flex gap-2">{p.colors.map((c,i) => <div key={i} style={{ width:18, height:18, borderRadius:4, background:c }} />)}</div>
                    <div style={{ color:p.colors[0], fontSize:11, fontWeight:700, textAlign:'center' }}>{p.title}</div>
                    <div className="text-xs text-[#1e3a5f] bg-white px-2 py-0.5 rounded-full">{p.size}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-white font-semibold text-xs mb-1">{p.title}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed mb-3">{p.desc}</p>
                    <div className="flex gap-2">
                      <a href={p.file} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-bold py-2 bg-white text-[#1e3a5f] rounded-lg">🖨️ View</a>
                      <a href={p.file} download className="flex-1 text-center text-xs font-bold py-2 bg-teal-800 text-white rounded-lg">⬇ Download</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ══ DASHBOARD ════════════════════════════════════════════════════ */}
      {mainTab === 'dashboard' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_Gauge_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Gauge Register XLS</a>
            <a href="/downloads/msa/MSA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Audit Checklist XLS</a>
            <a href="/downloads/msa/MSA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>NC Findings PDF</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#4f46e5'}}>📊 MSA Dashboard</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Gauge register status, GRR coverage, calibration health, and open action tracking</div>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              {label:'Total Gauges', value:'24', icon:'🔧', color:'#4f46e5', sub:'In active gauge register'},
              {label:'GRR Completed', value:'18', icon:'✅', color:'#0d9488', sub:'75% coverage'},
              {label:'GRR Overdue', value:'3', icon:'⚠️', color:'#d97706', sub:'Requires immediate study'},
              {label:'Calibration Overdue', value:'2', icon:'❌', color:'#dc2626', sub:'Out-of-service immediately'},
            ].map(k=>(
              <div key={k.label} className="bg-white border rounded-xl p-4 shadow-sm" style={{borderColor:'#e2e8f0'}}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{k.icon}</span>
                  <div className="text-xs text-[#1e3a5f] font-semibold">{k.label}</div>
                </div>
                <div className="text-3xl font-extrabold" style={{color:k.color}}>{k.value}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">{k.sub}</div>
              </div>
            ))}
          </div>
          {/* GRR Status by Gauge Type */}
          <div className="bg-white border rounded-xl p-5 mb-4 shadow-sm" style={{borderColor:'#e2e8f0'}}>
            <div className="text-sm font-bold mb-4" style={{color:'#4f46e5'}}>GRR Status by Gauge Type</div>
            {[
              {type:'Vernier Calipers', total:6, grr:6, pct:100, status:'All Pass'},
              {type:'Micrometers', total:5, grr:4, pct:80, status:'1 Overdue'},
              {type:'Height Gauges', total:3, grr:3, pct:100, status:'All Pass'},
              {type:'Hardness Testers', total:2, grr:1, pct:50, status:'1 Overdue'},
              {type:'CMM (Coordinate)', total:1, grr:1, pct:100, status:'All Pass'},
              {type:'Go/No-Go Gauges', total:4, grr:2, pct:50, status:'2 Need Attribute GRR'},
              {type:'Torque Gauges', total:3, grr:1, pct:33, status:'2 Overdue'},
            ].map(g=>(
              <div key={g.type} className="flex items-center gap-4 mb-3">
                <div className="text-xs font-semibold w-40 text-[#1e3a5f] flex-shrink-0">{g.type}</div>
                <div className="flex-1 flex gap-1 items-center">
                  <div className="h-5 rounded flex items-center justify-center text-white text-xs font-bold" style={{width:`${g.pct}%`, minWidth:'28px', background: g.pct===100?'#0d9488':g.pct>=70?'#d97706':'#dc2626'}}>{g.grr}/{g.total}</div>
                </div>
                <div className="text-xs font-semibold flex-shrink-0" style={{color:g.pct===100?'#0d9488':g.pct>=70?'#d97706':'#dc2626'}}>{g.status}</div>
              </div>
            ))}
          </div>
          {/* Action Items */}
          <div className="bg-white border rounded-xl p-5 shadow-sm" style={{borderColor:'#fecaca'}}>
            <div className="text-sm font-bold mb-4 text-red-700">⚠️ MSA Action Items</div>
            {[
              {item:'Torque Wrench G-015 — GRR expired 6 months ago', risk:'HIGH', action:'Do not use until GRR < 30% confirmed', owner:'Metrology', due:'Immediate'},
              {item:'Hardness Tester G-022 — linearity study never done', risk:'HIGH', action:'Schedule linearity study (5 ref parts)', owner:'QA Eng', due:'2025-08-20'},
              {item:'Go/No-Go Thread Gauges G-008, G-012 — no attribute GRR', risk:'MED', action:'Set up 50-part attribute GRR with 3 inspectors', owner:'QA Eng', due:'2025-09-01'},
            ].map((a,i)=>(
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg mb-2" style={{background: a.risk==='HIGH'?'#fff5f5':'#fffbeb', border:`1px solid ${a.risk==='HIGH'?'#fecaca':'#fde68a'}`}}>
                <span className="text-xs font-bold px-2 py-0.5 rounded text-white flex-shrink-0" style={{background: a.risk==='HIGH'?'#dc2626':'#d97706'}}>{a.risk}</span>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#1e3a5f]">{a.item}</div>
                  <div className="text-xs text-[#1e3a5f]">{a.action}</div>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <div className="text-[#1e3a5f]">{a.owner}</div>
                  <div className="text-red-500">Due: {a.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ DEEP DIVE ════════════════════════════════════════════════════ */}
      {mainTab === 'deepdive' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/AIAG_MSA_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>AIAG MSA 4th Ed.</a>
            <a href="/downloads/msa/MSA_Bias_Linearity_Stability_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Bias/Lin/Stab Guide</a>
            <a href="/downloads/msa/MSA_Attribute_GRR_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Attribute GRR Guide</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#4f46e5'}}>🧩 All 5 MSA Study Types — Deep Dive</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Every study type explained with method, metrics, acceptance criteria, and IATF clause — AIAG MSA 4th Edition</div>
          <div className="flex flex-col gap-3">
            {MSA_STUDY_TYPES.map(st => (
              <div key={st.no} className="rounded-xl overflow-hidden shadow-sm" style={{border:'1px solid #e0e7ff'}}>
                <div className="flex items-center gap-4 p-4" style={{background: st.color}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0" style={{background:'rgba(255,255,255,0.2)'}}>
                    {st.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{st.name}</div>
                    <div className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>{st.iatf}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={{background:'#f8fafc'}}>
                  {[
                    {label:'When Required', value: st.when, col: st.color},
                    {label:'Method', value: st.method, col: st.color},
                    {label:'Metrics', value: st.metrics, col: st.color},
                    {label:'Acceptance', value: st.accept, col: st.color},
                  ].map((f,i)=>(
                    <div key={i} className="p-3 border-r border-indigo-50 last:border-0">
                      <div className="text-xs font-bold mb-1" style={{color: f.col}}>{f.label}</div>
                      <div className="text-xs text-[#1e3a5f] leading-relaxed">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ WORKFLOW ══════════════════════════════════════════════════════ */}
      {mainTab === 'workflow' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_GRR_Study_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>GRR Template XLS</a>
            <a href="/downloads/msa/MSA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
            <a href="/downloads/msa/MSA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>Audit Checklist XLS</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#4f46e5'}}>🔄 MSA Development Workflow</div>
          <div className="text-xs text-[#1e3a5f] mb-5">End-to-end: from APQP Phase 3 planning to PPAP Element 8 submission and ongoing monitoring</div>
          <div className="flex flex-col gap-0">
            {[
              {n:1, action:'Define MSA Plan in APQP Phase 3 — list all gauges needed for Control Plan', who:'Quality Engineer', tool:'Control Plan draft, APQP timing plan', timing:'APQP Phase 3', color:'#4f46e5'},
              {n:2, action:'Add all gauges to Gauge Register with calibration schedule', who:'Metrology / QA Engineer', tool:'Gauge Register template', timing:'APQP Phase 3', color:'#4f46e5'},
              {n:3, action:'Calibrate all gauges against traceable reference standards', who:'Metrology', tool:'Calibration procedure, NABL lab certs', timing:'Before GRR', color:'#0d9488'},
              {n:4, action:'Select study parts: 10 parts spanning process variation range', who:'Quality Engineer', tool:'Historical process data, CMM measurements', timing:'Week 1', color:'#0d9488'},
              {n:5, action:'Train all operators in measurement technique before study', who:'QA Engineer / Training', tool:'Gauge usage procedure, measurement WI', timing:'Week 1', color:'#d97706'},
              {n:6, action:'Conduct GRR study: blind, randomized, 3 operators × 2 trials × 10 parts', who:'Quality Engineer', tool:'GRR Study Template, micrometer/gauge', timing:'Week 1-2', color:'#d97706'},
              {n:7, action:'Calculate: EV, AV, GRR, PV, TV, NDC, %GRR, %Tolerance', who:'Quality Engineer', tool:'MSA software, AIAG MSA 4th Ed. tables', timing:'Week 2', color:'#7c3aed'},
              {n:8, action:'If GRR > 30%: investigate, repair gauge, re-study before proceeding', who:'QA Manager + Metrology', tool:'Root cause analysis, gauge maintenance', timing:'As needed', color:'#dc2626'},
              {n:9, action:'Conduct Bias study for all reference gauges', who:'Quality Engineer', tool:'Bias Study Template, reference master', timing:'Week 2', color:'#7c3aed'},
              {n:10, action:'Conduct Linearity study for gauges used across full range', who:'Quality Engineer', tool:'Linearity Study Template, 5 ref parts', timing:'Week 2-3', color:'#0d9488'},
              {n:11, action:'Set up Stability monitoring for critical gauges (start control chart)', who:'QA Team + Metrology', tool:'Stability Study Template, reference part', timing:'Week 3', color:'#0d9488'},
              {n:12, action:'Complete Attribute GRR for all go/no-go and visual inspection gauges', who:'Quality Engineer', tool:'50 borderline parts, 3 inspectors', timing:'Week 3', color:'#4f46e5'},
              {n:13, action:'Compile MSA package — include in PPAP Element 8', who:'Quality Manager', tool:'All GRR, Bias, Linearity, Stability reports', timing:'Before SOP', color:'#1e40af'},
              {n:14, action:'Ongoing: re-study after 4M change, gauge repair, or quality alert', who:'Quality Team', tool:'4M change register, complaint log', timing:'Triggered', color:'#1e293b'},
            ].map((s,i) => (
              <div key={s.n} className="flex gap-0 items-stretch">
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0 mt-2" style={{background:s.color}}>{s.n}</div>
                  {i<13 && <div className="w-0.5 flex-1 mt-1" style={{background:`${s.color}55`}} />}
                </div>
                <div className="flex-1 ml-3 mb-2 rounded-xl p-3 bg-white shadow-sm" style={{border:`1px solid ${s.color}33`}}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-bold text-[#1e3a5f]">{s.action}</div>
                    <div className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-semibold" style={{background:`${s.color}15`, color:s.color}}>{s.timing}</div>
                  </div>
                  <div className="flex gap-4 text-xs text-[#1e3a5f]">
                    <span>👤 {s.who}</span>
                    <span>🔧 {s.tool}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ CASE STUDIES ════════════════════════════════════════════════ */}
      {mainTab === 'casestudies' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Case Studies PDF</a>
            <a href="/downloads/msa/MSA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/msa/MSA_GRR_vs_Tolerance_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>GRR Guide PDF</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#4f46e5'}}>📂 MSA Case Studies</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Real-world GRR failures, audit findings, and measurement system improvements</div>
          <div className="flex flex-col gap-5">
            {[
              {id:'CS-MSA01', part:'Engine Block Bore Diameter — Air Gauge', customer:'Tata Motors', status:'IATF MAJOR NC', color:'#dc2626', tag:'GRR 42% Unacceptable',
                problem:'IATF auditor asked for GRR report on air gauge used for CC bore diameter. GRR was 42%. Gauge was calibrated — but calibration does not equal GRR acceptance.',
                cause:'Air gauge nozzles were worn. Calibration adjusts the zero/span but does not detect wear-induced repeatability loss. GRR was never repeated after nozzle maintenance.',
                lesson:'Calibrated does not mean GRR-accepted. GRR must be re-studied after any gauge maintenance. Wear affects EV (repeatability) — calibration cannot detect this.',
                best:'Replaced nozzles. Re-GRR: 7.2%. Set 6-monthly GRR re-study schedule. Calibration and GRR dates now tracked separately in Gauge Register.'},
              {id:'CS-MSA02', part:'Heat Treatment Hardness — HRC Testing', customer:'Maruti Suzuki', status:'IATF NC + Rework', color:'#7c3aed', tag:'Linearity Study Failure',
                problem:'Hardness tester passed GRR (12%). But 3-month stability chart showed increasing positive drift above 62 HRC. Customer returned 400 parts — all were over-hardened but accepted internally.',
                cause:'GRR study covered only the mid-range (58-62 HRC). Linearity study was never done. Tester had non-linear response at upper range due to worn Vickers indenter creep.',
                lesson:'GRR at one point is not sufficient. Linearity study is essential for gauges used across a range. The 10-part GRR should span the full process variation range.',
                best:'Replaced indenter. Full linearity study across 48-68 HRC. R² = 0.97. Annual linearity study added as mandatory requirement in MSA Plan.'},
              {id:'CS-MSA03', part:'Surface Finish — Visual Inspection, Visible Parts', customer:'Ashok Leyland', status:'CUSTOMER COMPLAINT', color:'#d97706', tag:'Attribute GRR Kappa 0.41',
                problem:'Customer complaints for scratched parts. Internal visual inspection was passing these parts. 3 inspectors with no defined visual standard.',
                cause:'Attribute GRR study (done after complaint) showed Kappa = 0.41 between inspectors — "Unacceptable." Borderline scratches classified differently by each inspector.',
                lesson:'Subjective visual inspection without defined limit samples is not a controlled process. Attribute GRR must be done before using visual inspection for CC/SC characteristics.',
                best:'Defined visual standard with golden samples (Pass, Fail, Borderline). Photos laminated at inspection station. Re-GRR: Kappa = 0.82. Zero repeat complaints.'},
              {id:'CS-MSA04', part:'M12 Thread — Go/No-Go Gauge', customer:'Self-identified', status:'PROACTIVE SUCCESS', color:'#0d9488', tag:'Stability Study Prevented Escape',
                problem:'During monthly stability check, QA engineer noticed Go gauge X-bar chart trending toward UCL. Parts were still conforming but trend was clear.',
                cause:'High-volume inspection causing gauge wear. Wear was gradual — daily check would not reveal it without a control chart baseline.',
                lesson:'Stability monitoring is not just "checking the gauge." It is a statistical process that detects drift before a gauge starts accepting non-conforming product.',
                best:'Gauge replaced proactively before any non-conformance occurred. Zero customer impact. Gauge wear rate used to revise calibration/GRR interval from annual to 6-monthly.'},
            ].map(cs=>(
              <div key={cs.id} className="rounded-2xl overflow-hidden shadow-sm" style={{border:`2px solid ${cs.color}33`}}>
                <div className="flex items-start justify-between p-4" style={{background:`${cs.color}10`, borderBottom:`1px solid ${cs.color}33`}}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{background:cs.color}}>{cs.id}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{color:cs.color, border:`1px solid ${cs.color}44`}}>{cs.tag}</span>
                    </div>
                    <div className="text-sm font-extrabold text-[#1e3a5f]">{cs.part}</div>
                    <div className="text-xs text-[#1e3a5f]">Customer: {cs.customer}</div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 rounded-lg" style={{background:`${cs.color}15`, color:cs.color, border:`1px solid ${cs.color}44`}}>{cs.status}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="p-3 rounded-lg" style={{background:'#fff5f5', border:'1px solid #fecaca'}}>
                    <div className="text-xs font-bold text-red-600 mb-1">⚠️ Problem</div>
                    <div className="text-xs text-red-900 leading-relaxed">{cs.problem}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{background:'#fffbeb', border:'1px solid #fde68a'}}>
                    <div className="text-xs font-bold text-yellow-300 mb-1">🔍 Root Cause</div>
                    <div className="text-xs text-yellow-100 leading-relaxed">{cs.cause}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{background:'#f0fdf4', border:'1px solid #bbf7d0'}}>
                    <div className="text-xs font-bold text-[#15803d] mb-1">💡 Lesson Learned</div>
                    <div className="text-xs text-green-200 leading-relaxed">{cs.lesson}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{background:'#eff6ff', border:'1px solid #bfdbfe'}}>
                    <div className="text-xs font-bold text-[#1d4ed8] mb-1">⭐ Best Practice</div>
                    <div className="text-xs text-[#1d4ed8] leading-relaxed">{cs.best}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TRAINING ════════════════════════════════════════════════════ */}
      {mainTab === 'training' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/msa/MSA_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Training Guide PDF</a>
            <a href="/downloads/msa/MSA_Competency_Matrix.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Competency Matrix</a>
            <a href="/downloads/msa/AIAG_MSA_Fourth_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#4f46e5'}}>AIAG MSA 4th Ed.</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#4f46e5'}}>🎓 MSA Training Academy</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Structured learning from Operator Awareness to MSA Expert — build measurement system competency at all levels</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {[
              {level:'Level 1', title:'MSA Awareness', role:'Operators / Technicians', color:'#0d9488', icon:'🌱', dur:'2 hours', topics:[
                'Why measurement matters — "garbage in, garbage out"',
                'What is repeatability and reproducibility in simple terms',
                'Why calibration matters and what expired calibration means',
                'How to participate correctly in a GRR study',
                'What to do if gauge reading looks unusual — report immediately',
              ]},
              {level:'Level 2', title:'MSA Practitioner', role:'Engineers / QA Staff', color:'#4f46e5', icon:'⚙️', dur:'1 full day', topics:[
                'AIAG MSA 4th Edition: 5 study types, when each is required',
                'GRR study design: operator, part, trial selection and randomization',
                'GRR calculation: EV, AV, GRR, PV, TV, NDC — manual and software',
                '% Study Var vs % Tolerance — which to report and when',
                'Bias study with t-test | Linearity study with regression',
                'Stability control chart setup and interpretation',
                'Attribute GRR: 50-part study, Kappa calculation, interpretation',
                'PPAP Element 8: what to submit and how to present results',
              ]},
              {level:'Level 3', title:'MSA Expert / Facilitator', role:'Quality Head / Managers', color:'#7c3aed', icon:'🏆', dur:'2 days + exam', topics:[
                'ANOVA method vs Average & Range — when each is appropriate',
                'Expanded uncertainty and 95% confidence intervals for MSA',
                'Customer-specific MSA requirements: Ford, GM, Stellantis',
                'Developing plant-wide MSA Plan and Gauge Register management',
                'IATF audit simulation — respond to 10 auditor questions on MSA',
                'Clauses 7.1.5.1, 7.1.5.2, 8.3.4.4, 8.5.1.1 deep dive',
                'Training and assessing Level 1 and Level 2 staff',
              ]},
            ].map(t=>(
              <div key={t.level} className="rounded-2xl overflow-hidden shadow-sm" style={{border:`2px solid ${t.color}33`}}>
                <div className="p-4" style={{background:t.color}}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <div className="text-xs font-bold" style={{color:'rgba(255,255,255,0.7)'}}>{t.level}</div>
                      <div className="text-sm font-extrabold text-white">{t.title}</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.8)'}}>{t.role}</div>
                  <div className="text-xs mt-1" style={{color:'rgba(255,255,255,0.6)'}}>Duration: {t.dur}</div>
                </div>
                <div className="p-4 bg-white">
                  {t.topics.map((tp,i)=>(
                    <div key={i} className="overflow-x-auto flex gap-2 py-1.5 border-b border-[#dbeafe] text-xs text-[#1e3a5f]">
                      <span className="font-bold flex-shrink-0" style={{color:t.color}}>✓</span>{tp}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Competency Matrix */}
          <div className="bg-white border rounded-xl p-5 shadow-sm" style={{borderColor:'#e2e8f0'}}>
            <div className="text-sm font-bold mb-4" style={{color:'#4f46e5'}}>📊 MSA Competency Matrix</div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{background:'#4f46e5'}}>
                  {['Role','GRR Studies','Bias/Lin/Stab','Attribute GRR','IATF Audit','PPAP Element 8'].map(h=>(
                    <th key={h} className="p-2 text-left text-white font-bold border border-indigo-800">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Quality Head','L3','L3','L3','L3','L3'],
                  ['Quality Manager','L3','L2','L2','L2','L3'],
                  ['Quality Engineer','L2','L2','L2','L2','L2'],
                  ['Metrology Technician','L3','L2','L1','L1','L1'],
                  ['Operator/Inspector','L1','L1','L1','—','—'],
                ].map((row,ri)=>(
                  <tr key={ri} style={{background: ri%2===0?'#eef2ff':'#fff'}}>
                    {row.map((cell,ci)=>(
                      <td key={ci} className="p-2 border border-[#dbeafe] font-bold"
                        style={{color: cell==='L3'?'#7c3aed': cell==='L2'?'#4f46e5': cell==='L1'?'#0d9488':'#9ca3af'}}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
      </>
  );
}
