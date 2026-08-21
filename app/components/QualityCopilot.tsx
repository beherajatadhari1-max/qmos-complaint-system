'use client';
import { useState, useRef, useEffect } from 'react';

// -- Types ----------------------------------------------------------------------
interface Msg { id: string; role: 'user'|'assistant'; text: string; ts: string; }

export type QualityPage =
  | 'audit' | 'tqm' | 'supplier-complaints' | 'manufacturing'
  | 'incoming-quality' | 'internal-ncr' | 'outgoing-quality' | 'process-quality'
  | 'supplier-quality' | 'capa' | 'training' | 'managerial' | 'tasks'
  | 'documents' | 'learning' | 'calendar' | '8d' | 'customer-quality'
  | 'analytics' | 'warranty-quality';

// -- Per-page context -----------------------------------------------------------
const PAGE_META: Record<QualityPage, { label: string; icon: string; color: string; chips: string[] }> = {
  'audit':            { label:'Internal Audit',     icon:'🔍', color:'#065f46', chips:['Common IATF audit NCs','8 auditing principles','How to prepare for IATF audit?','Internal audit programme Cl. 9.2'] },
  'tqm':              { label:'TQM / KPIs',         icon:'📊', color:'#1e40af', chips:['How to calculate COQ?','What is Kaizen?','Management Review agenda','Customer satisfaction Cl. 9.1.2'] },
  'supplier-complaints':{ label:'Supplier Complaints', icon:'📨', color:'#991b1b', chips:['How to raise a SCAR?','8D steps explained','IATF 8.4 requirements','Supplier corrective action process'] },
  'manufacturing':    { label:'Manufacturing',      icon:'🏭', color:'#78350f', chips:['OEE calculation formula','4M change process','7 wastes TIMWOOD','5S methodology'] },
  'incoming-quality': { label:'Incoming Quality',   icon:'📥', color:'#164e63', chips:['AQL sampling plan','Layout inspection Cl. 8.6.1','Gauge R&R acceptance criteria','Calibration system Cl. 7.1.5'] },
  'internal-ncr':     { label:'Internal NCR',       icon:'⚠️', color:'#7f1d1d', chips:['CAPA vs correction difference','5-Why best practices','Is/Is Not analysis','Fishbone 6M categories'] },
  'outgoing-quality': { label:'Outgoing Quality',   icon:'📤', color:'#1e3a5f', chips:['Layout inspection Cl. 8.6.1','AQL sampling plan','OQC release criteria','Control Plan requirements'] },
  'process-quality':  { label:'Process Quality',    icon:'⚙️', color:'#134e4a', chips:['Cp Cpk Pp Ppk formulas','Control chart types','Out-of-control SPC rules','PFMEA structure'] },
  'supplier-quality': { label:'Supplier Quality',   icon:'🤝', color:'#312e81', chips:['Supplier scorecard KPIs','SCAR process','Approved Supplier List','Supplier development plan'] },
  'capa':             { label:'CAPA',               icon:'🔁', color:'#4a044e', chips:['CAPA vs correction difference','5-Why best practices','8D steps explained','Is/Is Not analysis'] },
  'training':         { label:'Training',           icon:'🎓', color:'#1e3a5f', chips:['Skill matrix vs competency','IATF Cl. 7.2 requirements','OJT evaluation method','Training effectiveness check'] },
  'managerial':       { label:'Managerial',         icon:'👔', color:'#1e293b', chips:['Management Review Cl. 9.3','Cost of quality framework','Risk-based thinking Cl. 6.1','Customer satisfaction Cl. 9.1.2'] },
  'tasks':            { label:'Tasks / Actions',    icon:'✅', color:'#064e3b', chips:['Action priority matrix','SMART action writing','Kaizen methodology','Contingency planning IATF'] },
  'documents':        { label:'Document Control',   icon:'📁', color:'#3b0764', chips:['Document control Cl. 7.5','Document numbering system','Revision control best practice','Customer specific requirements CSR'] },
  'learning':         { label:'Learning',           icon:'📚', color:'#1c1917', chips:['PPAP 18 elements','APQP 5 phases overview','7 wastes TIMWOOD','Poka-yoke types'] },
  'calendar':         { label:'Quality Calendar',   icon:'📅', color:'#164e63', chips:['Internal audit programme','Calibration system','Management review frequency','Layout inspection requirements'] },
  '8d':               { label:'Problem Solving',    icon:'🔴', color:'#7f1d1d', chips:['8D steps explained','5-Why best practices','Fishbone 6M categories','Is/Is Not analysis'] },
  'customer-quality': { label:'Customer Quality',   icon:'👥', color:'#1e3a5f', chips:['Customer PPM formula','Warranty R/1000 calculation','Customer complaint escalation','Customer satisfaction Cl. 9.1.2'] },
  'analytics':        { label:'Quality Goals',      icon:'🎯', color:'#1e3a5f', chips:['Customer PPM formula','Cost of quality framework','Cp Cpk Pp Ppk formulas','Management Review Cl. 9.3'] },
  'warranty-quality': { label:'Warranty & Field',   icon:'🛡️', color:'#7f1d1d', chips:['Warranty R/1000 calculation','Customer complaint escalation','8D steps explained','Warranty analysis process'] },
};

