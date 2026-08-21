'use client';
import { useState } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// -- Shared helpers -------------------------------------------------------------
const uid = () => Math.random().toString(36).slice(2, 9);
interface TeamMember { id: string; name: string; title: string; phone: string; email: string; }
interface DocUpdate { doc: string; owner: string; date: string; }
interface OtherFacility { id: string; name: string; partNo: string; caOwner: string; dueDate: string; }

function Section({ num, title, color, children }: { num: string; title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
      <>
      <PageTitle title="8D Problem Solving" />
      <div className="mb-3 rounded-lg border border-[#dbeafe] overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-4 py-2 text-sm font-bold text-white ${color}`}>
        <span>{num}. {title}</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
      </>
  );
}
function TA({ label, value, onChange, rows = 3 }: { label?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      {label && <label className="block text-xs text-[#1e3a5f] mb-1 font-semibold">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none focus:border-blue-500 resize-y" />
    </div>
  );
}
function Inp({ label, value, onChange, type = 'text', placeholder = '' }: { label?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      {label && <label className="block text-xs text-[#1e3a5f] mb-1 font-semibold">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none focus:border-blue-500" />
    </div>
  );
}

// -- Types for new tabs ---------------------------------------------------------
interface CAPARecord {
  id: string; no: string; source: string; problem: string; rootCause: string;
  action: string; owner: string; dueDate: string; completedDate: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Overdue';
}
interface LessonRecord {
  id: string; date: string; dept: string; problem: string; rootCause: string;
  lesson: string; prevention: string; clause: string;
}

const SAMPLE_CAPAS: CAPARecord[] = [
  { id: uid(), no: 'CAPA-2025-001', source: 'Customer Complaint', problem: 'Dimensional OOT — Hole dia. 12.0mm found 11.6mm at TML line', rootCause: 'Drill worn beyond 500-pc limit. No tool change alert.', action: 'Tool change interval set to 450 pcs. Poka-yoke alert added to CNC program.', owner: 'Ramesh Kumar', dueDate: '2025-03-15', completedDate: '2025-03-12', status: 'Closed' },
  { id: uid(), no: 'CAPA-2025-002', source: 'Internal Audit', problem: 'IATF Cl.7.2 — No evidence of competency evaluation for 3 new operators', rootCause: 'Onboarding checklist not followed for urgent hiring.', action: 'Mandatory competency test before shopfloor entry. HR system locked until training signed off.', owner: 'Priya Mehta', dueDate: '2025-04-10', completedDate: '', status: 'In Progress' },
  { id: uid(), no: 'CAPA-2025-003', source: 'Supplier Issue', problem: 'Incoming rejection — Burr on forged blank causing FG scratch defect', rootCause: 'Supplier deburring process missed in shift changeover.', action: 'Supplier SCAR raised. 100% sorting at source. Weekly sorting report to SQE.', owner: 'Sunil Patil', dueDate: '2025-02-28', completedDate: '', status: 'Overdue' },
  { id: uid(), no: 'CAPA-2025-004', source: 'Process Audit (VDA)', problem: 'No process capability data for critical dimension X from last 12 months', rootCause: 'SPC plan not updated after last engineering change.', action: 'SPC restarted. Control Plan updated. Cpk target 1.67 within 60 days.', owner: 'Anita Rao', dueDate: '2025-05-01', completedDate: '', status: 'Open' },
  { id: uid(), no: 'CAPA-2025-005', source: 'Management Review', problem: 'OEE below 75% target for Line 2 — Q1 average 68.4%', rootCause: 'Unplanned breakdown — PM schedule not followed for 3 machines.', action: 'PM schedule enforced via work order system. OEE review weekly with Plant Head.', owner: 'Vinod Singh', dueDate: '2025-06-30', completedDate: '', status: 'Open' },
];

const SAMPLE_LESSONS: LessonRecord[] = [
  { id: uid(), date: '2025-01-20', dept: 'Manufacturing', problem: 'Wrong tool installed on CNC — operator confusion between similar tool holders', rootCause: 'Tool holders not colour-coded. Setup card not checked.', lesson: 'Similar tools must be differentiated with colour coding and dedicated storage slots.', prevention: 'Poka-yoke bins. Visual management updated. Setup card mandatory scan before machining.', clause: 'IATF 10.2.3' },
  { id: uid(), date: '2025-02-08', dept: 'Incoming Quality', problem: 'Batch of 2000 pcs shipped to TML without IQC clearance — system loophole', rootCause: 'ERP allowed GRN without IQC approval if qty < 2500.', lesson: 'ERP must enforce IQC approval for ALL receipts regardless of quantity.', prevention: 'ERP rule updated. Night shift IQC officer designated. IATF 8.4 updated.', clause: 'IATF 8.4.3' },
  { id: uid(), date: '2025-03-15', dept: 'Supplier Quality', problem: 'New supplier approved without valid PPAP — shipments for 3 months before discovery', rootCause: 'Supplier approval matrix not cross-linked to ERP supplier master.', lesson: 'Supplier PPAP status must be visible in ERP. Block PO creation if PPAP not approved.', prevention: 'ERP integration done. Approved Supplier List published monthly.', clause: 'IATF 8.4.1' },
];

// -- Tab 1: 8D Report -----------------------------------------------------------
function EightDTab() {
  const DOC_LIST = ['DFMEA', 'PFMEA', 'Control Plan', 'Process Flow', 'Operation Instructions', 'Drawing', 'Design Standards'];
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
    const border: any = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const rows: any[] = [
      ['8D Problem Analysis Report'], [],
      ['Customer:', hdr.customer, 'Date Issue Occurred:', hdr.dateIssue],
      ['Program:', hdr.program, '4D Due Date:', hdr.date4D],
      ['Product:', hdr.product, '8D Due Date:', hdr.date8D],
      ['Issue #:', hdr.issueNo, 'Date Issue Closed:', hdr.dateClosed], [],
      ['1. Team Members'], ['Champion Name', 'Champion Title', 'Champion Phone', 'Champion Email'],
      [champion.name, champion.title, champion.phone, champion.email], [],
      ['Additional Team Member Name(s)', 'Title(s)', 'Phone Number(s)', 'Email Address(es)'],
      ...members.map(m => [m.name, m.title, m.phone, m.email]), [],
      ['2. Problem Description'], ['Description (What, Where, When, How Many):'], [d2desc],
      ['Impact on Customer:'], [d2impact], ['Facilities Involved:'], [d2facilities], [],
      ['3. Interim Containment'], ['Actions taken to protect the customer:'], [d3actions],
      ['Other Product/Platform at Risk?', d3otherRisk, 'Identification of certified material?', d3certId],
      ['Sorting Results:'], [d3sortingResult],
      ['Sorted #', 'Defect #', 'Interim Containment Start Date'], [d3sorted, d3defect, d3startDate], [],
      ['4. Root Cause'], ['Why Made & How Verified:'], [d4whyMade], ['Why Shipped & How Verified:'], [d4whyShipped], [],
      ['5. Permanent Corrective Action'], ['Corrective Action for Why Made:'], [d5whyMade], ['Corrective Action for Why Shipped:'], [d5whyShipped], [],
      ['6. Verification of Corrective Action'], ['Verification:'], [d6verification],
      ['C.A. Owner Name', 'Phone', 'Email', 'Target Completion Date'],
      [d6owner.name, d6owner.phone, d6owner.email, d6owner.targetDate],
      ['Build Date for Certified Material:', d6buildDate, 'How Will New Parts Be Identified?:', d6newPartsId], [],
      ['7. Prevention'], ['How will this issue be avoided in the future?:'], [d7prevention], [],
      ['Other Facilities or Platforms At Risk:'], ['Name', 'Part Number', 'C.A. Owner for Follow Up', 'Due Date'],
      ...d7facilities.map(f => [f.name, f.partNo, f.caOwner, f.dueDate]), [],
      ['Has the necessary documentation been updated?'], ['Affected Document', 'Owner for Update', 'Date'],
      ...d7docs.map(d => [d.doc, d.owner, d.date]), [],
      ['8. Closure'], ['Closure Statement:'], [d8closure],
    ];
    rows.forEach(r => ws.addRow(r));
    ws.eachRow(row => { row.eachCell({ includeEmpty: false }, (cell: any) => { cell.border = border; }); });
    ws.columns = [{ width: 28 }, { width: 35 }, { width: 28 }, { width: 35 }];
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `8D_${hdr.customer || 'report'}_${hdr.issueNo || ''}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  const th = 'px-2 py-1.5 border border-[#dbeafe] text-left text-xs font-semibold bg-white';
  const td = 'border border-[#dbeafe] px-1 py-0.5';
  const ci = 'bg-transparent w-full text-sm text-[#1e3a5f] focus:outline-none';

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={exportExcel} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm">⬇ Export Excel</button>
        <button onClick={saveDB} disabled={saving} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-sm disabled:opacity-50">{saving ? 'Saving…' : '💾 Save to QMOS'}</button>
      </div>
      {msg && <div className="mb-3 px-3 py-2 bg-green-800 text-green-200 rounded text-sm">{msg}</div>}
      <div className="bg-white rounded-lg p-4 mb-3 border border-[#dbeafe]">
        <h2 className="text-xs font-bold text-[#1e3a5f] uppercase mb-3">Report Information</h2>
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
      <Section num="D1" title="Team Members" color="bg-[#eff6ff]">
        <p className="text-xs text-[#1e3a5f] font-semibold mb-2">CHAMPION</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <Inp label="Champion Name" value={champion.name} onChange={v => sc('name', v)} />
          <Inp label="Champion Title" value={champion.title} onChange={v => sc('title', v)} />
          <Inp label="Champion Phone" value={champion.phone} onChange={v => sc('phone', v)} />
          <Inp label="Champion Email" value={champion.email} onChange={v => sc('email', v)} />
        </div>
        <p className="text-xs text-[#1e3a5f] font-semibold mb-2">ADDITIONAL TEAM MEMBERS</p>
        <table className="w-full text-xs border-collapse mb-2">
          <thead><tr><th className={th}>Name</th><th className={th}>Title</th><th className={th}>Phone</th><th className={th}>Email</th><th className="px-2 py-1.5 border border-[#dbeafe] w-10 bg-white">Del</th></tr></thead>
          <tbody>{members.map(m => (<tr key={m.id}><td className={td}><input className={ci} value={m.name} onChange={e => updMem(m.id, 'name', e.target.value)} placeholder="Full name" /></td><td className={td}><input className={ci} value={m.title} onChange={e => updMem(m.id, 'title', e.target.value)} placeholder="Title" /></td><td className={td}><input className={ci} value={m.phone} onChange={e => updMem(m.id, 'phone', e.target.value)} placeholder="Phone" /></td><td className={td}><input className={ci} value={m.email} onChange={e => updMem(m.id, 'email', e.target.value)} placeholder="Email" /></td><td className={td + ' text-center'}><button onClick={() => delMem(m.id)} className="text-red-500 hover:text-red-700">✕</button></td></tr>))}</tbody>
        </table>
        <button onClick={addMem} className="px-3 py-1 bg-[#eff6ff] hover:bg-blue-700 rounded text-xs">+ Add Member</button>
      </Section>
      <Section num="D2" title="Problem Description" color="bg-orange-900/30">
        <div className="space-y-3">
          <TA label="Description (What, Where, When, How Many)" value={d2desc} onChange={setD2desc} rows={4} />
          <TA label="Impact on Customer (Shutdown, line interruptions, warranty, etc.)" value={d2impact} onChange={setD2impact} />
          <TA label="Facilities Involved (Customer, Plant and Suppliers)" value={d2facilities} onChange={setD2facilities} />
        </div>
      </Section>
      <Section num="D3" title="Interim Containment" color="bg-yellow-900/30">
        <div className="space-y-3">
          <TA label="What actions were taken to immediately protect the customer and contain suspect inventory?" value={d3actions} onChange={setD3actions} rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Other Product / Platform at Risk?" value={d3otherRisk} onChange={setD3otherRisk} />
            <Inp label="Identification of Certified Material?" value={d3certId} onChange={setD3certId} />
          </div>
          <TA label="Sorting Results (Time, Date, Total Sorted, Quantity Rejected)" value={d3sortingResult} onChange={setD3sortingResult} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Inp label="Sorted #" value={d3sorted} onChange={setD3sorted} placeholder="Total qty sorted" />
            <Inp label="Defect #" value={d3defect} onChange={setD3defect} placeholder="Qty rejected" />
            <Inp label="Interim Containment Start Date" type="date" value={d3startDate} onChange={setD3startDate} />
          </div>
        </div>
      </Section>
      <Section num="D4" title="Root Cause" color="bg-red-900">
        <div className="space-y-3">
          <TA label="Why Made & How Verified" value={d4whyMade} onChange={setD4whyMade} rows={4} />
          <TA label="Why Shipped & How Verified" value={d4whyShipped} onChange={setD4whyShipped} rows={4} />
        </div>
      </Section>
      <Section num="D5" title="Permanent Corrective Action" color="bg-teal-800">
        <div className="space-y-3">
          <TA label="Corrective Action for Why Made" value={d5whyMade} onChange={setD5whyMade} rows={4} />
          <TA label="Corrective Action for Why Shipped" value={d5whyShipped} onChange={setD5whyShipped} rows={4} />
        </div>
      </Section>
      <Section num="D6" title="Verification of Corrective Action" color="bg-[#eff6ff]">
        <div className="space-y-3">
          <TA label="Has the issue been turned on and off? Statistical evidence / hypothesis testing." value={d6verification} onChange={setD6verification} rows={4} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
      <Section num="D7" title="Prevention" color="bg-violet-900">
        <div className="space-y-4">
          <TA label="How will this issue be avoided in the future?" value={d7prevention} onChange={setD7prevention} rows={3} />
          <div>
            <p className="text-xs text-[#1e3a5f] font-semibold mb-2">OTHER FACILITIES OR PLATFORMS AT RISK</p>
            <table className="w-full text-xs border-collapse mb-2">
              <thead><tr><th className={th}>Name</th><th className={th}>Part Number</th><th className={th}>C.A. Owner for Follow Up</th><th className={th}>Due Date</th><th className="px-2 py-1.5 border border-[#dbeafe] w-10 bg-white">Del</th></tr></thead>
              <tbody>{d7facilities.map(f => (<tr key={f.id}><td className={td}><input className={ci} value={f.name} onChange={e => updFac(f.id, 'name', e.target.value)} placeholder="Facility name" /></td><td className={td}><input className={ci} value={f.partNo} onChange={e => updFac(f.id, 'partNo', e.target.value)} placeholder="Part #" /></td><td className={td}><input className={ci} value={f.caOwner} onChange={e => updFac(f.id, 'caOwner', e.target.value)} placeholder="Owner" /></td><td className={td}><input className={ci + ' text-center'} type="date" value={f.dueDate} onChange={e => updFac(f.id, 'dueDate', e.target.value)} /></td><td className={td + ' text-center'}><button onClick={() => delFac(f.id)} className="text-red-500 hover:text-red-700">✕</button></td></tr>))}</tbody>
            </table>
            <button onClick={addFac} className="px-3 py-1 bg-violet-800 hover:bg-violet-700 rounded text-xs">+ Add Facility</button>
          </div>
          <div>
            <p className="text-xs text-[#1e3a5f] font-semibold mb-2">DOCUMENTATION UPDATED</p>
            <table className="w-full text-xs border-collapse">
              <thead><tr><th className={th}>Affected Document</th><th className={th}>Owner for Update</th><th className={th}>Date</th></tr></thead>
              <tbody>{d7docs.map(d => (<tr key={d.doc}><td className={td + ' text-[#1e3a5f] pl-2'}>{d.doc}</td><td className={td}><input className={ci} value={d.owner} onChange={e => updDoc(d.doc, 'owner', e.target.value)} placeholder="Owner name" /></td><td className={td}><input className={ci + ' text-center'} type="date" value={d.date} onChange={e => updDoc(d.doc, 'date', e.target.value)} /></td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </Section>
      <Section num="D8" title="Closure" color="bg-pink-900">
        <TA label="Closure Statement — lessons learned, team recognition, sign-off" value={d8closure} onChange={setD8closure} rows={4} />
      </Section>
    </div>
  );
}

// -- Tab 2: 5-Why Analyser -----------------------------------------------------
// -- AI 5-Why generation engine ------------------------------------------------
interface WhyChain { answer: string; }
interface GeneratedAnalysis {
  occurrence: WhyChain[]; escape: WhyChain[];
  rootCause: string; escapeCause: string;
  correction: string; prevention: string;
  capa: string; detectedType: string;
}

function detectType(p: string): string {
  const d = p.toLowerCase();
  if (/dimension|diameter|length|width|height|toleran|size|oversize|undersize|oot|out.of.spec/.test(d)) return 'dimensional';
  if (/scratch|dent|surface|cosmetic|appear|mark|burr|rust|corrosion|paint|coating/.test(d)) return 'surface';
  if (/weld|crack|porosity|spatter|fusion|undercut/.test(d)) return 'welding';
  if (/assembl|fit|gap|misalign|loose|tight|fitment|wrong part|missing|mix/.test(d)) return 'assembly';
  if (/hardness|material|tensile|chemistry|composition|grade/.test(d)) return 'material';
  if (/leak|seal|pressure|fluid/.test(d)) return 'leak';
  if (/ppap|audit|document|record|procedure|sop|calibrat/.test(d)) return 'system';
  return 'general';
}

const WHY_BANKS: Record<string, { occurrence: string[]; escape: string[]; rootCause: string; escapeCause: string; correction: string; prevention: string; capa: string }> = {
  dimensional: {
    occurrence: [
      'Machined dimension found out of specification at customer line',
      'Cutting tool (drill/end mill) was worn beyond service life limit',
      'Tool change interval was set to 600 pcs but actual tool life is ~450 pcs under current feed/speed conditions',
      'No tool life study was conducted when feed rate was increased 3 months ago to meet output target',
      'Engineering Change (EC) for higher feed rate was implemented without updating process FMEA or tool life validation plan',
    ],
    escape: [
      'Out-of-spec parts shipped to customer without detection',
      'Outgoing inspection for this dimension was not included in the sampling plan for this part family',
      'Control Plan was not updated when the new dimension was added in the last drawing revision',
      'ECR (Engineering Change Request) process did not trigger a Control Plan review step',
      'Change management procedure did not mandate Control Plan update as a gate criterion before shipping',
    ],
    rootCause: 'Tool life validation not repeated after process parameter change — worn tools produced OOT dimensions undetected',
    escapeCause: 'Control Plan not updated after drawing revision — critical dimension excluded from outgoing inspection sampling',
    correction: 'Immediate 100% sorting of stock. Tool replacement. Tool change interval revised to 400 pcs.',
    prevention: 'Tool life revalidation mandatory after any feed/speed change. Control Plan update gated in ECR process.',
    capa: 'Update PFMEA to add detection control for tool wear. Revise Control Plan. Add tool life validation to ECR checklist. Train process engineers.',
  },
  surface: {
    occurrence: [
      'Surface defect (scratch/dent/burr) found on finished part at customer line',
      'Part contacted a sharp edge on the conveyor transfer chute during line transit',
      'Conveyor design was not reviewed after a layout change 2 months ago moved the chute to a tighter radius',
      'Layout change approval process did not include a packaging/material handling review step',
      'Material handling risk assessment was not part of the line balancing change procedure',
    ],
    escape: [
      'Cosmetically defective parts passed through inspection and were shipped',
      'Final cosmetic inspection is done under insufficient lighting (< 500 lux) — subtle scratches not visible',
      'Lighting specification in the inspection station standard was never updated from the original 2018 setup',
      'Inspection station setup procedure lacks a periodic environmental verification (lighting, ergonomics)',
      'No audit checkpoint for inspection station conditions in the internal product audit plan',
    ],
    rootCause: 'Material handling risk not assessed during layout change — sharp conveyor edge introduced post-layout',
    escapeCause: 'Inadequate inspection lighting allows subtle surface defects to escape — lighting standard not maintained',
    correction: 'Sort all stock. Add foam padding to conveyor chute. Increase lighting to 1000 lux at inspection station.',
    prevention: 'Material handling risk review added as gate in layout change approval. Quarterly inspection station audit.',
    capa: 'Update PFMEA with conveyor contact failure mode. Add lighting check to control plan. Train QC inspectors.',
  },
  welding: {
    occurrence: [
      'Weld defect (crack/porosity/incomplete fusion) found on part at inspection',
      'Shielding gas flow rate dropped below minimum during welding — weld pool contaminated by atmospheric oxygen',
      'Shielding gas hose had a micro-crack causing intermittent flow loss — not detected by operator',
      'Gas hose inspection was not part of the pre-shift equipment check on this welding station',
      'Pre-shift check procedure was last updated in 2021 and does not include gas delivery system verification',
    ],
    escape: [
      'Defective welds shipped without detection at inspection',
      'Visual weld inspection is performed by the operator himself — no independent second check',
      'Self-inspection relies on operator skill level 1 (awareness only) — no formal weld quality certification',
      'Competency matrix shows weld inspectors require Level 2 but hiring process accepted Level 1',
      'Skill matrix gap between required and actual competency was not escalated to training manager',
    ],
    rootCause: 'Gas delivery system not included in pre-shift check — hose degradation undetected, causing shielding failure',
    escapeCause: 'Self-inspection by uncertified operator — competency gap not actioned despite skill matrix flagging',
    correction: 'Replace shielding gas hose. 100% radiographic or dye-penetrant inspection of current stock batch.',
    prevention: 'Add gas hose inspection to pre-shift checklist. Mandatory Level 2 weld inspection certification.',
    capa: 'Update PFMEA for gas delivery failure mode. Revise pre-shift SOP. Fast-track Level 2 certification for 3 operators.',
  },
  assembly: {
    occurrence: [
      'Wrong part assembled / missing component / fitment issue found at customer',
      'Operator picked from mixed-part bin — two visually similar variants stored together on the assembly line',
      'Part changeover (variant A → variant B) was done on the line but the old variant bin was not removed',
      'Changeover procedure does not include a step to physically remove and quarantine previous variant parts',
      'SOP was written generically and not updated when the second variant was introduced 6 months ago',
    ],
    escape: [
      'Wrong assembly shipped to customer without detection',
      'End-of-line functional check does not differentiate between the two variants — both pass the same test',
      'Test specification was not updated when variant B was introduced — error-proofing covers only one variant',
      'Product launch checklist for new variant did not include an end-of-line test specification review',
      'New variant launch process lacks a cross-functional gate review for error-proofing adequacy',
    ],
    rootCause: 'Changeover SOP not updated for two-variant line — mixed-part bin not quarantined during changeover',
    escapeCause: 'End-of-line test not updated for new variant — cannot distinguish variants, allowing wrong assembly to pass',
    correction: 'Sort all shipped stock. Implement dedicated bins per variant with colour coding and physical separation.',
    prevention: 'SOP update mandatory at variant launch. End-of-line test review gated in new variant APQP checklist.',
    capa: 'Add poka-yoke bin locks for variant control. Update PFMEA. Revise launch checklist to include test validation.',
  },
  material: {
    occurrence: [
      'Material property failure (hardness/tensile/composition) found on incoming or finished part',
      'Raw material from a new heat lot had lower hardness than specification — supplier did not flag the change',
      'Supplier did not submit a Certificate of Conformance (CoC) for this heat lot — material used without verification',
      'Incoming inspection procedure allows material to be released to production on CoC alone without re-testing for this grade',
      'Risk classification of this material grade was not updated when it was upgraded to a special characteristic in last year\'s PFMEA',
    ],
    escape: [
      'Non-conforming material used in production and shipped to customer',
      'Incoming QC did not test hardness — only visual inspection performed for this supplier',
      'Approved Supplier List (ASL) shows this supplier as "approved" but supplier re-assessment is 18 months overdue',
      'Supplier re-assessment scheduling is done manually — no automated alert system in place',
      'Supplier quality system lacks a periodic re-evaluation trigger linked to the approved supplier database',
    ],
    rootCause: 'Material special characteristic upgrade not reflected in incoming inspection plan — re-testing not triggered',
    escapeCause: 'Supplier re-assessment overdue — non-compliant CoC accepted without re-testing',
    correction: 'Quarantine and sort all parts from this heat lot. Mandatory hardness re-test before any release.',
    prevention: 'PFMEA → Control Plan cascade for special characteristics. Automated supplier re-assessment reminders.',
    capa: 'Update incoming inspection plan. Issue SCAR to supplier. Add special char. incoming test gate to Control Plan.',
  },
  leak: {
    occurrence: [
      'Fluid leak / seal failure detected on part at customer or in functional test',
      'O-ring seal was not seated correctly in its groove during assembly — assembly torque was applied before seat verification',
      'Assembly SOP does not include a visual seat verification step before torque application',
      'When the assembly sequence was revised last year for cycle time, the seat verification step was removed as "redundant"',
      'Change to SOP sequence was approved without a risk review — step removal was not flagged in PFMEA update',
    ],
    escape: [
      'Leaking assembly shipped to customer without detection',
      'Leak test pressure was reduced from 3.5 bar to 2.8 bar after a gauge replacement — root cause never investigated',
      'Gauge replacement was done without recalibrating the test parameter to validated specification',
      'Test station calibration procedure does not require re-validation of test parameters after instrument replacement',
      'Calibration system does not link test equipment records to process parameter validation — treated as independent activities',
    ],
    rootCause: 'SOP change removed seal seat verification step — incorrect seating causes leak under service pressure',
    escapeCause: 'Leak test parameter not revalidated after instrument change — reduced pressure does not detect seal defects',
    correction: 'Sort all stock. Disassemble and re-inspect O-ring seating on all units. Reset leak test to 3.5 bar.',
    prevention: 'SOP change risk review mandatory. Test parameter revalidation required after any instrument replacement.',
    capa: 'Restore SOP step. Update PFMEA for seal seating failure mode. Add test parameter to calibration scope.',
  },
  system: {
    occurrence: [
      'IATF / audit nonconformity — document / record / procedure requirement not met',
      'Required procedure was not followed because operators were unaware it had been updated 2 months ago',
      'Document revision notification was sent only to team leaders — not cascaded to shopfloor operators',
      'Document distribution matrix does not include shopfloor operators for this procedure category',
      'Document control procedure classifies shopfloor SOPs as "controlled" but notification workflow was not enforced',
    ],
    escape: [
      'Nonconformity was not detected during internal audit before external certification audit',
      'Internal audit checklist for this clause was last updated in 2022 — does not reflect current IATF 2024 interpretations',
      'Internal auditor was trained on IATF 2016 edition and has not attended any refresher since certification',
      'Training calendar does not include periodic refresher training for certified internal auditors',
      'Competency maintenance requirement for internal auditors is not defined in the training procedure',
    ],
    rootCause: 'Document change notification not cascaded to operators — non-updated practice continued without awareness',
    escapeCause: 'Internal audit checklist and auditor skills not refreshed — nonconformity not detected before surveillance audit',
    correction: 'Immediate re-training of all affected operators. Controlled copy replacement at all workstations.',
    prevention: 'Operator-level document change notification mandatory. Annual internal auditor refresher training.',
    capa: 'Revise document distribution matrix. Schedule auditor refresher. Update internal audit checklist to current IATF.',
  },
  general: {
    occurrence: [
      'Quality nonconformance found at customer or internal inspection point',
      'Process parameter deviated from the specified range during production — alarm was acknowledged but not acted upon',
      'Operator acknowledged the process alarm to silence it, assuming it was a false alarm — no escalation done',
      'Alarm management procedure does not distinguish between false alarms and real deviations requiring stop-and-fix',
      'Alarm management system was not risk-ranked — all alarms treated with equal (low) urgency regardless of impact',
    ],
    escape: [
      'Nonconforming product passed through all inspection points and reached customer',
      'Sampling inspection at final stage missed the defect — batch passed on AQL 1.5 but defect rate was ~0.8%',
      'AQL level was set at product launch and never reviewed as process maturity improved or customer risk increased',
      'AQL review is not part of the annual Control Plan review agenda for this product family',
      'Control Plan review procedure lacks a risk-based trigger for AQL re-evaluation',
    ],
    rootCause: 'Alarm management lacks risk ranking — critical process deviations treated as false alarms and not escalated',
    escapeCause: 'AQL sampling level not reviewed post-launch — insufficient to detect low-rate defects reaching customer',
    correction: 'Sort all stock from affected period. Increase to 100% inspection until AQL root cause is corrected.',
    prevention: 'Risk-based alarm prioritization. Annual AQL review included in Control Plan review cycle.',
    capa: 'Rank all process alarms by severity. Update AQL in Control Plan. Retrain operators on alarm response protocol.',
  },
};

function aiGenerate(problem: string): GeneratedAnalysis {
  const type = detectType(problem);
  const bank = WHY_BANKS[type] ?? WHY_BANKS.general;
  return {
    occurrence: bank.occurrence.map(a => ({ answer: a })),
    escape: bank.escape.map(a => ({ answer: a })),
    rootCause: bank.rootCause,
    escapeCause: bank.escapeCause,
    correction: bank.correction,
    prevention: bank.prevention,
    capa: bank.capa,
    detectedType: type,
  };
}

// -- FiveWhyTab: AI-powered dual 5-Why (Occurrence + Escape) ------------------
function FiveWhyTab() {
  const emptyChain = () => [
    { answer: '' }, { answer: '' }, { answer: '' }, { answer: '' }, { answer: '' },
  ];
  const [problem, setProblem]         = useState('');
  const [occurrence, setOccurrence]   = useState<WhyChain[]>(emptyChain());
  const [escape, setEscape]           = useState<WhyChain[]>(emptyChain());
  const [rootCause, setRootCause]     = useState('');
  const [escapeCause, setEscapeCause] = useState('');
  const [correction, setCorrection]   = useState('');
  const [prevention, setPrevention]   = useState('');
  const [capa, setCapa]               = useState('');
  const [generating, setGenerating]   = useState(false);
  const [generated, setGenerated]     = useState(false);
  const [detectedType, setDetectedType] = useState('');
  const [activeChain, setActiveChain] = useState<'both'|'occurrence'|'escape'>('both');

  const TYPE_LABEL: Record<string,string> = {
    dimensional:'📐 Dimensional', surface:'✨ Surface/Cosmetic', welding:'🔥 Welding',
    assembly:'🔩 Assembly', material:'🧪 Material', leak:'💧 Leak/Seal',
    system:'📋 System/Audit', general:'⚙️ General',
  };
  const WHY_COLORS = ['#ef4444','#f97316','#eab308','#14b8a6','#22c55e'];

  const handleGenerate = () => {
    if (!problem.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const result = aiGenerate(problem);
      setOccurrence(result.occurrence);
      setEscape(result.escape);
      setRootCause(result.rootCause);
      setEscapeCause(result.escapeCause);
      setCorrection(result.correction);
      setPrevention(result.prevention);
      setCapa(result.capa);
      setDetectedType(result.detectedType);
      setGenerating(false);
      setGenerated(true);
    }, 900);
  };

  const handleReset = () => {
    setOccurrence(emptyChain()); setEscape(emptyChain());
    setRootCause(''); setEscapeCause(''); setCorrection(''); setPrevention(''); setCapa('');
    setGenerated(false); setDetectedType(''); setProblem('');
  };

  const updOcc = (i: number, v: string) => setOccurrence(c => c.map((x,j) => j===i ? {answer:v} : x));
  const updEsc = (i: number, v: string) => setEscape(c => c.map((x,j) => j===i ? {answer:v} : x));

  const WhyColumn = ({ chain, update, label, color }: {
    chain: WhyChain[]; update: (i:number,v:string)=>void; label: string; color: string;
  }) => (
    <div className="flex-1 min-w-0 space-y-2">
      <div className={`text-xs font-bold uppercase tracking-widest text-center py-1.5 rounded-lg`} style={{background:`${color}20`,color}}>
        {label}
      </div>
      {chain.map((w, i) => (
        <div key={i} className="relative">
          <div className="rounded-lg overflow-hidden border" style={{borderColor:`${WHY_COLORS[i]}40`}}>
            <div className="flex items-center gap-2 px-3 py-1.5" style={{background:`${WHY_COLORS[i]}15`}}>
              <span className="text-xs font-black" style={{color:WHY_COLORS[i]}}>WHY {i+1}</span>
              {w.answer && <span className="ml-auto text-xs" style={{color:WHY_COLORS[i]}}>✓</span>}
            </div>
            <textarea
              value={w.answer}
              onChange={e => update(i, e.target.value)}
              rows={2}
              placeholder={`Because…`}
              className="w-full bg-white border-0 px-3 py-2 text-xs text-[#1e3a5f] focus:outline-none resize-none"
            />
          </div>
          {i < 4 && (
            <div className="flex justify-center my-1">
              <span className="text-sm" style={{color:`${WHY_COLORS[i+1]}80`}}>▼</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* -- Input + AI button ----------------------------------------------- */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-0.5">🤖 AI 5-Why Generator</div>
            <p className="text-xs text-[#1e3a5f]">Describe the problem → AI generates dual occurrence + escape chains (IATF D4 compliant)</p>
          </div>
          {detectedType && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-900/40 text-indigo-700 border border-indigo-700/40">
              {TYPE_LABEL[detectedType] ?? detectedType}
            </span>
          )}
        </div>
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          rows={2}
          placeholder="e.g. Dimensional rejection — Hole dia. 11.6mm found vs 12.0mm spec at TML customer line, batch 450 pcs, 18-Jan-2025"
          className="w-full bg-[#dbeafe] border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500/70 resize-none placeholder:text-[#1e3a5f]"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={!problem.trim() || generating}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
            style={{background: generating ? '#334155' : '#f59e0b', color: generating ? '#94a3b8' : '#000'}}
          >
            {generating ? '⏳ Analysing…' : '🤖 AI Generate 5-Why'}
          </button>
          {generated && (
            <button onClick={handleReset} className="px-3 py-2 rounded-lg text-xs text-[#1e3a5f] border border-[#dbeafe] hover:bg-[#eff6ff] transition">
              ↺ Reset
            </button>
          )}
          <div className="ml-auto flex gap-1">
            {(['both','occurrence','escape'] as const).map(v => (
              <button key={v} onClick={() => setActiveChain(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeChain===v ? 'bg-[#f0f9ff] text-white' : 'text-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
                {v === 'both' ? 'Both' : v === 'occurrence' ? 'Occurrence' : 'Escape'}
              </button>
            ))}
          </div>
        </div>
        {generated && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#dbeafe]">
            <span className="text-xs text-[#15803d] font-semibold">✅ AI analysis complete</span>
            <span className="text-xs text-[#1e3a5f]">— Review and edit each Why answer below. All fields are editable.</span>
          </div>
        )}
      </div>

      {/* -- Dual 5-Why chains ----------------------------------------------- */}
      {generated && (
        <div className={`flex gap-4 ${activeChain === 'both' ? 'flex-row' : 'flex-col'}`}>
          {(activeChain === 'both' || activeChain === 'occurrence') && (
            <WhyColumn chain={occurrence} update={updOcc} label="🔴 Why Made (Occurrence)" color="#ef4444" />
          )}
          {activeChain === 'both' && (
            <div className="flex flex-col items-center justify-center gap-1 py-8 opacity-30">
              <div className="w-px flex-1 bg-slate-600" />
              <span className="text-xs text-[#1e3a5f] rotate-0 whitespace-nowrap px-1">vs</span>
              <div className="w-px flex-1 bg-slate-600" />
            </div>
          )}
          {(activeChain === 'both' || activeChain === 'escape') && (
            <WhyColumn chain={escape} update={updEsc} label="🟠 Why Shipped (Escape)" color="#f97316" />
          )}
        </div>
      )}

      {!generated && (
        <div className="border border-dashed border-[#dbeafe] rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <div className="text-sm font-semibold text-[#1e3a5f] mb-1">Enter a problem statement above and click AI Generate</div>
          <div className="text-xs text-[#1e3a5f]">AI will produce both occurrence (why made) and escape (why shipped) chains per IATF 16949 D4 requirements</div>
        </div>
      )}

      {/* -- Root cause + actions --------------------------------------------- */}
      {generated && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-red-700/30 rounded-xl p-4">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">🎯 Root Cause — Occurrence</div>
              <textarea value={rootCause} onChange={e => setRootCause(e.target.value)} rows={2}
                className="w-full bg-[#dbeafe] border border-[#dbeafe] rounded px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none resize-none" />
            </div>
            <div className="bg-white border border-orange-700/30 rounded-xl p-4">
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-2">🚨 Escape Cause — Why Not Detected</div>
              <textarea value={escapeCause} onChange={e => setEscapeCause(e.target.value)} rows={2}
                className="w-full bg-[#dbeafe] border border-[#dbeafe] rounded px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none resize-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-blue-700/30 rounded-xl p-4">
              <div className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wide mb-2">🛡 Immediate Correction (D3)</div>
              <textarea value={correction} onChange={e => setCorrection(e.target.value)} rows={3}
                className="w-full bg-[#dbeafe] border border-[#dbeafe] rounded px-3 py-2 text-xs text-[#1e3a5f] focus:outline-none resize-none" />
            </div>
            <div className="bg-white border border-emerald-700/30 rounded-xl p-4">
              <div className="text-xs font-bold text-[#15803d] uppercase tracking-wide mb-2">✅ Corrective Action (D5)</div>
              <textarea value={prevention} onChange={e => setPrevention(e.target.value)} rows={3}
                className="w-full bg-[#dbeafe] border border-[#dbeafe] rounded px-3 py-2 text-xs text-[#1e3a5f] focus:outline-none resize-none" />
            </div>
            <div className="bg-white border border-purple-700/30 rounded-xl p-4">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2">🔄 Systemic Prevention (D7)</div>
              <textarea value={capa} onChange={e => setCapa(e.target.value)} rows={3}
                className="w-full bg-[#dbeafe] border border-[#dbeafe] rounded px-3 py-2 text-xs text-[#1e3a5f] focus:outline-none resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* -- IATF reference --------------------------------------------------- */}
      <div className="bg-white border border-[#dbeafe] rounded-xl p-3 flex items-start gap-3">
        <span className="text-base">📋</span>
        <div className="text-xs text-[#1e3a5f] leading-relaxed">
          <span className="text-[#1e3a5f] font-semibold">IATF 16949 D4 Requirement:</span> Root cause analysis must address both occurrence (why the defect was made) and escape (why it was not detected). Both chains must be documented with objective evidence. Root cause must be systemic — not operator blame.
        </div>
      </div>
    </div>
  );
}

// -- Tab 3: Fishbone (Ishikawa) Generator -------------------------------------
function FishboneTab() {
  const [effect, setEffect] = useState('');
  const [causes, setCauses] = useState<Record<string, string[]>>({
    Man: ['', '', ''],
    Machine: ['', '', ''],
    Material: ['', '', ''],
    Method: ['', '', ''],
    Measurement: ['', '', ''],
    'Mother Nature': ['', '', ''],
  });
  const CATEGORY_COLORS: Record<string, string> = {
    Man: '#3b82f6', Machine: '#ef4444', Material: '#f59e0b',
    Method: '#10b981', Measurement: '#8b5cf6', 'Mother Nature': '#06b6d4',
  };
  const updCause = (cat: string, i: number, v: string) => setCauses(c => ({ ...c, [cat]: c[cat].map((x, j) => j === i ? v : x) }));
  const addCause = (cat: string) => setCauses(c => ({ ...c, [cat]: [...c[cat], ''] }));

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#dbeafe] rounded-xl p-4">
        <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Effect (Problem Statement)</div>
        <input value={effect} onChange={e => setEffect(e.target.value)} placeholder="e.g. Customer rejection — dimensional OOT on hole dia."
          className="w-full bg-white border border-[#dbeafe] rounded px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:border-red-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(causes).map(([cat, items]) => (
          <div key={cat} className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-bold text-white" style={{background: CATEGORY_COLORS[cat]}}>
              {cat === 'Man' ? '👤' : cat === 'Machine' ? '⚙️' : cat === 'Material' ? '📦' : cat === 'Method' ? '📋' : cat === 'Measurement' ? '📏' : '🌍'} {cat}
            </div>
            <div className="p-3 space-y-2">
              {items.map((item, i) => (
                <input key={i} value={item} onChange={e => updCause(cat, i, e.target.value)}
                  placeholder={`Cause ${i + 1}`}
                  className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-xs text-[#1e3a5f] focus:outline-none" />
              ))}
              <button onClick={() => addCause(cat)} className="text-xs text-[#1e3a5f] hover:text-[#1e3a5f]">+ Add cause</button>
            </div>
          </div>
        ))}
      </div>

      {effect && (
        <div className="bg-white border border-[#dbeafe] rounded-xl p-4">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Fishbone Summary — {effect}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(causes).map(([cat, items]) => {
              const filled = items.filter(x => x.trim());
              if (!filled.length) return null;
              return (
                <div key={cat}>
                  <div className="text-xs font-bold mb-1" style={{color: CATEGORY_COLORS[cat]}}>{cat}</div>
                  <ul className="space-y-0.5">
                    {filled.map((c, i) => <li key={i} className="text-xs text-[#1e3a5f] flex gap-1"><span className="text-[#1e3a5f]">•</span>{c}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl p-4">
        <div className="text-xs font-bold text-[#1d4ed8] mb-2">📘 6M Framework — IATF 16949 Alignment</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[#1e3a5f]">
          {[['👤 Man','Skill gaps, fatigue, training, operator error, shift change'],['⚙️ Machine','Maintenance, calibration, wear, breakdown, tooling'],['📦 Material','Raw material variation, supplier quality, handling'],['📋 Method','Process parameter, SOP not followed, setup error'],['📏 Measurement','Gauge R&R, instrument calibration, inspector variation'],['🌍 Mother Nature','Temperature, humidity, vibration, dust, lighting']].map(([m, e]) => (
            <div key={m}><span className="text-[#1e3a5f] font-semibold">{m}</span><br />{e}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Tab 4: CAPA Tracker -------------------------------------------------------
function CAPATab() {
  const [capas, setCapas] = useState<CAPARecord[]>(SAMPLE_CAPAS);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CAPARecord>({ id: '', no: '', source: '', problem: '', rootCause: '', action: '', owner: '', dueDate: '', completedDate: '', status: 'Open' });
  const sf = (k: keyof CAPARecord, v: string) => setForm(f => ({ ...f, [k]: v }));

  const SOURCES = ['Customer Complaint', 'Internal Audit', 'Supplier Issue', 'Process Audit (VDA)', 'Management Review', 'Field Return / Warranty', 'Other'];
  const STATUSES: CAPARecord['status'][] = ['Open', 'In Progress', 'Closed', 'Overdue'];
  const STATUS_STYLE: Record<string, string> = {
    'Open': 'text-[#1d4ed8] bg-[#eff6ff] border-blue-700/50',
    'In Progress': 'text-yellow-300 bg-yellow-900/30 border-yellow-700/50',
    'Closed': 'text-[#15803d] bg-emerald-900/30 border-emerald-700/50',
    'Overdue': 'text-red-600 bg-red-50 border-red-700/50',
  };

  const filtered = filter === 'All' ? capas : capas.filter(c => c.status === filter);
  const counts = { All: capas.length, Open: capas.filter(c=>c.status==='Open').length, 'In Progress': capas.filter(c=>c.status==='In Progress').length, Closed: capas.filter(c=>c.status==='Closed').length, Overdue: capas.filter(c=>c.status==='Overdue').length };

  const saveForm = () => {
    if (!form.no || !form.problem) return;
    if (form.id) { setCapas(c => c.map(x => x.id === form.id ? form : x)); }
    else { setCapas(c => [...c, { ...form, id: uid() }]); }
    setShowForm(false);
    setForm({ id: '', no: '', source: '', problem: '', rootCause: '', action: '', owner: '', dueDate: '', completedDate: '', status: 'Open' });
  };
  const editCapa = (c: CAPARecord) => { setForm(c); setShowForm(true); };
  const delCapa = (id: string) => setCapas(c => c.filter(x => x.id !== id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-5 gap-3">
        {(['All','Open','In Progress','Closed','Overdue'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-xl border p-3 text-center transition-all ${filter===s?'border-blue-500 bg-[#eff6ff]':'border-[#dbeafe] bg-white hover:border-gray-500'}`}>
            <div className={`text-2xl font-bold ${s==="Overdue"?"text-red-600":s==="Closed"?"text-[#15803d]":s==="In Progress"?"text-amber-600":s==="Open"?"text-[#1d4ed8]":"text-[#1e3a5f]"}`}>{counts[s as keyof typeof counts]}</div>
            <div className="text-xs text-[#1e3a5f] mt-0.5">{s}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setShowForm(true); setForm({ id:'',no:'',source:'',problem:'',rootCause:'',action:'',owner:'',dueDate:'',completedDate:'',status:'Open' }); }}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-bold">+ New CAPA</button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-700/50 rounded-xl p-5 space-y-3">
          <div className="text-sm font-bold text-[#1d4ed8]">{form.id ? 'Edit CAPA' : 'New CAPA'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">CAPA No.</label><input value={form.no} onChange={e=>sf('no',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none" placeholder="CAPA-2025-006" /></div>
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">Source</label><select value={form.source} onChange={e=>sf('source',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none">{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">Status</label><select value={form.status} onChange={e=>sf('status',e.target.value as CAPARecord['status'])} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none">{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-[#1e3a5f] mb-1 block">Problem Description</label><textarea value={form.problem} onChange={e=>sf('problem',e.target.value)} rows={2} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none resize-none" /></div>
          <div><label className="text-xs text-[#1e3a5f] mb-1 block">Root Cause</label><textarea value={form.rootCause} onChange={e=>sf('rootCause',e.target.value)} rows={2} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none resize-none" /></div>
          <div><label className="text-xs text-[#1e3a5f] mb-1 block">Corrective Action</label><textarea value={form.action} onChange={e=>sf('action',e.target.value)} rows={2} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none resize-none" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">Owner</label><input value={form.owner} onChange={e=>sf('owner',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none" /></div>
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">Due Date</label><input type="date" value={form.dueDate} onChange={e=>sf('dueDate',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none" /></div>
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">Completed Date</label><input type="date" value={form.completedDate} onChange={e=>sf('completedDate',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none" /></div>
          </div>
          <div className="flex gap-2"><button onClick={saveForm} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-bold">Save</button><button onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Cancel</button></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#dbeafe] bg-[#eff6ff]">
              {['CAPA No.','Source','Problem','Root Cause','Action','Owner','Due','Status',''].map(h=><th key={h} className="text-xs text-[#1e3a5f] px-3 py-3 text-left whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-200/50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-[#eff6ff]">
                  <td className="px-3 py-3 font-mono text-xs text-[#1d4ed8] whitespace-nowrap">{c.no}</td>
                  <td className="px-3 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{c.source}</td>
                  <td className="px-3 py-3 text-xs text-white max-w-[180px]"><div className="line-clamp-2">{c.problem}</div></td>
                  <td className="px-3 py-3 text-xs text-[#1e3a5f] max-w-[150px]"><div className="line-clamp-2">{c.rootCause}</div></td>
                  <td className="px-3 py-3 text-xs text-[#1e3a5f] max-w-[150px]"><div className="line-clamp-2">{c.action}</div></td>
                  <td className="px-3 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{c.owner}</td>
                  <td className="px-3 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{c.dueDate}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</span></td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <button onClick={()=>editCapa(c)} className="text-xs text-[#1d4ed8] hover:text-[#1d4ed8] mr-2">Edit</button>
                    <button onClick={()=>delCapa(c.id)} className="text-xs text-red-500 hover:text-red-700">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -- Tab 5: Lessons Learned ----------------------------------------------------
function LessonsTab() {
  const [lessons, setLessons] = useState<LessonRecord[]>(SAMPLE_LESSONS);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LessonRecord>({ id:'',date:'',dept:'',problem:'',rootCause:'',lesson:'',prevention:'',clause:'' });
  const sf = (k: keyof LessonRecord, v: string) => setForm(f => ({ ...f, [k]: v }));
  const DEPTS = ['All','Manufacturing','Incoming Quality','Outgoing Quality','Supplier Quality','Process Quality','Engineering','Audit'];

  const filtered = lessons.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.problem.toLowerCase().includes(q) || l.lesson.toLowerCase().includes(q) || l.dept.toLowerCase().includes(q);
    const matchDept = filterDept === 'All' || l.dept === filterDept;
    return matchSearch && matchDept;
  });

  const saveLesson = () => {
    if (!form.problem || !form.lesson) return;
    if (form.id) { setLessons(l => l.map(x => x.id === form.id ? form : x)); }
    else { setLessons(l => [...l, { ...form, id: uid() }]); }
    setShowForm(false);
    setForm({ id:'',date:'',dept:'',problem:'',rootCause:'',lesson:'',prevention:'',clause:'' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search lessons, problems, departments…"
          className="flex-1 min-w-[200px] bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:border-blue-500" />
        <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
          className="bg-white border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none">
          {DEPTS.map(d=><option key={d}>{d}</option>)}
        </select>
        <button onClick={()=>{setShowForm(true);setForm({id:'',date:'',dept:'Manufacturing',problem:'',rootCause:'',lesson:'',prevention:'',clause:''});}}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-bold">+ Add Lesson</button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-700/50 rounded-xl p-5 space-y-3">
          <div className="text-sm font-bold text-[#1d4ed8]">{form.id?'Edit':'New'} Lesson Learned</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">Date</label><input type="date" value={form.date} onChange={e=>sf('date',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none" /></div>
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">Department</label><select value={form.dept} onChange={e=>sf('dept',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none">{DEPTS.filter(d=>d!=='All').map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="text-xs text-[#1e3a5f] mb-1 block">IATF Clause</label><input value={form.clause} onChange={e=>sf('clause',e.target.value)} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none" placeholder="e.g. 10.2.3" /></div>
          </div>
          <div><label className="text-xs text-[#1e3a5f] mb-1 block">Problem Statement</label><textarea value={form.problem} onChange={e=>sf('problem',e.target.value)} rows={2} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none resize-none" /></div>
          <div><label className="text-xs text-[#1e3a5f] mb-1 block">Root Cause</label><textarea value={form.rootCause} onChange={e=>sf('rootCause',e.target.value)} rows={2} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none resize-none" /></div>
          <div><label className="text-xs text-[#1e3a5f] mb-1 block">Lesson Learned</label><textarea value={form.lesson} onChange={e=>sf('lesson',e.target.value)} rows={2} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none resize-none" /></div>
          <div><label className="text-xs text-[#1e3a5f] mb-1 block">Prevention / Systemic Action</label><textarea value={form.prevention} onChange={e=>sf('prevention',e.target.value)} rows={2} className="w-full bg-white border border-[#dbeafe] rounded px-2 py-1.5 text-sm text-[#1e3a5f] focus:outline-none resize-none" /></div>
          <div className="flex gap-2"><button onClick={saveLesson} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-bold">Save</button><button onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Cancel</button></div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-8 text-[#1e3a5f]">No lessons found. Add your first lesson above.</div>}
        {filtered.map(l => (
          <div key={l.id} className="bg-white border border-[#dbeafe] rounded-xl p-4 hover:border-gray-500 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-[#eff6ff] border border-blue-700/50 rounded text-[#1d4ed8]">{l.dept}</span>
                <span className="text-xs text-[#1e3a5f]">{l.date}</span>
                {l.clause && <span className="text-xs px-2 py-0.5 bg-white border border-[#dbeafe] rounded text-[#1e3a5f] font-mono">{l.clause}</span>}
              </div>
              <button onClick={()=>{setForm(l);setShowForm(true);}} className="text-xs text-[#1d4ed8] hover:text-[#1d4ed8] shrink-0">Edit</button>
            </div>
            <div className="text-sm font-semibold text-white mb-2">{l.problem}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div><div className="text-[#1e3a5f] font-semibold mb-1">Root Cause</div><div className="text-[#1e3a5f]">{l.rootCause}</div></div>
              <div><div className="text-amber-500 font-semibold mb-1">Lesson Learned</div><div className="text-[#1e3a5f]">{l.lesson}</div></div>
              <div><div className="text-emerald-500 font-semibold mb-1">Prevention</div><div className="text-[#1e3a5f]">{l.prevention}</div></div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-[#1e3a5f] text-center">{lessons.length} lessons in database — {filtered.length} shown</div>
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
const TABS = ['🔴 8D Report', '🔎 5-Why', '🐟 Fishbone', '📋 CAPA Tracker', '📚 Lessons Learned'];

export default function ProblemSolvingPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="p-4 min-h-screen bg-[#eff6ff] text-[#0f172a]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">🔴 Problem Solving Center</h1>
        <p className="text-[#1e3a5f] text-sm">8D · 5-Why · Fishbone · CAPA Tracker · Lessons Learned — IATF 16949 Cl. 10.2</p>
      </div>

      {/* Download Strip */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl mb-4" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/problem-solving/8D_Report_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View 8D Report Template">8D Template XLS</a><a href="/downloads/problem-solving/8D_Report_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download 8D Report Template">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#ea580c'}}><a href="/downloads/problem-solving/5_Why_Analysis_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View 5-Why Template">5-Why Template XLS</a><a href="/downloads/problem-solving/5_Why_Analysis_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download 5-Why Template">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/problem-solving/CAPA_Register_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View CAPA Register">CAPA Register XLS</a><a href="/downloads/problem-solving/CAPA_Register_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download CAPA Register">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#7c3aed'}}><a href="/downloads/problem-solving/Lessons_Learned_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Lessons Learned Register">Lessons Learned XLS</a><a href="/downloads/problem-solving/Lessons_Learned_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Lessons Learned Register">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#166534'}}><a href="/downloads/problem-solving/Problem_Solving_Quick_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Quick Guide PDF">Quick Guide PDF</a><a href="/downloads/problem-solving/Problem_Solving_Quick_Guide.pdf" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Quick Guide PDF">⬇</a></span>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 overflow-x-auto flex-wrap">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === i ? 'bg-red-700 text-white' : 'text-[#1e3a5f] hover:text-white hover:bg-white/10'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && <EightDTab />}
      {activeTab === 1 && <FiveWhyTab />}
      {activeTab === 2 && <FishboneTab />}
      {activeTab === 3 && <CAPATab />}
      {activeTab === 4 && <LessonsTab />}
      <QualityCopilot page="8d" />
    </div>
  );
}