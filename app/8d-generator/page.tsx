'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// -- Types ---------------------------------------------------------------------
interface Complaint {
  id: string; complaint_number: string; customer_name: string; customer: string;
  part_name: string; severity: string; status: string; defect_category: string;
  defect_description: string;
}
interface EightDReport {
  complaint: {
    id: string; complaint_number: string; customer: string; part_name: string;
    part_number: string; defect_category: string; defect_description: string;
    severity: string; status: string; quantity_affected: number;
    total_supplied: number; ppm: number; created_at: string; age_days: number;
  };
  disciplines: {
    d1: D1; d2: D2; d3: D3; d4: D4; d5: D5; d6: D6; d7: D7; d8: D8;
  };
  iatfRef: string;
  generatedAt: string;
}
interface D1 { title: string; summary: string; teamLeader: string; members: { role: string; resp: string }[]; openedDate: string; targetCloseDate: string; }
interface D2 { title: string; summary: string; problemStatement: string; is: string[]; isNot: string[]; }
interface D3 { title: string; summary: string; actions: { no: number; action: string; responsible: string; targetDate: string; status: string }[]; containmentVerification: string; }
interface D4 { title: string; summary: string; occurrenceRootCause: { label: string; whys: string[] }; escapeRootCause: { label: string; whys: string[] }; fishbone: Record<string, string[]>; }
interface D5 { title: string; summary: string; actions: { action: string; responsible: string; targetDate: string; status: string }[]; selectionBasis: string; }
interface D6 { title: string; summary: string; implementationSteps: { step: number; action: string; responsible: string; targetDate: string }[]; effectivenessEvidence: string[]; }
interface D7 { title: string; summary: string; systemicActions: { no: number; action: string; responsible: string; targetDate: string; documentRef: string }[]; horizontalDeployment: string; lessonsLearned: string; }
interface D8 { title: string; summary: string; closureStatement: string; teamAcknowledgement: string[]; closureChecklist: { item: string; done: boolean }[]; reportRef: string; generatedAt: string; }

// -- Helpers -------------------------------------------------------------------
const SEV_COLOR: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-600 border-red-200',
  High:     'bg-orange-50 text-orange-600 border-orange-200',
  Medium:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  Low:      'bg-emerald-500/20 text-[#15803d] border-emerald-500/40',
};

const D_COLORS = [
  'border-blue-500 bg-blue-500',    // D1
  'border-indigo-500 bg-indigo-500', // D2
  'border-amber-500 bg-amber-500',  // D3
  'border-red-500 bg-red-500',      // D4
  'border-emerald-500 bg-emerald-500', // D5
  'border-teal-500 bg-teal-500',    // D6
  'border-purple-500 bg-purple-500',// D7
  'border-pink-500 bg-pink-500',    // D8
];