// -- Knowledge Base (54 entries) ------------------------------------------------
const KB: { keys: string[]; title: string; answer: string }[] = [
  // -- AUDIT --------------------------------------------------------------------
  { keys:['audit nc','common nc','common nonconformity','typical finding'],
    title:'Common IATF 16949 Audit Nonconformities',
    answer:`**Top 10 Most Common IATF 16949 Audit NCs:**

**Major NCs (Clause Reference):**
1. Cl. 7.2 — No objective evidence of competency evaluation for operators
2. Cl. 8.3.4.4 — Design change notification not sent to customer before implementation
3. Cl. 9.2 — Audit programme not covering all processes/shifts/locations
4. Cl. 8.6.1 — No layout inspection records for FG in last 12 months
5. Cl. 10.2.3 — 8D raised but root cause is a symptom, not systemic

**Minor NCs:**
6. Cl. 7.5 — Documents not controlled — obsolete versions found on shopfloor
7. Cl. 8.4.3 — Incoming inspection records missing for some lots
8. Cl. 8.5.1 — Setup records incomplete — signoff missing
9. Cl. 9.1.3 — Internal audit findings not linked to CAPA
10. Cl. 5.1.1 — Top management not aware of quality objectives

**Tip:** Address Major NCs within 7 days response, Minor within 30 days.` },

  { keys:['audit principle','8 principle','iso audit principle'],
    title:'8 Principles of Auditing (ISO 19011)',
    answer:`**8 Principles of Auditing — ISO 19011:2018**

1. **Integrity** — Foundation of professionalism; auditors are honest, diligent, responsible
2. **Fair presentation** — Report truthfully and accurately; include unresolved disputes
3. **Due professional care** — Apply sound judgement in all audit situations
4. **Confidentiality** — Protect information; do not disclose without authority
5. **Independence** — Free from bias; audit own area only with special precautions
6. **Evidence-based approach** — Audit findings based on verifiable, reproducible evidence
7. **Risk-based approach** — Audit planning considers risks to achieving objectives
8. **Impartiality** — Balanced; not influenced by the auditee

**Key difference from IATF:** IATF adds process approach and customer focus as mandatory audit lenses.` },

  { keys:['prepare audit','iatf preparation','audit ready','before audit'],
    title:'IATF 16949 Audit Preparation Checklist',
    answer:`**IATF 16949 Certification Audit — Preparation Guide**

**Documents to keep ready:**
- Quality Manual (scope, exclusions, context)
- Quality Policy signed by Top Management
- Quality Objectives with KPI data (last 12 months)
- Internal Audit Schedule + all audit records
- Management Review MOM (last 3 reviews)
- Calibration register with valid certs
- Competency matrix + training records

**Records to have accessible:**
- CAPA log with effectiveness evidence
- Customer complaint register
- Supplier audit records + approved supplier list
- PPAP files for all active parts
- SPC control charts for critical characteristics
- MSA / GRR studies

**Shopfloor must-haves:**
- Current drawing / specification at work station
- Control Plan at each operation
- OI / Work Instructions (rev-controlled)
- No obsolete documents visible
- Poka-yoke devices functional and verified

**24-hour before audit:** Brief all team leads. Ensure calibrated instruments at stations.` },

  // -- OEE / MANUFACTURING -------------------------------------------------------
  { keys:['oee','overall equipment effectiveness','oee formula','oee calculation'],
    title:'OEE Formula & World Class Targets',
    answer:`**OEE — Overall Equipment Effectiveness**

**Formula:**
\`OEE = Availability × Performance × Quality\`

**Availability = (Planned Time − Downtime) ÷ Planned Time**
→ Accounts for breakdowns, changeovers, setups

**Performance = (Actual Output × Ideal Cycle Time) ÷ Run Time**
→ Accounts for reduced speed, minor stops

**Quality = Good Parts ÷ Total Parts**
→ Accounts for rejects, rework, startup scrap

**World Class Targets:**
- Availability ≥ 90%
- Performance ≥ 95%
- Quality ≥ 99.9%
- **OEE ≥ 85%** (World Class)

**Typical Starting Points:**
- Batch manufacturing: 45–65% OEE
- Automotive plants: 55–75% OEE
- World class automotive: ≥ 85%

**Top 6 Big Losses (TPM):**
1. Breakdowns  2. Setup/Changeover  3. Minor stops  4. Reduced speed  5. Startup scrap  6. Production rejects` },

  { keys:['4m change','4m','man machine material method change'],
    title:'4M Change Management — IATF 16949 Cl. 8.5.6',
    answer:`**4M Change Management Process**

**What is 4M?** Any change in Man, Machine, Material, or Method (also includes: Measurement, Management, Mother Nature)

**IATF 16949 Cl. 8.5.6 Requirements:**
- Document all changes that could affect product/process
- Customer notification required for certain change categories
- Validation required before production restart

**Change Categories Requiring Customer Approval:**
- New / different raw material supplier
- New plant location
- New tooling (not just replacement)
- Major process parameter change
- New sub-contractor for controlled special process

**4M Change Process:**
1. Identify the change (what, why, when)
2. Risk assessment — does it affect form/fit/function?
3. Customer notification if required (PPAP may be needed)
4. Trial run / first-off inspection
5. Update Control Plan, FMEA, work instructions
6. Train affected operators
7. Validate output quality before mass production

**PPAP Required?** New part = Level 3 PSW. Change = customer defines level.` },

  // -- AQL / INCOMING QUALITY ---------------------------------------------------
  { keys:['aql','acceptance quality limit','sampling plan','aql table'],
    title:'AQL Sampling Plan — ANSI/ASQ Z1.4',
    answer:`**AQL Sampling Plan (ANSI/ASQ Z1.4 — Attribute Sampling)**

**AQL Levels:**
- AQL 0.65 → Critical characteristics (safety, regulatory)
- AQL 1.0  → Major defects (functional failure)
- AQL 2.5  → Minor defects (cosmetic, non-functional)
- AQL 4.0  → Very minor / packaging

**Inspection Levels:**
- Level I — Reduced (lower discrimination, use when supplier is stable)
- Level II — Normal (standard default)
- Level III — Tightened (use when recent rejections found)

**Quick Reference (Normal, Level II):**
| Lot Size | Sample Code | AQL 1.0 | AQL 2.5 |
|----------|-------------|---------|---------|
| 51-90    | E           | n=13, Ac=0, Re=1 | n=13, Ac=1, Re=2 |
| 91-150   | F           | n=20, Ac=0, Re=1 | n=20, Ac=1, Re=2 |
| 281-500  | H           | n=50, Ac=1, Re=2 | n=50, Ac=3, Re=4 |
| 1201-3200| K           | n=125, Ac=2, Re=3 | n=125, Ac=7, Re=8 |

**Switching Rules:** 2 consecutive PASS → Reduced. 1 FAIL → Tightened. 5 consecutive PASS in Tightened → back to Normal.` },

  // -- COQ -----------------------------------------------------------------------
  { keys:['coq','cost of quality','cost of poor quality','copq','cost of quality calculation'],
    title:'Cost of Quality (COQ) Framework',
    answer:`**Cost of Quality (COQ) — 4 Categories**

**1. Prevention Costs (Good Investment)**
- Quality planning, APQP, FMEA
- Supplier qualification, SQE audits
- Training and competency development
- Calibration and measurement system

**2. Appraisal Costs (Necessary)**
- Incoming inspection (IQC)
- In-process inspection (IPQC)
- Final inspection (OQC/FQC)
- Gauge calibration, lab testing

**3. Internal Failure Costs (WASTE)**
- Scrap, rework, reprocess
- Re-inspection after rework
- Downtime due to quality issues
- Engineering change scrap

**4. External Failure Costs (CRITICAL WASTE)**
- Customer returns and warranty
- Customer line stoppages, premium freight
- SCAR processing cost
- Loss of future business

**Industry Benchmark:**
- COQ as % of Sales: 5–15% (low-maturity) | 1–3% (world class)
- Internal:External ratio should be 3:1 or better

**Formula:** Total COQ = Prevention + Appraisal + Internal Failure + External Failure` },

  // -- DOCUMENT CONTROL ----------------------------------------------------------
  { keys:['document control','document numbering','revision control','doc control','iatf 7.5'],
    title:'Document Control — IATF 16949 Cl. 7.5',
    answer:`**Document Control Requirements — IATF 16949 Cl. 7.5**

**Mandatory Documented Information:**
- Quality Manual (or equivalent)
- Quality Policy and Objectives
- Process documentation (scope as needed)
- Control Plans, FMEAs, Work Instructions, SOPs

**Document Control Must Ensure:**
✓ Availability at point of use (right version, right place)
✓ Adequacy for use (current, clear, complete)
✓ Protection from unintended alteration
✓ Controlled distribution (know who has which version)
✓ Obsolete documents identified and prevented from use

**Best Practice — Document Numbering System:**
\`[DEPT]-[TYPE]-[SEQ]-[REV]\`
Example: MFG-SOP-001-Rev.B | QA-CP-003-Rev.A

**Revision Control:**
- Record what changed, why, who approved, when
- Obsolete version stamped/watermarked "SUPERSEDED"
- Master list maintained showing current rev for all docs

**Common NC:** Unapproved document found on shopfloor (Rev. A at station, Rev. B is current).` },

  // -- CAPA ---------------------------------------------------------------------
  { keys:['capa vs correction','correction vs corrective','difference capa'],
    title:'Correction vs Corrective Action vs Preventive Action',
    answer:`**Three Types of Response to Problems (ISO 9000)**

**Correction**
- Immediate action to eliminate a detected nonconformity
- Does NOT address root cause
- Example: Sort and rework the defective batch; containment sorting at customer
- Required by: IATF 10.2.1

**Corrective Action (CAPA)**
- Eliminates the ROOT CAUSE to prevent recurrence
- Must be proportionate to the effect of the nonconformity
- Must be verified for effectiveness
- Example: Change tool change interval from 600 to 450 pcs after root cause identified as tool wear
- Required by: IATF 10.2.3

**Preventive Action**
- Proactive action to eliminate POTENTIAL root cause before nonconformity occurs
- Based on risk assessment (FMEA, audit findings, trend data)
- Example: Add poka-yoke before similar defect type has occurred on a new line
- Required by: IATF 10.2.4 (risk-based thinking throughout)

**Key Audit Question:** "Show me the effectiveness verification for this CAPA."
**Trap:** Auditors check whether the same failure mode recurred after CAPA closure.` },

  // -- SUPPLIER QUALITY ----------------------------------------------------------
  { keys:['supplier scorecard','scorecard kpi','supplier kpi','supplier performance'],
    title:'Supplier Scorecard — KPIs & Weights',
    answer:`**Supplier Scorecard — Recommended KPIs**

| KPI | Weight | Target | Red Threshold |
|-----|--------|--------|---------------|
| Incoming PPM | 25% | ≤ 500 PPM | > 2000 PPM |
| On-Time Delivery (OTD) | 20% | ≥ 98% | < 90% |
| SCAR Response Time | 15% | ≤ 7 days | > 14 days |
| SCAR Recurrence Rate | 15% | 0% | > 1 repeat |
| PPAP Approval Rate | 10% | 100% | < 80% |
| Audit Score | 10% | ≥ 85% | < 70% |
| 4M Change Notification | 5% | 100% | Any missed |

**Scorecard Rating:**
- A (≥ 85%) — Preferred Supplier
- B (70–84%) — Conditional — Development Plan Required
- C (< 70%) — Restricted — Increased Inspection + Audit

**IATF Requirement:** Review and update ASL annually. Re-qualify C-rated suppliers.
**Customer Specific:** Ford requires Q1 status; GM requires BIQS score ≥ 7.` },

  // -- TRAINING -----------------------------------------------------------------
  { keys:['skill matrix','competency matrix','skill vs competency'],
    title:'Skill Matrix vs Competency Matrix',
    answer:`**Skill Matrix vs Competency Matrix — What is the Difference?**

**Skill Matrix:**
- Lists specific job tasks/skills
- Rates current vs required proficiency (e.g., 0-4 scale)
- Used for: Training gap identification, workforce planning
- Updated: Quarterly or after each training cycle
- Format: Person × Skill grid

**Competency Matrix:**
- Covers broader competency domains (education + training + experience)
- Aligned to IATF Cl. 7.2 (Competence requirements)
- Documents: Required qualifications, current status, gap actions
- Includes: Regulatory certifications (welding, forklift, NDT)
- Updated: Annually + after role changes

**IATF 16949 Cl. 7.2 Requirements:**
✓ Determine necessary competence
✓ Ensure persons are competent (education, training, experience)
✓ Take actions to acquire necessary competence
✓ Evaluate effectiveness of actions taken
✓ Retain documented evidence (records)

**Common NC:** "Operators are trained — but effectiveness of training not evaluated."
**Best Practice:** Skills-based test or demonstrated performance eval within 30 days of training.` },

  // -- CALIBRATION ---------------------------------------------------------------
  { keys:['calibration','instrument calibration','iatf 7.1.5','calibration interval'],
    title:'Calibration System — IATF 16949 Cl. 7.1.5.1',
    answer:`**Calibration Requirements — IATF 16949 Cl. 7.1.5.1**

**What Must Be Calibrated:**
All monitoring and measuring equipment used to verify product/process conformance.

**Calibration Record Must Contain:**
- Instrument ID, description, range
- Calibration date and due date
- Calibration result (pass/fail, measured values)
- Uncertainty of measurement
- Reference standard used (traceable to national standard — NABL in India)
- Calibrated by signature

**Calibration Intervals — Setting Criteria:**
- Based on measurement risk, usage frequency, environmental conditions
- Historical drift data (if instrument consistently drifts before due date → shorten interval)
- OEM recommendation
- Review interval annually

**Out-of-Calibration (OOC) Procedure — IATF Requirement:**
1. Remove from service immediately
2. Tag as "DO NOT USE — Out of Calibration"
3. Assess impact: Was this instrument used since last valid calibration?
4. If yes: Identify all products measured → risk assessment → customer notification if required
5. Corrective action on calibration process
6. Re-calibrate before return to service

**Common NC:** Instruments found on shopfloor with expired calibration sticker.` },

  // -- 8D / PROBLEM SOLVING ------------------------------------------------------
  { keys:['8d step','8d process','eight discipline','d0 d1 d2 d3'],
    title:'8D Eight Disciplines — Step by Step',
    answer:`**8D Problem Solving — Complete Guide**

**D0 — Emergency Response**
Act BEFORE you know root cause. Protect customer NOW.
Actions: 100% sort, quarantine suspect stock, customer containment.

**D1 — Team Formation**
Cross-functional team. Champion + members from Quality, Production, Engineering.
Required: At least one person with technical knowledge of the process.

**D2 — Problem Description (5W2H)**
What: Exact defect | Who: Which customer/line | Where: Which location/operation
When: First occurrence date | How Many: Defect qty and PPM | How: Found how?

**D3 — Interim Containment**
Protect customer until D5 (permanent CA) is implemented.
Must be: Verifiable and documented. Date-stamped.

**D4 — Root Cause Analysis**
Identify:
1. Why Made (process root cause)
2. Why Shipped (detection failure root cause)
Use: 5-Why + Fishbone. Verify: turn problem on/off.

**D5 — Permanent Corrective Action**
Must address D4 root cause — not just the symptom.
Must include: Implementation plan, responsible owner, date.

**D6 — Verify Corrective Action**
Run sample lots with new process. Compare before/after data.
Statistical proof preferred (SPC, hypothesis test).

**D7 — Prevention**
Update: FMEA, Control Plan, Work Instructions, training.
Check: All similar products/processes for same risk.

**D8 — Closure**
Document lessons learned. Sign off with customer.
Congratulate team. Add to Lessons Learned DB.` },

  // -- MANAGEMENT REVIEW --------------------------------------------------------
  { keys:['management review','management review agenda','9.3','mgmt review'],
    title:'Management Review — IATF 16949 Cl. 9.3',
    answer:`**Management Review — IATF 16949 Cl. 9.3**

**Frequency:** Minimum once per year (IATF). Best practice: quarterly.

**Mandatory Inputs (Cl. 9.3.2):**
1. Status of actions from previous management reviews
2. Changes in external/internal issues (context of org)
3. QMS performance and effectiveness:
   - Customer satisfaction and complaints
   - Quality objectives achievement
   - Process performance + product conformity
   - NCR and corrective actions
   - Monitoring and measurement results
   - Audit results (internal + external)
   - Supplier performance
4. Resource adequacy
5. Risk and opportunity assessment (Cl. 6.1)
6. Opportunities for improvement

**IATF Specific Inputs — ALSO Required:**
- Cost of poor quality (COPQ)
- Effectiveness of actions to address risks
- Customer satisfaction surveys

**Mandatory Outputs (Cl. 9.3.3):**
- Decisions on improvement opportunities
- Changes to QMS needed
- Resource requirements

**Common NC:** MRM held but no documented output showing decisions and actions.` },

  // -- FMEA ---------------------------------------------------------------------
  { keys:['pfmea','process fmea','pfmea structure','process failure mode'],
    title:'PFMEA — Process Failure Mode & Effects Analysis',
    answer:`**PFMEA — AIAG-VDA (2019 Edition)**

**Purpose:** Identify and prevent potential failure modes in the manufacturing process BEFORE production.

**PFMEA Header Information:**
- Part name / number / drawing rev
- Process step / operation number
- Team members, FMEA date, revision date

**7-Step PFMEA Process (AIAG-VDA 2019):**
1. **Planning & Scoping** — Define scope, boundaries, timeline
2. **Structure Analysis** — Process flow: System → Sub-system → Process step
3. **Function Analysis** — What is the intended function of each step?
4. **Failure Analysis** — Failure Mode → Effect (up) → Cause (down)
5. **Risk Analysis** — Severity (S), Occurrence (O), Detection (D) ratings 1–10
6. **Optimization** — Action Priority (AP): H/M/L replaces old RPN
7. **Documentation** — Record actions taken, new S/O/D ratings

**Key Columns (AIAG-VDA format):**
- Process Step | Function | Failure Mode | Effect | S | Cause | O | Current Controls | D | AP | Action | Responsibility

**Linkage Rule:** Every PFMEA failure mode must link to Control Plan.
**Review trigger:** Any 4M change, customer complaint, new PPAP.` },

  { keys:['dfmea','design fmea','dfmea vs pfmea','design failure mode'],
    title:'DFMEA vs PFMEA — Key Differences',
    answer:`**DFMEA vs PFMEA — When & Who**

**DFMEA (Design FMEA)**
- Scope: Product design / engineering
- Owner: Design/R&D Engineer
- Question: "Can the design fail to meet the customer requirement?"
- Inputs: Customer requirements, engineering specs, DVP&R
- When: APQP Phase 2 (Product Design & Development)
- Failure modes: Dimensional out-of-spec, material weakness, wrong tolerance

**PFMEA (Process FMEA)**
- Scope: Manufacturing/assembly process
- Owner: Process/Manufacturing Engineer
- Question: "Can the process create a nonconforming product?"
- Inputs: DFMEA outputs, process flow, control plan
- When: APQP Phase 3 (Process Design & Development)
- Failure modes: Wrong torque, missed assembly, wrong material loaded

**Key Rule:** PFMEA Severity rating is taken FROM DFMEA — the process engineer does NOT change the severity value independently.

**IATF Requirement:** Both DFMEA and PFMEA required for new product launches (Cl. 8.3.3.3, 8.5.1.1).
**VDA Addition (2019):** Design-Process interface analysis step mandatory.` },

  { keys:['fmea severity','fmea occurrence','fmea detection','sod rating','severity rating','occurrence rating','detection rating'],
    title:'FMEA S-O-D Rating Scales (AIAG-VDA 2019)',
    answer:`**FMEA Severity — Occurrence — Detection Ratings (1–10)**

**SEVERITY (S) — Effect on Customer:**
- 10: Safety hazard without warning (regulatory violation)
- 9: Safety hazard with warning
- 8: Loss of primary function (vehicle inoperable)
- 7: Reduced primary function (customer very dissatisfied)
- 6: Loss of secondary function
- 5: Reduced secondary function (customer somewhat dissatisfied)
- 4: Cosmetic defect noticed by most customers
- 3: Cosmetic defect noticed by some customers
- 2: Cosmetic defect rarely noticed
- 1: No effect

**OCCURRENCE (O) — Frequency of Cause:**
- 10: Almost certain (≥ 1 in 2)
- 8-9: High (1 in 8 to 1 in 20)
- 6-7: Moderate (1 in 80 to 1 in 400)
- 4-5: Low (1 in 2,000 to 1 in 15,000)
- 2-3: Remote (1 in 150,000)
- 1: Almost impossible

**DETECTION (D) — Ability to Detect Before Reaching Customer:**
- 10: Cannot detect (no controls)
- 7-9: Difficult to detect
- 4-6: Moderate detection controls
- 2-3: High detection likelihood
- 1: Almost certain detection (100% automated)

**AIAG-VDA 2019 Change:** Action Priority (AP) replaces RPN as primary risk driver.` },

  { keys:['action priority','ap rating','rpn','riskpriority','aiag vda 2019','fmea ap'],
    title:'Action Priority (AP) — AIAG-VDA 2019 vs Old RPN',
    answer:`**Action Priority (AP) — AIAG-VDA FMEA 2019**

**Why AP replaced RPN:**
RPN = S × O × D could give same score for very different risk profiles.
Example: S=10, O=1, D=1 → RPN=10 vs S=1, O=1, D=10 → RPN=10 — same RPN but first is MUCH more dangerous.

**AP Table — Priority (H/M/L):**

| Severity | Occurrence | Detection | AP |
|----------|------------|-----------|-----|
| 9–10 | Any | Any | **H** (mandatory action) |
| 5–8 | 6–10 | 7–10 | **H** |
| 5–8 | 6–10 | 4–6 | **H** |
| 5–8 | 4–5 | 7–10 | **M** |
| 1–4 | Any | Any | **L** |

**AP Definitions:**
- **H (High):** Mandatory improvement — team must take action to reduce risk
- **M (Medium):** Action recommended — team should try to improve controls
- **L (Low):** Action at team discretion — may accept current risk

**Key Rule:** Severity 9-10 is always High AP regardless of O or D.
**Auditor Question:** "Show me all High AP items and the actions taken."` },

  { keys:['control plan','control plan requirements','cp structure','iatf 8.5.1.1'],
    title:'Control Plan — Structure & IATF Requirements',
    answer:`**Control Plan (CP) — IATF 16949 Cl. 8.5.1.1**

**3 Types of Control Plans:**
1. **Prototype CP** — Initial development/prototype builds
2. **Pre-launch CP** — Pilot / trial production before mass production
3. **Production CP** — Full mass production (this is what IATF audits)

**Mandatory CP Columns:**
- Part name, number, revision, date, customer name
- Process step / operation number and name
- Machine / jig / fixture / tool used
- Product characteristic (with SC symbol if applicable)
- Process characteristic
- Special characteristic classification (CC/SC/etc.)
- Product/process specification with tolerance
- Evaluation / measurement technique (gauge type)
- Sample size and frequency
- Control method (how controlled — SPC, check sheet, poka-yoke)
- Reaction plan (what to do if out of control)

**Linkage Rule:** CP must link to PFMEA — same process steps, same failure modes.
**Review triggers:** Customer complaint, 4M change, new PPAP, annual review.
**IATF NC:** Control Plan exists but reaction plan is blank or says "inform supervisor" without detail.` },

  // -- MSA ----------------------------------------------------------------------
  { keys:['msa','gauge rr','grr','measurement system analysis','gage r&r','gage repeatability'],
    title:'MSA / Gauge R&R — Introduction',
    answer:`**MSA — Measurement System Analysis (AIAG MSA 4th Ed.)**

**Purpose:** Verify that the measurement system (gauge + operator + environment) is capable of measuring what it's supposed to measure accurately.

**Why it Matters:** A bad gauge can wrongly accept bad parts or reject good parts — both cause customer issues or production waste.

**5 Components of Measurement Error:**
1. **Bias** — Difference between measured value and true/reference value
2. **Linearity** — Does bias change across the measurement range?
3. **Stability** — Does bias drift over time?
4. **Repeatability (EV)** — Gauge variation: same operator, same part, multiple readings
5. **Reproducibility (AV)** — Appraiser variation: different operators, same part, same gauge

**GRR Study Setup (Classic):**
- 2–3 operators
- 10 parts (covering process range)
- 2–3 replications each
- Parts measured in random order, operators blind to each other's readings

**Key Output:** % GRR = (GRR variation) ÷ (Total variation or tolerance) × 100

**IATF Requirement:** MSA required for all measurement systems referenced in Control Plan (Cl. 7.1.5.1.1).` },

  { keys:['grr acceptance','grr criteria','msa acceptance','grr result','grr pass fail','10 percent','30 percent'],
    title:'GRR Acceptance Criteria (AIAG MSA)',
    answer:`**Gauge R&R — Acceptance Criteria (AIAG MSA 4th Edition)**

**% GRR (% of Study Variation OR % of Tolerance):**

| % GRR | Decision | Action |
|-------|----------|--------|
| < 10% | **ACCEPTABLE** | Gauge is capable — no action needed |
| 10–30% | **MARGINAL** | May be acceptable — consider cost, gauge application, importance of characteristic |
| > 30% | **NOT ACCEPTABLE** | Reject gauge — improve or replace before use |

**% Contribution (Preferred metric by AIAG):**
- Variance components: Part-to-Part, Repeatability, Reproducibility
- % Gauge Contribution < 1% → Excellent
- % Gauge Contribution 1–9% → Acceptable
- % Gauge Contribution ≥ 9% → Unacceptable

**Number of Distinct Categories (ndc):**
- ndc ≥ 5 → Acceptable (gauge can detect at least 5 distinct categories)
- ndc < 5 → Not acceptable

**Common Causes of High GRR:**
- Operator technique variation → Training required
- Gauge not to specification → Recalibrate or replace
- Part loading/clamping inconsistency → Fixture needed
- Environment (vibration, temperature) → Control conditions

**Tip:** When % GRR is borderline (10–30%), calculate % of Tolerance — use the tighter of the two.` },

  { keys:['bias study','linearity study','stability study','msa bias','gauge bias'],
    title:'MSA Bias, Linearity & Stability Studies',
    answer:`**MSA — Bias, Linearity & Stability (AIAG MSA 4th Ed.)**

**BIAS STUDY**
Purpose: Is our gauge reading the true value?
Method: Measure a reference standard (known value) 15+ times, same operator.
Bias = Average of readings − Reference value
Acceptance: Bias should be statistically zero (t-test at 95% CI).
Action if biased: Calibrate gauge, check zero point, check worn reference.

**LINEARITY STUDY**
Purpose: Is bias consistent across the entire measurement range?
Method: Select 5 reference parts spanning the full operating range. Measure each 10+ times.
Plot: Bias vs Reference Value — should be a flat line near zero.
Acceptance: Regression slope not significantly different from zero; R² ≥ 0.95 preferred.
Common cause: Worn gauge at one end of scale, non-linear sensor.

**STABILITY STUDY**
Purpose: Does the gauge stay accurate over time?
Method: Measure the same reference standard periodically (daily/weekly) over time. Plot on control chart (Xbar-R or Individuals).
Acceptance: Process must be in statistical control — no trends, shifts, or special causes.
Frequency: Typically monthly; more frequent for critical gauges.

**Audit Question:** "Show me the stability study for your critical CMM / micrometer."` },

  { keys:['attribute agreement','attribute msa','attribute gage','go no go','pass fail gauge'],
    title:'Attribute Agreement Analysis (AAA)',
    answer:`**Attribute Agreement Analysis (AAA) — For Pass/Fail Gauges**

**When Used:** Go/No-Go gauges, visual inspection, colour comparison, tactile feel checks — any measurement that gives a category result (Good/Bad, Pass/Fail, Grade A/B/C).

**Study Setup:**
- 2–3 appraisers
- 20–50 samples (include known good AND known bad parts — roughly 50:50)
- 2–3 replications, random order, blind to others
- Reference (correct) answer known for each part

**Key Metrics:**

**Within Appraiser Agreement:**
- % agreement with themselves across trials
- Target: ≥ 90% within-appraiser agreement

**Between Appraiser Agreement:**
- % agreement between all appraisers
- Target: ≥ 80% between-appraiser agreement

**Agreement vs Standard (Reference):**
- % agreement with the known correct answer
- Target: ≥ 90% vs standard

**Kappa Statistic:**
- κ ≥ 0.75 → Excellent
- κ 0.40–0.74 → Marginal (improve)
- κ < 0.40 → Poor (unacceptable)

**Common Failure Points:** Poorly defined acceptance criteria (no visual standard), operator fatigue, inadequate lighting.` },

  // -- SPC ----------------------------------------------------------------------
  { keys:['cpk','cp','ppk','pp','process capability','capability index','cpk formula'],
    title:'Cp, Cpk, Pp, Ppk — Formulas & Targets',
    answer:`**Process Capability Indices — Complete Guide**

**Cp — Potential Capability (Short-term, centred):**
\`Cp = (USL − LSL) ÷ (6σ_within)\`
Measures: Does the process HAVE the ability to fit within spec?

**Cpk — Actual Capability (Short-term, considers centering):**
\`Cpk = Min[(USL − X̄) ÷ (3σ), (X̄ − LSL) ÷ (3σ)]\`
Measures: Is the process ACTUALLY fitting within spec right now?

**Pp — Performance Index (Long-term, centred):**
\`Pp = (USL − LSL) ÷ (6σ_overall)\`
Uses overall/long-term sigma — includes between-subgroup variation.

**Ppk — Actual Performance (Long-term, considers centering):**
\`Ppk = Min[(USL − X̄) ÷ (3σ_overall), (X̄ − LSL) ÷ (3σ_overall)]\`

**Key Difference:** Cp/Cpk use within-subgroup sigma (σ̂ = R̄/d₂). Pp/Ppk use overall sigma (s total).

**IATF Targets:**
- Special Characteristics (SC/CC): Cpk ≥ 1.67 (initial), ≥ 1.33 ongoing
- Non-special characteristics: Cpk ≥ 1.33 (initial), ≥ 1.00 ongoing
- PPAP requirement: Cpk ≥ 1.67 for all SC during 300-piece study

**Rule:** If Cp >> Cpk, process is capable but OFF-CENTRE — adjust mean.` },

  { keys:['control chart','xbar r chart','x bar','control chart type','spc chart','which chart'],
    title:'SPC Control Chart Types — Which Chart to Use?',
    answer:`**SPC Control Charts — Selection Guide**

**Variable Data (Measurements — Length, Weight, Diameter):**

| Subgroup Size | Chart | Use When |
|---------------|-------|----------|
| n = 1 | Individuals (I-MR) | One measurement per time point, slow process |
| n = 2–9 | Xbar-R | Most manufacturing processes |
| n ≥ 10 | Xbar-S | Large subgroups, better sigma estimate |

**Attribute Data (Counts — Defects, Defectives):**

| What You're Counting | Constant Sample? | Chart |
|----------------------|------------------|-------|
| Defective UNITS | Yes | np chart |
| Defective UNITS | No | p chart |
| DEFECTS per unit | Yes | c chart |
| DEFECTS per unit | No | u chart |

**Control Limits Formula (Xbar-R):**
- UCL_Xbar = X̄̄ + A₂ × R̄ | LCL_Xbar = X̄̄ − A₂ × R̄
- UCL_R = D₄ × R̄ | LCL_R = D₃ × R̄ (= 0 for n ≤ 6)

**Key Rule:** Control limits are calculated FROM data — NOT from specification limits.
**Common NC:** Control limits set equal to spec limits (wrong!) or calculated from one week's data.` },

  { keys:['out of control','nelson rule','western electric','spc rule','control chart signal','special cause'],
    title:'Out-of-Control Rules — SPC Special Cause Signals',
    answer:`**Out-of-Control Detection Rules — Nelson / Western Electric**

**Rule 1 (Any point beyond 3σ):** One point outside UCL or LCL
→ Special cause — STOP, investigate immediately

**Rule 2 (Run of 9):** Nine consecutive points on same side of centreline
→ Process mean has shifted — check for tool wear, new material lot, new operator

**Rule 3 (Trend of 6):** Six consecutive points trending up or down
→ Progressive change — check tool wear, temperature drift, gradual raw material change

**Rule 4 (Alternating):** Fourteen consecutive points alternating up/down
→ Two different populations mixed — check shift differences, 2 machines feeding one chart

**Rule 5 (2 of 3 beyond 2σ):** Two out of three consecutive points beyond 2σ on same side
→ Large shift in mean

**Rule 6 (4 of 5 beyond 1σ):** Four out of five consecutive points beyond 1σ on same side
→ Moderate shift in mean

**Reaction Plan (IATF requirement for Control Plan):**
1. Stop or segregate suspect output
2. Inform supervisor / quality
3. Investigate and identify cause
4. Adjust and verify return to control
5. Document in SPC log

**IATF Audit:** "Show me the reaction plans in your Control Plan and evidence of SPC reactions taken."` },

  // -- PPAP ---------------------------------------------------------------------
  { keys:['ppap 18','ppap element','ppap requirement','ppap checklist','18 element'],
    title:'PPAP — 18 Elements (AIAG 4th Edition)',
    answer:`**PPAP 18 Elements — Complete List**

1. Design Records (drawings, CAD, BOM)
2. Engineering Change Documents (if applicable)
3. Customer Engineering Approval (for appearance items)
4. DFMEA (Design FMEA — if design responsible)
5. Process Flow Diagram
6. PFMEA (Process FMEA)
7. Control Plan (Production Control Plan)
8. Measurement System Analysis (MSA/GRR studies)
9. Dimensional Results (balloon drawing + all dimensions)
10. Records of Material / Performance Test Results
11. Initial Process Studies (Cpk/Ppk ≥ 1.67 for SC)
12. Qualified Laboratory Documentation (NABL/accredited lab certs)
13. Appearance Approval Report (AAR) — if appearance item
14. Sample Production Parts (as specified by customer)
15. Master Sample (retained at supplier and/or customer)
16. Checking Aids (gauges, fixtures — calibrated)
17. Customer-Specific Requirements (CSR compliance)
18. Part Submission Warrant (PSW) — signed, dated

**Most Critical:** #11 (Cpk ≥ 1.67), #6 (PFMEA complete), #7 (Control Plan), #18 (PSW signed).
**Common NC:** PSW submitted but MSA studies not completed or Cpk < 1.67 for SC.` },

  { keys:['ppap level','submission level','level 1 ppap','level 3 ppap','ppap level 1 2 3 4 5'],
    title:'PPAP Submission Levels 1–5',
    answer:`**PPAP Submission Levels — What Goes to Customer?**

**Level 1 — Warrant Only**
- Part Submission Warrant (PSW) only
- Used for: Very minor changes, bulk commodities, customer-directed level

**Level 2 — Warrant + Limited Samples/Data**
- PSW + limited supporting data + sample parts
- Used for: Standard components, customer request for limited review

**Level 3 — Warrant + Complete Supporting Data (DEFAULT)**
- PSW + all 18 elements (as applicable)
- This is the standard level for most automotive customers
- New part launches: Always Level 3 unless customer specifies otherwise

**Level 4 — Warrant + Other Requirements Defined by Customer**
- Customer defines exactly what is needed
- Used for: Specific customer requirements (Ford Q1, etc.)

**Level 5 — Warrant + Complete Documentation Reviewed at Supplier**
- All records available at supplier location
- Customer reviews at supplier site
- Used for: High-risk supplier qualification, new supplier onboarding

**Rule:** Default = Level 3. Deviation from Level 3 requires customer written approval.
**Retention:** Supplier retains all PPAP records for 1 year after part discontinuation + customer retention requirement.` },

  { keys:['when ppap','ppap trigger','ppap required when','ppap submission required'],
    title:'When is PPAP Required? — Trigger Events',
    answer:`**PPAP Submission Triggers — AIAG PPAP 4th Edition**

**New Part / New Program:**
✓ New part number never supplied to this customer before (Level 3)
✓ New customer, even for existing part (Level 3)

**Engineering Changes:**
✓ Change to design record (drawing/spec) that affects form, fit, or function
✓ Material change (raw material, supplier, composition)
✓ Customer-approved engineering change

**Process Changes:**
✓ New or modified tooling (not maintenance replacement)
✓ New manufacturing process or location
✓ New sub-contractor for controlled/special process
✓ Process parameter change outside PPAP-approved range
✓ New source for outsourced operations

**Production Interruptions:**
✓ Production not supplied for 12+ consecutive months
✓ Return from a customer shutdown, quality hold

**Corrective Action:**
✓ Requested after a customer concern / field failure
✓ Requested after a warranty claim pattern

**Does NOT Require PPAP:**
- Like-for-like tooling maintenance replacement (same spec)
- Process improvement not affecting product
- Administrative changes only

**Best Practice:** When in doubt → ask customer. Undisclosed changes = major audit NC.` },

  // -- APQP ---------------------------------------------------------------------
  { keys:['apqp phase','apqp 5 phase','apqp overview','advanced product quality planning','apqp steps'],
    title:'APQP — 5 Phases Overview',
    answer:`**APQP — Advanced Product Quality Planning (AIAG)**

**What is APQP?** A structured framework to ensure a new product satisfies the customer.
It runs parallel with the product development timeline, NOT after it.

**Phase 1 — Plan and Define Program**
Inputs: Customer needs, benchmarking, product/process assumptions
Outputs: Design goals, reliability/quality targets, preliminary BOM, preliminary process flow

**Phase 2 — Product Design & Development**
Inputs: Phase 1 outputs, engineering standards
Outputs: DFMEA, design verification plan (DVP&R), design reviews, prototype build plan, engineering drawings

**Phase 3 — Process Design & Development**
Inputs: Phase 2 outputs (DFMEA, drawings)
Outputs: PFMEA, Process Flow Diagram, Control Plan (pre-launch), floor plan, MSA plan, SPC plan

**Phase 4 — Product & Process Validation**
Inputs: Phase 3 outputs
Outputs: Production trial run, MSA (GRR), initial process studies (Cpk), PPAP submission, production validation test (PVT)

**Phase 5 — Feedback, Assessment & Corrective Action**
Inputs: Customer feedback, warranty data, production data
Outputs: Reduced variation, lessons learned, improved customer satisfaction

**Gate Reviews:** Each phase has a gate — customer approval required before moving to next phase.
**IATF Requirement:** APQP evidence required for all new product launches (Cl. 8.3).` },

  { keys:['gate review','apqp gate','phase gate','launch readiness','milestone review'],
    title:'APQP Gate Reviews & Launch Readiness',
    answer:`**APQP Gate Reviews — Keeping Launches on Track**

**Purpose:** Formal check at each APQP phase boundary to verify all deliverables are complete before proceeding.

**Gate 1 — End of Phase 1 (Planning Complete):**
✓ Customer requirements documented
✓ Quality targets defined (PPM target, Cpk target, reliability targets)
✓ Preliminary BOM issued
✓ Feasibility study signed off (can we make it?)
✓ Program timing plan agreed

**Gate 2 — End of Phase 2 (Design Complete):**
✓ DFMEA complete and reviewed
✓ DVP&R plan approved
✓ Design review minutes documented
✓ Prototype parts tested to DVP&R

**Gate 3 — End of Phase 3 (Process Design Complete):**
✓ PFMEA complete (no open High AP items)
✓ Process Flow Diagram complete
✓ Control Plan (pre-launch) issued
✓ MSA plan approved
✓ Floor plan finalised, tooling ordered

**Gate 4 — End of Phase 4 (Validation Complete):**
✓ Production trial run completed (300 pieces minimum)
✓ All MSA/GRR studies ≤ 30%
✓ Cpk ≥ 1.67 for all SC
✓ PPAP submitted and approved
✓ Operator training complete

**Launch Readiness Review (LRR):** Final gate before SOP. Customer may attend.
**IATF:** Gate review records are objective evidence for Cl. 8.3.4 (Design reviews).` },

  // -- CUSTOMER QUALITY ----------------------------------------------------------
  { keys:['customer ppm','ppm formula','ppm calculation','parts per million','defect ppm'],
    title:'Customer PPM — Formula & Calculation',
    answer:`**Customer PPM — Parts Per Million Defective**

**Formula:**
\`Customer PPM = (Number of Defective Parts Delivered) ÷ (Total Parts Delivered) × 1,000,000\`

**Example:**
Parts shipped this month: 150,000
Customer complaints received: 3 parts defective
PPM = (3 ÷ 150,000) × 1,000,000 = **20 PPM**

**Typical OEM Targets (Automotive India):**
- Tier 1 OEM requirement: ≤ 25–50 PPM
- Premium OEM (Toyota, Honda): ≤ 10 PPM
- World class target: ≤ 5 PPM

**Monthly PPM Tracking:**
- Track per customer, per part number
- Rolling 12-month PPM for trend visibility
- Separate: Field returns vs line rejects (some OEMs count differently)

**PPM Trap — Zero Defect Shipments:**
Some customers count ZERO defects against you if PPM > threshold even one month.

**Weighted PPM (Multi-part):**
\`Weighted PPM = Σ(Defects per part × 1,000,000) ÷ Σ(Shipments per part)\`

**IATF Cl. 9.1.2:** Customer PPM is a mandatory customer satisfaction metric for management review.` },

  { keys:['warranty','r/1000','warranty formula','field return','warranty kpi','r per 1000'],
    title:'Warranty R/1000 — Formula & Analysis',
    answer:`**Warranty R/1000 — Returns per 1000 Vehicles/Units**

**Formula:**
\`R/1000 = (Number of warranty returns) ÷ (Units in service) × 1,000\`

**Example:**
Warranty claims this quarter: 45
Units sold/in-service this quarter: 8,000
R/1000 = (45 ÷ 8,000) × 1,000 = **5.6 R/1000**

**Industry Benchmarks (Automotive):**
- World class: < 3 R/1000
- Good: 3–8 R/1000
- Needs improvement: 8–15 R/1000
- Crisis level: > 15 R/1000

**Warranty Analysis Steps (IATF Cl. 8.8.1):**
1. Receive and log warranty return with customer claim data
2. Is Not Defective (IND) check — verify if actually faulty
3. Teardown analysis (identify failure mode)
4. Warranty 8D — Root cause + corrective action
5. Field containment if systemic issue detected
6. Potential recall threshold check (IATF Cl. 8.9)

**Warranty Escalation Triggers:**
- Same failure mode from multiple vehicles → systemic issue
- Safety-related failure → mandatory customer notification within 24 hours
- R/1000 exceeding customer threshold → warranty review meeting

**Record:** Warranty data must be retained per customer requirement (typically 10–15 years for safety parts).` },

  { keys:['customer complaint','complaint escalation','customer complaint process','8d to customer','customer concern'],
    title:'Customer Complaint Escalation Process',
    answer:`**Customer Complaint Process — End to End**

**Step 1 — Immediate Response (within 24 hours):**
- Acknowledge receipt of complaint
- Confirm containment in place (sorting, hold, 100% check)
- Assign 8D team leader
- Dispatch SCAR / 8D reference number to customer

**Step 2 — Containment (D0–D3, within 48–72 hours):**
- Sort and quarantine all suspect stock (in-house + in-transit + at customer)
- 100% inspection at customer line (if customer requests)
- Block shipment of un-sorted stock
- Send interim containment report to customer

**Step 3 — Root Cause Analysis (D4, within 7–14 days):**
- 5-Why + Fishbone for both occurrence and escape root cause
- Verify root cause (turn defect on/off)
- Customer must approve root cause before D5 implementation

**Step 4 — Corrective Action (D5–D6, within 30 days):**
- Implement permanent corrective action
- Update FMEA, Control Plan, Work Instructions
- Run validation lots → send samples to customer for approval

**Step 5 — Prevention & Closure (D7–D8):**
- Check all similar parts/processes for same risk
- Lesson learned documented
- Customer sign-off on 8D closure

**Escalation Levels:**
- Level 1: Standard 8D response
- Level 2: Quality engineer visits customer plant
- Level 3 (repeat issue): Quality Director + Plant Head meeting with OEM
- Level 4 (safety/recall): Immediate executive escalation, potential GPSC` },

  // -- LEAN TOOLS ----------------------------------------------------------------
  { keys:['7 waste','eight waste','timwood','lean waste','muda','identify waste'],
    title:'7 Wastes of Lean Manufacturing (TIMWOOD)',
    answer:`**7 Wastes (Muda) — Lean Manufacturing**

**T — Transportation**
Moving materials unnecessarily between locations.
Example: Parts moved from press shop → store → assembly (should go direct).
Fix: U-shaped cells, direct flow, kanban supermarkets.

**I — Inventory**
Excess raw material, WIP, or finished goods beyond customer demand.
Example: 3-month stock of components when customer pulls weekly.
Fix: Pull system, kanban, JIT delivery.

**M — Motion**
Unnecessary movement of people or equipment.
Example: Operator walks 10 steps to pick tool from distant trolley.
Fix: Shadow boards, 5S workstation organisation.

**W — Waiting**
People or machines idle, waiting for materials, approvals, repairs.
Example: Machine waiting for material; operator waiting for quality inspector.
Fix: TPM, level loading, cross-training.

**O — Overproduction (WORST WASTE)**
Making more than customer needs, earlier than needed, or faster than needed.
Example: Running 1,000 pieces when order is 200.
Fix: Flow production, takt time discipline.

**O — Over-processing**
Doing more work than required by customer.
Example: Painting a surface the customer never sees.
Fix: Review customer specs; eliminate non-value-added steps.

**D — Defects**
Producing nonconforming product — rework, scrap, sorting.
Fix: Poka-yoke, SPC, mistake-proofing.

**+1 (8th Waste — Lean Six Sigma):** Non-utilised talent / skills.` },

  { keys:['poka yoke','mistake proof','error proof','poka-yoke type','zero defect'],
    title:'Poka-Yoke — Types & Examples',
    answer:`**Poka-Yoke (Mistake-Proofing) — Toyota Production System**

**Definition:** A device or mechanism that prevents a mistake from occurring OR makes a mistake immediately obvious.

**3 Types of Poka-Yoke:**

**1. Prevention Type (Strongest)**
Physically impossible to make the error.
Examples:
- Asymmetric connector — can only plug in one way
- Wrong-size part cannot fit the fixture (go/no-go fixture)
- Interlock — machine won't start unless part correctly loaded

**2. Detection Type (Good)**
Detects the error immediately and stops the process.
Examples:
- Weight check — buzzer if assembled part weight is out of range
- Vision system — camera verifies all labels applied before passing
- Part-in-place sensor — won't release until part detected

**3. Warning Type (Weakest)**
Alerts the operator but doesn't stop the process.
Examples:
- Light stack turns red if limit switch not triggered
- Counter alarm if operator misses a fastener

**Poka-Yoke Hierarchy (IATF preference):**
Prevention > Detection > Warning

**IATF Cl. 8.3.5.2 / 8.5.1.1:** Poka-yoke devices must be listed in Control Plan, verified at startup and at defined frequency.
**NC Risk:** Poka-yoke in Control Plan but verification records missing.` },

  { keys:['5s','5s methodology','sort set shine standardize sustain','5s workplace','seiri seiton'],
    title:'5S Workplace Organisation Methodology',
    answer:`**5S — Workplace Organisation (Japan → Automotive)**

**S1 — SORT (Seiri)**
Remove everything not needed for current work.
- Red-tag items of uncertain value
- Decision: Keep, dispose, relocate, or return to store
- Target: Only what is needed for today's production remains at station

**S2 — SET IN ORDER (Seiton)**
A place for everything; everything in its place.
- Shadow boards for tools (missing tools visible instantly)
- Floor markings for material, equipment, walkways
- Labels on bins, shelves, storage locations

**S3 — SHINE (Seiso)**
Clean AND inspect — cleaning reveals problems.
- Daily cleaning schedule (who, what, when)
- Machine cleaning surfaces → reveals leaks, cracks, wear
- "Clean to inspect" principle from TPM

**S4 — STANDARDISE (Seiketsu)**
Create standards so S1–S3 are maintained.
- Visual standards: "Before and After" photos posted
- 5S check schedules, audit checklists
- One-point lessons for 5S at each station

**S5 — SUSTAIN (Shitsuke)**
Make 5S a habit through discipline and management involvement.
- Weekly/monthly 5S audit with scoring
- Management gemba walks
- 5S score in departmental KPIs

**IATF Link:** 5S supports Cl. 7.1.4 (Work environment), Cl. 8.5.6 (Preservation of outputs).
**Audit Question:** "Show me your last 5S audit score and trend."` },

  { keys:['kaizen','continuous improvement','kaizen event','kaizen blitz','small improvement'],
    title:'Kaizen — Continuous Improvement Methodology',
    answer:`**Kaizen — Continuous Improvement (Toyota/Japan)**

**Definition:** "Kai" = Change | "Zen" = Good → Small, incremental improvements by everyone, every day.

**3 Levels of Kaizen:**
1. **Point Kaizen** — Quick fix by operator/supervisor (same day)
2. **System Kaizen** — Structured event (3–5 days), cross-functional team, one process
3. **Flow Kaizen** — Value stream redesign (weeks), management-led

**Kaizen Event (Blitz) — 5-Day Structure:**
- Day 1: Define scope, observe current state, map value stream
- Day 2: Analyse waste, identify improvements, brainstorm solutions
- Day 3: Implement changes on the floor
- Day 4: Test, measure results, refine
- Day 5: Document, train, present results, create 30-day follow-up plan

**Key Kaizen Rules:**
- Never say "it can't be done" — start with "how can we?"
- Ideas from people who do the work (not just engineers)
- Small improvements daily beat large projects rarely
- Measure before and after (don't guess)
- Sustain: Standard Work updated immediately

**Kaizen vs Kaikaku:**
- Kaizen = incremental (10–20% improvement)
- Kaikaku = radical redesign (50%+ improvement, e.g., layout change)

**IATF Cl. 10.3:** Continual improvement is a requirement — Kaizen is the primary tool.` },

  // -- IATF CLAUSES -------------------------------------------------------------
  { keys:['risk based thinking','risk opportunity','iatf 6.1','risk management iatf'],
    title:'Risk-Based Thinking — IATF 16949 Cl. 6.1',
    answer:`**Risk-Based Thinking — IATF 16949 Cl. 6.1**

**What It Means:** Proactively identify, assess, and address risks that could prevent the QMS from achieving its intended results — BEFORE problems occur.

**IATF 6.1.1 — Actions to Address Risks & Opportunities:**
- Identify risks related to: product quality, customer satisfaction, regulatory compliance, business continuity
- Assess: Severity × Likelihood = Risk Level
- Plan: Actions to mitigate risks or capture opportunities
- Review: Effectiveness of risk mitigation actions

**IATF 6.1.2 — Additional Automotive Requirements:**

**6.1.2.1 — Risk Analysis:**
- Use FMEA for product and process risk
- Assessment of potential supplier quality problems
- Lessons learned from similar products/processes

**6.1.2.2 — Preventive Action:**
- Systematic use of risk tools to prevent problems

**6.1.2.3 — Contingency Plans:**
- What if key equipment fails? Key supplier fails? Utility loss?
- Must have documented plans for: utility interruption, key machine breakdown, supplier disruption, labour shortage
- Customer must be notified if contingency plan is activated

**Risk Register (Best Practice):**
- List all identified risks: source, severity, likelihood, risk level, owner, mitigation, status
- Review quarterly in Management Review

**Common NC:** Risk register exists but not updated; or risks listed but no mitigation actions assigned.` },

  { keys:['special characteristic','critical characteristic','cc sc','significant characteristic','key characteristic'],
    title:'Special Characteristics — CC, SC, and Symbols',
    answer:`**Special Characteristics (SC/CC) — IATF 16949**

**Definition:** Product or process characteristics for which variation could significantly affect product safety, regulatory compliance, fit/function, or customer satisfaction.

**Types of Special Characteristics:**

**Safety/Critical Characteristics (CC — Diamond ◆):**
- Could cause safety hazard or non-compliance with regulation
- Examples: Brake system torque, seatbelt anchor strength, fuel system leak-tightness
- IATF requirement: Cpk ≥ 1.67, 100% traceability, documented risk acceptance
- Must appear on: Drawing, DFMEA, PFMEA, Control Plan, Work Instruction

**Significant Characteristics (SC — Inverted Triangle ▼):**
- Affects fit, function, or performance but not safety
- Examples: Critical dimension for assembly, surface finish for sealing
- Target: Cpk ≥ 1.67 (initial study), ≥ 1.33 ongoing
- Monitored by SPC on Control Plan

**Customer-Specific Symbols:**
- Ford: Inverted solid triangle (SC) | Star/diamond (CC)
- GM: Specific S or W symbols per BIQS
- Toyota: Circle with cross (Critical)

**IATF Audit Questions:**
- "Show me how SC are identified on the drawing."
- "Show me your SPC chart for this SC characteristic."
- "What is your Cpk for this SC? Is it above 1.67?"

**Common NC:** SC on drawing but NOT called out in PFMEA or Control Plan.` },

  { keys:['contingency plan','business continuity','backup plan','iatf 6.1.2.3','utility failure','equipment failure backup'],
    title:'Contingency Planning — IATF 16949 Cl. 6.1.2.3',
    answer:`**Contingency Planning — IATF 16949 Cl. 6.1.2.3**

**Requirement:** Document and test contingency plans to protect the customer from supply disruption due to any of the following:

**Mandatory Scenarios to Plan For:**
1. Key equipment failure (critical machine breakdown)
2. Utility interruption (power, compressed air, water, gas)
3. Key supplier failure / shortage
4. Field returns / potential recall situations
5. Labour shortage (strike, illness, key person departure)
6. Natural disaster / weather disruption
7. IT system failure (ERP/MES down)
8. Tooling damage or loss

**Contingency Plan Must Include:**
- Risk: What is the scenario?
- Probability and impact rating
- Primary response: What action is taken immediately?
- Backup source: Alternate equipment, supplier, or process
- Customer notification: Who contacts customer and when?
- Recovery timeline
- Owner and approval

**Customer Notification Requirement:**
"In the event of disruption, customer must be notified — timing per customer-specific requirement (usually within 24 hours)."

**Review Frequency:** At least annually; tested via simulation or tabletop exercise.

**Common NC:** Contingency plans listed on paper but never reviewed or tested; backup supplier not PPAP-approved.` },

  { keys:['iatf 8.4','externally provided','supplier control','approved supplier','cl 8.4 requirement'],
    title:'IATF Cl. 8.4 — Control of Externally Provided Processes',
    answer:`**IATF 16949 Cl. 8.4 — Supplier Management**

**Cl. 8.4.1 — General (Supplier Selection & Approval):**
- Maintain an Approved Supplier List (ASL)
- Define criteria for supplier selection and approval
- Criteria: IATF/ISO certification, quality history, PPAP capability, financial stability
- New supplier: Audit + PPAP required before production use
- Annual re-evaluation using supplier scorecard

**Cl. 8.4.2 — Type and Extent of Control:**
- Control based on: Risk level + criticality + supplier performance history
- High-risk suppliers: Increased receiving inspection, more frequent audits
- Pass-through characteristics: Identify items where supplier test results are used directly

**Cl. 8.4.3 — Information for Suppliers:**
- Flow down customer-specific requirements (CSR) to sub-suppliers
- Flow down applicable statutory/regulatory requirements
- Communicate: Quality requirements, PPAP requirements, special characteristics
- 4M change notification requirement must be communicated

**Supplier Development (Cl. 8.4.1 note):**
- Develop supplier capability using APQP/AIAG tools
- Development plan for underperforming suppliers

**IATF Specific Additions:**
- Cl. 8.4.1.2: Supplier monitoring with KPIs
- Cl. 8.4.2.3: Customer-directed sources (resale parts — supplier chosen by OEM)

**Common NC:** ASL not updated annually; sub-tier suppliers not PPAP-approved; CSR not flowed down.` },

  { keys:['layout inspection','iatf 8.6.1','annual layout','dimensional layout'],
    title:'Layout Inspection — IATF 16949 Cl. 8.6.1',
    answer:`**Layout Inspection — IATF 16949 Cl. 8.6.1**

**What is a Layout Inspection?**
A 100% dimensional check of ALL characteristics on the engineering drawing — measured against the current revision of the drawing.
Also called: Full dimensional layout, annual dimensional verification.

**IATF Requirement:**
- Frequency: At least once per year (annual) for all active production part numbers
- Scope: ALL dimensions on drawing — not just special characteristics
- Documentation: Bubble drawing + dimensional report comparing actual vs nominal+tolerance

**Triggers for Additional Layout (Not Just Annual):**
- Design change (new drawing revision)
- Tooling replacement or repair
- Process relocation
- Customer request
- After PPAP — part of PPAP element #9

**Layout Report Must Contain:**
- Part number, revision, date of inspection
- Balloon-numbered drawing (each dimension numbered)
- Specification (nominal + tolerance) for each dimension
- Actual measured value
- Pass/Fail status for each dimension
- Gauge/equipment used with calibration ID
- Signed by QE and approved by Quality Manager

**Common NC (Frequently cited by IATF auditors):**
- No layout inspection done in last 12 months
- Layout exists but on old drawing revision
- Only SC dimensions checked — not all dimensions` },

  { keys:['fishbone','ishikawa','cause effect','6m fishbone','6m categories'],
    title:'Fishbone Diagram — 6M Categories',
    answer:`**Fishbone (Ishikawa) Cause & Effect Diagram**

**6M Categories (Manufacturing):**

**Man (People):**
- Operator skill, training, experience
- Fatigue, attention, attitude
- Method of working (correct technique?)
- Examples: Untrained operator, two-shift difference

**Machine (Equipment):**
- Tool condition, wear, calibration
- Machine settings, maintenance status
- Jig/fixture condition and accuracy
- Examples: Tool wear, spindle runout, wrong cam setting

**Material:**
- Raw material properties, composition, hardness
- Incoming variation, lot-to-lot variation
- Storage and handling damage
- Examples: Different steel lot, hardness out of range

**Method (Process):**
- SOPs not followed or not clear
- Process parameters (speed, pressure, temperature)
- Sequence of operations
- Examples: Wrong torque sequence, missing process step

**Measurement (Gauge):**
- Gauge accuracy, GRR, calibration
- Measurement technique, operator variation
- Sampling plan adequacy
- Examples: Biased gauge, wrong measurement point

**Mother Nature (Environment):**
- Temperature, humidity, vibration, dust
- Shift changes, seasonal variation
- Examples: Humidity affecting adhesive cure, temperature affecting dimension

**How to Use:**
1. Write problem (effect) at fish head
2. Draw 6 bones — one per M
3. Brainstorm causes on each bone
4. Use 5-Why on each cause
5. Identify root cause with highest evidence` },

  { keys:['5 why','five why','5why','root cause why','5 why pitfall','5 why mistake'],
    title:'5-Why Analysis — Rules & Common Mistakes',
    answer:`**5-Why Root Cause Analysis — Best Practices**

**The Method:**
Ask "Why?" repeatedly until you reach the root cause — typically 5 levels deep (may be 3 or 7 depending on complexity).

**Example:**
Problem: Customer received scratched parts.
- Why 1: Parts scratched in transit packaging
- Why 2: Foam padding insufficient for part geometry
- Why 3: Packaging design not reviewed when part changed shape
- Why 4: No formal 4M change process for packaging updates
- Why 5: **Root Cause:** Packaging not included in 4M change scope — process gap

**Rules for Good 5-Why:**
✓ Each "Why" must directly cause the next level
✓ Verify each step — don't assume
✓ Go all the way to SYSTEMIC root cause (process/system failure, not "human error")
✓ Both occurrence root cause AND escape root cause
✓ Corrective action addresses the LAST Why — not Why 1 or 2

**Common 5-Why Mistakes:**
✗ Stopping at "operator error" — that is NEVER a root cause
✗ Jumping to solution before completing the chain
✗ Making up "whys" without verification
✗ Treating 5-Why as a form to fill rather than a conversation
✗ One 5-Why for both occurrence AND escape (use separate chains)

**Auditor Trap:** "Operator was not trained" is a symptom. Root cause = Why was training not identified as a requirement for this process?` },

  // -- SUPPLIER QUALITY ----------------------------------------------------------
  { keys:['scar','supplier corrective action','scar process','supplier 8d','supplier nc'],
    title:'SCAR — Supplier Corrective Action Request Process',
    answer:`**SCAR — Supplier Corrective Action Request**

**When to Raise a SCAR:**
- Incoming rejection above threshold (e.g., > 500 PPM in a lot)
- Repeat failure (same defect type > 2 occurrences in 3 months)
- Customer complaint traced to supplier-origin defect
- Supplier audit finding of major NC
- Warranty claim traced to supplier part

**SCAR Contents — What Supplier Must Provide:**

**Section A — Containment (D0–D3, within 24–48 hours):**
- Immediate containment action (sort, quarantine, 100% check at customer)
- Quantity affected and lot identification

**Section B — Root Cause (D4, within 7–14 days):**
- 5-Why + Fishbone
- Why Made + Why Shipped (two separate root causes)
- Supporting data/evidence

**Section C — Corrective Action (D5–D6, within 30 days):**
- Permanent corrective action with implementation date
- Updated FMEA, Control Plan, SOP as applicable
- Validation evidence (lot data, first-off results)

**Section D — Prevention (D7, within 30–45 days):**
- Horizontal deployment to similar parts/processes
- Lessons learned shared within supplier

**Supplier Debit Note:**
- Issued for: Sort cost, premium freight, customer line downtime, scrap cost
- Charged as % of total COPQ caused by supplier

**Escalation:** If SCAR not closed within timeline → Restricted Supplier status.` },

  { keys:['approved supplier list','asl','supplier approval','supplier qualification','vendor list'],
    title:'Approved Supplier List (ASL) Management',
    answer:`**Approved Supplier List (ASL) — IATF 16949 Cl. 8.4.1**

**Purpose:** Maintain a controlled list of suppliers approved to provide products/services for use in customer-supplied products.

**ASL Must Contain:**
- Supplier name and location
- Commodity / parts supplied
- Approval status (Approved / Conditional / Restricted / Debarred)
- Certification status (IATF 16949, ISO 9001, IATF cert expiry)
- Last audit date and score
- Scorecard rating (A/B/C)
- PPAP approval status

**New Supplier Qualification Process:**
1. Request + initial questionnaire
2. Desktop assessment (capability, certification, customer base)
3. On-site audit (using supplier audit checklist)
4. Sampling / PPAP trial
5. PPAP approval
6. Add to ASL as "Approved"

**Annual Re-evaluation:**
- Supplier scorecard updated quarterly
- Formal annual review: Re-audit or desk review based on risk
- Certification renewal tracked (IATF cert expires every 3 years)

**Status Definitions:**
- **Approved:** Full production use permitted
- **Conditional:** PPAP approved, under observation — increased IQC
- **Restricted:** Quality hold — no new orders; development plan in progress
- **Debarred:** Removed from ASL — no business

**Common NC:** ASL not updated in 12+ months; debarred supplier still receiving POs.` },

  { keys:['supplier development','supplier improvement','supplier development plan','supplier upgrade'],
    title:'Supplier Development Plan — Structure & Process',
    answer:`**Supplier Development Plan — IATF Best Practice**

**When to Initiate a Development Plan:**
- Supplier scorecard rating B or C
- Repeat SCARs (same failure mode)
- PPAP rejection or conditional approval
- Customer concern traced to supplier
- New supplier being onboarded for complex commodity

**Development Plan Structure:**

**Section 1 — Current State Assessment:**
- Current PPM, OTD, audit score, SCAR count
- Root cause of poor performance
- Gaps identified vs IATF/customer requirements

**Section 2 — Target State:**
- PPM target, OTD target, audit score target
- Timeline: 3 / 6 / 12 month milestones

**Section 3 — Action Plan:**
- Action | Owner (supplier) | Support (customer SQE) | Due date | Status
- Actions: Process improvement, training, gauge investment, FMEA update, SPC implementation

**Section 4 — Monitoring:**
- Monthly scorecard review
- Monthly progress meeting (SQE + supplier quality manager)
- Escalation path if milestones missed

**Section 5 — Exit Criteria:**
- What does "developed" look like? (PPM ≤ 500 for 3 months, audit ≥ 85%, zero repeat SCARs)

**Escalation if Plan Fails:**
- Restricted status → Dual-source qualification
- Debarment if no improvement after 6–12 months

**IATF Cl. 8.4.1:** Supplier development using APQP/AIAG tools is a requirement.` },

  // -- MORE IATF CLAUSES ---------------------------------------------------------
  { keys:['customer satisfaction','9.1.2','csat','customer satisfaction measurement','customer feedback'],
    title:'Customer Satisfaction — IATF 16949 Cl. 9.1.2',
    answer:`**Customer Satisfaction Measurement — IATF 16949 Cl. 9.1.2**

**Requirement:** Monitor customer perception of the degree to which their needs and expectations have been fulfilled.

**Mandatory Customer Satisfaction KPIs (IATF):**
1. Customer PPM (parts per million defective delivered)
2. Customer disruptions (line stoppage, downtime caused)
3. Field returns and warranty
4. Delivery performance (OTD %)
5. Customer notifications (premium freight, SCARs, containment events)
6. Customer scorecard ratings / portal scores

**Additional Satisfaction Inputs:**
- Customer satisfaction surveys / scorecards received from OEM portals
- Quality awards or recognitions (positive signal)
- Customer complaint frequency and severity trends
- Customer audit results and findings

**Where Data Comes From:**
- OEM supplier portals: Ford Supplier Portal, GM GQTS, Toyota SQAM, Maruti SPCS
- Customer scorecards (quarterly/annual)
- Warranty system data
- Customer complaints log

**Management Review Input (Cl. 9.3.2):**
Customer satisfaction data must be presented and discussed in every Management Review.

**IATF Target Setting:** Customer PPM target must be set and tracked monthly. Deteriorating trend requires documented corrective action plan.

**Common NC:** No customer satisfaction data presented in management review; or data presented but no action taken on declining trend.` },

  { keys:['internal audit programme','audit programme','iatf 9.2','audit schedule','internal audit plan'],
    title:'Internal Audit Programme — IATF 16949 Cl. 9.2',
    answer:`**Internal Audit Programme — IATF 16949 Cl. 9.2**

**3 Types of Audits Required (IATF):**
1. **Quality Management System (QMS) Audit** — covers all ISO/IATF clauses
2. **Manufacturing Process Audit** — VDA 6.3 or IATF process approach
3. **Product Audit** — checks finished product vs spec (IATF 8.6)

**Audit Programme Requirements:**
✓ Annual audit schedule covering all processes, shifts, and locations
✓ Risk-based frequency: Higher risk = more frequent audits
✓ All QMS clauses covered at least once per certification cycle
✓ Auditors must be qualified and not audit their own work area

**IATF Specific Requirements:**
- All manufacturing processes audited at least once per year
- Customer complaints and warranty data must INCREASE audit frequency of affected process
- Audit scope must include customer-specific requirements

**Internal Auditor Competency:**
- Understand the processes being audited
- Trained in IATF/ISO 9001 requirements
- Trained in auditing techniques (ISO 19011)
- No conflict of interest (independence)

**Audit Finding Classification:**
- **Major NC:** Absence of a required process or systemic breakdown
- **Minor NC:** Isolated lapse — process exists but not always followed
- **Observation:** Not a NC yet, but risk of becoming one

**Common NC:** Audit schedule exists but certain shifts / departments never audited; findings raised but CAPA not linked.` },

  { keys:['customer specific requirement','csr','customer requirement','ford csr','gm csr','toyota csr'],
    title:'Customer Specific Requirements (CSR)',
    answer:`**Customer Specific Requirements (CSR) — IATF 16949**

**What Are CSRs?**
Requirements defined by individual OEM customers that supplement and/or clarify IATF 16949 requirements. They are mandatory for suppliers serving that OEM.

**IATF Requirement:** All applicable CSRs must be identified, documented, and implemented. IATF auditors WILL check CSR compliance.

**Major OEM CSRs (India/Global):**

**Tata Motors:** TATA QMS Supplier Requirements — PPAP Level 3, IATF mandatory, specific SPC frequency
**Maruti Suzuki:** MSIL Supplier Quality Manual — SQM requirements, QAV audit format
**Mahindra:** M-QIRS requirements — specific audit checklists and PPAP formats
**Toyota:** Toyota Supplier Quality Manual — 4M change control, dojo training requirements, IATF mandatory
**Ford:** Customer-Specific Requirements for IATF 16949 — Q1 certification, PPAP levels, Run@Rate requirements
**GM:** CSR includes BIQS (Supplier Quality Excellence Program) — score ≥ 7 required for preferred status
**Bosch:** Bosch supplier standard — Q-Capsule requirements, RBEM audit

**CSR Management Process:**
1. Identify all applicable CSRs for each customer
2. Gap analysis: current system vs CSR requirements
3. Implementation actions with timeline
4. Annual review: OEMs update CSRs regularly
5. Flow-down to sub-tier suppliers where required

**Common NC:** CSR not documented; old version of CSR in use; CSR not flowed to sub-suppliers.` },

  { keys:['is is not','is/is not analysis','problem definition','what is is not'],
    title:'Is / Is Not Analysis — Problem Definition Tool',
    answer:`**Is / Is Not Analysis — Sharpening Problem Definition**

**Purpose:** Precisely define the boundaries of a problem to avoid chasing wrong causes. Answers: "Where is the problem? Where is it NOT?"

**The 6 Dimensions:**

| Dimension | IS (Problem EXISTS here) | IS NOT (Problem does NOT exist here) |
|-----------|--------------------------|--------------------------------------|
| What | What defect/symptom? | What similar defect does NOT occur? |
| Where | Which machine/line/plant? | Which machine/line/plant is fine? |
| When | When first seen? What shift? | When does it NOT occur? |
| Who | Which operator/shift/team? | Who never has this problem? |
| How many | Defect rate, PPM, qty? | What quantity is defect-free? |
| How | How is defect manifested? | How does good part look? |

**Example — Scratch on Part:**
- IS: Only Line 2, Press #4, Night shift, since March, ~2000 PPM
- IS NOT: Line 1, Line 3, Day shift, before March

**What the IS / IS NOT Tells You:**
The difference between IS and IS NOT columns points you directly to the root cause.
- Line 2 only → Something unique to Line 2 (different tool? different operator? different material batch?)
- Night shift only → Environment, operator fatigue, temperature change?

**When to Use:** As the FIRST step in 8D (D2 — Problem Description) before jumping to 5-Why.
**Tip:** The more precise the Is/Is Not, the faster the root cause is found.` },

  { keys:['smed','changeover','setup reduction','quick changeover','single minute exchange die'],
    title:'SMED — Single Minute Exchange of Die (Changeover Reduction)',
    answer:`**SMED — Single Minute Exchange of Die**

**Goal:** Reduce changeover/setup time to single-digit minutes (< 10 minutes).
**Origin:** Shigeo Shingo, Toyota Production System.

**Why It Matters:**
- Long changeover → large batch sizes → high inventory → slow response to demand changes
- Short changeover → small batches → low inventory → flexible production → less waste

**SMED 3-Step Methodology:**

**Step 1 — Separate Internal vs External Activities:**
- Internal: Activities ONLY done when machine is stopped (e.g., remove old die)
- External: Activities done WHILE machine runs (e.g., prepare next die, clean, fetch tools)
- Film the current changeover to identify every activity and time it

**Step 2 — Convert Internal to External:**
- Pre-stage next die, pre-heat tooling, pre-fill material outside machine
- Use quick-release clamps instead of bolts
- Pre-set dimensions on external setup table

**Step 3 — Streamline All Activities:**
- Standardise tool heights, clamping points (one-turn clamps)
- Shadow boards at machine — everything within arm's reach
- Written standard work for changeover sequence
- 5S changeover cart with all required items

**Typical SMED Results:**
- Before: 2–4 hour changeover
- After SMED: 15–30 minute changeover
- World class: < 10 minutes

**IATF Link:** SMED reduces lot sizes → reduces risk of large-scale quality issues going undetected.` },

];


