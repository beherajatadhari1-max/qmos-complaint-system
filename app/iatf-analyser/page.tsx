'use client';
import { useState, useMemo, useEffect } from 'react';

// -----------------------------------------------------------------------------
// DATA — from IATF_Audit_Tracking_May2026_Final.xlsx (TM Automotive Seating)
// 128 clauses: ISO 9001:2015 base + IATF 16949:2016 supplemental
// -----------------------------------------------------------------------------
type DocStatus = 'available' | 'partial' | 'missing' | 'na';
type Standard = 'ISO' | 'IATF';
type ClauseGroup = 'Context' | 'Leadership' | 'Planning' | 'Support' | 'Operations' | 'Performance' | 'Improvement';

interface ClauseDef {
  id: string;
  clause: string;
  title: string;
  standard: Standard;
  group: ClauseGroup;
  meaning: string;
  procedures: string[];
  docs: string[];
  processOwner: string;
}

const CLAUSES: ClauseDef[] = [
  { id:'cl4_1', clause:'4.1', title:'Understanding the Organization and its Context', standard:'ISO', group:'Context',
    meaning:'Identify all internal and external factors (business environment, risks, opportunities) that affect your QMS. Know your strengths, weaknesses, threats and opportunities.',
    procedures:["Context Analysis Procedure", "Risk Management Procedure", "SWOT/PESTLE Analysis SOP"],
    docs:["SWOT Analysis report (signed by Top Mgmt)", "PESTLE Analysis", "Internal issues list (people, culture, resources, process, technology)", "External issues list (market, competition, regulations, OEM changes, economy)", "Risk & Opportunity Register", "Context review minutes (annual minimum)", "Link to QMS scope document"],
    processOwner:'Top Management, MR (Management Rep), QA, All HODs' },
  { id:'cl4_2', clause:'4.2', title:'Understanding Needs & Expectations of Interested Parties', standard:'ISO', group:'Context',
    meaning:'Identify who is affected by your business (customers, suppliers, employees, regulators) and what they expect from you. Make sure their needs are addressed in your QMS.',
    procedures:["Interested Parties Management Procedure", "Stakeholder Analysis SOP"],
    docs:["Interested Parties Register (customers, suppliers, employees, regulators, community)", "Needs & Expectations Matrix per interested party", "Review evidence (annual)", "Link to risk register and QMS scope", "Customer portal requirements (TML SRM, TMBSL)"],
    processOwner:'Top Management, MR, QA, Purchase, HR, All HODs' },
  { id:'cl4_3', clause:'4.3', title:'Determining the Scope of the QMS', standard:'ISO', group:'Context',
    meaning:'Define clearly what your QMS covers — which products, processes, sites, and customers are included. Document any exclusions and justify them.',
    procedures:["QMS Scope Definition Procedure"],
    docs:["Documented QMS Scope Statement (products, sites, exclusions with justification)", "IATF Certification scope match", "Supporting functions listed (on-site and remote)", "Customer list covered", "Scope communicated to all employees"],
    processOwner:'Top Management, MR, QA' },
  { id:'cl4_3_1', clause:'4.3.1', title:'Scope — Supplemental (IATF)', standard:'IATF', group:'Context',
    meaning:'AUTOMOTIVE: Scope must include all supporting functions (remote or on-site). If design responsibility is excluded, this must be clearly justified. All sites and outsourced processes must be addressed.',
    procedures:["QMS Scope Procedure — Automotive Supplemental", "Outsourced Process Control Procedure"],
    docs:["Scope document listing all supporting functions (central QA, IT, logistics)", "Design exclusion justification (if applicable)", "Outsourced process controls identified", "Multi-site scope (if applicable)", "IATF certificate scope vs. actual scope match"],
    processOwner:'Top Management, MR, QA, All Functions' },
  { id:'cl4_3_2', clause:'4.3.2', title:'Customer-Specific Requirements (CSR)', standard:'IATF', group:'Context',
    meaning:'AUTOMOTIVE: All customer-specific quality requirements (from TML, TMBSL, Ashok Leyland) must be identified, reviewed, and integrated into your QMS — not just kept in a file.',
    procedures:["CSR Management Procedure", "Customer Requirement Review Procedure"],
    docs:["CSR Register listing all customer requirements (TML TQMS, TMBSL, AL SQS)", "CSR compliance matrix (requirement vs. QMS provision)", "CSR revision tracking (latest version confirmed)", "Flow-down evidence to suppliers", "Link to Control Plans, FMEA, Work Instructions", "Customer portal acknowledgement records"],
    processOwner:'QA (Lead), MR, Design/Engineering, Production, Purchase' },
  { id:'cl4_4', clause:'4.4', title:'QMS and its Processes', standard:'ISO', group:'Context',
    meaning:'Define, document, and manage all your business processes. Know the inputs, outputs, owners, and how processes interact with each other.',
    procedures:["Process Interaction Matrix / Procedure", "Process Approach Procedure"],
    docs:["Process map / interaction matrix", "Turtle diagrams for each core process", "Process owners list", "Process inputs and outputs defined", "Process KPIs / monitoring parameters", "Outsourced process controls"],
    processOwner:'Top Management, MR, All Process Owners' },
  { id:'cl4_4_1_1', clause:'4.4.1.1', title:'Conformance of Products and Processes (IATF)', standard:'IATF', group:'Context',
    meaning:'AUTOMOTIVE: Ensure complete traceability from customer requirement → design → FMEA → Control Plan → Work Instruction → inspection record. No gaps allowed.',
    procedures:["Product & Process Conformance Procedure", "Traceability Procedure"],
    docs:["Traceability chain: customer spec → DFMEA/PFMEA → Control Plan → WI → inspection record", "Product conformance records vs. customer drawings", "Change control records when any document changes", "Process audit evidence of conformance"],
    processOwner:'QA, Design/Engineering, Production, ME' },
  { id:'cl4_4_1_2', clause:'4.4.1.2', title:'Product Safety (IATF)', standard:'IATF', group:'Context',
    meaning:'AUTOMOTIVE — CRITICAL: A documented process must exist for managing safety-related products. Safety characteristics must be identified, controlled, traceable, and customer-approved. This clause is a major NC risk area.',
    procedures:["Product Safety Management Procedure (MANDATORY)", "Special Characteristics Identification Procedure", "Escalation/Reporting Procedure for Safety Issues"],
    docs:["Product Safety procedure (documented, approved)", "Safety-related characteristics list (seatbelt anchorage, seat frame strength, recliner load, flammability per FMVSS 302)", "DFMEA/PFMEA with safety characteristics highlighted and special approval", "Control Plan — safety chars with 100% inspection or error-proofing", "Safety test reports (ECE R17 seat strength, AIS 023, IS 15061 flammability)", "Customer approval for safety deviations", "Traceability records for safety parts", "Lessons learned from past field failures", "Escalation records for safety issues", "No unauthorized concessions for safety characteristics"],
    processOwner:'Top Management, QA (Lead), Design/Engineering, Production, MR' },
  { id:'cl4_4_2', clause:'4.4.2', title:'Documented QMS Processes', standard:'ISO', group:'Context',
    meaning:'Maintain documented information to support process operation and to demonstrate that processes are carried out as planned.',
    procedures:["Document Control Procedure"],
    docs:["Quality Manual or equivalent", "Master list of all QMS documents", "Process documentation (procedures, WI, forms)", "Document control register", "All 68 mandatory IATF documents present and current"],
    processOwner:'MR, QA, All HODs' },
  { id:'cl5_1', clause:'5.1', title:'Leadership and Commitment', standard:'ISO', group:'Leadership',
    meaning:'Top management must actively lead and be accountable for the QMS — not just delegate it. They must ensure customer focus, resources, and quality objectives are in place.',
    procedures:["Leadership Commitment Procedure", "Management Review Procedure"],
    docs:["Signed Quality Policy by Plant Head", "MRM minutes showing top management active participation", "Business plan linked to quality objectives", "Evidence of top management quality walkthroughs / Gemba walks", "Communication records (town halls, notice boards)", "Resource allocation approvals for QMS activities"],
    processOwner:'Top Management, Plant Head, MR' },
  { id:'cl5_1_1_1', clause:'5.1.1.1', title:'Corporate Responsibility (IATF)', standard:'IATF', group:'Leadership',
    meaning:'AUTOMOTIVE: The organization must have an ethics/corporate responsibility policy addressing anti-bribery, whistleblower protection, and responsible business conduct.',
    procedures:["Corporate Responsibility / Ethics Policy", "Anti-Bribery Procedure", "Escalation/Whistleblower Procedure"],
    docs:["Code of Ethics document (approved, dated)", "Anti-bribery policy", "Whistleblower / escalation process", "Employee awareness records of ethics policy", "Investigation records (if any)", "Communication evidence to all levels"],
    processOwner:'Top Management, HR, MR, All Employees' },
  { id:'cl5_1_1_2', clause:'5.1.1.2', title:'Process Effectiveness and Efficiency (IATF)', standard:'IATF', group:'Leadership',
    meaning:'AUTOMOTIVE: Top management must review process-level performance metrics (OEE, scrap rate, Cpk, cycle time efficiency) — not just final product quality data.',
    procedures:["Process Performance Monitoring Procedure", "Management Review Procedure"],
    docs:["MRM agenda including process KPI review", "OEE trend charts per machine", "Scrap / rework rate trends", "Cpk trend charts for key processes", "Action items from process review with owners and closure", "PP vs. Actual analysis"],
    processOwner:'Top Management, Production, QA, Maintenance, ME' },
  { id:'cl5_1_1_3', clause:'5.1.1.3', title:'Process Owners (IATF)', standard:'IATF', group:'Leadership',
    meaning:'AUTOMOTIVE: Every QMS process must have a named process owner with defined authority and responsibility. The organization chart must reflect this.',
    procedures:["Process Owner Assignment Procedure", "Organization Role & Responsibility Procedure"],
    docs:["Organization chart with process owners named", "Process owner list linked to process interaction matrix", "Job descriptions / authority matrix for each process owner", "Evidence of process owners reviewing performance data", "RACI matrix for key processes"],
    processOwner:'Top Management, MR, All HODs' },
  { id:'cl5_1_2', clause:'5.1.2', title:'Customer Focus', standard:'ISO', group:'Leadership',
    meaning:'Top management must ensure customer requirements are understood and consistently met, and customer satisfaction is enhanced.',
    procedures:["Customer Satisfaction Monitoring Procedure", "Customer Complaint Management Procedure"],
    docs:["Customer scorecard / portal data (TML SRM, TMBSL)", "CPPM trend chart", "Customer satisfaction survey results", "Customer complaint log with 8D closure status", "VOC (Voice of Customer) analysis", "Customer audit results"],
    processOwner:'Top Management, QA, Customer Service' },
  { id:'cl5_2_1', clause:'5.2.1', title:'Establishing the Quality Policy', standard:'ISO', group:'Leadership',
    meaning:'Top management must establish a Quality Policy that commits to meeting customer requirements and continual improvement. It must be relevant to the organization\'s context.',
    procedures:["Quality Policy Development Procedure"],
    docs:["Signed Quality Policy (current revision, dated)", "Policy includes commitment to: customer requirements, statutory/regulatory compliance, continual improvement", "Policy provides framework for quality objectives", "Policy review history", "Evidence it is appropriate to context"],
    processOwner:'Top Management, MR' },
  { id:'cl5_2_2', clause:'5.2.2', title:'Communicating the Quality Policy', standard:'ISO', group:'Leadership',
    meaning:'The Quality Policy must be understood by all employees and available to interested parties. Operators must be able to explain it in simple terms.',
    procedures:["Communication Plan / Procedure"],
    docs:["Policy displayed in production floor, offices, entrance", "Available in local language (Kannada/Hindi)", "Training records: all employees aware of policy", "New employee induction records (policy included)", "Periodic awareness records (toolbox talks, quality meetings)", "Auditor check: quiz 3 shop floor operators on policy"],
    processOwner:'HR, MR, All Employees' },
  { id:'cl5_3', clause:'5.3', title:'Organizational Roles, Responsibilities and Authorities', standard:'ISO', group:'Leadership',
    meaning:'Define who is responsible for what in the organization. Everyone must know their quality-related role and have the authority to carry it out.',
    procedures:["Organization Role & Responsibility Procedure", "Authority Matrix Procedure"],
    docs:["Current Organization Chart (approved, dated)", "Job descriptions for all key quality roles", "Authority matrix (who approves deviations, changes, concessions)", "Backup/deputy assignments for key roles", "Designated Management Representative (MR)"],
    processOwner:'Top Management, HR, MR, All HODs' },
  { id:'cl5_3_1', clause:'5.3.1', title:'Roles — Supplemental (IATF)', standard:'IATF', group:'Leadership',
    meaning:'AUTOMOTIVE: All personnel must know their specific quality responsibility. Customer requirement understanding must be assigned to specific roles.',
    procedures:["RACI Matrix Procedure", "Responsibility Assignment Procedure"],
    docs:["Personnel assignment documentation for customer requirement responsibilities", "Awareness evidence: each employee knows their quality role", "RACI matrix for key quality processes", "Interview evidence: do employees know their responsibilities?"],
    processOwner:'All Functions, HR, MR' },
  { id:'cl5_3_2', clause:'5.3.2', title:'Responsibility for Product Requirements & Corrective Actions', standard:'IATF', group:'Leadership',
    meaning:'AUTOMOTIVE: A specific person must be responsible for: communicating customer requirements, ensuring product conformance, and initiating corrective actions. This person must have authority to STOP production.',
    procedures:["Stop Production Authority Procedure", "Corrective Action Responsibility Procedure"],
    docs:["Named person with authority to stop production for quality reasons", "Delegation of authority document", "Stop-ship / stop-build decision records", "Evidence of CA initiation authority", "Communication of this authority to all shifts"],
    processOwner:'QA, Production, Top Management' },
  { id:'cl6_1_1', clause:'6.1.1', title:'Actions to Address Risks and Opportunities', standard:'ISO', group:'Planning',
    meaning:'Proactively identify risks that could prevent QMS from achieving its goals, and opportunities that could improve performance. Plan actions to address them.',
    procedures:["Risk Management Procedure", "Risk & Opportunity Register Procedure"],
    docs:["Risk and Opportunity Register (with ratings: likelihood × impact)", "Risk treatment action plans with owners and dates", "Opportunity action plans", "Risk register review at MRM", "Link between risks and quality objectives", "FMEA outputs feeding risk register"],
    processOwner:'Top Management, MR, QA, All HODs' },
  { id:'cl6_1_2_1', clause:'6.1.2.1', title:'Risk Analysis (IATF)', standard:'IATF', group:'Planning',
    meaning:'AUTOMOTIVE: Risk analysis must include at minimum: product recall risk, regulatory non-compliance risk, FMEA-identified risks, supplier risks, and warranty risks.',
    procedures:["Risk Analysis Procedure (IATF supplemental)", "FMEA Procedure"],
    docs:["Risk analysis record covering: product failure risks (FMEA), supplier risk, regulatory changes, recall risk, warranty risk", "FMEA high-AP (Action Priority) items in risk register", "Risk analysis review frequency documented", "Evidence of risk reduction actions implemented", "Customer notification risk procedure"],
    processOwner:'QA, Design/Engineering, Purchase, Top Management' },
  { id:'cl6_1_2_2', clause:'6.1.2.2', title:'Preventive Action (IATF)', standard:'IATF', group:'Planning',
    meaning:'AUTOMOTIVE: Preventive actions must be proactive — based on trend analysis and risk assessment — not just reactions to failures. They are separate from corrective actions.',
    procedures:["Preventive Action Procedure", "Trend Analysis Procedure"],
    docs:["Preventive Action log / register", "Differentiation of preventive vs. corrective actions", "Trend analysis as input to preventive actions", "Effectiveness verification of preventive actions", "Link to FMEA and risk register"],
    processOwner:'QA, Production, Maintenance, All HODs' },
  { id:'cl6_1_2_3', clause:'6.1.2.3', title:'Contingency Plans (IATF — SI-03, SI-17)', standard:'IATF', group:'Planning',
    meaning:'AUTOMOTIVE CRITICAL: Must have documented contingency plans for ALL disruptions: key equipment breakdown, supplier disruption, natural disaster, utility failure, IT/cyber-attack, pandemic, labour shortage. Plans must be tested annually and employees trained.',
    procedures:["Business Continuity / Contingency Plan Procedure (MANDATORY)", "Cyber Security Procedure (SI-03)", "Emergency Response Procedure"],
    docs:["Documented Contingency Plan covering: equipment breakdown, supplier disruption, natural disaster, utility failure, cyber-attack, pandemic, labour shortage (all 7 per SI-03)", "Annual review sign-off by Top Management", "Test/simulation drill records (tabletop exercise)", "Employee training records on contingency plan", "Customer communication procedure during disruption", "Backup supplier / alternate source list", "Restart verification after contingency", "Recovery timeline per event type"],
    processOwner:'Top Management, MR, QA, Production, IT, Purchase, Maintenance' },
  { id:'cl6_2_1', clause:'6.2.1', title:'Quality Objectives', standard:'ISO', group:'Planning',
    meaning:'Set measurable quality targets at relevant levels (plant, department, individual). Objectives must be SMART and linked to the Quality Policy.',
    procedures:["Quality Objectives Setting Procedure"],
    docs:["Quality Objectives document (SMART: Specific, Measurable, Achievable, Relevant, Time-bound)", "Objectives linked to Quality Policy", "Targets covering: CPPM, RPPM, SPPM, delivery, audit performance, customer satisfaction", "Objectives communicated to relevant functions", "Review at MRM"],
    processOwner:'QA, Top Management, All HODs' },
  { id:'cl6_2_2', clause:'6.2.2', title:'Planning to Achieve Quality Objectives', standard:'ISO', group:'Planning',
    meaning:'For each quality objective, have a clear action plan: what to do, who does it, by when, with what resources, and how progress is measured.',
    procedures:["Quality Objectives Action Plan Procedure"],
    docs:["Action plan for each objective (what, who, when, resources, measurement)", "Progress review records at MRM", "Resource allocation evidence for objectives", "Off-track objective escalation records", "Departmental objective cascade"],
    processOwner:'QA, All HODs, Top Management' },
  { id:'cl6_2_2_1', clause:'6.2.2.1', title:'Quality Objectives — Supplemental (IATF)', standard:'IATF', group:'Planning',
    meaning:'AUTOMOTIVE: Quality objectives must be defined at ALL relevant functions and levels — not just at plant level. Each department (QA, Production, Purchase, Maintenance, HR) must have aligned objectives.',
    procedures:["Departmental Quality Objectives Cascade Procedure"],
    docs:["Plant-level quality objectives", "Departmental objectives (QA, Production, Purchase, Maintenance, HR)", "Individual-level quality targets", "Cascade linkage: plant → department → individual", "HOD sign-off on departmental objectives", "Evidence in departmental review meetings"],
    processOwner:'Top Management, All HODs, QA, MR' },
  { id:'cl6_3', clause:'6.3', title:'Planning of Changes', standard:'ISO', group:'Planning',
    meaning:'When changes to the QMS are needed, plan them carefully. Consider purpose, consequences, resource needs, and responsibilities before making changes.',
    procedures:["Change Management Procedure"],
    docs:["Change request register / change log", "Change impact assessment records", "CFT review records before implementing changes", "Customer notification records (where required)", "Updated documents after changes (Control Plan, FMEA, WI)", "Risk assessment for each change"],
    processOwner:'QA, ME, Production, MR, Design/Engineering' },
  { id:'cl7_1_1', clause:'7.1.1', title:'Resources — General', standard:'ISO', group:'Support',
    meaning:'Determine and provide all resources needed for the QMS: people, infrastructure, environment, measurement equipment, and knowledge.',
    procedures:["Resource Planning Procedure"],
    docs:["Resource plan / approved budget for QA department", "Equipment and infrastructure list", "Manpower plan vs. actual", "Resource adequacy review at MRM", "Evidence of resource requests and approvals"],
    processOwner:'Top Management, All HODs, HR, Maintenance' },
  { id:'cl7_1_2', clause:'7.1.2', title:'People Resources', standard:'ISO', group:'Support',
    meaning:'Ensure adequate number of competent people are available for all QMS processes. Manage manpower planning including temporary and contract workers.',
    procedures:["Manpower Planning Procedure", "Contract Worker Management Procedure"],
    docs:["Manpower plan vs. actual headcount", "Skill / competency matrix", "Critical positions filled", "Succession planning records", "Temporary/contract worker competency management"],
    processOwner:'HR, Production, QA, Top Management' },
  { id:'cl7_1_3', clause:'7.1.3', title:'Infrastructure', standard:'ISO', group:'Support',
    meaning:'Provide and maintain all physical infrastructure needed: buildings, equipment, utilities, IT systems, transport. Keep equipment maintained and calibrated.',
    procedures:["Infrastructure Management Procedure", "Preventive Maintenance Procedure"],
    docs:["Infrastructure list (buildings, equipment, utilities, IT)", "Equipment maintenance schedule", "Preventive maintenance records", "Calibration plan and records", "Corrective maintenance records", "IT system validation (if applicable)"],
    processOwner:'Maintenance, Production, QA, IT' },
  { id:'cl7_1_3_1', clause:'7.1.3.1', title:'Plant, Facility and Equipment Planning (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: Facility and equipment layout must be designed using a multidisciplinary (CFT) approach. Ergonomics, capacity, material flow, and quality controls must be considered during planning.',
    procedures:["Facility Planning Procedure (IATF supplemental)", "Ergonomics Assessment Procedure"],
    docs:["Plant layout drawings (current revision)", "CFT sign-off on facility planning (Quality, Production, ME, Safety, HR)", "Equipment capacity analysis", "Ergonomic assessment records", "Material flow / value stream map", "OEE baseline data per workstation", "Safety and environmental compliance in layout"],
    processOwner:'ME, Production, QA, Maintenance, Safety' },
  { id:'cl7_1_4', clause:'7.1.4', title:'Environment for Operation of Processes', standard:'ISO', group:'Support',
    meaning:'Ensure the working environment is suitable for producing good-quality products. Control factors like cleanliness, temperature, humidity, lighting, and noise.',
    procedures:["Work Environment Management Procedure", "5S / Housekeeping Procedure"],
    docs:["Environmental conditions specification per process", "Monitoring records (temp, humidity) for controlled areas", "5S audit records", "Housekeeping standards", "Workplace inspection records"],
    processOwner:'Production, Maintenance, QA, Safety' },
  { id:'cl7_1_4_1', clause:'7.1.4.1', title:'Environment — Supplemental (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: Controlled environment requirements must be documented for processes that need them (foam pouring temperature, ESD areas, cleanroom for precision parts, cleanliness for seating assembly).',
    procedures:["Controlled Environment Procedure (IATF supplemental)"],
    docs:["List of processes requiring controlled environment", "Temperature/humidity monitoring logs", "ESD control procedures (if electronics/electric seats involved)", "Cleanliness standards per workstation", "5S audit scores and trend", "Special environment compliance records (foam room, paint area)"],
    processOwner:'Production, Maintenance, QA' },
  { id:'cl7_1_5_1', clause:'7.1.5.1', title:'Monitoring & Measuring Resources — General', standard:'ISO', group:'Support',
    meaning:'Identify all equipment used for measuring or monitoring product/process quality. Ensure they are fit for purpose, maintained, and calibrated.',
    procedures:["Calibration Management Procedure"],
    docs:["Master list of all measuring and monitoring equipment", "Calibration plan (100% coverage, no overdue items)", "Calibration records and certificates", "NABL accredited lab certificates for critical instruments", "Out-of-tolerance records with product impact assessment", "Calibration status sticker on every gauge"],
    processOwner:'QA, Maintenance, Production' },
  { id:'cl7_1_5_1_1', clause:'7.1.5.1.1', title:'Measurement System Analysis — MSA (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE CRITICAL: Every measurement system used to control CC/SC characteristics must have an MSA study. Variable gauges need Gauge R&R (GRR <10% excellent, <30% conditional). Attribute gauges need Kappa study (Kappa >0.75). ndc ≥ 5 is required.',
    procedures:["MSA Study Procedure (MANDATORY)", "Gauge Management Procedure"],
    docs:["MSA study plan (all measurement systems from Control Plan covered)", "Variable GRR studies (Average & Range or ANOVA method): %GRR <10% excellent, 10–30% conditional, >30% unacceptable", "ndc ≥ 5 for all variable GRR studies", "Attribute MSA: Kappa studies for visual inspection, go/no-go gauges (Kappa >0.75)", "MSA for specific seating gauges: seat dimension gauge, torque tools, H-point measurement, weld inspection, foam hardness", "Customer acceptance records for alternative measurement methods", "MSA results linked to Control Plan"],
    processOwner:'QA (Lead), Production, Design/Engineering' },
  { id:'cl7_1_5_2', clause:'7.1.5.2', title:'Measurement Traceability', standard:'ISO', group:'Support',
    meaning:'All measurement equipment must be traceable back to national or international standards (NPL/BIPM). Calibration certificates must show this chain.',
    procedures:["Measurement Traceability Procedure"],
    docs:["Calibration certificates showing NPL/BIPM traceability", "NABL accredited lab calibration certificates", "Traceability chain documented for each critical instrument", "External lab ISO/IEC 17025 accreditation proof"],
    processOwner:'QA, Maintenance' },
  { id:'cl7_1_5_2_1', clause:'7.1.5.2.1', title:'Calibration/Verification Records (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: Detailed calibration records required for every instrument: ID, description, cal date, due date, result (pass/fail), performed by, certificate number, traceability reference. Out-of-tolerance impact assessment mandatory.',
    procedures:["Calibration Record Management Procedure (IATF supplemental)"],
    docs:["Calibration record per instrument (ID, description, cal date, next due, result, cert no.)", "Calibration status label on every gauge", "Out-of-tolerance record + product recall/impact assessment", "Calibration frequency basis documented (manufacturer recommendation, risk, usage frequency)", "Customer acceptance records for alternative methods", "100% calibration plan adherence — no overdue items", "Auditor check: pick 5 random shop floor gauges — all stickers current?"],
    processOwner:'QA, Maintenance' },
  { id:'cl7_1_5_3_1', clause:'7.1.5.3.1', title:'Internal Laboratory (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: If you have an internal test lab, its scope must be documented, personnel must be qualified, test methods must be written, and equipment must be calibrated.',
    procedures:["Internal Laboratory Management Procedure (IATF mandatory)"],
    docs:["Internal lab scope document (tests covered: foam density, weld pull, seat layout inspection, H-point, flammability if in-house)", "Lab equipment list with calibration records", "Qualified lab personnel training records", "Written test SOPs / test methods for each test", "Lab environmental condition records (temp, humidity)", "Inter-lab correlation records (if applicable)", "Lab test results with acceptance criteria"],
    processOwner:'QA, Lab Technician' },
  { id:'cl7_1_5_3_2', clause:'7.1.5.3.2', title:'External Laboratory (IATF — SI-10)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: External labs must be NABL accredited (ISO/IEC 17025) for the tests being performed. Lab scope must cover the specific tests. Non-accredited labs require customer approval.',
    procedures:["External Laboratory Management Procedure"],
    docs:["Approved external lab list: lab name, NABL cert number, accreditation scope, validity dates", "Test reports showing NABL accreditation logo and cert number", "Lab scope covers specific tests performed (flammability, salt spray, mechanical)", "Customer approval records for non-accredited labs", "SI-10: Manufacturer's calibration services — equivalent to accreditation if meeting requirements"],
    processOwner:'QA' },
  { id:'cl7_1_6', clause:'7.1.6', title:'Organizational Knowledge', standard:'ISO', group:'Support',
    meaning:'Capture and manage the knowledge your organization needs to operate effectively. Prevent knowledge loss when experienced employees leave.',
    procedures:["Knowledge Management Procedure", "Lessons Learned Procedure"],
    docs:["Lessons learned database (from past failures, customer complaints, field returns)", "Best practices documentation", "Knowledge transfer records (employee exit, new hire)", "Technical knowledge assets: FMEA library, Control Plan history, design standards", "Tribal knowledge documentation", "New product development knowledge (APQP outputs as knowledge)"],
    processOwner:'HR, QA, Design/Engineering, All HODs' },
  { id:'cl7_2_1', clause:'7.2.1', title:'Competence — Supplemental (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: A documented process must exist to identify training needs for all personnel whose work affects product/process quality. Training effectiveness must be evaluated.',
    procedures:["Training Needs Identification (TNI) Procedure (MANDATORY)", "Training Effectiveness Evaluation Procedure"],
    docs:["Training Needs Identification record per employee / role", "Competency matrix (skill matrix): all roles vs. required competencies", "Annual training plan with status", "Training effectiveness evaluation records (test scores, practical demonstration, supervisor assessment)", "Re-training records when process or product changes occur", "Evidence: operators on CC/SC processes are qualified and trained"],
    processOwner:'HR, QA, Production, All HODs' },
  { id:'cl7_2_2', clause:'7.2.2', title:'Competence — On-the-Job Training (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: OJT (On-the-Job Training) must be structured, documented, and evaluated for all employees whose work affects quality — including temporary workers.',
    procedures:["On-the-Job Training Procedure"],
    docs:["OJT records per operator (trainer, date, tasks covered, evaluation result)", "OJT sign-off by qualified trainer and supervisor", "Skill matrix: trained vs. qualified status per workstation", "Temporary/contract worker OJT records", "Operator qualification cards at workstations"],
    processOwner:'HR, Production, QA' },
  { id:'cl7_2_3', clause:'7.2.3', title:'Internal Auditor Competency (IATF — SI-04)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: Internal auditors must be formally qualified. Product auditors need specific product knowledge. Process auditors should be trained in VDA 6.3 or equivalent. QMS auditors need IATF 16949 training. All auditor competency must be documented.',
    procedures:["Internal Auditor Competency Procedure (MANDATORY)", "Auditor Qualification Procedure"],
    docs:["List of qualified internal auditors with competency records", "IATF 16949 / ISO 9001 Lead Auditor training certificates", "VDA 6.3 Process Auditor certification (for manufacturing process audits)", "Product auditor qualification: product knowledge, inspection competency", "Audit experience log (audits conducted, findings raised, by clause/process)", "Independence compliance: auditors not auditing their own area", "Auditor re-qualification schedule"],
    processOwner:'MR, QA, Internal Auditors' },
  { id:'cl7_2_4', clause:'7.2.4', title:'Second Party Auditor Competency (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: Personnel who conduct supplier audits (second-party audits) must also be formally qualified — same as internal auditors. Customer-specific auditor requirements must be met.',
    procedures:["Second Party Auditor Qualification Procedure"],
    docs:["Second party auditor training records (VDA 6.3 preferred)", "Customer-specific auditor requirement compliance (TML, Ashok Leyland)", "Records of supplier audits conducted by qualified auditors", "Supplier audit schedule by qualified persons"],
    processOwner:'QA, Purchase/SCM' },
  { id:'cl7_3_1', clause:'7.3.1', title:'Awareness — Supplemental (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: All employees must understand their contribution to product quality and the consequences of nonconformity. Quality policy awareness and product safety awareness are mandatory for all — including operators.',
    procedures:["Awareness Training Procedure (IATF supplemental)"],
    docs:["Awareness training records: quality policy, quality objectives, their contribution to QMS", "Training records on consequences of nonconformity (customer rejection, warranty, recall risk)", "Product safety awareness training for relevant personnel", "New employee awareness induction records", "Periodic re-awareness records (annual minimum)", "Auditor check: interview 3 shop floor operators on quality policy and their quality role"],
    processOwner:'HR, QA, All Employees' },
  { id:'cl7_3_2', clause:'7.3.2', title:'Employee Motivation and Empowerment (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: Employees must be motivated and empowered to contribute to quality improvement. They must feel safe to report quality issues without fear. Suggestion schemes and recognition programmes are expected.',
    procedures:["Employee Motivation & Empowerment Procedure"],
    docs:["Employee suggestion scheme records (ideas submitted, implemented, reward given)", "Quality award / recognition records", "Employee engagement survey results", "Records of employees empowered to stop production for quality", "Kaizen/CI project contribution records", "Grievance/feedback mechanism records"],
    processOwner:'HR, Top Management, All Employees' },
  { id:'cl7_4', clause:'7.4', title:'Communication', standard:'ISO', group:'Support',
    meaning:'Establish an effective communication plan for QMS-related information — both internal (between departments) and external (with customers, suppliers, regulators).',
    procedures:["Internal Communication Procedure", "External Communication Procedure"],
    docs:["Internal communication plan/matrix (who, what, to whom, when, how)", "External communication procedure (customer complaints, regulators, suppliers)", "Meeting minutes, emails, portal communications as records", "Customer communication records (complaints, change notices)", "Emergency communication procedure"],
    processOwner:'All Functions, QA, Top Management' },
  { id:'cl7_5_1_1', clause:'7.5.1.1', title:'QMS Documentation (IATF — SI-05)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: The QMS must be documented including a Quality Manual. All 68 mandatory IATF documents must be present and maintained.',
    procedures:["Document Control Procedure (MANDATORY)", "Quality Manual Maintenance Procedure"],
    docs:["Quality Manual (covering all IATF 16949 clauses)", "All 68 mandatory IATF documents present, current, and approved", "Document hierarchy: Manual → Procedures → Work Instructions → Forms/Records", "External documents controlled (customer drawings, standards, regulatory docs)", "Document master list with revision control"],
    processOwner:'MR, QA, All HODs' },
  { id:'cl7_5_2', clause:'7.5.2', title:'Creating and Updating Documents', standard:'ISO', group:'Support',
    meaning:'All documents must have proper identification (number, revision, date), be reviewed and approved before use, and have a clear format.',
    procedures:["Document Creation and Control Procedure"],
    docs:["Document format standard (header: doc number, revision, date, approval)", "Document review and approval records", "Version/revision history for all documents", "Approval signatures present", "Format consistency across QMS documents"],
    processOwner:'MR, QA, All Document Owners' },
  { id:'cl7_5_3_2_1', clause:'7.5.3.2.1', title:'Record Retention (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: Define how long each type of quality record must be kept, where it is stored, and how it is disposed. Customer and regulatory retention requirements must be followed.',
    procedures:["Record Retention Policy (MANDATORY)"],
    docs:["Record retention matrix: record type, retention period, storage location, disposal method", "Minimum retention periods: production records (1 yr min), PPAP (life of part +1 yr), calibration (3 yrs), customer-specific requirements", "TML/TMBSL specific retention requirements", "Legal/regulatory retention requirements", "Auditor check: can records from 3 years ago be retrieved?"],
    processOwner:'MR, QA, All HODs' },
  { id:'cl7_5_3_2_2', clause:'7.5.3.2.2', title:'Engineering Specifications (IATF)', standard:'IATF', group:'Support',
    meaning:'AUTOMOTIVE: There must be a documented process for receiving, reviewing, and implementing customer engineering specifications/drawings within a defined timeframe (max. 10 working days). All changes must be implemented on the shop floor.',
    procedures:["Engineering Specification Management Procedure (MANDATORY)"],
    docs:["Engineering specification register (latest revision of each customer standard)", "Review timeline: max. 10 working days from receipt", "Dated acknowledgements of spec receipt and review", "Training records when spec changes affect process", "Controlled document distribution to shop floor", "Auditor check: when did TML last issue a drawing change? How quickly was it implemented?"],
    processOwner:'Design/Engineering, QA, Production, ME' },
  { id:'cl8_1_1', clause:'8.1.1', title:'Operational Planning — Supplemental / APQP (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: APQP (Advanced Product Quality Planning) must be used for all new product programs. It provides structured planning through 5 phases and gates 0–5. Manufacturing feasibility must be assessed.',
    procedures:["APQP Procedure (MANDATORY)", "Manufacturing Feasibility Procedure"],
    docs:["APQP plan for each new product launch (Phase 1–5, Gates 0–5)", "APQP status report (active programs)", "Gate review records with CFT sign-off", "Manufacturing feasibility assessment (signed by CFT)", "Safe Launch plan and monitoring records", "APQP output checklist: DFMEA, PFMEA, Control Plan, MSA, PPAP", "Customer-approved APQP timeline"],
    processOwner:'QA (Lead), Design/Engineering, Production, ME, Purchase, Top Management' },
  { id:'cl8_1_2', clause:'8.1.2', title:'Confidentiality (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Customer product and project information must be kept confidential. NDAs must be in place. Access to customer data (drawings, specs, volumes) must be restricted.',
    procedures:["Confidentiality / Data Security Procedure"],
    docs:["NDA/Confidentiality agreements with customers (TML, TMBSL)", "Data access control policy", "IT security measures for customer data", "Restricted access records for design drawings and sensitive customer information", "Employee confidentiality awareness records"],
    processOwner:'Top Management, QA, Design/Engineering, IT' },
  { id:'cl8_2_1', clause:'8.2.1', title:'Customer Communication', standard:'ISO', group:'Operations',
    meaning:'Establish effective communication channels with customers for: product information, enquiries, orders, feedback, complaints, and emergency situations.',
    procedures:["Customer Communication Procedure"],
    docs:["Customer communication records (emails, meeting minutes, portal)", "Customer complaint response records with timeline", "Customer portal access records (TML SRM, TMBSL)", "Order acknowledgement records", "Customer visit records and action items"],
    processOwner:'QA, Customer Service, Sales/Marketing' },
  { id:'cl8_2_1_1', clause:'8.2.1.1', title:'Customer Communication — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Communication with customer must include warranty feedback, field return analysis, and customer scorecard data. Complaint response timelines per customer CSR must be followed.',
    procedures:["Customer Complaint Management Procedure (IATF supplemental)", "Warranty Management Procedure"],
    docs:["Complaint response records (initial response within 24 hrs per TML CSR)", "8D reports for each customer complaint", "Field return / warranty analysis records", "Customer portal notification records", "CPPM data from customer portal", "Customer visit action items with closure"],
    processOwner:'QA, Customer Service, Top Management' },
  { id:'cl8_2_2_1', clause:'8.2.2.1', title:'Determining Requirements — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Customer-specific requirements must be formally reviewed whenever received or updated. Special characteristics from customer drawings must be identified and flowed into FMEA and Control Plan.',
    procedures:["Customer Requirement Determination Procedure"],
    docs:["Customer requirement review records per program", "Special characteristics identified from customer drawings (CC/SC)", "Statutory and regulatory requirements list (AIS 023, ECE R17, FMVSS 302, CMVR)", "CSR compliance matrix", "Review evidence when new customer requirement issued"],
    processOwner:'QA, Design/Engineering, Production' },
  { id:'cl8_2_3_1_1', clause:'8.2.3.1.1', title:'Review of Requirements — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Formal review of all customer requirements before commitment to supply. Review must be documented with defined timeline and waiver process for urgent situations.',
    procedures:["Requirement Review Procedure (IATF supplemental)"],
    docs:["Customer requirement review records with defined timeline", "Feasibility review records for each new product/program", "CFT review sign-off for product requirements", "Waiver process records (when standard review not possible)", "Quote/order review records"],
    processOwner:'QA, Design/Engineering, Production, Purchase' },
  { id:'cl8_2_3_1_2', clause:'8.2.3.1.2', title:'Customer Designated Special Characteristics (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE CRITICAL: All characteristics designated as special by the customer (CC/SC on TML drawings using diamond ◆ or triangle ▲ symbols) must be cascaded into PFMEA, Control Plan, Work Instructions, and inspection records.',
    procedures:["Special Characteristics Management Procedure"],
    docs:["Customer-designated CC/SC list (from TML/TMBSL drawings)", "CC/SC cascade evidence: Drawing → PFMEA → Control Plan → WI → Inspection record", "Customer symbols correctly used on drawings (◆ for CC, ▲ for SC per TML standard)", "CC/SC matrix: each characteristic linked to control method", "SPC or 100% inspection or error-proofing as per CC/SC requirement", "No waiver/concession on CC without customer written approval"],
    processOwner:'QA (Lead), Design/Engineering, ME, Production' },
  { id:'cl8_2_3_1_3', clause:'8.2.3.1.3', title:'Organization Manufacturing Feasibility (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Before committing to supply a new part, perform a formal manufacturing feasibility study signed by a multidisciplinary team (CFT). Capacity, capability, and risk must be assessed.',
    procedures:["Manufacturing Feasibility Assessment Procedure"],
    docs:["Manufacturing feasibility assessment form (CFT signed: QA, Production, ME, Purchase)", "Capacity analysis", "Risk identification during feasibility", "Customer notification of feasibility result", "PPAP readiness assessment", "New equipment/tooling requirement identified"],
    processOwner:'QA, Production, ME, Purchase, Design/Engineering' },
  { id:'cl8_2_4', clause:'8.2.4', title:'Changes to Requirements for Products and Services', standard:'ISO', group:'Operations',
    meaning:'When customer requirements change, update all relevant documents and communicate changes to all affected people. Obtain customer approval if required.',
    procedures:["Change Management / Engineering Change Procedure"],
    docs:["Change notification records from customer", "Engineering Change Request (ECR) register", "Impact assessment for each change (cost, tooling, quality, timing)", "Updated documents: Control Plan, WI, FMEA after each change", "Customer approval records for changes requiring approval", "Re-PPAP records where required"],
    processOwner:'QA, Design/Engineering, ME, Production' },
  { id:'cl8_3_1_1', clause:'8.3.1.1', title:'D&D — Supplemental / APQP (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: APQP must be used as the design and development framework. DFMEA is mandatory when design responsibility is held. Gate reviews must be documented.',
    procedures:["APQP / D&D Procedure (IATF supplemental)"],
    docs:["APQP plan: Phase 1 (Planning) → Phase 2 (Product Design) → Phase 3 (Process Design) → Phase 4 (Validation) → Phase 5 (Launch)", "Gate 0–5 review records with CFT sign-off", "DFMEA for all new designs (if design responsibility held)", "DVP&R (Design Verification Plan & Report)", "Design review meeting minutes", "Prototype build and test records", "Customer-approved APQP timeline"],
    processOwner:'Design/Engineering (Lead), QA, Production, ME, Purchase' },
  { id:'cl8_3_2_2', clause:'8.3.2.2', title:'Product Design Skills (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Design engineers must have documented competency in the tools and methods used. CAD/CAE tools, FEA analysis, tolerance stack-up, DFM/DFA skills must be evidenced.',
    procedures:["Design Engineer Competency Procedure"],
    docs:["Skill matrix for design engineers (CAD, FEA, DFMEA, tolerance analysis)", "Training records for design tools (NX, CATIA, SolidWorks)", "Seating-specific design competency: frame design, foam analysis, recliner mechanism, track load analysis", "External design resource records (if design outsourced)", "Professional qualification records"],
    processOwner:'Design/Engineering' },
  { id:'cl8_3_2_3', clause:'8.3.2.3', title:'Products with Embedded Software (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: If products include embedded software (electric seats, memory function, seat position sensors), software development must be formally managed with version control and validation.',
    procedures:["Software Development Procedure", "Software Configuration Management Procedure"],
    docs:["Software development capability self-assessment", "Software FMEA (for electric seat, sensors, seat control units)", "Software version control records", "Software validation and verification records", "Automotive SPICE or equivalent assessment", "Software change control records"],
    processOwner:'Design/Engineering, QA' },
  { id:'cl8_3_3_1', clause:'8.3.3.1', title:'Product Design Input (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All product design inputs must be formally captured and approved: functional requirements, regulatory requirements, customer specs, interface requirements, and lessons learned from previous programs.',
    procedures:["Product Design Input Management Procedure"],
    docs:["Product design input record per part/program", "Customer specification review record", "Regulatory requirements input: ECE R17, AIS 023, FMVSS 302, IS 15061", "Interface requirements with vehicle structure", "Special characteristics input from customer drawings", "Lessons learned from previous programs", "CFT sign-off on design inputs"],
    processOwner:'Design/Engineering, QA, ME' },
  { id:'cl8_3_3_2', clause:'8.3.3.2', title:'Manufacturing Process Design Input (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Manufacturing process requirements must be formally defined before process design begins — including cycle time targets, process capability requirements, tooling requirements, and ergonomic requirements.',
    procedures:["Manufacturing Process Design Procedure"],
    docs:["Manufacturing process design input record", "Process requirements: cycle time, Cpk targets, tooling, fixtures", "PFMEA inputs from process design", "Control Plan inputs", "Ergonomics requirements", "Equipment/machine specifications", "ME and QA sign-off"],
    processOwner:'ME, Production, QA' },
  { id:'cl8_3_3_3', clause:'8.3.3.3', title:'Special Characteristics — Identification (IATF — SI-06)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE CRITICAL: A documented process must exist for identifying, classifying, and controlling special characteristics (CC — Safety/Regulatory, SC — Significant). They must flow from customer requirements through DFMEA → PFMEA → Control Plan → WI → Inspection.',
    procedures:["Special Characteristics Identification Procedure (MANDATORY)"],
    docs:["SC/CC identification process with CFT review", "Special characteristics matrix for all products (CC/SC with source: customer, regulatory, internal)", "Cascade evidence: Customer Drawing → DFMEA → PFMEA → Control Plan → WI → Inspection record", "Customer symbol usage on drawings", "SC/CC review at APQP gate reviews", "No gap between PFMEA and Control Plan on SC/CC characteristics", "Seating SC examples: seat frame weld strength, seatbelt anchorage torque, recliner locking force"],
    processOwner:'QA (Lead), Design/Engineering, ME, Production' },
  { id:'cl8_3_4_2', clause:'8.3.4.2', title:'Design and Development Validation (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Design must be validated under actual use conditions before launch. Validation includes vehicle integration tests, regulatory tests, and durability tests.',
    procedures:["Design Validation Procedure", "DVP&R Procedure"],
    docs:["DVP&R (Design Verification Plan & Report)", "Prototype test reports (seat strength, fatigue, durability cycling, vibration, thermal)", "Vehicle integration test records", "Regulatory/homologation test reports (ECE R17, AIS 023, FMVSS 302)", "ARAI/ICAT type approval certificate", "Customer approval of validation plan and results", "Test lab accreditation for regulatory tests"],
    processOwner:'Design/Engineering, QA, External Test Lab' },
  { id:'cl8_3_4_3', clause:'8.3.4.3', title:'Prototype Programme (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: A formal prototype programme must be conducted for new products. Prototype Control Plan, build records, and customer feedback must be documented.',
    procedures:["Prototype Management Procedure"],
    docs:["Prototype plan with timeline", "Prototype Control Plan", "Prototype build records", "Prototype test results", "Prototype dimensional inspection records", "Customer evaluation and feedback records", "Build deviations and dispositions"],
    processOwner:'Design/Engineering, QA, Production' },
  { id:'cl8_3_4_4', clause:'8.3.4.4', title:'Product Approval Process — PPAP (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE CRITICAL: PPAP (Production Part Approval Process) per AIAG 4th Edition is mandatory for every new part, significant change, and at customer request. All 18 elements must be complete and PSW (Part Submission Warrant) must be customer-approved.',
    procedures:["PPAP Procedure (MANDATORY)", "Product Approval Procedure"],
    docs:["Complete PPAP package (all 18 elements):", "1. Design records (drawings with customer approval)", "2. Engineering change documents", "3. Customer engineering approval", "4. DFMEA", "5. Process flow diagram", "6. PFMEA", "7. Control Plan (pre-launch + production)", "8. MSA results", "9. Dimensional layout results (all characteristics)", "10. Material/performance test results", "11. Initial process capability (Cpk ≥ 1.67 for CC/SC)", "12. Qualified lab documentation", "13. Appearance approval (AAR)", "14. Sample parts", "15. Master sample", "16. Checking aids", "17. Customer-specific requirements", "18. Part Submission Warrant (PSW) — signed, customer-approved", "PSW revision level matching current drawing", "Customer PPAP approval letter/portal acknowledgement"],
    processOwner:'QA (Lead), Design/Engineering, ME, Production, Purchase' },
  { id:'cl8_3_5_2', clause:'8.3.5.2', title:'Manufacturing Process Design Output (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Manufacturing process design must produce documented outputs: Process Flow Diagram, PFMEA, Control Plan, Work Instructions, machine specs, and tooling list. All must be linked.',
    procedures:["Manufacturing Process Design Output Procedure"],
    docs:["Process Flow Diagram (all process steps, including sub-processes)", "PFMEA (all process steps, Action Priority addressed)", "Pre-launch + Production Control Plan", "Work instructions at all workstations", "Machine/equipment specifications", "Tooling and fixture list", "Cycle time analysis", "Unbroken link: PFD → PFMEA → Control Plan → WI"],
    processOwner:'ME, QA, Production' },
  { id:'cl8_3_6_1', clause:'8.3.6.1', title:'D&D Changes — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All design changes must be notified to and approved by the customer before implementation. Re-PPAP is required for significant changes. Safety impact must be assessed.',
    procedures:["Engineering Change Control Procedure (IATF supplemental)"],
    docs:["Customer notification records for all design changes", "Internal testing/validation before implementing changes", "Re-PPAP records where required by customer", "Safety impact assessment for changes affecting safety characteristics", "Customer written approval before implementation", "ECN (Engineering Change Notice) register"],
    processOwner:'Design/Engineering, QA, Production' },
  { id:'cl8_4_1_1', clause:'8.4.1.1', title:'Supplier Control — General Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All outsourced processes (heat treatment, plating, foam moulding at external source, painting) must be controlled as external providers with documented controls.',
    procedures:["Outsourced Process Control Procedure"],
    docs:["Supplier control procedure", "Approved Supplier List (ASL)", "Supplier classification: Critical, Major, Minor based on risk", "Control measures per supplier class", "Outsourced process controls (audit, inspection, qualification)", "Control Plan for outsourced process steps"],
    processOwner:'Purchase/SCM, QA' },
  { id:'cl8_4_1_2', clause:'8.4.1.2', title:'Supplier Selection Process (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: New suppliers must be formally evaluated and approved before first use. Selection criteria must include quality capability, financial stability, and QMS certification status.',
    procedures:["Supplier Selection and Approval Procedure (MANDATORY)"],
    docs:["Documented supplier selection procedure with criteria", "New supplier evaluation records (quality audit, financial, technical capability assessment)", "Approved Supplier List with selection evidence", "First article inspection / PPAP before mass production approval", "Customer approval for directed-buy suppliers"],
    processOwner:'Purchase/SCM, QA' },
  { id:'cl8_4_1_3', clause:'8.4.1.3', title:'Customer Directed Sources / Directed-Buy (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: When a customer specifies a particular supplier (directed-buy), the organization must still monitor that supplier\'s quality and notify the customer if issues arise.',
    procedures:["Directed-Buy Supplier Management Procedure"],
    docs:["List of customer-directed (directed-buy) suppliers from TML/TMBSL", "Monitoring records for directed-buy materials", "Customer communication records when directed-buy supplier has quality issues", "Incoming inspection records for directed-buy materials"],
    processOwner:'Purchase/SCM, QA' },
  { id:'cl8_4_2_1', clause:'8.4.2.1', title:'Type and Extent of Control — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: The type and level of control applied to each supplier must be documented and risk-based. Controls must increase when supplier performance deteriorates.',
    procedures:["Supplier Control Determination Procedure (IATF supplemental)"],
    docs:["Supplier control matrix (what controls apply to each supplier/part)", "Risk-based control approach: SPPM history, audit results, PPAP status", "Incoming inspection plan (100%, sampling, skip-lot by SPPM)", "Evidence of increased controls when SPPM deteriorates", "Controlled Shipping (CS1/CS2) records for poor performers"],
    processOwner:'QA, Purchase/SCM' },
  { id:'cl8_4_2_2', clause:'8.4.2.2', title:'Statutory & Regulatory Requirements for Purchased Items (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Regulatory requirements must be flowed down to all suppliers. Restricted substances must be controlled. Material declarations must be obtained.',
    procedures:["Supplier Regulatory Compliance Procedure"],
    docs:["Regulatory requirements for all purchased materials (REACH, RoHS, material declarations)", "Material test certificates for critical materials (steel grade cert, foam density cert, fabric flammability cert)", "Process to flow regulatory requirements to sub-tier suppliers", "Restricted substances register (chrome VI, asbestos, lead, cadmium — all banned per ELV directive)", "Supplier compliance declarations"],
    processOwner:'Purchase/SCM, QA, Design/Engineering' },
  { id:'cl8_4_2_3', clause:'8.4.2.3', title:'Supplier QMS Development (IATF — SI-08)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Suppliers of automotive parts must have IATF 16949 or ISO 9001 certification, or be on a development plan toward certification. SI-08 defines the phased approach for supplier QMS development.',
    procedures:["Supplier QMS Development Procedure (IATF supplemental)"],
    docs:["Supplier QMS certification register (IATF/ISO 9001 certified status per supplier)", "Supplier development plan for non-certified suppliers (timeline + milestones)", "Second-party audit records for non-certified suppliers", "PPAP approval as evidence of quality capability", "Escalation plan for suppliers not meeting development milestones"],
    processOwner:'Purchase/SCM, QA' },
  { id:'cl8_4_2_4', clause:'8.4.2.4', title:'Supplier Monitoring (IATF — SI-19)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All supplier performance must be formally monitored using documented criteria. SPPM, delivery, quality, and audit results must be tracked monthly.',
    procedures:["Supplier Performance Monitoring Procedure (MANDATORY)"],
    docs:["Supplier scorecard / monthly performance report (SPPM, delivery, quality issues)", "SPPM trend chart per supplier", "Supplier 8D records for quality escapes", "Supplier escalation process (CS1 — Controlled Shipping Level 1, CS2 — Level 2)", "Annual supplier performance review records", "Supplier rating system (A/B/C or equivalent)"],
    processOwner:'QA, Purchase/SCM' },
  { id:'cl8_4_2_4_1', clause:'8.4.2.4.1', title:'Second Party Audits (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Second-party (supplier) audits must be conducted by qualified auditors on a risk-based schedule. Audit records must be maintained and NC closure tracked.',
    procedures:["Second Party Audit Procedure"],
    docs:["Second party audit schedule (risk-based, all high-risk suppliers covered)", "Second party audit reports (completed, findings, corrective actions)", "Supplier NC closure records with evidence", "Re-audit records for suppliers with open major findings", "Auditor qualification proof (VDA 6.3 preferred)"],
    processOwner:'QA, Purchase/SCM' },
  { id:'cl8_4_2_5', clause:'8.4.2.5', title:'Supplier Development (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Underperforming or new suppliers must have a formal development plan with measurable targets, on-site support, and milestone tracking.',
    procedures:["Supplier Development Programme Procedure"],
    docs:["Supplier development plan (for poor-performing/new suppliers)", "Supplier improvement targets and timelines", "SQE (Supplier Quality Engineer) on-site visit reports", "Supplier training/workshop records", "Evidence of supplier improvement (SPPM trend improvement chart)", "Development plan effectiveness review"],
    processOwner:'QA, Purchase/SCM' },
  { id:'cl8_4_3_1', clause:'8.4.3.1', title:'Information for External Providers — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All quality requirements must be formally communicated to suppliers: drawings with latest revision, customer CSRs, special characteristics, statutory/regulatory requirements, and PPAP requirements.',
    procedures:["Supplier Communication Procedure (IATF supplemental)"],
    docs:["Customer CSRs flowed down to suppliers", "Supplier Quality Requirements (SQR) document", "Drawing and specification transmittal records to suppliers", "Special characteristics (CC/SC) flow-down records", "PPAP requirements communicated to each supplier", "Change notification process to suppliers", "Supplier acknowledgement of requirements receipt"],
    processOwner:'Purchase/SCM, QA' },
  { id:'cl8_5_1_1', clause:'8.5.1.1', title:'Control Plan (IATF — MANDATORY)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE CRITICAL: Control Plans are mandatory for all products. Must exist in 4 types: Pre-Launch, Production, Rework, and Alternate/Backup. All CC/SC characteristics must be controlled with defined method, sample size, frequency, and reaction plan. Control Plan must link to PFMEA.',
    procedures:["Control Plan Development Procedure (MANDATORY)", "Reference: AIAG Control Plan 1st Edition (2024)"],
    docs:["Pre-launch Control Plan", "Production Control Plan (current revision, PPAP-linked)", "EOL (End-of-Line) Control Plan", "Rework Control Plan", "Alternate/Backup Control Plan", "All CC/SC characteristics in Control Plan with: control method, sample size, frequency, measurement system, reaction plan", "Control Plan linked to PFMEA (same characteristics, same numbers)", "Customer approval of Control Plan (if required by CSR)", "Auditor check: pick any CC characteristic — is it in PFMEA AND Control Plan?"],
    processOwner:'QA (Lead), ME, Production' },
  { id:'cl8_5_1_2', clause:'8.5.1.2', title:'Standardised Work (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Standardised work documents must be at every workstation in simple, operator-understandable format. Visual aids, photos, and mistake-proofing tips must be included.',
    procedures:["Standardised Work / Work Instruction Procedure"],
    docs:["SOS (Standard Operation Sheet) / WI at each workstation (current revision)", "Visual work aids with photographs showing correct/incorrect", "Cycle time standards documented", "WI in operator language (Kannada/Hindi if needed)", "Operator training records on standardised work", "Auditor check: visit any workstation — is WI current? Can operator explain key quality checks?"],
    processOwner:'Production, ME, QA' },
  { id:'cl8_5_1_3', clause:'8.5.1.3', title:'Verification of Job Setups (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Every time a job is set up or changed over, the first piece must be inspected and approved by QA before production starts. Records must be maintained.',
    procedures:["Job Setup Verification Procedure"],
    docs:["First-off inspection / First Article Inspection record for each setup", "Setup approval sign-off by QA (before production start)", "Setup records: tooling used, parameters set, first piece result", "Setup verification for every changeover", "Last-off part inspection record (for comparison on next run)"],
    processOwner:'Production, QA' },
  { id:'cl8_5_1_4', clause:'8.5.1.4', title:'Verification after Shutdown (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: After any planned or unplanned shutdown (weekend, maintenance, power failure), the process must be verified before restarting production. Additional first-piece checks are required.',
    procedures:["Restart / Post-Shutdown Verification Procedure"],
    docs:["Restart verification checklist for each production line", "Records of verification checks after shutdowns (planned and unplanned)", "Additional checks after machine repair or maintenance", "First-piece approval after restart", "Supervisor and QA sign-off on restart"],
    processOwner:'Production, QA, Maintenance' },
  { id:'cl8_5_1_5', clause:'8.5.1.5', title:'Total Productive Maintenance — TPM (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: A formal TPM system is mandatory. It must cover planned preventive maintenance, predictive maintenance, autonomous maintenance by operators, and OEE tracking per machine.',
    procedures:["TPM System Procedure (MANDATORY)"],
    docs:["TPM system document (planned, predictive, autonomous, breakdown maintenance)", "Equipment maintenance schedule (planned vs. actual adherence)", "Preventive maintenance records for all production equipment", "OEE data per machine (Availability × Performance × Quality)", "Breakdown records with MTTR (Mean Time to Repair)", "Spare parts inventory for critical machines", "Autonomous maintenance records (operator-level daily checks)", "TPM board on shop floor"],
    processOwner:'Maintenance (Lead), Production, QA' },
  { id:'cl8_5_1_6', clause:'8.5.1.6', title:'Management of Production Tooling (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All production tooling, jigs, dies, and fixtures must be identified, their condition tracked, and their storage managed. Customer-owned tooling must be separately identified.',
    procedures:["Tooling Management Procedure"],
    docs:["Tooling register: all tooling, fixtures, jigs, dies with ID, location, condition", "Tooling condition / life tracking records", "Tool change records with verification (first-piece check after tool change)", "Customer-owned tooling identified with customer marking and separate records", "Tool storage and preservation records", "Tooling inspection frequency and results"],
    processOwner:'Production, Maintenance, QA' },
  { id:'cl8_5_1_7', clause:'8.5.1.7', title:'Production Scheduling (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Production schedule must be driven by customer orders and JIT requirements. Schedule must be linked to customer release / call-off. Delivery performance must be tracked.',
    procedures:["Production Scheduling Procedure"],
    docs:["Production schedule (weekly/daily) linked to customer orders and call-offs", "JIT / JIS delivery schedule compliance records", "Customer release management process (TML SRM portal orders)", "Capacity planning records", "Schedule adherence KPI (on-time delivery to schedule)", "Shortage / expedite management records"],
    processOwner:'Production, Logistics/Dispatch' },
  { id:'cl8_5_2_1', clause:'8.5.2.1', title:'Identification and Traceability — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE CRITICAL: Full traceability from raw material to finished product to customer delivery must be maintained. Safety-related parts must have tighter traceability. Ability to recall suspect product within defined timeframe is required.',
    procedures:["Identification and Traceability Procedure (MANDATORY)"],
    docs:["Traceability log: raw material lot → WIP → FG → delivery note → customer", "Unique identification on every seat assembly (serial no., date, shift, line)", "Traceability for safety-related parts: seat frame, recliner, seatbelt anchorage", "VIN-level traceability if required by TML/TMBSL", "Recall procedure with response time defined", "Auditor check: pick any finished seat — trace it back to raw material lot"],
    processOwner:'Production, QA, Warehouse/Dispatch' },
  { id:'cl8_5_3', clause:'8.5.3', title:'Customer Property', standard:'ISO', group:'Operations',
    meaning:'Customer-owned items (tooling, gauges, packaging, design data) must be identified, verified, protected, and safeguarded. Report to customer if anything is lost or damaged.',
    procedures:["Customer Property Management Procedure"],
    docs:["List of customer-owned property (tooling, gauges, returnable packaging, data, drawings)", "Customer property identification (marked with customer name/code)", "Storage and maintenance records", "Customer notification records for lost/damaged property", "Periodic condition assessment records"],
    processOwner:'Production, Maintenance, QA' },
  { id:'cl8_5_4_1', clause:'8.5.4.1', title:'Preservation — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Preservation requirements for seats and parts must include packaging design (dunnage), customer-approved packaging specs, FIFO in stores, and shelf life management for foam, adhesives, and rubber parts.',
    procedures:["Preservation and Packaging Procedure (IATF supplemental)"],
    docs:["Packaging design records (dunnage, VCI bags, foam protection)", "Customer-approved packaging specification", "FIFO implementation records in stores (first-in first-out labels)", "Shelf life management: expiry dates tracked for foam, adhesives, rubber parts", "Product preservation during storage: covered, labelled, no floor contact", "Handling records to prevent damage (lifting equipment, conveyor specs)"],
    processOwner:'Warehouse/Stores, Production, QA, Logistics' },
  { id:'cl8_5_5_1', clause:'8.5.5.1', title:'Feedback from Service / Field (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Warranty and field failure data must be formally collected, analyzed, and fed back into FMEA and product/process design to prevent recurrence.',
    procedures:["Field Feedback / Warranty Analysis Procedure"],
    docs:["Warranty claim records with 8D analysis per failure mode", "Field failure analysis reports (returned parts analyzed in lab)", "Feedback loop: warranty → FMEA update → Control Plan update → WI update", "Trend analysis of field failures (monthly chart)", "NTF (No Trouble Found) analysis records"],
    processOwner:'QA, Design/Engineering, Customer Service' },
  { id:'cl8_5_5_2', clause:'8.5.5.2', title:'Service Agreement with Customer (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: If a service/warranty agreement exists with the customer, it must be formally documented with defined terms, warranty period, and service parts plan.',
    procedures:["Warranty Agreement Management Procedure"],
    docs:["Service/warranty agreement document (with TML/TMBSL)", "Warranty terms: period, coverage, response time", "Service parts availability plan", "Service parts PPAP records", "Warranty cost reporting"],
    processOwner:'QA, Customer Service, Top Management' },
  { id:'cl8_5_6_1', clause:'8.5.6.1', title:'Control of Changes — Supplemental (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All product and process changes must be communicated to and approved by the customer before implementation. Re-PPAP required for significant changes. Safety changes need special approval.',
    procedures:["Change Control Procedure (IATF supplemental)"],
    docs:["Customer approval records before change implementation", "Re-PPAP / re-PSW records where required", "Safety impact assessment for changes affecting safety characteristics", "Change impact on sub-tier suppliers documented", "PPAP re-submission evidence", "Customer change approval through portal (TML SRM)"],
    processOwner:'QA, Design/Engineering, Production' },
  { id:'cl8_5_6_1_1', clause:'8.5.6.1.1', title:'Temporary Change of Process Controls (IATF — SI-11)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: When the primary control method (error-proofer, SPC gauge, automated check) is temporarily unavailable, there must be an approved alternate control method. These alternate methods must be documented and customer-approved where required.',
    procedures:["Alternate Control Method / Temporary Change Procedure (MANDATORY)"],
    docs:["List of approved alternate control methods per process (document-controlled)", "Customer approval for temporary controls (where required)", "Temporary control identification: product tagged/red-labelled during temporary control period", "Restart verification records when primary control is restored", "Temporary control duration and scope records", "Auditor check: what happens when the weld inspection gauge breaks? What is the approved backup?"],
    processOwner:'QA, Production, ME' },
  { id:'cl8_6_2', clause:'8.6.2', title:'Layout Inspection and Functional Testing (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Complete dimensional layout (all drawing dimensions) and functional testing must be performed at defined frequency. This is separate from routine production inspection.',
    procedures:["Layout Inspection Procedure", "Functional Testing Procedure"],
    docs:["Layout inspection plan (frequency per Control Plan — typically annual or at PPAP)", "Completed layout inspection report: all dimensions checked against drawing", "Functional test records: recliner mechanism, track operation, headrest, armrest, EOL electrical check", "H-point measurement record (seat reference point for occupant packaging)", "CMM or gauge-based inspection results", "Customer-witnessed inspection records (if required)"],
    processOwner:'QA, Production' },
  { id:'cl8_6_3', clause:'8.6.3', title:'Appearance Items (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: If appearance is a customer requirement (fabric colour, grain, gloss, trim finish), appearance inspection standards must be documented with master samples and approved by the customer.',
    procedures:["Appearance Inspection Procedure"],
    docs:["Appearance Approval Report (AAR) from customer", "Master samples for fabric colour, grain, texture, trim", "Visual inspection standards at EOL", "Master sample review/renewal records (typically every 2 years)", "Light booth / controlled lighting conditions for inspection"],
    processOwner:'QA, Production' },
  { id:'cl8_6_4', clause:'8.6.4', title:'Verification of Externally Provided Products (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Incoming materials from suppliers must be inspected before use in production. Inspection criteria must be linked to material certificates and drawings.',
    procedures:["Incoming Inspection Procedure"],
    docs:["Incoming inspection plan per part/supplier (inspection criteria, sample size, frequency)", "Incoming inspection records per lot", "Supplier material certificates / CoC (Certificate of Conformance) review records", "Skip-lot / sampling plan based on SPPM history", "Rejected incoming material records and supplier 8D", "Auditor check: are foam density certificates checked against spec before production?"],
    processOwner:'QA, Warehouse/Stores' },
  { id:'cl8_6_5', clause:'8.6.5', title:'Statutory and Regulatory Conformity (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All applicable statutory and regulatory requirements must be identified and product conformance must be evidenced before product release.',
    procedures:["Regulatory Compliance Management Procedure"],
    docs:["Regulatory requirements list: AIS 023, ECE R17, ECE R25, FMVSS 302, IS 15061, CMVR, BIS", "Compliance test reports for each regulation", "Type approval / homologation certificates (ARAI, ICAT, VRDE)", "Regulatory compliance matrix (regulation vs. test report no.)", "Annual review of regulatory changes", "Customer notification of regulatory compliance status"],
    processOwner:'QA, Design/Engineering, Top Management' },
  { id:'cl8_6_6', clause:'8.6.6', title:'Acceptance Criteria (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Clear, documented acceptance criteria must exist at every inspection point. Criteria must be customer-approved (reflected in PPAP/PSW).',
    procedures:["Acceptance Criteria Definition Procedure"],
    docs:["Acceptance criteria at all inspection points (incoming, in-process, EOL, layout)", "Criteria linked to drawings, specifications, visual standards", "PPAP PSW as evidence of customer-approved acceptance criteria", "Go/No-Go gauge limits defined and documented", "EOL test pass/fail criteria at each test station"],
    processOwner:'QA, Production' },
  { id:'cl8_7_1_1', clause:'8.7.1.1', title:'Customer Authorization for Concession (IATF — SI-09)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: No nonconforming product should be shipped to the customer without written customer authorization (concession/waiver). Concessions must have defined quantity, duration, and permanent fix plan.',
    procedures:["Concession/Waiver Management Procedure"],
    docs:["Concession request form submitted to customer", "Customer written approval records for each concession", "Concession register: quantity, duration, characteristic, permanent fix plan", "Product marked with concession reference", "Expiry tracking — no shipping beyond approved quantity/date", "Permanent corrective action records", "Auditor check: any product shipped on concession without customer approval = MAJOR NC"],
    processOwner:'QA, Top Management' },
  { id:'cl8_7_1_3', clause:'8.7.1.3', title:'Control of Suspect Product (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All suspect product must be immediately identified, segregated in a dedicated quarantine area, and dispositioned. Traceability must confirm if any suspect product was already shipped.',
    procedures:["Suspect Product Control Procedure"],
    docs:["Quarantine / red-tag area on production floor", "Suspect product register with batch/lot details", "Disposition records for all suspect lots", "FIFO traceability check: was suspect product shipped to customer?", "Customer notification if suspect product was shipped", "Segregation evidence (locked area, QA hold sticker)"],
    processOwner:'QA, Production, Warehouse' },
  { id:'cl8_7_1_4', clause:'8.7.1.4', title:'Control of Reworked Product (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: All rework must be performed per a documented, approved Rework ODS/WI. A Rework PFMEA is required. All rework must be re-inspected before release. Rework must be trended and reported.',
    procedures:["Rework Control Procedure (MANDATORY)"],
    docs:["Rework ODS (Operation Data Sheet) per rework type (approved, dated)", "Rework PFMEA (analyzing risks of rework operations)", "Rework log (daily/weekly) with part no., defect, quantity, disposition", "Rework trend chart (monthly, by defect type)", "Re-inspection records for all reworked product (100% inspection required)", "Rework area identified and segregated from normal production", "Operator OJT records for rework operations"],
    processOwner:'Production, QA' },
  { id:'cl8_7_1_5', clause:'8.7.1.5', title:'Control of Repaired Product (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Repair (returning product to original specification after assembly) requires customer authorization. Must be distinguished from rework.',
    procedures:["Repair Control Procedure"],
    docs:["Customer authorization for repair (written approval)", "Repair procedure (approved SOP)", "Repair records with inspector sign-off", "Re-test records for repaired product", "Repair log and trend monitoring"],
    processOwner:'QA, Production' },
  { id:'cl8_7_1_6', clause:'8.7.1.6', title:'Customer Notification (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: If nonconforming product has been shipped to the customer, they must be immediately notified. Response timeline per customer CSR (typically 24 hours initial response for TML).',
    procedures:["Customer Notification Procedure (MANDATORY)"],
    docs:["Customer notification records (email, portal, 8D initial report)", "Response timeline records (initial within 24 hrs for TML)", "Containment action records at customer end", "Customer portal notification records (TML SRM, TMBSL)", "Field containment — 100% sorting records at customer", "Follow-up communication records"],
    processOwner:'QA, Top Management, Customer Service' },
  { id:'cl8_7_1_7', clause:'8.7.1.7', title:'Nonconforming Product Disposition (IATF)', standard:'IATF', group:'Operations',
    meaning:'AUTOMOTIVE: Every lot of nonconforming product must have a formal disposition decision: Use-as-is (with customer approval), Rework, Repair, Scrap, or Return to supplier. Records must be maintained.',
    procedures:["NC Product Disposition Procedure"],
    docs:["Disposition records per NC lot (who disposed, what decision, when)", "Use-as-is: customer approval mandatory", "Scrap records with irreversible destruction evidence", "Return-to-supplier records with supplier 8D requirement", "Disposition authority matrix (who can approve each type)", "Final verification records after disposition"],
    processOwner:'QA, Production' },
  { id:'cl9_1_1', clause:'9.1.1', title:'Monitoring, Measurement, Analysis and Evaluation', standard:'ISO', group:'Performance',
    meaning:'Define what needs to be monitored and measured, how to do it, when to analyse results, and how to report performance. Use data to drive decisions.',
    procedures:["KPI Monitoring and Measurement Procedure"],
    docs:["KPI dashboard: CPPM, RPPM, IPPM, SPPM, OEE, delivery performance, customer satisfaction", "Monthly trend charts (12-month minimum)", "Data analysis feeding into MRM", "KPI targets defined and reviewed", "Measurement plan per process"],
    processOwner:'QA, Production, Top Management, All HODs' },
  { id:'cl9_1_1_1', clause:'9.1.1.1', title:'Monitoring of Manufacturing Processes (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE CRITICAL: All CC/SC characteristics must be monitored using SPC. Cpk ≥ 1.67 for new/CC parts, Cpk ≥ 1.33 for ongoing production. SPC charts must be on the shop floor with Out-of-Control Action Plans (OCAP).',
    procedures:["SPC Implementation Procedure (MANDATORY)", "Reference: AIAG SPC 2nd Edition"],
    docs:["SPC charts for all CC/SC characteristics (Xbar-R, XmR, p-chart as applicable)", "Cp, Cpk values per characteristic (CC: Cpk ≥ 1.67 target; ongoing: Cpk ≥ 1.33)", "Ppk for new processes before Cpk established", "Out-of-Control Action Plan (OCAP) per SPC chart", "Evidence of reaction when out-of-control points occur", "SPC charts displayed on shop floor at relevant workstation", "SPC plan linked to Control Plan", "Auditor check: pick any CC characteristic SPC chart — are out-of-control points actioned?"],
    processOwner:'QA, Production' },
  { id:'cl9_1_1_2', clause:'9.1.1.2', title:'Identification of Statistical Tools (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: The organization must select appropriate statistical tools for each situation. Tool selection must be justified and documented.',
    procedures:["Statistical Tools Selection Procedure"],
    docs:["Statistical tool selection matrix (right tool for right situation)", "Tool selection rationale: SPC for continuous data, attribute charts for go/no-go, MSA for measurement systems, regression for cause-effect", "Evidence of correct tool application in quality studies", "CFT competency in tool selection"],
    processOwner:'QA, Design/Engineering' },
  { id:'cl9_1_1_3', clause:'9.1.1.3', title:'Application of Statistical Concepts (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: QEs and supervisors must understand and correctly apply statistical concepts. Training records required. Misapplication of SPC (e.g., over-adjustment) is a finding.',
    procedures:["Statistical Awareness Training Procedure"],
    docs:["Training records: SPC, Cpk, process capability for QEs and production supervisors", "Correct interpretation evidence: special vs. common cause, action on out-of-control only", "Statistical sampling plans used (AQL-based) if applicable", "Auditor check: can QE explain difference between Cp and Cpk? Can supervisor interpret SPC chart?"],
    processOwner:'QA, Production' },
  { id:'cl9_1_2', clause:'9.1.2', title:'Customer Satisfaction', standard:'ISO', group:'Performance',
    meaning:'Monitor customer perception of whether their requirements have been met. Collect and analyse customer feedback data regularly.',
    procedures:["Customer Satisfaction Monitoring Procedure"],
    docs:["Customer scorecard data (TML SRM portal, TMBSL)", "Customer satisfaction survey results and trend chart", "CPPM trend by customer", "Customer complaint trend", "Response plan when satisfaction falls below target"],
    processOwner:'QA, Top Management, Customer Service' },
  { id:'cl9_1_2_1', clause:'9.1.2.1', title:'Customer Satisfaction — Supplemental (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: Customer satisfaction must be monitored using ALL available data: OEM scorecards, warranty data, delivery performance, quality awards, demerits, and portal data.',
    procedures:["Customer Satisfaction Monitoring Procedure (IATF supplemental)"],
    docs:["Customer scorecard from ALL customers (TML SRM portal data downloaded monthly)", "Warranty trend data per customer", "Delivery performance per customer", "Quality awards or demerits received", "Action plan when customer satisfaction falls below target", "CPPM by customer and trend chart", "Customer audit results"],
    processOwner:'QA, Top Management, Customer Service' },
  { id:'cl9_1_3', clause:'9.1.3', title:'Analysis and Evaluation', standard:'ISO', group:'Performance',
    meaning:'Analyse data from monitoring and measurement to evaluate QMS performance, supplier performance, customer satisfaction, and improvement opportunities.',
    procedures:["Data Analysis and Reporting Procedure"],
    docs:["Trend analysis reports (quality, delivery, cost, customer satisfaction)", "Pareto analysis of top defects", "Root cause investigation records", "Benchmarking against targets and industry", "Analysis results presented at MRM", "COPQ (Cost of Poor Quality) analysis"],
    processOwner:'QA, Top Management, All HODs' },
  { id:'cl9_1_3_1', clause:'9.1.3.1', title:'Prioritization (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: Quality improvement resources must be focused on the highest-impact problems. Prioritization must be data-driven (Pareto, COPQ, risk).',
    procedures:["Prioritization Methodology Procedure"],
    docs:["Pareto analysis of top 3-5 quality problems", "COPQ analysis to prioritize by business impact", "Risk-based prioritization evidence", "Resource allocation records for priority issues", "Priority items on MRM agenda", "Evidence that low-priority issues are tracked but major issues get resources first"],
    processOwner:'QA, Top Management' },
  { id:'cl9_2_2_1', clause:'9.2.2.1', title:'Internal Audit Programme — Supplemental (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: Internal audit programme must cover 3 types: QMS System Audit, Manufacturing Process Audit, and Product Audit — all annually. High-risk processes must be audited more frequently. Previous NCs and poor-performing areas must be prioritized.',
    procedures:["Internal Audit Programme Procedure (MANDATORY)"],
    docs:["Annual internal audit programme: QMS system audit, manufacturing process audit, product audit", "Risk-based frequency (high-risk processes audited more frequently)", "All IATF 16949 clauses covered within the programme", "Schedule adjusted when performance deteriorates", "Previous NC areas re-audited for effectiveness", "Audit programme review and approval at MRM", "Auditor independence ensured"],
    processOwner:'MR, QA, Internal Auditors' },
  { id:'cl9_2_2_2', clause:'9.2.2.2', title:'QMS Audit (IATF — SI-14)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: All QMS processes must be audited against IATF 16949 requirements annually. Major NC areas from previous audits must be re-audited. 3-year audit history must show coverage of all clauses.',
    procedures:["QMS Audit Procedure (IATF supplemental)"],
    docs:["QMS audit plan: all IATF clauses covered (typically within 3 years, annually for critical)", "QMS audit reports with NC classification (major/minor/OFI)", "NC closure records with effectiveness verification", "3-year QMS audit summary (schedule adherence ≥ 100%)", "Follow-up audit records for major NC closure", "Customer NC areas prioritized in audit plan"],
    processOwner:'MR, QA, Internal Auditors' },
  { id:'cl9_2_2_3', clause:'9.2.2.3', title:'Manufacturing Process Audit (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: Manufacturing process audits must be conducted using a structured approach (VDA 6.3 or equivalent — turtle diagram method). All production processes must be covered annually.',
    procedures:["Manufacturing Process Audit Procedure"],
    docs:["Process audit schedule: all manufacturing processes (welding, foam, assembly, EOL, incoming inspection)", "Process audit methodology: VDA 6.3 turtle diagram (6M: Man, Machine, Material, Method, Measurement, Environment)", "Process audit reports with scoring and findings", "Process audit NC closure records", "Process audit results feeding into improvement plans", "VDA 6.3-trained auditor conducting audits"],
    processOwner:'QA, Production, ME' },
  { id:'cl9_2_2_4', clause:'9.2.2.4', title:'Product Audit (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: Product audits must be conducted at planned frequency, separate from process audits. Products must be evaluated against approved product specifications and customer requirements.',
    procedures:["Product Audit Procedure"],
    docs:["Product audit plan (frequency per Control Plan or annually minimum)", "Product audit criteria (drawing-based: dimensions, function, appearance, regulatory)", "Product audit records: dimensional, functional, visual inspection results", "Product audit findings and corrective actions raised", "Product audit scores and trend", "Seating-specific product audit: recliner test, track operation, foam height, cover stitch quality"],
    processOwner:'QA' },
  { id:'cl9_3_1_1', clause:'9.3.1.1', title:'Management Review — Supplemental (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: MRM must be conducted at least annually (quarterly recommended). It must be a genuine management review with all required inputs — not a rubber-stamp exercise. When customer targets are not met, an action plan is mandatory.',
    procedures:["Management Review Procedure (IATF supplemental)"],
    docs:["MRM schedule (min. annual, quarterly recommended)", "MRM minutes showing top management active participation", "All 18 IATF inputs addressed in MRM agenda", "Action items with owners and due dates", "Follow-up on previous MRM actions", "Evidence of interim review when customer targets not met"],
    processOwner:'Top Management, MR, All HODs' },
  { id:'cl9_3_2', clause:'9.3.2', title:'Management Review Inputs', standard:'ISO', group:'Performance',
    meaning:'Management review must be fed with data and information covering: customer satisfaction, quality KPIs, audit results, process performance, risks, supplier performance, and improvement opportunities.',
    procedures:["Management Review Input Preparation Procedure"],
    docs:["Customer satisfaction data (scorecard, complaint trend, CPPM)", "QMS audit results", "Process performance and KPI data", "Risk and opportunity register status", "Supplier performance (SPPM, supplier audit results)", "Quality objectives status", "Corrective action status", "MRM input package (data prepared by QA before meeting)"],
    processOwner:'QA, All HODs, Top Management' },
  { id:'cl9_3_2_1', clause:'9.3.2.1', title:'MRM Inputs — Supplemental (IATF — SI-13, SI-16)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: IATF requires specific additional inputs beyond ISO 9001 — including COPQ (Cost of Poor Quality), warranty trends, field failures, customer satisfaction performance per customer, and a formal action plan when targets are not met.',
    procedures:["MRM Input Procedure (IATF supplemental)"],
    docs:["COPQ report (internal + external: scrap, rework, warranty, field returns cost)", "Warranty and field failure trend analysis (by failure mode, by customer)", "Customer satisfaction performance per customer (TML, TMBSL separately)", "Manufacturing process performance (Cpk, OEE, scrap trends)", "Action plan (Cl. 9.3.3.1) when customer KPI targets not met", "Effectiveness of actions from previous MRM", "All 18 IATF mandatory MRM inputs documented"],
    processOwner:'Top Management, QA, MR, All HODs' },
  { id:'cl9_3_3_1', clause:'9.3.3.1', title:'MRM Outputs — Supplemental (IATF)', standard:'IATF', group:'Performance',
    meaning:'AUTOMOTIVE: When customer performance targets are not met, a formal action plan must be created as an output of MRM — with specific actions, owners, resources, and timelines.',
    procedures:["MRM Action Plan Procedure"],
    docs:["Formal action plan output from MRM when CPPM/RPPM targets not met", "Action items with owners, due dates, resource allocation", "Escalation evidence (top management commitment)", "Next MRM agenda includes follow-up on previous action items", "MRM output: updated quality objectives if needed"],
    processOwner:'Top Management, QA, MR' },
  { id:'cl10_2_1', clause:'10.2.1', title:'Nonconformity and Corrective Action', standard:'ISO', group:'Improvement',
    meaning:'When any nonconformity occurs (customer complaint, internal failure, audit NC), react quickly: contain the problem, investigate root cause, take corrective action, and verify effectiveness.',
    procedures:["Corrective Action Procedure", "8D Problem Solving Procedure"],
    docs:["Corrective action log / register (all open and closed CAs)", "8D reports for all significant NCs", "Root cause analysis records (5-Why, Fishbone/Ishikawa)", "Containment action records", "CA effectiveness verification records", "CA closure evidence", "CA status at MRM"],
    processOwner:'QA, Production, All HODs' },
  { id:'cl10_2_3', clause:'10.2.3', title:'Problem Solving (IATF — SI-20)', standard:'IATF', group:'Improvement',
    meaning:'AUTOMOTIVE CRITICAL: A documented problem-solving process (8D mandatory for customer complaints) must be implemented. Root cause must be verified. Actions must be standardized (D7) — WI/CP/FMEA updated. Effectiveness must be verified.',
    procedures:["8D Problem Solving Procedure (MANDATORY)", "Reference: AIAG 8D methodology"],
    docs:["8D reports covering all 8 disciplines:", "D1: Team formation", "D2: Problem description (IS/IS-NOT analysis)", "D3: Containment actions (immediate)", "D4: Root cause analysis (5-Why, Fishbone)", "D5: Corrective action selection", "D6: Corrective action implementation", "D7: Prevent recurrence — WI/Control Plan/PFMEA updated (CRITICAL — auditors check this)", "D8: Team recognition", "8D for CPPM, RPPM, SPPM, warranty, audit NCs", "Response timeline: initial response 24 hrs (TML CSR)", "Effectiveness verification records after D6", "Auditor check: for last 3 customer complaints — is D7 done? Are WI and CP updated?"],
    processOwner:'QA (Lead), Production, Design/Engineering, ME' },
  { id:'cl10_2_4', clause:'10.2.4', title:'Error-Proofing (IATF)', standard:'IATF', group:'Improvement',
    meaning:'AUTOMOTIVE CRITICAL: Error-proofing (poka-yoke) devices must be implemented especially for CC/SC characteristics. Every error-proofer must be tested at each shift start. There must be a defined reaction when the poka-yoke fails.',
    procedures:["Error-Proofing Implementation Procedure (MANDATORY)"],
    docs:["Error-proofing register: device, location, characteristic controlled, test frequency, last test result", "Shift-start poka-yoke challenge test records (daily records)", "Error-proofing verification procedure", "Reaction plan when error-proofing device fails (temporary alternate control)", "PFMEA showing detection score reduction where error-proofing is installed", "Seating examples: torque audit tool, recliner locking check fixture, weld inspection system", "Auditor check: visit assembly line — are poka-yoke challenge records posted? What happens when it fails?"],
    processOwner:'QA, Production, ME' },
  { id:'cl10_2_5', clause:'10.2.5', title:'Warranty Management System (IATF)', standard:'IATF', group:'Improvement',
    meaning:'AUTOMOTIVE: Formal warranty management system required. All warranty claims must be tracked, analyzed by failure mode, trended, and root causes eliminated through 8D. NTF (No Trouble Found) must also be managed.',
    procedures:["Warranty Management Procedure (MANDATORY)"],
    docs:["Warranty claim register (all claims: date, part, failure mode, customer, analysis status)", "Warranty trend chart (monthly: by failure mode, by customer, by part)", "8D report per warranty failure type", "NTF (No Trouble Found) analysis process and records", "Warranty cost per month (COPQ input)", "Warranty reduction action plan", "Auditor check: what is warranty trend for last 12 months? Is it improving?"],
    processOwner:'QA, Design/Engineering, Customer Service' },
  { id:'cl10_2_6', clause:'10.2.6', title:'Customer Complaints and Field Failure Test Analysis (IATF)', standard:'IATF', group:'Improvement',
    meaning:'AUTOMOTIVE: All customer complaints must be analyzed. Returned field parts must be physically tested in the lab. Failure modes must be classified and root causes eliminated. Lessons learned must be fed back to design.',
    procedures:["Customer Complaint and Field Failure Analysis Procedure"],
    docs:["Customer complaint log (TML SRM portal, TMBSL, direct)", "Field failure analysis reports (returned parts physically examined in lab)", "8D report per complaint type", "Failure mode classification: manufacturing defect, design issue, assembly error, material failure", "Chronic/repeat complaint trend analysis", "Lessons learned database updated from field failures", "Feedback to FMEA and product/process design", "Response timeline compliance (initial: 24 hrs, complete 8D: per CSR)"],
    processOwner:'QA (Lead), Design/Engineering, Lab' },
  { id:'cl10_3_1', clause:'10.3.1', title:'Continual Improvement — Supplemental (IATF)', standard:'IATF', group:'Improvement',
    meaning:'AUTOMOTIVE: Continual improvement must be planned, structured, and results-measured. An annual manufacturing process improvement plan with specific targets is required. APQP, Kaizen, Six Sigma, VAVE are expected tools.',
    procedures:["Continual Improvement Procedure (MANDATORY)", "Kaizen / CI Programme Procedure"],
    docs:["Documented CI process", "Annual manufacturing process improvement plan (specific targets: Cpk improvement, scrap reduction, OEE increase)", "CI projects register: Kaizen, Six Sigma, VAVE projects with savings", "CI metrics: year-on-year improvement in CPPM, RPPM, OEE, scrap rate", "CI results presented at MRM", "APQP used as CI vehicle for new programs", "Benchmarking against industry/plant history", "Auditor check: what % improvement was achieved last year in CPPM and RPPM?"],
    processOwner:'Top Management, QA, Production, ME, All HODs' },
];