function Section({ d, color, children }: { d: number; color: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [borderCls, bgCls] = color.split(' ');
  return (
    <div className={`rounded-xl border ${borderCls}/40 bg-white overflow-hidden`} id={`d${d}`}>
      <button onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left`}>
        <span className={`${bgCls} text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>D{d}</span>
        <span className="font-bold text-slate-100 text-sm flex-1">{children}</span>
        <span className="text-[#1e3a5f] text-xs">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && <div className="px-5 pb-5 pt-1" />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-[#1e3a5f] font-medium min-w-[140px] flex-shrink-0">{label}:</span>
      <span className="text-[#1e3a5f]">{value}</span>
    </div>
  );
}

function Tag({ children, cls }: { children: React.ReactNode; cls?: string }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls ?? 'bg-[#f0f9ff] text-[#1e3a5f]'}`}>{children}</span>;
}

// -- 8D Section Renderers ------------------------------------------------------
function D1Section({ d }: { d: D1 }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1e3a5f]">{d.summary}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="Team Leader" value={d.teamLeader} />
        <InfoRow label="Opened Date" value={d.openedDate} />
        <InfoRow label="Target Close" value={d.targetCloseDate} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
            <tr>
              {['Role', 'Responsibility'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbeafe]">
            {d.members.map((m, i) => (
              <tr key={i} className="hover:bg-[#dbeafe]">
                <td className="px-3 py-2 font-semibold text-[#1d4ed8] whitespace-nowrap">{m.role}</td>
                <td className="px-3 py-2 text-[#1e3a5f]">{m.resp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function D2Section({ d }: { d: D2 }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-4">
        <p className="text-xs font-semibold text-amber-600 mb-1 uppercase tracking-wide">Problem Statement</p>
        <p className="text-sm text-amber-100">{d.problemStatement}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-[#15803d] uppercase tracking-wide mb-2">✅ IS (What is the problem)</p>
          <ul className="space-y-1.5">
            {d.is.map((item, i) => (
              <li key={i} className="text-xs text-[#1e3a5f] flex gap-2"><span className="text-[#15803d] mt-0.5">•</span>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">❌ IS NOT (What it is not)</p>
          <ul className="space-y-1.5">
            {d.isNot.map((item, i) => (
              <li key={i} className="text-xs text-[#1e3a5f] flex gap-2"><span className="text-red-600 mt-0.5">•</span>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function D3Section({ d }: { d: D3 }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1e3a5f]">{d.summary}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
            <tr>
              {['#', 'Containment Action', 'Responsible', 'Target Date', 'Status'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbeafe]">
            {d.actions.map((a) => (
              <tr key={a.no} className="hover:bg-[#dbeafe]">
                <td className="px-3 py-2 font-bold text-amber-600">{a.no}</td>
                <td className="px-3 py-2 text-[#1e3a5f]">{a.action}</td>
                <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.responsible}</td>
                <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.targetDate}</td>
                <td className="px-3 py-2"><Tag cls="bg-amber-500/20 text-amber-600">{a.status}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#1e3a5f] italic">{d.containmentVerification}</p>
    </div>
  );
}

function D4Section({ d }: { d: D4 }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#1e3a5f]">{d.summary}</p>
      {/* 5-Why dual chain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[d.occurrenceRootCause, d.escapeRootCause].map((chain, ci) => (
          <div key={ci} className={`rounded-lg border p-4 ${ci === 0 ? 'border-red-200 bg-red-50' : 'border-purple-500/30 bg-purple-950/20'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${ci === 0 ? 'text-red-600' : 'text-purple-300'}`}>{chain.label}</p>
            <div className="space-y-2">
              {chain.whys.map((w, wi) => (
                <div key={wi} className="flex gap-2 items-start">
                  <span className={`text-xs font-bold mt-0.5 flex-shrink-0 w-14 ${wi === chain.whys.length - 1 ? (ci === 0 ? 'text-red-600' : 'text-purple-400') : 'text-[#1e3a5f]'}`}>
                    {wi === chain.whys.length - 1 ? '🔴 ROOT' : `Why ${wi + 1}`}
                  </span>
                  <p className={`text-xs leading-relaxed ${wi === chain.whys.length - 1 ? (ci === 0 ? 'text-red-200 font-semibold' : 'text-purple-200 font-semibold') : 'text-[#1e3a5f]'}`}>{w}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Fishbone */}
      <div className="bg-[#eff6ff] rounded-lg border border-[#dbeafe] p-4">
        <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Fishbone — 6M Analysis</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(d.fishbone).map(([m, items]) => (
            <div key={m} className="rounded-lg bg-white border border-[#dbeafe] p-3">
              <p className="text-xs font-bold text-[#1d4ed8] mb-1.5">{m}</p>
              {items.map((it, ii) => (
                <p key={ii} className="text-xs text-[#1e3a5f] mb-1 flex gap-1"><span className="text-[#1e3a5f]">▸</span>{it}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function D5Section({ d }: { d: D5 }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1e3a5f]">{d.summary}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
            <tr>
              {['#', 'Corrective Action', 'Responsible', 'Target Date', 'Status'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbeafe]">
            {d.actions.map((a, i) => (
              <tr key={i} className="hover:bg-[#dbeafe]">
                <td className="px-3 py-2 font-bold text-[#15803d]">{i + 1}</td>
                <td className="px-3 py-2 text-[#1e3a5f]">{a.action}</td>
                <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.responsible}</td>
                <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.targetDate}</td>
                <td className="px-3 py-2"><Tag cls={a.status === 'Completed' ? 'bg-emerald-500/20 text-[#15803d]' : a.status === 'In Progress' ? 'bg-blue-500/20 text-[#1d4ed8]' : 'bg-[#f0f9ff] text-[#1e3a5f]'}>{a.status}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#1e3a5f] italic">{d.selectionBasis}</p>
    </div>
  );
}

function D6Section({ d }: { d: D6 }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1e3a5f]">{d.summary}</p>
      <div className="space-y-2">
        {d.implementationSteps.map((s) => (
          <div key={s.step} className="flex gap-3 items-start bg-[#eff6ff] rounded-lg border border-[#dbeafe] p-3">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
            <div className="flex-1">
              <p className="text-xs text-[#1e3a5f]">{s.action}</p>
              <p className="text-xs text-[#1e3a5f] mt-0.5">{s.responsible} — {s.targetDate}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-teal-950/30 border border-teal-500/30 rounded-lg p-4">
        <p className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-2">Effectiveness Evidence Required</p>
        {d.effectivenessEvidence.map((e, i) => (
          <p key={i} className="text-xs text-[#1e3a5f] flex gap-2 mb-1"><span className="text-teal-400">✓</span>{e}</p>
        ))}
      </div>
    </div>
  );
}

function D7Section({ d }: { d: D7 }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1e3a5f]">{d.summary}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
            <tr>
              {['#', 'Preventive Action', 'Responsible', 'Target Date', 'Document'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbeafe]">
            {d.systemicActions.map((a) => (
              <tr key={a.no} className="hover:bg-[#dbeafe]">
                <td className="px-3 py-2 font-bold text-purple-400">{a.no}</td>
                <td className="px-3 py-2 text-[#1e3a5f]">{a.action}</td>
                <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.responsible}</td>
                <td className="px-3 py-2 text-[#1e3a5f] whitespace-nowrap">{a.targetDate}</td>
                <td className="px-3 py-2 text-[#1d4ed8] whitespace-nowrap">{a.documentRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-purple-950/30 border border-purple-500/30 rounded-lg p-4 space-y-2">
        <p className="text-xs font-bold text-purple-400 uppercase tracking-wide">Horizontal Deployment</p>
        <p className="text-xs text-[#1e3a5f]">{d.horizontalDeployment}</p>
      </div>
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-4">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Lessons Learned Summary</p>
        <p className="text-xs text-[#1e3a5f]">{d.lessonsLearned}</p>
      </div>
    </div>
  );
}

function D8Section({ d, onToggleItem }: { d: D8; onToggleItem: (i: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-pink-950/30 border border-pink-500/30 rounded-lg p-4">
        <p className="text-xs font-bold text-pink-400 uppercase tracking-wide mb-1">Closure Statement</p>
        <p className="text-sm text-[#1e3a5f]">{d.closureStatement}</p>
      </div>
      <div>
        <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">Closure Checklist</p>
        <div className="space-y-2">
          {d.closureChecklist.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <div onClick={() => onToggleItem(i)}
                className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-[#dbeafe] bg-transparent'}`}>
                {item.done && <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white"><path d="M1 5l3 4L11 1"/></svg>}
              </div>
              <span className={`text-xs ${item.done ? 'line-through text-[#1e3a5f]' : 'text-[#1e3a5f] group-hover:text-slate-100'}`}>{item.item}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">Team Recognition</p>
        <div className="flex flex-wrap gap-2">
          {d.teamAcknowledgement.map((role, i) => (
            <span key={i} className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full text-xs text-pink-300">{role}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function EightDPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState<EightDReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [closureChecklist, setClosureChecklist] = useState<boolean[]>([]);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/complaints')
      .then(r => r.json())
      .then((data: Complaint[]) => {
        setComplaints(Array.isArray(data) ? data.filter(c => c.status !== 'Cancelled') : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function generate() {
    if (!selectedId) return;
    setGenerating(true);
    setReport(null);
    try {
      const res = await fetch(`/api/8d-generator?id=${selectedId}`);
      const data: EightDReport = await res.json();
      setReport(data);
      setClosureChecklist(data.disciplines.d8.closureChecklist.map(() => false));
    } finally {
      setGenerating(false);
    }
  }

  function toggleChecklistItem(i: number) {
    setClosureChecklist(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  }

  function buildPlainText(): string {
    if (!report) return '';
    const { complaint: c, disciplines: d } = report;
    const lines: string[] = [
      `8D REPORT — ${c.complaint_number}`,
      `Customer: ${c.customer} | Part: ${c.part_name} (${c.part_number})`,
      `Defect: ${c.defect_category} | Severity: ${c.severity} | Qty: ${c.quantity_affected} | PPM: ${c.ppm}`,
      `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
      `IATF Reference: ${report.iatfRef}`,
      '', '-'.repeat(60),
      '',
      `D1 — TEAM`,
      `Leader: ${d.d1.teamLeader}`,
      d.d1.members.map(m => `  ${m.role}: ${m.resp}`).join('\n'),
      '',
      `D2 — PROBLEM DESCRIPTION`,
      d.d2.problemStatement,
      '',
      `D3 — CONTAINMENT`,
      d.d3.actions.map(a => `  ${a.no}. ${a.action} (${a.responsible} — ${a.targetDate})`).join('\n'),
      '',
      `D4 — ROOT CAUSE`,
      `Occurrence: ${d.d4.occurrenceRootCause.whys.at(-1)}`,
      `Escape: ${d.d4.escapeRootCause.whys.at(-1)}`,
      '',
      `D5 — CORRECTIVE ACTIONS`,
      d.d5.actions.map((a, i) => `  ${i + 1}. ${a.action} (${a.responsible} — ${a.targetDate})`).join('\n'),
      '',
      `D6 — IMPLEMENTATION`,
      d.d6.implementationSteps.map(s => `  Step ${s.step}: ${s.action}`).join('\n'),
      '',
      `D7 — PREVENT RECURRENCE`,
      d.d7.systemicActions.map(a => `  ${a.no}. ${a.action}`).join('\n'),
      `Lessons Learned: ${d.d7.lessonsLearned}`,
      '',
      `D8 — TEAM RECOGNITION`,
      d.d8.closureStatement,
    ];
    return lines.join('\n');
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildPlainText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function printReport() {
    window.print();
  }

  const disciplines = report ? [
    { key: 'd1', data: report.disciplines.d1 },
    { key: 'd2', data: report.disciplines.d2 },
    { key: 'd3', data: report.disciplines.d3 },
    { key: 'd4', data: report.disciplines.d4 },
    { key: 'd5', data: report.disciplines.d5 },
    { key: 'd6', data: report.disciplines.d6 },
    { key: 'd7', data: report.disciplines.d7 },
    { key: 'd8', data: report.disciplines.d8 },
  ] : [];

  const doneCount = closureChecklist.filter(Boolean).length;
  const totalChecks = closureChecklist.length;

  return (
    <div className="bg-[#eff6ff] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] sticky top-0 z-20 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#1e3a5f] hover:text-[#1e3a5f] text-sm">← Dashboard</Link>
            <span className="text-slate-700">|</span>
            <h1 className="text-white font-bold text-lg">AI 8D Report Generator</h1>
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-600 text-xs font-bold">AI</span>
            <span className="px-2 py-0.5 bg-blue-500/20 border border-[#bfdbfe] rounded text-[#1d4ed8] text-xs">IATF 10.2.3</span>
          </div>
          {report && (
            <div className="flex gap-2">
              <button onClick={copyReport}
                className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-xs rounded font-medium transition">
                {copied ? '✅ Copied' : '📋 Copy Report'}
              </button>
              <button onClick={printReport}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition">
                🖨️ Print / PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Selector Card */}
        <div className="bg-white rounded-xl border border-[#dbeafe] p-5 print:hidden">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide mb-2 block">Select Complaint to Generate 8D Report</label>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                className="w-full bg-[#eff6ff] border border-[#dbeafe] text-[#1e3a5f] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select a complaint —</option>
                {complaints.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.complaint_number} | {c.customer_name ?? c.customer} | {c.part_name} | {c.severity} | {c.defect_category}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={generate} disabled={!selectedId || generating}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition whitespace-nowrap">
              {generating ? '⚙️ Generating...' : '⚡ Generate 8D Report'}
            </button>
            <button
              onClick={() => window.print()}
              className="no-print px-4 py-2.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-white text-sm font-semibold rounded-lg transition whitespace-nowrap"
              title="Print this 8D report">
              🖨 Print 8D
            </button>
          </div>
          <p className="text-xs text-[#1e3a5f] mt-3">
            Generates a complete D1–D8 problem solving report using live complaint data, CAPA actions, and AI domain knowledge.
            Aligned with <span className="text-amber-600">IATF 16949 Cl. 10.2.3</span>.
          </p>
        </div>

        {/* Loading */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#bfdbfe] border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[#1e3a5f] text-sm">Analysing complaint data and generating 8D report...</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {['D1 Team','D2 Problem','D3 Containment','D4 Root Cause','D5 CA','D6 Validate','D7 Prevent','D8 Close'].map((d, i) => (
                <span key={i} className="px-2 py-1 bg-[#f0f9ff] border border-[#dbeafe] rounded text-xs text-[#1e3a5f]">{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Report */}
        {report && !generating && (
          <div ref={printRef} className="space-y-4">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-[#bfdbfe] rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">8D Problem Solving Report</h2>
                      <p className="text-sm text-[#1d4ed8]">{report.complaint.complaint_number} — {report.iatfRef}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-[#1e3a5f] mt-3">
                    <span><span className="text-[#1e3a5f]">Customer:</span> {report.complaint.customer}</span>
                    <span><span className="text-[#1e3a5f]">Part:</span> {report.complaint.part_name}</span>
                    <span><span className="text-[#1e3a5f]">Part No:</span> {report.complaint.part_number}</span>
                    <span><span className="text-[#1e3a5f]">Defect:</span> {report.complaint.defect_category}</span>
                    <span><span className="text-[#1e3a5f]">Generated:</span> {new Date(report.generatedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${SEV_COLOR[report.complaint.severity] ?? 'bg-[#f0f9ff] text-[#1e3a5f] border-[#dbeafe]'}`}>
                    {report.complaint.severity}
                  </span>
                  {report.complaint.ppm > 0 && (
                    <span className="text-xs text-[#1e3a5f]">{report.complaint.ppm.toLocaleString()} PPM</span>
                  )}
                  <span className="text-xs text-[#1e3a5f]">Age: {report.complaint.age_days} days</span>
                </div>
              </div>
            </div>

            {/* D8 Progress */}
            {totalChecks > 0 && (
              <div className="bg-white border border-[#dbeafe] rounded-xl p-4 flex items-center gap-4 print:hidden">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#1e3a5f] font-medium">8D Closure Progress</span>
                    <span className="text-[#1e3a5f] font-bold">{doneCount}/{totalChecks} steps complete</span>
                  </div>
                  <div className="w-full bg-[#f0f9ff] rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{width:`${Math.round(doneCount/totalChecks*100)}%`}} />
                  </div>
                </div>
                <span className={`text-sm font-bold ${doneCount === totalChecks ? 'text-[#15803d]' : 'text-amber-600'}`}>
                  {doneCount === totalChecks ? '✅ Ready to Close' : `${Math.round(doneCount/totalChecks*100)}%`}
                </span>
              </div>
            )}

            {/* Navigation pills */}
            <div className="flex flex-wrap gap-2 print:hidden">
              {disciplines.map((disc, i) => (
                <a key={disc.key} href={`#${disc.key}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
                  style={{ backgroundColor: `${['#1e40af','#3730a3','#92400e','#7f1d1d','#064e3b','#134e4a','#4c1d95','#831843'][i]}40`, color: ['#93c5fd','#a5b4fc','#fcd34d','#fca5a5','#6ee7b7','#5eead4','#c4b5fd','#f9a8d4'][i], border: `1px solid ${['#3b82f6','#6366f1','#f59e0b','#ef4444','#10b981','#14b8a6','#8b5cf6','#ec4899'][i]}40` }}>
                  D{i + 1}
                </a>
              ))}
            </div>

            {/* Discipline Sections */}
            {disciplines.map((disc, i) => {
              const color = D_COLORS[i] ?? 'border-[#dbeafe] bg-slate-500';
              const [borderCls, bgCls] = color.split(' ');
              return (
                <div key={disc.key} id={disc.key}
                  className={`rounded-xl border ${borderCls}/40 bg-white overflow-hidden`}>
                  <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${borderCls}/30`}>
                    <span className={`${bgCls} text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>D{i + 1}</span>
                    <span className="font-bold text-slate-100 text-sm">{(disc.data as { title: string }).title}</span>
                  </div>
                  <div className="px-5 py-4">
                    {i === 0 && <D1Section d={disc.data as D1} />}
                    {i === 1 && <D2Section d={disc.data as D2} />}
                    {i === 2 && <D3Section d={disc.data as D3} />}
                    {i === 3 && <D4Section d={disc.data as D4} />}
                    {i === 4 && <D5Section d={disc.data as D5} />}
                    {i === 5 && <D6Section d={disc.data as D6} />}
                    {i === 6 && <D7Section d={disc.data as D7} />}
                    {i === 7 && (
                      <D8Section
                        d={{ ...(disc.data as D8), closureChecklist: (disc.data as D8).closureChecklist.map((item, ci) => ({ ...item, done: closureChecklist[ci] ?? item.done })) }}
                        onToggleItem={toggleChecklistItem}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bottom action bar */}
            <div className="flex flex-wrap gap-3 justify-center py-2 print:hidden">
              <Link href={`/complaints/${report.complaint.id}`}
                className="px-5 py-2.5 bg-[#f0f9ff] hover:bg-[#dbeafe] text-[#1e3a5f] text-sm font-medium rounded-lg transition">
                View Complaint →
              </Link>
              <Link href="/capa"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                Open CAPA Register →
              </Link>
              <button onClick={copyReport}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">
                {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!report && !generating && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="text-6xl">📋</span>
            <h3 className="text-xl font-bold text-[#1e3a5f]">8D Report Generator</h3>
            <p className="text-[#1e3a5f] text-sm text-center max-w-md">
              Select a complaint above and click Generate to create a complete D1–D8 problem solving report.
              The AI analyses your live data, defect type, and CAPA actions to build a fully structured 8D.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['D1 Team','D2 Problem Description','D3 Containment','D4 Root Cause','D5 Corrective Actions','D6 Validate','D7 Prevent Recurrence','D8 Recognition'].map((d, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-[#dbeafe] rounded-lg text-xs text-[#1e3a5f]">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
