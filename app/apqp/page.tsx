import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🚀" title="APQP — Advanced Product Quality Planning" subtitle="New product launch tracker — 5 phases, gate reviews, open issues"
    color="border-blue-500" textColor="text-blue-700" bgColor="bg-blue-50"
    standards={['IATF 16949 Cl. 8.3','AIAG APQP 2nd Ed.','PPAP 4th Ed.','VDA RGA']}
    features={[
      { label: 'APQP Timing Plan', desc: 'Phase-wise Gantt chart with milestones and responsible owners' },
      { label: 'Gate Review Checklist', desc: 'Phase gate sign-off with inputs, outputs and deliverables' },
      { label: 'Open Issues List', desc: 'Track open issues, risks, actions with status and owner' },
      { label: 'APQP Deliverable Matrix', desc: 'All required documents per phase with approval status' },
      { label: 'Launch Readiness Review', desc: 'Pre-launch checklist — PPAP, control plan, training done' },
      { label: 'Lessons Learned', desc: 'Capture lessons from each launch to improve future programs' },
    ]}
  />;
}
