'use client';
import { useState, useRef } from 'react';

interface OldRow {
  id: string;
  itemFunction: string;
  failureMode: string;
  failureEffect: string;
  severity: number;
  classification: string;
  failureCause: string;
  occurrence: number;
  preventionControls: string;
  detectionControls: string;
  detection: number;
  rpn: number;
  recommendedAction: string;
  responsibility: string;
  targetDate: string;
  actionTaken: string;
  severityAfter: number;
  occurrenceAfter: number;
  detectionAfter: number;
}

interface NewRow {
  id: string;
  processStep: string;
  workElement: string;
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
  return o >= 6 && d >= 7 ? 'M' : 'L';
}

function apBadge(ap: string) {
  if (ap === 'H') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">H</span>;
  if (ap === 'M') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-black">M</span>;
  if (ap === 'L') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-600 text-white">L</span>;
  return <span className="text-gray-500 text-xs">—</span>;
}

function rpnBadge(rpn: number) {
  if (rpn >= 200) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">{rpn}</span>;
  if (rpn >= 100) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-black">{rpn}</span>;
  if (rpn > 0) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-600 text-white">{rpn}</span>;
  return <span className="text-gray-500 text-xs">—</span>;
}

function convertRow(old: OldRow): NewRow {
  const rpn = old.severity * old.occurrence * old.detection;
  return {
    id: old.id,
    processStep: old.itemFunction,
    workElement: '',
    functionProcessStep: old.itemFunction,
    functionWorkElement: '',
    failureEffects: old.failureEffect,
    severity: old.severity,
    failureMode: old.failureMode,
    failureCause: old.failureCause,
    preventionControls: old.preventionControls,
    occurrence: old.occurrence,
    detectionControls: old.detectionControls,
    detection: old.detection,
    ap: calcAP(old.severity, old.occurrence, old.detection),
    specialCharacteristics: old.classification,
    filterCode: '',
    preventionAction: old.recommendedAction,
    detectionAction: '',
    responsible: old.responsibility,
    targetDate: old.targetDate,
    status: old.actionTaken ? 'Completed' : 'Open',
    actionTaken: old.actionTaken,
    completionDate: '',
    severityAfter: old.severityAfter,
    occurrenceAfter: old.occurrenceAfter,
    detectionAfter: old.detectionAfter,
    apAfter: calcAP(old.severityAfter, old.occurrenceAfter, old.detectionAfter),
    remarks: `Old RPN: ${rpn > 0 ? rpn : (old.severity||0)*(old.occurrence||0)*(old.detection||0)}`,
  };
}

const newOldRow = (): OldRow => ({
  id: Math.random().toString(36).slice(2),
  itemFunction: '', failureMode: '', failureEffect: '', severity: 0,
  classification: '', failureCause: '', occurrence: 0,
  preventionControls: '', detectionControls: '', detection: 0, rpn: 0,
  recommendedAction: '', responsibility: '', targetDate: '',
  actionTaken: '', severityAfter: 0, occurrenceAfter: 0, detectionAfter: 0,
});

const FIELD_ALIASES: Record<string, string[]> = {
  itemFunction:        ['item/function','item function','process step','process item','item','function','station','operation','process name','part name','part/process'],
  failureMode:         ['failure mode','mode of failure','potential failure mode','fm'],
  failureEffect:       ['failure effect','effect','effect of failure','potential effect','failure effects','effects of failure'],
  severity:            ['severity','sev','s'],
  classification:      ['class','classification','cc/sc','special char','characteristic','cc','sc'],
  failureCause:        ['failure cause','cause','cause of failure','potential cause','root cause','fc'],
  occurrence:          ['occurrence','occ','o','freq','frequency'],
  preventionControls:  ['prevention controls','current prevention','prevention','prev control','pc','current process controls - prevention'],
  detectionControls:   ['detection controls','current detection','detection control','dc','current process controls - detection'],
  detection:           ['detection','det','d'],
  recommendedAction:   ['recommended action','recommended actions','action recommended','action','rec action'],
  responsibility:      ['responsibility','responsible','owner','resp'],
  targetDate:          ['target date','target','completion date','due date','target completion'],
  actionTaken:         ['action taken','actions taken','completed action','evidence'],
  severityAfter:       ["s'","severity after","sev after","s after","revised s","new s"],
  occurrenceAfter:     ["o'","occurrence after","occ after","o after","revised o","new o"],
  detectionAfter:      ["d'","detection after","det after","d after","revised d","new d"],
};

