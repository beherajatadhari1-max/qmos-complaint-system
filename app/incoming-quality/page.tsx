'use client';
import { useState } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// --- DATA ---------------------------------------------------------------------
const PROCESSES = [
  {
    no:'00', label:'Child Part Drawing', freq:'Monthly', icon:'📐', clause:'IATF 7.5',
    desc:'Monthly review and update of child part drawings at IQC — ensure latest revision is available at inspection station.',
    activities:['Pull list of all incoming parts with drawing numbers','Verify current drawing revision at IQC vs engineering master','Update obsolete drawings with latest revision','Highlight drawing changes to IQC inspectors','File hard copy and soft copy at IQC station','Update drawing master register with revision dates'],
    docs:['Child Part Drawing Register','Drawing Master List','Drawing Revision History','IQC Drawing Control Log'],
    kpis:['Drawings Reviewed','Out-of-date Drawings Found','Drawing Update Completion %'],
  },
  {
    no:'01', label:'DOL / NDOL List', freq:'Monthly', icon:'📋', clause:'IATF 8.4',
    desc:'Monthly review and update of DOL (Delegation Of Liability) and NDOL (Non-Delegation Of Liability) supplier/part list.',
    activities:['Review all incoming parts for DOL/NDOL classification','Verify DOL parts have valid supplier quality approval','Update NDOL parts requiring plant inspection','Cross-check with customer-specified DOL requirements','Communicate DOL/NDOL changes to IQC team','Update DOL/NDOL register and archive previous version'],
    docs:['DOL List (Customer-approved)','NDOL List','DOL/NDOL Change Log','Customer Approval Reference'],
    kpis:['DOL Parts Count','NDOL Parts Requiring Inspection','DOL Review Completion'],
  },
  {
    no:'02', label:'List of Incoming Materials', freq:'Monthly', icon:'📦', clause:'IATF 8.4',
    desc:'Monthly update of the master list of all incoming materials — part nos., suppliers, inspection type, and AQL.',
    activities:['Compile complete list of incoming materials from ERP/BOM','Assign inspection type per part (visual/dimensional/chemical)','Set AQL sampling plan for each material category','Mark critical and safety characteristics in the list','Distribute updated list to IQC inspectors and stores','Archive previous version and log change history'],
    docs:['Incoming Material Master List','AQL Sampling Plan','Material Inspection Type Matrix','BOM Reference'],
    kpis:['Total Incoming Materials Listed','Materials with AQL Assigned','List Update Completion Date'],
  },
  {
    no:'03', label:'Incoming Parts Layout Inspection', freq:'Monthly', icon:'📏', clause:'IATF 8.4',
    desc:'Monthly layout inspection of incoming parts — 100% dimensional check against drawing for periodic revalidation.',
    activities:['Select parts due for monthly layout inspection (rotation list)','Perform 100% dimensional inspection per drawing','Record all balloon dimensions in layout report','Compare results with drawing tolerances — note deviations','Send layout report to supplier for deviations found','Update layout inspection tracker and file reports'],
    docs:['Layout Inspection Report (per part)','Ballooned Drawing','Layout Inspection Tracker','Supplier Deviation Communication'],
    kpis:['Layout Inspections Completed','Parts with Deviations Found','Supplier Communication Rate'],
  },
  {
    no:'04', label:'Incoming Appearance Manual', freq:'Monthly', icon:'🎨', clause:'IATF 8.4',
    desc:'Monthly review and update of incoming appearance inspection manual — visual standards, limit samples, defect photos.',
    activities:['Review appearance manual for all visual-inspection parts','Update defect definitions and photographs if new defects found','Replace worn or damaged limit samples at IQC station','Brief IQC team on updated appearance criteria','Obtain sign-off on appearance manual from quality head','Archive previous version with effective date'],
    docs:['Incoming Appearance Inspection Manual','Defect Photo Catalogue','Limit Sample Log','Manual Revision Register'],
    kpis:['Appearance Manuals Reviewed','Defect Photos Updated','Limit Samples Replaced'],
  },
  {
    no:'05', label:'Incoming Fixture Validation', freq:'Quarterly', icon:'🔩', clause:'IATF 7.1.5',
    desc:'Quarterly validation of all incoming inspection fixtures and checking gauges — confirm accuracy and fitness for use.',
    activities:['List all IQC fixtures and checking gauges in master list','Perform dimensional validation on each fixture','Compare fixture dimensions with master drawing/standard','Document validation results in fixture validation report','Tag passed fixtures (Green) and flag failed (Red)','Update fixture master list with next validation due date'],
    docs:['Fixture Validation Report','Fixture Master List','Validation Standard/Drawing','Fixture Calibration Certificate'],
    kpis:['Fixtures Validated This Quarter','Fixtures Failed Validation','Fixtures Overdue for Validation'],
  },
  {
    no:'06', label:'Supplier Inward Data', freq:'Monthly', icon:'📊', clause:'IATF 8.4',
    desc:'Monthly compilation and analysis of supplier inward data — GRN count, lots received, rejection rate, PPM per supplier.',
    activities:['Extract GRN data from ERP for the month','Compile inward quantities by supplier and part number','Calculate lot rejection rate and PPM per supplier','Identify suppliers with highest rejection percentage','Prepare monthly inward summary report','Share with supplier quality for SCAR/scorecard action'],
    docs:['Monthly Inward Data Report','Supplier-wise Rejection Summary','GRN Extract (ERP)','PPM Calculation Sheet'],
    kpis:['Total Lots Received','Monthly Rejection Rate %','Suppliers with Rejection &gt; Target'],
  },
  {
    no:'07', label:'Incoming Check Sheet & Adherence', freq:'Monthly', icon:'☑️', clause:'IATF 8.5.1',
    desc:'Monthly review of incoming inspection check sheets — ensure all inspectors use correct, updated check sheets.',
    activities:['Pull list of all active incoming inspection check sheets','Verify check sheet revision matches current drawing/control plan','Spot-check 5 filled check sheets per inspector for completeness','Identify gaps: skipped checks, missing signatures, wrong revision','Conduct refresher briefing for non-adherence found','Update check sheets if process or drawing changed; re-distribute'],
    docs:['Incoming Inspection Check Sheets (all parts)','Check Sheet Adherence Audit Record','Inspector Briefing Register','Check Sheet Revision Log'],
    kpis:['Check Sheets Reviewed','Adherence Audit Score %','Check Sheets Updated This Month'],
  },
  {
    no:'08', label:'Incoming Control Plan / Quality Plan', freq:'Monthly', icon:'📋', clause:'IATF 8.5',
    desc:'Monthly review and update of the incoming inspection control plan — characteristics, frequency, gauge, AQL.',
    activities:['Review all incoming control plans for latest revision','Cross-check characteristics with current drawings','Update frequency and AQL if rejection trend warrants','Verify gauge/method in control plan is available at IQC','Update control plan and obtain quality head sign-off','Distribute revised control plan to IQC team and file'],
    docs:['Incoming Control Plan (per part)','Drawing-Control Plan Correlation Sheet','Gauge Availability Checklist','Control Plan Approval Sign-off'],
    kpis:['Control Plans Reviewed','Out-of-date Control Plans Found','Control Plans Updated & Signed'],
  },
  {
    no:'09', label:'Incoming Skill Matrix', freq:'Monthly', icon:'👥', clause:'IATF 7.2',
    desc:'Monthly review of IQC inspector skill matrix — identify gaps, plan training, update competency ratings.',
    activities:['Review skill matrix for all IQC inspectors','Assess each inspector on: visual inspection, dimensional measurement, gauge use, AQL sampling, reporting','Identify competency gaps (rating below required level)','Plan training/on-job coaching for gaps identified','Conduct training and update skill matrix post-training','Obtain quality head signature on updated skill matrix'],
    docs:['IQC Skill Matrix','Competency Assessment Form','Training Plan (IQC)','Training Attendance Register'],
    kpis:['Inspectors Assessed This Month','Skill Gaps Identified','Training Completion %'],
  },
  {
    no:'10', label:'Quarantine Data & Disposal', freq:'Weekly', icon:'🚫', clause:'IATF 8.7',
    desc:'Weekly management of quarantine area — review all on-hold materials, assign disposition (reject/rework/use-as-is), and close.',
    activities:['Review all materials currently in quarantine area','Check hold age — flag items pending more than 5 days','Assign disposition for each hold item (return/rework/UAI/scrap)','Execute disposition: arrange return/rework/scrap as decided','Update quarantine register with disposition and closure date','Report weekly quarantine status to quality head and SCM'],
    docs:['Quarantine Register','Disposition Form (per lot)','Supplier Return Note','Scrap/Destruction Record'],
    kpis:['Items in Quarantine (Open)','Items Closed This Week','Average Quarantine Hold Days'],
  },
];

