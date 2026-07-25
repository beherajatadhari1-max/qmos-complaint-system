'use client';
import { useState } from 'react';

interface PFMEAHeader {
  companyName: string;
  manufacturingLocation: string;
  customerName: string;
  modelYear: string;
  subject: string;
  pfmeaStartDate: string;
  pfmeaIdNumber: string;
  pfmeaRevisionDate: string;
  processResponsibility: string;
  crossFunctionalTeam: string;
  securityClassification: string;
}

interface PFMEARow {
  id: string;
  // STRUCTURE ANALYSIS
  processItem: string;
  processStep: string;
  workElement4M: string;
  // FUNCTION ANALYSIS
  functionProcessItem: string;
  functionProcessStep: string;
  functionWorkElement: string;
  // FAILURE ANALYSIS
  failureEffects: string;
  severity: number;
  failureMode: string;
  failureCause: string;
  // RISK ANALYSIS
  preventionControls: string;
  occurrence: number;
  detectionControls: string;
  detection: number;
  ap: string;
  specialCharacteristics: string;
  filterCode: string;
  // OPTIMIZATION
  preventionAction: string;
  detectionAction: string;
  responsible: string;
  targetDate: string;
  status: string;
  actionTaken: string;
  completionDate: string;
  severityAfter: number;
  occurrenceAfter: number;
  detectionAfter: number;
  apAfter: string;
  remarks: string;
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
  processItem: '', processStep: '', workElement4M: '',
  functionProcessItem: '', functionProcessStep: '', functionWorkElement: '',
  failureEffects: '', severity: 0, failureMode: '', failureCause: '',
  preventionControls: '', occurrence: 0, detectionControls: '', detection: 0, ap: '',
  specialCharacteristics: '', filterCode: '',
  preventionAction: '', detectionAction: '', responsible: '', targetDate: '',
  status: '', actionTaken: '', completionDate: '',
  severityAfter: 0, occurrenceAfter: 0, detectionAfter: 0, apAfter: '', remarks: '',
});

