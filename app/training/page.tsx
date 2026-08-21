'use client';
import { useState } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

const ROLES = [
  {
    id: 'quality-head', icon: '👔', label: 'Quality Head / Director',
    color: 'bg-[#eff6ff]', accent: 'bg-blue-700', border: 'border-blue-700/50', text: 'text-[#1d4ed8]',
    badge: 'bg-[#eff6ff] text-blue-200',
    tagline: '18+ years leadership — all functions, all customers, all standards',
    modules: [
      { no:'QH-01', title:'Quality Management System — Strategic View', duration:'3 hrs', level:'Advanced',
        desc:'QMS as a strategic business tool. Aligning quality objectives with business goals. Management Review excellence. Quality culture building.',
        topics:['QMS scope and context (SWOT, PESTLE)','Quality policy and strategic objectives','Management Review — inputs, outputs, decisions','Quality culture and leadership behaviours','Risk-based thinking at leadership level'],
        standard:'IATF 16949 Cl. 5 + Cl. 9.3' },
      { no:'QH-02', title:'Customer Satisfaction & Complaint Management', duration:'2 hrs', level:'Advanced',
        desc:'Managing customer relationships, complaint resolution, customer scorecards. Zero warranty philosophy.',
        topics:['Customer satisfaction monitoring (IATF 9.1.2)','Complaint escalation framework','Customer scorecard analysis and response','Warranty reduction strategy','Customer audit readiness'],
        standard:'IATF 16949 Cl. 9.1.2 + Cl. 8.7' },
      { no:'QH-03', title:'Quality KPIs — Measurement and Review', duration:'2 hrs', level:'Advanced',
        desc:'Designing KPI dashboards, reviewing quality performance, driving data-based decisions.',
        topics:['Customer PPM, Internal PPM, OEE, CoPQ','KPI waterfall — plant to customer to supplier','Balanced scorecard approach','Leading vs lagging indicators','Management Review reporting format'],
        standard:'IATF 16949 Cl. 9.1 + Cl. 9.3' },
      { no:'QH-04', title:'Audit Strategy — IATF, Customer, Supplier', duration:'2.5 hrs', level:'Advanced',
        desc:'Planning and managing internal, external, and customer audits. Preparing for zero NC results.',
        topics:['IATF surveillance and recertification audits','Customer audit (VDA 6.3, MMOG/LE)','Internal audit program design','Audit finding response and closure','Zero NC strategy and audit culture'],
        standard:'IATF 16949 Cl. 9.2' },
    ],
  },
  {
    id: 'qms-manager', icon: '📋', label: 'QMS Manager',
    color: 'bg-purple-900/30', accent: 'bg-purple-700', border: 'border-purple-700', text: 'text-purple-300',
    badge: 'bg-purple-800 text-purple-200',
    tagline: 'IATF 16949 compliance, audits, documents, management review',
    modules: [
      { no:'QMS-01', title:'IATF 16949 — All 10 Clauses Deep Dive', duration:'6 hrs', level:'Expert',
        desc:'Complete IATF 16949 clause-by-clause training with audit questions, evidence requirements, and common nonconformities.',
        topics:['Cl. 4: Context — SWOT, stakeholders, scope','Cl. 5: Leadership — policy, roles, commitment','Cl. 6: Planning — risks, opportunities, objectives','Cl. 7: Support — resources, competency, communication','Cl. 8: Operation — APQP, PPAP, CSR, CP, PFMEA','Cl. 9: Evaluation — internal audit, MR, customer satisfaction','Cl. 10: Improvement — CAPA, continual improvement'],
        standard:'IATF 16949:2016 — Full Standard' },
      { no:'QMS-02', title:'Internal Audit — Process Approach', duration:'3 hrs', level:'Intermediate',
        desc:'Conducting effective process audits. Writing factual findings. Audit reporting and CAPA follow-up.',
        topics:['Process audit vs element audit','Turtle diagram approach','Writing objective evidence-based findings','Major NC vs Minor NC — how to distinguish','Audit report and CAPA follow-up system'],
        standard:'IATF 16949 Cl. 9.2' },
      { no:'QMS-03', title:'Document Control & Records Management', duration:'2 hrs', level:'Intermediate',
        desc:'Designing a document control system that satisfies IATF requirements and survives certification audits.',
        topics:['Document types — manual, procedures, WI, forms, records','Version control and change management','Document approval and distribution matrix','Records retention — legal and IATF requirements','Electronic document management systems'],
        standard:'IATF 16949 Cl. 7.5' },
      { no:'QMS-04', title:'Management Review — Planning and Facilitation', duration:'1.5 hrs', level:'Intermediate',
        desc:'How to plan, conduct, and record a Management Review that is effective, not just compliant.',
        topics:['MR inputs — mandatory 20+ items from IATF','How to present quality data to top management','MR outputs — action items with owners and dates','Linking MR outputs to quality objectives','Records — what auditors look for'],
        standard:'IATF 16949 Cl. 9.3' },
    ],
  },
  {
    id: 'process-quality', icon: '⚙️', label: 'Process Quality Manager',
    color: 'bg-green-900/30', accent: 'bg-green-700', border: 'border-green-700', text: 'text-green-300',
    badge: 'bg-green-800 text-green-200',
    tagline: 'PFMEA, Control Plan, SPC, 8D — the factory floor expert',
    modules: [
      { no:'PQ-01', title:'PFMEA — AIAG-VDA 2019 Complete Guide', duration:'4 hrs', level:'Expert',
        desc:'Complete PFMEA using the new AIAG-VDA 2019 7-step approach. Action Priority (AP) replaces RPN.',
        topics:['7-Step approach overview','Structure analysis — process flow and P-diagram','Function analysis — process functions and requirements','Failure analysis — failure modes, effects, causes','Risk analysis — S×O×D matrix and AP determination','Optimization — action plan and re-assessment','PFMEA linkage to Control Plan and SPC'],
        standard:'AIAG-VDA FMEA Handbook 2019' },
      { no:'PQ-02', title:'Control Plan — Design to Deployment', duration:'2 hrs', level:'Intermediate',
        desc:'Creating a Control Plan that works on the shop floor and satisfies IATF + customer requirements.',
        topics:['Control Plan types — Prototype, Pre-launch, Production','Special characteristics — SC, CC, KPC identification','Reaction plan for every characteristic','Linkage to PFMEA, PFD, and Work Instructions','Control Plan update triggers — 4M changes'],
        standard:'IATF 16949 Cl. 8.5.1 / AIAG APQP' },
      { no:'PQ-03', title:'8D Problem Solving — World-Class Approach', duration:'3 hrs', level:'Intermediate',
        desc:'Complete 8D methodology with real-world examples from automotive manufacturing.',
        topics:['D0: Symptoms — when to open an 8D','D1: Team — cross-functional composition','D2: Problem description — 5W2H method','D3: Containment — 24-hour response','D4: Root cause — 5-Why + Fishbone (occurrence + escape)','D5–D6: CAPA implementation and verification','D7: Recurrence prevention — PFMEA/CP/SOP update','D8: Team recognition and closure'],
        standard:'Ford 8D / AIAG Problem Solving' },
      { no:'PQ-04', title:'SPC — Implementation on the Shop Floor', duration:'3 hrs', level:'Intermediate',
        desc:'Practical SPC implementation — from chart selection to operator training to out-of-control response.',
        topics:['Chart selection — X̄-R, I-MR, p, np','Control limit calculation with AIAG constants','Out-of-control rules — Western Electric rules','Operator training and chart plotting exercise','Cp, Cpk — calculation, interpretation, action','Common SPC mistakes and how to avoid them'],
        standard:'AIAG SPC 2nd Edition' },
    ],
  },
  {
    id: 'incoming-quality', icon: '📦', label: 'Incoming Quality Manager',
    color: 'bg-teal-900/30', accent: 'bg-teal-700', border: 'border-teal-700', text: 'text-teal-300',
    badge: 'bg-teal-800 text-teal-200',
    tagline: 'Incoming inspection, supplier rejection, PPAP, incoming PPM',
    modules: [
      { no:'IQ-01', title:'Incoming Inspection System Design', duration:'2.5 hrs', level:'Intermediate',
        desc:'Designing a risk-based incoming inspection system — AQL, sampling plans, skip-lot, and reduced inspection.',
        topics:['Risk-based inspection approach — ABC classification','AQL — Acceptable Quality Level and sampling tables','Normal, reduced, and tightened inspection','Skip-lot qualification for approved suppliers','Incoming inspection SOP and checklist design'],
        standard:'IATF 16949 Cl. 8.4.3 / MIL-STD-1916' },
      { no:'IQ-02', title:'PPAP Receiving and Review', duration:'2 hrs', level:'Intermediate',
        desc:'How to review an incoming PPAP package from a supplier — what to check, how to identify gaps.',
        topics:['PPAP 18-element review checklist','Level 1–5 submission requirements','How to evaluate PFMEA and Control Plan quality','MSA and SPC data review','Issuing PPAP conditional or full approval','Rejection and resubmission process'],
        standard:'AIAG PPAP 4th Edition' },
      { no:'IQ-03', title:'Incoming PPM — Reduction Strategy', duration:'1.5 hrs', level:'Intermediate',
        desc:'Systematic approach to reducing incoming rejection PPM using data, supplier development, and CAPA.',
        topics:['Incoming PPM calculation and tracking','Pareto analysis of top rejected suppliers','Supplier CAPA — 8D request and follow-up','Sorting, return, and concession process','Supplier development intervention triggers'],
        standard:'IATF 16949 Cl. 8.4 + Cl. 10.2' },
    ],
  },
  {
    id: 'supplier-quality', icon: '🏭', label: 'Supplier Quality Manager',
    color: 'bg-orange-900/30', accent: 'bg-orange-700', border: 'border-orange-700', text: 'text-orange-600',
    badge: 'bg-orange-800 text-orange-200',
    tagline: 'Supplier audit, scorecard, development, PPAP approval',
    modules: [
      { no:'SQ-01', title:'Supplier Audit — VDA 6.3 Process Audit', duration:'3 hrs', level:'Expert',
        desc:'Conducting VDA 6.3 process audits at supplier facilities. Rating system, finding classification, and development plan.',
        topics:['VDA 6.3 — question structure and rating','P1-P7 process elements','On-site audit execution','Finding classification — A, B, C priority','Audit report writing','Development action plan and follow-up'],
        standard:'VDA 6.3 Process Audit' },
      { no:'SQ-02', title:'Supplier Scorecard — Design and Review', duration:'2 hrs', level:'Intermediate',
        desc:'Designing a supplier performance scorecard, conducting quarterly reviews, and managing supplier risk.',
        topics:['Scorecard KPIs — PPM, delivery, audit, PPAP','Weighting and scoring method','Monthly vs quarterly review cadence','Approved / Conditional / Development / Disqualified','Supplier risk matrix and contingency'],
        standard:'IATF 16949 Cl. 8.4.1' },
      { no:'SQ-03', title:'Supplier Development Program', duration:'2 hrs', level:'Intermediate',
        desc:'Moving suppliers from reactive to proactive quality. Structured development plans with milestones.',
        topics:['Supplier classification — A/B/C risk level','Development plan design and milestones','Supplier APQP support and gate reviews','Resident engineer and joint kaizen','Exit criteria from development status'],
        standard:'IATF 16949 Cl. 8.4.2' },
    ],
  },
  {
    id: 'fresher', icon: '🎓', label: 'Quality Engineer / Fresher',
    color: 'bg-indigo-900/30', accent: 'bg-indigo-700', border: 'border-indigo-700', text: 'text-indigo-300',
    badge: 'bg-indigo-800 text-indigo-200',
    tagline: 'Start here — build your quality foundation step by step',
    modules: [
      { no:'QE-01', title:'Quality Basics — What Every Engineer Must Know', duration:'2 hrs', level:'Beginner',
        desc:'The foundation of automotive quality. Understanding quality concepts, standards, and your role in the quality system.',
        topics:['What is quality in automotive manufacturing?','IATF 16949 — why it exists and what it requires','Quality vocabulary — PPM, Cpk, CAPA, PFMEA, SPC','The quality system — your role in it','Quality mindset — prevention over correction'],
        standard:'IATF 16949 Introduction' },
      { no:'QE-02', title:'Reading and Interpreting Engineering Drawings', duration:'2 hrs', level:'Beginner',
        desc:'Understanding GD&T, tolerance interpretation, special characteristics, and using drawings for inspection.',
        topics:['Drawing views — orthographic projection','Dimensions and tolerances — nominal, bilateral, unilateral','GD&T symbols — flatness, straightness, circularity, position','Special characteristics — SC, CC symbols','Ballooning a drawing for PPAP'],
        standard:'ISO GPS / ASME Y14.5' },
      { no:'QE-03', title:'Defect Recognition and Reporting', duration:'1.5 hrs', level:'Beginner',
        desc:'How to identify, classify, record, and report manufacturing defects. Non-conforming material control.',
        topics:['Defect types — cosmetic, dimensional, functional','Defect classification — critical, major, minor','Non-conforming material tag system (NCR)','MRB — Material Review Board process','Internal rejection report and CAPA initiation'],
        standard:'IATF 16949 Cl. 8.7' },
      { no:'QE-04', title:'5-Why and Fishbone — Root Cause Analysis Basics', duration:'1.5 hrs', level:'Beginner',
        desc:'Your most important problem solving tools. Learn to find the true root cause, not just the symptom.',
        topics:['What is root cause analysis?','5-Why technique — step by step with examples','Fishbone diagram — 4M + 1E methodology','Common mistakes — stopping at symptoms','Presenting root cause to management'],
        standard:'8D / Kaizen Problem Solving' },
    ],
  },
];

