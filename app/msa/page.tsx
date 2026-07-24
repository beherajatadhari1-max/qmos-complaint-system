import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🔬" title="MSA — Measurement System Analysis" subtitle="GRR, Bias, Linearity, Stability — gauge acceptability studies"
    color="border-violet-600" textColor="text-violet-700" bgColor="bg-violet-50"
    standards={['AIAG MSA 4th Ed.','IATF 16949 Cl. 7.1.5','Control Plan Linkage']}
    features={[
      { label: 'GRR Study (Crossed)', desc: 'Gauge R&R with Appraiser × Part crossed design, %GRR result' },
      { label: 'GRR Study (Nested)', desc: 'Nested GRR for destructive testing scenarios' },
      { label: 'Attribute Agreement Analysis', desc: 'Go/No-Go gauge study — within and between appraiser agreement' },
      { label: 'Bias Study', desc: 'Bias calculation with t-test for statistical significance' },
      { label: 'Linearity Study', desc: 'Bias across operating range with regression analysis' },
      { label: 'Stability Study', desc: 'Control chart based monitoring of gauge over time' },
    ]}
  />;
}
