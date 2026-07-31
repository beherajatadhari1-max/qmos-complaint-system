'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEV_COLOR: Record<NCRSeverity, string> = {
  critical: 'text-red-400 bg-red-900/40 border-red-700/50',
  major:    'text-orange-400 bg-orange-900/40 border-orange-700/50',
  minor:    'text-yellow-400 bg-yellow-900/40 border-yellow-700/50',
};
const NCR_STATUS_COLOR: Record<NCRStatus, string> = {
  open:            'text-slate-400 bg-slate-700',
  'scar-sent':     'text-blue-400 bg-blue-900/40',
  'scar-received': 'text-purple-400 bg-purple-900/40',
  'under-review':  'text-yellow-400 bg-yellow-900/40',
  closed:          'text-emerald-400 bg-emerald-900/40',
  escalated:       'text-red-400 bg-red-900/40',
};
const SCAR_STATUS_COLOR: Record<SCARStatus, string> = {
  'not-sent':  'text-slate-500 bg-slate-800',
  sent:        'text-blue-400 bg-blue-900/30',
  received:    'text-purple-400 bg-purple-900/30',
  accepted:    'text-emerald-400 bg-emerald-900/30',
  rejected:    'text-red-400 bg-red-900/30',
};
const RATING_COLOR: Record<SupplierRating, string> = {
  A: 'text-emerald-400 bg-emerald-900/40',
  B: 'text-yellow-400 bg-yellow-900/40',
  C: 'text-orange-400 bg-orange-900/40',
  D: 'text-red-400 bg-red-900/40',
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
  if (v >= 90) return 'text-emerald-400';
  if (v >= 75) return 'text-yellow-400';
  return 'text-red-400';
}

