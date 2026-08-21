'use client';


import { useState, useRef } from 'react';
import PageTitle from '../components/PageTitle';
import type ExcelJS from 'exceljs';

// -- Types ----------------------------------------------------------------------
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

const inp   = 'w-full border border-[#dbeafe] rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400';
const lbl   = 'block text-xs font-semibold text-[#1e3a5f] mb-1';
const thChr = 'bg-blue-700 text-white text-xs font-bold px-2 py-1 border border-blue-700/50 text-center';
const thMth = 'bg-green-700 text-white text-xs font-bold px-2 py-1 border border-green-900 text-center';
const thRct = 'bg-red-700 text-white text-xs font-bold px-2 py-1 border border-red-900 text-center';
const tdC   = 'border border-[#dbeafe] px-1 py-0.5';
const tdI   = 'w-full border-0 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1';


const CP_COLUMNS = [
  { no:1,  name:'Process Step No.',      desc:'Sequential number matching PFD step. Links CP to PFD and PFMEA.', tip:'Must match PFD step number exactly — auditors check this linkage' },
  { no:2,  name:'Process Name / Op.',    desc:'Name of the manufacturing operation (e.g. Welding, Heat Treatment, CNC Bore).', tip:'Same name as used in PFD and PFMEA' },
  { no:3,  name:'Machine / Device / Jig',desc:'Specific equipment ID or name (e.g. CMM-01, Furnace HT-02, Press P-04).', tip:'Reference calibration record for gauges listed here' },
  { no:4,  name:'Characteristic No.',    desc:'Sequential ID for each characteristic within the CP for easy reference.', tip:'Use in NCRs and 8Ds to reference the specific control' },
  { no:5,  name:'Product / Process Char.',desc:'Product = customer-measurable output (dimension, hardness). Process = parameter (temp, force, speed).', tip:'CC/SC must be clearly marked using customer-required symbol' },
  { no:6,  name:'Specification / Tolerance',desc:'Exact value from engineering drawing or process specification (e.g. 25.00 +0.00/-0.02 mm, 58-62 HRC).', tip:'Never write "per drawing" — always state the actual value' },
  { no:7,  name:'Evaluation / Gauge',    desc:'Name and ID of the measurement device or method (Air Gauge AG-01, CMM, Hardness Tester HT-02).', tip:'Gauge must be in the calibration system and within calibration date' },
  { no:8,  name:'Sample Size',           desc:'Specific number of pieces to measure (e.g. 5 pcs, 1 pc, 100%). Not "as required" or "per QA".', tip:'CC characteristics must be 100% or poka-yoke validated' },
  { no:9,  name:'Sample Frequency',      desc:'When to sample (e.g. Every 25th pc, 1st-off + every shift, 100% each piece, per batch).', tip:'Must be specific — "periodic" or "occasional" will be rejected by auditors' },
  { no:10, name:'Control Method',        desc:'How the characteristic is monitored and controlled (SPC X-bar R chart, 100% visual, attribute gauge, CMM report).', tip:'SPC is mandatory for CC characteristics and recommended for SC' },
  { no:11, name:'Reaction Plan',         desc:'Specific action if control goes out of range. Must state WHO does WHAT, WHEN. No vague words like "inspect" or "rework".', tip:'Operators must be trained on reaction plan — auditors will ask them to demonstrate' },
  { no:12, name:'Responsible',           desc:'Role or name responsible for performing the control (QA Engineer, Operator, QA Inspector).', tip:'Should be a role, not just a name — in case of personnel changes' },
  { no:13, name:'Record',               desc:'Form or system where control results are recorded (SPC chart, CMM report, Inspection log, ERP system).', tip:'Record must be retrievable for at least 3 years (or as per customer requirement)' },
];

const CP_SCORE_ITEMS = [
  'CP covers ALL process steps listed in the Process Flow Diagram (PFD)',
  'CP type identified: Prototype / Pre-Launch / Production',
  'Header complete — part, customer, revision, date, approvals',
  'All Special Characteristics (CC/SC) marked with correct symbol',
  'Specification column has actual values — not "per drawing"',
  'Gauge/evaluation method specified with gauge ID for each characteristic',
  'Sample size is a specific number — not "as required"',
  'Sample frequency is specific — not "periodic" or "occasionally"',
  'Control method specified (SPC, 100%, attribute, poka-yoke)',
  'Reaction plan is specific — WHO does WHAT WHEN (not "rework" or "inspect")',
  'CC characteristics have 100% inspection OR validated poka-yoke',
  'CP linked to PFMEA — same process steps and characteristics',
  'Work Instructions referenced for each control method',
  'CP signed off and revision history maintained',
];

