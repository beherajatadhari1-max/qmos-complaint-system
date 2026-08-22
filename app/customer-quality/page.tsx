'use client';
import { useState, useEffect, useRef } from 'react';
import PageTitle from '../components/PageTitle';
import CustomerLogModal, { LogType } from '../components/CustomerLogModal';
import QualityCopilot from '../components/QualityCopilot';

// --- PROCESS DEFINITIONS ------------------------------------------------------
const PROCESSES = [
  {
    id: 'warranty', no: '00', label: 'Customer Warranty', freq: 'Weekly', freqColor: 'bg-blue-700 text-white',
    icon: '🔄', clause: 'IATF 16949 Cl. 8.2.1',
    desc: 'Track and analyse warranty claims, field returns and DOA from all customers. Update warranty PPM and initiate root cause for repeat warranty failures.',
    activities: ['Receive warranty return / claim from customer', 'Log warranty details — customer, part, defect, qty', 'Initiate root cause analysis (8D / 5-Why)', 'Update warranty PPM and trend chart', 'Send warranty response to customer', 'Close warranty with customer approval'],
    docs: ['Warranty Claim Log', 'Warranty 8D Report', 'Warranty PPM Trend', 'RCA Sheet'],
    kpis: ['Warranty PPM', 'Warranty Response Time', 'Repeat Warranty Rate'],
    logType: 'Warranty' as LogType,
  },
  {
    id: 'ga-drawing', no: '0', label: 'FG Layout & GA Drawing', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📐', clause: 'IATF 16949 Cl. 8.3.5',
    desc: 'Maintain and update Finished Goods seat layout and General Arrangement drawings as per latest customer requirements.',
    activities: ['Review latest customer drawing / ECN', 'Compare with current FG layout', 'Update GA drawing if changes found', 'Get approval from customer', 'Update PPAP and control plan if needed', 'Archive old revision with change reason'],
    docs: ['GA Drawing (latest rev)', 'FG Seat Layout', 'ECN Register', 'Drawing Change Log'],
    kpis: ['Drawing Currency (%)', 'Open ECN Count', 'Drawing Approval TAT'],
    logType: null,
  },
  {
    id: 'rejection', no: '1', label: 'Customer Rejection', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '❌', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Track all customer line rejections and PDI rejections. Calculate customer PPM, analyse top defects using Pareto and drive CAPA to reduce rejection rate.',
    activities: ['Receive rejection details from customer (qty, defect, part)', 'Log rejection in customer rejection register', 'Calculate monthly PPM per customer', 'Pareto analysis of top 3 defect categories', 'Initiate CAPA for repeat defects', 'Submit monthly rejection report to management'],
    docs: ['Customer Rejection Register', 'Monthly PPM Report', 'Defect Pareto Chart', 'CAPA Log'],
    kpis: ['Customer PPM', 'Rejection Qty', 'Top Defect Category', 'CAPA Closure %'],
    logType: 'Customer Rejection' as LogType,
  },
  {
    id: 'concern-prr', no: '2', label: 'Customer Concern & TML PRR', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📋', clause: 'IATF 16949 Cl. 8.2.1',
    desc: 'Log and track all customer concerns and TML PRR submissions. Ensure timely 8D submission and PRR closure.',
    activities: ['Receive concern / PRR from TML customer portal or email', 'Log in concern register with date, part, defect severity', 'Send D1-D3 (containment) within 24 hours', 'Complete full 8D and submit to customer', 'Follow up for customer approval', 'Close PRR in TML portal after approval'],
    docs: ['Customer Concern Log', 'TML PRR Form', '8D Report', 'PRR Closure Certificate'],
    kpis: ['Open PRR Count', 'D3 Response Time (hrs)', '8D Submission TAT', 'PRR Closure %'],
    logType: 'Customer Concern' as LogType,
  },
  {
    id: 'pdi-report', no: '3', label: 'PDI Reports & Tracking', freq: 'Weekly', freqColor: 'bg-blue-700 text-white',
    icon: '🔍', clause: 'IATF 16949 Cl. 8.6',
    desc: 'Monitor Pre-Delivery Inspection (PDI) reports from customer end. Track PDI defects and drive corrective actions.',
    activities: ['Collect PDI reports from customer / field team', 'Log PDI defects by part, defect type, qty', 'Trend analysis — weekly PDI defect rate', 'Identify top recurring PDI issues', 'Raise CAPA for repeat PDI failures', 'Submit weekly PDI status to customer'],
    docs: ['PDI Defect Report', 'PDI Trend Chart', 'PDI CAPA Log', 'Weekly PDI Summary'],
    kpis: ['PDI Defect Rate', 'Repeat PDI Defects', 'PDI CAPA Open Count'],
    logType: null,
  },
  {
    id: 'ppap', no: '4', label: 'Customer Approved PPAP', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📦', clause: 'IATF 16949 Cl. 8.3.4 / AIAG PPAP',
    desc: 'Maintain status of all customer-approved PPAPs. Track pending PPAP submissions, interim approvals and PSW approval status.',
    activities: ['Review PPAP submission status for all active parts', 'Follow up on pending PSW approvals with customer', 'Identify parts requiring re-PPAP', 'Prepare PPAP package for new part submissions', 'Upload approved PSW to PPAP register', 'Report PPAP status in monthly review'],
    docs: ['PPAP Status Register', 'PSW (Part Submission Warrant)', 'PPAP Checklist', 'Interim Approval Letter'],
    kpis: ['PPAP Approval %', 'Pending PSW Count', 'Interim Approval Count', 'Re-PPAP Due Count'],
    logType: null,
  },
  {
    id: 'scorecard', no: '5', label: 'Customer Scorecard', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '⭐', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Collect, analyse and respond to customer scorecards. Track overall customer rating — quality, delivery, service, responsiveness.',
    activities: ['Download/receive customer scorecard from portal', 'Log scorecard rating per category', 'Identify areas below target', 'Prepare response for low-score areas', 'Present scorecard to management', 'Initiate improvement plan for scores below 85%'],
    docs: ['Customer Scorecard Log', 'Scorecard Trend Chart', 'Improvement Action Plan', 'Customer Portal Screenshots'],
    kpis: ['Customer Rating Score', 'Quality Score', 'Delivery Score', 'Response Score'],
    logType: null,
  },
  {
    id: '4m-change', no: '6', label: '4M Change Upload — TML', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '🔄', clause: 'IATF 16949 Cl. 8.5.6',
    desc: 'Upload all 4M (Man, Machine, Material, Method) changes to TML customer portal. Ensure no unauthorised changes.',
    activities: ['Identify all 4M changes made during the month', 'Classify change type — man, machine, material, method', 'Get internal approval before change implementation', 'Upload change details to TML customer portal', 'Attach supporting documents (photos, test results)', 'Get customer acknowledgement / approval'],
    docs: ['4M Change Register', 'TML Change Portal Screenshots', 'Change Approval Form', 'Before-After Evidence'],
    kpis: ['4M Changes Uploaded', 'Unauthorised Changes (should be 0)', 'Customer Approval TAT'],
    logType: null,
  },
  {
    id: 'ovr-data', no: '7', label: 'Send OVR Data — TMBSL', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📤', clause: 'Customer Specific Requirement',
    desc: 'Compile and submit OVR (Out-Vehicle Rejection) data to TMBSL as per customer requirement. Track OVR PPM monthly.',
    activities: ['Collect OVR data for the month from production and quality', 'Calculate OVR PPM (rejections / dispatch × 1,000,000)', 'Prepare OVR data report in TMBSL format', 'Submit data to TMBSL contact before deadline', 'Follow up for TMBSL acknowledgement', 'File submitted data in OVR register'],
    docs: ['OVR Data Sheet', 'TMBSL Submission Format', 'OVR PPM Trend', 'Submission Acknowledgement'],
    kpis: ['OVR PPM', 'Submission On-Time %', 'OVR Defect Category Pareto'],
    logType: null,
  },
  {
    id: 'dispatch-tracking', no: '8', label: 'Daily Dispatch Tracking', freq: 'Daily', freqColor: 'bg-red-100 text-red-800',
    icon: '🚛', clause: 'IATF 16949 Cl. 8.5.4',
    desc: 'Track daily customer dispatch schedule, actual dispatch, shortfalls and quality releases.',
    activities: ['Receive daily dispatch plan from planning/logistics', 'Check quality release status for all planned dispatch lots', 'Confirm no quality holds on dispatch material', 'Log actual dispatch vs plan (qty, part, vehicle)', 'Flag any shortfall or delay to customer immediately', 'Update daily dispatch tracking sheet'],
    docs: ['Daily Dispatch Log', 'Quality Release Certificate', 'Dispatch Plan vs Actual', 'Shortfall Report'],
    kpis: ['Dispatch Adherence %', 'Quality Hold Release TAT', 'Zero Uncleared Hold Dispatches'],
    logType: null,
  },
  {
    id: 'pdi-upload', no: '9', label: 'PDI Upload — TML', freq: 'Daily', freqColor: 'bg-red-100 text-red-800',
    icon: '⬆️', clause: 'Customer Specific Requirement',
    desc: 'Upload daily Pre-Delivery Inspection results to TML customer portal. Ensure 100% PDI completion before dispatch.',
    activities: ['Complete PDI inspection for all units dispatched today', 'Fill PDI checklist for each unit', 'Upload PDI data to TML portal before daily cut-off', 'Attach any PDI defect photos to portal entry', 'Confirm portal submission acknowledgement', 'Escalate any PDI failures before dispatch'],
    docs: ['PDI Checklist (per unit)', 'TML Portal Submission Screenshots', 'PDI Defect Photo Log', 'Daily PDI Summary'],
    kpis: ['PDI Upload Compliance %', 'PDI Defect Rate', 'On-time Submission %'],
    logType: null,
  },
  {
    id: 'mom', no: '10', label: 'Customer MOM & Closure', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📝', clause: 'IATF 16949 Cl. 9.3',
    desc: 'Maintain Minutes of Meeting (MOM) for all customer review meetings. Track all open action items and ensure timely closure.',
    activities: ['Attend customer review meeting (or collect MOM from customer)', 'Log all action items from MOM with owner and due date', 'Follow up weekly on open MOM actions', 'Update closure status with evidence', 'Send updated MOM tracker to customer before next meeting', 'Present MOM closure status in internal review'],
    docs: ['MOM Register', 'Action Item Tracker', 'Meeting Attendance Sheet', 'Closure Evidence'],
    kpis: ['MOM Action Closure %', 'Overdue MOM Actions', 'Avg Closure Days'],
    logType: null,
  },
  {
    id: 'tac', no: '11', label: 'TAC Extension Report', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📅', clause: 'Customer Specific Requirement',
    desc: 'Prepare and submit TAC extension reports to customers where TAC validity is expiring. Track all TAC extension requests.',
    activities: ['Review TAC validity dates for all active parts', 'Identify TACs expiring in next 30 days', 'Prepare extension request with justification', 'Attach latest test reports / validation data', 'Submit extension request to customer', 'Follow up for customer approval and update TAC register'],
    docs: ['TAC Register', 'TAC Extension Request Letter', 'Test Reports', 'Customer Approval Email'],
    kpis: ['TAC Expiry in 30 days', 'Extension Approval TAT', 'Expired TAC Count (should be 0)'],
    logType: null,
  },
  {
    id: 'audit', no: '12', label: 'Customer Audit & Sustainability', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '✅', clause: 'IATF 16949 Cl. 9.2',
    desc: 'Plan and manage customer quality audits. Track all audit findings, CAPA and sustainability actions.',
    activities: ['Receive customer audit notice / schedule', 'Prepare plant for audit — documents, records, area', 'Support customer auditor during audit', 'Collect audit findings and NCs', 'Prepare and submit CAPA for each finding', 'Track sustainability actions to prevent recurrence'],
    docs: ['Customer Audit Register', 'Audit Finding Report', 'CAPA Submission', 'Sustainability Action Plan'],
    kpis: ['Audit Score', 'Open NC Count', 'CAPA Closure %', 'Repeat Finding Count'],
    logType: null,
  },
  {
    id: 'csat', no: '13', label: 'CSAT Analysis & Closure', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '😊', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Collect Customer Satisfaction (CSAT) survey data, analyse scores and drive corrective actions for low scores.',
    activities: ['Collect CSAT survey from customer (portal / email)', 'Log CSAT scores per parameter', 'Identify parameters below target (< 8/10 or < 85%)', 'Prepare action plan for low-score parameters', 'Implement improvements and monitor effect', 'Re-survey or follow up with customer in next month'],
    docs: ['CSAT Survey Register', 'CSAT Trend Chart', 'Improvement Action Plan', 'Customer Feedback Evidence'],
    kpis: ['Overall CSAT Score', 'Parameters Below Target', 'CSAT Trend (improving/declining)'],
    logType: null,
  },
  {
    id: 'visit-plan', no: '14', label: 'Structured Visit Plan & Closure', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '🤝', clause: 'IATF 16949 Cl. 8.2.1',
    desc: 'Plan structured customer visits (QH / Plant Head level), prepare agenda, conduct visit and close all action items.',
    activities: ['Plan monthly visit schedule — customer, date, objective', 'Prepare visit agenda — complaint review, PPAP, new RFQ', 'Collect supporting data and reports for visit', 'Conduct visit with senior leadership', 'Document visit MOM and action items', 'Track closure of all visit action items'],
    docs: ['Visit Plan Register', 'Visit MOM', 'Visit Presentation', 'Action Item Tracker'],
    kpis: ['Visits Planned vs Actual', 'Visit Action Closure %', 'Open Visit Actions'],
    logType: null,
  },
  {
    id: 'requirements', no: '15', label: 'Customer Requirements', freq: 'Quarterly', freqColor: 'bg-purple-700 text-white',
    icon: '📌', clause: 'IATF 16949 Cl. 8.2.2',
    desc: 'Maintain register of all Customer Specific Requirements (CSR) for each customer. Review quarterly for updates.',
    activities: ['Download latest CSR documents from IATF database or customer portals', 'Compare with current CSR register for changes', 'Update internal processes affected by new CSR', 'Communicate changes to relevant departments', 'Update PPAP, control plan if required by CSR change', 'File CSR register with revision date'],
    docs: ['Customer Specific Requirements Register', 'CSR Comparison Matrix', 'CSR Deployment Evidence', 'Process Update Log'],
    kpis: ['CSR Compliance %', 'Open CSR Gaps', 'CSR Review Done On-time'],
    logType: null,
  },
  {
    id: 'iatf-csat', no: '16', label: 'Customer Satisfaction — IATF', freq: 'Quarterly', freqColor: 'bg-purple-700 text-white',
    icon: '📊', clause: 'IATF 16949 Cl. 9.1.2',
    desc: 'Quarterly review of customer satisfaction per IATF 16949 Cl. 9.1.2. Includes scorecards, PPM, complaints, audits, warranty.',
    activities: ['Compile customer satisfaction data for the quarter', 'Gather: PPM, complaints, scorecards, audits, warranty', 'Calculate customer satisfaction index per IATF methodology', 'Identify trends and significant deviations', 'Prepare quarterly report for management review', 'Define actions for dissatisfaction areas'],
    docs: ['IATF Customer Satisfaction Report', 'Customer Satisfaction Index', 'Supporting Evidence', 'Management Review Input'],
    kpis: ['Customer Satisfaction Index', 'PPM Trend', 'Complaint Count Trend', 'Warranty Trend'],
    logType: null,
  },
  {
    id: 'improvement', no: '17', label: 'Customer Improvement', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📈', clause: 'IATF 16949 Cl. 10.3',
    desc: 'Drive continual improvement projects focused on customer satisfaction — PPM reduction, complaint reduction, response time improvement.',
    activities: ['Review current customer KPIs vs targets', 'Identify top 3 improvement opportunities from data', 'Define improvement project with target and timeline', 'Implement improvement actions (PDCA / A3)', 'Monitor results against target', 'Sustain and standardise successful improvements'],
    docs: ['Customer Improvement Plan', 'PDCA / A3 Sheet', 'KPI Improvement Trend', 'Standardisation Evidence'],
    kpis: ['Improvement Projects Open', 'Improvement Projects Closed', 'PPM Reduction %', 'Complaint Reduction %'],
    logType: null,
  },
  {
    id: 'deviation', no: '18', label: 'Customer Deviation', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '⚠️', clause: 'IATF 16949 Cl. 8.7',
    desc: 'Manage customer deviation requests. Obtain written concession before shipping non-conforming material. Track validity and qty.',
    activities: ['Identify product requiring customer deviation (non-conforming)', 'Prepare deviation request with defect details and qty', 'Submit to customer for written approval', 'Receive customer concession / deviation permit', 'Ship only approved quantity within validity', 'Track deviation expiry and ensure no over-shipment'],
    docs: ['Customer Deviation Register', 'Deviation Request Letter', 'Customer Concession Approval', 'Deviation Shipment Log'],
    kpis: ['Open Deviations Count', 'Expired Deviations (should be 0)', 'Deviation Qty Shipped'],
    logType: null,
  },
  {
    id: 'tmbsl-dsl', no: '19', label: 'TMBSL DSL', freq: 'Monthly', freqColor: 'bg-green-700 text-white',
    icon: '📋', clause: 'Customer Specific Requirement',
    desc: 'Submit Defect Status List (DSL) to TMBSL as per monthly reporting requirement. Track all DSL items and closure status.',
    activities: ['Collect all defect data raised by TMBSL during the month', 'Prepare DSL in TMBSL format', 'Update closure status for each DSL item', 'Submit DSL to TMBSL customer before deadline', 'Follow up on open DSL items', 'Present DSL status in monthly customer review'],
    docs: ['TMBSL DSL Format', 'DSL Register', 'Submission Acknowledgement', 'Open Item Action Plan'],
    kpis: ['DSL Closure %', 'Open DSL Items', 'Overdue DSL Actions', 'On-time Submission'],
    logType: null,
  },
];

