'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ---------------------------------------------------------------------
type SkillLevel  = 0 | 1 | 2 | 3 | 4;
type DLStatus    = 'on-track' | 'at-risk' | 'achieved' | 'missed';
type SavingType  = 'process' | 'material' | 'energy' | 'waste' | 'inspection' | 'rework';
type SavingStatus = 'idea' | 'approved' | 'in-progress' | 'completed' | 'rejected';

interface SkillArea {
  name: string;
  required: SkillLevel;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: string;
  joinDate: string;
  skills: Record<string, SkillLevel>;
  certifications: string[];
  trainingDue: string;
  trainingScore: number;
  engagementScore: number;
}

interface DLTarget {
  id: string;
  memberId: string;
  memberName: string;
  kpi: string;
  unit: string;
  target: number;
  actual: number;
  status: DLStatus;
  month: string;
}

interface CostSaving {
  id: string;
  title: string;
  type: SavingType;
  submittedBy: string;
  submittedDate: string;
  description: string;
  estimatedSaving: number;
  actualSaving: number;
  status: SavingStatus;
  approvedBy: string;
  implementedDate: string;
  notes: string;
}

interface QualityTick {
  parameter: string;
  category: string;
  maxScore: number;
  actual: number;
  target: number;
  gap: number;
  action: string;
}

// -- Constants -----------------------------------------------------------------
const SKILL_AREAS: SkillArea[] = [
  { name: 'IATF 16949', required: 3 },
  { name: 'FMEA / PFMEA', required: 3 },
  { name: 'SPC / Cp/Cpk', required: 2 },
  { name: 'MSA / GRR', required: 2 },
  { name: 'PPAP / APQP', required: 3 },
  { name: '8D / Problem Solving', required: 3 },
  { name: 'Audit Skills', required: 2 },
  { name: 'Customer Quality', required: 2 },
];

const SKILL_LABELS: Record<SkillLevel, string> = {
  0: 'None', 1: 'Beginner', 2: 'Practitioner', 3: 'Proficient', 4: 'Expert',
};
const SKILL_COLORS: Record<SkillLevel, string> = {
  0: 'bg-[#dbeafe] text-[#1e3a5f]',
  1: 'bg-red-900/60 text-red-600',
  2: 'bg-yellow-900/30/60 text-yellow-400',
  3: 'bg-emerald-50/60 text-[#15803d]',
  4: 'bg-[#eff6ff]/60 text-[#1d4ed8]',
};

const DL_STATUS_COLOR: Record<DLStatus, string> = {
  'on-track': 'text-[#1d4ed8] bg-[#eff6ff]',
  'at-risk':  'text-yellow-400 bg-yellow-900/30/30',
  'achieved': 'text-[#15803d] bg-emerald-50/30',
  'missed':   'text-red-600 bg-red-900/30',
};

const SAVING_TYPE_COLOR: Record<SavingType, string> = {
  process:    'text-[#1d4ed8] bg-[#eff6ff]',
  material:   'text-[#15803d] bg-emerald-50',
  energy:     'text-yellow-400 bg-yellow-900/30/40',
  waste:      'text-orange-600 bg-orange-900/30',
  inspection: 'text-purple-400 bg-purple-900/30/40',
  rework:     'text-red-600 bg-red-50',
};
const SAVING_STATUS_COLOR: Record<SavingStatus, string> = {
  idea:        'text-[#1e3a5f] bg-[#dbeafe]',
  approved:    'text-[#1d4ed8] bg-[#eff6ff]',
  'in-progress':'text-yellow-400 bg-yellow-900/30/40',
  completed:   'text-[#15803d] bg-emerald-50',
  rejected:    'text-red-600 bg-red-50',
};

