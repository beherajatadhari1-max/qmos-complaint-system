'use client';
import { useState, useMemo } from 'react';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg: '#f5f7ff', card: '#ffffff', border: '#dde3f5',
  navy: '#1e2a5a', amber: '#fbbf24', indigo: '#6366f1',
  emerald: '#10b981', text: '#374151', muted: '#9ca3af',
  red: '#ef4444', orange: '#f97316', blue: '#3b82f6',
};

// ── Data ──────────────────────────────────────────────────────────────────────
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
  { name: 'APQP Timing Plan', type: 'Excel', desc: 'Gantt chart with all 5 phases, deliverables, responsibility, target vs actual dates', icon: '📊', color: '#10b981' },
  { name: 'APQP Open Issues List (OIL)', type: 'Excel', desc: 'Tracks all open issues, owner, target date, status — reviewed at every gate review', icon: '📋', color: '#6366f1' },
  { name: 'Gate Review Checklist', type: 'Word', desc: 'Phase-by-phase checklist for gate reviews with sign-off sections for management', icon: '✅', color: '#1e2a5a' },
  { name: 'APQP Status Report', type: 'Word', desc: 'Monthly program status report — RAG status per deliverable, risks, actions', icon: '📝', color: '#f97316' },
  { name: 'Feasibility Analysis Form', type: 'Word', desc: 'Team feasibility commitment form with sections for assumptions, risks, and signatures', icon: '🔍', color: '#8b5cf6' },
  { name: 'APQP Team Roster', type: 'Excel', desc: 'Cross-functional team members, roles, responsibilities, and contact details', icon: '👥', color: '#0ea5e9' },
  { name: 'Design Review Report', type: 'Word', desc: 'Formal design review agenda, attendees, action items, and sign-off', icon: '📐', color: '#ef4444' },
  { name: 'Launch Readiness Review', type: 'Word', desc: 'Pre-SOP checklist covering all critical items for production launch approval', icon: '🚀', color: '#fbbf24' },
];

const SUPPORTING = [
  { title: 'IATF 16949 Clause Mapping', desc: 'Maps all APQP deliverables to specific IATF 16949 clauses for audit readiness', icon: '📌' },
  { title: 'Customer APQP Requirements', desc: 'Summary of customer-specific APQP requirements — Ford, GM, Stellantis, Toyota, Honda, Maruti, TML, M&M', icon: '🏢' },
  { title: 'APQP vs PPAP Relationship', desc: 'Visual explanation of how APQP Phase 4 outputs become the PPAP 18 elements', icon: '🔗' },
  { title: 'Special Characteristics Guide', desc: 'How to identify, classify (S/C, C/C), and cascade special characteristics across all APQP documents', icon: '⭐' },
  { title: 'Lessons Learned Template', desc: 'Structured template to capture lessons learned from each program for future APQP use', icon: '📚' },
  { title: 'APQP for Commodity Changes', desc: 'Guidance on APQP scope for supplier changes, material changes, and process changes', icon: '🔄' },
  { title: 'APQP Audit Checklist', desc: '40-point internal audit checklist to assess APQP compliance per IATF 16949', icon: '✔️' },
  { title: 'APQP KPI Dashboard Guide', desc: 'Metrics to track APQP health: on-time deliverable %, gate review score, issues closure rate', icon: '📈' },
];

const POSTERS = [
  {
    title: 'APQP 5 Phases Overview',
    size: 'A1 Poster',
    desc: 'Full phase roadmap with inputs, outputs, and key deliverables per phase',
    type: 'roadmap',
    colors: ['#6366f1','#8b5cf6','#0ea5e9','#10b981','#f97316'],
  },
  {
    title: 'APQP Timing Clock',
    size: 'A2 Banner',
    desc: 'Visual countdown clock from SOP-24 months to SOP showing when each deliverable is due',
    type: 'timeline',
    colors: ['#1e2a5a','#fbbf24'],
  },
  {
    title: 'PFD → PFMEA → Control Plan Trinity',
    size: 'A1 Poster',
    desc: 'Visual showing how Process Flow Diagram, PFMEA and Control Plan are interlinked',
    type: 'trinity',
    colors: ['#6366f1','#ef4444','#10b981'],
  },
  {
    title: 'Special Characteristics Classification',
    size: 'A3 Poster',
    desc: 'Safety characteristic (◆), Critical characteristic (★), Significant characteristic (□) with examples',
    type: 'classification',
    colors: ['#ef4444','#f97316','#fbbf24'],
  },
  {
    title: 'Gate Review Checklist Banner',
    size: 'A2 Banner',
    desc: 'Visual checklist of deliverables required at each phase gate for meeting room display',
    type: 'checklist',
    colors: ['#1e2a5a','#10b981'],
  },
  {
    title: 'APQP Team Roles & Responsibilities',
    size: 'A2 Poster',
    desc: 'RACI matrix showing who is Responsible, Accountable, Consulted, Informed for each APQP activity',
    type: 'raci',
    colors: ['#1e2a5a','#6366f1'],
  },
];

