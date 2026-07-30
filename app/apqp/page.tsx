'use client';
import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type PhaseStatus = 'not-started' | 'in-progress' | 'gate-approved' | 'overdue';

interface Deliverable {
  id: string;
  label: string;
  done: boolean;
  critical: boolean; // gate-required item
}

interface APQPPhase {
  id: number;
  name: string;
  icon: string;
  color: string;  // Tailwind base color name
  description: string;
  targetDate: string;
  actualDate: string;
  status: PhaseStatus;
  deliverables: Deliverable[];
}

interface ProjectInfo {
  programName: string;
  partNumber: string;
  partName: string;
  customer: string;
  projectManager: string;
  qualityEngineer: string;
  sopDate: string;
  ppapDate: string;
  customerCode: string;
  phase: string;
}

// ── AIAG APQP 2nd Edition Deliverables ────────────────────────────────────────
function mkDel(id: string, label: string, critical = false): Deliverable {
  return { id, label, done: false, critical };
}

const INITIAL_PHASES: APQPPhase[] = [
  {
    id: 1, name: 'Phase 1 — Plan and Define Program',
    icon: '🎯', color: 'blue',
    description: 'Understand customer requirements, define quality/reliability goals, and prepare initial plans. Output: documented customer expectations and preliminary program plan.',
    targetDate: '', actualDate: '', status: 'not-started',
    deliverables: [
      mkDel('1-01', 'Voice of Customer (QFD / Market Research / Surveys)', true),
      mkDel('1-02', 'Design Goals established and documented', true),
      mkDel('1-03', 'Reliability and Quality Goals defined (target Cpk, warranty, field goals)', true),
      mkDel('1-04', 'Preliminary Bill of Material (BOM) prepared'),
      mkDel('1-05', 'Preliminary Process Flow (conceptual PFD) drafted', true),
      mkDel('1-06', 'Preliminary List of Special Product/Process Characteristics identified', true),
      mkDel('1-07', 'Product Assurance Plan approved'),
      mkDel('1-08', 'Cross-functional team formed and APQP kick-off meeting held', true),
      mkDel('1-09', 'Timing Plan (APQP gantt) created and approved', true),
      mkDel('1-10', 'Management Support confirmed (gate sign-off)', true),
    ],
  },
  {
    id: 2, name: 'Phase 2 — Product Design and Development',
    icon: '📐', color: 'purple',
    description: 'Develop and verify the product design, including FMEAs, drawings, specifications, and prototype builds. Gate: engineering sign-off on design intent.',
    targetDate: '', actualDate: '', status: 'not-started',
    deliverables: [
      mkDel('2-01', 'Design FMEA (DFMEA) completed — AIAG-VDA 2019 format', true),
      mkDel('2-02', 'Design for Manufacturability & Assembly (DFMA) review done', true),
      mkDel('2-03', 'Design Verification Plan (DVP&R) approved and tests assigned'),
      mkDel('2-04', 'Design Reviews (at least 2: concept + design freeze) completed', true),
      mkDel('2-05', 'Engineering Drawings released (latest revision)', true),
      mkDel('2-06', 'Engineering Specifications released'),
      mkDel('2-07', 'Material Specifications finalized'),
      mkDel('2-08', 'Prototype Build Control Plan prepared', true),
      mkDel('2-09', 'Prototype builds completed and inspected'),
      mkDel('2-10', 'Special Product & Process Characteristics identified from DFMEA', true),
      mkDel('2-11', 'New Equipment, Tooling & Facilities requirements documented'),
      mkDel('2-12', 'Gauge/Test Equipment requirements identified'),
      mkDel('2-13', 'Team Feasibility Commitment signed off', true),
      mkDel('2-14', 'Management Support confirmed (gate sign-off)', true),
    ],
  },
  {
    id: 3, name: 'Phase 3 — Process Design and Development',
    icon: '⚙️', color: 'cyan',
    description: 'Design and develop the manufacturing process to consistently produce product meeting all requirements. Gate: pre-launch readiness confirmed.',
    targetDate: '', actualDate: '', status: 'not-started',
    deliverables: [
      mkDel('3-01', 'Process Flow Diagram (PFD) finalized — all operations listed', true),
      mkDel('3-02', 'Floor Plan Layout (approved, equipment placed)', true),
      mkDel('3-03', 'Characteristics Matrix completed (linking process steps to characteristics)', true),
      mkDel('3-04', 'Process FMEA (PFMEA) completed — AIAG-VDA 2019 format', true),
      mkDel('3-05', 'Pre-Launch Control Plan prepared (all CC/SC controlled)', true),
      mkDel('3-06', 'Process Instructions / Work Instructions drafted', true),
      mkDel('3-07', 'Measurement Systems Analysis (MSA) Plan approved', true),
      mkDel('3-08', 'Preliminary Process Capability Study Plan approved', true),
      mkDel('3-09', 'Packaging Specifications defined and approved', true),
      mkDel('3-10', 'Equipment and tooling ordered / commissioned'),
      mkDel('3-11', 'Operator training plan prepared'),
      mkDel('3-12', 'Management Support confirmed (gate sign-off)', true),
    ],
  },
  {
    id: 4, name: 'Phase 4 — Product and Process Validation',
    icon: '✅', color: 'green',
    description: 'Validate that the manufacturing process produces product meeting all customer requirements. Gate: PPAP approved, process capable.',
    targetDate: '', actualDate: '', status: 'not-started',
    deliverables: [
      mkDel('4-01', 'Production Trial Run (minimum 300 pieces recommended) completed', true),
      mkDel('4-02', 'Measurement Systems Evaluation (GRR studies) completed for all gauges', true),
      mkDel('4-03', 'Preliminary Process Capability Study (Pp/Ppk ≥ 1.67 for CC) completed', true),
      mkDel('4-04', 'Production Validation Testing (PVT / DVP&R test results) complete', true),
      mkDel('4-05', 'Packaging Evaluation completed', true),
      mkDel('4-06', 'Production Control Plan finalized (approved by QE and Plant Mgr)', true),
      mkDel('4-07', 'PPAP package prepared (all required elements per submission level)', true),
      mkDel('4-08', 'PPAP submitted to customer', true),
      mkDel('4-09', 'PPAP approval received (PSW signed)', true),
      mkDel('4-10', 'Operator training completed — sign-off records available'),
      mkDel('4-11', 'Launch Readiness Review conducted', true),
      mkDel('4-12', 'Management Support and Quality Planning Sign-Off', true),
    ],
  },
  {
    id: 5, name: 'Phase 5 — Feedback, Assessment & Corrective Action',
    icon: '🔄', color: 'amber',
    description: 'Evaluate effectiveness of the APQP process and drive continuous improvement. Gate: production stable, lessons learned captured.',
    targetDate: '', actualDate: '', status: 'not-started',
    deliverables: [
      mkDel('5-01', 'Production quality data monitored for first 90 days post-SOP', true),
      mkDel('5-02', 'Customer satisfaction confirmed (no complaints/returns in 60 days)'),
      mkDel('5-03', 'Process variation reduced — Cpk trending toward or above 1.67', true),
      mkDel('5-04', 'Warranty/field failure data tracked and baseline established'),
      mkDel('5-05', 'Delivery and service performance confirmed on target'),
      mkDel('5-06', 'Control Plan updated based on first-90-days data', true),
      mkDel('5-07', 'Lessons Learned document completed and filed in program dossier', true),
      mkDel('5-08', 'Best Practices identified and shared with cross-functional team', true),
      mkDel('5-09', 'APQP closure meeting held — management sign-off', true),
    ],
  },
];

