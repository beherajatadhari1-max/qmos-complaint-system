'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  Critical: 'text-red-700 bg-red-50 border-red-200',
  High: 'text-orange-700 bg-orange-50 border-orange-200',
  Medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  Low: 'text-green-700 bg-green-50 border-green-200',
};
const STATUS_BADGE: Record<string, string> = {
  Open: 'bg-red-100 text-red-700',
  'Under Investigation': 'bg-orange-100 text-orange-700',
  'CAPA In Progress': 'bg-blue-100 text-blue-700',
  'Pending Verification': 'bg-purple-100 text-purple-700',
  'Pending Closure': 'bg-indigo-100 text-indigo-700',
  Closed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-gray-100 text-gray-600',
};
const CAPA_STATUS: Record<string, string> = {
  Open: 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-200 text-red-800',
  Verified: 'bg-emerald-100 text-emerald-700',
};

function isOverdue(targetDate: string, status: string) {
  if (!targetDate || status === 'Completed' || status === 'Verified') return false;
  return new Date(targetDate) < new Date();
}

export default function CapaPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [capaMap, setCapaMap] = useState<Record<string, CapaAction[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'open'|'overdue'|'completed'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/complaints')
      .then(r => r.json())
      .then(async (data: Complaint[]) => {
        setComplaints(data);
        // Load CAPA for complaints that have CAPA status
        const capaComplaints = data.filter(c =>
          ['CAPA In Progress','Pending Verification','Pending Closure','Closed'].includes(c.status)
        );
        const entries = await Promise.all(
          capaComplaints.map(c =>
            fetch(`/api/complaints/${c.id}/capa`)
              .then(r => r.json())
              .then(actions => [c.id, actions] as [string, CapaAction[]])
              .catch(() => [c.id, []] as [string, CapaAction[]])
          )
        );
        setCapaMap(Object.fromEntries(entries));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Flatten CAPA actions with complaint context
  const allCapaRows = complaints.flatMap(c => {
    const actions = capaMap[c.id] ?? [];
    return actions.map(a => ({ ...a, complaint: c }));
  });

  const filtered = allCapaRows.filter(row => {
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
  });

  // Stats
  const totalCapa = allCapaRows.length;
  const openCapa = allCapaRows.filter(r => !['Completed','Verified'].includes(r.status ?? '')).length;
  const overdueCapa = allCapaRows.filter(r => isOverdue(r.target_date, r.status ?? '')).length;
  const completedCapa = allCapaRows.filter(r => ['Completed','Verified'].includes(r.status ?? '')).length;

  // Complaints with no CAPA yet but need it
  const needsCapa = complaints.filter(c =>
    ['Under Investigation','CAPA In Progress'].includes(c.status) && !(capaMap[c.id]?.length)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">🔧</div>
        <p className="text-gray-500 font-medium">Loading CAPA data...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🔧 CAPA Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Corrective & Preventive Actions — track, verify, close</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon:'📋', label:'Total CAPA Actions', value: totalCapa, cls:'border-blue-200 text-blue-700' },
          { icon:'🔴', label:'Open / Pending', value: openCapa, cls:'border-red-200 text-red-600' },
          { icon:'⏰', label:'Overdue', value: overdueCapa, cls:'border-orange-200 text-orange-600' },
          { icon:'✅', label:'Completed', value: completedCapa, cls:'border-green-200 text-green-700' },
        ].map((k, i) => (
          <div key={i} className={`bg-white rounded-xl border-2 ${k.cls.split(' ')[0]} p-4 shadow-sm`}>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{k.icon} {k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.cls.split(' ')[1]}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue Alert */}
      {overdueCapa > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-800">{overdueCapa} CAPA action{overdueCapa > 1 ? 's' : ''} overdue!</p>
            <p className="text-sm text-red-600 mt-0.5">Target date has passed. Immediate review required. Use filter below to see them.</p>
          </div>
        </div>
      )}

      {/* Needs CAPA Alert */}
      {needsCapa.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-800 mb-2">📌 {needsCapa.length} complaint{needsCapa.length > 1 ? 's' : ''} need CAPA actions:</p>
          <div className="flex flex-wrap gap-2">
            {needsCapa.map(c => (
              <Link key={c.id} href={`/complaints/${c.id}`}
                className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-sm text-amber-800 hover:bg-amber-100 transition">
                {c.complaint_number} → {c.customer_name ?? c.customer}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([['all','All'],['open','Open'],['overdue','Overdue'],['completed','Completed']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${filter === id ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <input
          type="text" placeholder="Search complaint, customer, action, owner..."
          value={searchQ} onChange={e => setSearchQ(e.target.value)}
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <span className="text-sm text-gray-400">{filtered.length} actions</span>
      </div>

      {/* CAPA Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">No CAPA actions match this filter</p>
          {totalCapa === 0 && (
            <p className="text-gray-400 text-sm mt-2">Open a complaint and add CAPA actions from the complaint detail page.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Complaint','Customer','Severity','CAPA Type','Action Description','Responsible','Target Date','Status','Effectiveness',''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row, i) => {
                  const status = row.status || 'Open';
                  const overdue = isOverdue(row.target_date, status);
                  const effectiveStatus = overdue && !['Completed','Verified'].includes(status) ? 'Overdue' : status;
                  const capaType = row.type ?? row.action_type ?? '—';
                  const actionText = row.action ?? row.action_description ?? '—';
                  const custName = row.complaint?.customer_name ?? row.complaint?.customer ?? '—';
                  return (
                    <tr key={`${row.complaint_id}-${row.id}`} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <Link href={`/complaints/${row.complaint_id}`} className="font-mono text-blue-700 font-semibold hover:underline text-xs">
                          {row.complaint?.complaint_number ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{custName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_TEXT[row.complaint?.severity ?? ''] ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                          {row.complaint?.severity ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${capaType === 'Corrective' ? 'bg-blue-100 text-blue-700' : capaType === 'Preventive' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {capaType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        <p className="truncate" title={actionText}>{actionText}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.responsible || '—'}</td>
                      <td className={`px-4 py-3 whitespace-nowrap font-medium ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {row.target_date ? `${row.target_date.slice(0,10)}${overdue ? ' ⚠️' : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CAPA_STATUS[effectiveStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{row.effectiveness || '—'}</td>
                      <td className="px-4 py-3">
                        <Link href={`/complaints/${row.complaint_id}`}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAPA Process Guide */}
      <div className="bg-blue-950 rounded-xl p-5 text-white">
        <h3 className="font-semibold mb-3">📘 CAPA Process — Quick Reference (IATF 16949 Clause 10.2)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          {[
            { step:'1️⃣ Containment', desc:'Stop defects reaching customer. 24-hour response.' },
            { step:'2️⃣ Root Cause', desc:'5-Why + Fishbone. Both Occurrence & Escape cause.' },
            { step:'3️⃣ CAPA Action', desc:'Corrective = fix root cause. Preventive = stop recurrence.' },
            { step:'4️⃣ Effectiveness', desc:'Verify after 60–90 days. Update PFMEA + Control Plan.' },
          ].map((s, i) => (
            <div key={i} className="bg-blue-900/50 rounded-lg p-3">
              <p className="font-semibold text-blue-300">{s.step}</p>
              <p className="text-blue-200 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