const AQL_TABLE = [
  { lot:'2–8',      code:'A', n:2,  ac:0, re:1 },
  { lot:'9–15',     code:'B', n:3,  ac:0, re:1 },
  { lot:'16–25',    code:'C', n:5,  ac:0, re:1 },
  { lot:'26–50',    code:'D', n:8,  ac:0, re:1 },
  { lot:'51–90',    code:'E', n:13, ac:1, re:2 },
  { lot:'91–150',   code:'F', n:20, ac:1, re:2 },
  { lot:'151–280',  code:'G', n:32, ac:2, re:3 },
  { lot:'281–500',  code:'H', n:50, ac:3, re:4 },
  { lot:'501–1200', code:'J', n:80, ac:5, re:6 },
  { lot:'1201–3200',code:'K', n:125,ac:7, re:8 },
];

const DEFECT_TYPES = [
  { type:'Critical (A)', def:'Defect causing safety risk, injury, or government regulation breach', action:'100% sort — immediate stop supply — SCAR', color:'bg-red-100 border-red-300 text-red-800' },
  { type:'Major (B)', def:'Defect affecting function — part will not perform its intended purpose', action:'Reject lot — SCAR to supplier — 8D required', color:'bg-orange-100 border-orange-300 text-orange-600' },
  { type:'Minor (C)', def:'Defect not affecting function — cosmetic or aesthetic deviation', action:'Apply AQL — disposition on severity and quantity', color:'bg-yellow-100 border-yellow-300 text-yellow-200' },
];

const FLOW_STEPS = [
  { step:'GRN Raised', desc:'Store raises GRN on material receipt. Material moved to IQC hold area.' },
  { step:'IQC Inspection', desc:'IQC inspector picks sample per AQL plan. Inspects per check sheet + control plan.' },
  { step:'Result: OK', desc:'Material passed. IQC stamps GRN. Green tag applied. Moves to stores.' },
  { step:'Result: NG', desc:'Material rejected. Red tag applied. Quarantine area. Rejection memo raised.' },
  { step:'Disposition', desc:'Quality Head decides: Return to supplier / Sort & use / Rework / Scrap.' },
  { step:'SCAR Raised', desc:'Supplier corrective action request sent. 8D required within 5 days.' },
];

const FREQ_COLOR: Record<string, string> = {
  Daily: 'bg-red-600 text-white', Weekly: 'bg-orange-500 text-white',
  Monthly: 'bg-blue-600 text-white', Quarterly: 'bg-green-600 text-white',
};

