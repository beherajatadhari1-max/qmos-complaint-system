'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import Callout from '../components/Callout';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ---------------------------------------------------------------------
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

// -- AQL Sample Size Table (ANSI/ASQ Z1.4 Level II) ---------------------------
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

// -- Sample Data ---------------------------------------------------------------
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
const inp = 'w-full bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-green-500';
const lbl = 'text-xs text-[#1e3a5f] block mb-1';

const STATUS_COLOR: Record<OQCStatus,string> = {
  'pending':'bg-gray-700 text-[#1e3a5f]','in-progress':'bg-[#eff6ff]/60 text-[#1d4ed8]',
  'passed':'bg-green-50 border border-green-200 text-green-700','failed':'bg-red-50 border border-red-200 text-red-700',
  'on-hold':'bg-amber-50 text-amber-700','dispatched':'bg-emerald-50/60 text-emerald-700',
};
const STATUS_LABEL: Record<OQCStatus,string> = {
  'pending':'⏳ Pending','in-progress':'🔄 In Progress',
  'passed':'✅ Passed','failed':'❌ Failed',
  'on-hold':'🚫 On Hold','dispatched':'🚚 Dispatched',
};
const RESULT_COLOR: Record<InspResult,string> = {
  pass:'text-green-600', fail:'text-red-600', pending:'text-[#1e3a5f]',
};
const RESULT_LABEL: Record<InspResult,string> = { pass:'✅ Pass', fail:'❌ Fail', pending:'— Pending' };
const TYPE_COLOR: Record<string,string> = {
  CC:'bg-red-800/60 text-red-700 font-bold', SC:'bg-amber-800/60 text-amber-700 font-bold',
  Visual:'bg-[#eff6ff]/60 text-[#1d4ed8]', Functional:'bg-purple-800/60 text-purple-300',
  Dimensional:'bg-cyan-800/60 text-cyan-300',
};

