'use client';
import { useState } from 'react';

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PROCESSES = [
  {
    no:'01', label:'Supplier PPAP & Packaging Sign Off', freq:'Monthly', icon:'📑', clause:'AIAG PPAP 4th Ed.',
    desc:'Monthly review and sign-off of supplier PPAP submissions and packaging approval — new parts, changes, and annual revalidation.',
    activities:['List all supplier PPAPs due this month (new/change/annual)','Review 18-element PPAP package from supplier','Verify Part Submission Warrant (PSW) completeness','Inspect packaging: label format, protection, packing density','Sign off PPAP and packaging approval or issue rejection with reason','Update PPAP tracker and communicate to purchase and planning'],
    docs:['PPAP Submission Checklist (18 Elements)','Part Submission Warrant (PSW)','Packaging Approval Form','PPAP Status Tracker'],
    kpis:['PPAPs Due This Month','PPAPs Signed Off on Time','Packaging Rejections'],
  },
  {
    no:'02', label:'Supplier-wise Issues Reporting', freq:'Weekly', icon:'📊', clause:'IATF 8.4',
    desc:'Weekly supplier-wise quality issue report — rejection count, defect types, SCAR status, and trend vs previous weeks.',
    activities:['Collect all supplier rejection data from IQC for the week','Compile supplier-wise issue report (supplier, part, defect, qty)','Calculate weekly rejection rate per supplier','Identify suppliers with repeat issues in last 4 weeks','Raise SCAR for suppliers breaching threshold','Publish weekly supplier issues report to supply chain and management'],
    docs:['Weekly Supplier Issues Report','Supplier Rejection Register','SCAR Trigger Log','Weekly Trend Chart'],
    kpis:['Supplier Issues This Week','Repeat Suppliers (Last 4 Weeks)','SCARs Raised This Week'],
  },
  {
    no:'03', label:'Supplier 4M Changes', freq:'Monthly', icon:'🔄', clause:'IATF 8.4',
    desc:'Monthly review and approval of supplier 4M changes — Man, Machine, Material, Method changes at supplier end.',
    activities:['Receive 4M change intimation from all suppliers','Review each change: type, scope, affected parts/processes','Assess risk and decide if re-PPAP is required','Conduct trial lot/process validation for critical changes','Issue written approval or rejection with conditions','Update 4M change register and communicate to customer if required'],
    docs:['Supplier 4M Change Intimation Form','4M Change Register','Risk Assessment Sheet','Approval/Rejection Letter'],
    kpis:['4M Changes Received This Month','4M Changes Approved','4M Changes Requiring Re-PPAP'],
  },
  {
    no:'04', label:'Supplier Re-PPAP', freq:'Monthly', icon:'🔁', clause:'AIAG PPAP',
    desc:'Monthly tracking of Re-PPAP requirements — triggered by 4M changes, customer complaints, process shifts, or annual revalidation.',
    activities:['Identify Re-PPAP requirements for the month (change-triggered or annual)','Issue Re-PPAP request to supplier with scope and due date','Review submitted Re-PPAP package against requirement level','Conduct plant trial or validation if dimensional change','Approve/reject Re-PPAP and update supplier file','Communicate Re-PPAP approval to customer if required'],
    docs:['Re-PPAP Request Form','Re-PPAP Tracker','Submission Evidence File','Customer Notification (if applicable)'],
    kpis:['Re-PPAPs Due This Month','Re-PPAPs Completed','Re-PPAPs Overdue'],
  },
  {
    no:'05', label:'Supplier Development Activities', freq:'Monthly', icon:'📈', clause:'IATF 8.4.3',
    desc:'Monthly supplier development program — capability building, Kaizen support, quality system improvement, and target-setting.',
    activities:['Select suppliers in development program (Red/Yellow rated)','Define development target: PPM, audit score, PPAP level','Visit supplier and conduct development activity (training, Kaizen, process improvement)','Record development visit report with findings and action plan','Track implementation of agreed development actions','Review development effectiveness in next month scorecard'],
    docs:['Supplier Development Plan','Development Visit Report','Action Plan Tracker','Development Effectiveness Review'],
    kpis:['Suppliers Under Development','Development Visits Completed','PPM Improvement % (Development Suppliers)'],
  },
  {
    no:'06', label:'Approved Supplier List & QMS', freq:'Monthly', icon:'📋', clause:'IATF 8.4.1',
    desc:'Monthly review and update of the Approved Supplier List (ASL) and associated QMS documentation.',
    activities:['Review ASL for any additions, removals, or status changes','Cross-check QMS documents: PPAP status, audit score, current rating','Update ASL with latest approval status per supplier','Add newly qualified suppliers after PPAP approval','Delist or put on conditional approval for poor performers','Distribute updated ASL to purchase, stores, and IQC team'],
    docs:['Approved Supplier List (ASL)','Supplier QMS Document File','ASL Change Log','Distribution Acknowledgement'],
    kpis:['Total Approved Suppliers','Conditional Approvals','Suppliers Delisted This Month'],
  },
  {
    no:'07', label:'Supplier Quality Issue & MOM', freq:'Daily', icon:'🚨', clause:'IATF 8.7',
    desc:'Daily tracking of supplier quality issues, escalation calls, and Minutes of Meeting with suppliers on open quality concerns.',
    activities:['Identify new supplier quality issues from IQC/production','Contact supplier within 24 hours for urgent issues','Conduct daily escalation call/supplier meeting for critical issues','Record discussion points, commitments, and target dates in MOM','Send signed MOM to supplier and management','Track committed actions from MOM to closure'],
    docs:['Daily Issue Log','Supplier Meeting MOM','Escalation Register','Action Closure Evidence'],
    kpis:['New Issues Raised Today','MOMs Issued This Week','Actions from MOM Closed %'],
  },
  {
    no:'08', label:'Supplier Rework', freq:'Daily', icon:'🔧', clause:'IATF 8.7.1',
    desc:'Daily management of supplier-supplied material rework — authorization, rework method, reinspection, cost recovery.',
    activities:['Identify rejected incoming lots requiring rework (vs return)','Issue Rework Authorization to supplier or in-house rework','Define rework method and acceptance criteria','Perform or witness rework (100% reinspection after rework)','Record rework quantity, hours, and cost for debit note','Update daily rework register and notify IQC for reinspection'],
    docs:['Rework Authorization Form','Rework Register (Daily)','Re-inspection Record','Rework Cost Sheet (for Debit Note)'],
    kpis:['Parts Reworked Today','Rework Success Rate %','Rework Cost (INR) — Daily'],
  },
  {
    no:'09', label:'Supplier Improvement — FTG & Others', freq:'Monthly', icon:'🎯', clause:'IATF 8.4',
    desc:'Monthly supplier improvement tracking — First Time Good (FTG) rate improvement, yield, defect reduction.',
    activities:['Collect FTG data from all key suppliers for the month','Calculate FTG % per supplier: good parts / total dispatched × 100','Compare FTG vs target and last month','Identify suppliers with declining FTG trend','Agree improvement action plan with supplier','Track improvement progress in next month review'],
    docs:['FTG Tracking Sheet','Supplier Improvement Tracker','Monthly Improvement Review Report','FTG Trend Chart'],
    kpis:['Average Supplier FTG %','Suppliers Below FTG Target','FTG Month-on-Month Improvement'],
  },
  {
    no:'10', label:'Supplier PDIR & Part Layout Inspection', freq:'Daily', icon:'📏', clause:'IATF 8.4',
    desc:'Daily Pre-Delivery Inspection Report (PDIR) review and periodic layout inspection of supplier parts at supplier end.',
    activities:['Receive PDIR from supplier before each dispatch (critical suppliers)','Review PDIR data: dimensions checked, results OK/NG','Flag any PDIR with NG results before dispatch','Schedule layout inspection at supplier for new or changed parts','Conduct or witness 100% dimensional layout against drawing','Record layout inspection report and file in supplier quality dossier'],
    docs:['Supplier PDIR Format','PDIR Register','Layout Inspection Report','Ballooned Drawing'],
    kpis:['PDIRs Received Today','PDIRs with NG Results','Layout Inspections Completed'],
  },
  {
    no:'11', label:'Supplier PPM Trend Chart & Action Plan', freq:'Weekly', icon:'📉', clause:'IATF 8.4',
    desc:'Weekly supplier PPM trend chart update and action plan — identify worsening suppliers and drive corrective actions.',
    activities:['Calculate PPM for each supplier: (rejected qty / received qty) × 1,000,000','Update weekly PPM trend chart (rolling 13-week view)','Identify suppliers with increasing PPM trend (3 weeks consecutive)','Issue written warning or SCAR for suppliers breaching PPM target','Review PPM action plan for high-PPM suppliers','Publish weekly PPM chart to supply chain head and quality head'],
    docs:['Weekly PPM Trend Chart','Supplier PPM Tracker','PPM Action Plan','SCAR/Warning Letter'],
    kpis:['Plant Incoming PPM (Week)','Suppliers Above PPM Target','PPM Trend: Improving/Worsening'],
  },
  {
    no:'12', label:'Supplier Containment Action', freq:'Daily', icon:'🛑', clause:'IATF 8.7',
    desc:'Daily management of supplier containment actions for quality escapes — sorting, isolation, recall, and monitoring.',
    activities:['Identify supplier escape requiring containment (field/assembly/IQC)','Issue immediate containment instruction to supplier (D1–D3 of 8D)','Verify containment: sorting records, quantity sorted, results','Segregate suspect material at plant: quarantine and mark clearly','Get daily status update from supplier on containment progress','Close containment only after root cause confirmed and corrective action in place'],
    docs:['Containment Action Form','Daily Containment Status Report','Sorting Record (Supplier)','Quarantine Tag/Register'],
    kpis:['Active Containments','Containment Actions Closed Today','Suspect Material in Quarantine (Units)'],
  },
  {
    no:'13', label:'Supplier Training Plan', freq:'Monthly', icon:'📚', clause:'IATF 7.2',
    desc:'Monthly planning and execution of supplier training — IATF awareness, PPAP, FMEA, SPC, quality tools, drawing reading.',
    activities:['Identify training needs per supplier (from audit findings, quality issues)','Prepare monthly supplier training plan with topics and dates','Conduct training at supplier site or at plant','Record attendance and administer pre/post test','Update supplier training record and share certificate','Follow up on training effectiveness after 30 days'],
    docs:['Supplier Training Plan (Monthly)','Training Attendance Register','Training Material/Presentation','Training Effectiveness Record'],
    kpis:['Training Sessions Planned','Training Sessions Conducted','Supplier Training Attendance %'],
  },
  {
    no:'14', label:'Supplier Process Audit — CQI', freq:'Monthly', icon:'🔍', clause:'IATF 8.4.2',
    desc:'Monthly supplier process audit using AIAG CQI checklists — CQI-9 (Heat Treat), CQI-11 (Plating), CQI-12 (Coating), CQI-23 (Molding).',
    activities:['Identify supplier process type and select applicable CQI checklist','Schedule process audit with supplier (2-week advance notice)','Conduct process audit at supplier using CQI standard','Score each section and identify non-conformances','Issue CQI audit report with findings and required actions','Track NC closure with evidence within agreed timeline'],
    docs:['CQI Audit Checklist (Applicable Standard)','CQI Audit Report','Non-Conformance List','Corrective Action Tracker'],
    kpis:['CQI Audits Completed vs Plan','CQI NCs Raised','CQI NC Closure Rate %'],
  },
  {
    no:'15', label:'Material Compliance and Test Report', freq:'Monthly', icon:'🧪', clause:'IATF 8.4',
    desc:'Monthly review of material compliance reports and test certificates — RoHS, REACH, IMDS, material test certificates.',
    activities:['Collect material test reports from all key suppliers for the month','Verify RoHS/REACH compliance certificates are valid and current','Check IMDS data submission for all new parts','Review material test report: alloy/polymer grade, mechanical properties','Flag non-compliant or expired certificates for supplier action','File compliance documents in supplier quality dossier'],
    docs:['Material Compliance Register','RoHS/REACH Certificates','IMDS Submission Confirmation','Material Test Reports'],
    kpis:['Compliance Reports Received','Expired/Missing Certificates','IMDS Submissions Pending'],
  },
  {
    no:'16', label:'Supplier NDA Sign Off', freq:'Monthly', icon:'📝', clause:'IATF 8.4',
    desc:'Monthly tracking and sign-off of Non-Disclosure Agreements with suppliers — new suppliers, renewals, and annual review.',
    activities:['Identify suppliers requiring new or renewed NDA','Issue NDA template to supplier for review and signature','Collect signed NDA and verify completeness','File signed NDA in supplier legal document register','Track NDA expiry dates and initiate renewal 60 days prior','Update NDA status in supplier master file'],
    docs:['NDA Template','Signed NDA (per Supplier)','NDA Expiry Tracker','Supplier Legal Document Register'],
    kpis:['NDAs Signed This Month','NDAs Expiring in Next 60 Days','Suppliers Without Valid NDA'],
  },
  {
    no:'17', label:'Supplier System Audit & Adherence', freq:'Monthly', icon:'📋', clause:'IATF 8.4.2',
    desc:'Monthly supplier quality management system audit — verify IATF/ISO 9001 compliance, procedures, records, and adherence.',
    activities:['Select suppliers for monthly system audit per annual audit plan','Issue audit plan and QMS checklist 2 weeks prior','Conduct on-site system audit (all QMS clauses)','Document findings: major NC, minor NC, observations','Issue audit report and request Corrective Action Plan (CAP)','Track CAP implementation and verify effectiveness at next visit'],
    docs:['Supplier System Audit Checklist (IATF/ISO)','Audit Plan','Audit Report','CAP Tracker'],
    kpis:['System Audits Completed vs Plan','Major NCs Found','CAP Closure Rate %'],
  },
  {
    no:'18', label:'Supplier Debit Note', freq:'Monthly', icon:'💸', clause:'IATF 8.7',
    desc:'Monthly compilation and issuance of supplier debit notes — for rejections, rework, sorting, and quality-related costs.',
    activities:['Compile all rejection, rework, and sorting records for the month','Calculate debit note value: material cost + rework/sorting labour + overhead','Prepare debit note document per supplier with full justification','Share debit note with purchase and send to supplier','Follow up supplier acknowledgement and account adjustment','Record debit notes raised and reconcile with accounts'],
    docs:['Monthly Debit Note Summary','Individual Debit Note per Supplier','Supporting Evidence (Rejection Records)','Purchase Debit Note Register'],
    kpis:['Debit Notes Issued','Total Debit Note Value (INR)','Debit Notes Acknowledged by Supplier %'],
  },
  {
    no:'19', label:'Supplier Rating & Best/Worst Supplier', freq:'Monthly', icon:'⭐', clause:'IATF 8.4.1',
    desc:'Monthly supplier rating — score each supplier on Quality (PPM), Delivery (OTIF), System (Audit), and Responsiveness.',
    activities:['Calculate monthly score for each supplier: Quality 40% + Delivery 30% + System 20% + Responsiveness 10%','Rank all suppliers and classify: A (85+), B (70–84), C (50–69), D (below 50)','Identify Best Supplier of the Month (highest score)','Identify Worst Supplier of the Month (lowest score)','Issue appreciation to best supplier; issue warning to worst','Publish supplier rating report to purchase, SCM, and management'],
    docs:['Monthly Supplier Rating Report','Supplier Rating Formula Sheet','Best/Worst Supplier Letter','Rating Trend Chart'],
    kpis:['Suppliers Rated This Month','A-Category Suppliers %','D-Category Suppliers Count'],
  },
  {
    no:'20', label:'Limit Sample Validation', freq:'Monthly', icon:'🔬', clause:'IATF 8.4',
    desc:'Monthly validation of limit (boundary) samples used for incoming and supplier quality inspection — Good/Bad/Marginal samples.',
    activities:['List all limit samples in use at IQC and supplier end','Physically check each limit sample: condition, legibility of label','Validate acceptance criteria: confirm Good sample is still within spec','Replace deteriorated or unlabelled samples with new approved samples','Get quality head sign-off on validated limit samples','Update limit sample register with validation date and next review date'],
    docs:['Limit Sample Register','Limit Sample Validation Record','Sample Label Format','Approval Sign-off Sheet'],
    kpis:['Limit Samples Validated','Samples Replaced/Renewed','Samples Overdue for Validation'],
  },
  {
    no:'21', label:'Supplier Kaizen & Quality Circle', freq:'Monthly', icon:'💡', clause:'IATF 10.3',
    desc:'Monthly tracking of Kaizen and Quality Circle activities at supplier end — ideas implemented, savings, and QC presentations.',
    activities:['Request monthly Kaizen and QC activity report from key suppliers','Review submitted Kaizen reports: before/after, savings, sustainability','Evaluate Quality Circle projects: theme, PDCA stage, results','Provide technical guidance on ongoing supplier Kaizens','Recognize top supplier Kaizen at quarterly SRM','Compile monthly summary of supplier Kaizens and QC projects'],
    docs:['Supplier Kaizen Report (Monthly)','QC Project Report','Kaizen Summary Register','Recognition Certificate'],
    kpis:['Kaizens Submitted by Suppliers','Kaizens Implemented','Active QC Circles at Suppliers'],
  },
  {
    no:'22', label:'Supplier Part Weight Verification', freq:'Monthly', icon:'⚖️', clause:'IATF 8.4',
    desc:'Monthly weight verification of supplier parts — compare actual weight vs drawing nominal weight; flag deviations.',
    activities:['Select parts for weight verification (critical, high-risk, new parts)','Weigh sample parts using calibrated weighing scale (minimum 5 samples)','Compare average weight against drawing nominal ± tolerance','Flag parts outside tolerance: may indicate material substitution or process deviation','Raise supplier query or SCAR if deviation found','Record weight verification results in monthly log'],
    docs:['Part Weight Verification Register','Drawing Weight Specification','Weighing Scale Calibration Certificate','Supplier Query/SCAR (if deviation)'],
    kpis:['Parts Weight-Verified This Month','Weight Deviations Found','Supplier Queries Raised'],
  },
];