// --- MAIN PAGE ----------------------------------------------------------------
// -- IQC Dashboard & Rejection Data -------------------------------------------
const IQC_LOTS = [
  { id:'L001', date:'2026-08-08', supplier:'Acme Stampings',     part:'Bracket Assy',     qty:500,  inspected:50,  rejected:3,  defect:'Dimension OOT', disposition:'Reject', severity:'major' },
  { id:'L002', date:'2026-08-08', supplier:'Hi-Tech Plastics',   part:'Cover Panel',      qty:1000, inspected:80,  rejected:0,  defect:'-',             disposition:'Accept', severity:'-' },
  { id:'L003', date:'2026-08-07', supplier:'Precision Castings', part:'Housing Body',     qty:300,  inspected:50,  rejected:8,  defect:'Porosity',      disposition:'Reject', severity:'major' },
  { id:'L004', date:'2026-08-07', supplier:'Metro Rubber',       part:'Seal Ring',        qty:2000, inspected:125, rejected:2,  defect:'Flash',         disposition:'Rework', severity:'minor' },
  { id:'L005', date:'2026-08-06', supplier:'Global Forgings',    part:'Shaft Forging',    qty:200,  inspected:32,  rejected:5,  defect:'Dimensional',   disposition:'Reject', severity:'major' },
  { id:'L006', date:'2026-08-06', supplier:'Apex Electronics',   part:'PCB Assembly',     qty:150,  inspected:20,  rejected:12, defect:'Solder Defect', disposition:'Reject', severity:'critical' },
  { id:'L007', date:'2026-08-05', supplier:'Acme Stampings',     part:'Plate Assy',       qty:800,  inspected:80,  rejected:1,  defect:'Burr',          disposition:'Rework', severity:'minor' },
  { id:'L008', date:'2026-08-05', supplier:'Hi-Tech Plastics',   part:'Knob',             qty:500,  inspected:50,  rejected:0,  defect:'-',             disposition:'Accept', severity:'-' },
  { id:'L009', date:'2026-08-04', supplier:'Precision Castings', part:'End Cap',          qty:400,  inspected:50,  rejected:4,  defect:'Surface Crack', disposition:'Reject', severity:'critical' },
  { id:'L010', date:'2026-08-04', supplier:'Metro Rubber',       part:'O-Ring',           qty:5000, inspected:200, rejected:3,  defect:'Dimension',     disposition:'Use-as-is', severity:'minor' },
];

const DEFECT_BREAKDOWN = [
  { type:'Dimensional OOT', count:18, color:'bg-red-500' },
  { type:'Surface Defect',  count:12, color:'bg-orange-500' },
  { type:'Visual / Cosmetic',count:9, color:'bg-amber-500' },
  { type:'Functional Fail', count:7,  color:'bg-purple-600' },
  { type:'Material Issue',  count:5,  color:'bg-blue-600' },
  { type:'Labelling / Pkg', count:3,  color:'bg-teal-600' },
];

const WEEKLY_PPM = [
  { week:'W28', ppm:1850 }, { week:'W29', ppm:2100 }, { week:'W30', ppm:1620 },
  { week:'W31', ppm:1480 }, { week:'W32', ppm:1240 }, { week:'W33', ppm:980 },
];


