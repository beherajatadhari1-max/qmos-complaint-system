'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// -- Types ---------------------------------------------------------------------
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  title?: string;
  ts: string;
}

export interface CopilotWidgetProps {
  tool: 'apqp' | 'ppap' | 'pfmea' | 'control-plan' | 'spc' | 'msa';
  activeTab?: string | number;
}

// -- Knowledge Base -------------------------------------------------------------
const KB: { keys: string[]; title: string; response: string }[] = [

  // -- APQP --------------------------------------------------------------------
  {
    keys: ['apqp phase', 'five phase', '5 phase', 'apqp overview', 'what is apqp', 'advanced product quality'],
    title: 'APQP — 5 Phases Overview',
    response: `**APQP — Advanced Product Quality Planning (AIAG 3rd Edition)**

**Phase 0 — Program Approval / Concept**
Feasibility commitment, customer requirements review, team formation, risk assessment.

**Phase 1 — Product Planning & Program Definition**
Voice of Customer (VOC), product/process assumptions, reliability goals, preliminary Bill of Materials, Design FMEA initiation.

**Phase 2 — Product Design & Development**
Design review, prototype builds, engineering drawings, DVP&R (Design Verification Plan), DFMEA, updated BOM, engineering specifications.

**Phase 3 — Process Design & Development**
Process Flow Diagram (PFD), PFMEA, Control Plan (pre-launch), work instructions, MSA plan, packaging standards, floor plan layout.

**Phase 4 — Product & Process Validation**
Production Trial Run (min. 300 pieces), MSA studies, Cpk ≥ 1.67 (for CC), PPAP submission, Customer Approval (PSW sign-off).

**Phase 5 — Feedback, Assessment & Corrective Action**
Reduce variation, continuous improvement, lessons learned, warranty analysis, CAPA closure.

**Key Output:** PPAP package comes from Phase 4. PFD → PFMEA → Control Plan must be numbered and linked.

**IATF Clauses:** 8.3 (design & development), 8.3.4 (PPAP), 8.5.1.1 (control plans).

**Gate Review:** Each phase ends with a gate review. Customer signs off at Gate 4 (PPAP approval / PSW).`,
  },
  {
    keys: ['apqp gate review', 'gate review', 'gate 0', 'gate 1', 'gate 2', 'gate 3', 'gate 4', 'gate 5'],
    title: 'APQP Gate Reviews',
    response: `**APQP Gate Reviews — Phase-by-Phase Checklist**

**Gate 0 (Program Launch):** Customer requirements understood? Feasibility signed? Team appointed? Risk assessment done? Timing plan approved?

**Gate 1 (Phase 1 Complete):** VOC documented? Design goals set? Reliability targets established? Preliminary BOM approved? DFMEA started?

**Gate 2 (Phase 2 Complete):** Design review held? Prototype built and tested? DVP&R running? Drawings released? DFMEA mature (AP action items closed)?

**Gate 3 (Phase 3 Complete):** PFD approved? PFMEA complete and linked to PFD? Pre-launch Control Plan approved? MSA plan ready? Work Instructions drafted? Floor plan approved?

**Gate 4 (Production Trial / PPAP):** 300-piece run completed? Cpk ≥ 1.67 for CC characteristics? MSA completed (GRR < 10%)? PPAP package complete? Customer PSW approved?

**Gate 5 (SOP + 90 days):** Defect rate trending down? Lessons learned captured? Corrective actions closed? Handover to Production QC done?

**Common Gate Failures:**
• Missing customer sign-off on deliverables
• Open action items carried forward without closure plan
• PFMEA not linked to Control Plan
• MSA not completed before production trial`,
  },
  {
    keys: ['apqp timing plan', 'apqp timeline', 'apqp milestones', 'apqp schedule'],
    title: 'APQP Timing Plan',
    response: `**APQP Timing Plan — Structure & Key Milestones**

**Standard APQP Milestones (work backwards from SOP):**
• Program Award / SOI (Start of Input) — Day 0
• Team Formation — Week 1
• Customer Requirements Review — Week 2
• Feasibility Commitment Signed — Week 3
• DFMEA First Issue — 70% of program duration before SOP
• Design Freeze — 50% before SOP
• PFD / PFMEA / Pre-Launch CP — 40% before SOP
• MSA Study Plan Approval — 30% before SOP
• Production Trial Run (300 pcs) — 8–12 weeks before SOP
• PPAP Submission — 6 weeks before SOP
• Customer PSW Approval — 4 weeks before SOP
• SOP (Start of Production)

**Timing Plan Format:**
Each deliverable should show: Planned Date | Actual Date | Owner | Status (G/A/R)

**Critical Path Items:**
Tooling lead time, design freeze, and PPAP approval are typically on the critical path. Any slip cascades to SOP.

**IATF Requirement (Cl. 8.3.2):** Customer must approve design and development plan inputs.`,
  },
  {
    keys: ['apqp kpi', 'apqp metrics', 'apqp health', 'apqp score', 'apqp maturity'],
    title: 'APQP KPIs & Health Metrics',
    response: `**APQP Program Health KPIs**

**Schedule Performance:**
• On-Time Deliverable Rate = (Deliverables on time / Total deliverables) × 100% — Target: >90%
• Gate Review Score — Red items must have closure dates
• Days to PPAP Approval from submission — Target: <21 days

**Quality Performance:**
• Production Trial Cpk — Target: ≥1.67 for CC, ≥1.33 for SC
• PFMEA High AP Count at SOP — Target: 0 open High AP
• MSA GRR% — Target: <10% for CC, <30% for SC
• Prototype/trial defect rate (ppm)

**Readiness Score (0–100%):**
Score each phase gate: (Items green / Total items) × weight per phase
Phase 1: 15%, Phase 2: 20%, Phase 3: 25%, Phase 4: 30%, Phase 5: 10%

**Launch Quality:**
• Defects per unit (DPU) in first 90 days post-SOP — Target: <500 ppm
• Warranty claims in first 6 months
• Customer complaints in launch period

**Red Flags:**
• >3 open actions at any gate without closure plan
• PFMEA AP not updated after Phase 4 changes
• MSA not completed before production trial`,
  },

  // -- PPAP --------------------------------------------------------------------
  {
    keys: ['ppap element', '18 element', 'ppap 18', 'ppap requirement', 'what is ppap'],
    title: 'PPAP — 18 Elements',
    response: `**PPAP — 18 Elements (AIAG 4th Edition)**

1. **Design Records** — Engineering drawings, CAD, specs
2. **Authorised Engineering Change Documents** — All ECNs incorporated
3. **Customer Engineering Approval** — Customer sign-off on design
4. **Design FMEA (DFMEA)** — Risk analysis of design
5. **Process Flow Diagram (PFD)** — All process steps numbered
6. **Process FMEA (PFMEA)** — Risk analysis of process
7. **Control Plan** — Production control plan, Phase 4
8. **Measurement System Analysis (MSA)** — GRR for all CC/SC gauges
9. **Dimensional Results** — 6-piece dimensional (min.) per drawing
10. **Material/Performance Test Results** — Lab results, material certs
11. **Initial Process Capability Study** — Cpk ≥ 1.67 for CC, ≥1.33 for SC
12. **Qualified Lab Documentation** — ISO/IEC 17025 accredited for externals
13. **Appearance Approval Report (AAR)** — For appearance items only
14. **Sample Production Parts** — Typically 3 samples (Level 3)
15. **Master Sample** — Retained reference sample
16. **Checking Aids** — Gauges, fixtures, jigs used for inspection
17. **Customer-Specific Requirements (CSR)** — Ford Q1, GM BIQS, etc.
18. **Part Submission Warrant (PSW)** — Summary sign-off document

**Submission Levels:**
L1: PSW only | L2: PSW + limited samples | L3: PSW + full package | L4: PSW + other | L5: Full package at plant`,
  },
  {
    keys: ['ppap submission level', 'level 1', 'level 2', 'level 3', 'level 4', 'level 5', 'psw'],
    title: 'PPAP Submission Levels',
    response: `**PPAP Submission Levels — Decision Guide**

**Level 1 — Warrant Only**
Submit: PSW (Part Submission Warrant) only. Retain all other documentation at plant.
Use: Minor changes, customer trust-based, proprietary processes.

**Level 2 — Warrant + Limited Samples**
Submit: PSW + product samples + limited supporting data (dimensional, test results).
Use: New parts from existing similar process, customer request.

**Level 3 — Warrant + Complete Supporting Data** (Default)
Submit: PSW + all applicable elements (dimensional, capability, MSA, material test, AAR if needed).
Use: New part number, new supplier, new process — this is the AIAG default.

**Level 4 — Warrant + Other Requirements**
Submit: As specified by customer. Customer defines exactly what to submit.
Use: Customer-specific PPAP requirements (Ford, GM Stellantis often define this).

**Level 5 — Warrant + Complete Data At Plant**
Submit: Complete package but reviewed at supplier plant with customer present.
Use: Complex parts, critical safety items, first-time supplier.

**PSW Key Fields:** Part number, revision, weight, material, submission level, reason for submission, declaration of conformance, signatures.

**Re-PPAP Triggers:** Engineering change, new supplier/material, new process, plant move, tooling change, >12 months shutdown.`,
  },
  {
    keys: ['ppap cpk', 'ppap capability', 'initial process capability', 'cpk 1.67', 'ppap spc'],
    title: 'PPAP Capability Requirements',
    response: `**PPAP Initial Process Capability Study**

**Minimum Sample Size:** 300 consecutive pieces from production trial (same tooling, operators, conditions as SOP).

**Acceptance Criteria:**
• Critical Characteristics (CC/★): Cpk ≥ 1.67
• Significant Characteristics (SC/◆): Cpk ≥ 1.33
• General dimensions: Cpk ≥ 1.33 (some customers require 1.67 for all)

**What to Report:**
• Cpk (process capability index — accounts for process location)
• Ppk (performance index — accounts for long-term variation)
• Mean, standard deviation, min, max
• Histogram with normal distribution overlay
• Control chart (X-bar R or Individuals/MR)

**If Cpk < Required:**
• Submit with corrective action plan and timeline
• Customer may approve conditionally with 100% inspection
• Do not start production without customer written approval
• Update PFMEA and Control Plan to reflect additional controls

**Common PPAP Capability Mistakes:**
• Using prototype or pre-production data instead of production trial
• Using non-production tooling/fixtures
• Sample not drawn consecutively
• Not documenting special causes during study`,
  },

  // -- PFMEA -------------------------------------------------------------------
  {
    keys: ['pfmea 7 step', 'seven step', 'fmea step', 'aiag vda fmea', 'pfmea overview', 'what is pfmea'],
    title: 'PFMEA — AIAG-VDA 7-Step Approach',
    response: `**PFMEA — AIAG-VDA 2019 7-Step Approach**

**Step 1 — Planning & Preparation**
Define scope: What process is in scope? Which process steps (PFD numbers)? Which team members? Timing plan for PFMEA completion.

**Step 2 — Structure Analysis**
Build the Process Structure Tree: System > Subsystem > Process step > Work element. Each PFD step = one PFMEA row.

**Step 3 — Function Analysis**
For each process step: What is the intended function? What is the process characteristic to achieve it? Use verb-noun format: "Weld joint to achieve tensile strength ≥500N."

**Step 4 — Failure Analysis**
FM (Failure Mode) → FE (Failure Effect on customer) → FC (Failure Cause — the root cause).
Think: What can go wrong? → What happens to customer? → What causes it?

**Step 5 — Risk Analysis**
Rate Severity (S), Occurrence (O), Detection (D) on 1–10 scales per AIAG-VDA tables.
Determine Action Priority (AP): H / M / L using AP lookup table (replaces RPN).

**Step 6 — Optimisation**
For all High AP items: mandatory action required. For Medium AP: action recommended.
Document: Prevention Action (reduces O) and Detection Action (reduces D).

**Step 7 — Results Documentation**
Update PFMEA after actions implemented. Verify AP improved. Link to Control Plan and Work Instructions.

**Key Change from Old AIAG 4th Ed:** RPN (S×O×D) is replaced by AP (H/M/L). A High Severity item with Low O and Low D is still High AP under new rules.`,
  },
  {
    keys: ['action priority', 'ap table', 'severity occurrence detection', 'sod scale', 's o d rating'],
    title: 'PFMEA — S/O/D Scales & Action Priority',
    response: `**PFMEA S/O/D Rating Scales (AIAG-VDA 2019)**

**Severity (S) — Effect on Customer:**
10: Safety/regulatory failure | 9: Loss of primary function | 8: Significantly reduced function | 7: Vehicle operable, comfort reduced | 6: Degraded appearance | 5: Fit/finish/squeak/rattle | 4: Minor assembly/manufacturing | 3: Very minor appearance | 2: No discernible effect | 1: No effect

**Occurrence (O) — Cause Frequency:**
10: ≥1 in 2 | 9: 1 in 8 | 8: 1 in 20 | 7: 1 in 80 | 6: 1 in 400 | 5: 1 in 2,000 | 4: 1 in 15,000 | 3: 1 in 150,000 | 2: 1 in 1,500,000 | 1: Virtually impossible

**Detection (D) — Control Effectiveness:**
10: No control | 9: Unlikely to detect | 8: Difficult to detect | 7: Remote chance | 6: Moderate chance | 5: Moderately high | 4: High detect chance | 3: Very high | 2: Almost certain | 1: Always detected

**Action Priority (AP) Determination:**
High (H): Mandatory action required. High severity combinations regardless of O/D.
Medium (M): Action recommended. High-medium risk combinations.
Low (L): Consider action. Review may justify current controls.

**Rule:** S=9 or 10 = Always High AP regardless of O and D.
**Rule:** S=8 with O=4+ = High or Medium AP depending on D.

Use the AIAG-VDA AP table (not formula) — it's a lookup, not S×O×D multiplication.`,
  },
  {
    keys: ['pfmea special characteristic', 'cc sc pfmea', 'critical characteristic pfmea', 'severity 9 10'],
    title: 'PFMEA — Special Characteristics',
    response: `**Special Characteristics in PFMEA**

**Classification:**
• CC (Critical Characteristic / ★): Safety or regulatory impact. Failure could injure user. Severity 9–10. IATF mandates 100% inspection or Cpk ≥ 1.67 + SPC.
• SC (Significant Characteristic / ◆): Major functional impact. Severity 7–8. Cpk ≥ 1.33 required. Enhanced monitoring.

**PFMEA Rules for CC/SC:**
• Any failure mode with S = 9 or 10 → automatically CC
• CC/SC in PFMEA must appear in Control Plan with: gauge type, frequency, sample size, reaction plan
• CC/SC must appear in Work Instructions with operator awareness symbols
• Detection control for CC: must be ≤ D4 (high detection probability). D=1 or 2 preferred.

**Cascade Flow:**
Drawing (symbol) → PFD (noted) → PFMEA (S rating drives classification) → Control Plan (required fields) → Work Instruction (operator instruction)

**Common Mistakes:**
• CC in PFMEA not reflected in Control Plan
• No reaction plan documented for CC out-of-spec
• Gauge R&R not completed for CC measurement system
• CC listed with D=8 or 9 (auditor will flag — detection too low for critical)`,
  },

  // -- Control Plan -------------------------------------------------------------
  {
    keys: ['control plan field', 'control plan header', 'what is control plan', 'control plan overview', 'aiag control plan'],
    title: 'Control Plan — Structure & Fields',
    response: `**Control Plan — AIAG 1st Edition (2024)**

**Header Fields (Fields 1–10):**
1. Control Plan Number | 2. Phase (Prototype/Pre-Launch/Production/Safe Launch)
3. Part Number / Latest Change Level | 4. Part Name / Description
5. Supplier / Plant | 6. Supplier Code | 7. Key Contact / Phone
8. Core Team Members | 9. Date (Original) | 10. Date (Revision)

**Approval Fields (11–16):**
Customer Engineering Approval, Supplier Plant Approval, Customer Quality Approval — each with date field.

**Process Step Columns (Fields 17–26):**
17. Part/Process Number (must match PFD)
18. Process Name/Operation Description
19. Machine/Device/Jig/Tools for Manufacturing
20. Characteristics: Product vs. Process (P/D/S)
21. Special Characteristic Classification (CC/SC/None)
22. Product/Process Specification & Tolerance
23. Evaluation/Measurement Technique (gauge, CMM, visual)
24. Sample Size & Frequency
25. Control Method (SPC, visual, attribute, mistake-proof)
26. Reaction Plan

**Reaction Plan (Field 26) must state:**
• Who takes action? (operator, supervisor)
• What immediate action? (stop, tag, quarantine, call supervisor)
• Where does non-conforming product go? (MRB, red-tag area)
• Who approves disposition?

**Linkage:** Control Plan row numbers must match PFD step numbers and PFMEA row scope.`,
  },
  {
    keys: ['control plan reaction plan', 'reaction plan', 'out of control', 'control method'],
    title: 'Control Plan — Reaction Plans',
    response: `**Control Plan Reaction Plan — Best Practice**

**What a Reaction Plan MUST Include:**
1. Stop production immediately if: [specific trigger condition]
2. Segregate and tag suspect product from [last good check] to [current point]
3. Notify: [Supervisor name/role] within [timeframe, e.g., 15 minutes]
4. Perform [specific action: 100% inspection, rework, scrap, hold for engineering]
5. Record on: [which form/system — NCR, MRB tag, SAP transaction]
6. Resume production only after: [supervisor sign-off / engineering approval / process corrected]

**Common Audit Finding:** Reaction plan says "inform supervisor" — auditor asks: "What does the supervisor do? Where does the product go? Who approves restart?" — these must be in the plan.

**SPC Reaction Plan (for control charts):**
When point outside control limits OR Western Electric rule violation:
1. Circle the out-of-control point on chart
2. Stop adjusting the process — investigate the cause
3. Identify and document the assignable cause
4. Take corrective action and note on chart
5. If product affected: [quantity, disposition]
6. If cause unknown: quarantine last [X] pieces until engineering review

**Auditor Test:** Hand the reaction plan to an operator — can they follow it without asking questions?`,
  },
  {
    keys: ['control plan spc', 'spc frequency', 'sample size control plan', 'control chart control plan'],
    title: 'Control Plan — SPC & Sampling',
    response: `**Control Plan — SPC & Sampling Requirements**

**When to Use SPC (SPC column in CP):**
• All CC characteristics: mandatory SPC
• SC characteristics: recommended SPC
• High-volume process dimensions: use SPC
• Attribute data (pass/fail): use attribute charts (p, np, c, u)

**Sample Size & Frequency Guidelines:**
• CC characteristics: n=5, every 1–2 hours minimum
• SPC chart type: X-bar & R chart (variable data, n=2–10) or Individuals/MR (n=1)
• First article: 100% inspection of first piece at shift start or tooling change
• Audit frequency: 100% for all CC at incoming

**Control Chart Selection:**
Variable data (measurement): X-bar R (subgroup n=2–10), X-MR (n=1, short run)
Attribute data (count): p-chart (% defective), np-chart (# defective), c-chart (# defects/unit)

**Link to PFMEA:**
Detection (D) rating in PFMEA should reflect your actual control method:
D=2: 100% automated inspection (poka-yoke)
D=3: 100% manual inspection
D=5: SPC with responsive reaction
D=7: Periodic audit inspection
D=9: No systematic inspection

**Common Gap:** Control Plan says SPC but the floor still uses X-bar R chart with n=3 at end of shift — that is not SPC, that is a spot check.`,
  },

  // -- SPC ---------------------------------------------------------------------
  {
    keys: ['cpk', 'cp', 'ppk', 'pp', 'process capability', 'capability index', 'what is cpk'],
    title: 'SPC — Cp, Cpk, Pp, Ppk Explained',
    response: `**Process Capability Indices — Cp, Cpk, Pp, Ppk**

**Cp (Capability Potential):**
Cp = (USL - LSL) / (6σ_within)
Measures spread only — how wide is tolerance vs. process spread. Ignores centering.
Cp = 1.33 means tolerance is 1.33× wider than ±3σ range.

**Cpk (Capability Index — Centered):**
Cpk = min[ (USL - X̄) / (3σ), (X̄ - LSL) / (3σ) ]
Accounts for BOTH spread AND centering. This is the primary capability metric.
Cpk < Cp: process is off-center. Cpk = Cp: process is perfectly centered.

**Pp and Ppk (Performance — Long Term):**
Same formulas but use σ_total (standard deviation of all data) instead of σ_within (from control chart).
Pp/Ppk used for: PPAP initial study (production trial data), long-term performance reporting.

**Acceptance Criteria:**
• Cpk ≥ 1.67: CC characteristics (PPAP requirement, safety-critical)
• Cpk ≥ 1.33: SC characteristics and general PPAP
• Cpk ≥ 1.00: Minimum acceptable (process barely fits within tolerance)
• Cpk < 1.00: Process producing nonconforming product

**What to do when Cpk is low:**
1. Reduce variation (σ↓): tighten process control, eliminate special causes
2. Center the process (X̄ toward target): adjust process setting
3. Never widen the tolerance without engineering approval`,
  },
  {
    keys: ['control chart', 'xbar r chart', 'x mr chart', 'western electric', 'weco rule', 'out of control', 'control limit'],
    title: 'SPC — Control Charts & WECO Rules',
    response: `**SPC — Control Charts & Out-of-Control Rules**

**X-bar & R Chart (most common for n=2–10):**
• UCL_X = X̄̄ + A₂R̄ | LCL_X = X̄̄ - A₂R̄
• UCL_R = D₄R̄ | LCL_R = D₃R̄ (for n≤6, LCL_R = 0)
• Constants A₂, D₃, D₄ depend on subgroup size n

**Individuals/MR Chart (for n=1):**
• UCL_X = X̄ + 3σ (where σ = MR̄/1.128)
• Use when: batch process, slow process, one measurement per cycle

**8 Western Electric (WECO) Rules — Out-of-Control Signals:**
1. One point beyond ±3σ (outside control limits)
2. Two of three consecutive points beyond ±2σ on same side
3. Four of five consecutive points beyond ±1σ on same side
4. Eight consecutive points on same side of centreline
5. Six consecutive points trending up or down
6. Fifteen consecutive points within ±1σ (stratification)
7. Fourteen consecutive points alternating up/down
8. Eight consecutive points beyond ±1σ on both sides (mixture)

**Process Stable vs. Capable:**
• Stable = no special causes (all WECO rules satisfied)
• Capable = Cpk meets target
• A process can be stable but not capable (consistent but off-target)
• A process can be capable but unstable (lucky average, erratic)

**Always control stability first, then assess capability.**`,
  },
  {
    keys: ['spc for cc', 'spc special characteristic', 'spc iatf', 'spc requirement', 'process stability'],
    title: 'SPC — IATF Requirements & Application',
    response: `**SPC — IATF 16949 Requirements**

**Clause 9.1.1.1 — Monitoring & Measurement of Manufacturing Processes:**
• SPC mandatory for all CC (Critical Characteristics)
• Process must be demonstrated STABLE before capability is assessed
• Control charts must be maintained and reviewed daily
• Reactions to out-of-control signals must be documented

**What Auditors Check:**
1. Is there a control chart at the workstation for each CC?
2. Is the chart current? (updated each subgroup)
3. Are control limits calculated from actual process data (not specification limits)?
4. Is there evidence of reaction when out-of-control signals occur?
5. Is the operator trained to read and respond to the chart?
6. Is Cpk calculated and does it meet the target?

**Common Nonconformities:**
• Control limits set equal to drawing tolerances (incorrect — CLs must come from process data)
• Chart at workstation but data entry stopped 3 days ago
• Out-of-control point circled but no documented reaction
• CC characteristic not under SPC (only periodic audit)
• Cpk < 1.33 but no corrective action initiated

**Pre-Control vs. SPC:**
Pre-control is NOT a substitute for SPC. IATF requires statistical process control — not traffic light systems alone.`,
  },

  // -- MSA ---------------------------------------------------------------------
  {
    keys: ['msa', 'measurement system analysis', 'gauge r&r', 'grr', 'what is msa', 'msa overview'],
    title: 'MSA — Measurement System Analysis Overview',
    response: `**MSA — AIAG 4th Edition Overview**

**Why MSA?** Before trusting measurement data (for PPAP, SPC, incoming inspection), you must verify the measurement system itself is acceptable. Poor gauges inflate variability and give false Cpk.

**5 Key MSA Studies:**

**1. GRR (Gauge Repeatability & Reproducibility)**
• Repeatability: Same operator, same part, same gauge — does it give same reading?
• Reproducibility: Different operators — do they get the same readings?
• Run: 2–3 operators × 10 parts × 2–3 trials (AIAG standard: 2 ops × 10 parts × 2 trials minimum)

**2. Bias Study** — Is the gauge reading the true value? Compare gauge reading to reference (master).

**3. Linearity Study** — Is bias consistent across the full operating range? Test at low, mid, high range.

**4. Stability Study** — Does the gauge give the same reading over time (weeks/months)? Use a master part, measure daily or weekly.

**5. Attribute Agreement Analysis (AAA)** — For attribute gauges (go/no-go, visual). Kappa statistic measures agreement.

**IATF Requirement (Cl. 7.1.5.1):** MSA required for all measurement systems in the Control Plan for CC/SC characteristics before production start (PPAP Gate 4).`,
  },
  {
    keys: ['grr acceptance', 'grr result', 'grr percentage', '%grr', 'ndc', 'gauge r&r interpret', 'grr criteria'],
    title: 'GRR — Acceptance Criteria & Interpretation',
    response: `**GRR — Results Interpretation & Acceptance Criteria**

**%GRR (% of Study Variation or % of Tolerance):**
• < 10%: Excellent — measurement system acceptable for all uses
• 10–30%: Marginal — may be acceptable based on application, cost, importance
• > 30%: Unacceptable — measurement system must be improved before use

**Note:** %GRR = √(GRR² / Total Study Variation²) × 100

**ndc (Number of Distinct Categories):**
• ndc ≥ 5: Acceptable — gauge can distinguish at least 5 categories within the process variation
• ndc < 5: Unacceptable — gauge cannot distinguish enough levels
• Formula: ndc = 1.41 × (PV / GRR) — where PV = part variation

**Repeatability vs. Reproducibility:**
• If Repeatability >> Reproducibility: gauge problem (worn, imprecise, wrong fixture)
• If Reproducibility >> Repeatability: operator problem (technique, training, reading difference)

**What to Do When GRR Fails:**
Repeatability high: Check fixture, check gauge condition, tighten gauge maintenance
Reproducibility high: Re-train operators on measurement technique, standardise method in WI
Both high: Consider automated measurement, higher-resolution gauge, or CMM

**Report to Customer:** GRR results must be in PPAP Element 8. %GRR and ndc both reported.`,
  },
  {
    keys: ['msa study plan', 'msa plan', 'grr study', 'msa iatf', 'how to do grr', 'grr steps'],
    title: 'MSA Study Plan — Step-by-Step',
    response: `**GRR Study — 7-Step Execution Guide**

**Step 1 — Select Parts**
Choose 10 parts spanning the full range of normal process variation (not just within spec — include near-boundary parts). Do NOT tell operators which parts are borderline.

**Step 2 — Select Operators**
Choose 2–3 operators who normally use this gauge. Cross-shift if possible. Do not use the best operator only.

**Step 3 — Prepare the Gauge**
Calibrate / verify calibration status. Record last calibration date and due date.

**Step 4 — Blind Study**
Number parts 1–10 but randomise order for each operator and each trial. Operators must NOT know other operators' readings during the study.

**Step 5 — Conduct Measurements**
Operator A measures all 10 parts (Trial 1). All other operators repeat. Then all do Trial 2 (and Trial 3 if planned). Record on GRR data sheet.

**Step 6 — Calculate & Analyse**
Use AIAG GRR worksheet or Minitab/QS-STAT. Calculate: %GRR, ndc, Repeatability, Reproducibility, Part Variation.

**Step 7 — Document & Act**
If %GRR < 10%: Accept, include in PPAP. If 10–30%: Document risk acceptance. If >30%: Correct and repeat study.

**IATF Evidence Required:** Completed GRR data sheet, results summary, approval signature, gauge ID, parts used, operators named.`,
  },

  // -- General Quality ----------------------------------------------------------
  {
    keys: ['8d', 'eight discipline', 'eight d', '8d report'],
    title: '8D Problem Solving',
    response: `**8D Problem Solving — Structure**

**D0 — Emergency Response Action (ERA)**
If customer impact is immediate: contain before completing the full 8D. Sort, inspect, rework — protect the customer NOW.

**D1 — Team Formation**
Cross-functional: Quality, Production, Engineering, Supplier (if applicable). Appoint Team Champion (management sponsor) and Team Leader.

**D2 — Problem Description**
IS / IS-NOT analysis. What? Where? When? How many? How big?
Format: "[What] was found at [Where] causing [Effect] — [Quantity] units affected since [When]."

**D3 — Containment (ICA)**
Within 24–48 hours. 100% inspection, sorting, quarantine, rework. Verify containment is effective.

**D4 — Root Cause Analysis**
5-Why for Occurrence Root Cause AND Escape Root Cause separately.
Validate: "If we remove this cause, does the problem disappear?"

**D5 — Corrective Actions (PCA)**
Select PCAs that eliminate both root causes. Pilot test. Verify no new problems introduced.

**D6 — Implement PCAs**
Update: Control Plan, PFMEA, WI, inspection criteria. Measure before vs. after. Verify zero recurrence.

**D7 — Prevent Recurrence**
Apply to similar processes/products/plants. Update lessons learned database. Modify PFMEA risk rating.

**D8 — Team Recognition**
Management sign-off. Close 8D in system. Share learnings.

**Auditor Focus:** D4 validation, D7 systemic prevention, and D6 evidence are the three most scrutinised steps.`,
  },
  {
    keys: ['iatf', 'iatf 16949', 'certification', 'iatf clause', 'iso 9001'],
    title: 'IATF 16949 — Key Clauses',
    response: `**IATF 16949 — Core Clauses Quick Reference**

**Clause 4 — Context:** 4.1 Internal/external issues. 4.2 Interested parties. 4.4 Process approach — Turtle diagrams required.

**Clause 5 — Leadership:** 5.1 Top management personal involvement. 5.2 Quality Policy — displayed, understood. 5.3 Roles documented.

**Clause 6 — Planning:** 6.1 Risk AND opportunities. 6.2 SMART quality objectives. 6.3 Controlled change management.

**Clause 7 — Support:**
7.1.5: MSA/GRR required for CC/SC characteristics.
7.2: Competency — trained, qualified, assessed. Evidence required.
7.5: Controlled documents — version managed.

**Clause 8 — Operation:**
8.3: APQP — design and development planning, DFMEA, DVP.
8.3.4: PPAP — Level 1–5 submission, PSW approval.
8.4: Supplier control — approved list, audits, scorecards.
8.5.1.1: Control Plans — prototype, pre-launch, production.
8.6.2: Layout inspection — full dimensional verification periodically.
8.7: Nonconforming output — quarantine, disposition, segregation.

**Clause 9 — Evaluation:**
9.1.1: SPC for CC characteristics.
9.2: Internal audit — process, product, system audits.
9.3: Management review — all mandatory inputs documented.

**Clause 10 — Improvement:** 10.2 8D-format corrective actions with systemic prevention.

**Top Audit Findings:** Missing MSA evidence (7.1.5), PFMEA not linked to Control Plan (8.5.1), operator competency not demonstrated (7.2), management review missing inputs (9.3).`,
  },
  {
    keys: ['capa', 'corrective action', 'preventive action', 'root cause', 'nonconformity'],
    title: 'CAPA — Corrective & Preventive Action',
    response: `**CAPA — Corrective & Preventive Action (IATF Cl. 10.2)**

**Corrective Action Process:**
1. Nonconformity identified (customer complaint, audit, internal rejection)
2. Containment/immediate correction (same day)
3. Root cause analysis (D4 methodology — 5-Why, Ishikawa)
4. Corrective action (systemic change — not just "retrain operator")
5. Implementation and verification
6. Effectiveness check (30/60/90 days — is recurrence zero?)
7. Horizontal deployment (same issue at other lines/plants?)
8. Close CAPA with management review signature

**Effective Root Cause — 5 Tests:**
• If you fix this cause, does the problem permanently stop?
• Is it specific enough to take action on?
• Can you verify it actually caused the failure?
• Is it within your control to fix?
• Does it address both occurrence AND escape?

**Common CAPA Failures:**
• Root cause = "operator error" or "human error" (not deep enough)
• Corrective action = "retrain operator" (not systemic)
• No effectiveness verification planned
• CAPA closed before effectiveness verified
• Same issue recurring — PFMEA not updated to prevent recurrence

**Preventive Action:** Change the PFMEA before a failure happens. Use lessons learned from similar products/processes.`,
  },
  {
    keys: ['hello', 'hi', 'help', 'what can you do', 'start', 'assist', 'who are you'],
    title: 'AI Quality Copilot',
    response: `**Welcome to AI Quality Copilot** 🤖

I am your embedded Quality Intelligence Assistant — context-aware for this tool and tab.

**I can help you with:**
• APQP phases, gate reviews, timing plans, deliverables
• PPAP 18 elements, submission levels, PSW, Cpk requirements
• PFMEA 7-step approach, S/O/D ratings, Action Priority
• Control Plan fields, reaction plans, special characteristics
• SPC: Cp/Cpk/Pp/Ppk, control charts, WECO rules
• MSA: GRR study, %GRR acceptance, ndc, attribute agreement
• IATF 16949 clauses, audit questions, common nonconformities
• 8D problem solving, CAPA, root cause analysis

**Try asking:**
• "What are the 5 APQP phases?"
• "When is re-PPAP required?"
• "How do I interpret %GRR results?"
• "What is Action Priority in PFMEA?"
• "How to write a Control Plan reaction plan?"`,
  },
];

