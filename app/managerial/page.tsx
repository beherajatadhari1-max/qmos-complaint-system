'use client';
import DepartmentPageTemplate, { DeptConfig, ProcessDef } from '../components/DepartmentPageTemplate';

const dept: DeptConfig = {
  id: 'managerial',
  label: 'Managerial',
  icon: '👨‍💼',
  subtitle: 'Manpower planning, skill assessment, training, DL targets, cost saving, quality ticks',
  headerBg: 'bg-blue-950',
  headerText: 'text-blue-300',
  accentBorder: 'border-blue-800',
  accentBg: 'bg-blue-50',
  accentText: 'text-blue-900',
  btnBg: 'bg-blue-800',
  tabActive: 'border-blue-800 text-blue-900 bg-blue-50',
};

const processes: ProcessDef[] = [
  {
    id: 'manpower-skill-assessment', no: '01', label: 'Manpower Skill Assessment', freq: 'Monthly',
    icon: '🎯', clause: 'IATF 7.2 / Competence Assessment',
    desc: 'Monthly skill assessment of all QA team members — evaluate technical and behavioural competencies against required skill level.',
    activities: ['List all QA team members and their current skill ratings', 'Assess each member on: technical skills, quality tools, audit skills, communication, leadership', 'Score using defined rating scale (1=Beginner to 4=Expert)', 'Identify members with gap (actual < required rating)', 'Document assessment results in skill matrix', 'Obtain quality head sign-off on updated skill matrix'],
    docs: ['QA Team Skill Matrix', 'Competency Assessment Form', 'Skill Gap Summary', 'Skill Matrix Sign-off Sheet'],
    kpis: ['Team Members Assessed', 'Skill Gaps Identified', 'Members at Required Competency Level %'],
  },
  {
    id: 'dev-upgradation-planning', no: '02', label: 'Development / Upgradation Planning', freq: 'Monthly',
    icon: '📈', clause: 'IATF 7.2 / Development Planning',
    desc: 'Monthly planning for team development and skill upgradation — identify learning opportunities, certifications, cross-training, and career growth plans.',
    activities: ['Review skill gaps from monthly skill assessment', 'Identify development path for each team member (training, certification, cross-posting)', 'Plan certifications: IATF LA, Six Sigma, VDA, AIAG tools', 'Assign on-job development tasks to build practical skills', 'Track development plan implementation vs timeline', 'Review development effectiveness in next month assessment'],
    docs: ['Individual Development Plan (IDP)', 'Certification Tracker', 'Cross-Training Schedule', 'Development Effectiveness Review'],
    kpis: ['IDPs Created / Updated', 'Certifications Planned This Month', 'Development Actions In Progress'],
  },
  {
    id: 'training-to-team', no: '03', label: 'Training to Team', freq: 'Monthly',
    icon: '📚', clause: 'IATF 7.2 / Training & Awareness',
    desc: 'Monthly planning and delivery of training to QA team — quality tools, IATF clauses, customer-specific requirements, and new process updates.',
    activities: ['Prepare monthly training calendar for QA team', 'Identify training topics: quality tools (8D, FMEA, SPC, MSA), IATF awareness, customer requirements', 'Conduct training sessions (classroom, on-job, e-learning)', 'Record attendance and administer post-training assessment', 'Evaluate training effectiveness: test score ≥ 80% pass criteria', 'Update training records for each team member in skill matrix'],
    docs: ['Monthly Training Calendar', 'Training Attendance Register', 'Training Material / Presentation', 'Post-Training Assessment Sheet', 'Training Effectiveness Record'],
    kpis: ['Training Sessions Conducted', 'Team Training Completion %', 'Average Post-Training Score'],
  },
  {
    id: 'quality-manpower-planning', no: '04', label: 'Quality Manpower Planning', freq: 'Monthly',
    icon: '👥', clause: 'IATF 7.1.2 / People Resources',
    desc: 'Monthly review of quality manpower deployment — headcount vs requirement, shift coverage, vacancy status, and manpower gap action plan.',
    activities: ['Review current QA headcount: actual vs sanctioned strength', 'Check shift-wise QA coverage for all production lines and EOL', 'Identify manpower gaps: vacancies, long leave, attrition', 'Plan interim coverage for gaps (cross-shift, cross-functional)', 'Raise manpower requisition for critical vacancies', 'Present monthly manpower status to plant head / HR'],
    docs: ['QA Manpower Plan (Monthly)', 'Shift Coverage Schedule', 'Vacancy Status Sheet', 'Manpower Requisition Form'],
    kpis: ['QA Actual vs Sanctioned Strength', 'Lines Without QA Coverage', 'Vacancies Pending Filling'],
  },
  {
    id: 'dl-target-qa-team', no: '05', label: 'DL with Target — QA Team', freq: 'Monthly',
    icon: '🎯', clause: 'IATF 9.1 / Performance Targets',
    desc: 'Monthly deployment of Departmental Level (DL) targets to each QA team member — individual KPI targets aligned to plant quality objectives.',
    activities: ['Cascade plant quality objectives to department-level KPIs', 'Assign individual DL targets to each QA team member', 'Communicate targets clearly with measurement method and timeline', 'Review mid-month progress vs DL targets', 'Conduct month-end review: actual vs target per person', 'Recognize achievers and initiate support plan for those missing targets'],
    docs: ['QA Team DL Target Sheet', 'Individual KPI Target Card', 'Mid-Month Review Record', 'Month-End Scorecard'],
    kpis: ['Team Members with Assigned DL Targets', 'DL Target Achievement % (Team Avg)', 'Members Achieving All Targets'],
  },
  {
    id: 'cost-saving-vave', no: '06', label: 'Cost Saving Idea / VAVE Projects', freq: 'Monthly',
    icon: '💰', clause: 'IATF 10.3 / Cost Reduction',
    desc: 'Monthly tracking of cost saving ideas and VAVE (Value Analysis / Value Engineering) projects from the QA team — idea pipeline, implementation, and certified savings.',
    activities: ['Collect cost saving ideas from QA team for the month', 'Review each idea: type (material, process, energy, waste), estimated saving, feasibility', 'Prioritize and approve top ideas for implementation', 'Implement approved ideas with cross-functional support', 'Calculate and certify actual savings after implementation', 'Present monthly cost saving summary and cumulative VAVE savings to management'],
    docs: ['Cost Saving Idea Register', 'VAVE Project Tracker', 'Savings Certification Sheet', 'Monthly Cost Saving Summary'],
    kpis: ['Ideas Submitted This Month', 'Ideas Implemented', 'Certified Savings (INR)'],
  },
  {
    id: 'employee-engagement', no: '07', label: 'Involvement in All Employee Engagement', freq: 'Monthly',
    icon: '🤝', clause: 'TQM / Employee Involvement',
    desc: 'Monthly tracking of QA team participation in all employee engagement activities — cultural events, safety drives, suggestion schemes, sports, and social initiatives.',
    activities: ['List all employee engagement activities planned for the month', 'Ensure QA team participates in: Kaizen, QCC, suggestion scheme, safety drive, 5S activity', 'Track individual participation in each engagement activity', 'Calculate QA team engagement index for the month', 'Recognize most engaged QA team member', 'Report QA engagement score to HR and plant head'],
    docs: ['Employee Engagement Activity Calendar', 'QA Team Participation Register', 'Engagement Index Report', 'Recognition Record'],
    kpis: ['Engagement Activities Participated', 'QA Team Engagement Index %', 'Suggestions Submitted by QA Team'],
  },
  {
    id: 'quality-ticks-review', no: '08', label: 'Quality Ticks Review', freq: 'Monthly',
    icon: '✅', clause: 'TML / Quality Ticks',
    desc: 'Monthly review of Quality Ticks score — TML Quality Ticks framework assessment covering all quality system parameters and customer quality performance.',
    activities: ['Pull current Quality Ticks score from TML portal / customer system', 'Review each Quality Tick parameter: score, target, gap', 'Identify parameters with red or yellow status', 'Assign corrective actions for below-target ticks', 'Prepare Quality Ticks improvement plan with owner and due date', 'Present Quality Ticks monthly status to plant head and management'],
    docs: ['Quality Ticks Score Sheet (Monthly)', 'Parameter-wise Gap Analysis', 'Quality Ticks Improvement Plan', 'TML Submission Evidence'],
    kpis: ['Overall Quality Ticks Score', 'Parameters in Red / Yellow', 'Quality Ticks Improvement Actions Open'],
  },
];

export default function ManagerialPage() {
  return <DepartmentPageTemplate dept={dept} processes={processes} />;
}
