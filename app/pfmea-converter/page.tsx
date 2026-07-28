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
  return <span className="text-gray-500 text-xs">â€”</span>;
}

function rpnBadge(rpn: number) {
  if (rpn >= 200) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">{rpn}</span>;
  if (rpn >= 100) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-black">{rpn}</span>;
  if (rpn > 0) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-600 text-white">{rpn}</span>;
  return <span className="text-gray-500 text-xs">â€”</span>;
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
      setUploadStatus(`Loaded ${file.name} â€” ${data.length - headerRowIdx - 1} rows found. Verify mapping below.`);
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
    ws1.addRow(['PROCESS FAILURE MODE AND EFFECTS ANALYSIS â€” OLD AIAG FORMAT (Pre-2019)']);
    ws1.addRow([]);
    ws1.addRow(['Item/Function','Failure Mode','Failure Effect','S','Class','Failure Cause','O','Prevention Controls','Detection Controls','D','RPN','Recommended Action','Responsibility','Target Date','Action Taken',"S'","O'","D'","RPN'"]);
    oldRows.forEach(r => ws1.addRow([r.itemFunction,r.failureMode,r.failureEffect,r.severity||'',r.classification,r.failureCause,r.occurrence||'',r.preventionControls,r.detectionControls,r.detection||'',r.rpn||'',r.recommendedAction,r.responsibility,r.targetDate,r.actionTaken,r.severityAfter||'',r.occurrenceAfter||'',r.detectionAfter||'',(r.severityAfter*r.occurrenceAfter*r.detectionAfter)||'']));
    ws1.eachRow(row => row.eachCell({ includeEmpty: false }, (cell: any) => { cell.border = border; }));
    if (converted && newRows.length) {
      const ws2 = wb.addWorksheet('New AIAG VDA PFMEA 2019');
      ws2.addRow(['PROCESS FAILURE MODE AND EFFECTS ANALYSIS â€” AIAG VDA 2019 FORMAT']);
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
        <h1 className="text-2xl font-bold text-orange-400">ðŸ”„ Old AIAG FMEA â†’ New AIAG VDA 2019 Converter</h1>
        <p className="text-gray-400 text-sm mt-1">Convert your old RPN-based FMEA to new Action Priority (AP) format per AIAG VDA Handbook 1st Edition 2019</p>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-700">
        <button onClick={() => setTab('manual')} className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${tab==='manual'?'border-orange-400 text-orange-300 bg-gray-800':'border-transparent text-gray-400 hover:text-gray-200'}`}>
          âœï¸ Manual Entry
        </button>
        <button onClick={() => setTab('upload')} className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${tab==='upload'?'border-orange-400 text-orange-300 bg-gray-800':'border-transparent text-gray-400 hover:text-gray-200'}`}>
          ðŸ“¤ Upload Old FMEA Excel
        </button>
      </div>

      {tab === 'upload' && (
        <div className="space-y-4">
          <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">ðŸ“Š</div>
            <p className="text-white font-medium mb-1">Upload Old AIAG FMEA Excel File</p>
            <p className="text-gray-400 text-xs mb-4">Supports .xlsx and .xls â€” Old format (Pre-2019) with RPN columns</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" id="fmea-upload"/>
            <label htmlFor="fmea-upload" className="cursor-pointer bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold inline-block">Browse File</label>
            {uploadFileName && <p className="text-gray-300 text-xs mt-3">ðŸ“Ž {uploadFileName}</p>}
          </div>

          {uploadStatus && (
            <div className={`text-xs p-3 rounded border ${uploadStatus.startsWith('Loaded')?'bg-green-900/20 border-green-700 text-green-300':'bg-red-900/20 border-red-700 text-red-300'}`}>
              {uploadStatus}
            </div>
          )}

          {headers.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-bold text-orange-300 mb-1 uppercase tracking-wide">Column Mapping</h3>
              <p className="text-gray-400 text-xs mb-4">Auto-detected from your Excel headers. Correct any wrong mappings before importing.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {field:'itemFunction',label:'Item / Function (Process Step)'},
                  {field:'failureMode',label:'Failure Mode'},
                  {field:'failureEffect',label:'Failure Effect'},
                  {field:'severity',label:'S (Severity)'},
                  {field:'classification',label:'Class (CC/SC)'},
                  {field:'failureCause',label:'Failure Cause'},
                  {field:'occurrence',label:'O (Occurrence)'},
                  {field:'preventionControls',label:'Prevention Controls'},
                  {field:'detectionControls',label:'Detection Controls'},
                  {field:'detection',label:'D (Detection)'},
                  {field:'recommendedAction',label:'Recommended Action'},
                  {field:'responsibility',label:'Responsibility'},
                  {field:'targetDate',label:'Target Date'},
                  {field:'actionTaken',label:'Action Taken'},
                  {field:'severityAfter',label:"S' (After Action)"},
                  {field:'occurrenceAfter',label:"O' (After Action)"},
                  {field:'detectionAfter',label:"D' (After Action)"},
                ].map(({field,label}) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-xs text-gray-300 font-medium">{label}</label>
                    <select value={colMap[field]||''} onChange={e=>setColMap(m=>({...m,[field]:e.target.value}))} className="bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded">
                      <option value="">â€” Not mapped â€”</option>
                      {headers.map(h=><option key={h} value={h}>{h}</option>)}
                    </select>
                    {colMap[field] && <span className="text-green-400 text-xs">âœ“ {colMap[field]}</span>}
                  </div>
                ))}
              </div>

              {previewData.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Preview (first 5 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse min-w-max">
                      <thead><tr>{headers.map(h=><th key={h} className="px-2 py-1 bg-gray-700 border border-gray-600 text-gray-200 whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody>{previewData.map((row,i)=><tr key={i}>{headers.map((_,j)=><td key={j} className="px-2 py-0.5 border border-gray-700 text-gray-300 whitespace-nowrap max-w-xs truncate">{String(row[j]??'')}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-3 items-center">
                <button onClick={importFromUpload} className="bg-orange-600 hover:bg-orange-500 text-white text-sm px-6 py-2.5 rounded-lg font-bold">
                  ðŸ“¥ Import & Go to Manual Entry
                </button>
                <span className="text-gray-400 text-xs">After import, review in Manual Entry tab then click Convert</span>
              </div>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-700 rounded p-3 text-xs text-blue-200">
            <p className="font-bold mb-1">Expected Excel Format (Old AIAG FMEA):</p>
            <p>Columns like: <strong>Item/Function, Failure Mode, Failure Effect, S, O, D, RPN, Recommended Action, Responsibility, Target Date, Action Taken, S', O', D'</strong></p>
            <p className="mt-1 text-blue-300">Column names are auto-detected â€” works even if your headers are slightly different.</p>
          </div>
        </div>
      )}

      {tab === 'manual' && (
        <div className="mb-4">
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
            <h2 className="text-sm font-bold text-orange-300 mb-2 uppercase tracking-wide">What changes in the conversion?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-red-900/30 border border-red-700 rounded p-3">
                <p className="font-bold text-red-300 mb-1">Removed (Old Format)</p>
                <p className="text-gray-300">RPN = S x O x D (Risk Priority Number)</p>
                <p className="text-gray-300">Single threshold e.g. RPN &gt; 100</p>
                <p className="text-gray-300">No structure/function analysis</p>
              </div>
              <div className="bg-green-900/30 border border-green-700 rounded p-3">
                <p className="font-bold text-green-300 mb-1">Added (New AIAG VDA 2019)</p>
                <p className="text-gray-300">AP = H/M/L (Action Priority table)</p>
                <p className="text-gray-300">Structure + Function Analysis columns</p>
                <p className="text-gray-300">7-Step approach</p>
                <p className="text-gray-300">Work Element (4M Type)</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
                <p className="font-bold text-blue-300 mb-1">Auto-Mapped Fields</p>
                <p className="text-gray-300">Item/Function to Process Step</p>
                <p className="text-gray-300">Class (CC/SC) to Special Characteristics</p>
                <p className="text-gray-300">Recommended Action to Prevention Action</p>
                <p className="text-gray-300">S, O, D to AP (auto-calculated)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-red-300 uppercase tracking-wide">Step 1: Enter Old AIAG FMEA Data (Pre-2019 Format)</h2>
            <button onClick={addRow} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded">+ Add Row</button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-700 mb-3">
            <table className="text-xs min-w-max border-collapse">
              <thead>
                <tr>
                  <th className={`${th} bg-red-900 text-red-200 w-32`}>Item / Function</th>
                  <th className={`${th} bg-red-900 text-red-200 w-36`}>Failure Mode</th>
                  <th className={`${th} bg-red-900 text-red-200 w-36`}>Failure Effect{'\n'}Customer</th>
                  <th className={`${th} bg-red-900 text-red-200 w-8`}>S</th>
                  <th className={`${th} bg-red-900 text-red-200 w-12`}>Class{'\n'}(CC/SC)</th>
                  <th className={`${th} bg-red-900 text-red-200 w-36`}>Failure Cause</th>
                  <th className={`${th} bg-red-900 text-red-200 w-8`}>O</th>
                  <th className={`${th} bg-red-900 text-red-200 w-32`}>Prevention{'\n'}Controls</th>
                  <th className={`${th} bg-red-900 text-red-200 w-32`}>Detection{'\n'}Controls</th>
                  <th className={`${th} bg-red-900 text-red-200 w-8`}>D</th>
                  <th className={`${th} bg-red-900 text-red-200 w-14`}>RPN</th>
                  <th className={`${th} bg-orange-900 text-orange-200 w-32`}>Recommended{'\n'}Action</th>
                  <th className={`${th} bg-orange-900 text-orange-200 w-24`}>Responsibility</th>
                  <th className={`${th} bg-orange-900 text-orange-200 w-24`}>Target Date</th>
                  <th className={`${th} bg-orange-900 text-orange-200 w-32`}>Action Taken</th>
                  <th className={`${th} bg-orange-900 text-orange-200 w-8`}>S'</th>
                  <th className={`${th} bg-orange-900 text-orange-200 w-8`}>O'</th>
                  <th className={`${th} bg-orange-900 text-orange-200 w-8`}>D'</th>
                  <th className={`${th} bg-gray-700 w-8`}>Del</th>
                </tr>
              </thead>
              <tbody>
                {oldRows.map((r, i) => (
                  <tr key={r.id} className={i%2===0?'bg-gray-900':'bg-gray-850'}>
                    <td className={td}><textarea className={ta} value={r.itemFunction} onChange={e=>setOld(r.id,'itemFunction',e.target.value)} placeholder="e.g. Welding Station 10"/></td>
                    <td className={td}><textarea className={ta} value={r.failureMode} onChange={e=>setOld(r.id,'failureMode',e.target.value)} placeholder="e.g. Insufficient weld"/></td>
                    <td className={td}><textarea className={ta} value={r.failureEffect} onChange={e=>setOld(r.id,'failureEffect',e.target.value)} placeholder="e.g. Weld fails in service"/></td>
                    <td className={td}><input type="number" min={1} max={10} className={num} value={r.severity||''} onChange={e=>setOld(r.id,'severity',+e.target.value)}/></td>
                    <td className={td}><input className={inp} value={r.classification} onChange={e=>setOld(r.id,'classification',e.target.value)} placeholder="CC/SC"/></td>
                    <td className={td}><textarea className='ta' value={r.failureCause} onChange={e=>setOld(r.id,'failureCause',e.target.value)} placeholder="e.g. Robot current out of spec"/></td>
                    <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrence||''} onChange={e=>setOld(r.id,'occurrence',+e.target.value)}/></td>
                    <td className={td}><textarea className={ta} value={r.preventionControls} onChange={e=>setOld(r.id,'preventionControls',e.target.value)} placeholder="PM schedule"/></td>
                    <td className={td}><textarea className={ta} value={r.detectionControls} onChange={e=>setOld(r.id,'detectionControls',e.target.value)} placeholder="Visual inspection"/></td>
                    <td className={td}><input type="number" min={1} max={10} className={num} value={r.detection||''} onChange={e=>setOld(r.id,'detection',+e.target.value)}/></td>
                    <td className={`${td} text-center`}>{rpnBadge((r.severity||0)*(r.occurrence||0)*(r.detection||0))}</td>
                    <td className={td}><textarea className={ta} value={r.recommendedAction} onChange={e=>setOld(r.id,'recommendedAction',e.target.value)} placeholder="Increase PM frequency"/></td>
                    <td className={td}><input className={inp} value={r.responsibility} onChange={e=>setOld(r.id,'responsibility',e.target.value)} placeholder="J. Smith"/></td>
                    <td className={td}><input type="date" className={inp} value={r.targetDate} onChange={e=>setOld(r.id,'targetDate',e.target.value)}/></td>
                    <td className={td}><textarea className={ta} value={r.actionTaken} onChange={e=>setOld(r.id,'actionTaken',e.target.value)} placeholder="Action taken"/></td>
                    <td className={td}><input type="number" min={1} max={10} className={num} value={r.severityAfter||''} onChange={e=>setOld(r.id,'severityAfter',+e.target.value)}/></td>
                    <td className={td}><input type="number" min={1} max={10} className={num} value={r.occurrenceAfter||''} onChange={e=>setOld(r.id,'occurrenceAfter',+e.target.value)}/></td>
                    <td className={td}><input type="number" min={1} max={10} className={num} value={r.detectionAfter||""} onChange={e=>setOld(r.id,'detectionAfter',+e.target.value)}/></td>
                    <td className={td}><button onClick={()=>delRow(r.id)} className="text-red-400 hover:text-red-200 text-sm px-1">x</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleConvert} className="bg-orange-600 hover:bg-orange-500 text-white text-sm px-6 py-2.5 rounded-lg font-bold">
              Convert to AIAG VDA 2019
            </button>
            <span className="text-gray-400 text-xs">S, O, D values auto-calculate ACtion Priority (AP) per AIAG VDA table</span>
          </div>
        </div>
      )}

      {converted && newRows.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-green-300 uppercase tracking-wide">Step 2: Converted AIAG VDA 2019 PFMEA</h2>
            <button onClick={exportExcel} className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-1.5 rounded font-medium">Export Excel (Both Sheets)</button>
          </div>

          <div className="flex flex-wrap gap-3 mb-3 text-xs items-center">
            <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold">H High Must Act</span>
            <span className="bg-yellow-400 text-black px-2 py-0.5 rounded font-bold">M Medium Should Act</span>
            <span className="bg-green-600 text-white px-2 py-0.5 rounded font-bold">L Low Review</span>
            <span className="text-gray-400">AP auto-calculated per AIAG VDA 2019 S/O/D table</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="text-xs min-w-max border-collapse">
              <thead>
                <tr>
                  <th colSpan={2} className={`${th} bg-blue-900 text-blue-200`}>STRUCTURE ANALYSIS</th>
                  <th colSpan={2} className={`${th} bg-green-900 text-green-200`}>FUNCTION ANALYSIS</th>
                  <th colSpan={4} className={`${th} bg-orange-900 text-orange-200`}>FAILURE ANALYSIS</th>
                  <th colSpan={6} className={`${th} bg-red-900 text-red-200`}>RISK ANALYSIS</th>
                  <th colSpan={10} className={`${th} bg-purple-900 text-purple-200`}>OPTIMIZATION</th>
                </tr>
                <tr>
                  <th className={`${th} bg-blue-950 text-blue-200 w-32`}>Process Step</th>
                  <th className={`${th} bg-blue-950 text-blue-200 w-24`}>Work Element{'\n'}(4M Type)</th>
                  <th className={`${th} bg-green-950 text-green-200 w-32`}>Function of{'\n'}Process Step</th>
                  <th className={`${th} bg-green-950 text-green-200 w-32`}>Function of{'\n'}Work Element</th>
                  <th className={`${th} bg-orange-950 text-orange-200 w-36`}>Failure Effects (FE)</th>
                  <th className={`${th} bg-orange-950 text-orange-200 w-8`}>S</th>
                  <th className={`${th} bg-orange-950 text-orange-200 w-32`}>Failure Mode (FM)</th>
                  <th className={`${th} bg-orange-950 text-orange-200 w-32`}>Failure Cause (FC)</th>
                  <th className={`${th} bg-red-950 text-red-200 w-32`}>Prevention{'\n'}Controls (PC)</th>
                  <th className={`${th} bg-red-950 text-red-200 w-8`}>O</th>
                  <th className={`${th} bg-red-950 text-red-200 w-32`}>Detection{'\n'}Controls (DC)</th>
                  <th className={`${th} bg-red-950 text-red-200 w-8`}>D</th>
                  <th className={`${th} bg-red-950 text-red-200 w-10`}>AP</th>
                  <th className={`${th} bg-red-950 text-red-200 w-14`}>Special{'\n'}Char.</th>
                  <th className={`${th} bg-red-950 text-red-200 w-10`}>Filter{'\n'}Code</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Prevention{'\n'}Action</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Detection{'\n'}Action</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-20`}>Responsible</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-20`}>Target{'\n'}Date</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-20`}>Status</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Action Taken</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-8`}>S'</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-8`}>O'</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-8`}>D'</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-10`}>AP'</th>
                  <th className={`${th} bg-purple-950 text-purple-200 w-28`}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {newRows.map((r, i) => (
                  <tr key={r.id} className={i%2===0?'bg-gray-900':'bg-gray-850'}>
                    <td className={td}><span className="text-blue-200">{r.processStep}</span></td>
                    <td className={td}><input className={inp} defaultValue={r.workElement} placeholder="Man/Machine/Material/Method"/></td>
                    <td className={td}><span className="text-green-200 text-xs">{r.functionProcessStep}</span></td>
                    <td className={td}><input className={inp} defaultValue={r.functionWorkElement} placeholder="Specify function"/></td>
                    <td className={td}><span className="text-orange-200 text-xs">{r.failureEffects}</span></td>
                    <td className={`${td} text-center`}><span className="font-bold text-white">{r.severity||'â€”'}</span></td>
                    <td className={td}><span className="text-orange-200 text-xs">{r.failureMode}</span></td>
                    <td className={td}><span className="text-orange-200 text-xs">{r.failureCause}</span></td>
                    <td className={td}><span className="text-red-200 text-xs">{r.preventionControls}</span></td>
                    <td className={`${td} text-center`}><span className="font-bold text-white">{r.occurrence||'â€”'}</span></td>
                    <td className={td}><span className="text-red-200 text-xs">{r.detectionControls}</span></td>
                    <td className={`${td} text-center`}><span className="font-bold text-white">{r.detection||'â€”'}</span></td>
                    <td className={`${td} text-center`}>{apBadge(r.ap)}</td>
                    <td className={td}><span className="text-xs">{r.specialCharacteristics}</span></td>
                    <td className={td}><input className={inp} defaultValue={r.filterCode} placeholder="F1"/></td>
                    <td className={td}><span className="text-purple-200 text-xs">{r.preventionAction}</span></td>
                    <td className={td}><input className={inp} defaultValue={r.detectionAction} placeholder="Add detection action"/></td>
                    <td className={td}><span className="text-purple-200 text-xs">{r.responsible}</span></td>
                    <td className={td}><span className="text-purple-200 text-xs">{r.targetDate}</span></td>
                    <td className={td}><span className={`text-xs font-medium ${r.status==='Completed'?'text-green-400':'text-yellow-400'}`}>{r.status}</span></td>
                    <td className={td}><span className="text-purple-200 text-xs">{r.actionTaken}</span></td>
                    <td className={`${td} text-center`}><span className="text-white font-bold">{r.severityAfter||'â€”'}</span></td>
                    <td className={`${td} text-center`}><span className="text-white font-bold">{r.occurrenceAfter||'â€”'}</span></td>
                    <td className={`${td} text-center`}><span className="text-white font-bold">{r.detectionAfter||'â€”'}</span></td>
                    <td className={`${td} text-center`}>{apBadge(r.apAfter)}</td>
                    <td className={td}><span className="text-gray-400 text-xs">{r.remarks}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 bg-yellow-900/20 border border-yellow-700 rounded p-3 text-xs text-yellow-200">
            <p className="font-bold mb-1">Manual review required after conversion:</p>
            <p>1. Fill in Work Element (4M Type) column â€” Man / Machine / Material / Method</p>
            <p>2. Fill in Function of Work Element â€” describe specific work element function</p>
            <p>3. Verify AP rating â€” if AP differs from old RPN priority, review with core team</p>
            <p>4. Split Recommended Action into Prevention Action vs Detection Action as needed</p>
          </div>
        </div>
      )}
    </div>
  );
}



