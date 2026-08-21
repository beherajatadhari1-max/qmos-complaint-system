'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';
import LiveKPIBanner from '../components/LiveKPIBanner';

// -- Types ---------------------------------------------------------------------
type GoalStatus   = 'on-track'|'at-risk'|'behind'|'achieved';
type Frequency    = 'monthly'|'quarterly'|'annual';
type Department   = 'quality'|'production'|'supplier-quality'|'engineering'|'logistics'|'all';
type GoalCategory = 'customer'|'internal'|'supplier'|'process'|'people'|'cost';

interface QualityGoal {
  id: string;
  category: GoalCategory;
  department: Department;
  kpi: string;
  description: string;
  unit: string;
  target: number;
  baseline: number;    // previous year actual
  frequency: Frequency;
  iatfClause: string;
  actuals: (number|null)[];  // Jan–Dec
  owner: string;
  weight: number;      // % weight in overall score (all weights sum to 100)
  lowerIsBetter: boolean;  // PPM = lower better; OTD = higher better
}

// -- Helpers -------------------------------------------------------------------
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function latestActual(g: QualityGoal): number|null {
  const actuals = g.actuals.filter((a): a is number => a !== null);
  return actuals.length > 0 ? actuals[actuals.length - 1] : null;
}

function goalStatus(g: QualityGoal): GoalStatus {
  const actual = latestActual(g);
  if (actual === null) return 'at-risk';
  const achieved = g.lowerIsBetter ? actual <= g.target : actual >= g.target;
  if (achieved) return 'achieved';
  const gap = g.lowerIsBetter
    ? (actual - g.target) / g.target
    : (g.target - actual) / g.target;
  if (gap <= 0.05) return 'on-track';
  if (gap <= 0.15) return 'at-risk';
  return 'behind';
}

function achievementPct(g: QualityGoal): number {
  const actual = latestActual(g);
  if (actual === null) return 0;
  if (g.lowerIsBetter) {
    if (actual <= g.target) return 100;
    return Math.max(0, Math.round((g.target / actual) * 100));
  } else {
    if (actual >= g.target) return 100;
    return Math.round((actual / g.target) * 100);
  }
}

const STATUS_STYLE: Record<GoalStatus, string> = {
  achieved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'on-track':'bg-[#eff6ff] text-[#1d4ed8] border-blue-700/50',
  'at-risk': 'bg-amber-50 text-amber-700 border-amber-200',
  behind:    'bg-red-50 text-red-700 border-red-700/50',
};
const STATUS_BAR: Record<GoalStatus, string> = {
  achieved:'bg-emerald-500', 'on-track':'bg-blue-500', 'at-risk':'bg-amber-500', behind:'bg-red-500'
};
const CAT_COLORS: Record<GoalCategory, string> = {
  customer:'bg-[#eff6ff] text-[#1d4ed8]', internal:'bg-purple-900/30 text-purple-300',
  supplier:'bg-orange-900/30 text-orange-600', process:'bg-teal-50 text-teal-700',
  people:'bg-pink-50 text-pink-700', cost:'bg-green-900/30 text-green-300',
};

