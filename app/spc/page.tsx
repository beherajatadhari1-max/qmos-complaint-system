'use client';

import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';

// -- SPC Constants (AIAG SPC 2nd Ed.) -----------------------------------------
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
  if (v >= 1.67) return { label: 'World Class', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
  if (v >= 1.33) return { label: 'Capable',     bg: 'bg-green-900/30 border-green-700/50',   text: 'text-green-300' };
  if (v >= 1.00) return { label: 'Marginal',    bg: 'bg-yellow-900/30 border-yellow-700/50', text: 'text-yellow-300' };
  return             { label: 'Not Capable',    bg: 'bg-red-50 border-red-700/50',       text: 'text-red-600' };
}

// -- Inline SVG Control Chart --------------------------------------------------
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
      <>
      <PageTitle title="SPC" />
      <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-3 mb-3">
      <div className="text-xs font-bold text-[#1e3a5f] mb-1">{label}</div>
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
      <div className="flex gap-4 text-xs text-[#1e3a5f] mt-1">
        <span><span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-1"></span>OOC violation</span>
        <span><span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-1"></span>Run of 8</span>
        <span><span className="inline-block w-3 border-t border-orange-400 border-dashed mr-1"></span>USL/LSL</span>
      </div>

    </div>
      </>
  );
}

// -- SPC Chart Types -----------------------------------------------------------
const SPC_CHART_TYPES = [
  { no: 1, name: 'X-bar & R Chart', icon: '📊', color: '#0891b2',
    use: 'Variable data, subgroup size n=2 to 9. Most common in manufacturing.',
    when: 'Dimension, weight, hardness, temperature — any measured value',
    subgroup: 'n = 5 (standard). Min n=2. Use n=5 for most applications.',
    limits: 'UCL_X = X̄̄ + A2·R̄  |  LCL_X = X̄̄ - A2·R̄  |  UCL_R = D4·R̄', iatf: 'Clause 9.1.1' },
  { no: 2, name: 'X-bar & s Chart', icon: '📈', color: '#7c3aed',
    use: 'Variable data, larger subgroup size n≥10. More sensitive than R chart.',
    when: 'Large subgroups, CMM data, automated inspection systems',
    subgroup: 'n ≥ 10 recommended for s chart accuracy.',
    limits: 'UCL_X = X̄̄ + A3·s̄  |  UCL_s = B4·s̄  |  LCL_s = B3·s̄', iatf: 'Clause 9.1.1' },
  { no: 3, name: 'Individuals & Moving Range (I-MR)', icon: '🔵', color: '#d97706',
    use: 'Variable data, n=1. When only one reading per time period is available.',
    when: 'Destructive testing, slow processes, chemical analysis, lab measurements',
    subgroup: 'n = 1. Moving Range based on consecutive pairs.',
    limits: 'UCL_X = X̄ + 2.66·MR̄  |  LCL_X = X̄ - 2.66·MR̄  |  UCL_MR = 3.267·MR̄', iatf: 'Clause 9.1.1' },
  { no: 4, name: 'p-Chart (Proportion Defective)', icon: '🔴', color: '#dc2626',
    use: 'Attribute data. Proportion of defective items. Variable sample size allowed.',
    when: 'Go/No-Go inspection, visual defects, pass/fail testing',
    subgroup: 'n ≥ 50 per sample. At least 20 samples to set limits.',
    limits: 'UCL_p = p̄ + 3√(p̄(1-p̄)/n)  |  LCL_p = p̄ - 3√(p̄(1-p̄)/n)', iatf: 'Clause 9.1.1' },
  { no: 5, name: 'np-Chart (Number Defective)', icon: '🟠', color: '#f97316',
    use: 'Attribute data. Count of defective items. Constant sample size required.',
    when: 'Same as p-chart when sample size is fixed',
    subgroup: 'Constant n only. If n varies, use p-chart instead.',
    limits: 'UCL_np = np̄ + 3√(np̄(1-p̄))  |  LCL_np = np̄ - 3√(np̄(1-p̄))', iatf: 'Clause 9.1.1' },
  { no: 6, name: 'c-Chart (Count of Defects)', icon: '🟡', color: '#ca8a04',
    use: 'Count of defects per unit. Constant inspection area/unit required.',
    when: 'Welding defects per part, paint defects per panel, solder joints per board',
    subgroup: 'Constant unit size. Count all defects in each unit.',
    limits: 'UCL_c = c̄ + 3√c̄  |  LCL_c = c̄ - 3√c̄', iatf: 'Clause 9.1.1' },
];

const SPC_SCORE_ITEMS = [
  'SPC plan defined in Control Plan — chart type, frequency, gauge, subgroup size, who',
  'GRR < 30% confirmed for all gauges used in SPC (< 10% for CC characteristics)',
  'Control limits calculated from real process data — NOT from spec limits (USL/LSL)',
  'Minimum 25 subgroups collected before setting initial control limits',
  'Control charts physically at workstation, updated per defined frequency',
  'All 8 Nelson rules defined, displayed, and operators trained on response',
  'Out-of-control reaction plan posted at workstation — specific 5-step actions',
  'Out-of-control event log maintained — date, rule, action, restart verification',
  'Process capability: Ppk >= 1.67 for CC, Ppk >= 1.33 for SC (PPAP Element 9)',
  'Ongoing Cpk monitored monthly and included in Management Review',
  'Control limits recalculated after any 4M change or process upset',
  'SPC chart type appropriate for data type (variable vs attribute)',
  'Subgroup size consistent and rational — same n each subgroup',
  'SPC results used to drive process improvement — documented improvement projects',
];

