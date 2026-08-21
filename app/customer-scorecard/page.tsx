'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';
import ExportPDF from '../components/ExportPDF';
import LiveKPIBanner from '../components/LiveKPIBanner';
import LiveCustomerComplaints from '../components/LiveCustomerComplaints';

// -- Types ---------------------------------------------------------------------
type Rating = 'A'|'B'|'C'|'D';
type RiskLevel = 'low'|'medium'|'high'|'critical';

interface CustomerScore {
  id: string;
  name: string;
  shortName: string;
  segment: string;        // OEM / Tier-1 / Export
  ppm: number;            // Current month PPM
  ppmTarget: number;
  otd: number;            // On-time delivery %
  otdTarget: number;
  complaints: number;     // Open customer complaints
  warrantyR1000: number;
  auditScore: number;     // Last audit score /100
  lastAuditDate: string;
  ppapStatus: 'approved'|'conditional'|'rejected'|'pending';
  csrCompliance: number;  // % of CSR requirements met
  annualRevenue: number;  // INR Lakhs
  keyContact: string;
  nextReview: string;
  trend: 'improving'|'stable'|'deteriorating';
  monthlyPPM: number[];   // 6-month PPM trend
  monthlyComplaints: number[];
}

// -- Scoring Engine ------------------------------------------------------------
const WEIGHTS = { ppm:30, otd:25, complaints:20, audit:15, warranty:10 };

function calcScore(c: CustomerScore): number {
  const ppmScore = c.ppm<=0?100:c.ppm<=c.ppmTarget?100:c.ppm<=c.ppmTarget*2?75:c.ppm<=c.ppmTarget*4?50:25;
  const otdScore = c.otd>=c.otdTarget?100:c.otd>=c.otdTarget-3?75:c.otd>=c.otdTarget-7?50:25;
  const cmpScore = c.complaints===0?100:c.complaints===1?80:c.complaints<=3?60:40;
  const audScore = c.auditScore;
  const warScore = c.warrantyR1000<=10?100:c.warrantyR1000<=25?75:c.warrantyR1000<=50?50:25;
  return Math.round(
    (ppmScore*WEIGHTS.ppm + otdScore*WEIGHTS.otd + cmpScore*WEIGHTS.complaints + audScore*WEIGHTS.audit + warScore*WEIGHTS.warranty)/100
  );
}

function rating(score:number): Rating {
  return score>=85?'A':score>=70?'B':score>=55?'C':'D';
}
function ratingColor(r:Rating): string {
  return r==='A'?'text-emerald-600':r==='B'?'text-blue-600':r==='C'?'text-amber-600':'text-red-600';
}
function ratingBg(r:Rating): string {
  return r==='A'?'bg-emerald-50 border-emerald-200':r==='B'?'bg-[#eff6ff] border-blue-700/50':r==='C'?'bg-amber-50 border-amber-200':'bg-red-50 border-red-700/50';
}
function riskLevel(r:Rating): RiskLevel {
  return r==='A'?'low':r==='B'?'medium':r==='C'?'high':'critical';
}
function trendIcon(t:CustomerScore['trend']): string {
  return t==='improving'?'↑':t==='stable'?'→':'↓';
}
function trendColor(t:CustomerScore['trend']): string {
  return t==='improving'?'text-emerald-600':t==='stable'?'text-blue-600':'text-red-600';
}

