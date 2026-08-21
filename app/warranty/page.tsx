'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';
import LiveKPIBanner from '../components/LiveKPIBanner';

// -- Types ---------------------------------------------------------------------
type ClaimStatus   = 'open'|'under-analysis'|'closed'|'rejected';
type FailureSeverity = 'critical'|'major'|'minor';
type ClaimType     = 'warranty'|'goodwill'|'recall'|'field-return';

interface WarrantyClaim {
  id: string;
  date: string;
  customer: string;
  partNumber: string;
  partName: string;
  vehicleModel: string;
  failureMode: string;
  failureDescription: string;
  claimType: ClaimType;
  severity: FailureSeverity;
  qtyReturned: number;
  qtySold: number;       // for R/1000
  warrantyCost: number;  // INR
  rootCause: string;
  correctiveAction: string;
  status: ClaimStatus;
  targetDate: string;
  closureDate: string;
  capaRaised: boolean;
  engineeringChange: boolean;
  notes: string;
}

// -- Sample Data ---------------------------------------------------------------
const SAMPLE_CLAIMS: WarrantyClaim[] = [
  { id:'WC-001', date:'2026-05-12', customer:'Tata Motors Ltd.', partNumber:'BKT-A001', partName:'Mounting Bracket', vehicleModel:'Tata Nexon', failureMode:'Dimensional OOT', failureDescription:'Bracket hole position shifted — causes fitment issue at vehicle assembly', claimType:'warranty', severity:'major', qtyReturned:48, qtySold:1200, warrantyCost:86400, rootCause:'Tool wear not detected — no SPC monitoring on Op-20', correctiveAction:'SPC chart implemented on Op-20. Tool change frequency reduced from 5000 to 3000 shots.', status:'closed', targetDate:'2026-06-10', closureDate:'2026-06-08', capaRaised:true, engineeringChange:false, notes:'PPAP updated with new tool change frequency' },
  { id:'WC-002', date:'2026-06-01', customer:'Maruti Suzuki', partNumber:'SHL-B032', partName:'Shield Panel', vehicleModel:'Maruti Baleno', failureMode:'Surface Crack', failureDescription:'Hairline cracks on surface after 6-month field usage — heat stress suspected', claimType:'warranty', severity:'critical', qtyReturned:23, qtySold:800, warrantyCost:138000, rootCause:'Material heat treatment specification not verified at incoming inspection', correctiveAction:'Heat treatment certificate mandatory with each lot. IQC checklist updated.', status:'under-analysis', targetDate:'2026-07-15', closureDate:'', capaRaised:true, engineeringChange:true, notes:'Customer requested 100% inspection on next 3 months supply' },
  { id:'WC-003', date:'2026-06-18', customer:'Mahindra & Mahindra', partNumber:'HSG-C017', partName:'Housing Body', vehicleModel:'Mahindra XUV700', failureMode:'Porosity / Void', failureDescription:'Internal voids detected after field failure — casting quality issue', claimType:'field-return', severity:'critical', qtyReturned:12, qtySold:600, warrantyCost:72000, rootCause:'Casting process parameters drifted — pressure and temperature not controlled', correctiveAction:'Process parameters locked on casting machine. Control plan updated with X-Ray inspection sampling.', status:'open', targetDate:'2026-07-30', closureDate:'', capaRaised:true, engineeringChange:false, notes:'Customer escalated to supplier quality team' },
  { id:'WC-004', date:'2026-07-02', customer:'Toyota Kirloskar', partNumber:'BKT-A001', partName:'Mounting Bracket', vehicleModel:'Toyota Innova', failureMode:'Burr on Edge', failureDescription:'Sharp burr on flange edge causing assembly line injury concern', claimType:'goodwill', severity:'minor', qtyReturned:150, qtySold:2000, warrantyCost:45000, rootCause:'De-burring station skipped during high production week', correctiveAction:'De-burr operation added to 100% final check. Poka-yoke installed.', status:'closed', targetDate:'2026-07-20', closureDate:'2026-07-18', capaRaised:false, engineeringChange:false, notes:'Goodwill credit note issued' },
  { id:'WC-005', date:'2026-07-20', customer:'Tata Motors Ltd.', partNumber:'PLT-D044', partName:'Plate Assembly', vehicleModel:'Tata Safari', failureMode:'Wrong Material', failureDescription:'Material grade mismatch — tensile strength below specification in field usage', claimType:'recall', severity:'critical', qtyReturned:80, qtySold:500, warrantyCost:320000, rootCause:'Supplier substituted material grade without intimation — 4M change not raised', correctiveAction:'Supplier audit conducted. SCAR raised. Material test certificate mandatory for each lot.', status:'open', targetDate:'2026-08-15', closureDate:'', capaRaised:true, engineeringChange:true, notes:'RECALL NOTICE issued. All field units being inspected.' },
  { id:'WC-006', date:'2026-08-01', customer:'Maruti Suzuki', partNumber:'KNB-F011', partName:'Knob Assembly', vehicleModel:'Maruti Ertiga', failureMode:'Paint Peeling', failureDescription:'Paint peeling on knob surface after 3 months — adhesion failure', claimType:'warranty', severity:'minor', qtyReturned:220, qtySold:3000, warrantyCost:33000, rootCause:'Pre-treatment bath contamination — pH went out of range undetected', correctiveAction:'pH monitoring frequency increased to every 2 hours. Control chart implemented.', status:'under-analysis', targetDate:'2026-08-25', closureDate:'', capaRaised:false, engineeringChange:false, notes:'Customer gave 30-day window for root cause' },
];