// ── Sample Data ───────────────────────────────────────────────────────────────
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
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total NCRs', val: summary.total, cls: 'text-white' },
          { label: 'Open', val: summary.open, cls: 'text-yellow-400' },
          { label: 'Critical', val: summary.critical, cls: 'text-red-400' },
          { label: 'Repeat', val: summary.repeat, cls: 'text-orange-400' },
          { label: 'Supplier PPM', val: summary.ppm.toLocaleString(), cls: 'text-white' },
          { label: 'Total Debit', val: `₹${(summary.totalDebit / 1000).toFixed(1)}K`, cls: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          {suppliers.map(s => <option key={s} value={s}>{s === 'all' ? 'All Suppliers' : s}</option>)}
        </select>
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Severity</option>
          <option value="critical">🔴 Critical</option>
          <option value="major">🟠 Major</option>
          <option value="minor">🟡 Minor</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          {['open', 'scar-sent', 'scar-received', 'under-review', 'closed', 'escalated'].map(s => (
            <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} NCR{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* NCR Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500">No NCRs match filters. Load sample data to begin.</div>}
        {filtered.map(ncr => {
          const isOpen = expanded === ncr.id;
          return (
            <div key={ncr.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <button className="w-full text-left p-4 hover:bg-slate-700/30 transition-colors" onClick={() => setExpanded(isOpen ? null : ncr.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">{ncr.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SEV_COLOR[ncr.severity]}`}>{ncr.severity.toUpperCase()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${NCR_STATUS_COLOR[ncr.status]}`}>{ncr.status.replace(/-/g, ' ').toUpperCase()}</span>
                  {ncr.repeatDefect && <span className="text-xs bg-red-900/50 text-red-300 border border-red-700/50 px-2 py-0.5 rounded">🔁 REPEAT</span>}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white">{ncr.supplierName}</span>
                    <span className="text-xs text-slate-400">{ncr.partName} ({ncr.partNumber})</span>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Rejected</div>
                      <div className="text-sm font-bold text-red-400">{ncr.rejectedQty} / {ncr.lotQty}</div>
                    </div>
                    {ncr.debitAmount > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Debit</div>
                        <div className="text-sm font-bold text-orange-400">₹{ncr.debitAmount.toLocaleString()}</div>
                      </div>
                    )}
                    <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500">{ncr.date} · {ncr.detectionPoint} · {DISP_LABEL[ncr.disposition]}</div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 p-4 space-y-4">
                  {/* Defect detail */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Defect Description</div>
                    <div className="text-sm text-white">{ncr.defectDescription}</div>
                    <div className="mt-2 flex gap-4 text-xs text-slate-400">
                      <span>Code: <span className="text-white">{ncr.defectCode}</span></span>
                      <span>Lot: <span className="text-white">{ncr.lotNumber}</span></span>
                      <span>Invoice: <span className="text-white">{ncr.invoiceNo}</span></span>
                    </div>
                  </div>

                  {/* SCAR tracking */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">SCAR Status</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {[
                        { l: 'SCAR Status', v: ncr.scarStatus.replace(/-/g, ' ').toUpperCase(), cls: SCAR_STATUS_COLOR[ncr.scarStatus] },
                        { l: 'Sent Date', v: ncr.scarSentDate || '—', cls: 'text-white' },
                        { l: 'Due Date', v: ncr.scarDueDate || '—', cls: 'text-yellow-400' },
                        { l: 'Received Date', v: ncr.scarReceivedDate || '—', cls: 'text-white' },
                      ].map(d => (
                        <div key={d.l} className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500">{d.l}</div>
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
                          <div className="text-xs text-slate-500 mb-1">{d.l}</div>
                          <div className={`text-${d.color}-300 text-xs`}>{d.v}</div>
                        </div>
                      ) : null)}
                    </div>
                  )}

                  {/* Effectiveness & closure */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className={`px-3 py-2 rounded-lg border text-xs font-medium ${ncr.effectivenessVerified ? 'text-emerald-400 bg-emerald-900/20 border-emerald-700/40' : 'text-slate-500 bg-slate-800 border-slate-700'}`}>
                      {ncr.effectivenessVerified ? '✅ Effectiveness Verified' : '⏳ Effectiveness Pending'}
                    </div>
                    {ncr.closureDate && <div className="px-3 py-2 rounded-lg border text-xs text-emerald-400 bg-emerald-900/20 border-emerald-700/40">Closed: {ncr.closureDate}</div>}
                    {ncr.debitAmount > 0 && <div className="px-3 py-2 rounded-lg border text-xs text-orange-400 bg-orange-900/20 border-orange-700/40">Debit Note: ₹{ncr.debitAmount.toLocaleString()}</div>}
                  </div>

                  {ncr.notes && (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-xs text-yellow-300">📝 {ncr.notes}</div>
                  )}
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
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Rating summary */}
      <div className="grid grid-cols-4 gap-3">
        {(['A', 'B', 'C', 'D'] as SupplierRating[]).map(r => (
          <div key={r} className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <div className={`text-2xl font-bold ${RATING_COLOR[r].split(' ')[0]}`}>{summary[r]}</div>
            <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded ${RATING_COLOR[r]}`}>
              Rating {r} — {RATING_LABEL[r]}
            </div>
          </div>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-3 items-center">
        <span className="text-xs text-slate-500">Sort by:</span>
        {([['overall', 'Overall Score'], ['ppm', 'PPM (best first)'], ['name', 'Name']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${sortBy === v ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Scorecard cards */}
      <div className="space-y-3">
        {sorted.length === 0 && <div className="text-center py-12 text-slate-500">No supplier data. Load sample data to view scorecards.</div>}
        {sorted.map(sc => {
          const isOpen = expanded === sc.supplierCode;
          const ppmOK = sc.ppm <= sc.ppmTarget;
          return (
            <div key={sc.supplierCode} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <button className="w-full text-left p-4 hover:bg-slate-700/30 transition-colors" onClick={() => setExpanded(isOpen ? null : sc.supplierCode)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-lg font-bold w-8 h-8 rounded flex items-center justify-center ${RATING_COLOR[sc.rating]}`}>{sc.rating}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{sc.supplierName}</div>
                    <div className="text-xs text-slate-400">{sc.supplierCode} · {sc.commodity}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">PPM</div>
                      <div className={`text-sm font-bold ${ppmOK ? 'text-emerald-400' : 'text-red-400'}`}>{sc.ppm.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Overall</div>
                      <div className={`text-lg font-bold ${scoreColor(sc.overallScore)}`}>{sc.overallScore}%</div>
                    </div>
                    {sc.scarOverdue > 0 && <span className="text-xs bg-red-900/50 text-red-300 border border-red-700/50 px-2 py-0.5 rounded">⚠ SCAR Overdue</span>}
                    <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700 p-4 space-y-4">
                  {/* Score bars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Quality Score', val: sc.qualityScore, target: 90 },
                      { label: 'Delivery Score', val: sc.deliveryScore, target: 95 },
                      { label: 'Responsiveness', val: sc.responsiveness, target: 85 },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{s.label}</span>
                          <span className={`font-bold ${scoreColor(s.val)}`}>{s.val}%</span>
                        </div>
                        <ScoreBar value={s.val} target={s.target} />
                        <div className="text-xs text-slate-600 mt-1">Target {s.target}%</div>
                      </div>
                    ))}
                  </div>

                  {/* Detail stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { l: 'Lots Received', v: sc.lotsReceived },
                      { l: 'Lots Rejected', v: `${sc.lotsRejected} (${sc.lotsReceived > 0 ? ((sc.lotsRejected / sc.lotsReceived) * 100).toFixed(1) : 0}%)` },
                      { l: 'Open NCRs', v: sc.openNCRs, cls: sc.openNCRs > 0 ? 'text-red-400' : 'text-white' },
                      { l: 'SCAR Overdue', v: sc.scarOverdue, cls: sc.scarOverdue > 0 ? 'text-red-400' : 'text-white' },
                      { l: 'PPM', v: sc.ppm.toLocaleString(), cls: ppmOK ? 'text-emerald-400' : 'text-red-400' },
                      { l: 'PPM Target', v: sc.ppmTarget.toLocaleString() },
                      { l: 'Last Audit', v: sc.lastAuditDate || '—' },
                      { l: 'Audit Score', v: sc.lastAuditScore > 0 ? `${sc.lastAuditScore}%` : '—', cls: scoreColor(sc.lastAuditScore) },
                    ].map(d => (
                      <div key={d.l} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500">{d.l}</div>
                        <div className={`font-semibold ${(d as any).cls || 'text-white'}`}>{d.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Development action */}
                  {sc.rating === 'C' || sc.rating === 'D' ? (
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-sm text-red-300">
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
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">📋 IATF 16949 — Supplier Quality Clauses</h3>
        <div className="space-y-3">
          {iatfClauses.map(c => (
            <div key={c.clause} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">Cl. {c.clause}</span>
                <span className="font-medium text-white text-sm">{c.title}</span>
              </div>
              <p className="text-sm text-slate-400">{c.key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SCAR Process */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">📨 SCAR Process — 7 Steps</h3>
        <div className="space-y-3">
          {scarProcess.map(s => (
            <div key={s.step} className="flex gap-4 bg-slate-900/50 rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-orange-900/50 border border-orange-700 flex items-center justify-center text-sm font-bold text-orange-400 shrink-0">{s.step}</div>
              <div>
                <div className="font-medium text-white text-sm">{s.title}</div>
                <div className="text-xs text-slate-400 mt-1">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Criteria */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">⭐ Supplier Rating Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ratingCriteria.map(r => (
            <div key={r.rating} className={`bg-slate-900/50 rounded-lg p-4 border-l-4 border-${r.color}-500`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xl font-bold text-${r.color}-400`}>{r.rating}</span>
                <span className={`text-sm font-medium text-${r.color}-400`}>{r.label}</span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
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
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white mb-4">⚠️ Common IATF Audit Findings — Supplier Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {auditFindings.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm bg-red-900/10 border border-red-800/30 rounded-lg p-3">
              <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
              <span className="text-slate-300">{f}</span>
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
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">7-step Supplier Quality Assurance operating rhythm — from supplier onboarding through IQC, SCAR management, scorecard, debit note recovery, audit, and monthly review. Aligned to IATF 16949 Cl. 8.4 and VDA 6.3.</p>
      </div>
      {steps.map(step => (
        <div key={step.no} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-orange-900/50 border border-orange-700 flex items-center justify-center text-sm font-bold text-orange-400">{step.no}</div>
            <div className="text-xl">{step.icon}</div>
            <h3 className="font-semibold text-white">{step.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {step.points.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-orange-400 mt-0.5 shrink-0">→</span>
                <span className="text-slate-300">{p}</span>
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
export default function SupplierComplaintsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [ncrs, setNcrs] = useState<SupplierNCR[]>([]);
  const [scorecards, setScorecards] = useState<SupplierScore[]>([]);
  const [loaded, setLoaded] = useState(false);

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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900/40 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🏭</span>
                <h1 className="text-2xl font-bold text-white">Supplier Quality Management</h1>
              </div>
              <p className="text-slate-400 text-sm">Supplier NCR · SCAR · 8D Tracker · Scorecard · Debit Note · VDA 6.3 Audit · IATF 8.4</p>
            </div>
            <button
              onClick={() => {
                if (!loaded) { setNcrs(SAMPLE_NCRS); setScorecards(SAMPLE_SCORECARDS); setLoaded(true); }
                else { setNcrs([]); setScorecards([]); setLoaded(false); }
              }}
              className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>

          {/* Header KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {[
              { label: 'Open NCRs', value: ncrs.length > 0 ? `${headerStats.openNCRs}` : '—', color: headerStats.openNCRs > 0 ? 'text-yellow-400' : 'text-emerald-400', sub: 'Unresolved supplier NCRs' },
              { label: 'Supplier PPM', value: ncrs.length > 0 ? headerStats.ppm.toLocaleString() : '—', color: headerStats.ppm > 500 ? 'text-red-400' : 'text-emerald-400', sub: 'Target < 500 PPM' },
              { label: 'Open SCARs', value: ncrs.length > 0 ? `${headerStats.openSCARs}` : '—', color: headerStats.openSCARs > 0 ? 'text-blue-400' : 'text-emerald-400', sub: 'Awaiting supplier response' },
              { label: 'Total Debit', value: ncrs.length > 0 ? `₹${(headerStats.totalDebit / 1000).toFixed(1)}K` : '—', color: 'text-orange-400', sub: 'Cost recovery (MTD)' },
              { label: 'D-Rated Suppliers', value: scorecards.length > 0 ? `${headerStats.dRated}` : '—', color: headerStats.dRated > 0 ? 'text-red-400' : 'text-emerald-400', sub: 'Disqualification pending' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-600 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <NCRRegisterTab ncrs={ncrs} />}
        {activeTab === 1 && <ScorecardTab scorecards={scorecards} />}
        {activeTab === 2 && <KnowledgeHubTab />}
        {activeTab === 3 && <SQAGuideTab />}
      </div>
    </div>
  );
}
