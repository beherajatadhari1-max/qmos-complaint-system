'use client';
import { useState } from 'react';

const CHARTS = [
  {
    name: 'X̄-R Chart', full: 'X-bar and Range Chart', icon: '📊', use: 'n = 2 to 10 (most common in automotive)',
    when: 'Most widely used chart in automotive manufacturing. Use when you can collect subgroups of 2–10 parts at regular intervals from the same process.',
    how: 'Collect n parts per subgroup at set frequency. Calculate X̄ (subgroup average) and R (subgroup range = max − min). Plot on separate X̄ and R charts. Calculate UCL/LCL using control chart constants.',
    formulas: [
      { label: 'X̄ (subgroup average)', formula: 'Σxi / n' },
      { label: 'R (subgroup range)', formula: 'Xmax − Xmin' },
      { label: 'Grand average (X̄̄)', formula: 'Σ X̄i / k' },
      { label: 'R̄ (average range)', formula: 'ΣRi / k' },
      { label: 'UCL for X̄', formula: 'X̄̄ + A₂ × R̄' },
      { label: 'LCL for X̄', formula: 'X̄̄ − A₂ × R̄' },
      { label: 'UCL for R', formula: 'D₄ × R̄' },
      { label: 'LCL for R', formula: 'D₃ × R̄ (= 0 for n < 7)' },
    ],
    constants: 'A₂, D₃, D₄ values from AIAG SPC table (e.g. n=5: A₂=0.577, D₃=0, D₄=2.114)',
    tip: 'Most popular chart. Start here for new SPC implementation. Chart must be posted at the machine where the operator can see and react.',
  },
  {
    name: 'I-MR Chart', full: 'Individuals and Moving Range Chart', icon: '📉', use: 'n = 1 (one measurement per subgroup)',
    when: 'Use when only one measurement is taken per time period — chemical process outputs, long cycle times, destructive testing, or lab results.',
    how: 'Plot each individual measurement (Xi) and the moving range between consecutive points (MRi = |Xi − Xi-1|). Calculate UCL/LCL from average and average moving range.',
    formulas: [
      { label: 'X̄ (process average)', formula: 'ΣXi / k' },
      { label: 'MR (moving range)', formula: '|Xi − Xi-1|' },
      { label: 'MR̄ (average MR)', formula: 'ΣMRi / (k−1)' },
      { label: 'UCL for I', formula: 'X̄ + 2.66 × MR̄' },
      { label: 'LCL for I', formula: 'X̄ − 2.66 × MR̄' },
      { label: 'UCL for MR', formula: '3.27 × MR̄' },
    ],
    constants: 'Constant 2.66 = 3/d₂ for n=2. d₂=1.128.',
    tip: 'Do not subgroup artificially just to use X̄-R. If you naturally get one reading per period, I-MR is correct and more sensitive.',
  },
  {
    name: 'p Chart', full: 'Proportion Defective Chart', icon: '📋', use: 'Attribute data — variable sample size',
    when: 'Use for go/no-go data (pass/fail, good/bad) where sample size varies between subgroups. Plots the proportion (fraction) defective.',
    how: 'Count number of defective items in each subgroup. Divide by subgroup size to get proportion. Plot p̄ ± 3σ limits.',
    formulas: [
      { label: 'p (proportion defective)', formula: 'np / n' },
      { label: 'p̄ (average proportion)', formula: 'Σnp / Σn' },
      { label: 'UCL', formula: 'p̄ + 3√(p̄(1−p̄)/n)' },
      { label: 'LCL', formula: 'p̄ − 3√(p̄(1−p̄)/n) or 0' },
    ],
    constants: 'Control limits recalculate for each subgroup if sample size varies.',
    tip: 'Limits vary per subgroup when n changes — this is normal and correct. Use np chart instead if sample size is constant.',
  },
  {
    name: 'np Chart', full: 'Number Defective Chart', icon: '🔢', use: 'Attribute data — fixed sample size',
    when: 'Like p chart but plots the actual count of defectives instead of proportion. Only valid when every subgroup has exactly the same sample size.',
    how: 'Count number of defectives in each subgroup of fixed size n. Plot count directly. Single set of UCL/LCL for the whole chart.',
    formulas: [
      { label: 'np̄ (average count)', formula: 'Σnp / k' },
      { label: 'UCL', formula: 'np̄ + 3√(np̄(1−p̄))' },
      { label: 'LCL', formula: 'np̄ − 3√(np̄(1−p̄)) or 0' },
    ],
    constants: 'n must be constant for all subgroups. If n varies, use p chart.',
    tip: 'Simpler to explain to operators than p chart since you plot actual defect count, not fraction. Preferred on the shop floor.',
  },
];

