'use client';
import { useState } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';
import ExportPDF from '../components/ExportPDF';

// -- Types ---------------------------------------------------------------------
type DevStatus   = 'active'|'completed'|'on-hold'|'escalated';
type ActionStatus= 'open'|'in-progress'|'closed'|'overdue';
type SupplierRating = 'A'|'B'|'C'|'D';
type ImprovementArea = 'quality'|'delivery'|'cost'|'capacity'|'system'|'process';

interface DevAction {
  id: string;
  area: ImprovementArea;
  description: string;
  expectedResult: string;
  owner: string;       // supplier contact
  sqeOwner: string;    // our SQE
  targetDate: string;
  status: ActionStatus;
  actualResult: string;
  evidenceRequired: string;
  completionDate: string;
}

interface SupplierDevPlan {
  id: string;
  supplierName: string;
  supplierCode: string;
  category: string;
  currentRating: SupplierRating;
  targetRating: SupplierRating;
  startDate: string;
  targetDate: string;
  status: DevStatus;
  triggerReason: string;   // why plan raised
  currentPPM: number;
  targetPPM: number;
  currentOTD: number;
  targetOTD: number;
  currentAuditScore: number;
  targetAuditScore: number;
  sqeOwner: string;
  actions: DevAction[];
  progressPct: number;
  lastReviewDate: string;
  nextReviewDate: string;
  notes: string;
}

