'use client';
import { useState, useMemo, useEffect } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';
import { useSession } from '../hooks/useSession';
import { useQualityKPIs } from '../hooks/useQualityKPIs';
import { RBAC_ROLES } from '@/lib/rbac';

// -- SLA summary hook ----------------------------------------------------------
function useSLASummary() {
  const [sla, setSLA] = useState<{ breached: number; warning: number; total: number } | null>(null);
  useEffect(() => {
    fetch('/api/sla')
      .then(r => r.json())
      .then(d => setSLA({ breached: d.summary?.breached ?? 0, warning: d.summary?.warning ?? 0, total: d.summary?.total ?? 0 }))
      .catch(() => {});
  }, []);
  return sla;
}

// -- Calibration overdue hook --------------------------------------------------
function useCalibrationOverdue() {
  const [overdue, setOverdue] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/calibration')
      .then(r => r.json())
      .then(d => {
        const count = (d.overdue ?? d.overdueInstruments ?? []).length;
        setOverdue(count);
      })
      .catch(() => setOverdue(0));
  }, []);
  return overdue;
}

// -- Approvals pending hook ----------------------------------------------------
function useApprovalsPending() {
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/approvals')
      .then(r => r.json())
      .then(d => setPending(d.counts?.pending ?? 0))
      .catch(() => setPending(0));
  }, []);
  return pending;
}