const CAPABILITY = [
  {
    index: 'Cp', name: 'Process Capability Index', formula: '(USL − LSL) / (6σ)',
    target: '> 1.33', critical: '> 1.67',
    meaning: 'Measures spread of the process relative to tolerance. Does NOT account for centering — a perfectly capable but off-center process can have high Cp but low Cpk.',
    interpretation: [
      { range: '< 1.00', verdict: 'Process incapable', action: '100% inspection + immediate CAPA', cls: 'bg-red-100 text-red-800' },
      { range: '1.00 – 1.33', verdict: 'Marginal', action: 'Monitor closely, improve process centering', cls: 'bg-yellow-100 text-yellow-800' },
      { range: '1.33 – 1.67', verdict: 'Acceptable', action: 'Normal SPC monitoring', cls: 'bg-blue-100 text-blue-800' },
      { range: '> 1.67', verdict: 'Excellent', action: 'Maintain, consider reducing inspection frequency', cls: 'bg-green-100 text-green-800' },
    ],
    warning: 'Cp ignores where the process is centred. Always report Cpk alongside Cp.',
  },
  {
    index: 'Cpk', name: 'Process Capability Index (centred)', formula: 'min[(USL − X̄)/3σ, (X̄ − LSL)/3σ]',
    target: '> 1.33', critical: '> 1.67',
    meaning: 'Measures both spread AND centering. The most important capability index. Cpk = Cp only when the process is perfectly centred. Cpk < Cp always indicates off-centering.',
    interpretation: [
      { range: '< 1.00', verdict: 'Incapable', action: '100% inspection + root cause analysis + immediate CAPA', cls: 'bg-red-100 text-red-800' },
      { range: '1.00 – 1.33', verdict: 'Marginal', action: 'Increase inspection frequency. Investigate variation sources.', cls: 'bg-yellow-100 text-yellow-800' },
      { range: '1.33 – 1.67', verdict: 'Capable', action: 'Standard SPC monitoring. Continue improvement.', cls: 'bg-blue-100 text-blue-800' },
      { range: '> 1.67', verdict: 'Highly capable', action: 'Special characteristic requirement met. Excellent process.', cls: 'bg-green-100 text-green-800' },
    ],
    warning: 'IATF 16949 requires Cpk > 1.67 for special characteristics (safety/regulatory). Never use Cp alone.',
  },
  {
    index: 'Pp', name: 'Performance Index (long-term)', formula: '(USL − LSL) / (6s)',
    target: '> 1.33', critical: '> 1.67',
    meaning: 'Like Cp but uses actual sample standard deviation (s) instead of estimated σ. Represents long-term total variation including between-subgroup variation. Use for initial process studies.',
    interpretation: [
      { range: '< 1.33', verdict: 'Process not capable long-term', action: 'Investigate special causes and systemic variation', cls: 'bg-red-100 text-red-800' },
      { range: '> 1.33', verdict: 'Acceptable', action: 'Continue to monitor Ppk', cls: 'bg-green-100 text-green-800' },
    ],
    warning: 'Pp should be close to Cp. If Pp << Cp, there is significant between-subgroup variation — a sign of process instability.',
  },
  {
    index: 'Ppk', name: 'Performance Index — centred (long-term)', formula: 'min[(USL − X̄)/3s, (X̄ − LSL)/3s]',
    target: '> 1.33', critical: '> 1.67',
    meaning: 'Long-term equivalent of Cpk. Used in PPAP initial process studies (30-piece study). Measures total actual performance including all sources of variation.',
    interpretation: [
      { range: '< 1.33', verdict: 'Not capable for production', action: 'Process must be improved before PPAP approval', cls: 'bg-red-100 text-red-800' },
      { range: '> 1.33', verdict: 'PPAP requirement met', action: 'Document study results in PPAP Element 9', cls: 'bg-green-100 text-green-800' },
    ],
    warning: 'Ppk is the PPAP requirement. Cpk is the ongoing production requirement. Both must be reported.',
  },
];

