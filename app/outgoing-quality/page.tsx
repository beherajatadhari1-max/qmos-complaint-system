import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📤" title="Outgoing Quality (OQC)" subtitle="Final inspection, dispatch clearance, customer PPM, field returns"
    color="border-green-600" textColor="text-green-700" bgColor="bg-green-50"
    standards={['IATF 16949 Cl. 8.6','ISO 9001 Cl. 8.6','Control Plan','Customer CSR']}
    features={[
      { label: 'Final Inspection Records', desc: 'Lot-wise final inspection with AQL sampling results' },
      { label: 'Dispatch Clearance Note', desc: 'Quality release for dispatch with inspector sign-off' },
      { label: 'Customer PPM Dashboard', desc: 'PPM per customer, part, month with cumulative trend' },
      { label: 'Field Return / Warranty Log', desc: 'Track field returns, warranty claims, DOA analysis' },
      { label: 'Customer Concern Status', desc: 'Link outgoing defects to open customer complaints' },
      { label: 'COC / Test Certificate', desc: 'Generate Certificate of Conformance per shipment' },
    ]}
  />;
}
