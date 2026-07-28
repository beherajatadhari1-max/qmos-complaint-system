'use client';
import React, { useState } from 'react';

// ─── VERTICAL NAV TABS ─────────────────────────────────────────────────────────
const VTABS = [
  { id: 'overview',           icon: '📋', label: 'All Topics Overview' },
  { id: 'iatf',               icon: '📘', label: 'IATF 16949' },
  { id: 'core-tools',         icon: '🔧', label: 'Core Tools' },
  { id: 'problem-solving',    icon: '🛠️', label: 'Problem Solving' },
  { id: 'quality-kpis',       icon: '📊', label: 'Quality KPIs' },
  { id: 'customer-standards', icon: '🚗', label: 'Customer Standards' },
  { id: 'interview',          icon: '💼', label: 'Interview Master' },
  { id: 'flashcards',         icon: '⚡', label: 'Flashcards' },
  { id: 'glossary',           icon: '📖', label: 'Glossary' },
];

// ─── IATF DATA ─────────────────────────────────────────────────────────────────
const IATF_CLAUSES = [
  { no: 'Cl. 4', title: 'Context of Organisation', body: 'Understand internal/external issues (SWOT, PESTLE), interested parties, QMS scope. Example: Seat manufacturer scope = "Design, manufacture and supply of automotive seating." Scope must be documented and available to interested parties.' },
  { no: 'Cl. 5', title: 'Leadership', body: 'Top management commitment, quality policy, organisational roles. Policy must include: customer focus, continual improvement, regulatory compliance. QH as MR must ensure policy is communicated and understood at all levels.' },
  { no: 'Cl. 6', title: 'Planning', body: 'Risk & Opportunity identification (SWOT/FMEA approach), SMART quality objectives, planning of changes. Objectives: Customer PPM < 50, OTIF > 98%, Internal PPM < 500. Review in Management Review.' },
  { no: 'Cl. 7', title: 'Support', body: 'Resources (people, infra, environment), competency (skill matrix), awareness, communication, documented information. All records must be version-controlled. Calibration, training, maintenance records are most audited.' },
  { no: 'Cl. 8', title: 'Operation', body: 'Largest clause. APQP, PPAP, production control, special characteristics, MSA, SPC, control plans, CSR, nonconforming product, warranty. Every process needs a control plan. Special characteristics = Cpk > 1.67 OR 100% inspection.' },
  { no: 'Cl. 9', title: 'Performance Evaluation', body: 'Monitoring & measurement, customer satisfaction (9.1.2), internal audit (9.2), management review (9.3). Audit must cover all processes and all shifts. MR inputs: KPIs, complaints, audit results, CAPA status, risk register.' },
  { no: 'Cl. 10', title: 'Improvement', body: 'Nonconformity & CAPA (10.2), continual improvement (10.3). Every NC: root cause → containment → permanent CA → effectiveness verification. CI sources: audit NCs, complaints, KPI trends, kaizen.' },
];

// ─── CORE TOOLS DATA ───────────────────────────────────────────────────────────
const CORE_TOOLS = [
  { tool: 'APQP', title: 'Advanced Product Quality Planning', body: '5 Phases: Plan & Define → Product Design → Process Design → Validation → Feedback & CA. Key outputs per phase: DFMEA, PFMEA, Control Plan, MSA plan, SPC study, PPAP package. Gate review at each phase with QH sign-off. Starts at RFQ, ends at PPAP approval.' },
  { tool: 'PPAP', title: 'Production Part Approval Process', body: '18 elements: Design Records, DFMEA, Process Flow, PFMEA, Control Plan, MSA, Dimensional Results, Material Tests, Initial SPC Study, Qualified Lab, Appearance Approval, Sample Parts, Master Sample, Checking Aids, Customer-Specific, PSW + more. Level 3 most common. PSW signed by Plant Head + QH.' },
  { tool: 'PFMEA', title: 'Process FMEA — AIAG-VDA 2019', body: '7-Step approach: Scope → Structure Analysis → Function Analysis → Failure Analysis → Risk Analysis (S×O×D → AP) → Optimization → Results. AP = H/M/L replaces RPN. Prevention controls weighted more than detection. Boundary diagram and P-diagram required inputs. Update for all 4M changes.' },
  { tool: 'MSA', title: 'Measurement System Analysis', body: 'Gauge R&R (Variable): %GRR < 10% = Acceptable, 10–30% = Conditional, > 30% = Unacceptable. Study: 10 parts × 3 appraisers × 2 replicates = 60 readings. Blind study. Attribute MSA: Kappa > 0.75. Conduct MSA before SPC. Required for all gauges on special characteristics.' },
  { tool: 'SPC', title: 'Statistical Process Control', body: 'Charts: X-bar R (n=2–10, most common), I-MR (n=1), X-bar S (n>10). Cpk > 1.67 for special char, > 1.33 for normal. Out-of-control: 1 point beyond ±3σ; 7 consecutive on one side; 6 trending. Operators plot and react in real time. Chart must be at machine.' },
];

