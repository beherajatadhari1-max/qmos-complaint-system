'use client';
import { useState } from 'react';

interface PFMEAHeader {
  company: string; customer: string; modelYear: string; partNo: string;
  partName: string; fmeaNo: string; coreTeam: string; preparedBy: string;
  dateOriginal: string; dateRevised: string; confidentiality: string;
}

interface PFMEARow {
  id: string;
  itemNo: string; processStep: string; workElement: string;
  functionStep: string; functionWork: string;
  failureEffect: string; severity: number; failureMode: string; failureCause: string;
  preventionControls: string; occurrence: number; detectionControls: string; detection: number; ap: string;
  filterCode: string; preventionAction: string; detectionAction: string;
  responsible: string; targetDate: string; status: string;
  severityAfter: number; occurrenceAfter: number; detectionAfter: number; apAfter: string;
}

function calcAP(s: number, o: number, d: number): string {
  if (!s || !o || !d) return '';
  if (s >= 9) {
    if (o >= 4) return 'H';
    if (o >= 2) return d >= 2 ? 'H' : 'M';
    return d >= 4 ? 'M' : 'L';
  }
  if (s >= 7) {
    if (o >= 6) return 'H';
    if (o >= 4) return d >= 2 ? 'H' : 'M';
    if (o >= 2) return d >= 4 ? 'H' : d >= 2 ? 'M' : 'L';
    return d >= 7 ? 'M' : 'L';
  }
  if (s >= 4) {
    if (o >= 6) return d >= 4 ? 'H' : 'M';
    if (o >= 4) return d >= 7 ? 'H' : d >= 2 ? 'M' : 'L';
    if (o >= 2) return d >= 4 ? 'M' : 'L';
    return 'L';
  }
  return (o >= 6 && d >= 7) ? 'M' : 'L';
}

function apBadge(ap: string) {
  if (ap === 'H') return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white">{ap}</span>;
  if (ap === 'M') return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-400 text-black">{ap}</span>;
  if (ap === 'L') return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-600 text-white">{ap}</span>;
  return <span className="text-gray-500 text-xs">—</span>;
}

const newRow = (): PFMEARow => ({
  id: Math.random().toString(36).slice(2),
  itemNo: '', processStep: '', workElement: '',
  functionStep: '', functionWork: '',
  failureEffect: '', severity: 0, failureMode: '', failureCause: '',
  preventionControls: '', occurrence: 0, detectionControls: '', detection: 0, ap: '',
  filterCode: '', preventionAction: '', detectionAction: '',
  responsible: '', targetDate: '', status: '',
  severityAfter: 0, occurrenceAfter: 0, detectionAfter: 0, apAfter: '',
});

