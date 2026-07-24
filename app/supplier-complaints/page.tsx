import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🏭" title="Supplier Complaint Management" subtitle="Log, track and resolve supplier quality issues with 8D"
    color="border-orange-500" textColor="text-orange-700" bgColor="bg-orange-50"
    standards={['IATF 16949 Cl. 8.4','ISO 9001 Cl. 8.4','AIAG PPAP','VDA 6.3']}
    features={[
      { label: 'Supplier NCR Logging', desc: 'Log incoming quality rejections with part/lot details' },
      { label: 'Auto 8D for Supplier', desc: 'Send 8D request to supplier and track response' },
      { label: 'Supplier Corrective Action', desc: 'Track SCAR status, root cause, and effectiveness' },
      { label: 'Supplier Scorecard', desc: 'PPM, delivery, quality rating per supplier' },
      { label: 'Debit Note / Chargeback', desc: 'Track cost recovery for supplier-caused defects' },
      { label: 'Incoming Rejection Trend', desc: 'Monthly rejection trend by supplier and part' },
    ]}
  />;
}
