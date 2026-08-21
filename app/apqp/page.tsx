'use client';

import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';

// -- Theme ---------------------------------------------------------------------
const T = {
  bg: '#f5f7ff', card: '#ffffff', border: '#dde3f5',
  navy: '#1e2a5a', amber: '#fbbf24', indigo: '#6366f1',
  emerald: '#10b981', text: '#374151', muted: '#9ca3af',
  red: '#ef4444', orange: '#f97316', blue: '#3b82f6',
};

// -- Data ----------------------------------------------------------------------
const PHASES = [
  {
    no: 1, name: 'Plan and Define Program', icon: '🎯', color: '#6366f1',
    duration: 'SOP-18 to SOP-12 months',
    purpose: 'Define customer requirements, establish quality goals and design/manufacturing requirements.',
    inputs: ['Voice of Customer','Design Goals','Reliability & Quality Goals','Preliminary BOM','Preliminary Process Flow','Preliminary Listing of Special Characteristics','Product Assurance Plan','Management Support'],
    outputs: ['Design Goals','Reliability & Quality Goals','Preliminary BOM','Preliminary Process Flow','Preliminary Listing of Special Characteristics','Product Assurance Plan','Management Support'],
    deliverables: [
      'Customer requirements documented','Quality goals established','Preliminary BOM approved',
      'Preliminary process flow created','Special characteristics identified (S/C, C/C)',
      'Management support confirmed','Design goals agreed with customer','Voice of Customer captured',
      'Feasibility assessment initiated','APQP team formed','Project timing plan created',
    ],
    iatfClauses: ['8.1','8.3.1','8.3.2','9.1.2'],
    risks: ['Incomplete VOC','Missing special characteristics early','No management commitment'],
  },
  {
    no: 2, name: 'Product Design and Development', icon: '📐', color: '#8b5cf6',
    duration: 'SOP-12 to SOP-8 months',
    purpose: 'Transform customer requirements into design characteristics and prototype builds.',
    inputs: ['Design Goals','Reliability & Quality Goals','Preliminary BOM','Preliminary Process Flow','Special Characteristics','Management Support'],
    outputs: ['DFMEA','Design Verification Plan','Design Review','Prototype Build Control Plan','Engineering Drawings & Math Data','Material Specifications','Drawing & Spec Changes','New Equipment, Tooling & Facility Requirements','Special Product & Process Characteristics','Gages & Test Equipment Requirements','Team Feasibility Commitment'],
    deliverables: [
      'DFMEA completed','Design verification plan (DVP) approved','Engineering drawings released',
      'Material specifications approved','Design review conducted & documented',
      'Prototype control plan created','New tooling/equipment requirements defined',
      'Special characteristics list updated','Team feasibility commitment signed',
      'Gage and test equipment requirements defined','GD&T reviewed',
    ],
    iatfClauses: ['8.3.3','8.3.4','8.3.5','8.3.6'],
    risks: ['DFMEA not updated after design changes','DVP gaps','Special characteristics not cascaded to PFMEA'],
  },
  {
    no: 3, name: 'Process Design and Development', icon: '⚙️', color: '#0ea5e9',
    duration: 'SOP-8 to SOP-4 months',
    purpose: 'Develop the manufacturing process to produce products meeting all customer requirements.',
    inputs: ['DFMEA','Design Verification Plan','Design Review','Prototype Control Plan','Engineering Drawings','Material Specifications','Special Characteristics'],
    outputs: ['Packaging Standards','Product/Process Quality System Review','Process Flow Chart','Floor Plan Layout','Process FMEA (PFMEA)','Pre-Launch Control Plan','Process Instructions','Measurement Systems Analysis Plan','Preliminary Process Capability Study Plan','Packaging Specifications'],
    deliverables: [
      'Process flow chart (PFD) approved','PFMEA completed with RPN < 100','Pre-launch control plan signed',
      'Process instructions / work instructions issued','Floor plan layout approved',
      'MSA plan prepared','Preliminary capability study plan ready','Packaging specifications defined',
      'Mistake-proofing (poka-yoke) identified','Process parameter targets defined',
      'Control plan linked to PFMEA and PFD','Special characteristics cascaded to control plan',
    ],
    iatfClauses: ['8.5.1','8.5.1.1','8.5.1.2','8.4.2.4'],
    risks: ['PFD / PFMEA / CP not cross-linked','MSA not planned for all critical gauges','Poka-yoke not validated'],
  },
  {
    no: 4, name: 'Product and Process Validation', icon: '✅', color: '#10b981',
    duration: 'SOP-4 to SOP-1 month',
    purpose: 'Validate that the manufacturing process produces products meeting all customer requirements.',
    inputs: ['Packaging Standards','Process Quality Review','Process Flow Chart','Floor Plan','PFMEA','Pre-Launch Control Plan','Process Instructions','MSA Plan','Capability Study Plan','Packaging Spec'],
    outputs: ['Production Trial Run','MSA — Measurement Systems Analysis','Preliminary Process Capability Study','Production Part Approval (PPAP)','Production Validation Testing','Packaging Evaluation','Production Control Plan','Quality Planning Sign-Off & Management Support'],
    deliverables: [
      'Production trial run (PTR) completed — minimum 300 pcs','MSA completed — GRR < 10% acceptable',
      'Preliminary Cpk ≥ 1.67 for special characteristics','Production control plan approved',
      'PPAP package submitted and approved (PSW signed)','Packaging evaluation completed',
      'Production validation testing (PVT) passed','Quality planning sign-off obtained',
      'All special characteristics Cpk verified','Management support & sign-off confirmed',
      'Functional testing completed','Customer PPAP approval received',
    ],
    iatfClauses: ['8.5.1','8.6.1','8.6.2','8.6.3'],
    risks: ['PTR sample size too small','MSA not done on all critical gauges','PPAP submitted late'],
  },
  {
    no: 5, name: 'Launch, Assessment and Corrective Action', icon: '🚀', color: '#f97316',
    duration: 'SOP to SOP+3 months',
    purpose: 'Ensure the production process is capable, stable, and satisfying customers continuously.',
    inputs: ['Production Trial Run','MSA Results','Preliminary Capability Study','PPAP Approval','Production Validation Test','Packaging Evaluation','Production Control Plan','Sign-Off'],
    outputs: ['Reduced Variation','Customer Satisfaction','Delivery & Service','Lessons Learned'],
    deliverables: [
      'Variation reduction actions implemented','Customer satisfaction monitored (PPM, warranty, score)',
      'Delivery performance tracked (OTD %)','Lessons learned documented',
      'PFMEA updated with field data','Control plan updated with actual capability data',
      'SPC implemented for special characteristics','Reaction plan tested and validated',
      'All open issues from previous phases closed','APQP closure review conducted',
      'Knowledge transfer to production team done','Continuous improvement actions planned',
    ],
    iatfClauses: ['10.2','10.3','9.1.2','8.7'],
    risks: ['Lessons learned not captured','Control plan not updated post-launch','SPC not continued after SOP'],
  },
];

const QA_BANK = [
  // Beginner
  { level: 'Beginner', q: 'What is APQP?', a: 'Advanced Product Quality Planning (APQP) is a structured process and set of procedures developed by AIAG to ensure a product satisfies the customer. It defines and establishes the steps necessary to ensure a new product is properly designed, validated, and launched.' },
  { level: 'Beginner', q: 'What are the 5 phases of APQP?', a: 'Phase 1: Plan and Define Program, Phase 2: Product Design and Development, Phase 3: Process Design and Development, Phase 4: Product and Process Validation, Phase 5: Launch, Assessment and Corrective Action.' },
  { level: 'Beginner', q: 'Who developed APQP?', a: 'APQP was developed by the Automotive Industry Action Group (AIAG) in collaboration with Ford, General Motors, and Chrysler (now Stellantis). The current reference is the AIAG APQP 4th Edition.' },
  { level: 'Beginner', q: 'What is the purpose of APQP?', a: 'APQP ensures that product quality is planned and communicated between supplier and customer, that required steps are completed on time, and that the product meets all customer requirements at launch.' },
  { level: 'Beginner', q: 'What is SOP in APQP timing?', a: 'SOP stands for Start of Production. All APQP timing milestones are measured relative to SOP (e.g., SOP-18 months, SOP-12 months). It is the date when regular production begins.' },
  { level: 'Beginner', q: 'What is the APQP timing plan?', a: 'An APQP Timing Plan is a Gantt chart-style document showing all APQP deliverables mapped against the program timeline with responsibility assignments and target/actual completion dates.' },
  { level: 'Beginner', q: 'What is a Gate Review in APQP?', a: 'A Gate Review (also called Phase Gate Review) is a formal management review at the end of each APQP phase to confirm all required deliverables are complete before proceeding to the next phase.' },
  { level: 'Beginner', q: 'What does VOC stand for?', a: 'Voice of Customer (VOC). It captures all customer requirements, expectations, wishes, and implicit needs. VOC is the primary input to Phase 1 of APQP.' },
  { level: 'Beginner', q: 'What is a special characteristic in APQP?', a: 'A special characteristic is a product or process parameter that could affect safety, compliance, fit, function, or customer satisfaction. Identified by symbols: ◆ (Safety), ★ (Critical), □ (Significant). These require extra controls in the Control Plan.' },
  { level: 'Beginner', q: 'What is the APQP team composition?', a: 'Typical APQP team includes: Program Manager, Design Engineer, Manufacturing Engineer, Quality Engineer, Supplier Quality Engineer, Materials/Procurement, Sales/Customer Interface, and Finance. Cross-functional teamwork is mandatory.' },
  // Engineer
  { level: 'Engineer', q: 'What are the key inputs and outputs of Phase 3?', a: 'Inputs: DFMEA, design verification plan, engineering drawings, special characteristics. Outputs: PFMEA, process flow chart (PFD), pre-launch control plan, process instructions, MSA plan, preliminary capability study plan, floor plan layout, packaging specifications.' },
  { level: 'Engineer', q: 'What is the difference between pre-launch and production control plan?', a: 'Pre-launch control plan is used during prototype and pilot runs (Phases 3-4) and may have tighter inspection frequencies. Production control plan is the final approved plan used during regular production, validated through the production trial run.' },
  { level: 'Engineer', q: 'What is the minimum sample size for a production trial run?', a: 'AIAG PPAP requires a minimum of 300 consecutive pieces for the initial process capability study. However, customer-specific requirements may demand more. The key is that the run must represent actual production conditions.' },
  { level: 'Engineer', q: 'How does APQP link to PPAP?', a: 'PPAP is the output of APQP Phase 4. The PPAP package (18 elements) is the evidence that the APQP process was completed successfully. PSW (Part Submission Warrant) is the final sign-off that the manufacturing process can produce conforming parts at production rates.' },
  { level: 'Engineer', q: 'What is a DFMEA and when is it created in APQP?', a: 'Design FMEA analyzes potential failure modes in the product design. It is created in Phase 2 (Product Design and Development) and must be updated throughout the program when design changes occur. It feeds special characteristics into Phase 3.' },
  { level: 'Engineer', q: 'What Cpk is required in Phase 4 for special characteristics?', a: 'Preliminary Cpk ≥ 1.67 is required for special (safety/critical) characteristics during Phase 4 validation. For regular characteristics, Cpk ≥ 1.33 is the minimum. If Cpk < 1.33, 100% inspection or corrective action is required.' },
  { level: 'Engineer', q: 'What is the difference between DFMEA and PFMEA in APQP?', a: 'DFMEA (Design FMEA) analyzes failure modes in the product design — what could go wrong with the product itself. PFMEA (Process FMEA) analyzes failure modes in the manufacturing process — what could go wrong during production. DFMEA outputs feed into PFMEA inputs.' },
  { level: 'Engineer', q: 'How is PFD, PFMEA and Control Plan linked?', a: 'They form a "trinity": PFD (Process Flow Diagram) defines all process steps. PFMEA identifies failure modes and controls for each step. Control Plan references controls from PFMEA and specifies measurement methods, frequency, and reaction plans. Process step numbers must match across all three documents.' },
  { level: 'Engineer', q: 'What is a feasibility commitment in APQP?', a: 'Team Feasibility Commitment is a document signed by the cross-functional team (typically at end of Phase 2) confirming that the design can be manufactured to meet all customer requirements. It captures any concerns, assumptions, or risks identified by the team.' },
  { level: 'Engineer', q: 'What is the MSA plan in APQP Phase 3?', a: 'MSA (Measurement System Analysis) plan lists all gauges, instruments, and measurement methods to be used for special characteristics. It defines which MSA studies (GRR, bias, linearity, stability) will be conducted, by whom, and when. GRR < 10% is acceptable, 10-30% conditional, >30% unacceptable.' },
  // Auditor
  { level: 'Auditor', q: 'Which IATF 16949 clauses specifically require APQP?', a: 'IATF 16949 Clause 8.1 (Product and Service Provision Planning), 8.3.1 (Design and Development Planning — General), 8.3.2 (Design and Development Inputs). Customer-specific requirements (CSR) may also mandate APQP explicitly — e.g., Ford APQP, GM BIQS, Stellantis FASTCAR.' },
  { level: 'Auditor', q: 'What are the most common APQP audit findings?', a: '1. APQP timing plan not updated regularly. 2. Gate reviews not conducted or documented. 3. PFMEA/Control Plan not linked to PFD (process step numbers mismatch). 4. Special characteristics not cascaded from DFMEA to PFMEA to Control Plan. 5. Lessons learned from previous programs not incorporated. 6. MSA not completed before PPAP submission. 7. APQP not conducted for internally developed changes.' },
  { level: 'Auditor', q: 'How do you audit APQP effectiveness?', a: 'Review: 1. Timing plan completeness and updates. 2. Gate review minutes with sign-offs. 3. Cross-reference PFD-PFMEA-Control Plan linkage. 4. Special characteristics trace from VOC to Control Plan. 5. PPAP approval status. 6. Open issues list resolution. 7. Lessons learned database from previous programs. 8. Customer PPM trend post-launch.' },
  { level: 'Auditor', q: 'What is customer-specific APQP (e.g., Ford APQP vs standard AIAG APQP)?', a: 'While AIAG APQP provides the framework, major OEMs have their own requirements: Ford uses "APQP Status Reporting" with RAG (Red-Amber-Green) status per deliverable. GM uses "BIQS" scoring tied to APQP milestones. Stellantis uses "FASTCAR" portal for APQP tracking. Suppliers must comply with both AIAG APQP and their customer\'s specific version.' },
  { level: 'Auditor', q: 'How should APQP be applied for engineering changes (not new programs)?', a: 'Even for engineering changes, APQP principles apply per IATF Clause 8.3.6 and 8.5.6. A change impact assessment must be done. If the change affects form/fit/function or special characteristics, a full or partial APQP review and PPAP resubmission may be required. The scope depends on the nature and risk of the change.' },
];