// -- Sample Data ---------------------------------------------------------------
const SAMPLE_TEAM: TeamMember[] = [
  { id: 'TM01', name: 'Priya Nair', role: 'Quality Manager', department: 'Quality', shift: 'General', joinDate: '2019-03-01', skills: { 'IATF 16949': 4, 'FMEA / PFMEA': 3, 'SPC / Cp/Cpk': 3, 'MSA / GRR': 3, 'PPAP / APQP': 4, '8D / Problem Solving': 4, 'Audit Skills': 4, 'Customer Quality': 3 }, certifications: ['IATF LA', 'Six Sigma GB', 'VDA 6.3'], trainingDue: '2025-03-01', trainingScore: 92, engagementScore: 90 },
  { id: 'TM02', name: 'Kiran Desai', role: 'SQA Engineer', department: 'Quality', shift: 'General', joinDate: '2021-06-15', skills: { 'IATF 16949': 3, 'FMEA / PFMEA': 3, 'SPC / Cp/Cpk': 2, 'MSA / GRR': 2, 'PPAP / APQP': 3, '8D / Problem Solving': 3, 'Audit Skills': 2, 'Customer Quality': 2 }, certifications: ['IATF Internal Auditor'], trainingDue: '2025-02-15', trainingScore: 85, engagementScore: 82 },
  { id: 'TM03', name: 'Amit Sharma', role: 'Process Quality Engineer', department: 'Quality', shift: 'A', joinDate: '2022-01-10', skills: { 'IATF 16949': 2, 'FMEA / PFMEA': 2, 'SPC / Cp/Cpk': 2, 'MSA / GRR': 1, 'PPAP / APQP': 2, '8D / Problem Solving': 2, 'Audit Skills': 1, 'Customer Quality': 2 }, certifications: [], trainingDue: '2025-01-31', trainingScore: 76, engagementScore: 75 },
  { id: 'TM04', name: 'Deepak Yadav', role: 'IQC Inspector', department: 'Quality', shift: 'C', joinDate: '2023-04-01', skills: { 'IATF 16949': 1, 'FMEA / PFMEA': 1, 'SPC / Cp/Cpk': 1, 'MSA / GRR': 2, 'PPAP / APQP': 1, '8D / Problem Solving': 2, 'Audit Skills': 1, 'Customer Quality': 1 }, certifications: [], trainingDue: '2025-01-20', trainingScore: 68, engagementScore: 70 },
  { id: 'TM05', name: 'Suresh Patel', role: 'OQC Inspector', department: 'Quality', shift: 'B', joinDate: '2022-09-05', skills: { 'IATF 16949': 2, 'FMEA / PFMEA': 1, 'SPC / Cp/Cpk': 1, 'MSA / GRR': 2, 'PPAP / APQP': 1, '8D / Problem Solving': 2, 'Audit Skills': 1, 'Customer Quality': 2 }, certifications: ['AQL Sampling'], trainingDue: '2025-02-28', trainingScore: 79, engagementScore: 78 },
];

const SAMPLE_DL_TARGETS: DLTarget[] = [
  { id: 'DL01', memberId: 'TM01', memberName: 'Priya Nair', kpi: 'Customer PPM', unit: 'PPM', target: 50, actual: 38, status: 'achieved', month: '2025-01' },
  { id: 'DL02', memberId: 'TM01', memberName: 'Priya Nair', kpi: 'CAPA On-Time Closure', unit: '%', target: 95, actual: 91, status: 'at-risk', month: '2025-01' },
  { id: 'DL03', memberId: 'TM02', memberName: 'Kiran Desai', kpi: 'Supplier PPM', unit: 'PPM', target: 200, actual: 165, status: 'achieved', month: '2025-01' },
  { id: 'DL04', memberId: 'TM02', memberName: 'Kiran Desai', kpi: 'SCAR Closure Rate', unit: '%', target: 100, actual: 80, status: 'missed', month: '2025-01' },
  { id: 'DL05', memberId: 'TM03', memberName: 'Amit Sharma', kpi: 'Internal PPM', unit: 'PPM', target: 500, actual: 648, status: 'missed', month: '2025-01' },
  { id: 'DL06', memberId: 'TM03', memberName: 'Amit Sharma', kpi: 'Poka-Yoke Challenge Rate', unit: '%', target: 100, actual: 100, status: 'achieved', month: '2025-01' },
  { id: 'DL07', memberId: 'TM04', memberName: 'Deepak Yadav', kpi: 'IQC Rejection Rate', unit: '%', target: 1.0, actual: 0.8, status: 'achieved', month: '2025-01' },
  { id: 'DL08', memberId: 'TM05', memberName: 'Suresh Patel', kpi: 'OQC Dispatch Hold Rate', unit: '%', target: 2, actual: 1.5, status: 'achieved', month: '2025-01' },
];

