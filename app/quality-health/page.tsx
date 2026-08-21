'use client';
import { useState, useEffect, useMemo } from 'react';
import PageTitle from '../components/PageTitle';

// --- TYPES --------------------------------------------------------------------
interface KpiData {
  overview: {
    total: number; open: number; closed: number; critical: number; inProgress: number; ppm: number;
  };
  byCustomer: { name: string; total: number; open: number; critical: number; ppm: number | null }[];
  monthlyTrend: { month: string; label: string; complaints: number; closed: number }[];
  categoryPareto: { category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  recentOpen: { id: string; complaint_number: string; severity: string; status: string; created_at: string }[];
}

// --- SCORING ENGINE -----------------------------------------------------------
interface Dimension {
  key: string;
  label: string;
  icon: string;
  score: number;        // 0–100
  actual: string;
  target: string;
  gap: string;
  iatfClause: string;
  recommendation: string;
}

const PPM_TARGET = 500;

function calcDimensions(d: KpiData): Dimension[] {
  const { overview, bySeverity, monthlyTrend, categoryPareto, recentOpen } = d;
  const total = overview.total || 1;
  const open  = overview.open;

  // 1. Customer Complaints Score — fewer open & critical = better
  const criticalPct = (overview.critical / Math.max(open, 1)) * 100;
  const openRate    = (open / total) * 100;
  const complScore  = Math.max(0, Math.round(100 - openRate * 0.5 - criticalPct * 1.5));

  // 2. PPM Performance — target 500 PPM
  const ppm = overview.ppm;
  const ppmScore = ppm <= 0 ? 100
    : ppm <= PPM_TARGET ? Math.round(100 - (ppm / PPM_TARGET) * 20)
    : ppm <= PPM_TARGET * 2 ? Math.round(80 - ((ppm - PPM_TARGET) / PPM_TARGET) * 30)
    : ppm <= PPM_TARGET * 5 ? Math.round(50 - ((ppm - PPM_TARGET * 2) / (PPM_TARGET * 3)) * 30)
    : Math.max(5, Math.round(20 - (ppm / (PPM_TARGET * 10)) * 15));

  // 3. Closure Rate — target ≥ 85%
  const closureRate = overview.closed / total * 100;
  const closureScore = Math.min(100, Math.round(closureRate * 100 / 85));

  // 4. CAPA Effectiveness — inProgress / open (higher % under investigation = better than just "open")
  const capaRate    = open > 0 ? (overview.inProgress / open) * 100 : 100;
  const capaScore   = Math.min(100, Math.round(capaRate * 1.2));

  // 5. Response Speed — % of open complaints ≤ 14 days old
  const now = Date.now();
  const daysOpen = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  const recentPct = recentOpen.length > 0
    ? (recentOpen.filter(c => daysOpen(c.created_at) <= 14).length / recentOpen.length) * 100
    : 100;
  const speedScore = Math.round(recentPct);

  // 6. Defect Diversity — fewer categories = more controlled (target ≤ 3 categories)
  const cats = categoryPareto.length;
  const diversityScore = cats <= 1 ? 100 : cats <= 3 ? 90 : cats <= 5 ? 70 : cats <= 8 ? 50 : 30;

  return [
    {
      key: 'complaints', label: 'Complaint Control', icon: '🚨',
      score: Math.min(100, complScore),
      actual: `${open} open, ${overview.critical} critical`,
      target: '0 Critical, <10% open rate',
      gap: criticalPct > 20 ? 'Critical rate high — escalate immediately' : openRate > 30 ? 'High open rate — accelerate closure' : 'Within acceptable range',
      iatfClause: 'IATF 8.7, 10.2',
      recommendation: overview.critical > 0
        ? `${overview.critical} Critical complaint(s) open — assign Quality Head as owner, daily review, target 7-day closure per IATF 10.2.`
        : openRate > 20 ? `${open} complaints open (${Math.round(openRate)}% rate). Review CAPA pace — target <15% open rate.`
        : 'Complaint control healthy. Maintain current escalation and closure processes.',
    },
    {
      key: 'ppm', label: 'PPM Performance', icon: '📉',
      score: Math.min(100, ppmScore),
      actual: `${ppm.toLocaleString()} PPM`,
      target: `≤ ${PPM_TARGET} PPM`,
      gap: ppm > PPM_TARGET * 5 ? 'Critical — systemic process failure' : ppm > PPM_TARGET * 2 ? 'High — targeted SPC action needed' : ppm > PPM_TARGET ? 'Moderate — monitor trend' : 'On target',
      iatfClause: 'IATF 9.1.1, 8.5.1',
      recommendation: ppm > PPM_TARGET * 5
        ? 'PPM critically high. Implement 100% inspection immediately, raise SCAR for top supplier contributors, and initiate emergency Kaizen.'
        : ppm > PPM_TARGET
        ? `PPM ${ppm.toLocaleString()} exceeds ${PPM_TARGET} target. Deploy SPC on top 3 defect operations and run capability study (Cpk target ≥1.33).`
        : 'PPM within target. Sustain SPC monitoring and control plan adherence.',
    },
    {
      key: 'closure', label: 'Closure Rate', icon: '✅',
      score: Math.min(100, closureScore),
      actual: `${Math.round(closureRate)}%`,
      target: '≥ 85%',
      gap: closureRate < 60 ? 'Far below target' : closureRate < 85 ? 'Below target' : 'On target',
      iatfClause: 'IATF 10.2.1',
      recommendation: closureRate < 60
        ? 'Closure rate critically low. Review all open complaints for blocked actions, assign dedicated owners, set 48-hour progress check cadence.'
        : closureRate < 85
        ? `Closure at ${Math.round(closureRate)}% vs 85% target. Identify top 5 aged complaints blocking closure and address in next MRM.`
        : 'Good closure discipline. Maintain regular review cadence to sustain performance.',
    },
    {
      key: 'capa', label: 'CAPA Effectiveness', icon: '🔧',
      score: Math.min(100, capaScore),
      actual: `${Math.round(capaRate)}% under active investigation`,
      target: '≥ 80% in CAPA/Investigation',
      gap: capaRate < 50 ? 'Most open complaints not yet in CAPA' : capaRate < 80 ? 'CAPA initiation lagging' : 'Good CAPA discipline',
      iatfClause: 'IATF 10.2, 8.7.1',
      recommendation: capaRate < 50
        ? `Only ${Math.round(capaRate)}% of open complaints are in CAPA/investigation. Move all open complaints to "Under Investigation" and assign 8D owners within 24 hours.`
        : capaRate < 80
        ? 'Accelerate CAPA initiation. All customer complaints should enter 8D process within 24 hours of receipt per IATF 10.2.'
        : 'CAPA initiation rate healthy. Focus on effectiveness verification and prevention deployment.',
    },
    {
      key: 'speed', label: 'Response Speed', icon: '⚡',
      score: Math.min(100, speedScore),
      actual: `${Math.round(recentPct)}% resolved within 14 days`,
      target: '≥ 80% within 14 days',
      gap: recentPct < 50 ? 'Critical delays in response' : recentPct < 80 ? 'Response lagging' : 'Fast response',
      iatfClause: 'IATF 10.2, Customer SLA',
      recommendation: recentPct < 50
        ? 'Over half of open complaints are >14 days old. This is an audit risk. Implement daily Quality Head review of all complaints >7 days old.'
        : recentPct < 80
        ? 'Response speed needs improvement. Set 7-day D3 containment and 14-day root cause targets for all new complaints.'
        : 'Good response speed. Document this as best practice in lessons learned for audit evidence.',
    },
    {
      key: 'diversity', label: 'Defect Focus', icon: '🎯',
      score: Math.min(100, diversityScore),
      actual: `${cats} defect categor${cats === 1 ? 'y' : 'ies'}`,
      target: '≤ 3 categories (focused control)',
      gap: cats > 8 ? 'Too spread — diluted focus' : cats > 5 ? 'Many categories — prioritize top 3' : cats <= 3 ? 'Focused and controlled' : 'Acceptable range',
      iatfClause: 'IATF 8.5.1, Pareto Principle',
      recommendation: cats > 8
        ? `${cats} defect categories active — quality effort is too diffuse. Apply Pareto: concentrate resources on top 3 categories (likely >70% of defects).`
        : cats > 5
        ? `${cats} categories. Prioritize top ${Math.min(3, cats)} for Kaizen focus. Others to be monitored and addressed in next quarter.`
        : `${cats} categories — focused defect landscape. Deep-dive PFMEA on these specific failure modes to achieve zero recurrence.`,
    },
  ];
}

function overallScore(dims: Dimension[]): number {
  const weights = [25, 25, 20, 15, 10, 5]; // complaints, ppm, closure, capa, speed, diversity
  return Math.round(dims.reduce((s, d, i) => s + d.score * (weights[i] / 100), 0));
}

// --- SVG RADAR CHART ---------------------------------------------------------
function RadarChart({ dims }: { dims: Dimension[] }) {
  const N = dims.length;
  const CX = 200, CY = 200, R = 155;
  const angles = dims.map((_, i) => (Math.PI * 2 * i) / N - Math.PI / 2);

  const pt = (score: number, i: number) => {
    const r = (score / 100) * R;
    return { x: CX + r * Math.cos(angles[i]), y: CY + r * Math.sin(angles[i]) };
  };
  const ptOuter = (i: number) => ({
    x: CX + R * Math.cos(angles[i]), y: CY + R * Math.sin(angles[i])
  });

  // Concentric rings at 25, 50, 75, 100
  const rings = [25, 50, 75, 100];

  const polyPoints = (pct: number) =>
    angles.map((_, i) => {
      const r = (pct / 100) * R;
      return `${CX + r * Math.cos(angles[i])},${CY + r * Math.sin(angles[i])}`;
    }).join(' ');

  const scorePoints = dims.map((d, i) => pt(d.score, i));
  const scorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  const labelOffset = (i: number) => {
    const { x, y } = ptOuter(i);
    const dx = (x - CX) / R;
    const dy = (y - CY) / R;
    return { x: x + dx * 28, y: y + dy * 22 };
  };

  const SCORE_COLOR = (s: number) =>
    s >= 80 ? '#16a34a' : s >= 60 ? '#ca8a04' : s >= 40 ? '#ea580c' : '#dc2626';

  return (
      <>
      <PageTitle title="Quality Health" />
      <svg viewBox="0 0 400 400" className="w-full max-w-sm mx-auto">
      {/* Rings */}
      {rings.map(r => (
        <polygon key={r} points={polyPoints(r)}
          fill="none" stroke={r === 100 ? '#64748b' : '#e2e8f0'} strokeWidth={r === 100 ? 1.5 : 1} />
      ))}
      {/* Ring labels */}
      {rings.map(r => (
        <text key={r} x={CX + 4} y={CY - (r / 100) * R - 3}
          fontSize="9" fill="#94a3b8" textAnchor="start">{r}</text>
      ))}
      {/* Spokes */}
      {dims.map((_, i) => {
        const outer = ptOuter(i);
        return <line key={i} x1={CX} y1={CY} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth={1} />;
      })}
      {/* Score area */}
      <path d={scorePath} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Score dots */}
      {scorePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5}
          fill={SCORE_COLOR(dims[i].score)} stroke="white" strokeWidth={2} />
      ))}
      {/* Labels */}
      {dims.map((d, i) => {
        const lbl = labelOffset(i);
        return (
          <g key={i}>
            <text x={lbl.x} y={lbl.y - 6} fontSize="11" fontWeight="600"
              textAnchor="middle" fill="#1e293b">{d.icon} {d.label}</text>
            <text x={lbl.x} y={lbl.y + 7} fontSize="10"
              textAnchor="middle" fill={SCORE_COLOR(d.score)} fontWeight="700">{d.score}/100</text>
          </g>
        );
      })}
      {/* Center score */}
      <circle cx={CX} cy={CY} r={32} fill="white" stroke="#e2e8f0" strokeWidth={1.5} />
      <text x={CX} y={CY - 4} fontSize="20" fontWeight="800" textAnchor="middle"
        fill={overallScore(dims) >= 80 ? '#16a34a' : overallScore(dims) >= 60 ? '#ca8a04' : '#dc2626'}>
        {overallScore(dims)}
      </text>
      <text x={CX} y={CY + 12} fontSize="9" textAnchor="middle" fill="#64748b">/ 100</text>
    </svg>
      </>
  );
}

