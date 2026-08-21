'use client';

import { useState, useRef } from 'react';
import PageTitle from '../components/PageTitle';
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
  return <span className="text-[#1e3a5f] text-xs">{'—'}</span>;
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


const FMEA_STEPS = [
  { step:1, name:'Project Identification', icon:'🎯', color:'#1e40af', items:[
    'Define PFMEA scope and boundaries',
    'Identify cross-functional team members (QA, Mfg, Eng)',
    'Set PFMEA timing aligned with APQP Phase 3',
    'Document header: Part, Customer, Plant, Dates',
    'List applicable customer-specific requirements',
  ]},
  { step:2, name:'Structure Analysis', icon:'🗺️', color:'#059669', items:[
    'Obtain Process Flow Diagram (PFD) from APQP',
    'List all process steps in sequence',
    'Identify process element (machine, tool, operator)',
    'Map each step to PFD step number',
    'Include all sub-processes and inspection steps',
  ]},
  { step:3, name:'Function Analysis', icon:'⚙️', color:'#d97706', items:[
    'Define requirement for each process step',
    'State requirements quantitatively where possible',
    'Identify product and process characteristics',
    'Link requirements to customer specifications',
    'Map special characteristics (CC/SC)',
  ]},
  { step:4, name:'Failure Analysis', icon:'⚠️', color:'#dc2626', items:[
    'Identify failure modes for each requirement',
    'Describe effects (on customer, next step, end user)',
    'List all potential causes for each failure mode',
    'Document in technical, physical terms',
    'Use lessons learned and historical data',
  ]},
  { step:5, name:'Risk Analysis (S/O/D/AP)', icon:'📊', color:'#7c3aed', items:[
    'Rate Severity (S) using AIAG-VDA S table (1-10)',
    'Rate Occurrence (O) using AIAG-VDA O table (1-5)',
    'Rate Detection (D) using AIAG-VDA D table (1-5)',
    'Calculate Action Priority (AP) = H/M/L matrix',
    'Mark all S=9/10 as mandatory action regardless of O/D',
  ]},
  { step:6, name:'Optimization', icon:'✅', color:'#0e7490', items:[
    'List actions for all AP=H items (mandatory)',
    'Assign responsible owner and target date',
    'Implement preventive and detection improvements',
    'Record evidence of action completion',
    'Verify effectiveness - re-rate O/D after action',
  ]},
  { step:7, name:'Results & Documentation', icon:'📋', color:'#1e293b', items:[
    'Cross-functional team review and sign-off',
    'Link PFMEA to Control Plan (detection controls)',
    'Link PFMEA to Work Instructions (prevention controls)',
    'Maintain revision history with dates',
    'Submit with PPAP package (if customer required)',
  ]},
];

const FMEA_SCORE_ITEMS = [
  'PFMEA scope defined - all PFD steps covered',
  'Header complete (part, plant, team, dates, revision)',
  'All failure modes written in physical/technical terms',
  'Severity rated correctly using AIAG-VDA table (1-10)',
  'Occurrence rated using AIAG-VDA O table (1-5)',
  'Detection rated using AIAG-VDA D table (1-5)',
  'AP calculated correctly (H/M/L) per AIAG-VDA matrix',
  'All AP=H items have owner, date, and action documented',
  'Special characteristics (CC/SC) identified and marked',
  'Prevention controls address root causes (not symptoms)',
  'Detection controls realistic and currently in use',
  'PFMEA linked to Control Plan (same process steps)',
  'Cross-functional team sign-off obtained',
  'Revision history maintained and up to date',
];

