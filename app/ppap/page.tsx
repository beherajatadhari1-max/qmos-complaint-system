'use client';
import { useState } from 'react';

const LEVELS = [
  { level: 'Level 1', label: 'Warrant only', desc: 'PSW submitted to customer. No supporting documents unless requested. Used for bulk/standard commodity items.', use: 'Low-risk, standard parts, bulk commodities' },
  { level: 'Level 2', label: 'Warrant + limited samples', desc: 'PSW + product samples + limited supporting data. Customer keeps samples on file.', use: 'Low-to-medium risk parts, customer discretion' },
  { level: 'Level 3', label: 'Warrant + full data (most common)', desc: 'PSW + complete supporting documentation + samples. Default requirement for most automotive customers.', use: 'Standard automotive production parts — TML, MSIL, Honda, Bajaj' },
  { level: 'Level 4', label: 'Warrant + customer-defined requirements', desc: 'PSW + any specific documents defined by the customer. Varies by customer CSR.', use: 'Customer-specific programs, premium brands' },
  { level: 'Level 5', label: 'Warrant + full review at supplier', desc: 'Full documentation review conducted at the supplier facility. Customer sends team to review everything on-site.', use: 'Critical safety parts, new supplier qualification, audit-based approval' },
];

const ELEMENTS = [
  { no: '1', name: 'Design Records', icon: '📐', clause: 'AIAG PPAP 4th Ed. Section 2.1', mandatory: true,
    what: 'Complete drawing package — part drawing (2D), 3D CAD model, engineering specifications, and all referenced documents.',
    how: 'Obtain from customer engineering. Verify revision level matches PPAP submission. Balloon all characteristics on the drawing.',
    common: 'Wrong revision level, missing referenced specifications, unbalooned drawing submitted.',
    tip: 'Always balloon the drawing. Number every dimension and characteristic. This is document #1 in your PPAP binder.' },
  { no: '2', name: 'Engineering Change Documents', icon: '🔄', clause: 'AIAG PPAP 4th Ed. Section 2.2', mandatory: false,
    what: 'Engineering Change Notices (ECN), deviation requests, and formal change authorisations if the part has been changed after original design.',
    how: 'Include all ECNs since last approved PPAP. Get written approval from customer engineering before incorporating any change.',
    common: 'Implementing engineering changes without customer written approval. Missing ECN trail for PPAP updates.',
    tip: 'No change without written approval. Verbal approvals do not count. Archive all ECNs in your PPAP folder permanently.' },
  { no: '3', name: 'Customer Engineering Approval', icon: '✅', clause: 'AIAG PPAP 4th Ed. Section 2.3', mandatory: false,
    what: 'Written sign-off from customer engineering team confirming the design is acceptable — usually via email, DV/PV report, or engineering approval form.',
    how: 'Submit prototype samples for engineering sign-off before production PPAP. Keep email trail as evidence.',
    common: 'No written evidence of engineering approval, only verbal communication.',
    tip: 'Always get email or signed form. Print and include in PPAP package. This protects you if disputes arise later.' },
  { no: '4', name: 'DFMEA', icon: '⚠️', clause: 'AIAG PPAP 4th Ed. Section 2.4 / AIAG-VDA FMEA', mandatory: false,
    what: 'Design Failure Mode & Effects Analysis — identifies potential design failures, effects, causes, and risk mitigation actions.',
    how: 'Customer provides DFMEA or supplier prepares if responsible for design. Use AIAG-VDA 2019 format (7-step). Link to PFMEA.',
    common: 'DFMEA not linked to Control Plan, outdated DFMEA submitted, High AP items not actioned.',
    tip: 'If you are not the design owner, request DFMEA from customer. Review for High AP items before submission.' },
  { no: '5', name: 'Process Flow Diagram', icon: '🔄', clause: 'AIAG PPAP 4th Ed. Section 2.5 / AIAG APQP', mandatory: true,
    what: 'Visual map of the complete manufacturing process — from incoming raw material to final dispatch. Shows every operation, inspection, and sub-process.',
    how: 'Create using standard AIAG symbols. Include incoming → receiving inspection → each operation → final inspection → packing → dispatch. Must match PFMEA and Control Plan exactly.',
    common: 'PFD does not match Control Plan operations. Missing incoming or outgoing steps. Incorrect AIAG symbols.',
    tip: 'The PFD, PFMEA, and Control Plan must be a "family of documents" — every operation in PFD must appear in both PFMEA and Control Plan.' },
  { no: '6', name: 'PFMEA', icon: '🔬', clause: 'AIAG PPAP 4th Ed. Section 2.6 / AIAG-VDA FMEA 2019', mandatory: true,
    what: 'Process Failure Mode & Effects Analysis — identifies risks in the manufacturing process, assigns Severity / Occurrence / Detection, calculates Action Priority (AP).',
    how: '7-Step AIAG-VDA approach. Structure → Function → Failure → Risk → Optimisation → Results. AP = High/Medium/Low replaces RPN. Focus prevention over detection.',
    common: 'RPN used instead of AP (old format). Detection controls rated too optimistically. High AP items not closed before PPAP.',
    tip: 'All High AP items must be resolved before PPAP submission. Interim approvals are possible but must be tracked.' },
  { no: '7', name: 'Control Plan', icon: '🗂️', clause: 'AIAG PPAP 4th Ed. Section 2.7 / IATF 8.5.1', mandatory: true,
    what: 'Document defining how every special and important characteristic is controlled during production — what is checked, how often, by whom, and what to do if out of control.',
    how: 'Cover all three types: Prototype CP, Pre-Launch CP, Production CP. Link every characteristic to PFMEA. Include reaction plan for every characteristic.',
    common: 'Missing reaction plan column. No linkage to PFMEA. Control Plan not updated when process changes. Missing special characteristics symbol.',
    tip: 'The Control Plan is your manufacturing bible. It must be a living document — updated with every 4M change.' },
  { no: '8', name: 'MSA Study', icon: '📏', clause: 'AIAG MSA 4th Ed. / IATF 7.1.5', mandatory: true,
    what: 'Measurement System Analysis — proves your gauges and measuring instruments are acceptable for measuring the characteristics defined in the Control Plan.',
    how: 'GRR study: 10 parts × 3 appraisers × 2 trials = 60 readings. Blind study. %GRR < 10% = Acceptable. 10–30% = Conditional. > 30% = Unacceptable. Also run Bias, Linearity, Stability.',
    common: '%GRR > 30% submitted without corrective action. MSA not done for all gauges in Control Plan. Non-blind study.',
    tip: 'Do MSA before SPC. A bad gauge will give bad SPC data. Fix measurement first, then measure the process.' },
  { no: '9', name: 'Dimensional Results', icon: '📊', clause: 'AIAG PPAP 4th Ed. Section 2.9', mandatory: true,
    what: 'Dimensional measurement results for all characteristics on the ballooned drawing. Minimum 6 parts measured (or as specified by customer).',
    how: 'Measure minimum 6 parts from initial production run. Use balloon number from drawing. Report actual values, specification, and pass/fail. Use PPAP Dimensional Report format.',
    common: 'Only checking key dimensions, not all ballooned characteristics. Wrong sample size. Mixing prototype and production samples.',
    tip: 'All balloons = all measurements. No exceptions. Use CMM where possible for accuracy and traceability.' },
  { no: '10', name: 'Material Test Results', icon: '🧪', clause: 'AIAG PPAP 4th Ed. Section 2.10', mandatory: false,
    what: 'Material certification and test reports — chemical composition, mechanical properties, hardness, tensile strength — proving material meets the specification on the drawing.',
    how: 'Obtain material test certificate from supplier (heat certificate). If material testing is required by drawing, get test report from approved lab. Archive for full batch traceability.',
    common: 'Generic material certificate not specific to the batch. Material spec on drawing not matched to certificate.',
    tip: 'Full traceability: heat number on certificate must match heat number on material used for PPAP samples.' },
  { no: '11', name: 'Performance Test Results', icon: '🏁', clause: 'AIAG PPAP 4th Ed. Section 2.11', mandatory: false,
    what: 'Functional, performance, durability, and reliability test results proving the part meets customer performance specifications (not just dimensional).',
    how: 'Run all tests defined in drawing notes and customer engineering spec. Include test reports from customer DV/PV or internal tests. Get customer sign-off on test plan.',
    common: 'Performance tests done only at prototype stage, not with production tooling. Missing corrosion, fatigue, or thermal test results.',
    tip: 'Performance tests with production tooling and production process — not prototype. Results from wrong tooling are invalid.' },
  { no: '12', name: 'Qualified Lab Documentation', icon: '🏛️', clause: 'AIAG PPAP 4th Ed. Section 2.12 / IATF 7.1.5', mandatory: false,
    what: 'Accreditation certificate of the laboratory used for testing — NABL, A2LA, or equivalent national accreditation. Proves the lab is qualified to run the tests.',
    how: 'Use NABL-accredited labs for critical tests. Attach accreditation certificate with test report. Internal lab: include scope, calibration records, and competency evidence.',
    common: 'Using unaccredited labs. Expired accreditation certificate. Lab scope does not cover the tests performed.',
    tip: 'NABL accreditation certificate is mandatory for regulatory or safety-related tests. Check expiry before every submission.' },
  { no: '13', name: 'Appearance Approval Report', icon: '🎨', clause: 'AIAG PPAP 4th Ed. Section 2.13', mandatory: false,
    what: 'Customer-signed Appearance Approval Report (AAR) for visible surface parts — colour, texture, gloss, grain, and appearance quality.',
    how: 'Send master samples to customer styling/design team. Customer signs AAR. Keep one signed master sample at supplier, one at customer. Only for appearance-critical parts.',
    common: 'AAR signed by wrong customer contact (engineering instead of styling). No master sample retained.',
    tip: 'AAR must be signed by customer Appearance/Styling department — not just any engineer. The master sample is your legal reference.' },
  { no: '14', name: 'Sample Parts', icon: '📦', clause: 'AIAG PPAP 4th Ed. Section 2.14', mandatory: true,
    what: 'Physical production samples submitted with the PPAP package — made with production tooling, production process, production material, at production facility.',
    how: 'Number and label each sample. Tag with part number, revision, date, PPAP submission number. Submit quantity as specified by customer (typically 3–5 parts).',
    common: 'Prototype or handmade samples submitted instead of production-tooled parts. Samples not from the same run as dimensional results.',
    tip: 'Golden rule: PPAP samples must be made exactly as you will make them in production. Every deviation invalidates the PPAP.' },
  { no: '15', name: 'Master Sample', icon: '🌟', clause: 'AIAG PPAP 4th Ed. Section 2.15', mandatory: true,
    what: 'One signed and sealed production sample retained at the supplier as the visual/dimensional standard for ongoing production quality comparison.',
    how: 'Label clearly: "PPAP Master Sample — Part No. — Rev — Date — Customer — Approved by". Store in controlled area. Reference in Control Plan for visual comparison.',
    common: 'Master sample not stored properly, damaged, or missing. Not referenced in Control Plan. No retention period defined.',
    tip: 'Master sample is your production standard. Operators must compare production parts against it. Retain until superseded by next approved PPAP.' },
  { no: '16', name: 'Checking Aids', icon: '🔧', clause: 'AIAG PPAP 4th Ed. Section 2.16', mandatory: false,
    what: 'Dedicated fixtures, gauges, go/no-go gauges, and checking aids designed specifically to inspect this part. Include calibration records.',
    how: 'List all part-specific gauges. Include calibration certificates. Show gauge number and correlation to Control Plan characteristics.',
    common: 'Checking aids not calibrated. Gauge not correlated to drawing characteristic. Missing calibration records.',
    tip: 'Every checking aid must be calibrated and listed in the Control Plan. If it checks a critical characteristic, it needs an MSA study.' },
  { no: '17', name: 'Customer-Specific Requirements', icon: '🚗', clause: 'Customer CSR / IATF 16949', mandatory: true,
    what: 'Each customer has specific requirements beyond AIAG PPAP. TML, MSIL, Honda, Bajaj, Toyota — all have CSRs defining additional elements, formats, and approval workflows.',
    how: 'Download latest CSR from customer portal. Review before every PPAP. TML: TQMS portal. MSIL: Supplier portal. Always check for CSR updates before major launches.',
    common: 'Ignoring CSR requirements. Using wrong submission portal. Missing customer-specific forms (TML TSE, MSIL QCPC etc.).',
    tip: 'CSR overrides AIAG standard. When CSR says Level 3 but AIAG says Level 2, CSR wins. Always.' },
  { no: '18', name: 'Part Submission Warrant (PSW)', icon: '📋', clause: 'AIAG PPAP 4th Ed. Section 2.18', mandatory: true,
    what: 'The official summary document for the PPAP submission — signed by supplier Quality Head and Plant Head, declaring all elements are complete and the part is ready for production.',
    how: 'Complete all fields: part number, revision, reason for submission, run quantities, declaration. Sign and date. Customer countersigns to approve. File original; keep copy.',
    common: 'Signed by wrong authority (QA engineer instead of QH + Plant Head). Missing run-at-rate data. Wrong submission reason selected.',
    tip: 'PSW must be signed by Quality Head AND Plant Head minimum. This is a declaration that the part meets all requirements. Do not sign until you are 100% confident.' },
];