// -- IQC Dashboard -------------------------------------------------------------
function IQCDashboard() {
  const totalLots    = IQC_LOTS.length;
  const totalQty     = IQC_LOTS.reduce((a,l)=>a+l.qty, 0);
  const totalInsp    = IQC_LOTS.reduce((a,l)=>a+l.inspected, 0);
  const totalRej     = IQC_LOTS.reduce((a,l)=>a+l.rejected, 0);
  const acceptedLots = IQC_LOTS.filter(l=>l.disposition==='Accept').length;
  const rejectedLots = IQC_LOTS.filter(l=>l.disposition==='Reject').length;
  const reworkLots   = IQC_LOTS.filter(l=>l.disposition==='Rework').length;
  const uaiLots      = IQC_LOTS.filter(l=>l.disposition==='Use-as-is').length;
  const lotAccRate   = Math.round((acceptedLots / totalLots) * 100);
  const iqcPPM       = totalInsp > 0 ? Math.round((totalRej / totalInsp) * 1_000_000) : 0;

  // Supplier-wise rejection
  const bySupplier: Record<string,{qty:number;rej:number}> = {};
  IQC_LOTS.forEach(l => {
    if (!bySupplier[l.supplier]) bySupplier[l.supplier] = { qty:0, rej:0 };
    bySupplier[l.supplier].qty += l.inspected;
    bySupplier[l.supplier].rej += l.rejected;
  });
  const suppRej = Object.entries(bySupplier)
    .map(([name,v]) => ({ name, rej:v.rej, ppm: v.qty>0?Math.round(v.rej/v.qty*1_000_000):0 }))
    .sort((a,b) => b.rej - a.rej);
  const maxRej = Math.max(...suppRej.map(s=>s.rej), 1);
  const maxPPM = Math.max(...WEEKLY_PPM.map(w=>w.ppm), 1);

  return (
      <>
      <PageTitle title="Incoming Quality" />
      <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Lot Acceptance Rate', value:`${lotAccRate}%`, sub:`${acceptedLots}/${totalLots} lots OK`, color: lotAccRate>=90?'text-emerald-600':lotAccRate>=75?'text-amber-600':'text-red-600' },
          { label:'IQC Rejection PPM',   value: iqcPPM.toLocaleString(), sub:`${totalRej} pcs rejected`, color: iqcPPM<=2000?'text-emerald-600':iqcPPM<=5000?'text-amber-600':'text-red-600' },
          { label:'Lots Inspected',      value: totalLots, sub:`${totalInsp.toLocaleString()} pcs sampled`, color:'text-teal-700' },
          { label:'Rejected Lots',       value: rejectedLots, sub:`${reworkLots} rework · ${uaiLots} UAI`, color: rejectedLots>3?'text-red-600':'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PPM Trend */}
        <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Weekly IQC PPM Trend</div>
          <div className="flex items-end gap-2 h-36">
            {WEEKLY_PPM.map(w => {
              const pct = Math.round((w.ppm / maxPPM) * 100);
              const color = w.ppm <= 1000 ? 'bg-emerald-500' : w.ppm <= 2000 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-[#1e3a5f]">{w.ppm.toLocaleString()}</span>
                  <div className={`w-full rounded-t-md ${color}`} style={{height:`${pct}%`, minHeight:'8px'}} />
                  <span className="text-xs text-[#1e3a5f]">{w.week}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#1e3a5f]">
            <div className="w-3 h-3 rounded bg-red-400" /> &gt;2000
            <div className="w-3 h-3 rounded bg-amber-400" /> 1001–2000
            <div className="w-3 h-3 rounded bg-emerald-500" /> ≤1000 target
          </div>
        </div>

        {/* Lot Disposition */}
        <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Lot Disposition Summary</div>
          <div className="space-y-3">
            {[
              { label:'✅ Accept',      value: acceptedLots, color:'bg-emerald-500', text:'text-emerald-700' },
              { label:'🔴 Reject',      value: rejectedLots, color:'bg-red-500',     text:'text-red-700' },
              { label:'🔧 Rework',      value: reworkLots,   color:'bg-amber-500',   text:'text-amber-700' },
              { label:'⚠️ Use-as-is',   value: uaiLots,      color:'bg-blue-500',    text:'text-[#1d4ed8]' },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-semibold ${b.text}`}>{b.label}</span>
                  <span className="text-[#1e3a5f]">{b.value} lots ({Math.round(b.value/totalLots*100)}%)</span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div className={`${b.color} h-2 rounded-full`} style={{width:`${Math.round(b.value/totalLots*100)}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supplier-wise Rejection Bar */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Supplier-wise IQC Rejection (Last 7 Days)</div>
        <div className="space-y-3">
          {suppRej.map(s => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#1e3a5f] w-40 truncate">{s.name}</span>
              <div className="flex-1 bg-white rounded-full h-3">
                <div className={`h-3 rounded-full ${s.rej===0?'bg-emerald-400':s.rej<=3?'bg-amber-500':'bg-red-500'}`}
                  style={{width:`${Math.round(s.rej/maxRej*100)}%`, minWidth: s.rej>0?'8px':'0'}} />
              </div>
              <span className={`text-xs font-bold w-12 text-right ${s.rej===0?'text-emerald-600':s.rej<=3?'text-amber-600':'text-red-600'}`}>{s.rej} pcs</span>
              <span className="text-xs text-[#1e3a5f] w-20 text-right">{s.ppm.toLocaleString()} PPM</span>
            </div>
          ))}
        </div>
      </div>
    </div>
      </>
  );
}

// -- IQC Rejection Analysis ----------------------------------------------------
function IQCRejectionAnalysis() {
  const [filter, setFilter] = useState<'All'|'Accept'|'Reject'|'Rework'|'Use-as-is'>('All');
  const totalDefects = DEFECT_BREAKDOWN.reduce((a,d)=>a+d.count,0);
  const maxDefect    = Math.max(...DEFECT_BREAKDOWN.map(d=>d.count), 1);
  const lots = filter === 'All' ? IQC_LOTS : IQC_LOTS.filter(l=>l.disposition===filter);

  const SEVERITY_BADGE: Record<string,string> = {
    critical:'bg-red-100 text-red-700',
    major:'bg-orange-100 text-orange-600',
    minor:'bg-yellow-100 text-yellow-300',
    '-':'bg-white text-[#1e3a5f]',
  };
  const DISP_BADGE: Record<string,string> = {
    Accept:'bg-emerald-100 text-emerald-700',
    Reject:'bg-red-100 text-red-700',
    Rework:'bg-amber-100 text-amber-700',
    'Use-as-is':'bg-blue-100 text-[#1d4ed8]',
  };

  return (
    <div className="space-y-5">
      {/* Defect Type Breakdown */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Defect Type Breakdown (This Month)</div>
        <div className="space-y-3">
          {DEFECT_BREAKDOWN.map(d => (
            <div key={d.type}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#1e3a5f]">{d.type}</span>
                <span className="text-[#1e3a5f]">{d.count} ({Math.round(d.count/totalDefects*100)}%)</span>
              </div>
              <div className="w-full bg-white rounded-full h-2.5">
                <div className={`${d.color} h-2.5 rounded-full`} style={{width:`${Math.round(d.count/maxDefect*100)}%`}} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lot Register with Filter */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">IQC Lot Register</div>
          <div className="flex gap-1 flex-wrap">
            {(['All','Accept','Reject','Rework','Use-as-is'] as const).map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition ${filter===f?'bg-teal-700 text-white':'bg-white text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-teal-50 text-left">
                {['Lot ID','Date','Supplier','Part','Qty','Inspected','Rejected','Defect','Severity','Disposition'].map(h=>(
                  <th key={h} className="px-3 py-2 text-xs font-bold text-[#1e3a5f]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lots.map(l => (
                <tr key={l.id} className="border-t border-[#dbeafe] hover:bg-[#eff6ff]">
                  <td className="px-3 py-2 font-mono text-xs text-[#1e3a5f]">{l.id}</td>
                  <td className="px-3 py-2 text-xs text-[#1e3a5f]">{l.date}</td>
                  <td className="px-3 py-2 text-xs font-medium text-[#1e3a5f]">{l.supplier}</td>
                  <td className="px-3 py-2 text-xs text-[#1e3a5f]">{l.part}</td>
                  <td className="px-3 py-2 text-xs text-[#1e3a5f]">{l.qty.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-[#1e3a5f]">{l.inspected}</td>
                  <td className={`px-3 py-2 text-xs font-bold ${l.rejected>0?'text-red-600':'text-emerald-600'}`}>{l.rejected}</td>
                  <td className="px-3 py-2 text-xs text-[#1e3a5f]">{l.defect}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_BADGE[l.severity]??'bg-white text-[#1e3a5f]'}`}>{l.severity}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DISP_BADGE[l.disposition]??'bg-white text-[#1e3a5f]'}`}>{l.disposition}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lots.length === 0 && <div className="text-center text-xs text-[#1e3a5f] py-6">No lots match this filter.</div>}
        </div>
      </div>

      {/* IATF Reminder */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <div className="text-xs font-bold text-teal-800 mb-2">📘 IATF 16949 Cl. 8.4 — IQC Key Requirements</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-teal-700">
          {[
            '🔷 AQL-based incoming sampling plan must be documented and approved.',
            '🔷 Rejected lots must be segregated and identified with clear status tags.',
            '🔷 Disposition (Accept/Reject/Rework/UAI) must be authorized by Quality.',
            '🔷 Supplier SCAR must be raised for critical or repeat defects.',
            '🔷 Use-as-is (concession) requires customer approval for safety/fit/function.',
            '🔷 IQC records (inspection reports, rejection notes) retained per retention plan.',
          ].map((t,i)=>(
            <div key={i} className="bg-white rounded-lg p-2 border border-teal-100">{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function IncomingQualityPage() {
  const [tab, setTab] = useState<'dashboard'|'tracker'|'knowledge'|'aql'|'rejection'>('dashboard');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [freqFilter, setFreqFilter] = useState('All');

  const filtered = freqFilter === 'All' ? PROCESSES : PROCESSES.filter(p => p.freq === freqFilter);
  const freqs = ['All','Daily','Weekly','Monthly','Quarterly'];

  return (
    <div className="min-h-screen bg-[#eff6ff]">

      {/* -- HEADER ------------------------------------------------------- */}
      <div className="bg-teal-700 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">📥 Incoming Quality (IQC)</h1>
              <p className="text-teal-300 text-sm mt-1">GRN inspection · AQL sampling · Quarantine management · Supplier rejection — IATF 16949 Cl. 8.4</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label:'Daily',     freq:'Daily',     value:PROCESSES.filter(p=>p.freq==='Daily').length,     color:'bg-red-700',    ring:'ring-red-300'    },
                { label:'Weekly',    freq:'Weekly',    value:PROCESSES.filter(p=>p.freq==='Weekly').length,    color:'bg-blue-700',   ring:'ring-blue-300'   },
                { label:'Monthly',   freq:'Monthly',   value:PROCESSES.filter(p=>p.freq==='Monthly').length,   color:'bg-green-700',  ring:'ring-green-300'  },
                { label:'Quarterly', freq:'Quarterly', value:PROCESSES.filter(p=>p.freq==='Quarterly').length, color:'bg-purple-700', ring:'ring-purple-300' },
              ].map(s => (
                <button key={s.label} onClick={()=>{ setFreqFilter(f=>f===s.freq?'All':s.freq); setTab('tracker'); }}
                  className={`${s.color} rounded-lg px-3 py-2 transition-all hover:brightness-110 hover:scale-[1.02] ${freqFilter===s.freq?`ring-2 ${s.ring} scale-[1.03]`:'opacity-85'}`}>
                  <p className="text-xl font-bold text-white drop-shadow">{s.value}</p>
                  <p className="text-[11px] text-white font-semibold leading-tight">{s.label}</p>
                  <p className="text-[10px] text-white/90">{freqFilter===s.freq?'▲ All':'Click to filter'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 mt-4 flex-wrap">
            {([['dashboard','📊 Dashboard'],['tracker','📋 Process Tracker'],['knowledge','📚 IQC Knowledge Hub'],['aql','📐 AQL & Inspection Guide'],['rejection','🔍 Rejection Analysis']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`px-5 py-2.5 rounded-t-lg text-sm font-semibold transition ${tab===id ? 'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]' : 'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-5">

        {/* -- TAB 1: PROCESS TRACKER -------------------------------------- */}
      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/incoming-quality/Incoming_Inspection_Report.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View IQC Report XLS">IQC Report XLS</a><a href="/downloads/incoming-quality/Incoming_Inspection_Report.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download IQC Report XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/incoming-quality/IQC_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View IQC Checklist XLS">IQC Checklist XLS</a><a href="/downloads/incoming-quality/IQC_Checklist.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download IQC Checklist XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/incoming-quality/AQL_Sampling_Plan.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View AQL Sampling Plan">AQL Sampling Plan</a><a href="/downloads/incoming-quality/AQL_Sampling_Plan.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download AQL Sampling Plan">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/incoming-quality/Incoming_Rejection_Report.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Rejection Report">Rejection Report</a><a href="/downloads/incoming-quality/Incoming_Rejection_Report.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Rejection Report">⬇</a></span>
      </div>
        {tab === 'dashboard' && <IQCDashboard />}

        {tab === 'rejection' && <IQCRejectionAnalysis />}

        {tab === 'tracker' && (
          <div className="animate-fadeIn space-y-4">
            {/* Freq filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Filter by Frequency:</span>
              {freqs.map(f => (
                <button key={f} onClick={()=>setFreqFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${freqFilter===f ? 'bg-teal-700 text-white' : 'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
                  {f}
                </button>
              ))}
              <span className="text-xs text-[#1e3a5f] ml-2">{filtered.length} processes</span>
            </div>

            {/* Process Cards */}
            {filtered.map(p => (
              <div key={p.no} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm overflow-hidden">
                <button
                  onClick={()=>setExpanded(expanded===p.no ? null : p.no)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#eff6ff] transition text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#1e3a5f]">#{p.no}</span>
                        <h3 className="font-bold text-[#1e3a5f]">{p.label}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FREQ_COLOR[p.freq] ?? 'bg-gray-500 text-white'}`}>{p.freq}</span>
                      </div>
                      <p className="text-xs text-[#1e3a5f] mt-0.5">{p.clause}</p>
                    </div>
                  </div>
                  <span className="text-[#1e3a5f] text-lg">{expanded===p.no ? '▲' : '▼'}</span>
                </button>

                {expanded === p.no && (
                  <div className="border-t border-[#dbeafe] px-5 py-4 space-y-4 bg-teal-50/30">
                    <p className="text-sm text-[#1e3a5f]">{p.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-teal-800 uppercase tracking-wide mb-2">✅ Activities</p>
                        <ul className="space-y-1">
                          {p.activities.map((a,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-[#1e3a5f]">
                              <span className="text-teal-500 font-bold flex-shrink-0">{i+1}.</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-wide mb-2">📄 Documents Required</p>
                        <ul className="space-y-1">
                          {p.docs.map((d,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-[#1e3a5f]">
                              <span className="text-blue-500 flex-shrink-0">▸</span>{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-200 uppercase tracking-wide mb-2">📊 KPIs to Track</p>
                        <ul className="space-y-1">
                          {p.kpis.map((k,i)=>(
                            <li key={i} className="flex gap-2 text-xs text-[#1e3a5f]">
                              <span className="text-purple-500 flex-shrink-0">◆</span>{k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* -- TAB 2: IQC KNOWLEDGE HUB ---------------------------------- */}
        {tab === 'knowledge' && (
          <div className="animate-fadeIn space-y-6">

            {/* What is IQC */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">🎯 What is Incoming Quality Control (IQC)?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#1e3a5f] leading-relaxed">
                    IQC is the <strong>quality gate between your supplier and your production line</strong>.
                    Every part, raw material, and consumable that enters your factory must be inspected before
                    it reaches the shop floor. A single bad batch that escapes IQC can cause line stoppages,
                    customer complaints, and massive COPQ.
                  </p>
                  <p className="text-sm text-[#1e3a5f] leading-relaxed mt-3">
                    Under IATF 16949 Clause 8.4, you are required to verify that externally provided products
                    conform to specified requirements. IQC is your implementation of this requirement.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    { icon:'🛡️', title:'Quality Gate', desc:'Prevent bad material from reaching production' },
                    { icon:'📊', title:'Supplier Feedback', desc:'PPM, rejection rate feeds back to supplier scorecard' },
                    { icon:'⚖️', title:'AQL Sampling', desc:'Statistically valid sample inspection — not 100% (unless critical)' },
                    { icon:'🔄', title:'Feedback Loop', desc:'Rejection data drives SCAR and supplier development' },
                  ].map((item,i) => (
                    <div key={i} className="flex gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-teal-800">{item.title}</p>
                        <p className="text-xs text-teal-700">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Defect Classification */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">🔴 Defect Classification — IQC Decision Guide</h2>
              <div className="space-y-3">
                {DEFECT_TYPES.map((d,i) => (
                  <div key={i} className={`border rounded-xl p-4 ${d.color}`}>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-sm">{d.type}</p>
                        <p className="text-sm mt-1">{d.def}</p>
                      </div>
                      <div className="bg-white/60 rounded-lg px-3 py-1.5">
                        <p className="text-xs font-bold">Action: {d.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-[#eff6ff] border border-blue-700/50 rounded-xl">
                <p className="text-sm font-bold text-[#1d4ed8] mb-1">💡 IQC Golden Rule</p>
                <p className="text-sm text-blue-200">When in doubt about defect classification — <strong>always escalate to Quality Head</strong>. Never accept a critical defect under AQL. Critical defects always require 100% inspection.</p>
              </div>
            </div>

            {/* Inspection Flow */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">🔄 IQC Inspection Flow — Step by Step</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {FLOW_STEPS.map((s,i) => (
                  <div key={i} className="relative">
                    <div className="bg-teal-50 text-white rounded-xl p-3 text-center h-full">
                      <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">{i+1}</div>
                      <p className="text-xs font-bold text-teal-300 mb-1">{s.step}</p>
                      <p className="text-xs text-teal-200 leading-snug">{s.desc}</p>
                    </div>
                    {i < FLOW_STEPS.length-1 && (
                      <div className="hidden md:block absolute top-1/2 -right-1.5 text-teal-400 text-sm z-10">▶</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Common IQC Defects by Material */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">🔬 Common Incoming Defects by Material Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { mat:'Metal Stampings', defects:['Dimensional out of tolerance','Burr and sharp edge','Surface scratch/dent','Rust/corrosion','Wrong material grade','Wrong heat treatment'] },
                  { mat:'Plastic Mouldings', defects:['Sink marks','Flash/excess material','Warpage','Short shot','Surface flow marks','Wrong colour/texture'] },
                  { mat:'Rubber/Foam Parts', defects:['Wrong hardness (Shore A)','Dimensions out of spec','Torn or cut edges','Contamination','Wrong material compound','Porosity'] },
                  { mat:'Weld Assemblies', defects:['Missing weld/incomplete fusion','Weld spatter','Dimensional deviation post-weld','Crack in weld zone','Wrong weld sequence','Porosity in weld'] },
                  { mat:'Fasteners (Bolts/Nuts)', defects:['Wrong grade/property class','Thread damage','Incorrect length','Surface coating defect','Wrong head type','Contamination'] },
                  { mat:'Electrical/Wire Harness', defects:['Wrong connector pinout','Insulation damage','Short circuit','Wrong wire gauge','Missing terminal crimps','Continuity failure'] },
                ].map((m,i)=>(
                  <div key={i} className="border border-[#dbeafe] rounded-xl overflow-hidden">
                    <div className="bg-white text-[#1e3a5f] px-4 py-2">
                      <p className="text-sm font-bold">{m.mat}</p>
                    </div>
                    <ul className="p-3 space-y-1">
                      {m.defects.map((d,j)=>(
                        <li key={j} className="text-xs text-[#1e3a5f] flex gap-2">
                          <span className="text-red-600 flex-shrink-0">•</span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* IATF Requirements */}
            <div className="bg-teal-50 rounded-xl p-6 text-white">
              <h2 className="text-lg font-bold mb-4">📋 IATF 16949 Requirements — Incoming Quality</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { clause:'8.4.1', title:'General (Supplier Control)', req:'Maintain Approved Supplier List. Evaluate and select suppliers based on ability to meet requirements.' },
                  { clause:'8.4.2', title:'Type & Extent of Control', req:'Incoming inspection type and frequency must be based on supplier performance and part risk level.' },
                  { clause:'8.4.3', title:'Info to Suppliers', req:'Communicate all requirements including characteristics, specifications, packaging, and PPAP expectations.' },
                  { clause:'8.7.1', title:'Control of NC Product', req:'Identify, segregate, and control nonconforming material. Obtain concession before using or releasing.' },
                  { clause:'7.1.5', title:'Monitoring & Measuring Resources', req:'All inspection gauges must be calibrated. Fixture validation required. MSA before use.' },
                  { clause:'7.5', title:'Documented Information', req:'Maintain inspection records, GRN records, rejection notes, and quarantine records.' },
                ].map((r,i)=>(
                  <div key={i} className="bg-teal-50/50 rounded-lg p-4 border border-teal-700">
                    <div className="flex gap-3">
                      <span className="font-mono text-teal-400 font-bold text-sm flex-shrink-0">{r.clause}</span>
                      <div>
                        <p className="font-bold text-teal-200 text-sm">{r.title}</p>
                        <p className="text-teal-300 text-xs mt-1">{r.req}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -- TAB 3: AQL GUIDE ------------------------------------------ */}
        {tab === 'aql' && (
          <div className="animate-fadeIn space-y-6">

            {/* AQL Intro */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">📐 What is AQL?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-[#1e3a5f] leading-relaxed">
                    <strong>AQL = Acceptable Quality Level</strong> — the maximum percentage of defective parts that is still considered acceptable in a lot. AQL sampling is based on <strong>ANSI/ASQ Z1.4</strong> (attribute inspection) and <strong>Z1.9</strong> (variable inspection).
                  </p>
                  <p className="text-sm text-[#1e3a5f] leading-relaxed mt-3">
                    Instead of inspecting 100% of a lot (expensive and slow), you take a <strong>statistical sample</strong>. If the defects in your sample are below the Acceptance Number (Ac), you accept the lot. If defects equal or exceed the Rejection Number (Re), you reject the entire lot.
                  </p>
                  <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-xl">
                    <p className="text-sm font-bold text-yellow-200">⚠️ AQL is NOT 100% protection</p>
                    <p className="text-sm text-yellow-300 mt-1">AQL gives statistical confidence, not a guarantee. A lot can be accepted under AQL even if it has some defects. For critical characteristics — always inspect 100%.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl p-4">
                    <p className="font-bold text-blue-200 text-sm mb-2">📊 Common AQL Levels Used in Automotive</p>
                    <div className="space-y-1">
                      {[
                        { level:'AQL 0.065', use:'Safety-critical characteristics — rare in incoming parts' },
                        { level:'AQL 0.4', use:'Critical (A) defects — dimensional, functional' },
                        { level:'AQL 1.0', use:'Major (B) defects — standard for most parts' },
                        { level:'AQL 2.5', use:'Minor (C) defects — cosmetic, packaging' },
                        { level:'AQL 4.0', use:'Non-critical cosmetic — rarely used in automotive' },
                      ].map((a,i)=>(
                        <div key={i} className="flex gap-3 text-xs">
                          <span className="font-mono font-bold text-[#1d4ed8] w-20 flex-shrink-0">{a.level}</span>
                          <span className="text-[#1d4ed8]">{a.use}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4">
                    <p className="font-bold text-[#15803d] text-sm mb-2">📋 Inspection Levels</p>
                    <div className="space-y-1 text-xs text-green-300">
                      <p><strong>Level I</strong> — Reduced inspection. Used when supplier is performing well (history of good quality).</p>
                      <p><strong>Level II</strong> — Normal inspection. Default level for most incoming inspection.</p>
                      <p><strong>Level III</strong> — Tightened inspection. Used when supplier has recent quality escapes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AQL Table */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-1">📋 AQL Sampling Table — Level II, AQL 1.0 (Major Defects)</h2>
              <p className="text-xs text-[#1e3a5f] mb-4">Based on ANSI/ASQ Z1.4. Ac = Accept if defects ≤ this number. Re = Reject if defects ≥ this number.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-[#dbeafe] rounded-lg overflow-hidden">
                  <thead className="bg-teal-50 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Lot Size (pcs)</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Sample Code</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Sample Size (n)</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-green-300">Accept if defects ≤ (Ac)</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-red-600">Reject if defects ≥ (Re)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {AQL_TABLE.map((row,i)=>(
                      <tr key={i} className={i%2===0 ? 'bg-white' : 'bg-[#eff6ff]'}>
                        <td className="px-4 py-2.5 font-mono text-sm text-[#1e3a5f]">{row.lot}</td>
                        <td className="px-4 py-2.5 font-bold text-[#1e3a5f]">{row.code}</td>
                        <td className="px-4 py-2.5 font-bold text-[#1d4ed8]">{row.n}</td>
                        <td className="px-4 py-2.5 font-bold text-green-300">{row.ac}</td>
                        <td className="px-4 py-2.5 font-bold text-red-700">{row.re}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { title:'📦 Example 1', desc:'Lot of 200 pcs received. Sample Code G → take 32 samples. Find 0 or 1 defects → Accept. Find 2+ defects → Reject.' },
                  { title:'📦 Example 2', desc:'Lot of 750 pcs received. Sample Code J → take 80 samples. Find 0–4 defects → Accept. Find 5+ defects → Reject lot.' },
                  { title:'📦 Example 3', desc:'Lot of 2000 pcs received. Sample Code K → take 125 samples. Find 0–6 defects → Accept. Find 7+ → Reject.' },
                ].map((e,i)=>(
                  <div key={i} className="bg-[#eff6ff] border border-blue-700/50 rounded-xl p-3">
                    <p className="font-bold text-blue-200 text-sm mb-1">{e.title}</p>
                    <p className="text-xs text-[#1d4ed8]">{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gauge Guide */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">🔬 IQC Gauge & Measurement Quick Guide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { gauge:'Vernier Caliper', use:'Linear dimensions: length, width, OD, ID, depth', rule:'Zero before use. Check for jaw damage. Read in good light. Least count: 0.02mm.' },
                  { gauge:'Micrometer (Screw Gauge)', use:'Precise OD/ID measurement — shaft diameters, wall thickness', rule:'Calibrate to 0.000 at closed position. 3 readings per location. Use ratchet thimble.' },
                  { gauge:'Dial Gauge / DTI', use:'Flatness, parallelism, runout, concentricity checks', rule:'Mount on rigid stand. Set zero on master. Measure at defined points in control plan.' },
                  { gauge:'Go/No-Go Gauge', use:'Quick pass/fail check for threaded holes, shafts, slots', rule:'Go gauge must pass. No-Go gauge must not pass. Do not force. Check for wear regularly.' },
                  { gauge:'Height Gauge', use:'Height and step measurement — on surface plate', rule:'Surface plate must be clean and level. Zero on surface. Measure at both ends.' },
                  { gauge:'CMM', use:'Complex 3D dimensional inspection — full layout', rule:'Temperature: 20°C ±1°C. Calibrated probe. Run measurement program per drawing balloon.' },
                ].map((g,i)=>(
                  <div key={i} className="border border-[#dbeafe] rounded-xl overflow-hidden">
                    <div className="bg-white text-[#1e3a5f] px-4 py-2">
                      <p className="text-sm font-bold">🔧 {g.gauge}</p>
                      <p className="text-xs text-[#1e3a5f]">Use: {g.use}</p>
                    </div>
                    <div className="p-3 bg-[#eff6ff]">
                      <p className="text-xs text-[#1e3a5f]"><strong>Rule:</strong> {g.rule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PPM Formula */}
            <div className="bg-teal-50 rounded-xl p-6 text-white">
              <h2 className="text-lg font-bold mb-4">📊 PPM Calculation for Incoming Quality</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-teal-50/60 rounded-xl p-5 text-center border border-teal-700 mb-4">
                    <p className="text-teal-300 text-sm font-bold mb-2">Incoming PPM Formula</p>
                    <p className="text-2xl font-bold font-mono">PPM = (Rejected Qty / Received Qty) × 1,000,000</p>
                  </div>
                  <div className="bg-teal-50/40 rounded-xl p-4 border border-teal-700">
                    <p className="text-teal-300 font-bold text-sm mb-2">Example:</p>
                    <p className="text-teal-200 text-sm">You received 5,000 pcs from Supplier ABC. In IQC you rejected 8 pcs.</p>
                    <p className="text-white font-mono text-lg mt-2">PPM = (8 / 5000) × 1,000,000 = <span className="text-yellow-400">1,600 PPM</span></p>
                    <p className="text-teal-300 text-xs mt-2">If your target is &lt; 500 PPM — this supplier needs a SCAR.</p>
                  </div>
                </div>
                <div>
                  <p className="text-teal-300 font-bold text-sm mb-3">PPM Target Benchmarks (Automotive)</p>
                  <div className="space-y-2">
                    {[
                      { range:'0–100 PPM', status:'Excellent — World Class', color:'bg-green-500' },
                      { range:'101–500 PPM', status:'Acceptable — Monitor trend', color:'bg-yellow-500' },
                      { range:'501–1000 PPM', status:'Concern — SCAR required', color:'bg-orange-500' },
                      { range:'1001–5000 PPM', status:'Poor — Development required', color:'bg-red-500' },
                      { range:'Above 5000 PPM', status:'Critical — Consider supplier change', color:'bg-red-800' },
                    ].map((b,i)=>(
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${b.color}`} />
                        <span className="font-mono text-sm text-teal-200 w-28">{b.range}</span>
                        <span className="text-xs text-teal-300">{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
      <QualityCopilot page="incoming-quality" />
    </div>
  );
}