export default function SPCPage() {
  const [mainTab, setMainTab] = useState<'overview' | 'guide' | 'generator' | 'analyser' | 'qa' | 'templates' | 'docs' | 'posters' | 'dashboard' | 'deepdive' | 'workflow' | 'casestudies' | 'training'>('overview');
  const [sgen, setSgen] = useState({ charName: '', partName: '', usl: '', lsl: '', subgroupSize: '5', dataType: 'Variable' });
  const [sgenResult, setSgenResult] = useState(false);
  const [showSpcScore, setShowSpcScore] = useState(false);
  const [spcChecks, setSpcChecks] = useState<Record<number,boolean>>({});
  const [showCpkCalc, setShowCpkCalc] = useState(false);
  const [cpkInfo, setCpkInfo] = useState({ char:'', uslStr:'', lslStr:'', meanStr:'', sdStr:'' });
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
    setMainTab('analyser');
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
    <div className="min-h-screen bg-white">

      {/* -- Header ----------------------------------------------------------- */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e2a5a 50%,#162044 100%)', padding: '22px 32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f160,transparent)' }} />
        <div className="max-w-screen-xl mx-auto">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>📊</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>SPC</h1>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#6366f125', color: '#a5b4fc', borderRadius: '20px', border: '1px solid #6366f145' }}>AIAG 2nd Edition</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#10b98115', color: '#6ee7b7', borderRadius: '20px', border: '1px solid #10b98140' }}>IATF 16949</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Statistical Process Control — Complete Knowledge Center</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
              {res && [
                { label: 'Cpk', val: res.Cpk },
                { label: 'Ppk', val: res.Ppk },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center', background: '#6366f120', border: '1px solid #6366f145', borderRadius: '10px', padding: '9px 14px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: val >= 1.33 ? '#6ee7b7' : val >= 1.0 ? '#fcd34d' : '#fca5a5' }}>{isNaN(val) ? '—' : val.toFixed(3)}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{label}</div>
                </div>
              ))}
              <div style={{ textAlign: 'center', background: '#6366f115', border: '1px solid #6366f140', borderRadius: '10px', padding: '9px 14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#a5b4fc' }}>7+</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Chart Types</div>
              </div>
              <button onClick={loadSample} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                🧪 Load Sample
              </button>
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: '1px', flexWrap: 'wrap' }}>
            {([
              { id: 'overview',  label: '📖 Overview' },
              { id: 'guide',     label: '📋 SPC Guide' },
              { id: 'generator', label: '⚡ Generator' },
              { id: 'analyser',  label: '🔍 Analyser' },
              { id: 'qa',        label: '💬 Interview Q&A' },
              { id: 'templates', label: '📁 Templates' },
              { id: 'docs',      label: '📚 Supporting Docs' },
              { id: 'posters',   label: '🖼 Posters & Banners' },
              { id: 'dashboard',  label: '📊 Dashboard' },
              { id: 'deepdive',   label: '🧩 Chart Deep Dive' },
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

      {/* -- OVERVIEW TAB --------------------------------------------------- */}
      {mainTab === 'overview' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/AIAG_SPC_Second_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>AIAG SPC 2nd Ed.</a>
            <a href="/downloads/spc/SPC_Control_Chart_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Control Chart XLS</a>
            <a href="/downloads/spc/SPC_vs_Specification_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>SPC vs Spec Guide</a>
            <a href="/downloads/spc/SPC_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <div className="max-w-screen-xl mx-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 bg-white border border-cyan-900/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">📈 What is SPC?</h2>
                <p className="text-[#1e3a5f] text-sm leading-relaxed mb-3">
                  <strong className="text-white">Statistical Process Control (SPC)</strong> is a method of using statistical tools — primarily control charts — to monitor and control a manufacturing process. By analyzing process data in real time, SPC distinguishes between <strong className="text-cyan-300">common cause variation</strong> (normal) and <strong className="text-red-700">special cause variation</strong> (abnormal, requiring action).
                </p>
                <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                  SPC is one of the AIAG Five Core Tools and is mandatory for special characteristics under <strong className="text-cyan-300">IATF 16949</strong>. Process capability indices (Cp, Cpk, Pp, Ppk) are the primary outputs used in PPAP submissions (Ppk ≥ 1.67 required for CC characteristics).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label:'Standard', value:'AIAG SPC 2nd Edition' },
                    { label:'IATF Clause', value:'9.1.1, 8.5.1.1' },
                    { label:'PPAP Use', value:'Ppk ≥ 1.67 (CC) / 1.33 (SC)' },
                    { label:'Chart Types', value:'7+ (Xbar-R, IMR, p, np…)' },
                    { label:'Links To', value:'Control Plan + MSA' },
                    { label:'Key Output', value:'Cp, Cpk, Pp, Ppk' },
                  ].map(i => (
                    <div key={i.label} className="bg-white rounded-xl px-3 py-2">
                      <div className="text-xs text-[#1e3a5f] uppercase">{i.label}</div>
                      <div className="text-xs font-semibold text-white mt-1">{i.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { icon:'📊', stat:'7+', label:'SPC Chart Types', color:'text-cyan-600 bg-cyan-900/30 border-cyan-800/40' },
                  { icon:'📈', stat:'1.67', label:'Min Ppk for CC (PPAP)', color:'text-green-600 bg-green-900/30 border-green-700/50' },
                  { icon:'🔴', stat:'OOC', label:'Out-of-Control Signal = Stop', color:'text-red-600 bg-red-50 border-red-800/40' },
                  { icon:'📉', stat:'8', label:'Western Electric Rules', color:'text-purple-600 bg-purple-900/30 border-purple-700/50' },
                ].map(s => (
                  <div key={s.label} className={`border rounded-2xl p-3 flex items-center gap-3 ${s.color}`}>
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className="font-bold text-sm">{s.stat}</div>
                      <div className="text-xs opacity-80">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">💡 Why SPC Matters</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon:'🔍', title:'Detect Before Detect', desc:'OOC signals appear before defects are made — stops the process before scrap or customer rejects' },
                  { icon:'📊', title:'Capability Proof', desc:'Cpk/Ppk demonstrate that the process can consistently hold the tolerance — mandatory for PPAP' },
                  { icon:'📋', title:'IATF Mandatory', desc:'Cl. 9.1.1 requires statistical monitoring for special characteristics — audited with objective evidence' },
                  { icon:'💰', title:'Cost Reduction', desc:'Prevents overadjustment (tampering) — operators react only to statistical signals, not random noise' },
                  { icon:'📈', title:'Continuous Improvement', desc:'Capability trending shows where improvement efforts have the most impact on quality' },
                  { icon:'🔗', title:'MSA Prerequisite', desc:'GRR must be acceptable before SPC is meaningful — bad gauge = invalid control chart' },
                ].map(b => (
                  <div key={b.title} className="bg-white rounded-xl p-3">
                    <div className="text-xl mb-1">{b.icon}</div>
                    <div className="text-white font-semibold text-xs mb-1">{b.title}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-3">📌 Capability Index Quick Reference</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name:'Cp', formula:'(USL-LSL) / 6σ', desc:'Potential capability — ignores mean shift. Short-term.', color:'text-cyan-600' },
                  { name:'Cpk', formula:'min(CPU, CPL)', desc:'Actual capability — accounts for mean offset. Short-term.', color:'text-green-600' },
                  { name:'Pp', formula:'(USL-LSL) / 6s', desc:'Performance — uses overall std dev. Long-term.', color:'text-purple-600' },
                  { name:'Ppk', formula:'min(PPU, PPL)', desc:'Actual performance with mean offset. Long-term. PPAP uses Ppk.', color:'text-amber-600' },
                ].map(i => (
                  <div key={i.name} className="bg-white rounded-xl p-3">
                    <div className={`text-lg font-bold mb-1 ${i.color}`}>{i.name}</div>
                    <div className="text-xs text-[#1e3a5f] font-mono mb-1">{i.formula}</div>
                    <p className="text-xs text-[#1e3a5f] leading-relaxed">{i.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- GENERATOR TAB -------------------------------------------------- */}
      {mainTab === 'generator' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/SPC_Control_Chart_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Control Chart XLS</a>
            <a href="/downloads/spc/SPC_Capability_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Capability Tracker XLS</a>
            <a href="/downloads/spc/SPC_Study_Planner.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Study Planner XLS</a>
          </div>
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white border border-cyan-900/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <div className="text-base font-bold text-white">SPC Study Plan Generator</div>
                    <div className="text-[#1e3a5f] text-xs mt-0.5">Enter characteristic details → get chart type, subgroup plan, capability targets and control limit guidance</div>
                  </div>
                </div>
                {[
                  { label:'Characteristic Name', key:'charName', placeholder:'e.g. Diameter Ø25.00 ±0.05', type:'text' },
                  { label:'Part Name', key:'partName', placeholder:'e.g. Mounting Bracket', type:'text' },
                  { label:'Upper Spec Limit (USL)', key:'usl', placeholder:'e.g. 25.05', type:'number' },
                  { label:'Lower Spec Limit (LSL)', key:'lsl', placeholder:'e.g. 24.95', type:'number' },
                ].map(f => (
                  <div key={f.key} className="mb-4">
                    <label className="text-xs text-[#1e3a5f] block mb-1.5">{f.label}</label>
                    <input type={f.type} value={sgen[f.key as keyof typeof sgen]}
                      onChange={e => setSgen(g => ({ ...g, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none" />
                  </div>
                ))}
                <div className="mb-4">
                  <label className="text-xs text-[#1e3a5f] block mb-1.5">Data Type</label>
                  <select value={sgen.dataType} onChange={e => setSgen(g => ({ ...g, dataType: e.target.value }))}
                    className="w-full bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none">
                    <option>Variable</option><option>Attribute (pass/fail)</option>
                  </select>
                </div>
                <div className="mb-5">
                  <label className="text-xs text-[#1e3a5f] block mb-1.5">Subgroup Size (n)</label>
                  <select value={sgen.subgroupSize} onChange={e => setSgen(g => ({ ...g, subgroupSize: e.target.value }))}
                    className="w-full bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none">
                    {['1','2','3','4','5','6','8','10'].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={() => { if (sgen.charName && sgen.usl && sgen.lsl) setSgenResult(true); }}
                  className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm rounded-xl transition-colors">
                  ⚡ Generate SPC Study Plan
                </button>
              </div>

              {/* Output */}
              {!sgenResult ? (
                <div className="bg-white border-2 border-dashed border-[#dbeafe] rounded-2xl flex flex-col items-center justify-center gap-4 p-10 text-center">
                  <div className="text-5xl">📊</div>
                  <div className="text-[#1e3a5f] font-semibold">SPC Study Plan will appear here</div>
                  <div className="text-[#1e3a5f] text-xs max-w-xs leading-relaxed">Fill the form and click Generate to get chart type recommendation, subgroup plan, capability targets and control limit setup guide</div>
                </div>
              ) : (() => {
                const usl = parseFloat(sgen.usl), lsl = parseFloat(sgen.lsl);
                const tolerance = isNaN(usl) || isNaN(lsl) ? null : Math.abs(usl - lsl);
                const nominal = tolerance ? (usl + lsl) / 2 : null;
                const n = parseInt(sgen.subgroupSize);
                const chartType = sgen.dataType === 'Attribute' ? 'p-chart (defective %)' : n === 1 ? 'IMR (Individuals-Moving Range)' : n >= 2 && n <= 9 ? 'X̄-R (Average-Range)' : 'X̄-s (Average-Std Dev)';
                return (
                  <div className="bg-white border border-cyan-900/50 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-base font-bold text-white">{sgen.charName}</div>
                        <div className="text-[#1e3a5f] text-xs">{sgen.partName} · Subgroup n={sgen.subgroupSize} · {sgen.dataType}</div>
                      </div>
                      <button onClick={() => setSgenResult(false)} className="text-xs text-[#1e3a5f] border border-[#dbeafe] rounded-lg px-3 py-1">Reset</button>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-cyan-900/20 border border-cyan-800/40 rounded-xl p-3">
                        <div className="text-xs font-bold text-cyan-300 mb-1">📊 Recommended Chart</div>
                        <div className="text-white font-semibold text-sm">{chartType}</div>
                      </div>
                      {tolerance !== null && (
                        <div className="bg-white rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-center">
                          <div><div className="text-xs text-[#1e3a5f]">USL</div><div className="text-[#15803d] font-bold text-sm">{usl}</div></div>
                          <div><div className="text-xs text-[#1e3a5f]">Nominal</div><div className="text-white font-bold text-sm">{nominal?.toFixed(3)}</div></div>
                          <div><div className="text-xs text-[#1e3a5f]">LSL</div><div className="text-red-700 font-bold text-sm">{lsl}</div></div>
                        </div>
                      )}
                      <div className="bg-white rounded-xl p-3 space-y-2">
                        <div className="text-xs font-bold text-white mb-2">📋 Study Plan</div>
                        {[
                          { label:'Phase 1 — Baseline study', val:'Collect 25+ subgroups (min 100 pts). Do NOT use for control — calculate control limits only' },
                          { label:'Subgroup size', val:`n = ${sgen.subgroupSize} — ${n === 1 ? 'individual readings, use MR for range' : 'take ' + sgen.subgroupSize + ' consecutive pieces'}` },
                          { label:'Frequency', val:'Start: every hour. After stability: shift-based. For CC: per Control Plan' },
                          { label:'Target Ppk (PPAP)', val:'≥ 1.67 for CC characteristics · ≥ 1.33 for SC characteristics' },
                          { label:'Target Cpk (ongoing)', val:'≥ 1.33 ongoing. Cpk < 1.0 = 100% inspection required' },
                          { label:'MSA first', val:'Complete GRR study before SPC. %R&R must be ≤ 10%' },
                          { label:'Reaction plan', val:'OOC signal → Stop · Notify QE · Contain output → Find root cause → Update control limits' },
                        ].map(r => (
                          <div key={r.label} className="overflow-x-auto flex gap-2 border-b border-[#dbeafe] pb-1.5">
                            <span className="text-cyan-500 text-xs font-semibold w-36 flex-shrink-0">{r.label}</span>
                            <span className="text-[#1e3a5f] text-xs">{r.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* -- ANALYSER TAB (was Calculator) ---------------------------------- */}
      {mainTab === 'analyser' && (
        <div className="animate-fadeIn p-4 bg-white min-h-screen">
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/SPC_Control_Chart_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Control Chart XLS</a>
            <a href="/downloads/spc/SPC_Capability_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Capability Tracker XLS</a>
            <a href="/downloads/spc/SPC_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Audit Checklist XLS</a>
            <a href="/downloads/spc/SPC_vs_Specification_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>SPC vs Spec Guide</a>
          </div>
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Input */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-[#dbeafe] rounded-2xl p-4 space-y-3">
                  <h2 className="text-sm font-bold text-white">📊 Study Setup</h2>
                  <div>
                    <label className="text-xs text-[#1e3a5f] block mb-1">Characteristic Name</label>
                    <input className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={charName} onChange={e => setCharName(e.target.value)} placeholder="e.g. Shaft Diameter" />
                  </div>
                  <div>
                    <label className="text-xs text-[#1e3a5f] block mb-1">Unit of Measure</label>
                    <input className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={unit} onChange={e => setUnit(e.target.value)} placeholder="mm / N / °C / bar" />
                  </div>
                  <div>
                    <label className="text-xs text-[#1e3a5f] block mb-1">Subgroup Size (n)</label>
                    <select className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={subgroupSize} onChange={e => setSgSize(Number(e.target.value))}>
                      {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>n = {n}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#1e3a5f] block mb-1">USL</label>
                      <input type="number" step="any" className="w-full bg-white border border-orange-700/50 rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={usl} onChange={e => setUsl(e.target.value)} placeholder="25.05" />
                    </div>
                    <div>
                      <label className="text-xs text-[#1e3a5f] block mb-1">LSL</label>
                      <input type="number" step="any" className="w-full bg-white border border-orange-700/50 rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={lsl} onChange={e => setLsl(e.target.value)} placeholder="24.95" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#1e3a5f] block mb-1">
                      Measurement Data <span className="text-[#1e3a5f]">(comma / newline separated; each line = one subgroup)</span>
                    </label>
                    <textarea rows={12}
                      className="w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-xs text-[#1e3a5f] font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      value={rawData} onChange={e => setRawData(e.target.value)}
                      placeholder={"25.01, 25.03, 24.98, 25.00, 25.02\n25.02, 24.99, 25.01, 25.03, 24.97\n..."} />
                  </div>
                  {res && <div className="text-xs text-[#1e3a5f]">{res.data.length} readings · {res.k} subgroups of n={res.n}</div>}
                </div>
              </div>

              {/* Results */}
              <div className="lg:col-span-2 space-y-4">
                {!res ? (
                  <div className="bg-white border border-[#dbeafe] rounded-2xl p-10 text-center">
                    <div className="text-5xl mb-3">📈</div>
                    <p className="text-[#1e3a5f] text-sm mb-4">Enter measurement data to calculate X̄-R control charts and Cp / Cpk capability indices.</p>
                    <button onClick={loadSample} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm px-6 py-2 rounded-xl">Load Sample Data</button>
                  </div>
                ) : (
                  <>
                    {/* Stats Row */}
                    <div className="bg-white border border-[#dbeafe] rounded-2xl p-4">
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
                          <div key={s.label} className="bg-white rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-cyan-300">{s.val}</div>
                            <div className="text-xs text-[#1e3a5f] leading-tight">{s.label}</div>
                            <div className="text-xs text-[#1e3a5f]">{s.sub}</div>
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
                                <div className="text-xs text-[#1e3a5f]">{c.desc}</div>
                                <div className={`text-xs mt-1 font-semibold ${r.text}`}>{r.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                          Enter USL and LSL above to calculate Cp, Cpk, Pp, Ppk.
                        </div>
                      )}

                      <div className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${res.stable ? 'bg-green-900/30/20 border border-green-700/50 text-green-300' : 'bg-red-50 border border-red-800/40 text-red-700'}`}>
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
                    <div className="bg-white border border-[#dbeafe] rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-white mb-3">Control Limits &amp; SPC Constants (n={res.n})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {[
                          ['d₂', fmt(res.consts.d2, 3)], ['A₂', fmt(res.consts.A2, 3)],
                          ['D₄', fmt(res.consts.D4, 3)], ['D₃', fmt(res.consts.D3, 3)],
                          ['X̄ UCL', fmt(res.ucl_x, 5)], ['X̄ LCL', fmt(res.lcl_x, 5)],
                          ['R UCL', fmt(res.ucl_r, 5)],  ['R LCL', fmt(res.lcl_r, 5)],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="bg-white rounded-lg px-3 py-2">
                            <div className="text-[#1e3a5f]">{lbl}</div>
                            <div className="text-white font-semibold">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white border border-[#dbeafe] rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-white mb-3">Subgroup Data Table</h3>
                      <div className="overflow-x-auto max-h-56">
                        <table className="text-xs w-full border-collapse">
                          <thead className="bg-white sticky top-0">
                            <tr>
                              <th className="border border-[#dbeafe] px-2 py-1.5 text-left text-[#1e3a5f]">Sg</th>
                              {Array.from({ length: res.n }, (_, i) => (
                                <th key={i} className="border border-[#dbeafe] px-2 py-1.5 text-center text-[#1e3a5f]">x{i+1}</th>
                              ))}
                              <th className="border border-[#dbeafe] px-2 py-1.5 text-center text-cyan-300">X̄</th>
                              <th className="border border-[#dbeafe] px-2 py-1.5 text-center text-green-300">R</th>
                            </tr>
                          </thead>
                          <tbody>
                            {res.xbars.map((xb, i) => {
                              const sg = res.sgs[i];
                              const xv = xb > res.ucl_x || xb < res.lcl_x;
                              const rv = res.ranges[i] > res.ucl_r;
                              return (
                                <tr key={i} className={i % 2 === 0 ? 'bg-[#eff6ff]' : 'bg-white/10'}>
                                  <td className="border border-[#dbeafe] px-2 py-1 text-[#1e3a5f]">{i+1}</td>
                                  {sg.map((v, j) => (
                                    <td key={j} className="border border-[#dbeafe] px-2 py-1 text-center text-[#1e3a5f]">{v.toFixed(3)}</td>
                                  ))}
                                  <td className={`border border-[#dbeafe] px-2 py-1 text-center font-semibold ${xv ? 'text-red-600' : 'text-cyan-300'}`}>{xb.toFixed(4)}</td>
                                  <td className={`border border-[#dbeafe] px-2 py-1 text-center font-semibold ${rv ? 'text-red-600' : 'text-green-300'}`}>{res.ranges[i].toFixed(4)}</td>
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

      {/* -- KNOWLEDGE HUB TAB ----------------------------------------------- */}
          {/* -- SPC Completeness Score ---------------------------------- */}
          <div className="mt-5 bg-white rounded-xl border border-cyan-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 p-4 cursor-pointer" style={{background:'#0891b2'}}
              onClick={e=>{e.stopPropagation(); const el=document.getElementById('spc-score-body'); if(el) el.classList.toggle('hidden');}}>
              <span className="text-2xl">📋</span>
              <div>
                <div className="text-sm font-bold text-white">SPC Completeness Score</div>
                <div className="text-xs" style={{color:'rgba(255,255,255,0.75)'}}>14-point IATF readiness check — verify your SPC setup before PPAP and audit</div>
              </div>
            </div>
            <div id="spc-score-body" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {SPC_SCORE_ITEMS.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer"
                    style={{border: spcChecks[i] ? '1px solid #22d3ee' : '1px solid #e2e8f0', background: spcChecks[i] ? '#ecfeff' : '#f8fafc'}}>
                    <input type="checkbox" checked={!!spcChecks[i]}
                      onChange={e => setSpcChecks(p => ({...p, [i]: e.target.checked}))}
                      style={{marginTop:'2px', width:'14px', height:'14px', flexShrink:0, accentColor:'#0891b2'}} />
                    <span className="text-xs leading-relaxed" style={{color: spcChecks[i] ? '#0e7490' : '#374151', textDecoration: spcChecks[i] ? 'line-through' : 'none', fontWeight: spcChecks[i] ? 600 : 400}}>{item}</span>
                  </label>
                ))}
              </div>
              {(() => {
                const done = Object.values(spcChecks).filter(Boolean).length;
                const total = SPC_SCORE_ITEMS.length;
                const pct = Math.round((done/total)*100);
                const ok = done === total;
                const col = ok ? '#0891b2' : pct >= 70 ? '#d97706' : '#dc2626';
                return (
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1" style={{color: col}}>
                      <span>SPC Readiness Score</span>
                      <span>{done}/{total} ({pct}%)</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden mb-3" style={{background:'#e2e8f0'}}>
                      <div className="h-3 rounded-full transition-all duration-500" style={{width:`${pct}%`, background: col}} />
                    </div>
                    {ok ? (
                      <div className="text-center p-4 rounded-xl" style={{background:'#ecfeff', border:'2px solid #22d3ee'}}>
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-sm font-bold" style={{color:'#0891b2'}}>SPC AUDIT READY</div>
                        <div className="text-xs mt-1" style={{color:'#0e7490'}}>All 14 criteria met. SPC system ready for IATF audit and PPAP Element 9 submission.</div>
                      </div>
                    ) : (
                      <div className="text-xs p-3 rounded-xl" style={{background:'#fff5f5', border:'1px solid #fecaca', color:'#991b1b'}}>
                        ⚠️ {total - done} criteria not met. Address all gaps before IATF audit.
                        {pct < 50 && ' CRITICAL: Major SPC gaps — CC characteristics may not be in statistical control.'}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* -- Cpk Quick Calculator ------------------------------------ */}
          <div className="mt-4 rounded-xl overflow-hidden shadow-sm" style={{border:'2px solid #0891b244'}}>
            <div className="flex items-center justify-between p-4 cursor-pointer flex-wrap gap-y-2" style={{background:'#0e7490'}}
              onClick={()=>setShowCpkCalc(s=>!s)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📐</span>
                <div>
                  <div className="text-sm font-bold text-white">Cpk / Ppk Quick Calculator</div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.75)'}}>Enter mean, sigma, USL, LSL — instant Cp, Cpk, Pp, Ppk with PPAP verdict</div>
                </div>
              </div>
              <span className="text-white text-lg">{showCpkCalc ? '▲' : '▼'}</span>
            </div>
            {showCpkCalc && (
              <div className="p-5" style={{background:'#f8fafc'}}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {[
                    {label:'Characteristic Name', key:'char', ph:'e.g. Shaft OD'},
                    {label:'USL (Upper Spec Limit)', key:'uslStr', ph:'e.g. 25.020'},
                    {label:'LSL (Lower Spec Limit)', key:'lslStr', ph:'e.g. 24.980'},
                    {label:'Process Mean (X-bar)', key:'meanStr', ph:'e.g. 25.002'},
                    {label:'Sigma Short (R-bar/d2)', key:'sdStr', ph:'e.g. 0.003 for Cpk'},
                    {label:'Sigma Long (STDEV all)', key:'', ph:'Same as above for Ppk = Cpk'},
                  ].filter(f=>f.key).map(f=>(
                    <div key={f.key}>
                      <label className="text-xs font-bold text-[#1e3a5f] block mb-1">{f.label}</label>
                      <input value={(cpkInfo as any)[f.key]} onChange={e=>setCpkInfo(g=>({...g,[f.key]:e.target.value}))}
                        placeholder={f.ph}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#dbeafe] outline-none"
                        style={{boxSizing:'border-box'}} />
                    </div>
                  ))}
                </div>
                {(() => {
                  const usl = parseFloat(cpkInfo.uslStr);
                  const lsl = parseFloat(cpkInfo.lslStr);
                  const mean = parseFloat(cpkInfo.meanStr);
                  const sd = parseFloat(cpkInfo.sdStr);
                  if ([usl,lsl,mean,sd].some(isNaN) || sd <= 0) return (
                    <div className="text-xs text-[#1e3a5f] text-center p-4">Enter USL, LSL, Mean, and Sigma to calculate capability indices.</div>
                  );
                  const tol = usl - lsl;
                  const cp = tol / (6 * sd);
                  const cpu = (usl - mean) / (3 * sd);
                  const cpl = (mean - lsl) / (3 * sd);
                  const cpk = Math.min(cpu, cpl);
                  const pp = cp; // same when sd_long = sd_short in this simplified calc
                  const ppk = cpk;
                  const sigma_level = cpk * 3;
                  const ppm = cpk >= 2 ? 0.001 : cpk >= 1.67 ? 0.5 : cpk >= 1.33 ? 64 : cpk >= 1.0 ? 2700 : 66807;
                  const verdict = cpk >= 1.67 ? 'EXCELLENT' : cpk >= 1.33 ? 'ACCEPTABLE' : cpk >= 1.0 ? 'WARNING' : 'CRITICAL';
                  const vColor = cpk >= 1.67 ? '#0891b2' : cpk >= 1.33 ? '#d97706' : '#dc2626';
                  const ppapStatus = ppk >= 1.67 ? '✅ PPAP APPROVED' : ppk >= 1.33 ? '⚠️ PPAP CONDITIONAL (plan required)' : '❌ PPAP REJECTED';
                  const ppapColor = ppk >= 1.67 ? '#0891b2' : ppk >= 1.33 ? '#d97706' : '#dc2626';
                  return (
                    <div className="rounded-xl overflow-hidden border-2" style={{borderColor: vColor}}>
                      <div className="p-3 text-center font-bold text-white text-sm" style={{background: vColor}}>
                        {cpkInfo.char || 'CHARACTERISTIC'} — CAPABILITY RESULT: {verdict}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4" style={{background:'#fff'}}>
                        {[
                          {label:'Cp', value: cp.toFixed(3), note:'Spread only'},
                          {label:'Cpk', value: cpk.toFixed(3), note:'Centering + spread', highlight: cpk < 1.67},
                          {label:'Pp', value: pp.toFixed(3), note:'Initial study'},
                          {label:'Ppk', value: ppk.toFixed(3), note:'PPAP index', highlight: ppk < 1.67},
                          {label:'Sigma Level', value: sigma_level.toFixed(2), note:'Process sigma'},
                          {label:'Tolerance', value: tol.toFixed(4), note:'USL - LSL'},
                          {label:'% Mean vs Center', value: `${Math.abs((mean-(usl+lsl)/2)/((usl-lsl)/2)*100).toFixed(1)}%`, note:'0% = perfectly centered'},
                          {label:'Defects (PPM est.)', value: ppm < 1 ? '< 1' : ppm.toLocaleString(), note:'Approximate DPM'},
                        ].map(r=>(
                          <div key={r.label} className="p-2 rounded-lg text-center" style={{background:'#f1f5f9'}}>
                            <div className="text-xs text-[#1e3a5f] mb-0.5">{r.label}</div>
                            <div className="text-base font-extrabold" style={{color: r.highlight ? '#dc2626' : '#1e293b'}}>{r.value}</div>
                            <div className="text-xs text-[#1e3a5f]">{r.note}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t" style={{background:`${ppapColor}08`, borderColor:`${ppapColor}33`}}>
                        <div className="text-xs font-extrabold mb-1" style={{color: ppapColor}}>{ppapStatus}</div>
                        <div className="text-xs text-[#1e3a5f]">
                          {ppk >= 1.67
                            ? `Process is ${sigma_level.toFixed(1)}-sigma capable. Suitable for CC characteristics. Include in PPAP Element 9.`
                            : ppk >= 1.33
                            ? `Ppk ${ppk.toFixed(3)} is acceptable for SC but needs improvement for CC. Submit corrective action plan with PPAP.`
                            : `Ppk ${ppk.toFixed(3)} is below 1.33. PPAP submission will be rejected. Process redesign required before resubmission.`}
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
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/SPC_vs_Specification_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>SPC vs Spec Guide</a>
            <a href="/downloads/spc/SPC_Nelson_Rules_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Nelson Rules Guide</a>
            <a href="/downloads/spc/SPC_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-white border border-cyan-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">📈 What is SPC?</h2>
              <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">Statistical Process Control uses statistical methods to monitor and control manufacturing processes — detecting special-cause variation before it produces defects. Pioneered by Walter Shewhart (Bell Labs, 1920s), popularized by W. Edwards Deming in post-war Japan. The goal: prevent defects through process monitoring, not detect them through inspection.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl p-4">
                  <div className="text-[#1d4ed8] font-semibold text-sm mb-2">🎯 Common Cause Variation</div>
                  <p className="text-[#1e3a5f] text-xs">Inherent, random variation in every process. Predictable, stable. Process is "in control." Reducing this requires system-level changes — management responsibility (not operator).</p>
                </div>
                <div className="bg-red-50 border border-red-800/30 rounded-xl p-4">
                  <div className="text-red-700 font-semibold text-sm mb-2">⚡ Special Cause Variation</div>
                  <p className="text-[#1e3a5f] text-xs">Unexpected, assignable causes: tool wear, material change, operator change, machine fault. Shows as out-of-control signals on charts. Operator/engineer must find and eliminate.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">🎯 Capability Indices — Cp, Cpk, Pp, Ppk</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {[
                  { idx: 'Cp',  formula: '(USL − LSL) / (6σ̂w)', desc: 'Potential capability — assumes centered process. Uses within-subgroup sigma (R̄/d₂). Measures if process width fits within tolerance.' },
                  { idx: 'Cpk', formula: 'min[(USL−X̄)/(3σ̂w), (X̄−LSL)/(3σ̂w)]', desc: 'Actual short-term capability — accounts for centering. Always ≤ Cp. If Cp >> Cpk, process is off-center.' },
                  { idx: 'Pp',  formula: '(USL − LSL) / (6σo)', desc: 'Performance potential — uses overall (long-term) sigma from all individual values. Used for PPAP initial capability.' },
                  { idx: 'Ppk', formula: 'min[(USL−X̄)/(3σo), (X̄−LSL)/(3σo)]', desc: 'Actual long-term performance including centering. Used for initial capability reports. Convert to Cpk after sustained production.' },
                ].map(c => (
                  <div key={c.idx} className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-cyan-300">{c.idx}</span>
                      <code className="text-xs text-[#1e3a5f] bg-gray-700 rounded px-2 py-0.5">{c.formula}</code>
                    </div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white">
                      {['Cpk / Ppk', 'Rating', 'Action Required', 'PPAP Requirement'].map(h => (
                        <th key={h} className="border border-[#dbeafe] px-3 py-2 text-left text-[#1e3a5f]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['≥ 1.67', 'World Class', 'None — consider reducing sampling frequency', 'Exceeds requirement; customer may allow reduced sampling', 'text-emerald-700'],
                      ['1.33 – 1.67', 'Capable', 'Continue monitoring; document in Control Plan', 'Meets PPAP Level 1 requirement (CC/SC need ≥ 1.33)', 'text-green-300'],
                      ['1.00 – 1.33', 'Marginal', 'Increase monitoring; investigate centering; improvement plan', 'Conditional acceptance — improvement plan required', 'text-yellow-300'],
                      ['< 1.00', 'Not Capable', 'STOP — 100% inspect until improved. Issue CAPA. Do not ship without containment.', 'PPAP rejected. Customer deviation required.', 'text-red-600'],
                    ].map(([range, rating, action, ppap, col], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-[#eff6ff]' : 'bg-white/10'}>
                        <td className={`border border-[#dbeafe] px-3 py-2 font-bold ${col}`}>{range}</td>
                        <td className={`border border-[#dbeafe] px-3 py-2 font-semibold ${col}`}>{rating}</td>
                        <td className="border border-[#dbeafe] px-3 py-2 text-[#1e3a5f]">{action}</td>
                        <td className="border border-[#dbeafe] px-3 py-2 text-[#1e3a5f]">{ppap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-blue-700/50/50 rounded-2xl p-6">
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
                  <div key={c.title} className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cyan-300 font-bold text-sm">{c.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${c.type === 'Variables' ? 'bg-[#eff6ff]/60 text-[#1d4ed8]' : 'bg-purple-800/60 text-purple-300'}`}>{c.type}</span>
                    </div>
                    <p className="text-[#1e3a5f] text-xs mb-1">{c.use}</p>
                    <p className="text-[#1e3a5f] text-xs"><strong className="text-[#1e3a5f]">Use for:</strong> {c.when}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-red-900/50 rounded-2xl p-6">
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
                    <div className="flex-shrink-0 w-14 text-red-600 font-bold text-xs pt-0.5">{rule}</div>
                    <div className="flex-1">
                      <div className="text-white text-xs font-semibold">{signal} <span className="text-[#1e3a5f] font-normal">(P≈{prob})</span></div>
                      <div className="text-[#1e3a5f] text-xs mt-0.5">{action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- Q&A TAB --------------------------------------------------------- */}
      {mainTab === 'qa' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/SPC_Nelson_Rules_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Nelson Rules Guide</a>
            <a href="/downloads/spc/SPC_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/spc/SPC_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>IATF Clause Map</a>
          </div>
          <div className="max-w-4xl mx-auto space-y-5">

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Run an SPC Capability Study</h2>
              <p className="text-[#1e3a5f] text-sm mt-1">Aligned with AIAG SPC 2nd Edition and IATF 16949 Cl. 8.5.1</p>
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
              <div key={s.step} className="bg-white border border-[#dbeafe] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
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
                  'Show me the control chart for this CC characteristic. What are the current UCL and LCL?',
                  'This chart shows a point beyond UCL 3 weeks ago. What was the corrective action and when was it completed?',
                  'What is the current Cpk for this characteristic? Is it documented in your Control Plan?',
                  'How was the sample size and frequency determined? Is it statistically justified?',
                  'Do you have a GRR study for this gauge? What was the %R&R result?',
                  'When process goes out of control, who is responsible and what is the maximum response time?',
                  'Has the capability index been recalculated after the last machine maintenance?',
                  'Your Control Plan specifies SPC — can I see the last 25 subgroups and confirm the chart is current?',
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

      {/* -- DOWNLOADS TAB --------------------------------------------------- */}
      {mainTab === 'templates' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/SPC_Control_Chart_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Control Chart XLS</a>
            <a href="/downloads/spc/SPC_Capability_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Capability Tracker XLS</a>
            <a href="/downloads/spc/SPC_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Audit Checklist XLS</a>
            <a href="/downloads/spc/SPC_Study_Planner.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Study Planner XLS</a>
          </div>
          <div className="max-w-screen-xl mx-auto">
            <p className="text-[#1e3a5f] text-sm mb-5">SPC worksheets, chart templates and capability study tools.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'X̄-R Control Chart Template', type: 'Excel', icon: '📈', desc: 'Auto-calculated X̄-R chart — enter data, get UCL/LCL, OOC signals highlighted automatically', file: '/downloads/spc/SPC_Xbar_R_Chart.xlsx' },
                { name: 'IMR (Individuals) Chart Template', type: 'Excel', icon: '📉', desc: 'Individual-Moving Range chart for single measurements — auto UCL/LCL, OOC detection, Cpk', file: '/downloads/spc/SPC_IMR_Chart.xlsx' },
                { name: 'Process Capability Study Sheet', type: 'Excel', icon: '📊', desc: 'Cp, Cpk, Pp, Ppk calculator with histogram — enter 30–300 data points, get full capability report', file: '/downloads/spc/SPC_Capability_Study.xlsx' },
                { name: 'SPC Implementation Checklist', type: 'Word', icon: '✅', desc: '20-point checklist — chart selection, subgroup size, frequency, reaction plan, control limits', file: '/downloads/spc/SPC_Implementation_Checklist.docx' },
              ].map(tpl => (
                <div key={tpl.name} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex gap-3 items-start" onDoubleClick={() => tpl.file.endsWith('.pdf') && window.open(tpl.file, '_blank')} title={tpl.file.endsWith('.pdf') ? 'Double-click to view' : ''} style={{ cursor: tpl.file.endsWith('.pdf') ? 'pointer' : 'default' }}>
                  <div className="text-2xl flex-shrink-0">{tpl.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm mb-1">{tpl.name}</div>
                    <div className="text-[#1e3a5f] text-xs mb-2 leading-relaxed">{tpl.desc}</div>
                    <a href={tpl.file} download className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition ${tpl.type === 'Excel' ? 'bg-green-700 hover:bg-green-600' : 'bg-blue-700 hover:bg-blue-600'}`}>⬇ {tpl.type}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'docs' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/AIAG_SPC_Second_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>AIAG SPC 2nd Ed.</a>
            <a href="/downloads/spc/SPC_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Case Studies PDF</a>
            <a href="/downloads/spc/SPC_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/spc/SPC_Competency_Matrix.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0d9488'}}>Competency Matrix</a>
          </div>
          <div className="max-w-screen-xl mx-auto space-y-4">
            <div className="bg-white border border-cyan-800/40 rounded-2xl p-5 flex items-center gap-5">
              <div className="w-14 h-14 bg-cyan-900/30 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📊</div>
              <div className="flex-1">
                <div className="font-bold text-white text-base mb-1">AIAG SPC Reference Manual (2nd Edition)</div>
                <div className="text-[#1e3a5f] text-xs mb-2">Complete AIAG SPC 2nd Edition — control charts, Western Electric rules, Cp Cpk Pp Ppk, rational subgrouping</div>
                <div className="flex gap-2"><span className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-0.5 rounded">PDF · 9 MB</span></div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href="/downloads/spc/AIAG_SPC_Second_Edition.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-bold">👁 View PDF</a>
                <a href="/downloads/spc/AIAG_SPC_Second_Edition.pdf" download className="flex items-center gap-2 px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-bold">⬇ Download</a>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { title:'Chart Selection Guide', icon:'📌', desc:'Decision tree — variable vs attribute data, subgroup size, short-run SPC, rare events', file:'/downloads/spc/SPC_Chart_Selection_Guide.pdf' },
                { title:'Western Electric Rules Quick Reference', icon:'⚠️', desc:'All 8 WE rules for detecting OOC signals with visual examples', file:'/downloads/spc/SPC_WE_Rules_Reference.pdf' },
                { title:'Cp vs Cpk vs Pp vs Ppk Explained', icon:'🔍', desc:'All 4 capability indices — when to use, how to interpret, PPAP requirements', file:'/downloads/spc/SPC_Capability_Indices_Guide.pdf' },
              ].map(doc => (
                <div key={doc.title} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex items-center gap-4" onDoubleClick={() => window.open(doc.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                  <div className="text-2xl flex-shrink-0">{doc.icon}</div>
                  <div className="flex-1"><div className="font-semibold text-white text-sm mb-1">{doc.title}</div><div className="text-[#1e3a5f] text-xs">{doc.desc}</div></div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={doc.file} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white text-[#1e3a5f] rounded-lg text-xs font-bold">View →</a>
                    <a href={doc.file} download className="px-3 py-2 bg-cyan-800 text-white rounded-lg text-xs font-bold">⬇ PDF</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'posters' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/spc/SPC_Posters_A3.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>All SPC Posters PDF</a>
            <a href="/downloads/spc/SPC_Nelson_Rules_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Nelson Rules Guide</a>
            <a href="/downloads/spc/SPC_vs_Specification_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>SPC vs Spec Guide</a>
          </div>
          <div className="max-w-screen-xl mx-auto">
            <p className="text-[#1e3a5f] text-sm mb-5">Print-ready SPC posters and reference charts for factory floor, quality lab, and operator workstations.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title:'SPC Chart Types Reference', size:'A1 Poster', desc:'Visual guide to all 7 SPC chart types — when to use X̄-R, IMR, p, np, c, u charts with examples', colors:['#0e7490','#0891b2'], file:'/downloads/spc/SPC_Chart_Types_Poster.pdf' },
                { title:'Western Electric Rules Poster', size:'A1 Poster', desc:'All 8 WE rules illustrated with control chart examples — which pattern = which action', colors:['#7c3aed','#6d28d9'], file:'/downloads/spc/SPC_WE_Rules_Poster.pdf' },
                { title:'Cp Cpk Pp Ppk Visual Guide', size:'A2 Poster', desc:'What each index means visually — process in/out of spec with histogram and distribution overlay', colors:['#065f46','#047857'], file:'/downloads/spc/SPC_Capability_Visual_Poster.pdf' },
                { title:'OOC Signal Response Flow', size:'A2 Banner', desc:'Step-by-step: Out-of-control detected → Stop → Contain → Notify → Root Cause → Update chart', colors:['#991b1b','#b91c1c'], file:'/downloads/spc/SPC_OOC_Response_Banner.pdf' },
                { title:'Cpk Acceptance Levels Banner', size:'A2 Banner', desc:'Visual: Cpk < 1.0 = 100% sort · 1.0–1.33 = conditional · ≥ 1.33 = acceptable · ≥ 1.67 = CC target', colors:['#92400e','#b45309'], file:'/downloads/spc/SPC_Cpk_Levels_Banner.pdf' },
                { title:'Control Chart Setup Checklist', size:'A3 Poster', desc:'Step-by-step poster for setting up a new SPC chart — MSA first, baseline study, control limits, reactions', colors:['#1e3a5f','#1e40af'], file:'/downloads/spc/SPC_Setup_Checklist_Poster.pdf' },
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
                      <a href={p.file} download className="flex-1 text-center text-xs font-bold py-2 bg-cyan-800 text-white rounded-lg">⬇ Download</a>
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
            <a href="/downloads/spc/SPC_Capability_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Capability Tracker XLS</a>
            <a href="/downloads/spc/SPC_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Audit Checklist XLS</a>
            <a href="/downloads/spc/SPC_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>NC Findings PDF</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#0891b2'}}>📊 SPC Dashboard</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Process capability status, SPC coverage, chart health, and open action tracking</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              {label:'Characteristics on SPC', value:'18', icon:'📈', color:'#0891b2', sub:'12 CC, 6 SC'},
              {label:'Cpk >= 1.67 (CC target)', value:'14', icon:'✅', color:'#0d9488', sub:'78% meeting target'},
              {label:'Cpk < 1.33 (Action zone)', value:'2', icon:'⚠️', color:'#d97706', sub:'Improvement plans active'},
              {label:'Out-of-Control Events (MTD)', value:'3', icon:'🔴', color:'#dc2626', sub:'All responded to'},
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
          <div className="bg-white border rounded-xl p-5 mb-4 shadow-sm" style={{borderColor:'#e2e8f0'}}>
            <div className="text-sm font-bold mb-4" style={{color:'#0891b2'}}>Capability Status by Process Area</div>
            {[
              {area:'Welding — Weld Width (CC)', cpk:1.82, target:1.67, status:'✅ Excellent'},
              {area:'CNC — Bore Diameter (CC)', cpk:1.73, target:1.67, status:'✅ Good'},
              {area:'Heat Treatment — Hardness (CC)', cpk:1.41, target:1.67, status:'⚠️ Below Target'},
              {area:'Assembly — Press Force (SC)', cpk:1.55, target:1.33, status:'✅ Acceptable'},
              {area:'Grinding — Surface Finish (SC)', cpk:1.28, target:1.33, status:'⚠️ Action Required'},
              {area:'Plating — Thickness (CC)', cpk:1.69, target:1.67, status:'✅ Good'},
            ].map(r=>(
              <div key={r.area} className="flex items-center gap-4 mb-3">
                <div className="text-xs font-semibold w-52 text-[#1e3a5f] flex-shrink-0">{r.area}</div>
                <div className="flex-1 bg-white rounded-full h-5 overflow-hidden">
                  <div className="h-5 rounded-full flex items-center justify-end pr-2" style={{width:`${Math.min(r.cpk/2.5*100,100)}%`, background: r.cpk>=1.67?'#0891b2':r.cpk>=1.33?'#d97706':'#dc2626', transition:'width 0.5s'}}>
                    <span className="text-white text-xs font-bold">{r.cpk.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-xs font-semibold flex-shrink-0 w-36" style={{color: r.cpk>=1.67?'#0891b2':r.cpk>=1.33?'#d97706':'#dc2626'}}>{r.status}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm" style={{borderColor:'#fecaca'}}>
            <div className="text-sm font-bold mb-4 text-red-700">⚠️ SPC Action Items</div>
            {[
              {item:'HT Hardness Cpk 1.41 — declining trend (was 1.68 at PPAP)', risk:'HIGH', action:'Review furnace uniformity, reduce thermocouple variation', owner:'Mfg Eng', due:'2025-08-15'},
              {item:'Surface Finish Cpk 1.28 — below SC minimum 1.33', risk:'HIGH', action:'100% inspection active — identify root cause of wheel wear', owner:'QA Eng', due:'2025-08-10'},
              {item:'X-bar chart LN-205 — Rule 3 signal ignored last shift', risk:'MED', action:'Operator retraining on Nelson rules and reaction plan', owner:'QA Manager', due:'2025-08-05'},
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
            <a href="/downloads/spc/AIAG_SPC_Second_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>AIAG SPC 2nd Ed.</a>
            <a href="/downloads/spc/SPC_Nelson_Rules_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Nelson Rules Guide</a>
            <a href="/downloads/spc/SPC_vs_Specification_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>SPC vs Spec Guide</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#0891b2'}}>🧩 All 6 SPC Chart Types — Deep Dive</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Every chart type with use case, method, limits, and IATF clause — AIAG SPC 2nd Edition</div>
          <div className="flex flex-col gap-3">
            {SPC_CHART_TYPES.map(ct => (
              <div key={ct.no} className="rounded-xl overflow-hidden shadow-sm" style={{border:'1px solid #cffafe'}}>
                <div className="flex items-center gap-4 p-4" style={{background: ct.color}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0" style={{background:'rgba(255,255,255,0.2)'}}>
                    {ct.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{ct.name}</div>
                    <div className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>{ct.iatf}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={{background:'#f8fafc'}}>
                  {[
                    {label:'Best Used For', value: ct.use},
                    {label:'When to Use', value: ct.when},
                    {label:'Subgroup Size', value: ct.subgroup},
                    {label:'Control Limit Formula', value: ct.limits},
                  ].map((f,i)=>(
                    <div key={i} className="p-3 border-r border-cyan-50 last:border-0">
                      <div className="text-xs font-bold mb-1" style={{color: ct.color}}>{f.label}</div>
                      <div className="text-xs text-[#1e3a5f] leading-relaxed font-mono">{f.value}</div>
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
            <a href="/downloads/spc/SPC_Control_Chart_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Control Chart XLS</a>
            <a href="/downloads/spc/SPC_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
            <a href="/downloads/spc/SPC_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Audit Checklist XLS</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#0891b2'}}>🔄 SPC Implementation Workflow</div>
          <div className="text-xs text-[#1e3a5f] mb-5">End-to-end: from APQP Phase 3 planning to PPAP Element 9 submission and ongoing control</div>
          <div className="flex flex-col gap-0">
            {[
              {n:1, action:'Define SPC plan in APQP Phase 3 — identify CC/SC characteristics needing SPC', who:'Quality Engineer', tool:'Control Plan, PFMEA AP summary', timing:'APQP Phase 3', color:'#0891b2'},
              {n:2, action:'Select chart type: X-bar & R for variable, p-chart for attribute', who:'Quality Engineer', tool:'AIAG SPC 2nd Edition', timing:'APQP Phase 3', color:'#0891b2'},
              {n:3, action:'Define subgroup size, frequency, and measurement gauge', who:'QA + Manufacturing Eng', tool:'Control Plan columns 9-12', timing:'APQP Phase 4', color:'#0e7490'},
              {n:4, action:'Confirm GRR < 30% for gauge before collecting any SPC data', who:'Metrology / QA Eng', tool:'GRR study report, MSA plan', timing:'Before SOP trial', color:'#0e7490'},
              {n:5, action:'Train all operators on chart plotting and 4 key Nelson rules', who:'Training / QA Manager', tool:'Nelson Rules poster, training record', timing:'Week before SOP', color:'#d97706'},
              {n:6, action:'Collect 25 subgroups (trial production run) — all consecutive', who:'Operator + QA Engineer', tool:'SPC Control Chart Template', timing:'Trial run (30 pcs min)', color:'#d97706'},
              {n:7, action:'Check: are any subgroups out of control? If yes: investigate before setting limits', who:'Quality Engineer', tool:'Nelson rules check', timing:'After 25 subgroups', color:'#dc2626'},
              {n:8, action:'Calculate control limits: X-bar-bar, R-bar, UCL_X, LCL_X, UCL_R', who:'Quality Engineer', tool:'SPC constants table (A2, D3, D4)', timing:'After stable trial run', color:'#dc2626'},
              {n:9, action:'Calculate PPAP capability: Ppk >= 1.67 for CC, >= 1.33 for SC', who:'Quality Engineer', tool:'Cpk/Ppk calculator', timing:'After 30+ consecutive pcs', color:'#7c3aed'},
              {n:10, action:'Post control chart at workstation with reaction plan and Nelson rules', who:'QA Manager', tool:'Control chart, reaction plan format', timing:'Before SOP', color:'#7c3aed'},
              {n:11, action:'Include Ppk study in PPAP Element 9 package', who:'Quality Manager', tool:'PPAP 4th Edition Element 9', timing:'PPAP submission', color:'#1e40af'},
              {n:12, action:'Ongoing: plot every subgroup, respond to all out-of-control signals', who:'Operator (every shift)', tool:'Control chart, out-of-control log', timing:'Continuous', color:'#0891b2'},
              {n:13, action:'Monthly: calculate ongoing Cpk, review trend, update Management Review', who:'Quality Manager', tool:'Capability Tracker, Mgmt Review input', timing:'Monthly', color:'#0891b2'},
              {n:14, action:'After 4M change: stop chart, recalculate limits from new data', who:'Quality Engineer', tool:'4M change log, SPC re-study', timing:'Triggered by change', color:'#1e293b'},
            ].map((s,i)=>(
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
            <a href="/downloads/spc/SPC_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Case Studies PDF</a>
            <a href="/downloads/spc/SPC_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/spc/SPC_Nelson_Rules_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Nelson Rules Guide</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#0891b2'}}>📂 SPC Case Studies</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Real-world SPC failures, audit NCs, and process capability wins</div>
          <div className="flex flex-col gap-5">
            {[
              {id:'CS-SPC01', part:'CNC Bore — Cpk 1.82 PPAP → 1.18 Audit', customer:'Tata Motors', status:'IATF MAJOR NC', color:'#dc2626', tag:'No Ongoing Cpk Monitoring',
                problem:'IATF audit 8 months after SOP: auditor calculated Cpk from recent chart data = 1.18. PPAP showed Ppk 1.84. Major NC: "ongoing Cpk not maintained at 1.67."',
                cause:'Tool wore down. Control chart showed 3 Rule 3 violations (trending down) before audit. Operators saw signals but did not log reactions. Cpk review not in Management Review.',
                lesson:'Cpk is not a one-time PPAP snapshot. Nelson rule violations must trigger actions — logged, investigated, corrected. Monthly Cpk review is mandatory.',
                best:'Tool change frequency cut 500→300 pcs. Monthly Cpk review in Mgmt Review. Operator reaction plan retraining. Cpk trend chart posted at workstation.'},
              {id:'CS-SPC02', part:'Weld Tensile — Control Limits = Spec Limits', customer:'Maruti Suzuki', status:'IATF MAJOR NC', color:'#7c3aed', tag:'#1 SPC Mistake',
                problem:'Auditor found X-bar chart: UCL=550 MPa = USL, LCL=450 MPa = LSL. All points perfectly in limits for 6 months. Chart useless — will never signal until scrap is made.',
                cause:'Quality engineer set control limits from the drawing spec. Did not understand that control limits must come from process sigma, not from customer tolerance.',
                lesson:'Control limits ALWAYS from process data. Spec limits are dashed reference lines. UCL = X-bar-bar + 3-sigma. Setting UCL=USL destroys the chart.',
                best:'Recalculated limits from 25 subgroups: UCL=512, LCL=488 MPa (much tighter). Retraining for all QA engineers. NCR: "SPC fundamentals training not verified before implementation."'},
              {id:'CS-SPC03', part:'Press Force — Rule 4 Tampering', customer:'Internal', status:'TAMPERING IDENTIFIED', color:'#d97706', tag:'Operator Over-adjustment',
                problem:'SPC chart showed classic Rule 4 (14 alternating up-down points) for 3 weeks. Cpk 1.45 — seemed okay but variation was artificially inflated by over-adjustment.',
                cause:'Operator was adjusting press pressure setting after every single reading — even when the chart showed the process was in control. Tampering increased total variation.',
                lesson:'Rule 4 is the fingerprint of tampering. A stable process should NOT be adjusted. Adjusting a process in control makes it WORSE. Funnel experiment demonstrates this.',
                best:'Retraining: "Only adjust if chart signals out-of-control." Press pressure locked — requires QA approval. Cpk improved 1.45→1.78 after tampering stopped.'},
              {id:'CS-SPC04', part:'Hardness HRC — Proactive Cpk Trend', customer:'Ashok Leyland', status:'PROACTIVE SUCCESS', color:'#0891b2', tag:'Early Action Prevented Escape',
                problem:'Quarterly Cpk review showed hardness Cpk trending: PPAP 1.68 → 3 months 1.61 → 6 months 1.52. Still above 1.33 but trend clearly declining toward the danger zone.',
                cause:'Furnace elements aging — temperature uniformity degrading. SPC trend chart caught the drift 3 months before Cpk would have breached 1.33.',
                lesson:'SPC is most valuable as an early warning system. Monthly Cpk trend review enables proactive action. Waiting for the auditor to find Cpk < 1.33 is always more expensive.',
                best:'Furnace elements replaced proactively. Cpk: 1.52→1.91. Cost: Rs.85K maintenance vs Rs.30L+ potential recall/rework/audit NC cost avoided.'},
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
            <a href="/downloads/spc/SPC_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Training Guide PDF</a>
            <a href="/downloads/spc/SPC_Competency_Matrix.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0891b2'}}>Competency Matrix</a>
            <a href="/downloads/spc/AIAG_SPC_Second_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>AIAG SPC 2nd Ed.</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#0891b2'}}>🎓 SPC Training Academy</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Structured learning from Operator to SPC Champion — build statistical process control competency at all levels</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {[
              {level:'Level 1', title:'SPC Awareness', role:'Operators on SPC Lines', color:'#0d9488', icon:'🌱', dur:'2 hours', topics:[
                'What is a control chart and why it matters',
                'Centerline, UCL, LCL — what each line means',
                'How to plot a reading correctly and on time',
                '4 key Nelson rules: Rule 1, 2, 3, 4 with real examples',
                'STOP and NOTIFY when any point is outside control limits',
                'Never adjust the process when chart is in control (no tampering)',
                'How to complete the out-of-control log correctly',
              ]},
              {level:'Level 2', title:'SPC Practitioner', role:'Engineers / QA Staff', color:'#0891b2', icon:'⚙️', dur:'1 full day', topics:[
                'AIAG SPC 2nd Edition: 6 chart types and when to use each',
                'X-bar & R chart: subgroup selection, limit calculation (A2, D3, D4)',
                'All 8 Nelson rules with probability and decision guidance',
                'Cp, Cpk, Pp, Ppk — calculation, interpretation, improvement',
                'Control limits vs spec limits — the golden distinction',
                'I-MR chart for individual measurements',
                'Attribute charts: p, np, c, u — when each applies',
                'PPAP Element 9: initial process study requirements',
              ]},
              {level:'Level 3', title:'SPC Expert / Facilitator', role:'Quality Head / Managers', color:'#7c3aed', icon:'🏆', dur:'2 days + exam', topics:[
                'ANOVA-based SPC: within and between subgroup variation',
                'Non-normal distributions and non-parametric indices',
                'MSA interaction: GRR effect on observed Cpk inflation',
                'Customer-specific SPC: Ford SQE Manual, GM SPC requirements',
                'Developing plant-wide SPC deployment and review system',
                'IATF audit simulation — 10 auditor questions on SPC',
                'Cpk improvement project facilitation with ROI calculation',
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
          <div className="bg-white border rounded-xl p-5 shadow-sm" style={{borderColor:'#e2e8f0'}}>
            <div className="text-sm font-bold mb-4" style={{color:'#0891b2'}}>📊 SPC Competency Matrix</div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{background:'#0891b2'}}>
                  {['Role','Control Charts','Cpk/Ppk','Nelson Rules','IATF Audit','PPAP Element 9'].map(h=>(
                    <th key={h} className="p-2 text-left text-white font-bold border border-cyan-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Quality Head','L3','L3','L3','L3','L3'],
                  ['Quality Manager','L3','L3','L2','L2','L3'],
                  ['Quality Engineer','L2','L2','L2','L2','L2'],
                  ['SPC Operator','L1','L1','L1','—','—'],
                  ['Production Supervisor','L1','L1','L1','—','—'],
                ].map((row,ri)=>(
                  <tr key={ri} style={{background: ri%2===0?'#ecfeff':'#fff'}}>
                    {row.map((cell,ci)=>(
                      <td key={ci} className="p-2 border border-[#dbeafe] font-bold"
                        style={{color: cell==='L3'?'#7c3aed': cell==='L2'?'#0891b2': cell==='L1'?'#0d9488':'#9ca3af'}}>
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
  );
}

// -- Sample Data ---------------------------------------------------------------
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