const RATING_CRITERIA = [
  { area:'Quality', weight:40, kpis:['Incoming PPM vs target','Rejection rate %','Number of quality escapes to line','SCAR response time'], color:'bg-red-100 border-red-300 text-red-800' },
  { area:'Delivery', weight:30, kpis:['On-Time-In-Full (OTIF) %','Short supply incidents','Lead time adherence','Emergency supply response'], color:'bg-blue-100 border-blue-300 text-blue-800' },
  { area:'System', weight:20, kpis:['QMS certification status','Audit score (last audit)','PPAP submission quality','4M change communication'], color:'bg-purple-100 border-purple-300 text-purple-800' },
  { area:'Responsiveness', weight:10, kpis:['8D/SCAR response on time','MOM action closure %','Communication quality','Technical support provided'], color:'bg-green-100 border-green-300 text-green-800' },
];

const SCAR_STEPS = [
  { d:'D0', title:'Emergency Response', time:'Same day', desc:'Verify the escape. Decide if immediate containment at customer/line is needed. Issue preliminary SCAR notification.' },
  { d:'D1', title:'Team Formation', time:'24 hours', desc:'Supplier forms cross-functional team. Names team leader. Confirms receipt of SCAR with team details.' },
  { d:'D2', title:'Problem Description', time:'24 hours', desc:'Who, What, When, Where, How Many. Data-driven problem statement. Include defect samples/photos.' },
  { d:'D3', title:'Containment Action', time:'24 hours', desc:'Stop defect reaching customer. Sort all stock. PDIR at supplier gate. Sorting at plant. Quantity confirmed safe.' },
  { d:'D4', title:'Root Cause Analysis', time:'5 days', desc:'5-Why for occurrence cause. 5-Why for escape cause. Fishbone for systemic causes. Validated with data.' },
  { d:'D5', title:'Corrective Actions', time:'5 days', desc:'One corrective action per root cause. Permanent fix — not band-aid. Date and owner assigned.' },
  { d:'D6', title:'Implementation & Verification', time:'14 days', desc:'Implement CA. Run trial production. Verify CA effectiveness with data. Update PFMEA and control plan.' },
  { d:'D7', title:'Prevent Recurrence', time:'21 days', desc:'Horizontal deployment to similar parts/processes. Update standards, training, procedures, PFMEA.' },
  { d:'D8', title:'Recognition & Closure', time:'30 days', desc:'Verify PPM has improved. Close SCAR formally. Recognize team if response was excellent. Update supplier file.' },
];

