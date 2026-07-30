'use client';
import { useState, useRef, useEffect } from 'react';

// ── Expert Knowledge Base ─────────────────────────────────────────────────────
const KB: { keys: string[]; title: string; response: string }[] = [
  {
    keys: ['8d', 'eight discipline', 'eight d'],
    title: '8D Problem Solving Structure',
    response: `**8D Report — AIAG / Ford Standard Structure**

**D0 — Prepare for 8D**
Confirm the problem warrants 8D (significant customer impact, safety, or regulatory risk). Identify the emergency response action (ERA) if containment is needed immediately.

**D1 — Establish the Team**
Cross-functional team: Quality, Production, Engineering, Supplier (if applicable). Assign a Team Champion (management sponsor) and Team Leader. Min. 3–5 members with relevant knowledge.

**D2 — Describe the Problem**
Use IS / IS-NOT analysis. Answer: What? Where? When? How many? How big? Quantify: defect rate, rejection quantity, customer complaints count.
Problem Statement format: "[What] was found at [Where] causing [Effect], affecting [How many] units since [When]."

**D3 — Containment Actions (ICA)**
Stop the bleeding — 100% inspection, sorting, quarantine, rework. Protect the customer NOW. Must be in place within 24–48 hours. Verify containment effectiveness.

**D4 — Root Cause Analysis**
Use 5-Why analysis + Ishikawa (fishbone) for each symptom. Find:
• Occurrence Root Cause — why did the defect happen?
• Escape Root Cause — why didn't your controls catch it?
Validate root cause: "If we remove this cause, does the problem disappear?"

**D5 — Choose Permanent Corrective Actions**
Select PCAs that eliminate both occurrence and escape root causes. Pilot test PCAs. Verify they do not cause new problems.

**D6 — Implement and Validate PCAs**
Full production implementation. Update: Control Plan, PFMEA, Work Instructions, inspection criteria. Measure: defect rate before vs. after. Verify zero recurrence for 4–8 weeks.

**D7 — Prevent Recurrence (Systemic Actions)**
Apply lessons learned to similar processes, products, and plants. Update PFMEA risk for similar failure modes. Add to Lessons Learned database.

**D8 — Congratulate the Team**
Close the 8D with management sign-off. Share learnings. Recognise team contribution.

Auditor focus: D4 is the most scrutinised. "Show me how you validated the root cause" and "Show me the escape point analysis" are the two most common 8D audit questions.`,
  },
  {
    keys: ['iatf', 'iatf 16949', 'certification', 'audit clause'],
    title: 'IATF 16949 Key Requirements',
    response: `**IATF 16949 — Core Clauses Quick Reference**

**Clause 4 — Context of the Organization**
4.1: Internal/external issues. 4.2: Interested parties. 4.3: QMS scope. 4.4: Process approach — Turtle diagrams for each process.

**Clause 5 — Leadership**
5.1: Top management must demonstrate personal involvement — not just signatures. 5.2: Quality Policy displayed, understood by all. 5.3: Roles and responsibilities documented.

**Clause 6 — Planning**
6.1: Risk-based thinking — identify risks AND opportunities. 6.2: Quality objectives — SMART, measurable, monitored. 6.3: Change management — controlled changes only.

**Clause 7 — Support**
7.1.5: Measurement systems — MSA/GRR required for CC/SC characteristics.
7.2: Competency — trained, qualified, assessed operators. Evidence required.
7.5: Documented information — controlled, version managed.

**Clause 8 — Operation**
8.3: APQP — design and development planning, DFMEA, DVP.
8.3.4: PPAP — Level 1–5 submission, PSW approval.
8.4: Supplier control — approved supplier list, supplier audits, scorecards.
8.5.1: Control Plans — prototype, pre-launch, production.
8.6.2: Layout inspection — full dimensional verification periodically.
8.7: Nonconforming output — quarantine, segregation, disposition.

**Clause 9 — Performance Evaluation**
9.1.1: Monitoring and measurement — SPC for CC characteristics.
9.2: Internal audit — process audits, product audits, system audits.
9.3: Management review — mandatory inputs and outputs.

**Clause 10 — Improvement**
10.2: Nonconformity and corrective action — 8D format, systemic prevention.

Top audit findings: missing MSA evidence (7.1.5), PFMEA not linked to Control Plan (8.5.1), operator competency not demonstrated (7.2), management review missing required inputs (9.3).`,
  },
  {
    keys: ['pfmea', 'fmea', 'failure mode', 'action priority', 'ap rating'],
    title: 'PFMEA — AIAG-VDA 2019',
    response: `**PFMEA — AIAG-VDA 2019 (7-Step Approach)**

Key Change from Old Format: Action Priority (AP) replaces RPN.
AP = combination of Severity x Occurrence x Detection — evaluated in a priority table, not multiplied. High AP must be actioned before PPAP.

**7-Step Structure:**
1. Planning and Preparation — scope, team, timing
2. Structure Analysis — process step / work element breakdown
3. Function Analysis — what each step must achieve
4. Failure Analysis — Failure Mode, Effect (on customer), Cause (of failure)
5. Risk Analysis — S / O / D ratings, AP = High / Medium / Low
6. Optimisation — actions for all High AP, selected Medium AP
7. Results Documentation — updated AP after actions, sign-off

**Severity Ratings (1–10):**
• 9–10: Safety/regulatory impact — customer or end user harm
• 7–8: Major disruption — line stoppage, 100% sort
• 5–6: Significant — customer complaint, rework
• 3–4: Minor — internal detection, slight annoyance
• 1–2: No effect

**AP Decision:**
• S=9–10 + any O + any D = High AP always
• S=5–8 + O≥4 + D≥4 = typically High AP
• S=1–4 + O≤3 + D≤3 = typically Low AP

**Common Mistakes:**
• Detection rated too optimistically (visual check rated 3 when it should be 7)
• High AP items not closed before PPAP submission
• PFMEA not updated when process changes
• PFD, PFMEA, and Control Plan linkage broken

Every failure mode in PFMEA must appear in the Control Plan. Every CC/SC in the Control Plan must trace back to PFMEA.`,
  },
  {
    keys: ['ppap', 'part submission', 'psw', 'submission level', '18 element'],
    title: 'PPAP — 18 Elements & Submission Levels',
    response: `**PPAP — AIAG 4th Edition Quick Guide**

**Submission Levels:**
• Level 1 — PSW only (bulk/commodity parts)
• Level 2 — PSW + samples + limited data
• Level 3 — PSW + full data + samples (DEFAULT for all new parts)
• Level 4 — PSW + customer-defined requirements
• Level 5 — Full review at supplier facility (safety/critical parts)

**18 Elements — Must-Knows:**
1. Design Records (drawing, 3D CAD, all referenced specs)
2. Engineering Change Documents (all ECNs since last approval)
3. Customer Engineering Approval (written, not verbal)
4. DFMEA (if supplier is design responsible)
5. Process Flow Diagram (PFD — matches PFMEA and Control Plan exactly)
6. PFMEA (AIAG-VDA 2019 format recommended)
7. Control Plan (prototype + pre-launch + production)
8. MSA Studies (GRR for all CC/SC gauges — %GRR below 10%)
9. Dimensional Results (minimum 6 parts, all ballooned dimensions)
10. Material/Performance Test Results (from accredited lab)
11. Initial Process Study (Pp/Ppk ≥ 1.67 for CC characteristics)
12. Qualified Laboratory Documentation (ISO 17025)
13. Appearance Approval Report (if appearance characteristics apply)
14. Sample Production Parts (from actual production trial)
15. Master Sample (retained at supplier)
16. Checking Aids (gauges, fixtures — calibrated)
17. Customer-Specific Requirements (CSR compliance evidence)
18. Part Submission Warrant (PSW — signed by supplier and customer)

**When Re-PPAP is required:** Engineering change, supplier change, material change, tooling modification, process change, >12 months inactive tooling.

Never ship production parts before PSW is signed and returned. Shipping without PPAP approval = major IATF NC under Cl. 8.3.4.`,
  },
  {
    keys: ['apqp', 'advanced product quality', 'gate review', 'launch'],
    title: 'APQP — 5-Phase Gate Review',
    response: `**APQP — AIAG 2nd Edition (5-Phase Framework)**

**Phase 1 — Plan and Define Program**
Inputs: Customer requirements, CSR, market research, historical quality data.
Key outputs: Design goals, reliability goals, preliminary BOM, preliminary PFD, special characteristics identified, team feasibility commitment.
Gate: Management approval to proceed with design.

**Phase 2 — Product Design and Development**
Inputs: Phase 1 outputs.
Key outputs: DFMEA, Design Verification Plan (DVP), Engineering drawings, material specifications, drawing review complete.
Gate: Design freeze, DVP passed, DV/PV test results approved.

**Phase 3 — Process Design and Development**
Inputs: Approved design package.
Key outputs: PFMEA, Process Flow Diagram, Control Plan (pre-launch), Measurement System Plan, production capacity analysis.
Gate: Process design freeze, all PFMEA High AP items closed.

**Phase 4 — Product and Process Validation**
Inputs: Phase 3 outputs.
Key outputs: Production trial run (≥300 pieces), PPAP submission, SPC/capability results (Pp/Ppk ≥ 1.67 for CC), MSA/GRR results, production Control Plan.
Gate: PPAP approved (PSW signed by customer), line approved for production.

**Phase 5 — Launch, Feedback and Corrective Action**
Inputs: Customer satisfaction data, warranty data, field returns.
Key outputs: Lessons learned, updated FMEA, closed corrective actions, reduced controls where validated.
Gate: Transition from intensified to standard production monitoring.

Timing plan is critical. Gate 4 (PPAP approval) drives the launch date. Any slip in Gate 3 (process freeze) cascades to delay the launch.`,
  },
  {
    keys: ['spc', 'control chart', 'cpk', 'cp', 'ppk', 'capability', 'xbar', 'ucl', 'lcl'],
    title: 'SPC and Process Capability',
    response: `**SPC — AIAG 2nd Edition Quick Reference**

**Control Charts — When to Use:**
• X̄-R chart — variable data, subgroup size n=2–10 (most common in automotive)
• X̄-S chart — variable data, larger subgroups (n above 10)
• I-MR chart — variable data, n=1 (individual readings, slow processes)
• p-chart — attribute, proportion defective (variable subgroup size)
• np-chart — attribute, number defective (constant subgroup size)

**Process Capability Indices:**
• Cp = (USL-LSL) / 6σ_within — spread vs tolerance (no centering)
• Cpk = min[(USL-X̄)/3σ, (X̄-LSL)/3σ] — actual capability with centering
• Pp = (USL-LSL) / 6σ_overall — long-term spread
• Ppk = min[(USL-X̄)/3σ_overall] — long-term actual performance

**Acceptance Criteria (AIAG):**
• Cpk ≥ 1.67 = World class (CC characteristics, new launch)
• Cpk ≥ 1.33 = Capable (ongoing production minimum)
• Cpk 1.00–1.33 = Marginal — needs monitoring
• Cpk below 1.00 = Not capable — 100% inspection + corrective action

**Western Electric OOC Rules:**
1. One point beyond 3σ (UCL/LCL)
2. 8 consecutive points on same side of centreline
3. 6 consecutive points trending up or down
4. 14 alternating points up/down

Use Pp/Ppk for initial qualification (PPAP). Use Cp/Cpk for ongoing monitoring. Pp/Ppk uses overall σ (all data); Cp/Cpk uses within-subgroup σ (inherent process variation only).`,
  },
  {
    keys: ['msa', 'grr', 'gauge', 'repeatability', 'reproducibility', 'measurement system'],
    title: 'MSA / GRR Quick Guide',
    response: `**MSA — AIAG MSA 4th Edition**

**GRR Study (Average and Range Method):**
Standard design: 10 parts x 3 operators x 2 trials = 60 readings.
Must be a blind study — operators do not see part numbers.
Parts must span the full process range (not all-good parts near nominal).

**Key Metrics:**
• EV (Repeatability) — gauge hardware variation (same operator, same part)
• AV (Reproducibility) — operator-to-operator variation
• GRR = √(EV² + AV²) — total measurement system error
• %GRR = GRR/TV x 100 — percentage of total variation from measurement
• ndc = 1.41 x PV/GRR — number of distinct categories (must be ≥ 5)
• %P/T = GRR/(USL-LSL) x 100 — precision-to-tolerance ratio

**Acceptance Criteria:**
• %GRR below 10% = Acceptable
• %GRR 10–30% = Conditional (document risk, get approval)
• %GRR above 30% = Unacceptable — fix gauge before SPC

**If %EV is high:** Gauge hardware problem — worn parts, poor fixture, thermal drift. Fix: repair/replace gauge, improve clamping.
**If %AV is high:** Operator method problem — ambiguous instruction, inconsistent technique. Fix: retrain, revise work instruction, improve fixture.

Always run MSA BEFORE SPC. A gauge with 35% GRR will give you meaningless Cpk data. IATF auditors ask: "Show me the GRR evidence that validates your SPC data."`,
  },
  {
    keys: ['capa', 'corrective action', 'preventive action', 'root cause', '5 why'],
    title: 'CAPA — Corrective and Preventive Action',
    response: `**CAPA — IATF 16949 Cl. 10.2 Requirements**

**Corrective Action (CA) — for actual nonconformities:**
Triggered by: customer complaints, internal NCRs, audit findings, warranty claims.

**Preventive Action (PA) — for potential risks:**
Triggered by: PFMEA high AP items, trend analysis, near-misses, lessons learned.

**CAPA Process — Standard Steps:**
1. Problem Statement — specific, quantified, IS/IS-NOT framing
2. Containment — immediate protection of customer (24–48 hours)
3. Root Cause Analysis — 5-Why + Fishbone for occurrence AND escape
4. Corrective Action Selection — eliminates root cause, not symptom
5. Implementation — assigned owner, target date, evidence of completion
6. Effectiveness Verification — measure: has defect rate dropped to zero? Verify for minimum 4–8 weeks post-implementation
7. Systemic Prevention — update PFMEA, Control Plan, WI, training records
8. Closure — Quality Manager sign-off with evidence

**5-Why Rules:**
• Each "Why" must be a cause, not a restatement of the symptom
• The 5th Why should reach a systemic root cause (process, system, or standard gap)
• If your 5th Why is "operator error" — you haven't gone deep enough

**Effectiveness Criteria:**
• Zero recurrence of the same defect mode for 90 days = effective
• Reduction in defect rate by more than 80% = effective
• Zero repeat customer complaints on same issue = effective

Common IATF finding: CAPA closed without verified effectiveness. Auditors look for data showing defect rate after PCA, not just "action completed."`,
  },
  {
    keys: ['control plan', 'special characteristic', 'cc', 'sc', 'reaction plan'],
    title: 'Control Plan — AIAG Format',
    response: `**Control Plan — AIAG 1st Edition (March 2024 Update)**

**Three Types Required:**
• Prototype CP — during prototype/development phase
• Pre-Launch CP — during PPAP trial run (more intensive controls)
• Production CP — ongoing manufacturing controls

**26 Key Fields (AIAG Format):**
Header: Part number, revision, customer, supplier, date, approval signatures.
Body per process step: process step number and name, machine/device/jig/tools, characteristics (Product or Process), special characteristic designation (CC or SC), product/process specification and tolerance, evaluation/measurement technique, sample size and frequency, control method (SPC, attribute chart, inspection), reaction plan.

**Special Characteristics:**
• CC (Critical Characteristic) — safety or regulatory. Cpk ≥ 1.67 always. 100% check or SPC mandatory.
• SC (Significant Characteristic) — form/fit/function impact. Cpk ≥ 1.33. Regular capability monitoring.

**Reaction Plan must specify:**
"If out of control: (1) Stop production, (2) Contain suspect material, (3) Notify Quality, (4) Identify and tag nonconforming parts, (5) Investigate and resolve before restart."

Control Plan must be updated with every 4M change (Man, Machine, Material, Method). IATF auditors check: "Is this Control Plan current? When was it last reviewed?"`,
  },
  {
    keys: ['supplier', 'vendor', 'supplier audit', 'supplier quality', 'sqe', 'approved supplier'],
    title: 'Supplier Quality Management',
    response: `**Supplier Quality — IATF 16949 Cl. 8.4**

**Approved Supplier List (ASL):**
All production suppliers must be on an approved list. Approval requires: supplier audit OR third-party certification (IATF/ISO) + PPAP approval + quality history.

**Supplier Performance KPIs:**
• PPM (Parts Per Million defective) — target typically below 50 PPM
• On-time delivery rate — target above 95%
• 8D response time — typically 24h D3, 30 days D6
• PPAP approval rate
• Open corrective actions count

**Supplier Scorecard Ratings:**
• Preferred — PPM below 25, OTD above 98%, no open CAs, IATF certified
• Approved — meets baseline KPIs, active monitoring
• Conditional — performance issues, development plan in place
• Disqualified — safety event, refusal to cooperate, chronic failure

**Supplier Development:**
For conditional suppliers: formal improvement plan, monthly review, on-site support, defined exit criteria.

**IATF Requirements (Cl. 8.4.1):**
• 100% inspection of supplier-designated CC characteristics at receiving
• Supplier must flow down customer-specific requirements
• Second-party audits for critical/sole-source suppliers

Most common finding: no evidence of annual supplier audits for critical suppliers (8.4.1). Keep an audit calendar and store signed audit reports.`,
  },
  {
    keys: ['audit', 'internal audit', 'process audit', 'product audit', 'checklist'],
    title: 'Internal Audit — IATF Requirements',
    response: `**Internal Audit — IATF 16949 Cl. 9.2**

**Three Mandatory Audit Types:**
1. Quality Management System (QMS) Audit — all clauses of IATF 16949 covered over the audit cycle (typically 1 year). Risk-based frequency.
2. Process Audit — manufacturing process against Control Plan, PFMEA, Work Instructions. Uses turtle diagram or process approach.
3. Product Audit — product vs. engineering drawing and customer specifications. Typically 5–10 parts per audit.

**Audit Programme Requirements:**
• Documented audit schedule covering all processes and all shifts
• Auditors must be independent of the area being audited
• Trained and qualified internal auditors (competency records required)
• Audit findings tracked to closure with verification

**Process Audit — Turtle Diagram (Cl. 9.2.2.2):**
• Input: What comes in? From whom?
• Output: What is produced? For whom?
• Equipment: Machines, tools, gauges calibrated?
• People: Trained? Qualified? Competency demonstrated?
• Methods: WI followed? Control Plan implemented? SPC monitored?
• Environment: 5S, housekeeping, ergonomics?
• Metrics: KPIs monitored? Targets met? Actions taken?

**Top IATF Audit Findings:**
NC1: Internal audit did not cover all processes/shifts.
NC2: Auditor not independent of audited area.
NC3: Audit findings not closed by due date.
NC4: No evidence of management review of audit results.

IATF auditors will review your internal audit records, findings, and closure evidence. Prepare a 12-month audit schedule and update it monthly.`,
  },
  {
    keys: ['kpi', 'metrics', 'quality objective', 'ppm', 'dppm', 'oee', 'target'],
    title: 'Quality KPIs and Metrics',
    response: `**Quality Head KPI Framework — IATF 16949 Cl. 6.2 and 9.1**

**Customer Quality KPIs:**
• Customer PPM — defects per million shipped. Target: below 25–50 PPM (OEM-dependent)
• Customer Complaints — number per quarter, % closed on time
• Warranty Claims — repair rate, field return rate
• Shipped-on-Hold — zero tolerance

**Internal Quality KPIs:**
• Internal Rejection Rate — % of production rejected at in-process or final inspection
• First Time Through (FTT) — % of parts passing all checks without rework
• Scrap Rate (%) — target below 0.5% for mature processes
• Rework Rate (%) — target below 1%
• COPQ (Cost of Poor Quality) — scrap + rework + warranty + sorting cost

**Supplier Quality KPIs:**
• Incoming PPM — supplier defects per million received
• Incoming Rejection Rate — % of lots rejected at IQC
• Supplier OTD — On-Time Delivery %
• PPAP First-Pass Approval Rate

**Process KPIs:**
• OEE — Availability x Performance x Quality (target ≥ 85%)
• Process Capability (Cpk) — CC: ≥ 1.67, SC: ≥ 1.33
• Control Plan Compliance — % of characteristics monitored per plan

**Management Review Inputs (Cl. 9.3.2):**
Customer satisfaction, conformance to quality objectives, process performance, audit results, supplier performance, COPQ, lessons learned.

Display real-time KPIs on a Quality Board at the shop floor. Management review should show trend (not just point-in-time) — 3–6 month rolling trend tells the story.`,
  },
  {
    keys: ['sop', 'work instruction', 'wi', 'procedure', 'document', 'standard operating'],
    title: 'SOP and Work Instruction Writing',
    response: `**SOP and Work Instruction — IATF 16949 Cl. 7.5**

**Hierarchy of Documents:**
Level 1: Quality Manual (QMS scope, policy, system overview)
Level 2: Procedures (SOPs — what to do, who, when)
Level 3: Work Instructions (WIs — step-by-step how to do it)
Level 4: Forms, records, data sheets

**Work Instruction — Minimum Requirements:**
• Document number and revision level
• Effective date and approval signature
• Scope: which process/operation does this cover
• Tools, equipment, materials required
• Step-by-step instructions (numbered, sequential)
• Quality checks at each critical step
• Safety precautions (PPE, hazards)
• Reference to Control Plan (what to inspect, how often)
• Reaction plan: what to do if nonconforming
• Photographs or diagrams at critical steps

**Document Control (Cl. 7.5.3):**
• All documents must be version-controlled
• Obsolete versions must be removed from workstations
• Electronic documents: access control, change history
• Physical documents: stamped "CONTROLLED COPY" with issue date

**IATF Common Findings:**
• Obsolete WI found at workstation (old revision in use)
• WI does not match Control Plan inspection frequency
• No operator signature/acknowledgement of training on new WI

The test of a good WI: give it to a new operator with no training — can they produce a conforming part? If yes, the WI is effective.`,
  },
  {
    keys: ['management review', 'top management', 'review input', 'cl 9.3'],
    title: 'Management Review — IATF Cl. 9.3',
    response: `**Management Review — IATF 16949 Cl. 9.3**

**Frequency:** Minimum annually. For high-risk or underperforming QMS — quarterly recommended.

**Mandatory Inputs (Cl. 9.3.2):**
• Status of actions from previous reviews
• Changes in internal/external context
• Customer satisfaction and feedback
• Quality objectives achievement
• Process performance and product conformity
• Nonconformities and corrective actions status
• Audit results (internal and external)
• Supplier performance
• Adequacy of resources
• Risks and opportunities
• COPQ analysis
• Customer-specific requirements

**Additional IATF-specific Inputs:**
• Manufacturing feasibility
• Field failures and warranty performance
• Lessons learned and benchmarking
• Effectiveness of actions on significant quality issues

**Mandatory Outputs (Cl. 9.3.3):**
• Decisions on improvement opportunities
• Any changes needed to the QMS
• Resource needs
• Risk mitigation actions
• Updated quality objectives

**Common Audit Findings:**
• Management review minutes don't address all mandatory inputs
• "Top management" absent — only Quality team present
• No evidence of follow-up on previous review action items
• Customer satisfaction data missing from inputs

Management review is not a quality meeting. CEO/MD/Plant Head must be present and their comments recorded. Auditors check: "Who attended? Were all inputs discussed? What decisions were made?"`,
  },
  {
    keys: ['hello', 'hi', 'help', 'what can you do', 'start', 'assist'],
    title: 'Welcome to AI Quality Copilot',
    response: `**Welcome to QMOS AI Quality Copilot**

I am your embedded Quality Intelligence Assistant — trained on 40+ years of Quality Head, IATF 16949, AIAG, and Manufacturing Excellence knowledge.

**I can help you with:**

IATF 16949 — clause requirements, audit preparation, common NCs, evidence checklist
PPAP — 18 elements, submission levels, PSW, when re-PPAP is needed
APQP — 5-phase gate review, deliverables, launch readiness
PFMEA — AIAG-VDA 2019, AP rating, 7-step methodology
MSA — GRR study design, %GRR interpretation, acceptance criteria
SPC — control charts, Cpk/Ppk, Western Electric rules
Control Plan — AIAG format, CC/SC characteristics, reaction plans
8D Problem Solving — D0–D8 structure, root cause analysis, effectiveness
CAPA — corrective/preventive action, 5-Why, effectiveness verification
Supplier Quality — audits, scorecards, ASL management
Quality KPIs — PPM, Cpk, OEE, COPQ metrics
SOPs and Work Instructions — writing, document control, IATF requirements
Management Review — Cl. 9.3 inputs/outputs, top management requirements

**Try asking:**
• "How do I conduct an 8D?"
• "What are the IATF 16949 audit questions for PPAP?"
• "Explain Cpk vs Ppk"
• "What is required in a Control Plan?"
• "How do I calculate GRR?"`,
  },
];