const TEMPLATES = [
  { name: 'APQP Master Tracking Format', type: 'Excel', desc: 'Complete AIAG 3rd Ed tracker — Dashboard, Timing Plan, Output Tracker, RAMP, Gate Reviews, Safe Launch, Lessons Learned (9 sheets)', icon: '🏆', color: '#1e2a5a', file: '/downloads/apqp/APQP_Tracking_Format_AIAG_3rdEd.xlsx' },
  { name: 'Appendix A — All Checklists', type: 'Excel', desc: 'Official AIAG APQP Appendix A checklists A-0 to A-10: Risk Factors, DFMEA, Design Info, Equipment, Quality, Floor Plan, PFC, PFMEA, Change Mgmt, Sourcing, Control Plan', icon: '✅', color: '#10b981', file: '/downloads/apqp/APQP_Appendix_A_Checklists.xlsx' },
  { name: 'Appendix B — Gate Reviews', type: 'Excel', desc: 'Official AIAG APQP Appendix B gate review forms — Gate 0 through Gate 5 with sign-off sections', icon: '🚦', color: '#6366f1', file: '/downloads/apqp/APQP_Appendix_B_Gate_Reviews.xlsx' },
  { name: 'APQP Timing Plan', type: 'Excel', desc: 'Gantt chart with all 5 phases, deliverables, responsibility, target vs actual dates', icon: '📊', color: '#0ea5e9', file: '/downloads/apqp/APQP_Timing_Plan.xlsx' },
  { name: 'APQP Open Issues List (OIL)', type: 'Excel', desc: 'Tracks all open issues, owner, target date, status — reviewed at every gate review', icon: '📋', color: '#f97316', file: '/downloads/apqp/APQP_Open_Issues_List.xlsx' },
  { name: 'Gate Review Checklist', type: 'Word', desc: 'Phase-by-phase checklist for gate reviews with sign-off sections for management', icon: '📝', color: '#8b5cf6', file: '/downloads/apqp/APQP_Gate_Review_Checklist.docx' },
  { name: 'APQP Status Report', type: 'Word', desc: 'Monthly program status report — RAG status per deliverable, risks, actions', icon: '📊', color: '#ef4444', file: '/downloads/apqp/APQP_Status_Report.docx' },
  { name: 'Feasibility Analysis Form', type: 'Word', desc: 'Team feasibility commitment form with sections for assumptions, risks, and signatures', icon: '🔍', color: '#fbbf24', file: '/downloads/apqp/APQP_Feasibility_Analysis_Form.docx' },
  { name: 'APQP Team Roster', type: 'Excel', desc: 'Cross-functional team members, roles, responsibilities, RACI matrix', icon: '👥', color: '#10b981', file: '/downloads/apqp/APQP_Team_Roster.xlsx' },
  { name: 'Design Review Report', type: 'Word', desc: 'Formal design review agenda, attendees, action items, and sign-off', icon: '📐', color: '#1e2a5a', file: '/downloads/apqp/APQP_Design_Review_Report.docx' },
  { name: 'Launch Readiness Review', type: 'Word', desc: 'Pre-SOP checklist covering all critical items for production launch approval', icon: '🚀', color: '#6366f1', file: '/downloads/apqp/APQP_Launch_Readiness_Review.docx' },
];

const SUPPORTING = [
  { title: 'AIAG APQP Third Edition Manual', desc: 'Official AIAG APQP 3rd Edition reference manual — complete 129-page standard document', icon: '📖', file: '/downloads/apqp/AIAG_APQP_Third_Edition.pdf' },
  { title: '200 Q&A Interview Prep', desc: 'Complete APQP interview preparation — 200 questions & answers across all phases, levels (L1–Director), IATF linkage, gate reviews (18 sheets)', icon: '🎓', file: '/downloads/apqp/APQP_200_QA_Interview_Prep.xlsx' },
  { title: 'APQP Training Presentation', desc: 'Full 100-slide training deck based on AIAG APQP 3rd Edition — covers all phases, gates, deliverables, tools and audit readiness', icon: '📊', file: '/downloads/apqp/APQP_Training_PPT_AIAG_3rdEdition.pptx' },
  { title: 'IATF 16949 Clause Mapping', desc: 'Maps all APQP deliverables to specific IATF 16949 clauses for audit readiness', icon: '📌', file: '/downloads/apqp/APQP_IATF_Clause_Mapping.pdf' },
  { title: 'Customer APQP Requirements', desc: 'Summary of customer-specific APQP requirements — Ford, GM, Stellantis, Toyota, Honda, Maruti, TML, M&M', icon: '🏢', file: '/downloads/apqp/APQP_Customer_Requirements.pdf' },
  { title: 'APQP vs PPAP Relationship', desc: 'Visual explanation of how APQP Phase 4 outputs become the PPAP 18 elements', icon: '🔗', file: '/downloads/apqp/APQP_vs_PPAP_Relationship.pdf' },
  { title: 'Special Characteristics Guide', desc: 'How to identify, classify (S/C, C/C), and cascade special characteristics across all APQP documents', icon: '⭐', file: '/downloads/apqp/APQP_Special_Characteristics_Guide.pdf' },
  { title: 'Lessons Learned Template', desc: 'Structured template to capture lessons learned from each program for future APQP use', icon: '📚', file: '/downloads/apqp/APQP_Lessons_Learned_Template.pdf' },
  { title: 'APQP for Commodity Changes', desc: 'Guidance on APQP scope for supplier changes, material changes, and process changes', icon: '🔄', file: '/downloads/apqp/APQP_Commodity_Changes_Guide.pdf' },
  { title: 'APQP Audit Checklist', desc: '40-point internal audit checklist to assess APQP compliance per IATF 16949', icon: '✔️', file: '/downloads/apqp/APQP_Audit_Checklist.pdf' },
  { title: 'APQP KPI Dashboard Guide', desc: 'Metrics to track APQP health: on-time deliverable %, gate review score, issues closure rate', icon: '📈', file: '/downloads/apqp/APQP_KPI_Dashboard_Guide.pdf' },
  { title: 'APQP 3rd Edition Clause Analysis', desc: 'Colour-coded clause-wise analysis of APQP 3rd Edition — Phase 0 through Appendices with key requirements per clause', icon: '🔬', file: '/downloads/apqp/APQP_3rd_Edition_Analysis_Table.xlsx' },
];

const POSTERS = [
  {
    title: 'APQP Complete Program Flow Map',
    size: 'A1 Poster',
    desc: 'Full program flow map with Gates 0–5, all phases, deliverables and decision points — generated from AIAG 3rd Edition',
    type: 'roadmap',
    colors: ['#1e2a5a','#6366f1','#0ea5e9','#10b981','#f97316','#fbbf24'],
    file: '/downloads/apqp/APQP_Phase_Flow_Poster.pdf',
  },
  {
    title: 'APQP 5 Phases Overview',
    size: 'A1 Poster',
    desc: 'Full phase roadmap with inputs, outputs, and key deliverables per phase',
    type: 'roadmap',
    colors: ['#6366f1','#8b5cf6','#0ea5e9','#10b981','#f97316'],
    file: '/downloads/apqp/APQP_Poster_5_Phases_Overview.pdf',
  },
  {
    title: 'APQP Timing Clock',
    size: 'A2 Banner',
    desc: 'Visual countdown clock from SOP-18 months to SOP showing when each deliverable is due',
    type: 'timeline',
    colors: ['#1e2a5a','#fbbf24'],
    file: '/downloads/apqp/APQP_Poster_Timing_Clock.pdf',
  },
  {
    title: 'PFD → PFMEA → Control Plan Trinity',
    size: 'A1 Poster',
    desc: 'Visual showing how Process Flow Diagram, PFMEA and Control Plan are interlinked',
    type: 'trinity',
    colors: ['#6366f1','#ef4444','#10b981'],
    file: '/downloads/apqp/APQP_Poster_PFD_PFMEA_CP_Trinity.pdf',
  },
  {
    title: 'Special Characteristics Classification',
    size: 'A3 Poster',
    desc: 'CC (Critical), SC (Significant), Customer-specific characteristics with examples and control requirements',
    type: 'classification',
    colors: ['#ef4444','#f97316','#fbbf24'],
    file: '/downloads/apqp/APQP_Poster_Special_Characteristics.pdf',
  },
  {
    title: 'Gate Review Checklist Banner',
    size: 'A2 Banner',
    desc: 'Visual checklist of deliverables required at each phase gate for meeting room display',
    type: 'checklist',
    colors: ['#1e2a5a','#10b981'],
    file: '/downloads/apqp/APQP_Poster_Gate_Review_Banner.pdf',
  },
  {
    title: 'APQP Team Roles & RACI Matrix',
    size: 'A2 Poster',
    desc: 'RACI matrix showing who is Responsible, Accountable, Consulted, Informed for each APQP activity',
    type: 'raci',
    colors: ['#1e2a5a','#6366f1'],
    file: '/downloads/apqp/APQP_Poster_Team_RACI_Matrix.pdf',
  },
];

const TABS = ['📖 Overview','🚀 5 Phases','⚡ Generator','🔍 Analyser','💬 Q&A','📁 Templates','📚 Supporting Docs','🖼 Posters','📊 Dashboard','🧩 Phase Deep Dive','🔄 Workflow','📂 Case Studies','🎓 Training','📅 Gantt'];

// Gantt phase definitions — months relative to SOP (negative = before SOP)
const GANTT_PHASES = [
  { no:1, name:'Plan & Define',      color:'#6366f1', start:-18, end:-12, gate:'Gate 1', icon:'🎯',
    milestones:['VOC captured','BOM preliminary','Team formed','Project timing plan'],
  },
  { no:2, name:'Product Design',     color:'#8b5cf6', start:-12, end:-8,  gate:'Gate 2', icon:'📐',
    milestones:['DFMEA complete','DVP approved','Engineering drawings released','Design review done'],
  },
  { no:3, name:'Process Design',     color:'#0ea5e9', start:-8,  end:-4,  gate:'Gate 3', icon:'⚙️',
    milestones:['PFD approved','PFMEA RPN<100','Pre-launch CP signed','MSA plan ready'],
  },
  { no:4, name:'Validation',         color:'#10b981', start:-4,  end:-1,  gate:'Gate 4', icon:'✅',
    milestones:['PTR 300 pcs done','GRR < 10%','Cpk ≥ 1.67','PPAP submitted'],
  },
  { no:5, name:'Launch & Assess',    color:'#f97316', start:-1,  end:6,   gate:'SOP',    icon:'🚀',
    milestones:['SOP achieved','Safe launch plan active','PPM monitored','APQP closure review'],
  },
];
const TOTAL_MONTHS = 24; // -18 to +6
const GANTT_START  = -18; // earliest month shown

// -- Component -----------------------------------------------------------------

const PHASE_DELIVERABLES = [
  { phase:1, name:'Plan and Define', color:'#1e40af', icon:'📋', items:[
    'Design Goals defined and documented',
    'Reliability and Quality Goals established',
    'Preliminary Bill of Materials (PBOM)',
    'Preliminary Process Flow Diagram',
    'Preliminary Listing of Special Characteristics',
    'Product Assurance Plan',
    'Management Support sign-off',
    'Voice of Customer (VOC) captured',
  ]},
  { phase:2, name:'Product Design & Development', color:'#059669', icon:'🔧', items:[
    'Design FMEA (DFMEA) completed',
    'Design for Manufacturability (DFM/DFA) study',
    'Design Verification Plan',
    'Design Review meetings held',
    'Prototype Control Plan',
    'Engineering Drawings (CAD/2D) released',
    'Material Specifications approved',
    'New Tooling / Equipment requirements',
  ]},
  { phase:3, name:'Process Design & Development', color:'#d97706', icon:'⚙️', items:[
    'Process Flow Diagram (PFD) complete',
    'Process FMEA (PFMEA) completed',
    'Pre-Launch Control Plan',
    'Measurement System Evaluation Plan',
    'Preliminary Process Capability Study Plan',
    'Packaging Standards defined',
    'Quality System Review completed',
    'Manufacturing Process Instructions (WI)',
  ]},
  { phase:4, name:'Product & Process Validation', color:'#7c3aed', icon:'✅', items:[
    'Production Trial Run (≥300 pcs, 8 hrs)',
    'Measurement System Analysis (MSA/GRR)',
    'Preliminary Process Capability (Ppk ≥ 1.67)',
    'Production Part Approval (PPAP) submitted',
    'Production Validation Testing',
    'Packaging Evaluation completed',
    'Production Control Plan approved',
    'Quality Planning Sign-Off (Management)',
  ]},
  { phase:5, name:'Feedback, Assessment & Corrective Action', color:'#dc2626', icon:'📈', items:[
    'Reduced Variation tracking (Cpk improvement)',
    'Customer Satisfaction score reviewed',
    'Delivery and Service KPI analysis',
    'Lessons Learned Database updated',
    'Warranty data review completed',
    'Customer Return / PRTS analysis',
    'Annual PPAP revalidation (layout)',
  ]},
];