const emptyProject = (): ProjectInfo => ({
  programName: '', partNumber: '', partName: '', customer: '',
  projectManager: '', qualityEngineer: '', sopDate: '', ppapDate: '',
  customerCode: '', phase: 'Production',
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function phasePct(p: APQPPhase) {
  const t = p.deliverables.length;
  const d = p.deliverables.filter(x => x.done).length;
  return t === 0 ? 0 : Math.round((d / t) * 100);
}

const STATUS_LABELS: Record<PhaseStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'gate-approved': 'Gate Approved ✓',
  'overdue': 'Overdue ⚠',
};
const STATUS_COLORS: Record<PhaseStatus, string> = {
  'not-started': 'bg-gray-700 text-gray-300',
  'in-progress': 'bg-blue-800 text-blue-200',
  'gate-approved': 'bg-green-800 text-green-200',
  'overdue': 'bg-red-800 text-red-200',
};

const inp = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500';
const lbl = 'text-xs text-gray-400 block mb-1';

export default function APQPPage() {
  const [mainTab, setMainTab] = useState<'tracker' | 'knowledge' | 'guide'>('tracker');
  const [phases, setPhases]   = useState<APQPPhase[]>(INITIAL_PHASES);
  const [proj, setProj]       = useState<ProjectInfo>(emptyProject());
  const [expanded, setExpanded] = useState<number[]>([1]);

  const setP = (k: keyof ProjectInfo, v: string) => setProj(prev => ({ ...prev, [k]: v }));

  const toggleDel = (phaseId: number, delId: string) =>
    setPhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, deliverables: p.deliverables.map(d => d.id === delId ? { ...d, done: !d.done } : d) }
        : p
    ));

  const setPhaseField = (phaseId: number, k: keyof APQPPhase, v: string) =>
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, [k]: v } : p));

  const toggleExpand = (id: number) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const loadSample = () => {
    setProj({
      programName: 'Bracket Assembly — New Platform',
      partNumber: 'BKT-A001',
      partName: 'Mounting Bracket Assembly',
      customer: 'Tata Motors Ltd.',
      projectManager: 'Anil Sharma',
      qualityEngineer: 'Rajesh Kumar',
      sopDate: '2025-04-01',
      ppapDate: '2025-02-15',
      customerCode: 'TML-2024-007',
      phase: 'Production',
    });
    setPhases(prev => prev.map((p, i) => ({
      ...p,
      targetDate: ['2024-06-30','2024-09-30','2024-12-31','2025-02-15','2025-05-30'][i] || '',
      actualDate: i === 0 ? '2024-07-05' : i === 1 ? '2024-10-02' : '',
      status: (['gate-approved','gate-approved','in-progress','not-started','not-started'] as PhaseStatus[])[i],
      deliverables: p.deliverables.map((d, di) => ({
        ...d,
        done: (i === 0) ? true : (i === 1) ? (di < 11) : (i === 2) ? (di < 4) : false,
      })),
    })));
    setExpanded([1, 2, 3]);
  };

  const overallPct = Math.round(phases.reduce((acc, p) => acc + phasePct(p), 0) / phases.length);
  const totalDels  = phases.reduce((a, p) => a + p.deliverables.length, 0);
  const doneDels   = phases.reduce((a, p) => a + p.deliverables.filter(d => d.done).length, 0);
  const openGates  = phases.filter(p => p.status !== 'gate-approved').length;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Premium Header ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-900 border-b border-indigo-800/40 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">APQP Tracker</h1>
                <p className="text-indigo-300 text-xs mt-0.5">AIAG APQP 2nd Edition · 5-Phase Gate Review · IATF 16949 Cl. 8.3 · PPAP Aligned</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-indigo-900/60 border border-indigo-700/50 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold text-indigo-300">{overallPct}%</div>
                <div className="text-xs text-indigo-400">Overall Progress</div>
              </div>
              <div className="bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold text-slate-200">{doneDels}/{totalDels}</div>
                <div className="text-xs text-slate-400">Deliverables</div>
              </div>
              <div className={`border rounded-xl px-4 py-2 text-center ${openGates === 0 ? 'bg-green-900/60 border-green-700/50' : 'bg-amber-900/60 border-amber-700/50'}`}>
                <div className={`text-xl font-bold ${openGates === 0 ? 'text-green-300' : 'text-amber-300'}`}>{phases.filter(p => p.status === 'gate-approved').length}/5</div>
                <div className={`text-xs ${openGates === 0 ? 'text-green-400' : 'text-amber-400'}`}>Gates Approved</div>
              </div>
              <button onClick={loadSample} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                🧪 Load Sample
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-5 border-b border-indigo-800/40">
            {([
              { id: 'tracker',   label: '🚀 APQP Tracker' },
              { id: 'knowledge', label: '📚 Knowledge Hub' },
              { id: 'guide',     label: '📋 Step-by-Step Guide' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                  mainTab === t.id
                    ? 'bg-white/10 text-white border-b-2 border-indigo-400'
                    : 'text-indigo-300 hover:text-white hover:bg-white/5'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRACKER TAB ────────────────────────────────────────────────────── */}
      {mainTab === 'tracker' && (
        <div className="p-4 bg-gray-950 min-h-screen">
          <div className="max-w-screen-xl mx-auto space-y-4">

            {/* Project Info */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4">📋 Project Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                <div className="md:col-span-2"><label className={lbl}>Program / Project Name</label><input className={inp} value={proj.programName} onChange={e => setP('programName', e.target.value)} placeholder="New Platform Bracket" /></div>
                <div><label className={lbl}>Part Number</label><input className={inp} value={proj.partNumber} onChange={e => setP('partNumber', e.target.value)} placeholder="BKT-001" /></div>
                <div className="md:col-span-2"><label className={lbl}>Part Name / Description</label><input className={inp} value={proj.partName} onChange={e => setP('partName', e.target.value)} placeholder="Mounting Bracket Assembly" /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2"><label className={lbl}>Customer</label><input className={inp} value={proj.customer} onChange={e => setP('customer', e.target.value)} placeholder="Tata Motors Ltd." /></div>
                <div><label className={lbl}>Customer Code</label><input className={inp} value={proj.customerCode} onChange={e => setP('customerCode', e.target.value)} placeholder="TML-2024-007" /></div>
                <div><label className={lbl}>Project Manager</label><input className={inp} value={proj.projectManager} onChange={e => setP('projectManager', e.target.value)} placeholder="Name" /></div>
                <div><label className={lbl}>Quality Engineer</label><input className={inp} value={proj.qualityEngineer} onChange={e => setP('qualityEngineer', e.target.value)} placeholder="Name" /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div><label className={lbl}>PPAP Target Date</label><input type="date" className={inp} value={proj.ppapDate} onChange={e => setP('ppapDate', e.target.value)} /></div>
                <div><label className={lbl}>SOP Target Date</label><input type="date" className={inp} value={proj.sopDate} onChange={e => setP('sopDate', e.target.value)} /></div>
                <div><label className={lbl}>Control Plan Phase</label>
                  <select className={inp} value={proj.phase} onChange={e => setP('phase', e.target.value)}>
                    {['Prototype','Pre-Launch','Production'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Overall APQP Progress</span>
                <span className="text-sm font-bold text-indigo-300">{overallPct}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-400 h-3 rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }}></div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {phases.map(p => {
                  const pct = phasePct(p);
                  const barColor = p.status === 'gate-approved' ? 'bg-green-500' : p.status === 'overdue' ? 'bg-red-500' : p.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-600';
                  return (
                    <div key={p.id} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Ph{p.id}</div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                        <div className={`${barColor} h-2 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="text-xs text-gray-400">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase Cards */}
            {phases.map(p => {
              const pct = phasePct(p);
              const isExpanded = expanded.includes(p.id);
              const doneCritical = p.deliverables.filter(d => d.critical && d.done).length;
              const totalCritical = p.deliverables.filter(d => d.critical).length;
              const statusColor = STATUS_COLORS[p.status];
              return (
                <div key={p.id} className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
                  {/* Phase Header */}
                  <button
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors text-left"
                    onClick={() => toggleExpand(p.id)}>
                    <div className="text-2xl flex-shrink-0">{p.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">{p.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>{STATUS_LABELS[p.status]}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5 truncate">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center hidden md:block">
                        <div className="text-xs text-gray-500">Gate-Critical</div>
                        <div className={`text-sm font-bold ${doneCritical === totalCritical ? 'text-green-400' : 'text-amber-400'}`}>{doneCritical}/{totalCritical}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Progress</div>
                        <div className={`text-lg font-bold ${pct === 100 ? 'text-green-400' : pct > 50 ? 'text-blue-400' : 'text-gray-400'}`}>{pct}%</div>
                      </div>
                      <div className="text-gray-400 text-lg">{isExpanded ? '▲' : '▼'}</div>
                    </div>
                  </button>

                  {/* Phase Body */}
                  {isExpanded && (
                    <div className="border-t border-gray-700/50 p-4">
                      {/* Phase controls */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div>
                          <label className={lbl}>Status</label>
                          <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={p.status}
                            onChange={e => setPhaseField(p.id, 'status', e.target.value)}>
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="gate-approved">Gate Approved</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Target Gate Date</label>
                          <input type="date" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={p.targetDate} onChange={e => setPhaseField(p.id, 'targetDate', e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Actual Gate Date</label>
                          <input type="date" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={p.actualDate} onChange={e => setPhaseField(p.id, 'actualDate', e.target.value)} />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => setPhases(prev => prev.map(ph => ph.id === p.id
                              ? { ...ph, deliverables: ph.deliverables.map(d => ({ ...d, done: true })), status: 'gate-approved' }
                              : ph
                            ))}
                            className="w-full bg-green-700 hover:bg-green-600 text-white text-xs py-1.5 px-3 rounded-lg transition-colors">
                            ✓ Mark All Done
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{p.deliverables.filter(d => d.done).length} of {p.deliverables.length} deliverables complete</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all duration-300 ${pct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>

                      {/* Deliverables */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <span className="w-4 h-4 border border-amber-600 rounded flex-shrink-0 inline-flex items-center justify-center text-amber-500 text-xs">★</span>
                          <span>Gate-required deliverables</span>
                        </div>
                        {p.deliverables.map(d => (
                          <label key={d.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                              d.done ? 'bg-green-900/20 border border-green-800/30' : 'bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/70'
                            }`}>
                            <input type="checkbox" checked={d.done}
                              onChange={() => toggleDel(p.id, d.id)}
                              className="w-4 h-4 accent-green-500 flex-shrink-0" />
                            <span className={`text-xs flex-1 ${d.done ? 'line-through text-gray-500' : 'text-gray-300'}`}>{d.label}</span>
                            {d.critical && (
                              <span className="text-amber-500 text-xs flex-shrink-0" title="Gate-required">★</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* ── KNOWLEDGE HUB TAB ─────────────────────────────────────────────── */}
      {mainTab === 'knowledge' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="bg-gray-900 border border-indigo-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">🚀 What is APQP?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Advanced Product Quality Planning (APQP) is a structured framework developed by the AIAG (Automotive Industry Action Group) and endorsed by GM, Ford, and Stellantis. It defines a standardized 5-phase process for planning and defining the steps necessary to ensure a product satisfies the customer from Day 1 of production. APQP is mandatory for automotive suppliers under IATF 16949.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon:'🎯', title:'Purpose', desc:'Prevent problems before they occur — not detect them after launch. APQP front-loads quality into the development process.' },
                  { icon:'📋', title:'Mandatory Under', desc:'IATF 16949 Clause 8.3 (Design and Development) and all major automotive CSRs (GM BIQS, Ford Q1, Stellantis ASES).' },
                  { icon:'🔗', title:'Outputs', desc:'PPAP package — the 18-element submission that proves the process is capable of consistently meeting requirements.' },
                ].map(c => (
                  <div key={c.title} className="bg-indigo-900/20 border border-indigo-800/30 rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-indigo-300 font-semibold text-sm mb-1">{c.title}</div>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5 Phases */}
            <div className="bg-gray-900 border border-blue-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">📊 The 5 APQP Phases — Key Outputs</h2>
              <div className="space-y-4">
                {[
                  { ph:'Phase 1', name:'Plan and Define Program', color:'blue', icon:'🎯',
                    inputs:'Customer requirements, historical warranty data, market research, lessons learned',
                    outputs:'Design goals, reliability goals, preliminary BOM, preliminary PFD, special chars list, timing plan',
                    gate:'Management approval of design goals and program timing' },
                  { ph:'Phase 2', name:'Product Design and Development', color:'purple', icon:'📐',
                    inputs:'Design goals, engineering specifications, preliminary BOM',
                    outputs:'DFMEA, design verification plan (DVP&R), engineering drawings and specs, prototype control plan, prototype build results',
                    gate:'Design freeze — engineering sign-off on drawings and DFMEA AP ratings' },
                  { ph:'Phase 3', name:'Process Design and Development', color:'cyan', icon:'⚙️',
                    inputs:'DFMEA, engineering drawings, special characteristics',
                    outputs:'Process flow diagram (PFD), PFMEA, pre-launch control plan, work instructions, MSA plan, capability study plan',
                    gate:'Process readiness review — pre-launch CP approved, tooling in place' },
                  { ph:'Phase 4', name:'Product and Process Validation', color:'green', icon:'✅',
                    inputs:'Pre-launch control plan, PFMEA, MSA plan',
                    outputs:'Production trial run results, GRR studies, Pp/Ppk capability, PPAP submission, PSW approval',
                    gate:'PPAP approved (PSW signed by customer) — Cpk ≥ 1.67 for CC chars' },
                  { ph:'Phase 5', name:'Feedback, Assessment & Corrective Action', color:'amber', icon:'🔄',
                    inputs:'Production quality data, warranty data, customer feedback',
                    outputs:'Reduced variation, customer satisfaction confirmation, lessons learned, updated control plan',
                    gate:'Program closure — management sign-off, lessons learned archived' },
                ].map(s => (
                  <div key={s.ph} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <span className="text-white font-bold text-sm">{s.ph}: {s.name}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-gray-500 font-semibold mb-1">Key Inputs</div>
                        <p className="text-gray-400 leading-relaxed">{s.inputs}</p>
                      </div>
                      <div>
                        <div className="text-gray-500 font-semibold mb-1">Key Outputs</div>
                        <p className="text-gray-400 leading-relaxed">{s.outputs}</p>
                      </div>
                      <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                        <div className="text-green-400 font-semibold mb-1">Gate Criterion</div>
                        <p className="text-green-300 leading-relaxed">{s.gate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* APQP vs PPAP */}
            <div className="bg-gray-900 border border-amber-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">🔗 APQP vs PPAP — What is the Difference?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-indigo-300 font-bold mb-2">APQP — The Process</div>
                  <ul className="space-y-1 text-gray-400 text-xs">
                    <li>• A planning methodology (5 phases)</li>
                    <li>• Defines WHAT must be done and WHEN during product development</li>
                    <li>• Runs throughout the entire program (design → launch)</li>
                    <li>• Internal tool — the supplier uses it to plan their quality activities</li>
                    <li>• Output: a well-controlled, capable process</li>
                  </ul>
                </div>
                <div>
                  <div className="text-green-300 font-bold mb-2">PPAP — The Evidence</div>
                  <ul className="space-y-1 text-gray-400 text-xs">
                    <li>• An 18-element submission package</li>
                    <li>• Proves to the customer that the process is capable and controlled</li>
                    <li>• Submitted at the end of Phase 4</li>
                    <li>• External submission — sent to the customer for approval</li>
                    <li>• Output: Part Submission Warrant (PSW) with customer approval</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg text-xs text-amber-300">
                <strong>Key rule:</strong> PPAP is the proof that APQP was done correctly. A supplier who skips APQP and tries to fabricate PPAP documents is a major audit finding under IATF 16949 Cl. 8.3.
              </div>
            </div>

            {/* IATF Clauses */}
            <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">📌 IATF 16949 Clauses — APQP Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['8.3.1','Design and Development Planning','APQP timing plan must cover all 5 phases. Cross-functional team required. Gate reviews mandatory.'],
                  ['8.3.2','Design and Development Inputs','Customer requirements, regulatory requirements, and lessons learned must feed Phase 1.'],
                  ['8.3.3','Design and Development Controls','DFMEA, design reviews, and DVP&R must be completed in Phase 2 with records.'],
                  ['8.3.4','Design and Development Outputs','Drawings, DFMEA, control plan, and work instructions must be released before production.'],
                  ['8.3.5','Design and Development Changes','Any change after PSW approval requires customer notification and possible re-PPAP.'],
                  ['8.3.6','Design and Development Outsourcing','If a supplier designs the product, they must follow the same APQP discipline.'],
                ].map(([cl, title, req]) => (
                  <div key={cl} className="bg-purple-900/20 border border-purple-800/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-700 text-white text-xs font-bold px-2 py-0.5 rounded">Cl. {cl}</span>
                      <span className="text-purple-300 text-sm font-semibold">{title}</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{req}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── GUIDE TAB ─────────────────────────────────────────────────────── */}
      {mainTab === 'guide' && (
        <div className="p-6 bg-gray-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-5">

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">How to Run an APQP Program</h2>
              <p className="text-gray-400 text-sm mt-1">Aligned with AIAG APQP 2nd Edition and IATF 16949 Cl. 8.3</p>
            </div>

            {[
              { step:1, icon:'🤝', title:'Get Customer Requirements & Form the Team',
                body:'Start with the customer\'s product requirements, drawings, and any customer-specific APQP requirements (e.g., Ford GPDS, GM APQP). Form a cross-functional team: Quality, Engineering, Manufacturing, Procurement, Logistics. Assign a Program Manager. Get management commitment and resource sign-off before starting.' },
              { step:2, icon:'📅', title:'Build the APQP Timing Plan',
                body:'Work backward from SOP (Start of Production) to set gate dates for all 5 phases. Typical timing: Phase 1 (0–15% of program), Phase 2 (15–40%), Phase 3 (40–70%), Phase 4 (70–90%), Phase 5 (90%+). Build a Gantt chart with all AIAG deliverables and owners. Review timing with customer if required by their CSR.' },
              { step:3, icon:'🎯', title:'Execute Phase 1 — Plan',
                body:'Translate customer requirements into design and reliability goals using QFD/House of Quality. Prepare the preliminary process flow, BOM, and special characteristics list. The key output is an agreed set of goals and a timing plan that the whole team owns. Common mistake: rushing Phase 1 to get to design faster — every gap here becomes a launch crisis.' },
              { step:4, icon:'📐', title:'Execute Phase 2 — Design',
                body:'Complete DFMEA before drawings are released — not after. Run design reviews at concept, design freeze, and drawing release stages (minimum 2 reviews). Complete DVP&R tests as planned. Issue the prototype control plan and conduct prototype builds. Gate criterion: all DFMEA High-AP items have actions assigned and confirmed with customer.' },
              { step:5, icon:'⚙️', title:'Execute Phase 3 — Process',
                body:'Build the PFMEA, PFD, and Control Plan as a linked set — changes in one must update the others. Complete the pre-launch control plan before trial runs. Prepare all work instructions, operator training, and gauge plans. Procure all tooling and equipment with acceptance criteria. Gate criterion: pre-launch CP approved, tooling accepted, operators trained.' },
              { step:6, icon:'✅', title:'Execute Phase 4 — Validate',
                body:'Run minimum 300-piece production trial (check your CSR — Ford requires 300, GM may require more). Complete all GRR studies during the trial. Calculate Pp/Ppk for all CC/SC characteristics — must be ≥ 1.67. Prepare PPAP package (all elements per submission level). Submit PPAP to customer and obtain PSW. Gate: PSW received.' },
              { step:7, icon:'🔄', title:'Execute Phase 5 — Sustain',
                body:'Monitor first-90-day production quality closely. Track any field returns or customer concerns. Confirm Cpk is stable at or above target. Document all lessons learned — both problems encountered AND practices that worked well. Archive the full program dossier. Hold formal program closure meeting with management sign-off.' },
            ].map(s => (
              <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="text-indigo-300 font-bold text-sm">{s.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">❌ Common APQP Mistakes</h2>
              <div className="space-y-3">
                {[
                  ['Starting PFMEA after tooling is ordered', 'PFMEA must be completed before tooling is released. After tooling, changes are expensive — the whole point of PFMEA is to prevent design-in errors.'],
                  ['APQP timing plan as decoration — not tracked', 'The timing plan must be a live document reviewed at every gate meeting. Dates must be updated. Slip dates must trigger escalation.'],
                  ['Cross-functional team = Quality doing everything alone', 'APQP is a cross-functional activity. Engineering owns DFMEA. Manufacturing owns PFMEA. Quality facilitates but does not own all elements.'],
                  ['PPAP submission without a valid trial run', 'The production trial must use production tooling, production operators, production materials, at production rate. Using prototype parts or tools invalidates PPAP.'],
                  ['Lessons Learned not documented or shared', 'Phase 5 lessons must feed back into Phase 1 of the next program. If Phase 5 is skipped, the same mistakes repeat on every new program.'],
                  ['Gate reviews as formality — no real go/no-go decision', 'A gate review must have pass/fail criteria. If critical deliverables are missing, the gate must be held — not rubber-stamped to meet schedule.'],
                ].map(([m, f], i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                      <span className="text-red-400 text-sm flex-shrink-0">✗</span>
                      <p className="text-red-300 text-xs">{m}</p>
                    </div>
                    <div className="flex items-start gap-2 bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                      <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                      <p className="text-green-300 text-xs">{f}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">🎯 IATF Auditor Questions — Be Ready</h2>
              <div className="space-y-2">
                {[
                  'Show me your APQP timing plan for this program. Which phase are you currently in?',
                  'Who is the cross-functional team? Are Engineering, Manufacturing, and Procurement all represented?',
                  'When was the DFMEA completed? Was it done before the drawings were released?',
                  'Show me the gate review records. What were the open actions from Phase 2 gate and when were they closed?',
                  'How many pieces were run in the production trial? Was it done with production tooling and production operators?',
                  'What was the Ppk result for this CC characteristic from the capability study? Is it ≥ 1.67?',
                  'Where are the lessons learned from this program? How were they shared with the team?',
                  'Your PPAP was submitted 8 months ago — has the Control Plan been updated since then due to any process changes?',
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-3 bg-purple-900/20 border border-purple-800/30 rounded-lg px-4 py-3">
                    <span className="text-purple-400 font-bold text-sm flex-shrink-0">Q{i+1}</span>
                    <p className="text-gray-300 text-xs leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
