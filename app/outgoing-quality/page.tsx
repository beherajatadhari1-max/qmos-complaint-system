'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type InspResult  = 'pass' | 'fail' | 'pending';
type OQCStatus   = 'pending' | 'in-progress' | 'passed' | 'failed' | 'on-hold' | 'dispatched';
type SamplingPlan = 'AQL-0.65' | 'AQL-1.0' | 'AQL-1.5' | 'AQL-2.5' | 'AQL-4.0' | '100%';

interface CharResult {
  id: string;
  characteristic: string;
  type: 'CC' | 'SC' | 'Visual' | 'Functional' | 'Dimensional';
  spec: string;
  measured: string;
  result: InspResult;
}

interface OQCLot {
  id: string;
  date: string;
  partNumber: string;
  partName: string;
  customer: string;
  lotQty: number;
  sampleSize: number;
  samplingPlan: SamplingPlan;
  acceptNumber: number;
  rejectNumber: number;
  inspector: string;
  status: OQCStatus;
  chars: CharResult[];
  defectsFound: number;
  holdReason: string;
  dispatchDate: string;
  invoiceNo: string;
  notes: string;
}

// ── AQL Sample Size Table (ANSI/ASQ Z1.4 Level II) ───────────────────────────
const AQL_TABLE: Record<string, { lotRange: string; sampleSize: number; ac065: number; ac10: number; ac15: number; ac25: number; ac40: number }[]> = {
  levels: [
    { lotRange: '2–8',      sampleSize: 2,   ac065: 0, ac10: 0, ac15: 0, ac25: 0, ac40: 0 },
    { lotRange: '9–15',     sampleSize: 3,   ac065: 0, ac10: 0, ac15: 0, ac25: 0, ac40: 0 },
    { lotRange: '16–25',    sampleSize: 5,   ac065: 0, ac10: 0, ac15: 0, ac25: 0, ac40: 0 },
    { lotRange: '26–50',    sampleSize: 8,   ac065: 0, ac10: 0, ac15: 0, ac25: 0, ac40: 0 },
    { lotRange: '51–90',    sampleSize: 13,  ac065: 0, ac10: 0, ac15: 0, ac25: 1, ac40: 1 },
    { lotRange: '91–150',   sampleSize: 20,  ac065: 0, ac10: 0, ac15: 1, ac25: 1, ac40: 2 },
    { lotRange: '151–280',  sampleSize: 32,  ac065: 0, ac10: 1, ac15: 1, ac25: 2, ac40: 3 },
    { lotRange: '281–500',  sampleSize: 50,  ac065: 0, ac10: 1, ac15: 2, ac25: 3, ac40: 5 },
    { lotRange: '501–1200', sampleSize: 80,  ac065: 1, ac10: 2, ac15: 3, ac25: 5, ac40: 7 },
    { lotRange: '1201–3200',sampleSize: 125, ac065: 1, ac10: 3, ac15: 5, ac25: 7, ac40: 10 },
    { lotRange: '3201–10000',sampleSize:200, ac065: 2, ac10: 5, ac15: 7, ac25: 10,ac40: 14 },
  ],
};

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_LOTS: OQCLot[] = [
  {
    id:'OQC-2025-001', date:'2025-06-20', partNumber:'BKT-A001', partName:'Mounting Bracket',
    customer:'Tata Motors Ltd.', lotQty:500, sampleSize:80, samplingPlan:'AQL-1.0',
    acceptNumber:2, rejectNumber:3, inspector:'Sunita Rao',
    status:'dispatched', defectsFound:1, holdReason:'',
    dispatchDate:'2025-06-21', invoiceNo:'INV-25-1042', notes:'Regular weekly dispatch. All CC/SC passed.',
    chars:[
      {id:'C1',characteristic:'Hole Dia ⌀12.50±0.05',type:'CC',spec:'12.45–12.55 mm',measured:'12.51',result:'pass'},
      {id:'C2',characteristic:'Overall Length 150±0.2',type:'SC',spec:'149.8–150.2 mm',measured:'150.1',result:'pass'},
      {id:'C3',characteristic:'Surface Finish Ra≤1.6',type:'SC',spec:'Ra ≤ 1.6 µm',measured:'1.4',result:'pass'},
      {id:'C4',characteristic:'Visual — No Burr',type:'Visual',spec:'Zero burr acceptable',measured:'1 piece minor burr',result:'fail'},
      {id:'C5',characteristic:'Marking / Label',type:'Visual',spec:'Part no. & Rev legible',measured:'All correct',result:'pass'},
      {id:'C6',characteristic:'Weight 0.85±0.02 kg',type:'Functional',spec:'0.83–0.87 kg',measured:'0.85',result:'pass'},
    ],
  },
  {
    id:'OQC-2025-002', date:'2025-07-01', partNumber:'ASSY-B002', partName:'Bracket Assembly',
    customer:'Mahindra & Mahindra', lotQty:200, sampleSize:32, samplingPlan:'AQL-1.5',
    acceptNumber:1, rejectNumber:2, inspector:'Amit Verma',
    status:'on-hold', defectsFound:3, holdReason:'3 failures on weld visual check — suspected weld quality issue from NCR-2025-002. 100% sort in progress.',
    dispatchDate:'', invoiceNo:'', notes:'Lot on hold pending sort. Customer informed.',
    chars:[
      {id:'C1',characteristic:'Weld Visual — No Porosity',type:'CC',spec:'Zero porosity per WPS',measured:'2 pcs porosity found',result:'fail'},
      {id:'C2',characteristic:'Weld Bead Width 6±1mm',type:'SC',spec:'5–7 mm',measured:'5.8',result:'pass'},
      {id:'C3',characteristic:'Assembly Dimension A 85±0.3',type:'SC',spec:'84.7–85.3 mm',measured:'85.1',result:'pass'},
      {id:'C4',characteristic:'Functional Test — No Rattle',type:'Functional',spec:'Zero rattle at 20N',measured:'1 pc rattle',result:'fail'},
      {id:'C5',characteristic:'Paint Adhesion Cross-Cut',type:'Visual',spec:'Class 0–1 per ISO 2409',measured:'Class 1',result:'pass'},
    ],
  },
  {
    id:'OQC-2025-003', date:'2025-07-10', partNumber:'SHF-D010', partName:'Shaft Flange',
    customer:'Bajaj Auto Ltd.', lotQty:1000, sampleSize:80, samplingPlan:'AQL-0.65',
    acceptNumber:1, rejectNumber:2, inspector:'Sunita Rao',
    status:'passed', defectsFound:0, holdReason:'',
    dispatchDate:'', invoiceNo:'', notes:'Ready for dispatch. Awaiting transport.',
    chars:[
      {id:'C1',characteristic:'Shaft Dia ⌀25.00-0.021',type:'CC',spec:'24.979–25.000 mm',measured:'24.992',result:'pass'},
      {id:'C2',characteristic:'Runout ≤0.02 TIR',type:'CC',spec:'≤ 0.02 mm TIR',measured:'0.012',result:'pass'},
      {id:'C3',characteristic:'Surface Hardness 58–62 HRC',type:'SC',spec:'58–62 HRC',measured:'60',result:'pass'},
      {id:'C4',characteristic:'Surface Finish Ra≤0.8',type:'SC',spec:'Ra ≤ 0.8 µm',measured:'0.6',result:'pass'},
      {id:'C5',characteristic:'Visual — No Scratch/Dent',type:'Visual',spec:'Per drawing note 7',measured:'OK',result:'pass'},
    ],
  },
  {
    id:'OQC-2025-004', date:'2025-07-15', partNumber:'CVR-C004', partName:'Cover Assembly',
    customer:'Hero MotoCorp', lotQty:300, sampleSize:50, samplingPlan:'AQL-1.5',
    acceptNumber:2, rejectNumber:3, inspector:'Priya Sharma',
    status:'in-progress', defectsFound:0, holdReason:'',
    dispatchDate:'', invoiceNo:'', notes:'Inspection in progress.',
    chars:[
      {id:'C1',characteristic:'Gap Uniformity ≤0.5mm',type:'SC',spec:'0–0.5 mm',measured:'',result:'pending'},
      {id:'C2',characteristic:'Cover Sealing — No Leak',type:'CC',spec:'Zero leak at 0.5 bar',measured:'',result:'pending'},
      {id:'C3',characteristic:'Visual — Paint/Coating',type:'Visual',spec:'No runs, sags, bare spots',measured:'',result:'pending'},
    ],
  },
];