export default function PFMEAPage() {
  const [header, setHeader] = useState<PFMEAHeader>({
    company: '', customer: '', modelYear: '', partNo: '', partName: '',
    fmeaNo: '', coreTeam: '', preparedBy: '', dateOriginal: '', dateRevised: '',
    confidentiality: 'Internal',
  });
  const [rows, setRows] = useState<PFMEARow[]>([newRow()]);
  const [saving, setSaving] = useState(false);

  const setHdr = (k: keyof PFMEAHeader, v: string) => setHeader(h => ({ ...h, [k]: v }));

  const setRow = (id: string, k: keyof PFMEARow, v: any) => {
    setRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      const u: any = { ...r, [k]: v };
      if (['severity','occurrence','detection'].includes(k as string))
        u.ap = calcAP(k==='severity'?v:u.severity, k==='occurrence'?v:u.occurrence, k==='detection'?v:u.detection);
      if (['severityAfter','occurrenceAfter','detectionAfter'].includes(k as string))
        u.apAfter = calcAP(k==='severityAfter'?v:u.severityAfter, k==='occurrenceAfter'?v:u.occurrenceAfter, k==='detectionAfter'?v:u.detectionAfter);
      return u;
    }));
  };

  const addRow = () => setRows(rs => [...rs, newRow()]);
  const delRow = (id: string) => setRows(rs => rs.filter(r => r.id !== id));

  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('PFMEA');
    const border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
    [
      ['PROCESS FAILURE MODE AND EFFECTS ANALYSIS (PFMEA) — AIAG VDA 2019'],
      [],
      ['Company:', header.company, '', 'Customer:', header.customer, '', 'Model Year:', header.modelYear, '', 'FMEA No:', header.fmeaNo],
      ['Part No:', header.partNo, '', 'Part Name:', header.partName, '', 'Core Team:', header.coreTeam],
      ['Prepared By:', header.preparedBy, '', 'Date (Orig):', header.dateOriginal, '', 'Date (Rev):', header.dateRevised, '', 'Confidentiality:', header.confidentiality],
      [],
      ['STRUCTURE', '', '', 'FUNCTION', '', 'FAILURE ANALYSIS', '', '', '', 'RISK — CURRENT STATE', '', '', '', '', 'OPTIMIZATION', '', '', '', '', '', '', '', '', ''],
      ['Item #','Process Step (Focus Element)','Work Element (4M)','Function of Process Step','Function of Work Element','Failure Effect (FE)','S','Failure Mode (FM)','Failure Cause (FC)','Prevention Controls (PC)','O','Detection Controls (DC)','D','AP','Filter Code','Prevention Action','Detection Action','Responsible','Target Date','Status','S\'','O\'','D\'','AP\''],
    ].forEach(r => ws.addRow(r));
    rows.forEach(r => ws.addRow([
      r.itemNo, r.processStep, r.workElement, r.functionStep, r.functionWork,
      r.failureEffect, r.severity||'', r.failureMode, r.failureCause,
      r.preventionControls, r.occurrence||'', r.detectionControls, r.detection||'', r.ap,
      r.filterCode, r.preventionAction, r.detectionAction, r.responsible, r.targetDate, r.status,
      r.severityAfter||'', r.occurrenceAfter||'', r.detectionAfter||'', r.apAfter,
    ]));
    ws.eachRow(row => row.eachCell({ includeEmpty: false }, (cell: any) => { cell.border = border; }));
    ws.columns = [
      {width:8},{width:26},{width:22},{width:24},{width:22},
      {width:28},{width:5},{width:26},{width:26},
      {width:26},{width:5},{width:26},{width:5},{width:5},
      {width:10},{width:24},{width:24},{width:20},{width:12},{width:12},
      {width:5},{width:5},{width:5},{width:5},
    ];
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PFMEA_${header.partNo||'export'}_${header.fmeaNo||'R0'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToDB = async () => {
    setSaving(true);
    try {
      await fetch('/api/pfmea', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({header, rows}) });
      alert('Saved!');
    } catch { alert('Save failed.'); }
    setSaving(false);
  };

  const inp = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-full';
  const ta = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-full min-h-[52px] resize-y';
  const num = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-11 text-center';
  const th = 'px-2 py-1.5 border border-gray-500 text-xs font-bold text-center whitespace-nowrap';
  const td = 'px-1 py-0.5 border border-gray-700 align-top';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-red-400">⚠️ PFMEA Generator</h1>
        <p className="text-gray-400 text-sm">AIAG VDA FMEA Handbook 1st Edition 2019 — 7-Step Approach | Action Priority replaces RPN</p>
      </div>

      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <h2 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">FMEA Header</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['Company','company'],['Customer','customer'],['Model Year / Program','modelYear'],['FMEA Number','fmeaNo'],
            ['Part Number','partNo'],['Part Name','partName'],['Core Team','coreTeam'],['Prepared By','preparedBy']].map(([lbl,key])=>(
            <div key={key}>
              <label className="text-xs text-gray-400 block mb-0.5">{lbl}</label>
              <input className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
                value={(header as any)[key]} onChange={e=>setHdr(key as keyof PFMEAHeader, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Date (Original)</label>
            <input type="date" className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
              value={header.dateOriginal} onChange={e=>setHdr('dateOriginal',e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Date (Revised)</label>
            <input type="date" className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
              value={header.dateRevised} onChange={e=>setHdr('dateRevised',e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Confidentiality</label>
            <select className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
              value={header.confidentiality} onChange={e=>setHdr('confidentiality',e.target.value)}>
              <option>Internal</option><option>Confidential</option><option>Public</option>
            </select>
          </div>
        </div>
      </div>

      {/* AP Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs items-center">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">H — High (Must Act)</span>
        <span className="bg-yellow-400 text-black px-2 py-0.5 rounded font-bold">M — Medium (Should Act)</span>
        <span className="bg-green-600 text-white px-2 py-0.5 rounded font-bold">L — Low (Review)</span>
        <span className="text-gray-400">AP auto-calculated per AIAG VDA 2019 S/O/D table</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-4">
        <table className="text-xs min-w-max border-collapse">
          <thead>
            <tr>
              <th colSpan={3} className={`${th} bg-blue-900 text-blue-200`}>STRUCTURE (Step 2)</th>
              <th colSpan={2} className={`${th} bg-green-900 text-green-200`}>FUNCTION (Step 3)</th>
              <th colSpan={4} className={`${th} bg-orange-900 text-orange-200`}>FAILURE ANALYSIS (Step 4)</th>
              <th colSpan={5} className={`${th} bg-red-900 text-red-200`}>RISK — CURRENT STATE (Step 5)</th>
              <th colSpan={9} className={`${th} bg-purple-900 text-purple-200`}>OPTIMIZATION (Steps 6–7)</th>
              <th className={`${th} bg-gray-700`}></th>
            </tr>
            <tr>
              <th className={`${th} bg-blue-950 text-blue-200 w-14`}>Item #</th>
              <th className={`${th} bg-blue-950 text-blue-200 w-44`}>Process Step<br/>(Focus Element)</th>
              <th className={`${th} bg-blue-950 text-blue-200 w-36`}>Work Element<br/>(4M)</th>
              <th className={`${th} bg-green-950 text-green-200 w-36`}>Function of<br/>Process Step</th>
              <th className={`${th} bg-green-950 text-green-200 w-36`}>Function of<br/>Work Element</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-44`}>Failure Effect (FE)<br/>→ Customer</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-8`}>S</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-40`}>Failure Mode (FM)<br/>at Focus Element</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-40`}>Failure Cause (FC)<br/>of Work Element</th>
              <th className={`${th} bg-red-950 text-red-200 w-40`}>Prevention<br/>Controls (PC)</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>O</th>
              <th className={`${th} bg-red-950 text-red-200 w-40`}>Detection<br/>Controls (DC)</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>D</th>
              <th className={`${th} bg-red-950 text-red-200 w-10`}>AP</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-16`}>Filter<br/>Code</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-36`}>Prevention<br/>Action</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-36`}>Detection<br/>Action</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Responsible</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Target Date</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>Status</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>S'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>O'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>D'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-10`}>AP'</th>
              <th className={`${th} bg-gray-700 w-8`}>Del</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.id} className={i%2===0?'bg-gray-900':'bg-gray-850'}>
                <td className={td}><input className={inp} value={r.itemNo} onChange={e=>setRow(r.id,'itemNo',e.target.value)} placeholder="1.1"/></td>
                <td className={td}><textarea className={ta} value={r.processStep} onChange={e=>setRow(r.id,'processStep',e.target.value)} placeholder="e.g. Welding Station"/></td>
                <td className={td}><textarea className={ta} value={r.workElement} onChange={e=>setRow(r.id,'workElement',e.target.value)} placeholder="e.g. Welding Robot (Machine)"/></td>
                <td className={td}><textarea className={ta} value={r.functionStep} onChange={e=>setRow(r.id,'functionStep',e.target.value)} placeholder="Join parts A&B, 5kN min strength"/></td>
                <td className={td}><textarea className={ta} value={r.functionWork} onChange={e=>setRow(r.id,'functionWork',e.target.value)} placeholder="Apply 150A ±5A current"/></td>
                <td className={td}><textarea className={ta} value={r.failureEffect} onChange={e=>setRow(r.id,'failureEffect',e.target.value)} placeholder="Weld fails in service → safety risk to customer"/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.severity||''} onChange={e=>setRow(r.id,'severity',+e.target.value)}/></td>
                <td className={td}><textarea className={ta} value={r.failureMode} onChange={e=>setRow(r.id,'failureMode',e.target.value)} placeholder="Insufficient weld penetration"/></td>
                <td className={td}><textarea className={ta} value={r.failureCause} onChange={e=>setRow(r.id,'failureCause',e.target.value)} placeholder="Robot current out of spec"/></td>
                <td className={td}><textarea className={ta} value={r.preventionControls} onChange={e=>setRow(r.id,'preventionControls',e.target.value)} placeholder="PM schedule, calibration plan"/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrence||''} onChange={e=>setRow(r.id,'occurrence',+e.target.value)}/></td>
                <td className={td}><textarea className={ta} value={r.detectionControls} onChange={e=>setRow(r.id,'detectionControls',e.target.value)} placeholder="Visual inspection, torque test"/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.detection||''} onChange={e=>setRow(r.id,'detection',+e.target.value)}/></td>
                <td className={`${td} text-center`}>{apBadge(r.ap)}</td>
                <td className={td}><input className={inp} value={r.filterCode} onChange={e=>setRow(r.id,'filterCode',e.target.value)} placeholder="F1"/></td>
                <td className={td}><textarea className={ta} value={r.preventionAction} onChange={e=>setRow(r.id,'preventionAction',e.target.value)} placeholder="Increase PM frequency"/></td>
                <td className={td}><textarea className={ta} value={r.detectionAction} onChange={e=>setRow(r.id,'detectionAction',e.target.value)} placeholder="Add 100% pull test"/></td>
                <td className={td}><input className={inp} value={r.responsible} onChange={e=>setRow(r.id,'responsible',e.target.value)} placeholder="J. Smith"/></td>
                <td className={td}><input type="date" className={inp} value={r.targetDate} onChange={e=>setRow(r.id,'targetDate',e.target.value)}/></td>
                <td className={td}>
                  <select className={inp} value={r.status} onChange={e=>setRow(r.id,'status',e.target.value)}>
                    <option value="">Select</option>
                    <option>Open</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                  </select>
                </td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.severityAfter||''} onChange={e=>setRow(r.id,'severityAfter',+e.target.value)}/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrenceAfter||''} onChange={e=>setRow(r.id,'occurrenceAfter',+e.target.value)}/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.detectionAfter||''} onChange={e=>setRow(r.id,'detectionAfter',+e.target.value)}/></td>
                <td className={`${td} text-center`}>{apBadge(r.apAfter)}</td>
                <td className={td}><button onClick={()=>delRow(r.id)} className="text-red-400 hover:text-red-200 text-sm px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={addRow} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded font-medium">+ Add Row</button>
        <button onClick={exportExcel} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded font-medium">📊 Export Excel</button>
        <button onClick={saveToDB} disabled={saving} className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded font-medium disabled:opacity-50">{saving?'Saving...':'💾 Save to DB'}</button>
      </div>

      {/* Rating Guide */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">AIAG VDA 2019 Rating Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-bold text-red-400 mb-1">Severity (S) — Effect on Customer</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> — Safety impact without warning</p>
              <p><span className="text-white font-medium">9</span> — Safety impact with warning</p>
              <p><span className="text-white font-medium">7–8</span> — Major function lost</p>
              <p><span className="text-white font-medium">5–6</span> — Reduced function, customer dissatisfied</p>
              <p><span className="text-white font-medium">3–4</span> — Minor defect noticed by customer</p>
              <p><span className="text-white font-medium">1–2</span> — No discernible effect</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-yellow-400 mb-1">Occurrence (O) — Failure Rate</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> — ≥1 in 2 (50%)</p>
              <p><span className="text-white font-medium">8–9</span> — 1 in 8 to 1 in 20</p>
              <p><span className="text-white font-medium">6–7</span> — 1 in 80 to 1 in 400</p>
              <p><span className="text-white font-medium">4–5</span> — 1 in 2,000 to 1 in 15,000</p>
              <p><span className="text-white font-medium">2–3</span> — 1 in 150,000 to 1 in 1.5M</p>
              <p><span className="text-white font-medium">1</span> — ≤1 in 1.5M (failure unlikely)</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-blue-400 mb-1">Detection (D) — Detectability</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> — Cannot / will not detect</p>
              <p><span className="text-white font-medium">8–9</span> — Remote chance of detection</p>
              <p><span className="text-white font-medium">6–7</span> — Low chance of detection</p>
              <p><span className="text-white font-medium">4–5</span> — Moderate chance detected</p>
              <p><span className="text-white font-medium">2–3</span> — High chance detected</p>
              <p><span className="text-white font-medium">1</span> — Almost certain detection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
