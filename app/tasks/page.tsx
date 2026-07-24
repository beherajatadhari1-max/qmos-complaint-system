import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="✅" title="Task Management" subtitle="All quality actions in one place — CAPA, audit, customer, supplier, approvals"
    color="border-green-600" textColor="text-green-700" bgColor="bg-green-50"
    standards={['IATF 16949 Cl. 10.2','Action Planning','CAPA Management']}
    features={[
      { label: 'My Tasks', desc: 'All tasks assigned to me across modules — due today, this week' },
      { label: 'Team Tasks', desc: 'Tasks assigned to my team with status and overdue alerts' },
      { label: 'CAPA Actions', desc: 'All corrective/preventive actions with owner and target date' },
      { label: 'Audit Actions', desc: 'Actions from internal and external audit findings' },
      { label: 'Customer Actions', desc: '8D actions, customer complaint tasks, approval pending' },
      { label: 'Supplier Actions', desc: 'SCAR follow-up, supplier development tasks' },
      { label: 'Overdue Escalation', desc: 'Auto-escalate overdue tasks to manager with email alert' },
      { label: 'Kanban Board View', desc: 'Visual task board — To Do, In Progress, Done' },
    ]}
  />;
}