const CHAR_TYPES = ['CC','SC','Visual','Functional','Dimensional'] as const;
const inp = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500';
const lbl = 'text-xs text-gray-400 block mb-1';

const STATUS_COLOR: Record<OQCStatus,string> = {
  'pending':'bg-gray-700 text-gray-300','in-progress':'bg-blue-900/60 text-blue-300',
  'passed':'bg-green-900/60 text-green-300','failed':'bg-red-900/60 text-red-300',
  'on-hold':'bg-amber-900/60 text-amber-300','dispatched':'bg-emerald-900/60 text-emerald-300',
};
const STATUS_LABEL: Record<OQCStatus,string> = {
  'pending':'⏳ Pending','in-progress':'🔄 In Progress',
  'passed':'✅ Passed','failed':'❌ Failed',
  'on-hold':'🚫 On Hold','dispatched':'🚚 Dispatched',
};
const RESULT_COLOR: Record<InspResult,string> = {
  pass:'text-green-400', fail:'text-red-400', pending:'text-gray-500',
};
const RESULT_LABEL: Record<InspResult,string> = { pass:'✅ Pass', fail:'❌ Fail', pending:'— Pending' };
const TYPE_COLOR: Record<string,string> = {
  CC:'bg-red-800/60 text-red-300 font-bold', SC:'bg-amber-800/60 text-amber-300 font-bold',
  Visual:'bg-blue-800/60 text-blue-300', Functional:'bg-purple-800/60 text-purple-300',
  Dimensional:'bg-cyan-800/60 text-cyan-300',
};