// ─── PROBLEM SOLVING DATA ──────────────────────────────────────────────────────
const PROBLEM_TOOLS = [
  { tool: '8D', title: '8 Disciplines Problem Solving', body: 'D0: Symptoms. D1: Team (cross-functional). D2: Problem description (5W2H). D3: Containment within 24 hrs. D4: Root cause (5-Why + Fishbone). D5: Permanent corrective action. D6: Implement & verify (60–90 days). D7: Prevent recurrence (update PFMEA/CP/SOP). D8: Congratulate team. Full 8D to customer within 30 days.' },
  { tool: '5-Why', title: '5-Why Analysis', body: 'Ask "Why?" 5 times to reach true root cause. Example: Defect → Why? Wrong setting → Why? Not in SOP → Why? SOP not updated → Why? No ECN-to-SOP review process → Why? No procedure defined. Root cause = No procedure for ECN-triggered SOP review. Confirm with data before CAPA.' },
  { tool: 'Fishbone', title: 'Fishbone / Ishikawa Diagram', body: '4M + 1E: Man, Machine, Material, Method, Environment. Used in D4 of 8D. Each branch explores potential causes. Combine with 5-Why to drill each branch. Never close 8D without confirming root cause with data from gemba.' },
  { tool: 'Pareto', title: 'Pareto Analysis — 80/20 Rule', body: 'Plot defect categories by frequency. 80% defects from 20% causes. Focus CAPA on top 2–3 bars first. Example: Stitching 45%, Foam crush 30%, Assembly gap 15% → Stitching is priority. Update Pareto monthly to track improvement trend.' },
  { tool: 'PDCA', title: 'PDCA / A3 Thinking', body: 'Plan: Understand problem, set target. Do: Pilot countermeasure. Check: Verify results vs target. Act: Standardise if effective, iterate if not. A3 format = entire PDCA on one A3 sheet. Used for kaizen and improvement projects. Yokoten: deploy success to all similar processes.' },
];

// ─── KPI DATA ──────────────────────────────────────────────────────────────────
const KPIS = [
  { kpi: 'Customer PPM', formula: '(Rejected Qty / Shipped Qty) × 1,000,000', target: '< 50 PPM', body: 'Track monthly per customer. Pareto top defects. CAPA for repeat failures. High PPM triggers customer audit or Q1/Q2 status review. Improve by: Pareto + targeted CAPA + Poka Yoke at source.' },
  { kpi: 'Internal Rejection PPM', formula: '(Internal Rejects / Total Production) × 1,000,000', target: '< 500–1000 PPM', body: 'Track by defect code, station, shift. Drive CAPA for top 3 monthly defects. Scrap cost reported to management. Reward operators who catch defects early at their station.' },
  { kpi: 'Cpk', formula: 'min[(USL − X̄)/3σ, (X̄ − LSL)/3σ]', target: '> 1.67 (special) / > 1.33 (normal)', body: 'Cpk accounts for off-centering. Review monthly for all critical dimensions. Cpk < 1.0 = process incapable → 100% inspection + immediate CAPA. Cp ignores centering — always report Cpk.' },
  { kpi: 'OEE', formula: 'Availability × Performance × Quality', target: '> 85% (world class)', body: 'Availability = Run time / Planned time. Performance = Actual / Theoretical output. Quality = Good parts / Total. Low OEE → investigate losses: breakdowns (TPM), speed loss, defects. Track daily per machine.' },
  { kpi: 'OTIF', formula: '(Orders on time & in full / Total orders) × 100', target: '> 98%', body: 'Poor OTIF → customer downtime → premium freight → financial penalty. Root causes: quality holds, machine breakdown, material shortage. Measure and report weekly.' },
  { kpi: 'CoPQ', formula: 'Internal failure + External failure + Appraisal + Prevention costs', target: 'Reduce YoY', body: 'Internal: scrap, rework. External: warranty, returns, premium freight. Appraisal: inspection. Prevention: training, FMEA, Poka Yoke. Reducing CoPQ = direct profit improvement. Present in management review as ₹ value.' },
];

