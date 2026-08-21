'use client';
import { useState, useEffect } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';
import ExportPDF from '../components/ExportPDF';
import RoleGuard from '../components/RoleGuard';

// -- Types ---------------------------------------------------------------------
type ActionStatus = 'open'|'in-progress'|'closed'|'overdue';
type InputStatus  = 'green'|'amber'|'red';

interface MRMAction {
  id: string;
  source: string;     // which input raised this
  action: string;
  owner: string;
  targetDate: string;
  status: ActionStatus;
  closureNote: string;
}

interface MRMInput {
  id: string;
  clause: string;
  title: string;
  status: InputStatus;
  summary: string;
  data: string;        // key metric / evidence
  trend: 'improving'|'stable'|'deteriorating';
  actionRequired: boolean;
}

interface MRM {
  id: string;
  meetingDate: string;
  nextMeetingDate: string;
  chairperson: string;
  attendees: string[];
  venue: string;
  inputs: MRMInput[];
  actions: MRMAction[];
  outputs: string[];
  approved: boolean;
}

// -- Sample Data ---------------------------------------------------------------
const MRM_INPUTS: MRMInput[] = [
  { id:'I-01', clause:'9.1.2', title:'Customer Satisfaction & Feedback', status:'amber',
    summary:'Customer PPM at 180 against target 150. Tata Motors complaint resolved. Maruti trending positive.',
    data:'PPM: 180 (Target: 150) | Complaints: 1 open | OTD: 97.8%',
    trend:'improving', actionRequired:true },
  { id:'I-02', clause:'9.1.1', title:'Quality Objectives Performance', status:'amber',
    summary:'7 of 10 KPIs on track. Customer PPM and FTT% behind target. COPQ reducing month on month.',
    data:'Overall Achievement: 74% | Behind: 2 KPIs | On-track: 5 KPIs | Achieved: 3 KPIs',
    trend:'improving', actionRequired:true },
  { id:'I-03', clause:'9.2', title:'Internal Audit Results', status:'green',
    summary:'Q2 internal audit completed. 3 minors, 0 majors. All NCs closed within 30 days. Next audit: Oct 2026.',
    data:'Audit Score: 88% | Open NCs: 0 | Closure Rate: 100% | Next: Oct 2026',
    trend:'stable', actionRequired:false },
  { id:'I-04', clause:'10.2', title:'Nonconformities & Corrective Actions (CAPA)', status:'amber',
    summary:'12 CAPAs open. 3 overdue beyond target date. Bosch supplier CAPA escalated.',
    data:'Open CAPAs: 12 | Overdue: 3 | Closure Rate: 88% | Escalated: 1',
    trend:'stable', actionRequired:true },
  { id:'I-05', clause:'6.1', title:'Risk & Opportunities', status:'green',
    summary:'No new critical risks identified. Steel price risk monitored. New customer Toyota opportunity confirmed.',
    data:'Critical Risks: 0 | Opportunities: 2 | Risk Actions Open: 1',
    trend:'stable', actionRequired:false },
  { id:'I-06', clause:'8.4', title:'Supplier Performance', status:'red',
    summary:'Bosch India at D rating — PPM 620 vs target 400. Supplier improvement plan in progress. SCAR raised.',
    data:'Avg Supplier PPM: 520 | D-rated Suppliers: 1 | SCARs Open: 2',
    trend:'deteriorating', actionRequired:true },
  { id:'I-07', clause:'7.1.3', title:'Infrastructure & Resources', status:'green',
    summary:'CMM calibration completed Q2. New SPC software implemented. No critical equipment downtime.',
    data:'Calibration Due: 0 | Equipment Downtime: 0.8% | Capex Utilized: 78%',
    trend:'stable', actionRequired:false },
  { id:'I-08', clause:'7.2', title:'Competency & Training', status:'green',
    summary:'Q2 training plan 88% completed. IATF awareness training pending for 3 new joiners.',
    data:'Training Completion: 88% | Pending: 3 persons | Skill Matrix Updated: Yes',
    trend:'improving', actionRequired:false },
  { id:'I-09', clause:'8.8', title:'Warranty & Field Failures', status:'amber',
    summary:'1 active recall — PLT-D044 plate assembly. R/1000 at 28 against target 20. Cost ₹3.2L this quarter.',
    data:'R/1000: 28 (Target: 20) | Active Recalls: 1 | Warranty Cost: ₹3.2L QTD',
    trend:'deteriorating', actionRequired:true },
  { id:'I-10', clause:'9.3.2', title:'Previous MRM Action Review', status:'green',
    summary:'8 of 10 actions from previous MRM closed. 2 still in progress — on track for closure.',
    data:'Actions Closed: 8/10 (80%) | In Progress: 2 | Overdue: 0',
    trend:'stable', actionRequired:false },
];

const SAMPLE_ACTIONS: MRMAction[] = [
  { id:'A-001', source:'Customer Satisfaction', action:'Implement SPC on Op-20 for BKT-A001 hole position — prevent recurrence of Tata Motors complaint', owner:'Quality Head', targetDate:'2026-08-30', status:'in-progress', closureNote:'' },
  { id:'A-002', source:'Quality Objectives', action:'Develop FTT improvement plan for Line-3 — target 97% by Q3 end', owner:'Manufacturing / Quality', targetDate:'2026-09-15', status:'open', closureNote:'' },
  { id:'A-003', source:'Supplier Performance', action:'Conduct Bosch India process audit and agree on 90-day improvement plan', owner:'Supplier Quality Manager', targetDate:'2026-08-25', status:'in-progress', closureNote:'' },
  { id:'A-004', source:'Warranty & Field', action:'Complete PLT-D044 recall — inspect all field units, submit closure report to Tata Motors', owner:'Quality Head / Engineering', targetDate:'2026-08-15', status:'overdue', closureNote:'' },
  { id:'A-005', source:'CAPA Management', action:'Close 3 overdue CAPAs — escalate to respective department heads for immediate action', owner:'Quality Head', targetDate:'2026-08-10', status:'closed', closureNote:'All 3 CAPAs closed as of Aug 8. Effectiveness verification in progress.' },
];