const OOC_RULES = [
  { rule: 'Rule 1', name: '1 point beyond 3σ', desc: 'Any single point outside the 3-sigma control limits (above UCL or below LCL).', action: 'Stop. Investigate immediately. Identify and remove assignable cause before continuing production.', urgent: true },
  { rule: 'Rule 2', name: '7 consecutive points on one side', desc: '7 (or more) consecutive points all above or all below the centre line. Process has shifted.', action: 'Investigate process shift. Check for material change, shift change, tool wear, or machine setting drift.', urgent: true },
  { rule: 'Rule 3', name: '6 consecutive points trending', desc: '6 consecutive points continuously increasing or continuously decreasing.', action: 'Identify trend cause — tool wear, temperature drift, material batch change. Correct before out-of-control occurs.', urgent: false },
  { rule: 'Rule 4', name: '14 alternating points', desc: '14 consecutive points alternating up and down — zigzag pattern indicating over-adjustment.', action: 'Stop over-adjustment. Operators adjusting too frequently based on individual points creates this pattern.', urgent: false },
  { rule: 'Rule 5', name: '2 of 3 near 2σ', desc: '2 out of 3 consecutive points beyond 2σ on the same side.', action: 'Potential shift. Increase inspection frequency. Investigate process condition.', urgent: false },
  { rule: 'Rule 6', name: '15 within ±1σ', desc: '15 consecutive points within ±1σ of centre line (hugging). May indicate stratified data.', action: 'Investigate data collection — may be mixing two different processes or subgrouping incorrectly.', urgent: false },
];

