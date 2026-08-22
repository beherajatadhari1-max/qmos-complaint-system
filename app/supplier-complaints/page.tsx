'use client';
import { useState, useMemo, useEffect } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';
import QualityCopilot from '../components/QualityCopilot';
import LiveKPIBanner from '../components/LiveKPIBanner';

// -- Types ---------------------------------------------------------------------
type NCRSeverity  = 'critical' | 'major' | 'minor';
type NCRStatus    = 'open' | 'scar-sent' | 'scar-received' | 'under-review' | 'closed' | 'escalated';
type Disposition  = 'return-to-supplier' | 'sort' | 'rework-at-cost' | 'use-as-is-deviation' | 'scrap-debit';
type SCARStatus   = 'not-sent' | 'sent' | 'received' | 'accepted' | 'rejected';
type SupplierRating = 'A' | 'B' | 'C' | 'D';

interface SupplierNCR {
  id: string;
  date: string;
  supplierCode: string;
  supplierName: string;
  partNumber: string;
  partName: string;
  lotNumber: string;
  invoiceNo: string;
  lotQty: number;
  rejectedQty: number;
  defectCode: string;
  defectDescription: string;
  severity: NCRSeverity;
  detectionPoint: string;
  disposition: Disposition;
  dispositionQty: number;
  debitAmount: number;
  status: NCRStatus;
  scarStatus: SCARStatus;
  scarSentDate: string;
  scarDueDate: string;
  scarReceivedDate: string;
  supplierRCA: string;
  supplierCA: string;
  supplierPA: string;
  effectivenessVerified: boolean;
  closureDate: string;
  repeatDefect: boolean;
  notes: string;
}

interface SupplierScore {
  supplierCode: string;
  supplierName: string;
  commodity: string;
  rating: SupplierRating;
  ppm: number;
  ppmTarget: number;
  lotsReceived: number;
  lotsRejected: number;
  deliveryScore: number;   // %
  qualityScore: number;    // %
  responsiveness: number;  // %
  overallScore: number;    // %
  openNCRs: number;
  scarOverdue: number;
  lastAuditDate: string;
  lastAuditScore: number;
}

// -- Helpers -------------------------------------------------------------------
const SEV_COLOR: Record<NCRSeverity, string> = {
  critical: 'text-red-600 bg-red-50 border-red-700/50',
  major:    'text-orange-600 bg-orange-50 border-orange-300/50',
  minor:    'text-yellow-400 bg-yellow-900/30/40 border-yellow-700/50',
};
const NCR_STATUS_COLOR: Record<NCRStatus, string> = {
  open:            'text-[#1e3a5f] bg-[#dbeafe]',
  'scar-sent':     'text-[#1d4ed8] bg-[#eff6ff]',
  'scar-received': 'text-purple-400 bg-purple-900/30/40',
  'under-review':  'text-yellow-400 bg-yellow-900/30/40',
  closed:          'text-[#15803d] bg-emerald-50',
  escalated:       'text-red-600 bg-red-50',
};
const SCAR_STATUS_COLOR: Record<SCARStatus, string> = {
  'not-sent':  'text-[#1e3a5f] bg-white',
  sent:        'text-[#1d4ed8] bg-[#eff6ff]',
  received:    'text-purple-400 bg-purple-900/30/30',
  accepted:    'text-[#15803d] bg-emerald-50/30',
  rejected:    'text-red-600 bg-red-900/30',
};
const RATING_COLOR: Record<SupplierRating, string> = {
  A: 'text-[#15803d] bg-emerald-50',
  B: 'text-yellow-400 bg-yellow-900/30/40',
  C: 'text-orange-600 bg-orange-50',
  D: 'text-red-600 bg-red-50',
};
const RATING_LABEL: Record<SupplierRating, string> = {
  A: 'Preferred', B: 'Approved', C: 'Conditional', D: 'Disqualified',
};
const DISP_LABEL: Record<Disposition, string> = {
  'return-to-supplier':    'Return to Supplier',
  'sort':                  'Sort & Use',
  'rework-at-cost':        'Rework (Supplier Cost)',
  'use-as-is-deviation':   'Use As-Is (Deviation)',
  'scrap-debit':           'Scrap + Debit',
};

function scoreColor(v: number) {
  if (v >= 90) return 'text-emerald-600';
  if (v >= 75) return 'text-yellow-400';
  return 'text-red-600';
}

