'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';
import ExportPDF from '../components/ExportPDF';

// -- Types ---------------------------------------------------------------------
type SkillLevel  = 0|1|2|3|4;   // 0=None, 1=Awareness, 2=Basic, 3=Proficient, 4=Expert
type TrainStatus = 'planned'|'in-progress'|'completed'|'overdue';
type Department  = 'quality'|'production'|'engineering'|'logistics'|'maintenance'|'supplier-quality';

interface Employee {
  id: string;
  name: string;
  designation: string;
  department: Department;
  joiningDate: string;
  skills: Record<string, SkillLevel>;  // skillId → level
}

interface Skill {
  id: string;
  name: string;
  category: string;
  requiredLevel: Record<Department, SkillLevel>;  // min required per dept
  iatfClause: string;
  criticality: 'critical'|'important'|'optional';
}

interface TrainingPlan {
  id: string;
  employeeId: string;
  skillId: string;
  trainingTopic: string;
  trainer: string;
  plannedDate: string;
  duration: string;
  status: TrainStatus;
  completionDate: string;
  score: number|null;
  remarks: string;
}

// -- Skills Master -------------------------------------------------------------
const SKILLS: Skill[] = [
  { id:'SK-01', name:'IATF 16949 Awareness', category:'QMS', iatfClause:'7.3', criticality:'critical',
    requiredLevel:{ quality:3, production:2, engineering:3, logistics:2, maintenance:2, 'supplier-quality':3 } },
  { id:'SK-02', name:'PFMEA (AIAG-VDA)', category:'Core Tools', iatfClause:'8.3.2', criticality:'critical',
    requiredLevel:{ quality:4, production:2, engineering:4, logistics:1, maintenance:2, 'supplier-quality':3 } },
  { id:'SK-03', name:'Control Plan', category:'Core Tools', iatfClause:'8.5.1', criticality:'critical',
    requiredLevel:{ quality:4, production:3, engineering:3, logistics:1, maintenance:2, 'supplier-quality':3 } },
  { id:'SK-04', name:'SPC / Cp Cpk', category:'Core Tools', iatfClause:'8.6.1', criticality:'critical',
    requiredLevel:{ quality:4, production:2, engineering:3, logistics:1, maintenance:1, 'supplier-quality':3 } },
  { id:'SK-05', name:'MSA / Gauge R&R', category:'Core Tools', iatfClause:'7.1.5', criticality:'critical',
    requiredLevel:{ quality:4, production:1, engineering:3, logistics:1, maintenance:1, 'supplier-quality':2 } },
  { id:'SK-06', name:'8D Problem Solving', category:'Problem Solving', iatfClause:'10.2', criticality:'critical',
    requiredLevel:{ quality:4, production:3, engineering:3, logistics:2, maintenance:2, 'supplier-quality':3 } },
  { id:'SK-07', name:'5-Why / Root Cause Analysis', category:'Problem Solving', iatfClause:'10.2', criticality:'important',
    requiredLevel:{ quality:4, production:3, engineering:3, logistics:2, maintenance:3, 'supplier-quality':3 } },
  { id:'SK-08', name:'APQP / PPAP', category:'Core Tools', iatfClause:'8.3', criticality:'critical',
    requiredLevel:{ quality:4, production:2, engineering:4, logistics:1, maintenance:1, 'supplier-quality':3 } },
  { id:'SK-09', name:'Internal Auditing (IATF)', category:'QMS', iatfClause:'9.2', criticality:'important',
    requiredLevel:{ quality:4, production:1, engineering:2, logistics:1, maintenance:1, 'supplier-quality':3 } },
  { id:'SK-10', name:'Lean Manufacturing / Kaizen', category:'Manufacturing', iatfClause:'8.5', criticality:'important',
    requiredLevel:{ quality:3, production:4, engineering:3, logistics:2, maintenance:3, 'supplier-quality':2 } },
  { id:'SK-11', name:'OEE / TPM', category:'Manufacturing', iatfClause:'8.5.1', criticality:'important',
    requiredLevel:{ quality:2, production:4, engineering:2, logistics:1, maintenance:4, 'supplier-quality':1 } },
  { id:'SK-12', name:'Quality Cost (COPQ)', category:'QMS', iatfClause:'9.1.1', criticality:'optional',
    requiredLevel:{ quality:3, production:2, engineering:2, logistics:1, maintenance:1, 'supplier-quality':2 } },
];

