'use client';
import DepartmentPageTemplate, { DeptConfig, ProcessDef } from '../components/DepartmentPageTemplate';

const dept: DeptConfig = {
  id: 'outgoing-quality',
  label: 'Production Quality',
  icon: '📤',
  subtitle: 'Process control sheet, consumable planning, scrap planning for consumables',
  headerBg: 'bg-green-800',
  headerText: 'text-green-300',
  accentBorder: 'border-green-500',
  accentBg: 'bg-green-50',
  accentText: 'text-green-900',
  btnBg: 'bg-green-700',
  tabActive: 'border-green-700 text-green-900 bg-green-50',
};

const processes: ProcessDef[] = [
  {
    id: 'process-control-sheet', no: '01', label: 'Process Control Sheet', freq: 'Monthly',
    icon: '📋', clause: 'IATF 8.5.1 / Process Control',
    desc: 'Monthly review and update of Process Control Sheets for all production operations — machine parameters, critical settings, and control limits.',
    activities: ['Pull all process control sheets for every operation / machine', 'Verify documented settings match actual machine / process settings on shop floor', 'Update parameters if process was optimized, repaired, or changed this month', 'Cross-check process control sheet with PFMEA and Control Plan', 'Obtain production and quality sign-off on updated sheets', 'Post revised process control sheet at machine and file master in document control'],
    docs: ['Process Control Sheet (Per Operation)', 'Machine Parameter Log', 'PFMEA & Control Plan Cross-Reference', 'Document Revision Register'],
    kpis: ['Process Control Sheets Reviewed', 'Sheets with Setting Deviations Found', 'Sheets Updated & Signed Off'],
  },
  {
    id: 'consumable-planning', no: '02', label: 'Consumable Planning', freq: 'Monthly',
    icon: '📦', clause: 'IATF 7.1 / Resource Planning',
    desc: 'Monthly planning of all production consumables — adhesives, fasteners, foam, fabric, wire harness, packaging material, and other consumables required for the month.',
    activities: ['Review production plan and forecast for the month', 'Calculate consumable requirement per model per unit (BOM-based)', 'Multiply by planned production quantity to get total monthly requirement', 'Check current stock vs monthly requirement — identify shortfall', 'Raise purchase indent for consumables with lead time factored in', 'Track consumable receipt and update monthly consumable plan vs actual'],
    docs: ['Monthly Consumable Plan', 'Consumable BOM Reference', 'Purchase Indent / Requisition', 'Consumable Stock Status Report'],
    kpis: ['Consumables Planned vs Actual %', 'Shortfall Items Identified', 'Purchase Indents Raised on Time'],
  },
  {
    id: 'scrap-planning-consumable', no: '03', label: 'Scrap Planning for Consumable', freq: 'Monthly',
    icon: '♻️', clause: 'IATF 8.7 / Scrap & Waste Management',
    desc: 'Monthly planning and tracking of scrap generated from consumables — foam trim, fabric offcuts, adhesive waste, and other consumable scrap.',
    activities: ['Estimate consumable scrap based on previous month actuals and production plan', 'Categorize scrap by consumable type: foam, fabric, adhesive, packaging', 'Calculate scrap % per consumable vs total consumed', 'Plan scrap disposal: vendor collection, recycling, or waste disposal as per norms', 'Record actual scrap generated vs planned for the month', 'Identify high-scrap consumables and initiate waste reduction action'],
    docs: ['Monthly Consumable Scrap Plan', 'Scrap Generation Register (Consumable-wise)', 'Scrap Disposal Record', 'Waste Reduction Action Plan'],
    kpis: ['Consumable Scrap % vs Plan', 'Top Scrap-Generating Consumable', 'Scrap Disposed / Recycled (Kg or INR)'],
  },
];

export default function OutgoingQualityPage() {
  return <DepartmentPageTemplate dept={dept} processes={processes} />;
}