// -- Sample Data ---------------------------------------------------------------
const DEV_PLANS: SupplierDevPlan[] = [
  {
    id:'SDP-001', supplierName:'Bosch India Ltd.', supplierCode:'SUP-012', category:'Electronics / Sensors',
    currentRating:'D', targetRating:'B', startDate:'2026-07-01', targetDate:'2026-12-31',
    status:'active', triggerReason:'PPM 620 vs target 400. OTD 91.5% vs target 95%. Customer escalation received from Toyota.',
    currentPPM:620, targetPPM:300, currentOTD:91.5, targetOTD:95,
    currentAuditScore:68, targetAuditScore:80,
    sqeOwner:'Amit Verma — SQE Manager', progressPct:25,
    lastReviewDate:'2026-07-30', nextReviewDate:'2026-08-30', notes:'Critical supplier — single source for sensor assembly. Escalated to Quality Director.',
    actions:[
      { id:'A-001', area:'quality', description:'Implement SPC on critical sensor dimensions — Op-30 and Op-50', expectedResult:'Cpk ≥ 1.33 on all CCs', owner:'Bosch QA Head', sqeOwner:'Amit Verma', targetDate:'2026-08-31', status:'in-progress', actualResult:'', evidenceRequired:'SPC charts for last 30 days', completionDate:'' },
      { id:'A-002', area:'process', description:'Root cause analysis and 8D for PPM issue — Op-20 dimensional OOT', expectedResult:'8D closed with verified corrective action', owner:'Bosch Process Engineer', sqeOwner:'Amit Verma', targetDate:'2026-08-15', status:'closed', actualResult:'8D closed — die redesigned, Cpk improved to 1.45', evidenceRequired:'Closed 8D report', completionDate:'2026-08-12' },
      { id:'A-003', area:'system', description:'IATF gap assessment and action plan for identified gaps', expectedResult:'Gap assessment report + closure plan', owner:'Bosch QMS Manager', sqeOwner:'Amit Verma', targetDate:'2026-09-15', status:'open', actualResult:'', evidenceRequired:'Gap assessment report', completionDate:'' },
      { id:'A-004', area:'delivery', description:'Implement production scheduling system — reduce OTD failures', expectedResult:'OTD ≥ 94% for 3 consecutive months', owner:'Bosch Planning Head', sqeOwner:'Amit Verma', targetDate:'2026-10-31', status:'open', actualResult:'', evidenceRequired:'OTD data for 3 months', completionDate:'' },
      { id:'A-005', area:'capacity', description:'Add second shift to address capacity constraint — eliminate late deliveries', expectedResult:'On-time capacity ≥ 110% of current demand', owner:'Bosch Plant Manager', sqeOwner:'Amit Verma', targetDate:'2026-09-30', status:'open', actualResult:'', evidenceRequired:'Capacity study + shift schedule', completionDate:'' },
    ],
  },
  {
    id:'SDP-002', supplierName:'Mahesh Stampings Pvt. Ltd.', supplierCode:'SUP-031', category:'Sheet Metal',
    currentRating:'C', targetRating:'A', startDate:'2026-04-01', targetDate:'2026-09-30',
    status:'active', triggerReason:'PPM 280 trending upward for 3 months. Maruti Suzuki issued supplier warning.',
    currentPPM:280, targetPPM:100, currentOTD:95.5, targetOTD:97,
    currentAuditScore:74, targetAuditScore:88,
    sqeOwner:'Ravi Sharma — SQE', progressPct:65,
    lastReviewDate:'2026-08-05', nextReviewDate:'2026-09-05', notes:'Good management cooperation. On track for target.',
    actions:[
      { id:'A-006', area:'quality', description:'SPC implementation on all 5 critical dimensions in stamping process', expectedResult:'100% CCs on SPC with Cpk ≥ 1.33', owner:'Mahesh QA Manager', sqeOwner:'Ravi Sharma', targetDate:'2026-05-31', status:'closed', actualResult:'SPC implemented. All 5 CCs Cpk > 1.33', evidenceRequired:'SPC charts + Cpk report', completionDate:'2026-05-28' },
      { id:'A-007', area:'process', description:'Die preventive maintenance plan — monthly PM schedule', expectedResult:'Zero die breakdown causing quality issues', owner:'Mahesh Maintenance', sqeOwner:'Ravi Sharma', targetDate:'2026-06-30', status:'closed', actualResult:'PM plan implemented and running for 2 months', evidenceRequired:'PM schedule + completion records', completionDate:'2026-06-25' },
      { id:'A-008', area:'system', description:'Implement IQC at supplier — incoming material inspection before production', expectedResult:'Zero raw material-related rejections', owner:'Mahesh QA Head', sqeOwner:'Ravi Sharma', targetDate:'2026-07-31', status:'closed', actualResult:'IQC implemented with AQL sampling', evidenceRequired:'IQC procedure + records', completionDate:'2026-07-30' },
      { id:'A-009', area:'quality', description:'Train all operators on quality awareness and defect recognition', expectedResult:'Zero defect pass-through from operators', owner:'Mahesh Training Manager', sqeOwner:'Ravi Sharma', targetDate:'2026-08-31', status:'in-progress', actualResult:'14 of 22 operators trained', evidenceRequired:'Training records + assessment', completionDate:'' },
    ],
  },
  {
    id:'SDP-003', supplierName:'Krishna Plastics Ltd.', supplierCode:'SUP-044', category:'Plastic Moulded Parts',
    currentRating:'B', targetRating:'A', startDate:'2026-01-15', targetDate:'2026-07-31',
    status:'completed', triggerReason:'Customer Maruti Suzuki requested PPM reduction plan. Paint adhesion issue history.',
    currentPPM:95, targetPPM:80, currentOTD:98.2, targetOTD:99,
    currentAuditScore:88, targetAuditScore:90,
    sqeOwner:'Priya Mehta — SQE', progressPct:100,
    lastReviewDate:'2026-07-31', nextReviewDate:'2026-10-31', notes:'Development plan completed. Promoted to A-rating. Quarterly monitoring continues.',
    actions:[
      { id:'A-010', area:'quality', description:'Upgrade pH monitoring to auto-dosing system', expectedResult:'pH variation < 0.1 units — zero bath failures', owner:'KP Process Head', sqeOwner:'Priya Mehta', targetDate:'2026-03-31', status:'closed', actualResult:'Auto-dosing installed. pH variation reduced to ±0.05', evidenceRequired:'Installation record + 30-day pH log', completionDate:'2026-03-28' },
      { id:'A-011', area:'process', description:'AIAG-VDA PFMEA update — include paint process failure modes', expectedResult:'Updated PFMEA with detection controls for pH, adhesion', owner:'KP QA Engineer', sqeOwner:'Priya Mehta', targetDate:'2026-04-30', status:'closed', actualResult:'PFMEA updated and approved', evidenceRequired:'Signed PFMEA document', completionDate:'2026-04-25' },
      { id:'A-012', area:'system', description:'Implement 100% adhesion cross-hatch test on paint finish', expectedResult:'Zero paint adhesion escapes to customer', owner:'KP Final QC', sqeOwner:'Priya Mehta', targetDate:'2026-05-31', status:'closed', actualResult:'100% test implemented. Zero failures in 3 months.', evidenceRequired:'Inspection records + OQC data', completionDate:'2026-05-20' },
    ],
  },
  {
    id:'SDP-004', supplierName:'Precision Castings Co.', supplierCode:'SUP-022', category:'Castings',
    currentRating:'C', targetRating:'B', startDate:'2026-06-01', targetDate:'2026-11-30',
    status:'escalated', triggerReason:'Field return — internal voids found in HSG-C017. Customer Mahindra escalated. 12 units recalled.',
    currentPPM:450, targetPPM:200, currentOTD:93.8, targetOTD:96,
    currentAuditScore:72, targetAuditScore:82,
    sqeOwner:'Amit Verma — SQE Manager', progressPct:30,
    lastReviewDate:'2026-08-01', nextReviewDate:'2026-08-20', notes:'ESCALATED — Customer recall active. MD-level review. Supplier MD committed to weekly updates.',
    actions:[
      { id:'A-013', area:'process', description:'Process parameter auto-logging for casting machine — all critical parameters', expectedResult:'100% parameter traceability per batch', owner:'PCC Plant Engineer', sqeOwner:'Amit Verma', targetDate:'2026-07-15', status:'overdue', actualResult:'Software procurement delayed', evidenceRequired:'System demo + 7-day log', completionDate:'' },
      { id:'A-014', area:'quality', description:'X-Ray inspection increased to 100% on housing castings until process stable', expectedResult:'Zero porosity escape to customer', owner:'PCC QA Head', sqeOwner:'Amit Verma', targetDate:'2026-07-01', status:'closed', actualResult:'100% X-Ray implemented from Jul 1', evidenceRequired:'Inspection records', completionDate:'2026-07-01' },
      { id:'A-015', area:'system', description:'Root cause 8D for void defect — complete with verified corrective action', expectedResult:'Verified 8D with D5/D6/D7 complete', owner:'PCC QA Head', sqeOwner:'Amit Verma', targetDate:'2026-08-10', status:'in-progress', actualResult:'D1-D4 complete. Root cause: pressure valve', evidenceRequired:'Closed 8D report signed by MD', completionDate:'' },
      { id:'A-016', area:'process', description:'Implement machine restart checklist — mandatory before production start', expectedResult:'Zero parameter drift events', owner:'PCC Plant Head', sqeOwner:'Amit Verma', targetDate:'2026-08-31', status:'open', actualResult:'', evidenceRequired:'Checklist + 30-day compliance record', completionDate:'' },
    ],
  },
];

