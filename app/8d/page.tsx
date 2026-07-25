'use client';
import { useState } from 'react';

const uid = () => Math.random().toString(36).slice(2, 9);

interface Member { id: string; name: string; dept: string; role: string; }
interface Action { id: string; action: string; owner: string; due: string; status: string; }
interface Why { id: string; why: string; answer: string; }
interface D5Act { id: string; action: string; owner: string; due: string; verification: string; }
interface D7Act { id: string; action: string; type: string; owner: string; due: string; }
interface Fish { man: string; machine: string; material: string; method: string; measurement: string; environment: string; }

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 rounded-lg border border-gray-700 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-4 py-2 text-sm font-bold text-white ${color}`}>
        <span>{title}</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 bg-gray-900">{children}</div>}
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text' }: { label?: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
    </div>
  );
}

function TA({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 resize-y" />
    </div>
  );
}

export default function EightDPage() {
  const [hdr, setHdr] = useState({ reportNo: '', customer: '', partName: '', partNo: '', dateOpened: new Date().toISOString().slice(0,10), dateClosed: '', teamLeader: '' });
  const sh = (k: string, v: string) => setHdr(h => ({ ...h, [k]: v }));

  const [d0s, setD0s] = useState('');
  const [d0e, setD0e] = useState('');

  const [members, setMembers] = useState<Member[]>([{ id: uid(), name: '', dept: '', role: 'Team Leader' }]);
  const addMem = () => setMembers(m => [...m, { id: uid(), name: '', dept: '', role: '' }]);
  const delMem = (id: string) => setMembers(m => m.filter(x => x.id !== id));
  const updMem = (id: string, k: keyof Member, v: string) => setMembers(m => m.map(x => x.id === id ? { ...x, [k]: v } : x));

  const [d2, setD2] = useState({ what: '', where: '', when: '', who: '', howMany: '', howDetected: '' });
  const sd2 = (k: string, v: string) => setD2(d => ({ ...d, [k]: v }));

  const [d3, setD3] = useState<Action[]>([{ id: uid(), action: '', owner: '', due: '', status: 'Open' }]);
  const addD3 = () => setD3(a => [...a, { id: uid(), action: '', owner: '', due: '', status: 'Open' }]);
  const delD3 = (id: string) => setD3(a => a.filter(x => x.id !== id));
  const updD3 = (id: string, k: keyof Action, v: string) => setD3(a => a.map(x => x.id === id ? { ...x, [k]: v } : x));

  const [fish, setFish] = useState<Fish>({ man: '', machine: '', material: '', method: '', measurement: '', environment: '' });
  const sf = (k: keyof Fish, v: string) => setFish(f => ({ ...f, [k]: v }));
  const [whys, setWhys] = useState<Why[]>(Array.from({ length: 5 }, (_, i) => ({ id: uid(), why: `Why ${i+1}`, answer: '' })));
  const updWhy = (id: string, v: string) => setWhys(w => w.map(x => x.id === id ? { ...x, answer: v } : x));
  const [rootCause, setRootCause] = useState('');

  const [d5, setD5] = useState<D5Act[]>([{ id: uid(), action: '', owner: '', due: '', verification: '' }]);
  const addD5 = () => setD5(a => [...a, { id: uid(), action: '', owner: '', due: '', verification: '' }]);
  const delD5 = (id: string) => setD5(a => a.filter(x => x.id !== id));
  const updD5 = (id: string, k: keyof D5Act, v: string) => setD5(a => a.map(x => x.id === id ? { ...x, [k]: v } : x));

  const [d6, setD6] = useState<Action[]>([{ id: uid(), action: '', owner: '', due: '', status: 'Open' }]);
  const addD6 = () => setD6(a => [...a, { id: uid(), action: '', owner: '', due: '', status: 'Open' }]);
  const delD6 = (id: string) => setD6(a => a.filter(x => x.id !== id));
  const updD6 = (id: string, k: keyof Action, v: string) => setD6(a => a.map(x => x.id === id ? { ...x, [k]: v } : x));

  const [d7, setD7] = useState<D7Act[]>([{ id: uid(), action: '', type: 'Process', owner: '', due: '' }]);
  const addD7 = () => setD7(a => [...a, { id: uid(), action: '', type: 'Process', owner: '', due: '' }]);
  const delD7 = (id: string) => setD7(a => a.filter(x => x.id !== id));
  const updD7 = (id: string, k: keyof D7Act, v: string) => setD7(a => a.map(x => x.id === id ? { ...x, [k]: v } : x));

  const [d8l, setD8l] = useState('');
  const [d8r, setD8r] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const saveDB = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/8d', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hdr, d0: { symptoms: d0s, era: d0e }, d1: members, d2, d3, d4: { fish, whys, rootCause }, d5, d6, d7, d8: { lessons: d8l, recognition: d8r } })
      });
      setMsg(res.ok ? 'Saved to QMOS database' : 'Save failed');
    } catch { setMsg('Save error'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const exportExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const rows: any[] = [
      ['8D PROBLEM SOLVING REPORT'],
      ['Report No:', hdr.reportNo, 'Customer:', hdr.customer, 'Part Name:', hdr.partName],
      ['Part No:', hdr.partNo, 'Team Leader:', hdr.teamLeader, 'Date Opened:', hdr.dateOpened],
      [],
      ['D0 - SYMPTOMS & ERA'],
      ['Symptoms:', d0s],
      ['Emergency Response Action:', d0e],
      [],
      ['D1 - TEAM'],
      ['Name', 'Department', 'Role'],
      ...members.map(m => [m.name, m.dept, m.role]),
      [],
      ['D2 - PROBLEM DESCRIPTION'],
      ['What:', d2.what], ['Where:', d2.where], ['When:', d2.when],
      ['Who:', d2.who], ['How Many:', d2.howMany], ['How Detected:', d2.howDetected],
      [],
      ['D3 - INTERIM CONTAINMENT ACTIONS'],
      ['Action', 'Owner', 'Due Date', 'Status'],
      ...d3.map(a => [a.action, a.owner, a.due, a.status]),
      [],
      ['D4 - ROOT CAUSE ANALYSIS - FISHBONE (6M)'],
      ['Man:', fish.man], ['Machine:', fish.machine], ['Material:', fish.material],
      ['Method:', fish.method], ['Measurement:', fish.measurement], ['Environment:', fish.environment],
      [],
      ['5-Why Analysis'],
      ...whys.map((w, i) => [`Why ${i+1}:`, w.answer]),
      ['Root Cause:', rootCause],
      [],
      ['D5 - PERMANENT CORRECTIVE ACTIONS'],
      ['Action', 'Owner', 'Due Date', 'Verification'],
      ...d5.map(a => [a.action, a.owner, a.due, a.verification]),
      [],
      ['D6 - IMPLEMENTATION & VALIDATION'],
      ['Action', 'Owner', 'Due Date', 'Status'],
      ...d6.map(a => [a.action, a.owner, a.due, a.status]),
      [],
      ['D7 - PREVENT RECURRENCE'],
      ['Action', 'Type', 'Owner', 'Due Date'],
      ...d7.map(a => [a.action, a.type, a.owner, a.due]),
      [],
      ['D8 - TEAM RECOGNITION & CLOSURE'],
      ['Lessons Learned:', d8l],
      ['Team Recognition:', d8r],
    ];
    const ws = xlsx.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 24 }, { wch: 36 }, { wch: 24 }, { wch: 36 }, { wch: 24 }, { wch: 36 }];
    xlsx.utils.book_append_sheet(wb, ws, '8D Report');
    xlsx.writeFile(wb, `8D_${hdr.reportNo || 'report'}.xlsx`);
  };

  const th = 'px-2 py-1.5 border border-gray-600 text-left text-xs font-semibold bg-gray-800';
  const td = 'border border-gray-700 px-1 py-0.5';
  const ci = 'bg-transparent w-full text-sm text-gray-200 focus:outline-none';

  return (
    <div className="p-4 min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">8D Problem Solving Report</h1>
          <p className="text-gray-400 text-sm">Eight Disciplines — Automotive Quality Standard</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm">⬇ Excel</button>
          <button onClick={saveDB} disabled={saving} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-sm disabled:opacity-50">
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>
      {msg && <div className="mb-3 px-3 py-2 bg-green-800 text-green-200 rounded text-sm">{msg}</div>}

      <div className="bg-gray-900 rounded-lg p-4 mb-3 border border-gray-700">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">Report Header</h2>
        <div className="grid grid-cols-3 gap-3">
          <Inp label="Report No." value={hdr.reportNo} onChange={v => sh('reportNo', v)} />
          <Inp label="Customer" value={hdr.customer} onChange={v => sh('customer', v)} />
          <Inp label="Part Name" value={hdr.partName} onChange={v => sh('partName', v)} />
          <Inp label="Part No." value={hdr.partNo} onChange={v => sh('partNo', v)} />
          <Inp label="Team Leader" value={hdr.teamLeader} onChange={v => sh('teamLeader', v)} />
          <Inp label="Date Opened" type="date" value={hdr.dateOpened} onChange={v => sh('dateOpened', v)} />
          <Inp label="Date Closed" type="date" value={hdr.dateClosed} onChange={v => sh('dateClosed', v)} />
        </div>
      </div>

      <Section title="D0 — Symptoms & Emergency Response Action" color="bg-red-900">
        <div className="grid grid-cols-1 gap-3">
          <TA label="Symptoms / Problem Statement" value={d0s} onChange={setD0s} />
          <TA label="Emergency Response Action (ERA)" value={d0e} onChange={setD0e} />
        </div>
      </Section>

      <Section title="D1 — Team Formation" color="bg-orange-900">
        <table className="w-full text-xs border-collapse mb-2">
          <thead><tr><th className={th}>Name</th><th className={th}>Department</th><th className={th}>Role</th><th className="px-2 py-1.5 border border-gray-600 w-10 bg-gray-800">Del</th></tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td className={td}><input className={ci} value={m.name} onChange={e => updMem(m.id, 'name', e.target.value)} placeholder="Full name" /></td>
                <td className={td}><input className={ci} value={m.dept} onChange={e => updMem(m.id, 'dept', e.target.value)} placeholder="Department" /></td>
                <td className={td}><input className={ci} value={m.role} onChange={e => updMem(m.id, 'role', e.target.value)} placeholder="Role" /></td>
                <td className={td + ' text-center'}><button onClick={() => delMem(m.id)} className="text-red-500 hover:text-red-300">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addMem} className="px-3 py-1 bg-orange-800 hover:bg-orange-700 rounded text-xs">+ Add Member</button>
      </Section>

      <Section title="D2 — Problem Description (Is / Is Not)" color="bg-yellow-900">
        <div className="grid grid-cols-2 gap-3">
          <TA label="What is the problem?" value={d2.what} onChange={v => sd2('what', v)} />
          <TA label="Where is it occurring?" value={d2.where} onChange={v => sd2('where', v)} />
          <TA label="When was it first detected?" value={d2.when} onChange={v => sd2('when', v)} />
          <TA label="Who detected / is affected?" value={d2.who} onChange={v => sd2('who', v)} />
          <TA label="How many / extent?" value={d2.howMany} onChange={v => sd2('howMany', v)} />
          <TA label="How was it detected?" value={d2.howDetected} onChange={v => sd2('howDetected', v)} />
        </div>
      </Section>

      <Section title="D3 — Interim Containment Actions" color="bg-lime-900">
        <table className="w-full text-xs border-collapse mb-2">
          <thead><tr><th className={th}>Containment Action</th><th className={th + ' w-28'}>Owner</th><th className={th + ' w-28'}>Due Date</th><th className={th + ' w-24'}>Status</th><th className="px-2 py-1.5 border border-gray-600 w-10 bg-gray-800">Del</th></tr></thead>
          <tbody>
            {d3.map(a => (
              <tr key={a.id}>
                <td className={td}><input className={ci} value={a.action} onChange={e => updD3(a.id, 'action', e.target.value)} placeholder="Action…" /></td>
                <td className={td}><input className={ci} value={a.owner} onChange={e => updD3(a.id, 'owner', e.target.value)} placeholder="Owner" /></td>
                <td className={td}><input className={ci + ' text-center'} type="date" value={a.due} onChange={e => updD3(a.id, 'due', e.target.value)} /></td>
                <td className={td}><select value={a.status} onChange={e => updD3(a.id, 'status', e.target.value)} className="bg-transparent w-full text-sm text-gray-200 focus:outline-none"><option>Open</option><option>In Progress</option><option>Closed</option></select></td>
                <td className={td + ' text-center'}><button onClick={() => delD3(a.id)} className="text-red-500 hover:text-red-300">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addD3} className="px-3 py-1 bg-lime-800 hover:bg-lime-700 rounded text-xs">+ Add Action</button>
      </Section>

      <Section title="D4 — Root Cause Analysis (Fishbone + 5-Why)" color="bg-teal-900">
        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Fishbone — 6M Categories</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(['man','machine','material','method','measurement','environment'] as (keyof Fish)[]).map(k => (
            <div key={k}>
              <label className="block text-xs text-gray-500 mb-1">{k === 'man' ? 'Man (People)' : k.charAt(0).toUpperCase() + k.slice(1)}</label>
              <textarea value={fish[k]} onChange={e => sf(k, e.target.value)} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">5-Why Analysis</p>
        <div className="space-y-2 mb-3">
          {whys.map((w, i) => (
            <div key={w.id} className="flex items-center gap-2">
              <span className="text-xs text-yellow-400 w-14 shrink-0 font-semibold">Why {i+1}:</span>
              <input value={w.answer} onChange={e => updWhy(w.id, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder={i === 0 ? 'Why did the problem occur?' : 'Because…'} />
            </div>
          ))}
        </div>
        <TA label="Verified Root Cause" value={rootCause} onChange={setRootCause} />
      </Section>

      <Section title="D5 — Permanent Corrective Actions" color="bg-blue-900">
        <table className="w-full text-xs border-collapse mb-2">
          <thead><tr><th className={th}>Corrective Action</th><th className={th + ' w-28'}>Owner</th><th className={th + ' w-28'}>Due Date</th><th className={th + ' w-40'}>Verification</th><th className="px-2 py-1.5 border border-gray-600 w-10 bg-gray-800">Del</th></tr></thead>
          <tbody>
            {d5.map(a => (
              <tr key={a.id}>
                <td className={td}><input className={ci} value={a.action} onChange={e => updD5(a.id, 'action', e.target.value)} placeholder="Action…" /></td>
                <td className={td}><input className={ci} value={a.owner} onChange={e => updD5(a.id, 'owner', e.target.value)} placeholder="Owner" /></td>
                <td className={td}><input className={ci + ' text-center'} type="date" value={a.due} onChange={e => updD5(a.id, 'due', e.target.value)} /></td>
                <td className={td}><input className={ci} value={a.verification} onChange={e => updD5(a.id, 'verification', e.target.value)} placeholder="Verification method…" /></td>
                <td className={td + ' text-center'}><button onClick={() => delD5(a.id)} className="text-red-500 hover:text-red-300">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addD5} className="px-3 py-1 bg-blue-800 hover:bg-blue-700 rounded text-xs">+ Add Action</button>
      </Section>

      <Section title="D6 — Implementation & Validation" color="bg-indigo-900">
        <table className="w-full text-xs border-collapse mb-2">
          <thead><tr><th className={th}>Implementation Action</th><th className={th + ' w-28'}>Owner</th><th className={th + ' w-28'}>Due Date</th><th className={th + ' w-28'}>Status</th><th className="px-2 py-1.5 border border-gray-600 w-10 bg-gray-800">Del</th></tr></thead>
          <tbody>
            {d6.map(a => (
              <tr key={a.id}>
                <td className={td}><input className={ci} value={a.action} onChange={e => updD6(a.id, 'action', e.target.value)} placeholder="Action…" /></td>
                <td className={td}><input className={ci} value={a.owner} onChange={e => updD6(a.id, 'owner', e.target.value)} placeholder="Owner" /></td>
                <td className={td}><input className={ci + ' text-center'} type="date" value={a.due} onChange={e => updD6(a.id, 'due', e.target.value)} /></td>
                <td className={td}><select value={a.status} onChange={e => updD6(a.id, 'status', e.target.value)} className="bg-transparent w-full text-sm text-gray-200 focus:outline-none"><option>Open</option><option>In Progress</option><option>Validated</option><option>Closed</option></select></td>
                <td className={td + ' text-center'}><button onClick={() => delD6(a.id)} className="text-red-500 hover:text-red-300">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addD6} className="px-3 py-1 bg-indigo-800 hover:bg-indigo-700 rounded text-xs">+ Add Action</button>
      </Section>

      <Section title="D7 — Prevent Recurrence" color="bg-violet-900">
        <table className="w-full text-xs border-collapse mb-2">
          <thead><tr><th className={th}>Preventive Action</th><th className={th + ' w-36'}>Type</th><th className={th + ' w-28'}>Owner</th><th className={th + ' w-28'}>Due Date</th><th className="px-2 py-1.5 border border-gray-600 w-10 bg-gray-800">Del</th></tr></thead>
          <tbody>
            {d7.map(a => (
              <tr key={a.id}>
                <td className={td}><input className={ci} value={a.action} onChange={e => updD7(a.id, 'action', e.target.value)} placeholder="Action…" /></td>
                <td className={td}>
                  <select value={a.type} onChange={e => updD7(a.id, 'type', e.target.value)} className="bg-transparent w-full text-sm text-gray-200 focus:outline-none">
                    <option>Process</option><option>FMEA</option><option>Control Plan</option><option>Training</option><option>Design</option><option>System</option>
                  </select>
                </td>
                <td className={td}><input className={ci} value={a.owner} onChange={e => updD7(a.id, 'owner', e.target.value)} placeholder="Owner" /></td>
                <td className={td}><input className={ci + ' text-center'} type="date" value={a.due} onChange={e => updD7(a.id, 'due', e.target.value)} /></td>
                <td className={td + ' text-center'}><button onClick={() => delD7(a.id)} className="text-red-500 hover:text-red-300">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addD7} className="px-3 py-1 bg-violet-800 hover:bg-violet-700 rounded text-xs">+ Add Action</button>
      </Section>

      <Section title="D8 — Team Recognition & Closure" color="bg-pink-900">
        <div className="grid grid-cols-1 gap-3">
          <TA label="Lessons Learned" value={d8l} onChange={setD8l} />
          <TA label="Team Recognition & Congratulations" value={d8r} onChange={setD8r} />
        </div>
      </Section>
    </div>
  );
}
