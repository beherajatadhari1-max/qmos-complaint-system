'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ---------------------------------------------------------------------
type Category = 'customer-complaint'|'supplier-issue'|'audit-finding'|'internal-ncr'|'warranty'|'launch-issue'|'process-failure'|'safety';
type Severity  = 'critical'|'major'|'minor';
type Status    = 'open'|'closed'|'verified';
type Department = 'quality'|'production'|'supplier-quality'|'engineering'|'logistics'|'maintenance';

interface LessonLearned {
  id: string;
  date: string;
  title: string;
  category: Category;
  severity: Severity;
  department: Department;
  status: Status;
  // Problem
  problemStatement: string;
  partNumber: string;
  partName: string;
  customer: string;
  // Analysis
  rootCause: string;
  escapePoint: string;           // Where detection failed
  detectMethod: string;          // How it was eventually detected
  // Actions
  immediateContainment: string;
  correctiveAction: string;
  preventiveAction: string;
  // Cascade
  cascadedToFMEA: boolean;
  cascadedToControlPlan: boolean;
  cascadedToSimilarParts: boolean;
  // Outcome
  verificationMethod: string;
  effectivenessDate: string;
  costSaved: number;             // INR — estimated cost of recurrence prevented
  tags: string[];                // searchable tags
  addedBy: string;
}