const LEVEL_COLOR: Record<string, string> = {
  Expert: 'bg-red-50 text-red-600',
  Advanced: 'bg-orange-900/40 text-orange-600',
  Intermediate: 'bg-blue-900/40 text-[#1d4ed8]',
  Beginner: 'bg-green-900/40 text-green-300',
};

export default function TrainingPage() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [expandedModule, setExpandedModule] = useState<string|null>(null);

  const role = ROLES.find(r => r.id === selectedRole)!;

  return (
      <>
      <PageTitle title="Training" />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">🎓 QMOS Training Academy</h1>
            <p className="text-[#1e3a5f] mt-1 text-sm">Role-based quality training — from fresher to Quality Head. Built from 18+ years of automotive quality expertise.</p>
          </div>
          <button onClick={() => window.print()} className="no-print flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-white text-xs font-semibold rounded-lg transition mt-1">
            🖨 Print
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { n:'6', label:'Role Tracks' },
            { n:'25+', label:'Training Modules' },
            { n:'50+ hrs', label:'Total Content' },
            { n:'IATF / AIAG', label:'Standards Aligned' },
          ].map((s,i) => (
            <div key={i} className="bg-[#eff6ff] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{s.n}</p>
              <p className="text-[#1e3a5f] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/training/Annual_Training_Plan.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Annual Training Plan">Annual Training Plan</a><a href="/downloads/training/Annual_Training_Plan.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Annual Training Plan">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/training/Skill_Matrix.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Skill Matrix XLS">Skill Matrix XLS</a><a href="/downloads/training/Skill_Matrix.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Skill Matrix XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/training/Competency_Matrix.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Competency Matrix">Competency Matrix</a><a href="/downloads/training/Competency_Matrix.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Competency Matrix">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#b45309'}}><a href="/downloads/training/Training_Attendance_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Attendance Register">Attendance Register</a><a href="/downloads/training/Training_Attendance_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Attendance Register">⬇</a></span>
      </div>
      {/* Role Selector */}
      <div>
        <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Select your role to see your training path</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => { setSelectedRole(r.id); setExpandedModule(null); }}
              className={`rounded-xl p-3 text-center border-2 transition ${selectedRole === r.id ? `${r.color} ${r.border} text-white` : 'bg-white border-[#dbeafe] text-[#1e3a5f] hover:border-[#dbeafe]'}`}>
              <div className="text-2xl mb-1">{r.icon}</div>
              <p className="text-xs font-semibold leading-tight">{r.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Role Header */}
      <div className={`${role.color} rounded-2xl p-5 text-white`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{role.icon}</span>
          <div>
            <h2 className="text-xl font-bold">{role.label}</h2>
            <p className={`${role.text} text-sm mt-0.5`}>{role.tagline}</p>
          </div>
          <div className="ml-auto text-right">
            <p className={`${role.badge} px-3 py-1 rounded-full text-sm font-semibold`}>{role.modules.length} Modules</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {role.modules.map((mod) => (
          <div key={mod.no} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm overflow-hidden">
            <button onClick={() => setExpandedModule(e => e === mod.no ? null : mod.no)}
              aria-expanded={expandedModule === mod.no}
              aria-controls={`mod-panel-${mod.no}`}
              className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-[#eff6ff] transition">
              <div className={`${role.accent} text-white rounded-lg px-2.5 py-1 text-xs font-bold flex-shrink-0 mt-0.5`}>{mod.no}</div>
              <div className="flex-1">
                <p className="font-bold text-[#1e3a5f]">{mod.title}</p>
                <p className="text-[#1e3a5f] text-xs mt-0.5">{mod.desc.substring(0,90)}...</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-[#1e3a5f] bg-white px-2 py-1 rounded-full">⏱ {mod.duration}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${LEVEL_COLOR[mod.level]}`}>{mod.level}</span>
                <span className="text-[#1e3a5f] text-lg">{expandedModule === mod.no ? '▲' : '▼'}</span>
              </div>
            </button>
            {expandedModule === mod.no && (
              <div id={`mod-panel-${mod.no}`} role="region" aria-label={`${mod.title} details`}
                className="px-5 pb-5 border-t border-[#dbeafe] pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">What you will learn</p>
                  <ul className="space-y-1.5">
                    {mod.topics.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#1e3a5f]">
                        <span className="text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-lg p-3">
                    <p className="text-xs font-bold text-[#1e3a5f] uppercase mb-1">Standard / Reference</p>
                    <p className="text-sm font-semibold text-[#1e3a5f]">{mod.standard}</p>
                  </div>
                  <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-lg p-3">
                    <p className="text-xs font-bold text-[#1e3a5f] uppercase mb-1">Module Details</p>
                    <div className="flex gap-4 text-sm">
                      <div><p className="text-[#1e3a5f] text-xs">Duration</p><p className="font-semibold">{mod.duration}</p></div>
                      <div><p className="text-[#1e3a5f] text-xs">Level</p><p className="font-semibold">{mod.level}</p></div>
                      <div><p className="text-[#1e3a5f] text-xs">Topics</p><p className="font-semibold">{mod.topics.length}</p></div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#eff6ff] border border-blue-700/50 rounded-lg text-sm text-blue-200">
                    📌 Module content aligned to <strong>{mod.standard}</strong>. All examples from automotive / seating manufacturing industry.
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Banner */}
      <div className="bg-[#eff6ff] rounded-2xl p-5 text-[#1e3a5f] text-center">
        <p className="text-lg font-bold mb-1">Built from 18+ Years of Automotive Quality Experience</p>
        <p className="text-[#1e3a5f] text-sm">Every module reflects real factory situations, real customer expectations, and real audit findings — not just textbook theory.</p>
        <div className="flex justify-center flex-wrap gap-3 mt-4">
          {['TML / Tata Motors','MSIL / Maruti','Honda','Toyota','Bajaj','OEM-ready'].map(s => (
            <span key={s} className="px-3 py-1 bg-[#dbeafe] text-[#1e3a5f] rounded-full text-xs font-semibold">{s}</span>
          ))}
        </div>
      </div>
      <QualityCopilot page="training" />
    </div>
      </>
  );
}