// -- Sample Data ---------------------------------------------------------------
const CUSTOMERS: CustomerScore[] = [
  {
    id:'C001', name:'Tata Motors Ltd.', shortName:'Tata Motors', segment:'OEM',
    ppm:180, ppmTarget:200, otd:96.5, otdTarget:97,
    complaints:1, warrantyR1000:22, auditScore:88,
    lastAuditDate:'2026-05-14', ppapStatus:'approved', csrCompliance:94,
    annualRevenue:420, keyContact:'Mr. Ravi Sharma — SQE', nextReview:'2026-09-10',
    trend:'stable', monthlyPPM:[320,280,240,210,195,180], monthlyComplaints:[2,2,1,1,1,1],
  },
  {
    id:'C002', name:'Maruti Suzuki India Ltd.', shortName:'Maruti Suzuki', segment:'OEM',
    ppm:95, ppmTarget:150, otd:98.2, otdTarget:98,
    complaints:0, warrantyR1000:14, auditScore:91,
    lastAuditDate:'2026-06-02', ppapStatus:'approved', csrCompliance:98,
    annualRevenue:680, keyContact:'Ms. Priya Mehta — Supplier Quality', nextReview:'2026-10-05',
    trend:'improving', monthlyPPM:[210,180,150,130,110,95], monthlyComplaints:[1,1,0,0,0,0],
  },
  {
    id:'C003', name:'Mahindra & Mahindra Ltd.', shortName:'Mahindra', segment:'OEM',
    ppm:450, ppmTarget:300, otd:93.8, otdTarget:95,
    complaints:3, warrantyR1000:38, auditScore:74,
    lastAuditDate:'2026-04-20', ppapStatus:'conditional', csrCompliance:82,
    annualRevenue:290, keyContact:'Mr. Anil Desai — QA Head', nextReview:'2026-08-20',
    trend:'deteriorating', monthlyPPM:[310,340,380,420,450,450], monthlyComplaints:[1,2,2,3,3,3],
  },
  {
    id:'C004', name:'Toyota Kirloskar Motor', shortName:'Toyota', segment:'OEM',
    ppm:42, ppmTarget:100, otd:99.1, otdTarget:99,
    complaints:0, warrantyR1000:8, auditScore:95,
    lastAuditDate:'2026-07-01', ppapStatus:'approved', csrCompliance:100,
    annualRevenue:310, keyContact:'Mr. Sato — Supplier Development', nextReview:'2026-11-01',
    trend:'improving', monthlyPPM:[95,80,70,55,48,42], monthlyComplaints:[0,0,0,0,0,0],
  },
  {
    id:'C005', name:'Bosch India Ltd.', shortName:'Bosch', segment:'Tier-1',
    ppm:620, ppmTarget:400, otd:91.5, otdTarget:95,
    complaints:4, warrantyR1000:0, auditScore:68,
    lastAuditDate:'2026-03-15', ppapStatus:'conditional', csrCompliance:75,
    annualRevenue:180, keyContact:'Mr. Franz Klein — Quality', nextReview:'2026-08-25',
    trend:'deteriorating', monthlyPPM:[410,480,520,580,610,620], monthlyComplaints:[2,3,3,4,4,4],
  },
  {
    id:'C006', name:'Ashok Leyland Ltd.', shortName:'Ashok Leyland', segment:'OEM',
    ppm:280, ppmTarget:300, otd:95.5, otdTarget:95,
    complaints:2, warrantyR1000:30, auditScore:80,
    lastAuditDate:'2026-05-28', ppapStatus:'approved', csrCompliance:88,
    annualRevenue:145, keyContact:'Mr. Venkat Rao — SQE', nextReview:'2026-09-30',
    trend:'stable', monthlyPPM:[310,300,295,285,282,280], monthlyComplaints:[3,2,2,2,2,2],
  },
];

const MONTHS = ['Mar','Apr','May','Jun','Jul','Aug'];

