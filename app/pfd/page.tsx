'use client'

import { useState, useRef } from 'react'
import PageTitle from '../components/PageTitle';
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

// --- Types -------------------------------------------------------------------

interface PFDHeader {
  partName: string
  partNumber: string
  modelYear: string
  customer: string
  coreTeam: string
  pfmeaRefNo: string
  controlPlanRefNo: string
  originalDate: string
  revisionDate: string
  revisionLevel: string
  preparedBy: string
  pageNumber: string
  supplierPlant: string
  supplierCode: string
}

type OpType = 'operation' | 'inspection' | 'transport' | 'storage' | 'delay' | 'rework'

interface PFDStep {
  id: string
  stepNo: string
  processName: string
  machineEquipment: string
  opType: OpType
  productChars: string
  processChars: string
  specialCharClass: string
  incomingMaterial: string
  comments: string
}

// --- Constants ----------------------------------------------------------------

const OP_TYPES: Record<OpType, { symbol: string; label: string; color: string; bg: string }> = {
  operation:  { symbol: '○',  label: 'Operation',  color: '#1d4ed8', bg: '#dbeafe' },
  inspection: { symbol: '□',  label: 'Inspection', color: '#15803d', bg: '#dcfce7' },
  transport:  { symbol: '→',  label: 'Transport',  color: '#b45309', bg: '#fef3c7' },
  storage:    { symbol: '▽',  label: 'Storage',    color: '#7c3aed', bg: '#ede9fe' },
  delay:      { symbol: 'D',  label: 'Delay',      color: '#dc2626', bg: '#fee2e2' },
  rework:     { symbol: '↩',  label: 'Rework',     color: '#475569', bg: '#f1f5f9' },
}

const SPECIAL_CHAR_OPTIONS = ['', '★ Safety Critical', 'SC – Safety Critical', 'CC – Critical Characteristic', 'KPC – Key Product Char', 'KCC – Key Control Char', 'SC – Significant Characteristic', 'None']

const FIELD_ALIASES: Record<keyof PFDStep, string[]> = {
  id: [],
  stepNo:          ['step', 'op no', 'operation no', 'seq', 'sequence', 'no', 'step no', 'op#'],
  processName:     ['process', 'operation', 'process name', 'operation name', 'description', 'process description'],
  machineEquipment:['machine', 'equipment', 'tool', 'device', 'machine/equipment', 'jig', 'fixture'],
  opType:          ['type', 'op type', 'operation type', 'symbol', 'process type'],
  productChars:    ['product char', 'product characteristics', 'product', 'product feature'],
  processChars:    ['process char', 'process characteristics', 'process parameter', 'parameter'],
  specialCharClass:['special char', 'special characteristic', 'classification', 'class', 'sc/cc'],
  incomingMaterial:['incoming', 'material', 'input', 'incoming material', 'raw material'],
  comments:        ['comments', 'notes', 'remark', 'remarks'],
}

const defaultHeader: PFDHeader = {
  partName: '', partNumber: '', modelYear: '', customer: '', coreTeam: '',
  pfmeaRefNo: '', controlPlanRefNo: '', originalDate: '', revisionDate: '',
  revisionLevel: '0', preparedBy: '', pageNumber: '1 of 1',
  supplierPlant: '', supplierCode: '',
}

let _id = 0
const uid = () => `step-${++_id}-${Date.now()}`

const makeStep = (no: number): PFDStep => ({
  id: uid(), stepNo: String(no), processName: '', machineEquipment: '',
  opType: 'operation', productChars: '', processChars: '',
  specialCharClass: '', incomingMaterial: '', comments: '',
})

// --- Column helpers -----------------------------------------------------------

function autoDetect(headers: string[]): Partial<Record<keyof PFDStep, number>> {
  const map: Partial<Record<keyof PFDStep, number>> = {}
  headers.forEach((h, i) => {
    const norm = h.toLowerCase().trim()
    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof PFDStep, string[]][]) {
      if (aliases.some(a => norm.includes(a))) {
        if (!(field in map)) map[field] = i
      }
    }
  })
  return map
}

// --- Component ----------------------------------------------------------------