// -- Sample Data ---------------------------------------------------------------
const SAMPLE_LL: LessonLearned[] = [
  {
    id:'LL-001', date:'2026-02-10', title:'Dimensional OOT due to tool wear — no SPC monitoring',
    category:'customer-complaint', severity:'major', department:'quality', status:'verified',
    problemStatement:'Bracket hole position shifted by 0.8mm causing fitment failure at Tata Motors assembly line. 48 units returned. Customer stopped line for 2 hours.',
    partNumber:'BKT-A001', partName:'Mounting Bracket', customer:'Tata Motors Ltd.',
    rootCause:'Tool wear on Op-20 punching die progressed beyond acceptable limit. No SPC chart was monitoring hole position — only visual check every 2 hours.',
    escapePoint:'Op-20 final check — operator did visual check, dimensional drift was sub-visual',
    detectMethod:'Customer assembly line fitment failure — detected at vehicle assembly',
    immediateContainment:'100% inspection of all stock and WIP. Suspect lots quarantined. Tool replaced immediately.',
    correctiveAction:'SPC control chart implemented on Op-20 hole position. Tool change frequency reduced from 5000 to 3000 shots. PFMEA updated with new detection control.',
    preventiveAction:'All critical dimensions on sheet metal parts to have SPC monitoring. Tool life tracking system implemented in ERP.',
    cascadedToFMEA:true, cascadedToControlPlan:true, cascadedToSimilarParts:true,
    verificationMethod:'Cpk study at 500 shots — Cpk 1.72 achieved. Customer confirmed no recurrence in 3 months.',
    effectivenessDate:'2026-05-10', costSaved:450000,
    tags:['tool-wear','spc','dimensional','sheet-metal','tata','fitment'],
    addedBy:'Rajesh Kumar — Quality Head',
  },
  {
    id:'LL-002', date:'2026-03-05', title:'Material grade substitution without 4M change notification',
    category:'supplier-issue', severity:'critical', department:'supplier-quality', status:'verified',
    problemStatement:'Supplier substituted steel grade from EN8 to EN6 without raising 4M change or informing customer. Material tensile strength 15% below specification. Detected after field failure in Tata Safari.',
    partNumber:'PLT-D044', partName:'Plate Assembly', customer:'Tata Motors Ltd.',
    rootCause:'Supplier procurement changed material source due to availability. No internal process at supplier for 4M change management. Supplier QA not involved in procurement decisions.',
    escapePoint:'Incoming inspection — MTC accepted without grade verification against drawing specification',
    detectMethod:'Field failure — customer warranty return after 6 months in service',
    immediateContainment:'Recall of all field units. 100% material verification. All supplier stock quarantined.',
    correctiveAction:'Supplier SCAR raised. Mandatory 4M change process implemented at supplier. Material grade verification added to IQC checklist. MTC review by QE mandatory.',
    preventiveAction:'All suppliers to submit 4M change form minimum 4 weeks before change implementation. Supplier QMS audit conducted. New clause added to purchase order terms.',
    cascadedToFMEA:true, cascadedToControlPlan:true, cascadedToSimilarParts:true,
    verificationMethod:'Supplier 4M change process audit passed. 6-month monitoring — zero material substitutions.',
    effectivenessDate:'2026-06-05', costSaved:1200000,
    tags:['4m-change','material','supplier','recall','incoming-inspection','mta'],
    addedBy:'Amit Verma — Supplier Quality Manager',
  },
  {
    id:'LL-003', date:'2026-04-12', title:'Pre-treatment pH drift causing paint adhesion failure',
    category:'process-failure', severity:'major', department:'production', status:'closed',
    problemStatement:'220 units returned from Maruti Suzuki for paint peeling after 3 months in service. Pre-treatment bath pH had drifted to 4.2 (spec: 4.8–5.2) undetected for 4 hours.',
    partNumber:'KNB-F011', partName:'Knob Assembly', customer:'Maruti Suzuki',
    rootCause:'pH sensor calibration overdue by 3 weeks. Last reading was 2 hours before shift end. Operator did not re-check after bath chemical top-up.',
    escapePoint:'Pre-treatment verification — pH log only checked every 2 hours, drift happened within that window',
    detectMethod:'Customer warranty return — adhesion test failure in field',
    immediateContainment:'Stop production. 100% cross-hatch adhesion test on all finished stock. Sort and quarantine suspect batches.',
    correctiveAction:'pH monitoring frequency increased to every 30 minutes. Auto-alarm set at pH < 4.6. Calibration PM schedule reduced from monthly to fortnightly.',
    preventiveAction:'pH sensor calibration included in daily pre-shift checklist. Auto-dosing system evaluated for future investment.',
    cascadedToFMEA:true, cascadedToControlPlan:true, cascadedToSimilarParts:false,
    verificationMethod:'3-month monitoring — pH within spec 100% of readings. Zero adhesion complaints.',
    effectivenessDate:'2026-07-12', costSaved:280000,
    tags:['paint','ph','pre-treatment','calibration','adhesion','maruti'],
    addedBy:'Suresh Nair — Process Quality Engineer',
  },
  {
    id:'LL-004', date:'2026-05-20', title:'Casting porosity — process parameters drifted during night shift',
    category:'internal-ncr', severity:'critical', department:'production', status:'verified',
    problemStatement:'12 housing bodies found with internal porosity voids during X-Ray inspection before dispatch. Process parameter log showed pressure dropped during night shift changeover.',
    partNumber:'HSG-C017', partName:'Housing Body', customer:'Mahindra & Mahindra',
    rootCause:'Casting machine pressure relief valve partially stuck. Night shift operator did not verify parameters after machine restart post-maintenance. Shift handover checklist not completed.',
    escapePoint:'In-process inspection — X-Ray sampling was 5% — affected batch had no sampled units',
    detectMethod:'Final inspection X-Ray before dispatch — sampled 2 units from affected lot',
    immediateContainment:'Full batch quarantine. 100% X-Ray on all suspect castings. Machine maintenance conducted.',
    correctiveAction:'Process parameter auto-logging implemented. Critical parameters locked — operator cannot run without within-spec confirmation. X-Ray sampling increased to 10% on critical parts.',
    preventiveAction:'Machine restart checklist made mandatory (Poka-yoke — production system will not allow run without checklist completion). Shift handover audit added.',
    cascadedToFMEA:true, cascadedToControlPlan:true, cascadedToSimilarParts:true,
    verificationMethod:'30-day process capability study — Cp 1.65, Cpk 1.58. Zero porosity in next 500 units.',
    effectivenessDate:'2026-07-20', costSaved:680000,
    tags:['casting','porosity','process-parameters','night-shift','x-ray','handover'],
    addedBy:'Vikram Singh — Manufacturing Quality',
  },
  {
    id:'LL-005', date:'2026-06-15', title:'PPAP approved without validating special characteristic Cpk',
    category:'launch-issue', severity:'major', department:'quality', status:'closed',
    problemStatement:'New part launched to Toyota production without verifying Cpk of SC dimension (thread depth). Production failures detected at Toyota after 3 weeks of supply. Cpk was 0.92 — below 1.67 required.',
    partNumber:'THD-G022', partName:'Threaded Insert', customer:'Toyota Kirloskar',
    rootCause:'PPAP PSW signed off by Quality Engineer without reviewing SPC study for all SCs. Only dimensional layout checked. SPC study file was in shared drive but not reviewed.',
    escapePoint:'PPAP approval gate — PPAP checklist had SPC as requirement but no mandatory review step',
    detectMethod:'Customer production failure — thread gaging failure at Toyota line',
    immediateContainment:'Supply stopped. 100% gaging on all stock. Process parameters reviewed and adjusted.',
    correctiveAction:'PPAP approval process redesigned — SPC study mandatory review for all SC/CC dimensions with documented sign-off by Quality Head. PSW cannot be raised without Cpk ≥ 1.67 confirmed.',
    preventiveAction:'PPAP readiness score tool developed in QMOS — SC Cpk verification is Gate 4 — PSW blocked until green.',
    cascadedToFMEA:false, cascadedToControlPlan:true, cascadedToSimilarParts:true,
    verificationMethod:'PPAP resubmitted. Toyota PSW approved. Process stable at Cpk 1.72 for 3 months.',
    effectivenessDate:'2026-08-01', costSaved:520000,
    tags:['ppap','cpk','special-characteristic','toyota','launch','spc','psw'],
    addedBy:'Neha Joshi — APQP Manager',
  },
  {
    id:'LL-006', date:'2026-07-08', title:'Audit finding — FMEA not updated after engineering change',
    category:'audit-finding', severity:'minor', department:'engineering', status:'open',
    problemStatement:'IATF surveillance audit found PFMEA for BKT series not updated after hole diameter increased by 0.2mm per ECR-2025-047. Control plan also not updated. Minor NC raised.',
    partNumber:'BKT-A001', partName:'Mounting Bracket', customer:'All',
    rootCause:'Engineering change management process gap — ECR approval does not trigger automatic FMEA/CP review. QE responsible for update was on leave, no backup assigned.',
    escapePoint:'Engineering change approval — no mandatory FMEA impact review in ECR workflow',
    detectMethod:'IATF 16949 external surveillance audit',
    immediateContainment:'PFMEA and Control Plan updated within 24 hours. Evidence submitted to auditor.',
    correctiveAction:'ECR approval workflow updated — FMEA impact review is mandatory step before ECR can be approved. QE backup assignment mandatory for all open actions.',
    preventiveAction:'Monthly FMEA vs drawing revision audit added to internal audit schedule.',
    cascadedToFMEA:true, cascadedToControlPlan:true, cascadedToSimilarParts:false,
    verificationMethod:'Pending — follow-up audit scheduled for Sep 2026.',
    effectivenessDate:'2026-09-15', costSaved:0,
    tags:['iatf','audit','fmea','engineering-change','ecr','control-plan'],
    addedBy:'Priya Sharma — IATF Lead Auditor',
  },
];

