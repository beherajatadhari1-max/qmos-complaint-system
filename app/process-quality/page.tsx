'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import Callout from '../components/Callout';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ---------------------------------------------------------------------
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

// -- Constants -----------------------------------------------------------------
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
  critical:'bg-red-800/60 text-red-700', major:'bg-amber-800/60 text-amber-700', minor:'bg-[#eff6ff]/60 text-[#1d4ed8]',
};
const SEV_LABEL: Record<DefectSeverity,string> = { critical:'🔴 Critical', major:'🟡 Major', minor:'🔵 Minor' };
const PATROL_STATUS_COLOR: Record<PatrolStatus,string> = {
  ok:'bg-green-900/30 text-green-300', 'nc-found':'bg-red-50 text-red-700', pending:'bg-gray-700 text-[#1e3a5f]',
};
const PATROL_STATUS_LABEL: Record<PatrolStatus,string> = {
  ok:'✅ OK — No NC', 'nc-found':'🔴 NC Found', pending:'⏳ Pending',
};
const PK_COLOR: Record<PKResult,string> = {
  pass:'text-green-600', fail:'text-red-600', 'not-challenged':'text-[#1e3a5f]',
};
const PK_LABEL: Record<PKResult,string> = { pass:'✅ Pass', fail:'❌ FAIL', 'not-challenged':'— Not Challenged' };

const inp = 'w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-indigo-500';
const lbl = 'text-xs text-[#1e3a5f] block mb-1';

// -- Sample Data ---------------------------------------------------------------
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

