'use client';
import { useState, useEffect } from 'react';
import CustomerLogModal, { LogType } from '../components/CustomerLogModal';

// ─── PROCESS DEFINITIONS ──────────────────────────────────────────────────────
const PROCESSES = [
  {
    id: 'warranty', no: '00', label: 'Customer Warranty', freq: 'Weekly', freqColor: 'bg-blue-100 text-blue-800',
    icon: '🔄', clause: 'IATF 16949 Cl. 8.2.1',
    desc: 'Track and analyse warranty claims, field returns and DOA from all customers. Update warranty PPM and initiate root cause for repeat warranty failures.',
    activities: ['Receive warranty return / claim from customer', 'Log warranty details — customer, part, defect, qty', 'Initiate root cause analysis (8D / 5-Why)', 'Update warranty PPM and trend chart', 'Send warranty response to customer', 'Close warranty with customer approval'],
    docs: ['Warranty Claim Log', 'Warranty 8D Report', 'Warranty PPM Trend', 'RCA Sheet'],
    kpis: ['Warranty PPM', 'Warranty Response Time', 'Repeat Warranty Rate'],
    logType: 'Warranty' as LogType,
  },
  {
    id: 'ga-drawing', no: '0', label: 'FG Layout & GA Drawing', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📐', clause: 'IATF 16949 Cl. 8.3.5',
    desc: 'Maintain and update Finished Goods seat layout and General Arrangement drawings as per latest customer requirements. Ensure alignment with BOM and PPAP drawings.',
    activities: ['Review latest customer drawing / ECN', 'Compare with current FG layout', 'Update GA drawing if changes found', 'Get approval from customer', 'Update PPAP and control plan if needed', 'Archive old revision with change reason'],
    docs: ['GA Drawing (latest rev)', 'FG Seat Layout', 'ECN Register', 'Drawing Change Log'],
    kpis: ['Drawing Currency (%)', 'Open ECN Count', 'Drawing Approval TAT'],
    logType: null,
  },
  {
    id: 'rejection', no: '1', label: 'Customer Rejection', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '❌', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Track all customer line rejections and PDI rejections. Calculate customer PPM, analyse top defects using Pareto and drive CAPA to reduce rejection rate.',
    activities: ['Receive rejection details from customer (qty, defect, part)', 'Log rejection in customer rejection register', 'Calculate monthly PPM per customer', 'Pareto analysis of top 3 defect categories', 'Initiate CAPA for repeat defects', 'Submit monthly rejection report to management'],
    docs: ['Customer Rejection Register', 'Monthly PPM Report', 'Defect Pareto Chart', 'CAPA Log'],
    kpis: ['Customer PPM', 'Rejection Qty', 'Top Defect Category', 'CAPA Closure %'],
    logType: 'Customer Rejection' as LogType,
  },
  {
    id: 'concern-prr', no: '2', label: 'Customer Concern & TML PRR', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📋', clause: 'IATF 16949 Cl. 8.2.1',
    desc: 'Log and track all customer concerns and TML (Tata Motors Limited) PRR (Problem Resolution Report) submissions. Ensure timely 8D submission and PRR closure.',
    activities: ['Receive concern / PRR from TML customer portal or email', 'Log in concern register with date, part, defect severity', 'Send D1-D3 (containment) within 24 hours', 'Complete full 8D and submit to customer', 'Follow up for customer approval', 'Close PRR in TML portal after approval'],
    docs: ['Customer Concern Log', 'TML PRR Form', '8D Report', 'PRR Closure Certificate'],
    kpis: ['Open PRR Count', 'D3 Response Time (hrs)', '8D Submission TAT', 'PRR Closure %'],
    logType: 'Customer Concern' as LogType,
  },
  {
    id: 'pdi-report', no: '3', label: 'PDI Reports & Tracking', freq: 'Weekly', freqColor: 'bg-blue-100 text-blue-800',
    icon: '🔍', clause: 'IATF 16949 Cl. 8.6',
    desc: 'Monitor Pre-Delivery Inspection (PDI) reports from customer end. Track PDI defects, update weekly and drive corrective actions for recurring PDI failures.',
    activities: ['Collect PDI reports from customer / field team', 'Log PDI defects by part, defect type, qty', 'Trend analysis — weekly PDI defect rate', 'Identify top recurring PDI issues', 'Raise CAPA for repeat PDI failures', 'Submit weekly PDI status to customer'],
    docs: ['PDI Defect Report', 'PDI Trend Chart', 'PDI CAPA Log', 'Weekly PDI Summary'],
    kpis: ['PDI Defect Rate', 'Repeat PDI Defects', 'PDI CAPA Open Count'],
    logType: null,
  },
  {
    id: 'ppap', no: '4', label: 'Customer Approved PPAP', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📦', clause: 'IATF 16949 Cl. 8.3.4 / AIAG PPAP',
    desc: 'Maintain status of all customer-approved PPAPs. Track pending PPAP submissions, interim approvals, re-PPAP requirements and PSW approval status.',
    activities: ['Review PPAP submission status for all active parts', 'Follow up on pending PSW approvals with customer', 'Identify parts requiring re-PPAP (engineering change, annual)', 'Prepare PPAP package for new part submissions', 'Upload approved PSW to PPAP register', 'Report PPAP status in monthly review'],
    docs: ['PPAP Status Register', 'PSW (Part Submission Warrant)', 'PPAP Checklist', 'Interim Approval Letter'],
    kpis: ['PPAP Approval %', 'Pending PSW Count', 'Interim Approval Count', 'Re-PPAP Due Count'],
    logType: null,
  },
  {
    id: 'scorecard', no: '5', label: 'Customer Scorecard', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '⭐', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Collect, analyse and respond to customer scorecards. Track overall customer rating — quality, delivery, service, responsiveness. Drive improvement for low scores.',
    activities: ['Download/receive customer scorecard from portal', 'Log scorecard rating per category', 'Identify areas below target', 'Prepare response for low-score areas', 'Present scorecard to management', 'Initiate improvement plan for scores below 85%'],
    docs: ['Customer Scorecard Log', 'Scorecard Trend Chart', 'Improvement Action Plan', 'Customer Portal Screenshots'],
    kpis: ['Customer Rating Score', 'Quality Score', 'Delivery Score', 'Response Score'],
    logType: null,
  },
  {
    id: '4m-change', no: '6', label: '4M Change Upload — TML', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '🔄', clause: 'IATF 16949 Cl. 8.5.6',
    desc: 'Upload all 4M (Man, Machine, Material, Method) changes to TML customer portal as per their change management requirements. Ensure no unauthorised changes are made.',
    activities: ['Identify all 4M changes made during the month', 'Classify change type — man, machine, material, method', 'Get internal approval before change implementation', 'Upload change details to TML customer portal', 'Attach supporting documents (photos, test results)', 'Get customer acknowledgement / approval'],
    docs: ['4M Change Register', 'TML Change Portal Screenshots', 'Change Approval Form', 'Before-After Evidence'],
    kpis: ['4M Changes Uploaded', 'Unauthorised Changes (should be 0)', 'Customer Approval TAT'],
    logType: null,
  },
  {
    id: 'ovr-data', no: '7', label: 'Send OVR Data — TMBSL', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📤', clause: 'Customer Specific Requirement',
    desc: 'Compile and submit OVR (Out-Vehicle Rejection) data to TMBSL (Tata Motors Body and Stamping Limited) as per customer requirement. Track OVR PPM monthly.',
    activities: ['Collect OVR data for the month from production and quality', 'Calculate OVR PPM (rejections / dispatch × 1,000,000)', 'Prepare OVR data report in TMBSL format', 'Submit data to TMBSL contact before deadline', 'Follow up for TMBSL acknowledgement', 'File submitted data in OVR register'],
    docs: ['OVR Data Sheet', 'TMBSL Submission Format', 'OVR PPM Trend', 'Submission Acknowledgement'],
    kpis: ['OVR PPM', 'Submission On-Time %', 'OVR Defect Category Pareto'],
    logType: null,
  },
  {
    id: 'dispatch-tracking', no: '8', label: 'Daily Dispatch Tracking', freq: 'Daily', freqColor: 'bg-red-100 text-red-800',
    icon: '🚛', clause: 'IATF 16949 Cl. 8.5.4',
    desc: 'Track daily customer dispatch schedule, actual dispatch, shortfalls and quality releases. Ensure no uncleared quality holds reach the customer.',
    activities: ['Receive daily dispatch plan from planning/logistics', 'Check quality release status for all planned dispatch lots', 'Confirm no quality holds on dispatch material', 'Log actual dispatch vs plan (qty, part, vehicle)', 'Flag any shortfall or delay to customer immediately', 'Update daily dispatch tracking sheet'],
    docs: ['Daily Dispatch Log', 'Quality Release Certificate', 'Dispatch Plan vs Actual', 'Shortfall Report'],
    kpis: ['Dispatch Adherence %', 'Quality Hold Release TAT', 'Zero Uncleared Hold Dispatches'],
    logType: null,
  },
  {
    id: 'pdi-upload', no: '9', label: 'PDI Upload — TML', freq: 'Daily', freqColor: 'bg-red-100 text-red-800',
    icon: '⬆️', clause: 'Customer Specific Requirement',
    desc: 'Upload daily Pre-Delivery Inspection results to TML customer portal. Ensure 100% PDI completion before dispatch and portal entry before cut-off time.',
    activities: ['Complete PDI inspection for all units dispatched today', 'Fill PDI checklist for each unit', 'Upload PDI data to TML portal before daily cut-off', 'Attach any PDI defect photos to portal entry', 'Confirm portal submission acknowledgement', 'Escalate any PDI failures before dispatch'],
    docs: ['PDI Checklist (per unit)', 'TML Portal Submission Screenshots', 'PDI Defect Photo Log', 'Daily PDI Summary'],
    kpis: ['PDI Upload Compliance %', 'PDI Defect Rate', 'On-time Submission %'],
    logType: null,
  },
  {
    id: 'mom', no: '10', label: 'Customer MOM & Closure', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📝', clause: 'IATF 16949 Cl. 9.3',
    desc: 'Maintain Minutes of Meeting (MOM) for all customer review meetings. Track all open action items from MOM and ensure timely closure before next review.',
    activities: ['Attend customer review meeting (or collect MOM from customer)', 'Log all action items from MOM with owner and due date', 'Follow up weekly on open MOM actions', 'Update closure status with evidence', 'Send updated MOM tracker to customer before next meeting', 'Present MOM closure status in internal review'],
    docs: ['MOM Register', 'Action Item Tracker', 'Meeting Attendance Sheet', 'Closure Evidence'],
    kpis: ['MOM Action Closure %', 'Overdue MOM Actions', 'Avg Closure Days'],
    logType: null,
  },
  {
    id: 'tac', no: '11', label: 'TAC Extension Report', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📅', clause: 'Customer Specific Requirement',
    desc: 'Prepare and submit TAC (Technical Acceptance Certificate) extension reports to customers where TAC validity is expiring. Track all TAC extension requests and approvals.',
    activities: ['Review TAC validity dates for all active parts', 'Identify TACs expiring in next 30 days', 'Prepare extension request with justification', 'Attach latest test reports / validation data', 'Submit extension request to customer', 'Follow up for customer approval and update TAC register'],
    docs: ['TAC Register', 'TAC Extension Request Letter', 'Test Reports', 'Customer Approval Email'],
    kpis: ['TAC Expiry in 30 days', 'Extension Approval TAT', 'Expired TAC Count (should be 0)'],
    logType: null,
  },
  {
    id: 'audit', no: '12', label: 'Customer Audit & Sustainability', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '✅', clause: 'IATF 16949 Cl. 9.2',
    desc: 'Plan and manage customer quality audits (process audit, product audit, system audit). Track all audit findings, CAPA and sustainability actions.',
    activities: ['Receive customer audit notice / schedule', 'Prepare plant for audit — documents, records, area', 'Support customer auditor during audit', 'Collect audit findings and NCs', 'Prepare and submit CAPA for each finding', 'Track sustainability actions to prevent recurrence'],
    docs: ['Customer Audit Register', 'Audit Finding Report', 'CAPA Submission', 'Sustainability Action Plan'],
    kpis: ['Audit Score', 'Open NC Count', 'CAPA Closure %', 'Repeat Finding Count'],
    logType: null,
  },
  {
    id: 'csat', no: '13', label: 'CSAT Analysis & Closure', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '😊', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Collect Customer Satisfaction (CSAT) survey data, analyse scores, identify improvement areas and drive corrective actions for low satisfaction scores.',
    activities: ['Collect CSAT survey from customer (portal / email)', 'Log CSAT scores per parameter', 'Identify parameters below target (< 8/10 or < 85%)', 'Prepare action plan for low-score parameters', 'Implement improvements and monitor effect', 'Re-survey or follow up with customer in next month'],
    docs: ['CSAT Survey Register', 'CSAT Trend Chart', 'Improvement Action Plan', 'Customer Feedback Evidence'],
    kpis: ['Overall CSAT Score', 'Parameters Below Target', 'CSAT Trend (improving/declining)'],
    logType: null,
  },
  {
    id: 'visit-plan', no: '14', label: 'Structured Visit Plan & Closure', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '🤝', clause: 'IATF 16949 Cl. 8.2.1',
    desc: 'Plan structured customer visits (QH / Plant Head level), prepare agenda, conduct visit and close all action items from visit discussions.',
    activities: ['Plan monthly visit schedule — customer, date, objective', 'Prepare visit agenda — complaint review, PPAP, new RFQ', 'Collect supporting data and reports for visit', 'Conduct visit with senior leadership', 'Document visit MOM and action items', 'Track closure of all visit action items'],
    docs: ['Visit Plan Register', 'Visit MOM', 'Visit Presentation', 'Action Item Tracker'],
    kpis: ['Visits Planned vs Actual', 'Visit Action Closure %', 'Open Visit Actions'],
    logType: null,
  },
  {
    id: 'requirements', no: '15', label: 'Customer Requirements', freq: 'Quarterly', freqColor: 'bg-purple-100 text-purple-800',
    icon: '📌', clause: 'IATF 16949 Cl. 8.2.2',
    desc: 'Maintain register of all Customer Specific Requirements (CSR) for each customer. Review quarterly for any updates and ensure all CSRs are deployed in relevant processes.',
    activities: ['Download latest CSR documents from IATF database or customer portals', 'Compare with current CSR register for changes', 'Update internal processes affected by new CSR', 'Communicate changes to relevant departments', 'Update PPAP, control plan if required by CSR change', 'File CSR register with revision date'],
    docs: ['Customer Specific Requirements Register', 'CSR Comparison Matrix', 'CSR Deployment Evidence', 'Process Update Log'],
    kpis: ['CSR Compliance %', 'Open CSR Gaps', 'CSR Review Done On-time'],
    logType: null,
  },
  {
    id: 'iatf-csat', no: '16', label: 'Customer Satisfaction — IATF', freq: 'Quarterly', freqColor: 'bg-purple-100 text-purple-800',
    icon: '📊', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Quarterly review of customer satisfaction per IATF 16949 Clause 9.1.2 requirements. Includes scorecards, PPM, complaints, audit results and warranty data.',
    activities: ['Compile customer satisfaction data for the quarter', 'Gather: PPM, complaints, scorecards, audits, warranty', 'Calculate customer satisfaction index per IATF methodology', 'Identify trends and significant deviations', 'Prepare quarterly report for management review', 'Define actions for dissatisfaction areas'],
    docs: ['IATF Customer Satisfaction Report', 'Customer Satisfaction Index', 'Supporting Evidence', 'Management Review Input'],
    kpis: ['Customer Satisfaction Index', 'PPM Trend', 'Complaint Count Trend', 'Warranty Trend'],
    logType: null,
  },
  {
    id: 'improvement', no: '17', label: 'Customer Improvement', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📈', clause: 'IATF 16949 Cl. 10.3',
    desc: 'Drive continual improvement projects focused on customer satisfaction. Include PPM reduction, complaint reduction, response time improvement and customer score improvement.',
    activities: ['Review current customer KPIs vs targets', 'Identify top 3 improvement opportunities from data', 'Define improvement project with target and timeline', 'Implement improvement actions (PDCA / A3)', 'Monitor results against target', 'Sustain and standardise successful improvements'],
    docs: ['Customer Improvement Plan', 'PDCA / A3 Sheet', 'KPI Improvement Trend', 'Standardisation Evidence'],
    kpis: ['Improvement Projects Open', 'Improvement Projects Closed', 'PPM Reduction %', 'Complaint Reduction %'],
    logType: null,
  },
  {
    id: 'deviation', no: '18', label: 'Customer Deviation', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '⚠️', clause: 'IATF 16949 Cl. 8.7',
    desc: 'Manage customer deviation requests for non-conforming product. Obtain written customer concession before shipping non-conforming material. Track deviation validity and qty.',
    activities: ['Identify product requiring customer deviation (non-conforming)', 'Prepare deviation request with defect details and qty', 'Submit to customer for written approval', 'Receive customer concession / deviation permit', 'Ship only approved quantity within validity', 'Track deviation expiry and ensure no over-shipment'],
    docs: ['Customer Deviation Register', 'Deviation Request Letter', 'Customer Concession Approval', 'Deviation Shipment Log'],
    kpis: ['Open Deviations Count', 'Expired Deviations (should be 0)', 'Deviation Qty Shipped'],
    logType: null,
  },
  {
    id: 'tmbsl-dsl', no: '19', label: 'TMBSL DSL', freq: 'Monthly', freqColor: 'bg-green-100 text-green-800',
    icon: '📋', clause: 'Customer Specific Requirement',
    desc: 'Submit Defect Status List (DSL) to TMBSL (Tata Motors Body and Stamping Limited) as per their monthly reporting requirement. Track all DSL items and closure status.',
    activities: ['Collect all defect data raised by TMBSL during the month', 'Prepare DSL in TMBSL format', 'Update closure status for each DSL item', 'Submit DSL to TMBSL customer before deadline', 'Follow up on open DSL items', 'Present DSL status in monthly customer review'],
    docs: ['TMBSL DSL Format', 'DSL Register', 'Submission Acknowledgement', 'Open Item Action Plan'],
    kpis: ['DSL Closure %', 'Open DSL Items', 'Overdue DSL Actions', 'On-time Submission'],
    logType: null,
  },
];

