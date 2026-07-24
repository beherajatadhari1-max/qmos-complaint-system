import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📅" title="Quality Calendar" subtitle="Audit schedule, calibration due dates, customer visits, management reviews"
    color="border-teal-600" textColor="text-teal-700" bgColor="bg-teal-50"
    standards={['IATF 16949 Cl. 9.2','Annual Audit Plan','Calibration Schedule']}
    features={[
      { label: 'Monthly Calendar View', desc: 'All quality events in one calendar — audits, visits, reviews' },
      { label: 'Audit Schedule', desc: 'Annual internal audit plan with department and clause' },
      { label: 'Calibration Due Alerts', desc: 'Gauge calibration due dates with advance reminders' },
      { label: 'Customer Visit Planner', desc: 'Customer visit preparation checklist and schedule' },
      { label: 'Certification Renewal', desc: 'IATF, ISO certificate expiry alerts and renewal tracking' },
      { label: 'Management Review Schedule', desc: 'Quarterly MR calendar with agenda preparation reminders' },
      { label: 'Training Calendar', desc: 'Planned training sessions by department and topic' },
      { label: 'Export to Outlook', desc: 'Sync quality events to Microsoft Outlook calendar' },
    ]}
  />;
}
