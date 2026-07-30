'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type DefectSeverity = 'critical' | 'major' | 'minor';
type PatrolStatus   = 'ok' | 'nc-found' | 'pending';
type PKResult       = 'pass' | 'fail' | 'not-challenged';

interface PatrolDefect {
  defectType: string;
  severity: DefectSeverity;
  qty: number;
  action: string;
}

interface PatrolLog {
  id: string;
  date: string;
  shift: 'A' | 'B' | 'C';
  operation: string;
  inspector: string;
  qtyProduced: number;
  qtyRejected: number;
  status: PatrolStatus;
  defects: PatrolDefect[];
  notes: string;
}

interface PokaYoke {
  id: string;
  line: string;
  operation: string;
  description: string;
  challengeMethod: string;
  lastChallenged: string;
  result: PKResult;
  failAction: string;
  isCritical: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const OPERATIONS = [
  'Op-10 Blanking','Op-20 Drawing','Op-30 Trimming','Op-40 Piercing',
  'Op-50 MIG Welding','Op-60 TIG Welding','Op-70 Pre-treatment','Op-80 Powder Coating',
  'Op-90 Assembly','Op-100 Torquing','Op-110 Final Inspection','Op-120 Packing',
  'Stamping Line 1','Stamping Line 2','Welding Line','Painting Line',
  'Assembly Line 1','Assembly Line 2','Machining Cell',
];

const DEFECT_TYPES = [
  'Dimensional Out-of-Spec','Surface Scratch','Burr / Sharp Edge','Weld Defect',
  'Wrong Assembly','Missing Component','Paint Defect','Dimension Drift',
  'Tool Mark','Rust / Corrosion','Wrong Material','Marking Error','Other',
];

const SEV_COLOR: Record<DefectSeverity,string> = {
  critical:'bg-red-800/60 text-red-300', major:'bg-amber-800/60 text-amber-300', minor:'bg-blue-800/60 text-blue-300',
};
const SEV_LABEL: Record<DefectSeverity,string> = { critical:'🔴 Critical', major:'🟡 Major', minor:'🔵 Minor' };
const PATROL_STATUS_COLOR: Record<PatrolStatus,string> = {
  ok:'bg-green-900/50 text-green-300', 'nc-found':'bg-red-900/50 text-red-300', pending:'bg-gray-700 text-gray-400',
};
const PATROL_STATUS_LABEL: Record<PatrolStatus,string> = {
  ok:'✅ OK — No NC', 'nc-found':'🔴 NC Found', pending:'⏳ Pending',
};
const PK_COLOR: Record<PKResult,string> = {
  pass:'text-green-400', fail:'text-red-400', 'not-challenged':'text-gray-500',
};
const PK_LABEL: Record<PKResult,string> = { pass:'✅ Pass', fail:'❌ FAIL', 'not-challenged':'— Not Challenged' };

const inp = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500';
const lbl = 'text-xs text-gray-400 block mb-1';

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_PATROLS: PatrolLog[] = [
  {
    id:'PAT-001', date:'2025-07-28', shift:'A', operation:'Op-50 MIG Welding', inspector:'Ravi Pillai',
    qtyProduced:120, qtyRejected:3, status:'nc-found',
    defects:[
      {defectType:'Weld Defect',severity:'critical',qty:2,action:'Pieces quarantined, NCR raised, welding parameters verified'},
      {defectType:'Surface Scratch',severity:'minor',qty:1,action:'Reworked in-line'},
    ],
    notes:'Critical weld defect linked to open NCR-2025-002. Supervisor informed.',
  },
  {
    id:'PAT-002', date:'2025-07-28', shift:'A', operation:'Op-20 Drawing', inspector:'Sunita Rao',
    qtyProduced:200, qtyRejected:0, status:'ok',
    defects:[], notes:'All dimensions within spec. Gauge calibration verified.',
  },
  {
    id:'PAT-003', date:'2025-07-28', shift:'B', operation:'Op-90 Assembly', inspector:'Amit Verma',
    qtyProduced:85, qtyRejected:2, status:'nc-found',
    defects:[{defectType:'Missing Component',severity:'major',qty:2,action:'100% inspection triggered. Missing grommets fitted. WI review initiated.'}],
    notes:'Same defect type as NCR-2025-003. Repeat check raised.',
  },
  {
    id:'PAT-004', date:'2025-07-28', shift:'B', operation:'Op-80 Powder Coating', inspector:'Priya Sharma',
    qtyProduced:150, qtyRejected:1, status:'nc-found',
    defects:[{defectType:'Paint Defect',severity:'major',qty:1,action:'Part tagged for rework. Pre-treatment bath pH checked — within range.'}],
    notes:'First paint defect this week. Monitoring.',
  },
  {
    id:'PAT-005', date:'2025-07-28', shift:'C', operation:'Op-40 Piercing', inspector:'Ravi Pillai',
    qtyProduced:180, qtyRejected:0, status:'ok',
    defects:[], notes:'Night shift. Poka-yoke challenged and passed.',
  },
];

const SAMPLE_POKAYOKES: PokaYoke[] = [
  {id:'PY-001',line:'Stamping Line 1',operation:'Op-20 Drawing',description:'Stroke counter — punch change alert at 5000 strokes',challengeMethod:'Reset counter, run 5000 cycles, verify alert triggers',lastChallenged:'2025-07-25',result:'pass',failAction:'Stop line immediately. Replace punch. Reset counter.',isCritical:true},
  {id:'PY-002',line:'Welding Line',operation:'Op-50 MIG Welding',description:'Wire spool end sensor — stops machine when spool empty',challengeMethod:'Simulate spool empty — verify machine stops and alarm activates',lastChallenged:'2025-07-25',result:'pass',failAction:'Manual monitoring required. Notify maintenance.',isCritical:true},
  {id:'PY-003',line:'Assembly Line 1',operation:'Op-90 Assembly',description:'Grommet presence sensor — prevents next station if grommet absent',challengeMethod:'Assemble without grommet, verify sensor rejects and line stops',lastChallenged:'2025-07-18',result:'fail',failAction:'LINE STOPPED. Sensor repaired 2025-07-20. Re-challenged — PASS.',isCritical:true},
  {id:'PY-004',line:'Assembly Line 2',operation:'Op-100 Torquing',description:'Torque wrench controller — rejects if torque outside 25±2 Nm',challengeMethod:'Apply torque below 23 Nm, verify controller signals fail',lastChallenged:'2025-07-25',result:'pass',failAction:'Stop torquing. Calibrate wrench. Re-challenge before restart.',isCritical:true},
  {id:'PY-005',line:'Machining Cell',operation:'Op-40 Piercing',description:'Part presence sensor — die guard prevents press if no part loaded',challengeMethod:'Operate press without part, verify press blocked',lastChallenged:'2025-07-22',result:'pass',failAction:'Stop press. Tag as unsafe. Maintenance to repair before use.',isCritical:false},
  {id:'PY-006',line:'Painting Line',operation:'Op-70 Pre-treatment',description:'pH auto-dosing — alarm if bath pH outside 9.5–10.5',challengeMethod:'Simulate pH reading out of range, verify alarm and auto-dosing stops',lastChallenged:'2025-07-21',result:'pass',failAction:'Manual pH correction. Halt painting until pH restored.',isCritical:false},
];

export default function ProcessQualityPage() {
  const [tab, setTab] = useState<'ipqc'|'pokayoke'|'knowledge'|'guide'>('ipqc');
  const [patrols, setPatrols]   = useState<PatrolLog[]>([]);
  const [pks, setPks]           = useState<PokaYoke[]>([]);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterShift, setFilterShift] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState<Partial<PatrolLog>>({ shift:'A', status:'pending', defects:[], qtyProduced:0, qtyRejected:0 });
  const setF = (k: keyof PatrolLog, v: unknown) => setForm(p => ({...p,[k]:v}));