// ─── CUSTOMER STANDARDS DATA ───────────────────────────────────────────────────
const CUSTOMER_STANDARDS = [
  {
    customer: 'TML — Tata Motors Ltd', icon: '🚗',
    color: 'bg-blue-50 border-blue-200', hdr: 'bg-blue-800',
    items: [
      { title: 'PRR — Problem Resolution Report', body: 'D1–D3 containment within 24 hrs via TML supplier portal. Full 8D within 30 working days. Closure requires customer approval. Repeat PRR = escalation to SQA.' },
      { title: '4M Change Notification', body: 'Any change in Man, Machine, Material, Method must be reported before implementation. Upload on TML portal with photos, test results, PFMEA/CP impact. Customer approval required before shipping.' },
      { title: 'PDI Upload — Daily', body: 'Upload PDI results to TML portal daily before dispatch cut-off. 100% PDI mandatory. Any PDI failure must be escalated before dispatch — no concession without written approval.' },
      { title: 'OVR Data — Monthly', body: 'Out-Vehicle Rejection data submitted monthly. Calculate OVR PPM. Submit before deadline. TML reviews OVR trend in monthly SQR meeting.' },
      { title: 'PPAP & TAC', body: 'Level per PO. PSW signed by Plant Head and QH. TAC must be valid at PPAP submission. All 18 elements complete.' },
      { title: 'Q-Rating / Controlled Shipping', body: 'CS1 = extra inspection at supplier. CS2 = third-party sorting at gate. Exit: 3 months zero rejection + management approval.' },
    ],
  },
  {
    customer: 'TMBSL — Tata Motors Bus & Specialty Vehicles', icon: '🚌',
    color: 'bg-teal-50 border-teal-200', hdr: 'bg-teal-800',
    items: [
      { title: 'DSL — Defect Status List', body: 'Submit DSL closure monthly in TMBSL format. Each item: RCA + CAPA + evidence. Overdue items escalated in monthly SQM.' },
      { title: 'OVR Data', body: 'Monthly OVR submission in TMBSL format. Include: defect, qty, RCA, CAPA status. Submit before 5th of each month.' },
      { title: 'Supplier Quality Meeting (SQM)', body: 'Monthly meeting with TMBSL SQA. Present: PPM trend, open concerns, CAPA status, DSL closure. QH must attend.' },
    ],
  },
  {
    customer: 'Maruti Suzuki', icon: '🏎️',
    color: 'bg-green-50 border-green-200', hdr: 'bg-green-800',
    items: [
      { title: 'Concern Sheet (CS)', body: '3–5 days interim response, 30 days full 8D. CS closure requires MSI QA approval. Repeat CS = escalation.' },
      { title: 'SQ Standard / VDA 6.3 Audit', body: 'VDA 6.3-based process audit. Score < 80% = action plan. Score < 60% = supply hold risk. Prepare: updated PFMEA, CP, SOP, MSA, SPC at each station.' },
      { title: 'New Model APQP — IMPACT', body: 'Submit phase gate outputs via IMPACT tool on time. Key milestones: SOR, DFMEA, PFMEA, CP, Gauge approval, Trial runs, PPAP.' },
    ],
  },
  {
    customer: 'Toyota / TNGA', icon: '🏁',
    color: 'bg-red-50 border-red-200', hdr: 'bg-red-800',
    items: [
      { title: 'DRBFM', body: 'Mandatory for any design or process change. What changed? → What could go wrong? → Worst effect? → Countermeasure? Review in CFT meeting before implementing.' },
      { title: 'Pokayoke Audit', body: 'Daily/shift-wise poka-yoke audit. Intentionally insert defects to verify detection. Failed poka-yoke = line stop until fixed.' },
      { title: 'Toyota CSR', body: 'Detailed CSR at iatfglobaloversight.org. Strict traceability, 4M approval before change, No-name No-number defect reporting. Review quarterly.' },
    ],
  },
];

