'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';
import QualityCopilot from '../components/QualityCopilot';
import LiveKPIBanner from '../components/LiveKPIBanner';
import { useSession } from '../hooks/useSession';
import { RBAC_ROLES } from '@/lib/rbac';

interface Complaint {
  id: string; complaint_number: string; customer_name: string; customer: string;
  part_name: string; severity: string; status: string; created_at: string;
  defect_description: string; defect_category: string;
}
interface CapaAction {
  id: string | number; complaint_id: string; action_number: number;
  type: string; action_type: string; action: string; action_description: string;
  responsible: string; target_date: string; status: string; completed_date: string;
  effectiveness: string; created_at: string;
}

const SEV_TEXT: Record<string, string> = {
  Critical: 'text-red-600 bg-red-500/20 border-red-200',
  High: 'text-orange-600 bg-orange-50 border-orange-200',
  Medium: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/40',
  Low: 'text-[#15803d] bg-emerald-500/20 border-emerald-500/40',
};
const CAPA_STATUS: Record<string, string> = {
  Open: 'bg-red-500/20 text-red-600',
  'In Progress': 'bg-blue-500/20 text-[#1d4ed8]',
  Completed: 'bg-emerald-500/20 text-[#15803d]',
  Overdue: 'bg-red-500/30 text-red-200',
  Verified: 'bg-emerald-500/30 text-emerald-200',
};

function isOverdue(targetDate: string, status: string) {
  if (!targetDate || status === 'Completed' || status === 'Verified') return false;
  return new Date(targetDate) < new Date();
}