// -- Sample Data ---------------------------------------------------------------
const SAMPLE_NCRS: SupplierNCR[] = [
  {
    id: 'SNCR-001', date: '2025-01-08', supplierCode: 'SUP-042', supplierName: 'Shree Metal Works',
    partNumber: 'PN-4521-BLK', partName: 'Bracket Blank', lotNumber: 'LOT-8821', invoiceNo: 'INV-5541',
    lotQty: 500, rejectedQty: 48, defectCode: 'DIM-OOS', defectDescription: 'Hole diameter 12.5mm — spec 12.0 ±0.1 mm. Entire lot oversize.',
    severity: 'major', detectionPoint: 'Incoming Inspection (IQC)', disposition: 'return-to-supplier', dispositionQty: 500,
    debitAmount: 12000, status: 'scar-sent', scarStatus: 'sent', scarSentDate: '2025-01-09', scarDueDate: '2025-01-16',
    scarReceivedDate: '', supplierRCA: '', supplierCA: '', supplierPA: '',
    effectivenessVerified: false, closureDate: '', repeatDefect: false, notes: 'Full lot returned. Replacement lot requested by 12-Jan.',
  },
  {
    id: 'SNCR-002', date: '2025-01-10', supplierCode: 'SUP-017', supplierName: 'Apex Plastics Ltd',
    partNumber: 'PN-7823-GRM', partName: 'Rubber Grommet', lotNumber: 'LOT-9923', invoiceNo: 'INV-6102',
    lotQty: 2000, rejectedQty: 62, defectCode: 'VIS-FLASH', defectDescription: 'Moulding flash on sealing face — fails leak test.',
    severity: 'critical', detectionPoint: 'In-Process (Op-40 Assembly)', disposition: 'scrap-debit', dispositionQty: 62,
    debitAmount: 8680, status: 'scar-received', scarStatus: 'received', scarSentDate: '2025-01-10', scarDueDate: '2025-01-17',
    scarReceivedDate: '2025-01-15', supplierRCA: 'Mould flash due to worn mould parting line — maintenance overdue by 3 months.',
    supplierCA: 'Mould parting line reworked. 100% visual inspection at moulding before dispatch.', supplierPA: 'Mould PM schedule changed to every 50,000 shots. Checklist updated.',
    effectivenessVerified: false, closureDate: '', repeatDefect: true, notes: '2nd occurrence this quarter — escalation pending.',
  },
  {
    id: 'SNCR-003', date: '2025-01-12', supplierCode: 'SUP-042', supplierName: 'Shree Metal Works',
    partNumber: 'PN-4521-BLK', partName: 'Bracket Blank', lotNumber: 'LOT-8855', invoiceNo: 'INV-5580',
    lotQty: 500, rejectedQty: 5, defectCode: 'SURF-RUST', defectDescription: 'Surface rust on 5 blanks — storage / transit issue.',
    severity: 'minor', detectionPoint: 'Incoming Inspection (IQC)', disposition: 'sort', dispositionQty: 5,
    debitAmount: 1500, status: 'closed', scarStatus: 'accepted', scarSentDate: '2025-01-13', scarDueDate: '2025-01-20',
    scarReceivedDate: '2025-01-17', supplierRCA: 'Parts stored near water seepage area in transit warehouse.',
    supplierCA: 'Rust-inhibitor paper added to packaging. Storage area waterproofed.',
    supplierPA: 'Packaging specification updated. Supplier WI revised.',
    effectivenessVerified: true, closureDate: '2025-01-22', repeatDefect: false, notes: 'Closed. Effectiveness confirmed on next 3 lots.',
  },
  {
    id: 'SNCR-004', date: '2025-01-14', supplierCode: 'SUP-088', supplierName: 'Precision Fasteners Co.',
    partNumber: 'PN-3301-BLT', partName: 'M10 Bolt Set', lotNumber: 'LOT-1042', invoiceNo: 'INV-7741',
    lotQty: 5000, rejectedQty: 120, defectCode: 'STR-FAIL', defectDescription: 'Tensile strength below spec — 800 MPa actual vs 1000 MPa min spec.',
    severity: 'critical', detectionPoint: 'Incoming Inspection (IQC) — destructive test', disposition: 'return-to-supplier', dispositionQty: 5000,
    debitAmount: 45000, status: 'escalated', scarStatus: 'sent', scarSentDate: '2025-01-14', scarDueDate: '2025-01-21',
    scarReceivedDate: '', supplierRCA: '', supplierCA: '', supplierPA: '',
    effectivenessVerified: false, closureDate: '', repeatDefect: false, notes: 'Safety-critical characteristic. Customer notified. Supplier on Quality Hold. Alternate source being evaluated.',
  },
  {
    id: 'SNCR-005', date: '2025-01-18', supplierCode: 'SUP-055', supplierName: 'Global Wire & Cable',
    partNumber: 'PN-2210-CAB', partName: 'Wiring Harness', lotNumber: 'LOT-3301', invoiceNo: 'INV-8820',
    lotQty: 200, rejectedQty: 8, defectCode: 'DIM-LEN', defectDescription: 'Cable length short by 15mm — spec 500 ±5mm, actual 481–488mm range.',
    severity: 'major', detectionPoint: 'Incoming Inspection (IQC)', disposition: 'rework-at-cost', dispositionQty: 8,
    debitAmount: 3200, status: 'under-review', scarStatus: 'received', scarSentDate: '2025-01-18', scarDueDate: '2025-01-25',
    scarReceivedDate: '2025-01-22', supplierRCA: 'Cut-off machine calibration drift — not detected for 2 weeks.',
    supplierCA: 'Machine recalibrated. Daily length check SOP implemented.',
    supplierPA: 'Calibration frequency changed to daily (from weekly). Control chart added.',
    effectivenessVerified: false, closureDate: '', repeatDefect: false, notes: 'RCA under review. Rework cost debit raised.',
  },
];