// -- Employees -----------------------------------------------------------------
const EMPLOYEES: Employee[] = [
  { id:'E-01', name:'Rajesh Kumar', designation:'Quality Head', department:'quality', joiningDate:'2019-04-01',
    skills:{'SK-01':4,'SK-02':4,'SK-03':4,'SK-04':3,'SK-05':3,'SK-06':4,'SK-07':4,'SK-08':4,'SK-09':4,'SK-10':3,'SK-11':2,'SK-12':3} },
  { id:'E-02', name:'Priya Sharma', designation:'IATF Lead Auditor', department:'quality', joiningDate:'2021-06-15',
    skills:{'SK-01':4,'SK-02':3,'SK-03':3,'SK-04':3,'SK-05':2,'SK-06':3,'SK-07':3,'SK-08':3,'SK-09':4,'SK-10':2,'SK-11':1,'SK-12':2} },
  { id:'E-03', name:'Suresh Nair', designation:'Process Quality Engineer', department:'quality', joiningDate:'2022-09-01',
    skills:{'SK-01':3,'SK-02':2,'SK-03':3,'SK-04':2,'SK-05':1,'SK-06':2,'SK-07':3,'SK-08':2,'SK-09':2,'SK-10':2,'SK-11':1,'SK-12':1} },
  { id:'E-04', name:'Vikram Singh', designation:'Manufacturing Quality Engineer', department:'production', joiningDate:'2023-01-10',
    skills:{'SK-01':2,'SK-02':1,'SK-03':2,'SK-04':1,'SK-05':1,'SK-06':2,'SK-07':2,'SK-08':1,'SK-09':1,'SK-10':3,'SK-11':3,'SK-12':1} },
  { id:'E-05', name:'Neha Joshi', designation:'APQP Manager', department:'engineering', joiningDate:'2020-11-20',
    skills:{'SK-01':3,'SK-02':4,'SK-03':3,'SK-04':2,'SK-05':2,'SK-06':3,'SK-07':3,'SK-08':4,'SK-09':2,'SK-10':2,'SK-11':1,'SK-12':2} },
  { id:'E-06', name:'Amit Verma', designation:'Supplier Quality Manager', department:'supplier-quality', joiningDate:'2021-03-01',
    skills:{'SK-01':3,'SK-02':3,'SK-03':3,'SK-04':2,'SK-05':2,'SK-06':3,'SK-07':3,'SK-08':3,'SK-09':3,'SK-10':2,'SK-11':1,'SK-12':2} },
  { id:'E-07', name:'Ravi Patel', designation:'Production Supervisor', department:'production', joiningDate:'2020-07-15',
    skills:{'SK-01':2,'SK-02':1,'SK-03':2,'SK-04':1,'SK-05':0,'SK-06':2,'SK-07':2,'SK-08':1,'SK-09':1,'SK-10':3,'SK-11':3,'SK-12':1} },
  { id:'E-08', name:'Anita Desai', designation:'Maintenance Engineer', department:'maintenance', joiningDate:'2022-04-01',
    skills:{'SK-01':1,'SK-02':0,'SK-03':1,'SK-04':0,'SK-05':0,'SK-06':1,'SK-07':2,'SK-08':0,'SK-09':0,'SK-10':2,'SK-11':3,'SK-12':0} },
];

