import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📈" title="SPC — Statistical Process Control" subtitle="Control charts, capability indices, process stability monitoring"
    color="border-blue-700" textColor="text-blue-800" bgColor="bg-blue-50"
    standards={['AIAG SPC 2nd Ed.','IATF 16949 Cl. 8.5.1','Control Plan Linkage']}
    features={[
      { label: 'X-bar & R / X-bar & S Charts', desc: 'Variable control charts with UCL/LCL auto-calculation' },
      { label: 'p / np / c / u Charts', desc: 'Attribute control charts for fraction defective and defects' },
      { label: 'Cp, Cpk, Pp, Ppk', desc: 'Process capability indices with interpretation and targets' },
      { label: 'Out-of-Control Detection', desc: 'Western Electric / Nelson rules violation alerts' },
      { label: 'Data Entry & History', desc: 'Manual or import of measurement data with traceability' },
      { label: 'Capability Report', desc: 'Generate capability study report for customer/PPAP submission' },
    ]}
  />;
}