export default function PFMEAPage() {
  const [mainTab, setMainTab] = useState<'overview'|'guide'|'generator'|'analyser'|'qa'|'templates'|'docs'|'posters'|'dashboard'|'deepdive'|'workflow'|'casestudies'|'training'>('overview');
  const [showApGen, setShowApGen] = useState(false);
  const [apInfo, setApInfo] = useState({ part:'', process:'', rev:'', date:'' });
  const [showFmeaScore, setShowFmeaScore] = useState(false);
  const [fmeaChecks, setFmeaChecks] = useState<Record<number,boolean>>({});
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

  const inp = 'bg-white border border-[#dbeafe] text-[#1e3a5f] text-xs px-1 py-0.5 rounded w-full';
  const ta = 'bg-white border border-[#dbeafe] text-[#1e3a5f] text-xs px-1 py-0.5 rounded w-full min-h-[48px] resize-y';
  const num = 'bg-white border border-[#dbeafe] text-[#1e3a5f] text-xs px-1 py-0.5 rounded w-10 text-center';
  const th = 'px-1.5 py-1.5 border border-gray-500 text-xs font-bold text-center whitespace-pre-line leading-tight';
  const td = 'px-1 py-0.5 border border-[#dbeafe] align-top';

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
      <>
      <PageTitle title="PFMEA" />
      <div className="min-h-screen bg-white">

      {/* -- PREMIUM HEADER ------------------------------------------------ */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e2a5a 50%,#162044 100%)', padding: '22px 32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f160,transparent)' }} />
        <div style={{ position: 'relative', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '12px', padding: '10px', fontSize: '24px', lineHeight: 1 }}>⚠️</div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>PFMEA Generator</h1>
                <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>AIAG-VDA FMEA Handbook 1st Edition 2019 — 7-Step Approach | Action Priority (AP) replaces RPN</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {highAP > 0 && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}><div style={{ color: '#f87171', fontSize: '18px', fontWeight: 700 }}>{highAP}</div><div style={{ color: '#fca5a5', fontSize: '11px' }}>High AP</div></div>}
              {medAP > 0 && <div style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}><div style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 700 }}>{medAP}</div><div style={{ color: '#fde68a', fontSize: '11px' }}>Medium AP</div></div>}
              {lowAP > 0 && <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}><div style={{ color: '#4ade80', fontSize: '18px', fontWeight: 700 }}>{lowAP}</div><div style={{ color: '#86efac', fontSize: '11px' }}>Low AP</div></div>}
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}><div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>{doneAP}</div><div style={{ color: '#a5b4fc', fontSize: '11px' }}>Completed</div></div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}><div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>{rows.length}</div><div style={{ color: '#a5b4fc', fontSize: '11px' }}>Total Rows</div></div>
            </div>
          </div>
          {/* Tab Nav */}
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {([
              ['overview','📖 Overview'],
              ['guide','📋 PFMEA Guide'],
              ['generator','⚡ Generator'],
              ['analyser','🔍 Analyser'],
              ['qa','💬 Interview Q&A'],
              ['templates','📁 Templates'],
              ['docs','📚 Supporting Docs'],
              ['posters','🖼 Posters & Banners'],
              ['dashboard','📊 Dashboard'],
              ['deepdive','🧩 Deep Dive'],
              ['workflow','🔄 Workflow'],
              ['casestudies','📂 Case Studies'],
              ['training','🎓 Training'],
            ] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setMainTab(id)} style={{
                padding: '8px 16px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
                background: mainTab===id ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: mainTab===id ? '#fff' : '#a5b4fc',
                borderBottom: mainTab===id ? '2px solid #6366f1' : '2px solid transparent',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4" style={{ background: '#fff' }}>

      {/* -- OVERVIEW TAB -------------------------------------------------- */}

      {mainTab === 'overview' && (
        <div className="animate-fadeIn space-y-5 max-w-6xl">

        {/* Download Strip */}
        <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
          <span className="text-[#1e3a5f] text-xs font-bold mr-1">📥 Downloads:</span>
              <a href="/downloads/pfmea/AIAG_VDA_FMEA_Handbook.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>AIAG-VDA FMEA Handbook</a>
              <a href="/downloads/pfmea/PFMEA_vs_DFMEA_Comparison.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#0e7490'}}>PFMEA vs DFMEA Guide</a>
              <a href="/downloads/pfmea/PFMEA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>IATF Clause Mapping</a>
              <a href="/downloads/pfmea/PFMEA_Failure_Mode_Library.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#1e40af'}}>Failure Mode Library</a>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
              <h2 className="text-lg font-bold text-white mb-3">⚠️ What is PFMEA?</h2>
              <p className="text-sm text-[#1e3a5f] leading-relaxed mb-3">
                <strong className="text-white">Process FMEA (PFMEA)</strong> is a systematic, proactive risk analysis method that identifies potential failure modes in a manufacturing process before they occur — and puts controls in place to prevent or detect them. It is one of the AIAG Five Core Tools.
              </p>
              <p className="text-sm text-[#1e3a5f] leading-relaxed mb-4">
                The <strong className="text-red-700">AIAG-VDA FMEA Handbook (2019)</strong> replaced the old AIAG 4th Edition. Key change: <strong className="text-white">RPN (Risk Priority Number) is replaced by AP (Action Priority)</strong> — H/M/L — a more nuanced rating using S, O, D in combination tables.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label:'Standard', value:'AIAG-VDA 2019' },
                  { label:'IATF Clause', value:'8.5.1.1, 8.5.1.2' },
                  { label:'Risk Rating', value:'AP: High / Medium / Low' },
                  { label:'7 Steps', value:'Structure → Optimization' },
                  { label:'Links To', value:'PFD + Control Plan' },
                  { label:'Trigger', value:'New process / 4M change' },
                ].map(i => (
                  <div key={i.label} className="bg-gray-700 rounded-lg px-3 py-2">
                    <div className="text-xs text-[#1e3a5f] uppercase">{i.label}</div>
                    <div className="text-xs font-semibold text-white mt-1">{i.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon:'🔴', stat:'High AP', label:'Must take action — no exception', color:'text-red-600 bg-red-50 border-red-800/40' },
                { icon:'🟡', stat:'Medium AP', label:'Action recommended — review needed', color:'text-yellow-600 bg-yellow-900/30/30 border-yellow-800/40' },
                { icon:'🟢', stat:'Low AP', label:'Monitor — action at discretion', color:'text-green-600 bg-green-900/30 border-green-700/50' },
                { icon:'7️⃣', stat:'7 Steps', label:'AIAG-VDA structured approach', color:'text-purple-600 bg-purple-900/30 border-purple-700/50' },
              ].map(s => (
                <div key={s.label} className={`border rounded-xl p-3 flex items-center gap-3 ${s.color}`}>
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{s.stat}</div>
                    <div className="text-xs opacity-80">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why PFMEA */}
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <h2 className="text-base font-bold text-white mb-4">💡 Why PFMEA Matters</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon:'🚫', title:'Prevent Before Detect', desc:'Identify risks before production starts — not after a complaint arrives at the customer' },
                { icon:'🔗', title:'Links to Control Plan', desc:'Every High AP must be in the Control Plan with prevention + detection controls specified' },
                { icon:'♻️', title:'Living Document', desc:'Must be updated on 4M changes, complaints, near misses, and engineering changes' },
                { icon:'📌', title:'Special Characteristics', desc:'All CC/SC characteristics must appear in PFMEA with appropriate S rating and AP level' },
                { icon:'📋', title:'IATF Mandatory', desc:'Clause 8.5.1.1 requires PFMEA for all manufacturing processes — audited rigorously' },
                { icon:'🏆', title:'PPAP Element 6', desc:'PFMEA is Element 6 of the PPAP 18 elements — required for Level 2-5 submissions' },
              ].map(b => (
                <div key={b.title} className="bg-gray-700 rounded-xl p-3">
                  <div className="text-xl mb-1">{b.icon}</div>
                  <div className="text-white font-semibold text-xs mb-1">{b.title}</div>
                  <p className="text-[#1e3a5f] text-xs leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* IATF Clauses */}
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <h2 className="text-base font-bold text-white mb-3">📌 IATF 16949 Clause Map</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ['8.5.1.1','Control Plan — must reference PFMEA. PFD/PFMEA/CP trinity must be cross-linked'],
                ['8.5.1.2','Work Instructions — must reference PFMEA outputs for special characteristics'],
                ['8.3.3','Design and Development Controls — DFMEA links to PFMEA for design-responsible suppliers'],
                ['10.2.3','Problem Solving — PFMEA must be updated with lessons learned from customer complaints'],
                ['8.3.6','Design and Development Changes — Engineering changes require PFMEA update + re-review'],
                ['8.4.2.4','Supplier Monitoring — Suppliers must maintain PFMEA for outsourced processes'],
              ].map(([c,t]) => (
                <div key={c} className="flex gap-3 bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-red-600 font-bold text-xs w-12 flex-shrink-0 pt-0.5">{c}</span>
                  <span className="text-[#1e3a5f] text-xs leading-relaxed">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- GUIDE TAB (was Knowledge Hub) --------------------------------- */}
      {mainTab === 'guide' && (
        <div className="animate-fadeIn space-y-5 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
          <a href="/downloads/pfmea/PFMEA_Process_Flow_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>PFD Linkage Guide</a>
          <a href="/downloads/pfmea/PFMEA_SOD_Rating_Tables.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>S/O/D Rating Tables</a>
          <a href="/downloads/pfmea/PFMEA_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Training Guide PDF</a>
          <a href="/downloads/pfmea/PFMEA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
          </div>
          {/* What is PFMEA */}
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <h2 className="text-lg font-bold text-white mb-3">🎯 What is Process FMEA?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#1e3a5f] leading-relaxed">
                  Process FMEA (PFMEA) is a <strong className="text-white">systematic, proactive risk analysis method</strong> used to identify potential failure modes in a manufacturing process before they occur — and to put controls in place to prevent or detect them.
                </p>
                <p className="text-sm text-[#1e3a5f] leading-relaxed mt-3">
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
                  <div key={i} className="flex gap-3 p-3 bg-gray-700 rounded-lg border border-[#dbeafe]">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-xs text-[#1e3a5f] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AP vs RPN */}
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <h2 className="text-lg font-bold text-white mb-4">🔄 AP vs RPN — Key Difference</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-950 border border-red-700 rounded-xl p-4">
                <p className="font-bold text-red-600 mb-2">❌ Old RPN (AIAG 4th Ed.)</p>
                <p className="font-mono text-white mb-2">RPN = S × O × D (max 1000)</p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• S=10, O=1, D=1 → RPN=10 (very low)</li>
                  <li>• But S=10 means safety hazard! Must act!</li>
                  <li>• RPN ignores the weight of Severity</li>
                  <li>• 100 different S/O/D combos can give same RPN</li>
                </ul>
              </div>
              <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
                <p className="font-bold text-green-600 mb-2">✅ New AP (AIAG-VDA 2019)</p>
                <p className="font-mono text-white mb-2">AP = H / M / L (lookup table)</p>
                <ul className="text-xs text-[#15803d] space-y-1">
                  <li>• S=9-10 with ANY O≥4 → always HIGH AP</li>
                  <li>• Severity always carries appropriate weight</li>
                  <li>• Clear action requirements per AP level</li>
                  <li>• H = Must act | M = Should act | L = Review</li>
                </ul>
              </div>
            </div>
          </div>

          {/* S/O/D Rating Tables */}
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <h2 className="text-lg font-bold text-white mb-4">📊 Severity / Occurrence / Detection Rating Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-bold text-red-600 mb-2 text-sm">Severity (S) — Impact on Customer</p>
                <div className="space-y-1">
                  {[
                    { s:'10', desc:'Safety impact WITHOUT warning — regulatory violation', color:'bg-red-900 border-red-700' },
                    { s:'9', desc:'Safety impact WITH warning / non-compliance', color:'bg-red-800 border-red-600' },
                    { s:'8', desc:'Major function loss — line shutdown at customer', color:'bg-orange-900/30 border-orange-700' },
                    { s:'7', desc:'Major function degraded — rework at customer', color:'bg-orange-800 border-orange-600' },
                    { s:'6', desc:'Reduced function, customer dissatisfied', color:'bg-yellow-900/30 border-yellow-700' },
                    { s:'5', desc:'Reduced function, customer uncomfortable', color:'bg-yellow-800 border-yellow-600' },
                    { s:'4', desc:'Cosmetic defect — mostly noticed by customer', color:'bg-green-900/30 border-green-700' },
                    { s:'3', desc:'Cosmetic defect — noticed by most customers', color:'bg-green-800 border-green-600' },
                    { s:'2', desc:'Cosmetic defect — noticed by discriminating customers', color:'bg-gray-700 border-[#dbeafe]' },
                    { s:'1', desc:'No discernible effect on product or customer', color:'bg-gray-700 border-[#dbeafe]' },
                  ].map((row,i)=>(
                    <div key={i} className={`flex gap-2 px-2 py-1 rounded border ${row.color}`}>
                      <span className="font-bold text-white w-4 text-center">{row.s}</span>
                      <span className="text-[#1e3a5f]">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-yellow-600 mb-2 text-sm">Occurrence (O) — Prevention Control Effectiveness</p>
                <div className="space-y-1">
                  {[
                    { o:'10', desc:'No prevention control exists', color:'bg-red-900 border-red-700' },
                    { o:'9', desc:'Controls have very little effect (behavioural)', color:'bg-red-800 border-red-600' },
                    { o:'8', desc:'Controls are not very effective', color:'bg-orange-900/30 border-orange-700' },
                    { o:'7', desc:'Controls somewhat effective — manual checks', color:'bg-orange-800 border-orange-600' },
                    { o:'6', desc:'Controls are effective — SPC with reaction plan', color:'bg-yellow-900/30 border-yellow-700' },
                    { o:'5', desc:'Controls more effective — statistical methods', color:'bg-yellow-800 border-yellow-600' },
                    { o:'4', desc:'Controls are highly effective — Cpk 1.33–1.67', color:'bg-green-900/30 border-green-700' },
                    { o:'3', desc:'Controls highly effective — Cpk >1.67', color:'bg-green-800 border-green-600' },
                    { o:'2', desc:'Prevention control is very effective', color:'bg-gray-700 border-[#dbeafe]' },
                    { o:'1', desc:'Failure cause cannot occur — error-proofed', color:'bg-gray-700 border-[#dbeafe]' },
                  ].map((row,i)=>(
                    <div key={i} className={`flex gap-2 px-2 py-1 rounded border ${row.color}`}>
                      <span className="font-bold text-white w-4 text-center">{row.o}</span>
                      <span className="text-[#1e3a5f]">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-blue-600 mb-2 text-sm">Detection (D) — Detection Control Effectiveness</p>
                <div className="space-y-1">
                  {[
                    { d:'10', desc:'No detection control / cannot detect', color:'bg-red-900 border-red-700' },
                    { d:'9', desc:'Detection control not effective — random audit', color:'bg-red-800 border-red-600' },
                    { d:'8', desc:'Control is ineffective — only human visual', color:'bg-orange-900/30 border-orange-700' },
                    { d:'7', desc:'Human visual with reference — moderate', color:'bg-orange-800 border-orange-600' },
                    { d:'6', desc:'Human gauging check — some escapes possible', color:'bg-yellow-900/30 border-yellow-700' },
                    { d:'5', desc:'SPC / machine-based detection downstream', color:'bg-yellow-800 border-yellow-600' },
                    { d:'4', desc:'Machine-based detection in station', color:'bg-green-900/30 border-green-700' },
                    { d:'3', desc:'Machine-based detection — automatic sort', color:'bg-green-800 border-green-600' },
                    { d:'2', desc:'Failure mode is reliably detected in-station', color:'bg-gray-700 border-[#dbeafe]' },
                    { d:'1', desc:'Failure mode CANNOT be produced — error proof', color:'bg-gray-700 border-[#dbeafe]' },
                  ].map((row,i)=>(
                    <div key={i} className={`flex gap-2 px-2 py-1 rounded border ${row.color}`}>
                      <span className="font-bold text-white w-4 text-center">{row.d}</span>
                      <span className="text-[#1e3a5f]">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AP Actions */}
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <h2 className="text-lg font-bold text-white mb-4">🎯 Action Priority — What Must You Do?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { ap:'H', label:'High — Must Act', color:'bg-red-700 border-red-500', badge:'bg-red-600', actions:['Immediate action required — no delay','Define specific prevention AND detection actions','Assign responsible person and firm target date','Track completion at every PFMEA review meeting','Escalate to Quality Head if not completed on time','Update Control Plan and re-validate process'] },
                { ap:'M', label:'Medium — Should Act', color:'bg-yellow-800 border-yellow-600', badge:'bg-yellow-500', actions:['Action strongly recommended — not optional','Review if current controls can be improved','Define action if improvement is feasible','Consider cost vs risk before deciding to act','Document rationale if action is not taken','Review at next PFMEA review (monthly)'] },
                { ap:'L', label:'Low — Review & Monitor', color:'bg-green-900/30 border-green-700', badge:'bg-green-600', actions:['No immediate action required','Confirm current controls are maintained','Review when process changes occur','Document that AP was reviewed and accepted','No PFMEA action required — but monitor KPIs','Low AP with S≥7 still needs PFMEA update on change'] },
              ].map((a,i)=>(
                <div key={i} className={`border rounded-xl p-4 ${a.color}`}>
                  <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg ${a.badge}`}>
                    <span className="font-bold text-white text-xl">{a.ap}</span>
                    <span className="text-white text-sm font-semibold">{a.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {a.actions.map((act,j)=>(
                      <li key={j} className="text-xs text-[#1e3a5f] flex gap-2">
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

      {/* -- 7-STEP GUIDE TAB ---------------------------------------------- */}

      {mainTab === 'qa' && (
        <>
        <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
          <span className="text-[#1e3a5f] text-xs font-bold mr-1">📥 Downloads:</span>
              <a href="/downloads/pfmea/PFMEA_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>Training Guide PDF</a>
              <a href="/downloads/pfmea/PFMEA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>Common NC Findings</a>
              <a href="/downloads/pfmea/PFMEA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#1e40af'}}>IATF Clause Map</a>
              <a href="/downloads/pfmea/PFMEA_Competency_Matrix.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#059669'}}>Competency Matrix</a>
        </div>

        <div className="space-y-4 max-w-6xl">
          <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
            <h2 className="text-lg font-bold text-white mb-1">📋 AIAG-VDA 2019 — 7-Step FMEA Approach</h2>
            <p className="text-[#1e3a5f] text-sm mb-4">The AIAG-VDA handbook mandates this 7-step approach for all FMEAs. Follow this sequence — do not skip steps.</p>
            <div className="space-y-3">
              {[
                { step:1, title:'Planning & Preparation', color:'bg-[#eff6ff] border-blue-700/50', points:['Define scope: what process are we analyzing?','Select the cross-functional team (CFT) — minimum 5 disciplines','Set PFMEA ID, start date, revision schedule','Define analysis boundaries: start station, end station, which failure effects scope','Set timing: link to APQP timeline, gate reviews'] },
                { step:2, title:'Structure Analysis', color:'bg-teal-50 border-teal-700', points:['Define the 3-level process structure tree','Level 1: Process Item (system or subsystem being analyzed)','Level 2: Process Step (station number and name — where the work is done)','Level 3: Work Element (4M: Man, Machine, Material, Method — the source of failure)','Document structure in the PFMEA table columns 1–3'] },
                { step:3, title:'Function Analysis', color:'bg-green-900/30 border-green-700', points:['For each structure element, define its function (what it must do correctly)','Process Item function: what the end product/system must deliver','Process Step function: the intended result of the station (product characteristic)','Work Element function: what the 4M element must do to achieve the step result','Functions become the baseline for identifying where things can go wrong'] },
                { step:4, title:'Failure Analysis', color:'bg-orange-900/30 border-orange-700', points:['Failure Mode (FM): how does the work element fail to perform its function?','Failure Effect (FE): what happens when FM occurs? — 3 levels: Inplant / Ship / End User','Failure Cause (FC): why does the failure mode occur? — the root cause at work element level','Map FM → FE → FC chain for every identified failure mode','Focus on process failures — not design failures (those go in DFMEA)'] },
                { step:5, title:'Risk Analysis', color:'bg-red-900 border-red-700', points:['Rate Severity (S): impact of Failure Effect on the customer (1–10)','Rate Occurrence (O): effectiveness of Prevention Controls at preventing Failure Cause (1–10)','Rate Detection (D): effectiveness of Detection Controls at catching Failure Mode/Cause (1–10)','Determine Action Priority (AP) using AIAG-VDA AP lookup table','S=9-10 always triggers High AP — safety and regulatory risks are never acceptable'] },
                { step:6, title:'Optimization', color:'bg-purple-900/30 border-purple-700', points:['For High AP: Define specific Prevention Action AND/OR Detection Action','For Medium AP: Define action if technically and economically feasible','Assign responsible person and firm target date for each action','Track action status: Open / Decision Pending / Implementation Pending / Completed','After completion: re-rate S/O/D to get new AP — verify improvement'] },
                { step:7, title:'Results Documentation', color:'bg-indigo-900/30 border-indigo-700', points:['Document all actions taken with evidence references','Record new AP after action implementation','Update Control Plan: add any new detection controls from PFMEA','Share PFMEA with management and customer as required','Maintain PFMEA as living document — review at every process change, complaint, or audit finding','Link PFMEA to related documents: PFD, Control Plan, Work Instructions'] },
              ].map((s,i)=>(
                <div key={i} className={`border rounded-xl overflow-hidden ${s.color}`}>
                  <div className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-[#1e3a5f] font-bold text-sm flex-shrink-0">{s.step}</div>
                    <h3 className="font-bold text-white text-base">Step {s.step}: {s.title}</h3>
                  </div>
                  <div className="bg-[#eff6ff] px-4 py-3">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {s.points.map((p,j)=>(
                        <li key={j} className="text-xs text-[#1e3a5f] flex gap-2">
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
          <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">⚠️ Most Common PFMEA Mistakes — and How to Fix Them</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { mistake:'Failure Mode is too vague', fix:'Wrong: "Part NG". Right: "Weld penetration below 3mm spec due to robot current drift"', color:'border-red-700 bg-red-50' },
                { mistake:'Using RPN instead of AP', fix:'AIAG-VDA 2019 mandates AP. Using RPN = non-conformance in a VDA customer audit.', color:'border-red-700 bg-red-50' },
                { mistake:'Root cause = symptom', fix:'Wrong: "Operator mistake". Right: "No error-proofing exists to prevent wrong assembly"', color:'border-orange-700 bg-orange-900/30/30' },
                { mistake:'S=10 but AP rated Low', fix:'S≥9 with O≥4 is ALWAYS High AP per AIAG-VDA table. No exceptions.', color:'border-orange-700 bg-orange-900/30/30' },
                { mistake:'PFMEA not updated after complaint', fix:'Any customer complaint = mandatory PFMEA review. Find the escape point. Add detection action.', color:'border-yellow-700 bg-yellow-950/30' },
                { mistake:'Actions listed but never completed', fix:'Track PFMEA actions in management review. Overdue High AP items = immediate escalation.', color:'border-yellow-700 bg-yellow-950/30' },
                { mistake:'Control Plan not linked to PFMEA', fix:'Every detection control in PFMEA must match the Control Plan. Audit both together.', color:'border-blue-700/50 bg-[#eff6ff]' },
                { mistake:'PFMEA done only for PPAP submission', fix:'PFMEA is a living document. Update it at every 4M change, re-PPAP, or process modification.', color:'border-blue-700/50 bg-[#eff6ff]' },
              ].map((m,i)=>(
                <div key={i} className={`border rounded-lg p-3 ${m.color}`}>
                  <p className="text-xs font-bold text-red-700 mb-1">❌ {m.mistake}</p>
                  <p className="text-xs text-[#1e3a5f]">✅ {m.fix}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
      )}

      {/* -- GENERATOR TAB -------------------------------------------------- */}
      {/* -- ANALYSER TAB --------------------------------------------------- */}
      {mainTab === 'analyser' && (
        <div className="animate-fadeIn space-y-5 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
          <a href="/downloads/pfmea/PFMEA_AP_Risk_Calculator.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>AP Risk Calculator XLS</a>
          <a href="/downloads/pfmea/PFMEA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Audit Checklist XLS</a>
          <a href="/downloads/pfmea/PFMEA_SOD_Rating_Tables.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>S/O/D Tables XLS</a>
          <a href="/downloads/pfmea/PFMEA_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>Case Studies PDF</a>
          </div>
          <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="text-base font-bold text-white">PFMEA Action Priority Analyser</div>
                <div className="text-[#1e3a5f] text-xs mt-0.5">Analyses your PFMEA (from the Generator tab) — AP risk summary, open actions, missing coverage, audit readiness score</div>
              </div>
            </div>
            {rows.length === 0 || (rows.length === 1 && !rows[0].processStep) ? (
              <div className="bg-gray-700 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <div className="text-[#1e3a5f] font-semibold text-sm">No PFMEA data to analyse yet</div>
                <div className="text-[#1e3a5f] text-xs mt-2">Go to the ⚡ Generator tab, enter your process steps and risk ratings, then return here for analysis</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label:'Total Rows', val:rows.length, color:'text-white bg-gray-700 border-[#dbeafe]' },
                    { label:'High AP (🔴)', val:highAP, color:highAP > 0 ? 'text-red-700 bg-red-50 border-red-800/40' : 'text-[#1e3a5f] bg-gray-700 border-[#dbeafe]' },
                    { label:'Medium AP (🟡)', val:medAP, color:medAP > 0 ? 'text-yellow-300 bg-yellow-900/30/30 border-yellow-800/40' : 'text-[#1e3a5f] bg-gray-700 border-[#dbeafe]' },
                    { label:'Actions Done', val:doneAP, color:doneAP > 0 ? 'text-[#15803d] bg-green-900/30 border-green-700/50' : 'text-[#1e3a5f] bg-gray-700 border-[#dbeafe]' },
                  ].map(s => (
                    <div key={s.label} className={`border rounded-xl p-3 text-center ${s.color}`}>
                      <div className="text-2xl font-bold">{s.val}</div>
                      <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Health score */}
                {(() => {
                  const total = rows.length;
                  const safe = rows.filter(r => r.ap === 'L' || r.ap === 'done').length;
                  const pct = total > 0 ? Math.round(safe / total * 100) : 0;
                  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f97316' : '#ef4444';
                  const label = pct >= 80 ? 'HEALTHY' : pct >= 50 ? 'AT RISK' : 'CRITICAL';
                  return (
                    <div className={`rounded-xl p-4 border text-center`} style={{ background: color + '15', borderColor: color + '44' }}>
                      <div className="text-3xl font-bold" style={{ color }}>{pct}%</div>
                      <div className="font-bold text-sm tracking-wider" style={{ color }}>{label}</div>
                      <div className="text-[#1e3a5f] text-xs mt-1">{safe} of {total} rows are Low AP or completed</div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })()}

                {/* High AP items */}
                {highAP > 0 && (
                  <div className="bg-red-50 border border-red-800/40 rounded-xl p-4">
                    <div className="text-xs font-bold text-red-600 mb-3">🔴 High AP Items — Immediate Action Required ({highAP})</div>
                    {rows.filter(r => r.ap === 'H').map((r, i) => (
                      <div key={i} className="bg-white rounded-lg px-3 py-2 mb-2">
                        <div className="text-xs font-semibold text-white">{r.processStep || `Row ${i+1}`} — {r.failureMode || 'Failure mode not specified'}</div>
                        <div className="text-xs text-[#1e3a5f] mt-0.5">Effect: {r.failureEffects || '—'} · S:{r.severity} O:{r.occurrence} D:{r.detection}</div>
                        <div className="text-xs text-red-700 mt-0.5">Action: {r.preventionAction || r.detectionAction || '⚠️ No action taken — HIGH RISK'}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completeness check */}
                <div className="bg-gray-700 rounded-xl p-4">
                  <div className="text-xs font-bold text-white mb-3">📋 PFMEA Completeness Check</div>
                  {[
                    { label:'Process steps filled', pass: rows.every(r => r.processStep !== '') },
                    { label:'All failure modes specified', pass: rows.every(r => r.failureMode !== '') },
                    { label:'All failure effects specified', pass: rows.every(r => r.failureEffects !== '') },
                    { label:'Severity rated for all rows', pass: rows.every(r => r.severity > 0) },
                    { label:'Occurrence rated for all rows', pass: rows.every(r => r.occurrence > 0) },
                    { label:'Detection rated for all rows', pass: rows.every(r => r.detection > 0) },
                    { label:'No unaddressed High AP items', pass: highAP === 0 },
                    { label:'Header subject/process filled', pass: header.subject !== '' },
                  ].map(c => (
                    <div key={c.label} className="overflow-x-auto flex items-center gap-2 py-1.5 border-b border-[#dbeafe]">
                      <span className={`text-sm flex-shrink-0 ${c.pass ? 'text-green-600' : 'text-red-600'}`}>{c.pass ? '✓' : '✗'}</span>
                      <span className={`text-xs ${c.pass ? 'text-[#1e3a5f]' : 'text-red-700'}`}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* -- FMEA Completeness Score ---------------------------------- */}
          <div className="mt-5 bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer bg-purple-900/30 border-b border-purple-700/40 flex-wrap gap-y-2"
              onClick={()=>setShowFmeaScore(s=>!s)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <div className="text-sm font-bold text-white">PFMEA Completeness Score</div>
                  <div className="text-xs text-purple-300">Check your PFMEA against 14 AIAG-VDA audit criteria — get an instant readiness score</div>
                </div>
              </div>
              <span className="text-[#1e3a5f] text-lg">{showFmeaScore ? '▲' : '▼'}</span>
            </div>
            {showFmeaScore && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {FMEA_SCORE_ITEMS.map((item, i) => (
                    <label key={i} className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-[#dbeafe]/50"
                      style={{border: fmeaChecks[i] ? '1px solid #4ade80' : '1px solid #374151'}}>
                      <input type="checkbox" checked={!!fmeaChecks[i]}
                        onChange={e => setFmeaChecks(p => ({...p, [i]: e.target.checked}))}
                        style={{marginTop:'2px', width:'14px', height:'14px', flexShrink:0, accentColor:'#4ade80'}} />
                      <span className={`text-xs leading-relaxed ${fmeaChecks[i] ? 'text-[#15803d] line-through' : 'text-[#1e3a5f]'}`}>{item}</span>
                    </label>
                  ))}
                </div>
                {(() => {
                  const done = Object.values(fmeaChecks).filter(Boolean).length;
                  const total = FMEA_SCORE_ITEMS.length;
                  const pct = Math.round((done/total)*100);
                  const ok = done === total;
                  const col = ok ? '#4ade80' : pct >= 70 ? '#fbbf24' : '#f87171';
                  return (
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1" style={{color: col}}>
                        <span>PFMEA Readiness Score</span>
                        <span>{done}/{total} ({pct}%)</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden mb-3" style={{background:'#374151'}}>
                        <div className="h-3 rounded-full transition-all duration-500" style={{width:`${pct}%`, background: col}} />
                      </div>
                      {ok ? (
                        <div className="text-center p-3 rounded-xl" style={{background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)'}}>
                          <div className="text-2xl mb-1">✅</div>
                          <div className="text-sm font-bold text-green-600">PFMEA AUDIT READY</div>
                          <div className="text-xs text-[#15803d] mt-1">All 14 criteria met. Your PFMEA is ready for customer audit and PPAP submission.</div>
                        </div>
                      ) : (
                        <div className="text-xs p-3 rounded-xl" style={{background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#fca5a5'}}>
                          ⚠️ {total - done} criteria not yet met. Address all gaps before customer audit or PPAP submission.
                          {pct < 70 && ' CRITICAL: PFMEA has significant gaps — do not submit for PPAP in this state.'}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          </div>
        </div>
      )}


      {mainTab === 'generator' && (<div>
        <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
          <span className="text-[#1e3a5f] text-xs font-bold mr-1">📥 Downloads:</span>
              <a href="/downloads/pfmea/PFMEA_Master_Template_AIAG_VDA.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#059669'}}>PFMEA Excel Template</a>
              <a href="/downloads/pfmea/PFMEA_AP_Risk_Calculator.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>AP Calculator XLS</a>
              <a href="/downloads/pfmea/AIAG_VDA_FMEA_Handbook.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>AIAG-VDA Handbook</a>
        </div>
      <div className="bg-white rounded-lg p-4 mb-4 border border-[#dbeafe]">
        <h2 className="text-xs font-bold text-[#1e3a5f] mb-3 uppercase tracking-wide">PFMEA Header {'—'} AIAG VDA 2019</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {hdrFields.map(([lbl, key, type]) => (
            <div key={key}>
              <label className="text-xs text-[#1e3a5f] block mb-0.5">{lbl}</label>
              <input type={type || 'text'} className="bg-gray-700 border border-[#dbeafe] text-white text-xs px-2 py-1 rounded w-full"
                value={header[key]} onChange={e => setHdr(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="text-xs text-[#1e3a5f] block mb-0.5">Confidentiality Level</label>
            <select className="bg-gray-700 border border-[#dbeafe] text-white text-xs px-2 py-1 rounded w-full"
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
          className={`text-sm px-4 py-1.5 rounded font-medium border ${tab === 'manual' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
          Manual Entry
        </button>
        <button onClick={() => setTab('import')}
          className={`text-sm px-4 py-1.5 rounded font-medium border ${tab === 'import' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-[#dbeafe] text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
          Import Excel
        </button>
      </div>
      {tab === 'import' && (
        <div className="animate-fadeIn bg-white border border-[#dbeafe] rounded-lg p-6 mb-4">
          <h3 className="text-sm font-bold text-[#1e3a5f] mb-2">Import from XLSX</h3>
          <p className="text-xs text-[#1e3a5f] mb-4">Upload an Excel file exported from this tool. Row numbers must be in column A; data columns follow AIAG-VDA order.</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport}
            className="block text-sm text-[#1e3a5f] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" />
          {importStatus && (
            <p className={`mt-3 text-xs font-medium ${importStatus.startsWith('✓') ? 'text-green-600' : importStatus.startsWith('Error') ? 'text-red-600' : 'text-yellow-600'}`}>
              {importStatus}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mb-3 text-xs items-center">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">H {'—'} High (Must Act)</span>
        <span className="bg-yellow-400 text-black px-2 py-0.5 rounded font-bold">M {'—'} Medium (Should Act)</span>
        <span className="bg-green-600 text-white px-2 py-0.5 rounded font-bold">L {'—'} Low (Review)</span>
        <span className="text-[#1e3a5f]">AP auto-calculated per AIAG VDA 2019 S/O/D table</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#dbeafe] mb-4">
        <table className="text-xs min-w-max border-collapse">
          <thead>
            <tr>
              <th className={`${th} bg-gray-700 w-8`}>#</th>
              <th colSpan={3} className={`${th} bg-[#eff6ff] text-blue-200`}>STRUCTURE ANALYSIS</th>
              <th colSpan={3} className={`${th} bg-green-900/30 text-green-200`}>FUNCTION ANALYSIS</th>
              <th colSpan={4} className={`${th} bg-orange-900/30 text-orange-200`}>FAILURE ANALYSIS</th>
              <th colSpan={7} className={`${th} bg-red-900 text-red-200`}>RISK ANALYSIS</th>
              <th colSpan={11} className={`${th} bg-purple-900/30 text-purple-200`}>OPTIMIZATION</th>
              <th className={`${th} bg-gray-700`}></th>
            </tr>
            <tr>
              <th className={`${th} bg-gray-700`}>No.</th>
              <th className={`${th} bg-[#eff6ff] text-blue-200 w-32`}>{'1. Process Item\n(System/Part)'}</th>
              <th className={`${th} bg-[#eff6ff] text-blue-200 w-36`}>{'2. Process Step\n(Station No. & Name)'}</th>
              <th className={`${th} bg-[#eff6ff] text-blue-200 w-28`}>{'3. Work Element\n(4M Type)'}</th>
              <th className={`${th} bg-green-900/30 text-green-200 w-32`}>{'1. Function of\nProcess Item'}</th>
              <th className={`${th} bg-green-900/30 text-green-200 w-36`}>{'2. Function of Process Step\n+ Product Char.'}</th>
              <th className={`${th} bg-green-900/30 text-green-200 w-36`}>{'3. Function of Work Element\n+ Process Char.'}</th>
              <th className={`${th} bg-orange-900/30 text-orange-200 w-40`}>{'1. Failure Effects (FE)\n→ Inplant / Ship / End User'}</th>
              <th className={`${th} bg-orange-900/30 text-orange-200 w-8`}>S</th>
              <th className={`${th} bg-orange-900/30 text-orange-200 w-36`}>{'2. Failure Mode (FM)\nat Focus Element'}</th>
              <th className={`${th} bg-orange-900/30 text-orange-200 w-36`}>{'3. Failure Cause (FC)\nof Work Element'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-36`}>{'Prevention Controls\n(PC) of FC'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>O</th>
              <th className={`${th} bg-red-950 text-red-200 w-36`}>{'Detection Controls\n(DC) of FC/FM'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-8`}>D</th>
              <th className={`${th} bg-red-950 text-red-200 w-10`}>AP</th>
              <th className={`${th} bg-red-950 text-red-200 w-16`}>{'Special\nChar.'}</th>
              <th className={`${th} bg-red-950 text-red-200 w-14`}>{'Filter\nCode'}</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-32`}>{'Prevention\nAction'}</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-32`}>{'Detection\nAction'}</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-24`}>{'Responsible\nPerson'}</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-24`}>{'Target\nDate'}</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-28`}>Status</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-32`}>{'Action Taken\n(+Evidence)'}</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-24`}>{'Completion\nDate'}</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-8`}>S'</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-8`}>O'</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-8`}>D'</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-10`}>AP'</th>
              <th className={`${th} bg-purple-900/30 text-purple-200 w-24`}>Remarks</th>
              <th className={`${th} bg-gray-700 w-8`}>Del</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#eff6ff]'}>
                <td className={`${td} text-center text-[#1e3a5f]`}>{i + 1}</td>
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
                <td className={td}><button onClick={() => delRow(r.id)} className="text-red-600 hover:text-red-200 text-sm px-1">{'✕'}</button></td>
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
        <span className="text-xs text-[#1e3a5f] self-center">
          {rows.length} row{rows.length !== 1 ? 's' : ''} | {highAP} High | {medAP} Medium | {lowAP} Low AP
        </span>
      </div>
      <div className="bg-white rounded-lg p-4 border border-[#dbeafe]">
        <h3 className="text-xs font-bold text-[#1e3a5f] mb-3 uppercase tracking-wide">AIAG VDA 2019 Rating Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-bold text-red-600 mb-1">Severity (S) {'—'} Effect on Customer</p>
            <div className="space-y-0.5 text-[#1e3a5f]">
              <p><span className="text-white font-medium">10</span> {'—'} Safety impact without warning</p>
              <p><span className="text-white font-medium">9</span> {'—'} Safety / regulatory noncompliance</p>
              <p><span className="text-white font-medium">7{'–'}8</span> {'—'} Major function lost / line shutdown</p>
              <p><span className="text-white font-medium">5{'–'}6</span> {'—'} Reduced function, rework required</p>
              <p><span className="text-white font-medium">3{'–'}4</span> {'—'} Minor defect noticed by customer</p>
              <p><span className="text-white font-medium">1{'–'}2</span> {'—'} No discernible effect</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-yellow-600 mb-1">Occurrence (O) {'—'} Failure Rate</p>
            <div className="space-y-0.5 text-[#1e3a5f]">
              <p><span className="text-white font-medium">10</span> {'—'} No prevention controls</p>
              <p><span className="text-white font-medium">9</span> {'—'} Controls little effect (behavioral)</p>
              <p><span className="text-white font-medium">7{'–'}8</span> {'—'} Controls somewhat effective</p>
              <p><span className="text-white font-medium">5{'–'}6</span> {'—'} Controls are effective</p>
              <p><span className="text-white font-medium">3{'–'}4</span> {'—'} Controls highly effective</p>
              <p><span className="text-white font-medium">1{'–'}2</span> {'—'} Controls extremely effective (technical)</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-blue-600 mb-1">Detection (D) {'—'} Detectability</p>
            <div className="space-y-0.5 text-[#1e3a5f]">
              <p><span className="text-white font-medium">10</span> {'—'} Cannot / will not detect</p>
              <p><span className="text-white font-medium">8{'–'}9</span> {'—'} Remote chance / low detectability</p>
              <p><span className="text-white font-medium">6{'–'}7</span> {'—'} Human inspection (moderate)</p>
              <p><span className="text-white font-medium">4{'–'}5</span> {'—'} Machine-based detection downstream</p>
              <p><span className="text-white font-medium">2{'–'}3</span> {'—'} Machine-based in-station detection</p>
              <p><span className="text-white font-medium">1</span> {'—'} Failure mode cannot be produced</p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#dbeafe]">
          <p className="font-bold text-[#1e3a5f] mb-1 text-xs">AP Determination (AIAG VDA 2019)</p>
          <div className="flex flex-wrap gap-4 text-xs text-[#1e3a5f]">
            <p><span className="text-red-600 font-bold">H (High)</span>: S{'≥'}9+O{'≥'}4 | S{'≥'}7+O{'≥'}6 | S{'≥'}7+O{'≥'}4+D{'≥'}2</p>
            <p><span className="text-yellow-600 font-bold">M (Medium)</span>: S{'≥'}9+O{'≥'}2+D{'≥'}2 | S{'≥'}4+O{'≥'}6+D{'<'}4</p>
            <p><span className="text-green-600 font-bold">L (Low)</span>: All other combinations</p>
          </div>
        </div>
      </div>
      </div>)}

      {/* -- DOWNLOADS TAB --------------------------------------------------- */}
      {/* -- TEMPLATES TAB -------------------------------------------------- */}
      {mainTab === 'templates' && (
        <div className="animate-fadeIn space-y-4 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
          <a href="/downloads/pfmea/PFMEA_Master_Template_AIAG_VDA.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>PFMEA Master Template XLS</a>
          <a href="/downloads/pfmea/PFMEA_AP_Risk_Calculator.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>AP Risk Calculator XLS</a>
          <a href="/downloads/pfmea/PFMEA_SOD_Rating_Tables.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>S/O/D Rating Tables XLS</a>
          <a href="/downloads/pfmea/PFMEA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Audit Checklist XLS</a>
          </div>
          <p className="text-[#1e3a5f] text-sm">AIAG-VDA 2019 format templates for PFMEA. Download and customize for your process.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'PFMEA Blank Worksheet', type: 'Excel', icon: '⚙️', desc: 'Full AIAG-VDA PFMEA format — all 10 columns, S/O/D scales, AP lookup, optimisation columns', file: '/downloads/pfmea/PFMEA_Blank_Worksheet.xlsx' },
              { name: 'PFMEA Action Priority Table', type: 'Excel', icon: '📊', desc: 'Full AP determination table per AIAG-VDA 2019 — H/M/L for all S×O×D combinations', file: '/downloads/pfmea/PFMEA_Action_Priority_Table.xlsx' },
              { name: 'PFMEA to Control Plan Link', type: 'Excel', icon: '🔗', desc: 'Template showing PFD step → PFMEA row → Control Plan row linkage with process step alignment', file: '/downloads/pfmea/PFMEA_ControlPlan_Link.xlsx' },
              { name: 'PFMEA Audit Checklist', type: 'Word', icon: '✅', desc: '25-point PFMEA quality checklist for internal review — completeness, AP ratings, action plan follow-up', file: '/downloads/pfmea/PFMEA_Audit_Checklist.docx' },
            ].map(tpl => (
              <div key={tpl.name} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex gap-3 items-start" onDoubleClick={() => tpl.file.endsWith('.pdf') && window.open(tpl.file, '_blank')} title={tpl.file.endsWith('.pdf') ? 'Double-click to view' : ''} style={{ cursor: tpl.file.endsWith('.pdf') ? 'pointer' : 'default' }}>
                <div className="text-2xl flex-shrink-0">{tpl.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm mb-1">{tpl.name}</div>
                  <div className="text-[#1e3a5f] text-xs mb-2 leading-relaxed">{tpl.desc}</div>
                  <a href={tpl.file} download className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition ${tpl.type === 'Excel' ? 'bg-green-700 hover:bg-green-600' : 'bg-blue-700 hover:bg-blue-600'}`}>⬇ {tpl.type}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -- DOCS TAB ------------------------------------------------------- */}
      {mainTab === 'docs' && (
        <div className="animate-fadeIn space-y-4 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
          <a href="/downloads/pfmea/PFMEA_vs_DFMEA_Comparison.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0e7490'}}>PFMEA vs DFMEA PDF</a>
          <a href="/downloads/pfmea/PFMEA_Process_Flow_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>PFD Linkage Guide</a>
          <a href="/downloads/pfmea/PFMEA_Failure_Mode_Library.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Failure Mode Library</a>
          <a href="/downloads/pfmea/PFMEA_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>Case Studies PDF</a>
          </div>
          <div className="bg-white border border-red-800/40 rounded-2xl p-5 flex items-center gap-5">
            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📕</div>
            <div className="flex-1">
              <div className="font-bold text-white text-base mb-1">AIAG-VDA FMEA Handbook (1st Edition)</div>
              <div className="text-[#1e3a5f] text-xs mb-2">Complete AIAG-VDA joint FMEA manual — DFMEA + PFMEA, 7-Step approach, Action Priority replacing RPN</div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">PDF · 107 MB</span>
                <span className="text-xs bg-purple-900/30 text-purple-700 px-2 py-0.5 rounded">AIAG-VDA Joint Standard</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <a href="/downloads/pfmea/AIAG_VDA_FMEA_Handbook.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-bold transition">👁 View PDF</a>
                <a href="/downloads/pfmea/AIAG_VDA_FMEA_Handbook.pdf" download className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition">⬇ Download</a>
              </div>
          </div>
          <div className="space-y-3">
            {[
              { title: 'RPN vs Action Priority Migration Guide', icon: '🔄', desc: 'How to convert existing RPN-based PFMEAs to AIAG-VDA Action Priority — step-by-step migration', file: '/downloads/pfmea/PFMEA_RPN_to_AP_Migration.pdf' },
              { title: 'Special Characteristics in PFMEA', icon: '⭐', desc: 'Identifying, classifying CC/SC characteristics and cascading to Control Plan correctly', file: '/downloads/pfmea/PFMEA_Special_Characteristics.pdf' },
              { title: 'PFMEA IATF Clause Mapping', icon: '📌', desc: 'Maps PFMEA requirements to IATF 16949 clauses 8.5.1.1, 8.5.1.2 and CSRs', file: '/downloads/pfmea/PFMEA_IATF_Mapping.pdf' },
            ].map(doc => (
              <div key={doc.title} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex items-center gap-4" onDoubleClick={() => window.open(doc.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                <div className="text-2xl flex-shrink-0">{doc.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm mb-1">{doc.title}</div>
                  <div className="text-[#1e3a5f] text-xs leading-relaxed">{doc.desc}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={doc.file} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-[#1e3a5f] rounded-lg text-xs font-bold transition">View →</a>
                  <a href={doc.file} download className="px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition">⬇ PDF</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -- POSTERS TAB ---------------------------------------------------- */}
      {mainTab === 'posters' && (
        <div className="animate-fadeIn space-y-4 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
          <a href="/downloads/pfmea/PFMEA_Posters_A3.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>All PFMEA Posters PDF</a>
          <a href="/downloads/pfmea/PFMEA_Process_Flow_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>PFD Linkage Guide</a>
          <a href="/downloads/pfmea/PFMEA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <p className="text-[#1e3a5f] text-sm">Print-ready PFMEA posters and reference banners for quality lab, workstation, and training room display.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title:'PFMEA 7-Step Flow Poster', size:'A1 Poster', desc:'Complete AIAG-VDA 7-step PFMEA process: Structure → Function → Failure → Risk → Optimization', colors:['#b91c1c','#dc2626'], file:'/downloads/pfmea/PFMEA_7Step_Flow_Poster.pdf' },
              { title:'Action Priority (AP) Reference Card', size:'A3 Poster', desc:'Full AP determination table — Severity × Occurrence × Detection → H/M/L for factory reference', colors:['#92400e','#b45309'], file:'/downloads/pfmea/PFMEA_AP_Reference_Poster.pdf' },
              { title:'S/O/D Rating Scale Poster', size:'A2 Poster', desc:'Complete Severity, Occurrence, Detection 1-10 rating scales with descriptions — AIAG-VDA 2019', colors:['#5b21b6','#7c3aed'], file:'/downloads/pfmea/PFMEA_SOD_Scales_Poster.pdf' },
              { title:'PFD → PFMEA → Control Plan Trinity', size:'A1 Poster', desc:'Visual showing how process step numbers must match across PFD, PFMEA and Control Plan', colors:['#065f46','#047857'], file:'/downloads/pfmea/PFMEA_Trinity_Poster.pdf' },
              { title:'Special Characteristics in PFMEA', size:'A2 Banner', desc:'CC and SC symbol guide with required Severity ratings and mandatory AP response levels', colors:['#1e3a5f','#1e40af'], file:'/downloads/pfmea/PFMEA_Special_Char_Banner.pdf' },
              { title:'Common PFMEA Audit Findings', size:'A2 Banner', desc:'Top 10 PFMEA audit findings under IATF 16949 — visual checklist for audit preparation', colors:['#7f1d1d','#991b1b'], file:'/downloads/pfmea/PFMEA_Audit_Findings_Banner.pdf' },
            ].map(p => (
              <div key={p.title} className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden" onDoubleClick={() => window.open(p.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                <div style={{ background:`linear-gradient(135deg, ${p.colors[0]}33, ${p.colors[1]}55)`, borderBottom:'1px solid #374151' }} className="h-36 flex flex-col items-center justify-center gap-2 p-4">
                  <div className="flex gap-2">{p.colors.map((c,i) => <div key={i} style={{ width:18, height:18, borderRadius:4, background:c }} />)}</div>
                  <div style={{ color:p.colors[0], fontSize:11, fontWeight:700, textAlign:'center' }}>{p.title}</div>
                  <div className="text-xs text-[#1e3a5f] bg-white px-2 py-0.5 rounded-full">{p.size}</div>
                </div>
                <div className="p-4">
                  <div className="text-white font-semibold text-xs mb-1">{p.title}</div>
                  <p className="text-[#1e3a5f] text-xs leading-relaxed mb-3">{p.desc}</p>
                  <div className="flex gap-2">
                    <a href={p.file} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-bold py-2 bg-gray-700 hover:bg-gray-600 text-[#1e3a5f] rounded-lg transition">🖨️ View</a>
                    <a href={p.file} download className="flex-1 text-center text-xs font-bold py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg transition">⬇ Download</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-red-800/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="text-3xl">🖨️</div>
            <div>
              <div className="text-sm font-bold text-red-700">Print & Display in Your Factory</div>
              <div className="text-xs text-[#1e3a5f] mt-1">All posters formatted for A1/A2/A3. Laminate and display near PFMEA workstations, quality meeting room, and engineering area.</div>
            </div>
          </div>
        </div>
      )}


      {/* ══ DASHBOARD TAB ═══════════════════════════════════════════════════ */}
      {mainTab === 'dashboard' && (
        <div className="animate-fadeIn space-y-5 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/pfmea/PFMEA_AP_Risk_Calculator.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>AP Risk Calculator XLS</a>
            <a href="/downloads/pfmea/PFMEA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Audit Checklist XLS</a>
            <a href="/downloads/pfmea/PFMEA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Common NC Findings</a>
            <a href="/downloads/pfmea/PFMEA_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>Case Studies PDF</a>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-y-2">
            <div>
              <div className="text-xl font-extrabold text-white">📊 PFMEA Program Dashboard</div>
              <div className="text-xs text-[#1e3a5f] mt-1">Live PFMEA health status — AP risk profile, open actions, coverage gaps</div>
            </div>
            <div className="text-xs text-[#1e3a5f] bg-white px-3 py-1 rounded-full">BKT-001 Process PFMEA v3.2</div>
          </div>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {label:'Total Failure Modes', value:'42', icon:'⚠️', color:'#dc2626', sub:'Across 8 process steps'},
              {label:'AP = HIGH', value:'6', icon:'🔴', color:'#dc2626', sub:'Mandatory action required'},
              {label:'AP = MEDIUM', value:'18', icon:'🟡', color:'#d97706', sub:'Action required 90 days'},
              {label:'AP = LOW', value:'18', icon:'🟢', color:'#059669', sub:'Review at next meeting'},
            ].map(k=>(
              <div key={k.label} className="bg-white border border-[#dbeafe] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{k.icon}</span>
                  <div className="text-xs text-[#1e3a5f] font-semibold">{k.label}</div>
                </div>
                <div className="text-3xl font-extrabold" style={{color:k.color}}>{k.value}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">{k.sub}</div>
              </div>
            ))}
          </div>
          {/* AP Distribution Bar */}
          <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
            <div className="text-sm font-bold text-white mb-4">Action Priority (AP) Distribution by Process Step</div>
            {[
              {step:'Receiving Inspection', h:0, m:2, l:3},
              {step:'Welding', h:2, m:4, l:2},
              {step:'Heat Treatment', h:1, m:3, l:2},
              {step:'CNC Machining', h:2, m:5, l:4},
              {step:'Assembly - Press', h:1, m:2, l:2},
              {step:'Surface Treatment', h:0, m:1, l:2},
              {step:'Final Inspection', h:0, m:1, l:3},
            ].map(s=>{
              const total = s.h+s.m+s.l;
              return (
                <div key={s.step} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#1e3a5f] font-semibold">{s.step}</span>
                    <div className="flex gap-2">
                      {s.h>0 && <span className="text-red-600 font-bold">H:{s.h}</span>}
                      {s.m>0 && <span className="text-yellow-600 font-bold">M:{s.m}</span>}
                      {s.l>0 && <span className="text-green-600 font-bold">L:{s.l}</span>}
                    </div>
                  </div>
                  <div className="flex h-5 rounded-lg overflow-hidden">
                    <div style={{width:`${(s.h/total)*100}%`, background:'#dc2626'}} title={`H: ${s.h}`} />
                    <div style={{width:`${(s.m/total)*100}%`, background:'#d97706'}} title={`M: ${s.m}`} />
                    <div style={{width:`${(s.l/total)*100}%`, background:'#059669'}} title={`L: ${s.l}`} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Open Actions */}
          <div className="bg-white border border-red-900/40 rounded-xl p-5">
            <div className="text-sm font-bold text-white mb-4">🔴 Open AP=H Actions — Immediate Escalation Required</div>
            {[
              {fm:'Incomplete weld', step:'Welding', s:9, o:4, d:2, ap:'H', owner:'Raj Kumar', due:'2025-08-15', status:'In Progress'},
              {fm:'Under-press force', step:'Assembly-Press', s:8, o:3, d:1, ap:'H', owner:'Priya Singh', due:'2025-08-20', status:'Planned'},
              {fm:'Wrong heat cycle', step:'Heat Treatment', s:9, o:2, d:2, ap:'H', owner:'Amit Shah', due:'2025-08-25', status:'Open'},
            ].map((a,i)=>(
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg mb-2" style={{background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)'}}>
                <div className="text-xs px-2 py-0.5 rounded font-bold text-white" style={{background:'#dc2626'}}>H</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white">{a.fm}</div>
                  <div className="text-xs text-[#1e3a5f]">{a.step} | S={a.s} O={a.o} D={a.d}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#1e3a5f]">{a.owner}</div>
                  <div className="text-xs text-red-600">Due: {a.due}</div>
                </div>
                <div className="text-xs px-2 py-0.5 rounded" style={{background:a.status==='Open'?'rgba(220,38,38,0.2)':a.status==='Planned'?'rgba(251,191,36,0.2)':'rgba(74,222,128,0.2)', color:a.status==='Open'?'#fca5a5':a.status==='Planned'?'#fbbf24':'#4ade80'}}>
                  {a.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ DEEP DIVE TAB ════════════════════════════════════════════════════ */}
      {mainTab === 'deepdive' && (
        <div className="animate-fadeIn space-y-4 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/pfmea/AIAG_VDA_FMEA_Handbook.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>AIAG-VDA Handbook PDF</a>
            <a href="/downloads/pfmea/PFMEA_SOD_Rating_Tables.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>S/O/D Rating Tables XLS</a>
            <a href="/downloads/pfmea/PFMEA_Process_Flow_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>PFD Linkage Guide</a>
            <a href="/downloads/pfmea/PFMEA_vs_DFMEA_Comparison.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>PFMEA vs DFMEA</a>
          </div>
          <div className="text-xl font-extrabold text-white mb-1">🧩 PFMEA 7-Step Deep Dive — AIAG-VDA 2019</div>
          <div className="text-xs text-[#1e3a5f] mb-4">Detailed guidance for each of the 7 steps — inputs, outputs, common mistakes, and IATF requirements</div>
          {FMEA_STEPS.map(step => (
            <div key={step.step} className="rounded-2xl overflow-hidden" style={{border:`2px solid ${step.color}33`}}>
              <div className="flex items-center gap-4 p-4" style={{background: step.color}}>
                <div className="text-2xl">{step.icon}</div>
                <div>
                  <div className="text-base font-extrabold text-white">Step {step.step}: {step.name}</div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.75)'}}>AIAG-VDA 2019 — {step.items.length} key actions</div>
                </div>
              </div>
              <div className="p-4" style={{background:'#f1f5f9'}}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {step.items.map((item,i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{background:'rgba(255,255,255,0.04)', border:`1px solid ${step.color}22`}}>
                      <span className="text-xs font-extrabold flex-shrink-0" style={{color:step.color}}>{i+1}.</span>
                      <span className="text-xs text-[#1e3a5f] leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ WORKFLOW TAB ════════════════════════════════════════════════════ */}
      {mainTab === 'workflow' && (
        <div className="animate-fadeIn space-y-5 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/pfmea/PFMEA_Master_Template_AIAG_VDA.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>PFMEA Master Template</a>
            <a href="/downloads/pfmea/PFMEA_Process_Flow_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>PFD Linkage Guide</a>
            <a href="/downloads/pfmea/PFMEA_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <div className="text-xl font-extrabold text-white mb-1">🔄 PFMEA Development Workflow</div>
          <div className="text-xs text-[#1e3a5f] mb-5">End-to-end workflow from PFD input to Control Plan output — with RACI and key decision points</div>
          <div className="flex flex-col gap-0">
            {[
              {n:1, action:'Receive PFD from APQP Phase 3', who:'Quality Engineer', tool:'Process Flow Diagram', timing:'APQP Phase 3 start', color:'#1e40af'},
              {n:2, action:'Form Cross-Functional PFMEA Team', who:'Quality Manager', tool:'APQP team roster, RACI', timing:'Week 1', color:'#1e40af'},
              {n:3, action:'Structure Analysis — List all process steps from PFD', who:'QA + Mfg Engineering', tool:'PFD, Process map', timing:'Week 1-2', color:'#059669'},
              {n:4, action:'Function Analysis — Document process requirements per step', who:'QA + Engineering', tool:'Customer specs, drawings', timing:'Week 2', color:'#059669'},
              {n:5, action:'Failure Analysis — Identify failure modes, effects, causes', who:'Cross-functional team', tool:'Lessons learned, complaint history', timing:'Week 2-3', color:'#d97706'},
              {n:6, action:'Risk Analysis — Rate S/O/D, calculate AP (H/M/L)', who:'PFMEA team (consensus)', tool:'AIAG-VDA S/O/D tables', timing:'Week 3', color:'#dc2626'},
              {n:7, action:'Identify all AP=H items — Escalate to management', who:'Quality Manager', tool:'PFMEA action log', timing:'Week 3 (immediate)', color:'#dc2626'},
              {n:8, action:'Optimization — Assign actions, owners, target dates', who:'Dept heads + QA', tool:'Action tracker, PFMEA', timing:'Week 3-4', color:'#7c3aed'},
              {n:9, action:'Cross-functional review and sign-off', who:'QA + Plant Head', tool:'PFMEA review checklist', timing:'Week 4', color:'#7c3aed'},
              {n:10, action:'Link to Control Plan and Work Instructions', who:'Quality Engineer', tool:'Control Plan template', timing:'Week 4-5', color:'#0e7490'},
              {n:11, action:'PPAP submission — Include PFMEA package', who:'Quality Manager', tool:'PPAP 4th Edition', timing:'Before SOP', color:'#0e7490'},
              {n:12, action:'Ongoing review — Update after complaints, changes, annual review', who:'Quality Team', tool:'ECN tracker, complaint log', timing:'Continuous', color:'#1e293b'},
            ].map((s,i) => (
              <div key={s.n} className="flex gap-0 items-stretch">
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0 mt-2" style={{background:s.color}}>{s.n}</div>
                  {i<11 && <div className="w-0.5 flex-1 mt-1" style={{background:`${s.color}44`}} />}
                </div>
                <div className="flex-1 ml-3 mb-2 rounded-xl p-3" style={{background:'#f1f5f9', border:`1px solid ${s.color}33`}}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-bold text-white">{s.action}</div>
                    <div className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-semibold" style={{background:`${s.color}22`, color:s.color}}>{s.timing}</div>
                  </div>
                  <div className="flex gap-4 text-xs text-[#1e3a5f]">
                    <span>👤 {s.who}</span>
                    <span>🔧 {s.tool}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ CASE STUDIES TAB ════════════════════════════════════════════════ */}
      {mainTab === 'casestudies' && (
        <div className="animate-fadeIn space-y-5 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/pfmea/PFMEA_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Case Studies PDF</a>
            <a href="/downloads/pfmea/PFMEA_Failure_Mode_Library.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Failure Mode Library</a>
            <a href="/downloads/pfmea/PFMEA_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Common NC Findings</a>
          </div>
          <div className="text-xl font-extrabold text-white mb-1">📂 PFMEA Case Studies</div>
          <div className="text-xs text-[#1e3a5f] mb-4">Real-world PFMEA failures and rescues — what went wrong, root cause, and lessons for future PFMEAs</div>
          {[
            {id:'CS-F01', part:'BKT-001 Bracket — Welding Process', customer:'Tata Motors', status:'ESCAPE', color:'#dc2626', tag:'Customer Return',
              problem:'Incomplete weld on safety bracket escaped to customer. PFMEA had S=9, AP=H but detection control was "operator visual inspection" — insufficient for sub-surface defects.',
              cause:'Detection control not updated after process change. Visual inspection cannot detect cold welds consistently.',
              lesson:'For S=9-10 failure modes, visual detection control is NOT acceptable. Must use 100% NDT (UT/MT/PT) or automated sensor. AP=H action must include poka-yoke verification.',
              bestpractice:'All S=9-10 failure modes must have detection controls reviewed by QA Manager. Signed evidence required before PPAP approval.'},
            {id:'CS-F02', part:'HUB-203 — CNC Bore Machining', customer:'Maruti Suzuki', status:'DELAYED SOP', color:'#d97706', tag:'Cpk Failure',
              problem:'PFMEA bore diameter failure mode had O=2 (optimistic). Actual process showed tool wear causing bore drift. 450 parts out of tolerance before detected.',
              cause:'Occurrence rating based on assumption, not historical data. No SPC data used during PFMEA development.',
              lesson:'Occurrence ratings must be based on historical data, not assumption. PFMEA team must use complaint history, internal rejection data, and process capability data.',
              bestpractice:'Before PFMEA review, pull 12 months of rejection data and Cpk history. Use this data to calibrate O ratings. Attach data as PFMEA evidence.'},
            {id:'CS-F03', part:'LINK-410 — Heat Treatment', customer:'Mahindra', status:'IATF NC', color:'#7c3aed', tag:'Major NC',
              problem:'Engineering change (spec hardness from 58-62 HRC to 60-64 HRC) implemented without PFMEA update. IATF auditor raised Major NC — Clause 8.5.6.1.',
              cause:'No Engineering Change Notification (ECN) process linked to PFMEA. Change done by Engineering without informing Quality team.',
              lesson:'PFMEA is a living document. Every ECN must trigger mandatory PFMEA review within 5 working days. QA must be in the ECN approval workflow.',
              bestpractice:'Add PFMEA update as a mandatory step in the ECN form. QA Manager approval of ECN must include PFMEA review confirmation.'},
            {id:'CS-F04', part:'AXLE-550 — Press Assembly', customer:'Ashok Leyland', status:'SUCCESS', color:'#059669', tag:'AP=H Closed',
              problem:'PFMEA identified AP=H for press force failure mode (S=8, O=4, D=1). Old control: "operator checks force gauge". Team identified this as insufficient.',
              cause:'Proactive identification during PFMEA review — team recognized visual gauge check is unreliable and O=4 is high.',
              lesson:'Proactive PFMEA review prevented escape. Team implemented 100% electronic press monitoring with auto-reject for out-of-range force. O reduced from 4 to 2, D from 1 to 2 — AP from H to M.',
              bestpractice:'Scheduled PFMEA review every 6 months (even without complaints) prevents escapes. AP=H items should trigger a dedicated improvement project.'},
          ].map(cs => (
            <div key={cs.id} className="rounded-2xl overflow-hidden" style={{border:`2px solid ${cs.color}33`}}>
              <div className="flex items-start justify-between p-4" style={{background:`${cs.color}12`, borderBottom:`1px solid ${cs.color}33`}}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{background:cs.color}}>{cs.id}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{color:cs.color, background:`${cs.color}15`, border:`1px solid ${cs.color}44`}}>{cs.tag}</span>
                  </div>
                  <div className="text-sm font-extrabold text-white">{cs.part}</div>
                  <div className="text-xs text-[#1e3a5f]">Customer: {cs.customer}</div>
                </div>
                <div className="text-xs font-bold px-3 py-1 rounded-lg" style={{background:`${cs.color}15`, color:cs.color, border:`1px solid ${cs.color}44`}}>{cs.status}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="p-3 rounded-lg" style={{background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)'}}>
                  <div className="text-xs font-bold text-red-600 mb-2">⚠️ Problem</div>
                  <div className="text-xs text-red-200 leading-relaxed">{cs.problem}</div>
                </div>
                <div className="p-3 rounded-lg" style={{background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)'}}>
                  <div className="text-xs font-bold text-yellow-600 mb-2">🔍 Root Cause</div>
                  <div className="text-xs text-yellow-200 leading-relaxed">{cs.cause}</div>
                </div>
                <div className="p-3 rounded-lg" style={{background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)'}}>
                  <div className="text-xs font-bold text-green-600 mb-2">💡 Lesson Learned</div>
                  <div className="text-xs text-green-200 leading-relaxed">{cs.lesson}</div>
                </div>
                <div className="p-3 rounded-lg" style={{background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)'}}>
                  <div className="text-xs font-bold text-indigo-600 mb-2">⭐ Best Practice</div>
                  <div className="text-xs text-indigo-200 leading-relaxed">{cs.bestpractice}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ TRAINING TAB ════════════════════════════════════════════════════ */}
      {mainTab === 'training' && (
        <div className="animate-fadeIn space-y-5 max-w-6xl">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/pfmea/PFMEA_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Training Guide PDF</a>
            <a href="/downloads/pfmea/PFMEA_Competency_Matrix.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Competency Matrix</a>
            <a href="/downloads/pfmea/PFMEA_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#059669'}}>Audit Checklist XLS</a>
            <a href="/downloads/pfmea/AIAG_VDA_FMEA_Handbook.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>AIAG-VDA Handbook</a>
          </div>
          <div className="text-xl font-extrabold text-white mb-1">🎓 PFMEA Training Academy</div>
          <div className="text-xs text-[#1e3a5f] mb-4">Structured training from Awareness to Lead Auditor — build PFMEA competency across your team</div>
          {/* Training Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {level:'Level 1', title:'PFMEA Awareness', role:'Operators / Technicians', color:'#059669', icon:'🌱', duration:'2 hours', topics:[
                'What is PFMEA and why it matters to you',
                'How PFMEA prevents defects at your workstation',
                'Control Plan — your daily quality instructions',
                'What to do when you find a defect',
                'Special characteristics (CC/SC) — why they matter',
              ]},
              {level:'Level 2', title:'PFMEA Practitioner', role:'Engineers / QA Staff', color:'#1e40af', icon:'⚙️', duration:'2 days', topics:[
                'AIAG-VDA 2019 format — all 7 steps',
                'S/O/D rating tables with automotive examples',
                'Action Priority (AP) calculation — H/M/L matrix',
                'Linking PFMEA to PFD and Control Plan',
                'Managing open AP=H actions with evidence',
              ]},
              {level:'Level 3', title:'PFMEA Lead / Auditor', role:'Quality Head / Managers', color:'#7c3aed', icon:'🏆', duration:'3 days + exam', topics:[
                'IATF 16949 clause requirements for PFMEA',
                'Facilitating cross-functional PFMEA teams',
                'Customer-specific PFMEA requirements (Ford, GM)',
                'Auditing PFMEA quality in supplier assessments',
                'PFMEA database management and revision control',
              ]},
            ].map(t => (
              <div key={t.level} className="rounded-2xl overflow-hidden" style={{border:`2px solid ${t.color}33`}}>
                <div className="p-4" style={{background:t.color}}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <div className="text-xs font-bold" style={{color:'rgba(255,255,255,0.7)', letterSpacing:'1px'}}>{t.level}</div>
                      <div className="text-sm font-extrabold text-white">{t.title}</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.8)'}}>{t.role}</div>
                  <div className="text-xs mt-1" style={{color:'rgba(255,255,255,0.6)'}}>Duration: {t.duration}</div>
                </div>
                <div className="p-4" style={{background:'#f1f5f9'}}>
                  {t.topics.map((tp,i) => (
                    <div key={i} className="overflow-x-auto flex gap-2 py-1.5 border-b border-[#dbeafe] text-xs text-[#1e3a5f]">
                      <span className="font-bold flex-shrink-0" style={{color:t.color}}>✓</span>{tp}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Competency Matrix */}
          <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
            <div className="text-sm font-bold text-white mb-4">📊 PFMEA Competency Matrix</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{background:'#f1f5f9'}}>
                    {['Role','7-Step PFMEA','AP Rating','CC/SC','Control Plan Link','IATF Audit','Team Facilitation'].map(h => (
                      <th key={h} className="p-2 text-left text-white font-bold border border-[#dbeafe]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Quality Head','L3','L3','L3','L3','L3','L3'],
                    ['Quality Manager','L3','L3','L2','L3','L2','L3'],
                    ['Quality Engineer','L2','L2','L2','L2','L1','L2'],
                    ['Mfg Engineer','L2','L2','L1','L2','L1','L1'],
                    ['Operator','L1','L1','L1','L1','—','—'],
                  ].map((row, ri) => (
                    <tr key={ri} style={{background: ri%2===0 ? 'rgba(255,255,255,0.03)' : 'transparent'}}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="p-2 border border-[#dbeafe] font-bold"
                          style={{color: cell==='L3'?'#a78bfa': cell==='L2'?'#60a5fa': cell==='L1'?'#4ade80':'#4b5563'}}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-4 mt-2 text-xs text-[#1e3a5f]">
                <span>🟣 L3 = Lead/Audit</span><span>🔵 L2 = Practitioner</span><span>🟢 L1 = Awareness</span>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
      </>
  );
}