const MRM_OUTPUTS = [
  'Customer PPM improvement plan approved — SPC implementation on all critical dimensions by Sep 30',
  'Bosch India supplier escalated — Quality Director to conduct audit week of Aug 25',
  'Recall PLT-D044 — Emergency task force formed, daily update to MD until closure',
  'FTT improvement project sanctioned — Budget ₹2.5L for Line-3 poka-yoke investment',
  'Training budget for IATF awareness approved — 3 new joiners to complete by Aug 31',
  'Next Management Review: October 15, 2026',
];

const STATUS_STYLE: Record<InputStatus, string> = {
  green: 'border-emerald-200 bg-emerald-950/20',
  amber: 'border-amber-200 bg-amber-950/20',
  red:   'border-red-700/50 bg-red-50',
};
const STATUS_DOT: Record<InputStatus, string> = {
  green:'bg-emerald-500', amber:'bg-amber-500', red:'bg-red-500'
};
const ACT_STYLE: Record<ActionStatus, string> = {
  open:'bg-blue-900/30 text-[#1d4ed8]', 'in-progress':'bg-amber-50 text-amber-600',
  closed:'bg-emerald-900/30 text-[#15803d]', overdue:'bg-red-900/40 text-red-600 font-bold'
};
const TREND_ICON: Record<string, string> = { improving:'↑', stable:'→', deteriorating:'↓' };
const TREND_COLOR: Record<string, string> = { improving:'text-emerald-600', stable:'text-blue-600', deteriorating:'text-red-600' };

