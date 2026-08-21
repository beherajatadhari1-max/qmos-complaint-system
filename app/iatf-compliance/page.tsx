'use client';
import { useState, useEffect, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';

// -- Types ---------------------------------------------------------------------
interface Clause {
  number: string;
  title: string;
  score: number;
  status: 'green' | 'amber' | 'red';
  metric: string;
  weight: number;
  insight: string;
  recommendation: string;
  iatfRef: string;
}

interface ComplianceData {
  overallScore: number;
  readinessBand: string;
  auditBrief: string;
  clauses: Clause[];
  summary: {
    totalComplaints: number;
    openComplaints: number;
    criticalOpen: number;
    ppm: number;
    calOverdue: number;
    closureRate: number;
    capaRate: number;
  };
  fetchedAt: string;
}

// -- Style helpers -------------------------------------------------------------
const LIGHT_STYLES = {
  green: {
    ring:    'border-emerald-500/50',
    badge:   'bg-emerald-500/20 text-[#15803d]',
    dot:     'bg-emerald-400',
    bar:     'bg-emerald-400',
    label:   'COMPLIANT',
  },
  amber: {
    ring:    'border-amber-500/50',
    badge:   'bg-amber-500/20 text-amber-600',
    dot:     'bg-amber-400',
    bar:     'bg-amber-400',
    label:   'ATTENTION',
  },
  red: {
    ring:    'border-red-200',
    badge:   'bg-red-500/20 text-red-600',
    dot:     'bg-red-400',
    bar:     'bg-red-400',
    label:   'AT RISK',
  },
};

const BAND_STYLE: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'World Class':      { bg: 'bg-emerald-950/60', text: 'text-[#15803d]', border: 'border-emerald-500/40', icon: '🏆' },
  'Audit Ready':      { bg: 'bg-[#eff6ff]',    text: 'text-[#1d4ed8]',    border: 'border-[#bfdbfe]',    icon: '✅' },
  'Needs Attention':  { bg: 'bg-amber-950/60',   text: 'text-amber-600',   border: 'border-amber-500/40',   icon: '⚠️' },
  'At Risk':          { bg: 'bg-orange-950/60',  text: 'text-orange-600',  border: 'border-orange-200',  icon: '🔶' },
  'Critical':         { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     icon: '🚨' },
};

// -- Score Ring (SVG) ----------------------------------------------------------
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
      <>
      <PageTitle title="IATF Compliance" />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={size * 0.09} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={size * 0.09}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.23} fontWeight="700" fontFamily="monospace">
        {score}
      </text>
    </svg>
      </>
  );
}

// -- Overall Score Gauge (SVG arc) ---------------------------------------------
function OverallGauge({ score }: { score: number }) {
  const W = 220, H = 120;
  const cx = W / 2, cy = H - 10;
  const r = 88;
  // Arc from 180° to 0° (top half)
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;
  const fillArc = (score / 100) * totalArc;
  const fillAngle = startAngle - fillArc;

  const arcPath = (from: number, to: number, radius: number, strokeWidth: number) => {
    const x1 = cx + radius * Math.cos(from);
    const y1 = cy + radius * Math.sin(from);
    const x2 = cx + radius * Math.cos(to);
    const y2 = cy + radius * Math.sin(to);
    const large = Math.abs(to - from) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
      {/* Track */}
      <path d={arcPath(startAngle, endAngle, r, 12)} fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
      {/* Colored zone markers */}
      <path d={arcPath(startAngle, startAngle - 0.45 * totalArc, r, 12)} fill="none" stroke="#f87171" strokeWidth="11" strokeLinecap="butt" opacity="0.3" />
      <path d={arcPath(startAngle - 0.45 * totalArc, startAngle - 0.75 * totalArc, r, 12)} fill="none" stroke="#fbbf24" strokeWidth="11" strokeLinecap="butt" opacity="0.3" />
      <path d={arcPath(startAngle - 0.75 * totalArc, endAngle, r, 12)} fill="none" stroke="#34d399" strokeWidth="11" strokeLinecap="butt" opacity="0.3" />
      {/* Fill arc */}
      {score > 0 && (
        <path d={arcPath(startAngle, fillAngle, r, 12)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      )}
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 14) * Math.cos(fillAngle)}
        y2={cy + (r - 14) * Math.sin(fillAngle)}
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill={color} />
      {/* Labels */}
      <text x={cx - r - 4} y={cy + 14} fill="#94a3b8" fontSize="9" textAnchor="middle">0</text>
      <text x={cx} y={cy - r - 8} fill="#94a3b8" fontSize="9" textAnchor="middle">50</text>
      <text x={cx + r + 4} y={cy + 14} fill="#94a3b8" fontSize="9" textAnchor="middle">100</text>
    </svg>
  );
}

