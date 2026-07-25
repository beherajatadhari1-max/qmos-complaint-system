'use client';
import { useState, useRef } from 'react';

type StepType = 'operation' | 'transportation' | 'packaging' | 'inspection';

interface PFDRow {
  id: string;
  isSection: boolean;
  sNo: string;
  description: string;
  incomingSov: string;
  type: StepType | '';
  productChar: string;
  processChar: string;
}

interface PFDHeader {
  item: string;
  processResp: string;
  modelYear: string;
  revLevel: string;
  preparedBy: string;
  coreTeam: string;
  docNo: string;
  dateOriginal: string;
  dateRevised: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultHeader: PFDHeader = {
  item: '', processResp: '', modelYear: '', revLevel: '',
  preparedBy: '', coreTeam: '', docNo: '',
  dateOriginal: new Date().toISOString().slice(0, 10),
  dateRevised: new Date().toISOString().slice(0, 10),
};

const defaultRows: PFDRow[] = [
  { id: uid(), isSection: true,  sNo: 'INCOMING', description: '', incomingSov: '', type: '', productChar: '', processChar: '' },
  { id: uid(), isSection: false, sNo: '10', description: 'Incoming Inspection', incomingSov: 'Supplier variation', type: 'inspection', productChar: 'Dimensions', processChar: 'Inspection method' },
  { id: uid(), isSection: true,  sNo: 'PROCESS', description: '', incomingSov: '', type: '', productChar: '', processChar: '' },
  { id: uid(), isSection: false, sNo: '20', description: 'Machining Operation', incomingSov: 'Tool wear, fixture variation', type: 'operation', productChar: 'Diameter, Length', processChar: 'Feed rate, Speed' },
  { id: uid(), isSection: false, sNo: '30', description: 'Transportation to Assembly', incomingSov: 'Handling damage', type: 'transportation', productChar: '', processChar: 'Packaging method' },
  { id: uid(), isSection: false, sNo: '40', description: 'Assembly', incomingSov: 'Component variation', type: 'operation', productChar: 'Torque, Gap', processChar: 'Assembly sequence' },
  { id: uid(), isSection: true,  sNo: 'OUTGOING', description: '', incomingSov: '', type: '', productChar: '', processChar: '' },
  { id: uid(), isSection: false, sNo: '50', description: 'Final Inspection', incomingSov: 'Measurement system variation', type: 'inspection', productChar: 'All CTQs', processChar: 'Gauge R&R' },
  { id: uid(), isSection: false, sNo: '60', description: 'Packaging & Dispatch', incomingSov: 'Damage in transit', type: 'packaging', productChar: '', processChar: 'Pack standard' },
];

export default function PFDPage() {
  const [header, setHeader] = useState<PFDHeader>(defaultHeader);
  const [rows, setRows] = useState<PFDRow[]>(defaultRows);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const dragIdx = useRef<number | null>(null);

  const setHdr = (k: keyof PFDHeader, v: string) => setHeader(h => ({ ...h, [k]: v }));

  const addRow = () => setRows(r => [...r, { id: uid(), isSection: false, sNo: '', description: '', incomingSov: '', type: '', productChar: '', processChar: '' }]);
  const addSection = () => setRows(r => [...r, { id: uid(), isSection: true, sNo: 'SECTION', description: '', incomingSov: '', type: '', productChar: '', processChar: '' }]);
  const delRow = (id: string) => setRows(r => r.filter(x => x.id !== id));
  const updRow = (id: string, k: keyof PFDRow, v: string | boolean) => setRows(r => r.map(x => x.id === id ? { ...x, [k]: v } : x));

  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDrop = (i: number) => {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const arr = [...rows];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, moved);
    setRows(arr);
    dragIdx.current = null;
  };