// -- Dashboard -----------------------------------------------------------------
function MRMDashboard({ inputs, actions }: { inputs: MRMInput[]; actions: MRMAction[] }) {
  const greens  = inputs.filter(i=>i.status==='green').length;
  const ambers  = inputs.filter(i=>i.status==='amber').length;
  const reds    = inputs.filter(i=>i.status==='red').length;
  const actionsRequired = inputs.filter(i=>i.actionRequired).length;
  const openActions   = actions.filter(a=>a.status==='open'||a.status==='in-progress').length;
  const overdueActions = actions.filter(a=>a.status==='overdue').length;
  const closedActions = actions.filter(a=>a.status==='closed').length;

  return (
      <>
      <PageTitle title="Management Review" />
      <div className="space-y-5 py-4">
      {/* Overdue alert */}
      {overdueActions > 0 && (
        <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4 flex items-center gap-4">
          <span className="text-3xl">🚨</span>
          <div>
            <div className="text-red-200 font-bold text-sm">{overdueActions} Action{overdueActions>1?'s':''} OVERDUE — Immediate Escalation Required</div>
            <div className="text-red-700 text-xs mt-1">These must be reviewed at the start of every daily management meeting until closed.</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Green Inputs',   value:greens, sub:'No action needed', color:'text-emerald-600', bg:'border-emerald-200 bg-emerald-950/20' },
          { label:'Amber Inputs',   value:ambers, sub:'Monitor / action', color:'text-amber-600',   bg:'border-amber-800/30 bg-amber-950/20' },
          { label:'Red Inputs',     value:reds,   sub:'Critical — act now', color:'text-red-600',   bg:'border-red-800/40 bg-red-50' },
          { label:'Actions Overdue',value:overdueActions, sub:`${openActions} open total`, color:overdueActions>0?'text-red-600':'text-emerald-600', bg:overdueActions>0?'border-red-700/50 bg-red-50':'border-emerald-200 bg-emerald-950/20' },
        ].map(k=>(
          <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Input summary */}
      <div className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#dbeafe]">
          <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">MRM Inputs — Status at a Glance (IATF Cl. 9.3.2)</span>
        </div>
        <div className="divide-y divide-gray-200">
          {inputs.map(inp=>(
            <div key={inp.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.04]">
              <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${STATUS_DOT[inp.status]}`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#1e3a5f]">{inp.title}</span>
                  <span className="text-xs text-[#1e3a5f]">Cl. {inp.clause}</span>
                  <span className={`text-xs font-bold ml-auto ${TREND_COLOR[inp.trend]}`}>{TREND_ICON[inp.trend]} {inp.trend}</span>
                </div>
                <div className="text-xs text-[#1e3a5f] mt-0.5 truncate">{inp.data}</div>
              </div>
              {inp.actionRequired && (
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold shrink-0">Action</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Previous actions summary */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Previous MRM Actions — Closure Status</div>
        <div className="flex gap-4 mb-4">
          {[
            {label:'Closed', count:closedActions, color:'text-emerald-600'},
            {label:'In Progress', count:actions.filter(a=>a.status==='in-progress').length, color:'text-amber-600'},
            {label:'Open', count:actions.filter(a=>a.status==='open').length, color:'text-blue-600'},
            {label:'Overdue', count:overdueActions, color:'text-red-600'},
          ].map(s=>(
            <div key={s.label} className="text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-[#1e3a5f]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="w-full bg-[#f0f9ff]/30 rounded-full h-3 flex overflow-hidden">
          {closedActions>0 && <div className="bg-emerald-500 h-3" style={{width:`${closedActions/actions.length*100}%`}}/>}
          {actions.filter(a=>a.status==='in-progress').length>0 && <div className="bg-amber-500 h-3" style={{width:`${actions.filter(a=>a.status==='in-progress').length/actions.length*100}%`}}/>}
          {actions.filter(a=>a.status==='open').length>0 && <div className="bg-blue-500 h-3" style={{width:`${actions.filter(a=>a.status==='open').length/actions.length*100}%`}}/>}
          {overdueActions>0 && <div className="bg-red-500 h-3" style={{width:`${overdueActions/actions.length*100}%`}}/>}
        </div>
      </div>
    </div>
      </>
  );
}

// -- Agenda Builder ------------------------------------------------------------
function AgendaBuilder({ inputs }: { inputs: MRMInput[] }) {
  const [chair, setChair]   = useState('Quality Head / Plant Director');
  const [venue, setVenue]   = useState('Conference Room A');
  const [date, setDate]     = useState('2026-10-15');
  const [time, setTime]     = useState('10:00 AM');
  const [selected, setSelected] = useState<string[]>(inputs.map(i=>i.id));
  const [generated, setGenerated] = useState(false);

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);

  const selectedInputs = inputs.filter(i=>selected.includes(i.id));

  return (
    <div className="space-y-4 py-4">
      {/* Meeting setup */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Meeting Details</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {label:'Date', value:date, setter:setDate, type:'date'},
            {label:'Time', value:time, setter:setTime, type:'text'},
            {label:'Chairperson', value:chair, setter:setChair, type:'text'},
            {label:'Venue', value:venue, setter:setVenue, type:'text'},
          ].map(f=>(
            <div key={f.label}>
              <label className="block text-xs text-[#1e3a5f] mb-1">{f.label}</label>
              <input type={f.type} value={f.value} onChange={e=>f.setter(e.target.value)}
                className="w-full bg-[#f0f9ff]/30 border border-[#dbeafe] text-[#1e3a5f] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"/>
            </div>
          ))}
        </div>
      </div>

      {/* Input selector */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Select Agenda Items (IATF Cl. 9.3.2 Inputs)</div>
        <div className="space-y-2">
          {inputs.map((inp,i)=>(
            <label key={inp.id} className="flex items-start gap-3 cursor-pointer hover:bg-[#dbeafe]/40 rounded-lg p-2">
              <input type="checkbox" checked={selected.includes(inp.id)} onChange={()=>toggle(inp.id)}
                className="mt-0.5 accent-indigo-500"/>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1e3a5f]">#{i+1} — {inp.title}</span>
                  <span className="text-xs text-[#1e3a5f]">Cl. {inp.clause}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[inp.status]}`}/>
                  {inp.actionRequired && <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">Action Required</span>}
                </div>
                <div className="text-xs text-[#1e3a5f] mt-0.5">{inp.data}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button onClick={()=>setGenerated(true)}
        className="w-full py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition">
        📋 Generate MRM Agenda & Minutes Template
      </button>

      {/* Generated agenda */}
      {generated && (
        <div className="flex justify-end mb-2">
          <ExportPDF
            targetId="mrm-minutes-print"
            label="Export Minutes PDF"
            filename={`MRM_Minutes_${date.replace(/\//g,'-')}`}
            color="#4338ca"
            size="sm"
          />
        </div>
      )}
      {generated && (
        <div id="mrm-minutes-print" className="bg-[#eff6ff] border border-indigo-700/50 rounded-xl p-6 font-mono text-xs text-[#1e3a5f] leading-relaxed whitespace-pre-wrap">
{`MANAGEMENT REVIEW MEETING — AGENDA & MINUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date     : ${date}          Time    : ${time}
Venue    : ${venue}
Chair    : ${chair}
Standard : IATF 16949:2016 — Clause 9.3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATTENDEES
---------
Name                    Designation           Sign
________________________ _____________________ _____
________________________ _____________________ _____
________________________ _____________________ _____
________________________ _____________________ _____

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENDA ITEMS (INPUTS — Cl. 9.3.2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${selectedInputs.map((inp,i)=>`
${String(i+1).padStart(2,'0')}. ${inp.title.toUpperCase()} (Cl. ${inp.clause})
    Status  : ${inp.status.toUpperCase()} ${inp.status==='red'?'🔴':inp.status==='amber'?'🟡':'🟢'}
    Data    : ${inp.data}
    Summary : ${inp.summary}
    Trend   : ${TREND_ICON[inp.trend]} ${inp.trend.toUpperCase()}
    ${inp.actionRequired?'⚠️  ACTION REQUIRED':'✅  No action required'}

    Discussion Notes:
    ___________________________________________________________
    ___________________________________________________________

    Action / Decision:
    ___________________________________________________________
`).join('')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUTS (Cl. 9.3.3) — DECISIONS & ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action  Owner                  Target Date    Status
------- ---------------------  -------------  ------
_______ _____________________ _____________ _______
_______ _____________________ _____________ _______
_______ ___________________-- _____________ _______
_______ ___------------------ _____________ _______

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT REVIEW DATE: _______________________
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chairperson Signature: ___________________

Minutes Prepared by  : ___________________
Date of Issue        : ___________________
`}
        </div>
      )}
    </div>
  );
}

// -- Action Tracker ------------------------------------------------------------
function ActionTracker({ actions, setActions }: { actions: MRMAction[]; setActions: (a: MRMAction[]) => void }) {
  const [form, setForm] = useState<Partial<MRMAction>>({});
  const [adding, setAdding] = useState(false);

  const updateStatus = (id: string, status: ActionStatus) =>
    setActions(actions.map(a=>a.id===id?{...a,status}:a));

  const addAction = () => {
    if (!form.action||!form.owner||!form.targetDate) return;
    setActions([...actions, {
      id:`A-${String(actions.length+1).padStart(3,'0')}`,
      source: form.source||'MRM',
      action: form.action||'',
      owner: form.owner||'',
      targetDate: form.targetDate||'',
      status:'open', closureNote:'',
    }]);
    setForm({}); setAdding(false);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">MRM Action Tracker</span>
        <button onClick={()=>setAdding(!adding)}
          className="text-xs px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-semibold">
          + Add Action
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-indigo-700/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-indigo-700 mb-2">New Action</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {key:'source', label:'Source / Input', placeholder:'e.g. Customer Satisfaction'},
              {key:'action', label:'Action Description', placeholder:'Describe the action clearly'},
              {key:'owner', label:'Owner', placeholder:'Name / Department'},
              {key:'targetDate', label:'Target Date', placeholder:'YYYY-MM-DD'},
            ].map(f=>(
              <div key={f.key}>
                <label className="block text-xs text-[#1e3a5f] mb-1">{f.label}</label>
                <input value={(form as Record<string,string>)[f.key]||''} placeholder={f.placeholder}
                  onChange={e=>setForm({...form,[f.key]:e.target.value})}
                  className="w-full bg-[#f0f9ff]/30 border border-[#dbeafe] text-[#1e3a5f] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"/>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addAction} className="text-xs px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold">Save Action</button>
            <button onClick={()=>setAdding(false)} className="text-xs px-4 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {actions.map(a=>(
        <div key={a.id} className={`bg-white border rounded-xl p-4 ${a.status==='overdue'?'border-red-600':'border-[#dbeafe]'}`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs text-[#1e3a5f]">{a.id}</span>
                <span className="text-xs bg-[#f0f9ff]/30 text-[#1e3a5f] px-2 py-0.5 rounded">{a.source}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${ACT_STYLE[a.status]}`}>{a.status.replace('-',' ')}</span>
              </div>
              <p className="text-sm text-white font-semibold">{a.action}</p>
              <div className="flex gap-4 mt-1 text-xs text-[#1e3a5f]">
                <span>Owner: <span className="text-[#1e3a5f]">{a.owner}</span></span>
                <span>Due: <span className={a.status==='overdue'?'text-red-600 font-bold':'text-[#1e3a5f]'}>{a.targetDate}</span></span>
              </div>
              {a.closureNote && (
                <div className="mt-2 text-xs text-[#15803d] bg-emerald-50 rounded px-2 py-1">{a.closureNote}</div>
              )}
            </div>
            {a.status!=='closed' && (
              <div className="flex gap-1.5 shrink-0 flex-wrap">
                {a.status==='open' && <button onClick={()=>updateStatus(a.id,'in-progress')} className="text-xs px-2 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded font-semibold">Start</button>}
                {(a.status==='in-progress'||a.status==='overdue') && <button onClick={()=>updateStatus(a.id,'closed')} className="text-xs px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-semibold">Close</button>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// -- MRM Auto-Report HTML generator -------------------------------------------
function buildMRMReportHTML(data: {
  generatedAt: string; period: string;
  complaints: { total:number; open:number; closed:number; critical:number; capaInProgress:number; pendingClosure:number; ppm:number; closureRate:number; byStatus:Record<string,number>; bySeverity:Record<string,number> };
  sla: { total:number; breached:number; warning:number; on_track:number; breachedItems:{complaint_number:string;customer_name:string;severity:string;daysOpen:number}[] };
  approvals: { pending:number; approvedLast30d:number };
  pareto: {category:string;count:number}[];
  trend: {month:string;ppm:number;count:number}[];
  recentOpen: {complaint_number:string;customer_name:string;severity:string;status:string;daysOpen:number}[];
  topCustomers: {name:string;count:number}[];
}) {
  const { complaints: c, sla, approvals, pareto, trend, recentOpen, topCustomers } = data;
  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const now = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const ppmColor = c.ppm < 100 ? '#16a34a' : c.ppm < 300 ? '#d97706' : '#dc2626';
  const slaColor = sla.breached === 0 ? '#16a34a' : sla.breached < 3 ? '#d97706' : '#dc2626';
  const sevColors: Record<string,string> = { Critical:'#dc2626', High:'#d97706', Medium:'#2563eb', Low:'#16a34a' };

  const rows = (arr: {complaint_number:string;customer_name:string;severity:string;status:string;daysOpen:number}[]) =>
    arr.map(r => `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-family:monospace;font-size:12px">${r.complaint_number}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${r.customer_name}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9"><span style="background:${sevColors[r.severity]||'#6b7280'}22;color:${sevColors[r.severity]||'#6b7280'};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${r.severity}</span></td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${r.status}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;color:${r.daysOpen>30?'#dc2626':r.daysOpen>14?'#d97706':'#374151'};font-weight:${r.daysOpen>14?'600':'400'}">${r.daysOpen}d</td>
    </tr>`).join('');

  const trendBars = trend.map(t => {
    const h = Math.max(4, Math.min(80, (t.ppm / 500) * 80));
    const col = t.ppm < 100 ? '#16a34a' : t.ppm < 300 ? '#f59e0b' : '#ef4444';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
      <div style="font-size:10px;color:#6b7280;font-weight:600">${t.ppm}</div>
      <div style="width:100%;background:${col};height:${h}px;border-radius:4px 4px 0 0"></div>
      <div style="font-size:10px;color:#9ca3af">${t.month.slice(5)}</div>
    </div>`;
  }).join('');

  const paretoRows = pareto.map((p,i) => `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${i+1}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${p.category||'—'}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:600">${p.count}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9"><div style="background:#e0e7ff;border-radius:4px;height:14px"><div style="background:#4f46e5;border-radius:4px;height:14px;width:${Math.round((p.count/(pareto[0]?.count||1))*100)}%"></div></div></td>
  </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>MRM Auto-Report — ${data.period}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f8fafc; color:#1e293b; }
  @media print {
    body { background:white; }
    .no-print { display:none !important; }
    .page-break { page-break-before:always; }
  }
  .container { max-width:1000px; margin:0 auto; padding:32px 24px; }
  .card { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#f8fafc; padding:8px 10px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#64748b; border-bottom:2px solid #e2e8f0; }
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;border-radius:16px;padding:28px 32px;margin-bottom:24px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:6px">TM Automotive Seating Systems — IATF 16949 Cl. 9.3</div>
        <h1 style="font-size:26px;font-weight:800;margin-bottom:4px">Management Review Report</h1>
        <div style="font-size:15px;opacity:.85">${data.period} · Generated on ${now}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;opacity:.65;margin-bottom:4px">Quality Head Agents — QMOS</div>
        <div style="font-size:11px;opacity:.65">Generated: ${fmt(data.generatedAt)}</div>
        <button class="no-print" onclick="window.print()" style="margin-top:12px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:white;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px">🖨️ Print / Save PDF</button>
      </div>
    </div>
  </div>

  <!-- KPI Summary -->
  <div class="card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px">📊 Executive KPI Summary — Cl. 9.3.2</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
      ${[
        { label:'Total Complaints', value: c.total, color:'#1e3a5f' },
        { label:'Open', value: c.open, color: c.open>5?'#dc2626':c.open>2?'#d97706':'#16a34a' },
        { label:'Critical Open', value: c.critical, color: c.critical>0?'#dc2626':'#16a34a' },
        { label:'Customer PPM', value: c.ppm, color: ppmColor },
        { label:'Closure Rate', value: c.closureRate+'%', color: c.closureRate<70?'#dc2626':c.closureRate<85?'#d97706':'#16a34a' },
        { label:'SLA Breached', value: sla.breached, color: slaColor },
        { label:'Pending Approval', value: approvals.pending, color: approvals.pending>3?'#d97706':'#1e3a5f' },
        { label:'Closed Last 30d', value: approvals.approvedLast30d, color:'#16a34a' },
      ].map(k=>`<div style="background:#f8fafc;border-radius:10px;padding:14px 12px;text-align:center;border:1px solid #e2e8f0">
        <div style="font-size:24px;font-weight:800;color:${k.color}">${k.value}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">${k.label}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- PPM Trend (6 months) -->
  <div class="card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px">📈 PPM Trend — Last 6 Months</div>
    <div style="display:flex;align-items:flex-end;gap:6px;height:110px;border-bottom:2px solid #e2e8f0;padding-bottom:0">
      ${trendBars}
    </div>
    <div style="margin-top:10px;font-size:11px;color:#94a3b8">Target PPM: &lt;100 &nbsp;|&nbsp; Current: <strong style="color:${ppmColor}">${c.ppm}</strong></div>
  </div>

  <!-- Open Complaints -->
  <div class="card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px">⚠️ Open Complaints — Action Required (Cl. 9.3.2g)</div>
    ${recentOpen.length === 0
      ? '<div style="color:#16a34a;font-size:13px;text-align:center;padding:20px">✅ No open complaints — excellent quality performance!</div>'
      : `<table><thead><tr><th>Complaint #</th><th>Customer</th><th>Severity</th><th>Status</th><th>Days Open</th></tr></thead><tbody>${rows(recentOpen)}</tbody></table>`
    }
  </div>

  <!-- SLA Status -->
  <div class="card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px">⏱️ SLA Status — IATF §10.2.3</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:${sla.breachedItems.length>0?'16px':'0'}">
      ${[
        { label:'Total Open', v: sla.total, col:'#1e3a5f' },
        { label:'SLA Breached', v: sla.breached, col: sla.breached>0?'#dc2626':'#16a34a' },
        { label:'Warning ≤25%', v: sla.warning, col: sla.warning>0?'#d97706':'#16a34a' },
        { label:'On Track', v: sla.on_track, col:'#16a34a' },
      ].map(s=>`<div style="background:#f8fafc;border-radius:8px;padding:12px;text-align:center;border:1px solid #e2e8f0">
        <div style="font-size:22px;font-weight:800;color:${s.col}">${s.v}</div>
        <div style="font-size:11px;color:#64748b;margin-top:3px">${s.label}</div>
      </div>`).join('')}
    </div>
    ${sla.breachedItems.length > 0 ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px">
      <div style="font-size:12px;font-weight:700;color:#991b1b;margin-bottom:8px">🔴 Immediate Action Required — SLA Breached</div>
      ${sla.breachedItems.map(b=>`<div style="font-size:12px;color:#7f1d1d;padding:4px 0;border-bottom:1px solid #fecaca">${b.complaint_number} · ${b.customer_name} · <strong>${b.severity}</strong> · ${b.daysOpen} days open</div>`).join('')}
    </div>` : ''}
  </div>

  <!-- Pareto + Customer Breakdown side by side -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
    <div class="card" style="margin-bottom:0">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px">📊 Top Defect Categories (Pareto)</div>
      ${pareto.length === 0
        ? '<div style="color:#94a3b8;font-size:13px;text-align:center;padding:20px">No defect category data</div>'
        : `<table><thead><tr><th>#</th><th>Category</th><th style="text-align:right">Count</th><th>Share</th></tr></thead><tbody>${paretoRows}</tbody></table>`
      }
    </div>
    <div class="card" style="margin-bottom:0">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px">🏭 Top Customers by Open Complaints</div>
      ${topCustomers.length === 0
        ? '<div style="color:#16a34a;font-size:13px;text-align:center;padding:20px">No open complaints by customer</div>'
        : topCustomers.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9">
            <span style="font-size:13px">${t.name}</span>
            <span style="font-size:13px;font-weight:700;color:#1e3a5f">${t.count}</span>
          </div>`).join('')
      }
    </div>
  </div>

  <!-- Mandatory IATF Checklist -->
  <div class="card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px">✅ IATF Cl. 9.3.3 — Mandatory Output Checklist</div>
    ${[
      { item:'All mandatory Cl. 9.3.2 inputs reviewed and documented', done: true },
      { item:'Opportunities for improvement identified and assigned with owner + date', done: true },
      { item:'QMS changes required — identified and documented', done: true },
      { item:'Resource needs reviewed and approved', done: true },
      { item:'Action plan for every red/amber input with named owner and target date', done: (c.critical > 0 || sla.breached > 0) },
      { item:'Quality objectives performance reviewed (PPM, FTT, COPQ, OTD)', done: true },
      { item:'Customer satisfaction and complaints reviewed (Cl. 9.1.2)', done: true },
      { item:'Supplier performance reviewed — SCARs and ratings (Cl. 8.4)', done: true },
      { item:'Internal audit results and NC closure reviewed (Cl. 9.2)', done: true },
      { item:'Next Management Review date confirmed and communicated', done: true },
      { item:'Minutes to be signed by chairperson (Plant Head / Quality Director)', done: false },
      { item:'Minutes to be distributed to all attendees within 48 hours', done: false },
    ].map(ch=>`<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f8fafc">
      <span style="font-size:16px">${ch.done?'✅':'⬜'}</span>
      <span style="font-size:12px;color:${ch.done?'#1e293b':'#94a3b8'}">${ch.item}</span>
    </div>`).join('')}
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:16px;color:#94a3b8;font-size:11px">
    QMOS — Quality Head Agents · Auto-generated MRM Report · ${now} · IATF 16949 Cl. 9.3 Compliant<br>
    <em>This report is auto-generated from live QMOS data. Verify all figures before presenting at MRM.</em>
  </div>

</div>
</body></html>`;
}

// -- Outputs Tab ---------------------------------------------------------------
function OutputsTab({ inputs, actions }: { inputs: MRMInput[]; actions: MRMAction[] }) {
  const redInputs   = inputs.filter(i=>i.status==='red');
  const amberInputs = inputs.filter(i=>i.status==='amber'&&i.actionRequired);
  const overdue     = actions.filter(a=>a.status==='overdue');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');

  async function generateReport() {
    setGenerating(true);
    setGenError('');
    try {
      const data = await fetch('/api/mrm-report').then(r => r.json());
      if (data.error) throw new Error(data.error);
      const html = buildMRMReportHTML(data);
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
      else setGenError('Pop-up blocked — please allow pop-ups for this site.');
    } catch (e) {
      setGenError((e as Error).message || 'Failed to generate report');
    } finally { setGenerating(false); }
  }

  return (
    <div className="space-y-5 py-4">
      {/* -- Auto-Generate Button -- */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/30 border border-indigo-700/50 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white mb-1">🤖 Auto-Generate MRM Report</div>
            <div className="text-xs text-indigo-300">Pulls live QMOS data — complaints, PPM, SLA, approvals — and builds a print-ready IATF Cl. 9.3 report in one click.</div>
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="shrink-0 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: generating ? '#374151' : 'linear-gradient(135deg,#4f46e5,#2563eb)', color: 'white' }}
          >
            {generating ? '⏳ Generating...' : '📄 Generate Report'}
          </button>
        </div>
        {genError && <div className="mt-3 text-xs text-red-600 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">{genError}</div>}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-indigo-400">
          <span>✅ Live complaints data</span>
          <span>✅ SLA breach analysis</span>
          <span>✅ PPM 6-month trend</span>
          <span>✅ Pareto of defects</span>
          <span>✅ IATF Cl. 9.3.3 checklist</span>
          <span>✅ Print / PDF ready</span>
        </div>
      </div>

      {/* Auto-generated outputs */}
      <div className="bg-indigo-50 border border-indigo-700/40 rounded-xl p-5">
        <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-4">📋 MRM Outputs — Current Meeting (Cl. 9.3.3)</div>
        <div className="space-y-2">
          {MRM_OUTPUTS.map((o,i)=>(
            <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3">
              <span className="text-indigo-400 font-bold text-xs w-4 shrink-0">{i+1}.</span>
              <p className="text-xs text-[#1e3a5f]">{o}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What MUST be output — IATF checklist */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">IATF Cl. 9.3.3 — Mandatory Output Checklist</div>
        {[
          { item:'Opportunities for improvement identified and assigned', done:true },
          { item:'Any need for changes to the quality management system', done:true },
          { item:'Resource needs identified and approved', done:true },
          { item:'Quality policy / objectives reviewed and updated if needed', done:false },
          { item:'Action plan with owner and target date for every red/amber input', done:redInputs.length>0||amberInputs.length>0 },
          { item:'Next Management Review date confirmed', done:true },
          { item:'Minutes signed by chairperson', done:false },
          { item:'Minutes distributed within 48 hours', done:false },
        ].map((c,i)=>(
          <div key={i} className="overflow-x-auto flex items-center gap-3 py-2 border-b border-[#dbeafe] last:border-0">
            <span className={`text-lg ${c.done?'text-emerald-600':'text-[#1e3a5f]'}`}>{c.done?'✅':'⬜'}</span>
            <span className={`text-xs ${c.done?'text-[#1e3a5f]':'text-[#1e3a5f]'}`}>{c.item}</span>
          </div>
        ))}
      </div>

      {/* Management Review Effectiveness */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">MRM Effectiveness — IATF Maturity Score</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'All inputs reviewed', score:100, target:100 },
            { label:'Action closure rate', score:Math.round(actions.filter(a=>a.status==='closed').length/Math.max(actions.length,1)*100), target:80 },
            { label:'Overdue actions',     score:overdue.length===0?100:50, target:100 },
            { label:'Red inputs resolved', score:redInputs.length===0?100:60, target:100 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-[#eff6ff] rounded-xl p-3 text-center">
                <div className="text-xs text-[#1e3a5f] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="mt-2 w-full bg-[#f0f9ff] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{width:`${Math.min(m.score,100)}%`,background:color}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -- IATF Guide ----------------------------------------------------------------
function MRMGuide() {
  const [open, setOpen] = useState<number|null>(0);
  const sections = [
    { title:'IATF 16949 Cl. 9.3.1 — Management Review General', content:'Top management shall review the organization\'s QMS at planned intervals to ensure its continuing suitability, adequacy, effectiveness, and alignment with the strategic direction. Management review is a mandatory IATF requirement — failure to conduct it or failure to have complete records is a major nonconformity. Minimum frequency: annual. Best practice: quarterly for IATF-certified sites. Records must be retained as documented information.' },
    { title:'IATF 16949 Cl. 9.3.2 — Management Review Inputs (Mandatory)', content:'The mandatory inputs are: (a) Status of actions from previous reviews, (b) Changes in external/internal issues, (c) Quality objectives performance, (d) Process performance / product conformity, (e) Customer satisfaction & feedback, (f) Supplier performance, (g) Audit results, (h) Nonconformities & CAPAs, (i) Monitoring & measurement results, (j) Warranty performance, (k) Customer scorecards, (l) Status of potential field failures, (m) Risk management review, (n) Compliance obligations. Missing even one mandatory input is a minor NC.' },
    { title:'IATF 16949 Cl. 9.3.3 — Management Review Outputs (Mandatory)', content:'Management review must produce documented decisions on: (a) Opportunities for improvement, (b) Any need for QMS changes, (c) Resource needs. Additionally for IATF: actions related to each agenda item must have owners and dates. Customer satisfaction improvement must be specifically addressed. Actions must be tracked to closure and reviewed at next MRM.' },
    { title:'Common Audit Findings — Management Review', content:'1. MRM conducted but no records of inputs / outputs maintained. 2. Not all mandatory Cl. 9.3.2 inputs covered — warranty data missing. 3. Actions from previous MRM not followed up — no closure evidence. 4. MRM only at top management level — not cascaded to relevant process owners. 5. Customer scorecard data not presented. 6. No frequency defined — MRM done ad-hoc only. 7. Minutes not signed by top management / chairperson. 8. Effectiveness of previous MRM actions not reviewed.' },
    { title:'Best Practice — Making MRM Effective', content:'Pre-MRM (1 week before): Collect all data from input owners. Prepare one-page summary per input. Identify red/amber items requiring management decision. During MRM: Chairperson to be Plant Head or Quality Director minimum. Review previous actions first — establish accountability. Focus discussion time on red/amber items. Ensure every action has a named owner and date before close. Post-MRM (within 48 hours): Circulate minutes for review. Enter all actions into action tracker. Schedule 30-day follow-up review for critical items.' },
  ];
  return (
    <div className="space-y-3 py-4">
      {sections.map((s,i)=>(
        <div key={i} className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
          <button className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.04]"
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
export default function ManagementReviewPage() {
  const [tab, setTab] = useState<'dashboard'|'agenda'|'actions'|'outputs'|'guide'>('dashboard');
  const [actions, setActions] = useState<MRMAction[]>(SAMPLE_ACTIONS);
  const [liveInputs, setLiveInputs] = useState<MRMInput[]>(MRM_INPUTS);
  const [liveLoaded, setLiveLoaded] = useState(false);

  // -- Pull live complaint data and update MRM inputs ------------------------
  useEffect(() => {
    (async () => {
      try {
        const [complaints, report] = await Promise.all([
          fetch('/api/complaints').then(r => r.json()),
          fetch('/api/reports').then(r => r.json()),
        ]);
        if (!Array.isArray(complaints)) return;

        const open = complaints.filter((c: {status:string}) => !['Closed','Cancelled'].includes(c.status)).length;
        const critical = complaints.filter((c: {severity:string;status:string}) => c.severity === 'Critical' && !['Closed','Cancelled'].includes(c.status)).length;
        const capaInProgress = complaints.filter((c: {status:string}) => c.status === 'CAPA In Progress').length;
        const pendingClosure = complaints.filter((c: {status:string}) => c.status === 'Pending Closure').length;
        const total = complaints.length;
        const closed = complaints.filter((c: {status:string}) => c.status === 'Closed').length;
        const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;
        const ppm = report?.ppm ?? 0;

        const slaBreached = complaints.filter((c: {severity:string;status:string;created_at:string}) => {
          if (['Closed','Cancelled'].includes(c.status)) return false;
          const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
          const limits: Record<string,number> = { Critical:7, High:14, Medium:30, Low:45 };
          return days > (limits[c.severity] ?? 30);
        }).length;

        const custStatus: InputStatus = critical > 0 ? 'red' : ppm > 200 ? 'amber' : open > 3 ? 'amber' : 'green';
        const capaStatus: InputStatus = slaBreached > 2 ? 'red' : capaInProgress > 5 ? 'amber' : 'green';

        setLiveInputs(prev => prev.map(inp => {
          if (inp.id === 'I-01') return {
            ...inp, status: custStatus,
            data: `PPM: ${ppm} (Target: <100) | Open Complaints: ${open} | Critical: ${critical} | OTD: N/A`,
            summary: `${open} open customer complaints. ${critical > 0 ? `${critical} critical requiring immediate action.` : 'No critical complaints.'} PPM: ${ppm}. Closure rate: ${closureRate}%.`,
            trend: ppm < 100 && open < 3 ? 'improving' : ppm > 300 ? 'deteriorating' : 'stable',
            actionRequired: critical > 0 || ppm > 100,
          };
          if (inp.id === 'I-04') return {
            ...inp, status: capaStatus,
            data: `CAPA In Progress: ${capaInProgress} | Pending Closure: ${pendingClosure} | SLA Breached: ${slaBreached} | Closure Rate: ${closureRate}%`,
            summary: `${capaInProgress} complaints in CAPA. ${slaBreached} have breached SLA targets. ${pendingClosure} pending Quality Head closure approval.`,
            trend: slaBreached > 3 ? 'deteriorating' : slaBreached > 0 ? 'stable' : 'improving',
            actionRequired: slaBreached > 0 || capaInProgress > 5,
          };
          return inp;
        }));
        setLiveLoaded(true);
      } catch { /* keep static data on error */ }
    })();
  }, []);

  const overdue = actions.filter(a=>a.status==='overdue').length;
  const redCount = liveInputs.filter(i=>i.status==='red').length;
  const openActions = actions.filter(a=>a.status==='open'||a.status==='in-progress').length;

  return (
    <RoleGuard minLevel={3} deniedMessage="Management Review is restricted to Quality Manager level and above.">
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">📋 Management Review</h1>
                {liveLoaded && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white animate-pulse">LIVE DATA</span>
                )}
              </div>
              <p className="text-indigo-700 text-sm mt-1">MRM inputs · Agenda builder · Action tracker · Minutes generator — IATF Cl. 9.3</p>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <div className="bg-indigo-900/30/40 border border-indigo-700/40 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{liveInputs.length}</div>
                <div className="text-xs text-indigo-300">Inputs</div>
              </div>
              {redCount>0 && (
                <div className="bg-red-50 border border-red-700/40 rounded-xl px-4 py-2">
                  <div className="text-xl font-bold text-red-700">{redCount}</div>
                  <div className="text-xs text-[#1e3a5f]">Red Items</div>
                </div>
              )}
              <div className={`border rounded-xl px-4 py-2 ${overdue>0?'bg-red-50 border-red-700/40':'bg-emerald-50/30 border-emerald-200'}`}>
                <div className={`text-xl font-bold ${overdue>0?'text-red-700':'text-emerald-700'}`}>{overdue}</div>
                <div className="text-xs text-[#1e3a5f]">Overdue</div>
              </div>
              <div className="bg-indigo-900/30/40 border border-indigo-700/40 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{openActions}</div>
                <div className="text-xs text-indigo-300">Open Actions</div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'agenda',    label:'📝 Agenda Builder'},
              {id:'actions',   label:'✅ Action Tracker'},
              {id:'outputs',   label:'📤 Outputs'},
              {id:'guide',     label:'📘 IATF Guide'},
            ] as const).map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex-shrink-0 ${tab===t.id?'bg-white text-[#1d4ed8] border-b-2 border-[#1d4ed8]':'text-[#1e3a5f] hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        {/* Downloads */}
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl my-4" style={{background:'#f1f5f9'}}>
          <span className="text-[#1e3a5f] text-xs font-bold mr-1">📥 Downloads:</span>
          {[
            {label:'MRM Agenda Template',     href:'/downloads/mrm/MRM_Agenda_Template.docx',    color:'#4338ca'},
            {label:'MRM Minutes Template',    href:'/downloads/mrm/MRM_Minutes_Template.docx',   color:'#1d4ed8'},
            {label:'Action Tracker',          href:'/downloads/mrm/MRM_Action_Tracker.xlsx',     color:'#059669'},
            {label:'Input Summary Report',    href:'/downloads/mrm/MRM_Input_Summary.xlsx',      color:'#b45309'},
            {label:'MRM Checklist (IATF)',    href:'/downloads/mrm/MRM_IATF_Checklist.xlsx',     color:'#dc2626'},
          ].map(f=>(
            <span key={f.label} className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:f.color}}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110">{f.label}</a>
              <a href={f.href} download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110">⬇</a>
            </span>
          ))}
        </div>

        {tab==='dashboard' && <MRMDashboard inputs={liveInputs} actions={actions} />}
        {tab==='agenda'    && <AgendaBuilder inputs={liveInputs} />}
        {tab==='actions'   && <ActionTracker actions={actions} setActions={setActions} />}
        {tab==='outputs'   && <OutputsTab inputs={liveInputs} actions={actions} />}
        {tab==='guide'     && <MRMGuide />}
      </div>

      <QualityCopilot page="managerial" />
    </div>
    </RoleGuard>
  );
}
