'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Severity    = 'critical' | 'major' | 'minor';
type Disposition = 'pending' | 'use-as-is' | 'rework' | 'scrap' | 'return-to-supplier' | 'sort';
type NCRStatus   = 'open' | 'under-investigation' | 'disposition-pending' | 'closed' | 'escalated';
type DetectPoint = 'incoming' | 'in-process' | 'final-inspection' | 'customer-return' | 'patrol';

interface Why {
  level: number;
  text: string;
}

interface NCR {
  id: string;
  date: string;
  shift: 'A' | 'B' | 'C';
  line: string;
  operation: string;
  partNumber: string;
  partName: string;
  defectType: string;
  defectDescription: string;
  severity: Severity;
  detectPoint: DetectPoint;
  qtyProduced: number;
  qtyDefective: number;
  disposition: Disposition;
  dispositionApprover: string;
  reworkCost: number;
  scrapCost: number;
  status: NCRStatus;
  whys: Why[];
  correctiveAction: string;
  preventiveAction: string;
  owner: string;
  targetDate: string;
  closureDate: string;
  capaRaised: boolean;
  repeatNCR: boolean;
  notes: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFECT_TYPES = [
  'Dimensional Out-of-Spec','Surface Defect','Visual Defect','Porosity / Void','Crack / Fracture',
  'Wrong Material','Missing Component','Wrong Part / Mix-up','Assembly Error','Weld Defect',
  'Paint / Coating Defect','Burr / Sharp Edge','Contamination','Functional Failure','Label / Marking Error',
  'Rust / Corrosion','Hardness Out-of-Spec','Torque / Fastener Error','Leak Fail','Other',
];
const LINES = ['Stamping Line 1','Stamping Line 2','Welding Line','Painting Line','Assembly Line 1','Assembly Line 2','Machining Cell','Casting Bay','Inspection Area','Incoming Store','FG Store'];
const OPERATIONS = ['Op-10 Blanking','Op-20 Drawing','Op-30 Trimming','Op-40 Piercing','Op-50 MIG Welding','Op-60 TIG Welding','Op-70 Pre-treatment','Op-80 Powder Coating','Op-90 Assembly','Op-100 Torquing','Op-110 Final Inspection','Op-120 Packing','Incoming Inspection','Patrol Inspection'];

const SEV_COLOR: Record<Severity, string>      = { critical:'bg-red-800/70 text-red-200', major:'bg-amber-800/70 text-amber-200', minor:'bg-blue-800/70 text-blue-200' };
const SEV_LABEL: Record<Severity, string>      = { critical:'🔴 Critical', major:'🟡 Major', minor:'🔵 Minor' };
const DISP_COLOR: Record<Disposition, string>  = {
  'pending':'text-gray-400','use-as-is':'text-green-400','rework':'text-amber-400',
  'scrap':'text-red-400','return-to-supplier':'text-purple-400','sort':'text-cyan-400',
};
const DISP_LABEL: Record<Disposition, string>  = {
  'pending':'⏳ Pending','use-as-is':'✅ Use-As-Is','rework':'🔧 Rework',
  'scrap':'🗑 Scrap','return-to-supplier':'↩ Return to Supplier','sort':'🔍 Sort',
};
const STATUS_COLOR: Record<NCRStatus, string>  = {
  'open':'bg-red-900/50 text-red-300','under-investigation':'bg-blue-900/50 text-blue-300',
  'disposition-pending':'bg-amber-900/50 text-amber-300','closed':'bg-green-900/50 text-green-300',
  'escalated':'bg-purple-900/50 text-purple-300',
};
const STATUS_LABEL: Record<NCRStatus, string>  = {
  'open':'🔴 Open','under-investigation':'🔄 Investigating','disposition-pending':'⏳ Disposition',
  'closed':'✅ Closed','escalated':'🚨 Escalated to CAPA',
};
const DETECT_LABEL: Record<DetectPoint, string> = {
  'incoming':'📥 Incoming','in-process':'⚙️ In-Process','final-inspection':'🔬 Final Inspection',
  'customer-return':'👥 Customer Return','patrol':'🚶 Patrol',
};

const inp = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500';
const lbl = 'text-xs text-gray-400 block mb-1';

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_NCRS: NCR[] = [
  {
    id:'NCR-2025-001', date:'2025-06-02', shift:'A', line:'Stamping Line 1', operation:'Op-20 Drawing',
    partNumber:'BKT-A001', partName:'Mounting Bracket', defectType:'Dimensional Out-of-Spec',
    defectDescription:'Hole diameter at Op-20 found 12.42mm vs drawing spec 12.50±0.05mm. 43 pieces affected.',
    severity:'major', detectPoint:'in-process', qtyProduced:200, qtyDefective:43,
    disposition:'sort', dispositionApprover:'Sunita Rao (QE)',
    reworkCost:860, scrapCost:0, status:'closed', capaRaised:false, repeatNCR:false,
    whys:[
      {level:1,text:'Hole diameter found 12.42mm, LSL is 12.45mm'},
      {level:2,text:'Punch worn beyond permissible limit — punch diameter 12.38mm'},
      {level:3,text:'Punch change interval not followed — should be every 5000 strokes, actual 8200 strokes'},
      {level:4,text:'No counter / alert on press for punch change interval'},
      {level:5,text:'PM plan does not include punch wear monitoring; tooling control SOP not linked to control plan'},
    ],
    correctiveAction:'Replaced worn punch. 100% inspection of all 200 pieces. 43 pieces outside spec scrapped after sort.',
    preventiveAction:'Installed stroke counter on Stamping Line 1. Punch change interval added to Control Plan. Tool maintenance SOP updated.',
    owner:'Tooling Engineer — R. Sharma', targetDate:'2025-06-20', closureDate:'2025-06-18',
    notes:'Root cause confirmed via measurement of pulled punch. Punch diameter was 12.38mm (new: 12.52mm).',
  },
  {
    id:'NCR-2025-002', date:'2025-06-15', shift:'B', line:'Welding Line', operation:'Op-50 MIG Welding',
    partNumber:'ASSY-B002', partName:'Bracket Assembly',  defectType:'Weld Defect',
    defectDescription:'Porosity and incomplete fusion observed on weld bead at joint J-3. Detected during patrol inspection.',
    severity:'critical', detectPoint:'patrol', qtyProduced:150, qtyDefective:12,
    disposition:'scrap', dispositionApprover:'Quality Head — P. Joshi',
    reworkCost:0, scrapCost:4800, status:'escalated', capaRaised:true, repeatNCR:true,
    whys:[
      {level:1,text:'Porosity and incomplete fusion at weld joint J-3'},
      {level:2,text:'Welding wire moisture content high — wire exposed for >48 hours'},
      {level:3,text:'Wire storage cabinet door not sealed — moisture ingress'},
      {level:4,text:'Cabinet door latch broken — reported 2 weeks ago, not repaired'},
      {level:5,text:'Maintenance work order system not tracked — overdue WOs not escalated'},
    ],
    correctiveAction:'12 affected assemblies scrapped after weld integrity check. Fresh wire lot issued. All 150 pieces re-inspected.',
    preventiveAction:'CAPA raised (CAPA-2025-018). Wire storage SOP updated — max 8hr exposure after opening. Cabinet latch replaced. Weekly PM checklist includes cabinet seals.',
    owner:'Welding Supervisor — D. Patil', targetDate:'2025-07-15', closureDate:'',
    notes:'This is 3rd repeat NCR for weld porosity in 6 months. CAPA mandatory. Escalated to Quality Head.',
  },
  {
    id:'NCR-2025-003', date:'2025-07-01', shift:'A', line:'Assembly Line 1', operation:'Op-90 Assembly',
    partNumber:'ASSY-C004', partName:'Cover Assembly', defectType:'Missing Component',
    defectDescription:'Rubber grommet missing from 6 assemblies detected at final inspection.',
    severity:'major', detectPoint:'final-inspection', qtyProduced:80, qtyDefective:6,
    disposition:'rework', dispositionApprover:'Sunita Rao (QE)',
    reworkCost:300, scrapCost:0, status:'closed', capaRaised:false, repeatNCR:false,
    whys:[
      {level:1,text:'Rubber grommet missing in 6 assemblies'},
      {level:2,text:'Grommet bin at workstation empty — operator skipped step'},
      {level:3,text:'No bin-empty alert or poka-yoke at grommet assembly step'},
      {level:4,text:'Assembly WI does not specify min stock level or kanban signal for grommet'},
    ],
    correctiveAction:'6 assemblies reworked — grommets fitted and re-inspected. 100% visual check on all 80 pieces.',
    preventiveAction:'Kanban card added to grommet bin — reorder at 20pcs. Poka-yoke (proximity sensor) proposed for grommet station. WI updated.',
    owner:'Assembly Supervisor — M. Kulkarni', targetDate:'2025-07-20', closureDate:'2025-07-15',
    notes:'Poka-yoke implementation in progress — target Aug 2025.',
  },
  {
    id:'NCR-2025-004', date:'2025-07-10', shift:'C', line:'Machining Cell', operation:'Op-40 Piercing',
    partNumber:'SHF-D010', partName:'Shaft Flange', defectType:'Surface Defect',
    defectDescription:'Scratches on mating surface of shaft flange. 8 pieces found during in-process patrol.',
    severity:'minor', detectPoint:'patrol', qtyProduced:60, qtyDefective:8,
    disposition:'pending', dispositionApprover:'',
    reworkCost:0, scrapCost:0, status:'under-investigation', capaRaised:false, repeatNCR:false,
    whys:[{level:1,text:'Surface scratches on mating face'},{level:2,text:'Parts stacked directly in metal bin without protection'},{level:3,text:''}],
    correctiveAction:'', preventiveAction:'',
    owner:'Machining Engineer — V. Nair', targetDate:'2025-07-25', closureDate:'',
    notes:'Disposition to be decided after customer engineering review.',
  },
];

export default function InternalNCRPage() {
  const [tab, setTab] = useState<'tracker'|'knowledge'|'guide'>('tracker');
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus]     = useState<string>('all');