  const saveDB = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pfd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ header, rows }) });
      if (res.ok) setMsg('Saved to QMOS database');
      else setMsg('Save failed');
    } catch { setMsg('Save error'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const exportExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const headerBlock = [
      ['PROCESS FLOW DIAGRAM', '', '', '', '', '', '', '', ''],
      ['Item / Part:', header.item, '', 'Process Responsibility:', header.processResp, '', 'Model Year:', header.modelYear, ''],
      ['Doc No:', header.docNo, '', 'Prepared By:', header.preparedBy, '', 'Rev Level:', header.revLevel, ''],
      ['Core Team:', header.coreTeam, '', 'Date (Original):', header.dateOriginal, '', 'Date (Revised):', header.dateRevised, ''],
      [],
      ['S.No.', 'Operation Description', 'Incoming Sources of Variation', 'Operation', 'Transportation', 'Packaging', 'Inspection', 'Product Characteristics', 'Process Characteristics'],
    ];
    const dataRows = rows.map(r => r.isSection
      ? [r.sNo, '', '', '', '', '', '', '', '']
      : [r.sNo, r.description, r.incomingSov,
         r.type === 'operation' ? 'X' : '',
         r.type === 'transportation' ? 'X' : '',
         r.type === 'packaging' ? 'X' : '',
         r.type === 'inspection' ? 'X' : '',
         r.productChar, r.processChar]
    );
    const ws = xlsx.utils.aoa_to_sheet([...headerBlock, ...dataRows]);
    ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 28 }];
    xlsx.utils.book_append_sheet(wb, ws, 'PFD');
    xlsx.writeFile(wb, `PFD_${header.item || 'export'}_${header.revLevel || 'R0'}.xlsx`);
  };

  const typeIcon = { operation: '⚙', transportation: '⇒', packaging: '▽', inspection: '□' };

  return (
    <div className="p-4 min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Process Flow Diagram (PFD)</h1>
          <p className="text-gray-400 text-sm">AIAG APQP Standard Format</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addSection} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">+ Section</button>
          <button onClick={addRow} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm">+ Row</button>
          <button onClick={exportExcel} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm">⬇ Excel</button>
          <button onClick={saveDB} disabled={saving} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-sm disabled:opacity-50">
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>
      {msg && <div className="mb-3 px-3 py-2 bg-green-800 text-green-200 rounded text-sm">{msg}</div>}

      <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Document Header</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {([
            ['item','Item / Part Number'],['processResp','Process Responsibility'],['modelYear','Model Year / Vehicle'],
            ['docNo','Document No.'],['preparedBy','Prepared By'],['revLevel','Rev Level'],
            ['coreTeam','Core Team'],['dateOriginal','Date (Original)'],['dateRevised','Date (Revised)'],
          ] as [keyof PFDHeader, string][]).map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type={k.startsWith('date') ? 'date' : 'text'}
                value={header[k]}
                onChange={e => setHdr(k, e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="px-2 py-2 border border-gray-600 w-8"></th>
              <th className="px-2 py-2 border border-gray-600 w-16 text-left">S.No.</th>
              <th className="px-2 py-2 border border-gray-600 text-left w-52">Operation Description</th>
              <th className="px-2 py-2 border border-gray-600 text-left w-52">Incoming Sources of Variation</th>
              <th className="px-2 py-2 border border-gray-600 w-16 text-center">⚙ Oper.</th>
              <th className="px-2 py-2 border border-gray-600 w-16 text-center">⇒ Trans.</th>
              <th className="px-2 py-2 border border-gray-600 w-16 text-center">▽ Pack.</th>
              <th className="px-2 py-2 border border-gray-600 w-16 text-center">□ Insp.</th>
              <th className="px-2 py-2 border border-gray-600 text-left">Product Characteristics</th>
              <th className="px-2 py-2 border border-gray-600 text-left">Process Characteristics</th>
              <th className="px-2 py-2 border border-gray-600 w-10">Del</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className={row.isSection ? 'bg-gray-800' : 'bg-gray-900 hover:bg-gray-850'}
              >
                {row.isSection ? (
                  <>
                    <td className="border border-gray-700 px-1 text-center text-gray-500 cursor-grab">⠿</td>
                    <td colSpan={9} className="border border-gray-700 px-2 py-1">
                      <input
                        value={row.sNo}
                        onChange={e => updRow(row.id, 'sNo', e.target.value)}
                        className="bg-transparent w-full font-bold text-yellow-300 uppercase tracking-widest text-xs focus:outline-none"
                        placeholder="SECTION TITLE"
                      />
                    </td>
                    <td className="border border-gray-700 px-1 text-center">
                      <button onClick={() => delRow(row.id)} className="text-red-500 hover:text-red-300 text-xs">✕</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-700 px-1 text-center text-gray-500 cursor-grab text-base">⠿</td>
                    <td className="border border-gray-700 px-1">
                      <input value={row.sNo} onChange={e => updRow(row.id, 'sNo', e.target.value)}
                        className="bg-transparent w-full text-center focus:outline-none text-gray-200" placeholder="10" />
                    </td>
                    <td className="border border-gray-700 px-1">
                      <input value={row.description} onChange={e => updRow(row.id, 'description', e.target.value)}
                        className="bg-transparent w-full focus:outline-none text-gray-200" placeholder="Operation description…" />
                    </td>
                    <td className="border border-gray-700 px-1">
                      <input value={row.incomingSov} onChange={e => updRow(row.id, 'incomingSov', e.target.value)}
                        className="bg-transparent w-full focus:outline-none text-gray-200" placeholder="Sources of variation…" />
                    </td>
                    {(['operation','transportation','packaging','inspection'] as StepType[]).map(t => (
                      <td key={t} className="border border-gray-700 text-center">
                        <input type="radio" name={`type-${row.id}`} checked={row.type === t}
                          onChange={() => updRow(row.id, 'type', t)}
                          className="accent-blue-400 w-4 h-4 cursor-pointer" />
                      </td>
                    ))}
                    <td className="border border-gray-700 px-1">
                      <input value={row.productChar} onChange={e => updRow(row.id, 'productChar', e.target.value)}
                        className="bg-transparent w-full focus:outline-none text-gray-200" placeholder="Product char…" />
                    </td>
                    <td className="border border-gray-700 px-1">
                      <input value={row.processChar} onChange={e => updRow(row.id, 'processChar', e.target.value)}
                        className="bg-transparent w-full focus:outline-none text-gray-200" placeholder="Process char…" />
                    </td>
                    <td className="border border-gray-700 px-1 text-center">
                      <button onClick={() => delRow(row.id)} className="text-red-500 hover:text-red-300">✕</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>⠿ Drag rows to reorder</span>
        {Object.entries(typeIcon).map(([k, v]) => (
          <span key={k}>{v} = {k.charAt(0).toUpperCase() + k.slice(1)}</span>
        ))}
      </div>
    </div>
  );
}
