'use client';

import { useState, useRef } from 'react';
import type ExcelJS from 'exceljs';

// ── Types ──────────────────────────────────────────────────────────────────────
interface CPHeader {
  controlPlanNumber: string;
  phase: 'Prototype' | 'Pre-Launch' | 'Production' | 'Safe Launch' | '';
  keyContact: string;
  phone: string;
  dateOrig: string;
  dateRev: string;
  partNumber: string;
  partName: string;
  supplierPlant: string;
  supplierCode: string;
  customerEngApproval: string;
  customerEngApprovalDate: string;
  supplierPlantApproval: string;
  supplierPlantApprovalDate: string;
  customerQualityApproval: string;
  customerQualityApprovalDate: string;
  otherApproval1: string;
  otherApproval1Date: string;
  otherApproval2: string;
  otherApproval2Date: string;
}

interface CPRow {
  id: string;
  partProcessNumber: string;
  processNameDescription: string;
  machineDeviceJigTools: string;
  charNumber: string;
  charProduct: string;
  charProcess: string;
  specialCharClass: string;
  specificationTolerance: string;
  measurementTechnique: string;
  sampleSize: string;
  sampleFrequency: string;
  controlMethod: string;
  reactionAction: string;
  ownerResponsible: string;
}

const emptyHeader = (): CPHeader => ({
  controlPlanNumber: '',
  phase: '',
  keyContact: '',
  phone: '',
  dateOrig: new Date().toISOString().split('T')[0],
  dateRev: '',
  partNumber: '',
  partName: '',
  supplierPlant: '',
  supplierCode: '',
  customerEngApproval: '',
  customerEngApprovalDate: '',
  supplierPlantApproval: '',
  supplierPlantApprovalDate: '',
  customerQualityApproval: '',
  customerQualityApprovalDate: '',
  otherApproval1: '',
  otherApproval1Date: '',
  otherApproval2: '',
  otherApproval2Date: '',
});

const emptyRow = (): CPRow => ({
  id: crypto.randomUUID(),
  partProcessNumber: '',
  processNameDescription: '',
  machineDeviceJigTools: '',
  charNumber: '',
  charProduct: '',
  charProcess: '',
  specialCharClass: '',
  specificationTolerance: '',
  measurementTechnique: '',
  sampleSize: '',
  sampleFrequency: '',
  controlMethod: '',
  reactionAction: '',
  ownerResponsible: '',
});

const FIELD_ALIASES: Record<keyof Omit<CPRow, 'id'>, string[]> = {
  partProcessNumber:      ['part no', 'part number', 'process no', 'process number', 'part/process'],
  processNameDescription: ['process name', 'operation', 'operation description', 'process description'],
  machineDeviceJigTools:  ['machine', 'device', 'jig', 'tool', 'equipment'],
  charNumber:             ['char no', 'characteristic no', 'char number', 'char #'],
  charProduct:            ['product char', 'product characteristic', 'product'],
  charProcess:            ['process char', 'process characteristic'],
  specialCharClass:       ['special char', 'classification', 'special class', 'char class'],
  specificationTolerance: ['spec', 'specification', 'tolerance', 'spec/tolerance'],
  measurementTechnique:   ['measurement', 'gauge', 'gage', 'measurement technique', 'evaluation'],
  sampleSize:             ['sample size', 'sample n', 'n='],
  sampleFrequency:        ['frequency', 'freq', 'sample freq'],
  controlMethod:          ['control method', 'control', 'method'],
  reactionAction:         ['reaction', 'action', 'reaction plan', 'corrective action'],
  ownerResponsible:       ['owner', 'responsible', 'owner/responsible'],
};

function autoDetect(headers: string[]): Partial<Record<keyof Omit<CPRow, 'id'>, number>> {
  const map: Partial<Record<keyof Omit<CPRow, 'id'>, number>> = {};
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof Omit<CPRow, 'id'>, string[]][]) {
    const idx = lower.findIndex(h => aliases.some(a => h.includes(a)));
    if (idx >= 0) map[field] = idx;
  }
  return map;
}