// ─── INTERVIEW DATA ────────────────────────────────────────────────────────────
const INTERVIEW_QA: Record<string, { q: string; a: string }[]> = {
  'Quality Head': [
    { q: 'How do you handle a critical customer complaint?', a: 'Immediately form cross-functional team. D3 containment within 24 hrs — stop suspect stock. Hold shipment if needed. Initiate 8D. Send interim response within 24 hrs, full 8D within 30 days. Report to management.' },
    { q: 'What is your approach to reducing customer PPM?', a: 'Pareto top defects → PFMEA review → containment at process → RCA (5-Why + Fishbone) → CAPA → CP/SOP update → monitor 3 months.' },
    { q: 'What is CSR and how do you manage it?', a: 'Customer Specific Requirements — beyond IATF 16949. Maintain register, review quarterly from IATF database, deploy to PPAP/CP/SOP, audit compliance in internal audits.' },
    { q: 'How do you prepare for IATF external audit?', a: 'Pre-audit: previous NC closure, KPI review, mock audit 4–6 weeks before, gap analysis, update all records. During: escort auditor, provide records promptly, never guess. Post: close NCs within agreed timeline.' },
    { q: 'Difference between CAPA and Correction?', a: 'Correction = fix the current NC (rework/scrap). Corrective Action = eliminate root cause to prevent recurrence. Both required per IATF Cl. 10.2. Verify effectiveness with data.' },
  ],
  'PFMEA & Control Plan': [
    { q: 'What changed in AIAG-VDA PFMEA 2019?', a: '7-step approach. AP (H/M/L) replaces RPN. Prevention weighted more than detection. Steps: Scope → Structure → Function → Failure → Risk → Optimize → Document. Boundary diagram and P-diagram required.' },
    { q: 'How do you determine Severity rating?', a: 'S 9–10: Safety/regulatory. S 7–8: Vehicle inoperable. S 5–6: Customer uncomfortable. S 3–4: Minor defect noticed. S 1–2: Not noticed. Severity on EFFECT, not defect. Cannot be reduced by detection controls.' },
    { q: 'What is a special characteristic?', a: 'Parameter affecting safety/function. Marked triangle/diamond in Drawing, PFMEA, CP. Requires Cpk > 1.67 OR 100% inspection. Cannot waive without written customer approval.' },
    { q: 'Link between PFMEA and Control Plan?', a: 'PFMEA identifies failure modes and proposes controls. CP formalizes: process step, characteristic, control method, sample plan, reaction plan. High-AP PFMEA items must appear in CP. Review together for every 4M change.' },
  ],
  'MSA & Gauge R&R': [
    { q: 'What is Gauge R&R?', a: 'Repeatability = same gauge/appraiser. Reproducibility = between appraisers. %GRR < 10% = Acceptable, 10–30% = Conditional, > 30% = Unacceptable. Blind study. Must be < 10% for special characteristics.' },
    { q: 'Study setup for Gauge R&R?', a: '10 parts × 3 appraisers × 2 replicates = 60 measurements. Parts span full process variation. Appraisers = actual production operators. Use ANOVA or Average & Range method.' },
    { q: 'What is Attribute MSA?', a: 'For pass/fail gauges. 30 parts × 3 appraisers × 2 readings. Kappa > 0.75 = Acceptable. Compare each appraiser to reference standard. Used for Go/No-Go, visual inspection, leak testers.' },
  ],
  'SPC & Capability': [
    { q: 'Difference between Cp and Cpk?', a: 'Cp = (USL−LSL)/6σ — spread vs tolerance, ignores centering. Cpk accounts for off-centering. Always report Cpk. Target > 1.67 for special char, > 1.33 for normal.' },
    { q: 'Western Electric out-of-control rules?', a: '1 point beyond ±3σ; 7 consecutive on same side; 6 consecutive trending up/down; 2 of 3 beyond ±2σ. React immediately: stop, investigate, document.' },
    { q: 'I-MR vs X-bar R chart?', a: 'I-MR: n=1 (daily pH, shift-end measurement). X-bar R: n=2–10 (most shop floor SPC). X-bar S: n>10. Chart must be at machine — operators plot and react in real time.' },
  ],
  '8D & Problem Solving': [
    { q: 'Walk me through an 8D you led.', a: 'D1: CFT — QE, production, supplier. D2: 45 seats — stitching gap > 5mm. D3: Stopped shipment, 100% inspection, replacement in 48 hrs. D4: Clamp pressure not in SOP + skill gap. D5: SOP updated, operators re-trained. D6: 30-day monitoring, zero recurrence. D7: PFMEA + CP updated. D8: Team recognized.' },
    { q: 'How do you verify CAPA effectiveness?', a: 'Define metric (PPM = 0 for 3 months). Collect data 60–90 days post-implementation. Compare before vs after. Go to gemba. If effective: update PFMEA/CP/SOP permanently. If not: reopen 8D.' },
  ],
};

