import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="🎓" title="Training & Competency Management" subtitle="Skill matrix, training plan, competency assessment, OJT records"
    color="border-yellow-600" textColor="text-yellow-700" bgColor="bg-yellow-50"
    standards={['IATF 16949 Cl. 7.2','ISO 9001 Cl. 7.2','Competency Framework']}
    features={[
      { label: 'Skill Matrix', desc: 'Employee × skill grid with competency levels (1–4)' },
      { label: 'Training Plan', desc: 'Annual training calendar by department, topic, and trainer' },
      { label: 'Training Records', desc: 'Attendance, pre/post test scores, effectiveness evaluation' },
      { label: 'OJT Records', desc: 'On-the-job training with sign-off by trainer and HOD' },
      { label: 'Competency Assessment', desc: 'Theory + practical assessment with pass/fail and validity' },
      { label: 'Training Effectiveness Review', desc: 'Measure impact of training on defect rate and performance' },
    ]}
  />;
}
