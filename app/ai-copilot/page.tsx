'use client';
import { useState, useRef, useEffect } from 'react';

// -- Expert Knowledge Base -----------------------------------------------------
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
    keys: ['warranty', 'field failure', 'field return', 'warranty claim', 'dtf'],
    title: 'Warranty & Field Failure Analysis',
    response: `**Warranty & Field Failure — IATF 16949 Cl. 10.2.5 & 10.2.6**

**Warranty Process Flow:**
1. Receive warranty claim from customer / dealer
2. Retrieve returned part (R/3 — Request, Return, Repair)
3. Tear-down analysis — confirm failure mode, measure, photograph
4. Is it a Manufacturing defect, Design defect, or Misuse?
5. If manufacturing: initiate 8D/CAPA immediately
6. Update PFMEA with new failure mode if not already captured
7. Feed back to Control Plan — add detection control if escape point found

**Key Warranty KPIs:**
• Warranty PPM = (Warranty claims / Units sold) x 1,000,000
• Warranty Cost per Unit (CPU)
• Claims by Failure Mode (Pareto)
• Mean Time Between Failures (MTBF)
• No-Fault-Found (NFF) rate — high NFF = test/diagnostic problem

**Field Failure Analysis (FFA) Requirements:**
• Customer may require FFA report within 30–60 days
• Must include: tear-down photos, root cause, corrective action, prevention plan
• Format often customer-specific (GM GQTS, Ford WERS, Stellantis SIM)

**IATF 10.2.6 — Warranty Management System:**
• Organization must have a documented warranty management process
• Warranty data must be analysed for trends and patterns
• Results must feed into FMEA and product/process improvement

Never classify field failures as "customer misuse" without technical evidence. Auditors look for data proving the failure mechanism before accepting misuse classification.`,
  },
  {
    keys: ['incoming quality', 'iqc', 'receiving inspection', 'incoming inspection', 'incoming'],
    title: 'Incoming Quality Control (IQC)',
    response: `**Incoming Quality Control (IQC) — IATF 16949 Cl. 8.4.1**

**IQC Purpose:**
Verify conformance of purchased materials/parts before they enter production. Prevent defective incoming material from causing production problems or reaching customers.

**IQC Inspection Types:**
• 100% Inspection — for CC characteristics, new suppliers, or conditional suppliers
• Sampling Inspection — AQL-based (MIL-STD-1916 or equivalent), for approved suppliers
• Skip Lot — for suppliers with excellent PPM history (evidence-based exemption)
• Dock-to-Stock — certified suppliers, IATF-certified, zero defect history

**AQL Reference (Common):**
• AQL 0.65 — for CC characteristics (very tight)
• AQL 1.0 — for SC characteristics
• AQL 4.0 — for general characteristics

**IQC Documentation:**
• Incoming Inspection Report (part number, lot size, sample size, results)
• Material Identification Tag (lot number, quantity, status: ACCEPT/REJECT/HOLD)
• Rejection tag and quarantine location for rejected lots

**Rejection Handling:**
1. Tag and physically segregate rejected lot
2. Raise Supplier NCR / SCAR
3. Disposition: Return to supplier / Sort / Use-as-is (with concession approval)
4. Inform production of material status

**IQC KPIs:**
• Incoming PPM per supplier
• Incoming Rejection Rate (% of lots rejected)
• Supplier Response Time to IQC rejections
• Dock-to-Stock % (efficiency measure)

IATF requirement: Supplier-designated CC characteristics must be 100% verified at incoming regardless of supplier performance history.`,
  },
  {
    keys: ['outgoing quality', 'oqc', 'final inspection', 'outgoing inspection', 'pre-shipment'],
    title: 'Outgoing Quality Control (OQC)',
    response: `**Outgoing Quality Control (OQC) — IATF 16949 Cl. 8.6**

**OQC Purpose:**
Final gate before products reach the customer. Verify conformance to drawing, specification, and customer requirements before shipment.

**OQC Inspection Types:**
• Final Dimensional Inspection — check critical dimensions against drawing
• Functional Test — component/assembly performance verification
• Visual Inspection — surface finish, identification, labels, packaging
• Customer-Specific Checks — as per customer CSR (some require full layout)

**Product Audit (IATF Cl. 9.2.2.3):**
• Separate from final inspection — independent check of finished goods
• Audit 3–5 units per period against drawing + Control Plan
• Record results; raise CAPA if failures found

**OQC Release Criteria:**
• All dimensions within tolerance
• Functional test passed
• All CC/SC characteristics verified
• Paperwork complete (delivery note, COC, test reports)
• PPAP on file (PSW approved)

**Non-Conforming Product (Cl. 8.7):**
If OQC fails: Stop shipment → Quarantine → Disposition (rework/scrap/concession) → Notify customer if material already shipped

**OQC KPIs:**
• OQC Rejection Rate (% of lots failed)
• Customer Complaints vs OQC escape rate
• Cost of OQC failures (rework, scrap, expedite cost)

Key IATF point: OQC records are objective evidence for Cl. 8.6. Auditors check that product was verified before release — absence of OQC records = major NC.`,
  },
  {
    keys: ['in-process', 'ipqc', 'process inspection', 'patrol inspection', 'in process quality'],
    title: 'In-Process Quality Control (IPQC)',
    response: `**In-Process Quality Control (IPQC) — IATF 16949 Cl. 8.5.1**

**IPQC Purpose:**
Detect and contain defects at the source — during manufacturing — before they move to the next operation or reach the customer.

**Types of In-Process Controls:**
• First Article Inspection (FAI) — first piece of each shift, tool change, or material lot
• Patrol Inspection — roving inspector checks multiple stations at set frequency
• Operator Self-Check — operators verify their own work per Control Plan
• SPC Monitoring — control charts for CC characteristics
• Go/No-Go Gauging — quick pass/fail check at station

**Control Plan Drives IPQC:**
The Control Plan specifies: what to check, how to check, sample size, frequency, control method, and reaction plan. IPQC must follow it exactly.

**First Article Rules:**
• First piece verified before starting the run
• If first piece fails: Stop, adjust, verify again before continuing
• Record first article results with operator signature and time

**IPQC Response to Out-of-Control:**
1. Stop the process
2. Tag and segregate suspect material back to last good check
3. Notify Quality and Production Supervisor
4. Investigate cause before restarting
5. Record all actions in shift report

**IPQC KPIs:**
• Internal Rejection Rate (%)
• First Time Through Rate (FTT%)
• Number of in-process escapes to next operation
• Rework Hours per shift

Common mistake: IPQC frequency in the Control Plan says "every 2 hours" but production only checks once per shift. This is a direct IATF major NC under Cl. 8.5.1.`,
  },
  {
    keys: ['ncr', 'nonconforming', 'nonconformance', 'nc report', 'rejection report', 'quarantine'],
    title: 'Nonconforming Material (NCR) Management',
    response: `**Nonconforming Product/Material — IATF 16949 Cl. 8.7**

**NCR Definition:**
Any product, material, or component that does not meet specified requirements (drawing, specification, customer requirement).

**Mandatory Steps for Nonconforming Material:**
1. **Identification** — mark clearly: RED rejection tag, "HOLD", "REJECT"
2. **Segregation** — physically move to quarantine/cage/red bin area
3. **Documentation** — raise NCR with: part number, lot, quantity, defect description, photo
4. **Disposition Decision** — one of:
   - Scrap (destroy, record scrap cost)
   - Rework (to drawing, then re-inspect, re-record)
   - Use-as-is (concession — must have customer approval for CC/SC characteristics)
   - Return to Supplier (SCAR raised)
5. **Root Cause & CAPA** — for repeat or high-volume NCRs
6. **Record Retention** — NCR records per customer/IATF requirements (typically 15 years for safety parts)

**Customer Notification:**
If suspect material may have reached the customer: immediate notification within 24 hours. Provide containment status, quantity at risk, and 8D initiation.

**Shipped-on-Hold:**
Never ship a product with a known NC without written customer concession approval. Shipping on hold = automatic customer audit and potential disqualification.

**NCR KPIs:**
• Internal NCR count per week/month
• Top 3 defect categories (Pareto)
• Scrap cost (₹/month)
• Rework hours per week
• NCR to CAPA conversion rate

Auditor red flag: NCR tags not physically present on quarantined material, or quarantine area not locked/controlled.`,
  },
  {
    keys: ['oee', 'overall equipment', 'availability', 'performance rate', 'quality rate', 'tpm metric'],
    title: 'OEE — Overall Equipment Effectiveness',
    response: `**OEE — IATF 16949 Cl. 9.1.1 & Manufacturing Excellence**

**OEE Formula:**
OEE = Availability × Performance × Quality

**Three Components:**

**1. Availability = (Planned time − Downtime) / Planned time**
Planned time = total shift time minus planned breaks/meetings
Downtime = equipment breakdowns, changeover, setup, material shortage
Target: ≥ 90%

**2. Performance = Actual output / (Available time × Ideal cycle time)**
Captures slow running, minor stoppages, idling
Target: ≥ 95%

**3. Quality = Good parts / Total parts produced**
Captures scrap, rework, startup rejects
Target: ≥ 99%

**World-Class OEE:** ≥ 85% (Availability 90% × Performance 95% × Quality 99%)

**Six Big Losses:**
| Loss | Category |
|---|---|
| Breakdowns | Availability |
| Setup/Changeover | Availability |
| Idling/Minor stops | Performance |
| Reduced speed | Performance |
| Startup defects | Quality |
| Production defects | Quality |

**OEE Calculation Example:**
Shift = 8hr. Planned stops = 30min → Planned time = 450min.
Breakdown = 45min → Availability = 405/450 = 90%
Ideal cycle = 1min/part. Actual output = 370 parts → Performance = 370/405 = 91.4%
Defects = 8 parts → Quality = 362/370 = 97.8%
OEE = 90% × 91.4% × 97.8% = **80.4%**

Improvement priority: Attack the biggest loss category first. Most plants lose most OEE to unplanned breakdowns.`,
  },
  {
    keys: ['5s', 'lean', 'sort', 'set in order', 'shine', 'standardise', 'sustain', 'housekeeping'],
    title: 'Lean & 5S — Workplace Organisation',
    response: `**5S — Foundation of Lean Manufacturing**

**5S Steps:**

**S1 — Sort (Seiri):**
Remove everything not needed from the work area. Red-tag items — if no one claims it in 30 days, remove. Goal: only what is needed is present.

**S2 — Set in Order (Seiton):**
"A place for everything, everything in its place." Shadow boards for tools, floor markings for material locations, labels on every shelf. Goal: find anything in 30 seconds.

**S3 — Shine (Seiso):**
Clean the workplace daily. Cleaning = inspection — you find leaks, loose bolts, worn parts. Cleaning schedule posted with owner names.

**S4 — Standardise (Seiketsu):**
Document the standard for S1–S3. Visual standards, photos of "what good looks like." 5S audit checklist — weekly scoring.

**S5 — Sustain (Shitsuke):**
Discipline to maintain the standard. Management walk-throughs, 5S audits posted publicly, trend chart of 5S scores on shop floor.

**5S Audit Scoring (typical 0–5 per item):**
• 4–5: Excellent — can be used as benchmark
• 3: Acceptable — minor improvements needed
• Below 3: Needs improvement — corrective action required

**Lean Wastes (8 Wastes — TIMWOODS):**
Transportation, Inventory, Motion, Waiting, Overproduction, Over-processing, Defects, Skills (under-utilised)

IATF auditors check 5S as part of process audit. A disorganised workplace signals poor process control. 5S score below 3 is a common audit minor NC.`,
  },
  {
    keys: ['kaizen', 'continuous improvement', 'improvement event', 'poka yoke', 'mistake proof'],
    title: 'Kaizen & Poka-Yoke (Error Proofing)',
    response: `**Kaizen — Continuous Improvement Philosophy**

**Kaizen Principles:**
• Small, frequent improvements — not large projects
• Driven by the people who do the work
• Focus on eliminating waste, not just cutting cost
• Every employee can and should participate
• No improvement is too small to recognise

**Kaizen Event (Rapid Improvement Workshop):**
Day 1: Current state map, problem identification, data collection
Day 2: Root cause analysis, solution brainstorming, solution selection
Day 3–4: Implementation — change layout, tools, process
Day 5: Verify results, document new standard, present to management

**Kaizen Register (Track monthly):**
Columns: Date, Area, Problem, Solution, Before vs After (metric), Owner, Status

Target: 2 kaizens per employee per year (world-class benchmark)

**Poka-Yoke (Error Proofing):**
Design the process so errors are impossible, or immediately detected.

Levels (best to worst):
1. Prevention — physically impossible to make the error (pins, guides, asymmetric connectors)
2. Detection — error is immediately detected and alarmed before it passes
3. Inspection — defect found after the fact (least effective)

**Common Poka-Yoke Examples:**
• Asymmetric connectors — wrong orientation impossible
• Colour coding — wrong material cannot be loaded
• Limit switches — machine won't cycle if fixture not closed
• Torque tools with counters — won't release until all fasteners tightened

Poka-yokes must be verified at each shift start. Record in Control Plan as a control method.`,
  },
  {
    keys: ['tpm', 'total productive', 'preventive maintenance', 'planned maintenance', 'breakdown'],
    title: 'TPM — Total Productive Maintenance',
    response: `**TPM — Total Productive Maintenance (IATF Cl. 8.5.1.5)**

**IATF Requirement:** Equipment maintenance system with:
• Planned/preventive maintenance activities
• Predictive maintenance (where applicable)
• Maintenance skills and training records
• Packing/preservation of equipment, tooling, and gauging

**8 Pillars of TPM:**
1. Autonomous Maintenance — operators take care of basic machine maintenance
2. Planned Maintenance — scheduled PM calendar, tracked completion
3. Quality Maintenance — eliminate defects through equipment condition
4. Focused Improvement — kaizens specifically to eliminate equipment losses
5. Early Equipment Management — design for maintainability in new equipment
6. Training and Education — maintenance skill matrix
7. Safety — zero accidents, safe maintenance procedures
8. TPM in Administration — apply TPM thinking to office processes

**Preventive Maintenance (PM) Requirements:**
• PM schedule for every machine (daily/weekly/monthly/annual tasks)
• PM checklist with acceptance criteria
• Trained maintenance technicians (competency records)
• Spare parts inventory management
• PM completion record with technician signature

**MTTR and MTBF:**
• MTBF = Mean Time Between Failures (higher = better reliability)
• MTTR = Mean Time To Repair (lower = faster recovery)

**IATF Audit Questions:**
"Show me the PM schedule for this machine."
"When was the last PM performed? What was found?"
"What is the OEE trend for this line?"
Missing PM records = NC under Cl. 8.5.1.5.`,
  },
  {
    keys: ['layered process audit', 'lpa', 'leadership audit', 'tiered audit'],
    title: 'Layered Process Audits (LPA)',
    response: `**Layered Process Audits (LPA)**

**What is LPA?**
A structured approach where multiple levels of management conduct frequent, short process audits at the shop floor. Different from system audits — LPAs check whether the process is actually being followed, not just documented.

**Audit Layers (Typical):**
• Layer 1 — Supervisor/Team Leader: Daily (5–10 min)
• Layer 2 — Production/Quality Manager: Weekly (15 min)
• Layer 3 — Plant Manager / Senior Management: Monthly (30 min)

**LPA Questions Focus On:**
• Is the operator following the Work Instruction?
• Is the Control Plan inspection being done at the correct frequency?
• Are control charts being plotted and reacted to?
• Are nonconforming parts in the correct quarantine location?
• Is the SPC gauge calibrated?
• Are safety requirements being followed?
• Is the 5S standard maintained?

**LPA Benefits:**
• Management visibility of real conditions on the shop floor
• Faster detection of process drift before it causes customer issues
• Builds quality culture — operators know management cares
• Provides objective evidence of process monitoring for IATF audits

**LPA System Requirements:**
• Standardised checklist per work station
• Completion tracked (% of scheduled audits completed)
• Findings logged and escalated
• Trend analysis — recurring findings drive CAPA

Some customers (Ford, GM, Stellantis) require LPA as part of CSR. Check customer-specific requirements before setting up your LPA programme.`,
  },
  {
    keys: ['is is not', 'problem definition', 'problem statement', 'problem description'],
    title: 'IS / IS-NOT Problem Analysis',
    response: `**IS / IS-NOT Analysis — Precision Problem Definition**

**Purpose:**
Narrow the problem scope by identifying what the problem IS and what it IS NOT. This forces precision, eliminates assumptions, and guides root cause analysis toward the real cause.

**6 Dimensions to Analyse:**

| Dimension | IS (What is affected) | IS NOT (What is NOT affected) |
|---|---|---|
| What | Which product, part, defect type | Which similar products/defects are NOT affected |
| Where | Which location, operation, station | Other locations NOT affected |
| When | When did it start, which shifts, which periods | When it does NOT occur |
| Who | Which operators, shifts, customers | Others NOT affected |
| How many | Defect count, defect rate | What the rate was before the problem |
| Trend | Getting worse, stable, intermittent | Stable periods |

**The Clue Is in the IS-NOT Column:**
If defect IS present on Line A but IS NOT on Line B → the cause lies in the difference between Line A and Line B.

**Example:**
IS: Burr on Part XYZ at Op 30 (turning), on Night shift only, since 15-Jan.
IS NOT: Burr on Day shift, IS NOT on Op 20 or Op 40.
Clue: Night shift only → Check: Different operator setup? Different coolant temperature? Tool change frequency?

IS/IS-NOT is the foundation of D2 in 8D. A weak D2 leads to wrong root cause in D4. Auditors check: "Is your problem statement specific and quantified, or vague?"`,
  },
  {
    keys: ['fishbone', 'ishikawa', 'cause effect', 'cause and effect', '6m'],
    title: 'Fishbone / Ishikawa Diagram',
    response: `**Ishikawa / Fishbone Diagram — Root Cause Analysis Tool**

**6M Categories (Manufacturing):**
• **Man** — operator error, training gap, fatigue, wrong technique
• **Machine** — tool wear, calibration, breakdown, wrong setup
• **Material** — incoming quality, wrong material, storage conditions
• **Method** — wrong WI, incorrect sequence, missing step
• **Measurement** — gauge error, wrong calibration, measurement method
• **Mother Nature (Environment)** — temperature, humidity, vibration, cleanliness

**How to Build a Fishbone:**
1. Write the problem (effect) at the fish head (right)
2. Draw the spine and 6 main bones (6M categories)
3. Brainstorm potential causes under each category (sub-bones)
4. Mark the most likely causes with an "X" or highlight
5. Validate each likely cause with data before concluding

**Rules for Effective Fishbone:**
• Include everyone who works in the process — they know the real causes
• Do not jump to conclusions — all bones must be explored
• Causes must be specific, not vague ("operator error" alone is not useful — WHY did the operator error?)
• Follow each likely cause with 5-Why to get to root

**Fishbone vs 5-Why:**
Fishbone = breadth (find all possible causes)
5-Why = depth (drill into one cause to find root)
Best practice: use fishbone to identify likely causes, then 5-Why to verify and drill into each.

IATF auditors look for: Is the fishbone complete? Does the root cause appear on the fishbone? Is the root cause validated with data?`,
  },
  {
    keys: ['pareto', 'pareto chart', '80 20', 'vital few', 'defect category analysis'],
    title: 'Pareto Analysis',
    response: `**Pareto Analysis — The 80/20 Rule in Quality**

**Pareto Principle:**
80% of defects typically come from 20% of causes. Focus limited resources on the "vital few" causes, not the "trivial many."

**How to Build a Pareto Chart:**
1. Collect data: Count defects by category (type, machine, shift, operator, etc.)
2. Sort categories from most frequent to least
3. Calculate cumulative percentage
4. Plot bar chart (frequency) + line chart (cumulative %)
5. Draw the 80% line — everything to the left is your "vital few"

**Pareto Example:**
| Defect Type | Count | Cum% |
|---|---|---|
| Dimension out | 45 | 45% |
| Surface scratch | 30 | 75% |
| Missing label | 12 | 87% |
| Burr | 8 | 95% |
| Other | 5 | 100% |

→ Focus CAPA on "Dimension out" + "Surface scratch" = solves 75% of defects.

**Pareto in QMOS — Where to Use:**
• Customer complaint analysis — top defect categories
• Supplier quality — top suppliers causing incoming rejection
• IQC rejection — top rejected characteristics
• Scrap/rework — top scrap reasons
• Warranty — top failure modes from field returns

**Management Review:**
Pareto analysis of customer complaints is a mandatory input to Management Review (IATF Cl. 9.3.2). Present the Pareto with trend — is the top category improving or worsening?`,
  },
  {
    keys: ['copq', 'cost of poor quality', 'cost of quality', 'coq', 'quality cost'],
    title: 'COPQ — Cost of Poor Quality',
    response: `**COPQ — Cost of Poor Quality**

**COPQ Definition:**
Total financial cost incurred because products or processes fail to meet quality requirements. Typically 5–15% of revenue for average manufacturers; below 3% for world-class.

**4 Categories of Quality Costs:**

**1. Internal Failure Costs (Detected before shipping):**
• Scrap cost (material + labour)
• Rework cost (labour + machine time)
• Downtime due to quality issues
• Re-inspection cost after rework
• Sorting cost

**2. External Failure Costs (Detected by customer):**
• Warranty repairs and replacements
• Customer returns (freight + handling)
• Premium freight (expedite to replace defective stock)
• Customer debit notes / chargebacks
• Loss of future business (intangible but real)

**3. Appraisal Costs (Inspection and testing):**
• Incoming inspection
• In-process inspection
• Final inspection
• Calibration
• Lab testing

**4. Prevention Costs (Investing to prevent failures):**
• APQP activities
• PFMEA/Control Plan development
• Training
• Supplier development
• Quality system maintenance

**COPQ Rule:** Every ₹1 spent on Prevention saves ₹10 in Internal Failure and ₹100 in External Failure.

**COPQ KPI Reporting:**
Report COPQ monthly as % of revenue. Break into categories. Show trend. Reduction in COPQ = direct profit improvement. Management Review input per IATF Cl. 9.3.2.`,
  },
  {
    keys: ['calibration', 'gauge calibration', 'calibration record', 'measuring equipment', 'mte'],
    title: 'Calibration Management — IATF Cl. 7.1.5',
    response: `**Calibration Management — IATF 16949 Cl. 7.1.5**

**IATF Requirement:**
All monitoring and measuring equipment used to verify product or process conformance must be calibrated at specified intervals against national/international standards.

**Calibration System Requirements:**
• Calibration schedule (list of all equipment with calibration due dates)
• Calibration records for every instrument (date, result, next due, certificate number)
• Calibration labels on every instrument (sticker showing last + next calibration date)
• Traceable to national standard (NABL in India, NIST in USA)
• Calibration performed by accredited laboratory (ISO 17025)

**Calibration Register Columns:**
Equipment ID, Description, Make/Model, Serial Number, Range, Least Count, Location, Calibration Frequency, Last Calibration Date, Next Due Date, Calibration Agency, Certificate Number, Status.

**What If Equipment Fails Calibration?**
1. Take the instrument out of service immediately
2. Evaluate impact: what products were measured since last valid calibration?
3. Re-inspect affected products if risk identified
4. Raise CAPA for the equipment failure
5. Record all actions

**IATF Audit Questions:**
"Show me the calibration certificate for this vernier caliper."
"Is this equipment within its calibration due date?"
"What happened when this micrometre failed calibration last March?"

Red flags: No label on equipment, overdue calibration, no accredited certificate, equipment in use despite "OUT OF SERVICE" status.`,
  },
  {
    keys: ['training', 'competency', 'skill matrix', 'training record', 'operator qualification'],
    title: 'Competency, Training & Skill Matrix — IATF Cl. 7.2',
    response: `**Competency and Training — IATF 16949 Cl. 7.2**

**IATF Requirement:**
Persons doing work that affects quality must be competent — trained, qualified, and their competency assessed. Competency must be based on education, training, OR experience.

**Skill Matrix (Competency Matrix):**
A visual grid showing:
Rows = employees | Columns = skills/tasks | Cell = competency level

Competency Levels:
• Level 0 — Not trained
• Level 1 — Training completed, under supervision
• Level 2 — Can perform independently
• Level 3 — Can train others
• Level 4 — Expert / Subject matter expert

**Training Records — Minimum Requirements:**
• Training topic and objective
• Date and duration
• Trainer name and qualification
• Trainee name and signature
• Assessment method and result (must include evaluation — not just attendance)
• Retraining frequency (typically annual for critical skills)

**Operator Qualification:**
• New operator: OJT (On Job Training) → Supervised operation → Qualification test → Certification
• Documented in operator qualification record
• Only qualified operators to run CC/SC characteristic operations

**IATF Audit Questions:**
"Show me the training record for this operator on this process."
"Is this operator qualified to operate this machine?"
"How do you assess operator competency — not just attendance?"

Common NC: Training records show attendance but no evaluation or assessment. "Attending a training" ≠ "demonstrated competency."`,
  },
  {
    keys: ['customer complaint', 'complaint handling', 'complaint process', '8d timing', 'response time'],
    title: 'Customer Complaint Handling Process',
    response: `**Customer Complaint Handling — IATF 16949 Cl. 10.2.3 & 10.2.4**

**IATF Requirement:**
Organisation must have a defined process for handling customer complaints, including:
• Timely response to customer notification
• Review of complaints at appropriate levels
• Documented corrective actions
• Verification of effectiveness

**Standard Response Timelines (Automotive):**
• D0/D1 — Acknowledge and team formation: within 24 hours
• D3 — Containment action confirmed: within 24–48 hours
• D4 — Root cause analysis: within 7–14 days
• D6 — Corrective action implemented: within 30 days
• D8 — Formal closure: within 60–90 days
(Note: customer-specific timelines apply — check CSR)

**Complaint Escalation Criteria:**
• Safety or regulatory issue → Immediate Plant Head notification, within 1 hour
• Critical severity (line stop, field recall risk) → Quality Head + Customer within 4 hours
• Standard complaint → Quality team within 24 hours

**IATF 10.2.3 — Documented Evidence for Closure:**
Complaint closure must include documented evidence of:
1. Root cause identified and verified
2. Corrective action implemented
3. Effectiveness confirmed (data, not opinion)
4. Systemic prevention applied (PFMEA, WI, Control Plan updated)

**What Customers Check During Audit:**
• Open complaint aging — any older than 90 days without closure?
• Complaint-to-CAPA linkage — every complaint traced to a CAPA number
• Repeat complaints — same failure mode recurring = systemic failure

Never close a complaint as "customer cause" without written concurrence from the customer.`,
  },
  {
    keys: ['special characteristic', 'cc', 'sc', 'critical characteristic', 'significant characteristic', 'ks', 'kmea'],
    title: 'Special Characteristics — CC & SC',
    response: `**Special Characteristics — IATF 16949 Cl. 8.3.3.3**

**Definition:**
Characteristics whose variation has significant impact on safety, regulatory compliance, or fit/function. Require mandatory enhanced controls.

**CC — Critical Characteristic (Safety/Regulatory):**
Symbol: △ (triangle) — varies by customer (Ford uses ◆, GM uses ⬡)
Examples: Torque on safety fasteners, brake fluid line dimensions, airbag module pin contact, pressure vessel wall thickness.
Requirements:
• 100% inspection OR validated SPC (Cpk ≥ 1.67)
• Cannot be ship without verification evidence
• Must appear in PFMEA, Control Plan, Drawing

**SC — Significant Characteristic (Fit/Function):**
Symbol: □ (square) or 'S'
Examples: Assembly interface dimensions, thread pitch, seal groove depth.
Requirements:
• SPC monitoring (Cpk ≥ 1.33)
• Statistical sampling if SPC not feasible
• Must appear in PFMEA, Control Plan

**Special Characteristic Flow:**
Drawing → PFMEA (failure mode for CC/SC) → Control Plan (enhanced control) → Work Instruction (operator alert) → SPC/100% inspection → PPAP (capability data required)

**Customer-Specific Symbols:**
• Ford: ◆ = Critical Characteristic (CC), ○ = Significant Characteristic (SC)
• GM: ⬡ = Safety, ■ = Significant
• Stellantis: D = Diamond for CC
Always refer to customer CSR for their specific symbols.

Forgetting to flow CC/SC from drawing to PFMEA to Control Plan is the most common PPAP failure mode. The entire chain must be unbroken and traceable.`,
  },
  {
    keys: ['safe launch', 'safe launch plan', 'intensified monitoring', 'psa', 'launch monitoring'],
    title: 'Safe Launch Plan',
    response: `**Safe Launch Plan — Post-PPAP Production Monitoring**

**Purpose:**
Intensified quality monitoring immediately after a new product launch or significant process change. Catch problems before they reach the customer in large quantities.

**Trigger Conditions:**
• New product launch (after PPAP approval)
• New supplier material introduction
• New tooling or machine
• Relocation of production line
• Return from idle tooling (>12 months)
• Customer-required safe launch (check CSR)

**Typical Safe Launch Controls (First 90 Days):**
• 100% inspection for all CC/SC characteristics
• Increased sampling frequency (e.g., Control Plan says 1/hour → Safe Launch: 1/30 min)
• First piece + last piece inspection every shift
• Daily quality review meeting with data
• Weekly report to customer (if required)
• Lot traceability maintained (100% lot tagging)
• Ship only after safe launch release criteria met

**Safe Launch Exit Criteria (Typical):**
• Zero customer complaints for X days
• Cpk ≥ 1.67 sustained for 30 days on CC characteristics
• Zero internal rejections for 2 consecutive weeks
• Customer written release from safe launch

**Safe Launch Documentation:**
• Safe Launch Plan document (signed by customer + supplier Quality heads)
• Daily/weekly monitoring data records
• Customer approval for exit from safe launch

This is also called "Intensified Monitoring Plan" by some customers (Ford, Stellantis). Failure to maintain safe launch controls during this critical period is a common cause of early warranty issues.`,
  },
  {
    keys: ['scar', 'supplier corrective action', 'supplier ncr', 'supplier rejection', '8d supplier'],
    title: 'SCAR — Supplier Corrective Action Request',
    response: `**SCAR — Supplier Corrective Action Request**

**When to Issue a SCAR:**
• Incoming material rejection (lot rejected at IQC)
• Supplier-caused production line disruption
• Supplier-caused customer complaint or warranty claim
• Repeat rejection within 90 days
• Audit finding at supplier facility

**SCAR Content (Minimum):**
• SCAR number and date
• Supplier name, code, contact person
• Part number, lot number, quantity rejected
• Defect description (with photos)
• Defect rate / severity
• Containment required (immediate action at supplier)
• 8D report requested
• Due dates for each 8D discipline
• Disposition of rejected material

**SCAR Response Timeline (Typical):**
• D3 Containment: 24–48 hours
• D4 Root Cause: 7–10 days
• D6 Corrective Action: 30 days
• D8 Closure: 60 days

**Escalation for No Response:**
1. Reminder after 3 days of no response
2. Escalation to supplier management after 7 days
3. Conditional approval status if still no response after 15 days
4. Stop new orders / disqualification for chronic non-responders

**SCAR Tracking KPI:**
• Open SCAR count per supplier
• SCAR response rate (% responded on time)
• SCAR recurrence rate (same defect within 90 days)
• Supplier 8D quality rating (rated A/B/C on root cause depth and action effectiveness)

Maintain a SCAR register. At supplier scorecard review, open SCARs and response rate are key inputs.`,
  },
  {
    keys: ['risk based thinking', 'risk assessment', 'risk management', 'opportunities', 'cl 6.1'],
    title: 'Risk-Based Thinking — IATF Cl. 6.1',
    response: `**Risk-Based Thinking — IATF 16949 Cl. 6.1**

**IATF Requirement:**
Identify risks AND opportunities relevant to the QMS context and objectives. Determine actions to address risks proportionate to their potential impact.

**Risk Types in Automotive Quality:**
• Product risk — safety, regulatory, functional failures
• Process risk — machine capability, operator error, incoming material variation
• Supplier risk — single-source, financial instability, quality history
• Customer risk — CSR changes, program discontinuation, claim escalation
• Compliance risk — IATF/ISO audit findings, regulatory changes

**Risk Assessment Matrix:**
| Probability | Low Impact | Medium Impact | High Impact |
|---|---|---|---|
| High | Medium | High | Critical |
| Medium | Low | Medium | High |
| Low | Acceptable | Low | Medium |

**Risk Register Format:**
Risk ID | Description | Category | Probability (1–5) | Impact (1–5) | Risk Score | Mitigation Action | Owner | Status | Residual Risk

**Opportunities — Don't Forget:**
IATF requires identifying opportunities too, not just risks:
• New technology to improve process control
• Customer feedback indicating areas to grow
• Supply chain consolidation to reduce cost
• Automation to reduce operator-error risk

**IATF Audit Questions:**
"Show me your risk register and how risks were identified."
"What actions did you take for your top 3 risks?"
"How do you review and update risks periodically?"
"How do risks feed into your quality objectives?"

Risk-based thinking is not optional paperwork — it must be demonstrated through actual decisions and actions traceable in meeting minutes and action plans.`,
  },
  {
    keys: ['turtle diagram', 'process approach', 'process audit approach', 'ipoc', 'input output'],
    title: 'Turtle Diagram & Process Approach',
    response: `**Turtle Diagram — IATF 16949 Cl. 4.4 & 9.2.2.2**

**Purpose:**
Visual tool to document a process completely, covering all inputs, outputs, resources, and controls. Used in QMS documentation AND as the basis for process audits.

**Turtle Diagram Structure:**

• **HEAD (Process Name):** What process is being documented?
• **TAIL (Input → Output):**
  - Input: What triggers this process? (Materials, information, requirements)
  - Output: What is produced? (Product, report, record)
• **LEFT FLIPPER — With What? (Equipment & Tools):**
  Machines, gauges, jigs, software, facilities required
• **RIGHT FLIPPER — With Who? (People & Competency):**
  Roles, qualifications, training required, number of operators
• **TOP FIN — How? (Methods & Procedures):**
  WIs, SOPs, Control Plans, standards that govern the process
• **BOTTOM FIN — How Well? (Metrics & KPIs):**
  How is process performance measured? Targets, monitoring frequency
• **CENTRE (Process Steps):** Key activities within the process

**Using Turtle for Process Audit:**
Auditor walks through the turtle with the process owner:
• Are inputs available and controlled?
• Is equipment calibrated and maintained?
• Are people trained and qualified?
• Are methods/WIs up to date and followed?
• Are KPIs monitored and within target?

**Every IATF-registered organisation must have a turtle diagram for each core process.** Common processes: Sales/Contract Review, APQP/PPAP, Purchasing, Production, Quality Inspection, Calibration, Internal Audit, Management Review.`,
  },
  {
    keys: ['dfmea', 'design fmea', 'design failure mode', 'dvp', 'design verification'],
    title: 'DFMEA & DVP — Design Risk Management',
    response: `**DFMEA & DVP&R — Design Phase Quality Tools**

**DFMEA (Design FMEA):**
Used when the supplier is Design Responsible (DR). Required in PPAP Element 4 for DR suppliers.

**DFMEA Structure (AIAG-VDA 2019):**
• Function — What must the design do?
• Failure Mode — How could it fail to perform that function?
• Effect — What is the impact on the customer / end user?
• Cause — What design characteristic could cause this failure?
• Current Controls — Design verification tests (DVP), analysis methods
• AP (Action Priority) — High/Medium/Low based on S×O×D table

**Key DFMEA Difference from PFMEA:**
DFMEA focuses on design intent failures.
PFMEA focuses on manufacturing process failures.
Both are needed for a complete risk picture.

**DVP&R (Design Verification Plan & Report):**
Matrix that maps:
• Each design requirement (from spec/drawing)
• Test method to verify it
• Acceptance criteria
• Number of samples
• Pass/Fail status

DVP must be completed before PPAP Gate 4 approval.

**DFMEA → DVP Linkage:**
High AP items in DFMEA must have a corresponding DVP test to verify the design control is effective. If a DFMEA says "design validation required" — it MUST appear in the DVP.

**When DFMEA is Required:**
• Supplier is design responsible (DR) — full DFMEA required in PPAP
• Supplier is manufacturing responsible (MR) — customer provides design record; supplier does PFMEA only
• Check PPAP Element 3 (Customer Engineering Approval) to confirm design responsibility.`,
  },
  {
    keys: ['reaction plan', 'out of control', 'ooc', 'control chart reaction', 'what to do when'],
    title: 'Reaction Plan — What to Do When Process Goes Out of Control',
    response: `**Reaction Plan — IATF 16949 Cl. 8.5.1**

**Definition:**
A documented, specific sequence of actions to take when a characteristic is found out of control, out of specification, or the control chart shows an OOC signal.

**Why Reaction Plans Matter:**
An out-of-control process without a reaction plan = gambling with quality. IATF requires the reaction plan to be in the Control Plan, not just in someone's head.

**Standard Reaction Plan Structure:**
"If [trigger condition], then:
1. Stop the process / Stop shipment of suspect parts
2. Notify Quality Inspector / Supervisor
3. Quarantine suspect material back to last confirmed good check point
4. Tag all suspect material as HOLD
5. Investigate root cause before restarting
6. Get Quality approval before resuming production
7. Record all actions on NCR / SPC chart with operator initials and time"

**Triggers That Require Reaction:**
• One point beyond UCL or LCL (Rule 1)
• 8 consecutive points on one side of centreline (Rule 2)
• 6 points in a row trending up/down (Rule 3)
• Dimension out of tolerance (engineering specification)
• Visual defect detected at in-process inspection
• First article failed

**Reaction Plan Must Be Specific:**
Bad: "Inform supervisor" ← Too vague
Good: "Stop machine, tag last 50 parts as HOLD, call Quality Inspector, complete NCR form QF-012, wait for Quality disposition before restarting"

Reaction plan is tested in process audits: "Show me the last time an OOC occurred. What did the operator do? Is there a record?"`,
  },
  {
    keys: ['ppm calculation', 'how to calculate ppm', 'parts per million', 'defect rate calculation'],
    title: 'PPM Calculation & Defect Rate Metrics',
    response: `**PPM Calculation — Parts Per Million Defective**

**Formula:**
PPM = (Number of Defective Parts / Total Parts Inspected) × 1,000,000

**Example:**
Total shipped to customer: 50,000 pieces
Customer complaints: 3 defective pieces
PPM = (3 / 50,000) × 1,000,000 = **60 PPM**

**Typical Automotive PPM Targets:**
• World class: below 10 PPM
• Good: 10–25 PPM
• Acceptable: 25–100 PPM
• Needs improvement: 100–500 PPM
• Critical: above 500 PPM

**DPPM (Defects Per Part Per Million):**
When a part has multiple opportunities for defects.
DPPM = (Total Defects / Total Opportunities) × 1,000,000
Opportunities = parts inspected × defect types checked per part

**Customer PPM:**
Based only on defects reported by the customer (field returns + warranty).
Customer PPM tracks escapes — failures your inspection did not catch.

**Internal Rejection Rate:**
More commonly expressed as % for internal monitoring.
Internal Rejection % = (Rejected parts / Total produced) × 100
For management reports, convert to PPM for comparison with benchmarks.

**PPM Tracking Tips:**
• Track PPM by customer, by part number, and by defect category
• Use rolling 3-month and 12-month averages for trends
• Any single month above customer threshold triggers customer notification and 8D

Never confuse Internal PPM with Customer PPM — they measure different things. Customer PPM is what customers judge you on.`,
  },
  {
    keys: ['cpk calculation', 'how to calculate cpk', 'capability calculation', 'sigma level'],
    title: 'Cpk Calculation — Step by Step',
    response: `**Cpk Calculation — Step-by-Step Guide**

**What You Need:**
• Upper Specification Limit (USL) — from drawing
• Lower Specification Limit (LSL) — from drawing
• Process Mean (X̄) — average of your data
• Process Standard Deviation (σ) — from your samples

**Formulas:**
Cp = (USL − LSL) / (6σ)
CPU = (USL − X̄) / (3σ)
CPL = (X̄ − LSL) / (3σ)
**Cpk = min(CPU, CPL)**

**Step-by-Step Example:**
Part dimension: 25.0 ± 0.3 mm
USL = 25.3 mm, LSL = 24.7 mm
Measured 30 samples: X̄ = 25.05 mm, σ = 0.045 mm

CPU = (25.3 − 25.05) / (3 × 0.045) = 0.25 / 0.135 = **1.85**
CPL = (25.05 − 24.7) / (3 × 0.045) = 0.35 / 0.135 = **2.59**
Cpk = min(1.85, 2.59) = **1.85** ← Process is capable!

**Interpretation:**
• Cpk ≥ 1.67: Excellent (required for CC at PPAP)
• Cpk ≥ 1.33: Capable (minimum for ongoing production)
• Cpk 1.00–1.33: Marginal — increase inspection frequency
• Cpk below 1.00: Not capable — 100% inspection + CAPA required

**Common Mistakes:**
• Using Cpk when Ppk is required (PPAP requires Ppk — long-term σ)
• Sample size too small (minimum 30 pieces; 100+ for reliable Ppk)
• Not checking for normality before calculating — non-normal data needs different analysis

Use Minitab, Excel, or SPC software — manual calculation prone to error with large datasets.`,
  },
  {
    keys: ['annual revalidation', 'annual layout', 'periodic requalification', 'annual confirmation'],
    title: 'Annual Revalidation & Layout Inspection',
    response: `**Annual Revalidation — IATF 16949 Cl. 8.6.2**

**IATF Requirement:**
Complete layout inspection and functional verification at a frequency defined in the Control Plan (typically annually) for each part number.

**What Is Annual Revalidation?**
Full dimensional inspection of a production part against the engineering drawing — measuring ALL characteristics, not just the critical ones checked in daily production.

**Process:**
1. Select sample from current production (typically 3–5 parts)
2. Measure ALL drawing dimensions using calibrated gauges
3. Compare 100% of results to drawing tolerances
4. Record on Dimensional Results Report (PPAP format)
5. If all pass: sign off Annual Revalidation record, update Control Plan
6. If any fail: raise NCR + CAPA immediately

**Also Required in Revalidation:**
• Functional testing (if specified in Control Plan)
• Visual inspection for all cosmetic characteristics
• Material testing (if periodic material testing is required in Control Plan)
• MSA/GRR review — are gauges still adequate?

**When Else is Full Layout Required?**
• PPAP submission (always)
• Customer request
• After significant process change (4M change)
• After tooling repair or replacement
• After layout failure → fix → re-verify

**Record Retention:**
Annual revalidation records must be retained for the life of the part + a defined period (typically 15 years for safety parts). Auditors ask: "Show me last year's annual revalidation for Part ABC."`,
  },
  {
    keys: ['run at rate', 'production trial', 'capacity verification', 'rar', 'takt time'],
    title: 'Run at Rate & Capacity Verification',
    response: `**Run at Rate (RaR) — APQP Phase 4**

**Purpose:**
Demonstrate that the manufacturing process can produce parts at the required volume AND quality level simultaneously. Part of PPAP/APQP Gate 4 readiness.

**Run at Rate Requirements:**
• Duration: typically 8-hour shift or minimum 300 pieces (customer-defined)
• Production rate must meet or exceed customer required rate (parts/hour)
• Quality must meet PPAP acceptance criteria during the run
• All production staff must be the regular production team (not engineers)
• Process must be run exactly as the Control Plan describes

**RaR Data to Collect:**
• Actual production quantity vs target
• Downtime events (machine, material, people)
• In-process rejection count and defect type
• OEE during the run
• Cpk/Ppk for CC characteristics measured during the run

**RaR Pass Criteria (Typical):**
• Achieve ≥ 95% of required production rate
• Internal rejection rate below 1% (customer-specific)
• No CC/SC nonconformities
• All planned controls in the Control Plan executed

**Takt Time Calculation:**
Takt Time = Available Production Time / Customer Daily Demand
Example: 450 min/shift ÷ 150 parts/day = 3 min/part Takt Time
Your cycle time must be ≤ Takt Time.

**If RaR Fails:**
• Identify constraint (machine speed, quality, staffing)
• Correct and re-run
• Customer must approve RaR results before PPAP Gate 4 sign-off
• Shipping production parts before a successful RaR is a PPAP violation`,
  },
  {
    keys: ['customer specific requirements', 'csr', 'ford csr', 'gm csr', 'stellantis', 'customer requirement'],
    title: 'Customer-Specific Requirements (CSR)',
    response: `**Customer-Specific Requirements — IATF 16949 Annex A**

**What Are CSRs?**
Additional requirements imposed by customers on top of IATF 16949. Published by each customer and must be reviewed, documented, and flowed down to relevant processes.

**Major OEM CSRs — Key Highlights:**

**Ford Motor Company:**
• Q1 certification required for most production parts
• PFMEA in AIAG-VDA 2019 format mandatory
• LPA (Layered Process Audits) required
• Ford-specific PPAP portal: WERS (Warranty Early Warning Reporting System)
• Global 8D format with specific timing gates

**General Motors:**
• Supplier Quality Fundamentals (SQF) requirements
• GMP (General Motors Supplier Portal)
• PFMEA scope and depth requirements
• Customer Specific PPAP requirements (GM1927)

**Stellantis (FCA/PSA):**
• SIM (Supplier Improvement Matrix)
• ANPQP (Alliance New Product Quality Procedure)
• Specific control plan format requirements

**Toyota:**
• Toyota's Quality Gate System
• Andon and escalation requirements
• 5-Why format expectations

**CSR Management Process:**
1. Obtain current CSR document from customer website
2. Review against IATF 16949 requirements — identify gaps
3. Update QMS procedures to include CSR requirements
4. Train relevant teams
5. Include CSR compliance in internal audits
6. Review annually for updates

IATF auditors will ask: "Show me how you manage customer-specific requirements." Evidence: CSR matrix showing which CSRs apply and where they're implemented.`,
  },
  {
    keys: ['product safety', 'safety part', 'functional safety', 'safety regulation', 'iatf safety'],
    title: 'Product Safety — IATF 16949 Cl. 8.3.3.3',
    response: `**Product Safety — IATF 16949 Special Focus Area**

**IATF 2016 introduced explicit product safety requirements:**
Safety is now explicitly required across multiple clauses — not just implied.

**Key IATF Safety Requirements:**

**Cl. 8.3.3.3 — Special Characteristics:**
Safety-significant characteristics must be identified, controlled, and monitored with enhanced rigour (CC designation, 100% verification or SPC Cpk ≥ 1.67).

**Cl. 8.3.4.4 — Product Safety:**
Must have a documented product safety management process covering:
• Identification of safety requirements in product design and manufacturing
• Safety analysis methods (DFMEA, HAZOP, FTA as applicable)
• Training of personnel involved in safety-related processes
• Flow-down of safety requirements to sub-tier suppliers
• Safety-related PPAP approvals

**Cl. 8.5.6.1 — Control of Changes:**
Any change to a safety-critical characteristic requires customer approval before implementation, regardless of how minor.

**Safety Part Identification:**
• On the drawing: CC designation (△ or customer-specific symbol)
• In PFMEA: Severity ≥ 9 (safety/regulatory)
• In Control Plan: Special control (100% or SPC)
• In shipping: Controlled traceability documentation

**Serious Consequences of Safety Failures:**
• Product recall (potentially millions of units)
• Criminal liability for responsible executives in some jurisdictions
• Loss of IATF certification
• Customer disqualification

Zero tolerance for: Shipping known safety-defective product, removing safety controls without customer approval, or falsifying safety test records.`,
  },
  {
    keys: ['concession', 'deviation', 'waiver', 'use as is', 'customer approval deviation'],
    title: 'Concession / Deviation Approval',
    response: `**Concession & Deviation — IATF 16949 Cl. 8.7.1.4**

**Definitions:**
• **Deviation (Pre-production):** Request to use material/parts that deviate from the spec, before production begins. Customer approves before nonconforming material enters production.
• **Concession (Post-production):** Request to ship material that was produced but does not fully meet the specification. Customer approves the shipment of nonconforming material.

**When Concessions Are Needed:**
Material is produced nonconforming, but it may still be functionally acceptable. Rather than scrap or rework (if not technically possible/economical), request customer concession to ship "use-as-is."

**Concession Process:**
1. Identify nonconforming characteristic (specific — not vague)
2. Measure the actual value vs spec
3. Assess functional impact (engineering analysis)
4. Prepare concession request to customer with:
   - Part number, revision, nonconforming characteristic
   - Actual measured value vs specification
   - Quantity of nonconforming material
   - Engineering justification for functional acceptability
   - Proposed corrective action and timing
5. Get written customer approval BEFORE shipping
6. Mark concession-approved material with unique identification
7. Record concession in traceability system

**Critical Rules:**
• NEVER ship nonconforming CC/SC characteristics without written customer concession — this is an automatic IATF major NC
• Concessions are NOT a long-term solution — CAPA must eliminate the cause
• Concession quantity and duration must be strictly limited

Track all open concessions. Recurring concessions for the same characteristic = systemic problem requiring CAPA.`,
  },
  {
    keys: ['4m change', 'process change', 'change management', 'engineering change', 'change notification'],
    title: '4M Change Management',
    response: `**4M Change Management — IATF 16949 Cl. 8.5.6**

**4M = Man, Machine, Material, Method**

Any change in these 4 categories can affect product quality and may trigger re-PPAP or customer notification.

**Change Categories:**

**Man (People):**
• New operator on CC/SC process → Requalification required
• Shift change affecting quality → Monitor closely
• Contractor replacing permanent operator → Full training verification

**Machine (Equipment & Tooling):**
• New machine → Full PPAP may be required
• Tooling modification → Customer notification; PPAP may be required
• Machine repair affecting CC/SC → Process verification
• New gauge or calibration equipment → MSA/GRR required

**Material (Incoming):**
• New material grade or supplier → PPAP required in most cases
• Material specification change → Engineering review + customer approval
• Sub-tier supplier change → Customer notification required

**Method (Process):**
• Parameter change (temperature, speed, torque) → Verification run required
• New work instruction → Training + sign-off required
• New SPC control method → Validation required

**Change Management Process:**
1. Identify change type and category
2. Risk assess the change (PFMEA review)
3. Determine if customer notification/approval is needed (check CSR)
4. Update PFMEA, Control Plan, WI before implementation
5. Run verification/validation (process trial, capability study)
6. Get approval from Quality Manager before production release
7. Record change in Change Management Register

**Never implement an undocumented change** — this is a major IATF NC and can cause serious quality escapes.`,
  },
  {
    keys: ['imds', 'material data', 'substance declaration', 'reach', 'rohs', 'regulatory compliance'],
    title: 'IMDS & Regulatory Compliance (REACH/RoHS)',
    response: `**IMDS and Material Compliance — IATF 16949 Cl. 8.4.2**

**IMDS (International Material Data System):**
Global automotive industry database for material declarations. All production parts shipped to automotive OEMs must have an approved IMDS submission.

**IMDS Requirements:**
• Every material in the part must be declared (material composition %, CAS numbers)
• Restricted substances flagged (GADSL — Global Automotive Declarable Substance List)
• Customer reviews and approves your IMDS submission before PPAP approval
• IMDS number required in PPAP package (Element 10 — Material Records)

**Restricted Substance Lists:**
• **REACH** (EU) — Substances of Very High Concern (SVHC) — reportable above 0.1%
• **RoHS** (EU) — Restricts lead, mercury, cadmium, hexavalent chromium, PBB, PBDE in electronics
• **ELV Directive** (EU) — End-of-Life Vehicle: restricts same substances in automotive parts
• **GADSL** — Global automotive industry agreed list of declarable/prohibited substances

**Supplier Compliance Flow-Down:**
You must flow material compliance requirements to your sub-tier suppliers. Include substance restrictions in purchasing specifications and supplier contracts.

**Common IATF Audit Questions:**
"Show me the IMDS submission for this part."
"Do you have REACH/RoHS declarations from your material suppliers?"
"How do you verify incoming materials comply with GADSL?"

IMDS is often overlooked until PPAP submission — then it delays approval. Start IMDS data collection at APQP Phase 2. Get material declarations from all your sub-suppliers.`,
  },
  {
    keys: ['mistake proofing verification', 'poka yoke check', 'error proofing check', 'poke yoke validation'],
    title: 'Poka-Yoke Verification & Validation',
    response: `**Poka-Yoke (Error Proofing) — Verification Requirements**

**IATF 16949 Cl. 8.5.1.1 — Error Proofing:**
Error-proofing devices must be verified as part of the regular control plan. Failure of an error-proofing device must stop production.

**Three Levels of Poka-Yoke Verification:**

**1. Daily/Shift-Start Verification:**
Before production starts, the operator deliberately tests the poka-yoke using a known-bad part or condition. If the poka-yoke does NOT detect the known-bad condition → Machine/line is NOT released for production.

Documented in: Poka-Yoke Verification Log (part of Control Plan records).

**2. Periodic Challenge (During Production):**
At defined intervals, introduce the test condition to verify ongoing poka-yoke function.

**3. After Downtime or Repair:**
Any time the machine or process is restarted after breakdown or maintenance, poka-yoke must be verified before first good piece approval.

**Poka-Yoke Failure Response:**
• Stop production immediately
• Tag last 100 pieces (or since last successful verification) as HOLD
• Inspect 100% of held material
• Repair and verify poka-yoke
• Quality approval before restarting

**IATF Audit Check:**
"Show me the poka-yoke verification log for this station."
"When was the last time the error-proofing was found to fail during the shift start check?"
"What did you do with parts produced since the last successful check?"

Missing poka-yoke verification records = NC under Cl. 8.5.1.1. This is a very common audit finding.`,
  },
  {
    keys: ['quality board', 'visual management', 'production board', 'andon', 'visual factory'],
    title: 'Visual Management & Quality Boards',
    response: `**Visual Management — Quality Intelligence at a Glance**

**Quality Board (Shop Floor) — Standard Content:**
• Production target vs actual (hour by hour)
• Current OEE (Availability, Performance, Quality)
• Defect Pareto for the shift/day (top 3 defect types)
• Open NCRs (count and top issue)
• 5S audit score (this week vs last week)
• Customer complaints (open count, days aging)
• Safety score / Last accident-free days
• CAPA status (overdue actions highlighted in red)
• Quality KPI targets vs actuals (PPM, rejection rate)

**Daily Quality Meeting (15 minutes):**
Held at the Quality Board every morning.
Attendees: Supervisor, Quality Inspector, Team Leader, Production Operator representative.
Agenda: Yesterday's defects, today's targets, action items, escalations.

**Andon System:**
Visual/audio alarm system where any operator can stop the line when a quality problem is detected.
• Green: Normal production
• Yellow: Attention needed
• Red: Line stopped — quality issue

IATF requirement: Workers must be empowered to stop production when a nonconformity is detected.

**5-Minute Walk Standard:**
In 5 minutes walking through the shop floor, the Plant Head should be able to determine:
• Production rate vs plan
• Top quality issue today
• Any open CAPAs overdue
• 5S status

If they can't — your visual management needs improvement.`,
  },
  {
    keys: ['supplier scorecard', 'vendor scorecard', 'supplier rating', 'supplier evaluation', 'supplier performance review'],
    title: 'Supplier Scorecard & Performance Review',
    response: `**Supplier Scorecard — IATF 16949 Cl. 8.4.1**

**Purpose:**
Objectively measure supplier performance across quality, delivery, and responsiveness. Use scores to stratify suppliers and drive improvement.

**Scorecard Metrics (Typical Weightings):**

| KPI | Weight | Target |
|---|---|---|
| Incoming PPM | 35% | below 50 PPM |
| On-Time Delivery (OTD) | 25% | above 95% |
| 8D Response (Timeliness) | 15% | D3 within 48h |
| PPAP First-Pass Approval | 10% | above 90% |
| Open SCAR Count | 10% | 0 open > 30 days |
| IATF/ISO Certification | 5% | Valid certificate |

**Rating Scale:**
• A (90–100%): Preferred Supplier — eligible for new business
• B (75–89%): Approved Supplier — standard monitoring
• C (60–74%): Conditional — development plan required within 30 days
• D (below 60%): Disqualified — no new orders, replacement sourcing begins

**Scorecard Review Frequency:**
• Monthly: Internal tracking
• Quarterly: Share with supplier and review together
• Annually: Formal supplier review meeting, update approval status

**Development Plan for C-Rated Suppliers:**
• Root cause analysis of performance gaps
• Corrective actions with target dates
• Monthly review meetings (at supplier or virtual)
• Defined exit criteria: what must be achieved to return to B rating?
• Escalation to management if no improvement in 90 days

Publish scorecards to suppliers — transparency drives improvement. Suppliers who never see their own scorecard have no feedback to act on.`,
  },
  {
    keys: ['quality culture', 'quality mindset', 'management commitment', 'quality leadership', 'zero defect'],
    title: 'Building a Quality Culture',
    response: `**Quality Culture — From Compliance to Excellence**

**Why Culture Matters More Than Systems:**
An organisation can have perfect procedures and still produce defects if the people don't believe quality is important. Culture is the foundation that makes all tools work.

**Signs of Strong Quality Culture:**
• Operators stop the line when they see a defect — without fear of punishment
• Quality issues are escalated immediately — not hidden until the end of shift
• Root causes are sought, not people to blame
• Every employee knows the customer's quality expectations
• Quality improvements are celebrated and recognised
• Management is present on the shop floor, asking quality questions

**Signs of Weak Quality Culture:**
• "Ship it — sort it later" mentality
• Quality department = quality police (not a partner)
• Problems reported at month-end, not when they occur
• Operators told to "keep the line running" despite quality issues
• Management only visits the shop floor during customer audits

**Quality Head's Role in Culture:**
• Be visible on the shop floor every day
• Celebrate operators who catch and stop defects — give them recognition
• Conduct quality briefings — share customer complaint data with operators
• Make the "Why Quality Matters" real: show the customer's product in use
• Zero tolerance for falsified data or hiding defects — handle firmly and fairly

**Management Commitment (IATF Cl. 5.1):**
Top management must demonstrate personal commitment — not just sign the quality policy. They must be present in management review, lead quality audits, and remove obstacles to improvement.

**Zero Defect Goal:**
Setting a zero defect culture means: we don't accept that defects are inevitable. Every defect has a cause. Every cause can be eliminated. The goal is always zero.`,
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

// -- Prompt Library ------------------------------------------------------------
const PROMPT_GROUPS = [
  {
    group: 'Problem Solving', icon: '🔧',
    prompts: [
      'How do I write a proper 8D report?',
      'How to use IS / IS-NOT problem analysis?',
      'How to build a fishbone diagram?',
      'When should CAPA be raised vs containment only?',
    ],
  },
  {
    group: 'IATF 16949', icon: '📋',
    prompts: [
      'What are the mandatory IATF 16949 clauses?',
      'What are common IATF audit findings?',
      'What does management review require?',
      'What is risk-based thinking in IATF clause 6.1?',
    ],
  },
  {
    group: 'AIAG Core Tools', icon: '🔩',
    prompts: [
      'Explain PPAP 18 elements and submission levels',
      'What is the APQP 5-phase gate review process?',
      'How does AIAG-VDA PFMEA AP system work?',
      'What are special characteristics CC and SC?',
    ],
  },
  {
    group: 'SPC and MSA', icon: '📈',
    prompts: [
      'How to calculate Cpk step by step?',
      'How to interpret a %GRR result of 25%?',
      'What is the reaction plan when a control chart shows OOC?',
      'What are the acceptance criteria for GRR?',
    ],
  },
  {
    group: 'Supplier Quality', icon: '🏭',
    prompts: [
      'How to manage supplier quality performance?',
      'What is a SCAR and when do I issue one?',
      'How to build a supplier scorecard?',
      'What are IQC inspection levels and AQL?',
    ],
  },
  {
    group: 'Shop Floor Quality', icon: '🔍',
    prompts: [
      'What is the difference between IQC, IPQC and OQC?',
      'What is a Layered Process Audit (LPA)?',
      'How to manage nonconforming material (NCR)?',
      'How to verify poka-yoke error proofing?',
    ],
  },
  {
    group: 'Lean & Equipment', icon: '⚙️',
    prompts: [
      'How to calculate and improve OEE?',
      'What are the 5S steps and how to audit them?',
      'What is TPM and its 8 pillars?',
      'How to use Pareto analysis for defect reduction?',
    ],
  },
  {
    group: 'Launch & Change', icon: '🚀',
    prompts: [
      'What is a Safe Launch Plan and when is it required?',
      'What is Run at Rate and how to conduct it?',
      'What are the 4M change categories in IATF?',
      'What is DFMEA and DVP&R?',
    ],
  },
  {
    group: 'Quality Economics', icon: '💰',
    prompts: [
      'How to calculate PPM and what are benchmarks?',
      'What is COPQ and its four categories?',
      'How to calculate warranty PPM?',
      'What is Cost of Poor Quality as % of revenue?',
    ],
  },
  {
    group: 'Compliance & Warranty', icon: '📜',
    prompts: [
      'What is IMDS and how to submit material data?',
      'How to handle warranty and field failure analysis?',
      'What is a concession/deviation and the approval process?',
      'What are Customer-Specific Requirements (CSR)?',
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
    response: `I have deep knowledge across 50+ quality management topics. Here's what I can help you with:

**Problem Solving:** 8D Report, CAPA, 5-Why, Fishbone/Ishikawa, IS/IS-NOT Analysis, Pareto Analysis

**IATF 16949:** Clause-by-clause guidance, audit preparation, risk-based thinking, management review, turtle diagrams, CSR, product safety, concession/deviation

**AIAG Core Tools:** APQP 5-phase, PPAP 18 elements, PFMEA (AIAG-VDA 2019), DFMEA & DVP, MSA/GRR, SPC & Cpk, Control Plan

**Shop Floor Quality:** IQC / IPQC / OQC, NCR management, poka-yoke verification, reaction plans, special characteristics (CC/SC), calibration, annual revalidation

**Supplier Quality:** Supplier scorecard, SCAR, supplier audits, IQC/AQL, IMDS & REACH/RoHS compliance

**Lean & Operations:** OEE calculation, 5S, Kaizen, TPM, LPA (Layered Process Audits), visual management

**Launch & Change:** Safe Launch Plan, Run at Rate, 4M change management, Safe Launch exit criteria

**Quality Economics:** PPM calculation, COPQ, warranty analysis, field failure, quality culture

Try asking about any of these topics, or use the Prompt Library on the left for ready-made expert questions.`,
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
      text: `**Welcome to QMOS AI Quality Copilot**\n\nI am your embedded Quality Intelligence Assistant — trained on 50+ quality management topics covering IATF 16949, AIAG Core Tools, 8D, CAPA, SPC, MSA, Supplier Quality, Lean/OEE, Warranty, Safe Launch, and 40+ years of Quality Head knowledge.\n\n**Topics I can help with:**\n• Problem Solving: 8D, CAPA, 5-Why, Fishbone, IS/IS-NOT, Pareto\n• IATF 16949: All clauses, audit prep, risk-based thinking, turtle diagram\n• AIAG Tools: APQP, PPAP, PFMEA, DFMEA, MSA, SPC, Control Plan\n• Shop Floor: IQC, IPQC, OQC, NCR, Poka-Yoke, calibration, LPA\n• Supplier: SCAR, scorecard, IQC/AQL, IMDS, REACH/RoHS\n• Lean & Equipment: OEE, 5S, Kaizen, TPM, visual management\n• Launch & Change: Safe Launch, Run at Rate, 4M change, DVP\n• Economics: PPM, COPQ, warranty analysis, quality culture\n\nAsk me anything, or pick from the Prompt Library on the left.`,
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
    <div className="h-screen flex flex-col bg-[#eff6ff] overflow-hidden">

      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-lg">🤖</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">AI Quality Copilot</h1>
              <p className="text-violet-700 text-xs">IATF 16949 · AIAG Core Tools · 8D · SPC · MSA · 40+ years Quality Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </span>
            <button onClick={() => setMessages([{ id: '0', role: 'assistant', ts: getNow(), title: 'Session Cleared', text: 'Session cleared. Ask me anything about quality management.' }])}
              className="text-xs text-violet-600 hover:text-violet-900 px-3 py-1.5 rounded-lg hover:bg-violet-800/40 transition">
              🗑 Clear
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white border-r border-[#dbeafe] flex flex-col overflow-hidden">
          <div className="flex border-b border-[#dbeafe]">
            {(['prompts', 'about'] as const).map(t => (
              <button key={t} onClick={() => setSideTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all capitalize ${
                  sideTab === t ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-400' : 'text-[#1e3a5f] hover:text-white'
                }`}>
                {t === 'prompts' ? '💬 Prompts' : 'ℹ️ About'}
              </button>
            ))}
          </div>

          {sideTab === 'prompts' && (
            <div className="flex-1 overflow-y-auto py-2">
              {PROMPT_GROUPS.map(g => (
                <div key={g.group} className="mb-1">
                  <div className="px-3 py-1.5 text-xs font-bold text-[#1e3a5f] uppercase tracking-wider flex items-center gap-1.5">
                    <span>{g.icon}</span>{g.group}
                  </div>
                  {g.prompts.map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="w-full text-left px-3 py-2 text-xs text-[#1e3a5f] hover:text-white hover:bg-violet-900/30 transition-all leading-snug border-l-2 border-transparent hover:border-violet-500 ml-1">
                      {p}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {sideTab === 'about' && (
            <div className="flex-1 overflow-y-auto p-3 text-xs text-[#1e3a5f] space-y-3">
              <div className="bg-violet-900/20 border border-violet-800/30 rounded-xl p-3">
                <div className="text-violet-700 font-bold mb-1">Knowledge Base</div>
                <p>Built-in expert knowledge covering 40+ quality management topics aligned with IATF 16949, AIAG standards, and best practices.</p>
              </div>
              <div className="bg-white rounded-xl p-3 space-y-1.5">
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
                  <div key={t} className="flex items-center gap-2 text-[#1e3a5f]">
                    <span>{ic}</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-800/30 rounded-xl p-3 text-amber-600">
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
                    <div className="text-xs text-violet-600 font-semibold mb-1 px-1">{msg.title}</div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-700 text-white rounded-tr-sm'
                      : 'bg-white text-[#1e3a5f] rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: '<p>' + formatResponse(msg.text) + '</p>' }} />
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-[#1e3a5f]">{msg.ts}</span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => copyText(msg.text)} className="text-xs text-[#1e3a5f] hover:text-[#1e3a5f] transition">
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
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3">
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
          <div className="px-4 py-2 border-t border-[#dbeafe] flex gap-2 overflow-x-auto flex-shrink-0">
            {['8D structure', 'IATF clauses', 'Cpk vs Ppk', 'GRR interpretation', 'PPAP levels', 'Control Plan'].map(q => (
              <button key={q} onClick={() => send(q)}
                className="flex-shrink-0 text-xs bg-white hover:bg-violet-50 text-[#1e3a5f] hover:text-violet-700 border border-[#dbeafe] hover:border-violet-600 px-3 py-1.5 rounded-full transition-all">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#dbeafe] flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 bg-white border border-[#dbeafe] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-[#1e3a5f] placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
                placeholder="Ask anything about quality management — IATF, PPAP, 8D, SPC, PFMEA, MSA..."
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
              />
              <button onClick={() => send(input)} disabled={!input.trim() || thinking}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-[#1e3a5f] text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all flex-shrink-0">
                {thinking ? '⏳' : '↑ Send'}
              </button>
            </div>
            <p className="text-xs text-[#1e3a5f] mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
          </div>

        </div>
      </div>
    </div>
  );
}