// -- Context Prompts -------------------------------------------------------------
export const CONTEXT_PROMPTS: Record<string, string[]> = {
  // APQP
  'apqp:overview': ['What are the 5 APQP phases?', 'What is an APQP gate review?', 'What does APQP 3rd Edition change?', 'What are APQP KPIs?'],
  'apqp:5 phases': ['What inputs/outputs does Phase 1 have?', 'What happens in Phase 3?', 'What is the APQP Phase 4 production trial?', 'How do PFD, PFMEA and Control Plan link?'],
  'apqp:generator': ['How to create an APQP timing plan?', 'What milestones must be in APQP plan?', 'How to set APQP team roles?', 'What is a feasibility commitment?'],
  'apqp:analyser': ['How do I score APQP maturity?', 'What are APQP health KPIs?', 'What are common APQP gaps?', 'How to recover a delayed APQP program?'],
  'apqp:qa': ['What are common APQP interview questions?', 'How does auditor assess APQP?', 'What is the most common APQP audit finding?', 'What evidence does auditor ask for in APQP?'],
  'apqp:templates': ['How to use the APQP timing plan template?', 'What goes in Open Issues List?', 'How to complete gate review checklist?', 'What is the feasibility analysis form?'],
  'apqp:supporting docs': ['What is APQP vs PPAP relationship?', 'How to handle special characteristics in APQP?', 'What is the APQP 3rd Edition standard?', 'What are customer APQP specific requirements?'],
  'apqp:posters & banners': ['What is the APQP phase flow?', 'How to display APQP in factory?', 'What are APQP team RACI roles?', 'How to use gate review banner?'],

  // PPAP
  'ppap:overview': ['What are the PPAP 18 elements?', 'What is a Part Submission Warrant?', 'When is re-PPAP required?', 'What is the default PPAP level?'],
  'ppap:guide': ['What is Level 3 PPAP?', 'What Cpk is required for PPAP?', 'What is an AAR in PPAP?', 'What are customer-specific PPAP requirements?'],
  'ppap:generator': ['How to build a PPAP submission package?', 'What goes in dimensional results sheet?', 'How to complete PPAP checklist?', 'What MSA is required for PPAP?'],
  'ppap:analyser': ['How to check PPAP completeness?', 'What are common PPAP submission mistakes?', 'How to track PPAP status across parts?', 'What makes a strong PPAP package?'],
  'ppap:qa': ['What do auditors check in PPAP?', 'What are common PPAP audit findings?', 'What PPAP questions do customers ask?', 'How to defend PPAP in an audit?'],
  'ppap:templates': ['How to fill PSW form correctly?', 'What is in dimensional results template?', 'How to use PPAP status tracker?', 'What is PPAP 18-element checklist?'],
  'ppap:supporting docs': ['What is PPAP vs APQP relationship?', 'What is submission level decision guide?', 'What is PPAP audit checklist?', 'How to handle PPAP for engineering changes?'],
  'ppap:posters & banners': ['What are the PPAP 18 elements visually?', 'What triggers re-PPAP?', 'How does PPAP link to APQP?', 'What is PSW sign-off flow?'],

  // PFMEA
  'pfmea:overview': ['What is the AIAG-VDA 7-step PFMEA?', 'How is AP different from RPN?', 'When must PFMEA be updated?', 'What IATF clause covers PFMEA?'],
  'pfmea:guide': ['How do I rate Severity, Occurrence, Detection?', 'What determines Action Priority (AP)?', 'How to link PFMEA to Control Plan?', 'What is the PFMEA structure tree?'],
  'pfmea:generator': ['How to write a PFMEA failure mode?', 'How to identify failure effects and causes?', 'How to select prevention vs detection actions?', 'How to number PFMEA rows to match PFD?'],
  'pfmea:analyser': ['How to assess PFMEA quality?', 'What are PFMEA health KPIs?', 'How many High AP items are acceptable?', 'How to prioritise PFMEA action plans?'],
  'pfmea:qa': ['What do auditors ask in PFMEA review?', 'What are common PFMEA nonconformities?', 'How to defend PFMEA RPN vs AP change?', 'What is the PFMEA audit checklist?'],
  'pfmea:templates': ['How to use PFMEA blank worksheet?', 'What is the AP lookup table?', 'How does PFMEA link to control plan template?', 'What is PFMEA audit checklist format?'],
  'pfmea:supporting docs': ['How to migrate from RPN to Action Priority?', 'How to handle CC/SC in PFMEA?', 'What are common PFMEA IATF findings?', 'What is PFMEA for 4M changes?'],
  'pfmea:posters & banners': ['What is the PFMEA 7-step visual?', 'How to display S/O/D scales in factory?', 'What is the PFD-PFMEA-CP trinity?', 'What are common PFMEA audit findings?'],

  // Control Plan
  'control-plan:overview': ['What are the Control Plan header fields?', 'What is a prototype vs production control plan?', 'What does IATF require for control plans?', 'How does Control Plan link to PFMEA?'],
  'control-plan:guide': ['What must a reaction plan include?', 'When do you need SPC in Control Plan?', 'What is special characteristic in control plan?', 'How to set sample size and frequency?'],
  'control-plan:generator': ['How to fill in Control Plan fields 17–26?', 'How to write a strong reaction plan?', 'How to classify CC vs SC characteristics?', 'How to select measurement technique?'],
  'control-plan:analyser': ['How to review Control Plan completeness?', 'What are common Control Plan audit findings?', 'Is my control plan linked to PFMEA?', 'How to score Control Plan quality?'],
  'control-plan:qa': ['What do auditors check in Control Plan?', 'What are most common CP nonconformities?', 'How to defend control frequency choices?', 'What evidence does IATF require for CP?'],
  'control-plan:templates': ['How to use control plan template?', 'What is the AIAG CP first edition format?', 'How to complete CP header fields?', 'How to add SPC to control plan?'],
  'control-plan:supporting docs': ['How does CP link to PFD and PFMEA?', 'What is IATF clause 8.5.1.1?', 'What is safe launch control plan?', 'How to use CP for PPAP submission?'],
  'control-plan:posters & banners': ['What is the PFD-PFMEA-CP trinity?', 'How to display control plan visually?', 'What is a reaction plan flow?', 'How to show special characteristics cascade?'],

  // SPC
  'spc:overview': ['What is SPC and why is it required?', 'What is the difference between Cp and Cpk?', 'When is SPC mandatory under IATF?', 'What are Western Electric rules?'],
  'spc:guide': ['How do I calculate Cpk?', 'How to set control limits correctly?', 'What is an X-bar R chart?', 'How to interpret control chart signals?'],
  'spc:generator': ['How to set up an X-bar R chart?', 'How to calculate control limits from data?', 'How to choose subgroup size?', 'How to write SPC study plan?'],
  'spc:analyser': ['Is my process capable (Cpk)?', 'Is my process in statistical control?', 'How to interpret my Ppk result?', 'What does Cpk < 1.33 mean for PPAP?'],
  'spc:qa': ['What do auditors check for SPC?', 'What are common SPC audit findings?', 'How to show SPC evidence in audit?', 'What is the IATF SPC requirement?'],
  'spc:templates': ['How to use SPC study template?', 'What is in Cpk calculation sheet?', 'How to use control chart template?', 'What is process capability report format?'],
  'spc:supporting docs': ['What is AIAG SPC 2nd Edition?', 'How to set up SPC system from scratch?', 'What is pre-control vs SPC?', 'How to train operators on SPC?'],
  'spc:posters & banners': ['How to display control chart in factory?', 'What is a Cpk visual guide?', 'How to show WECO rules visually?', 'What is SPC reaction poster?'],

  // MSA
  'msa:overview': ['What is MSA and why is it needed?', 'What are the 5 MSA studies?', 'What IATF clause requires MSA?', 'When must MSA be done before PPAP?'],
  'msa:guide': ['How do I interpret %GRR results?', 'What is ndc in GRR?', 'What is the difference between repeatability and reproducibility?', 'What is bias study?'],
  'msa:generator': ['How to plan a GRR study?', 'How many parts and operators for GRR?', 'How to conduct an AAA study?', 'How to write MSA study plan?'],
  'msa:analyser': ['Is my %GRR result acceptable?', 'What does ndc < 5 mean?', 'Why is my reproducibility high?', 'How to improve a failed GRR?'],
  'msa:qa': ['What do auditors check in MSA?', 'What are common GRR audit findings?', 'How to show MSA evidence in PPAP?', 'What questions do auditors ask about gauges?'],
  'msa:templates': ['How to use GRR data collection sheet?', 'What is MSA study plan template?', 'How to fill AAA study template?', 'What is gauge calibration record?'],
  'msa:supporting docs': ['What is the AIAG MSA 4th Edition?', 'How to select the right MSA study?', 'What is linearity vs stability study?', 'How to set up MSA programme?'],
  'msa:posters & banners': ['How to display MSA results in factory?', 'What is GRR decision tree?', 'How to show %GRR criteria visually?', 'What is MSA reference card?'],
};