// ── Prompt Library ────────────────────────────────────────────────────────────
const PROMPT_GROUPS = [
  {
    group: 'Problem Solving', icon: '🔧',
    prompts: [
      'How do I write a proper 8D report?',
      'What is the correct 5-Why format?',
      'How to identify escape root cause in 8D D4?',
      'When should CAPA be raised vs containment only?',
    ],
  },
  {
    group: 'IATF 16949', icon: '📋',
    prompts: [
      'What are the mandatory IATF 16949 clauses?',
      'What are common IATF audit findings?',
      'What does management review require?',
      'How to prepare for IATF recertification audit?',
    ],
  },
  {
    group: 'AIAG Core Tools', icon: '🔩',
    prompts: [
      'Explain PPAP 18 elements and submission levels',
      'What is the APQP 5-phase gate review process?',
      'How does AIAG-VDA PFMEA AP system work?',
      'When is re-PPAP required?',
    ],
  },
  {
    group: 'SPC and MSA', icon: '📈',
    prompts: [
      'What is the difference between Cpk and Ppk?',
      'How to interpret a %GRR result of 25%?',
      'What are Western Electric OOC rules?',
      'How do I conduct a GRR study correctly?',
    ],
  },
  {
    group: 'Quality Management', icon: '🏆',
    prompts: [
      'What KPIs should a Quality Head track?',
      'How to write an effective Work Instruction?',
      'How to manage supplier quality performance?',
      'What should a Control Plan reaction plan say?',
    ],
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  title?: string;
  ts: string;
}

function getResponse(input: string): { title: string; response: string } {
  const q = input.toLowerCase();
  for (const entry of KB) {
    if (entry.keys.some(k => q.includes(k))) {
      return { title: entry.title, response: entry.response };
    }
  }
  return {
    title: 'Quality Intelligence',
    response: `I have deep knowledge across IATF 16949, AIAG Core Tools (APQP, PPAP, PFMEA, MSA, SPC, Control Plan), 8D problem solving, CAPA, supplier quality, and manufacturing excellence.

Try asking about a specific topic such as:
• "Explain 8D structure"
• "What are IATF 16949 clause 8 requirements?"
• "How to calculate Cpk?"
• "What is GRR and how do I interpret it?"
• "How to prepare a PPAP submission?"

Use the Prompt Library on the left for ready-made expert questions, or type your specific quality challenge below.`,
  };
}

function formatResponse(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

function getNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'assistant', ts: getNow(),
      title: 'Welcome to AI Quality Copilot',
      text: `**Welcome to QMOS AI Quality Copilot**\n\nI am your embedded Quality Intelligence Assistant — trained on IATF 16949, AIAG Core Tools, 8D, CAPA, SPC, MSA, and 40+ years of Quality Head knowledge.\n\nAsk me anything about quality management, or pick a topic from the Prompt Library on the left.`,
    },
  ]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [sideTab, setSideTab]   = useState<'prompts' | 'about'>('prompts');
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: getNow() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const { title, response } = getResponse(text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: response, title, ts: getNow() };
      setMessages(prev => [...prev, aiMsg]);
      setThinking(false);
    }, 900 + Math.random() * 600);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-950 to-slate-900 border-b border-violet-800/40 px-5 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-lg">🤖</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">AI Quality Copilot</h1>
              <p className="text-violet-300 text-xs">IATF 16949 · AIAG Core Tools · 8D · SPC · MSA · 40+ years Quality Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </span>
            <button onClick={() => setMessages([{ id: '0', role: 'assistant', ts: getNow(), title: 'Session Cleared', text: 'Session cleared. Ask me anything about quality management.' }])}
              className="text-xs text-violet-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-violet-800/40 transition">
              🗑 Clear
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-700">
            {(['prompts', 'about'] as const).map(t => (
              <button key={t} onClick={() => setSideTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all capitalize ${
                  sideTab === t ? 'bg-violet-900/40 text-violet-300 border-b-2 border-violet-400' : 'text-gray-500 hover:text-white'
                }`}>
                {t === 'prompts' ? '💬 Prompts' : 'ℹ️ About'}
              </button>
            ))}
          </div>

          {sideTab === 'prompts' && (
            <div className="flex-1 overflow-y-auto py-2">
              {PROMPT_GROUPS.map(g => (
                <div key={g.group} className="mb-1">
                  <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{g.icon}</span>{g.group}
                  </div>
                  {g.prompts.map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-violet-900/30 transition-all leading-snug border-l-2 border-transparent hover:border-violet-500 ml-1">
                      {p}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {sideTab === 'about' && (
            <div className="flex-1 overflow-y-auto p-3 text-xs text-gray-400 space-y-3">
              <div className="bg-violet-900/20 border border-violet-800/30 rounded-xl p-3">
                <div className="text-violet-300 font-bold mb-1">Knowledge Base</div>
                <p>Built-in expert knowledge covering 40+ quality management topics aligned with IATF 16949, AIAG standards, and best practices.</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 space-y-1.5">
                {[
                  ['📋', 'IATF 16949 all clauses'],
                  ['📦', 'PPAP 18 elements'],
                  ['🚀', 'APQP 5-phase gates'],
                  ['⚠️', 'PFMEA AIAG-VDA 2019'],
                  ['🔬', 'MSA and GRR studies'],
                  ['📈', 'SPC and capability'],
                  ['📋', 'Control Plans'],
                  ['🔧', '8D and CAPA'],
                  ['🏭', 'Supplier quality'],
                  ['📊', 'Quality KPIs'],
                  ['📄', 'SOPs and WIs'],
                  ['🎯', 'Management review'],
                ].map(([ic, t]) => (
                  <div key={t} className="flex items-center gap-2 text-gray-400">
                    <span>{ic}</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-3 text-amber-300/80">
                <strong className="block mb-1">Note</strong>
                Responses are expert-curated quality knowledge. For real-time AI (ChatGPT/Claude), add an API key in .env.local.
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-violet-700 flex items-center justify-center text-sm flex-shrink-0 mt-1 mr-2">🤖</div>
                )}
                <div className={`max-w-2xl ${msg.role === 'user' ? 'max-w-lg' : ''}`}>
                  {msg.role === 'assistant' && msg.title && (
                    <div className="text-xs text-violet-400 font-semibold mb-1 px-1">{msg.title}</div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-700 text-white rounded-tr-sm'
                      : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: '<p>' + formatResponse(msg.text) + '</p>' }} />
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-600">{msg.ts}</span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => copyText(msg.text)} className="text-xs text-gray-600 hover:text-gray-400 transition">
                        📋 Copy
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-violet-900 border border-violet-700 flex items-center justify-center text-sm flex-shrink-0 mt-1 ml-2">👤</div>
                )}
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-violet-700 flex items-center justify-center text-sm flex-shrink-0 mt-1 mr-2">🤖</div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div className="px-4 py-2 border-t border-gray-800 flex gap-2 overflow-x-auto flex-shrink-0">
            {['8D structure', 'IATF clauses', 'Cpk vs Ppk', 'GRR interpretation', 'PPAP levels', 'Control Plan'].map(q => (
              <button key={q} onClick={() => send(q)}
                className="flex-shrink-0 text-xs bg-gray-800 hover:bg-violet-900/40 text-gray-400 hover:text-violet-300 border border-gray-700 hover:border-violet-600 px-3 py-1.5 rounded-full transition-all">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 bg-gray-800 border border-gray-600 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
                placeholder="Ask anything about quality management — IATF, PPAP, 8D, SPC, PFMEA, MSA..."
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
              />
              <button onClick={() => send(input)} disabled={!input.trim() || thinking}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all flex-shrink-0">
                {thinking ? '⏳' : '↑ Send'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
          </div>

        </div>
      </div>
    </div>
  );
}
