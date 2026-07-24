import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🏭" title="Supplier Quality" subtitle="Supplier development, audits, scorecards, NCR, SCAR, approved supplier list"
    color="border-orange-500" textColor="text-orange-700" bgColor="bg-orange-50"
    standards={['IATF 16949 Cl. 8.4','ISO 9001 Cl. 8.4','VDA 6.3','AIAG PPAP']}
    features={[
      { label: 'Approved Supplier List (ASL)', desc: 'Supplier approval status, grade, validity, commodity' },
      { label: 'Supplier Scorecard', desc: 'PPM, delivery, quality, response rating per supplier' },
      { label: 'Supplier NCR / SCAR', desc: 'Log rejections, raise SCAR, track 8D response' },
      { label: 'Supplier Audit', desc: 'VDA 6.3 and IATF supplier process audit management' },
      { label: 'Supplier Development Plan', desc: 'Improvement plan, action tracking, re-assessment' },
      { label: 'Incoming Rejection Trend', desc: 'Monthly PPM and rejection trend by supplier' },
      { label: 'Debit Note / Chargeback', desc: 'Cost recovery tracking for supplier-caused defects' },
      { label: 'Supplier Risk Assessment', desc: 'Risk level per supplier — single source, critical, strategic' },
    ]}
  />;
}