// -- Dashboard Tab -------------------------------------------------------------
function Dashboard({ customers }: { customers: CustomerScore[] }) {
  const scored = customers.map(c=>({...c, score:calcScore(c), rating:rating(calcScore(c))}));
  const aCount = scored.filter(c=>c.rating==='A').length;
  const bCount = scored.filter(c=>c.rating==='B').length;
  const cCount = scored.filter(c=>c.rating==='C').length;
  const dCount = scored.filter(c=>c.rating==='D').length;
  const avgScore = Math.round(scored.reduce((s,c)=>s+c.score,0)/scored.length);
  const totalComplaints = customers.reduce((s,c)=>s+c.complaints,0);
  const atRisk = scored.filter(c=>c.rating==='C'||c.rating==='D');
  const avgOTD = (customers.reduce((s,c)=>s+c.otd,0)/customers.length).toFixed(1);
  const avgPPM = Math.round(customers.reduce((s,c)=>s+c.ppm,0)/customers.length);

  return (
      <>
      <PageTitle title="Customer Scorecard" />
      <div className="space-y-5 py-4">
      {/* -- Live Supabase Banner ----------------------------------------------- */}
      <LiveKPIBanner />
      {/* -- Live Complaint Breakdown by Customer ------------------------------- */}
      <LiveCustomerComplaints />
      {/* -- Sample Scorecard KPIs (calculated from scorecard data) ------------ */}
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Avg Customer Score',  value:`${avgScore}%`, sub:`${aCount}A · ${bCount}B · ${cCount}C · ${dCount}D`, color:avgScore>=85?'text-emerald-600':avgScore>=70?'text-blue-600':avgScore>=55?'text-amber-600':'text-red-600' },
          { label:'At-Risk Customers',   value:atRisk.length, sub:`${dCount} critical · ${cCount} high-risk`, color:atRisk.length===0?'text-emerald-600':atRisk.length<=2?'text-amber-600':'text-red-600' },
          { label:'Open Complaints',     value:totalComplaints, sub:'across all customers', color:totalComplaints===0?'text-emerald-600':totalComplaints<=3?'text-amber-600':'text-red-600' },
          { label:'Avg OTD Performance', value:`${avgOTD}%`, sub:`Avg PPM: ${avgPPM}`, color:parseFloat(avgOTD)>=97?'text-emerald-600':parseFloat(avgOTD)>=94?'text-amber-600':'text-red-600' },
        ].map(k=>(
          <div key={k.label} className="rounded-xl border border-blue-700/50/30 bg-[#eff6ff] p-4">
            <div className="text-xs text-[#1d4ed8] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-blue-600/70 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* At-Risk Banner */}
      {atRisk.length>0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs font-bold text-amber-700 mb-2">⚠️ AT-RISK CUSTOMERS — Action Required ({atRisk.length})</div>
          <div className="flex flex-wrap gap-2">
            {atRisk.map(c=>(
              <span key={c.id} className={`text-xs font-bold px-3 py-1 rounded-full border ${ratingBg(c.rating)}`}>
                <span className={ratingColor(c.rating)}>{c.rating}</span> — {c.shortName} (Score: {c.score}%)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Rating Distribution */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Rating Distribution — ABCD</div>
          {(['A','B','C','D'] as Rating[]).map(r=>{
            const cnt = scored.filter(c=>c.rating===r).length;
            const pct = customers.length>0?Math.round(cnt/customers.length*100):0;
            const colors = {A:'bg-emerald-500',B:'bg-blue-500',C:'bg-amber-500',D:'bg-red-500'};
            const labels = {A:'World Class (≥85%)',B:'Satisfactory (70-84%)',C:'Monitor (55-69%)',D:'Critical (<55%)'};
            return (
              <div key={r} className="flex items-center gap-3 mb-3">
                <span className={`font-black text-lg w-6 ${ratingColor(r)}`}>{r}</span>
                <div className="flex-1 bg-[#dbeafe] rounded-full h-3">
                  <div className={`${colors[r]} h-3 rounded-full`} style={{width:`${pct}%`,minWidth:cnt>0?'12px':0}}/>
                </div>
                <span className="text-xs font-bold text-[#1e3a5f] w-6 text-right">{cnt}</span>
                <span className="text-xs text-[#1e3a5f] w-40 hidden md:inline">{labels[r]}</span>
              </div>
            );
          })}
        </div>

        {/* Top Performers vs Bottom */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Customer Score Ranking</div>
          {scored.sort((a,b)=>b.score-a.score).map((c,i)=>{
            const bar = c.score;
            return (
              <div key={c.id} className="flex items-center gap-2 mb-2.5">
                <span className="text-xs text-[#1e3a5f] w-4 font-bold">{i+1}</span>
                <span className="text-xs text-[#1e3a5f] flex-1 truncate">{c.shortName}</span>
                <div className="w-24 bg-[#dbeafe] rounded-full h-2 shrink-0">
                  <div className="h-2 rounded-full" style={{
                    width:`${bar}%`,
                    background:c.rating==='A'?'#10b981':c.rating==='B'?'#3b82f6':c.rating==='C'?'#f59e0b':'#ef4444'
                  }}/>
                </div>
                <span className={`text-xs font-bold w-8 text-right ${ratingColor(c.rating)}`}>{c.score}%</span>
                <span className={`text-xs font-black w-4 ${ratingColor(c.rating)}`}>{c.rating}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PPM & OTD Summary Table */}
      <div className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#dbeafe]">
          <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Customer Performance Summary</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#dbeafe]">
                {['Customer','Segment','PPM','OTD','Complaints','R/1000','Audit','CSR%','Score','Rating','Trend'].map(h=>(
                  <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scored.sort((a,b)=>b.score-a.score).map(c=>(
                <tr key={c.id} className="border-b border-[#dbeafe] hover:bg-white">
                  <td className="px-3 py-2 font-semibold text-white whitespace-nowrap">{c.shortName}</td>
                  <td className="px-3 py-2 text-[#1e3a5f]">{c.segment}</td>
                  <td className={`px-3 py-2 font-bold ${c.ppm<=c.ppmTarget?'text-emerald-600':c.ppm<=c.ppmTarget*2?'text-amber-600':'text-red-600'}`}>{c.ppm}</td>
                  <td className={`px-3 py-2 font-bold ${c.otd>=c.otdTarget?'text-emerald-600':c.otd>=c.otdTarget-5?'text-amber-600':'text-red-600'}`}>{c.otd}%</td>
                  <td className={`px-3 py-2 font-bold ${c.complaints===0?'text-emerald-600':c.complaints<=2?'text-amber-600':'text-red-600'}`}>{c.complaints}</td>
                  <td className={`px-3 py-2 font-bold ${c.warrantyR1000<=20?'text-emerald-600':c.warrantyR1000<=40?'text-amber-600':'text-red-600'}`}>{c.warrantyR1000}</td>
                  <td className={`px-3 py-2 font-bold ${c.auditScore>=85?'text-emerald-600':c.auditScore>=70?'text-amber-600':'text-red-600'}`}>{c.auditScore}</td>
                  <td className={`px-3 py-2 font-bold ${c.csrCompliance>=95?'text-emerald-600':c.csrCompliance>=80?'text-amber-600':'text-red-600'}`}>{c.csrCompliance}%</td>
                  <td className="px-3 py-2">
                    <span className={`font-black text-sm ${ratingColor(c.rating)}`}>{c.score}%</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`font-black text-lg ${ratingColor(c.rating)}`}>{c.rating}</span>
                  </td>
                  <td className={`px-3 py-2 font-bold ${trendColor(c.trend)}`}>{trendIcon(c.trend)} {c.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maturity */}
      <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 Customer Quality Maturity — IATF Cl. 8.2.1 / 9.1.2</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Customers Rated A or B', score:Math.round((aCount+bCount)/customers.length*100), target:80 },
            { label:'Zero-Complaint Customers', score:Math.round(customers.filter(c=>c.complaints===0).length/customers.length*100), target:70 },
            { label:'PPAP Fully Approved', score:Math.round(customers.filter(c=>c.ppapStatus==='approved').length/customers.length*100), target:100 },
            { label:'CSR Compliance Avg', score:Math.round(customers.reduce((s,c)=>s+c.csrCompliance,0)/customers.length), target:95 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.8?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-[#eff6ff] rounded-xl p-3 text-center">
                <div className="text-xs text-[#1d4ed8] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-blue-600 mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-[#eff6ff] rounded-full h-1.5">
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

// -- Scorecard Tab -------------------------------------------------------------
function ScorecardTab({ customers }: { customers: CustomerScore[] }) {
  const [selected, setSelected] = useState<string>(customers[0]?.id??'');
  const c = customers.find(x=>x.id===selected);
  const score = c ? calcScore(c) : 0;
  const r = rating(score);

  if (!c) return null;

  const metrics = [
    { label:'PPM', weight:WEIGHTS.ppm, actual:c.ppm, target:c.ppmTarget, unit:'ppm',
      score:c.ppm<=0?100:c.ppm<=c.ppmTarget?100:c.ppm<=c.ppmTarget*2?75:c.ppm<=c.ppmTarget*4?50:25,
      display:`${c.ppm} / ${c.ppmTarget}`, good:c.ppm<=c.ppmTarget },
    { label:'On-Time Delivery', weight:WEIGHTS.otd, actual:c.otd, target:c.otdTarget, unit:'%',
      score:c.otd>=c.otdTarget?100:c.otd>=c.otdTarget-3?75:c.otd>=c.otdTarget-7?50:25,
      display:`${c.otd}% / ${c.otdTarget}%`, good:c.otd>=c.otdTarget },
    { label:'Open Complaints', weight:WEIGHTS.complaints, actual:c.complaints, target:0, unit:'',
      score:c.complaints===0?100:c.complaints===1?80:c.complaints<=3?60:40,
      display:`${c.complaints} open`, good:c.complaints===0 },
    { label:'Audit Score', weight:WEIGHTS.audit, actual:c.auditScore, target:85, unit:'/100',
      score:c.auditScore, display:`${c.auditScore}/100`, good:c.auditScore>=85 },
    { label:'Warranty R/1000', weight:WEIGHTS.warranty, actual:c.warrantyR1000, target:20, unit:'',
      score:c.warrantyR1000<=10?100:c.warrantyR1000<=25?75:c.warrantyR1000<=50?50:25,
      display:`${c.warrantyR1000}`, good:c.warrantyR1000<=20 },
  ];

  return (
    <div className="space-y-5 py-4">
      {/* Customer selector + Export button */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {customers.map(cu=>{
            const sc=calcScore(cu); const rr=rating(sc);
            return (
              <button key={cu.id} onClick={()=>setSelected(cu.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition ${selected===cu.id?'bg-blue-700 text-white border-blue-500':'border-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
                <span className={ratingColor(rr)}>{rr}</span> · {cu.shortName}
              </button>
            );
          })}
        </div>
        <ExportPDF
          targetId="scorecard-print-section"
          label="Export Scorecard PDF"
          filename={`Customer_Scorecard_${c.shortName}_${new Date().toISOString().slice(0,10)}`}
          color="#1e40af"
          size="sm"
        />
      </div>

      {/* Printable scorecard wrapper */}
      <div id="scorecard-print-section">
        {/* Print-only header */}
        <div className="print-header-inject mb-4 pb-3 border-b border-[#dbeafe]">
          <div style={{fontSize:'18pt',fontWeight:'bold',color:'#111'}}>Customer Quality Scorecard Report</div>
          <div style={{fontSize:'10pt',color:'#555',marginTop:'4px'}}>QMOS — Quality Management Operating System &nbsp;|&nbsp; Generated: {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
        </div>

      {/* Scorecard card */}
      <div className={`rounded-2xl border-2 p-6 print-no-break ${ratingBg(r)}`}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">{c.name}</h2>
            <div className="text-xs text-[#1e3a5f] mt-1">{c.segment} · Key Contact: {c.keyContact}</div>
            <div className="flex gap-4 mt-2 text-xs text-[#1e3a5f]">
              <span>PPAP: <span className={c.ppapStatus==='approved'?'text-emerald-600':c.ppapStatus==='conditional'?'text-amber-600':'text-red-600'}>{c.ppapStatus.toUpperCase()}</span></span>
              <span>CSR Compliance: <span className={c.csrCompliance>=90?'text-emerald-600':c.csrCompliance>=75?'text-amber-600':'text-red-600'}>{c.csrCompliance}%</span></span>
              <span>Last Audit: {c.lastAuditDate}</span>
              <span>Next Review: {c.nextReview}</span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-6xl font-black ${ratingColor(r)}`}>{r}</div>
            <div className="text-2xl font-bold text-white mt-1">{score}%</div>
            <div className="text-xs text-[#1e3a5f]">Overall Score</div>
            <div className={`text-xs font-bold mt-1 ${trendColor(c.trend)}`}>{trendIcon(c.trend)} {c.trend}</div>
          </div>
        </div>

        {/* Metric breakdown */}
        <div className="space-y-4">
          {metrics.map(m=>{
            const weighted = Math.round(m.score*m.weight/100);
            const maxWeighted = m.weight;
            return (
              <div key={m.label}>
                <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-y-2">
                  <span className="font-semibold text-[#1e3a5f]">{m.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#1e3a5f]">Weight: {m.weight}%</span>
                    <span className={m.good?'text-emerald-600':'text-amber-600'}>{m.display}</span>
                    <span className="font-bold text-white">{weighted}/{maxWeighted} pts</span>
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{
                    width:`${m.score}%`,
                    background:m.score>=80?'#10b981':m.score>=60?'#f59e0b':'#ef4444'
                  }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue & Actions */}
        <div className="mt-5 flex flex-wrap gap-3 items-center justify-between">
          <div className="text-xs text-[#1e3a5f]">Annual Revenue: <span className="text-white font-bold">₹{c.annualRevenue}L</span></div>
          <div className="flex gap-2">
            {r==='C'||r==='D' ? (
              <span className="text-xs bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold">🚨 Raise Improvement Plan</span>
            ) : r==='B' ? (
              <span className="text-xs bg-amber-700 text-white px-3 py-1.5 rounded-lg font-semibold">📋 Initiate Review Meeting</span>
            ) : (
              <span className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold">✅ Maintain Performance</span>
            )}
          </div>
        </div>
      </div>

      {/* 6-Month PPM Trend for selected customer */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">6-Month PPM Trend — {c.shortName}</div>
        <div className="flex items-end gap-3 h-28">
          {c.monthlyPPM.map((ppm,i)=>{
            const max = Math.max(...c.monthlyPPM,1);
            const pct = Math.round(ppm/max*100);
            const color = ppm<=c.ppmTarget?'bg-emerald-500':ppm<=c.ppmTarget*2?'bg-amber-500':'bg-red-500';
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold text-[#1e3a5f]">{ppm}</span>
                <div className={`w-full rounded-t-md ${color}`} style={{height:`${pct}%`,minHeight:'6px'}} />
                <span className="text-xs text-[#1e3a5f]">{MONTHS[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2 text-xs text-[#1e3a5f]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block"/>≤ Target</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block"/>≤ 2× Target</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block"/>&gt; 2× Target</span>
          <span className="ml-auto">Target: {c.ppmTarget} PPM</span>
        </div>
      </div>
      </div>{/* end scorecard-print-section */}
    </div>
  );
}

// -- Trend Analysis ------------------------------------------------------------
function TrendAnalysis({ customers }: { customers: CustomerScore[] }) {
  return (
    <div className="space-y-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['improving','stable','deteriorating'] as const).map(trend=>{
          const group = customers.filter(c=>c.trend===trend);
          const label = trend==='improving'?'📈 Improving':trend==='stable'?'→ Stable':'📉 Deteriorating';
          const colors = {improving:'border-emerald-200 bg-emerald-50',stable:'border-blue-700/50 bg-[#eff6ff]',deteriorating:'border-red-700/50 bg-red-50'};
          const textColors = {improving:'text-emerald-700',stable:'text-[#1d4ed8]',deteriorating:'text-red-700'};
          return (
            <div key={trend} className={`border rounded-xl p-4 ${colors[trend]}`}>
              <div className={`text-xs font-bold uppercase tracking-wide mb-3 ${textColors[trend]}`}>{label} ({group.length})</div>
              {group.length===0 ? <div className="text-xs text-[#1e3a5f]">None</div>
                : group.map(c=>{
                  const sc=calcScore(c); const r=rating(sc);
                  return (
                    <div key={c.id} className="flex items-center gap-2 mb-2">
                      <span className={`font-black text-sm ${ratingColor(r)}`}>{r}</span>
                      <span className="text-xs text-[#1e3a5f] flex-1">{c.shortName}</span>
                      <span className="text-xs text-[#1e3a5f]">{sc}%</span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Month-by-month PPM comparison */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">PPM Trend — All Customers (6 Months)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#dbeafe]">
                <th className="text-left px-3 py-2 text-[#1e3a5f]">Customer</th>
                {MONTHS.map(m=><th key={m} className="text-center px-3 py-2 text-[#1e3a5f]">{m}</th>)}
                <th className="text-center px-3 py-2 text-[#1e3a5f]">Trend</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c=>(
                <tr key={c.id} className="border-b border-[#dbeafe] hover:bg-[#dbeafe]/20">
                  <td className="px-3 py-2 font-semibold text-white">{c.shortName}</td>
                  {c.monthlyPPM.map((ppm,i)=>(
                    <td key={i} className={`px-3 py-2 text-center font-bold ${ppm<=c.ppmTarget?'text-emerald-600':ppm<=c.ppmTarget*2?'text-amber-600':'text-red-600'}`}>{ppm}</td>
                  ))}
                  <td className={`px-3 py-2 text-center font-bold ${trendColor(c.trend)}`}>{trendIcon(c.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-3 text-xs text-[#1e3a5f]">
          <span className="text-emerald-600">Green = on/under target</span>
          <span className="text-amber-600">Amber = up to 2× target</span>
          <span className="text-red-600">Red = above 2× target</span>
        </div>
      </div>

      {/* Complaint trend */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Open Complaints by Month</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#dbeafe]">
                <th className="text-left px-3 py-2 text-[#1e3a5f]">Customer</th>
                {MONTHS.map(m=><th key={m} className="text-center px-3 py-2 text-[#1e3a5f]">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {customers.map(c=>(
                <tr key={c.id} className="border-b border-[#dbeafe] hover:bg-[#dbeafe]/20">
                  <td className="px-3 py-2 font-semibold text-white">{c.shortName}</td>
                  {c.monthlyComplaints.map((cnt,i)=>(
                    <td key={i} className={`px-3 py-2 text-center font-bold ${cnt===0?'text-emerald-600':cnt<=2?'text-amber-600':'text-red-600'}`}>{cnt}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -- Guide ---------------------------------------------------------------------
function Guide() {
  const [open, setOpen] = useState<number|null>(0);
  const sections = [
    { title:'IATF 16949 Cl. 8.2.1 — Customer Communication', content:'Organizations shall determine processes for communicating with customers on: product/service information, feedback including complaints, customer property handling, and specific requirements for contingency plans. The customer scorecard is a structured tool to monitor performance against customer-agreed metrics.' },
    { title:'IATF 16949 Cl. 9.1.2 — Customer Satisfaction', content:'The organization shall monitor customer perceptions of the degree to which needs and expectations have been fulfilled. Methods for obtaining information include: customer surveys, warranty data, field returns, audit results, dealer feedback, complaint data, PPM reports, OTD reports. Results must be used as a management review input (Cl. 9.3).' },
    { title:'ABCD Rating System — Scoring Methodology', content:'A (≥85%): World Class performer — maintain and benchmark. B (70-84%): Satisfactory — monitor for improvement opportunities. C (55-69%): High-risk — initiate improvement plan, schedule review meeting. D (<55%): Critical — escalate to management, formal corrective action plan required, consider business at risk.\n\nWeights used in QMOS: PPM 30% · OTD 25% · Complaints 20% · Audit Score 15% · Warranty R/1000 10%.' },
    { title:'Customer-Specific Requirements (CSR) Management', content:'Each OEM customer publishes CSRs over and above IATF 16949 base requirements. Examples: AIAG-VDA FMEA format (GM, Ford, Stellantis), Production Part Run-off at customer facility (BMW, Toyota), Specific PPAP submission level requirements, Specific SPC capability requirements (Cpk≥1.67), Specific packaging and labeling standards. CSR compliance % must be tracked and maintained at 100%.' },
    { title:'Customer Quality Review Meeting — Best Practice', content:'Monthly: Review PPM, OTD, open complaints with data. Quarterly: Trend analysis, CAPA status review, upcoming volume changes. Annually: Scorecard review, PPAP status, audit plan alignment, CSR update review. Action items must have owners and deadlines. Minutes must be shared within 48 hours and signed off by both parties.' },
    { title:'Common Customer Audit Findings', content:'1. PPM not tracked per customer / per part number. 2. Customer complaints not closed within agreed timeline. 3. CSR register not maintained or not reviewed after CSR updates. 4. PPAP submissions missing for engineering changes. 5. No customer satisfaction measurement process. 6. Audit findings from customer visit not addressed in CAPA. 7. Key contact / escalation matrix not maintained.' },
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
            <div className="px-5 pb-4 text-xs text-[#1e3a5f] leading-relaxed border-t border-[#dbeafe] pt-3 whitespace-pre-line">
              {s.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function CustomerScorecardPage() {
  const [tab, setTab] = useState<'dashboard'|'scorecard'|'trends'|'guide'>('dashboard');
  const [customers] = useState<CustomerScore[]>(CUSTOMERS);

  const scored = customers.map(c=>({...c,score:calcScore(c),rating:rating(calcScore(c))}));
  const atRisk = scored.filter(c=>c.rating==='C'||c.rating==='D').length;
  const avgScore = Math.round(scored.reduce((s,c)=>s+c.score,0)/scored.length);

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">🏆 Customer Scorecard</h1>
              <p className="text-[#1d4ed8] text-sm mt-1">Per-customer PPM · OTD · Complaints · ABCD Rating — IATF Cl. 8.2.1 / 9.1.2</p>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{customers.length}</div>
                <div className="text-xs text-[#1d4ed8]">Customers</div>
              </div>
              <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl px-4 py-2">
                <div className={`text-xl font-bold ${avgScore>=80?'text-emerald-700':avgScore>=65?'text-amber-700':'text-red-700'}`}>{avgScore}%</div>
                <div className="text-xs text-[#1d4ed8]">Avg Score</div>
              </div>
              <div className={`border rounded-xl px-4 py-2 ${atRisk>0?'bg-amber-50 border-amber-200':'bg-emerald-50 border-emerald-200'}`}>
                <div className={`text-xl font-bold ${atRisk>0?'text-amber-700':'text-emerald-700'}`}>{atRisk}</div>
                <div className="text-xs text-[#1e3a5f]">At-Risk</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'scorecard', label:'🏆 Scorecards'},
              {id:'trends',    label:'📈 Trend Analysis'},
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
        {/* Downloads */}
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl my-4" style={{background:'#f1f5f9'}}>
          <span className="text-[#1e3a5f] text-xs font-bold mr-1">📥 Downloads:</span>
          {[
            {label:'Customer Scorecard Template', href:'/downloads/customer/Customer_Scorecard_Template.xlsx', color:'#1d4ed8'},
            {label:'PPM Tracker',                 href:'/downloads/customer/PPM_Tracker.xlsx',                 color:'#0d9488'},
            {label:'OTD Report',                  href:'/downloads/customer/OTD_Monthly_Report.xlsx',          color:'#7c3aed'},
            {label:'Complaint Register',          href:'/downloads/customer/Customer_Complaint_Register.xlsx', color:'#dc2626'},
            {label:'CSR Register',                href:'/downloads/customer/CSR_Register.xlsx',                color:'#b45309'},
          ].map(f=>(
            <span key={f.label} className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:f.color}}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110">{f.label}</a>
              <a href={f.href} download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110">⬇</a>
            </span>
          ))}
        </div>

        {tab==='dashboard' && <Dashboard customers={customers} />}
        {tab==='scorecard' && <ScorecardTab customers={customers} />}
        {tab==='trends'    && <TrendAnalysis customers={customers} />}
        {tab==='guide'     && <Guide />}
      </div>

      <QualityCopilot page="customer-quality" />
    </div>
  );
}
