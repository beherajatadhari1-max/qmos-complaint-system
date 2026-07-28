'use client';
import DepartmentPageTemplate, { DeptConfig, ProcessDef } from '../components/DepartmentPageTemplate';

const dept: DeptConfig = {
  id: 'manufacturing',
  label: 'Manufacturing Excellence',
  icon: '🏗️',
  subtitle: 'PFD, PFMEA, SOP/ODS, process changes, rework PFMEA, plant layout',
  headerBg: 'bg-slate-700',
  headerText: 'text-slate-300',
  accentBorder: 'border-slate-500',
  accentBg: 'bg-slate-50',
  accentText: 'text-slate-900',
  btnBg: 'bg-slate-600',
  tabActive: 'border-slate-600 text-slate-900 bg-slate-50',
};

const processes: ProcessDef[] = [
  {
    id: 'pfd', no: '01', label: 'PFD — Process Flow Diagram', freq: 'Monthly',
    icon: '🔄', clause: 'AIAG APQP / IATF 8.3 / PFD',
    desc: 'Monthly review and update of Process Flow Diagrams for all products — ensure flow reflects current production sequence, operations, and checkpoints.',
    activities: ['Pull current PFD for all active product models', 'Walk the shop floor and compare actual production flow vs PFD', 'Update PFD if any operation sequence, machine, or checkpoint changed', 'Cross-check PFD with PFMEA and Control Plan for alignment', 'Obtain engineering and quality head sign-off on updated PFD', 'File revised PFD with new revision number and distribute to relevant teams'],
    docs: ['Process Flow Diagram (Per Model / Product)', 'PFD Revision Register', 'PFD–PFMEA–Control Plan Alignment Check', 'Sign-off Sheet'],
    kpis: ['PFDs Reviewed This Month', 'PFDs Updated', 'PFD–PFMEA Alignment Issues Found'],
  },
  {
    id: 'inprocess-pfmea', no: '02', label: 'Inprocess PFMEA', freq: 'Monthly',
    icon: '⚠️', clause: 'AIAG-VDA FMEA 1st Ed. / Process FMEA',
    desc: 'Monthly review and update of In-process PFMEA — incorporate new failure modes from production, customer complaints, and audit findings.',
    activities: ['Review PFMEA for all active production processes', 'Update PFMEA with new failure modes from red bin, IPPM, customer concerns', 'Re-evaluate Severity, Occurrence, and Detection ratings', 'Identify high AP (Action Priority) items and assign corrective actions', 'Track action plan to completion with owner and due date', 'Reissue updated PFMEA with revision history and cross-functional sign-off'],
    docs: ['In-process PFMEA (AIAG-VDA Format)', 'Action Priority (AP) Tracker', 'Failure Mode Update Log', 'PFMEA Revision Register'],
    kpis: ['PFMEAs Reviewed This Month', 'High AP Actions Open', 'Actions Closed vs Total Open %'],
  },
  {
    id: 'process-change-trials', no: '03', label: 'Process Change and Trial Results', freq: 'Monthly',
    icon: '🧪', clause: 'IATF 8.5.6 / Process Change Control',
    desc: 'Monthly review of all process changes initiated — change requests, trial runs, validation results, and approval status.',
    activities: ['Compile all process change requests raised this month', 'Review change description, reason, affected processes, and parts', 'Conduct trial run with changed process on limited lot', 'Inspect trial output: dimensional, visual, functional check', 'Document trial results: pass / fail with data evidence', 'Approve or reject process change; update PFMEA and Control Plan if approved'],
    docs: ['Process Change Request Form', 'Trial Run Report', 'Trial Inspection Results', 'Process Change Approval Record', 'Updated PFMEA / Control Plan'],
    kpis: ['Process Changes Initiated', 'Trial Runs Completed', 'Process Changes Approved This Month'],
  },
  {
    id: 'sop-ods', no: '04', label: 'SOP / ODS', freq: 'Monthly',
    icon: '📄', clause: 'IATF 8.5.1 / Work Instructions',
    desc: 'Monthly review and update of all Standard Operating Procedures (SOPs) and Operation Defect Standards (ODS) at all workstations.',
    activities: ['List all SOPs and ODS documents in use across all lines', 'Review each SOP for accuracy vs current process method and sequence', 'Update ODS if new defect type or revised acceptance criteria identified', 'Replace outdated SOPs / ODS at workstation with revised version', 'Conduct operator briefing on any updated SOP or ODS', 'Obtain sign-off and update document revision register'],
    docs: ['SOP Master Register', 'ODS Master Register', 'SOP / ODS Revision Log', 'Operator Briefing Attendance Record'],
    kpis: ['SOPs Reviewed This Month', 'ODS Updated', 'Operators Briefed on Changes'],
  },
  {
    id: 'rework-pfmea', no: '05', label: 'Rework PFMEA', freq: 'Monthly',
    icon: '🔧', clause: 'IATF 8.7.1 / Rework PFMEA',
    desc: 'Monthly review and update of Rework PFMEA — failure modes in rework operations, controls, and risk reduction actions.',
    activities: ['Review Rework PFMEA for all active rework operations', 'Identify new failure modes introduced by rework activity', 'Update Severity, Occurrence, and Detection for each rework step', 'Assign corrective actions for high AP rework failure modes', 'Update Rework Work Instructions (WI) if rework method changed', 'Cross-check Rework PFMEA with Rework Control Plan and ODS'],
    docs: ['Rework PFMEA', 'Rework Work Instruction (WI)', 'Rework Control Plan', 'Rework AP Action Tracker'],
    kpis: ['Rework PFMEAs Reviewed', 'High AP Rework Actions Open', 'Rework WI Updated This Month'],
  },
  {
    id: 'plant-layout', no: '06', label: 'Plant Layout', freq: 'Monthly',
    icon: '🏭', clause: 'IATF 8.5.1 / Plant Layout',
    desc: 'Monthly review and update of the plant layout — machine positions, material flow, quality checkpoints, safety zones, and ergonomic improvements.',
    activities: ['Review current plant layout drawing for accuracy', 'Walk the shop floor and verify machine / workstation positions match layout', 'Update layout for any machine movements, new lines, or removed equipment', 'Mark quality inspection checkpoints and red bin locations on layout', 'Identify flow improvement opportunities (cross-over reduction, lean flow)', 'Obtain sign-off on updated plant layout and post at entry and quality office'],
    docs: ['Plant Layout Drawing (Current Rev)', 'Layout Change Request Form', 'Layout Revision Register', 'Layout Approval Sign-off'],
    kpis: ['Layout Reviewed & Updated', 'Layout Changes Made', 'Inspection Checkpoints Marked on Layout'],
  },
];

export default function ManufacturingPage() {
  return <DepartmentPageTemplate dept={dept} processes={processes} />;
}
