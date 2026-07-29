'use client';
import { useState } from 'react';

const GRR_STEPS = [
  { step: '1', title: 'Select the gauge', desc: 'Choose the gauge used in the Control Plan for this characteristic. The same gauge used in production — no special or better gauge for the study.' },
  { step: '2', title: 'Select 10 parts', desc: 'Choose 10 parts that represent the full range of the process variation — not 10 good parts. Include parts near both specification limits and from different production lots.' },
  { step: '3', title: 'Select 3 appraisers', desc: 'Choose 3 operators who normally use this gauge. They must be the actual production operators — not the quality engineer or supervisor.' },
  { step: '4', title: 'Blind randomised study', desc: 'Each appraiser measures all 10 parts twice (2 trials) without seeing other results. Parts are randomised and coded — appraisers do not know which part number they are measuring. Total = 10 × 3 × 2 = 60 readings.' },
  { step: '5', title: 'Calculate GRR', desc: 'Calculate Repeatability (EV), Reproducibility (AV), and %GRR. Compare against tolerance (% Tolerance) and process variation (% Study Variation).' },
  { step: '6', title: 'Interpret and act', desc: '%GRR < 10% = Acceptable. 10–30% = Conditional (investigate). > 30% = Unacceptable — do not use this gauge for SPC until improved.' },
];

const STUDIES = [
  {
    name: 'Gauge R&R (Variable — Crossed)', icon: '📏', mandatory: true,
    when: 'Most common MSA study. Use for all variable (measured) characteristics — dimensions, weight, torque, force. Non-destructive testing where the same part can be measured multiple times.',
    design: '10 parts × 3 appraisers × 2 trials = 60 readings. Crossed design: every appraiser measures every part.',
    metrics: [
      { name: 'EV (Repeatability)', formula: 'Equipment Variation — same appraiser, same part, same gauge. Indicates gauge consistency.', target: 'Part of %GRR calculation' },
      { name: 'AV (Reproducibility)', formula: 'Appraiser Variation — different appraisers measuring the same part. Indicates training or method consistency.', target: 'Part of %GRR calculation' },
      { name: '%GRR', formula: '√(EV² + AV²) / Process σ × 100', target: '< 10% Acceptable, 10–30% Conditional, > 30% Unacceptable' },
      { name: 'ndc', formula: 'Number of Distinct Categories = 1.41 × (PV/GRR)', target: '≥ 5 required for SPC and process capability studies' },
    ],
    action: 'If %GRR > 30%: check gauge calibration, improve operator training, redesign gauge or fixture. Re-run study after improvement.',
  },
  {
    name: 'Gauge R&R (Variable — Nested)', icon: '🔬', mandatory: false,
    when: 'Use for destructive testing where the same part cannot be measured twice — tensile strength, hardness, chemical composition, weld pull-out force.',
    design: '10 batches × 3 appraisers × 2 parts per batch = 60 readings. Each appraiser gets a different (but identical) part from the same batch.',
    metrics: [
      { name: 'Repeatability', formula: 'Variation between two parts from the same batch by the same appraiser', target: 'Includes both gauge and part-to-part variation within batch' },
      { name: 'Reproducibility', formula: 'Variation between appraisers', target: 'Part of %GRR calculation' },
      { name: '%GRR', formula: 'Same acceptance criteria as crossed study', target: '< 10% Acceptable' },
    ],
    action: 'Note: Repeatability in nested study includes within-batch part variation — %GRR may be higher than crossed study. Interpret with caution.',
  },
  {
    name: 'Attribute Agreement Analysis (AAA)', icon: '✅', mandatory: true,
    when: 'Use for go/no-go gauges, visual inspection, attribute characteristics — pass/fail, good/bad, accept/reject decisions. No measurements, only classifications.',
    design: '30–50 parts × 3 appraisers × 2 trials each. Include known good and known bad parts, and borderline parts near the acceptance boundary.',
    metrics: [
      { name: 'Within Appraiser Agreement', formula: 'How consistent is each appraiser with themselves? (Kappa statistic)', target: 'Kappa > 0.75 = Acceptable' },
      { name: 'Between Appraiser Agreement', formula: 'How consistent are appraisers with each other?', target: 'Kappa > 0.75 = Acceptable' },
      { name: 'Vs. Reference (Effectiveness)', formula: 'How well does each appraiser agree with the known reference standard?', target: '≥ 90% agreement with reference' },
    ],
    action: 'Kappa < 0.75: retrain appraisers, improve visual aids and boundary standards, define clearer acceptance criteria with reference photos.',
  },
  {
    name: 'Bias Study', icon: '🎯', mandatory: false,
    when: 'Determines if a gauge consistently reads higher or lower than the true reference value. Use when you suspect systematic offset in your gauge.',
    design: 'One reference part with known true value. Measure 25+ times by one appraiser. Compare average reading to reference value.',
    metrics: [
      { name: 'Bias', formula: 'X̄ (observed average) − Reference Value', target: 'Bias = 0 (or within acceptance tolerance)' },
      { name: '%Bias', formula: '|Bias| / Process Variation × 100', target: '< 10% of process variation' },
      { name: 'T-test', formula: 'Check if bias is statistically significant', target: 'p-value > 0.05 = bias not significant' },
    ],
    action: 'Significant bias: recalibrate gauge, repair or replace. Check if bias changes over the measurement range (see Linearity study).',
  },
  {
    name: 'Linearity Study', icon: '📐', mandatory: false,
    when: 'Checks if gauge bias is consistent across the full operating range. A gauge may be accurate at midrange but biased at extremes.',
    design: 'Select 5 reference parts spanning the full measurement range. Measure each 12 times. Calculate bias at each level. Plot bias vs. reference value.',
    metrics: [
      { name: 'Linearity', formula: 'Slope of regression line (bias vs. reference)', target: 'Slope near 0 = consistent bias across range' },
      { name: '%Linearity', formula: '|Slope| × Process Variation / Process Variation × 100', target: '< 5% of process variation' },
    ],
    action: 'Non-linear gauge: check for wear, damage, or non-linear response characteristic. May need gauge redesign or limited operating range.',
  },
  {
    name: 'Stability Study', icon: '📅', mandatory: false,
    when: 'Monitors gauge accuracy over time. Detects gauge drift, calibration loss, or degradation. Run periodically on critical gauges.',
    design: 'Measure one reference part (master sample) regularly over time (days/weeks/months). Plot measurements on an I-MR control chart.',
    metrics: [
      { name: 'Stability', formula: 'Range of bias values over time', target: 'Process should be in statistical control on I-MR chart' },
      { name: 'Drift', formula: 'Trend in bias values over time', target: 'No trending or systematic shift' },
    ],
    action: 'Out-of-control on stability chart: investigate gauge condition, calibration status, environmental conditions (temperature, humidity). Recalibrate.',
  },
];