const CAT_COLORS: Record<Category,string> = {
  'customer-complaint':'bg-red-50 text-red-700',
  'supplier-issue':'bg-orange-900/30 text-orange-600',
  'audit-finding':'bg-[#eff6ff] text-[#1d4ed8]',
  'internal-ncr':'bg-purple-900/30 text-purple-300',
  'warranty':'bg-pink-50 text-pink-700',
  'launch-issue':'bg-amber-50 text-amber-700',
  'process-failure':'bg-yellow-900/30 text-yellow-300',
  'safety':'bg-rose-900/70 text-rose-200',
};
const SEV_COLORS: Record<Severity,string> = {
  critical:'bg-red-100 text-red-700', major:'bg-amber-100 text-amber-700', minor:'bg-blue-100 text-[#1d4ed8]'
};
const STATUS_COLORS: Record<Status,string> = {
  open:'bg-red-50 text-red-700', closed:'bg-[#eff6ff] text-[#1d4ed8]', verified:'bg-emerald-50/50 text-emerald-700'
};
const CAT_LABELS: Record<Category,string> = {
  'customer-complaint':'Customer Complaint','supplier-issue':'Supplier Issue','audit-finding':'Audit Finding',
  'internal-ncr':'Internal NCR','warranty':'Warranty','launch-issue':'Launch Issue',
  'process-failure':'Process Failure','safety':'Safety',
};