const SAMPLE_SCORECARDS: SupplierScore[] = [
  { supplierCode: 'SUP-042', supplierName: 'Shree Metal Works', commodity: 'Sheet Metal / Stampings', rating: 'B', ppm: 1840, ppmTarget: 500, lotsReceived: 24, lotsRejected: 2, deliveryScore: 92, qualityScore: 78, responsiveness: 85, overallScore: 83, openNCRs: 2, scarOverdue: 0, lastAuditDate: '2024-10-15', lastAuditScore: 74 },
  { supplierCode: 'SUP-017', supplierName: 'Apex Plastics Ltd', commodity: 'Injection Moulding', rating: 'C', ppm: 4200, ppmTarget: 500, lotsReceived: 18, lotsRejected: 1, deliveryScore: 88, qualityScore: 62, responsiveness: 90, overallScore: 71, openNCRs: 1, scarOverdue: 0, lastAuditDate: '2024-09-20', lastAuditScore: 68 },
  { supplierCode: 'SUP-088', supplierName: 'Precision Fasteners Co.', commodity: 'Fasteners / Hardware', rating: 'D', ppm: 24000, ppmTarget: 200, lotsReceived: 10, lotsRejected: 1, deliveryScore: 95, qualityScore: 40, responsiveness: 70, overallScore: 52, openNCRs: 1, scarOverdue: 1, lastAuditDate: '2024-08-01', lastAuditScore: 58 },
  { supplierCode: 'SUP-055', supplierName: 'Global Wire & Cable', commodity: 'Wiring Harness', rating: 'B', ppm: 1200, ppmTarget: 500, lotsReceived: 15, lotsRejected: 1, deliveryScore: 96, qualityScore: 82, responsiveness: 88, overallScore: 87, openNCRs: 1, scarOverdue: 0, lastAuditDate: '2024-11-10', lastAuditScore: 81 },
  { supplierCode: 'SUP-021', supplierName: 'Reliable Castings Pvt Ltd', commodity: 'Die Castings', rating: 'A', ppm: 180, ppmTarget: 500, lotsReceived: 30, lotsRejected: 0, deliveryScore: 98, qualityScore: 97, responsiveness: 95, overallScore: 97, openNCRs: 0, scarOverdue: 0, lastAuditDate: '2024-12-05', lastAuditScore: 92 },
];

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Supplier NCR Register
// ══════════════════════════════════════════════════════════════════════════════
function NCRRegisterTab({ ncrs }: { ncrs: SupplierNCR[] }) {
  const [filterSev, setFilterSev] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const suppliers = useMemo(() => ['all', ...Array.from(new Set(ncrs.map(n => n.supplierName)))], [ncrs]);

  const filtered = useMemo(() =>
    ncrs.filter(n =>
      (filterSev === 'all' || n.severity === filterSev) &&
      (filterStatus === 'all' || n.status === filterStatus) &&
      (filterSupplier === 'all' || n.supplierName === filterSupplier)
    ), [ncrs, filterSev, filterStatus, filterSupplier]);

  const summary = useMemo(() => {
    const totalDebit = ncrs.reduce((a, n) => a + n.debitAmount, 0);
    const totalRej = ncrs.reduce((a, n) => a + n.rejectedQty, 0);
    const totalLotQty = ncrs.reduce((a, n) => a + n.lotQty, 0);
    const ppm = totalLotQty > 0 ? Math.round((totalRej / totalLotQty) * 1_000_000) : 0;
    return {
      total: ncrs.length,
      open: ncrs.filter(n => n.status !== 'closed').length,
      critical: ncrs.filter(n => n.severity === 'critical').length,
      repeat: ncrs.filter(n => n.repeatDefect).length,
      totalDebit,
      ppm,
    };
  }, [ncrs]);

  return (
      <>
      <PageTitle title="Supplier Complaints" />
      <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total NCRs', val: summary.total, cls: 'text-[#1e3a5f]' },
          { label: 'Open', val: summary.open, cls: 'text-yellow-400' },
          { label: 'Critical', val: summary.critical, cls: 'text-red-600' },
          { label: 'Repeat', val: summary.repeat, cls: 'text-orange-600' },
          { label: 'Supplier PPM', val: summary.ppm.toLocaleString(), cls: 'text-[#1e3a5f]' },
          { label: 'Total Debit', val: `₹${(summary.totalDebit / 1000).toFixed(1)}K`, cls: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-3 border border-[#dbeafe] text-center">
            <div className="text-xs text-[#1e3a5f]">{s.label}</div>
            <div className={`text-xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          {suppliers.map(s => <option key={s} value={s}>{s === 'all' ? 'All Suppliers' : s}</option>)}
        </select>
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          <option value="all">All Severity</option>
          <option value="critical">🔴 Critical</option>
          <option value="major">🟠 Major</option>
          <option value="minor">🟡 Minor</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          {['open', 'scar-sent', 'scar-received', 'under-review', 'closed', 'escalated'].map(s => (
            <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <span className="text-xs text-[#1e3a5f] ml-auto">{filtered.length} NCR{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* NCR Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-12 text-[#1e3a5f]">No NCRs match filters. Load sample data to begin.</div>}
        {filtered.map(ncr => {
          const isOpen = expanded === ncr.id;
          return (
            <div key={ncr.id} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
              <button className="w-full text-left p-4 hover:bg-white transition-colors" onClick={() => setExpanded(isOpen ? null : ncr.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs bg-[#dbeafe] text-[#1e3a5f] px-2 py-0.5 rounded font-mono">{ncr.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SEV_COLOR[ncr.severity]}`}>{ncr.severity.toUpperCase()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${NCR_STATUS_COLOR[ncr.status]}`}>{ncr.status.replace(/-/g, ' ').toUpperCase()}</span>
                  {ncr.repeatDefect && <span className="text-xs bg-red-50 text-red-700 border border-red-700/50 px-2 py-0.5 rounded">🔁 REPEAT</span>}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white">{ncr.supplierName}</span>
                    <span className="text-xs text-[#1e3a5f]">{ncr.partName} ({ncr.partNumber})</span>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-[#1e3a5f]">Rejected</div>
                      <div className="text-sm font-bold text-red-600">{ncr.rejectedQty} / {ncr.lotQty}</div>
                    </div>
                    {ncr.debitAmount > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-[#1e3a5f]">Debit</div>
                        <div className="text-sm font-bold text-orange-600">₹{ncr.debitAmount.toLocaleString()}</div>
                      </div>
                    )}
                    <span className="text-[#1e3a5f]">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-[#1e3a5f]">{ncr.date} · {ncr.detectionPoint} · {DISP_LABEL[ncr.disposition]}</div>
              </button>

              {isOpen && (
                <div className="border-t border-[#dbeafe] p-4 space-y-4">
                  {/* Defect detail */}
                  <div className="bg-[#eff6ff] rounded-lg p-4">
                    <div className="text-xs text-[#1e3a5f] mb-1">Defect Description</div>
                    <div className="text-sm text-white">{ncr.defectDescription}</div>
                    <div className="mt-2 flex gap-4 text-xs text-[#1e3a5f]">
                      <span>Code: <span className="text-white">{ncr.defectCode}</span></span>
                      <span>Lot: <span className="text-white">{ncr.lotNumber}</span></span>
                      <span>Invoice: <span className="text-white">{ncr.invoiceNo}</span></span>
                    </div>
                  </div>

                  {/* SCAR tracking */}
                  <div>
                    <div className="text-xs text-[#1e3a5f] mb-2 uppercase tracking-wide">SCAR Status</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {[
                        { l: 'SCAR Status', v: ncr.scarStatus.replace(/-/g, ' ').toUpperCase(), cls: SCAR_STATUS_COLOR[ncr.scarStatus] },
                        { l: 'Sent Date', v: ncr.scarSentDate || '—', cls: 'text-white' },
                        { l: 'Due Date', v: ncr.scarDueDate || '—', cls: 'text-yellow-400' },
                        { l: 'Received Date', v: ncr.scarReceivedDate || '—', cls: 'text-white' },
                      ].map(d => (
                        <div key={d.l} className="bg-[#eff6ff] rounded-lg p-3">
                          <div className="text-xs text-[#1e3a5f]">{d.l}</div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${d.cls}`}>{d.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supplier response */}
                  {(ncr.supplierRCA || ncr.supplierCA || ncr.supplierPA) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {[
                        { l: 'Root Cause (Supplier)', v: ncr.supplierRCA, color: 'yellow' },
                        { l: 'Corrective Action', v: ncr.supplierCA, color: 'blue' },
                        { l: 'Preventive Action', v: ncr.supplierPA, color: 'emerald' },
                      ].map(d => d.v ? (
                        <div key={d.l} className={`bg-${d.color}-900/10 border border-${d.color}-800/30 rounded-lg p-3`}>
                          <div className="text-xs text-[#1e3a5f] mb-1">{d.l}</div>
                          <div className={`text-${d.color}-300 text-xs`}>{d.v}</div>
                        </div>
                      ) : null)}
                    </div>
                  )}

                  {/* Effectiveness & closure */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className={`px-3 py-2 rounded-lg border text-xs font-medium ${ncr.effectivenessVerified ? 'text-[#15803d] bg-emerald-50 border-emerald-200' : 'text-[#1e3a5f] bg-white border-[#dbeafe]'}`}>
                      {ncr.effectivenessVerified ? '✅ Effectiveness Verified' : '⏳ Effectiveness Pending'}
                    </div>
                    {ncr.closureDate && <div className="px-3 py-2 rounded-lg border text-xs text-[#15803d] bg-emerald-50 border-emerald-200">Closed: {ncr.closureDate}</div>}
                    {ncr.debitAmount > 0 && <div className="px-3 py-2 rounded-lg border text-xs text-orange-600 bg-orange-50 border-orange-300/40">Debit Note: ₹{ncr.debitAmount.toLocaleString()}</div>}
                  </div>

                  {ncr.notes && (
                    <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-3 text-xs text-yellow-300">📝 {ncr.notes}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
      </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Supplier Scorecard
// ══════════════════════════════════════════════════════════════════════════════
function ScorecardTab({ scorecards }: { scorecards: SupplierScore[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'overall' | 'ppm' | 'name'>('overall');

  const sorted = useMemo(() => [...scorecards].sort((a, b) => {
    if (sortBy === 'overall') return b.overallScore - a.overallScore;
    if (sortBy === 'ppm') return a.ppm - b.ppm;
    return a.supplierName.localeCompare(b.supplierName);
  }), [scorecards, sortBy]);

  const summary = useMemo(() => ({
    A: scorecards.filter(s => s.rating === 'A').length,
    B: scorecards.filter(s => s.rating === 'B').length,
    C: scorecards.filter(s => s.rating === 'C').length,
    D: scorecards.filter(s => s.rating === 'D').length,
  }), [scorecards]);

  function ScoreBar({ value, target }: { value: number; target: number }) {
    const color = value >= target ? 'bg-emerald-500' : value >= target * 0.85 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="h-1.5 bg-[#dbeafe] rounded-full overflow-hidden mt-1">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Rating summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['A', 'B', 'C', 'D'] as SupplierRating[]).map(r => (
          <div key={r} className="bg-white rounded-lg p-3 border border-[#dbeafe] text-center">
            <div className={`text-2xl font-bold ${RATING_COLOR[r].split(' ')[0]}`}>{summary[r]}</div>
            <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded ${RATING_COLOR[r]}`}>
              Rating {r} — {RATING_LABEL[r]}
            </div>
          </div>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-3 items-center">
        <span className="text-xs text-[#1e3a5f]">Sort by:</span>
        {([['overall', 'Overall Score'], ['ppm', 'PPM (best first)'], ['name', 'Name']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${sortBy === v ? 'bg-orange-700 text-white' : 'bg-white text-[#1e3a5f] hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Scorecard cards */}
      <div className="space-y-3">
        {sorted.length === 0 && <div className="text-center py-12 text-[#1e3a5f]">No supplier data. Load sample data to view scorecards.</div>}
        {sorted.map(sc => {
          const isOpen = expanded === sc.supplierCode;
          const ppmOK = sc.ppm <= sc.ppmTarget;
          return (
            <div key={sc.supplierCode} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
              <button className="w-full text-left p-4 hover:bg-white transition-colors" onClick={() => setExpanded(isOpen ? null : sc.supplierCode)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-lg font-bold w-8 h-8 rounded flex items-center justify-center ${RATING_COLOR[sc.rating]}`}>{sc.rating}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{sc.supplierName}</div>
                    <div className="text-xs text-[#1e3a5f]">{sc.supplierCode} · {sc.commodity}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-xs text-[#1e3a5f]">PPM</div>
                      <div className={`text-sm font-bold ${ppmOK ? 'text-emerald-600' : 'text-red-600'}`}>{sc.ppm.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#1e3a5f]">Overall</div>
                      <div className={`text-lg font-bold ${scoreColor(sc.overallScore)}`}>{sc.overallScore}%</div>
                    </div>
                    {sc.scarOverdue > 0 && <span className="text-xs bg-red-50 text-red-700 border border-red-700/50 px-2 py-0.5 rounded">⚠ SCAR Overdue</span>}
                    <span className="text-[#1e3a5f]">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[#dbeafe] p-4 space-y-4">
                  {/* Score bars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Quality Score', val: sc.qualityScore, target: 90 },
                      { label: 'Delivery Score', val: sc.deliveryScore, target: 95 },
                      { label: 'Responsiveness', val: sc.responsiveness, target: 85 },
                    ].map(s => (
                      <div key={s.label} className="bg-[#eff6ff] rounded-lg p-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#1e3a5f]">{s.label}</span>
                          <span className={`font-bold ${scoreColor(s.val)}`}>{s.val}%</span>
                        </div>
                        <ScoreBar value={s.val} target={s.target} />
                        <div className="text-xs text-[#1e3a5f] mt-1">Target {s.target}%</div>
                      </div>
                    ))}
                  </div>

                  {/* Detail stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { l: 'Lots Received', v: sc.lotsReceived },
                      { l: 'Lots Rejected', v: `${sc.lotsRejected} (${sc.lotsReceived > 0 ? ((sc.lotsRejected / sc.lotsReceived) * 100).toFixed(1) : 0}%)` },
                      { l: 'Open NCRs', v: sc.openNCRs, cls: sc.openNCRs > 0 ? 'text-red-600' : 'text-white' },
                      { l: 'SCAR Overdue', v: sc.scarOverdue, cls: sc.scarOverdue > 0 ? 'text-red-600' : 'text-white' },
                      { l: 'PPM', v: sc.ppm.toLocaleString(), cls: ppmOK ? 'text-emerald-600' : 'text-red-600' },
                      { l: 'PPM Target', v: sc.ppmTarget.toLocaleString() },
                      { l: 'Last Audit', v: sc.lastAuditDate || '—' },
                      { l: 'Audit Score', v: sc.lastAuditScore > 0 ? `${sc.lastAuditScore}%` : '—', cls: scoreColor(sc.lastAuditScore) },
                    ].map(d => (
                      <div key={d.l} className="bg-[#eff6ff] rounded-lg p-3">
                        <div className="text-xs text-[#1e3a5f]">{d.l}</div>
                        <div className={`font-semibold ${(d as any).cls || 'text-white'}`}>{d.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Development action */}
                  {sc.rating === 'C' || sc.rating === 'D' ? (
                    <div className="bg-red-50 border border-red-700/30 rounded-lg p-3 text-sm text-red-700">
                      ⚠ Rating {sc.rating} — {sc.rating === 'D' ? 'Disqualification process to be initiated. Source alternate supplier.' : 'Supplier Development Plan (SDP) mandatory. Monthly review with supplier management.'}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Knowledge Hub
// ══════════════════════════════════════════════════════════════════════════════
function KnowledgeHubTab() {
  const iatfClauses = [
    { clause: '8.4', title: 'Control of externally provided processes, products & services', key: 'Define and control supplier quality requirements. Maintain approved supplier list. Conduct supplier audits, assessments, and scorecard reviews.' },
    { clause: '8.4.1', title: 'General — Supplier control', key: 'Only use suppliers on the Approved Supplier List (ASL). Criteria for adding, maintaining, and removing suppliers must be defined.' },
    { clause: '8.4.1.1', title: 'Supplier selection process', key: 'Supplier selection must be risk-based. PPAP, audit, financial stability, quality history, and CSR compliance are key inputs.' },
    { clause: '8.4.1.2', title: 'Customer-directed sources (nominated suppliers)', key: 'For customer-nominated suppliers, communicate all quality requirements. Auditor still responsible for incoming quality.' },
    { clause: '8.4.2', title: 'Type and extent of control', key: 'Control level based on risk — type of supply, criticality, supplier history. Risk-based approach to IQC sampling (AQL, skip-lot, full).' },
    { clause: '8.4.2.1', title: 'Supplier quality management system development', key: 'Suppliers shall be ISO 9001 / IATF 16949 certified or follow a development roadmap. Documented evidence required.' },
    { clause: '8.4.2.4', title: 'Supplier monitoring', key: 'Monitor supplier delivery PPM, quality PPM, warranty, audit scores. Include in management review. Track SCAR response time.' },
    { clause: '8.4.3', title: 'Information to external providers', key: 'Communicate drawing revisions, spec changes, packaging requirements, and delivery requirements in writing to suppliers.' },
  ];

  const scarProcess = [
    { step: '1', title: 'Detect & Log NCR', desc: 'IQC or in-process rejection — log supplier NCR with defect code, qty, severity, lot details, photos.' },
    { step: '2', title: 'Containment & Disposition', desc: 'Segregate non-conforming lot. Decide: Return / Sort / Rework-at-cost / Scrap+Debit. Prevent escape to customer.' },
    { step: '3', title: 'Issue SCAR to Supplier', desc: 'Send Supplier Corrective Action Request (SCAR) within 24 hrs (critical) or 48 hrs (major). Set due date: 7 days for interim, 21 days for full 8D.' },
    { step: '4', title: 'Supplier 8D Response', desc: 'Supplier to submit 8D: containment (D3), root cause (D4), corrective action (D5), preventive action (D6), with evidence.' },
    { step: '5', title: 'Review Supplier Response', desc: 'SQE reviews RCA quality, corrective action robustness, and timeline. Accept or reject — if rejected, re-issue SCAR.' },
    { step: '6', title: 'Effectiveness Verification', desc: 'Monitor next 3 lots from same supplier. Zero recurrence = SCAR closed. Recurrence = escalate to Rating downgrade or supplier development plan.' },
    { step: '7', title: 'Debit Note & Cost Recovery', desc: 'Raise debit note for: sorting cost, rework cost, downtime cost, premium freight. Share debit calculation with supplier procurement.' },
  ];

  const ratingCriteria = [
    { rating: 'A', label: 'Preferred', color: 'emerald', ppm: '< 200 PPM', delivery: '> 98%', audit: '> 85%', action: 'Annual audit. Preferred for new business allocation.' },
    { rating: 'B', label: 'Approved', color: 'yellow', ppm: '200–1000 PPM', delivery: '90–98%', audit: '70–85%', action: 'Semi-annual audit. Monthly scorecard review.' },
    { rating: 'C', label: 'Conditional', color: 'orange', ppm: '1000–5000 PPM', delivery: '< 90%', audit: '55–70%', action: 'Supplier Development Plan. Monthly supplier visit. 90-day improvement target.' },
    { rating: 'D', label: 'Disqualified', color: 'red', ppm: '> 5000 PPM', delivery: '< 80%', audit: '< 55%', action: 'Stop new orders. Source alternate. Phase out plan with customer approval.' },
  ];

  const auditFindings = [
    'Approved Supplier List (ASL) not maintained or not updated',
    'No PPAP evidence for safety/critical characteristic suppliers',
    'SCAR not sent within defined timeline after NCR',
    'Supplier 8D accepted without evidence review',
    'Effectiveness verification not conducted after SCAR closure',
    'Supplier PPM not tracked or not in management review',
    'Debit notes not raised for supplier-caused defects',
    'Customer-nominated supplier quality not communicated in writing',
  ];

  return (
    <div className="space-y-6">
      {/* IATF Clauses */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">📋 IATF 16949 — Supplier Quality Clauses</h3>
        <div className="space-y-3">
          {iatfClauses.map(c => (
            <div key={c.clause} className="bg-[#eff6ff] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Cl. {c.clause}</span>
                <span className="font-medium text-white text-sm">{c.title}</span>
              </div>
              <p className="text-sm text-[#1e3a5f]">{c.key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SCAR Process */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">📨 SCAR Process — 7 Steps</h3>
        <div className="space-y-3">
          {scarProcess.map(s => (
            <div key={s.step} className="flex gap-4 bg-[#eff6ff] rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-300 flex items-center justify-center text-sm font-bold text-orange-600 shrink-0">{s.step}</div>
              <div>
                <div className="font-medium text-white text-sm">{s.title}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Criteria */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">⭐ Supplier Rating Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ratingCriteria.map(r => (
            <div key={r.rating} className={`bg-[#eff6ff] rounded-lg p-4 border-l-4 border-${r.color}-500`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xl font-bold text-${r.color}-400`}>{r.rating}</span>
                <span className={`text-sm font-medium text-${r.color}-400`}>{r.label}</span>
              </div>
              <div className="space-y-1 text-xs text-[#1e3a5f]">
                <div>PPM: <span className="text-white">{r.ppm}</span></div>
                <div>Delivery: <span className="text-white">{r.delivery}</span></div>
                <div>Audit Score: <span className="text-white">{r.audit}</span></div>
              </div>
              <div className={`mt-2 text-xs text-${r.color}-300`}>→ {r.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Audit Findings */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-white mb-4">⚠️ Common IATF Audit Findings — Supplier Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {auditFindings.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm bg-red-900/10 border border-red-800/30 rounded-lg p-3">
              <span className="text-red-600 mt-0.5 shrink-0">⚠</span>
              <span className="text-[#1e3a5f]">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — SQA Guide
// ══════════════════════════════════════════════════════════════════════════════
function SQAGuideTab() {
  const steps = [
    { no: '01', icon: '📋', title: 'Supplier Onboarding & ASL Management', points: ['Qualify new suppliers: audit, PPAP, financial check, CSR compliance review', 'Add to Approved Supplier List (ASL) with commodity and IATF/ISO certification status', 'Define control level: Level 1 (Full PPAP) / Level 2 (Dimensional + Material) / Level 3 (Certificate only)', 'Communicate quality requirements: drawings, specs, packaging, labelling standards', 'Issue supplier quality manual and obtain acknowledgement', 'Remove disqualified suppliers from ASL — notify procurement and planning'] },
    { no: '02', icon: '🔍', title: 'Incoming Quality Control (IQC)', points: ['Receive material — check quantity, packaging, labelling, and traceability tag', 'Determine inspection plan: sampling per AQL / skip-lot / 100% based on supplier rating and risk', 'Inspect per control plan: dimensions, visual, functional, material certificate review', 'Record results in IQC report with lot traceability', 'Accept: stamp / GRN approval. Reject: raise Supplier NCR within same day', 'For safety/critical parts: mandatory 100% or increased AQL regardless of supplier rating'] },
    { no: '03', icon: '📨', title: 'Supplier NCR & SCAR Management', points: ['Log NCR with defect code, photos, lot details, detection point', 'Immediate containment: hold lot, inform production planning of shortage', 'Issue SCAR — critical: within 4 hrs / major: within 24 hrs / minor: within 48 hrs', 'Track SCAR response timeline — follow up daily if overdue', 'Review supplier 8D response: RCA quality, CA evidence, PA sustainability', 'Close SCAR only after effectiveness verification on next 3 lots'] },
    { no: '04', icon: '📊', title: 'Supplier Scorecard & Monthly Review', points: ['Calculate monthly scorecard: Quality (PPM, rejection rate) / Delivery / Responsiveness', 'Compute overall rating: A / B / C / D using defined criteria', 'Share scorecard with supplier by 5th of following month', 'Conduct monthly review meeting with C/D rated suppliers', 'Track PPM trend — 3 months worsening = escalate to management', 'Include supplier PPM and top rejections in management review input'] },
    { no: '05', icon: '💸', title: 'Debit Note & Cost Recovery', points: ['Raise debit note for all supplier-caused rejections: scrap + sorting + rework + downtime cost', 'Share detailed cost calculation with supplier — get signed acknowledgement', 'Coordinate with procurement for debit recovery via payment deduction', 'Track debit notes in NCR register — include in monthly COQ report', 'Repeat rejections (same defect 3rd time) → mandatory price penalty clause', 'Maintain debit register for IATF audit evidence'] },
    { no: '06', icon: '🏭', title: 'Supplier Audit & Development', points: ['Annual VDA 6.3 or process audit for all Tier-1 suppliers', 'C/D rated suppliers: quarterly audit until rating improves', 'Audit criteria: process control, FMEA, SPC, poka-yoke, traceability, packaging', 'Issue audit findings with corrective action due dates', 'Re-audit after major improvements to reassess score', 'Supplier Development Plan (SDP) for C-rated: 90-day targeted improvement with SQE visit'] },
    { no: '07', icon: '🔁', title: 'Supplier Quality Review — Monthly Cadence', points: ['Compile monthly supplier quality report: PPM by supplier, rejection pareto, SCAR status', 'Review top 3 high-risk suppliers with SQA team', 'Update ASL rating changes based on scorecard', 'Discuss supplier quality at management review', 'Share supplier PPM trend with plant head and supply chain', 'Identify proactive risk suppliers (high PPM trend, overdue SCAR) before they cause line stoppage'] },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
        <p className="text-sm text-[#1e3a5f]">7-step Supplier Quality Assurance operating rhythm — from supplier onboarding through IQC, SCAR management, scorecard, debit note recovery, audit, and monthly review. Aligned to IATF 16949 Cl. 8.4 and VDA 6.3.</p>
      </div>
      {steps.map(step => (
        <div key={step.no} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-300 flex items-center justify-center text-sm font-bold text-orange-600">{step.no}</div>
            <div className="text-xl">{step.icon}</div>
            <h3 className="font-semibold text-white">{step.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {step.points.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-orange-600 mt-0.5 shrink-0">→</span>
                <span className="text-[#1e3a5f]">{p}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
// -- Live Supabase: supplier-sourced customer complaints ------------------------
interface LiveSupplierComplaint {
  id: string; complaint_number: string; status: string; severity: string;
  customer_name?: string; customer?: string; part_name?: string;
  defect_description?: string; created_at: string; complaint_type?: string;
  defect_category?: string;
}

function LiveSupplierComplaintsWidget() {
  const [items, setItems] = useState<LiveSupplierComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState('');

  useEffect(() => {
    fetch('/api/complaints')
      .then(r => r.json())
      .then((data: LiveSupplierComplaint[]) => {
        if (!Array.isArray(data)) return;
        // Surface complaints where type or category indicates supplier origin
        const supplierLinked = data.filter(c => {
          const type = (c.complaint_type ?? '').toLowerCase();
          const cat  = (c.defect_category ?? '').toLowerCase();
          return type.includes('supplier') || type.includes('incoming') || type.includes('vendor') ||
                 cat.includes('supplier') || cat.includes('incoming') || cat.includes('material');
        });
        setItems(supplierLinked);
        setFetchedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-orange-50 border border-orange-300/40 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-orange-50 rounded w-48 mb-2" />
      <div className="h-3 bg-orange-50 rounded w-32" />
    </div>
  );

  if (items.length === 0) return null; // Hide widget when no supplier-linked complaints in DB

  const sevColor: Record<string, string> = {
    Critical: 'text-red-600 bg-red-50 border-red-700/50',
    High:     'text-orange-600 bg-orange-50 border-orange-300/50',
    Medium:   'text-yellow-400 bg-yellow-900/30/40 border-yellow-700/50',
    Low:      'text-[#15803d] bg-emerald-50',
  };

  return (
    <div className="bg-orange-50 border border-orange-300/40 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border-b border-[#dbeafe] flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-sm font-semibold text-orange-600">Live — Supplier-Sourced Customer Complaints</span>
          <span className="text-xs text-orange-500">{items.length} active · {fetchedAt}</span>
        </div>
        <Link href="/customer-quality" className="text-xs text-orange-600 hover:text-orange-600 underline">
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#eff6ff]">
            <tr>
              {['Ref', 'Customer', 'Part', 'Defect Type', 'Severity', 'Status', 'Age', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] uppercase tracking-wide font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.slice(0, 8).map(c => {
              const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
              return (
                <tr key={c.id} className="hover:bg-white transition-colors">
                  <td className="px-3 py-2 font-mono text-orange-600 font-semibold whitespace-nowrap">{c.complaint_number}</td>
                  <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{c.customer_name ?? c.customer ?? '—'}</td>
                  <td className="px-3 py-2 text-[#1e3a5f] max-w-[120px] truncate">{c.part_name ?? '—'}</td>
                  <td className="px-3 py-2 text-[#1e3a5f] max-w-[140px] truncate">{c.defect_category ?? c.complaint_type ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${sevColor[c.severity ?? ''] ?? 'text-[#1e3a5f] bg-white'}`}>
                      {c.severity ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{c.status}</td>
                  <td className={`px-3 py-2 font-semibold whitespace-nowrap ${days > 14 ? 'text-red-600' : days > 7 ? 'text-yellow-400' : 'text-[#1e3a5f]'}`}>
                    {days}d
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/complaints/${c.id}`} className="px-2 py-1 bg-orange-700 text-white rounded text-xs hover:bg-orange-600 transition whitespace-nowrap">
                      Open →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SupplierComplaintsPage() {
  const [activeTab, setActiveTab] = useState(0);
  // Auto-load sample data on mount — no manual button needed
  const [ncrs, setNcrs] = useState<SupplierNCR[]>(SAMPLE_NCRS);
  const [scorecards, setScorecards] = useState<SupplierScore[]>(SAMPLE_SCORECARDS);

  const headerStats = useMemo(() => {
    const totalRej = ncrs.reduce((a, n) => a + n.rejectedQty, 0);
    const totalLotQty = ncrs.reduce((a, n) => a + n.lotQty, 0);
    const ppm = totalLotQty > 0 ? Math.round((totalRej / totalLotQty) * 1_000_000) : 0;
    const openSCARs = ncrs.filter(n => n.scarStatus === 'sent' || n.scarStatus === 'received').length;
    const totalDebit = ncrs.reduce((a, n) => a + n.debitAmount, 0);
    const dRated = scorecards.filter(s => s.rating === 'D').length;
    return { ppm, openSCARs, totalDebit, dRated, openNCRs: ncrs.filter(n => n.status !== 'closed').length };
  }, [ncrs, scorecards]);

  const tabs = ['📋 NCR Register', '⭐ Supplier Scorecard', '📚 Knowledge Hub', '📖 SQA Guide'];

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Live KPI Banner */}
      <div className="px-6 pt-4 max-w-7xl mx-auto">
        <LiveKPIBanner />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🏭</span>
                <h1 className="text-2xl font-bold text-white">Supplier Quality Management</h1>
              </div>
              <p className="text-[#1e3a5f] text-sm">Supplier NCR · SCAR · 8D Tracker · Scorecard · Debit Note · VDA 6.3 Audit · IATF 8.4</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-300/50 rounded-lg text-xs text-orange-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Sample Data · NCR Database coming soon
              </span>
            </div>
          </div>

          {/* Header KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {[
              { label: 'Open NCRs', value: `${headerStats.openNCRs}`, color: headerStats.openNCRs > 0 ? 'text-yellow-400' : 'text-emerald-600', sub: 'Unresolved supplier NCRs' },
              { label: 'Supplier PPM', value: headerStats.ppm.toLocaleString(), color: headerStats.ppm > 500 ? 'text-red-600' : 'text-emerald-600', sub: 'Target < 500 PPM' },
              { label: 'Open SCARs', value: `${headerStats.openSCARs}`, color: headerStats.openSCARs > 0 ? 'text-blue-600' : 'text-emerald-600', sub: 'Awaiting supplier response' },
              { label: 'Total Debit', value: `₹${(headerStats.totalDebit / 1000).toFixed(1)}K`, color: 'text-orange-600', sub: 'Cost recovery (MTD)' },
              { label: 'D-Rated Suppliers', value: `${headerStats.dRated}`, color: headerStats.dRated > 0 ? 'text-red-600' : 'text-emerald-600', sub: 'Disqualification pending' },
            ].map(s => (
              <div key={s.label} className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                <div className="text-xs text-[#1e3a5f] mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#dbeafe] bg-white px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors ${activeTab === i ? 'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]' : 'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Live Supplier-Sourced Customer Complaints — from Supabase */}
      <LiveSupplierComplaintsWidget />

      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/supplier-complaints/SCAR_Form.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View SCAR Form XLS">SCAR Form XLS</a><a href="/downloads/supplier-complaints/SCAR_Form.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download SCAR Form XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/supplier-complaints/8D_Report_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View 8D Report XLS">8D Report XLS</a><a href="/downloads/supplier-complaints/8D_Report_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download 8D Report XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/supplier-complaints/Complaint_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Complaint Tracker">Complaint Tracker</a><a href="/downloads/supplier-complaints/Complaint_Tracker.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Complaint Tracker">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/supplier-complaints/Supplier_Debit_Note_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Debit Note Register">Debit Note Register</a><a href="/downloads/supplier-complaints/Supplier_Debit_Note_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Debit Note Register">⬇</a></span>
      </div>
        {activeTab === 0 && <NCRRegisterTab ncrs={ncrs} />}
        {activeTab === 1 && <ScorecardTab scorecards={scorecards} />}
        {activeTab === 2 && <KnowledgeHubTab />}
        {activeTab === 3 && <SQAGuideTab />}
      </div>
      <QualityCopilot page="supplier-complaints" />
    </div>
  );
}