const FREQ_COLORS: Record<string, string> = {
  Daily: 'bg-red-100 text-red-800 border-red-700/50',
  Weekly: 'bg-blue-700 text-white',
  Monthly: 'bg-green-700 text-white',
  Quarterly: 'bg-purple-700 text-white',
};

const SEV_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-600',
  Medium: 'bg-yellow-100 text-yellow-200',
  Low: 'bg-green-700 text-white',
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-red-100 text-red-700',
  'In Progress': 'bg-yellow-100 text-yellow-300',
  Closed: 'bg-green-700 text-white',
  'Pending Approval': 'bg-blue-100 text-[#1d4ed8]',
  Done: 'bg-green-700 text-white',
  Planned: 'bg-blue-100 text-[#1d4ed8]',
  Pending: 'bg-yellow-100 text-yellow-300',
};

interface Complaint {
  id: number; complaint_number: string; complaint_type: string; customer_name: string;
  part_name: string; part_number: string; defect_description: string; defect_category: string;
  quantity_affected: number; severity: string; status: string; assigned_to: string;
  created_at: string; warranty_claim_no?: string; vehicle_number?: string;
  prr_number?: string; rejection_stage?: string; report_generated: number;
}

interface ActivityLog {
  id: number; process_id: string; process_label: string; activity_step: string;
  log_date: string; owner: string; status: string; remarks: string; evidence: string;
}

