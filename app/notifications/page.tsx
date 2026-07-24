import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🔔" title="Notifications" subtitle="Real-time alerts for audits, calibration, CAPA, complaints and escalations"
    color="border-red-500" textColor="text-red-700" bgColor="bg-red-50"
    standards={['Escalation Matrix','CAPA Timeliness','Response Time Requirements']}
    features={[
      { label: 'Critical Complaint Alert', desc: 'Instant alert when critical severity complaint is logged' },
      { label: 'CAPA Overdue Alert', desc: 'Remind owner 3 days before and on due date of CAPA' },
      { label: 'Audit Due Reminder', desc: '2-week advance notice for scheduled audits' },
      { label: 'Calibration Due Alert', desc: '30/15/7-day advance alerts for gauge calibration' },
      { label: 'Training Due Reminder', desc: 'Alert when employee training validity is expiring' },
      { label: 'PPAP Pending Alert', desc: 'Notify when PPAP submission deadline is approaching' },
      { label: 'Certification Expiry', desc: 'IATF/ISO certificate expiry alerts 90 days in advance' },
      { label: 'Escalation Alerts', desc: 'Auto-escalate to manager when actions are not closed' },
    ]}
  />;
}