// -- Fuzzy match ----------------------------------------------------------------
function findAnswer(q: string): { title: string; answer: string } | null {
  const lower = q.toLowerCase();
  for (const kb of KB) {
    if (kb.keys.some(k => lower.includes(k))) return { title: kb.title, answer: kb.answer };
  }
  return null;
}

function formatAnswer(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} className="font-bold text-[#1e3a5f] mt-2 mb-0.5">{line.replace(/\*\*/g,'')}</div>;
    }
    if (line.match(/^\*\*(.+?)\*\*/)) {
      return <div key={i} className="text-xs leading-relaxed"
        dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.+?)\*\*/g,'<strong class="text-[#1e3a5f]">$1</strong>')}} />;
    }
    if (line.startsWith('✓') || line.startsWith('✗')) {
      return <div key={i} className="text-xs leading-relaxed text-emerald-700">{line}</div>;
    }
    if (line.match(/^\d+\./)) {
      return <div key={i} className="text-xs leading-relaxed ml-2">{line}</div>;
    }
    if (line.startsWith('-') || line.startsWith('•')) {
      return <div key={i} className="text-xs leading-relaxed ml-2 text-gray-200">{line}</div>;
    }
    if (line.startsWith('|')) {
      return <div key={i} className="text-xs font-mono text-teal-300 leading-tight">{line}</div>;
    }
    if (line.startsWith('`') && line.endsWith('`')) {
      return <div key={i} className="text-xs font-mono bg-gray-700 rounded px-1 my-0.5 text-yellow-300">{line.slice(1,-1)}</div>;
    }
    return line ? <div key={i} className="text-xs leading-relaxed">{line}</div> : <div key={i} className="h-1" />;
  });
}

