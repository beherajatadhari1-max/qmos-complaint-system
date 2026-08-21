'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ----------------------------------------------------------------------
type Shift = 'A' | 'B' | 'C';
type ShiftStatus = 'running' | 'completed' | 'planned';
type DowntimeCategory = 'breakdown' | 'planned-maintenance' | 'changeover' | 'material-shortage' | 'quality-hold' | 'other';
type MaintenanceType = 'preventive' | 'predictive' | 'corrective' | 'breakdown';
type MaintenanceStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';

interface ShiftLog {
  id: string; date: string; shift: Shift; line: string;
  partNumber: string; partName: string;
  planQty: number; actualQty: number; goodQty: number; rejectQty: number; reworkQty: number;
  plannedTime: number; actualRunTime: number; downtime: number;
  status: ShiftStatus; operator: string; supervisor: string; notes: string;
}
interface DowntimeEntry {
  id: string; shiftLogId: string; date: string; shift: Shift; line: string;
  startTime: string; endTime: string; duration: number;
  category: DowntimeCategory; equipment: string; description: string;
  rootCause: string; actionTaken: string; reportedBy: string;
}
interface MaintenanceTask {
  id: string; equipmentId: string; equipmentName: string; line: string;
  type: MaintenanceType; description: string; frequency: string;
  scheduledDate: string; completedDate: string; status: MaintenanceStatus;
  assignedTo: string; estimatedDuration: number; actualDuration: number;
  checklist: string[]; remarks: string;
}
interface FourMChange {
  id: string; date: string; changeType: 'Man' | 'Machine' | 'Material' | 'Method';
  description: string; requestedBy: string; approvedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  impact: 'high' | 'medium' | 'low'; iatfClause: string;
  verificationRequired: boolean; trialRequired: boolean; notes: string;
}

// -- Helpers -------------------------------------------------------------------
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const oeeBar = (v: number) => v >= 0.85 ? '#10b981' : v >= 0.65 ? '#f59e0b' : '#ef4444';
function calcOEE(s: ShiftLog) {
  const avail = s.plannedTime > 0 ? s.actualRunTime / s.plannedTime : 0;
  const perf  = s.actualRunTime > 0 && s.planQty > 0
    ? (s.actualQty / s.planQty) * (s.plannedTime / s.actualRunTime) : 0;
  const qual  = s.actualQty > 0 ? s.goodQty / s.actualQty : 0;
  return { avail, perf, qual, oee: avail * perf * qual };
}