const inp   = 'w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400';
const lbl   = 'block text-xs font-semibold text-gray-600 mb-1';
const thChr = 'bg-blue-700 text-white text-xs font-bold px-2 py-1 border border-blue-900 text-center';
const thMth = 'bg-green-700 text-white text-xs font-bold px-2 py-1 border border-green-900 text-center';
const thRct = 'bg-red-700 text-white text-xs font-bold px-2 py-1 border border-red-900 text-center';
const tdC   = 'border border-gray-300 px-1 py-0.5';
const tdI   = 'w-full border-0 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1';

export default function ControlPlanPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [header, setHeader]       = useState<CPHeader>(emptyHeader());
  const [rows, setRows]           = useState<CPRow[]>([emptyRow()]);
  const [uploadRows, setUploadRows]       = useState<CPRow[]>([]);
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
  const [colMap, setColMap]               = useState<Partial<Record<keyof Omit<CPRow,'id'>, number>>>({});
  const [uploading, setUploading]   = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [fileName, setFileName]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const setH = (k: keyof CPHeader, v: string) =>
    setHeader(prev => ({ ...prev, [k]: v }));

  const setRowField = (id: string, k: keyof Omit<CPRow,'id'>, v: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r));

  const addRow       = () => setRows(prev => [...prev, emptyRow()]);
  const deleteRow    = (id: string) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  const duplicateRow = (id: string) => {
    const idx = rows.findIndex(r => r.id === id);
    if (idx < 0) return;
    const copy = { ...rows[idx], id: crypto.randomUUID() };
    setRows(prev => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    try {
      const xlsx   = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb     = xlsx.read(buffer, { type: 'array' });
      const ws     = wb.Sheets[wb.SheetNames[0]];
      const data: string[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (data.length < 2) { setUploading(false); return; }
      const headers  = data[0].map(String);
      const detected = autoDetect(headers);
      setUploadHeaders(headers);
      setColMap(detected);
      const parsed: CPRow[] = data.slice(1)
        .filter(r => r.some(c => String(c).trim()))
        .map(r => {
          const g = (k: keyof Omit<CPRow,'id'>) =>
            detected[k] !== undefined ? String(r[detected[k]!] ?? '').trim() : '';
          return {
            id: crypto.randomUUID(),
            partProcessNumber:      g('partProcessNumber'),
            processNameDescription: g('processNameDescription'),
            machineDeviceJigTools:  g('machineDeviceJigTools'),
            charNumber:             g('charNumber'),
            charProduct:            g('charProduct'),
            charProcess:            g('charProcess'),
            specialCharClass:       g('specialCharClass'),
            specificationTolerance: g('specificationTolerance'),
            measurementTechnique:   g('measurementTechnique'),
            sampleSize:             g('sampleSize'),
            sampleFrequency:        g('sampleFrequency'),
            controlMethod:          g('controlMethod'),
            reactionAction:         g('reactionAction'),
            ownerResponsible:       g('ownerResponsible'),
          };
        });
      setUploadRows(parsed);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const importFromUpload = () => {
    setRows(uploadRows.length ? uploadRows : [emptyRow()]);
    setActiveTab('manual');
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Control Plan');

      // Title
      ws.mergeCells('A1:Q1');
      const t = ws.getCell('A1');
      t.value = 'CONTROL PLAN';
      t.font  = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      t.alignment = { horizontal: 'center', vertical: 'middle' };
      t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      ws.getRow(1).height = 30;

      // Phase row
      ws.mergeCells('A2:Q2');
      const ph = ws.getCell('A2');
      ph.value = `Phase: ☐ Prototype  ☐ Pre-Launch  ☐ Production  ☐ Safe Launch    [Selected: ${header.phase || 'N/A'}]`;
      ph.font  = { size: 10, bold: true };
      ph.alignment = { horizontal: 'center' };
      ph.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };

      const hdrData = [
        ['Control Plan Number', header.controlPlanNumber, 'Key Contact / Phone', `${header.keyContact} / ${header.phone}`],
        ['Date (Orig.)', header.dateOrig, 'Date (Rev.)', header.dateRev],
        ['Part Number / Latest Change Level', header.partNumber, 'Customer Eng. Approval / Date', `${header.customerEngApproval} / ${header.customerEngApprovalDate}`],
        ['Part Name / Description', header.partName, 'Supplier/Plant Approval / Date', `${header.supplierPlantApproval} / ${header.supplierPlantApprovalDate}`],
        ['Supplier / Plant', header.supplierPlant, 'Customer Quality Approval / Date', `${header.customerQualityApproval} / ${header.customerQualityApprovalDate}`],
        ['Supplier Code', header.supplierCode, 'Other Approval / Date', `${header.otherApproval1} / ${header.otherApproval1Date}`],
      ];
      let rn = 3;
      for (const [l1, v1, l2, v2] of hdrData) {
        ws.mergeCells(`A${rn}:B${rn}`); ws.mergeCells(`C${rn}:D${rn}`);
        ws.mergeCells(`E${rn}:H${rn}`); ws.mergeCells(`I${rn}:Q${rn}`);
        const c1 = ws.getCell(`A${rn}`); c1.value = l1; c1.font = { bold: true, size: 9 };
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4FF' } };
        ws.getCell(`C${rn}`).value = v1; ws.getCell(`C${rn}`).font = { size: 9 };
        const c2 = ws.getCell(`E${rn}`); c2.value = l2; c2.font = { bold: true, size: 9 };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4FF' } };
        ws.getCell(`I${rn}`).value = v2; ws.getCell(`I${rn}`).font = { size: 9 };
        ws.getRow(rn).height = 16; rn++;
      }

      // Group header row
      rn++;
      ws.mergeCells(`A${rn}:G${rn}`);
      const gc = ws.getCell(`A${rn}`);
      gc.value = 'CHARACTERISTICS'; gc.alignment = { horizontal: 'center' };
      gc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
      gc.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };

      ws.mergeCells(`H${rn}:M${rn}`);
      const gm = ws.getCell(`H${rn}`);
      gm.value = 'METHODS'; gm.alignment = { horizontal: 'center' };
      gm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
      gm.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };

      ws.mergeCells(`N${rn}:Q${rn}`);
      const gr = ws.getCell(`N${rn}`);
      gr.value = 'REACTION PLAN'; gr.alignment = { horizontal: 'center' };
      gr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC62828' } };
      gr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      ws.getRow(rn).height = 18; rn++;

      const colHdrs = [
        { col: 'A', lbl: '(14)\nPart/Process No.',       clr: 'FF1565C0' },
        { col: 'B', lbl: '(15)\nProcess Name/\nOperation', clr: 'FF1565C0' },
        { col: 'C', lbl: '(16)\nMachine/Device/\nJig/Tools', clr: 'FF1565C0' },
        { col: 'D', lbl: '(17)\nChar. No.',               clr: 'FF1565C0' },
        { col: 'E', lbl: '(18)\nProduct\nCharacteristic', clr: 'FF1565C0' },
        { col: 'F', lbl: '(19)\nProcess\nCharacteristic', clr: 'FF1565C0' },
        { col: 'G', lbl: '(20)\nSpecial Char.\nClass.',   clr: 'FF1565C0' },
        { col: 'H', lbl: '(21)\nSpec./Tolerance',         clr: 'FF2E7D32' },
        { col: 'I', lbl: '(22)\nMeasurement\nTechnique',  clr: 'FF2E7D32' },
        { col: 'J', lbl: '(23)\nSample\nSize',            clr: 'FF2E7D32' },
        { col: 'K', lbl: '(23)\nSample\nFreq.',           clr: 'FF2E7D32' },
        { col: 'L', lbl: '(24)\nControl\nMethod',         clr: 'FF2E7D32' },
        { col: 'M', lbl: '',                               clr: 'FF2E7D32' },
        { col: 'N', lbl: '(25)\nReaction\nAction',        clr: 'FFC62828' },
        { col: 'O', lbl: '',                               clr: 'FFC62828' },
        { col: 'P', lbl: '(26)\nOwner/\nResponsible',     clr: 'FFC62828' },
        { col: 'Q', lbl: '',                               clr: 'FFC62828' },
      ];
      for (const { col, lbl: hl, clr } of colHdrs) {
        const cell = ws.getCell(`${col}${rn}`);
        cell.value = hl;
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: clr } };
        cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        };
      }
      ws.mergeCells(`L${rn}:M${rn}`);
      ws.mergeCells(`N${rn}:O${rn}`);
      ws.mergeCells(`P${rn}:Q${rn}`);
      ws.getRow(rn).height = 40; rn++;

      const dataRows = activeTab === 'upload' ? uploadRows : rows;
      for (const r of dataRows) {
        const dr = ws.getRow(rn);
        const vals = [
          r.partProcessNumber, r.processNameDescription, r.machineDeviceJigTools,
          r.charNumber, r.charProduct, r.charProcess, r.specialCharClass,
          r.specificationTolerance, r.measurementTechnique, r.sampleSize,
          r.sampleFrequency, r.controlMethod, '', r.reactionAction, '', r.ownerResponsible, '',
        ];
        vals.forEach((v, i) => {
          const cell = dr.getCell(i + 1);
          cell.value = v; cell.font = { size: 9 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          };
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
        ws.mergeCells(`L${rn}:M${rn}`);
        ws.mergeCells(`N${rn}:O${rn}`);
        ws.mergeCells(`P${rn}:Q${rn}`);
        dr.height = 20; rn++;
      }

      [10,22,18,8,18,18,10,18,18,8,8,18,2,18,2,18,2].forEach((w,i) => { ws.getColumn(i+1).width = w; });

      // Sheet 2: Field Guide
      const ws2 = wb.addWorksheet('Field Guide');
      ws2.columns = [{ width: 5 }, { width: 30 }, { width: 60 }];
      const gh = ws2.addRow(['#', 'Field Name', 'Description / Guidance (AIAG 2024)']);
      gh.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      gh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } } as ExcelJS.Fill;

      const guide = [
        ['1','Page _ of _','Document pagination'],
        ['2','Phase','Prototype / Pre-Launch / Production / Safe Launch'],
        ['3','Control Plan Number','Unique identifier for the control plan document'],
        ['4','Key Contact / Phone','Primary contact person and phone number'],
        ['5','Date (Orig.)','Original creation date'],
        ['6','Date (Rev.)','Most recent revision date'],
        ['7','Part Number / Change Level','Part number and latest engineering change level'],
        ['8','Customer Eng. Approval','Customer engineering sign-off (if required)'],
        ['9','Part Name / Description','Name or description of the part/assembly'],
        ['10','Supplier/Plant Approval','Supplier plant sign-off and date'],
        ['11','Customer Quality Approval','Customer quality sign-off (if required)'],
        ['12','Supplier / Plant','Name of supplying plant or facility'],
        ['13','Supplier Code','Supplier DUNS or customer-assigned code'],
        ['14','Part/Process Number','Cross-reference number linking to PFD, PFMEA, drawings'],
        ['15','Process Name / Operation','Name of the process step or operation'],
        ['16','Machine / Device / Jig / Tools','Equipment used for manufacturing this step'],
        ['17','Characteristics No.','Cross-reference number to drawings, FMEAs, or other documents'],
        ['18','Product Characteristic','Features/properties of the part described on drawings or engineering info'],
        ['19','Process Characteristic','Process variable with cause-and-effect on product characteristic'],
        ['20','Special Char. Classification','Customer-specific symbol (★ ◆ CC SC KPC KCC) for safety/regulatory characteristics'],
        ['21','Specification / Tolerance','Engineering specification or tolerance for the characteristic'],
        ['22','Evaluation / Measurement Technique','Gage, fixture, or test equipment used to measure the characteristic'],
        ['23','Sample Size','Number of parts to be measured per check (statistically based)'],
        ['23','Sample Frequency','How often the check is performed (volume-based preferred)'],
        ['24','Control Method','How the operation is controlled: SPC, inspection, error-proofing, sampling plans'],
        ['25','Reaction Action','Steps to contain suspect product and correct the process if out of control'],
        ['26','Owner / Responsible','Single responsible individual for executing the reaction plan'],
      ];

      for (const [num, name, desc] of guide) {
        const row = ws2.addRow([num, name, desc]);
        row.font = { size: 9 }; row.height = 16;
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { wrapText: true };
        const n = parseInt(num);
        if (n >= 14 && n <= 20) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } } as ExcelJS.Fill;
        else if (n >= 21 && n <= 24) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } } as ExcelJS.Fill;
        else if (n >= 25) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } } as ExcelJS.Fill;
      }

      const buf  = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `Control-Plan-${header.partNumber || 'QMOS'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed. Check console.');
    }
    setExporting(false);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Control Plan Generator</h1>
        <p className="text-sm text-gray-500 mt-1">AIAG 1st Edition — March 2024 | Fields 1-26 | APQP Phase-aligned</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['manual','upload'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab
                ? 'bg-white border-blue-600 text-blue-700 shadow'
                : 'bg-gray-200 border-transparent text-gray-500 hover:bg-gray-300'
            }`}>
            {tab === 'manual' ? '✏️ Manual Entry' : '📂 Upload Old Control Plan'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4">

        {/* HEADER */}
        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide">Header Information (Fields 1-13)</h2>

          {/* Phase */}
          <div className="mb-3">
            <span className={lbl}>Phase (Field 2)</span>
            <div className="flex gap-4 flex-wrap">
              {(['Prototype','Pre-Launch','Production','Safe Launch'] as const).map(p => (
                <label key={p} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" name="phase" value={p}
                    checked={header.phase === p}
                    onChange={() => setH('phase', p)}
                    className="accent-blue-600" />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className={lbl}>Control Plan Number (3)</label><input className={inp} value={header.controlPlanNumber} onChange={e => setH('controlPlanNumber', e.target.value)} placeholder="CP-001" /></div>
            <div><label className={lbl}>Key Contact (4)</label><input className={inp} value={header.keyContact} onChange={e => setH('keyContact', e.target.value)} placeholder="Name" /></div>
            <div><label className={lbl}>Phone (4)</label><input className={inp} value={header.phone} onChange={e => setH('phone', e.target.value)} placeholder="+91-..." /></div>
            <div><label className={lbl}>Date Orig. (5)</label><input type="date" className={inp} value={header.dateOrig} onChange={e => setH('dateOrig', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className={lbl}>Part Number / Change Level (7)</label><input className={inp} value={header.partNumber} onChange={e => setH('partNumber', e.target.value)} placeholder="PN-001 Rev A" /></div>
            <div><label className={lbl}>Part Name / Description (9)</label><input className={inp} value={header.partName} onChange={e => setH('partName', e.target.value)} placeholder="Bracket Assembly" /></div>
            <div><label className={lbl}>Supplier / Plant (12)</label><input className={inp} value={header.supplierPlant} onChange={e => setH('supplierPlant', e.target.value)} placeholder="Plant name" /></div>
            <div><label className={lbl}>Supplier Code (13)</label><input className={inp} value={header.supplierCode} onChange={e => setH('supplierCode', e.target.value)} placeholder="SUP-m001" /></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div><label className={lbl}>Date Rev. (6)</label><input type="date" className={inp} value={header.dateRev} onChange={e => setH('dateRev', e.target.value)} /></div>
            <div><label className={lbl}>Supplier/Plant Approval (10)</label><input className={inp} value={header.supplierPlantApproval} onChange={e => setH('supplierPlantApproval', e.target.value)} placeholder="Name" /></div>
            <div><label className={lbl}>Supplier/Plant Approval Date</label><input type="date" className={inp} value={header.supplierPlantApprovalDate} onChange={e => setH('supplierPlantApprovalDate', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div><label className={lbl}>Customer Eng. Approval (If Req'd.) (8)</label><input className={inp} value={header.customerEngApproval} onChange={e => setH('customerEngApproval', e.target.value)} placeholder="Name" /></div>
            <div><label className={lbl}>Customer Eng. Approval Date</label><input type="date" className={inp} value={header.customerEngApprovalDate} onChange={e => setH('customerEngApprovalDate', e.target.value)} /></div>
            <div><label className={lbl}>Customer Quality Approval (If Req'd.) (11)</label><input className={inp} value={header.customerQualityApproval} onChange={e => setH('customerQualityApproval', e.target.value)} placeholder="Name" /></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className={lbl}>Customer Quality Approval Date</label><input type="date" className={inp} value={header.customerQualityApprovalDate} onChange={e => setH('customerQualityApprovalDate', e.target.value)} /></div>
            <div><label className={lbl}>Other Approval 1</label><input className={inp} value={header.otherApproval1} onChange={e => setH('otherApproval1', e.target.value)} placeholder="Name / Dept" /></div>
            <div><label className={lbl}>Other Approval 1 Date</label><input type="date" className={inp} value={header.otherApproval1Date} onChange={e => setH('otherApproval1Date', e.target.value)} /></div>
            <div><label className={lbl}>Other Approval 2</label><input className={inp} value={header.otherApproval2} onChange={e => setH('otherApproval2', e.target.value)} placeholder="Name / Dept" /></div>
          </div>
        </div>

        {/* MANUAL TAB */}
        {activeTab === 'manual' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Body — Process Rows (Fields 14-26)</h2>
              <div className="flex gap-2">
                <button onClick={addRow} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700">+ Add Row</button>
                <button onClick={exportExcel} disabled={exporting} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
                  {exporting ? 'Exporting...' : '⬇ Export Excel'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="border-collapse text-xs w-full min-w-[1400px]">
                <thead>
                  <tr>
                    <th colSpan={7} className={thChr}>CHARACTERISTICS (Fields 14-20)</th>
                    <th colSpan={5} className={thMth}>METHODS (Fields 21-24)</th>
                    <th colSpan={2} className={thRct}>REACTION PLAN (Fields 25-26)</th>
                    <th className="bg-gray-600 text-white text-xs font-bold px-2 py-1 border border-gray-800 text-center">Actions</th>
                  </tr>
                  <tr className="bg-gray-100">
                    {[
                      '(14) Part/Process No.',
                      '(15) Process Name / Operation',
                      '(16) Machine / Device / Jig / Tools',
                      '(17) Char. No.',
                      '(18) Product Characteristic',
                      '(19) Process Characteristic',
                      '(20) Special Char. Class.',
                      '(21) Spec. / Tolerance',
                      '(22) Evaluation / Measurement',
                      '(23) Sample Size',
                      '(23) Sample Freq.',
                      '(24) Control Method',
                      '(25) Reaction Action',
                      '(26) Owner / Responsible',
                      '',
                    ].map((h, i) => (
                      <th key={i} className="border border-gray-300 px-2 py-1 text-gray-700 font-semibold text-xs text-center whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={tdC}><input className={tdI} value={r.partProcessNumber}      onChange={e => setRowField(r.id,'partProcessNumber',e.target.value)}      placeholder="P-01" /></td>
                      <td className={tdC}><input className={tdI} value={r.processNameDescription} onChange={e => setRowField(r.id,'processNameDescription',e.target.value)} placeholder="Welding" /></td>
                      <td className={tdC}><input className={tdI} value={r.machineDeviceJigTools}  onChange={e => setRowField(r.id,'machineDeviceJigTools',e.target.value)}  placeholder="Weld Gun #3" /></td>
                      <td className={tdC}><input className={tdI} value={r.charNumber}             onChange={e => setRowField(r.id,'charNumber',e.target.value)}             placeholder="C-01" /></td>
                      <td className={tdC}><input className={tdI} value={r.charProduct}            onChange={e => setRowField(r.id,'charProduct',e.target.value)}            placeholder="Weld strength" /></td>
                      <td className={tdC}><input className={tdI} value={r.charProcess}            onChange={e => setRowField(r.id,'charProcess',e.target.value)}            placeholder="Current (A)" /></td>
                      <td className={tdC}><input className={tdI} value={r.specialCharClass}       onChange={e => setRowField(r.id,'specialCharClass',e.target.value)}       placeholder="★ / ◆ / CC" /></td>
                      <td className={tdC}><input className={tdI} value={r.specificationTolerance} onChange={e => setRowField(r.id,'specificationTolerance',e.target.value)} placeholder="10 ± 0.5 kN" /></td>
                      <td className={tdC}><input className={tdI} value={r.measurementTechnique}   onChange={e => setRowField(r.id,'measurementTechnique',e.target.value)}   placeholder="Torque wrench" /></td>
                      <td className={tdC}><input className={tdI} value={r.sampleSize}             onChange={e => setRowField(r.id,'sampleSize',e.target.value)}             placeholder="5" /></td>
                      <td className={tdC}><input className={tdI} value={r.sampleFrequency}        onChange={e => setRowField(r.id,'sampleFrequency',e.target.value)}        placeholder="Every 2 hrs" /></td>
                      <td className={tdC}><input className={tdI} value={r.controlMethod}          onChange={e => setRowField(r.id,'controlMethod',e.target.value)}          placeholder="SPC / X̄R chart" /></td>
                      <td className={tdC}><input className={tdI} value={r.reactionAction}         onChange={e => setRowField(r.id,'reactionAction',e.target.value)}         placeholder="Stop line, tag parts, notify supervisor" /></td>
                      <td className={tdC}><input className={tdI} value={r.ownerResponsible}       onChange={e => setRowField(r.id,'ownerResponsible',e.target.value)}       placeholder="Operator / Shift Supvr." /></td>
                      <td className="border border-gray-300 px-1 py-0.5 text-center whitespace-nowrap">
                        <button onClick={() => duplicateRow(r.id)} title="Duplicate" className="text-blue-500 hover:text-blue-700 mr-1 text-sm">⧉</button>
                        <button onClick={() => deleteRow(r.id)}    title="Delete"    className="text-red-400 hover:text-red-600 text-sm">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={addRow} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700">+ Add Row</button>
              <button onClick={exportExcel} disabled={exporting} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
                {exporting ? 'Exporting...' : '⬇ Export Excel (AIAG Format)'}
              </button>
            </div>
          </>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Upload Old Control Plan (Excel)</h2>
            <div
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition mb-4"
              onClick={() => fileRef.current?.click()}>
              <div className="text-3xl mb-2">📂</div>
              <p className="text-sm text-gray-600">Click to select your old Control Plan Excel file</p>
              <p className="text-xs text-gray-400 mt-1">.xlsx, .xls supported</p>
              {fileName && <p className="text-xs text-blue-600 mt-2 font-semibold">Selected: {fileName}</p>}
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
            </div>

            {uploading && <div className="text-center text-sm text-blue-600 py-4">Reading file...</div>}

            {uploadHeaders.length > 0 && (
              <>
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>Auto-detected column mapping:</strong>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {(Object.keys(FIELD_ALIASES) as (keyof Omit<CPRow,'id'>)[]).map(field => (
                      <div key={field} className="flex items-center gap-1">
                        <span className={colMap[field] !== undefined ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                          {colMap[field] !== undefined ? '✓' : '○'}
                        </span>
                        <span>{field.replace(/([A-Z])/g,' $1').trim()}</span>
                        {colMap[field] !== undefined && (
                          <span className="text-gray-500">← col {colMap[field]! + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-2"><strong>{uploadRows.length} rows</strong> detected.</p>

                <div className="overflow-x-auto max-h-60 border rounded mb-3">
                  <table className="text-xs border-collapse w-full">
                    <thead className="bg-blue-700 text-white sticky top-0">
                      <tr>
                        {['Part/Process No','Process Name','Machine','Char No','Product','Process','Special Class','Spec/Tol','Measurement','Size','Freq','Control','Reaction','Owner'].map((h,i) => (
                          <th key={i} className="border border-blue-900 px-2 py-1 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadRows.slice(0,5).map((r,i) => (
                        <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                          {[r.partProcessNumber,r.processNameDescription,r.machineDeviceJigTools,r.charNumber,r.charProduct,r.charProcess,r.specialCharClass,r.specificationTolerance,r.measurementTechnique,r.sampleSize,r.sampleFrequency,r.controlMethod,r.reactionAction,r.ownerResponsible].map((v,j) => (
                            <td key={j} className="border border-gray-200 px-2 py-0.5 truncate max-w-[120px]">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadRows.length > 5 && <p className="text-xs text-gray-400 text-center py-1">... and {uploadRows.length-5} more rows</p>}
                </div>

                <div className="flex gap-2">
                  <button onClick={importFromUpload} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
                    ✅ Import to Manual Entry (edit &amp; export)
                  </button>
                  <button onClick={exportExcel} disabled={exporting} className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                    {exporting ? 'Exporting...' : '⬇ Export Directly to AIAG Format'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
        <strong>AIAG Control Plan 1st Edition (March 2024):</strong> Fields 1–13 = Header · Fields 14–20 = Characteristics · Fields 21–24 = Methods · Fields 25–26 = Reaction Plan.
        Special Char. Classifications use customer-specific symbols (★ CC SC KPC KCC ◆). Export generates two sheets: Control Plan + Field Guide.
      </div>
    </div>
  );
}