// -----------------------------------------------------------------------------
// SANCTIONED INTERPRETATIONS — All 30 SIs (including Nov 2025: SI-23 Rev, SI-27 to SI-30)
// Source: IATF 16949 SI document — November 2025 edition (29 pages)
// -----------------------------------------------------------------------------
interface SINote {
  si: string;           // e.g. "SI-03"
  effective: string;    // effective date
  impact: string;       // what changed / auditor focus
  newDocs?: string[];   // additional documents/records now required
  isNew?: boolean;      // true = new in Nov 2025 release
  isRevised?: boolean;  // true = revised in Nov 2025
}

const SI_NOTES: Record<string, SINote[]> = {
  // -- Clause 4 --------------------------------------------------------------
  'cl4_4_1_1': [{
    si: 'SI-23 (Revised Nov 2025)', effective: 'Nov 2025', isNew: false, isRevised: true,
    impact: 'Now explicitly requires conformance to MATERIAL REGULATORY REQUIREMENTS (e.g., REACH, RoHS, conflict minerals). "Replacement service parts" added in scope. Auditors will look for material compliance evidence linked to your supply chain.',
    newDocs: ['Material Regulatory Compliance Register (REACH / RoHS / conflict minerals)', 'Supplier Material Declaration (IMDs / MDSs)', 'Regulatory compliance evidence for replacement/service parts'],
  }],
  'cl4_4_1_2': [{
    si: 'SI-02 (Oct 2017)', effective: 'Oct 2017', isNew: false, isRevised: false,
    impact: 'Special approval for safety-related documents must be performed by the customer function responsible for approving such documents — not just internal approval. Auditors check if customer approval exists for safety-related documents and design records.',
    newDocs: ['Customer special approval records for safety-related documents', 'Safety document approval matrix (internal + customer sign-off)'],
  }],
  // -- Clause 5 --------------------------------------------------------------
  'cl5_1_1_2': [{
    si: 'SI-12 (Jun 2018)', effective: 'Jul 2018', isNew: false, isRevised: false,
    impact: 'Not every process requires an efficiency measure. Management determines WHICH processes need efficiency measures. Problem-solving processes must have effectiveness review conducted by management. Results must be input to Management Review.',
    newDocs: ['Process efficiency measurement register (processes selected by management)', 'Problem-solving effectiveness review records at management level'],
  }],
  // -- Clause 6 --------------------------------------------------------------
  'cl6_1_2_1': [{
    si: 'SI-21 (Jul 2021)', effective: 'Nov 2021', isNew: false, isRevised: false,
    impact: 'Risk analysis must now include CYBER-ATTACK THREATS to IT systems — in addition to lessons learned from recalls, audits, warranty. Documented information of risk analysis results is required as a record.',
    newDocs: ['Cybersecurity Risk Assessment (IT systems, MES, PLCs, OT networks)', 'Documented risk analysis results (retained as evidence)', 'Cyber threat register'],
  }],
  'cl6_1_2_3': [
    {
      si: 'SI-03 (Revised Jul 2021 + Nov 2025 aligned)', effective: 'Nov 2021', isNew: false, isRevised: true,
      impact: 'Contingency plans must now explicitly address: CYBERSECURITY (cyber-attacks, ransomware), PANDEMICS, labour shortages, infrastructure disruptions. Must periodically TEST contingency plans (e.g. simulation). Annual multidisciplinary review required. Employee training/awareness now mandatory element.',
      newDocs: [
        'Updated Contingency Plan (including cybersecurity scenario)',
        'Contingency plan test records (annual simulation evidence)',
        'Cybersecurity contingency test report (internal or subcontracted)',
        'Employee cyber-attack awareness training records',
        'Customer notification process for supply disruptions',
        'Contingency plan revision log (with authorizing person)',
      ],
    },
  ],
  // -- Clause 7 --------------------------------------------------------------
  'cl7_1_3_1': [{
    si: 'SI-18 (Oct 2019)', effective: 'Jan 2020', isNew: false, isRevised: false,
    impact: 'Plant facility and equipment planning must now include CYBER PROTECTION of equipment and systems supporting manufacturing (CNC machines, robots, PLCs, MES). This is not just IT — it is OT (Operational Technology) cybersecurity.',
    newDocs: ['OT/manufacturing cybersecurity protection plan', 'Equipment cyber-protection assessment', 'Manufacturing network segmentation records'],
  }],
  'cl7_1_5_3_2': [{
    si: 'SI-10 (Revised multiple times, last Apr 2021)', effective: 'Jun 2021', isNew: false, isRevised: false,
    impact: 'External labs must be ISO/IEC 17025 accredited (ILAC MRA signatory). Non-accredited labs may ONLY be used when accredited lab is not available (specialist equipment, parameters with no traceable standard, OEM equipment). Self-calibration of equipment by embedded software does NOT meet calibration requirements. Customer evidence of acceptability required.',
    newDocs: [
      'External lab ISO 17025 accreditation certificate (current, in-scope services)',
      'Lab scope verification (services match IATF requirements)',
      'For non-accredited labs: justification record + 7.1.5.3.1 evidence',
      'Customer acceptance evidence for non-standard labs',
      'No self-calibration reliance without separate calibration certificate',
    ],
  }],
  'cl7_2_1': [{
    si: 'SI-22 (Jul 2021)', effective: 'Nov 2021', isNew: false, isRevised: false,
    impact: 'Training and awareness must now include CYBERSECURITY AWARENESS — employees must be able to recognise symptoms of pending equipment failure AND attempted cyber-attacks. Risk reduction through employee knowledge is now an explicit requirement.',
    newDocs: ['Cybersecurity awareness training records (for all relevant personnel)', 'Training content covering: recognising cyber-attack symptoms + equipment failure signs', 'Training effectiveness evaluation (cyber-awareness)'],
  }],
  'cl7_2_3': [{
    si: 'SI-04 (Revised Aug 2020)', effective: 'Sep 2020', isNew: false, isRevised: false,
    impact: 'Distinguishes THREE types of internal auditors with SEPARATE competency requirements: (1) QMS auditors, (2) Manufacturing Process auditors (must understand relevant process + PFMEA + Control Plan), (3) Product auditors (must understand product requirements + measurement equipment). Trainer competency must be documented if training is provided internally.',
    newDocs: [
      'Auditor qualification records — separated by type (QMS / Process / Product)',
      'Manufacturing process auditor: evidence of process knowledge + PFMEA/CP understanding',
      'Product auditor: evidence of product requirements knowledge + measurement competency',
      'Internal trainer competency records (if training is provided by own personnel)',
      'List of qualified internal auditors (maintained, current)',
    ],
  }],
  'cl7_5_1_1': [{
    si: 'SI-05 (Oct 2017)', effective: 'Oct 2017', isNew: false, isRevised: false,
    impact: 'Quality Manual must contain CSR (Customer-Specific Requirements) address matrix — showing WHERE in the QMS each CSR is addressed. A matrix is NOT mandatory format — a table, list, or cross-reference is acceptable. Auditors will check: (a) is CSR mapping documented? (b) does it cover all customer CSRs?',
    newDocs: ['Quality Manual with CSR matrix/cross-reference table', 'CSR-to-QMS mapping document (showing where each CSR is addressed)'],
  }],
  // -- Clause 8 --------------------------------------------------------------
  'cl8_3_3_3': [{
    si: 'SI-06 (Oct 2017)', effective: 'Oct 2017', isNew: false, isRevised: false,
    impact: 'Special characteristics must be documented in: (1) product/manufacturing drawings, (2) PFMEA, (3) Control Plans, AND (4) work instructions/standard work. Same marking symbol must flow through all four documents. Auditors do a traceability check across all four.',
    newDocs: ['Special characteristics traceability matrix (drawing → PFMEA → CP → WI)', 'All documents using consistent SC/CC symbols (customer-approved symbols)'],
  }],
  'cl8_3_5_1': [{
    si: 'SI-30 (NEW Nov 2025)', effective: 'Nov 2025', isNew: true, isRevised: false,
    impact: 'NEW SI — Design and development outputs must now explicitly include: 3D models / technical data packages, GD&T (2D drawings), product design review results, service diagnostic guidelines, REPLACEMENT SERVICE PART requirements, and packaging/labeling for shipping. Interim design outputs must document engineering trade-offs.',
    newDocs: [
      '3D models / technical data package (released)',
      'GD&T drawings (2D) with product manufacturing information',
      'Product design review results (documented)',
      'Service diagnostic guidelines and repair instructions',
      'Replacement service part requirements (documented)',
      'Packaging and labeling requirements for shipping',
      'Trade-off analysis for interim design outputs',
    ],
  }],
  'cl8_4_2_1': [{
    si: 'SI-07 (Oct 2017)', effective: 'Oct 2017', isNew: false, isRevised: false,
    impact: '"Pass-through" characteristics — where materials/components pass through the organization\'s QMS without validation or controls — the organization must ensure APPROPRIATE CONTROLS at the point of manufacture (at the supplier). Supplier PPAP or second-party audit evidence required for pass-through items.',
    newDocs: ['Pass-through characteristics register', 'Evidence of controls at supplier for pass-through items', 'Supplier PPAP for pass-through characteristics'],
  }],
  'cl8_4_2_3': [{
    si: 'SI-08 (Revised Oct 2020)', effective: 'Sep 2020', isNew: false, isRevised: false,
    impact: 'Supplier QMS development has a DEFINED PROGRESSION: (a) ISO 9001 compliance via 2nd party → (b) ISO 9001 3rd party cert → (c) ISO 9001 + MAQMSR/CSR compliance → (d) IATF 16949 via 2nd party → (e) IATF 16949 3rd party cert. Not all suppliers need IATF — use RISK-BASED model. Non-eligible suppliers (scrap/logistics) are excluded.',
    newDocs: ['Supplier QMS development progression register (per supplier)', 'Risk-based supplier QMS target level documentation', 'Minimum and target QMS level defined per supplier category'],
  }],
  'cl8_4_2_4': [{
    si: 'SI-19 (Aug 2020)', effective: 'Oct 2020', isNew: false, isRevised: false,
    impact: 'Supplier monitoring KPIs now MANDATORY: (a) delivered product conformity, (b) customer disruptions at receiving plant (yard holds/stop ships), (c) delivery schedule performance, (d) number of occurrences of PREMIUM FREIGHT from supplier. Premium freight occurrences must be tracked separately from internal premium freight.',
    newDocs: ['Supplier scorecard with 4 mandatory KPIs (conformity, disruptions, delivery, premium freight)', 'Premium freight occurrence log per supplier'],
  }],
  'cl8_5_6_1_1': [{
    si: 'SI-11 (Apr 2018)', effective: 'Jun 2018', isNew: false, isRevised: false,
    impact: 'List of process controls must include: (1) primary process control AND (2) approved back-up/alternate methods IF they exist. NOT every control needs a backup — but if a backup exists, it must be on the list. Auditors check: "Does your temporary change list cover all primary controls? Are backups documented?"',
    newDocs: ['Process control list with primary + approved backup/alternate methods', 'Temporary change authorization records with backup method identified'],
  }],
  'cl8_7_1_1': [{
    si: 'SI-09 (Oct 2017)', effective: 'Oct 2017', isNew: false, isRevised: false,
    impact: 'Customer concession/deviation permit required BEFORE further processing when product or process differs from approved. Customer authorization needed for "use as is" AND rework/repair dispositions. Sub-component reuse must be clearly communicated to customer in the concession permit.',
    newDocs: ['Customer concession/deviation permits (before further processing)', 'Authorization record for "use as is" and rework dispositions', 'Sub-component reuse communication to customer (in concession permit)'],
  }],
  // -- Clause 9 --------------------------------------------------------------
  'cl9_2_2_2': [{
    si: 'SI-14 (Nov 2018)', effective: 'Jan 2019', isNew: false, isRevised: false,
    impact: 'THREE-YEAR audit cycle must audit ALL QMS processes at least once. Individual process audit frequency is risk-based but must be JUSTIFIED and documented. All processes must be sampled throughout the 3-year cycle — NOT just annual rotation of a few. Customer-specific QMS requirements must be sampled in EVERY audit cycle.',
    newDocs: ['Audit frequency justification per process (risk-based rationale)', '3-year audit programme showing all processes covered', 'CSR sampling evidence within each 3-year cycle'],
  }],
  'cl9_3_2_1': [
    {
      si: 'SI-13 (Jun 2018)', effective: 'Jul 2018', isNew: false, isRevised: false,
      impact: 'MRM mandatory inputs now include: COST OF POOR QUALITY (internal + external NC costs), process efficiency measures (for realization processes), feasibility assessments for changes/new facilities, warranty performance, customer scorecard review, potential field failures from FMEA, actual field failures + safety/environment impact.',
      newDocs: ['COPQ (Cost of Poor Quality) report for MRM input', 'Process efficiency measurement results (realization processes)', 'Customer scorecard review at MRM', 'Warranty performance report at MRM', 'Field failure impact on safety/environment — MRM presentation'],
    },
    {
      si: 'SI-16 (Oct 2019)', effective: 'Jan 2020', isNew: false, isRevised: false,
      impact: 'Additional MRM input (from 8.3.4.1): SUMMARY RESULTS OF MEASUREMENTS at specified stages during product and process design and development — timing, costs, feasibility. This links D&D monitoring results directly to MRM.',
      newDocs: ['D&D measurement summary at MRM (timing, cost, feasibility results from design stages)'],
    },
  ],
  // -- Clause 10 -------------------------------------------------------------
  'cl10_2_3': [{
    si: 'SI-20 (Dec 2020)', effective: 'Jan 2021', isNew: false, isRevised: false,
    impact: 'Problem-solving process must explicitly PREVENT RECURRENCE — this is now a requirement, not an option. Must cover: (a) defined approaches by problem type/scale, (b) containment/interim actions, (c) root cause analysis methodology, (d) SYSTEMIC corrective actions (impact on similar processes/products), (e) effectiveness VERIFICATION, (f) update PFMEA and Control Plan. Customer-prescribed tools (8D, A3, etc.) must be used when specified.',
    newDocs: [
      'Problem-solving procedure with prevention-of-recurrence requirement documented',
      'Effectiveness verification records (per corrective action)',
      'PFMEA updated from corrective action (evidence)',
      'Control Plan updated from corrective action (evidence)',
      'Systemic action evidence (impact on similar processes/products assessed)',
    ],
  }],
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { value: 'available' as DocStatus, label: '✅ Available', color: 'text-green-300',  bg: 'bg-green-900/30 border-green-300',  pts: 2 },
  { value: 'partial'   as DocStatus, label: '⚠️ Partial',   color: 'text-yellow-300', bg: 'bg-yellow-900/30 border-yellow-300', pts: 1 },
  { value: 'missing'  as DocStatus, label: '❌ Missing',   color: 'text-red-700',    bg: 'bg-red-50 border-red-300',    pts: 0 },
  { value: 'na'       as DocStatus, label: '— N/A',        color: 'text-[#1e3a5f]',   bg: 'bg-[#eff6ff] border-[#dbeafe]',  pts: 0 },
] as const;

