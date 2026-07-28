'use client';
import { useState, useEffect, useRef } from 'react';

// ─── QMS PROCESS DEFINITIONS ──────────────────────────────────────────────────
const PROCESSES = [
  {
    id: 'audit-plan', no: '0', label: 'Audit Plan & Adherence', freq: 'Biweekly',
    icon: '📅', clause: 'IATF 16949 Cl. 9.2 / ISO 9001 Cl. 9.2',
    desc: 'Prepare and maintain the annual internal audit plan. Track adherence to planned audit schedule biweekly and re-schedule missed audits with justification.',
    activities: [
      'Review annual audit schedule for the current period',
      'Check planned vs actual audit completion status',
      'Identify overdue or missed audits',
      'Re-schedule missed audits with management approval',
      'Update audit adherence tracker',
      'Report biweekly audit adherence % to QH',
    ],
    docs: ['Annual Audit Plan', 'Audit Adherence Tracker', 'Audit Schedule (Revised)', 'Audit Coverage Matrix'],
    kpis: ['Audit Plan Adherence %', 'Overdue Audits', 'Audits Completed YTD'],
  },
  {
    id: 'external-iatf', no: '1', label: 'External IATF Audit', freq: 'Biweekly',
    icon: '🏅', clause: 'IATF 16949 Cl. 9.2.2.4',
    desc: 'Track and prepare for external IATF 16949 certification / surveillance / re-certification audits. Monitor NC status and ensure audit readiness biweekly.',
    activities: [
      'Review IATF audit schedule and next audit date',
      'Check status of previous audit NCs and CAPAs',
      'Prepare clause-wise evidence folder',
      'Conduct pre-audit gap assessment',
      'Update NC closure tracker and submit to CB',
      'Brief leadership team on audit readiness status',
    ],
    docs: ['IATF Certificate', 'NC Closure Tracker', 'Audit Evidence Folder', 'CB Communication Log', 'Pre-Audit Gap Report'],
    kpis: ['NC Closure %', 'Days to Next Audit', 'Open Major NCs', 'Open Minor NCs'],
  },
  {
    id: 'external-iso', no: '2', label: 'External ISO 14001 / 45001', freq: 'Quarterly',
    icon: '🌿', clause: 'ISO 14001:2015 / ISO 45001:2018',
    desc: 'Manage external surveillance and recertification audits for ISO 14001 (EMS) and ISO 45001 (OH&S). Track quarterly readiness and NC closure.',
    activities: [
      'Review ISO 14001 / 45001 audit schedule',
      'Update environmental aspects and hazard risk registers',
      'Check legal compliance status',
      'Review NC status from previous audit',
      'Prepare audit evidence for quarterly review',
      'Conduct quarterly management review inputs for EMS / OHSMS',
    ],
    docs: ['ISO 14001 Certificate', 'ISO 45001 Certificate', 'Aspect Impact Register', 'Hazard Risk Register', 'Legal Compliance Register', 'NC Closure Tracker'],
    kpis: ['NC Closure %', 'Legal Compliance %', 'Open Significant Aspects', 'Incident Count (YTD)'],
  },
  {
    id: 'mr-appointment', no: '3', label: 'MR Appointment', freq: 'Yearly',
    icon: '👤', clause: 'IATF 16949 Cl. 5.3',
    desc: 'Ensure Management Representative appointment letter is issued, updated and on display. Verify MR authority and responsibilities are clearly defined annually.',
    activities: [
      'Review current MR appointment letter for validity',
      'Confirm MR is aware of all responsibilities (IATF Cl. 5.3)',
      'Re-issue appointment letter if MR has changed',
      'Update QMS documents with new MR details',
      'Communicate MR details to CB (Certification Body)',
      'Post MR appointment notice at QMS display board',
    ],
    docs: ['MR Appointment Letter', 'Organisational Chart', 'MR Responsibility Matrix', 'CB Intimation Letter'],
    kpis: ['MR Letter Valid', 'Last Review Date', 'CB Notified (Y/N)'],
  },
  {
    id: 'contingency-plan', no: '4', label: 'Contingency Plan', freq: 'Six Monthly',
    icon: '🛡️', clause: 'IATF 16949 Cl. 6.1.2.3',
    desc: 'Review and update the plant contingency plan for key manufacturing risk scenarios — machine breakdown, key man absence, material shortage, power failure, flood, fire.',
    activities: [
      'Review all contingency scenarios for relevance',
      'Check if new risks have emerged since last review',
      'Validate contact lists and emergency responders',
      'Test contingency plan with table-top drill',
      'Update customer notification process',
      'Get approval from Plant Head and document review date',
    ],
    docs: ['Contingency Plan Document', 'Emergency Contact List', 'Table-Top Drill Record', 'Customer Notification Procedure', 'Business Continuity Register'],
    kpis: ['Contingency Plan Review Done', 'Drill Conducted (Y/N)', 'Gaps Identified & Closed'],
  },
  {
    id: 'management-review', no: '5', label: 'Management Review', freq: 'Six Monthly',
    icon: '🎯', clause: 'IATF 16949 Cl. 9.3 / ISO 9001 Cl. 9.3',
    desc: 'Conduct formal Management Review Meeting (MRM). Cover all mandatory inputs per IATF 16949 Cl. 9.3.2, capture outputs with action owners and track closure.',
    activities: [
      'Prepare MR input data: customer satisfaction, PPM, audits, objectives, CAPAs',
      'Send pre-read MR pack to leadership 3 days before',
      'Conduct MRM with all HODs and Plant Head',
      'Capture MOM with action items, owners, due dates',
      'Distribute signed MOM within 24 hrs',
      'Track and update MR action closure at next review',
    ],
    docs: ['Management Review MOM', 'MR Input Data Pack', 'Action Tracker', 'Previous MR Closure Evidence', 'Attendance Sheet'],
    kpis: ['MR Actions Closed %', 'Overdue MR Actions', 'MR Held On-time (Y/N)', 'Total MR Actions'],
  },
  {
    id: 'plant-objective', no: '6', label: 'Plant Objective', freq: 'Monthly',
    icon: '🎯', clause: 'IATF 16949 Cl. 6.2 / ISO 9001 Cl. 6.2',
    desc: 'Monitor and update plant quality objectives monthly. Review KPIs vs targets for all departments and escalate gaps with CAPA.',
    activities: [
      'Collect monthly KPI data from all departments',
      'Update plant objective tracker with actual vs target',
      'Identify objectives below target (red/amber status)',
      'Escalate critical gaps to HOD with CAPA',
      'Review objective trend (last 3 months)',
      'Present plant objective status in monthly review',
    ],
    docs: ['Plant Objective Tracker', 'Monthly KPI Report', 'Objective CAPA Log', 'Trend Charts'],
    kpis: ['Objectives On-target %', 'Red Objectives Count', 'CAPA Raised for Gaps'],
  },
  {
    id: 'plant-processes', no: '7', label: 'Plant Processes & Outsourced Process', freq: 'Yearly',
    icon: '🔄', clause: 'IATF 16949 Cl. 4.4 / 8.4',
    desc: 'Review and update the process map, turtle diagram and outsourced process controls annually. Ensure all processes have defined inputs, outputs, owners and KPIs.',
    activities: [
      'Review process map for completeness and accuracy',
      'Update turtle diagrams for all core processes',
      'Identify new or changed processes',
      'Review outsourced process controls (CSL-1, CSL-2)',
      'Confirm process owners for all mapped processes',
      'Update SIPOC or process interaction matrix if needed',
    ],
    docs: ['Process Map / Interaction Matrix', 'Turtle Diagrams', 'Outsourced Process Control Procedure', 'Process Owner Register', 'SIPOC'],
    kpis: ['Processes Reviewed %', 'Outsourced Processes with Controls', 'Open Process Gaps'],
  },
  {
    id: 'backup-method', no: '8', label: 'Alternative / Back-up Method', freq: 'Yearly',
    icon: '🔧', clause: 'IATF 16949 Cl. 6.1.2.3',
    desc: 'Document and validate alternative / back-up methods for critical processes. Ensure backup methods are defined for key machines, gauges, materials, and personnel.',
    activities: [
      'Identify all critical processes requiring backup method',
      'Review existing backup methods for adequacy',
      'Add new backup methods for risks identified since last review',
      'Validate backup methods with trial run if applicable',
      'Update contingency plan with backup method reference',
      'Get HOD approval and file revised document',
    ],
    docs: ['Alternative Method Register', 'Backup Process Procedure', 'Trial Run Evidence', 'Contingency Plan (linked)'],
    kpis: ['Critical Processes with Backup %', 'Backup Methods Validated', 'Last Review Date'],
  },
  {
    id: 'quality-policy', no: '9', label: 'Quality Policy', freq: 'Yearly',
    icon: '📜', clause: 'IATF 16949 Cl. 5.2 / ISO 9001 Cl. 5.2',
    desc: 'Review and update the Quality Policy annually. Ensure it is displayed, communicated, understood by all employees and aligned with strategic direction.',
    activities: [
      'Review quality policy for continued suitability',
      'Check alignment with corporate/TACO quality policy',
      'Update policy if organizational context has changed',
      'Get Plant Head / MD approval on updated policy',
      'Communicate updated policy to all employees',
      'Verify displays at all plant locations are updated',
      'Record policy awareness in training records',
    ],
    docs: ['Quality Policy (Signed)', 'Policy Display Photos', 'Employee Awareness Record', 'Policy Communication Evidence'],
    kpis: ['Policy Review Done (Y/N)', 'Display Locations Updated', 'Employee Awareness %'],
  },
  {
    id: 'plant-issue-list', no: '10', label: 'Plant Issue List', freq: 'Monthly',
    icon: '📋', clause: 'IATF 16949 Cl. 4.1 / ISO 9001 Cl. 4.1',
    desc: 'Maintain and review the plant internal/external issue register (context of organization). Update monthly and use as input to risk register and management review.',
    activities: [
      'Review existing plant issues for status change',
      'Add new internal / external issues identified',
      'Classify issues (internal / external, quality / environmental / safety)',
      'Update issue impact and relevance rating',
      'Link high-impact issues to risk register',
      'Present updated issue list in monthly QMS review',
    ],
    docs: ['Plant Issue Register', 'Context of Organization Document', 'Interested Party Register', 'Risk Linkage Record'],
    kpis: ['New Issues Added', 'Issues Resolved', 'High-Impact Issues Open', 'Issue Register Updated (Y/N)'],
  },
  {
    id: 'ci-opportunities', no: '11', label: 'CI Opportunities', freq: 'Quarterly',
    icon: '💡', clause: 'IATF 16949 Cl. 10.3 / ISO 9001 Cl. 10.3',
    desc: 'Identify, log and track Continual Improvement (CI) opportunities at plant level. Review quarterly progress and convert to CI projects with measurable targets.',
    activities: [
      'Collect CI ideas from all departments (shop-floor, Kaizen)',
      'Evaluate and prioritize CI ideas by impact and effort',
      'Convert shortlisted ideas into CI projects with owners',
      'Review progress of ongoing CI projects',
      'Close completed CI projects with evidence',
      'Present CI summary in quarterly QMS review',
    ],
    docs: ['CI Opportunity Register', 'CI Project Tracker', 'Kaizen Log', 'CI Closure Evidence', 'CI Dashboard'],
    kpis: ['CI Ideas Logged', 'CI Projects Open', 'CI Projects Closed', 'CI Savings (if applicable)'],
  },
  {
    id: 'award-nominations', no: '12', label: 'Award Nominations', freq: 'Monthly',
    icon: '🏆', clause: 'Customer Specific Requirement / TACO Policy',
    desc: 'Process monthly award nominations for quality excellence, best employee, Kaizen, and other recognition programs. Submit nominations to HR / Customer portal on time.',
    activities: [
      'Collect nominations from department heads',
      'Review eligibility and quality of nominations',
      'Prepare nomination write-up with evidence',
      'Submit nominations to HR and customer portals',
      'Track award results and communicate to nominees',
      'Maintain award nomination register',
    ],
    docs: ['Award Nomination Register', 'Nomination Forms', 'Submission Acknowledgement', 'Award Certificates'],
    kpis: ['Nominations Submitted', 'Awards Won YTD', 'On-time Submission %'],
  },
  {
    id: 'internal-iatf', no: '13', label: 'Internal IATF Audit', freq: 'Quarterly',
    icon: '🔍', clause: 'IATF 16949 Cl. 9.2.2',
    desc: 'Conduct quarterly internal IATF 16949 system audits covering all clauses. All clauses must be audited at least once per audit cycle.',
    activities: [
      'Prepare quarterly audit plan and assign auditors',
      'Issue audit notification to auditee 3 days prior',
      'Conduct clause-wise audit with evidence review',
      'Log findings (NCs, Observations, OFIs)',
      'Issue NC report and initiate CAPA',
      'Verify NC closure before audit cycle end',
    ],
    docs: ['Internal Audit Plan', 'Audit Checklist (IATF)', 'NC Report', 'CAPA Log', 'Audit Closure Evidence', 'Auditor Qualification Record'],
    kpis: ['Clauses Audited %', 'NCs Raised', 'NCs Closed %', 'Avg NC Closure Days'],
  },
  {
    id: 'internal-process', no: '14', label: 'Internal Process Audit', freq: 'Monthly',
    icon: '⚙️', clause: 'IATF 16949 Cl. 9.2.2.2',
    desc: 'Conduct monthly internal process audits using VDA 6.3 or turtle diagram approach. Cover all manufacturing processes as per the audit plan.',
    activities: [
      'Select process for monthly audit as per plan',
      'Prepare VDA 6.3 / turtle audit checklist',
      'Conduct on-site process audit with process owner',
      'Log findings and assign ratings (A/B/C)',
      'Issue audit report and initiate CAPA for findings',
      'Follow up NC closure with evidence',
    ],
    docs: ['Process Audit Checklist (VDA 6.3)', 'Process Audit Report', 'NC / CAPA Log', 'Audit Score Summary', 'Process Audit Schedule'],
    kpis: ['Processes Audited This Month', 'NC Count', 'CAPA Open %', 'Avg Audit Score'],
  },
  {
    id: 'internal-product', no: '15', label: 'Internal Product Audit', freq: 'Monthly',
    icon: '🔬', clause: 'IATF 16949 Cl. 9.2.2.3',
    desc: 'Conduct monthly internal product audits on finished goods. Check against approved drawings, control plan, and customer specifications.',
    activities: [
      'Select FG part for product audit as per plan',
      'Prepare product audit checklist (drawing + CP characteristics)',
      'Conduct dimensional, visual, and functional checks',
      'Compare results with customer specifications',
      'Log findings and initiate CAPA for deviations',
      'Submit product audit report to management',
    ],
    docs: ['Product Audit Checklist', 'Product Audit Report', 'Approved Drawing (latest rev)', 'Deviation CAPA Log', 'Product Audit Schedule'],
    kpis: ['Products Audited', 'Deviations Found', 'CAPA Closure %', 'Audit Score'],
  },
  {
    id: 'internal-cp', no: '16', label: 'Internal Control Plan Audit', freq: 'Monthly',
    icon: '📊', clause: 'IATF 16949 Cl. 8.5.1.1',
    desc: 'Audit implementation of the Control Plan on the shop floor monthly. Verify all control plan characteristics are being monitored as specified.',
    activities: [
      'Select part number for CP audit as per schedule',
      'Review control plan characteristics vs actual shop floor practice',
      'Check frequency of monitoring for each characteristic',
      'Verify gauge availability and calibration status',
      'Log deviations from control plan',
      'Initiate CAPA for deviations and update control plan if required',
    ],
    docs: ['Control Plan', 'CP Audit Checklist', 'CP Deviation Log', 'CAPA Evidence', 'CP Audit Schedule'],
    kpis: ['CP Compliance %', 'Characteristics Audited', 'Deviations Found', 'CAPA Closed %'],
  },
  {
    id: 'internal-csr', no: '17', label: 'Internal CSR Audit', freq: 'Quarterly',
    icon: '📌', clause: 'IATF 16949 Cl. 8.2.2 / Customer Specific Requirements',
    desc: 'Audit implementation of Customer Specific Requirements (CSR) across all relevant processes quarterly. Ensure CSR gaps are identified and corrected.',
    activities: [
      'Download latest CSR for all customers (TML, TMBSL, etc.)',
      'Prepare CSR audit checklist mapping CSR to process evidence',
      'Conduct CSR audit across relevant departments',
      'Log CSR gaps and non-conformances',
      'Initiate CAPA for each gap identified',
      'Update CSR compliance register and report to MR',
    ],
    docs: ['CSR Register', 'CSR Audit Checklist', 'CSR Audit Report', 'CAPA Log', 'CSR Compliance Matrix'],
    kpis: ['CSR Compliance %', 'CSR Gaps Found', 'CAPA Closed %', 'Customers CSR Reviewed'],
  },
  {
    id: 'craftsmanship-audit', no: '18', label: 'Internal Craftsmanship Audit', freq: 'Monthly',
    icon: '🪑', clause: 'Customer Specific Requirement / TML CSR',
    desc: 'Conduct monthly craftsmanship audit on finished goods (seats/trims). Evaluate visual quality, fit-finish, stitching, foam, and trim defects per customer criteria.',
    activities: [
      'Select units for craftsmanship audit as per plan',
      'Conduct audit using craftsmanship criteria (TML boundary samples)',
      'Log defects with photos and severity classification',
      'Calculate craftsmanship score / demerit points',
      'Initiate CAPA for recurring defects',
      'Report craftsmanship score in monthly quality review',
    ],
    docs: ['Craftsmanship Audit Checklist', 'Boundary Sample Reference', 'Craftsmanship Audit Report', 'Defect Photo Log', 'CAPA Log'],
    kpis: ['Craftsmanship Score', 'Defects per Unit (DPU)', 'CAPA Closed %', 'Repeat Defects'],
  },
  {
    id: 'audit-6s', no: '19', label: 'Internal 6S Audit', freq: 'Monthly',
    icon: '✨', clause: 'Internal Standard / TACO CSR',
    desc: 'Conduct monthly 6S (Sort, Set, Shine, Standardize, Sustain, Safety) audit across all plant areas. Score each zone and drive improvement actions.',
    activities: [
      'Prepare 6S audit checklist for each zone',
      'Conduct 6S audit with cross-functional auditor',
      'Score each S parameter (1-5 scale) per zone',
      'Log findings with photos',
      'Issue 6S score card to zone owners',
      'Track improvement actions to closure',
    ],
    docs: ['6S Audit Checklist', '6S Score Card', '6S Audit Photo Report', 'Zone Improvement Action Tracker', '6S Audit Schedule'],
    kpis: ['Overall 6S Score', 'Zones Below Target', 'Improvement Actions Open', '6S Score Trend'],
  },
  {
    id: 'ifc-audit', no: '20', label: 'Internal IFC Audit', freq: 'Monthly',
    icon: '📂', clause: 'IATF 16949 Cl. 7.5',
    desc: 'Conduct Internal Format Compliance (IFC) / Document Control audit monthly. Verify documents are controlled, current revision displayed and obsolete docs removed.',
    activities: [
      'Select areas / processes for IFC audit',
      'Check document revisions on display vs master list',
      'Verify obsolete documents are recalled and destroyed',
      'Check document numbering and approval signatures',
      'Log non-conformances with document reference',
      'Ensure corrections are made within 5 working days',
    ],
    docs: ['Document Master List', 'IFC Audit Checklist', 'IFC Audit Report', 'NC Log', 'Obsolete Document Destruction Record'],
    kpis: ['IFC Compliance %', 'Documents Non-Compliant', 'NC Closure %', 'Obsolete Docs Found'],
  },
  {
    id: 'taco-policies', no: '21', label: 'TACO / TM Policies (Vision & Mission)', freq: 'Yearly',
    icon: '🌟', clause: 'Corporate Requirement / TACO / Tata Motors',
    desc: 'Review and update TACO and Tata Motors group Vision, Mission, and Values annually. Ensure alignment with plant quality policy and all displays are current.',
    activities: [
      'Download latest TACO / TM Vision & Mission from corporate portal',
      'Compare with current plant displays',
      'Update all display boards with latest version',
      'Communicate new Vision & Mission to all employees via toolbox talk',
      'Record communication evidence in training register',
      'Align quality policy with corporate values',
    ],
    docs: ['TACO Vision & Mission Document', 'TM Group Values Document', 'Display Board Photos', 'Communication Record', 'Training Register Entry'],
    kpis: ['Display Boards Updated %', 'Employee Awareness Done (Y/N)', 'Last Review Date'],
  },
  {
    id: 'sushree-data', no: '22', label: 'From Sushree — Raw Data', freq: 'Monthly',
    icon: '📥', clause: 'Internal Process',
    desc: 'Collect, validate and process monthly raw quality data received from Sushree. Compile into QMS reports and update relevant trackers.',
    activities: [
      'Receive raw data file from Sushree (defined format)',
      'Validate data completeness and accuracy',
      'Identify anomalies or missing data and follow up',
      'Enter / import data into QMS tracker',
      'Generate summary report from raw data',
      'Distribute report to relevant stakeholders',
    ],
    docs: ['Sushree Raw Data File', 'Data Validation Checklist', 'QMS Monthly Summary Report', 'Data Entry Log'],
    kpis: ['Data Received On-time (Y/N)', 'Anomalies Found', 'Report Generated (Y/N)', 'Last Receipt Date'],
  },
  {
    id: 'document-control', no: '23', label: 'Document Control', freq: 'Quarterly',
    icon: '📁', clause: 'IATF 16949 Cl. 7.5 / ISO 9001 Cl. 7.5',
    desc: 'Quarterly document control audit. Review document master list, verify revision status, confirm all controlled documents are current and obsolete docs are removed.',
    activities: [
      'Update Document Master List (DML) with latest revisions',
      'Check all controlled documents for correct revision at point of use',
      'Withdraw and destroy obsolete documents',
      'Review document retention periods and archive outdated records',
      'Check external document register (standards, customer specs)',
      'Report document control status to MR',
    ],
    docs: ['Document Master List (DML)', 'External Document Register', 'Obsolete Document Log', 'Document Control Procedure', 'Retention Period Schedule'],
    kpis: ['Documents Reviewed %', 'Obsolete Docs Recalled', 'External Docs Up-to-date %', 'DML Revision Date'],
  },
  {
    id: 'ci-plant', no: '24', label: 'CI / Plant Improvement', freq: 'Monthly',
    icon: '📈', clause: 'IATF 16949 Cl. 10.3 / ISO 9001 Cl. 10.3',
    desc: 'Track and drive monthly plant-level continual improvement projects. Monitor ongoing Kaizen, breakthrough projects and cost-saving initiatives.',
    activities: [
      'Review CI project progress this month',
      'Log new CI initiatives identified from shop floor',
      'Check target vs actual for each CI project',
      'Escalate delayed or at-risk CI projects',
      'Close completed CI projects with verified savings/results',
      'Present CI status in monthly plant review',
    ],
    docs: ['CI Project Tracker', 'Kaizen Register', 'CI Closure Report', 'Before-After Evidence', 'Cost Saving Summary'],
    kpis: ['CI Projects Active', 'CI Projects Closed This Month', 'Kaizen Ideas Implemented', 'Cost Saving (₹)'],
  },
  {
    id: 'risk-opportunities', no: '25', label: 'Risk & Opportunities', freq: 'Six Monthly',
    icon: '⚠️', clause: 'IATF 16949 Cl. 6.1 / ISO 9001 Cl. 6.1',
    desc: 'Review and update the plant Risk & Opportunity Register every six months. Assess new risks from external / internal context and update mitigation actions.',
    activities: [
      'Review existing risks — update likelihood, impact and status',
      'Identify new risks from plant issue list and stakeholder inputs',
      'Identify new opportunities for improvement',
      'Update risk mitigation action plan',
      'Validate effectiveness of mitigation for closed risks',
      'Present R&O register in Management Review',
    ],
    docs: ['Risk & Opportunity Register', 'Risk Assessment Matrix', 'Mitigation Action Plan', 'Context of Organization (linked)', 'MR Input Evidence'],
    kpis: ['Risks Identified', 'High Risks with Mitigation %', 'Opportunities Converted to CI', 'Risks Reviewed (Y/N)'],
  },
  {
    id: 'empowerment', no: '26', label: 'Empowerment & Motivation', freq: 'Monthly',
    icon: '💪', clause: 'IATF 16949 Cl. 7.1.2 / ISO 9001 Cl. 7.1.2',
    desc: 'Drive monthly employee empowerment and motivation initiatives. Track Kaizen participation, recognition programs, skill development and employee engagement.',
    activities: [
      'Review employee participation in Kaizen and CI this month',
      'Issue recognition / appreciation letters to top performers',
      'Conduct skill development workshop or training session',
      'Update employee empowerment tracker',
      'Review grievance / suggestion box inputs',
      'Plan next month\'s motivation activity',
    ],
    docs: ['Empowerment Tracker', 'Recognition Letters', 'Training / Workshop Records', 'Suggestion Box Register', 'Kaizen Participation Log'],
    kpis: ['Kaizen Participation %', 'Recognitions Given', 'Training Sessions Held', 'Suggestions Implemented'],
  },
];