const MONTHLY_TREND = [
  { month:'Mar', claims:3, cost:125000, r1000:18 },
  { month:'Apr', claims:5, cost:198000, r1000:24 },
  { month:'May', claims:4, cost:156000, r1000:21 },
  { month:'Jun', claims:7, cost:290000, r1000:32 },
  { month:'Jul', claims:6, cost:435000, r1000:28 },
  { month:'Aug', claims:2, cost:33000,  r1000:12 },
];

const STATUS_COLORS: Record<ClaimStatus,string> = {
  'open':'bg-red-50 text-red-700',
  'under-analysis':'bg-[#eff6ff] text-[#1d4ed8]',
  'closed':'bg-emerald-50/50 text-emerald-700',
  'rejected':'bg-white text-[#1e3a5f]',
};
const SEV_COLORS: Record<FailureSeverity,string> = {
  critical:'bg-red-100 text-red-700', major:'bg-amber-100 text-amber-700', minor:'bg-blue-100 text-[#1d4ed8]'
};
const TYPE_COLORS: Record<ClaimType,string> = {
  warranty:'bg-purple-900/30 text-purple-300', goodwill:'bg-[#eff6ff] text-[#1d4ed8]',
  recall:'bg-red-900/70 text-red-200 font-bold', 'field-return':'bg-orange-900/30 text-orange-600',
};

