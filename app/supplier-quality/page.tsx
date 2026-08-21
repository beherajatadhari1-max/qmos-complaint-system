'use client';
import { useState } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// --- DATA ---------------------------------------------------------------------
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
  { area:'Delivery', weight:30, kpis:['On-Time-In-Full (OTIF) %','Short supply incidents','Lead time adherence','Emergency supply response'], color:'bg-blue-100 border-blue-600/50 text-blue-200' },
  { area:'System', weight:20, kpis:['QMS certification status','Audit score (last audit)','PPAP submission quality','4M change communication'], color:'bg-purple-100 border-purple-300 text-purple-200' },
  { area:'Responsiveness', weight:10, kpis:['8D/SCAR response on time','MOM action closure %','Communication quality','Technical support provided'], color:'bg-green-100 border-green-300 text-green-300' },
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

// --- MAIN PAGE ----------------------------------------------------------------
// -- Supplier Dashboard & Scorecard Data --------------------------------------
const SAMPLE_SUPPLIERS = [
  { id:'S001', name:'Acme Stampings',     category:'Sheet Metal',  ppm:180, target:200, scarsOpen:1, scarsTotal:3, ppapStatus:'Approved', auditScore:82, delivery:88, cost:90, service:85, lastAudit:'2026-04-10', status:'green'  },
  { id:'S002', name:'Precision Castings', category:'Casting',      ppm:420, target:200, scarsOpen:2, scarsTotal:5, ppapStatus:'Conditional', auditScore:68, delivery:72, cost:80, service:70, lastAudit:'2026-03-22', status:'red'    },
  { id:'S003', name:'Hi-Tech Plastics',   category:'Plastics',     ppm:95,  target:200, scarsOpen:0, scarsTotal:2, ppapStatus:'Approved', auditScore:91, delivery:94, cost:88, service:92, lastAudit:'2026-05-15', status:'green'  },
  { id:'S004', name:'Global Forgings',    category:'Forging',      ppm:310, target:200, scarsOpen:1, scarsTotal:4, ppapStatus:'Approved', auditScore:74, delivery:78, cost:75, service:80, lastAudit:'2026-02-28', status:'amber'  },
  { id:'S005', name:'Metro Rubber',       category:'Rubber',       ppm:55,  target:200, scarsOpen:0, scarsTotal:1, ppapStatus:'Approved', auditScore:88, delivery:91, cost:85, service:89, lastAudit:'2026-05-01', status:'green'  },
  { id:'S006', name:'Apex Electronics',   category:'Electronics',  ppm:680, target:200, scarsOpen:3, scarsTotal:6, ppapStatus:'Conditional', auditScore:61, delivery:65, cost:70, service:62, lastAudit:'2026-01-15', status:'red'    },
];

const PPM_TREND = [
  { month:'Jan', ppm:380 }, { month:'Feb', ppm:340 }, { month:'Mar', ppm:310 },
  { month:'Apr', ppm:290 }, { month:'May', ppm:260 }, { month:'Jun', ppm:248 },
];