// -- Sample Data ---------------------------------------------------------------
const SAMPLE_SHIFTS: ShiftLog[] = [
  { id:'SL001', date:'2025-01-15', shift:'A', line:'Line-1', partNumber:'PN-4521', partName:'Bracket Assembly', planQty:480, actualQty:462, goodQty:445, rejectQty:12, reworkQty:5, plannedTime:480, actualRunTime:440, downtime:40, status:'completed', operator:'Ravi Kumar', supervisor:'Amit Sharma', notes:'Downtime due to sensor fault at 08:30' },
  { id:'SL002', date:'2025-01-15', shift:'B', line:'Line-1', partNumber:'PN-4521', partName:'Bracket Assembly', planQty:480, actualQty:476, goodQty:470, rejectQty:4, reworkQty:2, plannedTime:480, actualRunTime:468, downtime:12, status:'completed', operator:'Suresh Patel', supervisor:'Manoj Singh', notes:'Good shift. Minor changeover delay.' },
  { id:'SL003', date:'2025-01-15', shift:'C', line:'Line-2', partNumber:'PN-7823', partName:'Housing Cover', planQty:320, actualQty:298, goodQty:289, rejectQty:9, reworkQty:0, plannedTime:480, actualRunTime:410, downtime:70, status:'completed', operator:'Deepak Yadav', supervisor:'Priya Nair', notes:'Breakdown on Welding Station-2 for 55 min' },
  { id:'SL004', date:'2025-01-16', shift:'A', line:'Line-2', partNumber:'PN-7823', partName:'Housing Cover', planQty:320, actualQty:315, goodQty:312, rejectQty:3, reworkQty:0, plannedTime:480, actualRunTime:472, downtime:8, status:'completed', operator:'Ramesh Babu', supervisor:'Priya Nair', notes:'' },
  { id:'SL005', date:'2025-01-16', shift:'B', line:'Line-3', partNumber:'PN-3301', partName:'Shaft Gear', planQty:200, actualQty:180, goodQty:175, rejectQty:5, reworkQty:0, plannedTime:480, actualRunTime:380, downtime:100, status:'completed', operator:'Vikram Singh', supervisor:'Kiran Desai', notes:'Material shortage 60 min + tool changeover 40 min' },
];
const SAMPLE_DOWNTIME: DowntimeEntry[] = [
  { id:'DT001', shiftLogId:'SL001', date:'2025-01-15', shift:'A', line:'Line-1', startTime:'08:30', endTime:'09:10', duration:40, category:'breakdown', equipment:'Pneumatic Press P-01', description:'Proximity sensor failure — press not cycling', rootCause:'Sensor worn out — 18 months old, exceeded PM schedule', actionTaken:'Replaced sensor, re-calibrated, resumed production', reportedBy:'Ravi Kumar' },
  { id:'DT002', shiftLogId:'SL002', date:'2025-01-15', shift:'B', line:'Line-1', startTime:'17:45', endTime:'17:57', duration:12, category:'changeover', equipment:'Press P-01', description:'Part changeover from PN-4521 to PN-4522', rootCause:'Scheduled changeover', actionTaken:'SMED changeover completed', reportedBy:'Suresh Patel' },
  { id:'DT003', shiftLogId:'SL003', date:'2025-01-15', shift:'C', line:'Line-2', startTime:'23:10', endTime:'00:05', duration:55, category:'breakdown', equipment:'Welding Station W-02', description:'MIG welding wire feed jam — production halted', rootCause:'Wire spool end not detected — no interlock', actionTaken:'Wire feed cleared, spool replaced, interlock requested via MRN', reportedBy:'Deepak Yadav' },
  { id:'DT004', shiftLogId:'SL003', date:'2025-01-15', shift:'C', line:'Line-2', startTime:'01:00', endTime:'01:15', duration:15, category:'quality-hold', equipment:'Inspection Station QS-2', description:'Dimensional OOS detected — production paused for sorting', rootCause:'Fixture slip during welding', actionTaken:'100% sorting initiated, fixture re-clamped, setup verified', reportedBy:'Deepak Yadav' },
  { id:'DT005', shiftLogId:'SL005', date:'2025-01-16', shift:'B', line:'Line-3', startTime:'15:00', endTime:'16:00', duration:60, category:'material-shortage', equipment:'N/A', description:'Raw material stock-out — PN-3301 blanks not delivered from stores', rootCause:'Stores not notified of revised production schedule', actionTaken:'Emergency material issue, stores alerted, scheduling sync meeting arranged', reportedBy:'Vikram Singh' },
];
const SAMPLE_MAINTENANCE: MaintenanceTask[] = [
  { id:'MT001', equipmentId:'EQ-P01', equipmentName:'Pneumatic Press P-01', line:'Line-1', type:'preventive', description:'Monthly PM — lubrication, sensor check, pressure calibration', frequency:'Monthly', scheduledDate:'2025-01-20', completedDate:'', status:'pending', assignedTo:'Ashok (Maint Tech)', estimatedDuration:90, actualDuration:0, checklist:['Check oil level & lubricate slides','Test all proximity sensors','Calibrate pressure regulator','Inspect pneumatic hoses & fittings','Clean die and check alignment'], remarks:'' },
  { id:'MT002', equipmentId:'EQ-W02', equipmentName:'Welding Station W-02', line:'Line-2', type:'corrective', description:'Install wire-end detection interlock — raised after DT003 breakdown', frequency:'One-time', scheduledDate:'2025-01-18', completedDate:'', status:'in-progress', assignedTo:'Sunil (Automation Tech)', estimatedDuration:120, actualDuration:0, checklist:['Source reed switch sensor','Install on wire feed unit','Wire to PLC input','Test wire-end alarm trigger','Validate with production trial'], remarks:'Sensor sourced — wiring in progress' },
  { id:'MT003', equipmentId:'EQ-C03', equipmentName:'CNC Machining Center C-03', line:'Line-3', type:'preventive', description:'Weekly PM — spindle warm-up, coolant level, chip conveyor check', frequency:'Weekly', scheduledDate:'2025-01-13', completedDate:'2025-01-13', status:'completed', assignedTo:'Raju (Maint Tech)', estimatedDuration:45, actualDuration:40, checklist:['Spindle warm-up 10 min','Check coolant concentration','Clean chip conveyor','Inspect tool holders','Verify axis home positions'], remarks:'All OK. Coolant topped up 2 litres.' },
  { id:'MT004', equipmentId:'EQ-C04', equipmentName:'Conveyor Belt C-04', line:'Line-1', type:'preventive', description:'Quarterly PM — belt tension, roller bearings, motor check', frequency:'Quarterly', scheduledDate:'2025-01-10', completedDate:'', status:'overdue', assignedTo:'Ashok (Maint Tech)', estimatedDuration:60, actualDuration:0, checklist:['Check belt tension & alignment','Inspect all rollers for bearing noise','Lubricate motor bearings','Check drive chain tension','Test emergency stop'], remarks:'Overdue — technician on breakdown duty' },
  { id:'MT005', equipmentId:'EQ-R01', equipmentName:'Robotic Arm R-01', line:'Line-2', type:'predictive', description:'Vibration analysis — axis joints 1-4', frequency:'Quarterly', scheduledDate:'2025-01-25', completedDate:'', status:'pending', assignedTo:'OEM Service', estimatedDuration:180, actualDuration:0, checklist:['Mount vibration sensors on J1-J4','Record baseline vs previous quarter','Analyse frequency spectrum','Grease replenishment if needed','Issue health report'], remarks:'OEM engineer scheduled 25-Jan 9:00 AM' },
];
const SAMPLE_4M: FourMChange[] = [
  { id:'4M001', date:'2025-01-15', changeType:'Machine', description:'Replaced proximity sensor on Press P-01 — model changed from X101 to X102 after breakdown', requestedBy:'Ravi Kumar', approvedBy:'Amit Sharma', status:'implemented', impact:'medium', iatfClause:'8.5.6', verificationRequired:true, trialRequired:false, notes:'Sensor spec confirmed equivalent. First-article verification done. Customer Q-rep informed.' },
  { id:'4M002', date:'2025-01-14', changeType:'Material', description:'Alternate raw material supplier for PN-3301 blanks — AISI 1040 from Supplier B instead of Supplier A', requestedBy:'Purchase Dept', approvedBy:'Quality Head', status:'pending', impact:'high', iatfClause:'8.5.6', verificationRequired:true, trialRequired:true, notes:'Material cert received. Trial batch 50 pcs planned. Customer approval required — CSR check needed.' },
  { id:'4M003', date:'2025-01-12', changeType:'Method', description:'Updated welding parameter standard — wire speed 8 m/min to 8.5 m/min for improved bead quality', requestedBy:'Process Engg', approvedBy:'Quality Manager', status:'approved', impact:'medium', iatfClause:'8.5.6', verificationRequired:true, trialRequired:true, notes:'WPS updated. Trial run 30 assemblies — all passed visual + dimensional. SPC chart reset required.' },
  { id:'4M004', date:'2025-01-10', changeType:'Man', description:'New operator Rajiv Gupta assigned to Line-3 after Vikram Singh transfer to night shift', requestedBy:'Production Head', approvedBy:'HR + Quality', status:'implemented', impact:'low', iatfClause:'8.5.6', verificationRequired:false, trialRequired:false, notes:'Rajiv trained and evaluated. Skill matrix updated. Monitored for first 3 shifts — no issues.' },
];

// -- Color maps ----------------------------------------------------------------
const DT_COLOR: Record<string,string> = { 'breakdown':'#ef4444','planned-maintenance':'#3b82f6','changeover':'#f59e0b','material-shortage':'#8b5cf6','quality-hold':'#ec4899','other':'#6b7280' };
const MAINT_COLOR: Record<string,string> = { 'pending':'#f59e0b','in-progress':'#3b82f6','completed':'#10b981','overdue':'#ef4444' };
const M4_COLOR: Record<string,string> = { 'Man':'#3b82f6','Machine':'#ea580c','Material':'#8b5cf6','Method':'#10b981' };

