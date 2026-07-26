import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🗂️" title="Control Plan" subtitle="Process control plan register — characteristics, methods, frequency, reaction"
    color="border-amber-600" textColor="text-amber-700" bgColor="bg-amber-50"
    standards={['AIAG Control Plan Reference Manual','IATF 16949 Cl. 8.5.1','PFMEA Linkage']}
    features={[
      { label: 'Control Plan Builder', desc: 'Create and edit control plans with all AIAG columns' },
      { label: 'Prototype / Pre-launch / Production', desc: 'Manage three phases of control plan per APQP' },
      { label: 'Special Characteristics', desc: 'Track SC/CC/KPC with customer-specific symbols' },
      { label: 'MSA Linkage', desc: 'Link measurement methods to MSA study results' },
      { label: 'Reaction Plan', desc: 'Define and track reaction plans for out-of-control conditions' },
      { label: 'Revision Control', desc: 'Version history, change reason, approver, effective date' },
    ]}
  />;
}
