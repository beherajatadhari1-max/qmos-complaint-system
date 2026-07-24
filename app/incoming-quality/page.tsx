import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📥" title="Incoming Quality (IQC)" subtitle="Incoming inspection, GRN quality checks, supplier rejection tracking"
    color="border-teal-500" textColor="text-teal-700" bgColor="bg-teal-50"
    standards={['IATF 16949 Cl. 8.4.3','ISO 9001 Cl. 8.4','Control Plan','MSA']}
    features={[
      { label: 'Inspection Plan', desc: 'Per part/supplier inspection criteria, sampling plan, AQL level' },
      { label: 'GRN Inspection Record', desc: 'Log inspection results per lot with accept/reject decision' },
      { label: 'Rejection & Return', desc: 'Rejection memo, return to supplier, SCAR initiation' },
      { label: 'Incoming PPM Tracking', desc: 'PPM per supplier and part number with trend chart' },
      { label: 'Approved Supplier List', desc: 'ASL with approval status, grade, and validity date' },
      { label: 'Skip-lot & Dock-to-stock', desc: 'Manage inspection frequency based on supplier performance' },
    ]}
  />;
}