const LAUNCH_ITEMS = [
  'Gate 0: Customer requirements reviewed and signed off',
  'Gate 1: Feasibility confirmed — team, tooling, timing agreed',
  'Gate 2: Design records, DFMEA, and drawings released',
  'Gate 3: PFD, PFMEA, and Control Plan approved by customer',
  'Gate 4: Trial run completed ≥300 pieces at production rate',
  'Gate 5: PPAP submitted and approved (PSW signed)',
  'Process capability Ppk ≥ 1.67 for all CC characteristics',
  'MSA/GRR study passed for all critical gauges (GRR ≤10%)',
  'Packaging validated — no damage in transit test',
  'Operator training completed and records signed',
  'Safe Launch monitoring plan activated',
  'Customer SOP date confirmed and logistics aligned',
];

export default function APQPPage() {
  const [tab, setTab] = useState(0);
  const [qFilter, setQFilter] = useState<'All'|'Beginner'|'Engineer'|'Auditor'>('All');
  const [qSearch, setQSearch] = useState('');
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [openPhase, setOpenPhase] = useState<number | null>(0);

  // Generator state
  const [gen, setGen] = useState({ partName: '', customer: '', sopDate: '', pm: '', type: 'New Program' });
  const [genResult, setGenResult] = useState(false);
  const [phaseStatus, setPhaseStatus] = useState<Record<number,string>>({ 1:'Not Started',2:'Not Started',3:'Not Started',4:'Not Started',5:'Not Started' });

  // Analyser state
  const [anaPhase, setAnaPhase] = useState(1);
  const [anaChecked, setAnaChecked] = useState<string[]>([]);
  const [anaResult, setAnaResult] = useState(false);
  const [showGateGen, setShowGateGen] = useState(false);
  const [showLaunchReady, setShowLaunchReady] = useState(false);
  const [launchChecks, setLaunchChecks] = useState<Record<number,boolean>>({});
  const [gateInfo, setGateInfo] = useState({ program:'', customer:'', pm:'', sopDate:'', phase: '4' });

  // Gantt state
  const [gantt, setGantt] = useState({ partName:'', customer:'', pm:'', sopDate:'' });
  const [ganttChecked, setGanttChecked] = useState<Record<string,boolean>>({});
  const [ganttPhaseStatus, setGanttPhaseStatus] = useState<Record<number,string>>({ 1:'Not Started',2:'Not Started',3:'Not Started',4:'Not Started',5:'Not Started' });
  const [ganttExpanded, setGanttExpanded] = useState<number|null>(null);

  const filteredQA = useMemo(() =>
    QA_BANK.filter(q =>
      (qFilter === 'All' || q.level === qFilter) &&
      (qSearch === '' || q.q.toLowerCase().includes(qSearch.toLowerCase()) || q.a.toLowerCase().includes(qSearch.toLowerCase()))
    ), [qFilter, qSearch]);

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px', ...style }}>
      {children}
    </div>
  );

  const badge = (text: string, color: string) => (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: color + '18', color, marginRight: '6px' }}>{text}</span>
  );

  return (
      <>
      <PageTitle title="APQP" />
      <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* -- Header ----------------------------------------------------------- */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e2a5a 50%,#162044 100%)', padding: '22px 32px 0', position: 'relative', overflow: 'hidden' }}>
        {/* dot grid overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        {/* top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f160,transparent)' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🚀</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>APQP</h1>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#6366f125', color: '#a5b4fc', borderRadius: '20px', border: '1px solid #6366f145' }}>AIAG 3rd Edition</span>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', background: '#10b98115', color: '#6ee7b7', borderRadius: '20px', border: '1px solid #10b98140' }}>IATF 16949</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Advanced Product Quality Planning — Complete Knowledge Center</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {[['5','Phases','#a5b4fc','#6366f125','#6366f145'],['200+','Q&A','#7dd3fc','#0ea5e915','#0ea5e940'],['11','Templates','#6ee7b7','#10b98115','#10b98140'],['6','Posters','#fcd34d','#f59e0b15','#f59e0b40']].map(([val,lbl,tc,bg,br]) => (
              <div key={lbl as string} style={{ textAlign: 'center', background: bg as string, border: `1px solid ${br}`, borderRadius: '10px', padding: '9px 14px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: tc as string }}>{val}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{lbl as string}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ position: 'relative', display: 'flex', gap: '1px', overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '9px 16px', fontSize: '12px', fontWeight: tab === i ? 700 : 400,
              color: tab === i ? '#fff' : '#64748b',
              background: tab === i ? '#ffffff14' : 'transparent',
              border: 'none', borderBottom: tab === i ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer', borderRadius: '8px 8px 0 0', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: '1400px' }}>

        {/* ══ TAB 0: OVERVIEW ══════════════════════════════════════════════ */}
        {tab === 0 && (
          <>
          {/* -- Download Strip */}
          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="/downloads/apqp/AIAG_APQP_Third_Edition.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>AIAG APQP 3rd Ed.</a>
              <a href="/downloads/apqp/APQP_Phase_Flow_Poster.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Phase Flow Poster</a>
              <a href="/downloads/apqp/APQP_vs_PPAP_Relationship.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#0e7490",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP vs PPAP Map</a>
              <a href="/downloads/apqp/APQP_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>IATF Clause Mapping</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* What is APQP */}
            {card(
              <>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: T.navy, marginBottom: '12px' }}>📖 What is APQP?</h2>
                <p style={{ fontSize: '13px', color: T.text, lineHeight: 1.8, marginBottom: '12px' }}>
                  <strong>Advanced Product Quality Planning (APQP)</strong> is a structured framework developed by AIAG (Automotive Industry Action Group) in collaboration with Ford, GM, and Chrysler. It is a structured method of defining and establishing the steps necessary to ensure that a product satisfies the customer.
                </p>
                <p style={{ fontSize: '13px', color: T.text, lineHeight: 1.8, marginBottom: '12px' }}>
                  APQP is one of the Five Core Tools of the automotive quality system (along with PPAP, PFMEA, MSA, and SPC). It provides a <strong>common language</strong> between suppliers and customers and ensures quality is planned — not inspected — into the product.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
                  {[
                    { label: 'Developed by', value: 'AIAG + Ford, GM, Stellantis' },
                    { label: 'Current Edition', value: '4th Edition (2008)' },
                    { label: 'IATF Clause', value: '8.1, 8.3.1, 8.3.2' },
                    { label: 'Phases', value: '5 Phases (Plan → Launch)' },
                    { label: 'Linked Tools', value: 'PPAP, PFMEA, MSA, SPC, CP' },
                    { label: 'Goal', value: 'Zero-defect launch' },
                  ].map(i => (
                    <div key={i.label} style={{ background: T.bg, borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{i.label}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: T.navy, marginTop: '3px' }}>{i.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick reference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {card(
                <>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: T.navy, marginBottom: '10px' }}>🎯 5 Phases at a Glance</h3>
                  {PHASES.map(p => (
                    <div key={p.no} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>{p.no}</div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: T.navy }}>{p.name}</div>
                        <div style={{ fontSize: '9px', color: T.muted }}>{p.duration}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {card(
                <>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: T.navy, marginBottom: '10px' }}>📋 IATF 16949 Clause Map</h3>
                  {[['8.1','Planning of product realization'],['8.3.1','Design & development — general'],['8.3.2','Design & development inputs'],['8.3.3','Design & development controls'],['8.5.1','Process controls'],['10.3','Continual improvement']].map(([clause, title]) => (
                    <div key={clause} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: T.indigo, minWidth: '32px' }}>{clause}</span>
                      <span style={{ fontSize: '11px', color: T.text }}>{title}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Benefits */}
            {card(
              <>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: T.navy, marginBottom: '12px' }}>💡 Why APQP Matters</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { icon: '🎯', title: 'Zero-Defect Launch', desc: 'Prevents quality problems before they occur — cost of prevention vs cost of failure' },
                    { icon: '⏱️', title: 'On-Time Launch', desc: 'Structured milestones prevent last-minute surprises that delay SOP' },
                    { icon: '💰', title: 'Cost Reduction', desc: 'Issues found in design phase cost 10x less than issues found in production' },
                    { icon: '🤝', title: 'Customer Confidence', desc: 'Structured PPAP submission gives customers confidence in your process' },
                    { icon: '📊', title: 'Cross-Functional Alignment', desc: 'Breaks silos — engineering, manufacturing, quality, and procurement aligned' },
                    { icon: '📚', title: 'Knowledge Capture', desc: 'Lessons learned feed future programs — institutional knowledge preserved' },
                  ].map(b => (
                    <div key={b.title} style={{ background: T.bg, borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{b.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: T.navy }}>{b.title}</div>
                      <div style={{ fontSize: '11px', color: T.muted, marginTop: '3px', lineHeight: 1.5 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </>,
              { gridColumn: '1 / -1' }
            )}
          </div>
          </>
        )}

        {/* ══ TAB 1: 5 PHASES ══════════════════════════════════════════════ */}
        {tab === 1 && (
          <>
          {/* -- Download Strip */}
          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="/downloads/apqp/APQP_Phase_Timeline_Template.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Phase Timeline</a>
            <a href="/downloads/apqp/APQP_Gate_Review_Checklist.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Gate Review Template</a>
            <a href="/downloads/apqp/APQP_Phase1_Customer_Inputs_Checklist.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Phase 1 Deliverables</a>
            <a href="/downloads/apqp/AIAG_APQP_Third_Edition.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>All 5 Phases PDF</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: T.muted, marginBottom: '4px' }}>Click any phase to expand full details — inputs, outputs, deliverables, risks and IATF clauses</p>
            {PHASES.map((p, pi) => (
              <div key={p.no} style={{ background: T.card, border: `1px solid ${openPhase === pi ? p.color : T.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {/* Phase header */}
                <button onClick={() => setOpenPhase(openPhase === pi ? null : pi)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>{p.no}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: T.navy }}>{p.icon} Phase {p.no}: {p.name}</div>
                    <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>⏱ {p.duration} · {p.deliverables.length} deliverables</div>
                  </div>
                  {p.iatfClauses.map(c => badge(c, T.indigo))}
                  <span style={{ color: T.muted, fontSize: '18px', marginLeft: '8px' }}>{openPhase === pi ? '▲' : '▼'}</span>
                </button>

                {/* Phase detail */}
                {openPhase === pi && (
                  <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: '13px', color: T.text, lineHeight: 1.7, margin: '14px 0' }}>{p.purpose}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {/* Inputs */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: T.indigo, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📥 Inputs ({p.inputs.length})</div>
                        {p.inputs.map(i => <div key={i} style={{ fontSize: '11px', color: T.text, padding: '4px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: '6px' }}><span style={{ color: T.indigo }}>›</span>{i}</div>)}
                      </div>
                      {/* Outputs */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: T.emerald, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📤 Outputs ({p.outputs.length})</div>
                        {p.outputs.map(o => <div key={o} style={{ fontSize: '11px', color: T.text, padding: '4px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: '6px' }}><span style={{ color: T.emerald }}>›</span>{o}</div>)}
                      </div>
                      {/* Deliverables */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: T.navy, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ Deliverables ({p.deliverables.length})</div>
                        {p.deliverables.map(d => <div key={d} style={{ fontSize: '11px', color: T.text, padding: '4px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: '6px' }}><span style={{ color: T.emerald }}>✓</span>{d}</div>)}
                      </div>
                    </div>
                    {/* Risks */}
                    <div style={{ marginTop: '16px', background: '#fff5f5', borderRadius: '8px', padding: '12px 14px', border: `1px solid #fecaca` }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: T.red, marginBottom: '6px' }}>⚠️ Common Risks & Audit Findings</div>
                      {p.risks.map(r => <div key={r} style={{ fontSize: '11px', color: '#7f1d1d', padding: '2px 0', display: 'flex', gap: '6px' }}><span>›</span>{r}</div>)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}

        {/* ══ TAB 2: GENERATOR ════════════════════════════════════════════ */}
        {tab === 2 && (
          <>
          {/* -- Download Strip */}
          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="/downloads/apqp/APQP_Timing_Plan_Master.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Timing Plan XLS</a>
            <a href="/downloads/apqp/APQP_Master_Checklist.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Checklist Excel</a>
            <a href="/downloads/apqp/APQP_vs_PPAP_Relationship.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#0e7490",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP vs PPAP Map</a>
            <a href="/downloads/apqp/APQP_Launch_Readiness_Report.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Launch Readiness Report</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Input Form */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: T.navy }}>APQP Timing Plan Generator</div>
                  <div style={{ fontSize: '11px', color: T.muted }}>Fill in program details → auto-generate APQP timing plan with all 5 phases & milestones</div>
                </div>
              </div>
              {[
                { label: 'Part Name / Program Name', key: 'partName', placeholder: 'e.g. Front Brake Caliper — ABC123', type: 'text' },
                { label: 'Customer Name', key: 'customer', placeholder: 'e.g. Tata Motors / Maruti Suzuki', type: 'text' },
                { label: 'SOP Date (Start of Production)', key: 'sopDate', placeholder: '', type: 'date' },
                { label: 'Program Manager', key: 'pm', placeholder: 'e.g. Rajesh Kumar', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: T.navy, display: 'block', marginBottom: '5px' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={gen[f.key as keyof typeof gen]}
                    onChange={e => setGen(g => ({ ...g, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: T.navy, display: 'block', marginBottom: '5px' }}>Program Type</label>
                <select value={gen.type} onChange={e => setGen(g => ({ ...g, type: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', color: T.text, background: T.bg, outline: 'none' }}>
                  {['New Program','Facelift / Refresh','Engineering Change','Re-Sourcing'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <button
                onClick={() => { if (gen.partName && gen.customer && gen.sopDate) setGenResult(true); }}
                style={{ width: '100%', padding: '10px', background: T.navy, color: T.amber, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                ⚡ Generate APQP Timing Plan
              </button>
              {!gen.partName && <div style={{ fontSize: '11px', color: T.muted, marginTop: '8px', textAlign: 'center' }}>Fill Part Name, Customer and SOP Date to generate</div>}
            </div>

            {/* Output */}
            <div>
              {!genResult ? (
                <div style={{ background: T.card, border: `2px dashed ${T.border}`, borderRadius: '12px', padding: '40px 24px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '40px' }}>📊</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: T.muted }}>APQP Timing Plan will appear here</div>
                  <div style={{ fontSize: '11px', color: T.muted, maxWidth: '260px', lineHeight: 1.6 }}>Fill the form and click Generate to create your APQP timing plan with milestone dates calculated from SOP</div>
                </div>
              ) : (() => {
                const sop = new Date(gen.sopDate);
                const phaseMonths = [[-18,-12],[-12,-8],[-8,-4],[-4,-1],[0,3]];
                const getDate = (mOffset: number) => {
                  const d = new Date(sop);
                  d.setMonth(d.getMonth() + mOffset);
                  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                };
                return (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: T.navy }}>{gen.partName}</div>
                        <div style={{ fontSize: '11px', color: T.muted }}>{gen.customer} · PM: {gen.pm} · {gen.type}</div>
                        <div style={{ fontSize: '11px', color: T.emerald, marginTop: '2px' }}>SOP: {sop.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                      </div>
                      <span style={{ fontSize: '10px', background: T.amber + '22', color: T.amber, padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>AIAG APQP 4th Ed</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {PHASES.map((p, i) => (
                        <div key={p.no} style={{ background: T.bg, borderRadius: '8px', padding: '10px 14px', borderLeft: `4px solid ${p.color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: T.navy }}>{p.icon} Phase {p.no}: {p.name}</div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: p.color, background: p.color + '18', padding: '2px 8px', borderRadius: '10px' }}>
                              {getDate(phaseMonths[i][0])} → {getDate(phaseMonths[i][1])}
                            </div>
                          </div>
                          <div style={{ fontSize: '10px', color: T.muted, marginTop: '4px' }}>{p.deliverables.slice(0, 3).join(' · ')}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '14px', background: T.navy, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gate Review 0 (Kickoff): {getDate(-18)} &nbsp;|&nbsp; Gate Review 5 (SOP): {getDate(0)}</div>
                      <button onClick={() => setGenResult(false)} style={{ fontSize: '10px', color: T.amber, background: 'transparent', border: `1px solid ${T.amber}44`, borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
                    </div>
                    <div style={{ marginTop: '12px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#065f46', marginBottom: '4px' }}>✅ Quick Gate Review Checklist</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                        {['Gate 0 — Kickoff & team formation','Gate 1 — Design inputs complete','Gate 2 — Design release done','Gate 3 — Process design ready','Gate 4 — PPAP approved','Gate 5 — SOP achieved'].map(g => (
                          <div key={g} style={{ fontSize: '10px', color: '#166534', display: 'flex', gap: '5px' }}><span>▸</span>{g}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ══ VISUAL GANTT CHART ══════════════════════════════════════════ */}
          {genResult && (() => {
            const sop = new Date(gen.sopDate);
            // Total timeline: SOP-18 to SOP+3 = 21 months
            const totalMonths = 21;
            const startOffset = -18; // starts at SOP-18

            const phaseOffsets: [number, number][] = [[-18,-12],[-12,-8],[-8,-4],[-4,-1],[0,3]];
            const gateOffsets = [-18, -12, -8, -4, -1, 0];
            const gateName = ['G0\nKickoff','G1\nDesign In','G2\nDesign Rel','G3\nProcess','G4\nPPAP','G5\nSOP'];

            const toPercent = (m: number) => ((m - startOffset) / totalMonths) * 100;

            const getMonthLabel = (offsetMonths: number) => {
              const d = new Date(sop);
              d.setMonth(d.getMonth() + offsetMonths);
              return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            };

            const today = new Date();
            const monthsFromSop = (today.getFullYear() - sop.getFullYear()) * 12 + (today.getMonth() - sop.getMonth());
            const todayPct = Math.max(0, Math.min(100, toPercent(monthsFromSop)));
            const showToday = monthsFromSop >= startOffset && monthsFromSop <= startOffset + totalMonths;

            const statusColor: Record<string,string> = {
              'Not Started': '#94a3b8',
              'In Progress': '#f59e0b',
              'Complete': '#10b981',
              'On Hold': '#ef4444',
            };
            const statusBg: Record<string,string> = {
              'Not Started': '#f1f5f9',
              'In Progress': '#fffbeb',
              'Complete': '#f0fdf4',
              'On Hold': '#fef2f2',
            };

            return (
              <div style={{ marginTop: '20px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: T.navy }}>📊 APQP Gantt Timeline — {gen.partName}</div>
                    <div style={{ fontSize: '11px', color: T.muted }}>SOP: {sop.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {gen.customer} · AIAG APQP 4th Edition</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['Not Started','In Progress','Complete','On Hold'].map(s => (
                      <span key={s} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
                        background: statusBg[s], color: statusColor[s], border: `1px solid ${statusColor[s]}44` }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Month axis */}
                <div style={{ position: 'relative', marginLeft: '180px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', position: 'relative', height: '20px' }}>
                    {Array.from({ length: 8 }, (_, i) => {
                      const mo = startOffset + Math.round((i / 7) * totalMonths);
                      const pct = toPercent(mo);
                      return (
                        <div key={i} style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', fontSize: '9px', color: T.muted, whiteSpace: 'nowrap' }}>
                          {getMonthLabel(mo)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Phase rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PHASES.map((p, i) => {
                    const [start, end] = phaseOffsets[i];
                    const leftPct = toPercent(start);
                    const widthPct = toPercent(end) - leftPct;
                    const st = phaseStatus[p.no];
                    return (
                      <div key={p.no} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                        {/* Phase label */}
                        <div style={{ width: '180px', flexShrink: 0, paddingRight: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.icon} Ph{p.no}: {p.name.split(' ').slice(0,2).join(' ')}
                          </div>
                          <div style={{ fontSize: '9px', color: T.muted }}>{p.duration}</div>
                        </div>

                        {/* Bar track */}
                        <div style={{ flex: 1, position: 'relative', height: '28px', background: '#f8fafc', borderRadius: '4px', border: `1px solid ${T.border}` }}>
                          {/* Today line */}
                          {showToday && (
                            <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: '2px', background: '#ef4444', zIndex: 3 }} />
                          )}
                          {/* Gate markers */}
                          {gateOffsets.map((go, gi) => (
                            <div key={gi} style={{ position: 'absolute', left: `${toPercent(go)}%`, top: 0, bottom: 0, width: '1px', background: '#e2e8f0', zIndex: 1 }}>
                              <div style={{ position: 'absolute', top: '50%', transform: 'translate(-50%,-50%) rotate(45deg)', width: '8px', height: '8px',
                                background: T.navy, zIndex: 2 }} title={`Gate ${gi}`} />
                            </div>
                          ))}
                          {/* Phase bar */}
                          <div style={{
                            position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, top: '4px', height: '20px',
                            background: st === 'Complete' ? p.color : st === 'In Progress' ? p.color + 'bb' : st === 'On Hold' ? '#ef444466' : p.color + '44',
                            borderRadius: '4px', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${p.color}`,
                            transition: 'background 0.3s',
                          }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: st === 'Not Started' ? p.color : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 4px' }}>
                              {st === 'Complete' ? '✓ Done' : st === 'In Progress' ? '● Active' : st === 'On Hold' ? '⏸ Hold' : 'Phase ' + p.no}
                            </span>
                          </div>
                        </div>

                        {/* Status selector */}
                        <select
                          value={phaseStatus[p.no]}
                          onChange={e => setPhaseStatus(ps => ({ ...ps, [p.no]: e.target.value }))}
                          style={{ marginLeft: '8px', fontSize: '10px', padding: '3px 6px', border: `1px solid ${statusColor[st]}`, borderRadius: '6px',
                            background: statusBg[st], color: statusColor[st], fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: '90px' }}>
                          {['Not Started','In Progress','Complete','On Hold'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Gate labels row */}
                <div style={{ position: 'relative', marginLeft: '180px', marginTop: '8px', height: '30px' }}>
                  {gateOffsets.map((go, gi) => (
                    <div key={gi} style={{ position: 'absolute', left: `${toPercent(go)}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '8px', color: T.navy, fontWeight: 700, lineHeight: 1.2 }}>
                        {gateName[gi].split('\n').map((l, li) => <div key={li}>{l}</div>)}
                      </div>
                      <div style={{ fontSize: '8px', color: T.muted }}>{getMonthLabel(go)}</div>
                    </div>
                  ))}
                  {showToday && (
                    <div style={{ position: 'absolute', left: `${todayPct}%`, transform: 'translateX(-50%)', top: 0 }}>
                      <div style={{ fontSize: '8px', color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap' }}>▲ Today</div>
                    </div>
                  )}
                </div>

                {/* Overall status summary */}
                <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {Object.entries({
                    'Complete': Object.values(phaseStatus).filter(s => s === 'Complete').length,
                    'In Progress': Object.values(phaseStatus).filter(s => s === 'In Progress').length,
                    'Not Started': Object.values(phaseStatus).filter(s => s === 'Not Started').length,
                    'On Hold': Object.values(phaseStatus).filter(s => s === 'On Hold').length,
                  }).map(([label, count]) => (
                    <div key={label} style={{ background: statusBg[label], border: `1px solid ${statusColor[label]}44`, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: statusColor[label] }}>{count}</div>
                      <div style={{ fontSize: '9px', color: statusColor[label], fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '10px', fontSize: '9px', color: T.muted, textAlign: 'right' }}>
                  IATF 16949 §8.1 — Operational Planning | AIAG APQP 4th Edition · Gate reviews per §8.3 design review requirements
                </div>
              </div>
            );
          })()}

          </>
        )}

        {/* ══ TAB 3: ANALYSER ═════════════════════════════════════════════ */}
        {tab === 3 && (
          <>
          {/* -- Download Strip */}
          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="/downloads/apqp/APQP_Phase_Progress_Tracker.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Phase Tracker XLS</a>
            <a href="/downloads/apqp/APQP_Gate_Review_Checklist.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Gate Review Report</a>
            <a href="/downloads/apqp/APQP_KPI_Dashboard.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP KPI Dashboard</a>
            <a href="/downloads/apqp/APQP_Open_Issues_Action_Log.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Risk & Issue Log</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Input */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px' }}>🔍</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: T.navy }}>APQP Health Analyser</div>
                  <div style={{ fontSize: '11px', color: T.muted }}>Select current phase, check completed deliverables → get health score, gap list & risk flags</div>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: T.navy, display: 'block', marginBottom: '8px' }}>Current APQP Phase</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {PHASES.map(p => (
                    <button key={p.no} onClick={() => { setAnaPhase(p.no); setAnaChecked([]); setAnaResult(false); }}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `2px solid ${anaPhase === p.no ? p.color : T.border}`, background: anaPhase === p.no ? p.color + '15' : T.bg, cursor: 'pointer', fontSize: '10px', fontWeight: 700, color: anaPhase === p.no ? p.color : T.muted }}>
                      P{p.no}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: T.muted, marginTop: '6px' }}>Phase {anaPhase}: {PHASES[anaPhase-1].name}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: T.navy, display: 'block', marginBottom: '8px' }}>
                  Completed Deliverables ({anaChecked.length}/{PHASES[anaPhase-1].deliverables.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                  {PHASES[anaPhase-1].deliverables.map(d => (
                    <label key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11px', color: T.text, lineHeight: 1.5 }}>
                      <input type="checkbox" checked={anaChecked.includes(d)}
                        onChange={e => setAnaChecked(prev => e.target.checked ? [...prev, d] : prev.filter(x => x !== d))}
                        style={{ marginTop: '2px', flexShrink: 0 }} />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setAnaResult(true)}
                style={{ width: '100%', padding: '10px', background: T.indigo, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '16px' }}>
                🔍 Analyse APQP Health
              </button>
            </div>

            {/* Result */}
            <div>
              {!anaResult ? (
                <div style={{ background: T.card, border: `2px dashed ${T.border}`, borderRadius: '12px', padding: '40px 24px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '40px' }}>📈</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: T.muted }}>Health Score will appear here</div>
                  <div style={{ fontSize: '11px', color: T.muted, maxWidth: '260px', lineHeight: 1.6 }}>Select a phase, check completed deliverables, then click Analyse to see your APQP health score, gaps, and risk flags</div>
                </div>
              ) : (() => {
                const total = PHASES[anaPhase-1].deliverables.length;
                const done = anaChecked.length;
                const pct = Math.round((done / total) * 100);
                const gaps = PHASES[anaPhase-1].deliverables.filter(d => !anaChecked.includes(d));
                const risks = PHASES[anaPhase-1].risks;
                const scoreColor = pct >= 80 ? T.emerald : pct >= 50 ? T.orange : T.red;
                const scoreLabel = pct >= 80 ? 'HEALTHY' : pct >= 50 ? 'AT RISK' : 'CRITICAL';
                return (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Score */}
                    <div style={{ textAlign: 'center', background: scoreColor + '12', border: `1px solid ${scoreColor}44`, borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '40px', fontWeight: 800, color: scoreColor }}>{pct}%</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: scoreColor, letterSpacing: '1px' }}>{scoreLabel}</div>
                      <div style={{ fontSize: '11px', color: T.muted, marginTop: '4px' }}>Phase {anaPhase} — {done}/{total} deliverables complete</div>
                    </div>
                    {/* Progress bar */}
                    <div>
                      <div style={{ height: '8px', background: T.border, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: scoreColor, borderRadius: '4px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                    {/* Gaps */}
                    {gaps.length > 0 && (
                      <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: T.red, marginBottom: '7px' }}>⚠️ Open Gaps ({gaps.length})</div>
                        {gaps.map(g => (
                          <div key={g} style={{ fontSize: '11px', color: '#7f1d1d', padding: '3px 0', display: 'flex', gap: '6px', borderBottom: '1px solid #fecaca' }}>
                            <span>›</span>{g}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Risk flags */}
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '7px' }}>🚩 Risk Flags for Phase {anaPhase}</div>
                      {risks.map(r => (
                        <div key={r} style={{ fontSize: '11px', color: '#78350f', padding: '3px 0', display: 'flex', gap: '6px' }}>
                          <span>›</span>{r}
                        </div>
                      ))}
                    </div>
                    {/* Recommendation */}
                    <div style={{ background: T.navy, borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: T.amber, marginBottom: '4px' }}>📋 Recommendation</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>
                        {pct === 100 ? 'All Phase ' + anaPhase + ' deliverables complete. Conduct gate review with management sign-off before proceeding to Phase ' + (anaPhase < 5 ? anaPhase + 1 : 'SOP') + '.' :
                         pct >= 80 ? 'Close remaining ' + gaps.length + ' gaps within 1 week. Schedule gate review once all deliverables are complete.' :
                         pct >= 50 ? 'Immediate attention required — escalate open gaps to program manager. Do NOT proceed to next phase without gate review sign-off.' :
                         'CRITICAL — Phase ' + anaPhase + ' is severely behind. Escalate to management. Initiate recovery plan with daily status tracking.'}
                      </div>
                    </div>
                    <button onClick={() => setAnaResult(false)} style={{ fontSize: '11px', color: T.muted, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>Reset Analysis</button>
                  </div>
                );
              })()}
            </div>

          {/* -- Gate Review Generator -------------------------------- */}
          <div style={{marginTop:'24px',background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.07)'}}>
            <div onClick={()=>setShowGateGen(g=>!g)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',background:'#1e40af',borderRadius:showGateGen?'14px 14px 0 0':'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{fontSize:'22px'}}>🔑</span>
                <div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Gate Review Generator</div>
                  <div style={{fontSize:'11px',color:'#bfdbfe'}}>Generate G0–G5 gate review report for customer or management sign-off</div>
                </div>
              </div>
              <span style={{fontSize:'18px',color:'#fff'}}>{showGateGen?'▲':'▼'}</span>
            </div>
            {showGateGen && (
              <div style={{padding:'20px',background:'#fff'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
                  {[
                    {label:'Program / Part Name', key:'program', placeholder:'e.g. BKT-001 Bracket Assembly'},
                    {label:'Customer', key:'customer', placeholder:'e.g. Tata Motors'},
                    {label:'Program Manager', key:'pm', placeholder:'e.g. Rajesh Kumar'},
                    {label:'SOP Date', key:'sopDate', placeholder:'e.g. 2025-10-01'},
                  ].map(f=>(
                    <div key={f.key}>
                      <label style={{fontSize:'11px',fontWeight:700,color:'#1e293b',display:'block',marginBottom:'5px'}}>{f.label}</label>
                      <input value={(gateInfo as any)[f.key]} onChange={e=>setGateInfo(g=>({...g,[f.key]:e.target.value}))}
                        placeholder={f.placeholder}
                        style={{width:'100%',padding:'8px 12px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'12px',color:'#1e293b',outline:'none',boxSizing:'border-box'}} />
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:'16px'}}>
                  <label style={{fontSize:'11px',fontWeight:700,color:'#1e293b',display:'block',marginBottom:'8px'}}>Gate (Select current gate)</label>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    {['G0 — Program Launch','G1 — Concept Freeze','G2 — Design Release','G3 — Process Release','G4 — Trial Run','G5 — PPAP & SOP'].map((g,i)=>(
                      <button key={i} onClick={()=>setGateInfo(gi=>({...gi,phase:String(i)}))}
                        style={{padding:'6px 14px',borderRadius:'20px',fontSize:'11px',fontWeight:700,border:'2px solid',
                          borderColor:gateInfo.phase===String(i)?'#1e40af':'#e2e8f0',
                          background:gateInfo.phase===String(i)?'#1e40af':'#f8fafc',
                          color:gateInfo.phase===String(i)?'#fff':'#475569',cursor:'pointer'}}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Gate report preview */}
                <div style={{background:'#f8fafc',border:'2px solid #1e40af',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
                  <div style={{textAlign:'center',marginBottom:'16px'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'#64748b',letterSpacing:'2px'}}>APQP GATE REVIEW REPORT</div>
                    <div style={{fontSize:'16px',fontWeight:800,color:'#1e293b',margin:'4px 0'}}>{gateInfo.program||'[Program Name]'}</div>
                    <div style={{fontSize:'11px',color:'#64748b'}}>Customer: {gateInfo.customer||'—'} | PM: {gateInfo.pm||'—'} | SOP: {gateInfo.sopDate||'—'}</div>
                    <div style={{display:'inline-block',marginTop:'8px',padding:'4px 16px',borderRadius:'20px',background:'#1e40af',color:'#fff',fontSize:'12px',fontWeight:700}}>
                      Gate {gateInfo.phase}: {['Program Launch','Concept Freeze','Design Release','Process Release','Trial Run','PPAP & SOP'][parseInt(gateInfo.phase)||0]}
                    </div>
                  </div>
                  <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
                    <thead>
                      <tr style={{background:'#1e40af'}}>
                        {['#','Criterion','Status','Owner','Comments'].map(h=>(
                          <th key={h} style={{padding:'6px 10px',color:'#fff',textAlign:'left',fontWeight:700}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['1','Customer requirements signed off','✅ Complete','QA Manager','VOC reviewed'],
                        ['2','Team, timing, resources confirmed','✅ Complete','PM','APQP team formed'],
                        ['3','Feasibility confirmed','✅ Complete','Engineering','Manufacturing feasible'],
                        ['4','DFMEA / PFMEA released','⚠️ In Progress','FMEA Team','Review scheduled'],
                        ['5','Control Plan approved','🔴 Open','QA Engineer','Pending phase 3'],
                        ['6','Trial run ≥300 pcs completed','🔴 Open','Manufacturing','Scheduled Q3'],
                      ].map(row=>(
                        <tr key={row[0]} style={{borderBottom:'1px solid #e2e8f0',background:row[0]==='1'||row[0]==='2'||row[0]==='3'?'#f0fdf4':row[0]==='4'?'#fffbeb':'#fff5f5'}}>
                          {row.map((cell,ci)=><td key={ci} style={{padding:'6px 10px',color:'#1e293b'}}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  <div style={{marginTop:'16px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                    {['Program Manager','Quality Manager','Plant Head'].map(role=>(
                      <div key={role} style={{borderTop:'2px solid #1e293b',paddingTop:'6px',textAlign:'center'}}>
                        <div style={{fontSize:'10px',fontWeight:700,color:'#64748b'}}>{role}</div>
                        <div style={{fontSize:'9px',color:'#94a3b8',marginTop:'2px'}}>Signature & Date</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={()=>window.print()} style={{width:'100%',padding:'10px',background:'#1e40af',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                  🖨️ Print Gate Review Report
                </button>
              </div>
            )}
          </div>

          {/* -- Launch Readiness Checklist ---------------------------- */}
          <div style={{marginTop:'16px',background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',marginBottom:'8px'}}>
            <div onClick={()=>setShowLaunchReady(g=>!g)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',background:'#059669',borderRadius:showLaunchReady?'14px 14px 0 0':'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{fontSize:'22px'}}>🚀</span>
                <div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Launch Readiness Checklist (G0–G5)</div>
                  <div style={{fontSize:'11px',color:'#a7f3d0'}}>Verify all gates cleared before SOP — zero escapes to customer</div>
                </div>
              </div>
              <span style={{fontSize:'18px',color:'#fff'}}>{showLaunchReady?'▲':'▼'}</span>
            </div>
            {showLaunchReady && (
              <div style={{padding:'20px'}}>
                {LAUNCH_ITEMS.map((item,i)=>(
                  <label key={i} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'10px 0',borderBottom:'1px solid #f1f5f9',cursor:'pointer'}}>
                    <input type="checkbox" checked={!!launchChecks[i]}
                      onChange={e=>setLaunchChecks(p=>({...p,[i]:e.target.checked}))}
                      style={{marginTop:'2px',width:'15px',height:'15px',flexShrink:0,accentColor:'#059669'}} />
                    <span style={{fontSize:'12px',color:launchChecks[i]?'#059669':'#1e293b',fontWeight:launchChecks[i]?700:400,textDecoration:launchChecks[i]?'line-through':'none',lineHeight:1.5}}>
                      {item}
                    </span>
                  </label>
                ))}
                {/* Score bar */}
                {(() => {
                  const done = Object.values(launchChecks).filter(Boolean).length;
                  const total = LAUNCH_ITEMS.length;
                  const pct = Math.round((done/total)*100);
                  const ok = done === total;
                  return (
                    <div style={{marginTop:'16px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',fontWeight:700,color:'#1e293b',marginBottom:'6px'}}>
                        <span>Launch Readiness</span>
                        <span style={{color:ok?'#059669':'#dc2626'}}>{done}/{total} ({pct}%)</span>
                      </div>
                      <div style={{height:'10px',background:'#e2e8f0',borderRadius:'5px',overflow:'hidden',marginBottom:'12px'}}>
                        <div style={{width:`${pct}%`,height:'100%',background:ok?'#059669':pct>=70?'#d97706':'#dc2626',borderRadius:'5px',transition:'width 0.4s'}} />
                      </div>
                      {ok && (
                        <div style={{background:'#f0fdf4',border:'2px solid #059669',borderRadius:'10px',padding:'14px',textAlign:'center'}}>
                          <div style={{fontSize:'20px',marginBottom:'4px'}}>✅</div>
                          <div style={{fontSize:'13px',fontWeight:800,color:'#059669'}}>ALL GATES CLEARED — CLEARED FOR LAUNCH</div>
                          <div style={{fontSize:'11px',color:'#16a34a',marginTop:'3px'}}>All G0–G5 criteria met. Customer SOP shipment authorised.</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          </div>
          </>
        )}

        {/* ══ TAB 4: INTERVIEW Q&A ═════════════════════════════════════════ */}
        {tab === 4 && (
          <div>
          {/* -- Download Strip */}
          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="/downloads/apqp/APQP_200_QA_Interview_Prep.xlsx" download style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP 200 Q&A Excel</a>
              <a href="/downloads/apqp/APQP_Training_PPT_AIAG_3rdEdition.pptx" download style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Training PPT</a>
              <a href="/downloads/apqp/APQP_Audit_Checklist.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Audit Checklist</a>
              <a href="/downloads/apqp/APQP_Lessons_Learned_Template.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#d97706",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Lessons Learned</a>
          </div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>

              {(['All','Beginner','Engineer','Auditor'] as const).map(f => (
                <button key={f} onClick={() => setQFilter(f)} style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: qFilter === f ? T.navy : T.card,
                  color: qFilter === f ? '#fff' : T.text,
                  border: `1px solid ${qFilter === f ? T.navy : T.border}`,
                  cursor: 'pointer',
                }}>{f === 'All' ? `All (${QA_BANK.length}+)` : `${f} (${QA_BANK.filter(q=>q.level===f).length})`}</button>
              ))}
              <input
                placeholder="Search questions..."
                value={qSearch}
                onChange={e => setQSearch(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '7px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', background: T.card, color: T.text, outline: 'none' }}
              />
              <span style={{ fontSize: '12px', color: T.muted }}>{filteredQA.length} questions</span>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              {[['Beginner','#10b981'],['Engineer','#6366f1'],['Auditor','#ef4444']].map(([l,c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.muted }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c as string }} />{l}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredQA.map((qa, i) => {
                const levelColor = qa.level === 'Beginner' ? '#10b981' : qa.level === 'Engineer' ? '#6366f1' : '#ef4444';
                return (
                  <div key={i} style={{ background: T.card, border: `1px solid ${openQ === i ? levelColor : T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <button onClick={() => setOpenQ(openQ === i ? null : i)}
                      style={{ width: '100%', display: 'flex', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: levelColor + '18', color: levelColor, flexShrink: 0 }}>{qa.level}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: T.navy, flex: 1 }}>Q{i + 1}. {qa.q}</span>
                      <span style={{ color: T.muted, fontSize: '14px', flexShrink: 0 }}>{openQ === i ? '▲' : '▼'}</span>
                    </button>
                    {openQ === i && (
                      <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${T.border}` }}>
                        <p style={{ fontSize: '12px', color: T.text, lineHeight: 1.8, marginTop: '10px' }}>{qa.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Teaser for more */}
              <div style={{ background: T.navy, borderRadius: '10px', padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: T.amber }}>+ 175 more questions in the full APQP Q&A bank</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Covers: Phase inputs/outputs · Special characteristics · PPAP linkage · Customer-specific requirements · Calculations · Real audit scenarios</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 5: TEMPLATES ════════════════════════════════════════════ */}
        {tab === 5 && (
          <div>
            {/* Download Strip */}
            <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
              <a href="/downloads/apqp/APQP_Master_Checklist.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Master Checklist</a>
              <a href="/downloads/apqp/APQP_Control_Plan_Template.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Control Plan Template</a>
              <a href="/downloads/apqp/APQP_PFMEA_Template.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>PFMEA Template</a>
              <a href="/downloads/apqp/APQP_Timing_Plan_Master.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Timing Plan XLS</a>
            </div>
            <p style={{ fontSize: '13px', color: T.muted, marginBottom: '20px' }}>All APQP templates in AIAG-aligned format. Download, customize with your company details, and use immediately.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {TEMPLATES.map(t => (
                <div key={t.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: t.file.endsWith('.pdf') ? 'pointer' : 'default' }} onDoubleClick={() => t.file.endsWith('.pdf') && window.open(t.file, '_blank')} title={t.file.endsWith('.pdf') ? 'Double-click to view' : ''}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: t.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: T.navy }}>{t.name}</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: t.type === 'Excel' ? '#d1fae5' : '#dbeafe', color: t.type === 'Excel' ? '#065f46' : '#1e40af' }}>{t.type}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: T.muted, lineHeight: 1.5, margin: '0 0 10px' }}>{t.desc}</p>
                    <a href={t.file} download style={{ textDecoration: 'none' }}>
                      <button style={{ fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '6px', background: T.navy, color: T.amber, border: 'none', cursor: 'pointer' }}>
                        ↓ Download Template
                      </button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 6: SUPPORTING DOCS ══════════════════════════════════════ */}
        {tab === 6 && (
          <>

          {/* -- Download Strip */}

          {/* -- Download Strip */}
          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="/downloads/apqp/APQP_vs_PPAP_Relationship.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#0e7490",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP vs PPAP PDF</a>
            <a href="/downloads/apqp/APQP_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>IATF Clause Map</a>
            <a href="/downloads/apqp/APQP_Lessons_Learned_Template.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#d97706",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Lessons Learned</a>
            <a href="/downloads/apqp/APQP_Risk_Register_Template.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Risk Register</a>
          </div>

          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="downloads/apqp/APQP_Master_Checklist.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Master Checklist</a>
            <a href="downloads/apqp/APQP_Control_Plan_Template.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Control Plan Template</a>
            <a href="downloads/apqp/APQP_PFMEA_Template.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>PFMEA Template</a>
            <a href="downloads/apqp/APQP_Timing_Plan_Master.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Timing Plan XLS</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {SUPPORTING.map(s => (
              <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', gap: '12px', cursor: 'pointer' }} onDoubleClick={() => window.open(s.file, '_blank')} title='Double-click to view'>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: T.navy, marginBottom: '4px' }}>{s.title}</div>
                  <p style={{ fontSize: '11px', color: T.muted, lineHeight: 1.6, margin: '0 0 10px' }}>{s.desc}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={s.file} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <button style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '6px', background: T.bg, color: T.navy, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                        View PDF →
                      </button>
                    </a>
                    <a href={s.file} download style={{ textDecoration: 'none' }}>
                      <button style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '6px', background: T.navy, color: T.amber, border: 'none', cursor: 'pointer' }}>
                        ↓ Download
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

        {/* ══ TAB 7: POSTERS & BANNERS ════════════════════════════════════ */}
        {tab === 7 && (
          <div>

          {/* -- Download Strip */}
          <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
            <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
            <a href="/downloads/apqp/APQP_Phase_Flow_Poster.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP 5-Phase Poster</a>
            <a href="/downloads/apqp/APQP_Complete_Roadmap_Poster.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>APQP Roadmap Poster</a>
            <a href="/downloads/apqp/APQP_Core_Tools_Overview_Poster.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Core Tools Poster</a>
            <a href="/downloads/apqp/APQP_Quality_KPIs_Banner.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Quality KPI Banner</a>
          </div>

            <p style={{ fontSize: '13px', color: T.muted, marginBottom: '20px' }}>
              Print-ready visual posters and banners for factory walls, meeting rooms, and training sessions. All designed for A1/A2/A3 format.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {POSTERS.map(p => (
                <div key={p.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }} onDoubleClick={() => window.open(p.file, '_blank')} title='Double-click to view'>
                  {/* Poster preview */}
                  <div style={{ height: '140px', background: `linear-gradient(135deg, ${p.colors[0]}22, ${p.colors[1] || p.colors[0]}44)`, borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative', padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                      {p.colors.map((c, i) => <div key={i} style={{ width: '20px', height: '20px', borderRadius: '5px', background: c }} />)}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: p.colors[0], textAlign: 'center' }}>{p.title}</div>
                    <div style={{ fontSize: '9px', color: T.muted, padding: '2px 8px', background: '#fff', borderRadius: '10px' }}>{p.size}</div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: T.navy, marginBottom: '6px' }}>{p.title}</div>
                    <p style={{ fontSize: '11px', color: T.muted, lineHeight: 1.5, margin: '0 0 12px' }}>{p.desc}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={p.file} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ width: '100%', fontSize: '11px', fontWeight: 600, padding: '6px', borderRadius: '6px', background: T.navy, color: T.amber, border: 'none', cursor: 'pointer' }}>
                          🖨️ View / Print
                        </button>
                      </a>
                      <a href={p.file} download style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ width: '100%', fontSize: '11px', fontWeight: 600, padding: '6px', borderRadius: '6px', background: T.bg, color: T.navy, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                          ↓ Download
                        </button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info banner */}
            <div style={{ marginTop: '20px', background: T.navy, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '28px' }}>🖨️</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: T.amber }}>Print & Display in Your Factory</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>All posters are formatted for A1/A2/A3 printing. Recommended: Laminate and display near workstations, quality lab, and meeting rooms. Same posters available for all 6 Core Tools.</div>
              </div>
            </div>
          </div>
        )}


        {/* ══ TAB 8: DASHBOARD ═══════════════════════════════════════════ */}
        {tab === 8 && (
          <div>
            {/* Download Strip */}
            <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
              <a href="/downloads/apqp/APQP_KPI_Dashboard.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>KPI Dashboard XLS</a>
              <a href="/downloads/apqp/APQP_Phase_Progress_Tracker.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Phase Progress Tracker</a>
              <a href="/downloads/apqp/APQP_Open_Issues_Action_Log.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Risk & Issue Log</a>
              <a href="/downloads/apqp/APQP_Launch_Readiness_Report.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Launch Readiness</a>
            </div>
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
              <div>
                <div style={{fontSize:'18px',fontWeight:800,color:'#1e293b'}}>📊 APQP Program Dashboard</div>
                <div style={{fontSize:'12px',color:'#64748b'}}>Real-time view of phase completion, gate status, and risk flags across your APQP program</div>
              </div>
              <div style={{fontSize:'11px',color:'#94a3b8',background:'#f1f5f9',padding:'4px 12px',borderRadius:'20px'}}>BKT-001 | Tata Motors</div>
            </div>
            {/* KPI Cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'20px'}}>
              {[
                {label:'Overall Completion',value:'68%',icon:'📈',color:'#1e40af',sub:'Phases 1-3 complete'},
                {label:'Open Issues',value:'7',icon:'⚠️',color:'#dc2626',sub:'3 critical, 4 minor'},
                {label:'Gate Status',value:'G3',icon:'🔑',color:'#059669',sub:'Process Release gate'},
                {label:'Days to SOP',value:'47',icon:'📅',color:'#7c3aed',sub:'Target: Oct 2025'},
              ].map(k=>(
                <div key={k.label} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                    <span style={{fontSize:'20px'}}>{k.icon}</span>
                    <div style={{fontSize:'11px',color:'#64748b',fontWeight:600}}>{k.label}</div>
                  </div>
                  <div style={{fontSize:'24px',fontWeight:800,color:k.color}}>{k.value}</div>
                  <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'3px'}}>{k.sub}</div>
                </div>
              ))}
            </div>
            {/* Phase Progress Bars */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'20px',marginBottom:'16px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#1e293b',marginBottom:'16px'}}>📋 Phase Completion Status</div>
              {PHASE_DELIVERABLES.map(ph=>(
                <div key={ph.phase} style={{marginBottom:'14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'14px'}}>{ph.icon}</span>
                      <span style={{fontSize:'12px',fontWeight:700,color:'#1e293b'}}>Phase {ph.phase}: {ph.name}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,color:ph.phase<=3?ph.color:'#94a3b8'}}>{ph.phase<=3?'COMPLETE':ph.phase===4?'IN PROGRESS':'PENDING'}</span>
                      <span style={{fontSize:'11px',color:'#94a3b8'}}>{ph.phase<=3?'100%':ph.phase===4?'45%':'0%'}</span>
                    </div>
                  </div>
                  <div style={{height:'8px',background:'#f1f5f9',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{width:ph.phase<=3?'100%':ph.phase===4?'45%':'0%',height:'100%',background:ph.color,borderRadius:'4px',transition:'width 0.5s'}} />
                  </div>
                </div>
              ))}
            </div>
            {/* Gate Status Timeline */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'20px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#1e293b',marginBottom:'16px'}}>🔑 Gate Review Timeline (G0–G5)</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{position:'absolute',top:'20px',left:'0',right:'0',height:'3px',background:'#e2e8f0',zIndex:0}} />
                {[
                  {g:'G0',name:'Launch',status:'done',date:'Jan 24'},
                  {g:'G1',name:'Concept',status:'done',date:'Feb 24'},
                  {g:'G2',name:'Design',status:'done',date:'Apr 24'},
                  {g:'G3',name:'Process',status:'active',date:'Jul 24'},
                  {g:'G4',name:'Trial',status:'pending',date:'Sep 24'},
                  {g:'G5',name:'PPAP/SOP',status:'pending',date:'Oct 24'},
                ].map(g=>(
                  <div key={g.g} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',zIndex:1,flex:1}}>
                    <div style={{width:'40px',height:'40px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                      background:g.status==='done'?'#059669':g.status==='active'?'#1e40af':'#e2e8f0',
                      border:`3px solid ${g.status==='done'?'#059669':g.status==='active'?'#1e40af':'#cbd5e1'}`,
                      color:g.status==='pending'?'#94a3b8':'#fff',fontWeight:800,fontSize:'11px'}}>
                      {g.status==='done'?'✓':g.g}
                    </div>
                    <div style={{fontSize:'10px',fontWeight:700,color:g.status==='pending'?'#94a3b8':'#1e293b',textAlign:'center'}}>{g.name}</div>
                    <div style={{fontSize:'9px',color:'#94a3b8',textAlign:'center'}}>{g.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 9: PHASE DEEP DIVE ══════════════════════════════════════ */}
        {tab === 9 && (
          <div>
            {/* Download Strip */}
            <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
              <a href="/downloads/apqp/APQP_Phase1_Customer_Inputs_Checklist.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Phase 1 Checklist</a>
              <a href="/downloads/apqp/APQP_Phase2_Design_Verification_Plan.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Phase 2 Checklist</a>
              <a href="/downloads/apqp/APQP_Phase3_Process_Design_Checklist.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#d97706",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Phase 3 Checklist</a>
              <a href="/downloads/apqp/APQP_Phase4_Validation_Checklist.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Phase 4 Checklist</a>
            </div>
            <div style={{fontSize:'18px',fontWeight:800,color:'#1e293b',marginBottom:'6px'}}>🧩 Phase-by-Phase Deep Dive</div>
            <div style={{fontSize:'12px',color:'#64748b',marginBottom:'20px'}}>Detailed deliverables, inputs, outputs, and common mistakes for each APQP phase — aligned to AIAG 3rd Edition</div>
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {PHASE_DELIVERABLES.map(ph=>(
                <div key={ph.phase} style={{background:'#fff',border:`2px solid ${ph.color}33`,borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                  <div style={{background:ph.color,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      <span style={{fontSize:'24px'}}>{ph.icon}</span>
                      <div>
                        <div style={{fontSize:'15px',fontWeight:800,color:'#fff'}}>Phase {ph.phase}: {ph.name}</div>
                        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>AIAG APQP 3rd Edition — {ph.items.length} key deliverables</div>
                      </div>
                    </div>
                  </div>
                  <div style={{padding:'16px 20px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      {ph.items.map((item,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'8px',padding:'7px 10px',background:`${ph.color}08`,borderRadius:'8px',border:`1px solid ${ph.color}22`}}>
                          <span style={{color:ph.color,fontWeight:800,fontSize:'11px',flexShrink:0}}>{i+1}.</span>
                          <span style={{fontSize:'11px',color:'#1e293b',lineHeight:1.5}}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 10: WORKFLOW ════════════════════════════════════════════ */}
        {tab === 10 && (
          <div>
            {/* Download Strip */}
            <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
              <a href="/downloads/apqp/APQP_Process_Flow_Template.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Process Flow XLS</a>
              <a href="/downloads/apqp/APQP_Timing_Plan_Master.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Timing Plan XLS</a>
              <a href="/downloads/apqp/APQP_RACI_Matrix.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>RACI Matrix PDF</a>
              <a href="/downloads/apqp/APQP_Complete_Roadmap_Poster.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Full Roadmap Poster</a>
            </div>
            <div style={{fontSize:'18px',fontWeight:800,color:'#1e293b',marginBottom:'6px'}}>🔄 APQP Workflow & RACI</div>
            <div style={{fontSize:'12px',color:'#64748b',marginBottom:'20px'}}>End-to-end workflow from customer RFQ to SOP shipment — who does what, when, and how</div>
            {/* Workflow Steps */}
            <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
              {[
                {step:1,phase:'P1',action:'Receive Customer RFQ & Requirements',who:'Sales / Program Mgr',tool:'VOC, CTQ Analysis',gate:'G0',color:'#1e40af'},
                {step:2,phase:'P1',action:'Conduct Feasibility Study (Manufacturing & Quality)',who:'Eng + Quality + Mfg',tool:'DFM/DFA, Feasibility Matrix',gate:'G1',color:'#1e40af'},
                {step:3,phase:'P1',action:'Form APQP Cross-Function Team & Assign RACI',who:'Program Manager',tool:'APQP Timing Plan',gate:'G1',color:'#1e40af'},
                {step:4,phase:'P2',action:'Release Engineering Drawings & DFMEA',who:'Design Engineering',tool:'CAD, DFMEA (AIAG)',gate:'G2',color:'#059669'},
                {step:5,phase:'P2',action:'Design Review & DVP&R Plan',who:'Design + QA',tool:'Design Review Checklist',gate:'G2',color:'#059669'},
                {step:6,phase:'P3',action:'Develop Process Flow Diagram (PFD)',who:'Manufacturing Eng',tool:'Value Stream Mapping',gate:'G3',color:'#d97706'},
                {step:7,phase:'P3',action:'Complete PFMEA & Pre-Launch Control Plan',who:'QA + Mfg Eng',tool:'AIAG FMEA 1st Ed.',gate:'G3',color:'#d97706'},
                {step:8,phase:'P4',action:'Production Trial Run (≥300 pcs, 8 hrs)',who:'Manufacturing',tool:'MSA, SPC, Capability',gate:'G4',color:'#7c3aed'},
                {step:9,phase:'P4',action:'Submit PPAP Package to Customer',who:'Quality Manager',tool:'PPAP 4th Edition',gate:'G5',color:'#7c3aed'},
                {step:10,phase:'P5',action:'SOP Shipment & Continuous Improvement',who:'QA + Plant Head',tool:'CAPA, Cpk, Warranty',gate:'SOP',color:'#dc2626'},
              ].map((s,i)=>(
                <div key={s.step} style={{display:'flex',gap:'0',alignItems:'stretch'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:'40px',flexShrink:0}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:s.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:'11px',flexShrink:0,marginTop:'8px'}}>{s.step}</div>
                    {i<9&&<div style={{width:'2px',flex:1,background:`${s.color}44`,marginTop:'4px'}} />}
                  </div>
                  <div style={{flex:1,margin:'8px 0 8px 12px',background:'#fff',border:`1px solid ${s.color}33`,borderRadius:'10px',padding:'12px 16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                      <div style={{fontSize:'12px',fontWeight:700,color:'#1e293b'}}>{s.action}</div>
                      <span style={{fontSize:'10px',fontWeight:700,color:'#fff',background:s.color,padding:'2px 8px',borderRadius:'10px',flexShrink:0,marginLeft:'8px'}}>{s.gate}</span>
                    </div>
                    <div style={{display:'flex',gap:'16px',fontSize:'11px',color:'#64748b'}}>
                      <span>👤 {s.who}</span>
                      <span>🔧 {s.tool}</span>
                      <span style={{fontWeight:600,color:s.color}}>Phase {s.phase}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 11: CASE STUDIES ════════════════════════════════════════ */}
        {tab === 11 && (
          <div>
            {/* Download Strip */}
            <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
              <a href="/downloads/apqp/APQP_Case_Study_BKT001_Tata.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>BKT-001 Case Study</a>
              <a href="/downloads/apqp/APQP_Lessons_Learned_Template.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Lessons Learned Template</a>
              <a href="/downloads/apqp/APQP_Failure_Mode_Library.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Failure Mode Library</a>
              <a href="/downloads/apqp/APQP_Risk_Register_Template.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Risk Register</a>
            </div>
            <div style={{fontSize:'18px',fontWeight:800,color:'#1e293b',marginBottom:'6px'}}>📂 APQP Case Studies — Real World Examples</div>
            <div style={{fontSize:'12px',color:'#64748b',marginBottom:'20px'}}>Learn from real APQP programs — what worked, what failed, and the lessons captured for future launches</div>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              {[
                {
                  id:'CS-001', part:'BKT-001 Bracket Assembly', customer:'Tata Motors', plant:'Pune Plant',
                  status:'SUCCESS', phases:'P1–P5 complete', outcome:'SOP achieved on time, 0 customer complaints in 12 months',
                  color:'#059669', tag:'OEM Launch',
                  problem:'Phase 3 PFMEA was delayed by 3 weeks due to tooling change after design revision.',
                  rootCause:'Engineering change not communicated to APQP team — no change management process.',
                  lesson:'Implement Engineering Change Notification (ECN) linked to APQP plan. Any design change must trigger PFMEA review.',
                  bestPractice:'Lock design at G2. No changes after process design starts without APQP team approval.',
                },
                {
                  id:'CS-002', part:'HUB-203 Wheel Hub', customer:'Maruti Suzuki', plant:'Manesar Plant',
                  status:'DELAYED', phases:'P1–P4, G4 failed first attempt', outcome:'SOP delayed 6 weeks — trial run Ppk 1.21 (below 1.67)',
                  color:'#dc2626', tag:'Quality Escape',
                  problem:'Production trial run failed — dimensional Cpk on critical bore diameter was 1.21 vs required 1.67.',
                  rootCause:'Fixture design error — fixture wear not validated. Gauge R&R study done after tooling approved.',
                  lesson:'MSA and Gauge R&R must be completed BEFORE production trial run. Fixture validation is a P3 deliverable.',
                  bestPractice:'Add "Gauge R&R ≤10% completed" as gate criteria for G3. Never run trials with unvalidated gauges.',
                },
                {
                  id:'CS-003', part:'LINK-410 Tie Rod End', customer:'Mahindra', plant:'Nashik Plant',
                  status:'SUCCESS', phases:'Accelerated APQP in 90 days', outcome:'Emergency launch — customer line stoppage risk. 0 defects at SOP.',
                  color:'#7c3aed', tag:'Accelerated Launch',
                  problem:'Existing supplier failed. Emergency supplier qualification required within 90 days.',
                  rootCause:'N/A — proactive risk. Previous supplier had financial issues.',
                  lesson:'Concurrent APQP phases (P2+P3 simultaneous) are possible with daily war room reviews and dedicated cross-function team.',
                  bestPractice:'Maintain approved alternate supplier database. Run APQP parallel phases only with senior management oversight.',
                },
              ].map(cs=>(
                <div key={cs.id} style={{background:'#fff',border:`2px solid ${cs.color}33`,borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                  {/* Header */}
                  <div style={{background:`${cs.color}12`,borderBottom:`1px solid ${cs.color}33`,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                        <span style={{fontSize:'10px',fontWeight:700,color:'#fff',background:cs.color,padding:'2px 10px',borderRadius:'10px'}}>{cs.id}</span>
                        <span style={{fontSize:'10px',fontWeight:700,color:cs.color,background:`${cs.color}15`,padding:'2px 10px',borderRadius:'10px',border:`1px solid ${cs.color}44`}}>{cs.tag}</span>
                      </div>
                      <div style={{fontSize:'15px',fontWeight:800,color:'#1e293b'}}>{cs.part}</div>
                      <div style={{fontSize:'11px',color:'#64748b'}}>Customer: {cs.customer} | Plant: {cs.plant} | Phases: {cs.phases}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'11px',fontWeight:700,color:cs.color,background:`${cs.color}15`,padding:'4px 12px',borderRadius:'8px',border:`1px solid ${cs.color}44`}}>{cs.status}</div>
                      <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'4px',maxWidth:'180px',textAlign:'right'}}>{cs.outcome}</div>
                    </div>
                  </div>
                  {/* Body */}
                  <div style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div style={{background:'#fff5f5',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px'}}>
                      <div style={{fontSize:'11px',fontWeight:700,color:'#dc2626',marginBottom:'6px'}}>⚠️ Problem Encountered</div>
                      <div style={{fontSize:'11px',color:'#7f1d1d',lineHeight:1.6}}>{cs.problem}</div>
                    </div>
                    <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'8px',padding:'12px'}}>
                      <div style={{fontSize:'11px',fontWeight:700,color:'#92400e',marginBottom:'6px'}}>🔍 Root Cause</div>
                      <div style={{fontSize:'11px',color:'#78350f',lineHeight:1.6}}>{cs.rootCause}</div>
                    </div>
                    <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'12px'}}>
                      <div style={{fontSize:'11px',fontWeight:700,color:'#15803d',marginBottom:'6px'}}>💡 Lesson Learned</div>
                      <div style={{fontSize:'11px',color:'#14532d',lineHeight:1.6}}>{cs.lesson}</div>
                    </div>
                    <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'12px'}}>
                      <div style={{fontSize:'11px',fontWeight:700,color:'#1e40af',marginBottom:'6px'}}>⭐ Best Practice Applied</div>
                      <div style={{fontSize:'11px',color:'#1e3a8a',lineHeight:1.6}}>{cs.bestPractice}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 12: TRAINING ACADEMY ════════════════════════════════════ */}
        {tab === 12 && (
          <div>
            {/* Download Strip */}
            <div style={{background:"#f1f5f9",borderRadius:"12px",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <span style={{color:"#fff",fontSize:"12px",fontWeight:700,marginRight:"6px"}}>📥 Downloads:</span>
              <a href="/downloads/apqp/APQP_Training_PPT_AIAG_3rdEdition.pptx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#7c3aed",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Training PPT (PPTX)</a>
              <a href="/downloads/apqp/APQP_200_QA_Interview_Prep.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#059669",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>200 Q&A Excel</a>
              <a href="/downloads/apqp/APQP_Audit_Checklist.pdf" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#dc2626",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Audit Checklist</a>
              <a href="/downloads/apqp/APQP_Competency_Matrix.xlsx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"8px",background:"#1e40af",color:"#fff",fontSize:"11px",fontWeight:700,textDecoration:"none"}}>Competency Matrix</a>
            </div>
            <div style={{fontSize:'18px',fontWeight:800,color:'#1e293b',marginBottom:'6px'}}>🎓 APQP Training Academy</div>
            <div style={{fontSize:'12px',color:'#64748b',marginBottom:'20px'}}>Structured training path from Beginner to Auditor level — build APQP competency across your team</div>
            {/* Training Levels */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'20px'}}>
              {[
                {level:'Level 1',title:'APQP Awareness',role:'Operators / Technicians',color:'#059669',icon:'🌱',duration:'4 hours',topics:[
                  'What is APQP and why it matters',
                  'The 5 phases overview (simple)',
                  'Your role in the APQP process',
                  'APQP documents you will sign',
                  'Quality at source — zero defects mindset',
                ]},
                {level:'Level 2',title:'APQP Practitioner',role:'Engineers / QA Staff',color:'#1e40af',icon:'⚙️',duration:'2 days',topics:[
                  'AIAG APQP 3rd Edition deep dive',
                  'Phase deliverables (inputs/outputs)',
                  'PFMEA & Control Plan linkage',
                  'MSA, SPC, and capability studies',
                  'PPAP submission preparation',
                ]},
                {level:'Level 3',title:'APQP Lead/Auditor',role:'Quality Head / Managers',color:'#7c3aed',icon:'🏆',duration:'3 days + exam',topics:[
                  'IATF 16949 Clause mapping to APQP',
                  'Gate review facilitation skills',
                  'Customer-specific requirements (CSR)',
                  'Supplier APQP management',
                  'Leading APQP audits & assessments',
                ]},
              ].map(t=>(
                <div key={t.level} style={{background:'#fff',border:`2px solid ${t.color}33`,borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                  <div style={{background:t.color,padding:'16px 18px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                      <span style={{fontSize:'20px'}}>{t.icon}</span>
                      <div>
                        <div style={{fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.7)',letterSpacing:'1px'}}>{t.level}</div>
                        <div style={{fontSize:'14px',fontWeight:800,color:'#fff'}}>{t.title}</div>
                      </div>
                    </div>
                    <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{t.role}</div>
                    <div style={{fontSize:'10px',color:'rgba(255,255,255,0.6)',marginTop:'4px'}}>⏱ {t.duration}</div>
                  </div>
                  <div style={{padding:'14px 16px'}}>
                    {t.topics.map((tp,i)=>(
                      <div key={i} style={{display:'flex',gap:'8px',padding:'5px 0',borderBottom:'1px solid #f1f5f9',fontSize:'11px',color:'#475569'}}>
                        <span style={{color:t.color,fontWeight:700,flexShrink:0}}>✓</span>{tp}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Competency Matrix */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'20px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#1e293b',marginBottom:'14px'}}>📊 Team Competency Matrix — APQP Core Skills</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
                  <thead>
                    <tr style={{background:'#f1f5f9'}}>
                      {['Role','Phase 1','Phase 2','Phase 3','Phase 4','Phase 5','PFMEA','Control Plan','SPC/MSA','PPAP','IATF Clause'].map(h=>(
                        <th key={h} style={{padding:'8px 10px',color:'#fff',textAlign:'left',fontWeight:700,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Quality Head','L3','L3','L3','L3','L3','L3','L3','L3','L3','L3'],
                      ['Quality Manager','L3','L3','L3','L3','L2','L3','L3','L2','L3','L2'],
                      ['Quality Engineer','L2','L2','L2','L2','L1','L2','L2','L2','L2','L1'],
                      ['Mfg Engineer','L2','L2','L3','L2','L1','L2','L2','L1','L1','L1'],
                      ['Operator','L1','L1','L1','L1','L1','—','L1','—','—','—'],
                    ].map((row,ri)=>(
                      <tr key={ri} style={{background:ri%2===0?'#f8fafc':'#fff',borderBottom:'1px solid #e2e8f0'}}>
                        {row.map((cell,ci)=>(
                          <td key={ci} style={{padding:'7px 10px',color:cell==='L3'?'#7c3aed':cell==='L2'?'#1e40af':cell==='L1'?'#059669':'#94a3b8',fontWeight:cell!=='—'?700:400}}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{display:'flex',gap:'16px',marginTop:'10px',fontSize:'10px',color:'#64748b'}}>
                  <span>🟣 <b>L3</b> = Lead / Audit</span>
                  <span>🔵 <b>L2</b> = Practitioner</span>
                  <span>🟢 <b>L1</b> = Awareness</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 13: GANTT TIMELINE ══════════════════════════════════════ */}
        {tab === 13 && (() => {
          // -- helpers
          const pct = (mo: number) => ((mo - GANTT_START) / TOTAL_MONTHS) * 100;
          const sopMs  = gantt.sopDate ? new Date(gantt.sopDate).getTime() : null;
          const todayPct = sopMs ? (() => {
            const diffMonths = (Date.now() - sopMs) / (1000 * 60 * 60 * 24 * 30.44);
            return Math.max(0, Math.min(100, pct(diffMonths)));
          })() : null;

          const STATUS_COL: Record<string,string> = {
            'Not Started': '#64748b', 'In Progress': '#f59e0b',
            'Complete': '#10b981',    'On Hold': '#ef4444',
          };

          return (
            <div>
              {/* -- Header bar ------------------------------------------- */}
              <div style={{ background:'#0f172a', borderRadius:'12px', padding:'16px 20px', marginBottom:'16px', display:'flex', flexWrap:'wrap', gap:'12px', alignItems:'flex-end' }}>
                <div>
                  <div style={{ fontSize:'10px', color:'#64748b', marginBottom:'3px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Part / Program</div>
                  <input value={gantt.partName} onChange={e=>setGantt(g=>({...g,partName:e.target.value}))}
                    placeholder="e.g. Seat Frame Assembly"
                    style={{ background:'#f1f5f9', border:'1px solid #334155', borderRadius:'8px', padding:'6px 10px', color:'#f1f5f9', fontSize:'13px', width:'190px' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:'#64748b', marginBottom:'3px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Customer</div>
                  <input value={gantt.customer} onChange={e=>setGantt(g=>({...g,customer:e.target.value}))}
                    placeholder="e.g. Tata Motors"
                    style={{ background:'#f1f5f9', border:'1px solid #334155', borderRadius:'8px', padding:'6px 10px', color:'#f1f5f9', fontSize:'13px', width:'160px' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:'#64748b', marginBottom:'3px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>APQP PM</div>
                  <input value={gantt.pm} onChange={e=>setGantt(g=>({...g,pm:e.target.value}))}
                    placeholder="Project Manager"
                    style={{ background:'#f1f5f9', border:'1px solid #334155', borderRadius:'8px', padding:'6px 10px', color:'#f1f5f9', fontSize:'13px', width:'150px' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:'#64748b', marginBottom:'3px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>SOP Date (Start of Production)</div>
                  <input type="date" value={gantt.sopDate} onChange={e=>setGantt(g=>({...g,sopDate:e.target.value}))}
                    style={{ background:'#f1f5f9', border:'1px solid #334155', borderRadius:'8px', padding:'6px 10px', color:'#f1f5f9', fontSize:'13px', width:'160px' }} />
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center' }}>
                  {gantt.sopDate && <span style={{ fontSize:'11px', color:'#6ee7b7', background:'#10b98115', border:'1px solid #10b98140', borderRadius:'20px', padding:'4px 10px' }}>SOP: {new Date(gantt.sopDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>}
                  <button onClick={()=>window.print()} style={{ padding:'7px 14px', borderRadius:'8px', border:'1px solid #334155', background:'transparent', color:'#94a3b8', fontSize:'12px', cursor:'pointer' }}>🖨 Print</button>
                </div>
              </div>

              {/* -- Gantt Chart ------------------------------------------ */}
              <div style={{ background:'#0f172a', borderRadius:'12px', padding:'20px', marginBottom:'16px', overflowX:'auto' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#f1f5f9', marginBottom:'16px' }}>
                  📅 APQP Timeline
                  {gantt.partName && <span style={{ color:'#94a3b8', fontWeight:400, marginLeft:'8px' }}>— {gantt.partName}{gantt.customer ? ` · ${gantt.customer}` : ''}</span>}
                </div>

                {/* Month ruler */}
                <div style={{ position:'relative', marginLeft:'130px', marginBottom:'8px', height:'18px' }}>
                  {[-18,-15,-12,-9,-6,-3,0,3,6].map(mo => (
                    <div key={mo} style={{ position:'absolute', left:`${pct(mo)}%`, transform:'translateX(-50%)', fontSize:'10px', color: mo===0 ? '#fbbf24' : '#475569', fontWeight: mo===0 ? 700 : 400, whiteSpace:'nowrap' }}>
                      {mo===0 ? '◆ SOP' : `SOP${mo>0?'+':''}${mo}m`}
                    </div>
                  ))}
                </div>

                {/* Grid lines + bars */}
                <div style={{ position:'relative', marginLeft:'130px' }}>
                  {/* Vertical grid lines */}
                  {[-18,-15,-12,-9,-6,-3,0,3,6].map(mo => (
                    <div key={mo} style={{ position:'absolute', left:`${pct(mo)}%`, top:0, bottom:0, width:'1px', background: mo===0 ? 'rgba(251,191,36,0.3)' : 'rgba(71,85,105,0.35)', zIndex:0 }} />
                  ))}

                  {/* Today marker */}
                  {todayPct !== null && (
                    <div style={{ position:'absolute', left:`${todayPct}%`, top:-4, bottom:-4, width:'2px', background:'#ef4444', zIndex:10, borderRadius:'2px' }}>
                      <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', background:'#ef4444', color:'#fff', fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', whiteSpace:'nowrap' }}>TODAY</div>
                    </div>
                  )}

                  {/* Phase bars */}
                  {GANTT_PHASES.map(ph => {
                    const done = ph.milestones.filter(m=>ganttChecked[`${ph.no}-${m}`]).length;
                    const total = ph.milestones.length;
                    const pctDone = total > 0 ? done/total : 0;
                    const status = ganttPhaseStatus[ph.no];
                    return (
                      <div key={ph.no} style={{ display:'flex', alignItems:'center', marginBottom:'10px', position:'relative', zIndex:1 }}>
                        {/* Phase label (absolute left) */}
                        <div style={{ position:'absolute', left:'-130px', width:'122px', display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontSize:'14px' }}>{ph.icon}</span>
                          <div>
                            <div style={{ fontSize:'10px', fontWeight:700, color:'#f1f5f9', lineHeight:1.2 }}>Ph.{ph.no} {ph.name}</div>
                            <div style={{ fontSize:'9px', color: STATUS_COL[status] ?? '#64748b', fontWeight:600 }}>{status}</div>
                          </div>
                        </div>
                        {/* Bar track */}
                        <div style={{ position:'relative', width:'100%', height:'28px', background:'rgba(255,255,255,0.04)', borderRadius:'6px' }}>
                          {/* Phase filled bar */}
                          <div style={{
                            position:'absolute',
                            left:`${pct(ph.start)}%`,
                            width:`${pct(ph.end)-pct(ph.start)}%`,
                            height:'100%',
                            background: ph.color,
                            opacity:0.85,
                            borderRadius:'6px',
                            transition:'width 0.3s',
                          }}>
                            {/* Progress overlay */}
                            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', borderRadius:'6px', clipPath:`inset(0 ${100-pctDone*100}% 0 0)`, transition:'clip-path 0.4s' }} />
                            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#fff' }}>
                              {ph.end-ph.start}m · {done}/{total}
                            </div>
                          </div>
                          {/* Gate marker */}
                          <div style={{ position:'absolute', left:`${pct(ph.end)}%`, top:'-3px', transform:'translateX(-50%)', zIndex:5 }}>
                            <div style={{ width:'8px', height:'34px', background: ph.color, borderRadius:'4px', opacity:0.9 }} />
                            <div style={{ position:'absolute', top:'36px', left:'50%', transform:'translateX(-50%)', fontSize:'8px', color: ph.color, fontWeight:700, whiteSpace:'nowrap' }}>{ph.gate}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ height:'16px' }} /> {/* gate label space */}
                </div>

                {/* Legend */}
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginTop:'8px', marginLeft:'130px', fontSize:'10px', color:'#64748b' }}>
                  {Object.entries(STATUS_COL).map(([st,col])=>(
                    <span key={st} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:col, display:'inline-block' }} />{st}
                    </span>
                  ))}
                  <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:'2px', height:'12px', background:'#ef4444', display:'inline-block', borderRadius:'1px' }} />Today</span>
                  <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:'14px', height:'6px', background:'#6366f1', display:'inline-block', borderRadius:'3px' }} />Phase bar (darker = completed %)</span>
                </div>
              </div>

              {/* -- Phase detail cards ----------------------------------- */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'12px' }}>
                {GANTT_PHASES.map(ph => {
                  const done  = ph.milestones.filter(m=>ganttChecked[`${ph.no}-${m}`]).length;
                  const total = ph.milestones.length;
                  const expanded = ganttExpanded === ph.no;
                  return (
                    <div key={ph.no} style={{ background:'#0f172a', border:`1px solid ${ph.color}40`, borderRadius:'12px', overflow:'hidden' }}>
                      {/* Card header */}
                      <div style={{ background:`${ph.color}18`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
                        onClick={()=>setGanttExpanded(expanded ? null : ph.no)}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <span style={{ fontSize:'18px' }}>{ph.icon}</span>
                          <div>
                            <div style={{ fontSize:'12px', fontWeight:700, color:'#f1f5f9' }}>Phase {ph.no} · {ph.name}</div>
                            <div style={{ fontSize:'10px', color:'#64748b', marginTop:'1px' }}>SOP{ph.start}m → SOP{ph.end<0?ph.end+'m':ph.end===0?'':'+'+ph.end+'m'}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          {/* Status selector */}
                          <select value={ganttPhaseStatus[ph.no]} onChange={e=>{e.stopPropagation();setGanttPhaseStatus(s=>({...s,[ph.no]:e.target.value}))}}
                            style={{ background:'#f1f5f9', border:'1px solid #334155', borderRadius:'6px', padding:'3px 6px', color: STATUS_COL[ganttPhaseStatus[ph.no]]??'#94a3b8', fontSize:'10px', fontWeight:600 }}>
                            {Object.keys(STATUS_COL).map(s=><option key={s}>{s}</option>)}
                          </select>
                          {/* Progress pill */}
                          <span style={{ fontSize:'10px', fontWeight:700, color: done===total ? '#4ade80' : '#fbbf24', background: done===total ? '#10b98118' : '#f59e0b15', border:`1px solid ${done===total?'#10b98140':'#f59e0b40'}`, borderRadius:'20px', padding:'2px 8px' }}>{done}/{total}</span>
                          <span style={{ color:'#475569', fontSize:'12px' }}>{expanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height:'3px', background:'#f1f5f9' }}>
                        <div style={{ height:'100%', width:`${total>0?(done/total)*100:0}%`, background:ph.color, transition:'width 0.4s', borderRadius:'0 2px 2px 0' }} />
                      </div>
                      {/* Milestones */}
                      {expanded && (
                        <div style={{ padding:'12px 16px' }}>
                          <div style={{ fontSize:'10px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>Key Milestones / Deliverables</div>
                          {ph.milestones.map(m => {
                            const key = `${ph.no}-${m}`;
                            const checked = !!ganttChecked[key];
                            return (
                              <label key={m} style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'5px 0', cursor:'pointer', borderBottom:'1px solid rgba(71,85,105,0.2)' }}>
                                <input type="checkbox" checked={checked} onChange={()=>setGanttChecked(c=>({...c,[key]:!c[key]}))}
                                  style={{ marginTop:'1px', accentColor:ph.color, width:'14px', height:'14px', flexShrink:0 }} />
                                <span style={{ fontSize:'12px', color: checked ? '#4ade80' : '#cbd5e1', textDecoration: checked ? 'line-through' : 'none', transition:'color 0.15s' }}>{m}</span>
                              </label>
                            );
                          })}
                          {done === total && (
                            <div style={{ marginTop:'10px', background:'#10b98115', border:'1px solid #10b98140', borderRadius:'8px', padding:'8px 12px', fontSize:'11px', color:'#4ade80', fontWeight:600, textAlign:'center' }}>
                              ✅ Phase {ph.no} Gate Ready — all deliverables complete
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* -- IATF compliance note --------------------------------- */}
              <div style={{ background:'#0f172a', border:'1px solid #334155', borderRadius:'12px', padding:'14px 18px', marginTop:'16px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <span style={{ fontSize:'20px' }}>📋</span>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#a5b4fc', marginBottom:'4px' }}>IATF 16949 Compliance Note — Clause 8.1 & 8.3</div>
                  <div style={{ fontSize:'12px', color:'#94a3b8', lineHeight:1.7 }}>
                    APQP timing plans are a mandatory IATF requirement. Gate reviews must be documented with management sign-off (objective evidence). Special characteristics must be traceable from VOC → DFMEA → PFMEA → Control Plan across all phases. PPAP submission (Phase 4) requires customer PPAP level agreement. Lessons learned from previous programs must be incorporated in Phase 1.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
      </>
  );
}