// -- Dashboard -----------------------------------------------------------------
function LLDashboard({ lessons }: { lessons: LessonLearned[] }) {
  const total = lessons.length;
  const verified = lessons.filter(l=>l.status==='verified').length;
  const open = lessons.filter(l=>l.status==='open').length;
  const totalSaved = lessons.reduce((s,l)=>s+l.costSaved,0);
  const cascadeRate = total>0?Math.round(lessons.filter(l=>l.cascadedToFMEA&&l.cascadedToControlPlan).length/total*100):0;

  const byCategory: Record<string,number> = {};
  lessons.forEach(l=>{ byCategory[l.category]=(byCategory[l.category]??0)+1; });
  const catEntries = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
  const maxCat = Math.max(...catEntries.map(e=>e[1]),1);

  const bySev: Record<Severity,number> = {critical:0,major:0,minor:0};
  lessons.forEach(l=>{ bySev[l.severity]++; });

  const byDept: Record<string,number> = {};
  lessons.forEach(l=>{ byDept[l.department]=(byDept[l.department]??0)+1; });

  return (
      <>
      <PageTitle title="Lessons Learned" />
      <div className="space-y-5 py-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Lessons Captured', value:total, sub:'Knowledge preserved', color:'text-emerald-600' },
          { label:'Verified Effective',      value:verified, sub:`${open} still open`, color:verified>=total*0.7?'text-emerald-600':'text-amber-600' },
          { label:'Cost of Recurrence Saved', value:`₹${(totalSaved/100000).toFixed(1)}L`, sub:'Estimated prevention', color:'text-blue-600' },
          { label:'FMEA+CP Cascade Rate',   value:`${cascadeRate}%`, sub:'Knowledge transfer', color:cascadeRate>=80?'text-emerald-600':cascadeRate>=60?'text-amber-600':'text-red-600' },
        ].map(k=>(
          <div key={k.label} className="rounded-xl border border-emerald-200 bg-emerald-950/20 p-4">
            <div className="text-xs text-emerald-700 mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[#15803d]/70 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Lessons by Category</div>
          {catEntries.map(([cat,cnt])=>(
            <div key={cat} className="flex items-center gap-2 mb-2.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${CAT_COLORS[cat as Category]}`}>{CAT_LABELS[cat as Category]}</span>
              <div className="flex-1 bg-[#dbeafe] rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{width:`${Math.round(cnt/maxCat*100)}%`}}/>
              </div>
              <span className="text-xs font-bold text-[#1e3a5f] w-4 text-right">{cnt}</span>
            </div>
          ))}
        </div>

        {/* Severity + Cascade */}
        <div className="space-y-4">
          <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
            <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Severity Breakdown</div>
            <div className="flex gap-4">
              {(['critical','major','minor'] as Severity[]).map(s=>(
                <div key={s} className="flex-1 text-center">
                  <div className={`text-2xl font-bold ${s==='critical'?'text-red-600':s==='major'?'text-amber-600':'text-blue-600'}`}>{bySev[s]}</div>
                  <div className="text-xs text-[#1e3a5f] capitalize mt-0.5">{s}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
            <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Knowledge Cascade Status</div>
            {[
              { label:'Cascaded to FMEA',         count:lessons.filter(l=>l.cascadedToFMEA).length },
              { label:'Cascaded to Control Plan',  count:lessons.filter(l=>l.cascadedToControlPlan).length },
              { label:'Cascaded to Similar Parts', count:lessons.filter(l=>l.cascadedToSimilarParts).length },
            ].map(c=>(
              <div key={c.label} className="flex items-center justify-between mb-2 text-xs flex-wrap gap-y-2">
                <span className="text-[#1e3a5f]">{c.label}</span>
                <span className="font-bold text-[#15803d]">{c.count}/{total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Cost-Saving Lessons */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Top Lessons — Cost of Recurrence Prevented</div>
        {[...lessons].sort((a,b)=>b.costSaved-a.costSaved).slice(0,4).map((l,i)=>(
          <div key={l.id} className="flex items-start gap-3 mb-3 p-3 bg-[#eff6ff] rounded-lg">
            <span className="text-[#1e3a5f] font-bold text-sm w-4 shrink-0">{i+1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{l.title}</div>
              <div className="text-xs text-[#1e3a5f] mt-0.5">{l.partName} · {l.customer}</div>
            </div>
            <span className="text-xs font-bold text-[#15803d] shrink-0">₹{(l.costSaved/1000).toFixed(0)}K saved</span>
          </div>
        ))}
      </div>

      {/* Maturity */}
      <div className="bg-emerald-950 border border-emerald-900 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">📊 Knowledge Management Maturity — IATF Cl. 7.1.6 / 10.2</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Lesson Capture Rate', score:total>=10?100:total>=5?75:total>=2?50:25, target:100 },
            { label:'Verification Rate',   score:total>0?Math.round(verified/total*100):0, target:80 },
            { label:'Cascade Rate',        score:cascadeRate, target:90 },
            { label:'Open Items <30 days', score:open===0?100:Math.round((1-open/total)*100), target:90 },
          ].map(m=>{
            const color=m.score>=m.target?'#10b981':m.score>=m.target*0.7?'#f59e0b':'#ef4444';
            return (
              <div key={m.label} className="bg-emerald-50/30 rounded-xl p-3 text-center">
                <div className="text-xs text-emerald-700 mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{m.score}%</div>
                <div className="text-xs text-[#15803d] mt-1">Target: {m.target}%</div>
                <div className="mt-2 w-full bg-emerald-50 rounded-full h-1.5">
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

// -- Lesson Card ---------------------------------------------------------------
function LessonCard({ l, expanded, onToggle }: { l:LessonLearned; expanded:boolean; onToggle:()=>void }) {
  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${l.severity==='critical'?'border-red-700/50':l.severity==='major'?'border-amber-200':'border-[#dbeafe]'}`}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white" onClick={onToggle}>
        <span className="font-mono text-xs text-[#1e3a5f] shrink-0">{l.id}</span>
        <span className="text-xs text-[#1e3a5f] shrink-0">{l.date}</span>
        <span className="font-semibold text-sm text-white flex-1 min-w-0">{l.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${CAT_COLORS[l.category]}`}>{CAT_LABELS[l.category]}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${SEV_COLORS[l.severity]}`}>{l.severity}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${STATUS_COLORS[l.status]}`}>{l.status}</span>
        {l.costSaved>0 && <span className="text-xs text-[#15803d] font-bold shrink-0">₹{(l.costSaved/1000).toFixed(0)}K</span>}
        <span className="text-[#1e3a5f] text-xs shrink-0">{expanded?'▲':'▼'}</span>
      </div>

      {expanded && (
        <div className="border-t border-[#dbeafe] px-5 py-4 space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-[#dbeafe] px-2 py-0.5 rounded text-[#1e3a5f]">Part: {l.partName} ({l.partNumber})</span>
            <span className="bg-[#dbeafe] px-2 py-0.5 rounded text-[#1e3a5f]">Customer: {l.customer}</span>
            <span className="bg-[#dbeafe] px-2 py-0.5 rounded text-[#1e3a5f]">Dept: {l.department}</span>
            <span className="bg-[#dbeafe] px-2 py-0.5 rounded text-[#1e3a5f]">Added by: {l.addedBy}</span>
          </div>

          {/* Problem */}
          <div className="bg-red-50 border border-red-900/30 rounded-lg p-3">
            <div className="font-bold text-red-700 text-xs mb-1">Problem Statement</div>
            <p className="text-xs text-[#1e3a5f] leading-relaxed">{l.problemStatement}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-amber-50 border border-amber-900/30 rounded-lg p-3">
              <div className="font-bold text-amber-700 text-xs mb-1">Root Cause</div>
              <p className="text-xs text-[#1e3a5f] leading-relaxed">{l.rootCause}</p>
            </div>
            <div className="bg-orange-900/30/30 border border-orange-900/30 rounded-lg p-3">
              <div className="font-bold text-orange-600 text-xs mb-1">Escape Point</div>
              <p className="text-xs text-[#1e3a5f] leading-relaxed">{l.escapePoint}</p>
              <div className="mt-2 text-xs text-[#1e3a5f]">Detected by: {l.detectMethod}</div>
            </div>
            <div className="bg-[#eff6ff]/30 border border-blue-700/50/30 rounded-lg p-3">
              <div className="font-bold text-[#1d4ed8] text-xs mb-1">Immediate Containment</div>
              <p className="text-xs text-[#1e3a5f] leading-relaxed">{l.immediateContainment}</p>
            </div>
            <div className="bg-purple-900/30/30 border border-purple-900/30 rounded-lg p-3">
              <div className="font-bold text-purple-700 text-xs mb-1">Corrective Action</div>
              <p className="text-xs text-[#1e3a5f] leading-relaxed">{l.correctiveAction}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg md:col-span-2 p-3">
              <div className="font-bold text-emerald-700 text-xs mb-1">Preventive Action (Systemic)</div>
              <p className="text-xs text-[#1e3a5f] leading-relaxed">{l.preventiveAction}</p>
            </div>
          </div>

          {/* Cascade + Verification */}
          <div className="flex flex-wrap gap-4 text-xs bg-[#eff6ff] rounded-lg p-3">
            <div>
              <span className="text-[#1e3a5f] mr-2">Cascaded to FMEA:</span>
              <span className={l.cascadedToFMEA?'text-[#15803d] font-bold':'text-red-600'}>{l.cascadedToFMEA?'✅ Yes':'❌ No'}</span>
            </div>
            <div>
              <span className="text-[#1e3a5f] mr-2">Control Plan:</span>
              <span className={l.cascadedToControlPlan?'text-[#15803d] font-bold':'text-red-600'}>{l.cascadedToControlPlan?'✅ Yes':'❌ No'}</span>
            </div>
            <div>
              <span className="text-[#1e3a5f] mr-2">Similar Parts:</span>
              <span className={l.cascadedToSimilarParts?'text-[#15803d] font-bold':'text-[#1e3a5f]'}>{l.cascadedToSimilarParts?'✅ Yes':'—'}</span>
            </div>
            <div className="ml-auto">
              <span className="text-[#1e3a5f] mr-2">Verification:</span>
              <span className="text-[#1e3a5f]">{l.verificationMethod}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {l.tags.map(tag=>(
              <span key={tag} className="text-xs bg-[#dbeafe] text-[#1e3a5f] px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Log Tab -------------------------------------------------------------------
function LogTab({ lessons }: { lessons: LessonLearned[] }) {
  const [expanded, setExpanded] = useState<string|null>(null);
  const [filterCat, setFilterCat]   = useState<'all'|Category>('all');
  const [filterSev, setFilterSev]   = useState<'all'|Severity>('all');
  const [filterStat, setFilterStat] = useState<'all'|Status>('all');

  const filtered = lessons.filter(l=>
    (filterCat==='all'||l.category===filterCat) &&
    (filterSev==='all'||l.severity===filterSev) &&
    (filterStat==='all'||l.status===filterStat)
  );

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-wrap gap-3 items-center bg-white border border-[#dbeafe] rounded-xl p-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-[#1e3a5f] font-bold self-center mr-1">Category:</span>
          {(['all',...Object.keys(CAT_LABELS)] as const).map(c=>(
            <button key={c} onClick={()=>setFilterCat(c as typeof filterCat)}
              className={`text-xs px-2 py-1 rounded-full font-semibold transition ${filterCat===c?'bg-emerald-700 text-white':'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
              {c==='all'?'All':CAT_LABELS[c as Category]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs text-[#1e3a5f] font-bold self-center">Sev:</span>
          {(['all','critical','major','minor'] as const).map(s=>(
            <button key={s} onClick={()=>setFilterSev(s as typeof filterSev)}
              className={`text-xs px-2 py-1 rounded-full font-semibold transition capitalize ${filterSev===s?'bg-emerald-700 text-white':'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs text-[#1e3a5f] font-bold self-center">Status:</span>
          {(['all','open','closed','verified'] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStat(s as typeof filterStat)}
              className={`text-xs px-2 py-1 rounded-full font-semibold transition capitalize ${filterStat===s?'bg-emerald-700 text-white':'bg-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>{s}</button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[#1e3a5f]">{filtered.length} of {lessons.length}</span>
      </div>

      {filtered.length===0 && (
        <div className="text-center py-12 text-[#1e3a5f] text-sm">No lessons match this filter.</div>
      )}

      {filtered.map(l=>(
        <LessonCard key={l.id} l={l} expanded={expanded===l.id} onToggle={()=>setExpanded(expanded===l.id?null:l.id)} />
      ))}
    </div>
  );
}

// -- Search Tab ----------------------------------------------------------------
function SearchTab({ lessons }: { lessons: LessonLearned[] }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string|null>(null);

  const results = useMemo(()=>{
    if(!query.trim()) return [];
    const q = query.toLowerCase();
    return lessons.filter(l=>
      l.title.toLowerCase().includes(q) ||
      l.problemStatement.toLowerCase().includes(q) ||
      l.rootCause.toLowerCase().includes(q) ||
      l.correctiveAction.toLowerCase().includes(q) ||
      l.preventiveAction.toLowerCase().includes(q) ||
      l.partName.toLowerCase().includes(q) ||
      l.partNumber.toLowerCase().includes(q) ||
      l.customer.toLowerCase().includes(q) ||
      l.tags.some(t=>t.includes(q))
    );
  },[query,lessons]);

  return (
    <div className="space-y-4 py-4">
      <div className="relative">
        <input
          type="text" value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Search lessons... (try: 'tool wear', 'toyota', 'casting', 'ppap')"
          className="w-full bg-white border border-[#dbeafe] text-[#1e3a5f] rounded-xl px-5 py-3 pr-12 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
        />
        <span className="absolute right-4 top-3 text-[#1e3a5f] text-lg">🔍</span>
      </div>

      {!query && (
        <div className="bg-white border border-[#dbeafe] rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🧠</div>
          <div className="text-sm font-semibold text-[#1e3a5f] mb-2">Search the Knowledge Base</div>
          <div className="text-xs text-[#1e3a5f]">Search by part name, customer, failure mode, root cause, or tag.</div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['tool-wear','casting','ppap','material','audit','paint','ph'].map(tag=>(
              <button key={tag} onClick={()=>setQuery(tag)}
                className="text-xs bg-[#dbeafe] hover:bg-emerald-800 text-[#1e3a5f] hover:text-[#1e3a5f] px-3 py-1 rounded-full transition">
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && results.length===0 && (
        <div className="text-center py-12 text-[#1e3a5f] text-sm">No lessons found for "{query}".</div>
      )}

      {results.length>0 && (
        <div className="text-xs text-[#1e3a5f] mb-2">{results.length} result{results.length>1?'s':''} for "{query}"</div>
      )}

      {results.map(l=>(
        <LessonCard key={l.id} l={l} expanded={expanded===l.id} onToggle={()=>setExpanded(expanded===l.id?null:l.id)} />
      ))}
    </div>
  );
}

// -- IATF Guide ----------------------------------------------------------------
function LLGuide() {
  const [open, setOpen] = useState<number|null>(0);
  const sections = [
    { title:'IATF 16949 Cl. 7.1.6 — Organizational Knowledge', content:'Organizations shall determine knowledge necessary for the operation of its processes and to achieve conformity of products and services. This knowledge shall be maintained and made available to the extent necessary. When changing needs and trends are considered, the organization shall consider its current knowledge as a baseline and determine how to acquire or access the additional knowledge needed. Lessons Learned is the primary mechanism for preserving and transferring organizational quality knowledge.' },
    { title:'IATF 16949 Cl. 10.2.3 — Problem Solving', content:'Organizations must have a defined process for problem solving that: identifies root cause, prevents recurrence, and cascades lessons to similar products and processes. The lessons learned database is the structured output of this requirement — it proves that solved problems are systematically embedded back into the quality system through FMEA updates, Control Plan updates, and operator training.' },
    { title:'Why "Escape Point" is Critical', content:'Root cause analysis that only asks WHY the problem happened misses half the story. The escape point answers: WHY WASN\'T IT DETECTED BEFORE REACHING THE CUSTOMER? Fixing the escape point is often more impactful than fixing the root cause — because the escape point represents a systematic gap in the detection system (FMEA Detection, Control Plan, Poka-yoke, Inspection criteria). Both must be fixed for a lesson to be truly learned.' },
    { title:'Knowledge Cascade — What Must Be Updated', content:'When a lesson is captured, these documents must be reviewed and updated if applicable: PFMEA (add/update failure mode, effect, cause, detection controls, action), Control Plan (update inspection frequency, method, reaction plan), Work Instructions (update process steps or check points), PPAP (re-submit if control method changes), Similar part list (horizontal deployment to all family members). Cascade is verified by auditors — missing cascade is a common audit finding.' },
    { title:'Lessons Learned in New Program Launches (APQP)', content:'IATF 16949 Cl. 8.3.3.1 requires that lessons learned from similar products and processes are considered during new product design. APQP Phase 1 deliverables include a lessons learned review. Before launching any new part, the APQP team must search the lessons learned database for: same customer, same process family, same material, same manufacturing technology, and incorporate relevant past lessons into DFMEA, PFMEA, and Control Plan from the start.' },
    { title:'Common Audit Findings — Knowledge Management', content:'1. Lessons Learned database not maintained — only complaint records exist, no structured LL log. 2. Root cause analysis stopped at symptom level — "operator error" without systemic fix. 3. FMEA not updated after corrective action — lesson not embedded in the quality system. 4. Lessons not cascaded to similar parts — same failure repeats on a different part number. 5. No evidence that new program FMEA considered lessons from prior programs. 6. Effectiveness verification missing — action taken but not confirmed to be working.' },
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
export default function LessonsLearnedPage() {
  const [tab, setTab] = useState<'dashboard'|'log'|'search'|'guide'>('dashboard');
  const [lessons] = useState<LessonLearned[]>(SAMPLE_LL);

  const total    = lessons.length;
  const open     = lessons.filter(l=>l.status==='open').length;
  const critical = lessons.filter(l=>l.severity==='critical').length;
  const totalSaved = lessons.reduce((s,l)=>s+l.costSaved,0);

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">🧠 Lessons Learned</h1>
              <p className="text-emerald-700 text-sm mt-1">Knowledge preservation · Root cause library · Cascade tracker — IATF Cl. 7.1.6 / 10.2.3</p>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-white">{total}</div>
                <div className="text-xs text-emerald-700">Lessons Captured</div>
              </div>
              <div className={`border rounded-xl px-4 py-2 ${open>0?'bg-amber-50 border-amber-200':'bg-emerald-50/30 border-emerald-200'}`}>
                <div className={`text-xl font-bold ${open>0?'text-amber-700':'text-emerald-700'}`}>{open}</div>
                <div className="text-xs text-[#1e3a5f]">Open</div>
              </div>
              <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl px-4 py-2">
                <div className="text-xl font-bold text-blue-200">₹{(totalSaved/100000).toFixed(1)}L</div>
                <div className="text-xs text-[#1d4ed8]">Cost Prevented</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b border-[#dbeafe] overflow-x-auto">
            {([
              {id:'dashboard', label:'📊 Dashboard'},
              {id:'log',       label:'📋 Lesson Log'},
              {id:'search',    label:'🔍 Search Knowledge'},
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
            {label:'Lessons Learned Template',  href:'/downloads/lessons/Lessons_Learned_Template.xlsx',  color:'#059669'},
            {label:'Root Cause Analysis (8D)',   href:'/downloads/lessons/Root_Cause_Analysis_8D.xlsx',   color:'#dc2626'},
            {label:'5-Why Template',             href:'/downloads/lessons/5_Why_Template.xlsx',            color:'#d97706'},
            {label:'Fishbone Diagram',           href:'/downloads/lessons/Fishbone_Diagram.xlsx',          color:'#7c3aed'},
            {label:'LL Database Register',       href:'/downloads/lessons/LL_Database_Register.xlsx',      color:'#0891b2'},
          ].map(f=>(
            <span key={f.label} className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:f.color}}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110">{f.label}</a>
              <a href={f.href} download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110">⬇</a>
            </span>
          ))}
        </div>

        {tab==='dashboard' && <LLDashboard lessons={lessons} />}
        {tab==='log'       && <LogTab lessons={lessons} />}
        {tab==='search'    && <SearchTab lessons={lessons} />}
        {tab==='guide'     && <LLGuide />}
      </div>

      <QualityCopilot page="capa" />
    </div>
  );
}