function autoDetect(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const idx = lower.indexOf(alias);
      if (idx !== -1) { map[field] = headers[idx]; break; }
    }
    if (!map[field]) {
      for (const alias of aliases) {
        const idx = lower.findIndex(h => h.includes(alias) || alias.includes(h));
        if (idx !== -1) { map[field] = headers[idx]; break; }
      }
    }
  }
  return map;
}

export default function PFMEAConverterPage() {
  const [tab, setTab] = useState<'manual'|'upload'>('manual');
  const [oldRows, setOldRows] = useState<OldRow[]>([newOldRow()]);
  const [converted, setConverted] = useState(false);
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [colMap, setColMap] = useState<Record<string, string>>({});
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const setOld = (id: string, k: keyof OldRow, v: any) => {
    setOldRows(rs => rs.map(r => r.id === id ? { ...r, [k]: v, rpn: k==='severity'?v*(r.occurrence||0)*(r.detection||0):k==='occurrence'?(r.severity||0)*v*(r.detection||0):k==='detection'?(r.severity||0)*(r.occurrence||0)*v:r.rpn } : r));
  };

  const addRow = () => setOldRows(rs => [...rs, newOldRow()]);
  const delRow = (id: string) => setOldRows(rs => rs.filter(r => r.id !== id));
  const handleConvert = () => { setNewRows(oldRows.map(convertRow)); setConverted(true); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('Reading file...');
    setUploadFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (data.length < 2) { setUploadStatus('File appears empty'); return; }
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(10, data.length); i++) {
        if (data[i].filter((c: any) => c !== '').length >= 5) { headerRowIdx = i; break; }
      }
      const hdrs = data[headerRowIdx].map((h: any) => String(h).trim()).filter((h: string) => h !== '');
      setHeaders(hdrs);
      setPreviewData(data.slice(headerRowIdx + 1, headerRowIdx + 6));
      setColMap(autoDetect(hdrs));
      setUploadStatus(`Loaded ${file.name} — ${data.length - headerRowIdx - 1} rows found. Verify mapping below.`);
    } catch {
      setUploadStatus('Error reading file. Ensure it is a valid .xlsx or .xls file.');
    }
  };

  const importFromUpload = () => {
    if (!previewData.length || !headers.length) return;
    (async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) return;
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      let hIdx = 0;
      for (let i = 0; i < Math.min(10, data.length); i++) {
        if (data[i].filter((c: any) => c !== '').length >= 5) { hIdx = i; break; }
      }
      const getV = (row: any[], field: string) => { const col = colMap[field]; if (!col) return ''; const i = headers.indexOf(col); return i >= 0 ? String(row[i]??'').trim() : ''; };
      const getN = (row: any[], field: string) => { const v = getV(row,field); const n = parseInt(v); return isNaN(n)?0:Math.min(10,Math.max(0,n)); };
      const rows: OldRow[] = data.slice(hIdx+1).filter((r: any[]) => r.some((c:any)=>c!=='')).map((row: any[]) => {
        const s=getN(row,'severity'),o=getN(row,'occurrence'),d=getN(row,'detection');
        return { id: Math.random().toString(36).slice(2), itemFunction:getV(row,'itemFunction'), failureMode:getV(row,'failureMode'), failureEffect:getV(row,'failureEffect'), severity:s, classification:getV(row,'classification'), failureCause:getV(row,'failureCause'), occurrence:o, preventionControls:getV(row,'preventionControls'), detectionControls:getV(row,'detectionControls'), detection:d, rpn:s*o*d, recommendedAction:getV(row,'recommendedAction'), responsibility:getV(row,'responsibility'), targetDate:getV(row,'targetDate'), actionTaken:getV(row,'actionTaken'), severityAfter:getN(row,'severityAfter'), occurrenceAfter:getN(row,'occurrenceAfter'), detectionAfter:getN(row,'detectionAfter') };
      });
      setOldRows(rows); setTab('manual'); setConverted(false);
    })();
  };

  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const border: any = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
    const ws1 = wb.addWorksheet('Old AIAG FMEA');
    ws1.addRow(['PROCESS FAILURE MODE AND EFFECTS ANALYSIS — OLD AIAG FORMAT (Pre-2019)']);
    ws1.addRow([]);
    ws1.addRow(['Item/Function','Failure Mode','Failure Effect','S','Class','Failure Cause','O','Prevention Controls','Detection Controls','D','RPN','Recommended Action','Responsibility','Target Date','Action Taken',"S'","O'","D'","RPN'"]);
    oldRows.forEach(r => ws1.addRow([r.itemFunction,r.failureMode,r.failureEffect,r.severity||'',r.classification,r.failureCause,r.occurrence||'',r.preventionControls,r.detectionControls,r.detection||'',r.rpn||'',r.recommendedAction,r.responsibility,r.targetDate,r.actionTaken,r.severityAfter||'',r.occurrenceAfter||'',r.detectionAfter||'',(r.severityAfter*r.occurrenceAfter*r.detectionAfter)||'']));
    ws1.eachRow(row => row.eachCell({ includeEmpty: false }, (cell: any) => { cell.border = border; }));
    if (converted && newRows.length) {
      const ws2 = wb.addWorksheet('New AIAG VDA PFMEA 2019');
      ws2.addRow(['PROCESS FAILURE MODE AND EFFECTS ANALYSIS — AIAG VDA 2019 FORMAT']);
      ws2.addRow([]);
      ws2.addRow(['Process Step','Work Element (4M)','Function of Process Step','Function of Work Element','Failure Effects (FE)','S','Failure Mode (FM)','Failure Cause (FC)','Prevention Controls (PC)','O','Detection Controls (DC)','D','AP','Special Char.','Filter Code','Prevention Action','Detection Action','Responsible','Target Date','Status','Action Taken + Evidence','Completion Date',"S'","O'","D'","AP'",'Remarks']);
      newRows.forEach(r => ws2.addRow([r.processStep,r.workElement,r.functionProcessStep,r.functionWorkElement,r.failureEffects,r.severity||'',r.failureMode,r.failureCause,r.preventionControls,r.occurrence||'',r.detectionControls,r.detection||'',r.ap,r.specialCharacteristics,r.filterCode,r.preventionAction,r.detectionAction,r.responsible,r.targetDate,r.status,r.actionTaken,r.completionDate,r.severityAfter||'',r.occurrenceAfter||'',r.detectionAfter||'',r.apAfter,r.remarks]));
      ws2.eachRow(row => row.eachCell({ includeEmpty: false }, (cell: any) => { cell.border = border; }));
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'FMEA_Converted_AIAG_VDA_2019.xlsx'; a.click();
    URL.revokeObjectURL(url);
  };

  const inp = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-full';
  const ta = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-full min-h-[40px] resize-y';
  const num = 'bg-gray-800 border border-gray-600 text-white text-xs px-1 py-0.5 rounded w-10 text-center';
  const th = 'px-1.5 py-1.5 border border-gray-500 text-xs font-bold text-center whitespace-pre-line leading-tight';
  const td = 'px-1 py-0.5 border border-gray-700 align-top';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-400">🔄 Old AIAG FMEA → New AIAG VDA 2019 Converter</h1>
        <p className="text-gray-400 text-sm mt-1">Convert your old RPN-based FMEA to new Action Priority (AP) format per AIAG VDA Handbook 1st Edition 2019</p>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-700">
        <button onClick={() => setTab('manual')} className={`px-4 py-2 te
