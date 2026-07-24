import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🔴" title="Internal NCR Management" subtitle="Capture, investigate and close internal non-conformances"
    color="border-red-500" textColor="text-red-700" bgColor="bg-red-50"
    standards={['IATF 16949 Cl. 10.2','ISO 9001 Cl. 10.2','AIAG FMEA','Control Plan']}
    features={[
      { label: 'NCR Logging', desc: 'Capture internal non-conformances by line, shift, operation' },
      { label: 'Defect Classification', desc: 'Type, category, severity, quantity, detection point' },
      { label: 'Root Cause Analysis', desc: '5-Why and Fishbone analysis linked to PFMEA' },
      { label: 'Disposition Workflow', desc: 'Use-as-is / rework / scrap / return decision with approval' },
      { label: 'Cost of Poor Quality', desc: 'Rework cost, scrap cost, COPQ tracking per NCR' },
      { label: 'Repeat NCR Detection', desc: 'Flag recurring defects and escalate to CAPA' },
    ]}
  />;
}