// -- Component ------------------------------------------------------------------
export default function QualityCopilot({ page }: { page: QualityPage }) {
  const meta = PAGE_META[page] ?? PAGE_META['audit'];
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id:'0', role:'assistant', ts:'', text:`👋 Hi! I'm your **${meta.label} Copilot**.

I can answer IATF 16949 requirements, quality techniques, audit questions, and best practices for this area.

Try one of the quick questions below, or type your own!` }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const uid = () => Math.random().toString(36).slice(2,8);

  const send = (q: string) => {
    if (!q.trim()) return;
    const userMsg: Msg = { id: uid(), role:'user', text: q.trim(), ts: new Date().toLocaleTimeString() };
    setMsgs(m => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const found = findAnswer(q);
      let reply: string;
      if (found) {
        reply = `**${found.title}**\n\n${found.answer}`;
      } else {
        reply = `I don't have a specific answer for "${q}" in my knowledge base yet.

**Try asking about:**
${meta.chips.map(c => `- ${c}`).join('\n')}

Or ask about: IATF clauses, OEE, AQL, CAPA, 8D, calibration, COQ, document control, supplier scorecard, management review, or training requirements.`;
      }
      setMsgs(m => [...m, { id: uid(), role:'assistant', text: reply, ts: new Date().toLocaleTimeString() }]);
      setTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-bold shadow-2xl hover:brightness-110 transition-all"
          style={{background: meta.color, boxShadow:'0 4px 24px rgba(0,0,0,0.4)'}}>
          <span className="text-lg">{meta.icon}</span>
          <span className="hidden md:inline">AI Copilot</span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[360px] md:w-[420px] h-[580px] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          style={{background:'#0f172a'}}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{background: meta.color}}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.icon}</span>
              <div>
                <div className="text-sm font-bold text-white">{meta.label} Copilot</div>
                <div className="text-xs text-white/70">IATF 16949 · Quality Expert</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs space-y-0.5 ${
                  m.role==='user'
                    ? 'text-white rounded-br-sm'
                    : 'text-[#1e3a5f] bg-white rounded-bl-sm'
                }`} style={m.role==='user'?{background:meta.color}:{}}>
                  {m.role==='assistant' ? formatAnswer(m.text) : <div>{m.text}</div>}
                  {m.ts && <div className="text-[#1e3a5f] text-xs mt-1">{m.ts}</div>}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-[#1e3a5f]">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Chips */}
          <div className="px-3 py-2 flex gap-1.5 flex-wrap shrink-0 border-t border-white/5">
            {meta.chips.map(chip => (
              <button key={chip} onClick={() => send(chip)}
                className="text-xs px-2 py-1 rounded-full bg-white text-[#1e3a5f] hover:text-[#1e3a5f] hover:bg-[#dbeafe] border border-[#dbeafe] transition-colors whitespace-nowrap">
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 shrink-0 border-t border-white/10">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send(input)}
              placeholder="Ask about IATF, quality tools, best practices…"
              className="flex-1 bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-xs text-[#1e3a5f] focus:outline-none focus:border-blue-400" />
            <button onClick={() => send(input)}
              className="px-3 py-2 rounded-xl text-white text-xs font-bold transition-all hover:brightness-110"
              style={{background:meta.color}}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