const SAMPLE_SAVINGS: CostSaving[] = [
  { id: 'CS01', title: 'Eliminate 3rd-party sorting by adding poka-yoke at Op-20', type: 'inspection', submittedBy: 'Priya Nair', submittedDate: '2025-01-05', description: 'Bracket orientation detected by sensor at Op-20 — eliminates need for 3rd party 100% sorting (₹18K/month cost).', estimatedSaving: 216000, actualSaving: 210000, status: 'completed', approvedBy: 'Plant Head', implementedDate: '2025-01-18', notes: 'Poka-yoke installed and validated. Sorting contract terminated.' },
  { id: 'CS02', title: 'Consolidate IQC sampling — skip-lot for A-rated suppliers', type: 'inspection', submittedBy: 'Kiran Desai', submittedDate: '2025-01-08', description: 'Implement skip-lot inspection for 3 A-rated suppliers — saves 40% inspector time on IQC.', estimatedSaving: 36000, actualSaving: 0, status: 'in-progress', approvedBy: 'Quality Head', implementedDate: '', notes: 'Risk assessment complete. Implementing skip-lot protocol for SUP-021 from 1-Feb.' },
  { id: 'CS03', title: 'Rework cost reduction — SPC control on weld parameter', type: 'rework', submittedBy: 'Amit Sharma', submittedDate: '2025-01-10', description: 'Add SPC control chart on weld current — predicted to reduce weld rework from 3.2% to < 0.8%.', estimatedSaving: 85000, actualSaving: 0, status: 'approved', approvedBy: 'Quality Head', implementedDate: '', notes: 'SPC chart to be implemented by welding engineer by 20-Jan.' },
  { id: 'CS04', title: 'Reduce scrap by correcting fixture clamping at Op-30', type: 'process', submittedBy: 'Amit Sharma', submittedDate: '2024-12-15', description: 'Fixture slip at Op-30 causing dimensional OOS scrap — redesigned clamp reduces scrap from 28 to 3 pcs/month.', estimatedSaving: 31200, actualSaving: 31200, status: 'completed', approvedBy: 'Plant Head', implementedDate: '2025-01-05', notes: 'Verified over 3 production lots. Scrap down to 0–2 pcs/month.' },
  { id: 'CS05', title: 'Energy saving — turn off calibration room AC after hours', type: 'energy', submittedBy: 'Deepak Yadav', submittedDate: '2025-01-12', description: 'Calibration room AC left running 24/7 — install timer to switch off 8pm–7am.', estimatedSaving: 8400, actualSaving: 0, status: 'idea', approvedBy: '', implementedDate: '', notes: 'Submitted for review.' },
];

const SAMPLE_TICKS: QualityTick[] = [
  { parameter: 'Customer PPM', category: 'Customer Quality', maxScore: 15, actual: 14, target: 12, gap: 0, action: '' },
  { parameter: 'Warranty / Field Returns', category: 'Customer Quality', maxScore: 15, actual: 8, target: 12, gap: 4, action: 'Root cause analysis on 7 warranty returns — 8D submitted to customer by 28-Jan.' },
  { parameter: 'Customer Complaints (0-Days)', category: 'Customer Quality', maxScore: 10, actual: 9, target: 8, gap: 0, action: '' },
  { parameter: 'Internal PPM', category: 'Manufacturing Quality', maxScore: 10, actual: 6, target: 8, gap: 2, action: 'Weld rework reduction Kaizen in progress — target < 500 PPM by Feb-end.' },
  { parameter: 'Supplier PPM', category: 'Supplier Quality', maxScore: 10, actual: 9, target: 8, gap: 0, action: '' },
  { parameter: 'IATF / ISO Audit Compliance', category: 'QMS System', maxScore: 15, actual: 14, target: 12, gap: 0, action: '' },
  { parameter: 'CAPA On-Time Closure', category: 'QMS System', maxScore: 10, actual: 7, target: 9, gap: 2, action: '3 CAPAs overdue — owner-wise follow-up initiated. Close by 31-Jan.' },
  { parameter: 'OEE (Quality Component)', category: 'Manufacturing Quality', maxScore: 10, actual: 8, target: 8, gap: 0, action: '' },
  { parameter: 'Kaizen / CI Participation', category: 'TQM', maxScore: 5, actual: 5, target: 4, gap: 0, action: '' },
];

// -- Helper: skill gap for a member -------------------------------------------
function memberGaps(member: TeamMember): number {
  return SKILL_AREAS.filter(sa => (member.skills[sa.name] ?? 0) < sa.required).length;
}

