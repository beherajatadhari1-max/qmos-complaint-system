import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="⚙️" title="Settings" subtitle="System configuration, users, roles, plant setup, integrations, data management"
    color="border-gray-600" textColor="text-gray-700" bgColor="bg-gray-50"
    standards={['Role-Based Access Control','Data Security','Audit Trail']}
    features={[
      { label: 'User Management', desc: 'Add users, assign roles — Quality Head, Engineer, Inspector, Auditor' },
      { label: 'Role & Permissions', desc: 'Define what each role can view, edit or approve' },
      { label: 'Plant / Location Setup', desc: 'Add plants, departments, lines, shifts, cost centers' },
      { label: 'Customer Master', desc: 'Customer list, contact persons, CSR documents, PPM targets' },
      { label: 'Supplier Master', desc: 'Supplier list, commodity, grade, contact, approval status' },
      { label: 'Part Master', desc: 'Part number, name, drawing, specifications register' },
      { label: 'Email & Alert Settings', desc: 'Configure email recipients for each alert type' },
      { label: 'Data Backup & Export', desc: 'Schedule automatic backup and export full database' },
    ]}
  />;
}
