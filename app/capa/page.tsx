import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🔧" title="CAPA Management" subtitle="Corrective & Preventive Actions — tracking, effectiveness, closure"
    color="border-purple-600" textColor="text-purple-700" bgColor="bg-purple-50"
    standards={['IATF 16949 Cl. 10.2','ISO 9001 Cl. 10.2','AIAG 8D','VDA']}
    features={[
      { label: 'CAPA Register', desc: 'Centralized register of all CAPAs from complaints, NCRs, audits' },
      { label: 'Action Tracking', desc: 'Responsible person, target date, completion status' },
      { label: 'Effectiveness Review', desc: 'Verify CAPA effectiveness with evidence after implementation' },
      { label: 'Overdue CAPA Alerts', desc: 'Automatic escalation for overdue or ineffective CAPAs' },
      { label: 'Source Linkage', desc: 'Link CAPA to source: customer complaint, audit finding, NCR' },
      { label: 'Trend & Recurrence', desc: 'Identify repeat problems to drive systemic improvement' },
    ]}
  />;
}