// -- CommandPanel — "What needs my attention now?" -----------------------------
function CommandPanel({
  openCount, criticalCount, pendingApprovals, slaBreached, calibrationOverdue,
}: {
  openCount: number; criticalCount: number; pendingApprovals: number | null;
  slaBreached: number; calibrationOverdue: number | null;
}) {
  const allClear =
    openCount === 0 && criticalCount === 0 &&
    (pendingApprovals ?? 0) === 0 && slaBreached === 0 &&
    (calibrationOverdue ?? 0) === 0;

  const tiles = [
    {
      icon: '🔴', label: 'Open Complaints', count: openCount,
      href: '/complaints', urgent: openCount > 0,
      color: openCount > 0 ? { card: 'border-red-200 bg-red-50', num: 'text-red-600', sub: 'text-red-600/70' }
        : { card: 'border-[#dbeafe] bg-[#eff6ff]', num: 'text-[#1e3a5f]', sub: 'text-[#1e3a5f]' },
    },
    {
      icon: '🚨', label: 'Critical', count: criticalCount,
      href: '/complaints?severity=Critical', urgent: criticalCount > 0,
      color: criticalCount > 0 ? { card: 'border-red-200 bg-red-50', num: 'text-red-600', sub: 'text-red-600/70' }
        : { card: 'border-[#dbeafe] bg-[#eff6ff]', num: 'text-[#1e3a5f]', sub: 'text-[#1e3a5f]' },
    },
    {
      icon: '⏳', label: 'Approvals Pending', count: pendingApprovals ?? 0,
      href: '/approvals', urgent: (pendingApprovals ?? 0) > 0,
      color: (pendingApprovals ?? 0) > 0
        ? { card: 'border-orange-200 bg-orange-50', num: 'text-orange-600', sub: 'text-orange-400/70' }
        : { card: 'border-[#dbeafe] bg-[#eff6ff]', num: 'text-[#1e3a5f]', sub: 'text-[#1e3a5f]' },
    },
    {
      icon: '⏰', label: 'SLA Breached', count: slaBreached,
      href: '/sla', urgent: slaBreached > 0,
      color: slaBreached > 0 ? { card: 'border-amber-200 bg-amber-50', num: 'text-amber-600', sub: 'text-amber-600/70' }
        : { card: 'border-[#dbeafe] bg-[#eff6ff]', num: 'text-[#1e3a5f]', sub: 'text-[#1e3a5f]' },
    },
    {
      icon: '🔧', label: 'Calibration Due', count: calibrationOverdue ?? 0,
      href: '/calibration', urgent: (calibrationOverdue ?? 0) > 0,
      color: (calibrationOverdue ?? 0) > 0
        ? { card: 'border-purple-200 bg-purple-50', num: 'text-purple-700', sub: 'text-purple-400/70' }
        : { card: 'border-[#dbeafe] bg-[#eff6ff]', num: 'text-[#1e3a5f]', sub: 'text-[#1e3a5f]' },
    },
  ];

  return (
      <>
      <PageTitle title="Dashboard" />
      <div className="bg-white border border-[#dbeafe] rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1e3a5f]">⚡ Needs Your Attention</span>
          <span className="flex items-center gap-1 text-[10px] text-[#15803d] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live
          </span>
        </div>
        {allClear && (
          <span className="text-xs text-[#15803d] font-bold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
            ✅ All Clear — No urgent actions
          </span>
        )}
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {tiles.map(t => (
          <Link key={t.label} href={t.href} className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-center no-underline transition-all hover:scale-[1.02] ${t.color.card}`}>
            {t.urgent && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 z-10">
                {t.count > 99 ? '99+' : t.count}
              </span>
            )}
            <span className="text-lg">{t.icon}</span>
            <span className={`text-2xl font-black leading-none ${t.color.num}`}>{t.count}</span>
            <span className={`text-[9px] font-semibold leading-tight ${t.color.sub}`}>{t.label}</span>
          </Link>
        ))}
      </div>
    </div>
      </>
  );
}

// --- LIVE KPI TYPES -----------------------------------------------------------
interface DashData {
  total: number; open: number; closed: number; critical: number;
  inProgress: number; ppm: number;
  trend: { month: string; opened: number; closed: number }[];
  bySeverity: { severity: string; count: number }[];
}

// --- ACTIVITY REGISTER CONSTANTS ---------------------------------------------
const FREQ_ORDER = ['Daily','Weekly','Biweekly','Monthly','Quarterly','Six Monthly','Yearly'];

const FREQ_BADGE: Record<string,string> = {
  'Daily':'bg-red-600 text-white',
  'Weekly':'bg-blue-700 text-white',
  'Biweekly':'bg-amber-500 text-white',
  'Monthly':'bg-blue-600 text-white',
  'Quarterly':'bg-green-600 text-white',
  'Six Monthly':'bg-purple-600 text-white',
  'Yearly':'bg-gray-600 text-white',
};

const FREQ_CARD: Record<string,string> = {
  'Daily':'bg-red-50 border-red-700/60',
  'Weekly':'bg-orange-950/50 border-orange-700/60',
  'Biweekly':'bg-amber-950/50 border-amber-200',
  'Monthly':'bg-[#eff6ff] border-blue-700/60',
  'Quarterly':'bg-green-950/50 border-green-700/60',
  'Six Monthly':'bg-purple-950/50 border-purple-700/60',
  'Yearly':'bg-[#eff6ff] border-[#dbeafe]',
};

const CAT_STYLE: Record<string,{bg:string;border:string;hdr:string;txt:string;body?:string}> = {
  'Customer Quality':   {bg:'bg-[#eff6ff]',    border:'border-blue-700/50',    hdr:'bg-blue-900/50',    txt:'text-[#1d4ed8]',    body:'text-[#1e3a5f]'},
  'QMS & MR':           {bg:'bg-purple-950/40',  border:'border-purple-700/50',  hdr:'bg-purple-900/50',  txt:'text-purple-300',  body:'text-[#1e3a5f]'},
  'Corporate Reporting':{bg:'bg-indigo-50',  border:'border-indigo-700/50',  hdr:'bg-indigo-900/50',  txt:'text-indigo-300',  body:'text-[#1e3a5f]'},
  'Incoming':           {bg:'bg-teal-950/40',    border:'border-teal-700/50',    hdr:'bg-teal-900/50',    txt:'text-teal-300',    body:'text-[#1e3a5f]'},
  'Supplier Quality':   {bg:'bg-orange-950/40',  border:'border-orange-700/50',  hdr:'bg-orange-900/50',  txt:'text-orange-600',  body:'text-[#1e3a5f]'},
  'Inprocess':          {bg:'bg-green-950/40',   border:'border-green-700/50',   hdr:'bg-green-900/50',   txt:'text-green-300',   body:'text-[#1e3a5f]'},
  'TQM/TBEM':           {bg:'bg-yellow-950/40',  border:'border-yellow-700/50',  hdr:'bg-yellow-900/50',  txt:'text-yellow-300',  body:'text-[#1e3a5f]'},
  'Manufacturing':      {bg:'bg-red-50',     border:'border-red-700/50',     hdr:'bg-red-900/50',     txt:'text-red-600',     body:'text-[#1e3a5f]'},
  'Development':        {bg:'bg-cyan-950/40',    border:'border-cyan-700/50',    hdr:'bg-cyan-900/50',    txt:'text-cyan-300',    body:'text-[#1e3a5f]'},
  'Production':         {bg:'bg-emerald-950/40', border:'border-emerald-700/50', hdr:'bg-emerald-900/50', txt:'text-[#15803d]', body:'text-[#1e3a5f]'},
  'Managerial':         {bg:'bg-violet-950/40',  border:'border-violet-700/50',  hdr:'bg-violet-900/50',  txt:'text-violet-300',  body:'text-[#1e3a5f]'},
};

const CAT_ICON: Record<string,string> = {
  'Customer Quality':'🚗','QMS & MR':'📋','Corporate Reporting':'📊',
  'Incoming':'📦','Supplier Quality':'🏭','Inprocess':'⚙️',
  'TQM/TBEM':'🏆','Manufacturing':'🔧','Development':'🔬',
  'Production':'🏗️','Managerial':'👔',
};

interface Item { name: string; freq: string; }
interface Cat  { category: string; items: Item[]; }

const DATA: Cat[] = [
  { category:'Customer Quality', items:[
    {name:'Customer Warranty',freq:'Weekly'},
    {name:'FG Seat Layout & GA Drawing',freq:'Monthly'},
    {name:'Customer Rejection',freq:'Monthly'},
    {name:'Customer Concern & TML PRR',freq:'Monthly'},
    {name:'Customer PDI Reports & Tracking',freq:'Weekly'},
    {name:'Customer Approved PPAP',freq:'Monthly'},
    {name:'Customer Scorecard',freq:'Monthly'},
    {name:'4M Change Upload - TML',freq:'Monthly'},
    {name:'Send OVR Data - TMBSL',freq:'Monthly'},
    {name:'Daily Customer Dispatch Tracking',freq:'Daily'},
    {name:'Customer PDI Upload - TML',freq:'Daily'},
    {name:'Customer MOM & Closure',freq:'Monthly'},
    {name:'TAC Extension Report',freq:'Monthly'},
    {name:'Customer Audit & Sustainability',freq:'Monthly'},
    {name:'CSAT Analysis & Closure',freq:'Monthly'},
    {name:'Structured Visit Plan & Closure',freq:'Monthly'},
    {name:'Customer Requirements',freq:'Quarterly'},
    {name:'Customer Satisfaction - IATF',freq:'Quarterly'},
    {name:'Customer Improvement',freq:'Monthly'},
    {name:'Customer Deviation',freq:'Monthly'},
    {name:'TMBSL DSL',freq:'Monthly'},
  ]},
  { category:'QMS & MR', items:[
    {name:'Audit Plan & Adherence',freq:'Biweekly'},
    {name:'External IATF',freq:'Biweekly'},
    {name:'External ISO 14001 & 45001',freq:'Quarterly'},
    {name:'MR Appointment',freq:'Yearly'},
    {name:'Contingency Plan',freq:'Six Monthly'},
    {name:'Management Review',freq:'Six Monthly'},
    {name:'Plant Objective',freq:'Monthly'},
    {name:'Plant Processes & Outsourced Process',freq:'Yearly'},
    {name:'Alternative & Back-up Method',freq:'Yearly'},
    {name:'Quality Policy',freq:'Yearly'},
    {name:'Plant Issue List',freq:'Monthly'},
    {name:'CI Opportunities',freq:'Quarterly'},
    {name:'Award Nominations',freq:'Monthly'},
    {name:'Internal IATF Audit',freq:'Quarterly'},
    {name:'Internal Process Audit',freq:'Monthly'},
    {name:'Internal Product Audit',freq:'Monthly'},
    {name:'Internal Control Plan Audit',freq:'Monthly'},
    {name:'Internal CSR Audit',freq:'Quarterly'},
    {name:'Internal Craftsmanship Audit',freq:'Monthly'},
    {name:'Internal 6S Audit',freq:'Monthly'},
    {name:'Internal IFC Audit',freq:'Monthly'},
    {name:'TACO TM Policies (Vision & Mission)',freq:'Yearly'},
    {name:'From Sushree Raw Data',freq:'Monthly'},
    {name:'Document Control',freq:'Quarterly'},
    {name:'CI Plant Improvement',freq:'Monthly'},
    {name:'Risk & Opportunities',freq:'Six Monthly'},
    {name:'Empowerment & Motivation',freq:'Monthly'},
  ]},
  { category:'Corporate Reporting', items:[
    {name:'QRM Data',freq:'Monthly'},
    {name:'Plant Ops MIS - Dharwad',freq:'Monthly'},
    {name:'Quality MIS with COPQ & Scrap Sign off',freq:'Weekly'},
    {name:'Weekly Report - Supplier',freq:'Weekly'},
    {name:'Weekly Report - Inprocess',freq:'Weekly'},
    {name:'Inprocess Weekly Report',freq:'Weekly'},
    {name:'MD Dashboard Data',freq:'Monthly'},
    {name:'IFC Data & Quality Ticks',freq:'Monthly'},
    {name:'Send Customer Rating for MIS',freq:'Monthly'},
    {name:'MPCP Filled Up',freq:'Monthly'},
  ]},
  { category:'Incoming', items:[
    {name:'Child Part Drawing',freq:'Monthly'},
    {name:'DOL / NDOL List',freq:'Monthly'},
    {name:'List of Incoming Materials',freq:'Monthly'},
    {name:'Incoming Parts Layout Inspection',freq:'Monthly'},
    {name:'Incoming Appearance Manual',freq:'Monthly'},
    {name:'Incoming Fixture Validation Reports',freq:'Quarterly'},
    {name:'Supplier Inward Data',freq:'Monthly'},
    {name:'Incoming Check Sheet & Adherence',freq:'Monthly'},
    {name:'Incoming Control Plan / Quality Plan',freq:'Monthly'},
    {name:'Incoming Skill Matrix',freq:'Monthly'},
    {name:'Quarantine Data & Disposal',freq:'Weekly'},
  ]},
  { category:'Supplier Quality', items:[
    {name:'Supplier PPAP & Packaging Sign off',freq:'Monthly'},
    {name:'Supplier Wise Issues Reporting',freq:'Weekly'},
    {name:'Supplier 4M Changes',freq:'Monthly'},
    {name:'Supplier REPPAP',freq:'Monthly'},
    {name:'Supplier Development Activities',freq:'Monthly'},
    {name:'Approved Supplier List & QMS',freq:'Monthly'},
    {name:'Supplier Quality Issue & MOM',freq:'Daily'},
    {name:'Supplier Rework',freq:'Daily'},
    {name:'Supplier Improvement - FTG & Others',freq:'Monthly'},
    {name:'Supplier PDIR & Part Layout Inspection',freq:'Daily'},
    {name:'Supplier PPM Trend Chart & Action Plan',freq:'Weekly'},
    {name:'Supplier Containment Action',freq:'Daily'},
    {name:'Supplier Training Plan',freq:'Monthly'},
    {name:'Supplier Process Audit - CQI',freq:'Monthly'},
    {name:'Material Compliance & Test Report',freq:'Monthly'},
    {name:'Supplier NDA Sign off',freq:'Monthly'},
    {name:'Supplier System Audit & Adherence',freq:'Monthly'},
    {name:'Supplier Debit Note',freq:'Monthly'},
    {name:'Supplier Rating & Best/Worst Supplier',freq:'Monthly'},
    {name:'Limit Sample Validation',freq:'Monthly'},
    {name:'Supplier Kaizen & Quality Circle',freq:'Monthly'},
    {name:'Supplier Part Weight Verification',freq:'Monthly'},
  ]},
  { category:'Inprocess', items:[
    {name:'Customer Wise Dispatch Sheet',freq:'Daily'},
    {name:'Red Bin Analysis & FTT',freq:'Weekly'},
    {name:'Customer Concern Tracking - EOL Issue',freq:'Weekly'},
    {name:'Control Plan (Incoming, Inprocess & EOL)',freq:'Monthly'},
    {name:'Capability - SPC',freq:'Monthly'},
    {name:'EOL Check Sheet & Actual Inspection',freq:'Monthly'},
    {name:'R&R - MSA (Variable & Attributes)',freq:'Monthly'},
    {name:'Measuring Instruments List & Calibration',freq:'Monthly'},
    {name:'IPPM Trend Chart & Action Plan',freq:'Monthly'},
    {name:'Model Wise Quality Plan',freq:'Monthly'},
    {name:'Plant Layout',freq:'Monthly'},
    {name:'Scrap Data',freq:'Weekly'},
    {name:'Plant 4M Changes',freq:'Monthly'},
    {name:'FG Seat Layout Inspection',freq:'Monthly'},
    {name:'Appearance Manual - FG Seat',freq:'Monthly'},
    {name:'EOL Skill Assessment',freq:'Monthly'},
    {name:'Rework PFMEA, ODS & WI',freq:'Monthly'},
    {name:'ODS / SOP',freq:'Monthly'},
    {name:'Process Control Sheet',freq:'Monthly'},
    {name:'Pokayoke Control & Tracking',freq:'Monthly'},
    {name:'Alternative Method',freq:'Monthly'},
    {name:'Traceability Management & Stickers',freq:'Monthly'},
    {name:'Local Master List',freq:'Monthly'},
    {name:'External Master List',freq:'Monthly'},
    {name:'Control & Retention of Documents',freq:'Monthly'},
    {name:'Inhouse Deviation',freq:'Monthly'},
  ]},
  { category:'TQM/TBEM', items:[
    {name:'TEI Sheet',freq:'Weekly'},
    {name:'QCC',freq:'Weekly'},
    {name:'QC Story',freq:'Weekly'},
    {name:'Kaizen',freq:'Weekly'},
    {name:'Green Belt Project',freq:'Monthly'},
    {name:'TBEM',freq:'Monthly'},
    {name:'External Awards Participation',freq:'Monthly'},
    {name:'TML DWM',freq:'Monthly'},
  ]},
  { category:'Manufacturing', items:[
    {name:'PFD',freq:'Monthly'},
    {name:'Inprocess PFMEA',freq:'Monthly'},
    {name:'Process Change & Trial Results',freq:'Monthly'},
    {name:'SOP / ODS',freq:'Monthly'},
    {name:'Rework PFMEA',freq:'Monthly'},
    {name:'Plant Layout',freq:'Monthly'},
  ]},
  { category:'Development', items:[
    {name:'Development Parts Inspection',freq:'Monthly'},
    {name:'Product Change / APQP Process',freq:'Monthly'},
    {name:'FG Seat Layout',freq:'Monthly'},
    {name:'Test Report',freq:'Monthly'},
  ]},
  { category:'Production', items:[
    {name:'Process Control Sheet',freq:'Monthly'},
    {name:'Consumable Planning',freq:'Monthly'},
    {name:'Scrap Planning for Consumable',freq:'Monthly'},
  ]},
  { category:'Managerial', items:[
    {name:'Manpower Skill Assessment',freq:'Monthly'},
    {name:'Development / Upgradation Planning',freq:'Monthly'},
    {name:'Training to Team',freq:'Monthly'},
    {name:'Quality Manpower Planning',freq:'Monthly'},
    {name:'DL with Target - QA Team',freq:'Monthly'},
    {name:'Cost Saving Idea / VAVE Projects',freq:'Monthly'},
    {name:'Involvement in Employee Engagement',freq:'Monthly'},
    {name:'Quality Ticks Review',freq:'Monthly'},
  ]},
];

// --- PPM GAUGE ----------------------------------------------------------------
function PpmGauge({ ppm }: { ppm: number }) {
  const max = 500;
  const pct = Math.min((ppm / max) * 100, 100);
  const color = ppm <= 100 ? '#22c55e' : ppm <= 300 ? '#f59e0b' : '#ef4444';
  const label = ppm <= 100 ? 'GOOD' : ppm <= 300 ? 'WATCH' : 'CRITICAL';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#1e3a5f]">Customer PPM</span>
        <span className="font-bold" style={{ color }}>{ppm.toFixed(0)} PPM — {label}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs text-[#1e3a5f] mt-0.5">
        <span>0</span><span>Target: 100</span><span>500</span>
      </div>
    </div>
  );
}

// --- LIVE KPI CARD ------------------------------------------------------------
function LiveKpi({ icon, label, value, sub, alert }: { icon: string; label: string; value: string | number; sub?: string; alert?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 flex flex-col gap-1 transition-all ${alert ? 'border-red-200 shadow-lg shadow-red-900/20' : 'border-[#dbeafe] hover:border-[#dbeafe]'}`}>
      <div className="flex items-center justify-between">
        <span className="text-base">{icon}</span>
        {alert && <span className="text-[10px] font-bold text-red-600 animate-pulse tracking-wide">ALERT</span>}
      </div>
      <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] font-semibold text-[#1e3a5f] uppercase tracking-widest">{label}</p>
      {sub && <p className="text-[10px] text-[#1e3a5f]">{sub}</p>}
    </div>
  );
}

// --- MINI TREND SPARKLINE -----------------------------------------------------
function Sparkline({ data }: { data: { month: string; opened: number; closed: number }[] }) {
  const vals = data.map(d => d.opened);
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-1.5 h-10">
      {vals.slice(-6).map((v, i) => (
        <div key={i} className="flex-1 bg-blue-500/60 hover:bg-blue-400/80 rounded-t transition-all" style={{ height: `${Math.max(3, (v / max) * 40)}px` }} title={`${v}`} />
      ))}
    </div>
  );
}

// --- AI INSIGHTS ENGINE -------------------------------------------------------
interface KpiSnapshot {
  total: number; open: number; critical: number; inProgress: number;
  closed: number; ppm: number;
  trend?: { month: string; opened: number; closed: number }[];
  bySeverity?: { severity: string; count: number }[];
}
interface SlaSnapshot { breached: number; warning: number; total: number; }

interface AiInsight {
  level: 'critical' | 'warning' | 'info' | 'good';
  icon: string; title: string; detail: string; action: string;
  iatf?: string; href?: string;
}

function buildInsights(kpi: KpiSnapshot, sla: SlaSnapshot | null): AiInsight[] {
  const insights: AiInsight[] = [];
  const closureRate = kpi.total > 0 ? Math.round((kpi.closed / kpi.total) * 100) : 0;

  // -- Critical complaints
  if (kpi.critical >= 3) {
    insights.push({ level:'critical', icon:'🚨', title:`${kpi.critical} Critical Complaints Open`,
      detail:`You have ${kpi.critical} unresolved critical complaints. This is a significant customer satisfaction and audit risk. Immediate escalation required.`,
      action:'Review & escalate all critical complaints now', iatf:'IATF §10.2.3', href:'/complaints' });
  } else if (kpi.critical >= 1) {
    insights.push({ level:'warning', icon:'⚠️', title:`${kpi.critical} Critical Complaint${kpi.critical>1?'s':''} Needs Attention`,
      detail:`Critical complaint${kpi.critical>1?'s require':'requires'} Quality Head sign-off and 8D within 24 hours per IATF §10.2.3.`,
      action:'Check 8D completion and containment status', iatf:'IATF §10.2.3', href:'/complaints' });
  }

  // -- PPM
  if (kpi.ppm > 5000) {
    insights.push({ level:'critical', icon:'📈', title:`PPM at ${kpi.ppm.toLocaleString()} — Far Above Target`,
      detail:`Current PPM of ${kpi.ppm.toLocaleString()} significantly exceeds typical OEM targets (500–1000 PPM). Immediate process review and customer escalation risk.`,
      action:'Run PPM root cause analysis — review top defect categories', iatf:'IATF §9.1.3', href:'/ppm-analytics' });
  } else if (kpi.ppm > 1000) {
    insights.push({ level:'warning', icon:'📊', title:`PPM ${kpi.ppm.toLocaleString()} — Above Target`,
      detail:`PPM trending above acceptable range. Review top contributing categories and activate corrective action plans.`,
      action:'Open PPM Analytics to identify top contributors', iatf:'IATF §9.1.3', href:'/ppm-analytics' });
  } else if (kpi.ppm > 0 && kpi.ppm <= 500) {
    insights.push({ level:'good', icon:'✅', title:`PPM ${kpi.ppm.toLocaleString()} — Within Target`,
      detail:`Current PPM is within acceptable range. Continue monitoring monthly trend. Sustain current controls.`,
      action:'Maintain SPC monitoring and Control Plan adherence', iatf:'IATF §9.1.1', href:'/spc' });
  }

  // -- SLA breach
  if (sla && sla.breached >= 2) {
    insights.push({ level:'critical', icon:'⏰', title:`${sla.breached} Complaints Past SLA Deadline`,
      detail:`${sla.breached} complaints have exceeded their target closure date. This creates formal customer escalation risk and audit evidence of process failure.`,
      action:'Review overdue complaints — update status or escalate', iatf:'IATF §8.5.1', href:'/sla' });
  } else if (sla && sla.breached === 1) {
    insights.push({ level:'warning', icon:'⏱️', title:`1 Complaint Past SLA — Escalation Risk`,
      detail:`One complaint is past its target date. Customer may already be tracking this.`,
      action:'Contact customer and update complaint with new closure date', iatf:'IATF §8.5.1', href:'/sla' });
  } else if (sla && sla.warning >= 2) {
    insights.push({ level:'warning', icon:'🕐', title:`${sla.warning} Complaints Approaching SLA`,
      detail:`${sla.warning} complaints are within 48 hours of their target closure date. Prioritise CAPA closure.`,
      action:'Check CAPA status on at-risk complaints', href:'/sla' });
  }

  // -- Closure rate
  if (kpi.total >= 5 && closureRate < 40) {
    insights.push({ level:'critical', icon:'🔒', title:`Closure Rate ${closureRate}% — Below 50% Target`,
      detail:`Less than half of all complaints are closed. This signals systemic CAPA delays. Management Review action required per IATF §9.3.`,
      action:'Accelerate CAPA completion — review open 8D reports', iatf:'IATF §9.3.2', href:'/capa' });
  } else if (kpi.total >= 5 && closureRate < 60) {
    insights.push({ level:'warning', icon:'📉', title:`Closure Rate ${closureRate}% — Needs Improvement`,
      detail:`Closure rate below 60% indicates pending CAPAs. Review overdue actions and assign owners.`,
      action:'Run CAPA tracker — close out verified actions', iatf:'IATF §10.2', href:'/capa' });
  } else if (kpi.total >= 5 && closureRate >= 80) {
    insights.push({ level:'good', icon:'🏆', title:`Closure Rate ${closureRate}% — Excellent`,
      detail:`Closure rate above 80% reflects strong CAPA discipline. Capture lessons learned to prevent recurrence.`,
      action:'Update Lessons Learned database with closed complaint insights', iatf:'IATF §10.2.4', href:'/lessons-learned' });
  }

  // -- Open complaint backlog
  if (kpi.open >= 10) {
    insights.push({ level:'warning', icon:'📦', title:`${kpi.open} Open Complaints — High Backlog`,
      detail:`Open complaint backlog of ${kpi.open} increases audit risk. Consider complaint review meeting to bulk-triage.`,
      action:'Use bulk operations to assign and triage open complaints', href:'/complaints' });
  }

  // -- Trend analysis (if available)
  if (kpi.trend && kpi.trend.length >= 3) {
    const recent = kpi.trend.slice(-3);
    const rising = recent.every((m, i) => i === 0 || m.opened >= recent[i-1].opened);
    const falling = recent.every((m, i) => i === 0 || m.opened <= recent[i-1].opened);
    if (rising && recent[2].opened > 2) {
      insights.push({ level:'warning', icon:'📈', title:'Complaints Rising 3 Months Consecutively',
        detail:`Month-over-month complaint volume is increasing. Early intervention recommended before escalation.`,
        action:'Investigate systemic root cause — check supplier quality and process changes', iatf:'IATF §6.1', href:'/ppm-analytics' });
    } else if (falling && recent[0].opened > 1) {
      insights.push({ level:'good', icon:'📉', title:'Complaint Volume Declining — Positive Trend',
        detail:'Complaint volume has decreased over the last 3 months. Document contributing factors in Management Review.',
        action:'Capture improvement evidence for next Management Review', iatf:'IATF §9.3', href:'/management-review' });
    }
  }

  // -- Healthy state
  if (insights.length === 0) {
    insights.push({ level:'good', icon:'🟢', title:'All Indicators Within Normal Range',
      detail:'No critical or warning signals detected. Quality system is operating within expected parameters.',
      action:'Continue routine monitoring — prepare for next Management Review', iatf:'IATF §9.3' });
  }

  return insights;
}

const INSIGHT_STYLE = {
  critical: { border:'border-red-200', bg:'bg-red-50', icon_bg:'bg-red-500/20', title:'text-red-600', badge:'bg-red-900/60 text-red-600 border-red-700/50' },
  warning:  { border:'border-amber-500/40', bg:'bg-amber-950/20', icon_bg:'bg-amber-500/15', title:'text-amber-600', badge:'bg-amber-50 text-amber-600 border-amber-200' },
  info:     { border:'border-[#bfdbfe]', bg:'bg-[#eff6ff]', icon_bg:'bg-blue-500/15', title:'text-[#1d4ed8]', badge:'bg-blue-900/40 text-[#1d4ed8] border-blue-700/30' },
  good:     { border:'border-emerald-500/30', bg:'bg-emerald-950/15', icon_bg:'bg-emerald-500/15', title:'text-[#15803d]', badge:'bg-emerald-900/40 text-[#15803d] border-emerald-700/30' },
};

// --- MAIN PAGE ----------------------------------------------------------------
export default function QualityHeadDashboard() {
  // -- Session + RBAC --
  const { session } = useSession();

  // -- Live KPI state (legacy /api/reports) --
  const [kpi, setKpi] = useState<DashData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(d => { setKpi(d); setKpiLoading(false); })
      .catch(() => setKpiLoading(false));
  }, []);

  // -- Live quality KPIs (Supabase complaints — richer data) --
  const { data: qkpis } = useQualityKPIs();
  const sla = useSLASummary();
  const calibrationOverdue = useCalibrationOverdue();
  const pendingApprovals   = useApprovalsPending();

  // -- Notification count --
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    fetch('/api/notifications?count=true')
      .then(r => r.json())
      .then(d => setNotifCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  // -- Activity register filters --
  const [search, setSearch] = useState('');
  const [freqFilter, setFreqFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');

  const allItems = useMemo(() => DATA.flatMap(c => c.items), []);

  const stats = useMemo(() => {
    const counts: Record<string,number> = {};
    FREQ_ORDER.forEach(f => { counts[f] = 0; });
    allItems.forEach(item => { if (item.freq && counts[item.freq] !== undefined) counts[item.freq]++; });
    return counts;
  }, [allItems]);

  const filtered = useMemo(() => DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      const mf = freqFilter === 'All' || item.freq === freqFilter;
      const ms = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const mc = catFilter === 'All' || cat.category === catFilter;
      return mf && ms && mc;
    }),
  })).filter(cat => (catFilter === 'All' || cat.category === catFilter) && cat.items.length > 0),
  [freqFilter, search, catFilter]);

  const totalFiltered = filtered.reduce((s, c) => s + c.items.length, 0);
  const anyFilter = freqFilter !== 'All' || !!search || catFilter !== 'All';

  // Derived alerts
  const hasCritical = kpi && kpi.critical > 0;
  const ppmAlert    = kpi && kpi.ppm > 100;

  // Today info
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="q-page">

      {/* -- CRITICAL ALERT BANNER ------------------------------------------ */}
      {hasCritical && (
        <div className="bg-red-600 text-white text-center py-2 text-xs font-bold tracking-wide">
          🚨 {kpi!.critical} CRITICAL complaint{kpi!.critical > 1 ? 's' : ''} open — Escalation required immediately
        </div>
      )}

      <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

        {/* -- NOTIFICATION ALERT --------------------------------------------- */}
        {notifCount > 0 && (
          <Link href="/notifications"
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl q-alert-blue hover:border-blue-400/50 transition-colors no-underline flex-wrap">
            <div className="flex items-center gap-2 text-sm text-[#1d4ed8]">
              <span>🔔</span>
              <span><strong className="text-blue-200">{notifCount} unread alert{notifCount > 1 ? 's' : ''}</strong> require your attention</span>
            </div>
            <span className="text-xs text-[#1d4ed8] font-semibold whitespace-nowrap">View all →</span>
          </Link>
        )}

        {/* -- PERSONALIZED GREETING ------------------------------------------ */}
        {session && (
          <div className="bg-white border border-[#dbeafe] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-white">
                  {(() => {
                    const h = new Date().getHours();
                    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
                  })()}, {session.name.split(' ')[0]} 👋
                </h1>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${RBAC_ROLES[session.rbacRole].bg}`}>
                  {RBAC_ROLES[session.rbacRole].icon} {RBAC_ROLES[session.rbacRole].label}
                </span>
              </div>
              <p className="text-[#1e3a5f] text-xs mt-1">{session.department} · {session.plant} · {today}</p>
            </div>
            {/* Quick actions — role-aware */}
            <div className="flex flex-wrap gap-2">
              {session.can.editComplaints && (
                <Link href="/customer-quality" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-200 text-red-600 hover:bg-red-500/20 transition-colors no-underline">
                  + New Complaint
                </Link>
              )}
              {session.can.approveCAPA && (
                <Link href="/capa" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 border border-orange-200 text-orange-400 hover:bg-orange-50 transition-colors no-underline">
                  CAPA Review
                </Link>
              )}
              <Link href="/audit" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/10 border border-[#bfdbfe] text-[#1d4ed8] hover:bg-blue-500/20 transition-colors no-underline">
                Audit Center
              </Link>
              {session.can.managementReview && (
                <Link href="/management-review" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-200 text-indigo-400 hover:bg-indigo-500/20 transition-colors no-underline">
                  MRM
                </Link>
              )}
            </div>
          </div>
        )}

        {/* -- COMMAND PANEL — What needs attention now ----------------------- */}
        <CommandPanel
          openCount={kpi?.open ?? 0}
          criticalCount={kpi?.critical ?? 0}
          pendingApprovals={pendingApprovals}
          slaBreached={sla?.breached ?? 0}
          calibrationOverdue={calibrationOverdue}
        />

        {/* -- RECENT OPEN COMPLAINTS (Live Supabase) ------------------------- */}
        {qkpis && qkpis.recentOpen.length > 0 && (
          <div className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#dbeafe] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">🚨 Open Complaints — Priority Queue</span>
                <span className="flex items-center gap-1 text-xs text-[#15803d] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
                  Live
                </span>
              </div>
              <Link href="/complaints" className="text-xs text-[#1d4ed8] hover:text-[#1d4ed8] no-underline font-medium">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#dbeafe]">
                    {['Ref','Customer','Part','Severity','Status','Age'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {qkpis.recentOpen.slice(0, 6).map(c => {
                    const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
                    const SEV: Record<string,string> = {
                      Critical:'text-red-600 font-bold', High:'text-orange-400 font-bold',
                      Medium:'text-amber-600', Low:'text-[#1e3a5f]',
                    };
                    return (
                      <tr key={c.id} className="border-b border-[#dbeafe] hover:bg-white/[0.03] cursor-pointer transition-colors"
                        onClick={() => window.location.href = `/complaints/${c.id}`}>
                        <td className="px-4 py-2.5 font-mono text-[#1d4ed8] hover:text-[#1d4ed8]">{c.complaint_number}</td>
                        <td className="px-4 py-2.5 text-[#1e3a5f] whitespace-nowrap">{c.customer}</td>
                        <td className="px-4 py-2.5 text-[#1e3a5f] max-w-[120px] truncate">{c.part_name}</td>
                        <td className={`px-4 py-2.5 ${SEV[c.severity] ?? 'text-[#1e3a5f]'}`}>{c.severity}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#f0f9ff]/60 text-[#1e3a5f] text-[10px] font-medium">{c.status}</span>
                        </td>
                        <td className={`px-4 py-2.5 font-semibold ${days > 14 ? 'text-red-600' : days > 7 ? 'text-amber-600' : 'text-[#1e3a5f]'}`}>
                          {days}d
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -- Pending Approvals Widget -------------------------------------- */}
        {qkpis && qkpis.recentOpen.filter(c => c.status === 'Pending Closure').length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-orange-700/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-orange-600">⏳ Pending QH Approval</span>
                <span className="bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                  {qkpis.recentOpen.filter(c => c.status === 'Pending Closure').length}
                </span>
              </div>
              <Link href="/approvals" className="text-xs text-orange-400 hover:text-orange-600 font-semibold no-underline">
                Review &amp; Approve →
              </Link>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {qkpis.recentOpen.filter(c => c.status === 'Pending Closure').map(c => (
                <Link key={c.id} href={`/complaints/${c.id}`}
                  className="inline-flex items-center gap-1.5 bg-white border border-orange-200 px-3 py-1.5 rounded-lg text-xs hover:bg-orange-50 transition no-underline">
                  <span className="font-mono text-orange-600 font-bold">{c.complaint_number}</span>
                  <span className="text-orange-400">{c.customer}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.severity === 'Critical' ? 'bg-red-500 text-white' : c.severity === 'High' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-black'}`}>
                    {c.severity}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* -- SLA Status Widget ---------------------------------------------- */}
        {sla && (sla.breached > 0 || sla.warning > 0) && (
          <div className={`border rounded-2xl overflow-hidden ${sla.breached > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="px-5 py-3 border-b border-red-700/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-600">⏰ SLA Status</span>
                {sla.breached > 0 && (
                  <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{sla.breached} breached</span>
                )}
                {sla.warning > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{sla.warning} at risk</span>
                )}
              </div>
              <Link href="/sla" className="text-xs text-red-600 hover:text-red-600 font-semibold no-underline">
                View SLA Dashboard →
              </Link>
            </div>
            <div className="px-5 py-3 flex gap-4 text-sm text-[#1e3a5f]">
              <span>Open complaints: <strong className="text-[#1e3a5f]">{sla.total}</strong></span>
              {sla.breached > 0 && <span className="text-red-600 font-bold">🚨 {sla.breached} past target closure date</span>}
              {sla.warning > 0 && <span className="text-orange-400 font-bold">⚠️ {sla.warning} closing in &lt;25% of SLA time</span>}
            </div>
          </div>
        )}

        {/* -- PAGE HEADER (original, kept below new section) ----------------- */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">📋 Activity Register</h2>
            <p className="text-[#1e3a5f] text-sm mt-0.5">Complete Quality Head task register — IATF 16949 · AIAG VDA</p>
          </div>
          <div className="text-right text-xs text-[#1e3a5f]">
            <div>{allItems.length} tasks · {DATA.length} departments</div>
          </div>
        </div>

        {/* -- LIVE KPI SECTION ----------------------------------------------- */}
        <div className="bg-white border border-[#dbeafe] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-y-2">
            <h2 className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest">📡 Live Quality Status</h2>
            <div className="flex items-center gap-3">
              {kpiLoading ? (
                <span className="text-xs text-[#1e3a5f] animate-pulse">Loading...</span>
              ) : (
                <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Live
                </span>
              )}
              <Link href="/" className="text-xs text-[#1d4ed8] hover:text-[#1d4ed8] font-medium no-underline">Command Center →</Link>
            </div>
          </div>

          {kpiLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-[#eff6ff] rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          ) : kpi ? (
            <>
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <LiveKpi icon="📋" label="Total Complaints" value={kpi.total} sub="All time" />
                <LiveKpi icon="🔴" label="Open Now" value={kpi.open} sub="Need action" alert={kpi.open > 0} />
                <LiveKpi icon="🚨" label="Critical" value={kpi.critical} sub="Escalate now" alert={hasCritical ?? false} />
                <LiveKpi icon="🔧" label="CAPA In Progress" value={kpi.inProgress} sub="Under action" />
                <LiveKpi icon="✅" label="Closed" value={kpi.closed} sub="Resolved" />
              </div>

              {/* PPM Gauge + Trend Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#dbeafe]">
                  <PpmGauge ppm={kpi.ppm} />
                  {ppmAlert && (
                    <p className="text-xs text-red-600 mt-2 font-medium">⚠ PPM exceeds target — review in <Link href="/analytics" className="underline text-red-600">Analytics</Link></p>
                  )}
                </div>

                {kpi.trend.length > 0 ? (
                  <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#dbeafe]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider">Monthly Complaint Trend</span>
                      <span className="flex items-center gap-1 text-[10px] text-[#1e3a5f]">
                        <span className="w-2 h-2 bg-blue-500/70 rounded inline-block" />Opened
                      </span>
                    </div>
                    <Sparkline data={kpi.trend} />
                  </div>
                ) : (
                  <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#dbeafe] flex items-center justify-center">
                    <p className="text-xs text-[#1e3a5f]">No trend data yet — log complaints to build trend</p>
                  </div>
                )}
              </div>

              {/* Severity breakdown */}
              {kpi.bySeverity.length > 0 && (
                <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#dbeafe]">
                  <p className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider mb-3">By Severity</p>
                  <div className="flex flex-wrap gap-2">
                    {kpi.bySeverity.map(s => {
                      const colors: Record<string,string> = { Critical:'text-red-600', High:'text-orange-400', Medium:'text-amber-600', Low:'text-green-400' };
                      const bars: Record<string,string>   = { Critical:'bg-red-500', High:'bg-orange-400', Medium:'bg-amber-400', Low:'bg-green-400' };
                      const total = kpi.bySeverity.reduce((a, b) => a + b.count, 0) || 1;
                      return (
                        <div key={s.severity} className="flex items-center gap-2 bg-[#eff6ff] rounded-lg px-3 py-1.5 border border-[#dbeafe]">
                          <span className={`text-xs font-bold ${colors[s.severity] ?? 'text-[#1e3a5f]'}`}>{s.severity}</span>
                          <span className="text-white text-sm font-bold">{s.count}</span>
                          <div className="w-16 h-1.5 bg-[#f0f9ff] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bars[s.severity] ?? 'bg-blue-400'}`} style={{ width: `${(s.count / total) * 100}%` }} />
                          </div>
                          <span className="text-[#1e3a5f] text-xs">{Math.round((s.count / total) * 100)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Nav */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { href:'/complaints',    label:'📋 Complaints',     color:'blue' },
                  { href:'/capa',          label:'🔧 CAPA',            color:'orange' },
                  { href:'/analytics',     label:'📊 Analytics',       color:'purple' },
                  { href:'/supplier-quality', label:'🏭 Supplier',     color:'teal' },
                  { href:'/incoming-quality', label:'📦 Incoming',     color:'green' },
                  { href:'/pfmea',         label:'⚙️ PFMEA',           color:'indigo' },
                ].map(n => (
                  <Link key={n.href} href={n.href}
                    className="text-xs px-3 py-1.5 bg-[#eff6ff] border border-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe] hover:text-[#0f172a] rounded-lg font-medium transition-colors no-underline">
                    {n.label}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-[#1e3a5f] text-sm">
              <p>Unable to load live data — check API connection</p>
              <Link href="/" className="text-[#1d4ed8] hover:underline text-xs mt-1 inline-block">Go to Command Center</Link>
            </div>
          )}
        </div>

        {/* -- AI INTELLIGENCE PANEL ------------------------------------------- */}
        {kpi && (() => {
          const insights = buildInsights(kpi, sla);
          const critCount = insights.filter(i => i.level === 'critical').length;
          const warnCount = insights.filter(i => i.level === 'warning').length;
          const goodCount = insights.filter(i => i.level === 'good').length;
          return (
            <div className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#dbeafe] bg-[#eff6ff]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">🤖</span>
                    <div>
                      <span className="text-xs font-bold text-white">AI Quality Intelligence</span>
                      <span className="text-xs text-[#1e3a5f] ml-2">— Quality Director's Brief</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {critCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/60 text-red-600 border border-red-700/50">{critCount} Critical</span>}
                  {warnCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{warnCount} Warning</span>}
                  {goodCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-[#15803d] border border-emerald-700/30">{goodCount} Good</span>}
                  <span className="text-[10px] text-[#1e3a5f] ml-1">Updated live</span>
                </div>
              </div>

              {/* Insights grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((ins, i) => {
                  const s = INSIGHT_STYLE[ins.level];
                  return (
                    <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-4 space-y-2`}>
                      <div className="flex items-start gap-3">
                        <div className={`${s.icon_bg} rounded-lg p-2 text-xl flex-shrink-0`}>{ins.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold ${s.title} leading-snug`}>{ins.title}</div>
                          <p className="text-xs text-[#1e3a5f] mt-1 leading-relaxed">{ins.detail}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-[#1e3a5f]">→ {ins.action}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {ins.iatf && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.badge}`}>{ins.iatf}</span>}
                          {ins.href && (
                            <Link href={ins.href} className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border no-underline ${s.badge} hover:opacity-80 transition`}>
                              Go →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-[#dbeafe] flex items-center gap-2 text-[10px] text-[#1e3a5f]">
                <span>🤖 AI analysis based on live complaint, SLA, and PPM data</span>
                <span className="ml-auto">IATF 16949 §9.1 · §10.2 · §9.3 aligned</span>
              </div>
            </div>
          );
        })()}

        {/* -- DIVIDER --------------------------------------------------------- */}
        <div className="border-t border-[#dbeafe] pt-1">
          <h2 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-4">📅 Quality Activity Register — By Frequency &amp; Department</h2>
        </div>

        {/* -- FREQUENCY SUMMARY CARDS ----------------------------------------- */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {FREQ_ORDER.map(freq => (
            <button key={freq} onClick={() => setFreqFilter(f => f === freq ? 'All' : freq)}
              className={`rounded-lg p-2 text-center border transition-all duration-150 ${FREQ_CARD[freq]} ${freqFilter === freq ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-75 hover:opacity-100'}`}>
              <div className="text-xl font-bold">{stats[freq]}</div>
              <div className="text-xs mt-0.5 leading-tight">{freq}</div>
            </button>
          ))}
        </div>

        {/* -- FILTER BAR ------------------------------------------------------ */}
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" placeholder="🔍  Search tasks..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm px-3 py-1.5 rounded-lg w-52 placeholder:text-[#1e3a5f] focus:outline-none focus:border-[#bfdbfe]" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#bfdbfe]">
            <option value="All">All Departments</option>
            {DATA.map(c => <option key={c.category} value={c.category}>{CAT_ICON[c.category]} {c.category}</option>)}
          </select>
          {anyFilter && (
            <button onClick={() => { setFreqFilter('All'); setSearch(''); setCatFilter('All'); }}
              className="bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-sm px-3 py-1.5 rounded-lg border border-[#dbeafe] transition-colors">
              ✕ Clear
            </button>
          )}
          <span className="text-[#1e3a5f] text-sm">{totalFiltered} task{totalFiltered !== 1 ? 's' : ''}</span>
        </div>

        {/* -- CATEGORY CARDS GRID --------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {filtered.map(cat => {
            const s = CAT_STYLE[cat.category] ?? {bg:'bg-[#eff6ff]',border:'border-[#dbeafe]',hdr:'bg-[#eff6ff]',txt:'text-[#1e3a5f]',body:'text-[#1e3a5f]'};
            const dailyCount = cat.items.filter(i => i.freq === 'Daily').length;
            const weeklyCount = cat.items.filter(i => i.freq === 'Weekly').length;
            return (
              <div key={cat.category} className={`${s.bg} border ${s.border} rounded-xl overflow-hidden flex flex-col`}>
                <div className={`${s.hdr} px-3 py-2.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CAT_ICON[cat.category]}</span>
                    <span className={`font-bold text-sm ${s.txt}`}>{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dailyCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">{dailyCount}D</span>}
                    {weeklyCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold">{weeklyCount}W</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-black/20 ${s.txt}`}>{cat.items.length}</span>
                  </div>
                </div>
                <div className="p-2 space-y-0.5 overflow-y-auto" style={{maxHeight:'280px'}}>
                  {cat.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 px-2 py-1 rounded hover:bg-black/10 transition-colors">
                      <span className={`${s.body ?? 'text-[#1e3a5f]'} text-xs leading-snug flex-1`}>{item.name}</span>
                      {item.freq && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0 ${FREQ_BADGE[item.freq] ?? 'bg-gray-600 text-white'}`}>
                          {item.freq}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* -- FOOTER LEGEND --------------------------------------------------- */}
        <div className="bg-white rounded-xl px-4 py-3 border border-[#dbeafe]">
          <p className="text-[10px] font-bold text-[#1e3a5f] mb-2 uppercase tracking-wider">Review Frequency Key</p>
          <div className="flex flex-wrap gap-2">
            {FREQ_ORDER.map(freq => (
              <span key={freq} className={`text-xs px-2 py-0.5 rounded font-medium ${FREQ_BADGE[freq]}`}>{freq}</span>
            ))}
            <span className="text-xs text-[#1e3a5f] self-center ml-2">Click a frequency card above to filter</span>
          </div>
        </div>

      </div>
    </div>
  );
}