// -- Supplier Dashboard --------------------------------------------------------
function SupplierDashboard() {
  const total = SAMPLE_SUPPLIERS.length;
  const green = SAMPLE_SUPPLIERS.filter(s => s.status === 'green').length;
  const amber = SAMPLE_SUPPLIERS.filter(s => s.status === 'amber').length;
  const red   = SAMPLE_SUPPLIERS.filter(s => s.status === 'red').length;
  const avgPPM = Math.round(SAMPLE_SUPPLIERS.reduce((a,s)=>a+s.ppm,0)/total);
  const totalScarsOpen  = SAMPLE_SUPPLIERS.reduce((a,s)=>a+s.scarsOpen,0);
  const totalScarsTotal = SAMPLE_SUPPLIERS.reduce((a,s)=>a+s.scarsTotal,0);
  const scarClosureRate = totalScarsTotal > 0 ? Math.round(((totalScarsTotal-totalScarsOpen)/totalScarsTotal)*100) : 0;
  const avgAudit = Math.round(SAMPLE_SUPPLIERS.reduce((a,s)=>a+s.auditScore,0)/total);
  const approved = SAMPLE_SUPPLIERS.filter(s=>s.ppapStatus==='Approved').length;
  const conditional = SAMPLE_SUPPLIERS.filter(s=>s.ppapStatus==='Conditional').length;

  const riskSuppliers = [...SAMPLE_SUPPLIERS].sort((a,b)=>b.ppm-a.ppm).slice(0,4);
  const maxPPM = Math.max(...SAMPLE_SUPPLIERS.map(s=>s.ppm));
  const maxTrend = Math.max(...PPM_TREND.map(t=>t.ppm));

  return (
      <>
      <PageTitle title="Supplier Quality" />
      <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Avg Supplier PPM',    value: avgPPM,          sub:`Target: 200 PPM`, color: avgPPM<=200?'text-emerald-600':avgPPM<=400?'text-amber-600':'text-red-600' },
          { label:'SCAR Closure Rate',   value: `${scarClosureRate}%`, sub:`${totalScarsOpen} open SCARs`, color: scarClosureRate>=80?'text-emerald-600':scarClosureRate>=60?'text-amber-600':'text-red-600' },
          { label:'Avg Audit Score',     value: `${avgAudit}%`,  sub:`${approved}/${total} approved`, color: avgAudit>=80?'text-emerald-600':avgAudit>=65?'text-amber-600':'text-red-600' },
          { label:'Supplier Risk Status',value: `${red} Red`,    sub:`${amber} Amber · ${green} Green`, color: red>0?'text-red-600':'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PPM Trend */}
        <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Plant Incoming PPM Trend (6 Months)</div>
          <div className="flex items-end gap-2 h-36">
            {PPM_TREND.map(t => {
              const pct = Math.round((t.ppm / maxTrend) * 100);
              const color = t.ppm <= 200 ? 'bg-emerald-500' : t.ppm <= 400 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-[#1e3a5f]">{t.ppm}</span>
                  <div className={`w-full rounded-t-md ${color}`} style={{height:`${pct}%`, minHeight:'8px'}} />
                  <span className="text-xs text-[#1e3a5f]">{t.month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-[#1e3a5f]">
            <div className="w-3 h-3 rounded bg-red-400" /> &gt;400 &nbsp;
            <div className="w-3 h-3 rounded bg-amber-400" /> 201–400 &nbsp;
            <div className="w-3 h-3 rounded bg-emerald-500" /> ≤200 (target)
          </div>
        </div>

        {/* PPAP Status + Supplier Health */}
        <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Supplier Health Overview</div>
          <div className="space-y-3">
            {[
              { label:'🟢 Green (On Target)',     value: green,       total, color:'bg-emerald-500', text:'text-emerald-700' },
              { label:'🟡 Amber (Watch List)',    value: amber,       total, color:'bg-amber-500',   text:'text-amber-700' },
              { label:'🔴 Red (Action Required)', value: red,        total, color:'bg-red-500',      text:'text-red-700' },
              { label:'✅ PPAP Approved',         value: approved,    total, color:'bg-blue-500',    text:'text-[#1d4ed8]' },
              { label:'⚠️ Conditional Approval',  value: conditional, total, color:'bg-orange-500',  text:'text-orange-600' },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-medium ${b.text}`}>{b.label}</span>
                  <span className="text-[#1e3a5f]">{b.value}/{b.total}</span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div className={`${b.color} h-2 rounded-full`} style={{width:`${Math.round(b.value/b.total*100)}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Risk Suppliers */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">🔴 Top Risk Suppliers by PPM</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-900/30 text-left">
                {['Supplier','Category','PPM','Target','SCAR Open','Audit Score','PPAP Status','Action'].map(h=>(
                  <th key={h} className="px-3 py-2 text-xs font-bold text-[#1e3a5f]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskSuppliers.map(s => (
                <tr key={s.id} className="border-t border-[#dbeafe] hover:bg-[#eff6ff]">
                  <td className="px-3 py-2 font-semibold text-[#1e3a5f]">{s.name}</td>
                  <td className="px-3 py-2 text-[#1e3a5f] text-xs">{s.category}</td>
                  <td className={`px-3 py-2 font-bold ${s.ppm>400?'text-red-600':s.ppm>200?'text-amber-600':'text-emerald-600'}`}>{s.ppm}</td>
                  <td className="px-3 py-2 text-[#1e3a5f]">{s.target}</td>
                  <td className={`px-3 py-2 font-bold ${s.scarsOpen>0?'text-red-600':'text-[#1e3a5f]'}`}>{s.scarsOpen}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.auditScore>=80?'bg-emerald-100 text-emerald-700':s.auditScore>=65?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{s.auditScore}%</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.ppapStatus==='Approved'?'bg-blue-100 text-[#1d4ed8]':'bg-orange-100 text-orange-600'}`}>{s.ppapStatus}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold ${s.status==='red'?'text-red-600':s.status==='amber'?'text-amber-600':'text-emerald-600'}`}>
                      {s.status==='red'?'🔴 SCAR Now':s.status==='amber'?'⚠️ Monitor':'✅ On Track'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maturity Score */}
      <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-5">
        <div className="text-sm font-bold text-orange-200 mb-4">📊 Supplier Quality Programme Maturity</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Avg PPM Performance', score: avgPPM<=200?100:avgPPM<=400?70:40, target:100 },
            { label:'SCAR Closure Rate',   score: scarClosureRate, target:90 },
            { label:'Avg Audit Score',     score: avgAudit, target:85 },
            { label:'PPAP Approval Rate',  score: Math.round(approved/total*100), target:100 },
          ].map(m => {
            const color = m.score >= m.target ? '#10b981' : m.score >= m.target*0.7 ? '#f59e0b' : '#ef4444';
            return (
              <div key={m.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="text-xs text-[#1e3a5f] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-[#1e3a5f] mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-white rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{width:`${Math.min(m.score,100)}%`, background:color}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
      </>
  );
}

// -- Supplier Scorecard --------------------------------------------------------
function SupplierScorecard() {
  const [selected, setSelected] = useState<string|null>(null);

  function overallScore(s: typeof SAMPLE_SUPPLIERS[0]) {
    return Math.round((s.auditScore*0.4 + s.delivery*0.3 + s.cost*0.15 + s.service*0.15));
  }

  function rating(score: number): { label:string; color:string; bg:string } {
    if (score >= 85) return { label:'A — Preferred', color:'text-emerald-700', bg:'bg-emerald-100' };
    if (score >= 70) return { label:'B — Approved',  color:'text-[#1d4ed8]',    bg:'bg-blue-100' };
    if (score >= 55) return { label:'C — Conditional',color:'text-amber-700',  bg:'bg-amber-100' };
    return                 { label:'D — Disqualify', color:'text-red-700',     bg:'bg-red-100' };
  }

  const detail = selected ? SAMPLE_SUPPLIERS.find(s=>s.id===selected) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-1">Supplier Scorecard — Quality · Delivery · Cost · Service</div>
        <p className="text-xs text-[#1e3a5f] mb-4">Weighted score: Quality 40% · Delivery 30% · Cost 15% · Service 15%</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-900/30">
                {['Supplier','Category','Quality/Audit','Delivery','Cost','Service','Overall','Rating','PPAP','PPM','Last Audit'].map(h=>(
                  <th key={h} className="px-3 py-2 text-xs font-bold text-[#1e3a5f] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...SAMPLE_SUPPLIERS].sort((a,b)=>overallScore(b)-overallScore(a)).map(s => {
                const overall = overallScore(s);
                const r = rating(overall);
                const isSelected = selected === s.id;
                return (
                  <tr key={s.id}
                    className={`border-t border-[#dbeafe] cursor-pointer transition ${isSelected?'bg-orange-900/30':'hover:bg-[#eff6ff]'}`}
                    onClick={()=>setSelected(isSelected?null:s.id)}>
                    <td className="px-3 py-2 font-semibold text-[#1e3a5f]">{s.name}</td>
                    <td className="px-3 py-2 text-xs text-[#1e3a5f]">{s.category}</td>
                    {[s.auditScore, s.delivery, s.cost, s.service].map((v,i)=>(
                      <td key={i} className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold ${v>=80?'text-emerald-600':v>=65?'text-amber-600':'text-red-600'}`}>{v}%</span>
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <span className="text-sm font-bold text-[#1e3a5f]">{overall}%</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.bg} ${r.color}`}>{r.label}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.ppapStatus==='Approved'?'bg-blue-100 text-[#1d4ed8]':'bg-orange-100 text-orange-600'}`}>{s.ppapStatus}</span>
                    </td>
                    <td className={`px-3 py-2 text-center font-bold text-xs ${s.ppm>400?'text-red-600':s.ppm>200?'text-amber-600':'text-emerald-600'}`}>{s.ppm}</td>
                    <td className="px-3 py-2 text-xs text-[#1e3a5f]">{s.lastAudit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {detail && (
        <div className="bg-white rounded-xl border border-orange-700/50 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
            <div>
              <div className="text-lg font-bold text-[#1e3a5f]">{detail.name}</div>
              <div className="text-xs text-[#1e3a5f]">{detail.category} · {detail.id} · Last Audit: {detail.lastAudit}</div>
            </div>
            <button onClick={()=>setSelected(null)} className="text-[#1e3a5f] hover:text-[#1e3a5f] text-xl font-bold">×</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label:'Quality (Audit Score)', value: detail.auditScore, weight:'40%' },
              { label:'Delivery Performance',  value: detail.delivery,   weight:'30%' },
              { label:'Cost Performance',      value: detail.cost,       weight:'15%' },
              { label:'Service Quality',       value: detail.service,    weight:'15%' },
            ].map(m => {
              const color = m.value>=80?'#10b981':m.value>=65?'#f59e0b':'#ef4444';
              return (
                <div key={m.label} className="bg-orange-900/30 rounded-xl p-3 text-center">
                  <div className="text-xs text-[#1e3a5f] mb-1">{m.label}</div>
                  <div className="text-2xl font-bold" style={{color}}>{m.value}%</div>
                  <div className="text-xs text-[#1e3a5f] mt-0.5">Weight: {m.weight}</div>
                  <div className="mt-2 w-full bg-[#dbeafe] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{width:`${m.value}%`, background:color}} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-[#eff6ff] rounded-lg p-3">
              <div className="text-xs text-[#1e3a5f]">PPM</div>
              <div className={`text-xl font-bold ${detail.ppm>400?'text-red-600':detail.ppm>200?'text-amber-600':'text-emerald-600'}`}>{detail.ppm}</div>
              <div className="text-xs text-[#1e3a5f]">Target: {detail.target}</div>
            </div>
            <div className="bg-[#eff6ff] rounded-lg p-3">
              <div className="text-xs text-[#1e3a5f]">Open SCARs</div>
              <div className={`text-xl font-bold ${detail.scarsOpen>0?'text-red-600':'text-emerald-600'}`}>{detail.scarsOpen}</div>
              <div className="text-xs text-[#1e3a5f]">Total: {detail.scarsTotal}</div>
            </div>
            <div className="bg-[#eff6ff] rounded-lg p-3">
              <div className="text-xs text-[#1e3a5f]">PPAP Status</div>
              <div className={`text-xl font-bold ${detail.ppapStatus==='Approved'?'text-blue-600':'text-orange-600'}`}>{detail.ppapStatus}</div>
              <div className="text-xs text-[#1e3a5f]">Overall: {overallScore(detail)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Legend */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Supplier Rating Legend (IATF 8.4.1)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { grade:'A — Preferred',    range:'≥85%',  desc:'Full approval. Priority sourcing. Minimal incoming inspection.', color:'emerald' },
            { grade:'B — Approved',     range:'70–84%', desc:'Standard approval. Normal incoming inspection. Set improvement targets.', color:'blue' },
            { grade:'C — Conditional',  range:'55–69%', desc:'Conditional approval. 100% incoming inspection. SCAR raised. Dev plan active.', color:'amber' },
            { grade:'D — Disqualify',   range:'<55%',  desc:'De-list from ASL. Immediate alternate sourcing. Escalate to management.', color:'red' },
          ].map(r => (
            <div key={r.grade} className={`bg-${r.color}-50 border border-${r.color}-200 rounded-xl p-3`}>
              <div className={`text-xs font-bold text-${r.color}-700 mb-1`}>{r.grade}</div>
              <div className={`text-lg font-bold text-${r.color}-800 mb-1`}>{r.range}</div>
              <div className="text-xs text-[#1e3a5f]">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function SupplierQualityPage() {
  const [tab, setTab] = useState<'dashboard'|'tracker'|'knowledge'|'scar'|'scorecard'>('dashboard');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [freqFilter, setFreqFilter] = useState('All');

  const filtered = freqFilter === 'All' ? PROCESSES : PROCESSES.filter(p => p.freq === freqFilter);
  const freqs = ['All','Daily','Weekly','Monthly','Quarterly'];

  return (
    <div className="min-h-screen bg-[#eff6ff]">

      {/* -- HEADER ------------------------------------------------------- */}
      <div className="bg-orange-900 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">🏭 Supplier Quality Management</h1>
              <p className="text-orange-600 text-sm mt-1">Supplier development · PPAP · SCAR · Audit · Rating · PPM — IATF 16949 Cl. 8.4</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label:'Daily',     freq:'Daily',     value:PROCESSES.filter(p=>p.freq==='Daily').length,     color:'bg-red-700',    ring:'ring-red-300'    },
                { label:'Weekly',    freq:'Weekly',    value:PROCESSES.filter(p=>p.freq==='Weekly').length,    color:'bg-blue-700',   ring:'ring-blue-300'   },
                { label:'Monthly',   freq:'Monthly',   value:PROCESSES.filter(p=>p.freq==='Monthly').length,   color:'bg-green-700',  ring:'ring-green-300'  },
                { label:'Quarterly', freq:'Quarterly', value:PROCESSES.filter(p=>p.freq==='Quarterly').length, color:'bg-purple-700', ring:'ring-purple-300' },
              ].map(s => (
                <button key={s.label} onClick={()=>{ setFreqFilter(f=>f===s.freq?'All':s.freq); setTab('tracker'); }}
                  className={`${s.color} rounded-lg px-3 py-2 transition-all hover:brightness-110 hover:scale-[1.02] ${freqFilter===s.freq?`ring-2 ${s.ring} scale-[1.03]`:'opacity-85'}`}>
                  <p className="text-xl font-bold text-white drop-shadow">{s.value}</p>
                  <p className="text-[11px] text-white font-semibold leading-tight">{s.label}</p>
                  <p className="text-[10px] text-white/90">{freqFilter===s.freq?'▲ All':'Click to filter'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 mt-4 flex-wrap">
            {([['dashboard','📊 Dashboard'],['tracker','📋 Process Tracker'],['knowledge','📚 Supplier Quality Hub'],['scar','🔴 SCAR & 8D Guide'],['scorecard','🏆 Supplier Scorecard']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`px-5 py-2.5 rounded-t-lg text-sm font-semibold transition ${tab===id ? 'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]' : 'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-5">

        {/* -- TAB 1: PROCESS TRACKER --------------------------------------- */}
      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/supplier-quality/Supplier_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Supplier Audit XLS">Supplier Audit XLS</a><a href="/downloads/supplier-quality/Supplier_Audit_Checklist.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Supplier Audit XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/supplier-quality/Supplier_Scorecard.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Supplier Scorecard">Supplier Scorecard</a><a href="/downloads/supplier-quality/Supplier_Scorecard.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Supplier Scorecard">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/supplier-quality/Approved_Supplier_List.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Approved Supplier List">Approved Supplier List</a><a href="/downloads/supplier-quality/Approved_Supplier_List.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Approved Supplier List">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#b45309'}}><a href="/downloads/supplier-quality/Supplier_Development_Plan.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Dev Plan XLS">Dev Plan XLS</a><a href="/downloads/supplier-quality/Supplier_Development_Plan.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Dev Plan XLS">⬇</a></span>
      </div>
        {tab === 'dashboard' && <SupplierDashboard />}

        {tab === 'scorecard' && <SupplierScorecard />}

        {tab === 'tracker' && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Filter:</span>
              {freqs.map(f => (
                <button key={f} onClick={()=>setFreqFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${freqFilter===f ? 'bg-orange-700 text-white' : 'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
                  {f}
                </button>
              ))}
              <span className="text-xs text-[#1e3a5f] ml-2">{filtered.length} processes</span>
            </div>

            {filtered.map(p => (
              <div key={p.no} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm overflow-hidden">
                <button
                  onClick={()=>setExpanded(expanded===p.no ? null : p.no)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#eff6ff] transition text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-[#1e3a5f]">#{p.no}</span>
                        <h3 className="font-bold text-[#1e3a5f]">{p.label}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FREQ_COLOR[p.freq] ?? 'bg-gray-500 text-white'}`}>{p.freq}</span>
                      </div>
                      <p className="text-xs text-[#1e3a5f] mt-0.5">{p.clause}</p>
                    </div>
                  </div>
                  <span className="text-[#1e3a5f] text-lg">{expanded===p.no ? '▲' : '▼'}</span>
                </button>

                {expanded === p.no && (
                  <div className="border-t border-[#dbeafe] px-5 py-4 space-y-4 bg-orange-900/30/30">
                    <p className="text-sm text-[#1e3a5f]">{p.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">✅ Activities</p>
                        <ul className="space-y-1">
                          {p.activities.map((a,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-[#1e3a5f]">
                              <span className="text-orange-500 font-bold flex-shrink-0">{i+1}.</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-wide mb-2">📄 Documents Required</p>
                        <ul className="space-y-1">
                          {p.docs.map((d,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-[#1e3a5f]">
                              <span className="text-blue-500 flex-shrink-0">▸</span>{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-200 uppercase tracking-wide mb-2">📊 KPIs to Track</p>
                        <ul className="space-y-1">
                          {p.kpis.map((k,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-[#1e3a5f]">
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

        {/* -- TAB 2: SUPPLIER QUALITY HUB ---------------------------------- */}
        {tab === 'knowledge' && (
          <div className="animate-fadeIn space-y-6">

            {/* Supplier Rating Formula */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">⭐ Supplier Rating Formula — How to Score Your Suppliers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 mb-4">
                    <p className="font-bold text-orange-600 text-sm mb-2">Overall Supplier Score Formula</p>
                    <p className="font-mono text-orange-200 text-sm">Score = (Quality × 0.40) + (Delivery × 0.30) + (System × 0.20) + (Responsiveness × 0.10)</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { grade:'A', range:'85–100', label:'Excellent', color:'bg-green-100 text-[#15803d] border-green-300', action:'Preferred supplier. Reduce inspection frequency.' },
                      { grade:'B', range:'70–84', label:'Acceptable', color:'bg-yellow-100 text-yellow-200 border-yellow-300', action:'Monitor monthly. Set improvement targets.' },
                      { grade:'C', range:'50–69', label:'Concern', color:'bg-orange-100 text-orange-600 border-orange-300', action:'Development plan required. Tighten inspection.' },
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
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-y-2">
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
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">🗂️ Supplier Classification — How to Categorize Your Supply Base</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { type:'Critical Supplier', icon:'🔴', def:'Sole source or long lead-time. Part failure causes line stop or safety issue.', action:'Monthly audit. Quarterly visit. Real-time PPM tracking. Safety stock mandatory.' },
                  { type:'Strategic Supplier', icon:'🟠', def:'High-value or technically complex parts. Key to product quality.', action:'Bi-monthly audit. Scorecard reviewed monthly. Development program active.' },
                  { type:'Standard Supplier', icon:'🟡', def:'Competitive sourcing possible. Standard parts with multiple alternatives.', action:'Annual audit. Monthly scorecard. AQL-based inspection.' },
                  { type:'Development Supplier', icon:'🟢', def:'New supplier or underperforming supplier being developed.', action:'100% inspection initially. Monthly visits. Formal development plan with targets.' },
                ].map((s,i)=>(
                  <div key={i} className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-4">
                    <p className="text-2xl mb-2">{s.icon}</p>
                    <p className="font-bold text-[#1e3a5f] text-sm mb-1">{s.type}</p>
                    <p className="text-xs text-[#1e3a5f] mb-2">{s.def}</p>
                    <div className="bg-white border border-[#dbeafe] rounded-lg p-2">
                      <p className="text-xs font-bold text-[#1e3a5f] mb-0.5">Action:</p>
                      <p className="text-xs text-[#1e3a5f]">{s.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CQI Standards */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">📋 AIAG CQI Process Audit Standards — Quick Reference</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { std:'CQI-9', process:'Heat Treatment', scope:'Hardening, tempering, case hardening, annealing, normalizing', use:'Apply to all heat-treated parts: gears, shafts, brackets, springs' },
                  { std:'CQI-11', process:'Electroplating', scope:'Zinc plating, nickel, chrome, tin plating processes', use:'Fasteners, brackets, body parts with corrosion protection' },
                  { std:'CQI-12', process:'Coating', scope:'Powder coat, e-coat, painting, painting process', use:'Body panels, seat frames, trim parts with surface coating' },
                  { std:'CQI-15', process:'Welding', scope:'MIG, TIG, spot welding, stud welding processes', use:'Welded assemblies, frame parts, mounting brackets' },
                  { std:'CQI-17', process:'Soldering', scope:'Wave, reflow, hand soldering processes', use:'PCBs, electronic components, sensor assemblies' },
                  { std:'CQI-23', process:'Injection Moulding', scope:'Plastic injection, overmoulding, insert moulding', use:'Plastic parts, clips, connectors, interior trim' },
                ].map((c,i)=>(
                  <div key={i} className="border border-[#dbeafe] rounded-xl overflow-hidden">
                    <div className="bg-white text-[#1e3a5f] px-4 py-2 flex items-center justify-between">
                      <span className="font-bold text-orange-400">{c.std}</span>
                      <span className="text-sm font-medium">{c.process}</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <p className="text-xs text-[#1e3a5f]"><strong>Scope:</strong> {c.scope}</p>
                      <p className="text-xs text-[#1e3a5f]"><strong>When to use:</strong> {c.use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IATF Clauses */}
            <div className="bg-orange-900/60 rounded-xl p-6 text-white">
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
                  <div key={i} className="bg-orange-900/30/50 rounded-lg p-4 border border-orange-700">
                    <div className="flex gap-3">
                      <span className="font-mono text-orange-400 font-bold text-sm flex-shrink-0">{r.clause}</span>
                      <div>
                        <p className="font-bold text-orange-200 text-sm">{r.title}</p>
                        <p className="text-orange-600 text-xs mt-1">{r.req}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -- TAB 3: SCAR & 8D GUIDE ----------------------------------------- */}
        {tab === 'scar' && (
          <div className="animate-fadeIn space-y-6">

            {/* What is SCAR */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">🔴 What is a SCAR?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm text-[#1e3a5f] leading-relaxed">
                    <strong>SCAR = Supplier Corrective Action Request</strong>. It is a formal document raised by the customer (your plant) to a supplier demanding:
                  </p>
                  <ul className="mt-3 space-y-1">
                    {['Immediate containment of defective material','Root cause analysis of the defect','Permanent corrective action','Evidence of implementation and effectiveness verification'].map((s,i)=>(
                      <li key={i} className="flex gap-2 text-sm text-[#1e3a5f]">
                        <span className="text-red-500 font-bold">{i+1}.</span>{s}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-4 bg-red-50 border border-red-700/50 rounded-xl">
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
                  <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl p-4">
                    <p className="font-bold text-blue-200 text-sm mb-2">📋 SCAR Response Timeline</p>
                    <div className="space-y-1 text-xs text-[#1d4ed8]">
                      <p><strong>D1–D3:</strong> Team formation + containment → 24–48 hours</p>
                      <p><strong>D4–D5:</strong> Root cause + corrective action → 5–7 days</p>
                      <p><strong>D6–D7:</strong> Implementation + verification → 14–21 days</p>
                      <p><strong>D8:</strong> Closure + effectiveness confirmed → 30 days</p>
                    </div>
                  </div>
                  <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4">
                    <p className="font-bold text-orange-600 text-sm mb-2">⚠️ Common SCAR Mistakes</p>
                    <ul className="text-xs text-orange-600 space-y-0.5">
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
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">🔴 8D Problem Solving — Full Step Guide</h2>
              <div className="space-y-3">
                {SCAR_STEPS.map((s,i)=>(
                  <div key={i} className="flex gap-4 p-4 bg-[#eff6ff] border border-[#dbeafe] rounded-xl hover:border-orange-300 transition">
                    <div className="bg-orange-800 text-white rounded-lg px-3 py-2 text-center flex-shrink-0">
                      <p className="font-mono font-bold text-sm">{s.d}</p>
                      <p className="text-xs text-orange-600">{s.time}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#1e3a5f] text-sm">{s.title}</p>
                      <p className="text-xs text-[#1e3a5f] mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5-Why Guide */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">❓ 5-Why Analysis — Root Cause Guide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-bold text-[#1e3a5f] mb-3">Real Factory Example: Dimensional Rejection</p>
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
                        <div className="border-l-2 border-red-700/50 pl-3">
                          <p className="text-xs font-bold text-[#1e3a5f]">{w.q}</p>
                          <p className="text-xs text-[#1e3a5f] mt-0.5">{w.a}</p>
                        </div>
                      </div>
                    ))}
                    <div className="bg-red-50 border border-red-700/50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-bold text-red-800">Root Cause: PFMEA did not identify tool wear as a risk → no control plan entry → no monitoring</p>
                      <p className="text-xs text-red-700 mt-1">Corrective Action: Update PFMEA — add tool wear risk. Add tool life counter in control plan. Define replacement frequency. Verify with data.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1e3a5f] mb-3">5-Why Rules — Common Mistakes to Avoid</p>
                  <div className="space-y-2">
                    {[
                      { rule:'Ask "Why?" not "Who?"', detail:'Root cause is always a system/process failure — not a person. Never stop at "operator error".' },
                      { rule:'Validate each Why with data', detail:'Every answer must be provable with evidence. Opinion-based 5-Why is useless.' },
                      { rule:'Two chains: Occurrence + Escape', detail:'Why did it happen? AND Why did it escape inspection? Both need root causes.' },
                      { rule:'Stop at the controllable level', detail:'Stop where you have actual control to make a change. 5 is a guideline — not a rule.' },
                      { rule:'CA must address root cause', detail:'If your CA does not directly address the last Why — it is not a root cause fix.' },
                    ].map((r,i)=>(
                      <div key={i} className="flex gap-3 p-3 bg-[#eff6ff] border border-blue-800/50 rounded-lg">
                        <span className="text-blue-600 font-bold text-sm flex-shrink-0">✓</span>
                        <div>
                          <p className="text-xs font-bold text-blue-200">{r.rule}</p>
                          <p className="text-xs text-[#1d4ed8] mt-0.5">{r.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PPM Calculation */}
            <div className="bg-orange-900/60 rounded-xl p-6 text-white">
              <h2 className="text-lg font-bold mb-4">📊 Supplier PPM — Calculation & Targets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-orange-900/30/60 rounded-xl p-5 text-center border border-orange-700 mb-4">
                    <p className="text-orange-600 text-sm font-bold mb-2">Supplier PPM Formula</p>
                    <p className="text-xl font-bold font-mono">PPM = (Qty Rejected / Qty Received) × 1,000,000</p>
                  </div>
                  <p className="text-orange-600 font-bold text-sm mb-3">Industry PPM Targets:</p>
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
                        <span className="text-xs text-orange-600">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-orange-600 font-bold text-sm mb-3">Containment Decision Matrix:</p>
                  <div className="space-y-2 text-xs">
                    {[
                      { esc:'IQC Detection', impact:'Low', action:'Sort incoming lot. Issue SCAR. 100% inspection until CA verified.' },
                      { esc:'Line Detection', impact:'Medium', action:'Sort WIP. Sort incoming stock. SCAR + 8D in 24 hrs. Containment at supplier.' },
                      { esc:'Field Detection', impact:'High', action:'Customer containment. Field sort/recall. Emergency SCAR. 8D in 48 hrs. Senior management review.' },
                    ].map((r,i)=>(
                      <div key={i} className="bg-orange-900/30/50 border border-orange-700 rounded-lg p-3">
                        <div className="flex gap-2 mb-1">
                          <span className="font-bold text-orange-600">{r.esc}</span>
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
      <QualityCopilot page="supplier-quality" />
    </div>
  );
}