const STATUSES = [
  { s: 'Approved (Full)', color: 'bg-green-100 text-green-800 border-green-300', desc: 'All 18 elements reviewed and accepted. Full production approved.' },
  { s: 'Interim Approval', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', desc: 'Conditional approval — specific open items must be closed by agreed date. Production runs allowed with customer permission.' },
  { s: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300', desc: 'One or more critical elements failed. Supplier must correct and resubmit. No production approval.' },
];

export default function PPAPPage() {
  const [tab, setTab] = useState<'overview'|'elements'|'levels'|'checklist'>('overview');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const toggle = (no: string) => setExpanded(e => e === no ? null : no);
  const checkCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-cyan-950 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">📦 PPAP — Production Part Approval Process</h1>
            <p className="text-cyan-300 mt-1 text-sm">AIAG PPAP 4th Edition · IATF 16949 Cl. 8.3.4 · Customer Specific Requirements</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['AIAG PPAP 4th Ed.','IATF 8.3.4','Customer CSR'].map(s => (
              <span key={s} className="px-3 py-1 bg-cyan-800 text-cyan-200 rounded-full text-xs font-semibold">{s}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { n:'18', label:'PPAP Elements' },
            { n:'5', label:'Submission Levels' },
            { n:'3', label:'PSW Statuses' },
            { n:'Cl. 8.3.4', label:'IATF Clause' },
          ].map((s,i) => (
            <div key={i} className="bg-cyan-900/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{s.n}</p>
              <p className="text-cyan-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([['overview','📋 Overview'],['elements','🔢 18 Elements'],['levels','📊 Submission Levels'],['checklist','✅ PPAP Checklist']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === id ? 'bg-white shadow text-cyan-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">What is PPAP?</h2>
            <p className="text-gray-600 leading-relaxed">
              PPAP (Production Part Approval Process) is the formal process used in the automotive supply chain to ensure a supplier can consistently produce a part meeting all customer design and specification requirements before full production begins.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Think of PPAP as the supplier's <strong>proof of capability</strong> — it answers the question: <em>"Have you proven you can make this part exactly as required, every time, at full production speed?"</em>
            </p>
            <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-sm text-cyan-800">
              💡 <strong>Simple rule:</strong> No approved PPAP = No production shipment to customer. PPAP approval is mandatory before first shipment for any new part or changed part.
            </div>
          </div>

          {/* PPAP Trigger Events */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">When is PPAP Required? (Trigger Events)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon:'🆕', title:'New part / new program', desc:'Any completely new part being supplied to a customer for the first time.' },
                { icon:'🔧', title:'Engineering change', desc:'Change to part design, material, specification, or customer drawing revision.' },
                { icon:'🏭', title:'New production location', desc:'Moving production to a different plant, even within the same company.' },
                { icon:'⚙️', title:'New or changed tooling', desc:'New mould, die, fixture, or tool — or significant repair/refurbishment.' },
                { icon:'🔄', title:'New or changed process', desc:'Change in manufacturing method, sequence, machine, or sub-supplier.' },
                { icon:'💤', title:'Production gap > 12 months', desc:'Part not produced for 12+ months — process must be re-validated.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PSW Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">PSW Approval Status</h2>
            <div className="space-y-3">
              {STATUSES.map((s,i) => (
                <div key={i} className={`p-3 rounded-lg border ${s.color}`}>
                  <p className="font-bold text-sm">{s.s}</p>
                  <p className="text-xs mt-0.5 opacity-80">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PPAP Flow */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">PPAP Process Flow</h2>
            <div className="flex flex-col md:flex-row items-stretch gap-2">
              {[
                { step:'1', title:'Trigger', desc:'New part / change event occurs' },
                { step:'2', title:'APQP', desc:'Run APQP — PFMEA, Control Plan, MSA' },
                { step:'3', title:'Run-at-Rate', desc:'Production trial at production rate' },
                { step:'4', title:'Collect Data', desc:'Dimensions, material, performance tests' },
                { step:'5', title:'Compile Package', desc:'Assemble all 18 elements' },
                { step:'6', title:'Sign PSW', desc:'QH + Plant Head sign and submit' },
                { step:'7', title:'Customer Review', desc:'Customer approves / requests corrections' },
                { step:'8', title:'Approved', desc:'Production can start / continue' },
              ].map((s, i) => (
                <div key={i} className="flex-1 bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
                  <div className="w-7 h-7 bg-cyan-700 text-white rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
                  <p className="font-semibold text-cyan-900 text-xs">{s.title}</p>
                  <p className="text-cyan-700 text-xs mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Elements Tab */}
      {tab === 'elements' && (
        <div className="space-y-3">
          <p className="text-gray-500 text-sm">Click any element to expand full guidance — what it is, how to prepare it, common mistakes, and expert tips.</p>
          {ELEMENTS.map((el) => (
            <div key={el.no} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggle(el.no)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
              >
                <div className="w-9 h-9 bg-cyan-700 text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">{el.no}</div>
                <span className="text-xl flex-shrink-0">{el.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{el.name}</p>
                  <p className="text-xs text-gray-400">{el.clause}</p>
                </div>
                <div className="flex items-center gap-2">
                  {el.mandatory && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Mandatory</span>}
                  <span className="text-gray-400 text-lg">{expanded === el.no ? '▲' : '▼'}</span>
                </div>
              </button>
              {expanded === el.no && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">What is it?</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{el.what}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">How to prepare</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{el.how}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">⚠️ Common Mistakes</p>
                    <p className="text-sm text-red-700">{el.common}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">💡 Expert Tip</p>
                    <p className="text-sm text-green-800">{el.tip}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Levels Tab */}
      {tab === 'levels' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            ⚠️ <strong>Customer decides the level.</strong> The customer specifies which submission level is required for each part. The supplier cannot choose the level on their own.
          </div>
          <div className="space-y-3">
            {LEVELS.map((l, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-700 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{i+1}</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{l.level} — {l.label}</p>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{l.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-semibold">When used:</span>
                      <span className="px-2 py-0.5 bg-cyan-50 border border-cyan-200 rounded text-xs text-cyan-800">{l.use}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-950 rounded-xl p-5 text-white">
            <p className="font-bold mb-2">📌 Level 3 is the automotive standard</p>
            <p className="text-blue-300 text-sm">Most Indian OEMs (TML, MSIL, Honda, Bajaj, Toyota) require Level 3 for production parts. Always confirm with customer CSR. When in doubt, prepare Level 3.</p>
          </div>
        </div>
      )}

      {/* Checklist Tab */}
      {tab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div>
              <p className="font-bold text-gray-800">PPAP Submission Readiness Checklist</p>
              <p className="text-gray-500 text-sm">Check off each element as you prepare it. Do not submit until all mandatory items are complete.</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-cyan-700">{checkCount}/{ELEMENTS.length}</p>
              <p className="text-xs text-gray-400">Elements ready</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-cyan-600 h-2 rounded-full transition-all" style={{width:`${(checkCount/ELEMENTS.length)*100}%`}} />
          </div>
          <div className="space-y-2">
            {ELEMENTS.map(el => (
              <label key={el.no} className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition ${checklist[el.no] ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-cyan-300'}`}>
                <input type="checkbox" checked={!!checklist[el.no]} onChange={e => setChecklist(prev => ({...prev, [el.no]: e.target.checked}))} className="w-5 h-5 accent-cyan-700 rounded" />
                <span className="w-7 h-7 bg-cyan-700 text-white rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">{el.no}</span>
                <span className="text-lg flex-shrink-0">{el.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${checklist[el.no] ? 'line-through text-gray-400' : 'text-gray-800'}`}>{el.name}</p>
                </div>
                {el.mandatory && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex-shrink-0">Mandatory</span>}
                {checklist[el.no] && <span className="text-green-600 font-bold flex-shrink-0">✓</span>}
              </label>
            ))}
          </div>
          {checkCount === ELEMENTS.length && (
            <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="font-bold text-green-800">All 18 elements complete! Ready for submission.</p>
              <p className="text-green-600 text-sm mt-1">Sign the PSW (Element 18) and submit to customer.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