  const [form, setForm] = useState<Partial<NCR>>({ shift:'A', severity:'major', detectPoint:'in-process', disposition:'pending', status:'open', whys:[{level:1,text:''},{level:2,text:''},{level:3,text:''},{level:4,text:''},{level:5,text:''}], qtyProduced:0, qtyDefective:0, reworkCost:0, scrapCost:0, capaRaised:false, repeatNCR:false });
  const setF = (k: keyof NCR, v: unknown) => setForm(p => ({...p,[k]:v}));
  const setWhy = (i: number, text: string) => setForm(p => ({...p, whys: (p.whys||[]).map((w,idx) => idx===i?{...w,text}:w)}));

  const loadSample = () => { setNcrs(SAMPLE_NCRS); setExpandedId('NCR-2025-001'); };

  const addNCR = () => {
    if (!form.id && !form.partNumber) return;
    const n: NCR = {
      id: form.id || `NCR-${Date.now()}`,
      date: form.date || new Date().toISOString().split('T')[0],
      shift: form.shift as 'A'|'B'|'C' || 'A',
      line: form.line || '', operation: form.operation || '',
      partNumber: form.partNumber || '', partName: form.partName || '',
      defectType: form.defectType || '', defectDescription: form.defectDescription || '',
      severity: form.severity as Severity || 'major',
      detectPoint: form.detectPoint as DetectPoint || 'in-process',
      qtyProduced: Number(form.qtyProduced)||0, qtyDefective: Number(form.qtyDefective)||0,
      disposition: 'pending', dispositionApprover: '',
      reworkCost: Number(form.reworkCost)||0, scrapCost: Number(form.scrapCost)||0,
      status: 'open',
      whys: form.whys || [{level:1,text:''},{level:2,text:''},{level:3,text:''},{level:4,text:''},{level:5,text:''}],
      correctiveAction: form.correctiveAction||'', preventiveAction: form.preventiveAction||'',
      owner: form.owner||'', targetDate: form.targetDate||'', closureDate: '',
      capaRaised: false, repeatNCR: false, notes: form.notes||'',
    };
    setNcrs(p => [n,...p]);
    setForm({ shift:'A', severity:'major', detectPoint:'in-process', disposition:'pending', status:'open', whys:[{level:1,text:''},{level:2,text:''},{level:3,text:''},{level:4,text:''},{level:5,text:''}], qtyProduced:0, qtyDefective:0, reworkCost:0, scrapCost:0, capaRaised:false, repeatNCR:false });
    setShowForm(false);
    setExpandedId(n.id);
  };