export function getPrompts(tool: string, activeTab: string | number | undefined): string[] {
  const tabStr = typeof activeTab === 'number'
    ? ['overview', '5 phases', 'generator', 'analyser', 'qa', 'templates', 'supporting docs', 'posters & banners'][activeTab] ?? 'overview'
    : (activeTab ?? 'overview').toString().toLowerCase();
  const key = `${tool}:${tabStr}`;
  return CONTEXT_PROMPTS[key] || [
    `What is ${tool.toUpperCase()}?`,
    `What are the key requirements?`,
    `What do auditors check?`,
    `What are common mistakes?`,
  ];
}

// -- KB lookup ------------------------------------------------------------------
export function getResponse(input: string): { title: string; response: string } {
  const q = input.toLowerCase();
  for (const entry of KB) {
    if (entry.keys.some(k => q.includes(k))) {
      return { title: entry.title, response: entry.response };
    }
  }
  return {
    title: 'Quality Intelligence',
    response: `I have deep knowledge across all 6 AIAG Core Tools and IATF 16949.

**Try asking about:**
• APQP phases, gate reviews, timing plan, team setup
• PPAP 18 elements, submission levels, Cpk requirements
• PFMEA 7-step approach, Action Priority (AP), S/O/D scales
• Control Plan fields, reaction plans, special characteristics
• SPC: Cp/Cpk, control charts, WECO rules, process stability
• MSA: GRR study plan, %GRR interpretation, ndc, AAA
• 8D problem solving, CAPA, IATF clauses, supplier quality

Use the suggested prompts above or type your specific question.`,
  };
}