export default function OutgoingQualityPage() {
  const [tab, setTab]             = useState<'oqc'|'aql'|'knowledge'|'guide'>('oqc');
  const [lots, setLots]           = useState<OQCLot[]>([]);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [form, setForm] = useState<Partial<OQCLot>>({ samplingPlan:'AQL-1.5', status:'pending', chars:[], lotQty:0, sampleSize:0, acceptNumber:0, rejectNumber:1, defectsFound:0 });
  const setF = (k: keyof OQCLot, v: unknown) => setForm(p => ({...p,[k]:v}));

  const loadSample = () => { setLots(SAMPLE_LOTS); setExpandedId('OQC-2025-001'); };

  const addLot = () => {
    if (!form.partNumber || !form.date) return;
    const lot: OQCLot = {
      id: `OQC-${Date.now()}`, date: form.date||'', partNumber: form.partNumber||'',
      partName: form.partName||'', customer: form.customer||'',
      lotQty: Number(form.lotQty)||0, sampleSize: Number(form.sampleSize)||0,
      samplingPlan: form.samplingPlan as SamplingPlan||'AQL-1.5',
      acceptNumber: Number(form.acceptNumber)||0, rejectNumber: Number(form.rejectNumber)||1,
      inspector: form.inspector||'', status: 'pending', chars: [],
      defectsFound: 0, holdReason: '', dispatchDate: '', invoiceNo: '',
      notes: form.notes||'',
    };
    setLots(p => [lot,...p]);
    setForm({ samplingPlan:'AQL-1.5', status:'pending', chars:[], lotQty:0, sampleSize:0, acceptNumber:0, rejectNumber:1, defectsFound:0 });
    setShowForm(false);
    setExpandedId(lot.id);
  };

  const updateStatus = (id: string, status: OQCStatus) =>
    setLots(p => p.map(l => l.id===id ? {...l, status} : l));

  const updateCharResult = (lotId: string, charId: string, result: InspResult, measured: string) =>
    setLots(p => p.map(l => l.id!==lotId ? l : {
      ...l,
      chars: l.chars.map(c => c.id!==charId ? c : {...c, result, measured}),
      defectsFound: l.chars.filter(c => c.id===charId ? result==='fail' : c.result==='fail').length,
    }));

  const filtered = useMemo(() =>
    lots.filter(l => filterStatus==='all' || l.status===filterStatus),
  [lots, filterStatus]);

  // Stats
  const total      = lots.length;
  const onHold     = lots.filter(l => l.status==='on-hold').length;
  const failed     = lots.filter(l => l.status==='failed').length;
  const dispatched = lots.filter(l => l.status==='dispatched').length;
  const totalParts = lots.reduce((s,l) => s+l.lotQty, 0);
  const totalDefects = lots.reduce((s,l) => s+l.defectsFound, 0);
  const oqcPPM = totalParts>0 ? Math.round((totalDefects/totalParts)*1_000_000) : 0;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="bg-gradient-to-br from-green-950 via-emerald-950 to-slate-900 border-b border-green-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📤</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Outgoing Quality Control</h1>
                <p className="text-green-300 text-xs mt-0.5">IATF 16949 Cl. 8.6 · Final Inspection · AQL Sampling · Dispatch Gate · OQC PPM Tracking</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-green-900/60 border border-green-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-green-300">{dispatched}/{total}</div>
                <div className="text-xs text-green-400">Dispatched</div>
              </div>
              {onHold > 0 && (
                <div className="bg-amber-900/60 border border-amber-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-amber-300">{onHold}</div>
                  <div className="text-xs text-amber-400">On Hold</div>
                </div>
              )}
              {failed > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-300">{failed}</div>
                  <div className="text-xs text-red-400">Failed</div>
                </div>
              )}
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-white">{oqcPPM.toLocaleString()}</div>
                <div className="text-xs text-gray-400">OQC PPM</div>
              </div>
              <button onClick={loadSample} className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">🧪 Load Sample</button>
              <button onClick={() => setShowForm(true)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-colors">+ New OQC Lot</button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-green-800/40">
            {([
              {id:'oqc',       label:'📤 OQC Register'},
              {id:'aql',       label:'📊 AQL Table'},
              {id:'knowledge', label:'📚 Knowledge Hub'},
              {id:'guide',     label:'📋 Inspection Guide'},
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${tab===t.id?'bg-white/10 text-white border-b-2 border-green-400':'text-green-300 hover:text-white hover:bg-white/5'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OQC REGISTER */}
      {tab === 'oqc' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {lots.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="dispatched">Dispatched</option>
                </select>
                <span className="text-xs text-gray-500 self-center">Showing {filtered.length} of {lots.length} lots</span>
              </div>
            )}

            {/* New Lot Form */}
            {showForm && (
              <div className="bg-gray-900 border border-green-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white">+ New OQC Lot</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xs">✕ Cancel</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><label className={lbl}>Date</label><input type="date" className={inp} value={form.date||''} onChange={e => setF('date',e.target.value)} /></div>
                  <div><label className={lbl}>Part Number</label><input className={inp} placeholder="BKT-A001" value={form.partNumber||''} onChange={e => setF('partNumber',e.target.value)} /></div>
                  <div><label className={lbl}>Part Name</label><input className={inp} placeholder="Mounting Bracket" value={form.partName||''} onChange={e => setF('partName',e.target.value)} /></div>
                  <div><label className={lbl}>Customer</label><input className={inp} placeholder="Tata Motors" value={form.customer||''} onChange={e => setF('customer',e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><label className={lbl}>Lot Qty</label><input type="number" className={inp} value={form.lotQty||''} onChange={e => setF('lotQty',Number(e.target.value))} /></div>
                  <div><label className={lbl}>Sample Size</label><input type="number" className={inp} value={form.sampleSize||''} onChange={e => setF('sampleSize',Number(e.target.value))} /></div>
                  <div><label className={lbl}>Sampling Plan</label>
                    <select className={inp} value={form.samplingPlan} onChange={e => setF('samplingPlan',e.target.value)}>
                      {(['AQL-0.65','AQL-1.0','AQL-1.5','AQL-2.5','AQL-4.0','100%'] as SamplingPlan[]).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Inspector</label><input className={inp} placeholder="Inspector name" value={form.inspector||''} onChange={e => setF('inspector',e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className={lbl}>Accept Number (Ac)</label><input type="number" className={inp} value={form.acceptNumber||''} onChange={e => setF('acceptNumber',Number(e.target.value))} /></div>
                  <div><label className={lbl}>Reject Number (Re)</label><input type="number" className={inp} value={form.rejectNumber||''} onChange={e => setF('rejectNumber',Number(e.target.value))} /></div>
                </div>
                <div className="mb-3"><label className={lbl}>Notes</label><input className={inp} value={form.notes||''} onChange={e => setF('notes',e.target.value)} /></div>
                <button onClick={addLot} className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-6 py-2 rounded-xl">Add OQC Lot</button>
              </div>
            )}

            {lots.length === 0 && (
              <div className="bg-gray-900 border border-gray-700 border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📤</div>
                <p className="text-gray-400 text-sm">No OQC lots logged. Click <span className="text-green-400">🧪 Load Sample</span> to see examples or <span className="text-green-400">+ New OQC Lot</span>.</p>
              </div>
            )}

            {filtered.map(lot => {
              const isOpen = expandedId === lot.id;
              const ccFails = lot.chars.filter(c => c.type==='CC' && c.result==='fail').length;
              const totalFails = lot.chars.filter(c => c.result==='fail').length;
              const totalInspected = lot.chars.filter(c => c.result!=='pending').length;
              const verdict = lot.defectsFound > lot.acceptNumber ? (lot.defectsFound >= lot.rejectNumber ? 'REJECT' : 'MARGINAL') : 'ACCEPT';
              return (
                <div key={lot.id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${lot.status==='on-hold'?'border-amber-700/50':lot.status==='failed'?'border-red-700/50':lot.status==='dispatched'?'border-emerald-800/30':'border-gray-700'}`}>
                  <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isOpen?null:lot.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold text-sm font-mono">{lot.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[lot.status]}`}>{STATUS_LABEL[lot.status]}</span>
                        {ccFails > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900 text-red-300 font-bold">🔴 {ccFails} CC FAIL</span>}
                        {lot.status==='on-hold' && <span className="text-xs text-amber-400 truncate max-w-xs">{lot.holdReason.slice(0,60)}…</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>📅 {lot.date}</span>
                        <span>🔧 {lot.partNumber} — {lot.partName}</span>
                        <span>👥 {lot.customer}</span>
                        <span>📦 Lot: {lot.lotQty.toLocaleString()} | Sample: {lot.sampleSize} | {lot.samplingPlan}</span>
                        {totalFails > 0 && <span className="text-red-400 font-semibold">{totalFails} defect{totalFails>1?'s':''} found</span>}
                        {lot.dispatchDate && <span className="text-emerald-400">🚚 Dispatched: {lot.dispatchDate}</span>}
                        {lot.invoiceNo && <span className="text-gray-400">INV: {lot.invoiceNo}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-white focus:outline-none" value={lot.status} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();updateStatus(lot.id,e.target.value as OQCStatus);}}>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="on-hold">On Hold</option>
                        <option value="dispatched">Dispatched</option>
                      </select>
                      <span className="text-gray-500 text-sm">{isOpen?'▾':'▸'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-800 px-5 py-4 space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        {[
                          ['Lot Size',lot.lotQty.toLocaleString()],
                          ['Sample Size',lot.sampleSize.toString()],
                          ['Ac / Re',`${lot.acceptNumber} / ${lot.rejectNumber}`],
                          ['Defects Found',lot.defectsFound.toString()],
                          ['Verdict', verdict],
                        ].map(([l,v]) => (
                          <div key={l} className={`rounded-lg px-3 py-2 ${l==='Verdict' ? (verdict==='ACCEPT'?'bg-green-900/40':'verdict'==='REJECT'?'bg-red-900/40':'bg-amber-900/40') : 'bg-gray-800'}`}>
                            <div className="text-gray-500">{l}</div>
                            <div className={`font-bold mt-0.5 ${l==='Verdict'?(verdict==='ACCEPT'?'text-green-300':verdict==='REJECT'?'text-red-300':'text-amber-300'):'text-white'}`}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {lot.holdReason && (
                        <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-3">
                          <span className="text-amber-300 font-bold text-xs">🚫 Hold Reason: </span>
                          <span className="text-amber-200 text-xs">{lot.holdReason}</span>
                        </div>
                      )}

                      {/* Characteristic Results */}
                      {lot.chars.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Inspection Results ({totalInspected}/{lot.chars.length} completed)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500 border-b border-gray-700">
                                  <th className="text-left py-2 pr-4">Characteristic</th>
                                  <th className="text-left py-2 pr-4">Type</th>
                                  <th className="text-left py-2 pr-4">Specification</th>
                                  <th className="text-left py-2 pr-4">Measured / Observed</th>
                                  <th className="text-left py-2">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lot.chars.map(c => (
                                  <tr key={c.id} className={`border-b border-gray-800 ${c.result==='fail'?'bg-red-900/10':''}`}>
                                    <td className="py-2 pr-4 text-gray-300">{c.characteristic}</td>
                                    <td className="py-2 pr-4"><span className={`px-1.5 py-0.5 rounded text-xs ${TYPE_COLOR[c.type]}`}>{c.type}</span></td>
                                    <td className="py-2 pr-4 text-gray-400">{c.spec}</td>
                                    <td className="py-2 pr-4">
                                      <input
                                        className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-xs text-white w-40 focus:outline-none focus:border-green-500"
                                        value={c.measured}
                                        placeholder="Enter value..."
                                        onChange={e => updateCharResult(lot.id, c.id, c.result, e.target.value)}
                                      />
                                    </td>
                                    <td className="py-2">
                                      <select
                                        className={`text-xs bg-gray-800 border border-gray-600 rounded px-2 py-0.5 focus:outline-none ${RESULT_COLOR[c.result]}`}
                                        value={c.result}
                                        onChange={e => updateCharResult(lot.id, c.id, e.target.value as InspResult, c.measured)}>
                                        <option value="pending">Pending</option>
                                        <option value="pass">Pass</option>
                                        <option value="fail">Fail</option>
                                      </select>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {lot.notes && <p className="text-xs text-gray-500 italic">{lot.notes}</p>}

                      {lot.inspector && (
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Inspector: <span className="text-gray-300">{lot.inspector}</span></span>
                          {lot.dispatchDate && <span>Dispatched: <span className="text-emerald-400">{lot.dispatchDate}</span></span>}
                          {lot.invoiceNo && <span>Invoice: <span className="text-gray-300">{lot.invoiceNo}</span></span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AQL TABLE */}
      {tab === 'aql' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">📊 AQL Sampling Table — ANSI/ASQ Z1.4 (Level II)</h2>
              <p className="text-gray-400 text-sm mb-5">Acceptance Quality Limit (AQL) is the maximum defect percentage considered acceptable as a process average. The table below gives sample sizes and accept/reject numbers for each lot size range at standard AQL levels.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700 text-center">
                      <th className="text-left py-3 pr-4">Lot Size Range</th>
                      <th className="py-3 px-3">Sample Size</th>
                      <th className="py-3 px-3 text-red-300">AQL 0.65<br/><span className="text-gray-600 font-normal">CC char.</span></th>
                      <th className="py-3 px-3 text-amber-300">AQL 1.0<br/><span className="text-gray-600 font-normal">SC char.</span></th>
                      <th className="py-3 px-3 text-blue-300">AQL 1.5<br/><span className="text-gray-600 font-normal">Critical visual</span></th>
                      <th className="py-3 px-3 text-green-300">AQL 2.5<br/><span className="text-gray-600 font-normal">General</span></th>
                      <th className="py-3 px-3 text-gray-300">AQL 4.0<br/><span className="text-gray-600 font-normal">Minor</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {AQL_TABLE.levels.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-800 text-center ${i%2===0?'bg-gray-800/20':''}`}>
                        <td className="py-2.5 pr-4 text-left text-gray-300 font-mono">{row.lotRange}</td>
                        <td className="py-2.5 px-3 text-white font-bold">{row.sampleSize}</td>
                        <td className="py-2.5 px-3 text-red-300">{row.ac065} / {row.ac065+1}</td>
                        <td className="py-2.5 px-3 text-amber-300">{row.ac10} / {row.ac10+1}</td>
                        <td className="py-2.5 px-3 text-blue-300">{row.ac15} / {row.ac15+1}</td>
                        <td className="py-2.5 px-3 text-green-300">{row.ac25} / {row.ac25+1}</td>
                        <td className="py-2.5 px-3 text-gray-300">{row.ac40} / {row.ac40+1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-600 mt-2">Format: Ac / Re — Accept Number / Reject Number. If defects found ≥ Re → reject the lot.</p>
              </div>
            </div>

            <div className="bg-gray-900 border border-blue-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📌 Which AQL Level to Use?</h2>
              <div className="space-y-3">
                {[
                  {level:'AQL 0.65',color:'text-red-300 bg-red-900/30',use:'Safety-critical (CC) characteristics. Any failure here has safety or regulatory impact. Use for characteristics controlling crash safety, brake performance, emissions compliance.'},
                  {level:'AQL 1.0',color:'text-amber-300 bg-amber-900/30',use:'Significant characteristics (SC) affecting vehicle performance or customer function — dimensional, torque, assembly fit-up on functional joints.'},
                  {level:'AQL 1.5',color:'text-blue-300 bg-blue-900/30',use:'Critical visual characteristics — paint, surface finish, Class A surfaces, visible welds, marking/identification. Customer would return if seen.'},
                  {level:'AQL 2.5',color:'text-green-300 bg-green-900/30',use:'General quality characteristics — dimensions not CC/SC, functional tests, standard assembly checks. Most common for automotive OQC.'},
                  {level:'AQL 4.0',color:'text-gray-300 bg-gray-800',use:'Minor characteristics — cosmetic defects that are not visible to customer in normal use, non-functional dimensions with large tolerances.'},
                  {level:'100% Inspection',color:'text-white bg-gray-700',use:'Mandated after any customer complaint, red-bin activation, or new PPAP launch. Also required for any CC characteristic if process Cpk < 1.67.'},
                ].map(r => (
                  <div key={r.level} className={`border border-gray-700 rounded-xl px-4 py-3 flex items-start gap-3 ${r.color.split(' ')[1]}`}>
                    <span className={`font-bold text-xs px-2 py-1 rounded-lg flex-shrink-0 ${r.color}`}>{r.level}</span>
                    <p className="text-gray-400 text-xs leading-relaxed">{r.use}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KNOWLEDGE HUB */}
      {tab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-6">

            <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">📤 What is Outgoing Quality Control (OQC)?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                OQC is the final quality gate before finished goods leave the plant and reach the customer. It is mandated by IATF 16949 Cl. 8.6 — no product shall be released until all planned arrangements have been satisfactorily completed. OQC is NOT a substitute for in-process control — it is the last net before customer escape.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {icon:'🔬',title:'Cl. 8.6 — Release of Products',desc:'IATF requires documented evidence that product meets all acceptance criteria before dispatch. Authorised person must sign off. CC/SC characteristics must be verified against control plan.'},
                  {icon:'📊',title:'Cl. 8.6.1 — Conformance of Products',desc:'Supplier must maintain monitoring and measurement records. PPM tracking, lot-wise results, and traceability to the lot/batch dispatched. Records must be retained as per retention policy.'},
                  {icon:'🚫',title:'Cl. 8.6.2 — Layout Inspection & FAI',desc:'Periodic layout inspection (dimensional validation against drawing — all characteristics) must be done per customer and PPAP frequency. Typically annual or after any major change.'},
                ].map(c => (
                  <div key={c.title} className="bg-green-900/20 border border-green-800/30 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-green-300 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-amber-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🚚 Dispatch Gate — What Must Be Checked</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {cat:'Dimensional / CC / SC',items:['All CC characteristics verified per sampling plan','SC dimensions checked against control plan','CMM or gauge results recorded lot-wise','Cpk trend reviewed — any OOC action completed']},
                  {cat:'Visual & Surface',items:['Surface finish checked per acceptance criteria','Visual defects: scratches, dents, rust, paint issues','Class A surfaces inspected in correct lighting','Weld visual per WPS acceptance criteria']},
                  {cat:'Functional',items:['Functional tests per control plan (fit, torque, leak, rattle)','Assembly dimensions verified (mating parts check)','Weight within tolerance (if specified)','Marking / label / part number / revision correct']},
                  {cat:'Documentation',items:['OQC inspection report signed by authorised inspector','COC / material test certificate included if required','Lot traceability — heat number, date, shift recorded','Customer-specific documentation (IMDS, PPAP, etc.)']},
                  {cat:'Packaging',items:['Parts packed per customer packaging standard','Dunnage / protection in place — no contact damage','Quantity per box / pallet per kanban/order','Label on package: part no., Rev, qty, date, supplier code']},
                  {cat:'Dispatch Hold Triggers',items:['Any CC characteristic fail → STOP, raise hold, no dispatch','Defects found ≥ Reject Number (Re) → reject lot, no dispatch','Customer complaint red-bin active for this part → 100% inspect','New PPAP/launch → interim 100% inspection until PPAP approved']},
                ].map(c => (
                  <div key={c.cat} className="bg-gray-800 rounded-xl p-4">
                    <div className="text-green-300 font-bold text-sm mb-2">{c.cat}</div>
                    {c.items.map((i,idx) => <div key={idx} className="flex items-start gap-2 mb-1 text-xs"><span className="text-green-600 flex-shrink-0">✓</span><span className="text-gray-400">{i}</span></div>)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">❌ Common IATF Audit Findings — OQC</h2>
              <div className="space-y-2">
                {[
                  'OQC inspection report signed AFTER goods already dispatched — no pre-dispatch gate (Cl. 8.6)',
                  'CC characteristic inspection results not recorded lot-wise — no traceability (Cl. 8.6.1)',
                  'Sample size not based on AQL — inspector picks "random" 5 pieces regardless of lot size',
                  'Inspection not done per control plan — characteristics checked at OQC differ from CP',
                  'Hold tag removed and lot dispatched without disposition approval — no authority trail',
                  'No periodic layout inspection (annual dimensional layout per all drawing characteristics)',
                  'Dispatch record does not capture lot number — customer complaint cannot be traced back to lot',
                  'Customer-specific packaging standard not followed — parts loose in boxes causing transit damage',
                ].map((m,i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
                    <span className="text-red-400 flex-shrink-0">✗</span>
                    <p className="text-red-300 text-xs leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION GUIDE */}
      {tab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">OQC Inspection — Step-by-Step</h2>
              <p className="text-gray-400 text-sm mt-1">IATF 16949 Cl. 8.6 · AQL Sampling · Dispatch Gate Control</p>
            </div>

            {[
              {step:1,icon:'📋',title:'Receive the Lot and Check Documentation',body:'Before picking up a gauge, verify: Is there a production traveller or lot tag? Is the internal inspection (in-process) sign-off complete? Is this lot under any hold or CAPA restriction? Check the NCR register for this part — is there an active hold? If documentation is missing or a hold is active, return the lot to production — do not begin OQC.'},
              {step:2,icon:'📊',title:'Determine Sample Size Using AQL',body:'Look up the lot quantity in the AQL table. Apply the sampling plan specified in the Control Plan for this part (usually AQL 1.0–2.5 for automotive). Calculate your sample size (n) and accept/reject numbers (Ac / Re). Randomly select samples from across the lot — do not pick only top-layer pieces. Mark sample pieces with chalk or tag.'},
              {step:3,icon:'🔬',title:'Inspect CC Characteristics First',body:'Always inspect safety-critical (CC) characteristics first. These are non-negotiable — even one failure on a CC characteristic is cause for lot rejection and dispatch hold. Use calibrated gauges only. Record actual measured values, not just pass/fail. Check gauge calibration status before use.'},
              {step:4,icon:'👁',title:'Inspect SC, Dimensional, Visual, and Functional',body:'Work through all characteristics in the Control Plan in order. Record actual values for dimensional and measurable characteristics. For visual: use standard lighting (minimum 500 lux), reference samples (limit samples), and the drawing/visual standard. Functional tests: per test method in WI. Record pass/fail with evidence.'},
              {step:5,icon:'⚖️',title:'Compare Defects Found vs Ac / Re',body:'Count total defects found in the sample. Compare to Ac (accept) and Re (reject) numbers. Defects ≤ Ac → ACCEPT the lot. Defects ≥ Re → REJECT — raise dispatch hold immediately. Defects between Ac and Re → use judgement + seek Quality Engineer/Manager decision. Note: A CC fail always means reject regardless of Ac number.'},
              {step:6,icon:'🚫',title:'Dispatch Hold — When to Stop',body:'Raise a dispatch hold immediately if: CC fail found, defects found ≥ Re, the lot has a known suspect batch issue, or an active customer complaint red-bin covers this part. Document the hold reason. Inform Quality Manager and Production. Do not allow dispatch while hold is active. Disposition decision (rework/sort/scrap) requires QE or QM authority.'},
              {step:7,icon:'✅',title:'Release and Dispatch Documentation',body:'If lot passes: complete the OQC inspection report with all results. Authorised inspector signs the report. Attach lot tag / green sticker to approved lot. File inspection report and link to dispatch record (invoice/challan). Ensure packaging is per standard before handing to store for dispatch. Customer-specific documents (COC, material cert) included in shipment if required.'},
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-green-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><span className="text-xl">{s.icon}</span><h3 className="text-green-300 font-bold text-sm">{s.title}</h3></div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