function avgSkill(member: TeamMember): number {
  const vals = SKILL_AREAS.map(sa => member.skills[sa.name] ?? 0);
  return (vals as number[]).reduce((a, v) => a + v, 0) / vals.length;
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Team Dashboard
// ══════════════════════════════════════════════════════════════════════════════
function TeamDashboardTab({ team, dlTargets }: { team: TeamMember[]; dlTargets: DLTarget[] }) {
  const [subTab, setSubTab] = useState<'skill' | 'dl'>('skill');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const teamStats = useMemo(() => {
    const totalGaps = team.reduce((a, m) => a + memberGaps(m), 0);
    const avgEng = team.length > 0 ? team.reduce((a, m) => a + m.engagementScore, 0) / team.length : 0;
    const avgTraining = team.length > 0 ? team.reduce((a, m) => a + m.trainingScore, 0) / team.length : 0;
    const dlAchieved = dlTargets.filter(d => d.status === 'achieved').length;
    const dlMissed = dlTargets.filter(d => d.status === 'missed').length;
    return { totalGaps, avgEng, avgTraining, dlAchieved, dlMissed, dlTotal: dlTargets.length };
  }, [team, dlTargets]);

  return (
      <>
      <PageTitle title="Managerial" />
      <div className="space-y-5">
      {/* Team summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Team Size', val: team.length, cls: 'text-[#1e3a5f]' },
          { label: 'Skill Gaps (Total)', val: teamStats.totalGaps, cls: teamStats.totalGaps > 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Avg Training Score', val: `${teamStats.avgTraining.toFixed(0)}%`, cls: teamStats.avgTraining >= 80 ? 'text-emerald-600' : 'text-yellow-400' },
          { label: 'DL Achievement', val: `${teamStats.dlAchieved}/${teamStats.dlTotal}`, cls: 'text-[#1e3a5f]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-3 border border-[#dbeafe] text-center">
            <div className="text-xs text-[#1e3a5f]">{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Sub-tab */}
      <div className="flex border border-[#dbeafe] rounded-lg overflow-hidden w-fit">
        {([['skill', '🎯 Skill Matrix'], ['dl', '📊 DL Targets']] as const).map(([st, label]) => (
          <button key={st} onClick={() => setSubTab(st)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${subTab === st ? 'bg-blue-700 text-white' : 'bg-white text-[#1e3a5f] hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {subTab === 'skill' && (
        <div className="space-y-3">
          {/* Skill matrix header */}
          <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#dbeafe] bg-white">
                    <th className="text-left text-[#1e3a5f] px-4 py-3 font-medium min-w-[160px]">Team Member</th>
                    {SKILL_AREAS.map(sa => (
                      <th key={sa.name} className="text-center text-[#1e3a5f] px-2 py-3 font-medium min-w-[80px]">
                        <div>{sa.name}</div>
                        <div className="text-[#1e3a5f] font-normal">Req: {sa.required}</div>
                      </th>
                    ))}
                    <th className="text-center text-[#1e3a5f] px-3 py-3 font-medium">Gaps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {team.map(m => {
                    const gaps = memberGaps(m);
                    return (
                      <tr key={m.id} className="hover:bg-[#dbeafe]/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{m.name}</div>
                          <div className="text-[#1e3a5f]">{m.role}</div>
                        </td>
                        {SKILL_AREAS.map(sa => {
                          const level = m.skills[sa.name] ?? 0 as SkillLevel;
                          const isGap = level < sa.required;
                          return (
                            <td key={sa.name} className="px-2 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SKILL_COLORS[level as SkillLevel]} ${isGap ? 'ring-1 ring-red-500/50' : ''}`}>
                                {level}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center">
                          <span className={`text-sm font-bold ${gaps > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{gaps}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-[#dbeafe] flex flex-wrap gap-3 text-xs">
              {([0, 1, 2, 3, 4] as SkillLevel[]).map(l => (
                <span key={l} className={`px-2 py-0.5 rounded ${SKILL_COLORS[l]}`}>{l} — {SKILL_LABELS[l]}</span>
              ))}
              <span className="text-[#1e3a5f] ml-2">Ring = below required level</span>
            </div>
          </div>

          {/* Member cards */}
          <div className="space-y-2">
            {team.map(m => {
              const gaps = memberGaps(m);
              const isOpen = expandedMember === m.id;
              return (
                <div key={m.id} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
                  <button className="w-full text-left p-4 hover:bg-white transition-colors" onClick={() => setExpandedMember(isOpen ? null : m.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#eff6ff] border border-blue-700/50 flex items-center justify-center text-sm font-bold text-[#1d4ed8]">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{m.name}</div>
                        <div className="text-xs text-[#1e3a5f]">{m.role} · {m.shift} Shift · Since {m.joinDate}</div>
                      </div>
                      <div className="flex items-center gap-4 mr-2">
                        <div className="text-right">
                          <div className="text-xs text-[#1e3a5f]">Training</div>
                          <div className={`text-sm font-bold ${m.trainingScore >= 80 ? 'text-emerald-600' : 'text-yellow-400'}`}>{m.trainingScore}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#1e3a5f]">Skill Gaps</div>
                          <div className={`text-sm font-bold ${gaps > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{gaps}</div>
                        </div>
                      </div>
                      <span className="text-[#1e3a5f]">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#dbeafe] p-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {m.certifications.length > 0
                          ? m.certifications.map(c => <span key={c} className="text-xs bg-emerald-50 text-[#15803d] border border-emerald-200 px-2 py-0.5 rounded">🏅 {c}</span>)
                          : <span className="text-xs text-[#1e3a5f]">No certifications yet</span>
                        }
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#eff6ff] rounded-lg p-3">
                          <div className="text-xs text-[#1e3a5f]">Next Training Due</div>
                          <div className="text-white">{m.trainingDue}</div>
                        </div>
                        <div className="bg-[#eff6ff] rounded-lg p-3">
                          <div className="text-xs text-[#1e3a5f]">Engagement Score</div>
                          <div className={`font-bold ${m.engagementScore >= 80 ? 'text-emerald-600' : 'text-yellow-400'}`}>{m.engagementScore}%</div>
                        </div>
                      </div>
                      {gaps > 0 && (
                        <div className="bg-red-50 border border-red-700/30 rounded-lg p-3 text-xs text-red-700">
                          Training gap identified in: {SKILL_AREAS.filter(sa => (m.skills[sa.name] ?? 0) < sa.required).map(sa => sa.name).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'dl' && (
        <div className="space-y-4">
          {/* By member */}
          {team.map(m => {
            const memberTargets = dlTargets.filter(d => d.memberId === m.id);
            if (memberTargets.length === 0) return null;
            const achieved = memberTargets.filter(d => d.status === 'achieved').length;
            return (
              <div key={m.id} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
                <div className="px-4 py-3 bg-[#dbeafe]/40 border-b border-[#dbeafe] flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white text-sm">{m.name}</span>
                    <span className="text-xs text-[#1e3a5f] ml-2">{m.role}</span>
                  </div>
                  <span className={`text-xs font-bold ${achieved === memberTargets.length ? 'text-emerald-600' : 'text-yellow-400'}`}>
                    {achieved}/{memberTargets.length} achieved
                  </span>
                </div>
                <div className="divide-y divide-gray-200">
                  {memberTargets.map(dl => {
                    const isHigherBetter = !['PPM', 'PPM'].some(u => dl.unit === u && dl.kpi.includes('PPM')) ||
                      dl.unit === '%';
                    const pctOfTarget = dl.target > 0 ? (dl.actual / dl.target) * 100 : 0;
                    return (
                      <div key={dl.id} className="px-4 py-3 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-sm text-white">{dl.kpi}</div>
                          <div className="text-xs text-[#1e3a5f]">{dl.month}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#1e3a5f]">Target</div>
                          <div className="text-sm text-[#1e3a5f]">{dl.target} {dl.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#1e3a5f]">Actual</div>
                          <div className="text-sm font-bold text-white">{dl.actual} {dl.unit}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-medium min-w-[80px] text-center ${DL_STATUS_COLOR[dl.status]}`}>
                          {dl.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
      </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Cost Savings & VAVE
// ══════════════════════════════════════════════════════════════════════════════
function CostSavingsTab({ savings }: { savings: CostSaving[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const summary = useMemo(() => {
    const completed = savings.filter(s => s.status === 'completed');
    const inPipeline = savings.filter(s => s.status !== 'completed' && s.status !== 'rejected');
    return {
      total: savings.length,
      completedSaving: completed.reduce((a, s) => a + s.actualSaving, 0),
      pipelineSaving: inPipeline.reduce((a, s) => a + s.estimatedSaving, 0),
      completedCount: completed.length,
      inProgressCount: savings.filter(s => s.status === 'in-progress').length,
    };
  }, [savings]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Ideas', val: summary.total, cls: 'text-[#1e3a5f]' },
          { label: 'Certified Savings', val: `₹${(summary.completedSaving / 1000).toFixed(0)}K`, cls: 'text-emerald-600' },
          { label: 'Pipeline Savings', val: `₹${(summary.pipelineSaving / 1000).toFixed(0)}K`, cls: 'text-blue-600' },
          { label: 'In Progress', val: summary.inProgressCount, cls: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-3 border border-[#dbeafe] text-center">
            <div className="text-xs text-[#1e3a5f]">{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Savings cards */}
      <div className="space-y-3">
        {savings.map(s => {
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
              <button className="w-full text-left p-4 hover:bg-white transition-colors" onClick={() => setExpanded(isOpen ? null : s.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${SAVING_TYPE_COLOR[s.type]}`}>{s.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${SAVING_STATUS_COLOR[s.status]}`}>{s.status.replace('-', ' ').toUpperCase()}</span>
                  <span className="text-sm font-medium text-white flex-1">{s.title}</span>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right">
                      <div className="text-xs text-[#1e3a5f]">{s.status === 'completed' ? 'Actual' : 'Estimated'}</div>
                      <div className={`text-sm font-bold ${s.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        ₹{(s.status === 'completed' ? s.actualSaving : s.estimatedSaving).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[#1e3a5f]">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-[#1e3a5f]">By: {s.submittedBy} · {s.submittedDate}</div>
              </button>

              {isOpen && (
                <div className="border-t border-[#dbeafe] p-4 space-y-3">
                  <div className="bg-[#eff6ff] rounded-lg p-3 text-sm text-[#1e3a5f]">{s.description}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { l: 'Est. Saving', v: `₹${s.estimatedSaving.toLocaleString()}` },
                      { l: 'Actual Saving', v: s.actualSaving > 0 ? `₹${s.actualSaving.toLocaleString()}` : '—' },
                      { l: 'Approved By', v: s.approvedBy || '—' },
                      { l: 'Implemented', v: s.implementedDate || '—' },
                    ].map(d => (
                      <div key={d.l} className="bg-[#eff6ff] rounded-lg p-3">
                        <div className="text-xs text-[#1e3a5f]">{d.l}</div>
                        <div className="text-white">{d.v}</div>
                      </div>
                    ))}
                  </div>
                  {s.notes && <div className="bg-[#eff6ff] border border-blue-700/50 rounded-lg p-3 text-xs text-[#1d4ed8]">💬 {s.notes}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Quality Ticks & Engagement
// ══════════════════════════════════════════════════════════════════════════════
function QualityTicksTab({ ticks, team }: { ticks: QualityTick[]; team: TeamMember[] }) {
  const [subTab, setSubTab] = useState<'ticks' | 'engagement'>('ticks');

  const tickSummary = useMemo(() => {
    const total = ticks.reduce((a, t) => a + t.maxScore, 0);
    const actual = ticks.reduce((a, t) => a + t.actual, 0);
    const gaps = ticks.filter(t => t.gap > 0).length;
    return { total, actual, pct: total > 0 ? (actual / total) * 100 : 0, gaps };
  }, [ticks]);

  const grouped = useMemo(() => {
    const g: Record<string, QualityTick[]> = {};
    ticks.forEach(t => { if (!g[t.category]) g[t.category] = []; g[t.category].push(t); });
    return g;
  }, [ticks]);

  const avgEngagement = team.length > 0
    ? team.reduce((a, m) => a + m.engagementScore, 0) / team.length
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex border border-[#dbeafe] rounded-lg overflow-hidden w-fit">
        {([['ticks', '✅ Quality Ticks'], ['engagement', '🤝 Team Engagement']] as const).map(([st, label]) => (
          <button key={st} onClick={() => setSubTab(st)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${subTab === st ? 'bg-blue-700 text-white' : 'bg-white text-[#1e3a5f] hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {subTab === 'ticks' && (
        <div className="space-y-4">
          {/* Overall score */}
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
              <h3 className="font-semibold text-white">Quality Ticks — Overall Score</h3>
              <div>
                <span className={`text-3xl font-bold ${tickSummary.pct >= 80 ? 'text-emerald-600' : tickSummary.pct >= 60 ? 'text-yellow-400' : 'text-red-600'}`}>
                  {tickSummary.actual}
                </span>
                <span className="text-[#1e3a5f] text-xl"> / {tickSummary.total}</span>
                <span className={`ml-2 text-lg font-bold ${tickSummary.pct >= 80 ? 'text-emerald-600' : tickSummary.pct >= 60 ? 'text-yellow-400' : 'text-red-600'}`}>
                  ({tickSummary.pct.toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className="h-3 bg-[#dbeafe] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${tickSummary.pct >= 80 ? 'bg-emerald-500' : tickSummary.pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${tickSummary.pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-[#1e3a5f]">{tickSummary.gaps} parameter{tickSummary.gaps !== 1 ? 's' : ''} below target</div>
          </div>

          {/* By category */}
          {Object.entries(grouped).map(([cat, items]) => {
            const catActual = items.reduce((a, t) => a + t.actual, 0);
            const catMax = items.reduce((a, t) => a + t.maxScore, 0);
            return (
              <div key={cat} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
                <div className="px-5 py-3 bg-[#dbeafe]/40 border-b border-[#dbeafe] flex justify-between items-center">
                  <h3 className="font-semibold text-white text-sm">{cat}</h3>
                  <span className="text-xs text-[#1e3a5f]">{catActual}/{catMax}</span>
                </div>
                <div className="divide-y divide-gray-200">
                  {items.map(tick => {
                    const pct = tick.maxScore > 0 ? (tick.actual / tick.maxScore) * 100 : 0;
                    const hasGap = tick.gap > 0;
                    return (
                      <div key={tick.parameter} className={`p-4 ${hasGap ? 'bg-red-900/5' : ''}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${hasGap ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <span className="text-sm text-white flex-1">{tick.parameter}</span>
                          <span className={`text-sm font-bold ${hasGap ? 'text-red-600' : 'text-emerald-600'}`}>{tick.actual}/{tick.maxScore}</span>
                        </div>
                        <div className="h-1.5 bg-[#dbeafe] rounded-full overflow-hidden ml-5">
                          <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        {tick.action && <div className="mt-2 ml-5 text-xs text-yellow-300">→ {tick.action}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'engagement' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Team Engagement Index</h3>
              <div className={`text-2xl font-bold ${avgEngagement >= 80 ? 'text-emerald-600' : 'text-yellow-400'}`}>{avgEngagement.toFixed(0)}%</div>
            </div>
            <div className="h-3 bg-[#dbeafe] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${avgEngagement >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${avgEngagement}%` }} />
            </div>
            <div className="mt-2 text-xs text-[#1e3a5f]">Target ≥ 80% | World-class ≥ 90%</div>
          </div>

          {team.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#eff6ff] border border-blue-700/50 flex items-center justify-center text-sm font-bold text-[#1d4ed8]">
                  {m.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{m.name}</div>
                  <div className="text-xs text-[#1e3a5f]">{m.role}</div>
                </div>
                <div className={`text-xl font-bold ${m.engagementScore >= 80 ? 'text-emerald-600' : 'text-yellow-400'}`}>{m.engagementScore}%</div>
              </div>
              <div className="h-1.5 bg-[#dbeafe] rounded-full overflow-hidden mt-3">
                <div className={`h-full rounded-full ${m.engagementScore >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${m.engagementScore}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Quality Head Guide
// ══════════════════════════════════════════════════════════════════════════════
function QualityHeadGuideTab() {
  const [freqFilter, setFreqFilter] = useState('All');

  const rhythm = [
    { freq: 'Daily', icon: '📅', color: 'bg-red-700', ring: 'ring-red-300', items: ['Review customer PPM and complaints dashboard', 'Check open NCR and CAPA status — escalate if overdue', 'Morning production quality brief with team leads', 'Review any containment or quality hold from previous shift', 'Sign off incoming/outgoing inspection holds if any'] },
    { freq: 'Weekly', icon: '📆', color: 'bg-blue-700', ring: 'ring-blue-300', items: ['Weekly quality KPI review with team — actual vs target', 'Review top defect pareto from IPQC and IQC', 'Conduct one process audit on highest-risk line', 'Review SCAR status — supplier 8D responses due this week', 'Team skill development check — training on track?', 'Cost saving pipeline review — any approvals needed?'] },
    { freq: 'Monthly', icon: '🗓', color: 'bg-green-700', ring: 'ring-green-300', items: ['Prepare and present management review input (KPIs, COQ, audit findings, CAPA)', 'Skill assessment for all QA team members — update matrix', 'DL target setting and mid-month review', 'Supplier scorecard issue and monthly SQA review', 'Document review — any overdue for periodic review?', 'Quality Ticks score review and action plan submission', 'COQ analysis — present to management with improvement plan', 'Kaizen/CI savings certification and pipeline review'] },
    { freq: 'Quarterly', icon: '📊', color: 'bg-purple-700', ring: 'ring-purple-300', items: ['Internal audit programme execution and finding closure', 'Supplier process audit (VDA 6.3) for high-risk suppliers', 'MSA study review — any gauges failing GRR?', 'SPC review — Cp/Cpk status for all CC/SC characteristics', 'Customer satisfaction survey / VOC collection', 'IATF compliance self-assessment and gap closure'] },
    { freq: 'Annually', icon: '🏆', color: 'bg-amber-700', ring: 'ring-amber-300', items: ['Management review meeting — all IATF 9.3 inputs', 'IATF / ISO re-certification or surveillance audit preparation', 'PPAP re-submission if required by customer (annual FAI)', 'Team training plan for new year — certification targets', 'Quality policy and objectives review and redeployment', 'TBEM / business excellence self-assessment submission'] },
  ];

  const filteredRhythm = freqFilter === 'All' ? rhythm : rhythm.filter(r => r.freq === freqFilter);

  const qualityHeadMindset = [
    { title: 'Think Customer First', desc: 'Every quality decision — from containment to audit — starts with: what is the risk to the customer? Zero defect escape is non-negotiable.' },
    { title: 'Data Over Opinion', desc: 'Never accept "I think" or "usually" as answers. Demand data: PPM, Cp/Cpk, GRR%, defect counts, cost. Decisions must be data-driven.' },
    { title: 'Systemic Correction', desc: 'Fix the system, not the person. Root causes should lead to updated FMEA, control plans, SOPs, and poka-yokes — not just operator warnings.' },
    { title: 'Prevention Over Detection', desc: 'Detection is expensive. Every ₹1 in prevention saves ₹10 in failure. Push APQP, FMEA, poka-yoke, and SPC over more inspectors.' },
    { title: 'Develop Your Team', desc: 'Your team\'s skill is your biggest asset. Train, certify, cross-post, mentor. A quality team that understands IATF is your audit-proof defence.' },
    { title: 'Own the Culture', desc: 'Quality culture is built by what you do when no one is watching. Be consistent, be visible on the shop floor, and reward quality thinking.' },
  ];

  return (
    <div className="space-y-6">
      {/* Frequency filter cards */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {rhythm.map(r => (
          <button key={r.freq} onClick={() => setFreqFilter(f => f === r.freq ? 'All' : r.freq)}
            className={`${r.color} rounded-lg px-2 py-2 transition-all hover:brightness-110 hover:scale-[1.02] ${freqFilter === r.freq ? `ring-2 ${r.ring} scale-[1.03]` : 'opacity-85'}`}>
            <p className="text-lg">{r.icon}</p>
            <p className="text-[11px] text-white font-semibold leading-tight">{r.freq}</p>
            <p className="text-[10px] text-white/90">{freqFilter === r.freq ? '▲ All' : `${r.items.length} tasks`}</p>
          </button>
        ))}
      </div>

      {/* Operating rhythm */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-[#0f172a] mb-4">🕐 Quality Head Operating Rhythm</h3>
        <div className="space-y-4">
          {filteredRhythm.map(r => (
            <div key={r.freq} className="bg-[#eff6ff] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{r.icon}</span>
                <span className="font-semibold text-[#0f172a] text-sm">{r.freq}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {r.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#1e3a5f]">
                    <span className="text-[#1d4ed8] mt-0.5 shrink-0">→</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mindset */}
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
        <h3 className="font-semibold text-[#0f172a] mb-4">🧠 Quality Head Mindset — 6 Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qualityHeadMindset.map((m, i) => (
            <div key={i} className="bg-[#eff6ff] rounded-lg p-4">
              <div className="font-medium text-[#0f172a] text-sm mb-1">{m.title}</div>
              <div className="text-xs text-[#1e3a5f]">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ManagerialPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [dlTargets, setDlTargets] = useState<DLTarget[]>([]);
  const [savings, setSavings] = useState<CostSaving[]>([]);
  const [ticks, setTicks] = useState<QualityTick[]>([]);
  const [loaded, setLoaded] = useState(false);

  const headerStats = useMemo(() => {
    const totalGaps = team.reduce((a, m) => a + memberGaps(m), 0);
    const dlAchieved = dlTargets.filter(d => d.status === 'achieved').length;
    const certSavings = savings.filter(s => s.status === 'completed').reduce((a, s) => a + s.actualSaving, 0);
    const tickScore = ticks.length > 0
      ? (ticks.reduce((a, t) => a + t.actual, 0) / ticks.reduce((a, t) => a + t.maxScore, 0) * 100)
      : 0;
    return { totalGaps, dlAchieved, dlTotal: dlTargets.length, certSavings, tickScore };
  }, [team, dlTargets, savings, ticks]);

  const tabs = ['👥 Team Dashboard', '💰 Cost Savings', '✅ Quality Ticks', '📖 QH Guide'];

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">👨‍💼</span>
                <h1 className="text-2xl font-bold text-[#0f172a]">Quality Head Command Centre</h1>
              </div>
              <p className="text-[#1e3a5f] text-sm">Team Skill Matrix · DL Targets · Cost Savings · Quality Ticks · Engagement · IATF 7.2</p>
            </div>
            <button
              onClick={() => {
                if (!loaded) { setTeam(SAMPLE_TEAM); setDlTargets(SAMPLE_DL_TARGETS); setSavings(SAMPLE_SAVINGS); setTicks(SAMPLE_TICKS); setLoaded(true); }
                else { setTeam([]); setDlTargets([]); setSavings([]); setTicks([]); setLoaded(false); }
              }}
              className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-800 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>

          {/* Header KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Team Skill Gaps', value: team.length > 0 ? `${headerStats.totalGaps}` : '—', color: headerStats.totalGaps > 0 ? 'text-red-600' : 'text-emerald-600', sub: 'Training actions needed' },
              { label: 'DL Achievement', value: dlTargets.length > 0 ? `${headerStats.dlAchieved}/${headerStats.dlTotal}` : '—', color: 'text-[#1d4ed8]', sub: 'Individual targets' },
              { label: 'CI Certified Savings', value: savings.length > 0 ? `₹${(headerStats.certSavings / 1000).toFixed(0)}K` : '—', color: 'text-emerald-600', sub: 'Completed projects' },
              { label: 'Quality Ticks Score', value: ticks.length > 0 ? `${headerStats.tickScore.toFixed(0)}%` : '—', color: headerStats.tickScore >= 80 ? 'text-emerald-600' : headerStats.tickScore >= 60 ? 'text-yellow-400' : 'text-red-600', sub: 'TML / Customer score' },
            ].map(s => (
              <div key={s.label} className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                <div className="text-xs text-[#1e3a5f] mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#dbeafe] bg-white px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-blue-500 text-[#1d4ed8]' : 'border-transparent text-[#1e3a5f] hover:text-[#0f172a]'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
      {/* -- DOWNLOADS ---------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/managerial/Management_Review_Report.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View MRM Report XLS">MRM Report XLS</a><a href="/downloads/managerial/Management_Review_Report.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download MRM Report XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/managerial/Executive_KPI_Dashboard.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Executive KPI XLS">Executive KPI XLS</a><a href="/downloads/managerial/Executive_KPI_Dashboard.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Executive KPI XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/managerial/Quality_Risk_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Risk Register XLS">Risk Register XLS</a><a href="/downloads/managerial/Quality_Risk_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Risk Register XLS">⬇</a></span>
      </div>
        {activeTab === 0 && <TeamDashboardTab team={team} dlTargets={dlTargets} />}
        {activeTab === 1 && <CostSavingsTab savings={savings} />}
        {activeTab === 2 && <QualityTicksTab ticks={ticks} team={team} />}
        {activeTab === 3 && <QualityHeadGuideTab />}
      </div>
      <QualityCopilot page="managerial" />
    </div>
  );
}