// -- Sample Goals --------------------------------------------------------------
const GOALS: QualityGoal[] = [
  {
    id:'G-001', category:'customer', department:'quality', kpi:'Customer PPM',
    description:'Parts per million defects reaching customers — measured on returned / rejected parts',
    unit:'PPM', target:150, baseline:380, frequency:'monthly', iatfClause:'9.1.2',
    actuals:[340,310,280,250,220,200,180,null,null,null,null,null],
    owner:'Quality Head', weight:20, lowerIsBetter:true,
  },
  {
    id:'G-002', category:'customer', department:'logistics', kpi:'On-Time Delivery',
    description:'% of customer shipments delivered on or before customer-required date',
    unit:'%', target:98, baseline:94.5, frequency:'monthly', iatfClause:'9.1.2',
    actuals:[95.2,95.8,96.1,96.5,97.0,97.2,97.8,null,null,null,null,null],
    owner:'Logistics / Quality Head', weight:15, lowerIsBetter:false,
  },
  {
    id:'G-003', category:'customer', department:'quality', kpi:'Customer Complaints',
    description:'Number of formal customer quality complaints received per month',
    unit:'nos', target:2, baseline:7, frequency:'monthly', iatfClause:'9.1.2',
    actuals:[6,5,4,4,3,3,2,null,null,null,null,null],
    owner:'Customer Quality Manager', weight:15, lowerIsBetter:true,
  },
  {
    id:'G-004', category:'internal', department:'production', kpi:'First Time Through (FTT%)',
    description:'% of units that pass through all operations without rework or rejection',
    unit:'%', target:97, baseline:91, frequency:'monthly', iatfClause:'8.5.1',
    actuals:[91.5,92.0,93.2,94.1,94.8,95.5,96.0,null,null,null,null,null],
    owner:'Manufacturing / Quality Head', weight:12, lowerIsBetter:false,
  },
  {
    id:'G-005', category:'internal', department:'quality', kpi:'Internal PPM',
    description:'Internal defects per million operations — in-process rejections + rework',
    unit:'PPM', target:500, baseline:1850, frequency:'monthly', iatfClause:'9.1.1',
    actuals:[1700,1600,1450,1300,1100,950,820,null,null,null,null,null],
    owner:'Process Quality Engineer', weight:10, lowerIsBetter:true,
  },
  {
    id:'G-006', category:'supplier', department:'supplier-quality', kpi:'Supplier PPM',
    description:'Incoming material defects per million from all suppliers combined',
    unit:'PPM', target:300, baseline:920, frequency:'monthly', iatfClause:'8.4.1',
    actuals:[850,800,750,700,620,580,520,null,null,null,null,null],
    owner:'Supplier Quality Manager', weight:10, lowerIsBetter:true,
  },
  {
    id:'G-007', category:'process', department:'quality', kpi:'CAPA Closure Rate',
    description:'% of CAPAs closed within target date across all categories',
    unit:'%', target:90, baseline:65, frequency:'monthly', iatfClause:'10.2',
    actuals:[68,72,75,78,82,85,88,null,null,null,null,null],
    owner:'Quality Head', weight:8, lowerIsBetter:false,
  },
  {
    id:'G-008', category:'cost', department:'quality', kpi:'Cost of Poor Quality (COPQ)',
    description:'Total internal + external COPQ — scrap + rework + warranty + sorting costs',
    unit:'₹L', target:8, baseline:22, frequency:'monthly', iatfClause:'9.1.1',
    actuals:[20,19,18,16,14,12,10,null,null,null,null,null],
    owner:'Quality Head', weight:5, lowerIsBetter:true,
  },
  {
    id:'G-009', category:'process', department:'quality', kpi:'Audit NC Closure Rate',
    description:'% of internal audit non-conformities closed within 30 days',
    unit:'%', target:95, baseline:72, frequency:'quarterly', iatfClause:'9.2',
    actuals:[null,null,75,null,null,82,null,null,null,null,null,null],
    owner:'IATF Lead Auditor', weight:3, lowerIsBetter:false,
  },
  {
    id:'G-010', category:'people', department:'all', kpi:'Training Completion Rate',
    description:'% of planned quality training sessions completed on schedule',
    unit:'%', target:95, baseline:78, frequency:'quarterly', iatfClause:'7.2',
    actuals:[null,null,82,null,null,88,null,null,null,null,null,null],
    owner:'Training Manager', weight:2, lowerIsBetter:false,
  },
];

// -- Overall Score -------------------------------------------------------------
function calcOverallScore(goals: QualityGoal[]): number {
  let weighted = 0, totalWeight = 0;
  goals.forEach(g => {
    const pct = achievementPct(g);
    weighted += pct * g.weight;
    totalWeight += g.weight;
  });
  return totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;
}

