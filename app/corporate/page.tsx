import ModulePlaceholder from '../components/ModulePlaceholder';
export default function Page() {
  return <ModulePlaceholder
    icon="📊" title="Corporate Reporting" subtitle="MIS reports, corporate quality decks, executive dashboards, group reporting"
    color="border-gray-700" textColor="text-gray-800" bgColor="bg-gray-50"
    standards={['Management Review','Corporate MIS','Group Quality Standards']}
    features={[
      { label: 'Monthly Quality MIS', desc: 'Auto-generate monthly quality performance report' },
      { label: 'Executive Dashboard', desc: 'One-page quality health for MD/CEO/Plant Head' },
      { label: 'Customer PPM Report', desc: 'Consolidated customer PPM across all plants/customers' },
      { label: 'Corporate Quality Deck', desc: 'PowerPoint-ready quality presentation slides' },
      { label: 'Benchmarking Report', desc: 'Performance vs group plants and industry benchmarks' },
      { label: 'Certification Status', desc: 'IATF, ISO, customer certification validity and status' },
      { label: 'Group Action Tracker', desc: 'Corporate-level action items with owner and deadline' },
      { label: 'Annual Quality Plan', desc: 'Yearly quality objectives, targets and review status' },
    ]}
  />;
}