const FREQ_COLOR: Record<string, string> = {
  Daily: 'bg-red-600 text-white', Weekly: 'bg-orange-500 text-white',
  Monthly: 'bg-blue-600 text-white', Quarterly: 'bg-green-600 text-white',
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SupplierQualityPage() {
  const [tab, setTab] = useState<'tracker'|'knowledge'|'scar'>('tracker');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [freqFilter, setFreqFilter] = useState('All');

  const filtered = freqFilter === 'All' ? PROCESSES : PROCESSES.filter(p => p.freq === freqFilter);
  const freqs = ['All','Daily','Weekly','Monthly','Quarterly'];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-orange-900 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">🏭 Supplier Quality Management</h1>
              <p className="text-orange-300 text-sm mt-1">Supplier development · PPAP · SCAR · Audit · Rating · PPM — IATF 16949 Cl. 8.4</p>
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-orange-800/60 rounded-lg px-4 py-2">
                <p className="text-2xl font-bold">{PROCESSES.length}</p>
                <p className="text-orange-300 text-xs">Processes</p>
              </div>
              <div className="bg-orange-800/60 rounded-lg px-4 py-2">
                <p className="text-2xl font-bold">{PROCESSES.filter(p=>p.freq==='Daily').length}</p>
                <p className="text-orange-300 text-xs">Daily</p>
              </div>
              <div className="bg-orange-800/60 rounded-lg px-4 py-2">
                <p className="text-2xl font-bold">{PROCESSES.filter(p=>p.freq==='Weekly').length}</p>
                <p className="text-orange-300 text-xs">Weekly</p>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 mt-4">
            {([['tracker','📋 Process Tracker'],['knowledge','📚 Supplier Quality Hub'],['scar','🔴 SCAR & 8D Guide']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition ${tab===id ? 'bg-white text-orange-900' : 'text-orange-300 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-5">

        {/* ── TAB 1: PROCESS TRACKER ─────────────────────────────────────── */}
        {tab === 'tracker' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filter:</span>
              {freqs.map(f => (
                <button key={f} onClick={()=>setFreqFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${freqFilter===f ? 'bg-orange-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {f}
                </button>
              ))}
              <span className="text-xs text-gray-400 ml-2">{filtered.length} processes</span>
            </div>

            {filtered.map(p => (
              <div key={p.no} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={()=>setExpanded(expanded===p.no ? null : p.no)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">#{p.no}</span>
                        <h3 className="font-bold text-gray-800">{p.label}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FREQ_COLOR[p.freq] ?? 'bg-gray-500 text-white'}`}>{p.freq}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.clause}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-lg">{expanded===p.no ? '▲' : '▼'}</span>
                </button>

                {expanded === p.no && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-orange-50/30">
                    <p className="text-sm text-gray-700">{p.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-2">✅ Activities</p>
                        <ul className="space-y-1">
                          {p.activities.map((a,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-gray-700">
                              <span className="text-orange-500 font-bold flex-shrink-0">{i+1}.</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">📄 Documents Required</p>
                        <ul className="space-y-1">
                          {p.docs.map((d,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-gray-700">
                              <span className="text-blue-500 flex-shrink-0">▸</span>{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2">📊 KPIs to Track</p>
                        <ul className="space-y-1">
                          {p.kpis.map((k,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-gray-700">
                              <span className="text-purple-500 flex-shrink-0">◆</span>{k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 2: SUPPLIER QUALITY HUB ────────────────────────────────── */}
        {tab === 'knowledge' && (
          <div className="space-y-6">

            {/* Supplier Rating Formula */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">⭐ Supplier Rating Formula — How to Score Your Suppliers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="font-bold text-orange-800 text-sm mb-2">Overall Supplier Score Formula</p>
                    <p className="font-mono text-orange-900 text-sm">Score = (Quality × 0.40) + (Delivery × 0.30) + (System × 0.20) + (Responsiveness × 0.10)</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { grade:'A', range:'85–100', label:'Excellent', color:'bg-green-100 text-green-800 border-green-300', action:'Preferred supplier. Reduce inspection frequency.' },
                      { grade:'B', range:'70–84', label:'Acceptable', color:'bg-yellow-100 text-yellow-800 border-yellow-300', action:'Monitor monthly. Set improvement targets.' },
                      { grade:'C', range:'50–69', label:'Concern', color:'bg-orange-100 text-orange-800 border-orange-300', action:'Development plan required. Tighten inspection.' },
                      { grade:'D', range:'Below 50', label:'Poor', color:'bg-red-100 text-red-800 border-red-300', action:'Conditional approval. Consider alternative supplier.' },
                    ].map((g,i)=>(
                      <div key={i} className={`flex items-start gap-3 border rounded-lg p-3 ${g.color}`}>
                        <span className="font-bold text-lg w-6 text-center">{g.grade}</span>
                        <div>
                          <p className="font-bold text-sm">{g.range} — {g.label}</p>
                          <p className="text-xs mt-0.5">{g.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {RATING_CRITERIA.map((c,i)=>(
                    <div key={i} className={`border rounded-xl p-4 ${c.color}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm">{c.area}</p>
                        <span className="font-bold text-lg">{c.weight}%</span>
                      </div>
                      <ul className="space-y-0.5">
                        {c.kpis.map((k,j)=>(
                          <li key={j} className="text-xs flex gap-1.5"><span>•</span>{k}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Supplier Classification */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🗂️ Supplier Classification — How to Categorize Your Supply Base</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { type:'Critical Supplier', icon:'🔴', def:'Sole source or long lead-time. Part failure causes line stop or safety issue.', action:'Monthly audit. Quarterly visit. Real-time PPM tracking. Safety stock mandatory.' },
                  { type:'Strategic Supplier', icon:'🟠', def:'High-value or technically complex parts. Key to product quality.', action:'Bi-monthly audit. Scorecard reviewed monthly. Development program active.' },
                  { type:'Standard Supplier', icon:'🟡', def:'Competitive sourcing possible. Standard parts with multiple alternatives.', action:'Annual audit. Monthly scorecard. AQL-based inspection.' },
                  { type:'Development Supplier', icon:'🟢', def:'New supplier or underperforming supplier being developed.', action:'100% inspection initially. Monthly visits. Formal development plan with targets.' },
                ].map((s,i)=>(
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-2xl mb-2">{s.icon}</p>
                    <p className="font-bold text-gray-800 text-sm mb-1">{s.type}</p>
                    <p className="text-xs text-gray-600 mb-2">{s.def}</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-2">
                      <p className="text-xs font-bold text-gray-700 mb-0.5">Action:</p>
                      <p className="text-xs text-gray-600">{s.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CQI Standards */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📋 AIAG CQI Process Audit Standards — Quick Reference</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { std:'CQI-9', process:'Heat Treatment', scope:'Hardening, tempering, case hardening, annealing, normalizing', use:'Apply to all heat-treated parts: gears, shafts, brackets, springs' },
                  { std:'CQI-11', process:'Electroplating', scope:'Zinc plating, nickel, chrome, tin plating processes', use:'Fasteners, brackets, body parts with corrosion protection' },
                  { std:'CQI-12', process:'Coating', scope:'Powder coat, e-coat, painting, painting process', use:'Body panels, seat frames, trim parts with surface coating' },
                  { std:'CQI-15', process:'Welding', scope:'MIG, TIG, spot welding, stud welding processes', use:'Welded assemblies, frame parts, mounting brackets' },
                  { std:'CQI-17', process:'Soldering', scope:'Wave, reflow, hand soldering processes', use:'PCBs, electronic components, sensor assemblies' },
                  { std:'CQI-23', process:'Injection Moulding', scope:'Plastic injection, overmoulding, insert moulding', use:'Plastic parts, clips, connectors, interior trim' },
                ].map((c,i)=>(
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
                      <span className="font-bold text-orange-400">{c.std}</span>
                      <span className="text-sm font-medium">{c.process}</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <p className="text-xs text-gray-600"><strong>Scope:</strong> {c.scope}</p>
                      <p className="text-xs text-gray-600"><strong>When to use:</strong> {c.use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IATF Clauses */}
            <div className="bg-orange-950 rounded-xl p-6 text-white">
              <h2 className="text-lg font-bold mb-4">📋 IATF 16949 — Key Supplier Quality Clauses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { clause:'8.4.1', title:'General — Supplier Control', req:'Approved Supplier List required. Supplier selection based on capability. Annual review of supplier performance.' },
                  { clause:'8.4.2', title:'Type & Extent of Control', req:'Risk-based supplier monitoring. Incoming inspection based on performance. CQI audits for special processes.' },
                  { clause:'8.4.2.1', title:'Supplier Monitoring', req:'Monitor supplier quality, delivery, and system. Share monitoring data with supplier. Escalation for poor performers.' },
                  { clause:'8.4.2.3', title:'Supplier Development', req:'Active supplier development program required. Prioritise high-risk suppliers. Document development activities.' },
                  { clause:'8.4.3', title:'Info to External Providers', req:'Communicate all requirements — specs, PPAP, packaging, CSR, delivery requirements — clearly in writing.' },
                  { clause:'10.2.3', title:'Problem Solving', req:'SCAR must require 8D or equivalent. Root cause to be documented. Horizontal deployment required.' },
                ].map((r,i)=>(
                  <div key={i} className="bg-orange-900/50 rounded-lg p-4 border border-orange-700">
                    <div className="flex gap-3">
                      <span className="font-mono text-orange-400 font-bold text-sm flex-shrink-0">{r.clause}</span>
                      <div>
                        <p className="font-bold text-orange-200 text-sm">{r.title}</p>
                        <p className="text-orange-300 text-xs mt-1">{r.req}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: SCAR & 8D GUIDE ───────────────────────────────────────── */}
        {tab === 'scar' && (
          <div className="space-y-6">

            {/* What is SCAR */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">🔴 What is a SCAR?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>SCAR = Supplier Corrective Action Request</strong>. It is a formal document raised by the customer (your plant) to a supplier demanding:
                  </p>
                  <ul className="mt-3 space-y-1">
                    {['Immediate containment of defective material','Root cause analysis of the defect','Permanent corrective action','Evidence of implementation and effectiveness verification'].map((s,i)=>(
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-red-500 font-bold">{i+1}.</span>{s}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="font-bold text-red-800 text-sm mb-1">When to raise a SCAR:</p>
                    <ul className="text-xs text-red-700 space-y-0.5">
                      <li>• Supplier PPM exceeds threshold (e.g. &gt;500 PPM)</li>
                      <li>• Defect reached production line or customer</li>
                      <li>• Same defect repeating for 2nd time</li>
                      <li>• Critical or safety defect found</li>
                      <li>• Line stoppage caused by supplier part</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-bold text-blue-800 text-sm mb-2">📋 SCAR Response Timeline</p>
                    <div className="space-y-1 text-xs text-blue-700">
                      <p><strong>D1–D3:</strong> Team formation + containment → 24–48 hours</p>
                      <p><strong>D4–D5:</strong> Root cause + corrective action → 5–7 days</p>
                      <p><strong>D6–D7:</strong> Implementation + verification → 14–21 days</p>
                      <p><strong>D8:</strong> Closure + effectiveness confirmed → 30 days</p>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="font-bold text-orange-800 text-sm mb-2">⚠️ Common SCAR Mistakes</p>
                    <ul className="text-xs text-orange-700 space-y-0.5">
                      <li>• Root cause = symptom (e.g. operator error — not root cause)</li>
                      <li>• CA is same as containment (sorting is not CA)</li>
                      <li>• No evidence of PFMEA/Control Plan update</li>
                      <li>• No horizontal deployment to similar parts</li>
                      <li>• Closed without effectiveness verification data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 8D Steps */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🔴 8D Problem Solving — Full Step Guide</h2>
              <div className="space-y-3">
                {SCAR_STEPS.map((s,i)=>(
                  <div key={i} className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 transition">
                    <div className="bg-orange-900 text-white rounded-lg px-3 py-2 text-center flex-shrink-0">
                      <p className="font-mono font-bold text-sm">{s.d}</p>
                      <p className="text-xs text-orange-300">{s.time}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5-Why Guide */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">❓ 5-Why Analysis — Root Cause Guide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">Real Factory Example: Dimensional Rejection</p>
                  <div className="space-y-2">
                    {[
                      { why:'Why 1', q:'Why were parts rejected?', a:'Hole diameter was out of tolerance (12.1mm vs 12.0mm spec)' },
                      { why:'Why 2', q:'Why was hole diameter oversized?', a:'Drill bit was worn beyond replacement trigger point' },
                      { why:'Why 3', q:'Why was worn drill bit not replaced?', a:'No drill bit wear monitoring system in place — visual check only' },
                      { why:'Why 4', q:'Why was there no monitoring system?', a:'Tool life control not defined in process control plan' },
                      { why:'Why 5', q:'Why was tool life not in control plan?', a:'Process risk not identified in PFMEA — risk assessment gap' },
                    ].map((w,i)=>(
                      <div key={i} className="flex gap-3">
                        <div className="bg-red-700 text-white rounded text-xs px-2 py-1 font-bold flex-shrink-0 h-fit">{w.why}</div>
                        <div className="border-l-2 border-red-200 pl-3">
                          <p className="text-xs font-bold text-gray-700">{w.q}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{w.a}</p>
                        </div>
                      </div>
                    ))}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                      <p className="text-xs font-bold text-red-800">Root Cause: PFMEA did not identify tool wear as a risk → no control plan entry → no monitoring</p>
                      <p className="text-xs text-red-700 mt-1">Corrective Action: Update PFMEA — add tool wear risk. Add tool life counter in control plan. Define replacement frequency. Verify with data.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">5-Why Rules — Common Mistakes to Avoid</p>
                  <div className="space-y-2">
                    {[
                      { rule:'Ask "Why?" not "Who?"', detail:'Root cause is always a system/process failure — not a person. Never stop at "operator error".' },
                      { rule:'Validate each Why with data', detail:'Every answer must be provable with evidence. Opinion-based 5-Why is useless.' },
                      { rule:'Two chains: Occurrence + Escape', detail:'Why did it happen? AND Why did it escape inspection? Both need root causes.' },
                      { rule:'Stop at the controllable level', detail:'Stop where you have actual control to make a change. 5 is a guideline — not a rule.' },
                      { rule:'CA must address root cause', detail:'If your CA does not directly address the last Why — it is not a root cause fix.' },
                    ].map((r,i)=>(
                      <div key={i} className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <span className="text-blue-600 font-bold text-sm flex-shrink-0">✓</span>
                        <div>
                          <p className="text-xs font-bold text-blue-800">{r.rule}</p>
                          <p className="text-xs text-blue-700 mt-0.5">{r.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PPM Calculation */}
            <div className="bg-orange-950 rounded-xl p-6 text-white">
              <h2 className="text-lg font-bold mb-4">📊 Supplier PPM — Calculation & Targets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-orange-900/60 rounded-xl p-5 text-center border border-orange-700 mb-4">
                    <p className="text-orange-300 text-sm font-bold mb-2">Supplier PPM Formula</p>
                    <p className="text-xl font-bold font-mono">PPM = (Qty Rejected / Qty Received) × 1,000,000</p>
                  </div>
                  <p className="text-orange-300 font-bold text-sm mb-3">Industry PPM Targets:</p>
                  <div className="space-y-2">
                    {[
                      { target:'0–50 PPM', label:'World Class — Tier 1 OEM supplier standard', color:'bg-green-500' },
                      { target:'51–200 PPM', label:'Good — Acceptable for most automotive', color:'bg-yellow-500' },
                      { target:'201–500 PPM', label:'Monitor — Issue warning, set targets', color:'bg-orange-500' },
                      { target:'500+ PPM', label:'SCAR Required — Immediate action needed', color:'bg-red-500' },
                    ].map((b,i)=>(
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${b.color}`} />
                        <span className="font-mono text-sm text-orange-200 w-28">{b.target}</span>
                        <span className="text-xs text-orange-300">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-orange-300 font-bold text-sm mb-3">Containment Decision Matrix:</p>
                  <div className="space-y-2 text-xs">
                    {[
                      { esc:'IQC Detection', impact:'Low', action:'Sort incoming lot. Issue SCAR. 100% inspection until CA verified.' },
                      { esc:'Line Detection', impact:'Medium', action:'Sort WIP. Sort incoming stock. SCAR + 8D in 24 hrs. Containment at supplier.' },
                      { esc:'Field Detection', impact:'High', action:'Customer containment. Field sort/recall. Emergency SCAR. 8D in 48 hrs. Senior management review.' },
                    ].map((r,i)=>(
                      <div key={i} className="bg-orange-900/50 border border-orange-700 rounded-lg p-3">
                        <div className="flex gap-2 mb-1">
                          <span className="font-bold text-orange-300">{r.esc}</span>
                          <span className={`px-1.5 rounded text-xs font-bold ${r.impact==='High' ? 'bg-red-600' : r.impact==='Medium' ? 'bg-orange-600' : 'bg-yellow-600'} text-white`}>{r.impact}</span>
                        </div>
                        <p className="text-orange-200">{r.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