interface ProcessDoc {
  id: number; process_id: string; document_name: string; file_name: string;
  uploaded_by: string; uploaded_at: string; remarks: string;
}

// --- ACTIVITY LOG MODAL --------------------------------------------------------
function ActivityLogModal({ process, preStep, onClose, onSuccess }: {
  process: typeof PROCESSES[0]; preStep?: string; onClose: () => void; onSuccess: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    activityStep: preStep || process.activities[0],
    logDate: today, owner: '', status: 'Done', remarks: '', evidence: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: process.id, processLabel: process.label, ...form }),
      });
      onSuccess();
    } finally { setSaving(false); }
  };

  return (
      <>
      <PageTitle title="Customer Quality" />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-[#eff6ff] text-[#1d4ed8] px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm">📋 Log Activity — {process.label}</h2>
            <p className="text-[#1d4ed8] text-xs mt-0.5">{process.clause}</p>
          </div>
          <button onClick={onClose} className="text-[#1d4ed8] hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Activity Step</label>
            <select value={form.activityStep} onChange={e => set('activityStep', e.target.value)}
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {process.activities.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Date</label>
              <input type="date" value={form.logDate} onChange={e => set('logDate', e.target.value)}
                className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Done</option><option>Planned</option><option>Pending</option><option>In Progress</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Owner / Responsible Person</label>
            <input type="text" value={form.owner} onChange={e => set('owner', e.target.value)}
              placeholder="e.g. Piyush Behere"
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Remarks / Description</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              rows={3} placeholder="What was done, any issues, findings..."
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Evidence Reference (optional)</label>
            <input type="text" value={form.evidence} onChange={e => set('evidence', e.target.value)}
              placeholder="e.g. Warranty_Log_Jul2026.xlsx, Email ref"
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-[#dbeafe] text-[#1e3a5f] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#eff6ff]">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 bg-[#eff6ff] text-[#1d4ed8] py-2.5 rounded-xl text-sm font-bold hover:bg-[#eff6ff] disabled:opacity-60">
              {saving ? 'Saving...' : '✓ Save Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
      </>
  );
}

// --- DOCUMENT PANEL ------------------------------------------------------------
function DocumentPanel({ process, onClose }: { process: typeof PROCESSES[0]; onClose: () => void }) {
  const [docs, setDocs] = useState<ProcessDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeDoc, setActiveDoc] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/process-documents?processId=${process.id}`);
      const d = await r.json();
      setDocs(Array.isArray(d) ? d : []);
    } catch { setDocs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [process.id]);

  const handleUpload = async (docName: string, file: File) => {
    await fetch('/api/process-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processId: process.id, documentName: docName, fileName: file.name, uploadedBy: 'User' }),
    });
    load();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col">
        <div className="bg-[#eff6ff] text-[#1d4ed8] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-sm">📄 Documents — {process.label}</h2>
            <p className="text-[#1d4ed8] text-xs mt-0.5">{process.docs.length} required documents</p>
          </div>
          <button onClick={onClose} className="text-[#1d4ed8] hover:text-white text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs text-[#1e3a5f] font-semibold uppercase tracking-wide">Required Documents</p>
          {process.docs.map(doc => {
            const uploaded = docs.filter(d => d.document_name === doc);
            return (
              <div key={doc} className="border border-[#dbeafe] rounded-xl p-3 hover:border-blue-700/50 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-blue-600 text-sm mt-0.5">📄</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1e3a5f]">{doc}</p>
                      {uploaded.length > 0 ? uploaded.map(u => (
                        <div key={u.id} className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs bg-green-100 text-[#15803d] px-1.5 py-0.5 rounded font-medium">✓ {u.file_name}</span>
                          <span className="text-xs text-[#1e3a5f]">{u.uploaded_at?.slice(0, 10)}</span>
                          <button onClick={async () => { await fetch(`/api/process-documents?id=${u.id}`, { method: 'DELETE' }); load(); }}
                            className="text-red-600 hover:text-red-600 text-xs">✕</button>
                        </div>
                      )) : <p className="text-xs text-[#1e3a5f] mt-0.5">Not yet uploaded</p>}
                    </div>
                  </div>
                  <button onClick={() => { setActiveDoc(doc); fileRef.current?.click(); }}
                    className="text-xs bg-[#eff6ff] text-[#1d4ed8] border border-blue-700/50 px-2 py-1 rounded-lg hover:bg-blue-100 flex-shrink-0">
                    ↑ Upload
                  </button>
                </div>
              </div>
            );
          })}
          {loading && <p className="text-center text-[#1e3a5f] text-sm py-4">Loading...</p>}
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file && activeDoc) handleUpload(activeDoc, file);
          e.target.value = '';
        }} />
        <div className="p-4 border-t border-[#dbeafe] flex-shrink-0">
          <button onClick={onClose} className="w-full bg-[#eff6ff] text-[#1d4ed8] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#eff6ff]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- AI ANALYSE MODAL ----------------------------------------------------------
function AiAnalyseModal({ process, complaints, onClose }: {
  process: typeof PROCESSES[0]; complaints: Complaint[]; onClose: () => void;
}) {
  const relevant = process.logType ? complaints.filter(c => c.complaint_type === process.logType) : complaints;
  const now = new Date();
  const last30 = relevant.filter(c => (now.getTime() - new Date(c.created_at).getTime()) <= 30 * 864e5);
  const prev30 = relevant.filter(c => {
    const diff = now.getTime() - new Date(c.created_at).getTime();
    return diff > 30 * 864e5 && diff <= 60 * 864e5;
  });
  const trend = last30.length > prev30.length ? '↑ Increasing' : last30.length < prev30.length ? '↓ Decreasing' : '→ Stable';
  const trendColor = last30.length > prev30.length ? 'text-red-600' : last30.length < prev30.length ? 'text-green-600' : 'text-blue-600';
  const defectMap: Record<string, number> = {};
  relevant.forEach(c => { defectMap[c.defect_category] = (defectMap[c.defect_category] || 0) + 1; });
  const topDefects = Object.entries(defectMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const openCount = relevant.filter(c => c.status === 'Open').length;
  const closedCount = relevant.filter(c => c.status === 'Closed').length;
  const closureRate = relevant.length > 0 ? Math.round((closedCount / relevant.length) * 100) : 0;
  const sevMap: Record<string, number> = {};
  relevant.forEach(c => { sevMap[c.severity] = (sevMap[c.severity] || 0) + 1; });
  const suggestions = [
    openCount > 3 ? `⚠️ ${openCount} open items need action — prioritize Critical and High severity first.` : null,
    closureRate < 70 ? `📌 Closure rate is ${closureRate}% — below 70% target. Escalate overdue CAPAs.` : null,
    topDefects[0] ? `🔍 Top defect: "${topDefects[0][0]}" (${topDefects[0][1]} cases) — initiate Pareto & targeted CAPA.` : null,
    last30.length > prev30.length + 2 ? `📈 Volume ↑ ${last30.length - prev30.length} in last 30 days — check for systemic process failure.` : null,
    sevMap['Critical'] > 0 ? `🚨 ${sevMap['Critical']} Critical severity items — escalate to Management Review immediately.` : null,
    relevant.length === 0 ? `✅ No data yet for this process. Start logging to enable AI trend analysis.` : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm">🤖 AI Analysis — {process.label}</h2>
            <p className="text-[#1d4ed8] text-xs mt-0.5">Based on {relevant.length} logged records</p>
          </div>
          <button onClick={onClose} className="text-[#1d4ed8] hover:text-white text-2xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: relevant.length, color: 'bg-[#eff6ff] border border-blue-200 text-[#1d4ed8]' },
              { label: 'Open', value: openCount, color: 'bg-red-50 border border-red-200 text-red-700' },
              { label: 'Closed', value: closedCount, color: 'bg-green-50 border border-green-200 text-green-700' },
              { label: 'Closure %', value: closureRate + '%', color: 'bg-purple-50 border border-purple-200 text-purple-700' },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#eff6ff] rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#1e3a5f] font-semibold">30-Day Trend</p>
              <p className={`text-sm font-bold mt-0.5 ${trendColor}`}>{trend}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#1e3a5f]">Last 30d: <b className="text-[#1e3a5f]">{last30.length}</b></p>
              <p className="text-xs text-[#1e3a5f]">Prev 30d: <b className="text-[#1e3a5f]">{prev30.length}</b></p>
            </div>
          </div>
          {topDefects.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">Top Defect Categories</p>
              <div className="space-y-1.5">
                {topDefects.map(([cat, cnt]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="text-xs text-[#1e3a5f] w-36 truncate">{cat}</div>
                    <div className="flex-1 bg-white rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(cnt / relevant.length) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#1e3a5f] w-5 text-right">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.keys(sevMap).length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">Severity Distribution</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(sevMap).map(([sev, cnt]) => (
                  <span key={sev} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${SEV_COLORS[sev] || 'bg-white text-[#1e3a5f]'}`}>
                    {sev}: {cnt}
                  </span>
                ))}
              </div>
            </div>
          )}
          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">💡 AI Recommendations</p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-[#eff6ff] border border-blue-800/50 rounded-lg p-3 text-xs text-blue-100">{s}</div>
                ))}
              </div>
            </div>
          )}
          <button onClick={onClose} className="w-full bg-[#eff6ff] text-[#1d4ed8] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#eff6ff]">
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE -----------------------------------------------------------------
export default function CustomerQualityPage() {
  const [activeTab, setActiveTab] = useState('__overview__');
  const [modal, setModal] = useState<LogType | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [activityModal, setActivityModal] = useState<{ process: typeof PROCESSES[0]; preStep?: string } | null>(null);
  const [docPanel, setDocPanel] = useState(false);
  const [aiPanel, setAiPanel] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [freqFilter, setFreqFilter] = useState<string | null>(null);

  const active = PROCESSES.find(p => p.id === activeTab) || PROCESSES[0];
  const daily = PROCESSES.filter(p => p.freq === 'Daily').length;
  const weekly = PROCESSES.filter(p => p.freq === 'Weekly').length;
  const monthly = PROCESSES.filter(p => p.freq === 'Monthly').length;
  const quarterly = PROCESSES.filter(p => p.freq === 'Quarterly').length;

  const visibleProcesses = freqFilter ? PROCESSES.filter(p => p.freq === freqFilter) : PROCESSES;

  const handleFreqCard = (freq: string) => {
    if (freqFilter === freq) {
      setFreqFilter(null);
      setActiveTab('__overview__');
    } else {
      setFreqFilter(freq);
      const first = PROCESSES.find(p => p.freq === freq);
      if (first) setActiveTab(first.id);
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingComplaints(true);
      try { const r = await fetch('/api/complaints'); const d = await r.json(); setComplaints(Array.isArray(d) ? d : []); } catch {}
      setLoadingComplaints(false);
    })();
  }, []);

  const loadActivityLogs = async (pid: string) => {
    try { const r = await fetch(`/api/activity-logs?processId=${pid}`); const d = await r.json(); setActivityLogs(Array.isArray(d) ? d : []); }
    catch { setActivityLogs([]); }
  };

  useEffect(() => { loadActivityLogs(activeTab); }, [activeTab]);

  const refreshComplaints = async () => { try { const r = await fetch('/api/complaints'); const d = await r.json(); setComplaints(Array.isArray(d) ? d : []); } catch {} };

  const deleteLog = async (id: number) => {
    await fetch(`/api/activity-logs?id=${id}`, { method: 'DELETE' });
    loadActivityLogs(activeTab);
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const safeActivityLogs = Array.isArray(activityLogs) ? activityLogs : [];
  const tabComplaints = active.logType ? safeComplaints.filter(c => c.complaint_type === active.logType) : [];
  const openCount = tabComplaints.filter(c => c.status === 'Open').length;

  const months: string[] = [];
  const mDate = new Date();
  for (let i = 0; i < 6; i++) {
    months.push(`${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`);
    mDate.setMonth(mDate.getMonth() - 1);
  }
  const filteredLogs = filterMonth ? safeActivityLogs.filter(l => l.log_date?.startsWith(filterMonth)) : safeActivityLogs;

  const handleMonthlyReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const rows = active.logType
      ? tabComplaints.map(c => `<tr><td>${c.complaint_number || '#' + c.id}</td><td>${c.created_at?.slice(0, 10)}</td><td>${c.customer_name}</td><td>${c.part_number || '—'}</td><td>${c.defect_category}</td><td>${c.quantity_affected}</td><td>${c.severity}</td><td>${c.status}</td><td>${c.assigned_to || '—'}</td></tr>`).join('')
      : safeActivityLogs.map(l => `<tr><td>${l.log_date}</td><td>${l.activity_step}</td><td>${l.owner || '—'}</td><td>${l.status}</td><td>${l.remarks || '—'}</td><td>${l.evidence || '—'}</td></tr>`).join('');
    const headers = active.logType
      ? '<tr><th>No.</th><th>Date</th><th>Customer</th><th>Part No.</th><th>Defect</th><th>Qty</th><th>Severity</th><th>Status</th><th>Assigned To</th></tr>'
      : '<tr><th>Date</th><th>Activity</th><th>Owner</th><th>Status</th><th>Remarks</th><th>Evidence</th></tr>';
    w.document.write(`<!DOCTYPE html><html><head><title>Monthly Report — ${active.label}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}.hdr{background:#1e3a5f;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:20px}h1{color:#fff;font-size:18px;margin:0}p.sub{opacity:.8;font-size:11px;margin:4px 0 0}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em}td{padding:7px 10px;border-bottom:1px solid #f0f0f0}tr:hover td{background:#f8fafc}.btn{background:#1e3a5f;color:#fff;padding:8px 20px;border:none;border-radius:6px;cursor:pointer;font-size:13px;margin-top:12px}@media print{.btn{display:none}}</style>
      </head><body>
      <div class="hdr"><h1>${active.icon} ${active.label} — Monthly Report</h1><p class="sub">${month} &nbsp;|&nbsp; ${active.clause} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN')}</p></div>
      <table><thead>${headers}</thead><tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:#888;padding:20px">No data recorded yet.</td></tr>'}</tbody></table>
      <button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="min-h-full bg-[#eff6ff]">

      {/* HEADER */}
      <div className="bg-[#eff6ff] text-[#1d4ed8] px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div>
            <div className="flex items-center gap-2 text-[#1d4ed8] text-xs mb-1">
              <span>QMOS</span><span>›</span><span>Departments</span><span>›</span><span className="text-white">Customer Quality</span>
            </div>
            <h1 className="text-xl font-bold">👥 Customer Quality</h1>
            <p className="text-[#1d4ed8] text-xs mt-0.5">Complaints · PPM · Warranty · PPAP · Audit · Satisfaction · Scorecard</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {active.logType && (
              <button onClick={() => setModal(active.logType)}
                className="bg-white text-[#1d4ed8] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#eff6ff] transition">
                + Log {active.logType === 'Customer Concern' ? 'Concern / PRR' : active.logType}
              </button>
            )}
            <button onClick={handleMonthlyReport}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 transition border border-blue-600">
              📊 Monthly Report
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Daily Activities', freq: 'Daily', value: daily, color: 'bg-red-700', ring: 'ring-red-300' },
            { label: 'Weekly Activities', freq: 'Weekly', value: weekly, color: 'bg-blue-700', ring: 'ring-blue-300' },
            { label: 'Monthly Activities', freq: 'Monthly', value: monthly, color: 'bg-green-700', ring: 'ring-green-300' },
            { label: 'Quarterly Activities', freq: 'Quarterly', value: quarterly, color: 'bg-purple-700', ring: 'ring-purple-300' },
          ].map(s => (
            <button key={s.label} onClick={() => handleFreqCard(s.freq)}
              className={`${s.color} rounded-lg px-4 py-2.5 text-left transition-all hover:brightness-110 hover:scale-[1.02] ${freqFilter === s.freq ? `ring-2 ${s.ring} scale-[1.03]` : 'opacity-80'}`}>
              <p className="text-2xl font-bold text-white drop-shadow">{s.value}</p>
              <p className="text-xs text-white font-semibold">{s.label}</p>
              <p className="text-xs text-white/90 mt-0.5">{freqFilter === s.freq ? '▲ Click to show all' : 'Click to filter →'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 mb-0" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/customer-quality/Customer_PPM_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Customer PPM Tracker">PPM Tracker XLS</a><a href="/downloads/customer-quality/Customer_PPM_Tracker.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Customer PPM Tracker">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#b45309'}}><a href="/downloads/customer-quality/Customer_Rejection_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Customer Rejection Register">Rejection Register XLS</a><a href="/downloads/customer-quality/Customer_Rejection_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Customer Rejection Register">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/customer-quality/Customer_Scorecard_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Customer Scorecard">Customer Scorecard XLS</a><a href="/downloads/customer-quality/Customer_Scorecard_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Customer Scorecard">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/customer-quality/Warranty_Claim_Log.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Warranty Claim Log">Warranty Log XLS</a><a href="/downloads/customer-quality/Warranty_Claim_Log.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Warranty Claim Log">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#166534'}}><a href="/downloads/customer-quality/Customer_Visit_Plan.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Customer Visit Plan">Visit Plan XLS</a><a href="/downloads/customer-quality/Customer_Visit_Plan.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Customer Visit Plan">⬇</a></span>
      </div>

      {/* SUB-TABS */}
      <div className="bg-white border-b border-[#dbeafe] shadow-sm">
        {freqFilter && (
          <div className="px-4 py-1.5 bg-[#eff6ff] border-b border-blue-800/50 flex items-center gap-3">
            <span className="text-xs text-[#1d4ed8] font-semibold">Showing: {freqFilter} activities only</span>
            <button onClick={() => { setFreqFilter(null); setActiveTab('__overview__'); }}
              className="text-xs text-blue-500 hover:text-[#1d4ed8] bg-white border border-blue-700/50 px-2 py-0.5 rounded-full">
              ✕ Clear filter — show all
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-4 py-0 gap-0">
            {/* Overview tab */}
            {!freqFilter && (
              <button onClick={() => setActiveTab('__overview__')}
                className={`flex flex-col items-start px-3 py-2.5 border-b-2 transition-all whitespace-nowrap text-left ${
                  activeTab === '__overview__' ? 'border-blue-700/50 text-[#1d4ed8] bg-[#eff6ff]' : 'border-transparent text-[#1e3a5f] hover:text-[#1e3a5f] hover:bg-[#eff6ff]'
                }`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📋</span>
                  <span className="text-xs font-semibold">All Work Overview</span>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded border mt-1 font-medium bg-white text-[#1e3a5f] border-[#dbeafe]">{PROCESSES.length} activities</span>
              </button>
            )}
            {visibleProcesses.map(p => (
              <button key={p.id} onClick={() => setActiveTab(p.id)}
                className={`flex flex-col items-start px-3 py-2.5 border-b-2 transition-all whitespace-nowrap text-left group ${
                  activeTab === p.id ? 'border-blue-700/50 text-[#1d4ed8] bg-[#eff6ff]' : 'border-transparent text-[#1e3a5f] hover:text-[#1e3a5f] hover:bg-[#eff6ff]'
                }`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-xs font-semibold">{p.no}. {p.label}</span>
                  {p.logType && (() => {
                    const cnt = complaints.filter(c => c.complaint_type === p.logType && c.status === 'Open').length;
                    return cnt > 0 ? <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{cnt}</span> : null;
                  })()}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded border mt-1 font-medium ${FREQ_COLORS[p.freq]}`}>{p.freq}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 space-y-4">

        {/* -- OVERVIEW TAB -- */}
        {activeTab === '__overview__' && (
          <div className="animate-fadeIn space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600">
              <h2 className="text-base font-bold text-[#1e3a5f] mb-1">📋 All Customer Quality Activities</h2>
              <p className="text-xs text-[#1e3a5f]">Click any frequency card above to filter. Click any activity row to open it.</p>
            </div>
            {(['Daily','Weekly','Monthly','Quarterly'] as const).map(freq => {
              const items = PROCESSES.filter(p => p.freq === freq);
              if (items.length === 0) return null;
              const freqStyle: Record<string,{hdr:string;badge:string;ring:string}> = {
                Daily:   { hdr:'bg-red-700',     badge:'bg-red-100 text-red-800 border-red-700/50',     ring:'border-red-700/50' },
                Weekly:  { hdr:'bg-blue-700',    badge:'bg-blue-700 text-white',   ring:'border-blue-700/50' },
                Monthly: { hdr:'bg-green-700',   badge:'bg-green-700 text-white',  ring:'border-green-700/50' },
                Quarterly:{ hdr:'bg-purple-700', badge:'bg-purple-700 text-white', ring:'border-purple-700/50' },
              };
              const st = freqStyle[freq];
              return (
                <div key={freq} className={`bg-white rounded-xl shadow-sm overflow-hidden border ${st.ring}`}>
                  <div className={`${st.hdr} text-white px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold uppercase tracking-wide">{freq} Activities</span>
                      <span className="bg-white/20 text-[#1e3a5f] text-xs px-2 py-0.5 rounded-full font-bold">{items.length} tasks</span>
                    </div>
                    <button onClick={() => handleFreqCard(freq)}
                      className="text-xs bg-white/20 hover:bg-white/30 text-[#1e3a5f] px-3 py-1 rounded-lg font-semibold">
                      Filter to {freq} only →
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map((p, i) => {
                      const open = p.logType ? complaints.filter(c => c.complaint_type === p.logType && c.status === 'Open').length : 0;
                      return (
                        <button key={p.id} onClick={() => setActiveTab(p.id)}
                          className="w-full flex items-center gap-4 px-5 py-3 hover:bg-[#eff6ff] transition text-left group">
                          <span className="text-[#1e3a5f] text-xs font-mono w-5 flex-shrink-0">{i + 1}</span>
                          <span className="text-lg flex-shrink-0">{p.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white group-hover:text-blue-100">{p.label}</p>
                            <p className="text-xs text-[#1e3a5f] truncate">{p.clause}</p>
                          </div>
                          {open > 0 && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold border border-red-700/50 flex-shrink-0">
                              {open} Open
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded border font-medium flex-shrink-0 ${FREQ_COLORS[p.freq]}`}>{p.freq}</span>
                          <span className="text-blue-600 text-sm opacity-0 group-hover:opacity-100 flex-shrink-0">→</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* -- PROCESS DETAIL -- */}
        {activeTab !== '__overview__' && <>

        {/* Process Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{active.icon}</span>
                <span className="text-xs text-[#1e3a5f] font-mono">Process {active.no}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${FREQ_COLORS[active.freq]}`}>{active.freq}</span>
                {active.logType && openCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-red-700/50">{openCount} Open</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">{active.label}</h2>
              <p className="text-xs text-[#1e3a5f] mt-1">{active.clause}</p>
              <p className="text-sm text-[#1e3a5f] mt-2 max-w-3xl">{active.desc}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              {active.logType ? (
                <button onClick={() => setModal(active.logType)}
                  className="bg-[#eff6ff] text-[#1d4ed8] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#eff6ff] transition">
                  {active.icon} + Log {active.logType === 'Customer Concern' ? 'Concern' : active.logType}
                </button>
              ) : (
                <button onClick={() => setActivityModal({ process: active })}
                  className="bg-[#eff6ff] text-[#1d4ed8] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#eff6ff] transition">
                  + Log Activity
                </button>
              )}
              <button onClick={() => setDocPanel(true)}
                className="bg-white text-[#1e3a5f] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#dbeafe] transition">
                📄 Documents
              </button>
              <button onClick={() => setAiPanel(true)}
                className="bg-white text-[#1e3a5f] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#dbeafe] transition">
                🤖 AI Analyse
              </button>
            </div>
          </div>
        </div>

        {/* COMPLAINT TABLE for logType tabs */}
        {active.logType && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#dbeafe]">
            <div className="px-5 py-3 border-b border-[#dbeafe] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-[#1e3a5f]">
                  {active.logType === 'Warranty' ? '🔄 Warranty Log' : active.logType === 'Customer Rejection' ? '❌ Customer Rejection Log' : '📋 Customer Concern / PRR Log'}
                </h3>
                <span className="text-xs bg-white text-[#1e3a5f] px-2 py-0.5 rounded-full font-semibold">{tabComplaints.length} Total</span>
                {openCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold border border-red-700/50">{openCount} Open</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={refreshComplaints} className="text-[#1e3a5f] hover:text-blue-600 text-xs px-2 py-1.5 rounded hover:bg-[#eff6ff]">↻ Refresh</button>
                <button onClick={() => setModal(active.logType)}
                  className="bg-[#eff6ff] text-[#1d4ed8] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#eff6ff] transition">
                  {active.icon} + Log {active.logType === 'Customer Concern' ? 'Concern / PRR' : active.logType}
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🤖</span>
                <span className="text-xs font-semibold">Auto 8D Generator linked to this log</span>
                <span className="text-[#1d4ed8] text-xs">— log a {active.logType} and 8D is auto-generated</span>
              </div>
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">D1–D8 Auto</span>
            </div>
            {loadingComplaints ? (
              <div className="py-10 text-center text-[#1e3a5f] text-sm">Loading...</div>
            ) : tabComplaints.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="text-4xl">{active.icon}</div>
                <p className="text-[#1e3a5f] text-sm font-medium">No {active.logType} logged yet</p>
                <button onClick={() => setModal(active.logType)}
                  className="inline-flex items-center gap-2 bg-[#eff6ff] text-[#1d4ed8] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#eff6ff] transition mt-2">
                  {active.icon} Log First {active.logType === 'Customer Concern' ? 'Concern / PRR' : active.logType} →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#eff6ff] text-xs text-[#1e3a5f] uppercase tracking-wide">
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
                      <tr key={c.id} className={`hover:bg-[#eff6ff] transition ${idx % 2 === 0 ? 'bg-white' : 'bg-[#eff6ff]/50'}`}>
                        <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-blue-100">{c.complaint_number || `#${c.id}`}</span></td>
                        <td className="px-4 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{c.created_at?.slice(0, 10) || '—'}</td>
                        <td className="px-4 py-3 text-xs font-medium text-[#1e3a5f] max-w-[120px] truncate">{c.customer_name}</td>
                        <td className="px-4 py-3 text-xs text-[#1e3a5f]">
                          <div className="font-mono text-[#1d4ed8]">{c.part_number || '—'}</div>
                          <div className="text-[#1e3a5f] truncate max-w-[100px]">{c.part_name}</div>
                        </td>
                        {active.logType === 'Warranty' && <td className="px-4 py-3 text-xs text-[#1e3a5f] font-mono">{c.warranty_claim_no || '—'}</td>}
                        {active.logType === 'Customer Concern' && <td className="px-4 py-3 text-xs text-[#1e3a5f] font-mono">{c.prr_number || '—'}</td>}
                        {active.logType === 'Customer Rejection' && <td className="px-4 py-3 text-xs text-[#1e3a5f]">{c.rejection_stage || '—'}</td>}
                        <td className="px-4 py-3 text-xs text-[#1e3a5f] max-w-[160px]">
                          <div className="font-medium">{c.defect_category}</div>
                          <div className="text-[#1e3a5f] line-clamp-1">{c.defect_description}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold">{c.quantity_affected ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEV_COLORS[c.severity] || 'bg-white text-[#1e3a5f]'}`}>{c.severity}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status] || 'bg-white text-[#1e3a5f]'}`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1e3a5f]">{c.assigned_to || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {c.report_generated ? (
                            <a href={`/complaints/${c.id}`} className="inline-flex items-center gap-1 bg-[#eff6ff] text-[#1d4ed8] text-xs px-2.5 py-1.5 rounded-lg font-semibold hover:bg-[#eff6ff] transition">📊 Open 8D</a>
                          ) : (
                            <a href={`/complaints/${c.id}`} className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold hover:bg-orange-600 transition">🤖 Generate 8D</a>
                          )}
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
            <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">📋 Activity Workflow</h3>
            <div className="space-y-2">
              {active.activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#eff6ff] rounded-lg border border-[#dbeafe] hover:border-blue-700/50 hover:bg-[#eff6ff] transition group">
                  <div className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#1d4ed8] text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-[#1e3a5f] flex-1">{act}</p>
                  <button
                    onClick={() => active.logType ? setModal(active.logType) : setActivityModal({ process: active, preStep: act })}
                    className="opacity-0 group-hover:opacity-100 text-xs text-[#1d4ed8] bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg font-semibold flex-shrink-0 transition">
                    Log ›
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4">

            {/* KPIs */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">📊 Key KPIs</h3>
              <div className="space-y-2">
                {active.kpis.map((kpi, i) => {
                  let value = '—';
                  if (active.logType) {
                    const tc = tabComplaints;
                    if (i === 0) value = tc.length > 0 ? String(tc.length) : '0';
                    else if (i === 1) value = tc.filter(c => c.status === 'Open').length + ' open';
                    else if (i === 2) {
                      const cl = tc.filter(c => c.status === 'Closed').length;
                      value = tc.length > 0 ? Math.round((cl / tc.length) * 100) + '%' : '—';
                    }
                  } else {
                    if (i === 0) value = safeActivityLogs.length + ' logged';
                    else if (i === 1) value = safeActivityLogs.filter(l => l.status === 'Done').length + ' done';
                  }
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-[#eff6ff] rounded-lg flex-wrap gap-y-2">
                      <span className="text-xs text-[#1e3a5f] font-medium">{kpi}</span>
                      <span className={`text-xs font-bold ${value !== '—' ? 'text-[#1d4ed8]' : 'text-[#1e3a5f]'}`}>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">📄 Required Documents</h3>
              <div className="space-y-1.5">
                {active.docs.map((doc, i) => (
                  <div key={i} onClick={() => setDocPanel(true)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#eff6ff] cursor-pointer group">
                    <span className="text-blue-600 text-xs">📄</span>
                    <span className="text-xs text-[#1e3a5f] flex-1">{doc}</span>
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
                  { label: `Analyse ${active.label} trend`, action: () => setAiPanel(true) },
                  { label: `Generate ${active.label} report`, action: handleMonthlyReport },
                  { label: 'View past similar issues', action: () => setAiPanel(true) },
                  { label: 'Create CAPA suggestion', action: () => active.logType ? setModal(active.logType) : setActivityModal({ process: active }) },
                ].map((s, i) => (
                  <button key={i} onClick={s.action}
                    className="w-full text-left text-xs text-[#1d4ed8] hover:text-white bg-[#eff6ff] hover:bg-blue-700 px-3 py-2 rounded-lg transition">
                    💡 {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVITY LOG TABLE — non-logType tabs */}
        {!active.logType && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#dbeafe] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-[#1e3a5f]">Activity Log — {active.label}</h3>
                <span className="text-xs bg-white text-[#1e3a5f] px-2 py-0.5 rounded-full font-semibold">{filteredLogs.length} entries</span>
              </div>
              <div className="flex gap-2">
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                  className="text-xs border border-[#dbeafe] rounded-lg px-2 py-1.5 text-[#1e3a5f] focus:outline-none">
                  <option value="">All Months</option>
                  {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
                </select>
                <button onClick={() => setActivityModal({ process: active })}
                  className="bg-[#eff6ff] text-[#1d4ed8] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#eff6ff] transition">
                  + Add Entry
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#eff6ff] text-xs text-[#1e3a5f] uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-left">Activity</th>
                  <th className="px-4 py-2.5 text-left">Owner</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-left">Evidence</th>
                  <th className="px-4 py-2.5 text-left">Remarks</th>
                  <th className="px-4 py-2.5 text-center">Del</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <p className="text-[#1e3a5f] text-sm mb-3">No activity logged yet for this {active.freq.toLowerCase()} process.</p>
                      <button onClick={() => setActivityModal({ process: active })}
                        className="inline-flex items-center gap-2 bg-[#eff6ff] text-[#1d4ed8] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#eff6ff] transition">
                        {active.icon} Log First Entry →
                      </button>
                    </td>
                  </tr>
                ) : filteredLogs.map((log, idx) => (
                  <tr key={log.id} className={`hover:bg-[#eff6ff] transition ${idx % 2 === 0 ? 'bg-white' : 'bg-[#eff6ff]/40'}`}>
                    <td className="px-4 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{log.log_date || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#1e3a5f] max-w-[200px]"><span className="font-medium">{log.activity_step}</span></td>
                    <td className="px-4 py-3 text-xs text-[#1e3a5f]">{log.owner || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[log.status] || 'bg-white text-[#1e3a5f]'}`}>{log.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#1d4ed8] max-w-[130px] truncate">{log.evidence || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#1e3a5f] max-w-[180px]"><span className="line-clamp-2">{log.remarks || '—'}</span></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deleteLog(log.id)}
                        className="text-red-600 hover:text-red-600 text-xs hover:bg-red-50 px-2 py-1 rounded transition">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </> /* end process detail */}
      </div>

      {/* MODALS & PANELS */}
      {modal && (
        <CustomerLogModal type={modal} onClose={() => setModal(null)} onSuccess={async () => { setModal(null); await refreshComplaints(); }} />
      )}
      {activityModal && (
        <ActivityLogModal process={activityModal.process} preStep={activityModal.preStep}
          onClose={() => setActivityModal(null)}
          onSuccess={() => { setActivityModal(null); loadActivityLogs(activeTab); }} />
      )}
      {docPanel && <DocumentPanel process={active} onClose={() => setDocPanel(false)} />}
      {aiPanel && <AiAnalyseModal process={active} complaints={complaints} onClose={() => setAiPanel(false)} />}
      <QualityCopilot page="customer-quality" />
    </div>
  );
}