import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📦" title="PPAP — Production Part Approval Process" subtitle="PPAP submission tracker — 18 elements, Level 1–5, approval status"
    color="border-cyan-600" textColor="text-cyan-700" bgColor="bg-cyan-50"
    standards={['AIAG PPAP 4th Ed.','IATF 16949 Cl. 8.3.4','Customer CSR']}
    features={[
      { label: 'PPAP Part Register', desc: 'All parts requiring PPAP with customer, level, status' },
      { label: '18-Element Checklist', desc: 'Track status of all 18 PPAP elements per submission' },
      { label: 'Submission Package Builder', desc: 'Compile PPAP documents for customer submission' },
      { label: 'Approval Status Tracker', desc: 'PSW status — Approved / Interim / Rejected per customer' },
      { label: 'PPAP Expiry Alert', desc: 'Alert when re-PPAP is needed due to change or annual review' },
      { label: 'Deviation / Waiver Register', desc: 'Track interim approvals, deviations, and waiver requests' },
    ]}
  />;
}