const TRAINING_PLANS: TrainingPlan[] = [
  { id:'TP-001', employeeId:'E-03', skillId:'SK-05', trainingTopic:'MSA / Gauge R&R Practical Workshop', trainer:'External — AIAG Certified', plannedDate:'2026-08-20', duration:'2 days', status:'planned', completionDate:'', score:null, remarks:'' },
  { id:'TP-002', employeeId:'E-04', skillId:'SK-02', trainingTopic:'PFMEA AIAG-VDA 2019 — Fundamentals', trainer:'Quality Head', plannedDate:'2026-08-28', duration:'1 day', status:'planned', completionDate:'', score:null, remarks:'' },
  { id:'TP-003', employeeId:'E-07', skillId:'SK-04', trainingTopic:'SPC Basics — Control Charts & Cpk', trainer:'Quality Head', plannedDate:'2026-07-15', duration:'1 day', status:'overdue', completionDate:'', score:null, remarks:'Employee on leave — rescheduled to Sep' },
  { id:'TP-004', employeeId:'E-08', skillId:'SK-01', trainingTopic:'IATF 16949 Awareness Training', trainer:'Priya Sharma (IATF Lead)', plannedDate:'2026-08-31', duration:'4 hours', status:'in-progress', completionDate:'', score:null, remarks:'' },
  { id:'TP-005', employeeId:'E-03', skillId:'SK-02', trainingTopic:'PFMEA Advanced — AP Risk Analyser', trainer:'External — AIAG Certified', plannedDate:'2026-06-10', duration:'2 days', status:'completed', completionDate:'2026-06-11', score:85, remarks:'Passed assessment' },
  { id:'TP-006', employeeId:'E-06', skillId:'SK-09', trainingTopic:'Internal Auditor Certification (IATF)', trainer:'External — BV Certification', plannedDate:'2026-05-20', duration:'3 days', status:'completed', completionDate:'2026-05-22', score:92, remarks:'Certified Internal Auditor' },
];

// -- Helpers -------------------------------------------------------------------
const LEVEL_LABELS: Record<SkillLevel, string> = { 0:'None', 1:'Awareness', 2:'Basic', 3:'Proficient', 4:'Expert' };
const LEVEL_COLORS: Record<SkillLevel, string> = {
  0:'bg-[#dbeafe] text-[#1e3a5f]', 1:'bg-red-900/60 text-red-700',
  2:'bg-amber-50 text-amber-700', 3:'bg-[#eff6ff]/60 text-[#1d4ed8]', 4:'bg-emerald-50/60 text-emerald-700'
};
const LEVEL_BAR: Record<SkillLevel, string> = {
  0:'bg-slate-600', 1:'bg-red-500', 2:'bg-amber-500', 3:'bg-blue-500', 4:'bg-emerald-500'
};
const DEPT_LABEL: Record<Department, string> = {
  quality:'Quality', production:'Production', engineering:'Engineering',
  logistics:'Logistics', maintenance:'Maintenance', 'supplier-quality':'Supplier Quality'
};
const STATUS_STYLE: Record<TrainStatus, string> = {
  planned:'bg-[#eff6ff] text-[#1d4ed8]', 'in-progress':'bg-amber-50 text-amber-700',
  completed:'bg-emerald-50/50 text-emerald-700', overdue:'bg-red-900/60 text-red-700 font-bold'
};

function gap(emp: Employee, skill: Skill): number {
  const required = skill.requiredLevel[emp.department] ?? 0;
  const actual   = emp.skills[skill.id] ?? 0;
  return Math.max(0, required - actual);
}

function empOverallGap(emp: Employee): number {
  return SKILLS.reduce((s, sk) => s + gap(emp, sk), 0);
}

function empCompliancePct(emp: Employee): number {
  const total = SKILLS.filter(sk => (sk.requiredLevel[emp.department] ?? 0) > 0).length;
  if (total === 0) return 100;
  const met   = SKILLS.filter(sk => {
    const req = sk.requiredLevel[emp.department] ?? 0;
    return req > 0 && (emp.skills[sk.id] ?? 0) >= req;
  }).length;
  return Math.round(met / total * 100);
}