// -- OQC Dashboard -------------------------------------------------------------
function OQCDashboard({ lots }: { lots: OQCLot[] }) {
  const total      = lots.length;
  const dispatched = lots.filter(l=>l.status==='dispatched').length;
  const passed     = lots.filter(l=>l.status==='passed').length;
  const failed     = lots.filter(l=>l.status==='failed').length;
  const onHold     = lots.filter(l=>l.status==='on-hold').length;
  const pending    = lots.filter(l=>l.status==='pending'||l.status==='in-progress').length;
  const totalParts   = lots.reduce((s,l)=>s+l.lotQty,0);
  const totalDefects = lots.reduce((s,l)=>s+l.defectsFound,0);
  const oqcPPM       = totalParts>0 ? Math.round((totalDefects/totalParts)*1_000_000) : 0;
  const fpy          = total>0 ? Math.round(((passed+dispatched)/total)*100) : 0;
  const dispatchRate = total>0 ? Math.round((dispatched/total)*100) : 0;

  // By customer
  const byCust: Record<string,{lots:number;defects:number;qty:number}> = {};
  lots.forEach(l => {
    if(!byCust[l.customer]) byCust[l.customer]={lots:0,defects:0,qty:0};
    byCust[l.customer].lots++;
    byCust[l.customer].defects+=l.defectsFound;
    byCust[l.customer].qty+=l.lotQty;
  });
  const custRows = Object.entries(byCust)
    .map(([name,v])=>({ name, lots:v.lots, ppm: v.qty>0?Math.round(v.defects/v.qty*1_000_000):0 }))
    .sort((a,b)=>b.ppm-a.ppm);

  // By part
  const byPart: Record<string,{defects:number;qty:number}> = {};
  lots.forEach(l=>{ if(!byPart[l.partName])byPart[l.partName]={defects:0,qty:0};
    byPart[l.partName].defects+=l.defectsFound; byPart[l.partName].qty+=l.lotQty; });
  const topParts = Object.entries(byPart)
    .map(([name,v])=>({name,ppm:v.qty>0?Math.round(v.defects/v.qty*1_000_000):0}))
    .sort((a,b)=>b.ppm-a.ppm).slice(0,5);
  const maxPartPPM = Math.max(...topParts.map(p=>p.ppm),1);

  const preDispatchItems = [
    { check:'OQC inspection completed & report signed', done: dispatched>0||passed>0 },
    { check:'AQL sampling as per plan — no critical defects', done: failed===0 },
    { check:'Customer packaging & labelling verified', done: dispatched>0 },
    { check:'Part marking / traceability code applied', done: dispatched>0 },
    { check:'Invoice & dispatch documents ready', done: dispatched>0 },
    { check:'Customer-specific requirements (CSR) met', done: onHold===0 },
  ];
  const preCheckScore = Math.round(preDispatchItems.filter(i=>i.done).length/preDispatchItems.length*100);

  if(lots.length===0) return (
      <>
      <PageTitle title="Outgoing Quality" />
      <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">📊</div>
      <p className="text-[#1e3a5f] text-sm">Load sample data from the OQC Register tab to populate the dashboard.</p>
    </div>
      </>
  );

  return (
    <div className="space-y-5 py-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'First Pass Yield', value:`${fpy}%`, sub:`${passed+dispatched}/${total} lots OK`, color: fpy>=90?'text-emerald-600':fpy>=75?'text-amber-600':'text-red-600' },
          { label:'OQC PPM', value:oqcPPM.toLocaleString(), sub:`${totalDefects} defects / ${totalParts.toLocaleString()} pcs`, color: oqcPPM<=500?'text-emerald-600':oqcPPM<=2000?'text-amber-600':'text-red-600' },
          { label:'Dispatch Rate', value:`${dispatchRate}%`, sub:`${dispatched} lots dispatched`, color: dispatchRate>=80?'text-emerald-600':dispatchRate>=50?'text-amber-600':'text-red-600' },
          { label:'Lots on Hold/Failed', value:onHold+failed, sub:`${onHold} hold · ${failed} failed`, color:(onHold+failed)===0?'text-emerald-600':(onHold+failed)<=2?'text-amber-600':'text-red-600' },
        ].map(k=>(
          <div key={k.label} className="bg-white border border-[#dbeafe] rounded-xl p-4">
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lot Status Breakdown */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Lot Status Breakdown</div>
          <div className="space-y-3">
            {[
              { label:'✅ Dispatched', value:dispatched, color:'bg-emerald-600', text:'text-emerald-600' },
              { label:'🟢 Passed',     value:passed,     color:'bg-green-600',   text:'text-green-600' },
              { label:'🟡 Pending / In Progress', value:pending, color:'bg-slate-500', text:'text-[#1e3a5f]' },
              { label:'⚠️ On Hold',   value:onHold,     color:'bg-amber-600',   text:'text-amber-600' },
              { label:'🔴 Failed',    value:failed,     color:'bg-red-600',     text:'text-red-600' },
            ].map(b=>(
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-medium ${b.text}`}>{b.label}</span>
                  <span className="text-[#1e3a5f]">{b.value} lots</span>
                </div>
                <div className="w-full bg-[#dbeafe] rounded-full h-2">
                  <div className={`${b.color} h-2 rounded-full`} style={{width:`${total>0?Math.round(b.value/total*100):0}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-Dispatch Checklist */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
            <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Pre-Dispatch Checklist</div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${preCheckScore>=80?'bg-emerald-50 text-emerald-600':'bg-amber-900 text-amber-600'}`}>{preCheckScore}%</span>
          </div>
          <div className="space-y-2">
            {preDispatchItems.map((item,i)=>(
              <div key={i} className="flex items-start gap-2">
                <span className={`text-sm mt-0.5 ${item.done?'text-emerald-600':'text-[#1e3a5f]'}`}>{item.done?'✅':'⬜'}</span>
                <span className={`text-xs ${item.done?'text-[#1e3a5f]':'text-[#1e3a5f]'}`}>{item.check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer PPM */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">OQC PPM by Customer</div>
          {custRows.length===0
            ? <div className="text-xs text-[#1e3a5f] py-4 text-center">No data</div>
            : custRows.map(c=>(
              <div key={c.name} className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[#1e3a5f] flex-1 truncate">{c.name}</span>
                <span className="text-xs text-[#1e3a5f]">{c.lots} lots</span>
                <span className={`text-xs font-bold w-20 text-right ${c.ppm<=500?'text-emerald-600':c.ppm<=2000?'text-amber-600':'text-red-600'}`}>{c.ppm.toLocaleString()} PPM</span>
              </div>
            ))
          }
        </div>

        {/* Top Parts by PPM */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Top Parts by Outgoing PPM</div>
          {topParts.length===0
            ? <div className="text-xs text-[#1e3a5f] py-4 text-center">No data</div>
            : topParts.map((p,i)=>(
              <div key={p.name} className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-[#1e3a5f] w-4">{i+1}</span>
                <span className="flex-1 text-xs text-[#1e3a5f] truncate">{p.name}</span>
                <div className="w-24 bg-[#dbeafe] rounded-full h-1.5 shrink-0">
                  <div className={`h-1.5 rounded-full ${p.ppm<=500?'bg-emerald-500':p.ppm<=2000?'bg-amber-500':'bg-red-500'}`}
                    style={{width:`${Math.round(p.ppm/maxPartPPM*100)}%`}} />
                </div>
                <span className={`text-xs font-bold w-20 text-right ${p.ppm<=500?'text-emerald-600':p.ppm<=2000?'text-amber-600':'text-red-600'}`}>{p.ppm.toLocaleString()}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Maturity */}
      <div className="bg-green-900/30 border border-green-900 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 Outgoing Quality Maturity Score</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'First Pass Yield', score:fpy, target:95 },
            { label:'OQC PPM Control',  score:oqcPPM<=500?100:oqcPPM<=2000?70:40, target:100 },
            { label:'Dispatch Rate',    score:dispatchRate, target:90 },
            { label:'Pre-dispatch Compliance', score:preCheckScore, target:100 },
          ].map(m=>{
            const color = m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-green-900/30 rounded-xl p-3 text-center">
                <div className="text-xs text-[#15803d] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-green-600 mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-green-900/30 rounded-full h-1.5">
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


// -- OQC Process Rhythm --------------------------------------------------------
const OQC_PROCESSES = [
  { freq:'Daily',     icon:'🔴', color:'bg-red-700',    ring:'ring-red-400',    items:[
    { no:'D1', label:'OQC Gate Inspection & Dispatch Clearance', clause:'IATF 8.6', desc:'Inspect every outgoing lot per AQL sampling plan before dispatch. No dispatch without OQC stamp. CC failures = immediate dispatch hold.' },
    { no:'D2', label:'Daily Dispatch Tracking & Customer Alerts', clause:'IATF 8.5.4', desc:'Track all dispatched lots, quantities, and vehicle details. Alert customer quality team for any same-day hold or short shipment.' },
  ]},
  { freq:'Weekly',    icon:'🔵', color:'bg-blue-700',   ring:'ring-blue-400',   items:[
    { no:'W1', label:'OQC Rejection Pareto & Analysis', clause:'IATF 10.2', desc:'Compile week\'s OQC rejections by defect type. Pareto analysis — top 3 defect types. Raise corrective action for recurring defects.' },
    { no:'W2', label:'PDI Report Review & Trend Update', clause:'IATF 8.6', desc:'Review PDI inspection results from the week. Update customer-wise rejection trend chart. Flag if same defect found for 2+ consecutive weeks.' },
    { no:'W3', label:'Dispatch Hold Register Review', clause:'IATF 8.7', desc:'Review all open dispatch holds. Ensure no hold is pending disposition for more than 3 days. Escalate aging holds to Quality Head.' },
  ]},
  { freq:'Monthly',   icon:'🟢', color:'bg-green-700',  ring:'ring-green-400',  items:[
    { no:'M1', label:'OQC Control Plan Review', clause:'IATF 8.5.1', desc:'Review OQC control plan for all parts. Update characteristics, AQL levels, sampling frequency if customer complaint trends change. Get Quality Head sign-off.' },
    { no:'M2', label:'Customer Rejection Report', clause:'IATF 9.1.2', desc:'Compile monthly customer rejection data (PPM, return lots, field failures). Prepare customer-wise rejection report. Share with Customer Quality team.' },
    { no:'M3', label:'OQC Gauge Calibration Check', clause:'IATF 7.1.5', desc:'Verify all OQC gauges are within calibration date. Withdraw expired gauges immediately. Update gauge calibration register.' },
    { no:'M4', label:'AQL Sampling Plan Review', clause:'IATF 8.6', desc:'Review AQL sampling levels. If a supplier or part has repeat escapes → tighten sampling. Document reason for any AQL level change.' },
  ]},
  { freq:'Quarterly', icon:'🟣', color:'bg-purple-700', ring:'ring-purple-400', items:[
    { no:'Q1', label:'OQC Internal Audit', clause:'IATF 9.2', desc:'Internal audit of OQC function: inspection adherence, record completeness, hold management, gauge availability. Raise NCs for any gaps found.' },
    { no:'Q2', label:'AQL Table & Sampling Plan Validation', clause:'IATF 8.6', desc:'Validate AQL sampling plans against actual escape rate. Adjust sampling strictness per customer complaint trend data.' },
    { no:'Q3', label:'OQC Skill Matrix Update', clause:'IATF 7.2', desc:'Assess OQC inspectors: AQL application, CC/SC knowledge, gauge usage, hold management. Plan training for any gaps below required level.' },
  ]},
];

export default function OutgoingQualityPage() {
  const [tab, setTab]             = useState<'dashboard'|'oqc'|'aql'|'knowledge'|'guide'>('oqc');
  const [freqFilter, setFreqFilter] = useState('All');
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
    <div className="min-h-screen bg-[#eff6ff]">

      {/* Header */}
      <div className="bg-white">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📤</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Outgoing Quality Control</h1>
                <p className="text-[#15803d] text-xs mt-0.5">IATF 16949 Cl. 8.6 · Final Inspection · AQL Sampling · Dispatch Gate · OQC PPM Tracking</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-green-900/30/60 border border-green-700/50 rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-green-300">{dispatched}/{total}</div>
                <div className="text-xs text-green-600">Dispatched</div>
              </div>
              {onHold > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-amber-700">{onHold}</div>
                  <div className="text-xs text-amber-600">On Hold</div>
                </div>
              )}
              {failed > 0 && (
                <div className="bg-red-900/60 border border-red-700/50 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-red-700">{failed}</div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
              )}
              <div className="bg-white border border-[#dbeafe] rounded-xl px-3 py-2 text-center">
                <div className="text-xl font-bold text-white">{oqcPPM.toLocaleString()}</div>
                <div className="text-xs text-[#1e3a5f]">OQC PPM</div>
              </div>
              <button onClick={loadSample} className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">🧪 Load Sample</button>
              <button onClick={() => setShowForm(true)} className="bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e3a5f] text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-colors">+ New OQC Lot</button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'oqc',       label:'📤 OQC Register'},
              {id:'aql',       label:'📊 AQL Table'},
              {id:'knowledge', label:'📚 Knowledge Hub'},
              {id:'guide',     label:'📋 Inspection Guide'},
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex-shrink-0 ${tab===t.id?'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]':'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OQC REGISTER */}
      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/outgoing-quality/Final_Inspection_Report.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View FQC Inspection Report">FQC Inspection Report</a><a href="/downloads/outgoing-quality/Final_Inspection_Report.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download FQC Inspection Report">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/outgoing-quality/FQC_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View FQC Checklist XLS">FQC Checklist XLS</a><a href="/downloads/outgoing-quality/FQC_Checklist.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download FQC Checklist XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/outgoing-quality/Outgoing_Hold_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Hold Register XLS">Hold Register XLS</a><a href="/downloads/outgoing-quality/Outgoing_Hold_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Hold Register XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/outgoing-quality/Customer_Release_Authorisation.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Release Authorisation">Release Authorisation</a><a href="/downloads/outgoing-quality/Customer_Release_Authorisation.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Release Authorisation">⬇</a></span>
      </div>
      {tab === 'dashboard' && (
        <div className="animate-fadeIn max-w-screen-xl mx-auto px-4 md:px-6">
          <OQCDashboard lots={lots} />
        </div>
      )}

      {tab === 'oqc' && (
        <div className="animate-fadeIn p-4 bg-[#eff6ff] min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {lots.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <select className="text-xs bg-white border border-[#dbeafe] rounded-lg px-3 py-1.5 text-[#1e3a5f] focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="dispatched">Dispatched</option>
                </select>
                <span className="text-xs text-[#1e3a5f] self-center">Showing {filtered.length} of {lots.length} lots</span>
              </div>
            )}

            {/* New Lot Form */}
            {showForm && (
              <div className="bg-white border border-green-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
                  <h2 className="text-sm font-bold text-white">+ New OQC Lot</h2>
                  <button onClick={() => setShowForm(false)} className="text-[#1e3a5f] hover:text-white text-xs">✕ Cancel</button>
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
              <div className="bg-white border border-[#dbeafe] border-dashed rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📤</div>
                <p className="text-[#1e3a5f] text-sm">No OQC lots logged. Click <span className="text-green-600">🧪 Load Sample</span> to see examples or <span className="text-green-600">+ New OQC Lot</span>.</p>
              </div>
            )}

            {filtered.map(lot => {
              const isOpen = expandedId === lot.id;
              const ccFails = lot.chars.filter(c => c.type==='CC' && c.result==='fail').length;
              const totalFails = lot.chars.filter(c => c.result==='fail').length;
              const totalInspected = lot.chars.filter(c => c.result!=='pending').length;
              const verdict = lot.defectsFound > lot.acceptNumber ? (lot.defectsFound >= lot.rejectNumber ? 'REJECT' : 'MARGINAL') : 'ACCEPT';
              return (
                <div key={lot.id} className={`bg-white border rounded-2xl overflow-hidden ${lot.status==='on-hold'?'border-amber-200':lot.status==='failed'?'border-red-700/50':lot.status==='dispatched'?'border-emerald-200':'border-[#dbeafe]'}`}>
                  <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isOpen?null:lot.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold text-sm font-mono">{lot.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[lot.status]}`}>{STATUS_LABEL[lot.status]}</span>
                        {ccFails > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900 text-red-700 font-bold">🔴 {ccFails} CC FAIL</span>}
                        {lot.status==='on-hold' && <span className="text-xs text-amber-600 truncate max-w-xs">{lot.holdReason.slice(0,60)}…</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-[#1e3a5f]">
                        <span>📅 {lot.date}</span>
                        <span>🔧 {lot.partNumber} — {lot.partName}</span>
                        <span>👥 {lot.customer}</span>
                        <span>📦 Lot: {lot.lotQty.toLocaleString()} | Sample: {lot.sampleSize} | {lot.samplingPlan}</span>
                        {totalFails > 0 && <span className="text-red-600 font-semibold">{totalFails} defect{totalFails>1?'s':''} found</span>}
                        {lot.dispatchDate && <span className="text-emerald-600">🚚 Dispatched: {lot.dispatchDate}</span>}
                        {lot.invoiceNo && <span className="text-[#1e3a5f]">INV: {lot.invoiceNo}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="text-xs bg-white border border-[#dbeafe] rounded-lg px-2 py-1 text-[#1e3a5f] focus:outline-none" value={lot.status} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();updateStatus(lot.id,e.target.value as OQCStatus);}}>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="on-hold">On Hold</option>
                        <option value="dispatched">Dispatched</option>
                      </select>
                      <span className="text-[#1e3a5f] text-sm">{isOpen?'▾':'▸'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#dbeafe] px-5 py-4 space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        {[
                          ['Lot Size',lot.lotQty.toLocaleString()],
                          ['Sample Size',lot.sampleSize.toString()],
                          ['Ac / Re',`${lot.acceptNumber} / ${lot.rejectNumber}`],
                          ['Defects Found',lot.defectsFound.toString()],
                          ['Verdict', verdict],
                        ].map(([l,v]) => (
                          <div key={l} className={`rounded-lg px-3 py-2 ${l==='Verdict' ? (verdict==='ACCEPT'?'bg-green-900/30':verdict==='REJECT'?'bg-red-50':'bg-amber-50') : 'bg-white'}`}>
                            <div className="text-[#1e3a5f]">{l}</div>
                            <div className={`font-bold mt-0.5 ${l==='Verdict'?(verdict==='ACCEPT'?'text-green-300':verdict==='REJECT'?'text-red-700':'text-amber-700'):'text-white'}`}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {lot.holdReason && (
                        <div className="bg-amber-50 border border-amber-800/40 rounded-xl px-4 py-3">
                          <span className="text-amber-700 font-bold text-xs">🚫 Hold Reason: </span>
                          <span className="text-amber-200 text-xs">{lot.holdReason}</span>
                        </div>
                      )}

                      {/* Characteristic Results */}
                      {lot.chars.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-[#1e3a5f] uppercase mb-2">Inspection Results ({totalInspected}/{lot.chars.length} completed)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[#1e3a5f] border-b border-[#dbeafe]">
                                  <th className="text-left py-2 pr-4">Characteristic</th>
                                  <th className="text-left py-2 pr-4">Type</th>
                                  <th className="text-left py-2 pr-4">Specification</th>
                                  <th className="text-left py-2 pr-4">Measured / Observed</th>
                                  <th className="text-left py-2">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lot.chars.map(c => (
                                  <tr key={c.id} className={`border-b border-[#dbeafe] ${c.result==='fail'?'bg-red-900/10':''}`}>
                                    <td className="py-2 pr-4 text-[#1e3a5f]">{c.characteristic}</td>
                                    <td className="py-2 pr-4"><span className={`px-1.5 py-0.5 rounded text-xs ${TYPE_COLOR[c.type]}`}>{c.type}</span></td>
                                    <td className="py-2 pr-4 text-[#1e3a5f]">{c.spec}</td>
                                    <td className="py-2 pr-4">
                                      <input
                                        className="bg-white border border-[#dbeafe] rounded px-2 py-0.5 text-xs text-[#1e3a5f] w-40 focus:outline-none focus:border-green-500"
                                        value={c.measured}
                                        placeholder="Enter value..."
                                        onChange={e => updateCharResult(lot.id, c.id, c.result, e.target.value)}
                                      />
                                    </td>
                                    <td className="py-2">
                                      <select
                                        className={`text-xs bg-white border border-[#dbeafe] rounded px-2 py-0.5 focus:outline-none ${RESULT_COLOR[c.result]}`}
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

                      {lot.notes && <p className="text-xs text-[#1e3a5f] italic">{lot.notes}</p>}

                      {lot.inspector && (
                        <div className="flex gap-4 text-xs text-[#1e3a5f]">
                          <span>Inspector: <span className="text-[#1e3a5f]">{lot.inspector}</span></span>
                          {lot.dispatchDate && <span>Dispatched: <span className="text-emerald-600">{lot.dispatchDate}</span></span>}
                          {lot.invoiceNo && <span>Invoice: <span className="text-[#1e3a5f]">{lot.invoiceNo}</span></span>}
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
        <div className="animate-fadeIn p-6 bg-[#eff6ff] min-h-screen">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-green-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">📊 AQL Sampling Table — ANSI/ASQ Z1.4 (Level II)</h2>
              <p className="text-[#1e3a5f] text-sm mb-5">Acceptance Quality Limit (AQL) is the maximum defect percentage considered acceptable as a process average. The table below gives sample sizes and accept/reject numbers for each lot size range at standard AQL levels.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#1e3a5f] border-b border-[#dbeafe] text-center">
                      <th className="text-left py-3 pr-4">Lot Size Range</th>
                      <th className="py-3 px-3">Sample Size</th>
                      <th className="py-3 px-3 text-red-700">AQL 0.65<br/><span className="text-[#1e3a5f] font-normal">CC char.</span></th>
                      <th className="py-3 px-3 text-amber-700">AQL 1.0<br/><span className="text-[#1e3a5f] font-normal">SC char.</span></th>
                      <th className="py-3 px-3 text-[#1d4ed8]">AQL 1.5<br/><span className="text-[#1e3a5f] font-normal">Critical visual</span></th>
                      <th className="py-3 px-3 text-green-300">AQL 2.5<br/><span className="text-[#1e3a5f] font-normal">General</span></th>
                      <th className="py-3 px-3 text-[#1e3a5f]">AQL 4.0<br/><span className="text-[#1e3a5f] font-normal">Minor</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {AQL_TABLE.levels.map((row, i) => (
                      <tr key={i} className={`border-b border-[#dbeafe] text-center ${i%2===0?'bg-white/20':''}`}>
                        <td className="py-2.5 pr-4 text-left text-[#1e3a5f] font-mono">{row.lotRange}</td>
                        <td className="py-2.5 px-3 text-white font-bold">{row.sampleSize}</td>
                        <td className="py-2.5 px-3 text-red-700">{row.ac065} / {row.ac065+1}</td>
                        <td className="py-2.5 px-3 text-amber-700">{row.ac10} / {row.ac10+1}</td>
                        <td className="py-2.5 px-3 text-[#1d4ed8]">{row.ac15} / {row.ac15+1}</td>
                        <td className="py-2.5 px-3 text-green-300">{row.ac25} / {row.ac25+1}</td>
                        <td className="py-2.5 px-3 text-[#1e3a5f]">{row.ac40} / {row.ac40+1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-[#1e3a5f] mt-2">Format: Ac / Re — Accept Number / Reject Number. If defects found ≥ Re → reject the lot.</p>
              </div>
            </div>

            <div className="bg-white border border-blue-700/50/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📌 Which AQL Level to Use?</h2>
              <div className="space-y-3">
                {[
                  {level:'AQL 0.65',color:'text-red-700 bg-red-50',use:'Safety-critical (CC) characteristics. Any failure here has safety or regulatory impact. Use for characteristics controlling crash safety, brake performance, emissions compliance.'},
                  {level:'AQL 1.0',color:'text-amber-700 bg-amber-50',use:'Significant characteristics (SC) affecting vehicle performance or customer function — dimensional, torque, assembly fit-up on functional joints.'},
                  {level:'AQL 1.5',color:'text-[#1d4ed8] bg-[#eff6ff]',use:'Critical visual characteristics — paint, surface finish, Class A surfaces, visible welds, marking/identification. Customer would return if seen.'},
                  {level:'AQL 2.5',color:'text-[#15803d] bg-green-900/30',use:'General quality characteristics — dimensions not CC/SC, functional tests, standard assembly checks. Most common for automotive OQC.'},
                  {level:'AQL 4.0',color:'text-[#1e3a5f] bg-white',use:'Minor characteristics — cosmetic defects that are not visible to customer in normal use, non-functional dimensions with large tolerances.'},
                  {level:'100% Inspection',color:'text-white bg-gray-700',use:'Mandated after any customer complaint, red-bin activation, or new PPAP launch. Also required for any CC characteristic if process Cpk < 1.67.'},
                ].map(r => (
                  <div key={r.level} className={`border border-[#dbeafe] rounded-xl px-4 py-3 flex items-start gap-3 ${r.color.split(' ')[1]}`}>
                    <span className={`font-bold text-xs px-2 py-1 rounded-lg flex-shrink-0 ${r.color}`}>{r.level}</span>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{r.use}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KNOWLEDGE HUB */}
      {tab === 'knowledge' && (
        <div className="animate-fadeIn p-6 bg-[#eff6ff] min-h-screen">
          <div className="max-w-5xl mx-auto space-y-6">

            <Callout type="iatf" title="IATF 16949 Cl. 8.6 — Release of Products & Services">
              No product shall be released to the customer until ALL planned inspection arrangements have been satisfactorily completed and documented. The authorised person must sign the release record. CC/SC characteristics must be verified against the control plan.
            </Callout>
            <Callout type="warn" title="OQC is NOT a substitute for IPQC">
              OQC is the last net — not the primary control. If you are catching defects only at OQC, your in-process controls have failed. Customer escape risk is high whenever OQC is the first detection point. IPQC must be strengthened, not just OQC sampling increased.
            </Callout>

            <div className="bg-white border border-[#dbeafe] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-2">📤 What is Outgoing Quality Control (OQC)?</h2>
              <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                OQC is the final quality gate before finished goods leave the plant and reach the customer. It is mandated by IATF 16949 Cl. 8.6 — no product shall be released until all planned arrangements have been satisfactorily completed. OQC is NOT a substitute for in-process control — it is the last net before customer escape.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {icon:'🔬',title:'Cl. 8.6 — Release of Products',desc:'IATF requires documented evidence that product meets all acceptance criteria before dispatch. Authorised person must sign off. CC/SC characteristics must be verified against control plan.'},
                  {icon:'📊',title:'Cl. 8.6.1 — Conformance of Products',desc:'Supplier must maintain monitoring and measurement records. PPM tracking, lot-wise results, and traceability to the lot/batch dispatched. Records must be retained as per retention policy.'},
                  {icon:'🚫',title:'Cl. 8.6.2 — Layout Inspection & FAI',desc:'Periodic layout inspection (dimensional validation against drawing — all characteristics) must be done per customer and PPAP frequency. Typically annual or after any major change.'},
                ].map(c => (
                  <div key={c.title} className="bg-green-900/30/20 border border-green-700/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-[#15803d] font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-amber-900/50 rounded-2xl p-6">
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
                  <div key={c.cat} className="bg-white rounded-xl p-4">
                    <div className="text-[#15803d] font-bold text-sm mb-2">{c.cat}</div>
                    {c.items.map((i,idx) => <div key={idx} className="flex items-start gap-2 mb-1 text-xs"><span className="text-green-600 flex-shrink-0">✓</span><span className="text-[#1e3a5f]">{i}</span></div>)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-red-900/50 rounded-2xl p-6">
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

      {/* INSPECTION GUIDE */}
      {tab === 'guide' && (
        <div className="animate-fadeIn p-6 bg-[#eff6ff] min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* -- Frequency Filter Cards -- */}
            <div>
              <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-2">📅 Filter by Frequency</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {OQC_PROCESSES.map(s => (
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
            {OQC_PROCESSES.filter(s => freqFilter === 'All' || s.freq === freqFilter).map(s => (
              <div key={s.freq}>
                <div className={`${s.color} rounded-xl px-4 py-2 mb-2 flex items-center gap-2`}>
                  <span className="text-base">{s.icon}</span>
                  <span className="text-sm font-bold text-white">{s.freq} Tasks — OQC</span>
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
              <h3 className="text-sm font-bold text-[#0f172a] mb-3">📋 Step-by-Step OQC Inspection Guide</h3>
            </div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-[#0f172a]">OQC Inspection — Step-by-Step</h2>
              <p className="text-[#1e3a5f] text-sm mt-1">IATF 16949 Cl. 8.6 · AQL Sampling · Dispatch Gate Control</p>
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
              <div key={s.step} className="bg-white border border-[#dbeafe] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-green-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><span className="text-xl">{s.icon}</span><h3 className="text-[#15803d] font-bold text-sm">{s.title}</h3></div>
                    <p className="text-[#1e3a5f] text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <QualityCopilot page="outgoing-quality" />
    </div>
  );
}