const TABS = ['Overview','5 Phases','Interview Q&A','Templates','Supporting Docs','Posters & Banners'];

// ── Component ─────────────────────────────────────────────────────────────────
export default function APQPPage() {
  const [tab, setTab] = useState(0);
  const [qFilter, setQFilter] = useState<'All'|'Beginner'|'Engineer'|'Auditor'>('All');
  const [qSearch, setQSearch] = useState('');
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [openPhase, setOpenPhase] = useState<number | null>(0);

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
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: T.navy, padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '28px' }}>🚀</span>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>APQP</h1>
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', background: T.amber + '22', color: T.amber, borderRadius: '20px', border: `1px solid ${T.amber}44` }}>AIAG 4th Edition</span>
            </div>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Advanced Product Quality Planning — Complete Knowledge Center</p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>IATF 16949 · 5 Phases · 200+ Q&A · Templates · Posters</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[['📊','5 Phases'],['❓','200+ Q&A'],['📁','8 Templates'],['🖼️','6 Posters']].map(([icon, label]) => (
              <div key={label as string} style={{ textAlign: 'center', background: '#ffffff10', borderRadius: '10px', padding: '8px 14px' }}>
                <div style={{ fontSize: '18px' }}>{icon}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap' }}>{label as string}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 18px', fontSize: '13px', fontWeight: tab === i ? 700 : 400,
              color: tab === i ? T.amber : '#94a3b8',
              background: tab === i ? '#ffffff15' : 'transparent',
              border: 'none', borderBottom: tab === i ? `3px solid ${T.amber}` : '3px solid transparent',
              cursor: 'pointer', borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: '1400px' }}>

        {/* ══ TAB 0: OVERVIEW ══════════════════════════════════════════════ */}
        {tab === 0 && (
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
        )}

        {/* ══ TAB 1: 5 PHASES ══════════════════════════════════════════════ */}
        {tab === 1 && (
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
        )}

        {/* ══ TAB 2: INTERVIEW Q&A ═════════════════════════════════════════ */}
        {tab === 2 && (
          <div>
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

        {/* ══ TAB 3: TEMPLATES ════════════════════════════════════════════ */}
        {tab === 3 && (
          <div>
            <p style={{ fontSize: '13px', color: T.muted, marginBottom: '20px' }}>All APQP templates in AIAG-aligned format. Download, customize with your company details, and use immediately.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {TEMPLATES.map(t => (
                <div key={t.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: t.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: T.navy }}>{t.name}</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: t.type === 'Excel' ? '#d1fae5' : '#dbeafe', color: t.type === 'Excel' ? '#065f46' : '#1e40af' }}>{t.type}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: T.muted, lineHeight: 1.5, margin: '0 0 10px' }}>{t.desc}</p>
                    <button style={{ fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '6px', background: T.navy, color: T.amber, border: 'none', cursor: 'pointer' }}>
                      ↓ Download Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 4: SUPPORTING DOCS ══════════════════════════════════════ */}
        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {SUPPORTING.map(s => (
              <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: T.navy, marginBottom: '4px' }}>{s.title}</div>
                  <p style={{ fontSize: '11px', color: T.muted, lineHeight: 1.6, margin: '0 0 10px' }}>{s.desc}</p>
                  <button style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '6px', background: T.bg, color: T.navy, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB 5: POSTERS & BANNERS ════════════════════════════════════ */}
        {tab === 5 && (
          <div>
            <p style={{ fontSize: '13px', color: T.muted, marginBottom: '20px' }}>
              Print-ready visual posters and banners for factory walls, meeting rooms, and training sessions. All designed for A1/A2/A3 format.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {POSTERS.map(p => (
                <div key={p.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
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
                      <button style={{ flex: 1, fontSize: '11px', fontWeight: 600, padding: '6px', borderRadius: '6px', background: T.navy, color: T.amber, border: 'none', cursor: 'pointer' }}>
                        🖨️ Print PDF
                      </button>
                      <button style={{ flex: 1, fontSize: '11px', fontWeight: 600, padding: '6px', borderRadius: '6px', background: T.bg, color: T.navy, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                        ✏️ Customize
                      </button>
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

      </div>
    </div>
  );
}
