'use client';
import DepartmentPageTemplate, { DeptConfig, ProcessDef } from '../components/DepartmentPageTemplate';

const dept: DeptConfig = {
  id: 'incoming-quality',
  label: 'Incoming Quality (IQC)',
  icon: '📥',
  subtitle: 'Incoming inspection, GRN quality checks, supplier rejection tracking, first-piece approval',
  headerBg: 'bg-teal-800',
  headerText: 'text-teal-300',
  accentBorder: 'border-teal-500',
  accentBg: 'bg-teal-50',
  accentText: 'text-teal-900',
  btnBg: 'bg-teal-700',
  tabActive: 'border-teal-700 text-teal-900 bg-teal-50',
};

const processes: ProcessDef[] = [
  {
    id: 'child-part-drawing', no: '00', label: 'Child Part Drawing', freq: 'Monthly',
    icon: '📐', clause: 'IATF 7.5 / Drawing Control',
    desc: 'Monthly review and update of child part drawings used for incoming inspection — ensure latest revision is available at IQC.',
    activities: ['Pull list of all incoming parts with drawing numbers', 'Verify current drawing revision at IQC vs engineering master', 'Update obsolete drawings with latest revision', 'Highlight drawing changes to IQC inspectors', 'File hard copy and soft copy at IQC station', 'Update drawing master register with revision dates'],
    docs: ['Child Part Drawing Register', 'Drawing Master List', 'Drawing Revision History', 'IQC Drawing Control Log'],
    kpis: ['Drawings Reviewed', 'Out-of-date Drawings Found', 'Drawing Update Completion %'],
  },
  {
    id: 'dol-ndol', no: '01', label: 'DOL / NDOL List', freq: 'Monthly',
    icon: '📋', clause: 'IATF 8.4 / Supplier Classification',
    desc: 'Monthly review and update of DOL (Delegation Of Liability) and NDOL (Non-Delegation Of Liability) supplier / part list.',
    activities: ['Review all incoming parts for DOL / NDOL classification', 'Verify DOL parts have valid supplier quality approval', 'Update NDOL parts requiring plant inspection', 'Cross-check with customer-specified DOL requirements', 'Communicate DOL/NDOL changes to IQC team', 'Update DOL/NDOL register and archive previous version'],
    docs: ['DOL List (Customer-approved)', 'NDOL List', 'DOL/NDOL Change Log', 'Customer Approval Reference'],
    kpis: ['DOL Parts Count', 'NDOL Parts Requiring Inspection', 'DOL Review Completion'],
  },
  {
    id: 'incoming-materials-list', no: '02', label: 'List of Incoming Materials', freq: 'Monthly',
    icon: '📦', clause: 'IATF 8.4 / Material Identification',
    desc: 'Monthly update of the master list of all incoming materials — part nos., suppliers, inspection type, and AQL.',
    activities: ['Compile complete list of incoming materials from ERP / BOM', 'Assign inspection type per part (visual / dimensional / chemical)', 'Set AQL sampling plan for each material category', 'Mark critical and safety characteristics in the list', 'Distribute updated list to IQC inspectors and stores', 'Archive previous version and log change history'],
    docs: ['Incoming Material Master List', 'AQL Sampling Plan', 'Material Inspection Type Matrix', 'BOM Reference'],
    kpis: ['Total Incoming Materials Listed', 'Materials with AQL Assigned', 'List Update Completion Date'],
  },
  {
    id: 'layout-inspection', no: '03', label: 'Incoming Parts Layout Inspection', freq: 'Monthly',
    icon: '📏', clause: 'IATF 8.4 / Layout Inspection',
    desc: 'Monthly layout inspection of incoming parts — 100% dimensional check against drawing for periodic revalidation.',
    activities: ['Select parts due for monthly layout inspection (rotation list)', 'Perform 100% dimensional inspection per drawing', 'Record all balloon dimensions in layout report', 'Compare results with drawing tolerances — note deviations', 'Send layout report to supplier for deviations found', 'Update layout inspection tracker and file reports'],
    docs: ['Layout Inspection Report (per part)', 'Ballooned Drawing', 'Layout Inspection Tracker', 'Supplier Deviation Communication'],
    kpis: ['Layout Inspections Completed', 'Parts with Deviations Found', 'Supplier Communication Rate'],
  },
  {
    id: 'appearance-manual', no: '04', label: 'Incoming Appearance Manual', freq: 'Monthly',
    icon: '🎨', clause: 'IATF 8.4 / Appearance Criteria',
    desc: 'Monthly review and update of incoming appearance inspection manual — visual standards, limit samples, defect photos.',
    activities: ['Review appearance manual for all visual-inspection parts', 'Update defect definitions and photographs if new defects found', 'Replace worn or damaged limit samples at IQC station', 'Brief IQC team on updated appearance criteria', 'Obtain sign-off on appearance manual from quality head', 'Archive previous version with effective date'],
    docs: ['Incoming Appearance Inspection Manual', 'Defect Photo Catalogue', 'Limit Sample Log', 'Manual Revision Register'],
    kpis: ['Appearance Manuals Reviewed', 'Defect Photos Updated', 'Limit Samples Replaced'],
  },
  {
    id: 'fixture-validation', no: '05', label: 'Incoming Fixture Validation Reports', freq: 'Quarterly',
    icon: '🔩', clause: 'IATF 7.1.5 / Equipment Validation',
    desc: 'Quarterly validation of all incoming inspection fixtures and checking gauges — confirm accuracy and fitness for use.',
    activities: ['List all IQC fixtures and checking gauges in master list', 'Perform dimensional validation on each fixture', 'Compare fixture dimensions with master drawing / standard', 'Document validation results in fixture validation report', 'Tag passed fixtures (Green) and flag failed (Red — withdraw)', 'Update fixture master list with next validation due date'],
    docs: ['Fixture Validation Report', 'Fixture Master List', 'Validation Standard / Drawing', 'Fixture Calibration Certificate'],
    kpis: ['Fixtures Validated This Quarter', 'Fixtures Failed Validation', 'Fixtures Overdue for Validation'],
  },
  {
    id: 'supplier-inward-data', no: '06', label: 'Supplier Inward Data', freq: 'Monthly',
    icon: '📊', clause: 'IATF 8.4 / Supplier Monitoring',
    desc: 'Monthly compilation and analysis of supplier inward data — GRN count, lots received, rejection rate, PPM per supplier.',
    activities: ['Extract GRN data from ERP for the month', 'Compile inward quantities by supplier and part number', 'Calculate lot rejection rate and PPM per supplier', 'Identify suppliers with highest rejection percentage', 'Prepare monthly inward summary report', 'Share with supplier quality for SCAR / scorecard action'],
    docs: ['Monthly Inward Data Report', 'Supplier-wise Rejection Summary', 'GRN Extract (ERP)', 'PPM Calculation Sheet'],
    kpis: ['Total Lots Received', 'Monthly Rejection Rate %', 'Suppliers with Rejection > Target'],
  },
  {
    id: 'check-sheet', no: '07', label: 'Incoming Check Sheet & Adherence', freq: 'Monthly',
    icon: '☑️', clause: 'IATF 8.5.1 / Inspection Adherence',
    desc: 'Monthly review of incoming inspection check sheets — ensure all inspectors are using correct, updated check sheets and following them.',
    activities: ['Pull list of all active incoming inspection check sheets', 'Verify check sheet revision matches current drawing / control plan', 'Spot-check 5 filled check sheets per inspector for completeness', 'Identify gaps: skipped checks, missing signatures, wrong revision', 'Conduct refresher briefing for non-adherence found', 'Update check sheets if process or drawing changed; re-distribute'],
    docs: ['Incoming Inspection Check Sheets (all parts)', 'Check Sheet Adherence Audit Record', 'Inspector Briefing Register', 'Check Sheet Revision Log'],
    kpis: ['Check Sheets Reviewed', 'Adherence Audit Score %', 'Check Sheets Updated This Month'],
  },
  {
    id: 'control-plan', no: '08', label: 'Incoming Control Plan / Quality Plan', freq: 'Monthly',
    icon: '📋', clause: 'IATF 8.5 / Control Plan',
    desc: 'Monthly review and update of the incoming inspection control plan and quality plan — characteristics, frequency, gauge, AQL.',
    activities: ['Review all incoming control plans for latest revision', 'Cross-check characteristics with current drawings', 'Update frequency and AQL if rejection trend warrants', 'Verify gauge/method in control plan is available at IQC', 'Update control plan and obtain quality head sign-off', 'Distribute revised control plan to IQC team and file'],
    docs: ['Incoming Control Plan (per part)', 'Drawing-Control Plan Correlation Sheet', 'Gauge Availability Checklist', 'Control Plan Approval Sign-off'],
    kpis: ['Control Plans Reviewed', 'Out-of-date Control Plans Found', 'Control Plans Updated & Signed'],
  },
  {
    id: 'skill-matrix', no: '09', label: 'Incoming Skill Matrix', freq: 'Monthly',
    icon: '👥', clause: 'IATF 7.2 / Competence',
    desc: 'Monthly review of IQC inspector skill matrix — identify gaps, plan training, update competency ratings.',
    activities: ['Review skill matrix for all IQC inspectors', 'Assess each inspector on: visual inspection, dimensional measurement, gauge use, AQL sampling, reporting', 'Identify competency gaps (rating < required level)', 'Plan training / on-job coaching for gaps identified', 'Conduct training and update skill matrix post-training', 'Obtain quality head signature on updated skill matrix'],
    docs: ['IQC Skill Matrix', 'Competency Assessment Form', 'Training Plan (IQC)', 'Training Attendance Register'],
    kpis: ['Inspectors Assessed This Month', 'Skill Gaps Identified', 'Training Completion %'],
  },
  {
    id: 'quarantine-data', no: '10', label: 'Quarantine Data & Disposal', freq: 'Weekly',
    icon: '🚫', clause: 'IATF 8.7 / NC Material',
    desc: 'Weekly management of quarantine area — review all on-hold materials, assign disposition (reject/rework/use-as-is), and close.',
    activities: ['Review all materials currently in quarantine area', 'Check hold age — flag items pending > 5 days', 'Assign disposition for each hold item (return/rework/UAI/scrap)', 'Execute disposition: arrange return / rework / scrap as decided', 'Update quarantine register with disposition and closure date', 'Report weekly quarantine status to quality head and SCM'],
    docs: ['Quarantine Register', 'Disposition Form (per lot)', 'Supplier Return Note', 'Scrap / Destruction Record'],
    kpis: ['Items in Quarantine (Open)', 'Items Closed This Week', 'Average Quarantine Hold Days'],
  },
];

export default function IncomingQualityPage() {
  return <DepartmentPageTemplate dept={dept} processes={processes} />;
}