  const loadSample = () => {
    setPatrols(SAMPLE_PATROLS);
    setPks(SAMPLE_POKAYOKES);
    setExpandedId('PAT-001');
    setTab('ipqc');
  };

  const addPatrol = () => {
    if (!form.operation || !form.date) return;
    const p: PatrolLog = {
      id:`PAT-${Date.now()}`, date:form.date||'', shift:form.shift as 'A'|'B'|'C'||'A',
      operation:form.operation||'', inspector:form.inspector||'',
      qtyProduced:Number(form.qtyProduced)||0, qtyRejected:Number(form.qtyRejected)||0,
      status:form.qtyRejected&&Number(form.qtyRejected)>0?'nc-found':'ok',
      defects:[], notes:form.notes||'',
    };
    setPatrols(prev => [p,...prev]);
    setForm({ shift:'A', status:'pending', defects:[], qtyProduced:0, qtyRejected:0 });
    setShowForm(false);
    setExpandedId(p.id);
  };

  const updatePKResult = (id: string, result: PKResult) =>
    setPks(prev => prev.map(p => p.id===id ? {...p, result, lastChallenged:new Date().toISOString().split('T')[0]} : p));

  const filtered = useMemo(() => patrols.filter(p =>
    (filterShift==='all' || p.shift===filterShift) &&
    (filterStatus==='all' || p.status===filterStatus)
  ), [patrols, filterShift, filterStatus]);

