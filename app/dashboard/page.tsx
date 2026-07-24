import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📊" title="Dashboard" subtitle="Cross-module KPI overview — complaints, quality, audits, CAPA, PPM"
    color="border-blue-600" textColor="text-blue-700" bgColor="bg-blue-50"
    standards={['IATF 16949 Cl. 9.1','ISO 9001 Cl. 9.1','Management Review']}
    features={[
      { label: 'Quality KPI Overview', desc: 'PPM, COPQ, OEE, First Pass Yield, Defect Rate' },
      { label: 'Cross-module Summary', desc: 'Open complaints, NCRs, audits, CAPA across all modules' },
      { label: 'Customer Scorecard', desc: 'Per-customer PPM, complaint count, status' },
      { label: 'Trend Analysis', desc: 'Monthly/quarterly trend charts for all KPIs' },
      { label: 'Management Review Report', desc: 'Auto-generate MR input report from live data' },
      { label: 'Real-time Alerts', desc: 'Overdue CAPA, open criticals, pending closures' },
    ]}
  />;
}
