import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📄" title="Document Management" subtitle="Controlled documents — SOPs, WIs, Forms, Control Plans with revision history"
    color="border-slate-600" textColor="text-slate-700" bgColor="bg-slate-50"
    standards={['IATF 16949 Cl. 7.5','ISO 9001 Cl. 7.5','Document Control Procedure']}
    features={[
      { label: 'Document Register', desc: 'All controlled documents with number, revision, owner, status' },
      { label: 'Revision Control', desc: 'Change history, change reason, approver sign-off, effective date' },
      { label: 'Document Categories', desc: 'Quality Manual, SOP, WI, Form, Drawing, Standard — organised' },
      { label: 'Expiry & Review Alerts', desc: 'Alert when document is due for periodic review or renewal' },
      { label: 'Obsolete Document Control', desc: 'Archive old revisions, prevent use of obsolete docs' },
      { label: 'Distribution List', desc: 'Track who has received/acknowledged the latest revision' },
    ]}
  />;
}