// -- Tab 2: Dashboard -----------------------------------------------------------
function DashboardTab({ allCapaRows, complaints, capaMap }: {
  allCapaRows: (CapaAction & { complaint: Complaint })[],
  complaints: Complaint[],
  capaMap: Record<string, CapaAction[]>
}) {
  const total = allCapaRows.length;
  const open = allCapaRows.filter(r => !['Completed','Verified'].includes(r.status??'')).length;
  const overdue = allCapaRows.filter(r => isOverdue(r.target_date, r.status??'')).length;
  const completed = allCapaRows.filter(r => ['Completed','Verified'].includes(r.status??'')).length;
  const closureRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // By type
  const corrective = allCapaRows.filter(r => (r.type??r.action_type??'').toLowerCase().includes('corrective')).length;
  const preventive  = allCapaRows.filter(r => (r.type??r.action_type??'').toLowerCase().includes('preventive')).length;
  const other = total - corrective - preventive;

  // By severity from complaint
  const bySev: Record<string,number> = {};
  allCapaRows.forEach(r => { const s = r.complaint?.severity??'Unknown'; bySev[s]=(bySev[s]??0)+1; });

  // By customer
  const byCust: Record<string,number> = {};
  allCapaRows.forEach(r => { const c = r.complaint?.customer_name??r.complaint?.customer??'Unknown'; byCust[c]=(byCust[c]??0)+1; });
  const topCusts = Object.entries(byCust).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Effectiveness distribution
  const withEff = allCapaRows.filter(r => r.effectiveness && r.effectiveness !== '—');
  const effective = withEff.filter(r => r.effectiveness?.toLowerCase().includes('effective') && !r.effectiveness?.toLowerCase().includes('not')).length;

  return (
      <>
      <PageTitle title="CAPA" />
      <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label:'Total CAPAs', value: total, color:'text-[#1d4ed8]', bg:'border-[#bfdbfe] bg-[#eff6ff]' },
          { label:'Open', value: open, color:'text-red-600', bg:'border-red-200 bg-red-50' },
          { label:'Overdue', value: overdue, color:'text-orange-600', bg:'border-orange-200 bg-orange-950/30' },
          { label:'Completed', value: completed, color:'text-[#15803d]', bg:'border-emerald-500/30 bg-emerald-950/30' },
          { label:'Closure Rate', value: `${closureRate}%`, color: closureRate>=80?'text-[#15803d]':closureRate>=50?'text-amber-600':'text-red-600', bg:'border-[#dbeafe] bg-[#eff6ff]' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border ${k.bg} p-4`}>
            <p className="text-xs text-[#1e3a5f] font-semibold uppercase tracking-wide">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CAPA Type Breakdown */}
        <div className="bg-white rounded-xl border border-[#dbeafe] p-5">
          <div className="text-sm font-bold text-[#1e3a5f] mb-3">CAPA Type Breakdown</div>
          {[
            { label:'Corrective', value: corrective, total, color:'bg-blue-500', text:'text-[#1d4ed8]' },
            { label:'Preventive', value: preventive, total, color:'bg-purple-500', text:'text-purple-300' },
            { label:'Other / Unclassified', value: other, total, color:'bg-slate-500', text:'text-[#1e3a5f]' },
          ].map(b => (
            <div key={b.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className={`font-medium ${b.text}`}>{b.label}</span>
                <span className="text-[#1e3a5f]">{b.value} ({b.total>0?Math.round(b.value/b.total*100):0}%)</span>
              </div>
              <div className="w-full bg-[#f0f9ff] rounded-full h-2">
                <div className={`${b.color} h-2 rounded-full`} style={{width:`${b.total>0?b.value/b.total*100:0}%`}} />
              </div>
            </div>
          ))}
        </div>

        {/* By Severity */}
        <div className="bg-white rounded-xl border border-[#dbeafe] p-5">
          <div className="text-sm font-bold text-[#1e3a5f] mb-3">CAPAs by Complaint Severity</div>
          {total === 0 ? <div className="text-xs text-[#1e3a5f]">No data yet</div> :
            Object.entries(bySev).sort((a,b)=>b[1]-a[1]).map(([sev,cnt]) => {
              const colors: Record<string,string> = { Critical:'bg-red-500', High:'bg-orange-400', Medium:'bg-yellow-400', Low:'bg-green-400', Unknown:'bg-slate-500' };
              return (
                <div key={sev} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#1e3a5f]">{sev}</span>
                    <span className="text-[#1e3a5f]">{cnt}</span>
                  </div>
                  <div className="w-full bg-[#f0f9ff] rounded-full h-2">
                    <div className={`${colors[sev]??'bg-slate-500'} h-2 rounded-full`} style={{width:`${Math.round(cnt/total*100)}%`}} />
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Top Customers by CAPA Count */}
        <div className="bg-white rounded-xl border border-[#dbeafe] p-5">
          <div className="text-sm font-bold text-[#1e3a5f] mb-3">Top Customers by CAPA Count</div>
          {topCusts.length === 0 ? <div className="text-xs text-[#1e3a5f]">No data yet</div> :
            topCusts.map(([cust, cnt], i) => (
              <div key={cust} className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#1e3a5f] w-4">{i+1}</span>
                <span className="flex-1 text-xs font-medium text-[#1e3a5f] truncate">{cust}</span>
                <span className="text-xs font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] rounded px-1.5 py-0.5">{cnt}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Effectiveness Panel */}
      <div className="bg-white rounded-xl border border-[#dbeafe] p-5">
        <div className="text-sm font-bold text-[#1e3a5f] mb-1">Effectiveness Verification</div>
        <p className="text-xs text-[#1e3a5f] mb-4">IATF 16949 Cl. 10.2.3 — Verify that corrective actions are effective and do not recur</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3">
            <div className="text-2xl font-bold text-[#15803d]">{effective}</div>
            <div className="text-xs text-[#15803d] mt-0.5">Verified Effective</div>
          </div>
          <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-3">
            <div className="text-2xl font-bold text-[#1e3a5f]">{withEff.length - effective}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">Not Effective / Reopen</div>
          </div>
          <div className="bg-orange-950/40 border border-orange-200 rounded-xl p-3">
            <div className="text-2xl font-bold text-orange-600">{completed - withEff.length < 0 ? 0 : completed - withEff.length}</div>
            <div className="text-xs text-orange-400 mt-0.5">Closed — Pending Verification</div>
          </div>
        </div>
      </div>

      {/* IATF Maturity Score */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
        <div className="text-sm font-bold text-[#1e3a5f] mb-4">📊 CAPA System Maturity Score</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Closure Rate', score: closureRate, target: 90 },
            { label:'Overdue %', score: total>0?Math.max(0,100-Math.round(overdue/total*100)):100, target: 95 },
            { label:'Effectiveness Verification', score: completed>0?Math.round(withEff.length/Math.max(completed,1)*100):0, target: 100 },
            { label:'Corrective vs Preventive Ratio', score: total>0?Math.round((preventive/total)*100):0, target: 30 },
          ].map(m => {
            const pct = Math.min(m.score, 100);
            const color = pct >= m.target ? '#10b981' : pct >= m.target*0.7 ? '#f59e0b' : '#ef4444';
            return (
              <div key={m.label} className="bg-[#dbeafe] border border-[#dbeafe] rounded-xl p-3 text-center">
                <div className="text-xs text-[#1e3a5f] mb-2">{m.label}</div>
                <div className="text-2xl font-bold" style={{color}}>{pct}%</div>
                <div className="text-xs text-[#1e3a5f] mt-1">Target: {m.target}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
      </>
  );
}

// -- Tab 3: IATF Guide ---------------------------------------------------------
function IATFGuideTab() {
  const [open, setOpen] = useState<number|null>(0);
  const sections = [
    {
      title:'IATF 16949 Cl. 10.2 — Requirements Overview',
      icon:'📋',
      color:'bg-blue-700',
      content: [
        ['Cl. 10.2.1 — Nonconformity and Corrective Action','When a nonconformity occurs (including complaints): React to NC and control + correct it. Evaluate need for CA to eliminate root cause. Implement CA. Review effectiveness. Update risk and opportunity assessments if needed. Make changes to QMS if necessary.'],
        ['Cl. 10.2.2 — Documented Information','Retain: Nature of NC, actions taken, results of CA. Retain evidence of: Root cause analysis, corrective action implementation, effectiveness review.'],
        ['Cl. 10.2.3 — Problem Solving (IATF Specific)','Defined process for problem solving. Problem-solving methods include: 8D, DMAIC, A3. Root cause analysis shall address: Why Made (occurrence) + Why Shipped (escape). Systematic root cause analysis — not superficial. CAPA must address BOTH occurrence and escape causes.'],
        ['Cl. 10.2.4 — Error Proofing','Error proofing (poka-yoke) shall be part of the corrective action process where feasible. Effectiveness of error proofing must be tested and documented in control plan.'],
        ['Cl. 10.2.6 — Customer Complaints and Field Failures','Initiate problem solving immediately. Customer-specific requirements for problem-solving format must be followed. D1-D3 response within 24 hours (typical CSR). Full 8D within 7-10 working days (typical CSR).'],
      ]
    },
    {
      title:'CAPA vs Correction vs Preventive Action',
      icon:'⚖️',
      color:'bg-orange-700',
      content: [
        ['Correction','Immediate action to fix/contain the nonconformity — does NOT address root cause. Example: Sort and rework the defective batch. Required by: IATF 10.2.1'],
        ['Corrective Action (CA)','Eliminates the ROOT CAUSE of a detected nonconformity to prevent recurrence. Must be proportionate to the effect. Example: Change drill tool change interval from 600 to 450 pcs after root cause identified as tool wear. Requires: Effectiveness verification.'],
        ['Preventive Action (PA)','Proactive action to eliminate POTENTIAL root cause BEFORE a nonconformity occurs. Based on: Risk assessment, FMEA RPN, trend data, audit findings. Example: Add limit switch to new line before defect occurs, based on FMEA learning from old line.'],
        ['Key Difference','Corrective = REACT to problem that happened. Preventive = PROACT before problem occurs. Auditors often ask: "Show me a preventive action you took based on risk — before any defect occurred."'],
      ]
    },
    {
      title:'Root Cause Analysis — Best Practices',
      icon:'🔍',
      color:'bg-red-800',
      content: [
        ['Why Made (Occurrence Root Cause)','Asks: Why was the defect produced? Go deep — do not stop at "operator error." Find the systemic cause. Example: Not just "operator made error" → but "operator made error because setup SOP was unclear and there was no visual standard" → systemic root cause: SOP inadequate.'],
        ['Why Shipped (Escape Root Cause)','Asks: Why did the defect pass through all controls and reach the customer? Find the DETECTION failure. Example: "Inspector missed it" → Why? "Inspector checks 5% sample" → Why not 100%? "No poka-yoke for this characteristic." Systemic root cause: Detection gap in control plan.'],
        ['5-Why Rules','1. Each answer becomes the next Why. 2. Stop at systemic/fixable level. 3. Verify each answer — do not assume. 4. Address BOTH occurrence and escape separately. 5. Root cause must lead to an actionable fix.'],
        ['Fishbone 6M Categories','Man: Skill, training, fatigue, shift change. Machine: PM, calibration, tooling, wear. Material: Raw material variation, handling. Method: SOP, setup, parameters. Measurement: GRR, calibration, inspector bias. Mother Nature: Temperature, vibration, dust.'],
      ]
    },
    {
      title:'Effectiveness Verification — How to Do It',
      icon:'✅',
      color:'bg-green-800',
      content: [
        ['When to Verify','After implementing corrective action — verify effectiveness. Typical timeline: 60–90 days after CA implementation, OR after next production batch using new process.'],
        ['How to Verify — Methods','1. Zero recurrence: Same failure mode has not occurred since CA implementation (monitor for defined period). 2. Process data: Before/after comparison — defect rate, PPM, Cpk. 3. Turn on/off test: Deliberately induce old condition → problem returns; use new CA → problem stops. 4. SPC control chart: No out-of-control points since CA.'],
        ['Not Effective — What to Do','If effectiveness check fails: Re-open CAPA. Go back to root cause — it was likely wrong or incomplete. Use more rigorous RCA (DMAIC, 8D). Do NOT close the CAPA until effectiveness is confirmed.'],
        ['IATF Requirement','IATF 10.2.3 requires documented evidence of effectiveness verification. Auditor will ask: "Show me how you verified this corrective action was effective."'],
      ]
    },
    {
      title:'Common CAPA Audit Nonconformities',
      icon:'⚠️',
      color:'bg-gray-700',
      content: [
        ['Major NC — Root Cause is Symptom','Root cause identified is "operator error" or "inspector missed it" — these are symptoms, not root causes. Auditor expects: Why did the operator make the error? Why did the inspector miss it? What is the systemic root cause?'],
        ['Major NC — No Effectiveness Evidence','CAPA closed but no documented evidence that effectiveness was verified. Required: Before/after data, zero-recurrence confirmation, process capability data.'],
        ['Minor NC — FMEA/CP not updated after CAPA','D7 (Prevention) step not completed. After CAPA, PFMEA, Control Plan, Work Instructions must be updated to reflect new controls. Auditors check document revision dates match CAPA dates.'],
        ['Minor NC — CAPA Timeline Not Met','Target dates not met and no documented justification for extension. Best practice: Document reason for extension and get management approval. Never silently extend.'],
        ['Best Practice — Lessons Learned','Best-in-class IATF companies: Link every CAPA to Lessons Learned DB. Apply lessons to similar products/processes. Check similar operations for same risk (D7 step).'],
      ]
    },
    {
      title:'CAPA Audit Checklist — Internal Audit Questions',
      icon:'🔍',
      color:'bg-teal-700',
      content: [
        ['Process Questions','Do you have a documented procedure for CAPA? How are CAPAs initiated? What problem-solving methods are used? How are root causes verified? How is effectiveness confirmed?'],
        ['Record Questions','Show me your CAPA register. Show the most recent CAPA — what was the root cause? How was it verified? Show me effectiveness evidence. Are all CAPAs within their target dates?'],
        ['Product/Outcome Questions','Has any defect in this CAPA recurred? Were the FMEA and Control Plan updated? Was the lesson applied to similar products? Was the customer notified and satisfied?'],
        ['Management Questions','Is top management reviewing CAPA trends? Are repeat CAPAs being escalated? Is the COPQ being tracked? Are CAPA metrics included in management review?'],
      ]
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4">
        <div className="font-semibold text-[#1d4ed8] mb-1">📘 IATF 16949 Clause 10.2 — Complete CAPA Guide</div>
        <p className="text-xs text-[#1d4ed8]/80">Comprehensive reference for CAPA requirements, root cause analysis, effectiveness verification, and audit readiness. Click each section to expand.</p>
      </div>
      {sections.map((s, idx) => (
        <div key={idx} className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open===idx?null:idx)}
            className={`w-full flex items-center justify-between px-5 py-3.5 text-white font-semibold text-sm ${s.color}`}>
            <span className="flex items-center gap-2"><span>{s.icon}</span>{s.title}</span>
            <span>{open===idx?'▲':'▼'}</span>
          </button>
          {open===idx && (
            <div className="p-5 space-y-4">
              {s.content.map(([title, body], ci) => (
                <div key={ci} className="border-l-4 border-[#dbeafe] pl-4">
                  <div className="text-sm font-semibold text-[#1e3a5f] mb-1">{title}</div>
                  <div className="text-sm text-[#1e3a5f] leading-relaxed whitespace-pre-line">{body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Main Page ------------------------------------------------------------------
const TABS = ['📋 CAPA Register', '📊 Dashboard', '📘 IATF Guide'];

export default function CapaPage() {
  const { session } = useSession();
  const rbacCfg = session ? RBAC_ROLES[session.rbacRole] : null;
  const canApproveCAPA = !session || session.rbacRole === 'quality_head' || session.rbacRole === 'quality_manager';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [capaMap, setCapaMap] = useState<Record<string, CapaAction[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'open'|'overdue'|'completed'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [capaNotifCount, setCapaNotifCount] = useState(0);
  const [capaNotifRefs, setCapaNotifRefs] = useState<string[]>([]);

  useEffect(() => {
    // Fetch live notifications to surface CAPA-required alerts
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        const capaNotifs = (data.notifications ?? []).filter((n: { category: string; linkedRef?: string }) => n.category === 'capa');
        setCapaNotifCount(capaNotifs.length);
        setCapaNotifRefs(capaNotifs.map((n: { linkedRef?: string }) => n.linkedRef).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/complaints')
      .then(r => r.json())
      .then(async (data: Complaint[]) => {
        if (!Array.isArray(data)) { setComplaints([]); return; }
        setComplaints(data);
        // Fetch CAPA actions for all complaints that are in CAPA workflow
        // OR have been under investigation for >10 days (potential CAPA candidates)
        const now = Date.now();
        const capaComplaints = data.filter(c => {
          if (['CAPA In Progress','Pending Verification','Pending Closure','Closed'].includes(c.status)) return true;
          if (c.status === 'Under Investigation') {
            const days = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
            if (days > 10) return true;
          }
          return false;
        });
        const entries = await Promise.all(
          capaComplaints.map(c =>
            fetch(`/api/complaints/${c.id}/capa`)
              .then(r => r.ok ? r.json() : [])
              .then(actions => [c.id, Array.isArray(actions) ? actions : []] as [string, CapaAction[]])
              .catch(() => [c.id, []] as [string, CapaAction[]])
          )
        );
        setCapaMap(Object.fromEntries(entries));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const allCapaRows = safeComplaints.flatMap(c => {
    const actions = Array.isArray(capaMap[c.id]) ? capaMap[c.id] : [];
    return actions.map(a => ({ ...a, complaint: c }));
  });

  const filtered = useMemo(() => allCapaRows.filter(row => {
    const status = row.status || 'Open';
    const overdue = isOverdue(row.target_date, status);
    if (filter === 'open' && (status === 'Completed' || status === 'Verified')) return false;
    if (filter === 'overdue' && !overdue) return false;
    if (filter === 'completed' && status !== 'Completed' && status !== 'Verified') return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (
        (row.complaint?.complaint_number ?? '').toLowerCase().includes(q) ||
        (row.complaint?.customer_name ?? row.complaint?.customer ?? '').toLowerCase().includes(q) ||
        (row.action ?? row.action_description ?? '').toLowerCase().includes(q) ||
        (row.responsible ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [allCapaRows, filter, searchQ]);

  const totalCapa = allCapaRows.length;
  const openCapa = allCapaRows.filter(r => !['Completed','Verified'].includes(r.status ?? '')).length;
  const overdueCapa = allCapaRows.filter(r => isOverdue(r.target_date, r.status ?? '')).length;
  const completedCapa = allCapaRows.filter(r => ['Completed','Verified'].includes(r.status ?? '')).length;
  // Complaints that need CAPA but have no actions yet:
  // 1. Explicitly in CAPA workflow with no actions logged
  // 2. Under Investigation for >10 days (IATF 10.2.3 — should trigger CAPA)
  const now = Date.now();
  const needsCapa = safeComplaints.filter(c => {
    if (!(capaMap[c.id]?.length)) {
      if (c.status === 'CAPA In Progress') return true;
      if (c.status === 'Under Investigation') {
        const days = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
        return days > 10;
      }
    }
    return false;
  });

  if (loading) return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto bg-[#eff6ff] min-h-screen animate-pulse">
      {/* KPI tiles skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#dbeafe] p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-[#f0f9ff]/60" />
            <div className="h-8 w-12 rounded bg-[#f0f9ff]/50" />
            <div className="h-2 w-16 rounded bg-[#f0f9ff]/40" />
          </div>
        ))}
      </div>
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-[#f0f9ff]/40" style={{ width: `${70 + i * 10}px` }} />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
        <div className="bg-[#eff6ff] border-b border-[#dbeafe] px-4 py-3 flex gap-6">
          {[80, 100, 70, 80, 60, 80].map((w, i) => (
            <div key={i} className="h-3 rounded bg-[#f0f9ff]/60" style={{ width: `${w}px` }} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border-b border-[#dbeafe] px-4 py-3 flex gap-6 items-center">
            <div className="h-3 rounded bg-[#f0f9ff]/50" style={{ width: '80px' }} />
            <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '110px' }} />
            <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '70px' }} />
            <div className="h-5 rounded-full bg-[#f0f9ff]/50" style={{ width: '80px' }} />
            <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '60px' }} />
            <div className="h-3 rounded bg-[#f0f9ff]/40" style={{ width: '80px' }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto bg-[#eff6ff] min-h-screen">
      {/* Live KPI Banner */}
      <LiveKPIBanner />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">🔧 CAPA Management</h1>
          <p className="text-[#1e3a5f] text-sm mt-0.5">Corrective & Preventive Actions — IATF 16949 Cl. 10.2</p>
        </div>
        {rbacCfg && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${rbacCfg.bg}`}>
              {rbacCfg.icon} {rbacCfg.label}
            </span>
            {!canApproveCAPA && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                🔒 View only — approval requires QM+
              </span>
            )}
          </div>
        )}
      </div>

      {/* CAPA Required Alert — from live notifications */}
      {capaNotifCount > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔔</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-600">
              {capaNotifCount} complaint{capaNotifCount > 1 ? 's' : ''} flagged for CAPA by Notification System
            </p>
            <p className="text-sm text-amber-600/80 mt-0.5">
              IATF 16949 Cl. 10.2.3 — Complaints under investigation &gt;10 days require corrective action.
              {capaNotifRefs.length > 0 && (
                <span className="ml-1 font-mono">{capaNotifRefs.join(', ')}</span>
              )}
            </p>
          </div>
          <Link href="/notifications"
            className="flex-shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition whitespace-nowrap">
            View Alerts →
          </Link>
        </div>
      )}

      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/capa/CAPA_Form.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View CAPA Form XLS">CAPA Form XLS</a><a href="/downloads/capa/CAPA_Form.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download CAPA Form XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/capa/CAPA_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View CAPA Register XLS">CAPA Register XLS</a><a href="/downloads/capa/CAPA_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download CAPA Register XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/capa/8D_CAPA_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View 8D CAPA Template">8D CAPA Template</a><a href="/downloads/capa/8D_CAPA_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download 8D CAPA Template">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/capa/CAPA_Quick_Reference.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View CAPA Quick Ref PDF">CAPA Quick Ref PDF</a><a href="/downloads/capa/CAPA_Quick_Reference.pdf" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download CAPA Quick Ref PDF">⬇</a></span>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-white border border-[#dbeafe] rounded-xl p-1 flex-wrap">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab===i?'bg-blue-600 text-white shadow':'text-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* -- Tab 1: CAPA Register -- */}
      {activeTab === 0 && (<>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon:'📋', label:'Total CAPA Actions', value: totalCapa, border:'border-[#bfdbfe]', bg:'bg-[#eff6ff]', text:'text-[#1d4ed8]' },
            { icon:'🔴', label:'Open / Pending', value: openCapa, border:'border-red-200', bg:'bg-red-50', text:'text-red-600' },
            { icon:'⏰', label:'Overdue', value: overdueCapa, border:'border-orange-200', bg:'bg-orange-950/30', text:'text-orange-600' },
            { icon:'✅', label:'Completed', value: completedCapa, border:'border-emerald-500/30', bg:'bg-emerald-950/30', text:'text-[#15803d]' },
          ].map((k, i) => (
            <div key={i} className={`${k.bg} rounded-xl border ${k.border} p-4`}>
              <p className="text-xs text-[#1e3a5f] font-semibold uppercase tracking-wide">{k.icon} {k.label}</p>
              <p className={`text-3xl font-bold mt-1 ${k.text}`}>{k.value}</p>
            </div>
          ))}
        </div>
        {overdueCapa > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-600">{overdueCapa} CAPA action{overdueCapa > 1 ? 's' : ''} overdue!</p>
              <p className="text-sm text-red-600/80 mt-0.5">Target date has passed. Immediate review required.</p>
            </div>
          </div>
        )}
        {needsCapa.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4">
            <p className="font-semibold text-amber-600 mb-2">📌 {needsCapa.length} complaint{needsCapa.length > 1 ? 's' : ''} need CAPA actions:</p>
            <div className="flex flex-wrap gap-2">
              {needsCapa.map(c => (
                <Link key={c.id} href={`/complaints/${c.id}`}
                  className="px-3 py-1 bg-[#eff6ff] border border-amber-500/40 rounded-lg text-sm text-amber-600 hover:bg-amber-950/50 transition">
                  {c.complaint_number} → {c.customer_name}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-white border border-[#dbeafe] rounded-lg p-1 flex-wrap">
            {([['all','All'],['open','Open'],['overdue','Overdue'],['completed','Completed']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${filter === id ? 'bg-blue-600 text-white shadow' : 'text-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
                {label}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Search complaint, customer, action, owner..."
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="flex-1 min-w-48 bg-[#eff6ff] border border-[#dbeafe] text-[#1e3a5f] placeholder-slate-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-sm text-[#1e3a5f]">{filtered.length} actions</span>
          <button
            onClick={() => {
              const hdr = 'Complaint No,Customer,Severity,Action No,Type,Action,Responsible,Target Date,Status,Effectiveness\n';
              const body = filtered.map(r => [
                r.complaint?.complaint_number ?? '',
                r.complaint?.customer_name ?? r.complaint?.customer ?? '',
                r.complaint?.severity ?? '',
                r.action_number ?? '',
                r.type ?? r.action_type ?? '',
                `"${(r.action ?? r.action_description ?? '').replace(/"/g,'""')}"`,
                r.responsible ?? '',
                r.target_date ?? '',
                r.status ?? '',
                r.effectiveness ?? '',
              ].join(',')).join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([hdr + body], { type: 'text/csv' }));
              a.download = `capa_export_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
            className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition">
            📥 Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-white text-sm font-semibold rounded-lg transition"
            title="Print CAPA report">
            🖨 Print
          </button>
        </div>
        {filtered.length === 0 ? (
          totalCapa === 0 ? (
            /* -- Zero CAPA — getting started -- */
            <div className="bg-white rounded-xl border border-[#dbeafe] p-12 text-center space-y-4">
              <div className="text-5xl">🔧</div>
              <div>
                <p className="text-lg font-bold text-white">No CAPA actions yet</p>
                <p className="text-[#1e3a5f] text-sm mt-1 max-w-lg mx-auto">
                  CAPA actions are added from within each complaint. Open a complaint → go to the <strong className="text-[#1d4ed8]">D5 CAPA tab</strong> → add corrective and preventive actions.
                </p>
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/complaints" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition no-underline">
                  Open Complaints
                </Link>
                <Link href="/8d-generator" className="px-5 py-2 bg-amber-600/80 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition no-underline">
                  AI 8D Generator
                </Link>
              </div>
              <p className="text-xs text-[#1e3a5f] pt-2">IATF 16949 §10.2 · CAPA required for all customer complaints</p>
            </div>
          ) : (
            /* -- Filter returns nothing -- */
            <div className="bg-white rounded-xl border border-[#dbeafe] p-10 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <p className="font-semibold text-[#1e3a5f]">No CAPA actions match this filter</p>
              <p className="text-[#1e3a5f] text-sm">{totalCapa} actions exist — try a different status or severity filter.</p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
                  <tr>
                    {['Complaint','Customer','Severity','CAPA Type','Action Description','Responsible','Target Date','Status','Effectiveness',''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbeafe]">
                  {filtered.map((row) => {
                    const status = row.status || 'Open';
                    const overdue = isOverdue(row.target_date, status);
                    const effectiveStatus = overdue && !['Completed','Verified'].includes(status) ? 'Overdue' : status;
                    const capaType = row.type ?? row.action_type ?? '—';
                    const actionText = row.action ?? row.action_description ?? '—';
                    const custName = row.complaint?.customer_name ?? row.complaint?.customer ?? '—';
                    return (
                      <tr key={`${row.complaint_id}-${row.id}`} className={`hover:bg-[#dbeafe] transition ${overdue ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3"><Link href={`/complaints/${row.complaint_id}`} className="font-mono text-[#1d4ed8] font-semibold hover:text-[#1d4ed8] hover:underline text-xs">{row.complaint?.complaint_number ?? '—'}</Link></td>
                        <td className="px-4 py-3 font-medium text-[#1e3a5f] whitespace-nowrap">{custName}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_TEXT[row.complaint?.severity ?? ''] ?? 'bg-[#f0f9ff] border-[#dbeafe] text-[#1e3a5f]'}`}>{row.complaint?.severity ?? '—'}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${capaType === 'Corrective' ? 'bg-blue-500/20 text-[#1d4ed8]' : capaType === 'Preventive' ? 'bg-purple-500/20 text-purple-300' : 'bg-[#f0f9ff] text-[#1e3a5f]'}`}>{capaType}</span></td>
                        <td className="px-4 py-3 text-[#1e3a5f] max-w-xs"><p className="truncate" title={actionText}>{actionText}</p></td>
                        <td className="px-4 py-3 text-[#1e3a5f] whitespace-nowrap">{row.responsible || '—'}</td>
                        <td className={`px-4 py-3 whitespace-nowrap font-medium ${overdue ? 'text-red-600' : 'text-[#1e3a5f]'}`}>{row.target_date ? `${row.target_date.slice(0,10)}${overdue ? ' ⚠️' : ''}` : '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CAPA_STATUS[effectiveStatus] ?? 'bg-[#f0f9ff] text-[#1e3a5f]'}`}>{effectiveStatus}</span></td>
                        <td className="px-4 py-3 text-[#1e3a5f]">{row.effectiveness || '—'}</td>
                        <td className="px-4 py-3"><Link href={`/complaints/${row.complaint_id}`} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap">View →</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>)}

      {/* -- Tab 2: Dashboard -- */}
      {activeTab === 1 && (
        <DashboardTab allCapaRows={allCapaRows} complaints={complaints} capaMap={capaMap} />
      )}

      {/* -- Tab 3: IATF Guide -- */}
      {activeTab === 2 && <IATFGuideTab />}

      <QualityCopilot page="capa" />
    </div>
  );
}