// -- Dashboard -----------------------------------------------------------------
function TNADashboard({ employees, plans }: { employees: Employee[]; plans: TrainingPlan[] }) {
  const avgCompliance = Math.round(employees.reduce((s, e) => s + empCompliancePct(e), 0) / employees.length);
  const totalGaps     = employees.reduce((s, e) => s + empOverallGap(e), 0);
  const overdueCount  = plans.filter(p => p.status === 'overdue').length;
  const completedPct  = Math.round(plans.filter(p => p.status === 'completed').length / plans.length * 100);

  // Gap by skill
  const skillGaps = SKILLS.map(sk => ({
    skill: sk,
    totalGap: employees.reduce((s, e) => s + gap(e, sk), 0),
    empCount: employees.filter(e => gap(e, sk) > 0).length,
  })).sort((a, b) => b.totalGap - a.totalGap);

  const maxGap = Math.max(...skillGaps.map(s => s.totalGap), 1);

  return (
      <>
      <PageTitle title="Training Needs" />
      <div className="space-y-5 py-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Avg Competency Compliance', value:`${avgCompliance}%`, sub:`${employees.length} employees`, color:avgCompliance>=80?'text-emerald-600':avgCompliance>=60?'text-amber-600':'text-red-600', bg:'border-orange-800/30 bg-orange-900/30/20' },
          { label:'Total Skill Gaps Identified', value:totalGaps, sub:'across all employees', color:totalGaps===0?'text-emerald-600':totalGaps<20?'text-amber-600':'text-red-600', bg:'border-orange-800/30 bg-orange-900/30/20' },
          { label:'Training Plan Completion',   value:`${completedPct}%`, sub:`${plans.filter(p=>p.status==='completed').length}/${plans.length} sessions`, color:completedPct>=80?'text-emerald-600':completedPct>=50?'text-amber-600':'text-red-600', bg:'border-orange-800/30 bg-orange-900/30/20' },
          { label:'Overdue Training Sessions',  value:overdueCount, sub:'need rescheduling', color:overdueCount===0?'text-emerald-600':'text-red-600', bg:overdueCount>0?'border-red-700/50 bg-red-50':'border-orange-800/30 bg-orange-900/30/20' },
        ].map(k=>(
          <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Top skill gaps */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Top Skill Gaps — Training Priority (Pareto)</div>
        {skillGaps.filter(s=>s.totalGap>0).map((s, i) => {
          const colors = ['bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-lime-500'];
          const color  = i<2?colors[0]:i<4?colors[1]:i<6?colors[2]:colors[3];
          return (
            <div key={s.skill.id} className="flex items-center gap-3 mb-2.5">
              <span className="text-xs font-bold text-[#1e3a5f] w-4">{i+1}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold shrink-0 ${s.skill.criticality==='critical'?'bg-red-50 text-red-700':s.skill.criticality==='important'?'bg-amber-50 text-amber-700':'bg-[#dbeafe] text-[#1e3a5f]'}`}>{s.skill.criticality}</span>
              <span className="flex-1 text-xs text-[#1e3a5f] truncate">{s.skill.name}</span>
              <span className="text-xs text-[#1e3a5f] shrink-0">{s.empCount} emp</span>
              <div className="w-28 bg-[#dbeafe] rounded-full h-2 shrink-0">
                <div className={`${color} h-2 rounded-full`} style={{width:`${Math.round(s.totalGap/maxGap*100)}%`}}/>
              </div>
              <span className="text-xs font-bold text-[#1e3a5f] w-4 text-right">{s.totalGap}</span>
            </div>
          );
        })}
      </div>

      {/* Employee compliance ranking */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Employee Competency Compliance Ranking</div>
        {[...employees].sort((a,b)=>empCompliancePct(a)-empCompliancePct(b)).map(e=>{
          const pct = empCompliancePct(e);
          const gapCount = empOverallGap(e);
          return (
            <div key={e.id} className="flex items-center gap-3 mb-2.5">
              <div className="min-w-0 w-40 shrink-0">
                <div className="text-xs font-semibold text-white truncate">{e.name}</div>
                <div className="text-xs text-[#1e3a5f] truncate">{e.designation}</div>
              </div>
              <span className="text-xs text-[#1e3a5f] w-24 shrink-0">{DEPT_LABEL[e.department]}</span>
              <div className="flex-1 bg-[#dbeafe] rounded-full h-2">
                <div className="h-2 rounded-full" style={{width:`${pct}%`,background:pct>=80?'#10b981':pct>=60?'#f59e0b':'#ef4444'}}/>
              </div>
              <span className={`text-xs font-bold w-10 text-right ${pct>=80?'text-emerald-600':pct>=60?'text-amber-600':'text-red-600'}`}>{pct}%</span>
              <span className="text-xs text-[#1e3a5f] w-16 text-right">{gapCount} gaps</span>
            </div>
          );
        })}
      </div>

      {/* Maturity */}
      <div className="bg-orange-900/30 border border-orange-900 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 Training & Competency Maturity — IATF Cl. 7.2 / 7.3</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Avg Compliance',       score:avgCompliance, target:90 },
            { label:'Training Completion',  score:completedPct,  target:85 },
            { label:'Zero Overdue',         score:overdueCount===0?100:Math.max(0,100-overdueCount*20), target:100 },
            { label:'Critical Skills Met',  score:Math.round(employees.reduce((s,e)=>s+SKILLS.filter(sk=>sk.criticality==='critical'&&(sk.requiredLevel[e.department]??0)>0&&(e.skills[sk.id]??0)>=(sk.requiredLevel[e.department]??0)).length,0)/Math.max(1,employees.reduce((s,e)=>s+SKILLS.filter(sk=>sk.criticality==='critical'&&(sk.requiredLevel[e.department]??0)>0).length,0))*100), target:100 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-orange-900/30 rounded-xl p-3 text-center">
                <div className="text-xs text-orange-600 mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-orange-600 mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-orange-900/30 rounded-full h-1.5">
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

// -- Skill Matrix --------------------------------------------------------------
function SkillMatrix({ employees }: { employees: Employee[] }) {
  const [deptFilter, setDeptFilter] = useState<'all'|Department>('all');
  const filtered = deptFilter==='all' ? employees : employees.filter(e=>e.department===deptFilter);

  return (
    <div className="space-y-4 py-4">
      {/* Department filter + Export */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all',...Object.keys(DEPT_LABEL)] as ('all'|Department)[]).map(d=>(
            <button key={d} onClick={()=>setDeptFilter(d as typeof deptFilter)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${deptFilter===d?'bg-orange-700 text-white':'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
              {d==='all'?'All Departments':DEPT_LABEL[d as Department]}
            </button>
          ))}
        </div>
        <ExportPDF
          targetId="skill-matrix-print"
          label="Export Skill Matrix PDF"
          filename={`Skill_Matrix_${deptFilter}_${new Date().toISOString().slice(0,10)}`}
          color="#b45309"
          size="sm"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {([0,1,2,3,4] as SkillLevel[]).map(l=>(
          <span key={l} className={`text-xs px-2 py-0.5 rounded font-bold ${LEVEL_COLORS[l]}`}>{l} — {LEVEL_LABELS[l]}</span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-800 text-white ml-2">⚠ Gap</span>
      </div>

      {/* Matrix table */}
      <div id="skill-matrix-print">
      <div className="bg-white border border-[#dbeafe] rounded-xl overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#dbeafe]">
              <th className="text-left px-3 py-2 text-[#1e3a5f] font-bold whitespace-nowrap sticky left-0 bg-white z-10">Employee</th>
              <th className="text-left px-2 py-2 text-[#1e3a5f] font-bold whitespace-nowrap">Dept</th>
              {SKILLS.map(sk=>(
                <th key={sk.id} className="text-center px-1 py-2 text-[#1e3a5f] font-bold">
                  <div className="w-16 text-center leading-tight" style={{writingMode:'vertical-rl',transform:'rotate(180deg)',height:'80px',fontSize:'9px'}}>
                    {sk.name}
                  </div>
                </th>
              ))}
              <th className="text-center px-3 py-2 text-[#1e3a5f] font-bold whitespace-nowrap">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp=>{
              const pct = empCompliancePct(emp);
              return (
                <tr key={emp.id} className="border-b border-[#dbeafe] hover:bg-[#dbeafe]/20">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10">
                    <div className="font-semibold text-white whitespace-nowrap">{emp.name}</div>
                    <div className="text-[#1e3a5f]" style={{fontSize:'9px'}}>{emp.designation}</div>
                  </td>
                  <td className="px-2 py-2 text-[#1e3a5f] whitespace-nowrap">{DEPT_LABEL[emp.department]}</td>
                  {SKILLS.map(sk=>{
                    const actual   = (emp.skills[sk.id] ?? 0) as SkillLevel;
                    const required = sk.requiredLevel[emp.department] ?? 0;
                    const hasGap   = required > 0 && actual < required;
                    return (
                      <td key={sk.id} className="px-1 py-2 text-center">
                        <span className={`inline-block w-6 h-6 rounded font-bold text-xs flex items-center justify-center ${LEVEL_COLORS[actual]} ${hasGap?'ring-1 ring-red-500':''}`}>
                          {actual}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <span className={`font-bold text-sm ${pct>=80?'text-emerald-600':pct>=60?'text-amber-600':'text-red-600'}`}>{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#dbeafe] bg-[#eff6ff]">
              <td className="px-3 py-2 text-xs font-bold text-[#1e3a5f] sticky left-0 bg-[#eff6ff]">Required Level</td>
              <td className="px-2 py-2"/>
              {SKILLS.map(sk=>(
                <td key={sk.id} className="px-1 py-2 text-center">
                  <span className="text-xs font-bold text-[#1e3a5f]">{Object.values(sk.requiredLevel).join('/')}</span>
                </td>
              ))}
              <td/>
            </tr>
          </tfoot>
        </table>
      </div>
      </div>{/* end skill-matrix-print */}
      <div className="text-xs text-[#1e3a5f]">Red ring = gap vs department requirement · Numbers show actual skill level (0–4)</div>
    </div>
  );
}

// -- Training Plan -------------------------------------------------------------
function TrainingPlanTab({ plans, employees }: { plans: TrainingPlan[]; employees: Employee[] }) {
  const [filter, setFilter] = useState<'all'|TrainStatus>('all');
  const filtered = filter==='all' ? plans : plans.filter(p=>p.status===filter);
  const empMap = Object.fromEntries(employees.map(e=>[e.id,e]));
  const skillMap = Object.fromEntries(SKILLS.map(s=>[s.id,s]));

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-wrap gap-2">
        {(['all','planned','in-progress','completed','overdue'] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${filter===f?'bg-orange-700 text-white':'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
            {f==='all'?`All (${plans.length})`:f==='planned'?`Planned (${plans.filter(p=>p.status==='planned').length})`:f==='in-progress'?`In Progress (${plans.filter(p=>p.status==='in-progress').length})`:f==='completed'?`Completed (${plans.filter(p=>p.status==='completed').length})`:`Overdue (${plans.filter(p=>p.status==='overdue').length})`}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#dbeafe] rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#dbeafe]">
              {['ID','Employee','Department','Topic','Trainer','Date','Duration','Status','Score'].map(h=>(
                <th key={h} className="text-left px-3 py-2 text-[#1e3a5f] font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p=>{
              const emp  = empMap[p.employeeId];
              const skill= skillMap[p.skillId];
              return (
                <tr key={p.id} className={`border-b border-[#dbeafe] hover:bg-[#dbeafe]/20 ${p.status==='overdue'?'bg-red-50':''}`}>
                  <td className="px-3 py-2 font-mono text-[#1e3a5f]">{p.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-white whitespace-nowrap">{emp?.name}</div>
                    <div className="text-[#1e3a5f]">{emp?.designation}</div>
                  </td>
                  <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{emp?DEPT_LABEL[emp.department]:'-'}</td>
                  <td className="px-3 py-2">
                    <div className="text-white font-semibold">{p.trainingTopic}</div>
                    <div className="text-[#1e3a5f]">{skill?.name}</div>
                  </td>
                  <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{p.trainer}</td>
                  <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{p.status==='completed'?p.completionDate:p.plannedDate}</td>
                  <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{p.duration}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[p.status]}`}>{p.status.replace('-',' ')}</span>
                  </td>
                  <td className="px-3 py-2 font-bold text-center">
                    {p.score!==null?<span className={p.score>=80?'text-emerald-600':p.score>=60?'text-amber-600':'text-red-600'}>{p.score}%</span>:<span className="text-[#1e3a5f]">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Planned', count:plans.filter(p=>p.status==='planned').length, color:'text-blue-600'},
          {label:'In Progress', count:plans.filter(p=>p.status==='in-progress').length, color:'text-amber-600'},
          {label:'Completed', count:plans.filter(p=>p.status==='completed').length, color:'text-emerald-600'},
          {label:'Overdue', count:plans.filter(p=>p.status==='overdue').length, color:'text-red-600'},
        ].map(s=>(
          <div key={s.label} className="bg-white border border-[#dbeafe] rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-[#1e3a5f]">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- IATF Guide ----------------------------------------------------------------
function TNAGuide() {
  const [open, setOpen] = useState<number|null>(0);
  const items = [
    { title:'IATF 16949 Cl. 7.2 — Competence', content:'Organizations must: (a) determine necessary competence of persons doing work that affects QMS performance, (b) ensure these persons are competent on the basis of education, training, or experience, (c) where applicable, take action to acquire necessary competence and evaluate effectiveness of actions, (d) retain documented information as evidence of competence. For IATF specifically: competence must be documented for all roles affecting product quality — operators, inspectors, engineers, auditors, suppliers.' },
    { title:'IATF 16949 Cl. 7.3 — Awareness', content:'All persons doing work under the organization\'s control shall be aware of: quality policy, relevant quality objectives, their contribution to QMS effectiveness including benefits of improved performance, implications of not conforming to QMS requirements. Awareness training must be documented — attendance record, date, topics covered, trainer signature. New joiner awareness training must happen within 30 days of joining.' },
    { title:'Training Needs Analysis — Best Practice Process', content:'Step 1: Build skill requirements matrix — list all skills required per role/department. Step 2: Assess current competency of all employees against requirements. Step 3: Identify gaps (required level > actual level). Step 4: Prioritize by: criticality (critical > important > optional), size of gap, number of employees affected. Step 5: Build training plan — topic, trainer (internal/external), date, duration, assessment method. Step 6: Execute training. Step 7: Evaluate effectiveness (test score, practical assessment, on-job observation). Step 8: Update skill matrix.' },
    { title:'Training Effectiveness Evaluation', content:'Training is only IATF-compliant if effectiveness is verified. Methods: Written test (score ≥70% pass), Practical demonstration (supervisor sign-off), On-job assessment at 30/60/90 days, Customer complaint or defect reduction after training. Evidence of effectiveness evaluation must be retained as documented information. Simply having an attendance record is NOT sufficient for IATF auditors.' },
    { title:'Common Audit Findings — Training & Competency', content:'1. No formal TNA process — training done ad-hoc without gap analysis. 2. Skill matrix not updated — reflects old roles or old employees. 3. Training records missing for operators on critical processes. 4. Training effectiveness not evaluated — only attendance recorded. 5. New joiner training not completed within 30 days. 6. Awareness training records missing for shop floor operators. 7. Competency of temporary/contract workers not defined or verified. 8. Critical skill gaps identified but no training plan in place.' },
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

// -- Main Page -----------------------------------------------------------------
export default function TrainingNeedsPage() {
  const [tab, setTab] = useState<'dashboard'|'matrix'|'plan'|'guide'>('dashboard');
  const [employees] = useState<Employee[]>(EMPLOYEES);
  const [plans]     = useState<TrainingPlan[]>(TRAINING_PLANS);

  const avgCompliance  = Math.round(employees.reduce((s,e)=>s+empCompliancePct(e),0)/employees.length);
  const overdueCount   = plans.filter(p=>p.status==='overdue').length;
  const totalGaps      = employees.reduce((s,e)=>s+empOverallGap(e),0);

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">🎓 Training Needs Analysis</h1>
              <p className="text-orange-600 text-sm mt-1">Skill matrix · Competency gaps · Training plan · Effectiveness tracking — IATF Cl. 7.2 / 7.3</p>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <div className={`border-2 rounded-xl px-4 py-2 ${avgCompliance>=80?'border-emerald-600 bg-emerald-50':avgCompliance>=60?'border-amber-300 bg-amber-50':'border-red-300 bg-red-50'}`}>
                <div className={`text-xl font-bold ${avgCompliance>=80?'text-emerald-700':avgCompliance>=60?'text-amber-700':'text-red-700'}`}>{avgCompliance}%</div>
                <div className="text-xs text-[#1e3a5f]">Avg Compliance</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-300/40 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{totalGaps}</div>
                <div className="text-xs text-orange-600">Skill Gaps</div>
              </div>
              {overdueCount>0 && (
                <div className="bg-red-50 border border-red-700/40 rounded-xl px-4 py-2">
                  <div className="text-xl font-bold text-red-700">{overdueCount}</div>
                  <div className="text-xs text-[#1e3a5f]">Overdue</div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto flex gap-1 mt-5 border-b border-[#dbeafe]">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'matrix',    label:'📋 Skill Matrix'},
              {id:'plan',      label:'📅 Training Plan'},
              {id:'guide',     label:'📘 IATF Guide'},
            ] as const).map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${tab===t.id?'bg-white text-[#1d4ed8] border-b-2 border-blue-600':'text-orange-600 hover:text-[#0f172a] hover:bg-[#eff6ff]'}`}>
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
            {label:'Skill Matrix Template',     href:'/downloads/training/Skill_Matrix_Template.xlsx',       color:'#b45309'},
            {label:'TNA Report',                href:'/downloads/training/TNA_Report.xlsx',                   color:'#dc2626'},
            {label:'Training Plan Template',    href:'/downloads/training/Training_Plan_Template.xlsx',       color:'#059669'},
            {label:'Training Record Form',      href:'/downloads/training/Training_Record_Form.xlsx',         color:'#1d4ed8'},
            {label:'Effectiveness Evaluation',  href:'/downloads/training/Training_Effectiveness_Form.xlsx',  color:'#7c3aed'},
          ].map(f=>(
            <span key={f.label} className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:f.color}}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110">{f.label}</a>
              <a href={f.href} download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110">⬇</a>
            </span>
          ))}
        </div>

        {tab==='dashboard' && <TNADashboard employees={employees} plans={plans} />}
        {tab==='matrix'    && <SkillMatrix employees={employees} />}
        {tab==='plan'      && <TrainingPlanTab plans={plans} employees={employees} />}
        {tab==='guide'     && <TNAGuide />}
      </div>

      <QualityCopilot page="training" />
    </div>
  );
}