// -- In-Process Quality Dashboard ---------------------------------------------
function IPQCDashboard({ patrols }: { patrols: PatrolLog[] }) {
  const totalProduced  = patrols.reduce((s,p)=>s+p.qtyProduced,0);
  const totalRejected  = patrols.reduce((s,p)=>s+p.qtyRejected,0);
  const ipqcPPM        = totalProduced>0 ? Math.round((totalRejected/totalProduced)*1_000_000) : 0;
  const ftt            = totalProduced>0 ? Math.round(((totalProduced-totalRejected)/totalProduced)*100) : 0;
  const ncLogs         = patrols.filter(p=>p.status==='nc-found').length;
  const okLogs         = patrols.filter(p=>p.status==='ok').length;
  const criticalCount  = patrols.flatMap(p=>p.defects).filter(d=>d.severity==='critical').reduce((s,d)=>s+d.qty,0);

  // Shift-wise breakdown
  const byShift: Record<string,{prod:number;rej:number}> = {};
  patrols.forEach(p=>{
    if(!byShift[p.shift]) byShift[p.shift]={prod:0,rej:0};
    byShift[p.shift].prod+=p.qtyProduced;
    byShift[p.shift].rej+=p.qtyRejected;
  });
  const shiftData = Object.entries(byShift)
    .map(([shift,v])=>({shift, ppm:v.prod>0?Math.round(v.rej/v.prod*1_000_000):0, rej:v.rej, prod:v.prod}))
    .sort((a,b)=>b.ppm-a.ppm);
  const maxShiftPPM = Math.max(...shiftData.map(s=>s.ppm),1);

  // Station / process defect Pareto
  const byStation: Record<string,number> = {};
  patrols.forEach(p=>{
    p.defects.forEach(d=>{
      const key = p.operation||'Unknown';
      byStation[key]=(byStation[key]??0)+d.qty;
    });
  });
  const stationPareto = Object.entries(byStation)
    .sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxStation = Math.max(...stationPareto.map(s=>s[1]),1);

  // Defect type Pareto
  const byDefect: Record<string,number> = {};
  patrols.flatMap(p=>p.defects).forEach(d=>{
    byDefect[d.defectType]=(byDefect[d.defectType]??0)+d.qty;
  });
  const defectPareto = Object.entries(byDefect).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // SPC alerts (simulate — flag processes with high PPM)
  const spcAlerts = patrols.filter(p=>{
    const ppm = p.qtyProduced>0?Math.round(p.qtyRejected/p.qtyProduced*1_000_000):0;
    return ppm>3000;
  });

  if(patrols.length===0) return (
      <>
      <PageTitle title="Process Quality" />
      <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">📊</div>
      <p className="text-[#1d4ed8] text-sm">Load sample data from the Patrol Log tab to populate the dashboard.</p>
    </div>
      </>
  );

  return (
    <div className="space-y-5 py-4 max-w-screen-xl mx-auto px-4 md:px-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'First Time Through (FTT)', value:`${ftt}%`, sub:`${totalProduced.toLocaleString()} pcs produced`, color:ftt>=95?'text-emerald-600':ftt>=85?'text-amber-600':'text-red-600' },
          { label:'In-Process PPM', value:ipqcPPM.toLocaleString(), sub:`${totalRejected} pcs rejected`, color:ipqcPPM<=1000?'text-emerald-600':ipqcPPM<=3000?'text-amber-600':'text-red-600' },
          { label:'NC Patrol Logs', value:`${ncLogs}/${patrols.length}`, sub:`${okLogs} OK logs`, color:ncLogs===0?'text-emerald-600':ncLogs<=2?'text-amber-600':'text-red-600' },
          { label:'Critical Defects', value:criticalCount, sub:`Across all patrols`, color:criticalCount===0?'text-emerald-600':'text-red-600' },
        ].map(k=>(
          <div key={k.label} className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-4">
            <div className="text-xs text-[#1d4ed8] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-indigo-600/70 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shift-wise PPM */}
        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-4">In-Process PPM by Shift</div>
          {shiftData.length===0
            ? <div className="text-xs text-indigo-600 py-4 text-center">No data</div>
            : shiftData.map(s=>(
              <div key={s.shift} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-indigo-200">Shift {s.shift}</span>
                  <span className="text-indigo-600">{s.rej} rej / {s.prod} prod</span>
                  <span className={`font-bold ${s.ppm<=1000?'text-emerald-600':s.ppm<=3000?'text-amber-600':'text-red-600'}`}>{s.ppm.toLocaleString()} PPM</span>
                </div>
                <div className="w-full bg-[#eff6ff] rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${s.ppm<=1000?'bg-emerald-500':s.ppm<=3000?'bg-amber-500':'bg-red-500'}`}
                    style={{width:`${Math.round(s.ppm/maxShiftPPM*100)}%`,minWidth:s.ppm>0?'6px':'0'}} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Defect Type Pareto */}
        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-4">Defect Type Pareto</div>
          {defectPareto.length===0
            ? <div className="text-xs text-indigo-600 py-4 text-center">No defects recorded yet</div>
            : defectPareto.map(([type,qty],i)=>{
              const maxD=Math.max(...defectPareto.map(d=>d[1]),1);
              const colors=['bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-lime-500'];
              return (
                <div key={type} className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs font-bold text-indigo-600 w-4">{i+1}</span>
                  <span className="flex-1 text-xs text-indigo-200 truncate">{type}</span>
                  <div className="w-24 bg-[#eff6ff] rounded-full h-2 shrink-0">
                    <div className={`${colors[i]||'bg-indigo-500'} h-2 rounded-full`} style={{width:`${Math.round(qty/maxD*100)}%`}} />
                  </div>
                  <span className="text-xs font-bold text-[#1d4ed8] w-8 text-right">{qty}</span>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Station Pareto + SPC Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-4">Defects by Process / Station</div>
          {stationPareto.length===0
            ? <div className="text-xs text-indigo-600 py-4 text-center">No defects recorded yet</div>
            : stationPareto.map(([station,qty])=>(
              <div key={station} className="flex items-center gap-2 mb-2.5">
                <span className="flex-1 text-xs text-indigo-200 truncate">{station}</span>
                <div className="w-28 bg-[#eff6ff] rounded-full h-2 shrink-0">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width:`${Math.round(qty/maxStation*100)}%`}} />
                </div>
                <span className="text-xs font-bold text-purple-700 w-8 text-right">{qty}</span>
              </div>
            ))
          }
        </div>

        {/* SPC / Process Alerts */}
        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
            <div className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide">Process Alerts (PPM &gt; 3000)</div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${spcAlerts.length===0?'bg-emerald-50 text-emerald-600':'bg-red-900 text-red-600'}`}>
              {spcAlerts.length} alerts
            </span>
          </div>
          {spcAlerts.length===0
            ? <div className="flex items-center gap-2 text-emerald-600 text-xs"><span>✅</span><span>All processes within acceptable PPM range.</span></div>
            : spcAlerts.map(p=>{
              const ppm=p.qtyProduced>0?Math.round(p.qtyRejected/p.qtyProduced*1_000_000):0;
              return (
                <div key={p.id} className="bg-red-50 border border-red-800/40 rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-y-2">
                    <span className="text-xs font-bold text-red-700">{p.operation||'Unknown'}</span>
                    <span className="text-xs font-bold text-red-600">{ppm.toLocaleString()} PPM</span>
                  </div>
                  <div className="text-xs text-red-600/70">Shift {p.shift} · {p.date} · {p.qtyRejected} rej / {p.qtyProduced} prod</div>
                  <div className="text-xs text-amber-600 mt-1">⚡ Action: Review process parameters, raise NCR, check control plan.</div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Maturity */}
      <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 In-Process Quality Maturity Score</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'FTT Performance',      score:ftt,  target:95 },
            { label:'In-Process PPM',        score:ipqcPPM<=1000?100:ipqcPPM<=3000?70:40, target:100 },
            { label:'Patrol Coverage',       score:patrols.length>=5?90:Math.round(patrols.length/5*90), target:90 },
            { label:'Critical Defect Score', score:criticalCount===0?100:criticalCount<=2?60:20, target:100 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-[#eff6ff] rounded-xl p-3 text-center">
                <div className="text-xs text-[#1d4ed8] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-indigo-600 mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-[#eff6ff] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{width:`${Math.min(m.score,100)}%`,background:color}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// -- IPQC Process Rhythm -------------------------------------------------------
const IPQC_PROCESSES = [
  { freq:'Daily',     icon:'🔴', color:'bg-red-700',    ring:'ring-red-400',    items:[
    { no:'D1', label:'Patrol Inspection & Recording', clause:'IATF 8.5.1', desc:'Conduct IPQC patrol per control plan frequency. Record actual measured values (not just pass/fail) in check sheet. Every shift, every operation.' },
    { no:'D2', label:'Poka-Yoke Challenge', clause:'IATF 8.3.4', desc:'Challenge each poka-yoke device at start of every shift using a known NG piece. If device fails — STOP LINE. Record pass/fail in PY challenge register.' },
    { no:'D3', label:'FTT Recording & Red Bin', clause:'IATF 9.1.2', desc:'At end of shift: calculate First Time Through %. Categorize all rejects in red bin by defect type. Update daily FTT tracker.' },
    { no:'D4', label:'Shift Handover Briefing', clause:'IATF 8.5.1', desc:'Brief incoming shift on open NCs, holds, PY failures, 4M changes from current shift. Sign off on shift summary sheet.' },
  ]},
  { freq:'Weekly',    icon:'🔵', color:'bg-blue-700',   ring:'ring-blue-400',   items:[
    { no:'W1', label:'Red Bin Pareto Analysis', clause:'IATF 10.2', desc:'Compile week\'s red bin data. Create Pareto of top 5 defect types. For top defect: initiate 5-Why. Assign owner and due date for corrective action.' },
    { no:'W2', label:'Weekly FTT Report', clause:'IATF 9.1.2', desc:'Prepare weekly FTT trend chart. Compare vs target. Present at quality meeting with root cause for any week below target.' },
    { no:'W3', label:'IPQC Team Meeting', clause:'IATF 7.4', desc:'Review open NCs, PY failures, and FTT trend with IPQC inspectors. Communicate any changes in control plan or gauge availability.' },
  ]},
  { freq:'Monthly',   icon:'🟢', color:'bg-green-700',  ring:'ring-green-400',  items:[
    { no:'M1', label:'Control Plan Review', clause:'IATF 8.5.1', desc:'Review IPQC control plan for all operations. Update characteristics, frequency, and gauge if process or drawing changed. Get sign-off from Quality Head.' },
    { no:'M2', label:'Poka-Yoke Effectiveness Review', clause:'IATF 8.3.4', desc:'Review PY challenge records for the month. Any failures? Root cause investigated? Update PY master register with maintenance/repair actions.' },
    { no:'M3', label:'Gauge & Tool Calibration Audit', clause:'IATF 7.1.5', desc:'Verify all IPQC gauges are within calibration date. Any expired — tag RED and withdraw from service immediately. Update gauge register.' },
    { no:'M4', label:'IPQC Skill Matrix Update', clause:'IATF 7.2', desc:'Assess all IPQC inspectors on: patrol procedure, gauge usage, CC/SC identification, NC reporting. Plan training for any gaps.' },
  ]},
  { freq:'Quarterly', icon:'🟣', color:'bg-purple-700', ring:'ring-purple-400', items:[
    { no:'Q1', label:'IPQC Internal Audit', clause:'IATF 9.2', desc:'Conduct internal process audit on IPQC function. Verify: patrol adherence, record completeness, PY challenge discipline, escalation process. Raise NCs for gaps.' },
    { no:'Q2', label:'Gauge R&R Review', clause:'IATF 7.1.5.1', desc:'Review MSA/GRR results for critical gauges. Any gauge with GRR > 30% — replace or repair. Schedule new GRR study if needed.' },
    { no:'Q3', label:'Control Plan vs PFMEA Alignment', clause:'IATF 8.5.1', desc:'Cross-check IPQC control plan with current PFMEA. All high-RPN failure modes should have detection controls in the control plan.' },
  ]},
];

export default function ProcessQualityPage() {
  const [tab, setTab] = useState<'dashboard'|'ipqc'|'pokayoke'|'knowledge'|'guide'>('ipqc');
  const [freqFilter, setFreqFilter] = useState('All');
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
    <div className="min-h-screen bg-[#eff6ff]">

      {/* Header */}
      <div className="bg-white">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">In-Process Quality Control (IPQC)</h1>
                <p className="text-[#1d4ed8] text-xs mt-0.5">IATF 16949 Cl. 8.5.1 · Patrol Inspection · FTT · IPPM · Red Bin · Poka-Yoke · SPC · 4M Change Control</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-indigo-300">{ftt}%</div>
                <div className="text-xs text-indigo-600">FTT</div>
              </div>
              <div className="bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-white">{ippm.toLocaleString()}</div>
                <div className="text-xs text-[#1e3a5f]">IPPM</div>
              </div>
              {criticalDefects > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-700">{criticalDefects}</div>
                  <div className="text-xs text-red-600">Critical Defects</div>
                </div>
              )}
              {pkFails > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-700">{pkFails}</div>
                  <div className="text-xs text-red-600">PY Failed</div>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-amber-700">{ncLogs}</div>
                <div className="text-xs text-amber-600">NC Patrols</div>
              </div>
              <button onClick={loadSample} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">🧪 Load Sample</button>
              <button onClick={() => setShowForm(true)} className="bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e3a5f] text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-colors">+ Log Patrol</button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              {id:'dashboard',label:'📊 Dashboard'},
              {id:'ipqc',     label:'⚙️ Patrol Log'},
              {id:'pokayoke', label:'🔒 Poka-Yoke'},
              {id:'knowledge',label:'📚 Knowledge Hub'},
              {id:'guide',    label:'📋 IPQC Guide'},
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex-shrink-0 ${tab===t.id?'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]':'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'dashboard' && <IPQCDashboard patrols={patrols} />}

      {/* PATROL LOG */}
      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/process-quality/Process_Audit_Checklist_VDA63.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Process Audit VDA 6.3">Process Audit VDA 6.3</a><a href="/downloads/process-quality/Process_Audit_Checklist_VDA63.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Process Audit VDA 6.3">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/process-quality/First_Article_Inspection.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View FAI Report XLS">FAI Report XLS</a><a href="/downloads/process-quality/First_Article_Inspection.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download FAI Report XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/process-quality/Process_Capability_Study.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Capability Study XLS">Capability Study XLS</a><a href="/downloads/process-quality/Process_Capability_Study.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Capability Study XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/process-quality/SPC_Control_Chart.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View SPC Control Chart XLS">SPC Control Chart XLS</a><a href="/downloads/process-quality/SPC_Control_Chart.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download SPC Control Chart XLS">⬇</a></span>
      </div>
      {tab === 'ipqc' && (
        <div className="animate-fadeIn p-4 bg-[#eff6ff] min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {patrols.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <select className="text-xs bg-white border border-[#dbeafe] rounded-lg px-3 py-1.5 text-[#1e3a5f] focus:outline-none" value={filterShift} onChange={e => setFilterShift(e.target.value)}>
                  <option value="all">All Shifts</option>
                  <option value="A">A Shift</option>
                  <option value="B">B Shift</option>
                  <option value="C">C Shift</option>
                </select>
                <select className="text-xs bg-white border border-[#dbeafe] rounded-lg px-3 py-1.5 text-[#1e3a5f] focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Results</option>
                  <option value="ok">OK</option>
                  <option value="nc-found">NC Found</option>
                  <option value="pending">Pending</option>
                </select>
                <div className="flex gap-4 text-xs text-[#1e3a5f] self-center ml-2">
                  <span>Produced: <span className="text-white font-semibold">{totalProduced.toLocaleString()}</span></span>
                  <span>Rejected: <span className="text-red-600 font-semibold">{totalRejected.toLocaleString()}</span></span>
                  <span>Showing {filtered.length} of {patrols.length} logs</span>
                </div>
              </div>
            )}

            {showForm && (
              <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
                  <h2 className="text-sm font-bold text-white">+ Log Patrol Inspection</h2>
                  <button onClick={() => setShowForm(false)} className="text-[#1e3a5f] hover:text-white text-xs">✕ Cancel</button>
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
              <div className="bg-white border border-[#dbeafe] border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">⚙️</div>
                <p className="text-[#1e3a5f] text-sm">No patrol logs. Click <span className="text-indigo-600">🧪 Load Sample</span> or <span className="text-indigo-600">+ Log Patrol</span>.</p>
              </div>
            )}

            {/* Daily FTT Summary */}
            {patrols.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {label:'Total Produced',val:totalProduced.toLocaleString(),color:'text-white'},
                  {label:'Total Rejected',val:totalRejected.toLocaleString(),color:'text-red-600'},
                  {label:'FTT %',val:`${ftt}%`,color:Number(ftt)>=98?'text-green-600':Number(ftt)>=95?'text-amber-600':'text-red-600'},
                  {label:'IPPM',val:ippm.toLocaleString(),color:ippm<500?'text-green-600':ippm<2000?'text-amber-600':'text-red-600'},
                  {label:'NC Patrol Logs',val:`${ncLogs}/${patrols.length}`,color:ncLogs===0?'text-green-600':'text-amber-600'},
                ].map(s => (
                  <div key={s.label} className="bg-white border border-[#dbeafe] rounded-xl px-4 py-3 text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-[#1e3a5f] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {filtered.map(patrol => {
              const isOpen = expandedId === patrol.id;
              const fttVal = patrol.qtyProduced>0 ? ((patrol.qtyProduced-patrol.qtyRejected)/patrol.qtyProduced*100).toFixed(1) : '—';
              const critCount = patrol.defects.filter(d => d.severity==='critical').length;
              return (
                <div key={patrol.id} className={`bg-white border rounded-2xl overflow-hidden ${patrol.status==='nc-found'?(critCount>0?'border-red-700/60':'border-amber-200'):'border-[#dbeafe]'}`}>
                  <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isOpen?null:patrol.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold text-sm font-mono">{patrol.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PATROL_STATUS_COLOR[patrol.status]}`}>{PATROL_STATUS_LABEL[patrol.status]}</span>
                        <span className="text-xs bg-gray-700 text-[#1e3a5f] px-2 py-0.5 rounded">Shift {patrol.shift}</span>
                        {critCount > 0 && <span className="text-xs bg-red-900 text-red-700 px-2 py-0.5 rounded font-bold">🔴 {critCount} CRITICAL</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-[#1e3a5f]">
                        <span>📅 {patrol.date}</span>
                        <span>📍 {patrol.operation}</span>
                        <span>👤 {patrol.inspector}</span>
                        <span>Produced: <span className="text-white">{patrol.qtyProduced}</span></span>
                        <span>Rejected: <span className={patrol.qtyRejected>0?'text-red-600':'text-green-600'}>{patrol.qtyRejected}</span></span>
                        <span>FTT: <span className={Number(fttVal)>=98?'text-green-600':'text-amber-600'}>{fttVal}%</span></span>
                      </div>
                    </div>
                    <span className="text-[#1e3a5f] text-sm">{isOpen?'▾':'▸'}</span>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#dbeafe] px-5 py-4 space-y-3">
                      {patrol.defects.length === 0 ? (
                        <div className="text-xs text-[#1e3a5f] text-center py-4 bg-[#eff6ff] rounded-xl">No defects recorded — all clear ✅</div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-bold text-[#1e3a5f] uppercase mb-2">Defects Found ({patrol.defects.length})</h4>
                          <div className="space-y-2">
                            {patrol.defects.map((d,i) => (
                              <div key={i} className={`rounded-xl p-3 border-l-4 ${d.severity==='critical'?'bg-red-50 border-red-500':d.severity==='major'?'bg-amber-50 border-amber-500':'bg-[#eff6ff] border-blue-500'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${SEV_COLOR[d.severity]}`}>{SEV_LABEL[d.severity]}</span>
                                  <span className="text-white text-xs font-semibold">{d.defectType}</span>
                                  <span className="text-[#1e3a5f] text-xs">× {d.qty} pcs</span>
                                </div>
                                {d.action && <p className="text-xs text-[#1e3a5f]">Action: {d.action}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {patrol.notes && <p className="text-xs text-[#1e3a5f] italic">{patrol.notes}</p>}
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
        <div className="animate-fadeIn p-4 bg-[#eff6ff] min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {pks.length === 0 && (
              <div className="bg-white border border-[#dbeafe] border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-[#1e3a5f] text-sm">No poka-yoke devices loaded. Click <span className="text-indigo-600">🧪 Load Sample</span> to see examples.</p>
              </div>
            )}

            {pks.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {label:'Total Devices',val:pks.length.toString(),color:'text-white'},
                    {label:'Challenged Today',val:pks.filter(p=>p.result!=='not-challenged').length.toString(),color:'text-indigo-300'},
                    {label:'Passed',val:pks.filter(p=>p.result==='pass').length.toString(),color:'text-green-600'},
                    {label:'FAILED',val:pks.filter(p=>p.result==='fail').length.toString(),color:pks.filter(p=>p.result==='fail').length>0?'text-red-600':'text-[#1e3a5f]'},
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-[#dbeafe] rounded-xl px-4 py-3 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-xs text-[#1e3a5f] mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {pks.map(pk => (
                    <div key={pk.id} className={`bg-white border rounded-2xl p-4 ${pk.result==='fail'?'border-red-700/60':pk.isCritical?'border-[#dbeafe]':'border-[#dbeafe]'}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-white font-bold text-sm font-mono">{pk.id}</span>
                            {pk.isCritical && <span className="text-xs bg-red-900/60 text-red-700 px-2 py-0.5 rounded font-bold">🔴 CRITICAL</span>}
                            <span className="text-xs bg-gray-700 text-[#1e3a5f] px-2 py-0.5 rounded">{pk.line}</span>
                            <span className="text-xs text-[#1e3a5f]">{pk.operation}</span>
                          </div>
                          <p className="text-white text-sm mb-1">{pk.description}</p>
                          <div className="text-xs text-[#1e3a5f] mb-2">Challenge: <span className="text-[#1e3a5f]">{pk.challengeMethod}</span></div>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="text-[#1e3a5f]">Last challenged: <span className="text-[#1e3a5f]">{pk.lastChallenged||'—'}</span></span>
                            {pk.failAction && pk.result==='fail' && <span className="text-red-600">{pk.failAction}</span>}
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
        <div className="animate-fadeIn p-6 bg-[#eff6ff] min-h-screen">
          <div className="max-w-5xl mx-auto space-y-6">

            <Callout type="iatf" title="IATF 16949 Cl. 8.5.1 — Control of Production & Service Provision">
              IPQC is the live execution of your control plan. Every inspection must match the control plan — characteristic, gauge, frequency, and reaction plan. Ad-hoc inspection without a control plan reference is a Major NC.
            </Callout>
            <Callout type="tip" title="Best Practice — IPQC First Principle">
              Never inspect just pass/fail. Always record the actual measured value. Auditors and engineers need measurement data to identify trends and trigger SPC reactions. A check sheet full of tick marks has no analytical value.
            </Callout>

            <div className="bg-white border border-[#dbeafe]/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-2">⚙️ IATF 16949 Cl. 8.5.1 — Control of Production</h2>
              <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                Cl. 8.5.1 is the core in-process control clause. It requires organizations to implement production and service provision under controlled conditions — using control plans, work instructions, approved equipment, monitoring and measurement, and error-proofing devices. IPQC is the real-time execution arm of the control plan.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {icon:'📋',title:'Control Plan at Every Op',desc:'Every operation must have a linked control plan defining: characteristic, specification, gauge, sampling frequency, control method, and reaction plan. IPQC inspects per the control plan — not ad-hoc.'},
                  {icon:'🔒',title:'Cl. 8.5.1.1 — Error Proofing',desc:'IATF specifically requires error proofing be considered in manufacturing. Poka-yoke devices must be challenged periodically (per frequency defined in control plan). Failed challenge = immediate line stop.'},
                  {icon:'📊',title:'Cl. 8.5.1.2 — SPC & Statistical Tools',desc:'Statistical process control must be applied to CC/SC characteristics. OOC signals require immediate reaction per the reaction plan. Cpk < 1.33 triggers process improvement action.'},
                ].map(c => (
                  <div key={c.title} className="bg-[#eff6ff]/20 border border-[#dbeafe] rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-[#1d4ed8] font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-amber-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📊 Key IPQC Metrics — Definitions and Targets</h2>
              <div className="space-y-3">
                {[
                  {metric:'FTT % — First Time Through',formula:'(Units Produced − Units Rejected) ÷ Units Produced × 100',target:'Target: ≥ 98% (world class: 99.5%+)',color:'text-green-300',detail:'FTT measures how many units pass through production without any rework, repair, or scrap on the first attempt. A unit that is reworked even once is a FTT failure — even if the final part is acceptable.'},
                  {metric:'IPPM — In-Process PPM',formula:'(Units Rejected ÷ Units Produced) × 1,000,000',target:'Target: < 500 PPM (world class: < 100 PPM)',color:'text-[#1d4ed8]',detail:'Internal PPM tracks the internal defect rate. High IPPM means your process is generating defects — the risk of customer escape increases even with a good OQC filter.'},
                  {metric:'COPQ — Cost of Poor Quality',formula:'Scrap Cost + Rework Labour + Re-inspection Cost + Downtime Cost',target:'Target: < 0.5% of Sales Turnover',color:'text-amber-700',detail:'COPQ is the total cost incurred because quality was not right first time. IATF Cl. 9.3.2 requires COPQ to be reported at Management Review.'},
                  {metric:'Red Bin Analysis',formula:'Weekly count of red-bin rejections by defect type (Pareto)',target:'Trending down month-over-month. Top 3 defects must have active CA.',color:'text-red-700',detail:'Red bin is the physical bin where defective parts are placed during production. Weekly analysis of red bin data gives the fastest leading indicator of process problems.'},
                ].map(m => (
                  <div key={m.metric} className="bg-white rounded-xl p-4">
                    <div className={`font-bold text-sm mb-1 ${m.color}`}>{m.metric}</div>
                    <div className="text-xs text-[#1e3a5f] font-mono mb-1">Formula: {m.formula}</div>
                    <div className="text-xs text-[#1e3a5f] mb-1">{m.target}</div>
                    <p className="text-xs text-[#1e3a5f] leading-relaxed">{m.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🔄 4M Change Control — IATF 16949 Cl. 8.5.6</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[
                  {m:'👤 Man',changes:['New operator on CC/SC operation','Operator returning after long absence','Contractor / temp worker on safety-critical operation','Supervisor change affecting quality oversight'],action:'Mandatory: Verify operator training on current WI. Conduct first-off approval. Monitor first 50 pieces.'},
                  {m:'🔧 Machine',changes:['Machine repair / breakdown and restart','New machine or machine relocation','Tooling change (punch, die, fixture)','PM completion on CC/SC machine'],action:'Mandatory: First-off approval of 5+ pieces. Verify machine parameters vs process control sheet. Re-run SPC for 25 pieces before confirming stability.'},
                  {m:'📦 Material',changes:['New material lot or batch','Material supplier change','Material grade or specification change','Incoming material found outside spec (concession)'],action:'Mandatory: First-off approval. Incoming inspection for new lot. Customer notification if CC/SC material changed.'},
                  {m:'📋 Method',changes:['Process parameter change (temp, pressure, speed, torque)','Work Instruction revision','Packaging or handling method change','Inspection method or gauge change'],action:'Mandatory: Update WI and control plan. First-off approval after method change. Customer PPAP may be required for major method changes.'},
                ].map(c => (
                  <div key={c.m} className="bg-green-900/30/20 border border-green-700/50 rounded-xl p-4">
                    <div className="text-[#15803d] font-bold text-sm mb-2">{c.m}</div>
                    <div className="text-xs text-[#1e3a5f] mb-2">Triggering Events:</div>
                    {c.changes.map((ch,i) => <div key={i} className="flex items-start gap-2 mb-1 text-xs"><span className="text-[#1e3a5f]">•</span><span className="text-[#1e3a5f]">{ch}</span></div>)}
                    <div className="mt-2 text-xs text-green-600 leading-relaxed">{c.action}</div>
                  </div>
                ))}
              </div>
              <Callout type="warn" title="4M Change — Common Major NC">
                Every 4M change must be logged in the 4M change register with: date, change type, approval authority, first-off result, and customer notification status (if required). Uncontrolled 4M changes are one of the top 5 Major NCs in IATF 16949 audits globally.
              </Callout>
            </div>

            <div className="bg-white border border-red-900/50 rounded-2xl p-6">
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
                  <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-800/30 rounded-lg px-4 py-3">
                    <span className="text-red-600 flex-shrink-0">✗</span>
                    <p className="text-red-700 text-xs leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GUIDE */}
      {tab === 'guide' && (
        <div className="animate-fadeIn p-6 bg-[#eff6ff] min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* -- Frequency Filter Cards -- */}
            <div>
              <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-2">📅 Filter by Frequency</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {IPQC_PROCESSES.map(s => (
                  <button key={s.freq} onClick={() => setFreqFilter(f => f === s.freq ? 'All' : s.freq)}
                    className={`${s.color} rounded-xl px-3 py-3 text-center transition-all hover:brightness-110 hover:scale-[1.02] ${freqFilter===s.freq?`ring-2 ${s.ring} scale-[1.03]`:'opacity-85'}`}>
                    <p className="text-xl">{s.icon}</p>
                    <p className="text-sm text-white font-bold mt-0.5">{s.freq}</p>
                    <p className="text-[11px] text-white/80">{freqFilter===s.freq?'▲ Show All':`${s.items.length} tasks`}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* -- Process Rhythm Cards -- */}
            {IPQC_PROCESSES.filter(s => freqFilter === 'All' || s.freq === freqFilter).map(s => (
              <div key={s.freq}>
                <div className={`${s.color} rounded-xl px-4 py-2 mb-2 flex items-center gap-2`}>
                  <span className="text-base">{s.icon}</span>
                  <span className="text-sm font-bold text-white">{s.freq} Tasks — IPQC</span>
                  <span className="ml-auto text-xs text-white/80">{s.items.length} activities</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {s.items.map(p => (
                    <div key={p.no} className="bg-white border border-[#dbeafe] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${s.color}`}>{p.no}</span>
                        <span className="text-[10px] text-[#1d4ed8] font-semibold">{p.clause}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0f172a] mb-1">{p.label}</p>
                      <p className="text-xs text-[#1e3a5f] leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-[#dbeafe] pt-4">
              <h3 className="text-sm font-bold text-[#0f172a] mb-3">📋 Step-by-Step IPQC Patrol Guide</h3>
            </div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-[#0f172a]">IPQC Patrol Inspection — How to Do It Right</h2>
              <p className="text-[#1e3a5f] text-sm mt-1">IATF 16949 Cl. 8.5.1 · Control Plan Adherence · Error Proofing · FTT</p>
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
              <div key={s.step} className="bg-white border border-[#dbeafe] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><span className="text-xl">{s.icon}</span><h3 className="text-[#1d4ed8] font-bold text-sm">{s.title}</h3></div>
                    <p className="text-[#1e3a5f] text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <QualityCopilot page="process-quality" />
    </div>
  );
}