// -- Dashboard -----------------------------------------------------------------
function WarrantyDashboard({ claims }: { claims: WarrantyClaim[] }) {
  const total       = claims.length;
  const open        = claims.filter(c=>c.status==='open'||c.status==='under-analysis').length;
  const closed      = claims.filter(c=>c.status==='closed').length;
  const recalls     = claims.filter(c=>c.claimType==='recall').length;
  const totalCost   = claims.reduce((s,c)=>s+c.warrantyCost,0);
  const totalRet    = claims.reduce((s,c)=>s+c.qtyReturned,0);
  const totalSold   = claims.reduce((s,c)=>s+c.qtySold,0);
  const r1000       = totalSold>0 ? Math.round((totalRet/totalSold)*1000) : 0;
  const closureRate = total>0 ? Math.round((closed/total)*100) : 0;
  const capaRate    = total>0 ? Math.round((claims.filter(c=>c.capaRaised).length/total)*100) : 0;

  // By customer
  const byCust: Record<string,{cost:number;cnt:number;ret:number;sold:number}> = {};
  claims.forEach(c=>{
    if(!byCust[c.customer]) byCust[c.customer]={cost:0,cnt:0,ret:0,sold:0};
    byCust[c.customer].cost+=c.warrantyCost; byCust[c.customer].cnt++;
    byCust[c.customer].ret+=c.qtyReturned; byCust[c.customer].sold+=c.qtySold;
  });
  const custRows = Object.entries(byCust).sort((a,b)=>b[1].cost-a[1].cost);

  // By failure mode
  const byFail: Record<string,number> = {};
  claims.forEach(c=>{ byFail[c.failureMode]=(byFail[c.failureMode]??0)+1; });
  const failPareto = Object.entries(byFail).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxFail = Math.max(...failPareto.map(f=>f[1]),1);

  const maxTrend = Math.max(...MONTHLY_TREND.map(t=>t.r1000),1);
  const maxCost  = Math.max(...MONTHLY_TREND.map(t=>t.cost),1);

  return (
      <>
      <PageTitle title="Warranty" />
      <div className="space-y-5 py-4">
      {/* -- Live Supabase KPI Banner ------------------------------------------- */}
      <LiveKPIBanner />
      {/* -- Sample Warranty KPIs (from claim register data) -------------------- */}
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'R/1000 (Field Return Rate)', value:r1000, sub:`${totalRet} returned / ${totalSold.toLocaleString()} sold`, color:r1000<=20?'text-emerald-600':r1000<=50?'text-amber-600':'text-red-600' },
          { label:'Total Warranty Cost',        value:`₹${(totalCost/1000).toFixed(1)}K`, sub:`${total} total claims`, color:totalCost<200000?'text-emerald-600':totalCost<500000?'text-amber-600':'text-red-600' },
          { label:'Open Claims',                value:open, sub:`${recalls} RECALL active`, color:open===0?'text-emerald-600':recalls>0?'text-red-600':'text-amber-600' },
          { label:'Claim Closure Rate',         value:`${closureRate}%`, sub:`CAPA raised: ${capaRate}%`, color:closureRate>=80?'text-emerald-600':closureRate>=60?'text-amber-600':'text-red-600' },
        ].map(k=>(
          <div key={k.label} className={`rounded-xl border p-4 ${recalls>0&&k.label==='Open Claims'?'border-red-300 bg-red-50':'border-purple-700/50 bg-purple-900/30/30'}`}>
            <div className="text-xs text-purple-700 mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-purple-400/70 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* RECALL BANNER */}
      {recalls>0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-center gap-4">
          <span className="text-3xl">🚨</span>
          <div>
            <div className="text-red-200 font-bold text-sm">{recalls} ACTIVE RECALL — Immediate Management Attention Required</div>
            <div className="text-red-700 text-xs mt-1">Field units being inspected. Customer notified. Engineering change in progress.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* R/1000 Trend */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">R/1000 Monthly Trend</div>
          <div className="flex items-end gap-2 h-32">
            {MONTHLY_TREND.map(t=>{
              const pct = Math.round((t.r1000/maxTrend)*100);
              const color = t.r1000<=20?'bg-emerald-500':t.r1000<=30?'bg-amber-500':'bg-red-500';
              return (
                <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-[#1e3a5f]">{t.r1000}</span>
                  <div className={`w-full rounded-t-md ${color}`} style={{height:`${pct}%`,minHeight:'6px'}} />
                  <span className="text-xs text-[#1e3a5f]">{t.month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-3 text-xs text-[#1e3a5f]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block"/>≤20 World Class</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block"/>21-30 Monitor</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block"/>&gt;30 Action</span>
          </div>
        </div>

        {/* Warranty Cost Trend */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Monthly Warranty Cost (₹)</div>
          <div className="flex items-end gap-2 h-32">
            {MONTHLY_TREND.map(t=>{
              const pct = Math.round((t.cost/maxCost)*100);
              return (
                <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-[#1e3a5f]">{(t.cost/1000).toFixed(0)}K</span>
                  <div className="w-full rounded-t-md bg-purple-600" style={{height:`${pct}%`,minHeight:'6px'}} />
                  <span className="text-xs text-[#1e3a5f]">{t.month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-[#1e3a5f]">6-month total: ₹{(MONTHLY_TREND.reduce((s,t)=>s+t.cost,0)/1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Customer */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Warranty Cost by Customer</div>
          {custRows.map(([name,v])=>{
            const custR1000=v.sold>0?Math.round((v.ret/v.sold)*1000):0;
            return (
              <div key={name} className="flex items-center gap-2 mb-3">
                <span className="flex-1 text-xs text-[#1e3a5f] truncate">{name}</span>
                <span className="text-xs text-[#1e3a5f]">{v.cnt} claims</span>
                <span className={`text-xs font-bold ${custR1000<=20?'text-emerald-600':custR1000<=40?'text-amber-600':'text-red-600'}`}>R/1000:{custR1000}</span>
                <span className="text-xs font-bold text-purple-700 w-16 text-right">₹{(v.cost/1000).toFixed(1)}K</span>
              </div>
            );
          })}
        </div>

        {/* Failure Mode Pareto */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Top Failure Modes (Pareto)</div>
          {failPareto.map(([mode,cnt],i)=>{
            const colors=['bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-lime-500'];
            return (
              <div key={mode} className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-[#1e3a5f] w-4">{i+1}</span>
                <span className="flex-1 text-xs text-[#1e3a5f] truncate">{mode}</span>
                <div className="w-24 bg-[#dbeafe] rounded-full h-2 shrink-0">
                  <div className={`${colors[i]} h-2 rounded-full`} style={{width:`${Math.round(cnt/maxFail*100)}%`}} />
                </div>
                <span className="text-xs font-bold text-[#1e3a5f] w-4 text-right">{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maturity */}
      <div className="bg-purple-900/30 border border-purple-900 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 Warranty Management Maturity — IATF Cl. 8.8 / 8.9</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'R/1000 Performance', score:r1000<=20?100:r1000<=30?75:r1000<=50?50:25, target:100 },
            { label:'Claim Closure Rate', score:closureRate, target:90 },
            { label:'CAPA Linkage Rate',  score:capaRate, target:80 },
            { label:'Recall Prevention',  score:recalls===0?100:50, target:100 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-purple-900/30/30 rounded-xl p-3 text-center">
                <div className="text-xs text-purple-700 mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-purple-400 mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-purple-900/30 rounded-full h-1.5">
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

// -- Claim Register ------------------------------------------------------------
function ClaimRegister({ claims, setClaims }: { claims:WarrantyClaim[]; setClaims:(c:WarrantyClaim[])=>void }) {
  const [filter, setFilter] = useState<'all'|ClaimStatus>('all');
  const [expanded, setExpanded] = useState<string|null>(null);
  const filtered = filter==='all' ? claims : claims.filter(c=>c.status===filter);

  const updateStatus = (id:string, status:ClaimStatus) =>
    setClaims(claims.map(c=>c.id===id?{...c,status}:c));

  return (
    <div className="space-y-4 py-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-[#1e3a5f] uppercase">Filter:</span>
        {(['all','open','under-analysis','closed','rejected'] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full font-semibold transition ${filter===f?'bg-purple-700 text-white':'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
            {f==='all'?`All (${claims.length})`:f==='open'?`Open (${claims.filter(c=>c.status==='open').length})`:f==='under-analysis'?`Analysing (${claims.filter(c=>c.status==='under-analysis').length})`:f==='closed'?`Closed (${claims.filter(c=>c.status==='closed').length})`:`Rejected (${claims.filter(c=>c.status==='rejected').length})`}
          </button>
        ))}
      </div>

      {filtered.length===0 && (
        <div className="text-center py-12 text-[#1e3a5f] text-sm">No claims found for this filter.</div>
      )}

      {filtered.map(c=>(
        <div key={c.id} className={`bg-white border rounded-xl overflow-hidden ${c.claimType==='recall'?'border-red-600':'border-[#dbeafe]'}`}>
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white"
            onClick={()=>setExpanded(expanded===c.id?null:c.id)}>
            <span className="font-mono text-xs text-[#1e3a5f]">{c.id}</span>
            <span className="text-xs text-[#1e3a5f]">{c.date}</span>
            <span className="font-semibold text-sm text-white flex-1">{c.partName} — {c.failureMode}</span>
            <span className="text-xs text-[#1e3a5f]">{c.customer}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${TYPE_COLORS[c.claimType]}`}>{c.claimType.toUpperCase()}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${SEV_COLORS[c.severity]}`}>{c.severity}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[c.status]}`}>{c.status.replace('-',' ')}</span>
            <span className="text-xs text-purple-700 font-bold">₹{c.warrantyCost.toLocaleString()}</span>
            <span className="text-[#1e3a5f] text-xs">{expanded===c.id?'▲':'▼'}</span>
          </div>

          {/* Expanded */}
          {expanded===c.id && (
            <div className="border-t border-[#dbeafe] px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  ['Part No.', c.partNumber], ['Vehicle Model', c.vehicleModel],
                  ['Qty Returned', c.qtyReturned], ['R/1000', c.qtySold>0?Math.round(c.qtyReturned/c.qtySold*1000):'-'],
                  ['Warranty Cost', `₹${c.warrantyCost.toLocaleString()}`], ['Target Date', c.targetDate||'—'],
                  ['CAPA Raised', c.capaRaised?'✅ Yes':'❌ No'], ['Eng. Change', c.engineeringChange?'✅ Yes':'—'],
                ].map(([label,val])=>(
                  <div key={label} className="bg-[#eff6ff] rounded-lg p-2">
                    <div className="text-[#1e3a5f] mb-0.5">{label}</div>
                    <div className="font-semibold text-[#1e3a5f]">{val}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-red-50 border border-red-900/30 rounded-lg p-3">
                  <div className="font-bold text-red-700 mb-1">Failure Description</div>
                  <p className="text-[#1e3a5f]">{c.failureDescription}</p>
                </div>
                <div className="bg-amber-50 border border-amber-900/30 rounded-lg p-3">
                  <div className="font-bold text-amber-700 mb-1">Root Cause</div>
                  <p className="text-[#1e3a5f]">{c.rootCause||'Under analysis...'}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="font-bold text-emerald-700 mb-1">Corrective Action</div>
                  <p className="text-[#1e3a5f]">{c.correctiveAction||'TBD'}</p>
                </div>
                {c.notes && (
                  <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-lg p-3">
                    <div className="font-bold text-[#1e3a5f] mb-1">Notes</div>
                    <p className="text-[#1e3a5f]">{c.notes}</p>
                  </div>
                )}
              </div>
              {c.status!=='closed' && (
                <div className="flex gap-2">
                  {c.status==='open' && <button onClick={()=>updateStatus(c.id,'under-analysis')} className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold">→ Start Analysis</button>}
                  {c.status==='under-analysis' && <button onClick={()=>updateStatus(c.id,'closed')} className="text-xs px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold">✓ Close Claim</button>}
                  <button onClick={()=>updateStatus(c.id,'rejected')} className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold">Reject</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Field Failure Analysis ----------------------------------------------------
function FieldFailureAnalysis({ claims }: { claims:WarrantyClaim[] }) {
  const totalCost = claims.reduce((s,c)=>s+c.warrantyCost,0);
  const byType: Record<string,{cost:number;cnt:number}> = {};
  claims.forEach(c=>{ if(!byType[c.claimType])byType[c.claimType]={cost:0,cnt:0};
    byType[c.claimType].cost+=c.warrantyCost; byType[c.claimType].cnt++; });

  const criticalClaims = claims.filter(c=>c.severity==='critical');
  const engineeringChanges = claims.filter(c=>c.engineeringChange).length;

  return (
    <div className="space-y-5 py-4">
      {/* Claim Type Cost Breakdown */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Warranty Cost by Claim Type</div>
        <div className="space-y-3">
          {Object.entries(byType).map(([type,v])=>(
            <div key={type}>
              <div className="flex justify-between text-xs mb-1">
                <span className={`font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[type as ClaimType]}`}>{type.toUpperCase()}</span>
                <span className="text-[#1e3a5f]">{v.cnt} claims · ₹{(v.cost/1000).toFixed(1)}K ({totalCost>0?Math.round(v.cost/totalCost*100):0}%)</span>
              </div>
              <div className="w-full bg-[#dbeafe] rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width:`${totalCost>0?Math.round(v.cost/totalCost*100):0}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Claims */}
      <div className="bg-red-50 border border-red-800/50 rounded-xl p-5">
        <div className="text-xs font-bold text-red-700 uppercase tracking-wide mb-4">🔴 Critical Claims — Immediate Action Required ({criticalClaims.length})</div>
        {criticalClaims.length===0
          ? <div className="text-xs text-[#15803d]">✅ No critical claims open.</div>
          : criticalClaims.map(c=>(
            <div key={c.id} className="bg-white border border-red-800/40 rounded-lg p-3 mb-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-xs text-red-600">{c.id}</span>
                <span className="font-bold text-sm text-white">{c.partName}</span>
                <span className="text-xs text-[#1e3a5f]">·</span>
                <span className="text-xs text-[#1e3a5f]">{c.customer}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[c.status]}`}>{c.status}</span>
              </div>
              <p className="text-xs text-[#1e3a5f] mb-2">{c.failureDescription}</p>
              <div className="flex gap-4 text-xs">
                <span className="text-red-600">₹{c.warrantyCost.toLocaleString()} cost</span>
                <span className="text-amber-600">R/1000: {c.qtySold>0?Math.round(c.qtyReturned/c.qtySold*1000):0}</span>
                <span className="text-[#1e3a5f]">Target: {c.targetDate||'TBD'}</span>
                <span className={c.capaRaised?'text-emerald-600':'text-red-600'}>{c.capaRaised?'✅ CAPA raised':'⚠️ No CAPA'}</span>
              </div>
            </div>
          ))
        }
      </div>

      {/* IATF Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label:'Engineering Changes Triggered', value:engineeringChanges, color:'text-amber-600' },
          { label:'CAPA Raised', value:claims.filter(c=>c.capaRaised).length, color:'text-blue-600' },
          { label:'Recall Events', value:claims.filter(c=>c.claimType==='recall').length, color:'text-red-600' },
          { label:'Total R/1000 (Cumulative)', value:claims.reduce((s,c)=>s+c.qtySold,0)>0?Math.round((claims.reduce((s,c)=>s+c.qtyReturned,0)/claims.reduce((s,c)=>s+c.qtySold,0))*1000):0, color:'text-purple-400' },
          { label:'Avg Cost per Claim', value:claims.length>0?`₹${Math.round(totalCost/claims.length).toLocaleString()}`:'—', color:'text-white' },
          { label:'Claims Requiring Eng. Change', value:`${engineeringChanges} / ${claims.length}`, color:'text-orange-600' },
        ].map(s=>(
          <div key={s.label} className="bg-white border border-[#dbeafe] rounded-xl p-4">
            <div className="text-xs text-[#1e3a5f] mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- IATF Warranty Guide -------------------------------------------------------
function WarrantyGuide() {
  const [open, setOpen] = useState<number|null>(0);
  const sections = [
    { title:'IATF 16949 Cl. 8.8 — Warranty Management System', content:'Organizations shall implement a warranty management system. If OEM-specified, use the prescribed warranty management process. Key requirements: warranty claim analysis, field failure data analysis, corrective action with verification, lessons learned cascade to new programs.' },
    { title:'IATF 16949 Cl. 8.9 — Customer Complaint and Field Failure Test Analysis', content:'Organizations shall conduct analysis on customer complaints and field failures including any returned parts. Analysis results shall be retained as documented information. Test results must be shared with customer and cascaded to product and process design.' },
    { title:'R/1000 Calculation — Industry Standard', content:'R/1000 = (Number of returned units / Number of units sold) × 1000. World Class: ≤10 R/1000 | Good: 11–25 R/1000 | Monitor: 26–50 R/1000 | Action Required: >50 R/1000. Calculate per customer, per part, per failure mode, and per month for trend analysis.' },
    { title:'Warranty Claim Processing — Step-by-Step', content:'Step 1: Receive customer warranty claim with failed part. Step 2: Log claim in system within 24 hours. Step 3: Contain: stop dispatch of suspect lots, 100% inspection. Step 4: Analyze returned part — physical examination, dimensional check, material verification. Step 5: Determine root cause — use 8D / 5-Why. Step 6: Implement corrective action. Step 7: Raise engineering change if design issue found. Step 8: Verify effectiveness. Step 9: Close claim with customer sign-off.' },
    { title:'Common Warranty Audit Findings (IATF)', content:'1. No documented warranty claim register maintained. 2. Warranty analysis not cascaded to FMEA / Control Plan. 3. R/1000 not tracked and reported to management. 4. Root cause analysis shallow — symptoms treated not causes. 5. No customer notification within agreed timeframe. 6. Engineering changes not re-PPAP approved. 7. Lessons learned not shared with new product development.' },
    { title:'Goodwill vs Warranty vs Recall — Difference', content:'WARRANTY: Defect covered under warranty period — supplier bears full cost. GOODWILL: Customer complaint outside warranty — supplier absorbs cost voluntarily to maintain relationship. RECALL: Safety-related field defect requiring retrieval of all field units — highest severity — customer and regulatory authority involved. Each has different cost codes, approval levels, and reporting requirements.' },
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
            <div className="px-5 pb-4 text-xs text-[#1e3a5f] leading-relaxed border-t border-[#dbeafe] pt-3">
              {s.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function WarrantyPage() {
  const [tab, setTab] = useState<'dashboard'|'claims'|'analysis'|'guide'>('dashboard');
  const [claims, setClaims] = useState<WarrantyClaim[]>(SAMPLE_CLAIMS);

  const total    = claims.length;
  const open     = claims.filter(c=>c.status==='open'||c.status==='under-analysis').length;
  const recalls  = claims.filter(c=>c.claimType==='recall').length;
  const totalCost= claims.reduce((s,c)=>s+c.warrantyCost,0);

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">🔧 Warranty & Field Failure</h1>
              <p className="text-purple-700 text-sm mt-1">Warranty claims · R/1000 tracking · Field failure analysis · Recall management — IATF Cl. 8.8 / 8.9</p>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <div className="bg-purple-900/30/40 border border-purple-700/40 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{total}</div>
                <div className="text-xs text-purple-300">Total Claims</div>
              </div>
              <div className={`border rounded-xl px-4 py-2 ${open>0?'bg-red-50 border-red-700/40':'bg-emerald-50/30 border-emerald-200'}`}>
                <div className={`text-xl font-bold ${open>0?'text-red-700':'text-emerald-700'}`}>{open}</div>
                <div className="text-xs text-[#1e3a5f]">Open Claims</div>
              </div>
              {recalls>0 && (
                <div className="bg-red-800/60 border-2 border-red-500 rounded-xl px-4 py-2">
                  <div className="text-xl font-bold text-red-200">🚨 {recalls}</div>
                  <div className="text-xs text-red-700">RECALL Active</div>
                </div>
              )}
              <div className="bg-purple-900/30/40 border border-purple-700/40 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-purple-200">₹{(totalCost/1000).toFixed(0)}K</div>
                <div className="text-xs text-purple-300">Warranty Cost</div>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'claims',    label:'📋 Claim Register'},
              {id:'analysis',  label:'📈 Field Failure Analysis'},
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

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        {/* Download Strip */}
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl my-4" style={{background:'#f1f5f9'}}>
          <span className="text-[#1e3a5f] text-xs font-bold mr-1">📥 Downloads:</span>
          {[
            {label:'Warranty Claim Log',      href:'/downloads/warranty/Warranty_Claim_Log.xlsx',      color:'#7c3aed'},
            {label:'R/1000 Tracker',          href:'/downloads/warranty/R1000_Tracker.xlsx',            color:'#0d9488'},
            {label:'Field Failure Report',    href:'/downloads/warranty/Field_Failure_Report.xlsx',     color:'#b45309'},
            {label:'Warranty 8D Template',    href:'/downloads/warranty/Warranty_8D_Template.xlsx',     color:'#dc2626'},
            {label:'Customer Return Register',href:'/downloads/warranty/Customer_Return_Register.xlsx', color:'#0891b2'},
          ].map(f=>(
            <span key={f.label} className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:f.color}}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110">{f.label}</a>
              <a href={f.href} download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110">⬇</a>
            </span>
          ))}
        </div>

        {tab==='dashboard' && <WarrantyDashboard claims={claims} />}
        {tab==='claims'    && <ClaimRegister claims={claims} setClaims={setClaims} />}
        {tab==='analysis'  && <FieldFailureAnalysis claims={claims} />}
        {tab==='guide'     && <WarrantyGuide />}
      </div>

      <QualityCopilot page="warranty-quality" />
    </div>
  );
}