// --- MATURITY BAND -----------------------------------------------------------
function maturityBand(score: number): { label: string; color: string; bg: string; desc: string; iatf: string } {
  if (score >= 85) return { label: '🏆 World Class', color: 'text-green-300', bg: 'bg-green-900/30 border-green-300', desc: 'Excellent quality management. Audit-ready. Sustain and benchmark.', iatf: 'IATF Ready' };
  if (score >= 70) return { label: '✅ Capable',     color: 'text-[#1d4ed8]',  bg: 'bg-[#eff6ff] border-blue-600/50',  desc: 'Good fundamentals. Address gaps in weaker dimensions.', iatf: 'IATF Likely Pass' };
  if (score >= 55) return { label: '⚠️ Developing',  color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300', desc: 'Quality system partially effective. Structured improvement required.', iatf: 'IATF Minor NCs Expected' };
  if (score >= 40) return { label: '🔶 Reactive',    color: 'text-orange-600',bg: 'bg-orange-900/30 border-orange-300', desc: 'Quality is reactive, not proactive. Systematic issues present.', iatf: 'IATF Major NCs Risk' };
  return                 { label: '🔴 Critical',    color: 'text-red-700',   bg: 'bg-red-50 border-red-300', desc: 'Quality system not effective. Immediate management intervention required.', iatf: 'IATF Cert at Risk' };
}

// --- MAIN PAGE ----------------------------------------------------------------
export default function QualityHealthPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quality-kpis')
      .then(r => r.json())
      .then(d => { setKpi(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const dims = useMemo(() => kpi ? calcDimensions(kpi) : [], [kpi]);
  const overall = useMemo(() => overallScore(dims), [dims]);
  const maturity = useMemo(() => maturityBand(overall), [overall]);

  const topGaps = useMemo(() =>
    [...dims].sort((a, b) => a.score - b.score).slice(0, 3), [dims]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">🔬</div>
        <p className="text-[#1e3a5f] font-medium">Calculating quality health score…</p>
      </div>
    </div>
  );

  if (!kpi) return (
    <div className="p-8 text-center text-red-500">
      ⚠️ Could not load quality data. Check Supabase connection.
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">🔬 AI Quality Health Check</h1>
          <p className="text-[#1e3a5f] text-sm mt-0.5">Live composite quality maturity score — based on your Supabase data</p>
        </div>
        <button onClick={() => { setLoading(true); fetch('/api/quality-kpis').then(r=>r.json()).then(d=>{setKpi(d);setLoading(false);}).catch(()=>setLoading(false)); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          🔄 Re-score
        </button>
      </div>

      {/* Score Hero */}
      <div className={`rounded-2xl border-2 ${maturity.bg} p-6`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="text-center">
            <div className={`text-7xl font-black ${maturity.color}`}>{overall}</div>
            <div className="text-[#1e3a5f] text-sm font-medium">/ 100</div>
            <div className={`mt-2 text-lg font-bold ${maturity.color}`}>{maturity.label}</div>
          </div>
          <div className="flex-1">
            <p className="text-[#1e3a5f] font-semibold text-base mb-1">{maturity.desc}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${maturity.bg} ${maturity.color}`}>
                🏅 {maturity.iatf}
              </span>
              <span className="text-xs text-[#1e3a5f]">Based on live complaint data · IATF 16949 aligned</span>
            </div>
            {/* Score bar */}
            <div className="mt-4 bg-white/60 rounded-full h-3 overflow-hidden">
              <div className="h-3 rounded-full transition-all"
                style={{
                  width: `${overall}%`,
                  background: overall >= 80 ? '#16a34a' : overall >= 60 ? '#ca8a04' : overall >= 40 ? '#ea580c' : '#dc2626'
                }} />
            </div>
            <div className="flex justify-between text-[10px] text-[#1e3a5f] mt-0.5">
              <span>0 — Critical</span><span>40 — Reactive</span><span>55 — Developing</span><span>70 — Capable</span><span>85 — World Class</span>
            </div>
          </div>
        </div>
      </div>

      {/* Radar + Dimension Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Radar Chart */}
        <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
          <h3 className="font-bold text-[#1e3a5f] mb-4">📡 Quality Radar — 6 Dimensions</h3>
          <RadarChart dims={dims} />
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {[['#16a34a','80–100 Excellent'],['#ca8a04','60–79 Good'],['#ea580c','40–59 At Risk'],['#dc2626','0–39 Critical']].map(([color, label]) => (
              <span key={label} className="flex items-center gap-1 text-xs text-[#1e3a5f]">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />{label}
              </span>
            ))}
          </div>
        </div>

        {/* Dimension Score Cards */}
        <div className="space-y-3">
          {dims.map(d => {
            const color = d.score >= 80 ? 'text-green-300' : d.score >= 60 ? 'text-amber-700' : d.score >= 40 ? 'text-orange-600' : 'text-red-700';
            const bar   = d.score >= 80 ? 'bg-green-500' : d.score >= 60 ? 'bg-amber-500' : d.score >= 40 ? 'bg-orange-500' : 'bg-red-500';
            return (
              <div key={d.key} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{d.icon}</span>
                    <span className="font-semibold text-[#1e3a5f] text-sm">{d.label}</span>
                    <span className="text-[10px] text-[#1e3a5f] bg-white px-1.5 py-0.5 rounded">{d.iatfClause}</span>
                  </div>
                  <span className={`text-xl font-black ${color}`}>{d.score}</span>
                </div>
                <div className="bg-white rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${bar}`} style={{ width: `${d.score}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-[#1e3a5f]">
                  <span>Actual: <strong className="text-[#1e3a5f]">{d.actual}</strong></span>
                  <span>Target: <strong className="text-[#1e3a5f]">{d.target}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Gap Analysis */}
      <div className="bg-white rounded-xl border border-amber-500/30 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-950/60 to-[#0f1a2e] border-b border-amber-500/20">
          <span className="text-lg">🤖</span>
          <span className="text-sm font-bold text-amber-600 tracking-wide">AI GAP ANALYSIS — TOP 3 PRIORITY ACTIONS</span>
          <span className="text-xs bg-amber-500/20 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-full">IATF-AWARE</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {topGaps.map((d, i) => (
            <div key={d.key} className="bg-[#dbeafe] rounded-lg p-4 border border-[#dbeafe]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  #{i + 1} Gap
                </span>
                <span className="text-sm font-bold text-white">{d.icon} {d.label}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-black text-red-600">{d.score}</span>
                <span className="text-[#1e3a5f] text-xs">/100 · {d.gap}</span>
              </div>
              <p className="text-[#1e3a5f] text-xs leading-relaxed">{d.recommendation}</p>
              <p className="text-amber-500/70 text-[10px] mt-2 font-medium">{d.iatfClause}</p>
            </div>
          ))}
        </div>
      </div>

      {/* IATF Readiness Summary */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-bold text-[#1e3a5f] mb-4">🏅 IATF 16949 Readiness Indicators</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {dims.map(d => {
            const ready = d.score >= 70;
            return (
              <div key={d.key} className={`rounded-lg p-3 text-center border ${ready ? 'bg-green-900/30 border-green-700/50' : 'bg-red-50 border-red-700/50'}`}>
                <div className="text-2xl mb-1">{ready ? '✅' : '⚠️'}</div>
                <p className="text-xs font-semibold text-[#1e3a5f] leading-tight">{d.label}</p>
                <p className={`text-lg font-black mt-1 ${ready ? 'text-green-300' : 'text-red-700'}`}>{d.score}</p>
                <p className="text-[9px] text-[#1e3a5f] mt-0.5">{d.iatfClause}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-[#eff6ff] border border-blue-700/50 text-sm text-blue-200">
          <strong>Overall IATF Readiness:</strong> {dims.filter(d => d.score >= 70).length}/{dims.length} dimensions at acceptable level.
          {dims.filter(d => d.score < 70).length > 0
            ? ` Address ${dims.filter(d => d.score < 70).map(d => d.label).join(', ')} before your next certification audit.`
            : ' All dimensions acceptable — maintain controls for next surveillance audit.'}
        </div>
      </div>

    </div>
  );
}