const FREQ_COLORS: Record<string, string> = {
  Daily:        'bg-red-100 text-red-800 border-red-200',
  Biweekly:     'bg-cyan-100 text-cyan-800 border-cyan-200',
  Weekly:       'bg-blue-100 text-blue-800 border-blue-200',
  Monthly:      'bg-green-100 text-green-800 border-green-200',
  Quarterly:    'bg-purple-100 text-purple-800 border-purple-200',
  'Six Monthly':'bg-orange-100 text-orange-800 border-orange-200',
  Yearly:       'bg-gray-100 text-gray-700 border-gray-300',
};

const STATUS_COLORS: Record<string, string> = {
  Done: 'bg-green-100 text-green-700',
  Planned: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
};

interface ActivityLog {
  id: number; process_id: string; process_label: string; activity_step: string;
  log_date: string; owner: string; status: string; remarks: string; evidence: string;
}

interface ProcessDoc {
  id: number; process_id: string; document_name: string; file_name: string;
  uploaded_by: string; uploaded_at: string;
}

// ─── ACTIVITY LOG MODAL ────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm">📋 Log Activity — {process.label}</h2>
            <p className="text-indigo-300 text-xs mt-0.5">{process.clause}</p>
          </div>
          <button onClick={onClose} className="text-indigo-300 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Step</label>
            <select value={form.activityStep} onChange={e => set('activityStep', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {process.activities.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input type="date" value={form.logDate} onChange={e => set('logDate', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Done</option><option>Planned</option><option>Pending</option><option>In Progress</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Owner / Responsible</label>
            <input type="text" value={form.owner} onChange={e => set('owner', e.target.value)}
              placeholder="e.g. Piyush Behere / MR"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks / Description</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              rows={3} placeholder="What was done, findings, gaps..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Evidence Reference (optional)</label>
            <input type="text" value={form.evidence} onChange={e => set('evidence', e.target.value)}
              placeholder="e.g. Audit_Plan_Jul2026.xlsx, MR_MOM_Jun2026.pdf"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 bg-indigo-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-800 disabled:opacity-60">
              {saving ? 'Saving...' : '✓ Save Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENT PANEL ────────────────────────────────────────────────────────────
function DocumentPanel({ process, onClose }: { process: typeof PROCESSES[0]; onClose: () => void }) {
  const [docs, setDocs] = useState<ProcessDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeDoc, setActiveDoc] = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await fetch(`/api/process-documents?processId=${process.id}`); setDocs(await r.json()); }
    catch { setDocs([]); }
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
        <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-sm">📄 Documents — {process.label}</h2>
            <p className="text-indigo-300 text-xs mt-0.5">{process.docs.length} required documents</p>
          </div>
          <button onClick={onClose} className="text-indigo-300 hover:text-white text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? <p className="text-center text-gray-400 text-sm py-6">Loading...</p> : null}
          {process.docs.map(doc => {
            const uploaded = Array.isArray(docs) ? docs.filter((d: ProcessDoc) => d.document_name === doc) : [];
            return (
              <div key={doc} className="border border-gray-100 rounded-xl p-3 hover:border-indigo-200 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-indigo-400 text-sm mt-0.5">📄</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{doc}</p>
                      {uploaded.length > 0 ? uploaded.map((u: ProcessDoc) => (
                        <div key={u.id} className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">✓ {u.file_name}</span>
                          <span className="text-xs text-gray-400">{u.uploaded_at?.slice(0, 10)}</span>
                          <button onClick={async () => { await fetch(`/api/process-documents?id=${u.id}`, { method: 'DELETE' }); load(); }}
                            className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </div>
                      )) : <p className="text-xs text-gray-400 mt-0.5">Not yet uploaded</p>}
                    </div>
                  </div>
                  <button onClick={() => { setActiveDoc(doc); fileRef.current?.click(); }}
                    className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-100 flex-shrink-0">
                    ↑ Upload
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file && activeDoc) handleUpload(activeDoc, file);
          e.target.value = '';
        }} />
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="w-full bg-indigo-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-800">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function QMSPage() {
  const [activeTab, setActiveTab] = useState('audit-plan');
  const [activityModal, setActivityModal] = useState<{ process: typeof PROCESSES[0]; preStep?: string } | null>(null);
  const [docPanel, setDocPanel] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filterMonth, setFilterMonth] = useState('');

  const active = PROCESSES.find(p => p.id === activeTab) || PROCESSES[0];

  // Freq summaries
  const freqCount = (f: string) => PROCESSES.filter(p => p.freq === f).length;

  const loadLogs = async (pid: string) => {
    try { const r = await fetch(`/api/activity-logs?processId=${pid}`); const d = await r.json(); setActivityLogs(Array.isArray(d) ? d : []); }
    catch { setActivityLogs([]); }
  };

  useEffect(() => { loadLogs(activeTab); }, [activeTab]);

  const deleteLog = async (id: number) => {
    await fetch(`/api/activity-logs?id=${id}`, { method: 'DELETE' });
    loadLogs(activeTab);
  };

  const months: string[] = [];
  const mDate = new Date();
  for (let i = 0; i < 12; i++) {
    months.push(`${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`);
    mDate.setMonth(mDate.getMonth() - 1);
  }
  const filteredLogs = filterMonth ? activityLogs.filter(l => l.log_date?.startsWith(filterMonth)) : activityLogs;

  const handleReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const now = new Date().toLocaleString('en-IN');
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const rows = activityLogs.map(l =>
      `<tr><td>${l.log_date}</td><td>${l.activity_step}</td><td>${l.owner || '—'}</td><td>${l.status}</td><td>${l.remarks || '—'}</td><td>${l.evidence || '—'}</td></tr>`
    ).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>QMS Report — ${active.label}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}.hdr{background:#312e81;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:20px}h1{color:#fff;font-size:17px;margin:0}p.sub{opacity:.8;font-size:11px;margin:4px 0 0}table{width:100%;border-collapse:collapse}th{background:#eef2ff;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase}td{padding:7px 10px;border-bottom:1px solid #f0f0f0}.btn{background:#312e81;color:#fff;padding:8px 20px;border:none;border-radius:6px;cursor:pointer;font-size:13px;margin-top:12px}@media print{.btn{display:none}}</style>
      </head><body>
      <div class="hdr"><h1>${active.icon} QMS — ${active.label}</h1><p class="sub">${month} &nbsp;|&nbsp; ${active.clause} &nbsp;|&nbsp; Generated: ${now}</p></div>
      <table><thead><tr><th>Date</th><th>Activity</th><th>Owner</th><th>Status</th><th>Remarks</th><th>Evidence</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#888;padding:16px">No activity logged yet.</td></tr>'}</tbody></table>
      <button class="btn" onclick="window.print()">🖨 Print / Save PDF</button></body></html>`);
    w.document.close();
  };

  return (
    <div className="min-h-full bg-gray-50">

      {/* HEADER */}
      <div className="bg-indigo-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs mb-1">
              <span>QMOS</span><span>›</span><span>Departments</span><span>›</span><span className="text-white">QMS</span>
            </div>
            <h1 className="text-xl font-bold">📋 QMS — Quality Management System</h1>
            <p className="text-indigo-300 text-xs mt-0.5">IATF 16949 · ISO 9001 · ISO 14001 · ISO 45001 · Management Review · Audits · Objectives · Risk</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActivityModal({ process: active })}
              className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition">
              + Log Activity
            </button>
            <button onClick={handleReport}
              className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-600 transition border border-indigo-600">
              📊 Report
            </button>
          </div>
        </div>

        {/* FREQ SUMMARY */}
        <div className="grid grid-cols-6 gap-2 mt-4">
          {[
            { label: 'Biweekly', value: freqCount('Biweekly'), color: 'bg-cyan-700' },
            { label: 'Monthly', value: freqCount('Monthly'), color: 'bg-green-700' },
            { label: 'Quarterly', value: freqCount('Quarterly'), color: 'bg-purple-700' },
            { label: 'Six Monthly', value: freqCount('Six Monthly'), color: 'bg-orange-700' },
            { label: 'Yearly', value: freqCount('Yearly'), color: 'bg-gray-600' },
            { label: 'Total Processes', value: PROCESSES.length, color: 'bg-indigo-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-lg px-3 py-2 bg-opacity-70`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-indigo-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-4 gap-0">
            {PROCESSES.map(p => (
              <button key={p.id} onClick={() => setActiveTab(p.id)}
                className={`flex flex-col items-start px-3 py-2.5 border-b-2 transition-all whitespace-nowrap text-left ${
                  activeTab === p.id ? 'border-indigo-800 text-indigo-900 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-xs font-semibold">{p.no}. {p.label}</span>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded border mt-1 font-medium ${FREQ_COLORS[p.freq]}`}>{p.freq}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 space-y-4">

        {/* Process Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-indigo-600">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{active.icon}</span>
                <span className="text-xs text-gray-400 font-mono">Process {active.no}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${FREQ_COLORS[active.freq]}`}>{active.freq}</span>
                {activityLogs.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
                    {activityLogs.length} logged
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{active.label}</h2>
              <p className="text-xs text-gray-500 mt-1">{active.clause}</p>
              <p className="text-sm text-gray-700 mt-2 max-w-3xl">{active.desc}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              <button onClick={() => setActivityModal({ process: active })}
                className="bg-indigo-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-800 transition">
                + Log Activity
              </button>
              <button onClick={() => setDocPanel(true)}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                📄 Documents
              </button>
              <button onClick={handleReport}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                📊 Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* WORKFLOW */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">📋 Activity Workflow — {active.freq}</h3>
            <div className="space-y-2">
              {active.activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition group">
                  <div className="w-6 h-6 rounded-full bg-indigo-900 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-gray-700 flex-1">{act}</p>
                  <button onClick={() => setActivityModal({ process: active, preStep: act })}
                    className="opacity-0 group-hover:opacity-100 text-xs text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-lg font-semibold flex-shrink-0 transition">
                    Log ›
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            {/* KPIs */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📊 Key KPIs</h3>
              <div className="space-y-2">
                {active.kpis.map((kpi, i) => {
                  const val = i === 0 ? activityLogs.length + ' logged' : i === 1 ? activityLogs.filter(l => l.status === 'Done').length + ' done' : '—';
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-700 font-medium">{kpi}</span>
                      <span className={`text-xs font-bold ${val !== '—' ? 'text-indigo-700' : 'text-gray-400'}`}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📄 Required Documents</h3>
              <div className="space-y-1.5">
                {active.docs.map((doc, i) => (
                  <div key={i} onClick={() => setDocPanel(true)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <span className="text-indigo-400 text-xs">📄</span>
                    <span className="text-xs text-gray-700 flex-1">{doc}</span>
                    <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100">Upload ›</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white rounded-xl p-4">
              <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wide mb-3">⚡ Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: `Log ${active.freq} activity`, action: () => setActivityModal({ process: active }) },
                  { label: `Upload ${active.docs[0]}`, action: () => setDocPanel(true) },
                  { label: 'Generate activity report', action: handleReport },
                  { label: 'View all logged entries', action: () => {} },
                ].map((s, i) => (
                  <button key={i} onClick={s.action}
                    className="w-full text-left text-xs text-indigo-100 hover:text-white bg-indigo-800 hover:bg-indigo-700 px-3 py-2 rounded-lg transition">
                    💡 {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVITY LOG TABLE */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-gray-800">Activity Log — {active.label}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{filteredLogs.length} entries</span>
            </div>
            <div className="flex gap-2">
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                <option value="">All Months</option>
                {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
              </select>
              <button onClick={() => setActivityModal({ process: active })}
                className="bg-indigo-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-800 transition">
                + Add Entry
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
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
                    <div className="text-4xl mb-3">{active.icon}</div>
                    <p className="text-gray-400 text-sm mb-3">No activity logged yet for this {active.freq} process.</p>
                    <button onClick={() => setActivityModal({ process: active })}
                      className="inline-flex items-center gap-2 bg-indigo-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800 transition">
                      {active.icon} Log First Entry →
                    </button>
                  </td>
                </tr>
              ) : filteredLogs.map((log, idx) => (
                <tr key={log.id} className={`hover:bg-indigo-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{log.log_date || '—'}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-800 max-w-[200px]">{log.activity_step}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.owner || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-600'}`}>{log.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-indigo-700 max-w-[140px] truncate">{log.evidence || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px]"><span className="line-clamp-2">{log.remarks || '—'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteLog(log.id)}
                      className="text-red-400 hover:text-red-600 text-xs hover:bg-red-50 px-2 py-1 rounded transition">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {activityModal && (
        <ActivityLogModal process={activityModal.process} preStep={activityModal.preStep}
          onClose={() => setActivityModal(null)}
          onSuccess={() => { setActivityModal(null); loadLogs(activeTab); }} />
      )}
      {docPanel && <DocumentPanel process={active} onClose={() => setDocPanel(false)} />}
    </div>
  );
}
