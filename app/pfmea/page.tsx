'use client';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface PFMEAHeader {
  companyName: string;
  manufacturingLocation: string;
  customerName: string;
  modelYear: string;
  subject: string;
  partNumber: string;
  designResponsibility: string;
  processResponsibility: string;
  pfmeaIdNumber: string;
  pfmeaStartDate: string;
  pfmeaRevisionDate: string;
  crossFunctionalTeam: string;
  securityClassification: string;
}

interface PFMEARow {
  id: string;
  processItem: string;
  processStep: string;
  workElement4M: string;
  functionProcessItem: string;
  functionProcessStep: string;
  functionWorkElement: string;
  failureEffects: string;
  severity: number;
  failureMode: string;
  failureCause: string;
  preventionControls: string;
  occurrence: number;
  detectionControls: string;
  detection: number;
  ap: string;
  specialCharacteristics: string;
  filterCode: string;
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
  return <span className="text-gray-500 text-xs">{'—'}</span>;
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

const SAMPLE_ROWS: Partial<PFMEARow>[] = [
  { processItem:'Seat Frame Assembly', processStep:'10 — Incoming Inspection', workElement4M:'Man', functionProcessItem:'Deliver defect-free frames to production', functionProcessStep:'Verify frame dimensions within drawing tolerance', functionWorkElement:'Trained L3 IQC inspector performs layout check', failureEffects:'Inplant: Defective frame passes to assembly\nShip: Non-conforming seat dispatched\nEnd user: Seat collapse / injury risk', severity:9, failureMode:'Defective frame accepted as OK', failureCause:'Inspector not trained on critical dimensions', preventionControls:'Inspector competency matrix — L3 required for frame inspection', occurrence:4, detectionControls:'Ballooned drawing check + CMM spot check (5% sample)', detection:5, specialCharacteristics:'CC', filterCode:'F1' },
  { processItem:'Seat Frame Assembly', processStep:'20 — Welding Station', workElement4M:'Machine', functionProcessItem:'Weld cross-member to main frame with required strength', functionProcessStep:'MIG weld per WPS-021 drawing spec', functionWorkElement:'Welding robot set to correct parameters', failureEffects:'Inplant: Weld fail at function test\nShip: Customer return\nEnd user: Seat collapses under load', severity:10, failureMode:'Insufficient weld penetration', failureCause:'Welding robot wire feed speed out of spec', preventionControls:'Robot parameter lock + weekly PM calibration', occurrence:3, detectionControls:'100% weld visual + destructive pull test (1/shift)', detection:3, specialCharacteristics:'CC', filterCode:'F1' },
  { processItem:'Seat Frame Assembly', processStep:'30 — Powder Coating', workElement4M:'Material', functionProcessItem:'Corrosion protection — coating thickness 60–80 micron', functionProcessStep:'Powder coat frame to spec CQI-12', functionWorkElement:'Correct powder material batch loaded', failureEffects:'Inplant: Coating thickness NG\nShip: Cosmetic rejection at customer\nEnd user: Rust/corrosion failure in field', severity:7, failureMode:'Coating thickness below 60 micron', failureCause:'Wrong powder batch used — lower flow rate', preventionControls:'Batch verification procedure — QC check before loading', occurrence:3, detectionControls:'Thickness gauge check — 5 points per frame (100%)', detection:2, specialCharacteristics:'SC', filterCode:'F2' },
];

export default function PFMEAPage() {
  const [mainTab, setMainTab] = useState<'generator'|'knowledge'|'steps'>('generator');
  const [header, setHeader] = useState<PFMEAHeader>({
    companyName: '', manufacturingLocation: '', customerName: '', modelYear: '',
    subject: '', partNumber: '', designResponsibility: '', processResponsibility: '',
    pfmeaIdNumber: '', pfmeaStartDate: '', pfmeaRevisionDate: '',
    crossFunctionalTeam: '', securityClassification: 'Internal',
  });
  const [rows, setRows] = useState<PFMEARow[]>([newRow()]);
  const [tab, setTab] = useState<'manual' | 'import'>('manual');
  const [saving, setSaving] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const setHdr = (k: keyof PFMEAHeader, v: string) => setHeader(h => ({ ...h, [k]: v }));

  const setRow = (id: string, k: keyof PFMEARow, v: any) => {
    setRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      const u: any = { ...r, [k]: v };
      if (['severity', 'occurrence', 'detection'].includes(k as string))
        u.ap = calcAP(k === 'severity' ? v : u.severity, k === 'occurrence' ? v : u.occurrence, k === 'detection' ? v : u.detection);
      if (['severityAfter', 'occurrenceAfter', 'detectionAfter'].includes(k as string))
        u.apAfter = calcAP(k === 'severityAfter' ? v : u.severityAfter, k === 'occurrenceAfter' ? v : u.occurrenceAfter, k === 'detectionAfter' ? v : u.detectionAfter);
      return u;
    }));
  };

  const addRow = () => setRows(rs => [...rs, newRow()]);
  const delRow = (id: string) => setRows(rs => rs.filter(r => r.id !== id));
  const loadSample = () => setRows(SAMPLE_ROWS.map(s => ({ ...newRow(), ...s, id: Math.random().toString(36).slice(2), ap: calcAP(s.severity||0, s.occurrence||0, s.detection||0) })));

  // Live AP summary
  const highAP = rows.filter(r => r.ap === 'H').length;
  const medAP  = rows.filter(r => r.ap === 'M').length;
  const lowAP  = rows.filter(r => r.ap === 'L').length;
  const doneAP = rows.filter(r => r.status === 'Completed').length;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Reading file...');
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      let dataStart = 0;
      for (let i = 0; i < Math.min(json.length, 15); i++) {
        const row = json[i].join(' ').toLowerCase();
        if (row.includes('process item') || row.includes('failure mode') || row.includes('severity')) {
          dataStart = i + 1;
          break;
        }
      }
      const imported: PFMEARow[] = [];
      for (let i = dataStart; i < json.length; i++) {
        const r = json[i];
        if (!r || r.every((c: any) => !c)) continue;
        const s = Number(r[8]) || 0;
        const o = Number(r[12]) || 0;
        const d = Number(r[14]) || 0;
        const sa = Number(r[25]) || 0;
        const oa = Number(r[26]) || 0;
        const da = Number(r[27]) || 0;
        imported.push({
          ...newRow(),
          processItem: String(r[1] || ''),
          processStep: String(r[2] || ''),
          workElement4M: String(r[3] || ''),
          functionProcessItem: String(r[4] || ''),
          functionProcessStep: String(r[5] || ''),
          functionWorkElement: String(r[6] || ''),
          failureEffects: String(r[7] || ''),
          severity: s,
          failureMode: String(r[9] || ''),
          failureCause: String(r[10] || ''),
          preventionControls: String(r[11] || ''),
          occurrence: o,
          detectionControls: String(r[13] || ''),
          detection: d,
          ap: calcAP(s, o, d),
          specialCharacteristics: String(r[15] || ''),
          filterCode: String(r[16] || ''),
          preventionAction: String(r[17] || ''),
          detectionAction: String(r[18] || ''),
          responsible: String(r[19] || ''),
          targetDate: String(r[20] || ''),
          status: String(r[21] || ''),
          actionTaken: String(r[22] || ''),
          completionDate: String(r[23] || ''),
          severityAfter: sa,
          occurrenceAfter: oa,
          detectionAfter: da,
          apAfter: calcAP(sa, oa, da),
          remarks: String(r[28] || ''),
        });
      }
      if (imported.length > 0) {
        setRows(imported);
        setImportStatus(`✓ Imported ${imported.length} row${imported.length !== 1 ? 's' : ''} successfully.`);
        setTab('manual');
      } else {
        setImportStatus('No data rows found. Ensure columns match AIAG-VDA PFMEA export format.');
      }
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('PFMEA');
    const border: any = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    ws.addRow(['AIAG VDA PROCESS FAILURE MODE AND EFFECTS ANALYSIS (PFMEA)']);
    ws.getRow(1).font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow(['Company Name:', header.companyName, '', '', 'Subject:', header.subject, '', '', 'Part Number:', header.partNumber]);
    ws.addRow(['Plant / Mfg. Location:', header.manufacturingLocation, '', '', 'PFMEA Start Date:', header.pfmeaStartDate, '', '', 'PFMEA ID No.:', header.pfmeaIdNumber]);
    ws.addRow(['Customer Name:', header.customerName, '', '', 'PFMEA Revision Date:', header.pfmeaRevisionDate, '', '', 'Design Responsibility:', header.designResponsibility]);
    ws.addRow(['Model Year / Program:', header.modelYear, '', '', 'Process Responsibility:', header.processResponsibility, '', '', 'Confidentiality:', header.securityClassification]);
    ws.addRow(['Cross-Functional Team:', header.crossFunctionalTeam]);
    ws.addRow([]);
    ws.addRow(['No.', '1. Process Item', '2. Process Step', '3. Work Element (4M)', '1. Function of Process Item', '2. Function of Process Step', '3. Function of Work Element', '1. Failure Effects (FE)', 'S', '2. Failure Mode (FM)', '3. Failure Cause (FC)', 'Prevention Controls (PC)', 'O', 'Detection Controls (DC)', 'D', 'AP', 'Special Char.', 'Filter Code', 'Prevention Action', 'Detection Action', 'Responsible', 'Target Date', 'Status', 'Action Taken (+Evidence)', 'Completion Date', "S'", "O'", "D'", "AP'", 'Remarks']);
    rows.forEach((r, i) => ws.addRow([i + 1, r.processItem, r.processStep, r.workElement4M, r.functionProcessItem, r.functionProcessStep, r.functionWorkElement, r.failureEffects, r.severity || '', r.failureMode, r.failureCause, r.preventionControls, r.occurrence || '', r.detectionControls, r.detection || '', r.ap, r.specialCharacteristics, r.filterCode, r.preventionAction, r.detectionAction, r.responsible, r.targetDate, r.status, r.actionTaken, r.completionDate, r.severityAfter || '', r.occurrenceAfter || '', r.detectionAfter || '', r.apAfter, r.remarks]));
    ws.eachRow(row => row.eachCell({ includeEmpty: false }, (cell: any) => { cell.border = border; }));
    ws.columns = [{ width: 5 }, { width: 22 }, { width: 22 }, { width: 14 }, { width: 22 }, { width: 24 }, { width: 24 }, { width: 28 }, { width: 5 }, { width: 22 }, { width: 22 }, { width: 26 }, { width: 5 }, { width: 26 }, { width: 5 }, { width: 7 }, { width: 14 }, { width: 10 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 14 }, { width: 22 }, { width: 24 }, { width: 14 }, { width: 5 }, { width: 5 }, { width: 5 }, { width: 7 }, { width: 14 }];
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PFMEA_${header.subject || 'export'}_${header.pfmeaIdNumber || 'R0'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToDB = async () => {
    setSaving(true);
    try {
      await fetch('/api/pfmea', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ header, rows }) });
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
    ['Plant / Mfg. Location', 'manufacturingLocation'],
    ['Customer Name', 'customerName'],
    ['Model Year / Program', 'modelYear'],
    ['Subject / Part Name', 'subject'],
    ['Part Number', 'partNumber'],
    ['Design Responsibility', 'designResponsibility'],
    ['Process Responsibility', 'processResponsibility'],
    ['PFMEA ID Number', 'pfmeaIdNumber'],
    ['PFMEA Start Date', 'pfmeaStartDate', 'date'],
    ['PFMEA Revision Date', 'pfmeaRevisionDate', 'date'],
    ['Cross-Functional Team', 'crossFunctionalTeam'],
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-red-950 border-b border-red-800 px-5 py-4">
        <div className="max-w-full">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold text-red-400">⚠️ PFMEA Generator</h1>
              <p className="text-red-300 text-sm">AIAG VDA FMEA Handbook 1st Edition 2019 — 7-Step Approach | Action Priority (AP) replaces RPN</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {highAP > 0 && <div className="bg-red-700 border border-red-500 rounded-lg px-3 py-1.5 text-center"><p className="text-lg font-bold">{highAP}</p><p className="text-xs text-red-300">High AP</p></div>}
              {medAP > 0  && <div className="bg-yellow-700 border border-yellow-500 rounded-lg px-3 py-1.5 text-center"><p className="text-lg font-bold">{medAP}</p><p className="text-xs text-yellow-300">Medium AP</p></div>}
              {lowAP > 0  && <div className="bg-green-800 border border-green-600 rounded-lg px-3 py-1.5 text-center"><p className="text-lg font-bold">{lowAP}</p><p className="text-xs text-green-300">Low AP</p></div>}
              <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-center"><p className="text-lg font-bold">{doneAP}</p><p className="text-xs text-gray-400">Completed</p></div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-center"><p className="text-lg font-bold">{rows.length}</p><p className="text-xs text-gray-400">Total Rows</p></div>
            </div>
          </div>
          {/* Tab Nav */}
          <div className="flex gap-1">
            {([['generator','⚙️ PFMEA Generator'],['knowledge','📚 Knowledge Hub'],['steps','📋 7-Step Guide']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setMainTab(id)}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition ${mainTab===id ? 'bg-gray-900 text-white' : 'text-red-300 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">

      {/* ── KNOWLEDGE HUB TAB ───────────────────────────────────────────── */}
      {mainTab === 'knowledge' && (
        <div className="space-y-5 max-w-6xl">
          {/* What is PFMEA */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-lg font-bold text-white mb-3">🎯 What is Process FMEA?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Process FMEA (PFMEA) is a <strong className="text-white">systematic, proactive risk analysis method</strong> used to identify potential failure modes in a manufacturing process before they occur — and to put controls in place to prevent or detect them.
                </p>
                <p className="text-sm text-gray-300 leading-relaxed mt-3">
                  The AIAG-VDA FMEA Handbook (2019) replaced the old AIAG 4th Edition. Key change: <strong className="text-white">RPN (Risk Priority Number) is replaced by AP (Action Priority)</strong> — a more nuanced risk assessment that considers S, O, and D in combination, not just their product.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { icon:'🚫', title:'Prevent failures before they happen', desc:'Identify risks before production starts — not after a complaint arrives.' },
                  { icon:'📊', title:'AP replaces RPN', desc:'Action Priority (H/M/L) is more meaningful than a raw RPN number.' },
                  { icon:'🔗', title:'Linked to Control Plan', desc:'Every High AP item must be reflected in the Control Plan with appropriate controls.' },
                  { icon:'♻️', title:'Living document', desc:'PFMEA must be updated when process changes, complaints, or 4M changes occur.' },
                ].map((item,i)=>(
                  <div key={i} className="flex gap-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AP vs RPN */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-lg font-bold text-white mb-4">🔄 AP vs RPN — Key Difference</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-950 border border-red-700 rounded-xl p-4">
                <p className="font-bold text-red-400 mb-2">❌ Old RPN (AIAG 4th Ed.)</p>
                <p className="font-mono text-white mb-2">RPN = S × O × D (max 1000)</p>
                <ul className="text-xs text-red-300 space-y-1">
                  <li>• S=10, O=1, D=1 → RPN=10 (very low)</li>
                  <li>• But S=10 means safety hazard! Must act!</li>
                  <li>• RPN ignores the weight of Severity</li>
                  <li>• 100 different S/O/D combos can give same RPN</li>
                </ul>
              </div>
              <div className="bg-green-950 border border-green-700 rounded-xl p-4">
                <p className="font-bold text-green-400 mb-2">✅ New AP (AIAG-VDA 2019)</p>
                <p className="font-mono text-white mb-2">AP = H / M / L (lookup table)</p>
                <ul className="text-xs text-green-300 space-y-1">
                  <li>• S=9-10 with ANY O≥4 → always HIGH AP</li>
                  <li>• Severity always carries appropriate weight</li>
                  <li>• Clear action requirements per AP level</li>
                  <li>• H = Must act | M = Should act | L = Review</li>
                </ul>
              </div>
            </div>
          </div>

          {/* S/O/D Rating Tables */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-lg font-bold text-white mb-4">📊 Severity / Occurrence / Detection Rating Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-bold text-red-400 mb-2 text-sm">Severity (S) — Impact on Customer</p>
                <div className="space-y-1">
                  {[
                    { s:'10', desc:'Safety impact WITHOUT warning — regulatory violation', color:'bg-red-900 border-red-700' },
                    { s:'9', desc:'Safety impact WITH warning / non-compliance', color:'bg-red-800 border-red-600' },
                    { s:'8', desc:'Major function loss — line shutdown at customer', color:'bg-orange-900 border-orange-700' },
                    { s:'7', desc:'Major function degraded — rework at customer', color:'bg-orange-800 border-orange-600' },
                    { s:'6', desc:'Reduced function, customer dissatisfied', color:'bg-yellow-900 border-yellow-700' },
                    { s:'5', desc:'Reduced function, customer uncomfortable', color:'bg-yellow-800 border-yellow-600' },
                    { s:'4', desc:'Cosmetic defect — mostly noticed by customer', color:'bg-green-900 border-green-700' },
                    { s:'3', desc:'Cosmetic defect — noticed by most customers', color:'bg-green-800 border-green-600' },
                    { s:'2', desc:'Cosmetic defect — noticed by discriminating customers', color:'bg-gray-700 border-gray-600' },
                    { s:'1', desc:'No discernible effect on product or customer', color:'bg-gray-700 border-gray-600' },
                  ].map((row,i)=>(
                    <div key={i} className={`flex gap-2 px-2 py-1 rounded border ${row.color}`}>
                      <span className="font-bold text-white w-4 text-center">{row.s}</span>
                      <span className="text-gray-300">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-yellow-400 mb-2 text-sm">Occurrence (O) — Prevention Control Effectiveness</p>
                <div className="space-y-1">
                  {[
                    { o:'10', desc:'No prevention control exists', color:'bg-red-900 border-red-700' },
                    { o:'9', desc:'Controls have very little effect (behavioural)', color:'bg-red-800 border-red-600' },
                    { o:'8', desc:'Controls are not very effective', color:'bg-orange-900 border-orange-700' },
                    { o:'7', desc:'Controls somewhat effective — manual checks', color:'bg-orange-800 border-orange-600' },
                    { o:'6', desc:'Controls are effective — SPC with reaction plan', color:'bg-yellow-900 border-yellow-700' },
                    { o:'5', desc:'Controls more effective — statistical methods', color:'bg-yellow-800 border-yellow-600' },
                    { o:'4', desc:'Controls are highly effective — Cpk 1.33–1.67', color:'bg-green-900 border-green-700' },
                    { o:'3', desc:'Controls highly effective — Cpk >1.67', color:'bg-green-800 border-green-600' },
                    { o:'2', desc:'Prevention control is very effective', color:'bg-gray-700 border-gray-600' },
                    { o:'1', desc:'Failure cause cannot occur — error-proofed', color:'bg-gray-700 border-gray-600' },
                  ].map((row,i)=>(
                    <div key={i} className={`flex gap-2 px-2 py-1 rounded border ${row.color}`}>
                      <span className="font-bold text-white w-4 text-center">{row.o}</span>
                      <span className="text-gray-300">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-blue-400 mb-2 text-sm">Detection (D) — Detection Control Effectiveness</p>
                <div className="space-y-1">
                  {[
                    { d:'10', desc:'No detection control / cannot detect', color:'bg-red-900 border-red-700' },
                    { d:'9', desc:'Detection control not effective — random audit', color:'bg-red-800 border-red-600' },
                    { d:'8', desc:'Control is ineffective — only human visual', color:'bg-orange-900 border-orange-700' },
                    { d:'7', desc:'Human visual with reference — moderate', color:'bg-orange-800 border-orange-600' },
                    { d:'6', desc:'Human gauging check — some escapes possible', color:'bg-yellow-900 border-yellow-700' },
                    { d:'5', desc:'SPC / machine-based detection downstream', color:'bg-yellow-800 border-yellow-600' },
                    { d:'4', desc:'Machine-based detection in station', color:'bg-green-900 border-green-700' },
                    { d:'3', desc:'Machine-based detection — automatic sort', color:'bg-green-800 border-green-600' },
                    { d:'2', desc:'Failure mode is reliably detected in-station', color:'bg-gray-700 border-gray-600' },
                    { d:'1', desc:'Failure mode CANNOT be produced — error proof', color:'bg-gray-700 border-gray-600' },
                  ].map((row,i)=>(
                    <div key={i} className={`flex gap-2 px-2 py-1 rounded border ${row.color}`}>
                      <span className="font-bold text-white w-4 text-center">{row.d}</span>
                      <span className="text-gray-300">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AP Actions */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-lg font-bold text-white mb-4">🎯 Action Priority — What Must You Do?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { ap:'H', label:'High — Must Act', color:'bg-red-700 border-red-500', badge:'bg-red-600', actions:['Immediate action required — no delay','Define specific prevention AND detection actions','Assign responsible person and firm target date','Track completion at every PFMEA review meeting','Escalate to Quality Head if not completed on time','Update Control Plan and re-validate process'] },
                { ap:'M', label:'Medium — Should Act', color:'bg-yellow-800 border-yellow-600', badge:'bg-yellow-500', actions:['Action strongly recommended — not optional','Review if current controls can be improved','Define action if improvement is feasible','Consider cost vs risk before deciding to act','Document rationale if action is not taken','Review at next PFMEA review (monthly)'] },
                { ap:'L', label:'Low — Review & Monitor', color:'bg-green-900 border-green-700', badge:'bg-green-600', actions:['No immediate action required','Confirm current controls are maintained','Review when process changes occur','Document that AP was reviewed and accepted','No PFMEA action required — but monitor KPIs','Low AP with S≥7 still needs PFMEA update on change'] },
              ].map((a,i)=>(
                <div key={i} className={`border rounded-xl p-4 ${a.color}`}>
                  <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg ${a.badge}`}>
                    <span className="font-bold text-white text-xl">{a.ap}</span>
                    <span className="text-white text-sm font-semibold">{a.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {a.actions.map((act,j)=>(
                      <li key={j} className="text-xs text-gray-200 flex gap-2">
                        <span className="flex-shrink-0">•</span>{act}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 7-STEP GUIDE TAB ────────────────────────────────────────────── */}
      {mainTab === 'steps' && (
        <div className="space-y-4 max-w-6xl">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h2 className="text-lg font-bold text-white mb-1">📋 AIAG-VDA 2019 — 7-Step FMEA Approach</h2>
            <p className="text-gray-400 text-sm mb-4">The AIAG-VDA handbook mandates this 7-step approach for all FMEAs. Follow this sequence — do not skip steps.</p>
            <div className="space-y-3">
              {[
                { step:1, title:'Planning & Preparation', color:'bg-blue-900 border-blue-700', points:['Define scope: what process are we analyzing?','Select the cross-functional team (CFT) — minimum 5 disciplines','Set PFMEA ID, start date, revision schedule','Define analysis boundaries: start station, end station, which failure effects scope','Set timing: link to APQP timeline, gate reviews'] },
                { step:2, title:'Structure Analysis', color:'bg-teal-900 border-teal-700', points:['Define the 3-level process structure tree','Level 1: Process Item (system or subsystem being analyzed)','Level 2: Process Step (station number and name — where the work is done)','Level 3: Work Element (4M: Man, Machine, Material, Method — the source of failure)','Document structure in the PFMEA table columns 1–3'] },
                { step:3, title:'Function Analysis', color:'bg-green-900 border-green-700', points:['For each structure element, define its function (what it must do correctly)','Process Item function: what the end product/system must deliver','Process Step function: the intended result of the station (product characteristic)','Work Element function: what the 4M element must do to achieve the step result','Functions become the baseline for identifying where things can go wrong'] },
                { step:4, title:'Failure Analysis', color:'bg-orange-900 border-orange-700', points:['Failure Mode (FM): how does the work element fail to perform its function?','Failure Effect (FE): what happens when FM occurs? — 3 levels: Inplant / Ship / End User','Failure Cause (FC): why does the failure mode occur? — the root cause at work element level','Map FM → FE → FC chain for every identified failure mode','Focus on process failures — not design failures (those go in DFMEA)'] },
                { step:5, title:'Risk Analysis', color:'bg-red-900 border-red-700', points:['Rate Severity (S): impact of Failure Effect on the customer (1–10)','Rate Occurrence (O): effectiveness of Prevention Controls at preventing Failure Cause (1–10)','Rate Detection (D): effectiveness of Detection Controls at catching Failure Mode/Cause (1–10)','Determine Action Priority (AP) using AIAG-VDA AP lookup table','S=9-10 always triggers High AP — safety and regulatory risks are never acceptable'] },
                { step:6, title:'Optimization', color:'bg-purple-900 border-purple-700', points:['For High AP: Define specific Prevention Action AND/OR Detection Action','For Medium AP: Define action if technically and economically feasible','Assign responsible person and firm target date for each action','Track action status: Open / Decision Pending / Implementation Pending / Completed','After completion: re-rate S/O/D to get new AP — verify improvement'] },
                { step:7, title:'Results Documentation', color:'bg-indigo-900 border-indigo-700', points:['Document all actions taken with evidence references','Record new AP after action implementation','Update Control Plan: add any new detection controls from PFMEA','Share PFMEA with management and customer as required','Maintain PFMEA as living document — review at every process change, complaint, or audit finding','Link PFMEA to related documents: PFD, Control Plan, Work Instructions'] },
              ].map((s,i)=>(
                <div key={i} className={`border rounded-xl overflow-hidden ${s.color}`}>
                  <div className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                    <h3 className="font-bold text-white text-base">Step {s.step}: {s.title}</h3>
                  </div>
                  <div className="bg-gray-900/50 px-4 py-3">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {s.points.map((p,j)=>(
                        <li key={j} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-white font-bold flex-shrink-0">→</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">⚠️ Most Common PFMEA Mistakes — and How to Fix Them</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { mistake:'Failure Mode is too vague', fix:'Wrong: "Part NG". Right: "Weld penetration below 3mm spec due to robot current drift"', color:'border-red-700 bg-red-950/30' },
                { mistake:'Using RPN instead of AP', fix:'AIAG-VDA 2019 mandates AP. Using RPN = non-conformance in a VDA customer audit.', color:'border-red-700 bg-red-950/30' },
                { mistake:'Root cause = symptom', fix:'Wrong: "Operator mistake". Right: "No error-proofing exists to prevent wrong assembly"', color:'border-orange-700 bg-orange-950/30' },
                { mistake:'S=10 but AP rated Low', fix:'S≥9 with O≥4 is ALWAYS High AP per AIAG-VDA table. No exceptions.', color:'border-orange-700 bg-orange-950/30' },
                { mistake:'PFMEA not updated after complaint', fix:'Any customer complaint = mandatory PFMEA review. Find the escape point. Add detection action.', color:'border-yellow-700 bg-yellow-950/30' },
                { mistake:'Actions listed but never completed', fix:'Track PFMEA actions in management review. Overdue High AP items = immediate escalation.', color:'border-yellow-700 bg-yellow-950/30' },
                { mistake:'Control Plan not linked to PFMEA', fix:'Every detection control in PFMEA must match the Control Plan. Audit both together.', color:'border-blue-700 bg-blue-950/30' },
                { mistake:'PFMEA done only for PPAP submission', fix:'PFMEA is a living document. Update it at every 4M change, re-PPAP, or process modification.', color:'border-blue-700 bg-blue-950/30' },
              ].map((m,i)=>(
                <div key={i} className={`border rounded-lg p-3 ${m.color}`}>
                  <p className="text-xs font-bold text-red-300 mb-1">❌ {m.mistake}</p>
                  <p className="text-xs text-gray-300">✅ {m.fix}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── GENERATOR TAB ────────────────────────────────────────────────── */}
      {mainTab === 'generator' && (<div>
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <h2 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">PFMEA Header {'—'} AIAG VDA 2019</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {hdrFields.map(([lbl, key, type]) => (
            <div key={key}>
              <label className="text-xs text-gray-400 block mb-0.5">{lbl}</label>
              <input type={type || 'text'} className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
                value={header[key]} onChange={e => setHdr(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Confidentiality Level</label>
            <select className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded w-full"
              value={header.securityClassification} onChange={e => setHdr('securityClassification', e.target.value)}>
              <option>Internal</option>
              <option>Confidential</option>
              <option>Public</option>
              <option>Restricted</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('manual')}
          className={`text-sm px-4 py-1.5 rounded font-medium border ${tab === 'manual' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
          Manual Entry
        </button>
        <button onClick={() => setTab('import')}
          className={`text-sm px-4 py-1.5 rounded font-medium border ${tab === 'import' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
          Import Excel
        </button>
      </div>
      {tab === 'import' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-4">
          <h3 className="text-sm font-bold text-gray-200 mb-2">Import from XLSX</h3>
          <p className="text-xs text-gray-400 mb-4">Upload an Excel file exported from this tool. Row numbers must be in column A; data columns follow AIAG-VDA order.</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport}
            className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" />
          {importStatus && (
            <p className={`mt-3 text-xs font-medium ${importStatus.startsWith('✓') ? 'text-green-400' : importStatus.startsWith('Error') ? 'text-red-400' : 'text-yellow-400'}`}>
              {importStatus}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mb-3 text-xs items-center">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">H {'—'} High (Must Act)</span>
        <span className="bg-yellow-400 text-black px-2 py-0.5 rounded font-bold">M {'—'} Medium (Should Act)</span>
        <span className="bg-green-600 text-white px-2 py-0.5 rounded font-bold">L {'—'} Low (Review)</span>
        <span className="text-gray-400">AP auto-calculated per AIAG VDA 2019 S/O/D table</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-4">
        <table className="text-xs min-w-max border-collapse">
          <thead>
            <tr>
              <th className={`${th} bg-gray-700 w-8`}>#</th>
              <th colSpan={3} className={`${th} bg-blue-900 text-blue-200`}>STRUCTURE ANALYSIS</th>
              <th colSpan={3} className={`${th} bg-green-900 text-green-200`}>FUNCTION ANALYSIS</th>
              <th colSpan={4} className={`${th} bg-orange-900 text-orange-200`}>FAILURE ANALYSIS</th>
              <th colSpan={7} className={`${th} bg-red-900 text-red-200`}>RISK ANALYSIS</th>
              <th colSpan={11} className={`${th} bg-purple-900 text-purple-200`}>OPTIMIZATION</th>
              <th className={`${th} bg-gray-700`}></th>
            </tr>
            <tr>
              <th className={`${th} bg-gray-700`}>No.</th>
              <th className={`${th} bg-blue-950 text-blue-200 w-32`}>{'1. Process Item\n(System/Part)'}</th>
              <th className={`${th} bg-blue-950 text-blue-200 w-36`}>{'2. Process Step\n(Station No. & Name)'}</th>
              <th className={`${th} bg-blue-950 text-blue-200 w-28`}>{'3. Work Element\n(4M Type)'}</th>
              <th className={`${th} bg-green-950 text-green-200 w-32`}>{'1. Function of\nProcess Item'}</th>
              <th className={`${th} bg-green-950 text-green-200 w-36`}>{'2. Function of Process Step\n+ Product Char.'}</th>
              <th className={`${th} bg-green-950 text-green-200 w-36`}>{'3. Function of Work Element\n+ Process Char.'}</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-40`}>{'1. Failure Effects (FE)\n→ Inplant / Ship / End User'}</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-8`}>S</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-36`}>{'2. Failure Mode (FM)\nat Focus Element'}</th>
              <th className={`${th} bg-orange-950 text-orange-200 w-36`}>{'3. Failure Cause (FC)\nof Work Element'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-36`}>{'Prevention Controls\n(PC) of FC'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>O</th>
              <th className={`${th} bg-red-950 text-red-200 w-36`}>{'Detection Controls\n(DC) of FC/FM'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>D</th>
              <th className={`${th} bg-red-950 text-red-200 w-10`}>AP</th>
              <th className={`${th} bg-red-950 text-red-200 w-16`}>{'Special\nChar.'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-14`}>{'Filter\nCode'}</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-32`}>{'Prevention\nAction'}</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-32`}>{'Detection\nAction'}</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>{'Responsible\nPerson'}</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>{'Target\nDate'}</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Status</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-32`}>{'Action Taken\n(+Evidence)'}</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>{'Completion\nDate'}</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>S'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>O'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-8`}>D'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-10`}>AP'</th>
              <th className={`${th} bg-purple-950 text-purple-200 w-24`}>Remarks</th>
              <th className={`${th} bg-gray-700 w-8`}>Del</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
                <td className={`${td} text-center text-gray-400`}>{i + 1}</td>
                <td className={td}><textarea className={ta} value={r.processItem} onChange={e => setRow(r.id, 'processItem', e.target.value)} placeholder="e.g. Suspension Seat Assy" /></td>
                <td className={td}><textarea className={ta} value={r.processStep} onChange={e => setRow(r.id, 'processStep', e.target.value)} placeholder="e.g. 10 - Incoming Insp." /></td>
                <td className={td}>
                  <select className={inp} value={r.workElement4M} onChange={e => setRow(r.id, 'workElement4M', e.target.value)}>
                    <option value="">{'—'}</option>
                    <option>Man</option>
                    <option>Machine</option>
                    <option>Material</option>
                    <option>Method</option>
                    <option>Environment</option>
                  </select>
                </td>
                <td className={td}><textarea className={ta} value={r.functionProcessItem} onChange={e => setRow(r.id, 'functionProcessItem', e.target.value)} placeholder="Inplant / Ship / End user" /></td>
                <td className={td}><textarea className={ta} value={r.functionProcessStep} onChange={e => setRow(r.id, 'functionProcessStep', e.target.value)} placeholder="e.g. OK part as OK" /></td>
                <td className={td}><textarea className={ta} value={r.functionWorkElement} onChange={e => setRow(r.id, 'functionWorkElement', e.target.value)} placeholder="e.g. L3 inspector" /></td>
                <td className={td}><textarea className={ta} value={r.failureEffects} onChange={e => setRow(r.id, 'failureEffects', e.target.value)} placeholder={'1. Inplant: ...\n2. Ship: ...\n3. End user: ...'} /></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.severity || ''} onChange={e => setRow(r.id, 'severity', +e.target.value)} /></td>
                <td className={td}><textarea className={ta} value={r.failureMode} onChange={e => setRow(r.id, 'failureMode', e.target.value)} placeholder="e.g. OK part rejected" /></td>
                <td className={td}><textarea className={ta} value={r.failureCause} onChange={e => setRow(r.id, 'failureCause', e.target.value)} placeholder="e.g. Inspector below L3" /></td>
                <td className={td}><textarea className={ta} value={r.preventionControls} onChange={e => setRow(r.id, 'preventionControls', e.target.value)} placeholder="PM schedule, calibration" /></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrence || ''} onChange={e => setRow(r.id, 'occurrence', +e.target.value)} /></td>
                <td className={td}><textarea className={ta} value={r.detectionControls} onChange={e => setRow(r.id, 'detectionControls', e.target.value)} placeholder="Visual, torque test" /></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.detection || ''} onChange={e => setRow(r.id, 'detection', +e.target.value)} /></td>
                <td className={`${td} text-center`}>{apBadge(r.ap)}</td>
                <td className={td}><input className={inp} value={r.specialCharacteristics} onChange={e => setRow(r.id, 'specialCharacteristics', e.target.value)} placeholder="CC/SC" /></td>
                <td className={td}><input className={inp} value={r.filterCode} onChange={e => setRow(r.id, 'filterCode', e.target.value)} placeholder="F1" /></td>
                <td className={td}><textarea className={ta} value={r.preventionAction} onChange={e => setRow(r.id, 'preventionAction', e.target.value)} placeholder="Increase PM frequency" /></td>
                <td className={td}><textarea className={ta} value={r.detectionAction} onChange={e => setRow(r.id, 'detectionAction', e.target.value)} placeholder="Add 100% pull test" /></td>
                <td className={td}><input className={inp} value={r.responsible} onChange={e => setRow(r.id, 'responsible', e.target.value)} placeholder="J. Smith" /></td>
                <td className={td}><input type="date" className={inp} value={r.targetDate} onChange={e => setRow(r.id, 'targetDate', e.target.value)} /></td>
                <td className={td}>
                  <select className={inp} value={r.status} onChange={e => setRow(r.id, 'status', e.target.value)}>
                    <option value="">Select</option>
                    <option>Open</option>
                    <option>Decision Pending</option>
                    <option>Implementation Pending</option>
                    <option>Completed</option>
                    <option>Not Implemented</option>
                  </select>
                </td>
                <td className={td}><textarea className={ta} value={r.actionTaken} onChange={e => setRow(r.id, 'actionTaken', e.target.value)} placeholder="Action + evidence ref" /></td>
                <td className={td}><input type="date" className={inp} value={r.completionDate} onChange={e => setRow(r.id, 'completionDate', e.target.value)} /></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.severityAfter || ''} onChange={e => setRow(r.id, 'severityAfter', +e.target.value)} /></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrenceAfter || ''} onChange={e => setRow(r.id, 'occurrenceAfter', +e.target.value)} /></td>
                <td className={td}><input type="number" min={1} max={10} className={num} value={r.detectionAfter || ''} onChange={e => setRow(r.id, 'detectionAfter', +e.target.value)} /></td>
                <td className={`${td} text-center`}>{apBadge(r.apAfter)}</td>
                <td className={td}><textarea className={ta} value={r.remarks} onChange={e => setRow(r.id, 'remarks', e.target.value)} placeholder="Remarks" /></td>
                <td className={td}><button onClick={() => delRow(r.id)} className="text-red-400 hover:text-red-200 text-sm px-1">{'✕'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={addRow} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded font-medium">+ Add Row</button>
        <button onClick={loadSample} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded font-medium">{'🧪'} Load Sample</button>
        <button onClick={exportExcel} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded font-medium">{'📊'} Export Excel</button>
        <button onClick={saveToDB} disabled={saving} className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded font-medium disabled:opacity-50">
          {saving ? 'Saving...' : `${'💾'} Save to DB`}
        </button>
        <span className="text-xs text-gray-500 self-center">
          {rows.length} row{rows.length !== 1 ? 's' : ''} | {highAP} High | {medAP} Medium | {lowAP} Low AP
        </span>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">AIAG VDA 2019 Rating Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-bold text-red-400 mb-1">Severity (S) {'—'} Effect on Customer</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> {'—'} Safety impact without warning</p>
              <p><span className="text-white font-medium">9</span> {'—'} Safety / regulatory noncompliance</p>
              <p><span className="text-white font-medium">7{'–'}8</span> {'—'} Major function lost / line shutdown</p>
              <p><span className="text-white font-medium">5{'–'}6</span> {'—'} Reduced function, rework required</p>
              <p><span className="text-white font-medium">3{'–'}4</span> {'—'} Minor defect noticed by customer</p>
              <p><span className="text-white font-medium">1{'–'}2</span> {'—'} No discernible effect</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-yellow-400 mb-1">Occurrence (O) {'—'} Failure Rate</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> {'—'} No prevention controls</p>
              <p><span className="text-white font-medium">9</span> {'—'} Controls little effect (behavioral)</p>
              <p><span className="text-white font-medium">7{'–'}8</span> {'—'} Controls somewhat effective</p>
              <p><span className="text-white font-medium">5{'–'}6</span> {'—'} Controls are effective</p>
              <p><span className="text-white font-medium">3{'–'}4</span> {'—'} Controls highly effective</p>
              <p><span className="text-white font-medium">1{'–'}2</span> {'—'} Controls extremely effective (technical)</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-blue-400 mb-1">Detection (D) {'—'} Detectability</p>
            <div className="space-y-0.5 text-gray-400">
              <p><span className="text-white font-medium">10</span> {'—'} Cannot / will not detect</p>
              <p><span className="text-white font-medium">8{'–'}9</span> {'—'} Remote chance / low detectability</p>
              <p><span className="text-white font-medium">6{'–'}7</span> {'—'} Human inspection (moderate)</p>
              <p><span className="text-white font-medium">4{'–'}5</span> {'—'} Machine-based detection downstream</p>
              <p><span className="text-white font-medium">2{'–'}3</span> {'—'} Machine-based in-station detection</p>
              <p><span className="text-white font-medium">1</span> {'—'} Failure mode cannot be produced</p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="font-bold text-gray-300 mb-1 text-xs">AP Determination (AIAG VDA 2019)</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            <p><span className="text-red-400 font-bold">H (High)</span>: S{'≥'}9+O{'≥'}4 | S{'≥'}7+O{'≥'}6 | S{'≥'}7+O{'≥'}4+D{'≥'}2</p>
            <p><span className="text-yellow-400 font-bold">M (Medium)</span>: S{'≥'}9+O{'≥'}2+D{'≥'}2 | S{'≥'}4+O{'≥'}6+D{'<'}4</p>
            <p><span className="text-green-400 font-bold">L (Low)</span>: All other combinations</p>
          </div>
        </div>
      </div>
      </div>)}

      </div>
    </div>
  );
}