export default function PFDPage() {
  const [tab, setTab] = useState<'manual' | 'upload'>('manual')
  const [header, setHeader] = useState<PFDHeader>(defaultHeader)
  const [steps, setSteps] = useState<PFDStep[]>([makeStep(10), makeStep(20), makeStep(30)])
  const [headerOpen, setHeaderOpen] = useState(true)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // -- Header helpers ----------------------------------------------------------

  const setH = (k: keyof PFDHeader, v: string) => setHeader(p => ({ ...p, [k]: v }))

  // -- Step helpers ------------------------------------------------------------

  const setStep = (id: string, k: keyof PFDStep, v: string) =>
    setSteps(p => p.map(s => s.id === id ? { ...s, [k]: v } : s))

  const addStep = () =>
    setSteps(p => {
      const last = p.length ? Number(p[p.length - 1].stepNo) || p.length * 10 : 0
      return [...p, makeStep(last + 10)]
    })

  const dupStep = (id: string) =>
    setSteps(p => {
      const idx = p.findIndex(s => s.id === id)
      if (idx < 0) return p
      const clone = { ...p[idx], id: uid() }
      const next = [...p]
      next.splice(idx + 1, 0, clone)
      return next
    })

  const delStep = (id: string) => setSteps(p => p.filter(s => s.id !== id))

  const moveStep = (id: string, dir: -1 | 1) =>
    setSteps(p => {
      const i = p.findIndex(s => s.id === id)
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n
    })

  // -- Upload ------------------------------------------------------------------

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadMsg('Reading file...')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
        if (rows.length < 2) { setUploadMsg('File has no data rows.'); return }
        const hdrs = rows[0].map(String)
        const colMap = autoDetect(hdrs)
        const imported: PFDStep[] = rows.slice(1)
          .filter(r => r.some(c => String(c).trim()))
          .map((r, i) => {
            const get = (k: keyof PFDStep) => colMap[k] !== undefined ? String(r[colMap[k] as number] ?? '').trim() : ''
            const rawType = get('opType').toLowerCase()
            const opType: OpType = rawType.includes('inspect') ? 'inspection'
              : rawType.includes('transport') || rawType.includes('move') ? 'transport'
              : rawType.includes('storage') || rawType.includes('store') ? 'storage'
              : rawType.includes('delay') ? 'delay'
              : rawType.includes('rework') || rawType.includes('repair') ? 'rework'
              : 'operation'
            return {
              id: uid(),
              stepNo: get('stepNo') || String((i + 1) * 10),
              processName: get('processName'),
              machineEquipment: get('machineEquipment'),
              opType,
              productChars: get('productChars'),
              processChars: get('processChars'),
              specialCharClass: get('specialCharClass'),
              incomingMaterial: get('incomingMaterial'),
              comments: get('comments'),
            }
          })
        setSteps(imported.length ? imported : [makeStep(10)])
        setTab('manual')
        setUploadMsg(`Imported ${imported.length} steps. Switch to Manual Entry tab to edit.`)
      } catch (err) {
        setUploadMsg(`Error reading file: ${err}`)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // -- Export ------------------------------------------------------------------

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'QMOS'
    wb.created = new Date()

    const ws = wb.addWorksheet('Process Flow Diagram', {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    })

    const BLUE   = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1E3A5F' } }
    const LBLUE  = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDBEAFE' } }
    const GREEN  = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF14532D' } }
    const LGRAY  = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF1F5F9' } }
    const WHITE  = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } }
    const thin   = { style: 'thin' as const, color: { argb: 'FF94A3B8' } }
    const border = { top: thin, left: thin, bottom: thin, right: thin }
    const center: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true }
    const left:   Partial<ExcelJS.Alignment> = { horizontal: 'left',   vertical: 'middle', wrapText: true }

    ws.mergeCells('A1:K1')
    const titleCell = ws.getCell('A1')
    titleCell.value = 'PROCESS FLOW DIAGRAM'
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = BLUE
    titleCell.alignment = center
    ws.getRow(1).height = 28

    const headerFields: [string, string, string, string][] = [
      ['Part Name:',          header.partName,            'Part Number:',          header.partNumber],
      ['Model Year/Vehicle:', header.modelYear,            'Customer:',             header.customer],
      ['Core Team:',          header.coreTeam,             'Supplier/Plant:',       header.supplierPlant],
      ['PFMEA Ref No:',       header.pfmeaRefNo,           'Supplier Code:',        header.supplierCode],
      ['Control Plan Ref:',   header.controlPlanRefNo,     'Revision Level:',       header.revisionLevel],
      ['Original Date:',      header.originalDate,         'Revision Date:',        header.revisionDate],
      ['Prepared By:',        header.preparedBy,           'Page Number:',          header.pageNumber],
    ]
    headerFields.forEach(([l1, v1, l2, v2], i) => {
      const row = i + 2
      ws.mergeCells(`A${row}:B${row}`)
      ws.mergeCells(`C${row}:E${row}`)
      ws.mergeCells(`F${row}:G${row}`)
      ws.mergeCells(`H${row}:K${row}`)
      const lc1 = ws.getCell(`A${row}`)
      lc1.value = l1; lc1.fill = LGRAY; lc1.font = { bold: true, size: 9 }; lc1.alignment = left; lc1.border = border
      const vc1 = ws.getCell(`C${row}`)
      vc1.value = v1; vc1.fill = WHITE; vc1.font = { size: 9 }; vc1.alignment = left; vc1.border = border
      const lc2 = ws.getCell(`F${row}`)
      lc2.value = l2; lc2.fill = LGRAY; lc2.font = { bold: true, size: 9 }; lc2.alignment = left; lc2.border = border
      const vc2 = ws.getCell(`H${row}`)
      vc2.value = v2; vc2.fill = WHITE; vc2.font = { size: 9 }; vc2.alignment = left; vc2.border = border
      ws.getRow(row).height = 16
    })

    const COL_HDRS = [
      'Step\nNo.', 'Process Name /\nOperation Description',
      'Machine / Equipment /\nTools / Jig', 'Op\nType', 'Symbol',
      'Product\nCharacteristics', 'Process\nCharacteristics',
      'Special\nChar Class', 'Incoming\nMaterial / Part',
      'Comments /\nRemarks', 'Flow',
    ]
    const colHdrRow = ws.getRow(10)
    COL_HDRS.forEach((h, i) => {
      const cell = colHdrRow.getCell(i + 1)
      cell.value = h
      cell.fill = GREEN
      cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } }
      cell.alignment = center
      cell.border = border
    })
    colHdrRow.height = 30

    steps.forEach((s, idx) => {
      const r = ws.getRow(11 + idx)
      r.height = 22
      const ot = OP_TYPES[s.opType]
      const vals = [
        s.stepNo, s.processName, s.machineEquipment,
        s.opType.toUpperCase(), ot.symbol,
        s.productChars, s.processChars, s.specialCharClass,
        s.incomingMaterial, s.comments,
        idx < steps.length - 1 ? 'v' : '[END]',
      ]
      vals.forEach((v, ci) => {
        const cell = r.getCell(ci + 1)
        cell.value = v
        cell.border = border
        cell.alignment = (ci === 0 || ci === 3 || ci === 4 || ci === 10) ? center : left
        cell.font = { size: 9 }
        if (ci === 4) {
          cell.font = { size: 14, bold: true, color: { argb: ot.color.replace('#', 'FF') } }
        }
        if (idx % 2 === 1) cell.fill = LBLUE
      })
    })

    ;[8, 30, 22, 10, 8, 20, 20, 14, 18, 22, 8].forEach((w, i) => {
      ws.getColumn(i + 1).width = w
    })

    const ws2 = wb.addWorksheet('Symbol Legend')
    ws2.mergeCells('A1:D1')
    const lt = ws2.getCell('A1')
    lt.value = 'PFD Symbol Legend'
    lt.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    lt.fill = BLUE
    lt.alignment = center
    ws2.getRow(1).height = 24

    const legendHdr = ws2.getRow(2)
    ;['Symbol', 'Type', 'AIAG Definition', 'When to Use'].forEach((h, i) => {
      const c = legendHdr.getCell(i + 1)
      c.value = h
      c.fill = GREEN
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      c.alignment = center
      c.border = border
    })
    ws2.getRow(2).height = 18

    const legendData = [
      ['○', 'Operation',  'Value-adding step that transforms a part or assembly',        'Machining, welding, assembly, painting, forming'],
      ['⚡', 'Inspection', 'Check or measurement of product quality / quantity',           'Dimensional check, visual inspection, gauging, testing'],
      ['→', 'Transport',  'Moving material from one location to another',                 'Conveyors, forklifts, hand carry between workstations'],
      ['▽', 'Storage',    'Planned, controlled inventory storage',                        'Raw material store, WIP store, finished goods'],
      ['D',  'Delay',      'Unplanned or necessary wait time',                             'Drying time, cure time, queue wait'],
      ['↩', 'Rework',    'Corrective action for non-conforming product',                  'Repair, regrind, touch-up, reprocessing'],
    ]
    legendData.forEach((row, i) => {
      const r = ws2.getRow(3 + i)
      r.height = 20
      row.forEach((v, ci) => {
        const c = r.getCell(ci + 1)
        c.value = v
        c.border = border
        c.alignment = ci === 0 ? center : left
        c.font = { size: 9 }
        if (ci === 0) c.font = { size: 14, bold: true }
        if (i % 2 === 1) c.fill = LBLUE
      })
    })
    ;[10, 16, 50, 40].forEach((w, i) => { ws2.getColumn(i + 1).width = w })

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PFD_${header.partNumber || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // -- Render ------------------------------------------------------------------

  const Input = ({
    value, onChange, placeholder, className = '',
  }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) => (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-[#dbeafe] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    />
  )

  return (
      <>
      <PageTitle title="Process Flow Diagram" />
      <div className="min-h-screen bg-[#eff6ff] p-4">
      <div className="max-w-full mx-auto">

        {/* Title bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Process Flow Diagram Generator</h1>
            <p className="text-xs text-[#1e3a5f] mt-0.5">
              AIAG APQP Reference Manual &bull; Visualize &amp; document your manufacturing process flow
            </p>
          </div>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
          >
            Export Excel
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white border border-[#dbeafe] rounded-lg p-1 w-fit shadow-sm flex-wrap">
          {([['manual', 'Manual Entry'], ['upload', 'Upload Existing']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                tab === k ? 'bg-blue-600 text-white shadow' : 'text-[#1e3a5f] hover:bg-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Upload Tab */}
        {tab === 'upload' && (
          <div className="animate-fadeIn bg-white rounded-xl border border-[#dbeafe] shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">📂</div>
            <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">Upload Existing PFD</h3>
            <p className="text-sm text-[#1e3a5f] mb-4">
              Supports Excel (.xlsx, .xls) files. Column headers are auto-detected by name.
            </p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow"
            >
              Choose File
            </button>
            {uploadMsg && (
              <p className={`mt-4 text-sm font-medium ${
                uploadMsg.startsWith('Imported') ? 'text-green-600' :
                uploadMsg.startsWith('Error')    ? 'text-red-600'   : 'text-[#1e3a5f]'
              }`}>
               {uploadMsg}
              </p>
            )}
            <div className="mt-6 border border-dashed border-[#dbeafe] rounded-lg p-4 text-left">
              <p className="text-xs font-semibold text-[#1e3a5f] mb-2">Expected columns (auto-detected):</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-[#1e3a5f]">
                {['Step No', 'Process Name', 'Machine/Equipment', 'Op Type', 'Product Characteristics',
                  'Process Characteristics', 'Special Char Class', 'Incoming Material', 'Comments'].map(c => (
                  <span key={c} className="bg-[#eff6ff] rounded px-2 py-0.5">&bull; {c}</span>
                ))}
              </div>
            </div>
          </div>
         )}

        {/* Manual Entry Tab */}
        {tab === 'manual' && (
          <div className="animate-fadeIn space-y-4">

            {/* Header */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm overflow-hidden">
              <button
                onClick={() => setHeaderOpen(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-700 text-white text-sm font-semibold"
              >
                <span>PFD Header Information</span>
                <span>{headerOpen ? '▲' : '▼'}</span>
              </button>
              {headerOpen && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    ['partName',         'Part Name'],
                    ['partNumber',       'Part Number'],
                    ['modelYear',        'Model Year / Vehicle'],
                    ['customer',         'Customer'],
                    ['coreTeam',         'Core Team'],
                    ['supplierPlant',    'Supplier / Plant'],
                    ['supplierCode',     'Supplier Code'],
                    ['pfmeaRefNo',       'PFMEA Reference No.'],
                    ['controlPlanRefNo', 'Control Plan Reference No.'],
                    ['revisionLevel',    'Revision Level'],
                    ['originalDate',     'Original Date'],
                    ['revisionDate',     'Revision Date'],
                    ['preparedBy',       'Prepared By'],
                    ['pageNumber',       'Page Number'],
                  ] as [keyof PFDHeader, string][]).map(([k, label]) => (
                    <div key={k}>
                      <label className="block text-xs text-[#1e3a5f] mb-0.5 font-medium">{label}</label>
                      <Input value={header[k]} onChange={v => setH(k, v)} placeholder={label} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Steps table */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-white text-[#1e3a5f] flex-wrap gap-y-2">
                <span className="text-sm font-semibold">Process Flow Steps ({steps.length})</span>
                <button
                  onClick={addStep}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition"
                >
                  + Add Step
                </button>
              </div>

              {/* Legend strip */}
              <div className="overflow-x-auto flex flex-wrap gap-3 px-4 py-2 bg-[#eff6ff] border-b border-[#dbeafe]">
                {(Object.entries(OP_TYPES) as [OpType, typeof OP_TYPES[OpType]][]).map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1 text-xs">
                    <span className="text-base font-bold" style={{ color: v.color }}>{v.symbol}</span>
                    <span className="text-[#1e3a5f]">{v.label}</span>
                  </span>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-green-800 text-white">
                      {[
                        'Flow', 'Step No.', 'Process Name / Operation Description',
                        'Machine / Equipment / Tools', 'Op Type',
                        'Product Characteristics', 'Process Characteristics',
                        'Special Char Class', 'Incoming Material', 'Comments', 'Actions',
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-2 py-2 border border-green-700 text-center font-semibold"
                          style={{
                            minWidth: i === 2 ? 180 : i === 3 ? 140 :
                              i === 5 || i === 6 ? 130 : i === 9 ? 110 : undefined,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map((s, idx) => {
                      const ot = OP_TYPES[s.opType]
                      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f0f9ff'
                      return (
                        <tr key={s.id} style={{ backgroundColor: rowBg }}>

                          {/* Flow */}
                          <td className="px-1 py-1 border border-[#dbeafe] text-center" style={{ width: 48 }}>
                            <div className="flex flex-col items-center gap-0.5">
                              {idx > 0 && (
                                <span className="text-[#1e3a5f] text-sm leading-none">↓</span>
                              )}
                              <span
                                className="text-lg font-bold leading-none"
                                style={{ color: ot.color }}
                              >
                                {ot.symbol}
                              </span>
                            </div>
                          </td>

                          {/* Step No */}
                          <td className="px-1 py-1 border border-[#dbeafe]" style={{ width: 60 }}>
                            <Input
                              value={s.stepNo}
                              onChange={v => setStep(s.id, 'stepNo', v)}
                              className="text-center font-mono"
                            />
                          </td>

                          {/* Process Name */}
                          <td className="px-1 py-1 border border-[#dbeafe]">
                            <Input
                              value={s.processName}
                              onChange={v => setStep(s.id, 'processName', v)}
                              placeholder="e.g. Drilling, Welding, CMM Inspection"
                            />
                          </td>

                          {/* Machine */}
                          <td className="px-1 py-1 border border-[#dbeafe]">
                            <Input
                              value={s.machineEquipment}
                              onChange={v => setStep(s.id, 'machineEquipment', v)}
                              placeholder="e.g. CNC-01, Vernier, CMM"
                            />
                          </td>

                          {/* Op Type */}
                          <td className="px-1 py-1 border border-[#dbeafe]" style={{ width: 112 }}>
                            <select
                              value={s.opType}
                              onChange={e => setStep(s.id, 'opType', e.target.value)}
                              className="w-full border border-[#dbeafe] rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                              style={{ backgroundColor: ot.bg, color: ot.color, fontWeight: 600 }}
                            >
                              {(Object.entries(OP_TYPES) as [OpType, typeof OP_TYPES[OpType]][]).map(([k, v]) => (
                                <option
                                  key={k}
                                  value={k}
                                  style={{ backgroundColor: v.bg, color: v.color }}
                                >
                                  {v.symbol} {v.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Product Chars */}
     0                    <td className="px-1 py-1 border border-[#dbeafe]">
                            <Input
                              value={s.productChars}
                              onChange={v => setStep(s.id, 'productChars', v)}
                              placeholder="e.g. Diameter, Hardness"
                            />
                          </td>

                          {/* Process Chars */}
                          <td className="px-1 py-1 border border-[#dbeafe]">
                            <Input
                              value={s.processChars}
                              onChange={v => setStep(s.id, 'processChars', v)}
                              placeholder="e.g. Feed rate, Temperature"
                            />
                          </td>

                          {/* Special Char */}
                          <td className="px-1 py-1 border border-[#dbeafe]" style={{ width: 120 }}>
                            <select
                              value={s.specialCharClass}
                              onChange={e => setStep(s.id, 'specialCharClass', e.target.value)}
                              className="w-full border border-[#dbeafe] rounded px-1 py-1 text-xs focus:outline-none"
                            >
                              {SPECIAL_CHAR_OPTIONS.map(o => (
                                <option key={o} value={o}>{o || '— None —'}</option>
                              ))}
                            </select>
                          </td>

                          {/* Incoming Material */}
                          <td className="px-1 py-1 border border-[#dbeafe]">
                            <Input
                              value={s.incomingMaterial}
                              onChange={v => setStep(s.id, 'incomingMaterial', v)}
                              placeholder="e.g. Raw bar stock, Sub-assembly A"
                            />
                          </td>

                          {/* Comments */}
                          <td className="px-1 py-1 border border-[#dbeafe]">
                            <Input
                              value={s.comments}
                              onChange={v => setStep(s.id, 'comments', v)}
                              placeholder="Notes / remarks"
                            />
                          </td>

                          {/* Actions */}
                          <td className="px-1 py-1 border border-[#dbeafe] text-center" style={{ width: 90 }}>
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={() => moveStep(s.id, -1)}
                                disabled={idx === 0}
                                title="Move up"
                                className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#1e3a5f]"
                              >▲</button>
                              <button
                                onClick={() => moveStep(s.id, 1)}
                                disabled={idx === steps.length - 1}
                                title="Move down"
                                className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#1e3a5f]"
                              >▼</button>
                              <button
                                onClick={() => dupStep(s.id)}
                                title="Duplicate"
                                className="p-1 rounded hover:bg-[#eff6ff] text-blue-500"
                              >⧉</button>
                              <button
                                onClick={() => delStep(s.id)}
                                title="Delete"
                                className="p-1 rounded hover:bg-red-50 text-red-500"
                              >✕</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-[#eff6ff] border-t border-[#dbeafe] flex items-center justify-between">
                <button
                  onClick={addStep}
                  className="text-blue-600 hover:text-blue-200 text-sm font-medium"
                >
                  + Add Process Step
                </button>
                <span className="text-xs text-[#1e3a5f]">
                  {steps.length} step{steps.length !== 1 ? 's' : ''} total
                </span>
              </div>
            </div>

            {/* Flow Summary */}
            <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
              <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3">Flow Summary</h3>
              <div className="flex flex-wrap items-center gap-1">
                {steps.map((s, idx) => {
                  const ot = OP_TYPES[s.opType]
                  return (
                    <div key={s.id} className="flex items-center gap-1">
                      <div
                        className="flex flex-col items-center rounded-lg border px-2 py-1 text-xs"
                        style={{ borderColor: ot.color, backgroundColor: ot.bg }}
                      >
                        <span className="font-bold text-base leading-none" style={{ color: ot.color }}>
                          {ot.symbol}
                        </span>
                        <span className="text-[#1e3a5f] max-w-[80px] truncate text-center mt-0.5">
                          {s.processName || `Step ${s.stepNo}`}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <span className="text-[#1e3a5f] font-bold">→</span>
                      )}
                    </div>
                  )
                })}
                {steps.length === 0 && (
                  <span className="text-[#1e3a5f] text-sm">No steps yet. Add steps above.</span>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
      </>
  )
}