const ACCEPTANCE = [
  { range: '< 10%', label: 'Acceptable', action: 'Gauge is suitable for production and SPC. Proceed.', cls: 'border-green-300 bg-green-50 text-green-800' },
  { range: '10% – 30%', label: 'Conditional', action: 'May be acceptable based on application, cost of improvement, or customer approval. Investigate root cause. Document justification.', cls: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
  { range: '> 30%', label: 'Unacceptable', action: 'Gauge must not be used for SPC or critical measurement. Improve or replace gauge before starting capability study.', cls: 'border-red-300 bg-red-50 text-red-800' },
];

export default function MSAPage() {
  const [tab, setTab] = useState<'overview'|'grr'|'studies'|'kappa'>('overview');
  const [expanded, setExpanded] = useState<string|null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-violet-950 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">🔬 MSA — Measurement System Analysis</h1>
            <p className="text-violet-300 mt-1 text-sm">AIAG MSA 4th Edition · IATF 16949 Cl. 7.1.5 · Before every SPC study</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['AIAG MSA 4th Ed.','IATF 7.1.5','Control Plan'].map(s => (
              <span key={s} className="px-3 py-1 bg-violet-800 text-violet-200 rounded-full text-xs font-semibold">{s}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { n:'6', label:'MSA Study Types' },
            { n:'< 10%', label:'%GRR Acceptable' },
            { n:'≥ 5', label:'ndc Required for SPC' },
            { n:'Kappa > 0.75', label:'Attribute Target' },
          ].map((s,i) => (
            <div key={i} className="bg-violet-900/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{s.n}</p>
              <p className="text-violet-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {([['overview','📋 Why MSA'],['grr','📏 How to Run GRR'],['studies','🔬 All MSA Studies'],['kappa','✅ Attribute MSA']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === id ? 'bg-white shadow text-violet-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Why MSA */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Why MSA — The Most Ignored Step in Quality</h2>
            <p className="text-gray-600 leading-relaxed">Before you trust any measurement — for SPC, capability study, incoming inspection, or final inspection — you must prove the measurement system is reliable. MSA answers: <em>"Can I trust the data my gauge is giving me?"</em></p>
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-bold text-red-800 mb-2">🚨 The Dangerous Assumption</p>
              <p className="text-red-700 text-sm">Many factories assume their gauges are accurate because they are calibrated. <strong>Calibration ≠ acceptable MSA.</strong> A calibrated gauge can still have poor repeatability or reproducibility. Without MSA, your SPC charts and Cpk values may be completely wrong.</p>
            </div>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="font-bold text-green-800 mb-2">✅ The MSA Rule</p>
              <p className="text-green-700 text-sm">Always run MSA <strong>before</strong> your SPC study and <strong>before</strong> your PPAP capability study. If %GRR > 30%, your capability data is unreliable — fix the gauge first.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">%GRR Acceptance Criteria</h2>
            <div className="space-y-3">
              {ACCEPTANCE.map((a, i) => (
                <div key={i} className={`border rounded-xl p-4 ${a.cls}`}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-lg">{a.range}</span>
                    <span className="font-bold">{a.label}</span>
                  </div>
                  <p className="text-sm">{a.action}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-lg text-sm text-violet-800">
              💡 <strong>ndc (Number of Distinct Categories) ≥ 5</strong> is also required. If ndc &lt; 5, the gauge cannot distinguish between enough different values to be useful for SPC — even if %GRR looks acceptable.
            </div>
          </div>
          <div className="bg-blue-950 rounded-xl p-5 text-white">
            <p className="font-bold mb-3">MSA Requirements — IATF 16949</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {[
                { c:'Cl. 7.1.5', t:'MSA for all gauges used for special characteristics in Control Plan' },
                { c:'Cl. 8.5.1', t:'MSA must be done before SPC implementation' },
                { c:'PPAP El. 8', t:'MSA study required as Element 8 of every PPAP submission' },
              ].map((item, i) => (
                <div key={i} className="bg-blue-900/50 rounded-lg p-3">
                  <p className="font-bold text-blue-300 text-xs mb-1">{item.c}</p>
                  <p className="text-blue-200">{item.t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* How to Run GRR */}
      {tab === 'grr' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Step-by-Step: Running a Gauge R&R Study</h2>
            <div className="space-y-3">
              {GRR_STEPS.map((s, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                  <div className="w-9 h-9 bg-violet-700 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{s.step}</div>
                  <div>
                    <p className="font-bold text-violet-900">{s.title}</p>
                    <p className="text-violet-800 text-sm mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Key Formulas — GRR Calculation</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-violet-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-violet-800 font-semibold">Term</th>
                    <th className="text-left px-4 py-2 text-violet-800 font-semibold">Meaning</th>
                    <th className="text-left px-4 py-2 text-violet-800 font-semibold">Formula</th>
                    <th className="text-left px-4 py-2 text-violet-800 font-semibold">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { term:'EV (Repeatability)', meaning:'Gauge variation — same part, same operator', formula:'R̄ × K₁', target:'As small as possible' },
                    { term:'AV (Reproducibility)', meaning:'Operator variation — same part, different operators', formula:'√(X̄diff × K₂)² − (EV²/nr)', target:'As small as possible' },
                    { term:'GRR', meaning:'Total gauge system variation', formula:'√(EV² + AV²)', target:'—' },
                    { term:'PV (Part Variation)', meaning:'Actual part-to-part variation', formula:'Rp × K₃', target:'Should be large vs GRR' },
                    { term:'%GRR (vs. TV)', meaning:'GRR as % of total variation', formula:'GRR / TV × 100', target:'< 10%' },
                    { term:'%GRR (vs. Tolerance)', meaning:'GRR as % of tolerance band', formula:'5.15 × GRR / (USL−LSL) × 100', target:'< 10%' },
                    { term:'ndc', meaning:'Number of distinct categories gauge can resolve', formula:'1.41 × PV / GRR', target:'≥ 5' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-gray-800">{row.term}</td>
                      <td className="px-4 py-2 text-gray-600">{row.meaning}</td>
                      <td className="px-4 py-2 font-mono text-violet-700 text-xs">{row.formula}</td>
                      <td className="px-4 py-2 font-semibold text-green-700">{row.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Studies */}
      {tab === 'studies' && (
        <div className="space-y-3">
          {STUDIES.map((s) => (
            <div key={s.name} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(e => e === s.name ? null : s.name)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{s.name}</p>
                  <p className="text-xs text-violet-600 mt-0.5">{s.when.substring(0,80)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.mandatory && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">IATF Required</span>}
                  <span className="text-gray-400 text-lg">{expanded === s.name ? '▲' : '▼'}</span>
                </div>
              </button>
              {expanded === s.name && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">When to use</p><p className="text-sm text-gray-700">{s.when}</p></div>
                    <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Study design</p><p className="text-sm text-gray-700">{s.design}</p></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Key Metrics & Targets</p>
                    <div className="space-y-2">
                      {s.metrics.map((m, i) => (
                        <div key={i} className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-violet-900 text-sm">{m.name}</p>
                            <span className="text-xs bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full flex-shrink-0">{m.target}</span>
                          </div>
                          <p className="text-violet-700 text-xs mt-1">{m.formula}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    🔧 <strong>If results fail:</strong> {s.action}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attribute MSA / Kappa */}
      {tab === 'kappa' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Attribute Agreement Analysis — Kappa Statistic</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">For go/no-go gauges and visual inspection, we cannot calculate %GRR. Instead we use Cohen's Kappa statistic to measure agreement — between an appraiser and themselves (repeatability) and between appraisers (reproducibility).</p>
            <div className="space-y-2">
              {[
                { k:'≥ 0.90', label:'Excellent', desc:'Measurement system is highly consistent. Minimal misclassification risk.', cls:'bg-green-100 text-green-800 border-green-300' },
                { k:'0.75 – 0.89', label:'Acceptable', desc:'Acceptable for production. Monitor borderline parts closely.', cls:'bg-green-50 text-green-700 border-green-200' },
                { k:'0.40 – 0.74', label:'Marginal', desc:'Significant misclassification risk. Retrain appraisers. Improve reference standards and visual aids.', cls:'bg-yellow-100 text-yellow-800 border-yellow-300' },
                { k:'< 0.40', label:'Unacceptable', desc:'Measurement system is unreliable for accept/reject decisions. Do not use until improved.', cls:'bg-red-100 text-red-800 border-red-300' },
              ].map((row, i) => (
                <div key={i} className={`border rounded-xl p-3 flex items-start gap-4 ${row.cls}`}>
                  <span className="font-mono font-bold text-lg w-24 flex-shrink-0">{row.k}</span>
                  <div>
                    <p className="font-bold">{row.label}</p>
                    <p className="text-sm mt-0.5">{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">How to Improve a Failed Attribute MSA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon:'📸', title:'Create reference photo standards', desc:'Develop boundary condition photos for accept/reject — especially for borderline defects. Post at inspection station.' },
                { icon:'🎓', title:'Retrain appraisers', desc:'Use the borderline parts from the study as training aids. Show the correct decision for each part. Role-play inspection scenarios.' },
                { icon:'💡', title:'Improve inspection conditions', desc:'Better lighting, magnification, defined viewing angle and distance. Poor inspection environment causes variation.' },
                { icon:'📋', title:'Define clearer acceptance criteria', desc:'If appraisers disagree, the criteria are ambiguous. Rewrite inspection criteria with examples, dimensions, and photos.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