export default function PFMEAPage() {
  const [header, setHeader] = useState<PFMEAHeader>({
    companyName: '', manufacturingLocation: '', customerName: '', modelYear: '',
    subject: '', pfmeaStartDate: '', pfmeaIdNumber: '', pfmeaRevisionDate: '',
    processResponsibility: '', crossFunctionalTeam: '', securityClassification: 'Internal',
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
    const border: any = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };

    // Title row
    ws.addRow(['AIAG VDA PROCESS FAILURE MODE AND EFFECTS ANALYSIS (PFMEA)']);
    ws.addRow([]);
    // Header rows
    ws.addRow(['Company Name:', header.companyName, '', '', '', '', 'Subject:', header.subject]);
    ws.addRow(['Manufacturing Location:', header.manufacturingLocation, '', '', '', '', 'PFMEA Start Date:', header.pfmeaStartDate, '', 'PFMEA ID Number:', header.pfmeaIdNumber]);
    ws.addRow(['Customer Name:', header.customerName, '', '', '', '', 'PFMEA Revision Date:', header.pfmeaRevisionDate, '', 'Process Responsibility:', header.processResponsibility]);
    ws.addRow(['Model Year(s) / Program(s):', header.modelYear, '', '', '', '', 'Cross-Functional Team:', header.crossFunctionalTeam, '', 'Security Classification:', header.securityClassification]);
    ws.addRow([]);
    // Group headers
    ws.addRow(['STRUCTURE ANALYSIS','','','','FUNCTION ANALYSIS','','','','','FAILURE ANALYSIS','','','','','RISK ANALYSIS','','','','','','','OPTIMIZATION','','','','','','','','','','','']);
    // Column headers
    ws.addRow([
      '1. Process Item\n(System/Subsystem/Part Element or Name of Process)',
      '2. Process Step\nStation No. and Name of Focus Element','',
      '3. Process Work Element\n4M Type',
      '1. Function of the Process Item',  '',
      '2. Function of the Process Step\nand Product Characteristic',
      '3. Function of the Process Work Element\nand Process Characteristic', '',
      '1. Failure Effects (FE)','',
      'Severity\n(S) of FE',
      '2. Failure Mode\n(FM) of the Focus Element',
      '3. Failure Cause\n(FC) of the Work Element',
      'Current Prevention Control (PC) of FC',
      'Occurrence\n(O) of FC',
      'Current Detection Control (DC) of FC or FM',
      'Detection\n(D) of FC/FM',
      'PFMEA AP',
      'Special\nCharacteristics',
      'Filter Code\n(Optional)',
      'PFMEA Prevention Action',
      'PFMEA Detection Action',
      "Responsible Person's Name",
      'Target Completion Date',
      'Status',
      'Action Taken with Pointer to Evidence',
      'Completion Date',
      'Severity\n(S)',
      'Occurrence\n(O)',
      'Detection\n(D)',
      'PFMEA AP',
      'Remarks',
    ]);
    // Data rows
    rows.forEach(r => ws.addRow([
      r.processItem, r.processStep, '',
      r.workElement4M, r.functionProcessItem, '',
      r.functionProcessStep, r.functionWorkElement, '',
      r.failureEffects, '',
      r.severity||'', r.failureMode, r.failureCause,
      r.preventionControls, r.occurrence||'', r.detectionControls, r.detection||'', r.ap,
      r.specialCharacteristics, r.filterCode,
      r.preventionAction, r.detectionAction, r.responsible, r.targetDate, r.status,
      r.actionTaken, r.completionDate,
      r.severityAfter||'', r.occurrenceAfter||'', r.detectionAfter||'', r.apAfter, r.remarks,
    ]));
    ws.eachRow(row => row.eachCell({ includeEmpty: false }, (cell: any) => { cell.border = border; }));
    ws.columns = [
      {width:22},{width:20},{width:4},{width:16},
      {width:22},{width:4},{width:24},{width:24},{width:4},
      {width:28},{width:4},{width:5},{width:22},{width:22},
      {width:26},{width:5},{width:26},{width:5},{width:7},
      {width:14},{width:10},
      {width:22},{width:22},{width:18},{width:14},{width:22},
      {width:24},{width:14},
      {width:5},{width:5},{width:5},{width:7},{width:14},
    ];
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PFMEA_${header.subject||'export'}_${header.pfmeaIdNumber||'R0'}.xlsx`;
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
  const ta = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-full min-h-[48px] resize-y';
  const num = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-10 text-center';
  const th = 'px-1.5 py-1.5 border border-gray-500 text-xs font-bold text-center whitespace-pre-line leading-tight';
  const td = 'px-1 py-0.5 border border-gray-700 align-top';

  const hdrFields: [string, keyof PFMEAHeader, string?][] = [
    ['Company Name', 'companyName'],
    ['Manufacturing Location', 'manufacturingLocation'],
    ['Customer Name', 'customerName'],
    ['Model Year(s) / Program(s)', 'modelYear'],
    ['Subject', 'subject'],
    ['PFMEA Start Date', 'pfmeaStartDate', 'date'],
    ['PFMEA ID Number', 'pfmeaIdNumber'],
    ['PFMEA Revision Date', 'pfmeaRevisionDate', 'date'],
    ['Process Responsibility', 'processResponsibility'],
    ['Cross-Functional Team', 'crossFunctionalTeam'],
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-red-400">⚠️ PFMEA Generator</h1>
        <p className="text-gray-400 text-sm">AIAG VDA FMEA Handbook 1st Edition 2019 — 7-Step Approach | Action Priority replaces RPN</p>
      </div>

      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <h2 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">PFMEA Header</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {hdrFields.map(([lbl,key,type])=>(
            <div key={key}>
              <label className="text-xs text-gray-400 block mb-0.5">{lbl}</label>
              <input type={type||'text'} className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
                value={header[key]} onChange={e=>setHdr(key,e.target.value)} />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Security Classification</label>
            <select className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
              value={header.securityClassification} onChange={e=>setHdr('securityClassification',e.target.value)}>
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
              <th colSpan={3} className={`${th} bg-blue-900 text-blue-200`}>STRUCTURE ANALYSIS</th>
              <th colSpan={4} className={`${th} bg-green-900 text-green-200`}>FUNCTION ANALYSIS</th>
              <th colSpan={5} className={`${th} bg-orange-900 text-orange-200`}>FAILURE ANALYSIS</th>
              <th colSpan={7} className={`${th} bg-red-900 text-red-200`}>RISK ANALYSIS</th>
              <th colSpan={12} className={`${th} bg-purple-900 text-purple-200`}>OPTIMIZATION</th>
              <th className={`${th} bg-gray-700`}></th>
            </tr>
            <tr>
              {/* STRUCTURE */}
              <th className={`${th} bg-blue-950 text-blue-200 w-32`}>1. Process Item{'\n'}(System/Part)</th>
              <th className={`${th} bg-blue-950 text-blue-200 w-36`}>2. Process Step{'\n'}(Station No. & Focus Element)</th>
              <th className={`${th} bg-blue-950 text-blue-200 w-28`}>3. Work Element{'\n'}(4M Type)</th>
              {/* FUNCTION */}
              <th className={`${th} bg-green-950 text-green-200 w-32`}>1. Function of{'\n'}Process Item</th>
              <th className={`${th} bg-green-950 text-green-200 w-36`}>2. Function of Process Step{'\n'}+ Product Char.</th>
              <th className={`${th} bg-green-950 text-green-200 w-36`}>3. Function of Work Element{'\n'}+ Process Char.</th>
              {/* FAILURE */}
              <th className={`${th} bg-orange-950 text-orange-200 w-40`}>1. Failure Effects (FE){'\n'}↑ Customer</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-8`}>S</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-36`}>2. Failure Mode (FM){'\n'}at Focus Element</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-36`}>3. Failure Cause (FC){'\n'}of Work Element</th>
              {/* RISK */}
              <th className={`${th} bg-red-950 text-red-200 w-36`}>Prevention Controls{'\n'}(PC) of FC</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>O</th>
              <th className={`${th} bg-red-950 text-red-200 w-36`}>Detection Controls{'\n'}(DC) of FC/FM</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>D</th>
              <th className={`${th} bg-red-950 text-red-200 w-10`}>AP</th>
              <th className={`${th} bg-red-950 text-red-200 w-16`}>Special{'\n'}Char.</th>
              <th className={`${th} bg-red-950 text-red-200 w-14`}>Filter{'\n'}Code</th>
              {/* OPTIMIZATION */}
              <th className={`${th} bg-purple-950 text-purple-200 w-32`}>Prevention{'\n'}Action</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-32`}>Detection{'\n'}Action</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>Responsible{'\n'}Person</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>Target{'\n'}Completion Date</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Status</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-32`}>Action Taken{'\n'}(+ Evidence)</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>Completion{'\n'}Date</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>S'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>O'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>D'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-10`}>AP'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>Remarks</th>
              <th className={`${th} bg-gray-700 w-8`}>Del</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.id} className={i%2===0?'bg-gray-900':'bg-gray-850'}>
                <td className={td}><textarea className={ta} value={r.processItem} onChange={e=>setRow(r.id,'processItem',e.target.value)} placeholder="e.g. Suspension Seat Assembly"/></td>
                <td className={td}><textarea className={ta} value={r.processStep} onChange={e=>setRow(r.id,'processStep',e.target.value)} placeholder="e.g. 10 - Incoming Inspection"/></td>
                <td className={td}>
                  <select className={inp} value={r.workElement4M} onChange={e=>setRow(r.id,'workElement4M',e.target.value)}>
                    <option value="">—</option>
                    <option>Man</option><option>Machine</option><option>Material</option><option>Method</option>
                  </select>
                </td>
                <td className={td}><textarea className={ta} value={r.functionProcessItem} onChange={e=>setRow(r.id,'functionProcessItem',e.target.value)} placeholder="e.g. Inplant / Ship to plant / End user"/></td>
                <td className={td}><textarea className={ta} value={r.functionProcessStep} onChange={e=>setRow(r.id,'functionProcessStep',e.target.value)} placeholder="e.g. OK part as OK"/></td>
                <td className={td}><textarea className={ta} value={r.functionWorkElement} onChange={e=>setRow(r.id,'functionWorkElement',e.target.value)} placeholder="e.g. L3 inspector"/></td>
                <td className={td}><textarea className={ta} value={r.failureEffects} onChange={e=>setRow(r.id,'failureEffects',e.target.value)} placeholder="1. Inplant: ...\n2. Ship to plant: ...\n3. End user: ..."/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.severity||''} onChange={e=>setRow(r.id,'severity',+e.target.value)}/></td>
                <td className={td}><textarea className={ta} value={r.failureMode} onChange={e=>setRow(r.id,'failureMode',e.target.value)} placeholder="e.g. OK part as Not OK"/></td>
                <td className={td}><textarea className={ta} value={r.failureCause} onChange={e=>setRow(r.id,'failureCause',e.target.value)} placeholder="e.g. Inspector below L3"/></td>
                <td className={td}><textarea className={ta} value={r.preventionControls} onChange={e=>setRow(r.id,'preventionControls',e.target.value)} placeholder="PM schedule, calibration plan"/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrence||''} onChange={e=>setRow(r.id,'occurrence',+e.target.value)}/></td>
                <td className={td}><textarea className={ta} value={r.detectionControls} onChange={e=>setRow(r.id,'detectionControls',e.target.value)} placeholder="Visual inspection, torque test"/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.detection||''} onChange={e=>setRow(r.id,'detection',+e.target.value)}/></td>
                <td className={`${td} text-center`}>{apBadge(r.ap)}</td>
                <td className={td}><input className={inp} value={r.specialCharacteristics} onChange={e=>setRow(r.id,'specialCharacteristics',e.target.value)} placeholder="CC/SC"/></td>
                <td className={td}><input className={inp} value={r.filterCode} onChange={e=>setRow(r.id,'filterCode',e.target.value)} placeholder="F1"/></td>
                <td className={td}><textarea className={ta} value={r.preventionAction} onChange={e=>setRow(r.id,'preventionAction',e.target.value)} placeholder="Increase PM frequency"/></td>
                <td className={td}><textarea className={ta} value={r.detectionAction} onChange={e=>setRow(r.id,'detectionAction',e.target.value)} placeholder="Add 100% pull test"/></td>
                <td className={td}><input className={inp} value={r.responsible} onChange={e=>setRow(r.id,'responsible',e.target.value)} placeholder="J. Smith"/></td>
                <td className={td}><input type="date" className={inp} value={r.targetDate} onChange={e=>setRow(r.id,'targetDate',e.target.value)}/></td>
                <td className={td}>
                  <select className={inp} value={r.status} onChange={e=>setRow(r.id,'status',e.target.value)}>
                    <option value="">Select</option>
                    <option>Open</option><option>Decision Pending</option><option>Implementation Pending</option><option>Completed</option><option>Not Implemented</option>
                  </select>
                </td>
                <td className={td}><textarea className={ta} value={r.actionTaken} onChange={e=>setRow(r.id,'actionTaken',e.target.value)} placeholder="Action taken + evidence ref"/></td>
                <td className={td}><input type="date" className={inp} value={r.completionDate} onChange={e=>setRow(r.id,'completionDate',e.target.value)}/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.severityAfter||''} onChange={e=>setRow(r.id,'severityAfter',+e.target.value)}/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrenceAfter||''} onChange={e=>setRow(r.id,'occurrenceAfter',+e.target.value)}/></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.detectionAfter||''} onChange={e=>setRow(r.id,'detectionAfter',+e.target.value)}/></td>
                <td className={`${td} text-center`}>{apBadge(r.apAfter)}</td>
                <td className={td}><textarea className={ta} value={r.remarks} onChange={e=>setRow(r.id,'remarks',e.target.value)} placeholder="Remarks"/></td>
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

      {/* Rating Reference */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">AIAG VDA 2019 Rating Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-bold text-red-400 mb-1">Severity (S) — Effect on Customer</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> — Safety impact without warning</p>
              <p><span className="text-white font-medium">9</span> — Safety/regulatory noncompliance</p>
              <p><span className="text-white font-medium">7–8</span> — Major function lost / line shutdown</p>
              <p><span className="text-white font-medium">5–6</span> — Reduced function, rework required</p>
              <p><span className="text-white font-medium">3–4</span> — Minor defect noticed by customer</p>
              <p><span className="text-white font-medium">1–2</span> — No discernible effect</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-yellow-400 mb-1">Occurrence (O) — Failure Rate</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> — No prevention controls</p>
              <p><span className="text-white font-medium">9</span> — Controls little effect (behavioral)</p>
              <p><span className="text-white font-medium">7–8</span> — Controls somewhat effective</p>
              <p><span className="text-white font-medium">5–6</span> — Controls are effective</p>
              <p><span className="text-white font-medium">3–4</span> — Controls highly effective</p>
              <p><span className="text-white font-medium">1–2</span> — Controls extremely effective (technical)</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-blue-400 mb-1">Detection (D) — Detectability</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> — Cannot / will not detect</p>
              <p><span className="text-white font-medium">8–9</span> — Remote chance / low detectability</p>
              <p><span className="text-white font-medium">6–7</span> — Human inspection (moderate)</p>
              <p><span className="text-white font-medium">4–5</span> — Machine-based detection downstream</p>
              <p><span className="text-white font-medium">2–3</span> — Machine-based in-station detection</p>
              <p><span className="text-white font-medium">1</span> — Failure mode cannot be produced</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
