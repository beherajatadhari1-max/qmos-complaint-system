import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🏗️" title="Manufacturing Excellence" subtitle="Lean, Kaizen, OEE, TPM, Poka-yoke, line efficiency and manufacturing quality"
    color="border-slate-600" textColor="text-slate-700" bgColor="bg-slate-50"
    standards={['IATF 16949 Cl. 8.5','Lean Manufacturing','TPM','Six Sigma','Kaizen']}
    features={[
      { label: 'OEE Tracking', desc: 'Availability × Performance × Quality per line per shift' },
      { label: 'Kaizen Register', desc: 'Log, track and measure Kaizen improvements' },
      { label: 'TPM Activity Log', desc: 'Planned maintenance, breakdown, MTTR, MTBF tracking' },
      { label: 'Poka-yoke Register', desc: 'Error-proofing devices, check frequency, effectiveness' },
      { label: 'Line Balancing', desc: 'Cycle time, takt time, bottleneck identification' },
      { label: 'QCC / Quality Circle', desc: 'Quality circle projects, savings, participation tracking' },
      { label: '5S Audit', desc: 'Monthly 5S audit scores by area with photo evidence' },
      { label: 'Waste Register', desc: 'Lean waste identification and elimination tracking' },
    ]}
  />;
}