const FREQ_COLORS: Record<string, string> = {
  Daily: 'bg-red-100 text-red-800 border-red-200',
  Weekly: 'bg-blue-100 text-blue-800 border-blue-200',
  Monthly: 'bg-green-100 text-green-800 border-green-200',
  Quarterly: 'bg-purple-100 text-purple-800 border-purple-200',
};

const SEV_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-red-100 text-red-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Closed': 'bg-green-100 text-green-700',
  'Pending Approval': 'bg-blue-100 text-blue-700',
};

interface Complaint {
  id: number;
  complaint_number: string;
  complaint_type: string;
  customer_name: string;
  part_name: string;
  part_number: string;
  defect_description: string;
  defect_category: string;
  quantity_affected: number;
  severity: string;
  status: string;
  assigned_to: string;
  created_at: string;
  complaint_date?: string;
  warranty_claim_no?: string;
  vehicle_number?: string;
  prr_number?: string;
  response_deadline?: string;
  rejection_stage?: string;
  report_generated: number;
}

export default function CustomerQualityPage() {
  const [activeTab, setActiveTab] = useState('warranty');
  const [modal, setModal] = useState<LogType | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const active = PROCESSES.find(p => p.id === activeTab) || PROCESSES[0];
  const daily = PROCESSES.filter(p => p.freq === 'Daily').length;
  const weekly = PROCESSES.filter(p => p.freq === 'Weekly').length;
  const monthly = PROCESSES.filter(p => p.freq === 'Monthly').length;
  const quarterly = PROCESSES.filter(p => p.freq === 'Quarterly').length;

  // Fetch complaints when page loads
  useEffect(() => {
    const load = async () => {
      setLoadingComplaints(true);
      try {
        const res = await fetch('/api/complaints');
        const data = await res.json();
        setComplaints(data);
      } catch { /* ignore */ }
      setLoadingComplaints(false);
    };
    load();
  }, []);

  const refreshComplaints = async () => {
    const res = await fetch('/api/complaints');
    const data = await res.json();
    setComplaints(data);
  };

  // Filter complaints for current tab's type
  const tabComplaints = active.logType
    ? complaints.filter(c => c.complaint_type === active.logType)
    : [];

  const openCount = tabComplaints.filter(c => c.status === 'Open').length;

  return (
    <div className="min-h-full bg-gray-50">

      {/* DEPARTMENT HEADER */}
      <div className="bg-blue-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
              <span>QMOS</span><span>›</span><span>Departments</span><span>›</span><span className="text-white">Customer Quality</span>
            </div>
            <h1 className="text-xl font-bold">👥 Customer Quality</h1>
            <p className="text-blue-300 text-xs mt-0.5">Complaints · PPM · Warranty · PPAP · Audit · Satisfaction · Scorecard</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {active.logType && (
              <button
                onClick={() => setModal(active.logType)}
                className="bg-white text-blue-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition">
                + Log {active.logType === 'Customer Concern' ? 'Concern / PRR' : active.logType}
              </button>
            )}
            <button className="bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 transition border border-blue-600">📊 Monthly Report</button>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Daily Activities', value: daily, sub: 'processes', color: 'bg-red-700' },
            { label: 'Weekly Activities', value: weekly, sub: 'processes', color: 'bg-blue-700' },
            { label: 'Monthly Activities', value: monthly, sub: 'processes', color: 'bg-green-700' },
            { label: 'Quarterly Activities', value: quarterly, sub: 'processes', color: 'bg-purple-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-lg px-4 py-2.5 bg-opacity-60`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-blue-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SUB-TABS — HORIZONTAL SCROLLABLE */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-4 py-0 gap-0">
            {PROCESSES.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`flex flex-col items-start px-3 py-2.5 border-b-2 transition-all whitespace-nowrap text-left group ${
                  activeTab === p.id
                    ? 'border-blue-900 text-blue-900 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-xs font-semibold">{p.no}. {p.label}</span>
                  {p.logType && (() => {
                    const cnt = complaints.filter(c => c.complaint_type === p.logType && c.status === 'Open').length;
                    return cnt > 0 ? (
                      <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{cnt}</span>
                    ) : null;
                  })()}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded border mt-1 font-medium ${FREQ_COLORS[p.freq]}`}>{p.freq}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="p-5 space-y-4">

        {/* Process Header */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{active.icon}</span>
                <span className="text-xs text-gray-400 font-mono">Process {active.no}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${FREQ_COLORS[active.freq]}`}>{active.freq}</span>
                {active.logType && openCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-red-200">
                    {openCount} Open
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{active.label}</h2>
              <p className="text-xs text-gray-500 mt-1">{active.clause}</p>
              <p className="text-sm text-gray-700 mt-2 max-w-3xl">{active.desc}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {active.logType ? (
                <button
                  onClick={() => setModal(active.logType)}
                  className="bg-blue-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-800 transition">
                  {active.icon} + Log {active.logType === 'Customer Concern' ? 'Concern' : active.logType}
                </button>
              ) : (
                <button className="bg-blue-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-800 transition">+ Log Activity</button>
              )}
              <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">📄 Documents</button>
              <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">🤖 AI Analyse</button>
            </div>
          </div>
        </div>

        {/* ─── CUSTOMER LOG TABLE — only for Warranty, Rejection, Concern ─── */}
        {active.logType && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-gray-800">
                  {active.logType === 'Warranty' && '🔄 Warranty Log'}
                  {active.logType === 'Customer Rejection' && '❌ Customer Rejection Log'}
                  {active.logType === 'Customer Concern' && '📋 Customer Concern / PRR Log'}
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                  {tabComplaints.length} Total
                </span>
                {openCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold border border-red-200">
                    {openCount} Open
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={refreshComplaints} className="text-gray-400 hover:text-blue-600 text-xs px-2 py-1.5 rounded hover:bg-gray-50" title="Refresh">
                  ↻ Refresh
                </button>
                <button
                  onClick={() => setModal(active.logType)}
                  className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-800 transition flex items-center gap-1.5">
                  {active.icon} + Log {active.logType === 'Customer Concern' ? 'Concern / PRR' : active.logType}
                </button>
              </div>
            </div>

            {/* 8D Generator Promo bar */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🤖</span>
                <span className="text-xs font-semibold">Auto 8D Generator is linked to this log</span>
                <span className="text-blue-300 text-xs">— log a {active.logType} and 8D is auto-generated instantly</span>
              </div>
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">D1–D8 Auto</span>
            </div>

            {loadingComplaints ? (
              <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
            ) : tabComplaints.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="text-4xl">{active.icon}</div>
                <p className="text-gray-500 text-sm font-medium">No {active.logType} logged yet</p>
                <p className="text-gray-400 text-xs">Click the button above to log the first {active.logType}</p>
                <button
                  onClick={() => setModal(active.logType)}
                  className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition mt-2">
                  {active.icon} Log First {active.logType === 'Customer Concern' ? 'Concern / PRR' : active.logType} →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2.5 text-left">No.</th>
                      <th className="px-4 py-2.5 text-left">Date</th>
                      <th className="px-4 py-2.5 text-left">Customer</th>
                      <th className="px-4 py-2.5 text-left">Part</th>
                      {active.logType === 'Warranty' && <th className="px-4 py-2.5 text-left">Claim No.</th>}
                      {active.logType === 'Customer Concern' && <th className="px-4 py-2.5 text-left">PRR No.</th>}
                      {active.logType === 'Customer Rejection' && <th className="px-4 py-2.5 text-left">Stage</th>}
                      <th className="px-4 py-2.5 text-left">Defect</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-center">Severity</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-left">Assigned</th>
                      <th className="px-4 py-2.5 text-center">8D Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tabComplaints.map((c, idx) => (
                      <tr key={c.id} className={`hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-blue-900">{c.complaint_number || `#${c.id}`}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {c.created_at ? c.created_at.slice(0, 10) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-800 max-w-[120px] truncate" title={c.customer_name}>
                          {c.customer_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <div className="font-mono text-blue-700">{c.part_number || '—'}</div>
                          <div className="text-gray-500 truncate max-w-[100px]">{c.part_name}</div>
                        </td>
                        {active.logType === 'Warranty' && (
                          <td className="px-4 py-3 text-xs text-gray-600 font-mono">{c.warranty_claim_no || '—'}</td>
                        )}
                        {active.logType === 'Customer Concern' && (
                          <td className="px-4 py-3 text-xs text-gray-600 font-mono">{c.prr_number || '—'}</td>
                        )}
                        {active.logType === 'Customer Rejection' && (
                          <td className="px-4 py-3 text-xs text-gray-600">{c.rejection_stage || '—'}</td>
                        )}
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[160px]">
                          <div className="font-medium">{c.defect_category}</div>
                          <div className="text-gray-500 line-clamp-1" title={c.defect_description}>{c.defect_description}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-gray-800">{c.quantity_affected ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEV_COLORS[c.severity] || 'bg-gray-100 text-gray-600'}`}>
                            {c.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.assigned_to || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {c.report_generated ? (
                              <a href={`/complaints/${c.id}`}
                                className="inline-flex items-center gap-1 bg-blue-900 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold hover:bg-blue-800 transition">
                                📊 Open 8D
                              </a>
                            ) : (
                              <a href={`/complaints/${c.id}`}
                                className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold hover:bg-orange-600 transition">
                                🤖 Generate 8D
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ACTIVITY WORKFLOW */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">📋 Activity Workflow</h3>
            <div className="space-y-2">
              {active.activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group">
                  <div className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-gray-700 flex-1">{act}</p>
                  <button className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:underline flex-shrink-0 transition">Log ›</button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4">

            {/* KPIs */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📊 Key KPIs</h3>
              <div className="space-y-2">
                {active.kpis.map((kpi, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-700 font-medium">{kpi}</span>
                    <span className="text-xs font-bold text-gray-400">—</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📄 Required Documents</h3>
              <div className="space-y-1.5">
                {active.docs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <span className="text-blue-400 text-xs">📄</span>
                    <span className="text-xs text-gray-700 flex-1">{doc}</span>
                    <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Upload ›</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-xl p-4">
              <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wide mb-3">🤖 AI Assistant</h3>
              <div className="space-y-2">
                {[
                  `Analyse ${active.label} trend`,
                  `Generate ${active.label} report`,
                  `Find similar past issues`,
                  `Create CAPA suggestion`,
                ].map((s, i) => (
                  <button key={i} className="w-full text-left text-xs text-blue-100 hover:text-white bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded-lg transition">
                    💡 {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVITY LOG TABLE — for non-log tabs */}
        {!active.logType && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Activity Log — {active.label}</h3>
              <div className="flex gap-2">
                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                  <option>All Months</option>
                  <option>July 2026</option>
                  <option>June 2026</option>
                  <option>May 2026</option>
                </select>
                <button className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-800 transition">+ Add Entry</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-left">Activity / Description</th>
                  <th className="px-4 py-2.5 text-left">Owner</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Evidence</th>
                  <th className="px-4 py-2.5 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No activity logged yet. Click <b>&quot;+ Add Entry&quot;</b> to log the first {active.freq.toLowerCase()} activity.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CUSTOMER LOG MODAL ─── */}
      {modal && (
        <CustomerLogModal
          type={modal}
          onClose={() => setModal(null)}
          onSuccess={async () => {
            setModal(null);
            await refreshComplaints();
          }}
        />
      )}
    </div>
  );
}