// ─── FLASHCARDS ────────────────────────────────────────────────────────────────
const FLASHCARDS = [
  { q: 'IATF clause for Control Plan?', a: 'Clause 8.5.1.1' },
  { q: 'Gauge R&R acceptable threshold?', a: '< 10% Acceptable | 10–30% Conditional | > 30% Unacceptable' },
  { q: 'Cpk target — special characteristics?', a: '> 1.67 (IATF). > 1.33 normal.' },
  { q: 'PPAP elements count?', a: '18 elements. Level 3 most common.' },
  { q: 'AP in AIAG-VDA 2019?', a: 'Action Priority — H, M, L. Replaces RPN.' },
  { q: 'Customer PPM formula?', a: '(Rejected Qty / Shipped Qty) × 1,000,000' },
  { q: 'D3 in 8D — time limit?', a: 'Containment within 24 hours.' },
  { q: 'IATF clause for Customer Satisfaction?', a: 'Clause 9.1.2' },
  { q: 'OEE formula + world-class target?', a: 'Availability × Performance × Quality = 85%' },
  { q: 'What is Yokoten?', a: 'Horizontal deployment of a successful improvement to similar processes.' },
  { q: 'IATF clause for CAPA?', a: 'Clause 10.2' },
  { q: 'Chart for n=1 measurements?', a: 'I-MR (Individuals – Moving Range)' },
  { q: 'IATF clause for Management Review?', a: 'Clause 9.3' },
  { q: 'Poka Yoke definition?', a: 'Error proofing — prevents or immediately detects defects.' },
  { q: 'OTIF target?', a: '> 98% On Time In Full' },
  { q: 'APQP phases count?', a: '5: Plan → Product Design → Process Design → Validation → Feedback' },
  { q: 'Kappa target for Attribute MSA?', a: 'Kappa > 0.75' },
  { q: 'IATF clause for Internal Audit?', a: 'Clause 9.2 — all processes, all shifts' },
  { q: 'Cp vs Cpk key difference?', a: 'Cp ignores centering. Cpk accounts for off-centering. Always use Cpk.' },
  { q: 'PSW in PPAP?', a: 'Part Submission Warrant — final sign-off by supplier and customer.' },
];