export default function ControlPlanPage() {
  const [mainTab, setMainTab] = useState<'overview'|'guide'|'generator'|'analyser'|'qa'|'templates'|'docs'|'posters'|'dashboard'|'deepdive'|'workflow'|'casestudies'|'training'>('overview');
  const [showReactionGen, setShowReactionGen] = useState(false);
  const [cpChecks, setCpChecks] = useState<Record<number,boolean>>({});
  const [rgenInfo, setRgenInfo] = useState({ part:'', process:'', char:'', spec:'' });
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

  const loadSample = () => {
    setHeader(prev => ({
      ...prev,
      controlPlanNumber: 'CP-2024-001',
      phase: 'Production',
      keyContact: 'Rajesh Kumar',
      phone: '+91-98765-43210',
      partNumber: 'BKT-A001 Rev B',
      partName: 'Bracket Assembly',
      supplierPlant: 'ABC Auto Components – Pune Plant 1',
      supplierCode: 'SUP-0042',
    }));
    setRows([
      { id: crypto.randomUUID(), partProcessNumber:'P-010', processNameDescription:'Incoming Inspection', machineDeviceJigTools:'CMM / Visual', charNumber:'C-001', charProduct:'Dimensional accuracy', charProcess:'', specialCharClass:'CC', specificationTolerance:'±0.2 mm', measurementTechnique:'CMM', sampleSize:'3', sampleFrequency:'Every lot', controlMethod:'100% inspection + SPC chart', reactionAction:'Hold lot, tag as suspect, notify QE within 1 hr', ownerResponsible:'IQC Inspector' },
      { id: crypto.randomUUID(), partProcessNumber:'P-020', processNameDescription:'Stamping', machineDeviceJigTools:'250T Press #P-03', charNumber:'C-002', charProduct:'Hole diameter', charProcess:'Press force (tons)', specialCharClass:'SC', specificationTolerance:'Ø12.0 ±0.1 mm', measurementTechnique:'Plug gauge Go/NoGo', sampleSize:'5', sampleFrequency:'Every 2 hrs', controlMethod:'SPC X̄R chart', reactionAction:'Stop press, isolate last 2-hr production, call supervisor', ownerResponsible:'Operator / Shift Supvr.' },
      { id: crypto.randomUUID(), partProcessNumber:'P-030', processNameDescription:'MIG Welding', machineDeviceJigTools:'Fronius Weld Gun #W-07', charNumber:'C-003', charProduct:'Weld strength', charProcess:'Current (A) / Voltage (V)', specialCharClass:'CC', specificationTolerance:'10 kN min pull-off', measurementTechnique:'Pull test gauge', sampleSize:'2', sampleFrequency:'Start of shift + every 4 hrs', controlMethod:'Process parameter log + destructive test', reactionAction:'Stop line, cut 10 samples, notify QE, 8D within 24 hrs', ownerResponsible:'Welding Operator' },
      { id: crypto.randomUUID(), partProcessNumber:'P-040', processNameDescription:'Painting / Coating', machineDeviceJigTools:'Spray booth #SB-02', charNumber:'C-004', charProduct:'Coating thickness', charProcess:'Spray pressure (bar)', specialCharClass:'★', specificationTolerance:'80–120 µm', measurementTechnique:'Elcometer DFT gauge', sampleSize:'5 pts/part', sampleFrequency:'Every 30 min', controlMethod:'DFT monitoring + control chart', reactionAction:'Strip and recoat, re-inspect, update control chart', ownerResponsible:'Paint Shop Operator' },
      { id: crypto.randomUUID(), partProcessNumber:'P-050', processNameDescription:'Final Inspection & Pack', machineDeviceJigTools:'Inspection table + vision system', charNumber:'C-005', charProduct:'Visual appearance', charProcess:'', specialCharClass:'', specificationTolerance:'Zero visible defects per AQL 0.65', measurementTechnique:'Visual + light box', sampleSize:'Per AQL table', sampleFrequency:'Every lot', controlMethod:'AQL sampling plan', reactionAction:'Reject lot, 100% sort, CAPA within 48 hrs', ownerResponsible:'Final QC Inspector' },
    ]);
    setMainTab('generator');
    setActiveTab('manual');
  };

  return (
      <>
      <PageTitle title="Control Plan" />
      <div className="min-h-screen bg-white">

      {/* -- PREMIUM HEADER ------------------------------------------------ */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e2a5a 50%,#162044 100%)', padding: '22px 32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f160,transparent)' }} />
        <div style={{ position: 'relative', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '12px', padding: '10px', fontSize: '24px', lineHeight: 1 }}>📋</div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Control Plan Generator</h1>
                <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>AIAG 1st Edition (March 2024) · Fields 1–26 · APQP Phase-aligned · IATF 16949 Cl. 8.5.1.1</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ color: '#818cf8', fontSize: '18px', fontWeight: 700 }}>{rows.filter(r=>r.specialCharClass.includes('CC')||r.specialCharClass.includes('★')).length}</div>
                <div style={{ color: '#a5b4fc', fontSize: '11px' }}>Critical (CC/★)</div>
              </div>
              <div style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 700 }}>{rows.filter(r=>r.specialCharClass.includes('SC')||r.specialCharClass.includes('◆')).length}</div>
                <div style={{ color: '#fde68a', fontSize: '11px' }}>Significant (SC/◆)</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>{rows.length}</div>
                <div style={{ color: '#a5b4fc', fontSize: '11px' }}>Total Rows</div>
              </div>
              <button onClick={loadSample} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                🧪 Load Sample
              </button>
            </div>
          </div>
          {/* Tab Nav */}
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {([
              { id: 'overview',  label: '📖 Overview' },
              { id: 'guide',     label: '📋 CP Guide' },
              { id: 'generator', label: '⚡ Generator' },
              { id: 'analyser',  label: '🔍 Analyser' },
              { id: 'qa',        label: '💬 Interview Q&A' },
              { id: 'templates', label: '📁 Templates' },
              { id: 'docs',      label: '📚 Supporting Docs' },
              { id: 'posters',   label: '🖼 Posters & Banners' },
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'deepdive',  label: '🧩 Deep Dive' },
              { id: 'workflow',  label: '🔄 Workflow' },
              { id: 'casestudies', label: '📂 Case Studies' },
              { id: 'training',  label: '🎓 Training' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)} style={{
                padding: '8px 16px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
                background: mainTab === t.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: mainTab === t.id ? '#fff' : '#a5b4fc',
                borderBottom: mainTab === t.id ? '2px solid #6366f1' : '2px solid transparent',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -- GENERATOR TAB ---------------------------------------- */}
      {mainTab === 'generator' && (
      <div className="animate-fadeIn p-4 bg-[#eff6ff] min-h-screen">

      {/* Sub-tabs: Manual / Upload */}
      <div className="flex gap-2 mb-4">
        {(['manual','upload'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab
                ? 'bg-white border-blue-600 text-[#1d4ed8] shadow'
                : 'bg-[#dbeafe] border-transparent text-[#1e3a5f] hover:bg-[#dbeafe]'
            }`}>
            {tab === 'manual' ? '✏️ Manual Entry' : '📂 Upload Old Control Plan'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4">

        {/* HEADER */}
        <div className="mb-5 p-3 bg-[#eff6ff] border border-blue-700/50 rounded-lg">
          <h2 className="text-sm font-bold text-blue-200 mb-3 uppercase tracking-wide">Header Information (Fields 1-13)</h2>

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
              <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide">Body — Process Rows (Fields 14-26)</h2>
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
                    <th className="bg-gray-600 text-white text-xs font-bold px-2 py-1 border border-[#dbeafe] text-center">Actions</th>
                  </tr>
                  <tr className="bg-white">
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
                      <th key={i} className="border border-[#dbeafe] px-2 py-1 text-[#1e3a5f] font-semibold text-xs text-center whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#eff6ff]'}>
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
                      <td className="border border-[#dbeafe] px-1 py-0.5 text-center whitespace-nowrap">
                        <button onClick={() => duplicateRow(r.id)} title="Duplicate" className="text-blue-500 hover:text-[#1d4ed8] mr-1 text-sm">⧉</button>
                        <button onClick={() => deleteRow(r.id)}    title="Delete"    className="text-red-600 hover:text-red-600 text-sm">✕</button>
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
            <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Upload Old Control Plan (Excel)</h2>
            <div
              className="border-2 border-dashed border-blue-600/50 rounded-lg p-8 text-center cursor-pointer hover:bg-[#eff6ff] transition mb-4"
              onClick={() => fileRef.current?.click()}>
              <div className="text-3xl mb-2">📂</div>
              <p className="text-sm text-[#1e3a5f]">Click to select your old Control Plan Excel file</p>
              <p className="text-xs text-[#1e3a5f] mt-1">.xlsx, .xls supported</p>
              {fileName && <p className="text-xs text-blue-600 mt-2 font-semibold">Selected: {fileName}</p>}
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
            </div>

            {uploading && <div className="text-center text-sm text-blue-600 py-4">Reading file...</div>}

            {uploadHeaders.length > 0 && (
              <>
                <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs">
                  <strong>Auto-detected column mapping:</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 mt-2">
                    {(Object.keys(FIELD_ALIASES) as (keyof Omit<CPRow,'id'>)[]).map(field => (
                      <div key={field} className="flex items-center gap-1">
                        <span className={colMap[field] !== undefined ? 'text-green-600 font-semibold' : 'text-[#1e3a5f]'}>
                          {colMap[field] !== undefined ? '✓' : '○'}
                        </span>
                        <span>{field.replace(/([A-Z])/g,' $1').trim()}</span>
                        {colMap[field] !== undefined && (
                          <span className="text-[#1e3a5f]">← col {colMap[field]! + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[#1e3a5f] mb-2"><strong>{uploadRows.length} rows</strong> detected.</p>

                <div className="overflow-x-auto max-h-60 border rounded mb-3">
                  <table className="text-xs border-collapse w-full">
                    <thead className="bg-blue-700 text-white sticky top-0">
                      <tr>
                        {['Part/Process No','Process Name','Machine','Char No','Product','Process','Special Class','Spec/Tol','Measurement','Size','Freq','Control','Reaction','Owner'].map((h,i) => (
                          <th key={i} className="border border-blue-700/50 px-2 py-1 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadRows.slice(0,5).map((r,i) => (
                        <tr key={i} className={i%2===0?'bg-white':'bg-[#eff6ff]'}>
                          {[r.partProcessNumber,r.processNameDescription,r.machineDeviceJigTools,r.charNumber,r.charProduct,r.charProcess,r.specialCharClass,r.specificationTolerance,r.measurementTechnique,r.sampleSize,r.sampleFrequency,r.controlMethod,r.reactionAction,r.ownerResponsible].map((v,j) => (
                            <td key={j} className="border border-[#dbeafe] px-2 py-0.5 truncate max-w-[120px]">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadRows.length > 5 && <p className="text-xs text-[#1e3a5f] text-center py-1">... and {uploadRows.length-5} more rows</p>}
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

      <div className="mt-4 p-3 bg-[#eff6ff] border border-blue-700/50 rounded text-xs text-[#1d4ed8]">
        <strong>AIAG Control Plan 1st Edition (March 2024):</strong> Fields 1–13 = Header · Fields 14–20 = Characteristics · Fields 21–24 = Methods · Fields 25–26 = Reaction Plan.
        Special Char. Classifications use customer-specific symbols (★ CC SC KPC KCC ◆). Export generates two sheets: Control Plan + Field Guide.
      </div>
    </div>
    )}

      {/* -- OVERVIEW TAB ---------------------------------------- */}
      {mainTab === 'overview' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/AIAG_Control_Plan_First_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#065f46'}}>AIAG CP 1st Edition</a>
            <a href="/downloads/control-plan/CP_vs_PFMEA_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#0e7490'}}>CP vs PFMEA Linkage</a>
            <a href="/downloads/control-plan/CP_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>IATF Clause Mapping</a>
            <a href="/downloads/control-plan/CP_AIAG_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>AIAG Guide (All Cols)</a>
          </div>

          <div className="max-w-screen-xl mx-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 bg-white border border-blue-700/50/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">📋 What is a Control Plan?</h2>
                <p className="text-[#1e3a5f] text-sm leading-relaxed mb-3">
                  A <strong className="text-white">Control Plan (CP)</strong> is a structured document that describes the system for controlling parts and processes to ensure product quality. It captures what is to be controlled, how it is controlled, the sample size and frequency, and the reaction plan when out-of-control conditions are detected.
                </p>
                <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
                  The Control Plan is one of the AIAG Five Core Tools and is mandatory under <strong className="text-[#1d4ed8]">IATF 16949 Clause 8.5.1.1</strong>. It must link directly to the PFMEA and Process Flow Diagram — process step numbers must align across all three documents (the PFD–PFMEA–CP Trinity).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label:'Standard', value:'AIAG 1st Edition (2024)' },
                    { label:'IATF Clause', value:'8.5.1.1' },
                    { label:'26 Fields', value:'Header + Char + Method + Reaction' },
                    { label:'3 Types', value:'Prototype / Pre-Launch / Production' },
                    { label:'Links To', value:'PFD + PFMEA (trinity)' },
                    { label:'PPAP Element', value:'Element 7' },
                  ].map(i => (
                    <div key={i.label} className="bg-white rounded-xl px-3 py-2">
                      <div className="text-xs text-[#1e3a5f] uppercase">{i.label}</div>
                      <div className="text-xs font-semibold text-white mt-1">{i.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { icon:'📋', stat:'26', label:'Control Plan Fields', color:'text-blue-600 bg-[#eff6ff] border-blue-700/50' },
                  { icon:'3️⃣', stat:'3', label:'CP Types (Proto/Pre/Prod)', color:'text-purple-600 bg-purple-900/30 border-purple-700/50' },
                  { icon:'⭐', stat:'CC/SC', label:'Special Characteristics', color:'text-amber-600 bg-amber-50 border-amber-800/40' },
                  { icon:'🔗', stat:'Trinity', label:'PFD–PFMEA–CP Linkage', color:'text-green-600 bg-green-900/30 border-green-700/50' },
                ].map(s => (
                  <div key={s.label} className={`border rounded-2xl p-3 flex items-center gap-3 ${s.color}`}>
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className="font-bold text-sm">{s.stat}</div>
                      <div className="text-xs opacity-80">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">💡 Why Control Plan Matters</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon:'🔍', title:'In-Process Control', desc:'Specifies what to control, how often, and with what gauge — prevents defective parts escaping' },
                  { icon:'⚡', title:'Reaction Plans', desc:'Defines immediate response to out-of-control conditions — stops production, sorts parts, notifies quality' },
                  { icon:'🔗', title:'Links to PFMEA', desc:'Every High AP item in PFMEA must appear in CP with matching process step number' },
                  { icon:'📋', title:'PPAP Element 7', desc:'Production Control Plan is mandatory for PPAP Level 2–5 submissions' },
                  { icon:'📊', title:'SPC Integration', desc:'CC/SC characteristics require SPC on Control Plan — chart type, UCL/LCL, reaction plan' },
                  { icon:'🔄', title:'Update Triggers', desc:'Must be updated on 4M changes, field failures, engineering changes, and after PFMEA updates' },
                ].map(b => (
                  <div key={b.title} className="bg-white rounded-xl p-3">
                    <div className="text-xl mb-1">{b.icon}</div>
                    <div className="text-white font-semibold text-xs mb-1">{b.title}</div>
                    <p className="text-[#1e3a5f] text-xs leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-3">📌 IATF 16949 Clause Map</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  ['8.5.1.1','Control Plan — mandatory for all production processes. Pre-launch and production types required per APQP phase'],
                  ['8.5.1.2','Work Instructions — must reference Control Plan output characteristics and control methods'],
                  ['8.3.4','Design & Development Changes — CP must be updated when design/process changes affect characteristics'],
                  ['9.1.1','Monitoring, measurement, analysis — CP defines what to measure, how, and with what frequency'],
                  ['8.6.1','Release of Products — CP provides the framework for in-process quality checks before release'],
                  ['10.2.3','Problem Solving — after field failures, CP must be updated to add/strengthen controls'],
                ].map(([c,t]) => (
                  <div key={c} className="flex gap-3 bg-white rounded-xl px-3 py-2">
                    <span className="text-blue-600 font-bold text-xs w-12 flex-shrink-0 pt-0.5">{c}</span>
                    <span className="text-[#1e3a5f] text-xs leading-relaxed">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- ANALYSER TAB ---------------------------------------- */}
      {mainTab === 'analyser' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#065f46'}}>CP Audit Checklist XLS</a>
            <a href="/downloads/control-plan/CP_Reaction_Plan_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>Reaction Plan Guide</a>
            <a href="/downloads/control-plan/CP_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>IATF Clause Map</a>
            <a href="/downloads/control-plan/CP_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#1e40af'}}>Case Studies PDF</a>
          </div>

          <div className="max-w-screen-xl mx-auto">
            <div className="bg-white border border-blue-700/50/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="text-base font-bold text-white">Control Plan Gap Analyser</div>
                  <div className="text-[#1e3a5f] text-xs mt-0.5">Analyses your Control Plan (from the Generator tab) for gaps, completeness, special characteristics coverage, and audit readiness</div>
                </div>
              </div>
              {rows.length === 0 || (rows.length === 1 && !rows[0].processNameDescription) ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="text-[#1e3a5f] font-semibold text-sm">No Control Plan data to analyse yet</div>
                  <div className="text-[#1e3a5f] text-xs mt-2">Go to the ⚡ Generator tab, enter your process steps and characteristics, then return here for analysis</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label:'Total Rows', val:rows.length, color:'text-white bg-white border-[#dbeafe]' },
                      { label:'Special Char (CC/SC)', val:rows.filter(r=>r.specialCharClass && r.specialCharClass !== '').length, color:'text-amber-700 bg-amber-50 border-amber-800/40' },
                      { label:'Missing Reaction Plan', val:rows.filter(r=>!r.reactionAction).length, color:'text-red-700 bg-red-50 border-red-800/40' },
                      { label:'Missing Measurement', val:rows.filter(r=>!r.measurementTechnique).length, color:'text-orange-600 bg-orange-900/30 border-orange-800/40' },
                    ].map(s => (
                      <div key={s.label} className={`border rounded-xl p-3 text-center ${s.color}`}>
                        <div className="text-2xl font-bold">{s.val}</div>
                        <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Completeness */}
                  {(() => {
                    const checks = [
                      { label:'Process names filled', pass: rows.every(r=>r.processNameDescription !== '') },
                      { label:'All characteristics numbered', pass: rows.every(r=>r.charNumber !== '') },
                      { label:'All specs/tolerances specified', pass: rows.every(r=>r.specificationTolerance !== '') },
                      { label:'All measurement techniques defined', pass: rows.every(r=>r.measurementTechnique !== '') },
                      { label:'All sample sizes specified', pass: rows.every(r=>r.sampleSize !== '') },
                      { label:'All sample frequencies defined', pass: rows.every(r=>r.sampleFrequency !== '') },
                      { label:'All control methods specified', pass: rows.every(r=>r.controlMethod !== '') },
                      { label:'All reaction plans defined', pass: rows.every(r=>r.reactionAction !== '') },
                      { label:'Owners assigned for all rows', pass: rows.every(r=>r.ownerResponsible !== '') },
                      { label:'CP phase selected (Proto/Pre/Prod)', pass: header.phase !== '' },
                      { label:'Part name filled in header', pass: header.partName !== '' },
                    ];
                    const score = Math.round(checks.filter(c=>c.pass).length / checks.length * 100);
                    const color = score >= 80 ? '#10b981' : score >= 50 ? '#f97316' : '#ef4444';
                    return (
                      <>
                        <div className="rounded-xl p-4 border text-center" style={{ background:color+'15', borderColor:color+'44' }}>
                          <div className="text-3xl font-bold" style={{ color }}>{score}%</div>
                          <div className="font-bold text-sm" style={{ color }}>{score >= 80 ? 'AUDIT READY' : score >= 50 ? 'NEEDS WORK' : 'CRITICAL GAPS'}</div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                            <div className="h-2 rounded-full" style={{ width:`${score}%`, background:color }} />
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4">
                          <div className="text-xs font-bold text-white mb-3">📋 Control Plan Completeness Check</div>
                          {checks.map(c => (
                            <div key={c.label} className="overflow-x-auto flex items-center gap-2 py-1.5 border-b border-[#dbeafe]">
                              <span className={`text-sm flex-shrink-0 ${c.pass ? 'text-green-600' : 'text-red-600'}`}>{c.pass ? '✓' : '✗'}</span>
                              <span className={`text-xs ${c.pass ? 'text-[#1e3a5f]' : 'text-red-700'}`}>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* -- CP Completeness Score ------------------------------------ */}
          <div className="mt-5 bg-white rounded-xl border border-green-700/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 cursor-pointer flex-wrap gap-y-2"
              style={{background:'#065f46'}}
              onClick={()=>setCpChecks(p=>Object.keys(p).length===CP_SCORE_ITEMS.length&&Object.values(p).every(Boolean)?{}:p)}>
              <div className="flex items-center gap-3" onClick={e=>{e.stopPropagation(); document.getElementById('cp-score-body')!.classList.toggle('hidden');}}>
                <span className="text-2xl">📋</span>
                <div>
                  <div className="text-sm font-bold text-white">Control Plan Completeness Score</div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.75)'}}>14-point IATF audit readiness check — verify your CP before PPAP submission</div>
                </div>
              </div>
            </div>
            <div id="cp-score-body" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {CP_SCORE_ITEMS.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer"
                    style={{border: cpChecks[i] ? '1px solid #4ade80' : '1px solid #e2e8f0', background: cpChecks[i] ? '#f0fdf4' : '#f8fafc'}}>
                    <input type="checkbox" checked={!!cpChecks[i]}
                      onChange={e => setCpChecks(p => ({...p, [i]: e.target.checked}))}
                      style={{marginTop:'2px', width:'14px', height:'14px', flexShrink:0, accentColor:'#065f46'}} />
                    <span className="text-xs leading-relaxed" style={{color: cpChecks[i] ? '#065f46' : '#374151', textDecoration: cpChecks[i] ? 'line-through' : 'none', fontWeight: cpChecks[i] ? 600 : 400}}>{item}</span>
                  </label>
                ))}
              </div>
              {(() => {
                const done = Object.values(cpChecks).filter(Boolean).length;
                const total = CP_SCORE_ITEMS.length;
                const pct = Math.round((done/total)*100);
                const ok = done === total;
                const col = ok ? '#065f46' : pct >= 70 ? '#d97706' : '#dc2626';
                return (
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1" style={{color: col}}>
                      <span>CP Readiness Score</span>
                      <span>{done}/{total} ({pct}%)</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden mb-3" style={{background:'#e2e8f0'}}>
                      <div className="h-3 rounded-full transition-all duration-500" style={{width:`${pct}%`, background: col}} />
                    </div>
                    {ok ? (
                      <div className="text-center p-4 rounded-xl" style={{background:'#f0fdf4', border:'2px solid #4ade80'}}>
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-sm font-bold" style={{color:'#065f46'}}>CONTROL PLAN AUDIT READY</div>
                        <div className="text-xs mt-1" style={{color:'#16a34a'}}>All 14 criteria met. Ready for IATF audit and PPAP submission.</div>
                      </div>
                    ) : (
                      <div className="text-xs p-3 rounded-xl" style={{background:'#fff5f5', border:'1px solid #fecaca', color:'#991b1b'}}>
                        ⚠️ {total - done} criteria not yet met. Do not submit for PPAP until all gaps are closed.
                        {pct < 50 && ' CRITICAL: Control Plan has major gaps — CC characteristics may not be adequately controlled.'}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* -- Reaction Plan Generator ----------------------------------- */}
          <div className="mt-4 rounded-xl overflow-hidden shadow-sm" style={{border:'2px solid #065f4644'}}>
            <div className="flex items-center justify-between p-4 cursor-pointer flex-wrap gap-y-2" style={{background:'#0f766e'}}
              onClick={()=>setShowReactionGen(s=>!s)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <div className="text-sm font-bold text-white">Reaction Plan Generator</div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.75)'}}>Build IATF-compliant reaction plans — specific WHO, WHAT, WHEN for any characteristic</div>
                </div>
              </div>
              <span className="text-white text-lg">{showReactionGen ? '▲' : '▼'}</span>
            </div>
            {showReactionGen && (
              <div className="p-5" style={{background:'#f8fafc'}}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    {label:'Part / Product Name', key:'part', ph:'e.g. BKT-001 Bracket Assembly'},
                    {label:'Process Step', key:'process', ph:'e.g. Welding / Heat Treatment'},
                    {label:'Characteristic', key:'char', ph:'e.g. Weld tensile strength (CC)'},
                    {label:'Specification', key:'spec', ph:'e.g. Min 450 MPa, 58-62 HRC'},
                  ].map(f=>(
                    <div key={f.key}>
                      <label className="text-xs font-bold text-[#1e3a5f] block mb-1">{f.label}</label>
                      <input value={(rgenInfo as any)[f.key]} onChange={e=>setRgenInfo(g=>({...g,[f.key]:e.target.value}))}
                        placeholder={f.ph}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#dbeafe] outline-none"
                        style={{boxSizing:'border-box'}} />
                    </div>
                  ))}
                </div>
                {/* Generated Reaction Plan Preview */}
                <div className="rounded-xl overflow-hidden border-2" style={{borderColor:'#065f46'}}>
                  <div className="p-3 text-center font-bold text-white text-sm" style={{background:'#065f46'}}>
                    REACTION PLAN — {rgenInfo.part || '[Part Name]'} | {rgenInfo.process || '[Process]'}
                  </div>
                  <div className="p-4" style={{background:'#fff'}}>
                    <div className="text-xs font-bold mb-2" style={{color:'#065f46'}}>
                      Characteristic: {rgenInfo.char || '[Characteristic]'} | Spec: {rgenInfo.spec || '[Specification]'}
                    </div>
                    {[
                      {step:'1', title:'STOP', color:'#dc2626', action:`Stop ${rgenInfo.process||'the process'} immediately. Do not produce any more parts.`},
                      {step:'2', title:'SEGREGATE', color:'#d97706', action:`Identify and physically segregate ALL parts since the last confirmed good piece. Tag with RED "HOLD" label. Quantity to segregate: [operator to confirm].`},
                      {step:'3', title:'CONTAIN', color:'#7c3aed', action:`Perform 100% inspection of all segregated ${rgenInfo.part||'parts'} using [${rgenInfo.spec||'specified gauge'}]. Sort: conforming to green bin, non-conforming to red bin.`},
                      {step:'4', title:'NOTIFY', color:'#1e40af', action:`Immediately inform: (1) QA Engineer — within 15 min. (2) QA Manager — within 30 min. (3) Production Supervisor — immediately. Raise NCR in system within 1 hour.`},
                      {step:'5', title:'CORRECT & RECORD', color:'#065f46', action:`Identify and fix root cause before restarting production. QA Manager to approve restart. Record all actions in NCR log and reaction plan register. If repeat occurrence — initiate 8D within 24 hours.`},
                    ].map(s=>(
                      <div key={s.step} className="flex items-start gap-3 mb-3 p-3 rounded-lg" style={{background:`${s.color}08`, border:`1px solid ${s.color}33`}}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0" style={{background:s.color}}>{s.step}</div>
                        <div>
                          <div className="text-xs font-extrabold mb-0.5" style={{color:s.color}}>{s.title}</div>
                          <div className="text-xs text-[#1e3a5f] leading-relaxed">{s.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 gap-4" style={{background:'#f8fafc', borderTop:'1px solid #e2e8f0'}}>
                    {['QA Manager','Production Supervisor','Plant Head'].map(role=>(
                      <div key={role} style={{borderTop:'2px solid #065f46', paddingTop:'8px', textAlign:'center'}}>
                        <div className="text-xs font-bold text-[#1e3a5f]">{role}</div>
                        <div className="text-xs text-[#1e3a5f] mt-1">Signature & Date</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={()=>window.print()} className="w-full mt-4 py-2.5 rounded-xl text-white font-bold text-sm" style={{background:'#065f46'}}>
                  🖨️ Print Reaction Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- KNOWLEDGE HUB TAB (now CP Guide) ------------------- */}
      {mainTab === 'guide' && (
      <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_AIAG_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#065f46'}}>CP Column Guide PDF</a>
            <a href="/downloads/control-plan/CP_Characteristic_Classification.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#1e40af'}}>Characteristic Class XLS</a>
            <a href="/downloads/control-plan/CP_Reaction_Plan_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>Reaction Plan Guide</a>
            <a href="/downloads/control-plan/CP_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>Common NC Findings</a>
          </div>

        <div className="max-w-5xl mx-auto space-y-8">

          {/* What is a Control Plan */}
          <div className="bg-white border border-blue-700/50/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">📋 What is a Control Plan?</h2>
            <p className="text-[#1e3a5f] text-sm leading-relaxed mb-4">
              A Control Plan is a living document that describes the actions (measurements, inspections, quality checks, or monitoring) required at each step of the process to ensure the process outputs satisfy customer requirements. It bridges the gap between PFMEA and the shop floor operator.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { color:'blue', title:'Prototype', icon:'🔬', desc:'Used during design verification. Dimensional verification, material & performance testing to confirm design meets requirements.' },
                { color:'amber', title:'Pre-Launch', icon:'🚀', desc:'Used after prototype, before full production. Validates manufacturing process capability before launch (trial runs, PPAP).' },
                { color:'green', title:'Production', icon:'🏭', desc:'Living document for ongoing production control. Updated whenever process, product, or control method changes.' },
              ].map(t => (
                <div key={t.title} className={`bg-${t.color}-900/30 border border-${t.color}-700/40 rounded-xl p-4`}>
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className={`font-bold text-${t.color}-300 text-sm mb-2`}>{t.title} Control Plan</div>
                  <p className="text-[#1e3a5f] text-xs leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* IATF Linkage */}
          <div className="bg-white border border-purple-900/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">🔗 IATF 16949 &amp; ISO Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { clause:'8.5.1.1', title:'Control Plan', req:'Must document all product and process controls, monitoring, reaction plans, and measurement systems. Must be updated when PFMEA changes or customer complaints occur.' },
                { clause:'8.5.1.2', title:'Standardized Work', req:'Work instructions must reference the Control Plan. Operators must follow the documented control method and sample frequency.' },
                { clause:'8.6.2', title:'Layout Inspection', req:'Full-dimensional layout (all characteristics verified against drawings) required at specified frequency — must be documented in Control Plan.' },
                { clause:'9.1.1.1', title:'Monitoring & Measurement', req:'Sample sizes and frequencies in Control Plan must be statistically justified. SPC usage must be reflected in Control Plan control methods.' },
              ].map(c => (
                <div key={c.clause} className="bg-purple-900/30/20 border border-purple-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-700 text-white text-xs font-bold px-2 py-0.5 rounded">Cl. {c.clause}</span>
                    <span className="text-purple-700 text-sm font-semibold">{c.title}</span>
                  </div>
                  <p className="text-[#1e3a5f] text-xs leading-relaxed">{c.req}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Special Characteristics */}
          <div className="bg-white border border-amber-900/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">⭐ Special Characteristic Classifications (Field 20)</h2>
            <p className="text-[#1e3a5f] text-sm mb-4">Special characteristics require enhanced controls, tighter sample plans, SPC, and often customer approval before change. Always verify with customer-specific requirements (CSR).</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50">
                    <th className="border border-amber-800/40 px-3 py-2 text-left text-amber-700">Symbol</th>
                    <th className="border border-amber-800/40 px-3 py-2 text-left text-amber-700">Classification</th>
                    <th className="border border-amber-800/40 px-3 py-2 text-left text-amber-700">Used By</th>
                    <th className="border border-amber-800/40 px-3 py-2 text-left text-amber-700">Meaning</th>
                    <th className="border border-amber-800/40 px-3 py-2 text-left text-amber-700">Required Control</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['★','Safety Critical / CC','FORD, GM, PSA','Failure could cause safety issue or non-compliance with regulations','SPC mandatory, 100% check or Cpk ≥ 1.67, no deviation without approval'],
                    ['◆','Critical Characteristic','FORD','Affects safety, compliance, or vehicle function','SPC, Cpk ≥ 1.67, documented verification'],
                    ['CC','Critical Characteristic','AIAG / Multi-customer','Safety, regulatory, or significant misassembly risk','SPC, 100% containment if OOC, no concession without customer sign-off'],
                    ['SC','Significant Characteristic','AIAG / Multi-customer','Significant effect on fit, function, durability, or manufacturability','SPC or enhanced inspection, Cpk ≥ 1.33'],
                    ['KPC','Key Product Characteristic','Boeing / Aerospace','Critical product feature requiring enhanced documentation','100% verification, full traceability'],
                    ['KCC','Key Control Characteristic','Boeing / Aerospace','Critical process parameter driving KPC','Real-time monitoring, SPC'],
                    ['YC/YS','Safety/Significant','Stellantis','Stellantis-specific safety and significant chars','Per Stellantis CSR requirements'],
                  ].map(([sym,cls,oem,meaning,ctrl], i) => (
                    <tr key={i} className={i%2===0?'bg-[#eff6ff]':'bg-white/10'}>
                      <td className="border border-amber-900/30 px-3 py-2 font-bold text-amber-700 text-center text-base">{sym}</td>
                      <td className="border border-amber-900/30 px-3 py-2 text-white font-semibold">{cls}</td>
                      <td className="border border-amber-900/30 px-3 py-2 text-[#1e3a5f]">{oem}</td>
                      <td className="border border-amber-900/30 px-3 py-2 text-[#1e3a5f]">{meaning}</td>
                      <td className="border border-amber-900/30 px-3 py-2 text-green-300">{ctrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Control Methods */}
          <div className="bg-white border border-green-900/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">🔧 Control Methods (Field 24) — Best Practice Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { method:'SPC (Statistical Process Control)', when:'Variable data, CC/SC characteristics, high volume', example:'Xbar-R chart for hole diameter every 2 hours, n=5', badge:'Preferred for CC/SC' },
                { method:'Error Proofing (Poka-Yoke)', when:'Critical assembly features, human error risk', example:'Fixture with detection sensor preventing wrong assembly', badge:'Best Control' },
                { method:'100% Inspection / Vision System', when:'Complex features, safety items where SPC is not feasible', example:'Camera system checking all torque values after assembly', badge:'High cost' },
                { method:'Statistical Sampling (AQL)', when:'Incoming/final inspection of attribute characteristics', example:'AQL 0.65, Level II sampling for visual defects at final', badge:'For attributes' },
                { method:'Process Parameter Monitoring', when:'Process characteristics that drive product quality', example:'Weld current / voltage logged every 30 min with limits', badge:'Process control' },
                { method:'Periodic Calibrated Gauge', when:'Low volume, non-safety characteristics', example:'CMM inspection quarterly or at start of production run', badge:'Low frequency' },
              ].map(c => (
                <div key={c.method} className="bg-green-900/30/20 border border-green-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[#15803d] font-semibold text-sm">{c.method}</span>
                    <span className="text-xs bg-green-800/50 text-[#15803d] px-2 py-0.5 rounded whitespace-nowrap">{c.badge}</span>
                  </div>
                  <p className="text-[#1e3a5f] text-xs mb-1"><strong className="text-[#1e3a5f]">When:</strong> {c.when}</p>
                  <p className="text-[#1e3a5f] text-xs"><strong className="text-[#1e3a5f]">Example:</strong> {c.example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PFMEA Link */}
          <div className="bg-white">
            <h2 className="text-lg font-bold text-white mb-2">🔗 Control Plan ↔ PFMEA Linkage</h2>
            <p className="text-[#1e3a5f] text-sm mb-4">The Control Plan is the output of PFMEA Action Planning. Every High-AP failure mode from PFMEA must have a corresponding control row in the Control Plan.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="text-3xl mb-2">🧩</div>
                <div className="text-indigo-700 font-semibold mb-1">PFMEA</div>
                <div className="text-[#1e3a5f]">Identifies failure modes, effects, causes &amp; action priority (High/Medium/Low)</div>
              </div>
              <div className="text-center flex items-center justify-center">
                <div className="text-2xl text-indigo-500">→</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-[#15803d] font-semibold mb-1">Control Plan</div>
                <div className="text-[#1e3a5f]">Translates PFMEA actions into: measurement method, sample size, frequency, and reaction plan</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-indigo-900/30/30 border border-indigo-700/30 rounded-lg text-xs text-indigo-300">
              <strong>Audit tip:</strong> An IATF auditor will cross-check that every CC/SC on the Control Plan exists in the PFMEA with a detection control linked. Missing linkage = major NC under Cl. 8.5.1.1.
            </div>
          </div>

        </div>
      </div>
      )}

      {/* -- Q&A TAB --------------------------------------------- */}
      {mainTab === 'qa' && (
      <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>Training Guide PDF</a>
            <a href="/downloads/control-plan/CP_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/control-plan/CP_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#1e40af'}}>IATF Clause Map</a>
            <a href="/downloads/control-plan/CP_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#065f46'}}>Competency Matrix PDF</a>
          </div>

        <div className="max-w-4xl mx-auto space-y-6">

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">How to Create an AIAG Control Plan</h2>
            <p className="text-[#1e3a5f] text-sm mt-1">Step-by-step guide aligned with AIAG 1st Edition (March 2024) &amp; IATF 16949</p>
          </div>

          {[
            { step:1, icon:'📁', title:'Gather Inputs', color:'blue',
              content:'Before starting, collect: Part drawing / 3D model, PFMEA with AP ratings, Process Flow Diagram (PFD), DVP&R (if prototype), Customer-Specific Requirements (CSR), Previous Control Plans (if revision), Gauge/MSA study results.' },
            { step:2, icon:'📝', title:'Complete the Header (Fields 1–13)', color:'indigo',
              content:'Fill Phase (Prototype / Pre-Launch / Production), Control Plan Number (unique ID), Part Number with change level, Supplier/Plant details, Key Contact and all required approvals. Dates must be actual — never leave blank for submission.' },
            { step:3, icon:'🔍', title:'List All Process Steps (Field 14–15)', color:'purple',
              content:'Cross-reference your Process Flow Diagram. Every process step in the PFD must appear as at least one row in the Control Plan. Use the same step numbers as your PFMEA and PFD for traceability. Include: Incoming Inspection, Sub-assembly, Main assembly, Torque/weld/paint operations, Final inspection, Packing.' },
            { step:4, icon:'⭐', title:'Identify All Characteristics (Fields 16–20)', color:'amber',
              content:'For each process step, list: Machine/Device/Jig used, Characteristic number (cross-ref to PFMEA), Product characteristics from drawing (dimensions, material), Process characteristics that drive them (temperature, pressure, torque). Mark all CC/SC special characteristics with correct symbol. Every CC from PFMEA must appear here.' },
            { step:5, icon:'📏', title:'Define Measurement Methods (Fields 21–23)', color:'green',
              content:'For each characteristic: Specification/tolerance from drawing, Measurement technique (CMM, gauge, vision), Sample size (statistically justified — use AIAG SPC manual formula for SPC chars), Sample frequency (volume-based preferred over time-based). Tip: CC characteristics must have Cpk ≥ 1.67 — set sample plan accordingly.' },
            { step:6, icon:'🔧', title:'Define Control Methods (Field 24)', color:'teal',
              content:'Select the strongest applicable control: Error-proofing first (best), then SPC, then 100% inspection, then sampling. For CC/SC: SPC is mandatory or 100% if SPC is not feasible. Document the exact chart type (Xbar-R, IMR, p-chart) and control limits source (study-based). Reference the control chart sheet or SPC system by name.' },
            { step:7, icon:'🚨', title:'Write the Reaction Plan (Fields 25–26)', color:'red',
              content:'Every row must have a specific reaction plan — not generic. Bad: "Stop and inform supervisor." Good: "Stop machine, isolate last 2-hour production (tag as HOLD), measure 100% for this char, notify QE within 1 hour, initiate 8D if non-conforming parts confirmed." Assign one named responsible person (Field 26) — not a department.' },
            { step:8, icon:'✅', title:'Review, Approve & Maintain', color:'gray',
              content:'Submit for customer approval for all CC/SC characteristics (check CSR). Get supplier/plant approval. File with PPAP package (Level 3/4/5 submissions). Update whenever: Drawing revision, PFMEA AP rating changes, Customer complaint, Process change (Cl. 7.1.1 management of change). Re-validate affected rows — do not just "update date." Record revision history.' },
          ].map(s => (
            <div key={s.step} className={`bg-white border border-${s.color}-900/50 rounded-2xl p-5`}>
              <div className="flex items-start gap-4">
                <div className={`bg-${s.color}-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0`}>{s.step}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <h3 className={`text-${s.color}-300 font-bold text-base`}>{s.title}</h3>
                  </div>
                  <p className="text-[#1e3a5f] text-sm leading-relaxed">{s.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Common Mistakes */}
          <div className="bg-white border border-red-900/50 rounded-2xl p-6 mt-4">
            <h2 className="text-lg font-bold text-white mb-4">❌ Common Mistakes &amp; How to Fix Them</h2>
            <div className="space-y-3">
              {[
                { mistake:'Generic reaction plans like "inform supervisor"', fix:'Write specific containment steps with time targets. Name the responsible person by role.' },
                { mistake:'Control Plan not updated after PFMEA revision', fix:'Establish a change-management trigger: every PFMEA update must trigger CP review within 5 days.' },
                { mistake:'Sample size not statistically justified', fix:'Use AIAG SPC reference manual formula or minimum n=5 for variables data SPC charts.' },
                { mistake:'Missing PFMEA-to-CP linkage for CC characteristics', fix:'Add Char. No. cross-reference column. Every CC in PFMEA must appear in CP — auditors check this.' },
                { mistake:'Control Plan stored as static PDF, never updated', fix:'Treat CP as a living document. Store in document control system with revision history and mandatory review triggers.' },
                { mistake:'Measurement technique listed but no MSA done', fix:'Every gauge on Control Plan must have a GRR study. Document study results and %R&R.' },
              ].map((m, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-start gap-2 bg-red-50 border border-red-800/30 rounded-lg p-3">
                    <span className="text-red-600 text-sm mt-0.5 flex-shrink-0">✗</span>
                    <p className="text-red-700 text-xs">{m.mistake}</p>
                  </div>
                  <div className="flex items-start gap-2 bg-green-900/30/20 border border-green-700/50 rounded-lg p-3">
                    <span className="text-green-600 text-sm mt-0.5 flex-shrink-0">✓</span>
                    <p className="text-[#15803d] text-xs">{m.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Questions */}
          <div className="bg-white border border-purple-900/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">🎯 IATF Auditor Questions — Be Ready</h2>
            <div className="space-y-2">
              {[
                'Show me the Control Plan for this process. How does it link to your PFMEA?',
                'This is a CC characteristic — what is your current Cpk? What is the sample size and frequency in your Control Plan?',
                'Your Control Plan shows SPC for this characteristic. Can I see the last 30 control chart points?',
                'When was this Control Plan last reviewed? What triggered the last revision?',
                'A customer complaint came in last month — was the Control Plan updated as part of corrective action?',
                'Who is the "responsible person" in Field 26? Are they aware of this reaction plan?',
                'Your reaction plan says "notify QE" — what is the maximum response time? Is this documented?',
                'Do you have MSA results for the measurement technique listed in Field 22? What is the %R&R?',
              ].map((q, i) => (
                <div key={i} className="flex items-start gap-3 bg-purple-900/30/20 border border-purple-700/50 rounded-lg px-4 py-3">
                  <span className="text-purple-600 font-bold text-sm flex-shrink-0">Q{i+1}</span>
                  <p className="text-[#1e3a5f] text-xs leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      )}

      {/* -- DOWNLOADS TAB --------------------------------------------------- */}
      {mainTab === 'templates' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Master_Template_AIAG.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#065f46'}}>CP Master Template XLS</a>
            <a href="/downloads/control-plan/CP_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>CP Audit Checklist XLS</a>
            <a href="/downloads/control-plan/CP_Characteristic_Classification.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#1e40af'}}>Char Classification XLS</a>
            <a href="/downloads/control-plan/CP_Reaction_Plan_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>Reaction Plan Guide</a>
          </div>

          <div className="max-w-screen-xl mx-auto">
            <p className="text-[#1e3a5f] text-sm mb-5">Ready-to-use Control Plan templates aligned to AIAG format.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Control Plan — Blank AIAG Format', type: 'Excel', icon: '📋', desc: 'All 26 columns per AIAG standard — header fields, process steps, special characteristics, reaction plans', file: '/downloads/control-plan/CP_Blank_AIAG_Format.xlsx' },
                { name: 'PFD → PFMEA → Control Plan Linkage', type: 'Excel', icon: '🔗', desc: 'Trinity template showing aligned step numbers across Process Flow, PFMEA and Control Plan', file: '/downloads/control-plan/CP_PFD_PFMEA_Linkage.xlsx' },
                { name: 'Control Plan Review Checklist', type: 'Word', icon: '✅', desc: '20-point checklist for Control Plan review — all fields, linkage, special characteristics and reaction plans', file: '/downloads/control-plan/CP_Review_Checklist.docx' },
                { name: 'Reaction Plan Template', type: 'Word', icon: '⚡', desc: 'Standard reaction plan format — out-of-control condition, immediate action, responsible person, max response time', file: '/downloads/control-plan/CP_Reaction_Plan_Template.docx' },
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
        </div>
      )}

      {mainTab === 'docs' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_vs_PFMEA_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#0e7490'}}>CP vs PFMEA Linkage</a>
            <a href="/downloads/control-plan/CP_Reaction_Plan_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>CP Reaction Plan Guide</a>
            <a href="/downloads/control-plan/CP_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#065f46'}}>Case Studies PDF</a>
            <a href="/downloads/control-plan/CP_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#7c3aed'}}>Common NC Findings</a>
          </div>

          <div className="max-w-screen-xl mx-auto space-y-4">
            <div className="bg-white border border-blue-700/50 rounded-2xl p-5 flex items-center gap-5">
              <div className="w-14 h-14 bg-[#eff6ff] rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📗</div>
              <div className="flex-1">
                <div className="font-bold text-white text-base mb-1">AIAG Control Plan Reference Manual (1st Edition)</div>
                <div className="text-[#1e3a5f] text-xs mb-2">Complete AIAG Control Plan standard — all 26 fields, prototype/pre-launch/production types, reaction plans, special characteristics</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-[#eff6ff] text-[#1d4ed8] px-2 py-0.5 rounded">PDF · 3.7 MB</span>
                  <span className="text-xs bg-purple-900/30 text-purple-700 px-2 py-0.5 rounded">AIAG Standard</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href="/downloads/control-plan/AIAG_Control_Plan_First_Edition.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-bold transition">👁 View PDF</a>
                <a href="/downloads/control-plan/AIAG_Control_Plan_First_Edition.pdf" download className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition">⬇ Download</a>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { title: 'PFD – PFMEA – Control Plan Trinity Guide', icon: '🔺', desc: 'How process step numbers must align across all three documents — audit cross-referencing guide', file: '/downloads/control-plan/CP_Trinity_Guide.pdf' },
                { title: 'Special Characteristics in Control Plan', icon: '⭐', desc: 'CC/SC control requirements — sample size, frequency, measurement, SPC, reaction plans', file: '/downloads/control-plan/CP_Special_Characteristics.pdf' },
                { title: 'Control Plan IATF Audit Checklist', icon: '✔️', desc: '30-point checklist for Clause 8.5.1.1 compliance — all field requirements, linkage, CSR alignment', file: '/downloads/control-plan/CP_IATF_Audit_Checklist.pdf' },
              ].map(doc => (
                <div key={doc.title} className="bg-white border border-[#dbeafe] rounded-xl p-4 flex items-center gap-4" onDoubleClick={() => window.open(doc.file, '_blank')} title="Double-click to view" style={{ cursor: 'pointer' }}>
                  <div className="text-2xl flex-shrink-0">{doc.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm mb-1">{doc.title}</div>
                    <div className="text-[#1e3a5f] text-xs leading-relaxed">{doc.desc}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={doc.file} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white hover:bg-[#dbeafe] text-[#1e3a5f] rounded-lg text-xs font-bold">View →</a>
                    <a href={doc.file} download className="px-3 py-2 bg-[#1d4ed8] hover:bg-blue-800 text-white rounded-lg text-xs font-bold">⬇ PDF</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'posters' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen">
          {/* Download Strip */}
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Posters_A3.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#1e40af'}}>All CP Posters PDF</a>
            <a href="/downloads/control-plan/CP_AIAG_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#065f46'}}>CP Column Guide</a>
            <a href="/downloads/control-plan/CP_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline hover:opacity-90" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>

          <div className="max-w-screen-xl mx-auto">
            <p className="text-[#1e3a5f] text-sm mb-5">Print-ready Control Plan posters and reference banners for factory floor, quality lab, and training room.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title:'Control Plan 26 Fields Poster', size:'A1 Poster', desc:'Complete visual map of all 26 Control Plan fields — header, characteristics, methods, reaction plan sections', colors:['#1d4ed8','#2563eb'], file:'/downloads/control-plan/CP_26_Fields_Poster.pdf' },
                { title:'PFD → PFMEA → CP Trinity', size:'A1 Poster', desc:'Visual showing how process step numbers must align across the three core documents — mandatory for IATF audit', colors:['#065f46','#047857'], file:'/downloads/control-plan/CP_Trinity_Poster.pdf' },
                { title:'Special Characteristics Control Guide', size:'A2 Poster', desc:'CC and SC control requirements — minimum sample size, SPC requirement, reaction plan expectations', colors:['#92400e','#b45309'], file:'/downloads/control-plan/CP_Special_Char_Poster.pdf' },
                { title:'3 Types of Control Plan Banner', size:'A2 Banner', desc:'Prototype vs Pre-Launch vs Production Control Plan — differences, when to use, who approves', colors:['#5b21b6','#7c3aed'], file:'/downloads/control-plan/CP_3Types_Banner.pdf' },
                { title:'Reaction Plan Flow Poster', size:'A2 Poster', desc:'Visual flowchart: out-of-control detection → stop → contain → notify → corrective action steps', colors:['#991b1b','#b91c1c'], file:'/downloads/control-plan/CP_Reaction_Plan_Poster.pdf' },
                { title:'Control Plan Audit Checklist Banner', size:'A3 Banner', desc:'Quick reference — top 10 IATF audit questions on Control Plan. Display in quality meeting room', colors:['#1e3a5f','#1e40af'], file:'/downloads/control-plan/CP_Audit_Banner.pdf' },
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
                      <a href={p.file} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-bold py-2 bg-white hover:bg-[#dbeafe] text-[#1e3a5f] rounded-lg">🖨️ View</a>
                      <a href={p.file} download className="flex-1 text-center text-xs font-bold py-2 bg-[#1d4ed8] hover:bg-blue-800 text-white rounded-lg">⬇ Download</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-white border border-blue-700/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-3xl">🖨️</div>
              <div>
                <div className="text-sm font-bold text-[#1d4ed8]">Print & Display in Your Factory</div>
                <div className="text-xs text-[#1e3a5f] mt-1">All posters formatted A1/A2/A3. Display near Control Plan workstations, production floor, quality lab, and audit preparation area.</div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ══ DASHBOARD ═══════════════════════════════════════════════════ */}
      {mainTab === 'dashboard' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#065f46'}}>Audit Checklist XLS</a>
            <a href="/downloads/control-plan/CP_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/control-plan/CP_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Case Studies PDF</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#065f46'}}>📊 Control Plan Dashboard</div>
          <div className="text-xs text-[#1e3a5f] mb-5">CP coverage status, characteristic types, and open action tracking</div>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              {label:'Total Characteristics', value:'26', icon:'📋', color:'#065f46', sub:'Across 7 process steps'},
              {label:'CC Characteristics', value:'4', icon:'🔴', color:'#dc2626', sub:'Must be 100% controlled'},
              {label:'SC Characteristics', value:'8', icon:'🟡', color:'#d97706', sub:'Specific frequency required'},
              {label:'SPC Controlled', value:'6', icon:'📈', color:'#1e40af', sub:'With active control charts'},
            ].map(k=>(
              <div key={k.label} className="bg-white border rounded-xl p-4 shadow-sm" style={{borderColor:'#e2e8f0'}}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{k.icon}</span>
                  <div className="text-xs text-[#1e3a5f] font-semibold">{k.label}</div>
                </div>
                <div className="text-3xl font-extrabold" style={{color:k.color}}>{k.value}</div>
                <div className="text-xs text-[#1e3a5f] mt-1">{k.sub}</div>
              </div>
            ))}
          </div>
          {/* CP Coverage by Process Step */}
          <div className="bg-white border rounded-xl p-5 mb-4 shadow-sm" style={{borderColor:'#e2e8f0'}}>
            <div className="text-sm font-bold mb-4" style={{color:'#065f46'}}>CP Coverage by Process Step</div>
            {[
              {step:'10 - Receiving Inspection', chars:3, cc:0, sc:1, spc:0},
              {step:'20 - Welding', chars:4, cc:2, sc:1, spc:1},
              {step:'30 - Heat Treatment', chars:4, cc:1, sc:2, spc:2},
              {step:'40 - CNC Machining', chars:6, cc:1, sc:2, spc:2},
              {step:'50 - Assembly Press', chars:3, cc:0, sc:1, spc:0},
              {step:'60 - Final Inspection', chars:6, cc:0, sc:1, spc:1},
            ].map(s=>(
              <div key={s.step} className="flex items-center gap-4 mb-3">
                <div className="text-xs font-semibold w-44 text-[#1e3a5f] flex-shrink-0">{s.step}</div>
                <div className="flex-1 flex gap-1 items-center">
                  <div className="h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{width:`${(s.chars/6)*100}%`, minWidth:'32px', background:'#065f46'}}>{s.chars}</div>
                </div>
                <div className="flex gap-2 text-xs flex-shrink-0">
                  {s.cc>0 && <span className="px-2 py-0.5 rounded font-bold text-white" style={{background:'#dc2626'}}>CC:{s.cc}</span>}
                  {s.sc>0 && <span className="px-2 py-0.5 rounded font-bold" style={{background:'#fef3c7', color:'#92400e'}}>SC:{s.sc}</span>}
                  {s.spc>0 && <span className="px-2 py-0.5 rounded font-bold" style={{background:'#dbeafe', color:'#1e40af'}}>SPC:{s.spc}</span>}
                </div>
              </div>
            ))}
          </div>
          {/* Open Actions */}
          <div className="bg-white border rounded-xl p-5 shadow-sm" style={{borderColor:'#fecaca'}}>
            <div className="text-sm font-bold mb-4 text-red-700">⚠️ CP Action Items Requiring Attention</div>
            {[
              {item:'CC weld strength — visual inspection only', risk:'HIGH', action:'Upgrade to 100% UT inspection', due:'2025-08-20', owner:'QA Manager'},
              {item:'Reaction plan: "inspect and rework" — not specific', risk:'HIGH', action:'Rewrite to 5-step specific plan', due:'2025-08-15', owner:'Quality Engineer'},
              {item:'Annual layout inspection overdue (last: Nov 2024)', risk:'MED', action:'Schedule CMM full layout', due:'2025-09-01', owner:'QA Team'},
            ].map((a,i)=>(
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg mb-2" style={{background: a.risk==='HIGH'?'#fff5f5':'#fffbeb', border:`1px solid ${a.risk==='HIGH'?'#fecaca':'#fde68a'}`}}>
                <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{background: a.risk==='HIGH'?'#dc2626':'#d97706', flexShrink:0}}>{a.risk}</span>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#1e3a5f]">{a.item}</div>
                  <div className="text-xs text-[#1e3a5f]">{a.action}</div>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <div className="text-[#1e3a5f]">{a.owner}</div>
                  <div className="text-red-500">Due: {a.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ DEEP DIVE ════════════════════════════════════════════════════ */}
      {mainTab === 'deepdive' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_AIAG_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#065f46'}}>CP Column Guide PDF</a>
            <a href="/downloads/control-plan/CP_Characteristic_Classification.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Characteristic Class XLS</a>
            <a href="/downloads/control-plan/CP_vs_PFMEA_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0e7490'}}>PFD Linkage Guide</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#065f46'}}>🧩 All 13 CP Columns — Deep Dive</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Every column explained with purpose, tips, and common audit mistakes — AIAG First Edition</div>
          <div className="flex flex-col gap-3">
            {CP_COLUMNS.map(col => (
              <div key={col.no} className="rounded-xl overflow-hidden shadow-sm" style={{border:'1px solid #d1fae5'}}>
                <div className="flex items-center gap-4 p-4" style={{background:'#065f46'}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0" style={{background:'rgba(255,255,255,0.15)'}}>
                    {col.no}
                  </div>
                  <div className="text-sm font-bold text-white">{col.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-0" style={{background:'#f8fafc'}}>
                  <div className="p-3 border-r border-green-800/50">
                    <div className="text-xs font-bold mb-1" style={{color:'#065f46'}}>Purpose</div>
                    <div className="text-xs text-[#1e3a5f] leading-relaxed">{col.desc}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold mb-1" style={{color:'#0e7490'}}>💡 Audit Tip</div>
                    <div className="text-xs text-[#1e3a5f] leading-relaxed">{col.tip}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ WORKFLOW ══════════════════════════════════════════════════════ */}
      {mainTab === 'workflow' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Master_Template_AIAG.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#065f46'}}>CP Master Template XLS</a>
            <a href="/downloads/control-plan/CP_vs_PFMEA_Linkage.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#0e7490'}}>PFD Linkage Guide</a>
            <a href="/downloads/control-plan/CP_IATF_Clause_Mapping.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>IATF Clause Map</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#065f46'}}>🔄 Control Plan Development Workflow</div>
          <div className="text-xs text-[#1e3a5f] mb-5">End-to-end: from APQP Phase 3 input to PPAP submission — with RACI and timing</div>
          <div className="flex flex-col gap-0">
            {[
              {n:1, action:'Receive PFD and PFMEA from APQP Phase 3', who:'Quality Engineer', tool:'PFD, PFMEA Rev 1', timing:'APQP Phase 3', color:'#065f46'},
              {n:2, action:'Identify all process steps for CP from PFD (match step numbers)', who:'QA + Mfg Engineering', tool:'Process Flow Diagram', timing:'Week 1', color:'#065f46'},
              {n:3, action:'List product characteristics from engineering drawings', who:'Quality Engineer + Design Eng', tool:'Engineering drawings, customer specs', timing:'Week 1', color:'#059669'},
              {n:4, action:'List process characteristics from PFMEA (KPIV)', who:'Manufacturing Engineering', tool:'PFMEA, process parameters', timing:'Week 1-2', color:'#059669'},
              {n:5, action:'Classify characteristics: CC / SC / Standard (customer symbols)', who:'QA Manager', tool:'Customer-specific requirements', timing:'Week 2', color:'#d97706'},
              {n:6, action:'Define measurement system: gauge, sample size, frequency', who:'Quality Engineer + Metrology', tool:'MSA study results, gauge list', timing:'Week 2', color:'#d97706'},
              {n:7, action:'Define control methods: SPC for CC, 100% or poka-yoke options', who:'QA + Manufacturing', tool:'SPC capability study', timing:'Week 2-3', color:'#dc2626'},
              {n:8, action:'Write reaction plans: specific 5-step plan for each characteristic', who:'QA Manager + Production Sup', tool:'Reaction plan template', timing:'Week 3', color:'#dc2626'},
              {n:9, action:'Link to Work Instructions: reference WI number in CP', who:'Quality Engineer + Training', tool:'WI library, SOPs', timing:'Week 3', color:'#7c3aed'},
              {n:10, action:'Cross-functional review: QA, Mfg, Engineering, Customer sign-off', who:'Quality Manager', tool:'CP review checklist', timing:'Week 4', color:'#7c3aed'},
              {n:11, action:'Include in PPAP submission package (Element 14)', who:'Quality Manager', tool:'PPAP 4th Edition', timing:'Before SOP', color:'#1e40af'},
              {n:12, action:'Annual review: update after complaints, changes, annual layout', who:'Quality Team', tool:'ECN tracker, complaint log', timing:'Annual + triggered', color:'#1e293b'},
            ].map((s,i) => (
              <div key={s.n} className="flex gap-0 items-stretch">
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0 mt-2" style={{background:s.color}}>{s.n}</div>
                  {i<11 && <div className="w-0.5 flex-1 mt-1" style={{background:`${s.color}55`}} />}
                </div>
                <div className="flex-1 ml-3 mb-2 rounded-xl p-3 bg-white shadow-sm" style={{border:`1px solid ${s.color}33`}}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-bold text-[#1e3a5f]">{s.action}</div>
                    <div className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-semibold" style={{background:`${s.color}15`, color:s.color}}>{s.timing}</div>
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

      {/* ══ CASE STUDIES ════════════════════════════════════════════════ */}
      {mainTab === 'casestudies' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Case_Studies.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>Case Studies PDF</a>
            <a href="/downloads/control-plan/CP_Common_NC_Findings.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#dc2626'}}>Common NC Findings</a>
            <a href="/downloads/control-plan/CP_Reaction_Plan_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#065f46'}}>Reaction Plan Guide</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#065f46'}}>📂 Control Plan Case Studies</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Real-world CP failures and fixes — what went wrong, root cause, lesson captured</div>
          <div className="flex flex-col gap-5">
            {[
              {id:'CS-CP01', part:'BKT-001 Bracket — Welding', customer:'Tata Motors', status:'CUSTOMER RETURN', color:'#dc2626', tag:'CC Not Controlled',
                problem:'Weld tensile strength (CC, S=9) was in CP with "1 per shift, visual inspection". Sub-standard welds escaped — vehicle recall risk raised by customer.',
                cause:'CC characteristic allowed on sample-only visual inspection. AIAG IATF requires 100% or validated poka-yoke for CC.',
                lesson:'CC = 100% detection or validated poka-yoke. Sample inspection is NEVER acceptable for CC. Auditor raised Major NC Clause 8.5.1.1.',
                best:'Implemented 100% UT weld inspection with automated pass/fail output. CP updated. GRR study completed on UT equipment.'},
              {id:'CS-CP02', part:'HUB-203 — CNC Bore', customer:'Maruti Suzuki', status:'IATF NC', color:'#d97706', tag:'Vague Reaction Plan',
                problem:'Control Plan reaction plan said "Inform supervisor and inspect further." Supervisor was out. Operator continued production. 200 parts out of spec.',
                cause:'Reaction plan was not specific enough — no action for "supervisor unavailable" scenario. Operator had no authority to stop production.',
                lesson:'Reaction plan must empower the operator to stop the machine immediately, regardless of supervisor availability. Every operator must be trained.',
                best:'Rewritten reaction plan: (1) Stop machine. (2) Segregate since last good. (3) 100% sort. (4) Tag and inform QA via radio. (5) QA Engineer approves restart.'},
              {id:'CS-CP03', part:'LINK-410 — Heat Treatment', customer:'Mahindra', status:'IATF NC', color:'#7c3aed', tag:'CP Not Updated After ECN',
                problem:'Engineering changed hardness spec from 58-62 HRC to 60-64 HRC. CP was not updated — QA was inspecting to old spec for 3 weeks. Customer found during audit.',
                cause:'No Engineering Change Notification (ECN) process linked to mandatory CP update. Engineering made the change without informing QA.',
                lesson:'ECN must trigger mandatory CP review and update before implementation. QA sign-off on CP update must be part of ECN approval workflow.',
                best:'Implemented: ECN form now includes "CP Update Required: Yes/No" field. QA Manager sign-off includes CP revision confirmation. Document control system enforces simultaneous revision.'},
              {id:'CS-CP04', part:'AXLE-550 — Final Inspection', customer:'Ashok Leyland', status:'SUCCESS', color:'#065f46', tag:'Proactive Improvement',
                problem:'During self-assessment, team found final inspection CP had 3 CC characteristics with "1 in 10 sample" — not 100% controlled.',
                cause:'CP was written before AIAG-VDA 2019 update. Old RPN-based thinking allowed sample for high-severity items.',
                lesson:'Periodic CP self-audit (every 6 months) prevents escapes before the IATF auditor finds them. Use the 14-point CP Completeness Score checklist.',
                best:'All 3 CC characteristics upgraded to 100% CMM inspection with automated go/no-go output. CP updated, operators trained. IATF audit 2 months later — zero findings on CP.'},
            ].map(cs=>(
              <div key={cs.id} className="rounded-2xl overflow-hidden shadow-sm" style={{border:`2px solid ${cs.color}33`}}>
                <div className="flex items-start justify-between p-4" style={{background:`${cs.color}10`, borderBottom:`1px solid ${cs.color}33`}}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{background:cs.color}}>{cs.id}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{color:cs.color, border:`1px solid ${cs.color}44`}}>{cs.tag}</span>
                    </div>
                    <div className="text-sm font-extrabold text-[#1e3a5f]">{cs.part}</div>
                    <div className="text-xs text-[#1e3a5f]">Customer: {cs.customer}</div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 rounded-lg" style={{background:`${cs.color}15`, color:cs.color, border:`1px solid ${cs.color}44`}}>{cs.status}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="p-3 rounded-lg" style={{background:'#fff5f5', border:'1px solid #fecaca'}}>
                    <div className="text-xs font-bold text-red-600 mb-1">⚠️ Problem</div>
                    <div className="text-xs text-red-900 leading-relaxed">{cs.problem}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{background:'#fffbeb', border:'1px solid #fde68a'}}>
                    <div className="text-xs font-bold text-yellow-300 mb-1">🔍 Root Cause</div>
                    <div className="text-xs text-yellow-100 leading-relaxed">{cs.cause}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{background:'#f0fdf4', border:'1px solid #bbf7d0'}}>
                    <div className="text-xs font-bold text-[#15803d] mb-1">💡 Lesson Learned</div>
                    <div className="text-xs text-green-200 leading-relaxed">{cs.lesson}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{background:'#eff6ff', border:'1px solid #bfdbfe'}}>
                    <div className="text-xs font-bold text-[#1d4ed8] mb-1">⭐ Best Practice</div>
                    <div className="text-xs text-[#1d4ed8] leading-relaxed">{cs.best}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TRAINING ════════════════════════════════════════════════════ */}
      {mainTab === 'training' && (
        <div className="animate-fadeIn p-6 bg-white min-h-screen max-w-6xl">
          <div className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-xl" style={{background:'#f1f5f9'}}>
            <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
            <a href="/downloads/control-plan/CP_Training_Guide.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#7c3aed'}}>Training Guide PDF</a>
            <a href="/downloads/control-plan/CP_Audit_Checklist.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#065f46'}}>Audit Checklist XLS</a>
            <a href="/downloads/control-plan/AIAG_Control_Plan_First_Edition.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-lg text-white text-xs font-bold no-underline" style={{background:'#1e40af'}}>AIAG CP Handbook</a>
          </div>
          <div className="text-xl font-extrabold mb-1" style={{color:'#065f46'}}>🎓 Control Plan Training Academy</div>
          <div className="text-xs text-[#1e3a5f] mb-5">Structured learning from Operator Awareness to CP Lead Auditor — build CP competency across all levels</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {[
              {level:'Level 1', title:'CP Awareness', role:'Operators / Technicians', color:'#059669', icon:'🌱', dur:'1.5 hours', topics:[
                'What is a Control Plan and how it affects your job',
                'How to read your relevant CP rows',
                'What to do when characteristic goes out of spec',
                'Reaction plan — your 5 steps to follow',
                'Why recording results is mandatory',
              ]},
              {level:'Level 2', title:'CP Practitioner', role:'Engineers / QA Staff', color:'#1e40af', icon:'⚙️', dur:'2 days', topics:[
                'AIAG First Edition — all 13 CP columns',
                'CC vs SC — identification and control requirements',
                'Writing good reaction plans (5-step format)',
                'Linking CP to PFD, PFMEA, and Work Instructions',
                'SPC integration with Control Plan',
              ]},
              {level:'Level 3', title:'CP Lead / Auditor', role:'Quality Head / Managers', color:'#7c3aed', icon:'🏆', dur:'2 days + exam', topics:[
                'IATF 16949 Clause 8.5.1 and 8.5.1.1 deep dive',
                'Three-way linkage audit: PFD-PFMEA-CP',
                'Customer-specific CP requirements (Ford, GM, Stellantis)',
                'Facilitating CP cross-functional review',
                'Auditing supplier Control Plans',
              ]},
            ].map(t=>(
              <div key={t.level} className="rounded-2xl overflow-hidden shadow-sm" style={{border:`2px solid ${t.color}33`}}>
                <div className="p-4" style={{background:t.color}}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <div className="text-xs font-bold" style={{color:'rgba(255,255,255,0.7)'}}>{t.level}</div>
                      <div className="text-sm font-extrabold text-white">{t.title}</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{color:'rgba(255,255,255,0.8)'}}>{t.role}</div>
                  <div className="text-xs mt-1" style={{color:'rgba(255,255,255,0.6)'}}>Duration: {t.dur}</div>
                </div>
                <div className="p-4 bg-white">
                  {t.topics.map((tp,i)=>(
                    <div key={i} className="overflow-x-auto flex gap-2 py-1.5 border-b border-[#dbeafe] text-xs text-[#1e3a5f]">
                      <span className="font-bold flex-shrink-0" style={{color:t.color}}>✓</span>{tp}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Competency Matrix */}
          <div className="bg-white border rounded-xl p-5 shadow-sm" style={{borderColor:'#e2e8f0'}}>
            <div className="text-sm font-bold mb-4" style={{color:'#065f46'}}>📊 CP Competency Matrix</div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{background:'#065f46'}}>
                  {['Role','13 CP Columns','CC/SC Control','Reaction Plans','PFD-PFMEA Link','IATF Audit','CP Review'].map(h=>(
                    <th key={h} className="p-2 text-left text-white font-bold border border-green-800">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Quality Head','L3','L3','L3','L3','L3','L3'],
                  ['Quality Manager','L3','L3','L3','L3','L2','L3'],
                  ['Quality Engineer','L2','L2','L2','L2','L1','L2'],
                  ['Mfg Engineer','L2','L2','L1','L2','L1','L1'],
                  ['Operator','L1','L1','L2','L1','—','—'],
                ].map((row,ri)=>(
                  <tr key={ri} style={{background: ri%2===0?'#f0fdf4':'#fff'}}>
                    {row.map((cell,ci)=>(
                      <td key={ci} className="p-2 border border-[#dbeafe] font-bold"
                        style={{color: cell==='L3'?'#7c3aed': cell==='L2'?'#1e40af': cell==='L1'?'#059669':'#9ca3af'}}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
      </>
  );
}