// -- Dashboard -----------------------------------------------------------------
function GoalsDashboard({ goals }: { goals: QualityGoal[] }) {
  const statuses = goals.map(g => goalStatus(g));
  const achieved  = statuses.filter(s=>s==='achieved').length;
  const onTrack   = statuses.filter(s=>s==='on-track').length;
  const atRisk    = statuses.filter(s=>s==='at-risk').length;
  const behind    = statuses.filter(s=>s==='behind').length;
  const overallScore = calcOverallScore(goals);

  const byCat: Record<GoalCategory, {achieved:number;total:number}> = {
    customer:{achieved:0,total:0}, internal:{achieved:0,total:0}, supplier:{achieved:0,total:0},
    process:{achieved:0,total:0}, people:{achieved:0,total:0}, cost:{achieved:0,total:0},
  };
  goals.forEach(g => {
    byCat[g.category].total++;
    if(goalStatus(g)==='achieved') byCat[g.category].achieved++;
  });

  return (
      <>
      <PageTitle title="Quality Goals" />
      <div className="space-y-5 py-4">
      {/* Overall Score Banner */}
      <div className={`rounded-2xl border-2 p-6 flex flex-wrap gap-6 items-center
        ${overallScore>=90?'border-emerald-600 bg-emerald-900/40':overallScore>=70?'border-blue-600 bg-[#eff6ff]':overallScore>=50?'border-amber-300 bg-amber-50':'border-red-300 bg-red-50'}`}>
        <div className="text-center">
          <div className={`text-6xl font-black ${overallScore>=90?'text-[#15803d]':overallScore>=70?'text-[#1d4ed8]':overallScore>=50?'text-amber-600':'text-red-600'}`}>{overallScore}%</div>
          <div className="text-xs text-[#1e3a5f] mt-1 font-semibold">Overall Quality Achievement</div>
          <div className="text-xs text-[#1e3a5f] mt-0.5">FY 2026 — Aug (YTD)</div>
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Achieved', count:achieved, color:'text-[#15803d]', bg:'bg-emerald-900/40' },
            { label:'On Track', count:onTrack,  color:'text-[#1d4ed8]',   bg:'bg-[#eff6ff]' },
            { label:'At Risk',  count:atRisk,   color:'text-amber-600',  bg:'bg-amber-50' },
            { label:'Behind',   count:behind,   color:'text-red-600',    bg:'bg-red-50' },
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-[#1e3a5f]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live KPI vs Target — top 3 live metrics with RAG progress bars */}
      {(() => {
        const liveIds = ['G-001', 'G-003', 'G-007'];
        const liveGoals = goals.filter(g => liveIds.includes(g.id));
        if (liveGoals.length === 0) return null;
        return (
          <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Live KPI vs Target</span>
              <span className="text-[10px] text-[#1e3a5f] ml-auto">Auto-synced from Supabase</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {liveGoals.map(g => {
                const latest = latestActual(g);
                const pct = achievementPct(g);
                const st = goalStatus(g);
                const barColor = (st==='achieved'||st==='on-track') ? 'bg-emerald-500' : st==='at-risk' ? 'bg-amber-500' : 'bg-red-500';
                const textColor = (st==='achieved'||st==='on-track') ? 'text-[#15803d]' : st==='at-risk' ? 'text-amber-600' : 'text-red-600';
                const bgColor  = (st==='achieved'||st==='on-track') ? 'bg-emerald-900/30' : st==='at-risk' ? 'bg-amber-50' : 'bg-red-50';
                const rag = (st==='achieved'||st==='on-track') ? '🟢' : st==='at-risk' ? '🟡' : '🔴';
                return (
                  <div key={g.id} className={`${bgColor} rounded-xl p-4 border border-[#dbeafe]`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-bold text-white leading-tight">{g.kpi}</div>
                      <span className="text-base ml-2 flex-shrink-0">{rag}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className={`text-3xl font-black ${textColor}`}>{latest !== null ? latest : '—'}</span>
                      <span className="text-xs text-[#1e3a5f]">{g.unit}</span>
                    </div>
                    <div className="w-full bg-[#dbeafe] rounded-full h-2.5 mb-1">
                      <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{width:`${Math.min(pct,100)}%`}} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${textColor}`}>{pct}% of target</span>
                      <span className="text-[#1e3a5f]">Target: {g.target} {g.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* KPI Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goals.map(g=>{
          const st = goalStatus(g);
          const pct = achievementPct(g);
          const latest = latestActual(g);
          const isLive = LIVE_GOAL_IDS.has(g.id);
          return (
            <div key={g.id} className={`border rounded-xl p-4 ${STATUS_STYLE[st]}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-white text-sm">{g.kpi}</div>
                    {isLive && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#15803d] bg-emerald-50/30 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />Live
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#1e3a5f] mt-0.5">{g.owner} · IATF {g.iatfClause} · Weight: {g.weight}%</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-black text-xl ${pct>=100?'text-[#15803d]':pct>=80?'text-[#1d4ed8]':pct>=60?'text-amber-600':'text-red-600'}`}>{pct}%</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full border mt-1 ${STATUS_STYLE[st]}`}>{st.replace('-',' ')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="text-[#1e3a5f]">Baseline: <span className="text-[#1e3a5f] font-bold">{g.baseline} {g.unit}</span></span>
                <span className="text-[#1e3a5f]">Target: <span className="text-[#15803d] font-bold">{g.target} {g.unit}</span></span>
                <span className="text-[#1e3a5f]">Latest: <span className="font-bold text-white">{latest !== null ? `${latest} ${g.unit}` : 'No data'}</span></span>
              </div>
              <div className="w-full bg-white rounded-full h-2">
                <div className={`${STATUS_BAR[st]} h-2 rounded-full transition-all`} style={{width:`${Math.min(pct,100)}%`}} />
              </div>
            </div>
          );
        })}
      </div>

      {/* By Category */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Achievement by Category</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.entries(byCat) as [GoalCategory, {achieved:number;total:number}][]).map(([cat,v])=>{
            if(v.total===0) return null;
            const pct = Math.round(v.achieved/v.total*100);
            return (
              <div key={cat} className="bg-[#eff6ff] rounded-xl p-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${CAT_COLORS[cat]}`}>{cat.toUpperCase()}</span>
                <div className="text-2xl font-bold text-white mt-2">{v.achieved}/{v.total}</div>
                <div className="text-xs text-[#1e3a5f]">Goals Achieved</div>
                <div className="mt-2 w-full bg-[#dbeafe] rounded-full h-1.5">
                  <div className="bg-teal-500 h-1.5 rounded-full" style={{width:`${pct}%`}}/>
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

// -- KPI Tracker Tab -----------------------------------------------------------
function KPITracker({ goals }: { goals: QualityGoal[] }) {
  const [selected, setSelected] = useState<string>(goals[0]?.id ?? '');
  const g = goals.find(x=>x.id===selected);

  if (!g) return null;

  const dataMonths = g.actuals.map((a,i)=>({month:MONTHS_SHORT[i], actual:a}));
  const validActuals = g.actuals.filter((a): a is number => a !== null);
  const maxVal = Math.max(...validActuals, g.target, g.baseline) * 1.1;
  const st = goalStatus(g);

  return (
    <div className="space-y-4 py-4">
      {/* Selector */}
      <div className="flex flex-wrap gap-2">
        {goals.map(goal=>{
          const s=goalStatus(goal);
          return (
            <button key={goal.id} onClick={()=>setSelected(goal.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition ${selected===goal.id?'bg-teal-700 text-white border-teal-500':'border-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
              <span className={s==='achieved'?'text-[#15803d]':s==='on-track'?'text-[#1d4ed8]':s==='at-risk'?'text-amber-600':'text-red-600'}>●</span> {goal.kpi}
            </button>
          );
        })}
      </div>

      {/* Detail Card */}
      <div className={`border-2 rounded-2xl p-6 ${STATUS_STYLE[st]}`}>
        <div className="flex flex-wrap justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">{g.kpi}</h2>
            <p className="text-xs text-[#1e3a5f] mt-1">{g.description}</p>
            <div className="flex gap-4 mt-2 text-xs text-[#1e3a5f]">
              <span>Owner: <span className="text-white">{g.owner}</span></span>
              <span>IATF: <span className="text-white">Cl. {g.iatfClause}</span></span>
              <span>Frequency: <span className="text-white capitalize">{g.frequency}</span></span>
              <span>Weight: <span className="text-white">{g.weight}%</span></span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-center">
            <div className="bg-[#eff6ff] rounded-xl p-3">
              <div className="text-lg font-bold text-[#1e3a5f]">{g.baseline}</div>
              <div className="text-xs text-[#1e3a5f]">{g.unit} Baseline</div>
            </div>
            <div className="bg-emerald-900/40 rounded-xl p-3">
              <div className="text-lg font-bold text-[#15803d]">{g.target}</div>
              <div className="text-xs text-[#1e3a5f]">{g.unit} Target</div>
            </div>
            <div className={`rounded-xl p-3 ${STATUS_STYLE[st]}`}>
              <div className="text-lg font-bold text-white">{latestActual(g) ?? '—'}</div>
              <div className="text-xs text-[#1e3a5f]">{g.unit} Latest</div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-[#eff6ff] rounded-xl p-4">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Monthly Trend (Jan–Dec 2026)</div>
          <div className="flex items-end gap-1.5 h-28">
            {dataMonths.map(({month,actual})=>{
              const val = actual ?? 0;
              const barPct = maxVal>0 ? Math.round((val/maxVal)*100) : 0;
              const targetPct = Math.round((g.target/maxVal)*100);
              const isGood = actual !== null && (g.lowerIsBetter ? actual<=g.target : actual>=g.target);
              const barColor = actual===null?'bg-[#dbeafe]':isGood?'bg-emerald-500':'bg-red-500';
              return (
                <div key={month} className="flex-1 flex flex-col items-center justify-end gap-1 relative">
                  {actual !== null && (
                    <span className="text-xs font-bold text-[#1e3a5f]" style={{fontSize:'9px'}}>{actual}</span>
                  )}
                  <div className={`w-full rounded-t-sm ${barColor}`} style={{height:actual!==null?`${barPct}%`:'4px', minHeight:'2px', opacity:actual!==null?1:0.3}} />
                  <span className="text-xs text-[#1e3a5f]" style={{fontSize:'9px'}}>{month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-3 text-xs text-[#1e3a5f]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block"/>On/Exceeds Target</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block"/>Below Target</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#dbeafe] inline-block"/>Not reported</span>
            <span className="ml-auto">Target: {g.target} {g.unit} | Baseline: {g.baseline} {g.unit}</span>
          </div>
        </div>

        {/* Monthly data table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#dbeafe]">
                {MONTHS_SHORT.map(m=><th key={m} className="text-center px-2 py-1 text-[#1e3a5f]">{m}</th>)}
                <th className="text-center px-2 py-1 text-[#1e3a5f]">Target</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {g.actuals.map((a,i)=>(
                  <td key={i} className={`text-center px-2 py-1.5 font-bold ${
                    a===null?'text-[#1e3a5f]':
                    (g.lowerIsBetter?a<=g.target:a>=g.target)?'text-[#15803d]':'text-red-600'
                  }`}>{a??'—'}</td>
                ))}
                <td className="text-center px-2 py-1.5 font-bold text-[#15803d]">{g.target}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -- Gap Analysis --------------------------------------------------------------
function GapAnalysis({ goals }: { goals: QualityGoal[] }) {
  const behind = goals.filter(g=>goalStatus(g)==='behind');
  const atRisk = goals.filter(g=>goalStatus(g)==='at-risk');
  const achieved = goals.filter(g=>goalStatus(g)==='achieved'||goalStatus(g)==='on-track');

  return (
    <div className="space-y-5 py-4">
      {behind.length>0 && (
        <div className="bg-red-50 border border-red-800/50 rounded-xl p-5">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-4">🔴 Behind Target — Immediate Action Required ({behind.length})</div>
          {behind.map(g=>{
            const latest = latestActual(g);
            const gap = latest===null?'N/A':g.lowerIsBetter
              ? `${latest - g.target} ${g.unit} above target`
              : `${g.target - latest} ${g.unit} below target`;
            return (
              <div key={g.id} className="bg-white border border-red-800/30 rounded-xl p-4 mb-3">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-bold text-white">{g.kpi}</div>
                    <div className="text-xs text-[#1e3a5f]">{g.owner} · Weight: {g.weight}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-600 font-bold text-sm">Gap: {gap}</div>
                    <div className="text-xs text-[#1e3a5f]">Target: {g.target} {g.unit} | Actual: {latest ?? '—'} {g.unit}</div>
                  </div>
                </div>
                <div className="text-xs text-[#1e3a5f] italic">{g.description}</div>
                <div className="mt-3 bg-red-900/20 border border-red-800/30 rounded-lg p-2 text-xs text-red-600">
                  ⚠️ Recommended: Escalate to management review. Root cause analysis required. Action plan with weekly tracking.
                </div>
              </div>
            );
          })}
        </div>
      )}

      {atRisk.length>0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-4">⚠️ At Risk — Corrective Action Needed ({atRisk.length})</div>
          {atRisk.map(g=>{
            const latest = latestActual(g);
            return (
              <div key={g.id} className="bg-white border border-amber-800/30 rounded-xl p-4 mb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white">{g.kpi}</div>
                    <div className="text-xs text-[#1e3a5f]">{g.owner}</div>
                  </div>
                  <div className="text-right text-xs text-[#1e3a5f]">
                    Target: <span className="text-[#15803d] font-bold">{g.target} {g.unit}</span> | Actual: <span className="text-amber-600 font-bold">{latest ?? '—'} {g.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {achieved.length>0 && (
        <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl p-5">
          <div className="text-xs font-bold text-[#15803d] uppercase tracking-wide mb-4">✅ Achieved / On Track ({achieved.length})</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achieved.map(g=>{
              const latest=latestActual(g);
              const st=goalStatus(g);
              return (
                <div key={g.id} className="bg-white border border-emerald-700/50 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">{st==='achieved'?'🏆':'✅'}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{g.kpi}</div>
                    <div className="text-xs text-[#1e3a5f]">Actual: {latest} {g.unit} | Target: {g.target} {g.unit}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${STATUS_STYLE[st]}`}>{st}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -- IATF Guide ----------------------------------------------------------------
function GoalsGuide() {
  const [open, setOpen] = useState<number|null>(0);
  const items = [
    { title:'IATF 16949 Cl. 6.2 — Quality Objectives', content:'Organizations must establish quality objectives at relevant functions, levels, and processes needed for the quality management system. Objectives must be: consistent with quality policy, measurable, consider applicable requirements, relevant to product/service conformity and customer satisfaction, monitored, communicated, and updated as appropriate. For each objective, organization must document: what will be done, resources required, who will be responsible, when it will be completed, how results will be evaluated.' },
    { title:'Quality KPI Selection Best Practice', content:'Customer-facing KPIs (PPM, OTD, Complaints) carry the highest weight — these directly impact customer satisfaction and business continuity. Internal KPIs (FTT, Internal PPM, CAPA closure) drive operational efficiency. Cost KPIs (COPQ) measure the business impact of quality gaps. People KPIs (Training completion) ensure system sustainability. Recommended minimum KPI set: Customer PPM, OTD, Customer Complaints, FTT%, Internal PPM, Supplier PPM, CAPA Closure Rate, COPQ.' },
    { title:'Target-Setting Methodology', content:'Step 1: Start with baseline (previous year actual). Step 2: Benchmark against industry best practice and customer requirements. Step 3: Set stretch but achievable target — typically 30-50% improvement over baseline for poor performers, 5-10% improvement for already-good performers. Step 4: Break annual target into monthly milestones — ensure improvement trajectory is defined. Step 5: Review quarterly — adjust if external conditions change.' },
    { title:'Management Review Integration (Cl. 9.3)', content:'Quality goal performance is a mandatory Management Review input under IATF 9.3.2. Management Review must include: comparison of actual vs target for all quality KPIs, trend analysis (improving / stable / deteriorating), root cause for all KPIs behind target, action plans with owners and dates, resource requirements for improvement. Management Review output must include decisions on goals that need revision.' },
    { title:'Common Audit Findings — Quality Objectives', content:'1. Objectives set but not cascaded to department / process level. 2. Targets set without baseline data — no scientific basis. 3. KPIs tracked monthly but reviewed only annually — no corrective action taken mid-year. 4. No documented action plan for KPIs that are behind target. 5. Quality objectives not communicated to relevant employees. 6. Objectives not updated when customer requirements change. 7. No evidence that objectives influenced process design or resource allocation.' },
  ];
  return (
    <div className="space-y-3 py-4">
      {items.map((s,i)=>(
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

// -- IDs of goals that receive live Supabase actuals --------------------------
const LIVE_GOAL_IDS = new Set(['G-001', 'G-003', 'G-007']);

// -- Main Page -----------------------------------------------------------------
export default function QualityGoalsPage() {
  const [tab, setTab] = useState<'dashboard'|'tracker'|'gap'|'guide'>('dashboard');
  const [goals, setGoals] = useState<QualityGoal[]>(GOALS);
  const [liveStatus, setLiveStatus] = useState<'loading'|'live'|'sample'>('loading');
  const [fetchedAt, setFetchedAt] = useState('');

  // Inject live actuals from Supabase into relevant goals
  const injectLiveData = useCallback((kpis: {
    overview: { ppm: number; closed: number; total: number };
    monthlyTrend: { month: string; complaints: number; closed: number }[];
  }) => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthIdx = now.getMonth(); // 0 = Jan, 7 = Aug

    const currentMonthData = kpis.monthlyTrend.find(m => m.month === currentYM);
    const monthlyComplaints = currentMonthData?.complaints ?? null;
    const closureRate = kpis.overview.total > 0
      ? Math.round((kpis.overview.closed / kpis.overview.total) * 100)
      : null;
    const livePPM = kpis.overview.ppm > 0 ? kpis.overview.ppm : null;

    setGoals(prev => prev.map(g => {
      if (!LIVE_GOAL_IDS.has(g.id)) return g;
      const newActuals = [...g.actuals];
      if (g.id === 'G-001' && livePPM !== null) newActuals[currentMonthIdx] = livePPM;
      if (g.id === 'G-003' && monthlyComplaints !== null) newActuals[currentMonthIdx] = monthlyComplaints;
      if (g.id === 'G-007' && closureRate !== null) newActuals[currentMonthIdx] = closureRate;
      return { ...g, actuals: newActuals };
    }));
  }, []);

  useEffect(() => {
    fetch('/api/quality-kpis')
      .then(r => r.json())
      .then(data => {
        if (data.overview) {
          injectLiveData(data);
          setFetchedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
          setLiveStatus('live');
        } else {
          setLiveStatus('sample');
        }
      })
      .catch(() => setLiveStatus('sample'));
  }, [injectLiveData]);

  const overall = calcOverallScore(goals);
  const behind  = goals.filter(g=>goalStatus(g)==='behind').length;
  const atRisk  = goals.filter(g=>goalStatus(g)==='at-risk').length;

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Live KPI Banner */}
      <div className="px-6 pt-4 max-w-screen-xl mx-auto">
        <LiveKPIBanner />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">🎯 Quality Goals & KPI Master</h1>
              <p className="text-teal-300 text-sm mt-1">Annual quality targets · Monthly actuals · Gap analysis · IATF Cl. 6.2 / 9.1</p>
              {/* Live data status indicator */}
              <div className="mt-2">
                {liveStatus === 'loading' && (
                  <span className="text-xs text-[#1e3a5f] animate-pulse">⏳ Loading live KPI data...</span>
                )}
                {liveStatus === 'live' && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#15803d]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live · Supabase · PPM, Complaints & CAPA Closure auto-calculated · {fetchedAt}
                  </span>
                )}
                {liveStatus === 'sample' && (
                  <span className="text-xs text-amber-600">⚠ Sample data — Supabase unavailable</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <div className={`border-2 rounded-xl px-4 py-2 ${overall>=80?'border-emerald-600 bg-emerald-900/40':overall>=60?'border-amber-300 bg-amber-50':'border-red-300 bg-red-50'}`}>
                <div className={`text-xl font-bold ${overall>=80?'text-[#15803d]':overall>=60?'text-amber-600':'text-red-600'}`}>{overall}%</div>
                <div className="text-xs text-[#1e3a5f]">Overall Score</div>
              </div>
              <div className="bg-teal-900/40 border border-teal-700/50 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{goals.length}</div>
                <div className="text-xs text-teal-300">KPIs Tracked</div>
              </div>
              {(behind+atRisk)>0 && (
                <div className="bg-red-50 border border-red-700/40 rounded-xl px-4 py-2">
                  <div className="text-xl font-bold text-red-600">{behind+atRisk}</div>
                  <div className="text-xs text-[#1e3a5f]">Need Action</div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto flex gap-1 mt-5 border-b border-[#dbeafe]">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'tracker',   label:'📈 KPI Tracker'},
              {id:'gap',       label:'⚡ Gap Analysis'},
              {id:'guide',     label:'📘 IATF Guide'},
            ] as const).map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${tab===t.id?'bg-[#dbeafe] text-white border-b-2 border-blue-500':'text-[#1e3a5f] hover:text-white hover:bg-white'}`}>
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
            {label:'Quality Goals Master Sheet', href:'/downloads/goals/Quality_Goals_Master.xlsx',  color:'#0d9488'},
            {label:'KPI Dashboard Template',     href:'/downloads/goals/KPI_Dashboard_Template.xlsx', color:'#1d4ed8'},
            {label:'Monthly KPI Review',         href:'/downloads/goals/Monthly_KPI_Review.xlsx',     color:'#7c3aed'},
            {label:'Goal Deployment Matrix',     href:'/downloads/goals/Goal_Deployment_Matrix.xlsx', color:'#b45309'},
            {label:'MRM Input Report',           href:'/downloads/goals/MRM_Input_KPI_Report.xlsx',   color:'#dc2626'},
          ].map(f=>(
            <span key={f.label} className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:f.color}}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110">{f.label}</a>
              <a href={f.href} download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110">⬇</a>
            </span>
          ))}
        </div>

        {tab==='dashboard' && <GoalsDashboard goals={goals} />}
        {tab==='tracker'   && <KPITracker goals={goals} />}
        {tab==='gap'       && <GapAnalysis goals={goals} />}
        {tab==='guide'     && <GoalsGuide />}
      </div>

      <QualityCopilot page="analytics" />
    </div>
  );
}
