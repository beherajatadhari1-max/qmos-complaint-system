'use client';
import { useState } from 'react';

const uid = () => Math.random().toString(36).slice(2, 9);
interface TeamMember { id: string; name: string; title: string; phone: string; email: string; }
interface DocUpdate { doc: string; owner: string; date: string; }
interface OtherFacility { id: string; name: string; partNo: string; caOwner: string; dueDate: string; }

function Section({ num, title, color, children }: { num: string; title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 rounded-lg border border-gray-700 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-4 py-2 text-sm font-bold text-white ${color}`}>
        <span>{num}. {title}</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 bg-gray-900">{children}</div>}
    </div>
  );
}

function TA({ label, value, onChange, rows = 3 }: { label?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-400 mb-1 font-semibold">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-y" />
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', placeholder = '' }: { label?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-400 mb-1 font-semibold">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" />
    </div>
  );
}

const DOC_LIST = ['DFMEA', 'PFMEA', 'Control Plan', 'Process Flow', 'Operation Instructions', 'Drawing', 'Design Standards'];

export default function EightDPage() {
  const [hdr, setHdr] = useState({ customer: '', program: '', product: '', issueNo: '', dateIssue: '', date4D: '', date8D: '', dateClosed: '' });
  const sh = (k: string, v: string) => setHdr(h => ({ ...h, [k]: v }));

  const [champion, setChampion] = useState({ name: '', title: '', phone: '', email: '' });
  const sc = (k: string, v: string) => setChampion(c => ({ ...c, [k]: v }));

  const [members, setMembers] = useState<TeamMember[]>([{ id: uid(), name: '', title: '', phone: '', email: '' }]);
  const addMem = () => setMembers(m => [...m, { id: uid(), name: '', title: '', phone: '', email: '' }]);
  const delMem = (id: string) => setMembers(m => m.filter(x => x.id !== id));
  const updMem = (id: string, k: keyof TeamMember, v: string) => setMembers(m => m.map(x => x.id === id ? { ...x, [k]: v } : x));

  const [d2desc, setD2desc] = useState('');
  const [d2impact, setD2impact] = useState('');
  const [d2facilities, setD2facilities] = useState('');

  const [d3actions, setD3actions] = useState('');
  const [d3otherRisk, setD3otherRisk] = useState('');
  const [d3certId, setD3certId] = useState('');
  const [d3sortingResult, setD3sortingResult] = useState('');
  const [d3sorted, setD3sorted] = useState('');
  const [d3defect, setD3defect] = useState('');
  const [d3startDate, setD3startDate] = useState('');

  const [d4whyMade, setD4whyMade] = useState('');
  const [d4whyShipped, setD4whyShipped] = useState('');

  const [d5whyMade, setD5whyMade] = useState('');
  const [d5whyShipped, setD5whyShipped] = useState('');

  const [d6verification, setD6verification] = useState('');
  const [d6owner, setD6owner] = useState({ name: '', phone: '', email: '', targetDate: '' });
  const sd6 = (k: string, v: string) => setD6owner(o => ({ ...o, [k]: v }));
  const [d6buildDate, setD6buildDate] = useState('');
  const [d6newPartsId, setD6newPartsId] = useState('');

  const [d7prevention, setD7prevention] = useState('');
  const [d7facilities, setD7facilities] = useState<OtherFacility[]>([{ id: uid(), name: '', partNo: '', caOwner: '', dueDate: '' }]);
  const addFac = () => setD7facilities(f => [...f, { id: uid(), name: '', partNo: '', caOwner: '', dueDate: '' }]);
  const delFac = (id: string) => setD7facilities(f => f.filter(x => x.id !== id));
  const updFac = (id: string, k: keyof OtherFacility, v: string) => setD7facilities(f => f.map(x => x.id === id ? { ...x, [k]: v } : x));
  const [d7docs, setD7docs] = useState<DocUpdate[]>(DOC_LIST.map(d => ({ doc: d, owner: '', date: '' })));
  const updDoc = (doc: string, k: keyof DocUpdate, v: string) => setD7docs(d => d.map(x => x.doc === doc ? { ...x, [k]: v } : x));

  const [d8closure, setD8closure] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const saveDB = async () => {
    setSaving(true);
    try {
      const body = { hdr, d1: { champion, members }, d2: { desc: d2desc, impact: d2impact, facilities: d2facilities }, d3: { actions: d3actions, otherRisk: d3otherRisk, certId: d3certId, sortingResult: d3sortingResult, sorted: d3sorted, defect: d3defect, startDate: d3startDate }, d4: { whyMade: d4whyMade, whyShipped: d4whyShipped }, d5: { whyMade: d5whyMade, whyShipped: d5whyShipped }, d6: { verification: d6verification, owner: d6owner, buildDate: d6buildDate, newPartsId: d6newPartsId }, d7: { prevention: d7prevention, facilities: d7facilities, docs: d7docs }, d8: { closure: d8closure } };
      const res = await fetch('/api/8d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setMsg(res.ok ? 'Saved to QMOS database' : 'Save failed');
    } catch { setMsg('Save error'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('8D Report');
    const border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    const rows: any[] = [
      ['8D Problem Analysis Report'],
      [],
      ['Customer:', hdr.customer, 'Date Issue Occurred:', hdr.dateIssue],
      ['Program:', hdr.program, '4D Due Date:', hdr.date4D],
      ['Product:', hdr.product, '8D Due Date:', hdr.date8D],
      ['Issue #:', hdr.issueNo, 'Date Issue Closed:', hdr.dateClosed],
      [],
      ['1. Team Members'],
      ['Champion Name', 'Champion Title', 'Champion Phone', 'Champion Email'],
      [champion.name, champion.title, champion.phone, champion.email],
      [],
      ['Additional Team Member Name(s)', 'Title(s)', 'Phone Number(s)', 'Email Address(es)'],
      ...members.map(m => [m.name, m.title, m.phone, m.email]),
      [],
      ['2. Problem Description'],
      ['Description (What, Where, When, How Many):'],
      [d2desc],
      ['Impact on Customer:'],
      [d2impact],
      ['Facilities Involved:'],
      [d2facilities],
      [],
      ['3. Interim Containment'],
      ['Actions taken to protect the customer:'],
      [d3actions],
      ['Other Product/Platform at Risk?', d3otherRisk, 'Identification of certified material?', d3certId],
      ['Sorting Results:'],
      [d3sortingResult],
      ['Sorted #', 'Defect #', 'Interim Containment Start Date'],
      [d3sorted, d3defect, d3startDate],
      [],
      ['4. Root Cause'],
      ['Why Made & How Verified:'],
      [d4whyMade],
      ['Why Shipped & How Verified:'],
      [d4whyShipped],
      [],
      ['5. Permanent Corrective Action'],
      ['Corrective Action for Why Made:'],
      [d5whyMade],
      ['Corrective Action for Why Shipped:'],
      [d5whyShipped],
      [],
      ['6. Verification of Corrective Action'],
      ['Verification:'],
      [d6verification],
      ['C.A. Owner Name', 'Phone', 'Email', 'Target Completion Date'],
      [d6owner.name, d6owner.phone, d6owner.email, d6owner.targetDate],
      ['Build Date for Certified Material:', d6buildDate, 'How Will New Parts Be Identified?:', d6newPartsId],
      [],
      ['7. Prevention'],
      ['How will this issue be avoided in the future?:'],
      [d7prevention],
      [],
      ['Other Facilities or Platforms At Risk:'],
      ['Name', 'Part Number', 'C.A. Owner for Follow Up', 'Due Date'],
      ...d7facilities.map(f => [f.name, f.partNo, f.caOwner, f.dueDate]),
      [],
      ['Has the necessary documentation been updated?'],
      ['Affected Document', 'Owner for Update', 'Date'],
      ...d7docs.map(d => [d.doc, d.owner, d.date]),
      [],
      ['8. Closure'],
      ['Closure Statement:'],
      [d8closure],
    ];
    rows.forEach(r => ws.addRow(r));
    ws.eachRow(row => {
      row.eachCell({ includeEmpty: false }, (cell: any) => {
        cell.border = border;
      });
    });
    ws.columns = [{ width: 28 }, { width: 35 }, { width: 28 }, { width: 35 }];
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `8D_${hdr.customer || 'report'}_${hdr.issueNo || ''}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const th = 'px-2 py-1.5 border border-gray-600 text-left text-xs font-semibold bg-gray-800';
  const td = 'border border-gray-700 px-1 py-0.5';
  const ci = 'bg-transparent w-full text-sm text-gray-200 focus:outline-none';

  return (
    <div className="p-4 min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">8D Problem Analysis Report</h1>
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
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">Report Information</h2>
        <div className="grid grid-cols-2 gap-3">
          <Inp label="Customer" value={hdr.customer} onChange={v => sh('customer', v)} />
          <Inp label="Date Issue Occurred" type="date" value={hdr.dateIssue} onChange={v => sh('dateIssue', v)} />
          <Inp label="Program" value={hdr.program} onChange={v => sh('program', v)} />
          <Inp label="4D Due Date" type="date" value={hdr.date4D} onChange={v => sh('date4D', v)} />
          <Inp label="Product" value={hdr.product} onChange={v => sh('product', v)} />
          <Inp label="8D Due Date" type="date" value={hdr.date8D} onChange={v => sh('date8D', v)} />
          <Inp label="Issue #" value={hdr.issueNo} onChange={v => sh('issueNo', v)} placeholder="Issue description" />
          <Inp label="Date Issue Closed" type="date" value={hdr.dateClosed} onChange={v => sh('dateClosed', v)} />
        </div>
      </div>

      <Section num="1" title="Team Members" color="bg-blue-900">
        <p className="text-xs text-gray-400 font-semibold mb-2">CHAMPION</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Inp label="Champion Name" value={champion.name} onChange={v => sc('name', v)} />
          <Inp label="Champion Title" value={champion.title} onChange={v => sc('title', v)} />
          <Inp label="Champion Phone" value={champion.phone} onChange={v => sc('phone', v)} />
          <Inp label="Champion Email" value={champion.email} onChange={v => sc('email', v)} />
        </div>
        <p className="text-xs text-gray-400 font-semibold mb-2">ADDITIONAL TEAM MEMBERS</p>
        <table className="w-full text-xs border-collapse mb-2">
          <thead><tr><th className={th}>Name</th><th className={th}>Title</th><th className={th}>Phone</th><th className={th}>Email</th><th className="px-2 py-1.5 border border-gray-600 w-10 bg-gray-800">Del</th></tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td className={td}><input className={ci} value={m.name} onChange={e => updMem(m.id, 'name', e.target.value)} placeholder="Full name" /></td>
                <td className={td}><input className={ci} value={m.title} onChange={e => updMem(m.id, 'title', e.target.value)} placeholder="Title" /></td>
                <td className={td}><input className={ci} value={m.phone} onChange={e => updMem(m.id, 'phone', e.target.value)} placeholder="Phone" /></td>
                <td className={td}><input className={ci} value={m.email} onChange={e => updMem(m.id, 'email', e.target.value)} placeholder="Email" /></td>
                <td className={td + ' text-center'}><button onClick={() => delMem(m.id)} className="text-red-500 hover:text-red-300">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addMem} className="px-3 py-1 bg-blue-800 hover:bg-blue-700 rounded text-xs">+ Add Member</button>
      </Section>

      <Section num="2" title="Problem Description" color="bg-orange-900">
        <div className="space-y-3">
          <TA label="Description (What, Where, When, How Many)" value={d2desc} onChange={setD2desc} rows={4} />
          <TA label="Impact on Customer (Shutdown, line interruptions, warranty, etc.)" value={d2impact} onChange={setD2impact} />
          <TA label="Facilities Involved (Customer, Plant and Suppliers)" value={d2facilities} onChange={setD2facilities} />
        </div>
      </Section>

      <Section num="3" title="Interim Containment" color="bg-yellow-900">
        <div className="space-y-3">
          <TA label="What actions were taken to immediately protect the customer and contain suspect inventory?" value={d3actions} onChange={setD3actions} rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Other Product / Platform at Risk?" value={d3otherRisk} onChange={setD3otherRisk} />
            <Inp label="Identification of Certified Material?" value={d3certId} onChange={setD3certId} />
          </div>
          <TA label="Sorting Results (Time, Date, Total Sorted, Quantity Rejected)" value={d3sortingResult} onChange={setD3sortingResult} />
          <div className="grid grid-cols-3 gap-3">
            <Inp label="Sorted #" value={d3sorted} onChange={setD3sorted} placeholder="Total qty sorted" />
            <Inp label="Defect #" value={d3defect} onChange={setD3defect} placeholder="Qty rejected" />
            <Inp label="Interim Containment Start Date" type="date" value={d3startDate} onChange={setD3startDate} />
          </div>
        </div>
      </Section>

      <Section num="4" title="Root Cause" color="bg-red-900">
        <div className="space-y-3">
          <TA label="Why Made & How Verified" value={d4whyMade} onChange={setD4whyMade} rows={4} />
          <TA label="Why Shipped & How Verified" value={d4whyShipped} onChange={setD4whyShipped} rows={4} />
        </div>
      </Section>

      <Section num="5" title="Permanent Corrective Action" color="bg-teal-900">
        <div className="space-y-3">
          <TA label="Corrective Action for Why Made" value={d5whyMade} onChange={setD5whyMade} rows={4} />
          <TA label="Corrective Action for Why Shipped" value={d5whyShipped} onChange={setD5whyShipped} rows={4} />
        </div>
      </Section>

      <Section num="6" title="Verification of Corrective Action" color="bg-blue-900">
        <div className="space-y-3">
          <TA label="Has the issue been turned on and off? Statistical evidence / hypothesis testing." value={d6verification} onChange={setD6verification} rows={4} />
          <div className="grid grid-cols-4 gap-2">
            <Inp label="C.A. Owner Name" value={d6owner.name} onChange={v => sd6('name', v)} />
            <Inp label="C.A. Owner Phone" value={d6owner.phone} onChange={v => sd6('phone', v)} />
            <Inp label="C.A. Owner Email" value={d6owner.email} onChange={v => sd6('email', v)} />
            <Inp label="Target Completion Date" type="date" value={d6owner.targetDate} onChange={v => sd6('targetDate', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Build Date for Certified Material" value={d6buildDate} onChange={setD6buildDate} />
            <Inp label="How Will New Parts Be Identified?" value={d6newPartsId} onChange={setD6newPartsId} />
          </div>
        </div>
      </Section>

      <Section num="7" title="Prevention" color="bg-violet-900">
        <div className="space-y-4">
          <TA label="How will this issue be avoided in the future?" value={d7prevention} onChange={setD7prevention} rows={3} />
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">OTHER FACILITIES OR PLATFORMS AT RISK</p>
            <table className="w-full text-xs border-collapse mb-2">
              <thead><tr><th className={th}>Name</th><th className={th}>Part Number</th><th className={th}>C.A. Owner for Follow Up</th><th className={th}>Due Date</th><th className="px-2 py-1.5 border border-gray-600 w-10 bg-gray-800">Del</th></tr></thead>
              <tbody>
                {d7facilities.map(f => (
                  <tr key={f.id}>
                    <td className={td}><input className={ci} value={f.name} onChange={e => updFac(f.id, 'name', e.target.value)} placeholder="Facility name" /></td>
                    <td className={td}><input className={ci} value={f.partNo} onChange={e => updFac(f.id, 'partNo', e.target.value)} placeholder="Part #" /></td>
                    <td className={td}><input className={ci} value={f.caOwner} onChange={e => updFac(f.id, 'caOwner', e.target.value)} placeholder="Owner" /></td>
                    <td className={td}><input className={ci + ' text-center'} type="date" value={f.dueDate} onChange={e => updFac(f.id, 'dueDate', e.target.value)} /></td>
                    <td className={td + ' text-center'}><button onClick={() => delFac(f.id)} className="text-red-500 hover:text-red-300">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addFac} className="px-3 py-1 bg-violet-800 hover:bg-violet-700 rounded text-xs">+ Add Facility</button>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">DOCUMENTATION UPDATED</p>
            <table className="w-full text-xs border-collapse">
              <thead><tr><th className={th}>Affected Document</th><th className={th}>Owner for Update</th><th className={th}>Date</th></tr></thead>
              <tbody>
                {d7docs.map(d => (
                  <tr key={d.doc}>
                    <td className={td + ' text-gray-300 pl-2'}>{d.doc}</td>
                    <td className={td}><input className={ci} value={d.owner} onChange={e => updDoc(d.doc, 'owner', e.target.value)} placeholder="Owner name" /></td>
                    <td className={td}><input className={ci + ' text-center'} type="date" value={d.date} onChange={e => updDoc(d.doc, 'date', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section num="8" title="Closure" color="bg-pink-900">
        <TA label="Closure Statement" value={d8closure} onChange={setD8closure} rows={3} />
      </Section>
    </div>
  );
}