// -- Helpers -------------------------------------------------------------------
const RATING_COLOR: Record<SupplierRating,string> = {
  A:'text-[#15803d]', B:'text-[#1d4ed8]', C:'text-amber-600', D:'text-red-600'
};
const RATING_BG: Record<SupplierRating,string> = {
  A:'bg-emerald-900/40 border-emerald-700/50', B:'bg-[#eff6ff] border-blue-700/50',
  C:'bg-amber-50 border-amber-200',    D:'bg-red-50 border-red-700/50'
};
const STATUS_STYLE: Record<DevStatus,string> = {
  active:'bg-[#eff6ff] text-[#1d4ed8]', completed:'bg-emerald-900/40 text-[#15803d]',
  'on-hold':'bg-[#dbeafe] text-[#1e3a5f]', escalated:'bg-red-900/60 text-red-200 font-bold'
};
const ACT_STYLE: Record<ActionStatus,string> = {
  open:'bg-[#eff6ff] text-[#1d4ed8]', 'in-progress':'bg-amber-50 text-amber-600',
  closed:'bg-emerald-900/40 text-[#15803d]', overdue:'bg-red-900/60 text-red-600 font-bold'
};
const AREA_COLORS: Record<ImprovementArea,string> = {
  quality:'bg-red-50 text-red-600', delivery:'bg-[#eff6ff] text-[#1d4ed8]',
  cost:'bg-green-900/30 text-green-300', capacity:'bg-purple-900/30 text-purple-300',
  system:'bg-indigo-900/40 text-indigo-300', process:'bg-amber-50 text-amber-600',
};