// ─── GLOSSARY ──────────────────────────────────────────────────────────────────
const GLOSSARY = [
  { term: 'APQP', def: 'Advanced Product Quality Planning — 5-phase new product development process.' },
  { term: 'PPAP', def: 'Production Part Approval Process — 18-element package proving process meets requirements.' },
  { term: 'PFMEA', def: 'Process Failure Mode & Effects Analysis — proactive risk assessment.' },
  { term: 'MSA', def: 'Measurement System Analysis — quantifies measurement variation.' },
  { term: 'SPC', def: 'Statistical Process Control — control charts for real-time process monitoring.' },
  { term: 'Cpk', def: 'Process Capability Index — fits specification accounting for centering.' },
  { term: 'PPM', def: 'Parts Per Million — (Defects / Total) × 1,000,000.' },
  { term: 'OEE', def: 'Overall Equipment Effectiveness = Availability × Performance × Quality.' },
  { term: 'CAPA', def: 'Corrective & Preventive Action — eliminate root cause, prevent recurrence.' },
  { term: 'CSR', def: 'Customer Specific Requirements — beyond IATF 16949.' },
  { term: 'PSW', def: 'Part Submission Warrant — final PPAP sign-off.' },
  { term: 'NC / NCR', def: 'Nonconformity Report — record of failure to meet a requirement.' },
  { term: 'OTIF', def: 'On Time In Full — delivery metric. Target > 98%.' },
  { term: 'PRR', def: 'Problem Resolution Report — TML complaint format requiring 8D.' },
  { term: 'TAC', def: 'Type Approval Certificate — government certification for vehicle components.' },
  { term: 'Poka Yoke', def: 'Error proofing — prevents or detects defects immediately.' },
  { term: 'AP', def: 'Action Priority (AIAG-VDA 2019) — H/M/L, replaces RPN.' },
  { term: 'Gauge R&R', def: 'Repeatability & Reproducibility — measurement system variation study.' },
  { term: 'CoPQ', def: 'Cost of Poor Quality — scrap + rework + warranty + inspection.' },
  { term: 'Kaizen', def: 'Continuous improvement — small daily improvements by everyone.' },
  { term: 'Yokoten', def: 'Horizontal deployment — apply success to all similar processes.' },
  { term: 'PDCA', def: 'Plan-Do-Check-Act — Deming improvement cycle.' },
  { term: 'LPA', def: 'Layered Process Audit — multi-level process adherence verification.' },
  { term: 'DRBFM', def: 'Design Review Based on Failure Mode — Toyota change management tool.' },
];

// ─── HELPER COMPONENTS ─────────────────────────────────────────────────────────
function AccordionItem({ title, body, index }: { title: string; body: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-blue-50 transition text-left">
        <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{index + 1}</span>
        <span className="text-sm font-semibold text-gray-900 flex-1">{title}</span>
        <span className="text-gray-400 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
        </div>
      )}
    </div>
  );
}

