import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="⚙️" title="Process Quality (IPQC)" subtitle="In-process quality checks, patrol inspection, SPC, line rejection"
    color="border-indigo-500" textColor="text-indigo-700" bgColor="bg-indigo-50"
    standards={['IATF 16949 Cl. 8.5','Control Plan','PFMEA','SPC','AIAG MSA']}
    features={[
      { label: 'Process Inspection Records', desc: 'Log patrol inspection results per operation per shift' },
      { label: 'First-off / Last-off Check', desc: 'Setup approval and end-of-run inspection record' },
      { label: 'Line Rejection Register', desc: 'Capture line rejections by defect, quantity, operation' },
      { label: 'First Pass Yield Tracking', desc: 'FPY by line, shift, part with trend chart' },
      { label: 'SPC Integration', desc: 'Control chart data from process linked to SPC module' },
      { label: 'Poka-yoke Check Log', desc: 'Mandatory error-proofing device check records' },
    ]}
  />;
}