// -- Dashboard -----------------------------------------------------------------
function SDPDashboard({ plans }: { plans: SupplierDevPlan[] }) {
  const active    = plans.filter(p=>p.status==='active').length;
  const escalated = plans.filter(p=>p.status==='escalated').length;
  const completed = plans.filter(p=>p.status==='completed').length;
  const totalActions = plans.flatMap(p=>p.actions).length;
  const closedActions = plans.flatMap(p=>p.actions).filter(a=>a.status==='closed').length;
  const overdueActions = plans.flatMap(p=>p.actions).filter(a=>a.status==='overdue').length;
  const avgProgress = Math.round(plans.reduce((s,p)=>s+p.progressPct,0)/plans.length);

  return (
      <>
      <PageTitle title="Supplier Development" />
      <div className="space-y-5 py-4">
      {/* Escalation banner */}
      {escalated>0 && (
        <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4 flex items-center gap-4">
          <span className="text-3xl">🚨</span>
          <div>
            <div className="text-red-200 font-bold text-sm">{escalated} Supplier Development Plan ESCALATED — MD-Level Attention Required</div>
            <div className="text-red-700 text-xs mt-1">Weekly review mandatory until status changes. Customer recall may be active.</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Active Dev Plans',     value:active,     sub:`${escalated} escalated`, color:escalated>0?'text-red-600':'text-[#1d4ed8]', bg:'border-cyan-800/30 bg-cyan-950/20' },
          { label:'Completed Plans',      value:completed,  sub:'Suppliers graduated', color:'text-[#15803d]', bg:'border-emerald-700/50 bg-emerald-950/20' },
          { label:'Avg Plan Progress',    value:`${avgProgress}%`, sub:`${totalActions} total actions`, color:avgProgress>=60?'text-[#15803d]':avgProgress>=30?'text-amber-600':'text-red-600', bg:'border-cyan-800/30 bg-cyan-950/20' },
          { label:'Overdue Actions',      value:overdueActions, sub:`${closedActions}/${totalActions} closed`, color:overdueActions===0?'text-[#15803d]':'text-red-600', bg:overdueActions>0?'border-red-700/50 bg-red-50':'border-emerald-700/50 bg-emerald-950/20' },
        ].map(k=>(
          <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Plans overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(p=>{
          const open = p.actions.filter(a=>a.status==='open'||a.status==='in-progress').length;
          const closed = p.actions.filter(a=>a.status==='closed').length;
          return (
            <div key={p.id} className={`border rounded-xl p-5 ${p.status==='escalated'?'border-red-600 bg-red-50':p.status==='completed'?'border-emerald-200 bg-emerald-950/10':'border-[#dbeafe] bg-white'}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-bold text-white text-sm">{p.supplierName}</div>
                  <div className="text-xs text-[#1e3a5f]">{p.category} · {p.sqeOwner}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-black text-2xl ${RATING_COLOR[p.currentRating]}`}>{p.currentRating}</span>
                  <span className="text-[#1e3a5f] text-sm">→</span>
                  <span className={`font-black text-2xl ${RATING_COLOR[p.targetRating]}`}>{p.targetRating}</span>
                </div>
              </div>
              {/* KPI comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3 text-xs">
                {[
                  {label:'PPM', current:p.currentPPM, target:p.targetPPM, lowerBetter:true, unit:''},
                  {label:'OTD', current:p.currentOTD, target:p.targetOTD, lowerBetter:false, unit:'%'},
                  {label:'Audit', current:p.currentAuditScore, target:p.targetAuditScore, lowerBetter:false, unit:''},
                ].map(m=>{
                  const good = m.lowerBetter?m.current<=m.target:m.current>=m.target;
                  return (
                    <div key={m.label} className="bg-[#eff6ff] rounded-lg p-2 text-center">
                      <div className="text-[#1e3a5f]">{m.label}</div>
                      <div className={`font-bold ${good?'text-[#15803d]':'text-red-600'}`}>{m.current}{m.unit}</div>
                      <div className="text-[#1e3a5f]">→ {m.target}{m.unit}</div>
                    </div>
                  );
                })}
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-[#dbeafe] rounded-full h-2">
                  <div className={`h-2 rounded-full ${p.progressPct>=80?'bg-emerald-500':p.progressPct>=50?'bg-blue-500':p.progressPct>=25?'bg-amber-500':'bg-red-500'}`} style={{width:`${p.progressPct}%`}}/>
                </div>
                <span className="text-xs font-bold text-[#1e3a5f] shrink-0">{p.progressPct}%</span>
              </div>
              <div className="flex gap-3 text-xs text-[#1e3a5f]">
                <span>{closed}/{p.actions.length} actions closed</span>
                <span className="ml-auto">Next review: {p.nextReviewDate}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* IATF Maturity */}
      <div className="bg-cyan-950 border border-cyan-900 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 Supplier Development Maturity — IATF Cl. 8.4.1 / 8.4.2</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Plans with Actions',     score:plans.filter(p=>p.actions.length>0).length===plans.length?100:Math.round(plans.filter(p=>p.actions.length>0).length/plans.length*100), target:100 },
            { label:'Action Closure Rate',    score:totalActions>0?Math.round(closedActions/totalActions*100):0, target:80 },
            { label:'Plans on Schedule',      score:Math.round(plans.filter(p=>p.progressPct>=50||p.status==='completed').length/plans.length*100), target:75 },
            { label:'Suppliers Graduated (A)', score:Math.round(completed/plans.length*100), target:50 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-cyan-900/30 rounded-xl p-3 text-center">
                <div className="text-xs text-cyan-300 mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-cyan-400 mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-cyan-900 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{width:`${Math.min(m.score,100)}%`,background:color}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
      </>
  );
}

// -- Plan Detail ---------------------------------------------------------------
function PlanDetail({ plans }: { plans: SupplierDevPlan[] }) {
  const [selected, setSelected] = useState(plans[0]?.id ?? '');
  const plan = plans.find(p=>p.id===selected);
  if (!plan) return null;

  const closedCount   = plan.actions.filter(a=>a.status==='closed').length;
  const overdueCount  = plan.actions.filter(a=>a.status==='overdue').length;

  return (
    <div className="space-y-4 py-4">
      {/* Selector + Export */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {plans.map(p=>(
            <button key={p.id} onClick={()=>setSelected(p.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition ${selected===p.id?'bg-cyan-700 text-white border-cyan-500':'border-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
              <span className={RATING_COLOR[p.currentRating]}>{p.currentRating}</span>→<span className={RATING_COLOR[p.targetRating]}>{p.targetRating}</span> · {p.supplierName.split(' ')[0]}
              {p.status==='escalated'&&<span className="ml-1 text-red-700">🚨</span>}
            </button>
          ))}
        </div>
        <ExportPDF
          targetId="sdp-print-section"
          label="Export Plan PDF"
          filename={`Supplier_Dev_Plan_${plan.supplierName.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}`}
          color="#0e7490"
          size="sm"
        />
      </div>

      {/* Printable plan wrapper */}
      <div id="sdp-print-section">
      {/* Print-only header */}
      <div className="print-header-inject mb-4 pb-3 border-b border-[#dbeafe]">
        <div style={{fontSize:'16pt',fontWeight:'bold',color:'#111'}}>Supplier Development Plan</div>
        <div style={{fontSize:'10pt',color:'#555',marginTop:'4px'}}>QMOS · IATF 16949 Cl. 8.4.1 · Generated: {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
      </div>

      {/* Plan header */}
      <div className={`border-2 rounded-2xl p-5 print-no-break ${plan.status==='escalated'?'border-red-600 bg-red-50':'border-[#dbeafe] bg-white'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{plan.supplierName}</h2>
            <div className="text-xs text-[#1e3a5f] mt-1">{plan.category} · Code: {plan.supplierCode}</div>
            <div className="text-xs text-[#1e3a5f] mt-1">SQE: {plan.sqeOwner}</div>
            <div className="text-xs text-amber-700 mt-2 bg-amber-50 rounded px-2 py-1">Trigger: {plan.triggerReason}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2">
              <span className={`font-black text-4xl ${RATING_COLOR[plan.currentRating]}`}>{plan.currentRating}</span>
              <span className="text-[#1e3a5f] text-xl">→</span>
              <span className={`font-black text-4xl ${RATING_COLOR[plan.targetRating]}`}>{plan.targetRating}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[plan.status]}`}>{plan.status}</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {[
            {label:'PPM', current:plan.currentPPM, target:plan.targetPPM, unit:'', lowerBetter:true},
            {label:'OTD %', current:plan.currentOTD, target:plan.targetOTD, unit:'%', lowerBetter:false},
            {label:'Audit Score', current:plan.currentAuditScore, target:plan.targetAuditScore, unit:'/100', lowerBetter:false},
          ].map(m=>{
            const good = m.lowerBetter?m.current<=m.target:m.current>=m.target;
            return (
              <div key={m.label} className="bg-[#eff6ff] rounded-xl p-3 text-center">
                <div className="text-xs text-[#1e3a5f]">{m.label}</div>
                <div className={`text-2xl font-bold ${good?'text-[#15803d]':'text-red-600'}`}>{m.current}{m.unit}</div>
                <div className="text-xs text-[#1e3a5f]">Target: {m.target}{m.unit}</div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-[#1e3a5f]">Progress</span>
          <div className="flex-1 bg-[#dbeafe] rounded-full h-3">
            <div className={`h-3 rounded-full ${plan.progressPct>=80?'bg-emerald-500':plan.progressPct>=50?'bg-blue-500':'bg-amber-500'}`} style={{width:`${plan.progressPct}%`}}/>
          </div>
          <span className="text-sm font-bold text-white">{plan.progressPct}%</span>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[#1e3a5f]">
          <span>Start: {plan.startDate}</span>
          <span>Target: {plan.targetDate}</span>
          <span>Last Review: {plan.lastReviewDate}</span>
          <span>Next Review: {plan.nextReviewDate}</span>
          <span className={overdueCount>0?'text-red-600 font-bold':''}>{overdueCount} overdue actions</span>
          <span className="text-[#15803d]">{closedCount}/{plan.actions.length} actions closed</span>
        </div>
        {plan.notes && (
          <div className="mt-3 text-xs bg-[#eff6ff] rounded-lg px-3 py-2 text-[#1e3a5f]">{plan.notes}</div>
        )}
      </div>

      {/* Action plan */}
      <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Improvement Action Plan ({plan.actions.length} Actions)</div>
      {plan.actions.map(a=>(
        <div key={a.id} className={`bg-white border rounded-xl p-4 ${a.status==='overdue'?'border-red-600':a.status==='closed'?'border-emerald-200':'border-[#dbeafe]'}`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs text-[#1e3a5f]">{a.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${AREA_COLORS[a.area]}`}>{a.area}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ACT_STYLE[a.status]}`}>{a.status.replace('-',' ')}</span>
              </div>
              <p className="text-sm text-white font-semibold mb-1">{a.description}</p>
              <div className="text-xs text-[#1e3a5f]">Expected: {a.expectedResult}</div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#1e3a5f]">
                <span>Supplier Owner: <span className="text-[#1e3a5f]">{a.owner}</span></span>
                <span>SQE: <span className="text-[#1e3a5f]">{a.sqeOwner}</span></span>
                <span className={a.status==='overdue'?'text-red-600 font-bold':''}>Due: {a.targetDate}</span>
                <span>Evidence: <span className="text-[#1e3a5f] italic">{a.evidenceRequired}</span></span>
              </div>
              {a.actualResult && (
                <div className="mt-2 text-xs text-[#15803d] bg-emerald-900/40 rounded px-2 py-1">✅ {a.actualResult}</div>
              )}
            </div>
          </div>
        </div>
      ))}
      </div>{/* end sdp-print-section */}
    </div>
  );
}

// -- IATF Guide ----------------------------------------------------------------
function SDPGuide() {
  const [open, setOpen] = useState<number|null>(0);
  const sections = [
    { title:'IATF 16949 Cl. 8.4.1 — Supplier Control General', content:'Organizations shall have a documented process for supplier management covering: supplier selection, supplier evaluation, supplier monitoring, supplier development. Supplier quality performance must be monitored and communicated. Poor-performing suppliers must have documented improvement plans with evidence of progress. Supplier selection must consider quality performance, IATF certification status, financial stability, delivery capability, and geographical risk.' },
    { title:'IATF 16949 Cl. 8.4.2 — Type & Extent of Control', content:'The organization shall have a documented process to identify and control externally provided processes, products, and services. For suppliers with quality issues: increase monitoring frequency, require SPC data, require PPAP resubmission on changes, require on-site audits, require 8D/CAPA for every defect. For strategic suppliers rated A: annual surveillance audit + scorecard review. For development suppliers rated C/D: monthly development meeting + bi-weekly action reviews.' },
    { title:'Supplier Development Plan — Best Practice Structure', content:'A good SDP contains: (1) Trigger reason with data, (2) Current vs target performance gap (PPM, OTD, audit score), (3) Root cause analysis of current performance gap, (4) Specific, measurable improvement actions with owners and dates, (5) Evidence required for each action, (6) Monthly review schedule with escalation matrix, (7) Rating upgrade criteria — what must be achieved to close the plan.' },
    { title:'Supplier Rating System (ABCD) — Development Triggers', content:'A (≥85%): World Class — annual review only. B (70-84%): Satisfactory — quarterly review. C (55-69%): Initiate Development Plan — monthly reviews. D (<55%): Critical — immediate escalation, bi-weekly reviews, consider second source qualification. Escalation triggers: customer complaint caused by supplier, recall event, OTD < 90% for 2+ months, PPM > 3× target for 2+ months.' },
    { title:'Common Audit Findings — Supplier Development', content:'1. No documented supplier development process or SDP template. 2. SCARs raised but no follow-up for effectiveness verification. 3. Poor-performing suppliers not identified or segmented. 4. Supplier development plans lack measurable targets — only actions listed without KPIs. 5. SDP raised but not reviewed monthly — old dates in action tracker. 6. Supplier upgraded from C to B without verified improvement evidence. 7. No escalation matrix — who gets involved if supplier does not improve on schedule.' },
  ];
  return (
    <div className="space-y-3 py-4">
      {sections.map((s,i)=>(
        <div key={i} className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
          <button className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white"
            onClick={()=>setOpen(open===i?null:i)}>
            <span className="font-semibold text-[#1e3a5f] text-sm">{s.title}</span>
            <span className="text-[#1e3a5f] ml-4">{open===i?'▲':'▼'}</span>
          </button>
          {open===i && (
            <div className="px-5 pb-4 text-xs text-[#1e3a5f] leading-relaxed border-t border-[#dbeafe] pt-3">{s.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function SupplierDevelopmentPage() {
  const [tab, setTab] = useState<'dashboard'|'plans'|'guide'>('dashboard');
  const [plans] = useState<SupplierDevPlan[]>(DEV_PLANS);

  const escalated = plans.filter(p=>p.status==='escalated').length;
  const active    = plans.filter(p=>p.status==='active').length;
  const overdueActions = plans.flatMap(p=>p.actions).filter(a=>a.status==='overdue').length;

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">🏭 Supplier Development</h1>
              <p className="text-cyan-300 text-sm mt-1">Development plans · Improvement actions · Progress tracking · Rating graduation — IATF Cl. 8.4.1 / 8.4.2</p>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <div className="bg-cyan-900/40 border border-cyan-700/40 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{active + escalated}</div>
                <div className="text-xs text-cyan-300">Active Plans</div>
              </div>
              {escalated>0 && (
                <div className="bg-red-50 border-2 border-red-600 rounded-xl px-4 py-2">
                  <div className="text-xl font-bold text-red-600">🚨 {escalated}</div>
                  <div className="text-xs text-red-600">Escalated</div>
                </div>
              )}
              <div className={`border rounded-xl px-4 py-2 ${overdueActions>0?'bg-red-50 border-red-700/40':'bg-emerald-900/40 border-emerald-700/50'}`}>
                <div className={`text-xl font-bold ${overdueActions>0?'text-red-600':'text-[#15803d]'}`}>{overdueActions}</div>
                <div className="text-xs text-[#1e3a5f]">Overdue</div>
              </div>
              <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-[#15803d]">{plans.filter(p=>p.status==='completed').length}</div>
                <div className="text-xs text-[#15803d]">Graduated</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'plans',     label:'📋 Development Plans'},
              {id:'guide',     label:'📘 IATF Guide'},
            ] as const).map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex-shrink-0 ${tab===t.id?'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]':'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
                {t.label}
              </button>
            ))}
            <button
              onClick={() => window.print()}
              className="no-print ml-auto px-3 py-1.5 text-xs font-semibold text-[#1e3a5f] hover:text-white bg-[#f0f9ff]/50 hover:bg-[#dbeafe] rounded-lg transition mb-1">
              🖨 Print
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        {/* Downloads */}
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl my-4" style={{background:'#f1f5f9'}}>
          <span className="text-[#1e3a5f] text-xs font-bold mr-1">📥 Downloads:</span>
          {[
            {label:'Supplier Dev Plan Template', href:'/downloads/supplier-dev/SDP_Template.xlsx',          color:'#0891b2'},
            {label:'SCAR Template',              href:'/downloads/supplier-dev/SCAR_Template.xlsx',          color:'#dc2626'},
            {label:'Supplier Audit Checklist',   href:'/downloads/supplier-dev/Supplier_Audit_Checklist.xlsx', color:'#7c3aed'},
            {label:'Supplier Scorecard',         href:'/downloads/supplier-dev/Supplier_Scorecard.xlsx',    color:'#059669'},
            {label:'Second Source Evaluation',   href:'/downloads/supplier-dev/Second_Source_Evaluation.xlsx', color:'#b45309'},
          ].map(f=>(
            <span key={f.label} className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:f.color}}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110">{f.label}</a>
              <a href={f.href} download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110">⬇</a>
            </span>
          ))}
        </div>

        {tab==='dashboard' && <SDPDashboard plans={plans} />}
        {tab==='plans'     && <PlanDetail plans={plans} />}
        {tab==='guide'     && <SDPGuide />}
      </div>

      <QualityCopilot page="supplier-quality" />
    </div>
  );
}