const GROUP_COLORS: Record<string, string> = {
  Context:     'bg-blue-100 text-blue-200 border-blue-600/50',
  Leadership:  'bg-purple-100 text-purple-200 border-purple-300',
  Planning:    'bg-indigo-100 text-indigo-200 border-indigo-300',
  Support:     'bg-teal-100 text-teal-800 border-teal-300',
  Operations:  'bg-orange-100 text-orange-600 border-orange-300',
  Performance: 'bg-green-100 text-[#15803d] border-green-300',
  Improvement: 'bg-rose-100 text-rose-800 border-rose-300',
};

const GROUPS_ORDER: ClauseGroup[] = ['Context','Leadership','Planning','Support','Operations','Performance','Improvement'];

function scoreColor(pct: number) { return pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'; }
function scoreLabel(pct: number) { return pct >= 80 ? '✅ Ready' : pct >= 50 ? '⚠️ Gaps' : '🚨 NC Risk'; }

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------
export default function IatfAnalyserPage() {
  const [docStatus, setDocStatus] = useState<Record<string, Record<string, DocStatus>>>({});
  const [remarks, setRemarks]     = useState<Record<string, string>>({});
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [search, setSearch]       = useState('');
  const [filterGroup, setFilterGroup]   = useState<'ALL' | ClauseGroup>('ALL');
  const [filterStd, setFilterStd]       = useState<'ALL' | 'ISO' | 'IATF'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'gap' | 'ok' | 'si' | 'sinew'>('ALL');
  const [activeTab, setActiveTab] = useState<'analyser' | 'scorecard' | 'guide'>('analyser');
  const [groupBy, setGroupBy]     = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem('qmos-iatf2-status'); if (s) setDocStatus(JSON.parse(s));
      const r = localStorage.getItem('qmos-iatf2-remarks'); if (r) setRemarks(JSON.parse(r));
    } catch {}
  }, []);

  function setDocSt(cid: string, did: string, val: DocStatus) {
    setDocStatus(prev => {
      const next = {...prev, [cid]: {...(prev[cid] ?? {}), [did]: val}};
      try { localStorage.setItem('qmos-iatf2-status', JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function setRemark(cid: string, val: string) {
    setRemarks(prev => {
      const next = {...prev, [cid]: val};
      try { localStorage.setItem('qmos-iatf2-remarks', JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // -- Scoring ----------------------------------------------------------------
  const clauseScores = useMemo(() => CLAUSES.map(c => {
    const st = docStatus[c.id] ?? {};
    const validDocs = c.docs.filter((_,i) => (st[`d${i}`] ?? 'missing') !== 'na');
    const earned = validDocs.reduce((s, _, i) => {
      const v = st[`d${i}`] ?? 'missing';
      return s + (STATUS_OPTIONS.find(o => o.value === v)?.pts ?? 0);
    }, 0);
    const max = validDocs.length * 2;
    const pct = max === 0 ? 100 : Math.round((earned / max) * 100);
    const missingCount = c.docs.filter((_,i) => (st[`d${i}`] ?? 'missing') === 'missing').length;
    return { id: c.id, earned, max, pct, missingCount };
  }), [docStatus]);

  const overall = useMemo(() => {
    const total  = clauseScores.reduce((s,c) => s + c.max, 0);
    const earned = clauseScores.reduce((s,c) => s + c.earned, 0);
    return total === 0 ? 0 : Math.round((earned / total) * 100);
  }, [clauseScores]);

  const ready = clauseScores.filter(c => c.pct >= 80).length;
  const gaps  = clauseScores.filter(c => c.pct >= 50 && c.pct < 80).length;
  const risks = clauseScores.filter(c => c.pct < 50).length;

  // -- Filter -----------------------------------------------------------------
  const filtered = useMemo(() => CLAUSES.filter(c => {
    if (filterGroup !== 'ALL' && c.group !== filterGroup) return false;
    if (filterStd   !== 'ALL' && c.standard !== filterStd) return false;
    if (filterStatus !== 'ALL') {
      const sc = clauseScores.find(x => x.id === c.id);
      if (filterStatus === 'gap' && sc && sc.pct >= 80) return false;
      if (filterStatus === 'ok'  && sc && sc.pct <  80) return false;
      if (filterStatus === 'si'  && !SI_NOTES[c.id]) return false;
      if (filterStatus === 'sinew' && !(SI_NOTES[c.id]?.some(s => s.isNew || s.isRevised))) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return c.clause.includes(q) || c.title.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q);
    }
    return true;
  }), [filterGroup, filterStd, filterStatus, search, clauseScores]);

  // Group by section
  const grouped = useMemo(() => {
    if (!groupBy) return null;
    const map: Record<string, ClauseDef[]> = {};
    GROUPS_ORDER.forEach(g => { map[g] = []; });
    filtered.forEach(c => { if (map[c.group]) map[c.group].push(c); });
    return map;
  }, [filtered, groupBy]);

  // Group scores
  const groupScores = useMemo(() => {
    const res: Record<string, {pct:number; total:number; ready:number; risk:number}> = {};
    GROUPS_ORDER.forEach(g => {
      const gClauses = CLAUSES.filter(c => c.group === g);
      const sc = gClauses.map(c => clauseScores.find(x => x.id === c.id)!).filter(Boolean);
      const tot = sc.reduce((s,c) => s+c.max, 0);
      const ear = sc.reduce((s,c) => s+c.earned, 0);
      res[g] = {
        pct: tot === 0 ? 0 : Math.round((ear/tot)*100),
        total: gClauses.length,
        ready: sc.filter(c => c.pct >= 80).length,
        risk: sc.filter(c => c.pct < 50).length,
      };
    });
    return res;
  }, [clauseScores]);

  function exportCSV() {
    const rows = ['Clause,Title,Standard,Clause Section,Document,Status,Points,Clause Score%,Remarks'];
    CLAUSES.forEach(c => {
      const sc = clauseScores.find(x => x.id === c.id);
      const st = docStatus[c.id] ?? {};
      c.docs.forEach((d,i) => {
        const val = st[`d${i}`] ?? 'missing';
        const pts = STATUS_OPTIONS.find(o => o.value === val)?.pts ?? 0;
        rows.push(`"${c.clause}","${c.title}","${c.standard}","${c.group}","${d}","${val}","${pts}","${sc?.pct ?? 0}%","${remarks[c.id]?.replace(/"/g,'\"')||''}"` );
      });
    });
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    a.download = `IATF_Analyser_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  function ClauseCard({ c }: { c: ClauseDef }) {
    const sc = clauseScores.find(x => x.id === c.id)!;
    const st = docStatus[c.id] ?? {};
    const isOpen = expanded.has(c.id);
    const siNotes = SI_NOTES[c.id] ?? [];
    const hasNewSI = siNotes.some(s => s.isNew);
    const hasRevisedSI = siNotes.some(s => s.isRevised);
    return (
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${hasNewSI ? 'border-orange-300' : siNotes.length > 0 ? 'border-amber-200' : 'border-[#dbeafe]'}`}>
        <button onClick={() => toggleExpand(c.id)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#eff6ff] transition-colors">
          <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-900/30 px-2 py-0.5 rounded shrink-0">{c.clause}</span>
            <span className="font-semibold text-[#1e3a5f] text-sm truncate">{c.title}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${c.standard === 'ISO' ? 'bg-[#eff6ff] text-[#1d4ed8] border-blue-700/50' : 'bg-purple-900/30 text-purple-700 border-purple-700/50'}`}>{c.standard}</span>
            {hasNewSI && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-300 shrink-0 animate-pulse">🆕 NEW SI Nov 2025</span>}
            {!hasNewSI && hasRevisedSI && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 shrink-0">♻️ REVISED SI Nov 2025</span>}
            {!hasNewSI && !hasRevisedSI && siNotes.length > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-900/30 text-yellow-300 border border-yellow-300 shrink-0">📌 SI-{siNotes.map(s=>s.si.split('-')[1]?.split(' ')[0]).join('/')}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sc.missingCount > 0 && <span className="hidden sm:inline text-[10px] text-red-600 font-bold">⚠️ {sc.missingCount} missing</span>}
            <div className="w-16 bg-white rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all" style={{width:`${sc.pct}%`, background: scoreColor(sc.pct)}} />
            </div>
            <span className="font-bold text-xs w-10 text-right" style={{color: scoreColor(sc.pct)}}>{sc.pct}%</span>
            <span className="text-[#1e3a5f] text-xs">{isOpen ? '▲' : '▼'}</span>
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-[#dbeafe] px-4 py-4 space-y-4">
            {/* Meaning */}
            <div className="bg-[#eff6ff] rounded-lg px-3 py-2 border border-blue-800/50">
              <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">📖 What This Means</div>
              <p className="text-sm text-[#1e3a5f] leading-relaxed">{c.meaning}</p>
            </div>

            {/* SI Notes */}
            {siNotes.length > 0 && (
              <div className="space-y-2">
                {siNotes.map((si, idx) => (
                  <div key={idx} className={`rounded-lg px-3 py-2.5 border ${si.isNew ? 'bg-orange-900/30 border-orange-300' : si.isRevised ? 'bg-amber-50 border-amber-300' : 'bg-yellow-900/30 border-yellow-700/50'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${si.isNew ? 'bg-orange-200 text-orange-600' : si.isRevised ? 'bg-amber-200 text-amber-800' : 'bg-yellow-200 text-yellow-200'}`}>
                        {si.isNew ? '🆕 NEW' : si.isRevised ? '♻️ REVISED' : '📌'} {si.si}
                      </span>
                      <span className="text-[10px] text-[#1e3a5f]">Effective: {si.effective}</span>
                    </div>
                    <p className="text-xs text-[#1e3a5f] leading-relaxed mb-1.5"><strong>Impact:</strong> {si.impact}</p>
                    {si.newDocs && si.newDocs.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-orange-600 uppercase mb-1">📋 Additional Documents/Records Required by this SI:</div>
                        <ul className="space-y-0.5">
                          {si.newDocs.map((d, i) => (
                            <li key={i} className="text-xs text-orange-600 flex items-start gap-1">
                              <span className="text-orange-500 shrink-0 mt-0.5">▸</span>{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Documents scoring table */}
            {c.docs.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-[#1e3a5f] uppercase mb-2">📄 Documents / Audit Evidence — Mark Availability</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#eff6ff] text-[10px] text-[#1e3a5f]">
                        <th className="text-left px-2 py-1.5 border border-[#dbeafe] w-6">#</th>
                        <th className="text-left px-2 py-1.5 border border-[#dbeafe]">Document / Evidence</th>
                        <th className="text-center px-2 py-1.5 border border-[#dbeafe] w-36">Status</th>
                        <th className="text-center px-2 py-1.5 border border-[#dbeafe] w-14">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.docs.map((d, i) => {
                        const key = `d${i}`;
                        const val = st[key] ?? 'missing';
                        const opt = STATUS_OPTIONS.find(o => o.value === val)!;
                        return (
                          <tr key={i} className={`border border-[#dbeafe] ${val==='available'?'bg-green-900/30/50':val==='partial'?'bg-yellow-900/30/50':val==='missing'?'bg-red-50/30':'bg-[#eff6ff]/40'}`}>
                            <td className="px-2 py-1.5 text-[#1e3a5f]">{i+1}</td>
                            <td className="px-2 py-1.5 text-[#1e3a5f]">{d}</td>
                            <td className="px-2 py-1.5 text-center">
                              <select value={val} onChange={e => setDocSt(c.id, key, e.target.value as DocStatus)}
                                className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 focus:outline-none ${opt.bg} ${opt.color}`}>
                                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1.5 text-center font-bold" style={{color: scoreColor(val==='na'?100:opt.pts>=2?100:opt.pts>=1?60:0)}}>
                              {val === 'na' ? '—' : `${opt.pts}/2`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-white">
                        <td colSpan={2} className="px-2 py-1 font-bold text-[#1e3a5f] border border-[#dbeafe] text-[10px]">Clause Score</td>
                        <td colSpan={2} className="px-2 py-1 text-center font-bold border border-[#dbeafe] text-xs" style={{color: scoreColor(sc.pct)}}>
                          {sc.earned}/{sc.max} pts = {sc.pct}% — {scoreLabel(sc.pct)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Procedures + Process Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {c.procedures.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">📋 Procedures / WI Required</div>
                  <ul className="space-y-0.5">
                    {c.procedures.map((p,i) => <li key={i} className="text-xs text-indigo-700 bg-indigo-900/30 rounded px-2 py-1 border border-indigo-100">▸ {p}</li>)}
                  </ul>
                </div>
              )}
              {c.processOwner && (
                <div>
                  <div className="text-[10px] font-bold text-teal-600 uppercase mb-1">👤 Process Owner / Applicable Process</div>
                  <div className="text-xs text-teal-700 bg-teal-50 rounded px-2 py-1.5 border border-teal-100 leading-relaxed">{c.processOwner}</div>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <div className="text-[10px] font-bold text-[#1e3a5f] uppercase mb-1">💬 Remarks / Action Notes</div>
              <textarea value={remarks[c.id] ?? ''} onChange={e => setRemark(c.id, e.target.value)}
                rows={2} placeholder="Action owner, target date, evidence location, gaps…"
                className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-amber-50" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* -- HEADER ----------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">📋 IATF 16949 AI Analyser</h1>
              <p className="text-indigo-700 text-sm mt-0.5">128 clauses · ISO 9001:2015 + IATF 16949:2016 · Document scoring · Audit readiness</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg">⬇ Export CSV</button>
              <button onClick={() => { if(confirm('Reset all scores?')) { setDocStatus({}); setRemarks({}); localStorage.removeItem('qmos-iatf2-status'); localStorage.removeItem('qmos-iatf2-remarks'); }}} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/20">↺ Reset</button>
            </div>
          </div>

          {/* Overall KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            {[
              { label: 'Overall Score',           value: `${overall}%`, color: overall >= 80 ? 'text-green-300' : overall >= 60 ? 'text-yellow-300' : 'text-red-600' },
              { label: '✅ Ready (≥80%)',          value: ready,  color: 'text-green-300' },
              { label: '⚠️ Gaps (50–79%)',        value: gaps,   color: 'text-yellow-300' },
              { label: '🚨 NC Risk (<50%)',        value: risks,  color: 'text-red-600' },
              { label: '📌 Clauses with SI',       value: Object.keys(SI_NOTES).length, color: 'text-amber-600' },
              { label: '🆕 New/Revised Nov 2025',  value: Object.values(SI_NOTES).flat().filter(s => s.isNew || s.isRevised).length, color: 'text-orange-600' },
            ].map(k => (
              <div key={k.label} className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-indigo-700 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all" style={{width:`${overall}%`}} />
          </div>

          {/* Section scores */}
          <div className="grid grid-cols-7 gap-1.5 mt-3">
            {GROUPS_ORDER.map(g => {
              const gs = groupScores[g];
              return (
                <div key={g} className="bg-white/5 rounded-lg px-2 py-1.5 text-center border border-white/10 cursor-pointer hover:bg-white/15 transition-colors"
                  onClick={() => setFilterGroup(filterGroup === g ? 'ALL' : g as ClauseGroup)}>
                  <div className="font-bold text-sm" style={{color: scoreColor(gs.pct)}}>{gs.pct}%</div>
                  <div className="text-[9px] text-indigo-700 mt-0.5 truncate">{g}</div>
                  <div className="text-[9px] text-white/50">{gs.total} clauses</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* -- TABS ------------------------------------------------------------- */}
      <div className="border-b border-[#dbeafe] bg-white px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {(['analyser', 'scorecard', 'guide'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 capitalize transition-colors ${activeTab === t ? 'border-indigo-600 text-indigo-300' : 'border-transparent text-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
              {t === 'analyser' ? '🔍 Clause Analyser' : t === 'scorecard' ? '📊 Score Summary' : '📚 Document Guide'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* ══ ANALYSER ═══════════════════════════════════════════════════════ */}
        {activeTab === 'analyser' && (<>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Search clause or keyword…" value={search} onChange={e => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value as typeof filterGroup)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="ALL">All Sections</option>
              {GROUPS_ORDER.map(g => <option key={g} value={g}>Cl.{['4','5','6','7','8','9','10'][GROUPS_ORDER.indexOf(g)]} {g}</option>)}
            </select>
            <select value={filterStd} onChange={e => setFilterStd(e.target.value as typeof filterStd)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="ALL">ISO + IATF</option>
              <option value="ISO">ISO 9001 Only</option>
              <option value="IATF">IATF Supplemental Only</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="ALL">All Status</option>
              <option value="gap">Gaps Only</option>
              <option value="ok">Ready Only</option>
              <option value="si">Has Sanctioned Interpretation</option>
              <option value="sinew">🆕 New/Revised SI (Nov 2025)</option>
            </select>
            <button onClick={() => setGroupBy(!groupBy)} className={`px-3 py-2 text-xs rounded-lg border ${groupBy ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-[#1e3a5f]'}`}>
              {groupBy ? 'Grouped View' : 'Flat View'}
            </button>
            <button onClick={() => setExpanded(new Set(CLAUSES.map(c => c.id)))} className="text-xs px-3 py-2 border rounded-lg hover:bg-[#eff6ff]">Expand All</button>
            <button onClick={() => setExpanded(new Set())} className="text-xs px-3 py-2 border rounded-lg hover:bg-[#eff6ff]">Collapse All</button>
          </div>

          <div className="text-xs text-[#1e3a5f] mb-3">{filtered.length} of {CLAUSES.length} clauses shown</div>

          {groupBy && grouped ? (
            GROUPS_ORDER.map(g => {
              const cs = grouped[g] ?? [];
              if (!cs.length) return null;
              const gs = groupScores[g];
              return (
                <div key={g} className="mb-6">
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-2 border ${GROUP_COLORS[g]}`}>
                    <span className="font-bold text-sm">Clause {['4','5','6','7','8','9','10'][GROUPS_ORDER.indexOf(g)]} — {g}</span>
                    <span className="text-xs">({cs.length} clauses)</span>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="w-24 bg-white/40 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{width:`${gs.pct}%`, background: scoreColor(gs.pct)}} />
                      </div>
                      <span className="font-bold text-sm" style={{color: scoreColor(gs.pct)}}>{gs.pct}%</span>
                    </div>
                  </div>
                  <div className="space-y-2 pl-2">
                    {cs.map(c => <ClauseCard key={c.id} c={c} />)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-2">
              {filtered.map(c => <ClauseCard key={c.id} c={c} />)}
            </div>
          )}
        </>)}

        {/* ══ SCORECARD ══════════════════════════════════════════════════════ */}
        {activeTab === 'scorecard' && (
          <div className="animate-fadeIn space-y-4">
            {/* Section summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {GROUPS_ORDER.map((g,i) => {
                const gs = groupScores[g];
                return (
                  <div key={g} className={`rounded-xl p-3 border ${GROUP_COLORS[g]}`}>
                    <div className="text-[10px] font-bold uppercase mb-1">Cl.{['4','5','6','7','8','9','10'][i]} {g}</div>
                    <div className="font-bold text-xl" style={{color: scoreColor(gs.pct)}}>{gs.pct}%</div>
                    <div className="text-[10px] mt-1">{gs.total} clauses</div>
                    <div className="w-full bg-white/40 rounded-full h-1 mt-1.5">
                      <div className="h-1 rounded-full" style={{width:`${gs.pct}%`, background: scoreColor(gs.pct)}} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full table */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#eff6ff] border-b border-[#dbeafe] flex justify-between">
                <span className="font-bold text-[#1e3a5f] text-sm">All 128 Clauses — Compliance Status</span>
                <span className="text-sm font-bold" style={{color: scoreColor(overall)}}>Overall: {overall}%</span>
              </div>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#eff6ff] text-[10px] text-[#1e3a5f] uppercase sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left border-b">Clause</th>
                      <th className="px-3 py-2 text-left border-b">Title</th>
                      <th className="px-3 py-2 text-center border-b">Std</th>
                      <th className="px-3 py-2 text-center border-b">Section</th>
                      <th className="px-3 py-2 text-center border-b">Docs</th>
                      <th className="px-3 py-2 text-center border-b">✅</th>
                      <th className="px-3 py-2 text-center border-b">⚠️</th>
                      <th className="px-3 py-2 text-center border-b">❌</th>
                      <th className="px-3 py-2 text-center border-b">Score</th>
                      <th className="px-3 py-2 text-left border-b">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {CLAUSES.map(c => {
                      const sc = clauseScores.find(x => x.id === c.id)!;
                      const st = docStatus[c.id] ?? {};
                      const avail   = c.docs.filter((_,i) => (st[`d${i}`]??'missing') === 'available').length;
                      const partial = c.docs.filter((_,i) => (st[`d${i}`]??'missing') === 'partial').length;
                      const missing = c.docs.filter((_,i) => (st[`d${i}`]??'missing') === 'missing').length;
                      return (
                        <tr key={c.id} className="hover:bg-[#eff6ff]">
                          <td className="px-3 py-2 font-mono font-bold text-indigo-300">{c.clause}</td>
                          <td className="px-3 py-2 text-[#1e3a5f] max-w-[180px] truncate font-medium">{c.title}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${c.standard==='ISO'?'bg-[#eff6ff] text-[#1d4ed8]':'bg-purple-900/30 text-purple-300'}`}>{c.standard}</span>
                          </td>
                          <td className="px-3 py-2 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${GROUP_COLORS[c.group]}`}>{c.group}</span></td>
                          <td className="px-3 py-2 text-center font-medium">{c.docs.length}</td>
                          <td className="px-3 py-2 text-center text-[#15803d] font-bold">{avail}</td>
                          <td className="px-3 py-2 text-center text-yellow-300 font-bold">{partial}</td>
                          <td className="px-3 py-2 text-center text-red-700 font-bold">{missing}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-white rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{width:`${sc.pct}%`, background: scoreColor(sc.pct)}} />
                              </div>
                              <span className="font-bold w-8 text-right" style={{color: scoreColor(sc.pct)}}>{sc.pct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#1e3a5f] max-w-[140px] truncate">{remarks[c.id] || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ DOCUMENT GUIDE ═════════════════════════════════════════════════ */}
        {activeTab === 'guide' && (
          <div className="animate-fadeIn space-y-3">
            <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-xl px-4 py-3 text-sm text-indigo-200">
              <strong>Master Document & Procedure Checklist</strong> — All 128 clauses. Use as audit preparation master list and internal audit evidence tracker.
            </div>
            {GROUPS_ORDER.map((g,i) => {
              const gClauses = CLAUSES.filter(c => c.group === g);
              return (
                <div key={g}>
                  <div className={`font-bold text-sm px-4 py-2 rounded-lg border mb-2 ${GROUP_COLORS[g]}`}>
                    Clause {['4','5','6','7','8','9','10'][i]} — {g} ({gClauses.length} clauses)
                  </div>
                  {gClauses.map(c => (
                    <div key={c.id} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4 mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-900/30 px-2 py-0.5 rounded">{c.clause}</span>
                        <span className="font-semibold text-[#1e3a5f] text-sm">{c.title}</span>
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.standard==='ISO'?'bg-[#eff6ff] text-[#1d4ed8] border-blue-700/50':'bg-purple-900/30 text-purple-700 border-purple-700/50'}`}>{c.standard}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-bold text-red-600 uppercase mb-1">📄 Documents / Audit Evidence ({c.docs.length})</div>
                          <ul className="space-y-0.5">
                            {c.docs.map((d,i) => <li key={i} className="text-xs text-[#1e3a5f] flex items-start gap-1"><span className="text-red-600 shrink-0 mt-0.5">◆</span>{d}</li>)}
                          </ul>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">📋 Procedures / WI ({c.procedures.length})</div>
                          <ul className="space-y-0.5">
                            {c.procedures.map((p,i) => <li key={i} className="text-xs text-indigo-300">▸ {p}</li>)}
                          </ul>
                          {c.processOwner && (
                            <div className="mt-2">
                              <div className="text-[10px] font-bold text-teal-600 uppercase mb-0.5">👤 Owner</div>
                              <div className="text-xs text-teal-700">{c.processOwner}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
