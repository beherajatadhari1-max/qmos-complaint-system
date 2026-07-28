'use client';
import DepartmentPageTemplate, { DeptConfig, ProcessDef } from '../components/DepartmentPageTemplate';

const dept: DeptConfig = {
  id: 'tqm',
  label: 'TQM / TBEM',
  icon: '🏆',
  subtitle: 'Total Quality Management, Business Excellence, Kaizen, QCC, Green Belt, TBEM, Awards',
  headerBg: 'bg-yellow-700',
  headerText: 'text-yellow-200',
  accentBorder: 'border-yellow-500',
  accentBg: 'bg-yellow-50',
  accentText: 'text-yellow-900',
  btnBg: 'bg-yellow-600',
  tabActive: 'border-yellow-600 text-yellow-900 bg-yellow-50',
};

const processes: ProcessDef[] = [
  {
    id: 'tei-sheet', no: '01', label: 'TEI Sheet', freq: 'Weekly',
    icon: '📊', clause: 'TQM / Total Employee Involvement',
    desc: 'Weekly tracking of Total Employee Involvement (TEI) sheet — participation in Kaizen, QCC, suggestions, and improvement activities per employee.',
    activities: ['Collect TEI data from all departments for the week', 'Update TEI sheet: Kaizens submitted, QCC participation, suggestions, attendance in TQM activities', 'Calculate TEI score per employee and per department', 'Identify departments with low TEI score for engagement action', 'Recognize top TEI contributors in weekly team meeting', 'Share weekly TEI summary with department heads and management'],
    docs: ['TEI Sheet (Weekly)', 'Department-wise TEI Summary', 'TEI Trend Chart', 'Employee Recognition Record'],
    kpis: ['TEI Score (Plant Average)', 'Departments Below TEI Target', 'Employee Participation Rate %'],
  },
  {
    id: 'qcc', no: '02', label: 'QCC — Quality Control Circles', freq: 'Weekly',
    icon: '⭕', clause: 'TQM / QCC Activity',
    desc: 'Weekly tracking of all active Quality Control Circles — meeting frequency, PDCA progress, and problem-solving status.',
    activities: ['Verify all active QCCs held their weekly meeting', 'Check QCC register: attendance, minutes, PDCA stage update', 'Review each QCC theme: problem statement, target, data collected', 'Identify QCCs stuck in Plan stage — provide coaching', 'Track QCC presentations scheduled for convention', 'Update weekly QCC status board and report to TQM coordinator'],
    docs: ['QCC Register (All Circles)', 'Weekly Meeting Minutes', 'QCC PDCA Progress Chart', 'QCC Status Board'],
    kpis: ['Active QCCs', 'QCCs Meeting Weekly Target', 'QCCs Presenting This Month'],
  },
  {
    id: 'qc-story', no: '03', label: 'QC Story', freq: 'Weekly',
    icon: '📖', clause: 'TQM / Problem Solving',
    desc: 'Weekly review and preparation of QC Story reports — structured problem-solving documentation using QC story format (10 steps).',
    activities: ['Review QC Stories in progress across all QCC teams', 'Check completeness of each step: theme selection, current status, target, analysis, countermeasure, results, standardization', 'Provide coaching on weak sections (cause analysis, data presentation)', 'Review QC Stories being prepared for external competition / TBEM', 'Finalize and sign off completed QC Stories', 'File completed QC Stories and update QC Story register'],
    docs: ['QC Story Template (10-Step Format)', 'QC Story Register', 'QC Story Review Checklist', 'Completed QC Story File'],
    kpis: ['QC Stories In Progress', 'QC Stories Completed This Month', 'QC Stories Ready for Convention'],
  },
  {
    id: 'kaizen', no: '04', label: 'Kaizen', freq: 'Weekly',
    icon: '💡', clause: 'TQM / Kaizen — Continual Improvement',
    desc: 'Weekly tracking of Kaizen submissions, implementation, and savings — ensure minimum target Kaizens per person per month.',
    activities: ['Collect Kaizen idea forms submitted this week', 'Review each Kaizen: before situation, idea, action taken, result', 'Classify Kaizen: Quality / Safety / Productivity / Cost / Morale / Delivery', 'Calculate savings: time saved, material saved, defect reduction', 'Recognize top Kaizen contributor in weekly meeting', 'Update Kaizen register and cumulative savings tracker'],
    docs: ['Kaizen Idea Form', 'Kaizen Register (Weekly)', 'Savings Calculation Sheet', 'Monthly Kaizen Summary'],
    kpis: ['Kaizens Submitted This Week', 'Kaizens Implemented', 'Cumulative Savings (INR / Hours)'],
  },
  {
    id: 'green-belt', no: '05', label: 'Green Belt Project', freq: 'Monthly',
    icon: '🥋', clause: 'TQM / Six Sigma — Green Belt',
    desc: 'Monthly review of all active and completed Green Belt (Six Sigma) projects — DMAIC stage, savings, and project health.',
    activities: ['Review all active Green Belt projects for DMAIC stage status', 'Check Define: problem statement, project charter, CTQ defined', 'Review Measure: baseline data, Sigma level calculated', 'Review Analyze: root causes identified, validated with data', 'Review Improve: solutions implemented and results measured', 'Review Control: control plan updated, savings documented and certified'],
    docs: ['Green Belt Project Charter', 'DMAIC Stage Gate Report', 'Project Savings Certification', 'Green Belt Project Tracker'],
    kpis: ['Active Green Belt Projects', 'Projects On Schedule %', 'Certified Savings This Month (INR)'],
  },
  {
    id: 'tbem', no: '06', label: 'TBEM', freq: 'Monthly',
    icon: '🏅', clause: 'TBEM / Tata Business Excellence Model',
    desc: 'Monthly progress tracking of TBEM (Tata Business Excellence Model) self-assessment — evidence collection, scoring, and improvement themes.',
    activities: ['Review TBEM self-assessment progress across all 7 categories', 'Collect evidence for categories: Leadership, Strategy, Customers, Measurement, Workforce, Operations, Results', 'Score each criteria using ADLI framework (Approach, Deployment, Learning, Integration)', 'Identify weak categories and assign improvement actions', 'Update TBEM score summary and gap analysis', 'Prepare monthly TBEM progress report for management review'],
    docs: ['TBEM Self-Assessment Workbook', 'TBEM Evidence File (Per Category)', 'TBEM Score Summary', 'TBEM Improvement Action Plan'],
    kpis: ['TBEM Categories with Evidence Updated', 'TBEM Score (Current Estimate)', 'Open Improvement Actions from TBEM'],
  },
  {
    id: 'external-awards', no: '07', label: 'External Awards Participation', freq: 'Monthly',
    icon: '🌟', clause: 'TQM / External Recognition',
    desc: 'Monthly tracking of participation in external quality awards — QCC conventions, Kaizen competitions, TBEM, CII, IMC, and other industry awards.',
    activities: ['Identify external awards / conventions scheduled this month', 'Select QCC teams, Kaizen projects, or Green Belt projects for submission', 'Prepare award application / presentation material', 'Coach teams on presentation skills and Q&A preparation', 'Submit entries by deadline and track scores / results', 'Share award results with management and recognize winning teams'],
    docs: ['External Awards Calendar', 'Award Application / Entry Form', 'Presentation Material', 'Award Certificate / Result Sheet'],
    kpis: ['Awards / Conventions Participated', 'Awards Won This Month', 'Teams Presented Externally'],
  },
  {
    id: 'tml-dwm', no: '08', label: 'TML DWM', freq: 'Monthly',
    icon: '📅', clause: 'TML / Daily Work Management',
    desc: 'Monthly TML (Tata Motors Limited) Daily Work Management review — adherence to DWM system, KPI tracking, and DWM audit compliance.',
    activities: ['Review DWM board adherence for all departments (daily discipline)', 'Audit DWM boards: KPIs updated daily, actions logged, issues escalated', 'Compile monthly DWM score per department', 'Identify departments with DWM gaps and coach HODs', 'Prepare TML DWM monthly report for TML submission', 'Track TML DWM audit findings and close within agreed timelines'],
    docs: ['TML DWM Format / Template', 'DWM Monthly Adherence Report', 'DWM Audit Checklist', 'TML Submission Evidence'],
    kpis: ['DWM Adherence Score (Plant %)', 'Departments Below DWM Target', 'TML DWM Audit Findings Open'],
  },
];

export default function TQMPage() {
  return <DepartmentPageTemplate dept={dept} processes={processes} />;
}