  const updateStatus = (id: string, status: NCRStatus) =>
    setNcrs(p => p.map(n => n.id===id ? {...n, status, closureDate: status==='closed'?new Date().toISOString().split('T')[0]:n.closureDate} : n));
  const updateDisp = (id: string, disposition: Disposition) =>
    setNcrs(p => p.map(n => n.id===id ? {...n, disposition} : n));
  const toggleCapa = (id: string) =>
    setNcrs(p => p.map(n => n.id===id ? {...n, capaRaised:!n.capaRaised, status: !n.capaRaised?'escalated':n.status} : n));

  const filtered = useMemo(() => ncrs.filter(n =>
    (filterSeverity==='all' || n.severity===filterSeverity) &&
    (filterStatus==='all' || n.status===filterStatus)
  ), [ncrs, filterSeverity, filterStatus]);

  // Stats
  const total      = ncrs.length;
  const open       = ncrs.filter(n => n.status==='open'||n.status==='under-investigation'||n.status==='disposition-pending').length;
  const critical   = ncrs.filter(n => n.severity==='critical').length;
  const repeats    = ncrs.filter(n => n.repeatNCR).length;
  const totalCOPQ  = ncrs.reduce((s,n) => s+n.reworkCost+n.scrapCost, 0);
  const totalScrap = ncrs.reduce((s,n) => s+n.qtyDefective, 0);
  const totalProd  = ncrs.reduce((s,n) => s+n.qtyProduced, 0);
  const overallPPM = totalProd > 0 ? Math.round((totalScrap/totalProd)*1_000_000) : 0;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="bg-gradient-to-br from-red-950 via-rose-950 to-slate-900 border-b border-red-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔴</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Internal NCR Management</h1>
                <p className="text-red-300 text-xs mt-0.5">IATF 16949 Cl. 10.2 · Non-Conformance Register · 5-Why RCA · COPQ Tracking · CAPA Escalation</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-red-300">{open}/{total}</div>
                <div className="text-xs text-red-400">Open NCRs</div>
              </div>
              {critical > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-300">{critical}</div>
                  <div className="text-xs text-red-400">Critical</div>
                </div>
              )}
              {repeats > 0 && (
                <div className="bg-purple-900/60 border border-purple-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-purple-300">{repeats}</div>
                  <div className="text-xs text-purple-400">Repeat NCRs</div>
                </div>
              )}
              <div className="bg-amber-900/60 border border-amber-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-amber-300">₹{totalCOPQ.toLocaleString()}</div>
                <div className="text-xs text-amber-400">COPQ</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-white">{overallPPM.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Internal PPM</div>
              </div>
              <button onClick={loadSample} className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">🧪 Load Sample</button>
              <button onClick={() => setShowForm(true)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-colors">+ New NCR</button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-red-800/40">
            {([
              {id:'tracker',   label:'🔴 NCR Tracker'},
              {id:'knowledge', label:'📚 Knowledge Hub'},
              {id:'guide',     label:'📋 NCR Guide'},
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${tab===t.id?'bg-white/10 text-white border-b-2 border-red-400':'text-red-300 hover:text-white hover:bg-white/5'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TRACKER */}
      {tab === 'tracker' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* Filters */}
            {ncrs.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
                <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="under-investigation">Investigating</option>
                  <option value="disposition-pending">Disposition Pending</option>
                  <option value="closed">Closed</option>
                  <option value="escalated">Escalated to CAPA</option>
                </select>
                <span className="text-xs text-gray-500 self-center">Showing {filtered.length} of {ncrs.length} NCRs</span>
              </div>
            )}

            {/* New NCR Form */}
            {showForm && (
              <div className="bg-gray-900 border border-red-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white">+ New Internal NCR</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xs">✕ Cancel</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><label className={lbl}>NCR Number</label><input className={inp} placeholder="NCR-2025-005" value={form.id||''} onChange={e => setF('id',e.target.value)} /></div>
                  <div><label className={lbl}>Date</label><input type="date" className={inp} value={form.date||''} onChange={e => setF('date',e.target.value)} /></div>
                  <div><label className={lbl}>Shift</label>
                    <select className={inp} value={form.shift} onChange={e => setF('shift',e.target.value)}>
                      <option value="A">A Shift</option><option value="B">B Shift</option><option value="C">C Shift</option>
                    </select>
                  </div>
                  <div><label className={lbl}>Severity</label>
                    <select className={inp} value={form.severity} onChange={e => setF('severity',e.target.value)}>
                      <option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><label className={lbl}>Part Number</label><input className={inp} placeholder="BKT-A001" value={form.partNumber||''} onChange={e => setF('partNumber',e.target.value)} /></div>
                  <div><label className={lbl}>Part Name</label><input className={inp} placeholder="Mounting Bracket" value={form.partName||''} onChange={e => setF('partName',e.target.value)} /></div>
                  <div><label className={lbl}>Line</label>
                    <select className={inp} value={form.line||''} onChange={e => setF('line',e.target.value)}>
                      <option value="">Select line...</option>
                      {LINES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Operation</label>
                    <select className={inp} value={form.operation||''} onChange={e => setF('operation',e.target.value)}>
                      <option value="">Select operation...</option>
                      {OPERATIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><label className={lbl}>Defect Type</label>
                    <select className={inp} value={form.defectType||''} onChange={e => setF('defectType',e.target.value)}>
                      <option value="">Select type...</option>
                      {DEFECT_TYPES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Detection Point</label>
                    <select className={inp} value={form.detectPoint} onChange={e => setF('detectPoint',e.target.value)}>
                      <option value="in-process">In-Process</option>
                      <option value="incoming">Incoming</option>
                      <option value="final-inspection">Final Inspection</option>
                      <option value="patrol">Patrol</option>
                      <option value="customer-return">Customer Return</option>
                    </select>
                  </div>
                  <div><label className={lbl}>Qty Produced</label><input type="number" className={inp} value={form.qtyProduced||''} onChange={e => setF('qtyProduced',Number(e.target.value))} /></div>
                  <div><label className={lbl}>Qty Defective</label><input type="number" className={inp} value={form.qtyDefective||''} onChange={e => setF('qtyDefective',Number(e.target.value))} /></div>
                </div>
                <div className="mb-3"><label className={lbl}>Defect Description</label><textarea className={inp+' resize-none'} rows={2} placeholder="Describe the non-conformance in detail..." value={form.defectDescription||''} onChange={e => setF('defectDescription',e.target.value)} /></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div><label className={lbl}>Responsible Owner</label><input className={inp} placeholder="Engineer / Supervisor" value={form.owner||''} onChange={e => setF('owner',e.target.value)} /></div>
                  <div><label className={lbl}>Target Close Date</label><input type="date" className={inp} value={form.targetDate||''} onChange={e => setF('targetDate',e.target.value)} /></div>
                  <div><label className={lbl}>Notes</label><input className={inp} value={form.notes||''} onChange={e => setF('notes',e.target.value)} /></div>
                </div>
                <div className="flex items-end gap-3">
                  <button onClick={addNCR} className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-6 py-2 rounded-xl transition-colors">Add NCR</button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {ncrs.length === 0 && (
              <div className="bg-gray-900 border border-gray-700 border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🔴</div>
                <p className="text-gray-400 text-sm">No NCRs logged. Click <span className="text-red-400">🧪 Load Sample</span> to see examples or <span className="text-red-400">+ New NCR</span> to raise one.</p>
              </div>
            )}

            {/* NCR Cards */}
            {filtered.map(ncr => {
              const isOpen = expandedId === ncr.id;
              const ppm = ncr.qtyProduced > 0 ? Math.round((ncr.qtyDefective/ncr.qtyProduced)*1_000_000) : 0;
              return (
                <div key={ncr.id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${ncr.severity==='critical'?'border-red-700/60':ncr.severity==='major'?'border-amber-700/40':'border-gray-700'}`}>
                  <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isOpen?null:ncr.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold text-sm font-mono">{ncr.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${SEV_COLOR[ncr.severity]}`}>{SEV_LABEL[ncr.severity]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[ncr.status]}`}>{STATUS_LABEL[ncr.status]}</span>
                        {ncr.repeatNCR && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-300 font-bold">🔁 REPEAT</span>}
                        {ncr.capaRaised && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900 text-orange-300">🚨 CAPA</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>📅 {ncr.date}</span>
                        <span>🔧 {ncr.partNumber} — {ncr.partName}</span>
                        <span>📍 {ncr.line} · {ncr.operation}</span>
                        <span>{DETECT_LABEL[ncr.detectPoint]}</span>
                        <span className="text-red-400 font-semibold">{ncr.qtyDefective} defective / {ncr.qtyProduced} produced ({ppm.toLocaleString()} PPM)</span>
                        {(ncr.reworkCost+ncr.scrapCost)>0 && <span className="text-amber-400">₹{(ncr.reworkCost+ncr.scrapCost).toLocaleString()} COPQ</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-white focus:outline-none" value={ncr.status} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();updateStatus(ncr.id,e.target.value as NCRStatus);}}>
                        <option value="open">Open</option>
                        <option value="under-investigation">Investigating</option>
                        <option value="disposition-pending">Disposition Pending</option>
                        <option value="closed">Closed</option>
                        <option value="escalated">Escalated to CAPA</option>
                      </select>
                      <span className="text-gray-500 text-sm">{isOpen?'▾':'▸'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-800 px-5 py-4 space-y-4">
                      {/* Defect Info */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Defect Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                          {[
                            ['Defect Type',ncr.defectType],['Shift',`${ncr.shift} Shift`],
                            ['Qty Produced',ncr.qtyProduced.toString()],['Qty Defective',ncr.qtyDefective.toString()],
                            ['PPM',ppm.toLocaleString()],['Detection',DETECT_LABEL[ncr.detectPoint]],
                            ['Rework Cost',`₹${ncr.reworkCost.toLocaleString()}`],['Scrap Cost',`₹${ncr.scrapCost.toLocaleString()}`],
                          ].map(([l,v]) => (
                            <div key={l} className="bg-gray-800 rounded-lg px-3 py-2">
                              <div className="text-gray-500">{l}</div>
                              <div className="text-white font-semibold mt-0.5">{v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-300">{ncr.defectDescription}</div>
                      </div>

                      {/* Disposition */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Disposition</h4>
                        <div className="flex items-center gap-3 flex-wrap">
                          <select className="text-sm bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none" value={ncr.disposition} onChange={e => updateDisp(ncr.id,e.target.value as Disposition)}>
                            <option value="pending">Pending Decision</option>
                            <option value="use-as-is">Use-As-Is (UAI)</option>
                            <option value="rework">Rework</option>
                            <option value="scrap">Scrap</option>
                            <option value="sort">Sort (100% Inspection)</option>
                            <option value="return-to-supplier">Return to Supplier</option>
                          </select>
                          <span className={`text-sm font-bold ${DISP_COLOR[ncr.disposition]}`}>{DISP_LABEL[ncr.disposition]}</span>
                          {ncr.dispositionApprover && <span className="text-xs text-gray-500">Approved by: <span className="text-gray-300">{ncr.dispositionApprover}</span></span>}
                          <button onClick={() => toggleCapa(ncr.id)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${ncr.capaRaised?'bg-orange-900 text-orange-300 hover:bg-orange-800':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                            {ncr.capaRaised?'🚨 CAPA Raised':'+ Raise CAPA'}
                          </button>
                        </div>
                      </div>

                      {/* 5-Why */}
                      {ncr.whys.some(w => w.text) && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">5-Why Root Cause Analysis</h4>
                          <div className="space-y-2">
                            {ncr.whys.filter(w => w.text).map((w,i) => (
                              <div key={i} className="flex items-start gap-3 bg-gray-800 rounded-lg px-4 py-2.5">
                                <span className="bg-red-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">W{w.level}</span>
                                <span className="text-gray-300 text-sm">{w.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {(ncr.correctiveAction || ncr.preventiveAction) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {ncr.correctiveAction && (
                            <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-4">
                              <div className="text-amber-300 font-bold text-xs mb-1">🔧 Corrective Action</div>
                              <p className="text-gray-300 text-xs leading-relaxed">{ncr.correctiveAction}</p>
                            </div>
                          )}
                          {ncr.preventiveAction && (
                            <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4">
                              <div className="text-green-300 font-bold text-xs mb-1">🛡 Preventive Action</div>
                              <p className="text-gray-300 text-xs leading-relaxed">{ncr.preventiveAction}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Owner / Dates */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {ncr.owner && <span>Owner: <span className="text-gray-300">{ncr.owner}</span></span>}
                        {ncr.targetDate && <span>Target: <span className="text-gray-300">{ncr.targetDate}</span></span>}
                        {ncr.closureDate && <span>Closed: <span className="text-green-400">{ncr.closureDate}</span></span>}
                        {ncr.notes && <span className="text-gray-600 italic">{ncr.notes}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KNOWLEDGE HUB */}
      {tab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-6">

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">🔴 What is an Internal NCR?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                An Internal Non-Conformance Report (NCR) is raised when a product or process does not meet specified requirements — detected before reaching the customer. IATF 16949 Cl. 8.7 requires control of nonconforming outputs, and Cl. 10.2 requires corrective action for all nonconformities. Internal NCRs are the primary driver of COPQ and the most important leading indicator of potential customer escapes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {icon:'📋',title:'Cl. 8.7 — Control of Nonconforming Output',desc:'All nonconforming product must be identified, segregated, and dispositioned. Disposition requires documented authority. Customer approval needed for Use-As-Is on CC/SC characteristics.'},
                  {icon:'🔧',title:'Cl. 10.2 — Corrective Action',desc:'Every NC must have root cause analysis and corrective action. Corrective action must be documented, implemented, and verified for effectiveness. Actions must address systemic causes, not just symptoms.'},
                  {icon:'📊',title:'Cl. 10.2.6 — COPQ & Trending',desc:'IATF requires monitoring and analysis of internal rejection rates, scrap costs, and rework costs. Trends must be reviewed at Management Review. Repeat NCs must be escalated to CAPA.'},
                ].map(c => (
                  <div key={c.title} className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-red-300 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-amber-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">⚖️ NCR Severity Classification</h2>
              <div className="space-y-3">
                {[
                  {sev:'🔴 Critical',bg:'bg-red-900/30 border-red-800/40',criteria:['Affects safety-critical (CC) characteristic','May cause customer injury or regulatory violation','100% inspection of all suspect material mandatory','Immediate containment and line stop required','Customer notification may be required','CAPA mandatory — root cause must be systemic'],copq:'Typically highest COPQ — 100% sort or scrap'},
                  {sev:'🟡 Major',bg:'bg-amber-900/30 border-amber-800/40',criteria:['Affects significant (SC) or functional characteristic','Customer would reject or complain if received','Suspect material must be segregated','CAPA required if repeat occurrence','Disposition approval from Quality Engineer minimum','Rework or sort typically required'],copq:'Medium COPQ — rework or sort cost significant'},
                  {sev:'🔵 Minor',bg:'bg-blue-900/30 border-blue-800/40',criteria:['Cosmetic or minor process deviation','Customer unlikely to reject','Not related to CC or SC characteristics','Corrective action documented but CAPA optional','Supervisor-level disposition authority','Often can be reworked or used as-is with concession'],copq:'Lowest COPQ — often reworked in-line'},
                ].map(s => (
                  <div key={s.sev} className={`border rounded-xl p-4 ${s.bg}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm mb-2">{s.sev}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {s.criteria.map((c,i) => <div key={i} className="flex items-start gap-2 text-xs"><span className="text-gray-500 flex-shrink-0">•</span><span className="text-gray-400">{c}</span></div>)}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 italic">{s.copq}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🗑 Disposition Decision Guide</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 pr-4">Disposition</th>
                      <th className="text-left py-2 pr-4">When to Use</th>
                      <th className="text-left py-2 pr-4">Authority Required</th>
                      <th className="text-left py-2">IATF Note</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {[
                      ['✅ Use-As-Is (UAI)','Deviation does not affect fit/function/safety. Characteristic still within print tolerance.','Quality Manager + Customer approval for CC/SC','Customer concession required if CC/SC affected. Document technical justification.'],
                      ['🔧 Rework','Part can be brought to conformance by additional operation.','Quality Engineer','Reworked parts must be re-inspected to original acceptance criteria. Document rework method.'],
                      ['🔍 Sort (100%)','Some parts may be conforming. Need to separate OK from NOK.','Quality Engineer','Sort must be documented with before/after quantities. Sorter must be trained and independent.'],
                      ['🗑 Scrap','Part cannot be reworked and is not fit for use.','Quality Engineer','Scrap must be physically defaced/destroyed to prevent accidental use. Scrap cost recorded.'],
                      ['↩ Return to Supplier','Nonconformance is supplier-caused. Parts returned with NCR to supplier.','Supplier Quality Engineer','Raise supplier NCR. 8D response required from supplier. Debit note as applicable.'],
                    ].map(([d,w,a,n]) => (
                      <tr key={d} className="border-b border-gray-800">
                        <td className="py-3 pr-4 text-white font-semibold whitespace-nowrap">{d}</td>
                        <td className="py-3 pr-4 text-gray-400">{w}</td>
                        <td className="py-3 pr-4 text-amber-300">{a}</td>
                        <td className="py-3 text-gray-500">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">💰 COPQ — Cost of Poor Quality Tracking</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {cat:'Internal Failure Costs (tracked in NCR)',items:['Scrap cost (material + labour + overhead)','Rework cost (labour hours × rate)','Sort cost (100% inspection labour)','Re-inspection cost after rework','Downtime caused by quality stop','Tooling damage from NC production']},
                  {cat:'How to Use COPQ Data',items:['Report COPQ trend monthly at Quality MRM','Identify top 3 defect types by cost — prioritise CAPA','Compare scrap cost before/after corrective action','Use COPQ to justify poka-yoke investment','IATF Cl. 9.3.2 — COPQ is a mandatory MRM input','Customer PPM vs Internal PPM — measure detection effectiveness']},
                ].map(c => (
                  <div key={c.cat} className="bg-green-900/20 border border-green-800/30 rounded-xl p-4">
                    <div className="text-green-300 font-bold text-sm mb-2">{c.cat}</div>
                    {c.items.map((i,idx) => <div key={idx} className="flex items-start gap-2 mb-1 text-xs"><span className="text-green-600 flex-shrink-0">✓</span><span className="text-gray-400">{i}</span></div>)}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GUIDE */}
      {tab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">NCR Management — Step-by-Step</h2>
              <p className="text-gray-400 text-sm mt-1">IATF 16949 Cl. 8.7 & 10.2 · From Detection to Systemic Prevention</p>
            </div>

            {[
              {step:1,icon:'🚨',title:'Detect and Immediately Contain',body:'The moment a nonconformance is found, STOP — do not pass it forward. Segregate ALL suspect material (same lot, same shift, same setup). Red tag every piece in the suspect batch. Quantity count: how many produced, how many defective, what is the suspect window. Issue a Hold Notice. Customer-bound stock: check FG store and in-transit — initiate field containment if any pieces may have shipped.'},
              {step:2,icon:'📋',title:'Raise the NCR — Document Everything',body:'Raise the NCR within 1 hour of detection. Record: part number, operation, defect type, quantities, detection point, shift, line. Attach photos — one photo of a defective part is worth 1000 words. Classify severity (Critical/Major/Minor). Assign an owner. Set target close date (Critical: 24–48 hrs for containment, 30 days for root cause. Major: 45 days. Minor: 60 days).'},
              {step:3,icon:'⚖️',title:'Decide Disposition — with Authority',body:'Never release or use nonconforming material without a documented disposition decision. Use-As-Is requires technical justification and customer approval for CC/SC characteristics. Rework requires a documented rework instruction and re-inspection after rework. Scrap must be physically defaced. Document who approved the disposition and the technical basis for the decision.'},
              {step:4,icon:'🔍',title:'Root Cause Analysis — Go to the Gemba',body:'Do not accept "operator error" or "material defect" as a root cause. Use 5-Why to get to the systemic cause. Physical visit to the workstation is mandatory — ask the operator, look at the process, measure the defective parts. Fishbone diagram for complex or repeated issues. Root cause must explain WHY the defect occurred AND why it was not detected earlier (escape point analysis). Check if the PFMEA has this failure mode — if not, update it.'},
              {step:5,icon:'🔧',title:'Implement Corrective and Preventive Action',body:'Corrective action = fix this specific problem (immediate). Preventive action = prevent recurrence system-wide (systemic). Examples of weak CA/PA: "trained operator" alone, "increased inspection frequency" alone, "supervisor to monitor." Strong CA/PA: poka-yoke installed, control plan updated, PFMEA updated, SPC added for the characteristic, tooling change interval added to PM plan.'},
              {step:6,icon:'📊',title:'Verify Effectiveness — Do Not Just Close',body:'Effectiveness verification = evidence that the corrective action actually prevented recurrence. Minimum: production data from after the action showing no repeat occurrence (typically 30–90 days production). Better: Cpk data, SPC chart showing stable process, zero repeat NCR in next 3 months. Close the NCR only after effectiveness is confirmed. If recurrence happens, escalate immediately to CAPA.'},
              {step:7,icon:'🔁',title:'Detect Repeat NCRs and Escalate',body:'A repeat NCR = same defect, same part, same operation, within 6 months. Repeat NCRs are a red flag — they mean the first corrective action was not effective. Repeat NCRs must trigger a formal CAPA with 8D methodology. Management must be notified. PFMEA must be reviewed. Repeat NCR pattern = potential major NC in your next IATF audit.'},
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-red-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><span className="text-xl">{s.icon}</span><h3 className="text-red-300 font-bold text-sm">{s.title}</h3></div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">❌ Common IATF Audit Findings — NCR Management</h2>
              <div className="space-y-2">
                {[
                  'NCR raised but no disposition documented — nonconforming material released without formal decision (Cl. 8.7)',
                  'Root cause recorded as "operator error" with no systemic corrective action — "retrained operator" is not CA (Cl. 10.2)',
                  'Corrective action closed without effectiveness verification — "action completed" is not evidence (Cl. 10.2.6)',
                  'Repeat NC on same part/operation — previous CA was not effective, no CAPA raised (Cl. 10.2)',
                  'Nonconforming parts not physically segregated — found mixed with OK parts in production area (Cl. 8.7.1)',
                  'PFMEA not updated after NC — failure mode exists in production but not in PFMEA risk register (Cl. 8.3.3.3)',
                  'No COPQ data available for Management Review — scrap/rework costs not tracked systematically (Cl. 9.3.2)',
                  'Use-As-Is disposition on CC characteristic without customer approval — unilateral decision not permitted (Cl. 8.7)',
                ].map((m,i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
                    <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">✗</span>
                    <p className="text-red-300 text-xs leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