export function formatText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#818cf8;text-decoration:underline;font-weight:600;">$1 ↗</a>')
    .replace(/\n\n/g, '</p><p style="margin-top:8px">')
    .replace(/\n/g, '<br/>');
}

export function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

// -- Tool Labels & Icons --------------------------------------------------------
export const TOOL_META: Record<string, { label: string; icon: string; color: string }> = {
  'apqp':         { label: 'APQP',         icon: '📋', color: '#6366f1' },
  'ppap':         { label: 'PPAP',         icon: '✅', color: '#6366f1' },
  'pfmea':        { label: 'PFMEA',        icon: '⚠️', color: '#6366f1' },
  'control-plan': { label: 'Control Plan', icon: '📊', color: '#6366f1' },
  'spc':          { label: 'SPC',          icon: '📈', color: '#6366f1' },
  'msa':          { label: 'MSA',          icon: '🔬', color: '#6366f1' },
};

// -- Tool Resources (YouTube + Websites) ---------------------------------------
export const TOOL_RESOURCES: Record<string, {
  videos: { title: string; url: string }[];
  websites: { title: string; url: string }[];
}> = {
  apqp: {
    videos: [
      { title: 'APQP 3rd Edition 2024 Explained',    url: 'https://www.youtube.com/watch?v=LtCkz6ZgQWA' },
      { title: 'APQP in Real Life (Factory)',         url: 'https://www.youtube.com/watch?v=y00LgQxczro' },
      { title: 'What is APQP? — Simply Explained',   url: 'https://www.youtube.com/watch?v=BBrdQHoLk2k' },
      { title: '5 Core Tools Explained (APQP+)',     url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ' },
      { title: 'IATF 16949 Core Tools Overview',     url: 'https://www.youtube.com/watch?v=JQcagDtvkJw' },
    ],
    websites: [
      { title: 'AIAG — APQP & Control Plan Hub',    url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools' },
      { title: 'AIAG — APQP eLearning (Free)',       url: 'https://www.aiag.org/training-and-resources/elearning/details/ELAP' },
      { title: 'Quality-One — APQP Reference',       url: 'https://quality-one.com/quality-core-tools/' },
      { title: 'MS Matter — IATF Core Tools Guide',  url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/' },
    ],
  },
  ppap: {
    videos: [
      { title: 'IATF 16949 Core Tools — PPAP Focus', url: 'https://www.youtube.com/watch?v=JQcagDtvkJw' },
      { title: '5 Core Tools Explained incl. PPAP',  url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ' },
      { title: '6 Core Tools Full Overview',          url: 'https://www.youtube.com/watch?v=emWcnV8JC3U' },
      { title: '6 Core Quality Tools Explained',     url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko' },
      { title: 'Core Tools Full Playlist',            url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK' },
    ],
    websites: [
      { title: 'AIAG — PPAP 4th Edition Hub',        url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools' },
      { title: 'AIAG — All Core Tool Manuals',       url: 'https://www.aiag.org/training-and-resources/manuals' },
      { title: 'Quality-One — PPAP Reference',       url: 'https://quality-one.com/quality-core-tools/' },
      { title: 'MS Matter — IATF Core Tools Guide',  url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/' },
    ],
  },
  pfmea: {
    videos: [
      { title: 'IATF 16949 CORE TOOLS — PFMEA',      url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4' },
      { title: '5 Core Tools Explained incl. FMEA',  url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ' },
      { title: 'IATF 16949 Core Tools Overview',     url: 'https://www.youtube.com/watch?v=JQcagDtvkJw' },
      { title: '6 Core Quality Tools Explained',     url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko' },
      { title: 'Core Tools Full Playlist',            url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK' },
    ],
    websites: [
      { title: 'AIAG — FMEA Handbook (AIAG-VDA)',    url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools' },
      { title: 'AIAG — All Core Tool Manuals',       url: 'https://www.aiag.org/training-and-resources/manuals' },
      { title: 'Quality-One — FMEA Reference',       url: 'https://quality-one.com/quality-core-tools/' },
      { title: 'MS Matter — IATF Core Tools Guide',  url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/' },
    ],
  },
  'control-plan': {
    videos: [
      { title: 'IATF 16949 CORE TOOLS — Control Plan', url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4' },
      { title: '6 Core Tools Sequence — CP Position', url: 'https://www.youtube.com/watch?v=o19HNCytI2Q' },
      { title: '5 Core Tools Explained — CP included', url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ' },
      { title: 'IATF 16949 Core Tools Overview',      url: 'https://www.youtube.com/watch?v=JQcagDtvkJw' },
      { title: 'Core Tools Full Playlist',             url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK' },
    ],
    websites: [
      { title: 'AIAG — APQP & Control Plan Manual',  url: 'https://go.aiag.org/apqp-cp' },
      { title: 'AIAG — Quality Core Tools Hub',      url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools' },
      { title: 'Quality-One — Control Plan Ref.',    url: 'https://quality-one.com/quality-core-tools/' },
      { title: 'MS Matter — IATF Core Tools Guide',  url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/' },
    ],
  },
  spc: {
    videos: [
      { title: 'IATF 16949 Core Tools — SPC Focus',  url: 'https://www.youtube.com/watch?v=JQcagDtvkJw' },
      { title: '5 Core Tools Explained — SPC',       url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ' },
      { title: 'IATF 16949 CORE TOOLS Full Overview', url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4' },
      { title: '6 Core Quality Tools Explained',     url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko' },
      { title: 'Core Tools Full Playlist',            url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK' },
    ],
    websites: [
      { title: 'AIAG — SPC Manual 2nd Edition',      url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools' },
      { title: 'AIAG — All Core Tool Manuals',       url: 'https://www.aiag.org/training-and-resources/manuals' },
      { title: 'Quality-One — SPC Reference',        url: 'https://quality-one.com/quality-core-tools/' },
      { title: 'MS Matter — SPC in IATF Guide',      url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/' },
    ],
  },
  msa: {
    videos: [
      { title: 'IATF 16949 Core Tools — MSA Focus',  url: 'https://www.youtube.com/watch?v=JQcagDtvkJw' },
      { title: '5 Core Tools Explained — MSA',       url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ' },
      { title: 'IATF 16949 CORE TOOLS Full Overview', url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4' },
      { title: '6 Core Quality Tools Explained',     url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko' },
      { title: 'Core Tools Full Playlist',            url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK' },
    ],
    websites: [
      { title: 'AIAG — MSA Manual 4th Edition',      url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools' },
      { title: 'AIAG — All Core Tool Manuals',       url: 'https://www.aiag.org/training-and-resources/manuals' },
      { title: 'Quality-One — MSA Reference',        url: 'https://quality-one.com/quality-core-tools/' },
      { title: 'MS Matter — MSA in IATF Guide',      url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/' },
    ],
  },
};

export function getResourceLinks(tool: string): string {
  const r = TOOL_RESOURCES[tool];
  if (!r) return '';
  const videos   = r.videos.map(v => `• [${v.title}](${v.url})`).join('\n');
  const websites = r.websites.map(w => `• [${w.title}](${w.url})`).join('\n');
  return `\n\n---\n📺 **Watch on YouTube:**\n${videos}\n\n🌐 **Reference Websites:**\n${websites}\n\n▶ [QMB Training Channel](https://www.youtube.com/@qmbtraining) · [QualityWise Channel](https://www.youtube.com/channel/UC7MfSAkpOG6RRkKeeH4Rm7A) · [AIAG Official](https://www.aiag.org)`;
}

// -- Component -----------------------------------------------------------------
export default function CopilotWidget({ tool, activeTab }: CopilotWidgetProps) {
  const meta = TOOL_META[tool] ?? { label: tool.toUpperCase(), icon: '🤖', color: '#6366f1' };
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: '0', role: 'assistant', ts: now(),
    title: `${meta.label} AI Copilot`,
    text: `**${meta.label} AI Quality Copilot** ${meta.icon}\n\nI am your context-aware quality assistant for this tool. Ask me anything about ${meta.label}, IATF requirements, audit preparation, or quality best practices.\n\nUse the suggested prompts above or type your question below.`,
  }]);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const { title, response } = getResponse(text);
      const resources = getResourceLinks(tool);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', title, text: response + resources, ts: now() };
      setMessages(prev => [...prev, aiMsg]);
      setThinking(false);
    }, 700 + Math.random() * 500);
  };

  const prompts = getPrompts(tool, activeTab);
  const tabLabel = typeof activeTab === 'number'
    ? ['Overview', '5 Phases', 'Generator', 'Analyser', 'Q&A', 'Templates', 'Supporting Docs', 'Posters'][activeTab] ?? ''
    : (activeTab ?? '').toString();

  if (!mounted) return null;

  return createPortal(
    <>
      {/* -- Floating Toggle Button ------------------------------------------- */}
      <button
        className="no-print"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: '8px',
          background: open ? '#4f46e5' : 'linear-gradient(135deg,#6366f1,#818cf8)',
          color: '#fff', border: 'none', borderRadius: '50px',
          padding: '12px 20px', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
          transition: 'all 0.2s',
        }}
        title="AI Quality Copilot"
      >
        <span style={{ fontSize: '16px' }}>{open ? '✕' : '🤖'}</span>
        {open ? 'Close' : 'Ask AI'}
      </button>

      {/* -- Chat Panel ------------------------------------------------------- */}
      {open && (
        <div className="no-print" style={{
          position: 'fixed', bottom: '80px', right: '24px', zIndex: 99998,
          width: '380px', maxHeight: '580px',
          background: '#0f172a', borderRadius: '16px',
          border: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
            padding: '14px 16px', borderBottom: '1px solid rgba(99,102,241,0.2)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{meta.label} AI Copilot</div>
                <div style={{ color: '#a5b4fc', fontSize: '10px' }}>
                  {tabLabel ? `📍 ${tabLabel} tab` : 'IATF 16949 · AIAG Core Tools · 40+ yrs expertise'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: 600 }}>Live</span>
              </div>
            </div>

            {/* Context Prompts */}
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {prompts.map(p => (
                <button key={p} onClick={() => send(p)} style={{
                  fontSize: '10px', padding: '3px 9px', borderRadius: '20px',
                  background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#c7d2fe', cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '170px',
                  textOverflow: 'ellipsis',
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.title && msg.role === 'assistant' && (
                  <div style={{ fontSize: '9px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px', paddingLeft: '4px' }}>
                    {msg.title}
                  </div>
                )}
                <div style={{
                  maxWidth: '88%', padding: '9px 12px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#1e293b',
                  border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.15)' : 'none',
                  color: '#e2e8f0', fontSize: '11.5px', lineHeight: 1.6,
                }}>
                  <p style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                </div>
                <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px', paddingLeft: '4px', paddingRight: '4px' }}>{msg.ts}</div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#1e293b', borderRadius: '12px 12px 12px 4px', border: '1px solid rgba(99,102,241,0.15)', width: 'fit-content' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', animation: `bounce 0.9s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(99,102,241,0.15)', background: '#0f172a', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={`Ask about ${meta.label}...`}
                style={{
                  flex: 1, background: '#1e293b', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: '10px', padding: '8px 12px', color: '#e2e8f0',
                  fontSize: '12px', outline: 'none',
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || thinking}
                style={{
                  width: '34px', height: '34px', borderRadius: '10px', border: 'none',
                  background: input.trim() && !thinking ? '#6366f1' : '#334155',
                  color: '#fff', cursor: input.trim() && !thinking ? 'pointer' : 'default',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
              >
                ↑
              </button>
            </div>
            <div style={{ fontSize: '9px', color: '#475569', marginTop: '5px', textAlign: 'center' }}>
              IATF 16949 · AIAG Core Tools · Quality Intelligence
            </div>
          </div>
        </div>
      )}

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}
