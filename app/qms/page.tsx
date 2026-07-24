import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📑" title="QMS — Quality Management System" subtitle="IATF 16949 / ISO 9001 QMS management, management review, objectives, risks"
    color="border-indigo-600" textColor="text-indigo-700" bgColor="bg-indigo-50"
    standards={['IATF 16949 All Clauses','ISO 9001 All Clauses','VDA 6.3','Customer CSR']}
    features={[
      { label: 'QMS Clause Tracker', desc: 'IATF 16949 clause compliance status and evidence register' },
      { label: 'Management Review', desc: 'MR agenda, inputs, outputs, MOM and action tracker' },
      { label: 'Quality Objectives', desc: 'Department-wise quality objectives with target and status' },
      { label: 'Risk & Opportunity Register', desc: 'Risk identification, assessment, mitigation and monitoring' },
      { label: 'Context of Organization', desc: 'Internal/external issues, interested parties register' },
      { label: 'Calibration Management', desc: 'Gauge register, calibration due dates, recall, certificates' },
      { label: 'Change Management', desc: 'Engineering changes, process changes — impact and approval' },
      { label: 'QMS Performance Dashboard', desc: 'Overall QMS health score across all clauses' },
    ]}
  />;
}