export default function SPCPage() {
  const [tab, setTab] = useState<'overview'|'charts'|'capability'|'rules'>('overview');
  const [expandedChart, setExpandedChart] = useState<string|null>(null);
  const [expandedCap, setExpandedCap] = useState<string|null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-blue-950 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">📈 SPC — Statistical Process Control</h1>
            <p className="text-blue-300 mt-1 text-sm">AIAG SPC 2nd Edition · IATF 16949 Cl. 8.5.1 · Control Plan Linkage</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['AIAG SPC 2nd Ed.','IATF 8.5.1','Control Plan'].map(s => (
              <span key={s} className="px-3 py-1 bg-blue-800 text-blue-200 rounded-full text-xs font-semibold">{s}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { n:'4', label:'Control Chart Types' },
            { n:'Cpk > 1.67', label:'Special Char. Target' },
            { n:'6', label:'Out-of-Control Rules' },
            { n:'Cl. 8.5.1', label:'IATF Clause' },
          ].map((s,i) => (
            <div key={i} className="bg-blue-900/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{s.n}</p>
              <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {([['overview','📋 What is SPC'],['charts','📊 Control Charts'],['capability','📐 Capability Indices'],['rules','🚨 Out-of-Control Rules']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === id ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">What is SPC?</h2>
            <p className="text-gray-600 leading-relaxed">SPC (Statistical Process Control) uses statistical methods and control charts to monitor a manufacturing process in real time — detecting when the process is going out of control <strong>before</strong> defects are produced.</p>
            <p className="text-gray-600 leading-relaxed mt-3">SPC separates two types of variation:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-bold text-green-800 text-sm">Common Cause Variation (Noise)</p>
                <p className="text-green-700 text-sm mt-1">Natural, random variation in every process. Process is "in control." Do not adjust — adjusting for common cause makes things worse (tampering).</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-bold text-red-800 text-sm">Special Cause Variation (Signal)</p>
                <p className="text-red-700 text-sm mt-1">Unusual variation from identifiable causes — tool wear, material change, operator error, machine fault. Process is "out of control." Must investigate and act immediately.</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              💡 <strong>SPC goal:</strong> Detect special causes early and eliminate them — so the process runs on common cause only, producing consistent, predictable output.
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">The SPC Golden Rules — Factory Floor</h2>
            <div className="space-y-3">
              {[
                { n:'1', rule:'Chart must be at the machine', detail:'Not in the office. The operator must see the chart while working. No chart at machine = no SPC.' },
                { n:'2', rule:'Operator plots and reacts', detail:'SPC is not a quality engineer exercise. The operator plots every subgroup and takes action when out-of-control rules trigger.' },
                { n:'3', rule:'Do MSA before SPC', detail:'A bad gauge gives bad data. Validate your measurement system (GRR < 30%) before starting SPC or your charts are meaningless.' },
                { n:'4', rule:'Never tamper', detail:'Do not adjust the machine for every point that moves. Only react to out-of-control signals. Tampering increases variation.' },
                { n:'5', rule:'Cpk > 1.67 for special characteristics', detail:'IATF 16949 requires this. If Cpk < 1.67, 100% inspection is mandatory plus immediate CAPA.' },
                { n:'6', rule:'Update control limits after improvement', detail:'If you make a permanent process improvement, recalculate control limits from the new stable data. Old limits are no longer valid.' },
              ].map(r => (
                <div key={r.n} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{r.n}</div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{r.rule}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {tab === 'charts' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            📌 <strong>Chart selection rule:</strong> Variable data (measurements) → X̄-R or I-MR. Attribute data (pass/fail, count) → p, np, c, or u chart. Always choose based on your data type and subgroup size.
          </div>
          {CHARTS.map((c) => (
            <div key={c.name} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => setExpandedChart(e => e === c.name ? null : c.name)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition">
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{c.name} <span className="font-normal text-gray-500">— {c.full}</span></p>
                  <p className="text-xs text-blue-600 mt-0.5">{c.use}</p>
                </div>
                <span className="text-gray-400 text-lg">{expandedChart === c.name ? '▲' : '▼'}</span>
              </button>
              {expandedChart === c.name && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">When to use</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.when}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">How to implement</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.how}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Formulas</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {c.formulas.map((f, i) => (
                        <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-2 flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-600">{f.label}</span>
                          <span className="font-mono text-sm font-bold text-blue-800">{f.formula}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 italic">{c.constants}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    💡 <strong>Expert tip:</strong> {c.tip}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Capability */}
      {tab === 'capability' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="font-semibold text-gray-700 mb-3">Quick Reference — Target Values</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['Cp','> 1.33','> 1.67 (SC)'],['Cpk','> 1.33','> 1.67 (SC)'],['Pp','> 1.33 (PPAP)','—'],['Ppk','> 1.33 (PPAP)','—']].map(([idx, normal, special]) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">{idx}</p>
                  <p className="text-xs text-gray-600 mt-1">Normal: <strong>{normal}</strong></p>
                  {special !== '—' && <p className="text-xs text-red-600 mt-0.5">Special char: <strong>{special}</strong></p>}
                </div>
              ))}
            </div>
          </div>
          {CAPABILITY.map((cap) => (
            <div key={cap.index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => setExpandedCap(e => e === cap.index ? null : cap.index)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition">
                <div className="w-12 h-12 bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{cap.index}</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{cap.name}</p>
                  <code className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-0.5 inline-block">{cap.formula}</code>
                </div>
                <div className="text-right mr-2">
                  <p className="text-xs text-gray-400">Target</p>
                  <p className="font-bold text-blue-700">{cap.target}</p>
                </div>
                <span className="text-gray-400 text-lg">{expandedCap === cap.index ? '▲' : '▼'}</span>
              </button>
              {expandedCap === cap.index && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{cap.meaning}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Interpretation & Action</p>
                    {cap.interpretation.map((row, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${row.cls}`}>
                        <span className="font-mono font-bold text-sm w-20 flex-shrink-0">{row.range}</span>
                        <span className="font-semibold text-sm w-28 flex-shrink-0">{row.verdict}</span>
                        <span className="text-sm">{row.action}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    ⚠️ {cap.warning}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Out-of-Control Rules */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-gray-600 text-sm leading-relaxed">When any of these rules trigger on a control chart, the process is "out of control" — an assignable cause is present. <strong>Stop production. Investigate. Fix root cause. Document the action on the chart.</strong> Then resume production.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OOC_RULES.map((r) => (
              <div key={r.rule} className={`bg-white rounded-xl border shadow-sm p-5 ${r.urgent ? 'border-red-200' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${r.urgent ? 'bg-red-600' : 'bg-orange-500'}`}>
                    {r.rule.split(' ')[1]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{r.name}</p>
                    {r.urgent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Immediate action required</span>}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{r.desc}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">
                  <span className="font-bold">Action: </span>{r.action}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-950 rounded-xl p-5 text-white">
            <p className="font-bold mb-2">📌 Operator's Out-of-Control Response</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-blue-200">
              {['1. Stop the machine','2. Tag suspect parts','3. Inform supervisor','4. Document on chart + logbook'].map((s, i) => (
                <div key={i} className="bg-blue-900/50 rounded-lg p-3">
                  <p className="font-semibold text-white">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
