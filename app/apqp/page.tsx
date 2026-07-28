'use client';
import DepartmentPageTemplate, { DeptConfig, ProcessDef } from '../components/DepartmentPageTemplate';

const dept: DeptConfig = {
  id: 'apqp',
  label: 'Development Quality',
  icon: '🚀',
  subtitle: 'Development parts inspection, APQP process, FG seat layout, test reports',
  headerBg: 'bg-blue-900',
  headerText: 'text-blue-300',
  accentBorder: 'border-blue-500',
  accentBg: 'bg-blue-50',
  accentText: 'text-blue-900',
  btnBg: 'bg-blue-800',
  tabActive: 'border-blue-700 text-blue-900 bg-blue-50',
};

const processes: ProcessDef[] = [
  {
    id: 'dev-parts-inspection', no: '01', label: 'Development Parts Inspection', freq: 'Monthly',
    icon: '🔍', clause: 'AIAG APQP Phase 4 / Part Validation',
    desc: 'Monthly inspection of all development and prototype parts — dimensional, visual, functional check against drawing and customer requirement.',
    activities: ['Receive development / prototype parts from engineering or supplier', 'Review drawing, specification, and customer requirement before inspection', 'Perform 100% dimensional inspection against ballooned drawing', 'Check visual appearance: surface, colour, texture, defects', 'Conduct functional check: fit, form, and function verification', 'Prepare development inspection report and share with engineering and customer'],
    docs: ['Development Parts Inspection Report', 'Ballooned Drawing', 'Customer Requirement Sheet', 'Prototype Inspection Register'],
    kpis: ['Development Parts Inspected', 'Dimensional Deviations Found', 'Parts Approved / Rejected'],
  },
  {
    id: 'product-change-apqp', no: '02', label: 'Product Change / APQP Process', freq: 'Monthly',
    icon: '📐', clause: 'AIAG APQP / IATF 8.3 / Change Management',
    desc: 'Monthly review of all active APQP projects and product change requests — gate status, open actions, PPAP timeline, and customer approval.',
    activities: ['Compile list of all active APQP projects and product changes', 'Review APQP phase gate status for each project (Phase 1–5)', 'Check open actions from previous gate review and update status', 'Identify PPAP submission timeline and risks', 'Conduct monthly APQP cross-functional review meeting', 'Prepare gate review report and circulate MOM within 3 days'],
    docs: ['APQP Project Tracker', 'Gate Review Checklist (Per Phase)', 'APQP MOM', 'PPAP Submission Timeline', 'Open Action Register'],
    kpis: ['Active APQP Projects', 'Projects On Schedule %', 'Gate Review Actions Closed %'],
  },
  {
    id: 'fg-seat-layout', no: '03', label: 'FG Seat Layout', freq: 'Monthly',
    icon: '🪑', clause: 'IATF 8.3 / Layout Inspection',
    desc: 'Monthly full dimensional layout inspection of finished goods (FG) seat — all drawing balloon dimensions verified against tolerance for development and production models.',
    activities: ['Select FG seat model for monthly layout (new development priority, then rotation)', 'Perform 100% dimensional check on all ballooned dimensions per drawing', 'Check key functional parameters: frame geometry, foam hardness, cover pull force', 'Record all results in layout inspection report (pass / fail per dimension)', 'Flag out-of-tolerance dimensions for immediate engineering action', 'File signed layout report and share with customer if required for PPAP'],
    docs: ['FG Seat Layout Inspection Report', 'Ballooned Drawing (Latest Rev)', 'Layout Inspection Tracker', 'Customer Submission Copy (if PPAP)'],
    kpis: ['Layout Inspections Completed', 'Dimensions Out of Tolerance', 'Layouts Submitted to Customer'],
  },
  {
    id: 'test-report', no: '04', label: 'Test Report', freq: 'Monthly',
    icon: '🧪', clause: 'IATF 8.3 / Design Validation / Test Reports',
    desc: 'Monthly review and tracking of all product test reports — durability, performance, material, and regulatory tests for development and production parts.',
    activities: ['Compile list of all tests due this month (new parts, annual, change-triggered)', 'Submit samples to internal or external lab for testing', 'Follow up with lab for test report within agreed timeline', 'Review test report: all parameters within specification?', 'Raise corrective action if any test fails — notify engineering and customer', 'File test report in product dossier and update test report tracker'],
    docs: ['Test Report Tracker', 'Test Request Form', 'Lab Test Reports (Internal / External)', 'Test Failure Corrective Action Log'],
    kpis: ['Tests Due This Month', 'Test Reports Received', 'Test Failures Requiring Action'],
  },
];

export default function APQPPage() {
  return <DepartmentPageTemplate dept={dept} processes={processes} />;
}