  // Stats
  const totalProduced  = patrols.reduce((s,p) => s+p.qtyProduced, 0);
  const totalRejected  = patrols.reduce((s,p) => s+p.qtyRejected, 0);
  const ftt = totalProduced>0 ? ((totalProduced-totalRejected)/totalProduced*100).toFixed(1) : '—';
  const ippm = totalProduced>0 ? Math.round((totalRejected/totalProduced)*1_000_000) : 0;
  const ncLogs = patrols.filter(p => p.status==='nc-found').length;
  const pkFails = pks.filter(p => p.result==='fail').length;
  const criticalDefects = patrols.flatMap(p => p.defects).filter(d => d.severity==='critical').reduce((s,d) => s+d.qty, 0);

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900 border-b border-indigo-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">In-Process Quality Control (IPQC)</h1>
                <p className="text-indigo-300 text-xs mt-0.5">IATF 16949 Cl. 8.5.1 · Patrol Inspection · FTT · IPPM · Red Bin · Poka-Yoke · SPC · 4M Change Control</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-indigo-900/60 border border-indigo-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-indigo-300">{ftt}%</div>
                <div className="text-xs text-indigo-400">FTT</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-white">{ippm.toLocaleString()}</div>
                <div className="text-xs text-gray-400">IPPM</div>
              </div>
              {criticalDefects > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-300">{criticalDefects}</div>
                  <div className="text-xs text-red-400">Critical Defects</div>
                </div>
              )}
              {pkFails > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-300">{pkFails}</div>
                  <div className="text-xs text-red-400">PY Failed</div>
                </div>
              )}
              <div className="bg-amber-900/60 border border-amber-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-amber-300">{ncLogs}</div>
                <div className="text-xs text-amber-400">NC Patrols</div>
              </div>
              <button onClick={loadSample} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">🧪 Load Sample</button>
              <button onClick={() => setShowForm(true)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-colors">+ Log Patrol</button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-indigo-800/40">
            {([
              {id:'ipqc',     label:'⚙️ Patrol Log'},
              {id:'pokayoke', label:'🔒 Poka-Yoke'},
              {id:'knowledge',label:'📚 Knowledge Hub'},
              {id:'guide',    label:'📋 IPQC Guide'},
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${tab===t.id?'bg-white/10 text-white border-b-2 border-indigo-400':'text-indigo-300 hover:text-white hover:bg-white/5'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PATROL LOG */}
      {tab === 'ipqc' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {patrols.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none" value={filterShift} onChange={e => setFilterShift(e.target.value)}>
                  <option value="all">All Shifts</option>
                  <option value="A">A Shift</option>
                  <option value="B">B Shift</option>
                  <option value="C">C Shift</option>
                </select>
                <select className="text-xs bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Results</option>
                  <option value="ok">OK</option>
                  <option value="nc-found">NC Found</option>
                  <option value="pending">Pending</option>
                </select>
                <div className="flex gap-4 text-xs text-gray-500 self-center ml-2">
                  <span>Produced: <span className="text-white font-semibold">{totalProduced.toLocaleString()}</span></span>
                  <span>Rejected: <span className="text-red-400 font-semibold">{totalRejected.toLocaleString()}</span></span>
                  <span>Showing {filtered.length} of {patrols.length} logs</span>
                </div>
              </div>
            )}

            {showForm && (
              <div className="bg-gray-900 border border-indigo-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white">+ Log Patrol Inspection</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xs">✕ Cancel</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><label className={lbl}>Date</label><input type="date" className={inp} value={form.date||''} onChange={e => setF('date',e.target.value)} /></div>
                  <div><label className={lbl}>Shift</label>
                    <select className={inp} value={form.shift} onChange={e => setF('shift',e.target.value)}>
                      <option value="A">A Shift</option><option value="B">B Shift</option><option value="C">C Shift</option>
                    </select>
                  </div>
                  <div><label className={lbl}>Operation / Line</label>
                    <select className={inp} value={form.operation||''} onChange={e => setF('operation',e.target.value)}>
                      <option value="">Select...</option>
                      {OPERATIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Inspector</label><input className={inp} placeholder="Inspector name" value={form.inspector||''} onChange={e => setF('inspector',e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><label className={lbl}>Qty Produced</label><input type="number" className={inp} value={form.qtyProduced||''} onChange={e => setF('qtyProduced',Number(e.target.value))} /></div>
                  <div><label className={lbl}>Qty Rejected</label><input type="number" className={inp} value={form.qtyRejected||''} onChange={e => setF('qtyRejected',Number(e.target.value))} /></div>
                  <div className="md:col-span-2"><label className={lbl}>Notes</label><input className={inp} placeholder="Patrol notes" value={form.notes||''} onChange={e => setF('notes',e.target.value)} /></div>
                </div>
                <button onClick={addPatrol} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2 rounded-xl">Log Patrol</button>
              </div>
            )}

            {patrols.length === 0 && (
              <div className="bg-gray-900 border border-gray-700 border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">⚙️</div>
                <p className="text-gray-400 text-sm">No patrol logs. Click <span className="text-indigo-400">🧪 Load Sample</span> or <span className="text-indigo-400">+ Log Patrol</span>.</p>
              </div>
            )}

            {/* Daily FTT Summary */}
            {patrols.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {label:'Total Produced',val:totalProduced.toLocaleString(),color:'text-white'},
                  {label:'Total Rejected',val:totalRejected.toLocaleString(),color:'text-red-400'},
                  {label:'FTT %',val:`${ftt}%`,color:Number(ftt)>=98?'text-green-400':Number(ftt)>=95?'text-amber-400':'text-red-400'},
                  {label:'IPPM',val:ippm.toLocaleString(),color:ippm<500?'text-green-400':ippm<2000?'text-amber-400':'text-red-400'},
                  {label:'NC Patrol Logs',val:`${ncLogs}/${patrols.length}`,color:ncLogs===0?'text-green-400':'text-amber-400'},
                ].map(s => (
                  <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {filtered.map(patrol => {
              const isOpen = expandedId === patrol.id;
              const fttVal = patrol.qtyProduced>0 ? ((patrol.qtyProduced-patrol.qtyRejected)/patrol.qtyProduced*100).toFixed(1) : '—';
              const critCount = patrol.defects.filter(d => d.severity==='critical').length;
              return (
                <div key={patrol.id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${patrol.status==='nc-found'?(critCount>0?'border-red-700/60':'border-amber-700/40'):'border-gray-800'}`}>
                  <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isOpen?null:patrol.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold text-sm font-mono">{patrol.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PATROL_STATUS_COLOR[patrol.status]}`}>{PATROL_STATUS_LABEL[patrol.status]}</span>
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Shift {patrol.shift}</span>
                        {critCount > 0 && <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded font-bold">🔴 {critCount} CRITICAL</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>📅 {patrol.date}</span>
                        <span>📍 {patrol.operation}</span>
                        <span>👤 {patrol.inspector}</span>
                        <span>Produced: <span className="text-white">{patrol.qtyProduced}</span></span>
                        <span>Rejected: <span className={patrol.qtyRejected>0?'text-red-400':'text-green-400'}>{patrol.qtyRejected}</span></span>
                        <span>FTT: <span className={Number(fttVal)>=98?'text-green-400':'text-amber-400'}>{fttVal}%</span></span>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">{isOpen?'▾':'▸'}</span>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-800 px-5 py-4 space-y-3">
                      {patrol.defects.length === 0 ? (
                        <div className="text-xs text-gray-500 text-center py-4 bg-gray-800/40 rounded-xl">No defects recorded — all clear ✅</div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Defects Found ({patrol.defects.length})</h4>
                          <div className="space-y-2">
                            {patrol.defects.map((d,i) => (
                              <div key={i} className={`rounded-xl p-3 border-l-4 ${d.severity==='critical'?'bg-red-900/20 border-red-500':d.severity==='major'?'bg-amber-900/20 border-amber-500':'bg-blue-900/20 border-blue-500'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${SEV_COLOR[d.severity]}`}>{SEV_LABEL[d.severity]}</span>
                                  <span className="text-white text-xs font-semibold">{d.defectType}</span>
                                  <span className="text-gray-500 text-xs">× {d.qty} pcs</span>
                                </div>
                                {d.action && <p className="text-xs text-gray-400">Action: {d.action}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {patrol.notes && <p className="text-xs text-gray-500 italic">{patrol.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* POKA-YOKE */}
      {tab === 'pokayoke' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {pks.length === 0 && (
              <div className="bg-gray-900 border border-gray-700 border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-gray-400 text-sm">No poka-yoke devices loaded. Click <span className="text-indigo-400">🧪 Load Sample</span> to see examples.</p>
              </div>
            )}

            {pks.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {label:'Total Devices',val:pks.length.toString(),color:'text-white'},
                    {label:'Challenged Today',val:pks.filter(p=>p.result!=='not-challenged').length.toString(),color:'text-indigo-300'},
                    {label:'Passed',val:pks.filter(p=>p.result==='pass').length.toString(),color:'text-green-400'},
                    {label:'FAILED',val:pks.filter(p=>p.result==='fail').length.toString(),color:pks.filter(p=>p.result==='fail').length>0?'text-red-400':'text-gray-500'},
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {pks.map(pk => (
                    <div key={pk.id} className={`bg-gray-900 border rounded-2xl p-4 ${pk.result==='fail'?'border-red-700/60':pk.isCritical?'border-indigo-800/40':'border-gray-800'}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-white font-bold text-sm font-mono">{pk.id}</span>
                            {pk.isCritical && <span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded font-bold">🔴 CRITICAL</span>}
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{pk.line}</span>
                            <span className="text-xs text-gray-500">{pk.operation}</span>
                          </div>
                          <p className="text-white text-sm mb-1">{pk.description}</p>
                          <div className="text-xs text-gray-500 mb-2">Challenge: <span className="text-gray-400">{pk.challengeMethod}</span></div>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="text-gray-500">Last challenged: <span className="text-gray-300">{pk.lastChallenged||'—'}</span></span>
                            {pk.failAction && pk.result==='fail' && <span className="text-red-400">{pk.failAction}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-sm font-bold ${PK_COLOR[pk.result]}`}>{PK_LABEL[pk.result]}</span>
                          <div className="flex gap-2">
                            <button onClick={() => updatePKResult(pk.id,'pass')} className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg">✅ Pass</button>
                            <button onClick={() => updatePKResult(pk.id,'fail')} className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg">❌ Fail</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* KNOWLEDGE HUB */}
      {tab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-6">

            <div className="bg-gray-900 border border-indigo-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">⚙️ IATF 16949 Cl. 8.5.1 — Control of Production</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Cl. 8.5.1 is the core in-process control clause. It requires organizations to implement production and service provision under controlled conditions — using control plans, work instructions, approved equipment, monitoring and measurement, and error-proofing devices. IPQC is the real-time execution arm of the control plan.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {icon:'📋',title:'Control Plan at Every Op',desc:'Every operation must have a linked control plan defining: characteristic, specification, gauge, sampling frequency, control method, and reaction plan. IPQC inspects per the control plan — not ad-hoc.'},
                  {icon:'🔒',title:'Cl. 8.5.1.1 — Error Proofing',desc:'IATF specifically requires error proofing be considered in manufacturing. Poka-yoke devices must be challenged periodically (per frequency defined in control plan). Failed challenge = immediate line stop.'},
                  {icon:'📊',title:'Cl. 8.5.1.2 — SPC & Statistical Tools',desc:'Statistical process control must be applied to CC/SC characteristics. OOC signals require immediate reaction per the reaction plan. Cpk < 1.33 triggers process improvement action.'},
                ].map(c => (
                  <div key={c.title} className="bg-indigo-900/20 border border-indigo-800/30 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-indigo-300 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-amber-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📊 Key IPQC Metrics — Definitions and Targets</h2>
              <div className="space-y-3">
                {[
                  {metric:'FTT % — First Time Through',formula:'(Units Produced − Units Rejected) ÷ Units Produced × 100',target:'Target: ≥ 98% (world class: 99.5%+)',color:'text-green-300',detail:'FTT measures how many units pass through production without any rework, repair, or scrap on the first attempt. A unit that is reworked even once is a FTT failure — even if the final part is acceptable.'},
                  {metric:'IPPM — In-Process PPM',formula:'(Units Rejected ÷ Units Produced) × 1,000,000',target:'Target: < 500 PPM (world class: < 100 PPM)',color:'text-blue-300',detail:'Internal PPM tracks the internal defect rate. High IPPM means your process is generating defects — the risk of customer escape increases even with a good OQC filter.'},
                  {metric:'COPQ — Cost of Poor Quality',formula:'Scrap Cost + Rework Labour + Re-inspection Cost + Downtime Cost',target:'Target: < 0.5% of Sales Turnover',color:'text-amber-300',detail:'COPQ is the total cost incurred because quality was not right first time. IATF Cl. 9.3.2 requires COPQ to be reported at Management Review.'},
                  {metric:'Red Bin Analysis',formula:'Weekly count of red-bin rejections by defect type (Pareto)',target:'Trending down month-over-month. Top 3 defects must have active CA.',color:'text-red-300',detail:'Red bin is the physical bin where defective parts are placed during production. Weekly analysis of red bin data gives the fastest leading indicator of process problems.'},
                ].map(m => (
                  <div key={m.metric} className="bg-gray-800 rounded-xl p-4">
                    <div className={`font-bold text-sm mb-1 ${m.color}`}>{m.metric}</div>
                    <div className="text-xs text-gray-400 font-mono mb-1">Formula: {m.formula}</div>
                    <div className="text-xs text-gray-500 mb-1">{m.target}</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{m.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🔄 4M Change Control — IATF 16949 Cl. 8.5.6</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[
                  {m:'👤 Man',changes:['New operator on CC/SC operation','Operator returning after long absence','Contractor / temp worker on safety-critical operation','Supervisor change affecting quality oversight'],action:'Mandatory: Verify operator training on current WI. Conduct first-off approval. Monitor first 50 pieces.'},
                  {m:'🔧 Machine',changes:['Machine repair / breakdown and restart','New machine or machine relocation','Tooling change (punch, die, fixture)','PM completion on CC/SC machine'],action:'Mandatory: First-off approval of 5+ pieces. Verify machine parameters vs process control sheet. Re-run SPC for 25 pieces before confirming stability.'},
                  {m:'📦 Material',changes:['New material lot or batch','Material supplier change','Material grade or specification change','Incoming material found outside spec (concession)'],action:'Mandatory: First-off approval. Incoming inspection for new lot. Customer notification if CC/SC material changed.'},
                  {m:'📋 Method',changes:['Process parameter change (temp, pressure, speed, torque)','Work Instruction revision','Packaging or handling method change','Inspection method or gauge change'],action:'Mandatory: Update WI and control plan. First-off approval after method change. Customer PPAP may be required for major method changes.'},
                ].map(c => (
                  <div key={c.m} className="bg-green-900/20 border border-green-800/30 rounded-xl p-4">
                    <div className="text-green-300 font-bold text-sm mb-2">{c.m}</div>
                    <div className="text-xs text-gray-500 mb-2">Triggering Events:</div>
                    {c.changes.map((ch,i) => <div key={i} className="flex items-start gap-2 mb-1 text-xs"><span className="text-gray-600">•</span><span className="text-gray-400">{ch}</span></div>)}
                    <div className="mt-2 text-xs text-green-400 leading-relaxed">{c.action}</div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-3 text-xs text-amber-300">
                ⚠️ Every 4M change must be logged in the 4M change register with: date, change type, approval authority, first-off result, and customer notification status (if required). Uncontrolled 4M changes are a common Major NC in IATF audits.
              </div>
            </div>

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">❌ Common IATF Audit Findings — IPQC</h2>
              <div className="space-y-2">
                {[
                  'IPQC patrol conducted but not per control plan sampling frequency — inspector using "experience" instead of plan',
                  'Poka-yoke challenge not done per defined frequency — challenge log has gaps > 1 week',
                  'OOC signal on SPC chart — no reaction plan triggered, production continued (Cl. 8.5.1.2)',
                  '4M change (new operator on CC operation) not recorded in 4M register — no first-off approval done',
                  'Red bin analysis shows same defect for 3 consecutive weeks — no corrective action or CAPA raised',
                  'Rework done without documented rework instruction or rework PFMEA — rework process uncontrolled (Cl. 8.7.1)',
                  'Process control sheet settings differ from actual machine settings — parameters not updated after last PM',
                  'Calibration overdue instruments found in use at IPQC station — results invalid (Cl. 7.1.5)',
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

      {/* GUIDE */}
      {tab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">IPQC Patrol Inspection — How to Do It Right</h2>
              <p className="text-gray-400 text-sm mt-1">IATF 16949 Cl. 8.5.1 · Control Plan Adherence · Error Proofing · FTT</p>
            </div>

            {[
              {step:1,icon:'📋',title:'Start of Shift — Verify Readiness',body:'Before production starts, verify: (1) Control plan and WI at workstation — correct revision. (2) All gauges calibrated and available. (3) Poka-yoke devices challenged — record pass/fail in PY challenge register. (4) Previous shift handover — any open issues, holds, or carry-over NCRs. (5) Material lot verified — correct batch. Traceability tags available. (6) 4M changes from previous shift noted and first-off done if applicable.'},
              {step:2,icon:'🔬',title:'Conduct Patrol per Control Plan Frequency',body:'IPQC inspects each operation per the sampling frequency in the control plan — not randomly. If the CP says "every 2 hours, 5 pieces," that is the minimum. Carry the relevant section of the control plan on patrol. Record actual measured values — not just pass/fail. Check CC/SC characteristics every patrol without exception. Use the specified gauge — do not substitute.'},
              {step:3,icon:'📝',title:'Record Results — No Blank Entries',body:'Every patrol must be recorded. Blank check sheets are a finding. Record: date, time, shift, operation, inspector, quantities, actual values. If all OK — record "OK" with actual measurements. If NC found — record defect description, quantity, severity, and immediate action taken. Sign the check sheet. Link to NCR if major/critical defect.'},
              {step:4,icon:'🚨',title:'NC Found — Immediate Response',body:'Critical defect: STOP THE LINE. Quarantine all suspect production since last OK inspection. Do not allow suspect parts to move forward. Raise NCR within 1 hour. Notify supervisor and Quality Engineer. Determine suspect window — how many pieces are affected? 100% sort if suspect quantity significant. For Minor NC: segregate, rework in-line, record, monitor next patrol.'},
              {step:5,icon:'🔒',title:'Poka-Yoke Challenge — Every Shift or Per Plan',body:'Challenge every poka-yoke per the frequency in the control plan (typically start of each shift, or once daily for less critical devices). Use a known NG piece or simulated failure to challenge the device. If device DETECTS the failure → PASS → record. If device DOES NOT detect → FAIL → STOP LINE IMMEDIATELY. Do not produce on this line until PY is repaired and re-challenged successfully.'},
              {step:6,icon:'📊',title:'End of Shift — FTT Calculation and Handover',body:'At end of shift: (1) Total up produced vs rejected. Calculate shift FTT%. (2) Complete red bin analysis — categorize all rejections by type. (3) Update daily FTT tracker and IPPM trend. (4) Handover to next shift: any open NCs, holds, poka-yoke failures, 4M changes. (5) Brief next shift IPQC inspector on any ongoing issues. (6) File all check sheets and sign off on shift report.'},
              {step:7,icon:'📉',title:'Weekly Red Bin Analysis and Corrective Action',body:'Every week: collect all red bin data from the week. Prepare a Pareto (bar chart) of top 5 defect types by quantity. For the top defect: run 5-Why, raise corrective action, assign owner, set due date. Track if last week\'s top defect improved. If same defect appears 3+ weeks → mandatory CAPA and escalation to Quality Manager. Present at weekly quality meeting with trend.'},
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><span className="text-xl">{s.icon}</span><h3 className="text-indigo-300 font-bold text-sm">{s.title}</h3></div>
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