function CsAccordion({ item, index }: { item: { title: string; body: string }; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-3 hover:bg-white/60 transition flex items-center gap-3">
        <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{index + 1}</span>
        <span className="text-sm font-semibold text-gray-900 flex-1">{item.title}</span>
        <span className="text-gray-400 text-sm flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 ml-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-800 leading-relaxed">{item.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewRow({ qa, index }: { qa: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 hover:bg-blue-50 transition flex items-start gap-3">
        <span className="text-xs font-bold text-blue-600 mt-0.5 w-5 flex-shrink-0">{index + 1}</span>
        <p className="text-sm font-semibold text-gray-900 flex-1">{qa.q}</p>
        <span className="text-gray-400 flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 ml-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs font-bold text-green-700 mb-2">✅ Ideal Answer:</p>
            <p className="text-sm text-gray-800 leading-relaxed">{qa.a}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function LearningPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [interviewCat, setInterviewCat] = useState(Object.keys(INTERVIEW_QA)[0]);
  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ know: 0, review: 0 });
  const [glossSearch, setGlossSearch] = useState('');

  const flashNext = (know: boolean) => {
    setScore(s => know ? { ...s, know: s.know + 1 } : { ...s, review: s.review + 1 });
    setFlipped(false);
    setTimeout(() => setFlashIdx(i => (i + 1) % FLASHCARDS.length), 150);
  };

  const filteredGloss = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(glossSearch.toLowerCase()) ||
    g.def.toLowerCase().includes(glossSearch.toLowerCase())
  );

  const activeVTab = VTABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-full bg-gray-50">

      {/* HEADER */}
      <div className="bg-blue-900 text-white px-6 py-4">
        <div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
          <span>QMOS</span><span>›</span><span className="text-white">Learning Academy</span>
        </div>
        <h1 className="text-xl font-bold">🎓 Learning Academy</h1>
        <p className="text-blue-300 text-xs mt-0.5">IATF 16949 · Core Tools · Problem Solving · KPIs · Customer Standards · Interview Master · Flashcards · Glossary</p>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Study Topics', value: IATF_CLAUSES.length + CORE_TOOLS.length + PROBLEM_TOOLS.length + KPIS.length, color: 'bg-blue-700', icon: '📘' },
            { label: 'Interview Q&A', value: Object.values(INTERVIEW_QA).reduce((s, q) => s + q.length, 0), color: 'bg-green-700', icon: '💼' },
            { label: 'Flashcards', value: FLASHCARDS.length, color: 'bg-orange-600', icon: '⚡' },
            { label: 'Glossary Terms', value: GLOSSARY.length, color: 'bg-purple-700', icon: '📖' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-lg px-4 py-2.5 bg-opacity-70`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-white/80">{s.icon} {s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BODY — vertical nav + content */}
      <div className="flex min-h-[calc(100vh-200px)]">

        {/* ── VERTICAL NAV ── */}
        <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-200 shadow-sm">
          <nav className="py-3">
            {VTABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-4 ${
                  activeTab === tab.id
                    ? 'border-blue-900 bg-blue-50 text-blue-900'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <span className="text-base flex-shrink-0">{tab.icon}</span>
                <span className="text-xs font-semibold leading-tight">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 p-5 overflow-y-auto space-y-4 min-w-0">

          {/* Section header */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-600 flex items-center gap-3">
            <span className="text-2xl">{activeVTab.icon}</span>
            <div>
              <h2 className="text-base font-bold text-gray-900">{activeVTab.label}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeTab === 'overview' && 'Select any section from the left to start learning.'}
                {activeTab === 'iatf' && 'IATF 16949:2016 — all clauses with factory examples'}
                {activeTab === 'core-tools' && 'AIAG Core Tools — APQP, PPAP, PFMEA, MSA, SPC'}
                {activeTab === 'problem-solving' && '8D, 5-Why, Fishbone, Pareto, PDCA — with real examples'}
                {activeTab === 'quality-kpis' && 'Formulas, targets, and how to improve each KPI'}
                {activeTab === 'customer-standards' && 'TML · TMBSL · Maruti · Toyota — beyond IATF 16949'}
                {activeTab === 'interview' && 'Click any question to reveal the ideal answer'}
                {activeTab === 'flashcards' && 'Tap card to flip. Mark Know or Need Review.'}
                {activeTab === 'glossary' && 'Search any quality term instantly'}
              </p>
            </div>
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              {VTABS.filter(t => t.id !== 'overview').map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="bg-white rounded-xl shadow-sm p-4 text-left hover:border-blue-300 border-2 border-transparent hover:bg-blue-50 transition group flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{tab.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-900">{tab.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tab.id === 'iatf' && '7 clauses with factory examples'}
                      {tab.id === 'core-tools' && 'APQP, PPAP, PFMEA, MSA, SPC'}
                      {tab.id === 'problem-solving' && '8D, 5-Why, Fishbone, Pareto, PDCA'}
                      {tab.id === 'quality-kpis' && 'PPM, Cpk, OEE, OTIF, CoPQ'}
                      {tab.id === 'customer-standards' && 'TML, TMBSL, Maruti, Toyota CSR'}
                      {tab.id === 'interview' && `${Object.values(INTERVIEW_QA).reduce((s,q)=>s+q.length,0)} Q&A across ${Object.keys(INTERVIEW_QA).length} categories`}
                      {tab.id === 'flashcards' && `${FLASHCARDS.length} flip cards with Know/Review scoring`}
                      {tab.id === 'glossary' && `${GLOSSARY.length} searchable quality terms`}
                    </p>
                  </div>
                  <span className="ml-auto text-blue-400 opacity-0 group-hover:opacity-100 text-sm flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          )}

          {/* ── IATF 16949 ── */}
          {activeTab === 'iatf' && (
            <div className="space-y-3">
              {IATF_CLAUSES.map((c, i) => (
                <AccordionItem key={i} index={i} title={`${c.no} — ${c.title}`} body={c.body} />
              ))}
            </div>
          )}

          {/* ── CORE TOOLS ── */}
          {activeTab === 'core-tools' && (
            <div className="space-y-3">
              {CORE_TOOLS.map((t, i) => (
                <AccordionItem key={i} index={i} title={`${t.tool} — ${t.title}`} body={t.body} />
              ))}
            </div>
          )}

          {/* ── PROBLEM SOLVING ── */}
          {activeTab === 'problem-solving' && (
            <div className="space-y-3">
              {PROBLEM_TOOLS.map((t, i) => (
                <AccordionItem key={i} index={i} title={`${t.tool} — ${t.title}`} body={t.body} />
              ))}
            </div>
          )}

          {/* ── QUALITY KPIs ── */}
          {activeTab === 'quality-kpis' && (
            <div className="space-y-3">
              {KPIS.map((k, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <div className="px-4 py-3 bg-blue-900 text-white flex items-center justify-between">
                    <span className="text-sm font-bold">{k.kpi}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Target: {k.target}</span>
                  </div>
                  <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-mono text-blue-800 font-bold">Formula: {k.formula}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{k.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CUSTOMER STANDARDS ── */}
          {activeTab === 'customer-standards' && (
            <div className="space-y-4">
              {CUSTOMER_STANDARDS.map((cs, ci) => (
                <div key={ci} className={`rounded-xl border-2 overflow-hidden ${cs.color}`}>
                  <div className={`${cs.hdr} text-white px-5 py-3 flex items-center gap-3`}>
                    <span className="text-xl">{cs.icon}</span>
                    <span className="text-sm font-bold">{cs.customer}</span>
                    <span className="ml-auto bg-white/20 text-xs text-white px-2 py-0.5 rounded-full font-bold">{cs.items.length} requirements</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {cs.items.map((item, ri) => <CsAccordion key={ri} item={item} index={ri} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── INTERVIEW MASTER ── */}
          {activeTab === 'interview' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 overflow-x-auto">
                <div className="flex min-w-max px-4">
                  {Object.keys(INTERVIEW_QA).map(cat => (
                    <button key={cat} onClick={() => setInterviewCat(cat)}
                      className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${interviewCat === cat ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {INTERVIEW_QA[interviewCat].map((qa, i) => <InterviewRow key={i} qa={qa} index={i} />)}
              </div>
            </div>
          )}

          {/* ── FLASHCARDS ── */}
          {activeTab === 'flashcards' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">Card {flashIdx + 1} of {FLASHCARDS.length}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600 font-bold">✓ Know: {score.know}</span>
                    <span className="text-orange-500 font-bold">↻ Review: {score.review}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(flashIdx / FLASHCARDS.length) * 100}%` }} />
                </div>
              </div>
              <div onClick={() => setFlipped(f => !f)}
                className="bg-white rounded-2xl shadow-lg p-8 min-h-[180px] flex flex-col items-center justify-center cursor-pointer border-2 border-gray-100 hover:border-blue-200 transition-all">
                {!flipped ? (
                  <div className="text-center space-y-3">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Question</span>
                    <p className="text-lg font-bold text-gray-900">{FLASHCARDS[flashIdx].q}</p>
                    <p className="text-xs text-gray-400">Tap to reveal answer</p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Answer</span>
                    <p className="text-base text-gray-800 leading-relaxed">{FLASHCARDS[flashIdx].a}</p>
                  </div>
                )}
              </div>
              {flipped ? (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => flashNext(false)} className="py-3 rounded-xl border-2 border-orange-300 text-orange-600 font-bold text-sm hover:bg-orange-50 transition">↻ Need Review</button>
                  <button onClick={() => flashNext(true)} className="py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition">✓ I Know This</button>
                </div>
              ) : (
                <button onClick={() => setFlipped(true)} className="w-full py-3 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition">Flip Card →</button>
              )}
              <button onClick={() => { setFlashIdx(0); setFlipped(false); setScore({ know: 0, review: 0 }); }}
                className="w-full py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition">
                ↺ Restart
              </button>
            </div>
          )}

          {/* ── GLOSSARY ── */}
          {activeTab === 'glossary' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <input type="text" value={glossSearch} onChange={e => setGlossSearch(e.target.value)}
                  placeholder="Search — PFMEA, PPM, Cpk, PPAP, OEE..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-bold">📖 Quality Glossary</p>
                  <span className="text-blue-300 text-xs">{filteredGloss.length} terms</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {filteredGloss.map((g, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-blue-50 transition flex items-start gap-3">
                      <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono flex-shrink-0 mt-0.5">{g.term}</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{g.def}</p>
                    </div>
                  ))}
                  {filteredGloss.length === 0 && <div className="px-5 py-10 text-center text-gray-400 text-sm">No matching terms.</div>}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