const NAV = [
  { id:'dashboard',label:'📊 Dashboard' },{ id:'shiftlog',label:'📋 Shift Log' },
  { id:'downtime', label:'⏹ Downtime' }, { id:'tpm',     label:'🔧 TPM' },
  { id:'oee',      label:'🧮 OEE Calc' },{ id:'fourem',  label:'🔄 4M Changes' },
  { id:'knowledge',label:'📚 Knowledge'},{ id:'reports', label:'📈 Reports' },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function ManufacturingPage() {
  const [mainTab, setMainTab] = useState<'dashboard'|'shiftlog'|'downtime'|'tpm'|'oee'|'fourem'|'knowledge'|'reports'>('dashboard');
  const [freqFilter, setFreqFilter] = useState('All');
  const [expanded,      setExpanded]      = useState<string|null>(null);
  const [expandedMaint, setExpandedMaint] = useState<string|null>(null);
  const [filterLine,        setFilterLine]        = useState('all');
  const [filterShift,       setFilterShift]       = useState('all');
  const [filterDtCat,       setFilterDtCat]       = useState('all');
  const [filterMaintStatus, setFilterMaintStatus] = useState('all');
  const [oeeIn, setOeeIn] = useState({ planned:'480', downtime:'52', idealCycle:'0.533', totalParts:'431', goodParts:'425' });

  const shifts      = SAMPLE_SHIFTS;
  const downtimes   = SAMPLE_DOWNTIME;
  const maintenance = SAMPLE_MAINTENANCE;
  const fourM       = SAMPLE_4M;

  const aggOEE = useMemo(() => {
    const tp=shifts.reduce((a,s)=>a+s.plannedTime,0), tr=shifts.reduce((a,s)=>a+s.actualRunTime,0);
    const pp=shifts.reduce((a,s)=>a+s.planQty,0),     aq=shifts.reduce((a,s)=>a+s.actualQty,0);
    const gq=shifts.reduce((a,s)=>a+s.goodQty,0);
    const avail=tp>0?tr/tp:0, perf=tr>0&&pp>0?(aq/pp)*(tp/tr):0, qual=aq>0?gq/aq:0;
    return { avail, perf, qual, oee:avail*perf*qual };
  }, [shifts]);

  const dtPareto = useMemo(() => {
    const map: Record<string,number>={};
    downtimes.forEach(d=>{ map[d.category]=(map[d.category]||0)+d.duration; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }, [downtimes]);

  const totalDT      = useMemo(()=>downtimes.reduce((a,d)=>a+d.duration,0),[downtimes]);
  const overdueCount = maintenance.filter(m=>m.status==='overdue').length;

  const oeeCalc = useMemo(() => {
    const planned=parseFloat(oeeIn.planned)||480, dt=parseFloat(oeeIn.downtime)||0;
    const ideal=parseFloat(oeeIn.idealCycle)||0,  total=parseFloat(oeeIn.totalParts)||0;
    const good=parseFloat(oeeIn.goodParts)||0,    runTime=planned-dt;
    const avail=planned>0?runTime/planned:0;
    const perf=ideal>0&&runTime>0?(ideal*total)/runTime:0;
    const qual=total>0?good/total:0;
    return { avail, perf, qual, oee:avail*perf*qual, runTime };
  }, [oeeIn]);

  const lines          = useMemo(()=>['all',...Array.from(new Set(shifts.map(s=>s.line)))],[shifts]);
  const filteredShifts = useMemo(()=>shifts.filter(s=>(filterLine==='all'||s.line===filterLine)&&(filterShift==='all'||s.shift===filterShift)),[shifts,filterLine,filterShift]);
  const filteredDT     = useMemo(()=>downtimes.filter(d=>filterDtCat==='all'||d.category===filterDtCat),[downtimes,filterDtCat]);
  const filteredMaint  = useMemo(()=>maintenance.filter(m=>filterMaintStatus==='all'||m.status===filterMaintStatus),[maintenance,filterMaintStatus]);

  return (
      <>
      <PageTitle title="Manufacturing" />
      <div className="p-6 bg-white min-h-screen max-w-7xl">

      {/* Header */}
      <div className="rounded-2xl mb-5 px-6 py-5" style={{background:'linear-gradient(135deg,#7c2d12,#ea580c)'}}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-white text-xl font-extrabold">🏭 Manufacturing Excellence Center</div>
            <div className="text-amber-700 text-xs mt-1">OEE · Shift Production · Downtime Analysis · TPM · 4M Change Control · IATF 16949 §8.5.6</div>
          </div>
          <div className="flex gap-5">
            {[
              { label:'Overall OEE', value:pct(aggOEE.oee),  color:aggOEE.oee>=0.85?'#86efac':'#fde68a' },
              { label:'Downtime',    value:`${totalDT} min`, color:'#fde68a' },
              { label:'PM Overdue',  value:`${overdueCount}`,color:overdueCount>0?'#fca5a5':'#86efac' },
            ].map(k=>(
              <div key={k.label} className="text-center">
                <div className="text-xl font-extrabold" style={{color:k.color}}>{k.value}</div>
                <div className="text-amber-700 text-xs">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex overflow-x-auto gap-1 mb-6 border-b border-[#dbeafe] scrollbar-hide">
        {NAV.map(t=>(
          <button key={t.id} onClick={()=>setMainTab(t.id as typeof mainTab)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex-shrink-0 ${mainTab===t.id?'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]':'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/manufacturing/OEE_Daily_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View OEE Tracker XLS">OEE Tracker XLS</a><a href="/downloads/manufacturing/OEE_Daily_Tracker.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download OEE Tracker XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/manufacturing/Downtime_Log.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Downtime Log XLS">Downtime Log XLS</a><a href="/downloads/manufacturing/Downtime_Log.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Downtime Log XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/manufacturing/PM_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View PM Checklist XLS">PM Checklist XLS</a><a href="/downloads/manufacturing/PM_Checklist.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download PM Checklist XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/manufacturing/4M_Change_Form.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View 4M Change Form XLS">4M Change Form XLS</a><a href="/downloads/manufacturing/4M_Change_Form.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download 4M Change Form XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#b45309'}}><a href="/downloads/manufacturing/Shift_Production_Report.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Shift Report XLS">Shift Report XLS</a><a href="/downloads/manufacturing/Shift_Production_Report.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Shift Report XLS">⬇</a></span>
      </div>
      {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
      {mainTab==='dashboard' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label:'Overall OEE', value:aggOEE.oee, target:0.85, icon:'🎯' },
              { label:'Availability', value:aggOEE.avail, target:0.90, icon:'⏱' },
              { label:'Performance', value:aggOEE.perf, target:0.95, icon:'⚡' },
              { label:'Quality Rate', value:aggOEE.qual, target:0.995, icon:'✅' },
            ].map(k=>(
              <div key={k.label} className="rounded-xl border-2 p-4" style={{borderColor:k.value>=k.target?'#10b981':'#f59e0b',background:k.value>=k.target?'#f0fdf4':'#fffbeb'}}>
                <div className="text-2xl mb-1">{k.icon}</div>
                <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
                <div className="text-2xl font-extrabold" style={{color:oeeBar(k.value)}}>{pct(k.value)}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">Target: {pct(k.target)}</div>
                <div className="mt-2 h-2 bg-[#dbeafe] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${Math.min(k.value*100,100)}%`,background:oeeBar(k.value)}} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-5 text-xs">
            <span className="font-bold text-orange-600">OEE = </span>
            Availability {pct(aggOEE.avail)} × Performance {pct(aggOEE.perf)} × Quality {pct(aggOEE.qual)} = <span className="font-extrabold text-orange-600">OEE {pct(aggOEE.oee)}</span>
            <span className="text-[#1e3a5f] ml-3">| World Class Target: ≥85% (JIPM)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl border border-[#dbeafe] shadow-sm p-4">
              <div className="font-bold text-[#1e3a5f] mb-3 text-sm">📈 OEE by Line</div>
              {Array.from(new Set(shifts.map(s=>s.line))).map(line=>{
                const ls=shifts.filter(s=>s.line===line);
                const tp=ls.reduce((a,s)=>a+s.plannedTime,0), tr=ls.reduce((a,s)=>a+s.actualRunTime,0);
                const pp=ls.reduce((a,s)=>a+s.planQty,0), aq=ls.reduce((a,s)=>a+s.actualQty,0), gq=ls.reduce((a,s)=>a+s.goodQty,0);
                const av=tp>0?tr/tp:0, pf=tr>0&&pp>0?(aq/pp)*(tp/tr):0, ql=aq>0?gq/aq:0, oe=av*pf*ql;
                return (
                  <div key={line} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-[#1e3a5f]">{line}</span>
                      <span className="font-extrabold" style={{color:oeeBar(oe)}}>{pct(oe)}</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${Math.min(oe*100,100)}%`,background:oeeBar(oe)}} />
                    </div>
                    <div className="flex gap-3 text-xs text-[#1e3a5f] mt-1">
                      <span>A:{pct(av)}</span><span>P:{pct(pf)}</span><span>Q:{pct(ql)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-[#dbeafe] shadow-sm p-4">
              <div className="font-bold text-[#1e3a5f] mb-3 text-sm">⏹ Downtime Pareto</div>
              {dtPareto.map(([cat,dur])=>(
                <div key={cat} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold capitalize" style={{color:DT_COLOR[cat]||'#6b7280'}}>{cat.replace(/-/g,' ')}</span>
                    <span className="font-bold text-[#1e3a5f]">{dur} min ({totalDT>0?Math.round(dur/totalDT*100):0}%)</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${totalDT>0?dur/totalDT*100:0}%`,background:DT_COLOR[cat]||'#6b7280'}} />
                  </div>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t text-xs font-bold text-[#1e3a5f]">Total: {totalDT} min ({(totalDT/60).toFixed(1)} hrs)</div>
            </div>
          </div>

          <div className="rounded-xl border border-red-700/50 bg-red-50 p-4">
            <div className="font-bold text-red-700 mb-3 text-sm">🔴 Open Maintenance Alerts</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {maintenance.filter(m=>m.status!=='completed').map(m=>(
                <div key={m.id} className="bg-white rounded-lg border border-[#dbeafe] p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-[#1e3a5f]">{m.equipmentName}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:MAINT_COLOR[m.status]+'22',color:MAINT_COLOR[m.status]}}>{m.status}</span>
                  </div>
                  <div className="text-xs text-[#1e3a5f]">{m.description}</div>
                  <div className="text-xs text-[#1e3a5f] mt-1">Sched: {m.scheduledDate} · {m.assignedTo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ SHIFT LOG ══════════════════════════════════════════════════════ */}
      {mainTab==='shiftlog' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <select value={filterLine} onChange={e=>setFilterLine(e.target.value)} className="border border-[#dbeafe] rounded-lg text-xs px-3 py-1.5">
              {lines.map(l=><option key={l} value={l}>{l==='all'?'All Lines':l}</option>)}
            </select>
            <select value={filterShift} onChange={e=>setFilterShift(e.target.value)} className="border border-[#dbeafe] rounded-lg text-xs px-3 py-1.5">
              <option value="all">All Shifts</option>
              <option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option>
            </select>
            <span className="text-xs text-[#1e3a5f] self-center">{filteredShifts.length} records</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#dbeafe] mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr style={{background:'#7c2d12',color:'#fff'}}>
                  {['ID','Date','Sh','Line','Part','Plan','Actual','Good','Rej','DT(min)','OEE','Status',''].map(h=>(
                    <th key={h} className="px-3 py-2 text-left font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredShifts.map((s,i)=>{
                  const {oee,avail,perf,qual}=calcOEE(s);
                  return (
                    <>
                      <tr key={s.id} className={i%2===0?'bg-white':'bg-[#eff6ff]'}>
                        <td className="px-3 py-2 font-mono text-[#1e3a5f]">{s.id}</td>
                        <td className="px-3 py-2">{s.date}</td>
                        <td className="px-3 py-2 font-bold">{s.shift}</td>
                        <td className="px-3 py-2">{s.line}</td>
                        <td className="px-3 py-2"><div>{s.partNumber}</div><div className="text-[#1e3a5f]">{s.partName}</div></td>
                        <td className="px-3 py-2 font-bold">{s.planQty}</td>
                        <td className="px-3 py-2">{s.actualQty}</td>
                        <td className="px-3 py-2 text-emerald-600 font-bold">{s.goodQty}</td>
                        <td className="px-3 py-2 text-red-500">{s.rejectQty}</td>
                        <td className="px-3 py-2">{s.downtime}</td>
                        <td className="px-3 py-2 font-extrabold" style={{color:oeeBar(oee)}}>{pct(oee)}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{background:s.status==='completed'?'#dcfce7':s.status==='running'?'#dbeafe':'#f3f4f6',color:s.status==='completed'?'#166534':s.status==='running'?'#1e40af':'#374151'}}>{s.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={()=>setExpanded(expanded===s.id?null:s.id)} className="text-orange-600 font-bold">{expanded===s.id?'▲':'▼'}</button>
                        </td>
                      </tr>
                      {expanded===s.id && (
                        <tr key={s.id+'_exp'} className="bg-amber-50">
                          <td colSpan={13} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                              {([['Operator',s.operator],['Supervisor',s.supervisor],['Planned',`${s.plannedTime} min`],['Run Time',`${s.actualRunTime} min`],['Downtime',`${s.downtime} min`],['Rework',`${s.reworkQty} pcs`],['Availability',pct(avail)],['Performance',pct(perf)],['Quality',pct(qual)],['OEE',pct(oee)]] as [string,string][]).map(([k,v])=>(
                                <div key={k}><span className="text-[#1e3a5f]">{k}: </span><span className="font-bold text-[#1e3a5f]">{v}</span></div>
                              ))}
                            </div>
                            {s.notes && <div className="mt-2 text-xs text-[#1e3a5f]"><b>Notes:</b> {s.notes}</div>}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center">
              {([['Total Plan',filteredShifts.reduce((a,s)=>a+s.planQty,0)],['Total Actual',filteredShifts.reduce((a,s)=>a+s.actualQty,0)],['Total Good',filteredShifts.reduce((a,s)=>a+s.goodQty,0)],['Total Reject',filteredShifts.reduce((a,s)=>a+s.rejectQty,0)],['Total DT',filteredShifts.reduce((a,s)=>a+s.downtime,0)+' min']] as [string,string|number][]).map(([k,v])=>(
                <div key={k}><div className="text-[#1e3a5f]">{k}</div><div className="text-lg font-extrabold text-orange-600">{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ DOWNTIME ═══════════════════════════════════════════════════════ */}
      {mainTab==='downtime' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {dtPareto.map(([cat,dur])=>(
              <div key={cat} className="rounded-xl border-2 p-3" style={{borderColor:DT_COLOR[cat]||'#6b7280'}}>
                <div className="text-xs font-bold capitalize mb-1" style={{color:DT_COLOR[cat]||'#6b7280'}}>{cat.replace(/-/g,' ')}</div>
                <div className="text-2xl font-extrabold text-[#1e3a5f]">{dur} <span className="text-sm font-normal text-[#1e3a5f]">min</span></div>
                <div className="text-xs text-[#1e3a5f]">{totalDT>0?Math.round(dur/totalDT*100):0}% of total</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <select value={filterDtCat} onChange={e=>setFilterDtCat(e.target.value)} className="border border-[#dbeafe] rounded-lg text-xs px-3 py-1.5">
              <option value="all">All Categories</option>
              {Object.keys(DT_COLOR).map(c=><option key={c} value={c}>{c.replace(/-/g,' ')}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {filteredDT.map(d=>(
              <div key={d.id} className="rounded-xl border border-[#dbeafe] shadow-sm p-4 bg-white">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#1e3a5f]">{d.id}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded text-white capitalize" style={{background:DT_COLOR[d.category]||'#6b7280'}}>{d.category.replace(/-/g,' ')}</span>
                  </div>
                  <div className="text-xs text-[#1e3a5f]">{d.date} | Shift {d.shift} | {d.line} | {d.startTime}–{d.endTime}</div>
                  <div className="text-xl font-extrabold text-red-500">{d.duration} min</div>
                </div>
                <div className="text-sm font-bold text-[#1e3a5f] mb-1">{d.equipment}</div>
                <div className="text-xs text-[#1e3a5f] mb-2">{d.description}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[#1e3a5f]">Root Cause: </span><span className="text-[#1e3a5f]">{d.rootCause}</span></div>
                  <div><span className="text-[#1e3a5f]">Action Taken: </span><span className="text-[#1e3a5f]">{d.actionTaken}</span></div>
                </div>
                <div className="text-xs text-[#1e3a5f] mt-1">Reported by: {d.reportedBy}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TPM ════════════════════════════════════════════════════════════ */}
      {mainTab==='tpm' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {([['Total',maintenance.length,'#374151'],['Completed',maintenance.filter(m=>m.status==='completed').length,'#10b981'],['In Progress',maintenance.filter(m=>m.status==='in-progress').length,'#3b82f6'],['Overdue',maintenance.filter(m=>m.status==='overdue').length,'#ef4444']] as [string,number,string][]).map(([k,v,c])=>(
              <div key={k} className="rounded-xl border border-[#dbeafe] shadow-sm p-4 text-center">
                <div className="text-2xl font-extrabold mb-1" style={{color:c}}>{v}</div>
                <div className="text-xs text-[#1e3a5f]">{k}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
            <div className="text-sm font-bold text-orange-600 mb-3">8 Pillars of TPM (JIPM)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[['1️⃣','Autonomous Maintenance','7-step Jishu Hozen — operators maintain their own equipment'],['2️⃣','Focused Improvement','Kobetsu Kaizen — teams eliminate 16 major losses'],['3️⃣','Planned Maintenance','PM/Predictive/Corrective schedules — MTTR/MTBF focus'],['4️⃣','Quality Maintenance','Zero-defect manufacturing — Hinshitsu Hozen'],['5️⃣','Training & Education','Operator and technician skill development — OJT + certification'],['6️⃣','Early Equipment Mgmt','Design new equipment for zero-loss from startup — MP design'],['7️⃣','Safety & Environment','Zero accidents, zero pollution — HIRA, safe workplace'],['8️⃣','Office TPM','Extend TPM to administrative and support departments']].map(([no,name,desc])=>(
                <div key={String(name)} className="bg-white rounded-lg border border-amber-200 p-2">
                  <div className="text-base mb-1">{no}</div>
                  <div className="text-xs font-bold text-orange-600 mb-1">{name}</div>
                  <div className="text-xs text-[#1e3a5f]">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <select value={filterMaintStatus} onChange={e=>setFilterMaintStatus(e.target.value)} className="border border-[#dbeafe] rounded-lg text-xs px-3 py-1.5">
              <option value="all">All Status</option>
              <option value="pending">Pending</option><option value="in-progress">In Progress</option>
              <option value="completed">Completed</option><option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredMaint.map(m=>(
              <div key={m.id} className="rounded-xl border border-[#dbeafe] bg-white">
                <div className="p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div>
                      <div className="text-sm font-bold text-[#1e3a5f]">{m.equipmentName}</div>
                      <div className="text-xs text-[#1e3a5f]">{m.equipmentId} · {m.line}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 rounded font-bold capitalize" style={{background:MAINT_COLOR[m.status]+'22',color:MAINT_COLOR[m.status]}}>{m.status}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white text-[#1e3a5f] font-bold capitalize">{m.type}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#1e3a5f] mb-2">{m.description}</div>
                  <div className="flex flex-wrap gap-3 text-xs text-[#1e3a5f] mb-2">
                    <span>📅 {m.scheduledDate}</span><span>👤 {m.assignedTo}</span>
                    <span>⏱ Est: {m.estimatedDuration} min</span><span>🔁 {m.frequency}</span>
                  </div>
                  {m.remarks && <div className="text-xs text-[#1e3a5f] italic">{m.remarks}</div>}
                  <button onClick={()=>setExpandedMaint(expandedMaint===m.id?null:m.id)} className="mt-2 text-xs text-orange-600 font-bold">
                    {expandedMaint===m.id?'▲ Hide Checklist':'▼ Show Checklist'}
                  </button>
                </div>
                {expandedMaint===m.id && (
                  <div className="border-t border-[#dbeafe] px-4 pb-4">
                    <div className="text-xs font-bold text-[#1e3a5f] mt-3 mb-2">PM Checklist</div>
                    <div className="space-y-1">
                      {m.checklist.map((item,idx)=>(
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <span className={m.status==='completed'?'text-emerald-500':'text-[#1e3a5f]'}>{m.status==='completed'?'✅':'⬜'}</span>
                          <span className="text-[#1e3a5f]">{item}</span>
                        </div>
                      ))}
                    </div>
                    {m.completedDate && <div className="text-xs text-[#1e3a5f] mt-2">Completed: {m.completedDate} · Actual: {m.actualDuration} min</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ OEE CALCULATOR ═════════════════════════════════════════════════ */}
      {mainTab==='oee' && (
        <div className="animate-fadeIn max-w-4xl">
          <div className="text-sm font-bold text-[#1e3a5f] mb-1">🧮 Interactive OEE Calculator</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Enter shift data — Availability, Performance, and Quality computed in real time</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl border border-[#dbeafe] shadow-sm p-5 bg-[#eff6ff]">
              <div className="text-sm font-bold text-[#1e3a5f] mb-4">Shift Inputs</div>
              {([['planned','Planned Production Time (min)','Scheduled production time — typically 480 min (8 hrs). Exclude scheduled breaks.'],['downtime','Total Downtime (min)','Breakdowns + changeovers + material shortage + quality holds'],['idealCycle','Ideal Cycle Time (min/part)','Theoretical fastest time per part — from engineering standard or OEM spec'],['totalParts','Total Parts Produced','All parts produced including rejects and rework'],['goodParts','Good Parts (First Pass)','Parts accepted without rework — First Time Quality (FTQ)']] as [string,string,string][]).map(([key,label,help])=>(
                <div key={key} className="mb-4">
                  <label className="text-xs font-bold text-[#1e3a5f] block mb-1">{label}</label>
                  <input type="number" step="0.001" value={oeeIn[key as keyof typeof oeeIn]}
                    onChange={e=>setOeeIn(p=>({...p,[key]:e.target.value}))}
                    className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <div className="text-xs text-[#1e3a5f] mt-1">{help}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="rounded-xl border-2 border-amber-400 p-5 bg-amber-50 mb-4">
                <div className="text-sm font-bold text-orange-600 mb-4">Results</div>
                {([['Run Time',`${oeeCalc.runTime.toFixed(0)} min`,'Planned − Downtime','#374151'],['Availability',pct(oeeCalc.avail),'Run Time / Planned Time',oeeBar(oeeCalc.avail)],['Performance',pct(oeeCalc.perf),'(Ideal Cycle × Parts) / Run Time',oeeBar(oeeCalc.perf)],['Quality',pct(oeeCalc.qual),'Good Parts / Total Parts',oeeBar(oeeCalc.qual)]] as [string,string,string,string][]).map(([label,value,sub,color])=>(
                  <div key={label} className="flex justify-between items-center mb-3">
                    <div><div className="text-xs font-bold text-[#1e3a5f]">{label}</div><div className="text-xs text-[#1e3a5f]">{sub}</div></div>
                    <div className="text-lg font-extrabold" style={{color}}>{value}</div>
                  </div>
                ))}
                <div className="border-t-2 border-amber-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-extrabold text-orange-600">Overall OEE</div>
                    <div className="text-3xl font-extrabold" style={{color:oeeBar(oeeCalc.oee)}}>{pct(oeeCalc.oee)}</div>
                  </div>
                  <div className="mt-2 h-4 bg-white rounded-full overflow-hidden border border-amber-200">
                    <div className="h-full rounded-full transition-all" style={{width:`${Math.min(oeeCalc.oee*100,100)}%`,background:oeeBar(oeeCalc.oee)}} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#dbeafe] shadow-sm p-4 bg-white">
                <div className="text-xs font-bold text-[#1e3a5f] mb-3">World Class Benchmarks (JIPM)</div>
                {[['OEE >= 85%',oeeCalc.oee>=0.85],['Availability >= 90%',oeeCalc.avail>=0.90],['Performance >= 95%',oeeCalc.perf>=0.95],['Quality >= 99.9%',oeeCalc.qual>=0.999]].map(([label,ok])=>(
                  <div key={String(label)} className="flex justify-between text-xs mb-2">
                    <span className="text-[#1e3a5f]">{String(label)}</span>
                    <span className={`font-bold ${ok?'text-emerald-600':'text-red-500'}`}>{ok?'✅ Achieved':'❌ Gap'}</span>
                  </div>
                ))}
                <div className="text-xs text-[#1e3a5f] mt-2 pt-2 border-t">Industry avg OEE ~60% | Automotive IATF target: 85%+</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="text-sm font-bold text-[#1e3a5f] mb-3">6 Big Losses (JIPM)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[['1','Availability','Breakdowns','Sudden stops >10 min. Drives MTBF/MTTR metrics.','PM program, spare parts, root cause analysis'],['2','Availability','Setup & Adjustments','Changeover + adjustments. SMED target <10 min internal.','SMED workshop, standardised tooling, quick-change fixtures'],['3','Performance','Idling & Minor Stops','Short stops <10 min — sensor trips, jams, resets.','Poka-yoke, conveyor redesign, proximity sensor upgrades'],['4','Performance','Reduced Speed','Running below standard cycle — worn tooling, fear of defects.','Kaizen on cycle time, tooling PM, operator training'],['5','Quality','Process Defects','Scrap & rework in steady-state — hidden factory cost.','SPC, Control Plan, PFMEA actions, poka-yoke'],['6','Quality','Startup Losses','Defects during warmup, after changeover or breakdown restart.','Setup verification checklist, first-piece approval, pre-production trial']].map(([no,factor,loss,impact,action])=>(
                <div key={no} className="rounded-lg border border-[#dbeafe] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">{no}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{background:factor==='Availability'?'#dbeafe':factor==='Performance'?'#fef3c7':'#dcfce7',color:factor==='Availability'?'#1e40af':factor==='Performance'?'#92400e':'#166534'}}>{factor}</span>
                  </div>
                  <div className="text-xs font-bold text-[#1e3a5f] mb-1">{loss}</div>
                  <div className="text-xs text-[#1e3a5f] mb-1">{impact}</div>
                  <div className="text-xs text-orange-600"><b>Action:</b> {action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ 4M CHANGES ═════════════════════════════════════════════════════ */}
      {mainTab==='fourem' && (
        <div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
            <div className="text-sm font-bold text-orange-600 mb-1">IATF 16949 Clause 8.5.6 — Control of Changes</div>
            <div className="text-xs text-[#1e3a5f]">Any change to <b>Man · Machine · Material · Method</b> must be evaluated, approved, and documented before implementation. Significant changes require customer notification and may need a new PPAP submission. All 4M changes require objective evidence of first-article verification.</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {(['Man','Machine','Material','Method'] as const).map(type=>(
              <div key={type} className="rounded-xl border-2 p-4 text-center" style={{borderColor:M4_COLOR[type]}}>
                <div className="text-2xl font-extrabold mb-1" style={{color:M4_COLOR[type]}}>{fourM.filter(c=>c.changeType===type).length}</div>
                <div className="text-xs font-bold" style={{color:M4_COLOR[type]}}>{type}</div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {fourM.map(c=>(
              <div key={c.id} className="rounded-xl border-l-4 border border-[#dbeafe] bg-white p-4" style={{borderLeftColor:M4_COLOR[c.changeType]}}>
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#1e3a5f]">{c.id}</span>
                    <span className="text-sm font-bold px-3 py-0.5 rounded-lg text-white" style={{background:M4_COLOR[c.changeType]}}>{c.changeType}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:c.impact==='high'?'#fee2e2':c.impact==='medium'?'#fef3c7':'#dcfce7',color:c.impact==='high'?'#dc2626':c.impact==='medium'?'#92400e':'#166534'}}>{c.impact.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#1e3a5f]">{c.date}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:c.status==='implemented'?'#dcfce7':c.status==='approved'?'#dbeafe':c.status==='pending'?'#fef3c7':'#fee2e2',color:c.status==='implemented'?'#166534':c.status==='approved'?'#1e40af':c.status==='pending'?'#92400e':'#dc2626'}}>{c.status}</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-[#1e3a5f] mb-2">{c.description}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-[#1e3a5f] mb-2">
                  <span>👤 Requested by: {c.requestedBy}</span>
                  <span>✅ Approved by: {c.approvedBy}</span>
                  <span>📋 IATF: {c.iatfClause}</span>
                  <span>Verification: {c.verificationRequired?'Required':'N/A'} | Trial: {c.trialRequired?'Required':'N/A'}</span>
                </div>
                {c.notes && <div className="text-xs text-[#1e3a5f] bg-[#eff6ff] rounded-lg p-2 mt-1"><b>Notes:</b> {c.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ KNOWLEDGE ══════════════════════════════════════════════════════ */}
      {mainTab==='knowledge' && (
        <div className="animate-fadeIn space-y-5">

          {/* -- Frequency Filter Cards -- */}
          {(() => {
            const MFG_PROCESSES = [
              { freq:'Daily', icon:'🔴', color:'bg-red-700', ring:'ring-red-400', items:[
                { no:'D1', label:'Shift Log & Production Target', clause:'IATF 8.5.1', desc:'Record shift production (target vs actual), downtime events, quality holds, and 4M changes at shift start and end. Sign off with supervisor.' },
                { no:'D2', label:'Downtime Recording', clause:'IATF 9.1.1', desc:'Record every unplanned downtime event: equipment, reason code, duration, action taken. Update daily downtime log in real time.' },
                { no:'D3', label:'OEE Daily Report', clause:'IATF 9.1.1', desc:'Calculate shift OEE (Availability × Performance × Quality). Post daily OEE on production board. Flag if OEE drops below 85%.' },
                { no:'D4', label:'Line Start-Up Check', clause:'IATF 8.5.1', desc:'Verify WI, control plan, gauges, and approved material at line start. Conduct first-off inspection. Record in line start-up check sheet.' },
              ]},
              { freq:'Weekly', icon:'🔵', color:'bg-blue-700', ring:'ring-blue-400', items:[
                { no:'W1', label:'Weekly OEE Report & Analysis', clause:'IATF 9.1.1', desc:'Compile weekly OEE for each line. Identify top 3 downtime causes. Assign actions for improvement. Present at weekly manufacturing review.' },
                { no:'W2', label:'PM Schedule Review', clause:'IATF 7.1.3', desc:'Review planned maintenance schedule for the week. Confirm all weekly PMs completed. Any overdue — escalate to Maintenance Head.' },
                { no:'W3', label:'Downtime Pareto Review', clause:'IATF 9.1.1', desc:'Pareto analysis of week\'s downtime by equipment and reason. Top 2 causes → corrective action plan with owner and due date.' },
              ]},
              { freq:'Monthly', icon:'🟢', color:'bg-green-700', ring:'ring-green-400', items:[
                { no:'M1', label:'TPM Audit & Review', clause:'IATF 7.1.3', desc:'Monthly TPM audit: autonomous maintenance adherence, PM completion rate, equipment cleanliness scores. Review with Production and Maintenance.' },
                { no:'M2', label:'4M Change Audit', clause:'IATF 8.5.6', desc:'Review all 4M changes raised in the month. Verify each has: documentation, approval, first-off inspection, and customer notification where required.' },
                { no:'M3', label:'Line Capability Review (Cp/Cpk)', clause:'IATF 9.1.1', desc:'Calculate process capability (Cp, Cpk) for key characteristics on each line. Any Cpk < 1.33 → improvement action required.' },
                { no:'M4', label:'Monthly Safety & Housekeeping Inspection', clause:'IATF 8.5.1', desc:'Conduct 5S and safety inspection on all lines. Score each area. Gaps → corrective action within 7 days. Record and follow up.' },
              ]},
              { freq:'Quarterly', icon:'🟣', color:'bg-purple-700', ring:'ring-purple-400', items:[
                { no:'Q1', label:'Major PM Execution', clause:'IATF 7.1.3', desc:'Execute all quarterly planned maintenance activities: bearing replacements, oil changes, major calibration. Verify and sign off maintenance records.' },
                { no:'Q2', label:'OEE Trend & Loss Analysis', clause:'IATF 9.1.1', desc:'Quarterly OEE trend review: compare vs same quarter last year. Identify chronic losses. Update manufacturing improvement plan.' },
                { no:'Q3', label:'Production Layout & Flow Verification', clause:'IATF 8.5.1', desc:'Walk the line — verify actual layout matches approved layout. Check ergonomics, material flow, and safety compliance. Update layout if changes made.' },
              ]},
            ];
            return (
              <>
                <div className="rounded-xl border border-[#dbeafe] bg-white p-5">
                  <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-3">📅 Manufacturing Process Rhythm</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {MFG_PROCESSES.map(s => (
                      <button key={s.freq} onClick={() => setFreqFilter(f => f === s.freq ? 'All' : s.freq)}
                        className={`${s.color} rounded-xl px-3 py-3 text-center transition-all hover:brightness-110 hover:scale-[1.02] ${freqFilter===s.freq?`ring-2 ${s.ring} scale-[1.03]`:'opacity-85'}`}>
                        <p className="text-xl">{s.icon}</p>
                        <p className="text-sm text-white font-bold mt-0.5">{s.freq}</p>
                        <p className="text-[11px] text-white/80">{freqFilter===s.freq?'▲ Show All':`${s.items.length} tasks`}</p>
                      </button>
                    ))}
                  </div>
                  {MFG_PROCESSES.filter(s => freqFilter === 'All' || s.freq === freqFilter).map(s => (
                    <div key={s.freq} className="mb-4">
                      <div className={`${s.color} rounded-xl px-4 py-2 mb-2 flex items-center gap-2`}>
                        <span className="text-base">{s.icon}</span>
                        <span className="text-sm font-bold text-white">{s.freq} Tasks — Manufacturing</span>
                        <span className="ml-auto text-xs text-white/80">{s.items.length} activities</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {s.items.map(p => (
                          <div key={p.no} className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-4">
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
                </div>
              </>
            );
          })()}

          <div className="rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="text-sm font-bold text-[#1e3a5f] mb-3">IATF 16949 — Manufacturing Clauses</div>
            <div className="space-y-3">
              {[['8.5.1','Control of Production & Service Provision','Documented control plans, work instructions, monitoring of product/process characteristics. Availability of documented information at point of use.'],['8.5.1.1','Control Plan','Control plans at system, subsystem, component, and process level. Review and update after any change. Reaction plans for out-of-control conditions.'],['8.5.2','Identification & Traceability','Product identification throughout production. Traceability to customer, internal, and regulatory requirements. Serialisation where required by customer.'],['8.5.4','Preservation','Preserve outputs during production — handling, contamination control, storage, transmission, transportation. Includes packaging standards.'],['8.5.6','Control of Changes (4M)','4M changes — document, evaluate, approve before implementation. Customer notification for significant changes. Retain records of all changes and verification.'],['8.5.6.1','Temporary Change of Process Controls','Documented temporary changes with defined approval, implementation period, and removal. Backup controls maintained. PFMEA updated accordingly.'],['9.1.1','Monitoring & Measurement','OEE measurement for all equipment specified by customer. Manufacturing process capability studies (Cp, Cpk). Statistical techniques where appropriate.'],['10.2.3','Problem Solving','Documented process — 8D, A3, or equivalent. Lessons learned shared to similar processes. Effectiveness verified through sustained results.']].map(([clause,title,req])=>(
                <div key={clause} className="overflow-x-auto flex gap-3 border-b border-[#dbeafe] pb-3">
                  <div className="text-xs font-bold text-white px-2 py-1 rounded h-fit whitespace-nowrap" style={{background:'#7c2d12'}}>{clause}</div>
                  <div><div className="text-xs font-bold text-[#1e3a5f]">{title}</div><div className="text-xs text-[#1e3a5f]">{req}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="text-sm font-bold text-[#1e3a5f] mb-3">Lean Manufacturing Tools</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[['5S','Sort · Set · Shine · Standardize · Sustain. Foundation of visual factory and waste elimination.','Reduced search time, safer environment, audit-ready workplace'],['SMED','Single Minute Exchange of Die — changeover <10 min internal. Separate internal/external setup. Parallel activities.','Flexibility, smaller batches, better OEE Performance factor'],['Kanban','Pull-based material flow triggered by consumption. WIP limits. Prevents overproduction — worst of 7 wastes.','Inventory reduction, flow improvement, visual management'],['Poka-Yoke','Error-proofing devices that prevent or detect defects at the source. Zero-defect manufacturing approach.','Reduced inspection cost, zero escapes, operator confidence'],['VSM','Value Stream Mapping — map current state, identify waste, design future state, implement action plan.','Whole-system view, prioritised improvement, lead time reduction'],['Kaizen','Continuous small improvements, every day, by everyone. Bottom-up culture. 30-day events for specific losses.','Engagement, sustained improvement, knowledge building'],['MTTR / MTBF','Mean Time To Repair / Mean Time Between Failures. Key equipment reliability metrics tracked by equipment tag.','Maintenance prioritisation, spare parts planning, reliability'],['Andon','Visual signal — green (running), yellow (call for help), red (stopped). Immediate problem visibility for supervision.','Fast response, OEE improvement, real-time supervisor visibility'],['Standard Work','Documented best practice — cycle time, work sequence, WIP, quality checks. Foundation for Kaizen and training.','Consistent output, training foundation, improvement baseline']].map(([tool,desc,benefit])=>(
                <div key={tool} className="rounded-lg border border-[#dbeafe] p-3">
                  <div className="text-sm font-extrabold text-orange-600 mb-1">{tool}</div>
                  <div className="text-xs text-[#1e3a5f] mb-1">{desc}</div>
                  <div className="text-xs text-emerald-600"><b>Benefit:</b> {benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORTS ════════════════════════════════════════════════════════ */}
      {mainTab==='reports' && (
        <div className="animate-fadeIn space-y-5">
          <div className="rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="text-sm font-bold text-[#1e3a5f] mb-4">Weekly Production Summary — W03 Jan 2025</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[['OEE',pct(aggOEE.oee),aggOEE.oee>=0.85,'Target >=85%'],['Output vs Plan',`${shifts.reduce((a,s)=>a+s.actualQty,0)}/${shifts.reduce((a,s)=>a+s.planQty,0)}`,shifts.reduce((a,s)=>a+s.actualQty,0)/shifts.reduce((a,s)=>a+s.planQty,0)>=0.95,'Actual/Plan'],['Quality Rate',pct(aggOEE.qual),aggOEE.qual>=0.99,'First Pass Yield'],['Downtime',`${totalDT} min`,totalDT<120,`${(totalDT/60).toFixed(1)} hrs`]].map(([k,v,pass,sub])=>(
                <div key={String(k)} className="rounded-xl border-2 p-3" style={{borderColor:pass?'#10b981':'#f59e0b',background:pass?'#f0fdf4':'#fffbeb'}}>
                  <div className="text-xs text-[#1e3a5f] mb-1">{String(k)}</div>
                  <div className="text-xl font-extrabold mb-1" style={{color:pass?'#065f46':'#92400e'}}>{String(v)}</div>
                  <div className="text-xs text-[#1e3a5f]">{String(sub)}</div>
                  <div className={`text-xs font-bold mt-1 ${pass?'text-emerald-600':'text-amber-600'}`}>{pass?'✅ On Target':'⚠️ Gap'}</div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#dbeafe]">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{background:'#f1f5f9',color:'#fff'}}>
                    {['Shift ID','Date','Sh','Line','Plan','Actual','Good','Rej','DT(min)','OEE'].map(h=>(
                      <th key={h} className="px-3 py-2 text-left font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s,i)=>{
                    const {oee}=calcOEE(s);
                    return (
                      <tr key={s.id} className={i%2===0?'bg-white':'bg-[#eff6ff]'}>
                        <td className="px-3 py-2 font-mono text-[#1e3a5f]">{s.id}</td>
                        <td className="px-3 py-2">{s.date}</td><td className="px-3 py-2 font-bold">{s.shift}</td>
                        <td className="px-3 py-2">{s.line}</td><td className="px-3 py-2">{s.planQty}</td>
                        <td className="px-3 py-2">{s.actualQty}</td>
                        <td className="px-3 py-2 text-emerald-600 font-bold">{s.goodQty}</td>
                        <td className="px-3 py-2 text-red-500">{s.rejectQty}</td>
                        <td className="px-3 py-2">{s.downtime}</td>
                        <td className="px-3 py-2 font-extrabold" style={{color:oeeBar(oee)}}>{pct(oee)}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-amber-50 border-t-2 border-amber-200">
                    <td colSpan={4} className="px-3 py-2 text-orange-600">TOTAL</td>
                    <td className="px-3 py-2">{shifts.reduce((a,s)=>a+s.planQty,0)}</td>
                    <td className="px-3 py-2">{shifts.reduce((a,s)=>a+s.actualQty,0)}</td>
                    <td className="px-3 py-2 text-emerald-600">{shifts.reduce((a,s)=>a+s.goodQty,0)}</td>
                    <td className="px-3 py-2 text-red-500">{shifts.reduce((a,s)=>a+s.rejectQty,0)}</td>
                    <td className="px-3 py-2">{totalDT}</td>
                    <td className="px-3 py-2 font-extrabold" style={{color:oeeBar(aggOEE.oee)}}>{pct(aggOEE.oee)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="text-sm font-bold text-[#1e3a5f] mb-3">Downtime Pareto Analysis</div>
            <div className="space-y-2">
              {dtPareto.map(([cat,dur],i)=>(
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-4 text-xs text-[#1e3a5f] text-right">{i+1}</div>
                  <div className="w-36 text-xs font-bold capitalize" style={{color:DT_COLOR[cat]||'#6b7280'}}>{cat.replace(/-/g,' ')}</div>
                  <div className="flex-1 h-5 bg-white rounded-full overflow-hidden">
                    <div className="h-full rounded-full flex items-center pl-2" style={{width:`${totalDT>0?dur/totalDT*100:0}%`,background:DT_COLOR[cat]||'#6b7280',minWidth:'3rem'}}>
                      <span className="text-white text-xs font-bold">{dur}m</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#1e3a5f] w-10 text-right">{totalDT>0?Math.round(dur/totalDT*100):0}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-bold text-emerald-800 mb-3">🎯 Top Improvement Opportunities</div>
            <div className="space-y-2">
              {[['P1','Address Line-3 breakdown losses (100 min DT, Shift B Jan-16) — material shortage + tool changeover. Root cause: schedule communication gap with stores.','Production Head','Jan 20'],['P2','Complete overdue PM on Conveyor Belt C-04 — bearing inspection overdue since Jan-10. High risk of unplanned breakdown on Line-1.','Maintenance Head','Jan 19'],['P3','Install wire-end interlock on Welding Station W-02 — prevent recurrence of DT003 (55 min breakdown Jan-15 Shift C). Sunil in progress.','Automation Tech','Jan 18'],['P4','Line-2 OEE 85.3% — Availability is limiting factor. Focus: reduce planned downtime, improve changeover via SMED workshop.','Line Supervisor','Feb 01']].map(([p,a,owner,due])=>(
                <div key={String(p)} className="flex gap-3 bg-white rounded-lg border border-emerald-100 p-3">
                  <span className="text-xs font-extrabold px-2 py-1 rounded bg-emerald-600 text-white h-fit">{String(p)}</span>
                  <div className="flex-1">
                    <div className="text-xs text-[#1e3a5f] mb-1">{String(a)}</div>
                    <div className="text-xs text-[#1e3a5f]">Owner: {String(owner)} | Due: {String(due)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <QualityCopilot page="manufacturing" />
    </div>
      </>
  );
}