// -- Clause Card ---------------------------------------------------------------
function ClauseCard({ clause, expanded, onToggle }: {
  clause: Clause;
  expanded: boolean;
  onToggle: () => void;
}) {
  const s = LIGHT_STYLES[clause.status];
  return (
    <div className={`bg-white rounded-xl border ${s.ring} transition-all duration-200`}>
      <button onClick={onToggle} className="w-full px-4 py-3.5 flex items-center gap-3 text-left">
        {/* Traffic dot */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot} shadow-lg`} style={{ boxShadow: `0 0 8px ${clause.status === 'green' ? '#34d399' : clause.status === 'amber' ? '#fbbf24' : '#f87171'}` }} />
        {/* Score ring */}
        <ScoreRing score={clause.score} size={46} />
        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-[#1e3a5f]">Cl. {clause.number}</span>
            <span className="text-sm font-semibold text-slate-100 truncate">{clause.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.badge}`}>{s.label}</span>
          </div>
          <p className="text-xs text-[#1e3a5f] mt-0.5 truncate">{clause.metric}</p>
        </div>
        {/* Score bar + chevron */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <div className="w-20">
            <div className="h-1.5 bg-[#f0f9ff] rounded-full overflow-hidden">
              <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${clause.score}%` }} />
            </div>
            <p className="text-[9px] text-[#1e3a5f] mt-0.5 text-right">{clause.weight}% weight</p>
          </div>
        </div>
        <span className={`text-[#1e3a5f] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#dbeafe] pt-3 space-y-2">
          <div className="text-xs text-amber-600 bg-amber-950/50 rounded-lg px-3 py-2 leading-relaxed border border-amber-500/20">
            🤖 {clause.insight}
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#1d4ed8] text-xs mt-0.5 flex-shrink-0">→</span>
            <p className="text-xs text-[#1e3a5f]">{clause.recommendation}</p>
          </div>
          <p className="text-[10px] text-[#1e3a5f] font-mono">{clause.iatfRef}</p>
        </div>
      )}
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function IATFCompliancePage() {
  const [data, setData]       = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    fetch('/api/iatf-compliance')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load compliance data'); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleClause = (num: string) => setExpanded(prev => prev === num ? null : num);

  const copyBrief = () => {
    if (!data) return;
    navigator.clipboard.writeText(
      `IATF 16949 Audit Readiness Report\nScore: ${data.overallScore}/100 — ${data.readinessBand}\nGenerated: ${new Date().toLocaleDateString('en-IN')}\n\n${data.auditBrief}\n\nClause Summary:\n${data.clauses.map(c => `Cl. ${c.number} ${c.title}: ${c.score}/100 [${c.status.toUpperCase()}]`).join('\n')}`
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // -- Loading --
  if (loading) return (
    <div className="flex-1 bg-[#eff6ff] flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-amber-600 text-sm font-medium">Scanning IATF 16949 compliance…</p>
        <p className="text-[#1e3a5f] text-xs">Checking 8 clauses against live data</p>
      </div>
    </div>
  );

  // -- Error --
  if (error || !data) return (
    <div className="flex-1 bg-[#eff6ff] flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <p className="text-red-600 text-sm">{error ?? 'No data available'}</p>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    </div>
  );

  const bandStyle = BAND_STYLE[data.readinessBand] ?? BAND_STYLE['Needs Attention'];
  const greenCount = data.clauses.filter(c => c.status === 'green').length;
  const amberCount = data.clauses.filter(c => c.status === 'amber').length;
  const redCount   = data.clauses.filter(c => c.status === 'red').length;

  return (
    <div className="flex-1 bg-[#eff6ff] overflow-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* -- Page Header -- */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="text-[#1e3a5f] hover:text-[#1e3a5f] text-xs transition">← Dashboard</Link>
              <span className="text-[#1e3a5f] text-xs">/</span>
              <span className="text-[#1e3a5f] text-xs">IATF Compliance</span>
            </div>
            <h1 className="text-2xl font-bold text-white">IATF 16949 Audit Readiness Monitor</h1>
            <p className="text-[#1e3a5f] text-sm mt-0.5">Live clause-by-clause compliance scoring · AI-powered risk assessment</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={copyBrief}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#f0f9ff] text-[#1e3a5f] rounded-lg hover:bg-[#dbeafe] transition border border-[#dbeafe]">
              {copied ? '✓ Copied!' : '📋 Copy Brief'}
            </button>
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* -- Hero: Overall Score -- */}
        <div className={`rounded-2xl border ${bandStyle.border} ${bandStyle.bg} p-6`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Gauge */}
            <div className="flex-shrink-0">
              <OverallGauge score={data.overallScore} />
              <p className="text-center text-xs text-[#1e3a5f] -mt-1">Weighted Score</p>
            </div>
            {/* Score info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <span className="text-4xl font-black text-white font-mono">{data.overallScore}</span>
                  <span className="text-[#1e3a5f] text-xl">/100</span>
                  <span className={`text-lg px-3 py-0.5 rounded-lg font-bold ${bandStyle.bg} ${bandStyle.text} border ${bandStyle.border}`}>
                    {bandStyle.icon} {data.readinessBand}
                  </span>
                </div>
                <p className="text-[#1e3a5f] text-sm mt-1">IATF 16949:2016 Certification Readiness</p>
              </div>
              {/* Clause summary pills */}
              <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[#15803d] text-xs font-bold">{greenCount} Compliant</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-amber-600 text-xs font-bold">{amberCount} Attention</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-600 text-xs font-bold">{redCount} At Risk</span>
                </div>
              </div>
            </div>
            {/* KPI tiles */}
            <div className="grid grid-cols-2 gap-2 text-center flex-shrink-0 min-w-[160px]">
              {[
                { label: 'PPM', value: data.summary.ppm.toLocaleString(), sub: 'Current' },
                { label: 'NC Closure', value: `${data.summary.closureRate}%`, sub: 'Rate' },
                { label: 'CAPA', value: `${data.summary.capaRate}%`, sub: 'Coverage' },
                { label: 'Cal. Overdue', value: String(data.summary.calOverdue), sub: 'Instruments' },
              ].map(k => (
                <div key={k.label} className="bg-[#eff6ff]/80 rounded-lg px-3 py-2 border border-[#dbeafe]">
                  <p className="text-lg font-black text-white font-mono leading-none">{k.value}</p>
                  <p className="text-[9px] text-[#1e3a5f] uppercase tracking-wide mt-0.5">{k.label}</p>
                  <p className="text-[9px] text-[#1e3a5f]">{k.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -- AI Audit Brief -- */}
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">🤖</span>
            <span className="text-amber-600 text-sm font-bold">AI Audit Risk Assessment</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded font-mono ml-auto">
              {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
          <p className="text-amber-100/80 text-sm leading-relaxed">{data.auditBrief}</p>
        </div>

        {/* -- Clause Cards -- */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Clause-by-Clause Compliance</h2>
            <button onClick={() => setExpanded(null)} className="text-xs text-[#1e3a5f] hover:text-[#1e3a5f] transition">
              Collapse all
            </button>
          </div>
          <div className="space-y-2">
            {data.clauses.map(clause => (
              <ClauseCard
                key={clause.number}
                clause={clause}
                expanded={expanded === clause.number}
                onToggle={() => toggleClause(clause.number)}
              />
            ))}
          </div>
        </div>

        {/* -- Audit Prep Checklist -- */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            📋 Pre-Audit Preparation Checklist
            <span className="text-xs text-[#1e3a5f] font-normal">(Based on current gaps)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { done: data.summary.closureRate >= 80,  text: 'NC disposition records complete for all open complaints' },
              { done: data.summary.capaRate >= 80,     text: 'CAPA raised for all Critical and High severity complaints' },
              { done: data.summary.calOverdue === 0,   text: 'Zero overdue calibration instruments — all NABL certs current' },
              { done: data.summary.ppm <= 500,         text: 'PPM within customer-acceptable threshold (≤500)' },
              { done: data.summary.criticalOpen === 0, text: 'No unresolved Critical complaints open > 7 days' },
              { done: data.summary.closureRate >= 75,  text: '8D / 5-Why root cause documents attached to all closed NCs' },
              { done: data.summary.capaRate >= 70,     text: 'CAPA effectiveness verification records available' },
              { done: data.summary.calOverdue === 0,   text: 'Measurement system (MSA/GRR) records updated' },
              { done: false,                            text: 'Management Review minutes with quality outputs archived' },
              { done: data.summary.ppm <= 1000,        text: 'SPC control charts displayed at process for critical characteristics' },
              { done: false,                            text: 'Competency matrix updated with current training records' },
              { done: false,                            text: 'PPAP re-submissions complete for all 4M changes' },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs ${item.done ? 'bg-emerald-950/30 border border-emerald-500/20' : 'bg-[#eff6ff] border border-[#dbeafe]'}`}>
                <span className={`mt-0.5 flex-shrink-0 font-bold ${item.done ? 'text-[#15803d]' : 'text-[#1e3a5f]'}`}>
                  {item.done ? '✓' : '○'}
                </span>
                <span className={item.done ? 'text-emerald-200' : 'text-[#1e3a5f]'}>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#dbeafe]">
            <p className="text-xs text-[#1e3a5f]">
              {(() => {
                const doneCount = [
                  data.summary.closureRate >= 80,
                  data.summary.capaRate >= 80,
                  data.summary.calOverdue === 0,
                  data.summary.ppm <= 500,
                  data.summary.criticalOpen === 0,
                  data.summary.closureRate >= 75,
                  data.summary.capaRate >= 70,
                  data.summary.calOverdue === 0,
                  false,
                  data.summary.ppm <= 1000,
                  false,
                  false,
                ].filter(Boolean).length;
                return `${doneCount}/12 pre-audit items ready · ${12 - doneCount} action(s) pending before audit`;
              })()}
            </p>
          </div>
        </div>

        {/* -- Quick Links -- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/complaints',    icon: '🚨', label: 'Complaints',    sub: 'Manage NCs' },
            { href: '/capa',          icon: '🔧', label: 'CAPA',          sub: 'Actions' },
            { href: '/calibration',   icon: '🔬', label: 'Calibration',   sub: 'Equipment' },
            { href: '/quality-health',icon: '📊', label: 'Quality Health',sub: 'Score' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="bg-white border border-[#dbeafe] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-[#bfdbfe] hover:bg-[#dbeafe] transition group">
              <span className="text-xl">{l.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#1e3a5f] group-hover:text-white transition">{l.label}</p>
                <p className="text-xs text-[#1e3a5f]">{l.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#1e3a5f] pb-2">
          IATF 16949:2016 · Scores computed from live Supabase data · Not a substitute for formal audit
        </p>

      </div>
    </div>
  );
}
